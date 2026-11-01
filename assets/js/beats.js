// The signature on screen: steps as glyphs, lines and organization marks, and the motion that writes them.
// Geometry and colours come from grammar.js and window.IQAA; every duration is a fraction of the 600 ms beat.
(function () {
  const M = window.IQAA.motion;
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NAMES = { run: 'runs by itself', held: 'waits for a person', struck: 'done by a person', rest: 'timed wait', failed: 'failed' };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce() ? 0 : ms));

  // draft: a step that is not real yet (Watar's draft, a check that has not run), drawn with a dashed grey pen
  const svg = (kind, o) => IQ.glyph(kind, { pal: (o && o.pal) || 'light', test: !!(o && o.draft) });
  const beat = (kind, o) => `<span class="b" data-k="${kind}">${svg(kind, o)}</span>`;
  const label = (blocks) => blocks.map((b) => `${b.name}: ${b.steps.map((k) => NAMES[k]).join(', ')}`).join('; ');

  // Render an organization's line into el: mode 'mark' signs it on a tile, mode 'line' writes it out with names.
  function sig(el, blocks, o) {
    const opt = Object.assign({ mode: 'line', size: 40, names: true, me: -1, k: 1, pal: 'light' }, o);
    const kinds = blocks.map((b) => b.steps);
    el.innerHTML = opt.mode === 'mark'
      ? IQ.avatar(kinds, { size: opt.size, label: opt.label || '', name: opt.name || '' })
      : IQ.line(kinds, { k: opt.k, pal: opt.pal, names: opt.names ? blocks.map((b) => b.name) : null, me: opt.me, test: !!opt.draft, minLabel: 10 });
    if (opt.mode !== 'mark') { el.setAttribute('role', 'img'); el.setAttribute('aria-label', label(blocks)); }
  }

  // The pen writes the strokes of an svg in order: a quarter beat each, an eighth of a beat apart.
  function write(root, o) {
    const opt = Object.assign({ each: M.quarter, gap: M.eighth / 2, delay: 0 }, o);
    const svgEl = root.tagName === 'svg' ? root : root.querySelector('svg');
    if (!svgEl || reduce()) return Promise.resolve();
    const marks = [...svgEl.querySelectorAll('path, circle, text')];
    const all = marks.map((m, i) => {
      const delay = opt.delay + i * opt.gap;
      if (m.tagName === 'path' && m.getAttribute('fill') === 'none' && !m.getAttribute('stroke-dasharray')) {
        const len = m.getTotalLength();
        return m.animate([{ strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 }],
          { duration: opt.each, delay, easing: M.ease_move, fill: 'backwards' }).finished;
      }
      return m.animate([{ opacity: 0 }, { opacity: 1 }], { duration: opt.each, delay, easing: M.ease_arrive, fill: 'backwards' }).finished;
    });
    const limit = opt.delay + marks.length * opt.gap + opt.each + M.quarter;
    return Promise.race([Promise.all(all), new Promise((r) => setTimeout(r, limit))]);
  }

  // A step that is running ticks on the beat, and stops when it is done.
  function running(span, on) { span.classList.toggle('running', !!on); }

  // Change one step's kind or draft state; the pen writes the new glyph in a quarter beat.
  function set(span, kind, o) {
    const opt = o || {};
    const was = span.dataset.k + (span.dataset.draft || '');
    span.dataset.k = kind;
    span.dataset.draft = opt.draft ? '1' : '';
    span.innerHTML = svg(kind, opt);
    if (was !== kind + span.dataset.draft) write(span, { each: M.quarter, gap: 0 });
  }

  // Content entering a panel: in reading order, an eighth of a beat apart, after an optional offset.
  function enter(panel, offset) {
    if (reduce()) return;
    [...panel.children].filter((c) => !c.hidden).forEach((c, i) => c.animate(
      [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
      { duration: M.half, delay: (offset || 0) + i * M.eighth, easing: M.ease_arrive, fill: 'backwards' }));
  }
  // Content leaving: a quarter-beat fade that never holds the flow if frames are paused.
  function fadeOut(el) {
    if (reduce()) return Promise.resolve();
    return Promise.race([
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: M.quarter, easing: M.ease_arrive, fill: 'forwards' }).finished,
      new Promise((r) => setTimeout(r, M.half))]);
  }
  // A card keeps its top edge and grows or shrinks to its new content in half a beat.
  function resize(card, h0) {
    const h1 = card.offsetHeight;
    if (reduce() || Math.abs(h1 - h0) < 2) return;
    card.animate([{ height: `${h0}px` }, { height: `${h1}px` }], { duration: M.half, easing: M.ease_move });
  }
  // Swap two panels of one card: the old one fades, the card follows the new height, the new one enters.
  async function swap(card, from, to, during) {
    const h0 = card.offsetHeight;
    await fadeOut(from);
    from.hidden = true;
    from.getAnimations().forEach((a) => a.cancel());
    to.hidden = false;
    if (during) during();
    resize(card, h0);
    enter(to);
  }

  window.Beats = { svg, beat, sig, write, running, set, wait, esc, label, reduce, enter, fadeOut, resize, swap };
})();
