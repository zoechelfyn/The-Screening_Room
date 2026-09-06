#!/usr/bin/env python3
"""Render an image from canon through a ComfyUI workflow.

The bridge between the engine and the render farm: takes a Flow prompt
from an approved chain (or an ad-hoc prompt), injects it into a workflow
via the workflow's manifest, submits to ComfyUI, and saves the results
into the species' asset folder with a provenance sidecar.

  # render The Late Sister's exterior from the approved spaceship chain:
  python3 render.py OCE-CAR-BOM spaceship exterior

  # ad-hoc prompt, optional reference image:
  python3 render.py OCE-CAR-BOM --prompt "..." --reference path/to/img.png

  # choose a workflow (default: concept_image):
  python3 render.py OCE-CAR-BOM spaceship interior --workflow concept_image

Workflows live in workflows/<name>.json (API-format export from the
ComfyUI GUI) with slot mappings in workflows/<name>.manifest.json —
see workflows/README.md.
"""

import argparse
import datetime
import json
import random
import sys
import tomllib
from pathlib import Path

from comfy import ComfyClient
import ledger as ledger_lib

HERE = Path(__file__).parent
WORKFLOWS = HERE / "workflows"


def wsl_host_ip():
    """The Windows host's IP as seen from WSL (the default gateway)."""
    import subprocess
    try:
        out = subprocess.run(["ip", "route", "show", "default"],
                             capture_output=True, text=True).stdout.split()
        return out[out.index("via") + 1] if "via" in out else None
    except (OSError, ValueError):
        return None


def resolve_comfy_url(url):
    """Use the configured URL, but if its host is unreachable and we're in
    WSL, fall back to the current Windows-host IP (it changes across WSL
    restarts — see the note in config.toml)."""
    import urllib.error
    import urllib.request as ur
    try:
        ur.urlopen(url.rstrip("/") + "/system_stats", timeout=5)
        return url
    except (urllib.error.URLError, OSError):
        pass
    host = wsl_host_ip()
    if host:
        from urllib.parse import urlparse
        port = urlparse(url).port or 8188
        fallback = f"http://{host}:{port}"
        try:
            ur.urlopen(fallback + "/system_stats", timeout=5)
            print(f"NOTE: {url} unreachable; using current WSL host gateway "
                  f"{fallback} (update config.toml to silence this)", file=sys.stderr)
            return fallback
        except (urllib.error.URLError, OSError):
            pass
    raise SystemExit(f"ComfyUI unreachable at {url}"
                     + (f" and at gateway fallback http://{host}:..." if host else "")
                     + " — is ComfyUI running? (E:\\ComfyUI, see workflows/README.md)")


def load_workflow(name):
    wf_path = WORKFLOWS / f"{name}.json"
    mf_path = WORKFLOWS / f"{name}.manifest.json"
    if not wf_path.exists():
        raise SystemExit(f"no workflow {wf_path} — export one from ComfyUI (API format); see workflows/README.md")
    if not mf_path.exists():
        raise SystemExit(f"no manifest {mf_path} — see workflows/README.md")
    with open(wf_path) as f:
        workflow = json.load(f)
    with open(mf_path) as f:
        manifest = json.load(f)
    return workflow, manifest


def inject(workflow, manifest, slot, value):
    """Set a manifest-mapped slot ({'node': id, 'field': name}) in the graph."""
    mapping = manifest["slots"].get(slot)
    if mapping is None:
        return False
    node = workflow.get(str(mapping["node"]))
    if node is None:
        raise SystemExit(f"manifest maps slot '{slot}' to node {mapping['node']}, "
                         "which is not in the workflow — re-export or fix the manifest")
    node["inputs"][mapping["field"]] = value
    return True


def chain_prompt(species, chain, shot):
    archive = ledger_lib.ledger_path(species).parent / "chains" / f"{chain}.json"
    if not archive.exists():
        raise SystemExit(f"no approved {chain} chain for {species} (expected {archive}); "
                         "approve one first, or use --prompt")
    with open(archive) as f:
        data = json.load(f)
    prompts = data.get("flow_prompts", {})
    if shot not in prompts:
        raise SystemExit(f"chain {chain} has no '{shot}' prompt (has: {list(prompts)})")
    return prompts[shot]


def main():
    ap = argparse.ArgumentParser(description="Render canon through ComfyUI")
    ap.add_argument("species")
    ap.add_argument("chain", nargs="?", help="approved chain to take the prompt from")
    ap.add_argument("shot", nargs="?", help="which flow prompt (e.g. exterior, interior)")
    ap.add_argument("--prompt", help="ad-hoc prompt instead of a chain prompt")
    ap.add_argument("--reference", help="reference image to upload and inject")
    ap.add_argument("--workflow", default="concept_image")
    ap.add_argument("--seed", type=int, default=None)
    args = ap.parse_args()

    if args.prompt:
        prompt, source = args.prompt, "ad-hoc"
    elif args.chain and args.shot:
        prompt = chain_prompt(args.species, args.chain, args.shot)
        source = f"{args.chain}/{args.shot}"
    else:
        raise SystemExit("give CHAIN and SHOT, or --prompt")

    with open(HERE / "config.toml", "rb") as f:
        cfg = tomllib.load(f)
    client = ComfyClient(resolve_comfy_url(cfg["services"]["comfyui"]))

    workflow, manifest = load_workflow(args.workflow)
    seed = args.seed if args.seed is not None else random.randrange(2**31)
    if not inject(workflow, manifest, "prompt", prompt):
        raise SystemExit("manifest has no 'prompt' slot — it is required")
    inject(workflow, manifest, "seed", seed)
    if args.reference:
        if "reference_image" not in manifest["slots"]:
            raise SystemExit(f"workflow {args.workflow} has no reference_image slot")
        uploaded = client.upload_image(args.reference)
        inject(workflow, manifest, "reference_image", uploaded)

    print(f"submitting to ComfyUI ({args.workflow}, seed {seed}) ...", file=sys.stderr)
    prompt_id = client.queue(workflow)
    entry = client.wait(prompt_id)

    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    assets = ledger_lib.ledger_path(args.species).parent / "assets" / f"{args.workflow}-{stamp}"
    saved = client.download_outputs(entry, assets)
    with open(assets / "provenance.json", "w") as f:
        json.dump({
            "species": args.species,
            "source": source,
            "workflow": args.workflow,
            "prompt": prompt,
            "seed": seed,
            "reference": args.reference,
            "rendered": stamp,
            "files": [p.name for p in saved],
        }, f, indent=2)
    print(f"saved {len(saved)} image(s) to {assets}")


if __name__ == "__main__":
    main()
