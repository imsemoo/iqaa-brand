// The Inbox: what reached Sufra and is not on the line yet. Watar reads each message into a draft order, in the
// dashed grey pen, and shows the words it read every field from; a field it could not read waits for a person. The
// person creates the order (it joins the line at Quote: Reem's step is logged, the receipt goes out, Watar drafts the
// quote) or sets the message aside. What is made is kept for the visit in sessionStorage 'iqaa-intake', which sufra.js
// reads on every screen, so the new order is on Orders, Today, Overview and Clients at once.
(function () {
  const S = window.SUFRA, esc = Beats.esc, T = window.T, N = window.I18N.n, M = window.IQAA.motion;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const J = JOBS.on(S.line()), V = JOBS.views(J, S), K = JOBS.clients(J, S, V);
  const icon = (n, s) => IQ.icon(n, s || 18);
  const glyph = (k, test) => `<span class="g" aria-hidden="true">${IQ.glyph(k, { test: !!test })}</span>`;
  const live = $('[data-live]'), list = $('[data-list]'), detail = $('[data-detail]'), grid = $('[data-grid]');
  const say = (t) => { live.textContent = ''; requestAnimationFrame(() => { live.textContent = t; }); };

  // the person at the inbox: the line gives new orders to Reem; ?as= shows it as someone else
  const asKey = new URLSearchParams(location.search).get('as');
  const meKey = S.people[asKey] ? asKey : 'reem', me = S.people[meKey];
  const meEl = $('[data-me-name]');
  if (meEl) { meEl.textContent = T(me.name); meEl.dataset.who = me.name; }
  if ($('[data-me-role]')) $('[data-me-role]').textContent = me.access === 'owner' ? T('Owner') : T(me.role);
  if ($('[data-me-av]')) $('[data-me-av]').textContent = T(me.name).charAt(0);

  // what was done with each message, and the orders made: written back for every screen to read
  const intake = S.intake;
  function save() { try { sessionStorage.setItem('iqaa-intake', JSON.stringify(intake)); } catch (e) { /* storage blocked: this page only */ } }

  const all = () => S.jobs.concat(S.past || []);
  const pad = (v) => String(v).padStart(2, '0');
  // the next order number after every order Sufra has
  const nextCode = () => `SFR-26-${String(Math.max(...all().map((j) => +j.code.slice(-4))) + 1).padStart(4, '0')}`;
  // the data's own date label, in English like the rest of sufra.js (screens show it through V.due)
  const EN_D = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], EN_M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dueLabel = (iso) => { const d = V.U(iso); return `${EN_D[d.getUTCDay()]} ${d.getUTCDate()} ${EN_M[d.getUTCMonth()]}, ${V.hm(d)}`; };
  // emails, addresses and codes keep their own direction inside a right-to-left sentence
  // the client key sufra.js gives an order: the company, or the person for a private order
  const keyOf = (name) => name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
  const bidi = (s) => s.replace(/([\w.+-]+@[\w.-]+|SFR-\d\d-\d{4})/g, '<bdi>$1</bdi>');

  // ---------- what Watar read from a message ----------
  const fields = ['title', 'date', 'time', 'people', 'where', 'note'];
  function draftOf(m) {
    const r = m.read, c = m.ck ? S.clients[m.ck] : null;
    return {
      ck: m.ck, name: c ? null : m.from, email: m.address,
      title: r.title[0] ? T(r.title[0]) : '', date: r.date[0] || '', time: r.time[0] || '', people: r.people[0] != null ? String(r.people[0]) : '',
      where: r.where[0] ? T(r.where[0]) : '', note: r.note[0] ? T(r.note[0]) : '',
    };
  }
  // the words each field came from; for a known client's address, the last order
  function source(m, f) {
    const r = m.read && m.read[f];
    if (!r) return '';
    if (r[0] == null) return `<p class="ib-src miss">${glyph('held', true)}<span>${T('Not in the message: it says «{words}».', { words: esc(T(r[1])) })}</span></p>`;
    return `<p class="ib-src">${T('From the message: «{words}»', { words: esc(T(r[1])) })}</p>`;
  }
  // the message, with the words Watar read marked where they stand
  function marked(m) {
    let html = esc(T(m.text));
    if (m.read) fields.forEach((f) => { const w = m.read[f] && esc(T(m.read[f][1])); if (w && html.includes(w)) html = html.replace(w, `<mark>${w}</mark>`); });
    return bidi(html);
  }

  // ---------- where each message stands ----------
  function stateOf(m) {
    const h = intake.handled[m.id];
    if (h) return h.state;
    if (!m.read) return 'other';
    return fields.some((f) => m.read[f] && m.read[f][0] == null) ? 'missing' : 'ready';
  }
  function status(m) {
    const h = intake.handled[m.id];
    return {
      created: () => `${glyph('struck')}<span>${T('Order {code} created', { code: `<bdi>${h.code}</bdi>` })}</span>`,
      aside: () => `${glyph('rest')}<span>${T('Set aside')}</span>`,
      other: () => `${glyph('held')}<span>${T('Not an order')}</span>`,
      missing: () => `${glyph('held', true)}<span>${T('Watar needs the time')}</span>`,
      ready: () => `${glyph('held', true)}<span>${T('Watar drafted an order')}</span>`,
    }[stateOf(m)]();
  }
  const open = () => S.inbox.filter((m) => !intake.handled[m.id]);

  // ---------- the list ----------
  let sel = null;
  function renderList() {
    const n = open().length;
    $('[data-sum]').textContent = n ? N(n, '{n} message waits for you', '{n} messages wait for you') : T('Everything that came in is on the line or set aside.');
    list.innerHTML = S.inbox.map((m) => {
      const cur = sel === m.id ? ' aria-current="true"' : '', st = stateOf(m);
      return `<li><a class="ib-row ${st}" href="#${m.id}"${cur}>
<span class="ib-ch" title="${m.by === 'Email' ? T('By email') : T('From the order form')}">${icon(m.by === 'Email' ? 'Email' : 'Link')}</span>
<span class="ib-rt"><span class="ib-rh"><b>${esc(T(m.from))}</b><time datetime="${m.at}">${V.at(m.at)}</time></span>
<span class="ib-subj">${esc(T(m.subject))}</span><span class="ib-prev">${bidi(esc(T(m.text)))}</span>
<span class="ib-st">${status(m)}</span></span></a></li>`;
    }).join('');
  }

  // ---------- one message and Watar's draft ----------
  const edits = {};
  function field(id, f, label, value, m, extra) {
    const missing = m && m.read && m.read[f] && m.read[f][0] == null && !value;
    return `<div class="field ib-f${missing ? ' miss' : ''}" data-field="${f}">
<label for="ib-${f}">${label}</label>${extra || `<input id="ib-${f}" name="${f}" ${{ date: `type="date" min="${S.dayIso}"`, time: 'type="time"', people: 'type="number" min="1" max="2000" inputmode="numeric"' }[f] || 'type="text"'} value="${esc(value)}" aria-describedby="ib-${f}-err">`}
<p class="err" id="ib-${f}-err" hidden></p>${m ? source(m, f) : ''}</div>`;
  }
  function clientRow(m, d) {
    if (d.ck) {
      const c = K.get(d.ck);
      return `<div class="ib-client">${icon('Company')}<div><b>${esc(T(c.name))}</b><span>${c.private ? T('Private client') : esc(T(c.contact))} · ${N(c.orders.length, '{n} order before this one', '{n} orders before this one')}</span></div><a class="ib-lk" href="client.html?c=${d.ck}">${T('Open the client')}</a></div>`;
    }
    if (m) return `<div class="ib-client new">${icon('Invite')}<div><b>${esc(T(d.name))}</b><span>${T('A new client: Sufra hasn’t had an order from {email} before.', { email: `<bdi>${esc(d.email)}</bdi>` })}</span></div></div>`;
    // a new order typed in: the client is one of Sufra's, or a new one named here
    const opts = Object.keys(S.clients).map((ck) => `<option value="${ck}"${d.ck === ck ? ' selected' : ''}>${esc(T(S.clients[ck].name))}</option>`).join('');
    return `<div class="field ib-f" data-field="client"><label for="ib-client">${T('Client')}</label><select id="ib-client" name="client"><option value="">${T('A new client')}</option>${opts}</select></div>
<div class="field ib-f" data-field="name"${d.ck ? ' hidden' : ''}><label for="ib-name">${T('The new client’s name')}</label><input id="ib-name" name="name" type="text" value="${esc(d.name || '')}" aria-describedby="ib-name-err"><p class="err" id="ib-name-err" hidden></p></div>`;
  }
  function draftHtml(m, d) {
    return `<form class="ib-draft" data-draft novalidate>
<p class="ib-dk">${glyph('held', true)}<span>${m ? T('Watar’s draft of the order · waits for you') : T('A new order · nothing is on the line until you create it')}</span></p>
${clientRow(m, d)}
${field('title', 'title', T('Order'), d.title, m)}
<div class="ib-two">${field('date', 'date', T('Date'), d.date, m)}${field('time', 'time', T('Time'), d.time, m)}</div>
<div class="ib-two">${field('people', 'people', T('People'), d.people, m)}${field('where', 'where', T('Where'), d.where, m)}</div>
${field('note', 'note', T('Note for the kitchen'), d.note, m)}
<p class="ib-next">${T('Creating it puts the order on Sufra’s line at Quote: Reem’s step is logged, Iqaa sends the client a receipt, and Watar drafts the quote for Reem to check.')}</p>
<div class="row-act ib-act"><button class="btn primary" type="submit">${icon('Done')}<span>${T('Create the order')}</span></button>${m ? `<button class="btn" type="button" data-aside>${icon('Discard')}<span>${T('Not an order')}</span></button>` : ''}</div>
</form>`;
  }
  function madeHtml(h) {
    const j = all().find((x) => x.code === h.code);
    if (!j) return '';
    return `<section class="ib-made" tabindex="-1" data-made>
<p class="ib-dk">${glyph('struck')}<span>${T('Order {code} is on the line', { code: `<bdi>${j.code}</bdi>` })}</span></p>
<h3>${esc(T(j.title))} · ${N(j.people, '{n} person', '{n} people')}</h3>
<p>${T('{who} logged it at {time}. Iqaa sent {client} a receipt, and Watar is drafting the quote.', { who: esc(T(j.logged ? j.logged.who : 'Reem')), time: V.hm(j.opened), client: esc(T(j.client)) })}</p>
<p class="ib-when">${icon('Date', 16)}<span>${esc(V.due(j))} · ${esc(V.when(j.iso))}</span></p>
<div class="row-act ib-act"><a class="btn" href="order.html?code=${j.code}">${icon('Orders')}<span>${T('Open the order')}</span></a><a class="ib-lk" href="today.html?as=reem">${T('Open Reem’s Today')}</a></div>
</section>`;
  }
  function renderDetail(focus) {
    const m = S.inbox.find((x) => x.id === sel);
    grid.classList.toggle('on', !!sel);
    if (!sel) { detail.innerHTML = ''; return; }
    const back = `<a class="ib-back" href="#">${T('Inbox')}</a>`;
    if (sel === 'new') {
      edits.new = edits.new || { ck: '', name: '', title: '', date: '', time: '', people: '', where: '', note: '' };
      detail.innerHTML = `${back}<div class="ib-mh"><h2>${T('New order')}</h2><p>${T('For an order that came by phone or in person.')}</p></div>${draftHtml(null, edits.new)}`;
    } else {
      const h = intake.handled[m.id];
      const head = `${back}<div class="ib-mh"><h2>${esc(T(m.subject))}</h2>
<p>${icon(m.by === 'Email' ? 'Email' : 'Link', 16)}<span>${T(m.by === 'Email' ? '{name} · by email · {time}' : '{name} · from the order form · {time}', { name: `<b>${esc(T(m.from))}</b> <bdi>${esc(m.address)}</bdi>`, time: V.at(m.at) })}</span></p></div>
<blockquote class="ib-msg">${marked(m)}</blockquote>`;
      let body;
      if (h && h.state === 'created') body = madeHtml(h);
      else if (h && h.state === 'aside') body = `<section class="ib-aside"><p>${glyph('rest')}<span>${T('Set aside at {time}. It stays here; nothing went on the line.', { time: V.hm(h.t) })}</span></p><button class="btn" type="button" data-back-in>${icon('Undo')}<span>${T('Take it back')}</span></button></section>`;
      else if (!m.read) {
        const about = all().find((x) => x.code === m.about);
        body = `<section class="ib-other"><p class="ib-dk">${glyph('held')}<span>${T('Watar read it · not a new order')}</span></p>
<p>${T('{name} asks for the invoice of {code}, {title}, to go to {email} as well.', { name: esc(T(m.from)), code: `<bdi>${about.code}</bdi>`, title: esc(T(about.title)), email: `<bdi>${esc('accounts@wadi.example')}</bdi>` })}</p>
<p class="hint">${T('Answer it from your email: Iqaa doesn’t send replies from the inbox yet.')}</p>
<div class="row-act ib-act"><button class="btn" type="button" data-aside>${icon('Done')}<span>${T('Set it aside')}</span></button><button class="btn" type="button" data-anyway>${icon('Create')}<span>${T('Make it an order anyway')}</span></button></div></section>`;
      } else {
        edits[m.id] = edits[m.id] || draftOf(m);
        body = draftHtml(m, edits[m.id]);
      }
      detail.innerHTML = head + body;
    }
    if (focus) { const h = $('h2', detail); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } detail.scrollIntoView({ block: 'nearest' }); }
  }

  // ---------- making the order ----------
  function readForm(form, id) {
    const d = edits[id];
    $$('input, select', form).forEach((el) => { if (el.name) d[el.name === 'client' ? 'ck' : el.name] = el.value.trim(); });
    return d;
  }
  function check(form, d, isNew) {
    const bad = [];
    const need = (f, ok, msg) => {
      const el = $(`#ib-${f}`, form), err = $(`#ib-${f}-err`, form);
      if (!el) return;
      el.closest('.field').classList.toggle('bad', !ok);
      el.setAttribute('aria-invalid', String(!ok));
      err.hidden = ok;
      if (!ok) { err.textContent = msg; bad.push(el); }
    };
    if (isNew) need('name', !!d.ck || !!d.name, T('Write the client’s name.'));
    need('title', !!d.title, T('Name the order, like “Office lunch”.'));
    need('date', /^\d{4}-\d\d-\d\d$/.test(d.date) && d.date >= S.dayIso, T('Choose the day, today or later.'));
    need('time', /^\d\d:\d\d$/.test(d.time), T('Add the time: the order can’t be planned without it.'));
    const n = +d.people;
    need('people', Number.isInteger(n) && n >= 1 && n <= 2000, T('Write how many people, from 1 to 2000.'));
    if (bad.length) bad[0].focus();
    return !bad.length;
  }
  function create(m, d) {
    const code = nextCode(), t = V.now(), iso = `${d.date}T${d.time}`;
    let client, of, ck = d.ck;
    if (ck) {
      const c = S.clients[ck];
      client = c.private ? c.name : c.contact;
      of = c.private ? 'a private order' : c.name;
    } else {
      client = d.name;
      of = 'a private order';
      ck = keyOf(client);
      intake.clients[ck] = { name: client, private: true, by: 'Email', phone: '[PHONE]', email: (m && m.address) || '', address: d.where || '[ADDRESS]' };
    }
    // Watar drafts the quote from the client's last order like this one, or from the dishes the message names
    const like = m && m.like && all().find((x) => x.code === m.like);
    const items = (like && like.quote && like.quote.items) || (m && m.menu) || ['Three salads', 'Fruit', 'Coffee and tea'];
    const opened = V.iso(t);
    const job = { code, title: d.title, people: +d.people, due: dueLabel(iso), iso, client, of, at: 'quote', step: 0, opened, from: m ? m.id : 'new',
      draft: { items, note: d.note || '', total: '[TOTAL]' },
      logged: { who: 'Reem', code, title: d.title, step: 'Reem logs the order', time: V.hm(t), then: 'Iqaa sent the client a receipt', to: 'Quote', kinds: ['struck', 'run'] } };
    intake.jobs.push(job);
    intake.handled[m ? m.id : `new-${code}`] = { state: 'created', code, t };
    save();
    // every screen reads the order from the data on load; this page shows it at once
    S.jobs.push(Object.assign({ ck }, job));
    Object.assign(S.clients, intake.clients);
    return job;
  }

  // ---------- events ----------
  function go(id, focus) {
    sel = id;
    renderList();
    renderDetail(focus);
  }
  addEventListener('hashchange', () => go(location.hash.slice(1) || null, true));
  $('[data-new]').addEventListener('click', () => { if (location.hash === '#new') go('new', true); else location.hash = 'new'; });
  detail.addEventListener('input', (e) => {
    const f = e.target.closest('.field');
    if (f && f.classList.contains('bad')) { f.classList.remove('bad'); e.target.removeAttribute('aria-invalid'); const err = $('.err', f); if (err) err.hidden = true; }
  });
  detail.addEventListener('change', (e) => {
    // a known client fills the place from their last order; the name field is for a new one
    if (e.target.id !== 'ib-client') return;
    const d = edits.new, c = S.clients[e.target.value];
    d.ck = e.target.value;
    const name = $('[data-field="name"]', detail), where = $('#ib-where', detail);
    if (name) name.hidden = !!c;
    if (c && where && !where.value) where.value = T(c.address);
  });
  detail.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target, id = sel, m = S.inbox.find((x) => x.id === id) || null;
    const d = readForm(form, id);
    if (!check(form, d, !m)) { say(T('Some details are missing.')); return; }
    const job = create(m, d);
    if (!m) edits.new = null;
    renderList();
    if (m) renderDetail(false);
    else detail.innerHTML = `<a class="ib-back" href="#">${T('Inbox')}</a>${madeHtml({ code: job.code })}`;
    const made = $('[data-made]', detail);
    if (made) { made.focus(); const g = $('.g', made); if (g) Beats.write(g, { each: M.half, gap: 0 }); Beats.enter(made); }
    say(T('Order {code} created. It is on the line at Quote.', { code: job.code }));
  });
  detail.addEventListener('click', (e) => {
    const m = S.inbox.find((x) => x.id === sel);
    if (e.target.closest('[data-aside]') && m) {
      intake.handled[m.id] = { state: 'aside', t: V.now() };
      save(); renderList(); renderDetail(false);
      $('[data-back-in]', detail).focus();
      say(T('Set aside. Nothing went on the line.'));
    } else if (e.target.closest('[data-back-in]') && m) {
      delete intake.handled[m.id];
      save(); renderList(); renderDetail(true);
    } else if (e.target.closest('[data-anyway]') && m) {
      // the message becomes a new order with its client already chosen
      edits.new = { ck: m.ck || '', name: m.ck ? '' : m.from, title: '', date: '', time: '', people: '', where: m.ck ? T(S.clients[m.ck].address) : '', note: '' };
      location.hash = 'new';
    }
  });
  $$('[data-detail]').forEach((d) => d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && matchMedia('(max-width: 899px)').matches && sel) location.hash = ''; }));

  // the first message that waits opens on a wide screen; a phone starts on the list
  const first = location.hash.slice(1) || (matchMedia('(min-width: 900px)').matches ? (open()[0] || S.inbox[0]).id : null);
  go(first, false);
})();
