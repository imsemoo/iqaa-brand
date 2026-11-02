"""Sources and what came in from them (المصادر): what opens items in a line by itself (a feed, a webhook, a channel, a
schedule, another line), each with its setup (the line it opens items in, its address, the field map Watar suggests
and a person approves, its entry rule), and every attempt that came in today, even those turned away, with the reason:
became an item, a duplicate that did not enter, turned away by the entry rule, failed. Nothing enters a line twice.
Everything inside is rendered by assets/js/sources.js from world.js.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def sources():
    body = f'''<div class="so-page ap-wrap">
<header class="so-head">
<div class="so-ht"><h1>{t('Sources')}</h1><p class="so-sum">{t('What opens items in a line by itself, and every attempt that came in from it today, even what was turned away.')}</p></div>
<div class="so-new" data-new></div>
</header>
<p class="so-bar" data-note role="status" hidden><span data-note-t></span> <button type="button" class="link" data-undo>{t('Undo')}</button></p>
<div class="so-cols" data-cols hidden>
<section class="so-list" aria-labelledby="so-list-h"><h2 id="so-list-h">{t('Sources')} <span data-n></span></h2><ul class="so-l" data-list></ul></section>
<section class="so-d" id="so-d" data-detail aria-labelledby="so-d-h"></section>
</div>
<section class="so-none" data-none aria-labelledby="so-none-h" hidden></section>
</div>'''
    return shell('so', t('Sources'), frame('Sources', 'sources'), body, ('world', 'flow', 'sources', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'sources'))
