"""Repositories (the software pack's). Rendered by assets/js/repos.js from world.js."""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def repos():
    body = f'''<div class="sp-page ap-wrap">
<header class="sp-head"><h1>{t('Repositories')}</h1><p class="sp-sum" data-sum></p></header>
<div data-body></div>
</div>'''
    return shell('sp', t('Repositories'), frame('Repositories', 'repos'), body, ('world', 'flow', 'repos', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'softpack'))
