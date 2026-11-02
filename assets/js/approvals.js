// Client approvals: every item waiting at a block the client approves, longest wait first. How long it has waited as a
// bar against the hours the block expects (past them in red), the client, the account manager, and a reminder the
// person can send (kept for this visit in sessionStorage 'iqaa-reminded:<org>').
(function () {
  const root = document.querySelector('main.tl');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'heba', masar: 'lina', wamda: 'lama' });
  const T = window.T, N = window.I18N.n, esc = FLOW.esc, O = C.O, NO = C.noun;
  const $ = (s) => root.querySelector(s);
  const icon = (n, s) => IQ.icon(n, s || 16);
  const face = (k) => `<span class="tl-av" title="${esc(C.name(k))}" aria-hidden="true">${esc(C.name(k).charAt(0))}</span>`;
  const none = (ic, t) => { $('[data-body]').innerHTML = `<p class="tl-none">${icon(ic, 20)}<span>${esc(t)}</span></p>`; };
  const key = `iqaa-reminded:${O.id}`;
  let sent = {};
  try { sent = JSON.parse(FLOW.store.get(key) || '{}') || {}; } catch (e) { sent = {}; }
  const DAYH = 36e5;
  const since = (it) => { const e = (it.log || []).find((x) => x[0] === it.at[0] || x[3] === 'approved'); return e ? e[2] : it.opened; };
  const wait = C.items.filter((it) => C.at(it).client && it.state === 'approval')
    .map((it) => ({ it, h: Math.round((FLOW.now - FLOW.ms(since(it))) / DAYH), exp: C.at(it).hours || 48 }))
    .sort((a, b) => b.h - a.h);
  if (!wait.length) return none('Done', T('Nothing waits for a client.'));
  const over = wait.filter((w) => w.h > w.exp).length;
  $('[data-sum]').innerHTML = `<span class="stats">${FLOW.stat('Wait', wait.length, N(wait.length, '{n} waiting for the client', '{n} waiting for the client'))}${FLOW.stat('Late', over, N(over, '{n} past the expected time', '{n} past the expected time'), over ? 'late' : '')}</span>`;
  const most = Math.max(...wait.map((w) => w.h), wait[0].exp);
  const draw = () => {
    $('[data-body]').innerHTML = `<ul class="tl-ap">${wait.map(({ it, h, exp }) => {
      const late = h > exp, r = sent[it.code];
      return `<li class="tl-card${late ? ' late' : ''}"><div class="tl-ap-h"><a href="${C.href('item.html', { code: it.code })}"><code dir="ltr">${it.code}</code><b>${esc(T(it.title))}</b></a>`
        + `<span class="tl-cl">${icon('Company', 14)}${esc(T((it.fields || {}).client || ''))}</span></div>`
        + `<div class="tl-wait" role="img" aria-label="${esc(T('Waited {h} of {exp} expected', { h: N(h, '{n} hour', '{n} hours'), exp: N(exp, '{n} hour', '{n} hours') }))}"><span><i style="--f:${(Math.min(h, exp) / most * 100).toFixed(1)}"></i>${late ? `<i class="over" style="--f:${((h - exp) / most * 100).toFixed(1)}"></i>` : ''}<em style="--x:${(exp / most * 100).toFixed(1)}"></em></span>`
        + `<small>${esc(N(h, '{n} hour', '{n} hours'))}<span> / ${esc(N(exp, '{n} hour', '{n} hours'))}</span></small></div>`
        + `<div class="tl-ap-f"><span class="tl-who">${face(it.who)}${esc(C.name(it.who))}</span>`
        + (r ? `<span class="tl-sent">${icon('Done', 14)}${esc(T('Reminded'))}</span>`
          : `<button type="button" class="btn small" data-remind="${it.code}">${icon('Remind')}<span>${esc(T('Remind the client'))}</span></button>`) + '</div></li>';
    }).join('')}</ul>`;
  };
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-remind]');
    if (!b) return;
    sent[b.dataset.remind] = true;
    FLOW.store.set(key, JSON.stringify(sent));
    draw();
    const s = root.querySelector('.tl-sent');
    if (s) s.setAttribute('role', 'status');
  });
  draw();
  document.title = `${T('Client approvals')} · ${T(O.name)}`;
})();
