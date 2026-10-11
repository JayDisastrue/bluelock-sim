"""Offline checks for the part-extraction step (no API calls):  python3 scripts/test_gen_parts.py"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw
sys.path.insert(0, str(Path(__file__).parent))
import gen_parts as g

SKIN = (224, 180, 150)


def bust(hair=None, eyes='a'):
    im = Image.new('RGB', (1000, 1300), 'white'); d = ImageDraw.Draw(im)
    d.ellipse((270, 290, 730, 910), fill=SKIN, outline=(60, 40, 30), width=4)
    for x in (390, 610):
        d.ellipse((x - 45, 555, x + 45, 605), fill='white', outline=(40, 30, 30), width=3)
        d.ellipse((x - 18 if eyes == 'a' else x - 10, 565, x + 18 if eyes == 'a' else x + 10, 600), fill=(90, 60, 30))
    if hair:
        d.pieslice((240, 230, 760, 700), 180, 360, fill=(40, 30, 30))
    if hair == 'drift':
        d.rectangle((300, 1100, 500, 1250), fill=(200, 0, 0))
    return im


def expect_reject(slot, a, b, word):
    try:
        g.extract(slot, a, b)
    except ValueError as e:
        assert word in str(e), e
        return
    raise AssertionError('expected rejection: ' + word)


base = bust()
layer, st = g.extract('hair', base, bust('ok'))
assert layer.size == (1000, 1300) and layer.mode == 'RGBA' and layer.getbbox()[1] < 300, 'hair layer sits above the head'
assert layer.getpixel((500, 500))[3] == 0, 'face is transparent'
expect_reject('hair', base, bust('drift'), 'drift')
expect_reject('hair', base, bust(), 'empty')
eyes, st = g.extract('eyes', base, bust(eyes='b'))
assert 540 < eyes.getbbox()[1] and eyes.getbbox()[3] < 640, 'eyes stay in the eye band'
assert g.recolor(layer, '#c0392b').getpixel((500, 300))[0] > 150, 'recolour reaches dark hair'
print('ok')
