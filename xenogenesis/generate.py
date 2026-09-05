#!/usr/bin/env python3
"""Xenogenesis: seeded alien-race vector generator.

Rolls a coherent species vector from matrix.json (weighted, tag-constrained),
then emits either a one-line teaser, a full concept sheet with Google Flow
image prompts and a local-LLM briefing, or raw JSON for piping into a
larger pipeline.

Usage:
  python3 generate.py                  # one full concept sheet, random seed
  python3 generate.py --seed 1234      # reproducible: same seed, same race
  python3 generate.py --count 8        # 8 one-line teasers (curation mode)
  python3 generate.py --seed 1234 --json   # machine-readable vector
"""

import argparse
import json
import random
from pathlib import Path

MATRIX_PATH = Path(__file__).parent / "matrix.json"


def load_matrix():
    with open(MATRIX_PATH) as f:
        return json.load(f)


def roll_vector(matrix, rng):
    """Roll each axis in order; earlier picks' tags reweight later options."""
    picks = {}
    tags = set()
    for axis in matrix["axes"]:
        weighted = []
        for opt in axis["options"]:
            w = opt.get("w", 1.0)
            for tag, mult in opt.get("affinity", {}).items():
                if tag in tags:
                    w *= mult
            if w > 0:
                weighted.append((opt, w))
        total = sum(w for _, w in weighted)
        pick_at = rng.uniform(0, total)
        acc = 0.0
        chosen = weighted[-1][0]
        for opt, w in weighted:
            acc += w
            if pick_at <= acc:
                chosen = opt
                break
        picks[axis["id"]] = chosen
        tags.update(chosen.get("tags", []))
    return picks, tags


def species_code(picks, seed):
    parts = [
        picks["world"]["id"][:3],
        picks["substrate"]["id"][:3],
        picks["lineage"]["id"][:3],
    ]
    return ("-".join(parts) + f"-{seed % 10000:04d}").upper()


def teaser(picks, seed):
    bits = [
        picks["world"]["label"],
        picks["substrate"]["label"].lower(),
        picks["lineage"]["label"].lower(),
        picks["age"]["label"].lower(),
    ]
    if picks["convergence"]["id"] != "baseline_bilateral":
        bits.append(picks["convergence"]["label"].lower())
    if picks["twist"]["id"] != "none":
        bits.append("TWIST: " + picks["twist"]["label"].lower())
    return f"[seed {seed}] {species_code(picks, seed)}: " + "; ".join(bits)


def hooks(picks):
    return [
        (axis_id, p["label"], p["hook"])
        for axis_id, p in picks.items()
        if p.get("hook")
    ]


def style_anchor(picks, seed):
    """One reusable line appended to EVERY Flow prompt for this race, so all
    generated images read as the same species and material culture."""
    return (
        f"Species {species_code(picks, seed)}: {picks['lineage']['label'].lower()}-descended "
        f"{picks['substrate']['label'].lower()} lifeform from a {picks['world']['label'].lower()}; "
        f"visual signature: {picks['aesthetic']['hook']}. "
        "Consistent character design across images, cinematic concept art, painterly sci-fi illustration."
    )


def flow_prompts(picks, seed):
    anchor = style_anchor(picks, seed)
    body = picks["convergence"]["hook"] or "distinctive alien anatomy true to its lineage"
    sense = picks["sensorium"]["hook"] or "expressive alien eyes/sense organs"
    return [
        ("Portrait", f"Full-body concept art portrait of a single individual, neutral pose plus one "
                     f"culturally meaningful gesture. Anatomy: {body}. Sense organs: {sense}. {anchor}"),
        ("Habitat / city", f"Wide establishing shot of their settlement. {picks['world']['hook']}. "
                           f"Architecture: {picks['aesthetic']['hook']}. "
                           f"Technology visible in daily use: {picks['technology']['hook']}. {anchor}"),
        ("Cultural moment", f"A crowded scene of a ritual or public event expressing: "
                            f"{picks['values']['hook']}. Their history shows in the details: "
                            f"{picks['wound']['hook']}. {anchor}"),
    ]


def llm_briefing(picks, seed):
    lines = [
        "You are a science-fiction worldbuilding writer. Using ONLY the trait vector below,",
        "write a species dossier with these sections: Name (plus self-name and its literal",
        "meaning), Physiology (300w), History (300w), Culture & daily life (300w),",
        "First-contact scenario (200w), and three story hooks. Derive everything from the",
        "traits — make them collide and produce consequences; do not add unrelated gimmicks.",
        "Keep the tone grounded: these are people, not monsters.",
        "",
        f"TRAIT VECTOR ({species_code(picks, seed)}, seed {seed}):",
    ]
    for axis_id, label, hook in hooks(picks):
        lines.append(f"- {axis_id}: {label} — {hook}")
    for axis_id in ("convergence", "sensorium", "twist"):
        if not picks[axis_id].get("hook"):
            lines.append(f"- {axis_id}: {picks[axis_id]['label']}")
    return "\n".join(lines)


def full_sheet(picks, seed):
    out = [teaser(picks, seed), "", "=== TRAIT VECTOR ==="]
    for axis_id, p in picks.items():
        out.append(f"  {axis_id:12s} {p['label']}")
    out += ["", "=== GOOGLE FLOW PROMPTS ==="]
    for name, prompt in flow_prompts(picks, seed):
        out += [f"--- {name} ---", prompt, ""]
    out += ["=== LOCAL LLM BRIEFING ===", llm_briefing(picks, seed)]
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser(description="Roll coherent alien species vectors.")
    ap.add_argument("--seed", type=int, default=None, help="reproducible seed")
    ap.add_argument("--count", type=int, default=1, help="number of races to roll")
    ap.add_argument("--json", action="store_true", help="emit machine-readable JSON")
    args = ap.parse_args()

    matrix = load_matrix()
    base_seed = args.seed if args.seed is not None else random.randrange(1_000_000)

    results = []
    for i in range(args.count):
        seed = base_seed + i
        picks, _ = roll_vector(matrix, random.Random(seed))
        results.append((seed, picks))

    if args.json:
        print(json.dumps([
            {
                "seed": seed,
                "code": species_code(picks, seed),
                "vector": {k: v["id"] for k, v in picks.items()},
                "flow_prompts": dict(flow_prompts(picks, seed)),
                "llm_briefing": llm_briefing(picks, seed),
            }
            for seed, picks in results
        ], indent=2))
    elif args.count > 1:
        for seed, picks in results:
            print(teaser(picks, seed))
    else:
        seed, picks = results[0]
        print(full_sheet(picks, seed))


if __name__ == "__main__":
    main()
