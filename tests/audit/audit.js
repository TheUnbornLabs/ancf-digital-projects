/* ANCF games — Tier 1 generic audit harness.
 *
 * Runs the same universal invariants against every game, driven through the
 * window.__cfq / window.__game hook that all 100 games expose.
 *
 * These are the checks that do NOT need to know a game's rules. They catch the
 * failure classes that a per-game "does clicking work" test structurally cannot:
 * crashes in rare states, numeric corruption, unbounded growth, dead restarts.
 *
 * Everything reported here is a CANDIDATE. Findings are confirmed by hand (or by
 * a per-game playthrough) before being called a bug — see PROTOCOL.md.
 *
 *   node audit/audit.js            # all games
 *   node audit/audit.js word-unscramble pressure-pop
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const GAMES_DIR = process.env.ANCF_GAMES ||
  path.join(__dirname, '..', '..', 'games');

const TERMINAL_STATES = ['gameover', 'won', 'win', 'timesup', 'rushover', 'roundover', 'allclear'];
const LIVE_STATES = ['playing', 'growing', 'rush', 'boss'];

/* ---------- canvas 2D stub ---------- */
function ctxStub(el, sink) {
  return new Proxy({}, {
    get(t, p) {
      if (p === 'measureText') return () => ({ width: 10 });
      if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern')
        return () => ({ addColorStop() {} });
      if (p === 'canvas') return el;
      if (p === 'getImageData') return (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(4, (w | 0) * (h | 0) * 4)) });
      if (p === 'setTransform' || p === 'getTransform') return () => ({});
      if (p === 'scale') return (x, y) => { sink.scales.push([x, y]); };
      if (p === 'drawImage') return () => {};
      return t[p] !== undefined ? t[p] : (() => {});
    },
    set() { return true; }
  });
}

/* ---------- load a game into jsdom ---------- */
function loadGame(slug) {
  const file = path.join(GAMES_DIR, slug, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const pageErrors = [];
  const sink = { scales: [] };
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: false,
    url: 'http://localhost/',
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { return ctxStub(this, sink); };
      w.requestAnimationFrame = () => 0;   // we drive update() ourselves
      w.cancelAnimationFrame = () => {};
      w.AudioContext = undefined;
      w.webkitAudioContext = undefined;
      w.addEventListener('error', e => pageErrors.push(String(e.message || e.error)));
      w.onerror = (m) => { pageErrors.push(String(m)); };
    }
  });
  return { dom, win: dom.window, pageErrors, sink, html };
}

/* ---------- capability detection ---------- */
function getHook(win) {
  if (win.__cfq) return win.__cfq;
  if (win.__game) return win.__game;
  for (const k of Object.keys(win)) if (/^__/.test(k) && win[k] && typeof win[k] === 'object') return win[k];
  return null;
}
function pick(hook, names) {
  for (const n of names) if (hook && typeof hook[n] === 'function') return { name: n, fn: hook[n] };
  return null;
}
// Some games' startRound(r)/startGame(level) REQUIRE an argument, and calling them
// bare fabricates NaN state that looks like a game bug but is a harness artifact.
// Prefer a real no-argument entry point; only fall back to an arity>0 one.
function pickStart(hook, names) {
  const cands = names.filter(n => hook && typeof hook[n] === 'function');
  const zeroArg = cands.find(n => hook[n].length === 0);
  const chosen = zeroArg || cands[0];
  if (!chosen) return null;
  return { name: chosen, fn: hook[chosen], needsArg: hook[chosen].length > 0 };
}
/* Find how the game ITSELF restarts from a finished screen.
 *
 * Guessing an entry point is worse than useless here: word-unscramble exposes both
 * startRound() and resetGame(), but its pointer handler calls startRound(). Probing
 * resetGame() instead reports the game healthy while the player is stuck. So parse
 * the handler and replay exactly what it does.
 *
 * Returns [{ term, calls:[names], assignsLiveState:bool }]
 */
