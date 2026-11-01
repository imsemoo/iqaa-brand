"""The first product screens: sign-in on an organization's subdomain, and self-serve sign-up.

Both are drawn as lines in the beat grammar. Signatures are rendered in the browser by beats.js from
window.IQAA, so a line built at sign-up can be the one that unfolds at sign-in.
"""
import brand
import i18n
from i18n import t
from p_ct import icon
from shell import V, esc, inline

FIELDS = [
    ('catering', 'Catering', 'Each job is an order'),
    ('software', 'Software company', 'Each job is a feature request'),
    ('video', 'Video production', 'Each job is a project'),
]


def shell(slug, title, top, body, scripts, foot='', css=()):
    # the organization's app adds app.js last: it folds the sidebar and signs the organization's mark if a page did not
    scripts = scripts + (('app',) if top and 'ap-side' in top else ())
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


# Each language by the flag its owner chose (2026-11-02): Arabic by Palestine, where Sufra works; English by the United
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
    org = f'<span data-org-name>{t("Sufra")}</span>'
    body = f'''<div class="si-page">
<div class="lang-top">{lang_switch('signin')}</div>
<section class="card" data-card aria-labelledby="si-h">
<div class="card-org"><span class="org-mark" data-sig></span><span class="org-t"><b data-org-name>{t('Sufra')}</b><span data-org-addr>sufra.iqaa.app</span></span></div>
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
<p class="card-alt">{t('Not on {org}’s line? {link}', org=org, link=f'<a href="signup.html">{t("Start an organization")}</a>')}</p>
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
<a class="btn primary wide" href="today.html">{t('Open Today')}</a>
<p class="card-alt"><button class="link" type="button" data-again>{t('Sign out')}</button></p>
</div>
</section>
<p class="proto">{t('Prototype: any email and password sign you in; type {code} as the password to see a failed check.', code='<code>wrong</code>')}</p>
</div>'''
    return shell('si', t('Sign in · {org}', org=t('Sufra')), '', body, ('signin',), foot=f'<div class="sign-off">{runs_badge()}</div>')


FIELD_ICONS = {
    'catering': '<path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10M16.5 3c-1.8 1.3-2.7 3.4-2.7 6.2V13h2.7v8"/>',
    'software': '<path d="M9 7.5L4.5 12 9 16.5M15 7.5l4.5 4.5-4.5 4.5"/>',
    'video': '<rect x="3.5" y="6.5" width="12" height="11" rx="3"/><path d="M15.5 10.5l5-3v9l-5-3"/>',
}


