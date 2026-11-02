"""Publishing a new version of a line (نشر نسخة جديدة): what changed since the version that runs now, in the
organization's words; how many live items are on the line and whether they finish on their version (the safe default)
or move to the new one; where the items in a block the draft removes go; and the check, the same for everyone.
Publishing stays shut until the check is clean and every item has a place. The parts are rendered by
assets/js/publish.js from world.js and the visit's draft (flow.js).
"""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def publish():
    body = f'''<div class="pb-page ap-wrap">
<header class="pb-head">
<p class="pb-eyebrow" data-line></p><h1 data-h tabindex="-1">{t('Publish a new version')}</h1><p class="pb-sum" data-sum aria-live="polite"></p>
</header>
<div class="pb-body" data-body></div>
</div>'''
    return shell('pb', t('Publish a new version'), frame('Lines', 'publish'), body, ('world', 'flow', 'publish', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'publish'))
