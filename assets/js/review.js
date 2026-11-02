// The client's review by link: what a client opens from a signed, temporary link the organization sent them, without
// an account. The organization leads with its own name and mark; Iqaa signs off once, at the foot. A link shares one
// item at one block and only what the line's owner chose to show (world.js `shares`): the item's title, a preview of
// its current version with the client's comments pinned to its moments, and the details picked for the client; never
// the team, the line or a secret field (the demo leaves them off the page, as the server would leave them out of what
// it sends). The client's decision moves the item for the visit (flow.js), so the item page, My work and Home show
// it: approving hands it on to the line's next block; asking for changes sends it back to its person with the
// client's comments.
(function () {
  const root = document.querySelector('main.rv');
  if (!root || !window.FLOW || !window.IQ) return;
  const W = window.WORLD, T = window.T, N = window.I18N.n, esc = FLOW.esc, NOW = W.now, M = window.IQAA.motion;
  const $ = (s, el) => (el || document).querySelector(s);
  const icon = (n, s) => IQ.icon(n, s || 18);
  const main = $('[data-main]'), live = $('[data-live]'), foot = $('.rv-as');
  const say = (t) => { live.textContent = ''; requestAnimationFrame(() => { live.textContent = t; }); };
  // a name inside a sentence, in lower case where the language has one: 'Montage team' → 'the montage team'
  const lc = (s) => (I18N.lang === 'ar' ? s : s.charAt(0).toLocaleLowerCase(I18N.lang) + s.slice(1));

  // ---------- the link: which organization sent it, for which item ----------
  const code = (new URLSearchParams(location.search).get('code') || '').trim().toUpperCase();
  const O = Object.values(W.orgs).find((o) => (o.shares || []).some((s) => s.code === code));
  const S = O ? O.shares.find((s) => s.code === code) : null;
  const raw = O ? O.lines[0].items.find((x) => x.code === code) : null;
  if (!O || !raw) {
    document.title = T('Review');
    main.classList.add('narrow');
    main.innerHTML = `<div class="rv-hd"><p class="rv-ask">${icon('Link', 16)}<span dir="ltr">${esc(code || '—')}</span></p>
<h1 id="rv-h" tabindex="-1">${T('This link doesn’t open anything to review.')}</h1>
<p class="rv-sub">${T('It may have been cut short. Open it again from the message it came in.')}</p></div>`;
    if (foot) foot.hidden = true;
    return;
  }

  // the item as world.js has it, before this visit's moves: 'Start over' puts it back
  const KEYS = ['at', 'who', 'state', 'due', 'note', 'log', 'assigned', 'moments'];
  const pristine = JSON.stringify(Object.fromEntries(KEYS.map((k) => [k, raw[k] === undefined ? null : raw[k]])));
  // the line is read as the person who sent the link (flow.js needs someone); the page shows nothing of theirs
  const sender = O.people[S.by] ? S.by : Object.keys(O.people).find((k) => O.people[k].owner);
  const C = FLOW.make(O, sender), it = C.items.find((x) => x.code === code), NO = C.noun, B = C.block(S.block);
  const ORG = T(O.name), first = T(S.client).split(' ')[0];

  // the organization's mark: its initial, signed with the opening of its line (as in its app)
  const initial = (O.mark || {})[I18N.lang] || (O.mark || {}).en || O.name;
  window.Beats.sig($('[data-sig]'), C.path.map((b) => ({ name: b.name, steps: [b.stroke] })), { mode: 'mark', size: 40, name: initial, label: T('{org}’s mark', { org: ORG }) });
  $('[data-org-name]').textContent = ORG;
  $('[data-org]').hidden = false;
  document.title = `${T(it.title)} · ${ORG}`;

  // the team the block's work belongs to, by name, else the block's; and the secret field the client never sees
  const team = (O.teams || []).find((x) => (x.grants || []).some((g) => g.block === S.block));
  const TEAM = lc(team ? T(team.name) : T('{block} team', { block: T(B.name) }));
  const secret = Object.values(O.fields).find((f) => f.secret);
  const FINE = secret ? T('You need no account. You don’t see the team, the line or the {field}.', { field: lc(T(secret.name)) }) : T('You need no account. You don’t see the team or the line.');

  // ---------- the preview: the field the link previews, its current version, and the time on it ----------
  const versions = (it.fields || {})[S.preview];
  const V = Array.isArray(versions) ? versions[0] : null;
  const secs = (len) => { const [m, s] = String(len || '0:00').split(':').map(Number); return (m || 0) * 60 + (s || 0); };
  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const LEN = V ? Math.max(1, secs(V.len)) : 0;
  // the client's comments on this version, in the order of the video
  const pins = () => (it.moments || []).filter((m) => V && m.v === V.v).sort((a, b) => a.s - b.s);

  // the client's decision, kept for the visit so a reload shows it ('Start over' clears it)
  const KEY = `iqaa-review:${code}`;
  let answer = null;
  try { answer = JSON.parse(FLOW.store.get(KEY) || 'null'); } catch (e) { answer = null; }
  const keep = (a) => { answer = a; FLOW.store.set(KEY, a ? JSON.stringify(a) : ''); };
  let at = 0, playing = false, timer = null, chgOpen = false, sayText = '', chgText = '';

  // ---------- the parts ----------
  const PEN = 'viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const PLAY = `<svg ${PEN}><path d="M8 5.8v12.4a.8.8 0 0 0 1.2.7l9.6-6.2a.8.8 0 0 0 0-1.4L9.2 5.1a.8.8 0 0 0-1.2.7z"/></svg>`;
  const PAUSE = `<svg ${PEN}><path d="M9 6v12M15 6v12"/></svg>`;
  const f = (s) => (s / LEN).toFixed(4);
  const timeAt = () => `<time dir="ltr" data-at>${clock(at)}</time>`;

  function player() {
    const label = T('Preview of version {v}, {len} long', { v: V.v, len: clock(LEN) });
    return `<figure class="rv-vid">
<div class="rv-poster" role="img" aria-label="${esc(label)}">${IQ.icon('Video', 32)}<span>${esc(T('Version {v}', { v: V.v }))}</span><p class="rv-cue" data-cue hidden></p><time class="rv-len" dir="ltr">${clock(LEN)}</time></div>
<div class="rv-ctl" dir="ltr"><button type="button" class="rv-play" data-play aria-label="${esc(playing ? T('Pause') : T('Play'))}">${playing ? PAUSE : PLAY}</button>
<div class="rv-track" style="--f:${f(at)}"><span class="rv-fill"></span>${pins().map((m) => `<span class="rv-mk" style="--f:${f(m.s)}"></span>`).join('')}
<input type="range" min="0" max="${LEN}" step="1" value="${at}" data-range aria-label="${esc(T('Moment in the video'))}" aria-valuetext="${esc(T('{time} of {len}', { time: clock(at), len: clock(LEN) }))}"></div>
<span class="rv-t"><span data-t>${clock(at)}</span> / ${clock(LEN)}</span></div>
<figcaption>${esc(T('Version {v} · sent to you {when}', { v: V.v, when: FLOW.date(S.sent) }))}</figcaption></figure>`;
  }

  function pinsHtml() {
    const list = pins();
    const row = (m) => `<li><button type="button" class="rv-at" data-go="${m.s}" aria-label="${esc(T('Go to {time}', { time: clock(m.s) }))}"><time dir="ltr">${clock(m.s)}</time></button><p>${esc(T(m.text))}</p>
<button type="button" class="link rv-del" data-del="${it.moments.indexOf(m)}" aria-label="${esc(T('Remove the comment at {time}', { time: clock(m.s) }))}">${T('Remove')}</button></li>`;
    return `<section class="rv-pins" aria-labelledby="rv-pins-h"><h2 id="rv-pins-h" tabindex="-1">${icon('Message')}<span>${T('Your comments')}</span>${list.length ? `<i>${list.length}</i>` : ''}</h2>
${list.length ? `<ol>${list.map(row).join('')}</ol>` : `<p class="rv-none">${esc(T('No comments yet. Stop the video where something should change, and write it there.'))}</p>`}
<form class="rv-add" data-add novalidate><div class="field"><label for="rv-say">${T('Your comment at {time}', { time: timeAt() })}</label>
<textarea id="rv-say" rows="2" aria-describedby="rv-say-e">${esc(sayText)}</textarea><p class="err" id="rv-say-e" hidden></p></div>
<div><button type="submit" class="btn">${icon('Message')}<span>${T('Pin it at {time}', { time: timeAt() })}</span></button></div></form></section>`;
  }

  // the details the line's owner chose for the link: a field of the item, or a day the line gives
  function details() {
    const rows = (S.show || []).map((x) => {
      let v = '';
      if (x.field) { const val = (it.fields || {})[x.field]; v = val == null || val === '' ? '' : String(val).split(/,\s*/).map((p) => T(p)).join(T(', ')); }
      else if (x.day) v = FLOW.date(`${x.day}T12:00`);
      const name = x.as || (O.fields[x.field] || {}).name;
      return v && name ? `<div><dt>${esc(T(name))}</dt><dd>${esc(v)}</dd></div>` : '';
    }).join('');
    return rows ? `<section class="rv-det" aria-labelledby="rv-det-h"><h2 id="rv-det-h">${icon('More')}<span>${T('Details')}</span></h2><dl>${rows}</dl></section>` : '';
  }

  function decision() {
    const n = pins().length;
    const hint = n ? N(n, 'Your comment on the video goes with it.', 'Your {n} comments on the video go with it.') : T('Pin a comment on the video, or write here what should change.');
    return `<section class="rv-dec" aria-labelledby="rv-dec-h"><h2 id="rv-dec-h">${icon('Done')}<span>${T('Your decision')}</span></h2>
<div class="rv-act"><button type="button" class="btn primary wide" data-approve>${icon('Done')}<span>${esc(NO.t('Approve the job'))}</span></button>
<button type="button" class="btn wide" data-changes aria-expanded="${chgOpen}" aria-controls="rv-chg">${icon('Undo')}<span>${T('Ask for changes')}</span></button></div>
<form class="rv-chg" id="rv-chg" data-chg${chgOpen ? '' : ' hidden'} novalidate>
<div class="field"><label for="rv-note">${n ? T('Anything else to change?') : T('What should change?')}</label><p class="hint" id="rv-note-h">${esc(hint)}</p>
<textarea id="rv-note" rows="3" aria-describedby="rv-note-h rv-note-e">${esc(chgText)}</textarea><p class="err" id="rv-note-e" hidden></p></div>
<div class="row-act"><button type="button" class="btn" data-chg-cancel>${T('Cancel')}</button><button type="submit" class="btn primary">${icon('Send')}<span>${esc(T('Send to the {team}', { team: TEAM }))}</span></button></div></form>
<p class="rv-fine">${esc(T('Your changes go back to the {team} on their own.', { team: TEAM }))}</p></section>`;
  }
  const fine = () => `<p class="rv-lock">${icon('Lock', 16)}<span>${esc(FINE)}</span></p>`;

  // ---------- after the decision: what happens next, in the strokes of the organization's line ----------
  // the client's own answer is a person's loop, written as it is given; what comes next is drawn in the dashed pen
  function doneView() {
    const ok = answer.a === 'approved', when = FLOW.when(answer.t), day = (S.show || []).find((x) => x.day);
    const steps = ok
      ? [['struck', false, T('You approved it'), when], ['struck', true, T('{org} finishes it', { org: ORG }), ''], day ? ['struck', true, T(day.as), FLOW.date(`${day.day}T12:00`)] : null]
      : [['struck', false, T('You asked for changes'), when], ['struck', true, T('The {team} makes a new version', { team: TEAM }), ''], ['held', true, T('You review it again on this link'), T('until {day}', { day: FLOW.date(S.until) })]];
    const rows = steps.filter(Boolean).map(([kind, ahead, name, right], i) => `<li class="rv-r${ahead ? ' ahead' : ''}"><span class="g" aria-hidden="true"${i ? '' : ' data-answer-g'}>${IQ.glyph(kind, { test: ahead })}</span><span>${esc(name)}</span><span class="rv-rs">${esc(right)}</span></li>`).join('');
    const sent = !ok && answer.lines.length ? `<section class="rv-sent" aria-labelledby="rv-sent-h"><h2 id="rv-sent-h">${icon('Message')}<span>${T('What you sent')}</span></h2>
<ul>${answer.lines.map((l) => `<li>${l.s != null ? `<time dir="ltr">${clock(l.s)}</time>` : ''}<span>${esc(l.text)}</span></li>`).join('')}</ul></section>` : '';
    const sub = ok ? NO.t('You approved {title}. {org} takes this job from here.', { title: T(it.title), org: ORG })
      : NO.t('Your changes to {title} are with the {team} at {org}.', { title: T(it.title), team: TEAM, org: ORG });
    return `<div class="rv-hd"><p class="rv-ask">${icon(ok ? 'Done' : 'Undo', 16)}<span>${esc(`${ok ? T('Approved') : T('Changes asked for')} · ${when}`)}</span></p>
<h1 id="rv-h" tabindex="-1">${esc(T('Thank you, {name}.', { name: first }))}</h1><p class="rv-sub">${esc(sub)}</p></div>
<section class="rv-next" aria-labelledby="rv-next-h"><h2 id="rv-next-h">${icon('Line')}<span>${T('What happens next')}</span></h2><ol>${rows}</ol></section>${sent}${fine()}`;
  }

  // a link that no longer has anything to review: past its day, the item moved on, or no version yet
  function closedView(kind) {
    const text = {
      expired: T('It worked until {day}. Ask {org} for a new one.', { day: FLOW.date(S.until), org: ORG }),
      moved: NO.t('{org} has taken this job further. There is nothing to review on this link now.', { org: ORG }),
      empty: NO.t('There is no version of this job to review yet. Open the link again when {org} tells you it is ready.', { org: ORG }),
    }[kind];
    const h = kind === 'expired' ? T('This link has expired.') : T(it.title);
    return `<div class="rv-hd"><p class="rv-ask">${icon(kind === 'expired' ? 'Late' : 'Link', 16)}<span>${esc(NO.t('{org} asked you to review this job.', { org: ORG }))}</span></p>
<h1 id="rv-h" tabindex="-1">${esc(h)}</h1><p class="rv-sub">${esc(text)}</p></div>${fine()}`;
  }

  function render() {
    const state = answer ? 'done' : FLOW.ms(NOW) > FLOW.ms(S.until) ? 'expired' : it.at[0] !== S.block ? 'moved' : !V ? 'empty' : 'open';
    main.classList.toggle('narrow', state !== 'open');
    if (state === 'done') { main.innerHTML = doneView(); return; }
    if (state !== 'open') { main.innerHTML = closedView(state); return; }
    main.innerHTML = `<div class="rv-hd"><p class="rv-ask">${esc(NO.t('Hi {name}. {org} asked you to review this job.', { name: first, org: ORG }))}</p>
<h1 id="rv-h" tabindex="-1">${esc(T(it.title))}</h1>
<p class="rv-until">${icon('Date', 16)}<span>${esc(T('The link works until {day}.', { day: FLOW.date(S.until) }))}</span></p></div>
<div class="rv-grid"><div class="rv-main">${player()}${pinsHtml()}</div><div class="rv-side">${details()}${decision()}${fine()}</div></div>`;
    seek(at);
  }

  // ---------- the player: the version plays a second at a time over its length; the client stops where they want ----------
  function seek(s) {
    at = Math.max(0, Math.min(LEN, Math.round(s)));
    const r = $('[data-range]', main);
    if (!r) return;
    r.value = at;
    r.setAttribute('aria-valuetext', T('{time} of {len}', { time: clock(at), len: clock(LEN) }));
    $('.rv-track', main).style.setProperty('--f', f(at));
    $('[data-t]', main).textContent = clock(at);
    main.querySelectorAll('[data-at]').forEach((el) => { el.textContent = clock(at); });
    // a comment pinned at this moment shows over the picture for a few seconds, as a subtitle would
    const near = pins().find((m) => at >= m.s && at < m.s + 4), cue = $('[data-cue]', main);
    cue.hidden = !near;
    cue.innerHTML = near ? `<time dir="ltr">${clock(near.s)}</time> · ${esc(T(near.text))}` : '';
  }
  function play(on) {
    playing = on;
    clearInterval(timer);
    const b = $('[data-play]', main);
    if (b) { b.innerHTML = on ? PAUSE : PLAY; b.setAttribute('aria-label', on ? T('Pause') : T('Play')); }
    if (!on) return;
    if (at >= LEN) seek(0);
    timer = setInterval(() => { if (at >= LEN) play(false); else seek(at + 1); }, 1000);
  }

  // ---------- the client's moves ----------
  const iso = (t) => new Date(t).toISOString().slice(0, 16);
  const dueIn = (b) => iso(FLOW.ms(NOW) + b.hours * 36e5);
  // where an item lands in a block (as on the item page): an approval waits for its first reviewer; work done by one
  // person goes to them; work shared by several is open to them; an automatic block runs it
  function arrive(b) {
    if (b.kind === 'auto') return { who: null, state: 'work' };
    const people = [...new Set(b.roles.filter((r) => !r.lead).flatMap((r) => r.people))];
    if (b.kind === 'approval') return people[0] ? { who: people[0], state: 'approval' } : { who: null, state: 'open' };
    return people.length === 1 ? { who: people[0], state: 'new' } : { who: null, state: 'open' };
  }
  // a line for the item's log, newest first: [block, who, when, what, detail]; the client is not one of the
  // organization's people, so the log names them as the client
  const logged = (what, detail) => [[S.block, 'client', NOW, what].concat(detail == null ? [] : [detail])].concat(it.log || []);
  const lines = (note) => pins().map((m) => ({ s: m.s, text: T(m.text) })).concat(note ? [{ s: null, text: note }] : []);
  function decided(text) {
    play(false);
    chgOpen = false;
    render();
    const g = $('[data-answer-g]', main);
    if (g) window.Beats.write(g, { each: M.half, gap: 0 });
    window.Beats.enter(main);
    $('#rv-h').focus();
    say(text);
  }
  function approve() {
    const next = C.next(B);
    FLOW.move(it, next ? Object.assign({ at: [next.id], due: dueIn(next), assigned: null, note: null, log: logged('approved') }, arrive(next)) : { log: logged('approved') });
    keep({ a: 'approved', t: NOW, lines: lines('') });
    decided(NO.t('Approved. {org} takes this job from here.', { org: ORG }));
  }
  function sendChanges() {
    const note = chgText.trim(), err = $('#rv-note-e'), ta = $('#rv-note');
    if (!note && !pins().length) {
      err.textContent = T('Pin a comment on the video, or write here what should change.');
      err.hidden = false;
      ta.closest('.field').classList.add('bad');
      ta.setAttribute('aria-invalid', 'true');
      ta.focus();
      return;
    }
    const L = lines(note), text = L.map((l) => (l.s != null ? `${clock(l.s)} · ${l.text}` : l.text)).join('; ');
    FLOW.move(it, { state: 'returned', note: { by: 'client', client: S.client, at: NOW, from: S.block, text }, log: logged('returned', text) });
    keep({ a: 'changes', t: NOW, lines: L });
    chgText = '';
    decided(T('Sent. Your changes are with the {team}.', { team: TEAM }));
  }
  function addComment() {
    const ta = $('#rv-say'), err = $('#rv-say-e'), text = sayText.trim();
    if (!text) {
      err.textContent = T('Write what should change at this moment.');
      err.hidden = false;
      ta.closest('.field').classList.add('bad');
      ta.setAttribute('aria-invalid', 'true');
      ta.focus();
      return;
    }
    FLOW.move(it, { moments: (it.moments || []).concat([{ v: V.v, s: at, text, at: NOW }]) });
    sayText = '';
    render();
    $('#rv-say').focus();
    say(T('Pinned at {time}.', { time: clock(at) }));
  }

  main.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-play')) { play(!playing); return; }
    if (b.dataset.go != null) { seek(Number(b.dataset.go)); return; }
    if (b.dataset.del != null) {
      const m = it.moments[Number(b.dataset.del)];
      FLOW.move(it, { moments: it.moments.filter((x) => x !== m) });
      render();
      $('#rv-pins-h').focus();
      say(T('The comment at {time} is removed.', { time: clock(m.s) }));
      return;
    }
    if (b.hasAttribute('data-approve')) { approve(); return; }
    if (b.hasAttribute('data-changes') || b.hasAttribute('data-chg-cancel')) {
      chgOpen = b.hasAttribute('data-changes') ? !chgOpen : false;
      $('[data-chg]').hidden = !chgOpen;
      $('[data-changes]').setAttribute('aria-expanded', String(chgOpen));
      if (chgOpen) { window.Beats.enter($('[data-chg]')); $('#rv-note').focus(); } else $('[data-changes]').focus();
    }
  });
  main.addEventListener('submit', (e) => {
    e.preventDefault();
    if (e.target.matches('[data-add]')) addComment();
    else if (e.target.matches('[data-chg]')) sendChanges();
  });
  main.addEventListener('input', (e) => {
    const el = e.target;
    if (el.matches('[data-range]')) { seek(Number(el.value)); return; }
    if (el.id === 'rv-say') sayText = el.value;
    if (el.id === 'rv-note') chgText = el.value;
    if ((el.id === 'rv-say' || el.id === 'rv-note') && el.value.trim()) {
      el.closest('.field').classList.remove('bad');
      el.removeAttribute('aria-invalid');
      $(`#${el.id}-e`).hidden = true;
    }
  });
  main.addEventListener('keydown', (e) => {
    // the space bar plays and stops while the time slider has the focus, as in a video player
    if (e.key === ' ' && e.target.matches('[data-range]')) { e.preventDefault(); play(!playing); }
    if (e.key === 'Escape' && e.target.id === 'rv-note') { e.preventDefault(); $('[data-chg-cancel]').click(); }
  });
  // the prototype's way back to the start: the decision and the comments of this visit are forgotten, and the item is
  // put back where the link found it
  const reset = $('[data-reset]');
  if (reset) reset.addEventListener('click', () => {
    play(false);
    FLOW.move(it, JSON.parse(pristine));
    keep(null);
    at = 0; chgOpen = false; sayText = ''; chgText = '';
    render();
    $('#rv-h').focus();
    say(T('Back to the start.'));
  });

  render();
})();
