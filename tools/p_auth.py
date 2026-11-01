"""The first product screens: sign-in on an organization's subdomain, and self-serve sign-up.

Both are drawn as lines in the beat grammar. Signatures are rendered in the browser by beats.js from
window.IQAA, so a line built at sign-up can be the one that unfolds at sign-in.
"""
import brand
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
    js = ''.join(f'<script src="assets/js/{s}.js?v={V}" defer></script>' for s in ('iqaa-data', 'grammar', 'beats') + scripts)
    extra = ''.join(f'\n<link rel="stylesheet" href="assets/css/{c}.css?v={V}">' for c in css)
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="robots" content="noindex">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/atkinson.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/tokens.css?v={V}">
<link rel="stylesheet" href="assets/css/brand.css?v={V}">
<link rel="stylesheet" href="assets/css/auth.css?v={V}">{extra}
{js}
</head>
<body class="app">
<a class="skip" href="#main">Skip to content</a>
{f'<header class="a-top">{top}</header>' if top else ''}
<main id="main" class="{slug}">
{body}
</main>
<footer class="a-foot">{foot}<p>Prototype screen, part of the <a href="index.html">Iqaa identity</a>. Nothing is sent or saved.</p></footer>
</body>
</html>
'''


def runs_badge():
    sym = inline(brand.symbol_svg('light'))
    return f'<a class="runs-on" href="index.html">{sym}<span>Runs on Iqaa</span></a>'


def password_field(id_, label, auto, hint=''):
    h = f'<p class="hint" id="{id_}-hint">{hint}</p>' if hint else ''
    desc = f' aria-describedby="{id_}-hint {id_}-err"' if hint else f' aria-describedby="{id_}-err"'
    return f'''<div class="field" data-field="{id_}">
<div class="lab-row"><label for="{id_}">{label}</label>{'<button class="link" type="button" data-forgot>Forgot password?</button>' if id_ == 'pw' else ''}</div>
<div class="pw"><input id="{id_}" name="{id_}" type="password" autocomplete="{auto}" required{desc}><button class="show" type="button" aria-pressed="false" aria-controls="{id_}" data-show>Show</button></div>
{h}<p class="err" id="{id_}-err" hidden></p>
</div>'''


def text_field(id_, label, typ, auto, placeholder='', extra=''):
    return f'''<div class="field" data-field="{id_}">
<label for="{id_}">{label}</label>
<input id="{id_}" name="{id_}" type="{typ}" autocomplete="{auto}" required aria-describedby="{id_}-err"{f' placeholder="{placeholder}"' if placeholder else ''}{extra}>
<p class="err" id="{id_}-err" hidden></p>
</div>'''


def signin():
    body = f'''<div class="si-page">
