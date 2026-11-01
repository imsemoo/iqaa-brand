// Settings: how the organization is set up. One area at a time, each at its own address (#team, #channels,
// #organization, #billing), beside a nav that says how each is set up. Every change applies on its own: its editor
// opens in its row, nothing changes until Save, and Save leaves a note in the row with Undo for 8 s, as on the Line.
// A member (?as=reem) sees the same page read-only. Changes live in page memory; a reload starts again from sufra.js.
(function () {
  const root = document.querySelector('main.se');
  if (!root || !window.IQ || !window.Beats || !window.SUFRA || !window.JOBS) return;
  const S = window.SUFRA, M = window.IQAA.motion;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const esc = Beats.esc, isPerson = JOBS.isPerson, N = I18N.n, lang = I18N.lang;
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const line = S.line(), J = JOBS.on(line), V = JOBS.views(J, S);
  const live = S.jobs.filter((j) => !j.finished), main = line.stations;
  const DAY = 864e5, NOTE_MS = 8000;
  const msOf = (t) => V.U(t).getTime();
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;   // sign-up's rule, and its words
  const BAD_EMAIL = 'That doesn’t look like an email address. Check for a missing @ or dot.';
  const ico = (n, s) => IQ.icon(n, s || 18);
  const g = (kind, o) => `<span class="se-g${o && o.big ? ' big' : ''}" aria-hidden="true">${IQ.glyph(kind, { test: !!(o && o.test), pal: (o && o.pal) || 'light' })}</span>`;
  const both = (a) => (a.length < 2 ? a.join('') : T('{a} and {b}', { a: a.slice(0, -1).join(T(', ')), b: a[a.length - 1] }));
  const bdi = (t) => `<bdi>${esc(t)}</bdi>`;
  // a sentence's first letter made small, where the language has cases (Turkish keeps its dotted i)
  const lcFirst = (t) => t.charAt(0).toLocaleLowerCase(lang) + t.slice(1);
  // the data keeps names in English and an editor shows them in the page's language: a value left as shown goes back
  // to the data unchanged
  const keep = (typed, was) => (typed === T(was) ? was : typed);
  // a number typed with Arabic-Indic or Persian digits is the same number; the line keeps Western digits
  const digits = (t) => t.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) & 0xF));
  // a person's strip shows where on the line they work, so it runs the way the language reads (brand.css: .flow)
  const flow = (svg) => svg.replace('<svg class="strip"', '<svg class="strip flow"');
  // a word another screen translates with another meaning ('Edit' is sign-up's video editing, 'Field' a form's
  // field): English shows the word, the other languages look it up under a key that says which one it is
  const word = (en, key) => (lang === 'en' ? en : T(key));
  // an action's word on its button, and its whole name for a screen reader: 'Edit', heard as 'Edit Reem'
  const named = (word, full) => (full ? `<span aria-hidden="true">${word}</span><span class="sr">${esc(full)}</span>` : word);
  const RUNS = $('template[data-runs]').innerHTML;

  // ---------- who is looking: ?as= for the prototype, Hala the owner by default; the sidebar names them before
  // app.js counts what waits for them ----------
  const asKey = (new URLSearchParams(location.search).get('as') || 'hala').toLowerCase();
  const viewerKey = S.people[asKey] ? asKey : 'hala', viewer = S.people[viewerKey], owner = viewer.access === 'owner';
  const owners = Object.values(S.people).filter((p) => p.access === 'owner').map((p) => p.name);
  const meName = $('[data-me-name]');
  $('[data-me-av]').textContent = T(viewer.name).charAt(0);
  meName.textContent = T(viewer.name);
  meName.dataset.who = viewer.name;
  $('[data-me-role]').textContent = owner ? T('Owner') : T(viewer.role);

  // ---------- the page's state: Sufra as sufra.js has it, changed only by Save and Undo ----------
  let seq = 0;
  const state = {
    people: Object.keys(S.people).map((k) => Object.assign({ k }, clone(S.people[k]))),
    invites: S.invites.map((v) => Object.assign({ id: `v${++seq}` }, clone(v))),
    org: Object.assign(clone(S.org), { opens: S.hours.open, closes: S.hours.close }),
    channels: clone(S.channels),
    billing: clone(S.billing),
  };
  const ed = {};       // open editors: id -> { v: what was typed, err: messages under fields }; kept while away
  const notes = {};    // row id -> the note in that row: its words, Undo, and an 8 s timer that pauses
  let ghosts = [];     // rows taken away, kept in place for their note: { at, list, i }
  const urls = new Set();   // logo files read in this tab, revoked once nothing holds them

  // ---------- what the line gives each person ----------
  // every person step, in route order, with its station and where it sorts: a branch station after the station
  // its branch leaves from
  const PSTEPS = [];
  main.forEach((st, i) => st.steps.forEach((x) => { if (isPerson(x.kind)) PSTEPS.push({ st, x, at: i }); }));
  line.routes.filter((r) => r.type === 'branch').forEach((r) => {
    const at = main.findIndex((s) => s.id === r.from) + 0.5;
    r.stations.forEach((st) => st.steps.forEach((x) => { if (isPerson(x.kind)) PSTEPS.push({ st, x, at }); }));
  });
  const stepsOf = (name) => PSTEPS.filter((s) => s.x.who === name);
  const stationsOf = (name) => [...new Set(stepsOf(name).map((s) => s.st.name))];
  const waitingOn = (name, x) => live.filter((j) => { const y = J.stepOf(j); return !!y && isPerson(y.kind) && y.who === name && (!x || y === x); });
  // a step said from the person's side: what waits for them is an approval (today.js says the done ones this way);
  // the whole English sentence is the key
  const stepName = (x) => { const w = /^Watar drafts (.+)$/.exec(x.name); return w ? T(`Approves Watar’s draft of ${w[1]}`) : x.kind === 'held' ? T('Approves: {step}', { step: T(x.name) }) : T(x.name); };
  // the team in the order a job meets them; someone with no steps comes last
  const rank = (p) => { const s = stepsOf(p.name); return s.length ? Math.min(...s.map((y) => y.at)) : Infinity; };
  const team = () => state.people.slice().sort((a, b) => (rank(a) - rank(b)) || 0);
  const until = (sent) => V.day(msOf(sent) + 7 * DAY);   // an invitation's link works seven days

  // ---------- the organization's name and mark, as typed or as saved ----------
  const typed = (id, k) => (ed[id] && ed[id].v[k] != null ? ed[id].v[k] : null);
  const orgName = (saved) => { const t = !saved && typed('name', 'name'); return t && t.trim() ? keep(t.trim(), state.org.name) : state.org.name; };
  // the sender of emails is the organization's name until someone writes another
  const sender = () => { const t = typed('email', 'from'); return t != null ? keep(t.trim(), state.channels.email.from) || state.channels.email.from : state.channels.email.from === state.org.name ? orgName() : state.channels.email.from; };
  const initialOf = (name) => name.trim().charAt(0).toUpperCase();
  const written = (ch) => !!(window.IQAA.letters || {})[ch];
  const kinds = main.map((s) => s.steps.map((x) => x.kind));
  // the opening that colours the initial: whole stations, up to three steps (grammar.js lead)
  const opening = [];
  IQ.lead(kinds, 3).forEach((b, i) => b.forEach((_, n) => opening.push(main[i].steps[n])));
  const savedLogo = () => (state.org.mark === 'logo' ? state.org.logo : null);
  // the logo the previews show: a chosen file, the one in use, or none while the initial is chosen back
  function shownLogo(saved) {
    const L = !saved && ed.logo;
    if (!L) return savedLogo();
    if ((L.v.choice || state.org.mark) === 'initial') return null;
    return L.v.file || savedLogo();
  }
  function markHtml(size, o) {
    const saved = !!(o && o.saved), logo = shownLogo(saved);
    if (logo) return `<img class="se-logo" src="${logo.url}" width="${size}" height="${size}" alt="${o && o.alt ? esc(o.alt) : ''}">`;
    return IQ.avatar(kinds, { size, name: orgName(saved), label: (o && o.label) || '' });
  }
  // the sidebar's 32 px mark follows a saved rename or logo on this page
  function signSidebar(write) {
    const el = $('[data-org-mark]');
    if (!el) return;
    el.innerHTML = markHtml(32, { saved: true, label: T('{org}’s mark', { org: T(state.org.name) }), alt: T('{org}’s logo', { org: T(state.org.name) }) });
    if (write) Beats.write(el, { each: M.quarter });
  }
  function renameAll(name) {
    $$('[data-org-name]').forEach((el) => { el.textContent = T(name); });
    const b = $('.ap-org');
    if (b) b.title = T(name);
    title();
  }

  // ---------- the line's messages: the steps that send, in the order a job meets them, and what each did today ----------
  const MSG = [];
  main.forEach((st) => st.steps.forEach((x, n) => {
    if (x.kind !== 'run' || !/^(Send|Remind)$/.test(x.who)) return;
    const prev = st.steps[n - 1];
    MSG.push({ st, x, m: S.messages[x.name] || { to: 'client', by: 'Email' }, rest: prev && prev.kind === 'rest' ? prev : null });
  }));
  const flat = (j) => J.route(j).reduce((a, st) => a.concat(st.steps), []);
  const add = (map, k, v) => { if (!map.has(k)) map.set(k, []); map.get(k).push(v); };
  // sent today: every step that runs by itself between a step someone finished this morning and where the job is now
  const sent = new Map(), running = new Map();
  S.done.forEach((d) => {
    const j = live.find((y) => y.code === d.code);
    if (!j) return;
    const steps = flat(j), i0 = steps.findIndex((x) => x.name === d.step), i1 = steps.indexOf(J.stepOf(j));
    if (i0 >= 0) steps.slice(i0 + 1, i1).forEach((x) => { if (x.kind === 'run') add(sent, x, { j, t: d.time }); });
  });
  live.forEach((j) => { const x = J.stepOf(j); if (x && x.kind === 'run') add(running, x, j); });
  function events(x) {
    const out = (sent.get(x) || []).slice().sort((a, b) => a.t.localeCompare(b.t)).map((e) => T('{time} to {client}', { time: e.t, client: T(e.j.client) }));
    (running.get(x) || []).forEach((j) => {
      const d = S.done.find((y) => y.code === j.code);
      out.push(d ? T('Sending now to {client}, since {time}', { client: T(j.client), time: d.time }) : T('Sending now to {client}', { client: T(j.client) }));
    });
    return out;
  }
  // the job a preview is filled from: the latest sent today, else the one sending now, else the next to get there
  function jobFor(x) {
    const s = (sent.get(x) || []).slice().sort((a, b) => b.t.localeCompare(a.t))[0];
    if (s) return { j: s.j, t: s.t, cap: T('Sent to {client} at {time} today.', { client: T(s.j.client), time: s.t }) };
    const r = (running.get(x) || [])[0];
    if (r) return { j: r, t: V.hm(V.now()), cap: T('Sending to {client} now.', { client: T(r.client) }) };
    const away = (j) => { if (J.stepOf(j) === x) return 0; const i = J.ahead(j).findIndex((a) => a.x === x); return i < 0 ? Infinity : i + 1; };
    const j = live.slice().sort((a, b) => (away(a) - away(b)) || a.iso.localeCompare(b.iso))[0];
    return { j, t: V.hm(V.now()), cap: T('The next job to reach this step.') };
  }
  const short = (n) => (/^Dr /.test(n) ? n : n.split(' ')[0]);
  const quote = (j) => `sufra.iqaa.app/q/${j.code.slice(-4)}`;   // order.js's rule for a client's link
  const deliverer = (J.station('deliver').st.steps.find((x) => x.kind === 'struck') || {}).who || '';
  // a message written in for one order, as HTML: its words in the page's language (sufra.js keeps them in English,
  // with their placeholders), then the order's own. The line's reminder uses Build's variables ({client.name}…), as
  // jobs.js fill() does: the order in a sentence takes a small first letter.
  function fill(words, j) {
    const client = esc(T(short(j.client))), due = esc(V.due(j)), link = bdi(quote(j));
    const v = { org: esc(T(orgName())), client, title: esc(T(j.title)), people: String(j.people), due, time: V.hm(j.iso), link, deliverer: esc(T(deliverer)),
      'client.name': client, 'order.title': esc(lcFirst(T(j.title))), 'order.people': String(j.people), 'order.due': due, 'quote.link': link };
    return esc(T(words)).replace(/\{([\w.]+)\}/g, (m, k) => (k in v ? v[k] : m));
  }
  let pick = 'Send the quote link', view = 'email';

  // ---------- notes: what changed, in its row, with Undo for 8 s; the timer pauses while pointer or focus is in it ----------
  const live$ = $('[data-live]');
  const say = (t) => { live$.textContent = ''; requestAnimationFrame(() => { live$.textContent = t; }); };
  function addNote(n) {
    const old = notes[n.at];
    if (old) clearTimeout(old.timer);
    notes[n.at] = Object.assign({ left: NOTE_MS, ptr: false, foc: false }, n);
    arm(n.at);
  }
  function arm(at) {
    const n = notes[at];
    clearTimeout(n.timer);
    n.since = Date.now();
    n.timer = setTimeout(() => expire(at), n.left);
  }
  function hold(at, how, on) {
    const n = notes[at];
    if (!n) return;
    const was = n.ptr || n.foc;
    n[how] = on;
    if (!was && (n.ptr || n.foc)) { clearTimeout(n.timer); n.left = Math.max(1000, n.left - (Date.now() - n.since)); }
    if (was && !n.ptr && !n.foc) arm(at);
  }
  function expire(at) {
    delete notes[at];
    const gh = $(`[data-ghost="${at}"]`), el = $(`[data-note="${at}"]`);
    ghosts = ghosts.filter((x) => x.at !== at);
    if (gh) {
      const ul = gh.parentElement;
      gh.remove();
      if (ul && !ul.children.length) ul.outerHTML = noInvites();
    } else if (el) el.remove();
    sweep();
  }
  const noteHtml = (at) => {
    const n = notes[at];
    return n ? `<p class="se-note" data-note="${at}">${g('struck')}<span>${n.html}</span>${n.undo ? `<button class="se-tb" type="button" data-undo="${at}">${T('Undo')}</button>` : ''}</p>` : '';
  };
  function undo(at) {
    const n = notes[at];
    if (!n || !n.undo) return;
    clearTimeout(n.timer);
    delete notes[at];
    ghosts = ghosts.filter((x) => x.at !== at);
    const focus = n.undo();
    renderAll();
    sweep();
    say(T('Taken back.'));
    const el = focus && $(focus, root);
    if (el) el.focus();
  }
  // a logo's object URL lives while a state, an editor or an Undo still holds it
  function sweep() {
    const held = new Set([savedLogo(), ed.logo && ed.logo.v.file].filter(Boolean).map((l) => l.url));
    Object.values(notes).forEach((n) => (n.holds || []).forEach((u) => held.add(u)));
    urls.forEach((u) => { if (!held.has(u)) { URL.revokeObjectURL(u); urls.delete(u); } });
  }
  // after a save: the pen writes the note's loop in a quarter beat (reduced motion: it is simply there)
  const pen = (at) => { const el = $(`[data-note="${at}"] .se-g`); if (el) Beats.write(el, { each: M.quarter, gap: 0 }); };

  // ---------- editors: opened by a row's action, typed into, saved or cancelled ----------
  const EDS = {};
  const def = (id) => (id.startsWith('p-') ? personEd(id.slice(2)) : EDS[id]);
  const areaOf = (id) => (id === 'logo' ? 'organization' : def(id).area);
  function val(id, k) { const t = typed(id, k); return t != null ? t : String(def(id).saved()[k] == null ? '' : def(id).saved()[k]); }
  function values(id) { const s = def(id).saved(), out = {}; Object.keys(s).forEach((k) => { out[k] = val(id, k); }); return out; }
  function dirty(id) {
    const e = ed[id];
    if (!e) return false;
    if (id === 'logo') return !!e.v.file || (e.v.choice != null && e.v.choice !== state.org.mark);
    const s = def(id).saved();
    return Object.keys(e.v).some((k) => String(e.v[k]) !== String(s[k] == null ? '' : s[k]));
  }
  const areaDirty = (a) => Object.keys(ed).some((id) => areaOf(id) === a && dirty(id));
  // the row's own action: a disclosure for its editor; members see none
  const action = (id, word, full, o) => (owner ? `<button class="${(o && o.cls) || 'se-tb'}" type="button" data-open="${id}" aria-expanded="${!!ed[id]}" aria-controls="ed-${id}">${ico((o && o.icon) || 'Draft', (o && o.cls) ? 18 : 16)}<span>${named(word, full)}</span></button>` : '');
  function field(id, k, label, o) {
    const f = `${id}-${k}`, v = val(id, k), err = ed[id].err[k], opt = o || {};
    const desc = [opt.hint ? `${f}-hint` : '', `${f}-err`].filter(Boolean).join(' ');
    const attrs = `id="${f}" data-k="${k}" aria-describedby="${desc}"${err ? ' aria-invalid="true"' : ''}`;
    // a select's options: [value, the words shown, their language]; emails, numbers and times read left to right
    const input = opt.select
      ? `<select ${attrs}>${opt.select.map(([z, n, l]) => `<option value="${esc(z)}"${l ? ` lang="${l}"` : ''}${z === v ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>`
      : `<input ${attrs} type="${opt.type || 'text'}"${/^(email|tel|time)$/.test(opt.type) ? ' dir="ltr"' : ''} value="${esc(v)}"${opt.max ? ` maxlength="${opt.max}"` : ''}${opt.mode ? ` inputmode="${opt.mode}"` : ''}${opt.ph ? ` placeholder="${esc(opt.ph)}"` : ''} autocomplete="${opt.auto || 'off'}" spellcheck="false">`;
    return `<div class="field"><label for="${f}">${label}</label>${input}${opt.hint ? `<p class="hint" id="${f}-hint">${opt.hint}</p>` : ''}<p class="err" id="${f}-err"${err ? '' : ' hidden'}>${esc(err || '')}</p></div>`;
  }
  function radios(id, k, legend, opts) {
    const v = val(id, k);
    return `<fieldset class="se-rad"><legend>${legend}</legend>${opts.map(([o, n, d]) => `<label class="se-rd"><input type="radio" name="${id}-${k}" value="${o}" data-k="${k}"${o === v ? ' checked' : ''}><b>${n}</b>${d ? `<span>${d}</span>` : ''}</label>`).join('')}</fieldset>`;
  }
  // Cancel, then Save in violet: a person decides. 'Not saved yet' shows once a value differs.
  function form(id, inner, save, label) {
    return `<form class="se-ed" id="ed-${id}" data-ed="${id}" novalidate aria-label="${esc(label)}">${inner}
<div class="se-efoot"><p class="se-uns" data-uns${dirty(id) ? '' : ' hidden'}>${g('struck', { test: true })}<span>${T('Not saved yet')}</span></p>
<div class="row-act"><button class="btn" type="button" data-cancel>${T('Cancel')}</button><button class="btn primary" type="submit">${save}</button></div></div></form>`;
  }
  const editor = (id) => (ed[id] && id !== 'logo' ? def(id).form() : '');
  function openEd(id) {
    if (ed[id]) { if (dirty(id)) focusFirst(id); else cancel(id); return; }
    // another editor in the area closes, unless it holds changes
    Object.keys(ed).forEach((o) => { if (o !== 'logo' && areaOf(o) === areaOf(id) && !dirty(o)) delete ed[o]; });
    ed[id] = { v: {}, err: {} };
    renderArea(areaOf(id));
    renderNav();
    focusFirst(id);
  }
  // a select is drawn as the house's dropdown (ui.js) at once, so its button takes the focus and its field's hint
  function dropdowns(el) {
    if (!window.UI) return;
    $$('select', el).forEach((sel) => {
      UI.dropdown(sel);
      const b = sel.parentElement.querySelector('.dd-b');
      if (b && sel.getAttribute('aria-describedby')) b.setAttribute('aria-describedby', sel.getAttribute('aria-describedby'));
    });
  }
  const focusField = (el) => ((el.tagName === 'SELECT' && el.parentElement.querySelector('.dd-b')) || el).focus();
  function focusFirst(id) {
    const f = $(`#ed-${id}`);
    const el = f && ($('input:not([type="radio"]), select', f) || $('input[type="radio"]:checked', f));
    if (el) focusField(el);
  }
  function cancel(id) {
    if (!ed[id]) return;
    const a = areaOf(id);
    delete ed[id];
    sweep();
    renderArea(a);
    renderNav();
    if (id === 'logo') { const r = $('[data-k="choice"]:checked', root); if (r) r.focus(); return; }
    const b = $(`[data-open="${id}"]`, root);
    if (b) b.focus();
  }
  function save(id) {
    const d = def(id), v = values(id), err = d.check(v);
    ed[id].err = err;
    const bad = Object.keys(err).find((k) => err[k]);
    if (bad) {
      renderArea(d.area);
      const el = $(`#${id}-${bad}`);
      if (el) focusField(el);
      return;
    }
    const r = d.apply(v);
    delete ed[id];
    if (r) addNote(r);
    renderAll();
    sweep();
    if (r) { pen(r.at); if (r.after) r.after(); if (r.say) say(r.say); }
    const el = $((r && r.focus) || `[data-open="${id}"]`, root);
    if (el) el.focus();
  }

  // ---------- Team ----------
  const ROLES = [['owner', T('Owner'), T('Changes, tests and publishes the line, invites people, changes these settings and sees billing.')],
    ['member', T('Member'), T('Does the steps the line gives them, and sees every order and client.')]];
  // what a save says about a person: their new role, their new access, or both
  const SAVED = { role: 'Saved: {name} now does ‘{role}’.', owner: 'Saved: {name} is an owner now.', member: 'Saved: {name} is a member now.',
    'role owner': 'Saved: {name} now does ‘{role}’ and is an owner now.', 'role member': 'Saved: {name} now does ‘{role}’ and is a member now.' };
  function personEd(k) {
    const p = () => state.people.find((y) => y.k === k);
    const id = `p-${k}`;
    return {
      area: 'team',
      saved: () => ({ role: T(p().role), access: p().access }),
      check: (v) => (v.role.trim() ? {} : { role: T('Write what they do, in a few words.') }),
      apply(v) {
        const person = p(), was = { role: person.role, access: person.access }, role = keep(v.role.trim(), was.role);
        const key = SAVED[[role !== was.role ? 'role' : '', v.access !== was.access ? v.access : ''].filter(Boolean).join(' ')];
        if (!key) return null;
        person.role = role;
        person.access = v.access;
        return { at: id, html: T(key, { name: bdi(T(person.name)), role: esc(T(role)) }), say: T(key, { name: T(person.name), role: T(role) }),
          undo: () => { const q = p(); if (q) Object.assign(q, was); return `[data-open="${id}"]`; } };
      },
      form() {
        const person = p(), you = k === viewerKey, st = stepsOf(person.name), w = waitingOn(person.name), name = T(person.name);
        const role = you ? `<div class="se-rad"><p class="se-rl">${T('Role')}</p><p class="se-cap">${T('Owner. Another owner can change your role.')}</p></div>` : radios(id, 'access', T('Role'), ROLES);
        const now = (x) => { const js = waitingOn(person.name, x); return js.length ? `<span class="se-now">${T('Now: {jobs}', { jobs: js.map((j) => `<a href="order.html?code=${j.code}">${esc(T(j.title))}</a> <code>${j.code}</code>`).join(T(', ')) })}</span>` : ''; };
        const steps = st.length
          ? `<ul class="se-steps">${st.map((s) => `<li>${g(s.x.kind, { big: true })}<span><span>${esc(stepName(s.x))} <em>· ${esc(T(s.st.name))}</em></span>${now(s.x)}</span></li>`).join('')}</ul>`
          : `<p class="se-cap">${T('No steps on the line yet.')}</p>`;
        // the guard: someone the line still gives steps, or something waits on, stays until the Line says otherwise
        const blocked = st.length > 0 || w.length > 0;
        const does = { name: esc(name), steps: N(st.length, '{n} step', '{n} steps'), stations: esc(both(stationsOf(person.name).map(T))) };
        const why = !blocked ? '' : `${w.length ? N(w.length, '{name} does {steps} at {stations}, and {n} job waits on {name} now.', '{name} does {steps} at {stations}, and {n} jobs wait on {name} now.', does)
          : T('{name} does {steps} at {stations}.', does)} ${N(st.length, 'Give this step to someone else <a href="line.html">on the Line</a> first.', 'Give these steps to someone else <a href="line.html">on the Line</a> first.')}`;
        const guard = you ? '' : `<div class="se-guard"><button class="se-tb" type="button" data-remove="${k}"${blocked ? ` aria-disabled="true" aria-describedby="rm-${k}"` : ''}>${ico('Discard', 16)}<span>${T('Remove {name} from {org}', { name: bdi(name), org: bdi(T(state.org.name)) })}</span></button>${blocked ? `<p id="rm-${k}">${why}</p>` : ''}</div>`;
        return form(id, `<div class="se-ped"><div class="se-ef">${field(id, 'role', T('What they do'), { max: 40, hint: T('Shown beside their name on Overview and Today.') })}${role}</div>
<div class="se-ef"><h3>${T('Their steps on the line')}</h3>${steps}<p class="se-cap"><a href="line.html">${T('Change who does a step, on the Line')}</a></p>${guard}</div></div>`, T('Save'), T('Edit {name}', { name }));
      },
    };
  }
  EDS.invite = {
    area: 'team',
    saved: () => ({ name: '', email: '', role: '', access: 'member' }),
    check(v) {
      const e = {}, mail = v.email.trim().toLowerCase();
      if (!v.name.trim()) e.name = T('Write their name.');
      if (!mail) e.email = T('Enter their work email.');
      else if (!EMAIL.test(mail)) e.email = T(BAD_EMAIL);
      else {
        const p = state.people.find((y) => y.email.toLowerCase() === mail), i = state.invites.find((y) => y.email.toLowerCase() === mail);
        if (p) e.email = T('{email} already belongs to {name}.', { email: mail, name: T(p.name) });
        else if (i) e.email = T('{name} already has an invitation from {day}. Send it again instead.', { name: T(i.name), day: V.day(i.sent) });
      }
      return e;
    },
    apply(v) {
      const inv = { id: `v${++seq}`, name: v.name.trim(), email: v.email.trim(), role: v.role.trim(), access: v.access, sent: V.iso(V.now()), by: viewer.name, fresh: 'new' };
      state.invites.push(inv);
      return { at: `i-${inv.id}`, html: T('Invitation to {name} is ready. In this prototype nothing is sent.', { name: bdi(T(inv.name)) }), say: T('Invitation to {name} is ready.', { name: T(inv.name) }),
        focus: '[data-open="invite"]', after: () => writeInvite(inv.id),
        undo: () => { state.invites = state.invites.filter((y) => y.id !== inv.id); return '[data-open="invite"]'; } };
    },
    form() {
      const org = bdi(T(state.org.name));
      return form('invite', `<h3>${T('Invite someone to {org}', { org })}</h3>
<div class="se-fields">${field('invite', 'name', T('Name'), { max: 40, auto: 'off' })}${field('invite', 'email', T('Work email'), { type: 'email', mode: 'email' })}${field('invite', 'role', T('What they do'), { max: 40, ph: T('For example: kitchen, delivery') })}</div>
${radios('invite', 'access', T('Role'), ROLES)}
<p class="hint">${T('Iqaa emails them a link to join {org}. It works for seven days.', { org })} ${T('Once they join, they choose their own language for Iqaa with the language switch.')}</p>`, `${ico('Email', 18)}<span>${T('Send the invitation')}</span>`, T('Invite someone'));
    },
  };
  // the pen writes a new invitation: Iqaa's straight, then the arch that waits for the person, a quarter beat each
  const writeInvite = (vid) => { const el = $(`[data-row="i-${vid}"] .se-inv`); if (el) Beats.write(el, { each: M.quarter, gap: M.quarter }); };
  const inviteLine = (accepted) => IQ.line([['run', accepted ? 'struck' : 'held']], { k: 0.75 });
  function personRow(p) {
    const id = `p-${p.k}`, st = stepsOf(p.name), w = waitingOn(p.name), you = p.k === viewerKey, name = T(p.name);
    const on = st.length
      ? `${flow(J.reach((s) => s.steps.some((x) => isPerson(x.kind) && x.who === p.name)))}<span>${esc(stationsOf(p.name).map(T).join(T(', ')))} · ${N(st.length, '{n} step', '{n} steps')}</span>`
      : `<p>${T('No steps on the line yet')} · <a href="line.html">${T('Give {name} a step on the Line', { name: bdi(name) })}</a></p>`;
    const wait = w.length
      ? `<a class="se-n" href="today.html?as=${p.k}" aria-label="${N(w.length, '{n} job waits on {name} now. Open {name}’s Today.', '{n} jobs wait on {name} now. Open {name}’s Today.', { name: esc(name) })}">${N(w.length, '{n} job', '{n} jobs', { n: `<span class="mono">${w.length}</span>` })}</a>`
      : `<span>${T('None now')}</span>`;
    return `<li data-row="${id}"><div class="se-pr">
<div class="se-who"><span class="me-av" aria-hidden="true">${esc(name.charAt(0))}</span><span><b>${bdi(name)}${you ? `<span> ${T('(you)')}</span>` : ''}</b><span class="se-sub">${esc(T(p.role))}</span><span class="se-sub">${esc(p.email)}</span></span></div>
<div class="se-on">${on}</div>
<div class="se-wait"><span class="sr">${T('Waiting now:')} </span>${wait}</div>
<div class="se-role"><span class="sr">${T('Role:')} </span>${p.access === 'owner' ? T('Owner') : T('Member')}</div>
<div class="se-pe">${action(id, word('Edit', 'Edit (a setting)'), T('Edit {name}', { name }))}</div>
</div>${editor(id)}${noteHtml(id)}</li>`;
  }
  function inviteRow(v) {
    const id = `i-${v.id}`, name = T(v.name), by = esc(T(v.by));
    const when = v.fresh === 'new' ? T('sent just now by {name}', { name: by }) : v.fresh === 'again' ? T('sent again just now by {name}', { name: by }) : T('sent {when} by {name}', { when: V.label(v.sent), name: by });
    const acts = owner ? `<div class="se-acts se-ia"><button class="se-tb" type="button" data-again="${v.id}">${ico('Retry', 16)}<span>${named(T('Send again'), T('Send again to {name}', { name }))}</span></button><button class="se-tb" type="button" data-drop="${v.id}">${ico('Discard', 16)}<span>${named(T('Cancel the invitation'), T('Cancel the invitation to {name}', { name }))}</span></button></div>` : '';
    return `<li data-row="${id}"><div class="se-pr inv">
<div class="se-who"><span class="se-ring" aria-hidden="true">${esc(name.charAt(0).toLocaleUpperCase(lang))}</span><span><b>${bdi(name)}</b>${v.role ? `<span class="se-sub">${esc(T(v.role))}</span>` : ''}<span class="se-sub">${esc(v.email)}</span></span></div>
<div class="se-on"><span class="se-inv" aria-hidden="true">${inviteLine(false)}</span><span>${T('Waiting for {name} to accept · {sent} · the link works until {day}', { name: bdi(name), sent: when, day: until(v.sent) })}</span></div>
<div class="se-wait"></div><div class="se-role"><span class="sr">${T('Role:')} </span>${v.access === 'owner' ? T('Owner') : T('Member')}</div><div class="se-pe"></div>${acts}
</div>${noteHtml(id)}</li>`;
  }
  const ghostRow = (gh) => `<li class="se-ghost" data-ghost="${gh.at}">${noteHtml(gh.at)}</li>`;
  const noInvites = () => `<p class="se-none">${ico('Invite')}<span>${T('No invitations out.')}</span></p>`;
  const withGhosts = (rows, list) => { ghosts.filter((x) => x.list === list).forEach((x) => rows.splice(Math.min(x.i, rows.length), 0, ghostRow(x))); return rows; };
  function renderTeam() {
    const s = $('[data-sec="team"]');
    $('[data-hact]', s).innerHTML = owner ? `<button class="btn primary" type="button" data-open="invite" aria-expanded="${!!ed.invite}" aria-controls="ed-invite">${ico('Invite')}<span>${T('Invite someone')}</span></button>` : '';
    const names = state.people.map((p) => p.name);
    const mine = PSTEPS.filter((y) => names.includes(y.x.who)).length, client = PSTEPS.filter((y) => y.x.who === 'The client').length, none = PSTEPS.length - mine - client;
    // the English sentence for these counts is the key
    const cover = none
      ? T(`Steps a person does on the line: {team} are the team’s, {client} ${client === 1 ? 'is' : 'are'} the client’s, and {none} ${none === 1 ? 'has' : 'have'} no one yet. Give ${none === 1 ? 'it' : 'them'} someone <a href="line.html">on the Line</a>.`, { team: mine, client, none })
      : T('Every step a person takes on the line has an owner: {team} on the team, {client} the client.', { team: mine, client });
    const invs = withGhosts(state.invites.map(inviteRow), 'invites');
    $('[data-in]', s).innerHTML = `<div class="se-team">${editor('invite')}
<p class="se-key" aria-hidden="true"><span>${T('Person')}</span><span>${T('On the line')}</span><span>${T('Waiting now')}</span><span>${T('Role')}</span></p>
<ul class="se-pl" aria-label="${T('People')}">${withGhosts(team().map(personRow), 'people').join('')}</ul>
<p class="se-cap se-cov">${cover}</p>
<h3 class="se-h3 inv">${ico('Invite')}<span>${T('Invited')}</span></h3>
${invs.length ? `<ul class="se-pl" aria-label="${T('Invited')}">${invs.join('')}</ul>` : noInvites()}</div>`;
    $('[data-accept]').hidden = !nour();
  }
  // Nour's side of her invitation, for the prototype: she accepts, and joins the team
  const nour = () => state.invites.find((v) => v.name === 'Nour' && !state.people.some((p) => p.k === 'nour'));
  async function accept() {
    const v = nour();
    if (!v) return;
    if (shown !== 'team') { history.pushState(null, '', `${location.pathname}${location.search}#team`); route(false); }
    $('[data-accept]').hidden = true;
    const el = $(`[data-row="i-${v.id}"] .se-inv`);
    if (el) {
      el.innerHTML = inviteLine(true);
      await Beats.write(el, { each: M.quarter, gap: M.quarter });
      await Beats.wait(M.half);
    }
    state.invites = state.invites.filter((y) => y !== v);
    state.people.push({ k: 'nour', name: v.name, role: v.role, email: v.email, access: v.access });
    renderAll();
    say(T('{name} joined {org}.', { name: T(v.name), org: T(state.org.name) }));
    const b = $('[data-open="p-nour"]', root) || $('#se-team-h');
    if (b) b.focus();
  }
  function remove(k) {
    const i = team().findIndex((p) => p.k === k), at = state.people.findIndex((p) => p.k === k), person = state.people[at], id = `p-${k}`;
    if (!person || stepsOf(person.name).length || waitingOn(person.name).length) return;
    state.people.splice(at, 1);
    delete ed[id];
    ghosts.push({ at: id, list: 'people', i });
    addNote({ at: id, html: T('{name} is no longer on {org}’s team.', { name: bdi(T(person.name)), org: bdi(T(state.org.name)) }), undo: () => { state.people.splice(Math.min(at, state.people.length), 0, person); return `[data-open="${id}"]`; } });
    renderAll();
    say(T('{name} is no longer on the team.', { name: T(person.name) }));
    $(`[data-undo="${id}"]`).focus();
  }
  function again(vid) {
    const v = state.invites.find((y) => y.id === vid), was = { sent: v.sent, fresh: v.fresh, by: v.by }, id = `i-${vid}`;
    Object.assign(v, { sent: V.iso(V.now()), fresh: 'again', by: viewer.name });
    addNote({ at: id, html: T('A new link for {name}, working until {day}. In this prototype nothing is sent.', { name: bdi(T(v.name)), day: until(v.sent) }), undo: () => { Object.assign(v, was); return `[data-again="${vid}"]`; } });
    renderAll();
    pen(id);
    writeInvite(vid);
    say(T('A new link for {name} is ready.', { name: T(v.name) }));
    $(`[data-again="${vid}"]`).focus();
  }
  function drop(vid) {
    const i = state.invites.findIndex((y) => y.id === vid), v = state.invites[i], id = `i-${vid}`;
    state.invites.splice(i, 1);
    ghosts.push({ at: id, list: 'invites', i });
    addNote({ at: id, html: T('{name}’s invitation is cancelled.', { name: bdi(T(v.name)) }), undo: () => { state.invites.splice(Math.min(i, state.invites.length), 0, v); return `[data-drop="${vid}"]`; } });
    renderAll();
    say(T('{name}’s invitation is cancelled.', { name: T(v.name) }));
    $(`[data-undo="${id}"]`).focus();
  }

  // ---------- Channels ----------
  const WAYS = { email: 'Email', whatsapp: 'WhatsApp', sms: 'SMS' };
  // a sentence about one way is keyed by its English with the way written in, so each language words each way
  const way = (k, words) => T(words.replace(/\{way\}/g, WAYS[k]));
  const onWays = () => Object.keys(WAYS).filter((k) => state.channels[k].on).map((k) => T(WAYS[k]));
  EDS.email = {
    area: 'channels',
    saved: () => ({ from: T(state.channels.email.from), replyTo: state.channels.email.replyTo }),
    check(v) {
      const e = {};
      if (!v.from.trim()) e.from = T('Clients need to see who writes. Write a sender name.');
      if (!v.replyTo.trim()) e.replyTo = T('Enter the address replies go to.');
      else if (!EMAIL.test(v.replyTo.trim())) e.replyTo = T(BAD_EMAIL);
      return e;
    },
    apply(v) {
      const c = state.channels.email, was = { from: c.from, replyTo: c.replyTo }, from = keep(v.from.trim(), was.from), to = v.replyTo.trim();
      const key = from !== was.from ? (to !== was.replyTo ? 'Saved: emails come from “{from}”, and replies go to {email}.' : 'Saved: emails come from “{from}”.')
        : to !== was.replyTo ? 'Saved: replies go to {email}.' : '';
      if (!key) return null;
      Object.assign(c, { from, replyTo: to });
      return { at: 'email', html: T(key, { from: esc(T(from)), email: bdi(to) }), say: T('Saved.'), undo: () => { Object.assign(c, was); return '[data-open="email"]'; } };
    },
    form() {
      return form('email', `<div class="se-fields">${field('email', 'from', T('Sender name'), { max: 40, hint: T('Clients see it as the sender.') })}${field('email', 'replyTo', T('Replies go to'), { type: 'email', mode: 'email', hint: T('Where a client’s reply lands.') })}</div>
<p class="se-fix">${RUNS}<span>${T('Every email ends with Runs on Iqaa, once, at the foot. This can’t be changed.')}</span></p>`, T('Save'), T('Edit email'));
    },
  };
  const connectEd = (k) => ({
    area: 'channels',
    saved: () => ({ number: state.channels[k].number }),
    check: (v) => (/^\+\d{8,15}$/.test(digits(v.number).replace(/\s/g, '')) ? {} : { number: T('Write the number with its country code, starting with +.') }),
    apply(v) {
      const c = state.channels[k], was = { on: c.on, number: c.number };
      Object.assign(c, { on: true, number: digits(v.number).trim() });
      return { at: k, html: way(k, '{way} is connected. In this prototype nothing is sent.'), say: way(k, '{way} is connected.'), focus: `[data-unplug="${k}"]`,
        undo: () => { Object.assign(c, was); return `[data-open="${k}"]`; } };
    },
    form() {
      const org = esc(T(state.org.name)), label = k === 'whatsapp' ? T('{org}’s WhatsApp Business number', { org }) : T('{org}’s number for SMS', { org });
      return form(k, field(k, 'number', label, { type: 'tel', mode: 'tel', ph: '+970 …', auto: 'tel', hint: T('With its country code, starting with +. In this prototype nothing is connected or sent.') }),
        `${ico('Link', 18)}<span>${T('Connect')}</span>`, way(k, 'Connect {way}'));
    },
  });
  EDS.whatsapp = connectEd('whatsapp');
  EDS.sms = connectEd('sms');
  function unplug(k) {
    const c = state.channels[k], was = { on: c.on, number: c.number };
    Object.assign(c, { on: false, number: '' });
    if (k === 'whatsapp') view = 'email';
    addNote({ at: k, html: way(k, '{way} is disconnected.'), undo: () => { Object.assign(c, was); return `[data-unplug="${k}"]`; } });
    renderAll();
    pen(k);
    say(way(k, '{way} is disconnected.'));
    $(`[data-open="${k}"]`).focus();
  }
  function wayRow(k, icon) {
    const c = state.channels[k], name = esc(T(state.org.name));
    let st, detail, act;
    if (k === 'email') {
      st = `<span class="se-st on">${T('On')}</span>`;
      detail = T('From “{from}” · replies go to {email} · every email ends with Runs on Iqaa', { from: bdi(T(sender())), email: bdi(c.replyTo) });
      act = action('email', word('Edit', 'Edit (a setting)'), T('Edit email'));
    } else if (c.on) {
      st = `<span class="se-st on">${T('Connected')}</span>`;
      detail = `<code>${esc(c.number)}</code> · ${way(k, 'No step sends by {way} yet: choose {way} for a message <a href="line.html">on the Line</a>.')}`;
      act = owner ? `<button class="se-tb" type="button" data-unplug="${k}">${ico('Discard', 16)}<span>${named(T('Disconnect'), way(k, 'Disconnect {way}'))}</span></button>` : '';
    } else {
      st = `<span class="se-st">${T('Not connected')}</span>`;
      detail = k === 'whatsapp' ? T('Messages would come from {org}’s own WhatsApp Business number, under {org}’s name and mark. Iqaa is not in the conversation.', { org: name }) : T('For clients with neither email nor WhatsApp.');
      act = action(k, way(k, 'Connect {way}'), '', { cls: 'btn', icon: 'Link' });
    }
    return `<li data-row="${k}"><div class="se-way"><div><p class="se-wn">${ico(icon)}<b>${T(WAYS[k])}</b>${st}</p><p class="se-wd">${detail}</p></div>${act ? `<div class="se-acts">${act}</div>` : ''}</div>${editor(k)}${noteHtml(k)}</li>`;
  }
  function msgRow(r) {
    const glyphs = `<span class="se-mg">${r.rest ? g('rest', { big: true }) : ''}${g('run', { big: true })}</span>`;
    // each event on its own line; a screen reader hears them apart
    const ev = events(r.x).map((e, i) => `${i ? '<span class="sr"> · </span>' : ''}<span>${esc(e).replace(/\b(\d\d:\d\d)\b/g, '<span class="mono">$1</span>')}</span>`).join('');
    if (r.m.to === 'team') {
      const who = (r.st.steps.find((x) => x.kind === 'struck') || {}).who || 'the team';
      return `<li><div class="se-msg">${glyphs}<span class="se-ms">${esc(T(r.x.name))}</span><span class="se-me">${ev}</span><span class="se-mm">${esc(T(r.st.name))} · ${T('to {who}, inside Iqaa', { who: esc(T(who)) })}</span></div></li>`;
    }
    // the wait and the way, each said whole: 'after a wait of two days', 'by email'
    const meta = [T(r.st.name), r.rest ? T(`after a wait of ${r.rest.who.toLowerCase()}`) : '', T('to the client'), T(`by ${(r.m.by || 'Email').toLowerCase()}`)].filter(Boolean).join(' · ');
    return `<li><button type="button" class="se-msg" data-pick="${esc(r.x.name)}" aria-pressed="${pick === r.x.name}">${glyphs}<span class="se-ms">${esc(T(r.x.name))}</span><span class="se-me">${ev}</span><span class="se-mm">${esc(meta)}</span></button></li>`;
  }
  function renderChannels() {
    const s = $('[data-sec="channels"]'), org = bdi(T(state.org.name));
    $('[data-in]', s).innerHTML = `<div class="se-ch"><div class="se-chl">
<h3 class="se-h3">${ico('Link')}<span>${T('Ways to reach clients')}</span></h3>
<ul class="se-ways">${wayRow('email', 'Email')}${wayRow('whatsapp', 'Phone')}${wayRow('sms', 'Message')}</ul>
<h3 class="se-h3">${ico('Line')}<span>${T('Messages on the line')}</span></h3>
<p class="se-cap">${T('The steps of {org}’s line (version {version}) that send something, in the order a job meets them. Which way each one goes is part of the line: <a href="line.html">change it on the Line</a>, then publish a new version.', { org, version: S.version })}</p>
<ul class="se-msgs">${MSG.map(msgRow).join('')}</ul>
<p class="se-cap">${T('Messages to the team arrive inside Iqaa, on Today. {org}’s channels are for its clients.', { org })}</p>
</div>
<div class="se-pvc"><h3 class="se-h3">${ico('Preview')}<span>${T('What the client gets')}</span></h3><div class="se-pv" role="region" aria-label="${T('Preview of the selected message')}" data-preview></div></div></div>`;
    renderPreview();
  }
  // the preview: the selected message filled from a real job, as an email, or as a chat once WhatsApp is connected
  function renderPreview() {
    const el = $('[data-preview]');
    if (!el) return;
    const r = MSG.find((y) => y.x.name === pick), { j, t, cap } = jobFor(r.x), m = r.m;
    const body = fill(r.x.msg || m.body || '', j), wa = state.channels.whatsapp.on;
    if (!wa) view = 'email';
    const to = T('to {client}', { client: /^a /.test(j.of) ? T(j.client) : T('{client}, {of}', { client: T(j.client), of: T(j.of) }) });
    const sw = wa ? `<div class="se-sw" role="group" aria-label="${T('Show it as')}">${[['email', 'Email', 'Email'], ['whatsapp', 'WhatsApp', 'Phone']].map(([v, n, i]) => `<button type="button" data-view="${v}" aria-pressed="${view === v}">${ico(i, 16)}<span>${T(n)}</span></button>`).join('')}</div>` : '';
    const mail = `<div class="se-mail"><div class="se-mh"><span class="se-sm">${markHtml(28)}</span><span><b>${bdi(T(sender()))}</b><small>${esc(to)}</small></span></div>
<div class="se-mb"><p class="se-sj">${fill(m.subject || '', j)}</p><p>${body}</p>${m.button ? `<div class="se-lk"><a class="se-fbtn" href="quote.html?q=${j.code.slice(-4)}">${esc(T(m.button))}</a><code>${quote(j)}</code></div>` : ''}
<p class="se-ol">${T('Order {code} · {due} · {people}', { code: `<code>${j.code}</code>`, due: esc(V.due(j)), people: N(j.people, '{n} person', '{n} people') })}</p></div>
<div class="se-mf">${RUNS}<span>${T('You receive this because {org} is preparing your order.', { org: bdi(T(orgName())) })}</span></div></div>`;
    const chat = `<div class="se-chat"><div class="se-ct"><span class="se-sm se-circ">${markHtml(28)}</span><span><b>${bdi(T(orgName()))}</b><small>${T('Business account')}</small></span></div>
<div class="se-bub"><p>${body}</p>${m.link && !r.x.msg ? `<code>${quote(j)}</code>` : ''}<time>${t}</time></div></div>`;
    el.innerHTML = `${sw}${view === 'whatsapp' ? chat : mail}<p class="se-cap">${T('Filled from {title} ({code}).', { title: esc(T(j.title)), code: `<code>${j.code}</code>` })} ${esc(cap)}</p>`;
  }

  // ---------- Organization ----------
  const ZONES = ['Asia/Hebron', 'Asia/Gaza', 'Asia/Jerusalem', 'Asia/Amman', 'Africa/Cairo', 'Europe/Istanbul', 'Asia/Riyadh', 'Asia/Dubai', 'Europe/London', 'UTC'];
  // the demo's moment, 09:41 in Hebron, as an instant; the clock runs on from it as Today's does
  const INSTANT = Date.UTC(2026, 10, 1, 7, 41);
  const nowIn = (zone) => { try { return new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit' }).format(INSTANT + (V.now() - msOf(S.now))); } catch (e) { return V.hm(V.now()); } };
  const AN = /^[AEFHILMNORSX8]$|^1[18]/;   // letters and figures said with a vowel first: an L, an S, an 8
  EDS.name = {
    area: 'organization',
    saved: () => ({ name: T(state.org.name) }),
    check: (v) => (v.name.trim().length < 2 ? { name: T('Name your organization.') } : {}),
    apply(v) {
      const was = state.org.name, name = keep(v.name.trim(), was), from = state.channels.email.from;
      if (name === was) return null;
      const a = initialOf(was), b = initialOf(name);
      state.org.name = name;
      if (from === was) state.channels.email.from = name;
      renameAll(name);
      const words = savedLogo() ? T('The logo stays.') : a === b ? T('The mark keeps its {letter}.', { letter: esc(b) }) : T(AN.test(b) ? 'The mark is now an {letter}.' : 'The mark is now a {letter}.', { letter: esc(b) });
      return { at: 'name', html: `${T('Renamed to {name}.', { name: bdi(T(name)) })} ${words}`, say: T('Renamed to {name}.', { name: T(name) }), after: () => { if (a !== b && !savedLogo()) signSidebar(true); },
        undo: () => { state.org.name = was; state.channels.email.from = from; renameAll(was); return '[data-open="name"]'; } };
    },
    form: () => form('name', field('name', 'name', T('Name'), { max: 28, auto: 'organization' }), T('Save'), T('Change the name')),
  };
  EDS.hours = {
    area: 'organization',
    saved: () => ({ opens: state.org.opens, closes: state.org.closes }),
    check: (v) => (!v.opens || !v.closes || v.closes <= v.opens ? { closes: T('Closing time must come after opening time.') } : {}),
    apply(v) {
      const o = state.org, was = { opens: o.opens, closes: o.closes };
      if (v.opens === was.opens && v.closes === was.closes) return null;
      Object.assign(o, { opens: v.opens, closes: v.closes });
      return { at: 'hours', html: T('Working hours set to {opens} to {closes}. The other screens of this prototype keep their own.', { opens: `<span class="mono">${v.opens}</span>`, closes: `<span class="mono">${v.closes}</span>` }),
        say: T('Working hours set to {opens} to {closes}.', { opens: v.opens, closes: v.closes }), undo: () => { Object.assign(o, was); return '[data-open="hours"]'; } };
    },
    form: () => form('hours', `<div class="se-two">${field('hours', 'opens', T('Opens'), { type: 'time' })}${field('hours', 'closes', T('Closes'), { type: 'time' })}</div>`, T('Save'), T('Change the working hours')),
  };
  EDS.zone = {
    area: 'organization',
    saved: () => ({ zone: state.org.zone }),
    check: () => ({}),
    apply(v) {
      const was = state.org.zone;
      if (v.zone === was) return null;
      state.org.zone = v.zone;
      return { at: 'zone', html: T('Time zone set to {zone}.', { zone: esc(T(v.zone)) }), say: T('Time zone set to {zone}.', { zone: T(v.zone) }), undo: () => { state.org.zone = was; return '[data-open="zone"]'; } };
    },
    form: () => form('zone', field('zone', 'zone', T('Time zone'), { select: ZONES.map((z) => [z, T(z)]) }), T('Save'), T('Change the time zone')),
  };
  // the language Sufra writes to its clients in: its messages and the pages their links open. The editor names each
  // language in its own words, as the language switch does; each person's own language for Iqaa is that switch
  const CLIENT_LANGS = [['English', 'English', 'en'], ['Arabic', 'العربية', 'ar'], ['Turkish', 'Türkçe', 'tr']];
  EDS.language = {
    area: 'organization',
    saved: () => ({ language: state.org.clientLanguage }),
    check: () => ({}),
    apply(v) {
      const o = state.org, was = o.clientLanguage;
      if (v.language === was) return null;
      o.clientLanguage = v.language;
      return { at: 'language', html: T('Clients now read {org} in {language}. In this prototype nothing is sent.', { org: bdi(T(o.name)), language: esc(T(v.language)) }),
        say: T('Clients now read {org} in {language}.', { org: T(o.name), language: T(v.language) }), undo: () => { o.clientLanguage = was; return '[data-open="language"]'; } };
    },
    form: () => form('language', field('language', 'language', T('Clients read {org} in', { org: bdi(T(state.org.name)) }), { select: CLIENT_LANGS }), T('Save'), T('Change the clients’ language')),
  };
  // a setting row: its label, value and hint, one action at the end; its editor and its note under it
  const row = (id, icon, label, value, hint, act) => `<li data-row="${id}"><div class="se-row"><div class="se-rt"><p class="se-rl">${ico(icon, 16)}<span>${label}</span></p><p class="se-rv">${value}</p>${hint ? `<p class="se-rh">${hint}</p>` : ''}</div>${act || ''}</div>${editor(id)}${noteHtml(id)}</li>`;
  function renderOrg() {
    const o = state.org, s = $('[data-sec="organization"]'), name = bdi(T(o.name)), change = T('Change');
    $('[data-in]', s).innerHTML = `<div class="se-org"><ul class="se-rows">
${row('name', 'Company', T('Name'), name, T('Clients see it on every message and link. About 17 letters fit on one line in the sidebar.'), action('name', change, T('Change the name')))}
${row('address', 'Link', T('Address'), `<code>${esc(o.address)}</code>`, T('It is in every link already sent to clients, like {link}, so it stays when the name changes.', { link: `<code>${esc(o.address)}/q/0030</code>` }))}
${row('field', 'Line', word('Field', 'Field (of work)'), esc(T(o.field)), T('Chosen at sign-up. {org}’s line started from the {field} template and is its own now; change it <a href="line.html">on the Line</a>.', { org: name, field: esc(T(o.field)) }))}
${row('hours', 'Late', T('Working hours'), T('Every day, {opens} to {closes}', { opens: `<span class="mono">${o.opens}</span>`, closes: `<span class="mono">${o.closes}</span>` }), T('The team’s day on Today and Overview, and each order’s times, are drawn on these hours.'), action('hours', change, T('Change the working hours')))}
${row('zone', 'HTTP', T('Time zone'), T('{zone} · now {time}', { zone: esc(T(o.zone)), time: `<span class="mono">${nowIn(o.zone)}</span>` }), T('Every time on every screen uses it.'), action('zone', change, T('Change the time zone')))}
${row('language', 'Language', T('Clients read {org} in', { org: name }), esc(T(o.clientLanguage)), T('Every message, and the page each link opens.'), action('language', change, T('Change the clients’ language')))}
</ul><div class="se-mk" data-mark></div><div class="se-wh" data-where></div></div>`;
    renderMark();
    renderWhere();
  }
  // the colour words for an opening: half and half, thirds, or one colour
  function colours(steps) {
    const n = steps.length, p = steps.filter((x) => isPerson(x.kind)).length;
    if (!p) return T('in white');
    if (p === n) return T('in lilac');
    if (n === 2) return T('half lilac, half white');
    if (n === 3) return T(p === 1 ? 'one third lilac, two thirds white' : 'two thirds lilac, one third white');
    return T('{p} parts lilac, {w} white', { p, w: n - p });
  }
  let plateCh = null;
  function renderMark() {
    const el = $('[data-mark]');
    if (!el) return;
    const name = orgName(), ch = initialOf(name), logo = shownLogo(), L = ed.logo, choice = (L && L.v.choice) || state.org.mark;
    const preview = dirty('name') || dirty('logo');
    // the opening said step by step: 'Reem logs the order, a person’s step, then Send the client a receipt, …'
    const what = opening.map((x, i) => T(i ? (isPerson(x.kind) ? 'then {step}, a person’s step' : 'then {step}, which runs by itself') : (isPerson(x.kind) ? '{step}, a person’s step' : '{step}, which runs by itself'), { step: esc(T(x.name)) })).join(T(', '));
    const org = bdi(T(name)), see = `<a href="line.html">${T('See the line')}</a>`;
    let cap;
    if (logo) cap = T('{org}’s own logo, on a white tile the shape of the mark’s, so the sidebar keeps its outline.', { org });
    else if (written(ch)) cap = `${T('{org}’s line opens with {what}. So the {letter} is written {colours}. Publish a line that opens differently and the {letter} is written again.', { org, what, letter: esc(ch), colours: colours(opening) })} ${see}`;
    else cap = `${T('{org}’s line opens with {what}. So the {letter} is set {colour}, the colour of its first step. Iqaa’s hand writes A to Z and 0 to 9 so far, so {letter} is set in type until it is drawn.', { org, what, letter: bdi(ch), colour: T(isPerson(opening[0].kind) ? 'in lilac' : 'in white') })} ${see}`;
    const legend = logo ? '' : `<ul class="se-op">${opening.map((x) => `<li>${g(x.kind, { pal: 'dark' })}<span><b>${esc(T(x.name))}</b><small>${T(isPerson(x.kind) ? 'a person' : 'runs by itself')}</small></span></li>`).join('')}</ul>`;
    let chooser = '';
    if (owner) {
      const v = choice, file = L && L.v.file, err = L && L.err.file, warn = L && L.warn;
      const radio = (o, n) => `<label class="se-rd"><input type="radio" name="logo-choice" value="${o}" data-k="choice"${o === v ? ' checked' : ''}><b>${n}</b></label>`;
      let picker = '';
      if (v === 'logo') {
        const size = file ? `<p class="se-cap">${bdi(file.name)} · ${file.w ? T('{w} × {h} px', { w: file.w, h: file.h }) : T('a drawing with no size of its own')}</p>` : '';
        const btns = file ? `<div class="row-act"><button class="btn" type="button" data-cancel>${T('Cancel')}</button><button class="btn primary" type="button" data-use-logo>${T('Use this logo')}</button></div>`
          : savedLogo() ? `<button class="se-tb" type="button" data-use-initial>${ico('Discard', 16)}<span>${T('Remove the logo')}</span></button>` : (L && v !== state.org.mark ? `<div class="row-act"><button class="btn" type="button" data-cancel>${T('Cancel')}</button></div>` : '');
        picker = `<div class="se-file"><input type="file" id="se-logo-f" accept="image/png,image/jpeg,image/svg+xml" aria-describedby="se-logo-h se-logo-err se-logo-w"><label class="btn" for="se-logo-f">${ico('Image')}<span>${file || savedLogo() ? T('Choose another file') : T('Choose a logo file')}</span></label>
<p class="hint" id="se-logo-h">${T('A square PNG, JPG or SVG, at least 192 px: twice the largest size Iqaa shows a mark. It stays in this browser tab; nothing is uploaded.')}</p>
<p class="err" id="se-logo-err"${err ? '' : ' hidden'}>${esc(err || '')}</p><p class="se-cap" id="se-logo-w"${warn ? '' : ' hidden'}>${esc(warn || '')}</p>${size}${btns}</div>`;
      } else if (savedLogo()) {
        picker = `<div class="row-act"><button class="btn" type="button" data-cancel>${T('Cancel')}</button><button class="btn primary" type="button" data-use-initial>${T('Use the initial')}</button></div>`;
      }
      chooser = `<div class="se-lgo" data-ed="logo"><fieldset class="se-rad"><legend>${T('{org} signs with', { org })}</legend>${radio('initial', T('Its initial, signed from its line'))}${radio('logo', T('Its own logo'))}</fieldset>${picker}</div>`;
    } else {
      chooser = `<p class="se-cap">${T(state.org.mark === 'logo' ? '{org} signs with its own logo.' : '{org} signs with its initial, signed from its line.', { org })}</p>`;
    }
    el.innerHTML = `<h3 class="se-h3">${ico('Mark')}<span>${T('{org}’s mark', { org })}</span></h3>${preview ? `<p class="se-uns">${g('struck', { test: true })}<span>${T('Preview: not saved yet')}</span></p>` : ''}
${chooser}<div class="se-plate"><span class="se-pm">${markHtml(96, { alt: T('{org}’s logo, preview', { org: T(name) }), label: T('{org}’s mark', { org: T(name) }) })}</span>${legend}</div>${noteHtml('logo')}
<p class="se-cap">${cap}</p>`;
    // the pen writes the initial again only when the first letter changes
    if (plateCh != null && ch !== plateCh && !logo) Beats.write($('.se-pm', el), { each: M.quarter });
    plateCh = ch;
  }
  function renderWhere() {
    const el = $('[data-where]');
    if (!el) return;
    const name = esc(T(orgName())), wa = state.channels.whatsapp.on;
    const fig = (snip, cap) => `<figure class="se-fig">${snip}<figcaption>${cap}</figcaption></figure>`;
    el.innerHTML = `<h3 class="se-h3">${ico('Place')}<span>${T('Where it appears')}</span></h3>
<p class="se-wg">${T('Your team sees it')}</p>
${fig(`<div class="se-snip side" aria-hidden="true"><span class="se-sm">${markHtml(32)}</span><span><b>${name}</b><small>${esc(state.org.address)}</small></span>${ico('Switch', 16)}</div>`, T('Sidebar · 32 px'))}
${fig(`<div class="se-snip" aria-hidden="true"><span class="se-sm">${markHtml(40)}</span><span><b>${name}</b><small>${esc(state.org.address)}</small></span></div>`, T('Sign-in · 40 px'))}
<p class="se-wg">${T('Clients see it')}</p>
${fig(`<div class="se-snip quote" aria-hidden="true"><span class="se-sm">${markHtml(28)}</span><b>${name}</b></div>`, T('Quote page · 28 px'))}
${fig(`<div class="se-snip mail" aria-hidden="true"><div class="se-smh"><span class="se-sm">${markHtml(28)}</span><b>${esc(T(sender()))}</b></div><div class="se-smf">${RUNS}</div></div>`, T('Email · 28 px, with Runs on Iqaa at the foot'))}
${fig(`<div class="se-snip wa${wa ? '' : ' off'}" aria-hidden="true"><span class="se-sm se-circ">${markHtml(28)}</span><span><b>${name}</b><small>${T('Business account')}</small></span></div>`, T(wa ? 'WhatsApp · 28 px, cut to a circle' : 'WhatsApp · 28 px, cut to a circle · when WhatsApp is connected'))}`;
  }
  // a logo file: read into an <img> through an object URL only (an SVG is never put in the page as markup)
  function choose(file) {
    const L = ed.logo || (ed.logo = { v: { choice: 'logo' }, err: {} });
    L.err = {};
    L.warn = '';
    L.v.file = null;
    const done = () => { sweep(); renderMark(); renderWhere(); renderPreview(); renderNav(); const b = $('label[for="se-logo-f"]'); if (b) $('#se-logo-f').focus(); };
    if (!/^image\/(png|jpeg|svg\+xml)$/.test(file.type)) { L.err.file = T('Use a PNG, JPG or SVG file.'); done(); return; }
    const url = URL.createObjectURL(file), img = new Image(), svg = file.type === 'image/svg+xml';
    urls.add(url);
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      if (w && h) {
        if (!svg && Math.min(w, h) < 192) { L.err.file = T('This image is {w} × {h} px. Use one at least 192 px on each side.', { w, h }); done(); return; }
        const r = Math.max(w, h) / Math.min(w, h);
        if (r > 1.25) {
          L.warn = T(w > h ? 'This image is {w} × {h} px, {r} times wider than tall. In the 32 px square of the sidebar it would stand {px} px tall. A square version reads better.'
            : 'This image is {w} × {h} px, {r} times taller than wide. In the 32 px square of the sidebar it would stand {px} px wide. A square version reads better.', { w, h, r: +r.toFixed(1), px: Math.round(24 / r) });
        }
      }
      L.v.file = { url, w: w || 0, h: h || 0, type: file.type, name: file.name };
      done();
    };
    img.onerror = () => { L.err.file = T('Iqaa couldn’t read this file. Try another.'); done(); };
    img.src = url;
  }
  function useLogo() {
    const f = ed.logo && ed.logo.v.file;
    if (!f) return;
    const o = state.org, was = { mark: o.mark, logo: o.logo };
    Object.assign(o, { mark: 'logo', logo: f });
    delete ed.logo;
    addNote({ at: 'logo', html: T('{org}’s logo is in use on this page.', { org: bdi(T(o.name)) }), holds: [was.logo && was.logo.url].filter(Boolean),
      undo: () => { Object.assign(o, was); return '[data-k="choice"]:checked'; } });
    renderAll();
    sweep();
    pen('logo');
    say(T('{org}’s logo is in use.', { org: T(o.name) }));
    const r = $('[data-k="choice"]:checked', root);
    if (r) r.focus();
  }
  function useInitial() {
    const o = state.org, was = { mark: o.mark, logo: o.logo };
    Object.assign(o, { mark: 'initial', logo: null });
    delete ed.logo;
    addNote({ at: 'logo', html: T('Back to {org}’s initial.', { org: bdi(T(o.name)) }), holds: [was.logo && was.logo.url].filter(Boolean), undo: () => { Object.assign(o, was); return '[data-k="choice"]:checked'; } });
    renderAll();
    sweep();
    pen('logo');
    signSidebar(true);
    say(T('Back to {org}’s initial.', { org: T(o.name) }));
    const r = $('[data-k="choice"]:checked', root);
    if (r) r.focus();
  }

  // ---------- Billing ----------
  EDS.bmail = {
    area: 'billing',
    saved: () => ({ email: state.billing.email }),
    check(v) { const m = v.email.trim(); return !m ? { email: T('Enter the email Iqaa’s invoices go to.') } : EMAIL.test(m) ? {} : { email: T(BAD_EMAIL) }; },
    apply(v) {
      const b = state.billing, was = b.email, m = v.email.trim();
      if (m === was) return null;
      b.email = m;
      return { at: 'bmail', html: T('Invoices from Iqaa now go to {email}.', { email: bdi(m) }), say: T('Invoices from Iqaa now go to {email}.', { email: m }), undo: () => { b.email = was; return '[data-open="bmail"]'; } };
    },
    form: () => form('bmail', field('bmail', 'email', T('Invoices from Iqaa go to'), { type: 'email', mode: 'email', auto: 'email' }), T('Save'), T('Change where invoices go')),
  };
  EDS.bto = {
    area: 'billing',
    saved: () => ({ name: T(state.billing.billTo.name), address: T(state.billing.billTo.address) }),
    check(v) {
      const e = {};
      if (!v.name.trim()) e.name = T('Write the name Iqaa’s invoices are made out to.');
      if (!v.address.trim()) e.address = T('Write the address for the invoices.');
      return e;
    },
    apply(v) {
      const t = state.billing.billTo, was = clone(t), next = { name: keep(v.name.trim(), was.name), address: keep(v.address.trim(), was.address) };
      if (next.name === was.name && next.address === was.address) return null;
      Object.assign(t, next);
      return { at: 'bto', html: T('Iqaa’s invoices are now made out to {name} · {address}.', { name: bdi(T(next.name)), address: esc(T(next.address)) }), say: T('Saved.'), undo: () => { Object.assign(t, was); return '[data-open="bto"]'; } };
    },
    form: () => form('bto', `<div class="se-fields">${field('bto', 'name', T('Name'), { max: 60, auto: 'organization' })}${field('bto', 'address', T('Address'), { max: 120, auto: 'street-address' })}</div>`, T('Save'), T('Change the name on the invoices')),
  };
  // the orders opened each month, from every order Sufra has had
  const opened = (ym) => S.jobs.concat(S.past || []).filter((j) => j.opened && j.opened.slice(0, 7) === ym).length;
  function renderBilling() {
    const s = $('[data-sec="billing"]'), b = state.billing, mono = (v) => `<span class="mono">${v}</span>`;
    if (!owner) {
      $('[data-in]', s).innerHTML = `<p class="se-lock">${ico('Lock')}<span>${T('Only owners see billing. Ask {owners} if something here needs changing.', { owners: esc(both(owners.map(T))) })}</span></p>`;
      return;
    }
    const inv = state.invites.length, ways = onWays();
    const use = `<dl class="se-use">
<div><dt>${ico('People', 16)}<span>${T('People who sign in:')}</span></dt><dd>${inv ? N(inv, '{people}, and {n} invited', '{people}, and {n} invited', { people: mono(state.people.length), n: mono(inv) }) : mono(state.people.length)}</dd></div>
<div><dt>${ico('Orders', 16)}<span>${T('Orders opened:')}</span></dt><dd>${T('{now} so far in November · {before} in October', { now: mono(opened(S.dayIso.slice(0, 7))), before: mono(opened('2026-10')) })}</dd></div>
<div><dt>${ico('Send', 16)}<span>${T('Channels on:')}</span></dt><dd>${esc(both(ways))}</dd></div></dl>`;
    $('[data-in]', s).innerHTML = `<div class="se-bill"><ul class="se-rows">
${row('plan', 'Billing', T('Plan'), T('{plan} · {price} a month', { plan: esc(T(b.plan)), price: esc(T(b.price)) }), T('Iqaa’s plans and prices are not set yet, so they show in brackets.'))}
<li data-row="use"><div class="se-row"><div class="se-rt"><p class="se-rl">${ico('Run log', 16)}<span>${T('What {org} uses', { org: bdi(T(state.org.name)) })}</span></p>${use}</div></div></li>
${row('bmail', 'Email', T('Invoices from Iqaa go to'), esc(b.email), '', action('bmail', T('Change'), T('Change where invoices go')))}
${row('bto', 'Contact', T('Name on Iqaa’s invoices'), `${bdi(T(b.billTo.name))} · ${esc(T(b.billTo.address))}`, '', action('bto', T('Change'), T('Change the name on the invoices')))}
${row('invoices', 'Billing', T('Invoices from Iqaa'), b.invoices.length ? esc(N(b.invoices.length, '{n} invoice', '{n} invoices')) : T('None yet.'), '')}
</ul></div>`;
  }

  // ---------- the nav: each area and how it is set up, from saved state only ----------
  const NAMES = { team: 'Team', channels: 'Channels', organization: 'Organization', billing: 'Billing' };
  const AREAS = Object.keys(NAMES);
  function summary(a) {
    if (a === 'team') { const n = state.invites.length; return { html: `${N(state.people.length, '{n} person', '{n} people')}${n ? ` · ${N(n, '{n} invited', '{n} invited')}` : ''}` }; }
    if (a === 'channels') { const w = onWays(); return { html: w.length === 1 ? T('Sends by email') : T('{ways} on', { ways: both(w) }) }; }
    if (a === 'organization') return { html: `${markHtml(20, { saved: true })}<code>${esc(state.org.address)}</code>`, text: state.org.address };
    return { html: owner ? T('{plan} · {price} a month', { plan: esc(T(state.billing.plan)), price: esc(T(state.billing.price)) }) : T('Owners only') };
  }
  function renderNav() {
    AREAS.forEach((a) => {
      const link = $(`[data-go="${a}"]`), sum = $(`[data-sum="${a}"]`), s = summary(a), wait = areaDirty(a);
      sum.innerHTML = wait ? `${g('struck', { test: true })}<span>${T('Not saved yet')}</span>` : s.html;
      const said = (s.text || s.html.replace(/<[^>]+>/g, '')).replace(/ · /g, T(', '));
      link.setAttribute('aria-label', `${T(NAMES[a])}${T(', ')}${wait ? T('not saved yet') : lcFirst(said)}`);
    });
  }
  function renderArea(a) {
    ({ team: renderTeam, channels: renderChannels, organization: renderOrg, billing: renderBilling })[a]();
    dropdowns($(`[data-sec="${a}"]`));
  }
  function renderAll() {
    AREAS.forEach(renderArea);
    renderNav();
    signSidebar(false);
    Object.values(notes).forEach((n) => { n.ptr = false; });
  }

  // ---------- one area at a time, each at its own address ----------
  const phone = matchMedia('(max-width: 899px)'), page = $('.se-page');
  let shown = null, routed = '';
  function title() {
    const org = state.org.name;
    document.title = shown && shown !== 'list' ? `${T(NAMES[shown])} · ${T('Settings')} · ${T(org)}` : `${T('Settings')} · ${T(org)}`;
  }
  function route(focus) {
    const h = location.hash.slice(1);
    // the skip link (#main) keeps the area that is open
    if (h === 'main' && shown) return;
    if (location.href === routed && shown) return;
    routed = location.href;
    shown = AREAS.includes(h) ? h : phone.matches ? 'list' : 'team';
    page.dataset.view = shown === 'list' ? 'list' : 'area';
    AREAS.forEach((a) => {
      $(`[data-sec="${a}"]`).hidden = a !== shown;
      const l = $(`[data-go="${a}"]`);
      if (a === shown) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
    });
    title();
    // the footer's 'see Settings as' links keep the area
    $$('[data-as]').forEach((a) => { a.href = `settings.html${a.dataset.as === 'hala' ? '' : `?as=${a.dataset.as}`}${AREAS.includes(h) ? `#${h}` : ''}`; });
    if (focus) {
      window.scrollTo(0, 0);
      const t = shown === 'list' ? $('#se-h') : $(`#se-${shown}-h`);
      t.focus({ preventScroll: true });
    }
  }
  window.addEventListener('hashchange', () => route(true));
  window.addEventListener('popstate', () => route(true));
  phone.addEventListener('change', () => { if (!AREAS.includes(location.hash.slice(1))) { routed = ''; route(false); } });

  // ---------- events ----------
  root.addEventListener('click', (e) => {
    const t = e.target.closest('button, a');
    if (!t) return;
    if (t.matches('[data-back]')) { e.preventDefault(); history.pushState(null, '', `${location.pathname}${location.search}`); route(true); }
    else if (t.matches('[data-open]')) openEd(t.dataset.open);
    else if (t.matches('[data-cancel]')) cancel(t.closest('[data-ed]').dataset.ed);
    else if (t.matches('[data-undo]')) undo(t.dataset.undo);
    else if (t.matches('[data-remove]')) { if (t.getAttribute('aria-disabled') !== 'true') remove(t.dataset.remove); }
    else if (t.matches('[data-again]')) again(t.dataset.again);
    else if (t.matches('[data-drop]')) drop(t.dataset.drop);
    else if (t.matches('[data-unplug]')) unplug(t.dataset.unplug);
    else if (t.matches('[data-use-logo]')) useLogo();
    else if (t.matches('[data-use-initial]')) useInitial();
    else if (t.matches('[data-pick]')) {
      pick = t.dataset.pick;
      $$('[data-pick]', root).forEach((b) => b.setAttribute('aria-pressed', String(b === t)));
      renderPreview();
    } else if (t.matches('[data-view]')) {
      view = t.dataset.view;
      renderPreview();
      $(`[data-view="${view}"]`, root).focus();
    }
  });
  root.addEventListener('submit', (e) => { const f = e.target.closest('form[data-ed]'); if (f) { e.preventDefault(); save(f.dataset.ed); } });
  root.addEventListener('input', (e) => {
    const k = e.target.dataset.k, box = e.target.closest('[data-ed]');
    if (!k || !box) return;
    const id = box.dataset.ed;
    if (!ed[id]) ed[id] = { v: {}, err: {} };
    ed[id].v[k] = e.target.value;
    // an error leaves its field as soon as the field changes
    if (ed[id].err[k]) {
      ed[id].err[k] = null;
      e.target.removeAttribute('aria-invalid');
      const er = $(`#${id}-${k}-err`);
      if (er) er.hidden = true;
    }
    const u = $('[data-uns]', box);
    if (u) u.hidden = !dirty(id);
    renderNav();
    if (id === 'name') { renderMark(); renderWhere(); renderPreview(); }
    if (id === 'email' && k === 'from') { renderPreview(); renderWhere(); }
    if (id === 'logo') {
      if (e.target.value !== 'logo' && ed.logo.v.file) ed.logo.v.file = null;
      if (!dirty('logo')) delete ed.logo;
      sweep();
      renderMark(); renderWhere(); renderPreview(); renderNav();
      const r = $('[data-k="choice"]:checked', root);
      if (r) r.focus();
    }
  });
  root.addEventListener('change', (e) => { if (e.target.id === 'se-logo-f' && e.target.files && e.target.files[0]) choose(e.target.files[0]); });
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const box = e.target.closest('[data-ed]');
    if (box && ed[box.dataset.ed]) { e.preventDefault(); cancel(box.dataset.ed); }
  });
  // a note's timer waits while the pointer or the focus is in it
  root.addEventListener('pointerover', (e) => { const n = e.target.closest('[data-note]'); if (n) hold(n.dataset.note, 'ptr', true); });
  root.addEventListener('pointerout', (e) => { const n = e.target.closest('[data-note]'); if (n && !n.contains(e.relatedTarget)) hold(n.dataset.note, 'ptr', false); });
  root.addEventListener('focusin', (e) => { const n = e.target.closest('[data-note]'); if (n) hold(n.dataset.note, 'foc', true); });
  root.addEventListener('focusout', (e) => { const n = e.target.closest('[data-note]'); if (n && !n.contains(e.relatedTarget)) hold(n.dataset.note, 'foc', false); });
  $('[data-accept]').addEventListener('click', accept);
  // leaving asks first only while an editor holds something not saved
  window.addEventListener('beforeunload', (e) => { if (Object.keys(ed).some(dirty)) { e.preventDefault(); e.returnValue = ''; } });

  if (!owner) $('[data-lead]').textContent = T('You can see how {org} is set up. Owners change it: ask {owners}.', { org: T(state.org.name), owners: both(owners.map(T)) });
  renderAll();
  route(AREAS.includes(location.hash.slice(1)));
})();
