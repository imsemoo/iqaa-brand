"""The client's review by link: what a client of the organization opens from a signed, temporary link, without an
account, to approve an item or ask for changes. Outside the app, so no frame: the organization leads with its own
name and mark, and Iqaa signs off once, at the foot (the co-branding rule, as on the quote link). The link names the
item by ?code=; assets/js/review.js renders it from world.js (the organization's `shares`). The client reads it in
the language they choose: the switch sits in the organization's header.
"""
from i18n import t
from p_auth import lang_switch, runs_badge, shell


def review():
    body = f'''<div class="rv-page">
<header class="rv-top"><div class="rv-org" data-org hidden><span class="org-mark" data-sig></span><b data-org-name></b></div>
<div class="lang-top">{lang_switch('review', note=False)}</div></header>
<div class="rv-sheet" data-main></div>
<p class="sr" data-live aria-live="polite"></p>
</div>'''
    foot = (f'<div class="sign-off">{runs_badge()}</div>'
            f'<p class="rv-as">{t("Prototype: the link as the client opens it.")} <button type="button" class="link" data-reset>{t("Start over")}</button></p>')
    return shell('rv', t('Review'), '', body, ('world', 'flow', 'review'), foot=foot, css=('review',))
