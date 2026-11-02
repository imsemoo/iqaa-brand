"""Reviewing what Watar built (مراجعة ما بناه الذكاء), before the owner invites the team: Watar says in the
organization's words what it built and draws the line; the departments it suggests, the fields an item carries (the
sensitive one marked), the invitations by the roles it made, and for each block who may do what. Everything Watar
proposed is in the dashed grey pen until a person accepts it. Rendered by assets/js/built.js from world.js;
publish.js comes first for the check every line passes (window.CHECK).
"""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def built():
    body = f'''<div class="bt-page ap-wrap">
<header class="bt-head">
<div class="bt-ht"><p class="bt-eyebrow" data-line></p><h1>{t('Review what was built before you invite your team')}</h1><p class="bt-sum" data-sum></p></div>
<div class="bt-act" data-act></div>
</header>
<div class="bt-prop" data-prop></div>
</div>'''
    return shell('bt', t('Review what Watar built'), frame('Lines', 'built'), body, ('world', 'flow', 'publish', 'built', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'built'))
