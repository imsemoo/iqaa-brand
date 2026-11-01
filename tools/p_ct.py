"""Colour, type and icons."""
import brand
import tokens as T
from color import contrast
from p_core import font_table
from shell import esc, head, sec

W, INK = '#FFFFFF', T.BRAND['ink']
NAMES = {'ink': 'Ink', 'violet': 'Violet', 'lilac': 'Lilac', 'lavender': 'Lavender', 'white': 'White'}
ROLE = {
    'ink': 'Text, and every step that runs by itself.',
    'violet': 'A person: work done by hand, a step waiting for someone, the button pressed.',
    'lilac': 'Violet’s role on ink. Never text on light grounds.',
    'lavender': 'A quiet ground; neutral step 100.',
}


def swatch(key):
    d = T.describe(T.BRAND[key])
    fg = '#fff' if contrast(d['hex'], W) > contrast(d['hex'], INK) else INK
    rows = ''.join(f'<dt>{k.upper()}</dt><dd>{d[k]}</dd>' for k in ('hex', 'rgb', 'hsl', 'oklch', 'cmyk'))
    rows += f'<dt>On white</dt><dd>{d["on_white"]}:1</dd><dt>On ink</dt><dd>{d["on_ink"]}:1</dd>'
    border = ';box-shadow:inset 0 0 0 1px var(--c-rule)' if key == 'lavender' else ''
    return (f'<div class="sw"><div class="chip" style="background:{d["hex"]};color:{fg}{border}">{NAMES[key]}</div>'
            f'<p class="note">{ROLE[key]}</p><dl>{rows}</dl></div>')


def ramp():
    out = ''
    for step, hexv in T.NEUTRAL.items():
        cw = contrast(hexv, W)
        fg = INK if cw < 4.5 else '#fff'
        border = 'box-shadow:inset 0 0 0 1px var(--c-rule);' if step == '0' else ''
        out += f'<div style="background:{hexv};color:{fg};{border}"><b>{step}</b><span>{hexv}</span><span>{cw:.2f}</span></div>'
    return f'<div class="ramp">{out}</div><p class="note">Under each step: its HEX and its contrast against white. Lavender (100) and ink (950) are the client’s; the ten steps between are spaced evenly in OKLCH lightness.</p>'


def semantic():
    use = {
        'ground': 'Page', 'ground-quiet': 'Quiet panels', 'fill': 'Selected rows, wells', 'rule': 'Hairlines',
        'rule-strong': 'Input borders (3:1)', 'text': 'Text', 'text-2': 'Secondary text', 'text-3': 'Faintest text allowed',
        'machine': 'Runs, pauses', 'person': 'By hand, waiting, primary action', 'alert': 'Failed, late', 'test': 'Test runs',
    }
    rows = ''
    for k, u in use.items():
        a, b = T.SEMANTIC_LIGHT[k], T.SEMANTIC_DARK[k]
        rows += (f'<tr><td><code>--c-{k}</code></td><td>{u}</td>'
                 f'<td><span class="dot" style="background:{a}"></span><code>{a}</code></td>'
                 f'<td><span class="dot" style="background:{b}"></span><code>{b}</code></td></tr>')
    return f'<div class="tbl-wrap"><table><thead><tr><th>Token</th><th>Use</th><th>Light</th><th>Dark</th></tr></thead><tbody>{rows}</tbody></table></div>'


def matrix():
    grounds = ['white', 'n50', 'lavender', 'ink', 'n900']
    head_ = ''.join(f'<th class="num">{g}</th>' for g in grounds)
    body = ''
    for row in T.matrix():
        t = row[0]['text']
        cells = ''.join(
            f'<td class="num {"pass" if c["grade"] in ("AA", "AAA") else "fail" if c["grade"] == "Fail" else ""}">{c["ratio"]:.2f} · {c["grade"]}</td>'
            for c in row)
        body += f'<tr><th scope="row"><span class="dot" style="background:{T.SWATCH[t]}"></span>{t}</th>{cells}</tr>'
    return (f'<div class="tbl-wrap"><table><thead><tr><th>Text \\ ground</th>{head_}</tr></thead><tbody>{body}</tbody></table></div>'
            '<p class="note">AA: 4.5:1, any text. Large: 3:1, text from 24 px (19 px bold) and graphics. A pair marked Fail is never used for text or for a meaningful graphic.</p>')


