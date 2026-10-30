// Widoki aplikacji. Każdy zwraca HTML i opcjonalnie podpina zdarzenia w after().
var V = {};
var ui = { group: 'all', q: '', galKind: '', galEra: '', galQ: '' };

function header(opts) {
  opts = opts || {};
  return '<header class="top">' +
    (opts.back ? '<button class="sq" onclick="goBack()" aria-label="Wstecz">' + ic('back') + '</button>' : '<button class="sq" onclick="openMenu()" aria-label="Menu">' + ic('menu') + '</button>') +
    '<a class="brand" href="#/epoki">' + (opts.title || 'Ars') + '</a>' +
    '<a class="sq" href="#/postepy" aria-label="Postępy">' + ic('user') + (xpToday() >= GOAL ? '<i class="dot"></i>' : '') + '</a>' +
    '</header>';
}
function tabs(list, cur, fn) {
  return '<nav class="tabs">' + list.map(function (t) {
    return '<button class="' + (t.id === cur ? 'on' : '') + '" onclick="' + fn + '(\'' + t.id + '\')">' + esc(t.n) + '</button>';
  }).join('') + '</nav>';
}
function chip(s, cls) { return '<span class="chip ' + (cls || '') + '">' + esc(s) + '</span>'; }
function imgTag(w, cls, eager) {
  if (!w || !w.img) return '<div class="noimg ' + (cls || '') + '">' + ic('image') + '</div>';
  return '<img class="' + (cls || '') + '" src="' + imgSrc(w) + '" alt="' + esc(w.t) + '"' + (eager ? '' : ' loading="lazy"') + ' decoding="async">';
}

/* ---------- START (ekran powitalny jak w Artory) ---------- */
V.start = function () {
  var hero = WORKS.filter(function (w) { return w.img === 'apollo-belvedere'; })[0] || IMG_WORKS[0];
  var s = streak();
  return '<section class="start">' +
    '<div class="start-top"><span class="brand big">Ars</span><button class="sq ghost" onclick="toggleTheme()" aria-label="Motyw">' + ic(S.theme === 'dark' ? 'sun' : 'moon') + '</button></div>' +
    '<div class="statue"><img src="' + imgSrc(hero) + '" alt="Apollo Belwederski"></div>' +
    '<div class="start-txt">' +
      '<h1>Historia sztuki<br>od <em>jaskini</em> do awangardy</h1>' +
      '<div class="stats">' +
        '<div><span class="lbl">' + ic('star') + 'Dzieła</span><b>' + WORKS.length + '</b></div>' +
        '<div><span class="lbl">' + ic('columns') + 'Epoki</span><b>' + ERAS.length + '</b></div>' +
        '<div><span class="lbl">' + ic('book') + 'Pojęcia</span><b>' + TERMS.length + '</b></div>' +
      '</div>' +
      '<a class="btn primary wide" href="#/epoki" onclick="S.seenStart=true;save()">' + (S.seenStart ? 'Wróć do nauki' : 'Zacznij zwiedzanie') + '</a>' +
      (S.seenStart ? '<p class="start-xp">' + ic('flame') + ' Dziś ' + xpToday() + '/' + GOAL + ' XP' + (s ? ' · seria ' + s + ' ' + plural(s, 'dzień', 'dni', 'dni') : '') + '</p>' : '<p class="start-xp">Na podstawie podręcznika „Ars longa” i notatek z wykładów</p>') +
    '</div></section>';
};

/* ---------- KATALOG EPOK ---------- */
V.epoki = function () {
  var q = norm(ui.q);
  var list = ERAS.filter(function (e) {
    if (!inGroup(e, ui.group)) return false;
    if (!q) return true;
    return norm(e.n + ' ' + e.y + ' ' + e.w.map(function (w) { return w.t + ' ' + (w.a || ''); }).join(' ') + ' ' + e.art.map(function (a) { return a[0]; }).join(' ')).indexOf(q) >= 0;
  });
  return header() +
    '<div class="searchrow"><label class="search">' + ic('search') + '<input id="q" type="search" placeholder="Szukaj epoki, dzieła, artysty" value="' + esc(ui.q) + '" oninput="ui.q=this.value;renderList()"></label>' +
    '<a class="sq brown" href="#/galeria" aria-label="Galeria i filtry">' + ic('filter') + '</a></div>' +
    tabs(GROUPS, ui.group, 'setGroup') +
    '<div id="list" class="cards">' + list.map(eraCard).join('') + (list.length ? '' : '<p class="empty">Nic nie znaleziono.</p>') + '</div>';
};
function eraCard(e) {
  var c = eraCover(e), p = eraProgress(e);
  var kinds = {}; e.w.forEach(function (w) { kinds[w.k] = 1; });
  return '<a class="card" href="#/epoka/' + e.id + '">' + imgTag(c) +
    '<div class="chips">' + Object.keys(kinds).slice(0, 3).map(function (k) { return chip(KINDS[k] || k, 'glass'); }).join('') + '</div>' +
    '<div class="glass panel"><h3>' + esc(e.n) + '</h3>' +
    '<p class="where">' + ic('clock') + esc(e.y) + '</p>' +
    '<div class="row"><span>' + e.w.length + ' ' + plural(e.w.length, 'dzieło', 'dzieła', 'dzieł') + ' · ' + e.terms.length + ' ' + plural(e.terms.length, 'pojęcie', 'pojęcia', 'pojęć') + '</span><b>' + p + '%</b></div>' +
    '<div class="bar"><i style="width:' + p + '%"></i></div></div></a>';
}
function setGroup(g) { ui.group = g; render(); }
function renderList() {
  var html = V.epoki(); var tmp = document.createElement('div'); tmp.innerHTML = html;
  $('#list').innerHTML = $('#list', tmp).innerHTML;
}

