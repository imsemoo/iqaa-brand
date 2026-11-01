"""The Line screen of an organization's app: the line drawn as a metro map, its stations and steps edited in place,
a test job that sends nothing, and versions that running jobs keep.

The map, the detail panel and the test are rendered by assets/js/line.js; this file writes the frame around them.
"""
import brand
from p_auth import runs_badge, shell
from shell import inline

NAV = ['Overview', 'Today', 'Line', 'Orders']
NEXT = ['Clients', 'Settings', 'Ask Watar']
PAGES = {'Overview': 'overview.html', 'Today': 'today.html', 'Line': 'line.html', 'Orders': 'orders.html'}


def app_top(current):
    """The organization's sidebar, on the desk beside the sheet: the organization and its menu, search, the screens
    with what waits in each, the screens still to come, and the person signed in. On a phone the organization sits in
    a slim bar on top and the screens become a tab bar along the bottom."""
    from p_ct import icon

    def item(n):
        cur = ' aria-current="page"' if n == current else ''
        today = ' data-today' if n == 'Today' else ''
        count = {'Today': '<i class="ap-n me" data-n-today></i>', 'Orders': '<i class="ap-n" data-n-orders></i>'}.get(n, '')
        return f'<li><a class="ap-l" href="{PAGES[n]}" title="{n}"{cur}{today}>{icon(n, 20)}<span>{n}</span>{count}</a></li>'

    def soon(n):
        return f'<li><span class="ap-l" aria-disabled="true" title="{n}: coming next">{icon(n, 20)}<span>{n}</span><em>Soon</em></span></li>'
    fold = ('<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true"><path d="M14 7l-5 5 5 5M19 5v14"/></svg>')
    return f'''<div class="ap-side">
<div class="ap-head">
<button type="button" class="ap-org" data-org-menu aria-expanded="false" aria-controls="ap-org-menu" title="Sufra">
<span class="org-mark" data-org-mark></span><span class="ap-org-t"><b data-org-name>Sufra</b><span>sufra.iqaa.app</span></span>{icon('Switch', 16)}</button>
<div class="ap-menu" id="ap-org-menu" hidden>
<p class="ap-menu-h">You are in <b>sufra.iqaa.app</b></p>
<a href="signup.html">{icon('Create', 18)}<span>Start another organization</span></a>
<span aria-disabled="true">{icon('Settings', 18)}<span>Organization settings</span><em>Soon</em></span>
<hr>
<a href="signin.html">{icon('Sign out', 18)}<span>Sign out</span></a>
</div>
<button type="button" class="ap-search" data-palette aria-keyshortcuts="Control+K Meta+K" title="Search">{icon('Search', 18)}<span>Search</span><kbd data-kbd>Ctrl K</kbd></button>
</div>
<nav class="ap-nav" aria-label="Sufra">
<ul class="ap-links">{''.join(item(n) for n in NAV)}</ul>
<p class="ap-group" id="ap-next">Coming next</p>
<ul class="ap-links ap-soon" aria-labelledby="ap-next">{''.join(soon(n) for n in NEXT)}</ul>
</nav>
<div class="ap-foot">
<span class="ap-me"><span class="me-av" aria-hidden="true" data-me-av>H</span><span class="ap-me-t"><span class="sr">Signed in as </span><b data-me-name>Hala</b><span data-me-role>Owner</span></span></span>
<button type="button" class="ap-fold" data-fold aria-pressed="false" aria-label="Fold the sidebar" title="Fold the sidebar">{fold}</button>
</div>
</div>'''


def view_switch(current):
    """Map reads, tests and publishes the line; Build edits it on a free canvas."""
    return ('<nav class="vw" aria-label="View of the line">'
            + ''.join(f'<a href="{h}"{' aria-current="page"' if n == current else ''}>{n}</a>' for n, h in (('Map', 'line.html'), ('Build', 'build.html')))
            + '</nav>')


