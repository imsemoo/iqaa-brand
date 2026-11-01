// The Line screen: an organization's line drawn as a metro map. Stations sit at even spacing on one track and
// every station is an interchange, because work changes hands there. A branch leaves at 45° below the line and
// rejoins it; a way back runs at half weight to an earlier station. Below 1024 px the map turns vertical.
(function () {
  const root = document.querySelector('main.ln');
  if (!root || !window.IQ || !window.Beats || !window.SUFRA) return;
  const M = window.IQAA.motion;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const esc = Beats.esc;
  const vertical = matchMedia('(max-width: 1023px)');
  const clone = (o) => JSON.parse(JSON.stringify(o));

  const KINDS = ['run', 'held', 'struck', 'rest'];
  const KIND_NAME = { run: 'runs by itself', held: 'waits for a person', struck: 'a person does it', rest: 'timed wait' };
  const PEOPLE = ['Reem', 'Salma', 'Yusuf', 'Hala', 'The client'];
  const WHO = { run: ['Send', 'Create', 'Remind', 'Move'], held: PEOPLE, struck: PEOPLE, rest: ['An hour', 'A day', 'Two days', 'Three days', 'A week'] };
  const WHO_LABEL = { run: 'What it does', held: 'Who', struck: 'Who', rest: 'How long' };
  const DEFAULT_NAME = { run: 'Send an update', held: 'Approval', struck: 'Task for a person', rest: 'Wait' };
  const DEFAULT_WHO = { run: 'Send', held: 'Hala', struck: 'Hala', rest: 'A day' };
  // geometry, in px: station spacing comes from CSS (--col); lanes for branches and ways back sit under the line
  const LANE = { h: 48, v: 28 }, BEND = { h: 16, v: 12 };
  const X_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';

  let uid = 0;
  const nid = (p) => `${p}${Date.now().toString(36)}${++uid}`;
  const step = (kind, name, who) => ({ id: nid('s'), kind, name, who });
  const isPerson = (k) => k === 'held' || k === 'struck';

  // Sufra's published line, version 3, from the shared demo world
  const sufra = () => window.SUFRA.line();

  // An organization made at sign-up arrives with its approved line as version 1, without branches yet.
  function fromSignup(org) {
    return {
      stations: org.blocks.map((b) => ({ id: nid('t'), name: b.name, steps: b.steps.map((k) => step(k, DEFAULT_NAME[k], DEFAULT_WHO[k])) })),
      routes: [],
    };
  }

  let org = { name: 'Sufra', demo: true };
  try { const o = JSON.parse(sessionStorage.getItem('iqaa-org') || 'null'); if (o && !o.demo && o.blocks && o.blocks.length) org = o; } catch (e) { /* storage blocked: the demo stays */ }
  let line = org.demo ? sufra() : fromSignup(org);
  let published = clone(line);
  let version = org.demo ? 3 : 1;
  let sel = line.stations[Math.min(2, line.stations.length - 1)].id;
  let undo = null, test = null;

  // ---------- reading the line ----------
  const routesFrom = (id) => line.routes.filter((r) => r.from === id);
  const mainIdx = (id) => line.stations.findIndex((s) => s.id === id);
  function find(id) {
    const i = mainIdx(id);
    if (i >= 0) return { st: line.stations[i], i, route: null };
    for (const r of line.routes) {
      if (r.type !== 'branch') continue;
      const j = r.stations.findIndex((s) => s.id === id);
      if (j >= 0) return { st: r.stations[j], i: j, route: r };
    }
    return null;
  }
  const nameOf = (id) => (find(id) || { st: { name: '' } }).st.name;
  const kinds = (l) => l.stations.map((s) => s.steps.map((x) => x.kind));
  const dirty = () => JSON.stringify(line) !== JSON.stringify(published);
  // a branch holds one station for each station it passes by, and at least one, so its names never crowd the map
  const capacity = (r) => Math.max(1, mainIdx(r.to) - mainIdx(r.from) - 1);

  function routeShort(r) {
    if (r.type === 'back') return `Way back to ${esc(nameOf(r.to))}`;
    return `Over ${r.over} people: ${esc(r.stations.map((s) => s.name).join(', '))}`;
  }

  // ---------- the page head: version, signature, actions ----------
  let stateNow = '';
  function renderHead() {
    const d = dirty();
    const state = d
      ? `<b>Draft of version ${version + 1}</b> · not published yet. <button class="link" type="button" data-discard>Discard the draft</button>`
      : `<b>Version ${version}</b> · published. Every new job walks it.`;
    // the state is a live region: it changes only when the state does, never on every keystroke
    if (state !== stateNow) { $('[data-state]').innerHTML = state; stateNow = state; }
    const pub = $('[data-publish-open]');
    pub.textContent = `Publish version ${version + 1}`;
    pub.disabled = !d || !!test;
    $('[data-test-open]').disabled = !!test;
    const changed = JSON.stringify(kinds(line)) !== JSON.stringify(kinds(published));
    $('[data-sig-cap]').textContent = changed ? `Signature of version ${version}. Publishing the draft changes it.` : `Signature of version ${version}`;
  }
  function renderSig() {
    const el = $('[data-head-sig]');
    el.innerHTML = IQ.line(kinds(published), { k: 0.75 });
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', `Signature of version ${version}: ${IQ.describe(kinds(published))}`);
  }

  // ---------- the map ----------
  const detail = $('[data-detail]');
  const detailHome = document.createComment('detail');
  detail.before(detailHome);

  function stationLi(s, o) {
    const people = s.steps.filter((x) => isPerson(x.kind)).length;
    const meta = `${s.steps.length} ${s.steps.length === 1 ? 'step' : 'steps'}${people ? ` · ${people} by people` : ''}`;
    const where = o.route ? `On the branch for orders over ${o.route.over} people` : `Station ${o.i + 1} of ${o.n}`;
    const rts = o.route ? '' : routesFrom(s.id).map((r) => `<span class="st-rt">${routeShort(r)}</span>`).join('');
    const on = s.id === sel;
    return `<li class="st${o.route ? ' br' : ''}${on ? ' on' : ''}" data-st="${s.id}"${o.route ? ` data-route="${o.route.id}"` : ''}>
<button type="button" class="st-btn" data-pick="${s.id}" aria-expanded="${on}" aria-controls="detail" aria-label="${esc(s.name)}. ${where}. ${meta}.">
<span class="st-dot" data-dot="${s.id}" aria-hidden="true"></span>
<span class="st-t" aria-hidden="true"><b>${esc(s.name)}</b><span class="st-sig">${IQ.line([s.steps.map((x) => x.kind)], { k: 0.5 })}</span><span class="st-m">${meta}</span>${rts}</span>
</button></li>`;
  }

  function renderMap() {
    const active = document.activeElement && detail.contains(document.activeElement) ? document.activeElement : null;
    detailHome.after(detail);
    const n = line.stations.length;
    const items = [];
    line.stations.forEach((s, i) => {
      items.push(stationLi(s, { i, n }));
      routesFrom(s.id).filter((r) => r.type === 'branch').forEach((r) => r.stations.forEach((b) => items.push(stationLi(b, { route: r }))));
    });
    items.push('<li class="st-add"><button class="btn small" type="button" data-add-end>Add a station</button></li>');
    $('[data-stations]').innerHTML = items.join('');
    placeDetail();
    if (active && active.isConnected) active.focus({ preventScroll: true });
    draw();
  }

  // a station's label changes in place while you type, so focus never leaves the field
  function relabel(id) {
    const f = find(id), li = $(`[data-st="${id}"]`);
    if (!f || !li) return;
    const tmp = document.createElement('ol');
    tmp.innerHTML = stationLi(f.st, f.route ? { route: f.route } : { i: f.i, n: line.stations.length });
    li.querySelector('.st-btn').replaceWith(tmp.querySelector('.st-btn'));
    if (f.route) relabel(f.route.from);
    draw();
  }

  // On a phone the selected station opens under itself, so the rail keeps running beside its steps.
  function placeDetail() {
    const li = vertical.matches && !test ? $(`[data-st="${sel}"]`) : null;
    if (li) li.append(detail); else detailHome.after(detail);
  }

  // A polyline with rounded bends: every corner becomes a quadratic curve of radius r.
  function rounded(pts, r) {
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [a, p, b] = [pts[i - 1], pts[i], pts[i + 1]];
      const l1 = Math.hypot(p[0] - a[0], p[1] - a[1]), l2 = Math.hypot(b[0] - p[0], b[1] - p[1]);
      const k1 = Math.min(r, l1 / 2) / (l1 || 1), k2 = Math.min(r, l2 / 2) / (l2 || 1);
      d += `L${(p[0] - (p[0] - a[0]) * k1).toFixed(1)} ${(p[1] - (p[1] - a[1]) * k1).toFixed(1)}Q${p[0]} ${p[1]} ${(p[0] + (b[0] - p[0]) * k2).toFixed(1)} ${(p[1] + (b[1] - p[1]) * k2).toFixed(1)}`;
    }
    const z = pts[pts.length - 1];
    return `${d}L${z[0]} ${z[1]}`;
  }

  // Lanes: a route takes the nearest lane where no other route covers the same stretch of line.
  function lanes() {
    const out = {}, used = [];
    line.routes.map((r) => ({ r, a: Math.min(mainIdx(r.from), mainIdx(r.to)), b: Math.max(mainIdx(r.from), mainIdx(r.to)) }))
      .sort((p, q) => (p.b - p.a) - (q.b - q.a))
      .forEach(({ r, a, b }) => {
        let lane = 1;
        while (used.some((u) => u.lane === lane && a < u.b && u.a < b)) lane++;
        used.push({ lane, a, b });
        out[r.id] = lane;
      });
    return out;
  }

  let geo = { main: {}, hops: {} };
  function draw() {
    const inner = $('[data-map-in]'), svg = $('[data-tracks]');
    const v = vertical.matches, o = v ? 'v' : 'h';
    const lane = lanes();
    // in a row, stations share the width evenly (Beck's even spacing), between 116 and 220 px, and the map
    // starts where the page column starts
    if (!v) {
      const map = inner.parentElement, add = $('.st-add', inner);
      const edge = Math.max(32, (map.clientWidth - 1440) / 2);
      const col = Math.round(Math.min(220, Math.max(116, (map.clientWidth - 2 * edge - (add ? add.offsetWidth : 0)) / line.stations.length)));
      inner.style.setProperty('--col', `${col}px`);
      inner.style.paddingInline = `${edge}px`;
    } else {
      // in a column the rail moves in by one lane for each lane in use, so no lane runs off the screen
      const used = Math.max(1, ...Object.values(lane));
      inner.style.removeProperty('--col');
      inner.style.paddingInline = '';
      inner.style.setProperty('--rail-x', `${16 + used * LANE.v}px`);
    }
    // branch stations sit on their lane: on a phone the lane is a column beside the rail, set before measuring
    $$('.st.br', inner).forEach((li) => {
      li.style.setProperty('--lane', lane[li.dataset.route] || 1);
      if (v) { li.style.left = ''; li.style.top = ''; }
    });
    const box = inner.getBoundingClientRect();
    const at = (id) => {
      const r = $(`[data-dot="${id}"]`, inner).getBoundingClientRect();
      return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
    };
    const main = line.stations.map((s) => at(s.id));
    // along: the axis the line runs on; across: the axis lanes step out on (down in a row, toward the start edge in a column)
    const ax = v ? 1 : 0, cx = 1 - ax;
    const out = v ? (getComputedStyle(inner).direction === 'rtl' ? 1 : -1) : 1;
    const P = (along, across) => (v ? [across, along] : [along, across]);
    geo = { main: {}, hops: {} };
    line.stations.forEach((s, i) => { geo.main[s.id] = main[i]; });
    let paths = main.length > 1 ? `<path class="tk" d="M${main[0][0]} ${main[0][1]}L${main[main.length - 1][0]} ${main[main.length - 1][1]}"/>` : '';
    let depth = 0;
    line.routes.forEach((r) => {
      const A = geo.main[r.from], B = geo.main[r.to];
      if (!A || !B) return;
      const a1 = A[ax], a2 = B[ax], c0 = A[cx], s = Math.sign(a2 - a1);
      // a branch leaves at 45°; a way back turns square, down and back, so the two never share a track
      const D = lane[r.id] * LANE[o], diag = r.type === 'back' ? 0 : Math.min(D, Math.abs(a2 - a1) / 2 - 4);
      depth = Math.max(depth, D);
      const c = c0 + out * D;
      const pts = [A];
      if (diag) pts.push(P(a1 + s * diag, c0 + out * diag));
      if (diag < D) pts.push(P(a1 + s * diag, c));
      const tail = [P(a2 - s * diag, c)];
      if (diag && diag < D) tail.push(P(a2 - s * diag, c0 + out * diag));
      // stops along the lane: branch stations, evenly spaced in a row, wherever the list puts them in a column
      const stops = [];
      if (r.type === 'branch') {
        r.stations.forEach((b, k) => {
          const li = $(`[data-st="${b.id}"]`, inner);
          if (!li) return;
          if (!v) {
            const along = a1 + ((a2 - a1) * (k + 1)) / (r.stations.length + 1);
            li.style.left = `${along - li.offsetWidth / 2}px`;
            li.style.top = `${c - 9}px`;
            stops.push(P(along, c));
          } else stops.push(at(b.id));
        });
      }
      const all = pts.concat(stops, tail, [B]);
      paths += `<path class="tk ${r.type}" d="${rounded(all, BEND[o])}"/>`;
      // hops for the test job: from stop to stop along the route
      const marks = [A].concat(stops, [B]);
      const seg = [];
      let cur = [A];
      all.slice(1).forEach((p) => {
        cur.push(p);
        if (marks.some((m) => m[0] === p[0] && m[1] === p[1])) { seg.push(rounded(cur, BEND[o])); cur = [p]; }
      });
      geo.hops[r.id] = seg;
    });
    // room under the line for the lanes and the names of branch stations
    const pad = v ? '' : `${Math.max(32, depth + (line.routes.some((r) => r.type === 'branch') ? 120 : 32))}px`;
    if (inner.style.paddingBlockEnd !== pad) inner.style.paddingBlockEnd = pad;
    svg.setAttribute('width', inner.scrollWidth);
    svg.setAttribute('height', inner.scrollHeight);
    svg.innerHTML = paths + (test ? test.trail.map((d) => `<path class="trail" d="${d}"/>`).join('') : '');
  }
  let drawQueued = false;
  // a timer, not a frame callback: a resize can queue it from the observer without looping it
  const requestDraw = () => { if (!drawQueued) { drawQueued = true; setTimeout(() => { drawQueued = false; draw(); }, 0); } };

  // ---------- the selected station ----------
  function stepRow(x, k, n) {
    const opts = WHO[x.kind].map((w) => `<option${w === x.who ? ' selected' : ''}>${w}</option>`).join('');
    return `<li class="step-row" data-step="${x.id}">
<button type="button" class="lbeat" data-kind="${x.id}" aria-label="Step ${k + 1}: ${KIND_NAME[x.kind]}. Press to change the kind.">${Beats.beat(x.kind)}</button>
<label class="sr" for="n-${x.id}">Step ${k + 1}, name</label><textarea class="sn sn-t" id="n-${x.id}" data-sname="${x.id}" rows="1" maxlength="48" spellcheck="false">${esc(x.name)}</textarea>
<label class="sr" for="w-${x.id}">Step ${k + 1}, ${WHO_LABEL[x.kind].toLowerCase()}</label><select class="sw" id="w-${x.id}" data-swho="${x.id}">${opts}</select>
<button type="button" class="ic-x" data-sdel="${x.id}" aria-label="Remove step ${k + 1}"${n <= 1 ? ' disabled' : ''}>${X_ICON}</button>
</li>`;
  }

  function flowText(f) {
    if (f.route) return `Orders over ${f.route.over} people come here from ${esc(nameOf(f.route.from))} and rejoin the line at ${esc(nameOf(f.route.to))}.`;
    const n = line.stations.length;
    if (n === 1) return 'Every job starts and ends here.';
    if (f.i === 0) return `Every job starts here and leaves for ${esc(line.stations[1].name)}.`;
    if (f.i === n - 1) return `Jobs arrive from ${esc(line.stations[f.i - 1].name)}. The job is done here.`;
    return `Jobs arrive from ${esc(line.stations[f.i - 1].name)} and leave for ${esc(line.stations[f.i + 1].name)}.`;
  }

  const trackIcon = (type) => (type === 'back'
    ? '<svg viewBox="0 0 40 20" aria-hidden="true"><path d="M34 3v7a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V3" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : type === 'branch'
      ? '<svg viewBox="0 0 40 20" aria-hidden="true"><path d="M2 4h10l12 12h14" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg viewBox="0 0 40 20" aria-hidden="true"><path d="M2 10h36" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>');

  function routeRows(f) {
    if (f.route) {
      const r = f.route;
      return `<li class="rt">${trackIcon('branch')}<span>Rejoins the line at <b>${esc(nameOf(r.to))}</b>. Change where on ${esc(nameOf(r.from))}.</span></li>`;
    }
    const n = line.stations.length, rows = [];
    rows.push(f.i < n - 1
      ? `<li class="rt">${trackIcon('next')}<span>Next: <b>${esc(line.stations[f.i + 1].name)}</b></span></li>`
      : `<li class="rt">${trackIcon('next')}<span>End of the line: the job is done.</span></li>`);
    routesFrom(f.st.id).forEach((r) => {
      if (r.type === 'back') {
        const opts = line.stations.slice(0, f.i).map((s) => `<option value="${s.id}"${s.id === r.to ? ' selected' : ''}>${esc(s.name)}</option>`).join('');
        rows.push(`<li class="rt edit">${trackIcon('back')}<div class="rt-f">
<p class="rt-l"><label for="bt-${r.id}">Way back to</label> <select class="sw" id="bt-${r.id}" data-back-to="${r.id}">${opts}</select></p>
<p class="rt-l"><label for="bw-${r.id}">when</label> <input class="sn" id="bw-${r.id}" data-back-when="${r.id}" value="${esc(r.when)}" maxlength="40" autocomplete="off"></p>
</div><button type="button" class="ic-x" data-rdel="${r.id}" aria-label="Remove the way back to ${esc(nameOf(r.to))}">${X_ICON}</button></li>`);
      } else {
        const opts = line.stations.slice(f.i + 1).map((s) => `<option value="${s.id}"${s.id === r.to ? ' selected' : ''}>${esc(s.name)}</option>`).join('');
        rows.push(`<li class="rt edit">${trackIcon('branch')}<div class="rt-f">
<p class="rt-l"><label for="bo-${r.id}">Orders over</label> <input class="sn num" id="bo-${r.id}" type="number" inputmode="numeric" min="1" max="999" data-over="${r.id}" value="${r.over}"> <span>people</span></p>
<p class="rt-l">take the branch to <b>${esc(r.stations.map((s) => s.name).join(', '))}</b></p>
<p class="rt-l"><label for="bj-${r.id}">and rejoin at</label> <select class="sw" id="bj-${r.id}" data-branch-to="${r.id}">${opts}</select></p>
</div><button type="button" class="ic-x" data-rdel="${r.id}" aria-label="Remove the branch">${X_ICON}</button></li>`);
      }
    });
    return rows.join('');
  }

  function routeAdds(f) {
    if (f.route) return '';
    const n = line.stations.length, has = (t) => routesFrom(f.st.id).some((r) => r.type === t);
    const b = [];
    if (f.i > 0 && !has('back')) b.push('<button class="btn small" type="button" data-add-back>Add a way back</button>');
    if (f.i < n - 1 && !has('branch')) b.push('<button class="btn small" type="button" data-add-branch>Add a branch</button>');
    return b.length ? `<div class="rt-add">${b.join('')}</div>` : '';
  }

  function renderDetail(enter) {
    const f = find(sel);
    if (!f) return;
    const s = f.st, n = f.route ? f.route.stations.length : line.stations.length;
    const canRemove = f.route || line.stations.length > 1;
    const addHere = f.route
      ? (n < capacity(f.route) ? '<button class="btn small" type="button" data-add-bst>Add a station to this branch</button>' : '')
      : '<button class="btn small" type="button" data-add-after>Add a station after</button>';
    detail.id = 'detail';
    detail.innerHTML = `<div class="dt-head">
<div class="field"><label for="dt-name">${f.route ? 'Station on a branch' : `Station ${f.i + 1} of ${n}`}</label><input id="dt-name" data-name value="${esc(s.name)}" maxlength="32" autocomplete="off" spellcheck="false"></div>
<p class="dt-flow">${flowText(f)}</p>
<div class="dt-act">${addHere}<button class="btn small quiet" type="button" data-remove${canRemove ? '' : ' disabled'}>Remove this station</button></div>
</div>
<div class="dt-steps">
<h3>Steps <span>in the order they happen</span></h3>
<p class="st-cols" aria-hidden="true"><span>Kind</span><span>Step</span><span>Who or what</span></p>
<ol class="steps" data-steps>${s.steps.map((x, k) => stepRow(x, k, s.steps.length)).join('')}</ol>
<button class="btn small" type="button" data-add-step>Add a step</button>
</div>
<div class="dt-routes">
<h3>Where jobs go next</h3>
<ul class="routes">${routeRows(f)}</ul>
${routeAdds(f)}
</div>`;
    fitNames();
    if (enter && !Beats.reduce()) detail.animate([{ opacity: 0 }, { opacity: 1 }], { duration: M.quarter, easing: M.ease_arrive });
  }

  // step names wrap instead of hiding their end; where the browser cannot size a field to its text, this does
  const sizes = window.CSS && CSS.supports('field-sizing', 'content');
  function fitNames(one) {
    if (sizes) return;
    (one ? [one] : $$('.sn-t', detail)).forEach((t) => { t.style.height = 'auto'; t.style.height = `${t.scrollHeight + 2}px`; });
  }

  function select(id, focusName) {
    if (test) return;
    const prev = sel;
    sel = id;
    $$('.st', root).forEach((li) => {
      const on = li.dataset.st === id;
      li.classList.toggle('on', on);
      const b = li.querySelector('.st-btn');
      if (b) b.setAttribute('aria-expanded', String(on));
    });
    renderDetail(prev !== id);
    placeDetail();
    draw();
    if (focusName) { const i = $('#dt-name'); i.focus(); i.select(); }
  }

  // every change to the line: the map, the head and, when asked, the detail are redrawn
  function changed(o) {
    const opt = o || {};
    if (opt.map) renderMap(); else if (opt.label) relabel(opt.label);
    if (opt.detail) renderDetail(false);
    renderHead();
  }

  // ---------- notes with undo ----------
  let noteTimer = 0;
  function note(text, canUndo) {
    const el = $('[data-note]');
    $('[data-note-t]').textContent = text;
    $('[data-undo]').hidden = !canUndo;
    el.hidden = false;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => { el.hidden = true; undo = null; }, 8000);
  }
  function snapshot() { undo = { line: clone(line), sel }; }

  // ---------- editing ----------
  function addStation(at, name) {
    const s = { id: nid('t'), name: name || 'New station', steps: [step('struck', DEFAULT_NAME.struck, 'Hala')] };
    line.stations.splice(at, 0, s);
    sel = s.id;
    renderMap(); renderDetail(true); placeDetail(); renderHead();
    const i = $('#dt-name'); i.focus(); i.select();
  }

  function removeStation() {
    const f = find(sel);
    if (!f) return;
    snapshot();
    let gone = 0;
    if (f.route) {
      f.route.stations.splice(f.i, 1);
      sel = f.route.from;
      if (!f.route.stations.length) line.routes = line.routes.filter((r) => r !== f.route);
    } else {
      line.stations.splice(f.i, 1);
      sel = line.stations[Math.max(0, f.i - 1)].id;
      // routes that started or ended at the station go with it, and the note says so
      const before = line.routes.length;
      line.routes = line.routes.filter((r) => r.from !== f.st.id && r.to !== f.st.id);
      line.routes.forEach((r) => { if (r.type === 'branch') r.stations = r.stations.slice(0, capacity(r)); });
      gone = before - line.routes.length;
    }
    renderMap(); renderDetail(true); placeDetail(); renderHead();
    note(gone ? `${f.st.name} is removed, with the ${gone === 1 ? 'route' : 'routes'} that started or ended there.` : `${f.st.name} is removed.`, true);
    $(`[data-pick="${sel}"]`).focus();
  }

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t || t.disabled) return;
    const d = t.dataset;
    if (d.pick) return select(d.pick);
    if (d.kind) {
      const f = find(sel), x = f.st.steps.find((y) => y.id === d.kind);
      x.kind = KINDS[(KINDS.indexOf(x.kind) + 1) % KINDS.length];
      if (!WHO[x.kind].includes(x.who)) x.who = DEFAULT_WHO[x.kind];
      const k = f.st.steps.indexOf(x);
      Beats.set(t.querySelector('.b'), x.kind);
      t.setAttribute('aria-label', `Step ${k + 1}: ${KIND_NAME[x.kind]}. Press to change the kind.`);
      const sw = $(`[data-swho="${x.id}"]`);
      sw.innerHTML = WHO[x.kind].map((w) => `<option${w === x.who ? ' selected' : ''}>${w}</option>`).join('');
      $(`label[for="w-${x.id}"]`).textContent = `Step ${k + 1}, ${WHO_LABEL[x.kind].toLowerCase()}`;
      return changed({ label: sel });
    }
    if (d.sdel) {
      const f = find(sel);
      f.st.steps = f.st.steps.filter((y) => y.id !== d.sdel);
      changed({ label: sel, detail: true });
      const last = $$('[data-sname]', detail).pop();
      if (last) last.focus();
      return;
    }
    if (t.hasAttribute('data-add-step')) {
      const f = find(sel);
      f.st.steps.push(step('run', DEFAULT_NAME.run, 'Send'));
      changed({ label: sel, detail: true });
      const last = $$('[data-sname]', detail).pop();
      last.focus(); last.select();
      return;
    }
    if (t.hasAttribute('data-add-end')) return addStation(line.stations.length);
    if (t.hasAttribute('data-add-after')) return addStation(find(sel).i + 1);
    if (t.hasAttribute('data-add-bst')) {
      const f = find(sel), s = { id: nid('t'), name: 'New station', steps: [step('struck', DEFAULT_NAME.struck, 'Hala')] };
      f.route.stations.splice(f.i + 1, 0, s);
      sel = s.id;
      renderMap(); renderDetail(true); placeDetail(); renderHead();
      const i = $('#dt-name'); i.focus(); i.select();
      return;
    }
    if (t.hasAttribute('data-remove')) return removeStation();
    if (t.hasAttribute('data-add-back')) {
      const f = find(sel);
      line.routes.push({ id: nid('r'), type: 'back', from: f.st.id, to: line.stations[f.i - 1].id, when: 'A change is asked for' });
      changed({ map: true, detail: true });
      const w = $('[data-back-when]', detail);
      if (w) { w.focus(); w.select(); }
      return;
    }
    if (t.hasAttribute('data-add-branch')) {
      const f = find(sel);
      const r = { id: nid('r'), type: 'branch', from: f.st.id, to: line.stations[Math.min(f.i + 2, line.stations.length - 1)].id, over: 30, stations: [{ id: nid('t'), name: 'New branch station', steps: [step('struck', DEFAULT_NAME.struck, 'Hala')] }] };
      line.routes.push(r);
      changed({ map: true, detail: true });
      $(`[data-over="${r.id}"]`).focus();
      return;
    }
    if (d.rdel) {
      snapshot();
      const r = line.routes.find((x) => x.id === d.rdel);
      line.routes = line.routes.filter((x) => x !== r);
      changed({ map: true, detail: true });
      note(r.type === 'back' ? `The way back to ${nameOf(r.to)} is removed.` : 'The branch is removed.', true);
      return;
    }
    if (t.hasAttribute('data-discard')) {
      snapshot();
      line = clone(published);
      if (!find(sel)) sel = line.stations[0].id;
      renderMap(); renderDetail(true); placeDetail(); renderHead();
      note('The draft is discarded.', true);
      $('[data-publish-open]').focus();
      return;
    }
    if (t.hasAttribute('data-undo') && undo) {
      line = undo.line; sel = find(undo.sel) ? undo.sel : line.stations[0].id; undo = null;
      renderMap(); renderDetail(true); placeDetail(); renderHead();
      $('[data-note]').hidden = true;
      return;
    }
    if (t.hasAttribute('data-publish-open')) return openConfirm();
    if (t.hasAttribute('data-cf-no')) { $('[data-confirm]').hidden = true; $('[data-publish-open]').focus(); return; }
    if (t.hasAttribute('data-cf-yes')) return publish();
    if (t.hasAttribute('data-test-open')) return openTest();
    if (t.hasAttribute('data-test-cancel') || t.hasAttribute('data-test-close')) return closeTest();
    if (t.hasAttribute('data-test-again')) return startTest();
    if (t.hasAttribute('data-test-skip') && test) { test.skip = true; return; }
  });

  root.addEventListener('input', (e) => {
    const t = e.target, d = t.dataset;
    if (t.hasAttribute('data-name')) { find(sel).st.name = t.value.trim() || 'Untitled station'; return changed({ label: sel }); }
    if (d.sname) { const x = find(sel).st.steps.find((y) => y.id === d.sname); x.name = t.value.replace(/\s*\n\s*/g, ' '); fitNames(t); return renderHead(); }
    if (d.backWhen) { line.routes.find((r) => r.id === d.backWhen).when = t.value; return renderHead(); }
    if (d.over) {
      const v = Math.round(+t.value);
      if (v >= 1) { line.routes.find((r) => r.id === d.over).over = v; changed({ map: true }); }
    }
  });
  // a step name is one line of text that may wrap: Enter finishes it
  root.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.classList.contains('sn-t')) { e.preventDefault(); e.target.blur(); } });
  vertical.addEventListener('change', () => fitNames());
  root.addEventListener('change', (e) => {
    const t = e.target, d = t.dataset;
    if (d.swho) { find(sel).st.steps.find((y) => y.id === d.swho).who = t.value; return renderHead(); }
    if (d.backTo) { line.routes.find((r) => r.id === d.backTo).to = t.value; return changed({ map: true, detail: true }); }
    if (d.branchTo) {
      const r = line.routes.find((x) => x.id === d.branchTo);
      r.to = t.value;
      r.stations = r.stations.slice(0, Math.max(1, capacity(r)));
      return changed({ map: true, detail: true });
    }
  });

  // ---------- publishing ----------
  function openConfirm() {
    $('[data-cf-t]').textContent = `Publish version ${version + 1}?`;
    $('[data-cf-p]').textContent = `Jobs already on the line stay on version ${version}. New jobs walk version ${version + 1}.`;
    $('[data-cf-yes]').textContent = `Publish version ${version + 1}`;
    $('[data-confirm]').hidden = false;
    $('[data-cf-yes]').focus();
  }
  function publish() {
    version += 1;
    published = clone(line);
    $('[data-confirm]').hidden = true;
    renderHead();
    renderSig();
    // the pen writes the new version's signature
    Beats.write($('[data-head-sig]'), { each: M.quarter, gap: M.eighth / 2 });
    note(`Version ${version} is published. New jobs walk it from now on.`, false);
    $('[data-publish-open]').focus();
  }

  // ---------- the test job: a grey job walks the map and sends nothing ----------
  const NOTE = {
    run: { Send: 'not sent: test', Create: 'made in the test only', Remind: 'no reminder sent: test', Move: 'moved in the test only' },
    struck: (who) => `marked done for ${who}`,
    held: (who) => (who === 'The client' ? 'test answer from the client: approved' : `approved for ${who} in the test`),
    rest: (who) => `skipped; a real job waits ${who.toLowerCase()}`,
  };

  function plan(people, takeBack) {
    const seq = [], taken = new Set();
    let s = line.stations[0], guard = 0;
    const visit = (st) => st.steps.forEach((x) => seq.push({ type: 'step', st, x }));
    while (s && guard++ < 64) {
      visit(s);
      const i = mainIdx(s.id);
      const back = routesFrom(s.id).find((r) => r.type === 'back');
      const br = routesFrom(s.id).find((r) => r.type === 'branch');
      if (back && takeBack && !taken.has(back.id)) {
        taken.add(back.id);
        seq.push({ type: 'hop', route: back.id, k: 0, text: `${back.when || 'A change is asked for'}: back to ${nameOf(back.to)}`, icon: 'back' });
        s = find(back.to).st;
      } else if (br && people > br.over) {
        seq.push({ type: 'hop', route: br.id, k: 0, text: `${people} people, over ${br.over}: the branch to ${br.stations[0].name}`, icon: 'branch' });
        br.stations.forEach((b, k) => {
          visit(b);
          seq.push({ type: 'hop', route: br.id, k: k + 1, text: k + 1 < br.stations.length ? `On to ${br.stations[k + 1].name}` : `Back on the line at ${nameOf(br.to)}`, icon: 'branch', quiet: k + 1 < br.stations.length });
        });
        s = find(br.to).st;
      } else if (i < line.stations.length - 1) {
        seq.push({ type: 'hop', from: s.id, to: line.stations[i + 1].id });
        s = line.stations[i + 1];
      } else s = null;
    }
    return seq;
  }

  function openTest() {
    test = { trail: [], skip: false, running: false };
    $('[data-confirm]').hidden = true;
    detail.hidden = true;
    placeDetail();
    const p = $('[data-test]');
    p.hidden = false;
    $('[data-test-set]').hidden = false;
    $('[data-test-log]').innerHTML = '';
    $('[data-test-end]').hidden = true;
    $('[data-test-of]').textContent = dirty() ? `It walks the draft of version ${version + 1}. Nothing is sent to anyone.` : `It walks version ${version}. Nothing is sent to anyone.`;
    $('[data-stations]').inert = true;
    renderHead();
    draw();
    p.scrollIntoView({ block: 'nearest', behavior: Beats.reduce() ? 'auto' : 'smooth' });
    $('#t-people').focus();
  }

  function closeTest() {
    if (test) test.skip = true;
    test = null;
    $('[data-test]').hidden = true;
    $('[data-test-bar]').hidden = true;
    $('[data-token]').hidden = true;
    $('[data-stations]').inert = false;
    $$('.st.here', root).forEach((li) => li.classList.remove('here'));
    detail.hidden = false;
    placeDetail();
    renderHead();
    draw();
    $('[data-test-open]').focus();
  }

  const pause = (ms) => new Promise((r) => { if (!test || test.skip || Beats.reduce()) r(); else setTimeout(r, ms); });

  // the job travels a hop at one station's spacing a beat, sampled along the track so it follows every bend
  function travel(d) {
    const tok = $('[data-token]');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    $('[data-tracks]').append(p);
    const len = p.getTotalLength(), n = Math.max(2, Math.ceil(len / 12));
    const frames = Array.from({ length: n + 1 }, (_, i) => { const q = p.getPointAtLength((len * i) / n); return { transform: `translate(${q.x}px, ${q.y}px)` }; });
    p.remove();
    tok.style.transform = frames[n].transform;
    if (!test || test.skip || Beats.reduce()) return Promise.resolve();
    const col = parseFloat(getComputedStyle($('[data-map-in]')).getPropertyValue('--col')) || 168;
    const a = tok.animate(frames, { duration: Math.min(M.beat * 2, Math.max(M.half, (len / col) * M.beat)), easing: M.ease_move });
    return Promise.race([a.finished.catch(() => {}), new Promise((r) => { const iv = setInterval(() => { if (!test || test.skip) { a.cancel(); clearInterval(iv); r(); } }, 50); a.finished.then(() => clearInterval(iv), () => clearInterval(iv)); })]);
  }

  function logItem(html, now) {
    const li = document.createElement('li');
    li.className = 'tl';
    li.innerHTML = html;
    $('[data-test-log]').append(li);
    $('[data-test-now]').textContent = now;
    if (!Beats.reduce() && test && !test.skip) li.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: M.quarter, easing: M.ease_arrive });
  }

  async function startTest() {
    if (!test) test = { trail: [], skip: false };
    test.trail = []; test.skip = false;
    const people = Math.max(1, Math.round(+$('#t-people').value) || 40);
    const takeBack = $('[data-t-back]').checked;
    const seq = plan(people, takeBack);
    $('[data-test-set]').hidden = true;
    $('[data-test-log]').innerHTML = '';
    $('[data-test-end]').hidden = true;
    $('[data-test-bar]').hidden = false;
    draw();
    const tok = $('[data-token]');
    const first = geo.main[line.stations[0].id];
    tok.style.transform = `translate(${first[0]}px, ${first[1]}px)`;
    tok.hidden = false;
    let steps = 0, last = line.stations[0];
    const run = test;
    for (const ev of seq) {
      if (test !== run) return;
      if (ev.type === 'step') {
        $$('.st.here', root).forEach((li) => li.classList.remove('here'));
        const li = $(`[data-st="${ev.st.id}"]`);
        if (li) li.classList.add('here');
        const x = ev.x, who = x.who || '';
        const n = x.kind === 'run' ? (NOTE.run[who] || 'done in the test') : NOTE[x.kind](who);
        steps += 1; last = ev.st;
        logItem(`<span class="tl-g">${IQ.glyph(x.kind, { test: true })}</span><span class="tl-t"><b>${esc(ev.st.name)}</b><span>${esc(x.name)}</span></span><span class="tl-n">${esc(n)}</span>`,
          `${ev.st.name}: ${x.name}, ${n}`);
        await pause(M.quarter);
      } else {
        const d = ev.route ? (geo.hops[ev.route] || [])[ev.k] : `M${geo.main[ev.from].join(' ')}L${geo.main[ev.to].join(' ')}`;
        if (!d) continue;
        if (ev.text && !ev.quiet) logItem(`<span class="tl-g tl-r">${trackIcon(ev.icon)}</span><span class="tl-t tl-hop">${esc(ev.text)}</span>`, ev.text);
        await travel(d);
        test.trail.push(d);
        $('[data-tracks]').insertAdjacentHTML('beforeend', `<path class="trail" d="${d}"/>`);
      }
    }
    if (test !== run) return;
    $$('.st.here', root).forEach((li) => li.classList.remove('here'));
    $('[data-test-bar]').hidden = true;
    $('[data-test-sum]').innerHTML = `The test job reached <b>${esc(last.name)}</b> after ${steps} steps. Nothing was sent, and nothing was saved to Sufra’s orders.`;
    $('[data-test-end]').hidden = false;
    $('[data-test-again]').focus({ preventScroll: true });
  }

  $('[data-test-set]').addEventListener('submit', (e) => { e.preventDefault(); startTest(); });

  // ---------- start ----------
  $$('[data-org-name]').forEach((el) => { el.textContent = org.name; });
  Beats.sig($('[data-org-mark]'), line.stations.map((s) => ({ name: s.name, steps: s.steps.map((x) => x.kind) })), { mode: 'mark', size: 32, name: org.name, label: `${org.name}’s mark` });
  document.title = `Line · ${org.name}`;
  renderHead();
  renderSig();
  renderMap();
  renderDetail(false);
  placeDetail();
  draw();
  vertical.addEventListener('change', () => { placeDetail(); draw(); });
  new ResizeObserver(requestDraw).observe($('[data-map-in]'));
  addEventListener('resize', requestDraw);
  if (document.fonts) document.fonts.ready.then(requestDraw);
})();
