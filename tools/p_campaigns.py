"""Campaigns (the agency pack's). Rendered by assets/js/campaigns.js from world.js."""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def campaigns():
    body = f'''<div class="ag-page ap-wrap">
<header class="ag-head"><h1>{t('Campaigns')}</h1><p class="ag-sum" data-sum></p></header>
<div data-body></div>
</div>'''
    return shell('ag', t('Campaigns'), frame('Campaigns', 'campaigns'), body, ('world', 'flow', 'campaigns', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'agencypack'))
