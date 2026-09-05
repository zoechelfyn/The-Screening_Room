# Setting up the local stack

Local-only phase: everything runs on the RTX Pro (Blackwell, 96GB) box.
The Mac (M5, 128GB) joins later — see the last section; nothing in the code
changes when it does, only `config.toml`.

## 0. Before anything: the no-server workflow works today

`run_chain.py run <SPECIES> <chain> --dry-run` prints the full prompt.
Paste it into any chat UI, save the JSON reply into
`canon/<SPECIES>/inbox/<chain>-manual.json` as
`{"chain": "...", "species": "...", "parsed": <the JSON>}`, and approve it.
Stage 1 does not wait for infrastructure.

## 1. vLLM on the RTX box

**Follow `INSTALL-WSL.md`** — a phased, checkpoint-gated walkthrough
(Windows driver → WSL2 → Docker GPU → tiny-model smoke test → the real
model), with a symptom→phase debug map. `check_llm.py --role deep`
verifies any configured role end-to-end. Summary of what it lands on:

```bash
# inside WSL2 / Linux
pip install vllm   # or: docker run --gpus all vllm/vllm-openai:latest ...

# Tier 1/2 (deep + ideation share one server for now):
vllm serve QUASAR-QAT/Qwen3.8-27B-QUASAR-NVFP4 \
  --port 8000 \
  --gpu-memory-utilization 0.45 \
  --enable-prefix-caching

# Tier 3 dispatcher (until it moves to the Mac):
vllm serve Qwen/Qwen3-8B --port 8001 --gpu-memory-utilization 0.10
```

Notes:
- **NVFP4 needs Blackwell** — the format runs on FP4 tensor cores; on older
  GPUs vLLM would fall back or refuse. On this card it's the right choice:
  ~15GB of weights, QAT-preserved quality, huge KV headroom.
- `--gpu-memory-utilization` is the co-residency contract: the caps above
  leave roughly half the card for ComfyUI (image + small video) in ideation
  mode. Tune by watching `nvidia-smi` during a real session.
- `--enable-prefix-caching` is load-bearing for us: every chain call is
  [stable canon prefix + small tail], so repeat calls skip the prefill.
- Sanity check the model card's claimed context length and license on the
  HF page before settling in (this repo's session couldn't fetch it —
  network policy — so the card's specifics are unverified here).

## 2. Wire it up

Edit `config.toml` if your ports differ, then:

```bash
python3 run_chain.py run OCE-CAR-BOM spaceship --role deep
# review canon/OCE-CAR-BOM/inbox/spaceship-<stamp>.json  (raw reasoning + parsed JSON)
python3 run_chain.py approve OCE-CAR-BOM inbox/spaceship-<stamp>.json
python3 ledger.py show OCE-CAR-BOM
```

The runner asks for reasoning THEN a JSON block and parses the trailing
JSON. Strict schema enforcement (vLLM `guided_json` / GBNF) arrives with
the Stage 2 orchestrator, which splits reason and emit into two calls —
don't bolt it on here, it would delete the visible reasoning.

## 3. ComfyUI (Stage 3 — not yet)

Standard install on the same box; the orchestrator will drive it via the
HTTP/websocket API using workflow JSON files stored in this repo. Nothing
to do now beyond not being surprised it's absent.

## 4. When the Mac joins

- Engine: **llama.cpp server** (or MLX) — vLLM does not run on Apple
  Silicon. Same OpenAI-compatible API; grammar (GBNF) covers structured
  output.
- Roles that move: `deep` (a big MoE fits comfortably in 128GB) and
  `dispatch` (+ Whisper for the voice input path).
- The one discipline that matters there: keep prompts as one stable prefix
  + small tail, and run the server with prompt caching on — prefill is
  Apple Silicon's weak point and the cache is the antidote.
- Total change to this repo: endpoint/model/engine lines in `config.toml`.
