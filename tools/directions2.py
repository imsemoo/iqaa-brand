"""Round 3: three new directions for the line grammar, after the squares-and-circles grammar was turned down.

python -I tools/directions2.py   -> research/directions-2.html (view on the preview server)

Every direction keeps the idea that held: a line is written as steps, a person's step is told apart from a
machine's by shape and by violet, and every organization's line becomes its signature. Only the drawing changes.
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INK, V, N3, N7 = '#19172E', '#8845F8', '#B5B2C2', '#4F4D63'
LINE = [[s[0] for s in b['steps']] for b in json.load(open(os.path.join(ROOT, 'tools', 'lines.json'), encoding='utf-8'))['lines']['catering']['blocks']]
f = lambda n: f'{n:.2f}'.rstrip('0').rstrip('.')


# ---------- A · the signature: one continuous pen line ----------
# run: a straight stroke · struck: a hand's loop · held: an open arch, a bridge waiting to be crossed
# rest: the pen lifts, a dot · handoff: a longer straight between stations
LOOP = 'c10 0 18 -8 18 -18c0 -8 -6 -12 -10 -12c-6 0 -9 5 -8 12c2 12 10 18 24 18'
ARCH = 'c3 -20 21 -20 24 0'


def signature(blocks, sw=3.2):
    x, out = 0.0, []
    for bi, steps in enumerate(blocks):
        if bi:
            out.append((INK, f'M{f(x)} 0h14'))
            x += 14
        for k in steps:
            if k == 'run':
                out.append((INK, f'M{f(x)} 0h22')); x += 22
            elif k == 'struck':
                out.append((V, f'M{f(x)} 0{LOOP}')); x += 24
            elif k == 'held':
                out.append((V, f'M{f(x)} 0{ARCH}')); x += 24
            elif k == 'rest':
                out.append(('dot', f'{f(x + 9)}')); x += 18
    paths = ''.join(
        f'<circle cx="{d}" cy="0" r="{f(sw * 0.9)}" fill="{INK}"/>' if col == 'dot'
        else f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/>'
        for col, d in out)
    return paths, x


def a_mark(size, sw=4.6):
    # Iqaa's own stroke: it arrives straight, a hand loops it once, and it leaves rising, in time
    d1 = 'M4 34h14'
    d2 = f'M18 34{LOOP}'
    d3 = 'M42 34c8 0 14 -6 18 -16'
    return (f'<svg viewBox="0 0 64 48" width="{size}" height="{size * 48 / 64:.0f}" aria-hidden="true">'
            f'<path d="{d1}" fill="none" stroke="{INK}" stroke-width="{sw}" stroke-linecap="round"/>'
            f'<path d="{d2}" transform="translate(0 0)" fill="none" stroke="{V}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="{d3}" fill="none" stroke="{INK}" stroke-width="{sw}" stroke-linecap="round"/></svg>')


# ---------- B · nuqta and kashida: the line is a stretched baseline, steps are pen dots ----------
# a calligrapher's dot is a rhombus cut by the nib. person: above the line, violet · machine: below, ink
# held: an open rhombus above, waiting for a hand · rest: a small dot on the line · stations: separate strokes
def rhombus(cx, cy, r, fill=None, stroke=None, sw=1.6):
    pts = f'{f(cx)},{f(cy - r)} {f(cx + r)},{f(cy)} {f(cx)},{f(cy + r)} {f(cx - r)},{f(cy)}'
    if stroke:
        return f'<polygon points="{pts}" fill="none" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"/>'
    return f'<polygon points="{pts}" fill="{fill}"/>'


def kashida(x0, x1, h=4.2):
    # a stroke that swells in the middle and tapers at both ends, like a pen's stretch
    m = (x0 + x1) / 2
    return (f'<path d="M{f(x0)} 0Q{f(m)} {-h} {f(x1)} 0Q{f(m)} {h * 0.6} {f(x0)} 0Z" fill="{INK}"/>')


def nuqta(blocks, step=18, r=5.4):
    x, out = 0.0, ''
    for bi, steps in enumerate(blocks):
        if bi:
            x += 10
        x0 = x
        for k in steps:
            cx = x + step / 2
            if k == 'struck':
                out += rhombus(cx, -11, r, fill=V)
            elif k == 'run':
                out += rhombus(cx, 11, r, fill=INK)
            elif k == 'held':
                out += rhombus(cx, -11, r - 0.8, stroke=V)
            elif k == 'rest':
                out += rhombus(cx, 0, r * 0.45, fill='#fff')
            x += step
        out = kashida(x0, x) + out
    return out, x


def b_mark(size):
    # the dots of إيقاع: ق carries two above, ي two below; here they ride one stretched stroke
    body = kashida(4, 60, 5.2)
    body += rhombus(22, -13, 6.4, fill=V) + rhombus(36, -13, 6.4, fill=V)
    body += rhombus(30, 13, 6.4, fill=INK) + rhombus(44, 13, 6.4, fill=INK)
    return f'<svg viewBox="0 -24 64 48" width="{size}" height="{size * 48 / 64:.0f}" aria-hidden="true">{body}</svg>'


# ---------- C · the weave: the job is a thread passing through the stations ----------
# each step is a warp thread the job crosses. person: the violet thread passes over · machine: it passes under
# held: over, but left loose (a gap in the thread) · rest: a slack stitch · stations: wider spacing
def weave(blocks, gap=16, sw=4.2, warp=26):
    x, segs, warps = 8.0, [], []
    for bi, steps in enumerate(blocks):
        if bi:
            x += 10
        for k in steps:
            warps.append((x, k))
            x += gap
    d = ''
    # the weft runs the whole width; under-crossings cut it where the warp passes over
    cuts = [wx for wx, k in warps if k == 'run']
    pos, end = 0.0, x
    for wx in cuts:
        segs.append((pos, wx - 5))
        pos = wx + 5
    segs.append((pos, end))
    weft = ''.join(f'<path d="M{f(a)} 0H{f(b)}" stroke="{V}" stroke-width="{sw}" stroke-linecap="round"/>' for a, b in segs if b > a)
    w = ''
    for wx, k in warps:
        if k == 'run':      # warp over the weft: continuous
            w += f'<path d="M{f(wx)} {-warp / 2}V{warp / 2}" stroke="{INK}" stroke-width="{sw}" stroke-linecap="round"/>'
        elif k == 'struck':  # weft over the warp: the warp is cut
            w += (f'<path d="M{f(wx)} {-warp / 2}V-5M{f(wx)} 5V{warp / 2}" stroke="{INK}" stroke-width="{sw}" stroke-linecap="round"/>')
        elif k == 'held':    # a loose crossing, waiting to be tied
            w += (f'<path d="M{f(wx)} {-warp / 2}V-7M{f(wx)} 7V{warp / 2}" stroke="{N3}" stroke-width="{sw}" stroke-linecap="round"/>')
        else:
            w += f'<path d="M{f(wx)} {-warp / 4}V{warp / 4}" stroke="{N3}" stroke-width="{sw * 0.6}" stroke-linecap="round"/>'
    return weft_order(w, weft, warps), x + 8


def weft_order(w, weft, warps):
    # draw warps that pass under the weft first, then the weft, then warps that pass over it
    return w + weft


def c_mark(size):
    sw = 6
    body = ''
    # three warps; the thread goes over, under, over: one stitch of work passing through three hands
    body += f'<path d="M14 6V20M14 32V42" stroke="{INK}" stroke-width="{sw}" stroke-linecap="round"/>'
    body += f'<path d="M50 6V20M50 32V42" stroke="{INK}" stroke-width="{sw}" stroke-linecap="round"/>'
    body += f'<path d="M4 26H26M38 26H60" stroke="{V}" stroke-width="{sw}" stroke-linecap="round"/>'
    body += f'<path d="M32 6V42" stroke="{INK}" stroke-width="{sw}" stroke-linecap="round"/>'
    return f'<svg viewBox="0 0 64 48" width="{size}" height="{size * 48 / 64:.0f}" aria-hidden="true">{body}</svg>'


def line_svg(kind, k=2.2):
    if kind == 'a':
        body, w = signature(LINE)
        vb = f'-4 -34 {f(w + 8)} 40'
    elif kind == 'b':
        body, w = nuqta(LINE)
        vb = f'-2 -20 {f(w + 4)} 40'
    else:
        body, w = weave(LINE)
        vb = f'0 -16 {f(w)} 32'
    W = float(vb.split()[2])
    return f'<svg viewBox="{vb}" width="{f(W * k)}" aria-hidden="true" style="max-width:100%;height:auto">{body}</svg>'


def panel(key, title, ar, idea, mark, notes):
    sizes = ''.join(f'<div class="sz">{mark(px)}<span>{px}px</span></div>' for px in (64, 32, 20))
    lock = f'<div class="lock">{mark(44)}<span>Iqaa</span></div>'
    li = ''.join(f'<li>{n}</li>' for n in notes)
    return f'''<section class="pn">
<header><p class="k">{key}</p><h2>{title} <span lang="ar" dir="rtl">{ar}</span></h2><p class="idea">{idea}</p></header>
<div class="hero">{mark(220)}</div>
<div class="row">{sizes}{lock}</div>
<div class="lines"><p class="cap">Sufra’s catering line, written in it</p>{line_svg(key[0].lower())}</div>
<ul>{li}</ul>
</section>'''


def page():
    a = panel('A · Recommended', 'The signature', 'التوقيع',
              'One continuous pen line. A step that runs by itself is a straight stroke; a person’s step is a loop of the hand; a wait for a person is an open arch. Every line literally signs its own name.',
              a_mark, ['Most ownable: no automation brand draws a hand’s stroke.', 'Survives 16 px as one line with one loop.', 'Mirrors cleanly for Arabic: the pen simply runs right to left.', 'Risk: a loop can read as a cursive l; kept to one loop in the mark.'])
    b = panel('B', 'Nuqta and kashida', 'النقطة والتطويل',
              'From Arabic calligraphy: the line is a stretched baseline, and the steps are the calligrapher’s rhombus dots — above the line for a person, below it for a machine. The mark carries the dots of إيقاع itself.',
              b_mark, ['Deepest Arabic root; a quiet, typographic look.', 'Dots read clearly from 20 px up.', 'Risk: two dots and a dash can read as ÷ at a glance.', 'Latin readers see pattern, not meaning.'])
    c = panel('C', 'The weave', 'النول',
              'The job is a violet thread passing through the stations: over a warp when a person works it, under when a machine does. The mark is one stitch through three hands.',
              c_mark, ['Strong image of many hands making one thing.', 'Ties to the region’s weaving and embroidery.', 'Risk: three verticals and a cross-bar can read as a hash or a ladder.', 'Weakest at 16 px.'])
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Iqaa · three new directions</title>
<style>
@font-face {{ font-family: 'Atkinson Hyperlegible Next'; src: url('../assets/fonts/atkinson.woff2') format('woff2'); font-weight: 300 800; }}
*{{box-sizing:border-box}} body{{margin:0;background:#F5F4FA;color:{INK};font:16px/1.5 'Atkinson Hyperlegible Next',system-ui,sans-serif}}
main{{max-width:1440px;margin:0 auto;padding:48px 40px 64px}}
h1{{font-size:31px;line-height:40px;margin:0 0 8px;font-weight:600}} .sub{{color:{N7};margin:0 0 32px;max-width:72ch}}
.grid{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}}
@media (max-width:1000px){{.grid{{grid-template-columns:minmax(0,1fr)}}}}
.pn{{background:#fff;border:1px solid #D0CDDB;border-radius:16px;padding:28px;display:flex;flex-direction:column;gap:20px;min-width:0}}
.k{{margin:0;font-size:13px;font-weight:700;color:{N7}}} h2{{margin:2px 0 6px;font-size:25px;line-height:32px;font-weight:600}} h2 span{{font-weight:400;color:{N7};font-size:22px}}
.idea{{margin:0;color:{N7};font-size:15px;line-height:22px}}
.hero{{display:grid;place-items:center;min-height:220px;background:#F5F4FA;border-radius:12px}}
.row{{display:flex;align-items:flex-end;gap:20px;flex-wrap:wrap}} .sz{{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px;color:{N7}}}
.lock{{display:flex;align-items:center;gap:10px;margin-inline-start:auto}} .lock span{{font-size:30px;line-height:1}}
.lines{{display:flex;flex-direction:column;gap:10px;padding-top:16px;border-top:1px solid #ECE9F5}} .cap{{margin:0;font-size:13px;font-weight:700;color:{N7}}}
ul{{margin:0;padding-inline-start:18px;font-size:14px;line-height:21px;color:{N7};display:flex;flex-direction:column;gap:4px}}
</style></head><body><main>
<h1>Three new ways to draw the line</h1>
<p class="sub">The idea stays: a line is written as steps, a person’s step differs from a machine’s by shape and by violet, and every organization’s line becomes its signature. Only the drawing changes. Below each mark: the same catering line as before, written in that direction.</p>
<div class="grid">{a}{b}{c}</div>
</main></body></html>'''


if __name__ == '__main__':
    with open(os.path.join(ROOT, 'research', 'directions-2.html'), 'w', encoding='utf-8') as fh:
        fh.write(page())
    print('ok')
