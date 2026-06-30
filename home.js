(function () {
  /* ── theme ─────────────────────────────────────────────────────────── */
  var root = document.documentElement;
  var saved = null; try { saved = localStorage.getItem('ancf-theme'); } catch (e) {}
  if (saved) { root.setAttribute('data-theme', saved); }
  else if (window.matchMedia && matchMedia('(prefers-color-scheme:dark)').matches) {
    root.setAttribute('data-theme', 'dark');
  }
  var tg = document.getElementById('themeBtn');
  function lab() { tg.textContent = (root.getAttribute('data-theme') === 'dark') ? '☀ Light' : '☾ Dark'; }
  if (tg) {
    lab();
    tg.addEventListener('click', function () {
      var d = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', d);
      try { localStorage.setItem('ancf-theme', d); } catch (e) {}
      lab();
    });
  }

  var DATA = window.__PROJECTS__ || [];

  /* ── type icons ─────────────────────────────────────────────────────── */
  var TYPE_ICON = {
    'Guide': '📖', 'Quiz': '🧩', 'Calculator': '🔢', 'Generator': '✍️',
    'Game': '🎮', 'Reflection': '💭', 'Community Tool': '🛠', 'Tool': '🔍',
    'Checklist': '✅', 'Simulation': '⚡', 'Flashcard': '🃏'
  };

  function typeIcon(t) { return TYPE_ICON[t] || '•'; }

  /* ── card builder (shared) ──────────────────────────────────────────── */
  function buildCard(p, cls) {
    var a = document.createElement('a');
    a.className = cls || 'card';
    a.href = p.path;
    var icon = typeIcon(p.type || '');
    var typeLabel = p.type ? '<span class="card-type"><span class="type-icon">' + icon + '</span>' + p.type + '</span>' : '';
    var timeLabel = p.estimatedTime ? '<span class="card-time">⏱ ' + p.estimatedTime + '</span>' : '';
    a.innerHTML =
      '<span class="num">PROJECT ' + String(p.number).padStart(3, '0') + '</span>' +
      '<div class="card-tags">' + typeLabel + timeLabel + '</div>' +
      '<h3>' + p.title + '</h3>' +
      '<p class="desc">' + p.description + '</p>' +
      '<div class="meta">' +
        '<span class="diff diff-' + (p.difficulty || 'Beginner').toLowerCase() + '">' + (p.difficulty || 'Beginner') + '</span>' +
        '<span class="btn btn-primary card-open">Open →</span>' +
      '</div>';
    return a;
  }

  /* ── Start Here ─────────────────────────────────────────────────────── */
  var startNums = [1, 2, 3, 5, 6, 10];
  var startEl = document.getElementById('start-here-grid');
  if (startEl) {
    startNums.forEach(function (n) {
      var p = DATA.filter(function (x) { return x.number === n; })[0];
      if (!p) return;
      startEl.appendChild(buildCard(p, 'card card-start'));
    });
  }

  /* ── Featured Tools ─────────────────────────────────────────────────── */
  var featEl = document.getElementById('featured-grid');
  if (featEl) {
    DATA.filter(function (p) { return p.featured; }).forEach(function (p) {
      featEl.appendChild(buildCard(p, 'card card-featured'));
    });
  }

  /* ── Collection mini-grids ──────────────────────────────────────────── */
  var COLLECTIONS = [
    { id: 'beginner',       label: 'Beginner Path',              desc: 'Start here — calm introductions and gentle reflection tools.', icon: '🌱' },
    { id: 'family-pressure',label: 'Family Pressure Toolkit',    desc: 'Detectors, scripts, and generators for navigating real-life pressure.', icon: '🛡' },
    { id: 'ethics',         label: 'Ethics Path',                desc: 'Deep-dive guides on consent, risk, autonomy, and philosophical arguments.', icon: '⚖️' },
    { id: 'practical',      label: 'Practical Life Planning',    desc: 'Calculators, checklists, and planning boards for the childfree life.', icon: '📋' },
    { id: 'games',          label: 'Games & Simulations',        desc: 'Interactive games that make learning about these topics fun.', icon: '🎮' },
    { id: 'writing',        label: 'Writing & Response Tools',   desc: 'Generators and builders for captions, scripts, manifestos, and replies.', icon: '✍️' },
    { id: 'community-admin',label: 'Community Admin Toolkit',    desc: 'Rules, notices, policies, and moderation tools for online groups.', icon: '🛠' }
  ];

  COLLECTIONS.forEach(function (col) {
    var el = document.getElementById('col-grid-' + col.id);
    if (!el) return;
    var projects = DATA.filter(function (p) {
      return p.collection && p.collection.indexOf(col.id) > -1;
    });
    projects.slice(0, 4).forEach(function (p) {
      el.appendChild(buildCard(p, 'card card-sm'));
    });
    var more = document.getElementById('col-more-' + col.id);
    if (more) {
      more.textContent = projects.length + ' tools in this collection';
      more.addEventListener('click', function (e) {
        e.preventDefault();
        setCollection(col.id, col.label);
        scrollToBrowse();
      });
    }
  });

  /* ── Main grid (Browse All) ─────────────────────────────────────────── */
  var grid = document.getElementById('grid');
  var searchEl = document.getElementById('search');
  var countEl = document.getElementById('count');
  var chips = [].slice.call(document.querySelectorAll('.chip'));
  var activeFilter = 'All';
  var activeCollection = null;
  var q = '';

  function render() {
    var list = DATA.filter(function (p) {
      if (activeCollection) {
        if (!(p.collection && p.collection.indexOf(activeCollection) > -1)) return false;
      } else if (activeFilter !== 'All') {
        if (p.category !== activeFilter) return false;
      }
      if (q) {
        var s = (p.number + ' ' + p.title + ' ' + p.category + ' ' + (p.type || '') + ' ' + p.description).toLowerCase();
        if (s.indexOf(q) === -1) return false;
      }
      return true;
    });
    if (!grid) return;
    grid.innerHTML = '';
    if (!list.length) {
      grid.innerHTML = '<div class="empty">No projects match. <a href="#" id="clear-filters">Clear filters</a></div>';
      var cf = document.getElementById('clear-filters');
      if (cf) cf.addEventListener('click', function (e) { e.preventDefault(); resetFilters(); });
    }
    list.forEach(function (p) { grid.appendChild(buildCard(p)); });
    if (countEl) countEl.textContent = list.length + ' of ' + DATA.length + ' projects';
  }

  function resetFilters() {
    activeFilter = 'All'; activeCollection = null; q = '';
    if (searchEl) searchEl.value = '';
    chips.forEach(function (c) {
      c.classList.toggle('active', c.dataset.cat === 'All');
    });
    updateCollectionBadge(null);
    render();
  }

  function setCollection(id, label) {
    activeCollection = id;
    activeFilter = 'All';
    chips.forEach(function (c) { c.classList.remove('active'); });
    updateCollectionBadge(label);
    render();
  }

  function updateCollectionBadge(label) {
    var badge = document.getElementById('collection-badge');
    if (!badge) return;
    if (label) {
      badge.textContent = 'Collection: ' + label;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }

  if (searchEl) {
    searchEl.addEventListener('input', function () {
      q = this.value.trim().toLowerCase();
      render();
    });
  }

  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (x) { x.classList.remove('active'); });
      c.classList.add('active');
      activeFilter = c.dataset.cat;
      activeCollection = null;
      updateCollectionBadge(null);
      render();
    });
  });

  /* ── Choose Your Path clicks ────────────────────────────────────────── */
  var pathCards = [].slice.call(document.querySelectorAll('.path-card[data-cat]'));
  pathCards.forEach(function (pc) {
    pc.addEventListener('click', function (e) {
      var cat = pc.dataset.cat;
      var col = pc.dataset.collection;
      if (col) {
        setCollection(col, pc.dataset.label || col);
      } else {
        activeCollection = null;
        activeFilter = cat || 'All';
        chips.forEach(function (c) {
          c.classList.toggle('active', c.dataset.cat === activeFilter);
        });
        updateCollectionBadge(null);
        render();
      }
      scrollToBrowse();
    });
  });

  /* ── Stats ──────────────────────────────────────────────────────────── */
  var statsEl = document.getElementById('stats');
  if (statsEl) {
    var cats = {}; DATA.forEach(function (p) { cats[p.category] = 1; });
    statsEl.innerHTML =
      '<div class="stat"><b>' + DATA.length + '</b><span>Projects</span></div>' +
      '<div class="stat"><b>' + Object.keys(cats).length + '</b><span>Categories</span></div>' +
      '<div class="stat"><b>100%</b><span>Static &amp; offline</span></div>' +
      '<div class="stat"><b>0</b><span>Ads &amp; trackers</span></div>';
  }

  function scrollToBrowse() {
    var el = document.getElementById('browse');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ── Hero CTAs ──────────────────────────────────────────────────────── */
  var startBtn = document.getElementById('hero-start');
  if (startBtn) {
    startBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var sh = document.getElementById('start-here');
      if (sh) sh.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  var browseBtn = document.getElementById('hero-browse');
  if (browseBtn) {
    browseBtn.addEventListener('click', function (e) {
      e.preventDefault();
      scrollToBrowse();
    });
  }

  /* ── Initial render ─────────────────────────────────────────────────── */
  render();
})();
