#!/usr/bin/env python3
"""Local editor for the website.

Run:  python3 edit.py      (or double-click "Edit Website.command")
Then edit everything at http://127.0.0.1:5180/editor/
Only reachable from this computer.
"""
import json
import os
import re
import shutil
import subprocess
import time
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 5180
HEADER = (
    "/* Edited with the website editor (python3 edit.py).\n"
    "   You can still edit this by hand. Keep it valid JSON inside the braces. */\n"
)


def safe_name(name):
    base, ext = os.path.splitext(os.path.basename(name or "file"))
    base = re.sub(r"[^a-zA-Z0-9_-]+", "-", base).strip("-").lower()[:40] or "file"
    ext = re.sub(r"[^a-zA-Z0-9.]", "", ext).lower()
    return base, ext


def hash_text(t):
    import hashlib
    return int(hashlib.sha1(t.encode("utf-8")).hexdigest()[:12], 16)


def run(cmd):
    p = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    return p.returncode, (p.stdout + p.stderr).strip()


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass

    def reply(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def body(self):
        n = int(self.headers.get("Content-Length") or 0)
        return self.rfile.read(n)

    def do_POST(self):
        url = urlparse(self.path)
        q = {k: v[0] for k, v in parse_qs(url.query).items()}
        try:
            if url.path == "/api/save":
                path = os.path.join(ROOT, "content.js")
                if q.get("v") != "2":
                    return self.reply(409, {"error": "This editor tab is out of date. Refresh the page (Cmd+R)."})
                with open(path, encoding="utf-8") as f:
                    current = f.read()
                if q.get("base") != str(hash_text(current)):
                    return self.reply(409, {"error": "content.js was changed somewhere else. Refresh the page (Cmd+R) to load the latest."})
                data = json.loads(self.body())
                text = HEADER + "window.LOVE = " + json.dumps(data, indent=2, ensure_ascii=False) + ";\n"
                tmp = os.path.join(ROOT, "content.js.tmp")
                with open(tmp, "w", encoding="utf-8") as f:
                    f.write(text)
                os.replace(tmp, path)
                return self.reply(200, {"ok": True, "base": str(hash_text(text))})

            if url.path == "/api/upload":
                kind = q.get("kind", "photo")
                base, ext = safe_name(q.get("name"))
                raw = self.body()
                if kind == "music":
                    ext = ext if ext in (".mp3", ".m4a", ".aac", ".ogg", ".wav") else ".mp3"
                    for old in os.listdir(os.path.join(ROOT, "music")):
                        if old.startswith("song."):
                            os.remove(os.path.join(ROOT, "music", old))
                    rel = "music/song" + ext
                    with open(os.path.join(ROOT, rel), "wb") as f:
                        f.write(raw)
                    return self.reply(200, {"path": rel})
                # photos: convert anything (HEIC, PNG, huge JPG) to a web-sized JPG with macOS sips
                stamp = time.strftime("%m%d-%H%M%S")
                rel = f"photos/{base}-{stamp}.jpg"
                src = os.path.join(ROOT, f"photos/.upload-{stamp}{ext or '.img'}")
                with open(src, "wb") as f:
                    f.write(raw)
                code, _ = run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "82", "-Z", "1600", src, "--out", os.path.join(ROOT, rel)])
                if code != 0:
                    rel = f"photos/{base}-{stamp}{ext or '.jpg'}"
                    shutil.copy(src, os.path.join(ROOT, rel))
                os.remove(src)
                return self.reply(200, {"path": rel})

            if url.path == "/api/publish":
                out = []
                run(["git", "add", "-A"])
                code, msg = run(["git", "commit", "-m", "Update website content"])
                out.append(msg if code == 0 else "Nothing new to save.")
                _, remotes = run(["git", "remote"])
                if remotes.strip():
                    code, msg = run(["git", "push"])
                    out.append(("Pushed to GitHub. The live site updates in about a minute.\n" if code == 0 else "Push failed:\n") + msg)
                    ok = code == 0
                else:
                    out.append("Saved on this computer. It isn't connected to GitHub yet, so nothing went online.")
                    ok = True
                return self.reply(200, {"ok": ok, "log": "\n\n".join(out)})

            self.reply(404, {"error": "unknown"})
        except Exception as e:  # show any problem in the editor
            self.reply(500, {"error": str(e)})


if __name__ == "__main__":
    os.chdir(ROOT)
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), partial(Handler, directory=ROOT))
    url = f"http://127.0.0.1:{PORT}/editor/"
    print(f"\n  Editor running at {url}\n  Keep this window open while editing. Press Ctrl+C to stop.\n")
    if not os.environ.get("NO_BROWSER"):
        webbrowser.open(url)
    srv.serve_forever()
