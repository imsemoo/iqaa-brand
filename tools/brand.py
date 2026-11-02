"""The signature grammar, the mark, the wordmark and every exported logo file — all from tokens.MARK.

python -I tools/brand.py   -> assets/brand/*.svg, favicon.svg
Imported by build.py for inline marks and lines.

A line is written as one continuous pen stroke on a baseline, left to right (right to left in Arabic):
  run     a step that runs by itself      a straight stroke, ink
  struck  a person does the work          a loop of the hand, violet
  held    waits for a person              an open arch, violet: a bridge waiting to be crossed
  rest    a timed wait                    the pen lifts: a dot between two short strokes, ink
  failed  a step that broke (product)     the stroke snaps, alert colour
Between stations the pen runs a short straight: the handoff. Iqaa's mark is its own stroke: it arrives
straight, a hand loops it once, and it leaves rising, in time.
"""
import functools
import io
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tokens import BRAND, MARK, NEUTRAL, RED, RED_DARK  # noqa: E402
import letters  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'brand')
FONT = os.path.join(ROOT, 'research', 'font-src', 'AtkinsonHyperlegibleNext[wght].ttf')

STEP, W, HANDOFF = MARK['step'], MARK['stroke'], MARK['handoff']
LOOP_H, ARCH_H = MARK['loop_h'], MARK['arch_h']
MW = MARK['mark_stroke']
B, GAP, OVER = STEP, 0, 0  # kept for callers that lay lines out
TOP, BOT = -(LOOP_H + W), 9  # vertical room a line needs above and below its baseline

PAL = {
    'light': {'run': BRAND['ink'], 'person': BRAND['violet'], 'alert': RED, 'test': NEUTRAL['500']},
    'dark': {'run': '#FFFFFF', 'person': BRAND['lilac'], 'alert': RED_DARK, 'test': NEUTRAL['400']},
    'ink': {'run': BRAND['ink'], 'person': BRAND['ink'], 'alert': BRAND['ink'], 'test': BRAND['ink']},
    'white': {'run': '#FFFFFF', 'person': '#FFFFFF', 'alert': '#FFFFFF', 'test': '#FFFFFF'},
}
SYMBOL = ['run', 'struck', 'flourish']
WORDS = {'run': 'runs by itself', 'held': 'waits for a person', 'struck': 'done by a person', 'rest': 'timed wait', 'failed': 'failed'}


def f(n):
    return f'{n:.3f}'.rstrip('0').rstrip('.')


# one step, as path data relative to its start on the baseline
SHAPES = {
    'run': 'h24',
    'struck': 'c10 0 18 -8 18 -18c0 -8 -6 -12 -10 -12c-6 0 -9 5 -8 12c2 12 10 18 24 18',
    'held': 'c3 -20 21 -20 24 0',
    'failed': 'h9l2 5m2 0l2 -5h9',
    'flourish': 'c8 0 14 -6 18 -16',
}
WIDTH = {'run': STEP, 'struck': STEP, 'held': STEP, 'rest': STEP, 'failed': STEP, 'flourish': 18}


def color(kind, pal):
    return pal['person'] if kind in ('struck', 'held') else pal['alert'] if kind == 'failed' else pal['run']


def scale_path(d, k):
    return re.sub(r'-?\d+(?:\.\d+)?', lambda m: f(float(m.group(0)) * k), d)


def cell(kind, x, y, pal, k=1.0, test=False, sw=None):
    """One step, starting at (x, y) on the baseline, in units scaled by k. Returns SVG elements."""
    w = (sw or W) * k
    col = pal['test'] if test else color(kind, pal)
    dash = f' stroke-dasharray="{f(w * 1.4)} {f(w * 1.4)}"' if test else ''
    if kind == 'rest':
        return (f'<path d="M{f(x * k)} {f(y * k)}h{f(4 * k)}M{f((x + 20) * k)} {f(y * k)}h{f(4 * k)}" fill="none" stroke="{col}" '
                f'stroke-width="{f(w)}" stroke-linecap="round"{dash}/><circle cx="{f((x + 12) * k)}" cy="{f(y * k)}" r="{f(w * 0.9)}" fill="{col}"/>')
    d = SHAPES[kind] if k == 1 else scale_path(SHAPES[kind], k)
    return (f'<path d="M{f(x * k)} {f(y * k)}{d}" fill="none" stroke="{col}" stroke-width="{f(w)}" stroke-linecap="round" '
            f'stroke-linejoin="round"{dash}/>')