/* ---------- EPOKA ---------- */
var ERA_TABS = [{ id: 'czytaj', n: 'Czytaj' }, { id: 'dziela', n: 'Dzieła' }, { id: 'pojecia', n: 'Pojęcia' }, { id: 'artysci', n: 'Artyści' }, { id: 'cwicz', n: 'Ćwicz' }];
V.epoka = function (id, tab) {
  var e = ERA[id]; if (!e) return V.epoki();
  tab = tab || 'czytaj';
  var c = eraCover(e), prev = ERAS[e.i - 1], next = ERAS[e.i + 1];
  var h = '<div class="era-hero">' + imgTag(c, '', true) +
    '<div class="era-top"><button class="sq glass" onclick="goBack()" aria-label="Wstecz">' + ic('back') + '</button>' +
    '<a class="sq glass" href="#/dzielo/' + (c ? c.id : '') + '" aria-label="Tryb galerii">' + ic('eye') + '</a></div>' +
    '<div class="era-title"><span class="chip glass">' + esc(e.y) + '</span><h1>' + esc(e.n) + '</h1></div></div>' +
    '<div class="era-tabs">' + ERA_TABS.map(function (t) { return '<a class="' + (t.id === tab ? 'on' : '') + '" href="#/epoka/' + e.id + '/' + t.id + '">' + t.n + '</a>'; }).join('') + '</div>' +
    '<div class="era-body">';
  if (tab === 'czytaj') {
    h += '<p class="lead">' + esc(e.lead) + '</p>' +
      e.r.map(function (s, i) { return '<h2>' + esc(s[0]) + '</h2><p class="' + (i === 0 ? 'drop' : '') + '">' + esc(s[1]) + '</p>' + (i === 1 ? inlineWorks(e, 0) : i === 3 ? inlineWorks(e, 3) : ''); }).join('') +
      '<div class="box"><h3>' + ic('columns') + 'Cechy stylu</h3><ul>' + e.f.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></div>' +
      (e.q && e.q.length ? '<h2>Sprawdź się</h2>' + e.q.map(function (q) { return '<details class="qa"><summary>' + esc(q[0]) + '</summary><p>' + esc(q[1]) + '</p></details>'; }).join('') : '') +
      '<p class="src">Źródło: ' + esc(e.src) + '</p>' +
      '<button class="btn ' + (S.read[e.id] ? '' : 'primary') + ' wide" onclick="markRead(\'' + e.id + '\')">' + (S.read[e.id] ? ic('check') + ' Przeczytane' : 'Oznacz jako przeczytane') + '</button>';
  } else if (tab === 'dziela') {
    h += '<div class="masonry">' + e.w.map(workTile).join('') + '</div>';
  } else if (tab === 'pojecia') {
    h += '<div class="terms">' + e.terms.map(function (t) {
      var ok = S.ok['p|' + t[0]] > 0;
      return '<div class="term' + (ok ? ' ok' : '') + '"><b>' + esc(t[0]) + '</b><p>' + esc(t[1]) + '</p></div>';
    }).join('') + '</div><a class="btn primary wide" href="#/fiszki/pojecia/' + e.id + '">' + ic('cards') + ' Fiszki z pojęć tej epoki</a>';
  } else if (tab === 'artysci') {
    var arts = artistsOf(e);
    h += arts.length ? '<div class="artists">' + arts.map(function (a) {
      var ws = e.w.filter(function (w) { return w.a && w.a.indexOf(a.n.split(' ').slice(-1)[0]) >= 0 && w.img; });
      return '<div class="artist">' + (ws[0] ? '<a href="#/dzielo/' + ws[0].id + '">' + imgTag(ws[0], 'av') + '</a>' : '<div class="av noimg">' + ic('brush') + '</div>') +
        '<div><b>' + esc(a.n) + '</b><span class="muted">' + esc(a.y) + '</span><p>' + esc(a.d) + '</p></div></div>';
    }).join('') + '</div>' : '<p class="empty">W tej epoce twórcy są w większości anonimowi – dzieła przypisuje się warsztatom, kulturom i fundatorom.</p>';
  } else if (tab === 'cwicz') {
    h += '<p class="lead small">Ćwiczenia tylko z tej epoki. Każda poprawna odpowiedź to 1 XP.</p><div class="ex-grid">' +
      EX_TYPES.map(function (t) { return '<a class="ex" href="#/quiz/' + t.id + '/' + e.id + '">' + ic(t.ic) + '<b>' + t.n + '</b><span>' + t.d + '</span></a>'; }).join('') +
      '<a class="ex" href="#/fiszki/dziela/' + e.id + '">' + ic('cards') + '<b>Fiszki: dzieła</b><span>Obraz → tytuł, autor, data.</span></a></div>';
  }
  h += '<div class="era-nav">' + (prev ? '<a href="#/epoka/' + prev.id + '/' + tab + '">' + ic('back') + '<span>' + esc(prev.n) + '</span></a>' : '<span></span>') +
    (next ? '<a href="#/epoka/' + next.id + '/' + tab + '"><span>' + esc(next.n) + '</span>' + ic('next') + '</a>' : '<span></span>') + '</div></div>';
  return h;
};
function inlineWorks(e, from) {
  var ws = e.w.filter(function (w) { return w.img; }).slice(from, from + 3);
  if (!ws.length) return '';
  return '<div class="strip">' + ws.map(function (w) { return '<a href="#/dzielo/' + w.id + '">' + imgTag(w) + '<span>' + esc(w.t) + '</span></a>'; }).join('') + '</div>';
}
function artistsOf(e) {
  var list = e.art.map(function (a) { return { n: a[0], y: a[1], d: a[2] }; });
  return list;
}
function workTile(w) {
  return '<a class="tile' + (S.ok[w.key] > 0 ? ' ok' : '') + '" href="#/dzielo/' + w.id + '">' + imgTag(w) +
    '<div><b>' + esc(w.t) + '</b><span>' + esc(w.a ? w.a + ' · ' : '') + esc(w.y) + '</span></div></a>';
}
function markRead(id) { S.read[id] = !S.read[id]; save(); render(); if (S.read[id]) toast('Rozdział przeczytany ✓'); }

