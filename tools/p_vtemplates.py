"""Video templates (a member's tool). Rendered by assets/js/vtemplates.js from world.js."""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def vtemplates():
    body = f'''<div class="tl-page ap-wrap">
<header class="tl-head"><h1>{t('Video templates')}</h1><p class="tl-sum" data-sum></p></header>
<div data-body></div>
</div>'''
    return shell('tl', t('Video templates'), frame('Video templates', 'vtemplates'), body, ('world', 'flow', 'vtemplates', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'tools'))
