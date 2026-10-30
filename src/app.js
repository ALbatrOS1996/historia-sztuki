// Router (hash) i dolna nawigacja.
var NAV = [['#/epoki', 'columns', 'Epoki'], ['#/galeria', 'image', 'Galeria'], ['#/cwicz', 'puzzle', 'Ćwicz'], ['#/fiszki', 'cards', 'Fiszki'], ['#/postepy', 'chart', 'Postępy']];
var HIST = [];

function route() {
  var p = location.hash.replace(/^#\/?/, '').split('/');
  switch (p[0]) {
    case '': return S.seenStart ? ['epoki'] : ['start'];
    default: return p;
  }
}
function render() {
  var r = route(), name = r[0], view;
  if (name === 'start') view = V.start;
  else if (name === 'epoka') view = V.epoka;
  else if (name === 'dzielo') view = V.dzielo;
  else if (name === 'quiz') view = V.quiz;
  else if (name === 'fiszki' && r[1]) view = V.fiszkiRun;
  else view = V[name] || V.epoki;
  if (location.hash === '#/' || location.hash === '#') view = V.start;
  var app = $('#app');
  app.className = 'v-' + (view === V.start ? 'start' : name);
  app.innerHTML = view.apply(null, r.slice(1));
  var full = view === V.start || view === V.dzielo || view === V.quiz || view === V.fiszkiRun;
  $('#nav').style.display = full ? 'none' : '';
  $('#nav').innerHTML = NAV.map(function (n) { return '<a href="' + n[0] + '" class="' + (('#/' + name) === n[0] || (name === 'epoka' && n[0] === '#/epoki') ? 'on' : '') + '">' + ic(n[1]) + '<span>' + n[2] + '</span></a>'; }).join('');
  if (view.after) view.after.apply(null, r.slice(1));
}
function goBack() { if (HIST.length > 1) { HIST.pop(); history.back(); } else location.hash = '#/epoki'; }

window.addEventListener('hashchange', function () {
  HIST.push(location.hash);
  var keepScroll = /^#\/epoka\/[^/]+\/(dziela|pojecia|artysci|cwicz|czytaj)$/.test(location.hash) && HIST.length > 1 && HIST[HIST.length - 2].split('/')[2] === location.hash.split('/')[2];
  var y = window.scrollY;
  render();
  window.scrollTo(0, keepScroll ? Math.min(y, $('.era-tabs') ? $('.era-tabs').offsetTop : 0) : 0);
});
document.addEventListener('keydown', function (e) {
  if (!QZ || !$('#quiz')) return;
  if (QZ.done && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); nextQ(); }
  else if (!QZ.done && /^[1-4]$/.test(e.key) && QZ.q && QZ.q.kind === 'choice') answer(+e.key - 1);
});
applyTheme();
HIST.push(location.hash);
render();
