# Iqaa (إيقاع) — brand identity

Static identity book for Iqaa, a SaaS platform that runs any organization's work as a line of people and
automatic steps. The book is in English; the product screens are in English, Arabic (right to left) and Turkish.
Not deployed.

Idea: **the line is the signature**, written with one pen: a straight stroke = a step that runs by itself,
a loop of the hand = a person does it, an open arch = it waits for a person, a pen lift and a dot = a timed
wait; between stations the pen runs half a step of straight, the handoff. Iqaa's mark is its own stroke (a
run, a loop, a rising finish); an organization's mark is its initial signed with the opening of its line.
Violet means a person; everything automatic is ink.

The product's model, from the owner's full plan (1 Nov 2026): Iqaa serves the **digital production** family first
(media and journalism, montage, design, software, agencies); its first packs are Software and Media and production.
An **organization** (its own address) has **departments** and teams, and runs **lines**. A line has a published
version and a draft; lines connect by a call, a launch or an aggregate. A line is **blocks** in order, and each block
has its roles and people, the fields each role sees, its tools and how it runs (one of five modes: Manual, Trial,
Assisted, Automatic with review, Fully automatic). What walks a line is named by the organization: Al-Khatt Media's
pieces (MAD), Masar's tickets (DEV), Wamda's campaigns. A **pack** adds blocks, screens, reports and integrations and
never changes the core. My work is the screen people open most; Watar (the AI) drafts in the dashed grey pen and never
publishes.

## Build

```
python -I tools/fetch_fonts.py   # candidate faces from google/fonts into research/font-src (gitignored)
python -I tools/font_facts.py    # measures them -> research/font-facts.json (the type decision)
python -I tools/fonts.py         # WOFF2 subsets of Atkinson Hyperlegible Next and Fragment Mono
python tools/build.py            # tokens, logo files and every page, in en/, ar/ and tr/
python tools/build.py --only work,item   # just those product screens, in every language; skips the book
python -I tools/shot.py mark.html research/shots/mark.png 1280 6000   # headless QA shot (preview on :8341)
```

Every number comes from `tools/tokens.py` (beat 16 px, tempo 100 BPM, type ratio 1.25, colours computed
in OKLCH) and every mark from `tools/brand.py`. Never edit the built HTML or the SVGs in `assets/brand/`;
bump `V` in `tools/shell.py` after a CSS or JS change.

## Languages

English is the key (gettext style): the source says `t('Waiting for you')` in Python and `T('Waiting for you')` in
the browser, and `i18n/*.json` (core first, then one file per group of screens) gives the Arabic and Turkish, with
CLDR plural forms for counts (`I18N.n()`; Arabic has zero, one, two, few, many, other). The build writes English at
the root, `ar/` and `tr/` beside it, and `assets/js/i18n-<lang>.js` for the browser; a text translated differently
in two files keeps the first and the build says so. The data stays English (logic compares names) and is translated
where it is shown; every date and time goes through `FLOW.when/ago/late/hm/date/dayOf` in `assets/js/flow.js`. A
sentence about what walks the line is written with "job" and said with the organization's noun (`I18N.noun()`), so
the dictionaries hold it once per noun (piece, ticket, campaign). Arabic sets the page
`dir="rtl"`, mirrors the line drawings (`svg.flow`) with their words kept upright, and uses Readex Pro through the
body face's Arabic `unicode-range`. The language switch sits in the sidebar foot (outside the app, at the top):
each language by its flag (Arabic: Palestine; English: the United Kingdom; Turkish: Turkey), and it keeps the page's
query and hash. `assets/js/ui.js` gives every screen the same menus and replaces native selects with the house
dropdown while keeping their value and events. Dictionaries of the screens: core, auth, studio (frame, My work, Home,
queue), item, start, canvas, people, reports, automate, agency (templates, integrations, Wamda), and the older line, work, settings, clients, inbox and watar,
whose keys the screens still share.

## Pages

index · decisions (every choice with its measurement) · mark · signature (with a live generator) · colour ·
type · icons · motion (five playable moments) · system (Watar, architecture, co-branding, messages, product
proofs) · applications · guidelines (ten rules, do/don't, tokens, files, QC) · screens (the product screens on
stages, captured by `python -I tools/screens.py` into `assets/screens/`, preview running).

## Screens

