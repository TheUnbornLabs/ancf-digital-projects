# Game tests

Test harness for the 100 games in [`../games`](../games). Plain Node + jsdom, no framework.

```bash
cd tests
npm install

node audit/audit.js            # Tier 1: universal invariants, all 100 games, ~2 min
node audit/audit.js word-unscramble    # ...or one game
node test_word-unscramble.js   # Tier 2: one game's playthrough suite
```

Every suite takes an optional game path as `argv[2]` and otherwise tests `../games/<slug>/index.html`
— the shipping copy, since these tests live in the repo they test. `audit.js` also honours
`ANCF_GAMES=<dir>` to audit a different checkout.

Exit code is 0 when green, non-zero when red. `audit/audit.js` always exits 0 — read its summary.

## Read this first

**[`audit/PROTOCOL.md`](audit/PROTOCOL.md)** explains why these tests are shaped the way they are.
The short version: the original suites asserted *single steps* (`reset -> score 0`), and every bug
that reached players needed *two* steps to appear. One game was completely unplayable while 55 of
its 71 checks passed.

> **Test the loop, not the step.**

So a suite here is not "does clicking work". It drives the real gameplay loop through the game's
`window.__cfq` hook and asserts the game keeps *progressing*: complete the core action → does it
advance? Three times running → still advancing? Reach an ending → can you restart?

## Two rules that are easy to get wrong

**A finding is a candidate until you reproduce it.** When this harness was built its false
positives briefly outnumbered its true positives 30 to 2 — every one of them a bug in the *test*,
not the game. `PROTOCOL.md` lists the whole taxonomy; the short list:

- a start function that *requires an argument* (`startRound(r)`) called bare fabricates NaN state
- some games do `game = freshGame()`, so a cached `hook.game` reference goes stale
- `best = Infinity` is the "no record yet" sentinel, not corruption
- `requestAnimationFrame` is disabled here: nothing moves unless you call `update()` yourself
- your probe is wrong more often than the game is — verify the probe first

**Never weaken a suite to make it pass.** If a suite fails after a fix, either the fix is
incomplete or the suite asserts the old buggy behaviour (that has happened). Work out which. After
amending any suite, check it still *fails* the pre-fix build — otherwise it has stopped being a
regression net and is just decoration.

## What's here

| | |
|---|---|
| `test_<slug>.js` | Tier 2 playthrough suite, one per game (99) |
| `audit/audit.js` | Tier 1 generic invariants across every game |
| `audit/PROTOCOL.md` | why these bugs ship, and how to hunt them |
| `audit/sweep-results.json` | findings record from the full Tier 2 sweep |

Three suites are red against healthy games — they predate features the games gained later
(`carbon-clear` never dismisses the fact-card intro; `boundary-catch` predates the miss penalty;
`doomscroll-dodger` hammers `hitHazard` with no `update()`, so its i-frames absorb every hit).
The games are fine; the suites need updating. `seed-garden` is red on a real, unfixed low-severity
race.