const JS_KEYWORDS = new Set(['if', 'for', 'while', 'return', 'switch', 'catch', 'function', 'typeof', 'new', 'do', 'else']);
function discoverRestartPaths(html) {
  const paths = [];
  const re = /state\s*===\s*'([a-zA-Z]+)'/g;
  let m;
  while ((m = re.exec(html))) {
    const term = m[1];
    if (!TERMINAL_STATES.includes(term)) continue;
    // take the braced block that follows this condition, if it starts soon after
    const brace = html.indexOf('{', re.lastIndex);
    if (brace < 0 || brace - re.lastIndex > 60) continue;
    let depth = 0, end = -1;
    for (let i = brace; i < html.length && i < brace + 600; i++) {
      if (html[i] === '{') depth++;
      else if (html[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end < 0) continue;
    const body = html.slice(brace + 1, end);
    if (body.length > 400) continue;                 // not a restart handler
    const calls = [...body.matchAll(/([A-Za-z_$][\w$]*)\s*\(/g)].map(x => x[1]).filter(n => !JS_KEYWORDS.has(n));
    // `if(state==='gameover')` also appears inside draw()/update() bodies. Only a block
    // that calls something restart-shaped is a restart handler; otherwise we'd "replay"
    // a render branch and call the game broken for not restarting from it.
    const restartish = calls.filter(n => /^(reset|start|restart|new|begin|init|play|round|again)/i.test(n));
    if (!restartish.length) continue;
    // does the handler set a live state itself? then the reset fn need not.
    const assign = [...body.matchAll(/state\s*=\s*'([a-zA-Z]+)'/g)].map(x => x[1]);
    const assignsLiveState = assign.some(s => LIVE_STATES.includes(s) || s === 'title');
    paths.push({ term, calls: restartish, assignsLiveState });
  }
  // dedupe by terminal state
  const seen = new Set();
  return paths.filter(p => { const k = p.term + '|' + p.calls.join(','); if (seen.has(k)) return false; seen.add(k); return true; });
}

// States the game's own source actually mentions.
function discoverStates(html) {
  const found = new Set();
  for (const m of html.matchAll(/state\s*(?:={1,3}|!==?)\s*'([a-zA-Z]+)'/g)) found.add(m[1]);
  for (const m of html.matchAll(/state\s*:\s*'([a-zA-Z]+)'/g)) found.add(m[1]);
  return [...found];
}

/* ---------- numeric health ---------- */
function scanNumbers(obj, maxDepth = 3) {
  const bad = [];
  const seen = new Set();
  (function walk(o, p, d) {
    if (!o || d > maxDepth || typeof o !== 'object' || seen.has(o)) return;
    seen.add(o);
    for (const k of Object.keys(o)) {
      let v;
      try { v = o[k]; } catch (e) { continue; }
      const key = p ? p + '.' + k : k;
      if (typeof v === 'number') {
        if (Number.isNaN(v)) bad.push(key + '=NaN');
        else if (!Number.isFinite(v)) bad.push(key + '=' + v);
      } else if (v && typeof v === 'object') {
        if (Array.isArray(v)) { for (let i = 0; i < Math.min(v.length, 6); i++) walk(v[i], key + '[' + i + ']', d + 1); }
        else walk(v, key, d + 1);
      }
    }
  })(obj, '', 0);
  return bad;
}
function countEntities(hook, game) {
  let n = 0;
  const src = [game, hook];
  for (const o of src) {
    if (!o) continue;
    for (const k of Object.keys(o)) {
      let v; try { v = o[k]; } catch (e) { continue; }
      if (Array.isArray(v)) n += v.length;
    }
  }
  return n;
}

/* ---------- the audit ---------- */
function auditGame(slug) {
  const findings = [];
  const add = (check, severity, detail) => findings.push({ slug, check, severity, detail });
  let ctxLoad;
  try {
    ctxLoad = loadGame(slug);
  } catch (e) {
    add('load', 'high', 'threw while loading: ' + e.message);
    return { slug, findings, ok: false };
  }
  const { win, pageErrors, html } = ctxLoad;
  const hook = getHook(win);

  /* T1.1 — loads without error, exposes a hook */
  if (pageErrors.length) add('load-clean', 'high', 'uncaught error on load: ' + pageErrors[0]);
  if (!hook) { add('hook', 'high', 'no window.__cfq / __game hook'); return { slug, findings, ok: false }; }
  if (!win.document.querySelector('canvas')) add('canvas', 'medium', 'no <canvas> element');

  const update = pick(hook, ['update']);
  const draw = pick(hook, ['draw']);
  const start = pickStart(hook, ['resetGame', 'reset', 'startRound', 'startGame', 'start', 'restart', 'newGame']);
  // Several games REPLACE their state object on reset (`game = freshGame()`), so a
  // cached reference goes stale and reports the discarded object's state. Always
  // re-read through the hook's getter.
  const G = () => (hook.game !== undefined ? hook.game : (hook.state !== undefined ? hook : null));
  const game = G();

  const caps = { update: !!update, draw: !!draw, start: !!start, game: !!game };
  if (!update) add('hook-update', 'low', 'hook exposes no update() — dynamic checks skipped');
  if (!draw) add('hook-draw', 'low', 'hook exposes no draw() — render checks skipped');
  if (!start) add('hook-start', 'low', 'hook exposes no reset/start — lifecycle checks skipped');
  if (!game) add('hook-game', 'low', 'hook exposes no game state object');

  const states = discoverStates(html);
  const safeStart = () => { try { if (start) start.fn(); return true; } catch (e) { add('start-throws', 'high', start.name + '() threw: ' + e.message); return false; } };

  /* T1.2 — draw() must not throw in any state the game itself defines.
     Start a real round first: several games only build their level/board on start,
     and drawing a 'playing' state that was never started is a harness artifact,
     not a player-reachable bug. */
  if (draw && game) {
    safeStart();
    const before = G().state;
    for (const st of states) {
      try { G().state = st; draw.fn(); }
      catch (e) {
        // Some states are only ever entered together with companion data
        // (`game.activePlace=b; game.state='shop'`). Forcing the state bare and
        // drawing it is not a path a player can reach, so don't call it a crash.
        const needsCompanion = new RegExp(`\\w+\\s*=\\s*[^;]+;\\s*\\w*\\.?state\\s*=\\s*'${st}'`).test(html);
        add('draw-throws', needsCompanion ? 'low' : 'high',
          `draw() threw in state '${st}': ${e.message}` +
          (needsCompanion ? ' (state requires companion data; likely not player-reachable — verify)' : ''));
      }
    }
    try { G().state = before; } catch (e) {}
    if (start) safeStart();
  }

  /* T1.3 — update() must survive odd dt and a long run */
  if (update) {
    safeStart();
    for (const dt of [0, 1, 16, 16.7, 100, 1000, 5000, -5]) {
      try { update.fn(dt); }
      catch (e) { add('update-throws', 'high', `update(${dt}) threw: ${e.message}`); break; }
    }
    safeStart();
    try { for (let i = 0; i < 1200; i++) update.fn(16); }
    catch (e) { add('update-longrun-throws', 'high', 'update() threw during a 1200-frame run: ' + e.message); }
  }

  /* T1.4 — the run must not INTRODUCE NaN / Infinity.
     Baselined against a freshly started round: `best=Infinity` is a legitimate
     "no record yet" sentinel in the timed games, so only newly-appearing
     non-finite values count as corruption. NaN is always reported: no game
     uses it as a sentinel. */
  if (update && game) {
    safeStart();
    const baseline = new Set(scanNumbers(G()).concat(scanNumbers(hook)));
    try { for (let i = 0; i < 600; i++) update.fn(16); } catch (e) {}
    const after = [...new Set(scanNumbers(G()).concat(scanNumbers(hook)))];
    const introduced = after.filter(x => !baseline.has(x));
    const nans = introduced.filter(x => x.endsWith('=NaN'));
    const infs = introduced.filter(x => !x.endsWith('=NaN'));
    if (nans.length) add('numeric-corruption', 'high', 'NaN appeared during a 600-frame run: ' + nans.slice(0, 5).join(', '));
    if (infs.length) add('numeric-corruption', 'medium', 'Infinity appeared during a 600-frame run: ' + infs.slice(0, 5).join(', '));
  }

  /* T1.5 — LIVENESS: a terminal state must be escapable.
     Every game's pointer handler restarts by calling its start fn straight from the
     gameover/won screen. If start() can't clear a terminal state, the player is stuck. */
  if (game) {
    const restartPaths = discoverRestartPaths(html);
    for (const rp of restartPaths) {
      // The handler assigns a live state itself (e.g. `resetGame();game.state='playing'`),
      // so the reset function isn't responsible for clearing it. Nothing to check.
      if (rp.assignsLiveState) continue;
      const callable = rp.calls.filter(n => typeof hook[n] === 'function' && hook[n].length === 0);
      if (!callable.length) continue;   // can't replay it through the hook; leave to Tier 2
      try {
        safeStart();
        G().state = rp.term;
        for (const n of callable) hook[n]();
        const now = G().state;          // re-read: reset may have replaced the object
        if (now === rp.term) {
          add('dead-restart', 'high',
            `the '${rp.term}' screen restarts via ${callable.map(c => c + '()').join(' + ')}, which does not clear state '${rp.term}' — the player is stuck there`);
        }
      } catch (e) {
        add('dead-restart', 'high', `restarting from '${rp.term}' via ${callable[0]}() threw: ${e.message}`);
      }
    }
  }

  /* T1.6 — repeated restarts must not throw or leak */
  if (start && game && update) {
    try {
      for (let i = 0; i < 5; i++) { start.fn(); for (let k = 0; k < 60; k++) update.fn(16); }
    } catch (e) { add('restart-loop-throws', 'high', 'repeated restart+run threw: ' + e.message); }
  }

  /* T1.7 — unbounded growth: entity arrays must not grow without limit */
  if (start && game && update) {
    safeStart();
    for (let i = 0; i < 300; i++) update.fn(16);
    const n1 = countEntities(hook, G());
    for (let i = 0; i < 2400; i++) update.fn(16);
    const n2 = countEntities(hook, G());
    if (n1 > 0 && n2 > Math.max(400, n1 * 8)) {
      add('unbounded-growth', 'medium', `tracked arrays grew ${n1} -> ${n2} over 2700 frames (possible leak)`);
    }
  }

  /* T1.8 — corrupt localStorage must not break the game */
  if (/localStorage/.test(html)) {
    const keys = [...new Set([...html.matchAll(/localStorage\.(?:getItem|setItem)\(\s*['"]([^'"]+)['"]/g)].map(m => m[1])
      .concat([...html.matchAll(/(?:LS_KEY|KEY|BEST_KEY)\s*=\s*['"]([^'"]+)['"]/g)].map(m => m[1])))];
    if (keys.length) {
      try {
        const c2 = loadGame.__poison ? null : null;
        const file = path.join(GAMES_DIR, slug, 'index.html');
        const h2 = fs.readFileSync(file, 'utf8');
        const errs = [];
        const dom2 = new JSDOM(h2, {
          runScripts: 'outside-only', url: 'http://localhost/',
        });
        for (const k of keys) dom2.window.localStorage.setItem(k, '{{not-a-number}}');
        // re-run the page scripts with poisoned storage
        const dom3 = new JSDOM(h2, {
          runScripts: 'dangerously', pretendToBeVisual: false, url: 'http://localhost/',
          beforeParse(w) {
            w.HTMLCanvasElement.prototype.getContext = function () { return ctxStub(this, { scales: [] }); };
            w.requestAnimationFrame = () => 0; w.cancelAnimationFrame = () => {};
            w.AudioContext = undefined; w.webkitAudioContext = undefined;
            for (const k of keys) { try { w.localStorage.setItem(k, '{{not-a-number}}'); } catch (e) {} }
            w.addEventListener('error', e => errs.push(String(e.message)));
          }
        });
        const h3 = getHook(dom3.window);
        if (errs.length) add('corrupt-storage', 'medium', 'corrupt localStorage caused an error on load: ' + errs[0]);
        else if (h3 && h3.game) {
          // Only NaN counts. `best=Infinity` is this collection's deliberate "no record
          // yet" sentinel — the timed games fall back to it in their catch blocks and
          // render it as '—', which is correct handling, not corruption.
          const bad = scanNumbers(h3.game, 2).filter(x => /best|score|high/i.test(x) && x.endsWith('=NaN'));
          if (bad.length) add('corrupt-storage', 'medium', 'corrupt localStorage produced ' + bad[0]);
        }
        dom2.window.close(); dom3.window.close();
      } catch (e) { /* storage probe is best-effort */ }
    }
  }

  try { win.close(); } catch (e) {}
  return { slug, findings, ok: true, caps };
}

/* ---------- runner ---------- */
const only = process.argv.slice(2).filter(a => !a.startsWith('-'));
const slugs = (only.length ? only : fs.readdirSync(GAMES_DIR))
  .filter(d => fs.statSync(path.join(GAMES_DIR, d)).isDirectory())
  .filter(d => fs.existsSync(path.join(GAMES_DIR, d, 'index.html')));

const all = [];
let done = 0;
for (const slug of slugs) {
  let r;
  try { r = auditGame(slug); }
  catch (e) { r = { slug, findings: [{ slug, check: 'harness', severity: 'high', detail: 'harness threw: ' + e.message }], ok: false }; }
  all.push(r);
  done++;
  const high = r.findings.filter(f => f.severity === 'high').length;
  const med = r.findings.filter(f => f.severity === 'medium').length;
  const mark = high ? 'FAIL' : med ? 'warn' : ' ok ';
  process.stdout.write(`[${String(done).padStart(3)}/${slugs.length}] ${mark}  ${slug}${high || med ? '  (' + r.findings.filter(f => f.severity !== 'low').map(f => f.check).join(', ') + ')' : ''}\n`);
}

const flat = all.flatMap(r => r.findings);
const bySeverity = s => flat.filter(f => f.severity === s);
console.log('\n================ TIER 1 AUDIT ================');
console.log('games audited      :', all.length);
console.log('clean (no high/med):', all.filter(r => !r.findings.some(f => f.severity !== 'low')).length);
console.log('high severity      :', bySeverity('high').length);
console.log('medium severity    :', bySeverity('medium').length);
console.log('low / info         :', bySeverity('low').length);

const byCheck = {};
flat.filter(f => f.severity !== 'low').forEach(f => (byCheck[f.check] = byCheck[f.check] || []).push(f.slug));
console.log('\n--- candidates by check ---');
for (const [k, v] of Object.entries(byCheck).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`${k} (${v.length}): ${v.slice(0, 12).join(', ')}${v.length > 12 ? ' …' : ''}`);
}
console.log('\n--- high severity detail ---');
for (const f of bySeverity('high')) console.log(`  ${f.slug}: [${f.check}] ${f.detail}`);

fs.writeFileSync(path.join(__dirname, 'audit-results.json'), JSON.stringify(all, null, 1));
console.log('\nwrote audit/audit-results.json');
process.exit(0);
