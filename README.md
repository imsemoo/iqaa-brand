# Iqaa (إيقاع) — brand identity

Static identity book for Iqaa, a SaaS platform that runs any organization's work as a line of people and
automatic steps. English first; Arabic and Turkish follow on the same rules. Not deployed.

Idea: **the line is the signature**, written with one pen: a straight stroke = a step that runs by itself,
a loop of the hand = a person does it, an open arch = it waits for a person, a pen lift and a dot = a timed
wait; between stations the pen runs half a step of straight, the handoff. Iqaa's mark is its own stroke (a
run, a loop, a rising finish); an organization's mark is its initial signed with the opening of its line.
Violet means a person; everything automatic is ink.

## Build

```
python -I tools/fetch_fonts.py   # candidate faces from google/fonts into research/font-src (gitignored)
python -I tools/font_facts.py    # measures them -> research/font-facts.json (the type decision)
python -I tools/fonts.py         # WOFF2 subsets of Atkinson Hyperlegible Next and Fragment Mono
python tools/build.py            # tokens, logo files and every page
python -I tools/shot.py mark.html research/shots/mark.png 1280 6000   # headless QA shot (preview on :8341)
```

Every number comes from `tools/tokens.py` (beat 16 px, tempo 100 BPM, type ratio 1.25, colours computed
in OKLCH) and every mark from `tools/brand.py`. Never edit the built HTML or the SVGs in `assets/brand/`;
bump `V` in `tools/shell.py` after a CSS or JS change.

## Pages

index · decisions (every choice with its measurement) · mark · signature (with a live generator) · colour ·
type · icons · motion (five playable moments) · system (Watar, architecture, co-branding, messages, product
proofs) · applications · guidelines (ten rules, do/don't, tokens, files, QC) · screens (the product screens on
stages, captured by `python -I tools/screens.py` into `assets/screens/`, preview running).

## Screens

signin (a tenant's sign-in, sufra.iqaa.app) · signup (self-serve: account, your work, your line) · today (one
person's station as a platform board: waiting, coming, done today; `?as=salma|yusuf|hala`) · line (the
Line screen of the app: the line as a metro map with branches and ways back, the selected station's steps,
a test job that sends nothing, versions) · clients (`clients.html`: every client grouped by whose move it is;
`client.html?c=darb-studio`: one client's line with Sufra, its open order with the history that bears on each step,
every order and the contact) · ask watar (`watar.html`: a conversation with Watar, answered in the browser by fixed
rules from the demo world; every action Watar drafts waits in the dashed grey pen for a person; `?as=`, and `?q=`
asks once on arrival) · settings (`settings.html#team|channels|organization|billing`: the team and its invitations,
the ways the line reaches clients with a preview of each message, the organization's name and mark, and billing;
every change applies on its own with Undo, in page memory; `?as=reem` shows a member's read-only view) · quote
(`quote.html?q=0030`: the client's link at sufra.iqaa.app/q/0030, opened without an account; Sufra's quote with
Approve and Ask for a change, then the order's steps that reach the client until the invoice; `?q=0035|0028|0027|0026`
show the other moments, and the answer is kept for the visit under `iqaa-answers`). All read
the Sufra demo world from `assets/js/sufra.js`, and every time comes from the one clock in `assets/js/jobs.js`.
`research/qa-line.html`, `research/qa-today.html` and `research/qa-watar.html` (`?w=&h=&do=`) drive the screens
through a scenario for headless captures.

## Real and illustrative

Real: the client's four colours, the station names of the three templates (client deck), the product facts
(build plan). Illustrative and labelled: the steps inside each station, the Sufra demo world, sample chart
data. Bracketed placeholders stand for facts that do not exist yet (names, prices, addresses).

## Open

Trademark clearance (Retm / رتم and Eqa'a found earlier, no search made); the Arabic partner face (shortlist
on type.html).
