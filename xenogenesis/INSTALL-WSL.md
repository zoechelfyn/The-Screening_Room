# WSL2 + Docker + vLLM + Qwen: the checkpoint install

The whole trick to an error-free install is: **never start a step until the
previous checkpoint passes, and prove the stack on a tiny model before the
big download.** Each phase below ends with a test. If a test fails, the
fault is in that phase — not three layers down.

Why Docker rather than pip-installing vLLM: the `vllm/vllm-openai` image
ships matched CUDA + PyTorch + vLLM builds. On brand-new silicon
(Blackwell) that match is exactly what goes wrong with pip. The container
route removes the whole class of error.

---

## Phase 0 — Windows prerequisites

1. Install/update the **NVIDIA Windows driver** (Game Ready or Studio,
   latest). This is the ONLY driver you ever install — **never** install a
   Linux NVIDIA driver inside WSL; the Windows driver is passed through.
2. In an **admin** PowerShell:
   ```powershell
   wsl --install -d Ubuntu-24.04
   wsl --update
   ```
   Reboot if asked. Create your Linux user when Ubuntu first opens.
3. Create/edit `C:\Users\<you>\.wslconfig` so WSL gets enough RAM for
   model loading (it defaults to half your RAM):
   ```ini
   [wsl2]
   memory=48GB
   swap=16GB
   ```
   Then `wsl --shutdown` and reopen Ubuntu.

**CHECKPOINT 0** — inside Ubuntu:
```bash
nvidia-smi
```
You must see the RTX Pro 6000 and the Windows driver version. If not, stop
here: update the Windows driver and `wsl --update`. Nothing downstream can
work until this shows the card.

---

## Phase 1 — Docker with GPU access

Option A (recommended for a Windows-first machine): **Docker Desktop**,
with Settings → General → "Use the WSL 2 based engine" on, and your Ubuntu
distro enabled under Resources → WSL Integration. GPU support is built in.

Option B (no Docker Desktop): install `docker-ce` inside Ubuntu plus the
**NVIDIA Container Toolkit** per NVIDIA's docs.

**CHECKPOINT 1** — inside Ubuntu:
```bash
docker run --rm --gpus all nvidia/cuda:12.8.0-base-ubuntu24.04 nvidia-smi
```
Same GPU listing, but printed from inside a container. If this fails with
"could not select device driver": Docker Desktop WSL integration is off,
or (Option B) the container toolkit isn't installed.

---

## Phase 2 — Prove vLLM end-to-end on a TINY model

Do not start with the 27B. Prove the entire serving path with a model that
downloads in under a minute:

```bash
mkdir -p ~/models/hf-cache

docker run --rm --gpus all \
  -e VLLM_WSL2_ENABLE_PIN_MEMORY=1 \
  -v ~/models/hf-cache:/root/.cache/huggingface \
  -p 8000:8000 \
  vllm/vllm-openai:latest \
  --model Qwen/Qwen3-0.6B \
  --gpu-memory-utilization 0.20
```

`VLLM_WSL2_ENABLE_PIN_MEMORY=1` is required on WSL2: vLLM's V2 model
runner needs UVA/pinned memory, which WSL2's CUDA layer doesn't provide
by default (`RuntimeError: UVA is not available` at startup, hit on this
machine 2026-09-06). If the error persists even with it, fall back to
`-e VLLM_USE_V2_MODEL_RUNNER=0` (V1 runner) instead. Carry whichever
flag works into every later `docker run`.

Notes:
- Keep the HF cache **inside the WSL filesystem** (`~/models/...`), never
  on `/mnt/c/...` — the Windows-mount path is drastically slower and is a
  classic silent misery.
- `latest` matters on Blackwell: if you ever see
  `no kernel image is available for execution on the device`, the image
  is too old for the card — `docker pull vllm/vllm-openai:latest`.