def chart():
    """Sample data, labelled as such: runs per day, ink for worked, alert for failed; people’s tasks in violet."""
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    ok = [14, 18, 11, 21, 17, 6, 3]
    bad = [0, 1, 0, 2, 0, 0, 0]
    ppl = [9, 12, 8, 13, 11, 4, 1]
    Wd, Hd, top = 640, 240, 24
    bw, gap = 28, 8
    step = (Wd - 40) / 7
    mx = 24
    g = ''
    for i in range(7):
        x = 40 + i * step + (step - (2 * bw + gap)) / 2
        h1 = ok[i] / mx * (Hd - top - 30)
        h2 = bad[i] / mx * (Hd - top - 30)
        h3 = ppl[i] / mx * (Hd - top - 30)
        base = Hd - 30
        g += f'<rect x="{x:.1f}" y="{base - h1:.1f}" width="{bw}" height="{h1:.1f}" rx="3" fill="{INK}"/>'
        if h2:
            g += f'<rect x="{x:.1f}" y="{base - h1 - h2 - 2:.1f}" width="{bw}" height="{h2:.1f}" rx="3" fill="{T.RED}"/>'
        g += f'<rect x="{x + bw + gap:.1f}" y="{base - h3:.1f}" width="{bw}" height="{h3:.1f}" rx="3" fill="{T.BRAND["violet"]}"/>'
        g += f'<text x="{x + bw + gap / 2:.1f}" y="{Hd - 8}" text-anchor="middle" font-size="13" fill="{T.NEUTRAL["700"]}">{days[i]}</text>'
    for v in (0, 8, 16, 24):
        y = Hd - 30 - v / mx * (Hd - top - 30)
        g += f'<line x1="36" x2="{Wd}" y1="{y:.1f}" y2="{y:.1f}" stroke="{T.NEUTRAL["200"]}"/><text x="28" y="{y + 4:.1f}" text-anchor="end" font-size="12" fill="{T.NEUTRAL["700"]}">{v}</text>'
    return (f'<svg viewBox="0 0 {Wd} {Hd}" role="img" aria-label="Sample chart: steps that ran, failed, and tasks people did, per day">'
            f'<g font-family="Atkinson Hyperlegible Next">{g}</g></svg>'
            '<div class="row" style="gap:var(--s-6)"><span class="lg"><i style="background:var(--iqaa-ink)"></i>Steps that ran</span>'
            '<span class="lg"><i style="background:var(--iqaa-red)"></i>Failed</span><span class="lg"><i style="background:var(--iqaa-violet)"></i>Tasks people did</span></div>'
            '<p class="note">Sample data. Charts keep the grammar: series about steps that run by themselves are ink (tints n700, n500 for more series); series about people are violet; failures are the alert colour, stacked on top where they can be seen.</p>')


def colour():
    sw = ''.join(swatch(k) for k in ('ink', 'violet', 'lilac', 'lavender'))
    alert = f'''<div class="g2">
<div class="sw"><div class="chip" style="background:{T.RED};color:#fff">Alert</div><p class="note">Failed and late, on light grounds. OKLCH {T.describe(T.RED)['oklch']}: violet’s lightness and chroma at hue 25.</p><dl><dt>HEX</dt><dd>{T.RED}</dd><dt>On white</dt><dd>{contrast(T.RED, W):.2f}:1</dd><dt>CMYK</dt><dd>{T.describe(T.RED)['cmyk']}</dd></dl></div>
<div class="sw"><div class="chip" style="background:{T.RED_DARK};color:{INK}">Alert on ink</div><p class="note">The same hue at lilac’s lightness and chroma.</p><dl><dt>HEX</dt><dd>{T.RED_DARK}</dd><dt>On ink</dt><dd>{contrast(T.RED_DARK, INK):.2f}:1</dd></dl></div>
</div>'''
    prop = f'''<div class="prop"><div style="flex:80;background:#fff"></div><div style="flex:6;background:{T.NEUTRAL['100']}"></div><div style="flex:11;background:{INK}"></div><div style="flex:3;background:{T.BRAND['violet']}"></div></div>
<div class="row" style="gap:var(--s-6)"><span class="lg"><i style="background:#fff;box-shadow:inset 0 0 0 1px var(--c-rule)"></i>Ground ~80%</span><span class="lg"><i style="background:{T.NEUTRAL['100']}"></i>Lavender ~6%</span><span class="lg"><i style="background:{INK}"></i>Ink ~11%</span><span class="lg"><i style="background:{T.BRAND['violet']}"></i>Violet ≤ 3%</span></div>
<p class="note">Not a quota, a consequence of the rules: violet marks only what people did or must do, and one primary action. If violet passes a few percent of a surface, something that is not a person has been coloured.</p>'''
    return (head('Colour', 'Ink for machines, violet for people', 'Four colours from the client’s deck, a neutral ramp computed between two of them, and one alert colour drawn at violet’s own strength. Nothing else.')
            + sec('Brand', 'The client’s four colours', f'<div class="g4">{sw}</div><p class="note">CMYK values are a naive conversion for a first proof. Before printing, match on coated stock and record the printer’s values here.</p>')
            + sec('Neutrals', 'A ramp from lavender to ink', ramp())
            + sec('Alert', 'One colour for what needs attention now', alert)
            + sec('Semantic', 'Tokens for light and dark', semantic())
            + sec('Contrast', 'Every pair, measured', matrix())
            + sec('Proportion', 'How much of each', prop)
            + sec('Charts', 'Data keeps the grammar', f'<div class="spec white">{chart()}</div>')
            + '</div>')


