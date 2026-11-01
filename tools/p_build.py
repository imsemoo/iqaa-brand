"""Build: the line on a free canvas. Stations are blocks you place anywhere, steps are dragged in from a library,
connections are drawn as metro track that routes itself, and the line is checked as you build it.

The canvas, the inspector and the checks are rendered by assets/js/build.js; this file writes the frame and the
block library, whose icons come from the identity's icon set.
"""
from p_auth import runs_badge, shell
import brand
import i18n
from i18n import t
from p_line import app_top, view_switch
from shell import esc

# the library: every block the build plan names, grouped by who does the work
LIBRARY = [
    ('By hand', 'struck', [
        ('task', 'Task', 'Someone does a piece of work, with a checklist'),
    ]),
    ('Waits for a person', 'held', [
        ('approval', 'Approval', 'A person, or the client, approves'),
        ('watar', 'Watar draft', 'Watar drafts it; a person approves'),
    ]),
    ('Runs by itself', 'run', [
        ('send', 'Send', 'A message by email, WhatsApp or SMS'),
        ('remind', 'Remind', 'Nudge someone who has not answered'),
        ('create', 'Create', 'An invoice, a shopping list, a task'),
        ('move', 'Move job', 'Send the job to another station'),
        ('condition', 'Condition', 'Split the line on a rule'),
        ('webhook', 'Webhook', 'Start when another system calls in'),
        ('http', 'HTTP request', 'Call another system'),
    ]),
    ('Pause', 'rest', [
        ('wait', 'Wait', 'A timed pause'),
    ]),
]


def library():
    """Grouped by the stroke a block makes, and shown by it: the library reads like the grammar."""
    out = ('<p class="lib-new"><button type="button" class="lib-it st" data-lib="station"><span class="lib-ic">'
           '<svg viewBox="0 0 40 20" width="40" height="20" aria-hidden="true"><path d="M2 10h36" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'
           f'<circle cx="20" cy="10" r="6.5" fill="#19172E" stroke="#fff" stroke-width="3.5"/></svg></span><span><b>{t("Station")}</b><span>{t("Where work changes hands")}</span></span></button></p>')
    for group, kind, items in LIBRARY:
        rows = ''.join(f'<li><button type="button" class="lib-it" data-lib="{key}"><span class="lib-ic">{brand.glyph_svg(kind, "light", 22)}</span>'
                       f'<span><b>{esc(t(n))}</b><span>{esc(t(d))}</span></span></button></li>' for key, n, d in items)
        out += f'<h3><span class="lib-g">{brand.glyph_svg(kind, "light", 14)}</span>{t(group)}</h3><ul>{rows}</ul>'
    return out


