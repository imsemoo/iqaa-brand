"""Build every page of the identity book.

python tools/build.py   (from the project root; run tools/tokens.py and tools/brand.py first)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brand  # noqa: E402
import tokens  # noqa: E402
from p_apps import applications, guidelines  # noqa: E402
from p_core import decisions, index  # noqa: E402
from p_ct import colour, icons, type_  # noqa: E402
from p_mark import mark, signature  # noqa: E402
from p_ms import motion, system  # noqa: E402
from p_auth import signin, signup  # noqa: E402
from p_line import line  # noqa: E402
from p_today import today  # noqa: E402
from p_orders import order, orders, overview  # noqa: E402
from p_clients import client, clients  # noqa: E402
from p_watar import watar  # noqa: E402
from p_settings import settings  # noqa: E402
from p_build import build  # noqa: E402
from p_screens import screens  # noqa: E402
from shell import ROOT, page, tokens_js  # noqa: E402

PAGES = [
    ('index', 'Overview', index, 'Iqaa’s identity: a notation for the line, the mark it writes and the decisions behind it.', ('motion',)),
    ('decisions', 'Decisions', decisions, 'Every decision of the Iqaa identity, with its measurement or reason.', ()),
    ('mark', 'Mark', mark, 'The Iqaa symbol, wordmark, lockups, clear space, sizes, versions and app icon.', ()),
    ('signature', 'Signature', signature, 'The beat grammar and the signature every line writes, with a generator.', ('iqaa-data', 'grammar', 'generator')),
    ('colour', 'Colour', colour, 'Iqaa colours, neutrals, alert, semantic tokens and contrast.', ()),
    ('type', 'Type', type_, 'Iqaa typography: faces, scale and typesetting rules.', ()),
    ('icons', 'Icons', icons, 'Iqaa icons on a 24 px grid.', ()),
    ('motion', 'Motion', motion, 'Iqaa motion: tempo, curves and five product moments.', ('iqaa-data', 'grammar', 'motion')),
    ('system', 'Watar and co-branding', system, 'Watar, brand architecture, co-branding and messages.', ()),
    ('applications', 'Applications', applications, 'The Iqaa identity on web, social, deck, print and event.', ()),
    ('guidelines', 'Guidelines', guidelines, 'Ten rules, do and don’t, tokens, files and quality checks.', ()),
    ('screens', 'Screens', screens, 'The product screens built so far, and where the identity lives in each.', ()),
]

if __name__ == '__main__':
    tokens.build()
    brand.export()
    with open(os.path.join(ROOT, 'assets', 'js', 'iqaa-data.js'), 'w', encoding='utf-8') as fh:
        fh.write(tokens_js())
    for slug, title, fn, desc, scripts in PAGES:
        html = page(slug, title, fn(), desc, scripts)
        with open(os.path.join(ROOT, f'{slug}.html'), 'w', encoding='utf-8') as fh:
            fh.write(html)
        print(slug, len(html))
    for slug, fn in (('signin', signin), ('signup', signup), ('line', line), ('today', today), ('orders', orders), ('order', order), ('overview', overview), ('build', build),
                     ('clients', clients), ('client', client), ('watar', watar), ('settings', settings)):
        html = fn()
        with open(os.path.join(ROOT, f'{slug}.html'), 'w', encoding='utf-8') as fh:
            fh.write(html)
        print(slug, len(html))
