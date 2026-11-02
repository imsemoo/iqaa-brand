// The canvas (اللوحة): an organization's line as its owner shapes it. The line is drawn in the Line screen's metro
// language: one ink track, every block an interchange ring (work changes hands there) with its department, name,
// stroke, roles, people and live items; a block that runs beside the line (Design) leaves it at 45° and rejoins it
// where its work meets the line again; a way back runs at half weight as a square U-turn under the line. What is drawn
// is the draft of the next version (world.js `draft`, and this visit's changes kept by flow.js): a block the draft adds
// in the dashed grey pen until it is published, a block it removes faded where it was. Under the map, the block types
// the core and the pack give; then the selected block's inspector: its people and roles (applied at once), what each
// role sees and may do, and its settings (each a draft change). "View as" fades what a role or a person cannot see.
// Under 1024 px the map turns vertical; on a phone the canvas is for viewing only.
(function () {
  const root = document.querySelector('main.ln2');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'khaled', masar: 'samir', wamda: 'hala' });
  const T = window.T, N = window.I18N.n, esc = FLOW.esc, NO = C.noun, O = C.O, L = C.line, W = window.WORLD;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const icon = (n, s) => IQ.icon(n, s || 20);
  const glyph = (kind, test) => `<span class="ln2-g" aria-hidden="true">${IQ.glyph(kind, { test: !!test })}</span>`;
  const vertical = matchMedia('(max-width: 1023px)'), phone = matchMedia('(max-width: 700px)');
  const q = new URLSearchParams(location.search);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const key = (...a) => a.join('|');
  // what this prototype does not do yet: shown, in reach of the keyboard, and said to be coming (as Home does)
  const soon = (label, ic) => `<button type="button" class="btn" aria-disabled="true" title="${esc(T('{name}: coming next', { name: label }))}">${ic ? icon(ic, 18) : ''}<span>${esc(label)}</span><em>${T('Soon')}</em></button>`;
  // a sentence of the draft in the page's language: its data names are English, like everything world.js holds
  const say = (c) => T(c.text, Object.fromEntries(Object.entries(c.vars || {}).map(([k, v]) => [k, T(String(v))])));

  // ---------- the block types: the core's eight, the same for every organization, then the pack's ----------
  // kind: what the block is, in world.js's words; stroke: how it writes in the line's signature (a person's work loops,
  // an approval waits for a person as an arch, what runs by itself is a straight stroke, a timed wait lifts the pen)
  const CORE = [
    { id: 'work', name: 'Stage of work', kind: 'work', stroke: 'struck' },
    { id: 'approval', name: 'Approval', kind: 'approval', stroke: 'held' },
    { id: 'condition', name: 'Condition', kind: 'condition', stroke: 'run', icon: 'Condition' },
    { id: 'branch', name: 'Branch', kind: 'branch', stroke: 'run', track: 'branch' },
    { id: 'merge', name: 'Merge', kind: 'merge', stroke: 'run', track: 'merge' },
    { id: 'watar', name: 'Watar', kind: 'watar', stroke: 'held', icon: 'Ask Watar' },
    { id: 'action', name: 'Action', kind: 'auto', stroke: 'run' },
    { id: 'wait', name: 'Wait', kind: 'wait', stroke: 'rest' },
  ];
  const PACKS = {
    'Media and production': [{ id: 'publishto', name: 'Publish to platforms', icon: 'Publish' }, { id: 'archive', name: 'Archive', icon: 'Archive' }],
    Software: [{ id: 'release', name: 'Release', icon: 'Release' }, { id: 'pr', name: 'Open a pull request', icon: 'Repository' }],
  };
  const PACK = (PACKS[O.pack] || []).map((x) => Object.assign({ kind: 'auto', stroke: 'run', pack: true }, x));
  const TYPES = CORE.concat(PACK);
  const typeOf = (b) => TYPES.find((x) => x.id === b.type) || CORE.find((x) => x.kind === b.kind) || CORE[0];
  // a branch and a merge are the track itself: drawn as the map draws them, mirrored right to left (svg.flow)
  const TRACK = {
    branch: '<svg class="flow" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h18M8 8l8 8h5"/></svg>',
    merge: '<svg class="flow" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h18M3 16h5l8-8"/></svg>',
  };
  const typeMark = (x) => (x.icon ? icon(x.icon, 20) : x.track ? TRACK[x.track] : glyph(x.stroke));
  // a block where a person does the work or decides needs someone in it; the others run by themselves
  const PERSON = ['work', 'approval', 'watar'];

  // ---------- roles: the four kinds, the actions the server checks on every request, which items a role sees ----------
  // each kind with the name a new role of it starts with, until the owner gives it the organization's own word
  const KINDS = [['does', 'Does the work', 'Contributor'], ['responsible', 'Responsible', 'Lead'], ['reviews', 'Reviews', 'Reviewer'], ['watches', 'Watches', 'Watcher']];
  const ACTS = [['open', 'Open the block'], ['claim', 'Claim open work'], ['upload', 'Upload files'], ['handover', 'Hand over'],
    ['give', 'Give work to others'], ['approve', 'Approve and send back'], ['stats', 'Block statistics'], ['manage', 'Manage the block’s people']];
  const MANAGE = ['give', 'approve', 'stats', 'manage'];
  const SEES = [['assigned', 'Only theirs'], ['team', 'Their team’s'], ['all', 'All']];
  const ACCESS = [['hidden', 'Hidden'], ['read', 'Read'], ['write', 'Write']];
  // the plan's five ways a block runs; changing it takes effect when the version is published
  const MODES = [
    ['Manual', 'People do the work and hand it over.'],
    ['Trial', 'The machine works beside the people on copies; nothing it makes leaves the block.'],
    ['Assisted', 'The machine prepares the work; a person checks it and hands it over.'],
    ['Automatic with review', 'The machine does the work; a person approves it before it moves on.'],
    ['Fully automatic', 'The machine does the work and hands it over by itself.'],
  ];
  const roleKind = (b, r) => r.kind || (r.lead ? 'responsible' : b.kind === 'approval' ? 'reviews' : 'does');
  // a role's actions unless the owner changed them: the one responsible has all eight; a reviewer opens, approves and
  // sends back; a watcher only opens; the one who does the work claims (where the role may), uploads and hands over
  function defActs(b, r) {
    const k = roleKind(b, r);
    if (k === 'responsible') return ACTS.map((a) => a[0]);
    if (k === 'reviews') return ['open', 'handover', 'approve'];
    if (k === 'watches') return ['open'];
    return ['open'].concat(r.claim ? ['claim'] : [], ['upload', 'handover']);
  }

  // ---------- people: applied at once, without publishing a version; kept for the visit ----------
  // { 'block|role': { add: [person], rm: [person] } } in sessionStorage 'iqaa-people:<org>:<line>'
  const PKEY = `iqaa-people:${O.id}:${L.id}`;
  let people = {};
  try { people = JSON.parse(FLOW.store.get(PKEY) || '{}') || {}; } catch (e) { people = {}; }
  function peopleOf(b, r) {
    const o = people[key(b.id, r.role)] || {};
    return r.people.filter((k) => !(o.rm || []).includes(k)).concat((o.add || []).filter((k) => !r.people.includes(k) && O.people[k]));
  }
  function setPeople(b, r, list) {
    const add = list.filter((k) => !r.people.includes(k)), rm = r.people.filter((k) => !list.includes(k));
    people[key(b.id, r.role)] = { add, rm };
    FLOW.store.set(PKEY, JSON.stringify(people));
  }
  const peopleIn = (b) => [...new Set(b.roles.flatMap((r) => peopleOf(b, r)))];

  // ---------- the draft: the published line, what the draft adds and removes, and this visit's changes on top ----------
  const PUB = L.blocks.filter((b) => !b.side).map((b) => b.id);
  let D, blocks, main, sides, fields, set, access, acts, hist, sees;
  function place(b, after) {
    blocks[b.id] = b;
    const s = sides.find((x) => x.ids.includes(after));
    if (s) { s.ids.splice(s.ids.indexOf(after) + 1, 0, b.id); b.side = true; return; }
    const i = main.indexOf(after);
    main.splice(i < 0 ? main.length : i + 1, 0, b.id);
  }
  function build() {
    D = C.draft();
    blocks = {};
    set = {}; access = {}; acts = {}; hist = {}; sees = {};
    L.blocks.forEach((b) => { blocks[b.id] = Object.assign(clone(b), { state: 'pub' }); });
    main = PUB.slice();
    // a block that runs beside the line leaves it after the block it comes from and meets it at the block that takes
    // its work (Design: from the editorial review to the management review)
    sides = L.blocks.filter((b) => b.side).map((b) => ({ from: b.after[0], to: (L.blocks.find((x) => (x.after || []).includes(b.id)) || {}).id, ids: [b.id] }));
    fields = {};
    Object.keys(O.fields).forEach((k) => { fields[k] = Object.assign({ state: 'pub' }, O.fields[k]); });
    Object.keys(D.fields || {}).forEach((k) => { if (!fields[k]) fields[k] = Object.assign({ state: 'added' }, D.fields[k]); });
    (D.adds || []).forEach((a) => place(Object.assign(clone(a), { state: 'added', stroke: W.STROKE[a.kind] }), a.after[0]));
    D.changes.forEach((c) => {
      const o = c.op;
      // the seed's changes, as world.js writes them: a removed block stays where it was, faded; a new mode waits
      if (!o) {
        if (c.type === 'remove' && blocks[c.block]) blocks[c.block].state = 'removed';
        if (c.type === 'mode' && blocks[c.block]) set[key(c.block, 'mode')] = { mode: c.vars.mode };
        return;
      }
      if (o.op === 'add') {
        const ty = TYPES.find((x) => x.id === o.type) || CORE[0], at = blocks[o.after];
        place({ id: o.id, name: ty.name, type: ty.id, kind: ty.kind, stroke: ty.stroke, pack: !!ty.pack, dept: at ? at.dept : O.departments[0].id, hours: 4, roles: [], state: 'added', mine: true }, o.after);
      } else if (!blocks[o.block]) {
        // a change to a block that is no longer in the draft
      } else if (o.op === 'remove') blocks[o.block].state = 'removed';
      else if (o.op === 'role') blocks[o.block].roles.push({ role: o.role, kind: o.kind, people: [], sees: o.kind === 'reviews' || o.kind === 'responsible' ? 'all' : 'assigned', lead: o.kind === 'responsible', state: 'added' });
      else if (o.op === 'set') set[key(o.block, o.key)] = o.value;
      else if (o.op === 'access') access[key(o.block, o.role, o.field)] = o.value;
      else if (o.op === 'act') acts[key(o.block, o.role, o.act)] = o.value;
      else if (o.op === 'hist') hist[key(o.block, o.role, o.of)] = o.value;
      else if (o.op === 'sees') sees[key(o.block, o.role)] = o.value;
    });
  }
  const all = () => main.concat(...sides.map((s) => s.ids));
  const sideOf = (id) => sides.find((s) => s.ids.includes(id));

  // a block as the draft has it now: its name, department, time, way back, type and how it runs
  const defMode = (b) => (b.kind === 'auto' ? 'Fully automatic' : 'Manual');
  // what Iqaa proposes when a block runs by itself: the owner accepts it, 20 a day, failures go to the people before it
  function defAuto(id) {
    const before = prev(id).map((x) => blocks[x]).find((x) => x.roles.length);
    return { accept: Object.keys(O.people).find((k) => O.people[k].owner), cap: 20, failures: before ? peopleOf(before, before.roles[0])[0] || '' : '' };
  }
  function eff(id) {
    const b = blocks[id], s = (k) => set[key(id, k)];
    const ty = s('type') ? TYPES.find((x) => x.id === s('type')) || typeOf(b) : typeOf(b);
    const kind = s('type') ? ty.kind : b.kind;
    const run = Object.assign({ mode: defMode(b) }, defMode(b) === 'Fully automatic' ? defAuto(id) : {}, s('mode') || {});
    return Object.assign({}, b, {
      name: s('name') != null ? s('name') : b.name, dept: s('dept') || b.dept, hours: s('hours') != null ? s('hours') : b.hours,
      back: s('back') !== undefined ? s('back') : b.back || '', ty, kind, stroke: s('type') ? ty.stroke : b.stroke, pack: s('type') ? !!ty.pack : !!b.pack, run,
    });
  }
  // the blocks that hand work to a block on the drawn line: the one before it, and a side lane that meets it here
  function prev(id) {
    const s = sideOf(id);
    if (s) { const i = s.ids.indexOf(id); return [i ? s.ids[i - 1] : s.from]; }
    const kept = main.filter((x) => blocks[x].state !== 'removed' || x === id), i = kept.indexOf(id);
    return (i > 0 ? [kept[i - 1]] : []).concat(sides.filter((x) => x.to === id).map((x) => x.ids[x.ids.length - 1]));
  }
  // by default a role reads the history of the blocks within two hand-offs before its own: enough to see why the work
  // was sent back, no more; the owner opens or closes any other block's history
  const defHist = (id) => [...new Set(prev(id).concat(...prev(id).map(prev)))];
  const backs = () => all().map((id) => ({ from: id, to: eff(id).back })).filter((k) => k.to && blocks[k.to] && blocks[k.from].state !== 'removed');
  const live = (id) => C.items.filter((it) => it.at.includes(id));
  const deptName = (id) => T((O.departments.find((d) => d.id === id) || { name: '' }).name);
  const deptLine = (b) => (b.pack ? T('{pack} pack', { pack: T(O.pack) }) : [deptName(b.dept), b.kind !== 'work' ? T(b.ty.name) : ''].filter(Boolean).join(' · '));

  // what each role may see and do: the owner's change, else what world.js gives, else the defaults above. A role with
  // no list of fields sees every field that is not secret, and reads it (flow.js reads items the same way).
  const fieldMode = (b, r, f) => (key(b.id, r.role, f) in access ? access[key(b.id, r.role, f)] : pubField(r, f));
  const pubField = (r, f) => (r.fields ? r.fields[f] || 'hidden' : fields[f].secret ? 'hidden' : 'read');
  const canAct = (b, r, a) => (key(b.id, r.role, a) in acts ? acts[key(b.id, r.role, a)] : defActs(b, r).includes(a));
  const readsHist = (b, r, of) => (key(b.id, r.role, of) in hist ? hist[key(b.id, r.role, of)] : defHist(b.id).includes(of));
  const seesItems = (b, r) => sees[key(b.id, r.role)] || r.sees || 'assigned';

  // ---------- this visit's changes: each the sentence the publish page lists (world.js's shape) and `op`, what it does ----------
  // A second change of the same thing replaces the first; a change back to what is published takes it away. Undo puts
  // the visit's changes back as they were.
  const opKey = (o) => (o.op === 'add' || o.op === 'role' ? null : [o.op, o.block, o.role || '', o.field || o.act || o.of || o.key || ''].join('|'));
  function setMine(list) { C.discard(); list.forEach((c) => C.change(c)); }
  function record(op, text, vars, same) {
    const before = C.draft().mine, k = opKey(op);
    const keep = before.filter((c) => !(k && c.op && opKey(c.op) === k));
    const c = { type: op.op === 'set' ? op.key : op.op, block: op.block || op.id, text, vars, op };
    setMine(same ? keep : keep.concat([c]));
    renderAll();
    note(same ? T('Back as published.') : T('In the draft: {change}', { change: say(c) }), () => { setMine(before); renderAll(); });
  }

  // ---------- View as: a role, or a person (all their roles on the line) ----------
  // ?view=role:<role> or ?view=person:<id>. Someone who is not the owner sees the canvas as themselves, for viewing.
  const owner = C.standing === 'owner';
  function parseView(s) {
    const m = /^(role|person):(.+)$/.exec(s || '');
    if (!m || (m[1] === 'person' && !O.people[m[2]])) return null;
    return { kind: m[1], id: m[2] };
  }
  let view = owner ? parseView(q.get('view')) : { kind: 'person', id: C.me };
  const viewRoles = (b) => (!view ? b.roles : b.roles.filter((r) => (view.kind === 'role' ? r.role === view.id : peopleOf(b, r).includes(view.id))));
  // what the viewer has of a block: a role in it, its history through a role elsewhere, or nothing
  function reach(id) {
    if (!view) return 'full';
    const b = eff(id);
    if (viewRoles(b).length) return 'full';
    return all().some((x) => { const o = eff(x); return viewRoles(o).some((r) => readsHist(o, r, id)); }) ? 'history' : 'none';
  }
  const viewer = () => (!view ? '' : view.kind === 'role' ? T('the {role} role', { role: T(view.id) }) : C.name(view.id));
  // the live items a viewer is shown in a block: all of them, their team's, their own; a role alone has no "own"
  function countFor(b) {
    const here = live(b.id);
    if (!view) return here.length;
    const rs = viewRoles(b);
    if (!rs.length) return null;
    if (rs.some((r) => seesItems(b, r) === 'all')) return here.length;
    if (view.kind !== 'person') return null;
    const team = O.people[view.id].team, byTeam = team && rs.some((r) => seesItems(b, r) === 'team');
    return here.filter((it) => it.who === view.id || (byTeam && it.who && O.people[it.who].team === team)).length;
  }

  // ---------- state of the screen ----------
  let sel = null, tab = ['people', 'sees', 'settings'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'people', pv = null, undo = null;
  const editable = () => owner && !phone.matches;
  function url() {
    const p = new URLSearchParams(location.search);
    p.set('block', sel);
    if (view && owner) p.set('view', `${view.kind}:${view.id}`); else p.delete('view');
    history.replaceState(null, '', `${location.pathname}?${p}${tab !== 'people' ? `#${tab}` : ''}`);
  }

  // ---------- the head: the organization's lines, this line's state, View as, and the two moves ----------
  function renderHead() {
    const n = D.changes.length;
    $('[data-lines]').innerHTML = `<a href="${C.href('lines.html')}" aria-current="page"><b>${esc(T(L.name))}</b><span>${esc(T('Version {n}', { n: L.version }))} · ${esc(NO.n(C.items.length, '{n} live job', '{n} live jobs'))}</span></a>`
      + (O.others || []).map((o) => `<span class="ln2-ls" aria-disabled="true" title="${esc(T('{name}: coming next', { name: T(o.name) }))}"><b>${esc(T(o.name))}</b><span>${esc(NO.n(o.live, '{n} live job', '{n} live jobs'))} · ${T('Soon')}</span></span>`).join('');
    $('[data-name]').textContent = T(L.name);
    document.title = `${T(L.name)} · ${T(O.name)}`;
    $('[data-state]').innerHTML = n
      ? `<b>${esc(T('Draft of version {n}', { n: D.version }))}</b> · ${esc(N(n, '{n} change not published', '{n} changes not published'))}${D.mine.length && owner ? ` · <button type="button" class="link" data-discard>${esc(N(D.mine.length, 'Take back the change made now', 'Take back the {n} changes made now'))}</button>` : ''}`
      : `<b>${esc(T('Version {n}', { n: L.version }))}</b> · ${esc(T('published'))}`;
    $('[data-as-label]').textContent = view ? T('Viewing as {who}', { who: view.kind === 'role' ? T(view.id) : C.first(view.id) }) : T('View as');
    $('[data-as-btn]').hidden = !owner;
    // every role on the line, and every person who holds one
    const roles = [], ppl = [];
    all().forEach((id) => { const b = eff(id); b.roles.forEach((r) => { let x = roles.find((y) => y.role === r.role); if (!x) roles.push(x = { role: r.role, in: [] }); x.in.push(T(b.name)); peopleOf(b, r).forEach((k) => { if (!ppl.includes(k)) ppl.push(k); }); }); });
    const cur = (v) => (view && v === `${view.kind}:${view.id}` ? ' aria-current="true"' : '');
    $('[data-as-menu]').innerHTML = `<p class="ln2-menu-h">${T('Roles')}</p>${roles.map((r) => `<button type="button" data-view="role:${esc(r.role)}"${cur(`role:${r.role}`)}><span><b>${esc(roleName(r.role))}</b><small>${esc(r.in.join(T(', ')))}</small></span></button>`).join('')}
<hr><p class="ln2-menu-h">${T('People')}</p>${Object.keys(O.people).filter((k) => ppl.includes(k)).map((k) => `<button type="button" data-view="person:${k}"${cur(`person:${k}`)}><span class="me-av" aria-hidden="true">${esc(T(O.people[k].name).charAt(0))}</span><span><b>${esc(C.name(k))}</b><small>${esc(T(O.people[k].title))}</small></span></button>`).join('')}
${view ? `<hr><button type="button" data-view="">${icon('Undo', 18)}<span><b>${T('Back to your view')}</b></span></button>` : ''}`;
    $('[data-talk]').innerHTML = owner ? soon(T('Edit by talking'), 'Ask Watar') : '';
    const pub = esc(T('Publish version {n}', { n: D.version }));
    $('[data-publish]').innerHTML = !owner ? '' : n ? `<a class="btn primary" href="${C.href('publish.html')}">${icon('Publish', 18)}<span>${pub}</span></a>`
      : `<button type="button" class="btn primary" disabled title="${esc(T('Nothing has changed since version {n}.', { n: L.version }))}">${icon('Publish', 18)}<span>${pub}</span></button>`;
    const bar = $('[data-viewing]');
    bar.hidden = !view;
    if (view) {
      bar.innerHTML = owner
        ? `${icon('Preview', 18)}<span>${esc(T('Seeing the line as {who}. What they cannot see is faded.', { who: viewer() }))}</span> <button type="button" class="link" data-view="">${T('Back to your view')}</button>`
        : `${icon('Preview', 18)}<span>${esc(T('This is the line as {who} sees it.', { who: viewer() }))}</span>`;
    }
  }

  // ---------- the map: every block a ring on the track, its label over it ----------
  const RING = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7"/></svg>';
  function station(id) {
    const b = eff(id), here = live(id), ppl = peopleIn(b), rv = reach(id);
    const nobody = PERSON.includes(b.kind) && b.state !== 'removed' && !ppl.length;
    const tags = [];
    if (b.state === 'added') tags.push(`<span class="st-x draft">${T('New in the draft')}</span>`);
    if (b.state === 'removed') tags.push(`<span class="st-x">${T('Removed in the draft')}</span>`);
    if (b.state === 'removed' && here.length) tags.push(`<span class="st-x bad">${esc(NO.n(here.length, '{n} job still in it', '{n} jobs still in it'))}</span>`);
    if (nobody) tags.push(`<span class="st-x bad">${T('Nobody holds it')}</span>`);
    if (rv === 'history') tags.push(`<span class="st-x">${T('Its history only')}</span>`);
    if (rv === 'none') tags.push(`<span class="st-x">${T('Not seen')}</span>`);
    const n = countFor(b);
    const count = n == null || rv !== 'full' ? '' : `<i class="st-c"><span aria-hidden="true">${n}</span><span class="sr">, ${esc(NO.n(n, '{n} live job', '{n} live jobs'))}</span></i>`;
    const meta = b.roles.length ? `${N(b.roles.length, '{n} role', '{n} roles')} · ${N(ppl.length, '{n} person', '{n} people')}` : T('Runs by itself');
    // on a phone every block shows its roles and people, since nothing opens there
    const who = phone.matches && b.roles.length ? `<span class="st-who">${b.roles.map((r) => `<span><b>${esc(roleName(r.role))}</b> ${esc(peopleOf(b, r).map(C.name).join(T(', ')) || T('Nobody yet'))}</span>`).join('')}</span>` : '';
    const label = `<span class="st-t"><span class="st-d">${esc(deptLine(b))}</span><span class="st-n">${glyph(b.stroke, b.state === 'added')}<b>${esc(T(b.name))}</b>${count ? `&nbsp;${count}` : ''}</span><span class="st-m">${esc(meta)}</span>${who}${tags.join('')}</span>`;
    const ring = `<span class="st-dot" data-dot="${id}">${RING}</span>`;
    const side = sideOf(id);
    const cls = ['st', side ? 'side' : '', id === sel && !phone.matches ? 'on' : '', `is-${b.state}`, nobody ? 'is-nobody' : '', rv !== 'full' ? `is-${rv}` : ''].filter(Boolean).join(' ');
    const inner = phone.matches ? `<div class="st-btn">${ring}${label}</div>`
      : `<button type="button" class="st-btn" data-pick="${id}" aria-expanded="${id === sel}" aria-controls="ln2-insp">${ring}${label}</button>`;
    return `<li class="${cls}" data-st="${id}">${inner}</li>`;
  }
  // the block types and the inspector open under the selected block when the map is a column, so the rail keeps
  // running beside them
  const insp = $('[data-insp]'), pal = $('[data-palette]'), inspHome = document.createComment('inspector');
  pal.before(inspHome);
  function renderStations() {
    inspHome.after(pal, insp);
    // a block beside the line comes after the block it leaves from, in the reading order
    $('[data-stations]').innerHTML = main.map((id) => station(id) + sides.filter((s) => s.from === id).map((s) => s.ids.map(station).join('')).join('')).join('');
    const li = vertical.matches && !phone.matches ? $(`[data-st="${sel}"]`) : null;
    if (li) li.append(pal, insp);
  }

  // A polyline with rounded bends: every corner becomes a quadratic curve of radius r (as the Line screen draws it).
  function rounded(pts, r) {
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [a, p, b] = [pts[i - 1], pts[i], pts[i + 1]];
      const l1 = Math.hypot(p[0] - a[0], p[1] - a[1]), l2 = Math.hypot(b[0] - p[0], b[1] - p[1]);
      const k1 = Math.min(r, l1 / 2) / (l1 || 1), k2 = Math.min(r, l2 / 2) / (l2 || 1);
      d += `L${(p[0] - (p[0] - a[0]) * k1).toFixed(1)} ${(p[1] - (p[1] - a[1]) * k1).toFixed(1)}Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${(p[0] + (b[0] - p[0]) * k2).toFixed(1)} ${(p[1] + (b[1] - p[1]) * k2).toFixed(1)}`;
    }
    const z = pts[pts.length - 1];
    return `${d}L${z[0].toFixed(1)} ${z[1].toFixed(1)}`;
  }
  // geometry, in px: a side lane sits 56 below the line in a row; ways back step 20 apart at half weight; in a column
  // every lane is a column 26 apart beside the rail
  const LANE = { side: 56, back: 20, col: 26 };
  // where a block sits along the line, counted in blocks: a block beside it, between where its lane leaves and meets it
  function pos(id) {
    const s = sideOf(id);
    if (!s) return main.indexOf(id);
    const a = main.indexOf(s.from), b = main.indexOf(s.to);
    return a + ((b - a) * (s.ids.indexOf(id) + 1)) / (s.ids.length + 1);
  }
  // lanes: each route takes the nearest lane where no other route covers the same stretch of line; two that meet at a
  // block take two lanes, or they would read as one route running through it
  function lanes(routes) {
    const used = [];
    routes.forEach((r) => {
      let lane = 1;
      while (used.some((u) => u.lane === lane && r.a <= u.b && u.a <= r.b)) lane++;
      used.push({ lane, a: r.a, b: r.b });
      r.lane = lane;
    });
    return routes;
  }
  function draw() {
    const inner = $('[data-in]'), svg = $('[data-tracks]');
    const v = vertical.matches, rtl = getComputedStyle(inner).direction === 'rtl';
    const span = (x, y) => [Math.min(pos(x), pos(y)), Math.max(pos(x), pos(y))];
    const sideR = sides.map((s) => ({ s, a: main.indexOf(s.from), b: main.indexOf(s.to) }));
    const backR = backs().map((k) => { const [a, b] = span(k.from, k.to); return { k, a, b, deep: sideR.some((r) => a < r.b && r.a < b) }; }).sort((x, y) => (x.b - x.a) - (y.b - y.a));
    if (v) {
      // in a column the side lanes come first beside the rail, then the ways back; the rail moves in by one lane for each
      lanes(sideR.concat(backR));
      const used = Math.max(0, ...sideR.concat(backR).map((r) => r.lane));
      inner.style.removeProperty('--col');
      inner.style.paddingInline = '';
      inner.style.setProperty('--rail', `${24 + used * LANE.col}px`);
      sideR.forEach((r) => r.s.ids.forEach((id) => { const li = $(`[data-st="${id}"]`, inner); li.style.left = ''; li.style.top = ''; li.style.setProperty('--lane', r.lane); }));
    } else {
      // in a row the blocks share the width evenly (Beck's even spacing), between 112 and 200 px each (eight fit a 1280
      // screen with the sidebar open), from where the page column starts; a way back that crosses a side lane runs under
      // the side blocks' names, the others close to the line
      lanes(backR.filter((r) => !r.deep));
      lanes(backR.filter((r) => r.deep));
      const map = inner.parentElement, edge = Math.max(phone.matches ? 16 : 32, (map.clientWidth - 1440) / 2);
      inner.style.setProperty('--col', `${Math.floor(Math.min(200, Math.max(112, (map.clientWidth - 2 * edge) / main.length)))}px`);
      inner.style.paddingInline = `${edge}px`;
      inner.style.removeProperty('--rail');
    }
    const box = inner.getBoundingClientRect();
    const at = (id) => { const r = $(`[data-dot="${id}"]`, inner).getBoundingClientRect(); return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top]; };
    // along: the axis the line runs on; across: the axis lanes step out on (down in a row, toward the start edge in a column)
    const ax = v ? 1 : 0, cx = 1 - ax, out = v ? (rtl ? 1 : -1) : 1;
    const P = (along, across) => (v ? [across, along] : [along, across]);
    const c0 = at(main[0])[cx];
    let sideBottom = 0;
    if (!v) {
      // a side block sits on its lane, spaced evenly between where the lane leaves the line and where it meets it
      sideR.forEach(({ s }) => {
        const A = at(s.from), B = at(s.to);
        s.ids.forEach((id, k) => {
          const li = $(`[data-st="${id}"]`, inner);
          // placed in one step from what is known (where its ring sits in it, where the list sits in the map), so no
          // frame ever shows it anywhere else
          const dot = $('[data-dot]', li), list = li.offsetParent.offsetTop, top = c0 + LANE.side - (dot.offsetTop + dot.offsetHeight / 2) - list;
          li.style.left = `${A[0] + ((B[0] - A[0]) * (k + 1)) / (s.ids.length + 1) - li.offsetWidth / 2}px`;
          li.style.top = `${top}px`;
          sideBottom = Math.max(sideBottom, list + top + li.offsetHeight - c0);
        });
      });
    }
    const depthOf = (r) => (v ? r.lane * LANE.col : r.deep ? sideBottom + 16 + r.lane * LANE.back : 8 + r.lane * LANE.back);
    const st = (id) => blocks[id].state;
    // seen as a role, a stretch of track between two blocks it does not hold fades with them
    const reached = {};
    all().forEach((id) => { reached[id] = reach(id); });
    const dim = (a, b) => (view && reached[a] !== 'full' && reached[b] !== 'full' ? ' dim' : '');
    const hop = (a, b) => (st(a) === 'added' || st(b) === 'added' ? ' draft' : st(a) === 'removed' || st(b) === 'removed' ? ' gone' : '') + dim(a, b);
    // the faded stretches are drawn as one faded group, so two of them meeting at a ring do not darken each other
    let paths = '', faint = '';
    const path = (cls, d) => { if (cls.includes(' dim')) faint += `<path class="${cls.replace(' dim', '')}" d="${d}"/>`; else paths += `<path class="${cls}" d="${d}"/>`; };
    // the line, hand-off by hand-off between the blocks the draft keeps: one the published line has is ink, a new one
    // (into, out of or past a block the draft adds or removes) is the dashed pen
    const kept = main.filter((id) => st(id) !== 'removed');
    for (let i = 1; i < kept.length; i++) {
      const a = kept[i - 1], b = kept[i], A = at(a), B = at(b);
      const pub = st(a) === 'pub' && st(b) === 'pub' && PUB.indexOf(b) === PUB.indexOf(a) + 1;
      path(`tk${pub ? '' : ' draft'}${dim(a, b)}`, `M${A[0].toFixed(1)} ${A[1].toFixed(1)}L${B[0].toFixed(1)} ${B[1].toFixed(1)}`);
    }
    // a side lane leaves at 45°, runs beside the line through its blocks and meets the line again at 45°
    sideR.forEach((r) => {
      const s = r.s, A = at(s.from), B = at(s.to), a1 = A[ax], a2 = B[ax], dir = Math.sign(a2 - a1) || 1;
      const Dp = v ? r.lane * LANE.col : LANE.side, diag = Math.min(Dp, Math.abs(a2 - a1) / 2 - 4), lane = c0 + out * Dp;
      const ids = [s.from].concat(s.ids, [s.to]), stops = s.ids.map(at);
      const pts = [A, P(a1 + dir * diag, c0 + out * diag)];
      if (diag < Dp) pts.push(P(a1 + dir * diag, lane));
      const seg = [pts];
      stops.forEach((p) => { seg[seg.length - 1].push(p); seg.push([p]); });
      const last = seg[seg.length - 1];
      if (diag < Dp) last.push(P(a2 - dir * diag, lane));
      last.push(P(a2 - dir * diag, c0 + out * diag), B);
      seg.forEach((pp, i) => path(`tk side${hop(ids[i], ids[i + 1])}`, rounded(pp, 14)));
    });
    // a way back turns square under the line at half weight: down from the block that sends it, back, up into the one it returns to
    backR.forEach((r) => {
      const A = at(r.k.from), B = at(r.k.to), c = c0 + out * depthOf(r);
      path(`tk back${hop(r.k.from, r.k.to)}`, rounded([A, P(A[ax], c), P(B[ax], c), B], 12));
    });
    // room under the line for the lanes and the side blocks' names
    if (!v) {
      const deepest = Math.max(sideBottom, ...backR.map(depthOf));
      inner.style.paddingBlockEnd = `${Math.max(32, deepest + 32)}px`;
    } else inner.style.paddingBlockEnd = '';
    svg.setAttribute('width', inner.scrollWidth);
    svg.setAttribute('height', inner.scrollHeight);
    svg.innerHTML = (faint ? `<g class="dim">${faint}</g>` : '') + paths;
  }
  let queued = false;
  // a timer, not a frame callback: a resize can queue it from the observer without looping it
  const requestDraw = () => { if (!queued) { queued = true; setTimeout(() => { queued = false; draw(); }, 0); } };

  // the legend keys only what this line has
  function renderLegend() {
    const any = (s) => all().some((id) => blocks[id].state === s);
    const rows = [
      [true, `<svg viewBox="0 0 40 20"><path d="M2 10h36" class="lg-tk"/><circle cx="20" cy="10" r="7" class="lg-r"/></svg>`, T('A block: work changes hands here')],
      [any('added'), `<svg viewBox="0 0 40 20"><path d="M2 10h36" class="lg-tk draft"/><circle cx="20" cy="10" r="7" class="lg-r draft"/></svg>`, T('New in the draft, until the version is published')],
      [any('removed'), `<svg viewBox="0 0 40 20"><path d="M2 10h36" class="lg-tk gone"/><circle cx="20" cy="10" r="7" class="lg-r gone"/></svg>`, T('Removed in the draft')],
      [sides.length, `<svg class="flow" viewBox="0 0 40 20"><path d="M2 4h10l12 12h14" class="lg-tk"/></svg>`, T('A block that runs beside the line')],
      [backs().length, `<svg viewBox="0 0 40 20"><path d="M34 3v7a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V3" class="lg-tk back"/></svg>`, T('A way back to an earlier block')],
    ];
    $('[data-legend]').innerHTML = rows.filter((r) => r[0]).map((r) => `<li>${r[1].replace('<svg ', '<svg aria-hidden="true" ')}<span>${esc(r[2])}</span></li>`).join('')
      + `<li class="lg-k"><span class="lg-gs">${glyph('struck')}${glyph('held')}</span><span>${T('A person works or decides')}</span></li><li class="lg-k"><span class="lg-gs">${glyph('run')}</span><span>${T('Runs by itself')}</span></li>`;
  }

  // ---------- the block types: pressing one adds a block of that type after the selected block, in the draft ----------
  function renderPalette() {
    const el = $('[data-palette]');
    el.hidden = !editable();
    if (el.hidden) return;
    const b = eff(sel);
    const btn = (x) => `<li><button type="button" class="pal-b" data-type="${x.id}" aria-describedby="ln2-pal-at"><span class="pal-m">${typeMark(x)}</span><span>${esc(T(x.name))}</span></button></li>`;
    el.innerHTML = `<div class="pal-h"><h2 id="ln2-pal-h">${T('Add a block')}</h2><p id="ln2-pal-at">${T('After {block}, in the draft', { block: `<b>${esc(T(b.name))}</b>` })}</p></div>
<div class="pal-gs"><div class="pal-g"><p>${T('The core’s eight')}</p><ul class="pal-l">${CORE.map(btn).join('')}</ul></div>
${PACK.length ? `<div class="pal-g"><p>${esc(T('{pack} pack', { pack: T(O.pack) }))}</p><ul class="pal-l">${PACK.map(btn).join('')}</ul></div>` : ''}</div>`;
  }

  // ---------- the inspector: the selected block, in three tabs ----------
  const TABS = [['people', 'People and roles', 'People'], ['sees', 'What it sees', 'Preview'], ['settings', 'Settings', 'Settings']];
  function renderInsp() {
    const b = eff(sel), here = live(sel), rv = reach(sel);
    if (phone.matches) { insp.innerHTML = ''; return; }
    const tags = [];
    if (b.state === 'added') tags.push(`<span class="st-x draft">${T('New in the draft')}</span>`);
    if (b.state === 'removed') tags.push(`<span class="st-x">${T('Removed in the draft')}</span>`);
    if (b.state === 'removed' && here.length) tags.push(`<span class="st-x bad">${esc(NO.n(here.length, '{n} job still in it: the publish page asks where it goes', '{n} jobs still in it: the publish page asks where they go'))}</span>`);
    if (PERSON.includes(b.kind) && b.state !== 'removed' && !peopleIn(b).length) tags.push(`<span class="st-x bad">${T('Nobody holds it')}</span>`);
    const sub = [deptLine(b), b.kind === 'work' && !b.pack ? T(b.ty.name) : '', NO.n(here.length, '{n} live job', '{n} live jobs')].filter(Boolean).join(' · ');
    const vw = view && rv !== 'full' ? `<p class="in-vw">${icon('Preview', 18)}<span>${esc(rv === 'history' ? T('{who} reads only this block’s history.', { who: viewer() }) : T('{who} does not see this block.', { who: viewer() }))}</span></p>` : '';
    const panel = { people: panelPeople, sees: panelSees, settings: panelSettings };
    insp.innerHTML = `<div class="in-h"><span class="in-g">${glyph(b.stroke, b.state === 'added')}</span><div class="in-ht"><h2 id="ln2-insp-h">${esc(T(b.name))}</h2><p>${esc(sub)}</p></div>${tags.length ? `<div class="in-tags">${tags.join('')}</div>` : ''}</div>${vw}
<div class="in-tabs" role="tablist" aria-label="${esc(T('About {block}', { block: T(b.name) }))}">${TABS.map(([id, name, ic]) => `<button type="button" role="tab" id="in-t-${id}" aria-controls="in-p-${id}" aria-selected="${id === tab}" tabindex="${id === tab ? 0 : -1}" data-tab="${id}">${icon(ic, 18)}<span>${esc(T(name))}</span></button>`).join('')}</div>
${TABS.map(([id]) => {
      // a block's settings are the owner's: no role sees them, so they fade whoever the line is seen as
      const faded = view && (rv !== 'full' || id === 'settings');
      const why = view && id === 'settings' && rv === 'full' ? `<p class="in-vw">${icon('Lock', 18)}<span>${esc(T('{who} does not see the block’s settings.', { who: viewer() }))}</span></p>` : '';
      return `<div class="in-p${faded ? ' is-faded' : ''}" role="tabpanel" id="in-p-${id}" aria-labelledby="in-t-${id}" tabindex="0"${id === tab ? '' : ' hidden'}>${why}<fieldset class="in-fs"${editable() ? '' : ' disabled'}>${panel[id](b)}</fieldset></div>`;
    }).join('')}`;
  }
  const other = (b, r) => (view && !viewRoles(b).includes(r) ? ' is-other' : '');
  const seg = (name, list, val, label, data) => `<div class="seg" role="radiogroup" aria-label="${esc(label)}">${list.map(([v, t]) => `<label><input type="radio" name="${name}" value="${v}"${v === val ? ' checked' : ''} ${data}><span>${esc(T(t))}</span></label>`).join('')}</div>`;

  // People and roles: who holds each role, how many actions it may take, which items it sees; people apply at once
  function panelPeople(b) {
    const roles = b.roles.map((r, i) => {
      const ppl = peopleOf(b, r), n = ACTS.filter((a) => canAct(b, r, a[0])).length;
      const teams = {}, solo = [];
      ppl.forEach((k) => { const tm = O.people[k].team; if (tm) (teams[tm] = teams[tm] || []).push(k); else solo.push(k); });
      const rm = (data, label) => `<button type="button" class="ic-x" ${data} aria-label="${esc(label)}" title="${esc(label)}">${icon('Discard', 18)}</button>`;
      const person = (k) => {
        const p = O.people[k];
        const what = p.type === 'freelancer' && p.until ? T('Freelancer until {date}', { date: FLOW.date(`${p.until}T00:00`) }) : p.type === 'invited' ? T('Invited, not joined yet') : T(p.title);
        return `<li><span class="me-av" aria-hidden="true">${esc(T(p.name).charAt(0))}</span><span class="pr-pt"><b>${esc(C.name(k))}</b><small>${esc(what)}</small></span>${rm(`data-rm="${k}" data-ri="${i}"`, T('Take {name} out of {role}', { name: C.name(k), role: roleName(r.role) }))}</li>`;
      };
      const team = (tm) => `<li class="pr-team"><span class="pr-tm" aria-hidden="true">${icon('People', 18)}</span><span class="pr-pt"><b>${esc(T(tm))}</b><small>${esc(teams[tm].map(C.name).join(T(', ')))}</small></span>${rm(`data-rm-team="${esc(tm)}" data-ri="${i}"`, T('Take {name} out of {role}', { name: T(tm), role: roleName(r.role) }))}</li>`;
      // what can be added: a whole team, then each person not in the role yet
      const free = Object.keys(O.people).filter((k) => !ppl.includes(k));
      const freeTeams = [...new Set(free.map((k) => O.people[k].team).filter(Boolean))];
      const menu = freeTeams.map((tm) => `<button type="button" data-add-team="${esc(tm)}" data-ri="${i}">${icon('People', 18)}<span><b>${esc(T(tm))}</b><small>${esc(T('A team: everyone in it'))}</small></span></button>`).join('')
        + free.map((k) => `<button type="button" data-add="${k}" data-ri="${i}"><span class="me-av" aria-hidden="true">${esc(T(O.people[k].name).charAt(0))}</span><span><b>${esc(C.name(k))}</b><small>${esc(T(O.people[k].title))}</small></span></button>`).join('');
      const kind = KINDS.find((x) => x[0] === roleKind(b, r))[1];
      return `<li class="pr-r${other(b, r)}${r.state === 'added' ? ' is-added' : ''}">
<div class="pr-h">${r.state === 'added' && editable() ? `<h3 class="sr">${esc(roleName(r.role))}</h3><label class="sr" for="pr-name-${i}">${T('Name of the new role')}</label><input class="pr-name" id="pr-name-${i}" data-role-name data-ri="${i}" value="${esc(roleName(r.role))}" maxlength="32" autocomplete="off">` : `<h3>${esc(roleName(r.role))}</h3>`}<span class="pr-k">${esc(T(kind))}${r.state === 'added' ? ` · ${T('New in the draft')}` : ''}</span><span class="pr-a">${esc(T('{n} of {all} actions', { n, all: ACTS.length }))}</span></div>
${ppl.length ? `<ul class="pr-pl">${Object.keys(teams).map(team).join('')}${solo.map(person).join('')}</ul>` : `<p class="pr-none">${T('Nobody is in this role yet.')}</p>`}
<div class="pr-f"><div class="pr-add"><button type="button" class="link" id="pr-add-b-${i}" data-menu aria-expanded="false" aria-controls="pr-add-${i}">${icon('Invite', 18)}<span>${T('Add a person or team')}</span></button><div class="ln2-menu" id="pr-add-${i}" hidden>${menu || `<span>${T('Everyone is in this role already.')}</span>`}</div></div>
<div class="pr-s"><span id="pr-s-${i}">${T('Sees')}</span>${seg(`sees-${i}`, SEES, seesItems(b, r), T('Which items {role} sees', { role: roleName(r.role) }), `data-sees data-ri="${i}"`)}</div></div></li>`;
    }).join('');
    const none = PERSON.includes(b.kind) ? T('Nobody holds this block yet. Add a role, then its people.') : T('This block runs by itself: no person works in it.');
    return `<p class="in-hint">${icon('People', 18)}<span>${T('People apply at once; new roles wait for the version.')}</span></p>
${b.roles.length ? `<ul class="pr-l">${roles}</ul>` : `<p class="in-none">${esc(none)}</p>`}
<div class="pr-new"><p id="pr-new-h">${T('Add a role')}</p><div class="pr-new-l" role="group" aria-labelledby="pr-new-h">${KINDS.map(([k, n]) => `<button type="button" class="btn small" data-role-kind="${k}">${icon('Create', 16)}<span>${esc(T(n))}</span></button>`).join('')}</div></div>`;
  }

  // What it sees: the line's fields by the block's roles, the history of other blocks, the actions, which items; then
  // the preview, the fastest way to read a role's rights
  function panelSees(b) {
    if (!b.roles.length) return `<p class="in-none">${T('No role works in this block, so nobody sees it from here.')}</p>`;
    const R = b.roles, fk = Object.keys(fields);
    const head = (first) => `<tr><th scope="col">${esc(first)}</th>${R.map((r) => `<th scope="col" class="${other(b, r)}">${esc(roleName(r.role))}</th>`).join('')}</tr>`;
    const rows = fk.map((f) => {
      const d = fields[f];
      const tag = d.secret ? `<span class="sw-sec">${icon('Lock', 14)}${T('Secret')}</span>` : d.state === 'added' ? `<span class="sw-new">${T('New in the draft')}</span>` : '';
      return `<tr${d.state === 'added' ? ' class="is-added"' : ''}><th scope="row"><span class="sw-f"><b>${esc(T(d.name))}</b>${tag}</span>${d.secret ? `<small>${T('Hidden from every role until one is given it')}</small>` : ''}</th>
${R.map((r, i) => `<td class="${other(b, r)}">${seg(`acc-${i}-${f}`, ACCESS, fieldMode(b, r, f), T('{field}, {role}', { field: T(d.name), role: roleName(r.role) }), `data-acc="${f}" data-ri="${i}"`)}</td>`).join('')}</tr>`;
    }).join('');
    const others = all().filter((id) => id !== b.id && blocks[id].state !== 'removed');
    const histRows = R.map((r, i) => `<div class="hs-r${other(b, r)}"><p>${esc(roleName(r.role))}</p><div class="hs-l">${others.map((id) => `<label class="hs-c"><input type="checkbox" data-hist="${id}" data-ri="${i}"${readsHist(b, r, id) ? ' checked' : ''}><span>${esc(T(eff(id).name))}</span></label>`).join('')}</div></div>`).join('');
    const actRows = ACTS.map(([a, name]) => `<tr><th scope="row">${esc(T(name))}</th>${R.map((r, i) => {
      const on = canAct(b, r, a);
      return `<td class="${other(b, r)}"><label class="yn"><input type="checkbox" data-act="${a}" data-ri="${i}"${on ? ' checked' : ''} aria-label="${esc(T('{role}: {action}', { role: roleName(r.role), action: T(name) }))}"><span aria-hidden="true">${on ? T('Yes') : T('No')}</span></label></td>`;
    }).join('')}</tr>`).join('');
    const seesRow = `<tr><th scope="row">${T('Sees which items')}</th>${R.map((r, i) => `<td class="${other(b, r)}"><label class="sr" for="sw-sees-${i}">${esc(T('Which items {role} sees', { role: roleName(r.role) }))}</label><select id="sw-sees-${i}" data-sees data-ri="${i}">${SEES.map(([v, t]) => `<option value="${v}"${v === seesItems(b, r) ? ' selected' : ''}>${esc(T(t))}</option>`).join('')}</select></td>`).join('')}</tr>`;
    return `<div class="sw-grid"><div class="sw-main">
<p class="in-hint">${icon('Draft', 18)}<span>${T('Takes effect when the version is published.')}</span></p>
<h3>${T('Fields')}</h3>
<div class="sw-wrap"><table class="sw-t"><thead>${head(T('Field'))}</thead><tbody>${rows}</tbody></table></div>
<h3 title="${T('Whether the role reads what happened to an item before it came here: why the script was sent back, say.')}">${T('Reads the history of other blocks')}</h3>
<div class="hs">${histRows}</div>
<h3 title="${T('The same list in every organization, because the server checks it on every request. Packs alone add to it.')}">${T('Actions')}</h3>
<div class="sw-wrap"><table class="sw-t sw-a"><thead>${head(T('Action'))}</thead><tbody>${actRows}${seesRow}</tbody></table></div>
</div><aside class="sw-pv" aria-labelledby="sw-pv-h">${preview(b)}</aside></div>`;
  }
  // the preview: everything a role is shown in this block, and what it is not
  function preview(b) {
    const R = b.roles, vr = view ? viewRoles(b) : [];
    if (pv == null || !R[pv]) pv = vr.length ? R.indexOf(vr[0]) : Math.max(0, R.findIndex((r) => roleKind(b, r) !== 'responsible'));
    const r = R[pv], fk = Object.keys(fields);
    const shown = [], not = [];
    fk.forEach((f) => {
      const m = fieldMode(b, r, f), d = fields[f], nm = T(d.name);
      if (m === 'hidden') not.push(nm);
      else shown.push(m === 'write' ? T(d.type === 'file' ? '{field}: uploads it' : '{field}: writes it', { field: nm }) : T('{field}: reads it', { field: nm }));
    });
    const hs = all().filter((id) => id !== b.id && blocks[id].state !== 'removed' && readsHist(b, r, id)).map((id) => T(eff(id).name));
    if (hs.length) shown.push(T('The history of {blocks}', { blocks: hs.join(T(', ')) }));
    const scope = { assigned: 'Only the jobs given to them', team: 'Their team’s jobs', all: 'Every job in the block' }[seesItems(b, r)];
    shown.push(NO.t(scope));
    const yes = ACTS.filter(([a]) => a !== 'open' && canAct(b, r, a)), no = ACTS.filter(([a]) => !canAct(b, r, a));
    // the buttons, in one line each way; the four that manage the block are named together when none is given
    const names = (list) => list.map(([, n]) => T(n)).join(T(', '));
    if (yes.length) shown.push(T('Buttons: {actions}', { actions: names(yes) }));
    const allManage = MANAGE.every((a) => no.some((x) => x[0] === a)), rest = allManage ? no.filter(([a]) => !MANAGE.includes(a)) : no;
    if (rest.length) not.push(T('Buttons: {actions}', { actions: names(rest) }));
    if (allManage) not.push(T('The buttons that manage the block'));
    const pick = R.length > 1 ? `<label class="sr" for="sw-pv-r">${T('Preview the block as')}</label><select id="sw-pv-r" data-pv>${R.map((x, i) => `<option value="${i}"${i === pv ? ' selected' : ''}>${esc(T(x.role))}</option>`).join('')}</select>` : '';
    return `<h3 id="sw-pv-h">${T('Preview')}</h3>${pick}
<p class="pv-s">${esc(T('This is how {role} sees this block:', { role: roleName(r.role) }))}</p>
<ul class="pv-l">${shown.map((x) => `<li>${icon('Done', 16)}<span>${esc(x)}</span></li>`).join('')}</ul>
${not.length ? `<p class="pv-n">${T('Does not see')}</p><ul class="pv-l off">${not.map((x) => `<li>${icon('Lock', 16)}<span>${esc(x)}</span></li>`).join('')}</ul>` : ''}
<p class="hint">${T('What is hidden never reaches their browser.')}</p>`;
  }

  // Settings: the block's name, department, type, time, way back and how it runs; each a change of the draft
  function panelSettings(b) {
    const opts = (list, val) => list.map(([v, t]) => `<option value="${esc(v)}"${v === val ? ' selected' : ''}>${esc(t)}</option>`).join('');
    const earlier = (sideOf(b.id) ? [sideOf(b.id).from] : main.slice(0, main.indexOf(b.id))).filter((id) => blocks[id].state !== 'removed');
    const approves = b.kind === 'approval' || b.kind === 'watar' || !!b.approve;
    const ppl = Object.keys(O.people).filter((k) => O.people[k].type !== 'invited').map((k) => [k, C.name(k)]);
    const run = b.run, full = run.mode === 'Fully automatic';
    const missing = full ? [['accept', T('a named person’s acceptance')], ['cap', T('a daily cap')], ['failures', T('a person to take failures')]].filter(([k]) => !run[k]) : [];
    const mine = b.state === 'added' && b.mine, removedNow = D.mine.some((c) => c.op && c.op.op === 'remove' && c.op.block === b.id);
    const end = mine ? `<button type="button" class="btn" data-takeback>${icon('Undo', 18)}<span>${T('Take back this new block')}</span></button>`
      : removedNow ? `<button type="button" class="btn" data-keep>${icon('Undo', 18)}<span>${T('Keep the block')}</span></button>`
        : b.state === 'pub' ? `<button type="button" class="btn quiet" data-remove>${icon('Discard', 18)}<span>${T('Remove the block in the draft')}</span></button>`
          : b.state === 'removed' ? `<p class="hint">${esc(NO.t('Removed in the draft. When you publish, the publish page asks where its live jobs go.'))}</p>` : '';
    return `<p class="in-hint">${icon('Draft', 18)}<span>${T('Takes effect when the version is published.')}</span></p>
<div class="set-f">
<div class="field"><label for="set-name">${T('Name')}</label><input id="set-name" data-set="name" value="${esc(T(b.name))}" maxlength="40" autocomplete="off"></div>
<div class="field"><label for="set-dept">${T('Department')}</label><select id="set-dept" data-set="dept">${opts(O.departments.map((d) => [d.id, T(d.name)]), b.dept)}</select></div>
<div class="field"><label for="set-type">${T('Type')}</label><select id="set-type" data-set="type">${opts(TYPES.map((x) => [x.id, T(x.name)]), b.ty.id)}</select></div>
<div class="field"><label for="set-hours">${T('Expected time')}</label><span class="set-n"><input id="set-hours" type="number" inputmode="numeric" min="1" max="999" data-set="hours" value="${b.hours}"><span>${T('hours')}</span></span></div>
${approves ? `<div class="field"><label for="set-back">${T('Where an approval sends work back')}</label><select id="set-back" data-set="back">${opts([['', T('Nowhere')]].concat(earlier.map((id) => [id, T(eff(id).name)])), b.back)}</select></div>` : ''}
</div>
<fieldset class="md"><legend>${T('How it runs')}</legend><p class="hint">${T('Changing the mode takes effect when the version is published.')}</p>
<div class="md-l">${MODES.map(([m, d], i) => `<label class="md-o"><input type="radio" name="md" value="${esc(m)}" data-mode${m === run.mode ? ' checked' : ''}><span class="md-t"><b>${i + 1}. ${esc(T(m))}</b><small>${esc(T(d))}</small></span></label>`).join('')}</div>
${full ? `<div class="md-req"><p>${T('Fully automatic is published only with all three:')}</p>
<div class="md-rf"><div class="field"><label for="md-accept">${T('Accepted by')}</label><select id="md-accept" data-auto="accept">${opts([['', T('Nobody yet')]].concat(ppl), run.accept || '')}</select></div>
<div class="field"><label for="md-cap">${T('Daily cap')}</label><span class="set-n"><input id="md-cap" type="number" inputmode="numeric" min="1" max="9999" data-auto="cap" value="${run.cap || ''}"><span>${T('per day')}</span></span></div>
<div class="field"><label for="md-fail">${T('Failures go to')}</label><select id="md-fail" data-auto="failures">${opts([['', T('Nobody yet')]].concat(ppl), run.failures || '')}</select></div></div>
${missing.length ? `<p class="md-bad">${icon('Late', 16)}<span>${esc(T('It cannot be published without {what}.', { what: missing.map((m) => m[1]).join(T(', ')) }))}</span></p>` : ''}</div>` : ''}
</fieldset>
<div class="set-x">${end}</div>`;
  }

  // ---------- rendering, in one pass ----------
  function renderAll() {
    build();
    if (!blocks[sel]) sel = main.find((id) => blocks[id]) || main[0];
    renderHead();
    renderStations();
    renderLegend();
    renderPalette();
    renderInsp();
    draw();
    url();
  }
  // after a redraw, the focus returns to the control it was on (they keep their ids and data)
  function keepFocus(fn) {
    const a = document.activeElement, id = a && a.id;
    let data = a && a.dataset ? Object.entries(a.dataset).map(([k, v]) => `[data-${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}="${CSS.escape(v)}"]`).join('') : '';
    if (data && a.type === 'radio') data += `[value="${CSS.escape(a.value)}"]`;
    fn();
    const back = (id && document.getElementById(id)) || (data && $(data));
    if (back && back !== document.activeElement) back.focus({ preventScroll: true });
  }

  function note(text, fn) {
    const el = $('[data-note]');
    $('[data-note-t]').textContent = text;
    undo = fn;
    el.hidden = false;
    clearTimeout(note.t);
    note.t = setTimeout(() => { el.hidden = true; undo = null; }, 8000);
  }

  // a role's name in the page's language; a second role of one kind is named with its number ("Contributor 2")
  const roleName = (name) => { const m = /^(.+) (\d+)$/.exec(name); return m && T(m[1]) !== m[1] ? `${T(m[1])} ${m[2]}` : T(name); };

  // ---------- what the owner does ----------
  const roleAt = (el) => eff(sel).roles[+el.dataset.ri];
  function addBlock(type) {
    const ty = TYPES.find((x) => x.id === type), at = eff(sel);
    const id = `new-${type}-${Date.now().toString(36)}`;
    const before = C.draft().mine;
    C.change({ type: 'add', block: id, text: 'Added {block} after {after}', vars: { block: ty.name, after: at.name }, op: { op: 'add', id, type, after: sel } });
    sel = id;
    pv = null;
    renderAll();
    note(T('In the draft: {change}', { change: T('Added {block} after {after}', { block: T(ty.name), after: T(at.name) }) }), () => { setMine(before); renderAll(); });
    const pick = $(`[data-pick="${id}"]`);
    if (pick) pick.focus({ preventScroll: true });
    const li = $(`[data-st="${id}"]`);
    if (li && !window.Beats.reduce()) li.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(0.2,0,0,1)' });
  }
  function changePeople(b, r, list, text) {
    const was = peopleOf(b, r);
    setPeople(b, r, list);
    keepFocus(renderAll);
    note(text, () => { setPeople(b, r, was); renderAll(); });
  }

  // a role the draft adds is named here: its change, the changes to its rights and its people follow the new name
  function renameRole(b, r, name) {
    if (!name || name === r.role || b.roles.some((x) => x.role === name)) { keepFocus(renderAll); return; }
    const before = C.draft().mine;
    setMine(before.map((c) => {
      if (!c.op || c.op.block !== b.id || c.op.role !== r.role) return c;
      const x = clone(c);
      x.op.role = name;
      if (x.vars && x.vars.role === r.role) x.vars.role = name;
      return x;
    }));
    const k = key(b.id, r.role);
    if (people[k]) { people[key(b.id, name)] = people[k]; delete people[k]; FLOW.store.set(PKEY, JSON.stringify(people)); }
    keepFocus(renderAll);
    note(T('In the draft: {change}', { change: T('Added the role {role} to {block}', { role: name, block: T(b.name) }) }), () => { setMine(before); renderAll(); });
  }

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button, a');
    if (!t || t.getAttribute('aria-disabled') === 'true' || t.disabled) return;
    const b = eff(sel);
    if (t.dataset.pick) {
      if (t.dataset.pick === sel) return;
      sel = t.dataset.pick;
      pv = null;
      keepFocus(renderAll);
      if (vertical.matches) insp.scrollIntoView({ block: 'nearest', behavior: window.Beats.reduce() ? 'auto' : 'smooth' });
    } else if (t.hasAttribute('data-view')) {
      if (window.UI) window.UI.closeMenu();
      view = parseView(t.dataset.view);
      pv = null;
      renderAll();
      $('[data-as-btn]').focus();
    } else if (t.hasAttribute('data-undo') && undo) {
      const fn = undo;
      undo = null;
      $('[data-note]').hidden = true;
      fn();
    } else if (t.hasAttribute('data-discard')) {
      const before = C.draft().mine;
      C.discard();
      renderAll();
      note(T('The changes made now are taken back.'), () => { setMine(before); renderAll(); });
      $('[data-undo]').focus();
    } else if (t.dataset.type && editable()) addBlock(t.dataset.type);
    else if (t.dataset.tab) select(t.dataset.tab, false);
    else if (t.dataset.add || t.dataset.addTeam) {
      if (window.UI) window.UI.closeMenu();
      const r = roleAt(t), now = peopleOf(b, r);
      const add = t.dataset.add ? [t.dataset.add] : Object.keys(O.people).filter((k) => O.people[k].team === t.dataset.addTeam && !now.includes(k));
      changePeople(b, r, now.concat(add), T('{name} works in {block} as {role} now.', { name: t.dataset.add ? C.name(t.dataset.add) : T(t.dataset.addTeam), block: T(b.name), role: roleName(r.role) }));
      const btn = $(`#pr-add-b-${t.dataset.ri}`);
      if (btn) btn.focus();
    } else if (t.dataset.rm || t.dataset.rmTeam) {
      const r = roleAt(t), gone = t.dataset.rm ? [t.dataset.rm] : peopleOf(b, r).filter((k) => O.people[k].team === t.dataset.rmTeam);
      changePeople(b, r, peopleOf(b, r).filter((k) => !gone.includes(k)), T('{name} no longer works in {block} as {role}.', { name: t.dataset.rm ? C.name(t.dataset.rm) : T(t.dataset.rmTeam), block: T(b.name), role: roleName(r.role) }));
      const btn = $(`#pr-add-b-${t.dataset.ri}`);
      if (btn) btn.focus();
    } else if (t.dataset.roleKind) {
      const k = KINDS.find((x) => x[0] === t.dataset.roleKind);
      // a new role is named after its kind, as the organization names its own: it can be renamed when it has people
      let name = k[2], n = 1;
      while (b.roles.some((r) => r.role === name)) name = `${k[2]} ${++n}`;
      keepFocus(() => record({ op: 'role', block: b.id, role: name, kind: k[0] }, 'Added the role {role} to {block}', { role: name, block: b.name }));
    } else if (t.hasAttribute('data-remove')) {
      record({ op: 'remove', block: b.id }, 'Removed {block}', { block: b.name });
      $('[data-keep]').focus();
    } else if (t.hasAttribute('data-keep')) {
      record({ op: 'remove', block: b.id }, 'Removed {block}', { block: b.name }, true);
      $('[data-remove]').focus();
    } else if (t.hasAttribute('data-takeback')) {
      const before = C.draft().mine;
      // the new block goes, and every change made to it
      setMine(before.filter((c) => !(c.op && (c.op.id === b.id || c.op.block === b.id || c.op.after === b.id))));
      sel = prev(b.id)[0] || main[0];
      renderAll();
      note(T('{block} is taken out of the draft.', { block: T(b.name) }), () => { setMine(before); sel = b.id; renderAll(); });
      $('[data-undo]').focus();
    }
  });

  // the settings and rights: every control says what it changes, and the change goes to the draft
  root.addEventListener('change', (e) => {
    const t = e.target, b = eff(sel);
    if (!editable() || !blocks[sel]) return;
    const ri = t.dataset.ri != null ? b.roles[+t.dataset.ri] : null;
    if (t.matches('[data-pv]')) { pv = +t.value; keepFocus(renderInsp); return; }
    if (t.dataset.set) {
      const k = t.dataset.set, pub = blocks[sel];
      let v = t.value.trim(), text, vars, same;
      if (k === 'name') {
        if (!v) { t.value = T(b.name); return; }
        // a name typed in another language is kept as typed; the published one stays the English data
        same = v === T(pub.name) || v === pub.name;
        if (same) v = pub.name;
        text = 'Renamed {before} to {block}'; vars = { before: pub.name, block: v };
      } else if (k === 'hours') {
        v = Math.max(1, Math.min(999, Math.round(+v || pub.hours)));
        same = v === pub.hours; text = '{block} is expected to take {hours} hours'; vars = { block: b.name, hours: v };
      } else if (k === 'dept') { same = v === pub.dept; text = '{block} moves to {dept}'; vars = { block: b.name, dept: (O.departments.find((d) => d.id === v) || {}).name }; }
      else if (k === 'type') { same = v === typeOf(pub).id; text = '{block} becomes {type}'; vars = { block: b.name, type: (TYPES.find((x) => x.id === v) || {}).name }; }
      else if (k === 'back') { same = v === (pub.back || ''); text = v ? 'An approval in {block} sends work back to {to}' : 'An approval in {block} no longer sends work back'; vars = { block: b.name, to: v ? eff(v).name : '' }; }
      return keepFocus(() => record({ op: 'set', block: sel, key: k, value: v }, text, vars, same));
    }
    if (t.dataset.mode != null || t.dataset.auto) {
      const run = Object.assign({}, b.run);
      if (t.dataset.mode != null) run.mode = t.value;
      else run[t.dataset.auto] = t.dataset.auto === 'cap' ? Math.max(0, Math.round(+t.value || 0)) || '' : t.value;
      // back to how the published version runs it: no change, unless the seed's draft already changed it
      const pub = defMode(blocks[sel]), seed = D.changes.some((c) => !c.op && c.type === 'mode' && c.block === sel);
      const same = !seed && run.mode === pub && (pub !== 'Fully automatic' || ['accept', 'cap', 'failures'].every((k) => run[k] === defAuto(sel)[k]));
      return keepFocus(() => record({ op: 'set', block: sel, key: 'mode', value: run }, '{block} now runs as {mode}', { block: b.name, mode: run.mode }, same));
    }
    if (!ri) return;
    if (t.hasAttribute('data-role-name')) return renameRole(b, ri, t.value.trim());
    if (t.dataset.acc) {
      const f = t.dataset.acc, m = ACCESS.find((x) => x[0] === t.value)[1];
      return keepFocus(() => record({ op: 'access', block: sel, role: ri.role, field: f, value: t.value }, '{role} in {block}: {field} is now {access}', { role: ri.role, block: b.name, field: fields[f].name, access: m }, t.value === pubField(ri, f)));
    }
    if (t.dataset.act) {
      const a = ACTS.find((x) => x[0] === t.dataset.act);
      return keepFocus(() => record({ op: 'act', block: sel, role: ri.role, act: a[0], value: t.checked }, t.checked ? '{role} in {block} may now: {action}' : '{role} in {block} may no longer: {action}', { role: ri.role, block: b.name, action: a[1] }, t.checked === defActs(b, ri).includes(a[0])));
    }
    if (t.dataset.hist) {
      const of = t.dataset.hist;
      return keepFocus(() => record({ op: 'hist', block: sel, role: ri.role, of, value: t.checked }, t.checked ? '{role} in {block} now reads the history of {of}' : '{role} in {block} no longer reads the history of {of}', { role: ri.role, block: b.name, of: eff(of).name }, t.checked === defHist(sel).includes(of)));
    }
    if (t.dataset.sees != null) {
      const v = SEES.find((x) => x[0] === t.value);
      return keepFocus(() => record({ op: 'sees', block: sel, role: ri.role, value: v[0] }, '{role} in {block} now sees: {sees}', { role: ri.role, block: b.name, sees: v[1] }, v[0] === (ri.sees || 'assigned')));
    }
  });

  // ---------- the tabs: the arrows, Home and End move between them; right to left, the arrows follow the page ----------
  function select(id, focus) {
    tab = id;
    $$('[role="tab"]', insp).forEach((b) => { const on = b.dataset.tab === id; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
    $$('[role="tabpanel"]', insp).forEach((p) => { p.hidden = p.id !== `in-p-${id}`; });
    url();
    requestDraw();
  }
  root.addEventListener('keydown', (e) => {
    const t = e.target.closest('[role="tab"]');
    if (!t) return;
    const list = $$('[role="tab"]', insp), i = list.indexOf(t), dir = I18N.rtl ? -1 : 1;
    const go = { ArrowRight: i + dir, ArrowLeft: i - dir, Home: 0, End: list.length - 1 }[e.key];
    if (go == null) return;
    e.preventDefault();
    select(list[(go + list.length) % list.length].dataset.tab, true);
  });

  // ---------- start: the block named in the address, else the one with the most live work ----------
  build();
  sel = blocks[q.get('block')] ? q.get('block') : main.slice().sort((a, b) => live(b).length - live(a).length)[0];
  renderAll();
  // the rings move whenever a name rewraps (a font arriving, the sidebar folding): measure again then
  const ro = new ResizeObserver(requestDraw);
  ro.observe($('[data-map]'));
  ro.observe($('[data-stations]'));
  if (document.fonts) { document.fonts.ready.then(requestDraw); document.fonts.addEventListener('loadingdone', requestDraw); }
  window.addEventListener('load', requestDraw);
  [vertical, phone].forEach((m) => m.addEventListener('change', () => keepFocus(renderAll)));
  window.addEventListener('resize', requestDraw);
})();