**CHECKPOINT 2** — from ANOTHER Ubuntu terminal (or Windows — localhost
forwards automatically):
```bash
curl -s http://localhost:8000/v1/models
curl -s http://localhost:8000/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"Qwen/Qwen3-0.6B","messages":[{"role":"user","content":"Say ready."}],"max_tokens":10}'
```
Or, from the repo (reads config.toml, so temporarily set the deep role's
model to `Qwen/Qwen3-0.6B`):
```bash
python3 check_llm.py --role deep
```
A sentence comes back → the entire Windows→WSL→Docker→GPU→vLLM→HTTP path
works. Every later problem is now just "model or flags", never "stack".

---

## Phase 3 — The real model

```bash
docker run -d --name qwen-deep --restart unless-stopped --gpus all \
  -e VLLM_WSL2_ENABLE_PIN_MEMORY=1 \
  -v ~/models/hf-cache:/root/.cache/huggingface \
  -p 8000:8000 \
  vllm/vllm-openai:latest \
  --model QUASAR-QAT/Qwen3.8-27B-QUASAR-NVFP4 \
  --gpu-memory-utilization 0.45 \
  --enable-prefix-caching \
  --max-num-seqs 16
```

`--max-num-seqs 16` matters: vLLM defaults to 1024 concurrent request
slots (datacenter-scale), and this hybrid-Mamba architecture needs one
cache block per slot — more than the 0.45 budget holds
(`max_num_seqs (1024) exceeds available Mamba cache blocks`, hit
2026-09-06). 16 is generous for a single-user machine.

- `-d --restart unless-stopped` makes it a service: it survives closing
  the terminal and comes back after reboots (once Docker itself is up).
- Watch the (long, one-time) download and load with
  `docker logs -f qwen-deep`; it's ready at "Uvicorn running".
- If the HF repo is gated, add `-e HUGGING_FACE_HUB_TOKEN=hf_...`.
- First run of a new model: skim the HF card's context-length and chat
  template notes — if the card specifies a `--max-model-len`, set it.

**CHECKPOINT 3**:
```bash
python3 check_llm.py --role deep        # config.toml already names this model
```

Then the real thing:
```bash
python3 run_chain.py run OCE-CAR-BOM spaceship --role deep
```

---

## Phase 4 — The dispatcher (second, small server)

Same pattern, second container, second port (matches `config.toml`):
```bash
docker run -d --name qwen-dispatch --restart unless-stopped --gpus all \
  -e VLLM_WSL2_ENABLE_PIN_MEMORY=1 \
  -v ~/models/hf-cache:/root/.cache/huggingface \
  -p 8001:8000 \
  vllm/vllm-openai:latest \
  --model Qwen/Qwen3-8B \
  --gpu-memory-utilization 0.10
```
**CHECKPOINT 4**: `python3 check_llm.py --role dispatch`

---

## Debug map (symptom → phase)

| Symptom | It's phase... |
|---|---|
| `nvidia-smi` not found / no GPU in Ubuntu | 0 — Windows driver / `wsl --update` |
| `could not select device driver "nvidia"` | 1 — Docker GPU integration |
| `no kernel image is available` | 2 — image too old for Blackwell; pull `latest` |
| `RuntimeError: UVA is not available` | 2 — WSL2 + V2 runner; add `-e VLLM_WSL2_ENABLE_PIN_MEMORY=1` (fallback: `-e VLLM_USE_V2_MODEL_RUNNER=0`) |
| `max_num_seqs (...) exceeds available Mamba cache blocks` | 3 — datacenter default; add `--max-num-seqs 16` |
| Download crawls / load takes forever | 2 — HF cache on `/mnt/c`; move into WSL fs |
| Container OOM-killed while loading | 0 — raise `memory=` in `.wslconfig` |
| CUDA OOM at startup | 3 — lower `--gpu-memory-utilization` or `--max-model-len` |
| Works in WSL, refused from Windows | usually transient — retry; else `wsl --shutdown` once |
| Mac (later) can't reach it | needs mirrored networking (`networkingMode=mirrored` in `.wslconfig`, Win11) or a `netsh` portproxy — a later problem, on purpose |

Total new decisions required along the way: zero. It's checkpoints all the
way down.
