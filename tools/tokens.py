"""Every number of the identity, computed from a few constants. Writes the token files the pages and code read.

python -I tools/tokens.py
  -> assets/tokens/iqaa.tokens.json   (the source of truth, also the developer handoff)
  -> assets/css/tokens.css            (the same as CSS custom properties)

Constants and why (each is argued on decisions.html):
  BEAT_PX  16   the interface beat; every space is a quarter-beat multiple
  TEMPO    100  BPM; its quarter and half beats land on 150 ms and 300 ms
  RATIO    1.25 the type scale; gives five usable steps between 13 and 31 px
"""
import io
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from color import contrast, hex_oklch, oklch_hex, rgb_cmyk, rgb_hsl, hex_rgb  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

BEAT_PX = 16
TEMPO = 100
RATIO = 1.25

# ---------- colour ----------
BRAND = {'violet': '#8845F8', 'lilac': '#C9A4FF', 'ink': '#19172E', 'lavender': '#ECE9F5', 'white': '#FFFFFF'}

# The cool neutral ramp: lavender is step 100 and ink step 950, both the client's own colours; the steps between
# are spaced evenly in OKLCH lightness, with chroma and hue moving linearly from one end to the other.
L1, C1, H1 = hex_oklch(BRAND['lavender'])
L9, C9, H9 = hex_oklch(BRAND['ink'])
NEUTRAL = {'0': '#FFFFFF'}
L0 = 1.0
NEUTRAL['50'] = oklch_hex((L0 + L1) / 2, C1 / 2, H1)
for step in (100, 200, 300, 400, 500, 600, 700, 800, 900, 950):
    t = (step - 100) / 850
    NEUTRAL[str(step)] = oklch_hex(L1 + t * (L9 - L1), C1 + t * (C9 - C1), H1 + t * (H9 - H1))
NEUTRAL['100'] = BRAND['lavender']
NEUTRAL['950'] = BRAND['ink']

# Failed and late share one alert colour, drawn at the violet's own lightness and chroma so it is exactly as
# loud as a person and never louder. On ink it takes the lilac's lightness, as violet does.
VL, VC, _ = hex_oklch(BRAND['violet'])
LL, LC, _ = hex_oklch(BRAND['lilac'])
ALERT_HUE = 25
RED = oklch_hex(VL, VC, ALERT_HUE)
RED_DARK = oklch_hex(LL, LC, ALERT_HUE)

SEMANTIC_LIGHT = {
    'ground': NEUTRAL['0'], 'ground-quiet': NEUTRAL['50'], 'fill': NEUTRAL['100'],
    'rule': NEUTRAL['200'], 'rule-strong': NEUTRAL['400'],
    'text': NEUTRAL['950'], 'text-2': NEUTRAL['700'], 'text-3': None,
    'machine': NEUTRAL['950'], 'person': BRAND['violet'], 'alert': RED, 'test': NEUTRAL['500'],
}
SEMANTIC_DARK = {
    'ground': NEUTRAL['950'], 'ground-quiet': NEUTRAL['900'], 'fill': NEUTRAL['800'],
    'rule': NEUTRAL['800'], 'rule-strong': NEUTRAL['600'],
    'text': NEUTRAL['100'], 'text-2': NEUTRAL['300'], 'text-3': None,
    'machine': NEUTRAL['0'], 'person': BRAND['lilac'], 'alert': RED_DARK, 'test': NEUTRAL['400'],
}


def lightest_text(ground, reverse=False):
    """The lightest (or, on dark, the darkest) neutral that still passes 4.5:1 on this ground."""
    steps = [s for s in NEUTRAL if s not in ('0',)]
    steps = sorted(steps, key=int, reverse=reverse)
    passing = [s for s in steps if contrast(NEUTRAL[s], ground) >= 4.5]
    if not passing:
        return None
    return passing[0] if not reverse else passing[0]


SEMANTIC_LIGHT['text-3'] = NEUTRAL[lightest_text(NEUTRAL['50'])]
SEMANTIC_DARK['text-3'] = NEUTRAL[lightest_text(NEUTRAL['900'], reverse=True)]

