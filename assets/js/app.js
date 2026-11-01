// The organization's app frame: the sidebar folds to icons and remembers it; the organization's mark is signed
// in the sidebar when the page itself did not sign it.
(function () {
  const html = document.documentElement, fold = document.querySelector('[data-fold]');
  let folded = false;
  try { folded = localStorage.getItem('iqaa-side') === 'folded'; } catch (e) { /* storage blocked: the sidebar stays open */ }
  const set = (on) => {
    html.classList.toggle('side-folded', on);
    if (fold) { fold.setAttribute('aria-pressed', String(on)); fold.setAttribute('aria-label', on ? 'Open the sidebar' : 'Fold the sidebar'); fold.title = fold.getAttribute('aria-label'); }
  };
  set(folded);
  if (fold) fold.addEventListener('click', () => {
    folded = !folded;
    set(folded);
    try { localStorage.setItem('iqaa-side', folded ? 'folded' : 'open'); } catch (e) { /* the choice lasts this page only */ }
    window.dispatchEvent(new Event('resize'));
  });
  const mark = document.querySelector('[data-org-mark]');
  if (mark && !mark.firstChild && window.SUFRA && window.Beats) {
    const line = window.SUFRA.line();
    Beats.sig(mark, line.stations.map((s) => ({ name: s.name, steps: s.steps.map((x) => x.kind) })), { mode: 'mark', size: 32, name: 'Sufra', label: 'Sufra’s mark' });
  }
})();
