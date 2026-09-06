#!/usr/bin/env python3
"""Minimal ComfyUI API client. Stdlib only.

ComfyUI exposes: POST /prompt (queue a workflow), GET /history/<id>
(poll for completion), GET /view (fetch an output image), and
POST /upload/image (add an input image). This client wraps the four.

Workflows are API-format JSON exported from the ComfyUI GUI
("Export (API)" / "Save (API format)"). Slot injection is the caller's
job — see render.py and workflows/README.md.
"""

import json
import time
import urllib.request
import urllib.parse
import uuid
from pathlib import Path


class ComfyClient:
    def __init__(self, base_url):
        self.base = base_url.rstrip("/")
        self.client_id = str(uuid.uuid4())

    def _get_json(self, path):
        with urllib.request.urlopen(self.base + path, timeout=60) as r:
            return json.load(r)

    def upload_image(self, filepath):
        """Upload a local image as a ComfyUI input; returns the stored name."""
        filepath = Path(filepath)
        boundary = uuid.uuid4().hex
        body = b"".join([
            f"--{boundary}\r\n".encode(),
            f'Content-Disposition: form-data; name="image"; filename="{filepath.name}"\r\n'.encode(),
            b"Content-Type: application/octet-stream\r\n\r\n",
            filepath.read_bytes(),
            f"\r\n--{boundary}--\r\n".encode(),
        ])
        req = urllib.request.Request(
            self.base + "/upload/image",
            data=body,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        )
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.load(r)["name"]

    def queue(self, workflow):
        """Queue an API-format workflow dict; returns the prompt id."""
        req = urllib.request.Request(
            self.base + "/prompt",
            data=json.dumps({"prompt": workflow, "client_id": self.client_id}).encode(),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)["prompt_id"]

    def wait(self, prompt_id, timeout=1800, poll=2.0):
        """Poll /history until the job finishes; returns its history entry."""
        deadline = time.time() + timeout
        while time.time() < deadline:
            hist = self._get_json(f"/history/{prompt_id}")
            if prompt_id in hist:
                entry = hist[prompt_id]
                status = entry.get("status", {})
                if status.get("status_str") == "error":
                    raise RuntimeError(f"ComfyUI job failed: {json.dumps(status)[:500]}")
                if entry.get("outputs"):
                    return entry
            time.sleep(poll)
        raise TimeoutError(f"ComfyUI job {prompt_id} did not finish in {timeout}s")

    def download_outputs(self, history_entry, out_dir):
        """Save every output image from a finished job; returns saved paths."""
        out_dir = Path(out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        saved = []
        for node_output in history_entry["outputs"].values():
            for img in node_output.get("images", []):
                q = urllib.parse.urlencode({
                    "filename": img["filename"],
                    "subfolder": img.get("subfolder", ""),
                    "type": img.get("type", "output"),
                })
                dest = out_dir / img["filename"]
                with urllib.request.urlopen(self.base + "/view?" + q, timeout=300) as r:
                    dest.write_bytes(r.read())
                saved.append(dest)
        return saved
