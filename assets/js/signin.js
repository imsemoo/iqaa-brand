// Sign-in on an organization's subdomain, in one quiet card. The beat grammar lives in the details: the
// organization's mark is its own line signed on a tile; a completed field gets a stroke; the check runs as a
// ticking stroke in the button; on success the pen writes the organization's line and marks your station.
(function () {
  const card = document.querySelector('[data-card]');
  if (!card) return;
  const M = window.IQAA.motion;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // Who works where in the Sufra demo (build plan cast).
  const CAST = { reem: 1, salma: 4, yusuf: 5, hala: 0 };

  function orgFromSignUp() {
    try {
      const o = JSON.parse(sessionStorage.getItem('iqaa-org') || 'null');
      if (o && o.name && o.slug && Array.isArray(o.blocks) && o.blocks.length) return o;
    } catch (e) { /* storage unavailable: fall back to the demo organization */ }
    return null;
  }

  const L = window.IQAA.lines.catering;
  const org = orgFromSignUp() || {
    name: L.org, slug: 'sufra', demo: true,
    blocks: L.blocks.map((b) => ({ name: b.name, steps: b.steps.map((s) => s[0]) })),
  };

  $$('[data-org-name]').forEach((e) => { e.textContent = org.name; });
  $$('[data-org-addr]').forEach((e) => { e.textContent = `${org.slug}.iqaa.app`; });
  document.title = `Sign in · ${org.name}`;
  const mark = $('[data-sig]');
  Beats.sig(mark, org.blocks, { mode: 'mark', size: 40, name: org.name, label: `${org.name}’s mark` });
  const reduce = Beats.reduce();
  // on arrival the pen signs the organization's mark, one beat in all
  Beats.write(mark, { delay: M.quarter, each: M.quarter, gap: M.beat / 24 });
  const lineEl = $('[data-card-line]');
  // the organization's whole line is the card's divider: the pen signs the mark, then writes the line under it
  const fitK = () => Math.min(1, (card.clientWidth - 64) / (IQ.lineLayout(org.blocks.map((b) => b.steps)).w + 8));
  function quietLine() {
    Beats.sig(lineEl, org.blocks, { mode: 'line', k: fitK(), names: false });
    lineEl.setAttribute('aria-label', `${org.name}’s line, its signature: ${org.blocks.length} stations`);
  }
  quietLine();
  Beats.write(lineEl, { delay: M.quarter + M.beat / 2, each: M.quarter, gap: M.eighth / 3 });

  const enter = Beats.enter;
  const fadeOut = Beats.fadeOut;
  const resize = (h0) => Beats.resize(card, h0);
  const swap = (from, to, during) => Beats.swap(card, from, to, during);

  // a completed field strikes a beat at the end of its input, where people look for it
  function beatFor(id) {
    const input = document.getElementById(id);
    let box = input.parentElement;
    if (!box.classList.contains('pw') && !box.classList.contains('in')) {
      box = document.createElement('div');
      box.className = 'in';
      input.before(box);
      box.append(input);
    }
    let b = $('.fb', box);
    if (!b) { b = document.createElement('span'); b.className = 'b fb'; b.dataset.k = 'struck'; b.setAttribute('aria-hidden', 'true'); box.append(b); }
    return b;
  }
  function done(id, on) {
    const b = beatFor(id);
    if (on && !b.classList.contains('on')) { b.innerHTML = Beats.svg('struck'); Beats.set(b, 'struck'); }
    b.classList.toggle('on', on);
  }

  function setErr(id, msg) {
    const field = $(`[data-field="${id}"]`);
    const err = $(`#${id}-err`);
    const input = $(`#${id}`);
    field.classList.toggle('bad', !!msg);
    err.hidden = !msg;
    err.textContent = msg || '';
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }

  const email = $('#email'), pw = $('#pw');
  ['email', 'pw', 'fgemail'].forEach(beatFor);
  email.addEventListener('input', () => { done('email', EMAIL.test(email.value.trim())); setErr('email', ''); });
  pw.addEventListener('input', () => { done('pw', pw.value.length > 0); setErr('pw', ''); });

  $$('[data-show]').forEach((btn) => btn.addEventListener('click', () => {
    const input = document.getElementById(btn.getAttribute('aria-controls'));
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.textContent = show ? 'Hide' : 'Show';
    btn.setAttribute('aria-pressed', String(show));
  }));

  const form = $('[data-signin]');
  const submit = $('[data-submit]');
  const submitT = $('[data-submit-t]');
  const check = $('[data-check]');
  const formErr = $('[data-form-err]');
  check.innerHTML = Beats.svg('run', { pal: 'dark' });

  function busy(on, text) {
    submit.disabled = on;
    check.hidden = !on;
    Beats.running(check, on);
    submitT.textContent = text;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formErr.hidden = true;
    const ev = email.value.trim();
    let first = null;
    if (!ev) { setErr('email', 'Enter your work email.'); first = first || email; }
    else if (!EMAIL.test(ev)) { setErr('email', 'That doesn’t look like an email address. Check for a missing @ or dot.'); first = first || email; }
    if (!pw.value) { setErr('pw', 'Enter your password.'); first = first || pw; }
    if (first) { first.focus(); return; }

    busy(true, 'Checking…');
    await Beats.wait(M.beat);
    if (pw.value === 'wrong') {
      busy(false, 'Sign in');
      formErr.textContent = 'That email and password don’t match. Check them, or reset your password.';
      const h0 = card.offsetHeight;
      formErr.hidden = false;
      resize(h0);
      if (!reduce) formErr.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: M.quarter, easing: M.ease_arrive });
      pw.focus();
      pw.select();
      return;
    }
    await unfold(ev);
  });

  function person(ev) {
    const local = ev.split('@')[0].split(/[._+-]/)[0] || 'there';
    return local.charAt(0).toUpperCase() + local.slice(1).toLowerCase();
  }
  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }

  const signinP = $('[data-panel="signin"]'), forgotP = $('[data-panel="forgot"]'), welcome = $('[data-welcome]');

  async function unfold(ev) {
    const name = person(ev);
    // A person lands on a station where a person works, never on one that only runs by itself.
    const firstHand = Math.max(0, org.blocks.findIndex((b) => b.steps.some((k) => k === 'held' || k === 'struck')));
    const idx = org.demo ? (CAST[name.toLowerCase()] ?? firstHand) : firstHand;
    const station = org.blocks[idx].name;
    $('[data-greet]').textContent = `${greeting()}, ${name}.`;
    // Today greets the same person
    try { sessionStorage.setItem('iqaa-person', name); } catch (e) { /* Today falls back to the demo cast */ }
    $('[data-w-p]').textContent = org.demo && name.toLowerCase() === 'reem'
      ? `3 jobs are waiting for you at ${station}.`
      : `Your work on ${org.name}’s line starts at ${station}.`;
    // the form leaves; the pen writes the organization's line across the card, your station marked; the
    // greeting arrives line by line while it writes
    const h0 = card.offsetHeight;
    await fadeOut(signinP);
    Beats.sig(lineEl, org.blocks, { mode: 'line', k: fitK(), me: idx, names: true });
    $$('text', lineEl).forEach((t, i) => { if (i !== idx) t.remove(); });
    card.classList.add('done');
    signinP.hidden = true;
    lineEl.hidden = false;
    welcome.hidden = false;
    resize(h0);
    const writing = Beats.write(lineEl, { each: M.quarter, gap: M.eighth / 2 });
    enter(welcome, M.half);
    await writing;
    $('[data-greet]').focus({ preventScroll: true });
  }

  $('[data-again]').addEventListener('click', async () => {
    const h0 = card.offsetHeight;
    await fadeOut(welcome);
    card.classList.remove('done');
    welcome.hidden = true;
    [welcome, lineEl, signinP].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
    quietLine();
    signinP.hidden = false;
    resize(h0);
    enter(signinP);
    form.reset();
    formErr.hidden = true;
    ['email', 'pw'].forEach((n) => done(n, false));
    busy(false, 'Sign in');
    email.focus();
  });

  // Forgot: the answer never says whether the address has an account.
  $('[data-forgot]').addEventListener('click', async () => {
    await swap(signinP, forgotP, () => {
      $('#fgemail').value = email.value;
      $('#fgemail').dispatchEvent(new Event('input'));
    });
    $('#fg-h').setAttribute('tabindex', '-1');
    $('#fg-h').focus({ preventScroll: true });
  });
  $('[data-back]').addEventListener('click', async () => { await swap(forgotP, signinP); email.focus({ preventScroll: true }); });
  const fg = $('#fgemail');
  const fgCheck = $('[data-fg-check]');
  fgCheck.innerHTML = Beats.svg('run', { pal: 'dark' });
  fg.addEventListener('input', () => { done('fgemail', EMAIL.test(fg.value.trim())); setErr('fgemail', ''); });
  $('[data-forgot-form]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = fg.value.trim();
    if (!EMAIL.test(v)) { setErr('fgemail', v ? 'That doesn’t look like an email address.' : 'Enter your work email.'); fg.focus(); return; }
    const btn = $('[data-fg-submit]');
    btn.disabled = true; fgCheck.hidden = false; Beats.running(fgCheck, true);
    await Beats.wait(M.beat);
    btn.disabled = false; fgCheck.hidden = true; Beats.running(fgCheck, false);
    const ok = $('[data-forgot-ok]');
    ok.textContent = `If ${v} has an account at ${org.name}, the link is on its way. (Prototype: nothing was sent.)`;
    const h0 = card.offsetHeight;
    ok.hidden = false;
    resize(h0);
    if (!reduce) ok.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: M.quarter, easing: M.ease_arrive });
  });

  // #signed-in plays the success as Reem, for review and demos.
  if (location.hash === '#signed-in') {
    email.value = 'reem@sufra.example'; email.dispatchEvent(new Event('input'));
    pw.value = 'prototype'; pw.dispatchEvent(new Event('input'));
    form.requestSubmit();
  }
})();
