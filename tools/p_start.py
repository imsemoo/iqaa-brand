"""Start (البداية), outside the app: the organization writes its name and its idea in its own words, or starts from a
template, answers what Watar asks (at most three questions, each skippable, chosen by the idea), and Watar builds the
production line. The steps it runs are the same for everyone and are shown before they run: understand the idea,
build the departments, blocks and fields, check the line, arrange the canvas as a draft. Watar never publishes; the
review screen (built.html) comes next. The questions and the steps are rendered by assets/js/start.js from world.js;
publish.js comes first for the check every line passes (window.CHECK).
"""
import brand
import i18n
from i18n import t
from p_auth import lang_switch, shell
from p_ct import icon
from shell import inline

# the templates the packs bring: (key, name, icon); start.js knows which of them this prototype builds
TEMPLATES = (('media', 'Media', 'Video'), ('software', 'Software', 'Repository'), ('agency', 'Agency', 'Clients'), ('service', 'Service organization', 'Company'))


def start():
    top = f'''<div class="a-wrap st-top"><a class="home" href="{i18n.base()}index.html" aria-label="{t('Iqaa')}">{inline(brand.lockup_svg("light"))}</a>
<div class="lang-top">{lang_switch('start', note=False)}</div></div>'''
    tpl = ''.join(f'<button type="button" class="st-tpl" data-tpl="{k}" aria-pressed="false">{icon(ic, 20)}<span class="st-tpl-t"><span>{t(n)}</span></span></button>' for k, n, ic in TEMPLATES)
    body = f'''<div class="st-page a-wrap">
<div class="st-grid">
<form class="st-form" data-form novalidate>
<header class="st-head"><h1 id="st-h">{t('Write your organization and its idea, and your production line is ready on the canvas')}</h1>
</header>
<fieldset class="st-fs" data-fs>
<legend class="sr">{t('Your organization')}</legend>
<div class="field" data-field="org"><label for="org">{t('Organization name')}</label>
<input id="org" name="org" type="text" autocomplete="organization" required aria-describedby="org-err" data-org><p class="err" id="org-err" hidden></p></div>
<div class="field" data-field="idea"><label for="idea">{t('Your idea, in your own words')}</label>
<textarea id="idea" name="idea" rows="4" required aria-describedby="idea-hint idea-err" data-idea></textarea>
<p class="hint" id="idea-hint">{t('Say what you make and who works on it. Watar reads the departments, the blocks and the fields from it.')}</p><p class="err" id="idea-err" hidden></p></div>
<div class="st-tpls" role="group" aria-labelledby="st-tpl-h"><p class="st-k" id="st-tpl-h">{t('Or start from a template')}</p><div class="st-tpl-l" data-tpls>{tpl}</div>
<p class="sr">{t('Each pack brings its templates, and you can save your own later.')}</p></div>
<section class="st-ask" aria-labelledby="st-ask-h"><h2 id="st-ask-h"><span class="st-w" aria-hidden="true" data-watar></span>{t('Watar asks before building')}</h2>
<p class="sr">{t('At most three questions, chosen from your idea. Skip any of them.')}</p>
<div data-questions></div><p class="sr" data-q-live aria-live="polite"></p></section>
</fieldset>
<div class="st-go"><button type="submit" class="btn primary wide" data-build>{t('Build the production line')}</button>
<p class="proto">{t('Prototype: Watar builds Al-Khatt Media’s line from a media idea and Masar’s from a software idea, whatever the name.')}</p></div>
</form>
<aside class="st-steps" aria-labelledby="st-steps-h"><div class="st-steps-in">
<h2 id="st-steps-h">{t('What happens when you press Build')}</h2>
<ol class="st-ol" data-steps></ol>
<p class="st-never">{icon('Lock', 18)}<span>{t('Watar never publishes. What it builds waits for you as a draft.')}</span></p>
<div class="st-ready" data-ready hidden><a class="btn primary" data-review href="built.html">{t('Review what Watar built')}</a></div>
<p class="sr" data-live role="status"></p>
</div></aside>
</div>
</div>'''
    return shell('st', t('Start your organization · Iqaa'), top, body, ('world', 'flow', 'publish', 'start'), css=('start',))
