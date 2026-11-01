"""sRGB <-> OKLab/OKLCH and WCAG contrast. No dependencies."""
import math


def _lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _gam(c):
    return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055


def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def rgb_hex(rgb):
    return '#' + ''.join(f'{round(max(0, min(1, c)) * 255):02X}' for c in rgb)


def rgb_oklab(rgb):
    r, g, b = (_lin(c) for c in rgb)
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l, m, s = (x ** (1 / 3) for x in (l, m, s))
    return (0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s)


def oklab_rgb(lab):
    L, a, b = lab
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    return tuple(_gam(c) if c >= 0 else -_gam(-c) for c in (r, g, bb))


def hex_oklch(h):
    L, a, b = rgb_oklab(hex_rgb(h))
    return L, math.hypot(a, b), math.degrees(math.atan2(b, a)) % 360


def oklch_rgb(L, C, H):
    return oklab_rgb((L, C * math.cos(math.radians(H)), C * math.sin(math.radians(H))))


def in_gamut(rgb, eps=1e-6):
    return all(-eps <= c <= 1 + eps for c in rgb)


def oklch_hex(L, C, H):
    """Clamp chroma down (not the other channels) until the colour fits sRGB."""
    lo, hi = 0.0, C
    if in_gamut(oklch_rgb(L, C, H)):
        return rgb_hex(oklch_rgb(L, C, H))
    for _ in range(40):
        mid = (lo + hi) / 2
        if in_gamut(oklch_rgb(L, mid, H)):
            lo = mid
        else:
            hi = mid
    return rgb_hex(oklch_rgb(L, lo, H))


def luminance(h):
    r, g, b = (_lin(c) for c in hex_rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def rgb_hsl(h):
    r, g, b = hex_rgb(h)
    mx, mn = max(r, g, b), min(r, g, b)
    l = (mx + mn) / 2
    if mx == mn:
        return 0, 0, round(l * 100)
    d = mx - mn
    s = d / (2 - mx - mn) if l > 0.5 else d / (mx + mn)
    hue = ((g - b) / d + (6 if g < b else 0)) if mx == r else ((b - r) / d + 2) if mx == g else ((r - g) / d + 4)
    return round(hue * 60), round(s * 100), round(l * 100)


def rgb_cmyk(h):
    """Naive device CMYK, a starting point for the printer's proof, not a profile conversion."""
    r, g, b = hex_rgb(h)
    k = 1 - max(r, g, b)
    if k >= 1:
        return 0, 0, 0, 100
    return tuple(round(x * 100) for x in ((1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k))
