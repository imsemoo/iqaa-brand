"""The saved archive (الأرشيف المحفوظ), the media pack's: what was published, with its reach, and its page on the site,
which can be restored when it is gone. Rendered by assets/js/archive.js from world.js `archive`.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def archive():
    body = f'''<div class="ar-page ap-wrap">
<header class="ar-head"><div><h1>{t('Saved archive')}</h1><p class="ar-sum" data-sum></p></div>
<div class="field ar-q"><label for="ar-q" class="sr">{t('Search')}</label><input id="ar-q" type="search" placeholder="{t('Search')}" autocomplete="off" data-q></div></header>
<div class="ar-live" role="status"><p class="ar-note" data-note hidden><span data-note-t></span></p></div>
<ul class="ar-grid" data-grid></ul>
</div>'''
    return shell('ar', t('Saved archive'), frame('Saved archive', 'archive'), body, ('world', 'flow', 'archive', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'archive'))
