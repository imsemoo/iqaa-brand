// The demo world of the digital production family (fictional), from the owner's 22 screens: Al-Khatt Media, a media
// house whose pieces walk the content production line, and Masar, a software company whose tickets walk its feature
// line; and Wamda, a marketing agency whose campaigns walk its campaign line, so the same screens tell an agency's
// story. Each has its departments, its people, its lines and what is on them on Sunday 1 November 2026 at 09:41. Every
// screen of the app reads this; the data is English and the screens show it in the page's language (i18n.js).
//
// The model, from the owner's plan: an organization has departments and teams; it runs lines; a line is blocks, each
// with its department, its kind, its roles and the people in each role, and what each role sees; an item walks the
// line. What an item is called belongs to the organization (a piece, a ticket); no word of a sector is in the core.
(function () {
  // A block's kind and the stroke it writes in the line's signature: a person's work is a loop, an approval waits for
  // a person as an arch, an automatic block runs straight, a timed wait lifts the pen.
  const STROKE = { work: 'struck', approval: 'held', auto: 'run', wait: 'rest' };

  // ---------- Al-Khatt Media ----------
  const alkhatt = {
    id: 'alkhatt', name: 'Al-Khatt Media', address: 'alkhatt.iqaa.co', pack: 'Media and production',
    // the initial its mark signs, in each language's own letters
    mark: { en: 'K', ar: 'خ', tr: 'K' },
    // the organization's word for what walks its line, and the code its items carry
    noun: 'piece', prefix: 'MAD',
    departments: [
      { id: 'content', name: 'Content' }, { id: 'production', name: 'Production' },
      { id: 'publishing', name: 'Publishing' }, { id: 'management', name: 'Management' },
    ],
    // `title` is free text and gives no permission; what a person may do comes from their role in each block.
    // type: staff, freelancer (until a date) or invited; hours: what they give a week
    people: {
      khaled: { name: 'Khaled Mansour', title: 'Managing director', dept: 'management', type: 'staff', hours: 40, owner: true },
      omar: { name: 'Omar Saada', title: 'Head of montage', dept: 'production', type: 'staff', hours: 35, skills: ['Motion', 'Colour'] },
      heba: { name: 'Heba Darwish', title: 'Senior video editor', dept: 'production', type: 'staff', hours: 35, skills: ['Documentary'] },
      laith: { name: 'Laith Hamdan', title: 'Video editor', dept: 'production', type: 'staff', hours: 35, skills: ['Reels', 'Motion'] },
      dana: { name: 'Dana Fares', title: 'Video editor', dept: 'production', type: 'freelancer', until: '2026-11-30', hours: 15, skills: ['Reels'] },
      yazan: { name: 'Yazan Issa', title: 'Video editor', dept: 'production', type: 'invited', hours: 35 },
      sara: { name: 'Sara Khalil', title: 'Writer', dept: 'content', type: 'staff', hours: 35 },
      ahmad: { name: 'Ahmad Odeh', title: 'Head of writing', dept: 'content', type: 'staff', hours: 35 },
      maryam: { name: 'Maryam Haddad', title: 'Editor-in-chief', dept: 'content', type: 'staff', hours: 35 },
      rawan: { name: 'Rawan Saleh', title: 'Head of design', dept: 'production', type: 'staff', hours: 35 },
      yousef: { name: 'Yousef Amer', title: 'Designer', dept: 'production', type: 'staff', hours: 35 },
      noor: { name: 'Noor Jaber', title: 'Publishing lead', dept: 'publishing', type: 'staff', hours: 35 },
    },
    // what an item carries; `secret` is hidden from everyone until a role is given it, and never reaches the browser of
    // someone who may not see it (the demo hides it on the page, as the server would leave it out)
    fields: {
      script: { name: 'Script', type: 'text' },
      video: { name: 'Video file', type: 'file' },
      design: { name: 'Design file', type: 'file' },
      pages: { name: 'Pages', type: 'choice' },
      budget: { name: 'Budget', type: 'money', secret: true },
      length: { name: 'Video length', type: 'duration' },
      brand: { name: 'Brand', type: 'choice' },
    },
    lines: [{
      id: 'content', name: 'Content production line', version: 4, prefix: 'MAD',
      // the draft of the next version, as the owner left it: each change is a sentence with the data names it names
      // (translated where shown). The canvas draws the draft (what is added in the dashed pen until published); the
      // publish page lists the changes and asks where the items in a removed block go. A block the draft adds is
      // described in full under `adds`.
      draft: {
        changes: [
          { type: 'add', block: 'subtitles', text: 'Added {block} after {after}', vars: { block: 'Subtitles', after: 'Montage' } },
          { type: 'remove', block: 'colour', text: 'Removed {block}', vars: { block: 'Colour grading' } },
          { type: 'field', field: 'subtitles', text: 'Added the field {field}', vars: { field: 'Subtitle file' } },
        ],
        adds: [{ id: 'subtitles', name: 'Subtitles', dept: 'production', kind: 'work', hours: 3, after: ['montage'],
          roles: [{ role: 'Subtitler', people: ['dana'], sees: 'assigned' }, { role: 'Head of montage', people: ['omar'], sees: 'all', lead: true }] }],
        fields: { subtitles: { name: 'Subtitle file', type: 'file' } },
      },
      // in order; `after` is the block or blocks an item comes from (Montage and Design run side by side after the
      // editorial review and meet again at the management review); `back`: where a return sends the item
      blocks: [
        { id: 'idea', name: 'Idea', dept: 'content', kind: 'work', hours: 24,
          roles: [{ role: 'Writer', people: ['sara', 'ahmad'], sees: 'assigned', claim: true }] },
        { id: 'script', name: 'Script writing', dept: 'content', kind: 'work', hours: 12, after: ['idea'],
          roles: [{ role: 'Writer', people: ['sara'], sees: 'assigned' }, { role: 'Head of writing', people: ['ahmad'], sees: 'all', lead: true }] },
        { id: 'edreview', name: 'Editorial review', dept: 'content', kind: 'approval', hours: 4, after: ['script'], back: 'script',
          roles: [{ role: 'Reviewer', people: ['maryam', 'ahmad'], sees: 'all' }] },
        { id: 'montage', name: 'Montage', dept: 'production', kind: 'work', hours: 24, after: ['edreview'], approve: 'Head of montage',
          roles: [{ role: 'Video editor', people: ['heba', 'laith', 'dana'], sees: 'assigned', claim: true, fields: { script: 'read', video: 'write', length: 'read', brand: 'read' } },
            { role: 'Head of montage', people: ['omar'], sees: 'all', lead: true, fields: { script: 'read', video: 'write', length: 'write', brand: 'read', budget: 'read', pages: 'read' } }] },
        { id: 'design', name: 'Design', dept: 'production', kind: 'work', hours: 16, after: ['edreview'], side: true,
          roles: [{ role: 'Designer', people: ['yousef'], sees: 'assigned' }, { role: 'Head of design', people: ['rawan'], sees: 'all', lead: true }] },
        { id: 'colour', name: 'Colour grading', dept: 'production', kind: 'work', hours: 4, after: ['montage'],
          roles: [{ role: 'Colourist', people: ['laith'], sees: 'assigned' }, { role: 'Head of montage', people: ['omar'], sees: 'all', lead: true }] },
        { id: 'mgmtreview', name: 'Management review', dept: 'management', kind: 'approval', hours: 4, after: ['colour', 'design'], back: 'montage',
          roles: [{ role: 'Reviewer', people: ['khaled', 'omar'], sees: 'all' }] },
        { id: 'publish', name: 'Publishing', dept: 'publishing', kind: 'work', hours: 2, after: ['mgmtreview'], pack: true,
          roles: [{ role: 'Publisher', people: ['noor'], sees: 'assigned' }] },
      ],
    }],
    // the other lines Home counts: the quick news line (automation, built later) and client requests
    others: [{ id: 'news', name: 'Quick news line', live: 9 }, { id: 'requests', name: 'Client requests', live: 6 }],
    // published this week on the pages the media pack follows; the pack's own numbers for Home
    packStats: { published: 31, pages: 9, risk: 1, riskPage: 'Hikaya Stories' },
    // Home's facts that the items do not carry. since: when an item came into the block it is in now, for the items
    // whose log does not reach back to that move (Home reads the log first). invited: when each invitation went out.
    since: {
      'MAD-26-0147': '2026-10-29T15:00', 'MAD-26-0149': '2026-10-30T11:00', 'MAD-26-0138': '2026-10-28T12:00', 'MAD-26-0139': '2026-10-29T09:00',
      'MAD-26-0152': '2026-11-01T08:30', 'MAD-26-0154': '2026-11-01T08:00', 'MAD-26-0150': '2026-11-01T07:50', 'MAD-26-0148': '2026-11-01T08:00',
      'MAD-26-0146': '2026-11-01T08:30', 'MAD-26-0141': '2026-11-01T07:30', 'MAD-26-0140': '2026-11-01T09:00',
    },
    invited: { yazan: '2026-10-27T10:30' },
    // People and departments. invitedAs: the membership an invitation offers (staff, freelancer or client). teams: the
    // teams inside the departments; every member holds the roles the team grants (`grants`, a role in a block), and
    // someone invited to it gets them on joining; the team's lead holds their own. skills: the organization's own list,
    // the one each person's skills are chosen from.
    invitedAs: { yazan: 'staff' },
    teams: [
      { id: 'writing', name: 'Writing team', dept: 'content', lead: 'ahmad', people: ['sara'], grants: [{ block: 'idea', role: 'Writer' }, { block: 'script', role: 'Writer' }] },
      { id: 'montage', name: 'Montage team', dept: 'production', lead: 'omar', people: ['heba', 'laith', 'dana', 'yazan'], grants: [{ block: 'montage', role: 'Video editor' }] },
      { id: 'design', name: 'Design team', dept: 'production', lead: 'rawan', people: ['yousef'], grants: [{ block: 'design', role: 'Designer' }] },
    ],
    skills: ['Motion', 'Colour', 'Documentary', 'Reels', 'Voice-over'],
    // Settings. integrations: what the organization connected, each with its account (an address or handle is shown as
    // written, a name in the page's language) and its state: works, or expired (its permission ran out, since when).
    // identity: the main language. usage: this month against the plan's limits; seats are counted from the people.
    // use (the Integrations screen): what each is used for, as its row says it: a channel, channels, approvals, single
    // sign-on, repositories, the hooks in and out by name; the last event and what waits come from `events`.
    integrations: [
      { id: 'telegram', name: 'Telegram', account: '@hikaya_channel', state: 'works', use: { channel: 'Hikaya' } },
      { id: 'instagram', name: 'Instagram', account: 'Hikaya', state: 'expired', since: '2026-10-31T22:10' },
      { id: 'tiktok', name: 'TikTok', account: '@hikaya', state: 'works' },
      { id: 'wordpress', name: 'WordPress', account: 'hikaya.example', state: 'works' },
      { id: 'webhook', name: 'Webhook', account: 'The internal archive', state: 'works', use: { in: ['The partner’s site', 'The photo desk'], out: ['The internal archive'] } },
      { id: 'slack', name: 'Slack', account: 'alkhatt.slack.com', state: 'works', use: { channels: 5, approvals: true } },
      { id: 'google', name: 'Google', account: 'alkhatt.example', state: 'works', use: { sso: true } },
    ],
    identity: { language: 'ar' },
    usage: { credit: 3240, creditOf: 5000, storage: 62, storageOf: 100, seatsOf: 15 },
    // the line's last 30 days from its log, as Watar reads them on Home: how many items each block passed on, and those
    // sent back, from which block to which and over which field. With less than a month logged, Watar suggests nothing.
    returns: {
      days: 30,
      through: { idea: 151, script: 140, edreview: 139, montage: 92, design: 64, colour: 90, mgmtreview: 130, publish: 128 },
      back: [{ from: 'mgmtreview', to: 'montage', field: 'script', n: 35 }, { from: 'edreview', to: 'script', field: 'script', n: 25 },
        { from: 'mgmtreview', to: 'design', field: 'design', n: 8 }, { from: 'mgmtreview', to: 'montage', field: 'length', n: 6 }],
    },
    // Reports: the same 30 days of the log, beside `returns`. hours: how long each block kept an item on average, from
    // coming in to leaving (a second pass after a return counts again). backTo: the items sent back to each block, each
    // counted once; a return can name more than one field, so the causes in `returns.back` can add up to more (the 6
    // over the video length were among the 35 over the script). Of the items that left the line's last block in those
    // days: journey, their whole way on average, in hours from coming into the line; backOnce, how many came back at
    // least once on the way; onTime, how many kept every due time on the way.
    report: {
      hours: { idea: 20, script: 9, edreview: 3, montage: 41, design: 14, colour: 3, mgmtreview: 2, publish: 1 },
      backTo: { script: 25, montage: 35, design: 8 },
      journey: 101, backOnce: 46, onTime: 104,
    },
    // the media pack's results after delivery, for the same 30 days, from the accounts it publishes to: the people each
    // reached; engagement, interactions for every hundred people reached, of visual pieces and of text posts; and the
    // piece that reached the most people (finished, so it is in the saved archive, not on the line)
    results: {
      reach: { Instagram: 1340000, TikTok: 820000, Telegram: 160000, WordPress: 80000 },
      engagement: { visual: 6.1, text: 2.4 },
      best: { code: 'MAD-26-0118', title: 'The night bakers of Nablus', platform: 'Instagram', reach: 386000, at: '2026-10-14T18:00' },
    },
    // the links the organization sent outside it, each opened without an account: one item at one block, for one
    // client, until a moment (a link can be cancelled). preview: the field the client sees a preview of; show: what the
    // line's owner chose to show besides, a field of the item or a day the line gives, each under the name the client
    // reads. by: who sent it.
    shares: [{
      code: 'MAD-26-0142', block: 'montage', client: 'Nadia Qasem', by: 'omar', sent: '2026-10-31T15:40', until: '2026-11-07T23:59',
      preview: 'video', show: [{ field: 'pages', as: 'Platforms' }, { day: '2026-11-05', as: 'Expected publishing' }],
    }],
    // Automation: the quick news line (Home counts it in `others`), where steps were turned over to the machine one by
    // one on the same line, with the same items and the same log. Each block says how it runs now (`mode`, one of the
    // plan's five), what the machine works with (`tools`), its limits (`cap` a day, `budget` in dollars this month, the
    // lowest `confidence` it may hand over at, below which the work goes to a person) and what it used today (`use`), the
    // named person who accepted it running fully automatically (`accepted`), who takes the work when the machine fails
    // (`fallback`: a team of this line's `teams` or the organization's, or a person), its numbers since it was turned
    // over (`since`, how many times it ran, and of those: accepted (%), duplicates stopped, weak cases that reached a
    // person), and its latest records, newest
    // first: `by` is a person; a record without one was made by Automation, never a person, with its confidence (%) and
    // its cost. `back`: where an approval sends work back. `draft`: version 3 as the owner left it, its changes in
    // world.js's sentence shape. `fields`: what an item carries here, which a source's field map fills.
    newsLine: {
      id: 'news', name: 'Quick news line', version: 2, prefix: 'NEWS',
      fields: { topic: { name: 'Topic', type: 'text' }, source: { name: 'Source link', type: 'link' }, raw: { name: 'Raw material', type: 'text' }, photo: { name: 'Photo', type: 'file' } },
      teams: [{ id: 'editing', name: 'Editing team', people: ['sara', 'ahmad'] }],
      draft: { changes: [{ type: 'mode', block: 'carousel', text: '{block} now runs as {mode}', vars: { block: 'Carousel output', mode: 'Fully automatic' } }] },
      blocks: [
        { id: 'filter', name: 'Filter and stop duplicates', kind: 'auto', mode: 'Fully automatic', note: 'Never reaches publishing', roles: [],
          tools: [{ name: 'Stop duplicates', about: 'The same link or title enters once in 30 days' }, { name: 'Filter by rules', about: 'Adverts and promotions stay out' }],
          limits: { cap: 200, budget: 5, confidence: 90 }, use: { today: 6, spent: 0.01 }, accepted: { by: 'khaled', at: '2026-09-20T10:00' }, fallback: 'editing',
          numbers: { since: '2026-09-20', runs: 363, duplicates: 151, weak: 4 },
          record: [{ at: '2026-11-01T09:20', code: 'NEWS-26-0410', did: 'duplicate', conf: 99, cost: 0.001 }, { at: '2026-11-01T09:02', code: 'NEWS-26-0412', did: 'duplicate', conf: 98, cost: 0.001 },
            { at: '2026-11-01T08:40', code: 'NEWS-26-0413', did: 'in', conf: 96, cost: 0.001 }] },
        { id: 'refine', name: 'Refine the text', kind: 'work', mode: 'Assisted', after: ['filter'],
          roles: [{ role: 'Editor', people: ['sara', 'ahmad'] }],
          tools: [{ name: 'Refine the text', about: 'Rewrites in the house’s voice and keeps the source link; adds no fact the source does not have' }],
          limits: { cap: 50, budget: 40, confidence: 80 }, use: { today: 4, spent: 0.16 }, fallback: 'editing',
          numbers: { since: '2026-09-20', runs: 212, accepted: 74 },
          record: [{ at: '2026-11-01T08:41', code: 'NEWS-26-0413', did: 'draft', conf: 91, cost: 0.04 }, { at: '2026-11-01T08:31', code: 'NEWS-26-0412', by: 'sara', did: 'edited' },
            { at: '2026-11-01T08:06', code: 'NEWS-26-0412', did: 'draft', conf: 88, cost: 0.04 }] },
        { id: 'carousel', name: 'Carousel output', kind: 'auto', mode: 'Automatic with review', note: 'Approved template', after: ['refine'],
          roles: [{ role: 'Head of design', people: ['rawan'] }],
          tools: [{ name: 'Output from a template', about: 'News carousel, version 4, approved by Rawan Saleh' }],
          limits: { cap: 60, budget: 25, confidence: 85 }, use: { today: 3, spent: 0.03 }, accepted: { by: 'khaled', at: '2026-10-31T17:20' }, fallback: 'design',
          numbers: { since: '2026-10-04', runs: 198, accepted: 95 },
          record: [{ at: '2026-11-01T09:12', code: 'NEWS-26-0410', did: 'carousel', conf: 93, cost: 0.01 }, { at: '2026-10-31T20:30', code: 'NEWS-26-0409', by: 'rawan', did: 'approved' },
            { at: '2026-10-31T20:05', code: 'NEWS-26-0409', did: 'carousel', conf: 90, cost: 0.01 }] },
        { id: 'review', name: 'Editorial review', kind: 'approval', mode: 'Manual', after: ['carousel'], back: 'refine',
          roles: [{ role: 'Reviewer', people: ['maryam', 'ahmad'] }],
          record: [{ at: '2026-11-01T08:50', code: 'NEWS-26-0407', by: 'maryam', did: 'approved' }, { at: '2026-11-01T08:30', code: 'NEWS-26-0406', by: 'ahmad', did: 'approved' },
            { at: '2026-11-01T08:10', code: 'NEWS-26-0405', by: 'maryam', did: 'approved' }] },
        { id: 'telegram', name: 'Publish on Telegram', kind: 'auto', mode: 'Automatic with review', after: ['review'], pack: true, integration: 'telegram',
          roles: [{ role: 'Publisher', people: ['noor'] }],
          tools: [{ name: 'Publish to Telegram', about: 'To the channel the organization connected' }],
          limits: { cap: 20, budget: 5, confidence: 85 }, use: { today: 0, spent: 0 }, fallback: 'noor',
          numbers: { since: '2026-10-04', runs: 171, accepted: 92 },
          record: [{ at: '2026-11-01T08:51', code: 'NEWS-26-0407', did: 'post', conf: 94, cost: 0.002 }, { at: '2026-10-31T18:31', code: 'NEWS-26-0404', did: 'published', conf: 96, cost: 0 },
            { at: '2026-10-31T18:30', code: 'NEWS-26-0404', by: 'noor', did: 'approved' }] },
      ],
      // the news on the line now (Home's 9): at, the block it is in; source, the source that opened it (`sources`)
      items: [
        { code: 'NEWS-26-0405', title: 'Olive picking days announced in Burqin', at: ['telegram'], source: 'blog', opened: '2026-10-31T12:20' },
        { code: 'NEWS-26-0406', title: 'A museum of costume opens in Bethlehem', at: ['telegram'], source: 'partner', opened: '2026-10-31T13:05' },
        { code: 'NEWS-26-0407', title: 'Nablus soap makers open their doors on Friday', at: ['telegram'], source: 'partner', opened: '2026-10-31T15:40' },
        { code: 'NEWS-26-0408', title: 'The first rain and the olive harvest', at: ['review'], source: 'blog', opened: '2026-10-31T17:10' },
        { code: 'NEWS-26-0409', title: 'A cookbook of Gaza grandmothers', at: ['review'], source: 'partner', opened: '2026-10-31T19:30' },
        { code: 'NEWS-26-0410', title: 'The za’atar harvest begins in the hills', at: ['carousel'], source: 'blog', opened: '2026-11-01T07:15' },
        { code: 'NEWS-26-0411', title: 'Ten breads of the Levant', at: ['refine'], source: 'blog', opened: '2026-11-01T07:50' },
        { code: 'NEWS-26-0412', title: 'The original musakhan recipe', at: ['refine'], source: 'partner', opened: '2026-11-01T08:05' },
        { code: 'NEWS-26-0413', title: 'The story of an old khan in Nablus', at: ['refine'], source: 'partner', opened: '2026-11-01T08:40' },
      ],
    },
    // Sources: what opens items in a line by itself. type: rss, webhook, telegram, schedule or line (another line);
    // state: works or paused; line: the line it opens items in ('news' is `newsLine`, else one of `lines`) and the block
    // (`at`). map: an incoming field to the item's field, as Watar suggested it and a person approved it (`mapBy`); a
    // pair still `proposed` waits for a person. rule: the entry rule, a sentence with the data names it names. A
    // schedule runs `when` (day of the week, 0 is Sunday; time) and opens the item it names. today:
    // every attempt on Sunday 1 November, even those turned away: item (its code), duplicate (of the item it repeats),
    // turned (why), failed (why).
    sources: [
      { id: 'blog', type: 'rss', name: 'The heritage and food blog', state: 'works', line: 'news', address: 'turath-food.example/feed', every: 15,
        map: [{ from: 'title', to: 'topic' }, { from: 'link', to: 'source' }, { from: 'summary', to: 'raw' }], mapBy: { by: 'khaled', at: '2026-09-20T10:00' },
        today: [{ at: '2026-11-01T07:15', title: 'The za’atar harvest begins in the hills', result: 'item', code: 'NEWS-26-0410' },
          { at: '2026-11-01T07:50', title: 'Ten breads of the Levant', result: 'item', code: 'NEWS-26-0411' },
          { at: '2026-11-01T09:20', title: 'The za’atar harvest begins in the hills', result: 'duplicate', of: 'NEWS-26-0410' }] },
      { id: 'partner', type: 'webhook', name: 'The partner’s site', state: 'works', line: 'news', address: '/hooks/9f2c…', signed: true,
        map: [{ from: 'title', to: 'topic' }, { from: 'link', to: 'source' }, { from: 'text', to: 'raw' }, { from: 'image', to: 'photo', proposed: true }], mapBy: { by: 'khaled', at: '2026-10-28T11:00' },
        rule: { text: 'Contains the tag “{tag}”', vars: { tag: 'heritage' } },
        today: [{ at: '2026-11-01T08:05', title: 'The original musakhan recipe', result: 'item', code: 'NEWS-26-0412' },
          { at: '2026-11-01T08:40', title: 'The story of an old khan in Nablus', result: 'item', code: 'NEWS-26-0413' },
          { at: '2026-11-01T09:02', title: 'The original musakhan recipe', result: 'duplicate', of: 'NEWS-26-0412' },
          { at: '2026-11-01T09:15', title: 'A promotional hotel offer', result: 'turned', why: 'it does not match the entry rule' },
          { at: '2026-11-01T09:30', title: 'Five villages of the Galilee', result: 'failed', why: 'the link does not open' }] },
      { id: 'ideas', type: 'telegram', name: 'The ideas channel', state: 'works', line: 'content', at: 'idea', address: '@khatt_ideas',
        map: [{ from: 'message', to: 'title' }], mapBy: { by: 'khaled', at: '2026-10-12T09:00' },
        rule: { text: 'Sent by someone in {team}', vars: { team: 'Writing team' } },
        today: [{ at: '2026-11-01T08:30', title: 'The bakeries that never close', result: 'item', code: 'MAD-26-0159' },
          { at: '2026-11-01T09:05', title: 'A photo with no words', result: 'turned', why: 'it has no text to start from' }] },
      { id: 'sunday', type: 'schedule', name: 'Every Sunday at 09:00', state: 'paused', line: 'news', when: { day: 0, time: '09:00' }, opens: 'The week in heritage',
        paused: { by: 'khaled', at: '2026-10-29T16:00' }, today: [] },
      { id: 'requests', type: 'line', name: 'Client requests', state: 'works', line: 'content', at: 'idea',
        map: [{ from: 'brief', to: 'script' }, { from: 'budget', to: 'budget' }], mapBy: { by: 'khaled', at: '2026-10-12T09:00' },
        rule: { text: 'Accepted requests only' }, today: [] },
    ],
    // Templates: what a line makes its outputs from. A template is a structured description, not code: its slots, each
    // with its kind and its rule, drawn in a brand's identity (`brands`: the brand's mark in each language's letters);
    // Watar writes no code that runs on a server. made: built with Watar, or uploaded; by: who made it. versions, newest
    // first: an approved version never changes, and any edit is a new version; nothing is made from a draft (the
    // database refuses output from one). outputs: what was made from a version, each keeping that version and its values
    // so it can be made again. sample: a real item's values (its code, the line it is on), for the preview.
    brands: { Hikaya: { en: 'Hikaya', ar: 'حكايا', tr: 'Hikaya' } },
    templates: [
      { id: 'carousel', name: 'News carousel', kind: 'carousel', slides: 6, size: '1080×1350', made: 'watar', brand: 'Hikaya',
        slots: [
          { name: 'Headline', kind: 'Text', rule: 'Up to 60 characters, on two lines at most' },
          { name: 'Image', kind: 'Image', rule: 'The item’s photo, cut to fit' },
          { name: 'Text of each slide', kind: 'Text', rule: 'Five slides, up to 140 characters each' },
          { name: 'Source', kind: 'Text', rule: 'Where the news came from, on the last slide' },
          { name: 'Logo', kind: 'Identity', rule: 'From the identity; nobody fills it' },
        ],
        versions: [
          { v: 5, state: 'draft', by: 'rawan', at: '2026-11-01T08:50', change: 'The source moves to the last slide, and the title may take two lines.' },
          { v: 4, state: 'approved', by: 'rawan', at: '2026-10-03T16:00', approved: { by: 'rawan', at: '2026-10-04T10:30' }, outputs: 198 },
          { v: 3, state: 'approved', by: 'rawan', at: '2026-09-24T12:00', approved: { by: 'khaled', at: '2026-09-27T12:00' }, outputs: 46 },
          { v: 2, state: 'approved', by: 'noor', at: '2026-09-16T10:00', approved: { by: 'khaled', at: '2026-09-18T09:30' }, outputs: 21 },
          { v: 1, state: 'approved', by: 'noor', at: '2026-09-10T11:00', approved: { by: 'khaled', at: '2026-09-12T15:00' }, outputs: 9 },
        ],
        sample: { code: 'NEWS-26-0412', line: 'news', title: 'The original musakhan recipe', photo: null, source: 'The partner’s site',
          texts: ['Musakhan is the dish of the olive harvest: the new oil goes into it first.', 'Taboon bread, baked thin on hot stones, is the bed of the dish.',
            'A kilo of onions for every chicken, cooked slowly in olive oil until soft.', 'Plenty of sumac over the onions gives the dish its colour.',
            'The chicken goes on top with toasted pine nuts, and it is eaten by hand.'] } },
      { id: 'quote', name: 'Quote card', kind: 'image', size: '1080×1080', made: 'upload', brand: 'Hikaya',
        slots: [{ name: 'Quote', kind: 'Text', rule: 'Up to 120 characters' }, { name: 'Speaker', kind: 'Text', rule: 'Their name, or who they are' },
          { name: 'Logo', kind: 'Identity', rule: 'From the identity; nobody fills it' }],
        versions: [{ v: 1, state: 'approved', by: 'rawan', at: '2026-09-20T11:00', approved: { by: 'khaled', at: '2026-09-21T09:00' }, outputs: 23 }],
        sample: { code: 'MAD-26-0144', line: 'content', title: 'The last glassblowers of Hebron',
          quote: 'The furnace teaches you patience before it teaches you glass.', speaker: 'The grandfather, a glassblower for seventy years' } },
      { id: 'reel', name: '30-second reel', kind: 'video', size: '1080×1920', seconds: 30, made: 'watar', brand: 'Hikaya',
        slots: [{ name: 'Opening title', kind: 'Text', rule: 'Up to 40 characters, for the first 3 seconds' }, { name: 'Clips', kind: 'Video', rule: 'Three to five, cut from the piece’s video' },
          { name: 'Subtitles', kind: 'Text', rule: 'From the script, one line at a time' }, { name: 'Logo', kind: 'Identity', rule: 'The last 2 seconds; nobody fills it' }],
        versions: [{ v: 1, state: 'draft', by: 'omar', at: '2026-10-31T14:20' }],
        sample: { code: 'MAD-26-0139', line: 'content', title: 'Summer knafeh', opening: 'Summer knafeh', clips: 4,
          subtitle: 'Why the best knafeh is eaten standing up, in the heat, at noon.' } },
    ],
    // Integrations: what came in from the integrations and went out to them, newest first. key: the event's own key (the
    // delivery's id), by which a re-run never does anything twice; dir: in or out; via: the integration; text: a sentence
    // with the data names it names (vars) and the item's code; by: the person behind it; state: done, or failed after
    // `tries` tries, with why. What a source let in through a webhook is read from `sources`, not written twice here.
    events: [
      { key: 'ig-6f1c20', at: '2026-11-01T09:15', dir: 'out', via: 'instagram', text: 'Publishing {code} on Instagram', code: 'MAD-26-0140', state: 'failed', tries: 3,
        why: 'The permission expired, so the post waits for it.' },
      { key: 'tt-6f1b08', at: '2026-11-01T09:08', dir: 'out', via: 'tiktok', text: 'Published {code} on TikTok', code: 'MAD-26-0140', state: 'done' },
      { key: 'sl-6f1a50', at: '2026-11-01T08:50', dir: 'in', via: 'slack', text: 'Approval from Slack on {code}', code: 'NEWS-26-0407', by: 'maryam', state: 'done' },
      { key: 'wh-6f1a45', at: '2026-11-01T08:45', dir: 'in', via: 'webhook', text: '{from} attached photos to {code}', vars: { from: 'The photo desk' }, code: 'MAD-26-0148', state: 'done' },
      { key: 'sl-6e9f31', at: '2026-10-31T20:31', dir: 'out', via: 'slack', text: 'Asked {channel} to review {code}', vars: { channel: '#editorial' }, code: 'NEWS-26-0409', state: 'done' },
      { key: 'tg-6e9a31', at: '2026-10-31T18:31', dir: 'out', via: 'telegram', text: 'Posted {code} to the {channel} channel', vars: { channel: 'Hikaya' }, code: 'NEWS-26-0404', state: 'done' },
      { key: 'wh-6e9945', at: '2026-10-31T17:45', dir: 'out', via: 'webhook', text: 'Sent {code} to {to}', vars: { to: 'The internal archive' }, code: 'MAD-26-0137', state: 'done' },
      { key: 'wp-6e9940', at: '2026-10-31T17:40', dir: 'out', via: 'wordpress', text: 'Published {code} on {site}', vars: { site: 'hikaya.example' }, code: 'MAD-26-0137', state: 'done' },
    ],
  };

  // the pieces on the content production line now. at: the block (or blocks) it is in; who: whose it is there (none:
  // open to be claimed); state: new (assigned, not started), work, returned (sent back with a note), approval (handed
  // over, waiting for the block's lead), open (nobody has it). due: when the block's part is due.
  const pieces = [
    { code: 'MAD-26-0144', title: 'The last glassblowers of Hebron', at: ['montage'], who: 'heba', state: 'returned', due: '2026-11-01T08:00', opened: '2026-10-26T10:00',
      note: { by: 'omar', at: '2026-11-01T08:40', from: 'mgmtreview', text: 'Cut the second minute; the ending is long.' },
      fields: { length: '03:00', brand: 'Hikaya', budget: '$400', pages: 'Instagram, TikTok',
        script: 'In Hebron’s old town, the last family that still blows glass by hand opens its doors to us. We begin at the furnace, then the grandfather who learned to blow seventy years ago, then the piece his grandson makes today.',
        video: [{ v: 3, by: 'heba', at: '2026-11-01T05:40', len: '02:41' }, { v: 2, by: 'heba', at: '2026-10-31T16:10', len: '03:12' }, { v: 1, by: 'heba', at: '2026-10-30T13:05', len: '03:40' }] },
      talk: 2, discussion: [
        { by: 'heba', at: '2026-11-01T05:44', text: 'Version 3 is up. It opens at the furnace now, and the grandson’s piece closes it.' },
        { by: 'omar', at: '2026-11-01T08:44', text: 'The second minute walks through the market again; we have seen it. Keep the grandfather’s hands at the furnace.' }],
      // [block, who, when, what, detail], newest first; detail: the version uploaded, or the note sent back with it
      log: [['mgmtreview', 'omar', '2026-11-01T08:40', 'returned', 'Cut the second minute; the ending is long.'], ['colour', 'laith', '2026-11-01T07:30', 'done'], ['montage', 'omar', '2026-11-01T06:15', 'approved'],
        ['montage', 'heba', '2026-11-01T05:40', 'version', 3], ['montage', 'heba', '2026-10-31T16:10', 'version', 2], ['montage', 'heba', '2026-10-30T13:05', 'version', 1],
        ['montage', 'heba', '2026-10-28T12:00', 'claimed'], ['edreview', 'maryam', '2026-10-28T11:20', 'approved'], ['script', 'sara', '2026-10-27T16:00', 'done']] },
    { code: 'MAD-26-0142', title: 'The old market of Jerusalem', at: ['montage'], who: 'heba', state: 'work', due: '2026-11-01T17:00', opened: '2026-10-25T09:30',
      fields: { length: '02:30', brand: 'Hikaya', budget: '$350', pages: 'Instagram, TikTok',
        script: 'Before the shutters rise, the old market is already awake: bread on the heads of boys, spice sellers sweeping their steps, and a shopkeeper who has opened the same door every morning for fifty years.',
        video: [{ v: 2, by: 'heba', at: '2026-10-31T15:20', len: '02:34' }, { v: 1, by: 'heba', at: '2026-10-30T11:00', len: '02:58' }] },
      talk: 1, discussion: [{ by: 'omar', at: '2026-10-31T16:30', text: 'Open on the shutters going up; the bread can come second.' }],
      log: [['montage', 'heba', '2026-10-31T15:20', 'version', 2], ['montage', 'heba', '2026-10-30T11:00', 'version', 1], ['edreview', 'maryam', '2026-10-29T10:00', 'approved']],
      // the client's comments from the review link (Al-Khatt's `shares`), each pinned to a moment of a version: v, the
      // version; s, the second; at, when it was written
      moments: [{ v: 2, s: 42, text: 'Change the music here', at: '2026-11-01T08:52' }, { v: 2, s: 75, text: 'The seller’s name is wrong', at: '2026-11-01T08:55' }] },
    { code: 'MAD-26-0151', title: 'Five dishes from Bethlehem', at: ['montage'], who: 'heba', state: 'new', due: '2026-11-02T17:00', opened: '2026-10-29T12:00',
      assigned: { by: 'omar', at: '2026-11-01T09:10' },
      fields: { length: '01:30', brand: 'Hikaya', budget: '$250', pages: 'Instagram',
        script: 'Five dishes, five kitchens, one city: from the market’s falafel to a grandmother’s maqluba, each told by the hands that make it.',
        video: [] }, talk: 0, log: [['montage', 'omar', '2026-11-01T09:10', 'assigned'], ['edreview', 'maryam', '2026-10-31T12:30', 'approved']] },
    { code: 'MAD-26-0155', title: 'A guide to the Petra amphitheatre', at: ['montage'], who: null, state: 'open', due: '2026-11-04T17:00', opened: '2026-10-30T10:00', needs: 'Motion',
      fields: { length: '01:00', brand: 'Hikaya', budget: '$300', pages: 'Instagram, TikTok', script: 'One minute, one stone theatre: who built it, how many it sat, and why it still carries a whisper to the last row.', video: [] }, talk: 0, log: [['edreview', 'maryam', '2026-10-31T14:00', 'approved']] },
    { code: 'MAD-26-0156', title: 'Olive seasons', at: ['montage'], who: null, state: 'open', due: '2026-11-05T17:00', opened: '2026-10-30T11:00',
      fields: { length: '02:00', brand: 'Hikaya', budget: '$150', pages: 'Instagram', script: 'From the first rain to the last press, a year of one olive tree in Burqin.', video: [] }, talk: 0, log: [['edreview', 'maryam', '2026-10-31T15:10', 'approved']] },
    { code: 'MAD-26-0157', title: 'The old doors of Nablus', at: ['montage'], who: null, state: 'open', due: '2026-11-06T17:00', opened: '2026-10-31T09:00',
      fields: { length: '01:30', brand: 'Hikaya', budget: '$200', pages: 'Instagram', script: 'Seven doors in the old city, and the families behind them.', video: [] }, talk: 0, log: [['edreview', 'ahmad', '2026-11-01T08:20', 'approved']] },
    { code: 'MAD-26-0147', title: 'Straw craft in Gaza', at: ['montage'], who: 'laith', state: 'work', due: '2026-11-03T17:00', opened: '2026-10-27T10:00',
      fields: { length: '01:00', brand: 'Hikaya', budget: '$180', pages: 'TikTok', script: 'A mother and two daughters weave baskets from wheat straw in Deir al-Balah.', video: [{ v: 1, by: 'laith', at: '2026-10-31T13:00', len: '01:08' }] }, talk: 0, log: [] },
    { code: 'MAD-26-0149', title: 'Morning coffee in Jaffa', at: ['montage'], who: 'laith', state: 'new', due: '2026-11-03T12:00', opened: '2026-10-28T10:00', assigned: { by: 'omar', at: '2026-10-31T16:00' },
      fields: { length: '00:45', brand: 'Hikaya', budget: '$120', pages: 'Instagram, TikTok', script: 'The first cup of the day at the oldest café on the clock tower square.', video: [] }, talk: 0, log: [] },
    { code: 'MAD-26-0138', title: 'Nablus soap', at: ['montage'], who: 'dana', state: 'approval', due: '2026-11-01T12:00', opened: '2026-10-22T10:00',
      fields: { length: '01:00', brand: 'Hikaya', budget: '$160', pages: 'Instagram', script: 'Olive oil, ash and patience: the last soap factory still working in the old city.', video: [{ v: 2, by: 'dana', at: '2026-11-01T08:55', len: '00:58' }] }, talk: 1,
      discussion: [{ by: 'dana', at: '2026-11-01T08:56', text: 'Version 2 is 20 seconds shorter; the soap cutting stays whole.' }],
      log: [['montage', 'dana', '2026-11-01T08:56', 'sent'], ['montage', 'dana', '2026-11-01T08:55', 'version', 2]] },
    { code: 'MAD-26-0139', title: 'Summer knafeh', at: ['montage'], who: 'laith', state: 'approval', due: '2026-11-01T15:00', opened: '2026-10-23T10:00',
      fields: { length: '00:50', brand: 'Hikaya', budget: '$140', pages: 'TikTok', script: 'Why the best knafeh is eaten standing up, in the heat, at noon.', video: [{ v: 1, by: 'laith', at: '2026-11-01T09:20', len: '00:52' }] }, talk: 0,
      log: [['montage', 'laith', '2026-11-01T09:21', 'sent'], ['montage', 'laith', '2026-11-01T09:20', 'version', 1]] },
    // elsewhere on the line, so Home and the strips have the whole line
    { code: 'MAD-26-0158', title: 'Weddings of the Jordan Valley', at: ['idea'], who: 'sara', state: 'work', due: '2026-11-02T12:00', opened: '2026-10-31T10:00', fields: {}, talk: 0, log: [] },
    { code: 'MAD-26-0159', title: 'The bakeries that never close', at: ['idea'], who: null, state: 'open', due: '2026-11-03T12:00', opened: '2026-11-01T08:30', fields: {}, talk: 0, log: [] },
    { code: 'MAD-26-0152', title: 'Ramallah’s first cinema', at: ['script'], who: 'sara', state: 'work', due: '2026-11-01T16:00', opened: '2026-10-28T10:00', fields: {}, talk: 0, log: [] },
    { code: 'MAD-26-0153', title: 'Embroidery that tells where you are from', at: ['script'], who: 'sara', state: 'returned', due: '2026-10-31T16:00', opened: '2026-10-27T10:00',
      note: { by: 'maryam', at: '2026-10-31T17:30', from: 'edreview', text: 'The second paragraph repeats the first.' }, fields: {}, talk: 1,
      discussion: [{ by: 'maryam', at: '2026-10-31T17:32', text: 'Start from the grandmother’s needle, not from the map.' }], log: [['edreview', 'maryam', '2026-10-31T17:30', 'returned', 'The second paragraph repeats the first.']] },
    { code: 'MAD-26-0154', title: 'A day with a Hebron grape farmer', at: ['script'], who: 'ahmad', state: 'work', due: '2026-11-02T16:00', opened: '2026-10-29T10:00', fields: {}, talk: 0, log: [] },
    { code: 'MAD-26-0150', title: 'Night swimming in Acre', at: ['edreview'], who: 'maryam', state: 'approval', due: '2026-11-01T13:00', opened: '2026-10-26T10:00', fields: {}, talk: 0, log: [] },
    { code: 'MAD-26-0148', title: 'Ceramics of Hebron', at: ['design'], who: 'yousef', state: 'work', due: '2026-11-02T12:00', opened: '2026-10-25T10:00', fields: {}, talk: 0, log: [] },
    { code: 'MAD-26-0146', title: 'The sea of Gaza at dawn', at: ['colour'], who: 'laith', state: 'work', due: '2026-11-01T15:00', opened: '2026-10-24T10:00', fields: {}, talk: 0, log: [] },
    { code: 'MAD-26-0141', title: 'Za’atar season', at: ['mgmtreview'], who: 'khaled', state: 'approval', due: '2026-11-01T11:00', opened: '2026-10-21T10:00', fields: {}, talk: 0, log: [] },
    { code: 'MAD-26-0140', title: 'Bab al-Amud at sunset', at: ['publish'], who: 'noor', state: 'work', due: '2026-11-01T18:00', opened: '2026-10-20T10:00', fields: {}, talk: 0, log: [] },
  ];

  // ---------- Masar ----------
  const masar = {
    id: 'masar', name: 'Masar', address: 'masar.iqaa.co', pack: 'Software',
    mark: { en: 'M', ar: 'م', tr: 'M' },
    noun: 'ticket', prefix: 'DEV',
    departments: [{ id: 'product', name: 'Product' }, { id: 'engineering', name: 'Engineering' }, { id: 'quality', name: 'Quality' }],
    people: {
      samir: { name: 'Samir Khoury', title: 'Chief executive', dept: 'product', type: 'staff', hours: 40, owner: true },
      mazen: { name: 'Mazen Taha', title: 'Tech lead', dept: 'engineering', type: 'staff', hours: 40, skills: ['Laravel', 'Architecture'] },
      wasim: { name: 'Wasim Najjar', title: 'Backend developer', dept: 'engineering', type: 'staff', hours: 40, team: 'Backend team', skills: ['Laravel'] },
      lina: { name: 'Lina Barakat', title: 'Frontend developer', dept: 'engineering', type: 'staff', hours: 40, team: 'Frontend team', skills: ['React'] },
      tareq: { name: 'Tareq Saleh', title: 'Product analyst', dept: 'product', type: 'staff', hours: 40 },
      rasha: { name: 'Rasha Nasser', title: 'Product designer', dept: 'product', type: 'staff', hours: 40 },
      fadi: { name: 'Fadi Haddad', title: 'Tester', dept: 'quality', type: 'staff', hours: 40 },
    },
    fields: {
      requirements: { name: 'Requirements', type: 'text' },
      pr: { name: 'Pull request', type: 'pr' },
      design: { name: 'Design link', type: 'link' },
      release: { name: 'Release', type: 'choice' },
      type: { name: 'Type', type: 'choice' },
      priority: { name: 'Priority', type: 'choice' },
      client: { name: 'Client', type: 'choice' },
      cost: { name: 'Client cost', type: 'money', secret: true },
    },
    lines: [{
      id: 'features', name: 'Feature line', version: 7, prefix: 'DEV',
      draft: {
        changes: [
          { type: 'add', block: 'security', text: 'Added {block} before {before}', vars: { block: 'Security test', before: 'Automatic release' } },
          { type: 'mode', block: 'codereview', text: '{block} now runs as {mode}', vars: { block: 'Code review', mode: 'Assisted' } },
        ],
        adds: [{ id: 'security', name: 'Security test', dept: 'quality', kind: 'approval', hours: 4, after: ['testing'], back: 'dev',
          roles: [{ role: 'Tester', people: ['fadi'], sees: 'all' }] }],
        fields: {},
      },
      blocks: [
        { id: 'request', name: 'New request', dept: 'product', kind: 'work', hours: 8, roles: [{ role: 'Product analyst', people: ['tareq'], sees: 'all' }] },
        { id: 'analysis', name: 'Analysis', dept: 'product', kind: 'work', hours: 16, after: ['request'], roles: [{ role: 'Product analyst', people: ['tareq'], sees: 'all' }] },
        { id: 'uidesign', name: 'Interface design', dept: 'product', kind: 'work', hours: 16, after: ['analysis'], roles: [{ role: 'Product designer', people: ['rasha'], sees: 'all' }] },
        { id: 'dev', name: 'Development', dept: 'engineering', kind: 'work', hours: 24, after: ['uidesign'],
          roles: [{ role: 'Developer', people: ['wasim', 'lina'], sees: 'team', claim: true, fields: { requirements: 'read', pr: 'write', design: 'read', release: 'read', type: 'read', priority: 'read', client: 'read' } },
            { role: 'Tech lead', people: ['mazen'], sees: 'all', lead: true }] },
        { id: 'codereview', name: 'Code review', dept: 'engineering', kind: 'approval', hours: 4, after: ['dev'], back: 'dev', roles: [{ role: 'Tech lead', people: ['mazen'], sees: 'all' }] },
        { id: 'testing', name: 'Testing', dept: 'quality', kind: 'approval', hours: 8, after: ['codereview'], back: 'dev', roles: [{ role: 'Tester', people: ['fadi'], sees: 'all' }] },
        // the software pack's block: no people in it; it merges and deploys once the tests pass
        { id: 'release', name: 'Automatic release', dept: 'engineering', kind: 'auto', hours: 1, after: ['testing'], pack: true, roles: [] },
      ],
    }],
    others: [{ id: 'support', name: 'Support line', live: 5 }],
    packStats: { releases: 2, bugs: 7, speed: '3.1' },
    // People and departments, and Settings, as Al-Khatt's
    teams: [
      { id: 'backend', name: 'Backend team', dept: 'engineering', lead: 'mazen', people: ['wasim'], grants: [{ block: 'dev', role: 'Developer' }] },
      { id: 'frontend', name: 'Frontend team', dept: 'engineering', people: ['lina'], grants: [{ block: 'dev', role: 'Developer' }] },
    ],
    skills: ['Laravel', 'React', 'Architecture'],
    // use: as Al-Khatt's; checks: the checks are read from GitHub Check Runs, so any tool that posts there is read
    integrations: [
      { id: 'github', name: 'GitHub', account: 'github.com/masar-dev', state: 'works', use: { repos: ['masar-api', 'masar-web', 'masar-app'], checks: true } },
      { id: 'slack', name: 'Slack', account: 'masar.slack.com', state: 'works', use: { channels: 3, approvals: true } },
      { id: 'sentry', name: 'Sentry', account: 'sentry.io/masar', state: 'works', use: { projects: 2 } },
      { id: 'google', name: 'Google', account: 'masar.example', state: 'works', use: { sso: true } },
    ],
    identity: { language: 'ar' },
    usage: { credit: 1180, creditOf: 5000, storage: 18, storageOf: 100, seatsOf: 10 },
    // as Al-Khatt's: when items came into their block where their log does not say, and the line's last 30 days
    since: {
      'DEV-26-0091': '2026-10-31T14:00', 'DEV-26-0099': '2026-11-01T08:00', 'DEV-26-0095': '2026-11-01T08:30',
      'DEV-26-0097': '2026-11-01T08:40', 'DEV-26-0090': '2026-11-01T07:20', 'DEV-26-0086': '2026-10-30T15:00',
    },
    returns: {
      days: 30,
      through: { request: 72, analysis: 70, uidesign: 66, dev: 64, codereview: 75, testing: 68, release: 52 },
      back: [{ from: 'testing', to: 'dev', field: 'requirements', n: 18 }, { from: 'codereview', to: 'dev', field: 'pr', n: 11 },
        { from: 'testing', to: 'dev', field: 'pr', n: 7 }],
    },
    // Reports, as Al-Khatt's: each block's average hours, the items sent back to each block counted once (the 7 over
    // the pull request after testing were among the 18 over the requirements), and the finished items' journey, those
    // that came back at least once and those that kept every due time
    report: {
      hours: { request: 5, analysis: 14, uidesign: 12, dev: 31, codereview: 3, testing: 7, release: 0.25 },
      backTo: { dev: 29 },
      journey: 74, backOnce: 21, onTime: 39,
    },
    // the software pack's results after delivery, for the same 30 days: each release and the bugs reported after it
    results: {
      releases: [{ v: '2.6.3', at: '2026-10-05T16:00', bugs: 1 }, { v: '2.7', at: '2026-10-15T16:00', bugs: 6 },
        { v: '2.7.1', at: '2026-10-26T16:00', bugs: 2 }, { v: '2.7.2', at: '2026-10-29T16:00', bugs: 2 }],
    },
    // Integrations, as Al-Khatt's `events`; check: read from GitHub Check Runs (CodeRabbit posts its review there)
    events: [
      { key: 'gh-9c0e39', at: '2026-11-01T09:39', dir: 'in', via: 'github', text: 'CodeRabbit finished its review of PR #{pr} with no critical notes', vars: { pr: 214 }, code: 'DEV-26-0088', check: true, state: 'done' },
      { key: 'gh-9c0e28', at: '2026-11-01T09:28', dir: 'in', via: 'github', text: '{check} passed on PR #{pr}', vars: { check: 'Unit tests', pr: 214 }, code: 'DEV-26-0088', check: true, state: 'done' },
      { key: 'gh-9c0e05', at: '2026-11-01T09:05', dir: 'in', via: 'github', text: 'PR #{pr} opened on {code}', vars: { pr: 214 }, code: 'DEV-26-0088', by: 'wasim', state: 'done' },
      { key: 'sl-9c0d16', at: '2026-11-01T08:16', dir: 'out', via: 'slack', text: 'Told {channel} that {code} came back from {block}', vars: { channel: '#dev', block: 'Testing' }, code: 'DEV-26-0093', state: 'done' },
      { key: 'sl-9b9f00', at: '2026-10-31T17:00', dir: 'in', via: 'slack', text: 'Approval from Slack on {code}', code: 'DEV-26-0093', by: 'mazen', state: 'done' },
      { key: 'gh-9b4e20', at: '2026-10-30T14:20', dir: 'in', via: 'github', text: 'PR #{pr} merged on {code}', vars: { pr: 209 }, code: 'DEV-26-0088', by: 'wasim', state: 'done' },
      { key: 'se-9b4a00', at: '2026-10-30T10:00', dir: 'in', via: 'sentry', text: 'A new error in {v} opened {code}', vars: { v: '2.7.2' }, code: 'DEV-26-0093', state: 'done' },
      { key: 'gh-9af160', at: '2026-10-29T16:00', dir: 'out', via: 'github', text: 'Released {v} from {repo}', vars: { v: '2.7.2', repo: 'masar-api' }, state: 'done' },
      { key: 'gh-9af140', at: '2026-10-29T15:40', dir: 'in', via: 'github', text: 'PR #{pr} merged, so {code} moved to {block}', vars: { pr: 211, block: 'Automatic release' }, code: 'DEV-26-0087', state: 'done' },
    ],
  };
  const tickets = [
    { code: 'DEV-26-0088', title: 'Sign in with a phone number', at: ['dev'], who: 'wasim', state: 'work', due: '2026-11-02T17:00', opened: '2026-10-26T10:00',
      fields: { release: '2.8', type: 'Feature', priority: 'High', client: 'Rawabi Store', cost: '$1,800', design: 'figma.com/file/masar-login',
        requirements: 'The user enters a phone number and receives a 6-digit code on WhatsApp, valid for 5 minutes. After 3 wrong tries the number is locked for 15 minutes. Signing in with a password stays in this release.',
        pr: { n: 214, passed: 4, running: 1, failed: 0, add: 284, del: 41, files: 9, review: 'CodeRabbit', repo: 'masar-api',
          checks: [['Unit tests', 'passed'], ['Static analysis', 'passed'], ['Code style', 'passed'], ['Compile', 'passed'], ['Browser tests', 'running']] } },
      // the ticket's earlier pull request, already merged; and the test cases Watar drafts from the requirements
      merged: [{ n: 209, title: 'Send the sign-in code on WhatsApp', repo: 'masar-api', by: 'wasim', at: '2026-10-30T14:20', add: 132, del: 6, files: 5 }],
      watar: { tests: ['A right code entered within 5 minutes signs the user in.', 'A code entered after 5 minutes is refused, and a new one can be asked for.',
        'A third wrong code locks the number for 15 minutes; a fourth try in that time is refused.', 'After 15 minutes the locked number can sign in again.', 'Signing in with a password still works.'] },
      talk: 5, discussion: [
        { by: 'tareq', at: '2026-10-27T12:05', text: 'Analysis is done: codes go over WhatsApp only; SMS is out of this release.' },
        { by: 'rasha', at: '2026-10-29T15:05', text: 'The code screen is in the design link: six boxes, and pasting fills them all.' },
        { by: 'wasim', at: '2026-10-30T14:25', text: 'The WhatsApp sender is merged (#209). Next: checking the code and the lock.' },
        { by: 'mazen', at: '2026-10-31T16:40', text: 'Lock by number, not by device. The same 15 minutes.' },
        { by: 'wasim', at: '2026-11-01T09:06', text: '#214 is open. The browser tests are still running.' }],
      log: [['dev', 'wasim', '2026-11-01T09:05', 'pr', 214], ['dev', 'wasim', '2026-10-30T14:20', 'merged', 209], ['dev', 'wasim', '2026-10-29T16:00', 'claimed'],
        ['uidesign', 'rasha', '2026-10-29T15:00', 'done'], ['analysis', 'tareq', '2026-10-27T12:00', 'done']] },
    { code: 'DEV-26-0091', title: 'Export the order history', at: ['dev'], who: 'wasim', state: 'new', due: '2026-11-04T17:00', opened: '2026-10-28T10:00', assigned: { by: 'mazen', at: '2026-11-01T08:50' },
      fields: { release: '2.8', type: 'Feature', priority: 'Medium', client: 'Rawabi Store', cost: '$900', requirements: 'Owners export their order history as CSV, filtered by date.' },
      watar: { tests: ['An owner exports the orders between two dates as a CSV file.', 'Orders outside the dates are not in the file.', 'Dates with no orders give a file with the header row only.'] },
      talk: 0, log: [['dev', 'mazen', '2026-11-01T08:50', 'assigned']] },
    { code: 'DEV-26-0093', title: 'Checkout rounds the total down', at: ['dev'], who: 'wasim', state: 'returned', due: '2026-11-01T12:00', opened: '2026-10-30T10:00',
      note: { by: 'fadi', at: '2026-11-01T08:15', from: 'testing', text: 'Still off by one cent when the discount is 15%.' },
      fields: { release: '2.7.3', type: 'Bug', priority: 'High', client: 'Galilee Honey', cost: '$300', requirements: 'Totals with a percentage discount are one cent short.' },
      watar: { tests: ['A 15% discount on 33.30 gives 28.31.', 'Discounts of 10%, 15% and 20% round to the nearest cent, halves up.', 'A total with no discount is unchanged.'] },
      talk: 2, discussion: [
        { by: 'fadi', at: '2026-11-01T08:16', text: '15% off 33.30 shows 28.30; it should be 28.31.' },
        { by: 'wasim', at: '2026-11-01T08:31', text: 'The total is rounded before the discount. Looking at it now.' }],
      log: [['testing', 'fadi', '2026-11-01T08:15', 'returned', 'Still off by one cent when the discount is 15%.'], ['codereview', 'mazen', '2026-10-31T17:00', 'approved'], ['dev', 'wasim', '2026-10-31T15:00', 'done']] },
    { code: 'DEV-26-0095', title: 'Dark mode for the dashboard', at: ['uidesign'], who: 'rasha', state: 'work', due: '2026-11-03T17:00', opened: '2026-10-29T10:00', fields: { release: '2.9', type: 'Feature', priority: 'Low' }, talk: 0, log: [] },
    { code: 'DEV-26-0097', title: 'Push notifications', at: ['analysis'], who: 'tareq', state: 'work', due: '2026-11-02T17:00', opened: '2026-10-31T10:00', fields: { release: '2.9', type: 'Feature', priority: 'Medium' }, talk: 0, log: [] },
    { code: 'DEV-26-0090', title: 'Faster product search', at: ['codereview'], who: 'mazen', state: 'approval', due: '2026-11-01T15:00', opened: '2026-10-24T10:00', fields: { release: '2.8', type: 'Feature', priority: 'Medium' }, talk: 0, log: [] },
    { code: 'DEV-26-0086', title: 'Arabic invoices', at: ['testing'], who: 'fadi', state: 'approval', due: '2026-11-01T17:00', opened: '2026-10-22T10:00', fields: { release: '2.8', type: 'Feature', priority: 'High' }, talk: 0, log: [] },
    { code: 'DEV-26-0099', title: 'Coupon codes for first orders', at: ['dev'], who: null, state: 'open', due: '2026-11-05T17:00', opened: '2026-11-01T08:00', fields: { release: '2.9', type: 'Feature', priority: 'Medium' }, talk: 0, log: [] },
  ];

  // ---------- Wamda ----------
  // A marketing agency: the same product, told as an agency's story. Its campaigns walk the campaign line, and the
  // client decides at Client approval through a link, without an account (the account manager holds the campaign
  // there until the client answers). Its pack is Agencies: the spend and the return come from the ad accounts.
  const wamda = {
    id: 'wamda', name: 'Wamda', address: 'wamda.iqaa.co', pack: 'Agencies',
    mark: { en: 'W', ar: 'و', tr: 'W' },
    noun: 'campaign', prefix: 'CMP',
    departments: [{ id: 'strategy', name: 'Strategy' }, { id: 'creative', name: 'Creative' }, { id: 'media', name: 'Media buying' }],
    people: {
      hala: { name: 'Hala Shaheen', title: 'Managing partner', dept: 'strategy', type: 'staff', hours: 40, owner: true },
      majd: { name: 'Majd Khatib', title: 'Planner', dept: 'strategy', type: 'staff', hours: 40 },
      tala: { name: 'Tala Hammad', title: 'Creative director', dept: 'creative', type: 'staff', hours: 40 },
      bilal: { name: 'Bilal Awad', title: 'Copywriter', dept: 'creative', type: 'staff', hours: 40, skills: ['Arabic copy'] },
      nadine: { name: 'Nadine Saba', title: 'Designer', dept: 'creative', type: 'staff', hours: 40, skills: ['Motion'] },
      lama: { name: 'Lama Hijazi', title: 'Account manager', dept: 'media', type: 'staff', hours: 40 },
      fares: { name: 'Fares Zayed', title: 'Media buyer', dept: 'media', type: 'staff', hours: 40, skills: ['Paid social'] },
      kareem: { name: 'Kareem Barghouti', title: 'Media buyer', dept: 'media', type: 'invited', hours: 20 },
    },
    fields: {
      brief: { name: 'Client brief', type: 'text' },
      files: { name: 'Files', type: 'file' },
      audience: { name: 'Audience', type: 'choice' },
      channels: { name: 'Channels', type: 'choice' },
      client: { name: 'Client', type: 'choice' },
      budget: { name: 'Budget', type: 'money', secret: true },
    },
    lines: [{
      id: 'campaigns', name: 'Campaign line', version: 3, prefix: 'CMP',
      blocks: [
        { id: 'strategy', name: 'Strategy', dept: 'strategy', kind: 'work', hours: 48,
          roles: [{ role: 'Planner', people: ['majd'], sees: 'all', claim: true }, { role: 'Head of strategy', people: ['hala'], sees: 'all', lead: true }] },
        { id: 'creative', name: 'Writing and design', dept: 'creative', kind: 'work', hours: 72, after: ['strategy'], approve: 'Creative director',
          roles: [{ role: 'Copywriter', people: ['bilal'], sees: 'assigned', claim: true, fields: { brief: 'read', files: 'write', audience: 'read', channels: 'read', client: 'read' } },
            { role: 'Designer', people: ['nadine'], sees: 'assigned', claim: true, fields: { brief: 'read', files: 'write', audience: 'read', channels: 'read', client: 'read' } },
            { role: 'Creative director', people: ['tala'], sees: 'all', lead: true }] },
        // the client decides here, through a link; the account manager holds the campaign until they answer
        { id: 'clientok', name: 'Client approval', dept: 'media', kind: 'approval', hours: 48, after: ['creative'], back: 'creative', client: true,
          roles: [{ role: 'Account manager', people: ['lama'], sees: 'all' }] },
        // the agency pack's block: the approved ads go live in the ad accounts
        { id: 'launch', name: 'Campaign launch', dept: 'media', kind: 'work', hours: 24, after: ['clientok'], pack: true,
          roles: [{ role: 'Media buyer', people: ['fares'], sees: 'all' }] },
      ],
    }],
    others: [],
    // the agency pack's numbers for Home, from the ad accounts over the last 30 days: what was spent against the
    // clients' budgets for those days, and the return on the ads (sales for every dollar spent)
    packStats: { spend: 18400, budget: 26000, roas: 3.2, days: 30 },
    invited: { kareem: '2026-10-30T11:00' },
    invitedAs: { kareem: 'freelancer' },
    skills: ['Arabic copy', 'Motion', 'Paid social'],
    integrations: [
      { id: 'metaads', name: 'Meta Ads', account: 'Wamda Agency', state: 'works', use: { adAccounts: 6 } },
      { id: 'googleads', name: 'Google Ads', account: 'wamda.example', state: 'works', use: { adAccounts: 3 } },
      { id: 'drive', name: 'Google Drive', account: 'wamda.example', state: 'works', use: { folders: 8 } },
      { id: 'google', name: 'Google', account: 'wamda.example', state: 'works', use: { sso: true } },
    ],
    identity: { language: 'ar' },
    usage: { credit: 860, creditOf: 5000, storage: 41, storageOf: 100, seatsOf: 10 },
    // the line's last 30 days, as Al-Khatt's: Watar finds no cause that sends one in five back, and finds Client
    // approval keeping its campaigns about three times as long as it expects (report.hours)
    returns: {
      days: 30,
      through: { strategy: 41, creative: 39, clientok: 37, launch: 33 },
      back: [{ from: 'clientok', to: 'creative', field: 'brief', n: 6 }],
    },
    report: {
      hours: { strategy: 46, creative: 70, clientok: 140, launch: 20 },
      backTo: { creative: 6 },
      journey: 290, backOnce: 6, onTime: 21,
    },
    events: [
      { key: 'ma-31f900', at: '2026-11-01T09:00', dir: 'in', via: 'metaads', text: 'Yesterday’s spend came in: {amount}', vars: { amount: '$430' }, state: 'done' },
      { key: 'ga-31f900', at: '2026-11-01T09:00', dir: 'in', via: 'googleads', text: 'Yesterday’s spend came in: {amount}', vars: { amount: '$160' }, state: 'done' },
      { key: 'ma-31a730', at: '2026-10-31T17:30', dir: 'out', via: 'metaads', text: 'Created the ads of {code}, paused until launch', code: 'CMP-26-0060', state: 'done' },
      { key: 'dr-31a620', at: '2026-10-31T16:20', dir: 'out', via: 'drive', text: 'Saved the approved files of {code} to the client’s folder', code: 'CMP-26-0060', state: 'done' },
    ],
  };
  // the campaigns on the campaign line now, as Al-Khatt's pieces; fields.client and fields.budget feed Home's clients
  const campaigns = [
    { code: 'CMP-26-0074', title: 'Winter menu', at: ['strategy'], who: 'majd', state: 'work', due: '2026-11-03T09:00', opened: '2026-11-01T07:30',
      fields: { client: 'Rawabi Café', budget: '$1,000', channels: 'Instagram, Facebook', brief: 'Four winter drinks and the new sahlab, for students near the university.' },
      talk: 0, log: [['strategy', 'majd', '2026-11-01T07:35', 'claimed']] },
    { code: 'CMP-26-0075', title: 'Gift boxes for the holidays', at: ['strategy'], who: 'majd', state: 'new', due: '2026-11-02T17:00', opened: '2026-10-30T09:00',
      assigned: { by: 'hala', at: '2026-10-31T10:00' }, fields: { client: 'Jericho Dates', budget: '$300', channels: 'Instagram' }, talk: 0, log: [['strategy', 'hala', '2026-10-31T10:00', 'assigned']] },
    { code: 'CMP-26-0076', title: 'Spring planting season', at: ['strategy'], who: null, state: 'open', due: '2026-11-03T17:00', opened: '2026-10-29T10:00',
      fields: { client: 'Green Hills Nursery', budget: '$450', channels: 'Facebook' }, talk: 0, log: [] },
    { code: 'CMP-26-0068', title: 'Opening of the second branch', at: ['creative'], who: 'bilal', state: 'work', due: '2026-11-02T12:00', opened: '2026-10-26T10:00',
      fields: { client: 'Rawabi Café', budget: '$1,800', channels: 'Instagram, Facebook, Google', brief: 'The second branch opens in Al-Masyoun on 12 November; the first week, a free cup with every breakfast.' },
      talk: 1, discussion: [{ by: 'tala', at: '2026-10-31T15:10', text: 'Lead with the street, not the cup: people should know where it is.' }],
      log: [['creative', 'bilal', '2026-10-29T10:30', 'claimed'], ['strategy', 'majd', '2026-10-29T10:00', 'done']] },
    { code: 'CMP-26-0069', title: 'Sidr honey season', at: ['creative'], who: 'nadine', state: 'work', due: '2026-11-02T17:00', opened: '2026-10-27T09:00',
      fields: { client: 'Galilee Honey Store', budget: '$1,900', channels: 'Instagram, Google' }, talk: 0, log: [['strategy', 'majd', '2026-10-29T14:00', 'done']] },
    { code: 'CMP-26-0070', title: 'New year memberships', at: ['creative'], who: 'nadine', state: 'new', due: '2026-11-03T12:00', opened: '2026-10-28T09:00',
      assigned: { by: 'tala', at: '2026-10-31T09:30' }, fields: { client: 'Sama Gym', budget: '$400', channels: 'Instagram' },
      talk: 0, log: [['creative', 'tala', '2026-10-31T09:30', 'assigned'], ['strategy', 'majd', '2026-10-30T12:00', 'done']] },
    { code: 'CMP-26-0071', title: 'Arabic poetry nights', at: ['creative'], who: 'bilal', state: 'approval', due: '2026-11-01T17:00', opened: '2026-10-24T10:00',
      fields: { client: 'Yafa Bookshop', budget: '$300', channels: 'Instagram, Facebook' }, talk: 0, log: [['creative', 'bilal', '2026-11-01T09:10', 'sent'], ['strategy', 'majd', '2026-10-28T09:00', 'done']] },
    { code: 'CMP-26-0073', title: 'Ceramics workshop weekends', at: ['creative'], who: null, state: 'open', due: '2026-11-04T17:00', opened: '2026-10-29T09:00', needs: 'Motion',
      fields: { client: 'Bethlehem Ceramics', budget: '$500', channels: 'Instagram' }, talk: 0, log: [['strategy', 'majd', '2026-10-31T11:00', 'done']] },
    { code: 'CMP-26-0062', title: 'Autumn breakfast offer', at: ['clientok'], who: 'lama', state: 'approval', due: '2026-10-27T10:00', opened: '2026-10-18T10:00',
      fields: { client: 'Rawabi Café', budget: '$1,400', channels: 'Instagram, Facebook' }, talk: 0, log: [['clientok', 'lama', '2026-10-25T10:05', 'sent'], ['creative', 'tala', '2026-10-25T10:00', 'approved']] },
    { code: 'CMP-26-0064', title: 'Honey for gifts', at: ['clientok'], who: 'lama', state: 'approval', due: '2026-10-27T15:00', opened: '2026-10-19T10:00',
      fields: { client: 'Galilee Honey Store', budget: '$1,200', channels: 'Instagram, Google' }, talk: 0, log: [['creative', 'tala', '2026-10-25T15:00', 'approved']] },
    { code: 'CMP-26-0066', title: 'Registration for the new year', at: ['clientok'], who: 'lama', state: 'approval', due: '2026-11-02T12:00', opened: '2026-10-20T10:00',
      fields: { client: 'Al-Nour School', budget: '$800', channels: 'Facebook, Google' }, talk: 0, log: [['creative', 'tala', '2026-10-27T09:00', 'approved']] },
    { code: 'CMP-26-0067', title: 'Membership drive', at: ['clientok'], who: 'lama', state: 'approval', due: '2026-11-02T17:00', opened: '2026-10-21T10:00',
      fields: { client: 'Sama Gym', budget: '$350', channels: 'Instagram' }, talk: 0, log: [['creative', 'tala', '2026-10-27T13:00', 'approved']] },
    { code: 'CMP-26-0060', title: 'Date season', at: ['launch'], who: 'fares', state: 'work', due: '2026-11-01T16:00', opened: '2026-10-15T10:00',
      fields: { client: 'Jericho Dates', budget: '$350', channels: 'Instagram, Facebook' }, talk: 0, log: [['clientok', 'lama', '2026-10-31T16:00', 'approved']] },
    { code: 'CMP-26-0063', title: 'Children’s reading hour', at: ['launch'], who: 'fares', state: 'work', due: '2026-11-02T12:00', opened: '2026-10-16T10:00',
      fields: { client: 'Yafa Bookshop', budget: '$250', channels: 'Facebook' }, talk: 0, log: [['clientok', 'lama', '2026-11-01T07:00', 'approved']] },
  ];

  alkhatt.lines[0].items = pieces;
  masar.lines[0].items = tickets;
  wamda.lines[0].items = campaigns;
  const orgs = { alkhatt, masar, wamda };
  Object.values(orgs).forEach((o) => o.lines.forEach((l) => l.blocks.forEach((b) => { b.stroke = STROKE[b.kind]; })));

  window.WORLD = { now: '2026-11-01T09:41', day: 'Sunday 1 November', dayIso: '2026-11-01', orgs, STROKE };
})();
