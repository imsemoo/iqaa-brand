// The app frame of the digital production screens: the organization's mark and name, the screens the person may
// open (the owner sees the whole organization; a block's lead runs its queue; everyone has My work), the tools their
// pack gives them, and the person at the foot with "see the screens as" for the demo. A page sets window.FRAME to the
// context it reads (flow.js) before this runs; screens not built yet are listed as coming, not linked.
(function () {
  const side = document.querySelector('[data-frame]');
  if (!side || !window.FLOW || !window.FRAME) return;
  const C = window.FRAME, O = C.O, T = window.T, N = window.I18N.n, esc = FLOW.esc;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const html = document.documentElement;
  const icon = (n, s) => window.IQ.icon(n, s || 20);
  const current = side.dataset.current;

  // ---------- the organization: its mark is its initial signed with the opening of its line ----------
  const initial = (O.mark || {})[I18N.lang] || (O.mark || {}).en || O.name;
  window.Beats.sig($('[data-org-mark]'), C.line.blocks.filter((b) => !b.side).map((b) => ({ name: b.name, steps: [b.stroke] })),
    { mode: 'mark', size: 32, name: initial, label: T('{org}’s mark', { org: T(O.name) }) });
  $('[data-org-name]').textContent = T(O.name);
  $('[data-org-address]').textContent = O.address;
  // the demo's organizations; a person may belong to several, each with its own address
  $('[data-orgs]').innerHTML = Object.values(window.WORLD.orgs).map((o) => `<a href="${location.pathname.split('/').pop()}?org=${o.id}"${o.id === O.id ? ' aria-current="true"' : ''}>${icon('Company', 18)}<span><b>${esc(T(o.name))}</b><small dir="ltr">${o.address}</small></span></a>`).join('');

  // ---------- the screens, by who is looking ----------
  const w = C.work();
  const mineN = w.doing.length + w.fresh.length;
  const readN = FLOW.read(C), newN = C.inbox().filter((n) => !readN.includes(n.id)).length;
  // wide: on a phone the screen leaves the tab bar for More (the tab bar holds the first three and More)
  const link = (name, href, ic, count, extra, wide) => {
    const cur = name === current ? ' aria-current="page"' : '';
    const c = count ? `<i class="ap-n${extra === 'me' ? ' me' : ''}">${count}<span class="sr"> ${T('waiting')}</span></i>` : '';
    return `<li${wide ? ' class="ap-wide"' : ''}><a class="ap-l" href="${href}" title="${esc(T(name))}"${cur}>${icon(ic)}<span>${esc(T(name))}</span>${c}</a></li>`;
  };
  // a screen the plan has and this prototype does not draw yet: listed, so the frame is whole, and said to be coming
  const soon = (name, ic) => `<li class="ap-wide"><span class="ap-l" aria-disabled="true" title="${esc(T('{name}: coming next', { name: T(name) }))}">${icon(ic)}<span>${esc(T(name))}</span><em>${T('Soon')}</em></span></li>`;
  const group = (title, items) => `<p class="ap-group">${esc(title)}</p><ul class="ap-links ap-x">${items.join('')}</ul>`;
  const media = O.pack === 'Media and production', agency = O.pack === 'Agencies';
  let main = [], groups = '';
  if (C.standing === 'owner') {
    // the owner's screens, in the plan's order: the line, then what runs on it by itself, then the numbers
    main = [link('Home', C.href('home.html'), 'Home'), link('My work', C.href('work.html'), 'My work', mineN, 'me'), link('Lines', C.href('lines.html'), 'Line'),
      link('Notifications', C.href('notify.html'), 'Notifications', newN, '', true), link('Automation', C.href('automate.html'), 'Run log', 0, '', true), link('Templates', C.href('templates.html'), 'Templates', 0, '', true),
      link('Integrations', C.href('integrations.html'), 'Webhook', 0, '', true), link('Reports', C.href('reports.html'), 'Reports', 0, '', true)];
    groups += group(T('{pack} pack', { pack: T(O.pack) }), media
      ? [link('Sources', C.href('sources.html'), 'Sources'), link('Publishing', C.href('publishing.html'), 'Publish'), link('Saved archive', C.href('archive.html'), 'Archive')]
      : agency ? [link('Clients', C.href('clients.html'), 'Clients'), link('Campaigns', C.href('campaigns.html'), 'Publish'), link('Spend', C.href('spend.html'), 'Billing')]
        : [link('Repositories', C.href('repos.html'), 'Repository'), link('Releases', C.href('releases.html'), 'Release'), link('Environments', C.href('envs.html'), 'Environment')]);
    groups += group(T('The organization'), [link('People and departments', C.href('people.html'), 'People'), link('Settings', C.href('packs.html'), 'Settings')]);
  } else {
    main = [link('My work', C.href('work.html'), 'My work', mineN, 'me'), link('Notifications', C.href('notify.html'), 'Notifications', newN), link('My space', C.href('me.html'), 'My space')];
    // a lead's blocks, each with what is in it: the block's queue
    const led = C.mine.filter((b) => C.leads(b));
    if (led.length) {
      groups += group(T('My blocks'), led.map((b) => {
        const n = C.items.filter((it) => it.at.includes(b.id)).length;
        const href = C.href('queue.html', { block: b.id });
        const cur = current === 'My blocks' && new URLSearchParams(location.search).get('block') === b.id ? ' aria-current="page"' : '';
        return `<li><a class="ap-l" href="${href}"${cur}>${icon('Line')}<span>${esc(T(b.name))}</span><i class="ap-n">${n}</i></a></li>`;
      }));
    }
    const tool = (name, page, ic) => link(name, C.href(page), ic);
    groups += group(T('Tools'), media ? [tool('Video templates', 'vtemplates.html', 'Templates'), tool('Files', 'files.html', 'Files')]
      : agency ? [tool('Client approvals', 'approvals.html', 'Done'), tool('Files', 'files.html', 'Files')] : [tool('Repositories', 'repos.html', 'Repository'), tool('Environments', 'envs.html', 'Environment')]);
  }
  // a phone's tab bar holds four; the rest open from More
  const nav = $('[data-nav]');
  nav.innerHTML = `<ul class="ap-links">${main.join('')}<li class="ap-more-li"><button type="button" class="ap-l" data-menu aria-expanded="false" aria-controls="ap-more">${icon('More')}<span>${T('More')}</span></button></li></ul>${groups}`
    + `<div class="ap-menu ap-more-m" id="ap-more" hidden>${main.filter((li) => li.startsWith('<li class="ap-wide"><a')).length ? `<ul class="ap-more-l">${main.filter((li) => li.startsWith('<li class="ap-wide"><a')).join('').replace(/ class="ap-wide"/g, '')}</ul>` : ''}${groups.replace(/ class="ap-links ap-x"/g, ' class="ap-more-l"')}</div>`;

  // ---------- the person, and the demo's "see the screens as" ----------
  const P = C.P;
  $('[data-me-av]').textContent = T(P.name).charAt(0);
  $('[data-me-name]').textContent = T(P.name);
  $('[data-me-name]').dataset.who = P.name;
  $('[data-me-role]').textContent = T(P.title);
  const page = location.pathname.split('/').pop();
  // the item page keeps its item: seeing it as another person shows what that person may see of it
  const keep = page === 'item.html' ? { code: new URLSearchParams(location.search).get('code') } : page === 'queue.html' ? {} : {};
  $('[data-people]').innerHTML = Object.keys(O.people).filter((k) => O.people[k].type !== 'invited').map((k) => {
    const p = O.people[k];
    const params = new URLSearchParams(Object.assign({ org: O.id, as: k }, keep));
    return `<a href="${page}?${params}"${k === C.me ? ' aria-current="true"' : ''}><span class="me-av" aria-hidden="true">${esc(T(p.name).charAt(0))}</span><span><b>${esc(T(p.name))}</b><small>${esc(T(p.title))}</small></span></a>`;
  }).join('');

  // ---------- dark mode: the head script set it; the switch keeps the person's choice and redraws the page ----------
  const themeSw = $('[data-theme-switch]');
  if (themeSw) {
    themeSw.setAttribute('aria-pressed', String(html.dataset.theme === 'dark'));
    themeSw.addEventListener('click', () => {
      try { localStorage.setItem('iqaa-theme', html.dataset.theme === 'dark' ? 'light' : 'dark'); } catch (e) { /* this page only */ }
      const u = new URL(location.href);
      u.searchParams.delete('theme');
      location.replace(u);
    });
  }

  // ---------- fold: the sidebar folds to icons and remembers it ----------
  const fold = $('[data-fold]');
  let folded = false;
  try { folded = localStorage.getItem('iqaa-side') === 'folded'; } catch (e) { /* the default stands */ }
  const set = (on) => {
    html.classList.toggle('side-folded', on);
    fold.setAttribute('aria-pressed', String(on));
    fold.setAttribute('aria-label', on ? T('Open the sidebar') : T('Fold the sidebar'));
    fold.title = fold.getAttribute('aria-label');
  };
  set(folded);
  fold.addEventListener('click', () => {
    folded = !folded;
    set(folded);
    try { localStorage.setItem('iqaa-side', folded ? 'folded' : 'open'); } catch (e) { /* this page only */ }
    window.dispatchEvent(new Event('resize'));
  });
})();