/* ---------- PRZEGLĄDARKA DZIEŁA (tryb galerii) ---------- */
V.dzielo = function (id) {
  var w = WORK_BY_ID[id]; if (!w) return V.epoki();
  var list = w.era.w, i = list.indexOf(w), next = list[i + 1] || ERAS[w.era.i + 1] && ERAS[w.era.i + 1].w[0], prev = list[i - 1];
  return '<section class="viewer" id="viewer">' +
    (w.img ? '<div class="v-bg" style="background-image:url(' + imgSrc(w) + ')"></div><img class="v-img" id="vimg" src="' + imgSrc(w) + '" alt="' + esc(w.t) + '">' : '<div class="v-img noimg">' + ic('image') + '</div>') +
    '<div class="v-top"><a class="sq glass" href="#/epoka/' + w.era.id + '/dziela" aria-label="Zamknij">' + ic('close') + '</a>' +
    '<span class="v-title">Tryb galerii</span><button class="sq glass" onclick="toggleInfo()" aria-label="Informacje">' + ic('dots') + '</button></div>' +
    '<button class="v-label" onclick="toggleInfo()">' + imgTag(w, 'th') + '<span><b>' + esc(w.t) + '</b><small>' + esc(w.a || w.era.n) + '</small></span></button>' +
    '<i class="v-dot"></i><i class="v-line"></i>' +
    (next ? '<a class="v-walk" href="#/dzielo/' + next.id + '" aria-label="Następne dzieło">' + ic('up') + ic('up') + ic('up') + '</a>' : '') +
    '<div class="v-bottom"><a class="sq glass" href="#/epoka/' + w.era.id + '/dziela" aria-label="Wszystkie dzieła epoki">' + ic('grid') + '</a>' +
    '<button class="v-frame" onclick="toggleZoom()" aria-label="Powiększenie"><i></i><i></i><i></i><i></i>' + ic('zoom') + '</button>' +
    '<button class="sq glass' + (isFav(w.id) ? ' fav' : '') + '" id="favbtn" onclick="favWork(\'' + w.id + '\')" aria-label="Ulubione">' + ic('heart') + '</button></div>' +
    '<div class="v-info" id="vinfo"><div class="grip" onclick="toggleInfo()"></div>' +
      '<span class="chip">' + esc(KINDS[w.k] || w.k) + '</span> <a class="chip" href="#/epoka/' + w.era.id + '">' + esc(w.era.n) + '</a>' +
      '<h2>' + esc(w.t) + '</h2>' +
      '<p class="meta">' + (w.a ? ic('brush') + esc(w.a) + '<br>' : '') + ic('clock') + esc(w.y) + '<br>' + ic('pin') + esc(w.p) + '</p>' +
      '<p>' + esc(w.d) + '</p>' +
      '<div class="v-nav">' + (prev ? '<a class="btn" href="#/dzielo/' + prev.id + '">' + ic('back') + ' Poprzednie</a>' : '<span></span>') + (next ? '<a class="btn primary" href="#/dzielo/' + next.id + '">Następne ' + ic('next') + '</a>' : '') + '</div>' +
      '<p class="credit">' + credit(w) + '</p></div>' +
    '</section>';
};
V.dzielo.after = function () {
  var v = $('#viewer'), startY = null;
  v.addEventListener('touchstart', function (e) { startY = e.touches[0].clientY; }, { passive: true });
  v.addEventListener('touchend', function (e) {
    if (startY == null || v.classList.contains('zoom') || v.classList.contains('info')) return;
    var dy = e.changedTouches[0].clientY - startY;
    var walk = $('.v-walk'); if (dy < -70 && walk) location.hash = walk.getAttribute('href');
    startY = null;
  });
  var img = $('#vimg');
  if (img) img.addEventListener('click', function (ev) {
    if (!v.classList.contains('zoom')) return;
    var r = img.getBoundingClientRect();
    img.style.transformOrigin = ((ev.clientX - r.left) / r.width * 100) + '% ' + ((ev.clientY - r.top) / r.height * 100) + '%';
  });
};
function toggleInfo() { $('#viewer').classList.toggle('info'); }
function toggleZoom() { var v = $('#viewer'); v.classList.toggle('zoom'); v.classList.remove('info'); if (v.classList.contains('zoom')) toast('Dotknij obrazu, by przybliżyć fragment'); }
function favWork(id) { toggleFav(id); $('#favbtn').classList.toggle('fav', isFav(id)); toast(isFav(id) ? 'Dodano do ulubionych' : 'Usunięto z ulubionych'); }

