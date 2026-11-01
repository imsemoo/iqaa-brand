"""Clients: every client grouped by whose move it is, and a page for each client with its line with Sufra.

The list and the client page are rendered by assets/js/clients.js and client.js from the demo world in sufra.js,
through the shared reading of clients in jobs.js.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_ct import icon
from p_line import app_top


def clients():
    body = f'''<div class="cl-page">
<header class="or-head ap-wrap">
<div><h1>{t('Clients')}</h1><p class="or-sum" data-sum></p></div>
<div class="or-find">{icon('Search', 18)}<label class="sr" for="cl-q">{t('Find a client')}</label><input id="cl-q" type="search" placeholder="{t('Find a client, a contact or an order code')}" autocomplete="off" data-q></div>
</header>
<section class="cl-wrap ap-wrap" aria-label="{t('Clients, by whose move it is')}">
<p class="cl-key" aria-hidden="true"><span>{t('Client')}</span><span>{t('Open order')}</span><span>{t('Whose move')}</span><span>{t('History')}</span></p>
<div data-groups></div>
<div class="or-empty" data-empty hidden></div>
<p class="sr" data-live aria-live="polite"></p>
</section>
</div>'''
    return shell('cl', f"{t('Clients')} · {t('Sufra')}", app_top('Clients'), body, ('sufra', 'jobs', 'clients'), foot=f'<div class="sign-off">{runs_badge()}</div>',
                 css=('app', 'orders', 'clients'))


def client():
    body = f'''<div class="cp-page" data-client>
<div class="ap-wrap od-back"><a href="clients.html">{t('Clients')}</a></div>
<header class="od-head ap-wrap" data-head></header>
<section class="cp-band ap-wrap" aria-labelledby="ln-h" data-band>
<div class="cp-bk"><h2 id="ln-h">{icon('Line', 18)}<span>{t('Line with Sufra')}</span></h2></div>
<div class="cp-line" data-line></div>
<div class="cp-read"><p data-reading></p><ul class="cp-legend" data-legend aria-label="{t('How to read the line')}"></ul></div>
</section>
<div class="od-grid cp-grid ap-wrap" data-grid>
<section class="cp-open" aria-labelledby="open-h"><h2 id="open-h">{icon('Orders', 18)}<span>{t('Open now')}</span></h2><div data-open></div></section>
<aside class="od-side cp-side" aria-labelledby="ct-h" data-contact></aside>
<section class="cp-orders" id="orders" aria-labelledby="ord-h"><h2 id="ord-h">{icon('History', 18)}<span>{t('Orders')}</span> <span class="cp-n" data-n-orders-of></span></h2>
<p class="cp-key" aria-hidden="true"><span>{t('Order')}</span><span>{t('Event')}</span><span>{t('Their answer')}</span><span>{t('Delivery')}</span></p>
<ol class="cp-ol" data-orders></ol></section>
</div>
</div>'''
    return shell('cp', f"{t('Client')} · {t('Sufra')}", app_top('Clients'), body, ('sufra', 'jobs', 'client'), foot=f'<div class="sign-off">{runs_badge()}</div>',
                 css=('app', 'orders', 'clients'))
