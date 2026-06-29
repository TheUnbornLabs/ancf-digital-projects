# ANCF Digital Projects

**100 Antinatalism & Childfree Tools, Games, Guides, and Reflection Projects**

An open, ad-free, tracking-free static website collecting 100 small, self-contained projects that explore antinatalism and childfree life as ethical, philosophical, personal, and social positions.

## Mission

To present antinatalism and childfree life respectfully and rationally — as rights-based, educational, and reflective positions. Every project supports reproductive autonomy and treats children, parents, women, men, families, religions, castes, ethnic groups, people in poverty, disabled people, and LGBTQ+ people with dignity. There is no hate speech, no harassment, and no encouragement of self-harm.

## Features

- Static site: only HTML, CSS, JavaScript, JSON (and Markdown docs). No backend, no login, no ads, no tracking.
- Searchable, filterable gallery of all 100 projects on the homepage.
- Ten categories: Philosophy, Childfree Life, Ethics, Society, Comics, Games, Calculators, Learning Tools, Writing Tools, Community Tools.
- Dark-mode toggle (remembers your choice on your device).
- Mobile-first, responsive layout that works on Android Chrome and desktop.
- Each project has a working interactive feature (quizzes, calculators with visible formulas, generators with copy-to-clipboard, lightweight games, collapsible guides, checklists, and more).
- All user input stays in the browser (localStorage) — nothing is uploaded.

## Folder structure

```
ancf-digital-projects/
├── index.html          # homepage (gallery, search, filters, dark mode)
├── style.css           # shared design system
├── home.js             # homepage logic
├── script.js           # shared per-page script (theme)
├── data/projects.json  # machine-readable index of all 100 projects
├── README.md
├── LICENSE
├── 404.html
└── projects/
    ├── 001-antinatalism-intro-guide/
    │   ├── index.html
    │   ├── style.css
    │   ├── script.js
    │   └── README.md
    ├── 002-childfree-life-intro-guide/
    │   └── ...
    └── 100-ancf-digital-projects-final-archive/
```

## Run locally

Because it is a pure static site, you can open `index.html` directly, but a tiny local server avoids
any browser file-path quirks:

```bash
# Python 3
cd ancf-digital-projects
python3 -m http.server 8000
# then open http://localhost:8000
```

## Publish with GitHub Pages

1. Create a repository named `ancf-digital-projects` on GitHub.
2. Push this folder's contents to the `main` branch (see commands below).
3. In the repository: **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**.
5. Set **Branch** to `main` and folder to `/ (root)`, then **Save**.
6. Wait a minute; your site appears at:
   `https://YOUR-USERNAME.github.io/ancf-digital-projects/`

```bash
git init
git add .
git commit -m "ANCF Digital Projects: 100 projects, homepage, and docs"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ancf-digital-projects.git
git push -u origin main
```

## Add a new project

1. Create a folder `projects/NNN-your-slug/` with `index.html`, `style.css`, `script.js`, `README.md`.
2. Reuse the shared styles by linking `../../style.css` and `../../script.js` in your `index.html`.
3. Add an entry to `data/projects.json` and to the `window.__PROJECTS__` array embedded in `index.html`
   so the homepage gallery, search, and filters include it.
4. Wire the Previous/Next links to the neighbouring project folders.

## Ethical content policy

This project presents antinatalism and childfree life as rational, educational, rights-based, and
non-hateful positions. It is respectful toward children, parents, women, men, families, religions,
castes, ethnic groups, people in poverty, disabled people, and LGBTQ+ people, and it supports
reproductive autonomy. It contains **no** suicide or self-harm encouragement, harassment,
dehumanising language, hate speech, abuse, fake sources, or medical/legal/financial claims without
disclaimers. Debate targets ideas, never people.

## Disclaimer

> This project is for education and reflection only. It is not medical, legal, financial, or mental health advice.

## License

Released under the MIT License. See [LICENSE](LICENSE).
