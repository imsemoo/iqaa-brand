// Clients: every client, grouped by whose move it is. The clients to chase first, then the clients the team is
// serving, then the clients with nothing open. Each row says whose move it is with the step's own glyph, and carries
// the client's history as a small line in the signature's hand: one word per finished order.
(function () {
  const root = document.querySelector('main.cl');
  if (!root || !window.IQ || !window.Beats || !window.SUFRA || !window.JOBS) return;
  const S = window.SUFRA, T = window.T, N = window.I18N.n, EN = I18N.lang === 'en';
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = Beats.esc;
  const J = JOBS.on(S.line()), V = JOBS.views(J, S), K = JOBS.clients(J, S, V);
  const groups = K.list();
  // reminders sent early this visit, by order code (client.js and watar.js write them)
  let early = {};
  try { early = JSON.parse(sessionStorage.getItem('iqaa-reminded') || '{}') || {}; } catch (e) { /* storage blocked: none */ }
  const all = groups.theirs.concat(groups.ours, groups.none);
  const GROUPS = [
    { id: 'theirs', name: 'Waiting on them', icon: 'Clients', hint: 'The quote is with them. The line waits for their answer, then reminds them.', empty: 'No client is deciding on a quote right now.' },
    { id: 'ours', name: 'Waiting on us', icon: 'People', hint: 'With the team, or running by itself.', empty: 'Nothing is on the line for a client right now.' },
    { id: 'none', name: 'Nothing open', icon: 'Done', hint: 'Their last order is finished.', empty: 'Every client has an order on the line.' },
  ];
  let q = '';

  // only the word for late is red, and only for a delivery recorded late (the phrase comes from jobs.js, in the page's
  // language: 'Late', 'تأخر', 'gecikti')
  const LATE = { en: /^Late/, ar: /^تأخر/, tr: /gecikti/ }[I18N.lang] || /^Late/;
  const late = (t) => esc(t).replace(LATE, (w) => `<span class="t-late">${w}</span>`);
  const people = (n) => N(n, '{n} person', '{n} people');
  const when = (iso) => `<time datetime="${iso}">${esc(V.label(iso))}</time>`;
  // a code inside Arabic words keeps its own order
  const bd = (s) => (I18N.rtl ? `<bdi>${s}</bdi>` : s);
  const lc = (t) => (EN ? t.charAt(0).toLowerCase() + t.slice(1) : t);
  const contactOf = (c) => T(c.private ? 'Private client' : c.contact);

  // ---------- the client's history: finished orders as words of a small line, the newest that fit ----------
  const MINI = 0.45, TOP = -33.2, BOT = 9;
  function mini(c, room) {
    const { words } = K.layout(c, { finished: true });
    if (!words.length) return '';
    // drop the oldest words until the line fits its column; '+N' then leads it
    let from = 0;
    const width = (n) => (words[words.length - 1].x1 - words[n].x0) * MINI;
    while (from < words.length - 1 && width(from) + (from ? 28 : 0) > room) from++;
    const x0 = words[from].x0, pal = window.IQAA.pal.light;
    const body = words.slice(from).map((w) => w.strokes.map((s) => IQ.cell(s.kind, s.x - x0, 0, pal, MINI)).join('')).join('');
    // as wide as the strokes; the round ends of the pen run over the edge. A line of time: right to left in Arabic
    const w = width(from);
    const svg = `<svg class="cl-mini flow" viewBox="0 ${TOP * MINI} ${w} ${(BOT - TOP) * MINI}" width="${w.toFixed(1)}" height="${((BOT - TOP) * MINI).toFixed(1)}" aria-hidden="true">${body}</svg>`;
    return `${from ? `<span class="cl-more" aria-hidden="true">+${from}</span>` : ''}${svg}`;
  }

  // ---------- one row: who, the open order, whose move, the history ----------
  function row(c, via, room) {
    const j = c.soon, last = c.fin[c.fin.length - 1], orders = c.orders.length, name = T(c.name), who = contactOf(c);
    const sub = `${esc(who)} · ${N(orders, '{n} order', '{n} orders')}`;
    const found = via ? `<span class="cl-via">${T('Found in {code}, {title}', { code: bd(via.code), title: esc(T(via.title)) })}</span>` : '';
    const more = c.open.length > 1 ? ` · ${N(c.open.length - 1, '+{n} more open', '+{n} more open')}` : '';
    let order, due, sub2, say;
    if (j) {
      const soon = V.days(j.iso) <= 1 && V.days(j.iso) >= 0, title = esc(T(j.title));
      order = `<span class="cl-o"><span class="cl-ot">${title} · ${people(j.people)}${more}</span>
<span class="cl-od">${IQ.icon('Date', 16)}<span>${when(j.iso)} · ${soon ? `<b>${V.when(j.iso)}</b>` : V.when(j.iso)}</span></span></span>`;
      due = `<span class="cl-due${soon ? ' soon' : ''}">${V.when(j.iso)} <time datetime="${j.iso}">${V.hm(j.iso)}</time></span>`;
      sub2 = `${esc(who)} · ${T('{title}, {people}', { title, people: people(j.people) })}${more}`;
      say = T('{title} for {people}, {day} at {time}, {when}', { title, people: people(j.people), day: esc(V.day(j.iso)), time: V.hm(j.iso), when: V.when(j.iso) });
    } else {
      const title = esc(T(last.title)), done = esc(V.fin(last));
      order = `<span class="cl-o last"><span class="cl-ot">${T('Last: {title} · {people}', { title, people: people(last.people) })}</span>
<span class="cl-od">${IQ.icon('Done', 16)}<span>${T('Finished {date}', { date: done })}</span></span></span>`;
      due = `<span class="cl-due">${T('Finished {date}', { date: esc(V.day(V.fromLabel(last.finished))) })}</span>`;
      sub2 = `${esc(who)} · ${T('Last: {title}, {people}', { title, people: people(last.people) })}`;
      say = T('Nothing open; the last order, {title}, finished {date}', { title, date: done });
    }
    let move = '', moveSay = '';
    if (j) {
      const m = K.move(j, c), sent = early[j.code], r = sent ? null : K.reminder(j);
      // a reminder already sent early, from the client's page or approved in Ask Watar, replaces the warning
      if (sent && m.who === c.C) Object.assign(m, { l2: T('Reminded at {time} by {name}', { time: V.hm(sent.t), name: T(sent.by) }), risk: false });
      move = `<span class="cl-m">${m.lead}<span class="cl-mt"><span>${esc(m.l1)}</span><span${m.risk ? ' class="cp-risk"' : ''}>${esc(m.l2)}</span></span></span>`;
      if (m.who === c.C && r) {
        const v = { name: T(c.C), since: V.at(r.sent), due: T('{day} at {time}', { day: V.day(r.due), time: V.hm(r.due) }), title: EN ? j.title.toLowerCase() : T(j.title) };
        moveSay = r.after ? T('Waiting for {name}’s answer since {since}; the line’s reminder, {due}, would come after the {title}', v)
          : r.risk ? T('Waiting for {name}’s answer since {since}; the line’s reminder, {due}, would come less than a day before the {title}', v)
            : T('Waiting for {name}’s answer since {since}; the line’s reminder, {due}, comes if there’s no answer', v);
      } else moveSay = EN ? `${m.l1.replace(' · ', ', ')}; ${m.l2.charAt(0).toLowerCase()}${m.l2.slice(1)}` : `${m.l1.replace(' · ', T(', '))}${T('; ')}${m.l2}`;
    }
    const phrase = K.phrase(c.fin);
    const label = T('{name}, {who}. {say}.{move} History: {phrase}.', { name, who: c.private ? T('private client') : T(c.contact), say, move: moveSay ? ` ${moveSay}.` : '', phrase: lc(phrase) });
    // the client's own tile: the first letter of the name the page shows
    return `<li><a class="cl-row${j ? '' : ' none'}" href="client.html?c=${c.key}" aria-label="${esc(label)}">
<span class="cl-c"><span class="cl-in${c.private ? ' p' : ''}" aria-hidden="true">${esc(name.charAt(0))}</span><span class="cl-ct"><b>${esc(name)}</b><span class="cl-s">${sub}</span>${found}</span></span>${due}<span class="cl-s2">${sub2}</span>
${order}${move}
<span class="cl-h"><span class="cl-hl">${mini(c, room)}</span><span class="cl-ph">${late(phrase)}</span></span>
</a></li>`;
  }

  // ---------- search: what the page shows as well as the data ----------
  // A query finds the client's name and contact and its orders' codes and titles in English (jobs.js) and as this page
  // writes them; letters are compared without case, accents or the forms of alef, taa marbuta and alef maqsura, so
  // 'اسيل' finds «أسيل» and 'sirket' finds «şirket».
  const fold = (t) => String(t).toLocaleLowerCase(I18N.lang).normalize('NFKD').replace(/[̀-ًͯ-ٰٟ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ı/g, 'i');
  function find(c, words) {
    const k = K.find(c, words);
    if (k.ok || EN) return k;
    const w = fold(words.trim());
    if (fold(`${T(c.name)} ${c.contact ? T(c.contact) : ''} ${T(c.C)}`).includes(w)) return { ok: true, via: null };
    const via = c.open.concat(c.fin.slice().reverse()).find((j) => fold(`${j.code} ${T(j.title)}`).includes(w));
    return { ok: !!via, via: via || null };
  }

  // ---------- the groups, in operations order; while a query is typed, only what matches ----------
  function render() {
    const words = q.trim();
    const room = Math.max(120, (($('.cl-h') || {}).clientWidth || 0) - 4) || 187;
    let shown = 0;
    $('[data-groups]').innerHTML = GROUPS.map((g) => {
      const hits = groups[g.id].map((c) => ({ c, m: find(c, words) })).filter((x) => x.m.ok);
      shown += hits.length;
      if (words && !hits.length) return '';
      const rows = hits.length ? `<ol class="cl-rows">${hits.map((x) => row(x.c, x.m.via, room)).join('')}</ol>` : `<p class="cl-none">${T(g.empty)}</p>`;
      return `<section class="cl-g" aria-labelledby="g-${g.id}"><div class="cl-gh"><h2 id="g-${g.id}">${IQ.icon(g.icon, 18)}<span>${T(g.name)}</span> <span class="cl-n">${hits.length}</span></h2><p class="hint">${T(g.hint)}</p></div>${rows}</section>`;
    }).join('');
    const empty = $('[data-empty]');
    empty.hidden = shown > 0;
    $('.cl-key').hidden = !shown;
    if (!shown) {
      empty.innerHTML = `<p class="cl-empty-t">${IQ.icon('Search', 20)}<b>${T('No client matches “{q}”.', { q: esc(words) })}</b></p><p class="hint">${T('Try a name, a contact or an order number, like 0031.')}</p>
<button type="button" class="btn" data-clear>${IQ.icon('Clients', 18)}<span>${T('Show every client')}</span></button>`;
    }
    $('[data-live]').textContent = words ? N(shown, '{n} client matches', '{n} clients match') : '';
  }

  const open = all.filter((c) => c.soon).length;
  $('[data-sum]').textContent = `${N(all.length, '{n} client', '{n} clients')} · ${N(open, '{n} with an order on the line', '{n} with an order on the line')} · ${N(groups.theirs.length, '{n} waiting on their answer', '{n} waiting on their answer')}`;

  const field = $('[data-q]');
  field.addEventListener('input', () => { q = field.value; render(); });
  field.addEventListener('keydown', (e) => { if (e.key === 'Escape' && field.value) { e.preventDefault(); field.value = ''; q = ''; render(); } });
  root.addEventListener('click', (e) => {
    if (!e.target.closest('[data-clear]')) return;
    field.value = ''; q = ''; render(); field.focus();
  });

  render();
  // the history column decides how many words fit: draw again when its width changes
  let room = 0;
  if (window.ResizeObserver) new ResizeObserver(() => { const h = $('.cl-h'); const w = h ? h.clientWidth : 0; if (w && w !== room) { room = w; render(); } }).observe($('.cl-wrap'));
})();
