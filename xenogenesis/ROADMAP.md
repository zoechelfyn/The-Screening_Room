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
- **Dream mode** (Stage 3, alongside the UI): while ideation runs, a
  turbo-class image model (1–4 step distilled; sub-second at sketch
  resolution) refreshes the easel continuously, steered by a small
  "dream director" LLM (the dispatch model) watching the transcript tail
  + ledger. It drives a **prompt loom** — a persistent slot structure
  (subject / action / environment / mood / palette / camera) whose slots
  hold atoms drawn from three pools: canon hooks (stable), recent
  conversation (ephemeral), and a matrix-hook drift pool (serendipity).
  The director emits atom-swap JSON diffs, never prose, so it keeps pace
  with speech; a drift knob sets how far dreams may stray from what was
  just said. Dreams are ephemeral and recorded nowhere — unless **pinned**,
  which promotes one to a real asset with its loom state (seed, atoms,
  sources) attached: reproducible, fact-traceable, and a seed brief for a
  proper render. Unanchored flavor before a species has an approved
  reference sheet (drifting looks is the point), anchored
  (reference-conditioned) after. System-wide rule adopted with it:
  **prompts are structured atom assemblies everywhere; strings are
  rendered at the last moment** — the loom state is the asset-order
  prompt payload.

- **Self-skinning UI** (Stage 3.5, after the UI and dream mode's loom
  exist): a "skin from this" button on any image re-themes the whole
  interface to match it. Because we author the UI, region masks are
  exported from the layout itself — ground truth, no segmentation model.
  Grade A (default): a fixed ComfyUI workflow generates a *theme plate*
  matching the mask template; a token extractor samples it into a CSS
  variables file + tileable textures — instant to apply, reversible, and
  text is never generated so legibility can't melt. Grade B (hero
  elements only): nine-slice panel frames and ornaments generated through
  the masks. Theme prompt = source image + the species' aesthetic atoms
  from the ledger. Skins are assets with full provenance (prompt, source,
  seed, palette), living in the asset browser as a library; a species can
  carry an official skin in canon. Hard guardrail: the extractor
  auto-nudges tokens until text contrast passes — themes own chrome,
  never legibility.

- **"Create LoRA from this"** (Stage 4, needs asset browser + reference
  workflow): one button promotes a look into visual canon by training a
  LoRA. The button's real job is dataset assembly: gather the species'
  approved assets, expand variety via the reference-conditioned workflow
  (turnarounds, lighting, context), then let the multimodal deep model
  cull off-model variants and write captions — captioning rule encoded in
  the prompt: describe what should stay VARIABLE (pose, light,
  background), omit what should be LEARNED (the subject). Dialog: time
  estimate, suggested trigger word (derived from species code, checked
  unique in a planetverse registry), scope, notify-when-done; job runs in
  the render/overnight queue. On completion the trigger + LoRA reference
  are written to the ledger and the prompt loom auto-injects them into
  every future asset order for that species — dream mode starts dreaming
  on-model with no user action. Planetverse strategy: a composable stack,
  not a pile — universe *style* LoRA (low strength, best pinned art),
  per-planet *world* LoRA (trained creature-free), per-species *subject*
  LoRA (trained on neutral backgrounds), separate trigger namespaces.
  LoRAs are assets with dataset manifest + fact provenance: retconned
  facts stale the training images, which stale the LoRA, which offers a
  retrain.

## The flagship application (private — Chelfyn's, not part of any giveaway)

**The Great Unknowing**: a ship built from the stern over hundreds of
races' additions — newest grafts at the bow and outer skin, oldest at the
core — an archaeological stratigraphy you can walk. The species pipeline
is its supply chain; capture of a species ends with feeding the ship:

- **Ship registry** in the universe ledger: each hull section is
  `{species, era-of-joining, position, neighbors}` — the accretion
  history as data. Later races route infrastructure through earlier
  races' sections; anachronism is canon.
- **`shipwright` chain** (fixed methodology, runs after canonization +
  subject LoRA): derives a species' construction language — corridor
  cross-section from body plan, materials and wear behavior, lighting,
  door/junction conventions, prop vocabulary, exterior expression on the
  hull silhouette.
- **Construction kits** as the deliverable: tileable PBR corridor texture
  sets (albedo generated, normal/roughness derived), trim sheets, prop
  and greeble sheets, modular corridor/junction segments (image-to-3D at
  Stage 4), all generated under the species LoRA. Engine-agnostic —
  feeds game-engine level construction and virtual-production/filming
  sets alike.
- **Junctions are first-class**: the seam between two species' sections
  is generated from the PAIR of ledgers (atmosphere/gravity/door-logic
  translation; the relationship's history shapes the weld).
- **Age is a parameter**: wear level per section driven by
  era-of-joining — core kits render palimpsested and repaired, the newest
  skin renders fresh. One knob from the registry.

## What to resist

- Don't build the orchestrator before the chains prove out by hand (Stage 1
  is genuinely load-bearing, not a warm-up).
- Don't let the small model improvise — if its output ever surprises you,
  that job belonged to the big model.
- Don't generate 3D early. Images are cheap to regret; meshes aren't.
- Don't skip the critic pass to save tokens. You have the compute; spend it
  on consistency, which is the thing audiences actually notice.
