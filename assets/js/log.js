// The log: every move on the line, newest first. People's moves come from each item's log and are violet (a person);
// the machine's from the automated blocks' records, in ink; integrations' in and out in grey. Today is drawn first as
// bars by the hour, each stacked by who acted, so the day reads before the list.
(function () {
  const root = document.querySelector('main.lg');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'khaled', masar: 'samir', wamda: 'hala' });
  const W = window.WORLD, T = window.T, N = window.I18N.n, esc = FLOW.esc, O = C.O;
  const $ = (s) => root.querySelector(s);
  const icon = (n, s) => IQ.icon(n, s || 18);
  root.querySelectorAll('a[data-keep]').forEach((a) => { a.href = C.href(a.getAttribute('href')); });
  if (!C.P.owner) {
    $('[data-body]').innerHTML = `<div class="pk-none"><p><b>${esc(T('The settings of {org} belong to its owner.', { org: T(O.name) }))}</b></p></div>`;
    return;
  }
  const SAID = {
    claimed: '{name} claimed it at {block}', started: '{name} started working on it at {block}', sent: '{name} handed it over for approval at {block}',
    'took back': '{name} took it back at {block}', done: '{name} finished {block}', approved: '{name} approved it at {block}', returned: '{name} sent it back from {block}',
    assigned: '{name} assigned it at {block}', version: '{name} uploaded version {v} at {block}', pr: '{name} opened pull request #{v}', merged: '{name} merged pull request #{v}',
  };
  const MACHINE = {
    in: '{actor} let {code} into the line', duplicate: '{actor} stopped a duplicate of {code}', draft: '{actor} prepared a draft of {code}',
    edited: '{actor} edited {code} and handed it over', carousel: '{actor} made the carousel of {code}', post: '{actor} prepared the post of {code}',
    published: '{actor} published {code} on Telegram', approved: '{actor} approved {code}',
  };
  // ---------- every move, one shape ----------
  const all = [];
  C.items.forEach((it) => (it.log || []).forEach(([bid, who, at, what, d]) => {
    const b = C.block(bid) || { name: bid };
    const said = d == null && what === 'version' ? '{name} uploaded a new version at {block}' : SAID[what];
    all.push({ at, kind: 'person', who, text: said ? T(said, { name: C.name(who), block: T(b.name), v: d }) : `${C.name(who)} · ${what}`, code: it.code, title: T(it.title) });
  }));
  ((O.newsLine || {}).blocks || []).forEach((b) => (b.record || []).forEach((r) => {
    all.push({ at: r.at, kind: r.by ? 'person' : 'machine', who: r.by, text: T(MACHINE[r.did] || '{actor} · {code}', { actor: r.by ? C.name(r.by) : T('Automation'), code: r.code }), code: r.code, title: T(b.name) });
  }));
  (O.events || []).forEach((e) => {
    all.push({ at: e.at, kind: 'integration', text: T(e.text, Object.assign({ code: e.code || '' }, Object.fromEntries(Object.entries(e.vars || {}).map(([k, v]) => [k, typeof v === 'string' ? T(v) : v])))), code: e.code, title: T(e.via ? (O.integrations || []).find((x) => x.id === e.via)?.name || e.via : ''), bad: e.state === 'failed' });
  });
  all.sort((a, b) => b.at.localeCompare(a.at));

  // ---------- today, by the hour, stacked by who acted ----------
  const today = all.filter((x) => FLOW.dayOf(x.at) === 0);
  const hours = today.map((x) => +x.at.slice(11, 13));
  const from = Math.min(...hours, 8), to = Math.max(...hours, +W.now.slice(11, 13));
  const KINDS = [['person', T('People')], ['machine', T('Automation')], ['integration', T('Integrations')]];
  const per = [...Array(to - from + 1).keys()].map((i) => { const h = from + i; const at = today.filter((x) => +x.at.slice(11, 13) === h); return { h, n: KINDS.map(([k]) => at.filter((x) => x.kind === k).length) }; });
  const most = Math.max(1, ...per.map((p) => p.n.reduce((a, b) => a + b, 0)));
  $('[data-day]').innerHTML = `<div class="lg-chart" role="img" aria-label="${esc(N(today.length, 'Today: {n} move', 'Today: {n} moves'))}"><ol class="lg-bars" dir="ltr">${per.map((p) => `<li><span class="lg-stack" style="--t:${(p.n.reduce((a, b) => a + b, 0) / most * 100).toFixed(1)}">${p.n.map((n, i) => (n ? `<i class="${KINDS[i][0]}" style="flex:${n}" title="${esc(`${KINDS[i][1]}: ${n}`)}"></i>` : '')).join('')}</span><span>${String(p.h).padStart(2, '0')}</span></li>`).join('')}</ol>`
    + `<p class="lg-key" aria-hidden="true">${KINDS.map(([k, n]) => `<span class="${k}"><i></i>${esc(n)} ${today.filter((x) => x.kind === k).length}</span>`).join('')}</p></div>`;

  // ---------- the list, with its filter ----------
  let filter = 'all';
  const day = (iso) => { const d = FLOW.dayOf(iso); return d === 0 ? T('Today') : d === -1 ? T('Yesterday') : FLOW.date(iso); };
  const GLYPH = { person: 'struck', machine: 'run' };
  function list() {
    const F = [['all', T('All')]].concat(KINDS);
    $('[data-filter]').innerHTML = F.map(([k, n]) => `<button type="button" data-f="${k}" aria-pressed="${k === filter}">${esc(n)} <span>${k === 'all' ? all.length : all.filter((x) => x.kind === k).length}</span></button>`).join('');
    const shown = all.filter((x) => filter === 'all' || x.kind === filter).slice(0, 60);
    const groups = [];
    shown.forEach((x) => { const d = x.at.slice(0, 10), g = groups[groups.length - 1]; if (g && g.d === d) g.list.push(x); else groups.push({ d, at: x.at, list: [x] }); });
    $('[data-list]').innerHTML = groups.map((g) => `<h2 class="lg-dh">${esc(day(g.at))}</h2><ol class="lg-list">${g.list.map((x) => {
      const mark = x.kind === 'integration' ? `<span class="lg-ic">${icon('Webhook', 16)}</span>` : `<span class="lg-g ${x.kind}" aria-hidden="true">${IQ.glyph(GLYPH[x.kind])}</span>`;
      const code = x.code && C.items.some((i) => i.code === x.code) ? `<a href="${C.href('item.html', { code: x.code })}"><code dir="ltr">${esc(x.code)}</code></a>` : x.code ? `<code dir="ltr">${esc(x.code)}</code>` : '';
      return `<li class="${x.kind}${x.bad ? ' bad' : ''}">${mark}<span class="lg-t"><b>${esc(x.text)}</b><small>${code}${x.title ? ` · ${esc(x.title)}` : ''}</small></span><time dir="ltr">${x.at.slice(11, 16)}</time></li>`;
    }).join('')}</ol>`).join('') + (all.filter((x) => filter === 'all' || x.kind === filter).length > 60 ? `<p class="lg-more">${esc(T('The latest 60 are shown.'))}</p>` : '');
  }
  root.addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (b) { filter = b.dataset.f; list(); } });
  list();
  document.title = `${T('Log')} · ${T(O.name)}`;
})();
