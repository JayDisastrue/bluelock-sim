#!/usr/bin/env python3
"""Aligned creator-part pipeline: Gemini image-edit a neutral base bust, then extract each change as a transparent layer.

  export GEMINI_API_KEY=...            # environment secret; never printed
  export GEMINI_IMAGE_MODEL=gemini-3.1-flash-image   # optional

  python3 scripts/gen_parts.py base   [--n 3]                       # candidate base busts -> shots/parts/base/cand*.png
  python3 scripts/gen_parts.py probe  --base shots/parts/base/base.png [--variants scripts/parts_spec.json]   # ONE variant per slot + contact sheet
  python3 scripts/gen_parts.py build  --base ... [--slot hair] [--only spiky,swept]   # all (or selected) variants -> public/assets/player/<slot>/
  python3 scripts/gen_parts.py extract <slot> <base.png> <variant.png> <out.png>      # offline: just the diff/extract step
  python3 scripts/gen_parts.py recolor <layer.png> <out.png> --to <hex> [--from <hex>]# hue/colour variant without regenerating
  python3 scripts/gen_parts.py sheet  <dir> <out.png>                                 # contact sheet of PNG layers over the base

Layers are 1000x1300 RGBA, aligned to public/assets/player/_template.png. Add-on slots (hair, brow, mark, accessory) are
the pixels that differ from the base inside the slot region; replace slots (eyes, nose, face) are the variant pixels in the
region with the base skin colour keyed out. A result is rejected (and retried up to 3 times) when it changes pixels outside
the slot's allowed region (the drift check), or when the layer is empty / floods the region.
"""
from __future__ import annotations
import argparse, colorsys, io, json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, str(Path(__file__).parent))
W, H = 1000, 1300
ROOT = Path(__file__).resolve().parent.parent
OUT_ROOT = ROOT / 'public/assets/player'
TEMPLATE = OUT_ROOT / '_template.png'

STYLE = ('modern TV-anime production quality, gritty sports-anime: clean thin dark-brown ink linework, flat matte cel colours with one soft shadow layer, '
         'large expressive eyes with layered white highlights and a defined upper lash line')

# (x0, y0, x1, y1) in canvas px. `allow` = where the edit may change pixels; everything outside must stay identical to the base.
SLOTS: dict[str, dict] = {
    'hair':      dict(mode='add',     allow=(60, 20, 940, 760),  ask='Add {v}. Hair only: nothing else on the face changes.'),
    'brow':      dict(mode='add',     allow=(290, 490, 710, 575), ask='Add eyebrows: {v}. Nothing else changes.'),
    'mark':      dict(mode='add',     allow=(260, 440, 740, 900), ask='Add {v} on the face. Nothing else changes.'),
    'accessory': dict(mode='add',     allow=(100, 200, 900, 1000), ask='Add {v}. Nothing else changes.'),
    'eyes':      dict(mode='replace', allow=(300, 525, 700, 640), ask='Change only the eyes to {v}. Same position and size of the eye sockets.'),
    'nose':      dict(mode='replace', allow=(430, 610, 570, 745), ask='Change only the nose to {v}.'),
    'face':      dict(mode='replace', allow=(180, 240, 820, 1000), ask='Change only the head shape and skin to {v}; keep a plain featureless face (no brows, eyes, nose; a faint closed mouth line only).'),
}
DRIFT_TOL = 0.004     # fraction of outside-region pixels allowed to change
DIFF_T = 28           # per-channel summed colour distance that counts as "changed"


def load(p) -> Image.Image:
    im = Image.open(p) if not isinstance(p, Image.Image) else p
    return fit_canvas(im.convert('RGB'))


def fit_canvas(im: Image.Image) -> Image.Image:
    """Scale to cover 1000x1300 and centre-crop (3:4 model output -> 10:13)."""
    s = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    l, t = (im.width - W) // 2, (im.height - H) // 2
    return im.crop((l, t, l + W, t + H))


def region_mask(box, feather=6) -> np.ndarray:
    m = Image.new('L', (W, H), 0)
    m.paste(255, box)
    if feather:
        m = m.filter(ImageFilter.GaussianBlur(feather))
    return np.asarray(m, dtype=np.float32) / 255


def diff_mask(base: np.ndarray, var: np.ndarray) -> np.ndarray:
    d = np.abs(base.astype(np.int16) - var.astype(np.int16)).sum(axis=2)
    return d > DIFF_T


def drift(base: np.ndarray, var: np.ndarray, allow) -> float:
    ch = diff_mask(base, var)
    inside = np.zeros((H, W), bool)
    x0, y0, x1, y1 = allow
    inside[y0:y1, x0:x1] = True
    out = ~inside
    return float(ch[out].mean())


