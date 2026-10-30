// Ikony liniowe (SVG, 24×24, stroke = currentColor).
var ICONS = {
  menu: '<path d="M5 7h10M5 12h14M5 17h7"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  filter: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  dots: '<circle cx="12" cy="5.5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="18.5" r="1.2"/>',
  grid: '<rect x="4.5" y="4.5" width="6" height="6" rx="1.5"/><rect x="13.5" y="4.5" width="6" height="6" rx="1.5"/><rect x="4.5" y="13.5" width="6" height="6" rx="1.5"/><rect x="13.5" y="13.5" width="6" height="6" rx="1.5"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  globe: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 2.7 2.5 13.3 0 16M12 4c-2.5 2.7-2.5 13.3 0 16"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  book: '<path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H19v14H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19"/>',
  columns: '<path d="M4 20h16M5 9h14M12 4 4 8h16zM7 9v11M12 9v11M17 9v11"/>',
  cards: '<rect x="7" y="4" width="12" height="15" rx="2"/><path d="M5 7v12a2 2 0 0 0 2 2h9"/>',
  puzzle: '<path d="M9 4h4v2a1.5 1.5 0 0 0 3 0V4h3v5h-2a1.5 1.5 0 0 0 0 3h2v7h-5v-2a1.5 1.5 0 0 0-3 0v2H5v-5h2a1.5 1.5 0 0 0 0-3H5V4z"/>',
  image: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m5 18 5-5 3 3 2-2 4 4"/>',
  chart: '<path d="M5 19V9M10 19V5M15 19v-7M20 19v-4"/>',
  user: '<circle cx="12" cy="9" r="3.5"/><path d="M5 20c1.2-3.6 4-5 7-5s5.8 1.4 7 5"/>',
  eye: '<path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.5"/>',
  zoom: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4M11 8.5v5M8.5 11h5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M7 7l10 10M17 7 7 17"/>',
  flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.6-5.3 3.5-8.3 1.6 1.4 2.3 3 2.4 4.4 1-.7 1.7-2 1.8-3.4 2.6 2 5.3 4.4 5.3 7.6C18.5 18.4 15.9 21 12 21z"/>',
  star: '<path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z"/>',
  pin: '<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',
  brush: '<path d="M14 4l6 6-8.5 8.5a3 3 0 0 1-4.2 0l-1.8-1.8a3 3 0 0 1 0-4.2z"/><path d="M4 20c1-3 2.5-3.5 4-3"/>',
  quote: '<path d="M6 17c-1-1.5-1.5-3-1.5-4.5C4.5 9 7 7 9.5 6.5M14 17c-1-1.5-1.5-3-1.5-4.5C12.5 9 15 7 17.5 6.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  moon: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>',
  shuffle: '<path d="M4 7h3c4 0 6 10 10 10h3M4 17h3c1.5 0 2.7-1.4 3.7-3M14 9.5C15 8 16 7 17 7h3M18 4l3 3-3 3M18 14l3 3-3 3"/>'
};
function ic(name, cls) {
  return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>';
}
