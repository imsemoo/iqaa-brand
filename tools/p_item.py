"""The item page (a piece, a ticket), one template for every organization: where it came from and the one thing its
person does next, its place on its line in the line's strokes, then tabs over its work (the block's fields for the
role, files, discussion, log, and the pack's own tabs) beside its details and Watar. Rendered by assets/js/item.js
from world.js; what a role may not see is left out, as the server would leave it out.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def item():
    body = f'''<div class="it-page ap-wrap">
<header class="it-head" data-head></header>
<div data-backf></div>
<p class="it-note" data-note role="status" hidden><span data-note-t></span> <button type="button" class="link" data-undo>{t('Undo')}</button></p>
<div class="it-line" data-line></div>
<div class="it-grid" data-body></div>
</div>'''
    return shell('it', t('Item'), frame('Item', 'item'), body, ('world', 'flow', 'item', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'item'))