def extract(slot: str, base_img, var_img) -> tuple[Image.Image, dict]:
    """Return (RGBA layer, stats). Raises ValueError with the reason when the result should be rejected."""
    spec = SLOTS[slot]
    base, var = np.asarray(load(base_img)), np.asarray(load(var_img))
    dr = drift(base, var, spec['allow'])
    if dr > DRIFT_TOL:
        raise ValueError(f'drift {dr:.3%} of pixels changed outside the {slot} region')
    x0, y0, x1, y1 = spec['allow']
    reg = np.zeros((H, W), bool); reg[y0:y1, x0:x1] = True
    if spec['mode'] == 'add':
        alpha = diff_mask(base, var) & reg
    else:  # replace: variant pixels that are not the base's local skin colour
        skin = np.median(base[y0:y1, x0:x1].reshape(-1, 3), axis=0)
        dist = np.abs(var.astype(np.int16) - skin.astype(np.int16)).sum(axis=2)
        alpha = (dist > 55) & reg & ~((np.abs(var.astype(np.int16) - 255).sum(axis=2)) < 20)
    a = Image.fromarray((alpha * 255).astype(np.uint8))
    a = a.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))          # close pin-holes
    a = a.filter(ImageFilter.GaussianBlur(1.0))
    arr = np.asarray(a, dtype=np.float32) * region_mask(spec['allow'], 4)           # feather at the region edge
    cover = float((arr > 127).sum()) / max(1, (x1 - x0) * (y1 - y0))
    if cover < 0.003:
        raise ValueError(f'empty layer (coverage {cover:.2%})')
    if cover > 0.95 and spec['mode'] == 'replace' and slot != 'face':
        raise ValueError(f'layer floods the region (coverage {cover:.0%})')
    rgba = np.dstack([var, arr.clip(0, 255).astype(np.uint8)])
    return Image.fromarray(rgba, 'RGBA'), dict(drift=dr, coverage=cover)


def recolor(layer: Image.Image, to_hex: str, from_hex: str | None = None, tol: float = 0.12) -> Image.Image:
    """Shift hue/saturation of the layer's dominant (or `from_hex`) colour family to `to_hex`; ink lines (dark) are kept."""
    arr = np.asarray(layer.convert('RGBA'), dtype=np.float32) / 255
    rgb, a = arr[..., :3], arr[..., 3]
    hsv = np.array([colorsys.rgb_to_hsv(*p) for p in rgb.reshape(-1, 3)]).reshape(rgb.shape)
    tr, tg, tb = (int(to_hex.lstrip('#')[i:i + 2], 16) / 255 for i in (0, 2, 4))
    th, ts, tv = colorsys.rgb_to_hsv(tr, tg, tb)
    if from_hex:
        fr, fg, fb = (int(from_hex.lstrip('#')[i:i + 2], 16) / 255 for i in (0, 2, 4))
        fh = colorsys.rgb_to_hsv(fr, fg, fb)[0]
    else:
        sel = (a > 0.5) & (hsv[..., 1] > 0.1) & (hsv[..., 2] > 0.04)
        fh = float(np.median(hsv[..., 0][sel])) if sel.any() else th
    dh = np.abs(((hsv[..., 0] - fh + 0.5) % 1) - 0.5)
    fam = (dh < tol) & (hsv[..., 1] > 0.12) & (hsv[..., 2] > 0.04)
    # near-greys (e.g. black or white hair) are recoloured by value/saturation instead of hue
    grey = (hsv[..., 1] <= 0.12) & (hsv[..., 2] > 0.02) & (hsv[..., 2] < 0.9)
    sel = (fam | grey) & (a > 0.2)
    out = hsv.copy()
    out[..., 0] = np.where(sel, th, out[..., 0])
    out[..., 1] = np.where(sel, np.clip(hsv[..., 1] * 0.2 + ts * 0.8 if from_hex is None else ts, 0, 1), out[..., 1])
    out[..., 2] = np.where(sel, np.clip(hsv[..., 2] * (tv / max(float(np.median(hsv[..., 2][sel])) if sel.any() else 1, 0.05)), 0, 1), out[..., 2])
    new = np.array([colorsys.hsv_to_rgb(*p) for p in out.reshape(-1, 3)]).reshape(rgb.shape)
    return Image.fromarray((np.dstack([new, a]) * 255).astype(np.uint8), 'RGBA')


def edit_prompt(slot: str, variant: str) -> str:
    return ('Edit the attached anime bust illustration. ' + SLOTS[slot]['ask'].format(v=variant) +
            ' Keep EVERYTHING else pixel-identical: the head shape, skin, face, framing, position, scale, outfit, line weight and the plain solid white background.'
            f' Style stays: {STYLE}. No text, no logo.')


def sheet(layers: list[tuple[str, Path]], base: Path | None, out: Path, cols: int = 4, cell: int = 260) -> None:
    ch = round(cell * 1.3)
    rows = (len(layers) + cols - 1) // cols
    img = Image.new('RGB', (cols * cell, rows * (ch + 22)), (245, 245, 245))
    from PIL import ImageDraw
    d = ImageDraw.Draw(img)
    bimg = load(base) if base else Image.new('RGB', (W, H), 'white')
    for i, (name, p) in enumerate(layers):
        tile = bimg.copy().convert('RGBA')
        tile.alpha_composite(Image.open(p).convert('RGBA'))
        tile = tile.convert('RGB').resize((cell, ch), Image.LANCZOS)
        x, y = (i % cols) * cell, (i // cols) * (ch + 22)
        img.paste(tile, (x, y + 22))
        d.text((x + 6, y + 5), name, fill=(20, 20, 20))
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)


