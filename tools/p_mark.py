"""The mark page and the signature page, for the signature grammar."""
import brand
import tokens as T
from shell import LINES, esc, head, inline, kinds_of, legend, sec, sigline

f = brand.f
MW, LOOP_H, STEP = brand.MW, brand.LOOP_H, brand.STEP


def construction():
    """The mark at 6 px a unit, over a grid of quarter steps, with its measures marked."""
    k, pad = 6, 8
    _, w = brand.symbol_body()
    x0, x1 = -pad, w + pad
    y0, y1 = -(LOOP_H + pad), pad
    W, H = (x1 - x0) * k, (y1 - y0) * k
    grid = ''
    for gx in range(-6, int(w) + 7, 6):
        strong = gx % STEP == 0
        grid += f'<line x1="{f((gx - x0) * k)}" y1="0" x2="{f((gx - x0) * k)}" y2="{f(H)}" stroke="{T.NEUTRAL["400" if strong else "200"]}" stroke-width="1"/>'
    for gy in range(-36, 7, 6):
        strong = gy in (0, -LOOP_H)
        grid += f'<line x1="0" y1="{f((gy - y0) * k)}" x2="{f(W)}" y2="{f((gy - y0) * k)}" stroke="{T.NEUTRAL["400" if strong else "200"]}" stroke-width="1"/>'
    body, _ = brand.symbol_body('light', k)
    return (f'<svg viewBox="0 0 {f(W)} {f(H)}" role="img" aria-label="The mark on its grid: one step is 24 units, the loop rises 30">'
            f'<rect width="{f(W)}" height="{f(H)}" fill="#fff"/>{grid}<g transform="translate({f(-x0 * k)} {f(-y0 * k)})">{body}</g></svg>')


RULES = [
    ('One step', '24 units. The mark is three steps of Iqaa’s own line: a run, a loop, a rising finish.'),
    ('The pen', f'{brand.MW} units in the mark, {brand.W} in a line. The mark’s pen is heavier so it holds at 16 px.'),
    ('The loop', f'Rises {LOOP_H} units, a step and a quarter. In the lockup it stands exactly as tall as the capitals.'),
    ('The finish', 'Leaves the loop and rises 16 units over 18: the line goes on, in time.'),
    ('Colour', 'Ink for the strokes that run by themselves; violet for the loop, the person.'),
    ('Clear space', 'One step all round. Nothing enters it.'),
]


def stacked_svg(pal='light'):
    d, ww, lsb, _ = brand.wordmark_paths()
    body, sw = brand.symbol_body(pal)
    word_w = ww - lsb
    total = max(sw, word_w)
    depth = brand.depth_units()
    sx = (total - sw) / 2
    # the word's cap line sits one handoff under the pen: the gap the line leaves between two stations
    wy = MW / 2 + brand.HANDOFF
    fill = T.BRAND['ink'] if pal == 'light' else '#fff'
    top = -(LOOP_H + MW)
    H = wy + LOOP_H + depth + MW - top
    return (f'<svg viewBox="{f(-MW)} {f(top)} {f(total + 2 * MW)} {f(H)}" role="img" aria-label="Iqaa, stacked lockup">'
            f'<g transform="translate({f(sx)} 0)">{body}</g>'
            f'<path fill="{fill}" transform="translate({f((total - word_w) / 2 - lsb)} {f(wy + LOOP_H)})" d="{d}"/></svg>')


def wordmark_guides():
    d, ww, lsb, wght = brand.wordmark_paths()
    fnt = brand._font_at(wght)
    cap, xh = fnt['OS/2'].sCapHeight, fnt['OS/2'].sxHeight
    scale = LOOP_H / cap
    depth = brand.depth_units()
    k, pad = 9, 4
    W = ww - lsb + 2 * pad + 12
    top = -LOOP_H - pad
    H = LOOP_H + depth + 2 * pad
    lines = ''
    for y, label in ((-LOOP_H, 'cap height'), (-xh * scale, 'x-height'), (0, 'baseline'), (depth, 'q tail')):
        yy = (y - top) * k
        lines += (f'<line x1="0" x2="{f((W - 12) * k)}" y1="{f(yy)}" y2="{f(yy)}" stroke="{T.NEUTRAL["300"]}" stroke-width="1"/>'
                  f'<text x="{f((W - 12) * k + 8)}" y="{f(yy + 5)}" font-size="15" fill="{T.NEUTRAL["700"]}" font-family="Atkinson Hyperlegible Next">{label}</text>')
    return (f'<svg viewBox="0 0 {f(W * k)} {f(H * k)}" role="img" aria-label="The wordmark on its guides">'
            f'{lines}<path fill="{T.BRAND["ink"]}" transform="translate({f((pad - lsb) * k)} {f(-top * k)}) scale({k})" d="{d}"/></svg>')


