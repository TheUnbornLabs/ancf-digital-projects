/* Shared progress store for the 100 Biases section.
   One localStorage key for the whole section, so the hub can read what the
   individual bias pages recorded. Device-only; nothing is uploaded. */
(function () {
  var KEY = 'ancf-biases-progress';
  function all() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(o) {
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
  }
  window.BX = {
    PASS: 7,
    all: all,
    get: function (n) { return all()[n] || {}; },
    mark: function (n, patch) {
      var o = all(), cur = o[n] || {}, k;
      for (k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) cur[k] = patch[k];
      o[n] = cur;
      save(o);
    },
    reset: function () { save({}); }
  };
})();
