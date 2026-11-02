"""Publishing (النشر على المنصات), the media pack's: this week's posts on a calendar, one row per platform, and what
waits before it can go out. Rendered by assets/js/publishing.js from world.js `posts`.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def publishing():
    body = f'''<div class="pb2-page ap-wrap">
<header class="pb2-head"><h1>{t('Publishing')}</h1><p class="pb2-sum" data-sum></p></header>
<div class="pb2-key" data-key aria-hidden="true"></div>
<div class="pb2-cal" data-cal></div>
<section class="pb2-wait" aria-labelledby="pb2-w-h"><h2 id="pb2-w-h">{t('Waits before it can go out')}</h2><ul data-wait></ul></section>
</div>'''
    return shell('pb2', t('Publishing'), frame('Publishing', 'publishing'), body, ('world', 'flow', 'publishing', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'publishing'))
