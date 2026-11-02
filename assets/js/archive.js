// The saved archive: every published piece as a card. A frame in the brand's ink with its title; when it went out and
// where; its reach as a bar against the best of the month; and its page on the site. A page that is gone says why and
// can be restored, kept for the visit.
(function () {
  const root = document.querySelector('main.ar');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'khaled', masar: 'samir', wamda: 'hala' });
  const T = window.T, N = window.I18N.n, esc = FLOW.esc, O = C.O;
  const $ = (s) => root.querySelector(s);
  const icon = (n, s) => IQ.icon(n, s || 16);
  const KEY = `iqaa-restored:${O.id}`;
  const restored = () => { try { return JSON.parse(FLOW.store.get(KEY) || '[]') || []; } catch (e) { return []; } };
  const list = O.archive || [];
  const big = (n) => (n >= 1e6 ? T('{n} {unit}', { n: (Math.round(n / 1e5) / 10).toString(), unit: T('million') }) : n >= 1e4 ? T('{n} {unit}', { n: String(Math.round(n / 1e3)), unit: T('thousand') }) : String(n));
  const most = Math.max(1, ...list.map((x) => x.reach));
  const brand = (O.brands && Object.keys(O.brands)[0]) || O.name;
  function render() {
    const q = ($('[data-q]').value || '').trim().toLowerCase(), back = restored();
    const shown = list.filter((x) => !q || T(x.title).toLowerCase().includes(q) || x.code.toLowerCase().includes(q));
    const total = list.reduce((a, x) => a + x.reach, 0);
    $('[data-sum]').innerHTML = `<span class="stats">${FLOW.stat('Archive', list.length, N(list.length, '{n} piece kept', '{n} pieces kept'))}${FLOW.stat('People', big(total), T('{n} people reached', { n: big(total) }))}</span>`;
    $('[data-grid]').innerHTML = shown.map((x) => {
      const gone = x.page === 'gone' && !back.includes(x.code);
      return `<li class="ar-card${gone ? ' is-gone' : ''}"><div class="ar-frame" aria-hidden="true">${icon('Video', 22)}<b>${esc(T(x.title))}</b><span>${esc(T(brand))}</span></div>`
        + `<div class="ar-b"><p class="ar-t"><b>${esc(T(x.title))}</b><code dir="ltr">${x.code}</code></p><p class="ar-m">${esc(FLOW.date(x.at))} · ${x.platforms.map((p) => `<span dir="ltr">${esc(p)}</span>`).join(T(', '))}</p>`
        + `<p class="ar-reach" title="${esc(T('{n} people reached', { n: big(x.reach) }))}"><span class="ar-bar" style="--f:${(x.reach / most * 100).toFixed(1)}" aria-hidden="true"><i></i></span><span>${esc(big(x.reach))}</span></p>`
        + (gone ? `<p class="ar-gone">${icon('Lock')}<span>${esc(T(x.gone))}</span></p><button type="button" class="btn small" data-restore="${x.code}">${icon('Retry')}<span>${T('Restore the page')}</span></button>`
          : `<p class="ar-live-p">${icon('Done')}<span>${esc(back.includes(x.code) ? T('Restored') : T('The page is live'))}</span></p>`) + '</div></li>';
    }).join('') || `<li class="ar-none">${esc(T('Nothing matches.'))}</li>`;
  }
  root.addEventListener('input', (e) => { if (e.target.matches('[data-q]')) render(); });
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-restore]');
    if (!b) return;
    FLOW.store.set(KEY, JSON.stringify(restored().concat([b.dataset.restore])));
    render();
    $('[data-note-t]').textContent = T('The page is back from the saved copy. Nothing is sent in this prototype.');
    $('[data-note]').hidden = false;
  });
  render();
  document.title = `${T('Saved archive')} · ${T(O.name)}`;
})();
