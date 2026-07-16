/* 100 Biases of Natalism — per-bias page interactivity.
   Flashcards, the ten-question check, and the reflection prompts.
   All state is localStorage on this device only; nothing is uploaded. */
(function () {
  var D = JSON.parse(document.getElementById('bias-data').textContent);
  var NOTE_KEY = 'ancf-biases-notes-' + D.n;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function onActivate(el, fn) {
    el.addEventListener('click', fn);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); }
    });
  }

  /* record the visit for the hub's progress rail */
  BX.mark(D.n, { seen: 1 });

  /* ---------------- flashcards ---------------- */
  (function () {
    var wrap = document.getElementById('flash');
    if (!wrap || !D.terms.length) return;
    var order = D.terms.map(function (_, i) { return i; });
    var pos = 0;
    var pill = document.getElementById('flash-count');
    var front = document.getElementById('flash-term');
    var back = document.getElementById('flash-def');

    function draw() {
      var t = D.terms[order[pos]];
      wrap.setAttribute('aria-pressed', 'false');
      front.textContent = t.term;
      back.textContent = t.def;
      pill.textContent = (pos + 1) + ' / ' + D.terms.length;
    }
    function step(d) {
      pos = (pos + d + D.terms.length) % D.terms.length;
      draw();
    }
    onActivate(wrap, function () {
      wrap.setAttribute('aria-pressed', wrap.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    });
    document.getElementById('flash-prev').addEventListener('click', function () { step(-1); });
    document.getElementById('flash-next').addEventListener('click', function () { step(1); });
    document.getElementById('flash-shuffle').addEventListener('click', function () {
      for (var i = order.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
      }
      pos = 0;
      draw();
    });
    draw();
  })();

  /* ---------------- the ten-question check ---------------- */
  (function () {
    var box = document.getElementById('quizbox');
    if (!box || !D.quiz.length) return;
    var resultEl = document.getElementById('quiz-result');
    var scoreBtn = document.getElementById('quiz-score');
    var resetBtn = document.getElementById('quiz-reset');
    var answered = {};

    box.innerHTML = D.quiz.map(function (q, qi) {
      return '<div class="quiz-q">' +
        '<span class="qnum">QUESTION ' + (qi + 1) + ' OF ' + D.quiz.length + '</span>' +
        '<p style="margin:4px 0 0;font-weight:600">' + esc(q.q) + '</p>' +
        '<div class="opts" role="group" aria-label="Question ' + (qi + 1) + ' options">' +
        q.options.map(function (o) {
          return '<div class="opt" role="button" tabindex="0" data-q="' + qi + '" data-l="' + o.letter + '">' +
            '<span class="ltr" aria-hidden="true">' + o.letter + '</span>' + esc(o.text) + '</div>';
        }).join('') +
        '</div>' +
        (q.explain ? '<p class="explain" data-x="' + qi + '" style="display:none"></p>' : '') +
        '</div>';
    }).join('');

    [].forEach.call(box.querySelectorAll('.opt'), function (el) {
      onActivate(el, function () {
        var qi = +el.dataset.q;
        if (answered[qi]) return;
        var q = D.quiz[qi];
        answered[qi] = el.dataset.l;
        [].forEach.call(box.querySelectorAll('.opt[data-q="' + qi + '"]'), function (o) {
          o.setAttribute('aria-disabled', 'true');
          o.tabIndex = -1;
          if (o.dataset.l === q.answer) o.classList.add('ok');
          else if (o === el) o.classList.add('no');
        });
        var x = box.querySelector('.explain[data-x="' + qi + '"]');
        if (x) {
          x.textContent = (el.dataset.l === q.answer ? 'Correct. ' : 'The answer is ' + q.answer + '. ') + q.explain;
          x.style.display = '';
        }
      });
    });

    function score() {
      var n = 0;
      D.quiz.forEach(function (q, i) { if (answered[i] === q.answer) n++; });
      return n;
    }

    scoreBtn.addEventListener('click', function () {
      var done = Object.keys(answered).length;
      if (done < D.quiz.length) {
        resultEl.innerHTML = '<strong>' + done + ' of ' + D.quiz.length + ' answered.</strong> ' +
          'Answer the rest to see your score — or read on and come back to it.';
        resultEl.style.display = '';
        return;
      }
      var s = score(), pass = s >= BX.PASS;
      var prev = BX.get(D.n).best || 0;
      BX.mark(D.n, { best: Math.max(prev, s), passed: (BX.get(D.n).passed || pass) ? true : false });
      resultEl.innerHTML = '<strong>' + s + ' / ' + D.quiz.length + '</strong> — ' +
        (pass ? 'you have the shape of this bias.' : 'worth another pass through the chapter map above.') +
        ' <span class="note" style="display:block;margin-top:6px">' +
        'This is a comprehension check, not a judgement of anyone\'s choices. Saved on this device only.</span>';
      resultEl.style.display = '';
      resetBtn.style.display = '';
    });

    resetBtn.addEventListener('click', function () {
      answered = {};
      [].forEach.call(box.querySelectorAll('.opt'), function (o) {
        o.classList.remove('ok', 'no');
        o.removeAttribute('aria-disabled');
        o.tabIndex = 0;
      });
      [].forEach.call(box.querySelectorAll('.explain'), function (x) { x.style.display = 'none'; });
      resultEl.style.display = 'none';
      resetBtn.style.display = 'none';
      box.scrollIntoView({ block: 'start' });
    });

    var best = BX.get(D.n).best;
    if (best) {
      resultEl.innerHTML = '<strong>Your best so far: ' + best + ' / ' + D.quiz.length + '</strong>';
      resultEl.style.display = '';
    }
  })();

  /* ---------------- reflection prompts ---------------- */
  (function () {
    var qt = document.getElementById('reflect-q');
    if (!qt || !D.discussion.length) return;
    var ta = document.getElementById('reflect-note');
    var pill = document.getElementById('reflect-count');
    var saved = document.getElementById('reflect-saved');
    var pos = 0, notes = {};
    try { notes = JSON.parse(localStorage.getItem(NOTE_KEY)) || {}; } catch (e) {}

    function draw() {
      qt.textContent = D.discussion[pos];
      ta.value = notes[pos] || '';
      pill.textContent = (pos + 1) + ' / ' + D.discussion.length;
      saved.textContent = notes[pos] ? 'Saved on this device' : '';
    }
    function step(d) {
      pos = (pos + d + D.discussion.length) % D.discussion.length;
      draw();
    }
    var t;
    ta.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        if (ta.value.trim()) notes[pos] = ta.value; else delete notes[pos];
        try { localStorage.setItem(NOTE_KEY, JSON.stringify(notes)); } catch (e) {}
        saved.textContent = ta.value.trim() ? 'Saved on this device' : '';
      }, 400);
    });
    document.getElementById('reflect-prev').addEventListener('click', function () { step(-1); });
    document.getElementById('reflect-next').addEventListener('click', function () { step(1); });
    draw();
  })();
})();
