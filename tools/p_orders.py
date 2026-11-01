"""Orders: every job on the line, filtered by the line itself, and a page for each order.

The lists and the order page are rendered by assets/js/orders.js and order.js from the demo world in sufra.js.
"""
from p_auth import runs_badge, shell
from p_ct import icon
from p_line import app_top


def orders():
    body = f'''<div class="or-page">
<header class="or-head ap-wrap">
<div><h1>Orders</h1><p class="or-sum" data-sum aria-live="polite"></p></div>
<div class="or-find">{icon('Search', 18)}<label class="sr" for="or-q">Find an order</label><input id="or-q" type="search" placeholder="Find an order, a client or a code" autocomplete="off" data-q></div>
</header>
<section class="om-wrap" aria-labelledby="om-h"><div class="ap-wrap"><h2 id="om-h">{icon('Overview', 20)}Where the jobs are</h2><p class="hint">Press a station to see only the jobs there.</p></div>
<div class="om" data-map></div></section>
<div class="or-bar ap-wrap">
<div class="or-tabs" role="tablist" aria-label="Orders"><button type="button" role="tab" aria-selected="true" data-tab="line">{icon('Line', 18)}On the line <span data-n="line"></span></button><button type="button" role="tab" aria-selected="false" data-tab="done">{icon('Done', 18)}Finished <span data-n="done"></span></button></div>
<p class="or-filter" data-filter hidden></p>
</div>
<section class="ap-wrap" aria-label="Orders list"><ol class="or-list" data-list></ol><div class="or-empty" data-empty hidden></div></section>
</div>'''
    return shell('or', 'Orders · Sufra', app_top('Orders'), body, ('sufra', 'jobs', 'orders'), foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'orders'))


def order():
    body = f'''<div class="od-page" data-order>
<div class="ap-wrap od-back"><a href="orders.html">Orders</a></div>
<header class="od-head ap-wrap" data-head></header>
<section class="od-journey ap-wrap" aria-labelledby="jr-h"><div class="od-jk"><h2 id="jr-h">{icon('Line', 20)}The job’s line</h2><p data-jr-cap></p></div><div class="od-line" data-journey></div></section>
<div class="od-grid ap-wrap">
<section class="od-stations" aria-labelledby="st-h"><h2 id="st-h">{icon('Overview', 20)}Station by station</h2><ol data-stations></ol></section>
<aside class="od-side" data-side></aside>
</div>
</div>'''
    return shell('od', 'Order · Sufra', app_top('Orders'), body, ('sufra', 'jobs', 'order'), foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'orders'))


def overview():
    body = f'''<div class="ov-page ap-wrap">
<header class="ov-head"><div><p class="td-day" data-day></p><h1>Good morning, Hala</h1></div><a class="ov-all" href="orders.html">{icon('Orders', 18)}<span>All orders</span></a></header>
<ul class="ov-kpi" data-kpi aria-label="The line in numbers"></ul>
<section class="pn ov-map" aria-labelledby="ovm-h"><div class="pn-hd"><h2 id="ovm-h">{icon('Overview', 20)}The line now</h2><p class="hint">Jobs waiting at each station. Press one to see them.</p></div><div class="om" data-map></div><ol class="om-v" data-map-v></ol></section>
<div class="ov-cols">
<div class="ov-main">
<section class="pn ov-team" aria-labelledby="tm-h"><div class="pn-hd"><h2 id="tm-h">{icon('People', 20)}The team today</h2><p class="hint">Done at its hour in colour; still theirs, after now, in grey.</p></div><ol class="tm-list" data-team></ol></section>
<section class="pn ov-done" id="done" aria-labelledby="dn-h"><div class="pn-hd"><h2 id="dn-h">{icon('Done', 20)}Finished in the last 7 days <span data-n-done></span></h2></div><ol class="dn-list" data-done></ol></section>
</div>
<section class="pn ov-att ov-side" id="attention" aria-labelledby="at-h"><div class="pn-hd"><h2 id="at-h">{icon('Late', 20)}Needs attention</h2></div>
<h3 id="due">{icon('Date', 16)}Due by tomorrow <span data-n-due></span></h3><ol class="at-list" data-due></ol>
<h3 id="clients">{icon('Clients', 16)}Waiting on clients <span data-n-clients></span></h3><ol class="at-list" data-clients></ol></section>
</div>
</div>'''
    return shell('ov', 'Overview · Sufra', app_top('Overview'), body, ('sufra', 'jobs', 'overview'), foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'orders'))
