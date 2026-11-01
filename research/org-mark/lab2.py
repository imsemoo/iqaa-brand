"""Round two: the initial written with Iqaa's pen, as one drawn object, against the current mark.

python -I research/org-mark/lab2.py  ->  research/org-mark/directions2.html
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import brand  # noqa: E402

f = brand.f
INK, TILE_DARK = brand.BRAND['ink'], '#39374D'
LILAC, WHITE = brand.BRAND['lilac'], '#FFFFFF'
LINES = json.load(open(os.path.join(ROOT, 'tools', 'lines.json'), encoding='utf-8'))['lines']
RATIO = brand.MW / brand.LOOP_H   # Iqaa's pen against its loop: 4.6 / 30

# skeletons on a cap height of 30, baseline at 0, y down; written in the order a hand writes them
SKEL = {
    'S': ('M16.6 -25.2C15 -28.6 12.4 -30 9 -30C4.6 -30 1.6 -27.4 1.6 -23.1C1.6 -18.6 5.4 -17.2 9.2 -16'
          'C13.4 -14.7 16.8 -13 16.8 -7.6C16.8 -2.9 13.4 0 9 0C5.2 0 2.4 -1.7 1 -4.9', 0, 18),
    'R': ('M0 0V-30H9.2A7.6 7.6 0 0 1 9.2 -14.8H0M8.4 -14.8L18 0', 0, 18),
    'K': ('M0 -30V0M17.6 -30L1.2 -12.6M6.6 -18.2L18 0', 0, 18),
    'W': ('M0 -30L7.4 0L15 -26L22.6 0L30 -30', 0, 30),
    'I': ('M-5 -30H5M0 -30V0M-5 0H5', -5, 5),
}


def blocks_of(key):
    return [[s[0] for s in b['steps']] for b in LINES[key]['blocks']]


def tile(inner, size, ground, label):
    return (f'<svg viewBox="0 0 100 100" width="{size}" height="{size}" role="img" aria-label="{label}">'
            f'<rect width="100" height="100" rx="22.37" fill="{ground}"/>{inner}</svg>')


def scaled(d, k):
    return brand.scale_path(d, k)


def pen_at(size, cap):
    # the brand's ratio, held to at least 1.5 px so it survives small sizes
    return max(RATIO * cap, 1.5 * 100 / size)


def letter_g(ch, cap, size, ox, oy, segments):
    """The skeleton written with the pen; `segments` is a list of colours, each an equal share of its length."""
    d, x0, x1 = SKEL[ch]
    k = cap / 30
    pen = pen_at(size, cap)
    path = scaled(d, k)
    out = f'<path d="{path}" transform="translate({f(ox)} {f(oy)})" fill="none" stroke="{segments[-1]}" stroke-width="{f(pen)}" stroke-linecap="round" stroke-linejoin="round"/>'
    n = len(segments)
    # earlier colours drawn over the later ones, each from the start of the pen to the end of its share
    for i in range(n - 2, -1, -1):
        upto = 100 * (i + 1) / n
        out += (f'<path d="{path}" transform="translate({f(ox)} {f(oy)})" pathLength="100" stroke-dasharray="{f(upto)} 200" fill="none" '
                f'stroke="{segments[i]}" stroke-width="{f(pen)}" stroke-linecap="round" stroke-linejoin="round"/>')
    return out


def colours(blocks):
    op = brand.lead(blocks, 3)
    kinds = [k for b in op for k in b]
    return [LILAC if k in ('struck', 'held') else WHITE for k in kinds]


def two_tone(name, blocks, size, ground):
    ch = name[0].upper()
    cap = 50
    d, x0, x1 = SKEL[ch]
    k = cap / 30
    ox = 50 - (x0 + x1) * k / 2
    oy = 50 + cap / 2 - 1.5
    return tile(letter_g(ch, cap, size, ox, oy, colours(blocks)), size, ground, name)


def white_letter(name, blocks, size, ground):
    ch = name[0].upper()
    cap = 50
    d, x0, x1 = SKEL[ch]
    k = cap / 30
    return tile(letter_g(ch, cap, size, 50 - (x0 + x1) * k / 2, 50 + cap / 2 - 1.5, [WHITE]), size, ground, name)


def mono_over_opening(name, blocks, size, ground):
    """The drawn initial over its opening, both with the same pen."""
    ch = name[0].upper()
    cap = 36
    d, x0, x1 = SKEL[ch]
    k = cap / 30
    pen = pen_at(size, cap)
    op = brand.lead(blocks, 3)
    w1 = brand.line_layout(op)[1]
    kp = 0.78
    body, _ = brand.line_body(op, kp, 'dark', sw=pen / kp)
    pw = w1 * kp
    total = cap + 9 + brand.LOOP_H * kp
    top = (100 - total) / 2 - 1
    g = letter_g(ch, cap, size, 50 - (x0 + x1) * k / 2, top + cap, [WHITE])
    g += f'<g transform="translate({f(50 - pw / 2)} {f(top + total)})">{body}</g>'
    return tile(g, size, ground, name)


def current(name, blocks, size, ground):
    return brand.avatar_svg(blocks, size, ground=ground, name=name)


DIRECTIONS = [
    ('now', 'Now', 'A typed letter over the opening', current),
    ('f', 'F · The drawn initial over its opening', 'The letter drawn as one stroke with the same pen as its opening', mono_over_opening),
    ('g', 'G · The initial in the order its line runs', 'One stroke, Iqaa’s pen ratio (0.153 of the height); each step of the opening an equal share of the letter, violet where a person does it', two_tone),
    ('h', 'H · The drawn initial alone', 'For comparison: the same letter in white only', white_letter),
]
ORGS = [('Sufra', 'catering'), ('Raqm', 'software'), ('Kadr', 'video'), ('Wadi', 'catering'), ('Ithar', 'video')]
SIZES = [64, 40, 32, 20]


def sheet():
    rows = ''
    for key, title, note, fn in DIRECTIONS:
        cells = ''
        for org, line in ORGS:
            b = blocks_of(line)
            small = ''.join(f'<span>{fn(org, b, s, INK)}</span>' for s in SIZES)
            side = f'<span class="side">{fn(org, b, 32, TILE_DARK)}<b>{org}</b></span>'
            cells += f'<div class="org"><div>{fn(org, b, 128, INK)}</div><div class="smalls">{small}</div>{side}</div>'
        rows += f'<section id="{key}"><h2>{title}</h2><p>{note}</p><div class="orgs">{cells}</div></section>'
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Org mark, round two</title>
<style>
@font-face {{ font-family: 'Atkinson Hyperlegible Next'; src: url('../../assets/fonts/atkinson.woff2') format('woff2'); font-weight: 200 800; }}
body {{ margin: 0; padding: 32px; font: 14px/1.4 'Atkinson Hyperlegible Next', system-ui, sans-serif; color: #19172E; background: #F4F3F8; }}
section {{ background: #fff; border: 1px solid #DCDAE6; border-radius: 16px; padding: 20px 24px; margin-block-end: 16px; }}
h2 {{ margin: 0; font-size: 16px; }} p {{ margin: 2px 0 16px; color: #4F4D63; }}
.orgs {{ display: flex; gap: 28px; flex-wrap: wrap; }}
.org {{ display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }}
.smalls {{ display: flex; align-items: flex-end; gap: 10px; }}
svg {{ display: block; }}
.side {{ display: flex; align-items: center; gap: 10px; padding: 8px 12px 8px 8px; border-radius: 10px; background: #19172E; color: #fff; }}
</style></head><body>{rows}</body></html>'''


if __name__ == '__main__':
    out = os.path.join(HERE, 'directions2.html')
    open(out, 'w', encoding='utf-8').write(sheet())
    print(out)
