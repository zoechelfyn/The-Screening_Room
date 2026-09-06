# Model dossiers: per-model prompting guides

One file per image/video model family, named `<model>.style.md`
(e.g. `krea2.style.md`). These are the landing pad for prompting
research (Deep Research sessions distil into a dossier here — a file in
the repo, not a chat transcript that evaporates).

**Why they exist:** canonical prompts are model-agnostic *intent*; each
model's dialect is applied at render time. A workflow manifest declares
its dialect with an optional `"style": "models/<model>.style.md"` field.
Today the dossiers guide whoever writes prompts (human or chain); from
Stage 2 the dispatch-tier compiler injects the dossier when turning
structured intent into the final prompt string — so a model swap means
a new dossier, never a rewrite of canon.

Keep the provenance footer current: a dossier without a date is a rumor.

Use `TEMPLATE.style.md` as the skeleton.
