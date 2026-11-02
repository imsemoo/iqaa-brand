"""Capture the product screens for the book's Screens page, as WebP files in assets/screens/.

python -I tools/screens.py   (the preview must be running on :8341; run tools/build.py first, then again after)
python -I tools/screens.py work lines   captures only those screens (both sizes)
Desktop states are 1440 x 900 at 1x; phone states are 375 x 812 at 2x, so they stay sharp in their frames.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image  # noqa: E402
from shell import ROOT  # noqa: E402
from shot import shot  # noqa: E402

# name: (page or scenario, width, height, scale)
STATES = {
    'start-d': ('research/qa.html?w=1440&h=900&src=start.html', 1440, 900, 1),
    'start-m': ('research/qa.html?w=375&h=812&src=start.html', 375, 812, 2),
    'built-d': ('research/qa.html?w=1440&h=900&src=built.html%3Forg%3Dalkhatt%26as%3Dkhaled', 1440, 900, 1),
    'built-m': ('research/qa.html?w=375&h=812&src=built.html%3Forg%3Dalkhatt%26as%3Dkhaled', 375, 812, 2),
    'lines-d': ('research/qa.html?w=1440&h=900&src=lines.html%3Forg%3Dalkhatt%26as%3Dkhaled', 1440, 900, 1),
    'lines-m': ('research/qa.html?w=375&h=812&src=lines.html%3Forg%3Dalkhatt%26as%3Dkhaled', 375, 812, 2),
    'network-d': ('research/qa.html?w=1440&h=900&src=network.html%3Forg%3Dalkhatt%26as%3Dkhaled', 1440, 900, 1),
    'network-m': ('research/qa.html?w=375&h=812&src=network.html%3Forg%3Dalkhatt%26as%3Dkhaled', 375, 812, 2),
    'publish-d': ('research/qa.html?w=1440&h=900&src=publish.html%3Forg%3Dalkhatt%26as%3Dkhaled', 1440, 900, 1),
    'publish-m': ('research/qa.html?w=375&h=812&src=publish.html%3Forg%3Dalkhatt%26as%3Dkhaled', 375, 812, 2),
    'signin-d': ('research/qa.html?w=1440&h=900&src=signin.html%23signed-in', 1440, 900, 1),
    'signin-m': ('research/qa.html?w=375&h=812&src=signin.html', 375, 812, 2),
    'work-d': ('research/qa.html?w=1440&h=900&src=work.html%3Forg%3Dalkhatt%26as%3Dheba', 1440, 900, 1),
    'work-m': ('research/qa.html?w=375&h=812&src=work.html%3Forg%3Dalkhatt%26as%3Dheba', 375, 812, 2),
    'notify-d': ('research/qa.html?w=1440&h=900&src=notify.html%3Forg%3Dalkhatt%26as%3Dheba', 1440, 900, 1),
    'notify-m': ('research/qa.html?w=375&h=812&src=notify.html%3Forg%3Dalkhatt%26as%3Domar', 375, 812, 2),
    'me-d': ('research/qa.html?w=1440&h=900&src=me.html%3Forg%3Dalkhatt%26as%3Dheba', 1440, 900, 1),
    'me-m': ('research/qa.html?w=375&h=812&src=me.html%3Forg%3Dalkhatt%26as%3Domar', 375, 812, 2),
    'item-d': ('research/qa.html?w=1440&h=900&src=item.html%3Fcode%3DMAD-26-0144', 1440, 900, 1),
    'item-m': ('research/qa.html?w=375&h=812&src=item.html%3Fcode%3DDEV-26-0088', 375, 812, 2),
    'queue-d': ('research/qa.html?w=1440&h=900&src=queue.html%3Forg%3Dalkhatt%26as%3Domar%26block%3Dmontage', 1440, 900, 1),
    'queue-m': ('research/qa.html?w=375&h=812&src=queue.html%3Forg%3Dalkhatt%26as%3Domar%26block%3Dmontage', 375, 812, 2),
    'home-d': ('research/qa.html?w=1440&h=900&src=home.html%3Forg%3Dalkhatt%26as%3Dkhaled', 1440, 900, 1),
    'home-m': ('research/qa.html?w=375&h=812&src=home.html%3Forg%3Dwamda', 375, 812, 2),
    'people-d': ('research/qa.html?w=1440&h=900&src=people.html%3Forg%3Dalkhatt%26as%3Dkhaled', 1440, 900, 1),
    'people-m': ('research/qa.html?w=375&h=812&src=people.html%3Forg%3Dalkhatt%26as%3Dkhaled', 375, 812, 2),
    'reports-d': ('research/qa.html?w=1440&h=900&src=reports.html%3Forg%3Dalkhatt%26as%3Dkhaled', 1440, 900, 1),
    'reports-m': ('research/qa.html?w=375&h=812&src=reports.html%3Forg%3Dalkhatt%26as%3Dkhaled', 375, 812, 2),
    'packs-d': ('research/qa.html?w=1440&h=900&src=packs.html%3Forg%3Dalkhatt%26as%3Dkhaled', 1440, 900, 1),
    'packs-m': ('research/qa.html?w=375&h=812&src=packs.html%3Forg%3Dalkhatt%26as%3Dkhaled', 375, 812, 2),
    'review-d': ('research/qa.html?w=1440&h=900&src=review.html%3Fcode%3DMAD-26-0142', 1440, 900, 1),
    'review-m': ('research/qa.html?w=375&h=812&src=review.html%3Fcode%3DMAD-26-0142', 375, 812, 2),
    'automate-d': ('research/qa.html?w=1440&h=900&src=automate.html%3Forg%3Dalkhatt%26as%3Dkhaled', 1440, 900, 1),
    'automate-m': ('research/qa.html?w=375&h=812&src=automate.html%3Forg%3Dalkhatt%26as%3Dkhaled', 375, 812, 2),
    'sources-d': ('research/qa.html?w=1440&h=900&src=sources.html%3Forg%3Dalkhatt%26as%3Dkhaled', 1440, 900, 1),
    'sources-m': ('research/qa.html?w=375&h=812&src=sources.html%3Forg%3Dalkhatt%26as%3Dkhaled', 375, 812, 2),
    'templates-d': ('research/qa.html?w=1440&h=900&src=templates.html%3Forg%3Dalkhatt%26as%3Dkhaled', 1440, 900, 1),
    'templates-m': ('research/qa.html?w=375&h=812&src=templates.html%3Forg%3Dalkhatt%26as%3Dkhaled', 375, 812, 2),
    'integrations-d': ('research/qa.html?w=1440&h=900&src=integrations.html%3Forg%3Dalkhatt%26as%3Dkhaled', 1440, 900, 1),
    'integrations-m': ('research/qa.html?w=375&h=812&src=integrations.html%3Forg%3Dalkhatt%26as%3Dkhaled', 375, 812, 2),
}


def capture(only=()):
    out = os.path.join(ROOT, 'assets', 'screens')
    tmp = os.path.join(ROOT, 'research', 'shots', 'screens')
    os.makedirs(out, exist_ok=True)
    os.makedirs(tmp, exist_ok=True)
    for name, (page, w, h, scale) in STATES.items():
        if only and name.rsplit('-', 1)[0] not in only:
            continue
        png = os.path.join(tmp, f'{name}.png')
        shot(page, png, w, h, True, scale)
        Image.open(png).convert('RGB').save(os.path.join(out, f'{name}.webp'), 'WEBP', quality=84, method=6)
        print(name, os.path.getsize(os.path.join(out, f'{name}.webp')) // 1024, 'KB')


if __name__ == '__main__':
    capture(sys.argv[1:])
