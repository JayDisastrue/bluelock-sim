#!/usr/bin/env python3
"""Recolour each face-shape layer into the creator's eight skin tones: public/assets/player/face/<shape>__<tone>.png.

  python3 scripts/face_tones.py            # reads face/<shape>.png (written by slice_sheet.py), writes the tones, removes the base files

The skin colour of a layer is scaled channel-by-channel to the target tone, so the ink lines stay black and the cel shadows
keep their depth. The tone hexes match PALETTES.skin in src/cutscene/parts.ts (the drawn neck and body use the same value).
"""
from pathlib import Path
import numpy as np
from PIL import Image

TONES = {'pale': '#fde3cf', 'fair': '#fbe0c8', 'light': '#f0d0b0', 'medium': '#e5bd96', 'tan': '#d6a07a', 'brown': '#c08a63', 'deep': '#9a6a48', 'ebony': '#6b4630'}
FACE = Path(__file__).resolve().parent.parent / 'public/assets/player/face'


def rgb(h: str) -> np.ndarray:
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32)


def recolor(img: Image.Image, target: str) -> Image.Image:
    arr = np.asarray(img.convert('RGBA')).astype(np.float32)
    solid = arr[..., 3] > 200
    ys, xs = np.where(solid)
    cx, cy = (xs.min() + xs.max()) // 2, ys.min() + int(0.45 * (ys.max() - ys.min()))
    base = np.median(arr[cy - 40:cy + 40, cx - 90:cx + 90][..., :3].reshape(-1, 3), axis=0)  # cheek area of the face
    ratio = rgb(target) / np.maximum(base, 1)
    out = arr.copy()
    out[..., :3] = np.clip(arr[..., :3] * ratio, 0, 255)
    return Image.fromarray(out.astype(np.uint8), 'RGBA')


def main() -> None:
    bases = [p for p in sorted(FACE.glob('*.png')) if '__' not in p.stem]
    for p in bases:
        img = Image.open(p)
        for name, hexv in TONES.items():
            recolor(img, hexv).save(FACE / f'{p.stem}__{name}.png')
        p.unlink()
        print(f'{p.stem}: {len(TONES)} tones')


if __name__ == '__main__':
    main()