MISUSE = [
    ('Stretched', 'stretch'),
    ('Automation in violet', 'recolour'),
    ('Gradient', 'gradient'),
    ('A hairline pen', 'thin'),
    ('Rotated', 'rotate'),
    ('Loop turned the wrong way', 'mirror'),
    ('On a busy ground', 'busy'),
    ('Sparkles added', 'sparkle'),
]


def misuse_svg(kind):
    p = dict(brand.PAL['light'])
    defs, extra, sw, tf = '', '', None, ''
    if kind == 'recolour':
        p['run'] = T.BRAND['violet']
    if kind == 'gradient':
        defs = '<defs><linearGradient id="gx" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7C3CF0"/><stop offset="1" stop-color="#C9A4FF"/></linearGradient></defs>'
        p = {'run': 'url(#gx)', 'person': 'url(#gx)', 'alert': '', 'test': ''}
    if kind == 'thin':
        sw = 1.2
    if kind == 'mirror':
        tf = ' transform="translate(66 0) scale(-1 1)"'
    if kind == 'sparkle':
        extra = f'<path fill="{T.BRAND["violet"]}" d="M62 -30l1.6 4.6 4.6 1.6-4.6 1.6-1.6 4.6-1.6-4.6-4.6-1.6 4.6-1.6z"/>'
    body = ''
    x = 0.0
    for kd in brand.SYMBOL:
        body += brand.cell(kd, x, 0, p, 1, sw=sw or MW)
        x += brand.WIDTH[kd]
    return f'<svg viewBox="-8 -40 82 48" aria-hidden="true">{defs}<g{tf}>{body}</g>{extra}</svg>'


