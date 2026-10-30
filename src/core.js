// Rdzeń: indeksy danych, stan (localStorage), pomocnicze.
var GROUPS = [
  { id: 'all', n: 'Wszystkie' },
  { id: 'star', n: 'Starożytność', inc: ['pre', 'star'] },
  { id: 'sred', n: 'Średniowiecze' },
  { id: 'now', n: 'Nowożytność' },
  { id: 'nowocz', n: 'Nowoczesność' }
];
var KINDS = { architektura: 'Architektura', 'rzeźba': 'Rzeźba', malarstwo: 'Malarstwo', grafika: 'Grafika', mozaika: 'Mozaika', 'rzemiosło': 'Rzemiosło' };
var IMG_BASE = typeof IMG_BASE_OVERRIDE !== 'undefined' ? IMG_BASE_OVERRIDE : 'img/';
var GOAL = 30;

// --- indeksy ---
var WORKS = [], TERMS = [], ARTISTS = [], FEATS = [], ERA = {};
ERAS.forEach(function (e, ei) {
  e.i = ei; ERA[e.id] = e;
  e.w.forEach(function (w, wi) {
    w.era = e; w.id = e.id + '.' + wi; w.key = e.id + '|' + w.t;
    w.img = WORK_IMG[w.key] || null;
    w.meta = w.img ? IMG_META[w.img] : null;
    WORKS.push(w);
  });
  e.terms.forEach(function (t, ti) { TERMS.push({ t: t[0], d: t[1], era: e, id: e.id + '#' + ti, key: 'p|' + t[0] }); });
  e.art.forEach(function (a) { ARTISTS.push({ n: a[0], y: a[1], d: a[2], era: e }); });
  e.f.forEach(function (f) { FEATS.push({ t: f, era: e }); });
});
var WORK_BY_ID = {}; WORKS.forEach(function (w) { WORK_BY_ID[w.id] = w; });
var IMG_WORKS = WORKS.filter(function (w) { return w.img; });

// --- stan ---
var S = (function () {
  var d = { xp: {}, ok: {}, box: {}, fav: [], read: {}, theme: 'light', seenStart: false };
  try { var s = JSON.parse(localStorage.getItem('ars_v1')); if (s) for (var k in s) d[k] = s[k]; } catch (e) {}
  return d;
})();
function save() { try { localStorage.setItem('ars_v1', JSON.stringify(S)); } catch (e) {} }
function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function xpToday() { return S.xp[today()] || 0; }
function xpTotal() { var s = 0; for (var k in S.xp) s += S.xp[k]; return s; }
function addXP(n) { S.xp[today()] = xpToday() + n; save(); }
function streak() {
  var n = 0, d = new Date();
  if (!S.xp[today()]) d.setDate(d.getDate() - 1);
  while (true) {
    var k = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    if (!S.xp[k]) break; n++; d.setDate(d.getDate() - 1);
  }
  return n;
}
// zaliczenie elementu (dzieła lub pojęcia) – liczy się do postępu epoki
function mark(key, good) {
  S.ok[key] = Math.max(0, (S.ok[key] || 0) + (good ? 1 : -1));
  save();
}
function eraProgress(e) {
  var keys = e.w.map(function (w) { return w.key; }).concat(e.terms.map(function (t) { return 'p|' + t[0]; }));
  var done = keys.filter(function (k) { return S.ok[k] > 0; }).length;
  return Math.round(100 * (done / keys.length * 0.85 + (S.read[e.id] ? 0.15 : 0)));
}
function isFav(id) { return S.fav.indexOf(id) >= 0; }
function toggleFav(id) { var i = S.fav.indexOf(id); if (i >= 0) S.fav.splice(i, 1); else S.fav.push(id); save(); }

// --- pomocnicze ---
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l'); }
function imgSrc(w) { return w && w.img ? IMG_BASE + w.img + '.jpg' : ''; }
// okładki epok – najbardziej rozpoznawalne dzieło
var COVERS = { prehistoria: 'Malowidła w jaskini Lascaux', mezopotamia: 'Brama Isztar', egipt: 'Piramidy w Gizie', egejska: 'Skoki przez byka (fresk)', grecja: 'Partenon', rzym: 'Panteon',
  wczesnochrzescijanska: 'Mauzoleum Galli Placydii', bizancjum: 'Hagia Sophia', przedromanska: 'Księga z Kells', romanizm: 'Zespół katedralny w Pizie', gotykpl: 'Ołtarz Mariacki',
  quattrocento: 'Narodziny Wenus', cinquecento: 'Stworzenie Adama', manieryzm: 'Madonna z długą szyją', renpolnoc: 'Myśliwi na śniegu', renpolska: 'Kaplica Zygmuntowska',
  barokwlochy: 'Ekstaza św. Teresy', barokhiszpania: 'Panny dworskie (Las Meninas)', barokfrancja: 'Pałac w Wersalu', barokniderlandy: 'Dziewczyna z perłą', rokoko: 'Huśtawka',
  barokpolska: 'Pałac w Wilanowie', klasycyzm: 'Przysięga Horacjuszy', klasycyzmpl: 'Pałac Na Wyspie (Łazienki)', historyzm: 'Pałac Westminsterski', romantyzm: 'Wędrowiec nad morzem mgieł',
  realizm: 'Zbieraczki kłosów', akademizm: 'Ofelia', polska19: 'Stańczyk', impresjonizm: 'Impresja, wschód słońca', postimpresjonizm: 'Gwiaździsta noc', symbolizm: 'Wyspa umarłych',
  secesja: 'Pocałunek', mlodapolska: 'Błędne koło', awangarda1: 'Taniec', awangarda2: 'Trwałość pamięci' };
function eraCover(e) {
  var w = e.w.filter(function (x) { return x.img; });
  return w.filter(function (x) { return x.t === COVERS[e.id]; })[0] || w[0] || null;
}
function inGroup(e, g) {
  if (g === 'all') return true;
  var gr = GROUPS.filter(function (x) { return x.id === g; })[0];
  return (gr.inc || [g]).indexOf(e.g) >= 0;
}
function plural(n, a, b, c) { return n === 1 ? a : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? b : c; }
function credit(w) {
  var m = w.meta; if (!m) return '';
  if (m.pdf) return 'Ilustracja: ' + esc(m.lic);
  var au = m.au ? esc(m.au) + ' · ' : '';
  return 'Fot.: ' + au + esc(m.lic || '') + ' · <a href="https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(m.f) + '" target="_blank" rel="noopener">Wikimedia Commons</a>';
}
function toast(msg) {
  var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(function () { t.classList.add('on'); }, 10);
  setTimeout(function () { t.classList.remove('on'); setTimeout(function () { t.remove(); }, 400); }, 1900);
}
