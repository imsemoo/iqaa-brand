"""The page shell every product screen is written into, the language switch, and sign-in on an organization's
subdomain (drawn as a line in the beat grammar; its signature is rendered in the browser by beats.js).
Starting an organization is start.html (p_start.py).
"""
import brand
import i18n
from i18n import t
from p_ct import icon
from shell import V, esc, inline

def shell(slug, title, top, body, scripts, foot='', css=()):
    # (the app frame, data-frame, is frame.js's: each page lists it after its own script)
    # the page's language: its dictionary first, then T() (i18n.js), then the page; paths climb out of ar/ and tr/
    b, lang = i18n.base(), i18n.CUR
    words = (f'i18n-{lang}',) if lang != 'en' else ()
    js = ''.join(f'<script src="{b}assets/js/{s}.js?v={V}" defer></script>' for s in words + ('i18n', 'iqaa-data', 'grammar', 'beats', 'ui') + scripts)
    extra = ''.join(f'\n<link rel="stylesheet" href="{b}assets/css/{c}.css?v={V}">' for c in css)
    arabic = f'\n<link rel="preload" href="{b}assets/fonts/readexpro-arabic.woff2" as="font" type="font/woff2" crossorigin>' if lang == 'ar' else ''
    return f'''<!doctype html>
<html lang="{lang}" dir="{i18n.direction()}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="robots" content="noindex">
<link rel="icon" href="{b}favicon.svg" type="image/svg+xml">
<link rel="preload" href="{b}assets/fonts/atkinson.woff2" as="font" type="font/woff2" crossorigin>{arabic}
<link rel="stylesheet" href="{b}assets/css/tokens.css?v={V}">
<link rel="stylesheet" href="{b}assets/css/brand.css?v={V}">
<link rel="stylesheet" href="{b}assets/css/auth.css?v={V}">{extra}
<link rel="stylesheet" href="{b}assets/css/dark.css?v={V}">
<script>try{{var q=new URLSearchParams(location.search).get('theme'),k=localStorage.getItem('iqaa-theme'),d=q?q==='dark':k?k==='dark':matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.dataset.theme='dark'}}catch(e){{}}</script>
{js}
</head>
<body class="app">
<a class="skip" href="#main">{t('Skip to content')}</a>
{f'<header class="a-top">{top}</header>' if top else ''}
<main id="main" class="{slug}">
{body}
</main>
<footer class="a-foot">{foot}<p>{t('Prototype screen, part of the {link}. Nothing is sent or saved.', link=f'<a href="{b}index.html">{t("Iqaa identity")}</a>')}</p></footer>
</body>
</html>
'''


def runs_badge():
    sym = inline(brand.symbol_svg('light'))
    return f'<a class="runs-on" href="{i18n.base()}index.html">{sym}<span>{t("Runs on Iqaa")}</span></a>'


# Each language by the flag its owner chose (2026-11-02): Arabic by Palestine, where the demo organizations work; English by the United
# Kingdom; Turkish by Turkey. Drawn round on a 512 grid to each flag's own construction; the hairline keeps white
# parts off a white menu.
FLAGS = {
    'ar': '<rect width="512" height="171" fill="#000"/><rect y="171" width="512" height="170" fill="#fff"/>'
          '<rect y="341" width="512" height="171" fill="#009736"/><path d="M0 0l256 256L0 512z" fill="#EE2A35"/>',
    'en': '<rect width="512" height="512" fill="#012169"/><path d="M0 0l512 512M512 0L0 512" stroke="#fff" stroke-width="100"/>'
          '<path d="M0 0l512 512M512 0L0 512" stroke="#C8102E" stroke-width="34"/><path d="M256 0v512M0 256h512" stroke="#fff" stroke-width="170"/>'
          '<path d="M256 0v512M0 256h512" stroke="#C8102E" stroke-width="102"/>',
    'tr': '<rect width="512" height="512" fill="#E30A17"/><circle cx="216" cy="256" r="128" fill="#fff"/><circle cx="248" cy="256" r="102.4" fill="#E30A17"/>'
          '<polygon fill="#fff" points="322.5,256 366.7,241.6 366.7,195.1 394.1,232.7 438.3,218.4 410.9,256 438.3,293.6 394.1,279.3 366.7,316.9 366.7,270.4"/>',
}


def flag(code, size):
    clip = f'fl-{code}-{size}'
    return (f'<svg class="flag" viewBox="0 0 512 512" width="{size}" height="{size}" aria-hidden="true"><clipPath id="{clip}"><circle cx="256" cy="256" r="256"/></clipPath>'
            f'<g clip-path="url(#{clip})">{FLAGS[code]}</g><circle cx="256" cy="256" r="248" fill="none" stroke="#19172E" stroke-opacity=".16" stroke-width="16"/></svg>')


