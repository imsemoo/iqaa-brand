// One client: whose move it is now, its line with Sufra written in the signature's hand (one word per order), the
// open order with the steps that reach the client and the history that bears on each, every order, and the contact.
// The one action, reminding a client early, is a person's decision; the pen then writes the reminder into the line.
(function () {
  const root = document.querySelector('main.cp');
  if (!root || !window.IQ || !window.Beats || !window.SUFRA || !window.JOBS) return;
  const S = window.SUFRA, M = window.IQAA.motion, T = window.T, N = window.I18N.n, EN = I18N.lang === 'en';
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = Beats.esc, isPerson = JOBS.isPerson;
  const J = JOBS.on(S.line()), V = JOBS.views(J, S), K = JOBS.clients(J, S, V);
  const key = new URLSearchParams(location.search).get('c') || 'nakhla-co';
  const c = K.get(key);
  // a code, an address or an email inside Arabic words keeps its own order
  const bd = (s) => (I18N.rtl ? `<bdi>${s}</bdi>` : s);
  const people = (n) => N(n, '{n} person', '{n} people');

  if (!c) {
    const w = key.toLowerCase().replace(/[^a-z]/g, ''), near = w && K.list && Object.values(K.list()).flat().find((x) => x.key.replace(/[^a-z]/g, '').startsWith(w) || x.name.toLowerCase().replace(/[^a-z]/g, '').startsWith(w));
    const every = (t) => `<a href="clients.html">${T(t)}</a>`;
    $('[data-head]').innerHTML = `<div class="od-t"><h1>${T('No client called “{key}”.', { key: bd(esc(key)) })}</h1><p class="od-sub">${near ? T('Did you mean {name}? Or {all}.', { name: `<a href="client.html?c=${near.key}">${esc(T(near.name))}</a>`, all: every('see every client') }) : T('It may have been typed wrong. {all}.', { all: every('See every client') })}</p></div>`;
    $('[data-band]').hidden = true; $('[data-grid]').hidden = true;
    return;
  }
  document.title = `${T(c.name)} · ${T('Clients')} · ${T('Sufra')}`;

  // Turkish case endings after a name, with the apostrophe: Omar’a, Yara’nın, Karim’e (vowel harmony, the buffer letter
  // after a vowel). Arabic and English take the name as it is.
  function ek(name, cs) {
    if (I18N.lang !== 'tr') return name;
    const w = name.toLocaleLowerCase('tr').replace(/[^a-zçğıöşü]+$/, ''), v = (w.match(/[aeıioöuü]/g) || ['e']).pop();
    const soft = /[aeıioöuü]$/.test(w), back = 'aıou'.includes(v), round = 'ouöü'.includes(v);
    const a = back ? 'a' : 'e', i = back ? (round ? 'u' : 'ı') : (round ? 'ü' : 'i');
    return `${name}’${{ dat: (soft ? 'y' : '') + a, gen: (soft ? 'n' : '') + i + 'n' }[cs]}`;
  }
  const named = (name) => ({ name, name_dat: ek(name, 'dat'), name_gen: ek(name, 'gen') });

  const C = c.C, TC = T(C), cv = named(TC), cvh = named(esc(TC));
  const glyph = (k, test) => `<span class="g" aria-hidden="true">${IQ.glyph(k, { test: !!test })}</span>`;
  const time = (t, text) => `<time datetime="${V.iso(t)}">${esc(text || V.at(t))}</time>`;
  // only the word for late is red, and only for a delivery recorded late (the evidence comes from jobs.js, in the page's
  // language: 'Late', 'تأخر', 'gecikti')
  const LATE = { en: /^Late/, ar: /^تأخر/, tr: /gecikti/ }[I18N.lang] || /^Late/;
  const late = (t) => esc(t).replace(LATE, (w) => `<span class="t-late">${w}</span>`);
  const channel = c.by === 'WhatsApp' ? 'WhatsApp' : 'email', chan = T(channel);
  const personKey = (name) => Object.keys(S.people).find((k) => S.people[k].name === name);
  // a reminder sent early, from this page or approved in Ask Watar: when, and by whom. Kept for the visit
  // in sessionStorage under the order's code, where Ask Watar reads it too.
  const asked = c.open.find((j) => { const x = J.stepOf(j); return x && x.who === 'The client'; });
  const reminded = () => { try { return JSON.parse(sessionStorage.getItem('iqaa-reminded') || '{}') || {}; } catch (e) { return {}; } };
  let early = (asked && reminded()[asked.code]) || null;

  // ---------- head: the client, and whose move it is now ----------
  const first = c.first, since = V.days(first.opened) === 0 ? T('today') : V.day(first.opened);
  const head = K.state(c);
  $('[data-head]').innerHTML = `<div class="od-t"><h1>${esc(T(c.name))}</h1><p class="od-sub">${esc(T(c.private ? 'Private client' : c.contact))} · ${c.orders.length === 1 ? T('First order, {since}', { since }) : N(c.orders.length, '{n} order since {since}', '{n} orders since {since}', { since })}</p></div>
<p class="od-state">${head.lead}<span>${esc(head.t)}</span></p>`;

  // ---------- the band: the client's line with Sufra, at a fixed pen, never stretched ----------
  const PEN = 3.2, TOP = -33.2, BOT = 9;
  const band = $('[data-band]'), page = $('.cp-page');
  const rest = J.station('approval').st.steps.find((x) => x.kind === 'rest');
  // the timed wait, said in a sentence: 'two days passed'
  const wait = (who) => (EN ? who.toLowerCase() : I18N.lang === 'tr' ? T(who).toLocaleLowerCase('tr') : T(who));
  const SAY = {
    held: { done: T('Sufra waited for {name}’s answer', cv), now: T('waiting for {name}’s answer now', cv), next: T('the quote is ahead') },
    rest: { done: T('{wait} passed', { wait: wait(rest ? rest.who : 'Two days') }) },
    run: { done: T('Iqaa reminded {name}', cv) },
    struck: { done: T('delivered on time'), now: T('delivering now'), next: T('the delivery is ahead') },
    failed: { done: T('delivered late') },
  };
  const LEGEND = { held: T('Sufra waited for {name}’s answer', cv), rest: T('{wait} passed without one', { wait: T(rest ? rest.who : 'Two days') }), run: T('Iqaa reminded {name}', cv), struck: T('Delivered on time'), failed: T('Delivered late') };
  // the date under a word: 'Mon 2 Nov' without its weekday; Arabic words inside the drawing keep their own order
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dm = (iso) => { if (EN) return V.day(iso).slice(4); const d = V.U(iso); return T('{d} {mon}', { d: d.getUTCDate(), mon: T(MON[d.getUTCMonth()]) }); };
  const iso = (s) => (I18N.rtl ? `⁧${s}⁩` : s);
  // how wide a date is: Fragment Mono's 0.6 em at 11 px for Latin; measured for Arabic and Turkish words
  const ctx = EN ? null : document.createElement('canvas').getContext('2d');
  const wide = (s) => { if (!ctx) return s.length * 6.6; ctx.font = '11px "Fragment Mono", "Atkinson Hyperlegible Next", system-ui, sans-serif'; return ctx.measureText(s).width; };
  function drawBand(write) {
    const cp = page.clientWidth, inner = band.clientWidth - 2 * parseFloat(getComputedStyle(band).paddingInlineStart);
    let k = cp >= 640 ? 1.25 : 1;
    // the room the line has: beside the key and the reading, beside the key alone, or the whole band
    const room = cp >= 960 ? inner - 200 - 64 - 300 : cp >= 640 ? inner - 200 - 32 : inner;
    const { words } = K.layout(c, { reminded: !!early });
    const wid = (n) => (words[words.length - 1].x1 - words[n].x0);
    // too long: a smaller pen first, down to 0.8; then the newest words that fit, after a link to the rest
    if (wid(0) * k > room) k = Math.max(0.8, room / wid(0));
    let from = 0;
    if (wid(0) * k > room) while (from < words.length - 1 && wid(from) * k > room - 72) from++;
    const shown = words.slice(from), x0 = shown[0].x0, pal = window.IQAA.pal.light;
    const strokes = shown.flatMap((w) => w.strokes);
    // the pen stands through the stroke the job is on, or just after the last stroke written
    let nowX = null;
    if (c.soon) {
      const cur = strokes.find((s) => s.state === 'now'), done = strokes.filter((s) => s.state === 'done').pop();
      nowX = Math.max(cur ? cur.x + 12 : -Infinity, done ? done.x + IQ.WIDTH[done.kind] + 6 : -Infinity);
      if (nowX === -Infinity) nowX = x0 - 6;
      nowX -= x0;
    }
    let body = '', fresh = '', dates = '', marks = '', lastEnd = -Infinity, row = 0, two = false;
    shown.forEach((w) => {
      w.strokes.forEach((s) => {
        const d = IQ.cell(s.kind, s.x - x0, 0, pal, k, s.state === 'next');
        if (s.fresh) fresh = `<svg overflow="visible" data-fresh>${d}</svg>`; else body += d;
      });
      // the event's date under each word; two rows only where two dates would touch
      const lx = (w.x0 - x0) * k, label = dm(w.j.iso);
      row = lx < lastEnd + 6 ? 1 - row : 0;
      two = two || row === 1;
      lastEnd = lx + wide(label);
      dates += `<text class="cp-d" x="${lx.toFixed(1)}" y="${(BOT * k + 14 + row * 13).toFixed(1)}">${iso(label)}</text>`;
      if (w.late) marks += `<text class="cp-late" x="${(((w.x0 + w.x1) / 2 - x0) * k).toFixed(1)}" y="${(-(15 + PEN) * k - 8).toFixed(1)}" text-anchor="middle">${iso(N(w.late, '{n} min late', '{n} min late'))}</text>`;
    });
    const top = TOP * k - 18, w = wid(from) * k, left = Math.min(-PEN * k, nowX != null ? nowX * k - 14 : 0);
    // a longer date than the last word (an Arabic month) widens the drawing instead of running out of it
    const right = EN ? w + PEN * k : Math.max(w + PEN * k, lastEnd + 2);
    const tick = nowX == null ? '' : `<path class="cp-now" d="M${(nowX * k).toFixed(1)} ${(TOP * k - 4).toFixed(1)}V${(BOT * k).toFixed(1)}"/><text class="cp-nowt" x="${(nowX * k).toFixed(1)}" y="${(TOP * k - 7).toFixed(1)}" text-anchor="middle">${T('Now')}</text>`;
    const bottom = BOT * k + 18 + (two ? 13 : 0);
    const said = shown.map((x) => `${V.day(x.j.iso)}: ${x.strokes.map((s) => (s.fresh ? T('Iqaa reminded {name} early', cv) : SAY[s.kind][s.state] || SAY[s.kind].done)).join(T(', '))}`);
    const label = `${T('{name}’s orders with Sufra.', named(T(c.name)))} ${said.map((t, i) => (i && t.slice(t.indexOf(':')) === said[i - 1].slice(said[i - 1].indexOf(':')) ? T('{day}: the same', { day: t.slice(0, t.indexOf(':')) }) : t)).join('. ')}.`;
    // the line runs the way the page reads: right to left in Arabic (.flow mirrors it and turns its words back)
    const svg = `<svg class="cp-sig flow" viewBox="${left.toFixed(1)} ${top.toFixed(1)} ${(right - left).toFixed(1)} ${(bottom - top).toFixed(1)}" width="${(right - left).toFixed(1)}" height="${(bottom - top).toFixed(1)}" role="img" aria-label="${esc(label)}">
<g class="cp-strokes">${body}${fresh}</g>${marks}${tick}${dates}</svg>`;
    $('[data-line]').innerHTML = (from ? `<a class="cp-earlier" href="#orders">${T('{more} earlier', { more: I18N.rtl ? `<bdi dir="ltr">+${from}</bdi>` : `+${from}` })}</a>` : '') + svg;
    // the legend names only the strokes this line uses
    const used = (kind) => strokes.some((s) => s.kind === kind && s.state !== 'next');
    const ahead = strokes.find((s) => s.state === 'next');
    $('[data-legend]').innerHTML = Object.keys(LEGEND).filter(used).map((kind) => `<li>${glyph(kind)}<span>${esc(LEGEND[kind])}</span></li>`).join('')
      + (ahead ? `<li>${glyph(ahead.kind, true)}<span>${T('Ahead')}</span></li>` : '');
    if (write) { const f = $('[data-fresh]'); if (f) Beats.write(f, { each: M.quarter, gap: 0 }); }
  }
  $('[data-reading]').textContent = K.reading(c);
  drawBand(false);
  let bw = 0;
  if (window.ResizeObserver) new ResizeObserver(() => { const w = page.clientWidth; if (w !== bw) { bw = w; drawBand(false); } }).observe(page);
  // the dates are measured in their font once it has come
  if (!EN && document.fonts) document.fonts.ready.then(() => drawBand(false));

  // ---------- open now: each open order, the one action, and the steps that reach the client ----------
  function steps(j) {
    return K.between(j, c, j === asked ? early : null).map((r) => {
      const wait = r.state === 'now' && r.x.name === 'The client approves' && K.reminder(j);
      // a time is set in Fragment Mono; the words after it ('· sent early by Hala') stay in the text face
      const at = r.state === 'done' && r.t != null ? V.at(r.t) : null;
      const when = at != null && r.when.startsWith(at) ? `${time(r.t)}${esc(r.when.slice(at.length))}`
        : `<span${wait ? ` data-wait="${wait.sent}"` : ''}>${esc(r.when)}</span>`;
      const ev = r.ev ? `<span class="cp-ev${r.ev.risk ? ' cp-risk' : ''}">${late(r.ev.t)}</span>` : '';
      return `<li class="os-step ${r.state}">${glyph(r.x.kind, r.state === 'next' || r.state === 'skip')}<span class="os-n"><b>${esc(r.name)}</b>${ev}</span><span class="os-w">${when}</span></li>`;
    }).join('');
  }
  function actions(j) {
    const x = J.stepOf(j), r = K.reminder(j), link = `<a class="cp-link" href="order.html?code=${j.code}">${IQ.icon('Orders', 18)}<span>${T('Open the order')}</span></a>`;
    if (x.who === 'The client' && r) {
      if (early && j === asked) return `<p class="cp-sent" role="status" tabindex="-1" data-sent>${glyph('run')}<span>${T('Iqaa reminded {name} at {time} by {channel}. The line still waits for {name}’s answer.', Object.assign({ time: time(early.t, V.hm(early.t)), channel: chan }, cvh))}</span></p><div class="row-act cp-act">${link}</div>`;
      const btn = `<button type="button" class="btn${r.risk ? ' primary' : ''}" data-remind aria-expanded="false">${IQ.icon('Remind', 18)}<span>${T('Remind {name} now', cvh)}</span></button>`;
      const v = Object.assign({ channel: chan, due: V.label(r.due) }, cv);
      const hint = r.risk ? T('Sends the line’s reminder to {name} by {channel} now, instead of on {due}.', v) : T('Iqaa reminds {name} by {channel} on {due} if there’s no answer.', v);
      return `<div class="row-act cp-act">${btn}${link}<p class="hint cp-hint">${esc(hint)}</p></div><div data-confirm-at></div>`;
    }
    const k = isPerson(x.kind) && personKey(x.who);
    return `<div class="row-act cp-act">${k ? `<a class="btn" href="today.html?as=${k}">${IQ.icon('Today', 18)}<span>${T('Open {name}’s Today', named(esc(T(x.who))))}</span></a>` : ''}${link}</div>`;
  }
  function block(j) {
    const x = J.stepOf(j), p = J.station(j.at), d = V.days(j.iso);
    const draft = x.name === 'Watar drafts the quote' && j.draft
      ? `<p class="cp-note">${glyph('held')}<span>${T('Watar’s draft, waiting for {name}: {items}', { name: esc(T(x.who)), items: j.draft.items.map((t) => esc(T(t))).join(' · ') })}</span></p>` : '';
    const asked = j.asked ? `<p class="cp-note">${IQ.icon('Message', 18)}<span>${T('{name} asked: “{note}.”', Object.assign({ note: esc(T(j.asked)) }, cvh))}</span></p>` : '';
    return `<article class="cp-o" aria-label="${esc(T(j.title))}${T(', ')}${j.code}">
<div class="cp-oh"><div class="cp-ot"><code>${j.code}</code><p class="cp-tt"><b>${esc(T(j.title))}</b> <span>· ${people(j.people)}</span></p></div>
<p class="cp-due">${IQ.icon('Date', 18)}<span><b>${time(j.iso, V.label(j.iso))}</b><span>${d >= 0 && d <= 1 ? `<b>${V.when(j.iso)}</b>` : V.when(j.iso)}</span></span></p></div>
<p class="cp-where">${J.strip(j)}<span>${T('At {station}', { station: `<b>${esc(T(p.st.name))}</b>` })} · ${esc(T(x.name))}</span></p>
${draft}${asked}<div data-act>${actions(j)}</div>
<h3 class="cp-bh">${IQ.icon('Handoff', 18)}<span>${T('Between Sufra and {name}', cvh)}</span></h3><p class="hint">${T('Only the steps that reach {name}', cvh)}</p>
<ol class="cp-steps" data-steps>${steps(j)}</ol>
</article>`;
  }
  function renderOpen() {
    if (!c.open.length) {
      const last = c.fin[c.fin.length - 1];
      $('[data-open]').innerHTML = `<p class="cp-quiet">${T('Nothing open with {name}. Their last order, {title}, finished {date}.', { name: esc(T(c.name)), title: esc(T(last.title)), date: esc(V.fin(last)) })}</p>`;
      return;
    }
    $('[data-open]').innerHTML = c.open.map(block).join('');
  }
  renderOpen();
  // the wait counts up with the demo's clock, a minute at a time
  setInterval(() => { document.querySelectorAll('[data-wait]').forEach((el) => { el.textContent = T('Waiting, {span}', { span: V.words(V.now() - +el.dataset.wait) }); }); }, 6e4);

  // ---------- remind now: a confirm in place, then the line's reminder goes out early ----------
  const j0 = asked || c.soon;
  // the line's own words for its reminder (sufra.js), written in for this order: in English as Build fills them, in
  // the page's language with the order's words in it
  function message() {
    const msg = J.station('approval').st.steps.find((x) => x.name === 'Remind the client').msg;
    if (EN) return V.fill(msg, j0);
    return T(msg).replace(/\{client\.name\}/g, TC).replace(/\{order\.title\}/g, T(j0.title)).replace(/\{order\.people\}/g, String(j0.people))
      .replace(/\{order\.due\}/g, V.due(j0)).replace(/\{quote\.link\}/g, `sufra.iqaa.app/q/${j0.code.slice(-4)}`);
  }
  function confirm() {
    const at = $('[data-confirm-at]'), btn = $('[data-remind]');
    if (!at || at.firstChild) return;
    const to = c.by === 'WhatsApp' ? c.phone : c.email, none = /^\[/.test(to) ? `<span class="sr"> ${T('not added yet')}</span>` : '';
    at.innerHTML = `<div class="cf-in cf-msg" role="group" aria-labelledby="rm-h">
<p id="rm-h"><b>${T('Send {name} this reminder now?', cvh)}</b> <span>${T('A sent message can’t be taken back.')}</span></p>
<p class="cf-prev">${esc(message())}</p>
<p class="cf-by">${IQ.icon(c.by === 'WhatsApp' ? 'Phone' : 'Email', 18)}<span>${T('By {channel} to {name}, {to}', Object.assign({ channel: chan, to: bd(esc(T(to))) + none }, cvh))}</span></p>
<div class="cf-act"><button class="btn" type="button" data-cf-no>${T('Cancel')}</button><button class="btn primary" type="button" data-cf-yes>${IQ.icon('Send', 18)}<span>${T('Send the reminder')}</span></button></div>
</div>`;
    btn.setAttribute('aria-expanded', 'true');
    $('[data-cf-yes]').focus();
  }
  function cancel() {
    const at = $('[data-confirm-at]');
    if (!at || !at.firstChild) return;
    at.innerHTML = '';
    const btn = $('[data-remind]');
    btn.setAttribute('aria-expanded', 'false');
    btn.focus();
  }
  function send() {
    // the person signed in, by the name in the data (the sidebar shows it translated)
    const me = $('[data-me-name]');
    early = { t: V.now(), by: ((me && (me.dataset.who || me.textContent)) || 'Hala').trim() };
    // Ask Watar places it between the questions its sender had asked by then (the demo clock moves by the minute)
    const k = personKey(early.by) || 'hala';
    let after = 0;
    try { const conv = JSON.parse(sessionStorage.getItem(`iqaa-watar:${k}`) || 'null'); after = conv && conv.asked ? conv.asked.length : 0; } catch (e) { /* no conversation yet */ }
    try { const all = reminded(); all[asked.code] = Object.assign({ from: 'page', after: { [k]: after } }, early); sessionStorage.setItem('iqaa-reminded', JSON.stringify(all)); } catch (e) { /* storage blocked: this page only */ }
    renderOpen();
    drawBand(true);
    $('[data-sent]').focus();
  }
  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-remind]')) confirm();
    else if (e.target.closest('[data-cf-no]')) cancel();
    else if (e.target.closest('[data-cf-yes]')) send();
  });
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape' && e.target.closest('.cf-msg')) { e.preventDefault(); cancel(); } });

  // ---------- every order with this client: the open ones first, then the newest ----------
  const orders = c.open.concat(c.fin.slice().reverse());
  $('[data-n-orders-of]').textContent = orders.length;
  $('.cp-orders').hidden = !c.fin.length;
  $('[data-orders]').innerHTML = orders.map((j) => {
    const f = K.facts(j);
    let answer;
    if (!f.rounds.length) answer = T('Quote not sent yet');
    else if (f.open) answer = T('Waiting since {time}', { time: V.at(f.open.sent) });
    else {
      answer = V.words(f.took);
      if (f.reminded) answer = T('{span}, after the reminder', { span: answer });
      if (f.changes.length) answer = T('{span}, after a change: “{change}”', { span: answer, change: T(f.changes[f.changes.length - 1].change) });
    }
    const delivery = !f.arrived ? T('Ahead') : f.late
      ? `${glyph('failed')}<span><time datetime="${f.arrived}">${V.hm(f.arrived)}</time> · <span class="t-late">${N(f.late, '{n} min late', '{n} min late')}</span></span>`
      : `<span><time datetime="${f.arrived}">${V.hm(f.arrived)}</time> · ${T('on time')}</span>`;
    return `<li class="cp-or"><div class="cp-or-t"><code>${j.code}</code><span><a href="order.html?code=${j.code}">${esc(T(j.title))}</a> · ${people(j.people)}</span></div>
<dl class="cp-or-d"><div><dt>${T('Event')}</dt><dd>${time(j.iso, V.label(j.iso))}</dd></div><div><dt>${T('Their answer')}</dt><dd>${esc(answer)}</dd></div><div><dt>${T('Delivery')}</dt><dd class="cp-dv">${delivery}</dd></div></dl></li>`;
  }).join('');

  // ---------- contact: who the line writes to, and how ----------
  const bracket = (v) => `${bd(esc(T(v)))}${/^\[/.test(v) ? `<span class="sr"> ${T('not added yet')}</span>` : ''}`;
  const row = (icon, dt, dd) => `<div><dt>${IQ.icon(icon, 16)}<span>${T(dt)}</span></dt><dd>${dd}</dd></div>`;
  const q = c.soon && c.soon.code.slice(-4);
  const link = c.soon ? `<div class="cp-their"><p class="cp-lk">${IQ.icon('Link', 16)}<span>${T('Their link')}</span></p><p><a href="quote.html?q=${q}"><code${I18N.rtl ? ' dir="ltr"' : ''}>sufra.iqaa.app/q/${q}</code></a></p><p class="hint">${T('{name} approves or asks for a change from this link, without an account. Open it to see what {name} sees.', cvh)}</p></div>` : '';
  $('[data-contact]').innerHTML = `<section class="od-card cp-card"><h2 id="ct-h">${IQ.icon('Contact', 18)}<span>${T('Contact')}</span></h2>
<dl class="cp-dl">${c.private ? '' : row('Clients', 'Name', esc(T(c.contact))) + row('Company', 'Company', esc(T(c.name)))}${row('Phone', c.by === 'WhatsApp' ? 'WhatsApp' : 'Phone', bracket(c.phone))}${row('Email', 'Email', bd(esc(c.email)))}${row('Place', 'Delivers to', bracket(c.address))}</dl>
<p class="hint">${T('Quotes, reminders and arrival times go to {name} by {channel}.', Object.assign({ channel: chan }, cvh))}</p>${link}
<p class="od-meta">${T('First order: {code}, {title}, opened {day}', { code: bd(first.code), title: esc(T(first.title)), day: esc(V.day(first.opened)) })}</p></section>`;
})();
