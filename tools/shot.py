"""Headless Chrome screenshots of the local preview, for QA.

python -I tools/shot.py page.html out.png [width] [height] [--settled]

--settled forces prefers-reduced-motion, so timed sequences (sign-in, approval) jump to their end state:
headless virtual time does not run animation frames. Widths under 500 px are framed in an iframe and
cropped, because headless Chrome will not lay a window out that narrow.
The preview must be running (launch config "iqaa-brand", port 8341).
"""
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.parse import quote

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE = "http://localhost:8341/"


def shot(page, out, width=1280, height=900, settled=False, scale=1):
    out = Path(out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    narrow = width < 500
    target = f"{BASE}research/frame.html?w={width}&h={height}&src={quote(BASE + page, safe='')}" if narrow else BASE + page
    profile = tempfile.mkdtemp(prefix="iqaa-brand-shot-")
    args = [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", f"--user-data-dir={profile}",
            f"--force-device-scale-factor={scale}", f"--window-size={640 if narrow else width},{height}",
            "--virtual-time-budget=8000", f"--screenshot={out}", target]
    if settled:
        args.insert(1, "--force-prefers-reduced-motion")
    subprocess.run(args, check=True, capture_output=True, timeout=120)
    if narrow:
        from PIL import Image
        Image.open(out).crop((0, 0, width * scale, height * scale)).save(out)
    return out


if __name__ == "__main__":
    flags = [a for a in sys.argv[1:] if a.startswith("--")]
    pos = [a for a in sys.argv[1:] if not a.startswith("--")]
    w = int(pos[2]) if len(pos) > 2 else 1280
    h = int(pos[3]) if len(pos) > 3 else 900
    print(shot(pos[0], pos[1], w, h, "--settled" in flags))
