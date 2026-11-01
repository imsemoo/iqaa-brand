// Build: the line on a free canvas. Stations are blocks placed anywhere; steps come from the library; a station's
// outputs are drawn as metro track that routes itself (horizontal, 45°, rounded bends), so the line never tangles
// however the blocks are placed. The line is checked as it is built, and every change can be undone.
(function () {
  const root = document.querySelector('main.bd');
  if (!root || !window.IQ || !window.Beats || !window.SUFRA) return;
  const S = window.SUFRA, M = window.IQAA.motion;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const esc = Beats.esc;
  const canvas = $('[data-canvas]'), world = $('[data-world]'), edgesEl = $('[data-edges]'), blocksEl = $('[data-blocks]');
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const N = I18N.n;
  // Names the app writes are English data, shown in the page's language; a name someone typed is shown as it is.
  // A few are written with a number or a person in them, so those are read by their pattern.
  const MADE = [
    [/^Over (\d+) people\?$/, (m) => N(+m[1], 'Over {n} people?', 'Over {n} people?')],
    [/^(.+) \(copy\)$/, (m) => T('{name} (copy)', { name: say(m[1]) })],
    [/^(.+)’s approval$/, (m) => T('{name}’s approval', { name: T(m[1]) })],
    [/^(.+) approves the big order$/, (m) => T('{name} approves the big order', { name: T(m[1]) })],
  ];
  function say(name) {
    const out = T(name);
    if (out !== name || I18N.lang === 'en') return out;
    for (const [re, f] of MADE) { const m = re.exec(name); if (m) return f(m); }
    return name;
  }
  let uid = 0;
  const nid = (p) => `${p}${Date.now().toString(36)}${++uid}`;

  // ---------- the blocks a step can be ----------
  const PEOPLE = ['Reem', 'Salma', 'Yusuf', 'Hala', 'The client'];
  const TYPES = {
    task: { kind: 'struck', name: 'Task', person: true },
    approval: { kind: 'held', name: 'Approval', person: true, change: true },
    watar: { kind: 'held', name: 'Watar drafts it', person: true },
    send: { kind: 'run', name: 'Send a message', msg: true, channel: true },
    remind: { kind: 'run', name: 'Remind someone', msg: true },
    create: { kind: 'run', name: 'Create', make: true },
    move: { kind: 'run', name: 'Move the job' },
    webhook: { kind: 'run', name: 'Webhook', url: true },
    http: { kind: 'run', name: 'HTTP request', url: true },
    condition: { kind: 'run', name: 'Condition', rule: true },
    wait: { kind: 'rest', name: 'Wait', wait: true },
  };
  const VARS = ['{client.name}', '{order.title}', '{order.people}', '{order.due}', '{quote.link}', '{station.name}'];
  const FIELDS = { people: 'Number of people', total: 'Order total', days: 'Days until it is due' };
  // the kind of a block, as the library names it; English keeps the key it has always shown
  const LIB_NAME = { task: 'Task', approval: 'Approval', watar: 'Watar draft', send: 'Send', remind: 'Remind', create: 'Create', move: 'Move job', webhook: 'Webhook', http: 'HTTP request', condition: 'Condition', wait: 'Wait' };
  const typeLabel = (k) => (I18N.lang === 'en' ? k : T(LIB_NAME[k]));

  // ---------- Sufra's line, laid out once like its metro map ----------
  function fromSufra() {
    const L = S.line();
    const typeOf = (x) => (x.kind === 'struck' ? 'task' : x.kind === 'rest' ? 'wait' : x.kind === 'held' ? (/^Watar/.test(x.name) ? 'watar' : 'approval')
      : ({ Send: 'send', Create: 'create', Remind: 'remind', Move: 'move' }[x.who] || 'send'));
    const st = (s, x, y) => ({ id: s.id, name: s.name, x, y, end: false, steps: s.steps.map((p) => ({
      id: p.id, type: typeOf(p), name: p.name, who: TYPES[typeOf(p)].person ? p.who : '', wait: p.kind === 'rest' ? p.who : '',
      msg: p.msg || (p.kind === 'run' && /Send|Remind/.test(p.who) ? `Hello {client.name}, ${p.name.toLowerCase()} for {order.title}.` : ''),
      channel: 'Email', make: p.who === 'Create' ? (/invoice/i.test(p.name) ? 'An invoice' : 'A shopping list') : '', change: false, retry: true,
    })) });
    const stations = L.stations.map((s, i) => st(s, 80 + i * 288, 120));
    const br = L.routes.find((r) => r.type === 'branch'), back = L.routes.find((r) => r.type === 'back');
    const appr = stations.find((s) => s.id === br.from);
    const wholesale = st(br.stations[0], (appr.x + stations.find((s) => s.id === br.to).x) / 2, 470);
    stations.push(wholesale);
    // the branch for big orders is a condition step; the way back hangs on the client's approval
    const cond = { id: nid('s'), type: 'condition', name: 'Over 30 people?', who: '', rule: { field: 'people', op: '>', value: 30 }, retry: false };
    appr.steps.push(cond);
    const ap = appr.steps.find((p) => p.type === 'approval');
    ap.change = true;
    stations[stations.length - 2].end = true;
    const edges = [];
    L.stations.forEach((s, i) => { if (i < L.stations.length - 1 && s.id !== appr.id) edges.push({ id: nid('e'), from: s.id, port: 'next', to: L.stations[i + 1].id }); });
    edges.push({ id: nid('e'), from: appr.id, port: 'next', to: 'buy' });
    edges.push({ id: nid('e'), from: appr.id, port: `${cond.id}:yes`, to: wholesale.id });
    edges.push({ id: nid('e'), from: wholesale.id, port: 'next', to: br.to });
    edges.push({ id: nid('e'), from: appr.id, port: `${ap.id}:change`, to: back.to });
    return { start: L.stations[0].id, stations, edges };
  }

  let line;
  try { line = JSON.parse(sessionStorage.getItem('iqaa-build') || 'null'); } catch (e) { line = null; }
  if (!line || !line.stations) line = fromSufra();
  let sel = { kind: 'station', id: 'approval' };
  const undo = [], redo = [];
  const view = { x: 0, y: 0, z: 1 };

  const st = (id) => line.stations.find((s) => s.id === id);
  const stepAt = (id) => { for (const s of line.stations) { const p = s.steps.find((x) => x.id === id); if (p) return { s, p }; } return null; };
  const kindOf = (p) => TYPES[p.type].kind;

  // a station's outputs: on to the next station, plus a yes for each condition and a change for each approval that allows one
  function ports(s) {
    const out = [{ id: 'next', label: s.end ? 'End' : 'Next' }];
    s.steps.forEach((p) => {
      if (p.type === 'condition') out.push({ id: `${p.id}:yes`, label: 'Yes', step: p.id });
      if (p.type === 'approval' && p.change) out.push({ id: `${p.id}:change`, label: 'Change asked', step: p.id });
    });
    return out;
  }

  // ---------- history ----------
  function commit(say) {
    undo.push(clone(line));
    if (undo.length > 60) undo.shift();
    redo.length = 0;
    return say;
  }
  function changed(say) {
    try { sessionStorage.setItem('iqaa-build', JSON.stringify(line)); } catch (e) { /* the canvas keeps it for this page */ }
    render();
    if (say) $('[data-live]').textContent = say;
  }

  // ---------- checks: what would stop a job, found where it is ----------
  function checks() {
    const out = [];
    const reach = new Set([line.start]), q = [line.start];
    while (q.length) { const id = q.shift(); line.edges.filter((e) => e.from === id).forEach((e) => { if (!reach.has(e.to)) { reach.add(e.to); q.push(e.to); } }); }
    line.stations.forEach((s) => {
      const name = say(s.name);
      if (!reach.has(s.id)) out.push({ at: s.id, text: T('No job ever reaches {name}.', { name }) });
      const next = line.edges.some((e) => e.from === s.id && e.port === 'next');
      if (!next && !s.end) out.push({ at: s.id, text: T('{name} has no way out. Connect its Next, or mark it as the end.', { name }) });
      ports(s).filter((p) => p.step).forEach((p) => { if (!line.edges.some((e) => e.from === s.id && e.port === p.id)) out.push({ at: s.id, step: p.step, text: T('{name}: “{label}” goes nowhere yet.', { name, label: T(p.label) }) }); });
      s.steps.forEach((p) => {
        const ty = TYPES[p.type], step = say(p.name);
        if (ty.person && !p.who) out.push({ at: s.id, step: p.id, text: T('{name}: “{step}” has nobody to do it.', { name, step }) });
        if (ty.msg && !p.msg.trim()) out.push({ at: s.id, step: p.id, text: T('{name}: “{step}” has no message.', { name, step }) });
        if (ty.url && !/^https:\/\//.test(p.url || '')) out.push({ at: s.id, step: p.id, text: T('{name}: “{step}” needs an https address.', { name, step }) });
        if (ty.rule && !(p.rule && p.rule.value !== '' && p.rule.value != null)) out.push({ at: s.id, step: p.id, text: T('{name}: the condition has no value.', { name }) });
      });
      if (!s.steps.length) out.push({ at: s.id, text: T('{name} has no steps.', { name }) });
    });
    if (line.stations.filter((s) => s.end).length === 0) out.push({ text: T('No station is marked as the end of the line.') });
    return out;
  }

  // ---------- drawing ----------
  // a station on the board is a metro station, not a card: its name above, its ring on the track, its steps hanging
  // under the ring on a short rail, each drawn with its own stroke. Track runs from ring to ring.
  const BW = 200, RX = 10, RY = 34;
  function block(s, bad) {
    const on = sel.kind === 'station' && sel.id === s.id;
    const start = s.id === line.start;
    const rows = s.steps.map((p) => {
      const k = kindOf(p), pon = sel.kind === 'step' && sel.id === p.id, b = bad.some((c) => c.step === p.id);
      const who = TYPES[p.type].person ? (p.who ? T(p.who) : T('Nobody yet')) : p.type === 'wait' ? (p.wait ? T(p.wait) : T('How long?'))
        : p.type === 'condition' && p.rule ? `${T(FIELDS[p.rule.field] || '')} ${p.rule.op} ${p.rule.value}` : T(TYPES[p.type].name);
      const outs = ports(s).filter((o) => o.step === p.id).map((o) => `<button type="button" class="bk-out" data-port="${o.id}" data-from="${s.id}" aria-label="${T('{name}: drag “{label}” to a station', { name: esc(say(s.name)), label: esc(T(o.label)) })}">${esc(T(o.label))}</button>`).join('');
      return `<li class="bk-step${pon ? ' on' : ''}${b ? ' bad' : ''}${p.draft ? ' draft' : ''}" data-step="${p.id}" tabindex="-1">
<span class="bk-g" aria-hidden="true">${IQ.glyph(k, { test: !!p.draft })}</span><span class="bk-n"><b dir="auto">${esc(say(p.name))}</b><span dir="auto">${esc(who)}</span>${outs}</span>${b ? `<span class="bk-x" aria-label="${T('Needs fixing')}">${IQ.glyph('failed')}</span>` : ''}
<span class="bk-grip" data-grip="${p.id}" aria-hidden="true"></span></li>`;
    }).join('');
    const isBad = bad.some((c) => c.at === s.id && !c.step);
    const name = esc(say(s.name));
    return `<section class="bk${on ? ' on' : ''}${isBad ? ' bad' : ''}${s.end ? ' end' : ''}${s.draft ? ' draft' : ''}" data-st="${s.id}" style="transform:translate(${s.x}px,${s.y}px)" aria-label="${T('Station {name}', { name })}">
<p class="bk-h" data-drag="${s.id}" tabindex="0"><b dir="auto">${name}</b>${start ? `<span class="bk-tag">${T('Start')}</span>` : ''}${s.end ? `<span class="bk-tag">${T('End')}</span>` : ''}</p>
<button type="button" class="bk-ring" data-port="next" data-from="${s.id}" aria-label="${T('{name}: drag to the station that comes next', { name })}"></button>
<ol class="bk-steps">${rows || `<li class="bk-empty">${T('Drop a block here')}</li>`}</ol></section>`;
  }

  // a polyline with rounded bends
  function rounded(pts, r) {
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [a, p, b] = [pts[i - 1], pts[i], pts[i + 1]];
      const l1 = Math.hypot(p[0] - a[0], p[1] - a[1]), l2 = Math.hypot(b[0] - p[0], b[1] - p[1]);
      if (!l1 || !l2) continue;
      const k1 = Math.min(r, l1 / 2) / l1, k2 = Math.min(r, l2 / 2) / l2;
      d += `L${(p[0] - (p[0] - a[0]) * k1).toFixed(1)} ${(p[1] - (p[1] - a[1]) * k1).toFixed(1)}Q${p[0]} ${p[1]} ${(p[0] + (b[0] - p[0]) * k2).toFixed(1)} ${(p[1] + (b[1] - p[1]) * k2).toFixed(1)}`;
    }
    const z = pts[pts.length - 1];
    return `${d}L${z[0]} ${z[1]}`;
  }
  // metro routing, ring to ring. Onward: straight, then 45° to the next station's height. A branch leaves at 45°
  // first. Backwards: out to the left of the ring, under the stations between, and up into the earlier ring.
  function route(kind, a, b, low) {
    const [ax, ay] = a, [bx, by] = b, dy = by - ay;
    const G = 20;  // track keeps to the gap left of a ring, clear of the steps hanging under it
    if (kind !== 'back' && bx > ax + 40) {
      if (Math.abs(dy) < 2) return [a, b];
      // a branch past the station's own steps can leave at 45°; otherwise it drops in the gap and runs under them
      if (kind === 'yes') return bx - ax >= BW + 24 + Math.abs(dy) ? [a, [ax + BW + 24, ay], [ax + BW + 24 + Math.abs(dy), by], b] : [a, [ax - G, ay], [ax - G, by], b];
      if (bx - ax >= Math.abs(dy) + 48 && dy > 0) return [a, [bx - 24 - Math.abs(dy), ay], [bx - 24, by], b];
      // onward to a station higher or close: along the gap just before it
      return [a, [bx - G, ay], [bx - G, by], b];
    }
    return [a, [ax - G, ay], [ax - G, low], [bx - G, low], [bx - G, by], b];
  }
  // a label sits over the route's longest level run, which is always clear of the steps; failing one, its longest run
  function labelAt(pts) {
    let best = -1, at = [pts[0][0], pts[0][1], false];
    for (const level of [true, false]) {
      for (let i = 1; i < pts.length; i++) {
        const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1];
        if (level && Math.abs(dy) > 1) continue;
        const l = Math.hypot(dx, dy);
        if (l > best) { best = l; at = [(pts[i][0] + pts[i - 1][0]) / 2, (pts[i][1] + pts[i - 1][1]) / 2, Math.abs(dx) < 1]; }
      }
      if (best > 0) break;
    }
    return at;
  }
  // the checks' button says how many things are left to fix
  function checksCount(n) {
    $('[data-checks-n]').innerHTML = n ? `${IQ.glyph('failed')}<span>${N(n, '{n} thing to fix', '{n} things to fix')}</span>` : `${IQ.glyph('struck')}<span>${T('The line is complete')}</span>`;
    $('[data-checks-n]').parentElement.classList.toggle('bad', !!n);
  }
  function render() {
    const bad = checks();
    blocksEl.innerHTML = line.stations.map((s) => block(s, bad)).join('');
    drawEdges();
    renderInspector(bad);
    renderChecks(bad);
    checksCount(bad.length);
    const steps = line.stations.reduce((a, s) => a + s.steps.length, 0);
    $('[data-state]').textContent = T('{stations} · {steps} · {connections}', {
      stations: N(line.stations.length, '{n} stations', '{n} stations'), steps: N(steps, '{n} steps', '{n} steps'), connections: N(line.edges.length, '{n} connections', '{n} connections') });
    $('[data-do="undo"]').disabled = !undo.length;
    $('[data-do="redo"]').disabled = !redo.length;
  }
  const ring = (sid) => { const s = st(sid); return s ? [s.x + RX, s.y + RY] : null; };
  const portXY = (sid) => ring(sid);
  const inXY = (sid) => ring(sid);
  const kindOfEdge = (e) => (e.port.endsWith(':change') ? 'back' : e.port.endsWith(':yes') ? 'yes' : 'next');
  // a way back runs under the stations it passes, and no lower
  const bottom = (s) => s.y + ($(`.bk[data-st="${s.id}"]`) || { offsetHeight: 160 }).offsetHeight;
  const lowBetween = (x1, x2) => Math.max(0, ...line.stations.filter((s) => s.x + BW >= Math.min(x1, x2) && s.x <= Math.max(x1, x2)).map(bottom)) + 28;
  let paths = {};
  function drawEdges(temp) {
    let svg = '', labels = '';
    paths = {};
    line.edges.forEach((e, i) => {
      const a = ring(e.from), b = ring(e.to);
      if (!a || !b) return;
      let kind = kindOfEdge(e);
      if (b[0] <= a[0] + 40) kind = 'back';
      const on = sel.kind === 'edge' && sel.id === e.id;
      const pts = route(kind, a, b, lowBetween(a[0], b[0]) + (i % 3) * 8), d = rounded(pts, 16);
      paths[e.id] = d;
      svg += `<path class="ed-hit" data-edge="${e.id}" d="${d}"/><path class="ed${kind === 'back' && e.port !== 'next' ? ' back' : ''}${on ? ' on' : ''}${e.draft ? ' draft' : ''}" d="${d}"/>`;
      if (test && test.walked.has(e.id)) svg += `<path class="ed walked" d="${d}"/>`;
      const label = esc(e.port.endsWith(':yes') ? T('Yes') : e.port.endsWith(':change') ? T('Change asked') : '');
      // beside a vertical run, above a level one
      if (label) { const [lx, ly, up] = labelAt(pts); labels += up ? `<text class="ed-l" x="${lx + 9}" y="${ly}" dominant-baseline="middle">${label}</text>` : `<text class="ed-l" x="${lx}" y="${ly - 9}" text-anchor="middle">${label}</text>`; }
    });
    if (temp) svg += `<path class="ed tmp" d="${rounded(route(temp.b[0] > temp.a[0] + 40 ? 'next' : 'back', temp.a, temp.b, lowBetween(temp.a[0], temp.b[0])), 16)}"/>`;
    edgesEl.innerHTML = `<g>${svg}${labels}</g>`;
    drawMini();
  }
  function applyView() {
    world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.z})`;
    $('[data-zoom]').textContent = `${Math.round(view.z * 100)}%`;
    drawMini();
  }

  // ---------- inspector ----------
  const field = (label, html, id) => `<div class="in-f"><label${id ? ` for="${id}"` : ''}>${label}</label>${html}</div>`;
  // a dropdown's options keep the English the line compares as their values; label() gives what each one shows
  const pick = (id, opts, val, attr, label) => `<select class="sw" id="${id}" ${attr}>${opts.map((o) => `<option value="${esc(o)}"${o === val ? ' selected' : ''}>${esc((label || T)(o)) || T('Choose')}</option>`).join('')}</select>`;
  function renderInspector(bad) {
    const el = $('[data-insp]');
    if (sel.kind === 'station' && st(sel.id)) {
      const s = st(sel.id), ins = line.edges.filter((e) => e.to === s.id).map((e) => say(st(e.from).name));
      const from = ins.length ? T('Jobs arrive from {names}.', { names: esc(ins.join(T(', '))) }) : s.id === line.start ? T('Every job starts here.') : T('No station hands on to this one yet.');
      el.innerHTML = `<p class="in-k">${T('Station')}</p>
