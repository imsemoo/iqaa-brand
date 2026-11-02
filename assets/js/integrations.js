// Integrations (التكاملات), the owner's. Each connection says what it is used for (a channel, repositories, single
// sign-on, the hooks in and out) and its state; one whose permission ran out is the one red on the page, with
// Reconnect, and says what waits for it. A failure never stops the work: the team carries on in Iqaa and what waited
// goes out once the integration is back. Under it, the log of everything that came in or went out, newest first and by
// day, each event with its own key: a manual re-run uses the same key, so nothing is ever done twice. Checks are read
// the general way, from GitHub Check Runs. What a webhook source let in is read from the organization's `sources`, so
// this log and the Sources screen agree. Reconnecting is shared with Settings (sessionStorage 'iqaa-packs:<org>');
// re-runs are kept for the visit, with Undo; nothing is sent.
(function () {
  const root = document.querySelector('main.ig');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'khaled', masar: 'samir', wamda: 'hala' });
  const T = window.T, N = window.I18N.n, esc = FLOW.esc, O = C.O;
  const $ = (s, el) => (el || document).querySelector(s);
  const M = window.IQAA.motion;
  const icon = (n, s) => IQ.icon(n, s || 20);
  const fill = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
  const soon = (label, cls, ic) => `<button type="button" class="btn ${cls || ''}" aria-disabled="true" title="${esc(T('{name}: coming next', { name: label }))}">${ic ? icon(ic, 18) : ''}<span>${esc(label)}</span> <em>${esc(T('Soon'))}</em></button>`;
  const INTS = O.integrations || [];
  // each integration by what it does for the line, in the house's icons (no outside logos), as Settings draws them
  const KIND = { telegram: 'Send', instagram: 'Image', tiktok: 'Video', wordpress: 'HTTP', webhook: 'Webhook', github: 'Repository', slack: 'Message',
    sentry: 'Notifications', google: 'Lock', metaads: 'Billing', googleads: 'Billing', drive: 'Files' };
  let filter = 'all', undo = null;

  // ---------- what this visit changed: reconnections (shared with Settings) and re-runs ----------
  const read = (k, d) => { try { return JSON.parse(FLOW.store.get(k) || 'null') || d; } catch (e) { return d; } };
  const FIXED = `iqaa-packs:${O.id}`, RERUN = `iqaa-integrations:${O.id}`;
  const fixed = () => read(FIXED, []);
  const reruns = () => read(RERUN, {});
  const nameOf = (id) => (INTS.find((x) => x.id === id) || { name: id }).name;
  const broken = (id) => { const x = INTS.find((i) => i.id === id); return !!x && x.state === 'expired' && !fixed().includes(id); };

  // ---------- the log: the organization's events, and what its webhook sources let in ----------
  const hm = (iso) => iso.slice(11, 16).replace(':', '');
  function events() {
    const SAY = {
      item: '“{title}” came in from {from} and opened {code}',
      duplicate: '“{title}” came in again from {from}',
      turned: '“{title}” came in from {from}',
      failed: '“{title}” came in from {from}',
    };
    const fromSources = (O.sources || []).filter((s) => s.type === 'webhook').flatMap((s) => (s.today || []).map((x) => ({
      key: `wh-${s.id}-${hm(x.at)}`, at: x.at, dir: 'in', via: 'webhook', text: SAY[x.result] || SAY.item, vars: { title: x.title, from: s.name },
      code: x.code || x.of, state: x.result === 'item' ? 'done' : x.result, tries: x.result === 'failed' ? 1 : 0, why: x.why, outside: true,
    })));
    const done = reruns();
    return (O.events || []).concat(fromSources).map((e) => Object.assign({}, e, done[e.key] || {})).sort((a, b) => b.at.localeCompare(a.at));
  }
  // the sentence, with its item's code as code and its names in the page's language
  // a reason that starts a fragment of its own opens with a capital ('Failed once · The link does not open')
  const cap = (s) => s.charAt(0).toLocaleUpperCase(I18N.lang) + s.slice(1);
  // a name that opens with an article reads in lower case inside a sentence where the language has one: 'from the
  // partner’s site'; a proper name ('Hikaya') keeps its capital
  const lc = (src, s) => (/^The /.test(src) && I18N.lang !== 'ar' ? s.charAt(0).toLocaleLowerCase(I18N.lang) + s.slice(1) : s);
  function sentence(e, html) {
    const v = {};
    Object.entries(e.vars || {}).forEach(([k, x]) => { const s = typeof x === 'number' ? String(x) : lc(x, T(x)); v[k] = html ? `<bdi>${esc(s)}</bdi>` : s; });
    // an item on the organization's line opens its page; one on another line, or finished, is its code alone
    const open = e.code && C.items.some((it) => it.code === e.code);
    if (e.code) v.code = !html ? e.code : open ? `<a href="${C.href('item.html', { code: e.code })}"><code dir="ltr">${esc(e.code)}</code></a>` : `<code dir="ltr">${esc(e.code)}</code>`;
    return html ? fill(esc(T(e.text)), v) : fill(T(e.text), v);
  }

  // ---------- the connections ----------
  // what each is used for, as its row says it, in the order world.js gives it
  const USE = {
    channel: (v) => T('The {name} channel', { name: T(v) }),
    channels: (v) => N(v, '{n} channel', '{n} channels'),
    approvals: (v) => (v ? T('Approvals on') : ''),
    sso: (v) => (v ? T('Single sign-on') : ''),
    repos: (v) => N(v.length, '{n} repository', '{n} repositories'),
    projects: (v) => N(v, '{n} project', '{n} projects'),
    in: (v) => N(v.length, '{n} in', '{n} in'),
    out: (v) => N(v.length, '{n} out', '{n} out'),
    adAccounts: (v) => N(v, '{n} ad account', '{n} ad accounts'),
    folders: (v) => N(v, '{n} client folder', '{n} client folders'),
  };
  // an address or handle (with an @ or a dot) is shown as written; a name is said in the page's language
  const account = (a) => (/[@.]/.test(a) ? `<bdi dir="ltr">${esc(a)}</bdi>` : `<bdi>${esc(T(a))}</bdi>`);
  function connections() {
    const all = events(), bad = INTS.filter((x) => broken(x.id));
    $('[data-c-n]').textContent = INTS.length || '';
    $('[data-c-sum]').textContent = !INTS.length ? '' : bad.length ? N(bad.length, '{n} needs reconnecting', '{n} need reconnecting') : T('All of them work');
    $('[data-cons]').innerHTML = INTS.length ? INTS.map((x) => {
      const off = broken(x.id), mine = all.filter((e) => e.via === x.id);
      const last = mine[0], waits = mine.filter((e) => e.state === 'failed' && e.dir === 'out').length;
      const facts = Object.entries(x.use || {}).map(([k, v]) => (USE[k] ? USE[k](v) : '')).filter(Boolean);
      if (last && !off) facts.push(T('last event {when}', { when: FLOW.ago(last.at) }));
      const state = off ? `<span class="ig-st bad">${icon('Lock', 18)}<span>${esc(T('Permission expired'))}</span></span>`
        : `<span class="ig-st">${icon('Done', 18)}<span>${esc(x.state === 'expired' ? T('Works again') : T('Works'))}</span></span>`;
      const fix = off ? `<button type="button" class="btn small" data-reconnect="${esc(x.id)}" aria-label="${esc(T('Reconnect {name}', { name: x.name }))}">${icon('Retry', 18)}<span>${esc(T('Reconnect'))}</span></button>` : '';
      // a problem says since when and what waits for it; GitHub says how its checks are read
      let why = '';
      if (off) why = `<p class="ig-why bad">${esc([x.since ? T('Expired {when}', { when: FLOW.when(x.since) }) : '', waits ? N(waits, '{n} post waits for it', '{n} posts wait for it') : T('What goes to it waits until it is reconnected.')].filter(Boolean).join(' · '))}</p>`;
      else if ((x.use || {}).checks) why = `<p class="ig-why">${esc(T('Checks are read from GitHub Check Runs, so any tool that posts there is read too.'))}</p>`;
      return `<li class="ig-con${off ? ' is-bad' : ''}" data-int="${esc(x.id)}"><span class="ig-ic" aria-hidden="true">${icon(KIND[x.id] || 'Link', 20)}</span>
<span class="ig-ct"><b>${esc(x.name)}</b><span>${account(x.account)}</span>${facts.length ? `<small>${esc(facts.join(' · '))}</small>` : ''}</span><span class="ig-cs">${state}${fix}</span>${why}</li>`;
    }).join('') : `<li class="ig-empty">${esc(T('Nothing is connected yet.'))}</li>`;
  }

  // ---------- the log, by day, with its filter ----------
  const FILTERS = [['all', 'All'], ['in', 'In'], ['out', 'Out'], ['failed', 'Failed']];
  const pass = (e) => filter === 'all' || (filter === 'failed' ? e.state === 'failed' : e.dir === filter);
  function day(iso) {
    const d = FLOW.dayOf(iso);
    return d === 0 ? T('Today') : d === -1 ? T('Yesterday') : FLOW.date(iso);
  }
  function row(e) {
    const via = nameOf(e.via);
    const meta = [e.dir === 'in' ? T('In') : T('Out'), via, e.check ? T('Check Runs') : '', e.by ? C.name(e.by) : ''].filter(Boolean).join(' · ');
    let status = '';
    if (e.state === 'failed') status = `<p class="ig-es bad">${icon('Late', 16)}<span>${esc([N(e.tries || 1, 'Failed once', 'Failed {n} times'), e.why ? cap(T(e.why)) : ''].filter(Boolean).join(' · '))}</span></p>`;
    else if (e.state === 'duplicate') status = `<p class="ig-es">${icon('Discard', 16)}<span>${fill(esc(T('A duplicate of {code}: not let in twice')), { code: `<code dir="ltr">${esc(e.code)}</code>` })}</span></p>`;
    else if (e.state === 'turned') status = `<p class="ig-es">${icon('Discard', 16)}<span>${esc(T('Turned away: {why}', { why: T(e.why) }))}</span></p>`;
    else if (e.rerunBy) status = `<p class="ig-es">${icon('Done', 16)}<span>${esc(T('Went out on a re-run by {name}', { name: C.name(e.rerunBy) }))}</span></p>`;
    const label = T('Re-run: {event}', { event: sentence(e, false) });
    const act = e.state === 'failed'
      ? `<button type="button" class="btn small" data-rerun="${esc(e.key)}" aria-label="${esc(label)}">${icon('Retry', 18)}<span>${esc(T('Re-run'))}</span></button>`
      : `<button type="button" class="link ig-rr" data-rerun="${esc(e.key)}" aria-label="${esc(label)}">${esc(T('Re-run'))}</button>`;
    return `<li class="ig-ev${e.state === 'failed' ? ' is-bad' : ''}" data-ev="${esc(e.key)}"><span class="ig-dir" aria-hidden="true">${icon(e.dir === 'in' ? 'Inbox' : 'Send', 18)}</span>
<div class="ig-et"><p class="ig-s">${sentence(e, true)}</p><p class="ig-m"><span>${esc(meta)}</span><code dir="ltr" title="${esc(T('The event’s key'))}">${esc(e.key)}</code></p>${status}</div>
<time class="ig-t" datetime="${e.at}" dir="ltr">${e.at.slice(11, 16)}</time><div class="ig-a">${act}</div></li>`;
  }
  function log() {
    const all = events(), shown = all.filter(pass);
    const count = (k) => (k === 'all' ? all.length : all.filter((e) => (k === 'failed' ? e.state === 'failed' : e.dir === k)).length);
    $('[data-filter]').innerHTML = FILTERS.map(([k, n]) => `<button type="button" class="ig-f${k === 'failed' && count(k) ? ' has-bad' : ''}" data-f="${k}" aria-pressed="${k === filter}">${esc(T(n))} <span>${count(k)}</span></button>`).join('');
    if (!shown.length) {
      $('[data-log]').innerHTML = `<p class="ig-none">${esc(filter === 'failed' ? T('Nothing failed. Everything went out or came in.') : T('Nothing here yet.'))}</p>`;
      return;
    }
    const days = [];
    shown.forEach((e) => { const d = e.at.slice(0, 10), g = days[days.length - 1]; if (g && g.d === d) g.list.push(e); else days.push({ d, at: e.at, list: [e] }); });
    $('[data-log]').innerHTML = days.map((g) => `<h3 class="ig-day">${esc(day(g.at))}</h3><ol class="ig-evs">${g.list.map(row).join('')}</ol>`).join('');
  }

  // ---------- what was just done, with its Undo when it can be taken back ----------
  function note(text, canUndo) {
    const el = $('[data-note]');
    $('[data-note-t]').textContent = text;
    $('[data-undo]').hidden = !canUndo;
    if (!canUndo) undo = null;
    el.hidden = false;
    clearTimeout(note.t);
    note.t = setTimeout(function fade() {
      if (el.contains(document.activeElement)) { note.t = setTimeout(fade, 4000); return; }
      el.hidden = true;
      undo = null;
    }, 8000);
  }
  const flash = (el) => { if (el && !window.Beats.reduce()) el.animate([{ backgroundColor: 'rgba(25, 23, 46, 0.06)' }, { backgroundColor: 'rgba(25, 23, 46, 0)' }], { duration: M.beat * 2, easing: M.ease_leave }); };
  function render() { connections(); log(); }

  function rerun(key) {
    const e = events().find((x) => x.key === key);
    if (!e) return;
    // what went through once is not done again: the same key changes nothing
    if (e.state !== 'failed') { note(T('{key} ran once already. A re-run with the same key changes nothing.', { key })); return; }
    // an integration whose permission ran out has to be reconnected first; what failed waits for it
    if (broken(e.via)) { note(T('Reconnect {name} first: what failed waits for it, and goes out once.', { name: nameOf(e.via) })); return; }
    const all = reruns();
    if (e.outside) {
      // the cause is outside Iqaa (the sender's link): trying again meets it again
      all[key] = { tries: (e.tries || 1) + 1 };
      FLOW.store.set(RERUN, JSON.stringify(all));
      render();
      note(T('Tried again with the same key: {why}', { why: T(e.why) }));
    } else {
      all[key] = { state: 'done', rerunBy: C.me };
      FLOW.store.set(RERUN, JSON.stringify(all));
      undo = { ev: key };
      render();
      flash($(`[data-ev="${key}"]`));
      note(T('{key} went out once, on a re-run. Nothing is sent in this prototype.', { key }), true);
    }
    const again = $(`[data-ev="${key}"] [data-rerun]`);
    if (again) again.focus();
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.getAttribute('aria-disabled') === 'true') return;
    if (b.dataset.f) {
      filter = b.dataset.f;
      log();
      $(`[data-f="${filter}"]`).focus();
    } else if (b.dataset.rerun) {
      rerun(b.dataset.rerun);
    } else if (b.dataset.reconnect) {
      const id = b.dataset.reconnect;
      FLOW.store.set(FIXED, JSON.stringify(fixed().concat([id])));
      undo = { int: id };
      render();
      flash($(`[data-int="${id}"]`));
      note(T('{name} is connected again for this visit. Nothing is sent in this prototype.', { name: nameOf(id) }), true);
      $('[data-undo]').focus();
    } else if (b.hasAttribute('data-undo') && undo) {
      const u = undo;
      undo = null;
      $('[data-note]').hidden = true;
      if (u.int) FLOW.store.set(FIXED, JSON.stringify(fixed().filter((x) => x !== u.int)));
      else { const all = reruns(); delete all[u.ev]; FLOW.store.set(RERUN, JSON.stringify(all)); }
      render();
      const again = u.int ? $(`[data-reconnect="${u.int}"]`) : $(`[data-ev="${u.ev}"] [data-rerun]`);
      if (again) again.focus();
    }
  });

  document.title = `${T('Integrations')} · ${T(O.name)}`;
  $('[data-org]').textContent = T(O.name);
  // the integrations are the owner's: someone else is told so, and sent to their own work
  if (!C.P.owner) {
    $('[data-body]').innerHTML = `<div class="ig-off"><p><b>${esc(T('The integrations of {org} belong to its owner.', { org: T(O.name) }))}</b></p>`
      + `<p>${esc(T('The owner connects them and sees everything that came in or went out.'))}</p>`
      + `<a class="btn" href="${C.href('work.html')}">${icon('My work', 18)}<span>${esc(T('My work'))}</span></a></div>`;
    return;
  }
  $('[data-add]').innerHTML = soon(T('Add an integration'), '', 'Create');
  render();
})();
