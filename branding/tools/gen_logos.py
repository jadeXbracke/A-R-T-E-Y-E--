#!/usr/bin/env python3
"""Generate ARTEYE logo variation SVGs.

The ARTEYE wordmark is NOT a font: it is the custom wide-hairline lettering
from the v4 "airy" brand card (measured from art-eye/assets/splash-icon.png:
cap height 64, stroke 3, crossbar-less A, open-bowl R, shallow wide Y).
Letters are redrawn here as exact vector strokes. The SYDNEY subline is
Montserrat Medium, as on the live site.
"""
import os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform

SRC = os.path.join(os.path.dirname(__file__), 'Montserrat.ttf')  # Montserrat[wght].ttf from google/fonts
OUT = os.environ.get('OUT_DIR', os.path.join(os.path.dirname(__file__), '..'))
INK = '#131211'

# ── custom ARTEYE lettering (unit space: cap height 64, stroke 3) ───────────
CAP = 64.0
SW = 3.0  # hairline stroke at cap 64
GAP = 65.0  # optical letter gap in the wordmark

# each letter: (width, [path d strings in 64-unit space])
LETTERS = {
    'A': (62, ['M1.5 64 L31 1 L60.5 64']),
    'R': (48, ['M1.5 0 V64',
               'M0 1.5 H28 C40 1.5 46 9 46 20 C46 32 40 40 33 45 L46.5 64']),
    'T': (51, ['M0 1.5 H51', 'M25.5 0 V64']),
    'E': (43, ['M1.5 0 V64', 'M0 1.5 H42.5', 'M0 32 H38', 'M0 62.5 H43']),
    'Y': (54, ['M1.5 0 L27.5 41 L53 0', 'M27.5 41 V64']),
    'S': (44, ['M42 8 C38 3 32 1.5 25 1.5 C13 1.5 5 6.5 5 15 '
               'C5 23 12 26.5 23 29 C35 31.5 41 35.5 41 44.5 '
               'C41 55 32 62.5 20 62.5 C11 62.5 4.5 59.5 0.5 54']),
    'D': (52, ['M1.5 0 V64', 'M0 1.5 H20 C39 1.5 50.5 13 50.5 32 '
               'C50.5 51 39 62.5 20 62.5 H0']),
    'N': (50, ['M1.5 64 V0 L48.5 64 V0']),
    # Æ ligature: crossbar-less A fused with E — one custom monogram glyph
    'Æ': (73.5, ['M1.5 64 L30.5 1', 'M30.5 0 V64',
                 'M29 1.5 H72', 'M29 32 H67', 'M29 62.5 H72.5']),
}

def letters_svg(text, cap, gap=GAP, sw=SW, extra_paths='', gap_abs=None):
    """Compose text from the custom lettering. Returns (svg fragment, w, h)
    in px with cap height `cap`. gap is in 64-unit space unless gap_abs."""
    k = cap / CAP
    g = gap_abs / k if gap_abs is not None else gap
    x = 0.0
    parts = []
    for i, ch in enumerate(text):
        w, paths = LETTERS[ch]
        d = ' '.join(paths)
        parts.append(f'<path transform="translate({x:.2f},0)" d="{d}"/>')
        x += w
        if i < len(text) - 1:
            x += g
    body = ''.join(parts) + extra_paths
    frag = (f'<g transform="scale({k:.5f})" fill="none" stroke="currentColor" '
            f'stroke-width="{sw}" stroke-miterlimit="4">{body}</g>')
    return frag, x * k, cap

# ── Montserrat helper for the SYDNEY subline ────────────────────────────────
_fonts = {}
def font(weight):
    if weight not in _fonts:
        f = TTFont(SRC)
        instantiateVariableFont(f, {'wght': weight}, inplace=True)
        _fonts[weight] = f
    return _fonts[weight]

def text_paths(text, weight, tracking_em, size):
    f = font(weight)
    upm = f['head'].unitsPerEm
    scale = size / upm
    glyphset = f.getGlyphSet()
    cmap = f.getBestCmap()
    hmtx = f['hmtx']
    cap = getattr(f['OS/2'], 'sCapHeight', 700) * scale
    x = 0.0
    paths = []
    track = tracking_em * size
    for i, ch in enumerate(text):
        gname = cmap[ord(ch)]
        glyph = glyphset[gname]
        spen = SVGPathPen(glyphset)
        tpen = TransformPen(spen, Transform(scale, 0, 0, -scale, x, cap))
        glyph.draw(tpen)
        d = spen.getCommands()
        if d:
            paths.append(d)
        x += hmtx[gname][0] * scale
        if i < len(text) - 1:
            x += track
    return paths, x, cap

def mont_group(paths, dx=0, dy=0):
    inner = ''.join(f'<path d="{d}"/>' for d in paths)
    return f'<g transform="translate({dx:.2f},{dy:.2f})">{inner}</g>'

def place(frag, dx=0, dy=0):
    return f'<g transform="translate({dx:.2f},{dy:.2f})">{frag}</g>'

