# Project Review Log

A record of the multi-pass review-and-improvement work across the 100 ANCF Digital
Projects. Each project was rebuilt from a thin paragraph page into a real, distinct
mini-tool / guide / quiz / generator / game, then hardened through focused review passes.

> Note: an internal working codename is deliberately **not** recorded in this repo,
> per the project's standing rule that it must never appear in any file. The review
> below documents the same multi-pass intent under neutral names.

## Deep rebuild (passes 01–06 combined, per project, 001 → 100) — COMPLETE

Each project's rebuild applied, together:
- **01 Philosopher** — clearer definitions (consent, suffering, autonomy, risk, dignity);
  steelmanned objections; respect for disagreement; no insults to parents/children/families.
- **02 Author/editor** — stronger openings, tighter paragraphs, memorable closings, grammar.
- **03 Engineer** — working JS (`node --check` on every script), no console errors, correct
  relative links, defensive `try/catch`, fallbacks (clipboard, storage).
- **04 UX/mobile** — responsive layout, large tap targets, clear hierarchy, dark-mode contrast.
- **05 Accessibility** — real `<label>`s, keyboard-operable custom controls (role/tabindex/
  Enter-Space, aria-pressed), `aria-live` regions, theme-toggle `aria-label` (100/100).
- **06 Teacher** — "what this means" framing, beginner definitions, examples, reflection
  questions, mini quizzes, key takeaways, next-project links.

## Dedicated quality work folded in

- **07 Ethical engagement** — copy-this/Copy-all buttons, shareable lines, related links;
  no manipulative or clickbait tactics.
- **08 Safety / moderation** — sensitive topics (emotional blackmail, gaslighting,
  mental health, crisis, sterilization, poverty, disability, caste/community) given strong
  disclaimers, support signposting, and "critique structures/pressures, not people" framing.
  Crisis-safe policy never disciplines distress.
- **09 SEO / discoverability** — descriptive `<title>` and meta descriptions per project,
  meaningful headings, internal links (esp. the final-archive category map).
- **10 Final release audit** — see below.

## Final release audit (Pass 10)

- Project folders: **100**.
- `node --check` on every `script.js`: **100/100 pass**.
- Disclaimer present on every project: **100/100**.
- Internal `../` links across all projects: **all resolve** (no broken Prev/Next or cross-links).
- Homepage `window.__PROJECTS__`: **100 entries, all folder paths exist**.
- `data/projects.json`: valid JSON, 100 entries.
- Theme-toggle `aria-label`: **100/100**.
- Escaped-tag leaks / invalid nested `<p>`: **0**.
- Internal codename in repo: **0 occurrences**.
- `LICENSE`, `README.md`, `.nojekyll` present; `.gitattributes` normalizes line endings.

## Final report

1. **Project pages checked:** 100 (001–100).
2. **Files updated:** all 100 `index.html` and `script.js`; several per-project `style.css`
   (e.g. Benatar asymmetry table, comparison table, game canvases); plus `README.md`,
   `.gitattributes`, `review-log.md`.
3. **Major improvements:** every project became a real interactive tool; fixed real bugs
   (escaped `<em>`, dead sliders in 069, restart-loop bug in 067, misleading game controls,
   invalid nested `<p>` in FAQs); added keyboard accessibility to quizzes/flip-cards/games;
   added saved high scores and restart/replay to games; added disclaimers where missing;
   handled sensitive topics with care.
4. **Remaining for manual review:** the homepage card descriptions are the original short
   blurbs (accurate, but could be richened); no automated screen-reader testing was done;
   real-device touch testing on the canvas games is recommended.
5. **Git:** ~25 commits, one batch of ~5 projects each, on `main`.
6. **Publishing:** GitHub Pages, branch `main`, `/ (root)`, `.nojekyll` present.
7. **Public URL:** https://theunbornlabs.github.io/ancf-digital-projects/

## Deepening pass — batch 001–010 (2026-06-29)

A focused "deepen content + interactivity" pass over the first ten projects,
building on the completed passes 01–10. Each change preserves the ethics rules,
accessibility patterns, disclaimers, and local-only data handling.

