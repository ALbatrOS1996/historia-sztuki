# Ars – historia sztuki

Aplikacja do nauki historii sztuki: 37 epok od prehistorii do awangardy XX w., ponad 400 dzieł z ilustracjami, ok. 300 pojęć, sylwetki artystów, fiszki (system Leitnera) i 12 rodzajów ćwiczeń. Wygląd wzorowany na projekcie „Artory”.

Treści opracowane na podstawie podręcznika B. Lewińskiej i W.J. Kielera „Ars longa” t. I–III oraz notatek „Dzieje sztuki europejskiej od XIV do XX w.” (folder `Desktop/Historia sztuki`).

## Struktura

- `src/data/e1.js … e6.js` – epoki: teksty do czytania, cechy stylu, pojęcia, artyści, dzieła, pytania problemowe
- `src/data/img_meta.js` – generowany przez `obrazy.py`: przypisanie ilustracji do dzieł, licencje
- `src/*.js`, `src/style.css`, `src/index.html` – aplikacja
- `obrazy.py` – pobiera ilustracje z Wikimedia Commons, a gdy ich brak – wycina je z PDF-ów podręcznika (katalog podpisów: `narzedzia/pdfcat.json`, wyszukiwarka: `narzedzia/szukaj.py`)
- `build.py` – składa `Historia_sztuki.html` (jeden plik na komputer) i `docs/` (PWA na telefon)

## Dodawanie dzieła

Dopisz obiekt do tablicy `w` w danej epoce, z polem `w` (hasło Wikipedii, `pl:` dla polskiej) albo `pdf` (klucz z `narzedzia/szukaj.py`), potem:

```
python obrazy.py
python build.py
```
