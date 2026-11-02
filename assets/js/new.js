// A new item. It joins the line at its first block: the line's start drawn above the form says where. It is given to
// someone who works there (skills first) or left open for their role to claim; it has a due time and, if it needs one,
// a skill. Made, it is kept for the visit and opens on its own page. The organization's noun names everything.
(function () {
  const root = document.querySelector('main.nn');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'khaled', masar: 'samir', wamda: 'hala' });
  const W = window.WORLD, T = window.T, esc = FLOW.esc, O = C.O, NO = C.noun;
  const $ = (s) => root.querySelector(s);
  const icon = (n, s) => IQ.icon(n, s || 18);
  const first = C.path[0];
  // who may make one: the owner, and anyone with a role in the first block
  const may = C.P.owner || C.rolesIn(first).length > 0;
  const workers = [...new Set(first.roles.filter((r) => !r.lead).flatMap((r) => r.people))].filter((k) => O.people[k] && O.people[k].type !== 'invited');

  $('[data-h]').textContent = NO.t('New job');
  $('[data-sum]').innerHTML = `${icon('Line')}<span>${esc(T('It joins {line} at {block}', { line: T(C.line.name), block: T(first.name) }))}</span>`;
  if (!may) {
    $('[data-body]').innerHTML = `<p class="nn-no">${icon('Lock')}<span>${esc(T('Only the owner and the people of {block} start new work.', { block: T(first.name) }))}</span></p>`;
    return;
  }
  // tomorrow at 17:00, the day's usual hand-in
  const due = new Date(FLOW.ms(`${W.dayIso}T12:00`) + 864e5).toISOString().slice(0, 10);
  $('[data-body]').innerHTML = `<div class="nn-grid"><form class="nn-form" data-form novalidate>
<div class="field"><label for="nn-t">${T('Item title')}</label><input id="nn-t" type="text" maxlength="90" autocomplete="off" aria-describedby="nn-t-e" required><p class="err" id="nn-t-e" hidden></p></div>
<fieldset class="nn-who"><legend>${T('Who takes it')}</legend>
<label class="nn-op"><input type="radio" name="who" value="" checked><span class="me-av nn-open" aria-hidden="true">${icon('Inbox', 16)}</span><span><b>${esc(T('Open to claim'))}</b><small>${esc(T('Anyone whose role here may claim'))}</small></span></label>
${workers.map((k) => `<label class="nn-op"><input type="radio" name="who" value="${k}"><span class="me-av" aria-hidden="true">${esc(T(O.people[k].name).charAt(0))}</span><span><b>${esc(T(O.people[k].name))}</b><small>${esc(T(O.people[k].title))}</small></span>${FLOW.hbar(O.people[k].hours || 0, T(O.people[k].title))}</label>`).join('')}
</fieldset>
<div class="nn-two"><div class="field"><label for="nn-d">${T('Due')}</label><input id="nn-d" type="date" value="${due}" min="${W.dayIso}" dir="ltr"></div>
<div class="field"><label for="nn-s">${T('Needs a skill')}</label><select id="nn-s"><option value="">${T('None')}</option>${(O.skills || []).map((s) => `<option value="${esc(s)}">${esc(T(s))}</option>`).join('')}</select></div></div>
<div class="nn-act"><button type="submit" class="btn primary">${icon('Create')}<span>${esc(NO.t('Start the job'))}</span></button><a class="btn" href="${C.href('home.html')}">${T('Cancel')}</a></div>
</form>
<aside class="nn-line" aria-label="${esc(T('Where it starts'))}">${C.stages({ at: [first.id], code: '' })}</aside></div>`;

  // the person picked from the list shows first in the skill's order: who has the skill rises (as the queue does)
  $('[data-form]').addEventListener('submit', (e) => {
    e.preventDefault();
    const t = $('#nn-t'), err = $('#nn-t-e');
    if (!t.value.trim()) { err.hidden = false; err.textContent = T('Give it a title.'); t.setAttribute('aria-invalid', 'true'); t.focus(); return; }
    const who = (root.querySelector('input[name="who"]:checked') || {}).value || null, now = W.now;
    const it = { code: FLOW.nextCode(O), title: t.value.trim(), at: [first.id], who, state: who ? 'new' : 'open', due: `${$('#nn-d').value || due}T17:00`, opened: now,
      assigned: who ? { by: C.me, at: now } : null, needs: $('#nn-s').value || undefined, fields: {}, talk: 0, log: who ? [[first.id, C.me, now, 'assigned']] : [] };
    FLOW.create(O, it);
    location.href = C.href('item.html', { code: it.code });
  });
  document.title = `${NO.t('New job')} · ${T(O.name)}`;
})();
