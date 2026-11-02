"""My space (مساحتي): the person themself, the third screen of the plan's phone frame (My work, Notifications, Account).
Rendered by assets/js/me.js from world.js.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def me():
    body = f'''<div class="me-page ap-wrap">
<header class="me-head" data-head></header>
<div class="me-grid">
<section class="me-box" aria-labelledby="me-wk-h"><h2 id="me-wk-h">{t('My week')}</h2><div data-week></div></section>
<section class="me-box" aria-labelledby="me-wh-h"><h2 id="me-wh-h">{t('Where I work')}</h2><ul class="me-where" data-where></ul></section>
<section class="me-box" aria-labelledby="me-sk-h"><h2 id="me-sk-h">{t('Skills')}</h2><ul class="me-sks" data-skills></ul></section>
<section class="me-box" aria-labelledby="me-nt-h"><h2 id="me-nt-h">{t('Notifications')}</h2><div data-channel></div></section>
</div>
<p class="me-out"><a class="btn" href="signin.html">{t('Sign out')}</a></p>
</div>'''
    return shell('me', t('My space'), frame('My space', 'me'), body, ('world', 'flow', 'me', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'me'))
