#!/usr/bin/env python3
"""Xenogenesis canon ledgers.

One ledger per species (plus one 'universe' ledger for cross-species facts).
A ledger is a list of single-sentence FACTS, each carrying:

  provenance   wellspring > chelfyn > accepted-riff > machine-derived
               (higher never yields to lower; the machine builds ON canon,
                never OVER it)
  status       canon | provisional | review | retconned
  depends_on   fact ids this fact was derived from — retconning a fact
               flags all its dependents for review instead of letting the
               universe silently rot
  tags         matrix axes / free labels for retrieval

Retconned facts move to a retcon log with a reason and date: the universe
keeps a visible edit history, nothing is ever deleted.

Usage:
  python3 ledger.py new OCE-CAR-BOM --name "(working) the rocket-breeders"
  python3 ledger.py add OCE-CAR-BOM "Combustion arrived as an organ." \
      --provenance accepted-riff --tags substrate,technology
  python3 ledger.py show OCE-CAR-BOM
  python3 ledger.py question OCE-CAR-BOM "What is the engine taboo?"
  python3 ledger.py retcon OCE-CAR-BOM f0003 --reason "contradicted by ..."

The 'universe' species code addresses the shared universe ledger.
"""

import argparse
import json
import datetime
from pathlib import Path

CANON_DIR = Path(__file__).parent / "canon"
PROVENANCE_RANK = {"wellspring": 3, "chelfyn": 2, "accepted-riff": 1, "machine-derived": 0}
STATUSES = ("canon", "provisional", "review", "retconned")


def ledger_path(code):
    return CANON_DIR / code / "ledger.json"


def load(code):
    p = ledger_path(code)
    if not p.exists():
        raise SystemExit(f"no ledger for {code} (expected {p}); create with: ledger.py new {code}")
    with open(p) as f:
        return json.load(f)


def save(ledger):
    p = ledger_path(ledger["code"])
    p.parent.mkdir(parents=True, exist_ok=True)
    (p.parent / "inbox").mkdir(exist_ok=True)
    with open(p, "w") as f:
        json.dump(ledger, f, indent=2, ensure_ascii=False)


def today():
    return datetime.date.today().isoformat()


def new_species(code, name="", seed=None, vector=None):
    if ledger_path(code).exists():
        raise SystemExit(f"ledger for {code} already exists")
    ledger = {
        "code": code,
        "name": name,
        "seed": seed,
        "vector": vector or {},
        "facts": [],
        "open_questions": [],
        "retcon_log": [],
        "assets": [],
        "created": today(),
    }
    save(ledger)
    return ledger


def next_fact_id(ledger):
    used = {f["id"] for f in ledger["facts"]} | {r["id"] for r in ledger["retcon_log"]}
    n = 1
    while f"f{n:04d}" in used:
        n += 1
    return f"f{n:04d}"


def add_fact(ledger, statement, provenance, status="canon", depends_on=(), tags=(), note=""):
    if provenance not in PROVENANCE_RANK:
        raise SystemExit(f"provenance must be one of {list(PROVENANCE_RANK)}")
    if status not in STATUSES:
        raise SystemExit(f"status must be one of {STATUSES}")
    known = {f["id"] for f in ledger["facts"]}
    missing = [d for d in depends_on if d not in known]
    if missing:
        raise SystemExit(f"depends_on references unknown facts: {missing}")
    fact = {
        "id": next_fact_id(ledger),
        "statement": statement.strip(),
        "provenance": provenance,
        "status": status,
        "depends_on": list(depends_on),
        "tags": list(tags),
        "added": today(),
    }
    if note:
        fact["note"] = note
    ledger["facts"].append(fact)
    return fact


