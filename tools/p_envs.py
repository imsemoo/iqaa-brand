"""Environments (the software pack's). Rendered by assets/js/envs.js from world.js."""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def envs():
    body = f'''<div class="sp-page ap-wrap">
<header class="sp-head"><h1>{t('Environments')}</h1><p class="sp-sum" data-sum></p></header>
<div data-body></div>
</div>'''
    return shell('sp', t('Environments'), frame('Environments', 'envs'), body, ('world', 'flow', 'envs', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'softpack'))