<section class="card" data-card aria-labelledby="si-h">
<div class="card-org"><span class="org-mark" data-sig></span><span class="org-t"><b data-org-name>Sufra</b><span data-org-addr>sufra.iqaa.app</span></span></div>
<div class="card-line" data-card-line></div>
<div class="card-body" data-panel="signin">
<h1 id="si-h">Sign in</h1>
<p class="card-sub">Welcome back. Use the email your team invited.</p>
<p class="alert" data-form-err role="alert" hidden></p>
<form class="form" data-signin novalidate>
{text_field('email', 'Work email', 'email', 'username', extra=' inputmode="email" spellcheck="false"')}
{password_field('pw', 'Password', 'current-password')}
<button class="btn primary wide" type="submit" data-submit><span class="b" data-k="run" data-check hidden></span><span data-submit-t>Sign in</span></button>
</form>
<p class="card-alt">Not on <span data-org-name>Sufra</span>’s line? <a href="signup.html">Start an organization</a></p>
</div>
<div class="card-body" data-panel="forgot" hidden>
<h1 id="fg-h">Reset your password</h1>
<p class="card-sub">We send a link to your work email. It works once, for an hour.</p>
<form class="form" data-forgot-form novalidate>
{text_field('fgemail', 'Work email', 'email', 'username', extra=' inputmode="email" spellcheck="false"')}
<p class="ok" data-forgot-ok role="status" hidden></p>
<button class="btn primary wide" type="submit" data-fg-submit><span class="b" data-k="run" data-fg-check hidden></span><span>Send the link</span></button>
</form>
<p class="card-alt"><button class="link" type="button" data-back>Back to sign in</button></p>
</div>
<div class="card-body" data-welcome aria-live="polite" hidden>
<h1 data-greet tabindex="-1"></h1>
<p class="card-sub" data-w-p></p>
<a class="btn primary wide" href="today.html">Open Today</a>
<p class="card-alt"><button class="link" type="button" data-again>Sign out</button></p>
</div>
</section>
<p class="proto">Prototype: any email and password sign you in; type <code>wrong</code> as the password to see a failed check.</p>
</div>'''
    return shell('si', 'Sign in · Sufra', '', body, ('signin',), foot=f'<div class="sign-off">{runs_badge()}</div>')


FIELD_ICONS = {
    'catering': '<path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10M16.5 3c-1.8 1.3-2.7 3.4-2.7 6.2V13h2.7v8"/>',
    'software': '<path d="M9 7.5L4.5 12 9 16.5M15 7.5l4.5 4.5-4.5 4.5"/>',
    'video': '<rect x="3.5" y="6.5" width="12" height="11" rx="3"/><path d="M15.5 10.5l5-3v9l-5-3"/>',
}


def field_cards():
    from shell import LINES
    out = ''
    for key, name, job in FIELDS:
        blocks = LINES[key]['blocks']
        path = ' → '.join(b['name'] for b in blocks[:3]) + ' → …'
        icon_ = (f'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" '
                 f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{FIELD_ICONS[key]}</svg>')
        out += f"""<label class="fcard"><input type="radio" name="field" value="{key}">
<span class="fc-ic">{icon_}</span>
<span class="fc-t"><b>{name}</b><span>{job}</span></span>
<span class="fc-path">{esc(path)}</span>
<span class="fc-foot"><span class="fc-sig" data-field-sig="{key}"></span><span class="fc-n">{len(blocks)} stations</span></span>
</label>"""
    return out


def signup():
    top = f"""<div class="a-wrap su-top"><a class="home" href="index.html" aria-label="Iqaa">{inline(brand.lockup_svg("light"))}</a>
<nav class="flow-wrap" aria-label="Sign-up steps"><ol class="flow" data-flow>
<li data-st="account"><span class="st-dot" aria-hidden="true"></span><span class="st-n">Account</span></li>
<li data-st="work"><span class="st-dot" aria-hidden="true"></span><span class="st-n">Your work</span></li>
<li data-st="line"><span class="st-dot" aria-hidden="true"></span><span class="st-n">Your line</span></li>
</ol><p class="flow-now" data-flow-now aria-live="polite"></p></nav>
<a class="link-top" href="signin.html">Have an account? Sign in</a></div>"""
    account = f"""<section class="step narrow" data-step="account" aria-labelledby="h-account">
<h1 id="h-account">Create your account</h1>
<p class="lead">Next you set up your organization’s line. It takes about two minutes.</p>
<form class="form" data-form="account" novalidate>
{text_field('name', 'Your name', 'text', 'name')}
{text_field('suemail', 'Work email', 'email', 'email', extra=' inputmode="email" spellcheck="false"')}
{password_field('supw', 'Password', 'new-password', 'At least 8 characters.')}
<button type="submit" hidden></button>
</form>
</section>"""
    work = f"""<section class="step" data-step="work" aria-labelledby="h-work" hidden>
<h1 id="h-work"><span data-hello>Welcome.</span> What kind of work do you do?</h1>
<p class="lead">We set up a ready line from the steps of your work, and you change it as you like. Nothing runs until you approve it.</p>
<form class="form wide" data-form="work" novalidate>
{text_field('orgname', 'Organization name', 'text', 'organization')}
<div class="addr-row" data-addr-row>
<span class="b" data-addr-beat data-k="run"></span>
<div class="addr-t"><p><span class="addr-u" data-addr>your-team.iqaa.app</span></p><p class="hint" data-addr-status role="status">Iqaa writes the address from the name.</p></div>
<button class="link" type="button" data-addr-edit>Change</button>
</div>
<div class="field" data-addr-field hidden><label for="addr">Address</label><div class="addr-in"><input id="addr" name="addr" type="text" autocomplete="off" spellcheck="false" aria-describedby="addr-err"><span>.iqaa.app</span></div><p class="err" id="addr-err" hidden></p></div>
<section class="watar" aria-labelledby="w-h">
<div class="watar-top"><span class="b" data-k="held" data-watar-ring></span><div><p class="watar-t" id="w-h">Describe your work in your words, and Watar draws the line</p><p class="hint">Watar is Iqaa’s assistant. It suggests the steps; you approve them.</p></div></div>
<div class="field" data-field="words"><label class="sr" for="words">How one job moves through your team</label>
<textarea id="words" name="words" rows="3" placeholder="For example: companies send us orders, we send a quote, and once they approve we buy the materials, cook and deliver." aria-describedby="words-hint words-err"></textarea>
<p class="err" id="words-err" hidden></p></div>
<div class="watar-act"><p class="hint" id="words-hint">A sentence or two is enough. The order can be rough.</p><button class="btn ink" type="button" data-draw><span class="b w-arch" data-k="held" aria-hidden="true">{brand.glyph_svg("held", "white", 16)}</span><span data-draw-t>Draw the line</span></button></div>
<div class="watar-out" data-watar-out hidden><p class="watar-state"><b>Draft from Watar</b><span data-watar-state></span></p><div data-draft-out></div></div>
</section>
<fieldset class="fields" aria-describedby="field-err"><legend>Or pick the closest field</legend>
<div class="fcards">{field_cards()}</div>
<p class="err" id="field-err" hidden></p>
</fieldset>
<button type="submit" hidden></button>
</form>
</section>"""
    line = f"""<section class="step" data-step="line" aria-labelledby="h-line" hidden>
<h1 id="h-line" data-line-h tabindex="-1">This is your line</h1>
<p class="lead" data-line-lead>Every job walks these stations in order. Press a step to change what kind it is, and rename a station under its steps.</p>
<p class="draft-tag" data-draft-tag><span class="b" data-k="held" data-line-ring></span><span data-draft-tag-t>Draft · waiting for your approval</span></p>
<ol class="ledit" data-edit aria-label="Your line"></ol>
<div class="sig-out" data-sig-out hidden></div>
<div class="done" data-done hidden>
<span class="done-mark" data-done-mark></span>
<p class="lead" data-done-p></p>
<div class="row-act"><a class="btn primary" href="signin.html" data-go>Go to sign-in</a><button class="btn" type="button" data-restart>Start again</button></div>
</div>
</section>"""
    bar = """<div class="su-bar" data-bar><div class="su-bar-in">
<p class="bar-t" data-bar-t aria-live="polite"></p>
<div class="bar-act"><button class="btn" type="button" data-prev hidden>Back</button><button class="btn primary" type="button" data-next>Continue</button></div>
</div></div>"""
    preview = """<aside class="su-prev" aria-label="Preview: what your team will see"><div class="prev-in">
<p class="prev-k">What your team will see</p>
<div class="prev-card" aria-hidden="true">
<div class="prev-org"><span class="prev-mark" data-prev-mark></span><span class="prev-t"><b data-prev-name>Your organization</b><span data-prev-addr>your-team.iqaa.app</span></span></div>
<p class="prev-h">Sign in</p>
<span class="prev-f"><span>Work email</span><i></i></span>
<span class="prev-f"><span>Password</span><i></i></span>
<span class="prev-b">Sign in</span>
</div>
<div class="prev-line"><p class="prev-lk" data-prev-lk>Every job will walk your line</p><div data-prev-line></div><p class="prev-empty" data-prev-empty>Describe your work or pick a field, and the line appears here.</p></div>
</div></aside>"""
    body = f'<div class="su-split"><div class="su-main"><div class="su-col">{account}{work}{line}</div>{bar}</div>{preview}</div>'
    return shell('su', 'Start your organization · Iqaa', top, body, ('signup',))
