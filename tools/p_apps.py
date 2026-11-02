"""Applications and guidelines. Artboards are sized in cqw, so each scales as one picture."""
import os

import brand
import tokens as T
from shell import LINES, ROOT, blocks_of, esc, head, inline, kinds_of, sec

INK, V = T.BRAND['ink'], T.BRAND['violet']


def art(w, h, inner, cls='', cap='', note=''):
    return (f'<figure><div class="frame" style="--ar:{w}/{h}"><div class="art {cls}">{inner}</div></div>'
            f'<figcaption class="fcap"><b>{cap}</b><span>{w} × {h}{note}</span></figcaption></figure>')


def sig_svg(key, pal='light', test=False, k=3):
    blocks = [[s[0] for s in b['steps']] for b in LINES[key]['blocks']]
    return brand.line_svg(blocks, k=k, pal=pal, test=test)


def labelled(key, pal='light'):
    """The line as one stroke with station names under it, as one SVG so it scales with its frame."""
    blocks = LINES[key]['blocks']
    kinds = [[s[0] for s in b['steps']] for b in blocks]
    col = T.NEUTRAL['700'] if pal == 'light' else T.NEUTRAL['300']
    return brand.line_svg(kinds, pal=pal, labels=[b['name'] for b in blocks], label_color=col)


def fold(key, pal='light'):
    return brand.avatar_svg([[s[0] for s in b['steps']] for b in LINES[key]['blocks']], 100, LINES[key]['org'] + ' mark', name=LINES[key]['mark'])


def lock(pal='light'):
    return inline(brand.lockup_svg(pal))




def wrapped(key, rows=2, pal='light', names=True, cls='wrapped'):
    """A line written like text: whole stations to a row, each row picking the pen up where the last one stopped."""
    L = LINES[key]
    blocks = [[s[0] for s in b['steps']] for b in L['blocks']]
    widths = [brand.line_layout([b])[1] for b in blocks]
    total = sum(widths) + brand.HANDOFF * (len(blocks) - 1)
    groups, acc = [[] for _ in range(rows)], 0.0
    for i, w in enumerate(widths):
        r = min(rows - 1, int((acc + w / 2) / (total / rows)))
        groups[r].append(i)
        acc += w + brand.HANDOFF
    groups = [g for g in groups if g]
    p, label = brand.PAL[pal], (T.NEUTRAL['700'] if pal == 'light' else T.NEUTRAL['300'])
    lead, gap = brand.HANDOFF, 18
    row_h = brand.LOOP_H + brand.W + brand.BOT + (24 if names else 4) + gap
    out, wmax = '', 0.0
    for ri, g in enumerate(groups):
        y = brand.LOOP_H + brand.W + ri * row_h
        x0 = lead if ri else 0.0
        body, w = brand.line_body([blocks[i] for i in g], 1, pal)
        sw = brand.W
        ends = ''
        if ri:  # the pen picks up at the start of the row
            ends += f'<path d="M0 {y}h{lead}" fill="none" stroke="{p['run']}" stroke-width="{sw}" stroke-linecap="round"/>'
        if ri < len(groups) - 1:  # and runs on to the end of the row
            ends += f'<path d="M{x0 + w} {y}h{lead}" fill="none" stroke="{p['run']}" stroke-width="{sw}" stroke-linecap="round"/>'
        out += f'{ends}<g transform="translate({x0} {y})">{body}</g>'
        if names:
            starts, x = [], 0.0
            for i in g:
                starts.append(x)
                x += widths[i] + brand.HANDOFF
            out += ''.join(f'<text x="{x0 + sx:.1f}" y="{y + brand.BOT + 9 + (j % 2) * 10}" font-size="8" fill="{label}" '
                           f'font-family="Atkinson Hyperlegible Next, sans-serif">{esc(L["blocks"][i]["name"])}</text>' for j, (i, sx) in enumerate(zip(g, starts)))
            # a last name longer than its steps ("Campaign launch") widens the drawing, at about 0.56 em a character
            wmax = max(wmax, *(x0 + sx + len(L['blocks'][i]['name']) * 8 * 0.56 for i, sx in zip(g, starts)))
        wmax = max(wmax, x0 + w + (lead if ri < len(groups) - 1 else 0))
    h = len(groups) * row_h - gap
    return (f'<svg class="{cls}" viewBox="{-brand.W} 0 {wmax + 2 * brand.W:.1f} {h:.1f}" role="img" '
            f'aria-label="{esc(L["org"])}’s line, written in {len(groups)} rows: {len(blocks)} stations">{out}</svg>')


