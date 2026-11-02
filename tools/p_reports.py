"""Reports (التقارير), the line's reports for its owner: the same screen for every organization. The core's numbers,
counted the same way everywhere from the line's log with nothing to set up (finished items, the whole journey, how
many came back, keeping to the due time), then each block in the line's order against what it expects, its slowest
marked as the bottleneck; and on their own tab the results after delivery that the organization's pack reads. The
parts are rendered by assets/js/reports.js from world.js.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def reports():
    body = f'''<div class="rp-page ap-wrap">
<header class="rp-head">
<div class="rp-ht"><h1 data-h1 tabindex="-1">{t('Reports')}</h1><p class="rp-period" data-period></p></div>
<div class="rp-act" data-act></div>
</header>
<div data-body></div>
</div>'''
    return shell('rp', t('Reports'), frame('Reports', 'reports'), body, ('world', 'flow', 'reports', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'reports'))
