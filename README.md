# muhammadanjum.com

Engineering portfolio for Muhammad Anjum. Plain HTML, one CSS file and two small scripts, built from a few source files by a zero-dependency Node script. The repository root is the published site (GitHub Pages).

## Publish

```bash
node tools/build.mjs      # regenerates every page and sitemap.xml from src/
git add -A && git commit -m "Update site" && git push
```

The generated `.html` files at the repo root are committed, so GitHub Pages needs no build step. **Edit `src/`, not the generated pages**; the next build overwrites them. Node 18+ is the only requirement.

## Layout

```
src/
  data/site.json          Name, contact links, navigation
  data/projects.json      One entry per case study (cards, facts, key figures)
  data/experience.json    One entry per role (summary, bullets, results, tags)
  pages/*.html            Home, Work, Experience, About, 404 (front matter + body)
  projects/<slug>.html    Case-study bodies
  experience/<slug>.html  Body of a dedicated role page (entries with "page": true)
tools/
  build.mjs               Page builder (layout, lists, image macros, sitemap)
  images.mjs              Makes responsive image sizes and assets/media/manifest.json
assets/
  css/site.css            The whole design system (tokens at the top)
  js/site.js              Header, menu, reveals, case-study index, lightbox
  js/hero.js              Home hero visual (canvas)
  media/                  Images, icons, Open Graph card
```

## Add a project

1. Put images in `assets/media/projects/<project>/` (WebP or JPG, up to about 1800 px wide), then run `node tools/images.mjs`.
2. Add an entry to `src/data/projects.json` (copy an existing one: `slug`, `title`, `summary`, `lede`, `image`, `tags`, `figures`, `stats`, `facts`, `next`). Point the previous project's `next` at the new slug if you want it in the reading order.
3. Create `src/projects/<slug>.html`. A case study is a list of sections:

   ```html
   <section class="case-sec" id="requirements" data-label="Requirements">
     <h2>A claim, not a topic.</h2>
     <div class="prose"><p>…</p></div>
     <div class="calc" style="--n:3"><div><strong>352.8 V</strong><span>maximum pack voltage</span></div>…</div>
     <div class="sec-media row">
       {{fig "folder/image" alt="What the picture shows" cap="What it proves." sizes="(min-width: 1080px) 440px, 100vw"}}
     </div>
   </section>
   ```

   Section numbers and the "On this page" index are generated from `id` and `data-label`. Useful building blocks, all styled already: `.prose`, `.calc` (key numbers), `.principles`, `.flow` (process steps), `.table-wrap > table`, `.callout`, `.result`, `.case-split` (text beside a figure), `.sec-media row` (figures in one justified row, no cropping), `cls="plate"` on a figure for CAD and diagrams on white. Figures number themselves.
4. `node tools/build.mjs`. The project appears on Work, in the footer and in the sitemap.

## Add or expand a role

Roles live in `src/data/experience.json`. Each one shows on the Experience page with its summary, results and a "Responsibilities and ownership" drawer.

- `group` is `Professional`, `Research` or `Leadership`. `start` and `end` (`"YYYY-MM"` or `"present"`) set the order: current roles first, newest start first, then finished roles by end date. A role with `"start": null` sorts last among the current ones, so adding its start date moves it automatically.
- `links` adds external links to the card and the role page (the SDSU research entry links to the lab website).
- To give a role its own page, set `"page": true`, optionally add `"image"`/`"imageAlt"`, and create `src/experience/<slug>.html`. Use `the-thermal-club.html` as the short template, `sdsu-research.html` for a record that fills in over time, and `aztec-electric-racing.html` as the long one. Helper tags: `{{block ownership <slug>}}`, `{{block results <slug>}}`, `{{block role-projects <slug>}}`, `{{project <slug> title}}`, `{{figures <slug>}}`, `{{resume}}`.
- Skills live in `src/data/site.json` and render on Home and About with `{{block skills}}`.

## Résumé

`Muhammad-Anjum-Resume.pdf` at the repo root is the only résumé. Every button points at that filename, so replacing the file in place updates the whole site. Don't add dated copies next to it; they would be publicly reachable.

## Design system

- **Light only.** Paper `#f2ecdf`, ink `#15130f`, gold (`--gold-bright`, `--gold-deep`) and a petrol-teal counterweight (`--petrol`) used for the hero stage, key-number plates and result cards. All tokens are at the top of `site.css`.
- **Type.** System fonts, nothing to download: an old-style serif for headlines, system sans for text, system mono for labels.
- **Header.** The name is set as a wordmark (roman first name, italic gold surname, one signature stroke drawn under it). Navigation is a raised capsule whose thumb follows hover and focus, rests on the current page, and glides in from the previous page's position (`nav-thumb` in `site.js`). On phones it becomes a full-screen sheet with a staggered entrance.
- **One motion system.** One easing (`--ease`) and three durations (`--t-fast`, `--t-med`, `--t-slow`). Sections fade up once as they enter (`data-reveal`), the hero enters once on load (`.enter`), pages cross-fade through the View Transitions API where supported, and hover states are small lifts and drawn underlines. Under `prefers-reduced-motion` everything is static and the hero renders one settled frame.
- **Hero.** `hero.js` simulates potential flow around a hex-packed cell array on two canvases. It pauses off-screen and in background tabs, and caps pixel density.

## Notes

- Images ship as the original WebP plus 640 px and 1100 px JPEG variants for wide sources; pages use `srcset`/`sizes`, and everything below the first screen is lazy-loaded.
- `404.html` uses root-relative paths because GitHub Pages serves it from any URL depth.
- `CONTENT-TODO.md` lists facts and material that are not on the site yet.