def counts(key):
    ks = kinds_of(key)
    return len(LINES[key]['blocks']), len(ks), sum(1 for k in ks if k in ('struck', 'held'))


def applications():
    from p_core import hero_count, hero_line
    st, bt, pp = counts('media')
    web = art(1440, 900, f"""<div class="w-nav"><div class="w-lock">{lock()}</div><span>How it works</span><span>Templates</span><span>Watar</span><span class="w-sign">Sign in</span><span class="b-p">Start an organization</span></div>
<div class="w-hero"><h2>Work, in time.</h2><p>One line for every job in your organization: people and automatic steps, in order, so nothing falls between two hands.</p>
<div class="w-cta"><span class="b-p">See a line</span><span class="b-s">Templates</span></div></div>
<div class="w-line">{hero_line()}</div>
<div class="w-shot"><span class="w-bar"><code>alkhatt.iqaa.co/my-work</code></span><img src="assets/screens/work-d.webp" alt="" loading="lazy" decoding="async"></div>""", 'web', 'Website · desktop')
    mob = art(390, 844, f"""<div class="m-nav"><div class="m-lock">{lock()}</div><span class="m-menu">Menu</span></div>
<h2>Work, in time.</h2><p>One line for every job: people and automatic steps, in order, so nothing falls between two hands.</p>
<span class="b-p">See a line</span>
<div class="m-sig">{wrapped('media', 2)}<p>Al-Khatt Media’s line: {bt} steps, {pp} for people.</p></div>
<div class="m-shot"><img src="assets/screens/work-m.webp" alt="" loading="lazy" decoding="async"></div>""", 'mob', 'Website · phone')
    og1 = art(1200, 630, f"""<div class="og-lock">{lock()}</div><h2>Work, in time.</h2><div class="og-sig">{hero_line()}</div>""", 'og', 'Open Graph · home')
    og2 = art(1200, 630, f"""<div class="og2-t"><div><p class="og-k">Template</p><h2>Media and production</h2><p>{st} stations · {bt} steps · {pp} for people</p></div><div class="og2-tile">{fold('media')}</div></div>
<div class="og2-sig">{wrapped('media', 1)}</div><div class="og-lock sm">{lock()}</div>""", 'og2', 'Open Graph · template page')
    posts = ''
    heads = {'media': 'A piece waits four times for a person.', 'software': 'A feature is mostly people, and ships by itself.', 'agency': 'A campaign waits on its client.'}
    for key in ('media', 'software', 'agency'):
        s_, b_, p_ = counts(key)
        L = LINES[key]
        posts += art(1080, 1350, f"""<div class="p-top"><span class="p-tile">{fold(key)}</span><span><b>{esc(L["org"])}</b> · {esc(L["template"])}</span></div>
<h2>{heads[key]}</h2><div class="p-sig">{wrapped(key, 2)}</div>
<div class="p-foot"><p>{s_} stations · {b_} steps · {p_} for people</p><div class="p-lock">{lock()}</div></div>""", 'post', f'Post · {L["template"]}')
    rows = ''
    for key in ('media', 'software', 'agency'):
        L = LINES[key]
        rows += (f'<div class="s-row"><div class="s-who"><span class="s-tile">{brand.avatar_svg(blocks_of(key), 100, ground="#39374D", name=L["mark"])}</span>'
                 f'<span><b>{esc(L["org"])}</b> {esc(L["template"])}</span></div>{wrapped(key, 1, "dark")}</div>')
    story = art(1080, 1920, f"""<div class="s-lock">{lock('dark')}</div><h2>Every line signs its own name.</h2><div class="s-rows">{rows}</div><p class="s-url">iqaa.app</p>""", 'story', 'Story')
    li = art(1584, 396, f"""<div class="li-t"><h2>Work, in time.</h2><p>iqaa.app</p></div><div class="li-sig">{hero_line()}</div>""", 'li', 'LinkedIn banner', ' · bottom left kept clear for the profile photo')
    d1 = art(1920, 1080, f"""<div class="d-lock">{lock('dark')}</div><div><h2>Work, in time.</h2><p>Pilot plan for Al-Khatt Media · November 2026</p></div><div class="d-line">{hero_line('dark')}</div>""", 'deck d-cover', 'Deck · cover', ' · sample meeting')
    d2 = art(1920, 1080, f"""<p class="d-n">02</p><h2>The line</h2><div class="d-rule">{wrapped('media', 1, names=False)}</div>""", 'deck d-div', 'Deck · section')
    d3 = art(1920, 1080, f"""<p class="d-k">The line</p><h2>Work fails between hands, not inside them.</h2><p>The piece nobody picked up. The post published before anyone checked it. The approval that waited a week. Iqaa holds every job on one line and hands it on at the right moment.</p><div class="d-sig">{labelled('media')}</div>""", 'deck d-body', 'Deck · content')
    cols = ''
    for b in LINES['media']['blocks']:
        steps = ''.join(f'<li>{brand.glyph_svg(s[0], "light", 14)}<span>{esc(s[1])}</span></li>' for s in b['steps'])
        cols += f'<div class="dg-c"><b>{esc(b["name"])}</b><ul>{steps}</ul></div>'
    d4 = art(1920, 1080, f"""<p class="d-k">{LINES['media']['template']} · {LINES['media']['job']}</p><h2>{hero_count().capitalize().replace(' and ', ', ')}</h2><div class="dg">{cols}</div>""", 'deck d-dia', 'Deck · diagram')
    card = art(85, 55, f"""<div class="c-lock">{lock()}</div><div class="c-t"><b>Name Surname</b><span>Product lead</span></div><div class="c-c"><span>name@iqaa.app</span><span>iqaa.app</span></div>""", 'card', 'Business card · front', ' mm · sample name')
    cardb = art(85, 55, f"""<div class="cb">{inline(brand.symbol_svg('dark'))}</div>""", 'card cardb', 'Business card · back', ' mm')
    # the letterhead's foot: Iqaa's own stroke, and the pen runs on along the page
    mk, mw = brand.symbol_body('light', 1)
    foot = (f'<svg class="lh-pen" viewBox="-6 -36 640 44" preserveAspectRatio="xMinYMid meet" aria-hidden="true">{mk}'
            f'<path d="M{mw} -16c4 -6 10 -3 10 4c0 7 6 12 16 12H634" fill="none" stroke="{INK}" stroke-width="{brand.W}" stroke-linecap="round"/></svg>')
    letter = art(210, 297, f"""<div class="lh-top"><div class="lh-lock">{lock()}</div><p>iqaa.app</p></div>
<div class="lh-b"><p>1 November 2026</p><p>Khaled Mansour<br>Al-Khatt Media</p><p>Dear Khaled,</p><p>Thank you for running Al-Khatt Media’s first piece through Iqaa. Your content production line is published as version 4: seven blocks, a way back from each review, and Design working beside Montage.</p><p>Every piece your team takes from today walks that line. Live pieces keep the version they started on, so you can keep improving it without stopping the work.</p><p>The Iqaa team</p></div>
<div class="lh-f">{foot}</div>""", 'letter', 'Letterhead · A4', ' mm · sample letter')
    report = art(210, 297, f"""<div class="rp-top"><p><span class="rp-tile">{fold('media')}</span>Al-Khatt Media · Media and production</p><div class="rp-lock">{lock()}</div></div>
<div class="rp-sig">{wrapped('media', 2)}</div>
<h2>Weekly run report</h2><p class="rp-d">26 Oct – 1 Nov 2026</p><p class="rp-n">Sample cover. The figures inside come from the run log.</p>""", 'report', 'Report cover · A4', ' mm')
    roll = art(850, 2000, f"""<div class="r-lock">{lock('dark')}</div><h2>Work, in time.</h2><div class="r-sig">{wrapped('media', 3, 'dark')}</div><p>One line for every job: people and automatic steps, in order. This one is Al-Khatt Media’s.</p><p class="r-url">iqaa.app</p>""", 'roll', 'Roll-up banner', ' mm')
    sigmail = f"""<div class="esig"><p><b>Name Surname</b><br><span>Product lead · Iqaa</span></p><p class="esig-l">{inline(brand.lockup_svg('light')).replace('<svg ', '<svg height="20" ', 1)}</p><p><a href="#" tabindex="-1">iqaa.app</a></p></div>"""
    body = (head('Applications', 'The identity at work', 'Every surface is built from the demo world and the real template lines, and every one carries a whole line, not just a mark. Names on stationery are samples; a price stays in brackets until it exists.')
            + sec('Website', 'Hero, desktop and phone', f'<div class="g-web">{web}{mob}</div>', 'Headline in three lines at most. The pen writes Iqaa’s mark on into a real line, and the product rises under it.')
            + sec('Sharing', 'Open Graph images', f'<div class="g2">{og1}{og2}</div>')
            + sec('Social', 'Posts, story, banner', f'<div class="g3">{posts}</div><div class="g-story">{story}<div>{li}</div></div>', 'Each post states only what its line shows: stations, steps, steps for people.')
            + sec('Deck', 'Four slide types', f'<div class="g2">{d1}{d2}{d3}{d4}</div>')
            + sec('Print', 'Card, letterhead, report', f'<div class="g-print"><div class="g-cards">{card}{cardb}</div>{letter}{report}</div>')
            + sec('Email', 'Signature', f'<div class="spec white">{sigmail}</div><p class="note">600 px wide, plain HTML: text is live, the lockup is one 20 px SVG with a PNG fallback.</p>')
            + sec('Event', 'Roll-up banner', f'<div class="g-roll">{roll}</div>')
            + '</div>')
    return body


