"""The Line screen of an organization's app: the line drawn as a metro map, its stations and steps edited in place,
a test job that sends nothing, and versions that running jobs keep.

The map, the detail panel and the test are rendered by assets/js/line.js; this file writes the frame around them.
"""
import brand
from i18n import t
from p_auth import lang_switch, runs_badge, shell
from shell import inline

NAV = ['Overview', 'Today', 'Inbox', 'Line', 'Orders', 'Clients', 'Ask Watar', 'Settings']
NEXT = []
PAGES = {'Overview': 'overview.html', 'Today': 'today.html', 'Inbox': 'inbox.html', 'Line': 'line.html', 'Orders': 'orders.html', 'Clients': 'clients.html',
         'Ask Watar': 'watar.html', 'Settings': 'settings.html'}


def app_top(current):
    """The organization's sidebar, on the desk beside the sheet: the organization and its menu, search, the screens
    with what waits in each, the screens still to come, and the person signed in. On a phone the organization sits in
    a slim bar on top and the screens become a tab bar along the bottom; Ask Watar moves up beside Search there,
    because five tabs fill the bar, and Settings is reached from the organization's menu and search."""
    from p_ct import icon

    def item(n):
        cur = ' aria-current="page"' if n == current else ''
        today = ' data-today' if n == 'Today' else ''
        count = {'Today': '<i class="ap-n me" data-n-today></i>', 'Inbox': '<i class="ap-n" data-n-inbox></i>', 'Orders': '<i class="ap-n" data-n-orders></i>',
                 'Clients': '<i class="ap-n" data-n-clients></i>', 'Ask Watar': '<i class="ap-n me" data-n-watar></i>'}.get(n, '')
        # on a phone the tab bar holds five: the Line (desk work) is reached from search, like Settings
        li = {'Ask Watar': ' class="ap-li-watar"', 'Settings': ' class="ap-wide"', 'Line': ' class="ap-wide"'}.get(n, '')
        return f'<li{li}><a class="ap-l" href="{PAGES[n]}" title="{t(n)}"{cur}{today}>{icon(n, 20)}<span>{t(n)}</span>{count}</a></li>'

    def soon(n):
        return f'<li><span class="ap-l" aria-disabled="true" title="{t(n)}: {t("coming next")}">{icon(n, 20)}<span>{t(n)}</span><em>{t("Soon")}</em></span></li>'
    # the screens still to come, while there are any
    next_ = (f'<p class="ap-group" id="ap-next">{t("Coming next")}</p>\n<ul class="ap-links ap-soon" aria-labelledby="ap-next">{"".join(soon(n) for n in NEXT)}</ul>\n'
             if NEXT else '')
    fold = ('<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true"><path d="M14 7l-5 5 5 5M19 5v14"/></svg>')
    return f'''<div class="ap-side">
<div class="ap-head">
<button type="button" class="ap-org" data-org-menu data-menu aria-expanded="false" aria-controls="ap-org-menu" title="{t('Sufra')}">
<span class="org-mark" data-org-mark></span><span class="ap-org-t"><b data-org-name>{t('Sufra')}</b><span dir="ltr">sufra.iqaa.app</span></span>{icon('Switch', 16)}</button>
<div class="ap-menu" id="ap-org-menu" hidden>
<p class="ap-menu-h">{t('You are in {address}', address='<b dir="ltr">sufra.iqaa.app</b>')}</p>
<a href="signup.html">{icon('Create', 18)}<span>{t('Start another organization')}</span></a>
<a href="settings.html">{icon('Settings', 18)}<span>{t('Settings')}</span></a>
<hr>
<a href="signin.html">{icon('Sign out', 18)}<span>{t('Sign out')}</span></a>
</div>
<button type="button" class="ap-search" data-palette aria-keyshortcuts="Control+K Meta+K" title="{t('Search')}">{icon('Search', 18)}<span>{t('Search')}</span><kbd data-kbd dir="ltr">Ctrl K</kbd></button>
<a class="ap-ask" href="watar.html" aria-label="{t('Ask Watar')}" title="{t('Ask Watar')}"{' aria-current="page"' if current == 'Ask Watar' else ''}>{icon('Ask Watar', 20)}<i class="ap-dot" data-n-watar-dot hidden><span class="sr"></span></i></a>
</div>
<nav class="ap-nav" aria-label="{t('Sufra')}">
<ul class="ap-links">{''.join(item(n) for n in NAV)}</ul>
{next_}</nav>
<div class="ap-foot">
<span class="ap-me"><span class="me-av" aria-hidden="true" data-me-av>{t('Hala')[0]}</span><span class="ap-me-t"><span class="sr">{t('Signed in as')} </span><b data-me-name data-who="Hala">{t('Hala')}</b><span data-me-role>{t('Owner')}</span></span></span>
{lang_switch(PAGES[current][:-5], up=True)}
<button type="button" class="ap-fold" data-fold aria-pressed="false" aria-label="{t('Fold the sidebar')}" title="{t('Fold the sidebar')}">{fold}</button>
</div>
</div>'''


def view_switch(current):
    """Map reads, tests and publishes the line; Build edits it on a free canvas."""
    return (f'<nav class="vw" aria-label="{t("View of the line")}">'
            + ''.join(f'<a href="{h}"{' aria-current="page"' if n == current else ''}>{t(n)}</a>' for n, h in (('Map', 'line.html'), ('Build', 'build.html')))
            + '</nav>')


