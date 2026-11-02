"""Client approvals (a member's tool). Rendered by assets/js/approvals.js from world.js."""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def approvals():
    body = f'''<div class="tl-page ap-wrap">
<header class="tl-head"><h1>{t('Client approvals')}</h1><p class="tl-sum" data-sum></p></header>
<div data-body></div>
</div>'''
    return shell('tl', t('Client approvals'), frame('Client approvals', 'approvals'), body, ('world', 'flow', 'approvals', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'tools'))
