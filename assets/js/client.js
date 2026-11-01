// One client: whose move it is now, its line with Sufra written in the signature's hand (one word per order), the
// open order with the steps that reach the client and the history that bears on each, every order, and the contact.
// The one action, reminding a client early, is a person's decision; the pen then writes the reminder into the line.
(function () {
  const root = document.querySelector('main.cp');
  if (!root || !window.IQ || !window.Beats || !window.SUFRA || !window.JOBS) return;
  const S = window.SUFRA, M = window.IQAA.motion;
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = Beats.esc, isPerson = JOBS.isPerson;
  const J = JOBS.on(S.line()), V = JOBS.views(J, S), K = JOBS.clients(J, S, V);
  const key = new URLSearchParams(location.search).get('c') || 'nakhla-co';
  const c = K.get(key);

  if (!c) {
    const w = key.toLowerCase().replace(/[^a-z]/g, ''), near = w && K.list && Object.values(K.list()).flat().find((x) => x.key.replace(/[^a-z]/g, '').startsWith(w) || x.name.toLowerCase().replace(/[^a-z]/g, '').startsWith(w));
    $('[data-head]').innerHTML = `<div class="od-t"><h1>No client called “${esc(key)}”.</h1><p class="od-sub">${near ? `Did you mean <a href="client.html?c=${near.key}">${esc(near.name)}</a>? Or <a href="clients.html">see every client</a>.` : `It may have been typed wrong. <a href="clients.html">See every client</a>.`}</p></div>`;
    $('[data-band]').hidden = true; $('[data-grid]').hidden = true;
    return;
  }
  document.title = `${c.name} · Clients · Sufra`;

  const C = c.C, lc = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const glyph = (k, test) => `<span class="g" aria-hidden="true">${IQ.glyph(k, { test: !!test })}</span>`;
  const time = (t, text) => `<time datetime="${V.iso(t)}">${esc(text || V.at(t))}</time>`;
  const late = (t) => esc(t).replace(/^Late/, '<span class="t-late">Late</span>');
  const channel = c.by === 'WhatsApp' ? 'WhatsApp' : 'email';
  const personKey = (name) => Object.keys(S.people).find((k) => S.people[k].name === name);
  // a reminder sent early, from this page or approved in Ask Watar: when, and by whom. Kept for the visit
  // in sessionStorage under the order's code, where Ask Watar reads it too.
  const asked = c.open.find((j) => { const x = J.stepOf(j); return x && x.who === 'The client'; });
  const reminded = () => { try { return JSON.parse(sessionStorage.getItem('iqaa-reminded') || '{}') || {}; } catch (e) { return {}; } };
  let early = (asked && reminded()[asked.code]) || null;

  // ---------- head: the client, and whose move it is now ----------
  const first = c.first, since = V.days(first.opened) === 0 ? 'today' : V.day(first.opened);
  const head = K.state(c);
  $('[data-head]').innerHTML = `<div class="od-t"><h1>${esc(c.name)}</h1><p class="od-sub">${esc(c.private ? 'Private client' : c.contact)} · ${c.orders.length === 1 ? `First order, ${since}` : `${plural(c.orders.length, 'order')} since ${since}`}</p></div>
<p class="od-state">${head.lead}<span>${esc(head.t)}</span></p>`;

  // ---------- the band: the client's line with Sufra, at a fixed pen, never stretched ----------
  const PEN = 3.2, TOP = -33.2, BOT = 9;
  const band = $('[data-band]'), page = $('.cp-page');
  const rest = J.station('approval').st.steps.find((x) => x.kind === 'rest');
  const SAY = {
    held: { done: `Sufra waited for ${C}’s answer`, now: `waiting for ${C}’s answer now`, next: 'the quote is ahead' },
    rest: { done: `${(rest ? rest.who : 'two days').toLowerCase()} passed` },
    run: { done: `Iqaa reminded ${C}` },
    struck: { done: 'delivered on time', now: 'delivering now', next: 'the delivery is ahead' },
    failed: { done: 'delivered late' },
  };
  const LEGEND = { held: `Sufra waited for ${C}’s answer`, rest: `${rest ? rest.who : 'Two days'} passed without one`, run: `Iqaa reminded ${C}`, struck: 'Delivered on time', failed: 'Delivered late' };
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
      const lx = (w.x0 - x0) * k, label = V.day(w.j.iso).slice(4);
      row = lx < lastEnd + 6 ? 1 - row : 0;
      two = two || row === 1;
      lastEnd = lx + label.length * 6.6;
      dates += `<text class="cp-d" x="${lx.toFixed(1)}" y="${(BOT * k + 14 + row * 13).toFixed(1)}">${label}</text>`;
      if (w.late) marks += `<text class="cp-late" x="${(((w.x0 + w.x1) / 2 - x0) * k).toFixed(1)}" y="${(-(15 + PEN) * k - 8).toFixed(1)}" text-anchor="middle">${w.late} min late</text>`;
    });
    const top = TOP * k - 18, w = wid(from) * k, left = Math.min(-PEN * k, nowX != null ? nowX * k - 14 : 0);
    const tick = nowX == null ? '' : `<path class="cp-now" d="M${(nowX * k).toFixed(1)} ${(TOP * k - 4).toFixed(1)}V${(BOT * k).toFixed(1)}"/><text class="cp-nowt" x="${(nowX * k).toFixed(1)}" y="${(TOP * k - 7).toFixed(1)}" text-anchor="middle">Now</text>`;
    const bottom = BOT * k + 18 + (two ? 13 : 0);
    const said = shown.map((x) => `${V.day(x.j.iso)}: ${x.strokes.map((s) => (s.fresh ? `Iqaa reminded ${C} early` : SAY[s.kind][s.state] || SAY[s.kind].done)).join(', ')}`);
    const label = `${c.name}’s orders with Sufra. ${said.map((t, i) => (i && t.slice(t.indexOf(':')) === said[i - 1].slice(said[i - 1].indexOf(':')) ? `${t.slice(0, t.indexOf(':'))}: the same` : t)).join('. ')}.`;
    const svg = `<svg class="cp-sig" viewBox="${left.toFixed(1)} ${top.toFixed(1)} ${(w + PEN * k - left).toFixed(1)} ${(bottom - top).toFixed(1)}" width="${(w + PEN * k - left).toFixed(1)}" height="${(bottom - top).toFixed(1)}" role="img" aria-label="${esc(label)}">
<g class="cp-strokes">${body}${fresh}</g>${marks}${tick}${dates}</svg>`;
    $('[data-line]').innerHTML = (from ? `<a class="cp-earlier" href="#orders">+${from} earlier</a>` : '') + svg;
    // the legend names only the strokes this line uses
    const used = (kind) => strokes.some((s) => s.kind === kind && s.state !== 'next');
    const ahead = strokes.find((s) => s.state === 'next');
    $('[data-legend]').innerHTML = Object.keys(LEGEND).filter(used).map((kind) => `<li>${glyph(kind)}<span>${esc(LEGEND[kind])}</span></li>`).join('')
      + (ahead ? `<li>${glyph(ahead.kind, true)}<span>Ahead</span></li>` : '');
    if (write) { const f = $('[data-fresh]'); if (f) Beats.write(f, { each: M.quarter, gap: 0 }); }
  }
  $('[data-reading]').textContent = K.reading(c);
  drawBand(false);
  let bw = 0;
  if (window.ResizeObserver) new ResizeObserver(() => { const w = page.clientWidth; if (w !== bw) { bw = w; drawBand(false); } }).observe(page);

  // ---------- open now: each open order, the one action, and the steps that reach the client ----------
  function steps(j) {
    return K.between(j, c, j === asked ? early : null).map((r) => {
      const wait = r.state === 'now' && r.x.name === 'The client approves' && K.reminder(j);
      // a time is set in Fragment Mono; the words after it ('· sent early by Hala') stay in the text face
      const when = r.state === 'done' && r.t != null ? `${time(r.t)}${esc(r.when.slice(V.at(r.t).length))}`
        : `<span${wait ? ` data-wait="${wait.sent}"` : ''}>${esc(r.when)}</span>`;
      const ev = r.ev ? `<span class="cp-ev${r.ev.risk ? ' cp-risk' : ''}">${late(r.ev.t)}</span>` : '';
      return `<li class="os-step ${r.state}">${glyph(r.x.kind, r.state === 'next' || r.state === 'skip')}<span class="os-n"><b>${esc(r.name)}</b>${ev}</span><span class="os-w">${when}</span></li>`;
    }).join('');
  }
  function actions(j) {
    const x = J.stepOf(j), r = K.reminder(j), link = `<a class="cp-link" href="order.html?code=${j.code}">${IQ.icon('Orders', 18)}<span>Open the order</span></a>`;
    if (x.who === 'The client' && r) {
      if (early && j === asked) return `<p class="cp-sent" role="status" tabindex="-1" data-sent>${glyph('run')}<span>Iqaa reminded ${esc(C)} at ${time(early.t, V.hm(early.t))} by ${channel}. The line still waits for ${esc(C)}’s answer.</span></p><div class="row-act cp-act">${link}</div>`;
      const btn = `<button type="button" class="btn${r.risk ? ' primary' : ''}" data-remind aria-expanded="false">${IQ.icon('Remind', 18)}<span>Remind ${esc(C)} now</span></button>`;
      const hint = r.risk ? `Sends the line’s reminder to ${C} by ${channel} now, instead of on ${V.label(r.due)}.` : `Iqaa reminds ${C} by ${channel} on ${V.label(r.due)} if there’s no answer.`;
      return `<div class="row-act cp-act">${btn}${link}<p class="hint cp-hint">${esc(hint)}</p></div><div data-confirm-at></div>`;
    }
    const k = isPerson(x.kind) && personKey(x.who);
    return `<div class="row-act cp-act">${k ? `<a class="btn" href="today.html?as=${k}">${IQ.icon('Today', 18)}<span>Open ${esc(x.who)}’s Today</span></a>` : ''}${link}</div>`;
  }
  function block(j) {
    const x = J.stepOf(j), p = J.station(j.at), d = V.days(j.iso);
    const draft = x.name === 'Watar drafts the quote' && j.draft
      ? `<p class="cp-note">${glyph('held')}<span>Watar’s draft, waiting for ${esc(x.who)}: ${j.draft.items.map(esc).join(' · ')}</span></p>` : '';
    const asked = j.asked ? `<p class="cp-note">${IQ.icon('Message', 18)}<span>${esc(C)} asked: “${esc(j.asked)}.”</span></p>` : '';
    return `<article class="cp-o" aria-label="${esc(j.title)}, ${j.code}">
<div class="cp-oh"><div class="cp-ot"><code>${j.code}</code><p class="cp-tt"><b>${esc(j.title)}</b> <span>· ${j.people} people</span></p></div>
<p class="cp-due">${IQ.icon('Date', 18)}<span><b>${time(j.iso, V.label(j.iso))}</b><span>${d >= 0 && d <= 1 ? `<b>${V.when(j.iso)}</b>` : V.when(j.iso)}</span></span></p></div>
<p class="cp-where">${J.strip(j)}<span>At <b>${esc(p.st.name)}</b> · ${esc(x.name)}</span></p>
${draft}${asked}<div data-act>${actions(j)}</div>
<h3 class="cp-bh">${IQ.icon('Handoff', 18)}<span>Between Sufra and ${esc(C)}</span></h3><p class="hint">Only the steps that reach ${esc(C)}</p>
<ol class="cp-steps" data-steps>${steps(j)}</ol>
</article>`;
  }
  function renderOpen() {
    if (!c.open.length) {
      const last = c.fin[c.fin.length - 1];
      $('[data-open]').innerHTML = `<p class="cp-quiet">Nothing open with ${esc(c.name)}. Their last order, ${esc(last.title)}, finished ${esc(last.finished)}.</p>`;
      return;
    }
    $('[data-open]').innerHTML = c.open.map(block).join('');
  }
  renderOpen();
  // the wait counts up with the demo's clock, a minute at a time
  setInterval(() => { document.querySelectorAll('[data-wait]').forEach((el) => { el.textContent = `Waiting, ${V.words(V.now() - +el.dataset.wait)}`; }); }, 6e4);

  // ---------- remind now: a confirm in place, then the line's reminder goes out early ----------
  const j0 = asked || c.soon;
  function confirm() {
    const at = $('[data-confirm-at]'), btn = $('[data-remind]');
    if (!at || at.firstChild) return;
    const to = c.by === 'WhatsApp' ? c.phone : c.email;
    // the line's own words for its reminder (sufra.js), written in for this order
    const msg = V.fill(J.station('approval').st.steps.find((x) => x.name === 'Remind the client').msg, j0);
    at.innerHTML = `<div class="cf-in cf-msg" role="group" aria-labelledby="rm-h">
<p id="rm-h"><b>Send ${esc(C)} this reminder now?</b> <span>A sent message can’t be taken back.</span></p>
<p class="cf-prev">${esc(msg)}</p>
<p class="cf-by">${IQ.icon(c.by === 'WhatsApp' ? 'Phone' : 'Email', 18)}<span>By ${channel === 'email' ? 'email' : 'WhatsApp'} to ${esc(C)}, ${esc(to)}${/^\[/.test(to) ? '<span class="sr"> not added yet</span>' : ''}</span></p>
<div class="cf-act"><button class="btn" type="button" data-cf-no>Cancel</button><button class="btn primary" type="button" data-cf-yes>${IQ.icon('Send', 18)}<span>Send the reminder</span></button></div>
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
    early = { t: V.now(), by: (($('[data-me-name]') || {}).textContent || 'Hala').trim() };
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
    const answer = !f.rounds.length ? 'Quote not sent yet' : f.open ? `Waiting since ${V.at(f.open.sent)}`
      : `${V.words(f.took)}${f.reminded ? ', after the reminder' : ''}${f.changes.length ? `, after a change: “${f.changes[f.changes.length - 1].change}”` : ''}`;
    const delivery = !f.arrived ? 'Ahead' : f.late
      ? `${glyph('failed')}<span><time datetime="${f.arrived}">${V.hm(f.arrived)}</time> · <span class="t-late">${f.late} min late</span></span>`
      : `<span><time datetime="${f.arrived}">${V.hm(f.arrived)}</time> · on time</span>`;
    return `<li class="cp-or"><div class="cp-or-t"><code>${j.code}</code><span><a href="order.html?code=${j.code}">${esc(j.title)}</a> · ${j.people} people</span></div>
<dl class="cp-or-d"><div><dt>Event</dt><dd>${time(j.iso, V.label(j.iso))}</dd></div><div><dt>Their answer</dt><dd>${esc(answer)}</dd></div><div><dt>Delivery</dt><dd class="cp-dv">${delivery}</dd></div></dl></li>`;
  }).join('');

  // ---------- contact: who the line writes to, and how ----------
  const bracket = (v) => `${esc(v)}${/^\[/.test(v) ? '<span class="sr"> not added yet</span>' : ''}`;
  const row = (icon, dt, dd) => `<div><dt>${IQ.icon(icon, 16)}<span>${dt}</span></dt><dd>${dd}</dd></div>`;
  const link = c.soon ? `<div class="cp-their"><p class="cp-lk">${IQ.icon('Link', 16)}<span>Their link</span></p><p><code>sufra.iqaa.app/q/${c.soon.code.slice(-4)}</code></p><p class="hint">${esc(C)} approves or asks for a change from this link, without an account.</p></div>` : '';
  $('[data-contact]').innerHTML = `<section class="od-card cp-card"><h2 id="ct-h">${IQ.icon('Contact', 18)}<span>Contact</span></h2>
<dl class="cp-dl">${c.private ? '' : row('Clients', 'Name', esc(c.contact)) + row('Company', 'Company', esc(c.name))}${row('Phone', c.by === 'WhatsApp' ? 'WhatsApp' : 'Phone', bracket(c.phone))}${row('Email', 'Email', esc(c.email))}${row('Place', 'Delivers to', bracket(c.address))}</dl>
<p class="hint">Quotes, reminders and arrival times go to ${esc(C)} by ${channel}.</p>${link}
<p class="od-meta">First order: ${first.code}, ${esc(first.title)}, opened ${esc(V.day(first.opened))}</p></section>`;
})();
