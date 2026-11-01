// The organization's app frame: the sidebar folds to icons and remembers it, signs the organization's mark when a
// page did not, counts what waits in each screen for the person signed in, opens the organization's menu, and
// searches screens and orders from anywhere with Ctrl or Cmd K.
(function () {
  const html = document.documentElement;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const S = window.SUFRA;

  // ---------- fold ----------
  const fold = $('[data-fold]');
  let folded = false;
  // the Build canvas wants the width, so the sidebar starts folded there unless the person has chosen
  let saved = null;
  try { saved = localStorage.getItem('iqaa-side'); } catch (e) { /* storage blocked: the default stands */ }
  folded = saved ? saved === 'folded' : !!$('main.bd');
  const set = (on) => {
    html.classList.toggle('side-folded', on);
    if (fold) { fold.setAttribute('aria-pressed', String(on)); fold.setAttribute('aria-label', on ? 'Open the sidebar' : 'Fold the sidebar'); fold.title = fold.getAttribute('aria-label'); }
  };
  set(folded);
  if (fold) fold.addEventListener('click', () => {
    folded = !folded;
    set(folded);
    try { localStorage.setItem('iqaa-side', folded ? 'folded' : 'open'); } catch (e) { /* the choice lasts this page only */ }
    window.dispatchEvent(new Event('resize'));
  });

  // ---------- the organization's mark, when the page did not sign it ----------
  const mark = $('[data-org-mark]');
  if (mark && !mark.firstChild && S && window.Beats) {
    const line = S.line();
    Beats.sig(mark, line.stations.map((s) => ({ name: s.name, steps: s.steps.map((x) => x.kind) })), { mode: 'mark', size: 32, name: 'Sufra', label: 'Sufra’s mark' });
  }

  // ---------- what waits for the person signed in ----------
  let stations = [], stepOf = () => null, live = [], todayHref = 'today.html', settingsHref = 'settings.html', watarHref = 'watar.html';
  // a client's open job that comes first
  const soonest = (ck) => live.filter((j) => j.ck === ck).sort((a, b) => a.iso.localeCompare(b.iso))[0];
  if (S) {
    const line = S.line();
    stations = line.stations.concat(...line.routes.filter((r) => r.type === 'branch').map((r) => r.stations));
    stepOf = (j) => { const st = stations.find((s) => s.id === j.at); return st ? st.steps[j.step] : null; };
    live = S.jobs.filter((j) => !j.finished);
    // the person is the page's own (Today names them before this runs), else the owner the sidebar is written for
    const me = (($('[data-me-name]') || {}).textContent || 'Hala').trim();
    const key = Object.keys(S.people).find((k) => S.people[k].name === me);
    const mine = live.filter((j) => { const x = stepOf(j); return x && (x.kind === 'struck' || x.kind === 'held') && x.who === me; }).length;
    const nT = $('[data-n-today]'), nO = $('[data-n-orders]'), nC = $('.ap-nav [data-n-clients]');
    if (nT && mine) nT.innerHTML = `${mine}<span class="sr"> waiting for you</span>`;
    if (nO) nO.innerHTML = `${live.length}<span class="sr"> on the line</span>`;
    // the clients whose answer the line waits for: their soonest open job sits on the client's own step
    const theirs = Object.keys(S.clients || {}).filter((ck) => { const x = stepOf(soonest(ck) || {}); return x && x.who === 'The client'; }).length;
    if (nC && theirs) nC.innerHTML = `${theirs}<span class="sr"> waiting on their answer</span>`;
    if (key) {
      todayHref = `today.html?as=${key}`;
      const t = $('a[data-today]');
      if (t) t.href = todayHref;
      // a member sees Settings read-only: the sidebar's link and the organization menu's keep who is looking
      if (key !== 'hala') {
        settingsHref = `settings.html?as=${key}`;
        $$('a[href="settings.html"]', $('.ap-side')).forEach((a) => { a.href = settingsHref; });
        // Ask Watar keeps one conversation per person: the member's own, not Hala's
        watarHref = `watar.html?as=${key}`;
        $$('a[href="watar.html"]').forEach((a) => { a.href = watarHref; });
      }
      // what Watar drafted for this person and still waits for their approval (the conversation keeps it per person)
      let pending = 0;
      try { const c = JSON.parse(sessionStorage.getItem(`iqaa-watar:${key}`) || 'null'); if (c && c.drafts) { const sent = JSON.parse(sessionStorage.getItem('iqaa-reminded') || '{}') || {}; pending = Object.values(c.drafts).filter((d) => d.state === 'pending' && !(d.type === 'remind' && d.when === 'now' && sent[d.code])).length; } } catch (e) { /* storage blocked: nothing waits */ }
      if (pending) {
        const words = `${pending === 1 ? 'draft waits' : 'drafts wait'} for you`, nW = $('[data-n-watar]'), dot = $('[data-n-watar-dot]');
        if (nW) nW.innerHTML = `${pending}<span class="sr"> ${words}</span>`;
        if (dot) { dot.hidden = false; dot.firstElementChild.textContent = `${pending} ${words}`; }
      }
    }
  }

  // ---------- the organization's menu ----------
  const orgBtn = $('[data-org-menu]'), menu = orgBtn && document.getElementById(orgBtn.getAttribute('aria-controls'));
  if (orgBtn && menu) {
    const close = (focus) => { menu.hidden = true; orgBtn.setAttribute('aria-expanded', 'false'); if (focus) orgBtn.focus(); };
    orgBtn.addEventListener('click', () => {
      const open = menu.hidden;
      menu.hidden = !open;
      orgBtn.setAttribute('aria-expanded', String(open));
      if (open) $('a', menu).focus();
    });
    document.addEventListener('click', (e) => { if (!menu.hidden && !menu.contains(e.target) && !orgBtn.contains(e.target)) close(false); });
    menu.addEventListener('keydown', (e) => {
      const links = $$('a', menu), i = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); links[(i + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length].focus(); }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) close(true); });
  }

  // ---------- search: screens and orders, from anywhere ----------
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || '');
  $$('[data-kbd]').forEach((k) => { k.textContent = mac ? '⌘K' : 'Ctrl K'; });
  const esc = (window.Beats && Beats.esc) || ((s) => String(s));
  const iconOf = (href) => { const a = $(`.ap-l[href^="${href.split(/[?#]/)[0]}"] svg`); return a ? a.outerHTML : '<span class="cmdk-ic" aria-hidden="true"></span>'; };
  const SCREENS = () => [
    { t: 'Overview', s: 'The whole organization at a glance', href: 'overview.html' },
    { t: 'Today', s: 'What waits for you', href: todayHref },
    { t: 'Line', s: 'The line as a map: test it, publish it', href: 'line.html' },
    { t: 'Build', s: 'Edit the line on a canvas', href: 'build.html', icon: 'line.html' },
    { t: 'Orders', s: 'Every job on the line', href: 'orders.html' },
    { t: 'Clients', s: 'Who you wait on, and who waits on you', href: 'clients.html' },
    { t: 'Ask Watar', s: 'Ask about the work; Watar answers from the line', href: watarHref },
    { t: 'Settings', s: 'Team, channels, the organization and its mark, billing', href: settingsHref },
    { t: 'Team', s: 'People and roles; invite someone', href: `${settingsHref}#team` },
    { t: 'Channels', s: 'Email, WhatsApp and SMS', href: `${settingsHref}#channels` },
    { t: 'Organization', s: 'Name, address, hours, mark and logo', href: `${settingsHref}#organization` },
    { t: 'Billing', s: 'Plan and what Sufra uses', href: `${settingsHref}#billing` },
    { t: 'Start another organization', s: 'Sign up, draft a line with Watar', href: 'signup.html' },
  ];
  let dlg = null, input = null, list = null, items = [], sel = 0;
  function where(j) {
    if (j.finished) return { m: `Finished ${j.finished}`, hand: false };
    const st = stations.find((s) => s.id === j.at), x = stepOf(j);
    const hand = !!x && (x.kind === 'struck' || x.kind === 'held');
    return { m: `${st ? st.name : ''}${hand ? ` · ${x.who === 'The client' ? 'waiting for the client' : `with ${x.who}`}` : ''}`, hand };
  }
  // a client is found by its name, its contact, or the code or title of any of its orders
  const ordersOf = (ck) => S.jobs.concat(S.past || []).filter((j) => j.ck === ck);
  function render() {
    const q = input.value.trim().toLowerCase();
    const screens = SCREENS().filter((s) => !q || `${s.t} ${s.s}`.toLowerCase().includes(q));
    // clients and past orders only once something is typed: the empty palette stays a short list of screens and today's jobs
    const clients = q && S && S.clients ? Object.keys(S.clients).filter((ck) => { const c = S.clients[ck];
      return `${c.name} ${c.contact || ''} ${ordersOf(ck).map((j) => `${j.code} ${j.title}`).join(' ')}`.toLowerCase().includes(q); }).slice(0, 5) : [];
    const jobs = (S ? (q ? S.jobs.concat(S.past || []) : S.jobs) : []).filter((j) => !q || `${j.code} ${j.title} ${j.client} ${j.of}`.toLowerCase().includes(q)).slice(0, q ? 8 : 5);
    const iconC = iconOf('clients.html'), iconO = iconOf('orders.html');
    items = [...screens.map((s) => ({ href: s.href, html: `${iconOf(s.icon || s.href)}<span class="cmdk-t"><b>${esc(s.t)}</b><span>${esc(s.s)}</span></span>` })),
      ...clients.map((ck) => { const c = S.clients[ck], j = soonest(ck), w = j ? where(j) : { m: 'Nothing open', hand: false };
        return { href: `client.html?c=${ck}`, html: `${iconC}<span class="cmdk-t"><b>${esc(c.name)}</b><span>${esc(c.private ? 'Private client' : c.contact)}</span></span><span class="cmdk-m${w.hand ? ' hand' : ''}">${esc(w.m)}</span>` }; }),
      ...jobs.map((j) => { const w = where(j); return { href: `order.html?code=${j.code}`, html: `${iconO}<span class="cmdk-t"><b><code>${j.code}</code>${esc(j.title)}</b><span>${esc(j.client)}, ${esc(j.of)} · ${j.people} people</span></span><span class="cmdk-m${w.hand ? ' hand' : ''}">${esc(w.m)}</span>` }; })];
    sel = Math.min(sel, Math.max(0, items.length - 1));
    const opt = (it, i) => `<li class="cmdk-o" role="option" id="cmdk-${i}" aria-selected="${i === sel}" data-i="${i}">${it.html}</li>`;
    // nothing matches: the words become a question for Watar, who answers from the line
    if (!items.length) {
      const words = input.value.trim();
      items = [{ href: `${watarHref}${watarHref.includes('?') ? '&' : '?'}q=${encodeURIComponent(words)}`, html: `${iconOf('watar.html')}<span class="cmdk-t"><b>Ask Watar: “${esc(words)}”</b><span>Nothing else matches. Watar answers from Sufra’s line.</span></span>` }];
      sel = 0;
      list.innerHTML = `<li class="cmdk-g" role="presentation">Ask Watar</li>${opt(items[0], 0)}`;
      input.setAttribute('aria-activedescendant', 'cmdk-0');
      return;
    }
    const group = (name, from, n) => (n ? `<li class="cmdk-g" role="presentation">${name}</li>${items.slice(from, from + n).map((it, i) => opt(it, i + from)).join('')}` : '');
    list.innerHTML = group('Screens', 0, screens.length) + group('Clients', screens.length, clients.length) + group('Orders', screens.length + clients.length, jobs.length);
    input.setAttribute('aria-activedescendant', `cmdk-${sel}`);
  }
  function pick(i) {
    sel = i;
    $$('.cmdk-o', list).forEach((o) => o.setAttribute('aria-selected', String(+o.dataset.i === sel)));
    input.setAttribute('aria-activedescendant', `cmdk-${sel}`);
    const o = document.getElementById(`cmdk-${sel}`);
    if (o) o.scrollIntoView({ block: 'nearest' });
  }
  // the dialog closes first: a result on this page (a Settings area) only changes the hash, and would leave it open
  function go(href) { dlg.close(); location.href = href; }
  function build() {
    dlg = document.createElement('dialog');
    dlg.className = 'cmdk';
    dlg.setAttribute('aria-label', 'Search');
    const glass = $('.ap-search svg');
    dlg.innerHTML = `<div class="cmdk-in">${glass ? glass.outerHTML : ''}<input type="text" role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-autocomplete="list" aria-label="Search screens and orders" placeholder="Search screens and orders" autocomplete="off" spellcheck="false"><kbd>Esc</kbd></div>
<ul class="cmdk-list" id="cmdk-list" role="listbox" aria-label="Results"></ul>
<p class="cmdk-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></p>`;
    document.body.appendChild(dlg);
    input = $('input', dlg);
    list = $('.cmdk-list', dlg);
    input.addEventListener('input', () => { sel = 0; render(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (items.length) pick((sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length); }
      if (e.key === 'Enter' && items[sel]) { e.preventDefault(); go(items[sel].href); }
    });
    list.addEventListener('mousemove', (e) => { const o = e.target.closest('.cmdk-o'); if (o && +o.dataset.i !== sel) pick(+o.dataset.i); });
    list.addEventListener('click', (e) => { const o = e.target.closest('.cmdk-o'); if (o) go(items[+o.dataset.i].href); });
    // a press on the dimmed page around the field closes it
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }
  function open() {
    if (!dlg) build();
    input.value = '';
    sel = 0;
    render();
    dlg.showModal();
    input.focus();
  }
  $$('[data-palette]').forEach((b) => b.addEventListener('click', open));
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (dlg && dlg.open) dlg.close(); else open();
    }
  });
})();
