// The client's link: what Sufra's client opens at sufra.iqaa.app/q/<order>, without an account. Sufra leads; Iqaa
// signs off once at the foot. While the quote waits, the client's answer is an arch on the order's line; approving
// is the client's hand, and the pen writes the arch as a loop. After that, the page follows the order to the invoice.
// The client reads it in the language they chose in Sufra's header.
(function () {
  const S = window.SUFRA, esc = Beats.esc, M = window.IQAA.motion, T = window.T, N = window.I18N.n;
  const $ = (s, el) => (el || document).querySelector(s);
  const J = JOBS.on(S.line()), V = JOBS.views(J, S), K = JOBS.clients(J, S, V);
  const icon = (n, s) => IQ.icon(n, s || 18);
  const reply = S.channels.email.replyTo;
  // a code or an email inside Arabic words keeps its own order
  const bd = (s) => (I18N.rtl ? `<bdi>${s}</bdi>` : s);

  // Turkish case endings after a name, with the apostrophe: Omar’a, Sufra’nın, Sufra’da (vowel harmony, the buffer
  // letter after a vowel, d/t after a hard consonant). Arabic and English take the name as it is.
  function ek(name, cs) {
    if (I18N.lang !== 'tr') return name;
    const w = name.toLocaleLowerCase('tr').replace(/[^a-zçğıöşü]+$/, ''), v = (w.match(/[aeıioöuü]/g) || ['e']).pop();
    const soft = /[aeıioöuü]$/.test(w), hard = /[çfhkpsşt]$/.test(w), back = 'aıou'.includes(v), round = 'ouöü'.includes(v);
    const a = back ? 'a' : 'e', i = back ? (round ? 'u' : 'ı') : (round ? 'ü' : 'i');
    return `${name}’${{ dat: (soft ? 'y' : '') + a, gen: (soft ? 'n' : '') + i + 'n', loc: (hard ? 't' : 'd') + a }[cs]}`;
  }
  const ORG = esc(T(S.org.name));
  const org = { org: ORG, org_dat: ek(ORG, 'dat'), org_gen: ek(ORG, 'gen'), org_loc: ek(ORG, 'loc') };
  const v = (o) => Object.assign({}, org, o);

  // Sufra's mark, written from its own line, as on its sign-in
  const blocks = S.line().stations.map((s) => ({ name: s.name, steps: s.steps.map((x) => x.kind) }));
  Beats.sig($('[data-sig]'), blocks, { mode: 'mark', size: 40, name: S.org.name, label: T('{org}’s mark', { org: T(S.org.name) }) });

  const code = (new URLSearchParams(location.search).get('q') || '0030').replace(/\D/g, '').slice(-4).padStart(4, '0');
  const j = S.jobs.concat(S.past || []).find((x) => x.code.slice(-4) === code);
  const main = $('[data-main]'), side = $('[data-side]'), live = $('[data-live]');
  const say = (t) => { live.textContent = ''; requestAnimationFrame(() => { live.textContent = t; }); };
  const mail = bd(`<a href="mailto:${reply}">${reply}</a>`);
  $('[data-help]').innerHTML = T('Reply to any email from {org}, or write to {email}. Your order number helps: {code}.', v({ email: mail, code: bd(`<span class="mono">${j ? j.code : ''}</span>`) }));

  if (!j) {
    main.innerHTML = `<p class="qt-k">${icon('Link', 16)}${bd(`<span class="mono">sufra.iqaa.app/q/${esc(code)}</span>`)}</p>
<h1 id="qt-h">${T('This link doesn’t open an order.')}</h1>
<p class="qt-sub">${T('It may have been cut short. Open it again from {org}’s email, or write to {email}.', v({ email: mail }))}</p>`;
    return;
  }
  document.title = `${T(j.title)} · ${T(S.org.name)}`;
  const c = K.get(j.ck), C = esc(T(c ? c.C : V.short(j))), addr = c ? c.address : '';
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
  const said = (t) => { const d = dayOf(t), at = { time: V.hm(t), day: V.day(t) }; return d === 0 ? T('today at {time}', at) : d === -1 ? T('yesterday at {time}', at) : T('on {day} at {time}', at); };
  // the event: 'tomorrow at 12:30', 'on Thu 12 Nov at 19:30'; with by, the time it comes by: 'tomorrow by 12:30'
  const evSaid = (by) => {
    const d = V.days(j.iso), at = { time: V.hm(j.iso), day: V.day(j.iso) };
    if (by) return d === 0 ? T('today by {time}', at) : d === 1 ? T('tomorrow by {time}', at) : T('on {day} by {time}', at);
    return d === 0 ? T('today at {time}', at) : d === 1 ? T('tomorrow at {time}', at) : T('on {day} at {time}', at);
  };
  const dayWord = (iso) => { const d = V.days(iso); return d === 0 ? T('Today') : d === 1 ? T('Tomorrow') : d === -1 ? T('Yesterday') : V.day(iso); };
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
    const title = esc(T(j.title)), arrived = j.log && j.log.arrived;
    const lateBy = arrived ? Math.round((V.U(arrived) - V.U(j.iso)) / 6e4) : 0;
    const x = v({ name: C, title });
    switch (state) {
      case 'waiting': return [T('Hi {name}. Your quote for {title} is ready.', x), T('{org} sent it {when}. Approve it, or ask for a change.', v({ when: said(last.sent) }))];
      case 'received': return [T('Hi {name}. {org} has your order.', x), T('Your quote for {title} comes next; {org} emails you when it is ready.', x)];
      case 'approved': return [T('Thank you, {name}. {org} is on it.', x), T('You approved the quote {when}. {title} arrives {at}.', v({ title, when: said(mine.t), at: evSaid() }))];
      case 'change': return [T('Thank you, {name}. {org} has your note.', x), T('{org} sends you a new quote by email, and this link shows it too.', x)];
      case 'onway': return [T('Hi {name}. {title} is on its way.', x), T('{who} brings it {by}.', v({ who: esc(T(deliverer)), by: evSaid(true) }))];
      case 'delivered':
      case 'done': {
        const a = v({ who: esc(T(deliverer)), when: said(V.U(arrived || j.iso).getTime()) });
        const came = lateBy > 0 ? N(lateBy, '{who} arrived {when}, {n} minute after the time on your quote.', '{who} arrived {when}, {n} minutes after the time on your quote.', a) : T('{who} arrived {when}.', a);
        const bill = state === 'done' ? T('{org} sent your invoice on {day}.', v({ day: esc(V.day(V.fromLabel(j.finished))) })) : T('Your invoice comes by email.');
        return [T('Hi {name}. {title} was delivered.', x), `${came} ${bill}`];
      }
      default: {
        // approved earlier and walking the line
        const getting = T('{org} is getting everything for {title}.', x);
        const where = { buy: getting, wholesale: getting, prepare: T('{title} is being prepared.', x), deliver: T('{title} is ready to go out.', x) }[j.at] || T('{title} is on {org}’s line.', x);
        return [T('Hi {name}. {where}', { name: C, where }), T('You approved the quote {when}. {title} arrives {at}.', v({ title, when: said(V.U(last.answer).getTime()), at: evSaid() }))];
      }
    }
  }

  // ---------- the order: when, how many, where ----------
  function facts() {
    const rel = V.days(j.iso) >= 0 ? ` <span class="qt-rel">· ${esc(V.when(j.iso))}</span>` : '';
    return `<dl class="qt-dl">
<div><dt>${icon('Date', 16)}<span>${T('When')}</span></dt><dd>${T('{day}, {time}', { day: esc(V.day(j.iso)), time: mono(V.hm(j.iso)) })}${rel}</dd></div>
<div><dt>${icon('People', 16)}<span>${T('People')}</span></dt><dd>${j.people}</dd></div>
${addr ? `<div><dt>${icon('Place', 16)}<span>${T('Where')}</span></dt><dd>${esc(T(addr))}</dd></div>` : ''}
</dl>`;
  }

  // ---------- the quote: open while it waits, folded once it is answered ----------
  function quote(open) {
    const q = j.quote;
    if (!q) return '';
    const body = `<ul class="qt-items">${q.items.map((t) => `<li>${esc(T(t))}</li>`).join('')}</ul>
<p class="qt-note">${esc(T(q.note))}</p>
<p class="qt-total"><span>${T('Total')}</span><b>${esc(T(q.total))}</b></p>`;
    if (open) return `<section class="qt-q" aria-labelledby="qq-h"><h2 id="qq-h">${icon('Orders')}<span>${T('What’s in it')}</span></h2>${body}</section>`;
    const when = mine && mine.a === 'approved' ? said(mine.t) : last && last.answer ? said(V.U(last.answer).getTime()) : '';
    return `<details class="qt-q"><summary>${icon('Orders')}<span class="qt-qt"><span>${T('Your quote')}</span>${when ? `<span class="qt-qs">${T('approved {when}', { when })}</span>` : ''}</span></summary>${body}</details>`;
  }

  function actions() {
    return `<div class="qt-act">
<button class="btn primary wide" type="button" data-approve>${icon('Done')}<span>${T('Approve the quote')}</span></button>
<button class="btn wide" type="button" data-change aria-expanded="false" aria-controls="qt-chg">${icon('Message')}<span>${T('Ask for a change')}</span></button>
</div>
<form class="qt-chg" id="qt-chg" data-chg hidden novalidate>
<div class="field" data-field="qt-note"><label for="qt-note">${T('What should change?')}</label>
<textarea id="qt-note" rows="3" placeholder="${esc(T('For example: a vegetarian main for four guests'))}" aria-describedby="qt-note-err"></textarea>
<p class="err" id="qt-note-err" hidden>${T('Write what should change, in a few words.')}</p></div>
<div class="row-act"><button class="btn" type="button" data-chg-cancel>${T('Cancel')}</button><button class="btn primary" type="submit">${icon('Send')}<span>${T('Send to {org}', org)}</span></button></div>
</form>
<p class="qt-fine">${T('No account or password needed. Approving tells {org} to go ahead; nothing is paid on this page.', org)}</p>`;
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
      if (s.state === 'now') right = `<b>${T('Now')}</b>`;
      // a change sends the job back to Quote (sufra.js); the quote the client answered still went out
      if (name === 'Send the quote link' && state === 'change') { kind = 'run'; ahead = false; cls = 'done'; right = doneAt(V.U(last.sent).getTime()); }
      if (name === 'The client approves') {
        attr = ' data-answer-g';
        if (state === 'waiting') { kind = 'held'; ahead = false; cls = 'you'; right = `<b>${T('Waiting for you')}</b>`; }
        else if (mine) { kind = 'struck'; ahead = false; cls = 'done'; right = `${mine.a === 'approved' ? T('You approved') : T('You asked for a change')} · ${mono(V.hm(mine.t))}`; }
        else if (s.state === 'done') { kind = 'struck'; right = `${T('You approved')} · ${doneAt(V.U(last.answer).getTime())}`; }
        else right = T('After the quote');
      }
      if (ahead && !right) {
        const day = dayWord(j.iso);
        right = { 'Send the quote link': T('Next'), 'Salma prepares': day, 'Send the arrival time': T('{day}, in the morning', { day }),
          'Yusuf delivers': T('{day}, by {time}', { day, time: mono(V.hm(j.iso)) }), 'Send the invoice': T('After the delivery') }[name] || '';
      }
      if (name === 'Yusuf delivers' && s.state === 'done' && arrived) {
        const t = V.U(arrived).getTime();
        if (lateBy > 0) kind = 'failed';
        right = `${T('Arrived {when}', { when: dayOf(t) ? T('{day}, {time}', { day: esc(V.day(t)), time: mono(V.hm(arrived)) }) : mono(V.hm(t)) })}${lateBy > 0 ? ` · ${N(lateBy, '{n} min late', '{n} min late')}` : ''}`;
      }
      out.push(`<li class="qt-r ${cls}"><span class="g" aria-hidden="true"${attr}>${IQ.glyph(kind, { test: ahead })}</span><span class="qt-rn">${esc(T(label))}</span><span class="qt-rs">${right}</span></li>`);
      // a change sends the order back to Quote: a new quote is the next thing the client gets
      if (name === 'The client approves' && state === 'change') out.push(`<li class="qt-r next"><span class="g" aria-hidden="true">${IQ.glyph('run', { test: true })}</span><span class="qt-rn">${T('A new quote')}</span><span class="qt-rs">${T('Next')}</span></li>`);
    });
    return out.join('');
  }

  // ---------- one render for every state ----------
  function render() {
    const state = stateOf(), [h1, sub] = head(state);
    const k = state === 'waiting' || state === 'change' ? 'Quote' : 'Order';
    const note = state === 'change' && mine.note ? `<blockquote class="qt-said"><p>${esc(mine.note)}</p><footer>${T('Your note')} · ${mono(V.hm(mine.t))}</footer></blockquote>` : '';
    main.innerHTML = `<p class="qt-k">${esc(T(k))} · ${bd(`<span class="mono">${j.code}</span>`)}</p>
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
    say(T('Approved. {org} is on it.', { org: T(S.org.name) }));
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
    say(T('{org} has your note and sends a new quote.', { org: T(S.org.name), org_dat: ek(T(S.org.name), 'dat') }));
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
