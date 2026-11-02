// Reports: the line's last 30 days for its owner, and the same screen for every organization. First the core's
// numbers, counted the same way everywhere from the line's log with nothing to set up: the items that finished, their
// whole journey, how many came back on the way and how many kept their due times. Then every block in the line's
// order: how many went through it, how long it kept them against what it expects (its hours on the line) and how many
// came back to it; the block furthest over its time is the line's bottleneck. The results after delivery come from
// the organization's pack, on their own tab; an organization without a pack has the line and its people only. Every
// number is counted from world.js; nothing here is written for one organization.
(function () {
  const root = document.querySelector('main.rp');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'khaled', masar: 'samir' });
  const W = window.WORLD, T = window.T, N = window.I18N.n, esc = FLOW.esc, NO = C.noun, O = C.O;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const icon = (n, s) => IQ.icon(n, s || 20);
  const glyph = (kind) => `<span class="rp-g" aria-hidden="true">${IQ.glyph(kind)}</span>`;
  const DAY = 864e5;
  // a name inside a sentence, in lower case where the language has one: 'Script' → 'over the script' (as on Home)
  const lc = (s) => (I18N.lang === 'ar' ? s : s.charAt(0).toLocaleLowerCase(I18N.lang) + s.slice(1));
  // what this prototype does not do yet: shown, kept in reach of the keyboard, and said to be coming (as on Home)
  const soon = (label, cls, ic) => `<button type="button" class="btn ${cls || ''}" aria-disabled="true" title="${esc(T('{name}: coming next', { name: label }))}">${ic ? icon(ic, 18) : ''}<span>${esc(label)}</span><em>${T('Soon')}</em></button>`;
  // hours as a row says them: minutes under an hour, whole hours above, so blocks compare in one unit (as on Home)
  const span = (h) => (h < 1 ? N(Math.max(1, Math.round(h * 60)), '{n} min', '{n} min') : N(Math.round(h), '{n} h', '{n} h'));
  const pct = (x) => `${Math.round(x * 100)}%`;
  // one decimal place, none when it is a whole number: 4.2, 12.1, 3
  const one = (x) => String(Math.round(x * 10) / 10);
  // a large count as it is read at a glance: 2.4 million, 386 thousand; in a tile, the number and its word apart
  const bigOf = (n) => (n >= 1e6 ? { n: one(n / 1e6), u: T('million') } : n >= 1e4 ? { n: String(Math.round(n / 1e3)), u: T('thousand') } : { n: String(n), u: '' });
  const big = (n) => { const b = bigOf(n); return b.u ? T('{n} {unit}', { n: b.n, unit: b.u }) : b.n; };

  // the log's 30 days, read once: what went through each block (Home's `returns`) and what Reports adds (`report`)
  const R = O.returns || {}, P = O.report || {}, through = R.through || {}, days = R.days || 30;
  const first = C.path[0], last = C.path[C.path.length - 1], done = through[last.id] || 0;

  // numbers in one divided strip, as on Home; a value that is a word is set in the text face
  const tiles = (label, list) => `<ul class="rp-kpi" aria-label="${esc(label)}">${list.map((x) => `<li><span class="rp-k">${icon(x.ic, 18)}<span>${esc(x.k)}</span></span>`
    + `<span class="rp-n${x.word ? ' word' : ''}">${esc(x.n)}${x.u ? ` <small>${esc(x.u)}</small>` : ''}</span>${x.s ? `<span class="rp-s">${esc(x.s)}</span>` : ''}</li>`).join('')}</ul>`;
  const panel = (id, ic, title, sub, body) => `<section class="rp-pn" aria-labelledby="${id}"><div class="rp-ph"><h2 id="${id}">${icon(ic, 18)}${esc(title)}</h2>${sub || ''}</div>${body}</section>`;

  // ---------- the line: the core's numbers, then each block against what it expects ----------
  // a block that runs beside the main path (Design beside Montage) says which, as on Home
  function beside(b) {
    if (!b.side) return '';
    const m = C.path.find((x) => (x.after || []).some((a) => (b.after || []).includes(a)));
    return m ? T('beside {block}', { block: T(m.name) }) : '';
  }
  function lineTab() {
    if (!P.hours || !done) return `<p class="rp-none">${esc(NO.t('No job has finished in the last {days} days yet. The numbers start with the first one.', { days }))}</p>`;
    const kpi = tiles(T('The line in numbers'), [
      { k: NO.t('Finished jobs'), ic: 'Done', n: done, s: T('through {block}, the line’s last block', { block: T(last.name) }) },
      { k: T('The whole journey'), ic: 'History', n: one(P.journey / 24), s: T('days on average, from {first} to {last}', { first: T(first.name), last: T(last.name) }) },
      { k: T('Sent back'), ic: 'Undo', n: pct(P.backOnce / done), s: NO.t('{n} of {of} jobs came back at least once', { n: P.backOnce, of: done }) },
      { k: T('On time'), ic: 'Date', n: pct(P.onTime / done), s: NO.t('{n} of {of} jobs kept every due time', { n: P.onTime, of: done }) },
    ]);
    // each block: went through, kept them how long on average, expects how long, and the share that came back to it
    const rows = C.blocks.map((b) => {
      const n = through[b.id] || 0, avg = P.hours[b.id], back = (P.backTo || {})[b.id] || 0;
      return { b, n, avg, share: n ? back / n : 0, over: avg == null ? 0 : Math.round(avg) - b.hours };
    });
    // The bottleneck: the block whose items stay longest past what it expects, compared as the rows show it, in whole
    // hours. Nothing over its time, no bottleneck. Its main cause is the return that sent the most items back to it.
    const neck = rows.filter((r) => r.over > 0).sort((a, b) => b.over - a.over)[0] || null;
    const cause = neck && (R.back || []).filter((x) => x.to === neck.b.id && C.block(x.from) && O.fields[x.field]).sort((a, b) => b.n - a.n)[0];
    const why = cause ? NO.n(cause.n, '{n} job came back from {from} over the {field}', '{n} jobs came back from {from} over the {field}',
      { from: T(C.block(cause.from).name), field: lc(T(O.fields[cause.field].name)) }) : '';
    const K = { n: T('Went through'), avg: T('On average'), exp: T('Expected'), back: T('Came back') };
    const tr = (r) => {
      const b = r.b, hot = r === neck;
      // the bar: the time on average, with what the block expects always at its middle; past it the bar is red (Home's)
      const fill = r.avg == null ? 0 : Math.min(r.avg / b.hours, 2) * 50;
      const sub = [beside(b), hot ? why : ''].filter(Boolean).map((s) => `<small>${esc(s)}</small>`).join('');
      return `<tr${hot ? ' class="is-neck"' : ''}><th scope="row"><span class="rp-bk">${glyph(b.stroke)}<span class="rp-bn"><b>${esc(T(b.name))}</b>`
        + `${hot ? `<span class="rp-neck">${icon('Late', 14)}${esc(T('Bottleneck'))}</span>` : ''}${sub}</span></span></th>`
        + `<td data-k="${esc(K.n)}">${r.n}</td>`
        + `<td data-k="${esc(K.avg)}"><span class="rp-av"><span class="rp-v">${r.avg == null ? '–' : esc(span(r.avg))}</span><span class="rp-bar" style="--f:${fill.toFixed(1)}" aria-hidden="true"><i></i><i></i></span></span></td>`
        + `<td data-k="${esc(K.exp)}">${esc(span(b.hours))}</td><td data-k="${esc(K.back)}">${pct(r.share)}</td></tr>`;
    };
    const legend = `<p class="rp-lg" aria-hidden="true"><span><i class="rp-lg-b"></i>${esc(T('Time in the block, on average'))}</span><span><i class="rp-lg-t"></i>${esc(T('What the block expects'))}</span></p>`;
    const table = `<table class="rp-t"><caption class="sr">${esc(T('Each block of {line}, last {days} days', { line: T(C.line.name), days }))}</caption>
<thead><tr><th scope="col">${esc(T('Block'))}</th><th scope="col">${esc(K.n)}</th><th scope="col">${esc(K.avg)}</th><th scope="col">${esc(K.exp)}</th><th scope="col">${esc(K.back)}</th></tr></thead>
<tbody>${rows.map(tr).join('')}</tbody></table>
<p class="rp-fn">${esc(T('Counted from the line’s log, the same way for every organization, with nothing to set up. Expected is the time each block is given on the line.'))}</p>`;
    return kpi + panel('rp-bl-h', 'Line', T('Each block: how long it takes and how much comes back'), `<p>${esc(T(C.line.name))}</p>${legend}`, table);
  }

  // ---------- the results after delivery: the pack's own, in the pack's words ----------
  // a ranked list with a bar each, scaled to the largest (the platforms' reach, the bugs after each release)
  const ranked = (rows) => `<ul class="rp-rk">${rows.map((r) => `<li><span class="rp-rk-n">${r.name}</span><span class="rp-rk-b" style="--f:${r.f.toFixed(1)}" aria-hidden="true"><i></i></span><span class="rp-rk-v">${esc(r.v)}</span></li>`).join('')}</ul>`;
  const RESULTS = {
    'Media and production': (X) => {
      const plats = Object.entries(X.reach || {}).sort((a, b) => b[1] - a[1]);
      const total = plats.reduce((a, p) => a + p[1], 0), e = X.engagement || {}, best = X.best;
      if (!plats.length) return '';
      const out = [tiles(T('Results in numbers'), [
        Object.assign({ k: T('Reach'), ic: 'People', s: N(plats.length, 'people, on {n} platform', 'people, on {n} platforms') }, bigOf(total)),
        { k: T('Best platform'), ic: 'Publish', n: T(plats[0][0]), word: true, s: T('{pct} of the reach', { pct: pct(plats[0][1] / total) }) },
        e.visual != null ? { k: T('Engagement of visual content'), ic: 'Video', n: `${one(e.visual)}%`, s: e.text != null ? T('Text posts: {pct}', { pct: `${one(e.text)}%` }) : '' } : null,
      ].filter(Boolean))];
      const cols = [panel('rp-pl-h', 'Publish', T('Reach by platform'), '', ranked(plats.map((p) => ({ name: esc(T(p[0])), f: (p[1] / plats[0][1]) * 100, v: big(p[1]) }))))];
      // the piece that reached the most people: finished, so it lives in the saved archive, which comes later
      if (best) {
        cols.push(panel('rp-bp-h', 'Video', NO.t('The best job of the month'), '', `<div class="rp-best"><p class="rp-bt"><b>${esc(T(best.title))}</b><code dir="ltr">${esc(best.code)}</code></p>
<p class="rp-bm">${esc([T(best.platform), FLOW.date(best.at), T('{n} people reached', { n: big(best.reach) })].join(' · '))}</p>
<div>${soon(T('Open it in the saved archive'), 'small', 'Archive')}</div></div>`));
      }
      return out.concat(`<div class="rp-cols">${cols.join('')}</div>`).join('');
    },
    Software: (X) => {
      const rel = (X.releases || []).slice().sort((a, b) => a.at.localeCompare(b.at));
      if (!rel.length) return '';
      const bugs = rel.reduce((a, r) => a + r.bugs, 0), most = Math.max(1, ...rel.map((r) => r.bugs));
      const out = [tiles(T('Results in numbers'), [
        { k: T('Bugs after release'), ic: 'Test run', n: bugs, s: N(rel.length, 'after {n} release', 'after {n} releases') },
        // the team's speed: the items that left the line's last block, a week at a time
        { k: T('Team speed'), ic: 'Task', n: one((done / days) * 7), s: NO.t('jobs finished a week, on average') },
      ])];
      const list = ranked(rel.map((r) => ({ name: `<code dir="ltr">${esc(r.v)}</code><small>${esc(FLOW.date(r.at))}</small>`, f: (r.bugs / most) * 100, v: N(r.bugs, '{n} bug', '{n} bugs') })));
      return out.concat(`<div class="rp-cols">${panel('rp-rl-h', 'Release', T('Bugs after each release'), '', list)}</div>`).join('');
    },
  };
  const results = RESULTS[O.pack] && O.results ? RESULTS[O.pack](O.results) : '';
  function resultsTab() {
    return `<p class="rp-src">${icon('Settings', 16)}<span>${esc(T('From the {pack} pack, last {days} days after delivery', { pack: T(O.pack), days }))}</span></p>${results}`;
  }

  // ---------- the tabs: the line, its people (coming), and the pack's results where the organization has a pack ----------
  const TABS = [{ id: 'line', name: T('The line'), ic: 'Line', body: lineTab }, { id: 'people', name: T('People'), ic: 'People', soon: true }]
    .concat(results ? [{ id: 'results', name: T('Results'), ic: 'Reports', body: resultsTab }] : []);
  let tab = TABS.some((x) => x.id === location.hash.slice(1) && !x.soon) ? location.hash.slice(1) : 'line';
  function render() {
    if (C.standing !== 'owner') {
      $('[data-body]').innerHTML = `<p class="rp-closed">${icon('Lock')}<span>${esc(T('Reports are open to the organization’s owner.'))}</span></p>`;
      return;
    }
    const btn = (x) => (x.soon
      ? `<button type="button" role="tab" id="rp-t-${x.id}" aria-selected="false" aria-disabled="true" tabindex="-1" title="${esc(T('{name}: coming next', { name: x.name }))}">${icon(x.ic, 18)}<span>${esc(x.name)}</span><em>${T('Soon')}</em></button>`
      : `<button type="button" role="tab" id="rp-t-${x.id}" aria-controls="rp-p-${x.id}" aria-selected="${x.id === tab}" tabindex="${x.id === tab ? 0 : -1}" data-tab="${x.id}">${icon(x.ic, 18)}<span>${esc(x.name)}</span></button>`);
    $('[data-body]').innerHTML = `<div class="rp-tabs" role="tablist" aria-label="${esc(T('Reports'))}">${TABS.map(btn).join('')}</div>`
      + TABS.filter((x) => !x.soon).map((x) => `<div class="rp-panel" role="tabpanel" id="rp-p-${x.id}" aria-labelledby="rp-t-${x.id}" tabindex="0"${x.id === tab ? '' : ' hidden'}>${x.body()}</div>`).join('');
  }
  function select(id, focus) {
    tab = id;
    $$('[role="tab"][data-tab]', root).forEach((b) => { const on = b.dataset.tab === id; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
    $$('[role="tabpanel"]', root).forEach((p) => { p.hidden = p.id !== `rp-p-${id}`; });
    history.replaceState(null, '', `${location.pathname.split('/').pop()}${location.search}#${id}`);
    $$('a[data-lang-to]').forEach((a) => { a.href = I18N.href(a.dataset.langTo); });
  }
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[role="tab"][data-tab]');
    if (b) select(b.dataset.tab);
  });
  // the tabs follow the arrows, Home and End, in the page's direction; a tab still coming takes the focus, not the panel
  root.addEventListener('keydown', (e) => {
    const t = e.target.closest('[role="tab"]');
    if (!t) return;
    const all = $$('[role="tab"]', root), i = all.indexOf(t), dir = I18N.rtl ? -1 : 1;
    const go = { ArrowRight: i + dir, ArrowLeft: i - dir, Home: 0, End: all.length - 1 }[e.key];
    if (go == null) return;
    e.preventDefault();
    const to = all[(go + all.length) % all.length];
    if (to.dataset.tab) select(to.dataset.tab, true);
    else to.focus();
  });

  // ---------- the head: whose line, over which days, and the export that comes later ----------
  const from = new Date(FLOW.ms(`${W.dayIso}T12:00`) - (days - 1) * DAY).toISOString().slice(0, 16);
  document.title = `${T('Reports')} · ${T(O.name)}`;
  $('[data-h1]').textContent = T('Reports of the {line}', { line: lc(T(C.line.name)) });
  $('[data-period]').innerHTML = `${icon('Date', 16)}<span>${esc(N(days, 'Last {n} days', 'Last {n} days'))}</span><span class="rp-dates">${esc(T('{from} – {to}', { from: FLOW.date(from), to: FLOW.date(`${W.dayIso}T12:00`) }))}</span>`;
  $('[data-act]').innerHTML = C.standing === 'owner' ? soon(T('Export PDF'), '', 'Files') : '';
  render();
})();
