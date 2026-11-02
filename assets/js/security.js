// Security: the plan's rules shown where they hold. Sign-in (the organization's single sign-on when it has one);
// each sensitive field with the roles that may see it (hidden fields never reach a browser); the client links open now,
// each until its date, revocable; the named acceptances behind fully automatic blocks; and how keys are kept.
(function () {
  const root = document.querySelector('main.sc');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'khaled', masar: 'samir', wamda: 'hala' });
  const T = window.T, N = window.I18N.n, esc = FLOW.esc, O = C.O;
  const $ = (s) => root.querySelector(s);
  const icon = (n, s) => IQ.icon(n, s || 18);
  root.querySelectorAll('a[data-keep]').forEach((a) => { a.href = C.href(a.getAttribute('href')); });
  if (!C.P.owner) {
    $('[data-body]').innerHTML = `<div class="pk-none"><p><b>${esc(T('The settings of {org} belong to its owner.', { org: T(O.name) }))}</b></p></div>`;
    return;
  }
  const KEY = `iqaa-revoked:${O.id}`;
  const revoked = () => { try { return JSON.parse(FLOW.store.get(KEY) || '[]') || []; } catch (e) { return []; } };
  const box = (id, ic, title, body) => `<section class="pk-sec sc-box" aria-labelledby="${id}"><div class="pk-sh"><h3 id="${id}">${icon(ic)}<span>${esc(title)}</span></h3></div>${body}</section>`;
  const on = (t, ok) => `<li>${ok ? icon('Done', 16) : `<span class="sc-off">${icon('Lock', 16)}</span>`}<span>${esc(t)}</span>${ok ? '' : `<em>${T('Soon')}</em>`}</li>`;

  function render() {
    // sign-in
    const sso = (O.integrations || []).find((x) => x.id === 'google');
    const signin = `<ul class="sc-list">${sso ? on(T('Single sign-on with {name}', { name: 'Google' }), true) : ''}${on(T('Email and password'), true)}${on(T('Two-step sign-in'), false)}</ul>`;
    // sensitive fields: who may see each, from the roles of every block
    const roles = (f) => [...new Set(C.blocks.flatMap((b) => b.roles.filter((r) => r.fields && (r.fields[f] === 'read' || r.fields[f] === 'write')).map((r) => T(r.role))))];
    const secret = Object.entries(O.fields).filter(([, f]) => f.secret);
    const fields = secret.length ? `<ul class="sc-fields">${secret.map(([k, f]) => { const rs = roles(k); return `<li>${icon('Lock', 16)}<b>${esc(T(f.name))}</b><span class="sc-who">${rs.length ? rs.map((r) => `<span class="sc-chip">${esc(r)}</span>`).join('') : `<span class="sc-none">${esc(T('Nobody yet'))}</span>`}</span></li>`; }).join('')}</ul>`
      + `<p class="sc-rule" title="${esc(T('A hidden field never reaches the browser of a role that may not see it.'))}">${icon('Preview', 16)}<span>${esc(T('Hidden from every other role'))}</span></p>` : `<p class="sc-none">${esc(T('No field is marked sensitive.'))}</p>`;
    // client links open now
    const gone = revoked();
    const shares = (O.shares || []).map((s) => {
      const it = C.items.find((x) => x.code === s.code), off = gone.includes(s.code);
      return `<li class="${off ? 'is-off' : ''}">${icon('Link', 16)}<span class="sc-st"><b>${esc(it ? T(it.title) : s.code)}</b><small>${esc(T(s.client))} · ${off ? esc(T('Revoked')) : esc(T('Works until {date}', { date: FLOW.date(s.until) }))}</small></span>`
        + `${off ? '' : `<button type="button" class="btn small" data-revoke="${esc(s.code)}">${icon('Discard', 16)}<span>${T('Revoke')}</span></button>`}</li>`;
    }).join('');
    const links = shares ? `<ul class="sc-links">${shares}</ul>` : `<p class="sc-none">${esc(T('No client link is open.'))}</p>`;
    // named acceptances behind fully automatic blocks
    const acc = ((O.newsLine || {}).blocks || []).filter((b) => b.accepted).map((b) => `<li>${IQ.glyph('run')}<span class="sc-st"><b>${esc(T(b.name))}</b><small>${esc(T(b.mode))}</small></span><span class="sc-by"><span class="me-av" aria-hidden="true">${esc(C.name(b.accepted.by).charAt(0))}</span>${esc(C.name(b.accepted.by))} · ${esc(FLOW.date(b.accepted.at))}</span></li>`).join('');
    const accept = acc ? `<ul class="sc-acc">${acc}</ul>` : `<p class="sc-none">${esc(T('Nothing runs fully automatically.'))}</p>`;
    // keys
    const n = (O.integrations || []).length;
    const keys = `<p class="sc-keys">${FLOW.stat('Lock', n, N(n, '{n} key, encrypted for this organization alone', '{n} keys, encrypted for this organization alone'))}<span>${esc(N(n, '{n} key, encrypted for this organization alone', '{n} keys, encrypted for this organization alone'))}</span></p>`;
    $('[data-body]').innerHTML = box('sc-in', 'Sign out', T('Signing in'), signin) + box('sc-f', 'Lock', T('Sensitive fields'), fields)
      + box('sc-l', 'Link', T('Client links open now'), links) + box('sc-a', 'Done', T('Named acceptances'), accept) + box('sc-k', 'Settings', T('Integration keys'), keys);
  }
  let undo = null;
  const note = (t) => { $('[data-note-t]').textContent = t; $('[data-note]').hidden = false; };
  root.addEventListener('click', (e) => {
    const r = e.target.closest('[data-revoke]');
    if (r) { FLOW.store.set(KEY, JSON.stringify(revoked().concat([r.dataset.revoke]))); undo = r.dataset.revoke; render(); note(T('The link stops working at once. Nothing is sent in this prototype.')); $('[data-undo]').focus(); return; }
    if (e.target.closest('[data-undo]') && undo) { FLOW.store.set(KEY, JSON.stringify(revoked().filter((x) => x !== undo))); undo = null; $('[data-note]').hidden = true; render(); }
  });
  render();
  document.title = `${T('Security')} · ${T(O.name)}`;
})();
