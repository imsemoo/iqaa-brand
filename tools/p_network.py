"""The network of an organization's lines (شبكة الخطوط): how they connect, by the plan's three ways (call, launch,
aggregate). Rendered by assets/js/network.js from world.js `network`.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_frame import frame


def network():
    body = f'''<div class="nw-page ap-wrap">
<nav class="pj ln2-lines" data-lines aria-label="{t('Lines')}"></nav>
<header class="nw-head"><h1>{t('The network of lines')}</h1><p class="nw-sum" data-sum></p></header>
<div class="nw-legend" data-legend aria-hidden="true"></div>
<div class="nw-map" data-map><svg class="nw-wires" data-wires aria-hidden="true"></svg><div class="nw-rows" data-rows></div></div>
<section class="nw-links" aria-labelledby="nw-l-h"><h2 id="nw-l-h">{t('How they connect')}</h2><ul data-links></ul></section>
</div>'''
    return shell('nw', t('The network of lines'), frame('Lines', 'network'), body, ('world', 'flow', 'network', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'lines', 'network'))
