"""The book's Screens page: the product screens of the digital production family, in the order an organization meets them,
each with where the identity lives in it. Images come from tools/screens.py; every screen links to the live one.
"""
from shell import esc, head

SCREENS = [
    {
        'id': 'start', 'name': 'Start from a sentence', 'url': 'iqaa.app/start', 'href': 'start.html',
        'open': 'Open Start',
        'what': 'The owner writes the organization’s name and what it makes, in their own words. Watar asks at most three questions, chosen from the idea, and builds the line as a draft.',
        'ids': [
            'The four fixed steps are shown before they run, each a dashed stroke the pen writes in ink when it is done.',
            'Watar never publishes: everything it builds waits for a person, in the dashed grey pen.',
            'The templates come from the packs: Media and Software now, the agency and service packs marked as coming.',
        ],
        'alt_d': 'Start on a desktop: the organization’s name, its idea in a sentence, the templates, Watar’s questions and the four steps it will run.',
        'alt_m': 'Start on a phone: the name and the idea, then the templates.',
    },
    {
        'id': 'built', 'name': 'Review what Watar built', 'url': 'alkhatt.iqaa.co/built', 'href': 'built.html?org=alkhatt',
        'open': 'Open the review',
        'what': 'Before the team is invited, the owner reads what Watar built, in the organization’s own words: the line, its departments, the item’s fields, the invitations by role, and who may do what.',
        'ids': [
            'The whole proposal hangs from one dashed grey pen down its edge, Watar’s pen, until the owner accepts it.',
            'The line is drawn in its own strokes, with the check written under it: no closed roads, every approval has a way back.',
            'The sensitive field carries a lock and is hidden from the people who do the work, before anyone asks.',
        ],
        'alt_d': 'Reviewing Al-Khatt Media’s line on a desktop: Watar’s account, the line in the dashed pen, the departments, fields and suggested invitations.',
        'alt_m': 'The review on a phone: Watar’s account and the line.',
    },
    {
        'id': 'lines', 'name': 'Build the line on the canvas', 'url': 'alkhatt.iqaa.co/lines', 'href': 'lines.html?org=alkhatt',
        'open': 'Open the canvas',
        'what': 'The owner sees the line as a metro map, edits its blocks, and gives each block its people and roles, what each role sees, and how it runs. People apply at once; everything else waits for the next version.',
        'ids': [
            'Every block is an interchange ring with its stroke, its department and its people; Design leaves at 45° and rejoins, a way back runs under the line.',
            'What the draft adds is drawn in the dashed grey pen; a removed block stays faded with the pieces still in it in red.',
            'What each role sees is one table of fields and actions, with a preview: “This is how a Video editor sees this block”.',
        ],
        'alt_d': 'The canvas on a desktop: Al-Khatt’s content production line with Subtitles added in the dashed pen, Colour grading removed, and Montage’s people and roles.',
        'alt_m': 'The canvas on a phone, for viewing: the line down the screen with each block’s roles and people.',
    },
    {
        'id': 'network', 'name': 'The network of lines', 'url': 'alkhatt.iqaa.co/lines/network', 'href': 'network.html?org=alkhatt',
        'open': 'Open the network',
        'what': 'Lines connect three ways, as the plan has it: a call opens an item in another line and waits for its result, a launch opens work there and goes on, an aggregate makes many items one. Every line declares what comes in and goes out.',
        'ids': [
            'What feeds the main line sits above it and what it feeds below, so every link joins neighbouring rows.',
            'A call is a line there and a half-weight way back to where it waits; a launch has an arrow; an aggregate is three thin lines becoming one.',
            'Each link is also said in one line under the map, with how many items it carried.',
        ],
        'alt_d': 'Al-Khatt Media’s network on a desktop: client requests and the quick news line feed the content line, which feeds the monthly invoices.',
        'alt_m': 'The network on a phone: the lines stacked, and each link in words.',
    },
    {
        'id': 'publish', 'name': 'Publish a new version', 'url': 'alkhatt.iqaa.co/lines/publish', 'href': 'publish.html?org=alkhatt',
        'open': 'Open publishing',
        'what': 'What changed since the published version, in the organization’s words; where the live items go; and the same check that runs on every publish, for every organization.',
        'ids': [
            'The new version is drawn with what it adds in the dashed grey pen; publishing writes it in ink.',
            'Nothing moves under anyone’s hands by default: live items finish on the version they started on.',
            'An item in a removed block must have a place before publishing; the button says why it waits.',
        ],
        'alt_d': 'Publishing version 5 on a desktop: the three changes, the new line, the twenty live pieces and the check.',
        'alt_m': 'Publishing on a phone: the changes and the choice for live pieces.',
    },
    {
        'id': 'signin', 'name': 'Arrive at your organization', 'url': 'alkhatt.iqaa.co', 'href': 'signin.html',
        'open': 'Open sign-in',
        'what': 'The people who work the line sign in on their organization’s own address, often on a phone.',
        'ids': [
            'The organization leads: its mark signs itself as the card opens, its initial in the page’s own letters, and Iqaa signs off at the foot.',
            'The check runs as a stroke ticking on the beat inside the button.',
            'Once you are in, the pen writes the organization’s line across the card and marks your block.',
        ],
        'alt_d': 'Sign-in after success on a desktop: Al-Khatt’s line written across the card with Heba’s block, Montage, marked, and three pieces waiting for her.',
        'alt_m': 'Sign-in on a phone: Al-Khatt’s mark and name, two fields and the violet button.',
    },
    {
        'id': 'work', 'name': 'My work', 'url': 'alkhatt.iqaa.co/my-work', 'href': 'work.html?org=alkhatt&as=heba',
        'open': 'Open My work',
        'what': 'The screen people open dozens of times a day, deliberately simple: what is in progress, what is new for you, and what is open for your role to claim.',
        'ids': [
            'Each item carries its line as one pen stroke: done in colour, its block underlined, the rest in the dashed grey pen.',
            'Red and nothing else for what is late; a piece sent back says who sent it, from where, and why.',
            'Starting and claiming are a person’s act, so the violet stays with the person; both can be undone.',
        ],
        'alt_d': 'My work on a desktop: Heba’s three pieces in progress and new, three open to claim, and where she works beside them.',
        'alt_m': 'My work on a phone: the lists with one action each, and the tab bar.',
    },
    {
        'id': 'notify', 'name': 'Notifications', 'url': 'alkhatt.iqaa.co/notifications', 'href': 'notify.html?org=alkhatt&as=heba',
        'open': 'Open Notifications',
        'what': 'What reached the person, newest first: sent back, given, waiting for their approval, late; for the owner also invitations and expired integrations. One of the three screens the phone frame keeps for everyone.',
        'ids': [
            'Each notice is one line with its icon; what failed or is late is the only red.',
            'Unread is a violet dot and a heavier line until it is opened: a person’s matter.',
            'The organization’s channel (Telegram here) says where the same notices also go.',
        ],
        'alt_d': 'Heba’s notifications on a desktop: given Five dishes from Bethlehem, sent back the glassblowers, and the late piece.',
        'alt_m': 'Omar’s notifications on a phone: two pieces handed over for his approval.',
    },
    {
        'id': 'me', 'name': 'My space', 'url': 'alkhatt.iqaa.co/me', 'href': 'me.html?org=alkhatt&as=heba',
        'open': 'Open My space',
        'what': 'The person as the line knows them: their week in hours, the steps they took each day, the blocks they hold a role in, their skills from the organization’s list, and where their notices go.',
        'ids': [
            'The week is seven bars counted from every item’s log; today is ink.',
            'Each block carries its stroke and what is theirs there.',
            'Skills come from the organization’s own list, theirs filled.',
        ],
        'alt_d': 'Heba’s space on a desktop: 35 hours a week, six steps this week, Montage, her skills and Telegram.',
        'alt_m': 'Omar’s space on a phone: his week, his three blocks and his skills.',
    },
    {
        'id': 'item', 'name': 'The item page', 'url': 'alkhatt.iqaa.co/pieces/MAD-26-0144', 'href': 'item.html?code=MAD-26-0144',
        'open': 'Open the piece',
        'what': 'One template for every organization: a piece with its video versions for a video editor, a ticket with its pull request and checks for a developer. The fields are the role’s own; the rest never reaches the browser.',
        'ids': [
            'The line runs across the top with every block named in its stroke and the item’s place underlined.',
            'The one primary action is named by the next block (“Hand over to Colour grading”), and says when a lead approves it first.',
            'Watar’s tools draft in the dashed grey pen; nothing changes until a person accepts.',
        ],
        'alt_d': 'A piece on a desktop: the glassblowers of Hebron, sent back from management review, its video version 3, its script and what is hidden from the video editor.',
        'alt_m': 'A ticket on a phone: sign in with a phone number, its pull request with four checks passed and one running, and the hand-over fixed at the bottom.',
    },
    {
        'id': 'queue', 'name': 'A block’s queue', 'url': 'alkhatt.iqaa.co/blocks/montage', 'href': 'queue.html?org=alkhatt&as=omar&block=montage',
        'open': 'Open the queue',
        'what': 'The head of a department’s space: every item in the block, nobody’s yet, each person’s, and what waits for the lead’s approval.',
        'ids': [
            'Each card carries its line as one stroke and the two fields the lead may see; the budget shows to the lead and never to an editor.',
            'Approving is violet, a person’s act; giving work out puts who has the skill first.',
            'A freelancer shows until when; no workload number is invented where the data cannot give one.',
        ],
        'alt_d': 'Montage’s queue on a desktop: three unassigned pieces, Heba’s, Laith’s and Dana’s columns, and two pieces waiting for Omar’s approval.',
        'alt_m': 'The queue on a phone: one column at a time with a switcher.',
    },
    {
        'id': 'home', 'name': 'The owner’s home', 'url': 'alkhatt.iqaa.co', 'href': 'home.html?org=alkhatt',
        'open': 'Open Home',
        'what': 'The most important board for any owner: the core’s numbers, the pack’s numbers, where work stands on the line block by block, what waits for a decision, and Watar’s suggestion from the line’s own log.',
        'ids': [
            'Every block is a row with its stroke and a bar against the time it expects; the bottleneck is the one red row.',
            'Watar’s suggestion is drawn in the dashed grey pen: an approval of the script before Montage, because 38% of pieces came back over it.',
            'The same Home tells another story for another organization: for an agency, spend and return on ads.',
        ],
        'alt_d': 'Al-Khatt’s Home on a desktop: 35 live pieces on 3 lines, Montage slower than expected, Za’atar season waiting for Khaled, and Watar’s suggestion.',
        'alt_m': 'An agency’s Home on a phone: Wamda’s numbers, spend and return, from the same screen.',
    },
    {
        'id': 'people', 'name': 'People and departments', 'url': 'alkhatt.iqaa.co/people', 'href': 'people.html?org=alkhatt',
        'open': 'Open People',
        'what': 'The departments and teams, each person, their skills and hours, and where they work: one line that reveals every permission they hold.',
        'ids': [
            'A title is free text and gives no permission; what a person may do comes from their role in each block, shown with the block’s stroke.',
            'Someone invited and not joined yet is drawn in the dashed grey pen until they arrive.',
            'A new member inherits every permission of their team: the rule is written on the screen, not in a manual.',
        ],
        'alt_d': 'People on a desktop: Production’s Montage and Design teams, each person with their roles in the blocks.',
        'alt_m': 'People on a phone: one card per person.',
    },
    {
        'id': 'reports', 'name': 'Reports of the line', 'url': 'alkhatt.iqaa.co/reports', 'href': 'reports.html?org=alkhatt',
        'open': 'Open Reports',
        'what': 'The core’s numbers from the line’s log, the same for every organization with nothing to set up, then the pack’s results after delivery.',
        'ids': [
            'One row per block in the line’s order, with its stroke, its time against what it expects, and what came back.',
            'The bottleneck is the only red on the page, with its cause in one line.',
            'Results belong to the pack: reach and engagement for media, bugs after release for software.',
        ],
        'alt_d': 'Reports on a desktop: 128 pieces finished, 4.2 days on average, Montage the bottleneck at 41 hours against 24.',
        'alt_m': 'Reports on a phone: the four numbers and the blocks.',
    },
    {
        'id': 'packs', 'name': 'Packs and integrations', 'url': 'alkhatt.iqaa.co/settings', 'href': 'packs.html?org=alkhatt',
        'open': 'Open Settings',
        'what': 'The only way to customize: a pack adds blocks, screens and reports and never changes the core. Its integrations, the organization’s light identity, and the month’s usage.',
        'ids': [
            'The organization’s identity is light: a mark, an address and a language; Iqaa’s own look stays as it is.',
            'An expired permission is the one red: what goes to it waits until someone reconnects.',
            'Usage is an example, said so in the dashed grey pen down its edge.',
        ],
        'alt_d': 'Settings on a desktop: the media pack on, the software and agency packs after the event, five integrations with Instagram to reconnect.',
        'alt_m': 'Settings on a phone: the packs and the integrations.',
    },
    {
        'id': 'review', 'name': 'The client reviews from a link', 'url': 'alkhatt.iqaa.co/r/MAD-26-0142', 'href': 'review.html?code=MAD-26-0142',
        'open': 'Open the client’s link',
        'what': 'The client opens a signed, temporary link without an account: the piece, its video with comments pinned to moments, and one decision.',
        'ids': [
            'The organization leads with its own mark and name; Iqaa signs off once at the foot.',
            'Comments sit on the video’s timeline at their moment, in violet: the client’s own hand.',
            'Approving or asking for changes moves the piece on the line, which the team sees at once.',
        ],
        'alt_d': 'The client’s link on a desktop: the old market of Jerusalem, version 2, two comments at 0:42 and 1:15, and Approve or Ask for changes.',
        'alt_m': 'The client’s link on a phone: the video, the comments and the decision.',
    },
    {
        'id': 'automate', 'name': 'Turn a step into automation', 'url': 'alkhatt.iqaa.co/automation', 'href': 'automate.html?org=alkhatt',
        'open': 'Open Automation',
        'what': 'The quick news line: a source comes in, the machine filters, refines and makes a carousel, a person reviews, and it is published on Telegram. Each block runs in one of five modes, with limits, a stop button and a person to fall back on.',
        'ids': [
            'The machine’s work is ink, the grammar’s straight run; a person’s is violet; the line stays the same when a step turns automatic.',
            'Stopping is immediate, for a block or the whole line, without publishing a version; pending work goes to people.',
            'Fully automatic is never published without a named person’s acceptance, a daily cap and a budget.',
        ],
        'alt_d': 'Automation on a desktop: the quick news line from a webhook to Telegram, each block with its mode, and Refine the text open.',
        'alt_m': 'Automation on a phone: the line and the selected block’s mode.',
    },
    {
        'id': 'sources', 'name': 'Sources and what came in', 'url': 'alkhatt.iqaa.co/sources', 'href': 'sources.html?org=alkhatt',
        'open': 'Open Sources',
        'what': 'RSS, webhooks, channels, schedules and other lines: each source, its setup, and every attempt that came in today, even the ones turned away, with the reason.',
        'ids': [
            'Everything that came in is written down, so “why didn’t it come in?” always has an answer.',
            'Nothing enters the line twice: a duplicate is shown, not added.',
            'The field map is Watar’s suggestion in the dashed grey pen until a person approves it.',
        ],
        'alt_d': 'Sources on a desktop: five sources, the partner’s webhook open, and today’s arrivals.',
        'alt_m': 'Sources on a phone: the sources and what came in.',
    },
    {
        'id': 'templates', 'name': 'Templates', 'url': 'alkhatt.iqaa.co/templates', 'href': 'templates.html?org=alkhatt',
        'open': 'Open Templates',
        'what': 'Templates for what the machine makes: uploaded, from the catalogue, or built by Watar — each a structured description with slots, never code, and approved in a person’s name.',
        'ids': [
            'An approved template never changes; every edit is a new version, and every output keeps the version it was made from.',
            'A draft template is drawn in the dashed grey pen and makes nothing until a person approves it.',
            'The preview uses a real item, in Arabic, at every size it is made in.',
        ],
        'alt_d': 'Templates on a desktop: the news carousel, version 2, its slots and a preview with a real story.',
        'alt_m': 'Templates on a phone: the list and the preview.',
    },
    {
        'id': 'integrations', 'name': 'Integrations', 'url': 'alkhatt.iqaa.co/integrations', 'href': 'integrations.html?org=alkhatt',
        'open': 'Open Integrations',
        'what': 'Iqaa works with the tools teams already use: each connection’s state, and the log of every event in and out, with a manual re-run.',
        'ids': [
            'A failure never stops the work: what failed is shown in red, the team carries on in Iqaa, and what waited goes out later.',
            'Checks are read the general way, so any tool that posts its results there shows in the block.',
            'In and out are written down with no duplicates, so a re-run never posts twice.',
        ],
        'alt_d': 'Integrations on a desktop: GitHub, Slack, Telegram, Google, Instagram to reconnect, webhooks, and the event log.',
        'alt_m': 'Integrations on a phone: the connections and the log.',
    },
]
COUNT = {21: 'Twenty-one', 19: 'Nineteen', 20: 'Twenty', 7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten', 11: 'Eleven', 12: 'Twelve', 13: 'Thirteen', 14: 'Fourteen', 15: 'Fifteen', 16: 'Sixteen', 17: 'Seventeen', 18: 'Eighteen'}


def screens():
    out = head('Screens', 'The identity at work', f'{COUNT[len(SCREENS)]} screens of the product, in the order an organization meets them: the owner writes a sentence and Watar builds the line; the owner reviews it, shapes it on the canvas and publishes it; the team signs in and works from My work, Notifications, My space and the item page, and leads run their block’s queue; the owner sees Home, the people, the reports and the settings; clients answer from a link; and what repeats turns into automation, fed by sources and templates through integrations. The demo is two organizations from the owner’s own screens, Al-Khatt Media and Masar, with an agency, Wamda. The identity is not painted on top; it is how each screen says where work stands. Every image opens the live screen.')
    out += '</div>'
    for i, s in enumerate(SCREENS):
        ids = ''.join(f'<li>{esc(t)}</li>' for t in s['ids'])
        out += f'''<section class="scr{' flip' if i % 2 else ''}" id="{s['id']}" aria-labelledby="scr-{s['id']}">
<div class="wrap scr-in">
<div class="scr-t">
<h2 id="scr-{s['id']}">{esc(s['name'])}</h2>
<p class="scr-u"><code>{esc(s['url'])}</code></p>
<p class="scr-what">{esc(s['what'])}</p>
<h3>Where the identity lives</h3>
<ul class="scr-ids">{ids}</ul>
<a class="btn" href="{s['href']}">{esc(s['open'])}</a>
</div>
<a class="scr-stage" href="{s['href']}" aria-label="{esc(s['open'])}">
<figure class="scr-d"><span class="scr-bar" aria-hidden="true"><code>{esc(s['url'])}</code></span><img src="assets/screens/{s['id']}-d.webp" width="1440" height="900" alt="{esc(s['alt_d'])}" loading="{'eager' if i == 0 else 'lazy'}" decoding="async"></figure>
<figure class="scr-m"><img src="assets/screens/{s['id']}-m.webp" width="750" height="1624" alt="{esc(s['alt_m'])}" loading="lazy" decoding="async"></figure>
</a>
</div>
</section>'''
    return out
