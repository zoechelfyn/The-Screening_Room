# Xenogenesis — an infinite alien race generator

A trait matrix plus a seeded roller that turns "ocean planet, silicon, everything
turns to crab" into coherent species vectors, ready-to-paste Google Flow image
prompts, and a briefing prompt for a local LLM to expand into a full dossier.

## The core design decision: tiers, not a flat grid

A naive matrix rolls every axis independently and produces mush ("energy being
with fur, descended from crabs, obsessed with metallurgy... underwater"). Here
the axes are **causal tiers rolled in order** — world → biochemistry → lineage →
body plan → senses → age → society → technology → history → values → aesthetics
→ wildcard — and earlier picks reweight later ones through tags and affinity
multipliers in `matrix.json`:

- An **ocean world** or **gas giant** tags itself `no_fire`, which nearly
  forbids forged-metal technology and boosts grown biotech (no smelting where
  nothing burns).
- **Gas giants** boost floater body plans and forbid burrowers (`no_ground`).
- **Silicon life** is boosted on hot/arid/volcanic worlds and suppressed underwater.
- **Carcinization** is more likely for aquatic and soft-bodied lineages —
  the crab shape wins where the crab shape evolved.
- A multiplier of `0` is a hard veto; anything else just tilts the odds.

Rarity is built in: carbon/water life is common, energy beings are rare, and
the wildcard twist axis lands "none" most of the time — so most races are
grounded and the weird ones hit harder.

## Usage

```bash
python3 generate.py --seed 42 --count 10   # 10 one-line teasers: curation mode
python3 generate.py --seed 47              # full concept sheet for the one that sparked
python3 generate.py --seed 47 --json       # machine-readable, for the pipeline
```

No dependencies — pure stdlib. **The seed is the species**: the same seed always
regenerates the same race, so a species is citable as its code
(e.g. `OCE-SIL-CEP-0043`) and the catalogue costs nothing to store.

## The intended pipeline

1. **Roll teasers in batches** (`--count 10`). Skim, keep the two or three that spark.
2. **Expand a keeper** (`--seed N`). The sheet gives you:
   - a trait vector (the canon skeleton),
   - three Flow prompts — portrait, habitat/city, cultural moment — all
     sharing one **style anchor** line so images of the same race stay consistent,
   - an LLM briefing that instructs the model to *derive consequences from the
     traits colliding* rather than free-associate.
3. **Feed the briefing to the local LLM**, get the dossier, then hand-pick lines
   from the dossier back into the Flow prompts (a named individual, a specific
   ritual) for the next round of images.
4. **Keep one canon file per race** (dossier + chosen images + seed). Future
   sessions about that race start from the canon file, not from a fresh roll —
   that's what keeps an infinite generator from becoming an amnesiac one.

## Tuning

Everything creative lives in `matrix.json`; `generate.py` is just the dice.

- Add options freely — each needs an `id`, `label`, `w`, and ideally a `hook`
  (one evocative line; the hooks are what make the prompts good).
- Add `tags` to an option if later axes should react to it; add `affinity`
  entries to make an option react to earlier tags.
- Too samey? Lower the weights of whatever keeps winning. Too weird? Raise the
  baseline options (`carbon_water`, `baseline_bilateral`, `visual`, `none`).
