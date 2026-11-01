"""Overview and decisions."""
import json
import math
import os

import brand
import tokens as T
from color import contrast
from shell import LINES, ROOT, blocks_of, esc, head, inline, kinds_of, legend, sec, sigline


def hero_line(pal='light'):
    """Iqaa's mark, then the pen turns over and writes Sufra's whole line without lifting, and Sufra's tile signs it."""
    L = LINES['catering']
    blocks = [[s[0] for s in b['steps']] for b in L['blocks']]
    ink = brand.PAL[pal]['run']
    mark, mw = brand.symbol_body(pal)
    # the mark's rising finish ends at (mw, -16); the pen curls over and comes back down to the baseline
    x0 = mw + 21
    turn = (f'<path d="M{mw} -16c2 -5 7 -6 9 -1c2 5 2 17 12 17" fill="none" stroke="{ink}" stroke-width="{brand.W}" '
            f'stroke-linecap="round"/>')
    body, w = brand.line_body(blocks, 1, pal)
    label = '#4F4D63' if pal == 'light' else '#B5B2C2'
    starts = {}
    for kind, x, bi in brand.line_layout(blocks)[0]:
        if kind != 'handoff':
            starts.setdefault(bi, x)
    names = ''.join(f'<text x="{x0 + starts[i]:.1f}" y="{brand.BOT + 9 + (i % 2) * 10}" font-size="8" fill="{label}" '
                    f'font-family="Atkinson Hyperlegible Next, sans-serif">{esc(b["name"])}</text>' for i, b in enumerate(L['blocks']))
    xt, size = x0 + w + 18, 40
    ground = brand.BRAND['ink'] if pal == 'light' else '#39374D'
    tile = brand.avatar_svg(blocks, size, ground=ground, name=L['org']).replace('<svg ', f'<svg class="hl-tile" x="{xt:.1f}" y="{-size + brand.W / 2:.1f}" ', 1)
    top, bot = -(brand.LOOP_H + brand.MW), brand.BOT + 22
    vw = xt + size + brand.MW
    return (f'<svg class="hero-line" viewBox="{-brand.MW} {top} {vw + brand.MW:.1f} {bot - top:.1f}" role="img" '
            f'aria-label="Iqaa’s mark, written on into Sufra’s line of {len(blocks)} stations, signed by Sufra’s mark">'
            f'<g class="hl-pen">{mark}{turn}<g transform="translate({x0:.1f} 0)">{body}</g></g><g class="hl-names">{names}</g>{tile}</svg>')


