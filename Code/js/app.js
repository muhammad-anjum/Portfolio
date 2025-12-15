// Theme handling
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

const storedTheme = window.localStorage.getItem("site-theme")
if (storedTheme === "dark" || storedTheme === "light") {
  setTheme(storedTheme)
} else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
  setTheme("dark")
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isDark = body.getAttribute("data-theme") === "dark"
    const next = isDark ? "light" : "dark"
    setTheme(next)
    window.localStorage.setItem("site-theme", next)
  })
}

// Mobile nav toggle
const navToggle = document.querySelector(".nav-toggle")
const nav = document.querySelector(".site-nav")

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    nav.classList.toggle("nav-open")
  })

  nav.addEventListener("click", e => {
    if (e.target.closest(".nav-link")) {
      nav.classList.remove("nav-open")
    }
  })
}

// Smooth scrolling for internal links
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

// Active nav item on scroll
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

// Reveal on scroll
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

// Project filter
const filterChips = document.querySelectorAll(".chip[data-filter]")
const projectCards = document.querySelectorAll(".project-card")

filterChips.forEach(chip => {
  chip.addEventListener("click", () => {
    const filter = chip.getAttribute("data-filter")
    filterChips.forEach(c => c.classList.remove("chip-active"))
    chip.classList.add("chip-active")

    projectCards.forEach(card => {
      const category = card.getAttribute("data-category")
      const show = filter === "all" || category === filter
      card.style.display = show ? "" : "none"
    })
  })
})

// Snapshot buttons scroll to sections
document.querySelectorAll(".pill-cta[data-scroll-target]").forEach(button => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-scroll-target").replace("#", "")
    const target = document.getElementById(targetId)
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  })
})

// Back to top
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

// Footer year
const yearSpan = document.getElementById("year")
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear().toString()
}
