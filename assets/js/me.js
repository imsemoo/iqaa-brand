// My space: the person as the line knows them. Their name, title and week in hours; their last seven days as bars,
// counted from every item's log where they acted; each block they hold a role in, with its stroke and what is theirs
// there; the organization's skills with theirs marked; and where their notices go (the organization chooses).
(function () {
  const root = document.querySelector('main.me');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'heba', masar: 'wasim', wamda: 'nadine' });
  const W = window.WORLD, T = window.T, N = window.I18N.n, esc = FLOW.esc, O = C.O, P = C.P;
  const $ = (s) => root.querySelector(s);
  const icon = (n, s) => IQ.icon(n, s || 18);

  // ---------- the person ----------
  const kind = P.type === 'freelancer' && P.until ? T('Freelancer until {date}', { date: FLOW.date(`${P.until}T00:00`) }) : T(P.type === 'freelancer' ? 'Freelancer' : 'Staff');
  const dept = (O.departments || []).find((d) => d.id === P.dept);
  $('[data-head]').innerHTML = `<span class="me-big" aria-hidden="true">${esc(T(P.name).charAt(0))}</span>`
    + `<div class="me-ht"><h1>${esc(T(P.name))}</h1><p>${esc([T(P.title), dept ? T(dept.name) : ''].filter(Boolean).join(' · '))}</p>`
    + `<p class="stats">${FLOW.hbar(P.hours || 0, `${kind} · ${N(P.hours || 0, '{n} hour a week', '{n} hours a week')}`)}<span class="me-kind">${esc(kind)}</span></p></div>`;

  // ---------- the week: what they did each day, from the log ----------
  const days = [...Array(7).keys()].map((i) => new Date(FLOW.ms(`${W.dayIso}T12:00`) - (6 - i) * 864e5).toISOString().slice(0, 10));
  const acts = C.items.flatMap((it) => (it.log || []).filter((e) => e[1] === C.me).map((e) => e[2].slice(0, 10)));
  const per = days.map((d) => acts.filter((x) => x === d).length), most = Math.max(1, ...per), total = per.reduce((a, n) => a + n, 0);
  $('[data-week]').innerHTML = `<p class="me-wsum">${FLOW.stat('History', total, N(total, '{n} step this week', '{n} steps this week'))}</p>`
    + `<ol class="me-bars" aria-label="${esc(days.map((d, i) => `${FLOW.date(`${d}T12:00`)}: ${per[i]}`).join(T(', ')))}">${days.map((d, i) => `<li${i === 6 ? ' class="now"' : ''}>`
      + `<b aria-hidden="true">${per[i] || ''}</b><i style="--h:${(per[i] / most * 100).toFixed(1)}" aria-hidden="true"></i><span aria-hidden="true">${esc(FLOW.date(`${d}T12:00`).split(' ')[0])}</span></li>`).join('')}</ol>`;

  // ---------- where they work ----------
  const mine = C.mine;
  $('[data-where]').innerHTML = mine.length ? mine.map((b) => {
    const roles = C.rolesIn(b).map((r) => T(r.role)).join(T(', '));
    // theirs there, as My work counts it (what waits for their approval included)
    const n = C.work().doing.concat(C.work().fresh).filter((it) => it.at.includes(b.id)).length;
    return `<li><span class="me-g" aria-hidden="true">${IQ.glyph(b.stroke)}</span><span><b>${esc(T(b.name))}</b><small>${esc(roles)}</small></span>${FLOW.stat('My work', n, C.noun.n(n, '{n} job', '{n} jobs'))}</li>`;
  }).join('') : `<li class="me-none">${esc(T('No role in any block yet.'))}</li>`;

  // ---------- skills: the organization's list, theirs marked ----------
  const has = P.skills || [];
  $('[data-skills]').innerHTML = (O.skills || has).map((s) => `<li class="${has.includes(s) ? 'on' : ''}">${has.includes(s) ? icon('Done', 14) : ''}<span>${esc(T(s))}</span></li>`).join('');

  // ---------- where notices go: always here, and the organization's channel ----------
  const ch = (O.integrations || []).find((x) => ['telegram', 'slack'].includes(x.id) && x.state !== 'expired');
  $('[data-channel]').innerHTML = `<ul class="me-ch"><li>${icon('Notifications')}<span>${esc(T('In Iqaa'))}</span>${icon('Done', 16)}</li>`
    + `${ch ? `<li>${icon(ch.id === 'slack' ? 'Message' : 'Send')}<span dir="ltr">${esc(ch.name)}</span>${icon('Done', 16)}</li>` : ''}</ul>`
    + `<p class="me-hint" title="${esc(T('The organization chooses the channel.'))}">${icon('Company', 16)}<span>${esc(T('The organization chooses the channel.'))}</span></p>`;

  document.title = `${T('My space')} · ${T(O.name)}`;
})();
