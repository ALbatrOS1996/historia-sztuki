// Generatory zadań. Każde zadanie: { kind, title, prompt, img, crop, opts:[{l,ok}], key, explain } lub typy specjalne (order, pairs, tf, open).
var EX_TYPES = [
  { id: 'dzielo', n: 'Rozpoznaj dzieło', d: 'Widzisz ilustrację – wybierz tytuł.', ic: 'image' },
  { id: 'autor', n: 'Kto jest autorem?', d: 'Rozpoznawanie artystów po ich dziełach.', ic: 'brush' },
  { id: 'epoka', n: 'Rozpoznaj styl i epokę', d: 'Po czym poznać gotyk, a po czym barok?', ic: 'columns' },
  { id: 'detal', n: 'Detektyw: szczegół', d: 'Tylko fragment obrazu. Co to za dzieło?', ic: 'zoom' },
  { id: 'pojecie', n: 'Pojęcia', d: 'Definicja → termin i odwrotnie.', ic: 'book' },
  { id: 'cecha', n: 'Cechy stylów', d: 'Do której epoki pasuje opisana cecha?', ic: 'quote' },
  { id: 'chrono', n: 'Oś czasu', d: 'Ułóż dzieła od najstarszego.', ic: 'clock' },
  { id: 'pary', n: 'Połącz w pary', d: 'Artysta ↔ dzieło.', ic: 'puzzle' },
  { id: 'miejsce', n: 'Gdzie to jest?', d: 'Miasta, muzea i kolekcje.', ic: 'pin' },
  { id: 'pf', n: 'Prawda czy fałsz', d: 'Szybkie twierdzenia o dziełach i stylach.', ic: 'check' },
  { id: 'otwarte', n: 'Pytania problemowe', d: 'Odpowiedz w myślach, potem porównaj.', ic: 'quote' },
  { id: 'mix', n: 'Mieszanka', d: 'Wszystkie typy zadań na zmianę.', ic: 'shuffle' }
];

// dystraktory: najpierw z tej samej lub sąsiedniej epoki, potem z całej puli
function distract(correct, pool, getLabel, n, near) {
  var seen = {}; seen[norm(getLabel(correct))] = 1;
  var out = [];
  var ordered = near ? shuffle(pool.filter(function (x) { return Math.abs(x.era.i - near.i) <= 2; })).concat(shuffle(pool)) : shuffle(pool);
  for (var i = 0; i < ordered.length && out.length < n; i++) {
    var l = getLabel(ordered[i]); if (!l) continue;
    var k = norm(l); if (seen[k]) continue; seen[k] = 1; out.push(l);
  }
  return out;
}
function opts(right, wrong) { return shuffle([{ l: right, ok: true }].concat(wrong.map(function (l) { return { l: l, ok: false }; }))); }
function workLine(w) { return '<b>' + esc(w.t) + '</b>' + (w.a ? ' · ' + esc(w.a) : '') + ' · ' + esc(w.y); }

