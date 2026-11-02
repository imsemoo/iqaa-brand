// A block's queue (طابور البلوك): the space of the block's lead, who sees everything in the block and gives it out. The
// columns are the same for everyone: what nobody has yet, one for each person in the block's working role (their
// title, staff or freelance and until when, skills, what they hold and the hours they give a week), and what waits for
// the lead's approval. A card shows what the lead's role may see of the item: its place on the line, its code, and
// the two fields the line's owner chose for cards, a secret one only to a role given it. Giving an item to a person,
// approving a hand-over and sending one back are kept for the visit (flow.js), can be undone, and reach the person's
// My work. On a phone the board shows one column at a time, with a switcher between them (the plan's queue template).
(function () {
  const root = document.querySelector('main.qu');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'omar', masar: 'mazen' });
  const W = window.WORLD, T = window.T, N = window.I18N.n, esc = FLOW.esc, NO = C.noun;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const M = window.IQAA.motion;
  const q = new URLSearchParams(location.search);

  // the two fields the line's owner chose for its cards (the owner's plan: chosen by the line's manager); a field the
  // person's role may not see is left out, never shown empty
  const CARD = { content: ['budget', 'length'], features: ['priority', 'release'] };

  // the block: the one asked for when the person leads it, else the first they lead. The address names it, so the
  // frame (which runs after this) marks it in the sidebar.
  const led = C.mine.filter((b) => C.leads(b));
  const B = led.find((b) => b.id === q.get('block')) || led[0] || null;
  if (B && q.get('block') !== B.id) { q.set('block', B.id); history.replaceState(null, '', `${location.pathname}?${q}${location.hash}`); }

  let view = q.get('view') === 'list' ? 'list' : 'board';
  let col = 'open', undo = null;
  const drafts = {};   // send-back notes being written, by item, so a redraw keeps them

  const byDue = (a, b) => a.due.localeCompare(b.due);
  const initial = (k) => esc(C.name(k).charAt(0));
  const hours = (p) => N(p.hours, '{n} hour a week', '{n} hours a week');
  const until = (p) => T('Freelancer until {date}', { date: FLOW.date(`${p.until}T00:00`) });
  const kind = (p) => (p.type === 'freelancer' ? until(p) : p.type === 'invited' ? T('Invited, not joined yet') : T('Staff'));
  // a block's part is due within the block's hours from when the item reaches it
  const inHours = (h) => new Date(FLOW.now + h * 36e5).toISOString().slice(0, 16);

  // due, or late by how much: red for late and amber for due today, the plan's two colours for risk
  function flag(it) {
    const l = FLOW.late(it.due);
    return l ? `<span class="qu-flag late">${IQ.icon('Late', 16)}${esc(l)}</span>`
      : `<span class="qu-flag${FLOW.dayOf(it.due) === 0 ? ' soon' : ''}">${IQ.icon('Date', 16)}${esc(T('Due {when}', { when: FLOW.when(it.due) }))}</span>`;
  }

  // the card's two fields as the person's role sees them; a secret one carries a lock
  function fields(it) {
    const shown = C.fieldsFor(it, C.me).shown;
    const pick = (CARD[C.line.id] || []).map((k) => shown.find((f) => f.key === k)).filter((f) => f && typeof f.value === 'string' && f.value);
    if (!pick.length) return '';
    return `<dl class="qu-f">${pick.map((f) => `<div><dt>${f.def.secret ? `${IQ.icon('Lock', 14)}` : ''}${esc(T(f.def.name))}${f.def.secret ? `<span class="sr"> (${esc(T('Only roles given it see this'))})</span>` : ''}</dt>`
      + `<dd>${f.def.type === 'choice' ? esc(T(f.value)) : `<bdi dir="ltr">${esc(f.value)}</bdi>`}</dd></div>`).join('')}</dl>`;
  }

  // the columns: nobody's yet, each person in the block's working role (and anyone else holding work here, such as the
  // lead), then what waits for the lead's approval; each in the order it is due
  function columns() {
    const qu = C.queue(B);
    const others = [...new Set(qu.all.filter((it) => it.who && it.state !== 'approval' && !qu.byPerson.some((p) => p.k === it.who)).map((it) => it.who))];
    const people = qu.byPerson.concat(others.map((k) => ({ k, items: qu.all.filter((it) => it.who === k && it.state !== 'approval') })));
    return [{ k: 'open', kind: 'open', items: qu.open.filter((it) => it.state !== 'approval') }]
      .concat(people.map((p) => ({ k: p.k, kind: 'person', items: p.items })), [{ k: 'approval', kind: 'approval', items: qu.approval }])
      .map((c) => Object.assign(c, { items: c.items.slice().sort(byDue) }));
  }

  // what else the person holds on the line, so the lead sees more than this block's share
  function elsewhere(k) {
    const parts = C.blocks.filter((b) => b !== B).map((b) => [b, C.items.filter((it) => it.who === k && it.at.includes(b.id)).length])
      .filter(([, n]) => n).map(([b, n]) => N(n, '{n} in {block}', '{n} in {block}', { block: T(b.name) }));
    return parts.length ? T('Also {list}', { list: parts.join(T(', ')) }) : '';
  }

  // ---------- a column's head ----------
  function head(c) {
    const n = c.items.length;
    const count = `<span class="qu-n" aria-hidden="true">${n}</span><span class="sr">, ${esc(NO.n(n, '{n} job', '{n} jobs'))}</span>`;
    if (c.kind === 'open') {
      const claim = B.roles.find((r) => !r.lead && r.claim);
      return `<div class="qu-ch"><h2 id="qu-h-open"${claim ? ` title="${esc(T('The {role} role may also claim these.', { role: T(claim.role) }))}"` : ''}>${IQ.icon('Inbox', 18)}<span>${T('Unassigned')}</span>${count}</h2></div>`;
    }
    if (c.kind === 'approval') {
      const nx = C.next(B);
      const hint = !nx ? '' : B.approve ? T('Once approved, it goes on to {block}.', { block: T(nx.name) })
        : T('Hand-overs from {block} go straight to {next}.', { block: T(B.name), next: T(nx.name) });
      // where an approved item goes, as an arrow to the next block; the sentence is its tooltip
      return `<div class="qu-ch"><h2 id="qu-h-approval"><span class="qu-g" aria-hidden="true">${IQ.glyph('held')}</span><span>${T('Waiting for your approval')}</span>${count}</h2>`
        + `${nx ? `<p class="qu-to-nx" title="${esc(hint)}">${IQ.icon('Handoff', 16)}<span>${esc(T(nx.name))}</span><span class="sr">${esc(hint)}</span></p>` : ''}</div>`;
    }
    const p = C.person(c.k), also = elsewhere(c.k);
    const skills = (p.skills || []).map((s) => `<span class="qu-sk">${esc(T(s))}</span>`).join('');
    return `<div class="qu-ch qu-ph"><span class="me-av" aria-hidden="true">${initial(c.k)}</span><h2 id="qu-h-${c.k}"><span>${esc(C.name(c.k))}</span>${count}</h2>`
      + `<p>${esc(T(p.title))}</p><p class="qu-cap">${FLOW.hbar(p.hours, `${kind(p)} · ${hours(p)}`)}${p.type === 'freelancer' ? `<span class="qu-fl">${esc(until(p))}</span>` : ''}</p>`
      + `${skills ? `<p class="qu-sks">${skills}</p>` : ''}${also ? `<p>${esc(also)}</p>` : ''}</div>`;
  }

  // ---------- who may take an item: the people of the working role with the skill it needs first, then the rest ----------
  function assignTo(it, cols) {
    const people = cols.filter((c) => c.kind === 'person' && C.person(c.k).type !== 'invited' && B.roles.some((r) => !r.lead && r.people.includes(c.k)));
    const has = (c) => !!it.needs && (C.person(c.k).skills || []).includes(it.needs);
    const fit = people.filter(has), rest = people.filter((c) => !has(c));
    const opt = (c) => {
      const p = C.person(c.k), say = [NO.n(c.items.length, '{n} job here', '{n} jobs here'), hours(p)].concat(p.type === 'freelancer' ? [until(p)] : []);
      return `<button type="button" class="qu-p" data-assign="${it.code}" data-to="${c.k}"><span class="me-av" aria-hidden="true">${initial(c.k)}</span>`
        + `<span class="qu-p-t"><b>${esc(C.name(c.k))}</b><small>${esc(say.join(' · '))}</small></span></button>`;
    };
    const group = (title, list) => (list.length ? `<p class="qu-to-h">${esc(title)}</p>${list.map(opt).join('')}` : '');
    const body = !it.needs ? rest.map(opt).join('')
      : fit.length ? group(T('Has {skill}', { skill: T(it.needs) }), fit) + group(T('Others'), rest)
        : group(T('Nobody here has {skill}', { skill: T(it.needs) }), rest);
    return `<div class="qu-to" id="qu-to-${it.code}" role="group" aria-label="${esc(T('Who takes {title}?', { title: T(it.title) }))}" hidden>${body}</div>`;
  }

  // ---------- a card ----------
  function card(it, c, cols) {
    const title = T(it.title);
    let st = '', act = '', more = '';
    if (c.kind === 'open') {
      if (it.needs) st = `<p class="qu-st need">${esc(T('Needs {skill}', { skill: T(it.needs) }))}</p>`;
      act = `<button type="button" class="btn small" data-menu aria-expanded="false" aria-controls="qu-to-${it.code}" aria-label="${esc(T('Assign: {title}', { title }))}">${IQ.icon('Invite', 18)}<span>${T('Assign')}</span></button>`;
      more = assignTo(it, cols);
    } else if (c.kind === 'approval') {
      // approved, it walks on; sent back, it returns to the person who handed it over
      const nx = C.next(B), d = drafts[it.code];
      act = nx ? `<button type="button" class="btn small primary" data-approve="${it.code}" aria-label="${esc(T('Approve: {title}', { title }))}">${IQ.icon('Done', 18)}<span>${T('Approve')}</span></button>` : '';
      if (it.who) {
        st = `<p class="qu-st qu-from"><span class="me-av" aria-hidden="true">${initial(it.who)}</span>${esc(T('From {name}', { name: C.name(it.who) }))}</p>`;
        act += `<button type="button" class="btn small qu-bk" data-back="${it.code}" aria-expanded="${d != null}" aria-controls="qu-bk-${it.code}" aria-label="${esc(T('Send back: {title}', { title }))}">${IQ.icon('Undo', 18)}<span>${T('Send back')}</span></button>`;
        more = `<form class="qu-back" id="qu-bk-${it.code}" data-form="${it.code}" novalidate${d == null ? ' hidden' : ''}>
<label for="qu-bt-${it.code}">${T('What should change?')}</label>
<textarea id="qu-bt-${it.code}" rows="2" maxlength="200" aria-describedby="qu-be-${it.code}">${esc(d || '')}</textarea>
<p class="qu-err" id="qu-be-${it.code}" hidden>${T('Say what should change.')}</p>
<div class="qu-back-act"><button type="button" class="btn small" data-back-cancel="${it.code}">${T('Cancel')}</button><button type="submit" class="btn small ink">${esc(T('Send back to {name}', { name: C.first(it.who) }))}</button></div>
</form>`;
      }
    } else {
      const back = it.state === 'returned' && it.note && C.block(it.note.from);
      st = `<p class="qu-st${back ? ' back' : ''}">${esc(back ? T('Sent back from {block}', { block: T(back.name) }) : it.state === 'new' ? T('Not started') : T('In progress'))}</p>`;
    }
    return `<li class="qu-card${FLOW.late(it.due) ? ' is-late' : ''}" data-code="${it.code}">
<div class="qu-top"><a class="qu-title" href="${C.href('item.html', { code: it.code })}">${esc(title)}</a>${flag(it)}</div>
<div class="qu-where"><code dir="ltr">${it.code}</code></div>
${fields(it)}${st}${act ? `<div class="qu-act">${act}</div>` : ''}${more}</li>`;
  }

  // what a column says when it holds nothing
  const empty = (c) => (c.kind === 'open' ? NO.t('Every job here has someone.')
    : c.kind === 'approval' ? (B.approve ? T('Nothing waits for your approval.') : '')
      : T('Nothing with {name} now.', { name: C.first(c.k) }));

  // ---------- the board (or the list): the same columns, laid side by side or one under another ----------
  function render() {
    if (window.UI) UI.closeMenu();
    const cols = columns(), all = C.queue(B).all, lateN = all.filter((it) => FLOW.late(it.due)).length;
    $('[data-sum]').innerHTML = `<span class="stats">${FLOW.stat('Line', all.length, NO.n(all.length, '{n} job', '{n} jobs'))}${lateN ? FLOW.stat('Late', lateN, NO.n(lateN, '{n} late job', '{n} late jobs'), 'late') : ''}</span>`;
    if (!cols.some((c) => c.k === col)) col = 'open';
    // a redraw keeps where the switcher and the board were scrolled to
    const kept = ['.qu-switch', '.qu-board'].map((s) => { const el = $(s, root); return el ? el.scrollLeft : 0; });
    const sw = view === 'board' ? `<div class="qu-switch" role="group" aria-label="${esc(T('Columns'))}">${cols.map((c) => `<button type="button" data-col="${c.k}" aria-pressed="${c.k === col}">`
      + `${esc(c.kind === 'open' ? T('Unassigned') : c.kind === 'approval' ? T('Approval') : C.first(c.k))}<span aria-hidden="true">${c.items.length}</span>`
      + `<b class="sr">, ${esc(NO.n(c.items.length, '{n} job', '{n} jobs'))}</b></button>`).join('')}</div>` : '';
    $('[data-body]').innerHTML = `${sw}<div class="qu-${view}">${cols.map((c) => {
      const e = empty(c);
      return `<section class="qu-col is-${c.kind}${c.k === col ? ' is-on' : ''}" data-k="${c.k}" aria-labelledby="qu-h-${c.k}">${head(c)}`
        + `${c.items.length ? `<ol class="qu-cards">${c.items.map((it) => card(it, c, cols)).join('')}</ol>` : e ? `<p class="qu-empty">${esc(e)}</p>` : ''}</section>`;
    }).join('')}</div>`;
    ['.qu-switch', '.qu-board'].forEach((s, i) => { const el = $(s, root); if (el) el.scrollLeft = kept[i]; });
    syncFrame();
  }

  // the frame counted what is in each of the person's blocks when the page opened; a move here changes the counts
  function syncFrame() {
    $$('[data-frame] a.ap-l').forEach((a) => {
      const id = new URL(a.href, location.href).searchParams.get('block'), b = id && C.block(id), n = $('.ap-n', a);
      if (b && n) n.textContent = C.items.filter((it) => it.at.includes(b.id)).length;
    });
  }

  // ---------- giving out, approving, sending back, and undoing each ----------
  function note(text) {
    const el = $('[data-note]');
    $('[data-note-t]').textContent = text;
    el.hidden = false;
    clearTimeout(note.t);
    // the Undo stays while the keyboard is on it
    note.t = setTimeout(function hide() {
      if (el.contains(document.activeElement)) { note.t = setTimeout(hide, 4000); return; }
      el.hidden = true;
      undo = null;
    }, 8000);
  }
  function done(it, before, text, flash) {
    undo = { it, before };
    render();
    note(text);
    const li = flash && $(`[data-code="${it.code}"]`, root);
    if (li && !window.Beats.reduce()) li.animate([{ backgroundColor: 'rgba(136, 69, 248, 0.08)' }, { backgroundColor: '#fff' }], { duration: M.beat * 2, easing: M.ease_leave });
    $('[data-undo]').focus();
  }
  const log = (it, what) => [[B.id, C.me, W.now, what]].concat(it.log || []);
  const find = (code) => C.items.find((x) => x.code === code);

  function give(code, k) {
    const it = find(code);
    const before = FLOW.move(it, { who: k, state: 'new', assigned: { by: C.me, at: W.now }, log: log(it, 'assigned') });
    done(it, before, T('{title} is with {name} now.', { title: T(it.title), name: C.name(k) }), true);
  }
  // approved, the item walks on to the next block, where nobody has it yet (an approval block waits for its reviewers)
  function approve(code) {
    const it = find(code), nx = C.next(B);
    const patch = { at: [nx.id], who: null, state: nx.kind === 'approval' ? 'approval' : 'open', due: inHours(nx.hours), log: log(it, 'approved') };
    if (it.needs) patch.needs = null;
    const before = FLOW.move(it, patch);
    delete drafts[code];
    done(it, before, T('{title} went on to {block}.', { title: T(it.title), block: T(nx.name) }), false);
  }
  function sendBack(code, text) {
    const it = find(code);
    const before = FLOW.move(it, { state: 'returned', note: { by: C.me, at: W.now, from: B.id, text }, log: log(it, 'returned') });
    delete drafts[code];
    done(it, before, T('{title} went back to {name}.', { title: T(it.title), name: C.name(it.who) }), true);
  }
  function closeBack(code) {
    delete drafts[code];
    const f = $(`#qu-bk-${code}`), b = $(`[data-back="${code}"]`);
    if (f) f.hidden = true;
    if (b) { b.setAttribute('aria-expanded', 'false'); b.focus(); }
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.view) {
      view = b.dataset.view;
      $$('[data-view]', root).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      if (view === 'list') q.set('view', 'list'); else q.delete('view');
      history.replaceState(null, '', `${location.pathname}?${q}${location.hash}`);
      $$('a[data-lang-to]').forEach((a) => { a.href = I18N.href(a.dataset.langTo); });
      return render();
    }
    // a phone's switcher shows another column without redrawing the board
    if (b.dataset.col) {
      col = b.dataset.col;
      $$('[data-col]', root).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      $$('.qu-col', root).forEach((s) => s.classList.toggle('is-on', s.dataset.k === col));
      return;
    }
    if (b.dataset.assign) return give(b.dataset.assign, b.dataset.to);
    if (b.dataset.approve) return approve(b.dataset.approve);
    if (b.dataset.back) {
      const code = b.dataset.back, open = drafts[code] == null;
      if (!open) return closeBack(code);
      drafts[code] = '';
      $(`#qu-bk-${code}`).hidden = false;
      b.setAttribute('aria-expanded', 'true');
      $(`#qu-bt-${code}`).focus();
      return;
    }
    if (b.dataset.backCancel) return closeBack(b.dataset.backCancel);
    if (b.hasAttribute('data-undo') && undo) {
      const { it } = undo;
      FLOW.move(it, undo.before);
      undo = null;
      $('[data-note]').hidden = true;
      render();
      const back = $(`[data-code="${it.code}"] .qu-title`, root);
      if (back) back.focus();
    }
  });
  root.addEventListener('input', (e) => {
    const f = e.target.closest('[data-form]');
    if (!f) return;
    drafts[f.dataset.form] = e.target.value;
    if (e.target.value.trim()) { $('.qu-err', f).hidden = true; e.target.removeAttribute('aria-invalid'); }
  });
  root.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-form]');
    if (!f) return;
    e.preventDefault();
    const ta = $('textarea', f), text = ta.value.trim();
    if (!text) { $('.qu-err', f).hidden = false; ta.setAttribute('aria-invalid', 'true'); ta.focus(); return; }
    sendBack(f.dataset.form, text);
  });
  root.addEventListener('keydown', (e) => {
    const f = e.key === 'Escape' && e.target.closest('[data-form]');
    if (f) { e.preventDefault(); closeBack(f.dataset.form); }
  });

  // ---------- someone who leads no block: the queue is the lead's, and their own work is elsewhere ----------
  if (!B) {
    $('[data-views]').hidden = true;
    const owner = C.standing === 'owner', to = owner ? 'Home' : 'My work';
    $('[data-body]').innerHTML = `<div class="qu-none"><p><b>${esc(T('{name} leads no block.', { name: C.name(C.me) }))}</b></p>`
      + `<p>${esc(T('A block’s queue belongs to its lead, who gives out its work and approves what is handed over.'))}</p>`
      + `<a class="btn" href="${C.href(owner ? 'home.html' : 'work.html')}">${IQ.icon(to, 18)}<span>${T(to)}</span></a></div>`;
    document.title = `${T('My blocks')} · ${T(C.O.name)}`;
    return;
  }

  const dept = C.O.departments.find((d) => d.id === B.dept);
  $('[data-line]').innerHTML = `<span class="qu-g" aria-hidden="true">${IQ.glyph(B.stroke)}</span><span>${esc(T(C.line.name))}${dept ? ` · ${esc(T(dept.name))}` : ''}</span>`;
  $('[data-title]').textContent = T(B.name);
  $$('[data-view]', root).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.view === view)));
  document.title = `${T(B.name)} · ${T(C.O.name)}`;
  render();
})();
