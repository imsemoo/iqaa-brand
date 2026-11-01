// Orders: every job on the line. The line itself is the filter: each station on the map shows how many jobs
// are there, and pressing it lists only those. Each row carries the job's metro strip and who it waits for.
(function () {
  const root = document.querySelector('main.or');
  if (!root || !window.IQ || !window.Beats || !window.SUFRA || !window.JOBS) return;
  const S = window.SUFRA, M = window.IQAA.motion;
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = Beats.esc;
  const line = S.line(), J = JOBS.on(line);
  const jobs = S.jobs;
  let tab = 'line', q = '';
  // a link from Overview may name the station to open on
  let at = new URLSearchParams(location.search).get('at');
  if (at && !J.station(at)) at = null;

  const V = JOBS.views(J, S);
  const renderMap = () => { $('[data-map]').innerHTML = V.loadMap(jobs, at); };
  const row = V.row;

  function visible() {
    const words = q.trim().toLowerCase();
    return jobs.filter((j) => (tab === 'done' ? !!j.finished : !j.finished))
      .filter((j) => !at || j.at === at)
      .filter((j) => !words || [j.code, j.title, j.client, j.of].join(' ').toLowerCase().includes(words))
      .sort((a, b) => (tab === 'done' ? b.iso.localeCompare(a.iso) : a.iso.localeCompare(b.iso)));
  }

  function render(animate) {
    const list = visible();
    $('[data-list]').innerHTML = list.map(row).join('');
    const empty = $('[data-empty]');
    empty.hidden = list.length > 0;
    if (!list.length) {
      const st = at && J.station(at).st;
      empty.innerHTML = `<p><b>${st ? `No job is at ${esc(st.name)} right now.` : 'No order matches.'}</b></p><button type="button" class="btn small" data-clear>${IQ.icon('Orders', 18)}<span>Show every order</span></button>`;
    }
    const live = jobs.filter((j) => !j.finished), fin = jobs.filter((j) => j.finished);
    $('[data-n="line"]').textContent = live.length;
    $('[data-n="done"]').textContent = fin.length;
    const soon = live.filter((j) => V.days(j.iso) <= 1 && !V.delivered(j)).length;
    $('[data-sum]').textContent = `${live.length} on the line, ${soon} due by tomorrow · ${fin.length} done in the last 7 days`;
    const f = $('[data-filter]');
    if (at) {
      f.hidden = false;
      f.innerHTML = `Only jobs at <b>${esc(J.station(at).st.name)}</b>. <button type="button" class="link" data-clear>Show every station</button>`;
    } else f.hidden = true;
    if (animate && !Beats.reduce()) [...$('[data-list]').children].forEach((li, i) => li.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }],
      { duration: M.quarter, delay: Math.min(i, 8) * (M.eighth / 2), easing: M.ease_arrive, fill: 'backwards' }));
  }

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.at) {
      at = at === t.dataset.at ? null : t.dataset.at;
      // a station holds only jobs on the line
      if (at) setTab('line', false);
      renderMap(); render(true);
      $(`[data-at="${t.dataset.at}"]`).focus();
      return;
    }
    if (t.dataset.tab) { setTab(t.dataset.tab, true); return; }
    if (t.hasAttribute('data-clear')) { at = null; q = ''; $('[data-q]').value = ''; renderMap(); render(true); }
  });
  function setTab(name, draw) {
    tab = name;
    if (name === 'done') at = null;
    root.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
    if (draw) { renderMap(); render(true); }
  }
  $('[data-q]').addEventListener('input', (e) => { q = e.target.value; render(false); });

  renderMap();
  render(false);
})();
