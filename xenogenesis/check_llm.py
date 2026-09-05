#!/usr/bin/env python3
"""Connectivity checkpoint for a configured model role.

Reads config.toml, hits the role's endpoint twice — /models (is the server
up and serving the expected model?) and one tiny chat completion (does the
whole inference path work?) — and says plainly what passed or where it
broke. Stdlib only.

  python3 check_llm.py --role deep
"""

import argparse
import json
import sys
import tomllib
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).parent


def get(url, payload=None, timeout=120):
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode() if payload else None,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.load(resp)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--role", default="deep")
    args = ap.parse_args()

    with open(HERE / "config.toml", "rb") as f:
        cfg = tomllib.load(f)
    if args.role not in cfg["roles"]:
        sys.exit(f"FAIL: no role '{args.role}' in config.toml (have: {list(cfg['roles'])})")
    role = cfg["roles"][args.role]
    base = role["endpoint"].rstrip("/")
    print(f"role '{args.role}' -> {base}  (expecting model {role['model']})")

    try:
        served = [m["id"] for m in get(base + "/models")["data"]]
    except urllib.error.URLError as e:
        sys.exit(f"FAIL: cannot reach {base} ({e.reason}).\n"
                 "  -> server not running, wrong port in config.toml, or still loading "
                 "(check: docker logs -f <container>)")
    print(f"OK: server up, serving: {served}")
    if role["model"] not in served:
        print(f"WARN: configured model '{role['model']}' not in served list — "
              "config.toml and the container's --model disagree")

    try:
        reply = get(base + "/chat/completions", {
            "model": role["model"] if role["model"] in served else served[0],
            "messages": [{"role": "user", "content": "Reply with the single word: ready"}],
            "max_tokens": 10,
        })
        text = reply["choices"][0]["message"]["content"].strip()
    except (urllib.error.URLError, KeyError, IndexError) as e:
        sys.exit(f"FAIL: /models works but completion failed ({e}).\n"
                 "  -> usually model still loading, or CUDA OOM — check container logs")
    print(f"OK: completion path works. Model says: {text!r}")
    print("PASS")


if __name__ == "__main__":
    main()
