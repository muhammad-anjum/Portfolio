(() => {
  const root = document.documentElement
  const body = document.body
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const themeButton = document.querySelector("[data-theme-toggle]")
  const storedTheme = window.localStorage.getItem("portfolio-theme")
  const initialTheme = storedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  root.dataset.theme = initialTheme

  const updateThemeLabel = () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark"
    themeButton?.setAttribute("aria-label", `Switch to ${nextTheme} theme`)
    const themeMeta = document.querySelector('meta[name="theme-color"]')
    if (themeMeta) themeMeta.content = root.dataset.theme === "dark" ? "#10100e" : "#f5f1e8"
  }

  updateThemeLabel()

  themeButton?.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark"
    window.localStorage.setItem("portfolio-theme", root.dataset.theme)
    updateThemeLabel()
  })

  const menuButton = document.querySelector("[data-menu-toggle]")
  const nav = document.querySelector("[data-site-nav]")

  const closeMenu = () => {
    menuButton?.setAttribute("aria-expanded", "false")
    menuButton?.setAttribute("aria-label", "Open navigation")
    nav?.classList.remove("open")
    body.classList.remove("menu-open")
  }

  menuButton?.addEventListener("click", () => {
    const willOpen = menuButton.getAttribute("aria-expanded") !== "true"
    menuButton.setAttribute("aria-expanded", String(willOpen))
    menuButton.setAttribute("aria-label", willOpen ? "Close navigation" : "Open navigation")
    nav?.classList.toggle("open", willOpen)
    body.classList.toggle("menu-open", willOpen)
  })

  nav?.addEventListener("click", event => {
    if (event.target.closest("a")) closeMenu()
  })

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu()
  })

  const currentPage = body.dataset.page
  document.querySelectorAll("[data-nav-page]").forEach(link => {
    if (link.dataset.navPage === currentPage) link.setAttribute("aria-current", "page")
  })

  const header = document.querySelector("[data-header]")
  const progress = document.querySelector("[data-progress]")
  const backTop = document.querySelector("[data-back-top]")
  let ticking = false

  const updateScrollUI = () => {
    const y = window.scrollY
    const max = document.documentElement.scrollHeight - window.innerHeight
    header?.classList.toggle("scrolled", y > 10)
    backTop?.classList.toggle("visible", y > window.innerHeight * 0.8)
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`
    ticking = false
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(updateScrollUI)
      ticking = true
    }
  }, { passive: true })

  updateScrollUI()
  backTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }))

  const revealElements = document.querySelectorAll(".reveal, .role-card")
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach(element => element.classList.add("in-view"))
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        entry.target.classList.add("in-view")
        revealObserver.unobserve(entry.target)
      })
    }, { threshold: 0.12, rootMargin: "0px 0px -5%" })
    revealElements.forEach(element => revealObserver.observe(element))
  }

  document.querySelectorAll("[data-spotlight]").forEach(card => {
    card.addEventListener("pointermove", event => {
      const rect = card.getBoundingClientRect()
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`)
      card.style.setProperty("--my", `${event.clientY - rect.top}px`)
    })
  })

  const systemVisual = document.querySelector("[data-system-visual]")
  systemVisual?.addEventListener("pointermove", event => {
    const rect = systemVisual.getBoundingClientRect()
    systemVisual.style.setProperty("--px", `${((event.clientX - rect.left) / rect.width) * 100}%`)
    systemVisual.style.setProperty("--py", `${((event.clientY - rect.top) / rect.height) * 100}%`)
  })

  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".magnetic").forEach(element => {
      element.addEventListener("pointermove", event => {
        const rect = element.getBoundingClientRect()
        const x = (event.clientX - rect.left - rect.width / 2) * 0.16
        const y = (event.clientY - rect.top - rect.height / 2) * 0.16
        element.style.transform = `translate(${x}px, ${y}px)`
      })
      element.addEventListener("pointerleave", () => {
        element.style.transform = "translate(0, 0)"
      })
    })
  }

  const counters = document.querySelectorAll("[data-counter]")
  const animateCounter = element => {
    const target = Number(element.dataset.counter)
    const suffix = element.dataset.suffix || ""
    const duration = 1100
    const start = performance.now()
    const render = now => {
      const elapsed = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - elapsed, 4)
      element.textContent = `${Math.round(target * eased)}${suffix}`
      if (elapsed < 1) window.requestAnimationFrame(render)
    }
    window.requestAnimationFrame(render)
  }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    counters.forEach(element => {
      element.textContent = `${element.dataset.counter}${element.dataset.suffix || ""}`
    })
  } else {
    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        animateCounter(entry.target)
        counterObserver.unobserve(entry.target)
      })
    }, { threshold: 0.65 })
    counters.forEach(element => counterObserver.observe(element))
  }

  const filterButtons = document.querySelectorAll("[data-filter]")
  const projectCards = document.querySelectorAll("[data-project-category]")
  const projectCount = document.querySelector("[data-project-count]")

  const applyFilter = filter => {
    let visibleCount = 0
    projectCards.forEach(card => {
      const show = filter === "all" || card.dataset.projectCategory.split(" ").includes(filter)
      card.hidden = !show
      if (show) visibleCount += 1
    })
    filterButtons.forEach(button => {
      const active = button.dataset.filter === filter
      button.classList.toggle("active", active)
      button.setAttribute("aria-pressed", String(active))
    })
    if (projectCount) projectCount.textContent = `${visibleCount} project${visibleCount === 1 ? "" : "s"}`
  }

  filterButtons.forEach(button => button.addEventListener("click", () => applyFilter(button.dataset.filter)))

  document.querySelectorAll("[data-year]").forEach(element => {
    element.textContent = new Date().getFullYear()
  })

  if (!reduceMotion) {
    const canvas = document.createElement("canvas")
    canvas.className = "spark-canvas"
    canvas.setAttribute("aria-hidden", "true")
    document.body.appendChild(canvas)
    const context = canvas.getContext("2d")
    const sparks = []

    const resizeCanvas = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * ratio
      canvas.height = window.innerHeight * ratio
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const drawSparks = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight)
      for (let index = sparks.length - 1; index >= 0; index -= 1) {
        const spark = sparks[index]
        spark.life -= 0.045
        spark.distance += 2.4
        if (spark.life <= 0) {
          sparks.splice(index, 1)
          continue
        }
        const x1 = spark.x + Math.cos(spark.angle) * spark.distance
        const y1 = spark.y + Math.sin(spark.angle) * spark.distance
        const x2 = spark.x + Math.cos(spark.angle) * (spark.distance + 7)
        const y2 = spark.y + Math.sin(spark.angle) * (spark.distance + 7)
        context.beginPath()
        context.moveTo(x1, y1)
        context.lineTo(x2, y2)
        context.strokeStyle = `rgba(199, 154, 73, ${spark.life})`
        context.lineWidth = 1.4
        context.stroke()
      }
      if (sparks.length) window.requestAnimationFrame(drawSparks)
    }

    document.addEventListener("click", event => {
      if (!event.target.closest(".spark-target")) return
      const wasEmpty = sparks.length === 0
      for (let i = 0; i < 8; i += 1) {
        sparks.push({ x: event.clientX, y: event.clientY, angle: (Math.PI * 2 * i) / 8, distance: 2, life: 1 })
      }
      if (wasEmpty) drawSparks()
    })

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas, { passive: true })
  }
})()
