// ---------- THEME HANDLING ----------
const body = document.body
const themeToggle = document.querySelector(".theme-toggle")
const themeIcon = document.querySelector(".theme-icon")

function setTheme(mode) {
  if (mode === "dark") {
    body.setAttribute("data-theme", "dark")
    themeIcon.textContent = "☼"
  } else {
    body.removeAttribute("data-theme")
    themeIcon.textContent = "◐"
  }
}

// Initialize from localStorage or system preference
;(function initTheme() {
  const storedTheme = window.localStorage.getItem("site-theme")
  if (storedTheme === "dark" || storedTheme === "light") {
    setTheme(storedTheme)
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    setTheme("dark")
  }
})()

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isDark = body.getAttribute("data-theme") === "dark"
    const next = isDark ? "light" : "dark"
    setTheme(next)
    window.localStorage.setItem("site-theme", next)
  })
}

// ---------- MOBILE NAV ----------
const navToggle = document.querySelector(".nav-toggle")
const nav = document.querySelector(".site-nav")

// overlay
let navOverlay = document.querySelector(".nav-overlay")
if (!navOverlay) {
  navOverlay = document.createElement("div")
  navOverlay.className = "nav-overlay"
  document.body.appendChild(navOverlay)
}

function closeNav() {
  nav?.classList.remove("nav-open")
  navOverlay.classList.remove("show")
}

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("nav-open")
    if (open) {
      navOverlay.classList.add("show")
    } else {
      navOverlay.classList.remove("show")
    }
  })

  nav.addEventListener("click", e => {
    if (e.target.closest(".nav-link")) {
      closeNav()
    }
  })
}

navOverlay.addEventListener("click", closeNav)
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeNav()
})

// ---------- SMOOTH SCROLL FOR INTERNAL LINKS ----------
function isInternalLink(link) {
  return link.getAttribute("href") && link.getAttribute("href").startsWith("#")
}

document.addEventListener("click", event => {
  const link = event.target.closest("a")
  if (!link) return
  if (!isInternalLink(link)) return

  const id = link.getAttribute("href").slice(1)
  const target = document.getElementById(id)
  if (!target) return

  event.preventDefault()
  target.scrollIntoView({ behavior: "smooth", block: "start" })
})

// ---------- ACTIVE NAV ON SCROLL ----------
const sections = Array.from(document.querySelectorAll("main section[id]"))
const navLinks = Array.from(document.querySelectorAll(".site-nav .nav-link"))

function updateActiveNav() {
  const offset = window.innerHeight * 0.25
  let currentId = null

  for (const section of sections) {
    const rect = section.getBoundingClientRect()
    if (rect.top <= offset && rect.bottom >= offset) {
      currentId = section.id
      break
    }
  }

  navLinks.forEach(link => {
    const hrefId = link.getAttribute("href").slice(1)
    if (hrefId === currentId) {
      link.classList.add("nav-link-active")
    } else {
      link.classList.remove("nav-link-active")
    }
  })
}

window.addEventListener("scroll", updateActiveNav)
window.addEventListener("load", updateActiveNav)

// ---------- REVEAL ON SCROLL ----------
const revealEls = document.querySelectorAll(".reveal")

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible")
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.15 }
  )

  revealEls.forEach(el => observer.observe(el))
} else {
  revealEls.forEach(el => el.classList.add("reveal-visible"))
}

// ---------- PROJECT INDEX + FILTER ----------
const projectData = [
  {
    id: "hv-battery",
    title: "High-Voltage Tractive Battery System",
    category: "ev",
    summary:
      "First high-voltage tractive accumulator for Aztec Electric Racing, integrated with control systems and safety architecture.",
    highlights:
      "Cell selection, pack architecture, control integration, documentation for inspection.",
    stack: "High-voltage systems · CAD · Testing",
    tags: ["high-voltage", "battery", "ev"],
    link: ""
  },
  {
    id: "powertrain-testbench",
    title: "EV Powertrain Testbench & Cooling Loop",
    category: "ev",
    summary:
      "Physical testbench for validating the electric powertrain with cooling loop and wiring harness integration before track use.",
    highlights:
      "Subsystem validation, harness integration, cooling loop design, repeatable testing.",
    stack: "Instrumentation · Test hardware · Controls",
    tags: ["testbench", "ev", "validation"],
    link: ""
  },
  {
    id: "iam3d-drone",
    title: "IAM3D Drone Competition · Top-4 Finish",
    category: "aero",
    summary:
      "Led planning and execution for an additive-manufactured drone project that placed 4th internationally in IAM3D.",
    highlights:
      "Project planning, design reviews, testing and iteration under competition constraints.",
    stack: "CAD · Fabrication · Flight testing",
    tags: ["drone", "asme", "competition"],
    link: ""
  },
  {
    id: "nasa-ims-tools",
    title: "NASA Integrated Management System Tools",
    category: "ops",
    summary:
      "Maintained internal web applications and documentation workflows supporting NASA process and compliance audits.",
    highlights:
      "Process mapping, documentation updates, improving efficiency for audit workflows.",
    stack: "Internal apps · Documentation · Process design",
    tags: ["nasa", "documentation", "process"],
    link: ""
  },
  {
    id: "mtc-network",
    title: "Muslim Tech Collaborative Network",
    category: "ops",
    summary:
      "Built and scaled a professional development community for Muslim students, connecting members to industry events and resources.",
    highlights:
      "Operations, outreach, event planning, employer partnerships, leadership.",
    stack: "Community operations · Events · Strategy",
    tags: ["leadership", "community", "career"],
    link: ""
  }
]

