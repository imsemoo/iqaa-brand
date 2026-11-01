---
version: 1
slug: "today-html"
primary_target: "today.html"
related_targets: ["signin.html", "line.html"]
---

Scope: the Today screen of an organization's app (Sufra, sufra.iqaa.app/today), the first screen after sign-in. Mode: Operate.
Audience: the people who work the line (Reem on quotes and new orders, Salma in the kitchen, Yusuf on delivery, Hala buying), often on a phone.
Task: see what waits for you, do your step (approve Watar's draft, or tick the checklist and mark it done), hand the job on; see what is coming and what you did.
Constraints: identity book binding (signature strokes, violet only for a person, Atkinson + Fragment Mono for codes and times, 600 ms beat). The Line screen's metro map. Nothing presented as live; totals and prices stay in brackets.

## Direction contract

THESIS: your station as a platform board. Waiting for you (on the platform now), coming to you (arriving), done today (left). Each job carries a metro strip of the line: your stations ringed violet, the job a filled stop. Refuses kanban columns, a task inbox with priority flags, and dashboard tiles with counts.

STORY: the day writes its own signature: every step you finish adds a loop to the line in the page head, and the steps that run by themselves after it add their straights.

SIGNATURE INTERACTION: the handoff. Finishing your part sends the job's stop along its strip to the next station, the row closes, and the job lands in Done today with "Take it back" (a handoff can be taken back).

FACTS: the demo day is Sunday 1 November with its own clock from 09:41; the jobs, people and morning's work come from assets/js/sufra.js, the same world the Line screen shows.