TEXTS = ['ink', 'n700', 'n600', 'n500', 'violet', 'red', 'white', 'lilac', 'lavender', 'red-dark', 'n300', 'n400']
GROUNDS = ['white', 'n50', 'lavender', 'ink', 'n900']
SWATCH = {'ink': BRAND['ink'], 'violet': BRAND['violet'], 'lilac': BRAND['lilac'], 'lavender': BRAND['lavender'],
          'white': '#FFFFFF', 'red': RED, 'red-dark': RED_DARK}
SWATCH.update({f'n{k}': v for k, v in NEUTRAL.items()})


def matrix():
    out = []
    for t in TEXTS:
        row = []
        for g in GROUNDS:
            r = contrast(SWATCH[t], SWATCH[g])
            row.append({'text': t, 'ground': g, 'ratio': round(r, 2),
                        'grade': 'AAA' if r >= 7 else 'AA' if r >= 4.5 else 'Large' if r >= 3 else 'Fail'})
        out.append(row)
    return out


def describe(h):
    L, C, H = hex_oklch(h)
    r, g, b = (round(c * 255) for c in hex_rgb(h))
    return {'hex': h, 'rgb': f'{r} {g} {b}', 'hsl': '{} {}% {}%'.format(*rgb_hsl(h)),
            'oklch': f'{L * 100:.1f}% {C:.3f} {H:.1f}', 'cmyk': '{} {} {} {}'.format(*rgb_cmyk(h)),
            'on_white': round(contrast(h, '#FFFFFF'), 2), 'on_ink': round(contrast(h, BRAND['ink']), 2)}


# ---------- type ----------
def type_scale():
    names = ['sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl']
    out = {}
    for i, n in enumerate(names):
        size = BEAT_PX * RATIO ** (i - 1)
        px = round(size)
        lh_factor = 1.5 if px <= 20 else 1.3 if px <= 31 else 1.12
        lh = math.ceil(px * lh_factor / 4) * 4  # snap up to the quarter-beat grid
        track = 0 if px < 31 else round(-0.01 - 0.01 * (i - 5) / 4, 3)
        out[n] = {'size': px, 'line': lh, 'track_em': max(track, -0.03)}
    return out


def stem_em():
    """Atkinson Hyperlegible Next Regular, the stem of H: the icon stroke follows it."""
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer
    f = TTFont(os.path.join(ROOT, 'research', 'font-src', 'AtkinsonHyperlegibleNext[wght].ttf'))
    f = instancer.instantiateVariableFont(f, {'wght': 400})
    buf = io.BytesIO()
    f.save(buf)
    buf.seek(0)
    f = TTFont(buf)
    g = f['glyf'][f.getBestCmap()[ord('H')]]
    xs = sorted({round(x) for x, y in g.getCoordinates(f['glyf'])[0]})
    return (xs[1] - xs[0]) / f['head'].unitsPerEm


# ---------- motion ----------
BEAT_MS = round(60000 / TEMPO)
MOTION = {
    'tempo_bpm': TEMPO, 'beat': BEAT_MS, 'eighth': BEAT_MS // 8, 'quarter': BEAT_MS // 4, 'half': BEAT_MS // 2,
    'bar': BEAT_MS * 4,
    'ease_arrive': 'cubic-bezier(0.2, 0, 0, 1)',
    'ease_leave': 'cubic-bezier(0.4, 0, 1, 1)',
    'ease_move': 'cubic-bezier(0.4, 0, 0.2, 1)',
}

# ---------- the signature grammar (in units; a step is 24 units wide, one beat of the line) ----------
MARK = {
    'step': 24,          # every step takes one step-width of the line
    'stroke': 3.2,       # the pen of a line: 2/15 of a step
    'handoff': 12,       # half a step of straight between stations
    'loop_h': 30,        # a person's loop rises a step and a quarter
    'arch_h': 15,        # a held arch rises half the loop
    'mark_stroke': 4.6,  # Iqaa's own mark is drawn with a heavier pen, so it holds at 16 px
}