def type_():
    sc = ''
    for name, v in T.type_scale().items():
        sample = 'Ready for Salma.' if v['size'] <= 31 else 'Work, in time.'
        sc += (f'<tr><td><code>--t-{name}</code></td><td class="num">{v["size"]}</td><td class="num">{v["line"]}</td><td class="num">{v["track_em"]}</td>'
               f'<td><span style="font-size:{min(v["size"], 61)}px;line-height:1.1;letter-spacing:{v["track_em"]}em;font-weight:{600 if v["size"] >= 31 else 400};white-space:nowrap">{sample}</span></td></tr>')
    rules = [
        ('Times', '<code>09:40</code> · 24-hour, always two digits for the hour in tables', 'Times are what the product says most often; a fixed width keeps columns straight.'),
        ('Dates', 'Thu 5 Nov · Thu 5 Nov 2026 when the year matters', 'Day first, short month, no ordinal.'),
        ('Ranges', '09:00–13:00 · 5–7 Nov', 'En dash, no spaces.'),
        ('Job codes', '<code>SFR-26-0031</code>', 'Fragment Mono, slashed zero. Organization prefix, year, number.'),
        ('Counts', '3 of 7', 'Words, not a slash: “3/7” reads as a date.'),
        ('People', 'Salma · Prepare', 'The name before the role or the station.'),
        ('Money', '[PRICE]', 'No price is printed anywhere until pricing exists.'),
    ]
    rr = ''.join(f'<tr><th scope="row">{a}</th><td>{b}</td><td>{c}</td></tr>' for a, b, c in rules)
    voice = ''.join(f'<p class="voice">{t}</p>' for t in (
        'Ready for Salma.', 'Waiting for the supplier. Reminder at 09:00.',
        'Draft from Watar. Nothing is sent until you approve.', 'Test run. Nothing was sent.',
        'Maha approved the quote at 10:12.'))
    spec = f'''<div class="g2">
<div class="spec white"><p class="specimen" style="font-size:120px;line-height:1;font-weight:600;letter-spacing:-0.02em">Iqaa</p>
<p style="font-size:25px;line-height:36px">ABCDEFGHIJKLM<wbr>NOPQRSTUVWXYZ<br>abcdefghijklm<wbr>nopqrstuvwxyz<br>0123456789 · Il1| · O0</p>
<p class="note">Atkinson Hyperlegible Next · 300 to 800 · Braille Institute, OFL</p></div>
<div class="spec white"><p style="font-family:'Fragment Mono';font-size:49px;line-height:56px;font-feature-settings:'zero' 1">SFR-26-0031</p>
<p style="font-family:'Fragment Mono';font-size:16px;line-height:24px;font-feature-settings:'zero' 1">09:40 · 3 of 7 · 0123456789<br>POST /hooks/sufra 200 · 412 ms</p>
<p style="font-size:16px;line-height:24px">Code inside a sentence: job <code>SFR-26-0031</code> is ready for Salma.</p>
<p class="note">Fragment Mono · times, codes, run logs only</p></div>
</div>'''
    tr = '''<div class="spec white"><p style="font-size:25px;line-height:36px">Sipariş hazır · İş akışı · Değişiklik · Gönder · Çalıştır · Güncelle</p>
<p style="font-size:16px;line-height:24px">Salma için hazır. Taslak Watar’dan: siz onaylayana kadar hiçbir şey gönderilmez.</p>
<p class="note">Turkish is set from the same files: dotted and dotless I, Ş, Ğ, Ç, Ö, Ü.</p></div>'''
    ar = '''<div class="prose"><p>Arabic is not set in this round. When it is, the partner is chosen the way Atkinson was: on real product text, side by side, measured.</p>
<ul><li>Shortlist: Alexandria, Readex Pro, Vazirmatn, Rubik, Noto Sans Arabic.</li>
<li>Excluded: IBM Plex Sans Arabic, Cairo, Noto Kufi Arabic (used by a competitor), Tajawal.</li>
<li>It must match Atkinson’s weight at 16 px and hold tabular figures for times and codes.</li>
<li>Display line-height at least 1.4; no tashkeel in interface text; letter-spacing never applied to Arabic.</li></ul></div>'''
    return (head('Type', 'One family, measured into place', 'Atkinson Hyperlegible Next was designed so that letters cannot be mistaken for one another — the job of a product that speaks in names, times and codes. It was chosen by measurement, not by look.')
            + sec('Faces', 'Atkinson Hyperlegible Next and Fragment Mono', spec)
            + sec('Choice', 'The measurement that chose them', font_table())
            + sec('Scale', 'Ratio 1.25 from a 16 px beat', f'<div class="tbl-wrap"><table><thead><tr><th>Token</th><th class="num">Size</th><th class="num">Line</th><th class="num">Tracking</th><th>Sample</th></tr></thead><tbody>{sc}</tbody></table></div><p class="note">Line heights are rounded up to the 4 px quarter beat. Tabular figures are on by default everywhere.</p>')
            + sec('Setting', 'Times, dates, codes, counts', f'<div class="tbl-wrap"><table><thead><tr><th>What</th><th>Set as</th><th>Why</th></tr></thead><tbody>{rr}</tbody></table></div>')
            + sec('Voice', 'Present tense, names first', f'<div class="spec white">{voice}</div><p class="note">Never: magic, seamless, supercharge, effortless, unleash, revolutionize, next-gen.</p>')
            + sec('Turkish', 'The same files, checked', tr)
            + sec('Arabic', 'Reserved, with its rules', ar)
            + '</div>')


