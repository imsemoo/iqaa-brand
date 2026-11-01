// Ask Watar: a conversation with Watar about Sufra's work. Every answer is computed here, in the browser, from the
// shared demo world (sufra.js) through jobs.js, by fixed rules: ask() reads a question and returns what to say and
// which parts to show, and the renderers draw those parts with the product's own rows, strips and lines. Whatever
// Watar proposes waits in the dashed grey pen until a person approves it. The conversation is kept per person in
// sessionStorage and rebuilt by asking each question again at its own time.
// Watar speaks the page's language: every sentence is whole in T() or I18N.n() (English is the key, i18n/watar.json
// holds Arabic and Turkish), and it reads questions in English, Arabic and Turkish on any page, so a conversation
// asked in one language replays in another.
(function () {
  const root = document.querySelector('main.aw');
  if (!root || !window.IQ || !window.Beats || !window.SUFRA || !window.JOBS) return;
  const S = window.SUFRA, M = window.IQAA.motion;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const esc = Beats.esc, reduce = Beats.reduce, isPerson = JOBS.isPerson;
  const line = S.line(), J = JOBS.on(line), V = JOBS.views(J, S), K = JOBS.clients(J, S, V);
  const HOUR = 36e5, DAY = 864e5;
  const EN = I18N.lang === 'en', AR = I18N.lang === 'ar', TR = I18N.lang === 'tr', P = I18N.n;

  // ---------- who is asking: ?as= for the prototype, else the owner ----------
  const params = new URLSearchParams(location.search);
  const meKey = S.people[(params.get('as') || '').toLowerCase()] ? params.get('as').toLowerCase() : 'hala';
  const me = S.people[meKey];
  const OWNER = Object.keys(S.people).find((k) => /^Owner/.test(S.people[k].role));
  let own = null;
  try { const o = JSON.parse(sessionStorage.getItem('iqaa-org') || 'null'); if (o && !o.demo && o.blocks && o.blocks.length) own = o; } catch (e) { /* the demo stays */ }

  // ---------- the conversation, kept per person; every read and write may fail and the page still answers ----------
  // one conversation per person in every language (the frame counts its drafts by this key): the questions keep the
  // words they were asked in, and the answers are said again in the page's language
  const KEY = `iqaa-watar:${meKey}`;
  function load() { try { const c = JSON.parse(sessionStorage.getItem(KEY) || 'null'); return c && c.v === 1 ? c : null; } catch (e) { return null; } }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(conv)); } catch (e) { /* storage blocked: this visit only */ } }
  // reminders sent early, by code: from a client's page (client.js) or approved here; kept for the visit
  function reminded() { try { return JSON.parse(sessionStorage.getItem('iqaa-reminded') || '{}') || {}; } catch (e) { return {}; } }
  let conv = load();
  // the demo clock carries on from the conversation, so a reload never asks before an earlier answer
  const latest = conv ? Math.max(conv.startedAt || 0, ...conv.asked.map((x) => x.at)) : 0;
  const shift = Math.max(0, latest - V.now());
  const now = () => V.now() + shift;
  if (!conv) conv = { v: 1, startedAt: now(), asked: [], drafts: {}, text: '' };

  // ---------- words ----------
  const lc = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  // lists in the page's language: 'A, B and C'; 'A, B, or C'; and 'A, B, and C' for items with commas of their own
  const join = (key) => (a) => (a.length < 2 ? a.join('') : T(key, { a: a.slice(0, -1).join(T(', ')), b: a[a.length - 1] }));
  const both = join('{a} and {b}'), either = join('{a}, or {b}'), serial = join('{a}, and {b}');
  // a count's English words for a sentence ('Two orders are late'); Arabic and Turkish write the number itself
  const NUM = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
  const num = (n) => NUM[n] || String(n);
  const nv = (n, v) => Object.assign({ num: num(n), numl: num(n).toLowerCase() }, v);
  const ord = (n) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;
  // Turkish puts the case on a name, after an apostrophe, by the name's last vowel: Omar’a, Rami’nin, Reem’i, Yusuf’ta,
  // Hala’dan. k('C', name) gives {C, C_dat, C_gen, C_acc, C_loc, C_abl}, as jobs.js names them; in English and Arabic
  // every form is the name itself, so a sentence takes the form its own grammar needs
  function tc(name, c) {
    const w = name.split(' ').pop().toLocaleLowerCase('tr'), vs = w.match(/[aeıioöuü]/g) || ['e'], v = vs[vs.length - 1];
    const back = 'aıou'.includes(v), open = /[aeıioöuü]$/.test(w), hard = /[fstkçşhp]$/.test(w);
    const four = { a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' }[v], two = back ? 'a' : 'e';
    const s = { dat: `${open ? 'y' : ''}${two}`, gen: `${open ? 'n' : ''}${four}n`, acc: `${open ? 'y' : ''}${four}`, loc: `${hard ? 't' : 'd'}${two}`, abl: `${hard ? 't' : 'd'}${two}n` }[c];
    return `${name}’${s}`;
  }
  const k = (key, name) => { const o = { [key]: name }; ['dat', 'gen', 'acc', 'loc', 'abl'].forEach((c) => { o[`${key}_${c}`] = TR ? tc(name, c) : name; }); return o; };
  // a clock time, and in Turkish with its locative as it is read aloud: 08:52’de, 09:00’da, 13:00’te
  const UNIT = ['da', 'de', 'de', 'te', 'te', 'te', 'da', 'de', 'de', 'da'], TEN = ['da', 'da', 'de', 'da', 'ta', 'de'];
  const tl = (hm) => { const [h, m] = hm.split(':').map(Number), v = m || h; return `${hm}’${v % 10 ? UNIT[v % 10] : TEN[Math.floor(v / 10)]}`; };
  const tv = (t) => { const hm = V.hm(t); return { time: hm, timeL: TR ? tl(hm) : hm }; };
  // codes and links inside Arabic sentences are isolated, so their hyphens and dots keep their order
  const ltr = (s) => (AR ? `⁦${s}⁩` : s);
  const dayOff = (t) => V.days(V.iso(t));
  // a time as a sentence says it: 'today at 18:00', 'tomorrow at 09:00', 'on Tue 3 Nov at 08:52'
  const onAt = (t) => { const d = dayOff(t), v = tv(t); return d === 0 ? T('today at {time}', v) : d === 1 ? T('tomorrow at {time}', v) : T('on {day} at {time}', Object.assign({ day: V.day(t) }, v)); };
  const short = (j) => (/^Dr /.test(j.client) ? j.client : j.client.split(' ')[0]);
  // the names as the page says them: an order's title, its client's short name, a person, a station
  const ti = (j) => T(j.title), Cn = (j) => T(short(j)), stn = (st) => T(st.name);
  const eventOf = (j) => (/coffee break/i.test(j.title) ? 'coffee break' : (j.title.toLowerCase().match(/lunch|breakfast|dinner|reception|evening|tasting/) || ['event'])[0]);
  // the event in a sentence: 'the lunch'; its Turkish forms 'öğle yemeğinden' (after it) and 'öğle yemeğinin', and the
  // capitalised name a sentence may start with
  const evs = (j) => { const e = eventOf(j); return { ev: T(e), ev_abl: T(`from the ${e}`), ev_gen: T(`of the ${e}`), evCap: T(cap(e)) }; };
  // minutes late as a count the page's language declines: '20 min late', 'تأخر 20 دقيقة'
  const lateBy = (n) => P(n, '{n} min late', '{n} min late');
  // a moment after a verb: 'at 08:52' today, 'on Sat 31 Oct, 09:30' before
  const atOn = (t) => (dayOff(t) ? T('on {date}', { date: V.label(t) }) : T('at {time}', tv(t)));
  const PAST = { logs: 'logged', checks: 'checked', prepares: 'prepared', delivers: 'delivered', orders: 'ordered', buys: 'bought', drafts: 'drafted', approves: 'approved' };
  // a person's finished step in the past tense, after their name: 'checked the prices', 'logged the order'
  const pastOf = (d) => { const [verb, ...rest] = d.step.slice(d.who.length + 1).split(' '); return { v: PAST[verb] || verb.replace(/s$/, 'ed'), what: rest.join(' ') }; };
  // ... and with its order: 'checked the prices for Office lunch', 'logged Board breakfast'
  const did = (d) => { const p = pastOf(d), title = T(d.title); return !p.what || p.what === 'the order' ? T(`${p.v} {title}`, { title }) : T(`${p.v} ${p.what} for {title}`, { title }); };
  // a person's step in the base form, after 'to': 'check the prices', 'order from the wholesaler'
  function todo(x) {
    if (/^Watar drafts/.test(x.name)) return 'check my draft of the quote';
    const [v, ...rest] = (x.name.startsWith(`${x.who} `) ? x.name.slice(x.who.length + 1) : lc(x.name)).split(' ');
    return [/(ch|sh|ss|x)es$/.test(v) ? v.slice(0, -2) : v.replace(/s$/, '')].concat(rest).join(' ');
  }
  // a timed wait in words: 'two days', 'a day for the delivery'; and the line doing it: 'then the line waits a day for
  // the delivery'. The English is built from the step and is the key
  const waitWord = (x) => T(lc(x.who));
  const thenWaits = (x) => T(`then the line waits ${lc(x.who)}${x.name === `Wait ${lc(x.who)}` ? '' : x.name.replace(/^Wait/, '')}`);
  const glyph = (k_, o) => `<span class="g" aria-hidden="true">${IQ.glyph(k_, { test: !!(o && o.test) })}</span>`;
  const icon = (n, s) => IQ.icon(n, s || 18);
  const time = (t) => `<time datetime="${V.iso(t)}">${V.hm(t)}</time>`;

  // ---------- the demo world as Watar reads it ----------
  const ALL = S.jobs.concat(S.past), live = S.jobs.filter((j) => !j.finished);
  const byIso = (a, b) => a.iso.localeCompare(b.iso);
  const people = Object.keys(S.people).map((k_) => Object.assign({ k: k_ }, S.people[k_]));
  const personKey = (name) => (people.find((p) => p.name === name) || {}).k;
  const mineOf = (name) => live.filter((j) => { const x = J.stepOf(j); return isPerson(x.kind) && x.who === name; }).sort(byIso);
  const sinceOf = (j) => V.since(j);
  const dayStart = (t) => Math.floor(t / DAY) * DAY;
  const hourOf = (v) => { const [h, m] = v.split(':').map(Number); return h * HOUR + m * 6e4; };
  const OPEN = hourOf(S.hours.open), CLOSE = hourOf(S.hours.close);
  const remindStep = V.gate && V.gate.steps.find((x) => x.kind === 'run' && x.msg);
  // the data's names in every language: the page's own through T(), the others from the page (p_watar.py)
  let NAMES = {};
  try { NAMES = JSON.parse(($('[data-aw-names]') || {}).textContent || '{}') || {}; } catch (e) { /* English and the page's language still match */ }
  const aliases = (s) => [...new Set([s, T(s)].concat(Object.values(NAMES).map((d) => d[s]).filter(Boolean)))];

  // ---------- reading a question: normalised words, then the orders, people, stations, days and times in it ----------
  // Arabic loses its marks and the letters written several ways (أ إ آ → ا, ة → ه, ى → ي); Arabic-Indic digits become
  // Western; Turkish letters fold to their plain forms, so 'hatirlat' reads as 'hatırlat', and a Turkish suffix after an
  // apostrophe goes ('Omar’a' is Omar; '10’da' is 'saat 10')
  const FOLD = { ı: 'i', İ: 'i', ş: 's', Ş: 's', ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ö: 'o', Ö: 'o', ü: 'u', Ü: 'u', â: 'a', Â: 'a', î: 'i', û: 'u' };
  const western = (s) => s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0));
  const plainAr = (s) => s.replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');
  function norm(s) {
    let t = plainAr(western(s)).replace(/[ıİşŞçÇğĞöÖüÜâÂîû]/g, (c) => FOLD[c]).replace(/(\d{1,2}(?::\d{2})?)['’](?:da|de|ta|te)\b/gi, 'saat $1');
    if (TR) t = t.replace(/([a-z])['’][a-z]+/gi, '$1');
    return t.toLowerCase().replace(/[’‘]/g, "'").replace(/'s\b/g, '').replace(/[^a-z0-9:ء-ي ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const has = (t, words) => new RegExp(`\\b(?:${words.join('|')})\\b`).test(t);
  const isAr = (w) => /[ء-ي]/.test(w);
  // Arabic and Turkish words a question may use, by what they ask. A word matches at the start of a word, so suffixes
  // pass ('siparişler', 'المتأخرة'); Arabic may carry its prefixes (و ف ب ل ك ال); '=' ends a word exactly ('غدا=' is
  // tomorrow, never 'غداء', lunch)
  const WORDS = {
    help: ['مساعده', 'ساعدني', 'ماذا تعرف', 'ماذا يمكنك', 'ما الذي يمكنك', 'كيف تعمل', 'كيف يعمل', 'شو بتعرف', 'yardım', 'ne yapabilirsin', 'neler yapabilirsin', 'ne biliyorsun', 'nasıl çalışıyor', 'nasıl çalışırsın'],
    remind: ['ذكر', 'تذكير', 'نبه', 'hatırlat'],
    self: ['ذكرني', 'ذكرنا', 'bana=', 'bize='],
    now: ['الآن', 'حالا', 'فورا', 'في الحال', 'şimdi', 'hemen'],
    predict: ['سيوافق', 'ستوافق', 'سيرد', 'سترد', 'سيجيب', 'ستجيب', 'سيدفع', 'ستدفع', 'سيقبل', 'ستقبل', 'onaylayacak', 'onaylar mı', 'yanıtlayacak', 'cevaplayacak', 'cevap verecek', 'yanıt verecek', 'ödeyecek', 'kabul edecek'],
    money: ['سعر', 'أسعار', 'تكلفة', 'كلفة', 'يكلف', 'مجموع', 'إجمالي', 'إيراد', 'أرباح', 'ربح', 'مال=', 'فلوس', 'بكم', 'fiyat', 'ücret', 'tutar', 'toplam', 'maliyet', 'gelir', 'kazanç', 'para=', 'kaç para', 'ödeme'],
    outside: ['طقس', 'الجو=', 'مطر', 'أمطار', 'زحمة', 'ازدحام', 'مرور', 'طريق', 'طرق=', 'مخزون', 'ثلاجة', 'براد', 'مورد', 'أخبار', 'hava', 'yağmur', 'trafik', 'yol=', 'yollar', 'stok', 'buzdolabı', 'tedarikçi', 'haber'],
    judge: ['بطي', 'كسول', 'سريع', 'جيد', 'سيء', 'أفضل', 'أسوأ', 'تقييم', 'قيم=', 'أداء', 'إنتاجي', 'لوم', 'ألوم', 'yavaş', 'tembel', 'hızlı', 'iyi=', 'kötü', 'puan', 'performans', 'verimli', 'suç'],
    late: ['متأخر', 'تأخر', 'تأخير', 'خطر', 'مهدد', 'في الموعد', 'بالموعد', 'على الموعد', 'في وقته', 'على الوقت', 'في الوقت', 'سيلحق', 'يلحق', 'geç=', 'geç kal', 'gecik', 'risk', 'tehlike', 'zamanında', 'yetiş', 'kaçır'],
    onTime: ['في الموعد', 'بالموعد', 'على الموعد', 'في وقته', 'على الوقت', 'في الوقت', 'سيلحق', 'يلحق', 'zamanında', 'yetiş'],
    stuck: ['عالق', 'متوقف', 'معطل', 'متعطل', 'takıl', 'tıkan', 'durdu'],
    lead: ['يستغرق', 'تستغرق', 'استغرق', 'كم من الوقت', 'كم وقت', 'متوسط', 'عادة', 'مدة', 'ne kadar sür', 'sürer', 'sürüyor', 'sürdü', 'ortalama', 'genelde', 'genellikle', 'ne kadar zaman', 'kaç gün'],
    history: ['من قبل', 'قبل ذلك', 'سابقا', 'سبق', 'تاريخ', 'مرة أخرى', 'مجددا', 'كم طلب', 'كم مرة', 'دائم', 'معتاد', 'daha önce', 'önceden', 'önce', 'geçmiş', 'tekrar', 'yine', 'kaç sipariş', 'kaç kez', 'düzenli', 'sipariş verdi', 'sipariş vermiş'],
    done: ['أنجز', 'إنجاز', 'منجز', 'انتهى', 'انتهت', 'منتهي', 'اكتمل', 'أكمل', 'مكتمل', 'فعل', 'خلص', 'bitti', 'bitir', 'biten', 'tamamla', 'tamamlan', 'yaptı', 'yapıldı', 'yapılan'],
    week: ['أسبوع', '7 أيام', 'سبعة أيام', 'مؤخرا', 'أخيرا', 'hafta', '7 gün', 'yedi gün', 'son günlerde', 'yakın zamanda', 'son zamanlarda'],
    order: ['لماذا', 'ليش', 'لم=', 'عالق', 'ينتظر', 'تنتظر', 'انتظار', 'بانتظار', 'أين', 'وين', 'حالة', 'وضع', 'التالي', 'متبقي', 'باقي', 'متى', 'موعد', 'مستحق', 'ماذا', 'ما=', 'شو=', 'neden', 'niye', 'niçin', 'takıl', 'bekli', 'nerede', 'durum', 'sonraki', 'sırada', 'kalan', 'ne zaman', 'ne=', 'nedir', 'hangi'],
    team: ['الفريق', 'فريق', 'انشغالا', 'مشغول', 'الجميع', 'الكل=', 'كل واحد', 'ekip', 'en yoğun', 'yoğun', 'herkes', 'kimde en çok', 'meşgul'],
    client: ['عميل', 'عملاء', 'زبون', 'زبائن', 'müşteri'],
    clientWait: ['ينتظر', 'انتظار', 'بانتظار', 'رد=', 'يرد', 'ترد', 'ردوا', 'الرد', 'جواب', 'أجاب', 'يجيب', 'وافق', 'يوافق', 'معلق', 'bekle', 'yanıt', 'cevap', 'onayla', 'dönüş', 'dönmedi'],
    stations: ['أين الطلبات', 'وين الطلبات', 'أين الأعمال', 'عنق الزجاجة', 'أي محطة', 'المحطات', 'أكثر الطلبات', 'الحمل', 'ضغط', 'الخط=', 'işler nerede', 'siparişler nerede', 'darboğaz', 'hangi istasyon', 'istasyon', 'en çok sipariş', 'yük', 'hat=', 'hatta=', 'hattı=', 'işler='],
    due: ['مستحق', 'موعد التسليم', 'مواعيد', 'son tarih', 'termin', 'vade', 'teslim tarihi'],
    dayAsk: ['مستحق', 'موعد', 'مواعيد', 'ماذا', 'ما=', 'أي=', 'هل=', 'طلبات', 'مناسبات', 'مناسبة', 'يحدث', 'مخطط', 'مجدول', 'قادم', 'عندنا', 'لدينا', 'ne=', 'neler', 'neydi', 'nelerdi', 'hangi', 'var mı', 'sipariş', 'etkinlik', 'plan', 'program', 'teslim'],
    me: ['أنا=', 'لي=', 'عندي', 'لدي=', 'علي=', 'ينتظرني', 'بانتظاري', 'دوري', 'مهامي', 'طلباتي', 'خطواتي', 'فعلت', 'أنجزت', 'ben=', 'bana', 'beni', 'benim', 'bende', 'benden', 'yaptım'],
    owner: ['المالك', 'المالكة', 'صاحب', 'صاحبة', 'sahip', 'sahibi', 'patron'],
    byTomorrow: ['حتى الغد', 'حتى غد', 'إلى الغد', 'اليوم وغدا', 'اليوم والغد', 'اليوم أو غدا', 'yarına kadar', 'bugün ve yarın', 'bugün yarın'],
    thisWeek: ['هذا الأسبوع', 'الأسبوع الحالي', 'خلال الأسبوع', 'bu hafta'],
    nextWeek: ['الأسبوع القادم', 'الأسبوع المقبل', 'الأسبوع الجاي', 'gelecek hafta', 'haftaya', 'önümüzdeki hafta'],
    lastWeek: ['الأسبوع الماضي', 'الأسبوع الفائت', 'geçen hafta', 'geçtiğimiz hafta'],
    yesterday: ['أمس', 'البارحة', 'dün=', 'dünkü'],
    tomorrow: ['غدا=', 'الغد=', 'بكرة', 'بكرا', 'yarın'],
    today: ['اليوم', 'الليلة', 'هذا المساء', 'bugün', 'bu akşam', 'bu gece'],
    past: ['كان', 'كانت', 'الماضي', 'الفائت', 'مضى', 'vardı', 'geçen', 'idi=', 'oldu', 'miydi', 'mıydı', 'neydi', 'nelerdi'],
  };
  const AR_PRE = '(?:[وف])?(?:[بلك])?(?:ال|ل)?';
  const pattern = (w) => {
    const exact = w.endsWith('='), words = norm(exact ? w.slice(0, -1) : w).split(' ');
    return `(?:^| )${words.map((x) => (isAr(x) ? AR_PRE : '') + x).join(' ')}${exact ? '(?= |$)' : ''}`;
  };
  const RX = {};
  const said = (t, key) => (RX[key] || (RX[key] = new RegExp(WORDS[key].map(pattern).join('|')))).test(t);
  // an English list or the same question's Arabic and Turkish words
  const asks = (t, en, key) => has(t, en) || said(t, key);
  // words that never name an order on their own ('team' is a question about the team, not the clinic's lunch); the
  // Arabic and Turkish ones are kept apart, so an English question reads exactly as it always has
  const STOP = new Set(['for', 'the', 'a', 'co', 'order', 'private', 'of', 'and', 'team', 'dr']);
  const STOP_SAID = new Set(norm('ل من في و د شركة طلب خاص فريق الفريق مع العمل عمل').split(' ').concat(norm('için ve sipariş bireysel ekip ekibi akşam yemeği yemek günü akşamı').split(' ')));
  const TOKENS = new Map(), TRT = new Set();
  const index = (w, j, tr) => { if (!w || STOP.has(w) || STOP_SAID.has(w)) return; if (!TOKENS.has(w)) TOKENS.set(w, new Set()); TOKENS.get(w).add(j); if (tr && !isAr(w)) TRT.add(w); };
  ALL.forEach((j) => [j.title, j.client, j.of].forEach((s) => {
    norm(s).split(' ').forEach((w) => index(w, j));
    aliases(s).slice(1).forEach((a) => norm(a).split(' ').forEach((w) => { index(w, j, true); if (isAr(w) && /^ال/.test(w) && w.length > 4) index(w.slice(2), j); }));
  }));
  // an Arabic word may carry its prefixes ('لعمر', 'والمكتب'); a Turkish one its suffix ('kahvaltı' for 'kahvaltısı')
  function forms(w) {
    const out = [w], add = (x) => { if (x.length > 1 && !out.includes(x)) out.push(x); };
    let a = w;
    if (/^[وف]/.test(a) && a.length > 3) { a = a.slice(1); add(a); }
    if (/^[بلك]/.test(a) && a.length > 3) { const b = a.slice(1); add(b); if (/^ال/.test(b)) add(b.slice(2)); if (/^ل/.test(b)) add(b.slice(1)); }
    if (/^ال/.test(a) && a.length > 3) add(a.slice(2));
    return out;
  }
  function tok(w) {
    if (TOKENS.has(w)) return w;
    if (isAr(w)) return forms(w).find((f) => TOKENS.has(f)) || null;
    if (EN || w.length < 4) return null;
    return [...TRT].find((x) => x.length >= 4 && (w.startsWith(x) || x.startsWith(w))) || null;
  }
  const PEOPLE = {};
  people.forEach((p) => { PEOPLE[p.name.toLowerCase()] = p.k; aliases(p.name).forEach((a) => { PEOPLE[norm(a)] = p.k; }); });
  const personWord = (x) => (isAr(x) ? forms(x).find((f) => PEOPLE[f]) : PEOPLE[x] && x);
  const STATION_WORDS = [['approval', 'client approval|approval|approvals'], ['request', 'request|requests'], ['quote', 'quote|quotes'],
    ['buy', 'buy|buying|shopping|materials'], ['wholesale', 'wholesale|wholesaler'], ['prepare', 'prepare|preparing|prep|kitchen'],
    ['deliver', 'deliver|delivery|delivering|deliveries'], ['invoice', 'invoice|invoices|invoicing|billing']];
  const STATION_SAID = { approval: ['موافقة العميل', 'موافقة', 'اعتماد', 'müşteri onayı', 'onay=', 'onayı'], request: ['محطة الطلب', 'استلام الطلب', 'talep'],
    quote: ['عرض السعر', 'عروض الأسعار', 'عرض الأسعار', 'عروض', 'teklif'], buy: ['شراء', 'مشتريات', 'المواد', 'satın al', 'alışveriş', 'malzeme'],
    wholesale: ['جملة', 'toptan'], prepare: ['تحضير', 'مطبخ', 'hazırlık', 'hazırla', 'mutfak'], deliver: ['توصيل', 'teslimat'], invoice: ['فاتورة', 'فواتير', 'fatura'] };
  Object.entries(STATION_SAID).forEach(([id, w]) => { WORDS[`st:${id}`] = w; });
  const CLIENT_WORDS = ['client', 'clients', 'customer', 'customers'];
  // a day window is a question only with one of these: 'pizza tonight' is not about the line
  const DAY_ASK = ['due', 'deadline', 'deadlines', 'what', 'which', 'anything', 'orders', 'events', 'happening', 'planned', 'scheduled', 'coming up'];
  const WEEKDAY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  // Arabic weekdays with their article; Turkish in full or as the dates write them ('Sal'); 'pazar' is not 'pazartesi'
  const WEEKDAY_SAID = [['الاحد', 'pazar(?!tesi)', 'paz'], ['الاثنين', 'pazartesi', 'pzt'], ['الثلاثاء', 'sali', 'sal'], ['الاربعاء', 'carsamba', 'car'],
    ['الخميس', 'persembe', 'per'], ['الجمعه', 'cuma(?!rtesi)', 'cum'], ['السبت', 'cumartesi', 'cmt']]
    .map(([ar, tr, s]) => new RegExp(`(?:^| )(?:[وف])?(?:[بل])?${ar}(?= |$)|(?:^| )${tr}|(?:^| )${s}(?= |$)`));
  const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const MONTHS_SAID = [['يناير', 'ocak', 'oca'], ['فبراير', 'şubat', 'şub'], ['مارس', 'mart', 'mar'], ['أبريل', 'nisan', 'nis'], ['مايو', 'mayıs', 'may'], ['يونيو', 'haziran', 'haz'],
    ['يوليو', 'temmuz', 'tem'], ['أغسطس', 'ağustos', 'ağu'], ['سبتمبر', 'eylül', 'eyl'], ['أكتوبر', 'ekim', 'eki'], ['نوفمبر', 'kasım', 'kas'], ['ديسمبر', 'aralık', 'ara']]
    .map((ws) => ws.map(norm));
  const MONTH_RX = new RegExp(`(?:^| )(\\d{1,2}) (${MONTHS_SAID.flat().join('|')})(?= |$)|(?:^| )(${MONTHS_SAID.flat().join('|')}) (\\d{1,2})(?= |$)`);

  function codeIn(t) {
    const m = /\bsfr(?: 26)? (\d{1,4})\b/.exec(t) || /\b(?:order|no|number) (\d{1,4})\b/.exec(t) || /\b(0\d{3})\b/.exec(t)
      || /(?:^| )(?:رقم|طلب|الطلب|siparis|numara) (\d{1,4})(?= |$)/.exec(t);
    return m ? `SFR-26-${m[1].padStart(4, '0')}` : null;
  }
  // the orders a question names: by code, else by the words of their title, client and organization. Live orders win;
  // with none live, the newest finished one. Two or more live orders left mean Watar asks which.
  function ordersIn(t) {
    const code = codeIn(t);
    if (code) { const j = ALL.find((x) => x.code === code); return j ? { list: [j] } : { missing: code }; }
    const sets = t.split(' ').map(tok).filter(Boolean).map((w) => TOKENS.get(w));
    if (!sets.length) return { list: [] };
    let hit = [...sets.reduce((a, b) => new Set([...a].filter((x) => b.has(x))))];
    if (!hit.length) hit = [...new Set(sets.filter((s) => [...s].filter((j) => !j.finished).length === 1).flatMap((s) => [...s]))];
    const lv = hit.filter((j) => !j.finished).sort(byIso);
    if (lv.length) return { list: lv, fin: hit.filter((j) => j.finished && S.jobs.includes(j)) };
    const fin = hit.filter((j) => j.finished).sort((a, b) => V.fromLabel(b.finished) - V.fromLabel(a.finished));
    return { list: fin.slice(0, 1) };
  }
  // named: an order or the clients is what the question is about, so 'me', 'my' and 'I' are only the asker
  // ('tell me about Hayat', 'which of my clients'), not who the question is about
  function personIn(t, viewer, named) {
    const w = t.split(' ').map(personWord).find(Boolean);
    if (w) return PEOPLE[w];
    if (!named && asks(t, ['me', 'my', 'mine', 'i'], 'me')) return viewer;
    if (asks(t, ['owner'], 'owner')) return OWNER;
    return null;
  }
  const stationIn = (t) => {
    const s = STATION_WORDS.find(([, w]) => has(t, [w])) || STATION_WORDS.find(([id]) => said(t, `st:${id}`));
    return s ? J.station(s[0]).st : null;
  };
  // a window of days, as offsets from today: [from, to] and the words for it
  function daysIn(t) {
    if (asks(t, ['by tomorrow', 'today and tomorrow'], 'byTomorrow')) return { from: 0, to: 1, say: 'by tomorrow' };
    if (asks(t, ['this week'], 'thisWeek')) return { from: 0, to: 6, say: 'this week' };
    if (asks(t, ['next week'], 'nextWeek')) return { from: 7, to: 13, say: 'next week' };
    if (asks(t, ['last week'], 'lastWeek')) return { from: -7, to: -1, say: 'last week' };
    if (asks(t, ['yesterday'], 'yesterday')) return { from: -1, to: -1, say: 'yesterday' };
    if (asks(t, ['tomorrow'], 'tomorrow')) return { from: 1, to: 1, say: 'tomorrow' };
    if (asks(t, ['today', 'tonight'], 'today')) return { from: 0, to: 0, say: 'today' };
    let wd = WEEKDAY.findIndex((d) => has(t, [d, d.slice(0, 3)]));
    if (wd < 0) wd = WEEKDAY_SAID.findIndex((r) => r.test(t));
    const today = new Date(`${S.dayIso}T00:00Z`).getUTCDay();
    // a weekday is the next one, or the last one when the question is in the past tense ('what was due on Saturday')
    if (wd >= 0) { let o = (wd - today + 7) % 7; if (o && asks(t, ['was', 'were', 'last'], 'past')) o -= 7; return { from: o, to: o }; }
    const m = new RegExp(`\\b(\\d{1,2}) (${MONTHS.join('|')})|\\b(${MONTHS.join('|')}) (\\d{1,2})\\b`).exec(t);
    const n = !m && MONTH_RX.exec(t);
    if (m || n) {
      const d = m ? +(m[1] || m[4]) : +(n[1] || n[4]), mo = m ? MONTHS.indexOf(m[2] || m[3]) : MONTHS_SAID.findIndex((ws) => ws.includes(n[2] || n[3]));
      const o = V.days(`2026-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
      return { from: o, to: o };
    }
    return null;
  }
  // the clock a question names: { h, mi } for a time of day ('at 9', '14:00', 'noon'), { after } for 'in 2 hours'
  const WORD_N = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, bir: 1, iki: 2, uc: 3, dort: 4, bes: 5, alti: 6 };
  function clockIn(t) {
    const rel = /\bin (\d{1,2}|an?|one|two|three|four|five|six) (hours?|minutes?|mins?)\b/.exec(t);
    if (rel) return { after: ({ a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 }[rel[1]] || +rel[1]) * (/^h/.test(rel[2]) ? HOUR : 6e4) };
    // 'بعد ساعتين', 'بعد 30 دقيقة', 'bir saat sonra', 'yarım saat sonra'
    const ar = /(?:^| )بعد (?:(\d{1,2}) )?(ساعه|ساعتين|ساعات|دقيقه|دقائق|نصف ساعه|ربع ساعه)(?= |$)/.exec(t);
    if (ar) return { after: ar[2] === 'نصف ساعه' ? 30 * 6e4 : ar[2] === 'ربع ساعه' ? 15 * 6e4 : ar[2] === 'ساعتين' ? 2 * HOUR : (+ar[1] || 1) * (/^س/.test(ar[2]) ? HOUR : 6e4) };
    const tr = /(?:^| )(\d{1,2}|bir|iki|uc|dort|bes|alti|yarim) (saat|dakika) sonra(?= |$)/.exec(t);
    if (tr) return { after: tr[1] === 'yarim' ? 30 * 6e4 : (WORD_N[tr[1]] || +tr[1]) * (tr[2] === 'saat' ? HOUR : 6e4) };
    let h = null, mi = 0, pm = false, am = false;
    const hm = /\b(\d{1,2}):(\d{2})\b/.exec(t), ap = /\b(\d{1,2}) ?(am|pm)\b/.exec(t), at_ = /\bat (\d{1,2})\b/.exec(t);
    const arAt = /(?:^| )(?:الساعه|ساعه|عند) (\d{1,2})(?![\d:])/.exec(t), trAt = /(?:^| )saat (\d{1,2})(?![\d:])/.exec(t);
    if (has(t, ['noon', 'midday']) || /(?:^| )(?:ال)?(?:ظهر|ظهيره|ظهرا)(?= |$)|(?:^| )(?:oglen|ogleyin)(?= |$)/.test(t)) h = 12;
    else if (hm) { h = +hm[1]; mi = +hm[2]; }
    else if (ap) h = +ap[1];
    else if (at_) h = +at_[1];
    else if (arAt) h = +arAt[1];
    else if (trAt) h = +trAt[1];
    if (h == null) return null;
    pm = !!ap && ap[2] === 'pm'; am = !!ap && ap[2] === 'am';
    // '6 مساء', '9 صباحا'; 'akşam 7', 'sabah 9'
    if (!ap) {
      if (/\d (?:مساء|مساءا|المساء|عصرا|العصر|ليلا)(?= |$)|(?:aksam|gece|ogleden sonra)(?: saat)? \d/.test(t)) pm = true;
      else if (/\d (?:صباحا|الصباح|صباح)(?= |$)|sabah(?: saat)? \d/.test(t)) am = true;
    }
    if (pm && h < 12) h += 12;
    if (am && h === 12) h = 0;
    if (!pm && !am && !hm && h < 8) h += 12;
    return { h, mi };
  }
  // a time for a reminder: 'now'; ms for a clock time on a day, or from now for 'in 2 hours'; a later day alone is
  // Sufra's opening hour that day; 'ask' when only today or several days are named; null when nothing is
  function timeIn(t, at) {
    if (asks(t, ['now', 'right away', 'straight away'], 'now')) return 'now';
    const c = clockIn(t), win = daysIn(t), day = win && win.from === win.to ? win.from : null;
    if (c && c.after) return at + c.after;
    if (!c) return !win ? null : day > 0 ? dayStart(at) + day * DAY + OPEN : 'ask';
    if (win && day == null) return 'ask';
    return dayStart(at) + (day || 0) * DAY + c.h * HOUR + c.mi * 6e4;
  }

  // ---------- facts Watar states ----------
  // who or what an order waits on now, said after its title
  function waitsOn(j) {
    const x = J.stepOf(j);
    if (!x) return { kind: 'fin', said: T('finished {date}', { date: V.fin(j) }) };
    if (x.who === 'The client') return { kind: 'client', who: short(j), said: T('waiting for {C}', k('C', Cn(j))) };
    if (isPerson(x.kind)) return { kind: 'team', who: x.who, said: T('with {name}', { name: T(x.who) }) };
    return { kind: x.kind, said: K.doing(x, j, Cn(j)) };
  }
  // the decisions made in this conversation before question n, the latest per draft key
  function decided(ctx, key) {
    const ds = Object.values(ctx.drafts).filter((d) => d.key === key && (d.state === 'approved' || d.state === 'sent'));
    return ds.sort((a, b) => a.at - b.at).pop() || null;
  }
  // the waits ahead run past the event
  const waitsSaid = (j, r) => T('The waits still ahead take {span}, which ends after the {ev} on {date}.', Object.assign({ span: V.span(r.hours * HOUR), date: V.label(r.ev) }, evs(j)));
  // why an order is at risk, in one sentence
  function reason(j, r, ctx) {
    const C = Cn(j);
    if (r.why === 'waits') return waitsSaid(j, r);
    const s = riskSaid(j, r, ctx);
    if (r.gone) return `${T('The quote link went to {C} {when}.', Object.assign(k('C', C), { when: atOn(r.linkAt) }))} ${s}`;
    const x = J.stepOf(j), since = sinceOf(j);
    if (!isPerson(x.kind)) return `${T('Its quote hasn’t gone to {C} yet.', k('C', C))} ${s}`;
    const v = Object.assign(k('who', T(x.who)), { since: since ? V.at(since) : '', doing: K.doing(x, j, C) });
    const a = /^Watar drafts/.test(x.name) ? T(since ? 'Its quote waits for {who} to check my draft, since {since}.' : 'Its quote waits for {who} to check my draft.', v)
      : T(since ? 'Its quote waits for {who}, who is {doing}, since {since}.' : 'Its quote waits for {who}, who is {doing}.', v);
    return `${a} ${s}`;
  }
  // what the line would do, or what was decided here instead
  function riskSaid(j, r, ctx) {
    const C = Cn(j), done = decided(ctx, `remind:${j.code}`);
    if (r.why === 'waits') return waitsSaid(j, r);
    if (done) {
      const when = done.when === 'now' ? T('Reminded at {time}', tv(done.at)) : done.when > ctx.now ? T('Reminder set for {when}', { when: onAt(done.when) }) : T('Reminded {when}', { when: onAt(done.when) });
      const v = Object.assign(k('C', C), evs(j), { done: when, by: T(done.by) });
      return T(done.from === 'page' ? '{done} · sent from the client’s page by {by}. The {ev} still needs {C}’s answer.' : '{done} · approved by {by}. The {ev} still needs {C}’s answer.', v);
    }
    const v = Object.assign(k('C', C), evs(j), { when: onAt(r.remindAt), span: V.span(r.remindAt - r.ev) });
    return T(r.gone ? 'If {C} doesn’t answer, the line reminds {C} {when}, {span} after the {ev}.' : 'Even if the quote went now, the line would remind {C} {when}, {span} after the {ev}.', v);
  }
  // an order at risk at t. One whose client was reminded, or is set to be, before the event (approved here or sent from
  // the client's page) is settled: the line's late reminder no longer decides it, and its strip shows the reminder
  function riskOf(j, t, ctx) {
    const r = V.risk(j, t);
    if (!r) return null;
    const d = r.why === 'reminder' && ctx && decided(ctx, `remind:${j.code}`), at = d && (d.when === 'now' ? d.at : d.when);
    return Object.assign({ j }, r, d && at < r.ev ? { settled: d, remindAt: at } : {});
  }
  const risksAt = (t, ctx) => live.map((j) => riskOf(j, t, ctx)).filter(Boolean).sort((a, b) => byIso(a.j, b.j));
  // a settled reminder as a sentence: 'Omar was reminded at 09:41', 'Iqaa reminds Rami today at 18:00'
  const remindedSaid = (r, t) => {
    const d = r.settled, at = r.remindAt, v = k('C', Cn(r.j));
    return at > t ? T('Iqaa reminds {C} {when}', Object.assign(v, { when: onAt(at) })) : T('{C} was reminded {when}', Object.assign(v, { when: d.when === 'now' ? T('at {time}', tv(at)) : onAt(at) }));
  };
  // a line change's name: 'Wait a day at Client approval, not two'
  const lineTitle = (st, len, was) => T('Wait {len} at {station}, not {was}', { len: T(lc(len)), station: stn(st), was: lc(was).split(' ')[0], wasAll: T(lc(was)) });
  // the change to the line that would end every risk its timed wait makes: the longest shorter wait that does
  function lineChange(risks) {
    const rs = risks.filter((r) => r.why === 'reminder');
    if (rs.length < 2) return null;
    const cur = rs[0].hours;
    const opt = Object.entries(V.REST).sort((a, b) => b[1] - a[1]).find(([, h]) => h < cur && rs.every((r) => r.linkAt + h * HOUR < r.ev));
    if (!opt) return null;
    const st = V.gate, was = rs[0].wait.who;
    // risky: the orders still at risk, which keep the old version and need their own reminder
    return { type: 'line', key: `line:${st.id}-wait`, st: st.id, len: opt[0], was, risky: rs.filter((r) => !r.settled).map((r) => r.j.title),
      title: lineTitle(st, opt[0], was) };
  }

  // ---------- the engine: ask(text, ctx) reads, decides and returns what to say; it never touches the page ----------
  // ctx: { now, viewer (a people key), drafts (decisions made before this question), pending (a clarify turn's intent),
  // asked (earlier questions, normalised) }. An answer: { kind, read, lead, parts, notes, drafts, links, next, choices }.
  function answer(kind, read, lead, o) {
    return Object.assign({ kind, read, lead, parts: [], notes: [], drafts: [], links: [], next: [], choices: null, pending: null }, o);
  }
  const asked = (list) => list.map((q) => ({ q, t: q }));
  function starters(ctx) {
    const team = live.filter((j) => waitsOn(j).kind === 'team').map((j) => ({ j, t: sinceOf(j) })).sort((a, b) => a.t - b.t);
    const j = team[0] && team[0].j, name = j && (j.of === 'a private order' ? j.client.split(' ')[0] : j.of.split(' ')[0]);
    const most = people.map((p) => ({ p, n: mineOf(p.name).length })).sort((a, b) => b.n - a.n)[0];
    return [T('Who is late today?'), j ? T('Why is {name}’s order stuck?', k('name', T(name))) : T('Where are the jobs?'),
      most.p.k === ctx.viewer ? T('What is waiting for me?') : T('What is waiting for {name}?', k('name', T(most.p.name))), T('What is due by tomorrow?')];
  }
  const nextOf = (list, ctx) => list.filter((q) => !ctx.asked.includes(norm(q))).slice(0, 3);
  const waitingFor = (name) => T('What is waiting for {name}?', k('name', T(name)));
  const whyWaiting = (j) => T('Why is {title} waiting?', { title: ti(j) });
  const happensAt = (st) => T('What happens at {station}?', { station: stn(st) });
  const orderedBefore = (c) => T('Has {name} ordered before?', k('name', T(c.name)));
  const todayLink = (name) => { const k_ = personKey(name); return k_ ? { href: `today.html?as=${k_}`, t: T('Open {name}’s Today', k('name', T(name))), i: 'Today' } : null; };
  const orderLink = (j) => ({ href: `order.html?code=${j.code}`, t: T('Open the order'), i: 'Orders' });
  const ordersLink = () => ({ href: 'orders.html', t: T('See them in Orders'), i: 'Orders' });

  // the opening turn: what Watar found when the conversation started
  function opening(t, ctx) {
    const lateNow = live.filter(V.late), all = risksAt(t, ctx), risks = all.filter((r) => !r.settled), at = V.hm(t);
    let lead = lateNow.length ? P(lateNow.length, 'One order is late at {at}: {list}.', '{num} orders are late at {at}: {list}.', nv(lateNow.length, { at, list: both(lateNow.map(ti)) }))
      : T(risks.length ? 'Nothing on Sufra’s line is late at {at}.' : 'Nothing on Sufra’s line is late at {at}, and every timed wait ends before its event.', { at });
    if (!risks.length) { if (lateNow.length) lead += ` ${T('Every other timed wait ends before its event.')}`; } else {
      const rem = risks.every((r) => r.why === 'reminder');
      lead += ` ${P(risks.length, 'One order is at risk: for {list}, {why}.', '{num} orders are at risk: for {list}, {why}.', nv(risks.length, { list: both(risks.map((r) => ti(r.j))),
        why: rem ? T('the line’s reminder to the client would come after the event') : T('a timed wait would end after the event') }))}`;
    }
    all.filter((r) => r.settled).forEach((r) => { lead += ` ${T('{reminded}, so the {ev} no longer waits on the line’s reminder.', Object.assign({ reminded: remindedSaid(r, t) }, evs(r.j)))}`; });
    // this turn has already said who is late, so it isn't offered as a question here
    const late = T('Who is late today?'), items = starters(ctx).map((q) => (q === late ? T('Which clients haven’t answered?') : q));
    return answer('opening', '', lead, { intro: T('Ask about an order, a person or the day. For example:'), choices: { label: T('Questions to start with'), items: asked(items) } });
  }

  const GREET = /^(hello|hi|hey|good morning|good afternoon|good evening|salam|marhaba)( watar)?$/;
  const GREET_SAID = new RegExp(`^(?:${['مرحبا', 'أهلا', 'أهلا وسهلا', 'أهلين', 'السلام عليكم', 'سلام', 'صباح الخير', 'مساء الخير', 'هلا', 'هاي', 'merhaba', 'selam', 'selamlar', 'günaydın', 'iyi günler', 'iyi akşamlar', 'iyi sabahlar'].map(norm).join('|')})(?: يا)?(?: وتر| watar)?$`);
  const THANKS = /^(thanks|thank you|thank you watar|thanks watar|cheers|shukran)$/;
  const THANKS_SAID = new RegExp(`^(?:${['شكرا', 'شكرا لك', 'شكرا جزيلا', 'مشكور', 'تسلم', 'يعطيك العافية', 'ألف شكر', 'teşekkürler', 'teşekkür ederim', 'çok teşekkürler', 'sağ ol', 'sağol', 'sağolun', 'eyvallah'].map(norm).join('|')})(?: يا)?(?: وتر| watar)?$`);
  // a request to act, which Watar refuses: at the start in English and Arabic, the verb's own forms in Turkish
  const DO = /^(please |can you |could you |would you |will you |watar )*(approve|accept|confirm|sign|send|cancel|delete|skip|assign|pay)\b/;
  const DO_SAID = new RegExp(`^(?:(?:${['من فضلك', 'لو سمحت', 'هل يمكنك', 'هل تستطيع', 'ممكن', 'يا وتر', 'وتر'].map(norm).join('|')}) )*(?:${['وافق', 'اعتمد', 'اقبل', 'أرسل', 'ابعث', 'ألغ', 'ألغي', 'احذف', 'امسح', 'تخط', 'تجاوز', 'عين', 'أسند', 'ادفع', 'وقع'].map(norm).join('|')})(?= |$)`
    + `|(?:^| )(?:onayla|kabul et|gonder|yolla|iptal et|sil|atla|ata|ode|imzala|onaylar misin|onaylayabilir misin|gonderir misin|gonderebilir misin|iptal eder misin|siler misin|atlar misin|oder misin|atar misin)(?= |$)`);
  const FILLER = ['one', 'that', 'this', 'please', 'it'];
  const FILLER_SAID = new Set(norm('هذا هذه ذلك تلك من فضلك لو سمحت رجاء الطلب').split(' ').concat(['bu', 'su', 'lutfen', 'o', 'olan', 'siparis', 'siparisi', 'siparisini']));
  function ask(text, ctx) {
    const t = norm(text), viewer = ctx.viewer, you = S.people[viewer];
    const found = ordersIn(t), list = found.list || [], j = list.length === 1 ? list[0] : null;
    const who = personIn(t, viewer, list.length > 0 || asks(t, CLIENT_WORDS, 'client')), st = list.length ? null : stationIn(t), win = daysIn(t);
    // a question that is only an order's name answers the clarify turn before it
    const rest = t.split(' ').filter((w) => !tok(w) && !STOP.has(w) && !FILLER.includes(w) && (EN || (!STOP_SAID.has(w) && !FILLER_SAID.has(w))));
    const intent = ctx.pending && list.length && !rest.length ? ctx.pending : null;

    if (GREET.test(t) || GREET_SAID.test(t)) return answer('greeting', T('a greeting'), T('Hello, {name}. Ask about an order, a person or the day.', { name: T(you.name) }), { choices: { label: T('Questions to start with'), items: asked(starters(ctx)) } });
    if (THANKS.test(t) || THANKS_SAID.test(t)) return answer('thanks', T('thanks'), T('You’re welcome.'));
    if (asks(t, ['help', 'what can you', 'what do you know', 'how does this work'], 'help')) {
      const ex = starters(ctx).concat([T('Where are the jobs?'), happensAt(V.gate)]);
      return answer('help', T('help'), T('I answer from Sufra’s line: its orders, its people, its stations and the times on it. I don’t see prices, messages or stock, and nothing goes out until a person approves it. You can ask:'), { choices: { label: T('Questions to ask'), items: asked(ex) } });
    }
    if (found.missing) {
      const newest = S.jobs.slice().sort((a, b) => b.code.localeCompare(a.code))[0];
      return answer('missing', T('order {code}', { code: ltr(found.missing) }), T('No order {code} is on Sufra’s line. The newest is {newest}, {title}.', { code: ltr(found.missing), newest: ltr(newest.code), title: ti(newest) }),
        { next: nextOf([T('Where are the jobs?'), T('What is due this week?')], ctx) });
    }
    if (intent === 'remind' || (!intent && asks(t, ['remind', 'nudge', 'chase', 'follow up'], 'remind'))) return remindAnswer(t, list, who, ctx);
    // a prediction is a question about someone else; a command to approve or send is Watar's to refuse
    if ((has(t, ['will', 'going to', 'likely', 'chance']) && has(t, ['approve', 'answer', 'reply', 'pay', 'accept'])) || said(t, 'predict')) return predictAnswer(j, ctx);
    if (DO.test(t) || DO_SAID.test(t)) return wontAnswer(t, j, ctx);
    // the Arabic quote is 'عرض السعر', the offer of the price: it is not a question about money
    if (has(t, ['total', 'totals', 'price of', 'prices of', 'cost', 'costs', 'revenue', 'profit', 'paid', 'money', 'how much', 'earn', 'income', 'price', 'prices'])
      || said(t.replace(/(?:^| )(?:[وف])?(?:[بلك])?(?:ال)?(?:عرض|عروض) (?:ال)?(?:سعر|اسعار)/g, ' '), 'money')) {
      return answer('money', T('money'), T('I can’t see money: Sufra has no prices in Iqaa yet, so every quote total is [TOTAL] until the price list is added. I can tell you which quotes are waiting, and for whom.'),
        { next: nextOf([T('Where are the jobs?'), waitingFor('Reem'), T('Which clients haven’t answered?')], ctx) });
    }
    if (asks(t, ['weather', 'rain', 'traffic', 'road', 'roads', 'stock', 'fridge', 'supplier', 'news'], 'outside')) {
      return answer('outside', T('outside Sufra’s line'), T('I only read Sufra’s line: its orders, its people and its steps. I can’t see the weather, the road or what is in the kitchen.'),
        { next: nextOf([T('Who is late today?'), T('What is due by tomorrow?')], ctx) });
    }
    if (who && asks(t, ['slow', 'lazy', 'fast', 'good', 'bad', 'best', 'worst', 'rate', 'rating', 'performance', 'productive', 'blame'], 'judge')) {
      const p = S.people[who], w = mineOf(p.name), old = w.map(sinceOf).sort((a, b) => a - b)[0];
      const v = Object.assign(k('name', T(p.name)), { orders: P(w.length, '{n} order', '{n} orders'), since: old ? V.label(old) : '' });
      return answer('judge', T('a judgement of {name}', v), T(old ? 'I don’t rate people. {name} has {orders} waiting; the oldest since {since}.' : 'I don’t rate people. {name} has {orders} waiting.', v),
        { links: [todayLink(p.name)].filter(Boolean), next: nextOf([waitingFor(p.name), T('Who is busiest?')], ctx) });
    }
    if (intent === 'late' || (!intent && (asks(t, ['late', 'behind', 'overdue', 'delayed', 'on time', 'risk', 'at risk', 'in time', 'miss'], 'late') || (!list.length && asks(t, ['stuck', 'blocked', 'held up'], 'stuck'))))) {
      if (list.length > 1) return clarify(list, found.fin, 'late');
      if (j) return orderAnswer(j, ctx, asks(t, ['on time', 'in time'], 'onTime') ? 'yes' : 'late');
      if (who) {
        const p = S.people[who], w = mineOf(p.name), v = Object.assign(k('name', T(p.name)), { orders: P(w.length, '{n} order', '{n} orders'), title: w.length ? ti(w[0]) : '' });
        return answer('late-person', T('whether {name} is late', v), T(w.length ? 'Sufra’s line sets no time limit for a person’s step, so I don’t call a person late. {name} has {orders} waiting; {title} is due first.'
          : 'Sufra’s line sets no time limit for a person’s step, so I don’t call a person late. {name} has {orders} waiting.', v),
        { links: [todayLink(p.name)].filter(Boolean), next: nextOf([waitingFor(p.name), T('Who is late today?')], ctx) });
      }
      return lateAnswer(ctx);
    }
    if (!list.length && asks(t, ['how long', 'take', 'takes', 'took', 'average', 'usually', 'lead time'], 'lead')) return leadAnswer(ctx);
    if (asks(t, ['before', 'history', 'again', 'how many orders', 'regular', 'ordered'], 'history') && list.length) {
      const cks = [...new Set(list.map((x) => x.ck))];
      if (cks.length === 1) return historyAnswer(K.get(cks[0]), ctx);
    }
    if (!list.length && asks(t, ['done', 'finished', 'did', 'completed', 'do today'], 'done')) return doneAnswer(ctx, who, asks(t, ['this week', 'week', '7 days', 'seven days', 'recently', 'lately'], 'week'));
    if (list.length > 1) return clarify(list, found.fin, 'order');
    if (j && (intent === 'order' || intent || asks(t, ['why', 'stuck', 'waiting', 'wait', 'where', 'status', 'next', 'left', 'ahead', 'when', 'due', 'what'], 'order') || !rest.length)) return orderAnswer(j, ctx);
    if (who || asks(t, ['team', 'busiest', 'everyone', 'who has the most'], 'team')) return who ? personAnswer(who, ctx) : teamAnswer(ctx);
    if (asks(t, CLIENT_WORDS, 'client') && asks(t, ['waiting', 'answer', 'answered', 'approve', 'approved', 'pending', 'reply', 'replied'], 'clientWait')) return clientsAnswer(ctx);
    if (st) return stationAnswer(st, ctx);
    if (asks(t, ['where are', 'bottleneck', 'which station', 'most orders', 'load', 'the line', 'jobs'], 'stations')) return stationsAnswer(ctx);
    // a day alone is not yet a question ('pizza tonight'): Watar offers the one it may be, and the usual ones
    if (win && !asks(t, DAY_ASK, 'dayAsk')) {
      const when = win.say ? T(win.say) : T('on {day}', { day: V.day(V.U(`${S.dayIso}T00:00`).getTime() + win.from * DAY) });
      const q = T(win.to < 0 ? 'What was due {when}?' : 'What is due {when}?', { when });
      return answer('unknown', win.say ? T('{when}, with no question about it', { when }) : T('a day, with no question about it'), T('I couldn’t tie that to Sufra’s work. Did you mean:'),
        { choices: { label: T('Did you mean'), items: asked([q].concat(starters(ctx).slice(1, 3))) } });
    }
    if (win || asks(t, ['due', 'deadline', 'deadlines'], 'due')) return dueAnswer(win || { from: 0, to: 1, say: 'by tomorrow' }, ctx);
    if (j) return orderAnswer(j, ctx);
    // a capitalised name Watar doesn't know, after for, is, did or has
    const name = /\b(?:for|is|did|has|does|ask|about)\s+([A-Z][a-z]+)\b/.exec(text);
    if (name && !TOKENS.has(name[1].toLowerCase()) && !['Sufra', 'Watar', 'Iqaa', 'The', 'Today', 'Tomorrow'].includes(name[1])) {
      return answer('stranger', T('a person called {name}', { name: name[1] }), T('{name} isn’t on Sufra’s team in Iqaa. The team: {team}.', { name: name[1], team: both(people.map((p) => T(p.name))) }),
        { next: nextOf([T('Who is busiest?'), waitingFor('Reem')], ctx) });
    }
    return answer('unknown', T('nothing on the line'), T('I couldn’t tie that to Sufra’s work. I answer about orders, people, stations and times on the line, for example:'), { choices: { label: T('Questions to start with'), items: asked(starters(ctx)) } });
  }

  // which order: the live ones that match, sorted by due; finished matches named in a hint
  function clarify(list, fin, intent) {
    const word = (() => { const w = list.map((j) => eventOf(j)); return w.every((x) => x === w[0]) ? `${w[0]}${w[0].endsWith('h') ? 'es' : 's'}` : 'orders'; })();
    const hint = fin && fin.length ? P(fin.length, '{list} is finished.', '{list} are finished.', { list: both(fin.map(ti)) }) : '';
    const said_ = word === 'orders' ? '{num} orders on the line are orders. Which one?' : '{num} orders on the line are {kind}. Which one?';
    return answer('clarify', T('which order?'), P(list.length, said_, said_, nv(list.length, { kind: T(word) })), { notes: hint ? [hint] : [], pending: intent,
      choices: { label: T('Which order?'), pending: intent, items: list.map((j) => ({ q: ti(j), t: `${ti(j)} · ${V.day(j.iso)}` })) } });
  }

  // an order whose event has passed and that is delivered: what is left of it
  const deliveredNote = (j) => T('{title} was on {day}. It is delivered; Iqaa is {doing}.', { title: ti(j), day: V.day(j.iso), doing: K.doing(J.stepOf(j), j, Cn(j)) });
  // an event that has passed: when it was, and how it was delivered
  function wasOn(j) {
    const f = K.facts(j), v = Object.assign({ date: V.label(j.iso), time: f.arrived ? V.hm(f.arrived) : '', late: f.late, lateBy: lateBy(f.late) }, evs(j));
    return T(f.arrived ? (f.late ? 'The {ev} was on {date}, delivered at {time}, {late} min late.' : 'The {ev} was on {date}, delivered at {time}, on time.')
      : V.late(j) ? 'The {ev} was on {date}, and it is late.' : 'The {ev} was on {date}.', v);
  }
  const settledSaid = (r, t) => T('{reminded}, so the {ev} no longer waits on the line’s reminder.', Object.assign({ reminded: remindedSaid(r, t) }, evs(r.j)));

  function lateAnswer(ctx) {
    const t = ctx.now, lateNow = live.filter(V.late), all = risksAt(t, ctx), risks = all.filter((r) => !r.settled), settled = all.filter((r) => r.settled);
    let lead = lateNow.length ? P(lateNow.length, 'One order is late: {list}.', '{num} orders are late: {list}.', nv(lateNow.length, { list: both(lateNow.map(ti)) })) : T('No one is late.');
    if (risks.length) {
      lead += ` ${P(risks.length, 'One order is at risk: for it, {why}.', '{num} orders are at risk: for each, {why}.', nv(risks.length,
        { why: risks.every((r) => r.why === 'reminder') ? T('the line’s reminder to the client would come after the event') : T('a timed wait would end after the event') }))}`;
    } else if (!settled.length) lead += ` ${T('Every timed wait on the line ends before its event.')}`;
    settled.forEach((r) => { lead += ` ${settledSaid(r, t)}`; });
    // the line change is about the wait that made every one of them, settled or not
    const notes = [], drafts = [], change = lineChange(all);
    if (change) notes.push(T(all.length === 2 ? 'Both come from one step of the line: {step}, at {station}.' : 'They all come from one step of the line: {step}, at {station}.', { step: T(V.gate.steps.find((x) => x.kind === 'rest').name), station: stn(V.gate) }));
    const today = live.filter((j) => V.days(j.iso) === 0 && !V.delivered(j) && !all.some((r) => r.j === j));
    today.forEach((j) => {
      const w = waitsOn(j), p = J.station(j.at);
      notes.push(T('Due today and on time: {title} at {time}, {where}.', { title: ti(j), time: V.hm(j.iso), where: w.kind === 'team' ? T('with {who} at {station}', { who: T(w.who), station: stn(p.st) }) : w.said }));
    });
    live.filter((j) => V.days(j.iso) < 0 && V.delivered(j)).forEach((j) => notes.push(deliveredNote(j)));
    // what was decided here already is said in the reasons, not drafted again
    risks.forEach((r) => { if (r.why === 'reminder' && r.gone && !decided(ctx, `remind:${r.j.code}`)) drafts.push(remindPlan(r.j, null, ctx).draft); });
    if (change && !decided(ctx, change.key)) drafts.push(change);
    const caption = [risks.length ? T('At risk · {n}', { n: risks.length }) : '', settled.length ? T(risks.length ? 'reminded early · {n}' : 'Reminded early · {n}', { n: settled.length }) : ''].filter(Boolean).join(' · ');
    return answer('late', T('late or at risk, at {time}', { time: V.hm(t) }), lead, {
      parts: all.length || lateNow.length ? [{ type: 'rows', cap: caption || T('Late · {n}', { n: lateNow.length }), rows: lateNow.map((j) => ({ j })).concat(all.map((r) => ({ j: r.j, r }))) }] : [],
      notes: notes.slice(0, 3), drafts: drafts.filter(Boolean).slice(0, 2), links: [ordersLink()],
      next: nextOf(all.map((r) => whyWaiting(r.j)).concat([happensAt(V.gate), T('What is due by tomorrow?')]), ctx) });
  }

  function orderAnswer(j, ctx, how) {
    const t = ctx.now, x = J.stepOf(j), C = Cn(j), w = waitsOn(j), r = riskOf(j, t, ctx), since = sinceOf(j), c = K.get(j.ck);
    const read = T(how ? (how === 'yes' ? '{title}, {code}, on time?' : '{title}, {code}, late?') : '{title}, {code}', { title: ti(j), code: ltr(j.code) });
    if (j.finished) {
      return answer('order', read, T('{title} finished {date}. Every station signed it.', { title: ti(j), date: V.fin(j) }), { parts: [{ type: 'order', j }],
        links: [orderLink(j), { href: `client.html?c=${j.ck}`, t: T('All of {name}’s orders', k('name', T(c.name))), i: 'History' }],
        next: nextOf([orderedBefore(c), T('How long do orders take?')], ctx) });
    }
    const team = w.kind === 'team';
    const v = Object.assign(k('C', C), k('who', team ? T(x.who) : ''), { title: ti(j), since: since ? V.at(since) : '', when: since ? atOn(since) : '', doing: team ? K.doing(x, j, C) : '', said: w.said });
    let lead;
    if (team) lead = T(/^Watar drafts/.test(x.name) ? '{title} is waiting for {who}. I drafted its quote {when}, and {who} hasn’t checked it yet.' : '{title} is with {who}: {doing}, since {since}.', v);
    else if (w.kind === 'client') lead = T('{title} is waiting for {C}’s answer to the quote, since {since}.', v);
    else if (w.kind === 'rest') lead = T('{title} is in a timed wait: {said}.', v);
    else lead = T('{title} is running by itself: Iqaa is {said}.', v);
    if (V.late(j)) lead = `${how === 'yes' ? `${T('No.')} ` : how ? `${T('Yes.')} ` : ''}${lead} ${T('It was due {date}, and it is late.', { date: V.label(j.iso) })}`;
    else if (r) {
      const pre = how === 'yes' ? T('Not for certain.') : how ? (r.settled ? T('Not yet.') : T('Not yet, but it is at risk.')) : '';
      lead = `${pre ? `${pre} ` : ''}${lead} ${how || r.settled ? '' : `${T('It is at risk.')} `}${riskSaid(j, r, ctx)}`;
    } else if (how && V.delivered(j)) {
      // the event has passed and Yusuf has been: on time is what the delivery was
      const f = K.facts(j), onTime = !f.late;
      const dv = { answer: (how === 'yes') === onTime ? T('Yes') : T('No'), title: ti(j), date: V.label(j.iso), time: f.arrived ? V.hm(f.arrived) : '', late: f.late, lateBy: lateBy(f.late), doing: K.doing(x, j, C) };
      lead = T(!f.arrived ? '{answer}. {title} was on {date}. Iqaa is {doing}.' : f.late ? '{answer}. {title} was on {date}, delivered at {time}, {late} min late. Iqaa is {doing}.'
        : '{answer}. {title} was on {date}, delivered at {time}, on time. Iqaa is {doing}.', dv);
    } else if (how) {
      // the answer to 'is it on time?': where it waits, the timed waits after that, and the event beyond them
      const ahead = J.ahead(j).filter((a) => a.x.kind === 'rest' && a.st !== V.gate), long = V.U(j.iso).getTime() - t >= DAY;
      const waits = { team: () => T(`waits for {who} to ${todo(x)}`, v), client: () => T('waits for {C}’s answer', v), rest: () => T('is in a timed wait: {said}', v), run: () => T('is running by itself: Iqaa is {said}', v) }[w.kind]();
      const hv = Object.assign({}, v, { answer: how === 'yes' ? T('Yes') : T('No'), waits, then: ahead.length ? thenWaits(ahead[0].x) : '', due: V.at(j.iso) });
      lead = T(ahead.length ? (long ? '{answer}. {title} {waits}, since {since}; {then}, long before {due}.' : '{answer}. {title} {waits}, since {since}; {then}, before {due}.')
        : long ? '{answer}. {title} {waits}, since {since}, long before {due}.' : '{answer}. {title} {waits}, since {since}, before {due}.', hv);
    } else if (V.delivered(j)) lead += ` ${wasOn(j)}`;
    else lead += ` ${T('Nothing has failed, and it isn’t at risk.')}`;
    const notes = [], links = [orderLink(j)], drafts = [];
    if (team && j.at === 'quote') notes.push(T(/^Watar drafts/.test(x.name) ? 'I won’t check the quote for {who}.' : `I won’t ${todo(x)} for {who}.`, v));
    if (team) links.push(todayLink(x.who));
    if (r && r.why === 'reminder' && !decided(ctx, `remind:${j.code}`)) { const p = remindPlan(j, null, ctx); if (p.draft) drafts.push(p.draft); else if (p.no) notes.push(p.no); }
    return answer('order', read, lead, { parts: [{ type: 'order', j, r }], notes, drafts, links: links.filter(Boolean),
      next: nextOf([team ? waitingFor(x.who) : happensAt(J.station(j.at).st), orderedBefore(c), T('Who is late today?')], ctx) });
  }

  function personAnswer(k_, ctx) {
    const p = S.people[k_], you = k_ === ctx.viewer, w = mineOf(p.name), t = ctx.now;
    const risks = risksAt(t, ctx).filter((r) => !r.settled).map((r) => r.j);
    const at = [...new Set(w.map((j) => J.station(j.at).st))];
    const v = nv(w.length, Object.assign(k('name', T(p.name)), { station: at.length ? stn(at[0]) : '', stations: both(at.map((s) => stn(s))), title: w.length ? ti(w[0]) : '' }));
    let lead;
    if (!w.length) lead = T(you ? 'Nothing waits for you right now.' : 'Nothing waits for {name} right now.', v);
    else if (w.length === 1) {
      const risky = risks.includes(w[0]);
      lead = T(you ? (risky ? 'One order waits for you: {title}, at {station}. It is at risk.' : 'One order waits for you: {title}, at {station}.')
        : risky ? 'One order waits for {name}: {title}, at {station}. It is at risk.' : 'One order waits for {name}: {title}, at {station}.', v);
    } else {
      const s = at.length === 1 ? (you ? '{num} orders wait for you, all at {station}.' : '{num} orders wait for {name}, all at {station}.') : you ? '{num} orders wait for you, at {stations}.' : '{num} orders wait for {name}, at {stations}.';
      const first = '{title} is due first, and it is one of the {numl} at risk.';
      lead = `${P(w.length, s, s, v)} ${risks.includes(w[0]) ? P(risks.length, first, first, nv(risks.length, { title: ti(w[0]) })) : T('{title} is due first.', v)}`;
    }
    const coming = live.filter((j) => !w.includes(j)).map((j) => { const a = J.ahead(j), n = a.findIndex((s) => isPerson(s.x.kind) && s.x.who === p.name); return n < 0 ? null : { j, n, st: a[n].st }; })
      .filter(Boolean).sort((a, b) => a.n - b.n);
    return answer('person', T(you ? 'what waits for you' : 'what waits for {name}', v), lead, { parts: [{ type: 'person', p, w, coming: coming[0] || null, you }],
      links: [{ href: `today.html?as=${k_}`, t: you ? T('Open your Today') : T('Open {name}’s Today', v), i: 'Today' }],
      next: nextOf(w.length ? [whyWaiting(w[0]), happensAt(J.station(w[0].at).st), T('Who is busiest?')] : [T('Who is busiest?'), T('Where are the jobs?')], ctx) });
  }

  function teamAnswer(ctx) {
    const rows = people.map((p) => ({ p, w: mineOf(p.name), d: S.done.filter((d) => d.who === p.name) })).sort((a, b) => b.w.length - a.w.length);
    const top = rows[0], rest = rows.slice(1), same = rest.every((r) => r.w.length === rest[0].w.length);
    const at = [...new Set(top.w.map((j) => J.station(j.at).st))];
    const v = Object.assign(k('name', T(top.p.name)), { orders: P(top.w.length, '{n} order', '{n} orders'), station: at.length ? stn(at[0]) : '' });
    let lead = T(at.length === 1 && top.w.length > 1 ? '{name} has the most waiting: {orders}, all at {station}.' : '{name} has the most waiting: {orders}.', v);
    if (same && rest.length) lead += ` ${P(rest[0].w.length, '{names} have one each.', '{names} have {n} each.', { names: both(rest.map((r) => T(r.p.name))) })}`;
    return answer('team', T('the team’s load'), lead, { parts: [{ type: 'team', rows: people.map((p) => rows.find((r) => r.p === p)) }], next: nextOf([waitingFor(top.p.name), T('Where are the jobs?')], ctx) });
  }

  // what a station's orders wait on, in a few words
  function waitPhrase(js) {
    const team = [...new Set(js.filter((j) => waitsOn(j).kind === 'team').map((j) => waitsOn(j).who))];
    const cl = js.filter((j) => waitsOn(j).kind === 'client').map(Cn);
    const runs = js.filter((j) => !['team', 'client'].includes(waitsOn(j).kind)).map((j) => waitsOn(j).said);
    return [team.length ? T('with {name}', { name: both(team.map((n) => T(n))) }) : '', cl.length ? T('waiting for {C}', k('C', both(cl))) : ''].concat(runs).filter(Boolean).join(T('; '));
  }
  function stationsAnswer(ctx) {
    const branch = line.routes.find((r) => r.type === 'branch');
    const rows = [];
    J.main.forEach((s) => { rows.push({ s, js: live.filter((j) => j.at === s.id) }); if (branch && branch.from === s.id) branch.stations.forEach((b) => rows.push({ s: b, js: live.filter((j) => j.at === b.id), br: true })); });
    const top = rows.slice().sort((a, b) => b.js.length - a.js.length)[0], w0 = top.js.length && waitsOn(top.js[0]);
    const all = w0 && top.js.every((j) => { const w = waitsOn(j); return w.kind === w0.kind && w.who === w0.who; });
    const lead = T(all && w0.who ? '{station} holds the most: {n} of {total} orders, all waiting for {who}.' : '{station} holds the most: {n} of {total} orders.',
      Object.assign(k('who', w0 && w0.who ? T(w0.who) : ''), { station: stn(top.s), n: top.js.length, total: live.length }));
    return answer('stations', T('where the jobs are'), lead, { parts: [{ type: 'stations', rows: rows.map((r) => Object.assign(r, { top: r === top, say: waitPhrase(r.js) })) }],
      links: [ordersLink()], next: nextOf([happensAt(top.s), T('Who is busiest?'), T('Who is late today?')], ctx) });
  }

  function stationAnswer(st, ctx) {
    const xs = st.steps, wait = xs.find((x) => x.kind === 'rest'), client = xs.find((x) => x.who === 'The client');
    // each step as the station does it: 'Iqaa sends the client a receipt', 'the line waits two days'
    const runs = (x) => T(`Iqaa ${lc(x.name).replace(/^(\w+)/, (v) => `${v}s`)}`);
    const said_ = xs.map((x) => (x.kind === 'run' ? runs(x) : x.kind === 'rest' ? T(`the line waits ${lc(x.who)}${x.name === `Wait ${lc(x.who)}` ? '' : x.name.replace(/^Wait/, '')}`)
      : x.kind === 'held' && x.who !== 'The client' ? T('{step} and waits for {who}', Object.assign(k('who', T(x.who)), { step: T(x.name) })) : T(x.name)));
    const lead = client && wait ? T('{station} waits for the client to approve the quote. If they don’t answer in {wait}, the line reminds them.', { station: stn(st), wait: waitWord(wait) })
      : T('At {station}, {steps}.', { station: stn(st), steps: both(said_) });
    const here = live.filter((j) => j.at === st.id).sort(byIso), risks = risksAt(ctx.now, ctx), change = st === V.gate ? lineChange(risks) : null;
    const notes = [], open = risks.filter((r) => !r.settled && r.why === 'reminder').map((r) => ti(r.j));
    if (change && open.length) notes.push(P(open.length, '{list} is at risk because of this wait: the line’s reminder would come after the event.', '{list} are at risk because of this wait: the line’s reminder would come after the event.', { list: both(open) }));
    return answer('station', T('the {station} station', { station: stn(st) }), lead, { parts: [{ type: 'station', st, here }], notes, drafts: change && !decided(ctx, change.key) ? [change] : [],
      links: [{ href: `orders.html?at=${st.id}`, t: T('See {station}’s orders', k('station', stn(st))), i: 'Orders' }, { href: 'line.html', t: T('Open the line'), i: 'Line' }],
      next: nextOf([T('Where are the jobs?'), T('Who is late today?')], ctx) });
  }

  // where an order whose event has passed stands: 'delivered at 17:20, on time; Iqaa is sending the invoice'
  function pastSaid(j) {
    const f = K.facts(j);
    const now_ = j.finished ? T('finished {date}', { date: V.fin(j) }) : V.delivered(j) ? T('Iqaa is {doing}', { doing: K.doing(J.stepOf(j), j, Cn(j)) }) : T('it is late, {waits}', { waits: waitsOn(j).said });
    if (!f.arrived) return now_;
    return T('{delivery}; {now}', { delivery: T(f.late ? 'delivered at {time}, {late} min late' : 'delivered at {time}, on time', { time: V.hm(f.arrived), late: f.late, lateBy: lateBy(f.late) }), now: now_ });
  }
  // a run of days: 'Sun 1 – Sat 7 Nov'; whole days where a language orders a date differently
  const range = (a, b) => (EN ? `${V.day(a).replace(/ \w+$/, '')} – ${V.day(b)}` : `${V.day(a)} – ${V.day(b)}`);
  function dueAnswer(win, ctx) {
    const from = win.from, to = win.to;
    const a = V.U(`${S.dayIso}T00:00`).getTime(), when = win.say ? T(win.say) : T('on {day}', { day: V.day(a + from * DAY) });
    const span = from === to ? V.day(a + from * DAY) : range(a + from * DAY, a + to * DAY);
    const read = from === to && !win.say ? T('due {when}', { when }) : T('due {when} ({range})', { when, range: span });
    // a window before today: every order whose event fell in it, delivered or finished, in the past tense
    if (to < 0) {
      const list = ALL.filter((j) => { const d = V.days(j.iso); return d >= from && d <= to; }).sort(byIso), n = list.length;
      const late = list.filter((j) => K.facts(j).late || V.late(j));
      const lead = !n ? T('Nothing was due {when}.', { when }) : n === 1 ? T('One order was due {when}: {title}, {state}.', { when, title: ti(list[0]), state: pastSaid(list[0]) })
        : `${P(n, '{num} orders were due {when}.', '{num} orders were due {when}.', nv(n, { when }))} ${late.length ? P(late.length, '{list} was late; the rest arrived on time.', '{list} were late; the rest arrived on time.', { list: both(late.map(ti)) }) : T('Every one arrived on time.')}`;
      return answer('due', read, lead, { parts: n ? [{ type: 'past', cap: T('Due {when} · {n}', { when, n }), list }] : [],
        links: [ordersLink()], next: nextOf([T('What is due today?'), T('How long do orders take?'), T('Who is late today?')], ctx) });
    }
    const list = live.filter((j) => { const d = V.days(j.iso); return d >= from && d <= to && !V.delivered(j); }).sort(byIso);
    const risks = list.filter((j) => { const r = riskOf(j, ctx.now, ctx); return r && !r.settled; }), n = list.length, ok = n - risks.length;
    let lead = n ? P(n, 'One order is due {when}.', '{num} orders are due {when}.', nv(n, { when })) : T('Nothing is due {when}.', { when });
    if (n === 1) lead += ` ${risks.length ? T('It is at risk.') : T('It is on time.')}`;
    else if (n && risks.length) lead += ` ${T(risks.length === 1 ? '{list} is at risk; {others}.' : '{list} are at risk; {others}.', { list: both(risks.map(ti)), others: P(ok, 'the other one is on time', 'the other {numl} are on time', nv(ok)) })}`;
    else if (n) lead += ` ${T('All of them are on time.')}`;
    const notes = from === 0 ? live.filter((j) => V.days(j.iso) < 0 && V.delivered(j)).map(deliveredNote) : [];
    return answer('due', read, lead, { parts: n ? [{ type: 'rows', cap: T('Due {when} · {n}', { when, n }), rows: list.map((j) => ({ j })), more: true }] : [], notes,
      links: [ordersLink()], next: nextOf([T('Who is late today?'), T('What is due this week?'), T('Where are the jobs?')], ctx) });
  }

  function doneAnswer(ctx, who, week) {
    if (week) {
      const fin = S.jobs.filter((j) => j.finished).sort((a, b) => V.fromLabel(b.finished) - V.fromLabel(a.finished)), s = '{num} orders finished in the last 7 days: {list}. Each walked the whole line.';
      return answer('done-week', T('orders finished in the last 7 days'), P(fin.length, s, s, nv(fin.length, { list: both(fin.map(ti)) })), { parts: [{ type: 'finished', list: fin }], next: nextOf([T('How long do orders take?'), T('What is due this week?')], ctx) });
    }
    const p = who && S.people[who], ds = S.done.filter((d) => !p || d.who === p.name).sort((a, b) => a.time.localeCompare(b.time)), n = ds.length;
    const mine = Object.values(ctx.drafts).filter((d) => (d.state === 'approved' || d.state === 'sent') && (!p || d.by === p.name) && dayOff(d.at) === 0);
    const handed = ds.filter((d) => d.to), open = ds.filter((d) => !d.to);
    const you = who === ctx.viewer, v = nv(n, Object.assign(k('name', p ? T(p.name) : ''), { time: n ? ds[n - 1].time : '' }));
    let lead = n ? (p ? P(n, you ? 'You did {numl} step today, the last at {time}.' : '{name} did {numl} step today, the last at {time}.', you ? 'You did {numl} steps today, the last at {time}.' : '{name} did {numl} steps today, the last at {time}.', v)
      : P(n, 'One step was done today, the last at {time}.', '{num} steps were done today, the last at {time}.', v))
      : T(p ? (you ? 'You haven’t finished a step on the line today yet.' : '{name} hasn’t finished a step on the line today yet.') : 'No step was finished on the line today yet.', v);
    if (n > 1 && handed.length) {
      lead += ` ${open.length ? P(handed.length, 'One handed its order on to the next station; for {list}, {then}.', '{num} handed their order on to the next station; for {list}, {then}.', nv(handed.length, { list: both(open.map((d) => T(d.title))), then: T(open[0].then) }))
        : P(handed.length, 'One handed its order on to the next station.', '{num} handed their order on to the next station.', nv(handed.length))}`;
    }
    // what was decided here, or sent from a client's page, is said too, so the lead and the list under it agree
    const decidedSaid = (d) => T(d.from === 'page' ? 'sent “{title}” from the client’s page at {time}' : d.state === 'approved' ? 'approved “{title}” here at {time}' : 'sent to the Line screen “{title}” here at {time}', Object.assign({ title: titleOf(d) }, tv(d.at)));
    if (mine.length) {
      const list = p ? both(mine.map(decidedSaid)) : both(mine.map((d) => T('{who} {did}', { who: T(d.by), did: decidedSaid(d) })));
      lead += ` ${p ? T(you ? (n ? 'You also {list}.' : 'You {list}.') : n ? '{name} also {list}.' : '{name} {list}.', Object.assign({}, v, { list })) : `${list}.`}`;
    }
    return answer('done', p ? T('{name}’s steps today', v) : T('steps done today'), lead, { parts: n || mine.length ? [{ type: 'done', ds, mine }] : [],
      next: nextOf([T('Who is busiest?'), waitingFor('Reem'), T('Who is late today?')], ctx) });
  }

  function leadAnswer(ctx) {
    const fin = ALL.filter((j) => j.finished).map((j) => ({ j, took: V.fromLabel(j.finished) - V.U(j.opened).getTime(), came: V.U(j.iso).getTime() - V.U(j.opened).getTime() }));
    const took = fin.map((o) => o.took).sort((a, b) => a - b), came = fin.map((o) => o.came).sort((a, b) => a - b), mid = took[Math.floor(took.length / 2)];
    const rs = risksAt(ctx.now, ctx).filter((r) => !r.settled).map((r) => ({ j: r.j, came: V.U(r.j.iso).getTime() - V.U(r.j.opened).getTime() }));
    const lead = T('Sufra’s {n} finished orders took {from} to {to} each, from the order to the invoice; half took under {mid}.', { n: fin.length, from: V.span(took[0]), to: V.span(took[took.length - 1]), mid: V.span(mid) });
    const ones = '{list}: the ones at risk.', rv = { list: both(rs.map((o) => T('{title} came in {span} ahead', { title: ti(o.j), span: V.span(o.came) }))) };
    const ahead = rs.length ? ` ${rs.length === 2 ? T('{list}: those are the two at risk.', rv) : P(rs.length, ones, ones, rv)}` : '';
    const notes = [`${T('Finished orders came in {from} to {to} before their event.', { from: V.span(came[0]), to: V.span(came[came.length - 1]) })}${ahead}`];
    const recent = fin.sort((a, b) => V.fromLabel(b.j.finished) - V.fromLabel(a.j.finished)).slice(0, 6);
    return answer('lead', T('how long orders take'), lead, { parts: [{ type: 'lead', rows: recent, of: fin.length }], notes, next: nextOf([T('Who is late today?'), T('What finished in the last 7 days?')], ctx) });
  }

  function clientsAnswer(ctx) {
    const list = live.filter((j) => waitsOn(j).kind === 'client').sort(byIso), n = list.length;
    const item = list.map((j) => T(j.of === 'a private order' ? '{title}, for {client}, since {since}' : '{title}, for {client} at {of}, since {since}', { title: ti(j), client: T(j.client), of: T(j.of), since: V.at(sinceOf(j)) }));
    // each item has commas of its own, so the last one is joined with a comma too
    let lead = n ? P(n, 'One order waits for a client to approve: {list}.', '{num} orders wait for a client to approve: {list}.', nv(n, { list: serial(item) })) : T('No order is waiting for a client’s answer.');
    const risky = list.filter((j) => { const r = riskOf(j, ctx.now, ctx); return r && !r.settled; });
    if (risky.length) lead += ` ${T('For {list}, the line’s reminder would come after the {ev}.', Object.assign({ list: both(risky.map(ti)) }, evs(risky[0])))}`;
    return answer('clients', T('orders waiting on clients'), lead, { parts: n ? [{ type: 'rows', cap: T('Waiting on clients · {n}', { n }), rows: list.map((j) => ({ j })) }] : [],
      drafts: risky.map((j) => remindPlan(j, null, ctx).draft).filter(Boolean).slice(0, 1), links: [{ href: 'clients.html', t: T('See them in Clients'), i: 'Clients' }],
      next: nextOf(list.map((j) => T('Remind {C}', k('C', Cn(j)))).concat([T('Who is late today?')]), ctx) });
  }

  function historyAnswer(c, ctx) {
    const n = c.orders.length, first = c.first;
    const v = nv(c.open.length, Object.assign(k('name', T(c.name)), { orders: P(n, '{n} order', '{n} orders'), day: V.day(first.opened) }));
    const lead = c.open.length ? P(c.open.length, '{name} has {orders} with Sufra since {day}; {numl} is open now.', '{name} has {orders} with Sufra since {day}; {numl} are open now.', v) : T('{name} has {orders} with Sufra since {day}.', v);
    return answer('history', T('{name}’s orders', v), lead, { parts: [{ type: 'history', c }], notes: [K.reading(c)], links: [{ href: `client.html?c=${c.key}`, t: T('Open {name}', v), i: 'Clients' }],
      next: nextOf(c.soon ? [whyWaiting(c.soon), T('Which clients haven’t answered?')] : [T('Which clients haven’t answered?')], ctx) });
  }

  function predictAnswer(j, ctx) {
    const o = j || live.find((x) => waitsOn(x).kind === 'client');
    if (!o) return answer('predict', T('a prediction'), T('I can’t know what a client will do. I can tell you when the line reminds them.'));
    const c = V.chase(o, ctx.now), v = Object.assign(k('C', Cn(o)), { title: ti(o) });
    if (!c) return answer('predict', T('a prediction about {C}', v), T('I can’t know what {C} will do. {C} has already approved {title}’s quote.', v), { links: [orderLink(o)] });
    Object.assign(v, { when: onAt(c.remindAt), wait: waitWord(c.wait) });
    const lead = T(c.gone ? 'I can’t know what {C} will do. If {C} hasn’t answered {when}, {wait} after the quote link, the line reminds {C}.' : 'I can’t know what {C} will do. If {C} hasn’t answered {wait} after the quote link goes, the line reminds {C}.', v);
    return answer('predict', T('a prediction about {C}', v), lead, { links: [orderLink(o)], next: nextOf([orderedBefore(K.get(o.ck)), whyWaiting(o)], ctx) });
  }

  Object.assign(WORDS, { cancel: ['ألغ', 'إلغاء', 'احذف', 'حذف', 'امسح', 'iptal', 'sil='], pay: ['ادفع', 'دفع', 'ödeme', 'öde='], assign: ['عين', 'تعيين', 'أسند', 'إسناد', 'ata=', 'atama'],
    send: ['أرسل', 'ابعث', 'إرسال', 'تخط', 'تجاوز', 'gönder', 'yolla', 'atla'] });
  function wontAnswer(t, j, ctx) {
    const o = j, read = T('a step Watar won’t take'), none = T('I draft; I don’t approve for anyone.');
    if (asks(t, ['cancel', 'delete'], 'cancel')) return answer('wont', read, T('I don’t cancel orders. Open the order to see where it stands.'), { links: o ? [orderLink(o)] : [{ href: 'orders.html', t: T('See every order'), i: 'Orders' }] });
    if (asks(t, ['pay'], 'pay')) return answer('wont', read, T('I don’t handle payments, and I can’t see money: every quote total is [TOTAL] until Sufra adds its price list.'));
    if (asks(t, ['assign'], 'assign')) return answer('wont', read, T('Each step’s person is set on the line, and I don’t move work between people. {owner} changes who does a step on the Line screen.', { owner: T(S.people[OWNER].name) }), { links: [{ href: 'line.html', t: T('Open the line'), i: 'Line' }] });
    const x = o && J.stepOf(o), v = o ? Object.assign(k('C', Cn(o)), k('who', x ? T(x.who) : '')) : {};
    if (asks(t, ['send', 'skip'], 'send')) {
      if (x && isPerson(x.kind) && x.who !== 'The client' && o.at === 'quote') return answer('wont', read, T('The quote link goes to {C} by itself once {who} checks the prices. I don’t skip a person’s step.', v), { links: [todayLink(x.who)].filter(Boolean) });
      return answer('wont', read, T('Messages go out from the line’s own steps, by themselves, after the person before them. I don’t skip a person’s step. I can draft a reminder for a client whose quote is waiting.'), { next: nextOf([T('Which clients haven’t answered?')], ctx) });
    }
    if (x && x.who === 'The client') return answer('wont', read, `${T('Approving the quote is {C}’s step, from {C}’s link.', v)} ${none}`, { links: [orderLink(o)] });
    if (x && isPerson(x.kind)) return answer('wont', read, `${T(o.at === 'quote' ? 'Checking the quote is {who}’s step, and approving it is {C}’s.' : 'That step is {who}’s.', v)} ${none}`, { links: [todayLink(x.who)].filter(Boolean) });
    return answer('wont', read, `${T('Every approval on Sufra’s line belongs to a person.')} ${none}`, { next: nextOf([waitingFor('Reem')], ctx) });
  }

  // ---------- reminders: the line's own step, run early or set for a time; never a new message ----------
  const remindTitle = (j, when) => (when === 'now' ? T('Remind {C} now', k('C', Cn(j))) : T('Remind {C} {when}', Object.assign(k('C', Cn(j)), { when: onAt(when) })));
  // a draft's name, said again in the page's language from what it is (a conversation may have begun in another)
  function titleOf(d) {
    if (d.type === 'line') return lineTitle(J.station(d.st).st, d.len, d.was);
    const j = ALL.find((x) => x.code === d.code);
    return j ? remindTitle(j, d.when) : d.title;
  }
  // a clock time a sentence offers as a question: 'Remind Omar today at 18:00'
  const atTime = (v, time) => Object.assign({}, v, { time, timeL: TR ? tl(time) : time });
  // when: 'now', a time in ms, or null for the default (now once the link has gone; Sufra's closing time if not)
  function remindPlan(j, when, ctx) {
    const t = ctx.now, c = V.chase(j, t), x = J.stepOf(j), v = Object.assign(k('C', Cn(j)), { title: ti(j) });
    if (!c) {
      const f = K.facts(j);
      if (j.finished || V.delivered(j)) return { no: T(j.finished ? '{title} is finished. There is nothing to remind {C} about.' : '{title} is delivered. There is nothing to remind {C} about.', v) };
      return { no: T(f.answered ? '{C} approved {title}’s quote {when}. There is nothing to remind {C} about.' : '{C} approved {title}’s quote. There is nothing to remind {C} about.',
        Object.assign(v, { when: f.answered ? atOn(V.U(f.rounds[f.rounds.length - 1].answer).getTime()) : '' })) };
    }
    const passed = (at) => T('{time} has passed: it is {now} now.', { time: V.hm(at), now: V.hm(t) });
    const after = () => T('That is after the {ev} on {date}.', Object.assign({ date: V.label(c.ev) }, evs(j)));
    const why = (at) => (at <= t ? passed(at) : at >= c.ev ? after() : at >= c.remindAt ? T('The line reminds {C} {when} anyway, before then.', Object.assign({}, v, { when: onAt(c.remindAt) })) : '');
    if (!c.gone) {
      const r = V.risk(j, t);
      const waiting = isPerson(x.kind) ? T(/^Watar drafts/.test(x.name) ? 'it waits for {who} to check it' : 'it waits for {who}, who is {doing}', Object.assign(k('who', T(x.who)), { doing: K.doing(x, j, Cn(j)) }))
        : T('it is still at {station}', { station: stn(J.station(j.at).st) });
      const wv = Object.assign({}, v, { waiting });
      if (!r && when == null) return { no: T('{title}’s quote hasn’t gone to {C} yet: {waiting}. There is nothing to remind {C} about.', wv) };
      const at = when == null || when === 'now' ? dayStart(t) + CLOSE : when;
      if (when === 'now') return { no: T('{title}’s quote hasn’t gone to {C} yet: {waiting}. I can set a reminder for later today instead.', wv), retry: T('Remind {C} today at {time}', atTime(v, S.hours.close)) };
      const bad = at <= t ? passed(at) : at >= c.ev ? after() : '';
      if (bad) return { no: bad };
      return { draft: { type: 'remind', key: `remind:${j.code}`, code: j.code, when: at, gone: false, title: remindTitle(j, at), waiting } };
    }
    if (when == null || when === 'now') return { draft: { type: 'remind', key: `remind:${j.code}`, code: j.code, when: 'now', gone: true, title: remindTitle(j, 'now') } };
    const bad = why(when);
    if (bad) return { no: bad };
    return { draft: { type: 'remind', key: `remind:${j.code}`, code: j.code, when, gone: true, title: remindTitle(j, when) } };
  }
  function remindAnswer(t, list, who, ctx) {
    const waiting = live.filter((j) => waitsOn(j).kind === 'client').sort(byIso);
    // 'remind me about …' is the asker's own reminder, even with an order named: Today keeps those, not the client
    const self = has(t, ['remind me', 'remind us']) || said(t, 'self');
    if (self || (!list.length && who && !t.split(' ').some((w) => tok(w)))) {
      const k_ = self ? ctx.viewer : who, p = S.people[k_], you = k_ === ctx.viewer, w = mineOf(p.name), v = Object.assign(k('name', T(p.name)), { title: w.length ? ti(w[0]) : '' });
      const lead = T(you ? (w.length ? 'I draft reminders the line sends to clients. Your Today lists what waits for you, {title} first.' : 'I draft reminders the line sends to clients. Your Today lists what waits for you.')
        : w.length ? 'I draft reminders the line sends to clients. {name}’s Today lists what waits for {name}, {title} first.' : 'I draft reminders the line sends to clients. {name}’s Today lists what waits for {name}.', v);
      return answer('remind-team', T(you ? 'remind you' : 'remind {name}', v), lead, { links: [{ href: `today.html?as=${k_}`, t: you ? T('Open your Today') : T('Open {name}’s Today', v), i: 'Today' }] });
    }
    if (list.length !== 1) {
      const items = list.length > 1 ? list.filter((j) => V.chase(j, ctx.now)) : waiting;
      if (!items.length) return answer('remind', T('remind whom?'), T('No client’s quote is waiting, so there is no one to remind.'));
      const opts = items.map((j) => T('{C}, for {title}', Object.assign(k('C', Cn(j)), { title: ti(j) })));
      return answer('clarify', T('remind whom?'), T('Who should I remind? I draft reminders to clients whose quote is waiting: {list}.', { list: either(opts) }), {
        pending: 'remind', choices: { label: T('Who should I remind?'), pending: 'remind', items: items.map((j) => ({ q: ti(j), t: `${Cn(j)} · ${ti(j)}` })) } });
    }
    const j = list[0], done = decided(ctx, `remind:${j.code}`), c0 = V.chase(j, ctx.now), v = Object.assign(k('C', Cn(j)), { title: ti(j) });
    let when = timeIn(t, ctx.now), moved = '';
    if (done) {
      return answer('remind', T('remind {C}, for {title}', v), T(done.from === 'page' ? '{C} was reminded {when}, sent by {by}. The line still waits for {C}’s answer.' : '{C} was reminded {when}, approved by {by}. The line still waits for {C}’s answer.',
        Object.assign({}, v, { when: done.when === 'now' ? T('at {time}', tv(done.at)) : onAt(done.when), by: T(done.by) })), { links: [orderLink(j)] });
    }
    // only today, or several days: the time is asked back, never guessed as now
    if (when === 'ask') {
      return answer('clarify', T('remind {C}, for {title}: at what time?', v), T('At what time should I remind {C}? Sufra works {open} to {close}. For example: “{example}”.',
        Object.assign({}, v, { open: S.hours.open, close: S.hours.close, example: T('Remind {C} tomorrow at {time}', atTime(v, '09:00')) })),
      { links: [orderLink(j)], next: [c0 && c0.gone ? T('Remind {C} now', v) : T('Remind {C} today at {time}', atTime(v, S.hours.close)), T('Remind {C} tomorrow at {time}', atTime(v, S.hours.open))] });
    }
    // a time outside Sufra's working hours moves to the next opening, and the answer says so
    if (typeof when === 'number') {
      const tod = when - dayStart(when);
      if (tod < OPEN || tod > CLOSE) {
        // the next opening still ahead: before it today, after it the next day's
        let to = dayStart(when) + (tod > CLOSE ? DAY : 0) + OPEN;
        if (to <= ctx.now) to += DAY;
        moved = `${T('{time} is outside Sufra’s working hours, {open} to {close}, so I set it for {when}.', { time: V.hm(when), open: S.hours.open, close: S.hours.close, when: onAt(to) })} `;
        when = to;
      }
    }
    // a day without a clock time is Sufra's opening hour that day
    const opens = typeof when === 'number' && !moved && !clockIn(t);
    const plan = remindPlan(j, when, ctx), read = typeof when === 'number' ? T('remind {C}, for {title}, {when}', Object.assign({}, v, { when: onAt(when) })) : T('remind {C}, for {title}', v);
    if (plan.no) return answer('remind', read, `${moved}${plan.no}`, { links: [orderLink(j)], next: plan.retry ? [plan.retry] : nextOf([whyWaiting(j)], ctx) });
    const d = plan.draft, c = V.chase(j, ctx.now), dv = Object.assign({}, v, { when: d.when === 'now' ? '' : onAt(d.when), was: onAt(c.remindAt) });
    const lead = d.gone ? T(d.when === 'now' ? 'The line’s own reminder to {C} for {title}, now instead of {was}. Nothing goes out until you approve it.'
      : opens ? 'The line’s own reminder to {C} for {title}, {when}, when Sufra opens, instead of {was}. Nothing goes out until you approve it.' : 'The line’s own reminder to {C} for {title}, {when} instead of {was}. Nothing goes out until you approve it.', dv)
      : T(opens ? '{title}’s quote hasn’t gone to {C} yet, so I drafted a reminder for {when}, when Sufra opens, in case the link has gone and {C} hasn’t answered by then. Nothing is set until you approve it.'
        : '{title}’s quote hasn’t gone to {C} yet, so I drafted a reminder for {when}, in case the link has gone and {C} hasn’t answered by then. Nothing is set until you approve it.', dv);
    return answer('remind', read, `${moved}${lead}`, { drafts: [Object.assign({ asked: true }, d)], links: [orderLink(j)] });
  }

  // ---------- rendering the parts: the product's own rows, strips and lines ----------
  function stripData(j, r, t) {
    // set: a reminder decided here or on the client's page moved it; sent: and it has gone
    return { link: r.linkAt, done: !!r.gone, remind: r.remindAt, ev: r.ev, evName: T(cap(eventOf(j))), now: t, set: !!r.settled, sent: !!r.settled && r.remindAt <= t };
  }
  function riskBlock(j, r, ctx) {
    const why = reason(j, r, ctx);
    if (r.why !== 'reminder') return `<div class="aw-why"><p>${esc(why)}</p></div>`;
    return `<div class="aw-why"><p>${esc(why)}</p><div class="aw-ts" aria-hidden="true" data-ts="${esc(JSON.stringify(stripData(j, r, ctx.now)))}"></div></div>`;
  }
  function rowsPart(p, ctx) {
    const shown = p.rows.slice(0, 6);
    const li = shown.map(({ j, r }) => { const row = V.dueRow(j); return r ? row.replace(/<\/li>$/, `${riskBlock(j, r, ctx)}</li>`) : row; }).join('');
    const more = p.rows.length > 6 ? `<p class="aw-more"><a href="orders.html">${esc(T('See all {n} in Orders', { n: p.rows.length }))}</a></p>` : '';
    return `<figure class="aw-fig"><figcaption class="aw-fc">${icon('Orders', 16)}<span>${esc(p.cap)}</span></figcaption><ol class="at-list aw-rows">${li}</ol>${more}</figure>`;
  }
  function stepRows(j, st) {
    const steps = V.clock(j).filter((s) => s.st === st);
    return steps.filter((s) => s.state !== 'skip').map((s) => {
      const x = s.x, who = isPerson(x.kind) ? T(x.who === 'The client' ? j.client : x.who) : x.kind === 'rest' ? T('Waits {wait}', { wait: waitWord(x) }) : T('Runs by itself');
      const since = sinceOf(j);
      const now_ = x.who === 'The client' ? T('Waiting for {C}', k('C', Cn(j))) : isPerson(x.kind) ? T('Now · waits for {who}', k('who', T(x.who))) : T('Now');
      const w = s.state === 'done' ? (s.t != null ? `<time datetime="${V.iso(s.t)}">${V.at(s.t)}</time>` : esc(T('Done')))
        : s.state === 'now' ? `<b>${esc(now_)}</b>${since ? ` ${T('since {time}', { time: `<time datetime="${V.iso(since)}">${V.at(since)}</time>` })}` : ''}` : esc(T('Next'));
      return `<li class="os-step ${s.state}">${glyph(x.kind, { test: s.state === 'next' })}<span class="os-n"><b>${esc(T(x.name))}</b><span>${esc(who)}</span></span><span class="os-w">${w}</span></li>`;
    }).join('');
  }
  // the order's line as the order page writes it; in Arabic it runs from the right, like the words around it
  const flow = (svg) => (!I18N.rtl || /^<svg[^>]*\bflow\b/.test(svg) ? svg : /^<svg[^>]*\bclass="/.test(svg) ? svg.replace(/^(<svg[^>]*\bclass=")/, '$1flow ') : svg.replace(/^<svg/, '<svg class="flow"'));
  // a draft's own note, said in the page's language (a client's change adds their words before it)
  const noteOf = (s) => { const m = /^For the client’s note, “(.+)”: (.+)$/.exec(s); return m ? T('For the client’s note, “{note}”: {quote}', { note: T(m[1]), quote: T(m[2]) }) : T(s); };
  function orderPart(p, ctx) {
    const j = p.j, jr = V.journey(j), t = ctx.now;
    const head = `<div class="aw-oh"><code>${j.code}</code><a href="order.html?code=${j.code}">${esc(ti(j))}</a><span>${esc(T(j.finished ? '{who} · {people} · due {due}' : '{who} · {people} · due {due}, {when}',
      { who: T('{client}, {of}', { client: T(j.client), of: T(j.of) }), people: P(j.people, '{n} people', '{n} people'), due: V.due(j), when: j.finished ? '' : V.when(j.iso) }))}</span></div>`;
    if (j.finished) return `<figure class="aw-fig aw-one">${head}<div class="aw-jr"><div class="aw-jr-l">${flow(jr.svg)}</div><p class="aw-cap">${esc(jr.cap)}</p></div></figure>`;
    const st = J.station(j.at), x = J.stepOf(j), w = waitsOn(j), facts = [];
    const ring = w.kind === 'team' ? (s) => s.steps.some((y) => isPerson(y.kind) && y.who === w.who) : null;
    if (w.kind === 'team') {
      const mine = mineOf(w.who), n = mine.indexOf(j), pos = { nth: ord(n + 1), i: n + 1, n: mine.length, title: n > 0 ? ti(mine[n - 1]) : '' };
      facts.push([T('On {who}’s Today', k('who', T(w.who))), mine.length === 1 ? T('The only order waiting') : T(n > 0 ? '{nth} of {n}, after {title}' : '{nth} of {n}', pos)]);
    }
    if (j.draft) facts.push([T('My draft'), T('{items} · {note} · total {total}', { items: j.draft.items.map((s) => T(s)).join(T(', ')), note: lc(noteOf(j.draft.note).replace(/\.$/, '')), total: T(j.draft.total) })]);
    const ahead = J.ahead(j), branch = line.routes.find((r) => r.type === 'branch' && j.people > r.over);
    const onBranch = branch && ahead.some((a) => branch.stations.includes(a.st));
    const bSaid = onBranch ? branch.stations.flatMap((s) => s.steps.map((y) => (y.kind === 'rest' ? thenWaits(y) : T(y.name)))).join(T(', ')) : '';
    const steps = P(ahead.length, '{n} step.', '{n} steps.');
    facts.push([T('Ahead'), onBranch ? `${steps} ${T('With {people} people it takes the branch for orders over {over}: {steps}.', { people: j.people, over: branch.over, steps: bSaid })}` : steps]);
    const waits = ahead.filter((a) => a.x.kind === 'rest'), left = V.U(j.iso).getTime() - t;
    // an event that has passed has no time left: when it was, and when it was delivered
    const leftSaid = left < 0 ? wasOn(j) : T(/^(a|an) \w+$/.test(V.span(left)) ? '{span} is left.' : '{span} are left.', { span: cap(V.span(left)) });
    if (waits.length) {
      const hours = waits.reduce((v, a) => v + V.restHours(a.x.who), 0);
      const each = waits.map((a) => (a.st === V.gate ? T('up to {wait} for {C}’s answer', Object.assign(k('C', Cn(j)), { wait: waitWord(a.x) })) : T(`${lc(a.x.who)} ${a.x.name.replace(/^Wait /, '')}`)));
      facts.push([T('Time'), `${T('The waits ahead take {span} at most: {list}.', { span: V.span(hours * HOUR), list: both(each) })} ${leftSaid}`]);
    } else facts.push([T('Time'), leftSaid]);
    if (p.r && p.r.why === 'reminder' && V.days(V.iso(p.r.ev - DAY)) === 0) {
      facts.push([T('Kitchen'), T('Its kitchen reminder, a day before, would be today at {time}; it runs when the order reaches {station}.', { time: V.hm(p.r.ev - DAY), station: stn(J.station('prepare').st) })]);
    }
    const where = `<div class="aw-jr-s">${J.strip(j, ring)}<span>${T('At {station} · step {i} of {n}', { station: `<b>${esc(stn(st.st))}</b>`, i: j.step + 1, n: st.st.steps.length })}</span></div>`;
    return `<figure class="aw-fig aw-one">${head}
<div class="aw-jr"><div class="aw-jr-l">${flow(jr.svg)}</div><p class="aw-cap">${esc(jr.cap)}</p></div>${where}
<h4 class="aw-sh">${glyph(x.kind)}<span>${esc(T('At {station}', { station: stn(st.st) }))}</span></h4><ol class="aw-steps">${stepRows(j, st.st)}</ol>
<dl class="aw-dl">${facts.map(([k_, v]) => `<div><dt>${esc(k_)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
${p.r ? riskBlock(j, p.r, ctx) : ''}</figure>`;
  }
  function personPart(p) {
    const name = p.p.name, ring = (s) => s.steps.some((y) => isPerson(y.kind) && y.who === name);
    const rows = p.w.map((j) => {
      const x = J.stepOf(j), st = J.station(j.at).st, since = sinceOf(j);
      const now_ = T(since ? 'At {station}: {step} · since {since} · due {due}' : 'At {station}: {step} · due {due}', { station: stn(st), step: T(x.name), since: since ? V.at(since) : '', due: V.due(j) });
      return `<li class="aw-mn"><div class="aw-mn-t"><code>${j.code}</code><a href="order.html?code=${j.code}">${esc(ti(j))}</a><span class="hint">${esc(P(j.people, '{n} people', '{n} people'))}</span></div>
<div class="aw-mn-pos">${J.strip(j, ring)}</div>
<p class="aw-mn-now">${glyph(x.kind)}<span>${esc(now_)}</span></p></li>`;
    }).join('');
    const ds = S.done.filter((d) => d.who === name);
    const done = ds.length ? `<p class="aw-fn">${icon('Done', 16)}<span>${T('Done today: {list}.', { list: ds.map((d) => `<time>${d.time}</time> ${esc(did(d))}`).join(' · ') })}</span></p>` : '';
    const next = p.coming ? `<p class="aw-fn">${icon('History', 16)}<span>${esc(T(p.you ? 'Next to reach you: {title}, at {station}.' : 'Next to reach {name}: {title}, at {station}.', Object.assign(k('name', T(name)), { title: ti(p.coming.j), station: stn(p.coming.st) })))}</span></p>` : '';
    return `<figure class="aw-fig"><figcaption class="aw-fc"><span class="av" aria-hidden="true">${esc(T(name).charAt(0))}</span><span>${esc(T(name))} · ${esc(T(p.p.role))}</span></figcaption>${rows ? `<ol class="aw-mini">${rows}</ol>` : ''}${done}${next}</figure>`;
  }
  function teamPart(p) {
    return `<figure class="aw-fig"><figcaption class="aw-fc">${icon('People', 16)}<span>${esc(T('The team today'))}</span></figcaption><ol class="aw-team">${p.rows.map((r) => `<li><a class="aw-tm" href="today.html?as=${r.p.k}">
<span class="av" aria-hidden="true">${esc(T(r.p.name).charAt(0))}</span><span class="aw-tm-t"><b>${esc(T(r.p.name))}</b><span>${esc(T(r.p.role))}</span></span>
<span class="aw-tm-n">${T('{w} waiting · {d} done today', { w: `<i>${r.w.length}</i>`, d: `<i>${r.d.length}</i>` })}</span></a></li>`).join('')}</ol></figure>`;
  }
  function stationsPart(p) {
    return `<figure class="aw-fig"><figcaption class="aw-fc">${icon('Line', 16)}<span>${esc(T('Sufra’s line now'))}</span></figcaption><ol class="aw-st">${p.rows.map((r) => `<li class="${r.br ? 'br' : ''}${r.top ? ' most' : ''}${r.js.length ? '' : ' none'}"><a href="orders.html?at=${r.s.id}">
<span class="aw-st-n">${esc(stn(r.s))}${r.br ? `<small>${esc(T('orders over {n} people', { n: 30 }))}</small>` : ''}</span><span class="aw-st-c">${r.js.length}</span><span class="aw-st-w">${esc(r.say || T('Nothing here now'))}</span></a></li>`).join('')}</ol></figure>`;
  }
  function stationPart(p) {
    const st = p.st;
    const steps = st.steps.map((x) => {
      const who = x.who === 'The client' ? T('the client, from their link') : isPerson(x.kind) ? T(x.who) : x.kind === 'rest' ? T('a timed wait of {wait}', { wait: waitWord(x) }) : T('runs by itself');
      const msg = x.msg ? `<span class="aw-msg">${esc(T(x.msg))}</span>` : '';
      return `<li class="os-step">${glyph(x.kind)}<span class="os-n"><b>${esc(T(x.name))}</b><span>${esc(who)}</span>${msg}</span></li>`;
    }).join('');
    const routes = line.routes.filter((r) => r.from === st.id).map((r) => (r.type === 'back' ? T('Back to {station} when {when}', { station: stn(J.station(r.to).st), when: T(lc(r.when)) })
      : T('Over {n} people: on to {stations}, rejoining at {to}; the rest go to {next}', { n: r.over, stations: r.stations.map((s) => stn(s)).join(T(', ')), to: stn(J.station(r.to).st), next: stn(J.station(J.nextStation({ people: 0 }, st.id)).st) })));
    const br = line.routes.find((r) => r.type === 'branch' && r.stations.includes(st));
    if (br) routes.push(T('On the branch for orders over {n} people, from {from} to {to}', { n: br.over, from: stn(J.station(br.from).st), to: stn(J.station(br.to).st) }));
    const here = p.here.length ? `<h4 class="aw-sh">${icon('Orders', 16)}<span>${esc(T('There now · {n}', { n: p.here.length }))}</span></h4><ol class="at-list aw-rows">${p.here.map(V.dueRow).join('')}</ol>` : `<p class="aw-fn">${icon('Done', 16)}<span>${esc(T('No order is at {station} now.', { station: stn(st) }))}</span></p>`;
    return `<figure class="aw-fig"><figcaption class="aw-fc">${icon('Line', 16)}<span>${esc(stn(st))} · ${esc(P(st.steps.length, '{n} step', '{n} steps'))}</span></figcaption><ol class="aw-steps">${steps}</ol>
${routes.length ? `<ul class="aw-routes">${routes.map((r) => `<li>${icon('Condition', 16)}<span>${esc(r)}</span></li>`).join('')}</ul>` : ''}${here}</figure>`;
  }
  function donePart(p) {
    const rows = p.ds.map((d) => { const s = pastOf(d); return `<li><time>${d.time}</time>${glyph('struck')}<span><b>${esc(T(`{who} ${s.v}${s.what ? ` ${s.what}` : ''}`, { who: T(d.who) }))}</b> · <a href="order.html?code=${d.code}">${esc(T(d.title))}</a> <code>${d.code}</code>${d.then ? `<span class="aw-then">${esc(T(d.then))}.</span>` : ''}</span></li>`; })
      .concat(p.mine.map((d) => `<li><time>${V.hm(d.at)}</time>${glyph(d.state === 'approved' ? 'struck' : 'held')}<span><b>${esc(T(d.from === 'page' ? '{who} sent' : d.state === 'approved' ? '{who} approved' : '{who} sent to the Line screen', { who: T(d.by) }))}</b>: ${esc(titleOf(d))}<span class="aw-then">${esc(T(d.from === 'page' ? 'From the client’s page.' : 'Decided here, in this conversation.'))}</span></span></li>`));
    return `<figure class="aw-fig"><figcaption class="aw-fc">${icon('Done', 16)}<span>${esc(T('Done today · {n}', { n: rows.length }))}</span></figcaption><ol class="aw-done">${rows.join('')}</ol></figure>`;
  }
  const dh = (v) => T('{d} d {h} h', { d: Math.floor(v / DAY), h: Math.floor((v % DAY) / HOUR) });
  function leadPart(p) {
    return `<figure class="aw-fig"><figcaption class="aw-fc">${icon('History', 16)}<span>${esc(T('The {n} most recent of {of} finished', { n: p.rows.length, of: p.of }))}</span></figcaption>
<table class="aw-lt"><thead><tr><th scope="col">${esc(T('Order'))}</th><th scope="col">${esc(T('Came in'))}</th><th scope="col">${esc(T('Took'))}</th></tr></thead><tbody>${p.rows.map((o) => `<tr><th scope="row"><a href="order.html?code=${o.j.code}">${esc(ti(o.j))}</a><span>${esc(V.day(V.fromLabel(o.j.finished)))}</span></th><td>${esc(dh(o.came))}</td><td>${esc(dh(o.took))}</td></tr>`).join('')}</tbody></table>
<p class="aw-fn">${icon('Date', 16)}<span>${esc(T('Came in: from the order to its event. Took: from the order to its invoice.'))}</span></p></figure>`;
  }
  function finishedPart(p) {
    return `<figure class="aw-fig"><figcaption class="aw-fc">${icon('Done', 16)}<span>${esc(T('Finished in the last 7 days · {n}', { n: p.list.length }))}</span></figcaption><ol class="aw-done">${p.list.map((j) => `<li><time>${esc(j.finished.split(', ')[1])}</time>${glyph('struck')}<span><b><a href="order.html?code=${j.code}">${esc(ti(j))}</a></b> <code>${j.code}</code><span class="aw-then">${esc(T('{who} · finished {date}', { who: T('{client}, {of}', { client: T(j.client), of: T(j.of) }), date: V.fin(j) }))}</span></span></li>`).join('')}</ol></figure>`;
  }
  function historyPart(p) {
    const c = p.c, rows = c.open.concat(c.fin.slice().reverse()).slice(0, 6).map((j) => {
      const f = K.facts(j), ans = !f.rounds.length ? T('quote not sent yet') : f.open ? T('waiting since {time}', { time: V.at(f.open.sent) }) : T(f.reminded ? 'answered in {span}, after the reminder' : 'answered in {span}', { span: V.words(f.took) });
      const dv = !f.arrived ? (j.finished ? '' : esc(T('delivery ahead'))) : f.late ? `<span class="t-late">${esc(P(f.late, '{n} min late', '{n} min late'))}</span>` : esc(T('on time'));
      return `<li><time>${esc(V.day(j.iso))}</time>${glyph(f.late ? 'failed' : j.finished ? 'struck' : 'held', { test: !j.finished && !f.open })}<span><b><a href="order.html?code=${j.code}">${esc(ti(j))}</a></b> <code>${j.code}</code><span class="aw-then">${esc(ans)}${dv ? ` · ${dv}` : ''}</span></span></li>`;
    }).join('');
    const name = T(c.name);
    return `<figure class="aw-fig"><figcaption class="aw-fc">${icon('Company', 16)}<span>${esc(name)} · ${esc(P(c.orders.length, '{n} order', '{n} orders'))}</span></figcaption><ol class="aw-done">${rows}</ol>${c.orders.length > 6 ? `<p class="aw-more"><a href="client.html?c=${c.key}#orders">${esc(T('See all {n} on {name}’s page', Object.assign(k('name', name), { n: c.orders.length })))}</a></p>` : ''}</figure>`;
  }
  // orders whose event has passed: the event's time, then its day, the delivery and where it stands now
  function pastPart(p) {
    return `<figure class="aw-fig"><figcaption class="aw-fc">${icon('History', 16)}<span>${esc(p.cap)}</span></figcaption><ol class="aw-done">${p.list.map((j) => `<li><time datetime="${V.iso(j.iso)}">${V.hm(j.iso)}</time>${glyph(K.facts(j).late ? 'failed' : 'struck', { test: !j.finished && !V.delivered(j) })}<span><b><a href="order.html?code=${j.code}">${esc(ti(j))}</a></b> <code>${j.code}</code><span class="aw-then">${esc(V.day(j.iso))} · ${esc(pastSaid(j))}</span></span></li>`).join('')}</ol></figure>`;
  }
  const PARTS = { past: pastPart, rows: rowsPart, order: orderPart, person: personPart, team: teamPart, stations: stationsPart, station: stationPart, done: donePart, lead: leadPart, finished: finishedPart, history: historyPart };

  // the time strip: the line's timed wait at its real length, as the grammar's lifted pen, against the day and the event.
  // Now and the event are named above the axis, at their lines; the reminder under the axis, beside its own stroke, so
  // the labels never pile up where the event and the reminder meet. In Arabic the strip runs from the right (.flow)
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const wd = (t) => T(WD[new Date(t).getUTCDay()]);
  // a label's width: Fragment Mono's 7.3 px advance in English; measured where Arabic falls through to Readex Pro
  let pen = null;
  function wide(s, cw) {
    if (EN) return s.length * cw;
    try { pen = pen || document.createElement('canvas').getContext('2d'); pen.font = "12px 'Fragment Mono', 'Atkinson Hyperlegible Next', monospace"; return pen.measureText(s).width; } catch (e) { return s.length * cw; }
  }
  function drawStrip(el) {
    const d = JSON.parse(el.dataset.ts), W = Math.max(240, Math.round(el.clientWidth)), pal = window.IQAA.pal.light;
    const t0 = dayStart(d.now), t1 = dayStart(Math.max(d.ev, d.remind)) + DAY;
    // cw: the advance of 12 px Fragment Mono, the strip's smallest type
    const x = (t) => 8 + ((t - t0) / (t1 - t0)) * (W - 16), k_ = 0.6, run = 24 * k_, cw = 7.3, ROW = 15;
    // above: now and the event, clamped inside the strip; the later one drops a row when it would come within 16 px,
    // so two labels never read as one phrase
    const labels = [{ t: d.now, s: T('Now {time}', { time: V.hm(d.now) }), c: 'nl' }, { t: d.ev, s: T('{event} · {day} {time}', { event: d.evName, day: wd(d.ev), time: V.hm(d.ev) }), c: 'el' }].sort((a, b) => a.t - b.t);
    let end = -Infinity;
    labels.forEach((l) => {
      const w = wide(l.s, cw), cx = Math.min(Math.max(x(l.t), 4 + w / 2), W - 4 - w / 2);
      l.row = cx - w / 2 < end + 16 ? 1 : 0;
      if (!l.row) end = cx + w / 2;
      l.cx = cx;
    });
    const rows = labels.some((l) => l.row) ? 2 : 1, base = rows * ROW + 20, H = base + 26;
    // under: the reminder, centred on its stroke; a day's name gives way to it
    const a = x(d.link), b = x(d.remind), rs = T(d.sent ? 'Reminded · {day} {time}' : d.set ? 'Reminder set · {day} {time}' : 'Reminder · {day} {time}', { day: wd(d.remind), time: V.hm(d.remind) });
    const rw = wide(rs, cw), rx = Math.min(Math.max(b + run / 2, 4 + rw / 2), W - 4 - rw / 2), rl = rx - rw / 2, rr = rx + rw / 2;
    let svg = `<svg${I18N.rtl ? ' class="flow"' : ''} viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" dir="ltr" aria-hidden="true"><path class="day" d="M8 ${base}H${W - 8}"/>`;
    for (let m = t0, last = -Infinity; m <= t1; m += DAY) {
      const mx = x(m), s = T('{wd} {d}', { wd: wd(m), d: new Date(m).getUTCDate() }), sr = mx + 4 + wide(s, cw);
      svg += `<path class="tk" d="M${mx} ${base}v6"/>`;
      if (sr < W && mx > last + 8 && (sr + 8 < rl || mx + 4 > rr + 8)) { svg += `<text class="dl" x="${mx + 4}" y="${base + 21}">${esc(s)}</text>`; last = sr; }
    }
    // the pen is up for the length of the wait: no stroke, a quiet band, its dot at the middle; the reminder is ink once sent
    svg += `<rect class="up" x="${a}" y="${base - 8}" width="${Math.max(0, b - a)}" height="16" rx="4"/><circle cx="${(a + b) / 2}" cy="${base}" r="${(3.2 * k_ * 0.9).toFixed(2)}" fill="${d.done ? pal.run : '#807E91'}"/>`;
    svg += IQ.cell('run', (a - run) / k_, base / k_, pal, k_, !d.done) + IQ.cell('run', b / k_, base / k_, pal, k_, !d.sent);
    const top = rows * ROW + 3;
    svg += `<path class="ev" d="M${x(d.ev)} ${top}V${base + 8}"/><path class="now" d="M${x(d.now)} ${top}V${base + 8}"/>`;
    svg += labels.map((l) => `<text class="${l.c}" x="${l.cx}" y="${12 + l.row * ROW}" text-anchor="middle">${esc(l.s)}</text>`).join('');
    svg += `<text class="rl" x="${rx}" y="${base + 21}" text-anchor="middle">${esc(rs)}</text>`;
    el.innerHTML = `${svg}</svg>`;
  }
  const strips = new ResizeObserver((es) => es.forEach((e) => { const w = Math.round(e.contentRect.width); if (w && w !== +e.target.dataset.w) { e.target.dataset.w = w; drawStrip(e.target); } }));
  function drawStrips(el) { $$('[data-ts]', el).forEach((s) => { drawStrip(s); strips.observe(s); }); }
  // the labels were measured before the Arabic face arrived: measure again once it has
  if (!EN && document.fonts) document.fonts.ready.then(() => $$('[data-ts]').forEach((s) => drawStrip(s)));

  // ---------- drafts: one per key and question; a later answer shows a line pointing at it ----------
  const draftOf = (id) => conv.drafts[id];
  // a draft's id is its key and its question, with the conversation's round after the first: a new conversation never
  // meets, or points at, the drafts of the one it cleared
  const draftId = (key, n) => (conv.round ? `${key}@${conv.round}.${n}` : `${key}@${n}`);
  const thisRound = (d) => (d.round || 0) === (conv.round || 0);
  function latestOf(key, before) {
    return Object.entries(conv.drafts).filter(([, d]) => d.key === key && d.made < before && thisRound(d)).sort((a, b) => b[1].made - a[1].made)[0] || null;
  }
  const sameWhen = (d, p) => (p.type === 'line' ? d.len === p.len : d.when === p.when);
  // live: a new question decides now whether its proposal is a new draft, replaces a pending one, or points at one
  function place(p, n, live_) {
    const id = draftId(p.key, n);
    if (draftOf(id)) return { id };
    const prev = Object.entries(conv.drafts).filter(([, d]) => d.key === p.key && d.made < n && thisRound(d) && !['discarded', 'replaced'].includes(d.state)).sort((a, b) => b[1].made - a[1].made)[0];
    if (!live_) { const l = prev || latestOf(p.key, n); return l ? { ref: l[0] } : null; }
    // only a reminder asked for at another time replaces one waiting; any other answer points at what waits
    if (prev && (sameWhen(prev[1], p) || prev[1].state !== 'pending' || !p.asked)) return { ref: prev[0] };
    if (prev) Object.assign(prev[1], { state: 'replaced', at: now(), by: me.name, after: n, by_: id });
    conv.drafts[id] = Object.assign({ state: 'pending', made: n, round: conv.round || 0, q: conv.asked[n] ? conv.asked[n].q : '', qa: conv.asked[n] ? conv.asked[n].at : now() }, p);
    return { id, fresh: true };
  }
  const STATE_WORD = { pending: 'waits for you', approved: 'approved', sent: 'sent to the Line screen', discarded: 'discarded', replaced: 'replaced', elsewhere: 'sent from the client’s page' };
  // a title inside a sentence: lower-cased only in English ('Approve: remind Omar now')
  const lcT = (s) => (EN ? lc(s) : s);
  function refHtml(id) {
    const d = draftOf(id);
    if (!d) return '';
    const title = titleOf(d);
    const what = T(d.state === 'pending' ? 'Drafted above' : d.state === 'approved' ? 'Approved above' : d.state === 'sent' ? 'Sent to the Line screen above' : `${cap(STATE_WORD[d.state])} above`);
    return `<p class="aw-ref" data-ref="${id}">${glyph(d.state === 'approved' ? 'struck' : 'held')}<span>${esc(what)}: ${esc(title)}${d.state === 'pending' ? ` · ${esc(T('waits for you'))}` : d.at ? ` · ${V.hm(d.at)}` : ''}</span> <button type="button" class="link" data-show="${id}" aria-label="${esc(T('Show the draft: {title}', { title: lcT(title) }))}">${esc(T('Show'))}</button></p>`;
  }
  // the reminder's words for one order: the line's text with the order written in, in the page's language
  function message(j) {
    if (EN) return V.fill(remindStep.msg, j);
    return T(remindStep.msg).replace(/\{client\.name\}/g, Cn(j)).replace(/\{order\.title\}/g, ti(j)).replace(/\{order\.people\}/g, String(j.people))
      .replace(/\{order\.due\}/g, V.due(j)).replace(/\{quote\.link\}/g, ltr(`sufra.iqaa.app/q/${j.code.slice(-4)}`));
  }
  function draftHtml(id) {
    const d = draftOf(id), j = d.code && ALL.find((x) => x.code === d.code), ok = d.state === 'approved', idn = id.replace(/[^\w-]/g, '-'), title = titleOf(d), lt = lcT(title);
    if (d.state === 'discarded') return `<div class="aw-dr gone" data-d="${id}"><p>${icon('Discard', 16)}<span>${esc(T('Discarded: {title} · {time}', { title, time: V.hm(d.at) }))}</span> <button type="button" class="link" data-undo-d="${id}" aria-label="${esc(T('Undo: discard {title}', { title: lt }))}">${esc(T('Undo'))}</button></p></div>`;
    if (d.state === 'elsewhere') return `<div class="aw-dr gone" data-d="${id}"><p>${icon('Done', 16)}<span>${esc(T('Sent from the client’s page by {by} · {time}: {title}', { by: T(d.by), time: V.hm(d.at), title }))}</span></p></div>`;
    if (d.state === 'replaced') return `<div class="aw-dr gone" data-d="${id}"><p>${icon('History', 16)}<span>${esc(T('Replaced by the draft below · {time}: {title}', { time: V.hm(d.at), title }))}</span> <button type="button" class="link" data-show="${d.by_}" aria-label="${esc(T('Show the draft that replaced it'))}">${esc(T('Show'))}</button></p></div>`;
    const by = ok ? T('Approved by {by} · {time}', { by: T(d.by), time: V.hm(d.at) }) : d.state === 'sent' ? T('Draft from Watar · sent to the Line screen') : T(d.type === 'line' ? 'Draft from Watar · for the line' : 'Draft from Watar · waits for you');
    const head = `<p class="aw-dk"><span class="g" data-dk aria-hidden="true">${IQ.glyph(ok ? 'struck' : 'held')}</span><span>${esc(by)}</span></p><h3 id="aw-d-${idn}" tabindex="-1">${esc(title)}</h3>`;
    if (d.type === 'line') {
      const st = J.station(d.st).st, ver = S.version, xs = st.steps, len = T(lc(d.len));
      const rows = xs.map((x) => (x.kind === 'rest' ? `<li class="chg">${glyph('rest', { test: true })}<span><b>${esc(T('Wait {len}', { len }))}</b> <span>${esc(T('was {was}', { was: T(lc(d.was)) }))}</span></span></li>` : `<li>${glyph(x.kind)}<span>${esc(T(x.name))}</span></li>`)).join('');
      const act = d.state === 'sent' ? `<p class="aw-ok" tabindex="-1" data-status>${icon('Line', 16)}<span>${esc(T('Sent to the Line screen at {time} · publish or discard it there', { time: V.hm(d.at) }))}</span></p><div class="aw-act"><a class="link aw-lk" href="line.html?wait=${d.st}:${encodeURIComponent(d.len)}">${icon('Line', 16)}<span>${esc(T('Open the line'))}</span></a></div>`
        : `<div class="aw-act">${meKey === OWNER ? `<button type="button" class="btn" data-handoff="${id}" aria-label="${esc(T('Draft it on the Line screen: {title}', { title: lt }))}">${icon('Line')}<span>${esc(T('Draft it on the Line screen'))}</span></button>` : `<p class="aw-own">${icon('Lock', 16)}<span>${esc(T('The line is {name}’s to change.', k('name', T(S.people[OWNER].name))))}</span></p>`}<button type="button" class="link aw-lk" data-discard="${id}" aria-label="${esc(T('Discard: {title}', { title: lt }))}">${icon('Discard', 16)}<span>${esc(T('Discard'))}</span></button></div>`;
      return `<section class="aw-dr${d.state === 'sent' ? ' sent' : ''}" data-d="${id}" aria-labelledby="aw-d-${idn}">${head}
<p class="aw-dw">${esc(T('In the draft of version {v}, {station} waits {len} for the client’s answer before it reminds them.', { v: ver + 1, station: stn(st), len }))}</p>
<ol class="aw-dl3">${rows}</ol>
<p class="aw-dn">${esc(T(d.risky.length ? 'Every new order’s client would be reminded {len} sooner. Running orders keep version {v}, so {title} still needs its own reminder.' : 'Every new order’s client would be reminded {len} sooner. Running orders keep version {v}.', { len, v: ver, title: d.risky.length ? T(d.risky[0]) : '' }))}</p>${act}</section>`;
    }
    const c = V.chase(j, d.qa), C = Cn(j), sched = d.when !== 'now', channel = (S.clients[j.ck] || {}).by === 'Email' ? 'Email' : 'WhatsApp';
    const v = Object.assign(k('C', C), { title: ti(j), step: T(remindStep.name), time: sched ? V.hm(d.when) : '', timeL: sched ? tv(d.when).timeL : '', when: sched ? onAt(d.when) : '', was: onAt(c.remindAt), wait: waitWord(c.wait) });
    const what = !d.gone ? T('If the quote link has gone and {C} hasn’t answered by {time}, Iqaa reminds {C} then, instead of {wait} after the link. For {title} only.', v)
      : T(sched ? 'Runs {title}’s ‘{step}’ {when} if {C} hasn’t answered by then, instead of {was}.' : 'Runs {title}’s ‘{step}’ now, instead of {was}.', v);
    // the action's own strokes: a straight for now, a lifted pen then a straight for later; ink once it ran
    const pal = window.IQAA.pal.light, ran = ok && !sched;
    const strokes = `<svg class="aw-ds" viewBox="-3.2 -12 ${sched ? 54.4 : 30.4} 18" aria-hidden="true">${sched ? IQ.cell('rest', 0, 0, pal, 1, true) + IQ.cell('run', 24, 0, pal, 1, true) : IQ.cell('run', 0, 0, pal, 1, !ran)}</svg>`;
    const later = sched && ok && d.when > now();
    const status = ok ? `<p class="aw-ok" tabindex="-1" data-status>${glyph('run', { test: sched })}<span>${esc(T(sched ? 'Iqaa reminds {C} {when} if {C} hasn’t answered by then.' : 'Iqaa runs the reminder now. {title} still waits for {C}’s answer.', v))}</span></p>` : '';
    const act = ok ? (later ? `<div class="aw-act"><button type="button" class="link aw-lk" data-takeback="${id}" aria-label="${esc(T('Take back: {title}', { title: lt }))}">${icon('Undo', 16)}<span>${esc(T('Take it back'))}</span></button></div>` : '')
      : `<div class="aw-act"><button type="button" class="btn primary" data-approve="${id}" aria-label="${esc(T('Approve: {title}', { title: lt }))}">${icon('Done')}<span>${esc(T('Approve'))}</span></button><button type="button" class="link aw-lk" data-discard="${id}" aria-label="${esc(T('Discard: {title}', { title: lt }))}">${icon('Discard', 16)}<span>${esc(T('Discard'))}</span></button><button type="button" class="link aw-lk" data-retime="${id}" aria-label="${esc(T('Change the time: {title}', { title: lt }))}">${icon('Date', 16)}<span>${esc(T('Change the time'))}</span></button></div>`;
    const wont = d.gone ? T('I won’t change the quote or the line.') : T('I won’t send the quote: {who} checks my draft first.', k('who', T(J.stepOf(j).who)));
    // once approved, what it does is said as what Iqaa now does
    return `<section class="aw-dr${ok ? ' approved' : ''}" data-d="${id}" aria-labelledby="aw-d-${idn}">${head}${status || `<p class="aw-dw">${esc(what)}</p>`}
<p class="aw-dm">${strokes}<span>${esc(T(channel === 'Email' ? '{C} gets this from Sufra, by email:' : '{C} gets this from Sufra, by WhatsApp:', v))}</span></p>
<p class="aw-msg">${esc(message(j))}</p>
<p class="aw-dn">${icon('Lock', 16)}<span>${esc(wont)}</span></p>${act}</section>`;
  }

  // ---------- one exchange: the question, then Watar's answer ----------
  function partsHtml(a, n, live_) {
    const out = [];
    if (a.lead) out.push(`<p class="aw-lead">${esc(a.lead)}</p>`);
    if (a.intro) out.push(`<p class="aw-lead">${esc(a.intro)}</p>`);
    a.parts.forEach((p) => out.push(PARTS[p.type](p, a.ctx)));
    a.notes.forEach((t) => out.push(`<p class="aw-note">${esc(t)}</p>`));
    a.drafts.forEach((p) => { const r = place(p, n, live_); if (r) out.push(r.id ? draftHtml(r.id) : refHtml(r.ref)); });
    if (a.choices) {
      const pend = a.choices.pending ? ` data-pending="${a.choices.pending}"` : '';
      out.push(`<div class="aw-ch" role="group" aria-label="${esc(a.choices.label)}">${a.choices.items.map((c) => `<button type="button" class="aw-row" data-q="${esc(c.q)}"${pend}>${esc(c.t)}</button>`).join('')}</div>`);
    }
    const links = a.links.filter(Boolean);
    if (links.length) out.push(`<p class="aw-links">${links.map((l) => `<a href="${l.href}">${icon(l.i, 16)}<span>${esc(l.t)}</span></a>`).join('')}</p>`);
    if (a.next.length) out.push(`<div class="aw-next"><span class="aw-nk" aria-hidden="true">${esc(T('Ask next'))}</span><ul class="aw-nl" aria-label="${esc(T('Ask next'))}">${a.next.map((q) => `<li><button type="button" class="aw-nq" data-q="${esc(q)}">${esc(q)}</button></li>`).join('')}</ul></div>`);
    return out.join('\n');
  }
  const watarMark = `<span class="aw-mk"><span class="aw-w" aria-hidden="true">${icon('Ask Watar', 20)}</span></span>`;
  function answerHtml(a, n, live_) {
    return `${watarMark}<p class="aw-meta"><b>${esc(T('Watar'))}</b> · <time datetime="${V.iso(a.at)}">${V.hm(a.at)}</time>${a.read ? `<span class="aw-read"><span class="aw-sep"> · </span>${esc(T('Read as: {read}', { read: a.read }))}</span>` : ''}</p><div class="aw-parts">${partsHtml(a, n, live_)}</div>`;
  }
  // a question keeps the words it was asked in: on another language's page it reads in its own direction
  function exchangeLi(item, n) {
    return `<li class="aw-x" data-n="${n}"><article aria-labelledby="aw-q-${n}">
<div class="aw-turn aw-q"><span class="aw-mk"><span class="aw-me" aria-hidden="true">${esc(T(me.name).charAt(0))}</span></span><p class="aw-meta"><b>${esc(T(me.name))}</b> · <time datetime="${V.iso(item.at)}">${V.hm(item.at)}</time></p><h2 id="aw-q-${n}" class="aw-qt"${EN ? '' : ' dir="auto"'}>${esc(item.q)}</h2></div>
<div class="aw-turn aw-a" data-a></div></article></li>`;
  }

  // the context of question n: its time, the decisions made before it, and the questions before it
  function ctxFor(n, at, pending) {
    const drafts = {};
    Object.entries(conv.drafts).forEach(([id, d]) => { if (d.after != null && d.after <= n) drafts[id] = d; });
    // a reminder sent from the client's page before this question counts as decided too
    Object.entries(reminded()).forEach(([code, r]) => {
      const a = r.after && r.after[meKey];
      const j = ALL.find((x) => x.code === code);
      if (j && r.from === 'page' && (a != null ? a <= n : r.t <= at) && !Object.values(drafts).some((d) => d.key === `remind:${code}` && d.state === 'approved')) drafts[`page:${code}`] = { type: 'remind', key: `remind:${code}`, code, state: 'approved', when: 'now', at: r.t, by: r.by, from: 'page', title: remindTitle(j, 'now') };
    });
    // asked: the questions so far, this one included, so 'Ask next' never offers the question just asked
    return { now: at, viewer: meKey, drafts, pending: pending || null, asked: conv.asked.slice(0, n + 1).map((x) => norm(x.q)) };
  }
  function run(n) {
    const item = conv.asked[n], ctx = ctxFor(n, item.at, item.pending);
    return Object.assign(ask(item.q, ctx), { at: item.at, ctx });
  }

  // ---------- the page ----------
  const thread = $('[data-thread]'), form = $('[data-ask]'), field = $('#aw-q'), go = $('.aw-go', form), err = $('#aw-err');
  const live_ = $('[data-live]');
  let lastPending = null;
  const say = (t) => { live_.textContent = ''; setTimeout(() => { live_.textContent = t; }, 50); };
  function renderOpening() {
    const ctx = ctxFor(0, conv.startedAt), a = Object.assign(opening(conv.startedAt, ctx), { at: conv.startedAt, ctx });
    return `<li class="aw-x aw-open"><article aria-labelledby="aw-q-o"><h2 class="sr" id="aw-q-o">${esc(T('Watar’s summary at {time}', { time: V.hm(a.at) }))}</h2><div class="aw-turn aw-a">${answerHtml(a, -1, false)}</div></article></li>`;
  }
  function renderThread() {
    thread.innerHTML = renderOpening() + conv.asked.map(exchangeLi).join('');
    conv.asked.forEach((item, n) => {
      const a = run(n);
      $(`[data-n="${n}"] [data-a]`, thread).innerHTML = answerHtml(a, n, false);
      lastPending = a.pending;
    });
    drawStrips(thread);
    $('[data-new]').hidden = !conv.asked.length;
    renderDrafts();
  }

  // pending: the intent of the clarify turn a choice answers; undefined for typed words, which answer the last one
  async function asking(text, pending) {
    const q = text.trim().replace(/\s+/g, ' '), typed = pending === undefined;
    if (!q) { err.innerHTML = `<span>${esc(T('Write a question first, or pick one above.'))}</span>`; err.hidden = false; field.setAttribute('aria-invalid', 'true'); field.focus(); return; }
    err.hidden = true; field.removeAttribute('aria-invalid');
    const n = conv.asked.length, at = now(), pend = typed ? lastPending : pending;
    conv.asked.push({ q, at, pending: pend || null });
    // words still in the field stay there when a row is pressed
    if (typed) { field.value = ''; conv.text = ''; grow(); }
    save();
    thread.insertAdjacentHTML('beforeend', exchangeLi(conv.asked[n], n));
    const li = thread.lastElementChild, slot = $('[data-a]', li);
    slot.innerHTML = `${watarMark}<p class="aw-meta"><b>${esc(T('Watar'))}</b> · <time>${V.hm(at)}</time></p><div class="aw-parts"><p class="aw-lead aw-reading">${esc(T('Reading Sufra’s line…'))}</p></div>`;
    $('[data-new]').hidden = false;
    $('h2', li).scrollIntoView({ block: 'start', behavior: reduce() ? 'auto' : 'smooth' });
    // for one beat Watar's mark ticks while the line is read; the composer waits with it
    field.readOnly = true; go.disabled = true;
    $('.aw-w', slot).classList.add('running');
    await Beats.wait(M.beat);
    const a = run(n);
    const before = Object.values(conv.drafts).filter((d) => d.state === 'pending').length;
    slot.innerHTML = answerHtml(a, n, true);
    save();
    lastPending = a.pending;
    // a draft this answer replaced says so where it stands
    $$('[data-d]', thread).forEach((el) => { const d = draftOf(el.dataset.d); if (d && d.state === 'replaced' && !el.classList.contains('gone')) el.outerHTML = draftHtml(el.dataset.d); });
    drawStrips(slot);
    // the question heads the view once its answer is long enough to let it
    if (Math.abs($('h2', li).getBoundingClientRect().top) > 40) $('h2', li).scrollIntoView({ block: 'start', behavior: reduce() ? 'auto' : 'smooth' });
    Beats.enter($('.aw-parts', slot));
    field.readOnly = false; go.disabled = false;
    const made = Object.values(conv.drafts).filter((d) => d.state === 'pending').length - before;
    say(`${T('Watar: {lead}', { lead: a.lead })}${made > 0 ? ` ${P(made, '{n} draft waits for your approval.', '{n} drafts wait for your approval.')}` : ''}`);
    renderDrafts();
  }

  // ---------- deciding a draft ----------
  function rerender(id) {
    const el = $(`[data-d="${CSS.escape(id)}"]`, thread);
    if (el) el.outerHTML = draftHtml(id);
    $$('[data-ref]', thread).forEach((r) => { r.outerHTML = refHtml(r.dataset.ref); });
    renderDrafts();
    return $(`[data-d="${CSS.escape(id)}"]`, thread);
  }
  function decide(id, state) {
    Object.assign(conv.drafts[id], { state, at: now(), by: me.name, after: conv.asked.length });
    save();
  }
  function approve(id) {
    decide(id, 'approved');
    const el = rerender(id), d = draftOf(id);
    // a reminder sent now is shown on the client's page too
    if (d.type === 'remind' && d.when === 'now') { try { const all = reminded(); all[d.code] = { from: 'watar', t: d.at, by: d.by }; sessionStorage.setItem('iqaa-reminded', JSON.stringify(all)); } catch (e) { /* storage blocked: this page only */ } }
    // the arch is rewritten as a loop in a quarter beat; a reminder that ran now is written in ink
    Beats.write($('[data-dk]', el), { each: M.quarter, gap: 0 });
    if (d.when === 'now') Beats.write($('.aw-ds', el), { each: M.quarter, gap: 0 });
    $('[data-status]', el).focus();
    say(T('Approved: {title}.', { title: lcT(titleOf(d)) }));
  }
  async function discard(id) {
    const el = $(`[data-d="${CSS.escape(id)}"]`, thread), h0 = el.offsetHeight;
    decide(id, 'discarded');
    $$('button', el).forEach((b) => { b.disabled = true; });
    await Beats.fadeOut(el);
    if (draftOf(id).state !== 'discarded') return;
    const fresh_ = rerender(id);
    Beats.resize(fresh_, h0);
    $('[data-undo-d]', fresh_).focus();
    say(T('Discarded: {title}.', { title: lcT(titleOf(draftOf(id))) }));
  }
  function restore(id) {
    Object.assign(conv.drafts[id], { state: 'pending', at: null, by: null, after: null });
    save();
    const el = rerender(id);
    $('h3', el).focus();
    say(T('{title} waits for you again.', { title: titleOf(draftOf(id)) }));
  }
  function show(id) {
    const el = $(`[data-d="${CSS.escape(id)}"]`, thread);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: reduce() ? 'auto' : 'smooth' });
    ($('h3', el) || $('button, a', el)).focus({ preventScroll: true });
  }

  // ---------- the rail: what waits for you, what was decided here, and what Watar reads ----------
  function renderDrafts() {
    const ds = Object.entries(conv.drafts), pending = ds.filter(([, d]) => d.state === 'pending'), n = pending.length;
    const decidedHere = ds.filter(([, d]) => ['approved', 'sent', 'discarded'].includes(d.state)).sort((a, b) => a[1].at - b[1].at);
    $('[data-n-wait]').textContent = n;
    $('[data-wait]').innerHTML = n ? `<ul class="aw-wl">${pending.map(([id, d]) => `<li><button type="button" class="aw-wr" data-show="${id}">${glyph('held')}<span><b>${esc(titleOf(d))}</b><span${EN ? '' : ' dir="auto"'}>${esc(d.q ? T('Asked in “{q}”', { q: d.q }) : T('From Watar'))}${d.qa ? ` · ${V.hm(d.qa)}` : ''}</span></span></button></li>`).join('')}</ul>`
      : `<p class="aw-none">${icon('Done', 16)}<span>${esc(T('Nothing Watar drafted waits for you.'))}</span></p>`;
    $('[data-decided]').innerHTML = decidedHere.map(([, d]) => `<li class="${d.state}">${d.state === 'discarded' ? icon('Discard', 16) : glyph(d.state === 'approved' ? 'struck' : 'held')}<span><b>${esc(T({ approved: 'Approved', sent: 'Sent to the Line screen', discarded: 'Discarded' }[d.state]))}</b>: ${esc(titleOf(d))} · <time>${V.hm(d.at)}</time></span></li>`).join('');
    $('[data-decided-h]').hidden = !decidedHere.length;
    // the person's count everywhere: the sidebar, the phone's dot
    const words = P(n, 'draft waits for you', 'drafts wait for you');
    const nW = $('[data-n-watar]'), dot = $('[data-n-watar-dot]');
    if (nW) nW.innerHTML = n ? `${n}<span class="sr"> ${esc(words)}</span>` : '';
    if (dot) { dot.hidden = !n; dot.firstElementChild.textContent = n ? `${n} ${words}` : ''; }
    updateStrip();
  }
  // narrow screens: the drafts waiting show in the composer while none is in view
  const inView = new Set();
  const seer = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting) inView.add(e.target.dataset.d); else inView.delete(e.target.dataset.d); }); updateStrip(); });
  function updateStrip() {
    const pending = Object.entries(conv.drafts).filter(([, d]) => d.state === 'pending');
    $$('[data-d]', thread).forEach((el) => seer.observe(el));
    const strip = $('[data-strip]'), n = pending.length;
    strip.hidden = !n || pending.some(([id]) => inView.has(id));
    if (n) strip.innerHTML = `${glyph('held')}<span>${esc(P(n, '{n} draft waits for you', '{n} drafts wait for you'))}</span><button type="button" class="link" data-show="${pending[0][0]}" aria-label="${esc(T('Show the draft: {title}', { title: lcT(titleOf(pending[0][1])) }))}">${esc(T('Show'))}</button>`;
  }
  function renderReads() {
    const sig = `<a class="aw-sig" href="line.html" aria-label="${esc(T('Sufra’s line, version {v}. Open the line.', { v: S.version }))}"><span data-sig></span></a><p class="aw-sigc">${esc(T('Sufra’s line · version {v}', { v: S.version }))}</p>`;
    const fin = S.jobs.filter((j) => j.finished).length;
    const html = `${sig}<ul class="aw-rd"><li>${icon('Orders', 16)}<span>${esc(T('{orders} on the line · {fin} finished in the last 7 days', { orders: P(live.length, '{n} orders', '{n} orders'), fin }))}</span></li>
<li>${icon('People', 16)}<span>${esc(T('{people} · {steps} done today', { people: P(people.length, '{n} people', '{n} people'), steps: P(S.done.length, '{n} steps', '{n} steps') }))}</span></li>
<li>${icon('Date', 16)}<span>${T('As of {time}', { time: `<time data-asof>${V.hm(now())}</time>` })}</span></li></ul>
<p class="aw-rn">${esc(T('Watar doesn’t see prices, messages or stock. Nothing it drafts goes out until a person approves it.'))}</p>
<p class="aw-rn">${esc(T('In this prototype, Watar answers by fixed rules from Sufra’s demo data, in your browser.'))}</p>`;
    $$('[data-reads]').forEach((el) => {
      el.innerHTML = html;
      Beats.sig($('[data-sig]', el), line.stations.map((s) => ({ name: s.name, steps: s.steps.map((x) => x.kind) })), { k: 0.5, names: false });
      $('[data-sig]', el).removeAttribute('role'); $('[data-sig]', el).removeAttribute('aria-label');
    });
  }

  // ---------- the composer ----------
  // the field grows from one line to four, then scrolls
  function grow() { field.style.height = 'auto'; field.style.height = `${Math.min(field.scrollHeight, 126)}px`; }
  form.addEventListener('submit', (e) => { e.preventDefault(); field.focus(); if (!field.readOnly) asking(field.value); });
  field.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!field.readOnly) asking(field.value); }
    if (e.key === 'ArrowUp' && !field.value && conv.asked.length) { e.preventDefault(); field.value = conv.asked[conv.asked.length - 1].q; grow(); }
    if (e.key === 'Escape' && field.value) { e.preventDefault(); field.value = ''; conv.text = ''; save(); grow(); }
  });
  field.addEventListener('input', () => { err.hidden = true; field.removeAttribute('aria-invalid'); conv.text = field.value; save(); grow(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || field.disabled) return;
    const a = document.activeElement;
    if (a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) return;
    e.preventDefault(); field.focus();
  });

  // ---------- presses ----------
  let undoNote = null, noteTimer = 0;
  function note(text, snapshot) {
    const el = $('[data-note]');
    $('[data-note-t]').textContent = text;
    undoNote = snapshot;
    $('[data-undo]', el).hidden = !snapshot;
    el.hidden = false;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => { el.hidden = true; undoNote = null; }, 8000);
  }
  function fresh() {
    const snap = JSON.stringify(conv);
    let n = 0;
    Object.values(conv.drafts).forEach((d) => {
      if (d.state === 'pending') { Object.assign(d, { state: 'discarded', at: now(), by: me.name }); n++; }
      // what was decided stays decided, before the new conversation
      d.after = 0; d.made = -1;
    });
    Object.assign(conv, { asked: [], startedAt: now(), round: (conv.round || 0) + 1 });
    save();
    lastPending = null;
    renderThread();
    note(`${T('Conversation cleared.')}${n ? ` ${P(n, '{n} draft discarded with it.', '{n} drafts discarded with it.')}` : ''}`, snap);
    field.focus();
  }
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button, a[data-show]');
    if (!b || b.disabled) return;
    const d = b.dataset;
    // focus moves to the composer, except on a touch screen, where it would raise the keyboard over the answer
    if (d.q != null) { asking(d.q, d.pending != null ? d.pending : null); if (matchMedia('(pointer: fine)').matches) field.focus({ preventScroll: true }); }
    else if (d.approve) approve(d.approve);
    else if (d.discard) discard(d.discard);
    else if (d.undoD) restore(d.undoD);
    else if (d.takeback) restore(d.takeback);
    else if (d.show) show(d.show);
    // the field is set to the same reminder with its time left to type: 'Remind Omar at '
    else if (d.retime) { const x = draftOf(d.retime), j = ALL.find((o) => o.code === x.code); field.value = `${T('Remind {C} at', k('C', j ? Cn(j) : ''))} `; grow(); field.focus(); }
    else if (d.handoff) { const x = draftOf(d.handoff); decide(d.handoff, 'sent'); location.href = `line.html?wait=${x.st}:${encodeURIComponent(x.len)}`; }
    else if (b.hasAttribute('data-new')) fresh();
    else if (b.hasAttribute('data-undo') && undoNote) {
      conv = JSON.parse(undoNote); save(); renderThread();
      $('[data-note]').hidden = true; undoNote = null; field.focus();
      say(T('The conversation is back.'));
    }
  });

  // ---------- start ----------
  // a reminder Watar drafted that went out from the client's page meanwhile is not offered again
  const sentEarly = reminded();
  Object.values(conv ? conv.drafts : {}).forEach((d) => { const r = d.type === 'remind' && d.when === 'now' && d.state === 'pending' && sentEarly[d.code] && sentEarly[d.code].from === 'page' && sentEarly[d.code]; if (r) Object.assign(d, { state: 'elsewhere', at: r.t, by: r.by, after: r.after && r.after[meKey] != null ? r.after[meKey] : conv.asked.length }); });
  if (conv) save();
  // the frame names the person in the page's language and keeps the data's name for itself (data-who)
  $$('[data-me-name]').forEach((el) => { el.textContent = T(me.name); el.dataset.who = me.name; });
  $$('[data-me-role]').forEach((el) => { el.textContent = me.access === 'owner' ? T('Owner') : T(me.role); });
  $$('[data-me-av]').forEach((el) => { el.textContent = T(me.name).charAt(0); });
  $('[data-now]').textContent = V.hm(now());
  setInterval(() => { $('[data-now]').textContent = V.hm(now()); $$('[data-asof]').forEach((el) => { el.textContent = V.hm(now()); }); }, 6e4);
  if (own) {
    // an organization made at sign-up has no orders yet: Watar has nothing to read
    $$('[data-org-name]').forEach((el) => { el.textContent = own.name; });
    document.title = `${T('Ask Watar')} · ${own.name}`;
    thread.innerHTML = `<li class="aw-x aw-open"><article aria-label="${esc(T('Watar'))}"><div class="aw-turn aw-a">${watarMark}<p class="aw-meta"><b>${esc(T('Watar'))}</b></p><div class="aw-parts"><p class="aw-lead">${esc(T('Watar reads {name}’s orders once your team adds one. Until then, try your line with a test job.', k('name', own.name)))}</p><p class="aw-links"><a class="btn" href="line.html">${icon('Line')}<span>${esc(T('Open the line'))}</span></a></p></div></div></article></li>`;
    $$('.aw-rail, [data-reads-d]').forEach((el) => { el.hidden = true; });
    return;
  }
  if (meKey !== 'hala') $$('.ap-l[href="watar.html"], .ap-ask').forEach((a) => { a.href = `watar.html?as=${meKey}`; });
  renderReads();
  renderThread();
  field.disabled = false; go.disabled = false;
  if (conv.text) { field.value = conv.text; grow(); }
  // a question in the address is asked once; the address then forgets it, so a reload never asks twice
  const q = params.get('q');
  if (q) {
    params.delete('q');
    history.replaceState(null, '', `${location.pathname}${params.toString() ? `?${params}` : ''}${location.hash}`);
    asking(q, null);
  } else if (conv.asked.length) {
    const last = $(`[data-n="${conv.asked.length - 1}"] h2`, thread);
    if (last) last.scrollIntoView({ block: 'start' });
  }
})();
