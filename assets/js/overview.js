// Overview: the owner's view of the whole organization. The line's load as a map, the team's day as lines in
// time (each person's finished steps at their hour, what is still theirs ahead in grey), and what needs attention.
(function () {
  const root = document.querySelector('main.ov');
  if (!root || !window.IQ || !window.Beats || !window.SUFRA || !window.JOBS) return;
  const S = window.SUFRA;
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = Beats.esc, isPerson = JOBS.isPerson;
  const line = S.line(), J = JOBS.on(line), V = JOBS.views(J, S);
  const jobs = S.jobs, live = jobs.filter((j) => !j.finished), fin = jobs.filter((j) => j.finished);
  const NOW = 9 * 60 + 41;
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

  // ---------- head ----------
  const soon = live.filter((j) => V.days(j.iso) <= 1);
  const team = Object.keys(S.people).map((k) => ({ k, ...S.people[k] }));
  const waitingFor = (name) => live.filter((j) => { const x = J.stepOf(j); return x && isPerson(x.kind) && x.who === name; });
  $('[data-day]').textContent = S.day;
  $('[data-sum]').textContent = `${live.length} jobs on the line, ${soon.length} due by tomorrow · ${fin.length} finished this week`;

  // ---------- the line now: stations open Orders filtered to them ----------
  $('[data-map]').innerHTML = V.loadMap(jobs, null);
  $('[data-map]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-at]');
    if (b) location.href = `orders.html?at=${b.dataset.at}`;
  });

  // ---------- the team today: one line in time each, on one shared clock ----------
  function rhythm(person, W) {
    const narrow = W < 560, from = 8 * 60, to = (narrow ? 14 : 18) * 60, H = 64, base = 40, k = narrow ? 0.62 : 0.8;
    const x = (m) => 8 + ((Math.min(Math.max(m, from), to) - from) / (to - from)) * (W - 16);
    const pal = window.IQAA.pal.light;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><path class="day" d="M${x(from)} ${base}H${x(to)}"/>`;
    for (let h = from / 60; h <= to / 60; h += narrow ? 2 : 1) svg += `<path class="hr" d="M${x(h * 60)} ${base + 5}v5"/>`;
    let cursor = -Infinity;
    S.done.filter((d) => d.who === person.name).forEach((d) => {
      let px = Math.max(x(toMin(d.time)), cursor + 6);
      d.kinds.forEach((kind) => { svg += IQ.cell(kind, px / k, base / k, pal, k); px += IQ.WIDTH[kind] * k; });
      cursor = px;
    });
    const nx = Math.max(x(NOW), cursor + 8);
    let ax = nx + 10;
    waitingFor(person.name).forEach((j) => {
      const st = J.station(j.at).st;
      st.steps.slice(j.step).filter((y) => isPerson(y.kind) && y.who === person.name).forEach((y) => {
        svg += IQ.cell(y.kind, ax / k, base / k, pal, k, true); ax += IQ.WIDTH[y.kind] * k + 3;
      });
      ax += 8;
    });
    return `${svg}<path class="now" d="M${nx} 6V${base + 10}"/></svg>`;
  }
  function renderTeam() {
    const W = Math.max(260, Math.round($('[data-team]').clientWidth - (innerWidth < 700 ? 0 : 236)));
    $('[data-team]').innerHTML = team.map((p) => {
      const n = S.done.filter((d) => d.who === p.name).length, w = waitingFor(p.name).length;
      return `<li><a class="tm" href="today.html?as=${p.k}" aria-label="${esc(p.name)}, ${esc(p.role)}: ${n} done today, ${w} waiting. Open ${esc(p.name)}’s Today.">
<span class="tm-who"><span class="me-av" aria-hidden="true">${esc(p.name.charAt(0))}</span><span><b>${esc(p.name)}</b><span>${esc(p.role)}</span><span class="tm-n">${n} done · ${w} waiting</span></span></span>
<span class="tm-line">${rhythm(p, W)}</span></a></li>`;
    }).join('');
  }
  renderTeam();
  let tw = 0;
  new ResizeObserver(() => { const w = $('[data-team]').clientWidth; if (w !== tw) { tw = w; renderTeam(); } }).observe($('[data-team]'));

  // ---------- needs attention ----------
  const clients = live.filter((j) => { const x = J.stepOf(j); return x && x.who === 'The client'; });
  const due = soon.slice().sort((a, b) => a.iso.localeCompare(b.iso));
  $('[data-due]').innerHTML = due.map(V.row).join('') || '<li class="ov-none">Nothing is due by tomorrow.</li>';
  $('[data-clients]').innerHTML = clients.map(V.row).join('') || '<li class="ov-none">No job is waiting on a client.</li>';
  $('[data-done]').innerHTML = fin.map(V.row).join('');
  $('[data-n-due]').textContent = due.length;
  $('[data-n-clients]').textContent = clients.length;
  $('[data-n-done]').textContent = fin.length;
})();
