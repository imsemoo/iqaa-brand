"""Org mark directions, drawn side by side at the sizes they are used, with their measures.

python -I research/org-mark/lab.py  ->  research/org-mark/directions.html
Every direction uses the brand's own rules: the pen of the line, and letters outlined from Atkinson Hyperlegible
Next at the weight whose stem equals that pen (the rule the Iqaa wordmark is set by).
"""
import functools
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import brand  # noqa: E402

f = brand.f
INK, TILE_DARK = brand.BRAND['ink'], '#39374D'
LINES = json.load(open(os.path.join(ROOT, 'tools', 'lines.json'), encoding='utf-8'))['lines']


@functools.lru_cache(maxsize=None)
def weight_for(ratio):
    """Atkinson weight whose H stem is `ratio` of the cap height."""
    lo, hi = 200, 800
    for _ in range(12):
        mid = (lo + hi) / 2
        fnt = brand._font_at(round(mid))
        if brand._stem(fnt) / fnt['OS/2'].sCapHeight < ratio:
            lo = mid
        else:
            hi = mid
    return round((lo + hi) / 2)


@functools.lru_cache(maxsize=None)
def letter(ch, wght, cap):
    """Outline of one capital, baseline y = 0, cap height `cap`, y down. Returns (d, x0, x1, top, bottom)."""
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    fnt = brand._font_at(wght)
    name = fnt.getBestCmap()[ord(ch)]
    s = cap / fnt['OS/2'].sCapHeight
    pen = SVGPathPen(fnt.getGlyphSet(), ntos=lambda v: f(v))
    fnt.getGlyphSet()[name].draw(TransformPen(pen, (s, 0, 0, -s, 0, 0)))
    g = fnt['glyf'][name]
    g.recalcBounds(fnt['glyf'])
    return pen.getCommands(), g.xMin * s, g.xMax * s, -g.yMax * s, -g.yMin * s


def opening(blocks, limit=3):
    return brand.lead(blocks, limit)


def para(blocks, k, pen, pal='dark'):
    """The opening as one stroke at scale k with an absolute pen; returns (svg, width, top) in tile units."""
    body, w = brand.line_body(blocks, k, pal, sw=pen / k)
    return body, w * k, -brand.LOOP_H * k


def tile(inner, size, ground, label):
    return (f'<svg viewBox="0 0 100 100" width="{size}" height="{size}" role="img" aria-label="{label}">'
            f'<rect width="100" height="100" rx="22.37" fill="{ground}"/>{inner}</svg>')


def pen_for(size, floor_px=1.5, base=4.2):
    return max(base, floor_px * 100 / size)


# ---------- the directions ----------
def current(name, blocks, size, ground):
    return brand.avatar_svg(blocks, size, ground=ground, name=name)


def stacked(name, blocks, size, ground, align='centre'):
    """Initial over its opening; one pen for both; the opening as wide as the letter or a little wider."""
    pen = pen_for(size)
    cap = 40
    wght = weight_for(pen / cap)
    d, x0, x1, top, bot = letter(name[0].upper(), wght, cap)
    lw = x1 - x0
    op = opening(blocks)
    w1 = brand.line_layout(op)[1]
    k = min(lw * 1.25 / w1, 22 / brand.LOOP_H)   # the paraph no taller than 22, about a quarter wider than the letter
    body, pw, ptop = para(op, k, pen)
    gap = 9
    total_h = (bot - top) + gap + (-ptop) + pen / 2
    y_cap = (100 - total_h) / 2 - 1.5 - top   # a touch above centre, where the eye puts the middle
    y_base = y_cap + bot + gap + (-ptop)
    lx = 50 - (x0 + x1) / 2
    px = 50 - pw / 2 if align == 'centre' else lx + x0
    return tile(f'<path fill="#fff" transform="translate({f(lx)} {f(y_cap)})" d="{d}"/>'
                f'<g transform="translate({f(px)} {f(y_base)})">{body}</g>', size, ground, name)


def stacked_left(name, blocks, size, ground):
    return stacked(name, blocks, size, ground, align='left')


def lockup(name, blocks, size, ground, first='line'):
    """One baseline, the loop as tall as the capital, the stem as wide as the pen: Iqaa's own lockup rule."""
    op = opening(blocks)
    w1 = brand.line_layout(op)[1]
    # solve in line units: cap = LOOP_H; the letter's width depends on its weight, which depends on the pen
    width_avail = 74
    k = 1.0
    for _ in range(4):
        pen = pen_for(size, base=4.0)
        wght = weight_for(pen / (brand.LOOP_H * k))
        d, x0, x1, top, bot = letter(name[0].upper(), wght, brand.LOOP_H * k)
        gap = brand.HANDOFF * 0.6 * k
        total = w1 * k + gap + (x1 - x0)
        k *= width_avail / total
    body, pw, ptop = para(op, k, pen)
    gap = brand.HANDOFF * 0.6 * k
    total = pw + gap + (x1 - x0)
    x = (100 - total) / 2
    base = 50 + brand.LOOP_H * k / 2 - 1
    if first == 'line':
        g = f'<g transform="translate({f(x)} {f(base)})">{body}</g>'
        g += f'<path fill="#fff" transform="translate({f(x + pw + gap - x0)} {f(base)})" d="{d}"/>'
    else:
        g = f'<path fill="#fff" transform="translate({f(x - x0)} {f(base)})" d="{d}"/>'
        g += f'<g transform="translate({f(x + (x1 - x0) + gap)} {f(base)})">{body}</g>'
    return tile(g, size, ground, name)


