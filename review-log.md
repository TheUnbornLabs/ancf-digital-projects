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