def line_layout(blocks):
    """blocks: lists of kinds. Returns [(kind, x, block_index)] (handoffs included) and the width, in units."""
    out, x = [], 0.0
    for bi, steps in enumerate(blocks):
        if bi:
            out.append(('handoff', x, bi))
            x += HANDOFF
        for kind in steps:
            out.append((kind, x, bi))
            x += WIDTH[kind]
    return out, x


def line_body(blocks, k=1.0, pal='light', test=False, y=0.0, sw=None):
    cells, w = line_layout(blocks)
    p = PAL[pal]
    body = ''
    for kind, x, _ in cells:
        if kind == 'handoff':
            col = p['test'] if test else p['run']
            sww = (sw or W) * k
            dash = f' stroke-dasharray="{f(sww * 1.4)} {f(sww * 1.4)}"' if test else ''
            body += (f'<path d="M{f(x * k)} {f(y * k)}h{f(HANDOFF * k)}" fill="none" stroke="{col}" stroke-width="{f(sww)}" '
                     f'stroke-linecap="round"{dash}/>')
        else:
            body += cell(kind, x, y, p, k, test, sw)
    return body, w


def line_svg(blocks, k=1.0, pal='light', test=False, cls='sig', labels=None, label_color=None):
    body, w = line_body(blocks, k, pal, test)
    top, bot = TOP * k, BOT * k
    if labels:
        cells, _ = line_layout(blocks)
        starts = {}
        for kind, x, bi in cells:
            if kind != 'handoff':
                starts.setdefault(bi, x)
        col = label_color or NEUTRAL['700']
        # names alternate between two rows so a long name never runs into the next station's
        body += ''.join(f'<text x="{f(starts[i] * k)}" y="{f((BOT + 13 + (i % 2) * 13) * k)}" font-size="{f(11 * k)}" fill="{col}" '
                        f'font-family="Atkinson Hyperlegible Next, sans-serif">{n}</text>' for i, n in enumerate(labels))
        bot = (BOT + 31) * k
        # the last names may run past the pen's end ("Automatic release"): the drawing widens to hold them, at about
        # 0.56 em a character
        w = max(w, *(starts[i] + len(n) * 11 * 0.56 for i, n in enumerate(labels)))
    pad = W * k
    return (f'<svg class="{cls}" viewBox="{f(-pad)} {f(top)} {f(w * k + 2 * pad)} {f(bot - top)}" width="{f(w * k + 2 * pad)}" '
            f'height="{f(bot - top)}" role="img" aria-label="{describe(blocks)}">{body}</svg>')


def describe(blocks):
    return ' | '.join(', '.join(WORDS[k] for k in b) for b in blocks)


def rows_of(blocks, n_rows):
    """Split stations into rows of about equal stroke length, keeping each station whole."""
    if n_rows == 1:
        return [blocks]
    total = line_layout(blocks)[1]
    rows, cur, acc = [], [], 0.0
    for b in blocks:
        bw = line_layout([b])[1]
        if cur and acc + bw / 2 > total / n_rows and len(rows) < n_rows - 1:
            rows.append(cur)
            cur, acc = [], 0.0
        cur.append(b)
        acc += bw + HANDOFF
    rows.append(cur)
    return rows


def lead(blocks, limit=3):
    """The opening of a line, whole stations only, up to about `limit` steps: what fits under an initial."""
    out, n = [], 0
    for b in blocks:
        if out and n + len(b) > limit:
            break
        out.append(b[:limit])
        n += len(b[:limit])
    return out


# ---------- organization marks: the initial written in Iqaa's hand ----------
TILE_R = 22.37          # the app icon's corner, the curve iOS and macOS apply
INITIAL_CAP = 50        # the initial stands half the tile tall
INITIAL_LIFT = 1.5      # a touch above centre, where the eye puts the middle
PEN_RATIO = MW / LOOP_H  # Iqaa's pen against its loop: the hand is written with the mark's own weight


@functools.lru_cache(maxsize=None)
def hand():
    return letters.data()


