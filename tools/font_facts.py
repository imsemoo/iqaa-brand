"""Measure every candidate face on the things the brief asks of it, so the choice is a reading, not a taste.

python -I tools/font_facts.py   -> research/font-facts.json and a table on stdout

Gates (a face that fails one is out):
  tnum      tabular figures available (GSUB 'tnum', or every figure already one width)
  turkish   İ ı Ş ş Ğ ğ Ç ç Ö ö Ü ü all present
  I_vs_l    the capital I and the lowercase l differ in outline (serifs, tail or spur), not only in height
Measures used to rank the faces that pass:
  xh        x-height / cap height  (higher reads better at 12-13 px)
  l_over_I  lowercase l height / capital I height (how much height alone separates them)
  width     mean advance of a-z in em (lower is more economical in dense screens)
  zero      a slashed or dotted zero is available ('zero' feature)
"""
import json
import os
from fontTools.pens.recordingPen import RecordingPen
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'research', 'font-src')

FACES = {
    'Host Grotesk': 'HostGrotesk[wght].ttf',
    'Atkinson Hyperlegible Next': 'AtkinsonHyperlegibleNext[wght].ttf',
    'Funnel Sans': 'FunnelSans[wght].ttf',
    'Funnel Display': 'FunnelDisplay[wght].ttf',
    'Instrument Sans': 'InstrumentSans[wdth,wght].ttf',
    'Hanken Grotesk': 'HankenGrotesk[wght].ttf',
    'Onest': 'Onest[wght].ttf',
    'Wix Madefor Text': 'WixMadeforText[wght].ttf',
    'Wix Madefor Display': 'WixMadeforDisplay[wght].ttf',
    'Rethink Sans': 'RethinkSans[wght].ttf',
    'Fragment Mono': 'FragmentMono-Regular.ttf',
    'Martian Mono': 'MartianMono[wdth,wght].ttf',
    'Azeret Mono': 'AzeretMono[wght].ttf',
    'Sometype Mono': 'SometypeMono[wght].ttf',
    'Red Hat Mono': 'RedHatMono[wght].ttf',
}
TURKISH = 'İıŞşĞğÇçÖöÜü'


def features(font):
    if 'GSUB' not in font:
        return set()
    return {fr.FeatureTag for fr in font['GSUB'].table.FeatureList.FeatureRecord}


def outline(font, ch):
    gs = font.getGlyphSet()
    name = font.getBestCmap().get(ord(ch))
    pen = RecordingPen()
    gs[name].draw(pen)
    pts = sum(len(args) for op, args in pen.value if op != 'closePath')
    return name, pts


def height(font, ch):
    name = font.getBestCmap()[ord(ch)]
    glyf = font['glyf'][name] if 'glyf' in font else None
    if glyf is not None and hasattr(glyf, 'yMax'):
        glyf.recalcBounds(font['glyf'])
        return glyf.yMax - min(glyf.yMin, 0)
    return None


rows = []
for label, file in FACES.items():
    f = TTFont(os.path.join(SRC, file))
    cmap = f.getBestCmap()
    upm = f['head'].unitsPerEm
    os2 = f['OS/2']
    feats = features(f)
    hmtx = f['hmtx']
    digit_w = {hmtx[cmap[ord(d)]][0] for d in '0123456789'}
    _, i_pts = outline(f, 'I')
    _, l_pts = outline(f, 'l')
    i_h, l_h = height(f, 'I'), height(f, 'l')
    axes = {a.axisTag: (a.minValue, a.maxValue) for a in f['fvar'].axes} if 'fvar' in f else {}
    rows.append({
        'face': label,
        'mono': 'Mono' in label,
        'tnum': 'tnum' in feats or len(digit_w) == 1,
        'turkish': all(ord(c) in cmap for c in TURKISH),
        'I_points': i_pts,
        'l_points': l_pts,
        'I_vs_l': i_pts > 4 or l_pts > 4,
        'l_over_I': round(l_h / i_h, 3) if i_h and l_h else None,
        'xh': round(os2.sxHeight / os2.sCapHeight, 3) if getattr(os2, 'sCapHeight', 0) else None,
        'width': round(sum(hmtx[cmap[ord(c)]][0] for c in 'abcdefghijklmnopqrstuvwxyz') / 26 / upm, 3),
        'zero': 'zero' in feats,
        'weights': axes.get('wght'),
        'glyphs': len(f.getGlyphOrder()),
    })

with open(os.path.join(ROOT, 'research', 'font-facts.json'), 'w', encoding='utf-8') as out:
    json.dump(rows, out, ensure_ascii=False, indent=1)

cols = ['face', 'tnum', 'turkish', 'I_points', 'l_points', 'I_vs_l', 'l_over_I', 'xh', 'width', 'zero', 'weights']
print(' | '.join(cols))
for r in rows:
    print(' | '.join(str(r[c]) for c in cols))