${field(T('Name'), `<input class="sn" id="in-name" data-set="name" value="${esc(say(s.name))}" maxlength="32" autocomplete="off">`, 'in-name')}
<p class="hint">${from} ${N(s.steps.length, '{n} step.', '{n} steps.')}</p>
<label class="chk"><input type="checkbox" data-set="end"${s.end ? ' checked' : ''}><span>${T('The job ends here')}</span></label>
<div class="in-act"><button type="button" class="btn small" data-do="start"${s.id === line.start ? ' disabled' : ''}>${T('Start jobs here')}</button><button type="button" class="btn small" data-do="dup">${T('Duplicate')}</button><button type="button" class="btn small quiet" data-do="del">${T('Remove')}</button></div>
${issues(bad.filter((c) => c.at === s.id && !c.step))}`;
      return;
    }
    if (sel.kind === 'step' && stepAt(sel.id)) {
      const { s, p } = stepAt(sel.id), ty = TYPES[p.type];
      let f = field(T('Name'), `<input class="sn" id="in-sname" data-set="sname" value="${esc(say(p.name))}" maxlength="48" autocomplete="off">`, 'in-sname');
      f += field(T('Kind of block'), pick('in-type', Object.keys(TYPES), p.type, 'data-set="type"', typeLabel), 'in-type');
      if (ty.person) f += field(p.type === 'approval' ? T('Who approves') : T('Who does it'), pick('in-who', [''].concat(PEOPLE), p.who, 'data-set="who"'), 'in-who');
      if (p.type === 'approval') f += `<label class="chk"><input type="checkbox" data-set="change"${p.change ? ' checked' : ''}><span>${T('They can ask for a change, which sends the job back')}</span></label>`;
      if (ty.channel) f += field(T('By'), pick('in-ch', ['Email', 'WhatsApp', 'SMS'], p.channel || 'Email', 'data-set="channel"'), 'in-ch');
      if (ty.msg) f += field(T('Message'), `<textarea class="sn sn-t" id="in-msg" data-set="msg" rows="4">${esc(say(p.msg || ''))}</textarea><p class="in-vars">${VARS.map((v) => `<button type="button" class="var" data-var="${v}">${v}</button>`).join('')}</p>`, 'in-msg');
      if (ty.make) f += field(T('What it creates'), pick('in-make', ['An invoice', 'A shopping list', 'A task', 'A delivery note'], p.make || 'An invoice', 'data-set="make"'), 'in-make');
      if (ty.url) f += field(T('Address'), `<input class="sn" id="in-url" data-set="url" value="${esc(p.url || '')}" placeholder="https://" inputmode="url" spellcheck="false" dir="ltr">`, 'in-url');
      if (ty.wait) f += field(T('How long'), pick('in-wait', ['An hour', 'A day', 'Two days', 'Three days', 'A week'], p.wait || 'A day', 'data-set="wait"'), 'in-wait');
      if (ty.rule) {
        const r = p.rule || { field: 'people', op: '>', value: '' };
        f += `<div class="in-f"><span class="in-l">${T('Jobs go the Yes way when')}</span><div class="in-rule">${pick('in-rf', Object.keys(FIELDS), r.field, `data-set="rf" aria-label="${T('Field to compare')}"`, (k) => T(FIELDS[k]))}
