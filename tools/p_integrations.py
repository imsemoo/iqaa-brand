"""Integrations (التكاملات), the owner's: each connection with what it is used for and its state, and the log of every
event in and out, each with its key, with a manual re-run that never does anything twice. The parts are rendered by
assets/js/integrations.js from world.js.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_ct import icon
from p_frame import frame


def integrations():
    body = f'''<div class="ig-page ap-wrap">
<header class="ig-head">
<div class="ig-ht"><p class="ig-eye" data-org></p><h1>{t('Integrations')}</h1><p class="ig-sum">{t('What the organization connected, and everything that came in from it or went out to it.')}</p></div>
<div data-add></div>
</header>
<div class="ig-live" role="status"><p class="ig-note" data-note hidden><span data-note-t></span><button type="button" class="link" data-undo hidden>{t('Undo')}</button></p></div>
<div data-body>
<section class="ig-sec" aria-labelledby="ig-c-h"><div class="ig-sh"><h2 id="ig-c-h">{icon('Link', 18)}<span>{t('Connected')}</span><span class="ig-n" data-c-n></span></h2><p data-c-sum></p></div>
<ul class="ig-cons" data-cons></ul>
<p class="ig-foot">{icon('Done', 16)}<span>{t('When an integration fails, the work goes on in Iqaa, and what waited for it goes out once it is back.')}</span></p></section>
<section class="ig-sec" aria-labelledby="ig-l-h"><div class="ig-sh"><h2 id="ig-l-h">{icon('Run log', 18)}<span>{t('Event log')}</span></h2><div class="ig-fl" role="group" aria-label="{t('Show')}" data-filter></div></div>
<p class="ig-hint">{t('Every event keeps its own key, so a re-run never does anything twice.')}</p>
<div data-log></div></section>
</div>
</div>'''
    return shell('ig', t('Integrations'), frame('Integrations', 'integrations'), body, ('world', 'flow', 'integrations', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'integrations'))