ICONS = {
    'Overview': '<path d="M6 12h4M14 12h4"/><circle cx="4" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="20" cy="12" r="2"/>',
    'Today': '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M8.5 3v4M15.5 3v4"/><circle cx="12" cy="15" r="1.5"/>',
    'Line': '<path d="M2 16h3c.6-4 5.4-4 6 0c2.5 0 4.5-2 4.5-4.5 0-2-1.5-3-2.5-3-1.5 0-2.3 1.3-2 3 .5 3 2.5 4.5 6 4.5h4"/>',
    'Orders': '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M9 9h6M9 13h6M9 17h3"/>',
    'Clients': '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.7 3.6-5.5 7-5.5s6.2 1.8 7 5.5"/>',
    'Settings': '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    'Ask Watar': '<path d="M3 17h3c1.2-7.5 10.8-7.5 12 0h3"/>',
    'Send': '<path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M9 11h6M13 9l2 2-2 2"/>',
    'Wait': '<path d="M3 13h5M16 13h5"/><circle cx="12" cy="13" r="1.6" fill="currentColor" stroke="none"/>',
    'Remind': '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    'Condition': '<path d="M3 8h18M8 8l6 6.5c.6.6 1.3.9 2.1.9H21"/>',
    'Create': '<path d="M12 4v9M7.5 8.5h9M3 18h18"/>',
    'Move job': '<path d="M4 12h11M11 8l4 4-4 4M20 5v14"/>',
    'Task': '<path d="M3 17h4c3.5 0 6.3-2.8 6.3-6.3 0-2.8-2.1-4.2-3.5-4.2-2.1 0-3.2 1.8-2.8 4.2.7 4.2 3.5 6.3 8.4 6.3H21"/>',
    'Webhook': '<path d="M12 3.5v10M8.5 10l3.5 3.5 3.5-3.5M3 18.5h18"/>',
    'HTTP': '<circle cx="12" cy="12" r="8"/><ellipse cx="12" cy="12" rx="3.5" ry="8"/><path d="M4 12h16"/>',
    'Handoff': '<path d="M7.5 12h9"/><circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="12" r="2.5"/>',
    'Undo': '<path d="M9 6.5L5 10.5l4 4M5 10.5h9.5a4.5 4.5 0 0 1 0 9H12"/>',
    'Lock': '<rect x="5" y="10.5" width="14" height="10" rx="3"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    'Draft': '<path d="M5 19l1-4L16 5l3 3L9 18z"/><path d="M14 7l3 3"/>',
    'Publish': '<path d="M12 16V5M7.5 9.5L12 5l4.5 4.5M5 19.5h14"/>',
    'Test run': '<path d="M9.5 3.5h5M10.5 3.5v5.5l-5 8.6a1.9 1.9 0 0 0 1.6 2.9h9.8a1.9 1.9 0 0 0 1.6-2.9l-5-8.6V3.5M7.6 15h8.8"/>',
    'Retry': '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4v4.5H15"/>',
    'Run log': '<path d="M9 6h11M9 12h11M9 18h11M4 6h1.5M4 12h1.5M4 18h1.5"/>',
    'Late': '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
}
GROUPS = [
    ('Navigation', ['Overview', 'Today', 'Line', 'Orders', 'Clients', 'Settings', 'Ask Watar']),
    ('Steps', ['Send', 'Wait', 'Remind', 'Condition', 'Create', 'Move job', 'Task', 'Webhook', 'HTTP']),
    ('Actions and states', ['Handoff', 'Undo', 'Lock', 'Draft', 'Publish', 'Test run', 'Retry', 'Run log', 'Late']),
]