def legend():
    rows = [
        ('<svg viewBox="0 0 40 20" aria-hidden="true"><path d="M2 10h36" stroke="#19172E" stroke-width="6" stroke-linecap="round"/><circle cx="20" cy="10" r="7" fill="#fff" stroke="#19172E" stroke-width="4"/></svg>',
         'A station: work changes hands here'),
        ('<svg viewBox="0 0 40 20" aria-hidden="true"><path d="M2 4h10l12 12h14" fill="none" stroke="#19172E" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
         'A branch: some jobs take another route'),
        ('<svg viewBox="0 0 40 20" aria-hidden="true"><path d="M34 3v7a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V3" fill="none" stroke="#19172E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
         'A way back to an earlier station'),
    ]
    items = ''.join(f'<li>{s}<span>{t}</span></li>' for s, t in rows)
    steps = ''.join(f'<li><span class="lg-g">{inline(brand.glyph_svg(k, "light", 28))}</span><span>{t}</span></li>' for k, t in (
        ('run', 'Runs by itself'), ('struck', 'A person does it'), ('held', 'Waits for a person'), ('rest', 'Timed wait')))
    return f'<div class="lg" aria-label="How to read the map"><ul class="lg-map">{items}</ul><ul class="lg-steps">{steps}</ul></div>'


def line():
    body = f'''<div class="ln-page">
<header class="ln-head ap-wrap">
<div class="ln-title">
<div class="ln-hr"><h1 id="ln-h"><span data-org-name>Sufra</span>’s line</h1>{view_switch('Map')}</div>
<p class="ln-state" data-state aria-live="polite"></p>
</div>
<figure class="ln-sig"><div data-head-sig></div><figcaption data-sig-cap></figcaption></figure>
<div class="ln-act">
<button class="btn" type="button" data-test-open>Run a test job</button>
<button class="btn primary" type="button" data-publish-open></button>
</div>
</header>
<div class="ln-confirm ap-wrap" data-confirm hidden>
<div class="cf-in" role="group" aria-labelledby="cf-h">
<p id="cf-h"><b data-cf-t></b> <span data-cf-p></span></p>
<div class="cf-act"><button class="btn" type="button" data-cf-no>Keep editing</button><button class="btn primary" type="button" data-cf-yes></button></div>
</div>
</div>
<p class="ln-note ap-wrap" data-note role="status" hidden><span data-note-t></span> <button class="link" type="button" data-undo>Undo</button></p>
<section class="map-wrap" aria-labelledby="map-h">
<h2 class="sr" id="map-h">Map of the line</h2>
<div class="map" data-map><div class="map-in" data-map-in>
<svg class="tracks" data-tracks aria-hidden="true"></svg>
<ol class="stations" data-stations aria-label="Stations, in the order every job walks them"></ol>
<span class="token" data-token hidden></span>
</div></div>
<div class="ap-wrap">{legend()}</div>
</section>
<section class="detail ap-wrap" data-detail aria-label="Selected station"></section>
<section class="test ap-wrap" data-test aria-labelledby="test-h" hidden>
<div class="test-head">
<h2 id="test-h">Test job</h2>
<p class="hint" data-test-of></p>
</div>
<form class="test-set" data-test-set novalidate>
<p class="test-job"><b>Lunch for Nakhla</b> <span>for Maha at Nakhla Co. · Thu 5 Nov, 13:00</span></p>
<div class="test-opts">
<div class="field small"><label for="t-people">People in the order</label><input id="t-people" type="number" inputmode="numeric" min="1" max="999" value="40"></div>
<label class="chk"><input type="checkbox" data-t-back checked><span>Take each way back once</span></label>
</div>
<div class="row-act"><button class="btn" type="button" data-test-cancel>Cancel</button><button class="btn ink" type="submit"><span class="b" data-k="run" data-test-beat></span>Start the test</button></div>
</form>
<ol class="test-log" data-test-log aria-live="polite"></ol>
<div class="test-end" data-test-end hidden><p data-test-sum></p><div class="row-act"><button class="btn" type="button" data-test-again>Run it again</button><button class="btn ink" type="button" data-test-close>Back to the line</button></div></div>
</section>
<div class="test-bar" data-test-bar hidden><div class="ap-wrap tb-in"><span class="tb-dot" aria-hidden="true"></span><p data-test-now></p><button class="btn small" type="button" data-test-skip>Skip to the end</button></div></div>
</div>'''
    return shell('ln', 'Line · Sufra', app_top('Line'), body, ('sufra', 'line'), foot=f'<div class="sign-off">{runs_badge()}</div>',
                 css=('app', 'line'))
