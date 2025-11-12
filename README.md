# Technical Portfolio — Pro (Interactive SPA, no build step)

A detailed, interactive portfolio you can deploy with **GitHub Pages**.  
Single-page app (hash-based routing) with tabs for **Experience, Projects, Education, Contact** and more.

## Highlights
- Hash routing with accessible **Tabs** (`#experience`, `#projects`, `#education`, `#contact`)
- **Theme switcher** (dark/light, remembers preference)
- **Project explorer**: search, tag filters, sort, favorites (localStorage), quick-links
- **Modals** for project case studies + keyboard shortcuts (`/` to search, `?` for help)
- **Experience timeline** with filters and expandable entries
- **Education** section with transcript/coursework accordion
- **Contact** section with mailto form + copy-to-clipboard
- **Print-friendly Resume** route (`#resume`) for exporting to PDF
- **ARIA-friendly** components: focus traps, skip-links, reduced motion respect

## Quick start
1. Create a GitHub repo and add these files (or unzip and `git push`).
2. Enable **Pages** with **GitHub Actions** in **Settings → Pages**.
3. Edit data in `/data/*.json` and images in `/assets`.

## Customize
- Update metadata and your name in `index.html`.
- Add projects in `data/projects.json` (schema documented inside).
- Edit roles in `data/experience.json` and schools in `data/education.json`.
- Replace assets: `profile.jpg`, `favicon.ico`, thumbnails.

## Keyboard Shortcuts
- `/` focus search (Projects tab)
- `?` open help
- `g` then `e/p/d/c/h` to jump (go Experience/Projects/Education/Contact/Home)

## License
MIT © You
