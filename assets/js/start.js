// Start, outside the app: the organization writes its name and its idea, or starts from a template; Watar asks at most
// three questions, chosen by what the idea is about, each of them skippable; then it builds the line in four steps
// that are the same for everyone and are shown before they run. Watar never publishes: what it builds waits as a
// draft, and the review of it (built.html) comes next.
//
// What Watar builds is this prototype's one fixture of "what Watar would build from this idea": from a media idea,
// Al-Khatt Media's content production line, from a software idea, Masar's feature line, both read from world.js, so
// the review and every other screen show the same line. The answers are asked and summed up; they do not change it.
(function () {
  const root = document.querySelector('main.st');
  if (!root || !window.WORLD || !window.FLOW || !window.CHECK) return;
  const W = window.WORLD, T = window.T, N = window.I18N.n, esc = FLOW.esc;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const M = window.IQAA.motion;
  // the steps keep their pace with reduced motion too: the pace is what the person reads, not an animation
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- what an idea is about: the words that tell it, in the three languages ----------
  // a word in Latin letters counts at the start of a word ('app' is not in 'approve'); an Arabic one anywhere in a
  // word, which may carry the article or a conjunction before it
  const SECTORS = {
    media: {
      org: 'alkhatt', label: 'a media house', name: 'Al-Khatt Media',
      idea: 'A media house that makes videos, designs and articles. We have writers, video editors, designers, a publishing team and a manager who follows performance.',
      words: ['media', 'video', 'film', 'montage', 'editor', 'article', 'design', 'publish', 'journalis', 'news', 'podcast', 'reel',
        'إعلام', 'فيديو', 'مونت', 'مقال', 'تصميم', 'مصمم', 'نشر', 'صحاف', 'أخبار', 'medya', 'haber', 'makale', 'tasarım', 'yayın', 'kurgu'],
      ask: ['team', 'clients', 'pages'],
    },
    software: {
      org: 'masar', label: 'a software company', name: 'Masar',
      idea: 'A software company that builds apps for its clients. We have product analysts, a designer, backend and frontend developers, a tech lead and a tester.',
      words: ['software', 'app', 'developer', 'code', 'coding', 'program', 'tester', 'release', 'backend', 'frontend', 'saas',
        'برمج', 'تطبيق', 'مطور', 'كود', 'اختبار', 'yazılım', 'uygulama', 'geliştirici', 'kod', 'test'],
      ask: ['team', 'testers', 'requirements'],
    },
  };
  const latin = /^[a-zçğıöşü]/i;
  const match = (w) => (latin.test(w) ? new RegExp(`(^|[^\\p{L}])${w}`, 'iu') : { test: (s) => s.includes(w) });
  Object.values(SECTORS).forEach((S) => { S.re = S.words.map(match); });
  // the sector with the most of its words in the idea; none when no word tells
  function read(text) {
    let best = null, top = 0;
    Object.keys(SECTORS).forEach((k) => {
      const n = SECTORS[k].re.filter((r) => r.test(text)).length;
      if (n > top) { best = k; top = n; }
    });
    return best;
  }

  // ---------- Watar's questions: the team's size for everyone, and two the idea decides ----------
  const QUESTIONS = {
    team: { q: 'About how many people are on the team?', short: 'Team', a: ['Under 10', '10 to 30', 'Over 30'] },
    clients: { q: 'Do your clients approve a piece before it is published?', short: 'Client approval', a: ['Yes', 'Sometimes', 'No'] },
    pages: { q: 'How many pages do you publish on?', short: 'Pages', a: ['1 to 3', '4 to 10', 'More than 10'] },
    testers: { q: 'Do you have a testing team?', short: 'Testing team', a: ['Yes', 'No, developers test'] },
    requirements: { q: 'Does a client approve the requirements before development?', short: 'Requirements approval', a: ['Yes', 'Sometimes', 'No'] },
  };
  const answers = {};
  let sector = null;
  const asked = () => (sector ? SECTORS[sector].ask : ['team']);
  function questions() {
    $('[data-questions]').innerHTML = asked().map((id) => {
      const Q = QUESTIONS[id], a = answers[id];
      if (a === 'skip') {
        return `<div class="st-q is-skipped" data-q="${id}"><p class="st-qt">${esc(T(Q.q))}</p>
<p class="st-skipped"><span>${esc(T('Skipped: Watar assumes what is usual.'))}</span><button type="button" class="link" data-unskip="${id}">${esc(T('Answer it'))}</button></p></div>`;
      }
      return `<fieldset class="st-q" data-q="${id}"><legend class="st-qt">${esc(T(Q.q))}</legend>
<div class="st-seg">${Q.a.map((x, i) => `<label><input type="radio" name="q-${id}" value="${i}"${a === i ? ' checked' : ''}><span>${esc(T(x))}</span></label>`).join('')}</div>
<button type="button" class="link st-skip" data-skip="${id}">${esc(T('Skip'))}</button></fieldset>`;
    }).join('');
  }

  // ---------- the templates the packs bring: those this prototype builds, and the rest said to be coming ----------
  const org = $('[data-org]'), idea = $('[data-idea]');
  let named = T(SECTORS.media.name), chosen = null;
  $$('[data-tpl]').forEach((b) => {
    if (SECTORS[b.dataset.tpl]) return;
    const t = b.querySelector('.st-tpl-t');
    b.setAttribute('aria-disabled', 'true');
    b.title = T('{name}: coming next', { name: t.textContent });
    t.insertAdjacentHTML('beforeend', `<em>${esc(T('Soon'))}</em>`);
  });
  function pick(key) {
    const S = SECTORS[key];
    idea.value = T(S.idea);
    // the example's name too, unless the person wrote their own
    if (!org.value.trim() || org.value.trim() === named) { named = T(S.name); org.value = named; }
    chosen = key;
    reread();
  }
  function reread() {
    if (chosen && idea.value !== T(SECTORS[chosen].idea)) chosen = null;
    $$('[data-tpl]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tpl === chosen)));
    const was = sector;
    sector = read(idea.value);
    if (sector !== was) {
      questions();
      if (was !== undefined) $('[data-q-live]').textContent = T('Watar’s questions changed with your idea.');
    }
  }

  // ---------- the four steps, the same for everyone ----------
  const STEPS = [
    { todo: 'Understand the organization and its idea', done: 'Understood the organization and its idea' },
    { todo: 'Build the departments, the blocks and the fields', done: 'Built {departments}, {blocks} and {fields}' },
    { todo: 'Check that the line works', done: 'Checked that the line works', note: 'Every block can be reached, and every approval has a way back.' },
    { todo: 'Arrange the canvas, as a draft', done: 'Arranged the canvas, as a draft', note: 'Nothing is live until you publish it.' },
  ];
  const WORD = { todo: 'Next', now: 'Now', done: 'Done' };
  function steps() {
    $('[data-steps]').innerHTML = STEPS.map((s, i) => `<li class="st-s" data-step="${i}" data-state="todo">${Beats.beat('run', { draft: true })}
<span class="st-st"><span class="st-sw" data-word>${esc(T(WORD.todo))}</span><b data-title>${esc(T(s.todo))}</b><span class="st-sd" data-detail>${s.note ? esc(T(s.note)) : ''}</span></span></li>`).join('');
    // each step is a draft until it is done (Beats.set writes it in ink then)
    $$('[data-steps] .b').forEach((b) => { b.dataset.draft = '1'; });
  }
  function stepTo(i, state, title, detail) {
    const li = $(`[data-step="${i}"]`), b = $('.b', li);
    li.dataset.state = state;
    $('[data-word]', li).textContent = T(WORD[state]);
    if (title) $('[data-title]', li).textContent = title;
    if (detail != null) $('[data-detail]', li).textContent = detail;
    Beats.running(b, state === 'now');
    // done: the pen writes the step in ink
    if (state === 'done') Beats.set(b, 'run', { draft: false });
  }

  // ---------- building ----------
  function fail(id, msg) {
    const f = $(`[data-field="${id}"]`), e = $(`#${id}-err`), el = $(`#${id}`);
    f.classList.add('bad');
    el.setAttribute('aria-invalid', 'true');
    e.textContent = msg;
    e.hidden = false;
    return el;
  }
  function clear(id) {
    $(`[data-field="${id}"]`).classList.remove('bad');
    $(`#${id}`).removeAttribute('aria-invalid');
    $(`#${id}-err`).hidden = true;
  }
  let busy = false;
  async function build() {
    if (busy) return;
    clear('org');
    clear('idea');
    const name = org.value.trim(), text = idea.value.trim();
    let first = null;
    if (!name) first = fail('org', T('Write your organization’s name.'));
    if (!text) first = first || fail('idea', T('Write your idea in a sentence or two.'));
    else if (!read(text)) first = first || fail('idea', T('Watar cannot tell yet what you make. Say what you make and who works on it.'));
    if (first) { first.focus(); return; }

    busy = true;
    const S = SECTORS[read(text)], O = W.orgs[S.org], line = O.lines[0];
    const btn = $('[data-build]');
    $('[data-fs]').disabled = true;
    btn.disabled = true;
    btn.textContent = T('Watar is building…');
    const live = $('[data-live]'), say = (s) => { live.textContent = s; };
    const panel = $('.st-steps');
    if (panel.getBoundingClientRect().top > innerHeight - 120) panel.scrollIntoView({ behavior: Beats.reduce() ? 'auto' : 'smooth', block: 'start' });

    // 1: what Watar understood: the organization, its kind of work, and the answers it was given
    const said = asked().map((id) => {
      const a = answers[id];
      return a === undefined || a === 'skip' ? null : `${T(QUESTIONS[id].short)}: ${T(QUESTIONS[id].a[a])}`;
    }).filter(Boolean);
    const skipped = asked().filter((id) => answers[id] === undefined || answers[id] === 'skip').length;
    const understood = [`${name}${T(', ')}${T(S.label)}`].concat(said, skipped ? [N(skipped, '{n} question left to Watar', '{n} questions left to Watar')] : []).join(' · ');
    stepTo(0, 'now');
    await pause(M.beat * 1.5);
    stepTo(0, 'done', T(STEPS[0].done), understood);
    say(T(STEPS[0].done));

    // 2: the departments, blocks and fields of the line it builds
    stepTo(1, 'now');
    await pause(M.beat * 2);
    const counts = {
      departments: N(O.departments.length, '{n} department', '{n} departments'),
      blocks: N(line.blocks.length, '{n} block', '{n} blocks'),
      fields: N(Object.keys(O.fields).length, '{n} field', '{n} fields'),
    };
    stepTo(1, 'done', T(STEPS[1].done, counts), window.CHECK.list(O.departments.map((d) => T(d.name))));
    say(T(STEPS[1].done, counts));

    // 3: the check every line passes before anyone works on it
    stepTo(2, 'now');
    await pause(M.beat * 2);
    const found = window.CHECK.rows(window.CHECK.line(line.blocks));
    stepTo(2, 'done', null, found.map((x) => x.text).join(' '));
    say(T(STEPS[2].done));

    // 4: the canvas, as a draft; Watar stops here
    stepTo(3, 'now');
    await pause(M.beat);
    stepTo(3, 'done', T(STEPS[3].done), T('Waiting for your review on {org}’s canvas.', { org: name }));
    const go = $('[data-review]');
    go.href = `built.html?org=${S.org}`;
    $('[data-ready]').hidden = false;
    btn.textContent = T('Built, as a draft');
    say(T('Your line is ready on the canvas, as a draft. Opening the review.'));
    FLOW.store.set('iqaa-org-id', S.org);
    await pause(M.beat * 2);
    location.href = go.href;
  }

  // ---------- events ----------
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.getAttribute('aria-disabled') === 'true') return;
    if (b.dataset.tpl) {
      pick(b.dataset.tpl);
      clear('idea');
    } else if (b.dataset.skip) {
      answers[b.dataset.skip] = 'skip';
      questions();
      $(`[data-unskip="${b.dataset.skip}"]`).focus();
    } else if (b.dataset.unskip) {
      delete answers[b.dataset.unskip];
      questions();
      $(`[data-q="${b.dataset.unskip}"] input`).focus();
    }
  });
  root.addEventListener('change', (e) => {
    const m = e.target.name && e.target.name.match(/^q-(\w+)$/);
    if (m) answers[m[1]] = +e.target.value;
  });
  let typing = 0;
  idea.addEventListener('input', () => {
    clearTimeout(typing);
    typing = setTimeout(reread, 300);
  });
  org.addEventListener('input', () => clear('org'));
  idea.addEventListener('input', () => clear('idea'));
  $('[data-form]').addEventListener('submit', (e) => { e.preventDefault(); build(); });

  // the example a person sees first: a media house, as the owner wrote it
  $('[data-watar]').innerHTML = IQ.glyph('held');
  org.value = named;
  idea.value = T(SECTORS.media.idea);
  sector = undefined;
  reread();
  steps();
})();
