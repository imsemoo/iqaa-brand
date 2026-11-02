"""The canvas (اللوحة), the owner's most important screen: an organization's line as the draft of its next version, drawn
in the Line screen's metro language; the block types the core and the pack give; and the selected block's inspector:
its people and roles (applied at once), what each role sees and may do, and its settings (a draft change each).
"View as" fades what a role or a person cannot see. Everything inside is rendered by assets/js/lines.js from world.js;
this file writes the frame around it.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_ct import icon
from p_frame import frame


def lines():
    chevron = ('<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" '
               'stroke-linejoin="round" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg>')
    body = f'''<div class="ln2-page">
<header class="ln2-head ap-wrap">
<nav class="pj ln2-lines" data-lines aria-label="{t('Lines')}"></nav>
<div class="ln2-top">
<div class="ln2-ht"><h1 data-name></h1><p class="ln2-state" data-state aria-live="polite"></p></div>
<div class="ln2-act">
<div class="ln2-as"><button type="button" class="btn" data-menu data-as-btn aria-expanded="false" aria-controls="ln2-as-menu">{icon('Preview', 18)}<span data-as-label>{t('View as')}</span>{chevron}</button>
<div class="ln2-menu ln2-as-m" id="ln2-as-menu" data-as-menu hidden></div></div>
<span class="ln2-edit" data-talk></span>
<span class="ln2-edit" data-publish></span>
</div>
</div>
</header>
<p class="ln2-bar ap-wrap" data-viewing role="status" hidden></p>
<p class="ln2-bar ap-wrap" data-note role="status" hidden><span data-note-t></span> <button type="button" class="link" data-undo>{t('Undo')}</button></p>
<p class="ln2-only ap-wrap">{icon('Preview', 18)}<span>{t('On a phone the canvas is for viewing: the line, and each block’s people and roles. Edit it on a wider screen.')}</span></p>
<section class="ln2-canvas" aria-labelledby="ln2-map-h">
<h2 class="sr" id="ln2-map-h">{t('Map of the line')}</h2>
<div class="ln2-map" data-map><div class="ln2-in" data-in>
<svg class="ln2-tracks" data-tracks aria-hidden="true"></svg>
<ol class="ln2-st" data-stations aria-label="{t('Blocks, in the order work walks them')}"></ol>
</div></div>
<div class="ap-wrap"><ul class="ln2-lg" data-legend aria-label="{t('How to read the map')}"></ul></div>
</section>
<section class="ln2-pal ap-wrap ln2-edit" data-palette aria-labelledby="ln2-pal-h"></section>
<section class="ln2-insp ap-wrap" id="ln2-insp" data-insp aria-labelledby="ln2-insp-h"></section>
</div>'''
    return shell('ln2', t('Lines'), frame('Lines', 'lines'), body, ('world', 'flow', 'lines', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'lines'))
