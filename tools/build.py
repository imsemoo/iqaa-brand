"""Build every page of the identity book.

python tools/build.py   (from the project root; run tools/tokens.py and tools/brand.py first)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brand  # noqa: E402
import i18n  # noqa: E402
import tokens  # noqa: E402
from p_apps import applications, guidelines  # noqa: E402
from p_core import decisions, index  # noqa: E402
from p_ct import colour, icons, type_  # noqa: E402
from p_mark import mark, signature  # noqa: E402
from p_ms import motion, system  # noqa: E402
from p_auth import signin  # noqa: E402
from p_work import work  # noqa: E402
from p_notify import notify  # noqa: E402
from p_me import me  # noqa: E402
from p_network import network  # noqa: E402
from p_new import new  # noqa: E402
from p_log import log  # noqa: E402
from p_security import security  # noqa: E402
from p_publishing import publishing  # noqa: E402
from p_archive import archive  # noqa: E402
from p_repos import repos  # noqa: E402
from p_releases import releases  # noqa: E402
from p_envs import envs  # noqa: E402
from p_clients import clients  # noqa: E402
from p_campaigns import campaigns  # noqa: E402
from p_spend import spend  # noqa: E402
from p_files import files  # noqa: E402
from p_vtemplates import vtemplates  # noqa: E402
from p_approvals import approvals  # noqa: E402
from p_item import item  # noqa: E402
from p_queue import queue  # noqa: E402
from p_home import home  # noqa: E402
from p_lines import lines  # noqa: E402
from p_publish import publish  # noqa: E402
from p_built import built  # noqa: E402
from p_start import start  # noqa: E402
from p_people import people  # noqa: E402
from p_reports import reports  # noqa: E402
from p_packs import packs  # noqa: E402
from p_review import review  # noqa: E402
from p_automate import automate  # noqa: E402
from p_sources import sources  # noqa: E402
from p_templates import templates  # noqa: E402
from p_integrations import integrations  # noqa: E402
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

APP = (('signin', signin),
       # the digital production screens (the owner's 22), on world.js
       ('work', work), ('notify', notify), ('me', me), ('item', item), ('queue', queue), ('home', home),
       ('lines', lines), ('network', network), ('new', new), ('publish', publish), ('built', built), ('start', start),
       ('people', people), ('reports', reports), ('packs', packs), ('log', log), ('security', security), ('review', review),
       ('automate', automate), ('sources', sources), ('publishing', publishing), ('archive', archive), ('repos', repos), ('releases', releases), ('envs', envs), ('clients', clients), ('campaigns', campaigns), ('spend', spend), ('files', files), ('vtemplates', vtemplates), ('approvals', approvals), ('templates', templates), ('integrations', integrations))

if __name__ == '__main__':
    # --only today,watar   builds just those product screens, in every language, and skips the book and its exports
    only = next((a.split('=', 1)[1] if '=' in a else sys.argv[sys.argv.index(a) + 1] for a in sys.argv[1:] if a.startswith('--only')), None)
    only = set(only.split(',')) if only else None
    if not only:
        tokens.build()
        brand.export()
        with open(os.path.join(ROOT, 'assets', 'js', 'iqaa-data.js'), 'w', encoding='utf-8') as fh:
            fh.write(tokens_js())
        for slug, title, fn, desc, scripts in PAGES:
            html = page(slug, title, fn(), desc, scripts)
            with open(os.path.join(ROOT, f'{slug}.html'), 'w', encoding='utf-8') as fh:
                fh.write(html)
            print(slug, len(html))
    # the product in its three languages: English at the root, Arabic in ar/, Turkish in tr/
    i18n.load()
    for code, _, _ in i18n.LANGS:
        if code != 'en':
            with open(os.path.join(ROOT, 'assets', 'js', f'i18n-{code}.js'), 'w', encoding='utf-8') as fh:
                fh.write(i18n.js(code))
        i18n.use(code)
        out = ROOT if code == 'en' else os.path.join(ROOT, code)
        os.makedirs(out, exist_ok=True)
        for slug, fn in APP:
            if only and slug not in only:
                continue
            html = fn()
            with open(os.path.join(out, f'{slug}.html'), 'w', encoding='utf-8') as fh:
                fh.write(html)
        print(code, 'product pages', len(only) if only else len(APP))
    i18n.use('en')
