// Today: one person's station as a platform board. What waits for you now, what is coming to you, what you
// handed on. Every step you finish adds a loop to your day's signature; a job you finish leaves your station
// along its metro strip, and a handoff can be taken back.
(function () {
  const root = document.querySelector('main.td');
  if (!root || !window.IQ || !window.Beats || !window.SUFRA || !window.JOBS) return;
  const M = window.IQAA.motion, S = window.SUFRA;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const esc = Beats.esc, reduce = Beats.reduce;
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const isPerson = (k) => k === 'held' || k === 'struck';
  const store = (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } };

  // who is signed in: ?as= for the prototype, else the person sign-in remembered, else Reem
  const asked = (new URLSearchParams(location.search).get('as') || store('iqaa-person') || 'reem').toLowerCase();
  let own = null;
  try { const o = JSON.parse(store('iqaa-org') || 'null'); if (o && !o.demo && o.blocks && o.blocks.length) own = o; } catch (e) { /* the demo stays */ }
  // your own organization (made at sign-up) knows your name only if sign-in remembered it
  const known = store('iqaa-person');
  const me = own ? { name: known ? known.charAt(0).toUpperCase() + known.slice(1) : '', role: 'Owner' } : (S.people[asked] || S.people.reem);

  const line = S.line();
  const main = line.stations;
  let jobs = S.jobs.filter((j) => !j.finished).map(clone);
  const done = S.done.filter((d) => d.who === me.name).map(clone);
  let open = null;

  // ---------- reading the line, through the shared jobs.js ----------
  const J = window.JOBS.on(line), V = window.JOBS.views(J, S);
  const { station, stepOf, nextStation, ahead, pos } = J;
  const mine = (j) => { const x = stepOf(j); return !!x && isPerson(x.kind) && x.who === me.name; };
  const worksAt = (st) => st.steps.some((x) => isPerson(x.kind) && x.who === me.name);

  // ---------- words: the data stays English; T() says it in the page's language (i18n.js) ----------
  const N = window.I18N.n;
  // "Reem checks the prices" said to Reem: "Check the prices"; "Salma prepares" says what: "Prepare the family dinner".
  // The English is worked out from the step's name; the other languages translate it whole ('Prepare the {title}')
  function imperative(name, j) {
    if (!name.startsWith(`${me.name} `)) return T(name);
    const [verb, ...rest] = name.slice(me.name.length + 1).split(' ');
    const base = /(ch|sh|ss|x)es$/.test(verb) ? verb.slice(0, -2) : verb.replace(/s$/, '');
    const Base = base.charAt(0).toUpperCase() + base.slice(1);
    if (!rest.length && j) return T(`${Base} the {title}`, { title: V.lcT(j.title) });
    return T([Base].concat(rest).join(' '));
  }
  // what a finished step is called in Done today: the English (kept with the step, as the data's) and its words
  function doneName(x) {
    const w = /^Watar drafts (.+)$/.exec(x.name);
    if (w) return `Approved Watar’s draft of ${w[1]}`;
    return x.kind === 'held' ? `Approved: ${x.name}` : x.name;
  }
  const doneSaid = (d) => (d.said || T(d.step));
  function doneWords(x) {
    if (/^Watar drafts /.test(x.name)) return T(doneName(x));
    return x.kind === 'held' ? T('Approved: {step}', { step: T(x.name) }) : T(x.name);
  }
  function forYou(j, x) {
    if (x.kind === 'held' && /^Watar/.test(x.name)) return T('Watar drafted the quote. Check it, then approve it or ask for a change.');
    if (x.kind === 'held') return T('{step}: it waits for your answer.', { step: T(x.name) });
    return `${imperative(x.name, j)}.`;
  }
  const dayMs = 864e5;
  function when(iso) {
    const d = Math.round((new Date(iso.slice(0, 10)) - new Date(S.dayIso)) / dayMs);
    return d === 0 ? T('today') : d === 1 ? T('tomorrow') : d < 0 ? T('late') : N(d, 'in {n} day', 'in {n} days');
  }
  const quoted = (s) => T('“{s}”', { s });
  // the demo day has its own clock: it opens at 09:41, after the morning's work, runs at real speed, and each
  // step you finish takes a few minutes of it
  const opened = Date.now(), START = 9 * 60 + 41;
  let worked = 0;
  const minutes = () => START + worked + Math.floor((Date.now() - opened) / 6e4);
  const now = () => { const m = minutes(); return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
  // the greeting, with the person's name when the page knows it
  function greeting(name) {
    const h = Math.floor(minutes() / 60), part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    return name ? T(`${part}, {name}`, { name: T(name) }) : T(part);
  }
  const glyph = (k, test) => `<span class="g" aria-hidden="true">${IQ.glyph(k, { test: !!test })}</span>`;

  // the metro strip: the line's stations, yours ringed violet, the job a filled stop
  const strip = (j) => J.strip(j, worksAt);
  function where(j) {
    const p = station(j.at), st = p.st, v = { station: `<b>${esc(T(st.name))}</b>`, n: j.step + 1, total: st.steps.length };
    return p.route ? T('At {station}, on the branch for big orders · step {n} of {total}', v) : T('At {station} · step {n} of {total}', v);
  }

  // ---------- waiting for you ----------
  function panel(j, x) {
    if (x.kind === 'held' && j.draft) {
      const d = j.draft;
      // what you typed stays as you typed it, in your words
      const chg = d.changed ? `<p class="dr-chg"><b>${T('Changed as you asked:')}</b> ${esc(quoted(d.changed))}</p>` : '';
      return `<div class="draft" data-draft>
<p class="dr-k">${glyph('held')}<span>${T('Watar’s draft')}</span>${d.busy ? `<span class="dr-busy">${T('Watar is redrafting…')}</span>` : ''}</p>
<ul>${d.items.map((t) => `<li>${esc(T(t))}</li>`).join('')}</ul>
<p>${esc(T(d.note))}</p>${chg}
<p class="dr-tot">${T('Total {total}', { total: `<b>${esc(T(d.total))}</b>` })} <span class="hint">${T('from Sufra’s price list')}</span></p>
</div>
<div class="jb-act"><button class="btn primary" type="button" data-approve${d.busy ? ' disabled' : ''}>${IQ.icon('Done', 18)}<span>${T('Approve the draft')}</span></button><button class="btn" type="button" data-change aria-expanded="false"${d.busy ? ' disabled' : ''}>${IQ.icon('Ask Watar', 18)}<span>${T('Ask Watar for a change')}</span></button></div>
<form class="jb-chg" data-chg-form hidden novalidate>
<div class="field"><label for="chg-${j.code}">${T('What should change?')}</label><textarea id="chg-${j.code}" rows="2" data-chg-text placeholder="${esc(T('For example: no nuts, and lunch at 12:00 instead.'))}"></textarea><p class="err" hidden data-chg-err></p></div>
<div class="row-act"><button class="btn" type="button" data-chg-cancel>${T('Cancel')}</button><button class="btn ink" type="submit">${IQ.icon('Send', 18)}<span>${T('Send to Watar')}</span></button></div>
</form>`;
    }
    const items = (x.check || ['Done as the step says']).map((t, i) => `<label class="chk"><input type="checkbox" data-check="${i}"><span>${esc(T(t))}</span></label>`).join('');
    const after = ahead(j);
    const autos = [];
    for (const a of after) { if (a.x.kind !== 'run') break; autos.push(a); }
    const nextP = after[autos.length];
    let then = '';
    if (nextP && nextP.st !== station(j.at).st) {
      const v = { station: esc(T(nextP.st.name)), steps: autos.map((a) => quoted(esc(T(a.x.name)))).join(T(' and ')) };
      then = !autos.length ? T('Next, the job moves to {station}.', v)
        : autos.length === 1 ? T('Next, {steps} runs by itself and the job moves to {station}.', v) : T('Next, {steps} run by itself and the job moves to {station}.', v);
    }
    return `<fieldset class="chk-l"><legend>${T('Before you hand it on')}</legend>${items}</fieldset>
<p class="err" data-check-err hidden></p>
<div class="jb-act"><button class="btn primary" type="button" data-finish>${IQ.icon('Done', 18)}<span>${T('Mark done')}</span></button></div>
<p class="hint">${then} ${T('The checklist locks when the job moves on.')}</p>`;
  }

  function jobLi(j) {
    const x = stepOf(j), on = open === j.code;
    return `<li class="job${on ? ' open' : ''}" data-job="${j.code}">
<div class="jb-top"><a class="jb-code" href="order.html?code=${j.code}"><code>${j.code}</code></a><span>${esc(T('{client}, {of}', { client: T(j.client), of: T(j.of) }))}</span><span class="due">${IQ.icon('Date', 16)}<span>${esc(V.due(j))} · ${when(j.iso)}</span></span></div>
<h3><button type="button" class="jb-h" data-open="${j.code}" aria-expanded="${on}" aria-controls="p-${j.code}">${esc(T(j.title))} · ${N(j.people, '{n} person', '{n} people')}</button></h3>
<div class="jb-pos">${strip(j)}<p>${where(j)}</p></div>
<div class="jb-for">${glyph(x.kind)}<p><b>${T('For you:')}</b> ${esc(forYou(j, x))}</p></div>
<div class="jb-panel" id="p-${j.code}"${on ? '' : ' hidden'}>${panel(j, x)}</div>
</li>`;
  }

  const waiting = () => jobs.filter(mine).sort((a, b) => a.iso.localeCompare(b.iso));
  function coming() {
    return jobs.filter((j) => !mine(j)).map((j) => {
      const a = ahead(j), k = a.findIndex((s) => isPerson(s.x.kind) && s.x.who === me.name);
      return k < 0 ? null : { j, k, at: a[k].st };
    }).filter(Boolean).sort((p, q) => p.k - q.k).slice(0, 4);
  }

  // ---------- render ----------
  function renderHead() {
    const w = waiting(), n = w.length;
    const at = [...new Set(w.map((j) => station(j.at).st.name))];
    $('[data-day]').textContent = T(S.day);
    $('[data-greet]').textContent = greeting(me.name);
    $('[data-sum]').textContent = own ? T('Welcome to {org}.', { org: own.name })
      : n ? N(n, '{n} job is waiting for you at {stations}. Start with the first.', '{n} jobs are waiting for you at {stations}. Start with the first.', { stations: at.map((a) => T(a)).join(T(' and ')) })
        : T('Nothing is waiting for you right now.');
  }
  // ---------- the day's rhythm: the working day as a line in time; each finished step is written at its hour ----------
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  function renderSig(write) {
    const el = $('[data-day-sig]');
    const W = Math.max(280, Math.round(el.clientWidth)), narrow = W < 640;
    const from = 8 * 60, to = (narrow ? 14 : 18) * 60, H = 88, base = 54, k = narrow ? 0.7 : 1;
    const x = (m) => 12 + ((Math.min(Math.max(m, from), to) - from) / (to - from)) * (W - 24);
    const pal = window.IQAA.pal.light;
    // a drawing of time: class flow runs it right to left in Arabic, the hours with it
    let svg = `<svg class="flow" direction="ltr" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><path class="day" d="M${x(from)} ${base}H${x(to)}"/>`;
    for (let h = from / 60; h <= to / 60; h++) {
      const hx = x(h * 60);
      svg += `<path class="hr" d="M${hx} ${base + 6}v6"/>`;
      if (narrow || h % 2 === 0) svg += `<text class="hl" x="${hx}" y="${base + 26}" text-anchor="middle">${String(h).padStart(2, '0')}:00</text>`;
    }
    // strokes sit at their time; when two land close, the later one waits its turn, as a pen would
    let cursor = -Infinity, marks = '';
    done.forEach((d, i) => {
      let px = Math.max(x(toMin(d.time)), cursor + 6);
      let g = '';
      d.kinds.forEach((kind) => { g += IQ.cell(kind, px / k, base / k, pal, k); px += IQ.WIDTH[kind] * k; });
      marks += `<g data-e="${i}">${g}</g>`;
      cursor = px;
    });
    // now is where the pen is: the hour on the clock, or just after the last stroke
    const nx = Math.max(x(minutes()), done.length ? cursor + 8 : 0);
    const lx = Math.min(Math.max(nx, 40), W - 40);
    // what is still yours today waits ahead of the pen, drawn with the dashed grey pen of things not done yet
    const todo = own ? [] : waiting().map((j) => station(j.at).st.steps.slice(j.step).filter((y) => isPerson(y.kind) && y.who === me.name).map((y) => y.kind));
    let ax = nx + 12, ahead = '';
    todo.forEach((kinds) => {
      kinds.forEach((kind) => { ahead += IQ.cell(kind, ax / k, base / k, pal, k, true); ax += IQ.WIDTH[kind] * k + 4; });
      ax += 10;
    });
    svg += `${marks}${ahead}<path class="now" d="M${nx} 18V${base + 12}"/><text class="nl" x="${lx}" y="12" text-anchor="middle">${esc(T('Now {time}', { time: now() }))}</text></svg>`;
    el.innerHTML = svg;
    el.setAttribute('role', 'img');
    const steps = done.length, left = todo.flat().length;
    const sofar = steps ? T('Your day so far: {steps}.', { steps: done.map((d) => `${d.time}${T(', ')}${doneSaid(d)}`).join(T('; ')) }) : T('Your day has not started yet.');
    el.setAttribute('aria-label', `${sofar} ${N(left, '{n} steps still yours today.', '{n} steps still yours today.')}`);
    $('[data-day-cap]').textContent = `${steps ? N(steps, '{n} done, each at its hour', '{n} done, each at its hour') : T('Nothing done yet')}${left ? N(left, '; {n} still yours, in grey ahead of now', '; {n} still yours, in grey ahead of now') : ''}.`;
    // the pen writes only the step just finished
    if (write && !reduce()) $$(`[data-e="${done.length - 1}"] path, [data-e="${done.length - 1}"] circle`, el).forEach((p, i) => {
      if (p.tagName === 'circle') { p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: M.quarter, delay: i * M.eighth, fill: 'backwards' }); return; }
      const len = p.getTotalLength();
      p.animate([{ strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 }],
        { duration: M.quarter, delay: i * M.eighth, easing: M.ease_move, fill: 'backwards' });
    });
  }
  function renderWaiting() {
    const w = waiting();
    if (open && !w.some((j) => j.code === open)) open = null;
    if (!open && w.length) open = w[0].code;
    $('[data-wait]').innerHTML = w.map(jobLi).join('');
    const empty = $('[data-empty]');
    empty.hidden = w.length > 0;
    if (!w.length) {
      const c = coming()[0];
      empty.innerHTML = own
        ? `<p>${T('Jobs appear here when your team adds an order. Until then, try your line with a test job.')}</p><a class="btn" href="line.html">${IQ.icon('Line', 18)}<span>${T('Open the line')}</span></a>`
        : `<p><b>${T('Your station is clear.')}</b></p><p class="hint">${c ? T('Next: {title} ({code}) reaches you at {station}.', { title: esc(T(c.j.title)), code: `<code dir="ltr">${c.j.code}</code>`, station: esc(T(c.at.name)) }) : T('No job is heading your way yet.')}</p><a class="btn" href="line.html">${IQ.icon('Line', 18)}<span>${T('See the whole line')}</span></a>`;
    }
  }
  function renderComing() {
    const c = own ? [] : coming();
    $('[data-coming]').innerHTML = c.length ? c.map(({ j, at }) => {
      const x = stepOf(j), p = station(j.at);
      return `<li class="mn"><div class="mn-t"><code>${j.code}</code><b>${esc(T(j.title))}</b><span class="hint">${N(j.people, '{n} person', '{n} people')}</span></div>
<div class="mn-pos">${strip(j)}</div>
<p class="mn-now">${glyph(x.kind)}<span>${T('Now at {station}: {step}. Reaches you at {to}.', { station: esc(T(p.st.name)), step: esc(T(x.name)), to: `<b>${esc(T(at.name))}</b>` })}</span></p></li>`;
    }).join('') : `<li class="mn none">${T('No job is heading your way yet.')}</li>`;
  }
  function renderDone(fresh) {
    // only a job's latest step can be taken back: earlier ones are what the latest was built on
    const latest = {};
    done.forEach((d, i) => { latest[d.code] = i; });
    $('[data-done]').innerHTML = done.length ? done.slice().reverse().map((d, i) => `<li class="mn dn${fresh && i === 0 ? ' fresh' : ''}">
<p class="dn-t"><time>${d.time}</time>${glyph('struck')}<span><b>${esc(doneSaid(d))}</b> · ${esc(T(d.title))} <code>${d.code}</code></span></p>
${d.then || d.to ? `<p class="hint dn-n">${esc([d.then ? T(d.then) : '', d.to ? T('Handed on to {station}', { station: T(d.to) }) : ''].filter(Boolean).join('. '))}.</p>` : ''}
${d.undo && latest[d.code] === done.length - 1 - i ? `<button class="link" type="button" data-back="${d.code}">${T('Take it back')}</button>` : ''}
</li>`).join('') : `<li class="mn none">${T('Nothing yet. Each step you finish lands here.')}</li>`;
    if (fresh && !reduce()) {
      const li = $('.dn.fresh');
      if (li) li.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: M.half, easing: M.ease_arrive });
    }
  }
  function renderAll() { renderHead(); renderWaiting(); renderComing(); renderDone(); }
  const say = (t) => { $('[data-live]').textContent = t; };

  // ---------- finishing a step: the job either stays with you or leaves your station ----------
  async function finish(j, li) {
    const x = stepOf(j), before = clone(j), fromPos = pos(j), fromSt = station(j.at).st;
    worked += 7;
    const entry = { who: me.name, code: j.code, title: j.title, step: doneName(x), said: doneWords(x), time: now(), kinds: ['struck'], undo: before };
    // steps that run by themselves follow at once; a timed wait or a person stops the job
    const autos = [];
    let at = j.at, k = j.step + 1, guard = 0;
    while (at && guard++ < 40) {
      const st = station(at).st;
      if (k >= st.steps.length) { at = nextStation(j, at); k = 0; continue; }
      if (st.steps[k].kind !== 'run') break;
      autos.push(st.steps[k].name); entry.kinds.push('run'); k++;
    }
    if (at) { j.at = at; j.step = k; } else { j.at = main[main.length - 1].id; j.step = station(j.at).st.steps.length - 1; }
    const toSt = station(j.at).st;
    // said once, in the page's language (T() leaves words it has no entry for as they are)
    entry.then = autos.length ? T('Ran by itself: {steps}', { steps: autos.map((a) => T(a)).join(T(', ')) }) : '';
    entry.to = toSt !== fromSt ? toSt.name : '';
    done.push(entry);
    renderHead();
    renderSig(true);
    if (mine(j)) {
      // still yours: the next step opens in place
      const fresh = document.createElement('ol');
      fresh.innerHTML = jobLi(j);
      li.replaceWith(fresh.firstElementChild);
      renderDone(true);
      say(T('Done. Next for you on {title}: {step}.', { title: T(j.title), step: imperative(stepOf(j).name, j) }));
      const h = $(`[data-job="${j.code}"] .jb-panel`);
      if (h && !reduce()) h.animate([{ opacity: 0 }, { opacity: 1 }], { duration: M.quarter, easing: M.ease_arrive });
      $(`[data-job="${j.code}"] .jb-h`).focus();
      return;
    }
    // leaving: the stop travels along the strip to its next station, then the row closes up
    if (!reduce()) {
      const train = $('.train', li), to = pos(j);
      li.classList.add('leaving');
      await train.animate([{ transform: 'translate(0, 0)' }, { transform: `translate(${to[0] - fromPos[0]}px, ${to[1] - fromPos[1]}px)` }],
        { duration: M.beat, easing: M.ease_move, fill: 'forwards' }).finished.catch(() => {});
      li.style.overflow = 'hidden';
      await li.animate([{ height: `${li.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0, paddingBlock: '0px', marginBlock: '0px' }],
        { duration: M.half, easing: M.ease_leave, fill: 'forwards' }).finished.catch(() => {});
    }
    open = null;
    renderWaiting(); renderComing(); renderDone(true);
    say(entry.to ? T('{title} is handed on to {station}. You can take it back from Done today.', { title: T(j.title), station: T(entry.to) })
      : T('{title} is handed on. You can take it back from Done today.', { title: T(j.title) }));
    const next = $('.jb-h');
    (next || $('[data-back]') || $('[data-greet]')).focus({ preventScroll: true });
  }

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t || t.disabled) return;
    const li = t.closest('[data-job]'), j = li && jobs.find((x) => x.code === li.dataset.job);
    if (t.dataset.open) {
      open = open === t.dataset.open ? null : t.dataset.open;
      $$('[data-job]').forEach((el) => {
        const on = el.dataset.job === open;
        el.classList.toggle('open', on);
        $('.jb-h', el).setAttribute('aria-expanded', String(on));
        const p = $('.jb-panel', el);
        p.hidden = !on;
        if (on && !reduce()) p.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: M.quarter, easing: M.ease_arrive });
      });
      return;
    }
    if (t.hasAttribute('data-approve')) return finish(j, li);
    if (t.hasAttribute('data-finish')) {
      const boxes = $$('[data-check]', li), left = boxes.filter((b) => !b.checked).length;
      const err = $('[data-check-err]', li);
      if (left) {
        err.textContent = N(left, 'One item is not ticked yet. Tick it, or keep the job until it is true.', '{n} items are not ticked yet. Tick them, or keep the job until they are true.');
        err.hidden = false;
        boxes.find((b) => !b.checked).focus();
        return;
      }
      return finish(j, li);
    }
    if (t.hasAttribute('data-change')) {
      const f = $('[data-chg-form]', li);
      f.hidden = false; t.setAttribute('aria-expanded', 'true');
      $('[data-chg-text]', f).focus();
      return;
    }
    if (t.hasAttribute('data-chg-cancel')) {
      $('[data-chg-form]', li).hidden = true;
      const c = $('[data-change]', li); c.setAttribute('aria-expanded', 'false'); c.focus();
      return;
    }
    if (t.dataset.back) {
      // a handoff can be taken back: the job returns to you at the step you finished
      const i = done.map((d) => d.code).lastIndexOf(t.dataset.back);
      const d = done.splice(i, 1)[0];
      jobs = jobs.map((x) => (x.code === d.code ? d.undo : x));
      open = d.code;
      renderAll(); renderSig(false);
      say(T('{title} is back with you.', { title: T(d.title) }));
      $(`[data-job="${d.code}"] .jb-h`).focus();
    }
  });

  root.addEventListener('change', (e) => { if (e.target.dataset.check != null) { const err = $('[data-check-err]', e.target.closest('[data-job]')); if (err) err.hidden = true; } });

  // asking Watar for a change: the draft is held while Watar redrafts, then waits for you again
  root.addEventListener('submit', async (e) => {
    const f = e.target.closest('[data-chg-form]');
    if (!f) return;
    e.preventDefault();
    const li = f.closest('[data-job]'), j = jobs.find((x) => x.code === li.dataset.job);
    const text = $('[data-chg-text]', f).value.trim(), err = $('[data-chg-err]', f);
    if (!text) { err.textContent = T('Write what should change, in a few words.'); err.hidden = false; $('[data-chg-text]', f).focus(); return; }
    j.draft.busy = true;
    $('.jb-panel', li).innerHTML = panel(j, stepOf(j));
    const ring = $('.dr-k .g', li);
    if (ring) ring.classList.add('running');
    say(T('Watar is redrafting the quote.'));
    await new Promise((r) => setTimeout(r, reduce() ? 0 : M.beat * 2));
    j.draft.busy = false; j.draft.changed = text;
    $('.jb-panel', li).innerHTML = panel(j, stepOf(j));
    say(T('Watar’s new draft is ready. It waits for your approval.'));
    $('[data-approve]', li).focus();
  });

  // ---------- start ----------
  const org = own ? own.name : T('Sufra');
  $$('[data-org-name]').forEach((el) => { el.textContent = org; });
  const blocks = own ? own.blocks : main.map((s) => ({ name: s.name, steps: s.steps.map((x) => x.kind) }));
  Beats.sig($('[data-org-mark]'), blocks, { mode: 'mark', size: 32, name: own ? own.name : 'Sufra', label: T('{org}’s mark', { org }) });
  $('[data-me-av]').textContent = (me.name ? T(me.name) : own.name).charAt(0);
  // the name shown is translated; data-who keeps the data's English name, which the frame (app.js) reads
  const meName = $('[data-me-name]');
  meName.textContent = me.name ? T(me.name) : T('You');
  meName.dataset.who = me.name || 'You';
  $('[data-me-role]').textContent = me.access === 'owner' ? T('Owner') : me.role ? T(me.role) : '';
  document.title = `${T('Today')} · ${org}`;
  if (own) jobs = [];
  renderAll();
  renderSig(false);
  let sigW = 0;
  new ResizeObserver(() => { const w = Math.round($('[data-day-sig]').clientWidth); if (w !== sigW) { sigW = w; renderSig(false); } }).observe($('[data-day-sig]'));
  setInterval(() => renderSig(false), 6e4);
})();
