// Spend: the last 30 days from the ad accounts. What was spent against the budgets, the return on the ads and
// yesterday; each day as a bar split by platform; each client's spend against its budget, with its return (under 2 in
// amber: the ads bring less than twice what they cost).
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
  const s = O.packStats, D = O.spendDaily, list = (O.clients || []).slice().sort((a, b) => b.spent - a.spent);
  if (!s || !D) return none(T('No ad account is connected. The agency pack reads spend from Meta Ads and Google Ads.'));
  const PL = [['metaads', 'Meta Ads'], ['googleads', 'Google Ads']];
  const days = D.metaads.map((m, i) => ({ i, m, g: D.googleads[i], at: new Date(FLOW.ms(`${D.from}T00:00`) + i * 864e5).toISOString().slice(0, 16) }));
  const most = Math.max(...days.map((d) => d.m + d.g)), y = days[days.length - 1];
  const sum = (k) => D[k].reduce((a, n) => a + n, 0);
  $('[data-sum]').innerHTML = `<span class="stats">${FLOW.stat('Date', s.days, N(s.days, 'Last {n} days', 'Last {n} days'))}</span>`;
  const tile = (ic, k, v, sub) => `<li class="ag-tile">${icon(ic, 20)}<span>${esc(k)}</span><b>${v}</b>${sub ? `<small>${sub}</small>` : ''}</li>`;
  const kpi = `<ul class="ag-tiles">${tile('Billing', T('Spent'), money(s.spend), `<span>${T('of {budget}', { budget: money(s.budget) })}</span><span class="ag-bar"><span><i style="--f:${(s.spend / s.budget * 100).toFixed(1)}"></i></span></span>`)}`
    + `${tile('Reports', T('Return on the ads'), `<span dir="ltr">×${s.roas.toFixed(1)}</span>`, esc(T('sales for every dollar')))}${tile('History', T('Yesterday'), money(y.m + y.g), '')}</ul>`;
  const bars = `<div class="ag-days" role="img" aria-label="${esc(PL.map(([k, n]) => `${n}: ${new Intl.NumberFormat('en-US').format(sum(k))} $`).join(T(', ')))}">${days.map((d) => `<span title="${esc(`${FLOW.date(d.at)} · Meta Ads $${d.m} · Google Ads $${d.g}`)}" style="--m:${(d.m / most).toFixed(3)};--g:${(d.g / most).toFixed(3)}"><i class="pm"></i><i class="pg"></i></span>`).join('')}</div>`
    + `<p class="ag-axis" aria-hidden="true"><span>${esc(FLOW.date(days[0].at))}</span><span>${esc(FLOW.date(y.at))}</span></p>`
    + `<p class="ag-key">${PL.map(([k, n]) => `<span class="${k}"><i></i>${n} ${money(sum(k))}</span>`).join('')}</p>`;
  const rows = `<ul class="ag-rank">${list.map((c) => `<li><span class="ag-cn"><span class="ag-av" aria-hidden="true">${esc(T(c.name).charAt(0))}</span><b>${esc(T(c.name))}</b></span>`
    + `<span class="ag-bar" title="${esc(T('Spent of the budget, last {n} days', { n: 30 }))}"><span><i style="--f:${Math.min(100, c.spent / c.budget * 100).toFixed(1)}"></i></span><small dir="ltr">${money(c.spent)} / ${money(c.budget)}</small></span>`
    + `<span dir="ltr" class="ag-roas${c.roas < 2 ? ' low' : ''}" title="${esc(T('Return on the ads: sales for every dollar spent'))}">×${c.roas.toFixed(1)}</span></li>`).join('')}</ul>`;
  $('[data-body]').innerHTML = kpi
    + `<section class="ag-box" aria-labelledby="ag-d-h"><h2 id="ag-d-h">${icon('Date', 18)}<span>${esc(T('Spend per day'))}</span></h2>${bars}</section>`
    + `<section class="ag-box" aria-labelledby="ag-c-h"><h2 id="ag-c-h">${icon('Clients', 18)}<span>${esc(T('Spend per client'))}</span><small>${esc(T('×: return on the ads'))}</small></h2>${rows}</section>`;
  document.title = `${T('Spend')} · ${T(O.name)}`;
})();