TEN = [
    ('Violet is a person.', 'Work done by hand, a step waiting for someone, the button someone presses. Nothing automatic is ever violet.'),
    ('The stroke carries the state.', 'A straight runs by itself, an arch waits, a loop is done by hand, a dot is a pause. Colour is never the only signal.'),
    ('The mark is Iqaa’s own line.', 'Three steps of its line, drawn with the same pen as every signature. Never redraw, reverse or decorate it.'),
    ('One beat is the unit.', 'A step is one beat of the line; 16 px of space and 600 ms of time. Every size and duration divides it.'),
    ('Signatures are true.', 'They come from a real line or a labelled demo, and they appear only where that line is the subject.'),
    ('The organization leads.', 'On its subdomain, links and messages, its name comes first; Iqaa signs off with Runs on Iqaa.'),
    ('Ink and white carry the page.', 'Cool lavender greys for quiet grounds. No cream, no gradient, no glass, no glow.'),
    ('Watar drafts; people decide.', 'Its work always waits under an arch for a person, with what it did and what it will not do.'),
    ('Motion has a cause.', 'Step, hold, release, on the tempo. Nothing loops or floats on its own.'),
    ('No fact is invented.', 'No customer, number, price or integration until it exists. Brackets until then.'),
]


def guidelines():
    ten = ''.join(f'<li><b>{a}</b><span>{b}</span></li>' for a, b in TEN)
    dd = f'''<div class="g2">
<div class="pair"><div class="spec white"><div class="mock-row"><span>Approve the script</span><span class="b-p">Approve</span></div><div class="mock-row"><span>Auto-remind clients</span><span class="tog on-ink" aria-hidden="true"><i></i></span></div></div><p class="fcap"><b>Do</b><span>Violet for the person’s action; ink for the automation switch.</span></p></div>
<div class="pair"><div class="spec white"><div class="mock-row"><span>Approve the script</span><span class="b-p">Approve</span></div><div class="mock-row"><span>Auto-remind clients</span><span class="tog on-violet" aria-hidden="true"><i></i></span></div></div><p class="fcap"><b class="fail">Don’t</b><span>A violet switch says a person did it. A machine does.</span></p></div>
<div class="pair"><div class="spec white"><div class="mock-row lead">{brand.glyph_svg('failed', 'light', 22)}<span>Publish on Instagram · failed at 10:02</span></div><div class="mock-row lead">{brand.glyph_svg('held', 'light', 22)}<span>Waiting for Omar</span></div></div><p class="fcap"><b>Do</b><span>Shape and words together.</span></p></div>
<div class="pair"><div class="spec white"><div class="mock-row"><span class="dotc" style="background:{T.RED}"></span><span>Publish on Instagram</span></div><div class="mock-row"><span class="dotc" style="background:{V}"></span><span>Client approval</span></div></div><p class="fcap"><b class="fail">Don’t</b><span>Coloured dots alone fail in greyscale and for colour-blind eyes.</span></p></div>
<div class="pair"><div class="spec white"><div class="beside">{brand.avatar_svg([[x[0] for x in b['steps']] for b in LINES['media']['blocks']], 48, name='K')}<div><p><b>Al-Khatt Media</b> · Media and production</p>{brand.line_svg([[x[0] for x in b['steps']] for b in LINES['media']['blocks']], k=0.62)}</div></div></div><p class="fcap"><b>Do</b><span>A signature beside the line it belongs to.</span></p></div>
<div class="pair"><div class="spec white wall"><svg class="wall-bg" aria-hidden="true"><defs><pattern id="sigwall" width="150" height="44" patternUnits="userSpaceOnUse"><g transform="translate(4 32) scale(0.62)">{brand.line_body([['struck', 'run'], ['held', 'struck', 'run']], 1)[0]}</g></pattern></defs><rect width="100%" height="100%" fill="url(#sigwall)"/></svg><p>Work, in time.</p></div><p class="fcap"><b class="fail">Don’t</b><span>A signature as a pattern behind text.</span></p></div>
</div>'''
    files = sorted(os.listdir(os.path.join(ROOT, 'assets', 'brand')))
    fl = ''.join(f'<li><a href="assets/brand/{f}" download><code>{f}</code></a></li>' for f in files)
    toks = [('--iqaa-violet', V), ('--iqaa-lilac', T.BRAND['lilac']), ('--iqaa-ink', INK), ('--iqaa-lavender', T.BRAND['lavender']),
            ('--iqaa-red', T.RED), ('--beat', '16px'), ('--m-quarter', f'{T.MOTION["quarter"]}ms'), ('--m-beat', f'{T.MOTION["beat"]}ms'),
            ('--ease-arrive', T.MOTION['ease_arrive']), ('--icon-stroke', '1.5')]
    tt = ''.join(f'<tr><td><code>{a}</code></td><td><code>{b}</code></td></tr>' for a, b in toks)
    qc = [
        ('Every text pair passes WCAG 2.2 AA', 'Computed for every pair from the tokens; the matrix is on the colour page.'),
        ('Every state reads without colour', 'Straight, arch, loop, dot and snap, rendered in greyscale and through a deuteranopia filter on the signature page.'),
        ('The mark holds at 16 px', 'The pen is drawn heavier below 48 px so it stays 1.6 px wide; seen on light and dark tabs.'),
        ('One pen for the mark and the letters', f'Wordmark weight {brand.wordmark_weight()} solved so the stem equals the mark’s pen at cap height.'),
        ('Fonts are measured, not picked', 'Measured on the font files: tabular figures, Turkish, I and l, x-height, width.'),
        ('No invented facts', 'Names, addresses, prices and roles are in brackets; template steps are labelled illustrative.'),
        ('No banned codes', 'No gradient, glass, glow, sparkle, wire, gear or music sign anywhere in the files.'),
        ('Pages work at 375 px', 'Checked in the browser at 375, 768 and 1280 px; no sideways scroll.'),
    ]
    qq = ''.join(f'<tr><td>✓</td><th scope="row">{a}</th><td>{b}</td></tr>' for a, b in qc)
    body = (head('Guidelines', 'Ten rules keep it whole', 'The rules that, kept, make every surface recognisably Iqaa — and the files, tokens and checks that go with them.')
            + sec('Rules', 'Ten rules', f'<ol class="ten">{ten}</ol>')
            + sec('Do and don’t', 'Six common cases', dd)
            + sec('Tokens', 'For code', f'<div class="tbl-wrap"><table><tbody>{tt}</tbody></table></div><p><a class="btn small" href="assets/tokens/iqaa.tokens.json" download>iqaa.tokens.json</a> <a class="btn small" href="assets/css/tokens.css" download>tokens.css</a></p>')
            + sec('Files', 'Logo files', f'<ul class="files">{fl}</ul><p class="note">SVG, outlined, no fonts needed. They are drawn from the same numbers as this book; never edit them by hand.</p>')
            + sec('Quality', 'Checked before handing over', f'<div class="tbl-wrap"><table><tbody>{qq}</tbody></table></div>')
            + '</div>')
    return body
