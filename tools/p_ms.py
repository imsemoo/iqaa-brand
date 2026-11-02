"""Motion, and Watar with co-branding."""
import brand
import tokens as T
from p_ct import icon
from shell import LINES, esc, head, inline, kinds_of, sec, sigline

INK, V = T.BRAND['ink'], T.BRAND['violet']
M = T.MOTION


def curve(name, css):
    nums = [float(x) for x in css[css.index('(') + 1:-1].split(',')]
    x1, y1, x2, y2 = nums
    S = 160
    p = f'M0 {S} C{x1 * S:.1f} {S - y1 * S:.1f} {x2 * S:.1f} {S - y2 * S:.1f} {S} 0'
    return (f'<div class="cap"><svg viewBox="-8 -8 176 176" width="176" height="176" aria-hidden="true">'
            f'<rect x="0" y="0" width="{S}" height="{S}" fill="none" stroke="{T.NEUTRAL["200"]}"/>'
            f'<path d="{p}" fill="none" stroke="{INK}" stroke-width="2.5" stroke-linecap="round"/></svg>'
            f'<b>{name}</b><span><code>{css}</code></span></div>')


def motion():
    toks = ''.join(f'<tr><td><code>--m-{k}</code></td><td class="num">{M[k]} ms</td><td>{d}</td></tr>' for k, d in (
        ('eighth', 'Stagger between items in a sequence'),
        ('quarter', 'Small changes: a stroke is written, a check appears, a hover'),
        ('half', 'A job moves to the next station; a panel opens'),
        ('beat', 'Brand moments: the mark plays, a handoff completes'),
        ('bar', 'The longest anything may take: four beats'),
    ))
    curves = f'<div class="row" style="gap:var(--s-8)">{curve("Arrive", M["ease_arrive"])}{curve("Leave", M["ease_leave"])}{curve("Move", M["ease_move"])}</div>'
    principles = '''<ol class="rules">
<li><b>Step, hold, release.</b> Things move on the beat and then stop. Nothing drifts, floats or loops on its own.</li>
<li><b>Nothing moves without a cause.</b> A person pressed something, or a job moved. Decoration never animates.</li>
<li><b>Arrive slowing down, leave speeding up.</b> No overshoot, no elastic, no bounce. Composed, not cute.</li>
<li><b>Only what changed moves.</b> The rest of the screen holds still, so the eye finds the change.</li>
<li><b>Reduced motion</b> replaces every move with an instant change and keeps every message.</li>
</ol>'''
    sym = inline(brand.symbol_svg('light'))
    demos = f'''<div class="demos">
<div class="demo" data-demo="reveal">
<div class="spec white center stage">{sym}</div>
<div class="demo-t"><h3>1 · The mark writes itself</h3><p class="note">The pen draws the run, the loop and the finish in order, a quarter beat each: one beat in all.</p><button class="btn small" type="button" data-play>Play</button></div>
</div>
<div class="demo" data-demo="handoff">
<div class="spec white stage handoff">
<div class="st"><p class="eyebrow">Montage · Heba</p>
<ul class="items"><li data-item><span class="bx"></span>Cut the second minute</li><li data-item><span class="bx"></span>Shorten the ending</li><li data-item><span class="bx"></span>Upload version 3</li></ul>
<p class="lockline" data-lock>{icon('Lock', 16)}<span>Items locked</span></p></div>
<div class="arrow" aria-hidden="true">{icon('Handoff', 24)}</div>
<div class="st next"><p class="eyebrow">Colour grading · Laith</p><div class="job" data-job><code>MAD-26-0144</code> The last glassblowers of Hebron</div></div>
</div>
<div class="demo-t"><h3>2 · A handoff</h3><p class="note">Heba’s three items check, a quarter beat each; they lock; the piece moves to the next block in half a beat.</p><button class="btn small" type="button" data-play>Play</button></div>
</div>
<div class="demo" data-demo="approve">
<div class="spec white center stage"><span class="glyph-demo" data-approve-glyph>{brand.glyph_svg('held', 'light', 72)}</span>
<p class="note" data-approve-note>Draft from Watar. Nothing is sent until you approve.</p></div>
<div class="demo-t"><h3>3 · A Watar draft is approved</h3><p class="note">The waiting arch is rewritten as a loop in a quarter beat: a person’s hand took it.</p><button class="btn small primary" type="button" data-play>Approve</button></div>
</div>
<div class="demo" data-demo="test">
<div class="spec white stage" data-test-stage>{sigline('media', k=2.4, test=True)}</div>
<div class="demo-t"><h3>4 · A test run</h3><p class="note">The pen walks the line with a dashed grey stroke, a quarter beat per step. Nothing is signed, nothing turns violet.</p><button class="btn small" type="button" data-play>Play</button></div>
</div>
<div class="demo" data-demo="fail">
<div class="spec white center stage"><span class="glyph-demo" data-fail-glyph>{brand.glyph_svg('run', 'light', 72)}</span>
<p class="note" data-fail-note>Publish on Instagram · ran at 10:02</p></div>
<div class="demo-t"><h3>5 · A step fails, then is retried</h3><p class="note">The straight stroke snaps in the alert colour; retry draws it straight again in a quarter beat.</p><div class="row" style="gap:var(--s-3)"><button class="btn small" type="button" data-play>Fail</button><button class="btn small" type="button" data-retry>Retry</button></div></div>
</div>
</div>'''
    sound = '''<div class="prose"><p>Written, not produced, so the product can add it later on the same rule. A notification sound plays the event as beats at 100 BPM: a short low tap for a step that ran, a single long tone for something waiting for you, a plucked tone for a person’s action. Never longer than one bar; never a melody; off by default.</p></div>'''
    return (head('Motion', 'Everything moves on one tempo', f'Iqaa runs at {M["tempo_bpm"]} BPM: one beat is {M["beat"]} ms. Its quarter and half beats, {M["quarter"]} and {M["half"]} ms, are the durations interfaces already use; brand moments take whole beats.')
            + sec('Tokens', 'Durations from the tempo', f'<div class="tbl-wrap"><table><thead><tr><th>Token</th><th class="num">Duration</th><th>Use</th></tr></thead><tbody>{toks}</tbody></table></div>')
            + sec('Curves', 'Three curves, no springs', curves)
            + sec('Principles', 'How things move', principles)
            + sec('Moments', 'Five moments from the product', demos, 'Press to play. With reduced motion on, each one jumps to its end state.')
            + sec('Sound', 'A rule for later', sound)
            + '</div>')


