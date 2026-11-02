"""Templates (القوالب), the owner's: what the lines make their outputs from. The templates, each with its kind, size,
state and how it was made; the one selected with its newest version, its slots, the identity it draws in, a preview
filled with a real item's values, and its versions. The parts are rendered by assets/js/templates.js from world.js.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def templates():
    body = f'''<div class="tm-page ap-wrap">
<header class="tm-head">
<div class="tm-ht"><h1 title="{t('What the lines make their outputs from: a carousel, a card, a reel. Nothing is made from a template until a person approves it.')}">{t('Templates')}</h1><span class="sr" data-org></span></div>
<div class="tm-acts" data-acts></div>
</header>
<div class="tm-live" role="status"><p class="tm-note" data-note hidden><span data-note-t></span><button type="button" class="link" data-undo>{t('Undo')}</button></p></div>
<div class="tm-grid" data-body>
<section class="tm-list" aria-labelledby="tm-list-h"><h2 id="tm-list-h">{t('All templates')} <span data-n></span></h2><ul data-list></ul></section>
<section class="tm-det" aria-labelledby="tm-d-h" data-detail></section>
</div>
</div>'''
    return shell('tm', t('Templates'), frame('Templates', 'templates'), body, ('world', 'flow', 'templates', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'templates'))