def field_cards():
    from shell import LINES
    out = ''
    # the first three stations in reading order: the arrow points the way the page reads
    arrow = ' ← ' if i18n.direction() == 'rtl' else ' → '
    # the station count in the plural form it takes in the page's language (Arabic has six)
    forms = i18n.DICT.get(i18n.CUR, {}).get('{n} stations') if i18n.CUR != 'en' else None
    for key, name, job in FIELDS:
        blocks = LINES[key]['blocks']
        path = arrow.join(t(b['name']) for b in blocks[:3]) + arrow + '…'
        n = len(blocks)
        if isinstance(forms, dict):
            form = ('one' if n == 1 else 'two' if n == 2 else 'few' if 3 <= n % 100 <= 10 else 'many' if n % 100 >= 11 else 'other')
            count = forms.get(form, forms.get('other', '{n} stations')).replace('{n}', str(n))
        else:
            count = t('{n} stations', n=n)
        icon_ = (f'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" '
                 f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{FIELD_ICONS[key]}</svg>')
        out += f"""<label class="fcard"><input type="radio" name="field" value="{key}">
<span class="fc-ic">{icon_}</span>
<span class="fc-t"><b>{t(name)}</b><span>{t(job)}</span></span>
<span class="fc-path">{esc(path)}</span>
<span class="fc-foot"><span class="fc-sig" data-field-sig="{key}"></span><span class="fc-n">{count}</span></span>
</label>"""
    return out


def signup():
    top = f"""<div class="a-wrap su-top"><a class="home" href="{i18n.base()}index.html" aria-label="{t('Iqaa')}">{inline(brand.lockup_svg("light"))}</a>
<nav class="flow-wrap" aria-label="{t('Sign-up steps')}"><ol class="flow" data-flow>
<li data-st="account"><span class="st-dot" aria-hidden="true"></span><span class="st-n">{t('Account')}</span></li>
<li data-st="work"><span class="st-dot" aria-hidden="true"></span><span class="st-n">{t('Your work')}</span></li>
<li data-st="line"><span class="st-dot" aria-hidden="true"></span><span class="st-n">{t('Your line')}</span></li>
</ol><p class="flow-now" data-flow-now aria-live="polite"></p></nav>
<div class="lang-top"><a class="link-top" href="signin.html"><span class="lt-q">{t('Have an account?')}</span> {t('Sign in')}</a>{lang_switch('signup')}</div></div>"""
    account = f"""<section class="step narrow" data-step="account" aria-labelledby="h-account">
<h1 id="h-account">{t('Create your account')}</h1>
<p class="lead">{t('Next you set up your organization’s line. It takes about two minutes.')}</p>
<form class="form" data-form="account" novalidate>
{text_field('name', t('Your name'), 'text', 'name')}
{text_field('suemail', t('Work email'), 'email', 'email', extra=' inputmode="email" spellcheck="false"')}
{password_field('supw', t('Password'), 'new-password', t('At least 8 characters.'))}
<button type="submit" hidden></button>
</form>
</section>"""
    hello = f'<span data-hello>{t("Welcome.")}</span>'
    work = f"""<section class="step" data-step="work" aria-labelledby="h-work" hidden>
<h1 id="h-work">{t('{hello} What kind of work do you do?', hello=hello)}</h1>
<p class="lead">{t('We set up a ready line from the steps of your work, and you change it as you like. Nothing runs until you approve it.')}</p>
<form class="form wide" data-form="work" novalidate>
{text_field('orgname', t('Organization name'), 'text', 'organization')}
<div class="addr-row" data-addr-row>
<span class="b" data-addr-beat data-k="run"></span>
<div class="addr-t"><p><span class="addr-u" data-addr>{t('your-team')}.iqaa.app</span></p><p class="hint" data-addr-status role="status">{t('Iqaa writes the address from the name.')}</p></div>
<button class="link" type="button" data-addr-edit>{t('Change')}</button>
</div>
<div class="field" data-addr-field hidden><label for="addr">{t('Address')}</label><div class="addr-in"><input id="addr" name="addr" type="text" autocomplete="off" spellcheck="false" aria-describedby="addr-err"><span>.iqaa.app</span></div><p class="err" id="addr-err" hidden></p></div>
<section class="watar" aria-labelledby="w-h">
<div class="watar-top"><span class="b" data-k="held" data-watar-ring></span><div><p class="watar-t" id="w-h">{t('Describe your work in your words, and Watar draws the line')}</p><p class="hint">{t('Watar is Iqaa’s assistant. It suggests the steps; you approve them.')}</p></div></div>
<div class="field" data-field="words"><label class="sr" for="words">{t('How one job moves through your team')}</label>
<textarea id="words" name="words" rows="3" placeholder="{t('For example: companies send us orders, we send a quote, and once they approve we buy the materials, cook and deliver.')}" aria-describedby="words-hint words-err"></textarea>
<p class="err" id="words-err" hidden></p></div>
<div class="watar-act"><p class="hint" id="words-hint">{t('A sentence or two is enough. The order can be rough.')}</p><button class="btn ink" type="button" data-draw><span class="b w-arch" data-k="held" aria-hidden="true">{brand.glyph_svg("held", "white", 16)}</span><span data-draw-t>{t('Draw the line')}</span></button></div>
<div class="watar-out" data-watar-out hidden><p class="watar-state"><b>{t('Draft from Watar')}</b><span data-watar-state></span></p><div data-draft-out></div></div>
</section>
<fieldset class="fields" aria-describedby="field-err"><legend>{t('Or pick the closest field')}</legend>
<div class="fcards">{field_cards()}</div>
<p class="err" id="field-err" hidden></p>
</fieldset>
<button type="submit" hidden></button>
</form>
</section>"""
    line = f"""<section class="step" data-step="line" aria-labelledby="h-line" hidden>
<h1 id="h-line" data-line-h tabindex="-1">{t('This is your line')}</h1>
<p class="lead" data-line-lead>{t('Every job walks these stations in order. Press a step to change what kind it is, and rename a station under its steps.')}</p>
<p class="draft-tag" data-draft-tag><span class="b" data-k="held" data-line-ring></span><span data-draft-tag-t>{t('Draft · waiting for your approval')}</span></p>
<ol class="ledit" data-edit aria-label="{t('Your line')}"></ol>
<div class="sig-out" data-sig-out hidden></div>
<div class="done" data-done hidden>
<span class="done-mark" data-done-mark></span>
<p class="lead" data-done-p></p>
<div class="row-act"><a class="btn primary" href="signin.html" data-go>{t('Go to sign-in')}</a><button class="btn" type="button" data-restart>{t('Start again')}</button></div>
</div>
</section>"""
    bar = f"""<div class="su-bar" data-bar><div class="su-bar-in">
<p class="bar-t" data-bar-t aria-live="polite"></p>
<div class="bar-act"><button class="btn" type="button" data-prev hidden>{t('Back')}</button><button class="btn primary" type="button" data-next>{t('Continue')}</button></div>
</div></div>"""
    preview = f"""<aside class="su-prev" aria-label="{t('Preview: what your team will see')}"><div class="prev-in">
<p class="prev-k">{t('What your team will see')}</p>
<div class="prev-card" aria-hidden="true">
<div class="prev-org"><span class="prev-mark" data-prev-mark></span><span class="prev-t"><b data-prev-name>{t('Your organization')}</b><span data-prev-addr>{t('your-team')}.iqaa.app</span></span></div>
<p class="prev-h">{t('Sign in')}</p>
<span class="prev-f"><span>{t('Work email')}</span><i></i></span>
<span class="prev-f"><span>{t('Password')}</span><i></i></span>
<span class="prev-b">{t('Sign in')}</span>
</div>
<div class="prev-line"><p class="prev-lk" data-prev-lk>{t('Every job will walk your line')}</p><div data-prev-line></div><p class="prev-empty" data-prev-empty>{t('Describe your work or pick a field, and the line appears here.')}</p></div>
</div></aside>"""
    body = f'<div class="su-split"><div class="su-main"><div class="su-col">{account}{work}{line}</div>{bar}</div>{preview}</div>'
    return shell('su', t('Start your organization · Iqaa'), top, body, ('signup',))
