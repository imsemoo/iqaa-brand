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
    return `<svg class="${o.cls}" viewBox="${n(-pad)} ${n(top)} ${n(vw)} ${n(bot - top)}" width="${n(vw)}" height="${n(bot - top)}" role="img" aria-label="${describe(blocks)}">${svg}</svg>`;
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
  function avatar(blocks, opts) {
    const o = Object.assign({ size: 40, pal: 'dark', ground: '#19172E', label: '', name: '' }, opts);
    const p = window.IQAA.pal[o.pal];
    if (o.name) {
      // the organization's initial, signed underneath with the opening of its own line: it reads at 40 px
      const opening = lead(blocks, 3), w = layout(opening).w, k = Math.min(0.78, 70 / w);
      const lab = o.label ? ` role="img" aria-label="${esc(o.label)}"` : ' aria-hidden="true"';
      return `<svg class="avatar" viewBox="0 0 100 100" width="${o.size}" height="${o.size}"${lab}><rect width="100" height="100" rx="24" fill="${o.ground}"/>` +
        `<text x="50" y="48" text-anchor="middle" font-size="44" font-weight="600" fill="${p.run}" font-family="Atkinson Hyperlegible Next, sans-serif">${esc(o.name.trim().charAt(0).toUpperCase())}</text>` +
        `<g transform="translate(${n((100 - w * k) / 2)} 78)">${body(opening, k, p, false, Math.max(W, 4.4))}</g></svg>`;
    }
    const rs = rows(blocks), widths = rs.map((r) => layout(r).w), gap = 10;
    const k = Math.min(74 / Math.max(...widths), 70 / ((LOOP_H + W) * rs.length + gap * (rs.length - 1)));
    const sw = o.size < 48 ? Math.max(W, (2.2 / k) * (100 / o.size)) : W;
    const rowH = (LOOP_H + sw) * k, totalH = rowH * rs.length + gap * k * (rs.length - 1);
    const y0 = (100 - totalH) / 2 + LOOP_H * k + (sw * k) / 2;
    const g = rs.map((r, i) => `<g transform="translate(${n((100 - widths[i] * k) / 2)} ${n(y0 + i * (rowH + gap * k))})">${body(r, k, p, false, sw)}</g>`).join('');
    const lab = o.label ? ` role="img" aria-label="${esc(o.label)}"` : ' aria-hidden="true"';
    return `<svg class="avatar" viewBox="0 0 100 100" width="${o.size}" height="${o.size}"${lab}><rect width="100" height="100" rx="24" fill="${o.ground}"/>${g}</svg>`;
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

  window.IQ = { cell, line, avatar, glyph, fold, lineLayout: layout, describe, STEP, HANDOFF, WIDTH };
})();