var GEN = {
  dzielo: function (sc) {
    var pool = IMG_WORKS.filter(function (w) { return sc.indexOf(w.era) >= 0; }); if (pool.length < 2) return null;
    var w = pick(pool);
    return { kind: 'choice', title: 'Rozpoznaj dzieło', prompt: 'Jaki tytuł nosi to dzieło?', img: w, key: w.key,
      opts: opts(w.t, distract(w, IMG_WORKS, function (x) { return x.k === w.k || Math.random() < .3 ? x.t : null; }, 3, w.era)),
      explain: workLine(w) + '<br>' + esc(w.d) };
  },
  autor: function (sc) {
    var pool = IMG_WORKS.filter(function (w) { return w.a && sc.indexOf(w.era) >= 0; }); if (!pool.length) return null;
    var w = pick(pool);
    return { kind: 'choice', title: 'Kto jest autorem?', prompt: 'Kto stworzył „' + esc(w.t) + '”?', img: w, key: w.key,
      opts: opts(w.a, distract(w, WORKS.filter(function (x) { return x.a; }), function (x) { return x.a; }, 3, w.era)),
      explain: workLine(w) };
  },
  epoka: function (sc) {
    var pool = IMG_WORKS.filter(function (w) { return sc.indexOf(w.era) >= 0; }); if (!pool.length) return null;
    var w = pick(pool);
    var wrong = distract({ era: w.era, n: w.era.n }, ERAS.map(function (e) { return { era: e, n: e.n }; }), function (x) { return x.n; }, 3, w.era);
    return { kind: 'choice', title: 'Rozpoznaj styl i epokę', prompt: 'Do jakiej epoki lub kierunku należy to dzieło?', img: w, key: w.key,
      opts: opts(w.era.n, wrong), explain: workLine(w) + '<br><i>' + esc(w.era.n) + ', ' + esc(w.era.y) + '</i>' };
  },
  detal: function (sc) {
    var pool = IMG_WORKS.filter(function (w) { return w.k !== 'architektura' && sc.indexOf(w.era) >= 0; }); if (pool.length < 2) return null;
    var w = pick(pool);
    var crop = { x: 25 + Math.random() * 50, y: 25 + Math.random() * 50, z: 2.2 + Math.random() * .8 };
    return { kind: 'choice', title: 'Detektyw: szczegół', prompt: 'Z jakiego dzieła pochodzi ten fragment?', img: w, crop: crop, key: w.key,
      opts: opts(w.t, distract(w, IMG_WORKS.filter(function (x) { return x.k !== 'architektura'; }), function (x) { return x.t; }, 3, w.era)),
      explain: workLine(w) };
  },
  pojecie: function (sc) {
    var pool = TERMS.filter(function (t) { return sc.indexOf(t.era) >= 0; }); if (pool.length < 2) return null;
    var t = pick(pool);
    if (Math.random() < .6) return { kind: 'choice', title: 'Pojęcia', prompt: '<span class="def">' + esc(t.d) + '</span><br>Jak nazywa się to pojęcie?', key: t.key,
      opts: opts(t.t, distract(t, TERMS, function (x) { return x.t; }, 3, t.era)), explain: '<b>' + esc(t.t) + '</b> – ' + esc(t.d) };
    return { kind: 'choice', small: true, title: 'Pojęcia', prompt: 'Co oznacza termin <b>„' + esc(t.t) + '”</b>?', key: t.key,
      opts: opts(t.d, distract(t, TERMS, function (x) { return x.d; }, 3, t.era)), explain: '<b>' + esc(t.t) + '</b> – ' + esc(t.d) };
  },
  cecha: function (sc) {
    var pool = FEATS.filter(function (f) { return sc.indexOf(f.era) >= 0; }); if (!pool.length) return null;
    var f = pick(pool);
    var wrong = distract({ era: f.era, n: f.era.n }, ERAS.map(function (e) { return { era: e, n: e.n }; }), function (x) { return x.n; }, 3, f.era);
    return { kind: 'choice', title: 'Cechy stylów', prompt: 'Której epoki lub kierunku to cecha?<br><span class="def">„' + esc(f.t) + '”</span>', key: null,
      opts: opts(f.era.n, wrong), explain: 'Cecha: <b>' + esc(f.era.n) + '</b>. Pozostałe cechy: ' + esc(f.era.f.filter(function (x) { return x !== f.t; }).slice(0, 3).join('; ')) + '…' };
  },
  chrono: function (sc) {
    var pool = WORKS.filter(function (w) { return sc.indexOf(w.era) >= 0; });
    if (sc.length < 3) pool = WORKS.filter(function (w) { return Math.abs(w.era.i - sc[0].i) <= 3; });
    var items = [], used = {};
    shuffle(pool).forEach(function (w) {
      if (items.length >= 4) return;
      if (items.some(function (x) { return Math.abs(x.yr - w.yr) < 15; })) return;
      items.push(w);
    });
    if (items.length < 4) return null;
    return { kind: 'order', title: 'Oś czasu', prompt: 'Dotknij dzieł w kolejności od <b>najstarszego</b> do najmłodszego.', items: shuffle(items),
      answer: items.slice().sort(function (a, b) { return a.yr - b.yr; }) };
  },
  pary: function (sc) {
    var pool = WORKS.filter(function (w) { return w.a && sc.indexOf(w.era) >= 0; });
    if (sc.length < 3) pool = WORKS.filter(function (w) { return w.a && Math.abs(w.era.i - sc[0].i) <= 2; });
    var items = [], used = {};
    shuffle(pool).forEach(function (w) { if (items.length < 4 && !used[w.a]) { used[w.a] = 1; items.push(w); } });
    if (items.length < 3) return null;
    return { kind: 'pairs', title: 'Połącz w pary', prompt: 'Połącz artystę z jego dziełem.', items: items };
  },
  miejsce: function (sc) {
    var pool = WORKS.filter(function (w) { return w.p && w.p !== '—' && sc.indexOf(w.era) >= 0; }); if (!pool.length) return null;
    var w = pick(pool);
    return { kind: 'choice', title: 'Gdzie to jest?', prompt: 'Gdzie znajduje się „' + esc(w.t) + '”' + (w.a ? ' (' + esc(w.a) + ')' : '') + '?', img: w.img ? w : null, key: w.key,
      opts: opts(w.p, distract(w, WORKS.filter(function (x) { return x.p && x.p !== '—'; }), function (x) { return x.p; }, 3, w.era)), explain: workLine(w) + '<br>' + esc(w.p) };
  },
  pf: function (sc) {
    var pool = WORKS.filter(function (w) { return sc.indexOf(w.era) >= 0; }); if (!pool.length) return null;
    var w = pick(pool), truth = Math.random() < .5, st, kind = Math.random();
    if (w.a && kind < .45) {
      var other = truth ? w.a : distract(w, WORKS.filter(function (x) { return x.a; }), function (x) { return x.a; }, 1, w.era)[0];
      st = 'Autorem dzieła „' + esc(w.t) + '” jest <b>' + esc(other) + '</b>.';
    } else if (kind < .75) {
      var era = truth ? w.era : pick(ERAS.filter(function (e) { return e !== w.era && Math.abs(e.i - w.era.i) <= 4; }));
      st = '„' + esc(w.t) + '” to dzieło epoki: <b>' + esc(era.n) + '</b>.';
    } else {
      var t = pick(TERMS.filter(function (x) { return sc.indexOf(x.era) >= 0; })) || pick(TERMS);
      var def = truth ? t.d : pick(TERMS.filter(function (x) { return x !== t; })).d;
      return { kind: 'tf', title: 'Prawda czy fałsz', prompt: '<b>' + esc(t.t) + '</b> – ' + esc(def), truth: truth, key: t.key, explain: '<b>' + esc(t.t) + '</b> – ' + esc(t.d) };
    }
    return { kind: 'tf', title: 'Prawda czy fałsz', prompt: st, img: w.img ? w : null, truth: truth, key: w.key, explain: workLine(w) + ' — ' + esc(w.era.n) };
  },
  otwarte: function (sc) {
    var pool = []; sc.forEach(function (e) { (e.q || []).forEach(function (q) { pool.push({ q: q[0], a: q[1], era: e }); }); });
    if (!pool.length) return null;
    var q = pick(pool);
    return { kind: 'open', title: 'Pytanie problemowe · ' + q.era.n, prompt: esc(q.q), answer: esc(q.a) };
  }
};

function makeQuestion(type, scope) {
  for (var tries = 0; tries < 12; tries++) {
    var t = type === 'mix' ? pick(['dzielo', 'dzielo', 'autor', 'epoka', 'detal', 'pojecie', 'pojecie', 'cecha', 'chrono', 'pary', 'miejsce', 'pf']) : type;
    var q = GEN[t](scope); if (q) { q.type = t; return q; }
  }
  return null;
}