def build():
    # the test's button: English keeps its one word; Arabic and Turkish name what starts, because their word for a
    # station's Start tag is not the word a button uses
    start = 'Start' if i18n.CUR == 'en' else t('Start the test')
    tool = lambda d, label, k='': (f'<button type="button" class="bd-t" data-do="{d}" aria-label="{t(label)}" title="{t(label)}{f" ({k})" if k else ""}">'
                                  f'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS_T[d]}</svg></button>')
    # The canvas is a drawing surface: it stays left to right in every language, so its pan, zoom and drag maths hold
    # (as in a design tool used in Arabic). What sits on it to be read (checks, Watar, the draft, the test, the tip)
    # takes the page's own direction back.
    rtl = ' dir="rtl"' if i18n.direction() == 'rtl' else ''
    org = f'<span data-org-name>{t("Sufra")}</span>'
    body = f'''<div class="bd-page">
<header class="bd-head">
<div class="bd-title"><h1>{t('{org}’s line', org=org)}</h1>{view_switch('Build')}<p class="bd-state" data-state aria-live="polite"></p></div>
<div class="bd-tools" role="toolbar" aria-label="{t('Canvas')}">
{tool('undo', 'Undo', 'Ctrl+Z')}{tool('redo', 'Redo', 'Ctrl+Shift+Z')}<span class="bd-sep"></span>
{tool('out', 'Zoom out', '−')}<button type="button" class="bd-z" data-do="reset" title="{t('Back to 100%')}" data-zoom>100%</button>{tool('in', 'Zoom in', '+')}{tool('fit', 'Fit the line', 'F')}
{tool('tidy', 'Tidy the line into a map', 'T')}
<span class="bd-sep"></span><button type="button" class="bd-checks-btn" data-do="checks" aria-expanded="false" aria-controls="checks"><span data-checks-n></span></button>
<button type="button" class="btn small bd-watar" data-do="watar" aria-expanded="false" aria-controls="watar"><span class="b-arch" aria-hidden="true"></span>{t('Ask Watar')}</button>
<button type="button" class="btn small ink" data-do="test">{t('Run a test job')}</button>
</div>
</header>
<div class="bd-body">
<aside class="bd-lib" id="bd-lib" aria-labelledby="lib-h"><div class="pn-h"><h2 id="lib-h">{t('Blocks')}</h2><button type="button" class="pn-x" data-fold-p="lib" aria-label="{t('Hide the blocks ([)')}" title="{t('Hide the blocks ([)')}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 7l-5 5 5 5M19 5v14"/></svg></button></div><div class="pn-b"><p class="hint">{t('Drag a block onto a station, or onto the canvas for a new station.')}</p>{library()}</div></aside>
<button type="button" class="pn-tab l" data-open-p="lib" aria-controls="bd-lib" aria-label="{t('Show the blocks ([)')}" title="{t('Show the blocks ([)')}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 7l5 5-5 5M5 5v14"/></svg><span>{t('Blocks')}</span></button>
<div class="bd-canvas" data-canvas dir="ltr" tabindex="0" role="application" aria-label="{t('The line’s canvas. Drag to move around; Ctrl and the wheel to zoom.')}">
<div class="bd-world" data-world><svg class="bd-edges" data-edges aria-hidden="true"></svg><div data-blocks></div></div>
<div class="bd-checks" id="checks" data-checks{rtl} hidden></div>
<form class="bd-watar-p" id="watar" data-watar{rtl} hidden novalidate>
<p class="wt-k"><span class="b-arch" aria-hidden="true"></span><b>{t('Ask Watar for a change')}</b></p>
<label class="sr" for="wt-q">{t('Describe the change')}</label><textarea id="wt-q" rows="3" data-wt-q placeholder="{t('For example: if the client does not answer in two days, remind them.')}"></textarea>
<p class="wt-ex" data-wt-ex></p>
<p class="wt-out" data-wt-out role="status"></p>
<div class="wt-act"><button type="button" class="btn small" data-do="watar-close">{t('Close')}</button><button type="submit" class="btn small ink">{t('Draft it')}</button></div>
</form>
<div class="bd-draft" data-draft{rtl} hidden><span class="b-arch" aria-hidden="true"></span><p data-draft-t></p><button type="button" class="btn small" data-do="draft-no">{t('Discard')}</button><button type="button" class="btn small primary" data-do="draft-yes">{t('Accept')}</button></div>
<div class="bd-mini" data-mini aria-label="{t('Minimap: press to move the view')}"><svg data-mini-svg></svg></div>
<div class="bd-test" data-testbar{rtl} hidden><form class="tb-set" data-test-set novalidate><b>{t('Test job')}</b><label>{t('People')} <input class="sn num" type="number" min="1" max="999" value="40" data-t-people></label><label class="chk"><input type="checkbox" checked data-t-back><span>{t('Take each way back once')}</span></label><button type="submit" class="btn small ink">{start}</button><button type="button" class="btn small" data-do="test-close">{t('Close')}</button></form><p class="tb-now" data-t-now aria-live="polite"></p></div>
<p class="bd-tip" data-tip{rtl}>{t('Drag from a station’s ring to another station to hand the job on. Yes and Change asked are dragged the same way.')}</p>
</div>
<button type="button" class="pn-tab r" data-open-p="insp" aria-controls="bd-insp" aria-label="{t('Show the settings (])')}" title="{t('Show the settings (])')}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 7l-5 5 5 5M19 5v14"/></svg><span>{t('Settings')}</span></button>
<aside class="bd-insp" id="bd-insp" aria-labelledby="in-h"><div class="pn-h"><h2 id="in-h">{t('Settings')}</h2><button type="button" class="pn-x" data-fold-p="insp" aria-label="{t('Hide the settings (])')}" title="{t('Hide the settings (])')}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 7l5 5-5 5M5 5v14"/></svg></button></div><div class="pn-b" data-insp></div></aside>
</div>
<p class="bd-live sr" data-live aria-live="polite"></p>
</div>'''
    return shell('bd', t('Build · {line}', line=t('{org}’s line', org=t('Sufra'))), app_top('Line'), body, ('sufra', 'build'), css=('app', 'build'))


ICONS_T = {
    'undo': '<path d="M9 6.5L5 10.5l4 4M5 10.5h9.5a4.5 4.5 0 0 1 0 9H12"/>',
    'redo': '<path d="M15 6.5l4 4-4 4M19 10.5H9.5a4.5 4.5 0 0 0 0 9H12"/>',
    'out': '<path d="M6 12h12"/>',
    'in': '<path d="M12 6v12M6 12h12"/>',
    'fit': '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
    'tidy': '<path d="M3 7h7l4 4h7M3 17h18"/><circle cx="6" cy="7" r="1.5"/><circle cx="18" cy="17" r="1.5"/>',
}
