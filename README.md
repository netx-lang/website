# NetX — Website & Documentation

The bilingual (English / 中文) website and language documentation for **NetX**, a
schematic programming language for hardware design.

Built with [Astro](https://astro.build). The site is fully static and the documentation
is authored in **Markdown**.

## Commands

```bash
npm install
npm run dev        # local dev server
npm run build      # build to dist/
npm run preview    # preview the build
npm run check:i18n # check that zh/ still mirrors en/
```

## Structure

```
.
├── astro.config.mjs        # i18n + Shiki (NetX/ANTLR grammars, custom theme)
├── public/assets/          # square logos, figures, paper PDF
├── src/
│   ├── i18n/ui.ts          # UI strings for both languages
│   ├── shiki/              # TextMate grammars + light theme
│   ├── content/docs/
│   │   ├── en/*.md         # ← the documentation source of truth
│   │   └── zh/*.md         # Chinese translations
│   ├── components/         # Header, Footer, Landing, CodeBlock, …
│   ├── layouts/            # BaseLayout (landing), DocsLayout (spec)
│   ├── pages/              # routes (see below)
│   ├── scripts/main.js     # tabs, mobile nav, reveal (highlighting is at build time)
│   └── styles/             # landing.css, docs.css
└── tools/
    ├── make-logos.py       # regenerates the square logo assets
    └── check-translations.mjs
```

## Routes

| Path                | Page                     |
| ------------------- | ------------------------ |
| `/`                 | English landing page     |
| `/zh/`              | Chinese landing page     |
| `/docs/`            | English documentation    |
| `/docs/<slug>/`     | English specification    |
| `/zh/docs/`         | Chinese documentation    |
| `/zh/docs/<slug>/`  | Chinese specification    |

## Documentation workflow

The **English Markdown under `src/content/docs/en/` is the single source of truth** (the
LaTeX sources have been retired). To revise the documentation:

1. Edit `src/content/docs/en/<slug>.md`.
2. Update the matching `src/content/docs/zh/<slug>.md` translation.
3. Run `npm run check:i18n` to confirm the two files are still structurally aligned
   (heading count, code blocks, table rows, and section order).
4. `npm run build`.

Each file starts with front matter:

```yaml
---
title: Lexical Structure
order: 1
---
```

## Syntax highlighting

Highlighting is done at build time with Shiki, using:

- `src/shiki/netx.tmLanguage.json` — the NetX TextMate grammar (from the VS Code
  extension), used for ```` ```netx ```` blocks and the landing-page examples.
- `src/shiki/antlr.tmLanguage.json` — an ANTLR grammar for ```` ```antlr ```` blocks.
- `src/shiki/netx-light.tmTheme.json` — a light theme matching the site palette.

`nxon` fences are highlighted as JSON. Inline `code` spans are highlighted with
the NetX grammar by `src/markdown/rehype-inline-netx.mjs`, and math written as
`$...$` / `$$...$$` is rendered with KaTeX (configured in `astro.config.mjs` via
the `unified()` processor).

## Typography

Body text uses **Noto Sans** (Latin) with **Noto Serif SC** (CJK), and code uses
**JetBrains Mono** with programming ligatures enabled — so `<>`, `->`, and `||`
render as connected glyphs. Fonts are loaded from Google Fonts in
`src/components/HeadFonts.astro`.

## Logos

`public/assets/logo.svg` and `public/assets/logo-mark.svg` are square; regenerate them
from the preserved master with `python3 tools/make-logos.py`.

## Deploying

`npm run build` emits a static site in `dist/`. Host it anywhere (GitHub Pages, Netlify,
Cloudflare Pages, …).
