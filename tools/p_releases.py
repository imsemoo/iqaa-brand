"""Releases (the software pack's). Rendered by assets/js/releases.js from world.js."""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def releases():
    body = f'''<div class="sp-page ap-wrap">
<header class="sp-head"><h1>{t('Releases')}</h1><p class="sp-sum" data-sum></p></header>
<div data-body></div>
</div>'''
    return shell('sp', t('Releases'), frame('Releases', 'releases'), body, ('world', 'flow', 'releases', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'softpack'))
