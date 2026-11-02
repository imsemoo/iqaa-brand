"""Home (الرئيسية), the organization's home for its owner: the same screen for every organization, in a fixed order.
The core's numbers and then the pack's, where work stands on the line block by block, what waits for the owner's
decision, what Watar suggests from the line's own log, and the pack's own card when its pack has one (the agency's
most active clients). The parts are rendered by assets/js/home.js from world.js.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_ct import icon
from p_frame import frame


def home():
    body = f'''<div class="hm-page ap-wrap">
<header class="hm-head">
<div class="hm-ht"><p class="hm-day" data-day></p><h1 data-hi>{t('Home')}</h1><p class="hm-sum">{t('Here is what needs you today.')}</p></div>
<div class="hm-new" data-new></div>
</header>
<ul class="hm-kpi" data-nums></ul>
<div class="hm-cols">
<section class="hm-pn hm-dc" aria-labelledby="hm-dc-h"><div class="hm-ph"><h2 id="hm-dc-h">{icon('Notifications', 18)}{t('Waiting for your decision')} <span data-dc-n></span></h2></div><div data-dc></div></section>
<section class="hm-pn hm-ln" aria-labelledby="hm-ln-h"><div class="hm-ph"><h2 id="hm-ln-h">{icon('Line', 18)}{t('Where work stands on the line')}</h2><p data-ln-hint></p>
<p class="hm-lg" aria-hidden="true"><span><i class="hm-lg-b"></i>{t('Time here so far, on average')}</span><span><i class="hm-lg-t"></i>{t('What the block expects')}</span></p></div>
<ol class="hm-bl" data-ln></ol></section>
<section class="hm-wr" aria-labelledby="hm-wr-h"><h2 id="hm-wr-h">{icon('Ask Watar', 18)}{t('Watar suggests')}</h2><div data-wr></div></section>
<section class="hm-pn hm-pk" aria-labelledby="hm-pk-h" data-pk hidden></section>
</div>
</div>'''
    return shell('hm', t('Home'), frame('Home', 'home'), body, ('world', 'flow', 'home', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'home'))