def badge(pal='light'):
    p = 'dark' if pal == 'dark' else 'light'
    sym = inline(brand.symbol_svg(p))
    return f'<span class="runs{" dark" if pal == "dark" else ""}">{sym}<span>Runs on Iqaa</span></span>'


def phone(inner, label):
    return f'<div class="phone" role="img" aria-label="{esc(label)}"><div class="phone-in">{inner}</div></div>'


def client_screen():
    av = brand.avatar_svg([[x[0] for x in b['steps']] for b in LINES['media']['blocks']], 32, '', name='K')
    return phone(f'''<div class="cs-top">{av}<b>Al-Khatt Media</b></div>
<p class="cs-k">Review · <code>MAD-26-0142</code></p>
<h3 class="cs-h">Hi Nadia. The old market of Jerusalem is ready for your review.</h3>
<dl class="cs-dl"><dt>Version</dt><dd>2, sent Sat 31 Oct</dd><dt>Length</dt><dd>2:30</dd><dt>Platforms</dt><dd>Instagram, TikTok</dd><dt>Publishing</dt><dd>Thu 5 Nov</dd></dl>
<button class="btn primary" type="button" tabindex="-1">Approve the piece</button>
<button class="btn" type="button" tabindex="-1">Ask for changes</button>
<p class="cs-f">No account or password needed.</p>
<div class="cs-runs">{badge()}</div>''', 'The client review screen on a phone, for Al-Khatt Media’s client Nadia')


