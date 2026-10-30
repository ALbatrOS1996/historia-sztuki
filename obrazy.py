# Pobiera ilustracje dzieł z Wikipedii / Wikimedia Commons do docs/img/ (raz; istniejące pliki pomija).
# Dzieło wskazuje obraz polem w: hasło angielskiej Wikipedii, 'pl:Hasło' dla polskiej
# albo img: 'Nazwa_pliku.jpg' z Commons. Plik zapisuje się jako img/<slug>.jpg.
# Wynik: src/data/img_meta.js (autorzy/licencje do podpisów), lista braków na ekranie.
import os, re, json, subprocess, sys, time, io, urllib.request, urllib.parse
from PIL import Image

D = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(D, 'docs', 'img')
os.makedirs(OUT, exist_ok=True)
UA = {'User-Agent': 'ArsHistoriaSztuki/1.0 (aplikacja edukacyjna; pobieranie jednorazowe)'}

def slug(s):
    s = s.lower()
    for a, b in zip('ąćęłńóśźżàáâäãåèéêëìíîïòóôöõùúûüçñ', 'acelnoszzaaaaaaeeeeiiiiooooouuuucn'):
        s = s.replace(a, b)
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:60]

def get(url, tries=4):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                return r.read()
        except Exception as e:
            if '404' in str(e): raise
            time.sleep(5 + i * 8)
    raise RuntimeError('nie pobrano ' + url)

def works():
    js = "var fs=require('fs');" + ''.join(
        "eval(fs.readFileSync(%s,'utf8'));" % json.dumps(os.path.join(D, 'src', 'data', f))
        for f in sorted(os.listdir(os.path.join(D, 'src', 'data'))) if re.match(r'e\d+\.js$', f)
    ) + "console.log(JSON.stringify(ERAS.flatMap(e=>e.w.map(w=>({era:e.id,t:w.t,a:w.a,w:w.w,img:w.img,pdf:w.pdf})))))"
    return json.loads(subprocess.run(['node', '-e', js], capture_output=True, text=True, encoding='utf-8', check=True).stdout)

FILE_CACHE, INFO_CACHE = {}, {}

