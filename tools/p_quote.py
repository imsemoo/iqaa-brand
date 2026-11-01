"""The client's link: what a client of Sufra opens at sufra.iqaa.app/q/<order>, without an account.

Sufra leads and Iqaa signs off once, at the foot (the co-branding rule on the Watar and co-branding page). The page is
rendered by assets/js/quote.js from the demo world in sufra.js: the quote while it waits for the client's answer, then
the order as it walks Sufra's line. The client reads it in the language they choose: the switch sits in Sufra's header.
"""
from i18n import t
from p_auth import lang_switch, runs_badge, shell
from p_ct import icon

# the prototype's own links: one client at each moment of an order
AS = (('0030', 'Omar', 'the quote waits'), ('0035', 'Lina', 'order received'), ('0028', 'Sami', 'being prepared'),
      ('0027', 'Yara', 'on its way'), ('0026', 'Karim', 'delivered'))


def quote():
    body = f'''<div class="qt-page">
<header class="qt-top"><div class="qt-org"><span class="org-mark" data-sig></span><span class="org-t"><b data-org-name>{t('Sufra')}</b><span data-org-field>{t('Catering · Ramallah')}</span></span></div>
<div class="lang-top">{lang_switch('quote', note=False)}</div></header>
<div class="qt-grid">
<section class="qt-main" data-main aria-labelledby="qt-h"></section>
<aside class="qt-side" data-side hidden>
<section class="qt-jr" aria-labelledby="jr-h"><h2 id="jr-h">{icon('Line', 18)}<span>{t('Your order with {org}', org=f'<span data-org-name>{t("Sufra")}</span>')}</span></h2><ol data-journey></ol></section>
<section class="qt-help" aria-labelledby="hp-h"><h2 id="hp-h">{icon('Message', 18)}<span>{t('Questions?')}</span></h2><p data-help></p></section>
</aside>
</div>
<p class="sr" data-live aria-live="polite"></p>
</div>'''
    who = ' · '.join(f'<a href="quote.html?q={c}">{t(n)}</a> <span>({t(w)})</span>' for c, n, w in AS)
    foot = (f'<div class="sign-off">{runs_badge()}</div>'
            f'<p class="qt-as">{t("Prototype: open the link as {who}.", who=who)} <button type="button" class="link" data-reset>{t("Start over")}</button></p>')
    return shell('qt', f"{t('Your order')} · {t('Sufra')}", '', body, ('sufra', 'jobs', 'quote'), foot=foot, css=('quote',))
