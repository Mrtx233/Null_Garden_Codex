# Null Garden

Null Garden is a personal blog by LV MA for long-term notes about technical learning, AI tools, project practice, product thinking, and personal observations.

The site is built as a small Astro static blog, with Markdown posts managed through Astro Content Collections and native CSS for the Quiet Tech Minimalism visual style.

## Tech Stack

- Astro
- TypeScript
- Markdown
- Astro Content Collections
- Native CSS

## Local Development

Install dependencies first:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Astro will print the local URL in the terminal, usually `http://localhost:4321/`.

## Build

Run the production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Netlify

This project is ready for Netlify static deployment.

Use these Netlify build settings:

```text
Build command: npm run build
Publish directory: dist
```

The same settings are also stored in `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

## Add a Blog Post

Create a new Markdown file in `src/content/blog/`, for example:

```text
src/content/blog/my-first-note.md
```

Use this frontmatter format:

```md
---
title: "My First Note"
description: "A short description for SEO and article lists."
pubDate: 2026-05-21
tags:
  - Astro
  - Notes
draft: false
---

Write the article body here.
```

Set `draft: true` to keep a post out of the homepage, blog list, and generated article routes.
