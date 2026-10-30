# Szuka ilustracji w katalogu podręczników: python narzedzia/szukaj.py kuros kora ...
import json, os, sys, re
C = json.load(open(os.path.join(os.path.dirname(__file__), 'pdfcat.json'), encoding='utf-8'))
for q in sys.argv[1:]:
    print('==', q)
    for c in C:
        if q.lower() in c['cap'].lower(): print(' ', c['k'], c['w'], 'x', c['h'], '|', c['cap'][:110])
