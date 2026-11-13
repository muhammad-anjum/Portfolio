// Static page builder. No dependencies. Run: node tools/build.mjs
// Reads src/ (page fragments + data) and writes finished HTML to the repo root,
// ready for GitHub Pages. See README.md for how to add projects and roles.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const read = p => readFileSync(join(ROOT, p), "utf8")
const json = p => JSON.parse(read(p))
const site = json("src/data/site.json")
const projects = json("src/data/projects.json")
const experience = json("src/data/experience.json")
const manifest = json("assets/media/manifest.json")
const mtc = json("src/data/mtc.json")
const bySlug = list => Object.fromEntries(list.map(x => [x.slug, x]))
const P = bySlug(projects)
const E = bySlug(experience)

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const attrs = str => Object.fromEntries([...str.matchAll(/(\w+)="([^"]*)"/g)].map(m => [m[1], m[2]]))
const arrow = '<span class="arr" aria-hidden="true">↗</span>'

/* ---------- Images ---------- */
function imageTag(root, key, { alt = "", sizes = "(min-width: 1080px) 880px, 100vw", loading = "lazy", priority = false } = {}) {
  const m = manifest[key]
  if (!m) throw new Error(`Unknown image: ${key}`)
  const base = `${root}assets/media/projects/`
  const ext = m.ext || "webp"
  const srcset = [...m.variants.map(v => `${base}${v.file} ${v.width}w`), `${base}${key}.${ext} ${m.w}w`].join(", ")
  const load = priority ? 'loading="eager" fetchpriority="high"' : `loading="${loading}"`
  const fallback = m.variants.length > 1 ? `${base}${m.variants[1].file}` : `${base}${key}.${ext}`
  const img = `<img src="${ext === "jpg" ? fallback : `${base}${key}.webp`}" srcset="${srcset}" sizes="${sizes}" width="${m.w}" height="${m.h}" alt="${esc(alt)}" ${load} decoding="async">`
  if (!m.avif) return img
  const avifSet = m.avif.map(v => `${base}${v.file} ${v.width}w`).join(", ")
  return `<picture><source type="image/avif" srcset="${avifSet}" sizes="${sizes}">${img}</picture>`
}

/* Largest delivered file for a key, used by the lightbox and social cards */
const fullFile = key => `assets/media/projects/${key}.${manifest[key].ext || "webp"}`

function figure(root, key, a) {
  const m = manifest[key]
  const ar = (m.w / m.h).toFixed(3)
  const cls = ["fig", a.cls].filter(Boolean).join(" ")
  const zoom = `${root}${fullFile(key)}`
  const step = a.step ? `<span class="step"><b>${esc(a.step.split("|")[0])}</b>${esc(a.step.split("|")[1] || "")}</span>` : ""
  return `<figure class="${cls}" style="--ar:${ar}">${step}<button class="fig-btn" type="button" data-zoom="${zoom}" aria-label="Enlarge figure: ${esc(a.alt)}">${imageTag(root, key, { alt: a.alt, sizes: a.sizes })}</button><figcaption>${a.cap || ""}</figcaption></figure>`
}

/* ---------- Data-driven blocks ---------- */
const roleLine = e => e.roles.map(r => `<p class="role-title">${esc(r.title)}<small>${esc(r.period)}</small></p>`).join("")

function figuresBlock(list) {
  return list.length ? `<div class="figures">${list.map(([v, l]) => `<div><strong>${esc(v)}</strong><span>${esc(l)}</span></div>`).join("")}</div>` : ""
}

function projectsIndex(root) {
  return projects.map((p, i) => {
    const num = String(i + 1).padStart(2, "0")
    const media = p.image
      ? `<a class="mount ${p.imageFit === "plate" ? "plate" : ""}" href="${root}projects/${p.slug}.html" tabindex="-1" aria-hidden="true"><div class="frame" style="aspect-ratio:${(manifest[p.image].w / manifest[p.image].h).toFixed(3)}">${imageTag(root, p.image, { alt: "", sizes: "(min-width: 900px) 58vw, 100vw" })}</div></a>`
      : `<div class="panel project-text" style="padding:clamp(26px,3vw,44px);display:grid;gap:20px;align-content:center"><p class="index" aria-hidden="true">${num}</p><div class="tags">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div></div>`
    return `<article class="project-item" data-reveal>${media}<div class="work-copy"><h2 class="work-title"><a href="${root}projects/${p.slug}.html">${esc(p.title)}</a></h2><p class="byline">${esc(p.org)} · ${esc(p.period)}</p><p>${esc(p.summary)}</p>${figuresBlock(p.figures)}<p><a class="link" href="${root}projects/${p.slug}.html">Read the case study ${arrow}</a></p></div></article>`
  }).join("\n")
}

function roleCard(root, e) {
  const results = [e.result, ...(e.extraResults || [])]
  const links = []
  if (e.page) links.push(`<a class="link" href="${root}experience/${e.slug}.html">Role in detail ${arrow}</a>`)
  for (const slug of e.projects) links.push(`<a class="link" href="${root}projects/${slug}.html">${esc(P[slug].title)} ${arrow}</a>`)
  for (const l of e.links || []) links.push(`<a class="link" href="${l.href}" target="_blank" rel="noopener">${esc(l.label)} ${arrow}</a>`)
  return `<article class="role panel" id="${e.slug}" data-reveal>
  <div class="role-when"><b>${esc(e.roles[0].period)}</b><span>${esc(e.location)}</span></div>
  <div class="role-main">
    <h3>${esc(e.org)}</h3>
    ${roleLine(e)}
    <p class="role-context">${esc(e.context)}</p>
    <p class="role-sum">${esc(e.summaryCard || e.summary)}</p>
    ${e.cardImage ? `<a class="role-photo" href="${root}experience/${e.slug}.html" tabindex="-1" aria-hidden="true"><span class="mount"><span class="frame" style="aspect-ratio:${(manifest[e.cardImage].w / manifest[e.cardImage].h).toFixed(3)}">${imageTag(root, e.cardImage, { alt: "", sizes: "(min-width: 900px) 440px, 100vw" })}</span></span></a>` : ""}
    <div class="tags">${e.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
    <details><summary>Responsibilities and ownership</summary><ul class="bullets">${e.bullets.map(b => `<li>${esc(b)}</li>`).join("")}</ul></details>
    ${links.length ? `<div class="role-links">${links.join("")}</div>` : ""}
  </div>
  <aside class="role-result" aria-label="Key results">${results.map(r => `<div><strong>${esc(r.value)}</strong><span>${esc(r.label)}</span></div>`).join("")}</aside>
</article>`
}

/* Current roles first (most recent start first, unknown start last), then finished roles by end date. */
const monthKey = v => (v ? Number(v.replace("-", "")) : -1)
const byRecency = (a, b) => {
  const ca = a.end === "present", cb = b.end === "present"
  if (ca !== cb) return ca ? -1 : 1
  return ca ? monthKey(b.start) - monthKey(a.start) : monthKey(b.end) - monthKey(a.end)
}
const sortedRoles = () => [...experience].sort(byRecency)

const GROUPS = [["Professional", "Professional experience"], ["Research", "Research"], ["Leadership", "Leadership"]]

function experienceGroups(root) {
  return GROUPS.map(([group, title]) => {
    const items = sortedRoles().filter(e => e.group === group)
    if (!items.length) return ""
    return `<section class="group" aria-labelledby="g-${group.toLowerCase()}"><div class="group-head"><h2 id="g-${group.toLowerCase()}">${title}</h2></div><div class="roles">${items.map(e => roleCard(root, e)).join("\n")}</div></section>`
  }).join("\n")
}

function experienceMini(root) {
  return `<div class="timeline-mini" data-reveal-group>${sortedRoles().map(e => {
    const href = e.page ? `${root}experience/${e.slug}.html` : `${root}experience.html#${e.slug}`
    return `<a class="tl-row" href="${href}" data-reveal><time>${esc(e.roles[0].period)}</time><h3>${esc(e.org)}</h3><p>${esc(e.roles.map(r => r.title).join(" · "))}</p><span class="arr" aria-hidden="true">↗</span></a>`
  }).join("")}</div>`
}

function skillsBlock() {
  return `<div class="caps" data-reveal-group>${site.skills.map(g => `<div class="cap panel" data-reveal><h3>${esc(g.title)}</h3><ul>${g.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("")}</div>`
}

function ownership(slug) {
  const e = E[slug]
  return `<div class="panel owned"><h3>Responsibilities</h3><ul class="bullets">${e.bullets.map(b => `<li>${esc(b)}</li>`).join("")}</ul></div>`
}

function roleProjects(root, slug) {
  return `<div class="pager" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">${E[slug].projects.map(s => `<a class="panel panel-lift" href="${root}projects/${s}.html" style="text-align:left"><small>${esc(P[s].kind)}</small><strong>${esc(P[s].title)}</strong><span style="color:var(--muted);font-size:.93rem">${esc(P[s].summary)}</span></a>`).join("")}</div>`
}

function resultsStrip(slug) {
  const e = E[slug]
  const items = [e.result, ...(e.extraResults || [])]
  return `<div class="panel scope" style="grid-template-columns:repeat(${items.length},minmax(0,1fr))">${items.map(r => `<div><strong>${esc(r.value)}</strong><span>${esc(r.label)}</span></div>`).join("")}</div>`
}


/* ---------- MTC role page blocks (data in src/data/mtc.json) ---------- */
function mtcPrograms(root) {
  const tabs = mtc.programs.map((p, i) => `<button type="button" role="tab" id="tab-${p.id}" aria-controls="panel-${p.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(p.title)}</button>`).join("")
  const panels = mtc.programs.map(p => {
    const imgs = (p.images || []).map(im => figure(root, im.key, { alt: im.alt, cap: esc(im.cap), sizes: im.sizes, cls: im.cls }))
    const media = imgs.length ? `<div class="sec-media${imgs.length > 1 ? " row" : ""}">${imgs.join("")}</div>` : ""
    return `<div class="tabpanel" role="tabpanel" id="panel-${p.id}" aria-labelledby="tab-${p.id}"><h3>${esc(p.title)}</h3><div class="prose">${p.lead.map(t => `<p>${esc(t)}</p>`).join("")}</div><ul class="bullets">${p.points.map(t => `<li>${esc(t)}</li>`).join("")}</ul>${media}</div>`
  }).join("")
  return `<div class="tabs" data-tabs><div class="tablist" role="tablist" aria-label="Chapter program areas">${tabs}</div>${panels}</div>`
}

function mtcEventMeta(id) {
  const ev = mtc.events.find(x => x.id === id)
  const rows = [["Event", ev.title], ["Date", ev.dateLabel || ev.date], ["Partner", ev.partner], ["Host", "MTC SDSU"], ["Outcome", ev.outcome]].filter(r => r[1])
  return `<dl class="event-meta">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`
}

function mtcEvents(root) {
  const list = mtc.events.filter(x => !x.featured)
  if (!list.length) return ""
  return `<div class="event-list">${list.map(ev => `<article class="panel event-card"><h3>${esc(ev.title)}</h3><p class="byline">${esc([ev.dateLabel || ev.date, ev.category, ev.partner].filter(Boolean).join(" · "))}</p><p>${esc(ev.description)}</p>${ev.role ? `<p><strong>My role.</strong> ${esc(ev.role)}</p>` : ""}${ev.outcome ? `<p><strong>Outcome.</strong> ${esc(ev.outcome)}</p>` : ""}${(ev.images || []).map(k => figure(root, k, { alt: ev.title, cap: "" })).join("")}${ev.link ? `<a class="link" href="${esc(ev.link)}" target="_blank" rel="noopener">Learn more ${arrow}</a>` : ""}</article>`).join("")}</div>`
}

function mtcProjects(root) {
  if (!mtc.projects.length) return ""
  const field = (label, v) => v ? `<div><dt>${label}</dt><dd>${esc(Array.isArray(v) ? v.join(", ") : v)}</dd></div>` : ""
  return `<div class="event-list">${mtc.projects.map(pr => `<article class="panel event-card"><h3>${esc(pr.title)}</h3>${pr.partner ? `<p class="byline">${esc(pr.partner)}</p>` : ""}<dl class="event-meta">${field("Need", pr.need)}${field("Scope", pr.scope)}${field("Student team", pr.team)}${field("Technologies", pr.technologies)}${field("My role", pr.role)}${field("Delivered", pr.result)}${field("Continuing support", pr.support)}</dl>${(pr.images || []).map(k => figure(root, k, { alt: pr.title, cap: "" })).join("")}${pr.testimonial ? `<blockquote>${esc(pr.testimonial)}</blockquote>` : ""}${pr.link ? `<a class="link" href="${esc(pr.link)}" target="_blank" rel="noopener">View project ${arrow}</a>` : ""}</article>`).join("")}</div>`
}

/* ---------- Macro expansion ---------- */
function expand(text, ctx) {
  const { root } = ctx
  return text
    .replace(/\{\{root\}\}/g, root)
    .replace(/\{\{block-arrow\}\}/g, arrow)
    .replace(/\{\{resume\}\}/g, `${root}${site.resume}`)
    .replace(/\{\{fig\s+"([^"]+)"([^}]*)\}\}/g, (_, key, rest) => figure(root, key, attrs(rest)))
    .replace(/\{\{img\s+"([^"]+)"([^}]*)\}\}/g, (_, key, rest) => { const a = attrs(rest); return imageTag(root, key, { alt: a.alt || "", sizes: a.sizes || "(min-width: 900px) 58vw, 100vw", priority: a.priority === "true" }) })
    .replace(/\{\{ratio\s+"([^"]+)"\}\}/g, (_, key) => (manifest[key].w / manifest[key].h).toFixed(3))
    .replace(/\{\{project\s+(\S+)\s+(\w+)\}\}/g, (_, slug, field) => esc(P[slug][field]))
    .replace(/\{\{figures\s+(\S+)\}\}/g, (_, slug) => figuresBlock(P[slug].figures))
    .replace(/\{\{block\s+(\S+)(?:\s+(\S+))?\}\}/g, (_, name, arg) => ({
      "projects-index": () => projectsIndex(root),
      "experience-groups": () => experienceGroups(root),
      "experience-mini": () => experienceMini(root),
      skills: () => skillsBlock(),
      ownership: () => ownership(arg),
      "role-projects": () => roleProjects(root, arg),
      results: () => resultsStrip(arg),
      "mtc-programs": () => mtcPrograms(root),
      "mtc-event-meta": () => mtcEventMeta(arg),
      "mtc-events": () => mtcEvents(root),
      "mtc-projects": () => mtcProjects(root)
    }[name]?.() ?? (() => { throw new Error(`Unknown block: ${name}`) })()))
}

function frontMatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!m) return [{}, src]
  const meta = Object.fromEntries(m[1].split("\n").map(l => { const i = l.indexOf(":"); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
  return [meta, src.slice(m[0].length)]
}

/* ---------- Layout ---------- */
const wordmark = root => `<a class="wordmark" href="${root}index.html" aria-label="${site.name}, home"><span class="wm-first">Muhammad</span><span class="wm-last">Anjum<svg class="wm-sign" viewBox="0 0 120 14" aria-hidden="true" focusable="false"><path d="M2 9.5C15 3.5 27 12.5 43 7.5S71 2.5 87 8.5s21 2 31-4.5" pathLength="1"/></svg></span></a>`

function layout({ root, title, description, key, canonical, body, scripts = [], jsonld = [], ogImage, bodyClass = "", noindex = false }) {
  const url = `${site.domain}/${canonical}`
  const og = ogImage || `${site.domain}/assets/media/og-image.png`
  const nav = site.nav.map((n, i) => `<a href="${root}${n.href}" style="--i:${i}"${n.key === key ? ' aria-current="page"' : ""}>${n.label}</a>`).join("")
  const ld = jsonld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n  ")
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#f2ecdf">
  ${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
  <meta property="og:site_name" content="${site.name}">
  <meta property="og:type" content="${canonical === "" ? "website" : "article"}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${og}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/png" sizes="32x32" href="${root}assets/media/favicon.png">
  <link rel="apple-touch-icon" sizes="180x180" href="${root}assets/media/apple-touch-icon.png">
  <script>document.documentElement.classList.add("js")</script>
  <link rel="stylesheet" href="${root}assets/css/site.css">
  ${ld}
  <script defer src="${root}assets/js/site.js"></script>
  ${scripts.map(s => `<script defer src="${root}${s}"></script>`).join("\n  ")}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ""}>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header" data-header>
    <div class="wrap header-in">
      ${wordmark(root)}
      <nav class="site-nav" id="site-nav" data-nav aria-label="Primary"><span class="nav-thumb" aria-hidden="true"></span>${nav}
        <div class="nav-extra"><a class="btn btn-ink" href="${root}${site.resume}" target="_blank" rel="noopener">Résumé ${arrow}</a><a href="mailto:${site.email}">Email</a><a href="${site.linkedin}" target="_blank" rel="noopener">LinkedIn</a></div>
      </nav>
      <div class="header-end">
        <a class="resume-link" href="${root}${site.resume}" target="_blank" rel="noopener"><span>Résumé</span>${arrow}</a>
        <button class="menu-btn" type="button" data-menu aria-expanded="false" aria-controls="site-nav" aria-label="Open menu"><span></span></button>
      </div>
    </div>
  </header>
  <main id="main">
${body}
  </main>
  <footer class="site-footer">
    <div class="wrap">
      <div class="foot">
        <div>${wordmark(root)}<p>Aerospace and EV systems engineering, from supplier audits to high-voltage battery builds.</p></div>
        <nav class="foot-links" aria-label="Footer">
          <div><p class="foot-h">Portfolio</p><a href="${root}projects.html">Work</a><a href="${root}experience.html">Experience</a><a href="${root}experience/aztec-electric-racing.html">Aztec Electric Racing</a><a href="${root}experience/sdsu-research.html">SDSU research</a><a href="${root}about.html">About</a></div>
          <div><p class="foot-h">Case studies</p>${projects.map(p => `<a href="${root}projects/${p.slug}.html">${esc(p.title)}</a>`).join("")}</div>
          <div><p class="foot-h">Contact</p><a href="mailto:${site.email}">Email</a><a href="${site.linkedin}" target="_blank" rel="noopener">LinkedIn</a><a href="${site.github}" target="_blank" rel="noopener">GitHub</a><a href="${root}${site.resume}" target="_blank" rel="noopener">Résumé (PDF)</a></div>
        </nav>
      </div>
      <div class="foot-base"><span>© <span data-year>2026</span> ${site.name}</span><span>San Diego, California</span></div>
    </div>
  </footer>
  <dialog class="lightbox" data-lightbox aria-label="Enlarged figure"><div class="lb-inner"><div class="lb-img"><img alt=""></div><div class="lb-cap"><span data-lb-caption></span><button class="lb-close" type="button" data-lb-close>Close</button></div></div></dialog>
</body>
</html>
`
}

/* ---------- Page types ---------- */
const personLD = { "@context": "https://schema.org", "@type": "Person", name: site.name, jobTitle: "EV Systems Engineer", url: site.domain + "/", sameAs: [site.linkedin, site.github], alumniOf: [{ "@type": "CollegeOrUniversity", name: "San Diego State University" }], knowsAbout: ["Aerospace engineering", "High-voltage battery systems", "Electric vehicle integration", "Supplier development", "Manufacturing"] }

function out(path, html) {
  const full = join(ROOT, path)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, html)
  console.log("  " + path)
}

const generated = []
const emit = (path, html) => { generated.push(path); out(path, html) }

/* Plain pages: src/pages/*.html with front matter */
for (const file of readdirSync(join(ROOT, "src/pages")).filter(f => f.endsWith(".html"))) {
  const [meta, raw] = frontMatter(read(`src/pages/${file}`))
  const root = meta.root ?? (meta.out.includes("/") ? "../" : "")
  const body = expand(raw, { root })
  const isHome = meta.out === "index.html"
  emit(meta.out, layout({
    root, title: meta.title, description: meta.description, key: meta.key, body, noindex: meta.noindex === "true",
    canonical: isHome ? "" : meta.out,
    scripts: isHome ? ["assets/js/hero.js"] : [],
    jsonld: isHome ? [personLD] : []
  }))
}

/* Case studies */
function caseStudy(p) {
  const root = "../"
  const [, raw] = frontMatter(read(`src/projects/${p.slug}.html`))
  let n = 0
  const toc = []
  const bodyHtml = expand(raw, { root }).replace(/<section class="case-sec" id="([^"]+)" data-label="([^"]+)">/g, (_, id, label) => {
    n += 1
    const num = String(n).padStart(2, "0")
    toc.push({ id, label, num })
    return `<section class="case-sec" id="${id}" aria-label="${esc(label)}">`
  })
  const next = P[p.next]
  const heroFig = p.image
    ? `<div class="mount ${p.imageFit === "plate" ? "plate" : ""}"><div class="frame" style="aspect-ratio:${(manifest[p.image].w / manifest[p.image].h).toFixed(3)}">${imageTag(root, p.image, { alt: p.imageAlt, sizes: "(min-width: 1080px) 700px, 100vw", priority: true })}</div></div>`
    : ""
  const stats = p.stats.length ? `<div class="panel key-figures" data-reveal>${p.stats.map(([v, l]) => `<div><strong>${esc(v)}</strong><span>${esc(l)}</span></div>`).join("")}</div>` : ""
  const org = p.orgSlug ? `<a href="${root}experience/${p.orgSlug}.html">${esc(p.org)}</a>` : esc(p.org)
  const body = `
<section class="case-hero wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="${root}projects.html">Work</a><i>/</i><span>${esc(p.title)}</span></nav>
  <div class="case-top${p.image ? "" : " no-fig"}">
    <div class="enter" style="--d:0">
      <h1>${esc(p.title)}</h1>
      <p class="byline">${esc(p.kind)} · ${org}</p>
      <p class="lede">${esc(p.lede)}</p>
      <div class="tags">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
    </div>
    ${heroFig ? `<div class="enter" style="--d:2">${heroFig}</div>` : ""}
  </div>
  ${stats}
</section>
<div class="wrap case-grid">
  <aside class="rail" aria-label="About this project">
    <div><h2>Project facts</h2><dl class="facts">${p.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl></div>
    <div><h2>On this page</h2><nav class="toc" data-toc aria-label="Sections">${toc.map(t => `<a href="#${t.id}"><span>${t.num}</span>${t.label}</a>`).join("")}</nav></div>
  </aside>
  <div class="case-body">
${bodyHtml}
  </div>
</div>
<section class="wrap sec tight">
  <nav class="pager" aria-label="More case studies">
    <a class="panel panel-lift" href="${root}projects.html"><small>All work</small><strong>Back to projects</strong></a>
    <a class="panel panel-lift" href="${root}projects/${next.slug}.html"><small>Next case study</small><strong>${esc(next.title)} ${arrow}</strong></a>
  </nav>
</section>`
  return layout({
    root, title: `${p.title} — ${site.name}`, description: p.description, key: "projects", canonical: `projects/${p.slug}.html`, body,
    ogImage: p.image ? `${site.domain}/${fullFile(p.image)}` : undefined,
    jsonld: [{ "@context": "https://schema.org", "@type": "TechArticle", headline: p.title, description: p.description, author: { "@type": "Person", name: site.name, url: site.domain + "/" }, image: p.image ? `${site.domain}/${fullFile(p.image)}` : undefined, mainEntityOfPage: `${site.domain}/projects/${p.slug}.html` }]
  })
}
for (const p of projects) emit(`projects/${p.slug}.html`, caseStudy(p))

/* Role pages (entries with page:true) */
function rolePage(e) {
  const root = "../"
  const [, raw] = frontMatter(read(`src/experience/${e.slug}.html`))
  const wide = Boolean(e.heroWide && e.image)
  const mount = sizes => `<div class="mount"><div class="frame" style="aspect-ratio:${(manifest[e.image].w / manifest[e.image].h).toFixed(3)}">${imageTag(root, e.image, { alt: e.imageAlt, sizes, priority: true })}</div></div>`
  const stat = e.heroStat ? `<p class="hero-stat"><strong>${esc(e.heroStat.value)}</strong><span>${esc(e.heroStat.label)}</span></p>` : ""
  const heroText = `<div class="enter" style="--d:0">
      <h1>${esc(e.h1 || e.pageTitle || e.org)}</h1>
      <p class="byline">${esc(e.context)}</p>
      <div style="margin-top:20px;display:grid;gap:8px">${roleLine(e)}</div>
      <p class="lede">${esc(e.summary)}</p>
      ${stat}
      ${wide ? "" : `<div class="tags">${e.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>`}
      ${(e.heroLinks || []).length || (e.links || []).length ? `<p class="hero-links">${(e.heroLinks || []).map(l => `<a class="link" href="${root}${l.href}">${esc(l.label)} ${arrow}</a>`).join("")}${(e.links || []).map(l => `<a class="link" href="${l.href}" target="_blank" rel="noopener">${esc(l.label)} ${arrow}</a>`).join("")}</p>` : ""}
    </div>`
  const hero = `<section class="case-hero wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="${root}experience.html">Experience</a><i>/</i><span>${esc(e.org)}</span></nav>
  <div class="case-top${e.image && !wide ? "" : " no-fig"}${wide ? " wide" : ""}">
    ${heroText}
    ${e.image && !wide ? `<div class="enter" style="--d:2;${e.imageMax ? `max-width:${e.imageMax};justify-self:end;width:100%` : ""}">${mount("(min-width: 1080px) 520px, 100vw")}</div>` : ""}
  </div>
  ${wide ? `<div class="hero-wide enter" style="--d:2">${mount("(min-width: 1080px) 1200px, 100vw")}</div>` : ""}
</section>`
  let content
  if (e.rail) {
    let n = 0
    const toc = []
    const bodyHtml = expand(raw, { root }).replace(/<section class="case-sec" id="([^"]+)" data-label="([^"]+)">/g, (_, id, label) => {
      n += 1
      toc.push({ id, label, num: String(n).padStart(2, "0") })
      return `<section class="case-sec" id="${id}" aria-label="${esc(label)}">`
    })
    content = `<div class="wrap case-grid">
  <aside class="rail" aria-label="About this role">
    <div><h2>Role facts</h2><dl class="facts">${(e.facts || []).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl></div>
    <div><h2>On this page</h2><nav class="toc" data-toc aria-label="Sections">${toc.map(t => `<a href="#${t.id}"><span>${t.num}</span>${t.label}</a>`).join("")}</nav></div>
  </aside>
  <div class="case-body">
${bodyHtml}
  </div>
</div>`
  } else content = expand(raw, { root })
  const body = `${e.theme ? `<div class="theme-${e.theme}">` : ""}${e.progress ? '<div class="read-progress" data-progress aria-hidden="true"><i></i></div>' : ""}
${hero}
${content}
<section class="wrap sec tight">
  <nav class="pager" aria-label="More experience">
    <a class="panel panel-lift" href="${root}experience.html"><small>All roles</small><strong>Back to experience</strong></a>
    <a class="panel panel-lift" href="${root}projects.html"><small>Technical depth</small><strong>Browse the case studies ${arrow}</strong></a>
  </nav>
</section>${e.theme ? "\n</div>" : ""}`
  const og = e.ogImage ? `${site.domain}/assets/media/projects/${e.ogImage}-1600.jpg` : undefined
  return layout({ root, title: `${e.pageTitle || e.org} — ${site.name}`, description: e.summary, key: "experience", canonical: `experience/${e.slug}.html`, body, ogImage: og })
}
for (const e of experience.filter(x => x.page)) emit(`experience/${e.slug}.html`, rolePage(e))

/* Sitemap */
const urls = generated.filter(p => p !== "404.html").map(p => p === "index.html" ? "" : p)
const today = new Date().toISOString().slice(0, 10)
writeFileSync(join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${site.domain}/${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`)
console.log(`Built ${generated.length} pages + sitemap.xml`)
