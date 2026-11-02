"""A new item (named by the organization: a new piece, ticket or campaign). The form is rendered by assets/js/new.js,
which knows the line's first block and who works there.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def new():
    body = f'''<div class="nn-page ap-wrap">
<header class="nn-head"><h1 data-h></h1><p class="nn-sum" data-sum></p></header>
<div data-body></div>
</div>'''
    return shell('nn', t('New'), frame('Home', 'new'), body, ('world', 'flow', 'new', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'new'))
