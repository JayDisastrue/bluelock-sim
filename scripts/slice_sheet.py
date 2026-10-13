#!/usr/bin/env python3
"""Cut a Gemini parts sheet (parts drawn on a flat magenta head) into aligned 1000x1300 creator layers.

  python3 scripts/slice_sheet.py <sheet.png> --cols 5 --rows 4 --slot hair \
      --ids empty,spiky,swept,shaggy,fringe,buzz,... [--skip 19] [--out public/assets/player] [--preview shots/parts/hair_preview.png]

* Cells are found from the grey cell borders (shared lines, or one square per cell), falling back to an even split.
* Cell 1 must be the EMPTY magenta head. Its silhouette fixes the scale and offset for the whole sheet so every layer lands on
  the template (head top y=290, ear-to-ear 540 wide, centred at x=500). Use --id-empty to name that cell `empty` (not written).
* Magenta (any shade of it) is keyed out; ink and everything else stays. Edge pixels are de-spilled so no pink halo remains.
* --ids lists one id per cell in reading order; use `-` for a cell you do not want. Layers are written to <out>/<slot>/<id>.png.
"""
from __future__ import annotations
import argparse, colorsys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

W, H = 1000, 1300
HEAD_TOP, EAR_W, CX = 290, 540, 500


def grey_lines(rgb: np.ndarray, axis: int) -> list[tuple[int, int]]:
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    grey = (r > 150) & (r < 225) & (abs(r - b) < 30) & (abs(r - g) < 20)
    frac = grey.mean(axis=1 - axis)  # axis 0: per-row fraction (horizontal lines); axis 1: per-column
    on = frac > 0.45
    runs, i = [], 0
    while i < len(on):
        if on[i]:
            j = i
            while j + 1 < len(on) and on[j + 1]:
                j += 1
            runs.append((i, j)); i = j + 1
        else:
            i += 1
    return runs


def cell_spans(rgb: np.ndarray, n: int, axis: int) -> list[tuple[int, int]]:
    size = rgb.shape[axis]
    runs = grey_lines(rgb, axis)
    if len(runs) == n + 1:  # shared borders
        return [(runs[k][1] + 1, runs[k + 1][0]) for k in range(n)]
    if len(runs) == 2 * n:  # a separate square per cell
        return [(runs[2 * k][1] + 1, runs[2 * k + 1][0]) for k in range(n)]
    step = size / n
    return [(round(k * step) + 3, round((k + 1) * step) - 3) for k in range(n)]


def magentaness(rgb: np.ndarray) -> np.ndarray:
    """0..1: how much each pixel is the key colour (hue ~ magenta/pink-purple, clearly saturated, not ink)."""
    x = rgb.astype(np.float32) / 255
    mx, mn = x.max(axis=2), x.min(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1e-6)
    r, g, b = x[..., 0], x[..., 1], x[..., 2]
    # magenta: red and blue both clearly above green
    mag = np.minimum(r, b) - g
    score = np.clip((mag - 0.08) / 0.18, 0, 1) * np.clip((sat - 0.2) / 0.3, 0, 1) * np.clip((mx - 0.12) / 0.2, 0, 1)
    return score


def outside_white(rgb: np.ndarray) -> np.ndarray:
    """Near-white pixels connected to the cell border (the page background), not enclosed whites such as eye whites."""
    ri = rgb.astype(int)
    # white page plus the light-grey cell border (which may enclose the page white)
    white = ((ri.min(axis=2) > 200) & (ri.max(axis=2) - ri.min(axis=2) < 28)).astype(np.uint8) * 255
    wm = white > 0
    seed = np.zeros_like(wm)
    seed[0, :], seed[-1, :], seed[:, 0], seed[:, -1] = wm[0, :], wm[-1, :], wm[:, 0], wm[:, -1]
    cur = Image.fromarray(seed.astype(np.uint8) * 255)
    allowed = Image.fromarray(white)
    from PIL import ImageChops
    for _ in range(2000):  # geodesic dilation: grow the border-connected white until it stops
        nxt = ImageChops.multiply(cur.filter(ImageFilter.MaxFilter(3)), allowed)
        if ImageChops.difference(nxt, cur).getbbox() is None:
            break
        cur = nxt
    return np.asarray(cur) > 0


