// Environments: what runs where. Each environment, the version in it and since when, its state as a dot (works ink,
// building grey, down red) and the errors Sentry saw in the last day; a preview links to its ticket.
(function () {
  const root = document.querySelector('main.sp');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'khaled', masar: 'samir', wamda: 'hala' });
  const T = window.T, N = window.I18N.n, esc = FLOW.esc, O = C.O, NO = C.noun;
  const $ = (s) => root.querySelector(s);
  const icon = (n, s) => IQ.icon(n, s || 16);
  const none = (t) => { $('[data-body]').innerHTML = `<p class="sp-none">${icon('Repository', 20)}<span>${esc(t)}</span></p>`; };
  const envs = O.envs || [];
  if (!envs.length) return none(T('No environment is connected.'));
  const errs = envs.reduce((a, e) => a + (e.errors || 0), 0);
  $('[data-sum]').innerHTML = `<span class="stats">${FLOW.stat('Environment', envs.length, N(envs.length, '{n} environment', '{n} environments'))}${FLOW.stat('Late', errs, N(errs, '{n} error in the last day', '{n} errors in the last day'), errs ? 'late' : '')}</span>`;
  const STATE = { works: T('Works'), building: T('Building'), down: T('Down') };
  $('[data-body]').innerHTML = `<ul class="sp-cards">${envs.map((e) => `<li class="sp-card env ${e.state}"><div class="sp-ch">${icon('Environment', 20)}<b>${esc(T(e.name))}</b><span class="sp-st"><i></i>${esc(STATE[e.state] || e.state)}</span></div>`
    + `<p class="sp-ver" dir="ltr">${esc(T(e.version))}</p><p class="sp-m">${icon('Date')}<span>${esc(T('Since {when}', { when: FLOW.when(e.at) }))}</span></p>`
    + `<p class="sp-m${e.errors ? ' bad' : ''}">${icon('Late')}<span>${esc(N(e.errors || 0, '{n} error in the last day', '{n} errors in the last day'))}</span></p>`
    + (e.note ? `<p class="sp-m">${icon('Test run')}<span>${esc(T(e.note))}</span></p>` : '')
    + (e.code ? `<a class="btn small" href="${C.href('item.html', { code: e.code })}">${icon('Link')}<span dir="ltr">${e.code}</span></a>` : '') + '</li>').join('')}</ul>`;
  document.title = `${T('Environments')} · ${T(O.name)}`;
})();