# ── commands ─────────────────────────────────────────────────────────────────
def cmd_base(a):
    from gemini_img import generate
    prompt = (f'Original character head-and-shoulders bust, {STYLE}. A neutral young adult athlete, perfectly bald with NO hair and NO eyebrows, '
              'medium skin tone, calm neutral eyes, simple small nose, closed neutral mouth, plain light-grey training top, facing the viewer straight-on, perfectly frontal and symmetrical. '
              'Plain solid white background, no text, no logo. The attached image is ONLY a placement guide: put the top of the head, eye line, nose, mouth and chin on its guide lines '
              'and fill the same head oval; do NOT draw any of its lines, labels or outlines.')
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    for i in range(a.n):
        fit_canvas(Image.open(io.BytesIO(generate(prompt, images=[TEMPLATE], aspect='3:4'))).convert('RGB')).save(out / f'cand{i}.png')
        print('wrote', out / f'cand{i}.png')
    sheet([(p.stem, p) for p in sorted(out.glob('cand*.png'))], None, out / 'sheet.png', cols=a.n)


def variants(path: str) -> dict[str, dict[str, str]]:
    return json.loads(Path(path).read_text())


def run_variant(base: Path, slot: str, vid: str, desc: str, outdir: Path, tries: int = 3) -> Path | None:
    from gemini_img import generate
    raw = outdir / 'raw'; raw.mkdir(parents=True, exist_ok=True)
    for t in range(1, tries + 1):
        png = generate(edit_prompt(slot, desc), images=[base], aspect='3:4')
        (raw / f'{slot}_{vid}_try{t}.png').write_bytes(png)
        try:
            layer, st = extract(slot, base, Image.open(io.BytesIO(png)))
        except ValueError as e:
            print(f'  {slot}/{vid} try {t}: rejected: {e}')
            continue
        dst = outdir / slot / f'{vid}.png'; dst.parent.mkdir(parents=True, exist_ok=True)
        layer.save(dst); print(f'  {slot}/{vid} ok (try {t}, drift {st["drift"]:.3%}, coverage {st["coverage"]:.1%})')
        return dst
    print(f'  {slot}/{vid} FAILED after {tries} tries')
    return None


def cmd_probe(a):
    spec = variants(a.variants); out = Path(a.out); got = []
    for slot, items in spec.items():
        vid, desc = next(iter(items.items()))
        p = run_variant(Path(a.base), slot, vid, desc, out)
        if p: got.append((f'{slot}/{vid}', p))
    sheet(got, Path(a.base), out / 'probe_sheet.png')
    print('contact sheet:', out / 'probe_sheet.png')


def cmd_build(a):
    spec = variants(a.variants); got = []
    only = set(a.only.split(',')) if a.only else None
    for slot, items in spec.items():
        if a.slot and slot != a.slot: continue
        for vid, desc in items.items():
            if only and vid not in only: continue
            p = run_variant(Path(a.base), slot, vid, desc, OUT_ROOT if a.publish else Path(a.out))
            if p: got.append((f'{slot}/{vid}', p))
    sheet(got, Path(a.base), Path(a.out) / 'build_sheet.png')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest='cmd', required=True)
    b = sp.add_parser('base'); b.add_argument('--n', type=int, default=3); b.add_argument('--out', default='shots/parts/base'); b.set_defaults(f=cmd_base)
    for name, f in (('probe', cmd_probe), ('build', cmd_build)):
        p = sp.add_parser(name); p.add_argument('--base', required=True); p.add_argument('--variants', default='scripts/parts_spec.json')
        p.add_argument('--out', default='shots/parts/out'); p.set_defaults(f=f)
        if name == 'build':
            p.add_argument('--slot'); p.add_argument('--only'); p.add_argument('--publish', action='store_true', help='write straight into public/assets/player/')
    e = sp.add_parser('extract'); [e.add_argument(x) for x in ('slot', 'base', 'variant', 'out')]
    e.set_defaults(f=lambda a: (lambda r: (r[0].save(a.out), print(a.out, r[1])))(extract(a.slot, a.base, a.variant)))
    r = sp.add_parser('recolor'); [r.add_argument(x) for x in ('layer', 'out')]; r.add_argument('--to', required=True); r.add_argument('--from', dest='frm')
    r.set_defaults(f=lambda a: recolor(Image.open(a.layer), a.to, a.frm).save(a.out))
    s = sp.add_parser('sheet'); s.add_argument('dir'); s.add_argument('out'); s.add_argument('--base')
    s.set_defaults(f=lambda a: sheet([(p.stem, p) for p in sorted(Path(a.dir).glob('*.png'))], Path(a.base) if a.base else None, Path(a.out)))
    a = ap.parse_args(); a.f(a)


if __name__ == '__main__':
    main()