The owner's 22 designed screens, built on one demo world, `assets/js/world.js`: Al-Khatt Media (media and production,
pieces MAD, its content production line at version 4 with a draft of version 5, and its quick news line), Masar
(software, tickets DEV, its feature line) and Wamda (an agency, campaigns). The clock is fixed at Sunday 1 November
2026, 09:41. `assets/js/flow.js` makes the context every screen reads (`FLOW.context()`: the organization, the person,
the line, its blocks and items, who stands where), and `assets/js/frame.js` writes the app frame from it: the nav
depends on who is looking (the owner, a block's lead, a member) and on the pack; on a phone it is a tab bar and More.

Every app screen takes `?org=alkhatt|masar|wamda` and `?as=<person>` (the person menu at the sidebar foot, "See the
screens as", switches it; the organization is kept for the visit under `iqaa-org-id`).

- `start.html`: outside the app; the organization's name and idea in a sentence, templates by pack, Watar's three
  questions, then the four steps it runs.
- `built.html`: what Watar built, reviewed before anyone is invited: the line, departments, fields, invitations, permissions.
- `lines.html`: the canvas. The line as a metro map with its draft drawn in the dashed pen; the selected block's people
  and roles (`#people`), what each role sees (`#sees`) and its settings (`#settings`); `?block=`,
  `?view=role:<role>|person:<key>`. People apply at once (`iqaa-people:<org>:<line>`); the rest is the draft
  (`iqaa-draft:<org>:<line>`).
- `publish.html`: what changed since the published version, where live items go, the check; publishing writes
  `iqaa-published:<org>:<line>`.
- `signin.html`: Al-Khatt's own sign-in; `#signed-in` plays the success as Heba and opens My work.
- `work.html`: My work: in progress, new for you, open to claim; starting, claiming and handing over are kept for the
  visit under `iqaa-moves`.
- `notify.html`: what reached the person (sent back, given, waiting for their approval, late; for the owner also
  invitations and expired integrations), unread until opened (`iqaa-read:<org>:<person>`), and the organization's channel.
- `item.html?code=MAD-26-0144`: one template for any item (a piece with its video versions; `?code=DEV-26-0088` a
  ticket with its pull request and checks); tabs by hash (`#work`, `#files`, `#discussion`, `#log`, `#platforms`, `#code`).
- `queue.html?block=montage`: a block's queue for its lead, `?view=list|board`; assigning and approving.
- `home.html`: the owner's Home: the core's and the pack's numbers, where work stands block by block, what waits for a
  decision, Watar's suggestion; `?org=wamda` shows an agency's.
- `people.html`: departments, teams and people with their roles in the blocks, `?dept=`; inviting is kept under
  `iqaa-people:<org>`.
- `reports.html`: the core's numbers from the line's log, block by block, then the pack's results (`#line`, `#results`).
- `packs.html`: settings: packs, integrations, the organization's light identity, the month's usage.
- `review.html?code=MAD-26-0142`: the client's link, without an account: the piece, comments pinned to moments of
  the video, and one decision (`iqaa-review:<code>`).
- `automate.html`: the quick news line block by block in its five modes, limits, a fallback person, stop and publish
  (`iqaa-draft:<org>:news`, `iqaa-published:…`, `iqaa-stop:…`).
- `sources.html`: RSS, webhooks, channels, schedules and other lines, each with its field map and every attempt
  today, `?source=`.
- `templates.html`: templates for what the machine makes, versioned and approved in a person's name, `?t=`.
- `integrations.html`: each connection's state and the log of events in and out, with a manual re-run.

`research/qa.html?w=&h=&src=<page>` frames a screen at a size for headless captures; `tools/screens.py` lists the
states the book shows (`python -I tools/screens.py work lines` captures just those).

## Real and illustrative

Real: the client's four colours, the product facts and the 22 screens (the owner's full plan and designs).
Illustrative and labelled: the demo organizations in world.js and their numbers (Masar's and the Software pack's
counts are invented), the steps inside each station in the book's signatures (`tools/lines.json`: the same three
organizations' lines, keyed media, software and agency, each with its initial and address), sample chart data. Bracketed placeholders stand for facts that do not exist yet (names, prices, addresses).

## Open

Trademark clearance (Retm / رتم and Eqa'a found earlier, no search made); the Arabic partner face (shortlist
on type.html; the product screens use Readex Pro until it is chosen); the Arabic and Turkish wording has not been
read by a native editor.
