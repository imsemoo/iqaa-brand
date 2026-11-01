// The product's words in the page's language. The English in the source is the key: T('Waiting for you') returns
// it unchanged on an English page, and the translation from assets/js/i18n-<lang>.js (built from i18n/*.json) on an
// Arabic or Turkish one, or the English when a translation is missing. Variables fill {name} after the lookup, so a
// translation can put them where its own word order needs them.
(function () {
  const LANGS = [
    { code: 'en', name: 'English', short: 'EN', dir: 'ltr' },
    { code: 'ar', name: 'العربية', short: 'ع', dir: 'rtl' },
    { code: 'tr', name: 'Türkçe', short: 'TR', dir: 'ltr' },
  ];
  const lang = document.documentElement.lang || 'en';
  const dict = () => (window.IQAA_I18N || {})[lang] || {};
  const fill = (s, v) => (v ? s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m)) : s);

  function t(src, v) {
    const s = lang === 'en' ? src : dict()[src];
    return fill(typeof s === 'string' ? s : s && s.other ? s.other : src, v);
  }

  // A count. English gives its two forms; the dictionary entry under the 'other' form holds the language's own forms
  // (Arabic has six: zero, one, two, few, many, other; Turkish one form after a number). {n} is the count.
  const RULE = {
    en: (n) => (n === 1 ? 'one' : 'other'),
    tr: () => 'other',
    ar: (n) => (n === 0 ? 'zero' : n === 1 ? 'one' : n === 2 ? 'two' : n % 100 >= 3 && n % 100 <= 10 ? 'few' : n % 100 >= 11 ? 'many' : 'other'),
  };
  function n(count, one, other, v) {
    const vars = Object.assign({ n: count }, v);
    if (lang === 'en') return fill(count === 1 ? one : other, vars);
    const e = dict()[other];
    if (!e) return fill(count === 1 ? one : other, vars);
    if (typeof e === 'string') return fill(e, vars);
    const form = RULE[lang] ? RULE[lang](count) : 'other';
    return fill(e[form] || e.other || other, vars);
  }

  // The same page in another language: English at the root, the others in a folder named by their code
  function href(code) {
    const file = location.pathname.split('/').pop() || 'index.html';
    return `${lang === 'en' ? '' : '../'}${code === 'en' ? '' : `${code}/`}${file}${location.search}${location.hash}`;
  }
  // the last language chosen, so a link from the identity book can open the product in it (per viewer, best effort)
  function remember(code) { try { localStorage.setItem('iqaa-lang', code); } catch (e) { /* storage blocked: the folder says the language */ } }

  window.I18N = { lang, dir: document.documentElement.dir || 'ltr', rtl: document.documentElement.dir === 'rtl', langs: LANGS, t, n, href, remember };
  window.T = t;
})();