SPACE = {str(n): n * BEAT_PX // 4 for n in (1, 2, 3, 4, 6, 8, 12, 16, 24, 32)}


def radius(h):
    """Corner radius of a control or panel of height h: a quarter of a beat per beat of height, capped."""
    return min(round(h / 4), 16)


def build():
    stem = stem_em()
    icon_stroke = round(stem * BEAT_PX * 4) / 4
    tokens = {
        'brand': {k: describe(v) for k, v in BRAND.items()},
        'neutral': NEUTRAL,
        'alert': {'light': describe(RED), 'dark': describe(RED_DARK), 'hue': ALERT_HUE},
        'semantic': {'light': SEMANTIC_LIGHT, 'dark': SEMANTIC_DARK},
        'contrast': matrix(),
        'type': {'family': {'sans': 'Atkinson Hyperlegible Next', 'mono': 'Fragment Mono'},
                 'ratio': RATIO, 'scale': type_scale(), 'stem_em': round(stem, 4)},
        'space': {'beat': BEAT_PX, 'scale': SPACE},
        'radius': {'control_32': radius(32), 'control_40': radius(40), 'control_48': radius(48), 'panel_max': 16},
        'icon': {'grid': 24, 'stroke': icon_stroke},
        'motion': MOTION,
        'mark': MARK,
    }
    os.makedirs(os.path.join(ROOT, 'assets', 'tokens'), exist_ok=True)
    with open(os.path.join(ROOT, 'assets', 'tokens', 'iqaa.tokens.json'), 'w', encoding='utf-8') as f:
        json.dump(tokens, f, ensure_ascii=False, indent=1)

    css = [':root {', f'  /* generated by tools/tokens.py — do not edit by hand */']
    for k, v in BRAND.items():
        css.append(f'  --iqaa-{k}: {v};')
    for k, v in NEUTRAL.items():
        css.append(f'  --iqaa-n{k}: {v};')
    css.append(f'  --iqaa-red: {RED};')
    css.append(f'  --iqaa-red-dark: {RED_DARK};')
    for k, v in SEMANTIC_LIGHT.items():
        css.append(f'  --c-{k}: {v};')
    css.append(f'  --beat: {BEAT_PX}px;')
    for k, v in SPACE.items():
        css.append(f'  --s-{k}: {v}px;')
    for k, v in type_scale().items():
        css.append(f'  --t-{k}: {v["size"]}px; --lh-{k}: {v["line"]}px; --tr-{k}: {v["track_em"]}em;')
    for k in ('eighth', 'quarter', 'half', 'beat', 'bar'):
        css.append(f'  --m-{k}: {MOTION[k]}ms;')
    for k in ('ease_arrive', 'ease_leave', 'ease_move'):
        css.append(f'  --{k.replace("_", "-")}: {MOTION[k]};')
    css.append(f'  --icon-stroke: {icon_stroke};')
    css.append('}')
    css.append(':root[data-theme="dark"] {')
    for k, v in SEMANTIC_DARK.items():
        css.append(f'  --c-{k}: {v};')
    css.append('}')
    with open(os.path.join(ROOT, 'assets', 'css', 'tokens.css'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(css) + '\n')
    return tokens


if __name__ == '__main__':
    os.makedirs(os.path.join(ROOT, 'assets', 'css'), exist_ok=True)
    t = build()
    print('neutral', t['neutral'])
    print('red', RED, 'red-dark', RED_DARK)
    print('text-3 light', SEMANTIC_LIGHT['text-3'], 'dark', SEMANTIC_DARK['text-3'])
    print('stem_em', t['type']['stem_em'], 'icon stroke', t['icon']['stroke'])
    print('scale', {k: (v['size'], v['line']) for k, v in t['type']['scale'].items()})
    for row in t['contrast']:
        print(row[0]['text'].ljust(9), '  '.join(f"{c['ground']}:{c['ratio']}({c['grade']})" for c in row))
