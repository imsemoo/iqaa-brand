// The client's link: what Sufra's client opens at sufra.iqaa.app/q/<order>, without an account. Sufra leads; Iqaa
// signs off once at the foot. While the quote waits, the client's answer is an arch on the order's line; approving
// is the client's hand, and the pen writes the arch as a loop. After that, the page follows the order to the invoice.
(function () {
  const S = window.SUFRA, esc = Beats.esc, M = window.IQAA.motion;
  const $ = (s, el) => (el || document).querySelector(s);
  const J = JOBS.on(S.line()), V = JOBS.views(J, S), K = JOBS.clients(J, S, V);
  const icon = (n, s) => IQ.icon(n, s || 18);
  const reply = S.channels.email.replyTo;

  // Sufra's mark, written from its own line, as on its sign-in
  const blocks = S.line().stations.map((s) => ({ name: s.name, steps: s.steps.map((x) => x.kind) }));
  Beats.sig($('[data-sig]'), blocks, { mode: 'mark', size: 40, name: S.org.name, label: `${S.org.name}’s mark` });

  const code = (new URLSearchParams(location.search).get('q') || '0030').replace(/\D/g, '').slice(-4).padStart(4, '0');
  const j = S.jobs.concat(S.past || []).find((x) => x.code.slice(-4) === code);
  const main = $('[data-main]'), side = $('[data-side]'), live = $('[data-live]');
  const say = (t) => { live.textContent = ''; requestAnimationFrame(() => { live.textContent = t; }); };
  $('[data-help]').innerHTML = `Reply to any email from ${esc(S.org.name)}, or write to <a href="mailto:${reply}">${reply}</a>. Your order number helps: <span class="mono">${j ? j.code : ''}</span>.`;

  if (!j) {
    main.innerHTML = `<p class="qt-k">${icon('Link', 16)}<span class="mono">sufra.iqaa.app/q/${esc(code)}</span></p>
<h1 id="qt-h">This link doesn’t open an order.</h1>
<p class="qt-sub">It may have been cut short. Open it again from ${esc(S.org.name)}’s email, or write to <a href="mailto:${reply}">${reply}</a>.</p>`;
    return;
  }
  document.title = `${j.title} · ${S.org.name}`;
  const c = K.get(j.ck), C = c ? c.C : V.short(j), addr = c ? c.address : '';
  const steps = V.clock(j), st = (name) => steps.find((s) => s.x.name === name);
  const rounds = (j.log && j.log.rounds) || [], last = rounds[rounds.length - 1];
  const deliverer = (st('Yusuf delivers') || { x: { who: 'Sufra' } }).x.who;

  // an answer given on this page; kept for the visit so a reload shows it ('Start over' clears it)
  const KEY = 'iqaa-answers';
  const answers = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
  let mine = answers()[j.code] || null;
  function keep(a) {
    mine = a;
    try { const all = answers(); if (a) all[j.code] = a; else delete all[j.code]; sessionStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* storage blocked: this visit only */ }
  }

  // ---------- times, as a client reads them ----------
  const dayOf = (t) => V.days(V.iso(t));
  // 'today at 08:52', 'yesterday at 21:40', 'on Wed 28 Oct at 21:40'
  const said = (t) => { const d = dayOf(t); return `${d === 0 ? 'today' : d === -1 ? 'yesterday' : `on ${V.day(t)}`} at ${V.hm(t)}`; };
  // the event: 'tomorrow at 12:30', 'on Thu 12 Nov at 19:30'
  const evSaid = () => { const d = V.days(j.iso); return `${d === 0 ? 'today' : d === 1 ? 'tomorrow' : `on ${V.day(j.iso)}`} at ${V.hm(j.iso)}`; };
  const dayWord = (iso) => { const d = V.days(iso); return d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : d === -1 ? 'Yesterday' : V.day(iso); };
  const mono = (t) => `<span class="mono">${t}</span>`;
  // a step already done, in the line beside the quote: today's by its time, earlier ones by their day
  const doneAt = (t) => (dayOf(t) === 0 ? mono(V.hm(t)) : esc(V.day(t)));

  // where the order stands for its client
  function stateOf() {
    if (mine) return mine.a;
    if (j.finished) return 'done';
    if (V.delivered(j)) return 'delivered';
    if (J.stepOf(j).name === 'The client approves') return 'waiting';
    const sent = st('Send the quote link');
    if (!sent || sent.state !== 'done') return 'received';
    const told = st('Send the arrival time');
    return told && told.state === 'done' ? 'onway' : 'going';
  }

  // ---------- the head of the page: one sentence for where the order is ----------
  function head(state) {
    const T = esc(j.title), arrived = j.log && j.log.arrived;
    const lateBy = arrived ? Math.round((V.U(arrived) - V.U(j.iso)) / 6e4) : 0;
    switch (state) {
      case 'waiting': return [`Hi ${esc(C)}. Your quote for ${T} is ready.`, `${esc(S.org.name)} sent it ${said(last.sent)}. Approve it, or ask for a change.`];
      case 'received': return [`Hi ${esc(C)}. ${esc(S.org.name)} has your order.`, `Your quote for ${T} comes next; ${esc(S.org.name)} emails you when it is ready.`];
      case 'approved': return [`Thank you, ${esc(C)}. ${esc(S.org.name)} is on it.`, `You approved the quote ${said(mine.t)}. ${T} arrives ${evSaid()}.`];
      case 'change': return [`Thank you, ${esc(C)}. ${esc(S.org.name)} has your note.`, `${esc(S.org.name)} sends you a new quote by email, and this link shows it too.`];
      case 'onway': return [`Hi ${esc(C)}. ${T} is on its way.`, `${esc(deliverer)} brings it ${evSaid().replace(' at ', ' by ')}.`];
      case 'delivered':
      case 'done': return [`Hi ${esc(C)}. ${T} was delivered.`,
        `${esc(deliverer)} arrived ${said(V.U(arrived || j.iso).getTime())}${lateBy > 0 ? `, ${lateBy} minutes after the time on your quote` : ''}. ${state === 'done' ? `${esc(S.org.name)} sent your invoice on ${esc(j.finished.split(',')[0])}.` : 'Your invoice comes by email.'}`];
      default: {
        // approved earlier and walking the line
        const where = { buy: `${esc(S.org.name)} is getting everything for ${T}.`, wholesale: `${esc(S.org.name)} is getting everything for ${T}.`, prepare: `${T} is being prepared.`, deliver: `${T} is ready to go out.` }[j.at] || `${T} is on ${esc(S.org.name)}’s line.`;
        return [`Hi ${esc(C)}. ${where}`, `You approved the quote ${said(V.U(last.answer).getTime())}. ${T} arrives ${evSaid()}.`];
      }
    }
  }

  // ---------- the order: when, how many, where ----------
  function facts() {
    const rel = V.days(j.iso) >= 0 ? ` <span class="qt-rel">· ${esc(V.when(j.iso))}</span>` : '';
    return `<dl class="qt-dl">
<div><dt>${icon('Date', 16)}<span>When</span></dt><dd>${esc(V.day(j.iso))}, ${mono(V.hm(j.iso))}${rel}</dd></div>
<div><dt>${icon('People', 16)}<span>People</span></dt><dd>${j.people}</dd></div>
${addr ? `<div><dt>${icon('Place', 16)}<span>Where</span></dt><dd>${esc(addr)}</dd></div>` : ''}
</dl>`;
  }

  // ---------- the quote: open while it waits, folded once it is answered ----------
  function quote(open) {
    const q = j.quote;
    if (!q) return '';
    const body = `<ul class="qt-items">${q.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
<p class="qt-note">${esc(q.note)}</p>
<p class="qt-total"><span>Total</span><b>${esc(q.total)}</b></p>`;
    if (open) return `<section class="qt-q" aria-labelledby="qq-h"><h2 id="qq-h">${icon('Orders')}<span>What’s in it</span></h2>${body}</section>`;
    const when = mine && mine.a === 'approved' ? said(mine.t) : last && last.answer ? said(V.U(last.answer).getTime()) : '';
    return `<details class="qt-q"><summary>${icon('Orders')}<span class="qt-qt"><span>Your quote</span>${when ? `<span class="qt-qs">approved ${when}</span>` : ''}</span></summary>${body}</details>`;
  }

  function actions() {
    return `<div class="qt-act">
<button class="btn primary wide" type="button" data-approve>${icon('Done')}<span>Approve the quote</span></button>
<button class="btn wide" type="button" data-change aria-expanded="false" aria-controls="qt-chg">${icon('Message')}<span>Ask for a change</span></button>
</div>
<form class="qt-chg" id="qt-chg" data-chg hidden novalidate>
<div class="field" data-field="qt-note"><label for="qt-note">What should change?</label>
<textarea id="qt-note" rows="3" placeholder="For example: a vegetarian main for four guests" aria-describedby="qt-note-err"></textarea>
<p class="err" id="qt-note-err" hidden>Write what should change, in a few words.</p></div>
<div class="row-act"><button class="btn" type="button" data-chg-cancel>Cancel</button><button class="btn primary" type="submit">${icon('Send')}<span>Send to ${esc(S.org.name)}</span></button></div>
</form>
<p class="qt-fine">No account or password needed. Approving tells ${esc(S.org.name)} to go ahead; nothing is paid on this page.</p>`;
  }

  // ---------- the order's line, as its client sees it: the steps that reach them, in the line's own strokes ----------
  // Keyed by Sufra's step names, like REACH and CHASE in jobs.js; a renamed step drops out of this list.
  const ROWS = [
    ['Send the client a receipt', 'Sufra got your order'],
    ['Send the quote link', 'Your quote'],
    ['The client approves', 'Your answer'],
    ['Salma prepares', 'Sufra prepares it'],
    ['Send the arrival time', 'Your arrival time'],
    ['Yusuf delivers', 'Delivery'],
    ['Send the invoice', 'Your invoice'],
  ];
  function journey(state) {
    const arrived = j.log && j.log.arrived, lateBy = arrived ? Math.round((V.U(arrived) - V.U(j.iso)) / 6e4) : 0;
    const out = [];
    ROWS.forEach(([name, label]) => {
      const s = st(name);
      if (!s) return;
      let kind = s.x.kind, ahead = s.state === 'next', right = '', cls = s.state, attr = '';
      if (s.state === 'done') right = doneAt(s.t);
      if (s.state === 'now') right = '<b>Now</b>';
      // a change sends the job back to Quote (sufra.js); the quote the client answered still went out
      if (name === 'Send the quote link' && state === 'change') { kind = 'run'; ahead = false; cls = 'done'; right = doneAt(V.U(last.sent).getTime()); }
      if (name === 'The client approves') {
        attr = ' data-answer-g';
        if (state === 'waiting') { kind = 'held'; ahead = false; cls = 'you'; right = '<b>Waiting for you</b>'; }
        else if (mine) { kind = 'struck'; ahead = false; cls = 'done'; right = `${mine.a === 'approved' ? 'You approved' : 'You asked for a change'} · ${mono(V.hm(mine.t))}`; }
        else if (s.state === 'done') { kind = 'struck'; right = `You approved · ${doneAt(V.U(last.answer).getTime())}`; }
        else right = 'After the quote';
      }
      if (ahead && !right) {
        right = { 'Send the quote link': 'Next', 'Salma prepares': dayWord(j.iso), 'Send the arrival time': `${dayWord(j.iso)}, in the morning`,
          'Yusuf delivers': `${dayWord(j.iso)}, by ${mono(V.hm(j.iso))}`, 'Send the invoice': 'After the delivery' }[name] || '';
      }
      if (name === 'Yusuf delivers' && s.state === 'done' && arrived) {
        if (lateBy > 0) kind = 'failed';
        right = `Arrived ${doneAt(V.U(arrived).getTime())}${dayOf(V.U(arrived).getTime()) ? `, ${mono(V.hm(arrived))}` : ''}${lateBy > 0 ? ` · ${lateBy} min late` : ''}`;
      }
      out.push(`<li class="qt-r ${cls}"><span class="g" aria-hidden="true"${attr}>${IQ.glyph(kind, { test: ahead })}</span><span class="qt-rn">${esc(label)}</span><span class="qt-rs">${right}</span></li>`);
      // a change sends the order back to Quote: a new quote is the next thing the client gets
      if (name === 'The client approves' && state === 'change') out.push(`<li class="qt-r next"><span class="g" aria-hidden="true">${IQ.glyph('run', { test: true })}</span><span class="qt-rn">A new quote</span><span class="qt-rs">Next</span></li>`);
    });
    return out.join('');
  }

  // ---------- one render for every state ----------
  function render() {
    const state = stateOf(), [h1, sub] = head(state);
    const k = state === 'waiting' || state === 'change' ? 'Quote' : 'Order';
    const note = state === 'change' && mine.note ? `<blockquote class="qt-said"><p>${esc(mine.note)}</p><footer>Your note · ${mono(V.hm(mine.t))}</footer></blockquote>` : '';
    main.innerHTML = `<p class="qt-k">${esc(k)} · <span class="mono">${j.code}</span></p>
<h1 id="qt-h" tabindex="-1">${h1}</h1>
<p class="qt-sub">${sub}</p>
${note}${facts()}
${state === 'waiting' ? quote(true) + actions() : state === 'received' || state === 'change' ? '' : quote(false)}`;
    $('[data-journey]').innerHTML = journey(state);
    side.hidden = false;
    return state;
  }

  // ---------- the client's answers ----------
  async function approve() {
    keep({ a: 'approved', t: V.now() });
    render();
    // the arch becomes a loop: the client's own hand on Sufra's line
    const g = $('[data-answer-g]');
    if (g) Beats.write(g, { each: M.half, gap: 0 });
    Beats.enter(main);
    $('#qt-h').focus();
    say(`Approved. ${S.org.name} is on it.`);
  }
  function openChange(on) {
    const f = $('[data-chg]'), b = $('[data-change]');
    f.hidden = !on;
    b.setAttribute('aria-expanded', String(on));
    if (on) { Beats.enter(f); $('#qt-note').focus(); } else b.focus();
  }
  function sendChange(e) {
    e.preventDefault();
    const field = $('#qt-note'), err = $('#qt-note-err'), note = field.value.trim();
    const bad = !note;
    err.hidden = !bad;
    field.closest('.field').classList.toggle('bad', bad);
    field.setAttribute('aria-invalid', String(bad));
    if (bad) { field.focus(); return; }
    keep({ a: 'change', t: V.now(), note });
    render();
    const g = $('[data-answer-g]');
    if (g) Beats.write(g, { each: M.half, gap: 0 });
    Beats.enter(main);
    $('#qt-h').focus();
    say(`${S.org.name} has your note and sends a new quote.`);
  }

  main.addEventListener('click', (e) => {
    if (e.target.closest('[data-approve]')) approve();
    else if (e.target.closest('[data-change]')) openChange($('[data-chg]').hidden);
    else if (e.target.closest('[data-chg-cancel]')) openChange(false);
  });
  main.addEventListener('submit', (e) => { if (e.target.matches('[data-chg]')) sendChange(e); });
  main.addEventListener('input', (e) => {
    if (e.target.id !== 'qt-note' || !e.target.value.trim()) return;
    $('#qt-note-err').hidden = true;
    e.target.closest('.field').classList.remove('bad');
    e.target.removeAttribute('aria-invalid');
  });
  main.addEventListener('keydown', (e) => { if (e.key === 'Escape' && e.target.id === 'qt-note') { e.preventDefault(); openChange(false); } });
  // the prototype's way back to the start: the answer given here is forgotten, and the page loads again because
  // sufra.js moved the job by that answer when it loaded
  const reset = $('[data-reset]');
  if (reset) reset.addEventListener('click', () => { keep(null); location.reload(); });

  render();
})();
