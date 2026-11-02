"""Settings · Log (السجل): every move on the line, the same for every organization: what people did, what the machine
did, what came and went through integrations. Rendered by assets/js/log.js from world.js.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame
from p_packs import settings_tabs


def log():
    body = f'''<div class="pk-page ap-wrap">
<header class="pk-head"><h1>{t('Settings')}</h1></header>
{settings_tabs('log')}
<div data-body>
<div class="lg-day" data-day></div>
<div class="lg-filter" role="group" aria-label="{t('Show')}" data-filter></div>
<div data-list></div>
</div>
</div>'''
    return shell('lg', t('Log'), frame('Settings', 'log'), body, ('world', 'flow', 'log', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'packs', 'log'))
