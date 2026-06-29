# Project Review Log

A record of the multi-pass review-and-improvement work across the 100 ANCF Digital
Projects. Each project is rebuilt from a thin paragraph page into a real, distinct
mini-tool / guide / quiz / generator, then hardened through focused review passes.

> Note: an internal working codename is deliberately **not** recorded in this repo,
> per the project's standing rule that it must never appear in any file.

## Deep rebuild (passes 01–06 combined, per project, in order 001→100)

Each project's rebuild applies, together:
- **01 Philosopher** — clearer definitions (consent, suffering, autonomy, risk, dignity);
  steelmanned objections; respect for disagreement; no insults to parents/children/families.
- **02 Author/editor** — stronger openings, tighter paragraphs, memorable closings, grammar.
- **03 Engineer** — working JS (`node --check` on every script), no console errors, correct
  relative links, defensive `try/catch`, fallbacks (e.g. clipboard).
- **04 UX/mobile** — responsive layout, large tap targets, clear hierarchy, dark-mode contrast.
- **05 Accessibility** — real `<label>`s, keyboard-operable custom controls (role/tabindex/
  Enter-Space, aria-pressed), `aria-live` regions, theme-toggle `aria-label`.
- **06 Teacher** — "what this means" framing, beginner definitions, examples, reflection
  questions, mini quizzes, key takeaways, next-project links.

### Progress
- 001–025: complete and pushed.
- 026–100: in progress.

## Dedicated repo-wide passes (run after the deep build)

- **05 Accessibility sweep** — pending
- **07 Ethical engagement** — copy-this-thought buttons, shareable lines, related links
  (no manipulative/clickbait tactics) — folded into the deep build; final check pending
- **08 Safety / moderation sweep** — pending
- **09 SEO / discoverability** — meta descriptions, titles, internal links, `sitemap.html`,
  `projects.json` descriptions — pending
- **10 Final release** — broken-link & structure audit, README, LICENSE, project-count,
  homepage polish, release notes — pending
