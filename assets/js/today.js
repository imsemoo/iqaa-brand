// Today: one person's station as a platform board. What waits for you now, what is coming to you, what you
// handed on. Every step you finish adds a loop to your day's signature; a job you finish leaves your station
// along its metro strip, and a handoff can be taken back.
(function () {
  const root = document.querySelector('main.td');
  if (!root || !window.IQ || !window.Beats || !window.SUFRA) return;
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
  let jobs = S.jobs.map(clone);
  const done = S.done.filter((d) => d.who === me.name).map(clone);
  let open = null;

  // ---------- reading the line ----------
  function station(id) {
    const i = main.findIndex((s) => s.id === id);
    if (i >= 0) return { st: main[i], i };
    for (const r of line.routes) {
      if (r.type !== 'branch') continue;
      const j = r.stations.findIndex((s) => s.id === id);
      if (j >= 0) return { st: r.stations[j], i: main.findIndex((s) => s.id === r.from) + 0.5, route: r, j };
    }
    return null;
  }
  const stepOf = (j) => station(j.at).st.steps[j.step];
  const mine = (j) => { const x = stepOf(j); return !!x && isPerson(x.kind) && x.who === me.name; };
  const worksAt = (st) => st.steps.some((x) => isPerson(x.kind) && x.who === me.name);

  // the station after this one for this job: a big order takes the branch, a branch rejoins the line
  function nextStation(j, id) {
    const p = station(id);
    if (p.route) return p.j + 1 < p.route.stations.length ? p.route.stations[p.j + 1].id : p.route.to;
    const br = line.routes.find((r) => r.type === 'branch' && r.from === id && j.people > r.over);
    if (br) return br.stations[0].id;
    return p.i + 1 < main.length ? main[p.i + 1].id : null;
  }
  // the steps ahead of a job, in order, as far as the end of the line
  function ahead(j) {
    const out = [];
    let at = j.at, k = j.step + 1, guard = 0;
    while (at && guard++ < 40) {
      const st = station(at).st;
      for (; k < st.steps.length; k++) out.push({ st, x: st.steps[k] });
      at = nextStation(j, at); k = 0;
    }
    return out;
  }

  // ---------- words ----------
  // "Reem checks the prices" said to Reem: "Check the prices"; "Salma prepares" says what: "Prepare the family dinner"
  function imperative(name, j) {
    if (!name.startsWith(`${me.name} `)) return name;
    const [verb, ...rest] = name.slice(me.name.length + 1).split(' ');
    const base = /(ch|sh|ss|x)es$/.test(verb) ? verb.slice(0, -2) : verb.replace(/s$/, '');
    const what = rest.length ? rest : j ? ['the', j.title.charAt(0).toLowerCase() + j.title.slice(1)] : [];
    return [base.charAt(0).toUpperCase() + base.slice(1)].concat(what).join(' ');
  }
  // what a finished step is called in Done today
  function doneName(x) {
    const w = /^Watar drafts (.+)$/.exec(x.name);
    if (w) return `Approved Watar’s draft of ${w[1]}`;
    return x.kind === 'held' ? `Approved: ${x.name}` : x.name;
  }
  function forYou(j, x) {
    if (x.kind === 'held' && /^Watar/.test(x.name)) return 'Watar drafted the quote. Check it, then approve it or ask for a change.';
    if (x.kind === 'held') return `${x.name}: it waits for your answer.`;
    return `${imperative(x.name, j)}.`;
  }
  const dayMs = 864e5;
  function when(iso) {
    const d = Math.round((new Date(iso.slice(0, 10)) - new Date(S.dayIso)) / dayMs);
    return d === 0 ? 'today' : d === 1 ? 'tomorrow' : d < 0 ? 'late' : `in ${d} days`;
  }
  // the demo day has its own clock: it opens at 09:41, after the morning's work, runs at real speed, and each
  // step you finish takes a few minutes of it
  const opened = Date.now(), START = 9 * 60 + 41;
  let worked = 0;
  const minutes = () => START + worked + Math.floor((Date.now() - opened) / 6e4);
  const now = () => { const m = minutes(); return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
  function greeting() {
    const h = Math.floor(minutes() / 60);
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }
  const glyph = (k, test) => `<span class="g" aria-hidden="true">${IQ.glyph(k, { test: !!test })}</span>`;

  // ---------- the metro strip: the line's stations, yours ringed violet, the job a filled stop ----------
  const GAP = 22, PAD = 9, Y = 9;
  const xAt = (i) => PAD + GAP * i;
  function pos(j) {
    const p = station(j.at);
    if (!p.route) return [xAt(p.i), Y];
    const a = main.findIndex((s) => s.id === p.route.from), b = main.findIndex((s) => s.id === p.route.to);
    return [xAt(a) + ((xAt(b) - xAt(a)) * (p.j + 1)) / (p.route.stations.length + 1), Y + 11];
  }
  function strip(j) {
    const w = PAD * 2 + GAP * (main.length - 1);
    let svg = `<svg class="strip" viewBox="0 0 ${w} 26" width="${w}" height="26" aria-hidden="true"><path class="tr" d="M${PAD} ${Y}H${w - PAD}"/>`;
    const p = station(j.at);
    if (p.route) {
      const a = xAt(main.findIndex((s) => s.id === p.route.from)), b = xAt(main.findIndex((s) => s.id === p.route.to));
      svg += `<path class="tr br" d="M${a} ${Y}L${a + 8} ${Y + 11}H${b - 8}L${b} ${Y}"/>`;
      if (worksAt(p.st)) { const [x, y] = pos(j); svg += `<circle class="stn me" cx="${x}" cy="${y}" r="4"/>`; }
    }
    main.forEach((st, i) => { svg += `<circle class="stn${worksAt(st) ? ' me' : ''}" cx="${xAt(i)}" cy="${Y}" r="4"/>`; });
    const [x, y] = pos(j), st = stepOf(j);
    // the stop carries the colour of the step it is on: violet for a person, ink for one that runs by itself
    return `${svg}<circle class="train${st && isPerson(st.kind) ? ' hand' : ''}" cx="${x}" cy="${y}" r="5.5"/></svg>`;
  }
  function where(j) {
    const p = station(j.at), st = p.st;
    return `At <b>${esc(st.name)}</b>${p.route ? ', on the branch for big orders' : ''} · step ${j.step + 1} of ${st.steps.length}`;
  }

  // ---------- waiting for you ----------
  function panel(j, x) {
    if (x.kind === 'held' && j.draft) {
      const d = j.draft;
      const chg = d.changed ? `<p class="dr-chg"><b>Changed as you asked:</b> “${esc(d.changed)}”</p>` : '';
      return `<div class="draft" data-draft>
<p class="dr-k">${glyph('held')}<span>Watar’s draft</span>${d.busy ? '<span class="dr-busy">Watar is redrafting…</span>' : ''}</p>
<ul>${d.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
<p>${esc(d.note)}</p>${chg}
<p class="dr-tot">Total <b>${esc(d.total)}</b> <span class="hint">from Sufra’s price list</span></p>
</div>
<div class="jb-act"><button class="btn primary" type="button" data-approve${d.busy ? ' disabled' : ''}>Approve the draft</button><button class="btn" type="button" data-change aria-expanded="false"${d.busy ? ' disabled' : ''}>Ask Watar for a change</button></div>
<form class="jb-chg" data-chg-form hidden novalidate>
<div class="field"><label for="chg-${j.code}">What should change?</label><textarea id="chg-${j.code}" rows="2" data-chg-text placeholder="For example: no nuts, and lunch at 12:00 instead."></textarea><p class="err" hidden data-chg-err></p></div>
<div class="row-act"><button class="btn" type="button" data-chg-cancel>Cancel</button><button class="btn ink" type="submit">Send to Watar</button></div>
</form>`;
    }
    const items = (x.check || ['Done as the step says']).map((t, i) => `<label class="chk"><input type="checkbox" data-check="${i}"><span>${esc(t)}</span></label>`).join('');
    const after = ahead(j);
    const autos = [];
    for (const a of after) { if (a.x.kind !== 'run') break; autos.push(a); }
    const nextP = after[autos.length];
    const then = nextP && nextP.st !== station(j.at).st
      ? `Next, ${autos.length ? `${autos.map((a) => `“${esc(a.x.name)}”`).join(' and ')} ${autos.length === 1 ? 'runs' : 'run'} by itself and ` : ''}the job moves to ${esc(nextP.st.name)}.`
      : '';
    return `<fieldset class="chk-l"><legend>Before you hand it on</legend>${items}</fieldset>
<p class="err" data-check-err hidden></p>
<div class="jb-act"><button class="btn primary" type="button" data-finish>Mark done</button></div>
<p class="hint">${then} The checklist locks when the job moves on.</p>`;
  }

  function jobLi(j) {
    const x = stepOf(j), on = open === j.code;
    return `<li class="job${on ? ' open' : ''}" data-job="${j.code}">
<div class="jb-top"><code>${j.code}</code><span>${esc(j.client)}, ${esc(j.of)}</span><span class="due">${esc(j.due)} · ${when(j.iso)}</span></div>
<h3><button type="button" class="jb-h" data-open="${j.code}" aria-expanded="${on}" aria-controls="p-${j.code}">${esc(j.title)} · ${j.people} people</button></h3>
<div class="jb-pos">${strip(j)}<p>${where(j)}</p></div>
<div class="jb-for">${glyph(x.kind)}<p><b>For you:</b> ${esc(forYou(j, x))}</p></div>
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
    $('[data-day]').textContent = S.day;
    $('[data-greet]').textContent = me.name ? `${greeting()}, ${me.name}` : greeting();
    $('[data-sum]').textContent = own ? `Welcome to ${own.name}.`
      : n ? `${n} ${n === 1 ? 'job is' : 'jobs are'} waiting for you at ${at.join(' and ')}. Start with the first.` : 'Nothing is waiting for you right now.';
  }
  // ---------- the day's rhythm: the working day as a line in time; each finished step is written at its hour ----------
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  function renderSig(write) {
    const el = $('[data-day-sig]');
    const W = Math.max(280, Math.round(el.clientWidth)), narrow = W < 640;
    const from = 8 * 60, to = (narrow ? 14 : 18) * 60, H = 88, base = 54, k = narrow ? 0.7 : 1;
    const x = (m) => 12 + ((Math.min(Math.max(m, from), to) - from) / (to - from)) * (W - 24);
    const pal = window.IQAA.pal.light;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><path class="day" d="M${x(from)} ${base}H${x(to)}"/>`;
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
    svg += `${marks}${ahead}<path class="now" d="M${nx} 18V${base + 12}"/><text class="nl" x="${lx}" y="12" text-anchor="middle">Now ${now()}</text></svg>`;
    el.innerHTML = svg;
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', `${done.length ? `Your day so far: ${done.map((d) => `${d.time}, ${d.step}`).join('; ')}.` : 'Your day has not started yet.'} ${todo.flat().length} steps still yours today.`);
    const steps = done.length, left = todo.flat().length;
    $('[data-day-cap]').textContent = `${steps ? `${steps} done, each at its hour` : 'Nothing done yet'}${left ? `; ${left} still yours, in grey ahead of now` : ''}.`;
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
        ? `<p>Jobs appear here when your team adds an order. Until then, try your line with a test job.</p><a class="btn" href="line.html">Open the line</a>`
        : `<p><b>Your station is clear.</b></p><p class="hint">${c ? `Next: ${esc(c.j.title)} (<code>${c.j.code}</code>) reaches you at ${esc(c.at.name)}.` : 'No job is heading your way yet.'}</p><a class="btn" href="line.html">See the whole line</a>`;
    }
  }
  function renderComing() {
    const c = own ? [] : coming();
    $('[data-coming]').innerHTML = c.length ? c.map(({ j, at }) => {
      const x = stepOf(j), p = station(j.at);
      return `<li class="mn"><div class="mn-t"><code>${j.code}</code><b>${esc(j.title)}</b><span class="hint">${j.people} people</span></div>
<div class="mn-pos">${strip(j)}</div>
<p class="mn-now">${glyph(x.kind)}<span>Now at ${esc(p.st.name)}: ${esc(x.name)}. Reaches you at <b>${esc(at.name)}</b>.</span></p></li>`;
    }).join('') : '<li class="mn none">No job is heading your way yet.</li>';
  }
  function renderDone(fresh) {
    // only a job's latest step can be taken back: earlier ones are what the latest was built on
    const latest = {};
    done.forEach((d, i) => { latest[d.code] = i; });
    $('[data-done]').innerHTML = done.length ? done.slice().reverse().map((d, i) => `<li class="mn dn${fresh && i === 0 ? ' fresh' : ''}">
<p class="dn-t"><time>${d.time}</time>${glyph('struck')}<span><b>${esc(d.step)}</b> · ${esc(d.title)} <code>${d.code}</code></span></p>
${d.then || d.to ? `<p class="hint dn-n">${esc([d.then, d.to ? `Handed on to ${d.to}` : ''].filter(Boolean).join('. '))}.</p>` : ''}
${d.undo && latest[d.code] === done.length - 1 - i ? `<button class="link" type="button" data-back="${d.code}">Take it back</button>` : ''}
</li>`).join('') : '<li class="mn none">Nothing yet. Each step you finish lands here.</li>';
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
    const entry = { who: me.name, code: j.code, title: j.title, step: doneName(x), time: now(), kinds: ['struck'], undo: before };
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
    entry.then = autos.length ? `Ran by itself: ${autos.join(', ')}` : '';
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
      say(`Done. Next for you on ${j.title}: ${imperative(stepOf(j).name, j)}.`);
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
    say(`${j.title} is handed on${entry.to ? ` to ${entry.to}` : ''}. You can take it back from Done today.`);
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
        err.textContent = left === 1 ? 'One item is not ticked yet. Tick it, or keep the job until it is true.' : `${left} items are not ticked yet. Tick them, or keep the job until they are true.`;
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
      say(`${d.title} is back with you.`);
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
    if (!text) { err.textContent = 'Write what should change, in a few words.'; err.hidden = false; $('[data-chg-text]', f).focus(); return; }
    j.draft.busy = true;
    $('.jb-panel', li).innerHTML = panel(j, stepOf(j));
    const ring = $('.dr-k .g', li);
    if (ring) ring.classList.add('running');
    say('Watar is redrafting the quote.');
    await new Promise((r) => setTimeout(r, reduce() ? 0 : M.beat * 2));
    j.draft.busy = false; j.draft.changed = text;
    $('.jb-panel', li).innerHTML = panel(j, stepOf(j));
    say('Watar’s new draft is ready. It waits for your approval.');
    $('[data-approve]', li).focus();
  });

  // ---------- start ----------
  $$('[data-org-name]').forEach((el) => { el.textContent = own ? own.name : 'Sufra'; });
  const blocks = own ? own.blocks : main.map((s) => ({ name: s.name, steps: s.steps.map((x) => x.kind) }));
  Beats.sig($('[data-org-mark]'), blocks, { mode: 'mark', size: 32, name: own ? own.name : 'Sufra', label: `${own ? own.name : 'Sufra'}’s mark` });
  $('[data-me-av]').textContent = (me.name || own.name).charAt(0);
  $('[data-me-sr]').textContent = me.name ? `Signed in as ${me.name}, ${me.role.toLowerCase()}` : 'Signed in';
  document.title = `Today · ${own ? own.name : 'Sufra'}`;
  if (own) jobs = [];
  renderAll();
  renderSig(false);
  let sigW = 0;
  new ResizeObserver(() => { const w = Math.round($('[data-day-sig]').clientWidth); if (w !== sigW) { sigW = w; renderSig(false); } }).observe($('[data-day-sig]'));
  setInterval(() => renderSig(false), 6e4);
})();
