// Notifications: what reached the person (flow.js inbox), newest first and grouped by day. Each notice says what
// happened in one line with its icon, links to where to act, and stays unread (a violet dot: a person's matter) until
// opened. The organization's channel (Telegram for Al-Khatt) says where the same notices also go.
(function () {
  const root = document.querySelector('main.nt');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'heba', masar: 'wasim', wamda: 'nadine' });
  const T = window.T, N = window.I18N.n, esc = FLOW.esc;
  const $ = (s, el) => (el || document).querySelector(s);
  const icon = (n, s) => IQ.icon(n, s || 20);
  let filter = 'all';

  const title = (code) => { const it = C.items.find((x) => x.code === code); return it ? T(it.title) : code; };
  // each kind: its icon, its sentence and where it leads
  function say(n) {
    const item = (code) => C.href('item.html', { code });
    switch (n.kind) {
      case 'back': return { ic: 'Undo', hot: true, href: item(n.code), t: T('{name} sent back {title}', { name: C.name(n.by), title: title(n.code) }), q: T(n.text) };
      case 'given': return { ic: 'Take', href: item(n.code), t: T('{name} gave you {title}', { name: C.name(n.by), title: title(n.code) }) };
      case 'approve': return { ic: 'Done', href: item(n.code), t: T('{name} handed over {title} for your approval', { name: C.name(n.by), title: title(n.code) }) };
      case 'late': return { ic: 'Late', bad: true, href: item(n.code), t: T('{title} is past its due time', { title: title(n.code) }) };
      case 'invite': return { ic: 'Invite', href: C.href('people.html', { dept: (C.O.people[n.who] || {}).dept }), t: T('{name} has not accepted the invitation', { name: C.name(n.who) }) };
      case 'expired': return { ic: 'Lock', bad: true, href: C.href('integrations.html'), t: T('{name} lost its permission; posts wait for it', { name: n.name }) };
      default: return { ic: 'Notifications', href: '#', t: '' };
    }
  }
  const day = (iso) => { const d = FLOW.dayOf(iso); return d === 0 ? T('Today') : d === -1 ? T('Yesterday') : FLOW.date(iso); };

  function render() {
    const all = C.inbox(), read = FLOW.read(C), unread = all.filter((n) => !read.includes(n.id));
    const shown = filter === 'unread' ? unread : all;
    $('[data-n-all]').textContent = all.length;
    $('[data-n-unread]').textContent = unread.length;
    $('[data-sum]').innerHTML = `<span class="stats">${FLOW.stat('Notifications', unread.length, N(unread.length, '{n} unread', '{n} unread'))}${channel()}</span>`;
    $('[data-acts]').innerHTML = unread.length ? `<button type="button" class="btn small" data-all-read>${icon('Done', 18)}<span>${T('Mark all as read')}</span></button>` : '';
    if (!shown.length) {
      $('[data-list]').innerHTML = `<div class="nt-empty">${icon('Done', 24)}<p><b>${esc(filter === 'unread' ? T('You have read everything.') : T('Nothing has reached you yet.'))}</b></p></div>`;
      return;
    }
    const groups = [];
    shown.forEach((n) => { const d = n.at.slice(0, 10), g = groups[groups.length - 1]; if (g && g.d === d) g.list.push(n); else groups.push({ d, at: n.at, list: [n] }); });
    $('[data-list]').innerHTML = groups.map((g) => `<h2 class="nt-day">${esc(day(g.at))}</h2><ol class="nt-list">${g.list.map((n) => {
      const s = say(n), un = !read.includes(n.id);
      return `<li class="nt-n${un ? ' is-new' : ''}${s.bad ? ' is-bad' : ''}"><a href="${s.href}" data-open="${esc(n.id)}"><span class="nt-ic" aria-hidden="true">${icon(s.ic, 20)}</span>`
        + `<span class="nt-t"><b>${esc(s.t)}</b>${s.q ? `<q>${esc(s.q)}</q>` : ''}</span><time datetime="${n.at}">${esc(FLOW.ago(n.at))}</time>`
        + `${un ? `<i class="nt-dot" aria-hidden="true"></i><span class="sr">${T('Unread')}</span>` : ''}</a></li>`;
    }).join('')}</ol>`).join('');
  }
  // where the organization also sends them: its chat integration, if it has one that works
  function channel() {
    const ch = (C.O.integrations || []).find((x) => ['telegram', 'slack'].includes(x.id) && x.state !== 'expired');
    return ch ? FLOW.stat(ch.id === 'slack' ? 'Message' : 'Send', ch.name, T('The same notices also go to {name}', { name: ch.name }), 'ch') : '';
  }

  root.addEventListener('click', (e) => {
    const f = e.target.closest('[data-f]');
    if (f) { filter = f.dataset.f; root.querySelectorAll('[data-f]').forEach((x) => x.setAttribute('aria-pressed', String(x === f))); render(); return; }
    if (e.target.closest('[data-all-read]')) {
      FLOW.markRead(C, C.inbox().map((n) => n.id));
      // the frame's count for this screen goes with them
      document.querySelectorAll('a.ap-l[href^="notify.html"] .ap-n').forEach((n) => n.remove());
      render();
      return;
    }
    const a = e.target.closest('[data-open]');
    if (a) FLOW.markRead(C, [a.dataset.open]);
  });

  document.title = `${T('Notifications')} · ${T(C.O.name)}`;
  render();
})();
