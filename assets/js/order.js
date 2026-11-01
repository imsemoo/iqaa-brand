// One order: its line written as a signature in time. What is done is a real stroke, the pen is where the job is,
// and what is still ahead is drawn with the dashed grey pen. Station by station below; who it waits for beside.
(function () {
  const root = document.querySelector('main.od');
  if (!root || !window.IQ || !window.Beats || !window.SUFRA || !window.JOBS) return;
  const S = window.SUFRA;
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = Beats.esc, isPerson = JOBS.isPerson;
  const line = S.line(), J = JOBS.on(line), main = J.main;
  const code = new URLSearchParams(location.search).get('code') || 'SFR-26-0031';
  const j = S.jobs.find((x) => x.code === code);
  const glyph = (k, test) => `<span class="g" aria-hidden="true">${IQ.glyph(k, { test: !!test })}</span>`;
  const keyOf = (name) => Object.keys(S.people).find((k) => S.people[k].name === name);


  if (!j) {
    $('[data-head]').innerHTML = `<h1>No order ${esc(code)}</h1><p class="od-sub">It may have been typed wrong. <a href="orders.html">See every order</a>.</p>`;
    $('.od-journey').hidden = true; $('.od-grid').hidden = true;
    return;
  }
  document.title = `${j.title} · ${j.code} · Sufra`;

  // ---------- the job's steps in order, each done, now or ahead ----------
  const route = J.route(j);
  const steps = [];
  route.forEach((st) => st.steps.forEach((x, k) => steps.push({ st, x, k })));
  const nowAt = j.finished ? steps.length : steps.findIndex((s) => s.st.id === j.at && s.k === j.step);
  const state = (i) => (i < nowAt ? 'done' : i === nowAt ? 'now' : 'next');

  // finished steps are spread between the day the order came in and now (or the day it finished), on the quarter hour
  const MONTH = { Oct: '10', Nov: '11' };
  // "Thu 29 Oct, 16:40" as a date in the demo year
  function fromLabel(s) { const [, d, m, t] = /(\d+) (\w+), (\d\d:\d\d)/.exec(s); return new Date(`2026-${MONTH[m]}-${d.padStart(2, '0')}T${t}`); }
  const end = j.finished ? fromLabel(j.finished) : new Date(`${S.dayIso}T09:41`);
  const start = new Date(j.opened || `${S.dayIso}T08:00`);
  const fmt = (d) => d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '') + ', ' + d.toTimeString().slice(0, 5);
  // the kitchen works 08:00 to 18:00: finished steps are spread over working hours only
  const hours = [];
  for (let d = new Date(start); d < end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    const open = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 8), shut = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 18);
    const a = Math.max(open, start), b = Math.min(shut, end);
    if (b > a) hours.push([a, b]);
  }
  const worked = hours.reduce((n, [a, b]) => n + (b - a), 0);
  function at(i) {
    let left = (worked * (i + 1)) / (nowAt + 1), t = start;
    for (const [a, b] of hours) { if (left <= b - a) { t = new Date(+a + left); break; } left -= b - a; t = b; }
    t = new Date(t);
    t.setMinutes(Math.round(t.getMinutes() / 15) * 15, 0, 0);
    return t;
  }

  // ---------- head ----------
  const cur = J.stepOf(j), p = j.finished ? null : J.station(j.at);
  $('[data-head]').innerHTML = `<div class="od-t"><p class="od-code"><code>${j.code}</code></p><h1>${esc(j.title)}</h1>
<p class="od-sub">${esc(j.client)}, ${esc(j.of)} · ${j.people} people · due <b>${esc(j.due)}</b></p></div>
<p class="od-state">${j.finished ? `${glyph('struck')}<span>Finished ${esc(j.finished)}. Every station signed it.</span>` : `${glyph(cur.kind)}<span>At <b>${esc(p.st.name)}</b>: ${esc(cur.name)}</span>`}</p>`;

  // ---------- the journey: one stroke; the pen stands where the job is ----------
  function journey() {
    const pal = window.IQAA.pal.light, k = 1;
    let x = 0, svg = '', names = '', last = null, nowX = null, row = 0;
    steps.forEach((s, i) => {
      if (last && last !== s.st) {
        // the handoff between stations is drawn as the next step will be: real once the job has crossed it
        const done = i <= nowAt;
        svg += `<path d="M${x} 0h${IQ.HANDOFF}" fill="none" stroke="${done ? pal.run : pal.test}" stroke-width="3.2" stroke-linecap="round"${done ? '' : ' stroke-dasharray="4.5 4.5"'}/>`;
        x += IQ.HANDOFF;
      }
      if (last !== s.st) { names += `<text x="${x}" y="${20 + (row % 2) * 10}" font-size="7.5" fill="#4F4D63" font-family="Atkinson Hyperlegible Next, sans-serif">${esc(s.st.name)}</text>`; row++; }
      if (i === nowAt) nowX = x;
      svg += IQ.cell(s.x.kind, x, 0, pal, k, state(i) === 'next');
      x += IQ.WIDTH[s.x.kind];
      last = s.st;
    });
    if (nowX == null) nowX = x;
    const nowMark = j.finished ? '' : `<path d="M${nowX + 12} -40V14" stroke="#19172E" stroke-width="1" stroke-dasharray="2 3"/><text x="${nowX + 12}" y="-44" text-anchor="middle" font-size="8" fill="#19172E" font-family="Fragment Mono, monospace">Now</text>`;
    return `<svg viewBox="-6 -54 ${x + 12} ${54 + 34}" role="img" aria-label="${esc(j.title)}: ${nowAt} of ${steps.length} steps done${j.finished ? '' : `; now ${esc(cur.name)}`}">${svg}${nowMark}${names}</svg>`;
  }
  $('[data-journey]').innerHTML = journey();
  $('[data-jr-cap]').textContent = j.finished ? `All ${steps.length} steps written` : `${nowAt} of ${steps.length} steps done; the rest waits ahead in grey`;

  // ---------- station by station ----------
  let i = 0;
  $('[data-stations]').innerHTML = route.map((st) => {
    const rows = st.steps.map((x) => {
      const n = i++, s = state(n);
      const who = isPerson(x.kind) ? (x.who === 'The client' ? j.client : x.who) : x.kind === 'rest' ? `Waits ${x.who.toLowerCase()}` : 'Runs by itself';
      const note = s === 'done' ? `<time>${fmt(at(n))}</time>` : s === 'now' ? '<b>Now</b>' : 'Next';
      const check = s === 'done' && x.check ? `<ul class="od-check" aria-label="Checklist, locked">${x.check.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : '';
      return `<li class="os-step ${s}">${glyph(x.kind, s === 'next')}<span class="os-n"><b>${esc(x.name)}</b><span>${esc(who)}</span>${check}</span><span class="os-w">${note}</span></li>`;
    }).join('');
    const sStates = st.steps.map((_, k) => state(i - st.steps.length + k));
    const sState = sStates.every((x) => x === 'done') ? 'done' : sStates.includes('now') ? 'now' : 'next';
    const label = { done: 'Done', now: 'The job is here', next: 'Ahead' }[sState];
    const onBranch = line.routes.some((r) => r.type === 'branch' && r.stations.includes(st));
    return `<li class="os ${sState}"><h3><span class="os-dot" aria-hidden="true"></span>${esc(st.name)}${onBranch ? ' <span class="os-br">branch for big orders</span>' : ''}<span class="os-s">${label}</span></h3><ol>${rows}</ol></li>`;
  }).join('');

  // ---------- beside: who it waits for, the client, Watar's draft ----------
  let now = '';
  if (!j.finished) {
    const k = isPerson(cur.kind) && keyOf(cur.who);
    const what = isPerson(cur.kind) ? (cur.who === 'The client' ? `Waiting for ${esc(j.client)}` : `With ${esc(cur.who)}`) : cur.kind === 'rest' ? `A timed wait: ${esc(cur.who.toLowerCase())}` : 'Running by itself';
    now = `<section class="od-card"><h2>Now</h2><p class="od-now">${glyph(cur.kind)}<span><b>${what}</b><br>${esc(cur.name)} · since ${fmt(at(nowAt - 1))}</span></p>
${k ? `<a class="btn" href="today.html?as=${k}">Open ${esc(cur.who)}’s Today</a>` : ''}</section>`;
  }
  const draft = j.draft ? `<section class="od-card"><h2>Watar’s draft of the quote</h2><ul class="od-draft">${j.draft.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul><p class="hint">${esc(j.draft.note)} Total ${esc(j.draft.total)}.</p></section>` : '';
  const client = `<section class="od-card"><h2>Client</h2><dl class="od-dl"><dt>Name</dt><dd>${esc(j.client)}</dd><dt>For</dt><dd>${esc(j.of)}</dd><dt>People</dt><dd>${j.people}</dd><dt>Due</dt><dd>${esc(j.due)}</dd><dt>Their link</dt><dd><code>sufra.iqaa.app/q/${j.code.slice(-4)}</code></dd></dl><p class="hint">The client approves or asks for a change from this link, without an account.</p></section>`;
  const meta = `<p class="od-meta">Walks version 3 of Sufra’s line · <a href="line.html">See the line</a></p>`;
  $('[data-side]').innerHTML = now + draft + client + meta;
})();