${pick('in-ro', ['>', '≥', '=', '<'], r.op, `data-set="ro" aria-label="${T('Comparison')}"`, (o) => o)}<input class="sn num" type="number" data-set="rv" value="${esc(r.value)}" aria-label="${T('Value')}"></div></div>`;
      }
      if (!ty.person) f += `<label class="chk"><input type="checkbox" data-set="retry"${p.retry ? ' checked' : ''}><span>${T('If it fails, try again three times, then tell {name}', { name: T('Hala') })}</span></label>`;
      el.innerHTML = `<p class="in-k"><span class="bk-g" aria-hidden="true">${IQ.glyph(ty.kind)}</span>${T('{type} · in {station}', { type: esc(T(ty.name)), station: esc(say(s.name)) })}</p>${f}
<div class="in-act"><button type="button" class="btn small" data-do="sdup">${T('Duplicate')}</button><button type="button" class="btn small quiet" data-do="sdel">${T('Remove')}</button></div>${issues(bad.filter((c) => c.step === p.id))}`;
      return;
    }
    if (sel.kind === 'edge') {
      const e = line.edges.find((x) => x.id === sel.id);
      if (e) {
        const label = ports(st(e.from)).find((p) => p.id === e.port);
        el.innerHTML = `<p class="in-k">${T('Connection')}</p><p>${T('{from} {label} → {to}', { from: esc(say(st(e.from).name)), label: `<b>${esc(label ? T(label.label) : '')}</b>`, to: esc(say(st(e.to).name)) })}</p><div class="in-act"><button type="button" class="btn small quiet" data-do="edel">${T('Remove the connection')}</button></div>`;
        return;
      }
    }
    el.innerHTML = `<p class="in-k">${T('Nothing selected')}</p><p class="hint">${T('Select a station, a step or a connection to change it.')}</p>`;
  }
  const issues = (list) => (list.length ? `<ul class="in-bad">${list.map((c) => `<li>${IQ.glyph('failed')}<span>${esc(c.text)}</span></li>`).join('')}</ul>` : '');
  function renderChecks(bad) {
    $('[data-checks]').innerHTML = `<h2>${T('Checks')}</h2>${bad.length ? `<ul>${bad.map((c, i) => `<li><button type="button" class="link" data-goto="${i}">${esc(c.text)}</button></li>`).join('')}</ul>` : `<p>${T('Every station has a way out, every step has someone or something to do it.')}</p>`}`;
  }

  // ---------- pointer: pan, move blocks, connect, drag from the library, move steps ----------
  const toWorld = (cx, cy) => { const r = canvas.getBoundingClientRect(); return [(cx - r.left - view.x) / view.z, (cy - r.top - view.y) / view.z]; };
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const port = e.target.closest('[data-port]'), grip = e.target.closest('[data-grip]'), head = e.target.closest('[data-drag]');
    const stepEl = e.target.closest('[data-step]'), edge = e.target.closest('[data-edge]');
    if (port) { drag = { type: 'link', from: port.dataset.from, port: port.dataset.port }; }
    else if (grip) { drag = { type: 'step', id: grip.dataset.grip, moved: false, x: e.clientX, y: e.clientY }; }
    else if (head) { const s = st(head.dataset.drag); drag = { type: 'move', id: s.id, ox: s.x, oy: s.y, x: e.clientX, y: e.clientY, moved: false }; select({ kind: 'station', id: s.id }); }
    else if (stepEl) { select({ kind: 'step', id: stepEl.dataset.step }); return; }
    else if (edge) { select({ kind: 'edge', id: edge.dataset.edge }); return; }
    else if (e.target.closest('.bk')) { select({ kind: 'station', id: e.target.closest('.bk').dataset.st }); return; }
    else if (!e.target.closest('[data-checks]')) { drag = { type: 'pan', ox: view.x, oy: view.y, x: e.clientX, y: e.clientY }; canvas.classList.add('panning'); }
    if (drag) try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* a pointer that cannot be captured still drags */ }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (drag.type === 'pan') { view.x = drag.ox + e.clientX - drag.x; view.y = drag.oy + e.clientY - drag.y; applyView(); }
    if (drag.type === 'move') {
      const s = st(drag.id);
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 3) { drag.moved = true; commit(); }
      if (!drag.moved) return;
      // blocks settle on a quarter-beat grid
      s.x = Math.round((drag.ox + (e.clientX - drag.x) / view.z) / 8) * 8;
      s.y = Math.round((drag.oy + (e.clientY - drag.y) / view.z) / 8) * 8;
      const b = $(`.bk[data-st="${s.id}"]`);
      b.style.transform = `translate(${s.x}px,${s.y}px)`;
      drawEdges();
    }
    if (drag.type === 'link') { drawEdges({ a: ring(drag.from), b: toWorld(e.clientX, e.clientY) }); }
    if (drag.type === 'step') {
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4) { drag.moved = true; ghost(say(stepAt(drag.id).p.name)); }
      if (drag.moved) moveGhost(e.clientX, e.clientY);
    }
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    canvas.classList.remove('panning');
    if (d.type === 'move' && d.moved) changed(T('{name} moved', { name: say(st(d.id).name) }));
    if (d.type === 'link') {
      const target = hitStation(e.clientX, e.clientY);
      if (target && target !== d.from) {
        commit();
        line.edges = line.edges.filter((x) => !(x.from === d.from && x.port === d.port));
        line.edges.push({ id: nid('e'), from: d.from, port: d.port, to: target });
        changed(T('{from} now hands on to {to}', { from: say(st(d.from).name), to: say(st(target).name) }));
      } else drawEdges();
    }
    if (d.type === 'step' && d.moved) { endGhost(); dropStep(d.id, e.clientX, e.clientY); }
  });
  function hitStation(cx, cy) {
    const el = document.elementsFromPoint(cx, cy).find((x) => x.closest && x.closest('.bk'));
    return el ? el.closest('.bk').dataset.st : null;
  }
  function hitStep(cx, cy) {
    const el = document.elementsFromPoint(cx, cy).find((x) => x.closest && x.closest('[data-step]'));
    return el ? el.closest('[data-step]').dataset.step : null;
  }
  function dropStep(id, cx, cy) {
    const tgt = hitStation(cx, cy);
    if (!tgt) return;
    const before = hitStep(cx, cy);
    commit();
    const { s, p } = stepAt(id);
    s.steps = s.steps.filter((x) => x.id !== id);
    const to = st(tgt);
    const i = before && before !== id ? to.steps.findIndex((x) => x.id === before) : -1;
    if (i >= 0) to.steps.splice(i, 0, p); else to.steps.push(p);
    sel = { kind: 'step', id };
    changed(T('{step} moved to {station}', { step: say(p.name), station: say(to.name) }));
  }
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) zoomAt(e.clientX, e.clientY, view.z * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
    else { view.x -= e.deltaX; view.y -= e.deltaY; applyView(); }
  }, { passive: false });
  function zoomAt(cx, cy, z) {
    const r = canvas.getBoundingClientRect(), nz = Math.min(2, Math.max(0.25, z));
    const wx = (cx - r.left - view.x) / view.z, wy = (cy - r.top - view.y) / view.z;
    view.z = nz; view.x = cx - r.left - wx * nz; view.y = cy - r.top - wy * nz;
    applyView();
  }
  function fit() {
    const r = canvas.getBoundingClientRect();
    const xs = line.stations.map((s) => s.x), ys = line.stations.map((s) => s.y);
    const w = Math.max(...xs) + BW - Math.min(...xs), h = Math.max(...ys) + 260 - Math.min(...ys);
    view.z = Math.min(1, Math.max(0.25, Math.min((r.width - 64) / w, (r.height - 64) / h)));
    view.x = 32 - Math.min(...xs) * view.z; view.y = 32 - Math.min(...ys) * view.z;
    applyView();
  }

  // the library: a block dragged in becomes a step of the station it lands on, or a new station on the canvas
  let gh = null;
  function ghost(text) { gh = document.createElement('div'); gh.className = 'bd-ghost'; gh.textContent = text; document.body.append(gh); }
  function moveGhost(x, y) { if (gh) gh.style.transform = `translate(${x + 12}px, ${y + 12}px)`; }
  function endGhost() { if (gh) gh.remove(); gh = null; }
  const newStep = (type) => {
    const ty = TYPES[type];
    return { id: nid('s'), type, name: ty.name, who: '', msg: ty.msg ? 'Hello {client.name}, ' : '', channel: 'Email', make: ty.make ? 'An invoice' : '', url: '', wait: ty.wait ? 'A day' : '', rule: ty.rule ? { field: 'people', op: '>', value: '' } : null, change: false, retry: !ty.person };
  };
  function addFromLibrary(type, cx, cy) {
    const tgt = cx == null ? (sel.kind === 'station' ? sel.id : sel.kind === 'step' ? stepAt(sel.id).s.id : null) : hitStation(cx, cy);
    commit();
    if (type === 'station' || !tgt) {
      const [wx, wy] = cx == null ? toWorld(canvas.getBoundingClientRect().left + 120, canvas.getBoundingClientRect().top + 120) : toWorld(cx, cy);
      const s = { id: nid('t'), name: 'New station', x: Math.round(wx / 8) * 8, y: Math.round(wy / 8) * 8, end: false, steps: type === 'station' ? [] : [newStep(type)] };
      line.stations.push(s);
      sel = s.steps.length ? { kind: 'step', id: s.steps[0].id } : { kind: 'station', id: s.id };
      changed(s.steps.length ? T('New station with {type}', { type: T(TYPES[type].name) }) : T('New station'));
    } else {
      const p = newStep(type);
      st(tgt).steps.push(p);
      sel = { kind: 'step', id: p.id };
      changed(T('{type} added to {station}', { type: T(TYPES[type].name), station: say(st(tgt).name) }));
    }
    const i = $('#in-sname') || $('#in-name');
    if (i) { i.focus(); i.select(); }
  }
  let lib = null;
  $('.bd-lib').addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-lib]');
    if (!b || e.button !== 0) return;
    lib = { type: b.dataset.lib, x: e.clientX, y: e.clientY, moved: false, el: b };
    try { b.setPointerCapture(e.pointerId); } catch (err) { /* still drags */ }
  });
  $('.bd-lib').addEventListener('pointermove', (e) => {
    if (!lib) return;
    if (!lib.moved && Math.hypot(e.clientX - lib.x, e.clientY - lib.y) > 4) { lib.moved = true; ghost(T(lib.type === 'station' ? 'Station' : TYPES[lib.type].name)); }
    if (lib.moved) {
      moveGhost(e.clientX, e.clientY);
      $$('.bk.drop').forEach((x) => x.classList.remove('drop'));
      const t = hitStation(e.clientX, e.clientY);
      if (t && lib.type !== 'station') $(`.bk[data-st="${t}"]`).classList.add('drop');
    }
  });
  $('.bd-lib').addEventListener('pointerup', (e) => {
    if (!lib) return;
    const l = lib; lib = null;
    $$('.bk.drop').forEach((x) => x.classList.remove('drop'));
    endGhost();
    const over = document.elementsFromPoint(e.clientX, e.clientY).some((x) => x === canvas || canvas.contains(x));
    if (l.moved && over) addFromLibrary(l.type, e.clientX, e.clientY);
  });
  // a click (or Enter) on a library block adds it to the selected station
  $('.bd-lib').addEventListener('click', (e) => {
    const b = e.target.closest('[data-lib]');
    if (b && e.detail === 0) addFromLibrary(b.dataset.lib);
  });
  $('.bd-lib').addEventListener('dblclick', (e) => { const b = e.target.closest('[data-lib]'); if (b) addFromLibrary(b.dataset.lib); });

  function select(s) {
    sel = s;
    $$('.bk.on, .bk-step.on').forEach((x) => x.classList.remove('on'));
    if (s.kind === 'station') { const b = $(`.bk[data-st="${s.id}"]`); if (b) b.classList.add('on'); }
    if (s.kind === 'step') { const b = $(`[data-step="${s.id}"]`); if (b) b.classList.add('on'); }
    drawEdges();
    renderInspector(checks());
  }

  // ---------- inspector edits ----------
  let typing = null;
  root.addEventListener('input', (e) => {
    const t = e.target, k = t.dataset.set;
    if (!k || !t.closest('[data-insp]')) return;
    if (!typing) { commit(); typing = setTimeout(() => { typing = null; }, 800); }
    const s = sel.kind === 'station' ? st(sel.id) : null, p = sel.kind === 'step' ? stepAt(sel.id).p : null;
    if (k === 'name') s.name = t.value || 'Untitled station';
    if (k === 'sname') p.name = t.value || TYPES[p.type].name;
    if (k === 'msg') p.msg = t.value;
    if (k === 'url') p.url = t.value.trim();
    if (k === 'rv') p.rule.value = t.value === '' ? '' : Number(t.value);
    soft();
  });
  root.addEventListener('change', (e) => {
    const t = e.target, k = t.dataset.set;
    if (!k || !t.closest('[data-insp]')) return;
    commit();
    const s = sel.kind === 'station' ? st(sel.id) : null, p = sel.kind === 'step' ? stepAt(sel.id).p : null;
    if (k === 'end') s.end = t.checked;
    if (k === 'type') { const fresh = newStep(t.value); Object.assign(p, { ...fresh, id: p.id, name: p.name === TYPES[p.type].name ? fresh.name : p.name }); }
    if (k === 'who') p.who = t.value;
    if (k === 'change') { p.change = t.checked; if (!t.checked) line.edges = line.edges.filter((x) => x.port !== `${p.id}:change`); }
    if (k === 'channel') p.channel = t.value;
    if (k === 'make') p.make = t.value;
    if (k === 'wait') p.wait = t.value;
    if (k === 'rf') p.rule.field = t.value;
    if (k === 'ro') p.rule.op = t.value;
    if (k === 'retry') p.retry = t.checked;
    const keep = t.id;
    changed();
    refocus(keep);
  });
  // the inspector was drawn again: the focus returns to the field just used, or to its dropdown's button
  function refocus(id) {
    const el = id && document.getElementById(id);
    if (!el) return;
    if (el.tagName === 'SELECT' && window.UI) UI.dropdown(el);
    (document.getElementById(`${id}-dd`) || el).focus();
  }
  // typing updates the blocks without rebuilding the field being typed in
  function soft() {
    const bad = checks();
    const keep = document.activeElement && document.activeElement.id;
    const pos = document.activeElement && document.activeElement.selectionStart;
    blocksEl.innerHTML = line.stations.map((s) => block(s, bad)).join('');
    drawEdges();
    renderChecks(bad);
    checksCount(bad.length);
    try { sessionStorage.setItem('iqaa-build', JSON.stringify(line)); } catch (e) { /* kept for this page */ }
    const el = keep && document.getElementById(keep);
    if (el && el !== document.activeElement) { el.focus(); if (pos != null && el.setSelectionRange) el.setSelectionRange(pos, pos); }
  }

  // ---------- commands ----------
  function del(kind) {
    commit();
    if (kind === 'station') {
      const s = st(sel.id);
      line.stations = line.stations.filter((x) => x !== s);
      line.edges = line.edges.filter((x) => x.from !== s.id && x.to !== s.id);
      if (line.start === s.id && line.stations[0]) line.start = line.stations[0].id;
      sel = { kind: 'none' };
      changed(T('{name} removed. Ctrl+Z brings it back.', { name: say(s.name) }));
    } else if (kind === 'step') {
      const { s, p } = stepAt(sel.id);
      s.steps = s.steps.filter((x) => x !== p);
      line.edges = line.edges.filter((x) => !x.port.startsWith(`${p.id}:`));
      sel = { kind: 'station', id: s.id };
      changed(T('{name} removed. Ctrl+Z brings it back.', { name: say(p.name) }));
    } else if (kind === 'edge') {
      line.edges = line.edges.filter((x) => x.id !== sel.id);
      sel = { kind: 'none' };
      changed(T('Connection removed'));
    }
  }
  function dup() {
    commit();
    if (sel.kind === 'station') {
      const s = st(sel.id), c = clone(s);
      c.id = nid('t'); c.name = `${s.name} (copy)`; c.x += 32; c.y += 32; c.end = false;
      c.steps.forEach((p) => { p.id = nid('s'); });
      line.stations.push(c); sel = { kind: 'station', id: c.id };
      changed(T('{name} duplicated', { name: say(s.name) }));
    } else if (sel.kind === 'step') {
      const { s, p } = stepAt(sel.id), c = clone(p);
      c.id = nid('s');
      s.steps.splice(s.steps.indexOf(p) + 1, 0, c); sel = { kind: 'step', id: c.id };
      changed(T('{name} duplicated', { name: say(p.name) }));
    }
  }
  function history(from, to, word) {
    if (!from.length) return;
    to.push(clone(line));
    line = from.pop();
    if (sel.kind === 'station' && !st(sel.id)) sel = { kind: 'none' };
    if (sel.kind === 'step' && !stepAt(sel.id)) sel = { kind: 'none' };
    changed(word);
  }
  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    const d = t.dataset.do;
    if (t.dataset.var) {
      const ta = $('#in-msg');
      const a = ta.selectionStart ?? ta.value.length;
      ta.value = ta.value.slice(0, a) + t.dataset.var + ta.value.slice(ta.selectionEnd ?? a);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.focus(); ta.setSelectionRange(a + t.dataset.var.length, a + t.dataset.var.length);
      return;
    }
    if (t.dataset.goto) {
      const c = checks()[+t.dataset.goto];
      if (c && c.at) { sel = c.step ? { kind: 'step', id: c.step } : { kind: 'station', id: c.at }; centre(c.at); render(); }
      return;
    }
    if (!d) return;
    if (d === 'undo') history(undo, redo, T('Undone'));
    if (d === 'redo') history(redo, undo, T('Redone'));
    if (d === 'in') zoomAt(canvas.getBoundingClientRect().left + canvas.clientWidth / 2, canvas.getBoundingClientRect().top + canvas.clientHeight / 2, view.z * 1.2);
    if (d === 'out') zoomAt(canvas.getBoundingClientRect().left + canvas.clientWidth / 2, canvas.getBoundingClientRect().top + canvas.clientHeight / 2, view.z / 1.2);
    if (d === 'reset') zoomAt(canvas.getBoundingClientRect().left + canvas.clientWidth / 2, canvas.getBoundingClientRect().top + canvas.clientHeight / 2, 1);
    if (d === 'fit') fit();
    if (d === 'checks') { const c = $('[data-checks]'); c.hidden = !c.hidden; t.setAttribute('aria-expanded', String(!c.hidden)); }
    if (d === 'del') del('station');
    if (d === 'sdel') del('step');
    if (d === 'edel') del('edge');
    if (d === 'dup' || d === 'sdup') dup();
    if (d === 'start') { commit(); line.start = sel.id; changed(T('Jobs now start at {name}', { name: say(st(sel.id).name) })); }
  });
  function centre(id) {
    const s = st(id);
    view.x = canvas.clientWidth / 2 - (s.x + BW / 2) * view.z; view.y = canvas.clientHeight / 2 - (s.y + 80) * view.z;
    applyView();
  }

  // ---------- keyboard ----------
  // a field, or a dropdown's button (it takes letters to jump and the arrows), keeps its keys from the canvas shortcuts
  const inField = () => /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || !!document.activeElement.closest('.dd');
  document.addEventListener('keydown', (e) => {
    const typingIn = inField();
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z' && !typingIn) { e.preventDefault(); if (e.shiftKey) history(redo, undo, T('Redone')); else history(undo, redo, T('Undone')); return; }
    if (mod && e.key.toLowerCase() === 'y' && !typingIn) { e.preventDefault(); history(redo, undo, T('Redone')); return; }
    if (typingIn) return;
    if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); dup(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && sel.kind !== 'none') { e.preventDefault(); del(sel.kind); return; }
    if (e.key === 'f' || e.key === 'F') { fit(); return; }
    if (e.key === 't' || e.key === 'T') { tidy(); return; }
    if (e.key === '+' || e.key === '=') { zoomAt(canvas.getBoundingClientRect().left + canvas.clientWidth / 2, canvas.getBoundingClientRect().top + canvas.clientHeight / 2, view.z * 1.2); return; }
    if (e.key === '-') { zoomAt(canvas.getBoundingClientRect().left + canvas.clientWidth / 2, canvas.getBoundingClientRect().top + canvas.clientHeight / 2, view.z / 1.2); return; }
    // arrows nudge the selected station one grid step, or eight with Shift
    if (sel.kind === 'station' && e.key.startsWith('Arrow')) {
      e.preventDefault();
      commit();
      const s = st(sel.id), n = e.shiftKey ? 64 : 8;
      if (e.key === 'ArrowLeft') s.x -= n; if (e.key === 'ArrowRight') s.x += n; if (e.key === 'ArrowUp') s.y -= n; if (e.key === 'ArrowDown') s.y += n;
      changed();
      const h = $(`.bk[data-st="${s.id}"] .bk-h`); if (h) h.focus();
    }
  });
  canvas.addEventListener('focusin', (e) => { const h = e.target.closest('[data-drag]'); if (h && !(sel.kind === 'station' && sel.id === h.dataset.drag)) select({ kind: 'station', id: h.dataset.drag }); });

  // ---------- Tidy: the line laid out as its metro map, on the beat ----------
  function tidy() {
    commit();
    const main = [], seen = new Set();
    let at = line.start;
    while (at && !seen.has(at)) { seen.add(at); main.push(at); const e = line.edges.find((x) => x.from === at && x.port === 'next'); at = e && e.to; }
    main.forEach((id, i) => { const s = st(id); s.x = 80 + i * 288; s.y = 120; });
    // stations off the main line hang below the stretch they bridge, one lane per branch
    let lane = 0;
    line.stations.filter((s) => !seen.has(s.id)).forEach((s) => {
      const into = line.edges.find((e) => e.to === s.id && seen.has(e.from));
      const out = line.edges.find((e) => e.from === s.id && e.port === 'next' && seen.has(e.to));
      const a = into ? st(into.from).x : 80, b = out ? st(out.to).x : a + 300;
      s.x = Math.round(((a + b) / 2) / 8) * 8; s.y = 470 + lane * 330; lane++;
    });
    canvas.classList.add('tidying');
    changed(T('The line is laid out as a map'));
    setTimeout(() => { canvas.classList.remove('tidying'); fit(); }, M.half);
  }

  // ---------- the minimap: every block, the track, and the view as a violet frame ----------
  function bounds() {
    const xs = line.stations.map((s) => s.x), ys = line.stations.map((s) => s.y);
    return { x: Math.min(...xs) - 80, y: Math.min(...ys) - 80, w: Math.max(...xs) + BW + 80 - (Math.min(...xs) - 80), h: Math.max(...ys) + 360 - (Math.min(...ys) - 80) };
  }
  function drawMini() {
    const svg = $('[data-mini-svg]');
    if (!svg) return;
    const b = bounds();
    svg.setAttribute('viewBox', `${b.x} ${b.y} ${b.w} ${b.h}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const v = { x: -view.x / view.z, y: -view.y / view.z, w: canvas.clientWidth / view.z, h: canvas.clientHeight / view.z };
    svg.innerHTML = Object.values(paths).map((d) => `<path class="mm-e" d="${d}"/>`).join('')
      + line.stations.map((s) => `<rect class="mm-b${sel.kind === 'station' && sel.id === s.id ? ' on' : ''}" x="${s.x}" y="${s.y}" width="${BW}" height="${($(`.bk[data-st="${s.id}"]`) || { offsetHeight: 160 }).offsetHeight}" rx="16"/>`).join('')
      + `<rect class="mm-v" x="${v.x}" y="${v.y}" width="${v.w}" height="${v.h}" rx="12"/>`;
  }
  $('[data-mini]').addEventListener('pointerdown', (e) => {
    const svg = $('[data-mini-svg]'), r = svg.getBoundingClientRect(), b = bounds();
    const k = Math.min(r.width / b.w, r.height / b.h), ox = (r.width - b.w * k) / 2, oy = (r.height - b.h * k) / 2;
    const go = (ev) => {
      const wx = b.x + (ev.clientX - r.left - ox) / k, wy = b.y + (ev.clientY - r.top - oy) / k;
      view.x = canvas.clientWidth / 2 - wx * view.z; view.y = canvas.clientHeight / 2 - wy * view.z; applyView();
    };
    go(e);
    const mv = (ev) => go(ev), up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
    e.stopPropagation();
  });

  // ---------- the test job: a grey stop walks the blocks, step by step, and sends nothing ----------
  let test = null;
  const token = document.createElement('span');
  token.className = 'bd-token'; token.hidden = true; world.append(token);
  const wait = (ms) => new Promise((r) => setTimeout(r, Beats.reduce() || (test && test.skip) ? 0 : ms));
  function plan(people, takeBack) {
    const seq = [], taken = new Set();
    let at = line.start, guard = 0;
    const value = { people, total: people * 40, days: 4 };
    while (at && guard++ < 60) {
      const s = st(at);
      if (!s) break;
      let leave = null;
      for (const p of s.steps) {
        seq.push({ type: 'step', s: s.id, p: p.id, text: T('{station}: {step}', { station: say(s.name), step: say(p.name) }) });
        if (p.type === 'condition' && p.rule) {
          const v = value[p.rule.field], n = Number(p.rule.value);
          const yes = p.rule.op === '>' ? v > n : p.rule.op === '≥' ? v >= n : p.rule.op === '<' ? v < n : v === n;
          seq.push({ type: 'note', text: T('{step} {answer}: {value} {op} {limit}', { step: say(p.name), answer: T(yes ? 'Yes' : 'No'), value: v, op: p.rule.op, limit: n }) });
          if (yes && line.edges.some((e) => e.from === s.id && e.port === `${p.id}:yes`)) { leave = `${p.id}:yes`; break; }
        }
        if (p.type === 'approval' && p.change && takeBack && !taken.has(p.id) && line.edges.some((e) => e.from === s.id && e.port === `${p.id}:change`)) {
          taken.add(p.id); leave = `${p.id}:change`;
          seq.push({ type: 'note', text: T('{step}: test answer, a change is asked', { step: say(p.name) }) });
          break;
        }
      }
      const e = line.edges.find((x) => x.from === s.id && x.port === (leave || 'next'));
      if (!e) { seq.push({ type: 'end', s: s.id }); break; }
      seq.push({ type: 'hop', e: e.id });
      at = e.to;
    }
    return seq;
  }
  function travel(d) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    edgesEl.querySelector('g').append(p);
    const len = p.getTotalLength(), n = Math.max(2, Math.ceil(len / 14));
    const frames = Array.from({ length: n + 1 }, (_, i) => { const q = p.getPointAtLength((len * i) / n); return { transform: `translate(${q.x}px, ${q.y}px)` }; });
    p.remove();
    token.style.transform = frames[n].transform;
    if (Beats.reduce() || test.skip) return Promise.resolve();
    return token.animate(frames, { duration: Math.min(M.beat * 2, Math.max(M.half, len * 2)), easing: M.ease_move }).finished.catch(() => {});
  }
  async function runTest() {
    test = { walked: new Set(), skip: false };
    const people = Math.max(1, +$('[data-t-people]').value || 40), back = $('[data-t-back]').checked;
    const seq = plan(people, back), now = $('[data-t-now]');
    const s0 = st(line.start);
    token.hidden = false;
    token.style.transform = `translate(${s0.x + RX}px, ${s0.y + RY}px)`;
    let steps = 0;
    for (const ev of seq) {
      if (!test) return;
      $$('.bk-step.here').forEach((x) => x.classList.remove('here'));
      if (ev.type === 'step') {
        const row = $(`[data-step="${ev.p}"]`);
        if (row) row.classList.add('here');
        steps++;
        now.textContent = T('{text} · not sent: test', { text: ev.text });
        await wait(M.quarter);
      } else if (ev.type === 'note') { now.textContent = ev.text; await wait(M.quarter * 2); }
      else if (ev.type === 'hop') { test.walked.add(ev.e); drawEdges(); await travel(paths[ev.e]); }
      else if (ev.type === 'end') now.textContent = N(steps, 'The test job reached {name} after {n} steps. Nothing was sent.', 'The test job reached {name} after {n} steps. Nothing was sent.', { name: say(st(ev.s).name) });
    }
    if (seq.length && seq[seq.length - 1].type !== 'end') now.textContent = N(steps, 'The test job stopped after {n} steps: a station had no way on. See the checks.', 'The test job stopped after {n} steps: a station had no way on. See the checks.');
  }
  function closeTest() {
    test = null; token.hidden = true;
    $$('.bk-step.here').forEach((x) => x.classList.remove('here'));
    $('[data-testbar]').hidden = true;
    drawEdges();
  }
  $('[data-test-set]').addEventListener('submit', (e) => { e.preventDefault(); if (test) test.skip = true; setTimeout(runTest, 0); });

  // ---------- Watar: a sentence becomes a draft, drawn in the dashed grey pen until a person accepts it ----------
  const EXAMPLES = [
    'If the client does not answer in two days, remind them.',
    'Orders over 50 people need Hala’s approval before buying.',
    'Send the client a WhatsApp when Yusuf delivers.',
  ];
  // an example keeps its English sentence, which is what Watar reads when it is chosen in any language
  $('[data-wt-ex]').innerHTML = EXAMPLES.map((x) => `<button type="button" data-ex="${esc(x)}">${esc(T(x))}</button>`).join('');
  const NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, a: 1 };
  // A request written in Arabic or Turkish is read through a few of its words, turned into the English ones the
  // drafting below looks for: a length, a number of people, remind, approve, buy, send, a channel, a station's work.
  const WORDS = {
    ar: [[/(?:يومين|يومان)/g, ' two days '], [/(?:ثلاثة|ثلاث) أيام/g, ' three days '], [/(\d+)\s*(?:أيام|يوما|يوم)/g, ' $1 days '],
      [/(?:أسبوع|اسبوع)/g, ' 1 week '], [/ساعة/g, ' 1 hour '], [/يوم/g, ' a day '],
      [/(?:أكثر من|اكثر من|فوق|(?:يزيد|تزيد|زاد)(?: [^\d\s]+){0,3} (?:على|عن))\s*(\d+)\s*(?:شخصا|شخص|أشخاص|اشخاص|ضيفا|ضيف)?/g, ' over $1 people '],
      [/(?:يذكر|تذكير|ذكر|نذكر)/g, ' remind '], [/(?:موافق|يوافق|توافق|اعتماد|يعتمد)/g, ' approve '], [/(?:قبل الشراء|الشراء|شراء)/g, ' before buying '],
      [/(?:واتساب|واتس اب)/g, ' whatsapp '], [/(?:رسالة نصية|رسائل قصيرة)/g, ' sms '], [/بريد/g, ' email '], [/(?:أرسل|ارسل|إرسال|ارسال|رسالة)/g, ' send '],
      [/(?:يوصل|توصيل|يسلم|تسليم)/g, ' deliver '], [/فاتورة/g, ' invoice '], [/(?:يحضر|تحضير|طبخ)/g, ' prepare ']],
    tr: [[/(\d+)\s*kişiden\s*(?:fazla|çok)/g, ' over $1 people '], [/(\d+)\s*kişinin\s*üzerinde/g, ' over $1 people '],
      [/iki gün/g, ' two days '], [/üç gün/g, ' three days '], [/bir gün/g, ' a day '], [/(\d+)\s*gün/g, ' $1 days '], [/(?:bir )?saat/g, ' 1 hour '], [/(?:bir )?hafta/g, ' 1 week '],
      [/hatırlat/g, ' remind '], [/onay/g, ' approve '], [/(?:satın almadan önce|satın al)/g, ' before buying '], [/(?:gönder|mesaj)/g, ' send '],
      [/teslim/g, ' deliver '], [/fatura/g, ' invoice '], [/(?:hazırla|pişir)/g, ' prepare ']],
  };
  // Arabic-Indic digits are read as the digits the rules look for
  const read = (t) => (WORDS[I18N.lang] || []).reduce((s, [re, to]) => s.replace(re, to), t.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const findStation = (re) => line.stations.find((s) => re.test(s.name)) || (sel.kind === 'station' && st(sel.id)) || line.stations[0];
  function draft(text) {
    const t = read(text.toLowerCase()), made = [];
    const clientSt = line.stations.find((s) => s.steps.some((p) => p.type === 'approval' && p.who === 'The client')) || findStation(/approv/i);
    // "remind ... in two days": a wait, then a reminder, at the client's approval
    if (/remind|nudge/.test(t)) {
      const m = /(\d+|one|two|three|four|five|a)\s+(day|days|hour|hours|week)/.exec(t);
      const n = m ? (NUM[m[1]] || +m[1]) : 2, unit = m ? m[2].replace(/s$/, '') : 'day';
      const label = unit === 'hour' ? 'An hour' : unit === 'week' ? 'A week' : ({ 1: 'A day', 2: 'Two days', 3: 'Three days' }[n] || 'Two days');
      const w = newStep('wait'); w.name = `Wait ${label.toLowerCase()}`; w.wait = label; w.draft = true;
      const r = newStep('remind'); r.name = 'Remind the client'; r.msg = 'Hello {client.name}, a reminder about {order.title}: your quote is waiting at {quote.link}.'; r.draft = true;
      clientSt.steps.push(w, r);
      made.push(T('a wait of {time} and a reminder in {station}', { time: T(label.toLowerCase().replace(/^an? /, 'one ')), station: say(clientSt.name) }));
    }
    // "over N people ... approval": a condition and an owner's approval on a branch that rejoins
    const over = /(over|more than|above)\s+(\d+)\s+people/.exec(t);
    if (over && /approv|check|sign/.test(t)) {
      const from = /before buying|buy/.test(t) ? (line.edges.find((e) => e.port === 'next' && /buy/i.test(st(e.to).name)) || {}).from : null;
      const s = (from && st(from)) || clientSt;
      const who = PEOPLE.find((p) => t.includes(p.toLowerCase()) || t.includes(T(p).toLowerCase())) || 'Hala';
      const c = newStep('condition'); c.name = `Over ${over[2]} people?`; c.rule = { field: 'people', op: '>', value: +over[2] }; c.draft = true;
      s.steps.push(c);
      const next = line.edges.find((e) => e.from === s.id && e.port === 'next');
      const a = newStep('approval'); a.name = `${who} approves the big order`; a.who = who; a.draft = true;
      const ns = { id: nid('t'), name: `${who}’s approval`, x: s.x + 150, y: s.y + 420, end: false, draft: true, steps: [a] };
      line.stations.push(ns);
      line.edges.push({ id: nid('e'), from: s.id, port: `${c.id}:yes`, to: ns.id, draft: true });
      if (next) line.edges.push({ id: nid('e'), from: ns.id, port: 'next', to: next.to, draft: true });
      made.push(N(+over[2], 'a condition in {station} and a new station where {name} approves orders over {n} people', 'a condition in {station} and a new station where {name} approves orders over {n} people', { station: say(s.name), name: T(who) }));
    }
    // "send ... when X delivers": a message in that station
    const ch = /whatsapp/.test(t) ? 'WhatsApp' : /sms|text/.test(t) ? 'SMS' : /email|mail/.test(t) ? 'Email' : null;
    if (/send|message|whatsapp|sms|email/.test(t) && !/remind/.test(t)) {
      const s = /deliver/.test(t) ? findStation(/deliver/i) : /invoice/.test(t) ? findStation(/invoice/i) : /prepar|cook/.test(t) ? findStation(/prepar/i) : (sel.kind === 'station' && st(sel.id)) || findStation(/deliver/i);
      const m = newStep('send'); m.name = `Send the client a ${ch || 'message'}`; m.channel = ch || 'Email'; m.draft = true;
      m.msg = /deliver/.test(t) ? 'Hello {client.name}, {order.title} has been delivered. Enjoy, from all of us at Sufra.' : 'Hello {client.name}, an update on {order.title}.';
      s.steps.push(m);
      made.push(T(`a ${ch || 'message'} to the client in {station}`, { station: say(s.name) }));
    }
    return made;
  }
  $('[data-watar]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const typed = $('[data-wt-q]').value.trim(), out = $('[data-wt-out]');
    const q = EXAMPLES.find((x) => T(x) === typed) || typed;
    if (!q) { out.textContent = T('Write the change in a sentence, the way you would tell a colleague.'); $('[data-wt-q]').focus(); return; }
    if (hasDraft()) discardDraft(true);
    out.textContent = T('Watar is drafting…');
    await wait(M.beat);
    commit();
    const made = draft(q);
    if (!made.length) { undo.pop(); out.textContent = T('Watar could not tell what to change. Try one of the examples, or name a station, a person, a number of days or of people.'); return; }
    out.textContent = '';
    $('[data-watar]').hidden = true;
    changed();
    $('[data-draft]').hidden = false;
    $('[data-draft-t]').innerHTML = T('{head} {list}. It stays grey until you accept it.', { head: `<b>${T('Watar drafted:')}</b>`, list: esc(made.join(T('; '))) });
    const ds = line.stations.find((s) => s.draft) || line.stations.find((s) => s.steps.some((p) => p.draft));
    if (ds) centre(ds.id);
    $('[data-do="draft-yes"]').focus();
  });
  const hasDraft = () => line.stations.some((s) => s.draft || s.steps.some((p) => p.draft)) || line.edges.some((e) => e.draft);
  function acceptDraft() {
    commit();
    line.stations.forEach((s) => { delete s.draft; s.steps.forEach((p) => { delete p.draft; }); });
    line.edges.forEach((e) => { delete e.draft; });
    $('[data-draft]').hidden = true;
    changed(T('Watar’s draft is now part of the line'));
  }
  function discardDraft(quiet) {
    if (!quiet) commit();
    const gone = new Set(line.stations.filter((s) => s.draft).map((s) => s.id));
    line.stations = line.stations.filter((s) => !s.draft);
    line.stations.forEach((s) => { const ids = s.steps.filter((p) => p.draft).map((p) => p.id); s.steps = s.steps.filter((p) => !p.draft); line.edges = line.edges.filter((e) => !ids.some((id) => e.port.startsWith(`${id}:`))); });
    line.edges = line.edges.filter((e) => !e.draft && !gone.has(e.from) && !gone.has(e.to));
    $('[data-draft]').hidden = true;
    if (!quiet) changed(T('Watar’s draft is discarded'));
  }
  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.ex) { $('[data-wt-q]').value = T(t.dataset.ex); $('[data-wt-q]').focus(); return; }
    const d = t.dataset.do;
    if (d === 'watar') { const p = $('[data-watar]'); p.hidden = !p.hidden; t.setAttribute('aria-expanded', String(!p.hidden)); if (!p.hidden) $('[data-wt-q]').focus(); }
    if (d === 'watar-close') { $('[data-watar]').hidden = true; $('[data-do="watar"]').setAttribute('aria-expanded', 'false'); }
    if (d === 'draft-yes') acceptDraft();
    if (d === 'draft-no') discardDraft(false);
    if (d === 'tidy') tidy();
    if (d === 'test') { $('[data-testbar]').hidden = false; $('[data-t-now]').textContent = T('A test job walks the blocks, step by step. Nothing is sent.'); $('[data-test-set] [type=submit]').focus(); }
    if (d === 'test-close') closeTest();
  });

  // ---------- panels fold away so the canvas can have the whole width; each choice is remembered ----------
  const body = $('.bd-body');
  function panel(name, open, quiet) {
    body.classList.toggle(`${name}-closed`, !open);
    $(`[data-open-p="${name}"]`).hidden = open;
    try { localStorage.setItem(`iqaa-build-${name}`, open ? 'open' : 'closed'); } catch (e) { /* this page only */ }
    if (!quiet) { setTimeout(() => { drawEdges(); drawMini(); }, M.quarter + 20); $(open ? `#bd-${name} .pn-x` : `[data-open-p="${name}"]`).focus(); }
  }
  ['lib', 'insp'].forEach((n) => { let v = null; try { v = localStorage.getItem(`iqaa-build-${n}`); } catch (e) { /* default */ } panel(n, v !== 'closed', true); });
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-fold-p], [data-open-p]');
    if (t) panel(t.dataset.foldP || t.dataset.openP, !!t.dataset.openP);
  });
  document.addEventListener('keydown', (e) => {
    if (inField() || e.ctrlKey || e.metaKey) return;
    if (e.key === '[') panel('lib', body.classList.contains('lib-closed'));
    if (e.key === ']') panel('insp', body.classList.contains('insp-closed'));
  });

  // ---------- start ----------
  render();
  // it opens close enough to read, on the start of the line; Fit shows all of it
  const first = st(line.start) || line.stations[0];
  view.z = 0.8; view.x = 40 - first.x * view.z; view.y = 60 - first.y * view.z;
  applyView();
  addEventListener('resize', () => drawEdges());
})();