def svg(name, w, h, body, pad=0):
    w2, h2 = w + 2 * pad, h + 2 * pad
    content = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w2:.2f} {h2:.2f}" '
        f'width="{w2:.0f}" height="{h2:.0f}" fill="currentColor" style="color:{INK}">'
        f'<g transform="translate({pad},{pad})">{body}</g></svg>'
    )
    with open(os.path.join(OUT, name), 'w') as fh:
        fh.write(content)
    print(f'{name}: {w2:.0f}x{h2:.0f}')

os.makedirs(OUT, exist_ok=True)

# ── 1. Primary lockup: ARTEYE over SYDNEY ────────────────────────────────────
wm, aw, acap = letters_svg('ARTEYE', 100)
sp, sw_, scap = text_paths('SYDNEY', 500, 0.42, 27)
gap = 40
H = acap + gap + scap
body = wm + mont_group(sp, dx=(aw - sw_) / 2, dy=acap + gap)
svg('logo-primary.svg', aw, H, body, pad=24)

# ── 2. Wordmark only ─────────────────────────────────────────────────────────
svg('logo-wordmark.svg', aw, acap, wm, pad=24)

# ── 3. Horizontal lockup: ARTEYE | SYDNEY ───────────────────────────────────
sp2, sw2, scap2 = text_paths('SYDNEY', 500, 0.42, 30)
sep_gap = 56
rule_x = aw + sep_gap
body = (wm
        + f'<rect x="{rule_x:.2f}" y="-6" width="1.5" height="{acap + 12:.2f}"/>'
        + mont_group(sp2, dx=rule_x + sep_gap, dy=(acap - scap2) / 2))
svg('logo-horizontal.svg', rule_x + sep_gap + sw2, acap, body, pad=24)

# ── 4. Monogram AE (two letters) ────────────────────────────────────────────
mfrag, mw, mcap = letters_svg('AE', 160, gap=30)
svg('monogram-ae.svg', mw, mcap, mfrag, pad=24)

# ── 5. Monogram Æ ligature ──────────────────────────────────────────────────
lfrag, lw, lcap = letters_svg('Æ', 160)
svg('monogram-ae-ligature.svg', lw, lcap, lfrag, pad=24)

# ── 6. Monogram Æ in hairline circle ────────────────────────────────────────
cfrag, cw, ccap = letters_svg('Æ', 118)
D = 320
r = D / 2
body = (f'<circle cx="{r}" cy="{r}" r="{r - 1.25}" fill="none" stroke="currentColor" stroke-width="2.5"/>'
        + place(cfrag, dx=(D - cw) / 2, dy=(D - ccap) / 2))
svg('monogram-ae-circle.svg', D, D, body, pad=16)

# ── 7. Monogram AE in square (stamp) ────────────────────────────────────────
S = 320
qfrag, qw, qcap = letters_svg('AE', 116, gap=26)
body = (f'<rect x="1.25" y="1.25" width="{S - 2.5}" height="{S - 2.5}" fill="none" stroke="currentColor" stroke-width="2.5"/>'
        + place(qfrag, dx=(S - qw) / 2, dy=(S - qcap) / 2))
svg('monogram-ae-square.svg', S, S, body, pad=16)

# ── 8. Sticker badge: double circle, ARTEYE / Æ / SYDNEY ────────────────────
D2 = 420
r2 = D2 / 2
top, topw, topcap = letters_svg('ARTEYE', 20, gap=28, sw=5.5)
sp3, sw3, scap3 = text_paths('SYDNEY', 500, 0.42, 21)
mid, midw, midcap = letters_svg('Æ', 128)
body = (f'<circle cx="{r2}" cy="{r2}" r="{r2 - 1.5}" fill="none" stroke="currentColor" stroke-width="3"/>'
        f'<circle cx="{r2}" cy="{r2}" r="{r2 - 16}" fill="none" stroke="currentColor" stroke-width="1.25"/>'
        + place(top, dx=(D2 - topw) / 2, dy=72)
        + place(mid, dx=(D2 - midw) / 2, dy=(D2 - midcap) / 2)
        + mont_group(sp3, dx=(D2 - sw3) / 2, dy=D2 - 72 - scap3))
svg('sticker-circle.svg', D2, D2, body, pad=12)

# ── 9. Square tile (app icon / favicon): ink square, white Æ ────────────────
T = 320
tfrag, tw, tcap = letters_svg('Æ', 150, sw=6.5)
tile_body = (f'<rect x="0" y="0" width="{T}" height="{T}" fill="{INK}"/>'
             f'<g style="color:#FFFFFF">' + place(tfrag, dx=(T - tw) / 2, dy=(T - tcap) / 2) + '</g>')
with open(os.path.join(OUT, 'tile-ae-ink.svg'), 'w') as fh:
    fh.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {T} {T}" width="{T}" height="{T}">{tile_body}</svg>')
print('tile-ae-ink.svg')

print('done ->', OUT)
