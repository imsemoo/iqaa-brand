// People and departments (الأقسام والأشخاص): the owner's view of who is in the organization and what each may do. The
// departments in one strip, each with how many people, teams and blocks it has; the one chosen shows its blocks, its
// teams (each with its lead and the roles every member holds) and its people in a table: their title (free text that
// gives no permission), their membership, their skills from the organization's own list, the hours they give a week,
// where they work (one line that reveals every permission they hold, read from the roles in the blocks) and whether
// they have joined. A new department and an invitation are kept for the visit and can be undone; nothing is sent.
// Below a table's width (a phone, a narrow sheet) each person becomes a card with the fields that matter most.
(function () {
  const root = document.querySelector('main.pp');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'khaled', masar: 'samir' });
  const W = window.WORLD, T = window.T, N = window.I18N.n, esc = FLOW.esc, O = C.O;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const M = window.IQAA.motion;
  const q = new URLSearchParams(location.search);
  const icon = (n, s) => IQ.icon(n, s || 20);
  const glyph = (kind, test) => `<span class="pp-g" aria-hidden="true">${IQ.glyph(kind, { test: !!test })}</span>`;
  const blocks = O.lines.flatMap((l) => l.blocks);
  const block = (id) => blocks.find((b) => b.id === id);
  const teams = O.teams || [];
  const today = W.dayIso;

  // ---------- what this visit added: departments and invitations, kept per organization (sessionStorage) ----------
  const KEY = `iqaa-people:${O.id}`;
  function visit() {
    let v = null;
    try { v = JSON.parse(FLOW.store.get(KEY) || 'null'); } catch (e) { v = null; }
    return { depts: (v && v.depts) || [], invites: (v && v.invites) || [] };
  }
  const keep = (v) => FLOW.store.set(KEY, JSON.stringify(v));
  // the organization as this visit sees it
  function now() {
    const v = visit(), people = Object.assign({}, O.people);
    v.invites.forEach((p) => { people[p.k] = p; });
    return { v, people, depts: O.departments.concat(v.depts) };
  }

  // ---------- a person, read from the world ----------
  const name = (p) => T(p.name);
  const initial = (p) => esc(name(p).charAt(0));
  const invited = (p) => p.type === 'invited';
  const teamOf = (k, p) => teams.find((t) => t.lead === k || t.people.includes(k) || (p.joins && p.joins === t.id)) || null;
  // their membership: what they are, or what their invitation offers
  function membership(k, p) {
    const m = invited(p) ? p.as || (O.invitedAs || {})[k] : p.type;
    if (m === 'freelancer') return p.until ? T('Freelancer until {date}', { date: FLOW.date(`${p.until}T00:00`) }) : T('Freelancer');
    if (m === 'client') return T('Client member');
    if (m === 'staff') return T('Staff');
    return '';
  }
  // Where they work: every role they hold in every block, as "Block: role", the organization's owner first. Someone
  // invited holds nothing yet; their team's roles are shown in the dashed pen of what is not yet so.
  function where(k, p) {
    if (invited(p)) {
      const t = teamOf(k, p);
      return t ? { list: t.grants.map((g) => ({ place: T(block(g.block).name), roles: [T(g.role)], kind: block(g.block).stroke, test: true })), note: T('From the team, once they join') }
        : { list: [], note: T('No role yet. A team or a block’s lead gives one.') };
    }
    const list = p.owner ? [{ place: T(O.name), roles: [T('Owner')], kind: null }] : [];
    blocks.forEach((b) => {
      const roles = b.roles.filter((r) => r.people.includes(k)).map((r) => T(r.role));
      if (roles.length) list.push({ place: T(b.name), roles, kind: b.stroke });
    });
    return { list, note: list.length ? '' : T('No role yet. A team or a block’s lead gives one.') };
  }
  const roleList = (list, label) => (list.length ? `<ul class="pp-where"${label ? ` aria-label="${esc(label)}"` : ''}>${list.map((w) => `<li>${w.kind ? glyph(w.kind, w.test) : `<span class="pp-g pp-own" aria-hidden="true">${icon('Company', 16)}</span>`}`
    + `<span>${T('{place}: {roles}', { place: `<b>${esc(w.place)}</b>`, roles: esc(w.roles.join(T(', '))) })}</span></li>`).join('')}</ul>` : '');

  // ---------- the strip of departments ----------
  const peopleIn = (all, d) => Object.keys(all.people).filter((k) => all.people[k].dept === d.id);
  function counts(all, d) {
    const n = peopleIn(all, d).length, t = teams.filter((x) => x.dept === d.id).length, b = blocks.filter((x) => x.dept === d.id).length;
    return [n ? N(n, '{n} person', '{n} people') : T('Nobody yet'), t ? N(t, '{n} team', '{n} teams') : '', b ? N(b, '{n} block', '{n} blocks') : ''].filter(Boolean).join(' · ');
  }
  // the department the page opens on: the one asked for, else the one with the most people (ties: more teams), where
  // most of the owner's questions about people are
  function pick(all) {
    const asked = all.depts.find((d) => d.id === q.get('dept'));
    if (asked) return asked.id;
    const score = (d) => peopleIn(all, d).length * 100 + teams.filter((x) => x.dept === d.id).length;
    return all.depts.reduce((a, d) => (score(d) > score(a) ? d : a), all.depts[0]).id;
  }
  let sel = null;
  function strip(all) {
    $('[data-depts]').innerHTML = `<ul class="pp-ds">${all.depts.map((d) => `<li><a class="pp-d" href="${C.href('people.html', { dept: d.id })}" data-dept="${esc(d.id)}"${d.id === sel ? ' aria-current="true"' : ''}>`
      + `<b>${esc(T(d.name))}</b><span>${esc(counts(all, d))}</span></a></li>`).join('')}</ul>`;
  }
  function head(all) {
    const n = Object.keys(all.people).length, inv = Object.values(all.people).filter(invited).length;
    $('[data-sum]').textContent = [N(n, '{n} person', '{n} people'), N(all.depts.length, '{n} department', '{n} departments'), inv ? N(inv, '{n} invited', '{n} invited') : ''].filter(Boolean).join(' · ');
  }

  // ---------- a department: its blocks, its teams, its people ----------
  const COLS = ['Person', 'Title', 'Type', 'Skills', 'Hours a week', 'Where they work', 'Status'];
  const dash = `<span class="pp-none" aria-hidden="true">—</span><span class="sr">${esc(T('None'))}</span>`;
  function row(all, k, team) {
    const p = all.people[k], w = where(k, p), inv = invited(p), at = p.at || (O.invited || {})[k];
    const sub = team && team.lead === k ? T('Leads the team') : p.email ? p.email : '';
    const skills = (p.skills || []).map((s) => `<span class="pp-sk">${esc(T(s))}</span>`).join('');
    return `<tr data-k="${esc(k)}"${inv ? ' class="is-inv"' : ''}>
<th scope="row" class="pp-c-p"><div class="pp-who"><span class="me-av${inv ? ' inv' : ''}" aria-hidden="true">${initial(p)}</span><span class="pp-pn"><b>${esc(name(p))}</b>${sub ? `<small${p.email ? ' dir="ltr"' : ''}>${esc(sub)}</small>` : ''}</span></div></th>
<td class="pp-c-t">${p.title ? esc(T(p.title)) : dash}</td>
<td class="pp-c-y">${membership(k, p) ? esc(membership(k, p)) : dash}</td>
<td class="pp-c-s"><span class="pp-l">${esc(T('Skills'))}</span>${skills ? `<span class="pp-sks">${skills}</span>` : dash}</td>
<td class="pp-c-h"><span class="pp-l">${esc(T('Hours a week'))}</span>${p.hours ? `<span>${esc(N(p.hours, '{n} h', '{n} h'))}</span>` : dash}</td>
<td class="pp-c-w"><span class="pp-l">${esc(T('Where they work'))}</span>${roleList(w.list)}${w.note ? `<small class="pp-wn">${esc(w.note)}</small>` : ''}</td>
<td class="pp-c-st">${inv ? `<span class="pp-st inv"><i aria-hidden="true"></i>${esc(T('Not joined yet'))}</span>${at ? `<small>${esc(T('Invited {when}', { when: FLOW.ago(at) }))}</small>` : ''}`
      : `<span class="pp-st on"><i aria-hidden="true"></i>${esc(T('Active'))}</span>`}</td></tr>`;
  }
  function table(all, ks, team, caption) {
    return `<div class="pp-tw"><table class="pp-tb"><caption class="sr">${esc(caption)}</caption>
<colgroup><col class="w-p"><col class="w-t"><col class="w-y"><col class="w-s"><col class="w-h"><col class="w-w"><col class="w-st"></colgroup>
<thead><tr>${COLS.map((c) => `<th scope="col">${esc(T(c))}</th>`).join('')}</tr></thead>
<tbody>${ks.map((k) => row(all, k, team)).join('')}</tbody></table></div>`;
  }
  function detail(all) {
    const d = all.depts.find((x) => x.id === sel), el = $('[data-detail]');
    const ks = peopleIn(all, d), own = teams.filter((t) => t.dept === d.id), bl = blocks.filter((b) => b.dept === d.id);
    const dn = T(d.name);
    const blocksHtml = bl.length ? `<ul class="pp-bl" aria-label="${esc(T('Blocks of {dept}', { dept: dn }))}">${bl.map((b) => `<li>${glyph(b.stroke)}<span>${esc(T(b.name))}</span></li>`).join('')}</ul>` : '';
    // the strip above already counts it; the head names it and the blocks that belong to it
    const top = `<header class="pp-dh"><h2 id="pp-dh" tabindex="-1">${esc(dn)}</h2>${blocksHtml}</header>`;
    if (!ks.length) {
      el.innerHTML = `${top}<div class="pp-empty"><p><b>${esc(T('Nobody in {dept} yet.', { dept: dn }))}</b></p>`
        + `<p>${esc(T('It shows in every block’s settings now, so a block can belong to it.'))}</p>`
        + `<button type="button" class="btn primary" data-open="invite" aria-expanded="false" aria-controls="pp-panel">${icon('Invite')}<span>${esc(T('Invite a person to {dept}', { dept: dn }))}</span></button></div>`;
      return;
    }
    // each team, its lead first; then whoever in the department is in no team, the owner first
    const order = (a) => a.sort((x, y) => (all.people[y].owner ? 1 : 0) - (all.people[x].owner ? 1 : 0));
    const sections = own.map((t) => {
      const members = [t.lead].concat(ks.filter((k) => k !== t.lead && teamOf(k, all.people[k]) === t)).filter((k) => k && all.people[k]);
      const grants = t.grants.map((g) => ({ place: T(block(g.block).name), roles: [T(g.role)], kind: block(g.block).stroke }));
      const id = `pp-t-${esc(t.id)}`;
      return `<section class="pp-team" aria-labelledby="${id}"><div class="pp-th">
<h3 id="${id}">${icon('People', 18)}<span>${esc(T(t.name))}</span><span class="pp-n">${members.length}</span></h3>
${t.lead && all.people[t.lead] ? `<p>${esc(T('Led by {name}', { name: name(all.people[t.lead]) }))}</p>` : ''}
<div class="pp-inh"><span>${esc(T('Every member holds'))}</span>${roleList(grants, T('Every member holds'))}</div></div>
${table(all, members, t, T(t.name))}</section>`;
    });
    const loose = order(ks.filter((k) => !teamOf(k, all.people[k])));
    if (loose.length) {
      const h = own.length ? T('Not in a team') : T('Everyone in {dept}', { dept: dn });
      sections.push(`<section class="pp-team" aria-labelledby="pp-t-none"><div class="pp-th"><h3 id="pp-t-none">${icon('Clients', 18)}<span>${esc(h)}</span><span class="pp-n">${loose.length}</span></h3>`
        + `${own.length ? '' : `<p>${esc(T('No team in this department: each person’s roles are given one by one.'))}</p>`}</div>${table(all, loose, null, h)}</section>`);
    }
    el.innerHTML = `${top}<p class="pp-rule">${icon('Lock', 18)}<span>${esc(T('A new member inherits every permission of their team. A title is free text and gives no permission: what a person may do comes from their role in each block.'))}</span></p>`
      + sections.join('')
      + ((O.skills || []).length ? `<p class="pp-org-sk">${esc(T('Skills come from {org}’s own list: {list}.', { org: T(O.name), list: O.skills.map((s) => T(s)).join(T(', ')) }))}</p>` : '');
  }

  function render() {
    if (window.UI) UI.closeMenu();
    const all = now();
    if (!all.depts.some((d) => d.id === sel)) sel = pick(all);
    head(all);
    strip(all);
    detail(all);
  }
  function choose(id, focus) {
    sel = id;
    q.set('dept', id);
    history.replaceState(null, '', `${location.pathname}?${q}${location.hash}`);
    $$('a[data-lang-to]').forEach((a) => { a.href = I18N.href(a.dataset.langTo); });
    $$('.pp-d', root).forEach((a) => { if (a.dataset.dept === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    detail(now());
    if (focus) $('#pp-dh').focus({ preventScroll: true });
  }

  // ---------- the forms: a new department, an invitation; one open at a time, under the buttons that open them ----------
  let open = null, opener = null, undo = null;
  const field = (id, label, input, hint) => `<div class="field pp-f" data-f="${id}"><label for="pp-${id}">${esc(label)}</label>${input}`
    + `${hint ? `<p class="pp-hint" id="pp-${id}-h">${esc(hint)}</p>` : ''}<p class="err pp-err" id="pp-${id}-e" hidden></p></div>`;
  const desc = (id, hint) => ` aria-describedby="${hint ? `pp-${id}-h ` : ''}pp-${id}-e"`;
  function teamOptions(dept, chosen) {
    const own = teams.filter((t) => t.dept === dept);
    return `<option value="">${esc(T('No team'))}</option>${own.map((t) => `<option value="${esc(t.id)}"${t.id === chosen ? ' selected' : ''}>${esc(T(t.name))}</option>`).join('')}`;
  }
  function panel(kind, dept) {
    const el = $('[data-panel]'), all = now();
    if (kind === 'dept') {
      el.innerHTML = `<form class="pp-form" data-form="dept" novalidate aria-labelledby="pp-fh"><h2 id="pp-fh">${esc(T('New department'))}</h2>
${field('dn', T('Name'), `<input id="pp-dn" type="text" autocomplete="off" maxlength="40"${desc('dn', true)}>`, T('It shows in every block’s settings once it is added. No developer is needed.'))}
<div class="pp-fa"><button type="button" class="btn" data-close>${esc(T('Cancel'))}</button><button type="submit" class="btn ink">${icon('Create')}<span>${esc(T('Add the department'))}</span></button></div></form>`;
    } else {
      const d = dept || sel, first = teams.find((t) => t.dept === d);
      el.innerHTML = `<form class="pp-form" data-form="invite" novalidate aria-labelledby="pp-fh"><h2 id="pp-fh">${esc(T('Invite a person'))}</h2>
<div class="pp-fg">
${field('in', T('Name'), `<input id="pp-in" type="text" autocomplete="off" maxlength="60"${desc('in')}>`)}
${field('ie', T('Email'), `<input id="pp-ie" type="email" dir="ltr" autocomplete="off" maxlength="80"${desc('ie')}>`)}
${field('id', T('Department'), `<select id="pp-id">${all.depts.map((x) => `<option value="${esc(x.id)}"${x.id === d ? ' selected' : ''}>${esc(T(x.name))}</option>`).join('')}</select>`)}
${field('it', T('Team'), `<select id="pp-it"${desc('it', true)}>${teamOptions(d, first ? first.id : '')}</select>`, T('Their team’s roles are theirs once they join.'))}
${field('iy', T('Membership'), `<select id="pp-iy"><option value="staff">${esc(T('Staff'))}</option><option value="freelancer">${esc(T('Freelancer'))}</option><option value="client">${esc(T('Client member'))}</option></select>`)}
<div class="pp-until" data-until hidden>${field('iu', T('Until'), `<input id="pp-iu" type="date" min="${today}"${desc('iu', true)}>`, T('The last day they work with {org}.', { org: T(O.name) }))}</div>
${field('ip', T('Title'), `<input id="pp-ip" type="text" autocomplete="off" maxlength="60"${desc('ip', true)}>`, T('Optional. Free text: it gives no permission.'))}
</div>
<div class="pp-pre" aria-live="polite" data-pre></div>
<p class="pp-hint">${esc(T('In this prototype nothing is sent: the invitation stays for this visit.'))}</p>
<div class="pp-fa"><button type="button" class="btn" data-close>${esc(T('Cancel'))}</button><button type="submit" class="btn primary">${icon('Send')}<span>${esc(T('Send the invitation'))}</span></button></div></form>`;
      preview();
    }
    el.hidden = false;
    if (!window.Beats.reduce()) el.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: M.quarter, easing: M.ease_arrive });
  }
  // what the person will hold once they join: their team's roles, said before the invitation goes
  function preview() {
    const t = teams.find((x) => x.id === ($('#pp-it') || {}).value);
    const list = t ? t.grants.map((g) => ({ place: T(block(g.block).name), roles: [T(g.role)], kind: block(g.block).stroke, test: true })) : [];
    $('[data-pre]').innerHTML = `<p class="pp-l2">${esc(T('Where they will work'))}</p>${list.length ? roleList(list) : `<p class="pp-wn">${esc(T('No role yet. A team or a block’s lead gives one.'))}</p>`}`;
  }
  function show(kind, btn, dept) {
    if (open === kind && !dept) return hide(true);
    open = kind;
    opener = btn;
    $$('[data-open]', root).forEach((b) => b.setAttribute('aria-expanded', String(b.dataset.open === kind)));
    panel(kind, dept);
    const first = $('[data-panel] input');
    if (first) first.focus();
  }
  function hide(focus) {
    const el = $('[data-panel]');
    el.hidden = true;
    el.innerHTML = '';
    $$('[data-open]', root).forEach((b) => b.setAttribute('aria-expanded', 'false'));
    if (focus && opener && opener.isConnected) opener.focus();
    open = null;
  }
  function bad(id, text) {
    const f = $(`[data-f="${id}"]`), e = $(`#pp-${id}-e`), input = $(`#pp-${id}`);
    e.textContent = text;
    e.hidden = !text;
    f.classList.toggle('bad', !!text);
    if (text) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    return !!text;
  }

  // ---------- what was just done, with its Undo ----------
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
  function flash(k) {
    const tr = $(`tr[data-k="${k}"]`, root);
    if (tr && !window.Beats.reduce()) tr.animate([{ backgroundColor: 'rgba(136, 69, 248, 0.08)' }, { backgroundColor: 'rgba(136, 69, 248, 0)' }], { duration: M.beat * 2, easing: M.ease_leave });
  }

  function addDept(form) {
    const input = $('#pp-dn', form), text = input.value.trim(), all = now();
    const taken = all.depts.find((d) => T(d.name).toLocaleLowerCase(I18N.lang) === text.toLocaleLowerCase(I18N.lang) || d.name.toLowerCase() === text.toLowerCase());
    if (bad('dn', !text ? T('Write the department’s name.') : taken ? T('{dept} already exists.', { dept: T(taken.name) }) : '')) { input.focus(); return; }
    const v = all.v, d = { id: `d${Date.now().toString(36)}`, name: text };
    v.depts.push(d);
    keep(v);
    undo = { type: 'dept', id: d.id, was: sel };
    hide(false);
    sel = d.id;
    render();
    choose(d.id, false);
    note(T('{dept} is added. It shows in every block’s settings.', { dept: text }));
    $('[data-undo]').focus();
  }
  function invite(form) {
    const all = now(), get = (id) => $(`#pp-${id}`, form).value.trim();
    const nm = get('in'), em = get('ie'), dept = get('id'), team = get('it'), as = get('iy'), until = get('iu'), title = get('ip');
    const errs = [
      bad('in', nm ? '' : T('Write the person’s name.')),
      bad('ie', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em) ? T('Write an email address, like name@example.com.')
        : all.v.invites.some((p) => p.email.toLowerCase() === em.toLowerCase()) ? T('{email} has already been invited.', { email: em }) : ''),
      as === 'freelancer' ? bad('iu', !until ? T('Choose the last day of their work.') : until < today ? T('Choose a day from today on.') : '') : false,
    ];
    const first = ['in', 'ie', 'iu'].find((id, i) => errs[i]);
    if (first) { $(`#pp-${first}`).focus(); return; }
    const p = { k: `v${Date.now().toString(36)}`, name: nm, email: em, dept, joins: team || null, type: 'invited', as, until: as === 'freelancer' ? until : null, title: title || '', at: W.now, hours: null };
    const v = all.v;
    v.invites.push(p);
    keep(v);
    undo = { type: 'invite', k: p.k, was: sel };
    hide(false);
    sel = dept;
    render();
    choose(dept, false);
    flash(p.k);
    note(T('{name} is invited. Nothing is sent in this prototype.', { name: nm }));
    $('[data-undo]').focus();
  }
  function takeBack() {
    if (!undo) return;
    const v = visit();
    if (undo.type === 'dept') v.depts = v.depts.filter((d) => d.id !== undo.id);
    else v.invites = v.invites.filter((p) => p.k !== undo.k);
    keep(v);
    sel = undo.was;
    undo = null;
    $('[data-note]').hidden = true;
    render();
    choose(sel, true);
  }

  // ---------- events ----------
  root.addEventListener('click', (e) => {
    const a = e.target.closest('a.pp-d');
    if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); return choose(a.dataset.dept, false); }
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.open) return show(b.dataset.open, b, b.closest('[data-detail]') ? sel : null);
    if (b.hasAttribute('data-close')) return hide(true);
    if (b.hasAttribute('data-undo')) return takeBack();
  });
  root.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'pp-id') { const first = teams.find((x) => x.dept === t.value); $('#pp-it').innerHTML = teamOptions(t.value, first ? first.id : ''); preview(); }
    if (t.id === 'pp-it') preview();
    if (t.id === 'pp-iy') { const on = t.value === 'freelancer'; $('[data-until]').hidden = !on; if (!on) bad('iu', ''); }
  });
  root.addEventListener('input', (e) => {
    const f = e.target.closest('[data-f]');
    if (f && e.target.value.trim() && f.classList.contains('bad')) bad(f.dataset.f, '');
  });
  root.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-form]');
    if (!f) return;
    e.preventDefault();
    if (f.dataset.form === 'dept') addDept(f); else invite(f);
  });
  root.addEventListener('keydown', (e) => {
    // Esc closes the form, unless a dropdown inside it is open (it closes itself first)
    if (e.key === 'Escape' && open && e.target.closest('[data-panel]') && !e.target.closest('[aria-expanded="true"]')) { e.preventDefault(); hide(true); }
  });

  document.title = `${T('People and departments')} · ${T(O.name)}`;
  // the screen is the owner's: someone else is told so, and sent to their own work
  if (!C.P.owner) {
    $('[data-acts]').hidden = true;
    $('[data-sum]').textContent = '';
    $('[data-detail]').innerHTML = `<div class="pp-empty"><p><b>${esc(T('People and departments belongs to the owner of {org}.', { org: T(O.name) }))}</b></p>`
      + `<p>${esc(T('The owner adds departments, invites people and puts them in teams.'))}</p>`
      + `<a class="btn" href="${C.href('work.html')}">${icon('My work', 18)}<span>${esc(T('My work'))}</span></a></div>`;
    return;
  }
  render();
  if (q.get('dept') !== sel) choose(sel, false);
})();
