"""A block's queue (طابور البلوك), the space of the block's lead: everything in the block, given out by person. The
columns are the same for everyone: what nobody has yet, one per person in the block's working role, and what waits for
the lead's approval; a phone shows one column at a time. The head's numbers and the board are rendered by
assets/js/queue.js from world.js; Table and Block statistics are listed as coming.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def queue():
    def soon(name):
        return f'<span class="qu-v" aria-disabled="true" title="{t("{name}: coming next", name=t(name))}">{t(name)}<em>{t("Soon")}</em></span>'
    body = f'''<div class="qu-page ap-wrap">
<header class="qu-head">
<div class="qu-ht"><p class="qu-line" data-line></p><h1 data-title>{t('My blocks')}</h1><p class="qu-sum" data-sum></p></div>
<div class="qu-views" role="group" aria-label="{t('View')}" data-views><button type="button" data-view="list" aria-pressed="false">{t('List')}</button><button type="button" data-view="board" aria-pressed="true">{t('Board')}</button>{soon('Table')}{soon('Block statistics')}</div>
</header>
<div class="qu-live" role="status"><p class="qu-note" data-note hidden><span data-note-t></span><button type="button" class="link" data-undo>{t('Undo')}</button></p></div>
<div class="qu-body" data-body></div>
</div>'''
    return shell('qu', t('My blocks'), frame('My blocks', 'queue'), body, ('world', 'flow', 'queue', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'queue'))
