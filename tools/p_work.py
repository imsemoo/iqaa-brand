"""My work (شغلي), the plan's most opened screen: one person's items in three lists, in the same order for everyone:
in progress, new for you, open to claim. The lists and the side are rendered by assets/js/work.js from world.js.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def work():
    body = f'''<div class="wk-page ap-wrap">
<header class="wk-head">
<div class="wk-ht"><p class="wk-day" data-day></p><h1>{t('My work')}</h1><p class="wk-sum" data-sum aria-live="polite"></p></div>
<div class="wk-filter" role="group" aria-label="{t('Show')}"><button type="button" data-f="all" aria-pressed="true">{t('All')} <span data-n-all></span></button><button type="button" data-f="late" aria-pressed="false">{t('Late')} <span data-n-late></span></button></div>
</header>
<p class="wk-note" data-note role="status" hidden><span data-note-t></span> <button type="button" class="link" data-undo>{t('Undo')}</button></p>
<div class="wk-grid"><div class="wk-main" data-lists></div><aside class="wk-side" data-side aria-label="{t('Where you work')}"></aside></div>
</div>'''
    return shell('wk', t('My work'), frame('My work', 'work'), body, ('world', 'flow', 'work', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'work'))
