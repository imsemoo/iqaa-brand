"""Clients (the agency pack's). Rendered by assets/js/clients.js from world.js."""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def clients():
    body = f'''<div class="ag-page ap-wrap">
<header class="ag-head"><h1>{t('Clients')}</h1><p class="ag-sum" data-sum></p></header>
<div data-body></div>
</div>'''
    return shell('ag', t('Clients'), frame('Clients', 'clients'), body, ('world', 'flow', 'clients', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'agencypack'))
