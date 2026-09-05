# The Worldbuilding Machine — staging plan

Goal: base conditions in → believable looks, technologies, histories, and
visual assets out, with a big local LLM (Grace Blackwell / RTX Pro 6000 class,
large-context Qwen) doing first-principles derivation, a small model doing
mechanical expansion, ComfyUI doing images/3D, and the human as the taste
gate at fixed points — not as a bottleneck inside every loop.

## Two architectural commitments, made now

These cost nothing today and everything to retrofit later:

**1. The canon store is the spine.** One directory per species
(`canon/<SPECIES-CODE>/`), containing the trait vector, every approved
derivation, and references to approved images. Every stage below is a pure
function: *canon in → new canon section out*. Nothing generates "from
imagination"; everything generates from canon. This is what stops an infinite
machine becoming an amnesiac or a self-contradicting one, and git versions it
for free.

**2. Derivation chains are data, not vibes.** A chain (see `chains/`) is a
markdown template with:
- **reads**: which canon fields it consumes,
- **scaffold**: an ordered list of first-principles questions the big model
  must answer *in order, showing its reasoning* (gravity well → launch
  economics → propulsion ranking → hull form → interior ergonomics...),
- **emits**: a strict JSON schema for the answer.

New capability = new chain file, zero new code. The chain library becomes the
machine's real IP; the orchestrator stays dumb.

## Stages — each one usable on its own

### Stage 1 — Chains by hand (this week's scale)
Run `generate.py`, paste the trait vector + a chain template into the big
Qwen manually, save the JSON output into the canon directory yourself.
- Deliverables: `canon/` layout, 2–3 chain templates (spaceship is written;
  add `architecture`, `propulsion` or fold it into spaceship, `first_contact`).
- Purpose: debug the *chain scaffolds* — the prompts are the hard part, and
  you want to iterate on them with zero plumbing in the way.
- Exit test: two different species run through the spaceship chain produce
  ships that could not be swapped without noticing.

### Stage 2 — The orchestrator
A Python script that walks a DAG of chains for a species, calls the local
LLM over an OpenAI-compatible endpoint (vLLM / llama.cpp server), validates
every output against the chain's JSON schema, and writes canon.
- **Use grammar-constrained / guided decoding** (vLLM `guided_json`,
  llama.cpp GBNF) so the model *cannot* emit malformed JSON. This is the
  single highest-value reliability trick for the whole machine.
- **Critic pass**: after each chain, a second call — same big model, critic
  prompt — checks the output against the full canon for contradictions and
  returns a violation list; regenerate on violations, escalate to human after
  two failures. Cheap, and it's what makes long chains trustworthy.
- With ~100k+ context, stuff the *entire* canon file into every call. No RAG,
  no summarising, until a species' canon actually outgrows the window.
- Human gates (deliberate, fixed): approve the teaser → approve the dossier →
  approve each derivation batch. Between gates, the machine runs free.

### Stage 3 — The automation handover + ComfyUI
The big model never hands *prose* to the small model. It emits **asset
orders**: typed JSON (`schemas/asset_order.json` when we get there) naming a
ComfyUI workflow, filled prompt slots, the species style anchor, negative
prompt, seed, and reference-image IDs. The small model's only jobs are slot
expansion and caption/variant churn — mechanical work, no creative authority.
- Drive ComfyUI via its HTTP/websocket API (workflows are JSON graphs; the
  orchestrator queues them like any other job).
- **Reference sheet first**: for each species, the first image job is a
  canonical turnaround/portrait sheet, human-approved, stored in canon. All
  later assets condition on it (IPAdapter / reference nets). This is how
  image #40 of a species still looks like image #1.
- Google Flow doesn't disappear: it stays your creative cockpit for hero
  images; the machine mass-produces the coverage shots and hands Flow
  perfectly-formed prompts when you want to drive manually.

### Stage 4 — The library
Batch mode (roll 50, auto-run chains on the survivors of your teaser cull),
image-to-3D on approved designs (TripoSR / Hunyuan3D class — deliberately
last, the tools are moving fast and nothing upstream depends on them), and a
browsable front end for the catalogue. It's not lost on me that this repo is
called The Screening Room — the catalogue wants a screen eventually.

## Decisions since first draft (2026-09-05 session)

- **Ledger schema is live** (`ledger.py`): single-sentence facts with
  provenance tiers (`wellspring` > `chelfyn` > `accepted-riff` >
  `machine-derived` — higher never yields to lower), status, `depends_on`
  (retcons cascade to dependents as REVIEW flags), tags, plus open
  questions, a retcon log, and a shared `universe` ledger for
  cross-species facts. Wellspring-tier entries are entered by Chelfyn only.
- **Tiers are roles in `config.toml`, not code**: `deep` (chains, critic,
  overnight queue), `ideation` (the live back-and-forth), `dispatch`
  (small/fast: prompt translation, slot filling, job running). Session
  modes (ideation / render / deep) are orchestrator presets that start and
  stop services; big video models get render mode to themselves, a small
  fast video model stays resident for motion sketches.
- **Hardware plan**: local-only first — everything on the RTX Pro
  (Blackwell 96GB) via vLLM under WSL2, with `gpu-memory-utilization` caps
  as the co-residency contract and prefix caching on. Prepared-for split:
  the M5 Mac (128GB) later takes `deep` + `dispatch` + Whisper via
  llama.cpp/MLX (vLLM doesn't run on Apple Silicon); its prefill weakness
  is absorbed by stable-prefix prompts + prompt cache.
- **Default tier-1/2 model**: `QUASAR-QAT/Qwen3.8-27B-QUASAR-NVFP4` —
  NVFP4 runs natively on Blackwell tensor cores (~15GB weights), and QAT
  keeps 4-bit quality honest. It's one config line if the bench disagrees.
- **The riff loop is the primary interface** (Stage 3 UI): chat is the
  ledger's editor; model replies carry proposed facts as accept-chips, one
  tap commits with provenance `accepted-riff`. Panes: chat, easel (current
  visualization), asset browser, ledger inspector. Every generated asset
  records which facts it depended on, so retcons mark images stale.
- **Hard vetoes are doorbells**: a zero-weight combination may not pass
  silently — it rerolls, or triggers a justify-the-impossibility
  conversation (see `canon/OCE-CAR-BOM` for what that produces).

## What to resist

- Don't build the orchestrator before the chains prove out by hand (Stage 1
  is genuinely load-bearing, not a warm-up).
- Don't let the small model improvise — if its output ever surprises you,
  that job belonged to the big model.
- Don't generate 3D early. Images are cheap to regret; meshes aren't.
- Don't skip the critic pass to save tokens. You have the compute; spend it
  on consistency, which is the thing audiences actually notice.