def initial_body(ch, kinds, size, pal='dark'):
    """One capital in Iqaa's hand, written in the order its line opens: each step of the opening an equal share
    of the letter's length, in the colour of who does it. Partial strokes carry data-seg so the pen can write them."""
    p, L = PAL[pal], hand()[ch]
    k = INITIAL_CAP / letters.CAP
    pen = max(PEN_RATIO * INITIAL_CAP, 1.5 * 100 / size)   # never thinner than 1.5 px
    cx = ((L['x0'] + L['x1']) / 2 + L['cx']) / 2            # halfway between the box and the ink: optical centre
    cols = [p['person'] if kd in ('struck', 'held') else p['run'] for kd in kinds] or [p['run']]
    total = sum(L['len'])
    share = total / len(cols)
    runs = []
    for i, c in enumerate(cols):
        if runs and runs[-1][0] == c:
            runs[-1][2] = (i + 1) * share
        else:
            runs.append([c, i * share, (i + 1) * share])
    out, s = '', 0.0
    for d, ln in zip(L['d'], L['len']):
        e = s + ln
        for c, a, b in runs:
            lo, hi = max(a, s) - s, min(b, e) - s
            if hi - lo < 0.01:
                continue
            dash = ''
            if lo > 0.01 or hi < ln - 0.01:
                far = f(ln * 2)
                dash = f' data-seg="1" stroke-dasharray="{f(hi - lo)} {far}" stroke-dashoffset="{f(-lo)}"'
            out += f'<path d="{d}" fill="none" stroke="{c}"{dash}/>'
        s = e
    return (f'<g transform="translate({f(50 - cx * k)} {f(50 + INITIAL_CAP / 2 - INITIAL_LIFT)}) scale({f(k)})" '
            f'stroke-width="{f(pen / k)}" stroke-linecap="round" stroke-linejoin="round">{out}</g>')


def avatar_svg(blocks, size=40, label='', ground=BRAND['ink'], pal='dark', name=''):
    """An organization's mark. With a name: its initial in Iqaa's hand, written in the order its line opens.
    Without one: the whole line signed across the tile."""
    if name:
        ch = name.strip()[:1].upper()
        kinds = [kd for b in lead(blocks) for kd in b]
        lab = f' role="img" aria-label="{label}"' if label else ' aria-hidden="true"'
        if ch in hand():
            inner = initial_body(ch, kinds, size, pal)
        else:  # a script the hand does not write yet: the letter set in type, in the colour of the line's first step
            c = PAL[pal]['person'] if kinds[:1] and kinds[0] in ('struck', 'held') else PAL[pal]['run']
            inner = (f'<text x="50" y="68" text-anchor="middle" font-size="52" font-weight="600" fill="{c}" '
                     f'font-family="Atkinson Hyperlegible Next, Noto Sans Arabic, sans-serif">{ch}</text>')
        return (f'<svg class="avatar" viewBox="0 0 100 100" width="{size}" height="{size}"{lab}>'
                f'<rect width="100" height="100" rx="{TILE_R}" fill="{ground}"/>{inner}</svg>')
    steps = sum(len(b) for b in blocks)
    rows = rows_of(blocks, 1 if steps <= 6 else 2)
    widths = [line_layout(r)[1] for r in rows]
    gap = 10
    k = min(74 / max(widths), 70 / ((LOOP_H + W) * len(rows) + gap * (len(rows) - 1)))
    sw = max(W, 2.2 / k * (100 / size)) if size < 48 else W  # the pen stays visible at small sizes
    row_h = (LOOP_H + sw) * k
    total_h = row_h * len(rows) + gap * k * (len(rows) - 1)
    y0 = (100 - total_h) / 2 + LOOP_H * k + sw * k / 2
    body = ''
    for i, r in enumerate(rows):
        x0 = (100 - widths[i] * k) / 2
        b, _ = line_body(r, k, pal, sw=sw)
        body += f'<g transform="translate({f(x0)} {f(y0 + i * (row_h + gap * k))})">{b}</g>'
    lab = f' role="img" aria-label="{label}"' if label else ' aria-hidden="true"'
    return (f'<svg class="avatar" viewBox="0 0 100 100" width="{size}" height="{size}"{lab}>'
            f'<rect width="100" height="100" rx="{TILE_R}" fill="{ground}"/>{body}</svg>')


def fold_svg(kinds, k=2.0, pal='light', pad=0, cls='fold', label=None):
    """Kept for older callers: an organization's mark from one run of steps."""
    return avatar_svg([kinds], max(24, round(k * 20)), label or describe([kinds]))


# ---------- Iqaa's mark ----------
def symbol_body(pal='light', k=1.0, sw=None):
    p = PAL[pal]
    out, x = '', 0.0
    for kind in SYMBOL:
        out += cell(kind, x, 0, p, k, sw=sw or MW)
        x += WIDTH[kind]
    return out, x


