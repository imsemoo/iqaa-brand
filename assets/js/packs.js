// Settings: packs and integrations (الحزم والإعدادات), the owner's. A pack adds blocks, screens and reports and never
// changes how the core works; it is the only way an organization's Iqaa differs from another's. The organization's own
// pack is on, with what it adds; the others are listed with Turn on, which comes after the event. The integrations the
// organization connected each say their account and whether they work; one whose permission ran out is the one red on
// the page, with Reconnect (kept for the visit, undoable; nothing is sent). Then the organization's identity, and this
// month's usage against the plan's limits, whose numbers are an example: prices are not decided yet.
(function () {
  const root = document.querySelector('main.pk');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'khaled', masar: 'samir' });
  const W = window.WORLD, T = window.T, N = window.I18N.n, esc = FLOW.esc, O = C.O;
  const $ = (s, el) => (el || document).querySelector(s);
  const M = window.IQAA.motion;
  const icon = (n, s) => IQ.icon(n, s || 20);
  // grouped the way the page's language writes numbers (Turkish groups with a dot); Arabic keeps Western digits
  const num = (n) => new Intl.NumberFormat(I18N.lang === 'tr' ? 'tr-TR' : 'en-US').format(n);
  const soon = (label, cls, ic, later) => `<button type="button" class="btn ${cls || ''}" aria-disabled="true" title="${esc(T('{name}: coming next', { name: label }))}">${ic ? icon(ic, 18) : ''}<span>${esc(label)}</span> <em>${esc(later || T('Soon'))}</em></button>`;

  // ---------- the packs Iqaa offers: what each adds, and the integrations that come with it ----------
  // The same catalogue for every organization; an organization turns one on (world.js `pack`). Counts are the pack's
  // own blocks and templates, shown for a pack that is on.
  const PACKS = [
    { name: 'Media and production', blocks: 3, templates: 6, integrations: ['Meta', 'TikTok', 'Telegram', 'WordPress'],
      adds: [['Sources', 'Sources'], ['Publishing to platforms', 'Publish'], ['The saved archive and restoring pages', 'Archive'], ['Reading comments', 'Message']] },
    { name: 'Software', blocks: 2, templates: 4, integrations: ['GitHub', 'Slack', 'Sentry'],
      adds: [['GitHub connection', 'Repository'], ['The state of checks', 'Test run'], ['Releases', 'Release'], ['Environments', 'Environment']] },
    { name: 'Agencies', integrations: ['Meta Ads', 'Google Ads', 'Drive'],
      adds: [['Ad accounts', 'Link'], ['Client approvals', 'Done'], ['Spend invoices', 'Billing']] },
  ];
  // each integration by what it does for the line, in the house's icons (no outside logos)
  const KIND = { telegram: 'Send', instagram: 'Image', tiktok: 'Video', wordpress: 'HTTP', webhook: 'Webhook', github: 'Repository', slack: 'Message', sentry: 'Notifications' };

  function packs() {
    const own = PACKS.find((p) => p.name === O.pack);
    const list = (own ? [own] : []).concat(PACKS.filter((p) => p !== own));
    $('[data-packs]').innerHTML = list.map((p) => {
      const on = p === own, name = T('{pack} pack', { pack: T(p.name) });
      const adds = `<ul class="pk-adds" aria-label="${esc(T('What it adds'))}">${p.adds.map(([a, ic]) => `<li>${icon(ic, 18)}<span>${esc(T(a))}</span></li>`).join('')}</ul>`;
      // its numbers as icons, its integrations as chips (the words stay in the tooltip and for the screen reader)
      const facts = `<div class="pk-facts">${on && p.blocks ? FLOW.stat('Line', p.blocks, N(p.blocks, '{n} block', '{n} blocks')) : ''}`
        + `${on && p.templates ? FLOW.stat('Templates', p.templates, N(p.templates, '{n} template', '{n} templates')) : ''}`
        + `<ul class="pk-chips" aria-label="${esc(T('Integrations: {list}', { list: p.integrations.join(T(', ')) }))}">${p.integrations.map((x) => `<li dir="ltr">${esc(x)}</li>`).join('')}</ul></div>`;
      const state = on ? `<span class="pk-on">${icon('Done', 18)}<span>${esc(T('The pack is on'))}</span></span>`
        : soon(T('Turn on'), 'small', 'Create', T('After the event'));
      const off = on ? T('Turning it off hides its screens, blocks and templates. Nothing is deleted: its data stays.') : '';
      return `<li class="pk-pack${on ? ' is-on' : ''}"${off ? ` title="${esc(off)}"` : ''}><div class="pk-ph"><h4>${esc(name)}</h4>${state}</div>${adds}${facts}${off ? `<span class="sr">${esc(off)}</span>` : ''}</li>`;
    }).join('');
  }

  // ---------- the integrations connected: account and state; a reconnection is kept for the visit ----------
  const KEY = `iqaa-packs:${O.id}`;
  const fixed = () => { try { return JSON.parse(FLOW.store.get(KEY) || '[]') || []; } catch (e) { return []; } };
  let undo = null;
  // an address or handle (with an @ or a dot) is shown as written; a name is said in the page's language
  const account = (a) => (/[@.]/.test(a) ? `<bdi dir="ltr">${esc(a)}</bdi>` : `<bdi>${esc(T(a))}</bdi>`);
  function integrations() {
    const done = fixed(), all = O.integrations || [];
    $('[data-int-n]').textContent = all.length || '';
    $('[data-int-add]').innerHTML = soon(T('Add an integration'), 'small', 'Create');
    $('[data-ints]').innerHTML = all.length ? all.map((x) => {
      const bad = x.state === 'expired' && !done.includes(x.id);
      const state = bad ? `<span class="pk-st bad">${icon('Lock', 18)}<span>${esc(T('Permission expired'))}</span></span>`
        : `<span class="pk-st">${icon('Done', 18)}<span>${esc(done.includes(x.id) ? T('Works again') : T('Works'))}</span></span>`;
      const why = bad ? `<p class="pk-why">${esc([x.since ? T('Expired {when}', { when: FLOW.when(x.since) }) : '', T('What goes to it waits until it is reconnected.')].filter(Boolean).join(' · '))}</p>` : '';
      return `<li class="pk-int${bad ? ' is-bad' : ''}" data-int="${esc(x.id)}"><span class="pk-ic" aria-hidden="true">${icon(KIND[x.id] || 'Link', 20)}</span>`
        + `<span class="pk-it"><b>${esc(x.name)}</b><span>${account(x.account)}</span></span><span class="pk-sa">${state}`
        + `${bad ? `<button type="button" class="btn small" data-reconnect="${esc(x.id)}" aria-label="${esc(T('Reconnect {name}', { name: x.name }))}">${icon('Retry', 18)}<span>${esc(T('Reconnect'))}</span></button>` : ''}</span>${why}</li>`;
    }).join('') : `<li class="pk-empty">${esc(T('Nothing is connected yet.'))}</li>`;
  }

  // ---------- the identity: light on purpose ----------
  const LANG = { ar: 'Arabic', en: 'English', tr: 'Turkish' };
  function identity() {
    const lang = (O.identity || {}).language;
    $('[data-identity]').innerHTML = `<div class="pk-who"><span class="org-mark pk-mark" data-mark></span><span class="pk-wt"><b>${esc(T(O.name))}</b><span dir="ltr">${esc(O.address)}</span></span></div>`
      + `${lang ? `<dl class="pk-dl"><div><dt>${esc(T('Main language'))}</dt><dd>${esc(T(LANG[lang] || lang))}</dd></div></dl>` : ''}`
      + `<span class="sr">${esc(T('The identity is light: a mark, an address and a language. Iqaa’s own look stays as it is.'))}</span>`;
    const initial = (O.mark || {})[I18N.lang] || (O.mark || {}).en || O.name;
    window.Beats.sig($('[data-mark]'), C.line.blocks.filter((b) => !b.side).map((b) => ({ name: b.name, steps: [b.stroke] })),
      { mode: 'mark', size: 48, name: initial, label: T('{org}’s mark', { org: T(O.name) }) });
  }

  // ---------- this month's usage, against the plan's limits; the numbers are an example ----------
  // seats: everyone with an account or an invitation, the visit's invitations from People and departments included
  function seats() {
    let v = null;
    try { v = JSON.parse(FLOW.store.get(`iqaa-people:${O.id}`) || 'null'); } catch (e) { v = null; }
    return Object.keys(O.people).length + ((v && v.invites) || []).length;
  }
  function usage() {
    const U = O.usage;
    if (!U) { $('[data-usage]').innerHTML = `<p class="pk-foot">${esc(T('No usage this month yet.'))}</p>`; return; }
    const rows = [
      { k: T('AI credit'), n: U.credit, of: U.creditOf, say: '{n} of {of}' },
      { k: T('Storage'), n: U.storage, of: U.storageOf, say: '{n} of {of} GB' },
      { k: T('Seats'), n: seats(), of: U.seatsOf, say: '{n} of {of}', hint: T('Everyone with an account or an invitation takes a seat.') },
    ];
    // the numbers are an example and say so in one word; the reason is the tooltip
    $('[data-usage]').innerHTML = `<div class="pk-eg"><p class="pk-ex" title="${esc(T('The limits come from the organization’s plan. Prices are not decided yet: the numbers here are an example.'))}">${icon('Draft', 16)}<span>${esc(T('Example numbers'))}</span><span class="sr">${esc(T('The limits come from the organization’s plan. Prices are not decided yet: the numbers here are an example.'))}</span></p>`
      + `<dl class="pk-use">${rows.map((r) => {
        const pct = Math.min(100, Math.round((r.n / r.of) * 100)), full = r.n >= r.of;
        // the number used in the house's figures, the limit after it in words
        const say = T(r.say, { n: `<b>${num(r.n)}</b>`, of: num(r.of) });
        return `<div${r.hint ? ` title="${esc(r.hint)}"` : ''}><dt>${esc(r.k)}</dt><dd><span class="pk-un${full ? ' bad' : ''}">${say}</span>`
          + `<span class="pk-bar${full ? ' bad' : ''}" role="img" aria-label="${esc(T('{pct}% used', { pct }))}"><i style="inline-size:${pct}%"></i></span>${r.hint ? `<span class="sr">${esc(r.hint)}</span>` : ''}</dd></div>`;
      }).join('')}</dl></div>`;
  }

  // ---------- reconnecting, and taking it back ----------
  function note(text) {
    const el = $('[data-note]');
    $('[data-note-t]').textContent = text;
    el.hidden = false;
    clearTimeout(note.t);
    note.t = setTimeout(function fade() {
      if (el.contains(document.activeElement)) { note.t = setTimeout(fade, 4000); return; }
      el.hidden = true;
      undo = null;
    }, 8000);
  }
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.getAttribute('aria-disabled') === 'true') return;
    if (b.dataset.reconnect) {
      const id = b.dataset.reconnect, x = O.integrations.find((i) => i.id === id);
      FLOW.store.set(KEY, JSON.stringify(fixed().concat([id])));
      undo = id;
      integrations();
      const li = $(`[data-int="${id}"]`);
      if (li && !window.Beats.reduce()) li.animate([{ backgroundColor: 'rgba(25, 23, 46, 0.06)' }, { backgroundColor: 'rgba(25, 23, 46, 0)' }], { duration: M.beat * 2, easing: M.ease_leave });
      note(T('{name} is connected again for this visit. Nothing is sent in this prototype.', { name: x.name }));
      $('[data-undo]').focus();
    } else if (b.hasAttribute('data-undo') && undo) {
      const id = undo;
      FLOW.store.set(KEY, JSON.stringify(fixed().filter((x) => x !== id)));
      undo = null;
      $('[data-note]').hidden = true;
      integrations();
      const again = $(`[data-reconnect="${id}"]`);
      if (again) again.focus();
    }
  });

  document.title = `${T('Settings')} · ${T(O.name)}`;
  // the settings are the owner's: someone else is told so, and sent to their own work
  if (!C.P.owner) {
    $('[data-body]').innerHTML = `<div class="pk-none"><p><b>${esc(T('The settings of {org} belong to its owner.', { org: T(O.name) }))}</b></p>`
      + `<p>${esc(T('The owner turns packs on, connects integrations and sees the month’s usage.'))}</p>`
      + `<a class="btn" href="${C.href('work.html')}">${icon('My work', 18)}<span>${esc(T('My work'))}</span></a></div>`;
    return;
  }
  packs();
  integrations();
  identity();
  usage();
})();