def mark():
    rules = ''.join(f'<dt>{a}</dt><dd>{b}</dd>' for a, b in RULES)
    lockups = f'''<div class="g2">
<div><div class="spec white center" style="min-height:240px"><div style="width:280px">{inline(brand.lockup_svg('light'))}</div></div><p class="fcap"><b>Horizontal · primary</b><span>The mark runs into the name</span></p></div>
<div><div class="spec white center" style="min-height:240px"><div style="width:170px">{stacked_svg()}</div></div><p class="fcap"><b>Stacked</b><span>For square spaces only</span></p></div>
<div><div class="spec white center" style="min-height:200px"><div style="width:110px">{inline(brand.symbol_svg('light'))}</div></div><p class="fcap"><b>Mark</b><span>Where the name is already present</span></p></div>
<div><div class="spec white center" style="min-height:200px"><div style="width:180px">{inline(brand.wordmark_svg())}</div></div><p class="fcap"><b>Wordmark</b><span>Running headers, documents</span></p></div>
</div>'''
    lock_h = 64
    unit_px = lock_h / (LOOP_H + MW + brand.depth_units() + 1)
    clear = f'''<div class="spec white center"><div class="clear" style="padding:{f(STEP * unit_px)}px">{inline(brand.lockup_svg('light')).replace('<svg ', f'<svg height="{lock_h}" ', 1)}</div></div>
<p class="note">The dashed field is one step on every side, measured from the mark at the size it is used. Nothing enters it: not a headline, not an edge, not another logo.</p>'''
    sizes = ''
    for hgt in (16, 20, 24, 32, 48):
        sizes += f'<div class="cap"><div style="height:{hgt}px">{inline(brand.lockup_svg("light")).replace("<svg ", f"<svg height=\"{hgt}\" ", 1)}</div><span>{hgt} px{" · too small" if hgt < 20 else ""}</span></div>'
    syms = ''.join(f'<div class="cap"><img src="assets/brand/iqaa-symbol.svg" width="{px}" alt=""><span>{px} px</span></div>' for px in (20, 24, 32, 48))
    versions = f'''<div class="g3">
<div><div class="spec white center" style="min-height:180px"><div style="width:240px">{inline(brand.lockup_svg('light'))}</div></div><p class="fcap"><b>Full colour on white</b><span>Default</span></p></div>
<div><div class="spec lav center" style="min-height:180px"><div style="width:240px">{inline(brand.lockup_svg('light'))}</div></div><p class="fcap"><b>On lavender</b><span>Violet 4.12:1, graphics only</span></p></div>
<div><div class="spec ink center" style="min-height:180px"><div style="width:240px">{inline(brand.lockup_svg('dark'))}</div></div><p class="fcap"><b>On ink</b><span>Lilac takes violet’s role</span></p></div>
<div><div class="spec white center" style="min-height:180px"><div style="width:240px">{inline(brand.lockup_svg('ink'))}</div></div><p class="fcap"><b>One colour, ink</b><span>Fax, stamps, one-colour print</span></p></div>
<div><div class="spec ink center" style="min-height:180px"><div style="width:240px">{inline(brand.lockup_svg('white'))}</div></div><p class="fcap"><b>One colour, white</b><span>Etching, single-colour reverse</span></p></div>
<div><div class="spec white center" style="min-height:180px;filter:grayscale(1)"><div style="width:240px">{inline(brand.lockup_svg('light'))}</div></div><p class="fcap"><b>Greyscale check</b><span>The loop still reads as the hand</span></p></div>
</div>'''
    icons = '''<div class="row" style="gap:var(--s-12)">
<div class="cap"><img src="assets/brand/iqaa-app-icon.svg" width="180" height="180" alt="Iqaa app icon"><span>Master, 1024 · shown at 180</span></div>
<div class="cap"><img src="assets/brand/iqaa-app-icon-180.svg" width="60" height="60" alt=""><span>60</span></div>
<div class="cap"><img src="assets/brand/iqaa-favicon-32.svg" width="32" height="32" alt=""><span>32</span></div>
<div class="cap"><img src="assets/brand/iqaa-favicon-16.svg" width="16" height="16" alt=""><span>16</span></div>
</div>
<div class="row" style="gap:var(--s-8)">
<div class="cap"><img class="px" src="assets/brand/iqaa-favicon-16.svg" width="160" height="160" alt="The 16 pixel icon, enlarged"><span>16 px, ×10: the pen is drawn heavier so it stays 1.6 px wide</span></div>
<div class="cap"><img class="px" src="assets/brand/iqaa-favicon-32.svg" width="160" height="160" alt="The 32 pixel icon, enlarged"><span>32 px, ×5</span></div>
</div>
<div class="g2">
<div class="spec tight" style="background:#DEE1E6"><div class="tab"><img src="assets/brand/iqaa-favicon-16.svg" width="16" height="16" alt=""><span>Sufra · Today</span></div><p class="note">Light browser tab</p></div>
<div class="spec tight" style="background:#202124;color:#E8EAED"><div class="tab dark"><img src="assets/brand/iqaa-favicon-16.svg" width="16" height="16" alt=""><span>Sufra · Today</span></div><p class="note" style="color:#BDC1C6">Dark browser tab</p></div>
</div>
<p class="note">The tile is ink with a corner of 22.4%, the curve iOS and macOS apply, so the icon looks the same before and after the system masks it. The mark takes 62% of the tile’s width, inside Android’s adaptive safe circle.</p>'''
    misuse = ''.join(
        f'<div class="dont"><div class="spec white center" style="min-height:160px{";background:repeating-linear-gradient(45deg,#ECE9F5 0 6px,#D0CDDB 6px 12px)" if k == "busy" else ""}">'
        f'<div style="width:110px;{"transform:scaleX(1.5)" if k == "stretch" else "transform:rotate(-18deg)" if k == "rotate" else ""}">{misuse_svg(k)}</div></div>'
        f'<p class="fcap"><b>{n}</b></p><span class="x">Don’t</span></div>'
        for n, k in MISUSE)
    wght = brand.wordmark_weight()
    return (head('Mark', 'A line that signs its own name', 'Iqaa’s mark is three steps of its own line, drawn with one pen: it arrives straight, a hand loops it once, and it leaves rising. Every organization’s line is written with the same pen.')
            + sec('Construction', 'Everything is a measure of one step', f'<div class="g2"><div class="spec white center">{construction()}</div><dl class="kv">{rules}</dl></div>')
            + sec('Wordmark', 'Iqaa, written with the mark’s pen', f'<div class="spec white wm-guides">{wordmark_guides()}</div><p>Atkinson Hyperlegible Next at weight {wght}, outlined so it never depends on an installed font. In the lockup the mark sits on the word’s baseline and its loop rises exactly to the cap height; at that size the letters’ stem equals the mark’s pen, so the name and the stroke are written with one hand. The serifed I keeps the name from reading lqaa.</p>')
            + sec('Lockups', 'Four arrangements, no others', lockups)
            + sec('Clear space', 'One step of room all round', clear)
            + sec('Sizes', 'Smallest sizes', f'<div class="row">{sizes}</div><div class="row">{syms}</div><p class="note">The lockup: 20 px tall on screen, 6 mm in print. Below that, use the mark alone, or the app icon at 16 px.</p>')
            + sec('Versions', 'Grounds and one-colour', versions)
            + sec('App icon', 'Tile, favicon and tab', icons)
            + sec('Misuse', 'Eight ways to break it', f'<div class="g4 keep2">{misuse}</div>')
            + '</div>')


