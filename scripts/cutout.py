#!/usr/bin/env python3
"""Cut a solid-white background out of a character image and frame it for the game.

  python3 scripts/cutout.py input.png output.png          # one file
  python3 scripts/cutout.py inputs_dir/ public/assets/portraits/   # a folder (uses file names as ids)

Removes white regions that touch the border AND large enclosed white pockets (e.g. between an arm and the torso).
Small white details inside the character (jersey numbers, stripes, highlights) are kept. Output is a transparent PNG
cropped to the character and padded to 2:3 with the head near the top. Requires Pillow (`pip install pillow`).
"""
import sys
from collections import deque
from pathlib import Path
from PIL import Image, ImageFilter

WHITE = 246          # a pixel is "white" when all channels >= this
MIN_POCKET = 2500    # enclosed white regions at least this many pixels are background too


def cutout(src: Path, dst: Path) -> None:
    im = Image.open(src).convert('RGB')
    w, h = im.size
    data = im.tobytes()
    white = bytearray(1 if data[i] >= WHITE and data[i + 1] >= WHITE and data[i + 2] >= WHITE else 0 for i in range(0, len(data), 3))
    remove = bytearray(w * h)
    seen = bytearray(w * h)
    for start in range(w * h):
        if not white[start] or seen[start]:
            continue
        comp, touches = [], False
        q = deque([start])
        seen[start] = 1
        while q:
            p = q.popleft()
            comp.append(p)
            x, y = p % w, p // w
            if x == 0 or y == 0 or x == w - 1 or y == h - 1:
                touches = True
            for n in ((p - 1) if x else -1, (p + 1) if x < w - 1 else -1, (p - w) if y else -1, (p + w) if y < h - 1 else -1):
                if n >= 0 and white[n] and not seen[n]:
                    seen[n] = 1
                    q.append(n)
        if touches or len(comp) >= MIN_POCKET:
            for p in comp:
                remove[p] = 1
    alpha = Image.frombytes('L', (w, h), bytes(0 if r else 255 for r in remove))
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))  # trim the white halo, soften the edge
    rgba = im.convert('RGBA')
    rgba.putalpha(alpha)
    box = alpha.point(lambda v: 255 if v > 24 else 0).getbbox()
    if box:
        rgba = rgba.crop(box)
    cw, ch = rgba.size
    # pad to 2:3, character centred horizontally, ~3% margin at the top (head near the top of the frame)
    top = int(ch * 0.03)
    height = max(ch + top + int(ch * 0.02), int(cw * 1.5))
    width = int(height * 2 / 3)
    canvas = Image.new('RGBA', (width, height), (255, 255, 255, 0))
    canvas.paste(rgba, ((width - cw) // 2, top), rgba)
    dst.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dst)
    print(f'{src.name}: {w}x{h} -> {canvas.size[0]}x{canvas.size[1]}, removed {sum(remove) * 100 // (w * h)}% as background')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    a, b = Path(sys.argv[1]), Path(sys.argv[2])
    if a.is_dir():
        for f in sorted(a.glob('*.png')) + sorted(a.glob('*.jpg')):
            cutout(f, b / (f.stem + '.png'))
    else:
        cutout(a, b)
