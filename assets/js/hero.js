/* Hero visual: potential flow around a battery cell array.
   Two canvases. The back one draws a hex-packed array of cells (the energy side);
   the front one advects streamlines around it (the aerodynamic side). A ripple of
   charge crosses the array while the circulation around it drifts slowly, so the
   streamlines never settle. Pointer adds a small vortex. Everything pauses when the
   hero is off screen, and reduced motion renders one settled frame instead. */
(() => {
  const stage = document.querySelector("[data-stage]")
  if (!stage) return
  const cellsCanvas = stage.querySelector(".stage-cells")
  const flowCanvas = stage.querySelector(".stage-flow")
  if (!cellsCanvas || !flowCanvas || !cellsCanvas.getContext) return

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const cctx = cellsCanvas.getContext("2d")
  const fctx = flowCanvas.getContext("2d")

  const TEAL = [98, 170, 166]
  const GOLD = [236, 190, 96]
  const mix = (a, b, k) => `${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)}`

  let W = 0, H = 0, dpr = 1
  let cx = 0, cy = 0, R = 0
  let cells = []
  let particles = []
  let t = 0, last = 0, raf = 0
  let onScreen = true
  const pointer = { x: 0, y: 0, nx: 0, ny: 0, active: false, strength: 0 }
  const par = { x: 0, y: 0 }

  const rand = (a, b) => a + Math.random() * (b - a)

  function setup() {
    const rect = stage.getBoundingClientRect()
    W = Math.max(1, Math.round(rect.width))
    H = Math.max(1, Math.round(rect.height))
    dpr = Math.min(window.devicePixelRatio || 1, 1.75)
    for (const c of [cellsCanvas, flowCanvas]) {
      c.width = Math.round(W * dpr)
      c.height = Math.round(H * dpr)
    }
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    fctx.clearRect(0, 0, W, H)

    const narrow = W < 700
    cx = narrow ? W * 0.5 : W * 0.745
    cy = narrow ? 176 : H * 0.46
    R = narrow ? Math.min(W * 0.3, 118) : Math.min(H * 0.285, W * 0.185)
    stage.style.setProperty("--cx", `${((cx / W) * 100).toFixed(1)}%`)
    stage.style.setProperty("--cy", `${((cy / H) * 100).toFixed(1)}%`)

    // Hex-packed cells inside the circle
    const d = R / 10.5
    const r = d * 0.43
    cells = []
    const rows = Math.ceil(R / (d * 0.866)) + 1
    for (let j = -rows; j <= rows; j++) {
      const y = j * d * 0.866
      const off = j & 1 ? d / 2 : 0
      for (let i = -rows; i <= rows; i++) {
        const x = i * d + off
        const dist = Math.hypot(x, y)
        if (dist + r <= R * 0.97) cells.push({ x, y, dist: dist / R, phase: Math.random() * 6.283, r })
      }
    }

    const count = Math.round(Math.min(1100, Math.max(260, (W * H) / 1700)))
    particles = Array.from({ length: count }, () => spawn({}, true))
  }

  function spawn(p, anywhere) {
    p.x = anywhere ? rand(-20, W + 20) : rand(-40, -4)
    p.y = Math.random() < 0.72 ? cy + rand(-2.6, 2.6) * R : rand(-10, H + 10)
    p.px = p.x
    p.py = p.y
    p.age = 0
    p.life = rand(5, 14)
    return p
  }

  // Cylinder in a uniform stream with circulation; returns [u, v] in units of U
  function velocity(x, y, k) {
    const dx = x - cx
    const dy = y - cy
    const r2 = dx * dx + dy * dy
    const R2 = R * R
    if (r2 < R2 * 0.98) return null
    const r4 = r2 * r2
    let u = 1 - (R2 * (dx * dx - dy * dy)) / r4 - (k * dy) / r2
    let v = -(R2 * 2 * dx * dy) / r4 + (k * dx) / r2
    if (pointer.strength > 0.01) {
      const px = x - pointer.x
      const py = y - pointer.y
      const eps = R * 0.34
      const f = (R * 0.55 * pointer.strength) / (px * px + py * py + eps * eps)
      u += -py * f
      v += px * f
    }
    return [u, v]
  }

  function drawCells(time) {
    cctx.clearRect(0, 0, W, H)
    cctx.save()
    cctx.translate(cx, cy)

    // Outer ring and ticks
    cctx.lineWidth = 1
    cctx.strokeStyle = `rgba(${TEAL.join(",")},0.38)`
    cctx.beginPath()
    cctx.arc(0, 0, R, 0, 6.2832)
    cctx.stroke()
    cctx.strokeStyle = "rgba(243,236,220,0.22)"
    cctx.beginPath()
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * 6.2832
      const len = i % 10 === 0 ? 14 : i % 5 === 0 ? 8 : 4
      const r0 = R * 1.07
      cctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0)
      cctx.lineTo(Math.cos(a) * (r0 + len), Math.sin(a) * (r0 + len))
    }
    cctx.stroke()

    const front = (time * 0.2) % 1.5
    const px = pointer.x - cx
    const py = pointer.y - cy
    for (const c of cells) {
      const ripple = Math.exp(-Math.pow(c.dist - front, 2) * 70)
      const wave = 0.5 + 0.5 * Math.sin(c.dist * 8 - time * 1.4 + c.phase * 0.35)
      const shimmer = 0.5 + 0.5 * Math.sin(time * 0.8 + c.phase)
      let prox = 0
      if (pointer.strength > 0.01) {
        const dd = Math.hypot(c.x - px, c.y - py) / (R * 0.5)
        prox = Math.max(0, 1 - dd) * pointer.strength
      }
      const e = Math.min(1, 0.24 + 0.62 * ripple + 0.2 * wave * shimmer + 0.7 * prox)
      const col = mix(TEAL, GOLD, Math.pow(e, 1.4))
      cctx.strokeStyle = `rgba(${col},${0.3 + 0.55 * e})`
      cctx.fillStyle = `rgba(${col},${0.1 + 0.8 * e * e})`
      cctx.beginPath()
      cctx.arc(c.x, c.y, c.r, 0, 6.2832)
      cctx.stroke()
      cctx.beginPath()
      cctx.arc(c.x, c.y, c.r * 0.5, 0, 6.2832)
      cctx.fill()
    }
    cctx.restore()
  }

  const buckets = [[], [], [], []]
  const bucketStyle = [
    `rgba(${TEAL.join(",")},0.6)`,
    `rgba(${mix(TEAL, GOLD, 0.45)},0.72)`,
    `rgba(${mix(TEAL, GOLD, 0.8)},0.85)`,
    `rgba(255,218,140,0.95)`
  ]

  function stepFlow(dt, time) {
    const k = R * (0.62 + 0.26 * Math.sin(time * 0.17) + 0.08 * Math.sin(time * 0.43))
    const speed = Math.max(90, Math.min(190, W * 0.11))

    fctx.globalCompositeOperation = "destination-out"
    fctx.fillStyle = "rgba(0,0,0,0.06)"
    fctx.fillRect(0, 0, W, H)
    fctx.globalCompositeOperation = "source-over"
    for (const b of buckets) b.length = 0

    for (const p of particles) {
      const vel = velocity(p.x, p.y, k)
      p.age += dt
      if (!vel || p.age > p.life || p.x > W + 30 || p.y < -40 || p.y > H + 40) {
        spawn(p, false)
        continue
      }
      p.px = p.x
      p.py = p.y
      p.x += vel[0] * speed * dt
      p.y += vel[1] * speed * dt
      const s = Math.hypot(vel[0], vel[1])
      const bi = s < 0.55 ? 0 : s < 1.0 ? 1 : s < 1.5 ? 2 : 3
      buckets[bi].push(p.px, p.py, p.x, p.y)
    }

    fctx.lineCap = "round"
    for (let i = 0; i < 4; i++) {
      const b = buckets[i]
      if (!b.length) continue
      fctx.strokeStyle = bucketStyle[i]
      fctx.lineWidth = 0.9 + i * 0.35
      fctx.beginPath()
      for (let j = 0; j < b.length; j += 4) {
        fctx.moveTo(b[j], b[j + 1])
        fctx.lineTo(b[j + 2], b[j + 3])
      }
      fctx.stroke()
    }
  }

  function frame(now) {
    raf = 0
    if (!onScreen || document.hidden) return
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016)
    last = now
    t += dt

    // Smooth pointer, parallax and vortex strength
    pointer.x += (pointer.nx - pointer.x) * 0.12
    pointer.y += (pointer.ny - pointer.y) * 0.12
    pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * 0.06
    const targetX = pointer.active ? (pointer.nx / W - 0.5) * 2 : Math.sin(t * 0.21) * 0.35
    const targetY = pointer.active ? (pointer.ny / H - 0.5) * 2 : Math.cos(t * 0.17) * 0.25
    par.x += (targetX - par.x) * 0.04
    par.y += (targetY - par.y) * 0.04
    stage.style.setProperty("--px", par.x.toFixed(3))
    stage.style.setProperty("--py", par.y.toFixed(3))

    stepFlow(dt, t)
    drawCells(t)
    raf = requestAnimationFrame(frame)
  }

  function start() {
    if (reduce || raf) return
    last = performance.now()
    raf = requestAnimationFrame(frame)
  }

  function renderStill() {
    t = 2.6
    for (let i = 0; i < 520; i++) stepFlow(1 / 60, i / 60)
    drawCells(t)
  }

  function init() {
    setup()
    if (reduce) renderStill()
    else start()
    stage.dataset.ready = "true"
  }

  if (!reduce) {
    stage.addEventListener("pointermove", event => {
      if (event.pointerType === "touch") return
      const rect = stage.getBoundingClientRect()
      pointer.nx = event.clientX - rect.left
      pointer.ny = event.clientY - rect.top
      if (!pointer.active) {
        pointer.x = pointer.nx
        pointer.y = pointer.ny
      }
      pointer.active = true
    })
    stage.addEventListener("pointerleave", () => { pointer.active = false })

    new IntersectionObserver(entries => {
      onScreen = entries[0].isIntersecting
      if (onScreen) start()
    }, { threshold: 0.02 }).observe(stage)
    document.addEventListener("visibilitychange", () => { if (!document.hidden) start() })
  }

  let resizeTimer = 0
  new ResizeObserver(() => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(init, 120)
  }).observe(stage)

  init()
})()