def system():
    watar = f'''<div class="g2">
<div class="spec white center" style="min-height:220px"><div class="watar-lock">{inline(brand.watar_svg('light'))}<span>Watar</span></div></div>
<div class="prose"><p>Watar (وتر) is the string of an oud: a line that sounds only when a hand strikes it. Its mark is the waiting arch — a string drawn up and waiting — because everything Watar makes, a drafted line, an outline drafted from a message, a suggested automation, waits for a person to approve it. Approval is the hand: the arch becomes a loop, a person’s work.</p>
<p>Watar has no face, no sparkle, no glow and no colour of its own. It is endorsed by Iqaa and never appears as a separate product.</p></div>
</div>
<div class="spec white draft">
<div class="draft-h">{inline(brand.watar_svg('light'))}<b>Draft from Watar</b><span class="note">10:02</span></div>
<p>I drafted an outline for <code>MAD-26-0159</code> from the message in the ideas channel: three scenes, about two minutes. I did not choose the footage.</p>
<div class="row" style="gap:var(--s-3)"><button class="btn primary small" type="button" tabindex="-1">Approve</button><button class="btn small" type="button" tabindex="-1">Edit</button></div>
<p class="note">Nothing is sent until you approve.</p>
</div>'''
    arch = f'''<div class="arch">
<div class="arch-top"><div style="width:220px">{inline(brand.lockup_svg('light'))}</div><span class="note">The platform. One brand for every field.</span></div>
<div class="g3">
<div class="spec white"><p class="eyebrow">Assistant</p><div class="watar-lock sm">{inline(brand.watar_svg('light'))}<span>Watar</span></div><p class="note">Endorsed: “Watar, in Iqaa” where it needs introducing.</p></div>
<div class="spec white"><p class="eyebrow">Packs</p><div class="pack">{inline(brand.lockup_svg('light'))}<span>Media and production</span></div><div class="pack">{inline(brand.lockup_svg('light'))}<span>Software</span></div><p class="note">A descriptor after one beat, in Atkinson Regular. Never a new mark.</p></div>
<div class="spec white"><p class="eyebrow">Templates</p><p>Media and production · Software · Agency</p><p class="note">Plain names; each shows its signature, never a logo.</p></div>
</div></div>'''
    cob = f'''<div class="g2">
<div class="prose"><h3>The organization comes first</h3><p>On an organization’s subdomain, in the link its clients open and in the messages they receive, the organization’s name leads. Iqaa signs off once, at the foot, with “Runs on Iqaa”.</p>
<p>An organization with its own logo shows it. One without gets its signature as an avatar, written from its own line.</p>
<div class="row mid" style="gap:var(--s-6)"><div class="cap"><div class="org-logo"><span class="ol-word">al-khatt</span><span class="ol-tag">their logo</span></div><span>With its own logo</span></div><div class="cap">{brand.avatar_svg([[x[0] for x in b['steps']] for b in LINES['media']['blocks']], 32, 'Al-Khatt Media avatar', name='K')}<span>Without: its signature</span></div></div>
<h3>Runs on Iqaa</h3><div class="row mid" style="gap:var(--s-6)"><div class="spec white tight">{badge()}</div><div class="spec ink tight">{badge('dark')}</div></div>
<p class="note">Symbol 12 px, text 13 px Atkinson Regular in n700 (on ink: n300), one quarter beat between. Minimum: the symbol at 12 px. Clear space: one beat. It is a link to iqaa.app.</p></div>
{client_screen()}
</div>'''
    msg = f'''<div class="g2">
<div class="chat">
<p class="chat-from"><span class="org-dot">{brand.avatar_svg([[x[0] for x in b['steps']] for b in LINES['media']['blocks']], 32, '', name='K')}</span><b>Al-Khatt Media</b><span class="note">Business account</span></p>
<div class="bubble"><p>Hi Nadia, version 2 of The old market of Jerusalem is ready for your review. Approve it or ask for changes: <span class="link">alkhatt.iqaa.co/r/…</span></p><span class="time">10:14</span></div>
<p class="note">The message comes from the organization. Its avatar is its own logo or its signature; Iqaa is not in the conversation.</p>
</div>
<div class="mail">
<div class="mail-h">{brand.avatar_svg([[x[0] for x in b['steps']] for b in LINES['media']['blocks']], 32, '', name='K')}<b>Al-Khatt Media</b></div>
<div class="mail-b"><p class="mail-s">The old market of Jerusalem is ready for your review</p><p>Hi Nadia,</p><p>Version 2 is ready. Approve it or ask for changes from this link; you don’t need an account.</p><p><span class="btn primary small">Open the piece</span></p><p class="note">Piece <code>MAD-26-0142</code> · version 2 · the link works until Sat 7 Nov</p></div>
<div class="mail-f">{badge()}<span class="note">You receive this because Al-Khatt Media is making this piece for you.</span></div>
</div></div>'''
    # the product handshake: the line strip, Heba's card on My work
    blocks = LINES['media']['blocks']
    strip = ''
    for i, b in enumerate(blocks):
        kinds = [s[0] for s in b['steps']]
        here = ' here' if i == 3 else ''
        strip += f'<li class="ls{here}"><span class="ls-n">{i + 1}</span><b>{esc(b["name"])}</b>{brand.line_svg([kinds], k=1.6)}{"<span class=ls-job><code>3 pieces</code></span>" if i == 3 else ""}</li>'
    today = f'''<div class="today" id="today">
<div class="today-h"><span class="note">Sun 1 Nov</span><h3>Good morning, Heba</h3><p class="note">3 pieces are waiting for you. Start with the first.</p></div>
<div class="tcard">
<div class="tc-top"><code>MAD-26-0144</code><span class="note">Hikaya</span><span class="due">Today, 08:00</span></div>
<p class="tc-h">The last glassblowers of Hebron</p>
<div class="tc-pos">{brand.line_svg([[s[0] for s in b['steps']] for b in blocks], k=1.2)}<span class="note">Montage · 4 of 7</span></div>
<p><b>For you:</b> cut the second minute and upload version 3.</p>
<button class="btn primary small" type="button" tabindex="-1">Upload a new version</button>
</div></div>'''
    hand = f'''<div class="spec white"><p class="eyebrow">The line · Al-Khatt Media · Media and production</p><ol class="lstrip">{strip}</ol></div>
<div class="g2">{today}<div class="prose"><p>In the product the grammar becomes the status language: the same strokes say what each step is and where each job stands. Violet appears only for people — the loops and arches, and the one button Heba presses. The card says what to do now in one line, as the earlier product sketches did.</p><p class="note">These are proofs that the identity works in the product. The finished screen: <a href="work.html">My work</a>.</p></div></div>'''
    return (head('Watar and co-branding', 'The assistant, the packs, and whose name leads', 'Iqaa is infrastructure for other organizations’ work. Its assistant drafts and waits; its packs are descriptors; and on everything an organization’s clients see, the organization comes first.')
            + sec('Watar', 'The waiting arch', watar)
            + sec('Architecture', 'One brand, an assistant, packs', arch)
            + sec('Co-branding', 'Tenant first, Iqaa signs off', cob)
            + sec('Messages', 'WhatsApp and email', msg)
            + sec('Product', 'The identity inside the product', hand)
            + '</div>')
