// Overview: the owner's view of the whole organization. The day in five numbers, the line's load as a map, the
// team's day as lines in time (each person's finished steps at their hour, what is still theirs ahead in grey),
// what needs attention, and what finished in the last 7 days.
(function () {
  const root = document.querySelector('main.ov');
  if (!root || !window.IQ || !window.Beats || !window.SUFRA || !window.JOBS) return;
  const S = window.SUFRA;
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = Beats.esc, isPerson = JOBS.isPerson, N = window.I18N.n;
  const line = S.line(), J = JOBS.on(line), V = JOBS.views(J, S);
  const jobs = S.jobs, live = jobs.filter((j) => !j.finished), fin = jobs.filter((j) => j.finished);
  const NOW = 9 * 60 + 41;
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

  const team = Object.keys(S.people).map((k) => ({ k, ...S.people[k] }));
  const waitingFor = (name) => live.filter((j) => { const x = J.stepOf(j); return x && isPerson(x.kind) && x.who === name; });
  // past delivery only the paperwork is left, so the event's date no longer makes a job due or late (the shared views)
  const soon = live.filter((j) => V.days(j.iso) <= 1 && !V.delivered(j)).sort((a, b) => a.iso.localeCompare(b.iso));
  const late = soon.filter(V.late), next = soon.find((j) => V.days(j.iso) >= 0);
  const clients = live.filter((j) => { const x = J.stepOf(j); return x && x.who === 'The client'; });
  const withTeam = live.filter((j) => { const x = J.stepOf(j); return x && isPerson(x.kind) && x.who !== 'The client'; });
  const stations = line.stations.length + line.routes.filter((r) => r.type === 'branch').reduce((n, r) => n + r.stations.length, 0);
  $('[data-day]').textContent = T(S.day);

  // ---------- the day in five numbers; each one opens the place that explains it ----------
  const kpi = [
    ['On the line', live.length, N(stations, 'across {n} station', 'across {n} stations'), 'orders.html', 'Line'],
    ['Due by tomorrow', soon.length, late.length ? `<b class="bad">${N(late.length, '{n} late', '{n} late')}</b>` : next ? T('next {when}, {time}', { when: V.when(next.iso), time: V.hm(next.iso) }) : T('nothing close'), '#due', 'Date'],
    ['With the team', withTeam.length, N(team.length, 'across {n} person', 'across {n} people'), '#tm-h', 'People'],
    ['Waiting on clients', clients.length, clients.length ? T('Iqaa reminds them') : T('none'), 'clients.html', 'Clients'],
    ['Finished, last 7 days', fin.length, T('walked the whole line'), '#done', 'Done'],
  ];
  $('[data-kpi]').innerHTML = kpi.map(([k, n, note, href, ic]) =>
    `<li><a class="kp" href="${href}"><span class="kp-k">${IQ.icon(ic, 16)}${T(k)}</span><span class="kp-n">${n}</span><span class="kp-s">${note}</span></a></li>`).join('');

  // ---------- the line now: across on wide screens, down the screen on phones; stations open Orders filtered ----------
  $('[data-map]').innerHTML = V.loadMap(jobs, null);
  const count = (id) => live.filter((j) => j.at === id).length;
  const branch = line.routes.find((r) => r.type === 'branch');
  $('[data-map-v]').innerHTML = J.main.map((st) => {
    const one = (x, br) => { const c = count(x.id), why = br && branch.over ? `<small>${T('orders over {n} people', { n: branch.over })}</small>` : '';
      return `<li class="${br ? 'br' : ''}${c ? '' : ' none'}"><button type="button" data-at="${x.id}" aria-label="${esc(T('{station}: {jobs}', { station: T(x.name), jobs: N(c, '{n} job', '{n} jobs') }))}"><span class="d" aria-hidden="true"></span><span class="nm">${esc(T(x.name))}${why}</span><span class="c">${c}</span></button></li>`; };
    return one(st) + (branch && branch.from === st.id ? branch.stations.map((x) => one(x, true)).join('') : '');
  }).join('');
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-at]');
    if (b) location.href = `orders.html?at=${b.dataset.at}`;
  });

  // ---------- the team today: one line in time each, on one shared clock with its hours labelled once ----------
  const scale = (W) => {
    const narrow = W < 420, from = 8 * 60, to = (narrow ? 14 : 18) * 60;
    return { narrow, from, to, x: (m) => 8 + ((Math.min(Math.max(m, from), to) - from) / (to - from)) * (W - 16) };
  };
  // the axis and each person's line are drawings of time: class flow runs them right to left in Arabic
  function axis(W) {
    const { narrow, from, to, x } = scale(W);
    let svg = `<svg class="flow" direction="ltr" viewBox="0 0 ${W} 22" width="${W}" height="22" aria-hidden="true">`;
    // hours every two, dropped where they would sit under the 'now' label
    for (let h = from / 60; h <= to / 60; h += 2) {
      if (Math.abs(x(h * 60) - x(NOW)) < 36) continue;
      const anchor = h * 60 === from ? 'start' : h * 60 === to ? 'end' : 'middle';
      svg += `<text x="${x(h * 60)}" y="15" text-anchor="${anchor}">${String(h).padStart(2, '0')}</text>`;
    }
    return `${svg}<text class="nw" x="${x(NOW)}" y="15" text-anchor="middle">${esc(T('now {time}', { time: hhmm(NOW) }))}</text></svg>`;
  }
  function rhythm(person, W) {
    const { narrow, from, to, x } = scale(W), H = 52, base = 34, k = narrow ? 0.62 : 0.74;
    const pal = window.IQAA.pal.light;
    let svg = `<svg class="flow" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><path class="day" d="M${x(from)} ${base}H${x(to)}"/>`;
    for (let h = from / 60; h <= to / 60; h += 1) svg += `<path class="hr" d="M${x(h * 60)} ${base + 4}v${h % 2 ? 3 : 6}"/>`;
    let cursor = -Infinity;
    S.done.filter((d) => d.who === person.name).forEach((d) => {
      let px = Math.max(x(toMin(d.time)), cursor + 6);
      d.kinds.forEach((kind) => { svg += IQ.cell(kind, px / k, base / k, pal, k); px += IQ.WIDTH[kind] * k; });
      cursor = px;
    });
    const nx = Math.max(x(NOW), cursor + 8);
    let ax = nx + 10;
    waitingFor(person.name).forEach((j) => {
      J.station(j.at).st.steps.slice(j.step).filter((y) => isPerson(y.kind) && y.who === person.name).forEach((y) => {
        svg += IQ.cell(y.kind, ax / k, base / k, pal, k, true); ax += IQ.WIDTH[y.kind] * k + 3;
      });
      ax += 8;
    });
    return `${svg}<path class="now" d="M${nx} 4V${base + 8}"/></svg>`;
  }
  function renderTeam() {
    const el = $('[data-team]'), wide = el.clientWidth >= 520;
    const W = Math.max(240, Math.round(el.clientWidth - (wide ? 172 + 16 : 0) - 16));
    el.innerHTML = `<li class="tm-axis" aria-hidden="true"><span></span><span class="tm-line">${axis(W)}</span></li>` + team.map((p) => {
      const n = S.done.filter((d) => d.who === p.name).length, w = waitingFor(p.name).length;
      const who = V.named('name', p.name);
      return `<li><a class="tm" href="today.html?as=${p.k}" aria-label="${esc(T('{name}, {role}: {done} done today, {waiting} waiting. Open {name}’s Today.', Object.assign({ role: T(p.role), done: n, waiting: w }, who)))}">
<span class="tm-who"><span class="me-av" aria-hidden="true">${esc(T(p.name).charAt(0))}</span><span><b>${esc(T(p.name))}</b><span>${esc(T(p.role))}</span><span class="tm-n">${T('{done} done · {waiting} waiting', { done: `<i>${n}</i>`, waiting: `<i>${w}</i>` })}</span></span></span>
<span class="tm-line">${rhythm(p, W)}</span></a></li>`;
    }).join('');
    el.classList.toggle('wide', wide);
  }
  renderTeam();
  let tw = 0;
  if (window.ResizeObserver) new ResizeObserver(() => { const w = $('[data-team]').clientWidth; if (w !== tw) { tw = w; renderTeam(); } }).observe($('[data-team]'));

  // ---------- needs attention: compact rows, the date first because that is what the owner scans for ----------
  $('[data-due]').innerHTML = soon.map(V.dueRow).join('') || `<li class="ov-none">${T('Nothing is due by tomorrow.')}</li>`;
  $('[data-clients]').innerHTML = clients.map(V.dueRow).join('') || `<li class="ov-none">${T('No job is waiting on a client.')}</li>`;

  // ---------- finished in the last 7 days: one line each ----------
  $('[data-done]').innerHTML = fin.map((j) => `<li><a class="dn" href="order.html?code=${j.code}" aria-label="${esc(T('{title} for {client}, finished {date}.', { title: T(j.title), client: T(j.client), date: V.fin(j) }))}">
<span class="dn-t"><b>${esc(T(j.title))}</b><span>${V.forWhom(j)}</span></span>
<span class="dn-d"><span>${IQ.icon('Date', 14)}${T('Event')}</span>${esc(V.due(j))}</span><span class="dn-d"><span>${IQ.icon('Done', 14)}${T('Finished')}</span>${esc(V.fin(j))}</span><code>${j.code}</code></a></li>`).join('');
  $('[data-n-due]').textContent = soon.length;
  // the sidebar's Clients item carries a count of the same name: this one is the panel's
  $('[data-n-clients]', root).textContent = clients.length;
  $('[data-n-done]').textContent = fin.length;
})();
