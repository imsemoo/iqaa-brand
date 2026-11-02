// The item page (a piece, a ticket): one template for every organization. Where the item is on its line, drawn in the
// line's own strokes; the one thing its person does next, named by the block it goes to; and tabs: the block's fields
// for the person's role, its files, its discussion, its log, and the tabs the organization's pack adds. A field the
// role may not see is left out of the page, as the server would leave it out. Watar's tools draft in the dashed grey
// pen until a person accepts. Every move is kept for the visit (flow.js), shows on My work, and can be undone.
(function () {
  const root = document.querySelector('main.it');
  if (!root || !window.FLOW || !window.IQ) return;
  const W = window.WORLD, T = window.T, N = window.I18N.n, esc = FLOW.esc, NOW = W.now;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const q = new URLSearchParams(location.search);

  // ---------- whose page: the organization is the item's (its code says which), the person is ?as= or its default ----------
  const DEFAULT = { alkhatt: 'heba', masar: 'wasim' };
  const asked = (q.get('code') || '').trim().toUpperCase();
  const home = Object.values(W.orgs).find((o) => o.lines.some((l) => l.items.some((x) => x.code === asked)));
  let C;
  if (home) {
    const as = q.get('as');
    C = FLOW.make(home, as && home.people[as] ? as : DEFAULT[home.id]);
    FLOW.store.set('iqaa-org-id', home.id);
  } else C = FLOW.context(DEFAULT);
  window.FRAME = C;
  const NO = C.noun, media = C.O.pack === 'Media and production';

  // without a code: the first of the person's own work, or for a lead the first waiting for their approval
  function firstOf() {
    const w = C.work();
    const waits = C.items.filter((x) => x.state === 'approval' && C.leads(C.at(x)));
    return w.doing[0] || w.fresh[0] || waits[0] || w.open[0] || C.items[0];
  }
  const it = asked ? C.items.find((x) => x.code === asked) : firstOf();
  // the address always names the item shown, so "see as" (frame.js) and the language switch keep it
  if (!asked && it) {
    q.set('code', it.code);
    history.replaceState(null, '', `${location.pathname.split('/').pop()}?${q}${location.hash}`);
    $$('a[data-lang-to]').forEach((a) => { a.href = I18N.href(a.dataset.langTo); });
  }

  // ---------- reading the item for the person looking ----------
  const WORK = ['file', 'text', 'pr', 'link'];   // the block's work, in the main column; the rest are its details
  const iso = (t) => new Date(t).toISOString().slice(0, 16);
  const dueIn = (b) => iso(FLOW.ms(NOW) + b.hours * 36e5);
  const lead = (b) => { const r = b.approve && b.roles.find((x) => x.role === b.approve); return r ? r.people[0] : null; };

  // may the person see it: the owner sees everything; a role sees all of its block, its team's, or what is given to
  // it; what nobody has is open to a role that may claim; someone who worked on it may look back ('past')
  function sight() {
    const b = C.at(it), roles = C.rolesIn(b);
    if (C.P.owner || it.who === C.me || roles.some((r) => r.sees === 'all')) return 'yes';
    if (!it.who && roles.some((r) => r.claim)) return 'yes';
    if (it.who && roles.some((r) => r.sees === 'team') && C.P.team && (C.person(it.who) || {}).team === C.P.team) return 'yes';
    return (it.log || []).some((l) => l[1] === C.me) ? 'past' : null;
  }
  // the fields this person's role sees here (flow.js); the owner, who holds no role in most blocks, reads every field
  // that is not secret
  function fields() {
    if (C.rolesIn(C.at(it)).length) return C.fieldsFor(it);
    const keys = Object.keys(C.O.fields).filter((k) => C.P.owner && !C.O.fields[k].secret);
    return { shown: keys.map((k) => ({ key: k, def: C.O.fields[k], mode: 'read', value: (it.fields || {})[k] })), hidden: Object.keys(C.O.fields).length - keys.length };
  }
  const shown = (F, key) => F.shown.find((f) => f.key === key);
  const val = (F, key) => { const f = shown(F, key); return f ? f.value : undefined; };

  // ---------- what the person may do now, and the one line that says why ----------
  function plan() {
    const b = C.at(it), next = C.next(b), mine = it.who === C.me, roles = C.rolesIn(b), boss = lead(b);
    const p = { main: null, back: false, take: false, hint: '' };
    if (sight() === 'past') { p.hint = T('It is at {block} now, where you have no role.', { block: T(b.name) }); return p; }
    if (b.kind === 'auto') { p.hint = T('{block} runs by itself.', { block: T(b.name) }); return p; }
    if (!it.who) {
      if (roles.some((r) => r.claim)) { p.main = { act: 'claim', label: T('Claim'), icon: 'Take' }; p.hint = T('Your role here may take work nobody has yet.'); }
      else p.hint = T('Nobody has it yet.');
      return p;
    }
    if (mine && it.state === 'new') {
      p.main = { act: 'start', label: T('Start working'), icon: 'Take' };
      if (it.assigned) p.hint = T('Given to you by {name}, {when}', { name: C.name(it.assigned.by), when: FLOW.ago(it.assigned.at) });
      return p;
    }
    if (mine && (it.state === 'work' || it.state === 'returned') && b.kind !== 'approval') {
      if (!next) { p.hint = T('{block} is the last block of the line.', { block: T(b.name) }); return p; }
      // a block whose lead approves sends it to the lead first; the button still names where it goes
      const ask = boss && boss !== C.me;
      p.main = { act: ask ? 'ask' : 'hand', label: T('Hand over to {block}', { block: T(next.name) }), icon: 'Handoff' };
      if (ask) p.hint = T('{name} approves it first, as {role}.', { name: C.name(boss), role: T(b.approve) });
      return p;
    }
    if (it.state === 'approval') {
      // who approves: the block's lead in a work block, the reviewer who has it in an approval block
      const approver = b.kind === 'approval' ? it.who : boss;
      const sent = (it.log || []).find((l) => l[0] === b.id && l[3] === 'sent');
      if (approver === C.me || (b.kind !== 'approval' && roles.some((r) => r.role === b.approve))) {
        p.main = { act: 'approve', label: T('Approve'), icon: 'Done' };
        p.back = true;
        const on = next ? T('Approving hands it over to {block}.', { block: T(next.name) }) : '';
        p.hint = b.kind !== 'approval' && sent ? `${T('{name} handed it over {when}.', { name: C.name(sent[1]), when: FLOW.ago(sent[2]) })} ${on}` : on;
        return p;
      }
      if (mine) {
        p.take = true;
        p.hint = sent ? T('You handed it over {when}. It waits for {name}’s approval.', { name: C.name(approver), when: FLOW.ago(sent[2]) }) : T('Waiting for {name}’s approval.', { name: C.name(approver) });
        return p;
      }
      p.hint = T('Waiting for {name}’s approval.', { name: C.name(approver) });
      return p;
    }
    p.hint = T('With {name} at {block}.', { name: C.name(it.who), block: T(b.name) });
    return p;
  }

  // where an item lands in a block: an approval waits for its first reviewer; work done by one person goes to them;
  // work shared by several is open to them; an automatic block runs it
  function arrive(b) {
    if (b.kind === 'auto') return { who: null, state: 'work' };
    const people = [...new Set(b.roles.filter((r) => !r.lead).flatMap((r) => r.people))];
    if (b.kind === 'approval') return people[0] ? { who: people[0], state: 'approval' } : { who: null, state: 'open' };
    return people.length === 1 ? { who: people[0], state: 'new' } : { who: null, state: 'open' };
  }
  // where a sent-back item goes: in a work block, back to its person; from an approval block, to the block the line
  // sends returns to, and the person who last did the work there
  function backTo() {
    const b = C.at(it);
    if (b.kind !== 'approval') return { b, who: it.who };
    const to = C.block(b.back), doers = new Set(to.roles.filter((r) => !r.lead).flatMap((r) => r.people));
    const last = (it.log || []).find((l) => l[0] === to.id && doers.has(l[1]));
    return { b: to, who: last ? last[1] : null };
  }
  // a line for the log, newest first: [block, who, when, what, detail]
  const logged = (what, detail) => [[C.at(it).id, C.me, NOW, what].concat(detail == null ? [] : [detail])].concat(it.log || []);
  const onward = (what) => {
    const next = C.next(C.at(it));
    // a return's note stays in the log; the next block starts without it
    return Object.assign({ at: [next.id], due: dueIn(next), assigned: null, note: null, log: logged(what) }, arrive(next));
  };
  const DO = {
    claim: () => [{ who: C.me, state: 'work', log: logged('claimed') }, T('{title} is yours now. It is in progress.', { title: T(it.title) })],
    start: () => [{ state: 'work', log: logged('started') }, T('{title} is in progress.', { title: T(it.title) })],
    ask: () => [{ state: 'approval', log: logged('sent') }, T('Sent to {name} for approval. It goes on to {block} once approved.', { name: C.name(lead(C.at(it))), block: T(C.next(C.at(it)).name) })],
    hand: () => [onward('done'), T('Handed over to {block}.', { block: T(C.next(C.at(it)).name) })],
    approve: () => [onward('approved'), T('Approved. It is at {block} now.', { block: T(C.next(C.at(it)).name) })],
    take: () => [{ state: 'work', log: logged('took back') }, T('Taken back. It is in progress again.')],
  };

  // ---------- Watar's tools: they come with the pack, and draft only from what the person may see ----------
  const secs = (len) => { const [m, s] = String(len || '0:0').split(':').map(Number); return m * 60 + s; };
  const clock = (t) => { const n = Math.round(t); return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`; };
  const sentences = (s) => (String(s).match(/[^.!?]+[.!?]+/g) || [String(s)]).map((x) => x.trim());
  // spoken lines: a sentence each, a long one cut at its commas
  function spoken(text, max) {
    const out = [];
    sentences(text).forEach((s) => {
      if (s.length <= max) { out.push(s); return; }
      let cur = '';
      s.split(/(?<=,)\s+|\s+(?=then\b)/).forEach((part) => { if (cur && `${cur} ${part}`.length > max) { out.push(cur); cur = part; } else cur = cur ? `${cur} ${part}` : part; });
      if (cur) out.push(cur);
    });
    return out;
  }
  // lines timed across the version's length by how much each says
  function timed(rows, len) {
    const total = secs(len), all = rows.reduce((a, r) => a + r.length, 0) || 1;
    let c = 0;
    return rows.map((r) => { const from = clock((total * c) / all); c += r.length; return { from, to: clock((total * c) / all), t: r }; });
  }
  const versionOf = (F, k) => { const vs = val(F, 'video') || []; return (k && vs.find((x) => x.v === k.v)) || vs[0]; };
  const TOOL = {
    transcribe: { name: 'Transcribe the audio', icon: 'Draft', kept: '{name} kept Watar’s transcript',
      need: (F) => (!versionOf(F) ? T('There is no version to listen to yet.') : !val(F, 'script') ? T('Watar reads along with the script, which your role does not see.') : ''),
      draft: (F, k) => {
        const v = versionOf(F, k), rows = timed(spoken(T(val(F, 'script')), 110), v.len);
        return { title: T('Transcript of version {v}', { v: v.v }),
          body: `<ol class="it-tx">${rows.map((r) => `<li><time dir="ltr">${r.from}</time><span>${esc(r.t)}</span></li>`).join('')}</ol>` };
      },
      file: (k) => `${it.code}-v${k.v}-transcript.txt` },
    subtitles: { name: 'Subtitles', icon: 'Message', kept: '{name} kept Watar’s subtitles',
      need: (F) => TOOL.transcribe.need(F),
      draft: (F, k) => {
        const v = versionOf(F, k), cues = [];
        // each sentence in as few cues as fit 42 characters, the cues of a sentence about as long as each other
        sentences(T(val(F, 'script'))).forEach((s) => {
          const max = Math.min(42, Math.ceil(s.length / Math.ceil(s.length / 42)) + 6);
          let cur = '';
          s.split(/\s+/).forEach((w) => { if (cur && `${cur} ${w}`.length > max) { cues.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w; });
          if (cur) cues.push(cur);
        });
        const rows = timed(cues, v.len);
        return { title: T('Subtitles for version {v}', { v: v.v }),
          body: `<ol class="it-tx it-sub">${rows.map((r) => `<li><time dir="ltr">${r.from}–${r.to}</time><span>${esc(r.t)}</span></li>`).join('')}</ol>
<p class="it-dn">${esc(N(rows.length, '{n} subtitle, 42 characters a line at most', '{n} subtitles, 42 characters a line at most'))}</p>` };
      },
      file: (k) => `${it.code}-v${k.v}.srt` },
    clean: { name: 'Clean the audio', icon: 'Video', kept: '{name} kept Watar’s cleaned sound',
      need: (F) => (versionOf(F) ? '' : T('There is no version to listen to yet.')),
      draft: (F, k) => ({ title: T('Cleaned sound for version {v}', { v: versionOf(F, k).v }),
        body: `<p class="it-dw">${esc(T('The steady background noise is lowered and the voice evened out for phone speakers. The picture stays as it is.'))}</p>` }),
      file: (k) => `${it.code}-v${k.v}-sound.wav` },
    summary: { name: 'Summarize the pull request', icon: 'Repository', kept: '{name} kept Watar’s summary of the pull request',
      need: (F) => (val(F, 'pr') ? '' : T('There is no pull request yet.')),
      draft: (F) => {
        const p = val(F, 'pr'), req = val(F, 'requirements');
        const checks = [N(p.passed, '{n} check passed', '{n} checks passed'), p.running ? N(p.running, '{n} running', '{n} running') : '', p.failed ? N(p.failed, '{n} failed', '{n} failed') : ''].filter(Boolean).join(T(', '));
        return { title: T('Summary of pull request #{n}', { n: p.n }),
          body: `<p class="it-dw">${esc(N(p.files, 'It changes {n} file: {add} lines added, {del} taken out.', 'It changes {n} files: {add} lines added, {del} taken out.', { add: p.add, del: p.del }))}</p>`
            + (req ? `<p class="it-dw">${esc(T('What it does: {text}', { text: T(req) }))}</p>` : '') + `<p class="it-dw">${esc(T('Checks: {list}.', { list: checks }))}</p>` };
      } },
    tests: { name: 'Suggest test cases', icon: 'Test run', kept: '{name} kept Watar’s test cases',
      need: (F) => ((it.watar && it.watar.tests) || val(F, 'requirements') ? '' : T('Watar needs the requirements first.')),
      draft: (F) => {
        const list = (it.watar && it.watar.tests) || sentences(T(val(F, 'requirements'))).map((s) => T('Check that: {text}', { text: s }));
        return { title: T('Test cases from the requirements'), body: `<ol class="it-cases">${list.map((x) => `<li>${esc(T(x))}</li>`).join('')}</ol>`, list };
      } },
    notes: { name: 'Write the release notes', icon: 'Release', kept: '{name} kept Watar’s release notes',
      need: () => '',
      draft: (F) => {
        const rel = val(F, 'release'), type = val(F, 'type'), req = val(F, 'requirements');
        const first = type === 'Bug' ? T('Fixed: {title}.', { title: T(it.title) }) : T('New: {title}.', { title: T(it.title) });
        return { title: rel ? T('Release notes for {release}', { release: rel }) : T('Release notes'),
          body: `<p class="it-dw"><b>${esc(first)}</b>${type !== 'Bug' && req ? ` ${esc(sentences(T(req))[0])}` : ''}</p>` };
      } },
  };
  const TOOLS = media ? ['transcribe', 'subtitles', 'clean'] : ['summary', 'tests', 'notes'];

  // ---------- the page's own state: the tab, the open drafts, what is being typed ----------
  const TABS = ['work', 'files', 'discussion', 'log', 'platforms', 'code', 'tests'];
  let tab = TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'work';
  let undo = null, backOpen = false, backText = '', sayText = '', older = false, showV = null;
  const drafts = {};      // Watar's drafts on screen and not decided yet, by tool
  const blobs = {};       // videos picked this visit, playable in the preview until the page is left

  // ---------- the parts ----------
  const icon = (n, s) => IQ.icon(n, s || 18);
  const glyph = (kind, o) => `<span class="it-g" aria-hidden="true">${IQ.glyph(kind, o)}</span>`;
  const av = (k) => `<span class="me-av" aria-hidden="true">${esc(C.name(k).charAt(0))}</span>`;
  function parent() {
    const b = C.at(it);
    if (it.who === C.me || (!it.who && C.rolesIn(b).some((r) => r.claim))) return { href: C.href('work.html'), name: T('My work'), frame: 'My work' };
    if (C.leads(b)) return { href: C.href('queue.html', { block: b.id }), name: T(b.name), frame: 'My blocks' };
    if (C.standing === 'owner') return { href: C.href('home.html'), name: T('Home'), frame: 'Home' };
    return { href: C.href('work.html'), name: T('My work'), frame: 'My work' };
  }
  function crumb(title) {
    const p = parent();
    return `<div class="it-tl"><nav class="it-crumb" aria-label="${esc(T('Where you came from'))}"><a href="${p.href}">${esc(p.name)}</a><span aria-hidden="true">/</span></nav><h1 tabindex="-1">${esc(title)}</h1></div>`;
  }

  function headHtml(P) {
    const late = FLOW.late(it.due);
    const btn = (act, ic, label, cls, extra) => `<button type="button" class="btn${cls ? ` ${cls}` : ''}" data-do="${act}"${extra || ''}>${icon(ic)}<span>${esc(label)}</span></button>`;
    const acts = btn('comment', 'Message', T('Comment'), 'it-cm')
      + (P.take ? btn('take', 'Undo', T('Take back the hand-over')) : '')
      + (P.back ? btn('back', 'Undo', T('Send back'), '', ` aria-expanded="${backOpen}" aria-controls="it-back"`) : '')
      + (P.main ? btn(P.main.act, P.main.icon, P.main.label, 'primary') : '');
    return `<div class="it-ht">${crumb(T(it.title))}
<p class="it-meta"><code dir="ltr">${it.code}</code>${late ? `<span class="it-flag late">${icon('Late', 16)}${esc(late)}</span>` : ''}</p></div>
<div class="it-do"><div class="it-act${P.main || P.back || P.take ? ' has-main' : ''}">${acts}</div>${P.hint ? `<p class="it-hint">${esc(P.hint)}</p>` : ''}</div>`;
  }

  // the note to send back with: required, said to whom it goes
  function backHtml() {
    const to = backTo();
    const whom = to.who ? T('It goes back to {name} at {block} with your note.', { name: C.name(to.who), block: T(to.b.name) }) : T('It goes back to {block} with your note.', { block: T(to.b.name) });
    return `<form class="it-backf" id="it-back" data-backf novalidate>
<div class="field"><label for="it-back-t">${T('What should change?')}</label><p class="hint" id="it-back-h">${esc(whom)}</p>
<textarea id="it-back-t" rows="3" aria-describedby="it-back-h it-back-e">${esc(backText)}</textarea><p class="err" id="it-back-e" hidden></p></div>
<div class="it-backa"><button type="submit" class="btn primary">${icon('Undo')}<span>${T('Send back')}</span></button><button type="button" class="btn" data-do="back">${T('Cancel')}</button></div></form>`;
  }

  // ---------- the work tab: a returned note, then the block's fields for this role ----------
  const FICON = { file: 'Files', text: 'Draft', pr: 'Repository', link: 'Link' };
  function fieldHtml(f) {
    const id = `it-f-${f.key}`, write = f.mode === 'write';
    const head = `<div class="it-fh"><h3 id="${id}">${icon(/video/i.test(f.key) ? 'Video' : FICON[f.def.type])}${esc(T(f.def.name))}</h3>
<span class="it-mode${write ? ' w' : ''}">${icon(write ? 'Draft' : 'Preview', 16)}${esc(T(write ? 'Can edit' : 'Read only'))}</span></div>`;
    let body;
    if (f.def.type === 'file') body = Array.isArray(f.value) || (write && !f.value) ? versions(f) : f.value ? `<p class="it-file">${icon('Files')}<span dir="ltr">${esc(f.value)}</span></p>` : `<p class="it-none">${esc(T('Nothing uploaded yet.'))}</p>`;
    else if (f.def.type === 'text') body = f.value ? `<p class="it-text">${esc(T(f.value))}</p>` : `<p class="it-none">${esc(T('Nothing written yet.'))}</p>`;
    else if (f.def.type === 'pr') body = f.value ? prHtml(f.value) : `<p class="it-none">${esc(T('No pull request yet.'))}</p>`;
    else body = f.value ? `<p class="it-link">${icon('Link', 16)}<span dir="ltr">${esc(f.value)}</span></p>` : `<p class="it-none">${esc(T('No link yet.'))}</p>`;
    return `<section class="it-f" aria-labelledby="${id}">${head}${body}</section>`;
  }
  // a file with versions: the one shown in the frame with its length, the older ones, and a new one from this device
  function versions(f) {
    const vs = Array.isArray(f.value) ? f.value : [], cur = vs.find((x) => x.v === showV) || vs[0];
    const up = f.mode === 'write' ? `<button type="button" class="btn small" data-pick="${f.key}">${icon('Upload')}<span>${T('Upload a new version')}</span></button><input type="file"${/video/i.test(f.key) ? ' accept="video/*"' : ''} data-upload="${f.key}" hidden>` : '';
    if (!cur) return `<div class="it-vrow"><p class="it-none">${esc(T('No version yet.'))}</p>${up}</div>`;
    const blob = blobs[`${it.code}:${f.key}:${cur.v}`];
    const label = cur.len ? T('Preview of version {v}, {len} long', { v: cur.v, len: cur.len }) : T('Preview of version {v}', { v: cur.v });
    const frame = blob ? `<video src="${blob}" controls preload="metadata" playsinline aria-label="${esc(label)}"></video>`
      : `<div class="it-poster" role="img" aria-label="${esc(label)}">${IQ.icon('Video', 32)}<span>${esc(T('Version {v}', { v: cur.v }))}</span>${cur.len ? `<time class="it-len" dir="ltr">${esc(cur.len)}</time>` : ''}</div>`;
    const rest = vs.filter((x) => x !== vs[0]);
    const cap = T('Version {v} · uploaded by {name} {when}', { v: cur.v, name: C.name(cur.by), when: FLOW.ago(cur.at) });
    const old = rest.length ? `<button type="button" class="link it-lk" data-older aria-expanded="${older}" aria-controls="it-old-${f.key}">${icon('History', 16)}<span>${esc(T('Older versions ({n})', { n: rest.length }))}</span></button>` : '';
    const list = rest.length ? `<ol class="it-old" id="it-old-${f.key}"${older ? '' : ' hidden'}>${rest.map((x) => `<li><span><b>${esc(T('Version {v}', { v: x.v }))}</b><small>${esc([x.len ? x.len : '', C.name(x.by), FLOW.when(x.at)].filter(Boolean).join(' · '))}</small></span>
<button type="button" class="btn small" data-show-v="${x.v}" aria-pressed="${cur === x}">${icon('Preview')}<span>${T('Preview')}</span></button></li>`).join('')}</ol>` : '';
    const back = cur !== vs[0] ? `<button type="button" class="link it-lk" data-show-v="">${esc(T('Back to version {v}', { v: vs[0].v }))}</button>` : '';
    return `<figure class="it-frame">${frame}<figcaption>${esc(cap)}${cur !== vs[0] ? ` <b>${esc(T('(an older version)'))}</b>` : ''}</figcaption></figure>
<div class="it-vrow">${old}${back}${up}</div>${list}`;
  }
  // a pull request as the software pack knows it: its checks in the grammar's strokes, what it changes
  const CHECK = { passed: () => IQ.glyph('run'), running: () => IQ.glyph('run', { test: true }), failed: () => IQ.glyph('failed') };
  function prHtml(p) {
    const rows = [[p.passed, 'passed', N(p.passed, '{n} check passed', '{n} checks passed')], [p.running, 'running', N(p.running, '{n} check running', '{n} checks running')],
      [p.failed, 'failed', N(p.failed, '{n} check failed', '{n} checks failed')]].filter((r) => r[0]);
    return `<div class="it-pr"><p class="it-prt"><code dir="ltr">${esc(p.repo ? `${p.repo} #${p.n}` : `#${p.n}`)}</code><span>${esc(T(it.title))}</span></p>
<ul class="it-chk">${rows.map((r) => `<li class="${r[1]}"><span class="it-g" aria-hidden="true">${CHECK[r[1]]()}</span>${esc(r[2])}</li>`).join('')}</ul>
<p class="it-diff"><span dir="ltr">+${p.add} / −${p.del}</span> · ${esc(N(p.files, '{n} file', '{n} files'))}${p.review ? ` · ${esc(T('Automatic review: {tool}', { tool: p.review }))}` : ''}</p></div>`;
  }
  function workPanel(F) {
    const b = C.at(it);
    let h = '';
    if (it.state === 'returned' && it.note) {
      h += `<section class="it-ret" aria-labelledby="it-ret-h">${icon('Undo', 20)}<div><h3 id="it-ret-h">${esc(T('Sent back from {block}', { block: T(C.block(it.note.from).name) }))}</h3>
<blockquote>${esc(T(it.note.text))}</blockquote><p>${esc(T('{name}, {when}', { name: C.name(it.note.by), when: FLOW.ago(it.note.at) }))}</p></div></section>`;
    }
    if (!C.rolesIn(b).length && !C.P.owner) return `${h}<p class="it-none">${esc(T('You have no role in {block}, where it is now: its fields are not shown to you.', { block: T(b.name) }))}</p>`;
    const work = F.shown.filter((f) => WORK.includes(f.def.type)).sort((x, y) => (x.mode === 'write' ? 0 : 1) - (y.mode === 'write' ? 0 : 1));
    return h + (work.length ? work.map(fieldHtml).join('') : `<p class="it-none">${esc(T('{block} has no fields your role sees.', { block: T(b.name) }))}</p>`);
  }

  // ---------- files: every file the role sees, and what was kept from Watar ----------
  function files(F) {
    const out = [];
    F.shown.filter((f) => f.def.type === 'file').forEach((f) => {
      if (Array.isArray(f.value)) f.value.forEach((x) => out.push({ ic: /video/i.test(f.key) ? 'Video' : 'Files', t: T('{field}, version {v}', { field: T(f.def.name), v: x.v }), m: [x.len, x.file, C.name(x.by), FLOW.when(x.at)] }));
      else if (f.value) out.push({ ic: 'Files', t: String(f.value), m: [] });
    });
    Object.keys(it.kept || {}).forEach((k) => { if (TOOL[k] && TOOL[k].file) out.push({ ic: 'Draft', t: TOOL[k].file(it.kept[k]), ltr: true, m: [T('Watar’s draft, kept by {name}', { name: C.name(it.kept[k].by) }), FLOW.when(it.kept[k].at)] }); });
    return out;
  }
  const filesPanel = (list) => (list.length ? `<ul class="it-rows">${list.map((x) => `<li>${icon(x.ic, 20)}<span><b${x.ltr ? ' dir="ltr"' : ''}>${esc(x.t)}</b><small>${esc(x.m.filter(Boolean).join(' · '))}</small></span></li>`).join('')}</ul>`
    : `<p class="it-none">${esc(T('No files yet.'))}</p>`);

  // ---------- the discussion ----------
  const talk = () => it.discussion || [];
  function talkPanel() {
    const list = talk().map((m) => `<li>${av(m.by)}<div><p class="it-mh"><b>${esc(C.name(m.by))}</b><time>${esc(FLOW.ago(m.at))}</time></p><p class="it-mt">${esc(T(m.text))}</p></div></li>`).join('');
    return `${list ? `<ol class="it-talk">${list}</ol>` : `<p class="it-none">${esc(NO.t('Nothing said about this job yet.'))}</p>`}
<form class="it-say" data-say novalidate><div class="field"><label for="it-say-t">${T('Your comment')}</label><p class="hint" id="it-say-h">${esc(NO.t('Everyone who may see this job reads it.'))}</p>
<textarea id="it-say-t" rows="3" aria-describedby="it-say-h it-say-e">${esc(sayText)}</textarea><p class="err" id="it-say-e" hidden></p></div>
<div><button type="submit" class="btn primary">${icon('Message')}<span>${T('Comment')}</span></button></div></form>`;
  }

  // ---------- the log: every move, newest first, and the moment it joined the line ----------
  const SAID = {
    claimed: '{name} claimed it at {block}', started: '{name} started working on it at {block}', sent: '{name} handed it over for approval at {block}',
    'took back': '{name} took it back at {block}', done: '{name} finished {block}', approved: '{name} approved it at {block}', returned: '{name} sent it back from {block}',
    assigned: '{name} assigned it at {block}', version: '{name} uploaded version {v} at {block}', pr: '{name} opened pull request #{v}', merged: '{name} merged pull request #{v}',
  };
  function logPanel() {
    const rows = (it.log || []).map((l) => {
      const [bid, who, at, what, d] = l, b = C.block(bid) || { name: bid }, v = { name: C.name(who), block: T(b.name), v: d };
      // an older line may not say which version or which pull request
      const said_ = d == null && what === 'version' ? '{name} uploaded a new version at {block}' : d == null && what === 'pr' ? '{name} opened a pull request' : SAID[what];
      const text = what === 'watar' && TOOL[d] ? T(TOOL[d].kept, v) : said_ ? T(said_, v) : `${v.name} · ${what}`;
      // a return carries its note: in the line itself, or the item's note when it is that return
      const said = what === 'returned' ? (typeof d === 'string' ? d : it.note && it.note.at === at ? it.note.text : '') : '';
      return `<li>${glyph(what === 'approved' || what === 'returned' || what === 'sent' ? 'held' : 'struck')}<div><p>${esc(text)}</p>${said ? `<q>${esc(T(said))}</q>` : ''}</div><time>${esc(FLOW.when(at))}</time></li>`;
    }).join('');
    return `<ol class="it-log">${rows}<li>${glyph('run')}<div><p>${esc(T('It joined the line: {line}', { line: T(C.line.name) }))}</p></div><time>${esc(FLOW.when(it.opened))}</time></li></ol>`;
  }

  // ---------- the pack's tabs ----------
  // media: the platforms it goes out on, from its pages, which the publishing block publishes to
  function platformsPanel(F) {
    const pub = C.path.find((x) => x.pack), before = pub && C.path[C.path.indexOf(pub) - 1];
    const by = pub && pub.roles[0] ? pub.roles[0].people[0] : null;
    const who = pub ? (by ? T('{name} publishes it at {block}, after {prev}.', { name: C.name(by), block: T(pub.name), prev: T(before.name) }) : T('It is published at {block}.', { block: T(pub.name) })) : '';
    if (!shown(F, 'pages')) return `<p class="it-none it-lock">${icon('Lock', 16)}<span>${esc(T('Where it is published is hidden from your role.'))} ${esc(who)}</span></p>`;
    const pages = val(F, 'pages') ? String(val(F, 'pages')).split(/,\s*/) : [];
    return `${pages.length ? `<ul class="it-rows">${pages.map((p) => `<li>${icon('Publish', 20)}<span><b>${esc(T(p))}</b><small>${esc(T('Not published yet'))}</small></span></li>`).join('')}</ul>` : `<p class="it-none">${esc(T('No platform chosen yet.'))}</p>`}
<p class="it-sub">${esc(who)}</p>`;
  }
  // software: the pull requests the ticket has, and what is still to check it
  const prs = (F) => (shown(F, 'pr') ? [val(F, 'pr')].filter(Boolean).concat(it.merged || []) : null);
  function codePanel(F) {
    const list = prs(F);
    if (!list) return `<p class="it-none it-lock">${icon('Lock', 16)}<span>${esc(T('The code is hidden from your role.'))}</span></p>`;
    if (!list.length) return `<p class="it-none">${esc(T('No pull request yet.'))}</p>`;
    return `<ul class="it-rows">${list.map((p) => {
      const open = p === val(F, 'pr');
      const meta = [open ? T('Open, not merged yet') : T('Merged {when} by {name}', { when: FLOW.when(p.at), name: C.name(p.by) }), N(p.files, '{n} file', '{n} files')];
      return `<li>${icon('Repository', 20)}<span><b><code dir="ltr">${esc(p.repo ? `${p.repo} #${p.n}` : `#${p.n}`)}</code> ${esc(T(p.title || it.title))}</b><small>${esc(meta.join(' · '))} · <span dir="ltr">+${p.add} / −${p.del}</span></small></span></li>`;
    }).join('')}</ul>`;
  }
  function testsPanel(F) {
    const p = val(F, 'pr'), checks = (p && p.checks) || [];
    const ahead = C.path.slice(C.placeOf(it) + 1).filter((b) => b.kind === 'approval').map((b) => {
      const k = b.roles[0] && b.roles[0].people[0];
      return k ? T('{block} with {name}', { block: T(b.name), name: C.name(k) }) : T(b.name);
    });
    const kept = it.kept && it.kept.tests ? TOOL.tests.draft(F).list : null;
    return `<h3 class="it-h3">${esc(T('Automatic checks'))}</h3>${checks.length ? `<ul class="it-chk it-chk-l">${checks.map(([n, s]) => `<li class="${s}"><span class="it-g" aria-hidden="true">${CHECK[s]()}</span><span>${esc(T(n))}</span><small>${esc(T(s === 'passed' ? 'Passed' : s === 'running' ? 'Running' : 'Failed'))}</small></li>`).join('')}</ul>`
      : `<p class="it-none">${esc(p ? T('{n} checks ran on the pull request.', { n: p.passed + p.running + p.failed }) : T('Checks run when a pull request is opened.'))}</p>`}
<h3 class="it-h3">${esc(T('Still to check it'))}</h3><p class="it-sub">${esc(ahead.length ? T('{list}.', { list: ahead.join(T(', then ')) }) : T('No review is ahead of it.'))}</p>
${kept ? `<h3 class="it-h3">${esc(T('Test cases kept for testing'))}</h3><ol class="it-cases">${kept.map((x) => `<li>${esc(T(x))}</li>`).join('')}</ol>` : ''}`;
  }

  // ---------- the side: who has it, when it is due, the organization's own fields, the role, and Watar ----------
  function sideHtml(F) {
    const b = C.at(it), late = FLOW.late(it.due);
    // each row as markup: its name, then its value
    const rows = [[esc(T('Who has it')), it.who ? `<span class="it-who">${av(it.who)}${esc(C.name(it.who))}</span>` : esc(b.kind === 'auto' ? T('Runs by itself') : T('Nobody yet'))],
      [esc(T('Due')), `${esc(FLOW.when(it.due))}${late ? `<span class="it-flag late">${icon('Late', 16)}${esc(late)}</span>` : ''}`]];
    F.shown.filter((f) => !WORK.includes(f.def.type)).forEach((f) => {
      const lock = f.def.secret ? `<span class="it-sec" title="${esc(T('Hidden from most roles'))}">${icon('Lock', 14)}<span class="sr">${esc(T('Hidden from most roles'))}</span></span>` : '';
      const v = f.value == null || f.value === '' ? '—' : f.def.type === 'choice' ? esc(T(String(f.value))) : `<span dir="ltr">${esc(f.value)}</span>`;
      rows.push([`${esc(T(f.def.name))}${lock}`, v]);
    });
    const roles = C.rolesIn(b).map((r) => T(r.role)), hidden = Object.keys(C.O.fields).filter((k) => !shown(F, k));
    const role = roles.length ? T('Your role here: {roles}.', { roles: roles.join(T(', ')) })
      : C.P.owner ? T('You have no role in {block}; you see it as the owner.', { block: T(b.name) }) : T('You have no role in {block}.', { block: T(b.name) });
    const hid = !hidden.length ? T('You see every field.') : hidden.length === 1
      ? T('{field} is hidden from you; its value never reaches your browser.', { field: T(C.O.fields[hidden[0]].name) })
      : N(hidden.length, '{n} field is hidden from you; its value never reaches your browser.', '{n} fields are hidden from you; their values never reach your browser.');
    const details = `<section class="it-box" aria-labelledby="it-d-h"><h2 id="it-d-h">${icon('Overview')}${T('Details')}</h2>
<dl class="it-dl">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
<p class="it-role">${icon('Lock', 16)}<span><b>${esc(role)}</b> ${esc(hid)}</span></p></section>`;
    return details + (C.rolesIn(b).length && sight() === 'yes' ? watarHtml(F) : '');
  }
  function watarHtml(F) {
    const kept = it.kept || {};
    const tools = TOOLS.map((id) => {
      const d = TOOL[id], why = d.need(F);
      return `<li><button type="button" class="it-tool" data-tool="${id}"${why ? ` disabled aria-describedby="it-why-${id}"` : ''}>${icon(d.icon)}<span>${esc(T(d.name))}</span></button>${why ? `<small class="it-why" id="it-why-${id}">${esc(why)}</small>` : ''}</li>`;
    }).join('');
    const open = TOOLS.filter((id) => kept[id] || drafts[id]).map((id) => draftHtml(F, id, kept[id])).join('');
    return `<section class="it-box it-watar" aria-labelledby="it-w-h"><h2 id="it-w-h">${icon('Ask Watar')}${T('Watar')}</h2>
<p class="it-wl">${esc(T('Watar drafts. Nothing is sent, and nothing changes until a person accepts.'))}</p><ul class="it-tools">${tools}</ul>${open}</section>`;
  }
  // a draft in the dashed grey pen until a person accepts it; then the pen is ink and the loop is theirs
  function draftHtml(F, id, k) {
    const d = TOOL[id].draft(F, k), file = TOOL[id].file;
    const head = k ? T('Accepted by {name} · {when}', { name: C.name(k.by), when: FLOW.ago(k.at) }) : T('Draft from Watar · waits for you');
    const end = k ? (file ? `<p class="it-dn">${icon('Files', 16)}<span>${esc(T('Kept with the files as {file}', { file: file(k) }))}</span></p>` : '')
      : `<div class="it-da"><button type="button" class="btn small primary" data-accept="${id}">${icon('Done')}<span>${T('Accept')}</span></button><button type="button" class="link it-lk" data-discard="${id}">${icon('Discard', 16)}<span>${T('Discard')}</span></button></div>`;
    return `<section class="it-dr${k ? ' kept' : ''}" aria-labelledby="it-dr-${id}"><p class="it-dk">${glyph(k ? 'struck' : 'held')}<span>${esc(head)}</span></p>
<h3 id="it-dr-${id}" tabindex="-1">${esc(d.title)}</h3>${d.body}${end}</section>`;
  }

  // ---------- the page ----------
  function closed(title, text, ic) {
    document.title = `${title} · ${T(C.O.name)}`;
    $('[data-head]').innerHTML = `<div class="it-ht"><div class="it-tl"><nav class="it-crumb" aria-label="${esc(T('Where you came from'))}"><a href="${C.href('work.html')}">${T('My work')}</a><span aria-hidden="true">/</span></nav><h1 tabindex="-1">${esc(title)}</h1></div></div>`;
    $('[data-body]').innerHTML = `<p class="it-closed">${icon(ic || 'Lock')}<span>${esc(text)}</span></p>`;
  }
  function render() {
    if (!it) return closed(T('Not found'), NO.t('No job has the code {code}.', { code: asked }), 'Search');
    if (!sight()) return closed(it.code, NO.t('This job isn’t open to you. What you see comes from your role in each block, and yours doesn’t show it.'));
    const F = fields(), P = plan();
    document.title = `${T(it.title)} · ${T(C.O.name)}`;
    root.querySelector('.it-page').classList.toggle('has-act', !!(P.main || P.back || P.take));
    $('[data-head]').innerHTML = headHtml(P);
    $('[data-backf]').innerHTML = P.back && backOpen ? backHtml() : '';
    $('[data-line]').innerHTML = C.stages(it);
    // a phone scrolls the line sideways: it opens on the item's place
    centre($('[data-line]'), $('.stg li.now', root));
    // the tabs: the same four everywhere (files only where the organization keeps files), then the pack's
    const fl = files(F), list = [{ id: 'work', name: T('Work'), ic: 'Task' }];
    if (Object.values(C.O.fields).some((f) => f.type === 'file')) list.push({ id: 'files', name: T('Files'), n: fl.length, ic: 'Files' });
    list.push({ id: 'discussion', name: T('Discussion'), n: talk().length, ic: 'Message' }, { id: 'log', name: T('Log'), ic: 'History' });
    if (media) list.push({ id: 'platforms', name: T('Platforms'), n: shown(F, 'pages') && val(F, 'pages') ? String(val(F, 'pages')).split(/,\s*/).length : null, ic: 'Publish' });
    else list.push({ id: 'code', name: T('Code'), n: prs(F) ? prs(F).length : null, ic: 'Repository' }, { id: 'tests', name: T('Tests'), ic: 'Test run' });
    if (!list.some((x) => x.id === tab)) tab = 'work';
    const PANEL = { work: () => workPanel(F), files: () => filesPanel(fl), discussion: talkPanel, log: logPanel, platforms: () => platformsPanel(F), code: () => codePanel(F), tests: () => testsPanel(F) };
    $('[data-body]').innerHTML = `<div class="it-main"><div class="it-tabs" role="tablist" aria-label="${esc(NO.t('About this job'))}">${list.map((x) => `<button type="button" role="tab" id="it-t-${x.id}" aria-controls="it-p-${x.id}" aria-selected="${x.id === tab}" tabindex="${x.id === tab ? 0 : -1}" data-tab="${x.id}">${icon(x.ic)}<span>${esc(x.name)}</span>${x.n != null ? `<i>${x.n}</i>` : ''}</button>`).join('')}</div>
${list.map((x) => `<div class="it-panel" role="tabpanel" id="it-p-${x.id}" aria-labelledby="it-t-${x.id}" tabindex="0"${x.id === tab ? '' : ' hidden'}>${PANEL[x.id]()}</div>`).join('')}</div>
<aside class="it-side" aria-label="${esc(T('Details and Watar'))}">${sideHtml(F)}</aside>`;
    centre($('.it-tabs', root), $('[aria-selected="true"]', root));
  }
  // a row that scrolls sideways (the line, the tabs on a phone) keeps the part that matters in the middle of its view
  function centre(row, el) {
    if (row && el && row.scrollWidth > row.clientWidth) row.scrollLeft += el.getBoundingClientRect().left + el.offsetWidth / 2 - row.getBoundingClientRect().left - row.clientWidth / 2;
  }

  function select(id, focus) {
    tab = id;
    $$('[role="tab"]', root).forEach((b) => { const on = b.dataset.tab === id; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
    $$('[role="tabpanel"]', root).forEach((p) => { p.hidden = p.id !== `it-p-${id}`; });
    history.replaceState(null, '', `${location.pathname.split('/').pop()}${location.search}#${id}`);
    $$('a[data-lang-to]').forEach((a) => { a.href = I18N.href(a.dataset.langTo); });
  }

  // ---------- moves, and undoing them ----------
  function say(text, back) {
    const el = $('[data-note]');
    el.hidden = false;
    $('[data-note-t]').textContent = text;
    undo = back;
    clearTimeout(say.t);
    say.t = setTimeout(() => {
      const had = el.contains(document.activeElement);
      el.hidden = true;
      undo = null;
      if (had) $('h1', root).focus();
    }, 8000);
    $('[data-undo]').focus();
  }
  function move(patch, text) {
    const before = FLOW.move(it, patch);
    backOpen = false;
    render();
    say(text, () => { FLOW.move(it, before); });
    const g = $('.stg li.now .stg-g', root);
    if (g && patch.at) window.Beats.write(g, { each: window.IQAA.motion.half });
  }
  function sendBack(text) {
    const b = C.at(it), to = backTo();
    const patch = { state: 'returned', note: { by: C.me, at: NOW, from: b.id, text }, log: logged('returned', text) };
    if (to.b !== b) Object.assign(patch, { at: [to.b.id], who: to.who, due: dueIn(to.b) });
    backText = '';
    move(patch, to.who ? T('Sent back to {name} with your note.', { name: C.name(to.who) }) : T('Sent back to {block} with your note.', { block: T(to.b.name) }));
  }
  // a version picked on this device: its length read from the file when the browser can, kept for the visit
  function upload(input) {
    const file = input.files && input.files[0], key = input.dataset.upload;
    if (!file) return;
    const url = URL.createObjectURL(file), probe = document.createElement('video');
    let done = false;
    const finish = (len) => {
      if (done) return;
      done = true;
      const list = (it.fields || {})[key] || [], v = (list[0] ? list[0].v : 0) + 1;
      if (len) blobs[`${it.code}:${key}:${v}`] = url;
      showV = null;
      move({ fields: Object.assign({}, it.fields, { [key]: [{ v, by: C.me, at: NOW, len, file: file.name }].concat(list) }), log: logged('version', v) },
        T('Version {v} is up.', { v }));
    };
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => finish(Number.isFinite(probe.duration) ? clock(probe.duration) : null);
    probe.onerror = () => finish(null);
    setTimeout(() => finish(null), 3000);
    probe.src = url;
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.tab) return select(b.dataset.tab);
    if (b.hasAttribute('data-undo')) {
      if (!undo) return;
      undo();
      undo = null;
      $('[data-note]').hidden = true;
      render();
      $('h1', root).focus();
      return;
    }
    const act = b.dataset.do;
    if (act === 'comment') { select('discussion'); $('#it-say-t').focus(); return; }
    if (act === 'back') {
      backOpen = !backOpen;
      render();
      if (backOpen) { $('#it-back-t').focus(); $('#it-back').scrollIntoView({ block: 'nearest' }); } else $('[data-do="back"]', root).focus();
      return;
    }
    if (DO[act]) { const [patch, text] = DO[act](); move(patch, text); return; }
    if (b.dataset.pick) { $(`[data-upload="${b.dataset.pick}"]`, root).click(); return; }
    if (b.hasAttribute('data-older')) { older = !older; render(); $('[data-older]', root).focus(); return; }
    if ('showV' in b.dataset) { showV = b.dataset.showV ? Number(b.dataset.showV) : null; render(); $('.it-frame', root).scrollIntoView({ block: 'nearest' }); return; }
    if (b.dataset.tool) {
      const id = b.dataset.tool;
      if (!drafts[id] && !(it.kept || {})[id]) {
        // Watar takes a moment, then its draft is written in the dashed pen
        b.setAttribute('aria-busy', 'true');
        window.Beats.wait(window.IQAA.motion.half).then(() => {
          drafts[id] = true;
          render();
          const h = $(`#it-dr-${id}`);
          if (h) { h.focus(); window.Beats.write($(`#it-dr-${id}`).closest('.it-dr').querySelector('.it-g')); }
        });
        return;
      }
      const h = $(`#it-dr-${id}`);
      if (h) h.focus();
      return;
    }
    if (b.dataset.accept) {
      const id = b.dataset.accept, v = media ? (versionOf(fields()) || {}).v : undefined;
      delete drafts[id];
      move({ kept: Object.assign({}, it.kept, { [id]: { by: C.me, at: NOW, v } }), log: logged('watar', id) }, NO.t('Kept with this job. Nothing was sent.'));
      return;
    }
    if (b.dataset.discard) {
      const id = b.dataset.discard;
      delete drafts[id];
      render();
      say(T('Watar’s draft is discarded.'), () => { drafts[id] = true; });
    }
  });
  root.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target, back = form.hasAttribute('data-backf');
    const ta = $('textarea', form), err = $('.err', form), text = ta.value.trim();
    if (!text) {
      err.textContent = back ? T('Write what should change, so the note says it.') : T('Write something first.');
      err.hidden = false;
      form.querySelector('.field').classList.add('bad');
      ta.setAttribute('aria-invalid', 'true');
      ta.focus();
      return;
    }
    if (back) return sendBack(text);
    sayText = '';
    const msg = { by: C.me, at: NOW, text };
    move({ discussion: talk().concat([msg]), talk: talk().length + 1 }, T('Your comment is posted.'));
  });
  root.addEventListener('input', (e) => {
    if (e.target.id === 'it-say-t') sayText = e.target.value;
    if (e.target.id === 'it-back-t') backText = e.target.value;
  });
  root.addEventListener('change', (e) => { if (e.target.matches('[data-upload]')) upload(e.target); });
  // the tabs follow the arrows, Home and End; right to left, the arrows follow the page's direction
  root.addEventListener('keydown', (e) => {
    const t = e.target.closest('[role="tab"]');
    if (!t) return;
    const all = $$('[role="tab"]', root), i = all.indexOf(t), dir = I18N.rtl ? -1 : 1;
    const go = { ArrowRight: i + dir, ArrowLeft: i - dir, Home: 0, End: all.length - 1 }[e.key];
    if (go == null) return;
    e.preventDefault();
    select(all[(go + all.length) % all.length].dataset.tab, true);
  });

  // the frame marks where the person came from (frame.js reads it next)
  const side = document.querySelector('[data-frame]');
  if (side && it && sight()) side.dataset.current = parent().frame;
  render();
})();