def key_alpha(cell: Image.Image) -> tuple[np.ndarray, np.ndarray]:
    rgb = np.asarray(cell.convert('RGB'))
    m = magentaness(rgb)
    return rgb, np.clip((1 - m) * (~outside_white(rgb)), 0, 1)


def ring_zone(cell1: Image.Image, grow: int = 7) -> np.ndarray:
    """Where the empty head's own ink (contour, ears, neck, shoulders) sits, grown a little."""
    _, a = key_alpha(cell1)
    img = Image.fromarray((a > 0.3).astype(np.uint8) * 255)
    return np.asarray(img.filter(ImageFilter.MaxFilter(grow))) > 0


def key_layer(cell: Image.Image, zone: np.ndarray | None = None, open_k: int = 3) -> Image.Image:
    rgb, alpha = key_alpha(cell)
    m = magentaness(rgb)
    out = rgb.astype(np.float32)
    # de-spill: pull partially-magenta edge pixels toward neutral so no pink fringe survives
    spill = (m > 0.02) & (m < 0.98)
    g = out[..., 1]
    for c in (0, 2):
        out[..., c] = np.where(spill, np.minimum(out[..., c], g + 6), out[..., c])
    if zone is not None:
        # inside the empty head's ink zone keep only thick strokes (hair); thin lines there are the head's own outline
        solid = Image.fromarray(((alpha > 0.5).astype(np.uint8)) * 255)
        solid = solid.filter(ImageFilter.MinFilter(open_k)).filter(ImageFilter.MaxFilter(open_k))
        thick = np.asarray(Image.fromarray(np.asarray(solid)).filter(ImageFilter.MaxFilter(3))) > 0
        z = np.zeros(alpha.shape, bool)
        hh, ww = min(z.shape[0], zone.shape[0]), min(z.shape[1], zone.shape[1])
        z[:hh, :ww] = zone[:hh, :ww]
        alpha = np.where(z & ~thick, 0, alpha)
        # leftover specks of the head outline: small connected pieces that touch the outline zone
        from scipy import ndimage
        lab, n = ndimage.label(alpha > 0.3)
        if n:
            area = ndimage.sum(np.ones_like(lab), lab, index=np.arange(1, n + 1))
            touches = ndimage.maximum(z.astype(int), lab, index=np.arange(1, n + 1)) > 0
            cy = ndimage.center_of_mass(np.ones_like(lab), lab, index=np.arange(1, n + 1))
            low = np.array([c[0] > 0.5 * alpha.shape[0] for c in cy])  # detached bits down by the jaw/ears/neck are outline leftovers
            small = ((area < 0.015 * area.max()) & touches) | ((area < 0.05 * area.max()) & touches & low)
            alpha = np.where(np.isin(lab, np.nonzero(small)[0] + 1), 0, alpha)
    # white halo: light AA pixels touching transparency are page white bleeding in, not part of the art
    light = rgb.astype(int).min(axis=2) > 175
    for _ in range(2):
        a8 = Image.fromarray((alpha > 0.5).astype(np.uint8) * 255)
        edge = (np.asarray(a8.filter(ImageFilter.MinFilter(3))) == 0)  # within 1px of a transparent pixel
        alpha = np.where(light & edge, 0, alpha)
    return Image.fromarray(np.dstack([out.clip(0, 255).astype(np.uint8), (alpha * 255).astype(np.uint8)]), 'RGBA')


def head_metrics(cell: Image.Image) -> tuple[float, float, float]:
    """(head top y, ear-to-ear width, centre x) of the empty magenta silhouette, in cell pixels."""
    m = magentaness(np.asarray(cell.convert('RGB'))) > 0.5
    ys = np.where(m.any(axis=1))[0]
    if len(ys) == 0:
        raise SystemExit('cell 1 has no magenta head; it must be the empty silhouette')
    top, bot = ys[0], ys[-1]
    rows = range(top, top + int((bot - top) * 0.45))
    widths = []
    for y in rows:
        xs = np.where(m[y])[0]
        widths.append((xs[-1] - xs[0] + 1, (xs[0] + xs[-1]) / 2) if len(xs) else (0, 0))
    w, c = max(widths)
    return float(top), float(w), float(c)


