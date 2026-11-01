"""Settings: how an organization is set up. Its team and who holds which stations, the ways its line reaches clients,
its name and mark, and what it pays Iqaa. One area at a time, each at its own address; every change applies on its
own and can be taken back for 8 s, as on the Line.

The areas are rendered by assets/js/settings.js from the demo world in sufra.js. Without the script the page keeps
its head, the four areas' names and what each one is for.
"""
import re

from i18n import t
from p_auth import runs_badge, shell
from p_ct import icon
from p_line import app_top

# each area: its address, name, icon and what it is for ({org} is the organization's name, which a rename rewrites)
AREAS = [
    ('team', 'Team', 'People', 'Who signs in at sufra.iqaa.app, what they do on the line and what they can change. Clients never need an account: they answer from a link.'),
    ('channels', 'Channels', 'Send', 'How {org}’s line reaches its clients. Every message goes out in {org}’s name.'),
    ('organization', 'Organization', 'Company', '{org}’s name, address and mark, as its team and clients see them.'),
    ('billing', 'Billing', 'Billing', 'What {org} pays for Iqaa. The invoices {org} sends its own clients are made on the line, at Invoice.'),
]
CHEVRON = ('<svg class="se-chev" viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5" '
           'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 1.5L7 5 3.5 8.5"/></svg>')


def settings():
    org = f'<bdi data-org-name>{t("Sufra")}</bdi>'
    areas = [(k, t(n), ic, t(d, org=org)) for k, n, ic, d in AREAS]
    nav = ''.join(f'<li><a class="se-a" href="#{k}" data-go="{k}">{icon(ic, 18)}<span class="se-at"><b>{n}</b><span class="se-sum" data-sum="{k}"></span></span>{CHEVRON}</a></li>'
                  for k, n, ic, _ in areas)
    sections = ''.join(f'''<section class="se-area" id="se-{k}" aria-labelledby="se-{k}-h" data-sec="{k}">
<div class="se-ahd"><div class="se-aht"><h2 id="se-{k}-h" tabindex="-1">{icon(ic, 20)}<span>{n}</span></h2><p class="se-desc">{d}</p></div><div class="se-hact" data-hact></div></div>
<div class="se-in" data-in></div>
</section>''' for k, n, ic, d in areas)
    # the badge the email preview ends with, as a picture: the live one is a link to iqaa.app
    runs = re.sub(r'<a class="runs-on" href="[^"]*">', '<span class="runs-on">', runs_badge()).replace('</a>', '</span>')
    body = f'''<div class="se-page" data-view="area">
<header class="se-head ap-wrap">
<a class="se-back" href="settings.html" data-back>{t('Settings')}</a>
<h1 id="se-h" tabindex="-1">{t('Settings')}</h1>
<p class="se-lead" data-lead>{t('How {org} is set up. Each change applies on its own, and you can take it back.', org=org)}</p>
</header>
<div class="se-body ap-wrap"><div class="se-grid">
<nav class="se-nav" aria-label="{t('Settings areas')}"><ul class="se-nl">{nav}</ul></nav>
<div class="se-areas">
{sections}
</div>
</div></div>
<p class="sr" data-live aria-live="polite"></p>
<template data-runs>{runs}</template>
</div>'''
    see = t('Prototype: see Settings as {hala} · {reem}. Changes last until you leave the page.',
            hala=f'<a href="settings.html" data-as="hala">{t("Hala, an owner")}</a>',
            reem=f'<a href="settings.html?as=reem" data-as="reem">{t("Reem, a member")}</a>')
    foot = (f'<div class="sign-off">{runs_badge()}</div>'
            f'<p class="se-as">{see} '
            f'<button class="link" type="button" data-accept hidden>{t("Let Nour accept her invitation")}</button></p>')
    return shell('se', f"{t('Settings')} · {t('Sufra')}", app_top('Settings'), body, ('sufra', 'jobs', 'settings'), foot=foot, css=('app', 'settings'))