def templates():
    out = ''
    for key in ('catering', 'software', 'video'):
        L = LINES[key]
        kinds = kinds_of(key)
        steps = ''.join(
            f'<li><b>{esc(b["name"])}</b> — ' + ', '.join(f'{esc(s[1])} <span class="k">({s[0]})</span>' for s in b['steps']) + '</li>'
            for b in L['blocks'])
        out += f'''<div class="sigrow">
<div class="meta"><b>{esc(L["template"])} · {esc(L["org"])}</b><span>{len(L["blocks"])} stations · {len(kinds)} steps · {sum(1 for k in kinds if k in ("struck", "held"))} for people</span></div>
{sigline(key)}
<div class="row mid" style="gap:var(--s-6)">
<div class="cap">{brand.avatar_svg([[s[0] for s in b["steps"]] for b in L["blocks"]], 64, L["org"] + " mark", name=L["org"])}<span>Its mark, 64 px</span></div>
<div class="cap">{brand.avatar_svg([[s[0] for s in b["steps"]] for b in L["blocks"]], 32, L["org"] + " mark, small", name=L["org"])}<span>32 px</span></div>
<div class="cap"><div class="spec white tight">{sigline(key, test=True, labels=False)}</div><span>The same line in a test run</span></div>
</div>
<details class="steps"><summary>Steps in this line</summary><ol>{steps}</ol></details>
</div>'''
    return out


def hand_sheet():
    """Every capital and figure of Iqaa's hand, on the loop's height, with the mark's pen."""
    cells = ''
    for ch, v in brand.hand().items():
        pad = 6
        x, w = v['x0'] - pad, v['x1'] - v['x0'] + 2 * pad
        strokes = ''.join(f'<path d="{d}"/>' for d in v['d'])
        cells += (f'<figure><svg viewBox="{f(x)} -36 {f(w)} 42" height="64" aria-hidden="true">'
                  f'<path class="gd" d="M{f(x)} 0H{f(x + w)}M{f(x)} -30H{f(x + w)}"/>'
                  f'<g fill="none" stroke="currentColor" stroke-width="{MW}" stroke-linecap="round" stroke-linejoin="round">{strokes}</g></svg>'
                  f'<figcaption>{esc(ch)}</figcaption></figure>')
    return (f'<div class="spec white"><div class="hand" role="img" aria-label="Iqaa’s hand: the capitals A to Z and the figures 0 to 9, each a single stroke">{cells}</div></div>'
            f'<p class="note">Single strokes on the loop’s height, 30 units, with the mark’s pen of {MW}: the same weight as Iqaa’s own mark, {MW / LOOP_H:.3f} of the height. '
            'Round letters overshoot the cap height and the baseline by half a unit. A letter is centred halfway between its box and the centre of its ink, so an L or a P does not look pushed aside. '
            'A name that starts in a script the hand does not write yet is set in type, in the colour of the line’s first step.</p>')