def lang_switch(slug, up=False, note=True):
    """The language switch: the current language's flag and code. Its menu lists each language by its flag and its
    own name, with the name in the interface's language beside it; the links open the same page in that language
    (ui.js keeps the page's query and hash)."""
    cur = i18n.CUR
    code = {'en': 'EN', 'ar': 'AR', 'tr': 'TR'}
    english = {'en': 'English', 'ar': 'Arabic', 'tr': 'Turkish'}
    name = dict((c, n) for c, n, _ in i18n.LANGS)[cur]
    chevron = ('<svg class="lang-cv" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" '
               'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 10l4-4 4 4M8 14l4 4 4-4"/></svg>')
    rows = ''
    for c, n, d in i18n.LANGS:
        other = t(english[c])
        rows += (f'<a href="{i18n.base()}{"" if c == "en" else c + "/"}{slug}.html" data-lang-to="{c}" lang="{c}" hreflang="{c}"'
                 f'{" aria-current=\"true\"" if c == cur else ""}>{flag(c, 20)}<span class="lang-n" dir="{d}">{n}</span>'
                 f'<span class="lang-o" lang="{cur}">{other if other != n else ""}</span>'
                 f'<span class="lang-k">{icon("Done", 16) if c == cur else ""}</span></a>')
    # the team's own screens say the choice is only theirs; a client's page has no such note
    foot = f'<p class="lang-note">{t("Changes the language of your screens only.")}</p>' if note else ''
    return (f'<div class="lang{" up" if up else ""}"><button type="button" class="lang-b" data-menu aria-expanded="false" aria-controls="lang-menu" '
            f'aria-label="{t("Interface language")}: {name}" title="{t("Interface language")}">{flag(cur, 18)}<span class="lang-c" aria-hidden="true">{code[cur]}</span>{chevron}</button>'
            f'<div class="lang-menu" id="lang-menu" hidden><p class="lang-h">{icon("Language", 16)}<span>{t("Interface language")}</span></p>'
            f'<div class="lang-l">{rows}</div>{foot}</div></div>')


def password_field(id_, label, auto, hint=''):
    h = f'<p class="hint" id="{id_}-hint">{hint}</p>' if hint else ''
    desc = f' aria-describedby="{id_}-hint {id_}-err"' if hint else f' aria-describedby="{id_}-err"'
    return f'''<div class="field" data-field="{id_}">
<div class="lab-row"><label for="{id_}">{label}</label>{f'<button class="link" type="button" data-forgot>{t("Forgot password?")}</button>' if id_ == 'pw' else ''}</div>
<div class="pw"><input id="{id_}" name="{id_}" type="password" autocomplete="{auto}" required{desc}><button class="show" type="button" aria-pressed="false" aria-controls="{id_}" data-show>{t("Show")}</button></div>
{h}<p class="err" id="{id_}-err" hidden></p>
</div>'''


def text_field(id_, label, typ, auto, placeholder='', extra=''):
    return f'''<div class="field" data-field="{id_}">
<label for="{id_}">{label}</label>
<input id="{id_}" name="{id_}" type="{typ}" autocomplete="{auto}" required aria-describedby="{id_}-err"{f' placeholder="{placeholder}"' if placeholder else ''}{extra}>
<p class="err" id="{id_}-err" hidden></p>
</div>'''


def signin():
    org = f'<span data-org-name>{t("Al-Khatt Media")}</span>'
    body = f'''<div class="si-page">
<div class="lang-top">{lang_switch('signin')}</div>
<section class="card" data-card aria-labelledby="si-h">
<div class="card-org"><span class="org-mark" data-sig></span><span class="org-t"><b data-org-name>{t('Al-Khatt Media')}</b><span data-org-addr>alkhatt.iqaa.co</span></span></div>
<div class="card-line" data-card-line></div>
<div class="card-body" data-panel="signin">
<h1 id="si-h">{t('Sign in')}</h1>
<p class="card-sub">{t('Welcome back. Use the email your team invited.')}</p>
<p class="alert" data-form-err role="alert" hidden></p>
<form class="form" data-signin novalidate>
{text_field('email', t('Work email'), 'email', 'username', extra=' inputmode="email" spellcheck="false"')}
{password_field('pw', t('Password'), 'current-password')}
<button class="btn primary wide" type="submit" data-submit><span class="b" data-k="run" data-check hidden></span><span data-submit-t>{t('Sign in')}</span></button>
</form>
<p class="card-alt">{t('Not on {org}’s line? {link}', org=org, link=f'<a href="start.html">{t("Start an organization")}</a>')}</p>
</div>
<div class="card-body" data-panel="forgot" hidden>
<h1 id="fg-h">{t('Reset your password')}</h1>
<p class="card-sub">{t('We send a link to your work email. It works once, for an hour.')}</p>
<form class="form" data-forgot-form novalidate>
{text_field('fgemail', t('Work email'), 'email', 'username', extra=' inputmode="email" spellcheck="false"')}
<p class="ok" data-forgot-ok role="status" hidden></p>
<button class="btn primary wide" type="submit" data-fg-submit><span class="b" data-k="run" data-fg-check hidden></span><span>{t('Send the link')}</span></button>
</form>
<p class="card-alt"><button class="link" type="button" data-back>{t('Back to sign in')}</button></p>
</div>
<div class="card-body" data-welcome aria-live="polite" hidden>
<h1 data-greet tabindex="-1"></h1>
<p class="card-sub" data-w-p></p>
<a class="btn primary wide" href="work.html" data-open-work>{t('Open My work')}</a>
<p class="card-alt"><button class="link" type="button" data-again>{t('Sign out')}</button></p>
</div>
</section>
<p class="proto">{t('Prototype: any email and password sign you in; type {code} as the password to see a failed check.', code='<code>wrong</code>')}</p>
</div>'''
    return shell('si', t('Sign in · {org}', org=t('Al-Khatt Media')), '', body, ('world', 'signin'), foot=f'<div class="sign-off">{runs_badge()}</div>')

