// One order: its line written as a signature in time. What is done is a real stroke, the pen is where the job is,
// and what is still ahead is drawn with the dashed grey pen. Station by station below; who it waits for beside.
(function () {
  const root = document.querySelector('main.od');
  if (!root || !window.IQ || !window.Beats || !window.SUFRA || !window.JOBS) return;
  const S = window.SUFRA;
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = Beats.esc, isPerson = JOBS.isPerson;
  const line = S.line(), J = JOBS.on(line), V = JOBS.views(J, S), K = JOBS.clients(J, S, V);
  const code = new URLSearchParams(location.search).get('code') || 'SFR-26-0031';
  // today's jobs, and the orders before them
  const j = S.jobs.concat(S.past).find((x) => x.code === code);
  const glyph = (k, test) => `<span class="g" aria-hidden="true">${IQ.glyph(k, { test: !!test })}</span>`;
  const keyOf = (name) => Object.keys(S.people).find((k) => S.people[k].name === name);
  const time = (t) => `<time datetime="${V.iso(t)}">${V.label(t)}</time>`;


  if (!j) {
    $('[data-head]').innerHTML = `<h1>No order ${esc(code)}</h1><p class="od-sub">It may have been typed wrong. <a href="orders.html">See every order</a>.</p>`;
    $('.od-journey').hidden = true; $('.od-grid').hidden = true;
    return;
  }
  document.title = `${j.title} · ${j.code} · Sufra`;
  const c = K.get(j.ck), f = K.facts(j), past = S.past.includes(j);
  // an order from before today belongs to its client's history: back to the client, not to today's orders
  if (past) { const back = $('.od-back a'); back.href = `client.html?c=${c.key}`; back.textContent = c.name; }

  // ---------- the job's steps in order, each done, now, ahead or not needed, with the times of the shared clock ----------
  const route = J.route(j);
  const steps = V.clock(j);
  const nowAt = j.finished ? steps.length : steps.findIndex((s) => s.state === 'now');
  const state = (i) => steps[i].state;
  const since = steps.slice(0, Math.max(nowAt, 0)).filter((s) => s.t != null).pop();
  // the delivery that arrived late is drawn as the failed snap, never as a loop that ticked 'Arrived on time'
  const kindOf = (s) => (s.x.name === 'Yusuf delivers' && f.late && s.state === 'done' ? 'failed' : s.x.kind);
  const reminded = f.rounds.find((r) => r.reminded);

  // ---------- head ----------
  const cur = J.stepOf(j), p = j.finished ? null : J.station(j.at);
  $('[data-head]').innerHTML = `<div class="od-t"><p class="od-code"><code>${j.code}</code></p><h1>${esc(j.title)}</h1>
<p class="od-sub">${esc(j.client)}, ${esc(j.of)} · ${j.people} people · due <b>${esc(j.due)}</b></p></div>
<p class="od-state">${j.finished ? `${glyph('struck')}<span>Finished ${esc(j.finished)}. Every station signed it.</span>` : `${glyph(cur.kind)}<span>At <b>${esc(p.st.name)}</b>: ${esc(cur.name)}</span>`}</p>`;

  // ---------- the journey: one stroke; the pen stands where the job is (drawn by the shared views, as Watar draws it) ----------
  const jr = V.journey(j);
  $('[data-journey]').innerHTML = jr.svg;
  $('[data-jr-cap]').textContent = jr.cap;

  // ---------- station by station ----------
  // when a done step happened, in words: the reminder's wait as a range, an answer that needed it, a change asked for
  function note(s) {
    if (s.state === 'skip') return `Not needed: ${esc(c.C)} answered first`;
    if (s.state === 'now') return s.x.who === 'The client' ? `<b>Waiting for ${esc(V.short(j))}</b>` : '<b>Now</b>';
    if (s.state === 'next') return 'Next';
    if (s.x.name === 'Wait two days' && reminded) return `${time(reminded.sent)}–${time(reminded.reminded)}`;
    if (s.x.name === 'The client approves' && reminded) return `${time(s.t)} · after the reminder`;
    return time(s.t);
  }
  function asked(s) {
    if (s.x.name !== 'The client approves' || s.state !== 'done') return '';
    return f.rounds.map((r, n) => (r.change ? `<p class="od-asked">Asked for a change ${time(r.answer)}: “${esc(r.change)}”${f.rounds[n + 1] ? ` · new quote ${time(f.rounds[n + 1].sent)}` : ''}</p>` : '')).join('');
  }
  let i = 0;
  $('[data-stations]').innerHTML = route.map((st) => {
    const rows = st.steps.map((x) => {
      const n = i++, s = state(n);
      const who = isPerson(x.kind) ? (x.who === 'The client' ? j.client : x.who) : x.kind === 'rest' ? `Waits ${x.who.toLowerCase()}` : 'Runs by itself';
      // a late arrival is said in place of a checklist that would tick 'Arrived on time'
      const lateNow = kindOf(steps[n]) === 'failed';
      const check = lateNow ? `<p class="od-asked">Arrived ${V.hm(f.arrived)} for ${V.hm(j.iso)} · <span class="t-late">${f.late} min late</span></p>`
        : s === 'done' && x.check ? `<ul class="od-check" aria-label="Checklist, locked">${x.check.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '';
      return `<li class="os-step ${s}">${glyph(kindOf(steps[n]), s === 'next' || s === 'skip')}<span class="os-n"><b>${esc(x.name)}</b><span>${esc(who)}</span>${check}${asked(steps[n])}</span><span class="os-w">${note(steps[n])}</span></li>`;
    }).join('');
    const sStates = st.steps.map((_, k) => state(i - st.steps.length + k)).filter((x) => x !== 'skip');
    const sState = sStates.every((x) => x === 'done') ? 'done' : sStates.includes('now') ? 'now' : 'next';
    const label = { done: 'Done', now: 'The job is here', next: 'Ahead' }[sState];
    const onBranch = line.routes.some((r) => r.type === 'branch' && r.stations.includes(st));
    return `<li class="os ${sState}"><h3><span class="os-dot" aria-hidden="true"></span>${esc(st.name)}${onBranch ? ' <span class="os-br">branch for big orders</span>' : ''}<span class="os-s">${label}</span></h3><ol>${rows}</ol></li>`;
  }).join('');

  // ---------- beside: who it waits for, the client, Watar's draft ----------
  let now = '';
  if (!j.finished) {
    const k = isPerson(cur.kind) && keyOf(cur.who);
    const what = isPerson(cur.kind) ? (cur.who === 'The client' ? `Waiting for ${esc(V.short(j))}` : `With ${esc(cur.who)}`) : cur.kind === 'rest' ? `A timed wait: ${esc(cur.who.toLowerCase())}` : 'Running by itself';
    const ask = `watar.html?q=${encodeURIComponent(`Why is ${j.title} waiting?`)}`;
    now = `<section class="od-card"><h2>${IQ.icon('Today', 18)}Now</h2><p class="od-now">${glyph(cur.kind)}<span><b>${what}</b><br>${esc(cur.name)}${since ? ` · since ${time(since.t)}` : ''}</span></p>
${k ? `<a class="btn" href="today.html?as=${k}">${IQ.icon('Today', 18)}<span>Open ${esc(cur.who)}’s Today</span></a>` : ''}<a class="od-all" href="${ask}">${IQ.icon('Ask Watar', 18)}<span>Ask Watar why it waits</span></a></section>`;
  }
  const draft = j.draft ? `<section class="od-card"><h2>${IQ.icon('Draft', 18)}Watar’s draft of the quote</h2><ul class="od-draft">${j.draft.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul><p class="hint">${esc(j.draft.note)} Total ${esc(j.draft.total)}.</p></section>` : '';
  const client = `<section class="od-card"><h2>${IQ.icon('Contact', 18)}Client</h2><dl class="od-dl"><dt>Name</dt><dd>${esc(j.client)}</dd><dt>For</dt><dd>${esc(j.of)}</dd><dt>People</dt><dd>${j.people}</dd><dt>Due</dt><dd>${esc(j.due)}</dd><dt>Their link</dt><dd><code>sufra.iqaa.app/q/${j.code.slice(-4)}</code></dd></dl><p class="hint">The client approves or asks for a change from this link, without an account.</p>
<a class="od-all" href="client.html?c=${c.key}">${IQ.icon('History', 18)}<span>All of ${esc(c.name)}’s orders</span></a></section>`;
  // no version history exists for the orders before today, so only today's jobs name the version they walk
  const meta = past ? '' : `<p class="od-meta">Walks version 3 of Sufra’s line · <a href="line.html">See the line</a></p>`;
  $('[data-side]').innerHTML = now + draft + client + meta;
})();