def share_said(kinds):
    who = {'a person' if k in ('struck', 'held') else 'itself' for k in kinds}
    if len(who) == 1:
        return 'Every step is a person’s, so the whole letter is lilac.' if who == {'a person'} else 'Every step runs by itself, so the whole letter is white.'
    return f'Each step takes {"half" if len(kinds) == 2 else "a third"} of the letter, in order.'


def org_marks():
    """How three lines write their initials: the opening beside the mark it makes."""
    rows = ''
    for key in ('catering', 'software', 'video'):
        L = LINES[key]
        blocks = [[s[0] for s in b['steps']] for b in L['blocks']]
        opening = brand.lead(blocks)
        names = [s[1] for b in L['blocks'][:len(opening)] for s in b['steps'][:3]][:sum(len(b) for b in opening)]
        kinds = [k for b in opening for k in b]
        said = ' → '.join(f'{esc(n)} <span class="k">({"a person" if k in ("struck", "held") else "runs by itself"})</span>' for n, k in zip(names, kinds))
        share = len(kinds)
        rows += (f'<div class="om-row"><div class="row mid" style="gap:var(--s-4)">{brand.avatar_svg(blocks, 96, L["org"] + " mark", name=L["org"])}'
                 f'{brand.avatar_svg(blocks, 40, "", name=L["org"])}{brand.avatar_svg(blocks, 20, "", name=L["org"])}</div>'
                 f'<div class="cap"><b>{esc(L["org"])} · {esc(L["template"])}</b><span>Opens with {said}. '
                 f'{share_said(kinds)}</span>'
                 f'<div class="spec white tight">{brand.line_svg(opening, k=1.2)}</div></div></div>')
    return f'<div class="om-rows">{rows}</div>'


def grammar_sheet():
    kinds = [('run', 'Runs'), ('held', 'Waits'), ('struck', 'By hand'), ('rest', 'Pause'), ('failed', 'Fails'), ('test', 'Test')]
    head_ = ''.join(f'<th>{n}</th>' for _, n in kinds)

    def g(kind, size):
        if kind == 'test':
            return brand.line_svg([['run', 'struck', 'held']], k=size / 32, test=True)
        return brand.glyph_svg(kind, 'light', size)
    rows = ''
    for size, label in ((20, '20 px step'), (32, '32 px step'), (56, '56 px step')):
        rows += f'<tr><th scope="row">{label}</th>' + ''.join(f'<td>{g(kd, size)}</td>' for kd, _ in kinds) + '</tr>'
    grey = ''.join(f'<td>{g(kd, 40)}</td>' for kd, _ in kinds)
    rows += f'<tr class="grey"><th scope="row">Greyscale</th>{grey}</tr><tr class="deut"><th scope="row">Deuteranopia</th>{grey}</tr>'
    filt = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="deut"><feColorMatrix type="matrix" '
            'values="0.367 0.861 -0.228 0 0  0.280 0.673 0.047 0 0  -0.012 0.043 0.969 0 0  0 0 0 1 0"/></filter></svg>')
    return (f'{filt}<div class="tbl-wrap"><table class="gram"><thead><tr><th></th>{head_}</tr></thead><tbody>{rows}</tbody></table></div>'
            '<p class="note">Failed and Test belong to the product, never to the mark. A failed step snaps, in the alert colour. In a test, or in a draft Watar has not had approved, nothing is signed yet: the whole line is drawn with a dashed grey pen and nothing turns violet.</p>')


