"""The Today screen of an organization's app: one person's station as a platform board. What waits for you
now, what is coming to you, what you handed on today; your day writes its own signature as you work.

The lists are rendered by assets/js/today.js from the shared demo world in assets/js/sufra.js.
"""
from p_auth import runs_badge, shell
from p_line import app_top

CAST = [('reem', 'Reem'), ('salma', 'Salma'), ('yusuf', 'Yusuf'), ('hala', 'Hala')]


def today():
    body = '''<div class="td-page">
<header class="td-head ap-wrap">
<div class="td-hi">
<p class="td-day" data-day></p>
<h1 data-greet tabindex="-1"></h1>
<p class="td-sum" data-sum></p>
</div>
</header>
<section class="td-band ap-wrap" aria-labelledby="day-h">
<div class="db-k"><h2 id="day-h">Your day</h2><p data-day-cap></p></div>
<div class="db-line" data-day-sig></div>
</section>
<div class="td-grid ap-wrap">
<section class="td-wait" aria-labelledby="w-h">
<h2 id="w-h">Waiting for you</h2>
<ol class="jobs" data-wait></ol>
<div class="td-empty" data-empty hidden></div>
</section>
<aside class="td-side">
<section aria-labelledby="c-h"><h2 id="c-h">Coming to you</h2><ol class="mini" data-coming></ol></section>
<section aria-labelledby="d-h"><h2 id="d-h">Done today</h2><ol class="mini" data-done></ol></section>
</aside>
</div>
<p class="sr" data-live aria-live="polite"></p>
</div>'''
    who = ' · '.join(f'<a href="today.html?as={k}">{n}</a>' for k, n in CAST)
    foot = f'<div class="sign-off">{runs_badge()}</div><p class="td-as">Prototype: see Today as {who}.</p>'
    return shell('td', 'Today · Sufra', app_top('Today'), body, ('sufra', 'jobs', 'today'), foot=foot, css=('app', 'today'))
