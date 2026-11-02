"""Page shell shared by every page of the identity book. Bump V after any CSS or JS change."""
import html
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brand  # noqa: E402
import tokens as T  # noqa: E402

V = 136
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
esc = lambda s: html.escape(str(s), quote=True)

with open(os.path.join(ROOT, 'tools', 'lines.json'), encoding='utf-8') as fh:
    LINES = json.load(fh)['lines']

NAV = [
    ('index', 'Overview'), ('decisions', 'Decisions'), ('mark', 'Mark'), ('signature', 'Signature'),
    ('colour', 'Colour'), ('type', 'Type'), ('icons', 'Icons'), ('motion', 'Motion'),
    ('system', 'Watar and co-branding'), ('applications', 'Applications'), ('guidelines', 'Guidelines'), ('screens', 'Screens'),
]


def blocks_of(key):
    return [[s[0] for s in b['steps']] for b in LINES[key]['blocks']]


def kinds_of(key):
    return [k for b in blocks_of(key) for k in b]


def page(slug, title, body, desc, scripts=()):
    nav = ''.join(
        f'<li><a href="{s}.html"{" aria-current=page" if s == slug else ""}>{esc(n)}</a></li>' for s, n in NAV)
    js = ''.join(f'<script src="assets/js/{s}.js?v={V}" defer></script>' for s in scripts)
    lock = brand.lockup_svg('light').replace('<svg ', '<svg aria-hidden="true" ', 1)
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} · Iqaa identity</title>
<meta name="description" content="{esc(desc)}">
<meta name="robots" content="noindex">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/atkinson.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/tokens.css?v={V}">
<link rel="stylesheet" href="assets/css/brand.css?v={V}">
<link rel="stylesheet" href="assets/css/parts.css?v={V}">
{js}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="wrap">
<a class="home" href="index.html" aria-label="Iqaa identity, overview">{lock}<span class="tag">Brand identity · Nov 2026</span></a>
<nav aria-label="Sections"><ul>{nav}</ul></nav>
<details><summary>Sections</summary><ul>{nav}</ul></details>
</div></header>
<main id="main">
{body}
</main>
<footer class="foot"><div class="wrap">
<span>Iqaa identity · English first; Arabic and Turkish follow on the same rules · 1 Nov 2026</span>
<span><a href="screens.html">See it at work in the product</a></span>
</div></footer>
</body>
</html>
'''


def head(eyebrow, h1, lede):
    return f'<div class="wrap"><header class="head"><p class="eyebrow">{eyebrow}</p><h1>{h1}</h1><p class="lede">{lede}</p></header>'


def sec(label, title, body, note='', full=False):
    n = f'<p>{note}</p>' if note else ''
    if full:
        return f'<section class="sec"><div class="sh"><p class="eyebrow">{label}</p><h2>{title}</h2>{n}</div><div class="full">{body}</div></section>'
    return f'<section class="sec"><div class="sh"><p class="eyebrow">{label}</p><h2>{title}</h2>{n}</div><div class="sb">{body}</div></section>'


def sigline(key, k=1.0, pal='light', test=False, labels=True):
    """A line as one stroke, with each station's name under its steps."""
    blocks = LINES[key]['blocks']
    kinds = [[s[0] for s in b['steps']] for b in blocks]
    names = [b['name'] for b in blocks] if labels else None
    return f'<div class="sigline">{brand.line_svg(kinds, k=k, pal=pal, test=test, labels=names)}</div>'


def legend(pal='light'):
    items = [
        ('run', 'Runs', 'A step that runs by itself: a message, a reminder, a release. A straight stroke, ink.'),
        ('held', 'Waits', 'The line waits for a person: an approval, a review, a Watar draft. An open arch, violet.'),
        ('struck', 'By hand', 'A person does the work. A loop of the hand, violet.'),
        ('rest', 'Pause', 'A timed wait. The pen lifts and leaves a dot, ink.'),
    ]
    cells = ''
    for kind, name, text in items:
        cells += f'<div>{brand.glyph_svg(kind, pal, 44)}<div class="cap"><b>{name}</b><span>{text}</span></div></div>'
    return f'<div class="legend">{cells}</div>'


def inline(svg, cls='', label=None):
    """Inline an exported SVG string, dropping the XML namespace noise and adding a class."""
    s = svg.replace(' xmlns="http://www.w3.org/2000/svg"', '')
    if cls:
        s = s.replace('<svg ', f'<svg class="{cls}" ', 1)
    if label is None:
        s = s.replace(' role="img"', ' aria-hidden="true"', 1)
    return s


def tokens_js():
    """The grammar's constants and palettes for the browser, from the same source as the SVG files."""
    hand = {ch: {k: v[k] for k in ('d', 'len', 'x0', 'x1', 'cx')} for ch, v in brand.hand().items()}
    from p_ct import ICONS  # the icon family, so screens drawn in the browser use the same strokes as the book
    data = {'mark': T.MARK, 'pal': brand.PAL, 'motion': T.MOTION, 'lines': LINES, 'letters': hand, 'icons': ICONS}
    return 'window.IQAA = ' + json.dumps(data, ensure_ascii=False) + ';\n'