def retcon(ledger, fact_id, reason):
    fact = next((f for f in ledger["facts"] if f["id"] == fact_id), None)
    if fact is None:
        raise SystemExit(f"no fact {fact_id} in {ledger['code']}")
    ledger["facts"].remove(fact)
    fact["status"] = "retconned"
    ledger["retcon_log"].append({**fact, "retconned": today(), "reason": reason})
    flagged = []
    stack = [fact_id]
    while stack:
        target = stack.pop()
        for f in ledger["facts"]:
            if target in f["depends_on"] and f["status"] != "review":
                f["status"] = "review"
                flagged.append(f["id"])
                stack.append(f["id"])
    return flagged


def render_context(ledger):
    """The ledger as a stable text block for prompts. Keep this deterministic:
    it is the cacheable prefix every model call reuses."""
    lines = [f"=== CANON LEDGER: {ledger['code']}"
             + (f" — {ledger['name']}" if ledger.get("name") else "") + " ==="]
    if ledger.get("vector"):
        lines.append("Trait vector: " + ", ".join(f"{k}={v}" for k, v in ledger["vector"].items()))
    lines.append("Facts (provenance in brackets outranks lower tiers; never contradict a higher tier):")
    for f in sorted(ledger["facts"], key=lambda f: -PROVENANCE_RANK[f["provenance"]]):
        flag = "" if f["status"] == "canon" else f" ({f['status'].upper()})"
        lines.append(f"  [{f['provenance']}] {f['id']}: {f['statement']}{flag}")
    if ledger["open_questions"]:
        lines.append("Open questions (unresolved; do not silently answer, flag if your output touches one):")
        for q in ledger["open_questions"]:
            lines.append(f"  - {q['question']}")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description="Canon ledger tool")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("new"); p.add_argument("code"); p.add_argument("--name", default="")
    p.add_argument("--seed", type=int); p.add_argument("--vector-json", help="trait vector as JSON")

    p = sub.add_parser("add"); p.add_argument("code"); p.add_argument("statement")
    p.add_argument("--provenance", required=True, choices=list(PROVENANCE_RANK))
    p.add_argument("--status", default="canon", choices=list(STATUSES))
    p.add_argument("--depends-on", default="", help="comma-separated fact ids")
    p.add_argument("--tags", default="", help="comma-separated tags")
    p.add_argument("--note", default="")

    p = sub.add_parser("question"); p.add_argument("code"); p.add_argument("question")
    p = sub.add_parser("retcon"); p.add_argument("code"); p.add_argument("fact_id")
    p.add_argument("--reason", required=True)
    p = sub.add_parser("show"); p.add_argument("code")
    p = sub.add_parser("list")

    args = ap.parse_args()

    if args.cmd == "new":
        vector = json.loads(args.vector_json) if args.vector_json else None
        new_species(args.code, args.name, args.seed, vector)
        print(f"created ledger {ledger_path(args.code)}")
    elif args.cmd == "add":
        ledger = load(args.code)
        deps = [d for d in args.depends_on.split(",") if d]
        tags = [t for t in args.tags.split(",") if t]
        fact = add_fact(ledger, args.statement, args.provenance, args.status, deps, tags, args.note)
        save(ledger)
        print(f"added {fact['id']} [{fact['provenance']}] to {args.code}")
    elif args.cmd == "question":
        ledger = load(args.code)
        ledger["open_questions"].append({"question": args.question.strip(), "added": today()})
        save(ledger)
        print(f"noted open question on {args.code}")
    elif args.cmd == "retcon":
        ledger = load(args.code)
        flagged = retcon(ledger, args.fact_id, args.reason)
        save(ledger)
        print(f"retconned {args.fact_id}; flagged for review: {flagged or 'none'}")
    elif args.cmd == "show":
        print(render_context(load(args.code)))
    elif args.cmd == "list":
        if CANON_DIR.exists():
            for p in sorted(CANON_DIR.glob("*/ledger.json")):
                with open(p) as f:
                    led = json.load(f)
                print(f"{led['code']:20s} {len(led['facts']):3d} facts  {led.get('name','')}")


if __name__ == "__main__":
    main()
