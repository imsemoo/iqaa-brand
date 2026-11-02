"""Notifications (الإشعارات): what reached the person, newest first, unread until opened. One of the three screens the
plan's phone frame keeps for everyone (My work, Notifications, Account). Rendered by assets/js/notify.js from world.js.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def notify():
    body = f'''<div class="nt-page ap-wrap">
<header class="nt-head">
<div class="nt-ht"><h1>{t('Notifications')}</h1><p class="nt-sum" data-sum aria-live="polite"></p></div>
<div class="nt-acts" data-acts></div>
</header>
<div class="nt-filter" role="group" aria-label="{t('Show')}"><button type="button" data-f="all" aria-pressed="true">{t('All')} <span data-n-all></span></button><button type="button" data-f="unread" aria-pressed="false">{t('Unread')} <span data-n-unread></span></button></div>
<div data-list></div>
</div>'''
    return shell('nt', t('Notifications'), frame('Notifications', 'notify'), body, ('world', 'flow', 'notify', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'notify'))
