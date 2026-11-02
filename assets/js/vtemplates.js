// Video templates: the house's templates the editors start from, each drawn to its frame (16:9, 9:16, 1:1) with what it
// lays on the picture, its length, who keeps it, and its uses in the last 30 days as a bar. A draft is marked.
(function () {
  const root = document.querySelector('main.tl');
  if (!root || !window.FLOW || !window.IQ) return;
  const C = window.FRAME = FLOW.context({ alkhatt: 'heba', masar: 'lina', wamda: 'lama' });
  const T = window.T, N = window.I18N.n, esc = FLOW.esc, O = C.O, NO = C.noun;
  const $ = (s) => root.querySelector(s);
  const icon = (n, s) => IQ.icon(n, s || 16);
  const face = (k) => `<span class="tl-av" title="${esc(C.name(k))}" aria-hidden="true">${esc(C.name(k).charAt(0))}</span>`;
  const none = (ic, t) => { $('[data-body]').innerHTML = `<p class="tl-none">${icon(ic, 20)}<span>${esc(t)}</span></p>`; };
  const list = (O.videoTemplates || []).slice().sort((a, b) => b.used - a.used);
  if (!list.length) return none('Templates', T('No video template yet.'));
  const most = Math.max(1, ...list.map((v) => v.used)), uses = list.reduce((a, v) => a + v.used, 0);
  $('[data-sum]').innerHTML = `<span class="stats">${FLOW.stat('Templates', list.length, N(list.length, '{n} template', '{n} templates'))}${FLOW.stat('Video', uses, N(uses, '{n} use in the last 30 days', '{n} uses in the last 30 days'))}</span>`;
  // what each kind lays on the picture, as flat shapes in the frame
  const DRAW = {
    lower: '<i class="lt-bar"></i><i class="lt-sub"></i>',
    reel: '<i class="rl-cap"></i><i class="rl-cap s"></i>',
    intro: `<span class="in-mark" aria-hidden="true">${esc(((O.mark || {})[I18N.lang] || (O.mark || {}).en || T(O.name)).charAt(0))}</span>`,
    end: '<i class="en-a"></i><i class="en-b"></i><i class="en-c"></i>',
    quote: '<i class="qt-l"></i><i class="qt-l"></i><i class="qt-l s"></i>',
    strip: '<i class="st-strip"></i>',
  };
  $('[data-body]').innerHTML = `<ul class="tl-vt">${list.map((v) => `<li class="tl-card"><div class="tl-frame-w"><div class="tl-frame ${v.kind}" style="aspect-ratio:${v.ratio.replace(':', ' / ')}" aria-hidden="true">${DRAW[v.kind] || ''}</div></div>`
    + `<div class="tl-vt-b"><b>${esc(T(v.name))}</b>${v.draft ? `<span class="tl-draft">${icon('Draft', 14)}${esc(T('Draft'))}</span>` : ''}`
    + `<p class="tl-m"><span dir="ltr">${esc(v.ratio)}</span><span dir="ltr">${icon('Video', 14)}${esc(v.len)}</span><span>${face(v.by)}${esc(C.name(v.by))}</span></p>`
    + `<p class="tl-use" title="${esc(N(v.used, '{n} use in the last 30 days', '{n} uses in the last 30 days'))}"><span><i style="--f:${(v.used / most * 100).toFixed(1)}"></i></span><b>${v.used}</b></p></div></li>`).join('')}</ul>`;
  document.title = `${T('Video templates')} · ${T(O.name)}`;
})();
