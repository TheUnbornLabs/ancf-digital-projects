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

  /* ── type icons (inline SVG — renders identically everywhere, unlike emoji) ── */
  var TYPE_ICON_PATHS = {
    'Guide': '<path d="M2.5 4.5c2-1 4.5-1 7 0v11c-2.5-1-5-1-7 0Z"/><path d="M17.5 4.5c-2-1-4.5-1-7 0v11c2.5-1 5-1 7 0Z"/>',
    'Quiz': '<circle cx="10" cy="10" r="7.5"/><path d="M7.8 7.6a2.2 2.2 0 1 1 3.4 1.8c-.7.5-1.2.9-1.2 1.8"/><circle cx="10" cy="13.8" r=".25" fill="currentColor"/>',
    'Calculator': '<rect x="4" y="1.5" width="12" height="17" rx="1.5"/><path d="M6.5 4.5h7v3h-7z"/><path d="M6.5 11h1M9.5 11h1M12.5 11h1M6.5 14h1M9.5 14h1M12.5 14h1"/>',
    'Generator': '<path d="M12.8 2.8 16 6 6.5 15.5 2.5 16.5l1-4 9.3-9.7Z"/><path d="M2.5 18h14"/>',
    'Game': '<rect x="1.5" y="6" width="17" height="9" rx="4"/><path d="M6 8.5v4M4 10.5h4"/><circle cx="14" cy="9" r="1"/><circle cx="16" cy="12" r="1"/>',
    'Reflection': '<path d="M6 12.5a4 4 0 1 1 1-7.9 4.5 4.5 0 0 1 8.6 1.5A3.5 3.5 0 0 1 15 13.5H8a4 4 0 0 1-2-1Z"/><circle cx="5" cy="15.5" r="1"/><circle cx="3.2" cy="17.5" r=".6"/>',
    'Community Tool': '<circle cx="10" cy="10" r="2.3"/><path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4M15.1 15.1l-1.4-1.4M6.3 6.3 4.9 4.9"/>',
    'Tool': '<circle cx="8.5" cy="8.5" r="5.5"/><path d="M16.5 16.5 12.7 12.7"/>',
    'Checklist': '<path d="M3.5 5.5h2M3.5 10h2M3 14.5l.8.8L5.5 13.5"/><path d="M8 5.5h8.5M8 10h8.5M8 14.5h6"/>',
    'Simulation': '<path d="M11 2.5 4 11.5h5l-1 6 7-9h-5l1-6Z"/>',
    'Flashcard': '<rect x="5.3" y="4.2" width="11" height="14" rx="1.5" transform="rotate(6 10.8 11.2)"/><rect x="3.5" y="2.5" width="11" height="14" rx="1.5"/>'
  };
  var DEFAULT_ICON = '<circle cx="10" cy="10" r="1.3" fill="currentColor" stroke="none"/>';

  function typeIcon(t) {
    var p = TYPE_ICON_PATHS[t] || DEFAULT_ICON;
    return '<svg class="type-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" ' +
      'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  /* ── card builder (shared) ──────────────────────────────────────────── */
  function buildCard(p, cls) {
    var a = document.createElement('a');
    a.className = cls || 'card';
    a.href = p.path;
    var icon = typeIcon(p.type || '');
    var typeLabel = p.type ? '<span class="card-type">' + icon + p.type + '</span>' : '';
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
  var pathCards = [].slice.call(document.querySelectorAll('.path-card'));
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
