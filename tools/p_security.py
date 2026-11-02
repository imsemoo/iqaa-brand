"""Settings · Security (الأمان): how people sign in, which fields are sensitive and who may see them, the client links
open now, the named acceptances behind full automation, and how keys are kept. Rendered by assets/js/security.js.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame
from p_packs import settings_tabs


def security():
    body = f'''<div class="pk-page ap-wrap">
<header class="pk-head"><h1>{t('Settings')}</h1></header>
{settings_tabs('security')}
<div class="pk-live" role="status"><p class="pk-note" data-note hidden><span data-note-t></span><button type="button" class="link" data-undo>{t('Undo')}</button></p></div>
<div class="sc-grid" data-body></div>
</div>'''
    return shell('sc', t('Security'), frame('Settings', 'security'), body, ('world', 'flow', 'security', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'packs', 'security'))
