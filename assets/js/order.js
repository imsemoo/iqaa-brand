// One order: its line written as a signature in time. What is done is a real stroke, the pen is where the job is,
// and what is still ahead is drawn with the dashed grey pen. Station by station below; who it waits for beside.
(function () {
  const root = document.querySelector('main.od');
  if (!root || !window.IQ || !window.Beats || !window.SUFRA || !window.JOBS) return;
  const S = window.SUFRA;
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = Beats.esc, isPerson = JOBS.isPerson, N = window.I18N.n;
  const line = S.line(), J = JOBS.on(line), V = JOBS.views(J, S), K = JOBS.clients(J, S, V);
  const code = new URLSearchParams(location.search).get('code') || 'SFR-26-0031';
  // today's jobs, and the orders before them
  const j = S.jobs.concat(S.past).find((x) => x.code === code);
  const glyph = (k, test) => `<span class="g" aria-hidden="true">${IQ.glyph(k, { test: !!test })}</span>`;
  const keyOf = (name) => Object.keys(S.people).find((k) => S.people[k].name === name);
  const time = (t) => `<time datetime="${V.iso(t)}">${V.label(t)}</time>`;


  if (!j) {
    $('[data-head]').innerHTML = `<h1>${T('No order {code}', { code: `<bdi>${esc(code)}</bdi>` })}</h1><p class="od-sub">${T('It may have been typed wrong. {link}.', { link: `<a href="orders.html">${T('See every order')}</a>` })}</p>`;
    $('.od-journey').hidden = true; $('.od-grid').hidden = true;
    return;
  }
  document.title = `${T(j.title)} · ${j.code} · ${T('Sufra')}`;
  const c = K.get(j.ck), f = K.facts(j), past = S.past.includes(j);
  // an order from before today belongs to its client's history: back to the client, not to today's orders
  if (past) { const back = $('.od-back a'); back.href = `client.html?c=${c.key}`; back.textContent = T(c.name); }

  // ---------- the job's steps in order, each done, now, ahead or not needed, with the times of the shared clock ----------
  const route = J.route(j);
  const steps = V.clock(j);
  const nowAt = j.finished ? steps.length : steps.findIndex((s) => s.state === 'now');
  const state = (i) => steps[i].state;
  const since = V.since(j);
  // the delivery that arrived late is drawn as the failed snap, never as a loop that ticked 'Arrived on time'
  const kindOf = (s) => (s.x.name === 'Yusuf delivers' && f.late && s.state === 'done' ? 'failed' : s.x.kind);
  const reminded = f.rounds.find((r) => r.reminded);

  // ---------- head ----------
  const cur = J.stepOf(j), p = j.finished ? null : J.station(j.at);
  $('[data-head]').innerHTML = `<div class="od-t"><p class="od-code"><code>${j.code}</code></p><h1>${esc(T(j.title))}</h1>
<p class="od-sub">${T('{who} · due {due}', { who: V.forWhom(j), due: `<b>${esc(V.due(j))}</b>` })}</p></div>
<p class="od-state">${j.finished ? `${glyph('struck')}<span>${esc(T('Finished {date}. Every station signed it.', { date: V.fin(j) }))}</span>` : `${glyph(cur.kind)}<span>${T('At {station}: {step}', { station: `<b>${esc(T(p.st.name))}</b>`, step: esc(T(cur.name)) })}</span>`}</p>`;

  // ---------- the journey: one stroke; the pen stands where the job is (drawn by the shared views, as Watar draws it) ----------
  const jr = V.journey(j);
  $('[data-journey]').innerHTML = jr.svg;
  $('[data-jr-cap]').textContent = jr.cap;

  // ---------- station by station ----------
  // when a done step happened, in words: the reminder's wait as a range, an answer that needed it, a change asked for
  function note(s) {
    if (s.state === 'skip') return esc(T('Not needed: {C} answered first', V.named('C', c.C)));
    if (s.state === 'now') return s.x.who === 'The client' ? `<b>${esc(T('Waiting for {name}', { name: T(V.short(j)) }))}</b>` : `<b>${T('Now')}</b>`;
    if (s.state === 'next') return T('Next');
    if (s.x.name === 'Wait two days' && reminded) return `${time(reminded.sent)}–${time(reminded.reminded)}`;
    if (s.x.name === 'The client approves' && reminded) return T('{time} · after the reminder', { time: time(s.t) });
    return time(s.t);
  }
  function asked(s) {
    if (s.x.name !== 'The client approves' || s.state !== 'done') return '';
    return f.rounds.map((r, n) => (r.change ? `<p class="od-asked">${T('Asked for a change {time}: “{change}”', { time: time(r.answer), change: esc(T(r.change)) })}${f.rounds[n + 1] ? T(' · new quote {time}', { time: time(f.rounds[n + 1].sent) }) : ''}</p>` : '')).join('');
  }
  let i = 0;
  $('[data-stations]').innerHTML = route.map((st) => {
    const rows = st.steps.map((x) => {
      const n = i++, s = state(n);
      const who = isPerson(x.kind) ? T(x.who === 'The client' ? j.client : x.who) : x.kind === 'rest' ? V.rest(x.who) : T('Runs by itself');
      // a late arrival is said in place of a checklist that would tick 'Arrived on time'
      const lateNow = kindOf(steps[n]) === 'failed';
      const check = lateNow ? `<p class="od-asked">${T('Arrived {arrived} for {due} · {late}', { arrived: V.hm(f.arrived), due: V.hm(j.iso), late: `<span class="t-late">${N(f.late, '{n} min late', '{n} min late')}</span>` })}</p>`
        : s === 'done' && x.check ? `<ul class="od-check" aria-label="${T('Checklist, locked')}">${x.check.map((t) => `<li>${esc(T(t))}</li>`).join('')}</ul>` : '';
      return `<li class="os-step ${s}">${glyph(kindOf(steps[n]), s === 'next' || s === 'skip')}<span class="os-n"><b>${esc(T(x.name))}</b><span>${esc(who)}</span>${check}${asked(steps[n])}</span><span class="os-w">${note(steps[n])}</span></li>`;
    }).join('');
    const sStates = st.steps.map((_, k) => state(i - st.steps.length + k)).filter((x) => x !== 'skip');
    const sState = sStates.every((x) => x === 'done') ? 'done' : sStates.includes('now') ? 'now' : 'next';
    const label = T({ done: 'Done', now: 'The job is here', next: 'Ahead' }[sState]);
    const onBranch = line.routes.some((r) => r.type === 'branch' && r.stations.includes(st));
    return `<li class="os ${sState}"><h3><span class="os-dot" aria-hidden="true"></span>${esc(T(st.name))}${onBranch ? ` <span class="os-br">${T('branch for big orders')}</span>` : ''}<span class="os-s">${label}</span></h3><ol>${rows}</ol></li>`;
  }).join('');

  // ---------- beside: who it waits for, the client, Watar's draft ----------
  let now = '';
  if (!j.finished) {
    const k = isPerson(cur.kind) && keyOf(cur.who);
    const what = isPerson(cur.kind) ? (cur.who === 'The client' ? T('Waiting for {name}', { name: T(V.short(j)) }) : T('With {name}', { name: T(cur.who) })) : cur.kind === 'rest' ? V.rest(cur.who, 'is') : T('Running by itself');
    // the question stays English in the link: Ask Watar reads it as the data's words
    const ask = `watar.html?q=${encodeURIComponent(`Why is ${j.title} waiting?`)}`;
    now = `<section class="od-card"><h2>${IQ.icon('Today', 18)}${T('Now')}</h2><p class="od-now">${glyph(cur.kind)}<span><b>${esc(what)}</b><br>${esc(T(cur.name))}${since != null ? T(' · since {time}', { time: time(since) }) : ''}</span></p>
${k ? `<a class="btn" href="today.html?as=${k}">${IQ.icon('Today', 18)}<span>${esc(T('Open {name}’s Today', V.named('name', cur.who)))}</span></a>` : ''}<a class="od-all" href="${ask}">${IQ.icon('Ask Watar', 18)}<span>${T('Ask Watar why it waits')}</span></a></section>`;
  }
  const draft = j.draft ? `<section class="od-card"><h2>${IQ.icon('Draft', 18)}${T('Watar’s draft of the quote')}</h2><ul class="od-draft">${j.draft.items.map((t) => `<li>${esc(T(t))}</li>`).join('')}</ul><p class="hint">${esc(T(j.draft.note))} ${esc(T('Total {total}.', { total: T(j.draft.total) }))}</p></section>` : '';
  const client = `<section class="od-card"><h2>${IQ.icon('Contact', 18)}${T('Client')}</h2><dl class="od-dl"><dt>${T('Name')}</dt><dd>${esc(T(j.client))}</dd><dt>${T('For')}</dt><dd>${esc(T(j.of))}</dd><dt>${T('People')}</dt><dd>${j.people}</dd><dt>${T('Due')}</dt><dd>${esc(V.due(j))}</dd><dt>${T('Their link')}</dt><dd><a href="quote.html?q=${j.code.slice(-4)}"><code dir="ltr">sufra.iqaa.app/q/${j.code.slice(-4)}</code></a></dd></dl><p class="hint">${T('The client approves or asks for a change from this link, without an account.')}</p>
<a class="od-all" href="client.html?c=${c.key}">${IQ.icon('History', 18)}<span>${esc(T('All of {name}’s orders', V.named('name', c.name)))}</span></a></section>`;
  // no version history exists for the orders before today, so only today's jobs name the version they walk
  const meta = past ? '' : `<p class="od-meta">${T('Walks version {n} of Sufra’s line · {link}', { n: 3, link: `<a href="line.html">${T('See the line')}</a>` })}</p>`;
  $('[data-side]').innerHTML = now + draft + client + meta;
})();
