"""The product's three languages: English at the root, Arabic in ar/ and Turkish in tr/.

The English text in the source is the key (gettext style): t('Waiting for you') returns it as written in English and
the dictionary's translation in the other languages, or the English when a translation is missing. Dictionaries live
in i18n/<screens>.json, one file per group of screens, each {"ar": {...}, "tr": {...}}; an entry is a string, or for a
count, its plural forms ({"one", "two", "few", "many", "other"}). build.py writes them merged per language to
assets/js/i18n-<lang>.js, which the browser's T() (assets/js/i18n.js) reads, and the build itself reads them through t().
"""
import glob
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGS = [('en', 'English', 'ltr'), ('ar', 'العربية', 'rtl'), ('tr', 'Türkçe', 'ltr')]
CUR = 'en'
DICT = {}


def load():
    """Merge every i18n/*.json, core.json first. One English text has one translation per language: when two files
    translate it differently, the first one read is kept and the build says so (CONFLICTS lists them)."""
    DICT.clear()
    CONFLICTS.clear()
    paths = sorted(glob.glob(os.path.join(ROOT, 'i18n', '*.json')), key=lambda p: (os.path.basename(p) != 'core.json', p))
    for path in paths:
        with open(path, encoding='utf-8') as fh:
            data = json.load(fh)
        for lang, entries in data.items():
            have = DICT.setdefault(lang, {})
            for k, v in entries.items():
                if k in have and have[k] != v:
                    CONFLICTS.append((lang, k, os.path.basename(path)))
                    continue
                have[k] = v
    if CONFLICTS:
        print(f'i18n: {len(CONFLICTS)} texts translated differently in two files; the first is kept (i18n.CONFLICTS)')
    return DICT


CONFLICTS = []


def use(lang):
    global CUR
    CUR = lang


def direction():
    return dict((c, d) for c, _, d in LANGS)[CUR]


def base():
    """The way back to the root from this language's folder, for assets and the identity book's pages."""
    return '' if CUR == 'en' else '../'


def fill(s, v):
    for k, x in v.items():
        s = s.replace('{' + k + '}', str(x))
    return s


def t(src, **v):
    s = src if CUR == 'en' else DICT.get(CUR, {}).get(src, src)
    if isinstance(s, dict):
        s = s.get('other', src)
    return fill(s, v)


def js(lang):
    """The dictionary of one language for the browser."""
    return f'window.IQAA_I18N = Object.assign(window.IQAA_I18N || {{}}, {{ {json.dumps(lang)}: {json.dumps(DICT.get(lang, {}), ensure_ascii=False)} }});\n'
