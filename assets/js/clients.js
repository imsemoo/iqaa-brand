// Clients: every client, grouped by whose move it is. The clients to chase first, then the clients the team is
// serving, then the clients with nothing open. Each row says whose move it is with the step's own glyph, and carries
// the client's history as a small line in the signature's hand: one word per finished order.
(function () {
  const root = document.querySelector('main.cl');
  if (!root || !window.IQ || !window.Beats || !window.SUFRA || !window.JOBS) return;
  const S = window.SUFRA;
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

  // only the word 'Late' is red, and only for a delivery recorded late
  const late = (t) => esc(t).replace(/^Late/, '<span class="t-late">Late</span>');
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const when = (iso) => `<time datetime="${iso}">${esc(V.label(iso))}</time>`;

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
    // as wide as the strokes; the round ends of the pen run over the edge
    const w = width(from);
    const svg = `<svg class="cl-mini" viewBox="0 ${TOP * MINI} ${w} ${(BOT - TOP) * MINI}" width="${w.toFixed(1)}" height="${((BOT - TOP) * MINI).toFixed(1)}" aria-hidden="true">${body}</svg>`;
    return `${from ? `<span class="cl-more" aria-hidden="true">+${from}</span>` : ''}${svg}`;
  }

  // ---------- one row: who, the open order, whose move, the history ----------
  function row(c, via, room) {
    const j = c.soon, last = c.fin[c.fin.length - 1], orders = c.orders.length;
    const sub = `${esc(c.private ? 'Private client' : c.contact)} · ${plural(orders, 'order')}`;
    const found = via ? `<span class="cl-via">Found in ${via.code}, ${esc(via.title)}</span>` : '';
    const more = c.open.length > 1 ? ` · +${c.open.length - 1} more open` : '';
    let order, due, sub2, say;
    if (j) {
      const soon = V.days(j.iso) <= 1 && V.days(j.iso) >= 0;
      order = `<span class="cl-o"><span class="cl-ot">${esc(j.title)} · ${j.people} people${more}</span>
<span class="cl-od">${IQ.icon('Date', 16)}<span>${when(j.iso)} · ${soon ? `<b>${V.when(j.iso)}</b>` : V.when(j.iso)}</span></span></span>`;
      due = `<span class="cl-due${soon ? ' soon' : ''}">${V.when(j.iso)} <time datetime="${j.iso}">${V.hm(j.iso)}</time></span>`;
      sub2 = `${esc(c.private ? 'Private client' : c.contact)} · ${esc(j.title)}, ${j.people} people${more}`;
      say = `${esc(j.title)} for ${j.people} people, ${esc(V.day(j.iso))} at ${V.hm(j.iso)}, ${V.when(j.iso)}`;
    } else {
      order = `<span class="cl-o last"><span class="cl-ot">Last: ${esc(last.title)} · ${last.people} people</span>
<span class="cl-od">${IQ.icon('Done', 16)}<span>Finished ${esc(last.finished)}</span></span></span>`;
      due = `<span class="cl-due">Finished ${esc(last.finished.split(',')[0])}</span>`;
      sub2 = `${esc(c.private ? 'Private client' : c.contact)} · Last: ${esc(last.title)}, ${last.people} people`;
      say = `Nothing open; the last order, ${esc(last.title)}, finished ${esc(last.finished)}`;
    }
    let move = '', moveSay = '';
    if (j) {
      const m = K.move(j, c), sent = early[j.code], r = sent ? null : K.reminder(j);
      // a reminder already sent early, from the client's page or approved in Ask Watar, replaces the warning
      if (sent && m.who === c.C) Object.assign(m, { l2: `Reminded at ${V.hm(sent.t)} by ${sent.by}`, risk: false });
      move = `<span class="cl-m">${m.lead}<span class="cl-mt"><span>${esc(m.l1)}</span><span${m.risk ? ' class="cp-risk"' : ''}>${esc(m.l2)}</span></span></span>`;
      moveSay = m.who === c.C && r
        ? `Waiting for ${c.C}’s answer since ${V.at(r.sent)}; the line’s reminder, ${V.label(r.due).replace(', ', ' at ')}, ${r.after ? `would come after the ${j.title.toLowerCase()}` : r.risk ? `would come less than a day before the ${j.title.toLowerCase()}` : 'comes if there’s no answer'}`
        : `${m.l1.replace(' · ', ', ')}; ${m.l2.charAt(0).toLowerCase()}${m.l2.slice(1)}`;
    }
    const phrase = K.phrase(c.fin);
    const label = `${c.name}, ${c.private ? 'private client' : c.contact}. ${say}.${moveSay ? ` ${moveSay}.` : ''} History: ${phrase.charAt(0).toLowerCase()}${phrase.slice(1)}.`;
    return `<li><a class="cl-row${j ? '' : ' none'}" href="client.html?c=${c.key}" aria-label="${esc(label)}">
<span class="cl-c"><span class="cl-in${c.private ? ' p' : ''}" aria-hidden="true">${esc(c.name.charAt(0))}</span><span class="cl-ct"><b>${esc(c.name)}</b><span class="cl-s">${sub}</span>${found}</span></span>${due}<span class="cl-s2">${sub2}</span>
${order}${move}
<span class="cl-h"><span class="cl-hl">${mini(c, room)}</span><span class="cl-ph">${late(phrase)}</span></span>
</a></li>`;
  }

  // ---------- the groups, in operations order; while a query is typed, only what matches ----------
  function render() {
    const words = q.trim();
    const room = Math.max(120, (($('.cl-h') || {}).clientWidth || 0) - 4) || 187;
    let shown = 0;
    $('[data-groups]').innerHTML = GROUPS.map((g) => {
      const hits = groups[g.id].map((c) => ({ c, m: K.find(c, words) })).filter((x) => x.m.ok);
      shown += hits.length;
      if (words && !hits.length) return '';
      const rows = hits.length ? `<ol class="cl-rows">${hits.map((x) => row(x.c, x.m.via, room)).join('')}</ol>` : `<p class="cl-none">${g.empty}</p>`;
      return `<section class="cl-g" aria-labelledby="g-${g.id}"><div class="cl-gh"><h2 id="g-${g.id}">${IQ.icon(g.icon, 18)}<span>${g.name}</span> <span class="cl-n">${hits.length}</span></h2><p class="hint">${g.hint}</p></div>${rows}</section>`;
    }).join('');
    const empty = $('[data-empty]');
    empty.hidden = shown > 0;
    $('.cl-key').hidden = !shown;
    if (!shown) {
      empty.innerHTML = `<p class="cl-empty-t">${IQ.icon('Search', 20)}<b>No client matches “${esc(words)}”.</b></p><p class="hint">Try a name, a contact or an order number, like 0031.</p>
<button type="button" class="btn" data-clear>${IQ.icon('Clients', 18)}<span>Show every client</span></button>`;
    }
    $('[data-live]').textContent = words ? `${shown} ${shown === 1 ? 'client matches' : 'clients match'}` : '';
  }

  const open = all.filter((c) => c.soon).length;
  $('[data-sum]').textContent = `${plural(all.length, 'client')} · ${open} with an order on the line · ${groups.theirs.length} waiting on their answer`;

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
