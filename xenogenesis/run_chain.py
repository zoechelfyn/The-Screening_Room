#!/usr/bin/env python3
"""Run a derivation chain against a species ledger.

Builds the prompt as ONE STABLE PREFIX (chain template + rendered ledger) —
the shape that prompt caches love — then either prints it for manual pasting
(--dry-run: usable today, before any model server is installed) or POSTs it
to the OpenAI-compatible endpoint for the chosen role in config.toml.

The model's reply is saved whole (reasoning included) to the species inbox,
with the trailing JSON block parsed out alongside. Nothing enters the ledger
without human approval:

  python3 run_chain.py run OCE-CAR-BOM spaceship --dry-run
  python3 run_chain.py run OCE-CAR-BOM spaceship --role deep
  python3 run_chain.py approve OCE-CAR-BOM inbox/spaceship-20260905-101500.json

Approval merges the output's canon_facts into the ledger as
[machine-derived] facts and archives the full derivation under chains/.
Zero dependencies (stdlib only); Python 3.11+ for tomllib.
"""

import argparse
import datetime
import json
import sys
import tomllib
import urllib.request
from pathlib import Path

import ledger as ledger_lib

HERE = Path(__file__).parent


def load_config():
    with open(HERE / "config.toml", "rb") as f:
        return tomllib.load(f)


def build_prompt(species_code, chain_name):
    chain_file = HERE / "chains" / f"{chain_name}.md"
    if not chain_file.exists():
        raise SystemExit(f"no chain named {chain_name} (expected {chain_file})")
    led = ledger_lib.load(species_code)
    return chain_file.read_text() + "\n\n" + ledger_lib.render_context(led) + "\n"


def call_llm(prompt, role_cfg):
    body = {
        "model": role_cfg["model"],
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": role_cfg.get("max_tokens", 4096),
        "temperature": role_cfg.get("temperature", 0.8),
    }
    req = urllib.request.Request(
        role_cfg["endpoint"].rstrip("/") + "/chat/completions",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=1800) as resp:
        data = json.load(resp)
    return data["choices"][0]["message"]["content"]


def extract_json(text):
    """Parse the trailing JSON object out of a reasoning-then-JSON reply."""
    start = text.rfind("```json")
    if start != -1:
        blob = text[start + 7:]
        blob = blob[: blob.find("```")] if "```" in blob else blob
    else:
        brace = text.rfind("{")
        # walk back to the outermost { of the trailing object
        depth, i = 0, len(text) - 1
        end = None
        while i >= 0:
            if text[i] == "}":
                if end is None:
                    end = i
                depth += 1
            elif text[i] == "{":
                depth -= 1
                if depth == 0 and end is not None:
                    brace = i
                    break
            i -= 1
        blob = text[brace : end + 1] if end is not None else ""
    try:
        return json.loads(blob)
    except (json.JSONDecodeError, ValueError):
        return None


def cmd_run(args):
    prompt = build_prompt(args.species, args.chain)
    if args.dry_run:
        print(prompt)
        return
    cfg = load_config()
    role_cfg = cfg["roles"][args.role]
    print(f"calling role '{args.role}' ({role_cfg['model']}) ...", file=sys.stderr)
    reply = call_llm(prompt, role_cfg)
    parsed = extract_json(reply)
    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    inbox = ledger_lib.ledger_path(args.species).parent / "inbox"
    inbox.mkdir(parents=True, exist_ok=True)
    out = inbox / f"{args.chain}-{stamp}.json"
    with open(out, "w") as f:
        json.dump({"chain": args.chain, "species": args.species, "role": args.role,
                   "raw": reply, "parsed": parsed}, f, indent=2, ensure_ascii=False)
    if parsed is None:
        print(f"WARNING: no parseable JSON in reply; saved raw to {out}", file=sys.stderr)
    else:
        n = len(parsed.get("canon_facts", []))
        print(f"saved to {out} ({n} proposed canon facts). Review, then:\n"
              f"  python3 run_chain.py approve {args.species} {out.relative_to(ledger_lib.ledger_path(args.species).parent)}")


def cmd_approve(args):
    led = ledger_lib.load(args.species)
    species_dir = ledger_lib.ledger_path(args.species).parent
    path = (species_dir / args.file) if not Path(args.file).is_absolute() else Path(args.file)
    with open(path) as f:
        result = json.load(f)
    parsed = result.get("parsed") or {}
    facts = parsed.get("canon_facts", [])
    if not facts:
        raise SystemExit("nothing to approve: no parsed canon_facts in that file")
    chain = result.get("chain", "chain")
    added = [ledger_lib.add_fact(led, s, "machine-derived", tags=[chain]) for s in facts]
    chains_dir = species_dir / "chains"
    chains_dir.mkdir(exist_ok=True)
    archive = chains_dir / f"{chain}.json"
    with open(archive, "w") as f:
        json.dump(parsed, f, indent=2, ensure_ascii=False)
    ledger_lib.save(led)
    path.unlink()
    print(f"approved: {len(added)} facts added to {args.species} "
          f"({added[0]['id']}..{added[-1]['id']}); derivation archived at {archive}")


def main():
    ap = argparse.ArgumentParser(description="Run derivation chains against canon ledgers")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("run")
    p.add_argument("species"); p.add_argument("chain")
    p.add_argument("--role", default="deep")
    p.add_argument("--dry-run", action="store_true", help="print the prompt instead of calling a model")
    p.set_defaults(func=cmd_run)

    p = sub.add_parser("approve")
    p.add_argument("species"); p.add_argument("file", help="inbox file (relative to the species dir)")
    p.set_defaults(func=cmd_approve)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