def index():
    sym = inline(brand.symbol_svg('light'), 'hero-mark')
    sigs = ''
    for key in ('catering', 'software', 'video'):
        L = LINES[key]
        av = brand.avatar_svg([[x[0] for x in b['steps']] for b in L['blocks']], 72, f'{L["org"]}: its mark', name=L['org'])
        sigs += (f'<div class="sigrow"><div class="meta"><b>{esc(L["template"])}</b><span>Each job here is {esc(L["job"])}. '
                 f'{len(L["blocks"])} stations, {len(kinds_of(key))} steps.</span></div>'
                 f'<div class="row mid" style="gap:var(--s-8);align-items:flex-start">{sigline(key)}<div class="avatar">{av}</div></div></div>')
    settled = [
        ('Name', 'Iqaa, in the wordmark and in every sentence. إيقاع in Arabic.', 'decisions.html#name'),
        ('Idea', 'A line is written as one pen stroke. The mark is Iqaa’s own stroke; every line signs its own name.', 'decisions.html#direction'),
        ('Colour', 'Violet means a person. Everything automatic is ink. No gradient.', 'decisions.html#violet'),
        ('Type', 'Atkinson Hyperlegible Next, with Fragment Mono for times and codes.', 'decisions.html#type'),
        ('Numbers', 'One beat is 16 px and 600 ms (100 BPM). Every size and duration divides it.', 'decisions.html#beat'),
        ('Architecture', 'One Iqaa. Watar is its assistant; Media and Invoicing are packs.', 'decisions.html#architecture'),
    ]
    rows = ''.join(f'<tr><th scope="row">{a}</th><td>{b}</td><td><a href="{c}">Why</a></td></tr>' for a, b, c in settled)
    pages = [
        ('decisions', 'Decisions', 'Every choice, with the measurement or the reason behind it.'),
        ('mark', 'Mark', 'Construction, wordmark, lockups, clear space, sizes, versions, app icon, misuse.'),
        ('signature', 'Signature', 'The grammar, the rules that write a line, and a generator to try them.'),
        ('colour', 'Colour', 'Four client colours, a computed neutral ramp, one alert, light and dark, contrast.'),
        ('type', 'Type', 'The measured choice of faces, the scale, and how times, dates and codes are set.'),
        ('icons', 'Icons', 'The steps, the stations and the actions, on one 24 px grid.'),
        ('motion', 'Motion', 'The tempo, the curves, and five moments from the product, playable.'),
        ('system', 'Watar and co-branding', 'The assistant, the packs, Runs on Iqaa, messages and the product handshake.'),
        ('applications', 'Applications', 'Website, social, deck, stationery, event, all in the demo world.'),
        ('guidelines', 'Guidelines', 'Ten rules, do and don’t, tokens, files and the quality check.'),
    ]
    idx = ''.join(f'<li><a href="{s}.html"><b>{n}</b><span>{d}</span></a></li>' for s, n, d in pages)
    return f'''<div class="wrap">
<section class="hero">
<div class="hero-text">
<p class="eyebrow">Iqaa · brand identity</p>
<h1>Work, in time.</h1>
<p class="lede">Iqaa runs an organization’s work as a line: people and automatic steps, in order, so that no work falls between two hands. Its identity writes that line with one pen — straight where a step runs by itself, a loop where a person’s hand does the work — so every organization’s line becomes its own signature.</p>
</div>
<figure class="hero-fig" data-reveal>{sym}<figcaption class="note">Iqaa’s own stroke: it arrives straight, a hand loops it once, and it leaves rising, in time.</figcaption></figure>
<figure class="hero-wide" data-reveal data-hero-line>{hero_line()}<figcaption class="note">Iqaa’s own stroke hands the pen on: it writes Sufra’s line, seven stations and sixteen steps, and Sufra’s mark signs it.</figcaption></figure>
</section>
</div>
<section class="scr prod" aria-labelledby="prod-h"><div class="wrap scr-in">
<div class="scr-t">
<p class="eyebrow">In the product</p>
<h2 id="prod-h">Not painted on: it is how the product speaks</h2>
<p class="scr-what">Every screen uses the same strokes to say where work stands: a loop for what a person did, a dashed grey pen for what is not real yet, a metro map for the whole line. Here, Reem’s day at Sufra on a laptop and Sufra’s line on a phone.</p>
<a class="btn primary" href="screens.html">See the screens</a>
</div>
<a class="scr-stage" href="screens.html#today" aria-label="See the screens">
<figure class="scr-d"><span class="scr-bar" aria-hidden="true"><code>sufra.iqaa.app/today</code></span><img src="assets/screens/today-d.webp" width="1440" height="900" alt="Today on a desktop: Reem’s day as a line in time, the jobs waiting at Quote, and what is coming and done beside them." decoding="async"></figure>
<figure class="scr-m"><img src="assets/screens/line-m.webp" width="750" height="1624" alt="Sufra’s line on a phone: a vertical metro map with a way back and a branch." loading="lazy" decoding="async"></figure>
</a>
</div></section>
<div class="wrap">
{sec('The idea', 'One pen, four strokes', legend() + '<p>The stroke carries the meaning, so a line reads in one colour, in greyscale and for colour-blind eyes. Colour adds one more fact: violet is always a person. Between stations the pen runs a short straight: the handoff.</p>')}
{sec('Signatures', 'Every line signs its own name', sigs, 'Stations from the client deck. The steps inside each station are illustrative, built only from step types the plan names. Beside each line, the same line signed on the organization’s tile: its mark. Sufra, Raqm and Kadr are demo organizations.')}
{sec('Settled', 'What this round decides', f'<div class="tbl-wrap"><table><thead><tr><th>Area</th><th>Decision</th><th></th></tr></thead><tbody>{rows}</tbody></table></div>')}
{sec('Contents', 'In this book', f'<ul class="toc">{idx}</ul>')}
</div>'''