def icon(name, size=24, stroke=None):
    s = stroke or 1.5
    return (f'<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="{s}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[name]}</svg>')


def icons():
    out = ''
    for g, names in GROUPS:
        cells = ''.join(f'<div class="ic"><div class="ic-big">{icon(n, 48)}</div><div class="row mid" style="gap:var(--s-3)">{icon(n, 24)}{icon(n, 20)}</div><span>{n}</span></div>' for n in names)
        out += sec(g, g, f'<div class="icons">{cells}</div>')
    grid = '''<div class="g2"><div class="spec white center"><svg viewBox="0 0 24 24" width="240" height="240" aria-hidden="true">
<rect x="0" y="0" width="24" height="24" fill="#F5F4FA"/><rect x="2" y="2" width="20" height="20" fill="none" stroke="#D0CDDB" stroke-width=".1"/>
<g stroke="#ECE9F5" stroke-width=".05">''' + ''.join(f'<path d="M{i} 0v24M0 {i}h24"/>' for i in range(1, 24)) + f'''</g>
<g fill="none" stroke="{INK}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">{ICONS['Line']}</g></svg></div>
<dl class="kv"><dt>Grid</dt><dd>24 px, 2 px margin: the live area is 20 px.</dd>
<dt>Stroke</dt><dd>1.5 px: the stem of Atkinson Regular at 16 px ({T.stem_em() * 16:.2f} px), rounded to a quarter pixel. An icon is as heavy as the label beside it.</dd>
<dt>Ends and joins</dt><dd>Round. Corners 2–3 px; curves as round as the pen’s.</dd>
<dt>Sizes</dt><dd>24 in navigation, 20 beside 14–16 px text. Never filled; the one dot is the pause, as in a line.</dd>
<dt>Never</dt><dd>Gears, plugs, lightning, nodes and wires, sparkles. Settings is sliders; Watar is its waiting arch; a station is a ring only on the map, as in the Line screen.</dd></dl></div>'''
    return (head('Icons', 'Steps, stations and actions', 'One stroke family on a 24 px grid, as heavy as the text it sits beside. The step icons draw the line’s own strokes: a loop is a task for a person, an arch waits, a lifted pen is a pause.')
            + sec('Construction', 'Grid and stroke', grid)
            + out + '</div>')
