// Files: every file on the items the person works on (theirs now, or that they touched), by item, newest first. A
// video is each version of the item's video field; any other file field lists its files. Each with who added it and
// when; the item's title opens it.
(function () {
  const root = document.querySelector('main.tl');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'heba', masar: 'lina', wamda: 'lama' });
  const T = window.T, N = window.I18N.n, esc = FLOW.esc, O = C.O, NO = C.noun;
  const $ = (s) => root.querySelector(s);
  const icon = (n, s) => IQ.icon(n, s || 16);
  const face = (k) => `<span class="tl-av" title="${esc(C.name(k))}" aria-hidden="true">${esc(C.name(k).charAt(0))}</span>`;
  const none = (ic, t) => { $('[data-body]').innerHTML = `<p class="tl-none">${icon(ic, 20)}<span>${esc(t)}</span></p>`; };
  const fileFields = Object.keys(O.fields).filter((k) => O.fields[k].type === 'file');
  const mine = (it) => it.who === C.me || (it.log || []).some((e) => e[1] === C.me) || fileFields.some((f) => ((it.fields || {})[f] || []).some((x) => x.by === C.me));
  const KIND = { video: 'Video', image: 'Image', doc: 'Files' };
  const groups = C.items.filter(mine).map((it) => ({ it, files: fileFields.flatMap((f) => ((it.fields || {})[f] || []).map((x) => (x.v
    ? { name: T('{field} v{v}', { field: T(O.fields[f].name), v: x.v }), kind: 'video', by: x.by, at: x.at, meta: x.len }
    : { name: x.name, kind: x.kind, by: x.by, at: x.at, meta: x.size, ltr: true }))).sort((a, b) => b.at.localeCompare(a.at)) }))
    .filter((g) => g.files.length).sort((a, b) => b.files[0].at.localeCompare(a.files[0].at));
  if (!groups.length) return none('Files', T('No file yet.'));
  const n = groups.reduce((a, g) => a + g.files.length, 0);
  $('[data-sum]').innerHTML = `<span class="stats">${FLOW.stat('Files', n, N(n, '{n} file', '{n} files'))}${FLOW.stat('My work', groups.length, NO.n(groups.length, '{n} job', '{n} jobs'))}</span>`;
  $('[data-body]').innerHTML = groups.map(({ it, files }) => `<section class="tl-box"><h2><a href="${C.href('item.html', { code: it.code })}"><code dir="ltr">${it.code}</code><span>${esc(T(it.title))}</span></a></h2>`
    + `<ul class="tl-files">${files.map((f, i) => `<li${i ? '' : ' class="new"'}><span class="tl-kind ${f.kind}">${icon(KIND[f.kind] || 'Files', 18)}</span><b${f.ltr ? ' dir="ltr"' : ''}>${esc(f.name)}</b>`
      + `<small class="tl-meta" dir="ltr">${esc(f.meta || '')}</small>${face(f.by)}<small class="tl-ago">${esc(FLOW.ago(f.at))}</small></li>`).join('')}</ul></section>`).join('');
  document.title = `${T('Files')} · ${T(O.name)}`;
})();
