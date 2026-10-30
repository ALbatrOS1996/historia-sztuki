# Arkusz kontrolny ilustracji: miniatury z podpisami (do sprawdzenia, czy obraz pasuje do dzieła).
# python narzedzia/arkusz.py <plik_wyjściowy.jpg> [epoka ...]
import os, re, json, sys, subprocess
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
t = open(os.path.join(D, 'src', 'data', 'img_meta.js'), encoding='utf-8').read()
wimg = json.loads(re.search(r'WORK_IMG = (.*);', t).group(1))
out, eras = sys.argv[1], sys.argv[2:]
items = [(k, v) for k, v in wimg.items() if not eras or k.split('|')[0] in eras]
W, H, C = 200, 170, 6
rows = (len(items) + C - 1) // C
sheet = Image.new('RGB', (W * C, H * rows), 'white')
d = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype('arial.ttf', 12)
except Exception: font = ImageFont.load_default()
for i, (k, v) in enumerate(items):
    x, y = (i % C) * W, (i // C) * H
    try:
        im = Image.open(os.path.join(D, 'docs', 'img', v + '.jpg')); im.thumbnail((W - 6, H - 34))
        sheet.paste(im, (x + 3, y + 3))
    except Exception: pass
    d.text((x + 3, y + H - 30), k.split('|')[1][:30], fill='black', font=font)
    d.text((x + 3, y + H - 16), k.split('|')[0], fill='gray', font=font)
sheet.save(out, quality=80)
print(len(items), 'pozycji')
