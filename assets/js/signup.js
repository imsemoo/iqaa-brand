// Self-serve sign-up in three steps, drawn as a line in the header: your account, the kind of work
// (describe it and Watar draws the line, or pick the closest field), then your line to approve. Approving
// signs the line and makes it the organization's mark, which the sign-in page then shows.
(function () {
  const root = document.querySelector('main.su');
  if (!root) return;
  const M = window.IQAA.motion;
  const LINES = window.IQAA.lines;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const STEPS = ['account', 'work', 'line'];
  const NAMES = { account: 'Your account', work: 'Your work', line: 'Your line' };
  const KINDS = ['run', 'held', 'struck', 'rest'];
  const KIND_WORD = { run: 'runs by itself', held: 'waits for a person', struck: 'done by a person', rest: 'timed wait' };
  const RESERVED = ['www', 'app', 'api', 'admin', 'mail', 'help', 'status', 'iqaa', 'watar', 'login', 'signup'];
  const FIELD_NAME = { catering: 'Catering', software: 'Software company', video: 'Video production' };
  // In Arabic a Latin name, an email, an address or a station's name sits in its own direction inside the sentence.
  const iso = (s) => (I18N.rtl ? `\u2068${s}\u2069` : s);
  // the address before a name has given one; addresses are written in Latin letters in every language
  const TEAM = T('your-team');

  const state = { step: 'account', name: '', email: '', org: '', slug: '', slugEdited: false, slugOk: false, choice: null, watar: null, draft: null, approved: false };
  const template = (key) => LINES[key].blocks.map((b) => ({ name: b.name, steps: b.steps.map((st) => st[0]) }));
  const copy = (blocks) => blocks.map((b) => ({ name: b.name, steps: b.steps.slice() }));

  // ---------- the sign-up line in the header ----------
  $$('[data-watar-ring], [data-line-ring]').forEach((r) => { r.innerHTML = Beats.svg('held'); });
  { const a = $('[data-addr-beat]'); a.innerHTML = Beats.svg('run', { draft: true }); a.dataset.draft = '1'; }

  // ---------- the preview: the team's sign-in card and the line, live ----------
  const PLACEHOLDER = [{ name: '', steps: ['run', 'held', 'run'] }];
  const fit = (blocks, width) => Math.min(1, width / (IQ.lineLayout(blocks.map((b) => b.steps)).w + 8));
  function preview() {
    const blocks = state.step === 'line' && state.draft ? state.draft
      : state.choice === 'watar' ? state.watar
      : state.choice ? template(state.choice) : null;
    $('[data-prev-name]').textContent = state.org || T('Your organization');
    $('[data-prev-addr]').textContent = `${state.slug || TEAM}.iqaa.app`;
    Beats.sig($('[data-prev-mark]'), blocks || PLACEHOLDER, { mode: 'mark', size: 40, name: state.org || T('Your organization') });
    const line = $('[data-prev-line]');
    $('[data-prev-empty]').hidden = !!blocks;
    $('[data-prev-lk]').hidden = !blocks;
    if (blocks) Beats.sig(line, blocks, { mode: 'line', k: fit(blocks, 500) }); else line.innerHTML = '';
  }

  // ---------- the bar under the form: what you chose, and the next move ----------
  const barT = $('[data-bar-t]'), next = $('[data-next]'), prev = $('[data-prev]');
  function bar() {
    const st = state.step;
    prev.hidden = st === 'account';
    if (st === 'account') { barT.textContent = T('Step 1 of 3 · Next: your organization and its line.'); next.textContent = T('Continue'); }
    if (st === 'work') {
      next.textContent = T('Continue');
      const c = state.choice;
      if (!c) barT.textContent = T('Describe your work, or pick the closest field.');
      else if (c === 'watar') barT.innerHTML = I18N.n(state.watar.length, '<b>Watar’s draft</b> · {n} station. You see it next and can change anything.', '<b>Watar’s draft</b> · {n} stations. You see it next and can change anything.');
      else barT.innerHTML = I18N.n(LINES[c].blocks.length, '<b>You picked {field}</b> · {n} station. You see it next and can change anything.', '<b>You picked {field}</b> · {n} stations. You see it next and can change anything.', { field: T(FIELD_NAME[c]) });
    }
    if (st === 'line') { barT.textContent = T('Approving makes the line real. You can still change it later.'); next.textContent = T('Approve the line'); }
    preview();
  }

  function mark(step) {
    state.step = step;
    STEPS.forEach((s, i) => {
      const li = $(`[data-st="${s}"]`);
      const cur = STEPS.indexOf(step);
      if (s === step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      li.classList.toggle('past', i < cur);
    });
    $('[data-flow-now]').textContent = T('Step {n} of 3 · {name}', { n: STEPS.indexOf(step) + 1, name: T(NAMES[step]) });
    if (state.approved) $(`[data-st="line"]`).classList.add('past');
    try { history.replaceState(null, '', `#${step}`); } catch (e) { /* file:// or sandbox */ }
    bar();
  }

  async function show(step, animate) {
    const from = $(`[data-step="${state.step}"]`), to = $(`[data-step="${step}"]`);
    if (animate === false || from === to) {
      STEPS.forEach((s) => { $(`[data-step="${s}"]`).hidden = s !== step; });
      mark(step);
      return;
    }
    await Beats.fadeOut(from);
    from.hidden = true;
    from.getAnimations().forEach((a) => a.cancel());
    to.hidden = false;
    mark(step);
    window.scrollTo({ top: 0, behavior: 'auto' });
    Beats.enter(to);
    const h = $('h1', to);
    h.setAttribute('tabindex', '-1');
    h.focus({ preventScroll: true });
  }
  $('[data-flow]').addEventListener('click', (e) => {
    const li = e.target.closest('li.past');
    if (li && !state.approved) show(li.dataset.st);
  });
  prev.addEventListener('click', () => show(STEPS[Math.max(0, STEPS.indexOf(state.step) - 1)]));
  next.addEventListener('click', () => ({ account: submitAccount, work: submitWork, line: approve }[state.step])());
  $$('form[data-form]').forEach((f) => f.addEventListener('submit', (e) => { e.preventDefault(); next.click(); }));

  function setErr(id, msg) {
    const err = $(`#${id}-err`);
    const input = document.getElementById(id);
    const field = $(`[data-field="${id}"]`) || (input && input.closest('.field'));
    if (field) field.classList.toggle('bad', !!msg);
    err.hidden = !msg;
    err.textContent = msg || '';
    if (input) { if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
  }

  $$('[data-show]').forEach((btn) => btn.addEventListener('click', () => {
    const input = document.getElementById(btn.getAttribute('aria-controls'));
    const reveal = input.type === 'password';
    input.type = reveal ? 'text' : 'password';
    btn.textContent = reveal ? T('Hide') : T('Show');
    btn.setAttribute('aria-pressed', String(reveal));
  }));

  // ---------- 1 · account ----------
  const nameI = $('#name'), mailI = $('#suemail'), pwI = $('#supw');
  nameI.addEventListener('input', () => { setErr('name', ''); });
  mailI.addEventListener('input', () => { setErr('suemail', ''); });
  pwI.addEventListener('input', () => { setErr('supw', ''); });
  function submitAccount() {
    let first = null;
    if (nameI.value.trim().length < 2) { setErr('name', T('Enter your name, as your team knows it.')); first = first || nameI; }
    const m = mailI.value.trim();
    if (!EMAIL.test(m)) { setErr('suemail', m ? T('That doesn’t look like an email address. Check for a missing @ or dot.') : T('Enter your work email.')); first = first || mailI; }
    if (pwI.value.length < 8) { const n = 8 - pwI.value.length; setErr('supw', pwI.value ? I18N.n(n, 'Add {n} more character: at least 8.', 'Add {n} more characters: at least 8.') : T('Choose a password of at least 8 characters.')); first = first || pwI; }
    if (first) return first.focus();
    state.name = nameI.value.trim().split(/\s+/)[0];
    state.email = m;
    $('[data-hello]').textContent = T('Welcome, {name}.', { name: iso(state.name) });
    show('work');
  }

  // ---------- 2 · your work: the organization, then Watar's draft or a field ----------
  const orgI = $('#orgname'), addrI = $('#addr');
  // Turkish ı has no base letter to fall back to, so it is spelled i (Kadr Yapım -> kadr-yapim)
  const slugify = (v) => v.toLowerCase().replace(/ı/g, 'i').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
  let addrTimer = null, addrPending = false, wantNext = false;
  function checkAddr() {
    const sl = state.slug;
    const beat = $('[data-addr-beat]');
    const status = $('[data-addr-status]');
    $('[data-addr]').textContent = `${sl || TEAM}.iqaa.app`;
    state.slugOk = false;
    Beats.set(beat, 'run', { draft: true });
    status.classList.remove('bad');
    clearTimeout(addrTimer);
    addrPending = false;
    // a name in Arabic letters (or any script but Latin) gives no address: say so, and how to choose one
    if (!sl && state.org && !state.slugEdited) { Beats.running(beat, false); status.textContent = T('Addresses use Latin letters and digits. Choose one with Change.'); return; }
    if (!sl) { Beats.running(beat, false); status.textContent = T('Iqaa writes the address from the name.'); return; }
    status.textContent = T('Checking the address…');
    Beats.running(beat, true);
    addrPending = true;
    addrTimer = setTimeout(() => {
      addrPending = false;
      Beats.running(beat, false);
      if (sl.length < 3 || RESERVED.includes(sl)) {
        Beats.set(beat, 'failed');
        status.textContent = sl.length < 3 ? T('An address needs at least 3 letters or digits.') : T('{address} is taken. Try {other}, or change it.', { address: iso(`${sl}.iqaa.app`), other: iso(`${sl}-team`) });
        status.classList.add('bad');
        wantNext = false;
        return;
      }
      state.slugOk = true;
      Beats.set(beat, 'run');
      status.textContent = T('Available. Your team signs in here.');
      // Continue was pressed while the address was being checked: carry on now it is free
      if (wantNext) { wantNext = false; submitWork(); }
    }, Beats.reduce() ? 0 : M.half);
  }
  orgI.addEventListener('input', () => {
    state.org = orgI.value.trim();
    setErr('orgname', '');
    if (!state.slugEdited) { state.slug = slugify(state.org); addrI.value = state.slug; checkAddr(); }
    preview();
  });
  $('[data-addr-edit]').addEventListener('click', () => { $('[data-addr-field]').hidden = false; addrI.value = state.slug; addrI.focus(); });
  addrI.addEventListener('input', () => { state.slugEdited = true; state.slug = slugify(addrI.value); setErr('addr', ''); checkAddr(); preview(); });

  function choose(c) {
    state.choice = c;
    setErr('field', '');
    $('[data-watar-out]').classList.toggle('chosen', c === 'watar');
    if (c === 'watar') $$('input[name="field"]').forEach((r) => { r.checked = false; });
    bar();
  }
  $$('input[name="field"]').forEach((r) => r.addEventListener('change', () => choose(r.value)));
  $$('[data-field-sig]').forEach((el) => {
    const blocks = template(el.dataset.fieldSig).map((b) => b.steps);
    el.innerHTML = IQ.line(blocks, { k: 0.5 });
  });

  // Watar, simulated for the prototype: a sentence or comma clause is a station; parts joined by "and" are its
  // steps. Approvals and reviews wait for a person; sending, reminding and logging run by themselves; waits rest.
  // It reads the page's language: each has its own clause breaks, its own "and", the words that open a clause without
  // naming the work, and the cues for each kind of step. Arabic joins "and" to the verb (ونطبخ), and \b does not see
  // Arabic letters, so its words end at a space instead.
  const READ = {
    en: {
      lead: /^for example:\s*/i,
      split: /[.;\n]+|,\s*(?:and\s+)?(?:then\s+)?|\bthen\b/i,
      and: /\s+and\s+/i,
      subj: /^(?:then|and|first|next|finally|after that|once|when|we|they|i|you|our team|the team|the client|a client|client|clients|companies|customers|the lead|a reviewer|someone|it|watar)\b\s*/i,
      after: /^(?:once|after)\s+\w+\s+/i,
      drop: /\b(it|them|this|that|us)\b/gi,
      held: /\b(approv\w*|sign\w* off|reviews?|ok|okay|confirm\w*|accept\w*)\b/i,
      rest: /\b(wait\w*|days?|hours?|weeks?)\b/i,
      run: /\b(send\w*|sent|remind\w*|notif\w*|tell\w*|email\w*|messag\w*|invoic\w*|log\w*)\b/i,
    },
    ar: {
      lead: /^(?:مثال|مثلا|على سبيل المثال)\s*:\s*/,
      split: /[.;؛،,؟!\n]+|\s(?:ثم|بعدها|وبعدها|بعد ذلك|وبعد ذلك)(?=\s)/,
      and: /\s+و\s+|\s+و(?=[نيتأ])(?!تر(?:\s|$))/,
      subj: /^(?:ثم|بعدها|بعد ذلك|أولا|أخيرا|نحن|هم)(?:\s+|$)|^[وف](?!تر(?:\s|$)|ي(?:\s|$)|يه|يها)(?=[نيتأ]|بعد|عند|حين|لما|ال)/,
      after: /^(?:بعد|عند|حين|لما|عندما|بمجرد)\s+\S+\s+/,
      drop: /(?:^|\s)(?:لنا|لهم|له|لها|إلينا|إليهم|ذلك|هذا|هذه|الشركات|الشركة|العملاء|العميل|الزبائن|الزبون|الفريق|فريقنا|أحدهم|وتر)(?=\s|$)/g,
      held: /وافق|موافق|يعتمد|نعتمد|تعتمد|اعتماد|يراجع|نراجع|تراجع|مراجع|يؤكد|نؤكد|تأكيد|يقبل|قبول/,
      rest: /انتظ|نتظر|يوم|أيام|ساعة|ساعات|أسبوع/,
      run: /رسل|إرسال|رسالة|ذكر|نبلغ|يبلغ|إبلاغ|إشعار|فاتور|نسجل|يسجل|تسجيل|بريد/,
    },
    tr: {
      lead: /^örneğin\s*:\s*/iu,
      split: /[.;\n]+|,\s*(?:ve\s+)?(?:sonra\s+)?|\s(?:sonra|ardından|daha sonra)(?=\s)/iu,
      and: /\s+ve\s+/iu,
      subj: /^(?:sonra|ardından|daha sonra|ve|önce|ilk olarak|İlk olarak|son olarak|en son|biz|onlar|sen|ekibimiz|ekip|bir müşteri|müşteriler|müşteri|şirketler|şirket|lider|bir inceleyici|biri|watar)(?=\s|$)\s*/iu,
      after: /^\S+(?:[yd]?[ıiuü]nca|[yd]?[ıiuü]nce|dıktan sonra|dikten sonra)\s+/iu,
      drop: /(?:^|\s)(?:bize|onlara|ona|bunu|onu|bunları|onları)(?=\s|$)/giu,
      held: /onay|kabul|incele|gözden geçir|kontrol|doğrula/iu,
      rest: /bekle|gün|saat|hafta/iu,
      run: /gönder|hatırlat|bildir|e-posta|mesaj|fatura|kayde[dt]|ilet/iu,
    },
  };
  const RD = READ[I18N.lang] || READ.en;
  function draftFrom(text) {
    const clauses = text.replace(RD.lead, '').split(RD.split).map((v) => (v || '').trim()).filter((v) => v.length > 2);
    const stations = [];
    clauses.forEach((cl) => {
      const parts = cl.split(RD.and).map((v) => v.trim()).filter(Boolean);
      let name = parts[0];
      for (let i = 0; i < 4; i++) name = name.replace(RD.subj, '');
      name = name.replace(RD.after, '').replace(RD.drop, '').replace(/\s+/g, ' ').trim()
        .split(' ').slice(0, 3).map((w, i) => (i || RD !== READ.en ? w : verb(w))).join(' ');
      if (!name) return;
      stations.push({ name: name.charAt(0).toLocaleUpperCase(I18N.lang) + name.slice(1).replace(/[’']s$/, ''), steps: parts.map(kindOf) });
    });
    return stations.slice(0, 9);
  }
  function kindOf(v) {
    if (RD.held.test(v)) return 'held';
    if (RD.rest.test(v)) return 'rest';
    if (RD.run.test(v)) return 'run';
    return 'struck';
  }
  function verb(w) {
    if (/(ss|us)$/i.test(w)) return w;
    if (/ies$/i.test(w)) return w.replace(/ies$/i, 'y');
    if (/(ches|shes|xes|sses)$/i.test(w)) return w.replace(/es$/i, '');
    if (/[^s]s$/i.test(w) && w.length > 3) return w.slice(0, -1);
    return w;
  }

  const wordsI = $('#words'), drawBtn = $('[data-draw]'), drawT = $('[data-draw-t]');
  wordsI.addEventListener('input', () => setErr('words', ''));
  async function draw() {
    const words = wordsI.value.trim();
    if (words.length < 12) { setErr('words', T('Write a sentence or two about how one job moves, from the first step to the last.')); wordsI.focus(); return; }
    const blocks = draftFrom(words);
    if (blocks.length < 2) { setErr('words', T('Watar needs at least two steps to draw a line. Add how the job starts and how it ends.')); wordsI.focus(); return; }
    const out = $('[data-watar-out]'), into = $('[data-draft-out]'), ring = $('[data-watar-ring]');
    drawBtn.disabled = true;
    Beats.running(ring, true);
    out.hidden = false;
    $('[data-watar-state]').textContent = T('Drawing…');
    // Watar writes its draft station by station, at the tempo
    Beats.sig(into, blocks, { mode: 'line', k: fit(blocks, into.clientWidth || 480) });
    await Beats.write(into, { each: M.quarter, gap: M.eighth });
    Beats.running(ring, false);
    state.watar = blocks;
    $('[data-watar-state]').textContent = I18N.n(blocks.length, '{n} station · waiting for you', '{n} stations · waiting for you');
    drawBtn.disabled = false;
    drawT.textContent = T('Draw it again');
    choose('watar');
  }
  drawBtn.addEventListener('click', draw);
  $('[data-watar-out]').addEventListener('click', () => { if (state.watar && state.choice !== 'watar') choose('watar'); });

  function submitWork() {
    let first = null;
    if (state.org.length < 2) { setErr('orgname', T('Name your organization.')); first = first || orgI; }
    else if (!state.slugOk && addrPending) { wantNext = true; barT.textContent = T('Checking the address…'); return; }
    else if (!state.slug && !state.slugEdited) {
      // the name gave no address (it is not in Latin letters): open the address for the person to write
      $('[data-addr-field]').hidden = false;
      setErr('addr', T('Write an address in Latin letters or digits.'));
      first = first || addrI;
    } else if (!state.slugOk) { first = first || ($('[data-addr-field]').hidden ? orgI : addrI); if (!$('[data-addr-field]').hidden) setErr('addr', T('Choose an address that is free.')); }
    if (!state.choice) { setErr('field', T('Describe your work for Watar, or pick the closest field.')); first = first || wordsI; }
    if (first) return first.focus();
    const fromWatar = state.choice === 'watar';
    state.draft = copy(fromWatar ? state.watar : template(state.choice));
    $('[data-line-h]').textContent = T('This is {org}’s line', { org: iso(state.org) });
    $('[data-draft-tag-t]').textContent = fromWatar ? T('Draft from Watar · waiting for your approval') : T('From the {field} template · waiting for your approval', { field: T(FIELD_NAME[state.choice]) });
    buildEditor();
    show('line');
  }

  // ---------- 3 · the line: the line itself is the editor ----------
  const edit = $('[data-edit]'), out = $('[data-sig-out]');
  const PLUS = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M12 7v10M7 12h10"/></svg>';
  function buildEditor() {
    const d = state.draft;
    // a template's station keeps its English name as data and is shown in the page's language; a station renamed
    // here holds the words the person typed
    edit.innerHTML = d.map((b, bi) => { const nm = Beats.esc(T(b.name)); return `<li class="lst" data-i="${bi}">
<div class="lst-b">${b.steps.map((k, si) => `<button type="button" class="lbeat" data-cyc="${bi}:${si}" aria-label="${T('{station}, step {n}: {kind}. Press to change.', { station: nm, n: si + 1, kind: T(KIND_WORD[k]) })}">${Beats.beat(k)}</button>`).join('')}<button type="button" class="ladd" data-add-step="${bi}" aria-label="${T('Add a step to {station}', { station: nm })}" title="${T('Add a step')}"${b.steps.length >= 6 ? ' disabled' : ''}>${PLUS}</button></div>
<input class="lst-n" type="text" value="${nm}" maxlength="28" aria-label="${T('Station {n} name', { n: bi + 1 })}" data-st-name="${bi}">
<button type="button" class="lst-x" data-rm-st="${bi}"${d.length <= 2 ? ' disabled' : ''}>${T('Remove station')}</button>
</li>`; }).join('') + `<li class="lst-new"><button type="button" class="btn small" data-add-st${d.length >= 12 ? ' disabled' : ''}>${T('Add a station')}</button></li>`;
  }
  edit.addEventListener('input', (e) => {
    const i = e.target.dataset.stName;
    if (i != null) { state.draft[+i].name = e.target.value.trim() || T('Station {n}', { n: +i + 1 }); preview(); }
  });
  edit.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t || state.approved) return;
    if (t.dataset.cyc) {
      const [bi, si] = t.dataset.cyc.split(':').map(Number);
      const k = state.draft[bi].steps[si];
      state.draft[bi].steps[si] = KINDS[(KINDS.indexOf(k) + 1) % KINDS.length];
      buildEditor();
      $(`[data-cyc="${bi}:${si}"]`).focus();
    } else if (t.dataset.addStep) {
      const bi = +t.dataset.addStep;
      state.draft[bi].steps.push('struck');
      buildEditor();
      $(`[data-cyc="${bi}:${state.draft[bi].steps.length - 1}"]`).focus();
    } else if (t.dataset.rmSt) {
      state.draft.splice(+t.dataset.rmSt, 1);
      buildEditor();
      $('[data-add-st]').focus();
    } else if (t.hasAttribute('data-add-st')) {
      state.draft.push({ name: T('New station'), steps: ['struck'] });
      buildEditor();
      $(`[data-st-name="${state.draft.length - 1}"]`).select();
    }
    preview();
  });

  async function approve() {
    if (state.approved) return;
    state.approved = true;
    const step = $('[data-step="line"]');
    next.disabled = true; prev.hidden = true;
    // the draft was held for a person; approving strikes it
    Beats.set($('[data-line-ring]'), 'struck');
    $('[data-draft-tag-t]').textContent = state.name ? T('Approved by {name}', { name: iso(state.name) }) : T('Approved by you');
    await Beats.wait(M.half);
    // approving signs the line: the pen writes it through once, then signs it on the organization's tile
    Beats.sig(out, state.draft, { mode: 'line', k: fit(state.draft, out.parentElement.clientWidth) });
    out.hidden = false;
    step.classList.add('approved');
    $('[data-line-h]').textContent = T('This is {org}’s signature', { org: iso(state.org) });
    $('[data-line-lead]').hidden = true;
    $('[data-bar]').hidden = true;
    root.classList.add('approved');
    await Beats.write(out, { each: M.quarter, gap: M.eighth / 2 });
    const markEl = $('[data-done-mark]');
    Beats.sig(markEl, state.draft, { mode: 'mark', size: 96, name: state.org, label: T('{org}’s mark', { org: state.org }) });
    const beats = state.draft.reduce((n, b) => n + b.steps.length, 0);
    $('[data-done-p]').textContent = T('{org}’s approved line, signed: {stations}, {steps}. On its tile it stands for {org} until you add a logo, and it greets everyone who signs in at {address}.', {
      org: iso(state.org), address: iso(`${state.slug}.iqaa.app`),
      stations: I18N.n(state.draft.length, '{n} station', '{n} stations'), steps: I18N.n(beats, '{n} step', '{n} steps'),
    });
    const done = $('[data-done]');
    done.hidden = false;
    Beats.write(markEl, { each: M.quarter, gap: M.beat / 24 });
    Beats.enter(done);
    try { sessionStorage.setItem('iqaa-org', JSON.stringify({ name: state.org, slug: state.slug, blocks: state.draft })); } catch (e) { /* sign-in falls back to the demo */ }
    $('[data-go]').textContent = T('Go to {address}', { address: iso(`${state.slug}.iqaa.app`) });
    $('[data-go]').focus({ preventScroll: true });
  }
  $('[data-restart]').addEventListener('click', () => {
    try { sessionStorage.removeItem('iqaa-org'); } catch (e) { /* nothing to clear */ }
    location.hash = '';
    location.reload();
  });

  // ---------- deep links (#work, #line, #approved) fill the steps before them with the demo ----------
  function demoUpTo(step) {
    const n = STEPS.indexOf(step);
    if (n >= 1) {
      // the demo person and organization as someone would type them in the page's language
      nameI.value = T('Hala'); mailI.value = 'hala@sufra.example'; pwI.value = 'prototype1';
      [nameI, mailI, pwI].forEach((i) => i.dispatchEvent(new Event('input')));
      state.name = T('Hala'); state.email = 'hala@sufra.example';
      $('[data-hello]').textContent = T('Welcome, {name}.', { name: T('Hala') });
    }
    if (n >= 2) {
      orgI.value = T('Sufra'); orgI.dispatchEvent(new Event('input'));
      // Sufra in Arabic letters gives no address of its own: the demo's is sufra
      if (state.slug !== 'sufra') { addrI.value = 'sufra'; addrI.dispatchEvent(new Event('input')); }
      state.slugOk = true;
      const r = $('input[name="field"][value="catering"]'); r.checked = true; choose('catering');
      state.draft = template('catering');
      $('[data-line-h]').textContent = T('This is {org}’s line', { org: T('Sufra') });
      $('[data-draft-tag-t]').textContent = T('From the {field} template · waiting for your approval', { field: T('Catering') });
      buildEditor();
    }
  }
  const start = location.hash.slice(1);
  if (start === 'approved') { demoUpTo('line'); show('line', false); approve(); }
  else if (STEPS.includes(start) && start !== 'account') { demoUpTo(start); show(start, false); } else show('account', false);
})();
