/* Site behavior: header state, mobile menu, scroll reveals, case-study index, lightbox.
   One easing and one timing scale live in the CSS; this file only toggles classes. */
(() => {
  const doc = document.documentElement
  const body = document.body
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  /* Header: gains a paper background once the page scrolls */
  const header = document.querySelector("[data-header]")
  const setScrolled = () => header?.classList.toggle("scrolled", window.scrollY > 8)
  setScrolled()
  window.addEventListener("scroll", setScrolled, { passive: true })

  /* Mobile menu */
  const menuBtn = document.querySelector("[data-menu]")
  const nav = document.querySelector("[data-nav]")
  const setMenu = open => {
    body.classList.toggle("menu-open", open)
    menuBtn?.setAttribute("aria-expanded", String(open))
    menuBtn?.setAttribute("aria-label", open ? "Close menu" : "Open menu")
  }
  menuBtn?.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"))
  nav?.addEventListener("click", event => { if (event.target.closest("a")) setMenu(false) })
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && body.classList.contains("menu-open")) { setMenu(false); menuBtn?.focus() }
  })
  window.matchMedia("(min-width: 861px)").addEventListener("change", event => { if (event.matches) setMenu(false) })

  /* Navigation thumb: follows hover and focus, rests on the current page, and glides in from
     the previous page's position so moving between pages reads as one continuous gesture */
  const thumb = nav?.querySelector(".nav-thumb")
  const navLinks = nav ? [...nav.querySelectorAll(":scope > a")] : []
  const current = navLinks.find(a => a.hasAttribute("aria-current"))
  const desktopNav = window.matchMedia("(min-width: 861px)")
  const placeThumb = (el, animate = true) => {
    if (!thumb) return
    if (!el) { thumb.classList.remove("on"); return }
    thumb.classList.toggle("still", !animate)
    nav.style.setProperty("--x", `${el.offsetLeft}px`)
    nav.style.setProperty("--w", `${el.offsetWidth}px`)
    thumb.classList.add("on")
  }
  const saveThumb = () => {
    try { sessionStorage.setItem("nav-thumb", current ? JSON.stringify({ x: current.offsetLeft, w: current.offsetWidth }) : "none") } catch {}
  }
  if (thumb && navLinks.length) {
    let previous = null
    try { const raw = sessionStorage.getItem("nav-thumb"); previous = raw && raw !== "none" ? JSON.parse(raw) : null } catch {}
    const settle = () => {
      if (!desktopNav.matches) return
      if (current) {
        if (previous && !reduce) {
          nav.style.setProperty("--x", `${previous.x}px`)
          nav.style.setProperty("--w", `${previous.w}px`)
          thumb.classList.add("still", "on")
          void thumb.offsetWidth
          requestAnimationFrame(() => placeThumb(current, true))
        } else placeThumb(current, false)
      } else if (previous && !reduce) {
        nav.style.setProperty("--x", `${previous.x}px`)
        nav.style.setProperty("--w", `${previous.w}px`)
        thumb.classList.add("still", "on")
        void thumb.offsetWidth
        requestAnimationFrame(() => { thumb.classList.remove("still"); placeThumb(null) })
      }
      saveThumb()
    }
    settle()
    navLinks.forEach(a => {
      a.addEventListener("pointerenter", () => desktopNav.matches && placeThumb(a))
      a.addEventListener("focus", () => desktopNav.matches && placeThumb(a))
    })
    nav.addEventListener("pointerleave", () => desktopNav.matches && placeThumb(current))
    nav.addEventListener("focusout", event => { if (desktopNav.matches && !nav.contains(event.relatedTarget)) placeThumb(current) })
    window.addEventListener("resize", () => { if (desktopNav.matches) placeThumb(current, false) }, { passive: true })
  }

  /* Scroll reveals: one transition, staggered inside groups */
  doc.querySelectorAll("[data-reveal-group]").forEach(group => {
    ;[...group.querySelectorAll(":scope > [data-reveal]")].forEach((el, i) => el.style.setProperty("--i", i))
  })
  const reveals = document.querySelectorAll("[data-reveal]")
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(el => el.classList.add("in"))
  } else {
    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add("in")
        io.unobserve(entry.target)
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" })
    reveals.forEach(el => io.observe(el))
  }

  /* Case-study index: mark the section being read */
  const tocLinks = [...document.querySelectorAll("[data-toc] a")]
  if (tocLinks.length && "IntersectionObserver" in window) {
    const byId = new Map(tocLinks.map(a => [a.getAttribute("href").slice(1), a]))
    const sections = [...byId.keys()].map(id => document.getElementById(id)).filter(Boolean)
    const spy = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        tocLinks.forEach(a => a.removeAttribute("aria-current"))
        const link = byId.get(entry.target.id)
        link?.setAttribute("aria-current", "true")
        const list = link?.parentElement
        if (list && list.scrollWidth > list.clientWidth) {
          list.scrollTo({ left: link.offsetLeft - 24, behavior: reduce ? "auto" : "smooth" })
        }
        const rail = link?.closest(".rail")
        if (rail && rail.scrollHeight > rail.clientHeight + 4 && getComputedStyle(rail).position === "sticky") {
          rail.scrollTo({ top: link.offsetTop - rail.clientHeight / 2, behavior: reduce ? "auto" : "smooth" })
        }
      }
    }, { rootMargin: "-18% 0px -70% 0px" })
    sections.forEach(s => spy.observe(s))
  }


  /* Reading progress (role pages that opt in) */
  const progress = document.querySelector("[data-progress] i")
  if (progress) {
    let ticking = false
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      progress.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0})`
      ticking = false
    }
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update) } }, { passive: true })
    window.addEventListener("resize", update, { passive: true })
    update()
  }

  /* Tabs: all panels stay visible without JavaScript */
  document.querySelectorAll("[data-tabs]").forEach(root => {
    const tabs = [...root.querySelectorAll('[role="tab"]')]
    const panels = tabs.map(t => document.getElementById(t.getAttribute("aria-controls")))
    const select = (index, focus) => {
      tabs.forEach((t, i) => {
        const on = i === index
        t.setAttribute("aria-selected", String(on))
        t.tabIndex = on ? 0 : -1
        panels[i].hidden = !on
      })
      if (focus) tabs[index].focus()
    }
    root.classList.add("is-ready")
    select(0, false)
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(i, false))
      t.addEventListener("keydown", event => {
        const last = tabs.length - 1
        const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[event.key]
        if (next === undefined) return
        event.preventDefault()
        select(next, true)
      })
    })
  })

  /* Lightbox for figures */
  const dialog = document.querySelector("[data-lightbox]")
  if (dialog) {
    const img = dialog.querySelector("img")
    const cap = dialog.querySelector("[data-lb-caption]")
    let opener = null
    document.addEventListener("click", event => {
      const btn = event.target.closest("[data-zoom]")
      if (!btn || typeof dialog.showModal !== "function") return
      opener = btn
      const source = btn.querySelector("img")
      img.src = btn.dataset.zoom
      img.alt = source?.alt || ""
      cap.textContent = btn.closest("figure")?.querySelector("figcaption")?.textContent || ""
      dialog.showModal()
    })
    dialog.querySelector("[data-lb-close]")?.addEventListener("click", () => dialog.close())
    dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close() })
    dialog.addEventListener("close", () => { img.removeAttribute("src"); opener?.focus() })
  }

  document.querySelectorAll("[data-year]").forEach(el => { el.textContent = new Date().getFullYear() })
})()