def place(layer: Image.Image, top: float, width: float, cx: float, dy: int = 0, scale: float = 1.0) -> Image.Image:
    s = EAR_W / width * scale
    lay = layer.resize((round(layer.width * s), round(layer.height * s)), Image.LANCZOS)
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ox, oy = round(CX - cx * s), round(HEAD_TOP - top * s + dy)
    # paste with clipping
    canvas.paste(lay, (ox, oy), lay)
    return canvas


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('sheet'); ap.add_argument('--cols', type=int, required=True); ap.add_argument('--rows', type=int, required=True)
    ap.add_argument('--slot', required=True); ap.add_argument('--ids', required=True, help='comma list, one per cell, "-" to skip, first must be the empty reference')
    ap.add_argument('--out', default='public/assets/player'); ap.add_argument('--preview'); ap.add_argument('--dy', type=int, default=0, help='nudge layers down (px on the 1000x1300 canvas)')
    ap.add_argument('--scale', type=float, default=1.0)
    ap.add_argument('--open-k', type=int, default=0, help='stroke width (px in the sheet) below which lines in the empty head\'s outline zone are dropped')
    ap.add_argument('--anchor-y', type=int, help='after placing, shift all layers so the median vertical centre of their ink lands on this canvas y (eyes 580, brows 535, nose 690)')
    ap.add_argument('--keep-box', help='x0,y0,x1,y1 on the 1000x1300 canvas: clear everything outside (eyes, brows, nose, marks)')
    a = ap.parse_args()
    sheet = Image.open(a.sheet).convert('RGB')
    rgb = np.asarray(sheet)
    xs, ys = cell_spans(rgb, a.cols, 1), cell_spans(rgb, a.rows, 0)
    ids = a.ids.split(',')
    assert len(ids) == a.cols * a.rows, f'expected {a.cols * a.rows} ids, got {len(ids)}'
    cells = [sheet.crop((x0 + 2, y0 + 2, x1 - 2, y1 - 2)) for (y0, y1) in ys for (x0, x1) in xs]
    top, width, cx = head_metrics(cells[0])
    zone = ring_zone(cells[0], 2 * round(cells[0].width / 20) + 1)
    open_k = a.open_k or 5
    print(f'cells {a.cols}x{a.rows}, cell1 head top {top:.0f}, ear width {width:.0f}, centre {cx:.0f}')
    out = Path(a.out) / a.slot
    out.mkdir(parents=True, exist_ok=True)
    layers = {}
    for cell, cid in zip(cells, ids):
        if cid in ('-', 'empty'):
            continue
        layers[cid] = place(key_layer(cell, zone, open_k), top, width, cx, a.dy, a.scale)
    if a.anchor_y is not None and layers:
        mids = []
        for l in layers.values():
            bb = l.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
            if bb:
                mids.append((bb[1] + bb[3]) / 2)
        shift = round(a.anchor_y - float(np.median(mids)))
        print(f'anchor: median centre y {np.median(mids):.0f} -> {a.anchor_y} (shift {shift:+d}px)')
        for k, l in layers.items():
            c = Image.new('RGBA', (W, H), (0, 0, 0, 0)); c.paste(l, (0, shift), l); layers[k] = c
    written = []
    for cid, layer in layers.items():
        if a.keep_box:
            x0, y0, x1, y1 = map(int, a.keep_box.split(','))
            arr = np.asarray(layer).copy(); keep = np.zeros(arr.shape[:2], bool); keep[y0:y1, x0:x1] = True
            arr[..., 3] = np.where(keep, arr[..., 3], 0); layer = Image.fromarray(arr, 'RGBA')
        layer.save(out / f'{cid}.png'); written.append(cid)
    print(f'wrote {len(written)} layers to {out}: {", ".join(written)}')
    if a.preview:
        from gen_parts import sheet as mk
        mk([(i, out / f'{i}.png') for i in written], None, Path(a.preview), cols=6, cell=200)
        print('preview', a.preview)


if __name__ == '__main__':
    import sys
    sys.path.insert(0, str(Path(__file__).parent))
    main()
