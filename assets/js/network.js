// The network of lines. What feeds the main line sits above it, the main line in the middle, what it feeds below, so
// every link joins neighbouring rows. Each line is its blocks in their strokes (app.css .stg); each link is drawn from
// its block to the block it reaches: a call as a line there and a half-weight way back to where it waits, a launch as
// one line with an arrow, an aggregate as three thin lines becoming one. The list under the map says each link in a line.
(function () {
  const root = document.querySelector('main.nw');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'khaled', masar: 'samir', wamda: 'hala' });
  const T = window.T, esc = FLOW.esc, O = C.O, NO = C.noun;
  const $ = (s) => root.querySelector(s);
  const icon = (n, s) => IQ.icon(n, s || 18);
  const NET = O.network || { lines: [{ id: C.line.id }], links: [] };
  const STROKE = { work: 'struck', approval: 'held', auto: 'run', wait: 'rest' };
  const main = C.line;
  // a network line: the main one is the line itself; the others carry their blocks
  const lines = NET.lines.map((l) => (l.id === main.id ? { id: main.id, name: main.name, version: main.version, live: C.items.length, main: true,
    blocks: C.path.map((b) => ({ id: b.id, name: b.name, stroke: b.stroke || STROKE[b.kind] })) } : l));
  const byId = (id) => lines.find((l) => l.id === id);
  const feeds = (l) => NET.links.some((k) => k.from[0] === l.id && k.to[0] === main.id);
  const top = lines.filter((l) => !l.main && feeds(l)), bottom = lines.filter((l) => !l.main && !feeds(l));
  const KIND = {
    call: { ic: 'Handoff', name: T('Call'), say: T('Opens an item there and waits for its result') },
    launch: { ic: 'Send', name: T('Launch'), say: T('Opens work there and goes on') },
    aggregate: { ic: 'Merge', name: T('Aggregate'), say: T('Many items become one') },
  };

  // ---------- the lines' tabs, as on the canvas: the network first ----------
  $('[data-lines]').innerHTML = `<a href="${C.href('network.html')}" aria-current="page"><b>${esc(T('The network'))}</b><span>${esc(NO.n(lines.length, '{n} line', '{n} lines'))}</span></a>`
    + `<a href="${C.href('lines.html')}"><b>${esc(T(main.name))}</b><span>${esc(T('Version {n}', { n: main.version }))}</span></a>`
    + lines.filter((l) => !l.main).map((l) => `<a href="#line-${l.id}" data-go="${l.id}"><b>${esc(T(l.name))}</b><span>${esc(T('Version {n}', { n: l.version }))}</span></a>`).join('');

  $('[data-sum]').innerHTML = `<span class="stats">${FLOW.stat('Line', lines.length, NO.n(lines.length, '{n} line', '{n} lines'))}${FLOW.stat('Merge', NET.links.length, T('{n} links', { n: NET.links.length }))}</span>`;
  $('[data-legend]').innerHTML = Object.entries(KIND).map(([k, x]) => `<span class="nw-lg ${k}"><svg viewBox="0 0 40 16" width="40" height="16"><path d="M2 8H38"/>${k === 'call' ? '<path class="back" d="M2 13H30"/>' : ''}${k === 'aggregate' ? '<path class="thin" d="M2 3Q14 3 22 8M2 13Q14 13 22 8"/>' : ''}${k === 'launch' ? '<path d="M32 3L38 8L32 13"/>' : ''}</svg><b>${esc(x.name)}</b><span>${esc(x.say)}</span></span>`).join('');

  // ---------- the rows ----------
  const card = (l) => `<section class="nw-line${l.main ? ' is-main' : ''}" id="line-${l.id}" aria-labelledby="nw-h-${l.id}">
<div class="nw-lh"><h2 id="nw-h-${l.id}">${esc(T(l.name))}</h2><span class="stats">${FLOW.stat('Line', l.blocks.length, NO.n(l.blocks.length, '{n} block', '{n} blocks'))}${FLOW.stat('My work', l.live, NO.n(l.live, '{n} live job', '{n} live jobs'))}</span>`
    + `${l.main ? `<a class="btn small" href="${C.href('lines.html')}">${icon('Line')}<span>${T('Open the canvas')}</span></a>` : ''}</div>
<ol class="stg nw-st">${l.blocks.map((b, i) => `<li class="done" data-at="${l.id}:${b.id}"><span class="stg-g" aria-hidden="true">${IQ.glyph(b.stroke)}</span><span class="stg-n">${esc(T(b.name))}</span></li>`).join('')}</ol></section>`;
  $('[data-rows]').innerHTML = `${top.length ? `<div class="nw-row">${top.map(card).join('')}</div>` : ''}<div class="nw-row">${card(lines.find((l) => l.main))}</div>${bottom.length ? `<div class="nw-row">${bottom.map(card).join('')}</div>` : ''}`;

  // ---------- the wires, drawn from where the stations are ----------
  const map = $('[data-map]'), svg = $('[data-wires]');
  function wires() {
    // when a row's lines stack (a narrow screen), a wire would cross a card: the list under the map carries the links
    const stacked = [...map.querySelectorAll('.nw-row')].some((row) => new Set([...row.children].map((c) => Math.round(c.getBoundingClientRect().top))).size > 1);
    svg.style.display = stacked ? 'none' : '';
    if (stacked) return;
    const box = map.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    svg.setAttribute('width', box.width); svg.setAttribute('height', box.height);
    const pt = (at, edge) => {
      const el = map.querySelector(`[data-at="${at[0]}:${at[1]}"] .stg-g`);
      if (!el) return null;
      // across from the station, at the edge of its line's card: the wire runs in the gap between the rows, never under a card
      const r = el.getBoundingClientRect(), c = el.closest('.nw-line').getBoundingClientRect();
      return { x: r.left + r.width / 2 - box.left, y: (edge === 'top' ? c.top : c.bottom) - box.top };
    };
    // a wire from a to b: out of the card, across halfway through the gap (each link its own lane), then into the card
    const route = (a, b, lane) => {
      const down = b.y > a.y, mid = (a.y + b.y) / 2 + (lane - 1) * 10, r = 8;
      const dx = Math.sign(b.x - a.x) || 1, dy = down ? 1 : -1;
      if (Math.abs(b.x - a.x) < 2 * r) return `M${a.x} ${a.y}V${b.y}`;
      return `M${a.x} ${a.y}V${mid - dy * r}Q${a.x} ${mid} ${a.x + dx * r} ${mid}H${b.x - dx * r}Q${b.x} ${mid} ${b.x} ${mid + dy * r}V${b.y}`;
    };
    let out = '';
    NET.links.forEach((k, i) => {
      const fromBelow = byId(k.from[0]) && bottom.includes(byId(k.from[0]));
      const a = pt(k.from, fromBelow ? 'top' : 'bottom'), b = pt(k.to, fromBelow ? 'bottom' : 'top');
      if (!a || !b) return;
      const d = route(a, b, i);
      out += `<path class="w ${k.kind}" d="${d}"/>`;
      if (k.kind === 'aggregate') out += `<path class="w thin" d="${route({ x: a.x - 10, y: a.y }, b, i)}"/><path class="w thin" d="${route({ x: a.x + 10, y: a.y }, b, i)}"/>`;
      if (k.kind === 'launch') { const s = b.y > a.y ? -1 : 1; out += `<path class="w" d="M${b.x - 6} ${b.y + s * 8}L${b.x} ${b.y}L${b.x + 6} ${b.y + s * 8}"/>`; }
      if (k.kind === 'call' && k.back) {
        const c = pt(k.back, fromBelow ? 'top' : 'bottom'), e = { x: b.x + 14, y: b.y };
        if (c) out += `<path class="w back" d="${route(e, c, i + 0.5)}"/>`;
      }
      out += `<g class="w-n" transform="translate(${(a.x + b.x) / 2} ${(a.y + b.y) / 2})"><rect x="-14" y="-10" width="28" height="20" rx="10"/><text y="4">${k.n}</text></g>`;
    });
    svg.innerHTML = out;
  }

  // ---------- the links in words, one each ----------
  const at = (p) => { const l = byId(p[0]); const b = l && l.blocks.find((x) => x.id === p[1]); return { l, b }; };
  $('[data-links]').innerHTML = NET.links.map((k) => {
    const f = at(k.from), t = at(k.to), x = KIND[k.kind];
    return `<li class="nw-lk ${k.kind}"><span class="nw-ki" title="${esc(x.say)}">${icon(x.ic)}<b>${esc(x.name)}</b></span>`
      + `<span class="nw-path"><b>${esc(T(f.l.name))}</b><small>${esc(T(f.b.name))}</small></span>${icon('Handoff', 16)}<span class="nw-path"><b>${esc(T(t.l.name))}</b><small>${esc(T(t.b.name))}</small></span>`
      + `<span class="nw-rule">${esc(T(k.rule))}</span>${FLOW.stat('My work', k.n, NO.n(k.n, '{n} job', '{n} jobs'))}</li>`;
  }).join('') || `<li class="nw-none">${esc(T('This organization runs one line, connected to nothing yet.'))}</li>`;

  // a line asked for by its tab is brought into view and held for a moment
  root.addEventListener('click', (e) => {
    const a = e.target.closest('[data-go]');
    if (!a) return;
    e.preventDefault();
    const el = document.getElementById(`line-${a.dataset.go}`);
    el.scrollIntoView({ behavior: window.Beats && window.Beats.reduce() ? 'auto' : 'smooth', block: 'center' });
    el.classList.add('is-asked');
    setTimeout(() => el.classList.remove('is-asked'), 1200);
  });

  document.title = `${T('The network of lines')} · ${T(O.name)}`;
  wires();
  if (window.ResizeObserver) new ResizeObserver(wires).observe(map);
  if (document.fonts) document.fonts.ready.then(wires);
  if (location.hash.startsWith('#line-')) { const el = document.getElementById(location.hash.slice(1)); if (el) el.classList.add('is-asked'); }
})();
