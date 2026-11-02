"""People and departments (الأقسام والأشخاص), the owner's view of who is in the organization and what each may do. The
departments in one strip, each with its people, teams and blocks; the one chosen shows its teams, each with what a new
member inherits, and its people in a table whose last columns say where each works (every permission they hold, read
from the blocks' roles) and whether they have joined. A new department and an invitation work for the visit. The
strip, the tables and the forms are rendered by assets/js/people.js from world.js.
"""
from i18n import t
from p_auth import runs_badge, shell
from p_ct import icon
from p_frame import frame


def people():
    body = f'''<div class="pp-page ap-wrap">
<header class="pp-head">
<div class="pp-ht"><h1>{t('People and departments')}</h1><p class="pp-sum" data-sum></p></div>
<div class="pp-acts" data-acts><button type="button" class="btn" data-open="dept" aria-expanded="false" aria-controls="pp-panel">{icon('Create', 20)}<span>{t('New department')}</span></button><button type="button" class="btn primary" data-open="invite" aria-expanded="false" aria-controls="pp-panel">{icon('Invite', 20)}<span>{t('Invite a person')}</span></button></div>
</header>
<div class="pp-live" role="status"><p class="pp-note" data-note hidden><span data-note-t></span><button type="button" class="link" data-undo>{t('Undo')}</button></p></div>
<div class="pp-panel" id="pp-panel" data-panel hidden></div>
<nav class="pp-depts" aria-label="{t('Departments')}" data-depts></nav>
<div class="pp-dept" data-detail></div>
</div>'''
    return shell('pp', t('People and departments'), frame('People and departments', 'people'), body, ('world', 'flow', 'people', 'frame'),
                 foot=f'<div class="sign-off">{runs_badge()}</div>', css=('app', 'people'))
