"""Orders: every job on the line, filtered by the line itself, and a page for each order.

The lists and the order page are rendered by assets/js/orders.js and order.js from the demo world in sufra.js.
"""
from p_auth import runs_badge, shell
from p_line import app_top


def orders():
    body = '''<div class="or-page">
<header class="or-head ap-wrap">
<div><h1>Orders</h1><p class="or-sum" data-sum aria-live="polite"></p></div>
<div class="or-find"><label class="sr" for="or-q">Find an order</label><input id="or-q" type="search" placeholder="Find an order, a client or a code" autocomplete="off" data-q></div>
</header>
<section class="om-wrap" aria-labelledby="om-h"><div class="ap-wrap"><h2 id="om-h">Where the jobs are</h2><p class="hint">Press a station to see only the jobs there.</p></div>
<div class="om" data-map></div></section>
<div class="or-bar ap-wrap">
<div class="or-tabs" role="tablist" aria-label="Orders"><button type="button" role="tab" aria-selected="true" data-tab="line">On the line <span data-n="line"></span></button><button type="button" role="tab" aria-selected="false" data-tab="done">Done this week <span data-n="done"></span></button></div>
<p class="or-filter" data-filter hidden></p>
</div>
<section class="ap-wrap" aria-label="Orders list"><ol class="or-list" data-list></ol><div class="or-empty" data-empty hidden></div></section>
</div>'''
    return shell('or', 'Orders · Sufra', app_top('Orders'), body, ('sufra', 'jobs', 'orders'), foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'orders'))


def order():
    body = '''<div class="od-page" data-order>
<div class="ap-wrap od-back"><a href="orders.html">Orders</a></div>
<header class="od-head ap-wrap" data-head></header>
<section class="od-journey ap-wrap" aria-labelledby="jr-h"><div class="od-jk"><h2 id="jr-h">The job’s line</h2><p data-jr-cap></p></div><div class="od-line" data-journey></div></section>
<div class="od-grid ap-wrap">
<section class="od-stations" aria-labelledby="st-h"><h2 id="st-h">Station by station</h2><ol data-stations></ol></section>
<aside class="od-side" data-side></aside>
</div>
</div>'''
    return shell('od', 'Order · Sufra', app_top('Orders'), body, ('sufra', 'jobs', 'order'), foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'orders'))


def overview():
    body = '''<div class="ov-page">
<header class="ov-head ap-wrap"><p class="td-day" data-day></p><h1>Good morning, Hala</h1><p class="or-sum" data-sum></p></header>
<section class="om-wrap" aria-labelledby="ovm-h"><div class="ap-wrap"><h2 id="ovm-h">The line now</h2><p class="hint">How many jobs wait at each station. Press one to see them.</p></div><div class="om" data-map></div></section>
<section class="ov-team ap-wrap" aria-labelledby="tm-h"><div class="ov-k"><h2 id="tm-h">The team today</h2><p class="hint">Each person’s day as a line in time: what they finished at its hour, and what is still theirs in grey after now (09:41).</p></div><ol class="tm-list" data-team></ol></section>
<div class="ov-grid ap-wrap">
<section aria-labelledby="due-h"><h2 id="due-h">Due by tomorrow <span data-n-due></span></h2><ol class="or-list" data-due></ol></section>
<section aria-labelledby="cl-h"><h2 id="cl-h">Waiting on clients <span data-n-clients></span></h2><ol class="or-list" data-clients></ol></section>
</div>
<section class="ap-wrap ov-done" aria-labelledby="dn-h"><h2 id="dn-h">Finished this week <span data-n-done></span></h2><ol class="or-list" data-done></ol></section>
</div>'''
    return shell('ov', 'Overview · Sufra', app_top('Overview'), body, ('sufra', 'jobs', 'overview'), foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'orders'))
