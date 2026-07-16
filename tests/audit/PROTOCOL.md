# Game QA Protocol

Why games kept shipping broken despite passing smoke and logic tests, and what to run instead.

## The problem, stated precisely

Word Unscramble was **unplayable**: solving the first word froze the game forever. It had a
71-check test suite. **55 of those checks passed on the frozen build.** The suite was not
weak — it was aimed at the wrong thing.

Every assertion in the original suites is *single-step*:

```
reset -> state playing        catch GOOD raises score
reset -> score 0              wrong letter costs a life
```

Do one thing, check its immediate effect. Word Unscramble passed all of these. Clicking a
correct letter *did* type it. The bug lived one step later: complete a word → wait → does it
advance? Nobody asked, because no test ever took a second step.

> **The rule: test the loop, not the step.**
> A bug that needs two actions to appear is invisible to a suite that only ever takes one.

The corollary explains the pattern you're seeing. These games are individually plausible and
collectively broken, so per-game tests written from the same mental model as the game inherit
the same blind spot. The fix is a check the author *cannot* forget to write, applied uniformly
from outside — which is what Tier 1 below is.

## What the failures actually are

Every confirmed bug so far is the same shape: **a guard that refuses a legitimate action.**

| Game | Guard | Why it's wrong |
|---|---|---|
| word-unscramble | `nextWord()` opens `if(transitioning)return` | every caller sets `transitioning=true` first, so it refused every advance |
| word-unscramble | `nextWord()` opens `if(state==='gameover')return` | restart calls in from the gameover screen; the player was stuck |
| simon-sequence | `resetGame()` never sets `state` | restart from gameover left `state='gameover'` forever |
| draft-reply | `if(chosen>=0)return` | the timeout sentinel is `-2`, so the guard never fired |

Three of four are **soft-locks**: no crash, no error, no console output. The game just stops
honouring input. Nothing in a conventional smoke test looks for that — which is exactly why
they survived to production.

## The three tiers

**Tier 1 — universal invariants (`audit.js`). Automated, all 100, ~2 min, no per-game knowledge.**
Properties every game must satisfy regardless of its rules. This is the layer that scales, and
the one that would have caught 3 of the 4 bugs above.

- loads with no uncaught error; exposes its hook; has a canvas
- `draw()` does not throw in any state the game itself defines
- `update()` survives odd `dt` (`0`, `-5`, `5000`) and a 1200-frame run
- a run introduces no `NaN` (baselined at start, so sentinels don't false-positive)
- **a finished screen is escapable** — replays the game's *own* restart handler
- repeated restart+run does not throw
- entity arrays do not grow without bound
- corrupt `localStorage` does not break the game

**Tier 2 — per-game playthrough. Needs the game's rules; one suite per game.**
Can a competent player get from the start to the end? Drive the real loop and assert
*progression*, not setup. Minimum bar per game:

- complete the core action → **the game advances** (the check that catches soft-locks)
- do it three times in a row → still advancing, still accepting input
- exhaust the fail condition → reach a real ending
- restart from that ending → playable again
- the skip / hint / power-up path advances rather than consuming and freezing

`tests/test_word-unscramble.js` is the reference implementation (67 checks; fails 11 on the
broken build).

**Tier 3 — visual / semantic. Needs eyes or pixels; not automatable in bulk.**
The crow in Childfree Quest flew backwards for its whole life: correct code, correct tests,
wrong direction. No invariant catches that. Confirmed by rendering the sprite and measuring
the beak's offset from the body centre — worth doing for anything directional, but only
reachable by sampling.

## Non-negotiable: a finding is a candidate until confirmed

The harness's own false-positive rate was **higher than its true-positive rate** on the first
run: 30 high-severity candidates, 2 real. Every one of these was my harness, not the games:

| Symptom | Actual cause |
|---|---|
| `best=Infinity` ×4 "corruption" | deliberate "no record yet" sentinel, rendered as `—` |
| `draw() threw` ×5 in game one | forced `state='playing'` before a level existed |
| `dead-restart` ×6 | games do `game=freshGame()`; the harness held a **stale reference** |
| `startRound() threw` (assumption-flip) | `startRound(r)` **requires an argument** |
| `bubbles.y=NaN` (stigma-archery) | same — `startRound(rnd)` called bare produced `seeded(NaN)` |

And one near-miss worth internalising: "preferring" `resetGame()` as the entry point made the
harness **pass the known-broken build**. Guessing an entry point is worse than useless — the
audit now parses each game's real restart handler and replays exactly that.

So:

1. **Keep a positive control.** `git show 685b9ad:games/word-unscramble/index.html` is a
   known-broken build. Any harness change must still fail it and still pass the fixed one.
   This caught two harness regressions that would otherwise have produced a silent all-clear.
2. **Reproduce before reporting.** Drive the game the way a player would and watch it break.
3. **Read the source before believing.** Half the candidates dissolved on one look.
4. **An inconclusive probe is not an all-clear.** The post-timeout exploit in draft-reply first
   read as "not exploitable" only because the probe couldn't find the right option index.

## Running it

```bash
cd tests
npm install
node audit/audit.js                      # all 100 (~2 min)
node audit/audit.js word-unscramble      # one game
ANCF_GAMES=/path/to/games node audit/audit.js   # audit another checkout
```

Exit is always 0; read the summary. `audit/audit-results.json` has the full findings.
Severity: **high** = player-visible breakage; **medium** = degradation; **low** = needs a human.

## Where this leaves the collection

Tier 1: **100/100 clean.** Tier 2: **11/100** have a playthrough suite. The 89 without one
could still hold a word-unscramble-class bug that Tier 1 cannot see — every Tier-1 check is
rule-agnostic, and soft-locks live in the rules. That gap is the next piece of work, and it is
the one that needs per-game reasoning rather than another sweep.
