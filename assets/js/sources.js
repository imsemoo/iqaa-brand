// Sources and what came in from them (المصادر): what opens items in a line by itself, and every attempt that came in
// from it today. The sources are listed with their state and today's count; the selected one shows its setup (the line
// and block it opens items in, its address, the field map Watar suggests and a person approves, its entry rule) and
// what came in today, every attempt logged even when turned away, with its reason: it became an item (its code, and
// where the item is now), a duplicate (it did not enter: nothing enters a line twice), turned away (why), failed (it
// can be tried again; the new attempt is logged too). Pausing a source works at once, without a version. An
// organization with no source says so. Data: world.js `sources`, `newsLine`.
(function () {
  const root = document.querySelector('main.so');
  if (!root || !window.FLOW || !window.IQ) return;
  // an owner's screen: it opens as each organization's owner (Khaled, Samir, and any organization world.js adds)
  const OWNERS = Object.fromEntries(Object.values(window.WORLD.orgs).map((o) => [o.id, Object.keys(o.people).find((k) => o.people[k].owner)]));
  const C = window.FRAME = FLOW.context(OWNERS);
  const T = window.T, N = window.I18N.n, esc = FLOW.esc, NO = C.noun, O = C.O, W = window.WORLD;
  const $ = (s, el) => (el || document).querySelector(s);
  const icon = (n, s) => IQ.icon(n, s || 20);
  const q = new URLSearchParams(location.search);
  const owner = C.standing === 'owner';
  const NL = O.newsLine;
  const S = O.sources || [];
  const glyph = (kind) => `<span class="so-g" aria-hidden="true">${IQ.glyph(kind)}</span>`;
  // what this prototype does not do yet: shown, in reach of the keyboard, and said to be coming (as the canvas does)
  const soon = (label, ic) => `<button type="button" class="btn" aria-disabled="true" title="${esc(T('{name}: coming next', { name: label }))}">${ic ? icon(ic, 18) : ''}<span>${esc(label)}</span><em>${T('Soon')}</em></button>`;
  const say = (r) => T(r.text, Object.fromEntries(Object.entries(r.vars || {}).map(([k, v]) => [k, T(String(v))])));
  // the pen's two marks the family does not have, drawn with it: pause and start again
  const pen = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const PAUSE = pen('<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>');
  const START = pen('<circle cx="12" cy="12" r="9"/><path d="M10.5 9l4.5 3-4.5 3z"/>');
  // each kind of source by its name and its mark
  const TYPE = { rss: ['RSS', 'Sources'], webhook: ['Webhook', 'Webhook'], telegram: ['Telegram', 'Message'], schedule: ['Schedule', 'Date'], line: ['From another line', 'Line'] };

  // ---------- what changed this visit: a source paused or started, a field Watar proposed approved, a retry ----------
  // { state: { source: 'works' | 'paused' }, map: { 'source|field': 'approved' | 'refused' }, tries: { source: [attempt] } }
  // in sessionStorage 'iqaa-sources:<org>'; a source's own setting applies at once, as a stop does on a line
  const KEY = `iqaa-sources:${O.id}`;
  let saved = {};
  try { saved = JSON.parse(FLOW.store.get(KEY) || '{}') || {}; } catch (e) { saved = {}; }
  ['state', 'map', 'tries'].forEach((k) => { saved[k] = saved[k] || {}; });
  const keep = () => FLOW.store.set(KEY, JSON.stringify(saved));
  const stateOf = (s) => saved.state[s.id] || s.state;
  const today = (s) => s.today.concat(saved.tries[s.id] || []);
  const mapOf = (s) => (s.map || []).filter((m) => saved.map[`${s.id}|${m.from}`] !== 'refused')
    .map((m) => Object.assign({}, m, { proposed: m.proposed && saved.map[`${s.id}|${m.from}`] !== 'approved', approvedNow: saved.map[`${s.id}|${m.from}`] === 'approved' }));

  // ---------- where a source opens items: the quick news line, or one of the organization's lines, at a block ----------
  const lineOf = (s) => (NL && s.line === NL.id ? NL : O.lines.find((l) => l.id === s.line));
  function fieldName(s, f) {
    const L = lineOf(s), fs = (L && L.fields) || O.fields;
    return fs[f] ? T(fs[f].name) : f === 'title' ? T('Item title') : f;
  }
  // an item a source opened: where it is now, linked to where it can be seen
  function itemLink(code) {
    if (NL) {
      const it = (NL.items || []).find((x) => x.code === code);
      if (it) {
        const b = NL.blocks.find((x) => x.id === it.at[0]);
        return { href: C.href('automate.html', { line: NL.id, block: b.id }), where: T('Now in {block}', { block: T(b.name) }) };
      }
    }
    const it = C.items.find((x) => x.code === code);
    return it ? { href: C.href('item.html', { code }), where: T('Now in {block}', { block: T(C.at(it).name) }) } : null;
  }
  const counts = (s) => {
    const t = today(s), by = (r) => t.filter((x) => x.result === r).length;
    return { all: t.length, item: by('item'), duplicate: by('duplicate'), turned: by('turned'), failed: by('failed') };
  };

  // ---------- the list: every source, its state and what came in from it today ----------
  let sel = null, undo = null;
  function stateMark(s) {
    return stateOf(s) === 'paused' ? `<span class="so-st off">${glyph('rest')}<span>${T('Paused')}</span></span>`
      : `<span class="so-st">${icon('Done', 16)}<span>${T('Works')}</span></span>`;
  }
  function renderList() {
    $('[data-n]').textContent = S.length;
    $('[data-list]').innerHTML = S.map((s) => {
      const c = counts(s), L = lineOf(s);
      // the day in icons and numbers: attempts, items, failures (the words are the tooltip and for the screen reader)
      const what = stateOf(s) === 'paused' && !c.all ? esc(T('Nothing comes in while it is paused'))
        : c.all ? `<span class="stats">${FLOW.stat('History', c.all, N(c.all, '{n} attempt today', '{n} attempts today'))}${FLOW.stat('Done', c.item, N(c.item, '{n} became an item', '{n} became items'))}${c.failed ? FLOW.stat('Late', c.failed, N(c.failed, '{n} failed', '{n} failed'), 'late') : ''}</span>` : esc(T('Nothing came in today'));
      return `<li><button type="button" class="so-r" data-pick="${s.id}" aria-expanded="${s.id === sel}" aria-controls="so-d"${s.id === sel ? ' aria-current="true"' : ''}>
<span class="so-i">${icon(TYPE[s.type][1], 20)}</span><span class="so-rt"><span class="so-ty">${esc(T(TYPE[s.type][0]))}</span><b>${esc(T(s.name))}</b>
<small>${what}</small></span>
<span class="so-rx">${stateMark(s)}${L ? `<small>${esc(T(L.name))}</small>` : ''}</span></button></li>`;
    }).join('');
  }

  // ---------- the selected source: its setup, its field map, what came in today ----------
  function nextRun(s) {
    // the next time a schedule runs after now: its day of the week and its time
    const now = FLOW.ms(W.now), d = new Date(now);
    for (let i = 0; i < 8; i++) {
      const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + i));
      const iso = `${day.toISOString().slice(0, 10)}T${s.when.time}`;
      if (day.getUTCDay() === s.when.day && FLOW.ms(iso) > now) return iso;
    }
    return null;
  }
  function setup(s) {
    const L = lineOf(s), rows = [];
    const at = s.at && L && L.blocks ? L.blocks.find((b) => b.id === s.at) : null;
    const lineHref = L === NL ? C.href('automate.html', { line: NL.id }) : C.href('lines.html', at ? { block: at.id } : {});
    if (L) rows.push([T('Opens items in'), `<a href="${lineHref}">${esc(T(L.name))}</a>${at ? `<span>${esc(T('at {block}', { block: T(at.name) }))}</span>` : ''}`]);
    if (s.type === 'webhook') rows.push([T('Address'), `<code dir="ltr">POST ${esc(s.address)}</code>${s.signed ? `<span class="so-sig">${icon('Lock', 16)}${T('Signature on')}</span>` : `<span class="bad">${T('Signature off')}</span>`}`]);
    if (s.type === 'rss') rows.push([T('Reads'), `<code dir="ltr">${esc(s.address)}</code><span>${esc(N(s.every, 'every {n} minute', 'every {n} minutes'))}</span>`]);
    if (s.type === 'telegram') rows.push([T('Channel'), `<code dir="ltr">${esc(s.address)}</code>`]);
    if (s.type === 'schedule') rows.push([T('What it opens'), `<b>${esc(T(s.opens))}</b><span>${esc(T(s.name))}</span>`]);
    if (s.type === 'line') rows.push([T('From'), `<span>${esc(T('the {line} line', { line: T(s.name) }))}</span>`]);
    rows.push([T('Entry rule'), s.rule ? `<span>${esc(say(s.rule))}</span>` : `<span>${T('None: everything new comes in')}</span>`]);
    return `<dl class="sd-set">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
  }
  // the field map: what comes in, and the item's field it fills. Watar suggests it and a person approves it; a pair
  // still waiting is in the dashed grey pen of a proposal until someone approves it
  function fieldMap(s) {
    const map = mapOf(s);
    if (!map.length) return '';
    const by = s.mapBy ? T('Watar suggested it; {name} approved it, {when}.', { name: C.name(s.mapBy.by), when: FLOW.date(s.mapBy.at) }) : '';
    const rows = map.map((m) => `<tr${m.proposed ? ' class="is-proposed"' : ''}><td><code dir="ltr">${esc(m.from)}</code></td><td class="sd-ar" aria-hidden="true"><svg class="flow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M14 6l6 6-6 6"/></svg></td>
<td><b>${esc(fieldName(s, m.to))}</b>${m.proposed ? `<small>${icon('Ask Watar', 16)}${T('Watar proposes it; it waits for a person')}</small>` : m.approvedNow ? `<small>${T('You approved it just now')}</small>` : ''}</td>
<td class="sd-mx">${m.proposed && owner ? `<button type="button" class="btn small" data-approve="${esc(m.from)}">${icon('Done', 16)}<span>${T('Approve')}</span></button><button type="button" class="btn small quiet" data-refuse="${esc(m.from)}">${T('Not this')}</button>` : ''}</td></tr>`).join('');
    return `<section class="sd-s" aria-labelledby="sd-map-h"><h3 id="sd-map-h">${T('Field map')}</h3>${by ? `<p class="hint">${esc(by)}</p>` : ''}
<div class="sd-wrap"><table class="sd-map"><thead><tr><th scope="col">${T('Comes in as')}</th><th scope="col"><span class="sr">${T('fills')}</span></th><th scope="col">${T('Fills the item’s field')}</th><th scope="col"><span class="sr">${T('Approve')}</span></th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }
  // what came in today: every attempt, in the order it came, with what became of it
  function cameIn(s) {
    const t = today(s), c = counts(s);
    if (!t.length) {
      // an empty day says why: paused, or nothing was sent; a schedule says when it runs next
      const next = s.type === 'schedule' && s.when ? nextRun(s) : null;
      const was = stateOf(s) === 'paused' ? (s.type === 'schedule' && s.when ? T('It did not run today at {time}: it is paused.', { time: s.when.time }) : T('Nothing comes in while it is paused.'))
        : next ? T('Nothing came in today. It runs next on {when}.', { when: FLOW.when(next) }) : T('Nothing came in today.');
      return `<section class="sd-s" aria-labelledby="sd-in-h"><h3 id="sd-in-h">${T('What came in today')}</h3><p class="sd-none">${glyph(stateOf(s) === 'paused' ? 'rest' : 'run')}<span>${esc(was)}</span></p></section>`;
    }
    // today's attempts as one bar split by outcome, each part as wide as its count, with its number in the legend
    const parts = [['item', c.item, N(c.item, '{n} became an item', '{n} became items')], ['duplicate', c.duplicate, N(c.duplicate, '{n} duplicate', '{n} duplicates')],
      ['turned', c.turned, N(c.turned, '{n} turned away', '{n} turned away')], ['failed', c.failed, N(c.failed, '{n} failed', '{n} failed')]].filter((p) => p[1]);
    const sum = `<div class="sd-split" role="img" aria-label="${esc(parts.map((p) => p[2]).join(T(', ')))}">${parts.map((p) => `<i class="is-${p[0]}" style="flex:${p[1]}"></i>`).join('')}</div>`
      + `<ul class="sd-key" aria-hidden="true">${parts.map((p) => `<li class="is-${p[0]}"><i></i><span>${esc(p[2])}</span></li>`).join('')}</ul>`;
    const rows = t.map((r, i) => {
      let mark, what, side = '';
      if (r.result === 'item') {
        const ln = itemLink(r.code);
        mark = glyph('run');
        what = `${esc(T('Became an item'))} · <code>${esc(r.code)}</code>${ln ? ` · ${esc(ln.where)}` : ''}`;
        if (ln) side = `<a class="link" href="${ln.href}">${T('Open')}<span class="sr"> ${esc(r.code)}</span></a>`;
      } else if (r.result === 'duplicate') {
        mark = `<span class="so-g">${icon('Discard', 18)}</span>`;
        what = `${esc(T('Duplicate: it did not enter'))} · ${esc(T('already in as {code}', { code: '\u0000' })).replace('\u0000', `<code>${esc(r.of)}</code>`)}`;
      } else if (r.result === 'turned') {
        mark = `<span class="so-g">${icon('Discard', 18)}</span>`;
        what = esc(T('Turned away: {why}', { why: T(r.why) }));
      } else {
        mark = glyph('failed');
        what = `<span class="bad">${esc(T('Failed: {why}', { why: T(r.why) }))}</span>`;
        const retried = t.slice(i + 1).some((x) => x.retry === r.title);
        side = retried ? `<span class="sd-tried">${T('Tried again')}</span>` : owner ? `<button type="button" class="btn small" data-retry="${i}">${icon('Retry', 16)}<span>${T('Try again')}</span></button>` : '';
      }
      return `<li class="is-${r.result}"><time>${esc(FLOW.hm(r.at))}</time>${mark}<span class="sl-t"><b>${esc(T(r.title))}</b><small>${what}</small></span>${side ? `<span class="sl-x">${side}</span>` : ''}</li>`;
    }).join('');
    const rules = `${T('Nothing enters a line twice: the same link or title within 30 days stops at the door as a duplicate.')} ${T('Every attempt is logged, even what was turned away, with its reason, so “why did this not come in?” always has an answer.')}`;
    return `<section class="sd-s" aria-labelledby="sd-in-h"><h3 id="sd-in-h" title="${esc(rules)}">${T('What came in today')}<span class="sr"> ${esc(rules)}</span></h3>${sum}
<ol class="sd-log">${rows}</ol></section>`;
  }
  function renderDetail() {
    const s = S.find((x) => x.id === sel), off = stateOf(s) === 'paused';
    const paused = off && s.paused && stateOf(s) === s.state ? `<p class="sd-p">${glyph('rest')}<span>${esc(T('Paused by {name}, {when}.', { name: C.name(s.paused.by), when: FLOW.date(s.paused.at) }))}</span></p>` : '';
    const act = owner ? (off ? `<button type="button" class="btn" data-resume>${START}<span>${T('Start it again')}</span></button>` : `<button type="button" class="btn" data-pause>${PAUSE}<span>${T('Pause')}</span></button>`) : '';
    $('[data-detail]').innerHTML = `<div class="sd-h"><span class="so-i big">${icon(TYPE[s.type][1], 24)}</span><div class="sd-ht"><p>${esc(T(TYPE[s.type][0]))}</p><h2 id="so-d-h">${esc(T(s.name))}</h2>${stateMark(s)}</div>${act ? `<div class="sd-act">${act}</div>` : ''}</div>
${paused}${setup(s)}${fieldMap(s)}${cameIn(s)}`;
  }

  function renderAll() {
    renderList();
    renderDetail();
    const p = new URLSearchParams(location.search);
    p.set('source', sel);
    history.replaceState(null, '', `${location.pathname}?${p}${location.hash}`);
  }
  function note(text, fn) {
    const el = $('[data-note]');
    $('[data-note-t]').textContent = text;
    undo = fn;
    el.hidden = false;
    clearTimeout(note.t);
    note.t = setTimeout(() => { el.hidden = true; undo = null; }, 8000);
  }
  // a change made here, kept for the visit, with the way back
  function change(fn, text) {
    const was = JSON.stringify(saved);
    fn();
    keep();
    renderAll();
    note(text, () => { saved = JSON.parse(was); keep(); renderAll(); });
  }

  // ---------- an organization with no source: said plainly, with what could become one ----------
  function none() {
    // a sign-in provider is not a source; every other connection could be one
    const el = $('[data-none]'), ig = (O.integrations || []).filter((x) => !(x.use && x.use.sso)).map((x) => x.name);
    el.hidden = false;
    el.innerHTML = `<h2 id="so-none-h">${esc(NO.t('No source opens jobs yet.'))}</h2>
<p>${T('A source opens items in a line by itself: a feed, a webhook, a channel, a schedule or another line. Every attempt is logged, even what is turned away.')}</p>
${ig.length ? `<p>${esc(T('Connected already, and able to become a source: {list}.', { list: `\u2068${ig.join(T(', '))}\u2069` }))}</p>` : ''}`;
  }

  // ---------- start ----------
  $('[data-new]').innerHTML = owner ? soon(T('New source'), 'Create') : '';
  if (!S.length) { none(); return; }
  $('[data-cols]').hidden = false;
  // the source named in the address, else the one most came in from today
  sel = S.some((s) => s.id === q.get('source')) ? q.get('source') : S.slice().sort((a, b) => today(b).length - today(a).length)[0].id;
  renderAll();

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button, a');
    if (!t || t.getAttribute('aria-disabled') === 'true' || t.disabled) return;
    const s = S.find((x) => x.id === sel);
    if (t.dataset.pick) {
      sel = t.dataset.pick;
      renderAll();
      $(`[data-pick="${sel}"]`).focus();
      // on a narrow screen the source opens under the list: take the reader there
      if (matchMedia('(max-width: 899px)').matches) $('[data-detail]').scrollIntoView({ block: 'start', behavior: window.Beats && window.Beats.reduce() ? 'auto' : 'smooth' });
    } else if (t.hasAttribute('data-undo') && undo) {
      const fn = undo;
      undo = null;
      $('[data-note]').hidden = true;
      fn();
    } else if (!owner) {
      // only the owner changes a source
    } else if (t.hasAttribute('data-pause')) {
      change(() => { saved.state[s.id] = 'paused'; }, T('{source} is paused. Nothing comes in from it until it is started again.', { source: T(s.name) }));
      $('[data-resume]').focus();
    } else if (t.hasAttribute('data-resume')) {
      const next = s.type === 'schedule' && s.when ? nextRun(s) : null;
      change(() => { saved.state[s.id] = 'works'; }, next ? T('{source} works again. It runs next on {when}.', { source: T(s.name), when: FLOW.when(next) }) : T('{source} works again.', { source: T(s.name) }));
      $('[data-pause]').focus();
    } else if (t.dataset.approve) {
      change(() => { saved.map[`${s.id}|${t.dataset.approve}`] = 'approved'; }, T('Approved: {from} fills {field} from now on.', { from: t.dataset.approve, field: fieldName(s, s.map.find((m) => m.from === t.dataset.approve).to) }));
    } else if (t.dataset.refuse) {
      change(() => { saved.map[`${s.id}|${t.dataset.refuse}`] = 'refused'; }, T('Watar’s proposal is set aside: {from} fills nothing.', { from: t.dataset.refuse }));
    } else if (t.dataset.retry) {
      // trying again is an attempt like any other: it is logged, and what failed for the same reason fails again
      const r = today(s)[+t.dataset.retry];
      change(() => { saved.tries[s.id] = (saved.tries[s.id] || []).concat([{ at: W.now, title: r.title, result: 'failed', why: 'the link still does not open', retry: r.title }]); },
        T('Tried again at {time}: the link still does not open. Nothing entered, and the attempt is logged.', { time: FLOW.hm(W.now) }));
    }
  });
})();