def prefetch(ws):
    """Hurtowe zapytania (po 50 tytułów) – pojedyncze zapytania Wikipedia mocno dławi."""
    for lang in ('en', 'pl'):
        titles = sorted({w['w'][3:] if lang == 'pl' else w['w'] for w in ws if w.get('w') and not w.get('img') and w['w'].startswith('pl:') == (lang == 'pl')})
        for i in range(0, len(titles), 50):
            q = urllib.parse.urlencode({'action': 'query', 'titles': '|'.join(titles[i:i + 50]), 'prop': 'pageimages',
                                        'piprop': 'name', 'redirects': 1, 'format': 'json', 'pilimit': 50})
            data = json.loads(get('https://%s.wikipedia.org/w/api.php?%s' % (lang, q)))['query']
            back = {}
            for x in data.get('normalized', []) + data.get('redirects', []): back[x['to']] = back.get(x['from'], x['from'])
            for p in data['pages'].values():
                orig = back.get(p['title'], p['title'])
                FILE_CACHE[(lang, orig)] = p.get('pageimage')
            time.sleep(1)
    files = sorted({f for f in FILE_CACHE.values() if f} | {w['img'] for w in ws if w.get('img')})
    for i in range(0, len(files), 50):
        q = urllib.parse.urlencode({'action': 'query', 'titles': '|'.join('File:' + f for f in files[i:i + 50]), 'prop': 'imageinfo',
                                    'iiprop': 'url|extmetadata', 'iiurlwidth': 960, 'format': 'json'})
        data = json.loads(get('https://commons.wikimedia.org/w/api.php?' + q))['query']
        back = {x['to']: x['from'] for x in data.get('normalized', [])}
        for p in data['pages'].values():
            name = back.get(p['title'], p['title'])[5:]
            INFO_CACHE[name.replace(' ', '_')] = parse_info(p)
            INFO_CACHE[name] = INFO_CACHE[name.replace(' ', '_')]
        time.sleep(1)
    print('prefetch:', len(FILE_CACHE), 'haseł,', len(INFO_CACHE) // 2, 'plików', flush=True)

def parse_info(p):
    if 'imageinfo' not in p: return None
    ii = p['imageinfo'][0]
    m = ii.get('extmetadata', {})
    clean = lambda k: re.sub(r'<[^>]+>', '', m.get(k, {}).get('value', '')).strip()[:120]
    return {'url': ii.get('thumburl') or ii['url'], 'lic': clean('LicenseShortName'), 'au': clean('Artist'),
            'page': ii.get('descriptionurl', '')}

def file_for(w):
    """Zwraca nazwę pliku na Commons dla dzieła."""
    if w.get('img'): return w['img']
    lang, title = ('pl', w['w'][3:]) if w['w'].startswith('pl:') else ('en', w['w'])
    if (lang, title) in FILE_CACHE: return FILE_CACHE[(lang, title)]
    q = urllib.parse.urlencode({'action': 'query', 'titles': title, 'prop': 'pageimages', 'piprop': 'name',
                                'redirects': 1, 'format': 'json'})
    data = json.loads(get('https://%s.wikipedia.org/w/api.php?%s' % (lang, q)))
    for p in data['query']['pages'].values():
        if 'pageimage' in p: return p['pageimage']
    return None

def info(fname):
    if fname in INFO_CACHE: return INFO_CACHE[fname]
    q = urllib.parse.urlencode({'action': 'query', 'titles': 'File:' + fname, 'prop': 'imageinfo',
                                'iiprop': 'url|extmetadata', 'iiurlwidth': 960, 'format': 'json'})
    data = json.loads(get('https://commons.wikimedia.org/w/api.php?' + q))
    p = next(iter(data['query']['pages'].values()))
    if 'imageinfo' not in p:  # plik lokalny w Wikipedii (np. pl), nie z Commons
        return None
    ii = p['imageinfo'][0]
    m = ii.get('extmetadata', {})
    clean = lambda k: re.sub(r'<[^>]+>', '', m.get(k, {}).get('value', '')).strip()[:120]
    return {'url': ii.get('thumburl') or ii['url'], 'lic': clean('LicenseShortName'), 'au': clean('Artist'),
            'page': ii.get('descriptionurl', '')}

meta_path = os.path.join(D, 'src', 'data', 'img_meta.js')
meta, wimg = {}, {}
if os.path.exists(meta_path):
    t = open(meta_path, encoding='utf-8').read()
    meta = json.loads(re.search(r'IMG_META = (.*);', t).group(1))
    wimg = json.loads(re.search(r'WORK_IMG = (.*);', t).group(1))

# --- ilustracje z podręczników PDF (katalog: narzedzia/pdfcat.json, budowany przez narzedzia/katalog_pdf.py) ---
PDFDIR = os.path.join(os.path.expanduser('~'), 'Desktop', 'Historia sztuki')
PDFS = {'1': 'Ars longa_T_1.pdf', '2': 'Ars_Longa,_Tom_II.pdf', '3': 'Ars longa_T_3.pdf'}
CAT = json.load(open(os.path.join(D, 'narzedzia', 'pdfcat.json'), encoding='utf-8'))
_docs = {}
def norm(s): return slug(s).replace('-', ' ')
def pdf_match(title, author):
    words = [x for x in norm(title).split() if len(x) > 2]
    if author: words += [x for x in norm(author).split() if len(x) > 3][-1:]
    best = None
    for c in CAT:
        cap = ' ' + norm(c['cap'][:160]) + ' '
        if words and all(' ' + x in cap for x in words):
            if best is None or c['w'] * c['h'] > best['w'] * best['h']: best = c
    return best and best['k']
def pdf_image(k, path):
    import pymupdf
    vol, page, xref = k.split('_')
    if vol not in _docs: _docs[vol] = pymupdf.open(os.path.join(PDFDIR, PDFS[vol]))
    pix = pymupdf.Pixmap(_docs[vol], int(xref))
    if pix.n - pix.alpha >= 4 or pix.alpha: pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    im = Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')
    im.thumbnail((1000, 1000))
    im.save(path, 'JPEG', quality=80, optimize=True, progressive=True)
    return im

def save_meta():
    open(meta_path, 'w', encoding='utf-8').write(
        'var IMG_META = ' + json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + ';\n' +
        'var WORK_IMG = ' + json.dumps(wimg, ensure_ascii=False, separators=(',', ':')) + ';\n')

missing = []
ws = works()
only = sys.argv[1:]
todo = [w for w in ws if (not only or w['era'] in only) and not w.get('pdf') and w.get('w')]
prefetch(todo)
for w in ws:
    if only and w['era'] not in only: continue
    wk = w['era'] + '|' + w['t']
    if wk in wimg and os.path.exists(os.path.join(OUT, wimg[wk] + '.jpg')) and not (w.get('pdf') and not wimg[wk].startswith('pdf-')): continue
    try:
        k = w.get('pdf')
        if not k and w.get('w'):
            key = slug(w.get('img') or w['w'])
            path = os.path.join(OUT, key + '.jpg')
            if os.path.exists(path) and key in meta: wimg[wk] = key; continue
            fname = file_for(w)
            inf = fname and info(fname)
            if inf:
                if os.path.exists(path):  # plik jest, brakowało tylko opisu licencji
                    im = Image.open(path)
                else:
                    im = Image.open(io.BytesIO(get(inf['url']))).convert('RGB')
                    im.thumbnail((1000, 1000))
                    im.save(path, 'JPEG', quality=76, optimize=True, progressive=True)
                    time.sleep(1.2)
                meta[key] = {'f': fname, 'lic': inf['lic'], 'au': inf['au'], 'r': round(im.width / im.height, 3)}
                wimg[wk] = key
                print('ok  ', key, im.size, inf['lic'], flush=True)
                save_meta()
                continue
        k = k or pdf_match(w['t'], w.get('a'))
        if not k: missing.append((w['era'], w['t'], w.get('w'), 'brak w Commons i w PDF')); continue
        key = 'pdf-' + k
        im = pdf_image(k, os.path.join(OUT, key + '.jpg'))
        vol = k.split('_')[0]
        meta[key] = {'f': '', 'lic': 'Ars longa t. %s, s. %s' % (vol, k.split('_')[1]), 'au': '', 'r': round(im.width / im.height, 3), 'pdf': 1}
        wimg[wk] = key
        print('pdf ', key, im.size, w['t'], flush=True)
        save_meta()
    except Exception as e:
        missing.append((w['era'], w['t'], w.get('w'), str(e)[:80]))

save_meta()
print('\nobrazów:', len(meta), ' dzieł z ilustracją:', len(wimg), ' braków:', len(missing))
for m in missing: print('BRAK', *m, sep=' | ')
