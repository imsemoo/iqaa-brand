"""The app frame of the digital production screens (the owner's 22): the organization and its menu, the screens the
person signed in may open, the tools their pack gives them, and the person at the foot.

What the sidebar lists depends on who is looking (the owner, a block's lead, or a member) and on the organization's
pack, so assets/js/frame.js writes it from the world (world.js). This file writes the frame it fills. On a phone the
first screens become a tab bar with More for the rest, as the plan's frame template says.
"""
from i18n import t
from p_auth import lang_switch
from p_ct import icon

# the frame's pages, by the English name frame.js and the dictionaries use
PAGES = {'Home': 'home', 'My work': 'work', 'My blocks': 'queue', 'Item': 'item'}


def frame(current, slug):
    fold = ('<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true"><path d="M14 7l-5 5 5 5M19 5v14"/></svg>')
    return f'''<div class="ap-side" data-frame data-current="{current}">
<div class="ap-head">
<button type="button" class="ap-org" data-menu aria-expanded="false" aria-controls="ap-org-menu">
<span class="org-mark" data-org-mark></span><span class="ap-org-t"><b data-org-name></b><span dir="ltr" data-org-address></span></span>{icon('Switch', 16)}</button>
<div class="ap-menu" id="ap-org-menu" hidden><p class="ap-menu-h">{t('Your organizations')}</p><div data-orgs></div><hr>
<a href="start.html">{icon('Create', 18)}<span>{t('Start another organization')}</span></a>
<a href="signin.html">{icon('Sign out', 18)}<span>{t('Sign out')}</span></a></div>
</div>
<nav class="ap-nav" aria-label="{t('Screens')}" data-nav></nav>
<div class="ap-foot">
<button type="button" class="ap-me ap-me-b" data-menu aria-expanded="false" aria-controls="ap-me-menu"><span class="me-av" aria-hidden="true" data-me-av></span><span class="ap-me-t"><span class="sr">{t('Signed in as')} </span><b data-me-name></b><span data-me-role></span></span></button>
<div class="ap-menu ap-me-menu" id="ap-me-menu" hidden><p class="ap-menu-h">{t('See the screens as')}</p><div data-people></div></div>
{lang_switch(slug, up=True)}
<button type="button" class="ap-fold" data-fold aria-pressed="false" aria-label="{t('Fold the sidebar')}" title="{t('Fold the sidebar')}">{fold}</button>
</div>
</div>'''
