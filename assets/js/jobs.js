// Reading jobs on a line: where a job stands, where it goes next, the route it takes, and its metro strip; the demo's
// clock and the words for time; the line's reminder and the risk it carries; and what passed between Sufra and each
// client. Shared by Today, Orders, the order page, Overview, Clients and Ask Watar, so every screen agrees on every
// job, every time and every client.
(function () {
  const isPerson = (k) => k === 'held' || k === 'struck';
  // the line's reminder: the timed wait for the client's answer and the reminder after it
  const CHASE = new Set(['Wait two days', 'Remind the client']);
  // the hours of each length a timed wait can have, as the Line screen offers them
  const REST_H = { 'An hour': 1, 'A day': 24, 'Two days': 48, 'Three days': 72, 'A week': 168 };

  // ---------- words in the page's language (i18n.js): the data stays English, sentences are translated whole ----------
  const T = window.T, N = window.I18N.n, LANG = window.I18N.lang;
  // a timed wait said three ways, each a whole phrase so Arabic can decline its number ('ينتظر يومين')
  const WAITS = { 'An hour': 'Waits an hour', 'A day': 'Waits a day', 'Two days': 'Waits two days', 'Three days': 'Waits three days', 'A week': 'Waits a week' };
  const WAIT_OF = { 'An hour': 'a timed wait of an hour', 'A day': 'a timed wait of a day', 'Two days': 'a timed wait of two days', 'Three days': 'a timed wait of three days', 'A week': 'a timed wait of a week' };
  const WAIT_IS = { 'An hour': 'A timed wait: an hour', 'A day': 'A timed wait: a day', 'Two days': 'A timed wait: two days', 'Three days': 'A timed wait: three days', 'A week': 'A timed wait: a week' };
  const rest = (who, form) => T((form === 'of' ? WAIT_OF : form === 'is' ? WAIT_IS : WAITS)[who]
    || `${form === 'of' ? 'a timed wait of ' : form === 'is' ? 'A timed wait: ' : 'Waits '}${who.toLowerCase()}`);
  // a name with its Turkish case endings, by vowel harmony (Omar’a, Maha’nın, Yusuf’un); other languages need none.
  // named('C', 'Omar') gives { C, C_dat, C_gen, C_acc, C_loc, C_abl } for a sentence's {C} and its Turkish forms
  const VOW = 'aıoueiöü';
  function ending(name, kind) {
    const w = name.toLocaleLowerCase('tr').replace(/[^a-zçğıöşü]+$/, ''), v = [...w].reverse().find((ch) => VOW.includes(ch)) || 'e', open = VOW.includes(w.slice(-1));
    const two = 'aıou'.includes(v) ? 'a' : 'e', four = { a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' }[v], hard = /[çfhkpsşt]$/.test(w);
    return `${name}’${{ dat: `${open ? 'y' : ''}${two}`, gen: `${open ? 'n' : ''}${four}n`, acc: `${open ? 'y' : ''}${four}`, loc: `${hard ? 't' : 'd'}${two}`, abl: `${hard ? 't' : 'd'}${two}n` }[kind]}`;
  }
  function named(k, name) {
    const n = T(name), o = { [k]: n };
    ['dat', 'gen', 'acc', 'loc', 'abl'].forEach((c) => { o[`${k}_${c}`] = LANG === 'tr' ? ending(n, c) : n; });
    return o;
  }
  // a title inside a sentence: English lowers its first letter ('the office lunch'), Turkish too unless it starts with a
  // name ('Nakhla için…'); Arabic has no case
  function lcT(s) {
    if (LANG === 'en') return s.charAt(0).toLowerCase() + s.slice(1);
    const t = T(s);
    return LANG === 'tr' && !s.split(' ').includes(t.split(' ')[0]) ? t.charAt(0).toLocaleLowerCase('tr') + t.slice(1) : t;
  }
  const capL = (t) => t.charAt(0).toLocaleUpperCase(LANG) + t.slice(1);
  // a list as a sentence says it: 'a, b and c' ('أ، ب وج', 'a, b ve c')
  const listOf = (a) => (a.length < 2 ? a.join('') : T('{a} and {b}', { a: a.slice(0, -1).join(T(', ')), b: a[a.length - 1] }));

  function on(line) {
    const main = line.stations;
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
    const stepOf = (j) => (j.finished ? null : station(j.at).st.steps[j.step]);
    // the station after this one for this job: a big order takes the branch, a branch rejoins the line
    function nextStation(j, id) {
      const p = station(id);
      if (p.route) return p.j + 1 < p.route.stations.length ? p.route.stations[p.j + 1].id : p.route.to;
      const br = line.routes.find((r) => r.type === 'branch' && r.from === id && j.people > r.over);
      if (br) return br.stations[0].id;
      return p.i + 1 < main.length ? main[p.i + 1].id : null;
    }
    // every station this job walks, start to end, in order
    function route(j) {
      const out = [];
      let at = main[0].id, guard = 0;
      while (at && guard++ < 40) { out.push(station(at).st); at = nextStation(j, at); }
      return out;
    }
    // the steps ahead of a job, in order, as far as the end of the line
    function ahead(j) {
      if (j.finished) return [];
      const out = [];
      let at = j.at, k = j.step + 1, guard = 0;
      while (at && guard++ < 40) {
        const st = station(at).st;
        for (; k < st.steps.length; k++) out.push({ st, x: st.steps[k] });
        at = nextStation(j, at); k = 0;
      }
      return out;
    }

    // the metro strip: the line's stations, the ones `ring(st)` names ringed violet, the job a filled stop
    const GAP = 22, PAD = 9, Y = 9;
    const xAt = (i) => PAD + GAP * i;
    function pos(j) {
      if (j.finished) return [xAt(main.length - 1), Y];
      const p = station(j.at);
      if (!p.route) return [xAt(p.i), Y];
      const a = main.findIndex((s) => s.id === p.route.from), b = main.findIndex((s) => s.id === p.route.to);
      return [xAt(a) + ((xAt(b) - xAt(a)) * (p.j + 1)) / (p.route.stations.length + 1), Y + 11];
    }
    function strip(j, ring) {
      const mine = ring || (() => false);
      const w = PAD * 2 + GAP * (main.length - 1);
      let svg = `<svg class="strip flow" viewBox="0 0 ${w} 26" width="${w}" height="26" aria-hidden="true"><path class="tr" d="M${PAD} ${Y}H${w - PAD}"/>`;
      const p = j.finished ? null : station(j.at);
      if (p && p.route) {
        const a = xAt(main.findIndex((s) => s.id === p.route.from)), b = xAt(main.findIndex((s) => s.id === p.route.to));
        svg += `<path class="tr br" d="M${a} ${Y}L${a + 8} ${Y + 11}H${b - 8}L${b} ${Y}"/>`;
        if (mine(p.st)) { const [x, y] = pos(j); svg += `<circle class="stn me" cx="${x}" cy="${y}" r="4"/>`; }
      }
      main.forEach((st, i) => { svg += `<circle class="stn${mine(st) ? ' me' : ''}" cx="${xAt(i)}" cy="${Y}" r="4"/>`; });
      const [x, y] = pos(j), st = stepOf(j);
      // the stop carries the colour of the step it is on: violet for a person, ink for one that runs by itself
      const cls = j.finished ? ' done' : st && isPerson(st.kind) ? ' hand' : '';
      return `${svg}<circle class="train${cls}" cx="${x}" cy="${y}" r="5.5"/></svg>`;
    }
    // the strip without a train: where a person holds the line (Settings' team). Their stations ringed violet; a
    // branch's dip only when one of its stations is ringed, with that station in it
    function reach(ring) {
      const w = PAD * 2 + GAP * (main.length - 1);
      let svg = `<svg class="strip flow" viewBox="0 0 ${w} 26" width="${w}" height="26" aria-hidden="true"><path class="tr" d="M${PAD} ${Y}H${w - PAD}"/>`;
      line.routes.filter((r) => r.type === 'branch').forEach((r) => {
        const on = r.stations.map((st, j) => (ring(st) ? j : -1)).filter((j) => j >= 0);
        if (!on.length) return;
        const a = xAt(main.findIndex((s) => s.id === r.from)), b = xAt(main.findIndex((s) => s.id === r.to)), n = r.stations.length;
        svg += `<path class="tr br" d="M${a} ${Y}L${a + 8} ${Y + 11}H${b - 8}L${b} ${Y}"/>`;
        on.forEach((j) => { svg += `<circle class="stn me" cx="${a + ((b - a) * (j + 1)) / (n + 1)}" cy="${Y + 11}" r="4"/>`; });
      });
      main.forEach((st, i) => { svg += `<circle class="stn${ring(st) ? ' me' : ''}" cx="${xAt(i)}" cy="${Y}" r="4"/>`; });
      return `${svg}</svg>`;
    }

    return { line, main, station, stepOf, nextStation, route, ahead, pos, strip, reach };
  }

  // ---------- views shared by every screen: the clock, words for time, who a job waits on, a row, the load map ----------
  function views(J, S) {
    const esc = window.Beats.esc, dayMs = 864e5, main = J.main, line = J.line;
    const days = (iso) => Math.round((new Date(iso.slice(0, 10)) - new Date(S.dayIso)) / dayMs);

    // The demo's clock. Every demo time is a wall-clock string with no zone ('2026-11-01T08:52'); it is read as UTC
    // and printed from fixed names, so a page shows the same time on any computer. Local parsing would shift a time
    // across a daylight-saving change (Cairo, 30 Oct), and toLocaleString prints 'Sept' in en-GB.
    // Every helper takes such a string, a Date or milliseconds.
    const MIN = 6e4, HOUR = 36e5;
    const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const pad = (v) => String(v).padStart(2, '0');
    const U = (t) => (t instanceof Date ? t : new Date(typeof t === 'number' ? t : `${t}Z`));
    const ms = (t) => U(t).getTime();
    const hm = (t) => { const d = U(t); return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`; };       // '08:52'
    // dates are written in the page's language from these names (i18n.js): 'Tue 1 Sep', 'الثلاثاء 1 سبتمبر', '1 Eyl Sal';
    // the English names stay the data's own (fromLabel reads them)
    const T = window.T, N = window.I18N.n;
    const day = (t) => { const d = U(t); return T('{wd} {d} {mon}', { wd: T(DAY[d.getUTCDay()]), d: d.getUTCDate(), mon: T(MON[d.getUTCMonth()]) }); };
    const label = (t) => T('{day}, {time}', { day: day(t), time: hm(t) });                                    // 'Tue 1 Sep, 08:30'
    const iso = (t) => U(t).toISOString().slice(0, 16);                                                      // for <time datetime>
    const at = (t) => (iso(t).slice(0, 10) === S.dayIso ? hm(t) : label(t));                                 // today: the time alone
    // the data keeps its dates as English labels (j.due, j.finished): a screen shows them through these, in its language
    const due = (j) => label(j.iso);
    const fin = (j) => (j.finished ? label(fromLabel(j.finished)) : '');
    // a finished label ('Thu 29 Oct, 16:40') back to a time, in the demo year
    const fromLabel = (s) => { const [, d, m, t] = /(\d+) (\w+), (\d\d:\d\d)/.exec(s); return ms(`2026-${pad(MON.indexOf(m) + 1)}-${pad(d)}T${t}`); };
    // the clock on the wall: the demo's now, plus the whole minutes since the page opened, as Today counts them
    const loaded = Date.now();
    const now = () => ms(S.now) + Math.floor((Date.now() - loaded) / MIN) * MIN;
    // a span in words, as sentences say it: '49 min', '2 hours 40 min', '2 days 22 hours' (hours to the nearest hour)
    function words(span) {
      const m = Math.round(span / MIN), min = (v) => N(v, '{n} min', '{n} min'), hour = (v) => N(v, '{n} hour', '{n} hours'), both = (a, b) => T('{a} {b}', { a, b });
      if (m < 60) return min(m);
      if (m < 1440) return m % 60 ? both(hour(Math.floor(m / 60)), min(m % 60)) : hour(Math.floor(m / 60));
      let d = Math.floor(m / 1440), h = Math.round((m % 1440) / 60);
      if (h === 24) { d += 1; h = 0; }
      return h ? both(N(d, '{n} day', '{n} days'), hour(h)) : N(d, '{n} day', '{n} days');
    }

    // The shared clock: every step of a job's route in order, with its state (done, now, next; 'skip' for the line's
    // reminder when the answer came first) and, for a done step, the time it happened (t, in ms).
    // 1. Fixed points: the first step when the order came in; the quote link when the first quote went out; the
    //    approval at the last answer; the wait and the reminder when the line reminded; the delivery when Yusuf
    //    arrived; each step done this morning (S.done) at its time, with the run steps it set off; a finished job's
    //    last step when it finished.
    // 2. A person's step right before a timed run step takes that time; the kitchen's reminder opens the day before
    //    the event and the arrival time goes on its morning. A step that runs by itself, right after a timed one,
    //    takes the latest time so far (skipped steps between), and after a spread one, that step's time.
    // 3. Every other done step is spread over working hours (S.hours, 08:00 to 18:00) between the latest time before
    //    it and the next time after it (now, for a job still on the line), on the quarter hour.
    const hourOf = (t) => { const [h, m] = t.split(':').map(Number); return h * HOUR + m * MIN; };
    const OPEN = hourOf(S.hours.open), CLOSE = hourOf(S.hours.close);
    function clock(j) {
      const steps = [];
      J.route(j).forEach((st) => st.steps.forEach((x, k) => steps.push({ st, x, k, i: steps.length })));
      const nowAt = j.finished ? steps.length : steps.findIndex((s) => s.st.id === j.at && s.k === j.step);
      const log = j.log || {}, rounds = log.rounds || [], last = rounds[rounds.length - 1];
      const reminded = rounds.find((r) => r.reminded), answered = !!(last && last.answer);
      steps.forEach((s, i) => {
        s.state = i < nowAt ? 'done' : i === nowAt ? 'now' : 'next';
        if (s.state === 'done' && CHASE.has(s.x.name) && answered && !reminded) s.state = 'skip';
        s.t = null;
      });
      const fix = (name, t) => { const s = steps.find((y) => y.x.name === name); if (s && t && s.state === 'done') s.t = ms(t); };
      if (j.opened && steps[0].state === 'done') steps[0].t = ms(j.opened);
      if (rounds.length) fix('Send the quote link', rounds[0].sent);
      if (answered) fix('The client approves', last.answer);
      if (reminded) { fix('Wait two days', reminded.reminded); fix('Remind the client', reminded.reminded); }
      fix('Yusuf delivers', log.arrived);
      S.done.filter((d) => d.code === j.code).forEach((d) => {
        const i = steps.findIndex((y) => y.x.name === d.step);
        if (i >= 0) d.kinds.forEach((_, n) => { const s = steps[i + n]; if (s && s.state === 'done') s.t = ms(`${S.dayIso}T${d.time}`); });
      });
      if (j.finished) steps[steps.length - 1].t = fromLabel(j.finished);
      // a person's step that set off a timed run step (the prices checked, the quote link out) was done at that time
      for (let i = steps.length - 2; i >= 0; i--) {
        const s = steps[i], nx = steps[i + 1];
        if (s.state === 'done' && s.t == null && isPerson(s.x.kind) && nx.state === 'done' && nx.x.kind === 'run' && nx.t != null) s.t = nx.t;
      }
      // steps the line itself times by the event: the kitchen's reminder opens the day before, the arrival time goes on
      // the event's morning; never before a time already written, never after now
      const ev = ms(j.iso), evDay = Math.floor(ev / dayMs) * dayMs;
      const PIN = { 'Remind the kitchen a day before': evDay - dayMs + OPEN, 'Send the arrival time': Math.min(evDay + OPEN + HOUR, ev - 30 * MIN) };
      // a run step goes off with the timed step before it
      let latest = -Infinity, prev = null;
      steps.forEach((s) => {
        if (s.state !== 'done') return;
        if (s.t == null && PIN[s.x.name] != null) s.t = Math.min(Math.max(PIN[s.x.name], latest), j.finished ? Infinity : ms(S.now));
        if (s.t == null && s.x.kind === 'run' && prev && prev.t != null) s.t = latest;
        if (s.t != null) latest = Math.max(latest, s.t);
        prev = s;
      });
      // the rest is spread over the working hours between the times around it; a run step right after a done step
      // takes no share of its own: it goes off with that step
      const follows = (n) => n > 0 && steps[n].x.kind === 'run' && steps[n - 1].state === 'done';
      const end = j.finished ? null : ms(S.now);
      for (let i = 0; i < steps.length; i++) {
        if (steps[i].state !== 'done' || steps[i].t != null) continue;
        const gap = [];
        let n = i;
        for (; n < steps.length && (steps[n].state === 'skip' || (steps[n].state === 'done' && steps[n].t == null)); n++) if (steps[n].state === 'done' && !follows(n)) gap.push(steps[n]);
        const from = Math.max(...steps.slice(0, i).filter((y) => y.t != null).map((y) => y.t), j.opened ? ms(j.opened) : ms(S.now));
        const nextT = steps.slice(n).find((y) => y.t != null);
        const to = Math.max(from, nextT ? nextT.t : end != null ? end : from);
        const hours = [];
        for (let d = Math.floor(from / dayMs) * dayMs; d < to; d += dayMs) {
          const a = Math.max(d + OPEN, from), b = Math.min(d + CLOSE, to);
          if (b > a) hours.push([a, b]);
        }
        const worked = hours.reduce((v, [a, b]) => v + (b - a), 0);
        gap.forEach((s, g) => {
          let left = (worked * (g + 1)) / (gap.length + 1), t = worked ? from : from + ((to - from) * (g + 1)) / (gap.length + 1);
          for (const [a, b] of hours) { if (left <= b - a) { t = a + left; break; } left -= b - a; t = b; }
          s.t = Math.min(Math.max(Math.round(t / (15 * MIN)) * 15 * MIN, from), to);
        });
        i = n - 1;
      }
      steps.forEach((s, i) => { if (s.state === 'done' && s.t == null && i) s.t = steps[i - 1].t; });
      return steps;
    }
    function when(iso) {
      const d = days(iso);
      return d === 0 ? T('today') : d === 1 ? T('tomorrow') : d < 0 ? N(-d, '{n} day ago', '{n} days ago') : N(d, 'in {n} day', 'in {n} days');
    }
    const glyph = (k) => `<span class="g" aria-hidden="true">${window.IQ.glyph(k)}</span>`;
    // the client as the line addresses them: the first name, as on Clients (Dr Nadia keeps her title)
    const short = (j) => (/^Dr /.test(j.client) ? j.client : j.client.split(' ')[0]);
    // who or what the job is waiting on now, in words
    function waitingOn(j) {
      const x = J.stepOf(j);
      if (!x) return { html: `<span class="ow-t">${esc(T('Finished {date}', { date: fin(j) }))}</span>`, text: T('finished {date}', { date: fin(j) }) };
      if (isPerson(x.kind) && x.who === 'The client') return { html: `${glyph(x.kind)}<span class="ow-t">${esc(T('Waiting for {name}', { name: T(short(j)) }))}</span>`, text: T('waiting for {name}', { name: T(short(j)) }) };
      if (isPerson(x.kind)) return { html: `<span class="av" aria-hidden="true">${esc(T(x.who).charAt(0))}</span><span class="ow-t">${esc(T(x.who))}</span>`, text: T('with {name}', { name: T(x.who) }) };
      if (x.kind === 'rest') return { html: `${glyph('rest')}<span class="ow-t">${esc(rest(x.who))}</span>`, text: rest(x.who, 'of') };
      return { html: `${glyph('run')}<span class="ow-t">${T('Runs by itself')}</span>`, text: T('running by itself') };
    }
    // who the job is for and its size: 'Maha, Nakhla Co. · 40 people'
    const forWhom = (j) => `${esc(T('{client}, {of}', { client: T(j.client), of: T(j.of) }))} · ${N(j.people, '{n} person', '{n} people')}`;
    function row(j) {
      const p = j.finished ? null : J.station(j.at), x = J.stepOf(j), w = waitingOn(j);
      const where = j.finished ? T('Walked the whole line') : T('At {station} · {step}', { station: `<b>${esc(T(p.st.name))}</b>`, step: esc(T(x.name)) });
      const soon = !j.finished && !delivered(j) && days(j.iso) <= 1;
      const said = j.finished ? T('{title}, {code}, for {client}. Finished. Due {due}.', { title: T(j.title), code: j.code, client: T(j.client), due: due(j) })
        : T('{title}, {code}, for {client}. At {station}, {waiting}. Due {due}.', { title: T(j.title), code: j.code, client: T(j.client), station: T(p.st.name), waiting: w.text, due: due(j) });
      return `<li><a class="or-row" href="order.html?code=${j.code}" aria-label="${esc(said)}">
<span class="or-t"><code>${j.code}</code><b>${esc(T(j.title))}</b><span>${forWhom(j)}</span></span>
<span class="or-pos">${J.strip(j)}<span>${where}</span></span>
<span class="or-due${soon ? ' soon' : ''}"><b>${esc(due(j))}</b><span>${when(j.iso)}</span></span>
<span class="or-who">${w.html}</span>
</a></li>`;
    }
    // the line with a count over every station; `at` is the station pressed, if any
    function loadMap(jobs, at) {
      const branch = line.routes.find((r) => r.type === 'branch');
      const n = main.length, xp = (i) => ((i + 0.5) / n) * 100;
      const stations = main.map((s, i) => ({ s, x: xp(i), y: 0 }));
      let dip = '';
      if (branch) {
        const a = main.findIndex((s) => s.id === branch.from), b = main.findIndex((s) => s.id === branch.to);
        branch.stations.forEach((s, k) => stations.push({ s, x: xp(a) + ((xp(b) - xp(a)) * (k + 1)) / (branch.stations.length + 1), y: 1 }));
        dip = `<path class="br" d="M${xp(a)} 12L${xp(a) + 4} 52H${xp(b) - 4}L${xp(b)} 12"/>`;
      }
      const count = (id) => jobs.filter((j) => !j.finished && j.at === id).length;
      // the track is a drawing of order: it runs right to left in Arabic, as the stations placed from the inline start do
      const track = `<svg class="om-track flow" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true"><path d="M${xp(0)} 12H${xp(n - 1)}"/>${dip}</svg>`;
      return `<div class="om-in">${track}${stations.map(({ s, x, y }) => {
        const c = count(s.id), on = at === s.id;
        return `<button type="button" class="om-st${y ? ' br' : ''}${on ? ' on' : ''}${c ? '' : ' none'}" style="--x:${x.toFixed(2)}" data-at="${s.id}" aria-pressed="${on}" aria-label="${esc(T('{station}: {jobs}', { station: T(s.name), jobs: N(c, '{n} job', '{n} jobs') }))}">
<span class="om-n">${c}</span><span class="om-dot" aria-hidden="true"></span><span class="om-name">${esc(T(s.name))}</span></button>`;
      }).join('')}</div>`;
    }

    // ---------- due, late and the risk the line carries ----------
    // past Deliver only the paperwork is left, so the event's date no longer makes a job due or late
    const idx = (id) => main.findIndex((s) => s.id === id);
    const delivered = (j) => !j.finished && idx(j.at) > idx('deliver');
    const late = (j) => !j.finished && days(j.iso) < 0 && !delivered(j);
    const restHours = (who) => REST_H[who] || 0;
    // a job as a compact row, the date first because that is what the owner scans for (Overview's Needs attention)
    function dueRow(j) {
      const p = J.station(j.at), w = waitingOn(j), d = days(j.iso), time = hm(j.iso), isLate = late(j);
      const dd = d < 0 ? day(j.iso) : capL(when(j.iso));
      const v = { title: T(j.title), client: T(j.client), due: due(j), station: T(p.st.name), waiting: w.text };
      const said = isLate ? T('{title} for {client}, due {due}, late. At {station}, {waiting}.', v) : T('{title} for {client}, due {due}. At {station}, {waiting}.', v);
      return `<li><a class="at${isLate ? ' late' : ''}" href="order.html?code=${j.code}" aria-label="${esc(said)}">
<span class="at-d"><b>${esc(dd)}</b><time>${esc(time)}</time></span>
<span class="at-t"><b>${esc(T(j.title))}</b><span>${forWhom(j)}</span></span>
<span class="at-p"><span class="at-st">${T('At {station}', { station: `<b>${esc(T(p.st.name))}</b>` })}</span><span class="or-who">${w.html}</span></span></a></li>`;
    }
    // the station where the line waits for the client's answer, then reminds them (Sufra's Client approval)
    const gate = main.concat(...line.routes.filter((r) => r.type === 'branch').map((r) => r.stations))
      .find((s) => s.steps.some((x) => x.who === 'The client') && s.steps.some((x) => x.kind === 'rest'));
    // The line's reminder for a job that has not passed that station: the quote link went (the open round) or, still
    // ahead, would go at t; the timed wait runs; then the line reminds the client. null once the job is past it.
    function chase(j, t) {
      if (j.finished || !gate || delivered(j)) return null;
      const route = J.route(j), g = route.indexOf(gate), here = route.findIndex((s) => s.id === j.at);
      if (g < 0 || here > g) return null;
      const wait = gate.steps.find((x) => x.kind === 'rest'), hours = restHours(wait.who);
      const open = ((j.log || {}).rounds || []).find((r) => !r.answer), gone = here === g && !!open;
      const linkAt = gone ? ms(open.sent) : t == null ? now() : t;
      return { st: gate, wait, hours, gone, linkAt, remindAt: linkAt + hours * HOUR, ev: ms(j.iso) };
    }
    // At risk: the line's own reminder would reach the client after the event, or the timed waits still ahead, added
    // to t, would end after it. Nothing has gone wrong yet; it is what the line would do if nobody acts.
    function risk(j, t) {
      const at = t == null ? now() : t, c = chase(j, at);
      if (c && c.remindAt > c.ev) return Object.assign({ why: 'reminder' }, c);
      if (j.finished || delivered(j)) return null;
      const x = J.stepOf(j), here = x.kind === 'rest' ? restHours(x.who) : 0;
      const hours = here + J.ahead(j).filter((a) => a.x.kind === 'rest' && a.st !== gate).reduce((v, a) => v + restHours(a.x.who), 0);
      return at + hours * HOUR > ms(j.iso) ? { why: 'waits', hours, ev: ms(j.iso) } : null;
    }
    // the words a step sends, written in for one order with Build's variables: the client's short name ('Dr Nadia'
    // stays whole), the order in a sentence, its people and due time, and the client's link
    // A message is written in the language of its words: the line's own English text (what the client receives, in
    // Sufra's client language) gets the data as it is; a translated text gets the names, title and date in its language.
    function fill(msg, j) {
      const n = j.client, local = LANG !== 'en' && /[؀-ۿçğıöşüÇĞİÖŞÜ]/.test(msg);
      const first = /^Dr /.test(n) ? n : n.split(' ')[0];
      return msg.replace(/\{client\.name\}/g, local ? T(first) : first)
        .replace(/\{order\.title\}/g, local ? lcT(j.title) : j.title.charAt(0).toLowerCase() + j.title.slice(1))
        .replace(/\{order\.people\}/g, String(j.people))
        .replace(/\{order\.due\}/g, local ? due(j) : j.due)
        .replace(/\{quote\.link\}/g, `sufra.iqaa.app/q/${j.code.slice(-4)}`);
    }
    // a span as a sentence says it, rounded down to what matters: '4 days and 3 hours', '20 hours', 'an hour and 11
    // minutes'; words() is the compact form for rows and steps
    function span(v) {
      const m = Math.floor(Math.abs(v) / MIN), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
      const dW = (k) => N(k, '{n} day', '{n} days'), hW = (k) => N(k, '{n} hour', '{n} hours'), mW = (k) => N(k, '{n} minute', '{n} minutes');
      const and = (a, b) => T('{a} and {b}', { a, b });
      if (d >= 7) return dW(d);
      if (d >= 1) { const a = d === 1 ? T('a day') : dW(d); return h ? and(a, h === 1 ? T('an hour') : hW(h)) : a; }
      if (h >= 2) return hW(h);
      if (h === 1) return mm ? and(T('an hour'), mW(mm)) : T('an hour');
      return mW(mm);
    }

    // The job's line written in time, as the order page draws it: one stroke; what is done is real, the pen stands
    // where the job is, and what is ahead is in the dashed grey pen. A step the line did not need is left out, and a
    // delivery that arrived late is the failed snap. Returns the svg and its caption.
    // when the job reached the step it is on: the last time written before it, or, for a job a client's change sent
    // back to Quote by the line's way back, the moment the client answered
    function since(j) {
      const r = j.log && j.log.rounds, last = r && r[r.length - 1];
      if (last && last.change && last.answer && !j.finished && j.at === 'quote' && j.step === 0) return ms(last.answer);
      const s = clock(j), n = s.findIndex((x) => x.state === 'now');
      const p = s.slice(0, n < 0 ? s.length : n).filter((x) => x.t != null).pop();
      return p ? p.t : null;
    }
    function journey(j) {
      const steps = clock(j), pal = window.IQAA.pal.light, k = 1, cur = J.stepOf(j);
      const nowAt = j.finished ? steps.length : steps.findIndex((s) => s.state === 'now');
      const arrived = j.log && j.log.arrived, lateBy = arrived ? Math.round((ms(arrived) - ms(j.iso)) / MIN) : 0;
      const kindOf = (s) => (s.x.name === 'Yusuf delivers' && lateBy > 0 && s.state === 'done' ? 'failed' : s.x.kind);
      // steps the line did not need are not counted
      const nDone = steps.filter((s) => s.state === 'done').length, nDrawn = steps.filter((s) => s.state !== 'skip').length;
      let x = 0, svg = '', names = '', last = null, nowX = null, row = 0;
      steps.forEach((s, i) => {
        if (s.state === 'skip') return;
        if (last && last !== s.st) {
          // the handoff between stations is drawn as the next step will be: real once the job has crossed it
          const done = i <= nowAt;
          svg += `<path d="M${x} 0h${window.IQ.HANDOFF}" fill="none" stroke="${done ? pal.run : pal.test}" stroke-width="3.2" stroke-linecap="round"${done ? '' : ' stroke-dasharray="4.5 4.5"'}/>`;
          x += window.IQ.HANDOFF;
        }
        if (last !== s.st) { names += `<text x="${x}" y="${20 + (row % 2) * 10}" font-size="7.5" fill="#4F4D63" font-family="Atkinson Hyperlegible Next, sans-serif">${esc(T(s.st.name))}</text>`; row++; }
        if (i === nowAt) nowX = x;
        svg += window.IQ.cell(kindOf(s), x, 0, pal, k, s.state === 'next');
        x += window.IQ.WIDTH[s.x.kind];
        last = s.st;
      });
      if (nowX == null) nowX = x;
      // 'Now' in the mono face; a word in Arabic letters falls through to the text face (Atkinson's name carries them)
      const nowMark = j.finished ? '' : `<path d="M${nowX + 12} -40V14" stroke="#19172E" stroke-width="1" stroke-dasharray="2 3"/><text x="${nowX + 12}" y="-44" text-anchor="middle" font-size="8" fill="#19172E" font-family="Fragment Mono, Atkinson Hyperlegible Next, monospace">${esc(T('Now'))}</text>`;
      const said = T('{title}: {done} of {total} steps done', { title: T(j.title), done: nDone, total: nDrawn }) + (j.finished ? '' : T('; now {step}', { step: T(cur.name) }));
      // a drawing of time: class flow runs it right to left in Arabic; its words keep the drawing's own direction, so a
      // name starts at its station (an inherited rtl would anchor it the other way)
      return {
        svg: `<svg class="flow" direction="ltr" viewBox="-6 -54 ${x + 12} ${54 + 34}" role="img" aria-label="${esc(said)}">${svg}${nowMark}${names}</svg>`,
        cap: j.finished ? N(nDrawn, 'All {n} steps written', 'All {n} steps written') : T('{done} of {total} steps done; the rest waits ahead in grey', { done: nDone, total: nDrawn }),
        done: nDone, drawn: nDrawn,
      };
    }
    return { days, when, glyph, waitingOn, short, row, loadMap, U, hm, day, label, iso, at, due, fin, fromLabel, now, words, clock,
      delivered, late, restHours, REST: REST_H, dueRow, gate, chase, risk, fill, span, since, journey,
      // words in the page's language: a timed wait ('Waits two days'), a job's client and size, a name with its Turkish
      // endings, a title inside a sentence, a list
      rest, forWhom, named, lcT, list: listOf };
  }

  // ---------- clients: what passed between Sufra and each client, read from their orders ----------
  // The steps of a job that reach the client, by name, and the hours of the line's timed wait before it reminds them.
  const REACH = new Set(['Send the client a receipt', 'Send the quote link', 'The client approves', 'Wait two days', 'Remind the client',
    'Send the arrival time', 'Yusuf delivers', 'Send the invoice']);
  // what a step is doing, said after a name: 'Reem · checking the prices'; C is the client's short name
  // C (English, the data's) is said in the page's language with its Turkish endings: {C}, {CDat}, {CGen}…
  const DOING = {
    'Reem logs the order': () => T('logging the order'),
    'Send the client a receipt': (j, C) => T('sending {C} a receipt', named('C', C)),
    'Watar drafts the quote': () => T('checking Watar’s draft of the quote'),
    'Reem checks the prices': () => T('checking the prices'),
    'Send the quote link': (j, C) => T('sending {C} the quote', named('C', C)),
    'Wait two days': (j, C) => T('waiting two days for {C}’s answer', named('C', C)),
    'Remind the client': (j, C) => T('reminding {C}', named('C', C)),
    'Create the shopping list': () => T('writing the shopping list'),
    'Buy the materials': () => T('buying the materials'),
    'Hala orders from the wholesaler': () => T('ordering from the wholesaler'),
    'Wait for the delivery': () => T('waiting for the wholesaler’s delivery'),
    'Remind the kitchen a day before': () => T('reminding the kitchen'),
    'Salma prepares': (j) => T('preparing the {title}', { title: LANG === 'en' ? j.title.toLowerCase() : lcT(j.title) }),
    'Send the arrival time': (j, C) => T('sending {C} the arrival time', named('C', C)),
    'Yusuf delivers': (j, C, V) => T('delivering by {time} {when}', { time: V.hm(j.iso), when: V.when(j.iso) }),
    'Create the invoice': () => T('writing the invoice'),
    'Send the invoice': () => T('sending the invoice'),
  };
  // the steps that reach the client, with the client named in place of 'the client' (Clients' between rows)
  const TO_CLIENT = { 'Send the client a receipt': 'Send {C} a receipt', 'The client approves': '{C} approves', 'Remind the client': 'Remind {C}' };

  // Everything Clients shows is computed here, so Ask Watar can answer from the same facts. Copy never uses a pronoun
  // for a client: it repeats the short name C.
  function clients(J, S, V) {
    const all = S.jobs.concat(S.past);
    const msOf = (t) => V.U(t).getTime();
    const delivered = V.delivered;
    const byIso = (a, b) => a.iso.localeCompare(b.iso);
    // the contact's first name ('Dr Nadia' stays whole), or a private client's own
    const shortOf = (c) => { const n = c.private ? c.name : c.contact; return /^Dr /.test(n) ? n : n.split(' ')[0]; };
    // today, tomorrow or on Sun 4 Oct: when an event is, after a noun
    const onDay = (iso) => { const d = V.days(iso); return d === 0 ? T('today') : d === 1 ? T('tomorrow') : T('on {day}', { day: V.day(iso) }); };

    function get(key) {
      const c = S.clients[key];
      if (!c) return null;
      const orders = all.filter((j) => j.ck === key);
      const open = orders.filter((j) => !j.finished).sort(byIso), fin = orders.filter((j) => j.finished).sort(byIso);
      const soon = open[0] || null, x = soon && J.stepOf(soon);
      const side = !soon ? 'none' : x.who === 'The client' ? 'theirs' : 'ours';
      const first = orders.slice().sort((a, b) => a.opened.localeCompare(b.opened))[0];
      return Object.assign({}, c, { key, C: shortOf(c), orders, open, fin, soon, side, first });
    }
    // the three groups in operations order: the clients to chase, the clients to serve, the clients with nothing open
    function list() {
      const cs = Object.keys(S.clients).map(get);
      const lastFin = (c) => c.fin[c.fin.length - 1];
      return {
        theirs: cs.filter((c) => c.side === 'theirs').sort((a, b) => byIso(a.soon, b.soon)),
        ours: cs.filter((c) => c.side === 'ours').sort((a, b) => (delivered(a.soon) - delivered(b.soon)) || byIso(a.soon, b.soon)),
        none: cs.filter((c) => c.side === 'none').sort((a, b) => byIso(lastFin(b), lastFin(a))),
      };
    }
    // a query matches a client's name, its contact, or the code or title of any of its orders, open ones first
    function find(c, q) {
      const words = q.trim().toLowerCase();
      if (!words) return { ok: true, via: null };
      // found in English and in the page's language, so an Arabic search finds what the page shows
      if (`${c.name} ${c.contact || ''} ${T(c.name)} ${c.contact ? T(c.contact) : ''}`.toLowerCase().includes(words)) return { ok: true, via: null };
      const via = c.open.concat(c.fin.slice().reverse()).find((j) => `${j.code} ${j.title} ${T(j.title)}`.toLowerCase().includes(words));
      return { ok: !!via, via: via || null };
    }

    // one order's facts: its quote rounds, how long the answer took, a reminder, changes, the arrival and lateness
    function facts(j) {
      const log = j.log || {}, rounds = log.rounds || [], last = rounds[rounds.length - 1];
      const answered = !!(last && last.answer);
      return {
        rounds, answered, open: rounds.find((r) => !r.answer) || null,
        took: answered ? msOf(last.answer) - msOf(rounds[0].sent) : null,
        reminded: rounds.some((r) => r.reminded),
        changes: rounds.filter((r) => r.change),
        arrived: log.arrived || null,
        late: log.arrived ? Math.max(0, Math.round((msOf(log.arrived) - msOf(j.iso)) / 6e4)) : 0,
      };
    }
    // the line's own reminder for a quote still open: due when the timed wait runs out; a risk when it would come
    // later than a day before the event (the line reminds the kitchen then), and after it is worse still
    function reminder(j) {
      const f = facts(j);
      if (j.finished || !f.open) return null;
      const rest = J.station('approval').st.steps.find((x) => x.kind === 'rest');
      const sent = msOf(f.open.sent), due = sent + (REST_H[rest && rest.who] || 48) * 36e5, ev = msOf(j.iso);
      return { sent, due, risk: due > ev - 864e5, after: due > ev };
    }

    // One order as a word of the client's line: an arch per quote round the client saw, a lifted pen and a straight
    // where Iqaa reminded them, then the delivery (a loop, or the red snap when late). extra.reminded: a reminder
    // sent from the page, a straight after the open arch.
    function word(j, extra) {
      const f = facts(j), x = J.stepOf(j), deciding = !!x && x.who === 'The client';
      const out = [];
      f.rounds.forEach((r) => {
        out.push({ kind: 'held', state: r.answer ? 'done' : deciding ? 'now' : 'next' });
        if (r.reminded) out.push({ kind: 'rest', state: 'done' }, { kind: 'run', state: 'done' });
        else if (!r.answer && extra && extra.reminded) out.push({ kind: 'run', state: 'done', fresh: true });
      });
      if (!f.rounds.length) out.push({ kind: 'held', state: 'next' });
      out.push({ kind: f.late ? 'failed' : 'struck', state: f.arrived ? 'done' : x && x.name === 'Yusuf delivers' ? 'now' : 'next' });
      return out;
    }
    // the client's line laid out in units: one word per order, oldest first, a 12-unit pen lift between them.
    // opts.finished: finished orders only (the list's mini line); opts.reminded as in word().
    function layout(c, opts) {
      const o = opts || {}, LIFT = 12, out = [];
      let x = 0;
      (o.finished ? c.fin : c.fin.concat(c.open)).forEach((j, n) => {
        if (n) x += LIFT;
        const x0 = x;
        const strokes = word(j, j === c.soon ? o : null).map((s) => { const y = Object.assign({ x }, s); x += window.IQ.WIDTH[s.kind]; return y; });
        out.push({ j, x0, x1: x, strokes, late: facts(j).late });
      });
      return { words: out, w: x };
    }

    // the phrase under a mini line: every fact kept, joined
    function phrase(F) {
      if (!F.length) return T('First order');
      const fs = F.map((j) => ({ j, f: facts(j) })), n = F.length, parts = [];
      const late = fs.filter((o) => o.f.late), rem = fs.filter((o) => o.f.reminded).length;
      const ch = fs.reduce((v, o) => v + o.f.changes.length, 0);
      if (late.length) parts.push(late.length === 1 ? T('Late once, {day}', { day: V.day(late[0].j.iso) }) : N(late.length, 'Late {n} time', 'Late {n} times'));
      if (rem) parts.push(T('Reminded {n} of {total}', { n: rem, total: n }));
      if (ch) parts.push(N(ch, '{n} change', '{n} changes'));
      return parts.length ? parts.join(' · ') : n === 1 ? T('One order, on time') : T('On time, {n} of {n}', { n });
    }
    // the sentences about a client's finished orders: answers (long for the band, short for a step), changes, deliveries
    function history(c) {
      const fs = c.fin.map((j) => ({ j, f: facts(j) })), n = fs.length, C = c.C, E = !!c.open.length;
      if (!n) return null;
      const nm = named('C', C);
      const quotes = n === 1 ? T(E ? 'the earlier quote' : 'the quote') : n === 2 ? T(E ? 'both earlier quotes' : 'both quotes')
        : T(E ? 'all {n} earlier quotes' : 'all {n} quotes', { n });
      const took = fs.map((o) => o.f.took), lo = Math.min(...took), hi = Math.max(...took);
      let long, short;
      if (fs.every((o) => o.f.reminded)) {
        short = T('{C} answered {quotes} only after Iqaa’s reminder', Object.assign({ quotes }, nm));
        const d = took.map(V.words);
        long = T('{short}: after {spans}', { short, spans: d.length === 2 ? T('{a}, then {b}', { a: d[0], b: d[1] }) : listOf(d) });
      } else if (fs.every((o) => !o.f.reminded && !o.f.changes.length)) {
        if (n === 1) long = short = T('{C} answered {quotes} in {span}', Object.assign({ quotes, span: V.words(took[0]) }, nm));
        else {
          const h = Math.ceil(hi / 36e5);
          long = T('{C} answered {quotes} in {lo} to {hi}', Object.assign({ quotes, lo: V.words(lo), hi: V.words(hi) }, nm));
          short = h === 1 ? T('{C} answered {quotes} within an hour', Object.assign({ quotes }, nm))
            : N(h, '{C} answered {quotes} within {n} hour', '{C} answered {quotes} within {n} hours', Object.assign({ quotes }, nm));
        }
      } else if (n <= 3) {
        const why = (f) => [f.reminded ? T('after the reminder') : '', f.changes.length === 1 ? T('one change') : f.changes.length ? N(f.changes.length, '{n} change', '{n} changes') : ''].filter(Boolean).join(T(', '));
        const each = fs.slice().reverse().map((o) => (why(o.f) ? T('{span} ({why})', { span: V.words(o.f.took), why: why(o.f) }) : V.words(o.f.took)));
        const took1 = E ? (n === 1 ? '{C}’s earlier answer took {spans}' : '{C}’s earlier answers took {spans}') : n === 1 ? '{C}’s answer took {spans}' : '{C}’s answers took {spans}';
        long = short = T(took1, Object.assign({ spans: listOf(each) }, nm));
      } else {
        long = short = T('{C} answered in {lo} to {hi}; Iqaa reminded {C} {r} of {n} times',
          Object.assign({ lo: V.words(lo), hi: V.words(hi), r: fs.filter((o) => o.f.reminded).length, n }, nm));
      }
      const chg = fs.slice().reverse().find((o) => o.f.changes.length);
      const change = chg ? T('For the {title} on {day}, {C} asked for a change: “{change}”.',
        Object.assign({ title: lcT(chg.j.title), day: V.day(chg.j.iso), change: T(chg.f.changes[chg.f.changes.length - 1].change) }, nm)) : '';
      const late = fs.filter((o) => o.f.late);
      function delivery(before) {
        if (late.length) {
          const o = late[late.length - 1], s = T('{day}, {arrived} for {due}', { day: V.day(o.j.iso), arrived: V.hm(o.f.arrived), due: V.hm(o.j.iso) });
          return late.length === 1 ? T(before ? 'Late once before: {s}.' : 'Late once: {s}.', { s })
            : N(late.length, before ? 'Late {n} time before, last on {s}.' : 'Late {n} time, last on {s}.', before ? 'Late {n} times before, last on {s}.' : 'Late {n} times, last on {s}.', { s });
        }
        const same = fs.every((o) => V.hm(o.j.iso) === V.hm(fs[0].j.iso));
        const times = n <= 3 && same ? ` (${fs.map((o) => V.hm(o.f.arrived)).join(T(', '))})` : '';
        const lead = n === 1 ? (E ? 'The earlier delivery arrived on time{times}.' : 'The delivery arrived on time{times}.')
          : n === 2 ? (E ? 'Both earlier deliveries arrived on time{times}.' : 'Both deliveries arrived on time{times}.')
            : E ? 'All {n} earlier deliveries arrived on time{times}.' : 'All {n} deliveries arrived on time{times}.';
        return T(lead, { n, times });
      }
      return { long, short, change, delivery };
    }
    // the band's reading: how the client answers, then how Sufra delivered
    function reading(c) {
      const h = history(c);
      return h ? `${h.long}. ${h.delivery(false)}` : T('First order. {C}’s line with Sufra starts with this one.', named('C', c.C));
    }
    // history as evidence on the step it predicts: { t, risk } or null. name is the line's step name.
    function evidence(name, j, c) {
      const h = history(c), f = facts(j);
      if (name === 'The client approves') {
        if (f.answered) return { t: T(f.reminded ? 'Answered in {span}, after the reminder' : 'Answered in {span}', { span: V.words(f.took) }) };
        if (!h) return { t: T('First order: nothing to compare yet.') };
        return { t: `${h.short}.${h.change ? ` ${h.change}` : ''}` };
      }
      if (name === 'Remind the client') {
        const r = reminder(j);
        if (r && r.risk) return { t: T(r.after ? 'That is after the {title} on {date}.' : 'That is less than a day before the {title} on {date}.', { title: lcT(j.title), date: V.label(j.iso) }), risk: true };
        return null;
      }
      if (name === 'Yusuf delivers' && h && !f.arrived) return { t: h.delivery(true) };
      return null;
    }

    // what a step is doing, in words; C is the client's short name (English, the data's)
    const doing = (x, j, C) => (DOING[x.name] ? DOING[x.name](j, C, V) : lcT(x.name));
    const glyph = (k) => V.glyph(k);
    const av = (who) => `<span class="av" aria-hidden="true">${window.Beats.esc(T(who).charAt(0))}</span>`;
    // whose move it is on one open job: lead (the step's glyph or the person's initial, html), two lines, risk; who stays
    // the data's English name (Clients compares it with C)
    function move(j, c) {
      const x = J.stepOf(j), f = facts(j), C = c.C, nm = named('C', C);
      if (x.who === 'The client') {
        const r = reminder(j), v = { at: V.at(r.due), title: lcT(j.title) };
        const l2 = r.after ? T('Reminder due {at}, after the {title}', v)
          : r.risk ? T('Reminder due {at}, less than a day before the {title}', v) : T('Reminder due {at} if there’s no answer', v);
        return { lead: glyph(x.kind), l1: T('Waiting for {C} since {at}', Object.assign({ at: V.at(r.sent) }, nm)), l2, risk: r.risk, who: C };
      }
      const l1 = isPerson(x.kind) ? T('{name} · {doing}', { name: T(x.who), doing: doing(x, j, C) }) : T(x.kind === 'rest' ? 'Waits · {doing}' : 'Runs by itself · {doing}', { doing: doing(x, j, C) });
      const told = V.clock(j).find((s) => s.x.name === 'Send the arrival time' && s.state === 'done');
      const last = f.rounds[f.rounds.length - 1];
      const l2 = delivered(j) && f.arrived ? T('Delivered {at}', { at: V.at(f.arrived) })
        : told ? T('{C} has had the arrival time since {at}', Object.assign({ at: V.at(told.t) }, nm))
          : f.answered ? T(last.change ? '{C} asked for a change {at}' : '{C} approved the quote {at}', Object.assign({ at: V.at(last.answer) }, nm))
            : !f.rounds.length ? T('The quote hasn’t gone to {C} yet', nm) : T('The quote went to {C} {at}', Object.assign({ at: V.at(f.rounds[0].sent) }, nm));
      return { lead: isPerson(x.kind) ? av(x.who) : glyph(x.kind), l1, l2, risk: false, who: isPerson(x.kind) ? x.who : null };
    }
    // the state box on the client's page: its lead and one sentence
    function state(c) {
      if (!c.soon) return { lead: glyph('struck'), t: T('Nothing open · last order finished {date}', { date: V.fin(c.fin[c.fin.length - 1]) }) };
      const j = c.soon, x = J.stepOf(j), more = c.open.length > 1 ? N(c.open.length - 1, ' and {n} more open', ' and {n} more open') : '';
      if (x.who === 'The client') return { lead: glyph(x.kind), t: T('Waiting on {C}’s answer to the quote for the {title} {when}{more}', Object.assign({ title: lcT(j.title), when: onDay(j.iso), more }, named('C', c.C))) };
      if (isPerson(x.kind)) return { lead: av(x.who), t: T('With {name}: {doing}{more}', { name: T(x.who), doing: doing(x, j, c.C), more }) };
      return { lead: glyph(x.kind), t: T(x.kind === 'rest' ? 'Waits: {doing}{more}' : 'Runs by itself: {doing}{more}', { doing: doing(x, j, c.C), more }) };
    }

    // The steps of an open job that reach the client, from the last one done (or the first) through the delivery, or
    // to the end once it is past Deliver. The wait and the reminder show only while the job waits on the client, or
    // once they ran. early: the time a reminder was sent from the page. Each row: x, name (with C), state, when, ev.
    // A done row's when starts with V.at(t) in every language (Clients cuts the time off the front to mark it up).
    function between(j, c, early) {
      const steps = V.clock(j), r = reminder(j), on = j.at === 'approval';
      const rows = steps.filter((s) => REACH.has(s.x.name) && s.state !== 'skip' && (!CHASE.has(s.x.name) || on || s.state === 'done'));
      const lastDone = rows.map((s) => s.state).lastIndexOf('done');
      const end = delivered(j) ? rows.length : rows.findIndex((s) => s.x.name === 'Yusuf delivers') + 1;
      return rows.slice(Math.max(0, lastDone), end || rows.length).map((s) => {
        const name = TO_CLIENT[s.x.name] ? T(TO_CLIENT[s.x.name], named('C', c.C)) : T(s.x.name);
        let st = s.state, when, ev = evidence(s.x.name, j, c);
        if (st === 'done') when = V.at(s.t);
        else if (st === 'now') when = s.x.name === 'The client approves' && r ? T('Waiting, {span}', { span: V.words(V.now() - r.sent) }) : s.x.name === 'Yusuf delivers' ? T('By {time} {when}', { time: V.hm(j.iso), when: V.when(j.iso) }) : T('Now');
        else if (s.x.name === 'Wait two days' && r) when = T('Until {at}', { at: V.at(r.due) });
        else if (s.x.name === 'Remind the client' && r) when = V.at(r.due);
        else if (s.x.name === 'Yusuf delivers') when = T('{day}, by {time}', { day: V.day(j.iso), time: V.hm(j.iso) });
        else when = T('Ahead');
        if (early != null && s.x.name === 'Remind the client') { st = 'done'; when = T('{time} · sent early by {name}', { time: V.hm(early.t), name: T(early.by) }); ev = null; }
        if (early != null && s.x.name === 'Wait two days') { st = 'skip'; when = T('Not needed: reminded early'); }
        return { x: s.x, name, state: st, when, t: st !== 'done' ? null : s.t != null ? s.t : early.t, ev };
      });
    }

    return { get, list, find, facts, reminder, word, layout, phrase, reading, evidence, doing, move, state, between, delivered, onDay, REACH };
  }

  window.JOBS = { on, views, clients, isPerson };
})();