ENCODE = [
    'One step is one stretch of the pen. Its kind sets its shape: a step that runs by itself is a straight stroke; a task for a person is a loop of the hand; an approval, a review or a Watar draft — a step that waits for a person — is an open arch; a timed wait lifts the pen and leaves a dot.',
    'Steps follow the order of the line, on one baseline. Between stations the pen runs half a step of straight: the handoff.',
    'The pen never shrinks to fit: a long line is drawn smaller, never cramped.',
    'An organization without a logo signs with its initial, written in Iqaa’s hand with the mark’s pen, in the order its line opens: each of its first steps (whole stations, up to three) takes an equal share of the letter, lilac where a person does it, white where it runs by itself.',
    'Publishing a new version of a line changes its signature. Jobs already running keep the version — and the signature — they started on.',
    'Arabic: the same strokes, written right to left; the loops turn the other way.',
    'On ink, strokes that run by themselves turn white and a person’s strokes lilac. Nothing else changes.',
]


def signature():
    enc = ''.join(f'<li>{e}</li>' for e in ENCODE)
    gen = '''<div class="gen" data-gen>
<div class="gen-in">
<div class="gen-bar" role="group" aria-label="Start from a template">
<button class="btn small" type="button" data-tpl="catering" aria-pressed="true">Catering</button>
<button class="btn small" type="button" data-tpl="software" aria-pressed="false">Software</button>
<button class="btn small" type="button" data-tpl="video" aria-pressed="false">Video</button>
</div>
<label class="gen-org">Organization <input type="text" value="Sufra" data-org maxlength="28" autocomplete="off"></label>
<ol class="gen-blocks" data-blocks></ol>
<button class="btn small" type="button" data-add-block>Add a station</button>
<p class="note">Press a step to change its kind: runs, held, struck, rest.</p>
</div>
<div class="gen-out">
<div class="spec white"><p class="eyebrow">Signature</p><div class="gen-sig" data-sig></div></div>
<div class="g2">
<div class="spec white"><p class="eyebrow">Client link header</p><div class="client" data-client></div></div>
<div class="spec ink"><p class="eyebrow" style="color:var(--iqaa-n300)">Sign-in, on ink</p><div class="login" data-login></div></div>
</div>
<div class="gen-test">
<button class="btn primary" type="button" data-test>Sign the line again</button>
<p class="note" data-test-note role="status">The pen writes the line at the tempo: a quarter beat a step.</p>
</div>
</div>
</div>'''
    where = '''<div class="g2"><div class="prose"><h3>Where a signature appears</h3><ul>
<li>The organization’s mark, when it has no logo of its own.</li>
<li>The sign-in screen of its subdomain, and the header of the link its clients open.</li>
<li>The cover of its reports and exports.</li>
<li>The template picker, so a kitchen and a studio can be told apart at a glance.</li>
<li>Iqaa’s own marketing, only when it shows a real or demo line.</li></ul></div>
<div class="prose"><h3>Where it never appears</h3><ul>
<li>As a repeating pattern or wallpaper.</li>
<li>Behind text, at any opacity.</li>
<li>Writing itself on a loop. The pen moves only when a line is signed or a job moves.</li>
<li>On anything that is not about a line.</li>
<li>Invented: a signature always comes from an actual line, or a labelled demo.</li></ul></div></div>'''
    return (head('Signature', 'Every line signs its own name', 'The pen that draws Iqaa’s mark writes any line. A kitchen, a software house and a video studio get three different signatures from the same strokes — and each one is the true shape of its work.')
            + sec('Grammar', 'Six states, told apart by the stroke', legend() + grammar_sheet())
            + sec('Rules', 'How a line becomes a signature', f'<ol class="rules">{enc}</ol>')
            + sec('Marks', 'An organization signs with its initial', org_marks(), 'Until an organization adds a logo, its mark is its initial on an ink tile, written with the pen in the order its own line opens. Two kitchens with different first steps get different marks from the same letter.')
            + sec('Hand', 'Iqaa’s hand', hand_sheet())
            + sec('Try it', 'Write a line, see its signature', gen, 'Edit the stations and their steps. The mark, the client header and the sign-in screen follow.')
            + sec('Templates', 'Three lines from the client deck', templates())
            + sec('Use', 'Where signatures go', where)
            + '</div>')
