# Usuwa z docs/img i img_meta.js ilustracje, których nie używa już żadne dzieło (po zmianie tytułów lub źródeł).
import os, re, json, subprocess
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
data = os.path.join(D, 'src', 'data')
js = "var fs=require('fs');" + ''.join("eval(fs.readFileSync(%s,'utf8'));" % json.dumps(os.path.join(data, f)) for f in sorted(os.listdir(data)) if re.match(r'e\d+\.js$', f)) \
    + "console.log(JSON.stringify(ERAS.flatMap(e=>e.w.map(w=>e.id+'|'+w.t))))"
keys = set(json.loads(subprocess.run(['node', '-e', js], capture_output=True, text=True, encoding='utf-8', check=True).stdout))
p = os.path.join(data, 'img_meta.js'); t = open(p, encoding='utf-8').read()
meta = json.loads(re.search(r'IMG_META = (.*);', t).group(1)); wimg = json.loads(re.search(r'WORK_IMG = (.*);', t).group(1))
wimg = {k: v for k, v in wimg.items() if k in keys}
used = set(wimg.values())
meta = {k: v for k, v in meta.items() if k in used}
removed = 0
for f in os.listdir(os.path.join(D, 'docs', 'img')):
    if f[:-4] not in used: os.remove(os.path.join(D, 'docs', 'img', f)); removed += 1
open(p, 'w', encoding='utf-8').write('var IMG_META = ' + json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + ';\n'
                                     + 'var WORK_IMG = ' + json.dumps(wimg, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('usunięto', removed, 'plików; dzieł z ilustracją:', len(wimg))
