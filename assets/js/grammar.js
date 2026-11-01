// The signature grammar in the browser. Same strokes as tools/brand.py; constants arrive in window.IQAA.
(function () {
  const M = window.IQAA.mark;
  const STEP = M.step, W = M.stroke, HANDOFF = M.handoff, LOOP_H = M.loop_h;
  const TOP = -(LOOP_H + W), BOT = 9;
  const n = (v) => +(+v).toFixed(3);
  const SHAPES = {
    run: 'h24',
    struck: 'c10 0 18 -8 18 -18c0 -8 -6 -12 -10 -12c-6 0 -9 5 -8 12c2 12 10 18 24 18',
    held: 'c3 -20 21 -20 24 0',
    failed: 'h9l2 5m2 0l2 -5h9',
    flourish: 'c8 0 14 -6 18 -16',
  };
  const WIDTH = { run: STEP, struck: STEP, held: STEP, rest: STEP, failed: STEP, flourish: 18 };
  const WORD = { run: 'runs by itself', held: 'waits for a person', struck: 'done by a person', rest: 'timed wait', failed: 'failed' };
  const describe = (blocks) => blocks.map((b) => b.map((k) => WORD[k]).join(', ')).join(' | ');
  const scale = (d, k) => (k === 1 ? d : d.replace(/-?\d+(?:\.\d+)?/g, (m) => n(m * k)));
  const colour = (kind, p) => (kind === 'struck' || kind === 'held' ? p.person : kind === 'failed' ? p.alert : p.run);

  // One step at (x, y) on the baseline, scaled by k. test: Watar's draft or a test run, a dashed grey pen.
  function cell(kind, x, y, p, k, test, sw) {
    const w = (sw || W) * k;
    const c = test ? p.test : colour(kind, p);
    const dash = test ? ` stroke-dasharray="${n(w * 1.4)} ${n(w * 1.4)}"` : '';
    if (kind === 'rest') {
      return `<path d="M${n(x * k)} ${n(y * k)}h${n(4 * k)}M${n((x + 20) * k)} ${n(y * k)}h${n(4 * k)}" fill="none" stroke="${c}" stroke-width="${n(w)}" stroke-linecap="round"${dash}/>` +
        `<circle cx="${n((x + 12) * k)}" cy="${n(y * k)}" r="${n(w * 0.9)}" fill="${c}"/>`;
    }
    return `<path d="M${n(x * k)} ${n(y * k)}${scale(SHAPES[kind], k)}" fill="none" stroke="${c}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`;
  }

  function layout(blocks) {
    const out = [];
    let x = 0;
    blocks.forEach((steps, bi) => {
      if (bi) { out.push({ kind: 'handoff', x, bi }); x += HANDOFF; }
      steps.forEach((kind, si) => { out.push({ kind, x, bi, si }); x += WIDTH[kind]; });
    });
    return { cells: out, w: x };
  }

  function body(blocks, k, p, test, sw) {
    return layout(blocks).cells.map((c) => (c.kind === 'handoff'
      ? `<path d="M${n(c.x * k)} 0h${n(HANDOFF * k)}" fill="none" stroke="${test ? p.test : p.run}" stroke-width="${n((sw || W) * k)}" stroke-linecap="round"${test ? ` stroke-dasharray="${n(W * k * 1.4)} ${n(W * k * 1.4)}"` : ''}/>`
      : cell(c.kind, c.x, 0, p, k, test, sw))).join('');
  }

  // A line as one continuous stroke. opts: k (px per unit), pal, test, names (station names under each),
  // me (index of the reader's station: its name in ink and a rule under its steps), minLabel (px floor for
  // the names when a long line is drawn small), cls.
  function line(blocks, opts) {
    const o = Object.assign({ k: 1, pal: 'light', test: false, cls: 'sig', names: null, me: -1, minLabel: 0 }, opts);
    const p = window.IQAA.pal[o.pal];
    const { cells, w } = layout(blocks);
    let svg = body(blocks, o.k, p, o.test);
    let bot = BOT * o.k, right = w * o.k;
    if (o.names) {
      const ls = Math.max(11 * o.k, o.minLabel), u = ls / 11;
      const start = {}, end = {};
      cells.forEach((c) => { if (c.kind !== 'handoff') { if (start[c.bi] == null) start[c.bi] = c.x; end[c.bi] = c.x + WIDTH[c.kind]; } });
      svg += o.names.map((name, i) => {
        const me = i === o.me;
        const rule = me ? `<path d="M${n(start[i] * o.k)} ${n((BOT + 1) * o.k)}H${n(end[i] * o.k)}" stroke="${p.run}" stroke-width="${n(1.6 * o.k)}" stroke-linecap="round" class="me-rule"/>` : '';
        // names alternate between two rows so a long name never runs into the next station's
        const row = o.me >= 0 ? 0 : i % 2;
        right = Math.max(right, start[i] * o.k + name.length * ls * 0.56);  // about the width of the name
        return `${rule}<text x="${n(start[i] * o.k)}" y="${n(BOT * o.k + (15 + row * 13) * u)}" font-size="${n(ls)}" font-weight="${me ? 700 : 400}" fill="${me ? p.run : (o.pal === 'dark' ? '#B5B2C2' : '#4F4D63')}" font-family="Atkinson Hyperlegible Next, sans-serif">${esc(name)}</text>`;
      }).join('');
      bot = BOT * o.k + (o.me >= 0 ? 20 : 33) * u;
    }
    const pad = W * o.k, top = TOP * o.k, vw = right + 2 * pad;
    return `<svg class="${o.cls ? `${o.cls} flow` : 'flow'}" viewBox="${n(-pad)} ${n(top)} ${n(vw)} ${n(bot - top)}" width="${n(vw)}" height="${n(bot - top)}" role="img" aria-label="${describe(blocks)}">${svg}</svg>`;
  }

  // An organization's mark: its own line signed across an ink tile; long lines sign on two rows.
  function rows(blocks) {
    const steps = blocks.reduce((a, b) => a + b.length, 0);
    if (steps <= 6) return [blocks];
    const total = layout(blocks).w;
    const out = [[]];
    let acc = 0;
    blocks.forEach((b) => {
      const bw = layout([b]).w;
      if (out[0].length && out.length < 2 && acc + bw / 2 > total / 2) out.push([]);
      out[out.length - 1].push(b);
      if (out.length === 1) acc += bw + HANDOFF;
    });
    return out;
  }
  // the opening of a line, whole stations only, up to about three steps: what fits under an initial
  function lead(blocks, limit) {
    const out = [];
    let c = 0;
    for (const b of blocks) {
      if (out.length && c + b.length > limit) break;
      out.push(b.slice(0, limit));
      c += Math.min(b.length, limit);
    }
    return out;
  }
  // ---------- organization marks: the initial in Iqaa's hand, written in the order its line opens ----------
  const HAND = window.IQAA.letters || {};
  const TILE_R = 22.37, CAP = 30, INITIAL = 50, LIFT = 1.5, PEN_RATIO = M.mark_stroke / LOOP_H;
  const isPerson = (kind) => kind === 'struck' || kind === 'held';
  // each step of the opening takes an equal share of the letter's length, in the colour of who does it
  function initial(ch, kinds, size, p) {
    const L = HAND[ch], k = INITIAL / CAP;
    const pen = Math.max(PEN_RATIO * INITIAL, 150 / size);   // never thinner than 1.5 px
    const cx = ((L.x0 + L.x1) / 2 + L.cx) / 2;                 // halfway between the box and the ink
    const cols = kinds.length ? kinds.map((kd) => (isPerson(kd) ? p.person : p.run)) : [p.run];
    const share = L.len.reduce((a, b) => a + b, 0) / cols.length, runs = [];
    cols.forEach((c, i) => {
      const last = runs[runs.length - 1];
      if (last && last[0] === c) last[2] = (i + 1) * share; else runs.push([c, i * share, (i + 1) * share]);
    });
    let out = '', s = 0;
    L.d.forEach((d, i) => {
      const ln = L.len[i], e = s + ln;
      runs.forEach(([c, a, b]) => {
        const lo = Math.max(a, s) - s, hi = Math.min(b, e) - s;
        if (hi - lo < 0.01) return;
        let dash = '';
        if (lo > 0.01 || hi < ln - 0.01) {
          const far = n(ln * 2);
          dash = ` data-seg="1" stroke-dasharray="${n(hi - lo)} ${far}" stroke-dashoffset="${n(-lo)}"`;
        }
        out += `<path d="${d}" fill="none" stroke="${c}"${dash}/>`;
      });
      s = e;
    });
    return `<g transform="translate(${n(50 - cx * k)} ${n(50 + INITIAL / 2 - LIFT)}) scale(${n(k)})" stroke-width="${n(pen / k)}" stroke-linecap="round" stroke-linejoin="round">${out}</g>`;
  }
  function avatar(blocks, opts) {
    const o = Object.assign({ size: 40, pal: 'dark', ground: '#19172E', label: '', name: '' }, opts);
    const p = window.IQAA.pal[o.pal];
    if (o.name) {
      const ch = o.name.trim().charAt(0).toUpperCase(), kinds = lead(blocks, 3).flat();
      const lab = o.label ? ` role="img" aria-label="${esc(o.label)}"` : ' aria-hidden="true"';
      // a script the hand does not write yet: the letter set in type, in the colour of the line's first step
      const inner = HAND[ch] ? initial(ch, kinds, o.size, p)
        : `<text x="50" y="68" text-anchor="middle" font-size="52" font-weight="600" fill="${kinds.length && isPerson(kinds[0]) ? p.person : p.run}" font-family="Atkinson Hyperlegible Next, Noto Sans Arabic, sans-serif">${esc(ch)}</text>`;
      return `<svg class="avatar" viewBox="0 0 100 100" width="${o.size}" height="${o.size}"${lab}><rect width="100" height="100" rx="${TILE_R}" fill="${o.ground}"/>${inner}</svg>`;
    }
    const rs = rows(blocks), widths = rs.map((r) => layout(r).w), gap = 10;
    const k = Math.min(74 / Math.max(...widths), 70 / ((LOOP_H + W) * rs.length + gap * (rs.length - 1)));
    const sw = o.size < 48 ? Math.max(W, (2.2 / k) * (100 / o.size)) : W;
    const rowH = (LOOP_H + sw) * k, totalH = rowH * rs.length + gap * k * (rs.length - 1);
    const y0 = (100 - totalH) / 2 + LOOP_H * k + (sw * k) / 2;
    const g = rs.map((r, i) => `<g transform="translate(${n((100 - widths[i] * k) / 2)} ${n(y0 + i * (rowH + gap * k))})">${body(r, k, p, false, sw)}</g>`).join('');
    const lab = o.label ? ` role="img" aria-label="${esc(o.label)}"` : ' aria-hidden="true"';
    return `<svg class="avatar" viewBox="0 0 100 100" width="${o.size}" height="${o.size}"${lab}><rect width="100" height="100" rx="${TILE_R}" fill="${o.ground}"/>${g}</svg>`;
  }

  // One step on its own, for buttons and legends.
  function glyph(kind, opts) {
    const o = Object.assign({ pal: 'light', test: false }, opts);
    const w = WIDTH[kind] || STEP;
    return `<svg viewBox="${n(-W)} ${n(TOP)} ${n(w + 2 * W)} ${n(BOT - TOP)}" aria-hidden="true">${cell(kind, 0, 0, window.IQAA.pal[o.pal], 1, o.test)}</svg>`;
  }

  // Kept for the identity book's generator and demos: blocks of kinds as one line.
  function fold(kinds, opts) { return avatar([kinds], { size: Math.max(24, Math.round(((opts && opts.k) || 2) * 20)) }); }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // An icon of the family (tools/p_ct.py ICONS): 24 px grid, 1.5 px pen, round ends, never filled.
  function icon(name, size) {
    const d = (window.IQAA.icons || {})[name], s = size || 20;
    return d ? `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>` : '';
  }

  window.IQ = { cell, line, avatar, glyph, fold, icon, lead, lineLayout: layout, describe, STEP, HANDOFF, WIDTH };
})();
