"""The book's Screens page: the product screens built so far, in the order an organization meets them,
each with where the identity lives in it. Images come from tools/screens.py; every screen links to the live one.
"""
from shell import esc, head

SCREENS = [
    {
        'id': 'signup', 'name': 'Start an organization', 'url': 'iqaa.app/start', 'href': 'signup.html',
        'open': 'Open sign-up',
        'what': 'An owner names the organization, describes the work in a sentence or picks a field, and approves the line every job will walk.',
        'ids': [
            'Sign-up is itself a line of three stations; the stretch behind you fills in as you go.',
            'Watar’s draft arrives in the dashed grey pen: nothing is real until a person approves it.',
            'Approving writes the line in one stroke and signs the organization’s mark, the one its team will see at sign-in.',
        ],
        'alt_d': 'Sign-up, third step on a desktop: Sufra’s line as stations of strokes, with the sign-in its team will see beside it.',
        'alt_m': 'Sign-up finished on a phone: Sufra’s signature written out and its mark, an S signed with the opening of its line.',
    },
    {
        'id': 'line', 'name': 'Build the line', 'url': 'sufra.iqaa.app/line', 'href': 'line.html',
        'open': 'Open the line',
        'what': 'The owner sees every job’s route at once, edits stations and steps, adds a branch or a way back, tests it and publishes a version.',
        'ids': [
            'The line is drawn as a metro map: every station an interchange ring, branches at 45°, a way back as a square U-turn.',
            'The signature stays the line’s name in the head; publishing a new version writes the new one.',
            'A test job walks the map and leaves the dashed grey trail of things not real yet. Nothing is sent.',
        ],
        'alt_d': 'The Line screen on a desktop after a test job: a metro map of seven stations with a way back and a branch, the trail dashed grey.',
        'alt_m': 'The Line screen on a phone: the map turned vertical, the open station’s steps beside the rail.',
    },
    {
        'id': 'build', 'name': 'Build it freely', 'url': 'sufra.iqaa.app/line/build', 'href': 'build.html',
        'open': 'Open Build',
        'what': 'The line on Iqaa’s own drawing board: stations placed anywhere, steps dragged in from a library that reads like the grammar, Watar drafting changes from a sentence, and a test job walking it.',
        'ids': [
            'Not boxes and wires: each station is a metro ring with its steps hanging under it in their own strokes, on the identity’s construction grid.',
            'Track routes itself from ring to ring through the gaps, never across a step; a way back runs under the stations it passes.',
            'Watar’s drafts arrive in the dashed grey pen until accepted; anything that would stop a job snaps red where it is.',
        ],
        'alt_d': 'Build on a desktop: the library by strokes, Sufra’s stations as metro rings with their steps hanging under them, and the selected station’s settings.',
        'alt_m': 'Build on a phone: the canvas above, the library and settings below.',
    },
    {
        'id': 'signin', 'name': 'Arrive at your organization', 'url': 'sufra.iqaa.app', 'href': 'signin.html',
        'open': 'Open sign-in',
        'what': 'The people who work the line sign in on their organization’s own address, often on a phone.',
        'ids': [
            'Sufra leads: its mark signs itself as the card opens, and Iqaa signs off at the foot of the page.',
            'The check runs as a stroke ticking on the beat inside the button.',
            'Once you are in, the pen writes Sufra’s line across the card and marks your station.',
        ],
        'alt_d': 'Sign-in after success on a desktop: Sufra’s line written across the card with Reem’s station, Quote, marked.',
        'alt_m': 'Sign-in on a phone: Sufra’s mark and name, two fields and the violet button.',
    },
    {
        'id': 'today', 'name': 'Work the day', 'url': 'sufra.iqaa.app/today', 'href': 'today.html',
        'open': 'Open Today',
        'what': 'Each person’s station as a platform board: what waits for you now, what is coming to you, what you handed on.',
        'ids': [
            'Your day is a line in time: every step you finish is written at its hour, and what is still yours waits ahead in grey.',
            'Each job carries its metro strip: your stations ringed violet, the job a filled stop.',
            'Finishing your part sends the job along its strip to the next station; a handoff can be taken back.',
        ],
        'alt_d': 'Today on a desktop: Reem’s day as a line in time, the jobs waiting at Quote, and what is coming and done beside them.',
        'alt_m': 'Today on a phone: the greeting, the day’s line in time and the first job open with Watar’s draft.',
    },
    {
        'id': 'overview', 'name': 'See the whole organization', 'url': 'sufra.iqaa.app', 'href': 'overview.html',
        'open': 'Open Overview',
        'what': 'The owner’s first screen: where the jobs are on the line, what the team has done today and what is still theirs, and what needs attention.',
        'ids': [
            'The line’s load is a metro map with a count over each station; pressing one opens those orders.',
            'Each person’s day is a line in time on one shared clock: finished steps at their hour, the rest in grey after now.',
            'The app frame is Sufra’s: its mark leads the sidebar, the icons are drawn with the line’s strokes.',
        ],
        'alt_d': 'Overview on a desktop: the sidebar, the line with a count over each station, the team’s day as four lines in time, and orders due by tomorrow.',
        'alt_m': 'Overview on a phone: the greeting, the line’s load and the team’s day, with the tab bar along the bottom.',
    },
    {
        'id': 'inbox', 'name': 'Take in what arrives', 'url': 'sufra.iqaa.app/inbox', 'href': 'inbox.html',
        'open': 'Open the Inbox',
        'what': 'Emails and form entries reach the organization before they are orders. Watar reads each one into a draft order; a person makes the order, which joins the line at Quote, or sets the message aside.',
        'ids': [
            'Watar’s draft waits in the dashed grey pen, and the words it read every field from are underlined in the same grey, where they stand in the message.',
            'A field Watar could not read is left open in the draft’s own dashed pen, for a person to fill before the order can be made.',
            'Making the order is a person’s violet button: the order joins the line at Quote and is on Orders, Today and Clients at once.',
        ],
        'alt_d': 'The Inbox on a desktop: three messages beside Dr Nadia’s email, and Watar’s draft order with the words it read underlined.',
        'alt_m': 'The Inbox on a phone: Tamer Saad’s order form with the words Watar read underlined, and its draft for a new client.',
    },
    {
        'id': 'orders', 'name': 'Follow every order', 'url': 'sufra.iqaa.app/orders', 'href': 'orders.html',
        'open': 'Open Orders',
        'what': 'The owner sees every job on the line, finds one in a second, and opens it to see where it stands and what is left.',
        'ids': [
            'The line itself is the filter: each station shows how many jobs are there, and pressing it lists only those.',
            'Every row carries the job’s metro strip; the stop is violet when it waits for a person, ink when it runs by itself.',
            'An order page writes the job’s own line in time: done as real strokes, the pen where the job is, the rest in grey.',
        ],
        'alt_d': 'Orders on a desktop: Sufra’s line with a count over each station, and every job below with its strip, due time and who it waits for.',
        'alt_m': 'An order on a phone: the wedding lunch, its line written in time and its stations down the page.',
    },
    {
        'id': 'clients', 'name': 'Know every client', 'url': 'sufra.iqaa.app/clients', 'href': 'clients.html',
        'open': 'Open Clients',
        'what': 'The owner sees whose move it is with every client, and opens one to see its open order, its line with Sufra and every order before.',
        'ids': [
            'Each client’s history is written in the signature’s hand: an arch for every answer Sufra waited for, a lifted pen and a straight where Iqaa had to remind them, a red snap where Sufra arrived late.',
            'History is evidence at the step it predicts: under “Omar approves”, that Omar answered both earlier quotes only after the reminder.',
            'The decision is violet, the act is ink: reminding Omar early is a person’s button, and the pen writes the reminder into his line.',
        ],
        'alt_d': 'Clients on a desktop: every client grouped by whose move it is, each with its history in small strokes.',
        'alt_m': 'Darb Studio on a phone: its line with Sufra in strokes, and the open office lunch with Remind Omar now.',
    },
    {
        'id': 'watar', 'name': 'Ask Watar', 'url': 'sufra.iqaa.app/watar', 'href': 'watar.html',
        'open': 'Open Ask Watar',
        'what': 'Anyone on the team asks about the work in their own words; Watar answers from the line and its orders, and drafts what could be done for a person to approve.',
        'ids': [
            'Watar speaks in grey, behind its own arch; violet marks only what waits for a person: a draft’s arch, Approve, the asker.',
            'A risk is drawn as the grammar’s lifted pen at its real length: the lunch falls under the pen, and the reminder lands after it.',
            'Every draft is written in the dashed grey pen down its edge; approving rewrites the arch as a loop and the pen in ink.',
        ],
        'alt_d': 'Ask Watar on a desktop: who is late today, answered with two orders at risk, their time strips, and two drafts waiting for approval.',
        'alt_m': 'Ask Watar on a phone: why the Nakhla lunch is stuck, answered with its metro strip, its steps at Quote and the facts.',
    },
    {
        'id': 'settings', 'name': 'Set up the organization', 'url': 'sufra.iqaa.app/settings', 'href': 'settings.html',
        'open': 'Open Settings',
        'what': 'The owner sees who is on the team and what each holds on the line, how the line reaches clients, the organization’s name and mark, and what it pays Iqaa. Every change applies on its own and can be taken back.',
        'ids': [
            'Each person carries the line’s metro strip without a train, their stations ringed violet; removing someone stays locked while the line still gives them steps.',
            'An invitation is a short line: Iqaa’s straight, then an arch that waits for the person; accepting rewrites the arch as a loop.',
            'The mark is explained by the line that writes it, on an ink plate beside the opening that colours it, and shown only where and at the size it is really used.',
        ],
        'alt_d': 'Settings on a desktop: the four areas beside Team, each person with the stations they hold ringed on the line, and Nour’s invitation waiting.',
        'alt_m': 'Settings on a phone: the Organization area, Sufra’s S on an ink plate beside the two steps that colour it.',
    },
    {
        'id': 'quote', 'name': 'Answer from a link', 'url': 'sufra.iqaa.app/q/0030', 'href': 'quote.html?q=0030',
        'open': 'Open the client’s link',
        'what': 'The client opens Sufra’s link from an email, without an account: the quote with what is in it, one button to approve and one to ask for a change, and then the order itself until the invoice.',
        'ids': [
            'Sufra leads: its own mark and name at the top, and Iqaa signs off once at the foot.',
            'The client’s answer is an arch on the order’s line while it waits; approving is their hand, and the pen writes the arch as a loop.',
            'Beside the quote, only the steps that reach the client, in the line’s own strokes: done in ink, ahead in the dashed grey pen.',
        ],
        'alt_d': 'Omar’s link on a desktop: Sufra’s quote for the office lunch with Approve and Ask for a change, and beside it the order’s steps, his answer waiting as an arch.',
        'alt_m': 'Omar’s link on a phone: the quote, what is in it and the total, above the two answers.',
    },
]
COUNT = {7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten', 11: 'Eleven', 12: 'Twelve'}


def screens():
    out = head('Screens', 'The identity at work', f'{COUNT[len(SCREENS)]} screens of the product, in the order an organization meets them: the owner starts it and builds the line, the team signs in and works the day, the owner sees the whole organization, turns what arrives into orders, follows every order and knows every client, anyone can ask Watar about the work, the owner sets the organization up, and its clients answer from a link. The identity is not painted on top; it is how each screen says where work stands. Every image opens the live screen.')
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
