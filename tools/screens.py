"""Capture the product screens for the book's Screens page, as WebP files in assets/screens/.

python -I tools/screens.py   (the preview must be running on :8341; run tools/build.py first, then again after)
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
    'signin-d': ('research/qa.html?w=1440&h=900&src=signin.html%23signed-in', 1440, 900, 1),
    'signin-m': ('research/qa.html?w=375&h=812&src=signin.html', 375, 812, 2),
    'signup-d': ('research/qa.html?w=1440&h=900&src=signup.html%23line', 1440, 900, 1),
    'signup-m': ('research/qa.html?w=375&h=812&src=signup.html%23approved', 375, 812, 2),
    'line-d': ('research/qa-line.html?w=1440&h=900&do=test,run', 1440, 900, 1),
    'line-m': ('research/qa-line.html?w=375&h=812', 375, 812, 2),
    'today-d': ('research/qa-today.html?w=1440&h=900&do=approve', 1440, 900, 1),
    'today-m': ('research/qa-today.html?w=375&h=812', 375, 812, 2),
    'overview-d': ('research/qa.html?w=1440&h=900&src=overview.html', 1440, 900, 1),
    'overview-m': ('research/qa.html?w=375&h=812&src=overview.html', 375, 812, 2),
    'build-d': ('research/qa.html?w=1440&h=900&src=build.html', 1440, 900, 1),
    'build-m': ('research/qa.html?w=375&h=812&src=build.html', 375, 812, 2),
    'inbox-d': ('research/qa.html?w=1440&h=900&src=inbox.html', 1440, 900, 1),
    'inbox-m': ('research/qa.html?w=375&h=812&src=inbox.html%23m2', 375, 812, 2),
    'orders-d': ('research/qa.html?w=1440&h=900&src=orders.html', 1440, 900, 1),
    'orders-m': ('research/qa.html?w=375&h=812&src=order.html%3Fcode%3DSFR-26-0029', 375, 812, 2),
    'clients-d': ('research/qa.html?w=1440&h=900&src=clients.html', 1440, 900, 1),
    'clients-m': ('research/qa.html?w=375&h=812&src=client.html%3Fc%3Ddarb-studio', 375, 812, 2),
    'watar-d': ('research/qa-watar.html?w=1440&h=900&q=Who%20is%20late%20today%3F', 1440, 900, 1),
    'watar-m': ('research/qa-watar.html?w=375&h=812&q=Why%20is%20Nakhla%E2%80%99s%20order%20stuck%3F', 375, 812, 2),
    'settings-d': ('research/qa.html?w=1440&h=900&src=settings.html', 1440, 900, 1),
    'settings-m': ('research/qa.html?w=375&h=812&src=settings.html%23organization', 375, 812, 2),
    'quote-d': ('research/qa.html?w=1440&h=900&src=quote.html%3Fq%3D0030', 1440, 900, 1),
    'quote-m': ('research/qa.html?w=375&h=812&src=quote.html%3Fq%3D0030', 375, 812, 2),
}


def capture():
    out = os.path.join(ROOT, 'assets', 'screens')
    tmp = os.path.join(ROOT, 'research', 'shots', 'screens')
    os.makedirs(out, exist_ok=True)
    os.makedirs(tmp, exist_ok=True)
    for name, (page, w, h, scale) in STATES.items():
        png = os.path.join(tmp, f'{name}.png')
        shot(page, png, w, h, True, scale)
        Image.open(png).convert('RGB').save(os.path.join(out, f'{name}.webp'), 'WEBP', quality=84, method=6)
        print(name, os.path.getsize(os.path.join(out, f'{name}.webp')) // 1024, 'KB')


if __name__ == '__main__':
    capture()
