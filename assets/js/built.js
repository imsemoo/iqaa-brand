// Reviewing what Watar built, before the owner invites the team. Watar says in the organization's own words what it
// built (its word for what walks the line, its blocks, where the line splits and meets, where an approval sends work
// back) and draws the line; then the departments it suggests, the fields an item carries with their kinds (a
// sensitive one marked), the invitations by the roles it made, and for each block and role which items they see and
// which fields are hidden from them. All of it is Watar's proposal, in the dashed grey pen until a person accepts it.
//
// What Watar built is this prototype's one fixture of "what Watar would build from the idea": the organization's line
// as world.js has it, so the review matches every other screen. Nothing here is written for one organization.
(function () {
  const root = document.querySelector('main.bt');
  if (!root || !window.FLOW || !window.IQ || !window.CHECK) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'khaled', masar: 'samir' });
  const T = window.T, N = window.I18N.n, esc = FLOW.esc, NO = C.noun, O = C.O, L = C.line, B = C.blocks;
  const $ = (s, el) => (el || document).querySelector(s);
  const icon = (n, s) => IQ.icon(n, s || 20);
  const list = window.CHECK.list;
  const name = (b) => T(b.name);
  // a block's stroke in the dashed grey pen of Watar's draft
  const glyph = (kind) => `<span class="bt-g" aria-hidden="true">${IQ.glyph(kind, { test: true })}</span>`;
  // what this prototype does not do yet: shown, kept in reach of the keyboard, and said to be coming
  const soon = (label, cls, ic) => `<button type="button" class="btn ${cls || ''}" aria-disabled="true" title="${esc(T('{name}: coming next', { name: label }))}">${ic ? icon(ic, 18) : ''}<span>${esc(label)}</span><em>${T('Soon')}</em></button>`;

  // ---------- what Watar says it built, from the line itself ----------
  // the main path in order; a block that runs beside it is said where it splits off, the blocks on the main branch
  // until the two meet again, and where they meet; then where each approval sends work back, who approves a work
  // block, and what runs by itself
  function story() {
    const path = B.filter((b) => !b.side);
    const beside = (m) => B.find((s) => s.side && (s.after || []).join() === (m.after || []).join());
    const out = [N(O.departments.length, 'I built one line, {line}, for your {n} department.', 'I built one line, {line}, for your {n} departments.', { line: T(L.name) })];
    let run = [], started = false, i = 1;
    const flush = () => {
      if (!started) out.push(run.length ? NO.t('The job starts at {first} and goes through {blocks}.', { first: name(path[0]), blocks: list(run.map(name)) }) : NO.t('The job starts at {first}.', { first: name(path[0]) }));
      else if (run.length) out.push(T('Then it goes through {blocks}.', { blocks: list(run.map(name)) }));
      started = true;
      run = [];
    };
    while (i < path.length) {
      const m = path[i], s = beside(m);
      if (s) {
        flush();
        const split = [T('Then {a} and {b} run side by side.', { a: name(m), b: name(s) })];
        let j = i + 1;
        for (; j < path.length && !(path[j].after || []).includes(s.id); j++) split.push(T('{block} follows {after}.', { block: name(path[j]), after: name(path[j - 1]) }));
        if (j < path.length) split.push(T('They meet again at {block}.', { block: name(path[j]) }));
        out.push(split.join(' '));
        i = j + 1;
      } else if (i === path.length - 1) {
        flush();
        out.push(T('It ends at {block}.', { block: name(m) }));
        i++;
      } else {
        run.push(m);
        i++;
      }
    }
    flush();
    const more = [];
    const backs = B.filter((b) => b.kind === 'approval' && b.back && C.block(b.back));
    if (backs.length) more.push(NO.t('An approval that says no sends the job back: {list}.', { list: list(backs.map((b) => T('{from} to {to}', { from: name(b), to: name(C.block(b.back)) }))) }));
    B.filter((b) => b.approve).forEach((b) => more.push(T('{role} approves {block} before it moves on.', { role: T(b.approve), block: name(b) })));
    const auto = B.filter((b) => b.kind === 'auto');
    if (auto.length) more.push(N(auto.length, '{blocks} runs by itself; nobody works in it.', '{blocks} run by themselves; nobody works in them.', { blocks: list(auto.map(name)) }));
    return [out.join(' '), more.join(' ')].filter(Boolean);
  }

  // the line, block by block, in the dashed grey pen; a block beside the main path is named under it
  function drawn() {
    const path = B.filter((b) => !b.side);
    const beside = B.filter((b) => b.side).map((b) => {
      const m = path.find((x) => (x.after || []).some((a) => (b.after || []).includes(a)));
      return m ? `${esc(name(b))} · ${esc(T('beside {block}', { block: name(m) }))}` : '';
    }).filter(Boolean);
    const li = path.map((b) => `<li class="ahead"><span class="stg-g" aria-hidden="true">${IQ.glyph(b.stroke, { test: true })}</span><span class="stg-n">${esc(name(b))}</span></li>`).join('');
    return `<div class="bt-line" tabindex="0" role="region" aria-label="${esc(T('{line}, as Watar drew it', { line: T(L.name) }))}"><ol class="stg bt-sig" style="--n:${path.length}" aria-label="${esc(T('{line}, as Watar drew it', { line: T(L.name) }))}">${li}</ol></div>${beside.length ? `<p class="bt-beside">${beside.join('<br>')}</p>` : ''}`;
  }

  // ---------- the departments, the fields, the invitations ----------
  function departments() {
    const rows = O.departments.map((d) => ({ d, bs: B.filter((b) => b.dept === d.id) })).map(({ d, bs }) => `<li><span class="bt-dh"><b>${esc(T(d.name))}</b><span class="bt-gs">${bs.map((b) => glyph(b.stroke)).join('')}</span></span>
<small>${bs.length ? esc(list(bs.map(name))) : esc(T('No block yet'))}</small></li>`).join('');
    return `<section class="bt-sec" aria-labelledby="bt-dp-h"><h2 id="bt-dp-h">${icon('Company', 18)}${esc(N(O.departments.length, '{n} department', '{n} departments'))}</h2>
<span class="sr">${esc(T('Suggested from your idea. Rename them or add one on the canvas.'))}</span><ul class="bt-dl">${rows}</ul></section>`;
  }
  const KIND = { text: 'Long text', file: 'File', choice: 'Choice', money: 'Amount', duration: 'Duration', pr: 'Pull request', link: 'Link' };
  function fields() {
    const keys = Object.keys(O.fields);
    const rows = keys.map((k) => {
      const f = O.fields[k];
      return `<li${f.secret ? ' class="is-secret"' : ''}><b>${esc(T(f.name))}</b><span>${esc(T(KIND[f.type] || f.type))}${f.secret ? `<span class="bt-sens">${icon('Lock', 16)}${esc(T('Sensitive'))}</span>` : ''}</span></li>`;
    }).join('');
    const secret = keys.some((k) => O.fields[k].secret);
    return `<section class="bt-sec" aria-labelledby="bt-fd-h"><h2 id="bt-fd-h">${icon('Files', 18)}${esc(NO.n(keys.length, 'The job carries {n} field', 'The job carries {n} fields'))}</h2>
<span class="sr">${esc(secret ? T('A sensitive field is hidden from everyone until a role is given it.') : T('Watar found nothing sensitive to hide.'))}</span><ul class="bt-fl">${rows}</ul></section>`;
  }
  // one invitation per role Watar made, in the order the line first needs it, with what the role does where
  function invitations() {
    const roles = [];
    B.forEach((b) => b.roles.forEach((r) => {
      let x = roles.find((y) => y.role === r.role);
      if (!x) roles.push(x = { role: r.role, blocks: [], lead: false, approves: false });
      x.blocks.push(b);
      if (r.lead) x.lead = true;
      if (b.kind === 'approval') x.approves = true;
    }));
    const rows = roles.map((x) => {
      const where = list(x.blocks.map(name));
      const does = x.lead ? T('Leads {blocks}', { blocks: where }) : x.approves ? T('Approves in {blocks}', { blocks: where }) : T('Works in {blocks}', { blocks: where });
      return `<li>${icon('Invite', 18)}<span><b>${esc(T(x.role))}</b><small>${esc(does)}</small></span></li>`;
    }).join('');
    return `<section class="bt-sec" aria-labelledby="bt-iv-h"><h2 id="bt-iv-h">${icon('Invite', 18)}${esc(T('Suggested invitations'))} <span class="bt-n">${roles.length}</span></h2>
<span class="sr">${esc(T('One for each role Watar made. You don’t need to invite everyone now, but a block with nobody in it holds up publishing.'))}</span><ul class="bt-il">${rows}</ul></section>`;
  }

  // ---------- who may do what: a row per role in each block ----------
  const SEES = { assigned: 'Assigned to them', all: 'All', team: 'Their team’s' };
  // the fields a role does not see: those not on its list, or with no list, the sensitive ones (flow.js reads the same)
  const hidden = (r) => Object.keys(O.fields).filter((f) => !(r.fields ? r.fields[f] : !O.fields[f].secret)).map((f) => T(O.fields[f].name));
  function table() {
    const L1 = T('Block'), L2 = T('Suggested role'), L3 = NO.t('Which jobs they see'), L4 = T('Hidden fields');
    const rows = B.map((b) => {
      const head = (n) => `<th scope="rowgroup" rowspan="${n}"><span class="bt-th">${glyph(b.stroke)}<span>${esc(name(b))}</span></span></th>`;
      if (!b.roles.length) return `<tbody><tr>${head(1)}<td data-l="${esc(L2)}" colspan="3" class="bt-auto">${esc(T('Runs by itself; nobody works in it.'))}</td></tr></tbody>`;
      return `<tbody>${b.roles.map((r, i) => {
        const h = hidden(r);
        return `<tr>${i ? '' : head(b.roles.length)}<td data-l="${esc(L2)}">${esc(T(r.role))}</td><td data-l="${esc(L3)}">${esc(T(SEES[r.sees] || r.sees))}</td>
<td data-l="${esc(L4)}"${h.length ? '' : ' class="bt-none"'}>${esc(h.length ? h.join(T(', ')) : T('Nothing'))}</td></tr>`;
      }).join('')}</tbody>`;
    }).join('');
    return `<section class="bt-sec bt-who" aria-labelledby="bt-wh-h"><h2 id="bt-wh-h">${icon('Lock', 18)}${esc(T('Who may do what'))}</h2>
<span class="sr">${esc(T('Watar hides the sensitive fields from the people who do the work. You can change every row on the canvas.'))}</span>
<table class="bt-t"><thead><tr><th scope="col">${esc(L1)}</th><th scope="col">${esc(L2)}</th><th scope="col">${esc(L3)}</th><th scope="col">${esc(L4)}</th></tr></thead>${rows}</table></section>`;
  }

  // ---------- the page ----------
  const checked = window.CHECK.rows(window.CHECK.line(B));
  $('[data-line]').innerHTML = `<span class="bt-g" aria-hidden="true">${IQ.glyph('held', { test: true })}</span><span>${esc(T(L.name))} · ${esc(T('Built by Watar, as a draft'))}</span>`;
  $('[data-sum]').textContent = T('Nothing is live, and nobody is invited yet.');
  $('[data-act]').innerHTML = `<a class="btn" href="${C.href('lines.html')}">${icon('Line', 18)}<span>${esc(T('Edit on the canvas'))}</span></a>${soon(T('Looks right, invite the team'), 'primary', 'Invite')}`;
  $('[data-prop]').innerHTML = `<span class="sr">${esc(T('Everything Watar proposes is drawn in the dashed grey pen until you accept it.'))}</span>
<section class="bt-wr" aria-labelledby="bt-wr-h"><h2 id="bt-wr-h">${icon('Ask Watar', 18)}${esc(T('What Watar built'))}</h2>
<div class="bt-story">${story().map((p) => `<p>${esc(p)}</p>`).join('')}</div>${drawn()}
<ul class="bt-ck">${checked.map((x) => `<li${x.ok ? '' : ' class="is-bad"'}>${x.ok ? icon('Done', 18) : `<span class="bt-g" aria-hidden="true">${IQ.glyph('failed')}</span>`}<span>${esc(x.text)}</span></li>`).join('')}</ul></section>
<div class="bt-cols">${departments()}${fields()}${invitations()}</div>${table()}`;
  document.title = `${T('Review what Watar built')} · ${T(O.name)}`;
})();
