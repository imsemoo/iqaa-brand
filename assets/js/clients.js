// Clients: each client as a card. Its spend against its budget for the last 30 days as a bar, its return on the ads,
// what waits for its approval (late in red), and its live campaigns, each with its place on the line.
(function () {
  const root = document.querySelector('main.ag');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'khaled', masar: 'samir', wamda: 'hala' });
  const T = window.T, N = window.I18N.n, esc = FLOW.esc, O = C.O, NO = C.noun;
  const $ = (s) => root.querySelector(s);
  const icon = (n, s) => IQ.icon(n, s || 16);
  const money = (n) => `<span dir="ltr">${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)}</span>`;
  const amount = (s) => Number(String(s || '').replace(/[^\d.]/g, '')) || 0;
  const none = (t) => { $('[data-body]').innerHTML = `<p class="ag-none">${icon('Clients', 20)}<span>${esc(t)}</span></p>`; };
  // due: late in red, today in amber, else quiet
  const due = (iso) => { const l = FLOW.late(iso); return `<span class="ag-due${l ? ' late' : FLOW.dayOf(iso) === 0 ? ' today' : ''}">${icon(l ? 'Late' : 'Date')}<span>${esc(l || FLOW.when(iso))}</span></span>`; };
  const row = (it) => `<li><a href="${C.href('item.html', { code: it.code })}"><b>${esc(T(it.title))}</b><span class="ag-where">${C.strip(it)}<small>${esc(T(C.at(it).name))}</small></span></a>${due(it.due)}</li>`;
  const list = (O.clients || []).slice().sort((a, b) => b.spent - a.spent);
  if (!list.length) return none(T('No client yet. A client is added with its first campaign.'));
  const of = (name) => C.items.filter((it) => (it.fields || {}).client === name);
  const waits = (it) => it.state === 'approval' && C.at(it).kind === 'approval';
  const live = C.items.filter((it) => (it.fields || {}).client).length, waiting = C.items.filter(waits).length;
  $('[data-sum]').innerHTML = `<span class="stats">${FLOW.stat('Clients', list.length, N(list.length, '{n} client', '{n} clients'))}${FLOW.stat('Publish', live, N(live, '{n} live campaign', '{n} live campaigns'))}${FLOW.stat('Wait', waiting, N(waiting, '{n} waiting for the client', '{n} waiting for the client'))}</span>`;
  $('[data-body]').innerHTML = `<ul class="ag-cards">${list.map((c) => {
    const mine = of(c.name), held = mine.filter(waits), late = held.filter((it) => FLOW.late(it.due));
    const f = Math.min(100, (c.spent / c.budget) * 100);
    return `<li class="ag-card"><div class="ag-ch"><span class="ag-av" aria-hidden="true">${esc(T(c.name).charAt(0))}</span><b>${esc(T(c.name))}</b>`
      + `<span dir="ltr" class="ag-roas${c.roas < 2 ? ' low' : ''}" title="${esc(T('Return on the ads: sales for every dollar spent'))}">×${c.roas.toFixed(1)}</span></div>`
      + `<p class="ag-bar" title="${esc(T('Spent of the budget, last {n} days', { n: 30 }))}"><span><i style="--f:${f.toFixed(1)}"></i></span><small dir="ltr">${money(c.spent)} / ${money(c.budget)}</small></p>`
      + (held.length ? `<p class="ag-m${late.length ? ' bad' : ' warn'}">${icon('Wait')}<span>${esc(N(held.length, '{n} waiting for its approval', '{n} waiting for its approval'))}${late.length ? ` · ${esc(FLOW.late(late[0].due))}` : ''}</span></p>` : '')
      + (mine.length ? `<ul class="ag-rows">${mine.map(row).join('')}</ul>` : `<p class="ag-m">${esc(T('No live campaign'))}</p>`) + '</li>';
  }).join('')}</ul>`;
  document.title = `${T('Clients')} · ${T(O.name)}`;
})();