def candidate_table():
    """Round 3, after the client turned down the squares-and-circles grammar as toy-like."""
    rows = [
        ('A · The signature: one pen stroke', 'Straight, loop, arch, dot', 'One stroke with one loop; the pen is drawn heavier below 48 px so it stays 1.6 px', 'Chosen by the client'),
        ('B · Nuqta and kashida', 'Calligraphic dots above and below a stretched stroke', 'Dots hold from 20 px; two dots and a dash read as ÷', 'Out'),
        ('C · The weave', 'A thread over and under the stations', 'Three verticals and a bar read as # or a ladder', 'Out'),
        ('Round 2 · Squares and circles', 'Square, ring, disc, dot', 'Held at 16 px, but read as a toy and a bingo board on screens', 'Out'),
    ]
    body = ''.join(f'<tr{" class=out" if v == "Out" else ""}><td>{a}</td><td>{b}</td><td>{c}</td><td><b>{v}</b></td></tr>' for a, b, c, v in rows)
    return ('<div class="tbl-wrap"><table><thead><tr><th>Direction</th><th>Grammar</th><th>Small sizes and readings</th>'
            f'<th>Result</th></tr></thead><tbody>{body}</tbody></table></div>'
            '<p class="note">The three round-3 directions are drawn side by side in research/directions-2.html.</p>')


def font_table():
    with open(os.path.join(ROOT, 'research', 'font-facts.json'), encoding='utf-8') as fh:
        rows = json.load(fh)
    out = ''
    for r in rows:
        if r['mono']:
            continue
        ok = r['tnum'] and r['turkish'] and r['I_vs_l']
        tick = lambda b: '✓' if b else '<span class="fail">✗</span>'
        out += (f'<tr{"" if ok else " class=out"}><td>{r["face"]}</td><td>{tick(r["tnum"])}</td><td>{tick(r["turkish"])}</td>'
                f'<td>{tick(r["I_vs_l"])}</td><td class="num">{r["xh"]:.3f}</td><td class="num">{r["width"]:.3f}</td></tr>')
    mono = ''
    for r in rows:
        if not r['mono']:
            continue
        mono += (f'<tr><td>{r["face"]}</td><td>{"✓" if r["zero"] else "—"}</td><td class="num">{r["xh"]:.3f}</td>'
                 f'<td class="num">{abs(r["xh"] - 0.743):.3f}</td><td class="num">{r["width"]:.3f}</td></tr>')
    return (f'<div class="tbl-wrap"><table><thead><tr><th>Sans</th><th>Tabular figures</th><th>Turkish</th><th>I and l differ</th>'
            f'<th class="num">x-height / cap</th><th class="num">Mean width, em</th></tr></thead><tbody>{out}</tbody></table></div>'
            f'<div class="tbl-wrap"><table><thead><tr><th>Mono</th><th>Slashed zero</th><th class="num">x-height / cap</th>'
            f'<th class="num">Gap to Atkinson</th><th class="num">Mean width, em</th></tr></thead><tbody>{mono}</tbody></table></div>')


def decision(id_, area, what, why):
    li = ''.join(f'<li>{w}</li>' for w in why)
    return f'<div class="dec" id="{id_}"><div><h3>{area}</h3><p class="what">{what}</p></div><ul>{li}</ul></div>'