/* ---------- ĆWICZENIA ---------- */
V.cwicz = function () {
  return header({ title: 'Ćwiczenia' }) +
    '<div class="goal">' + goalRing() + '<div><b>Cel dnia: ' + GOAL + ' XP</b><span class="muted">1 poprawna odpowiedź = 1 XP' + (streak() ? ' · seria ' + streak() + ' ' + plural(streak(), 'dzień', 'dni', 'dni') : '') + '</span></div></div>' +
    '<h2 class="sec">Zakres</h2><div class="scope">' + GROUPS.map(function (g) { return '<button class="' + (ui.scope === g.id || (!ui.scope && g.id === 'all') ? 'on' : '') + '" onclick="ui.scope=\'' + g.id + '\';render()">' + g.n + '</button>'; }).join('') + '</div>' +
    '<h2 class="sec">Rodzaj zadań</h2><div class="ex-grid">' +
    EX_TYPES.map(function (t) { return '<a class="ex" href="#/quiz/' + t.id + '/' + (ui.scope || 'all') + '">' + ic(t.ic) + '<b>' + t.n + '</b><span>' + t.d + '</span></a>'; }).join('') + '</div>';
};
function goalRing() {
  var p = Math.min(1, xpToday() / GOAL), r = 26, c = 2 * Math.PI * r;
  return '<svg class="ring" viewBox="0 0 64 64"><circle cx="32" cy="32" r="' + r + '"/><circle class="v" cx="32" cy="32" r="' + r + '" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - p)) + '"/><text x="32" y="37">' + xpToday() + '</text></svg>';
}
function scopeEras(s) {
  if (!s || s === 'all') return ERAS.slice();
  if (ERA[s]) return [ERA[s]];
  return ERAS.filter(function (e) { return inGroup(e, s); });
}

