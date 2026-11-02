"""Settings: packs and integrations (الحزم والإعدادات), the owner's. The settings tabs, of which this one is built and
the others are named as coming; the packs (the organization's own, on, with what it adds, and the others); the
integrations connected, each with its account and state; the organization's identity; and this month's usage, whose
numbers are an example. The parts are rendered by assets/js/packs.js from world.js.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_ct import icon
from p_frame import frame

# the settings tabs, in the plan's order, and the page each built one is; the others are named as coming
TABS = (('organization', 'Organization', None), ('packs', 'Packs and integrations', 'packs.html'), ('security', 'Security', 'security.html'),
        ('billing', 'Billing and usage', None), ('log', 'Log', 'log.html'))


def settings_tabs(current):
    """The tabs; a built tab is a link (its page's script keeps who is looking, data-keep), the current one marked."""
    def tab(k, n, page):
        if k == current:
            return f'<li><span class="pk-tab" aria-current="page">{t(n)}</span></li>'
        if page:
            return f'<li><a class="pk-tab" href="{page}" data-keep>{t(n)}</a></li>'
        return f'<li><span class="pk-tab" aria-disabled="true" title="{t("{name}: coming next", name=t(n))}">{t(n)} <em>{t("Soon")}</em></span></li>'
    return f'<nav class="pk-tabs" aria-label="{t("Settings")}"><ul>{"".join(tab(*x) for x in TABS)}</ul></nav>'


def packs():
    tabs_nav = settings_tabs('packs')
    body = f'''<div class="pk-page ap-wrap">
<header class="pk-head"><h1>{t('Settings')}</h1></header>
{tabs_nav}
<div class="pk-live" role="status"><p class="pk-note" data-note hidden><span data-note-t></span><button type="button" class="link" data-undo>{t('Undo')}</button></p></div>
<div data-body>
<div class="pk-intro"><h2 title="{t('A pack adds blocks, screens and reports; it never changes how the core works. It is the only way to customize: no organization gets its own code.')}">{t('Packs and integrations')}</h2></div>
<div class="pk-grid">
<div class="pk-main">
<section class="pk-sec" aria-labelledby="pk-packs-h"><div class="pk-sh"><h3 id="pk-packs-h">{icon('Templates', 18)}<span>{t('Packs')}</span></h3></div><ul class="pk-packs" data-packs></ul></section>
<section class="pk-sec" aria-labelledby="pk-int-h"><div class="pk-sh"><h3 id="pk-int-h">{icon('Link', 18)}<span>{t('Connected integrations')}</span><span class="pk-n" data-int-n></span></h3><div data-int-add></div></div>
<ul class="pk-ints" data-ints title="{t('When an integration fails, the work goes on in Iqaa, and what waited for it goes out once it is back. Each organization’s keys are encrypted on their own.')}"></ul></section>
</div>
<div class="pk-side">
<section class="pk-sec" aria-labelledby="pk-id-h"><div class="pk-sh"><h3 id="pk-id-h">{icon('Mark', 18)}<span>{t('The organization’s identity')}</span></h3></div><div data-identity></div></section>
<section class="pk-sec" aria-labelledby="pk-use-h"><div class="pk-sh"><h3 id="pk-use-h">{icon('Billing', 18)}<span>{t('This month’s usage')}</span></h3></div><div data-usage></div></section>
</div>
</div>
</div>
</div>'''
    return shell('pk', t('Settings'), frame('Settings', 'packs'), body, ('world', 'flow', 'packs', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'packs'))