- **001 Antinatalism Intro Guide** — added a four-card visual of Benatar's
  asymmetry (with a fair critic's reply); panels renumbered 1–8.
- **002 Childfree Life Intro Guide** — added a balanced "Thinking it through"
  decision panel; the sources-of-meaning inventory now exports a copyable summary.
- **003 Pronatalism Pressure Detector** — added a "curiosity / pressure / coercion"
  distinction panel; detector now offers "copy the calm replies" and a clear button.
- **004 Parenthood Assumption Quiz** — added an "assumptions in everyday phrases"
  reference; quiz now shows a live answered-progress bar.
- **005 "Is This My Choice?"** — added an "is it mine, or inherited?" panel, two new
  reflection prompts (now six), and a writing-progress indicator.
- **006 Reproductive Autonomy Explainer** — added a key-terms glossary and an
  interactive free-choice self-check with progress and reflective feedback.
- **007 Consent & Birth Philosophy** — added a "three senses of consent" panel;
  premise-checker now has "copy my position" and reset.
- **008 Suffering-Risk Thought Experiment** — added a visual fill to the risk slider
  and a "key distinctions" panel (risk/uncertainty, harm/wrong, precaution/paralysis).
- **009 Adoption vs Birth Ethics** — added an interactive "what weighs on you?"
  considerations checklist with copyable priorities (its first non-textarea tool).
- **010 "No Means No" Boundary Tool** — added two new situations (comparison, in
  public) and a caring "when it's more than pressure" safety panel with support signposting.

**Verification:** all 10 `index.html` and the 9 edited `script.js` confirmed
structurally complete and balanced; panel numbering sequential; disclaimers intact
on all 100 projects; Prev/Next/Home links untouched. (Note: the sandbox `node --check`
mount served stale copies of freshly edited files this session, so script validity was
confirmed by direct host inspection instead.)

## Professional UI / shared design-system pass (2026-06-29)

A visual/layout pass driven from the **shared** files so all pages benefit; no project
content was rewritten. See `notes/ui-redesign-brief.md` for the full brief.

- **style.css (rebuilt, classes preserved):** added a rem-based type scale and spacing
  scale; one consistent button system; global `:focus-visible` rings; a `prefers-reduced-
  motion` block; refined cards (uniform height, motion-safe hover-lift, focus styles);
  a hero/stats system; a sticky, blurred toolbar (static under 700px so it never covers
  content on mobile); a muted-teal secondary accent; a multi-column footer; and refreshed
  project-page chrome (`.panel .proj-head .lead .kv .disclaimer .progress .opt` etc.) so
  all 100 project pages inherit the polish.
- **index.html:** stronger hero (headline + subtitle + two CTAs: "Browse projects",
  "Categories"); a computed stats strip; search + filters moved into a sticky toolbar
  (`#browse`); structured footer (brand / Explore / About / Source incl. GitHub link);
  added `aria-label` to the theme toggle.
- **home.js:** computes and renders the stats strip (project count, category count,
  static/offline, ads/trackers) from `window.__PROJECTS__`; card rendering and filters
  unchanged (cards were already whole-card `<a>` links — good for a11y).

**Constraints honoured:** no build step, no frameworks, no external font/CDN requests
(kept `system-ui`), dark mode preserved and extended, GitHub Pages compatible.

**Verification:** `home.js` re-read and confirmed valid/balanced; an inline preview of the
new homepage (light + dark) was rendered for sign-off. node/git verification via the
sandbox bash mount was unreliable this session (stale cache), so JS/HTML integrity was
checked by direct host inspection.

## Deep interactive rebuild — projects 001–010 (2026-06-29)

A full, system-first rebuild of the first ten projects to a richer educational standard.
Each project now follows a consistent template: educator intro, "What you will learn",
≥1 interactive tool, ≥1 visual (SVG bar/radar chart, meter, matrix, or flowchart), a quiz
or scenario with explanations, a saved reflection, a copy/export summary, a key-takeaway
box, related-project links, and the standard disclaimer.

- **New shared toolkit `ancf-ui.js`** (vanilla, dependency-free; `node --check` passes):
  namespaced localStorage (get/set/JSON/remove), clipboard with fallback + transient button
  label, `meter()`, `barChart()` and `radar()` SVG renderers, and a keyboard-accessible
  `initOptions()` quiz helper. Loaded via `<script src="../../ancf-ui.js">` in all ten pages.
- **Shared CSS components** added to `style.css`: `.learn`, `.takeaway`, `.related`,
  `.meter`/`.meter-card`, `.slider-row`, bar/radar chart classes, interactive `.matrix`,
  `.decision`, and argument-map node styles — all themed for light/dark and motion-safe.
- **001** argument-map SVG, tap-to-reveal asymmetry matrix, suffering-risk slider+meter,
  self-understanding radar, quiz, export summary.
- **002** 8-domain balance radar, myth/reality flip cards, values checklist, life-statement
  generator, quiz.
- **003** six-source pressure self-assessment → severity meter + source bar chart +
  score-based response + boundary-line generator.
- **004** spot-the-assumption quiz, assumption-type bar chart, "where did it come from?" tracker.
- **005** pressure-vs-desire bar chart, autonomy meter, internal/external voice tool,
  clarity checklist, scenario, copyable clarity report.
- **006** principle cards, scenario simulator (respected/violated), rights checklist,
  autonomy-safe response generator.
- **007** consent logic flowchart (SVG), ethical-tension radar, objection explorer, glossary, quiz.
- **008** four-factor risk simulator, outcome bar chart, risk/benefit tension meter,
  thought-experiment cards, with a prominent "reflection, not prediction" warning.
- **009** five-path comparison matrix, existing-need bar chart, care-priority reflection tree,
  resource-allocation chart, non-judgmental disclaimer.
- **010** tone-based boundary script generator (WhatsApp-ready), emotional-blackmail detector
  with intensity meter, five-rung escalation ladder, saved custom line, quiz.

**Constraints honoured:** static HTML/CSS/JS only; no backend, no paid APIs, no tracking,
no external chart libraries (all charts are vanilla SVG); GitHub Pages compatible; mobile-
first; keyboard-accessible controls with focus states; chart captions/aria-labels provided.

**Verification:** `ancf-ui.js` passes `node --check`; each project `index.html`/`script.js`
written against the shared toolkit and confirmed by host inspection. The sandbox bash mount
again served stale copies of edited files, so per-file `node --check` on the edited project
scripts could not be run there; integrity was checked by direct reads. Recommended manual
pass after deploy: open 001–010, check the browser console, and test save/copy/clear at ~360px.

## Deep interactive rebuild — projects 011–020 (2026-06-29)

Same standard and shared toolkit (`ancf-ui.js` + shared components) extended to the second
batch — calculators, tools, and planners. Each page has the educator intro, "What you will
learn", an interactive tool, a visual (SVG bar chart / meter / progress), a quiz with
explanations, a saved reflection or export, a key-takeaway, related links, and disclaimers.

- **011 Childfree Budget Calculator** — editable per-category monthly inputs → live
  month/year/18-year totals, category bar chart, and an optional compound-growth projection.
- **012 Parenthood Cost Estimator** — editable annual cost per life phase → totals, per-month
  figure, and a per-phase bar chart. Neutral framing.
- **013 Time Freedom Calculator** — weekly-hours sliders → discretionary-time meter, annual
  hours, and a where-the-week-goes bar chart (incl. caregiving).
- **014 Sleep Loss Simulator** — nightly shortfall × months → cumulative debt in hours/nights/
  days and a milestone bar chart, with a clear "not medical advice" frame.
- **015 Life Goals Priority Mapper** — add goals and sort across Now/Soon/Someday (move/remove),
  a per-horizon count chart, and copy/export. (XSS-safe DOM rendering of user text.)
- **016 Personal Peace Checklist** — before/during/after checklist → progress meter, copyable plan.
- **017 Pressure From Parents Response Generator** — situation + warmth↔firmness slider →
  generated reply with a warmth/firmness bar chart; editable, savable, copyable.
- **018 Marriage & Children Conversation Tool** — you/partner leanings across 7 topics →
  alignment bar chart (aligned/unsure/differ) + readiness meter + talking-points export.
- **019 Childfree Couple Planning Board** — six life-area textareas → completion meter and a
  words-per-area chart; copy/export the board.
- **020 Retirement Without Children Planner** — age/savings/contribution/return inputs →
  projected pot (FV of savings + contributions), growth-over-time bar chart, optional
  target meter, plus a "beyond money" planning panel. Clear "not financial advice" frame.

**Constraints honoured:** static HTML/CSS/JS only; no backend, no paid APIs, no tracking, no
external chart libs (vanilla SVG); GitHub Pages compatible; mobile-first; keyboard-accessible;
all displayed numbers rounded; chart captions/aria-labels present.

**Verification:** built against the shared toolkit (`ancf-ui.js`, which passes `node --check`)
and confirmed by host inspection. The sandbox bash mount continued to serve stale copies of
edited files, so per-file `node --check` on the edited project scripts could not run there.
Recommended manual pass after deploy: open 011–020, check the console, and test inputs/save/
copy at ~360px.

