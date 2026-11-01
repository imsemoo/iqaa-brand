"""Iqaa's hand: capitals and figures drawn as single strokes, for the organization marks.

Each letter is written with the line's pen, so an organization's initial and its line are one drawing. The
skeletons sit on a cap height of 30 units (a loop's height), baseline at y = 0, y down, and are written in the
order a hand writes them. Round letters overshoot the cap height and the baseline by half a unit.

data() measures every stroke (length, bounds, the centre of its ink) for brand.py and the browser.
"""
import math
import re

CAP = 30

# A stroke is one path with no pen lift; a letter is its strokes in writing order.
HAND = {
    'A': ['M0 0L11 -30L22 0', 'M4.3 -10.6H17.7'],
    'B': ['M0 0V-30H8.4A7.3 7.3 0 0 1 8.4 -15.4', 'M0 -15.4H9.4A7.7 7.7 0 0 1 9.4 0H0'],
    'C': ['M22.1 -24.8A12.5 15.5 0 1 0 22.1 -5.2'],
    'D': ['M0 0V-30H5.5A14.5 15 0 0 1 5.5 0H0'],
    'E': ['M15.5 -30H0V0H16', 'M0 -15.4H12.6'],
    'F': ['M15.5 -30H0V0', 'M0 -15.4H12.6'],
    'G': ['M22.1 -24.8A12.5 15.5 0 1 0 25 -13.4H14.2'],
    'H': ['M0 -30V0', 'M19 -30V0', 'M0 -15.4H19'],
    'I': ['M-5 -30H5', 'M0 -30V0', 'M-5 0H5'],
    'J': ['M13 -30V-8.6C13 -3.2 10.4 0 6.6 0C3.7 0 1.5 -1.6 0.3 -4.4'],
    'K': ['M0 -30V0', 'M17.6 -30L1.6 -12.8', 'M6.9 -18.4L18 0'],
    'L': ['M0 -30V0H15'],
    'M': ['M0 0V-30L12 -8.5L24 -30V0'],
    'N': ['M0 0V-30L19 0V-30'],
    'O': ['M13 -30.5A13 15.5 0 1 0 13 0.5A13 15.5 0 1 0 13 -30.5'],
    'P': ['M0 0V-30H8.7A7.5 7.5 0 0 1 8.7 -15H0'],
    'Q': ['M13 -30.5A13 15.5 0 1 0 13 0.5A13 15.5 0 1 0 13 -30.5', 'M15.6 -6.8L23.8 1.8'],
    'R': ['M0 0V-30H8.7A7.5 7.5 0 0 1 8.7 -15H0', 'M8.2 -15L17.6 0'],
    'S': ['M16.6 -25.2C15 -28.6 12.4 -30.5 8.9 -30.5C4.6 -30.5 1.5 -27.8 1.5 -23.4C1.5 -18.8 5.3 -17.3 9.2 -16.1'
          'C13.5 -14.8 17 -13.1 17 -7.8C17 -3 13.4 0.5 8.8 0.5C5.1 0.5 2.3 -1.2 0.9 -4.6'],
    'T': ['M0 -30H20', 'M10 -30V0'],
    'U': ['M0 -30V-11A9.5 11.5 0 0 0 19 -11V-30'],
    'V': ['M0 -30L11 0L22 -30'],
    'W': ['M0 -30L7.4 0L15 -26L22.6 0L30 -30'],
    'X': ['M0.5 -30L20 0', 'M19.5 -30L0 0'],
    'Y': ['M0 -30L10.5 -14.6L21 -30', 'M10.5 -14.6V0'],
    'Z': ['M1 -30H19L0 0H20'],
    '0': ['M10 -30.5A10 15.5 0 1 0 10 0.5A10 15.5 0 1 0 10 -30.5'],
    '1': ['M2.8 -24.8L10 -30V0', 'M2.8 0H17.2'],
    '2': ['M1.4 -24.6C2.8 -28.4 5.9 -30.5 9.8 -30.5C14.4 -30.5 17.4 -27.4 17.4 -22.8C17.4 -18.6 14.7 -15.6 10.6 -12.1L0.8 0H18'],
    '3': ['M1.4 -26.2C3 -29 6 -30.5 9.4 -30.5C13.8 -30.5 16.8 -27.8 16.8 -23.8C16.8 -19.6 13.6 -16.8 8.6 -16.8'
          'C14.2 -16.8 17.6 -13.6 17.6 -8.4C17.6 -3.2 13.8 0.5 8.8 0.5C5 0.5 2 -1.2 0.4 -4.4'],
    '4': ['M13.4 0V-30L0 -9.2H19'],
    '5': ['M16.8 -30H3.2L2 -16.2C4.2 -17.9 6.8 -18.8 9.6 -18.8C14.6 -18.8 17.8 -15.2 17.8 -9.4C17.8 -3.4 14 0.5 8.8 0.5C5 0.5 2 -1.2 0.4 -4.4'],
    '6': ['M15.8 -27.6C14.2 -29.5 12 -30.5 9.6 -30.5C4.1 -30.5 0.8 -25 0.8 -15C0.8 -4.9 4.2 0.5 9.4 0.5'
          'C14.4 0.5 17.8 -3.4 17.8 -8.9C17.8 -14.4 14.4 -18 9.6 -18C5.6 -18 2.3 -15.7 1 -12.1'],
    '7': ['M0.6 -30H18L6.6 0'],
    '8': ['M9 -30.5A7.4 7.6 0 1 0 9 -15.3A7.4 7.6 0 1 0 9 -30.5', 'M9 -16.4A8.6 8.4 0 1 0 9 0.5A8.6 8.4 0 1 0 9 -16.4'],
    '9': ['M2 -2.9C3.6 -1 5.8 0.5 8.2 0.5C13.7 0.5 17 -5 17 -15C17 -25.1 13.6 -30.5 8.4 -30.5'
          'C3.4 -30.5 0 -26.6 0 -21.1C0 -15.6 3.4 -12 8.2 -12C12.2 -12 15.5 -14.3 16.8 -17.9'],
}


