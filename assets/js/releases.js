// Releases: the next release's tickets as one bar split by where they stand on the line (released, in review or test,
// in the work, not started), then each ticket; under it the past releases as a line of dots with the bugs found
// after each as bars.
(function () {
  const root = document.querySelector('main.sp');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'khaled', masar: 'samir', wamda: 'hala' });
  const T = window.T, N = window.I18N.n, esc = FLOW.esc, O = C.O, NO = C.noun;
  const $ = (s) => root.querySelector(s);
  const icon = (n, s) => IQ.icon(n, s || 16);
  const none = (t) => { $('[data-body]').innerHTML = `<p class="sp-none">${icon('Repository', 20)}<span>${esc(t)}</span></p>`; };
  const past = ((O.results || {}).releases || []).slice().sort((a, b) => b.at.localeCompare(a.at));
  const tickets = C.items.filter((it) => it.fields && it.fields.release);
  if (!past.length && !tickets.length) return none(T('No release yet.'));
  const vs = [...new Set(tickets.map((it) => it.fields.release))].sort();
  const next = vs[0];
  const stage = (it) => { const b = C.at(it); return b.kind === 'auto' ? 'out' : b.kind === 'approval' ? 'check' : C.placeOf(it) <= 1 ? 'early' : 'work'; };
  const PARTS = [['out', T('Released')], ['check', T('In review or test')], ['work', T('In the work')], ['early', T('Not started')]];
  // every coming version, nearest first: its tickets as one bar split by where they stand, then each ticket
  const n = (k, list) => list.filter((it) => stage(it) === k).length;
  $('[data-sum]').innerHTML = `<span class="stats">${FLOW.stat('Release', next, T('Next release: {v}', { v: next }))}${FLOW.stat('Done', tickets.length, NO.n(tickets.length, '{n} job', '{n} jobs'))}</span>`;
  const coming = (v) => {
    const mine = tickets.filter((it) => it.fields.release === v);
    const bar = `<div class="sp-split" role="img" aria-label="${esc(PARTS.map(([k, t]) => `${t}: ${n(k, mine)}`).join(T(', ')))}">${PARTS.map(([k]) => (n(k, mine) ? `<i class="${k}" style="flex:${n(k, mine)}"></i>` : '')).join('')}</div>`
      + `<p class="sp-key" aria-hidden="true">${PARTS.map(([k, t]) => `<span class="${k}"><i></i>${esc(t)} ${n(k, mine)}</span>`).join('')}</p>`;
    const rows = mine.map((it) => `<li><a href="${C.href('item.html', { code: it.code })}"><code dir="ltr">${it.code}</code><b>${esc(T(it.title))}</b></a><span class="sp-at">${IQ.glyph(C.at(it).stroke)}<span>${esc(T(C.at(it).name))}</span></span></li>`).join('');
    return `<section class="sp-box" aria-labelledby="sp-v-${v.replace(/\W/g, '')}"><h2 id="sp-v-${v.replace(/\W/g, '')}">${icon('Release', 18)}<span>${esc(T('Version {n}', { n: v }))}</span><small>${esc(NO.n(mine.length, '{n} job', '{n} jobs'))}</small></h2>${bar}<ul class="sp-tk">${rows}</ul></section>`;
  };
  const most = Math.max(1, ...past.map((r) => r.bugs));
  const history = past.length ? `<ol class="sp-rels">${past.map((r) => `<li><span class="sp-v"><i></i><b dir="ltr">${esc(r.v)}</b><small>${esc(FLOW.date(r.at))}</small></span>`
    + `<span class="sp-bug" title="${esc(N(r.bugs, '{n} bug after it', '{n} bugs after it'))}"><span><i style="--f:${(r.bugs / most * 100).toFixed(1)}"></i></span><b>${r.bugs}</b></span></li>`).join('')}</ol>` : '';
  $('[data-body]').innerHTML = vs.map(coming).join('')
    + (history ? `<section class="sp-box" aria-labelledby="sp-ps-h"><h2 id="sp-ps-h">${icon('History', 18)}<span>${esc(T('Released'))}</span><small>${esc(T('Bugs found after each'))}</small></h2>${history}</section>` : '');
  document.title = `${T('Releases')} · ${T(O.name)}`;
})();
