// Ask Watar: a conversation with Watar about Sufra's work. Every answer is computed here, in the browser, from the
// shared demo world (sufra.js) through jobs.js, by fixed rules: ask() reads a question and returns what to say and
// which parts to show, and the renderers draw those parts with the product's own rows, strips and lines. Whatever
// Watar proposes waits in the dashed grey pen until a person approves it. The conversation is kept per person in
// sessionStorage and rebuilt by asking each question again at its own time.
(function () {
  const root = document.querySelector('main.aw');
  if (!root || !window.IQ || !window.Beats || !window.SUFRA || !window.JOBS) return;
  const S = window.SUFRA, M = window.IQAA.motion;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const esc = Beats.esc, reduce = Beats.reduce, isPerson = JOBS.isPerson;
  const line = S.line(), J = JOBS.on(line), V = JOBS.views(J, S), K = JOBS.clients(J, S, V);
  const HOUR = 36e5, DAY = 864e5;

  // ---------- who is asking: ?as= for the prototype, else the owner ----------
  const params = new URLSearchParams(location.search);
  const meKey = S.people[(params.get('as') || '').toLowerCase()] ? params.get('as').toLowerCase() : 'hala';
  const me = S.people[meKey];
  const OWNER = Object.keys(S.people).find((k) => /^Owner/.test(S.people[k].role));
  let own = null;
  try { const o = JSON.parse(sessionStorage.getItem('iqaa-org') || 'null'); if (o && !o.demo && o.blocks && o.blocks.length) own = o; } catch (e) { /* the demo stays */ }

  // ---------- the conversation, kept per person; every read and write may fail and the page still answers ----------
  const KEY = `iqaa-watar:${meKey}`;
  function load() { try { const c = JSON.parse(sessionStorage.getItem(KEY) || 'null'); return c && c.v === 1 ? c : null; } catch (e) { return null; } }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(conv)); } catch (e) { /* storage blocked: this visit only */ } }
  // reminders sent early, by code: from a client's page (client.js) or approved here; kept for the visit
  function reminded() { try { return JSON.parse(sessionStorage.getItem('iqaa-reminded') || '{}') || {}; } catch (e) { return {}; } }
  let conv = load();
  // the demo clock carries on from the conversation, so a reload never asks before an earlier answer
  const latest = conv ? Math.max(conv.startedAt || 0, ...conv.asked.map((x) => x.at)) : 0;
  const shift = Math.max(0, latest - V.now());
  const now = () => V.now() + shift;
  if (!conv) conv = { v: 1, startedAt: now(), asked: [], drafts: {}, text: '' };

  // ---------- words ----------
  const lc = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const both = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
  const NUM = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
  const num = (n) => NUM[n] || String(n);
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const ord = (n) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;
  const dayOff = (t) => V.days(V.iso(t));
  // a time as a sentence says it: 'today at 18:00', 'tomorrow at 09:00', 'on Tue 3 Nov at 08:52'
  const onAt = (t) => { const d = dayOff(t); return d === 0 ? `today at ${V.hm(t)}` : d === 1 ? `tomorrow at ${V.hm(t)}` : `on ${V.day(t)} at ${V.hm(t)}`; };
  const short = (j) => (/^Dr /.test(j.client) ? j.client : j.client.split(' ')[0]);
  const eventOf = (j) => (/coffee break/i.test(j.title) ? 'coffee break' : (j.title.toLowerCase().match(/lunch|breakfast|dinner|reception|evening|tasting/) || ['event'])[0]);
  // a moment after a verb: 'at 08:52' today, 'on Sat 31 Oct, 09:30' before
  const atOn = (t) => (dayOff(t) ? `on ${V.label(t)}` : `at ${V.hm(t)}`);
  const PAST = { logs: 'logged', checks: 'checked', prepares: 'prepared', delivers: 'delivered', orders: 'ordered', buys: 'bought', drafts: 'drafted', approves: 'approved' };
  // a person's finished step in the past tense, after their name: 'checked the prices', 'logged the order'
  const pastOf = (d) => { const [verb, ...rest] = d.step.slice(d.who.length + 1).split(' '); return { v: PAST[verb] || verb.replace(/s$/, 'ed'), what: rest.join(' ') }; };
  // ... and with its order: 'checked the prices for Office lunch', 'logged Board breakfast'
  const did = (d) => { const p = pastOf(d); return !p.what || p.what === 'the order' ? `${p.v} ${d.title}` : `${p.v} ${p.what} for ${d.title}`; };
  // a person's step in the base form, after 'to': 'check the prices', 'order from the wholesaler'
  function todo(x) {
    if (/^Watar drafts/.test(x.name)) return 'check my draft of the quote';
    const [v, ...rest] = (x.name.startsWith(`${x.who} `) ? x.name.slice(x.who.length + 1) : lc(x.name)).split(' ');
    return [/(ch|sh|ss|x)es$/.test(v) ? v.slice(0, -2) : v.replace(/s$/, '')].concat(rest).join(' ');
  }
  const glyph = (k, o) => `<span class="g" aria-hidden="true">${IQ.glyph(k, { test: !!(o && o.test) })}</span>`;
  const icon = (n, s) => IQ.icon(n, s || 18);
  const time = (t) => `<time datetime="${V.iso(t)}">${V.hm(t)}</time>`;

  // ---------- the demo world as Watar reads it ----------
  const ALL = S.jobs.concat(S.past), live = S.jobs.filter((j) => !j.finished);
  const byIso = (a, b) => a.iso.localeCompare(b.iso);
  const people = Object.keys(S.people).map((k) => Object.assign({ k }, S.people[k]));
  const personKey = (name) => (people.find((p) => p.name === name) || {}).k;
  const mineOf = (name) => live.filter((j) => { const x = J.stepOf(j); return isPerson(x.kind) && x.who === name; }).sort(byIso);
  const sinceOf = (j) => { const s = V.clock(j), n = s.findIndex((x) => x.state === 'now'); const p = s.slice(0, n < 0 ? s.length : n).filter((x) => x.t != null).pop(); return p ? p.t : null; };
  const dayStart = (t) => Math.floor(t / DAY) * DAY;
  const hourOf = (v) => { const [h, m] = v.split(':').map(Number); return h * HOUR + m * 6e4; };
  const OPEN = hourOf(S.hours.open), CLOSE = hourOf(S.hours.close);
  const remindStep = V.gate && V.gate.steps.find((x) => x.kind === 'run' && x.msg);

  // ---------- reading a question: normalised words, then the orders, people, stations, days and times in it ----------
  const norm = (s) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/'s\b/g, '').replace(/[^a-z0-9: ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const has = (t, words) => new RegExp(`\\b(?:${words.join('|')})\\b`).test(t);
  // words that never name an order on their own ('team' is a question about the team, not the clinic's lunch)
  const STOP = new Set(['for', 'the', 'a', 'co', 'order', 'private', 'of', 'and', 'team', 'dr']);
  const TOKENS = new Map();
  ALL.forEach((j) => [j.title, j.client, j.of].forEach((s) => norm(s).split(' ').forEach((w) => {
    if (!w || STOP.has(w)) return;
    if (!TOKENS.has(w)) TOKENS.set(w, new Set());
    TOKENS.get(w).add(j);
  })));
  const PEOPLE = Object.fromEntries(people.map((p) => [p.name.toLowerCase(), p.k]));
  const STATION_WORDS = [['approval', 'client approval|approval|approvals'], ['request', 'request|requests'], ['quote', 'quote|quotes'],
    ['buy', 'buy|buying|shopping|materials'], ['wholesale', 'wholesale|wholesaler'], ['prepare', 'prepare|preparing|prep|kitchen'],
    ['deliver', 'deliver|delivery|delivering|deliveries'], ['invoice', 'invoice|invoices|invoicing|billing']];
  const CLIENT_WORDS = ['client', 'clients', 'customer', 'customers'];
  // a day window is a question only with one of these: 'pizza tonight' is not about the line
  const DAY_ASK = ['due', 'deadline', 'deadlines', 'what', 'which', 'anything', 'orders', 'events', 'happening', 'planned', 'scheduled', 'coming up'];
  const WEEKDAY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  function codeIn(t) {
    const m = /\bsfr(?: 26)? (\d{1,4})\b/.exec(t) || /\b(?:order|no|number) (\d{1,4})\b/.exec(t) || /\b(0\d{3})\b/.exec(t);
    return m ? `SFR-26-${m[1].padStart(4, '0')}` : null;
  }
  // the orders a question names: by code, else by the words of their title, client and organization. Live orders win;
  // with none live, the newest finished one. Two or more live orders left mean Watar asks which.
  function ordersIn(t) {
    const code = codeIn(t);
    if (code) { const j = ALL.find((x) => x.code === code); return j ? { list: [j] } : { missing: code }; }
    const sets = t.split(' ').filter((w) => TOKENS.has(w)).map((w) => TOKENS.get(w));
    if (!sets.length) return { list: [] };
    let hit = [...sets.reduce((a, b) => new Set([...a].filter((x) => b.has(x))))];
    if (!hit.length) hit = [...new Set(sets.filter((s) => [...s].filter((j) => !j.finished).length === 1).flatMap((s) => [...s]))];
    const lv = hit.filter((j) => !j.finished).sort(byIso);
    if (lv.length) return { list: lv, fin: hit.filter((j) => j.finished && S.jobs.includes(j)) };
    const fin = hit.filter((j) => j.finished).sort((a, b) => V.fromLabel(b.finished) - V.fromLabel(a.finished));
    return { list: fin.slice(0, 1) };
  }
  // named: an order or the clients is what the question is about, so 'me', 'my' and 'I' are only the asker
  // ('tell me about Hayat', 'which of my clients'), not who the question is about
  function personIn(t, viewer, named) {
    const w = t.split(' ').find((x) => PEOPLE[x]);
    if (w) return PEOPLE[w];
    if (!named && has(t, ['me', 'my', 'mine', 'i'])) return viewer;
    if (has(t, ['owner'])) return OWNER;
    return null;
  }
  const stationIn = (t) => { const s = STATION_WORDS.find(([, w]) => has(t, [w])); return s ? J.station(s[0]).st : null; };
  // a window of days, as offsets from today: [from, to] and the words for it
  function daysIn(t) {
    if (has(t, ['by tomorrow', 'today and tomorrow'])) return { from: 0, to: 1, say: 'by tomorrow' };
    if (has(t, ['this week'])) return { from: 0, to: 6, say: 'this week' };
    if (has(t, ['next week'])) return { from: 7, to: 13, say: 'next week' };
    if (has(t, ['last week'])) return { from: -7, to: -1, say: 'last week' };
    if (has(t, ['yesterday'])) return { from: -1, to: -1, say: 'yesterday' };
    if (has(t, ['tomorrow'])) return { from: 1, to: 1, say: 'tomorrow' };
    if (has(t, ['today', 'tonight'])) return { from: 0, to: 0, say: 'today' };
    const wd = WEEKDAY.findIndex((d) => has(t, [d, d.slice(0, 3)]));
    const today = new Date(`${S.dayIso}T00:00Z`).getUTCDay();
    // a weekday is the next one, or the last one when the question is in the past tense ('what was due on Saturday')
    if (wd >= 0) { let o = (wd - today + 7) % 7; if (o && has(t, ['was', 'were', 'last'])) o -= 7; return { from: o, to: o }; }
    const m = new RegExp(`\\b(\\d{1,2}) (${MONTHS.join('|')})|\\b(${MONTHS.join('|')}) (\\d{1,2})\\b`).exec(t);
    if (m) {
      const d = +(m[1] || m[4]), mo = MONTHS.indexOf(m[2] || m[3]);
      const o = V.days(`2026-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
      return { from: o, to: o };
    }
    return null;
  }
  // the clock a question names: { h, mi } for a time of day ('at 9', '14:00', 'noon'), { after } for 'in 2 hours'
  function clockIn(t) {
    const rel = /\bin (\d{1,2}|an?|one|two|three|four|five|six) (hours?|minutes?|mins?)\b/.exec(t);
    if (rel) return { after: ({ a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 }[rel[1]] || +rel[1]) * (/^h/.test(rel[2]) ? HOUR : 6e4) };
    let h = null, mi = 0;
    const hm = /\b(\d{1,2}):(\d{2})\b/.exec(t), ap = /\b(\d{1,2}) ?(am|pm)\b/.exec(t), at_ = /\bat (\d{1,2})\b/.exec(t);
    if (has(t, ['noon', 'midday'])) h = 12;
    else if (hm) { h = +hm[1]; mi = +hm[2]; }
    else if (ap) h = +ap[1];
    else if (at_) h = +at_[1];
    if (h == null) return null;
    const pm = ap && ap[2] === 'pm', am = ap && ap[2] === 'am';
    if (pm && h < 12) h += 12;
    if (am && h === 12) h = 0;
    if (!pm && !am && !hm && h < 8) h += 12;
    return { h, mi };
  }
  // a time for a reminder: 'now'; ms for a clock time on a day, or from now for 'in 2 hours'; a later day alone is
  // Sufra's opening hour that day; 'ask' when only today or several days are named; null when nothing is
  function timeIn(t, at) {
    if (has(t, ['now', 'right away', 'straight away'])) return 'now';
    const c = clockIn(t), win = daysIn(t), day = win && win.from === win.to ? win.from : null;
    if (c && c.after) return at + c.after;
    if (!c) return !win ? null : day > 0 ? dayStart(at) + day * DAY + OPEN : 'ask';
    if (win && day == null) return 'ask';
    return dayStart(at) + (day || 0) * DAY + c.h * HOUR + c.mi * 6e4;
  }

  // ---------- facts Watar states ----------
  // who or what an order waits on now, said after its title
  function waitsOn(j) {
    const x = J.stepOf(j);
    if (!x) return { kind: 'fin', said: `finished ${j.finished}` };
    if (x.who === 'The client') return { kind: 'client', who: short(j), said: `waiting for ${short(j)}` };
    if (isPerson(x.kind)) return { kind: 'team', who: x.who, said: `with ${x.who}` };
    return { kind: x.kind, said: K.doing(x, j, short(j)) };
  }
  // what a person's step on an order is, as Watar says it ('to check my draft' for the quote Watar drafted)
  const stepSaid = (x, j) => (/^Watar drafts/.test(x.name) ? ' to check my draft' : `, who is ${K.doing(x, j, short(j))}`);
  // the decisions made in this conversation before question n, the latest per draft key
  function decided(ctx, key) {
    const ds = Object.values(ctx.drafts).filter((d) => d.key === key && (d.state === 'approved' || d.state === 'sent'));
    return ds.sort((a, b) => a.at - b.at).pop() || null;
  }
  // why an order is at risk, in one sentence
  function reason(j, r, ctx) {
    const C = short(j), ev = eventOf(j);
    if (r.why === 'waits') return `The waits still ahead take ${V.span(r.hours * HOUR)}, which ends after the ${ev} on ${V.label(r.ev)}.`;
    const s = riskSaid(j, r, ctx);
    if (r.gone) return `The quote link went to ${C} ${atOn(r.linkAt)}. ${s}`;
    const x = J.stepOf(j), since = sinceOf(j);
    return `${isPerson(x.kind) ? `Its quote waits for ${x.who}${stepSaid(x, j)}${since ? `, since ${V.at(since)}` : ''}.` : `Its quote hasn’t gone to ${C} yet.`} ${s}`;
  }
  // what the line would do, or what was decided here instead
  function riskSaid(j, r, ctx) {
    const C = short(j), ev = eventOf(j), done = decided(ctx, `remind:${j.code}`);
    if (r.why === 'waits') return `The waits still ahead take ${V.span(r.hours * HOUR)}, which ends after the ${ev} on ${V.label(r.ev)}.`;
    if (done) return `${done.when === 'now' ? `Reminded at ${V.hm(done.at)}` : done.when > ctx.now ? `Reminder set for ${onAt(done.when)}` : `Reminded ${onAt(done.when)}`} · ${done.from === 'page' ? 'sent from the client’s page' : 'approved'} by ${done.by}. The ${ev} still needs ${C}’s answer.`;
    return r.gone ? `If ${C} doesn’t answer, the line reminds ${C} ${onAt(r.remindAt)}, ${V.span(r.remindAt - r.ev)} after the ${ev}.`
      : `Even if the quote went now, the line would remind ${C} ${onAt(r.remindAt)}, ${V.span(r.remindAt - r.ev)} after the ${ev}.`;
  }
  // an order at risk at t. One whose client was reminded, or is set to be, before the event (approved here or sent from
  // the client's page) is settled: the line's late reminder no longer decides it, and its strip shows the reminder
  function riskOf(j, t, ctx) {
    const r = V.risk(j, t);
    if (!r) return null;
    const d = r.why === 'reminder' && ctx && decided(ctx, `remind:${j.code}`), at = d && (d.when === 'now' ? d.at : d.when);
    return Object.assign({ j }, r, d && at < r.ev ? { settled: d, remindAt: at } : {});
  }
  const risksAt = (t, ctx) => live.map((j) => riskOf(j, t, ctx)).filter(Boolean).sort((a, b) => byIso(a.j, b.j));
  // a settled reminder as a sentence: 'Omar was reminded at 09:41', 'Iqaa reminds Rami today at 18:00'
  const remindedSaid = (r, t) => { const d = r.settled, at = r.remindAt; return at > t ? `Iqaa reminds ${short(r.j)} ${onAt(at)}` : `${short(r.j)} was reminded ${d.when === 'now' ? `at ${V.hm(at)}` : onAt(at)}`; };
  // the change to the line that would end every risk its timed wait makes: the longest shorter wait that does
  function lineChange(risks) {
    const rs = risks.filter((r) => r.why === 'reminder');
    if (rs.length < 2) return null;
    const cur = rs[0].hours;
    const opt = Object.entries(V.REST).sort((a, b) => b[1] - a[1]).find(([, h]) => h < cur && rs.every((r) => r.linkAt + h * HOUR < r.ev));
    if (!opt) return null;
    const st = V.gate, was = rs[0].wait.who;
    // risky: the orders still at risk, which keep the old version and need their own reminder
    return { type: 'line', key: `line:${st.id}-wait`, st: st.id, len: opt[0], was, risky: rs.filter((r) => !r.settled).map((r) => r.j.title),
      title: `Wait ${lc(opt[0])} at ${st.name}, not ${lc(was).split(' ')[0]}` };
  }

  // ---------- the engine: ask(text, ctx) reads, decides and returns what to say; it never touches the page ----------
  // ctx: { now, viewer (a people key), drafts (decisions made before this question), pending (a clarify turn's intent),
  // asked (earlier questions, normalised) }. An answer: { kind, read, lead, parts, notes, drafts, links, next, choices }.
  function answer(kind, read, lead, o) {
    return Object.assign({ kind, read, lead, parts: [], notes: [], drafts: [], links: [], next: [], choices: null, pending: null }, o);
  }
  function starters(ctx) {
    const team = live.filter((j) => waitsOn(j).kind === 'team').map((j) => ({ j, t: sinceOf(j) })).sort((a, b) => a.t - b.t);
    const j = team[0] && team[0].j, name = j && (j.of === 'a private order' ? j.client.split(' ')[0] : j.of.split(' ')[0]);
    const most = people.map((p) => ({ p, n: mineOf(p.name).length })).sort((a, b) => b.n - a.n)[0];
    return ['Who is late today?', j ? `Why is ${name}’s order stuck?` : 'Where are the jobs?',
      `What is waiting for ${most.p.k === ctx.viewer ? 'me' : most.p.name}?`, 'What is due by tomorrow?'];
  }
  const nextOf = (list, ctx) => list.filter((q) => !ctx.asked.includes(norm(q))).slice(0, 3);
  const todayLink = (name) => { const k = personKey(name); return k ? { href: `today.html?as=${k}`, t: `Open ${name}’s Today`, i: 'Today' } : null; };
  const orderLink = (j) => ({ href: `order.html?code=${j.code}`, t: 'Open the order', i: 'Orders' });

  // the opening turn: what Watar found when the conversation started
  function opening(t, ctx) {
    const lateNow = live.filter(V.late), all = risksAt(t, ctx), risks = all.filter((r) => !r.settled), at = V.hm(t);
    let lead = lateNow.length ? `${num(lateNow.length)} ${lateNow.length === 1 ? 'order is' : 'orders are'} late at ${at}: ${both(lateNow.map((j) => j.title))}.` : `Nothing on Sufra’s line is late at ${at}`;
    if (!risks.length) lead += lateNow.length ? ' Every other timed wait ends before its event.' : ', and every timed wait ends before its event.';
    else {
      const rem = risks.every((r) => r.why === 'reminder');
      lead += `${lateNow.length ? '' : '.'} ${num(risks.length)} ${risks.length === 1 ? 'order is' : 'orders are'} at risk: for ${both(risks.map((r) => r.j.title))}, ${rem ? `the line’s reminder to the client would come after the event` : 'a timed wait would end after the event'}.`;
    }
    all.filter((r) => r.settled).forEach((r) => { lead += ` ${remindedSaid(r, t)}, so the ${eventOf(r.j)} no longer waits on the line’s reminder.`; });
    // this turn has already said who is late, so it isn't offered as a question here
    const items = starters(ctx).map((q) => (q === 'Who is late today?' ? 'Which clients haven’t answered?' : q));
    return answer('opening', '', lead, { intro: 'Ask about an order, a person or the day. For example:', choices: { label: 'Questions to start with', items: items.map((q) => ({ q, t: q })) } });
  }

  function ask(text, ctx) {
    const t = norm(text), viewer = ctx.viewer, you = S.people[viewer];
    const found = ordersIn(t), list = found.list || [], j = list.length === 1 ? list[0] : null;
    const who = personIn(t, viewer, list.length > 0 || has(t, CLIENT_WORDS)), st = list.length ? null : stationIn(t), win = daysIn(t);
    // a question that is only an order's name answers the clarify turn before it
    const rest = t.split(' ').filter((w) => !TOKENS.has(w) && !STOP.has(w) && !['one', 'that', 'this', 'please', 'it'].includes(w));
    const intent = ctx.pending && list.length && !rest.length ? ctx.pending : null;

    if (/^(hello|hi|hey|good morning|good afternoon|good evening|salam|marhaba)( watar)?$/.test(t)) return answer('greeting', 'a greeting', `Hello, ${you.name}. Ask about an order, a person or the day.`, { choices: { label: 'Questions to start with', items: starters(ctx).map((q) => ({ q, t: q })) } });
    if (/^(thanks|thank you|thank you watar|thanks watar|cheers|shukran)$/.test(t)) return answer('thanks', 'thanks', 'You’re welcome.');
    if (has(t, ['help', 'what can you', 'what do you know', 'how does this work'])) {
      const ex = starters(ctx).concat(['Where are the jobs?', 'What happens at Client approval?']);
      return answer('help', 'help', 'I answer from Sufra’s line: its orders, its people, its stations and the times on it. I don’t see prices, messages or stock, and nothing goes out until a person approves it. You can ask:', { choices: { label: 'Questions to ask', items: ex.map((q) => ({ q, t: q })) } });
    }
    if (found.missing) {
      const newest = S.jobs.slice().sort((a, b) => b.code.localeCompare(a.code))[0];
      return answer('missing', `order ${found.missing}`, `No order ${found.missing} is on Sufra’s line. The newest is ${newest.code}, ${newest.title}.`, { next: nextOf(['Where are the jobs?', 'What is due this week?'], ctx) });
    }
    if (intent === 'remind' || (!intent && has(t, ['remind', 'nudge', 'chase', 'follow up']))) return remindAnswer(t, list, who, ctx);
    // a prediction is a question about someone else; a command to approve or send is Watar's to refuse
    if (has(t, ['will', 'going to', 'likely', 'chance']) && has(t, ['approve', 'answer', 'reply', 'pay', 'accept'])) return predictAnswer(j, ctx);
    if (/^(please |can you |could you |would you |will you |watar )*(approve|accept|confirm|sign|send|cancel|delete|skip|assign|pay)\b/.test(t)) return wontAnswer(t, j, ctx);
    if (has(t, ['total', 'totals', 'price of', 'prices of', 'cost', 'costs', 'revenue', 'profit', 'paid', 'money', 'how much', 'earn', 'income', 'price', 'prices'])) {
      return answer('money', 'money', 'I can’t see money: Sufra has no prices in Iqaa yet, so every quote total is [TOTAL] until the price list is added. I can tell you which quotes are waiting, and for whom.', { next: nextOf(['Where are the jobs?', 'What is waiting for Reem?', 'Which clients haven’t answered?'], ctx) });
    }
    if (has(t, ['weather', 'rain', 'traffic', 'road', 'roads', 'stock', 'fridge', 'supplier', 'news'])) {
      return answer('outside', 'outside Sufra’s line', 'I only read Sufra’s line: its orders, its people and its steps. I can’t see the weather, the road or what is in the kitchen.', { next: nextOf(['Who is late today?', 'What is due by tomorrow?'], ctx) });
    }
    if (who && has(t, ['slow', 'lazy', 'fast', 'good', 'bad', 'best', 'worst', 'rate', 'rating', 'performance', 'productive', 'blame'])) {
      const p = S.people[who], w = mineOf(p.name), old = w.map(sinceOf).sort((a, b) => a - b)[0];
      return answer('judge', `a judgement of ${p.name}`, `I don’t rate people. ${p.name} has ${plural(w.length, 'order')} waiting${old ? `; the oldest since ${V.label(old)}` : ''}.`, { links: [todayLink(p.name)].filter(Boolean), next: nextOf([`What is waiting for ${p.name}?`, 'Who is busiest?'], ctx) });
    }
    if (intent === 'late' || (!intent && (has(t, ['late', 'behind', 'overdue', 'delayed', 'on time', 'risk', 'at risk', 'in time', 'miss']) || (!list.length && has(t, ['stuck', 'blocked', 'held up']))))) {
      if (list.length > 1) return clarify(list, found.fin, 'late');
      if (j) return orderAnswer(j, ctx, has(t, ['on time', 'in time']) ? 'yes' : 'late');
      if (who) {
        const p = S.people[who], w = mineOf(p.name);
        return answer('late-person', `whether ${p.name} is late`, `Sufra’s line sets no time limit for a person’s step, so I don’t call a person late. ${p.name} has ${plural(w.length, 'order')} waiting${w.length ? `; ${w[0].title} is due first` : ''}.`, { links: [todayLink(p.name)].filter(Boolean), next: nextOf([`What is waiting for ${p.name}?`, 'Who is late today?'], ctx) });
      }
      return lateAnswer(ctx);
    }
    if (!list.length && has(t, ['how long', 'take', 'takes', 'took', 'average', 'usually', 'lead time'])) return leadAnswer(ctx);
    if (has(t, ['before', 'history', 'again', 'how many orders', 'regular', 'ordered']) && list.length) {
      const cks = [...new Set(list.map((x) => x.ck))];
      if (cks.length === 1) return historyAnswer(K.get(cks[0]), ctx);
    }
    if (!list.length && has(t, ['done', 'finished', 'did', 'completed', 'do today'])) return doneAnswer(ctx, who, has(t, ['this week', 'week', '7 days', 'seven days', 'recently', 'lately']));
    if (list.length > 1) return clarify(list, found.fin, 'order');
    if (j && (intent === 'order' || intent || has(t, ['why', 'stuck', 'waiting', 'wait', 'where', 'status', 'next', 'left', 'ahead', 'when', 'due', 'what']) || !rest.length)) return orderAnswer(j, ctx);
    if (who || has(t, ['team', 'busiest', 'everyone', 'who has the most'])) return who ? personAnswer(who, ctx) : teamAnswer(ctx);
    if (has(t, CLIENT_WORDS) && has(t, ['waiting', 'answer', 'answered', 'approve', 'approved', 'pending', 'reply', 'replied'])) return clientsAnswer(ctx);
    if (st) return stationAnswer(st, ctx);
    if (has(t, ['where are', 'bottleneck', 'which station', 'most orders', 'load', 'the line', 'jobs'])) return stationsAnswer(ctx);
    // a day alone is not yet a question ('pizza tonight'): Watar offers the one it may be, and the usual ones
    if (win && !has(t, DAY_ASK)) {
      const q = `What ${win.to < 0 ? 'was' : 'is'} due ${win.say || `on ${V.day(V.U(`${S.dayIso}T00:00`).getTime() + win.from * DAY)}`}?`;
      return answer('unknown', `${win.say || 'a day'}, with no question about it`, 'I couldn’t tie that to Sufra’s work. Did you mean:', { choices: { label: 'Did you mean', items: [q].concat(starters(ctx).slice(1, 3)).map((x) => ({ q: x, t: x })) } });
    }
    if (win || has(t, ['due', 'deadline', 'deadlines'])) return dueAnswer(win || { from: 0, to: 1, say: 'by tomorrow' }, ctx);
    if (j) return orderAnswer(j, ctx);
    // a capitalised name Watar doesn't know, after for, is, did or has
    const name = /\b(?:for|is|did|has|does|ask|about)\s+([A-Z][a-z]+)\b/.exec(text);
    if (name && !TOKENS.has(name[1].toLowerCase()) && !['Sufra', 'Watar', 'Iqaa', 'The', 'Today', 'Tomorrow'].includes(name[1])) {
      return answer('stranger', `a person called ${name[1]}`, `${name[1]} isn’t on Sufra’s team in Iqaa. The team: ${both(people.map((p) => p.name))}.`, { next: nextOf(['Who is busiest?', 'What is waiting for Reem?'], ctx) });
    }
    return answer('unknown', 'nothing on the line', 'I couldn’t tie that to Sufra’s work. I answer about orders, people, stations and times on the line, for example:', { choices: { label: 'Questions to start with', items: starters(ctx).map((q) => ({ q, t: q })) } });
  }

  // which order: the live ones that match, sorted by due; finished matches named in a hint
  function clarify(list, fin, intent) {
    const word = (() => { const w = list.map((j) => eventOf(j)); return w.every((x) => x === w[0]) ? `${w[0]}${w[0].endsWith('h') ? 'es' : 's'}` : 'orders'; })();
    const hint = fin && fin.length ? `${both(fin.map((j) => j.title))} ${fin.length === 1 ? 'is' : 'are'} finished.` : '';
    return answer('clarify', 'which order?', `${num(list.length)} orders on the line are ${word}. Which one?`, { notes: hint ? [hint] : [], pending: intent,
      choices: { label: 'Which order?', pending: intent, items: list.map((j) => ({ q: j.title, t: `${j.title} · ${V.day(j.iso)}` })) } });
  }

  function lateAnswer(ctx) {
    const t = ctx.now, lateNow = live.filter(V.late), all = risksAt(t, ctx), risks = all.filter((r) => !r.settled), settled = all.filter((r) => r.settled);
    let lead = lateNow.length ? `${num(lateNow.length)} ${lateNow.length === 1 ? 'order is' : 'orders are'} late: ${both(lateNow.map((j) => j.title))}.` : 'No one is late.';
    if (risks.length) lead += ` ${num(risks.length)} ${risks.length === 1 ? 'order is' : 'orders are'} at risk: for ${risks.length === 1 ? 'it' : 'each'}, ${risks.every((r) => r.why === 'reminder') ? 'the line’s reminder to the client would come after the event' : 'a timed wait would end after the event'}.`;
    else if (!settled.length) lead += ' Every timed wait on the line ends before its event.';
    settled.forEach((r) => { lead += ` ${remindedSaid(r, t)}, so the ${eventOf(r.j)} no longer waits on the line’s reminder.`; });
    // the line change is about the wait that made every one of them, settled or not
    const notes = [], drafts = [], change = lineChange(all);
    if (change) notes.push(`${all.length === 2 ? 'Both come' : 'They all come'} from one step of the line: ${V.gate.steps.find((x) => x.kind === 'rest').name}, at ${V.gate.name}.`);
    const today = live.filter((j) => V.days(j.iso) === 0 && !V.delivered(j) && !all.some((r) => r.j === j));
    today.forEach((j) => { const w = waitsOn(j), p = J.station(j.at); notes.push(`Due today and on time: ${j.title} at ${V.hm(j.iso)}, ${w.kind === 'team' ? `with ${w.who} at ${p.st.name}` : `${w.said}`}.`); });
    live.filter((j) => V.days(j.iso) < 0 && V.delivered(j)).forEach((j) => notes.push(`${j.title} was on ${V.day(j.iso)}. It is delivered; Iqaa is ${K.doing(J.stepOf(j), j, short(j))}.`));
    // what was decided here already is said in the reasons, not drafted again
    risks.forEach((r) => { if (r.why === 'reminder' && r.gone && !decided(ctx, `remind:${r.j.code}`)) drafts.push(remindPlan(r.j, null, ctx).draft); });
    if (change && !decided(ctx, change.key)) drafts.push(change);
    const cap = [risks.length ? `At risk · ${risks.length}` : '', settled.length ? `${risks.length ? 'reminded' : 'Reminded'} early · ${settled.length}` : ''].filter(Boolean).join(' · ');
    return answer('late', `late or at risk, at ${V.hm(t)}`, lead, {
      parts: all.length || lateNow.length ? [{ type: 'rows', cap: cap || `Late · ${lateNow.length}`, rows: lateNow.map((j) => ({ j })).concat(all.map((r) => ({ j: r.j, r }))) }] : [],
      notes: notes.slice(0, 3), drafts: drafts.filter(Boolean).slice(0, 2), links: [{ href: 'orders.html', t: 'See them in Orders', i: 'Orders' }],
      next: nextOf(all.map((r) => `Why is ${r.j.title} waiting?`).concat([`What happens at ${V.gate.name}?`, 'What is due by tomorrow?']), ctx) });
  }

  function orderAnswer(j, ctx, how) {
    const t = ctx.now, x = J.stepOf(j), C = short(j), w = waitsOn(j), r = riskOf(j, t, ctx), since = sinceOf(j), ev = eventOf(j);
    const read = `${j.title}, ${j.code}${how ? (how === 'yes' ? ', on time?' : ', late?') : ''}`;
    if (j.finished) {
      return answer('order', read, `${j.title} finished ${j.finished}. Every station signed it.`, { parts: [{ type: 'order', j }], links: [orderLink(j), { href: `client.html?c=${j.ck}`, t: `All of ${K.get(j.ck).name}’s orders`, i: 'History' }],
        next: nextOf([`Has ${K.get(j.ck).name} ordered before?`, 'How long do orders take?'], ctx) });
    }
    let lead;
    if (w.kind === 'team') {
      lead = /^Watar drafts/.test(x.name)
        ? `${j.title} is waiting for ${x.who}. I drafted its quote ${since ? atOn(since) : ''}, and ${x.who} hasn’t checked it yet.`
        : `${j.title} is with ${x.who}: ${K.doing(x, j, C)}, since ${V.at(since)}.`;
    } else if (w.kind === 'client') lead = `${j.title} is waiting for ${C}’s answer to the quote, since ${V.at(since)}.`;
    else if (w.kind === 'rest') lead = `${j.title} is in a timed wait: ${w.said}.`;
    else lead = `${j.title} is running by itself: Iqaa is ${w.said}.`;
    if (V.late(j)) lead = `${how === 'yes' ? 'No. ' : how ? 'Yes. ' : ''}${lead} It was due ${V.label(j.iso)}, and it is late.`;
    else if (r) lead = `${how === 'yes' ? 'Not for certain. ' : how ? (r.settled ? 'Not yet. ' : 'Not yet, but it is at risk. ') : ''}${lead} ${how || r.settled ? '' : 'It is at risk. '}${riskSaid(j, r, ctx)}`;
    else if (how && V.delivered(j)) {
      // the event has passed and Yusuf has been: on time is what the delivery was
      const f = K.facts(j), onTime = !f.late;
      lead = `${(how === 'yes') === onTime ? 'Yes' : 'No'}. ${j.title} was on ${V.label(j.iso)}${f.arrived ? `, delivered at ${V.hm(f.arrived)}${f.late ? `, ${f.late} min late` : ', on time'}` : ''}. Iqaa is ${K.doing(x, j, C)}.`;
    } else if (how) {
      // the answer to 'is it on time?': where it waits, the timed waits after that, and the event beyond them
      const ahead = J.ahead(j).filter((a) => a.x.kind === 'rest' && a.st !== V.gate);
      const waits = { team: `waits for ${x.who} to ${todo(x)}`, client: `waits for ${C}’s answer`, rest: `is in a timed wait: ${w.said}`, run: `is running by itself: Iqaa is ${w.said}` }[w.kind];
      lead = `${how === 'yes' ? 'Yes' : 'No'}. ${j.title} ${waits}, since ${V.at(since)}${ahead.length ? `; then the line waits ${lc(ahead[0].x.who)} ${ahead[0].x.name.replace(/^Wait /, '')}` : ''}, ${V.U(j.iso).getTime() - t >= DAY ? 'long ' : ''}before ${V.at(j.iso)}.`;
    } else if (V.delivered(j)) {
      const f = K.facts(j);
      lead += ` The ${ev} was on ${V.label(j.iso)}${f.arrived ? `, delivered at ${V.hm(f.arrived)}${f.late ? `, ${f.late} min late` : ', on time'}` : ''}.`;
    } else lead += ' Nothing has failed, and it isn’t at risk.';
    const notes = [], links = [orderLink(j)], drafts = [];
    if (w.kind === 'team' && j.at === 'quote') notes.push(`I won’t ${/^Watar drafts/.test(x.name) ? 'check the quote' : todo(x)} for ${x.who}.`);
    if (w.kind === 'team') links.push(todayLink(x.who));
    if (r && r.why === 'reminder' && !decided(ctx, `remind:${j.code}`)) { const p = remindPlan(j, null, ctx); if (p.draft) drafts.push(p.draft); else if (p.no) notes.push(p.no); }
    return answer('order', read, lead, { parts: [{ type: 'order', j, r }], notes, drafts, links: links.filter(Boolean),
      next: nextOf([w.kind === 'team' ? `What is waiting for ${x.who}?` : `What happens at ${J.station(j.at).st.name}?`, `Has ${K.get(j.ck).name} ordered before?`, 'Who is late today?'], ctx) });
  }

  function personAnswer(k, ctx) {
    const p = S.people[k], you = k === ctx.viewer, name = you ? 'you' : p.name, w = mineOf(p.name), t = ctx.now;
    const risks = risksAt(t, ctx).filter((r) => !r.settled).map((r) => r.j);
    const at = [...new Set(w.map((j) => J.station(j.at).st.name))];
    let lead = w.length ? `${num(w.length)} ${w.length === 1 ? 'order waits' : 'orders wait'} for ${name}, ${at.length === 1 ? `${w.length > 1 ? 'all ' : ''}at ${at[0]}` : `at ${both(at)}`}.` : `Nothing waits for ${name} right now.`;
    if (w.length > 1) lead += ` ${w[0].title} is due first${risks.includes(w[0]) ? `, and it is one of the ${num(risks.length).toLowerCase()} at risk` : ''}.`;
    else if (w.length === 1) lead = `One order waits for ${name}: ${w[0].title}, at ${at[0]}${risks.includes(w[0]) ? '. It is at risk' : ''}.`;
    const coming = live.filter((j) => !w.includes(j)).map((j) => { const a = J.ahead(j), n = a.findIndex((s) => isPerson(s.x.kind) && s.x.who === p.name); return n < 0 ? null : { j, n, st: a[n].st }; })
      .filter(Boolean).sort((a, b) => a.n - b.n);
    return answer('person', `what waits for ${you ? 'you' : p.name}`, lead, { parts: [{ type: 'person', p, w, coming: coming[0] || null, you }],
      links: [{ href: `today.html?as=${k}`, t: you ? 'Open your Today' : `Open ${p.name}’s Today`, i: 'Today' }],
      next: nextOf(w.length ? [`Why is ${w[0].title} waiting?`, `What happens at ${J.station(w[0].at).st.name}?`, 'Who is busiest?'] : ['Who is busiest?', 'Where are the jobs?'], ctx) });
  }

  function teamAnswer(ctx) {
    const rows = people.map((p) => ({ p, w: mineOf(p.name), d: S.done.filter((d) => d.who === p.name) })).sort((a, b) => b.w.length - a.w.length);
    const top = rows[0], rest = rows.slice(1), same = rest.every((r) => r.w.length === rest[0].w.length);
    const at = [...new Set(top.w.map((j) => J.station(j.at).st.name))];
    const lead = `${top.p.name} has the most waiting: ${plural(top.w.length, 'order')}${at.length === 1 && top.w.length > 1 ? `, all at ${at[0]}` : ''}.${same && rest.length ? ` ${both(rest.map((r) => r.p.name))} have ${rest[0].w.length === 1 ? 'one each' : `${rest[0].w.length} each`}.` : ''}`;
    return answer('team', 'the team’s load', lead, { parts: [{ type: 'team', rows: people.map((p) => rows.find((r) => r.p === p)) }], next: nextOf([`What is waiting for ${top.p.name}?`, 'Where are the jobs?'], ctx) });
  }

  // what a station's orders wait on, in a few words
  function waitPhrase(js) {
    const team = [...new Set(js.filter((j) => waitsOn(j).kind === 'team').map((j) => waitsOn(j).who))];
    const cl = js.filter((j) => waitsOn(j).kind === 'client').map(short);
    const runs = js.filter((j) => !['team', 'client'].includes(waitsOn(j).kind)).map((j) => waitsOn(j).said);
    return [team.length ? `with ${both(team)}` : '', cl.length ? `waiting for ${both(cl)}` : ''].concat(runs).filter(Boolean).join('; ');
  }
  function stationsAnswer(ctx) {
    const branch = line.routes.find((r) => r.type === 'branch');
    const rows = [];
    J.main.forEach((s) => { rows.push({ s, js: live.filter((j) => j.at === s.id) }); if (branch && branch.from === s.id) branch.stations.forEach((b) => rows.push({ s: b, js: live.filter((j) => j.at === b.id), br: true })); });
    const top = rows.slice().sort((a, b) => b.js.length - a.js.length)[0], w0 = top.js.length && waitsOn(top.js[0]);
    const all = w0 && top.js.every((j) => { const w = waitsOn(j); return w.kind === w0.kind && w.who === w0.who; });
    const lead = `${top.s.name} holds the most: ${top.js.length} of ${live.length} orders${all && w0.who ? `, all waiting for ${w0.who}` : ''}.`;
    return answer('stations', 'where the jobs are', lead, { parts: [{ type: 'stations', rows: rows.map((r) => Object.assign(r, { top: r === top, say: waitPhrase(r.js) })) }],
      links: [{ href: 'orders.html', t: 'See them in Orders', i: 'Orders' }], next: nextOf([`What happens at ${top.s.name}?`, 'Who is busiest?', 'Who is late today?'], ctx) });
  }

  function stationAnswer(st, ctx) {
    const xs = st.steps, wait = xs.find((x) => x.kind === 'rest'), client = xs.find((x) => x.who === 'The client');
    const runs = (x) => `Iqaa ${lc(x.name).replace(/^(\w+)/, (v) => `${v}s`)}`;
    const said = xs.map((x) => (x.kind === 'run' ? runs(x) : x.kind === 'rest' ? `the line waits ${lc(x.who)}${x.name === `Wait ${lc(x.who)}` ? '' : x.name.replace(/^Wait/, '')}` : x.kind === 'held' && x.who !== 'The client' ? `${x.name} and waits for ${x.who}` : x.name));
    const lead = client && wait ? `${st.name} waits for the client to approve the quote. If they don’t answer in ${lc(wait.who)}, the line reminds them.` : `At ${st.name}, ${both(said)}.`;
    const here = live.filter((j) => j.at === st.id).sort(byIso), risks = risksAt(ctx.now, ctx), change = st === V.gate ? lineChange(risks) : null;
    const notes = [], open = risks.filter((r) => !r.settled && r.why === 'reminder').map((r) => r.j.title);
    if (change && open.length) notes.push(`${both(open)} ${open.length === 1 ? 'is' : 'are'} at risk because of this wait: the line’s reminder would come after the event.`);
    return answer('station', `the ${st.name} station`, lead, { parts: [{ type: 'station', st, here }], notes, drafts: change && !decided(ctx, change.key) ? [change] : [],
      links: [{ href: `orders.html?at=${st.id}`, t: `See ${st.name}’s orders`, i: 'Orders' }, { href: 'line.html', t: 'Open the line', i: 'Line' }],
      next: nextOf(['Where are the jobs?', 'Who is late today?'], ctx) });
  }

  // where an order whose event has passed stands: 'delivered at 17:20, on time; Iqaa is sending the invoice'
  function pastSaid(j) {
    const f = K.facts(j), dv = f.arrived ? `delivered at ${V.hm(f.arrived)}${f.late ? `, ${f.late} min late` : ', on time'}; ` : '';
    return `${dv}${j.finished ? `finished ${j.finished}` : V.delivered(j) ? `Iqaa is ${K.doing(J.stepOf(j), j, short(j))}` : `it is late, ${waitsOn(j).said}`}`;
  }
  function dueAnswer(win, ctx) {
    const from = win.from, to = win.to;
    const a = V.U(`${S.dayIso}T00:00`).getTime(), say = win.say || `on ${V.day(a + from * DAY)}`;
    // a window before today: every order whose event fell in it, delivered or finished, in the past tense
    if (to < 0) {
      const list = ALL.filter((j) => { const d = V.days(j.iso); return d >= from && d <= to; }).sort(byIso), n = list.length;
      const late = list.filter((j) => K.facts(j).late || V.late(j)), span = from === to ? V.day(a + from * DAY) : `${V.day(a + from * DAY).replace(/ \w+$/, '')} – ${V.day(a + to * DAY)}`;
      const lead = !n ? `Nothing was due ${say}.` : n === 1 ? `One order was due ${say}: ${list[0].title}, ${pastSaid(list[0])}.`
        : `${num(n)} orders were due ${say}. ${late.length ? `${both(late.map((j) => j.title))} ${late.length === 1 ? 'was' : 'were'} late; the rest arrived on time.` : 'Every one arrived on time.'}`;
      return answer('due', from === to && !win.say ? `due ${say}` : `due ${say} (${span})`, lead, { parts: n ? [{ type: 'past', cap: `Due ${say} · ${n}`, list }] : [],
        links: [{ href: 'orders.html', t: 'See them in Orders', i: 'Orders' }], next: nextOf(['What is due today?', 'How long do orders take?', 'Who is late today?'], ctx) });
    }
    const list = live.filter((j) => { const d = V.days(j.iso); return d >= from && d <= to && !V.delivered(j); }).sort(byIso);
    const risks = list.filter((j) => { const r = riskOf(j, ctx.now, ctx); return r && !r.settled; }), n = list.length, ok = n - risks.length;
    let lead = n ? `${num(n)} ${n === 1 ? 'order is' : 'orders are'} due ${say}.` : `Nothing is due ${say}.`;
    if (n === 1) lead += risks.length ? ' It is at risk.' : ' It is on time.';
    else if (n && risks.length) lead += ` ${both(risks.map((j) => j.title))} ${risks.length === 1 ? 'is' : 'are'} at risk; ${ok === 1 ? 'the other one is' : `the other ${num(ok).toLowerCase()} are`} on time.`;
    else if (n) lead += ' All of them are on time.';
    const notes = from === 0 ? live.filter((j) => V.days(j.iso) < 0 && V.delivered(j)).map((j) => `${j.title} was on ${V.day(j.iso)}. It is delivered; Iqaa is ${K.doing(J.stepOf(j), j, short(j))}.`) : [];
    const range = from === to ? V.day(a + from * DAY) : `${V.day(a + from * DAY).replace(/ \w+$/, '')} – ${V.day(a + to * DAY)}`;
    return answer('due', from === to && !win.say ? `due ${say}` : `due ${say} (${range})`, lead, { parts: n ? [{ type: 'rows', cap: `Due ${say} · ${n}`, rows: list.map((j) => ({ j })), more: true }] : [], notes,
      links: [{ href: 'orders.html', t: 'See them in Orders', i: 'Orders' }], next: nextOf(['Who is late today?', 'What is due this week?', 'Where are the jobs?'], ctx) });
  }

  function doneAnswer(ctx, who, week) {
    if (week) {
      const fin = S.jobs.filter((j) => j.finished).sort((a, b) => V.fromLabel(b.finished) - V.fromLabel(a.finished));
      return answer('done-week', 'orders finished in the last 7 days', `${num(fin.length)} orders finished in the last 7 days: ${both(fin.map((j) => j.title))}. Each walked the whole line.`, { parts: [{ type: 'finished', list: fin }], next: nextOf(['How long do orders take?', 'What is due this week?'], ctx) });
    }
    const p = who && S.people[who], ds = S.done.filter((d) => !p || d.who === p.name).sort((a, b) => a.time.localeCompare(b.time)), n = ds.length;
    const mine = Object.values(ctx.drafts).filter((d) => (d.state === 'approved' || d.state === 'sent') && (!p || d.by === p.name) && dayOff(d.at) === 0);
    const handed = ds.filter((d) => d.to), open = ds.filter((d) => !d.to);
    const you = who === ctx.viewer;
    let lead = n ? `${p ? `${you ? 'You' : p.name} did ${num(n).toLowerCase()} ${n === 1 ? 'step' : 'steps'}` : `${num(n)} ${n === 1 ? 'step was' : 'steps were'} done`} today, the last at ${ds[n - 1].time}.` : `${p ? `${you ? 'You haven’t' : `${p.name} hasn’t`} finished a step` : 'No step was finished'} on the line today yet.`;
    if (n > 1 && handed.length) lead += ` ${num(handed.length)} handed ${handed.length === 1 ? 'its' : 'their'} order on to the next station${open.length ? `; for ${both(open.map((d) => d.title))}, ${open[0].then}` : ''}.`;
    // what was decided here, or sent from a client's page, is said too, so the lead and the list under it agree
    const decidedSaid = (d) => `${d.from === 'page' ? 'sent' : d.state === 'approved' ? 'approved' : 'sent to the Line screen'} “${d.title}” ${d.from === 'page' ? 'from the client’s page' : 'here'} at ${V.hm(d.at)}`;
    if (mine.length) lead += ` ${p ? `${you ? 'You' : p.name} ${n ? 'also ' : ''}${both(mine.map(decidedSaid))}` : both(mine.map((d) => `${d.by} ${decidedSaid(d)}`))}.`;
    return answer('done', p ? `${p.name}’s steps today` : 'steps done today', lead, { parts: n || mine.length ? [{ type: 'done', ds, mine }] : [],
      next: nextOf(['Who is busiest?', 'What is waiting for Reem?', 'Who is late today?'], ctx) });
  }

  function leadAnswer(ctx) {
    const fin = ALL.filter((j) => j.finished).map((j) => ({ j, took: V.fromLabel(j.finished) - V.U(j.opened).getTime(), came: V.U(j.iso).getTime() - V.U(j.opened).getTime() }));
    const took = fin.map((o) => o.took).sort((a, b) => a - b), came = fin.map((o) => o.came).sort((a, b) => a - b), mid = took[Math.floor(took.length / 2)];
    const rs = risksAt(ctx.now, ctx).filter((r) => !r.settled).map((r) => ({ j: r.j, came: V.U(r.j.iso).getTime() - V.U(r.j.opened).getTime() }));
    const lead = `Sufra’s ${fin.length} finished orders took ${V.span(took[0])} to ${V.span(took[took.length - 1])} each, from the order to the invoice; half took under ${V.span(mid)}.`;
    const notes = [`Finished orders came in ${V.span(came[0])} to ${V.span(came[came.length - 1])} before their event.${rs.length ? ` ${both(rs.map((o) => `${o.j.title} came in ${V.span(o.came)} ahead`))}: ${rs.length === 2 ? 'those are the two' : 'the ones'} at risk.` : ''}`];
    const recent = fin.sort((a, b) => V.fromLabel(b.j.finished) - V.fromLabel(a.j.finished)).slice(0, 6);
    return answer('lead', 'how long orders take', lead, { parts: [{ type: 'lead', rows: recent, of: fin.length }], notes, next: nextOf(['Who is late today?', 'What finished in the last 7 days?'], ctx) });
  }

  function clientsAnswer(ctx) {
    const list = live.filter((j) => waitsOn(j).kind === 'client').sort(byIso), n = list.length;
    const item = list.map((j) => `${j.title}, for ${j.client}${j.of === 'a private order' ? '' : ` at ${j.of}`}, since ${V.at(sinceOf(j))}`);
    // each item has commas of its own, so the last one is joined with a comma too
    const said = item.length < 2 ? item.join('') : `${item.slice(0, -1).join(', ')}, and ${item[item.length - 1]}`;
    let lead = n ? `${num(n)} ${n === 1 ? 'order waits' : 'orders wait'} for a client to approve: ${said}.` : 'No order is waiting for a client’s answer.';
    const risky = list.filter((j) => { const r = riskOf(j, ctx.now, ctx); return r && !r.settled; });
    if (risky.length) lead += ` For ${both(risky.map((j) => j.title))}, the line’s reminder would come after the ${eventOf(risky[0])}.`;
    return answer('clients', 'orders waiting on clients', lead, { parts: n ? [{ type: 'rows', cap: `Waiting on clients · ${n}`, rows: list.map((j) => ({ j })) }] : [],
      drafts: risky.map((j) => remindPlan(j, null, ctx).draft).filter(Boolean).slice(0, 1), links: [{ href: 'clients.html', t: 'See them in Clients', i: 'Clients' }],
      next: nextOf(list.map((j) => `Remind ${short(j)}`).concat(['Who is late today?']), ctx) });
  }

  function historyAnswer(c, ctx) {
    const n = c.orders.length, first = c.first;
    const lead = `${c.name} has ${plural(n, 'order')} with Sufra since ${V.day(first.opened)}${c.open.length ? `; ${num(c.open.length).toLowerCase()} ${c.open.length === 1 ? 'is' : 'are'} open now` : ''}.`;
    return answer('history', `${c.name}’s orders`, lead, { parts: [{ type: 'history', c }], notes: [K.reading(c)], links: [{ href: `client.html?c=${c.key}`, t: `Open ${c.name}`, i: 'Clients' }],
      next: nextOf(c.soon ? [`Why is ${c.soon.title} waiting?`, 'Which clients haven’t answered?'] : ['Which clients haven’t answered?'], ctx) });
  }

  function predictAnswer(j, ctx) {
    const o = j || live.find((x) => waitsOn(x).kind === 'client');
    if (!o) return answer('predict', 'a prediction', 'I can’t know what a client will do. I can tell you when the line reminds them.');
    const C = short(o), c = V.chase(o, ctx.now);
    if (!c) return answer('predict', `a prediction about ${C}`, `I can’t know what ${C} will do. ${C} has already approved ${o.title}’s quote.`, { links: [orderLink(o)] });
    const lead = c.gone ? `I can’t know what ${C} will do. If ${C} hasn’t answered ${onAt(c.remindAt)}, ${lc(c.wait.who)} after the quote link, the line reminds ${C}.`
      : `I can’t know what ${C} will do. If ${C} hasn’t answered ${lc(c.wait.who)} after the quote link goes, the line reminds ${C}.`;
    return answer('predict', `a prediction about ${C}`, lead, { links: [orderLink(o)], next: nextOf([`Has ${K.get(o.ck).name} ordered before?`, `Why is ${o.title} waiting?`], ctx) });
  }

  function wontAnswer(t, j, ctx) {
    const o = j;
    if (has(t, ['cancel', 'delete'])) return answer('wont', 'a step Watar won’t take', 'I don’t cancel orders. Open the order to see where it stands.', { links: o ? [orderLink(o)] : [{ href: 'orders.html', t: 'See every order', i: 'Orders' }] });
    if (has(t, ['pay'])) return answer('wont', 'a step Watar won’t take', 'I don’t handle payments, and I can’t see money: every quote total is [TOTAL] until Sufra adds its price list.');
    if (has(t, ['assign'])) return answer('wont', 'a step Watar won’t take', `Each step’s person is set on the line, and I don’t move work between people. ${S.people[OWNER].name} changes who does a step on the Line screen.`, { links: [{ href: 'line.html', t: 'Open the line', i: 'Line' }] });
    const x = o && J.stepOf(o);
    if (has(t, ['send', 'skip'])) {
      if (x && isPerson(x.kind) && x.who !== 'The client' && o.at === 'quote') return answer('wont', 'a step Watar won’t take', `The quote link goes to ${short(o)} by itself once ${x.who} checks the prices. I don’t skip a person’s step.`, { links: [todayLink(x.who)].filter(Boolean) });
      return answer('wont', 'a step Watar won’t take', 'Messages go out from the line’s own steps, by themselves, after the person before them. I don’t skip a person’s step. I can draft a reminder for a client whose quote is waiting.', { next: nextOf(['Which clients haven’t answered?'], ctx) });
    }
    if (x && x.who === 'The client') return answer('wont', 'a step Watar won’t take', `Approving the quote is ${short(o)}’s step, from ${short(o)}’s link. I draft; I don’t approve for anyone.`, { links: [orderLink(o)] });
    if (x && isPerson(x.kind)) return answer('wont', 'a step Watar won’t take', `${o.at === 'quote' ? `Checking the quote is ${x.who}’s step, and approving it is ${short(o)}’s` : `That step is ${x.who}’s`}. I draft; I don’t approve for anyone.`, { links: [todayLink(x.who)].filter(Boolean) });
    return answer('wont', 'a step Watar won’t take', 'Every approval on Sufra’s line belongs to a person. I draft; I don’t approve for anyone.', { next: nextOf(['What is waiting for Reem?'], ctx) });
  }

  // ---------- reminders: the line's own step, run early or set for a time; never a new message ----------
  // when: 'now', a time in ms, or null for the default (now once the link has gone; Sufra's closing time if not)
  function remindPlan(j, when, ctx) {
    const t = ctx.now, C = short(j), c = V.chase(j, t), x = J.stepOf(j);
    if (!c) {
      const f = K.facts(j);
      return { no: j.finished || V.delivered(j) ? `${j.title} is ${j.finished ? 'finished' : 'delivered'}. There is nothing to remind ${C} about.`
        : `${C} approved ${j.title}’s quote${f.answered ? ` ${atOn(V.U(f.rounds[f.rounds.length - 1].answer).getTime())}` : ''}. There is nothing to remind ${C} about.` };
    }
    const why = (at) => (at <= t ? `${V.hm(at)} has passed: it is ${V.hm(t)} now.` : at >= c.ev ? `That is after the ${eventOf(j)} on ${V.label(c.ev)}.`
      : at >= c.remindAt ? `The line reminds ${C} ${onAt(c.remindAt)} anyway, before then.` : '');
    if (!c.gone) {
      const r = V.risk(j, t), waiting = isPerson(x.kind) ? `it waits for ${x.who}${/^Watar drafts/.test(x.name) ? ' to check it' : stepSaid(x, j)}` : `it is still at ${J.station(j.at).st.name}`;
      if (!r && when == null) return { no: `${j.title}’s quote hasn’t gone to ${C} yet: ${waiting}. There is nothing to remind ${C} about.` };
      const at = when == null || when === 'now' ? dayStart(t) + CLOSE : when;
      if (when === 'now') return { no: `${j.title}’s quote hasn’t gone to ${C} yet: ${waiting}. I can set a reminder for later today instead.`, retry: `Remind ${C} today at ${S.hours.close}` };
      const bad = at <= t ? `${V.hm(at)} has passed: it is ${V.hm(t)} now.` : at >= c.ev ? `That is after the ${eventOf(j)} on ${V.label(c.ev)}.` : '';
      if (bad) return { no: bad };
      return { draft: { type: 'remind', key: `remind:${j.code}`, code: j.code, when: at, gone: false, title: `Remind ${C} ${onAt(at)}`, waiting } };
    }
    if (when == null || when === 'now') return { draft: { type: 'remind', key: `remind:${j.code}`, code: j.code, when: 'now', gone: true, title: `Remind ${C} now` } };
    const bad = why(when);
    if (bad) return { no: bad };
    return { draft: { type: 'remind', key: `remind:${j.code}`, code: j.code, when, gone: true, title: `Remind ${C} ${onAt(when)}` } };
  }
  function remindAnswer(t, list, who, ctx) {
    const asked = live.filter((j) => waitsOn(j).kind === 'client').sort(byIso);
    // 'remind me about …' is the asker's own reminder, even with an order named: Today keeps those, not the client
    const self = has(t, ['remind me', 'remind us']);
    if (self || (!list.length && who && !t.split(' ').some((w) => TOKENS.has(w)))) {
      const k = self ? ctx.viewer : who, p = S.people[k], you = k === ctx.viewer, w = mineOf(p.name);
      return answer('remind-team', `remind ${you ? 'you' : p.name}`, `I draft reminders the line sends to clients. ${you ? 'Your Today lists what waits for you' : `${p.name}’s Today lists what waits for ${p.name}`}${w.length ? `, ${w[0].title} first` : ''}.`, { links: [{ href: `today.html?as=${k}`, t: you ? 'Open your Today' : `Open ${p.name}’s Today`, i: 'Today' }] });
    }
    if (list.length !== 1) {
      const items = list.length > 1 ? list.filter((j) => V.chase(j, ctx.now)) : asked;
      if (!items.length) return answer('remind', 'remind whom?', 'No client’s quote is waiting, so there is no one to remind.');
      const opts = items.map((j) => `${short(j)}, for ${j.title}`);
      return answer('clarify', 'remind whom?', `Who should I remind? I draft reminders to clients whose quote is waiting: ${opts.length < 2 ? opts[0] : `${opts.slice(0, -1).join(', ')}, or ${opts[opts.length - 1]}`}.`, {
        pending: 'remind', choices: { label: 'Who should I remind?', pending: 'remind', items: items.map((j) => ({ q: j.title, t: `${short(j)} · ${j.title}` })) } });
    }
    const j = list[0], C = short(j), done = decided(ctx, `remind:${j.code}`), c0 = V.chase(j, ctx.now);
    let when = timeIn(t, ctx.now), moved = '';
    if (done) return answer('remind', `remind ${C}, for ${j.title}`, `${C} was reminded ${done.when === 'now' ? `at ${V.hm(done.at)}` : onAt(done.when)}, ${done.from === 'page' ? 'sent' : 'approved'} by ${done.by}. The line still waits for ${C}’s answer.`, { links: [orderLink(j)] });
    // only today, or several days: the time is asked back, never guessed as now
    if (when === 'ask') {
      return answer('clarify', `remind ${C}, for ${j.title}: at what time?`, `At what time should I remind ${C}? Sufra works ${S.hours.open} to ${S.hours.close}. For example: “Remind ${C} tomorrow at 09:00”.`,
        { links: [orderLink(j)], next: [c0 && c0.gone ? `Remind ${C} now` : `Remind ${C} today at ${S.hours.close}`, `Remind ${C} tomorrow at ${S.hours.open}`] });
    }
    // a time outside Sufra's working hours moves to the next opening, and the answer says so
    if (typeof when === 'number') {
      const tod = when - dayStart(when);
      if (tod < OPEN || tod > CLOSE) {
        // the next opening still ahead: before it today, after it the next day's
        let to = dayStart(when) + (tod > CLOSE ? DAY : 0) + OPEN;
        if (to <= ctx.now) to += DAY;
        moved = `${V.hm(when)} is outside Sufra’s working hours, ${S.hours.open} to ${S.hours.close}, so I set it for ${onAt(to)}. `;
        when = to;
      }
    }
    // a day without a clock time is Sufra's opening hour that day
    const opens = typeof when === 'number' && !moved && !clockIn(t) ? ', when Sufra opens,' : '';
    const plan = remindPlan(j, when, ctx), read = `remind ${C}, for ${j.title}${typeof when === 'number' ? `, ${onAt(when)}` : ''}`;
    if (plan.no) return answer('remind', read, `${moved}${plan.no}`, { links: [orderLink(j)], next: plan.retry ? [plan.retry] : nextOf([`Why is ${j.title} waiting?`], ctx) });
    const d = plan.draft, c = V.chase(j, ctx.now);
    const lead = d.gone ? `${moved}The line’s own reminder to ${C} for ${j.title}, ${d.when === 'now' ? 'now' : `${onAt(d.when)}${opens}`} instead of ${onAt(c.remindAt)}. Nothing goes out until you approve it.`
      : `${moved}${j.title}’s quote hasn’t gone to ${C} yet, so I drafted a reminder for ${onAt(d.when)}${opens}, in case the link has gone and ${C} hasn’t answered by then. Nothing is set until you approve it.`;
    return answer('remind', read, lead, { drafts: [Object.assign({ asked: true }, d)], links: [orderLink(j)] });
  }

  // ---------- rendering the parts: the product's own rows, strips and lines ----------
  function stripData(j, r, t) {
    // set: a reminder decided here or on the client's page moved it; sent: and it has gone
    return { link: r.linkAt, done: !!r.gone, remind: r.remindAt, ev: r.ev, evName: cap(eventOf(j)), now: t, set: !!r.settled, sent: !!r.settled && r.remindAt <= t };
  }
  function riskBlock(j, r, ctx) {
    const why = reason(j, r, ctx);
    if (r.why !== 'reminder') return `<div class="aw-why"><p>${esc(why)}</p></div>`;
    return `<div class="aw-why"><p>${esc(why)}</p><div class="aw-ts" aria-hidden="true" data-ts="${esc(JSON.stringify(stripData(j, r, ctx.now)))}"></div></div>`;
  }
  function rowsPart(p, ctx) {
    const shown = p.rows.slice(0, 6);
    const li = shown.map(({ j, r }) => { const row = V.dueRow(j); return r ? row.replace(/<\/li>$/, `${riskBlock(j, r, ctx)}</li>`) : row; }).join('');
    const more = p.rows.length > 6 ? `<p class="aw-more"><a href="orders.html">See all ${p.rows.length} in Orders</a></p>` : '';
    return `<figure class="aw-fig"><figcaption class="aw-fc">${icon('Orders', 16)}<span>${esc(p.cap)}</span></figcaption><ol class="at-list aw-rows">${li}</ol>${more}</figure>`;
  }
  function stepRows(j, st) {
    const steps = V.clock(j).filter((s) => s.st === st);
    return steps.filter((s) => s.state !== 'skip').map((s) => {
      const x = s.x, who = isPerson(x.kind) ? (x.who === 'The client' ? j.client : x.who) : x.kind === 'rest' ? `Waits ${lc(x.who)}` : 'Runs by itself';
      const since = sinceOf(j);
      const w = s.state === 'done' ? (s.t != null ? `<time datetime="${V.iso(s.t)}">${V.at(s.t)}</time>` : 'Done')
        : s.state === 'now' ? `<b>${x.who === 'The client' ? `Waiting for ${esc(short(j))}` : isPerson(x.kind) ? `Now · waits for ${esc(x.who)}` : 'Now'}</b>${since ? ` since <time datetime="${V.iso(since)}">${V.at(since)}</time>` : ''}` : 'Next';
      return `<li class="os-step ${s.state}">${glyph(x.kind, { test: s.state === 'next' })}<span class="os-n"><b>${esc(x.name)}</b><span>${esc(who)}</span></span><span class="os-w">${w}</span></li>`;
    }).join('');
  }
  function orderPart(p, ctx) {
    const j = p.j, jr = V.journey(j), t = ctx.now;
    const head = `<div class="aw-oh"><code>${j.code}</code><a href="order.html?code=${j.code}">${esc(j.title)}</a><span>${esc(j.client)}, ${esc(j.of)} · ${j.people} people · due ${esc(j.due)}${j.finished ? '' : `, ${V.when(j.iso)}`}</span></div>`;
    if (j.finished) return `<figure class="aw-fig aw-one">${head}<div class="aw-jr"><div class="aw-jr-l">${jr.svg}</div><p class="aw-cap">${esc(jr.cap)}</p></div></figure>`;
    const st = J.station(j.at), x = J.stepOf(j), w = waitsOn(j), facts = [];
    const ring = w.kind === 'team' ? (s) => s.steps.some((y) => isPerson(y.kind) && y.who === w.who) : null;
    if (w.kind === 'team') {
      const mine = mineOf(w.who), n = mine.indexOf(j);
      facts.push([`On ${w.who}’s Today`, mine.length === 1 ? 'The only order waiting' : `${ord(n + 1)} of ${mine.length}${n > 0 ? `, after ${mine[n - 1].title}` : ''}`]);
    }
    if (j.draft) facts.push(['My draft', `${j.draft.items.join(', ')} · ${lc(j.draft.note.replace(/\.$/, ''))} · total ${j.draft.total}`]);
    const ahead = J.ahead(j), branch = line.routes.find((r) => r.type === 'branch' && j.people > r.over);
    const onBranch = branch && ahead.some((a) => branch.stations.includes(a.st));
    const bSaid = onBranch ? branch.stations.flatMap((s) => s.steps.map((y) => (y.kind === 'rest' ? `then the line waits ${lc(y.who)}${y.name === `Wait ${lc(y.who)}` ? '' : y.name.replace(/^Wait/, '')}` : y.name))).join(', ') : '';
    facts.push(['Ahead', `${plural(ahead.length, 'step')}.${onBranch ? ` With ${j.people} people it takes the branch for orders over ${branch.over}: ${bSaid}.` : ''}`]);
    const waits = ahead.filter((a) => a.x.kind === 'rest'), left = V.U(j.iso).getTime() - t;
    // an event that has passed has no time left: when it was, and when it was delivered
    const f = K.facts(j), arrived = f.arrived ? `, delivered at ${V.hm(f.arrived)}${f.late ? `, ${f.late} min late` : ', on time'}` : V.late(j) ? ', and it is late' : '';
    const leftSaid = left < 0 ? `The ${eventOf(j)} was on ${V.label(j.iso)}${arrived}.` : `${cap(V.span(left))} ${/^(a|an) \w+$/.test(V.span(left)) ? 'is' : 'are'} left.`;
    if (waits.length) {
      const hours = waits.reduce((v, a) => v + V.restHours(a.x.who), 0);
      const each = waits.map((a) => (a.st === V.gate ? `up to ${lc(a.x.who)} for ${short(j)}’s answer` : `${lc(a.x.who)} ${a.x.name.replace(/^Wait /, '')}`));
      facts.push(['Time', `The waits ahead take ${V.span(hours * HOUR)} at most: ${both(each)}. ${leftSaid}`]);
    } else facts.push(['Time', leftSaid]);
    if (p.r && p.r.why === 'reminder' && V.days(V.iso(p.r.ev - DAY)) === 0) facts.push(['Kitchen', `Its kitchen reminder, a day before, would be today at ${V.hm(p.r.ev - DAY)}; it runs when the order reaches Prepare.`]);
    const where = `<div class="aw-jr-s">${J.strip(j, ring)}<span>At <b>${esc(st.st.name)}</b> · step ${j.step + 1} of ${st.st.steps.length}</span></div>`;
    return `<figure class="aw-fig aw-one">${head}
<div class="aw-jr"><div class="aw-jr-l">${jr.svg}</div><p class="aw-cap">${esc(jr.cap)}</p></div>${where}
<h4 class="aw-sh">${glyph(x.kind)}<span>At ${esc(st.st.name)}</span></h4><ol class="aw-steps">${stepRows(j, st.st)}</ol>
<dl class="aw-dl">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
${p.r ? riskBlock(j, p.r, ctx) : ''}</figure>`;
  }
  function personPart(p) {
    const name = p.p.name, ring = (s) => s.steps.some((y) => isPerson(y.kind) && y.who === name);
    const rows = p.w.map((j) => {
      const x = J.stepOf(j), st = J.station(j.at).st, since = sinceOf(j);
      return `<li class="aw-mn"><div class="aw-mn-t"><code>${j.code}</code><a href="order.html?code=${j.code}">${esc(j.title)}</a><span class="hint">${j.people} people</span></div>
<div class="aw-mn-pos">${J.strip(j, ring)}</div>
<p class="aw-mn-now">${glyph(x.kind)}<span>At ${esc(st.name)}: ${esc(x.name)}${since ? ` · since ${V.at(since)}` : ''} · due ${esc(j.due)}</span></p></li>`;
    }).join('');
    const ds = S.done.filter((d) => d.who === name);
    const done = ds.length ? `<p class="aw-fn">${icon('Done', 16)}<span>Done today: ${ds.map((d) => `<time>${d.time}</time> ${esc(did(d))}`).join(' · ')}.</span></p>` : '';
    const next = p.coming ? `<p class="aw-fn">${icon('History', 16)}<span>Next to reach ${p.you ? 'you' : esc(name)}: ${esc(p.coming.j.title)}, at ${esc(p.coming.st.name)}.</span></p>` : '';
    return `<figure class="aw-fig"><figcaption class="aw-fc"><span class="av" aria-hidden="true">${esc(name.charAt(0))}</span><span>${esc(name)} · ${esc(p.p.role)}</span></figcaption>${rows ? `<ol class="aw-mini">${rows}</ol>` : ''}${done}${next}</figure>`;
  }
  function teamPart(p) {
    return `<figure class="aw-fig"><figcaption class="aw-fc">${icon('People', 16)}<span>The team today</span></figcaption><ol class="aw-team">${p.rows.map((r) => `<li><a class="aw-tm" href="today.html?as=${r.p.k}">
<span class="av" aria-hidden="true">${esc(r.p.name.charAt(0))}</span><span class="aw-tm-t"><b>${esc(r.p.name)}</b><span>${esc(r.p.role)}</span></span>
<span class="aw-tm-n"><i>${r.w.length}</i> waiting · <i>${r.d.length}</i> done today</span></a></li>`).join('')}</ol></figure>`;
  }
  function stationsPart(p) {
    return `<figure class="aw-fig"><figcaption class="aw-fc">${icon('Line', 16)}<span>Sufra’s line now</span></figcaption><ol class="aw-st">${p.rows.map((r) => `<li class="${r.br ? 'br' : ''}${r.top ? ' most' : ''}${r.js.length ? '' : ' none'}"><a href="orders.html?at=${r.s.id}">
<span class="aw-st-n">${esc(r.s.name)}${r.br ? '<small>orders over 30 people</small>' : ''}</span><span class="aw-st-c">${r.js.length}</span><span class="aw-st-w">${esc(r.say || 'Nothing here now')}</span></a></li>`).join('')}</ol></figure>`;
  }
  function stationPart(p) {
    const st = p.st;
    const steps = st.steps.map((x) => {
      const who = x.who === 'The client' ? 'the client, from their link' : isPerson(x.kind) ? x.who : x.kind === 'rest' ? `a timed wait of ${lc(x.who)}` : 'runs by itself';
      const msg = x.msg ? `<span class="aw-msg">${esc(x.msg)}</span>` : '';
      return `<li class="os-step">${glyph(x.kind)}<span class="os-n"><b>${esc(x.name)}</b><span>${esc(who)}</span>${msg}</span></li>`;
    }).join('');
    const routes = line.routes.filter((r) => r.from === st.id).map((r) => (r.type === 'back' ? `Back to ${J.station(r.to).st.name} when ${lc(r.when)}`
      : `Over ${r.over} people: on to ${r.stations.map((s) => s.name).join(', ')}, rejoining at ${J.station(r.to).st.name}; the rest go to ${J.station(J.nextStation({ people: 0 }, st.id)).st.name}`));
    const br = line.routes.find((r) => r.type === 'branch' && r.stations.includes(st));
    if (br) routes.push(`On the branch for orders over ${br.over} people, from ${J.station(br.from).st.name} to ${J.station(br.to).st.name}`);
    const here = p.here.length ? `<h4 class="aw-sh">${icon('Orders', 16)}<span>There now · ${p.here.length}</span></h4><ol class="at-list aw-rows">${p.here.map(V.dueRow).join('')}</ol>` : `<p class="aw-fn">${icon('Done', 16)}<span>No order is at ${esc(st.name)} now.</span></p>`;
    return `<figure class="aw-fig"><figcaption class="aw-fc">${icon('Line', 16)}<span>${esc(st.name)} · ${plural(st.steps.length, 'step')}</span></figcaption><ol class="aw-steps">${steps}</ol>
${routes.length ? `<ul class="aw-routes">${routes.map((r) => `<li>${icon('Condition', 16)}<span>${esc(r)}</span></li>`).join('')}</ul>` : ''}${here}</figure>`;
  }
  function donePart(p) {
    const rows = p.ds.map((d) => { const s = pastOf(d); return `<li><time>${d.time}</time>${glyph('struck')}<span><b>${esc(d.who)} ${esc(s.v)}${s.what ? ` ${esc(s.what)}` : ''}</b> · <a href="order.html?code=${d.code}">${esc(d.title)}</a> <code>${d.code}</code>${d.then ? `<span class="aw-then">${esc(d.then)}.</span>` : ''}</span></li>`; })
      .concat(p.mine.map((d) => `<li><time>${V.hm(d.at)}</time>${glyph(d.state === 'approved' ? 'struck' : 'held')}<span><b>${esc(d.by)} ${d.from === 'page' ? 'sent' : d.state === 'approved' ? 'approved' : 'sent to the Line screen'}</b>: ${esc(d.title)}<span class="aw-then">${d.from === 'page' ? 'From the client’s page.' : 'Decided here, in this conversation.'}</span></span></li>`));
    return `<figure class="aw-fig"><figcaption class="aw-fc">${icon('Done', 16)}<span>Done today · ${rows.length}</span></figcaption><ol class="aw-done">${rows.join('')}</ol></figure>`;
  }
  const dh = (v) => `${Math.floor(v / DAY)} d ${Math.floor((v % DAY) / HOUR)} h`;
  function leadPart(p) {
    return `<figure class="aw-fig"><figcaption class="aw-fc">${icon('History', 16)}<span>The ${p.rows.length} most recent of ${p.of} finished</span></figcaption>
<table class="aw-lt"><thead><tr><th scope="col">Order</th><th scope="col">Came in</th><th scope="col">Took</th></tr></thead><tbody>${p.rows.map((o) => `<tr><th scope="row"><a href="order.html?code=${o.j.code}">${esc(o.j.title)}</a><span>${esc(o.j.finished.split(',')[0])}</span></th><td>${dh(o.came)}</td><td>${dh(o.took)}</td></tr>`).join('')}</tbody></table>
<p class="aw-fn">${icon('Date', 16)}<span>Came in: from the order to its event. Took: from the order to its invoice.</span></p></figure>`;
  }
  function finishedPart(p) {
    return `<figure class="aw-fig"><figcaption class="aw-fc">${icon('Done', 16)}<span>Finished in the last 7 days · ${p.list.length}</span></figcaption><ol class="aw-done">${p.list.map((j) => `<li><time>${esc(j.finished.split(', ')[1])}</time>${glyph('struck')}<span><b><a href="order.html?code=${j.code}">${esc(j.title)}</a></b> <code>${j.code}</code><span class="aw-then">${esc(j.client)}, ${esc(j.of)} · finished ${esc(j.finished)}</span></span></li>`).join('')}</ol></figure>`;
  }
  function historyPart(p) {
    const c = p.c, rows = c.open.concat(c.fin.slice().reverse()).slice(0, 6).map((j) => {
      const f = K.facts(j), ans = !f.rounds.length ? 'quote not sent yet' : f.open ? `waiting since ${V.at(f.open.sent)}` : `answered in ${V.words(f.took)}${f.reminded ? ', after the reminder' : ''}`;
      const dv = !f.arrived ? (j.finished ? '' : 'delivery ahead') : f.late ? `<span class="t-late">${f.late} min late</span>` : 'on time';
      return `<li><time>${esc(V.day(j.iso))}</time>${glyph(f.late ? 'failed' : j.finished ? 'struck' : 'held', { test: !j.finished && !f.open })}<span><b><a href="order.html?code=${j.code}">${esc(j.title)}</a></b> <code>${j.code}</code><span class="aw-then">${esc(ans)}${dv ? ` · ${dv}` : ''}</span></span></li>`;
    }).join('');
    return `<figure class="aw-fig"><figcaption class="aw-fc">${icon('Company', 16)}<span>${esc(c.name)} · ${plural(c.orders.length, 'order')}</span></figcaption><ol class="aw-done">${rows}</ol>${c.orders.length > 6 ? `<p class="aw-more"><a href="client.html?c=${c.key}#orders">See all ${c.orders.length} on ${esc(c.name)}’s page</a></p>` : ''}</figure>`;
  }
  // orders whose event has passed: the event's time, then its day, the delivery and where it stands now
  function pastPart(p) {
    return `<figure class="aw-fig"><figcaption class="aw-fc">${icon('History', 16)}<span>${esc(p.cap)}</span></figcaption><ol class="aw-done">${p.list.map((j) => `<li><time datetime="${V.iso(j.iso)}">${V.hm(j.iso)}</time>${glyph(K.facts(j).late ? 'failed' : 'struck', { test: !j.finished && !V.delivered(j) })}<span><b><a href="order.html?code=${j.code}">${esc(j.title)}</a></b> <code>${j.code}</code><span class="aw-then">${esc(V.day(j.iso))} · ${esc(pastSaid(j))}</span></span></li>`).join('')}</ol></figure>`;
  }
  const PARTS = { past: pastPart, rows: rowsPart, order: orderPart, person: personPart, team: teamPart, stations: stationsPart, station: stationPart, done: donePart, lead: leadPart, finished: finishedPart, history: historyPart };

  // the time strip: the line's timed wait at its real length, as the grammar's lifted pen, against the day and the event.
  // Now and the event are named above the axis, at their lines; the reminder under the axis, beside its own stroke, so
  // the labels never pile up where the event and the reminder meet
  function drawStrip(el) {
    const d = JSON.parse(el.dataset.ts), W = Math.max(240, Math.round(el.clientWidth)), pal = window.IQAA.pal.light;
    const t0 = dayStart(d.now), t1 = dayStart(Math.max(d.ev, d.remind)) + DAY;
    // cw: the advance of 12 px Fragment Mono, the strip's smallest type
    const x = (t) => 8 + ((t - t0) / (t1 - t0)) * (W - 16), k = 0.6, run = 24 * k, cw = 7.3, ROW = 15;
    // above: now and the event, clamped inside the strip; the later one drops a row when it would come within 16 px,
    // so two labels never read as one phrase
    const labels = [{ t: d.now, s: `Now ${V.hm(d.now)}`, c: 'nl' }, { t: d.ev, s: `${d.evName} · ${V.day(d.ev).split(' ')[0]} ${V.hm(d.ev)}`, c: 'el' }].sort((a, b) => a.t - b.t);
    let end = -Infinity;
    labels.forEach((l) => {
      const w = l.s.length * cw, cx = Math.min(Math.max(x(l.t), 4 + w / 2), W - 4 - w / 2);
      l.row = cx - w / 2 < end + 16 ? 1 : 0;
      if (!l.row) end = cx + w / 2;
      l.cx = cx;
    });
    const rows = labels.some((l) => l.row) ? 2 : 1, base = rows * ROW + 20, H = base + 26;
    // under: the reminder, centred on its stroke; a day's name gives way to it
    const a = x(d.link), b = x(d.remind), rs = `${d.sent ? 'Reminded' : d.set ? 'Reminder set' : 'Reminder'} · ${V.day(d.remind).split(' ')[0]} ${V.hm(d.remind)}`;
    const rw = rs.length * cw, rx = Math.min(Math.max(b + run / 2, 4 + rw / 2), W - 4 - rw / 2), rl = rx - rw / 2, rr = rx + rw / 2;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" dir="ltr" aria-hidden="true"><path class="day" d="M8 ${base}H${W - 8}"/>`;
    for (let m = t0, last = -Infinity; m <= t1; m += DAY) {
      const mx = x(m), s = `${V.day(m).split(' ')[0]} ${V.day(m).split(' ')[1]}`, sr = mx + 4 + s.length * cw;
      svg += `<path class="tk" d="M${mx} ${base}v6"/>`;
      if (sr < W && mx > last + 8 && (sr + 8 < rl || mx + 4 > rr + 8)) { svg += `<text class="dl" x="${mx + 4}" y="${base + 21}">${s}</text>`; last = sr; }
    }
    // the pen is up for the length of the wait: no stroke, a quiet band, its dot at the middle; the reminder is ink once sent
    svg += `<rect class="up" x="${a}" y="${base - 8}" width="${Math.max(0, b - a)}" height="16" rx="4"/><circle cx="${(a + b) / 2}" cy="${base}" r="${(3.2 * k * 0.9).toFixed(2)}" fill="${d.done ? pal.run : '#807E91'}"/>`;
    svg += IQ.cell('run', (a - run) / k, base / k, pal, k, !d.done) + IQ.cell('run', b / k, base / k, pal, k, !d.sent);
    const top = rows * ROW + 3;
    svg += `<path class="ev" d="M${x(d.ev)} ${top}V${base + 8}"/><path class="now" d="M${x(d.now)} ${top}V${base + 8}"/>`;
    svg += labels.map((l) => `<text class="${l.c}" x="${l.cx}" y="${12 + l.row * ROW}" text-anchor="middle">${esc(l.s)}</text>`).join('');
    svg += `<text class="rl" x="${rx}" y="${base + 21}" text-anchor="middle">${esc(rs)}</text>`;
    el.innerHTML = `${svg}</svg>`;
  }
  const strips = new ResizeObserver((es) => es.forEach((e) => { const w = Math.round(e.contentRect.width); if (w && w !== +e.target.dataset.w) { e.target.dataset.w = w; drawStrip(e.target); } }));
  function drawStrips(el) { $$('[data-ts]', el).forEach((s) => { drawStrip(s); strips.observe(s); }); }

  // ---------- drafts: one per key and question; a later answer shows a line pointing at it ----------
  const draftOf = (id) => conv.drafts[id];
  // a draft's id is its key and its question, with the conversation's round after the first: a new conversation never
  // meets, or points at, the drafts of the one it cleared
  const draftId = (key, n) => (conv.round ? `${key}@${conv.round}.${n}` : `${key}@${n}`);
  const thisRound = (d) => (d.round || 0) === (conv.round || 0);
  function latestOf(key, before) {
    return Object.entries(conv.drafts).filter(([, d]) => d.key === key && d.made < before && thisRound(d)).sort((a, b) => b[1].made - a[1].made)[0] || null;
  }
  const sameWhen = (d, p) => (p.type === 'line' ? d.len === p.len : d.when === p.when);
  // live: a new question decides now whether its proposal is a new draft, replaces a pending one, or points at one
  function place(p, n, live_) {
    const id = draftId(p.key, n);
    if (draftOf(id)) return { id };
    const prev = Object.entries(conv.drafts).filter(([, d]) => d.key === p.key && d.made < n && thisRound(d) && !['discarded', 'replaced'].includes(d.state)).sort((a, b) => b[1].made - a[1].made)[0];
    if (!live_) { const l = prev || latestOf(p.key, n); return l ? { ref: l[0] } : null; }
    // only a reminder asked for at another time replaces one waiting; any other answer points at what waits
    if (prev && (sameWhen(prev[1], p) || prev[1].state !== 'pending' || !p.asked)) return { ref: prev[0] };
    if (prev) Object.assign(prev[1], { state: 'replaced', at: now(), by: me.name, after: n, by_: id });
    conv.drafts[id] = Object.assign({ state: 'pending', made: n, round: conv.round || 0, q: conv.asked[n] ? conv.asked[n].q : '', qa: conv.asked[n] ? conv.asked[n].at : now() }, p);
    return { id, fresh: true };
  }
  const STATE_WORD = { pending: 'waits for you', approved: 'approved', sent: 'sent to the Line screen', discarded: 'discarded', replaced: 'replaced', elsewhere: 'sent from the client’s page' };
  function refHtml(id) {
    const d = draftOf(id);
    if (!d) return '';
    const what = d.state === 'pending' ? 'Drafted above' : d.state === 'approved' ? 'Approved above' : d.state === 'sent' ? 'Sent to the Line screen above' : `${cap(STATE_WORD[d.state])} above`;
    return `<p class="aw-ref" data-ref="${id}">${glyph(d.state === 'approved' ? 'struck' : 'held')}<span>${what}: ${esc(d.title)}${d.state === 'pending' ? ' · waits for you' : d.at ? ` · ${V.hm(d.at)}` : ''}</span> <button type="button" class="link" data-show="${id}" aria-label="Show the draft: ${esc(lc(d.title))}">Show</button></p>`;
  }
  function draftHtml(id) {
    const d = draftOf(id), j = d.code && ALL.find((x) => x.code === d.code), ok = d.state === 'approved', idn = id.replace(/[^\w-]/g, '-');
    if (d.state === 'discarded') return `<div class="aw-dr gone" data-d="${id}"><p>${icon('Discard', 16)}<span>Discarded: ${esc(d.title)} · ${V.hm(d.at)}</span> <button type="button" class="link" data-undo-d="${id}" aria-label="Undo: discard ${esc(lc(d.title))}">Undo</button></p></div>`;
    if (d.state === 'elsewhere') return `<div class="aw-dr gone" data-d="${id}"><p>${icon('Done', 16)}<span>Sent from the client’s page by ${esc(d.by)} · ${V.hm(d.at)}: ${esc(d.title)}</span></p></div>`;
    if (d.state === 'replaced') return `<div class="aw-dr gone" data-d="${id}"><p>${icon('History', 16)}<span>Replaced by the draft below · ${V.hm(d.at)}: ${esc(d.title)}</span> <button type="button" class="link" data-show="${d.by_}" aria-label="Show the draft that replaced it">Show</button></p></div>`;
    const by = ok ? `Approved by ${esc(d.by)} · ${V.hm(d.at)}` : d.state === 'sent' ? 'Draft from Watar · sent to the Line screen' : `Draft from Watar · ${d.type === 'line' ? 'for the line' : 'waits for you'}`;
    const head = `<p class="aw-dk"><span class="g" data-dk aria-hidden="true">${IQ.glyph(ok ? 'struck' : 'held')}</span><span>${by}</span></p><h3 id="aw-d-${idn}" tabindex="-1">${esc(d.title)}</h3>`;
    if (d.type === 'line') {
      const st = J.station(d.st).st, ver = S.version, xs = st.steps;
      const rows = xs.map((x) => (x.kind === 'rest' ? `<li class="chg">${glyph('rest', { test: true })}<span><b>Wait ${esc(lc(d.len))}</b> <span>was ${esc(lc(d.was))}</span></span></li>` : `<li>${glyph(x.kind)}<span>${esc(x.name)}</span></li>`)).join('');
      const act = d.state === 'sent' ? `<p class="aw-ok" tabindex="-1" data-status>${icon('Line', 16)}<span>Sent to the Line screen at ${V.hm(d.at)} · publish or discard it there</span></p><div class="aw-act"><a class="link aw-lk" href="line.html?wait=${d.st}:${encodeURIComponent(d.len)}">${icon('Line', 16)}<span>Open the line</span></a></div>`
        : `<div class="aw-act">${meKey === OWNER ? `<button type="button" class="btn" data-handoff="${id}" aria-label="Draft it on the Line screen: ${esc(lc(d.title))}">${icon('Line')}<span>Draft it on the Line screen</span></button>` : `<p class="aw-own">${icon('Lock', 16)}<span>The line is ${esc(S.people[OWNER].name)}’s to change.</span></p>`}<button type="button" class="link aw-lk" data-discard="${id}" aria-label="Discard: ${esc(lc(d.title))}">${icon('Discard', 16)}<span>Discard</span></button></div>`;
      return `<section class="aw-dr${d.state === 'sent' ? ' sent' : ''}" data-d="${id}" aria-labelledby="aw-d-${idn}">${head}
<p class="aw-dw">In the draft of version ${ver + 1}, ${esc(st.name)} waits ${esc(lc(d.len))} for the client’s answer before it reminds them.</p>
<ol class="aw-dl3">${rows}</ol>
<p class="aw-dn">Every new order’s client would be reminded ${esc(lc(d.len))} sooner. Running orders keep version ${ver}${d.risky.length ? `, so ${esc(d.risky[0])} still needs its own reminder` : ''}.</p>${act}</section>`;
    }
    const c = V.chase(j, d.qa), C = short(j), sched = d.when !== 'now', channel = (S.clients[j.ck] || {}).by === 'Email' ? 'Email' : 'WhatsApp';
    const what = !d.gone ? `If the quote link has gone and ${C} hasn’t answered by ${V.hm(d.when)}, Iqaa reminds ${C} then, instead of ${lc(c.wait.who)} after the link. For ${j.title} only.`
      : sched ? `Runs ${j.title}’s ‘${remindStep.name}’ ${onAt(d.when)} if ${C} hasn’t answered by then, instead of ${onAt(c.remindAt)}.` : `Runs ${j.title}’s ‘${remindStep.name}’ now, instead of ${onAt(c.remindAt)}.`;
    // the action's own strokes: a straight for now, a lifted pen then a straight for later; ink once it ran
    const pal = window.IQAA.pal.light, ran = ok && !sched;
    const strokes = `<svg class="aw-ds" viewBox="-3.2 -12 ${sched ? 54.4 : 30.4} 18" aria-hidden="true">${sched ? IQ.cell('rest', 0, 0, pal, 1, true) + IQ.cell('run', 24, 0, pal, 1, true) : IQ.cell('run', 0, 0, pal, 1, !ran)}</svg>`;
    const later = sched && ok && d.when > now();
    const status = ok ? `<p class="aw-ok" tabindex="-1" data-status>${glyph('run', { test: sched })}<span>${sched ? `Iqaa reminds ${esc(C)} ${onAt(d.when)} if ${esc(C)} hasn’t answered by then.` : `Iqaa runs the reminder now. ${esc(j.title)} still waits for ${esc(C)}’s answer.`}</span></p>` : '';
    const act = ok ? (later ? `<div class="aw-act"><button type="button" class="link aw-lk" data-takeback="${id}" aria-label="Take back: ${esc(lc(d.title))}">${icon('Undo', 16)}<span>Take it back</span></button></div>` : '')
      : `<div class="aw-act"><button type="button" class="btn primary" data-approve="${id}" aria-label="Approve: ${esc(lc(d.title))}">${icon('Done')}<span>Approve</span></button><button type="button" class="link aw-lk" data-discard="${id}" aria-label="Discard: ${esc(lc(d.title))}">${icon('Discard', 16)}<span>Discard</span></button><button type="button" class="link aw-lk" data-retime="${id}" aria-label="Change the time: ${esc(lc(d.title))}">${icon('Date', 16)}<span>Change the time</span></button></div>`;
    const wont = d.gone ? 'I won’t change the quote or the line.' : `I won’t send the quote: ${J.stepOf(j).who} checks my draft first.`;
    // once approved, what it does is said as what Iqaa now does
    return `<section class="aw-dr${ok ? ' approved' : ''}" data-d="${id}" aria-labelledby="aw-d-${idn}">${head}${status || `<p class="aw-dw">${esc(what)}</p>`}
<p class="aw-dm">${strokes}<span>${esc(C)} gets this from Sufra, by ${channel === 'Email' ? 'email' : 'WhatsApp'}:</span></p>
<p class="aw-msg">${esc(V.fill(remindStep.msg, j))}</p>
<p class="aw-dn">${icon('Lock', 16)}<span>${esc(wont)}</span></p>${act}</section>`;
  }

  // ---------- one exchange: the question, then Watar's answer ----------
  function partsHtml(a, n, live_) {
    const out = [];
    if (a.lead) out.push(`<p class="aw-lead">${esc(a.lead)}</p>`);
    if (a.intro) out.push(`<p class="aw-lead">${esc(a.intro)}</p>`);
    a.parts.forEach((p) => out.push(PARTS[p.type](p, a.ctx)));
    a.notes.forEach((t) => out.push(`<p class="aw-note">${esc(t)}</p>`));
    a.drafts.forEach((p) => { const r = place(p, n, live_); if (r) out.push(r.id ? draftHtml(r.id) : refHtml(r.ref)); });
    if (a.choices) {
      const pend = a.choices.pending ? ` data-pending="${a.choices.pending}"` : '';
      out.push(`<div class="aw-ch" role="group" aria-label="${esc(a.choices.label)}">${a.choices.items.map((c) => `<button type="button" class="aw-row" data-q="${esc(c.q)}"${pend}>${esc(c.t)}</button>`).join('')}</div>`);
    }
    const links = a.links.filter(Boolean);
    if (links.length) out.push(`<p class="aw-links">${links.map((l) => `<a href="${l.href}">${icon(l.i, 16)}<span>${esc(l.t)}</span></a>`).join('')}</p>`);
    if (a.next.length) out.push(`<div class="aw-next"><span class="aw-nk" aria-hidden="true">Ask next</span><ul class="aw-nl" aria-label="Ask next">${a.next.map((q) => `<li><button type="button" class="aw-nq" data-q="${esc(q)}">${esc(q)}</button></li>`).join('')}</ul></div>`);
    return out.join('\n');
  }
  const watarMark = `<span class="aw-mk"><span class="aw-w" aria-hidden="true">${icon('Ask Watar', 20)}</span></span>`;
  function answerHtml(a, n, live_) {
    return `${watarMark}<p class="aw-meta"><b>Watar</b> · <time datetime="${V.iso(a.at)}">${V.hm(a.at)}</time>${a.read ? `<span class="aw-read"><span class="aw-sep"> · </span>Read as: ${esc(a.read)}</span>` : ''}</p><div class="aw-parts">${partsHtml(a, n, live_)}</div>`;
  }
  function exchangeLi(item, n) {
    return `<li class="aw-x" data-n="${n}"><article aria-labelledby="aw-q-${n}">
<div class="aw-turn aw-q"><span class="aw-mk"><span class="aw-me" aria-hidden="true">${esc(me.name.charAt(0))}</span></span><p class="aw-meta"><b>${esc(me.name)}</b> · <time datetime="${V.iso(item.at)}">${V.hm(item.at)}</time></p><h2 id="aw-q-${n}" class="aw-qt">${esc(item.q)}</h2></div>
<div class="aw-turn aw-a" data-a></div></article></li>`;
  }

  // the context of question n: its time, the decisions made before it, and the questions before it
  function ctxFor(n, at, pending) {
    const drafts = {};
    Object.entries(conv.drafts).forEach(([id, d]) => { if (d.after != null && d.after <= n) drafts[id] = d; });
    // a reminder sent from the client's page before this question counts as decided too
    Object.entries(reminded()).forEach(([code, r]) => {
      const a = r.after && r.after[meKey];
      const j = ALL.find((x) => x.code === code);
      if (j && r.from === 'page' && (a != null ? a <= n : r.t <= at) && !Object.values(drafts).some((d) => d.key === `remind:${code}` && d.state === 'approved')) drafts[`page:${code}`] = { type: 'remind', key: `remind:${code}`, code, state: 'approved', when: 'now', at: r.t, by: r.by, from: 'page', title: `Remind ${short(j)} now` };
    });
    // asked: the questions so far, this one included, so 'Ask next' never offers the question just asked
    return { now: at, viewer: meKey, drafts, pending: pending || null, asked: conv.asked.slice(0, n + 1).map((x) => norm(x.q)) };
  }
  function run(n) {
    const item = conv.asked[n], ctx = ctxFor(n, item.at, item.pending);
    return Object.assign(ask(item.q, ctx), { at: item.at, ctx });
  }

  // ---------- the page ----------
  const thread = $('[data-thread]'), form = $('[data-ask]'), field = $('#aw-q'), go = $('.aw-go', form), err = $('#aw-err');
  const live_ = $('[data-live]');
  let lastPending = null;
  const say = (t) => { live_.textContent = ''; setTimeout(() => { live_.textContent = t; }, 50); };
  function renderOpening() {
    const ctx = ctxFor(0, conv.startedAt), a = Object.assign(opening(conv.startedAt, ctx), { at: conv.startedAt, ctx });
    return `<li class="aw-x aw-open"><article aria-labelledby="aw-q-o"><h2 class="sr" id="aw-q-o">Watar’s summary at ${V.hm(a.at)}</h2><div class="aw-turn aw-a">${answerHtml(a, -1, false)}</div></article></li>`;
  }
  function renderThread() {
    thread.innerHTML = renderOpening() + conv.asked.map(exchangeLi).join('');
    conv.asked.forEach((item, n) => {
      const a = run(n);
      $(`[data-n="${n}"] [data-a]`, thread).innerHTML = answerHtml(a, n, false);
      lastPending = a.pending;
    });
    drawStrips(thread);
    $('[data-new]').hidden = !conv.asked.length;
    renderDrafts();
  }

  // pending: the intent of the clarify turn a choice answers; undefined for typed words, which answer the last one
  async function asking(text, pending) {
    const q = text.trim().replace(/\s+/g, ' '), typed = pending === undefined;
    if (!q) { err.innerHTML = '<span>Write a question first, or pick one above.</span>'; err.hidden = false; field.setAttribute('aria-invalid', 'true'); field.focus(); return; }
    err.hidden = true; field.removeAttribute('aria-invalid');
    const n = conv.asked.length, at = now(), pend = typed ? lastPending : pending;
    conv.asked.push({ q, at, pending: pend || null });
    // words still in the field stay there when a row is pressed
    if (typed) { field.value = ''; conv.text = ''; grow(); }
    save();
    thread.insertAdjacentHTML('beforeend', exchangeLi(conv.asked[n], n));
    const li = thread.lastElementChild, slot = $('[data-a]', li);
    slot.innerHTML = `${watarMark}<p class="aw-meta"><b>Watar</b> · <time>${V.hm(at)}</time></p><div class="aw-parts"><p class="aw-lead aw-reading">Reading Sufra’s line…</p></div>`;
    $('[data-new]').hidden = false;
    $('h2', li).scrollIntoView({ block: 'start', behavior: reduce() ? 'auto' : 'smooth' });
    // for one beat Watar's mark ticks while the line is read; the composer waits with it
    field.readOnly = true; go.disabled = true;
    $('.aw-w', slot).classList.add('running');
    await Beats.wait(M.beat);
    const a = run(n);
    const before = Object.values(conv.drafts).filter((d) => d.state === 'pending').length;
    slot.innerHTML = answerHtml(a, n, true);
    save();
    lastPending = a.pending;
    // a draft this answer replaced says so where it stands
    $$('[data-d]', thread).forEach((el) => { const d = draftOf(el.dataset.d); if (d && d.state === 'replaced' && !el.classList.contains('gone')) el.outerHTML = draftHtml(el.dataset.d); });
    drawStrips(slot);
    // the question heads the view once its answer is long enough to let it
    if (Math.abs($('h2', li).getBoundingClientRect().top) > 40) $('h2', li).scrollIntoView({ block: 'start', behavior: reduce() ? 'auto' : 'smooth' });
    Beats.enter($('.aw-parts', slot));
    field.readOnly = false; go.disabled = false;
    const made = Object.values(conv.drafts).filter((d) => d.state === 'pending').length - before;
    say(`Watar: ${a.lead}${made > 0 ? ` ${made} ${made === 1 ? 'draft waits' : 'drafts wait'} for your approval.` : ''}`);
    renderDrafts();
  }

  // ---------- deciding a draft ----------
  function rerender(id) {
    const el = $(`[data-d="${CSS.escape(id)}"]`, thread);
    if (el) el.outerHTML = draftHtml(id);
    $$('[data-ref]', thread).forEach((r) => { r.outerHTML = refHtml(r.dataset.ref); });
    renderDrafts();
    return $(`[data-d="${CSS.escape(id)}"]`, thread);
  }
  function decide(id, state) {
    Object.assign(conv.drafts[id], { state, at: now(), by: me.name, after: conv.asked.length });
    save();
  }
  function approve(id) {
    decide(id, 'approved');
    const el = rerender(id), d = draftOf(id);
    // a reminder sent now is shown on the client's page too
    if (d.type === 'remind' && d.when === 'now') { try { const all = reminded(); all[d.code] = { from: 'watar', t: d.at, by: d.by }; sessionStorage.setItem('iqaa-reminded', JSON.stringify(all)); } catch (e) { /* storage blocked: this page only */ } }
    // the arch is rewritten as a loop in a quarter beat; a reminder that ran now is written in ink
    Beats.write($('[data-dk]', el), { each: M.quarter, gap: 0 });
    if (d.when === 'now') Beats.write($('.aw-ds', el), { each: M.quarter, gap: 0 });
    $('[data-status]', el).focus();
    say(`Approved: ${lc(d.title)}.`);
  }
  async function discard(id) {
    const el = $(`[data-d="${CSS.escape(id)}"]`, thread), h0 = el.offsetHeight;
    decide(id, 'discarded');
    $$('button', el).forEach((b) => { b.disabled = true; });
    await Beats.fadeOut(el);
    if (draftOf(id).state !== 'discarded') return;
    const fresh = rerender(id);
    Beats.resize(fresh, h0);
    $('[data-undo-d]', fresh).focus();
    say(`Discarded: ${lc(draftOf(id).title)}.`);
  }
  function restore(id) {
    Object.assign(conv.drafts[id], { state: 'pending', at: null, by: null, after: null });
    save();
    const el = rerender(id);
    $('h3', el).focus();
    say(`${draftOf(id).title} waits for you again.`);
  }
  function show(id) {
    const el = $(`[data-d="${CSS.escape(id)}"]`, thread);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: reduce() ? 'auto' : 'smooth' });
    ($('h3', el) || $('button, a', el)).focus({ preventScroll: true });
  }

  // ---------- the rail: what waits for you, what was decided here, and what Watar reads ----------
  function renderDrafts() {
    const ds = Object.entries(conv.drafts), pending = ds.filter(([, d]) => d.state === 'pending'), n = pending.length;
    const decidedHere = ds.filter(([, d]) => ['approved', 'sent', 'discarded'].includes(d.state)).sort((a, b) => a[1].at - b[1].at);
    $('[data-n-wait]').textContent = n;
    $('[data-wait]').innerHTML = n ? `<ul class="aw-wl">${pending.map(([id, d]) => `<li><button type="button" class="aw-wr" data-show="${id}">${glyph('held')}<span><b>${esc(d.title)}</b><span>${d.q ? `Asked in “${esc(d.q)}”` : 'From Watar'}${d.qa ? ` · ${V.hm(d.qa)}` : ''}</span></span></button></li>`).join('')}</ul>`
      : `<p class="aw-none">${icon('Done', 16)}<span>Nothing Watar drafted waits for you.</span></p>`;
    $('[data-decided]').innerHTML = decidedHere.map(([, d]) => `<li class="${d.state}">${d.state === 'discarded' ? icon('Discard', 16) : glyph(d.state === 'approved' ? 'struck' : 'held')}<span><b>${{ approved: 'Approved', sent: 'Sent to the Line screen', discarded: 'Discarded' }[d.state]}</b>: ${esc(d.title)} · <time>${V.hm(d.at)}</time></span></li>`).join('');
    $('[data-decided-h]').hidden = !decidedHere.length;
    // the person's count everywhere: the sidebar, the phone's dot
    const words = `${n === 1 ? 'draft waits' : 'drafts wait'} for you`;
    const nW = $('[data-n-watar]'), dot = $('[data-n-watar-dot]');
    if (nW) nW.innerHTML = n ? `${n}<span class="sr"> ${words}</span>` : '';
    if (dot) { dot.hidden = !n; dot.firstElementChild.textContent = n ? `${n} ${words}` : ''; }
    updateStrip();
  }
  // narrow screens: the drafts waiting show in the composer while none is in view
  const inView = new Set();
  const seer = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting) inView.add(e.target.dataset.d); else inView.delete(e.target.dataset.d); }); updateStrip(); });
  function updateStrip() {
    const pending = Object.entries(conv.drafts).filter(([, d]) => d.state === 'pending');
    $$('[data-d]', thread).forEach((el) => seer.observe(el));
    const strip = $('[data-strip]'), n = pending.length;
    strip.hidden = !n || pending.some(([id]) => inView.has(id));
    if (n) strip.innerHTML = `${glyph('held')}<span>${n} ${n === 1 ? 'draft waits' : 'drafts wait'} for you</span><button type="button" class="link" data-show="${pending[0][0]}" aria-label="Show the draft: ${esc(lc(pending[0][1].title))}">Show</button>`;
  }
  function renderReads() {
    const sig = `<a class="aw-sig" href="line.html" aria-label="Sufra’s line, version ${S.version}. Open the line."><span data-sig></span></a><p class="aw-sigc">Sufra’s line · version ${S.version}</p>`;
    const fin = S.jobs.filter((j) => j.finished).length;
    const html = `${sig}<ul class="aw-rd"><li>${icon('Orders', 16)}<span>${live.length} orders on the line · ${fin} finished in the last 7 days</span></li>
<li>${icon('People', 16)}<span>${people.length} people · ${S.done.length} steps done today</span></li>
<li>${icon('Date', 16)}<span>As of <time data-asof>${V.hm(now())}</time></span></li></ul>
<p class="aw-rn">Watar doesn’t see prices, messages or stock. Nothing it drafts goes out until a person approves it.</p>
<p class="aw-rn">In this prototype, Watar answers by fixed rules from Sufra’s demo data, in your browser.</p>`;
    $$('[data-reads]').forEach((el) => {
      el.innerHTML = html;
      Beats.sig($('[data-sig]', el), line.stations.map((s) => ({ name: s.name, steps: s.steps.map((x) => x.kind) })), { k: 0.5, names: false });
      $('[data-sig]', el).removeAttribute('role'); $('[data-sig]', el).removeAttribute('aria-label');
    });
  }

  // ---------- the composer ----------
  // the field grows from one line to four, then scrolls
  function grow() { field.style.height = 'auto'; field.style.height = `${Math.min(field.scrollHeight, 126)}px`; }
  form.addEventListener('submit', (e) => { e.preventDefault(); field.focus(); if (!field.readOnly) asking(field.value); });
  field.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!field.readOnly) asking(field.value); }
    if (e.key === 'ArrowUp' && !field.value && conv.asked.length) { e.preventDefault(); field.value = conv.asked[conv.asked.length - 1].q; grow(); }
    if (e.key === 'Escape' && field.value) { e.preventDefault(); field.value = ''; conv.text = ''; save(); grow(); }
  });
  field.addEventListener('input', () => { err.hidden = true; field.removeAttribute('aria-invalid'); conv.text = field.value; save(); grow(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || field.disabled) return;
    const a = document.activeElement;
    if (a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) return;
    e.preventDefault(); field.focus();
  });

  // ---------- presses ----------
  let undoNote = null, noteTimer = 0;
  function note(text, snapshot) {
    const el = $('[data-note]');
    $('[data-note-t]').textContent = text;
    undoNote = snapshot;
    $('[data-undo]', el).hidden = !snapshot;
    el.hidden = false;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => { el.hidden = true; undoNote = null; }, 8000);
  }
  function fresh() {
    const snap = JSON.stringify(conv);
    let n = 0;
    Object.values(conv.drafts).forEach((d) => {
      if (d.state === 'pending') { Object.assign(d, { state: 'discarded', at: now(), by: me.name }); n++; }
      // what was decided stays decided, before the new conversation
      d.after = 0; d.made = -1;
    });
    Object.assign(conv, { asked: [], startedAt: now(), round: (conv.round || 0) + 1 });
    save();
    lastPending = null;
    renderThread();
    note(`Conversation cleared.${n ? ` ${n} ${n === 1 ? 'draft' : 'drafts'} discarded with it.` : ''}`, snap);
    field.focus();
  }
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button, a[data-show]');
    if (!b || b.disabled) return;
    const d = b.dataset;
    // focus moves to the composer, except on a touch screen, where it would raise the keyboard over the answer
    if (d.q != null) { asking(d.q, d.pending != null ? d.pending : null); if (matchMedia('(pointer: fine)').matches) field.focus({ preventScroll: true }); }
    else if (d.approve) approve(d.approve);
    else if (d.discard) discard(d.discard);
    else if (d.undoD) restore(d.undoD);
    else if (d.takeback) restore(d.takeback);
    else if (d.show) show(d.show);
    else if (d.retime) { const x = draftOf(d.retime); field.value = `${x.title.replace(/ (now|today at .+|tomorrow at .+|on .+)$/, '')} at `; grow(); field.focus(); }
    else if (d.handoff) { const x = draftOf(d.handoff); decide(d.handoff, 'sent'); location.href = `line.html?wait=${x.st}:${encodeURIComponent(x.len)}`; }
    else if (b.hasAttribute('data-new')) fresh();
    else if (b.hasAttribute('data-undo') && undoNote) {
      conv = JSON.parse(undoNote); save(); renderThread();
      $('[data-note]').hidden = true; undoNote = null; field.focus();
      say('The conversation is back.');
    }
  });

  // ---------- start ----------
  // a reminder Watar drafted that went out from the client's page meanwhile is not offered again
  const sentEarly = reminded();
  Object.values(conv ? conv.drafts : {}).forEach((d) => { const r = d.type === 'remind' && d.when === 'now' && d.state === 'pending' && sentEarly[d.code] && sentEarly[d.code].from === 'page' && sentEarly[d.code]; if (r) Object.assign(d, { state: 'elsewhere', at: r.t, by: r.by, after: r.after && r.after[meKey] != null ? r.after[meKey] : conv.asked.length }); });
  if (conv) save();
  $$('[data-me-name]').forEach((el) => { el.textContent = me.name; });
  $$('[data-me-role]').forEach((el) => { el.textContent = me.access === 'owner' ? 'Owner' : me.role; });
  $$('[data-me-av]').forEach((el) => { el.textContent = me.name.charAt(0); });
  $('[data-now]').textContent = V.hm(now());
  setInterval(() => { $('[data-now]').textContent = V.hm(now()); $$('[data-asof]').forEach((el) => { el.textContent = V.hm(now()); }); }, 6e4);
  if (own) {
    // an organization made at sign-up has no orders yet: Watar has nothing to read
    $$('[data-org-name]').forEach((el) => { el.textContent = own.name; });
    document.title = `Ask Watar · ${own.name}`;
    thread.innerHTML = `<li class="aw-x aw-open"><article aria-label="Watar"><div class="aw-turn aw-a">${watarMark}<p class="aw-meta"><b>Watar</b></p><div class="aw-parts"><p class="aw-lead">Watar reads ${esc(own.name)}’s orders once your team adds one. Until then, try your line with a test job.</p><p class="aw-links"><a class="btn" href="line.html">${icon('Line')}<span>Open the line</span></a></p></div></div></article></li>`;
    $$('.aw-rail, [data-reads-d]').forEach((el) => { el.hidden = true; });
    return;
  }
  if (meKey !== 'hala') $$('.ap-l[href="watar.html"], .ap-ask').forEach((a) => { a.href = `watar.html?as=${meKey}`; });
  renderReads();
  renderThread();
  field.disabled = false; go.disabled = false;
  if (conv.text) { field.value = conv.text; grow(); }
  // a question in the address is asked once; the address then forgets it, so a reload never asks twice
  const q = params.get('q');
  if (q) {
    params.delete('q');
    history.replaceState(null, '', `${location.pathname}${params.toString() ? `?${params}` : ''}${location.hash}`);
    asking(q, null);
  } else if (conv.asked.length) {
    const last = $(`[data-n="${conv.asked.length - 1}"] h2`, thread);
    if (last) last.scrollIntoView({ block: 'start' });
  }
})();
