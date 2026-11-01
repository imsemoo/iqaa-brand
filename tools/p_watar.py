"""Ask Watar: a conversation with Watar about the organization's work. Watar answers from the line and its orders,
drafts what could be done, and waits for a person to approve it.

The thread, the drafts and the rail are rendered by assets/js/watar.js from the demo world in sufra.js, through the
shared reading of jobs in jobs.js. The HTML keeps one honest line and a disabled composer if the script cannot run.
"""
from p_auth import runs_badge, shell
from p_ct import icon
from p_line import app_top
from p_today import CAST


def watar():
    reads = '<div data-reads></div>'
    body = f'''<div class="aw-page">
<header class="aw-head ap-wrap">
<div class="aw-hi">
<p class="td-day"><span>Sunday 1 November</span> · <time class="aw-t" data-now>09:41</time></p>
<h1>Ask Watar</h1>
<p class="aw-sub">Watar answers from Sufra’s line and its orders. It drafts; you decide.</p>
</div>
<button class="btn small aw-new" type="button" data-new hidden>{icon('New conversation', 18)}<span>New conversation</span></button>
</header>
<p class="ap-note aw-note ap-wrap" data-note role="status" hidden><span data-note-t></span> <button class="link" type="button" data-undo>Undo</button></p>
<div class="aw-body ap-wrap"><div class="aw-grid">
<details class="aw-reads-d" data-reads-d><summary>{icon('Line', 18)}<span>What Watar reads</span></summary>{reads}</details>
<div class="aw-col">
<ol class="aw-thread" data-thread aria-label="Conversation with Watar">
<li class="aw-x aw-open"><article aria-label="Watar"><div class="aw-turn aw-a"><span class="aw-mk"><span class="aw-w" aria-hidden="true">{icon('Ask Watar', 20)}</span></span><p class="aw-meta"><b>Watar</b></p><p class="aw-lead">Watar can’t read Sufra’s line right now. Reload the page.</p></div></article></li>
</ol>
<form class="aw-in" data-ask novalidate>
<p class="aw-strip" data-strip hidden></p>
<label class="sr" for="aw-q">Ask Watar a question</label>
<div class="aw-field"><textarea id="aw-q" rows="1" maxlength="280" aria-describedby="aw-err" aria-keyshortcuts="/" placeholder="Ask about an order, a person or the day" autocomplete="off" disabled></textarea><button class="btn ink aw-go" type="submit" disabled>{icon('Ask', 18)}<span>Ask</span></button></div>
<p class="err" id="aw-err" hidden></p>
</form>
</div>
<aside class="aw-rail" aria-label="Drafts and sources">
<section class="aw-rs" aria-labelledby="aw-w-h"><h2 id="aw-w-h">{icon('Draft', 18)}<span>Waiting for you</span> <span class="aw-n" data-n-wait>0</span></h2><div data-wait></div>
<h3 data-decided-h hidden>Decided here</h3><ul class="aw-dc" data-decided></ul></section>
<section class="aw-rs aw-reads" aria-labelledby="aw-r-h"><h2 id="aw-r-h">{icon('Line', 18)}<span>What Watar reads</span></h2>{reads}</section>
</aside>
</div></div>
<p class="sr" data-live aria-live="polite"></p>
</div>'''
    who = ' · '.join(f'<a href="watar.html?as={k}">{n}</a>' for k, n in [CAST[3]] + CAST[:3])
    foot = f'<div class="sign-off">{runs_badge()}</div><p class="aw-as">Prototype: ask as {who}.</p>'
    return shell('aw', 'Ask Watar · Sufra', app_top('Ask Watar'), body, ('sufra', 'jobs', 'watar'), foot=foot, css=('app', 'orders', 'watar'))