def symbol_svg(pal='light', size=None, title='Iqaa'):
    body, w = symbol_body(pal)
    top = -(LOOP_H + MW / 2 + 1)
    vw, vh = w + 2 * MW, -top + MW
    dim = f' width="{size}" height="{f(size * vh / vw)}"' if size else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(-MW)} {f(top)} {f(vw)} {f(vh)}"{dim} role="img" '
            f'aria-label="{title}">{body}</svg>')


def app_icon_svg(px=1024, ground=BRAND['ink'], pal='dark'):
    """The mark on an ink tile. Small icons draw a heavier pen so the stroke stays at least 1.6 px wide; at 32 px
    and below the rising finish is dropped and the run and loop drawn larger, so the loop's counter stays open."""
    small = px <= 32
    kinds = ['run', 'struck'] if small else SYMBOL
    w = sum(WIDTH[kd] for kd in kinds)
    k = px * (0.76 if small else 0.62) / (w + 2 * MW)
    sw = max(MW, (1.4 if small else 1.6) / k)
    p, body, x = PAL[pal], '', 0.0
    for kd in kinds:
        body += cell(kd, x, 0, p, k, sw=sw)
        x += WIDTH[kd]
    h = (LOOP_H + sw) * k
    x0 = (px - w * k) / 2
    y0 = (px - h) / 2 + LOOP_H * k + sw * k / 2
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {px} {px}" width="{px}" height="{px}">'
            f'<rect width="{px}" height="{px}" rx="{f(px * 0.2237)}" fill="{ground}"/>'
            f'<g transform="translate({f(x0)} {f(y0)})">{body}</g></svg>')


def glyph_svg(kind, pal='light', size=24, test=False):
    """One step on its own, for legends and editor buttons."""
    body = cell(kind, 0, 0, PAL[pal], 1, test)
    w = WIDTH.get(kind, STEP)
    return (f'<svg viewBox="{f(-W)} {f(TOP)} {f(w + 2 * W)} {f(BOT - TOP)}" width="{size}" '
            f'height="{f(size * (BOT - TOP) / (w + 2 * W))}" aria-hidden="true">{body}</svg>')


def watar_svg(pal='light', size=None):
    """Watar's mark is the held arch: a string waiting to be struck. Everything Watar makes waits for a person."""
    body = cell('held', 0, 0, PAL[pal], 1, sw=MW)
    top = -(ARCH_H + MW)
    vw, vh = STEP + 2 * MW, -top + MW
    dim = f' width="{size}" height="{f(size * vh / vw)}"' if size else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(-MW)} {f(top)} {f(vw)} {f(vh)}"{dim} role="img" '
            f'aria-label="Watar">{body}</svg>')


# ---------- the wordmark ----------
@functools.lru_cache(maxsize=None)
def _font_at(wght):
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer
    font = instancer.instantiateVariableFont(TTFont(FONT), {'wght': wght})
    buf = io.BytesIO()
    font.save(buf)
    buf.seek(0)
    return TTFont(buf)


def _stem(font):
    gl = font['glyf']
    H = gl[font.getBestCmap()[ord('H')]]
    xs = sorted({round(x) for x, y in H.getCoordinates(gl)[0]})
    return xs[1] - xs[0]


def _q_depth(font):
    gl = font['glyf']
    q = gl[font.getBestCmap()[ord('q')]]
    q.recalcBounds(gl)
    return -q.yMin


@functools.lru_cache(maxsize=None)
def wordmark_weight():
    """The weight whose stem equals the mark's pen once the mark's loop stands as tall as the capitals.

    In the lockup the mark sits on the word's baseline and its loop reaches the cap height, so the pen is
    MARK_STROKE / LOOP_H of the cap height; the letters' stem is solved to match.
    """
    target = MW / LOOP_H
    lo, hi = 300, 800
    for _ in range(14):
        mid = (lo + hi) / 2
        fnt = _font_at(mid)
        if _stem(fnt) / fnt['OS/2'].sCapHeight < target:
            lo = mid
        else:
            hi = mid
    return round((lo + hi) / 2)