def decisions():
    v, w, ink = T.BRAND['violet'], '#FFFFFF', T.BRAND['ink']
    wght = brand.wordmark_weight()
    name = decision('name', 'Name', 'Iqaa. Title case in the wordmark and in every sentence; إيقاع in Arabic.', [
        'An apostrophe cannot live in a domain, a handle or an email address. The product already writes <code>iqaa.app</code>, and everyone who types the name types <code>iqaa</code>.',
        'Software turns the apostrophe into two different characters (\' and ’). Search, file names and code identifiers then disagree about the name.',
        'Nothing in the idea needs the punctuation.',
        'Title case, because it is a word and a name. In capitals, IQAA reads as initials and shouts inside a sentence.',
        'The chosen face draws a capital I with serifs, so Iqaa never reads as lqaa.',
    ])
    direction = decision('direction', 'Direction', 'The signature: a line is one pen stroke, and Iqaa’s mark is its own stroke.', [
        'The product is a line, and the identity draws it with a hand: every organization’s line literally becomes its signature.',
        'Chosen by the client out of three drawn directions, after the squares-and-circles grammar was turned down as toy-like on screens.',
        'No automation brand draws a hand’s stroke; the category draws wires, nodes and boxes.',
        'It survives Arabic: a pen simply writes right to left, and the loops turn the other way.',
    ])
    grammar = decision('grammar', 'Grammar', 'A straight stroke for a step that runs, a loop for a person, an open arch for a step that waits for a person, a lifted pen and a dot for a rest; a short straight between stations.', [
        'The stroke alone tells every state apart, in one colour, in greyscale and for colour-blind eyes. Colour then adds one fact: a person.',
        'A machine draws straight; a hand loops. An arch is a bridge not crossed yet: work waiting for someone.',
        'A failed step snaps in the alert colour, both ends sagging; a test or an unapproved draft is written with a dashed grey pen.',
        'None of the strokes is a letter on its own, and a line never reads as a waveform: it has no peaks, only loops.',
    ])
    symbol = decision('symbol', 'Mark', 'Three steps of Iqaa’s own line: it arrives straight, a hand loops it once, and it leaves rising.', [
        'The mark is written with the same pen as every signature, so the system and the logo are one thing.',
        'In the lockup it runs on the word’s baseline into the name, its loop as tall as the capitals: a signature that leads into the name.',
        'Resemblance, checked: a cursive l (kept to one loop), a ribbon (no crossing tail), a heartbeat line (no peaks).',
        'The rising finish is “in time”: the line goes on.',
    ])
    violet = decision('violet', 'Violet', 'Violet means a person: work a person did, a step waiting for a person, and the button a person presses. Everything automatic is ink.', [
        'It is the strategy made visible: machines draft, people decide.',
        'In an interface the primary button is a person’s action, so one rule covers strokes, buttons and focus.',
        f'Violet on white is {contrast(v, w):.2f}:1, enough for text; on ink it is {contrast(v, ink):.2f}:1, so on dark grounds lilac takes its role at {contrast(T.BRAND["lilac"], ink):.2f}:1.',
        'Since shape carries the state, nothing depends on seeing violet.',
    ])
    gradient = decision('gradient', 'Gradient', 'Not used. The client’s four colours are all kept, flat.', [
        'A purple-to-lilac gradient is the visual code of AI products in 2026; Iqaa’s assistant drafts and waits, it is not the hero.',
        f'Lilac on white is {contrast(T.BRAND["lilac"], w):.2f}:1, so half of any such gradient fails as a ground for text.',
        'Covers keep their weight with flat ink; violet stays a point of focus, never a ground.',
    ])
    alert = decision('alert', 'Alert', f'One alert colour, {T.RED}, for failed and late. On ink, {T.RED_DARK}. No green.', [
        f'Computed, not picked: OKLCH at the violet’s own lightness and chroma, hue 25. It is exactly as loud as a person and never louder ({contrast(T.RED, w):.2f}:1 on white).',
        f'On ink it takes the lilac’s lightness, as violet does: {contrast(T.RED_DARK, ink):.2f}:1.',
        'A step that worked needs no colour; it is ink, like every automatic step. A step that failed or a job that is late needs one.',
        'A failed step is also a different shape (the stroke snaps), so the red is never the only signal.',
    ])
    neutrals = decision('neutrals', 'Neutrals', 'A cool ramp with the client’s lavender as step 100 and ink as step 950.', [
        'Steps between are evenly spaced in OKLCH lightness; chroma and hue move from one end to the other, so every grey belongs to ink.',
        f'Secondary text is n700 ({contrast(T.NEUTRAL["700"], w):.2f}:1); the faintest text allowed is n600 ({contrast(T.NEUTRAL["600"], w):.2f}:1 on white, {contrast(T.NEUTRAL["600"], T.NEUTRAL["50"]):.2f}:1 on n50).',
        f'n500 draws test runs and other graphics ({contrast(T.NEUTRAL["500"], w):.2f}:1, above the 3:1 graphics need).',
        'No warm greys, no cream.',
    ])
    typ = decision('type', 'Type', 'Atkinson Hyperlegible Next for everything; Fragment Mono for times, codes and run logs.', [
        'Measured on three gates: tabular figures, full Turkish, and a capital I that differs from l in outline. Of ten sans candidates only Atkinson Hyperlegible Next and Hanken Grotesk pass all three.',
        'Between those two, Atkinson has the higher x-height (0.743 against 0.707) and the narrower average letter (0.487 em against 0.504), so it is clearer and denser at 12–13 px.',
        'Fragment Mono’s x-height (0.750) is the closest to Atkinson’s, so a code like SFR-26-0031 sits level inside a sentence. It has a slashed zero.',
        'One family for display and text keeps the identity composed; the mark carries the character.',
    ])
    wordmark = decision('wordmark', 'Wordmark weight', f'Atkinson Hyperlegible Next at weight {wght}, outlined.', [
        'In the lockup the mark sits on the word’s baseline and its loop rises exactly to the cap height.',
        'At that size the letters’ stem is set equal to the mark’s pen, so the name and the stroke are written with one hand. The weight that does that is solved, not chosen.',
    ])
    beat = decision('beat', 'Beat and tempo', 'One beat is 16 px and 600 ms (100 BPM). Type steps by 1.25.', [
        'Every space is a quarter-beat multiple: 4, 8, 12, 16, 24, 32, 48, 64. At 1440 px the grid has 80 px columns and 32 px gutters: five beats and two.',
        'At 100 BPM a quarter beat is 150 ms and a half beat 300 ms, the durations interfaces already use for small and medium moves. Brand motion uses whole beats.',
        'A ratio of 1.25 gives five sizes between 13 and 31 px (13, 16, 20, 25, 31): enough for a dense product. 1.333 gives four.',
    ])
    icon = decision('appicon', 'App icon', 'The mark on an ink tile. Below 48 px the pen is drawn heavier; at 32 px and below the finish is dropped so the loop stays open.', [
        'Browser tabs are light and dark. A transparent mark with ink strokes disappears on a dark tab; a tile does not.',
        f'On ink the person colour is lilac: {contrast(T.BRAND["lilac"], ink):.2f}:1, the strongest pair in the palette.',
        'At 16 px the mark’s pen would fall under a pixel; the small icons widen it to 1.6 px so the loop stays open.',
    ])
    rtl = decision('rtl', 'Right to left', 'The mark never mirrors. Signatures do.', [
        'One trademark, one app icon file, in every language.',
        'A signature is data, so it is written in reading order: left to right in English and Turkish, right to left in Arabic.',
    ])
    arch = decision('architecture', 'Architecture', 'One Iqaa for the platform. Watar is its assistant. Media and Invoicing are packs.', [
        'The client deck proposes one brand for every field; the build plan already treats the older media studio as a pack.',
        'Watar’s mark is the waiting arch, because everything Watar makes waits for a person to approve it.',
        'Packs are descriptors beside the wordmark, never new marks.',
    ])
    test = decision('test', 'Test runs', 'In a test no hand has acted: the line is written with a dashed grey pen and nothing turns violet.', [
        'A test sends nothing and no person acts; the drawing says so without a caption.',
        'On the Line screen the test job is a grey stop that walks the map, and the track it walked turns dashed grey.',
    ])
    metro = decision('map', 'The Line screen', 'Where a line is built, it is drawn as a metro map; the signature stays its compact name.', [
        'Chosen by the client on 1 November over a metro identity: a map is a working view, a signature is a name, the way a metro line has both a diagram and a roundel.',
        'Beck’s rules from the 1933 London diagram, which people read without being taught: even spacing whatever the distance (here, whatever the duration), tracks only horizontal, vertical or at 45°, bends rounded.',
        'Every station is drawn as an interchange ring, because a station is where work changes hands.',
        'A branch leaves at 45° and rejoins the line; a way back turns square at half weight. Two routes leaving one station never share a track, and the two are told apart in greyscale.',
        'On a phone the map turns vertical, the way route views list stops down the screen; lanes step toward the start edge and the rail moves in to make room for them.',
    ])
    open_ = decision('open', 'Not settled by design', 'Three things this book cannot decide.', [
        'Trademark clearance. An earlier check found Retm (رتم, the same meaning, the same market) and a wellness app called Eqa’a. No search has been made.',
        'The Arabic partner face: tested on real product text when the Arabic phase starts (shortlist on the type page).',
        'Claims. No customer, number, price or integration appears anywhere until it is real.',
    ])
    body = (head('Decisions', 'Nothing here is a matter of taste', 'Each decision states what was chosen and the measurement or reason that chose it. The numbers come from the same scripts that draw the files.')
            + sec('Name and idea', 'What the brand is called and drawn as', name + direction + grammar + symbol)
            + sec('Evidence', 'The round that chose the pen', candidate_table())
            + sec('Colour', 'What colour means', violet + gradient + alert + neutrals)
            + sec('Type and numbers', 'Faces, weight, beat and tempo', typ + font_table() + wordmark + beat)
            + sec('Rules of use', 'Icon, direction, architecture, tests, the map', icon + rtl + arch + test + metro + open_)
            + '</div>')
    return body
