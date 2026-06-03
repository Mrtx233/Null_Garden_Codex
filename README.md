# Null Garden

A personal blog by **LV MA** for long-term notes about technical learning, AI tools, project practice, product thinking, and personal observations.

The site is built as a lightweight Astro static blog with Markdown content, Astro Content Collections, and native CSS. The visual style is "Quiet Tech Minimalism" — clean, distraction-free, with dark/light theme support.

**Live site:** [null-garden.netlify.app](https://null-garden.netlify.app)

---

## Features

- **Static Site Generation (SSG)** — All pages pre-rendered to pure HTML at build time, no server-side runtime required.
- **Three content types** — Blog posts, project introductions, and development manuals, all managed via Markdown files.
- **Dark / Light theme** — Toggle via the button in the header; preference saved to `localStorage`.
- **Sticky navigation bar** — Full-width frosted-glass header that stays fixed while scrolling.
- **Code block copy button** — Hover over any code block to reveal a one-click copy button.
- **Auto-generated TOC** — Article detail pages show a table of contents extracted from headings in the left sidebar.
- **Smart ordering** — File names start with numbers (e.g. `01_xxx.md`) to control display order; the system auto-generates labels like "第 01 篇".
- **Draft mode** — Set `draft: true` in frontmatter to hide a post from all listing pages and routes.
- **Development manual series** — Subfolders under `md/Development-Manual/` are automatically grouped into series (e.g. Django plan, FastAPI plan).
- **Responsive layout** — Full-width container (up to 1760px) with mobile-friendly breakpoints.
- **Zero frontend framework** — No React, Vue, or CSS framework. Pure Astro + native CSS with CSS variables.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro 6 |
| Language | TypeScript |
| Content | Markdown + Astro Content Collections |
| Styling | Native CSS (CSS variables, no preprocessor) |
| Deployment | Netlify (static hosting) |
| Dependencies | 3 packages only: `astro`, `typescript`, `@astrojs/check` |

---

## Project Structure

```
Null_Garden/
├── astro.config.mjs          # Astro config (site URL)
├── netlify.toml               # Netlify build settings
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript config
├── md/                        # All Markdown content (the single source of truth)
│   ├── *.md                   # Blog posts
│   ├── projects/              # Project introductions
│   └── Development-Manual/    # Development manuals (grouped by subfolder)
├── src/
│   ├── content.config.ts      # Content collection definitions & schemas
│   ├── layouts/
│   │   └── BaseLayout.astro   # Global layout (header, footer, theme toggle, copy button)
│   ├── pages/
│   │   ├── index.astro        # Homepage
│   │   ├── about.astro        # About page
│   │   ├── blog/
│   │   │   ├── index.astro    # Blog listing page
│   │   │   └── [...slug].astro  # Blog article detail
│   │   ├── projects/
│   │   │   ├── index.astro    # Projects listing page
│   │   │   └── [...slug].astro  # Project detail
│   │   └── development-manual/
│   │       ├── index.astro    # Manuals listing page
│   │       └── [...slug].astro  # Manual detail
│   ├── styles/
│   │   └── global.css         # All site styles (theme variables, layout, components)
│   └── utils/
│       ├── blog.ts            # Blog sorting, title/description extraction
│       ├── projects.ts        # Project sorting & helpers
│       └── developmentManual.ts  # Manual grouping, series detection, ordering
├── dist/                      # Build output (static HTML)
└── docs/                      # AI collaboration logs
```

---

## Local Development

Requires **Node.js 18+**. Works on macOS, Windows, and Linux.

```bash
# Clone the repository
git clone https://github.com/Mrtx233/Null_Garden_Codex.git
cd Null_Garden_Codex

# Install dependencies
npm install

# Start local dev server (default: http://localhost:4321/)
npm run dev
```

### Linux Setup

```bash
# Ubuntu / Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# CentOS / RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Then proceed as usual
npm install
npm run dev
```

---

## Build & Preview

```bash
# Production build (type check + generate static HTML to dist/)
npm run build

# Preview the production build locally
npm run preview
```

---

## Deployment

### Netlify

This project is ready for Netlify static deployment. Connect the GitHub repo and Netlify will auto-detect the settings from `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

### Other Static Hosts

The `dist/` folder after `npm run build` contains pure static HTML, CSS, and assets. It can be served by any static file host: Nginx, Cloudflare Pages, Vercel, GitHub Pages, etc.

---

## Content Management

All content lives in the `md/` folder. Astro reads these files at build time via Content Collections.

### Add a Blog Post

Create a Markdown file in `md/`:

```
md/08my-new-post.md
```

```md
---
title: "My New Post"
description: "A short description for SEO and article lists."
pubDate: 2026-06-03
tags:
  - Python
  - Notes
draft: false
---

# My New Post

Article content here...
```

The number prefix (`08`) controls display order. Set `draft: true` to hide from all pages.

### Add a Project Intro

Create a Markdown file in `md/projects/`:

```
md/projects/06-my-project.md
```

```md
---
title: "My Project"
description: "A short project summary."
githubUrl: "https://github.com/..."
stack:
  - Python
  - FastAPI
draft: false
---

# My Project

Project introduction here...
```

### Add a Development Manual

Create a subfolder under `md/Development-Manual/` (folder name = series name), then add numbered Markdown files:

```
md/Development-Manual/我的新系列/
├── 00_总览.md
├── 01_第一阶段.md
├── 02_第二阶段.md
└── 03_第三阶段.md
```

```md
---
title: "第一阶段：基础搭建"
description: "本阶段完成项目初始化和基础配置。"
tags:
  - Python
draft: false
---

Content here...
```

The subfolder is automatically detected as a new series. File names with numbers control the stage order.

---

## Style Customization

All styles are in `src/styles/global.css`. Key sections:

- **Theme variables** — `:root` (dark mode) and `:root[data-theme="light"]` (light mode) define all colors, shadows, and fonts as CSS variables.
- **Base font size** — `html { font-size: 18px }` controls the global scale; all `rem` units scale proportionally.
- **Layout width** — `.site-main`, `.site-header`, `.site-footer` use `min(100% - 3rem, 1760px)`.
- **Article title** — `.article-header h1` controls the article detail page title size.
- **Code blocks** — `.content pre` and `.copy-btn` for code block styling and copy button.

---

## AI Collaboration

This project follows an AI-assisted development workflow documented in `ai-dev-rules.md`. Every AI-assisted change is logged to:

- `docs/ai-dev-log.md` — Human-readable change log
- `docs/data/fileChangeLog.ts` — Structured change records

---

## License

Personal project. All rights reserved.
