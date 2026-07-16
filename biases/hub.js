/* 100 Biases of Natalism — hub: search, part filters, progress, random pick.
   Data is embedded in the page (#bx-data) so the hub works offline and from file://. */
(function () {
  var DATA = JSON.parse(document.getElementById('bx-data').textContent);
  var BIASES = DATA.biases, PARTS = DATA.parts;

  var grid = document.getElementById('bx-grid');
  var empty = document.getElementById('bx-empty');
  var search = document.getElementById('bx-search');
  var filters = document.getElementById('bx-filters');
  var count = document.getElementById('bx-count');
  var pcount = document.getElementById('pcount');
  var pfill = document.getElementById('pfill');

  var state = { q: '', part: 'all' };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  var pad = function (n) { return ('00' + n).slice(-3); };

  function cardHTML(b) {
    var p = BX.get(b.n);
    var cls = 'bx-card' + (p.passed ? ' passed' : (p.seen ? ' seen' : ''));
    var status = p.passed ? ('Quiz passed · ' + p.best + '/' + b.quizLen)
      : (p.best ? ('Best ' + p.best + '/' + b.quizLen) : (p.seen ? 'Opened' : 'Not opened yet'));
    return '<a class="' + cls + '" href="' + pad(b.n) + '-' + b.slug + '/index.html">' +
      '<span class="top"><span class="num">BIAS ' + pad(b.n) + '</span>' +
      '<span class="partchip' + (b.part === 0 ? ' p1' : '') + '">' + esc(PARTS[b.part].roman) + '</span></span>' +
      '<h3>' + esc(b.title) + '</h3>' +
      '<p class="hook">' + esc(b.hook) + '</p>' +
      '<span class="foot"><span class="done-dot" aria-hidden="true"></span>' + esc(status) + '</span></a>';
  }

  function matches(b) {
    if (state.part !== 'all' && String(b.part) !== state.part) return false;
    if (!state.q) return true;
    return b.search.indexOf(state.q) !== -1;
  }

  function render() {
    var list = BIASES.filter(matches);
    grid.innerHTML = list.map(cardHTML).join('');
    empty.style.display = list.length ? 'none' : '';
    count.textContent = list.length === BIASES.length
      ? '100 biases' : (list.length + ' of 100 biases');
  }

  function renderProgress() {
    var all = BX.all(), seen = 0, passed = 0;
    BIASES.forEach(function (b) {
      var p = all[b.n] || {};
      if (p.seen) seen++;
      if (p.passed) passed++;
    });
    pcount.textContent = seen + ' / 100 opened · ' + passed + ' quiz' + (passed === 1 ? '' : 'zes') + ' passed';
    pfill.style.width = seen + '%';
  }

  /* ---- filters ---- */
  filters.innerHTML = '<button class="chip" type="button" data-part="all" aria-pressed="true">All 100</button>' +
    PARTS.map(function (p, i) {
      return '<button class="chip" type="button" data-part="' + i + '" aria-pressed="false">' +
        esc(p.roman + ' · ' + p.name) + '</button>';
    }).join('');

  filters.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    state.part = b.dataset.part;
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

  document.getElementById('bx-random').addEventListener('click', function () {
    var b = BIASES[Math.floor(Math.random() * BIASES.length)];
    location.href = pad(b.n) + '-' + b.slug + '/index.html';
  });

  document.getElementById('bx-next').addEventListener('click', function () {
    var all = BX.all();
    var next = BIASES.filter(function (b) { return !(all[b.n] || {}).seen; })[0] || BIASES[0];
    location.href = pad(next.n) + '-' + next.slug + '/index.html';
  });

  document.getElementById('bx-reset').addEventListener('click', function () {
    if (!confirm('Clear your reading progress and quiz scores on this device?')) return;
    BX.reset();
    renderProgress();
    render();
  });

  render();
  renderProgress();
})();
