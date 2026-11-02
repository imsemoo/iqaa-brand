// Turning a step into automation (الأتمتة): a line where steps are turned over to the machine one at a time, on the
// same line, with the same items and the same log; only who does a step changes. The line is drawn in the canvas's
// metro language (lines.js): one ink track, every block an interchange ring with its name over it, a way back as a
// half-weight U-turn under the line. Each block says how it runs, one of the plan's five modes, written in the block's
// own strokes (grammar.js): a person's loop or arch in violet, the machine's straight run in ink, the machine on trial
// beside a person in the dashed grey pen. The selected block's inspector: who does it (a change of the draft), its
// tools, its limits, its numbers so far, who takes the work when the machine fails, and its record, where every
// automated step is made by Automation, never a person. Stopping a block or the whole line works at once, without a
// version; publishing checks the plan's rules first. A line with nothing automated (Masar's feature line, Al-Khatt's
// content line) says so. Data: world.js `newsLine`; under 1024 px the map turns vertical.
(function () {
  const root = document.querySelector('main.au');
  if (!root || !window.FLOW || !window.IQ) return;
  // an owner's screen: it opens as each organization's owner (Khaled, Samir, and any organization world.js adds)
  const OWNERS = Object.fromEntries(Object.values(window.WORLD.orgs).map((o) => [o.id, Object.keys(o.people).find((k) => o.people[k].owner)]));
  const C = window.FRAME = FLOW.context(OWNERS);
  const T = window.T, N = window.I18N.n, esc = FLOW.esc, NO = C.noun, O = C.O, W = window.WORLD;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const icon = (n, s) => IQ.icon(n, s || 20);
  const q = new URLSearchParams(location.search);
  const vertical = matchMedia('(max-width: 1023px)');
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const owner = C.standing === 'owner';
  const NL = O.newsLine;
  // the family's pen (24 grid, 1.5 px, round ends, never filled) for the two marks it does not have: stop and start again
  const pen = (d, s) => `<svg viewBox="0 0 24 24" width="${s || 18}" height="${s || 18}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const STOP = (s) => pen('<circle cx="12" cy="12" r="9"/><rect x="9" y="9" width="6" height="6" rx="1.5"/>', s);
  const START = (s) => pen('<circle cx="12" cy="12" r="9"/><path d="M10.5 9l4.5 3-4.5 3z"/>', s);
  const CHEVRON = pen('<path d="M7 10l5 5 5-5"/>', 16);
  // what this prototype does not do yet: shown, in reach of the keyboard, and said to be coming (as the canvas does)
  const soon = (label, ic) => `<button type="button" class="btn" aria-disabled="true" title="${esc(T('{name}: coming next', { name: label }))}">${ic ? icon(ic, 18) : ''}<span>${esc(label)}</span><em>${T('Soon')}</em></button>`;
  // isolated, so the sum keeps its $ in front inside an Arabic sentence
  const money = (v) => `\u2066$${v > 0 && v < 0.01 ? v.toFixed(3) : (+v || 0).toFixed(2)}\u2069`;
  // a sentence of the draft in the page's language: its data names are English, like everything world.js holds
  const say = (c) => T(c.text, Object.fromEntries(Object.entries(c.vars || {}).map(([k, v]) => [k, T(String(v))])));

  // ---------- the five modes, and how each writes in a block's strokes ----------
  // A person's step is the block's own (a loop for work, an arch for an approval); the machine's is the straight run.
  // Trial: the person's loop, the machine's run beside it in the dashed grey pen of a test. Assisted: the machine
  // prepares, then the person. With review: the machine, then a person's arch. Fully automatic: the run alone.
  const MODES = [
    ['Manual', 'A person does it; the machine stays out.'],
    ['Trial', 'The person works and the machine works beside them, with no effect outside; the two are compared.'],
    ['Assisted', 'The machine prepares; a person edits and hands it over.'],
    ['Automatic with review', 'The machine does it; a person approves or sends it back. The default for anything that goes out.'],
    ['Fully automatic', 'The machine does it; weak cases reach a person. It needs a named person’s recorded acceptance.'],
  ];
  const personStep = (b) => (b.kind === 'approval' ? 'held' : 'struck');
  function stepsOf(b, mode) {
    const p = personStep(b);
    return { Manual: [[p]], Trial: [[p], ['run', true]], Assisted: [['run'], [p]], 'Automatic with review': [['run'], ['held']], 'Fully automatic': [['run']] }[mode] || [[p]];
  }
  // the steps as one stroke, as a block writes them in the line's signature (no hand-off inside a block); mirrored
  // right to left with the page (svg.flow)
  function strokes(list) {
    const M = window.IQAA.mark, w = M.stroke, top = -(M.loop_h + w), bot = 9, pal = window.IQAA.pal.light;
    let x = 0, body = '';
    list.forEach(([k, test]) => { body += IQ.cell(k, x, 0, pal, 1, !!test); x += IQ.WIDTH[k]; });
    return `<svg class="flow" viewBox="${-w} ${top} ${x + 2 * w} ${bot - top}" aria-hidden="true">${body}</svg>`;
  }
  const glyphs = (b, mode) => `<span class="au-g" aria-hidden="true">${strokes(stepsOf(b, mode || b.mode))}</span>`;

  // ---------- the organization's lines: the automated one first, each saying how much of it the machine does ----------
  const lineId = q.get('line');
  const showNews = !!NL && (!lineId || lineId === NL.id || !O.lines.some((l) => l.id === lineId));
  function renderLines(version, machine, cur) {
    const tab = (id, name, sub) => `<a href="${C.href('automate.html', { line: id })}"${id === cur ? ' aria-current="page"' : ''}><b>${esc(T(name))}</b><span>${esc(sub)}</span></a>`;
    $('[data-lines]').innerHTML = (NL ? tab(NL.id, NL.name, `${T('Version {n}', { n: version })} · ${N(machine, '{n} block run by the machine', '{n} blocks run by the machine')}`) : '')
      + O.lines.map((l) => tab(l.id, l.name, T('Nothing automated yet'))).join('');
  }

  // ---------- the draft, what is published, and what is stopped; kept for the visit ----------
  // The line's draft is kept as flow.js keeps the canvas's ('iqaa-draft:<org>:<line>'); a version published this visit
  // folds its changes into the line ('iqaa-published:…'); what is stopped ('iqaa-stop:…') is the line as it runs now,
  // so it never waits for a version.
  const read = (k, d) => { try { return JSON.parse(FLOW.store.get(k) || 'null') || d; } catch (e) { return d; } };
  const write = (k, v) => FLOW.store.set(k, JSON.stringify(v));
  const DKEY = NL && `iqaa-draft:${O.id}:${NL.id}`, PKEY = NL && `iqaa-published:${O.id}:${NL.id}`, SKEY = NL && `iqaa-stop:${O.id}:${NL.id}`;

  if (!showNews) { honest(O.lines.find((l) => l.id === lineId) || C.line); return; }
  const ORDER = NL.blocks.map((b) => b.id);
  const LIMITS = ['cap', 'budget', 'confidence'];
  let pub, version, base, seed, mine, blocks, stops, sel, undo = null;
  // a change's effect on a block: the seed's changes say only their mode; this visit's carry `op`
  function apply(bs, c) {
    const o = c.op || { block: c.block, key: 'mode', value: (c.vars || {}).mode };
    const b = bs[o.block];
    if (!b || o.value === undefined) return;
    if (o.key === 'mode') b.mode = o.value;
    else if (LIMITS.includes(o.key)) b.limits = Object.assign({}, b.limits, { [o.key]: o.value });
    else if (o.key === 'accept') b.accepted = o.value ? { by: o.value, at: o.at } : null;
    else if (o.key === 'fallback') b.fallback = o.value;
    else if (o.key === 'tool') b.tools = b.tools.concat([{ name: o.value, added: true }]);
  }
  function build() {
    pub = read(PKEY, null);
    mine = read(DKEY, []);
    seed = pub ? [] : ((NL.draft || {}).changes || []);
    version = pub ? pub.version : NL.version;
    base = {};
    NL.blocks.forEach((b) => { base[b.id] = Object.assign({ tools: [], limits: {}, roles: [], record: [] }, clone(b)); });
    (pub ? pub.changes : []).forEach((c) => apply(base, c));
    blocks = clone(base);
    seed.concat(mine).forEach((c) => apply(blocks, c));
    stops = read(SKEY, {});
  }
  const changes = () => seed.concat(mine);
  const blockOf = (c) => (c.op ? c.op.block : c.block);
  const machine = (b) => b.mode !== 'Manual';
  const live = (id) => (NL.items || []).filter((it) => it.at.includes(id));
  // a block runs by the machine now when its published mode does; that is what a stop stops
  const stoppable = (id) => machine(base[id]);
  const stoppedAt = (id) => (stoppable(id) ? stops.line || (stops.blocks || {})[id] || null : null);

  // who takes the work when the machine fails: a team of the line or of the organization (its lead with it), or a person
  const TEAMS = (NL.teams || []).concat((O.teams || []).filter((x) => !(NL.teams || []).some((y) => y.id === x.id))
    .map((x) => ({ id: x.id, name: x.name, people: (x.lead ? [x.lead] : []).concat(x.people) })));
  function fallbackOf(b) {
    const team = TEAMS.find((x) => x.id === b.fallback);
    if (team) return { name: T('the {team}', { team: T(team.name) }), people: team.people };
    return b.fallback && O.people[b.fallback] ? { name: C.name(b.fallback), people: [b.fallback] } : null;
  }
  const peopleOf = (b) => [...new Set(b.roles.flatMap((r) => r.people))];
  const integration = (b) => (O.integrations || []).find((x) => x.id === b.integration);

  // ---------- the rules the plan puts on every automation; a version that breaks one is not published ----------
  function problems() {
    const out = [];
    ORDER.forEach((id) => {
      const b = blocks[id], name = T(b.name);
      if (!machine(b)) return;
      if (!fallbackOf(b)) out.push({ id, text: T('{block} has nobody to take the work when the machine fails.', { block: name }) });
      if (b.mode === 'Fully automatic') {
        const miss = [[!b.limits.cap, T('a daily cap')], [!b.limits.budget, T('a budget')], [!b.accepted, T('a named person’s acceptance')]].filter((m) => m[0]).map((m) => m[1]);
        if (miss.length) out.push({ id, text: T('{block} cannot run fully automatically without {what}.', { block: name, what: miss.join(T(', ')) }) });
      }
    });
    return out;
  }

  // ---------- this visit's changes: each the sentence a version lists, and `op`, what it does ----------
  // A second change of the same thing replaces the first; a change back to what the draft had before this visit takes
  // it away. Undo puts the visit's changes back as they were.
  const opKey = (o) => (o.key === 'tool' ? null : `${o.block}|${o.key}`);
  const valueOf = (b, k) => (k === 'mode' ? b.mode : k === 'accept' ? (b.accepted ? b.accepted.by : '') : k === 'fallback' ? b.fallback || '' : b.limits[k]);
  function before(op) {
    const bs = clone(base);
    seed.forEach((c) => apply(bs, c));
    return valueOf(bs[op.block], op.key);
  }
  function record(op, text, vars) {
    const was = mine.slice(), k = opKey(op), same = k && String(before(op)) === String(op.value);
    const list = mine.filter((c) => !(k && opKey(c.op) === k)).concat(same ? [] : [{ type: op.key, block: op.block, text, vars, op }]);
    write(DKEY, list);
    keepFocus(renderAll);
    note(same ? T('Back as it was in the draft.') : T('In the draft: {change}', { change: T(text, Object.fromEntries(Object.entries(vars).map(([x, v]) => [x, T(String(v))]))) }),
      () => { write(DKEY, was); renderAll(); });
  }

  // ---------- the head: the line, its draft, the stop, and publishing ----------
  function renderHead() {
    const n = changes().length, next = version + 1;
    renderLines(version, ORDER.filter((id) => machine(base[id])).length, NL.id);
    $('[data-name]').textContent = T(NL.name);
    document.title = `${T('Automation')} · ${T(NL.name)} · ${T(O.name)}`;
    $('[data-state]').innerHTML = n
      ? `<b>${esc(T('Draft of version {n}', { n: next }))}</b> · ${esc(N(n, '{n} change not published', '{n} changes not published'))}${mine.length && owner ? ` · <button type="button" class="link" data-discard>${esc(N(mine.length, 'Take back the change made now', 'Take back the {n} changes made now'))}</button>` : ''}`
      : `<b>${esc(T('Version {n}', { n: version }))}</b> · ${esc(T('published'))}`;
    const act = $('[data-act]');
    act.hidden = !owner;
    if (!owner) return;
    const auto = ORDER.filter(stoppable), b = blocks[sel];
    // stopping the whole line is one press away; one block, the selected one, from the same menu
    const stop = stops.line
      ? `<button type="button" class="btn au-go" data-resume="line">${START()}<span>${T('Start the automation again')}</span></button>`
      : `<div class="au-stop"><button type="button" class="btn au-halt" data-menu aria-expanded="false" aria-controls="au-stop-menu">${STOP()}<span>${T('Stop the automation')}</span>${CHEVRON}</button>
<div class="au-menu" id="au-stop-menu" hidden><p class="au-menu-h">${T('It stops at once, without publishing a version. Its waiting work goes to people.')}</p>
<button type="button" data-stop="line">${STOP()}<span><b>${T('Stop the whole line')}</b><small>${esc(auto.map((id) => T(base[id].name)).join(T(', ')))}</small></span></button>
${stoppable(sel) && !stoppedAt(sel) ? `<button type="button" data-stop="${sel}">${STOP()}<span><b>${esc(T('Stop only {block}', { block: T(b.name) }))}</b><small>${esc(goesTo([sel]))}</small></span></button>` : ''}</div></div>`;
    const label = esc(T('Publish version {n}', { n: next }));
    const publish = n ? `<button type="button" class="btn primary" data-publish>${icon('Publish', 18)}<span>${label}</span></button>`
      : `<button type="button" class="btn primary" disabled title="${esc(T('Nothing has changed since version {n}.', { n: version }))}">${icon('Publish', 18)}<span>${esc(T('Publish version {n}', { n: version + 1 }))}</span></button>`;
    act.innerHTML = stop + publish;
  }
  // where a stop sends the work waiting in blocks: to the people each falls back on
  function goesTo(ids) {
    const parts = ids.map((id) => ({ n: live(id).length, fb: fallbackOf(base[id]) })).filter((x) => x.n && x.fb)
      .map((x) => T('{jobs} to {who}', { jobs: NO.n(x.n, '{n} job', '{n} jobs'), who: x.fb.name }));
    return parts.length ? T('Its waiting work goes to people: {list}.', { list: parts.join(T(', ')) }) : NO.t('No job is waiting in it.');
  }
  function renderStopped() {
    const bar = $('[data-stopped]'), ids = ORDER.filter(stoppedAt);
    bar.hidden = !ids.length;
    if (!ids.length) return;
    const at = stops.line || stoppedAt(ids[0]);
    const what = stops.line ? T('The automation is stopped on the whole line since {time}.', { time: FLOW.hm(at) })
      : N(ids.length, '{blocks} is stopped since {time}.', '{blocks} are stopped since {time}.', { blocks: ids.map((id) => T(base[id].name)).join(T(', ')), time: FLOW.hm(at) });
    bar.innerHTML = `${STOP(18)}<span><b>${esc(what)}</b> ${esc(goesTo(ids))} ${esc(T('People do it until it is started again; no version was published.'))}</span>${owner ? ` <button type="button" class="link" data-resume="${stops.line ? 'line' : ids.join(' ')}">${T('Start it again')}</button>` : ''}`;
  }

  // ---------- the map: the sources, every block a ring on the track, the end ----------
  const RING = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7"/></svg>';
  const sources = () => (O.sources || []).filter((s) => s.line === NL.id);
  const TYPES = { rss: 'RSS', webhook: 'Webhook', telegram: 'Telegram', schedule: 'Schedule', line: 'From another line' };
  function noteOf(b) {
    if (b.note) return T(b.note);
    // a block that publishes outside the organization shows its daily cap: platforms punish heavy automatic posting
    if (b.pack && b.limits.cap) return T('Cap {n} a day', { n: b.limits.cap });
    return b.roles.map((r) => `${T(r.role)} · ${N(r.people.length, '{n} person', '{n} people')}`).join(T(', '));
  }
  function station(id) {
    const b = blocks[id], was = base[id], here = live(id), stop = stoppedAt(id);
    const tags = [];
    if (b.mode !== was.mode) tags.push(`<span class="au-x draft">${esc(T('Was {mode}', { mode: T(was.mode) }))}</span>`);
    else if (changes().some((c) => blockOf(c) === id)) tags.push(`<span class="au-x draft">${T('Changed in the draft')}</span>`);
    if (stop) tags.push(`<span class="au-x bad">${T('Stopped')}</span>`);
    const count = `<i class="au-c"><span aria-hidden="true">${here.length}</span><span class="sr">, ${esc(NO.n(here.length, '{n} live job', '{n} live jobs'))}</span></i>`;
    const label = `<span class="au-t"><span class="au-md">${esc(T(b.mode))}</span><span class="au-n">${glyphs(b)}<b>${esc(T(b.name))}</b>&nbsp;${count}</span><span class="au-m">${esc(noteOf(b))}</span>${tags.join('')}</span>`;
    const cls = ['au-s', id === sel ? 'on' : '', stop ? 'is-stopped' : '', b.mode !== was.mode ? 'is-draft' : ''].filter(Boolean).join(' ');
    return `<li class="${cls}" data-st="${id}"><button type="button" class="au-sb" data-pick="${id}" aria-expanded="${id === sel}" aria-controls="au-insp"><span class="au-dot" data-dot="${id}">${RING}</span>${label}</button></li>`;
  }
  // the line's two ends: where its items come from (the sources page) and where they leave it
  function ends() {
    const S = sources(), on = S.filter((s) => s.state !== 'paused'), off = S.length - on.length;
    const from = on.map((s) => T(TYPES[s.type])).join(T(', ')) || T('None');
    const account = integration(base[ORDER[ORDER.length - 1]]);
    const start = `<li class="au-s au-end" data-st="start"><a class="au-sb" href="${C.href('sources.html')}"><span class="au-dot" data-dot="start"></span><span class="au-t"><span class="au-md">${T('Start')}</span><span class="au-n">${icon('Sources', 16)}<b>${esc(N(S.length, 'Source', 'Sources'))}</b></span><span class="au-m">${esc(from)}${off ? ` · ${esc(N(off, '{n} paused', '{n} paused'))}` : ''}</span></span></a></li>`;
    const end = `<li class="au-s au-end" data-st="end"><div class="au-sb"><span class="au-dot" data-dot="end"></span><span class="au-t"><span class="au-md">${T('End')}</span><span class="au-n">${icon('Done', 16)}<b>${T('Published')}</b></span>${account ? `<span class="au-m" dir="ltr">${esc(account.account)}</span>` : ''}</span></div></li>`;
    return [start, end];
  }
  function renderStations() {
    const [start, end] = ends();
    $('[data-stations]').innerHTML = start + ORDER.map(station).join('') + end;
  }

  // A polyline with rounded bends: every corner becomes a quadratic curve of radius r (as the canvas draws it).
  function rounded(pts, r) {
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [a, p, b] = [pts[i - 1], pts[i], pts[i + 1]];
      const l1 = Math.hypot(p[0] - a[0], p[1] - a[1]), l2 = Math.hypot(b[0] - p[0], b[1] - p[1]);
      const k1 = Math.min(r, l1 / 2) / (l1 || 1), k2 = Math.min(r, l2 / 2) / (l2 || 1);
      d += `L${(p[0] - (p[0] - a[0]) * k1).toFixed(1)} ${(p[1] - (p[1] - a[1]) * k1).toFixed(1)}Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${(p[0] + (b[0] - p[0]) * k2).toFixed(1)} ${(p[1] + (b[1] - p[1]) * k2).toFixed(1)}`;
    }
    const z = pts[pts.length - 1];
    return `${d}L${z[0].toFixed(1)} ${z[1].toFixed(1)}`;
  }
  // geometry, in px, as the canvas's: ways back step 20 apart under the line in a row, 26 apart beside the rail in a column
  const LANE = { back: 20, col: 26 };
  function draw() {
    const inner = $('[data-in]'), svg = $('[data-tracks]'), v = vertical.matches, rtl = getComputedStyle(inner).direction === 'rtl';
    const ids = ['start'].concat(ORDER, ['end']);
    const backs = ORDER.filter((id) => blocks[id].back && blocks[blocks[id].back]).map((id) => ({ from: id, to: blocks[id].back }));
    if (v) {
      inner.style.removeProperty('--col');
      inner.style.paddingInline = '';
      inner.style.setProperty('--rail', `${24 + backs.length * LANE.col}px`);
    } else {
      // the stations share the width evenly (Beck's even spacing), between 128 and 200 px each
      const map = inner.parentElement, edge = Math.max(32, (map.clientWidth - 1440) / 2);
      inner.style.setProperty('--col', `${Math.round(Math.min(200, Math.max(128, (map.clientWidth - 2 * edge) / ids.length)))}px`);
      inner.style.paddingInline = `${edge}px`;
      inner.style.removeProperty('--rail');
    }
    const box = inner.getBoundingClientRect();
    const at = (id) => { const r = $(`[data-dot="${id}"]`, inner).getBoundingClientRect(); return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top]; };
    const ax = v ? 1 : 0, out = v ? (rtl ? 1 : -1) : 1;
    const P = (along, across) => (v ? [across, along] : [along, across]);
    let paths = '';
    for (let i = 1; i < ids.length; i++) {
      const A = at(ids[i - 1]), B = at(ids[i]);
      paths += `<path d="M${A[0].toFixed(1)} ${A[1].toFixed(1)}L${B[0].toFixed(1)} ${B[1].toFixed(1)}"/>`;
    }
    // a way back turns square under the line at half weight: down from the block that sends it, back, up into the one it returns to
    backs.forEach((k, i) => {
      const A = at(k.from), B = at(k.to), c = A[1 - ax] + out * (v ? (i + 1) * LANE.col : 8 + (i + 1) * LANE.back);
      paths += `<path class="back" d="${rounded([A, P(A[ax], c), P(B[ax], c), B], 12)}"/>`;
    });
    inner.style.paddingBlockEnd = v ? '' : `${Math.max(32, 8 + backs.length * LANE.back + 32)}px`;
    svg.setAttribute('width', inner.scrollWidth);
    svg.setAttribute('height', inner.scrollHeight);
    svg.innerHTML = paths;
  }
  let queued = false;
  const requestDraw = () => { if (!queued) { queued = true; setTimeout(() => { queued = false; draw(); }, 0); } };

  // the legend keys only what this line has
  function renderLegend() {
    const modes = ORDER.map((id) => blocks[id].mode);
    const rows = [
      [true, `<span class="au-lg-g">${strokes([['struck']])}${strokes([['held']])}</span>`, T('A person works or decides')],
      [true, `<span class="au-lg-g">${strokes([['run']])}</span>`, T('The machine does it')],
      [modes.includes('Trial'), `<span class="au-lg-g">${strokes([['run', true]])}</span>`, T('The machine on trial, beside the person, with no effect outside')],
      [ORDER.some((id) => blocks[id].back), `<svg viewBox="0 0 40 20" aria-hidden="true"><path d="M34 3v7a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V3" class="lg-tk back"/></svg>`, T('A way back to an earlier block')],
      [changes().length, `<span class="au-x draft" aria-hidden="true"></span>`, T('Changed in the draft, until the version is published')],
      [ORDER.some(stoppedAt), `<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" class="lg-r bad"/></svg>`, T('Stopped: people do its work')],
    ];
    $('[data-legend]').innerHTML = rows.filter((r) => r[0]).map((r) => `<li>${r[1]}<span>${esc(r[2])}</span></li>`).join('');
  }

  // ---------- the inspector: the selected block ----------
  const KIND = { work: 'Stage of work', approval: 'Approval', auto: 'Action' };
  // the tools the core and each pack give a block; a tool the block has is not offered again
  const TOOLS = {
    core: [['Refine the text', 'Ask Watar'], ['Stop duplicates', 'Discard'], ['Filter by rules', 'Condition']],
    'Media and production': [['Upload from the field', 'Upload'], ['Output from a template', 'Templates'], ['Publish to Telegram', 'Publish']],
    Software: [['Task prompt', 'Task'], ['Check results', 'Test run']],
  };
  const TOOL_LIST = TOOLS.core.concat(TOOLS[O.pack] || []);
  const toolIcon = (name) => (TOOL_LIST.find((x) => x[0] === name) || [0, 'Task'])[1];
  // a record of the block, newest first: what Automation did (never a person's name) or what a person did after it
  const SAID = {
    in: '{actor} let {code} into the line', duplicate: '{actor} stopped a duplicate of {code}', draft: '{actor} prepared a draft of {code}',
    edited: '{actor} edited {code} and handed it over', carousel: '{actor} made the carousel of {code}', post: '{actor} prepared the post of {code}',
    published: '{actor} published {code} on Telegram', approved: '{actor} approved {code}',
  };
  const insp = $('[data-insp]');
  function renderInsp() {
    const b = blocks[sel], was = base[sel], stop = stoppedAt(sel), auto = machine(b), here = live(sel);
    const sub = [b.pack ? T('{pack} pack', { pack: T(O.pack) }) : T(KIND[b.kind] || 'Stage of work'), NO.n(here.length, '{n} live job', '{n} live jobs')].join(' · ');
    const act = owner && stoppable(sel) ? (stop ? `<button type="button" class="btn au-go" data-resume="${stops.line ? 'line' : sel}">${START()}<span>${stops.line ? T('Start the automation again') : T('Start it again')}</span></button>`
      : `<button type="button" class="btn au-halt" data-stop="${sel}">${STOP()}<span>${T('Stop this block')}</span></button>`) : '';
    const tags = [];
    if (b.mode !== was.mode) tags.push(`<span class="au-x draft">${esc(T('In the draft: {mode}; it runs as {now} until the version is published', { mode: T(b.mode), now: T(was.mode) }))}</span>`);
    if (stop) tags.push(`<span class="au-x bad">${esc(T('Stopped since {time}: people do its work', { time: FLOW.hm(stop) }))}</span>`);
    insp.innerHTML = `<div class="ai-h"><span class="ai-hg">${glyphs(b)}</span><div class="ai-ht"><h2 id="au-insp-h">${esc(T(b.name))}</h2><p>${esc(sub)}</p>${tags.length ? `<div class="ai-tags">${tags.join('')}</div>` : ''}</div>${act ? `<div class="ai-act">${act}</div>` : ''}</div>
${owner ? '' : `<p class="ai-hint">${icon('Lock', 18)}<span>${T('Only the owner changes how a block runs, or stops it.')}</span></p>`}
<div class="ai-grid"><fieldset class="ai-main ai-fs"${owner ? '' : ' disabled'}><legend class="sr">${esc(T('How {block} runs', { block: T(b.name) }))}</legend>${who(b, was)}${tools(b)}${limits(b)}</fieldset>
<div class="ai-side">${numbers(b, was)}${fallback(b)}${log(b)}</div></div>`;
  }

  // who does it: the five modes, each with its sentence and its strokes; a change of the draft
  function who(b, was) {
    const ppl = Object.keys(O.people).filter((k) => O.people[k].type !== 'invited');
    const full = b.mode === 'Fully automatic';
    const miss = full ? [[!b.limits.cap, T('a daily cap')], [!b.limits.budget, T('a budget')], [!b.accepted, T('a named person’s acceptance')]].filter((m) => m[0]).map((m) => m[1]) : [];
    const roles = b.roles.length ? `<p class="ai-who">${icon('People', 18)}<span>${b.roles.map((r) => `<b>${esc(T(r.role))}</b> ${esc(r.people.map(C.name).join(T(', ')))}`).join(' · ')}</span></p>`
      : `<p class="ai-who">${icon('People', 18)}<span>${esc(T('No person works in it; what the machine cannot settle goes to the people it falls back on.'))}</span></p>`;
    const opt = ([m, d]) => {
      const tag = m === was.mode && m !== b.mode ? `<em>${T('Runs like this now')}</em>` : m === b.mode && m !== was.mode ? `<em class="draft">${T('In the draft')}</em>` : '';
      return `<label class="ai-mo"><input type="radio" name="ai-mode" value="${esc(m)}" data-mode${m === b.mode ? ' checked' : ''}><span class="ai-mg">${glyphs(b, m)}</span><span class="ai-mt"><b>${esc(T(m))}${tag}</b><small>${esc(T(d))}</small></span></label>`;
    };
    return `<section class="ai-s" aria-labelledby="ai-who-h"><h3 id="ai-who-h">${T('Who does it')}</h3>
<p class="ai-hint">${icon('Draft', 18)}<span>${esc(T('Changing it is a change of the draft: it takes effect when version {n} is published.', { n: version + 1 }))}</span></p>
${roles}
<div class="ai-md" role="radiogroup" aria-labelledby="ai-who-h">${MODES.map(opt).join('')}</div>
${full ? `<div class="ai-req"><p>${T('Fully automatic is published only with a daily cap, a budget and a named person’s acceptance.')}</p>
<div class="field"><label for="ai-acc">${T('Accepted by')}</label><select id="ai-acc" data-set="accept">${[['', T('Nobody yet')]].concat(ppl.map((k) => [k, C.name(k)])).map(([v, t]) => `<option value="${v}"${v === (b.accepted ? b.accepted.by : '') ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
${b.accepted ? `<p class="ai-rec">${icon('Done', 16)}<span>${esc(T('{name} accepted it, {when}. The acceptance is kept with the version.', { name: C.name(b.accepted.by), when: FLOW.when(b.accepted.at) }))}</span></p>` : ''}
${miss.length ? `<p class="ai-bad">${icon('Late', 16)}<span>${esc(T('It cannot be published without {what}.', { what: miss.join(T(', ')) }))}</span></p>` : ''}</div>` : ''}</section>`;
  }

  // its tools: what the machine works with; the pack decides which there are
  function tools(b) {
    const auto = machine(b), have = b.tools.map((x) => x.name);
    const ig = integration(b);
    const rows = b.tools.map((x) => `<li${x.added ? ' class="is-added"' : ''}><span class="ai-ti">${icon(toolIcon(x.name), 18)}</span><span class="ai-tt"><b>${esc(T(x.name))}</b>${x.about ? `<small>${esc(T(x.about))}${ig && x.name === 'Publish to Telegram' ? ` <span dir="ltr">${esc(ig.account)}</span>` : ''}</small>` : ''}</span>${x.added ? `<span class="au-x draft">${T('In the draft')}</span>` : ''}</li>`).join('');
    const free = TOOL_LIST.filter(([n]) => !have.includes(n));
    const add = owner && auto && free.length ? `<div class="ai-add"><button type="button" class="link" data-menu aria-expanded="false" aria-controls="ai-tools-m">${icon('Create', 18)}<span>${T('Add a tool')}</span></button>
<div class="au-menu" id="ai-tools-m" hidden><p class="au-menu-h">${esc(T('The core’s tools and the {pack} pack’s', { pack: T(O.pack) }))}</p>${free.map(([n, ic]) => `<button type="button" data-tool="${esc(n)}">${icon(ic, 18)}<span><b>${esc(T(n))}</b></span></button>`).join('')}</div></div>` : '';
    return `<section class="ai-s" aria-labelledby="ai-tl-h"><h3 id="ai-tl-h">${T('Tools')}${b.tools.length ? ` <span class="ai-n">${b.tools.length}</span>` : ''}</h3>
${b.tools.length ? `<ul class="ai-tl">${rows}</ul>` : `<p class="ai-none">${esc(auto ? T('No tool yet: the machine has nothing to work with.') : T('A person does it: no tool runs here.'))}</p>`}${add}</section>`;
  }

  // its limits: a daily cap, this month's budget and the lowest confidence it may hand work over at
  function limits(b) {
    if (!machine(b)) return `<section class="ai-s" aria-labelledby="ai-lm-h"><h3 id="ai-lm-h">${T('Limits')}</h3><p class="ai-none">${T('No limits: a person does it.')}</p></section>`;
    const L = b.limits, use = b.use || { today: 0, spent: 0 };
    const field = (k, label, pre, post, help, max) => `<div class="field"><label for="ai-${k}">${label}</label><span class="ai-in">${pre ? `<span>${pre}</span>` : ''}<input id="ai-${k}" type="number" inputmode="numeric" min="1" max="${max}" data-set="${k}" value="${L[k] || ''}" aria-describedby="ai-${k}-h">${post ? `<span>${post}</span>` : ''}</span><small id="ai-${k}-h">${esc(help)}</small></div>`;
    return `<section class="ai-s" aria-labelledby="ai-lm-h"><h3 id="ai-lm-h">${T('Limits')}</h3>
<div class="ai-lm">${field('cap', T('Daily cap'), '', T('per day'), L.cap ? T('Today: {n} of {cap}', { n: use.today, cap: L.cap }) : T('No cap yet'), 9999)}
${field('budget', T('This month’s budget'), '$', '', L.budget ? T('Spent this month: {spent} of {budget}', { spent: money(use.spent), budget: money(L.budget) }) : T('No budget yet'), 99999)}
${field('confidence', T('Lowest confidence'), '', '%', T('Below it, the work goes to a person.'), 100)}</div></section>`;
  }

  // its numbers since it was turned over to the machine, as the mode it ran in counts them
  function numbers(b, was) {
    const x = b.numbers;
    const rows = !x ? [] : [
      [x.runs, N(x.runs, 'time it ran', 'times it ran')],
      x.accepted != null && [`${x.accepted}%`, was.mode === 'Assisted' ? T('accepted without big edits') : T('approved as it was')],
      x.duplicates != null && [x.duplicates, N(x.duplicates, 'duplicate stopped', 'duplicates stopped')],
      x.weak != null && [x.weak, N(x.weak, 'weak case reached a person', 'weak cases reached a person')],
    ].filter(Boolean);
    return `<section class="ai-s ai-nums" aria-labelledby="ai-nm-h"><h3 id="ai-nm-h">${T('Numbers so far')}</h3>
${rows.length ? `<p class="ai-since">${esc(T('Since {day}, as {mode}', { day: FLOW.date(`${x.since}T00:00`), mode: T(was.mode) }))}</p><ul class="ai-kpi">${rows.map(([n, l]) => `<li><span class="ai-k">${esc(n)}</span><span>${esc(l)}</span></li>`).join('')}</ul>`
    : `<p class="ai-none">${esc(machine(b) ? T('No numbers yet: the machine has not run it.') : T('People do it, so the machine has nothing to count.'))}</p>`}</section>`;
  }

  // who takes the work when the machine fails: no automated block without a person to fall back on
  function fallback(b) {
    if (!machine(b)) return '';
    const fb = fallbackOf(b);
    const opts = [['', T('Nobody yet')]].concat(TEAMS.map((x) => [x.id, T(x.name)]), Object.keys(O.people).filter((k) => O.people[k].type !== 'invited').map((k) => [k, C.name(k)]));
    return `<section class="ai-s" aria-labelledby="ai-fb-h"><h3 id="ai-fb-h">${T('If the machine fails')}</h3>
${fb ? `<p class="ai-fb">${esc(T('The work goes to {who}.', { who: fb.name }))}</p><ul class="ai-pp">${fb.people.map((k) => `<li><span class="me-av" aria-hidden="true">${esc(C.name(k).charAt(0))}</span><span>${esc(C.name(k))}</span></li>`).join('')}</ul>`
    : `<p class="ai-bad">${icon('Late', 16)}<span>${T('Nobody takes the work when it fails. No block runs by the machine without a person to fall back on.')}</span></p>`}
${owner ? `<div class="field ai-fbs"><label for="ai-fallback">${T('Who takes the work')}</label><select id="ai-fallback" data-set="fallback">${opts.map(([v, t]) => `<option value="${esc(v)}"${v === (b.fallback || '') ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></div>` : ''}</section>`;
  }

  // its record: newest first; every step the machine took is Automation's, with its confidence and its cost
  function log(b) {
    if (!b.record.length) return '';
    const rows = b.record.map((r) => {
      const actor = r.by ? C.name(r.by) : T('Automation');
      const text = T(SAID[r.did] || '{actor} · {code}', { actor, code: r.code });
      const meta = r.by ? '' : `<small>${esc(T('Confidence {n}%', { n: r.conf }))} · ${esc(money(r.cost))}</small>`;
      const g = r.by ? (r.did === 'approved' ? 'held' : 'struck') : 'run';
      // an item's code is kept whole: it never breaks at its hyphens
      return `<li class="${r.by ? 'by-person' : 'by-machine'}"><span class="au-g" aria-hidden="true">${strokes([[g]])}</span><div><p>${esc(text).replace(r.code, `<span class="ai-cd">${r.code}</span>`)}</p>${meta}</div><time>${esc(FLOW.when(r.at))}</time></li>`;
    }).join('');
    return `<section class="ai-s" aria-labelledby="ai-lg-h"><h3 id="ai-lg-h">${T('Its record')}</h3>
${b.record.some((r) => !r.by) ? `<p class="ai-hint">${icon('History', 18)}<span>${T('Every step the machine takes is recorded with its confidence and its cost, and its actor is Automation, not a person.')}</span></p>` : ''}
<ol class="ai-log">${rows}</ol></section>`;
  }

  // ---------- rendering, in one pass ----------
  function url() {
    const p = new URLSearchParams(location.search);
    p.set('block', sel);
    history.replaceState(null, '', `${location.pathname}?${p}${location.hash}`);
  }
  function renderAll() {
    build();
    if (!blocks[sel]) sel = ORDER[0];
    renderHead();
    renderStopped();
    renderStations();
    renderLegend();
    renderInsp();
    draw();
    url();
  }
  // after a redraw, the focus returns to the control it was on (they keep their ids and data)
  function keepFocus(fn) {
    const a = document.activeElement, id = a && a.id;
    let data = a && a.dataset ? Object.entries(a.dataset).map(([k, v]) => `[data-${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}="${CSS.escape(v)}"]`).join('') : '';
    if (data && a.type === 'radio') data += `[value="${CSS.escape(a.value)}"]`;
    fn();
    const back = (id && document.getElementById(id)) || (data && $(data));
    if (back && back !== document.activeElement) back.focus({ preventScroll: true });
  }
  function note(text, fn) {
    const el = $('[data-note]');
    $('[data-note-t]').textContent = text;
    undo = fn;
    el.hidden = !text;
    clearTimeout(note.t);
    note.t = setTimeout(() => { el.hidden = true; undo = null; }, 8000);
  }
  function showProblems(list) {
    const el = $('[data-problems]');
    el.hidden = !list.length;
    el.innerHTML = list.length ? `<p>${icon('Late', 18)}<b>${esc(T('Version {n} cannot be published yet:', { n: version + 1 }))}</b></p><ul>${list.map((x) => `<li><button type="button" class="link" data-pick="${x.id}">${esc(x.text)}</button></li>`).join('')}</ul>` : '';
  }

  // ---------- what the owner does ----------
  function stopIt(what) {
    const was = clone(stops);
    if (what === 'line') write(SKEY, { line: W.now });
    else write(SKEY, { blocks: Object.assign({}, stops.blocks, { [what]: W.now }) });
    if (window.UI) window.UI.closeMenu();
    keepFocus(renderAll);
    // the bar under the head says where the waiting work went; the note only offers the way back
    note(what === 'line' ? T('The automation is stopped on the whole line.') : T('{block} is stopped.', { block: T(base[what].name) }), () => { write(SKEY, was); renderAll(); });
  }
  function startIt(what) {
    const was = clone(stops), blocksOff = Object.assign({}, stops.blocks);
    if (what === 'line') write(SKEY, {});
    else { what.split(' ').forEach((id) => { delete blocksOff[id]; }); write(SKEY, { blocks: blocksOff }); }
    keepFocus(renderAll);
    note(T('The machine does its steps again.'), () => { write(SKEY, was); renderAll(); });
  }
  function publish() {
    const list = problems();
    showProblems(list);
    if (list.length) { $('[data-problems] button').focus(); return; }
    const wasPub = pub, wasMine = mine.slice(), n = version + 1, all = changes();
    write(PKEY, { version: n, changes: (pub ? pub.changes : []).concat(all) });
    write(DKEY, []);
    renderAll();
    note(T('Version {n} is published: {changes}.', { n, changes: all.map(say).join(T('; ')) }), () => { write(PKEY, wasPub); write(DKEY, wasMine); renderAll(); });
    $('[data-undo]').focus();
  }

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button, a');
    if (!t || t.getAttribute('aria-disabled') === 'true' || t.disabled) return;
    if (t.dataset.pick) {
      if (t.dataset.pick !== sel) { sel = t.dataset.pick; keepFocus(renderAll); }
      if (t.closest('[data-problems]') || vertical.matches) insp.scrollIntoView({ block: 'start', behavior: window.Beats && window.Beats.reduce() ? 'auto' : 'smooth' });
    } else if (t.dataset.stop && owner) stopIt(t.dataset.stop);
    else if (t.dataset.resume && owner) startIt(t.dataset.resume);
    else if (t.hasAttribute('data-publish') && owner) publish();
    else if (t.hasAttribute('data-undo') && undo) {
      const fn = undo;
      undo = null;
      $('[data-note]').hidden = true;
      fn();
    } else if (t.hasAttribute('data-discard')) {
      const was = mine.slice();
      write(DKEY, []);
      renderAll();
      note(T('The changes made now are taken back.'), () => { write(DKEY, was); renderAll(); });
      $('[data-undo]').focus();
    } else if (t.dataset.tool && owner) {
      if (window.UI) window.UI.closeMenu();
      record({ block: sel, key: 'tool', value: t.dataset.tool }, 'Added the tool {tool} to {block}', { tool: t.dataset.tool, block: blocks[sel].name });
      const b = $('[aria-controls="ai-tools-m"]');
      if (b) b.focus();
    }
  });

  // how it runs, its limits and who it falls back on: every control says what it changes, and the change goes to the draft
  root.addEventListener('change', (e) => {
    const t = e.target, b = blocks[sel];
    if (!owner || !b) return;
    showProblems([]);
    if (t.dataset.mode != null) return record({ block: sel, key: 'mode', value: t.value }, '{block} now runs as {mode}', { block: b.name, mode: t.value });
    const k = t.dataset.set;
    if (!k) return;
    if (LIMITS.includes(k)) {
      const max = k === 'confidence' ? 100 : 99999, v = Math.max(0, Math.min(max, Math.round(+t.value || 0))) || '';
      const text = { cap: v ? '{block} may run {n} times a day' : '{block} has no daily cap', budget: v ? '{block} may spend ${n} a month' : '{block} has no budget',
        confidence: '{block} hands work to a person below {n}% confidence' }[k];
      return record({ block: sel, key: k, value: v }, text, { block: b.name, n: v });
    }
    if (k === 'accept') return record({ block: sel, key: 'accept', value: t.value, at: W.now }, t.value ? '{name} accepts that {block} runs fully automatically' : 'Nobody accepts that {block} runs fully automatically', { block: b.name, name: t.value ? O.people[t.value].name : '' });
    if (k === 'fallback') {
      const team = TEAMS.find((x) => x.id === t.value);
      return record({ block: sel, key: 'fallback', value: t.value }, t.value ? 'When {block} fails, {who} takes the work' : 'Nobody takes the work when {block} fails', { block: b.name, who: team ? team.name : t.value ? O.people[t.value].name : '' });
    }
  });

  // ---------- start: the block named in the address, else the one with the most live work (the earlier on a tie) ----------
  build();
  sel = blocks[q.get('block')] ? q.get('block') : ORDER.slice().sort((a, b) => live(b).length - live(a).length)[0];
  $('[data-canvas]').hidden = false;
  insp.hidden = false;
  renderAll();
  // the rings move whenever a name rewraps (a font arriving, the sidebar folding): measure again then
  const ro = new ResizeObserver(requestDraw);
  ro.observe($('[data-map]'));
  ro.observe($('[data-stations]'));
  if (document.fonts) { document.fonts.ready.then(requestDraw); document.fonts.addEventListener('loadingdone', requestDraw); }
  window.addEventListener('load', requestDraw);
  vertical.addEventListener('change', () => keepFocus(renderAll));
  window.addEventListener('resize', requestDraw);

  // ---------- a line with nothing automated: said plainly, with where its blocks stand and where to change one ----------
  function honest(L) {
    const D = L === C.line ? C.draft() : { changes: [], version: L.version + 1 };
    renderLines(NL ? (read(PKEY, {}) || {}).version || NL.version : 0, NL ? NL.blocks.filter((b) => b.mode !== 'Manual').length : 0, L.id);
    $('[data-name]').textContent = T(L.name);
    document.title = `${T('Automation')} · ${T(L.name)} · ${T(O.name)}`;
    $('[data-state]').innerHTML = D.changes.length
      ? `<b>${esc(T('Draft of version {n}', { n: D.version }))}</b> · ${esc(N(D.changes.length, '{n} change not published', '{n} changes not published'))}`
      : `<b>${esc(T('Version {n}', { n: L.version }))}</b> · ${esc(T('published'))}`;
    // the draft's mode changes, as world.js and the canvas keep them: a block that will run differently once published
    const later = {};
    D.changes.filter((c) => c.type === 'mode' || (c.op && c.op.op === 'set' && c.op.key === 'mode')).forEach((c) => { later[c.block] = c.op ? c.op.value.mode : c.vars.mode; });
    const self = L.blocks.filter((b) => b.kind === 'auto');
    const rows = L.blocks.map((b) => {
      const now = b.kind === 'auto' ? null : 'Manual', next = later[b.id];
      const what = b.kind === 'auto' ? T('Runs by itself') : `${T('Manual')} · ${b.roles.map((r) => T(r.role)).join(T(', '))}`;
      return `<li><span class="au-g" aria-hidden="true">${b.kind === 'auto' ? strokes([['run']]) : strokes(stepsOf(b, now))}</span><span class="an-t"><b>${esc(T(b.name))}</b><small>${esc(what)}</small></span>${next ? `<span class="au-x draft">${esc(T('In the draft: {mode}', { mode: T(next) }))}</span>` : ''}</li>`;
    }).join('');
    const nextOne = Object.keys(later)[0];
    const el = $('[data-none]');
    el.hidden = false;
    el.innerHTML = `<div class="an-h"><h2 id="au-none-h">${esc(T('Nothing on {line} is done by the machine yet.', { line: T(L.name) }))}</h2>
<p>${esc(T('Every step is done by people.'))}${self.length ? ` ${esc(N(self.length, '{blocks} runs by itself, as the pack’s own block: no step was turned over to the machine.', '{blocks} run by themselves, as the pack’s own blocks: no step was turned over to the machine.', { blocks: self.map((b) => T(b.name)).join(T(', ')) }))}` : ''}</p>
${Object.keys(later).map((id) => `<p class="an-d"><span class="au-x draft" aria-hidden="true"></span><span>${esc(T('In the draft of version {n}, {block} runs as {mode}. It starts when that version is published.', { n: D.version, block: T(L.blocks.find((b) => b.id === id).name), mode: T(later[id]) }))}</span></p>`).join('')}</div>
<ol class="an-l" aria-label="${esc(T('Blocks, in the order work walks them'))}">${rows}</ol>
<p class="an-go">${L === C.line ? `<a class="btn" href="${C.href('lines.html', nextOne ? { block: nextOne } : {})}#settings">${icon('Line', 18)}<span>${T('Choose how a block runs, on the canvas')}</span></a>` : soon(T('Choose how a block runs, on the canvas'), 'Line')}</p>`;
  }
})();
