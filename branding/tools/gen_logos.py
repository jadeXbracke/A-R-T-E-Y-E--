#!/usr/bin/env python3
"""Generate ARTEYE logo variation SVGs from the REAL logo artwork.

Ground truth: art-eye/assets/logo-arteye.png on the deployed branch
(claude/art-eye-app-updates-bsvrl8) — the supplied wordmark artwork the app
header actually shows (custom extra-wide letterforms; NOT a plain font).
The wordmark is vectorised 1:1 from that file with potrace. The SYDNEY
subline is Archivo Medium — the face the deployed app uses for it —
laid out with the proportions measured from the site header extraction
(SYDNEY cap = 0.60 x wordmark cap, gap = 1.35 x cap, centred).
"""
import os
import re
import subprocess
import tempfile
from PIL import Image
import numpy as np
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform

HERE = os.path.dirname(os.path.abspath(__file__))
SRC_PNG = os.path.join(HERE, 'logo-arteye.png')   # the live asset
ARCHIVO = os.path.join(HERE, 'A500.ttf')          # Archivo instanced at wght 500
OUT = os.environ.get('OUT_DIR', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
INK = '#131211'
UP = 8  # upscale factor before tracing

# ── trace the artwork ───────────────────────────────────────────────────────
_im = Image.open(SRC_PNG)
_alpha = np.array(_im)[:, :, 3]
_ys, _xs = np.where(_alpha > 128)
BBOX = (_xs.min(), _ys.min(), _xs.max() + 1, _ys.max() + 1)  # ink box, px
CAP_PX = BBOX[3] - BBOX[1]  # 56 px in the original artwork

def _letter_bboxes():
    ink = _alpha > 128
    sub = ink[BBOX[1]:BBOX[3], :]
    cols = sub.any(axis=0)
    segs, s = [], None
    for x, v in enumerate(cols):
        if v and s is None: s = x
        if not v and s is not None: segs.append((s, x)); s = None
    if s is not None: segs.append((s, len(cols)))
    return [t for t in segs if t[1] - t[0] > 2]

LETTER_X = _letter_bboxes()  # 6 (x0,x1) spans for A R T E Y E

def trace(crop_box):
    """potrace the artwork crop; returns (svg_g, w_px, h_px) in artwork px
    with y=0 at the crop top. Fill is currentColor."""
    x0, y0, x1, y1 = crop_box
    crop = _alpha[y0:y1, x0:x1]
    big = Image.fromarray(crop).resize(((x1 - x0) * UP, (y1 - y0) * UP), Image.LANCZOS)
    mask = np.array(big) > 128
    with tempfile.TemporaryDirectory() as td:
        pbm = os.path.join(td, 'in.pbm')
        Image.fromarray((~mask).astype(np.uint8) * 255).convert('1').save(pbm)
        svg = os.path.join(td, 'out.svg')
        subprocess.run(['potrace', '-s', '-o', svg, pbm, '--opttolerance', '0.2'],
                       check=True, capture_output=True)
        doc = open(svg).read()
    g = re.search(r'<g[^>]*transform="([^"]+)"[^>]*>(.*?)</g>', doc, re.S)
    transform, inner = g.group(1), g.group(2)
    # potrace y-flips over the PBM height; its units are 0.1 px of the PBM.
    # Wrap so 1 unit == 1 artwork px, origin at crop top-left.
    frag = (f'<g transform="scale({1 / UP})"><g transform="{transform}" '
            f'fill="currentColor" stroke="none">{inner}</g></g>')
    return frag, x1 - x0, y1 - y0

def place(frag, dx=0, dy=0, scale=1):
    t = f'translate({dx:.2f},{dy:.2f})'
    if scale != 1:
        t += f' scale({scale:.5f})'
    return f'<g transform="{t}">{frag}</g>'

# full wordmark trace + single-letter traces (in artwork px space)
WORD, WORD_W, WORD_H = trace(BBOX)
def letter(i):
    x0, x1 = LETTER_X[i]  # already absolute x in the artwork
    return trace((x0, BBOX[1], x1, BBOX[3]))
A_FRAG, A_W, _ = letter(0)
E_FRAG, E_W, _ = letter(3)

# ── Archivo Medium for the SYDNEY subline ───────────────────────────────────
_arch = TTFont(ARCHIVO)
def text_paths(text, tracking_em, size):
    f = _arch
    upm = f['head'].unitsPerEm
    scale = size / upm
    glyphset = f.getGlyphSet()
    cmap = f.getBestCmap()
    hmtx = f['hmtx']
    cap = getattr(f['OS/2'], 'sCapHeight', 700) * scale
    x = 0.0
    paths = []
    for i, ch in enumerate(text):
        gname = cmap[ord(ch)]
        spen = SVGPathPen(glyphset)
        tpen = TransformPen(spen, Transform(scale, 0, 0, -scale, x, cap))
        glyphset[gname].draw(tpen)
        d = spen.getCommands()
        if d:
            paths.append(d)
        x += hmtx[gname][0] * scale
        if i < len(text) - 1:
            x += tracking_em * size
    return paths, x, cap

def mont_group(paths, dx=0, dy=0):
    inner = ''.join(f'<path d="{d}"/>' for d in paths)
    return f'<g transform="translate({dx:.2f},{dy:.2f})">{inner}</g>'

def syd(cap_target, tracking=0.42):
    """SYDNEY paths sized so its cap height == cap_target."""
    probe, w, cap = text_paths('SYDNEY', tracking, 100)
    size = 100 * cap_target / cap
    return text_paths('SYDNEY', tracking, size)

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

CAP = 100.0                      # wordmark cap height in output px
K = CAP / CAP_PX                 # artwork px -> output px
AW = WORD_W * K                  # wordmark width in output px

# ── 1. Primary lockup: ARTEYE over SYDNEY (site header proportions) ─────────
sp, sw, scap = syd(0.60 * CAP)
gap = 1.35 * CAP
body = place(WORD, scale=K) + mont_group(sp, dx=(AW - sw) / 2, dy=CAP + gap)
svg('logo-primary.svg', AW, CAP + gap + scap, body, pad=24)

# ── 2. Wordmark only ─────────────────────────────────────────────────────────
svg('logo-wordmark.svg', AW, CAP, place(WORD, scale=K), pad=24)

# ── 3. Horizontal lockup: ARTEYE | SYDNEY ───────────────────────────────────
sp2, sw2, scap2 = syd(0.42 * CAP)
sep_gap = 0.62 * CAP
rule_x = AW + sep_gap
body = (place(WORD, scale=K)
        + f'<rect x="{rule_x:.2f}" y="-6" width="1.5" height="{CAP + 12:.2f}"/>'
        + mont_group(sp2, dx=rule_x + sep_gap, dy=(CAP - scap2) / 2))
svg('logo-horizontal.svg', rule_x + sep_gap + sw2, CAP, body, pad=24)

# ── 4. Monogram AE — the wordmark's own A and E ─────────────────────────────
MCAP = 150.0
mk = MCAP / CAP_PX
m_gap = 0.42 * MCAP
m_w = (A_W + E_W) * mk + m_gap
body = place(A_FRAG, scale=mk) + place(E_FRAG, dx=A_W * mk + m_gap, scale=mk)
svg('monogram-ae.svg', m_w, MCAP, body, pad=24)

# ── 5. Monogram AE in hairline circle ───────────────────────────────────────
D = 340
r = D / 2
ccap = 92.0
ck = ccap / CAP_PX
c_gap = 0.38 * ccap
c_w = (A_W + E_W) * ck + c_gap
mono = place(A_FRAG, scale=ck) + place(E_FRAG, dx=A_W * ck + c_gap, scale=ck)
body = (f'<circle cx="{r}" cy="{r}" r="{r - 1.25}" fill="none" stroke="currentColor" stroke-width="2.5"/>'
        + place(mono, dx=(D - c_w) / 2, dy=(D - ccap) / 2))
svg('monogram-ae-circle.svg', D, D, body, pad=16)

# ── 6. Monogram AE in square (stamp) ────────────────────────────────────────
S = 340
qcap = 88.0
qk = qcap / CAP_PX
q_gap = 0.38 * qcap
q_w = (A_W + E_W) * qk + q_gap
mono = place(A_FRAG, scale=qk) + place(E_FRAG, dx=A_W * qk + q_gap, scale=qk)
body = (f'<rect x="1.25" y="1.25" width="{S - 2.5}" height="{S - 2.5}" fill="none" stroke="currentColor" stroke-width="2.5"/>'
        + place(mono, dx=(S - q_w) / 2, dy=(S - qcap) / 2))
svg('monogram-ae-square.svg', S, S, body, pad=16)

# ── 7. Sticker badge: double circle, ARTEYE / AE / SYDNEY ───────────────────
D2 = 440
r2 = D2 / 2
top_cap = 21.0
tk = top_cap / CAP_PX
top_w = WORD_W * tk
sp3, sw3, scap3 = syd(21.0)
bcap = 96.0
bk = bcap / CAP_PX
b_gap = 0.38 * bcap
b_w = (A_W + E_W) * bk + b_gap
mono = place(A_FRAG, scale=bk) + place(E_FRAG, dx=A_W * bk + b_gap, scale=bk)
body = (f'<circle cx="{r2}" cy="{r2}" r="{r2 - 1.5}" fill="none" stroke="currentColor" stroke-width="3"/>'
        f'<circle cx="{r2}" cy="{r2}" r="{r2 - 16}" fill="none" stroke="currentColor" stroke-width="1.25"/>'
        + place(WORD, dx=(D2 - top_w) / 2, dy=78, scale=tk)
        + place(mono, dx=(D2 - b_w) / 2, dy=(D2 - bcap) / 2)
        + mont_group(sp3, dx=(D2 - sw3) / 2, dy=D2 - 78 - scap3))
svg('sticker-circle.svg', D2, D2, body, pad=12)

# ── 8. Square tile (app icon / favicon): ink square, white AE ───────────────
T = 320
tcap = 96.0
tk2 = tcap / CAP_PX
t_gap = 0.34 * tcap
t_w = (A_W + E_W) * tk2 + t_gap
mono = place(A_FRAG, scale=tk2) + place(E_FRAG, dx=A_W * tk2 + t_gap, scale=tk2)
tile_body = (f'<rect x="0" y="0" width="{T}" height="{T}" fill="{INK}"/>'
             f'<g style="color:#FFFFFF">' + place(mono, dx=(T - t_w) / 2, dy=(T - tcap) / 2) + '</g>')
with open(os.path.join(OUT, 'tile-ae-ink.svg'), 'w') as fh:
    fh.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {T} {T}" width="{T}" height="{T}">{tile_body}</svg>')
print('tile-ae-ink.svg')

print('done ->', OUT)
