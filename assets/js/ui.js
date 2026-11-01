// Parts every screen of the app shares: menus that open from a button, the dropdown that stands in for each native
// select, and the language switch's links. Loaded on every product page after i18n.js.
(function () {
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- menus: a button with data-menu opens the element its aria-controls names ----------
  // One at a time. Esc or a click outside closes it and Esc gives the focus back; the arrows move between its items;
  // leaving it with Tab closes it.
  let open = null;
  const items = (m) => $$('a, button:not([disabled])', m).filter((x) => !x.closest('[hidden]'));
  function closeMenu(focus) {
    if (!open) return;
    const { btn, menu } = open;
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    open = null;
    if (focus) btn.focus();
  }
  // opened from the keyboard, the focus goes to the current item; opened with a pointer, to the menu itself, so the
  // arrows still work and no focus ring shows until the keyboard is used
  function openMenu(btn, menu, keyboard) {
    closeMenu(false);
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    open = { btn, menu };
    const cur = $('[aria-current]', menu) || items(menu)[0];
    if (keyboard && cur) cur.focus();
    else { if (!menu.hasAttribute('tabindex')) menu.tabIndex = -1; menu.focus({ preventScroll: true }); }
    if (!reduce()) menu.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 150, easing: 'cubic-bezier(0.2,0,0,1)' });
  }
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-menu]');
    if (btn) {
      const menu = document.getElementById(btn.getAttribute('aria-controls'));
      if (!menu) return;
      if (open && open.menu === menu) closeMenu(false); else openMenu(btn, menu, e.detail === 0);
      return;
    }
    if (open && !open.menu.contains(e.target)) closeMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); return; }
    if (!open.menu.contains(document.activeElement)) return;
    const list = items(open.menu), i = list.indexOf(document.activeElement);
    // from the menu itself, the arrows start at the current item
    const cur = list.indexOf(open.menu.querySelector('[aria-current]'));
    const from = i < 0 ? (e.key === 'ArrowUp' ? cur + 1 : cur - 1) : i;
    const go = { ArrowDown: from + 1, ArrowUp: from - 1, Home: 0, End: list.length - 1 }[e.key];
    if (go != null) { e.preventDefault(); list[(go + list.length) % list.length].focus(); }
  });
  document.addEventListener('focusin', (e) => { if (open && !open.menu.contains(e.target) && !open.btn.contains(e.target)) closeMenu(false); });

  // ---------- the language switch: the same page, its query and its hash, in another language ----------
  function langLinks(root) {
    if (!window.I18N) return;
    $$('a[data-lang-to]', root).forEach((a) => {
      a.href = I18N.href(a.dataset.langTo);
      a.addEventListener('click', () => I18N.remember(a.dataset.langTo));
    });
  }

  // ---------- the dropdown: every native select in the app is drawn as the house's own ----------
  // The select stays in the page, hidden, and keeps its value, so the screens' own code reads it and hears its
  // change events as before. A select can keep the system's own list with data-native.
  let n = 0;
  function dropdown(sel) {
    if (sel.dataset.ui || sel.dataset.native || sel.multiple) return;
    sel.dataset.ui = '1';
    const id = sel.id || `dd-${++n}`;
    if (!sel.id) sel.id = id;
    const wrap = document.createElement('div');
    wrap.className = `dd${sel.className ? ` ${sel.className}` : ''}`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dd-b';
    btn.id = `${id}-dd`;
    btn.setAttribute('role', 'combobox');
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', `${id}-list`);
    const list = document.createElement('ul');
    list.className = 'dd-list';
    list.id = `${id}-list`;
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    sel.parentNode.insertBefore(wrap, sel);
    wrap.append(sel, btn, list);
    sel.classList.add('dd-native');
    sel.tabIndex = -1;
    sel.setAttribute('aria-hidden', 'true');
    // the select's label now names the button
    const label = sel.id && document.querySelector(`label[for="${CSS.escape(sel.id)}"]`);
    if (label) { label.htmlFor = btn.id; if (!label.id) label.id = `${id}-lab`; btn.setAttribute('aria-labelledby', `${label.id} ${btn.id}`); list.setAttribute('aria-labelledby', label.id); }
    else if (sel.getAttribute('aria-label')) { btn.setAttribute('aria-label', sel.getAttribute('aria-label')); list.setAttribute('aria-label', sel.getAttribute('aria-label')); }
    const chevron = '<svg class="dd-c" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg>';
    const check = '<svg class="dd-k" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    const opts = () => [...sel.options];
    let active = -1, typed = '', typedAt = 0;

    function sync() {
      const o = sel.options[sel.selectedIndex];
      btn.innerHTML = `<span class="dd-v">${o ? Beats.esc(o.textContent) : ''}</span>${chevron}`;
      btn.disabled = sel.disabled;
    }
    function paint() {
      list.innerHTML = opts().map((o, i) => `<li role="option" id="${id}-o${i}" aria-selected="${i === sel.selectedIndex}"${o.disabled ? ' aria-disabled="true"' : ''}${i === active ? ' class="on"' : ''}><span>${Beats.esc(o.textContent)}</span>${check}</li>`).join('');
      btn.setAttribute('aria-activedescendant', active >= 0 ? `${id}-o${active}` : '');
      const on = list.children[active];
      if (on) on.scrollIntoView({ block: 'nearest' });
    }
    // fixed to the viewport so a scrolling panel never clips it; below the button, or above when there is no room
    function place() {
      const r = btn.getBoundingClientRect(), h = Math.min(list.scrollHeight, 280), below = innerHeight - r.bottom - 8;
      list.style.minWidth = `${r.width}px`;
      list.style.insetInlineStart = '';
      list.style.left = `${Math.min(r.left, innerWidth - Math.max(r.width, list.offsetWidth) - 8)}px`;
      list.style.top = below >= h || below >= r.top ? `${r.bottom + 4}px` : `${r.top - h - 4}px`;
    }
    function show() {
      if (sel.disabled) return;
      active = sel.selectedIndex;
      paint();
      list.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      place();
      addEventListener('scroll', place, true);
      addEventListener('resize', place);
    }
    function hide(focus) {
      if (list.hidden) return;
      list.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      btn.removeAttribute('aria-activedescendant');
      removeEventListener('scroll', place, true);
      removeEventListener('resize', place);
      if (focus) btn.focus();
    }
    function pick(i) {
      const o = sel.options[i];
      if (!o || o.disabled) return;
      if (i !== sel.selectedIndex) {
        sel.selectedIndex = i;
        sel.dispatchEvent(new Event('input', { bubbles: true }));
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      sync();
      hide(true);
    }
    function move(to) {
      const os = opts();
      let i = Math.max(0, Math.min(os.length - 1, to));
      while (os[i] && os[i].disabled && i < os.length - 1) i++;
      active = i;
      paint();
    }
    btn.addEventListener('click', () => (list.hidden ? show() : hide(false)));
    btn.addEventListener('keydown', (e) => {
      const isOpen = !list.hidden;
      if (['ArrowDown', 'ArrowUp'].includes(e.key) && !isOpen) { e.preventDefault(); show(); return; }
      if (!isOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); show(); return; }
      if (!isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); hide(true); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); move(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(active - 1); }
      else if (e.key === 'Home') { e.preventDefault(); move(0); }
      else if (e.key === 'End') { e.preventDefault(); move(opts().length - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(active); }
      else if (e.key === 'Tab') hide(false);
      else if (e.key.length === 1) {
        // type to jump: the letters typed within a second find the first option that starts with them
        const now = Date.now();
        typed = (now - typedAt > 1000 ? '' : typed) + e.key.toLowerCase();
        typedAt = now;
        const i = opts().findIndex((o) => o.textContent.trim().toLowerCase().startsWith(typed));
        if (i >= 0) move(i);
      }
    });
    list.addEventListener('mousedown', (e) => e.preventDefault());
    list.addEventListener('click', (e) => { const li = e.target.closest('[role="option"]'); if (li) pick([...list.children].indexOf(li)); });
    list.addEventListener('mousemove', (e) => { const li = e.target.closest('[role="option"]'); const i = li ? [...list.children].indexOf(li) : -1; if (i >= 0 && i !== active) { active = i; paint(); } });
    document.addEventListener('mousedown', (e) => { if (!wrap.contains(e.target)) hide(false); });
    // the screens set the value and rebuild the options themselves: the button follows
    const proto = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
    const index = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex');
    Object.defineProperty(sel, 'value', { configurable: true, get() { return proto.get.call(this); }, set(v) { proto.set.call(this, v); sync(); } });
    Object.defineProperty(sel, 'selectedIndex', { configurable: true, get() { return index.get.call(this); }, set(v) { index.set.call(this, v); sync(); } });
    new MutationObserver(sync).observe(sel, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'selected'] });
    sel.addEventListener('change', sync);
    sync();
  }
  function enhance(root) { $$('select', root).forEach(dropdown); langLinks(root); }
  // screens render after load and redraw parts of themselves: every new select is drawn as soon as it appears
  function start() {
    enhance(document);
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((el) => { if (el.nodeType === 1) { if (el.tagName === 'SELECT') dropdown(el); else if (el.querySelector && el.querySelector('select, a[data-lang-to]')) enhance(el); } })))
      .observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  window.UI = { closeMenu: () => closeMenu(false), dropdown };
})();
