// My work: the person's own items. Three lists, in the same order for everyone: what is in progress (being done, sent
// back, or waiting for their approval), what was given to them and not started, and what is open in a block where
// their role may claim. Each item says where it is on its line in the line's strokes, what happened to it last, and
// the one thing to do with it. Starting and claiming are kept for the visit (flow.js) and can be undone.
(function () {
  const root = document.querySelector('main.wk');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'heba', masar: 'wasim', wamda: 'nadine' });
  const T = window.T, N = window.I18N.n, esc = FLOW.esc, NO = C.noun;
  const $ = (s, el) => (el || document).querySelector(s);
  const M = window.IQAA.motion;
  let filter = 'all', undo = null;

  // due, or late by how much: late is the one red on the screen
  function flag(it) {
    const l = FLOW.late(it.due);
    return l ? `<span class="wk-flag late">${IQ.icon('Late', 16)}${esc(l)}</span>`
      : `<span class="wk-flag">${IQ.icon('Date', 16)}${esc(T('Due {when}', { when: FLOW.when(it.due) }))}</span>`;
  }
  // the last thing that happened to the item, as its person needs to know it
  function event(it) {
    const f = it.fields || {};
    if (it.state === 'returned' && it.note) return T('Sent back from {block} by {name}: “{text}”', { block: T(C.block(it.note.from).name), name: C.name(it.note.by), text: T(it.note.text) });
    if (it.state === 'new' && it.assigned) return T('Given to you by {name}, {when}', { name: C.name(it.assigned.by), when: FLOW.ago(it.assigned.at) });
    if (it.state === 'open') return it.needs ? T('Needs {skill}', { skill: T(it.needs) }) : T('Nobody has it yet');
    if (it.state === 'approval') return T('Waiting for your approval');
    if (f.pr) return N(f.pr.passed, 'Pull request #{pr}: {n} check passed, {running} running', 'Pull request #{pr}: {n} checks passed, {running} running', { pr: f.pr.n, running: f.pr.running });
    if (f.video && f.video.length) return T('Version {n} uploaded {when}', { n: f.video[0].v, when: FLOW.ago(f.video[0].at) });
    return '';
  }
  function row(it, act) {
    const ev = event(it);
    return `<li class="wk-row${FLOW.late(it.due) ? ' is-late' : ''}${it.state === 'returned' ? ' is-back' : ''}" data-code="${it.code}">
<div class="wk-top"><a class="wk-title" href="${C.href('item.html', { code: it.code })}">${esc(T(it.title))}</a>${flag(it)}</div>
<div class="wk-where">${C.strip(it)}<span class="wk-at">${esc(T(C.at(it).name))}</span><code dir="ltr">${it.code}</code></div>
${ev ? `<p class="wk-ev">${esc(ev)}</p>` : ''}
<div class="wk-act">${act}</div></li>`;
  }

  const open = (it) => `<a class="btn small" href="${C.href('item.html', { code: it.code })}">${T('Open')}</a>`;
  function render() {
    const w = C.work();
    const all = w.doing.concat(w.fresh), lateN = all.filter((it) => FLOW.late(it.due)).length;
    const only = (a) => (filter === 'late' ? a.filter((it) => FLOW.late(it.due)) : a);
    const sec = (key, title, list, act, hint) => (list.length ? `<section class="wk-sec" aria-labelledby="wk-${key}">
<div class="wk-sh"><h2 id="wk-${key}">${esc(title)} <span>${list.length}</span></h2>${hint ? `<p>${esc(hint)}</p>` : ''}</div>
<ol class="wk-list">${list.map((it) => row(it, act(it))).join('')}</ol></section>` : '');
    const html = sec('doing', T('In progress'), only(w.doing), open)
      + sec('fresh', T('New for you'), only(w.fresh), (it) => `<button type="button" class="btn small ink" data-start="${it.code}">${IQ.icon('Take', 18)}<span>${T('Start working')}</span></button>`)
      + (filter === 'all' ? sec('open', T('Open to claim'), w.open, (it) => `<button type="button" class="btn small" data-claim="${it.code}">${IQ.icon('Take', 18)}<span>${T('Claim')}</span></button>`,
        T('Your role here may take work nobody has yet.')) : '');
    $('[data-lists]').innerHTML = html || `<div class="wk-empty"><p><b>${esc(filter === 'late' ? T('Nothing of yours is late.') : NO.t('No job is yours right now.'))}</b></p>
<p>${esc(T('New work reaches you here when someone gives it to you, or when you claim it.'))}</p></div>`;
    $('[data-sum]').textContent = all.length ? `${NO.n(all.length, '{n} job', '{n} jobs')}${lateN ? ` · ${NO.n(lateN, '{n} late job', '{n} late jobs')}` : ''}` : NO.t('No job is yours right now.');
    $('[data-n-all]').textContent = all.length;
    $('[data-n-late]').textContent = lateN;
    renderSide(w);
  }

  // the side: where the person works, with their roles, and what happened lately to what is theirs
  function renderSide(w) {
    const where = C.mine.map((b) => {
      const roles = C.rolesIn(b).map((r) => T(r.role)).join(T(', '));
      const n = C.items.filter((it) => it.at.includes(b.id) && it.who === C.me).length;
      return `<li><span class="wk-g" aria-hidden="true">${IQ.glyph(b.stroke)}</span><span><b>${esc(T(b.name))}</b><small>${esc(roles)}</small></span><i>${n}</i></li>`;
    }).join('');
    const seen = [];
    C.items.filter((it) => it.who === C.me || (it.note && it.note.by === C.me)).forEach((it) => {
      if (it.note && it.who === C.me) seen.push({ at: it.note.at, t: T('{name} sent back {title}', { name: C.name(it.note.by), title: T(it.title) }) });
      if (it.assigned && it.who === C.me) seen.push({ at: it.assigned.at, t: T('{name} gave you {title}', { name: C.name(it.assigned.by), title: T(it.title) }) });
    });
    seen.sort((a, b) => b.at.localeCompare(a.at));
    $('[data-side]').innerHTML = `<section class="wk-box"><h2>${IQ.icon('Line', 18)}${T('Where you work')}</h2><p class="wk-line">${esc(T(C.line.name))}</p><ul class="wk-blocks">${where}</ul></section>`
      + (seen.length ? `<section class="wk-box"><h2>${IQ.icon('Notifications', 18)}${T('Lately')}</h2><ul class="wk-feed">${seen.slice(0, 4).map((e) => `<li><span>${esc(e.t)}</span><time>${esc(FLOW.ago(e.at))}</time></li>`).join('')}</ul></section>` : '');
  }

  // ---------- starting, claiming, and undoing either ----------
  function note(text) {
    const el = $('[data-note]');
    $('[data-note-t]').textContent = text;
    el.hidden = false;
    clearTimeout(note.t);
    note.t = setTimeout(() => { el.hidden = true; undo = null; }, 8000);
  }
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.f) {
      filter = b.dataset.f;
      root.querySelectorAll('[data-f]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      return render();
    }
    const code = b.dataset.start || b.dataset.claim;
    if (code) {
      const it = C.items.find((x) => x.code === code);
      const before = FLOW.move(it, b.dataset.claim ? { who: C.me, state: 'work' } : { state: 'work' });
      undo = { it, before };
      render();
      note(b.dataset.claim ? T('{title} is yours now. It is in progress.', { title: T(it.title) }) : T('{title} is in progress.', { title: T(it.title) }));
      const li = $(`[data-code="${code}"]`);
      if (li && !window.Beats.reduce()) li.animate([{ backgroundColor: 'rgba(136, 69, 248, 0.08)' }, { backgroundColor: 'transparent' }], { duration: M.beat * 2, easing: M.ease_leave });
      $('[data-undo]').focus();
      return;
    }
    if (b.hasAttribute('data-undo') && undo) {
      FLOW.move(undo.it, undo.before);
      undo = null;
      $('[data-note]').hidden = true;
      render();
    }
  });

  $('[data-day]').textContent = T(window.WORLD.day);
  document.title = `${T('My work')} · ${T(C.O.name)}`;
  render();
})();