const projectListEl = document.getElementById("project-list")
const filterChips = document.querySelectorAll(".chip[data-filter]")
const projectSearchInput = document.getElementById("project-search")

function labelForCategory(category) {
  switch (category) {
    case "ev":
      return "EV & Energy"
    case "aero":
      return "Aero"
    case "ops":
      return "Ops & Tools"
    default:
      return "Project"
  }
}

function renderProjects(filter = "all", query = "") {
  if (!projectListEl) return

  const term = query.trim().toLowerCase()

  const filtered = projectData.filter(project => {
    const matchesCategory = filter === "all" || project.category === filter

    if (!term) return matchesCategory

    const haystack = [
      project.title,
      project.summary,
      project.highlights,
      project.stack,
      ...(project.tags || [])
    ]
      .join(" ")
      .toLowerCase()

    return matchesCategory && haystack.includes(term)
  })

  projectListEl.innerHTML = ""

  if (filtered.length === 0) {
    projectListEl.innerHTML =
      '<p style="font-size:13px;color:var(--text-soft);">No projects match that search yet. Try a different keyword or filter.</p>'
    return
  }

  for (const project of filtered) {
    const card = document.createElement("article")
    card.className = "card project-card reveal reveal-visible"
    card.dataset.category = project.category

    card.innerHTML = `
      <div class="project-top-row">
        <h3>${project.title}</h3>
        <span class="badge badge-outline">${labelForCategory(project.category)}</span>
      </div>
      <p class="project-summary">${project.summary}</p>
      <ul class="project-meta">
        <li>
          <span>Highlights</span>
          <span>${project.highlights}</span>
        </li>
        <li>
          <span>Focus</span>
          <span>${project.stack}</span>
        </li>
      </ul>
      <div class="project-links">
        ${
          project.link
            ? `<a href="${project.link}" target="_blank" rel="noopener">View more →</a>`
            : ""
        }
      </div>
    `

    projectListEl.appendChild(card)
  }
}

let currentFilter = "all"
let currentQuery = ""

// Filter chips
filterChips.forEach(chip => {
  chip.addEventListener("click", () => {
    const filter = chip.getAttribute("data-filter")
    currentFilter = filter
    filterChips.forEach(c => c.classList.remove("chip-active"))
    chip.classList.add("chip-active")
    renderProjects(currentFilter, currentQuery)
  })
})

// Search
if (projectSearchInput) {
  projectSearchInput.addEventListener("input", () => {
    currentQuery = projectSearchInput.value
    renderProjects(currentFilter, currentQuery)
  })
}

// Skill chips hook into project search
document.querySelectorAll(".skill-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    const term = chip.getAttribute("data-skillterm") || ""
    if (!projectSearchInput) return
    projectSearchInput.value = term
    currentQuery = term
    // highlight All filter so it's clear we're searching across everything
    filterChips.forEach(c => c.classList.remove("chip-active"))
    const allChip = document.querySelector('.chip[data-filter="all"]')
    if (allChip) allChip.classList.add("chip-active")
    currentFilter = "all"
    renderProjects(currentFilter, currentQuery)
    // scroll to project section
    const projectsSection = document.getElementById("projects")
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  })
})

// Initial project render
renderProjects(currentFilter, currentQuery)

// ---------- SNAPSHOT BUTTONS SCROLL ----------
document.querySelectorAll(".pill-cta[data-scroll-target]").forEach(button => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-scroll-target").replace("#", "")
    const target = document.getElementById(targetId)
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  })
})

// ---------- BACK TO TOP ----------
const backToTop = document.querySelector(".back-to-top")

function handleBackToTop() {
  if (!backToTop) return
  const show = window.scrollY > window.innerHeight * 0.5
  if (show) {
    backToTop.classList.add("show")
  } else {
    backToTop.classList.remove("show")
  }
}

if (backToTop) {
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  })
}

window.addEventListener("scroll", handleBackToTop)
window.addEventListener("load", handleBackToTop)

// ---------- SCROLL PROGRESS ----------
const progressBar = document.querySelector(".scroll-progress-bar")

function updateScrollProgress() {
  if (!progressBar) return
  const scrollTop = window.scrollY || window.pageYOffset
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  const progress = docHeight > 0 ? scrollTop / docHeight : 0
  progressBar.style.transform = `scaleX(${progress})`
}

window.addEventListener("scroll", updateScrollProgress)
window.addEventListener("load", updateScrollProgress)

// ---------- FOOTER YEAR ----------
const yearSpan = document.getElementById("year")
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear().toString()
}
