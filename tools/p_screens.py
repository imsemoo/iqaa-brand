"""The book's Screens page: the four product screens built so far, in the order an organization meets them,
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
]


def screens():
    out = head('Screens', 'The identity at work', 'Six screens of the product, in the order an organization meets them: the owner starts it and builds the line, the team signs in and works the day, and the owner sees the whole organization and follows every order. The identity is not painted on top; it is how each screen says where work stands. Every image opens the live screen.')
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