def legend():
    # the branch leaves the line the way the map does, so in Arabic it is drawn mirrored (flow)
    rows = [
        ('<svg viewBox="0 0 40 20" aria-hidden="true"><path d="M2 10h36" stroke="#19172E" stroke-width="6" stroke-linecap="round"/><circle cx="20" cy="10" r="7" fill="#fff" stroke="#19172E" stroke-width="4"/></svg>',
         'A station: work changes hands here'),
        ('<svg class="flow" viewBox="0 0 40 20" aria-hidden="true"><path d="M2 4h10l12 12h14" fill="none" stroke="#19172E" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
         'A branch: some jobs take another route'),
        ('<svg viewBox="0 0 40 20" aria-hidden="true"><path d="M34 3v7a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V3" fill="none" stroke="#19172E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
         'A way back to an earlier station'),
    ]
    items = ''.join(f'<li>{s}<span>{t(words)}</span></li>' for s, words in rows)
    steps = ''.join(f'<li><span class="lg-g">{inline(brand.glyph_svg(k, "light", 28))}</span><span>{t(words)}</span></li>' for k, words in (
        ('run', 'Runs by itself'), ('struck', 'A person does it'), ('held', 'Waits for a person'), ('rest', 'Timed wait')))
    return f'<div class="lg" aria-label="{t("How to read the map")}"><ul class="lg-map">{items}</ul><ul class="lg-steps">{steps}</ul></div>'


def line():
    org = f'<span data-org-name>{t("Sufra")}</span>'
    # the test job is Nakhla's lunch on Thursday 5 November at 13:00, written the way each language writes a date
    due = t('{day}, {time}', day=t('{wd} {d} {mon}', wd=t('Thu'), d=5, mon=t('Nov')), time='13:00')
    body = f'''<div class="ln-page">
<header class="ln-head ap-wrap">
<div class="ln-title">
<div class="ln-hr"><h1 id="ln-h">{t('{org}’s line', org=org)}</h1>{view_switch('Map')}</div>
<p class="ln-state" data-state aria-live="polite"></p>
</div>
<figure class="ln-sig"><div data-head-sig></div><figcaption data-sig-cap></figcaption></figure>
<div class="ln-act">
<button class="btn" type="button" data-test-open>{t('Run a test job')}</button>
<button class="btn primary" type="button" data-publish-open></button>
</div>
</header>
<div class="ln-confirm ap-wrap" data-confirm hidden>
<div class="cf-in" role="group" aria-labelledby="cf-h">
<p id="cf-h"><b data-cf-t></b> <span data-cf-p></span></p>
<div class="cf-act"><button class="btn" type="button" data-cf-no>{t('Keep editing')}</button><button class="btn primary" type="button" data-cf-yes></button></div>
</div>
</div>
<p class="ln-note ap-wrap" data-note role="status" hidden><span data-note-t></span> <button class="link" type="button" data-undo>{t('Undo')}</button></p>
<section class="map-wrap" aria-labelledby="map-h">
<h2 class="sr" id="map-h">{t('Map of the line')}</h2>
<div class="map" data-map><div class="map-in" data-map-in>
<svg class="tracks" data-tracks aria-hidden="true"></svg>
<ol class="stations" data-stations aria-label="{t('Stations, in the order every job walks them')}"></ol>
<span class="token" data-token hidden></span>
</div></div>
<div class="ap-wrap">{legend()}</div>
</section>
<section class="detail ap-wrap" data-detail aria-label="{t('Selected station')}"></section>
<section class="test ap-wrap" data-test aria-labelledby="test-h" hidden>
<div class="test-head">
<h2 id="test-h">{t('Test job')}</h2>
<p class="hint" data-test-of></p>
</div>
<form class="test-set" data-test-set novalidate>
<p class="test-job"><b>{t('Lunch for Nakhla')}</b> <span>{t('for {client} at {of} · {due}', client=t('Maha'), of=t('Nakhla Co.'), due=due)}</span></p>
<div class="test-opts">
<div class="field small"><label for="t-people">{t('People in the order')}</label><input id="t-people" type="number" inputmode="numeric" min="1" max="999" value="40"></div>
<label class="chk"><input type="checkbox" data-t-back checked><span>{t('Take each way back once')}</span></label>
</div>
<div class="row-act"><button class="btn" type="button" data-test-cancel>{t('Cancel')}</button><button class="btn ink" type="submit"><span class="b" data-k="run" data-test-beat></span>{t('Start the test')}</button></div>
</form>
<ol class="test-log" data-test-log aria-live="polite"></ol>
<div class="test-end" data-test-end hidden><p data-test-sum></p><div class="row-act"><button class="btn" type="button" data-test-again>{t('Run it again')}</button><button class="btn ink" type="button" data-test-close>{t('Back to the line')}</button></div></div>
</section>
<div class="test-bar" data-test-bar hidden><div class="ap-wrap tb-in"><span class="tb-dot" aria-hidden="true"></span><p data-test-now></p><button class="btn small" type="button" data-test-skip>{t('Skip to the end')}</button></div></div>
</div>'''
    return shell('ln', t('Line · {org}', org=t('Sufra')), app_top('Line'), body, ('sufra', 'line'), foot=f'<div class="sign-off">{runs_badge()}</div>',
                 css=('app', 'line'))
