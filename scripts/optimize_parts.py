#!/usr/bin/env python3
"""Shrink the creator part PNGs (256-colour palette with alpha, no dither). Cel-shaded art loses nothing visible; ~5x smaller.

  python3 scripts/optimize_parts.py            # every layer under public/assets/player/<slot>/
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / 'public/assets/player'


def main() -> None:
    before = after = 0
    for p in sorted(ROOT.glob('*/*.png')):
        before += p.stat().st_size
        im = Image.open(p).convert('RGBA')
        im.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(p, optimize=True)
        after += p.stat().st_size
    print(f'{before / 1e6:.1f} MB -> {after / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
