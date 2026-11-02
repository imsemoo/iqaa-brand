// Home: the organization's home for its owner, and the same screen for every organization. What needs the owner
// today, in a fixed order: the core's numbers (live and late, counted the same way everywhere), then the pack's; where
// work stands on the line, block by block; what waits for the owner's decision; and what Watar suggests from the
// line's own log; a pack can add a card of its own (the agency's most active clients). Every number is counted from
// world.js; nothing here is written for one organization.
(function () {
  const root = document.querySelector('main.hm');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'khaled', masar: 'samir', wamda: 'hala' });
  const T = window.T, N = window.I18N.n, esc = FLOW.esc, NO = C.noun, O = C.O;
  const $ = (s, el) => (el || document).querySelector(s);
  const icon = (n, s) => IQ.icon(n, s || 20);
  const glyph = (kind, test) => `<span class="hm-g" aria-hidden="true">${IQ.glyph(kind, { test: !!test })}</span>`;
  const isLate = (it) => !!FLOW.late(it.due);
  const HOUR = 36e5, DAY = 864e5;
  const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  // a name inside a sentence, in lower case where the language has one: 'Script' → 'because of the script'
  const lc = (s) => (I18N.lang === 'ar' ? s : s.charAt(0).toLocaleLowerCase(I18N.lang) + s.slice(1));
  // what this prototype does not do yet: shown, kept in reach of the keyboard, and said to be coming (as the frame says
  // of its screens), never a dead link
  const soon = (label, cls, ic) => `<button type="button" class="btn ${cls || ''}" aria-disabled="true" title="${esc(T('{name}: coming next', { name: label }))}">${ic ? icon(ic) : ''}<span>${esc(label)}</span><em>${T('Soon')}</em></button>`;

  // ---------- the numbers: the core's first, counted the same way for every organization, then the pack's ----------
  // where the late items are: in one block, most of them in one, or each block with its count, in the line's order
  function whereLate(late) {
    if (!late.length) return T('Nothing is late');
    const by = C.blocks.map((b) => ({ b, n: late.filter((it) => it.at.includes(b.id)).length })).filter((x) => x.n);
    const name = (x) => T(x.b.name);
    if (by.length === 1) return late.length === 1 ? T('In {block}', { block: name(by[0]) }) : T('All in {block}', { block: name(by[0]) });
    const most = by.slice().sort((a, b) => b.n - a.n);
    if (most[0].n > most[1].n) return N(most[0].n, '{n} of them in {block}', '{n} of them in {block}', { block: name(most[0]) });
    if (by.length > 3) return N(by.length, 'Across {n} block', 'Across {n} blocks');
    return by.map((x) => T('{n} in {block}', { n: x.n, block: name(x) })).join(T(', '));
  }
  // the pack's own numbers for Home, in the pack's words; an organization without a pack shows the core's alone
  const PACK = {
    'Media and production': (s) => [
      { k: T('Published this week'), ic: 'Publish', n: s.published, s: N(s.pages, 'on {n} page', 'on {n} pages') },
      { k: T('Pages at risk'), ic: 'Notifications', n: s.risk, bad: s.risk > 0, s: s.risk && s.riskPage ? T(s.riskPage) : T('None') },
    ],
    Software: (s) => [
      { k: T('Releases this week'), ic: 'Release', n: s.releases },
      { k: T('Open bugs'), ic: 'Test run', n: s.bugs },
      { k: T('Delivery speed'), ic: 'History', n: s.speed, s: T('days, on average') },
    ],
    // from the ad accounts, over the same days: what was spent against the clients' budgets, and what the ads brought
    // back for every dollar
    Agencies: (s) => [
      { k: T('Ad spend'), ic: 'Billing', n: money(s.spend), s: N(s.days, 'of {budget} budgeted, last {n} day', 'of {budget} budgeted, last {n} days', { budget: money(s.budget) }) },
      { k: T('Return on ads'), ic: 'Reports', n: T('{n}x', { n: s.roas }), s: N(s.days, 'last {n} day', 'last {n} days') },
    ],
  };
  function numbers() {
    const others = O.others || [];
    const live = O.lines.reduce((a, l) => a + (l.items || []).length, 0) + others.reduce((a, l) => a + l.live, 0);
    const late = C.items.filter(isLate);
    const tiles = [
      { k: NO.t('Live jobs'), ic: 'Line', n: live, s: N(O.lines.length + others.length, 'on {n} line', 'on {n} lines') },
      { k: T('Late'), ic: 'Late', n: late.length, bad: late.length > 0, s: whereLate(late) },
    ].concat(PACK[O.pack] ? PACK[O.pack](O.packStats || {}) : []);
    $('[data-nums]').innerHTML = tiles.map((x) => `<li><span class="hm-k">${icon(x.ic, 18)}<span>${esc(x.k)}</span></span><span class="hm-n${x.bad ? ' bad' : ''}">${esc(x.n)}</span>${x.s ? `<span class="hm-s">${esc(x.s)}</span>` : ''}</li>`).join('');
  }

  // ---------- where work stands: every block of the line in its order, what is in it and how long it has been there ----------
  // when an item came into the block it is in now: the last thing its log says happened to it in another block (an
  // approval, a hand-off or a return moved it here), else the time it was sent back, else world.js's `since`; an item
  // in the line's first block came in when it was opened
  function since(it) {
    const moved = (it.log || []).find((e) => !it.at.includes(e[0]));
    if (moved) return moved[2];
    if (it.state === 'returned' && it.note) return it.note.at;
    return (O.since || {})[it.code] || (it.at.includes(C.blocks[0].id) ? it.opened : null);
  }
  // a stretch of time as a row says it, in one unit for the whole line so its blocks compare: a line where a block
  // expects two days or more is said in whole days; any other in minutes under an hour and whole hours above
  const DAYS = C.blocks.some((b) => b.hours >= 48);
  const span = (h) => (DAYS ? N(Math.max(1, Math.round(h / 24)), '{n} day', '{n} days')
    : h < 1 ? N(Math.max(1, Math.round(h * 60)), '{n} min', '{n} min') : N(Math.round(h), '{n} h', '{n} h'));
  const whole = (h) => Math.round(DAYS ? h / 24 : h);
  // A block is slower than expected when the items in it now have already been there longer, on average, than the
  // block expects (its hours). Their clocks are still running, so that average can only grow: the rule never flags a
  // block that keeps its time. It is compared as the row shows it, in whole hours (or whole days).
  function blockNow(b) {
    const here = C.items.filter((it) => it.at.includes(b.id));
    const hrs = here.map(since).filter(Boolean).map((s) => (FLOW.now - FLOW.ms(s)) / HOUR);
    const avg = hrs.length ? hrs.reduce((a, h) => a + h, 0) / hrs.length : null;
    return { b, here, late: here.filter(isLate).length, avg, slow: avg != null && whole(avg) > whole(b.hours) };
  }
  // a block that runs beside the main path (Design beside Montage) says which
  function beside(b) {
    if (!b.side) return '';
    const m = C.path.find((x) => (x.after || []).some((a) => (b.after || []).includes(a)));
    return m ? T('beside {block}', { block: T(m.name) }) : '';
  }
  function line() {
    $('[data-ln-hint]').textContent = T(C.line.name);
    $('[data-ln]').innerHTML = C.blocks.map(blockNow).map((r) => {
      const b = r.b;
      const exp = [T('Expected {time}', { time: span(b.hours) }), beside(b)].filter(Boolean).join(' · ');
      // the bar: the time here on average, with what the block expects always at its middle; past it, the bar is red
      const fill = r.avg == null ? 0 : Math.min(r.avg / b.hours, 2) * 50;
      const time = r.avg == null ? `<span class="hm-tt none">${esc(NO.t('No job here now'))}</span>`
        : `<span class="hm-bar" style="--f:${fill.toFixed(1)}" aria-hidden="true"><i></i><i></i></span><span class="hm-tt"><span aria-hidden="true" title="${esc(T('{time} here on average', { time: span(r.avg) }))}">${esc(span(r.avg))}</span><span class="sr">${esc(T('{time} here on average', { time: span(r.avg) }))}</span>${r.slow ? ` <b class="hm-slow">${icon('Late', 14)}${esc(T('Slower than expected'))}</b>` : ''}</span>`;
      return `<li><a class="hm-b${r.here.length ? '' : ' is-empty'}" href="${C.href('queue.html', { block: b.id })}">${glyph(b.stroke)}<span class="hm-b-n"><b>${esc(T(b.name))}</b><small>${esc(exp)}</small></span>
<span class="hm-b-c"><span>${esc(NO.n(r.here.length, '{n} job', '{n} jobs'))}</span>${r.late ? `<b>${esc(NO.n(r.late, '{n} late job', '{n} late jobs'))}</b>` : ''}</span><span class="hm-b-t">${time}</span></a></li>`;
    }).join('');
  }

  // ---------- waiting for the owner's decision: approvals where their role approves, invitations nobody took up ----------
  // an item waits for this person's approval when it is handed over in an approval block and theirs there, or handed
  // over in a work block whose approving role (`approve`) they hold
  function waitsForMe(it) {
    if (it.state !== 'approval') return false;
    const b = C.at(it);
    return b.kind === 'approval' ? it.who === C.me && C.rolesIn(b).length > 0 : !!b.approve && C.rolesIn(b).some((r) => r.role === b.approve);
  }
  function decisions() {
    const rows = C.items.filter(waitsForMe).sort((a, b) => a.due.localeCompare(b.due)).map((it) => {
      const l = FLOW.late(it.due), b = C.at(it);
      return `<li><a class="hm-d" href="${C.href('item.html', { code: it.code })}">${glyph(b.stroke)}<span class="hm-d-t"><b>${esc(T(it.title))}</b><small>${esc(`${T(b.name)} · ${T('Waiting for your approval')}`)}</small></span>
<span class="hm-d-x${l ? ' late' : FLOW.dayOf(it.due) === 0 ? ' soon' : ''}">${icon(l ? 'Late' : 'Date', 16)}<span>${esc(l || T('Due {when}', { when: FLOW.when(it.due) }))}</span><em class="hm-go">${esc(T('Review and approve'))}</em></span></a></li>`;
    });
    // invitations are the owner's: they sent them, and People and departments is theirs
    if (C.standing === 'owner') {
      Object.keys(O.people).filter((k) => O.people[k].type === 'invited').forEach((k) => {
        const p = O.people[k], at = (O.invited || {})[k];
        const days = at ? Math.round((FLOW.now - FLOW.ms(at)) / DAY) : 0;
        const what = days ? N(days, 'Invitation not accepted for {n} day', 'Invitation not accepted for {n} days') : T('Invitation not accepted yet');
        const where = T('People and departments');
        rows.push(`<li><a class="hm-d" href="${C.href('people.html', { dept: p.dept })}">${icon('Invite')}<span class="hm-d-t"><b>${esc(T(p.name))}</b><small>${esc(`${T(p.title)} · ${what}`)}</small></span>
<span class="hm-d-x">${icon('People', 16)}<span>${esc(where)}</span></span></a></li>`);
      });
    }
    $('[data-dc-n]').textContent = rows.length || '';
    $('[data-dc]').innerHTML = rows.length ? `<ul class="hm-dl">${rows.join('')}</ul>`
      : `<div class="hm-none"><p>${icon('Done', 18)}<b>${esc(T('Nothing waits for your decision.'))}</b></p><p>${esc(T('Approvals in blocks where you hold a role, and invitations nobody has accepted, come here.'))}</p></div>`;
  }

  // ---------- Watar's suggestion, from the line's last month: where one cause sends the most items back ----------
  // Watar speaks only with a month of the line's log, about a block at least 20 items went through, and over one cause
  // that sent back at least one in five of them. Its fix is the same everywhere: an approval of what keeps coming back,
  // before the block, by the line's own rules, so it is seen before the work is made, not after.
  // With no such cause, Watar looks at the approvals: one that kept its items, on average over the month (report.hours),
  // at least twice as long as it expects, with at least 20 items through it, waits on someone who forgets to answer.
  // Its fix: an automatic reminder in that block once the time the block expects has passed.
  function suggestion() {
    const R = O.returns;
    if (!R || !(R.days >= 30)) return null;
    let best = null;
    (R.back || []).forEach((r) => {
      const of = (R.through || {})[r.to], to = C.block(r.to), from = C.block(r.from), f = O.fields[r.field];
      if (!to || !from || !f || !(of >= 20) || r.n / of < 0.2) return;
      if (!best || r.n / of > best.share) best = { kind: 'approval', to, from, f, n: r.n, of, days: R.days, share: r.n / of, key: `${r.from}>${r.to}:${r.field}` };
    });
    if (best) return best;
    const H = (O.report || {}).hours || {};
    C.blocks.filter((b) => b.kind === 'approval').forEach((b) => {
      const h = H[b.id], of = (R.through || {})[b.id];
      if (!(h >= 2 * b.hours) || !(of >= 20)) return;
      if (!best || h / b.hours > best.ratio) best = { kind: 'remind', to: b, h, of, days: R.days, ratio: h / b.hours, key: `remind:${b.id}` };
    });
    return best;
  }
  // the reminder: the block, then the timed wait Watar would add to it, in the dashed grey pen of a draft
  function reminder(s, stop) {
    const v = { block: T(s.to.name), time: span(s.h), days: s.days, n: s.of };
    return `<div class="hm-wr-b">
<p class="hm-wr-s">${esc(T('{block} takes {time} on average.', v))}</p>
<p class="hm-wr-q">${esc(N(s.to.hours, 'Add an automatic reminder after {n} hour in this block?', 'Add an automatic reminder after {n} hours in this block?'))}</p>
<ol class="hm-wr-l" aria-label="${esc(T('The change in {block}', v))}">${stop(s.to)}<li class="new">${glyph('rest', true)}<span><span class="sr">${T('Watar’s draft')}: </span>${esc(N(s.to.hours, 'A reminder after {n} hour', 'A reminder after {n} hours'))}</span></li></ol>
<p class="hm-wr-m">${esc(NO.n(s.of, 'From the line’s log, last {days} days: {n} job went through it', 'From the line’s log, last {days} days: {n} jobs went through it', v))}</p>
<div class="hm-wr-a">${soon(T('Try it on a draft'), 'small', 'Draft')}<button type="button" class="link" data-ignore>${T('Ignore')}</button></div></div>`;
  }
  const IGNORED = `iqaa-home-ignored-${O.id}`;
  function watar() {
    const s = suggestion(), el = $('[data-wr]');
    if (!s) {
      el.innerHTML = `<p class="hm-wr-n">${esc(T('Nothing to suggest yet. Watar reads the line’s log once a month of work is on it.'))}</p>`;
      return;
    }
    if (FLOW.store.get(IGNORED) === s.key) {
      el.innerHTML = `<p class="hm-wr-n" role="status">${esc(T('You ignored Watar’s suggestion.'))} <button type="button" class="link" data-unignore>${T('Undo')}</button></p>`;
      return;
    }
    const stop = (b) => `<li>${glyph(b.stroke)}<span>${esc(T(b.name))}</span></li>`;
    if (s.kind === 'remind') { el.innerHTML = reminder(s, stop); return; }
    const v = { pct: `${Math.round(s.share * 100)}%`, to: T(s.to.name), from: T(s.from.name), field: lc(T(s.f.name)), n: s.n, of: s.of, days: s.days };
    // the change on the line: the block before, the new approval in the dashed grey pen of a draft, then the block
    const prev = C.blocks.find((b) => (s.to.after || []).includes(b.id));
    el.innerHTML = `<div class="hm-wr-b">
<p class="hm-wr-s">${esc(NO.t('{pct} of the jobs that went through {to} came back from {from} because of the {field}.', v))}</p>
<p class="hm-wr-q">${esc(T('Add an approval of the {field} before {to}?', v))}</p>
<ol class="hm-wr-l" aria-label="${esc(T('The change on {line}', { line: T(C.line.name) }))}">${prev ? stop(prev) : ''}<li class="new">${glyph('held', true)}<span><span class="sr">${T('Watar’s draft')}: </span>${esc(T('Approval of the {field}', v))}</span></li>${stop(s.to)}</ol>
<p class="hm-wr-m">${esc(NO.t('From the line’s log, last {days} days: {n} of {of} jobs', v))}</p>
<div class="hm-wr-a">${soon(T('Try it on a draft'), 'small', 'Draft')}<button type="button" class="link" data-ignore>${T('Ignore')}</button></div></div>`;
  }

  // ---------- the pack's card: a pack may add one card to Home, beside what waits for the owner ----------
  // the agency's: the clients whose live campaigns hold the most budget, with how many campaigns and their budgets
  const amount = (s) => Number(String(s || '').replace(/[^\d.]/g, '')) || 0;
  const CARDS = {
    Agencies: () => {
      const by = {};
      C.items.forEach((it) => {
        const f = it.fields || {};
        if (!f.client) return;
        const c = by[f.client] || (by[f.client] = { name: f.client, n: 0, sum: 0 });
        c.n += 1;
        c.sum += amount(f.budget);
      });
      const top = Object.values(by).sort((a, b) => b.sum - a.sum || b.n - a.n).slice(0, 3);
      return top.length && { title: T('Most active clients'), icon: 'Clients', hint: NO.t('By the budgets of their live jobs'),
        rows: top.map((c) => `<li>${icon('Company', 18)}<span class="hm-cl-t"><b>${esc(T(c.name))}</b><small>${esc(NO.n(c.n, '{n} job', '{n} jobs'))}</small></span><span class="hm-cl-m" dir="ltr">${money(c.sum)}</span></li>`) };
    },
  };
  function card() {
    const k = CARDS[O.pack] && CARDS[O.pack](), el = $('[data-pk]');
    if (!k || !el) return;
    el.innerHTML = `<div class="hm-ph"><h2 id="hm-pk-h">${icon(k.icon, 18)}${esc(k.title)}</h2><p>${esc(k.hint)}</p></div><ol class="hm-cl">${k.rows.join('')}</ol>`;
    el.hidden = false;
    el.closest('.hm-cols').classList.add('has-pk');
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.getAttribute('aria-disabled') === 'true') return;
    const s = suggestion();
    if (b.hasAttribute('data-ignore') && s) {
      FLOW.store.set(IGNORED, s.key);
      watar();
      $('[data-unignore]').focus();
    } else if (b.hasAttribute('data-unignore')) {
      FLOW.store.set(IGNORED, '');
      watar();
      $('[data-ignore]').focus();
    }
  });

  $('[data-day]').textContent = T(window.WORLD.day);
  $('[data-hi]').textContent = T('Good morning, {name}', { name: C.first(C.me) });
  // the one primary action is named by what the organization's line carries; creating comes in a later phase
  $('[data-new]').innerHTML = `<a class="btn primary" href="${C.href('new.html')}">${IQ.icon('Create', 18)}<span>${esc(NO.t('New job'))}</span></a>`;
  document.title = `${T('Home')} · ${T(O.name)}`;
  numbers();
  decisions();
  line();
  watar();
  card();
})();
