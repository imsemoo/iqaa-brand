// The signature generator: edit a line, see its signature, the organization's mark, the client header and the
// sign-in screen. The pen writes the line again on demand, at the tempo.
(function () {
  const root = document.querySelector('[data-gen]');
  if (!root || !window.IQ) return;
  const KINDS = ['run', 'held', 'struck', 'rest'];
  const NAMES = { run: 'runs by itself', held: 'waits for a person', struck: 'done by a person', rest: 'timed wait' };
  const MAX_BLOCKS = 12, MAX_STEPS = 6;
  const M = window.IQAA.motion;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s) => root.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let state = null;

  function load(key) {
    const L = window.IQAA.lines[key];
    // a demo organization keeps its own initial and address (Al-Khatt Media signs K at alkhatt.iqaa.co) until its name is edited
    state = { org: L.org, mark: L.mark, address: L.address, blocks: L.blocks.map((b) => ({ name: b.name, steps: b.steps.map((s) => s[0]) })) };
    $('[data-org]').value = state.org;
    root.querySelectorAll('[data-tpl]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tpl === key)));
    renderEditor();
    renderOut();
  }

  function renderEditor() {
    $('[data-blocks]').innerHTML = state.blocks.map((b, bi) => `
<li class="gblk">
<input type="text" value="${esc(b.name)}" maxlength="24" aria-label="Station ${bi + 1} name" data-name="${bi}">
<div class="gsteps">${b.steps.map((k, si) => `<button type="button" class="gstep" data-step="${bi}:${si}" aria-label="Station ${bi + 1}, step ${si + 1}: ${NAMES[k]}. Press to change.">${IQ.glyph(k)}</button>`).join('')}</div>
<div class="gact">
<button type="button" class="btn small" data-plus="${bi}" aria-label="Add a step to station ${bi + 1}"${b.steps.length >= MAX_STEPS ? ' disabled' : ''}>Add a step</button>
<button type="button" class="btn small" data-minus="${bi}" aria-label="Remove the last step of station ${bi + 1}"${b.steps.length <= 1 ? ' disabled' : ''}>Remove a step</button>
<button type="button" class="btn small" data-drop="${bi}" aria-label="Remove station ${bi + 1}"${state.blocks.length <= 1 ? ' disabled' : ''}>Remove station</button>
</div>
</li>`).join('');
    $('[data-add-block]').disabled = state.blocks.length >= MAX_BLOCKS;
  }

  const kinds = () => state.blocks.map((b) => b.steps);
  const slug = (s) => (s.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'your-team');
  const address = () => state.address || `${slug(state.org)}.iqaa.co`;
  const initial = () => state.mark || state.org || 'Your team';

  function renderOut() {
    $('[data-sig]').innerHTML = IQ.line(kinds(), { names: state.blocks.map((b) => b.name) });
    const org = esc(state.org || 'Your team');
    $('[data-client]').innerHTML = `
<div class="client-top">${IQ.avatar(kinds(), { size: 32, name: initial() })}<b>${org}</b></div>
<p class="client-h">Ready for your approval</p>
<p class="note">${address()}/r/…</p>
<p class="runs">${IQ.line([['run', 'struck', 'flourish']], { k: 0.4 })}<span>Runs on Iqaa</span></p>`;
    $('[data-login]').innerHTML = `
<div class="login-mark">${IQ.avatar(kinds(), { size: 96, ground: '#232138', name: initial() })}</div>
<p class="login-h">Sign in to ${org}</p>
<p class="note" style="color:var(--iqaa-n300)">${address()}</p>`;
  }

  // the pen writes the line again: every stroke a quarter beat, an eighth of a beat apart
  function sign() {
    renderOut();
    if (reduce.matches) return;
    [...$('[data-sig]').querySelectorAll('path, circle, text')].forEach((m, i) => {
      const delay = i * M.eighth;
      if (m.tagName === 'path' && !m.getAttribute('stroke-dasharray')) {
        const len = m.getTotalLength();
        m.animate([{ strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 }],
          { duration: M.quarter, delay, easing: M.ease_move, fill: 'backwards' });
      } else {
        m.animate([{ opacity: 0 }, { opacity: 1 }], { duration: M.quarter, delay, easing: M.ease_arrive, fill: 'backwards' });
      }
    });
    $('[data-test-note]').textContent = 'The pen wrote the line again, a quarter beat a step.';
  }

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.tpl) return load(t.dataset.tpl);
    if (t.dataset.step) {
      const [bi, si] = t.dataset.step.split(':').map(Number);
      const k = state.blocks[bi].steps[si];
      state.blocks[bi].steps[si] = KINDS[(KINDS.indexOf(k) + 1) % KINDS.length];
      renderEditor(); renderOut();
      root.querySelector(`[data-step="${bi}:${si}"]`).focus();
      return;
    }
    if (t.dataset.plus) { state.blocks[+t.dataset.plus].steps.push('run'); renderEditor(); renderOut(); return; }
    if (t.dataset.minus) { state.blocks[+t.dataset.minus].steps.pop(); renderEditor(); renderOut(); return; }
    if (t.dataset.drop) { state.blocks.splice(+t.dataset.drop, 1); renderEditor(); renderOut(); return; }
    if (t.hasAttribute('data-add-block')) { state.blocks.push({ name: 'New station', steps: ['struck'] }); renderEditor(); renderOut(); return; }
    if (t.hasAttribute('data-test')) sign();
  });
  root.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.name != null) { state.blocks[+t.dataset.name].name = t.value; renderOut(); }
    if (t.hasAttribute('data-org')) { Object.assign(state, { org: t.value, mark: null, address: null }); renderOut(); }
  });
  load('media');
})();