@functools.lru_cache(maxsize=None)
def wordmark_paths(text='Iqaa', wght=None):
    """Outlines of the word, y down, baseline at y = 0, cap height = LOOP_H units. Returns (d, width, lsb, wght)."""
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    wght = wght or wordmark_weight()
    fnt = _font_at(wght)
    cmap, gs = fnt.getBestCmap(), fnt.getGlyphSet()
    scale = LOOP_H / fnt['OS/2'].sCapHeight
    pen = SVGPathPen(gs, ntos=lambda v: f(v))
    x = 0
    for ch in text:
        name = cmap[ord(ch)]
        gs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x * scale, 0)))
        x += fnt['hmtx'][name][0]
    last = fnt['glyf'][cmap[ord(text[-1])]]
    last.recalcBounds(fnt['glyf'])
    rsb = fnt['hmtx'][cmap[ord(text[-1])]][0] - last.xMax
    first = fnt['glyf'][cmap[ord(text[0])]]
    first.recalcBounds(fnt['glyf'])
    return pen.getCommands(), (x - rsb) * scale, first.xMin * scale, wght


def depth_units():
    fnt = _font_at(wordmark_weight())
    return _q_depth(fnt) * LOOP_H / fnt['OS/2'].sCapHeight


def wordmark_svg(fill=BRAND['ink'], height=None):
    d, w, lsb, _ = wordmark_paths()
    top, bot = -LOOP_H - 1, depth_units() + 1
    H = bot - top
    dim = f' height="{height}" width="{f(height * (w - lsb) / H)}"' if height else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(lsb)} {f(top)} {f(w - lsb)} {f(H)}"{dim} role="img" '
            f'aria-label="Iqaa"><path fill="{fill}" d="{d}"/></svg>')


def lockup_svg(pal='light', height=None, descriptor=None):
    """The mark runs on the word's baseline into the name, its loop as tall as the capitals."""
    d, ww, lsb, _ = wordmark_paths()
    body, sw = symbol_body(pal)
    word_x = sw + MW + HANDOFF * 0.6 - lsb
    total = word_x + ww
    fill = '#fff' if pal in ('dark', 'white') else BRAND['ink']
    top, bot = -LOOP_H - MW, depth_units() + 1
    extra = ''
    if descriptor:
        extra = (f'<text x="{f(total + HANDOFF)}" y="0" font-family="Atkinson Hyperlegible Next, sans-serif" '
                 f'font-size="{f(LOOP_H * 0.95)}" font-weight="400" fill="{fill}">{descriptor}</text>')
        total += HANDOFF + len(descriptor) * LOOP_H * 0.5
    H = bot - top
    dim = f' height="{height}" width="{f(height * (total + 2 * MW) / H)}"' if height else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(-MW)} {f(top)} {f(total + 2 * MW)} {f(H)}"{dim} role="img" aria-label="Iqaa">'
            f'{body}<path fill="{fill}" transform="translate({f(word_x)} 0)" d="{d}"/>{extra}</svg>')


def export():
    os.makedirs(OUT, exist_ok=True)
    for old in os.listdir(OUT):
        if old.endswith('.svg'):
            os.remove(os.path.join(OUT, old))
    files = {
        'iqaa-symbol.svg': symbol_svg('light'),
        'iqaa-symbol-on-ink.svg': symbol_svg('dark'),
        'iqaa-symbol-ink.svg': symbol_svg('ink'),
        'iqaa-symbol-white.svg': symbol_svg('white'),
        'iqaa-wordmark.svg': wordmark_svg(BRAND['ink']),
        'iqaa-wordmark-white.svg': wordmark_svg('#FFFFFF'),
        'iqaa-lockup.svg': lockup_svg('light'),
        'iqaa-lockup-on-ink.svg': lockup_svg('dark'),
        'iqaa-lockup-ink.svg': lockup_svg('ink'),
        'iqaa-lockup-white.svg': lockup_svg('white'),
        'iqaa-app-icon.svg': app_icon_svg(1024),
        'iqaa-app-icon-180.svg': app_icon_svg(180),
        'iqaa-favicon-32.svg': app_icon_svg(32),
        'iqaa-favicon-16.svg': app_icon_svg(16),
        'watar-mark.svg': watar_svg('light'),
        'watar-mark-on-ink.svg': watar_svg('dark'),
    }
    for name, svg in files.items():
        with open(os.path.join(OUT, name), 'w', encoding='utf-8') as fh:
            fh.write(svg + '\n')
    with open(os.path.join(ROOT, 'favicon.svg'), 'w', encoding='utf-8') as fh:
        fh.write(app_icon_svg(32) + '\n')
    return files


if __name__ == '__main__':
    print('wordmark weight', wordmark_weight())
    print('files', list(export()))
