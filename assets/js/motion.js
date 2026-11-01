// Motion: the mark writes itself, and five product moments on the motion page. Durations come from the tempo.
(function () {
  const M = (window.IQAA && window.IQAA.motion) || { eighth: 75, quarter: 150, half: 300, beat: 600, ease_arrive: 'cubic-bezier(0.2, 0, 0, 1)', ease_move: 'cubic-bezier(0.4, 0, 0.2, 1)' };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));

  // the pen draws every stroke of an svg in order, each a quarter beat, starting a step apart
  function write(svg, gap) {
    if (!svg || reduce) return;
    [...svg.querySelectorAll('path, circle')].forEach((m, i) => {
      const delay = i * (gap == null ? M.quarter : gap);
      if (m.tagName === 'path' && m.getAttribute('fill') === 'none' && !m.getAttribute('stroke-dasharray')) {
        const len = m.getTotalLength();
        m.animate([{ strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 }],
          { duration: M.quarter, delay, easing: M.ease_move, fill: 'backwards' });
      } else {
        m.animate([{ opacity: 0 }, { opacity: 1 }], { duration: M.quarter, delay, easing: M.ease_arrive, fill: 'backwards' });
      }
    });
  }

  // the overview's wide hero: the pen first, an eighth of a beat a stroke; then the names; then the tile signs it
  function writeLine(svg) {
    const strokes = [...svg.querySelectorAll('.hl-pen path, .hl-pen circle')];
    write({ querySelectorAll: () => strokes }, M.eighth);
    const end = strokes.length * M.eighth + M.quarter;
    svg.querySelectorAll('.hl-names text').forEach((t, i) => t.animate([{ opacity: 0 }, { opacity: 1 }],
      { duration: M.half, delay: end + i * (M.eighth / 2), easing: M.ease_arrive, fill: 'backwards' }));
    const tile = svg.querySelector('.hl-tile');
    if (tile) tile.animate([{ opacity: 0 }, { opacity: 1 }], { duration: M.half, delay: end + M.half, easing: M.ease_arrive, fill: 'backwards' });
  }
  document.querySelectorAll('[data-reveal]').forEach((fig) => {
    const svg = fig.querySelector(':scope > svg');
    if (!svg || reduce) return;
    if (fig.hasAttribute('data-hero-line')) writeLine(svg); else write(svg);
  });

  function swapGlyph(holder, kind) {
    if (!window.IQ) return;
    holder.innerHTML = IQ.glyph(kind);
    const svg = holder.querySelector('svg');
    svg.setAttribute('width', '72');
    write(svg);
  }

  const demos = {
    reveal(el) { write(el.querySelector('.stage svg')); },

    async handoff(el) {
      const items = el.querySelectorAll('[data-item]');
      const lock = el.querySelector('[data-lock]');
      const job = el.querySelector('[data-job]');
      items.forEach((i) => i.classList.remove('on'));
      lock.classList.remove('on');
      job.classList.remove('on');
      for (const it of items) { await wait(M.quarter); it.classList.add('on'); }
      await wait(M.quarter);
      lock.classList.add('on');
      await wait(M.quarter);
      job.classList.add('on');
    },

    approve(el, btn) {
      const done = btn.dataset.state === 'done';
      swapGlyph(el.querySelector('[data-approve-glyph]'), done ? 'held' : 'struck');
      btn.dataset.state = done ? '' : 'done';
      btn.textContent = done ? 'Approve' : 'Reset';
      btn.classList.toggle('primary', done);
      el.querySelector('[data-approve-note]').textContent = done ? 'Draft from Watar. Nothing is sent until you approve.' : 'Approved by Reem at 10:14. The job moves on.';
    },

    test(el) { write(el.querySelector('[data-test-stage] svg'), M.eighth); },

    fail(el, btn, retry) {
      swapGlyph(el.querySelector('[data-fail-glyph]'), retry ? 'run' : 'failed');
      el.querySelector('[data-fail-note]').textContent = retry ? 'Send the quote link · retried, ran at 10:05' : 'Send the quote link · failed at 10:02: no phone number';
    },
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-play], [data-retry]');
    if (!btn) return;
    const el = btn.closest('[data-demo]');
    if (!el) return;
    const name = el.dataset.demo;
    if (name === 'fail') return demos.fail(el, btn, btn.hasAttribute('data-retry'));
    demos[name](el, btn);
  });
})();
