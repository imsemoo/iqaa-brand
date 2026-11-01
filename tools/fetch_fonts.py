"""Download the candidate families from the google/fonts repository (all OFL) into research/font-src.

python -I tools/fetch_fonts.py   (from the project root; research/font-src is gitignored)
"""
import json
import os
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'research', 'font-src')
os.makedirs(OUT, exist_ok=True)

DIRS = [
    'hostgrotesk', 'atkinsonhyperlegiblenext', 'funnelsans', 'funneldisplay', 'instrumentsans',
    'hankengrotesk', 'onest', 'wixmadefortext', 'wixmadefordisplay', 'rethinksans',
    'fragmentmono', 'martianmono', 'azeretmono', 'sometypemono', 'redhatmono',
]


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'iqaa-brand-fonts'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


for d in DIRS:
    listing = json.loads(get(f'https://api.github.com/repos/google/fonts/contents/ofl/{d}'))
    for item in listing:
        name = item['name']
        if not name.endswith('.ttf') or 'Italic' in name:
            continue
        path = os.path.join(OUT, name)
        if not os.path.exists(path):
            with open(path, 'wb') as f:
                f.write(get(item['download_url']))
        print(d, name, os.path.getsize(path))
