"""Clients: every client grouped by whose move it is, and a page for each client with its line with Sufra.

The list and the client page are rendered by assets/js/clients.js and client.js from the demo world in sufra.js,
through the shared reading of clients in jobs.js.
"""
from p_auth import runs_badge, shell
from p_ct import icon
from p_line import app_top


def clients():
    body = f'''<div class="cl-page">
<header class="or-head ap-wrap">
<div><h1>Clients</h1><p class="or-sum" data-sum></p></div>
<div class="or-find">{icon('Search', 18)}<label class="sr" for="cl-q">Find a client</label><input id="cl-q" type="search" placeholder="Find a client, a contact or an order code" autocomplete="off" data-q></div>
</header>
<section class="cl-wrap ap-wrap" aria-label="Clients, by whose move it is">
<p class="cl-key" aria-hidden="true"><span>Client</span><span>Open order</span><span>Whose move</span><span>History</span></p>
<div data-groups></div>
<div class="or-empty" data-empty hidden></div>
<p class="sr" data-live aria-live="polite"></p>
</section>
</div>'''
    return shell('cl', 'Clients · Sufra', app_top('Clients'), body, ('sufra', 'jobs', 'clients'), foot=f'<div class="sign-off">{runs_badge()}</div>',
                 css=('app', 'orders', 'clients'))


def client():
    body = f'''<div class="cp-page" data-client>
<div class="ap-wrap od-back"><a href="clients.html">Clients</a></div>
<header class="od-head ap-wrap" data-head></header>
<section class="cp-band ap-wrap" aria-labelledby="ln-h" data-band>
<div class="cp-bk"><h2 id="ln-h">{icon('Line', 18)}<span>Line with Sufra</span></h2></div>
<div class="cp-line" data-line></div>
<div class="cp-read"><p data-reading></p><ul class="cp-legend" data-legend aria-label="How to read the line"></ul></div>
</section>
<div class="od-grid cp-grid ap-wrap" data-grid>
<section class="cp-open" aria-labelledby="open-h"><h2 id="open-h">{icon('Orders', 18)}<span>Open now</span></h2><div data-open></div></section>
<aside class="od-side cp-side" aria-labelledby="ct-h" data-contact></aside>
<section class="cp-orders" id="orders" aria-labelledby="ord-h"><h2 id="ord-h">{icon('History', 18)}<span>Orders</span> <span class="cp-n" data-n-orders-of></span></h2>
<p class="cp-key" aria-hidden="true"><span>Order</span><span>Event</span><span>Their answer</span><span>Delivery</span></p>
<ol class="cp-ol" data-orders></ol></section>
</div>
</div>'''
    return shell('cp', 'Client · Sufra', app_top('Clients'), body, ('sufra', 'jobs', 'client'), foot=f'<div class="sign-off">{runs_badge()}</div>',
                 css=('app', 'orders', 'clients'))
