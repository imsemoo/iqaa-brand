// Reading the world (world.js) for one person in one organization: who is looking and what they hold on each block,
// their work, an item's place on its line drawn in the line's own strokes, and the words for time. Shared by Home, My
// work, the block's queue and the item page, so every screen agrees on every item and every time.
(function () {
  if (!window.WORLD) return;
  const W = window.WORLD, T = window.T, N = window.I18N.n;
  const q = new URLSearchParams(location.search);
  const store = {
    get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* this page only */ } },
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- time: every demo time is a wall-clock string with no zone, read as UTC so every browser agrees ----------
  const ms = (iso) => Date.parse(`${iso.length === 16 ? `${iso}:00` : iso}Z`);
  const NOW = ms(W.now), DAY = 864e5, NOW_ISO = W.now;
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hm = (iso) => iso.slice(11, 16);
  const dayOf = (iso) => Math.round((ms(`${iso.slice(0, 10)}T00:00`) - ms(`${W.dayIso}T00:00`)) / DAY);
  function date(iso) { const d = new Date(ms(iso)); return T('{wd} {d} {mon}', { wd: T(WD[d.getUTCDay()]), d: d.getUTCDate(), mon: T(MON[d.getUTCMonth()]) }); }
  // a moment said the way people say it: today 17:00, tomorrow 12:00, Tue 3 Nov 12:00
  function when(iso) {
    const d = dayOf(iso);
    if (d === 0) return T('today, {time}', { time: hm(iso) });
    if (d === 1) return T('tomorrow, {time}', { time: hm(iso) });
    if (d === -1) return T('yesterday, {time}', { time: hm(iso) });
    return T('{day}, {time}', { day: date(iso), time: hm(iso) });
  }
  // how long ago, for what happened: 20 min ago, 3 hours ago, yesterday, Fri 30 Oct
  function ago(iso) {
    const m = Math.round((NOW - ms(iso)) / 6e4);
    if (m < 60) return N(Math.max(1, m), '{n} min ago', '{n} min ago');
    if (dayOf(iso) === 0) return N(Math.round(m / 60), '{n} hour ago', '{n} hours ago');
    if (dayOf(iso) === -1) return T('yesterday, {time}', { time: hm(iso) });
    return date(iso);
  }
  // late by how much, or null when not late
  function late(iso) {
    const m = Math.round((NOW - ms(iso)) / 6e4);
    if (m <= 0) return null;
    if (m < 60) return N(m, '{n} min late', '{n} min late');
    if (m < 24 * 60) return N(Math.round(m / 60), '{n} hour late', '{n} hours late');
    return N(Math.round(m / (24 * 60)), '{n} day late', '{n} days late');
  }

  // ---------- who is looking, in which organization ----------
  // ?as=<person> (the demo's "see as") and ?org=<organization>; a page names who it opens for in each organization
  function context(defaults) {
    let org = q.get('org');
    const as = q.get('as');
    if (as && !W.orgs[org]) org = Object.keys(W.orgs).find((k) => W.orgs[k].people[as]);
    if (!W.orgs[org]) org = store.get('iqaa-org-id');
    if (!W.orgs[org]) org = 'alkhatt';
    const O = W.orgs[org];
    const me = as && O.people[as] ? as : defaults[org];
    store.set('iqaa-org-id', org);
    return make(O, me);
  }

  // What people did this visit (started, claimed, handed over, approved, sent back) is kept in sessionStorage
  // 'iqaa-moves', item by item, so every screen shows the item where it is now.
  const moved = () => { try { return JSON.parse(store.get('iqaa-moves') || '{}') || {}; } catch (e) { return {}; } };
  function move(it, patch) {
    const all = moved(), before = {};
    Object.keys(patch).forEach((k) => { before[k] = it[k]; });
    all[it.code] = Object.assign(all[it.code] || {}, patch);
    Object.assign(it, patch);
    store.set('iqaa-moves', JSON.stringify(all));
    return before;
  }

  function make(O, me) {
    // a page that names nobody in this organization opens for its owner
    if (!O.people[me]) me = Object.keys(O.people).find((k) => O.people[k].owner);
    const line = O.lines[0], blocks = line.blocks, items = line.items;
    const saved = moved();
    items.forEach((it) => { if (saved[it.code]) Object.assign(it, saved[it.code]); });
    const noun = window.I18N.noun(O.noun);
    const block = (id) => blocks.find((b) => b.id === id);
    const person = (k) => O.people[k];
    // a person of the organization, or the client deciding from their link (review.html), who has no account here
    const name = (k) => (k && O.people[k] ? T(O.people[k].name) : k === 'client' ? T('The client') : '');
    const first = (k) => name(k).split(' ')[0];
    // the roles a person holds in a block
    const rolesIn = (b, who) => b.roles.filter((r) => r.people.includes(who || me));
    const leads = (b, who) => rolesIn(b, who).some((r) => r.lead);
    // the blocks the person holds a role in, in the line's order
    const mine = blocks.filter((b) => rolesIn(b).length);
    // the person's standing: the owner sees the whole organization; a lead runs a block's queue; the rest do the work
    const P = O.people[me];
    const standing = P.owner ? 'owner' : mine.some((b) => leads(b)) ? 'lead' : 'member';

    // an item's place on the line: the main path in order, a block that runs beside it (Design) at the place of the
    // block it runs beside
    const path = blocks.filter((b) => !b.side);
    const at = (it) => block(it.at[0]);
    const placeOf = (it) => {
      const b = at(it);
      if (!b.side) return path.indexOf(b);
      return path.findIndex((x) => (x.after || []).some((a) => (b.after || []).includes(a)));
    };
    const next = (b) => blocks.find((x) => (x.after || []).includes(b.id) && !x.side) || null;

    // the person's work: what is theirs now (being done, sent back, or waiting for their approval), what was given
    // to them and not started, and what is open to be claimed in a block where their role may claim
    function work(who) {
      const w = who || me;
      const ofMe = items.filter((it) => it.who === w);
      // waiting for their approval: in an approval block it is the reviewer's own; in a work block someone handed it over
      // and the role the block names as approver (its lead) decides
      const approves = (it) => { const b = block(it.at[0]); return b.approve && rolesIn(b, w).some((r) => r.role === b.approve); };
      const doing = ofMe.filter((it) => it.state === 'work' || it.state === 'returned' || (it.state === 'approval' && block(it.at[0]).kind === 'approval'))
        .concat(items.filter((it) => it.state === 'approval' && it.who !== w && approves(it)));
      const fresh = ofMe.filter((it) => it.state === 'new');
      const open = items.filter((it) => !it.who && it.state === 'open' && rolesIn(at(it), w).some((r) => r.claim));
      const byDue = (a, b) => a.due.localeCompare(b.due);
      return { doing: doing.sort(byDue), fresh: fresh.sort(byDue), open: open.sort(byDue) };
    }
    // a block's queue for its lead: nobody's yet, each person's, and what waits for the lead's approval
    function queue(b) {
      const here = items.filter((it) => it.at.includes(b.id));
      const people = [...new Set(b.roles.filter((r) => !r.lead).flatMap((r) => r.people))];
      return {
        all: here,
        open: here.filter((it) => !it.who),
        byPerson: people.map((k) => ({ k, items: here.filter((it) => it.who === k && it.state !== 'approval') })),
        approval: here.filter((it) => it.state === 'approval'),
        late: here.filter((it) => late(it.due)),
      };
    }

    // the fields a role sees in a block: a role without a list sees every field that is not secret
    function fieldsFor(it, who) {
      const b = at(it), roles = rolesIn(b, who);
      const all = Object.keys(O.fields);
      const mode = (f) => {
        let best = null;
        roles.forEach((r) => {
          const m = r.fields ? r.fields[f] : (O.fields[f].secret ? null : 'read');
          if (m === 'write' || (m === 'read' && best !== 'write')) best = m;
        });
        return best;
      };
      const shown = all.filter((f) => mode(f)).map((f) => ({ key: f, def: O.fields[f], mode: mode(f), value: (it.fields || {})[f] }));
      return { shown, hidden: all.length - shown.length };
    }

    // ---------- the item's line in strokes: done in ink and violet, where it is underlined, ahead in the dashed pen ----------
    // stages(it): the line's blocks, each with its stroke and its name (the item page)
    function stages(it) {
      const here = placeOf(it), side = at(it).side ? at(it) : null;
      return `<ol class="stg" aria-label="${esc(T('Where it is on {line}', { line: T(line.name) }))}">${path.map((b, i) => {
        const cls = i < here ? 'done' : i === here ? 'now' : 'ahead';
        const label = i === here && side ? `${T(b.name)} · ${T(side.name)}` : T(b.name);
        return `<li class="${cls}"${i === here ? ' aria-current="step"' : ''}><span class="stg-g" aria-hidden="true">${window.IQ.glyph(b.stroke, { test: i > here })}</span><span class="stg-n">${esc(label)}</span></li>`;
      }).join('')}</ol>`;
    }

    // the same place as one pen line, for rows: the line's signature, written in colour up to the item, the item's
    // block underlined, the rest in the dashed pen (grammar.js draws each stroke)
    function strip(it) {
      const M = window.IQAA.mark, p = window.IQAA.pal.light, k = 0.5, here = placeOf(it);
      const n = (v) => +(+v).toFixed(2);
      let x = 0, svg = '';
      path.forEach((b, i) => {
        if (i) {
          const ahead = i > here;
          svg += `<path d="M${n(x * k)} 0h${n(M.handoff * k)}" fill="none" stroke="${ahead ? p.test : p.run}" stroke-width="${n(M.stroke * k)}" stroke-linecap="round"${ahead ? ` stroke-dasharray="${n(M.stroke * k * 1.4)} ${n(M.stroke * k * 1.4)}"` : ''}/>`;
          x += M.handoff;
        }
        svg += window.IQ.cell(b.stroke, x, 0, p, k, i > here);
        if (i === here) svg += `<path d="M${n(x * k)} ${n(14 * k)}h${n(window.IQ.WIDTH[b.stroke] * k)}" stroke="${p.run}" stroke-width="1.6" stroke-linecap="round"/>`;
        x += window.IQ.WIDTH[b.stroke];
      });
      const pad = M.stroke * k, top = -(M.loop_h + M.stroke) * k, bot = 17 * k, w = x * k + 2 * pad;
      return `<svg class="istrip flow" viewBox="${n(-pad)} ${n(top)} ${n(w)} ${n(bot - top)}" width="${n(w)}" height="${n(bot - top)}" aria-hidden="true">${svg}</svg>`;
    }

    // ---------- the line's draft: the next version, seeded in world.js and changed this visit ----------
    // the changes made this visit are kept in sessionStorage 'iqaa-draft:<org>:<line>'; the canvas adds to them and the
    // publish page reads them all. Each change is { type, block, text, vars }, as in world.js.
    const draftKey = `iqaa-draft:${O.id}:${line.id}`;
    function draft() {
      let extra = [];
      try { extra = JSON.parse(store.get(draftKey) || '[]') || []; } catch (e) { extra = []; }
      const seed = line.draft || { changes: [], adds: [], fields: {} };
      return { version: line.version + 1, changes: seed.changes.concat(extra), adds: seed.adds, fields: seed.fields, mine: extra };
    }
    function change(c) {
      const d = draft();
      store.set(draftKey, JSON.stringify(d.mine.concat([c])));
    }
    function discard() { store.set(draftKey, '[]'); }

    // ---------- links that keep who is looking ----------
    const href = (page, params) => {
      const s = new URLSearchParams(Object.assign({ org: O.id, as: me }, params || {}));
      return `${page}?${s}`;
    };

    // ---------- what reached the person: sent back, given, waiting for their approval, late; for the owner also the
    // invitations nobody accepted and the integrations that lost their permission. Newest first. ----------
    function inbox(who) {
      const w = who || me, out = [];
      const approves = (it) => { const b = block(it.at[0]); return b.approve && rolesIn(b, w).some((r) => r.role === b.approve); };
      items.forEach((it) => {
        if (it.who === w && it.state === 'returned' && it.note) out.push({ id: `back-${it.code}`, kind: 'back', at: it.note.at, code: it.code, by: it.note.by, from: it.note.from, text: it.note.text });
        if (it.who === w && it.state === 'new' && it.assigned) out.push({ id: `given-${it.code}`, kind: 'given', at: it.assigned.at, code: it.code, by: it.assigned.by });
        if (it.state === 'approval' && it.who !== w && approves(it)) {
          const sent = (it.log || []).find((e) => e[3] === 'sent' && e[1] === it.who);
          out.push({ id: `approve-${it.code}`, kind: 'approve', at: sent ? sent[2] : NOW_ISO, code: it.code, by: it.who });
        }
        if (it.who === w && late(it.due)) out.push({ id: `late-${it.code}`, kind: 'late', at: it.due, code: it.code });
      });
      if (O.people[w] && O.people[w].owner) {
        Object.entries(O.invited || {}).forEach(([k, at]) => { if (O.people[k]) out.push({ id: `invite-${k}`, kind: 'invite', at, who: k }); });
        (O.integrations || []).filter((x) => x.state === 'expired').forEach((x) => out.push({ id: `expired-${x.id}`, kind: 'expired', at: x.since, name: x.name }));
      }
      return out.sort((a, b) => b.at.localeCompare(a.at));
    }

    return { O, me, P, line, blocks, items, noun, block, person, name, first, rolesIn, leads, mine, standing, path, at, placeOf, next, work, queue, fieldsFor, stages, strip, href, draft, change, discard, inbox };
  }

  // a count as an icon and a number; its words are the tooltip and what a screen reader says (app.css .stat)
  const stat = (ic, n, words, cls) => `<span class="stat${cls ? ` ${cls}` : ''}" title="${esc(words)}">${window.IQ.icon(ic, 16)}<b aria-hidden="true">${n}</b><span class="sr">${esc(words)}</span></span>`;
  // hours a week as a bar against a full week of 40 (app.css .hbar)
  const hbar = (h, words) => `<span class="hbar" title="${esc(words)}"><i aria-hidden="true" style="--h:${Math.min(1, h / 40)}"></i><span aria-hidden="true">${esc(N(h, '{n} h', '{n} h'))}</span><span class="sr">${esc(words)}</span></span>`;

  // the notices a person has opened, kept for the visit
  const readKey = (C) => `iqaa-read:${C.O.id}:${C.me}`;
  const read = (C) => { try { return JSON.parse(store.get(readKey(C)) || '[]') || []; } catch (e) { return []; } };
  const markRead = (C, ids) => store.set(readKey(C), JSON.stringify([...new Set(read(C).concat(ids))]));

  window.FLOW = { read, markRead, context, make, move, when, ago, late, hm, date, dayOf, ms, esc, stat, hbar, now: NOW, store };
})();