var QZ = null;
V.quiz = function (type, scope) {
  QZ = { type: type, scope: scopeEras(scope), scopeId: scope, n: 0, good: 0, total: 10, q: null };
  return '<section class="quiz" id="quiz"></section>';
};
V.quiz.after = function () { nextQ(); };
function nextQ() {
  if (QZ.n >= QZ.total) return quizEnd();
  QZ.q = makeQuestion(QZ.type, QZ.scope); QZ.n++; QZ.done = false;
  if (!QZ.q) { $('#quiz').innerHTML = '<p class="empty">Za mało materiału w tym zakresie. Wybierz szerszy zakres.</p><a class="btn wide" href="#/cwicz">Wróć</a>'; return; }
  var q = QZ.q;
  var h = '<div class="qz-top"><button class="sq" onclick="goBack()" aria-label="Zamknij">' + ic('close') + '</button>' +
    '<div class="qz-bar"><i style="width:' + ((QZ.n - 1) / QZ.total * 100) + '%"></i></div><span class="qz-xp">' + ic('flame') + xpToday() + '</span></div>' +
    '<p class="qz-kind">' + esc(q.title) + '</p>';
  if (q.img) {
    var st = q.crop ? ' style="transform:scale(' + q.crop.z + ');transform-origin:' + q.crop.x + '% ' + q.crop.y + '%"' : '';
    h += '<div class="qz-img' + (q.crop ? ' crop' : '') + '"><img src="' + imgSrc(q.img) + '" alt=""' + st + '></div>';
  }
  h += '<h2 class="qz-q">' + q.prompt + '</h2>';
  if (q.kind === 'choice') h += '<div class="opts' + (q.small ? ' small' : '') + '">' + q.opts.map(function (o, i) { return '<button onclick="answer(' + i + ')">' + esc(o.l) + '</button>'; }).join('') + '</div>';
  else if (q.kind === 'tf') h += '<div class="opts tf"><button onclick="answerTF(true)">' + ic('check') + 'Prawda</button><button onclick="answerTF(false)">' + ic('x') + 'Fałsz</button></div>';
  else if (q.kind === 'order') { q.picked = []; h += '<div class="order">' + q.items.map(function (w, i) { return '<button onclick="pickOrder(' + i + ',this)">' + imgTag(w) + '<span>' + esc(w.t) + '</span><em></em></button>'; }).join('') + '</div>'; }
  else if (q.kind === 'pairs') {
    q.left = shuffle(q.items); q.right = shuffle(q.items); q.sel = null; q.matched = 0; q.err = 0;
    h += '<div class="pairs"><div>' + q.left.map(function (w, i) { return '<button data-l="' + i + '" onclick="pairL(' + i + ',this)">' + esc(w.a) + '</button>'; }).join('') + '</div><div>' +
      q.right.map(function (w, i) { return '<button data-r="' + i + '" onclick="pairR(' + i + ',this)">' + (w.img ? imgTag(w) : '') + '<span>' + esc(w.t) + '</span></button>'; }).join('') + '</div></div>';
  } else if (q.kind === 'open') h += '<div class="open"><button class="btn wide" onclick="this.parentNode.classList.add(\'on\')">Pokaż odpowiedź</button><div class="ans"><p>' + q.answer + '</p><p class="muted">Czy Twoja odpowiedź zawierała te elementy?</p><div class="opts tf"><button onclick="openGrade(true)">' + ic('check') + 'Tak</button><button onclick="openGrade(false)">' + ic('x') + 'Nie całkiem</button></div></div></div>';
  h += '<div class="feedback" id="fb"></div>';
  $('#quiz').innerHTML = h; window.scrollTo(0, 0);
}
function feedback(ok, html) {
  QZ.done = true;
  if (ok) { QZ.good++; addXP(1); }
  if (QZ.q.key) mark(QZ.q.key, ok);
  var fb = $('#fb'); fb.className = 'feedback on ' + (ok ? 'good' : 'bad');
  fb.innerHTML = '<b>' + (ok ? ic('check') + ' Dobrze!' : ic('x') + ' Nie tym razem') + '</b>' + (html ? '<p>' + html + '</p>' : '') +
    (QZ.q.img && QZ.q.img.id ? '<a class="more" href="#/dzielo/' + QZ.q.img.id + '">Zobacz dzieło</a>' : '') +
    '<button class="btn primary wide" onclick="nextQ()">' + (QZ.n >= QZ.total ? 'Podsumowanie' : 'Dalej') + '</button>';
  var im = $('.qz-img img'); if (im) im.style.transform = 'none';
}
function answer(i) {
  if (QZ.done) return;
  var q = QZ.q, ok = q.opts[i].ok;
  $$('.opts button').forEach(function (b, j) { b.disabled = true; if (q.opts[j].ok) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
  feedback(ok, q.explain);
}
function answerTF(v) {
  if (QZ.done) return;
  var ok = v === QZ.q.truth;
  $$('.opts button').forEach(function (b, j) { b.disabled = true; if ((j === 0) === QZ.q.truth) b.classList.add('right'); else if ((j === 0) === v) b.classList.add('wrong'); });
  feedback(ok, (QZ.q.truth ? 'To prawda. ' : 'To fałsz. ') + QZ.q.explain);
}
function pickOrder(i, el) {
  var q = QZ.q; if (QZ.done || q.picked.indexOf(i) >= 0) return;
  q.picked.push(i); el.classList.add('picked'); $('em', el).textContent = q.picked.length;
  if (q.picked.length === q.items.length) {
    var ok = q.picked.every(function (p, k) { return q.items[p] === q.answer[k]; });
    feedback(ok, 'Kolejność: ' + q.answer.map(function (w) { return '<b>' + esc(w.t) + '</b> (' + esc(w.y) + ')'; }).join(' → '));
    q.answer.forEach(function (w) { if (ok) mark(w.key, true); });
  }
}
function pairL(i, el) { if (QZ.done || el.classList.contains('right')) return; $$('.pairs [data-l]').forEach(function (b) { b.classList.remove('sel'); }); el.classList.add('sel'); QZ.q.sel = i; }
function pairR(i, el) {
  var q = QZ.q; if (QZ.done || q.sel == null || el.classList.contains('right')) return;
  var l = $('.pairs [data-l="' + q.sel + '"]');
  if (q.left[q.sel] === q.right[i]) {
    l.classList.remove('sel'); l.classList.add('right'); el.classList.add('right'); q.matched++; mark(q.right[i].key, true);
    if (q.matched === q.items.length) feedback(q.err === 0, q.err ? 'Pomyłek: ' + q.err + '. ' + q.items.map(function (w) { return esc(w.a) + ' – <b>' + esc(w.t) + '</b>'; }).join('; ') : q.items.map(function (w) { return esc(w.a) + ' – <b>' + esc(w.t) + '</b>'; }).join('; '));
  } else { q.err++; el.classList.add('shake'); setTimeout(function () { el.classList.remove('shake'); }, 400); }
  q.sel = null;
}
function openGrade(ok) { $$('.open .opts button').forEach(function (b) { b.disabled = true; }); feedback(ok, ''); }
function quizEnd() {
  var p = Math.round(QZ.good / QZ.total * 100);
  $('#quiz').innerHTML = '<div class="end">' + goalRing() + '<h2>' + QZ.good + ' / ' + QZ.total + '</h2><p>' +
    (p >= 90 ? 'Znakomicie – mistrzowska znajomość!' : p >= 60 ? 'Dobra robota. Jeszcze trochę i będzie perfekcyjnie.' : 'Warto wrócić do lektury i fiszek tej epoki.') + '</p>' +
    '<p class="muted">Dziś: ' + xpToday() + ' / ' + GOAL + ' XP</p>' +
    '<button class="btn primary wide" onclick="render()">Jeszcze raz</button><a class="btn wide" href="#/cwicz">Inne ćwiczenia</a></div>';
}

/* ---------- FISZKI (system Leitnera, 5 pudełek) ---------- */
V.fiszki = function () {
  var decks = [
    { id: 'pojecia', n: 'Pojęcia', d: TERMS.length + ' terminów z definicjami', ic: 'book' },
    { id: 'dziela', n: 'Dzieła', d: IMG_WORKS.length + ' ilustracji: tytuł, autor, data', ic: 'image' },
    { id: 'artysci', n: 'Artyści', d: ARTISTS.length + ' sylwetek twórców', ic: 'brush' },
    { id: 'cechy', n: 'Cechy stylów', d: ERAS.length + ' epok – rozpoznaj po cechach', ic: 'columns' }
  ];
  return header({ title: 'Fiszki' }) + '<p class="lead small pad">Odwróć kartę, oceń się uczciwie. Karty, których nie znasz, wracają częściej (system Leitnera).</p>' +
    '<div class="decks">' + decks.map(function (d) {
      var cards = deckCards(d.id), known = cards.filter(function (c) { return (S.box[c.key] || 0) >= 3; }).length;
      return '<a class="deck" href="#/fiszki/' + d.id + '/all">' + ic(d.ic) + '<div><b>' + d.n + '</b><span>' + d.d + '</span><div class="bar"><i style="width:' + Math.round(known / cards.length * 100) + '%"></i></div></div><em>' + known + '/' + cards.length + '</em></a>';
    }).join('') + '</div>' +
    '<h2 class="sec">Fiszki z wybranej epoki</h2><div class="era-pills">' + ERAS.map(function (e) { return '<a href="#/fiszki/pojecia/' + e.id + '">' + esc(e.n) + '</a>'; }).join('') + '</div>';
};
function deckCards(deck, scope) {
  var eras = scopeEras(scope);
  var inS = function (x) { return eras.indexOf(x.era) >= 0; };
  if (deck === 'pojecia') return TERMS.filter(inS).map(function (t) { return { key: 'f|' + t.key, front: '<h2>' + esc(t.t) + '</h2><span class="muted">' + esc(t.era.n) + '</span>', back: '<p>' + esc(t.d) + '</p>', mk: t.key }; });
  if (deck === 'dziela') return IMG_WORKS.filter(inS).map(function (w) { return { key: 'f|' + w.key, front: imgTag(w, 'fimg'), back: '<h2>' + esc(w.t) + '</h2><p>' + (w.a ? esc(w.a) + '<br>' : '') + esc(w.y) + ' · ' + esc(w.era.n) + '</p><p class="muted">' + esc(w.d) + '</p>', mk: w.key }; });
  if (deck === 'artysci') return ARTISTS.filter(inS).map(function (a) { return { key: 'f|a|' + a.n, front: '<h2>' + esc(a.n) + '</h2><span class="muted">' + esc(a.y) + '</span><p class="muted">Epoka? Najważniejsze dzieła?</p>', back: '<p><b>' + esc(a.era.n) + '</b></p><p>' + esc(a.d) + '</p>' }; });
  return eras.map(function (e) { return { key: 'f|c|' + e.id, front: '<ul class="flist">' + shuffle(e.f).slice(0, 4).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul><p class="muted">Jaka to epoka?</p>', back: '<h2>' + esc(e.n) + '</h2><p>' + esc(e.y) + '</p>' }; });
}
var FC = null;
V.fiszkiRun = function (deck, scope) {
  var cards = deckCards(deck, scope);
  // najpierw najniższe pudełka, losowo w obrębie pudełka
  cards = shuffle(cards).sort(function (a, b) { return (S.box[a.key] || 0) - (S.box[b.key] || 0); }).slice(0, 20);
  FC = { cards: cards, i: 0, known: 0 };
  return '<section class="flash" id="flash"></section>';
};
V.fiszkiRun.after = function () { showCard(); };
function showCard() {
  if (!$('#flash')) return;
  if (FC.i >= FC.cards.length) {
    $('#flash').innerHTML = '<div class="end"><h2>Koniec talii</h2><p>Znane: ' + FC.known + ' / ' + FC.cards.length + '</p><button class="btn primary wide" onclick="render()">Kolejne 20 kart</button><a class="btn wide" href="#/fiszki">Inne talie</a></div>';
    return;
  }
  var c = FC.cards[FC.i], box = S.box[c.key] || 0;
  $('#flash').innerHTML = '<div class="qz-top"><button class="sq" onclick="goBack()" aria-label="Zamknij">' + ic('close') + '</button><div class="qz-bar"><i style="width:' + (FC.i / FC.cards.length * 100) + '%"></i></div><span class="qz-xp">' + (FC.i + 1) + '/' + FC.cards.length + '</span></div>' +
    '<div class="fcard" id="fcard" onclick="this.classList.toggle(\'flip\')"><div class="face front">' + c.front + '<span class="hint">dotknij, by odwrócić</span></div><div class="face back">' + c.back + '</div></div>' +
    '<p class="boxes">' + [0, 1, 2, 3, 4].map(function (b) { return '<i class="' + (b <= box ? 'on' : '') + '"></i>'; }).join('') + '</p>' +
    '<div class="opts tf"><button onclick="rate(false)">' + ic('x') + 'Jeszcze nie</button><button onclick="rate(true)">' + ic('check') + 'Wiem</button></div>';
}
function rate(ok) {
  var c = FC.cards[FC.i];
  if (!$('#fcard').classList.contains('flip') && ok) { $('#fcard').classList.add('flip'); }
  S.box[c.key] = ok ? Math.min(4, (S.box[c.key] || 0) + 1) : 0;
  if (ok) { FC.known++; addXP(1); }
  if (c.mk) mark(c.mk, ok);
  save(); FC.i++; setTimeout(showCard, ok ? 250 : 0);
}

/* ---------- GALERIA ---------- */
V.galeria = function () {
  return header({ title: 'Galeria' }) +
    '<div class="searchrow"><label class="search">' + ic('search') + '<input type="search" placeholder="Tytuł, artysta, miejsce" value="' + esc(ui.galQ) + '" oninput="ui.galQ=this.value;renderGal()"></label></div>' +
    '<nav class="tabs">' + [['', 'Wszystko']].concat(Object.keys(KINDS).map(function (k) { return [k, KINDS[k]]; })).concat([['fav', '♥ Ulubione']]).map(function (k) { return '<button class="' + (ui.galKind === k[0] ? 'on' : '') + '" onclick="ui.galKind=\'' + k[0] + '\';render()">' + k[1] + '</button>'; }).join('') + '</nav>' +
    '<div class="selrow"><select onchange="ui.galEra=this.value;renderGal()"><option value="">Wszystkie epoki</option>' + ERAS.map(function (e) { return '<option value="' + e.id + '"' + (ui.galEra === e.id ? ' selected' : '') + '>' + esc(e.n) + '</option>'; }).join('') + '</select></div>' +
    '<div id="gal" class="masonry">' + galItems() + '</div>';
};
function galItems() {
  var q = norm(ui.galQ);
  var ws = WORKS.filter(function (w) {
    if (ui.galKind === 'fav') { if (!isFav(w.id)) return false; } else if (ui.galKind && w.k !== ui.galKind) return false;
    if (ui.galEra && w.era.id !== ui.galEra) return false;
    return !q || norm(w.t + ' ' + (w.a || '') + ' ' + w.p + ' ' + w.era.n).indexOf(q) >= 0;
  });
  return ws.length ? ws.map(workTile).join('') : '<p class="empty">' + (ui.galKind === 'fav' ? 'Dodawaj dzieła do ulubionych sercem w trybie galerii.' : 'Brak wyników.') + '</p>';
}
function renderGal() { $('#gal').innerHTML = galItems(); }

/* ---------- SŁOWNIK i ARTYŚCI ---------- */
V.slownik = function () {
  var q = norm(ui.dictQ || '');
  var list = TERMS.slice().sort(function (a, b) { return a.t.localeCompare(b.t, 'pl'); }).filter(function (t) { return !q || norm(t.t + ' ' + t.d).indexOf(q) >= 0; });
  return header({ title: 'Słownik' }) + '<div class="searchrow"><label class="search">' + ic('search') + '<input type="search" placeholder="Szukaj pojęcia" value="' + esc(ui.dictQ || '') + '" oninput="ui.dictQ=this.value;render();this.focus()"></label></div>' +
    '<div class="terms pad">' + list.map(function (t) { return '<div class="term' + (S.ok[t.key] > 0 ? ' ok' : '') + '"><b>' + esc(t.t) + '</b><p>' + esc(t.d) + '</p><a class="muted" href="#/epoka/' + t.era.id + '/pojecia">' + esc(t.era.n) + '</a></div>'; }).join('') + '</div>';
};
V.artysci = function () {
  return header({ title: 'Artyści' }) + '<div class="artists pad">' + ARTISTS.map(function (a) {
    var surname = a.n.split(/[ ,]/).filter(Boolean).slice(-1)[0];
    var w = WORKS.filter(function (x) { return x.img && x.a && x.a.indexOf(surname) >= 0; })[0];
    return '<div class="artist">' + (w ? '<a href="#/dzielo/' + w.id + '">' + imgTag(w, 'av') + '</a>' : '<div class="av noimg">' + ic('brush') + '</div>') +
      '<div><b>' + esc(a.n) + '</b><span class="muted">' + esc(a.y) + ' · <a href="#/epoka/' + a.era.id + '/artysci">' + esc(a.era.n) + '</a></span><p>' + esc(a.d) + '</p></div></div>';
  }).join('') + '</div>';
};

/* ---------- OŚ CZASU ---------- */
V.os = function () {
  return header({ title: 'Oś czasu' }) + '<div class="timeline pad">' + ERAS.map(function (e) {
    var c = eraCover(e);
    return '<a class="tl" href="#/epoka/' + e.id + '"><span class="tl-y">' + esc(e.y) + '</span><i></i>' + imgTag(c) + '<b>' + esc(e.n) + '</b></a>';
  }).join('') + '</div>';
};

/* ---------- POSTĘPY ---------- */
V.postepy = function () {
  var days = [], d = new Date();
  for (var i = 13; i >= 0; i--) { var x = new Date(d); x.setDate(d.getDate() - i); var k = x.getFullYear() + '-' + (x.getMonth() + 1) + '-' + x.getDate(); days.push({ n: S.xp[k] || 0, l: x.getDate() }); }
  var max = Math.max(GOAL, Math.max.apply(null, days.map(function (x) { return x.n; })));
  var okW = WORKS.filter(function (w) { return S.ok[w.key] > 0; }).length, okT = TERMS.filter(function (t) { return S.ok[t.key] > 0; }).length;
  return header({ title: 'Postępy' }) + '<div class="pad">' +
    '<div class="goal">' + goalRing() + '<div><b>Dziś ' + xpToday() + ' / ' + GOAL + ' XP</b><span class="muted">Razem ' + xpTotal() + ' XP · seria ' + streak() + ' ' + plural(streak(), 'dzień', 'dni', 'dni') + '</span></div></div>' +
    '<div class="days">' + days.map(function (x) { return '<div><i style="height:' + Math.round(x.n / max * 100) + '%" class="' + (x.n >= GOAL ? 'full' : '') + '"></i><span>' + x.l + '</span></div>'; }).join('') + '</div>' +
    '<div class="kpis"><div><b>' + okW + '</b><span>dzieł rozpoznanych<br>z ' + WORKS.length + '</span></div><div><b>' + okT + '</b><span>pojęć opanowanych<br>z ' + TERMS.length + '</span></div><div><b>' + Object.keys(S.read).filter(function (k) { return S.read[k]; }).length + '</b><span>rozdziałów<br>przeczytanych</span></div></div>' +
    '<h2 class="sec">Epoki</h2>' + ERAS.map(function (e) { var p = eraProgress(e); return '<a class="prog" href="#/epoka/' + e.id + '"><span>' + esc(e.n) + '</span><div class="bar"><i style="width:' + p + '%"></i></div><b>' + p + '%</b></a>'; }).join('') +
    '<h2 class="sec">Ustawienia</h2><div class="settings"><button class="btn" onclick="toggleTheme()">' + ic(S.theme === 'dark' ? 'sun' : 'moon') + (S.theme === 'dark' ? ' Jasny motyw' : ' Ciemny motyw') + '</button>' +
    '<button class="btn" onclick="exportData()">Kopia postępów</button><label class="btn">Wczytaj kopię<input type="file" accept=".json" hidden onchange="importData(this)"></label>' +
    '<button class="btn danger" onclick="resetAll()">Wyzeruj postępy</button></div>' +
    '<p class="src">Treści opracowane na podstawie: B. Lewińska, W.J. Kieler, „Ars longa” t. I–III oraz notatek „Dzieje sztuki europejskiej od XIV do XX w.”. Ilustracje: Wikimedia Commons (licencje przy każdym dziele) i podręcznik „Ars longa”.</p></div>';
};
function exportData() {
  var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' }));
  a.download = 'ars-postepy-' + today() + '.json'; a.click();
}
function importData(inp) {
  var f = inp.files[0]; if (!f) return; var r = new FileReader();
  r.onload = function () { try { var d = JSON.parse(r.result); for (var k in d) S[k] = d[k]; save(); render(); toast('Wczytano kopię'); } catch (e) { toast('Nieprawidłowy plik'); } };
  r.readAsText(f);
}
function resetAll() { if (confirm('Na pewno wyzerować XP, fiszki i postępy?')) { S.xp = {}; S.ok = {}; S.box = {}; S.read = {}; save(); render(); } }
function toggleTheme() { S.theme = S.theme === 'dark' ? 'light' : 'dark'; save(); applyTheme(); render(); }
function applyTheme() { document.documentElement.setAttribute('data-theme', S.theme); var m = $('meta[name=theme-color]'); if (m) m.content = S.theme === 'dark' ? '#16130f' : '#f3f1ee'; }

/* ---------- MENU BOCZNE ---------- */
function openMenu() {
  var m = document.createElement('div'); m.className = 'drawer'; m.onclick = function (e) { if (e.target === m) m.remove(); };
  m.innerHTML = '<nav><span class="brand big">Ars</span>' +
    [['#/', 'sun', 'Ekran startowy'], ['#/epoki', 'columns', 'Epoki'], ['#/os', 'clock', 'Oś czasu'], ['#/galeria', 'image', 'Galeria'], ['#/artysci', 'brush', 'Artyści'], ['#/slownik', 'book', 'Słownik pojęć'], ['#/cwicz', 'puzzle', 'Ćwiczenia'], ['#/fiszki', 'cards', 'Fiszki'], ['#/postepy', 'chart', 'Postępy']]
      .map(function (x) { return '<a href="' + x[0] + '" onclick="this.closest(\'.drawer\').remove()">' + ic(x[1]) + x[2] + '</a>'; }).join('') + '</nav>';
  document.body.appendChild(m); setTimeout(function () { m.classList.add('on'); }, 10);
}
