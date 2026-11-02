// Publishing a new version of a line: what changed since the version that runs now, in the organization's words; how
// many live items are on the line and what happens to them; where the items in a block the draft removes go; and the
// check. Publishing marks the draft published for the visit and draws the new version's line in ink.
//
// The check is the same for every organization and runs on every publish and on what Watar builds, so this file holds
// it for those screens too: Start and the review of what Watar built load it first and read window.CHECK.
(function () {
  if (!window.WORLD) return;
  const T = window.T, N = window.I18N.n;

  // names in a sentence: 'Montage', 'Montage and Design', 'Analysis, Development and Testing'
  const list = (names) => (names.length < 2 ? names[0] || '' : T('{a} and {b}', { a: names.slice(0, -1).join(T(', ')), b: names[names.length - 1] }));

  // ---------- the check ----------
  // A closed road is a block no item can reach from the line's first block, a block from which the line's end cannot
  // be reached, or an approval with no way back. With `people`, a block nobody is in fails too; an automatic block
  // needs nobody.
  function check(blocks, o) {
    const ids = new Set(blocks.map((b) => b.id));
    const from = (b) => (b.after || []).filter((a) => ids.has(a));
    const spread = (seed, test) => {
      const set = new Set([seed]);
      let more = true;
      while (more) {
        more = false;
        blocks.forEach((b) => { if (!set.has(b.id) && test(b, set)) { set.add(b.id); more = true; } });
      }
      return set;
    };
    const main = blocks.filter((b) => !b.side), end = main[main.length - 1];
    const reached = spread(blocks[0].id, (b, s) => from(b).some((a) => s.has(a)));
    const leads = spread(end.id, (b, s) => blocks.some((x) => s.has(x.id) && from(x).includes(b.id)));
    const r = {
      unreached: blocks.filter((b) => !reached.has(b.id)),
      dead: blocks.filter((b) => reached.has(b.id) && !leads.has(b.id)),
      noBack: blocks.filter((b) => b.kind === 'approval' && !(b.back && b.back !== b.id && ids.has(b.back))),
      empty: o && o.people ? blocks.filter((b) => b.kind !== 'auto' && !b.roles.some((x) => x.people.length)) : [],
      auto: blocks.filter((b) => b.kind === 'auto'),
      people: !!(o && o.people),
    };
    r.roads = !r.unreached.length && !r.dead.length && !r.noBack.length;
    r.ok = r.roads && !r.empty.length;
    return r;
  }
  // what the check found, in the same words on every screen: [{ ok, text }]
  function rows(r) {
    const names = (bs) => list(bs.map((b) => T(b.name)));
    const out = [];
    if (r.roads) out.push({ ok: true, text: T('No closed roads: every block can be reached and leads on, and every approval has a way back.') });
    if (r.unreached.length) out.push({ ok: false, text: N(r.unreached.length, 'No block leads to {blocks}.', 'No block leads to {blocks}.', { blocks: names(r.unreached) }) });
    if (r.dead.length) out.push({ ok: false, text: N(r.dead.length, 'The line’s end cannot be reached from {blocks}.', 'The line’s end cannot be reached from {blocks}.', { blocks: names(r.dead) }) });
    if (r.noBack.length) out.push({ ok: false, text: N(r.noBack.length, '{blocks} approves with no way back.', '{blocks} approve with no way back.', { blocks: names(r.noBack) }) });
    if (r.people && r.empty.length) out.push({ ok: false, text: T('Nobody is in {blocks} yet.', { blocks: names(r.empty) }) });
    if (r.people && !r.empty.length) {
      const auto = r.auto.length ? ` ${N(r.auto.length, '{blocks} runs by itself and needs nobody.', '{blocks} run by themselves and need nobody.', { blocks: names(r.auto) })}` : '';
      out.push({ ok: true, text: T('Every block has people.') + auto });
    }
    return out;
  }
  window.CHECK = { line: check, rows, list };

  // ---------- the page ----------
  const root = document.querySelector('main.pb');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'khaled', masar: 'samir' });
  const esc = FLOW.esc, NO = C.noun, O = C.O, L = C.line;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const icon = (n, s) => IQ.icon(n, s || 20);
  const uniq = (a) => [...new Set(a)];
  // the version published this visit, kept beside the draft (flow.js) so a reload shows it published
  const KEY = `iqaa-published:${O.id}:${L.id}`;

  // ---------- the next version: the line with the draft's changes applied ----------
  // A block added after another takes its place in the line: what followed that block follows the new one. A removed
  // block is joined over: what followed it now follows what came before it, and a way back into it returns to the
  // block before it. Changes the canvas makes that this page does not know how to draw are still listed.
  function upcoming(changes) {
    const d = Object.assign(C.draft(), changes ? { changes } : {});
    let blocks = C.blocks.map((b) => Object.assign({}, b, { after: (b.after || []).slice() }));
    const removed = [], fresh = new Set();
    d.changes.forEach((c) => {
      if (c.type === 'add') {
        // a block the seeded draft describes in full, or one added from the canvas's palette, which describes itself in
        // `op`: it has no people yet, so the check holds up publishing until someone is in it
        const made = c.op && c.op.op === 'add' ? { id: c.op.id, name: (c.vars || {}).block, dept: (C.block(c.op.after) || {}).dept, hours: 4, after: [c.op.after], roles: [],
          kind: { work: 'work', approval: 'approval', wait: 'wait', watar: 'approval' }[c.op.type] || 'auto' } : null;
        const def = (d.adds || []).find((a) => a.id === c.block) || made;
        if (!def || blocks.some((b) => b.id === def.id)) return;
        const nb = Object.assign({}, def, { after: (def.after || []).slice(), stroke: WORLD.STROKE[def.kind] });
        blocks.forEach((b) => { if (!b.side && b.after.some((a) => nb.after.includes(a))) b.after = uniq(b.after.map((a) => (nb.after.includes(a) ? nb.id : a))); });
        const at = nb.after.length ? Math.max(...nb.after.map((a) => blocks.findIndex((b) => b.id === a))) + 1 : blocks.length;
        blocks.splice(at, 0, nb);
        fresh.add(nb.id);
      } else if (c.type === 'remove') {
        const gone = blocks.find((b) => b.id === c.block);
        if (!gone) return;
        blocks = blocks.filter((b) => b !== gone);
        blocks.forEach((b) => {
          if (b.after.includes(gone.id)) b.after = uniq(b.after.flatMap((a) => (a === gone.id ? gone.after : [a])));
          if (b.back === gone.id) b.back = gone.after[0];
        });
        if (fresh.has(gone.id)) fresh.delete(gone.id);
        else removed.push(C.block(gone.id));
      }
    });
    return { d, blocks, removed, fresh };
  }

  // a change as the organization says it: the sentence with its data names translated and set in bold
  const CHANGE = { add: 'Create', remove: 'Discard', field: 'Files', mode: 'Settings' };
  function sentence(c) {
    return esc(T(c.text)).replace(/\{(\w+)\}/g, (m, k) => (c.vars && k in c.vars ? `<b>${esc(T(c.vars[k]))}</b>` : m));
  }
  const changes = (d) => `<ul class="pb-ch">${d.changes.map((c) => `<li>${icon(CHANGE[c.type] || 'Draft', 18)}<span>${sentence(c)}</span></li>`).join('')}</ul>`;

  // the line in the grammar's strokes, block by block: what this version adds in the dashed grey pen until it is
  // published, all of it in ink once it is; a block that runs beside the main path is named under it
  function drawn(U, inked) {
    const path = U.blocks.filter((b) => !b.side);
    const beside = U.blocks.filter((b) => b.side).map((b) => {
      const m = path.find((x) => (x.after || []).some((a) => (b.after || []).includes(a)));
      return m ? `${esc(T(b.name))} · ${esc(T('beside {block}', { block: T(m.name) }))}` : '';
    }).filter(Boolean);
    const li = path.map((b) => {
      const isNew = !inked && U.fresh.has(b.id);
      return `<li class="${isNew ? 'new' : 'done'}"${U.fresh.has(b.id) ? ' data-fresh' : ''}><span class="stg-g" aria-hidden="true">${IQ.glyph(b.stroke, { test: isNew })}</span><span class="stg-n">${isNew ? `<span class="sr">${esc(T('New'))}: </span>` : ''}${esc(T(b.name))}</span></li>`;
    }).join('');
    const label = T('Version {v} of {line}', { v: U.d.version, line: T(L.name) });
    return `<div class="pb-line"><ol class="stg pb-sig" style="--n:${path.length}" aria-label="${esc(label)}">${li}</ol></div>${beside.length ? `<p class="pb-beside">${beside.join('<br>')}</p>` : ''}`;
  }

  // ---------- what the person decides ----------
  let keep = 'finish';
  const places = {};
  function render(U) {
    const v = U.d.version, old = L.version, live = C.items.length;
    const R = check(U.blocks, { people: true });
    $('[data-line]').innerHTML = `<span class="pb-g" aria-hidden="true">${IQ.glyph('held', { test: true })}</span><span>${esc(T(L.name))} · ${esc(T('Draft of version {v}', { v }))}</span>`;
    $('[data-h]').textContent = T('Publish version {v} of {line}', { v, line: T(L.name) });
    $('[data-sum]').textContent = T('The line runs on version {n} until you publish.', { n: old });
    document.title = `${T('Publish a new version')} · ${T(O.name)}`;
    if (!U.d.changes.length) {
      $('[data-body]').innerHTML = `<div class="pb-none"><p><b>${esc(T('Nothing to publish.'))}</b></p><p>${esc(T('The draft is the same as version {old}. Change the line on the canvas first.', { old }))}</p>
<p><a class="btn" href="${C.href('lines.html')}">${icon('Line', 18)}<span>${esc(T('Back to the canvas'))}</span></a></p></div>`;
      return;
    }
    const moves = U.removed.map((b) => ({ b, items: C.items.filter((it) => it.at.includes(b.id)) }));
    // a removed block's items: under the safe choice they finish there; moved, each block needs a place on the new version
    const place = ({ b, items }) => {
      if (!items.length) return `<div class="pb-rm"><h3>${icon('Discard', 18)}<span>${esc(T(b.name))}</span></h3><p class="pb-rm-n">${esc(NO.t('No live job is in {block}, so nothing needs a place.', { block: T(b.name) }))}</p></div>`;
      const opts = U.blocks.map((x) => `<option value="${x.id}"${places[b.id] === x.id ? ' selected' : ''}>${esc(T(x.name))}</option>`).join('');
      return `<div class="pb-rm" data-rm="${b.id}"><h3>${icon('Move job', 18)}<span>${esc(NO.n(items.length, '{n} job in {block}, which this version removes', '{n} jobs in {block}, which this version removes', { block: T(b.name) }))}</span></h3>
<ul class="pb-items">${items.slice(0, 5).map((it) => `<li><a href="${C.href('item.html', { code: it.code })}">${esc(T(it.title))}</a><code dir="ltr">${it.code}</code>${it.who ? `<span>${esc(C.name(it.who))}</span>` : ''}</li>`).join('')}</ul>
${items.length > 5 ? `<p class="pb-more">${esc(N(items.length - 5, 'and {n} more', 'and {n} more'))}</p>` : ''}
<p class="pb-stay" data-stay>${esc(NO.n(items.length, 'It finishes there, on version {old}.', 'They finish there, on version {old}.', { old }))}</p>
<div class="field pb-to" data-to hidden><label for="pb-to-${b.id}">${esc(T('Where do they go?'))}</label><select id="pb-to-${b.id}" data-place="${b.id}"><option value="">${esc(T('Choose a block'))}</option>${opts}</select></div></div>`;
    };
    const choice = (val, title, hint, tag) => `<label class="pb-opt"><input type="radio" name="keep" value="${val}"${keep === val ? ' checked' : ''}>
<span class="pb-opt-t"><b>${esc(title)}${tag ? ` <em>${esc(tag)}</em>` : ''}</b><span>${esc(hint)}</span></span></label>`;
    const checks = rows(R).map((x) => `<li class="${x.ok ? 'is-ok' : 'is-bad'}">${x.ok ? icon('Done', 18) : `<span class="pb-g" aria-hidden="true">${IQ.glyph('failed')}</span>`}<span>${x.ok ? '' : `<span class="sr">${esc(T('Problem'))}: </span>`}${esc(x.text)}</span></li>`).join('');
    // the decisions down the main column; the check and the two buttons beside them, in sight while the person decides
    $('[data-body]').innerHTML = `<div class="pb-grid"><div class="pb-main">
<section class="pb-sec" aria-labelledby="pb-ch-h"><h2 id="pb-ch-h">${icon('History', 18)}${esc(T('What changed since version {old}', { old }))}</h2>
<div class="pb-draft" title="${esc(T('What this version adds is drawn in the dashed grey pen until you publish it.'))}">${changes(U.d)}${drawn(U, false)}</div></section>
<section class="pb-sec" aria-labelledby="pb-live-h"><h2 id="pb-live-h">${icon('Line', 18)}${esc(NO.n(live, '{n} live job on this line', '{n} live jobs on this line'))}</h2>
<fieldset class="pb-keep"><legend class="sr">${esc(NO.t('What happens to the live jobs'))}</legend>
${choice('finish', NO.t('Live jobs finish on version {old}, and new ones start on version {v}', { old, v }), NO.t('Nothing moves under anyone’s hands: each job keeps the line it started on.'), T('Safe'))}
${choice('move', NO.t('Move every live job to version {v}', { v }), [NO.t('Each job carries on from the same block on the new version.')].concat(moves.length ? [NO.t('Jobs in a block this version removes need a new place.')] : []).join(' '))}
</fieldset>${moves.map(place).join('')}</section></div>
<aside class="pb-side" aria-labelledby="pb-ck-h"><h2 id="pb-ck-h">${icon('Test run', 18)}${esc(T('The check'))}</h2><ul class="pb-ck">${checks}</ul>
<div class="pb-act"><button type="button" class="btn primary" data-publish aria-describedby="pb-why">${icon('Publish', 18)}<span>${esc(T('Publish version {v}', { v }))}</span></button>
<a class="btn" href="${C.href('lines.html')}">${esc(T('Cancel'))}</a><p class="pb-why" id="pb-why" data-why aria-live="polite"></p></div></aside></div>`;
    update(U, R, moves);
  }

  // publishing waits for a clean check and, when the live items move, a place for every item in a removed block
  function update(U, R, moves) {
    const why = [];
    if (!R.ok) why.push(T('Fix what the check found on the canvas, then publish.'));
    moves.forEach(({ b, items }) => {
      const el = $(`[data-rm="${b.id}"]`);
      if (!el) return;
      $('[data-stay]', el).hidden = keep === 'move';
      $('[data-to]', el).hidden = keep !== 'move';
      if (keep === 'move' && items.length && !places[b.id]) why.push(NO.t('Choose where the jobs in {block} go.', { block: T(b.name) }));
    });
    $('[data-publish]').disabled = why.length > 0;
    $('[data-why]').textContent = why.join(' ');
  }

  // ---------- published: the new version's line in ink, and what happened to the live items ----------
  function published(U, rec, fresh) {
    const v = rec.version, old = L.version, live = C.items.length;
    const what = rec.keep === 'move'
      ? [NO.n(live, '{n} live job moved to version {v}.', '{n} live jobs moved to version {v}.', { v })].concat(U.removed.map((b) => {
        const n = C.items.filter((it) => it.at.includes(b.id)).length, to = U.blocks.find((x) => x.id === (rec.places || {})[b.id]);
        return n && to ? NO.n(n, '{n} job went from {from} to {to}.', '{n} jobs went from {from} to {to}.', { from: T(b.name), to: T(to.name) }) : '';
      }).filter(Boolean))
      : [NO.n(live, '{n} live job finishes on version {old}; new jobs start on version {v}.', '{n} live jobs finish on version {old}; new jobs start on version {v}.', { old, v })];
    $('[data-line]').innerHTML = `<span class="pb-g" aria-hidden="true">${IQ.glyph('run')}</span><span>${esc(T(L.name))} · ${esc(T('Version {v} · published', { v }))}</span>`;
    $('[data-h]').textContent = T('Version {v} of {line} is published', { v, line: T(L.name) });
    $('[data-sum]').textContent = T('Published by {name}, {when}.', { name: C.name(C.me), when: FLOW.when(rec.at) });
    $('[data-body]').innerHTML = `<section class="pb-sec pb-pub" aria-labelledby="pb-pub-h"><h2 id="pb-pub-h" class="sr">${esc(T('The line now'))}</h2>${drawn(U, true)}
<ul class="pb-what">${what.map((s) => `<li>${icon('Done', 18)}<span>${esc(s)}</span></li>`).join('')}</ul></section>
<section class="pb-sec" aria-labelledby="pb-ch-h"><h2 id="pb-ch-h">${icon('History', 18)}${esc(T('What changed since version {old}', { old }))}</h2>${changes(U.d)}</section>
<div class="pb-act"><a class="btn primary" href="${C.href('lines.html')}">${icon('Line', 18)}<span>${esc(T('Back to the canvas'))}</span></a><a class="btn" href="${C.href('home.html')}">${icon('Home', 18)}<span>${esc(T('Home'))}</span></a></div>`;
    document.title = `${T('Version {v} of {line} is published', { v, line: T(L.name) })} · ${T(O.name)}`;
    if (fresh) {
      // the pen writes over what was dashed: the blocks this version added, now in ink
      $$('[data-fresh] .stg-g').forEach((g, i) => Beats.write(g, { delay: i * IQAA.motion.eighth }));
      $('[data-h]').focus();
    }
  }

  // a version published this visit is shown published, with the changes it was published with (publishing clears the
  // visit's draft, so they are kept with it)
  let rec = null;
  try { rec = JSON.parse(FLOW.store.get(KEY) || 'null'); } catch (e) { rec = null; }
  const U = upcoming(rec && rec.changes);
  if (rec && rec.version === U.d.version) published(U, rec, false);
  else render(U);

  root.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'keep') keep = t.value;
    else if (t.dataset.place) places[t.dataset.place] = t.value;
    else return;
    update(U, check(U.blocks, { people: true }), U.removed.map((b) => ({ b, items: C.items.filter((it) => it.at.includes(b.id)) })));
  });
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-publish]');
    if (!b || b.disabled) return;
    const r = { version: U.d.version, at: WORLD.now, keep, places: Object.assign({}, places), changes: U.d.changes };
    FLOW.store.set(KEY, JSON.stringify(r));
    C.discard();
    published(U, r, true);
  });
})();
