// Campaigns: every campaign on the line, soonest due first, with its client, its place on the line, its channels and
// its budget; the channels above filter it. Late in red, due today in amber.
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
  const all = C.items.filter((it) => (it.fields || {}).client).sort((a, b) => a.due.localeCompare(b.due));
  if (!all.length) return none(T('No campaign on the line.'));
  const chans = (it) => String(it.fields.channels || '').split(',').map((s) => s.trim()).filter(Boolean);
  const CH = [...new Set(all.flatMap(chans))];
  const total = all.reduce((a, it) => a + amount(it.fields.budget), 0), late = all.filter((it) => FLOW.late(it.due)).length;
  $('[data-sum]').innerHTML = `<span class="stats">${FLOW.stat('Publish', all.length, N(all.length, '{n} live campaign', '{n} live campaigns'))}${FLOW.stat('Billing', money(total), T('{amount} in budgets', { amount: money(total).replace(/<[^>]+>/g, '') }))}${FLOW.stat('Late', late, N(late, '{n} late', '{n} late'), late ? 'late' : '')}</span>`;
  let pick = '';
  const draw = () => {
    const shown = pick ? all.filter((it) => chans(it).includes(pick)) : all;
    $('[data-list]').innerHTML = shown.map((it) => `<li><a href="${C.href('item.html', { code: it.code })}"><code dir="ltr">${it.code}</code><b>${esc(T(it.title))}</b><small>${icon('Company', 14)}${esc(T(it.fields.client))}</small></a>`
      + `<span class="ag-where">${C.strip(it)}<small>${esc(T(C.at(it).name))}</small></span>`
      + `<span class="ag-ch-l">${chans(it).map((c) => `<i>${esc(c)}</i>`).join('')}</span><span class="ag-money">${money(amount(it.fields.budget))}</span>${due(it.due)}</li>`).join('');
    root.querySelectorAll('[data-ch]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ch === pick)));
  };
  const chip = (c, n, label) => `<button type="button" class="ag-chip" data-ch="${esc(c)}" aria-pressed="false">${esc(label)}<b>${n}</b></button>`;
  $('[data-body]').innerHTML = `<div class="ag-chips" role="group" aria-label="${esc(T('Channels'))}">${chip('', all.length, T('All'))}${CH.map((c) => chip(c, all.filter((it) => chans(it).includes(c)).length, c)).join('')}</div>`
    + `<ul class="ag-list" data-list></ul>`;
  root.addEventListener('click', (e) => { const b = e.target.closest('[data-ch]'); if (!b) return; pick = b.dataset.ch; draw(); });
  draw();
  document.title = `${T('Campaigns')} · ${T(O.name)}`;
})();