# ---------- measuring a stroke: lines, cubic curves and elliptical arcs, all absolute ----------
def _arc_points(x1, y1, rx, ry, phi, fa, fs, x2, y2, n=64):
    """Endpoint to centre parameterisation (SVG 1.1, F.6.5), sampled."""
    cp, sp = math.cos(math.radians(phi)), math.sin(math.radians(phi))
    dx, dy = (x1 - x2) / 2, (y1 - y2) / 2
    x1p, y1p = cp * dx + sp * dy, -sp * dx + cp * dy
    lam = (x1p ** 2) / (rx ** 2) + (y1p ** 2) / (ry ** 2)
    if lam > 1:
        rx, ry = rx * math.sqrt(lam), ry * math.sqrt(lam)
    num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
    den = rx * rx * y1p * y1p + ry * ry * x1p * x1p
    co = math.sqrt(max(0, num / den)) * (-1 if fa == fs else 1)
    cxp, cyp = co * rx * y1p / ry, -co * ry * x1p / rx
    cx, cy = cp * cxp - sp * cyp + (x1 + x2) / 2, sp * cxp + cp * cyp + (y1 + y2) / 2

    def ang(ux, uy, vx, vy):
        a = math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
        return a
    t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
    dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
    if not fs and dt > 0:
        dt -= 2 * math.pi
    elif fs and dt < 0:
        dt += 2 * math.pi
    pts = []
    for i in range(1, n + 1):
        t = t1 + dt * i / n
        x, y = rx * math.cos(t), ry * math.sin(t)
        pts.append((cp * x - sp * y + cx, sp * x + cp * y + cy))
    return pts


def points(d, n=48):
    """The stroke as a polyline, closely enough to measure it."""
    toks = re.findall(r'[MLHVCAZ]|-?\d*\.?\d+', d)
    pts, i, cur, cmd = [], 0, (0.0, 0.0), None
    while i < len(toks):
        if re.match(r'[MLHVCAZ]', toks[i]):
            cmd = toks[i]
            i += 1
            if cmd == 'Z':
                continue
        nums = lambda k: [float(v) for v in toks[i:i + k]]  # noqa: E731
        if cmd == 'M':
            cur = tuple(nums(2)); i += 2; pts.append(cur); cmd = 'L'
        elif cmd == 'L':
            cur = tuple(nums(2)); i += 2; pts.append(cur)
        elif cmd == 'H':
            cur = (nums(1)[0], cur[1]); i += 1; pts.append(cur)
        elif cmd == 'V':
            cur = (cur[0], nums(1)[0]); i += 1; pts.append(cur)
        elif cmd == 'C':
            x1, y1, x2, y2, x, y = nums(6); i += 6
            x0, y0 = cur
            for s in range(1, n + 1):
                t = s / n
                a, b, c, e = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3
                pts.append((a * x0 + b * x1 + c * x2 + e * x, a * y0 + b * y1 + c * y2 + e * y))
            cur = (x, y)
        elif cmd == 'A':
            rx, ry, phi, fa, fs, x, y = nums(7); i += 7
            pts += _arc_points(cur[0], cur[1], rx, ry, phi, int(fa), int(fs), x, y)
            cur = (x, y)
    return pts


def measure(d):
    pts = points(d)
    length, mx, my = 0.0, 0.0, 0.0
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        s = math.hypot(bx - ax, by - ay)
        length += s
        mx += s * (ax + bx) / 2
        my += s * (ay + by) / 2
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return {'len': round(length, 3), 'x0': min(xs), 'x1': max(xs), 'y0': min(ys), 'y1': max(ys),
            'mx': mx / length if length else 0, 'my': my / length if length else 0}


def data():
    """Every letter: its strokes with their lengths, its bounds, and the centre of its ink."""
    out = {}
    for ch, strokes in HAND.items():
        ms = [measure(s) for s in strokes]
        total = sum(m['len'] for m in ms)
        x0, x1 = min(m['x0'] for m in ms), max(m['x1'] for m in ms)
        y0, y1 = min(m['y0'] for m in ms), max(m['y1'] for m in ms)
        cx = sum(m['mx'] * m['len'] for m in ms) / total
        cy = sum(m['my'] * m['len'] for m in ms) / total
        out[ch] = {'d': strokes, 'len': [m['len'] for m in ms], 'x0': round(x0, 2), 'x1': round(x1, 2),
                   'y0': round(y0, 2), 'y1': round(y1, 2), 'cx': round(cx, 2), 'cy': round(cy, 2)}
    return out


if __name__ == '__main__':
    for ch, v in data().items():
        print(ch, sum(v['len']), v['x0'], v['x1'], v['cx'])
