# Rysuje ikony aplikacji: kremowa kolumna jońska na brązowym tle.
import os
from PIL import Image, ImageDraw
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'icons')
BROWN, CREAM = (169, 108, 69), (246, 239, 230)

def make(size, pad=0.0):
    k = 4; s = size * k
    im = Image.new('RGB', (s, s), BROWN)
    d = ImageDraw.Draw(im)
    sc = 1 - pad * 2
    f = lambda v: int(s / 2 + (v - .5) * s * sc)
    # abakus, woluty, trzon z żłobkami, baza
    d.rectangle([f(.27), f(.25), f(.73), f(.30)], fill=CREAM)
    for x in (.30, .70):
        d.ellipse([f(x - .07), f(.26), f(x + .07), f(.40)], outline=CREAM, width=int(s * .025 * sc))
    d.rectangle([f(.39), f(.31), f(.61), f(.74)], fill=CREAM)
    for x in (.445, .5, .555):
        d.line([f(x), f(.35), f(x), f(.71)], fill=BROWN, width=max(2, int(s * .012 * sc)))
    d.rectangle([f(.34), f(.74), f(.66), f(.78)], fill=CREAM)
    d.rectangle([f(.30), f(.78), f(.70), f(.82)], fill=CREAM)
    return im.resize((size, size), Image.LANCZOS)

os.makedirs(OUT, exist_ok=True)
make(192).save(os.path.join(OUT, 'icon-192.png'))
make(512).save(os.path.join(OUT, 'icon-512.png'))
make(512, .12).save(os.path.join(OUT, 'icon-maskable-512.png'))
make(180).save(os.path.join(OUT, 'apple-touch-icon.png'))
print('ikony OK')