def signature(name, blocks, size, ground):
    return lockup(name, blocks, size, ground, first='letter')


def big_under(name, blocks, size, ground):
    """A large initial; its opening written underneath as a signature line, run out to the tile's edge."""
    pen = pen_for(size, base=4.4)
    cap = 44
    wght = weight_for(pen / cap)
    d, x0, x1, top, bot = letter(name[0].upper(), wght, cap)
    op = opening(blocks)
    k = 16 / brand.LOOP_H
    body, pw, ptop = para(op, k, pen)
    y_cap = 18 - top
    lx = 50 - (x0 + x1) / 2
    y_base = 86
    px = 50 - pw / 2
    # the run keeps going to both edges: the opening is a part of a line that does not stop at the tile
    lead_in = f'<path d="M-2 {f(y_base)}H{f(px)}" stroke="#fff" stroke-width="{f(pen)}" stroke-linecap="round" fill="none" opacity=".35"/>'
    tail = f'<path d="M{f(px + pw)} {f(y_base)}H102" stroke="#fff" stroke-width="{f(pen)}" stroke-linecap="round" fill="none" opacity=".35"/>'
    return tile(f'<path fill="#fff" transform="translate({f(lx)} {f(y_cap)})" d="{d}"/>{lead_in}{tail}'
                f'<g transform="translate({f(px)} {f(y_base)})">{body}</g>', size, ground, name)


DIRECTIONS = [
    ('now', 'Now', 'A typed letter at weight 600 over the opening at 0.78, a 3.4-unit pen', current),
    ('a', 'A · Monogram', 'The initial with the pen’s own stem, its opening under it, centred', stacked),
    ('b', 'B · Monogram, signed', 'The same, the opening starting under the letter’s left edge and trailing right', stacked_left),
    ('c', 'C · Lockup', 'One baseline like Iqaa’s lockup: the line runs into the initial', lockup),
    ('d', 'D · Signature', 'One baseline: the initial, then its line', signature),
    ('e', 'E · Signature line', 'A large initial over its opening, the line running on to both edges', big_under),
]
ORGS = [('Sufra', 'catering'), ('Raqm', 'software'), ('Kadr', 'video'), ('Wadi', 'catering'), ('Ithar', 'video')]
SIZES = [128, 64, 40, 32, 20]


def blocks_of(key):
    return [[s[0] for s in b['steps']] for b in LINES[key]['blocks']]


def sheet():
    rows = ''
    for key, title, note, fn in DIRECTIONS:
        cells = ''
        for org, line in ORGS:
            b = blocks_of(line)
            big = fn(org, b, 128, INK)
            small = ''.join(f'<span class="s">{fn(org, b, s, INK)}</span>' for s in SIZES[1:])
            side = f'<span class="side">{fn(org, b, 32, TILE_DARK)}<b>{org}</b></span>'
            cells += f'<div class="org"><div class="big">{big}</div><div class="smalls">{small}</div>{side}</div>'
        rows += f'<section id="{key}"><h2>{title}</h2><p>{note}</p><div class="orgs">{cells}</div></section>'
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Org mark directions</title>
<style>
@font-face {{ font-family: 'Atkinson Hyperlegible Next'; src: url('../../assets/fonts/atkinson.woff2') format('woff2'); font-weight: 200 800; }}
body {{ margin: 0; padding: 32px; font: 14px/1.4 'Atkinson Hyperlegible Next', system-ui, sans-serif; color: #19172E; background: #F4F3F8; }}
section {{ background: #fff; border: 1px solid #DCDAE6; border-radius: 16px; padding: 20px 24px; margin-block-end: 16px; }}
h2 {{ margin: 0; font-size: 16px; }} p {{ margin: 2px 0 16px; color: #4F4D63; }}
.orgs {{ display: flex; gap: 28px; flex-wrap: wrap; }}
.org {{ display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }}
.smalls {{ display: flex; align-items: flex-end; gap: 10px; }}
.s svg, .big svg, .side svg {{ display: block; }}
.side {{ display: flex; align-items: center; gap: 10px; padding: 8px 12px 8px 8px; border-radius: 10px; background: #19172E; color: #fff; }}
</style></head><body>{rows}</body></html>'''


if __name__ == '__main__':
    out = os.path.join(HERE, 'directions.html')
    open(out, 'w', encoding='utf-8').write(sheet())
    print(out)
