"""Self-hosted WOFF2 subsets of the two faces.

python -I tools/fonts.py   (from the project root; sources in research/font-src, gitignored; tools/fetch_fonts.py gets them)

Atkinson Hyperlegible Next (Braille Institute, OFL) sets everything: chosen by tools/font_facts.py as the only
sans candidate whose I and l differ in outline, with tabular figures, full Turkish and the highest x-height
among the faces that pass. Fragment Mono (OFL) sets times, codes and run logs: its x-height (0.750) meets
Atkinson's (0.743) when a code sits inside a sentence, and it has a slashed zero.
"""
import io
import os
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'research', 'font-src')
OUT = os.path.join(ROOT, 'assets', 'fonts')
os.makedirs(OUT, exist_ok=True)

# Basic Latin, Latin-1, Latin Extended-A (Turkish and the rest of Europe), typographic punctuation, arrows,
# the minus, multiplication, middle dot, the shekel, euro and Turkish lira signs.
UNICODES = (
    list(range(0x20, 0x7F)) + list(range(0xA0, 0x180)) +
    [0x2009, 0x200A, 0x2010, 0x2011, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026,
     0x2032, 0x2033, 0x2039, 0x203A, 0x20AA, 0x20AC, 0x20BA, 0x2190, 0x2191, 0x2192, 0x2193, 0x2212,
     0x00D7, 0x00B7, 0x2116, 0x2713]
)

JOBS = [
    ('AtkinsonHyperlegibleNext[wght].ttf', 'atkinson.woff2', {'wght': (300, 800)}),
    ('FragmentMono-Regular.ttf', 'fragmentmono.woff2', None),
]


def options():
    o = subset.Options()
    o.flavor = 'woff2'
    o.layout_features = ['*']
    o.name_IDs = ['*']
    o.notdef_outline = True
    o.glyph_names = False
    o.hinting = False
    o.desubroutinize = True
    return o


for src, out, limits in JOBS:
    font = TTFont(os.path.join(SRC, src))
    if limits:
        font = instancer.instantiateVariableFont(font, limits)
        buf = io.BytesIO()
        font.save(buf)
        buf.seek(0)
        font = TTFont(buf)
    sub = subset.Subsetter(options())
    sub.populate(unicodes=UNICODES)
    sub.subset(font)
    font.flavor = 'woff2'
    path = os.path.join(OUT, out)
    font.save(path)
    print(out, os.path.getsize(path))
