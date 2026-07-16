/* ANCF Games — hub: search, category filters, "played" tracking, random pick.
   Data is embedded in the page (#gx-data) so the hub works offline and from file://.
   Each game is a self-contained page; the hub only records which ones you have
   opened from here. Device-only; nothing is uploaded. */
(function () {
  var KEY = 'ancf-games-played';
  var GAMES = JSON.parse(document.getElementById('gx-data').textContent);
  var TOTAL = GAMES.length;

  var grid = document.getElementById('gx-grid');
  var empty = document.getElementById('gx-empty');
  var search = document.getElementById('gx-search');
  var filters = document.getElementById('gx-filters');
  var count = document.getElementById('gx-count');
  var pcount = document.getElementById('pcount');
  var pfill = document.getElementById('pfill');

  var state = { q: '', cat: 'all' };

  function allPlayed() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function markPlayed(slug) {
    try {
      var o = allPlayed();
      o[slug] = 1;
      localStorage.setItem(KEY, JSON.stringify(o));
    } catch (e) {}
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  var pad = function (n) { return ('00' + n).slice(-3); };

  var CATS = [];
  GAMES.forEach(function (g) { if (CATS.indexOf(g.cat) === -1) CATS.push(g.cat); });
  CATS.sort();

  GAMES.forEach(function (g, i) {
    g.n = i + 1;
    g.search = (g.title + ' ' + g.desc + ' ' + g.cat + ' ' + g.tags.join(' ')).toLowerCase();
  });

  function cardHTML(g) {
    var played = allPlayed()[g.slug];
    return '<a class="gx-card' + (played ? ' played' : '') + '" href="' + esc(g.slug) + '/index.html" data-slug="' + esc(g.slug) + '">' +
      '<span class="top"><span class="icon" aria-hidden="true">' + esc(g.icon) + '</span>' +
      '<span class="num">GAME ' + pad(g.n) + '</span>' +
      '<span class="catchip">' + esc(g.cat) + '</span></span>' +
      '<h3>' + esc(g.title) + '</h3>' +
      '<p class="hook">' + esc(g.desc) + '</p>' +
      '<span class="tags">' + g.tags.slice(0, 4).map(function (t) {
        return '<span class="tag">' + esc(t) + '</span>';
      }).join('') + '</span>' +
      '<span class="foot"><span class="done-dot" aria-hidden="true"></span>' +
      (played ? 'Played' : 'Not played yet') + '</span></a>';
  }

  function matches(g) {
    if (state.cat !== 'all' && g.cat !== state.cat) return false;
    if (!state.q) return true;
    return g.search.indexOf(state.q) !== -1;
  }

  function render() {
    var list = GAMES.filter(matches);
    grid.innerHTML = list.map(cardHTML).join('');
    empty.style.display = list.length ? 'none' : '';
    count.textContent = list.length === TOTAL
      ? TOTAL + ' games' : (list.length + ' of ' + TOTAL + ' games');
  }

  function renderProgress() {
    var o = allPlayed(), played = 0;
    GAMES.forEach(function (g) { if (o[g.slug]) played++; });
    pcount.textContent = played + ' / ' + TOTAL + ' played';
    pfill.style.width = Math.round(played / TOTAL * 100) + '%';
  }

  /* ---- filters ---- */
  filters.innerHTML = '<button class="chip" type="button" data-cat="all" aria-pressed="true">All ' + TOTAL + '</button>' +
    CATS.map(function (c) {
      var n = GAMES.filter(function (g) { return g.cat === c; }).length;
      return '<button class="chip" type="button" data-cat="' + esc(c) + '" aria-pressed="false">' +
        esc(c) + ' · ' + n + '</button>';
    }).join('');

  filters.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    state.cat = b.dataset.cat;
    [].forEach.call(filters.querySelectorAll('.chip'), function (c) {
      c.setAttribute('aria-pressed', String(c === b));
    });
    render();
  });

  var t;
  search.addEventListener('input', function () {
    clearTimeout(t);
    t = setTimeout(function () { state.q = search.value.trim().toLowerCase(); render(); }, 120);
  });

  grid.addEventListener('click', function (e) {
    var card = e.target.closest('.gx-card');
    if (card) markPlayed(card.dataset.slug);
  });

  document.getElementById('gx-random').addEventListener('click', function () {
    var g = GAMES[Math.floor(Math.random() * TOTAL)];
    markPlayed(g.slug);
    location.href = g.slug + '/index.html';
  });

  document.getElementById('gx-next').addEventListener('click', function () {
    var o = allPlayed();
    var next = GAMES.filter(function (g) { return !o[g.slug]; })[0] || GAMES[0];
    markPlayed(next.slug);
    location.href = next.slug + '/index.html';
  });

  document.getElementById('gx-reset').addEventListener('click', function () {
    if (!confirm('Clear the record of which games you have played on this device?')) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    renderProgress();
    render();
  });

  /* Coming back from a game should refresh the played dots. */
  window.addEventListener('pageshow', function () { renderProgress(); render(); });

  render();
  renderProgress();
})();
