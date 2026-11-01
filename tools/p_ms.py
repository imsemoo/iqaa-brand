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
<div class="st"><p class="eyebrow">Quote · Reem</p>
<ul class="items"><li data-item><span class="bx"></span>Check the dishes</li><li data-item><span class="bx"></span>Price for 40 people</li><li data-item><span class="bx"></span>Attach the quote</li></ul>
<p class="lockline" data-lock>{icon('Lock', 16)}<span>Items locked</span></p></div>
<div class="arrow" aria-hidden="true">{icon('Handoff', 24)}</div>
<div class="st next"><p class="eyebrow">Client approval · Maha</p><div class="job" data-job><code>SFR-26-0031</code> Lunch for Nakhla</div></div>
</div>
<div class="demo-t"><h3>2 · A handoff</h3><p class="note">Reem’s three items check, a quarter beat each; they lock; the job moves to the next station in half a beat.</p><button class="btn small" type="button" data-play>Play</button></div>
</div>
<div class="demo" data-demo="approve">
<div class="spec white center stage"><span class="glyph-demo" data-approve-glyph>{brand.glyph_svg('held', 'light', 72)}</span>
<p class="note" data-approve-note>Draft from Watar. Nothing is sent until you approve.</p></div>
<div class="demo-t"><h3>3 · A Watar draft is approved</h3><p class="note">The waiting arch is rewritten as a loop in a quarter beat: a person’s hand took it.</p><button class="btn small primary" type="button" data-play>Approve</button></div>
</div>
<div class="demo" data-demo="test">
<div class="spec white stage" data-test-stage>{sigline('catering', k=2.4, test=True)}</div>
<div class="demo-t"><h3>4 · A test run</h3><p class="note">The pen walks the line with a dashed grey stroke, a quarter beat per step. Nothing is signed, nothing turns violet.</p><button class="btn small" type="button" data-play>Play</button></div>
</div>
<div class="demo" data-demo="fail">
<div class="spec white center stage"><span class="glyph-demo" data-fail-glyph>{brand.glyph_svg('run', 'light', 72)}</span>
<p class="note" data-fail-note>Send the quote link · ran at 10:02</p></div>
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
    av = brand.avatar_svg([[x[0] for x in b['steps']] for b in LINES['catering']['blocks']], 32, '', name='Sufra')
    return phone(f'''<div class="cs-top">{av}<b>Sufra</b></div>
<p class="cs-k">Quote · <code>SFR-26-0031</code></p>
<h3 class="cs-h">Hi Maha. Your quote for Lunch for Nakhla is ready.</h3>
<dl class="cs-dl"><dt>When</dt><dd>Thu 5 Nov, 13:00</dd><dt>Guests</dt><dd>40</dd><dt>Dishes</dt><dd>Chicken mandi, fattoush, lemon-mint juice</dd><dt>Note</dt><dd>Two guests, no nuts</dd><dt>Total</dt><dd>[TOTAL]</dd></dl>
<button class="btn primary" type="button" tabindex="-1">Approve the quote</button>
<button class="btn" type="button" tabindex="-1">Ask for a change</button>
<p class="cs-f">No account or password needed.</p>
<div class="cs-runs">{badge()}</div>''', 'The client approval screen on a phone, for Sufra’s client Maha')


