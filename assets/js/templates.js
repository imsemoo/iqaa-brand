// Templates (القوالب): what a line makes its outputs from, the owner's. A template is a structured description, not
// code: its slots, each with its kind and its rule, drawn in a brand's identity; Watar writes no code that runs on a
// server. The list says each template's kind, size, state and how it was made. The one selected shows its newest
// version, a preview filled with a real item's values (drawn honestly: the identity's type and logo, an empty image
// slot drawn as a slot, never a stock photo), its slots, its identity and its versions. An approved version never
// changes and any edit is a new version; nothing is made from a draft. Approving a draft in your name is confirmed in
// place and kept for the visit, with Undo; nothing is sent.
(function () {
  const root = document.querySelector('main.tm');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'khaled', masar: 'samir', wamda: 'hala' });
  const W = window.WORLD, T = window.T, N = window.I18N.n, esc = FLOW.esc, O = C.O;
  const $ = (s, el) => (el || document).querySelector(s);
  const M = window.IQAA.motion;
  const icon = (n, s) => IQ.icon(n, s || 20);
  const pen = (kind) => `<span class="tm-g" aria-hidden="true">${IQ.glyph(kind, { test: true })}</span>`;
  // what this prototype does not do yet: shown, kept in reach of the keyboard, and said to be coming
  const soon = (label, cls, ic) => `<button type="button" class="btn ${cls || ''}" aria-disabled="true" title="${esc(T('{name}: coming next', { name: label }))}">${ic ? icon(ic, 18) : ''}<span>${esc(label)}</span><em>${esc(T('Soon'))}</em></button>`;
  const LIST = O.templates || [];
  const KIND = { carousel: 'Templates', image: 'Image', video: 'Video' };
  const SLOT = { Text: 'Message', Image: 'Image', Video: 'Video', Identity: 'Mark' };
  const q = new URLSearchParams(location.search);
  let pick = (LIST.find((x) => x.id === q.get('t')) || LIST[0] || {}).id, slide = 0, asking = false, undo = null;

  // ---------- approvals this visit: { template: version }, kept in sessionStorage ----------
  const KEY = `iqaa-templates:${O.id}`;
  const approved = () => { try { return JSON.parse(FLOW.store.get(KEY) || '{}') || {}; } catch (e) { return {}; } };
  const keep = (m) => FLOW.store.set(KEY, JSON.stringify(m));
  // a template's versions as they stand now: a draft approved this visit is approved, in the name of who approved it
  function versions(tp) {
    const mine = approved()[tp.id];
    return tp.versions.map((v) => (v.state === 'draft' && mine && mine.v === v.v ? Object.assign({}, v, { state: 'approved', approved: { by: mine.by, at: W.now }, outputs: 0, now: true }) : v));
  }
  const inUse = (vs) => vs.find((v) => v.state === 'approved') || null;

  // ---------- the words for a template ----------
  // each fact isolated, so a size (1080×1350) keeps its order inside a right-to-left line
  const facts = (tp) => [tp.kind === 'carousel' ? N(tp.slides, '{n} slide', '{n} slides') : T(tp.kind === 'video' ? 'Video' : 'Image'), tp.size].map((x) => `<bdi>${esc(x)}</bdi>`).join(' · ');
  const made = (tp, v) => (tp.made === 'watar' ? T('Built with Watar by {name}, {when}', { name: C.name(v.by), when: FLOW.when(v.at) })
    : T('Uploaded by {name}, {when}', { name: C.name(v.by), when: FLOW.when(v.at) }));
  const how = (tp) => T(tp.made === 'watar' ? 'Built with Watar' : 'Uploaded');
  const mark = (tp) => { const b = (O.brands || {})[tp.brand] || {}; return b[I18N.lang] || b.en || tp.brand; };
  // the line an item is on, and the item's title there: the quick news line or one of the organization's lines
  function source(s) {
    const lines = [O.newsLine].concat(O.lines).filter(Boolean);
    const L = lines.find((l) => l.id === s.line), it = L && (L.items || []).find((x) => x.code === s.code);
    return { line: L ? T(L.name) : '', title: T(it ? it.title : s.title), item: it };
  }

  // ---------- the list ----------
  function list() {
    $('[data-n]').textContent = LIST.length;
    $('[data-list]').innerHTML = LIST.map((tp) => {
      const vs = versions(tp), use = inUse(vs), top = vs[0];
      const state = use ? `<span class="tm-st">${icon('Done', 16)}<span>${esc(T('Approved'))}</span></span>` : `<span class="tm-st is-draft">${pen('held')}<span>${esc(T('Draft'))}</span></span>`;
      // an approved template whose newest version is still a draft says so: the draft waits for a person
      const next = use && top.state === 'draft' ? `<span class="tm-next">${pen('held')}<span>${esc(T('Version {v} waits for approval', { v: top.v }))}</span></span>` : '';
      const cur = tp.id === pick ? ' aria-current="true"' : '';
      return `<li><a class="tm-row" href="${C.href('templates.html', { t: tp.id })}" data-pick="${esc(tp.id)}"${cur}><span class="tm-ic" aria-hidden="true">${icon(KIND[tp.kind] || 'Templates', 20)}</span>
<span class="tm-rt"><b>${esc(T(tp.name))}</b><small>${facts(tp)}</small></span><span class="tm-rs">${state}<small>${esc(how(tp))}</small></span>${next}</a></li>`;
    }).join('');
  }

  // ---------- the preview: the newest version filled with a real item's values ----------
  const logo = (tp, cls) => `<span class="tm-logo${cls ? ` ${cls}` : ''}">${esc(mark(tp))}</span>`;
  const num = (i, n) => `<span class="tm-sn" dir="ltr">${i}/${n}</span>`;
  // the image slot, drawn as a slot: what goes there, and that the item has none yet
  const photo = (s) => `<span class="tm-photo">${icon('Image', 24)}<b>${esc(T('Image'))}</b><small>${esc(s.photo ? T(s.photo) : T('The item has no photo yet'))}</small></span>`;
  function slides(tp, s) {
    const n = tp.slides, list = [];
    list.push({ label: T(s.title), html: `${num(1, n)}${photo(s)}<p class="tm-ttl">${esc(source(s).title)}</p>${logo(tp)}` });
    s.texts.forEach((x, i) => {
      const last = i === s.texts.length - 1;
      list.push({ label: T(x), html: `${num(i + 2, n)}<p class="tm-tx">${esc(T(x))}</p>${last ? `<p class="tm-so">${esc(T('Source: {name}', { name: T(s.source) }))}</p>` : ''}${logo(tp)}` });
    });
    return list;
  }
  function preview(tp, v) {
    const s = tp.sample, src = source(s);
    let stage = '', thumbs = '', count = '';
    if (tp.kind === 'carousel') {
      const all = slides(tp, s);
      slide = Math.min(slide, all.length - 1);
      const one = all[slide];
      stage = `<div class="tm-slide is-4x5" role="img" aria-label="${esc(T('Slide {i} of {n}: {text}', { i: slide + 1, n: all.length, text: one.label }))}">${one.html}</div>`;
      thumbs = `<div class="tm-thumbs" role="group" aria-label="${esc(T('Slides'))}">${all.map((x, i) => `<button type="button" class="tm-th" data-slide="${i}" aria-pressed="${i === slide}" aria-label="${esc(T('Slide {i}', { i: i + 1 }))}"><span dir="ltr">${i + 1}</span></button>`).join('')}</div>`;
      count = N(all.length, '{n} slide', '{n} slides');
    } else if (tp.kind === 'image') {
      stage = `<div class="tm-slide is-1x1" role="img" aria-label="${esc(T('{quote}, {speaker}', { quote: T(s.quote), speaker: T(s.speaker) }))}"><span class="tm-qm" aria-hidden="true">“</span><p class="tm-qt">${esc(T(s.quote))}</p><p class="tm-qs">${esc(T(s.speaker))}</p>${logo(tp)}</div>`;
      count = T('1 image');
    } else {
      // the reel: the clips are cut from the piece's video, drawn as the video slot it is
      const vid = ((src.item && src.item.fields) || {}).video, last = Array.isArray(vid) && vid[0];
      const clips = last ? T('{n} clips from video version {v}', { n: s.clips, v: last.v }) : T('{n} clips from the piece’s video', { n: s.clips });
      stage = `<div class="tm-slide is-9x16 is-video" role="img" aria-label="${esc(T('{title}: {clips}', { title: T(s.opening), clips }))}"><p class="tm-op">${esc(T(s.opening))}</p>
<span class="tm-clip">${icon('Video', 28)}<small>${esc(clips)}</small></span><p class="tm-sub">${esc(T(s.subtitle))}</p><time class="tm-len" dir="ltr">0:${String(tp.seconds).padStart(2, '0')}</time>${logo(tp, 'is-light')}</div>`;
      count = N(tp.seconds, '{n} second', '{n} seconds');
    }
    const what = v.state === 'draft' ? T('Version {v} is a draft: this is a preview, not an output.', { v: v.v }) : T('Made from version {v}, as every output would be.', { v: v.v });
    return `<figure class="tm-prev"><figcaption><h3>${icon('Preview', 18)}<span>${esc(T('Preview with real data'))}</span></h3>
<p class="tm-pt"><b>${esc(src.title)}</b> · ${esc(count)}</p><p class="tm-pm"><code dir="ltr">${esc(s.code)}</code>${src.line ? ` · ${esc(src.line)}` : ''}</p></figcaption>
<div class="tm-stage">${stage}</div>${thumbs}<p class="tm-pn">${esc(what)}</p></figure>`;
  }

  // ---------- the slots, the identity, the versions ----------
  function slots(tp) {
    return `<section class="tm-sec" aria-labelledby="tm-sl-h"><h3 id="tm-sl-h" title="${esc(T('A template is a structured description, not code: Watar writes no code that runs on a server.'))}">${icon('Templates', 18)}<span>${esc(T('Slots'))}</span><span class="tm-c">${tp.slots.length}</span></h3>
<ul class="tm-slots">${tp.slots.map((x) => `<li>${icon(SLOT[x.kind] || 'Templates', 18)}<span><b>${esc(T(x.name))}</b><small>${esc(`${T(x.kind)} · ${T(x.rule)}`)}</small></span></li>`).join('')}</ul></section>`;
  }
  function identity(tp) {
    return `<section class="tm-sec" aria-labelledby="tm-id-h"><h3 id="tm-id-h">${icon('Mark', 18)}<span>${esc(T('Identity'))}</span></h3>
<div class="tm-id" title="${esc(T('Its logo, its colours and its type, the same in every output'))}">${logo(tp, 'is-chip')}<span><b>${esc(T('{brand}’s identity', { brand: T(tp.brand) }))}</b></span></div></section>`;
  }
  function verRow(tp, v, use) {
    if (v.state === 'draft') {
      return `<li class="is-draft">${pen('held')}<span><b>${esc(T('Version {v}', { v: v.v }))}</b><small>${esc(`${T('Draft')} · ${made(tp, v)}`)}</small>${v.change ? `<q>${esc(T(v.change))}</q>` : ''}</span></li>`;
    }
    const by = !v.approved ? T('Approved') : v.now && v.approved.by === C.me ? T('Approved in your name, {when}', { when: FLOW.when(v.approved.at) })
      : T('Approved by {name}, {when}', { name: C.name(v.approved.by), when: FLOW.date(v.approved.at) });
    const out = v === use ? T('In use') : '';
    const n = v.outputs ? N(v.outputs, '{n} output', '{n} outputs') : '';
    return `<li>${icon('Done', 18)}<span><b>${esc(T('Version {v}', { v: v.v }))}</b><small>${esc([by, out, n].filter(Boolean).join(' · '))}</small></span></li>`;
  }
  function past(tp, vs, use) {
    // the newest two, then the earlier ones folded
    const head = vs.slice(0, 2), rest = vs.slice(2);
    return `<section class="tm-sec" aria-labelledby="tm-vs-h"><h3 id="tm-vs-h">${icon('History', 18)}<span>${esc(T('Versions'))}</span><span class="tm-c">${vs.length}</span></h3>
<ol class="tm-vline" aria-hidden="true">${vs.slice().reverse().map((v) => `<li class="${v.state === 'draft' ? 'draft' : v === use ? 'use' : ''}"><i></i><span>${v.v}</span></li>`).join('')}</ol>
<ol class="tm-vers">${head.map((v) => verRow(tp, v, use)).join('')}</ol>
${rest.length ? `<details class="tm-more"><summary>${esc(N(rest.length, 'One earlier version', '{n} earlier versions'))}</summary><ol class="tm-vers">${rest.map((v) => verRow(tp, v, use)).join('')}</ol></details>` : ''}
<p class="tm-foot" title="${esc(T('An approved template never changes; any edit is a new version. Every output keeps its version and its values, so it can be made again.'))}">${icon('Lock', 16)}<span>${esc(T('An approved version never changes; an edit is a new version.'))}</span></p></section>`;
  }

  // ---------- the template selected ----------
  function detail() {
    const tp = LIST.find((x) => x.id === pick), el = $('[data-detail]');
    if (!tp) { el.innerHTML = ''; return; }
    const vs = versions(tp), v = vs[0], use = inUse(vs), draft = v.state === 'draft';
    const state = draft ? `<span class="tm-st is-draft">${pen('held')}<span>${esc(T('Draft'))}</span></span>` : `<span class="tm-st">${icon('Done', 16)}<span>${esc(T('Approved'))}</span></span>`;
    // a draft's rule, where it applies: nothing is made from it, and what is in use until it is approved
    const rule = draft ? `<div class="tm-draft"><p title="${esc(T('The database itself refuses output from it until a person approves it.'))}"><b>${esc(T('Nothing is made from a draft.'))}</b></p>`
      + `<p>${esc(use ? T('Version {v} stays in use until then.', { v: use.v }) : T('Until then, this template makes nothing.'))}</p></div>` : '';
    // approving: the owner's, in their own name, confirmed in place
    let act = soon(T('Edit by talking'), '', 'Ask Watar');
    if (draft && C.P.owner) {
      act += asking ? '' : `<button type="button" class="btn primary" data-approve>${icon('Done', 18)}<span>${esc(T('Approve in your name'))}</span></button>`;
    }
    const confirm = draft && asking ? `<div class="cf-in tm-cf"><p>${esc(T('Approve version {v} of {name} in your name?', { v: v.v, name: T(tp.name) }))} <span>${esc(T('From then on every output is made from it, and it never changes.'))}</span></p>
<div class="cf-act"><button type="button" class="btn primary" data-yes>${icon('Done', 18)}<span>${esc(T('Approve'))}</span></button><button type="button" class="btn" data-no>${esc(T('Cancel'))}</button></div></div>` : '';
    el.innerHTML = `<header class="tm-dh"><div class="tm-dt"><p class="tm-dk">${icon(KIND[tp.kind] || 'Templates', 16)}<span>${facts(tp)}</span></p>
<h2 id="tm-d-h" tabindex="-1">${esc(T(tp.name))} <span>· ${esc(T('version {v}', { v: v.v }))}</span></h2><p class="tm-ds">${state}<span>${esc(made(tp, v))}</span></p></div>
<div class="tm-act">${act}</div></header>${confirm}${rule}
<div class="tm-body">${preview(tp, v)}<div class="tm-spec">${slots(tp)}${identity(tp)}${past(tp, vs, use)}</div></div>`;
  }

  // ---------- what was just done, with its Undo ----------
  function note(text) {
    const el = $('[data-note]');
    $('[data-note-t]').textContent = text;
    el.hidden = false;
    clearTimeout(note.t);
    note.t = setTimeout(function fade() {
      if (el.contains(document.activeElement)) { note.t = setTimeout(fade, 4000); return; }
      el.hidden = true;
      undo = null;
    }, 8000);
  }
  function choose(id, focus) {
    pick = id;
    slide = 0;
    asking = false;
    try { history.replaceState(null, '', C.href('templates.html', { t: id })); } catch (e) { /* the address stays */ }
    list();
    detail();
    // narrow, the template opens under the list: take the reader there
    if (focus && matchMedia('(max-width: 979px)').matches) {
      const h = $('#tm-d-h');
      h.focus({ preventScroll: true });
      h.scrollIntoView({ block: 'start', behavior: window.Beats.reduce() ? 'auto' : 'smooth' });
    }
  }
  root.addEventListener('click', (e) => {
    const a = e.target.closest('[data-pick]');
    if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); choose(a.dataset.pick, true); return; }
    const b = e.target.closest('button');
    if (!b || b.getAttribute('aria-disabled') === 'true') return;
    const tp = LIST.find((x) => x.id === pick);
    if (b.dataset.slide) {
      slide = +b.dataset.slide;
      detail();
      const again = $(`[data-slide="${slide}"]`);
      if (again) again.focus();
    } else if (b.hasAttribute('data-approve')) {
      asking = true;
      detail();
      $('[data-yes]').focus();
    } else if (b.hasAttribute('data-no')) {
      asking = false;
      detail();
      $('[data-approve]').focus();
    } else if (b.hasAttribute('data-yes') && tp) {
      const v = tp.versions[0].v, m = approved();
      m[tp.id] = { v, by: C.me };
      keep(m);
      asking = false;
      undo = tp.id;
      list();
      detail();
      const row = $('.tm-vers li');
      if (row && !window.Beats.reduce()) row.animate([{ backgroundColor: 'rgba(25, 23, 46, 0.06)' }, { backgroundColor: 'rgba(25, 23, 46, 0)' }], { duration: M.beat * 2, easing: M.ease_leave });
      note(T('Version {v} of {name} is approved in your name, for this visit. Nothing is sent in this prototype.', { v, name: T(tp.name) }));
      $('[data-undo]').focus();
    } else if (b.hasAttribute('data-undo') && undo) {
      const m = approved();
      delete m[undo];
      keep(m);
      undo = null;
      $('[data-note]').hidden = true;
      list();
      detail();
      const again = $('[data-approve]');
      if (again) again.focus();
    }
  });

  document.title = `${T('Templates')} · ${T(O.name)}`;
  $('[data-org]').textContent = T(O.name);
  $('[data-acts]').innerHTML = soon(T('Upload a template'), '', 'Upload') + soon(T('Build a template with Watar'), '', 'Ask Watar');
  if (!LIST.length) {
    $('[data-body]').innerHTML = `<div class="tm-none"><p>${icon('Templates', 18)}<b>${esc(T('No templates yet.'))}</b></p>`
      + `<p>${esc(T('Upload one, or build one with Watar: slots in your identity, approved by a person before anything is made from it.'))}</p></div>`;
    return;
  }
  list();
  detail();
})();
