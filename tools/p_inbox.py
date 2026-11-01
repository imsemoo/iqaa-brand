"""The Inbox: what reaches an organization before it is on the line. Each message is read by Watar into a draft order
that waits in the dashed grey pen; a person creates the order, which joins the line at Quote, or sets the message aside.

The list and the draft are rendered by assets/js/inbox.js from the demo world in sufra.js.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_ct import icon
from p_line import app_top


def inbox():
    body = f'''<div class="ib-page" data-inbox>
<header class="or-head ap-wrap ib-head">
<div><h1>{t('Inbox')}</h1><p class="or-sum" data-sum></p></div>
<button type="button" class="btn" data-new>{icon('Create', 18)}<span>{t('New order')}</span></button>
</header>
<div class="ib-grid ap-wrap" data-grid>
<section class="ib-list" aria-labelledby="ib-l-h"><h2 id="ib-l-h" class="sr">{t('Messages')}</h2><ul data-list></ul></section>
<section class="ib-detail" data-detail tabindex="-1" aria-label="{t('The message and Watar’s draft')}"></section>
</div>
<p class="sr" data-live aria-live="polite"></p>
</div>'''
    return shell('ib', f"{t('Inbox')} · {t('Sufra')}", app_top('Inbox'), body, ('sufra', 'jobs', 'inbox'), foot=f'<div class="sign-off">{runs_badge()}</div>',
                 css=('app', 'orders', 'inbox'))
