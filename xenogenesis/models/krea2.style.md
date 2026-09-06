# Krea 2 (RAW) — prompting dossier

Status: **field observations from first renders**, not yet a research
pass — replace/extend sections when the Deep Research dossier lands.

## Idiom
Weights early tokens heavily: **front-load the subject**, push the style
anchor to the end. Left to itself the model's prior drifts hard toward
human, metal, dry, aerospace — abstract alien descriptors lose to that
prior every time. Alienness must be spent as *concrete visual nouns*,
not asserted as concepts.

## Do
- Translate "bred, not built" into materials the sampler can paint:
  *wet chitin, translucent membrane, cartilage struts, glandular pods,
  mucus sheen, pulsing bioluminescent veins, barnacled growth rings*.
- State the medium explicitly and early when a scene is submerged:
  *underwater interior, flooded with green-lit brine, particulate water,
  refracted caustics* — "liquid immersion" alone was overruled by the
  dry-corridor prior.
- Describe the crew's body plan concretely (limbs, skin, eyes) whenever
  figures appear; unnamed "crew" renders as humans in chairs.
- One subject sentence first, materials second, environment third,
  style anchor last.

## Don't
- Don't rely on conceptual phrases ("living booster stages", "bred not
  built", "ancestor engines") without concrete nouns beside them — the
  first exterior rendered them as grey metal missiles.
- Don't bury the subject behind a long style preamble.

## Negative prompt
The anti-prior battery, default for xenogenesis renders:
`human, person, astronaut, humanoid, metal hull, steel, rivets, panels,
dry, aircraft, missile, rocket fins, cockpit, chairs, consoles`
(trim per shot — e.g. drop "rocket fins" for launch scenes if they read
as bred boosters). The manifest exposes the `negative` slot.

## Settings
RAW checkpoint (`krea2_raw_int8_convrot`): 52 steps, cfg 3.5, euler /
simple, denoise 1.0, 1024×1024 masters (1:1 policy). ~36 s per master on
the RTX PRO 6000 with vLLM resident. Turbo checkpoint
(`krea2_turbo_int8_convrot`, not yet on disk): 8 steps, cfg 1, zeroed
negative — the natural dream-mode / sketch tier.

## Trigger words & LoRAs
Unknown — populate when the first species LoRA is trained.

## Worked examples
To add after the next render batch: one canon-derived prompt in
corrected dialect, alongside what the naive version produced.

---
Provenance: Cowork bring-up handoff + first-light renders of
OCE-CAR-BOM (exterior seed 334609905, interior), 2026-09-06.
Reviewed against: ComfyUI 0.34.0 core Krea 2, RAW int8 checkpoint.
Deep Research pass: pending.
