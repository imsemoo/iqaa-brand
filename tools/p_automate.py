"""Turning a step into automation (الأتمتة): a line drawn in the canvas's metro language, every block with how it runs
(the plan's five modes, written in the block's own strokes: a person's loop or arch, the machine's straight run), and
the selected block's inspector: who does it, its tools, its limits, its numbers so far, who takes the work when the
machine fails, and its record, where every automated step is made by Automation, never a person. The head stops a
block or the whole line at once, without publishing a version, and publishes the draft once its rules hold. A line
with nothing automated says so. Everything inside is rendered by assets/js/automate.js from world.js.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def automate():
    body = f'''<div class="au-page">
<header class="au-head ap-wrap">
<nav class="pj au-lines" data-lines aria-label="{t('Lines')}"></nav>
<div class="au-top">
<div class="au-ht"><h1 data-name></h1><p class="au-state" data-state aria-live="polite"></p></div>
<div class="au-act" data-act hidden></div>
</div>

</header>
<div class="au-bars ap-wrap">
<div class="au-bar au-alert" data-problems role="alert" hidden></div>
<p class="au-bar au-stopped" data-stopped role="status" hidden></p>
<p class="au-bar" data-note role="status" hidden><span data-note-t></span> <button type="button" class="link" data-undo>{t('Undo')}</button></p>
</div>
<section class="au-canvas" data-canvas aria-labelledby="au-map-h" hidden>
<h2 class="sr" id="au-map-h">{t('Map of the line')}</h2>
<div class="au-map" data-map><div class="au-in" data-in>
<svg class="au-tracks" data-tracks aria-hidden="true"></svg>
<ol class="au-st" data-stations aria-label="{t('Blocks, in the order work walks them')}"></ol>
</div></div>
<div class="ap-wrap"><ul class="au-lg" data-legend aria-label="{t('How to read the map')}"></ul></div>
</section>
<section class="au-insp ap-wrap" id="au-insp" data-insp aria-labelledby="au-insp-h" hidden></section>
<section class="au-none ap-wrap" data-none aria-labelledby="au-none-h" hidden></section>
</div>'''
    return shell('au', t('Automation'), frame('Automation', 'automate'), body, ('world', 'flow', 'automate', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'automate'))
