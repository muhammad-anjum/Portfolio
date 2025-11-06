# Technical Portfolio — Starter (Static HTML/CSS/JS)

A minimal, responsive technical portfolio site you can deploy with **GitHub Pages**.  
No build tools required.

## Features
- Responsive layout with semantic HTML
- Light/Dark theme (respects system + toggle)
- Projects loaded from `projects.json`
- Accessible navigation and skip-to-content
- Social meta tags for clean sharing cards
- GitHub Actions workflow for one-click deploy to Pages

## Quick start
1. Click **Use this template** (or download and push) into a **new GitHub repo**.
2. Push the code to your repo's **main** branch.
3. In your repo: **Settings → Pages → Build and deployment**: set **Source** to **GitHub Actions**.
4. Edit `index.html`, `projects.json`, and images in `/assets` to make it yours.

## Local preview
Just open `index.html` in your browser or serve locally:
```bash
# Python 3
python -m http.server 8000
# or
npx serve .
```

## Customize
- Replace `"Your Name"` and meta tags in `index.html`.
- Add projects to `projects.json` (fields documented inside).
- Drop thumbnails into `/assets` and reference them in `projects.json`.
- Tweak colors and spacing in `css/styles.css`.

## License
MIT © You
