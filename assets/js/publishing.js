// Publishing: the week from today, a column a day and a row a platform, each post a chip with its time: published in ink,
// scheduled in grey, waiting for a person in amber, failed in red (the plan's colours for risk). Under it, what waits
// before it can go out, each with why and where to act.
(function () {
  const root = document.querySelector('main.pb2');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'khaled', masar: 'samir', wamda: 'hala' });
  const W = window.WORLD, T = window.T, N = window.I18N.n, esc = FLOW.esc, O = C.O;
  const $ = (s) => root.querySelector(s);
  const icon = (n, s) => IQ.icon(n, s || 16);
  const posts = O.posts || [];
  if (!posts.length) { $('[data-cal]').innerHTML = `<p class="pb2-none">${esc(T('Nothing is scheduled to go out.'))}</p>`; return; }
  const title = (code) => { const it = C.items.find((x) => x.code === code); return it ? T(it.title) : code; };
  const STATE = { published: ['Done', T('Published')], scheduled: ['Date', T('Scheduled')], waiting: ['Late', T('Waits for a person')], failed: ['Lock', T('Failed')] };
  const days = [...Array(7).keys()].map((i) => new Date(FLOW.ms(`${W.dayIso}T12:00`) + i * 864e5).toISOString().slice(0, 10));
  const plats = [...new Set(posts.map((p) => p.platform))];
  const count = (s) => posts.filter((p) => p.state === s).length;
  $('[data-sum]').innerHTML = `<span class="stats">${FLOW.stat('Publish', posts.length, N(posts.length, '{n} post this week', '{n} posts this week'))}${count('failed') ? FLOW.stat('Late', count('failed'), N(count('failed'), '{n} failed', '{n} failed'), 'late') : ''}</span>`;
  $('[data-key]').innerHTML = Object.entries(STATE).map(([k, [, n]]) => `<span class="${k}"><i></i>${esc(n)} ${count(k)}</span>`).join('');
  const chip = (p) => `<a class="pb2-chip ${p.state}" href="${C.href('item.html', { code: p.code })}" title="${esc(`${title(p.code)} · ${STATE[p.state][1]}`)}"><time dir="ltr">${p.at.slice(11, 16)}</time><span>${esc(title(p.code))}</span></a>`;
  $('[data-cal]').innerHTML = `<div class="pb2-grid" style="--days:${days.length}" role="table" aria-label="${esc(T('This week’s posts'))}">`
    + `<div class="pb2-r pb2-hd" role="row"><span role="columnheader"></span>${days.map((d, i) => `<span role="columnheader" class="${i === 0 ? 'now' : ''}">${esc(i === 0 ? T('Today') : FLOW.date(`${d}T12:00`))}</span>`).join('')}</div>`
    + plats.map((pl) => `<div class="pb2-r" role="row"><b role="rowheader">${esc(pl)}</b>${days.map((d) => `<div role="cell">${posts.filter((p) => p.platform === pl && p.at.slice(0, 10) === d).map(chip).join('')}</div>`).join('')}</div>`).join('')
    + '</div>';
  const wait = posts.filter((p) => p.state === 'waiting' || p.state === 'failed');
  $('[data-wait]').innerHTML = wait.map((p) => `<li class="${p.state}">${icon(STATE[p.state][0], 18)}<span class="pb2-wt"><b>${esc(title(p.code))}</b><small>${esc(`${p.platform} · ${FLOW.when(p.at)} · ${T(p.why)}`)}</small></span>`
    + `<a class="btn small" href="${p.state === 'failed' ? C.href('integrations.html') : C.href('item.html', { code: p.code })}">${esc(p.state === 'failed' ? T('Reconnect') : T('Open'))}</a></li>`).join('');
  document.title = `${T('Publishing')} · ${T(O.name)}`;
})();
