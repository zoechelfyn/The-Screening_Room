# Workflows: how the engine drives ComfyUI

The engine never knows what model a workflow uses — Krea 2, Flux,
anything. It only knows *slots*. You author the graph once in the
ComfyUI GUI; a manifest names which node/field each slot lives in; the
engine fills slots and fires. Swapping models forever after is a GUI
job, never an engine change.

## Installing ComfyUI on this machine (one-time)

This machine keeps a **shared models directory at `E:\models`** used by
multiple ComfyUI installs. The install for this project is a **clean
ComfyUI at `E:\ComfyUI`** (Windows-native) that references the shared
models rather than copying them:

1. Fresh ComfyUI install (portable zip or git clone) at `E:\ComfyUI`.
2. In the install's root, copy `extra_model_paths.yaml.example` to
   `extra_model_paths.yaml` and point it at the shared tree, e.g.:

   ```yaml
   shared:
     base_path: E:\models
     checkpoints: checkpoints
     loras: loras
     vae: vae
     clip: clip
     controlnet: controlnet
     upscale_models: upscale_models
   ```

   (Match the subfolder names that actually exist under `E:\models`;
   the Krea 2 checkpoint must be visible in one of them. Never copy or
   move model files into the install itself.)
3. Start ComfyUI and confirm the Krea 2 checkpoint appears in the
   checkpoint loader's dropdown, and that `http://localhost:8188`
   answers — including **from WSL** (see the networking note at the
   bottom of this file). If the URL differs, update `[services]
   comfyui` in `config.toml`.

## Creating a workflow (one-time, ~10 minutes)

1. In the ComfyUI GUI, build the graph you want: Krea 2 checkpoint,
   your sampler settings, a positive-prompt text node, and (optional but
   recommended) an image-input node feeding reference conditioning
   (IPAdapter or equivalent) for on-model species renders.
2. Enable dev mode (settings), then **Export (API)** — this saves the
   graph as API-format JSON. Put it here as `concept_image.json`.
3. Find the node ids for the slots: open the exported JSON — each
   top-level key is a node id; the positive prompt is a CLIPTextEncode-
   style node with a `text` input, the sampler has a `seed` input, the
   image loader has an `image` input.
4. Write `concept_image.manifest.json` beside it:

```json
{
  "slots": {
    "prompt":          { "node": "6",  "field": "text" },
    "seed":            { "node": "3",  "field": "seed" },
    "reference_image": { "node": "10", "field": "image" }
  }
}
```

(Use your actual node ids. `reference_image` is optional — omit the
entry if the graph has no image input. A `negative` slot works the same
way if you want the engine to control it.)

## Using it

```bash
# exterior of The Late Sister, prompt taken from the approved chain:
python3 render.py OCE-CAR-BOM spaceship exterior

# ad-hoc, with a reference image:
python3 render.py OCE-CAR-BOM --prompt "a Rocket-Breeder tide-priest" --reference ref.png
```

Outputs land in `canon/<SPECIES>/assets/<workflow>-<stamp>/` with a
`provenance.json` recording the prompt, seed, workflow, source chain,
and reference — every image traceable back to the canon that made it.

ComfyUI's URL comes from `config.toml` `[services]` (default
`http://localhost:8188`). ComfyUI on native Windows works fine — WSL
reaches the Windows host automatically in mirrored networking mode; if
`localhost:8188` isn't reachable from WSL, either enable mirrored mode
(`networkingMode=mirrored` in `.wslconfig`) or point config.toml at the
Windows host IP from `ip route show default`.

## Conventions

- One workflow file per *purpose* (concept_image, reference_sheet,
  theme_plate, motion_sketch...), not per species — species identity
  comes in through the prompt, reference image, and later the LoRA.
- Never edit the exported JSON by hand except via re-export; the
  manifest absorbs all the churn.
