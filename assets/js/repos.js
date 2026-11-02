// Repositories: each repository GitHub connects, its stack, its last activity and its commits this week as a bar; the
// open pull requests on it come from the tickets, each with its checks as dots (passed ink, running grey, failed red).
(function () {
  const root = document.querySelector('main.sp');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'khaled', masar: 'samir', wamda: 'hala' });
  const T = window.T, N = window.I18N.n, esc = FLOW.esc, O = C.O, NO = C.noun;
  const $ = (s) => root.querySelector(s);
  const icon = (n, s) => IQ.icon(n, s || 16);
  const none = (t) => { $('[data-body]').innerHTML = `<p class="sp-none">${icon('Repository', 20)}<span>${esc(t)}</span></p>`; };
  const repos = O.repos || [];
  if (!repos.length) return none(T('No repository is connected. The software pack connects them through GitHub.'));
  const prs = C.items.filter((it) => it.fields && it.fields.pr && it.fields.pr.repo);
  const most = Math.max(1, ...repos.map((r) => r.commits));
  $('[data-sum]').innerHTML = `<span class="stats">${FLOW.stat('Repository', repos.length, N(repos.length, '{n} repository', '{n} repositories'))}${FLOW.stat('Merge', prs.length, N(prs.length, '{n} open pull request', '{n} open pull requests'))}</span>`;
  const dot = (s) => `<i class="ck ${s}" title="${esc(T(s === 'passed' ? 'Passed' : s === 'failed' ? 'Failed' : 'Running'))}"></i>`;
  $('[data-body]').innerHTML = `<ul class="sp-cards">${repos.map((r) => {
    const open = prs.filter((it) => it.fields.pr.repo === r.name);
    return `<li class="sp-card"><div class="sp-ch">${icon('Repository', 20)}<b dir="ltr">${esc(r.name)}</b><small dir="ltr">${esc(r.stack)}</small></div>`
      + `<p class="sp-bar" title="${esc(N(r.commits, '{n} commit this week', '{n} commits this week'))}"><span><i style="--f:${(r.commits / most * 100).toFixed(1)}"></i></span><b>${r.commits}</b></p>`
      + `<p class="sp-m">${icon('History')}<span>${esc(T('Last activity {when}', { when: FLOW.ago(r.last) }))}</span></p>`
      + (open.length ? `<ul class="sp-prs">${open.map((it) => { const p = it.fields.pr; return `<li><a href="${C.href('item.html', { code: it.code })}"><b dir="ltr">#${p.n}</b><span>${esc(T(it.title))}</span></a><span class="cks" aria-label="${esc(N(p.passed, '{n} check passed', '{n} checks passed'))}">${(p.checks || []).map(([, s]) => dot(s)).join('')}</span></li>`; }).join('')}</ul>`
        : `<p class="sp-m sp-quiet">${esc(T('No open pull request'))}</p>`) + '</li>';
  }).join('')}</ul>`;
  document.title = `${T('Repositories')} · ${T(O.name)}`;
})();