def system():
    watar = f'''<div class="g2">
<div class="spec white center" style="min-height:220px"><div class="watar-lock">{inline(brand.watar_svg('light'))}<span>Watar</span></div></div>
<div class="prose"><p>Watar (وتر) is the string of an oud: a line that sounds only when a hand strikes it. Its mark is the waiting arch — a string drawn up and waiting — because everything Watar makes, a drafted line, a job filled from a WhatsApp message, a suggested automation, waits for a person to approve it. Approval is the hand: the arch becomes a loop, a person’s work.</p>
<p>Watar has no face, no sparkle, no glow and no colour of its own. It is endorsed by Iqaa and never appears as a separate product.</p></div>
</div>
<div class="spec white draft">
<div class="draft-h">{inline(brand.watar_svg('light'))}<b>Draft from Watar</b><span class="note">10:02</span></div>
<p>I filled job <code>SFR-26-0031</code> from Maha’s WhatsApp message: lunch for 40 on Thu 5 Nov at 13:00, two guests with no nuts. I did not set a price.</p>
<div class="row" style="gap:var(--s-3)"><button class="btn primary small" type="button" tabindex="-1">Approve</button><button class="btn small" type="button" tabindex="-1">Edit</button></div>
<p class="note">Nothing is sent until you approve.</p>
</div>'''
    arch = f'''<div class="arch">
<div class="arch-top"><div style="width:220px">{inline(brand.lockup_svg('light'))}</div><span class="note">The platform. One brand for every field.</span></div>
<div class="g3">
<div class="spec white"><p class="eyebrow">Assistant</p><div class="watar-lock sm">{inline(brand.watar_svg('light'))}<span>Watar</span></div><p class="note">Endorsed: “Watar, in Iqaa” where it needs introducing.</p></div>
<div class="spec white"><p class="eyebrow">Packs</p><div class="pack">{inline(brand.lockup_svg('light'))}<span>Media</span></div><div class="pack">{inline(brand.lockup_svg('light'))}<span>Invoicing</span></div><p class="note">A descriptor after one beat, in Atkinson Regular. Never a new mark.</p></div>
<div class="spec white"><p class="eyebrow">Templates</p><p>Catering · Software company · Video production</p><p class="note">Plain names; each shows its signature, never a logo.</p></div>
</div></div>'''
    cob = f'''<div class="g2">
<div class="prose"><h3>The organization comes first</h3><p>On an organization’s subdomain, in the link its clients open and in the messages they receive, the organization’s name leads. Iqaa signs off once, at the foot, with “Runs on Iqaa”.</p>
<p>An organization with its own logo shows it. One without gets its signature as an avatar, written from its own line.</p>
<div class="row mid" style="gap:var(--s-6)"><div class="cap"><div class="org-logo"><span class="ol-word">sufra</span><span class="ol-tag">their logo</span></div><span>With its own logo</span></div><div class="cap">{brand.avatar_svg([[x[0] for x in b['steps']] for b in LINES['catering']['blocks']], 32, 'Sufra avatar', name='Sufra')}<span>Without: its signature</span></div></div>
<h3>Runs on Iqaa</h3><div class="row mid" style="gap:var(--s-6)"><div class="spec white tight">{badge()}</div><div class="spec ink tight">{badge('dark')}</div></div>
<p class="note">Symbol 12 px, text 13 px Atkinson Regular in n700 (on ink: n300), one quarter beat between. Minimum: the symbol at 12 px. Clear space: one beat. It is a link to iqaa.app.</p></div>
{client_screen()}
</div>'''
    msg = f'''<div class="g2">
<div class="chat">
<p class="chat-from"><span class="org-dot">{brand.avatar_svg([[x[0] for x in b['steps']] for b in LINES['catering']['blocks']], 32, '', name='Sufra')}</span><b>Sufra</b><span class="note">Business account</span></p>
<div class="bubble"><p>Hi Maha, Sufra’s quote for Lunch for Nakhla is ready. Approve it or ask for a change: <span class="link">sufra.iqaa.app/r/…</span></p><span class="time">10:14</span></div>
<p class="note">The message comes from the organization. Its avatar is its own logo or its signature; Iqaa is not in the conversation.</p>
</div>
<div class="mail">
<div class="mail-h">{brand.avatar_svg([[x[0] for x in b['steps']] for b in LINES['catering']['blocks']], 32, '', name='Sufra')}<b>Sufra</b></div>
<div class="mail-b"><p class="mail-s">Your quote for Lunch for Nakhla</p><p>Hi Maha,</p><p>Your quote is ready. Approve it or ask for a change from this link; you don’t need an account.</p><p><span class="btn primary small">Open the quote</span></p><p class="note">Job <code>SFR-26-0031</code> · Thu 5 Nov, 13:00 · 40 guests</p></div>
<div class="mail-f">{badge()}<span class="note">You receive this because Sufra is preparing your order.</span></div>
</div></div>'''
    # the product handshake: the line strip, Reem's card on Today
    blocks = LINES['catering']['blocks']
    strip = ''
    for i, b in enumerate(blocks):
        kinds = [s[0] for s in b['steps']]
        here = ' here' if i == 1 else ''
        strip += f'<li class="ls{here}"><span class="ls-n">{i + 1}</span><b>{esc(b["name"])}</b>{brand.line_svg([kinds], k=1.6)}{"<span class=ls-job><code>3 jobs</code></span>" if i == 1 else ""}</li>'
    today = f'''<div class="today" id="today">
<div class="today-h"><span class="note">Sun 1 Nov</span><h3>Good morning, Reem</h3><p class="note">3 jobs are waiting for you. Start with the first.</p></div>
<div class="tcard">
<div class="tc-top"><code>SFR-26-0031</code><span class="note">Nakhla Co.</span><span class="due">Thu 5 Nov, 13:00</span></div>
<p class="tc-h">Lunch for Nakhla · 40 people</p>
<div class="tc-pos">{brand.line_svg([[s[0] for s in b['steps']] for b in blocks], k=1.2)}<span class="note">Quote · 2 of 7</span></div>
<p><b>For you:</b> check the items and send the quote to Maha.</p>
<button class="btn primary small" type="button" tabindex="-1">Check and send</button>
</div></div>'''
    hand = f'''<div class="spec white"><p class="eyebrow">The line · Sufra · Catering</p><ol class="lstrip">{strip}</ol></div>
<div class="g2">{today}<div class="prose"><p>In the product the grammar becomes the status language: the same strokes say what each step is and where each job stands. Violet appears only for people — the loops and arches, and the one button Reem presses. The card says what to do now in one line, as the earlier product sketches did.</p><p class="note">These are proofs that the identity works in the product. The finished screen: <a href="today.html">Today</a>.</p></div></div>'''
    return (head('Watar and co-branding', 'The assistant, the packs, and whose name leads', 'Iqaa is infrastructure for other organizations’ work. Its assistant drafts and waits; its packs are descriptors; and on everything an organization’s clients see, the organization comes first.')
            + sec('Watar', 'The waiting arch', watar)
            + sec('Architecture', 'One brand, an assistant, packs', arch)
            + sec('Co-branding', 'Tenant first, Iqaa signs off', cob)
            + sec('Messages', 'WhatsApp and email', msg)
            + sec('Product', 'The identity inside the product', hand)
            + '</div>')
