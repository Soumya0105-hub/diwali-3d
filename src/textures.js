import * as THREE from 'three'
// Procedural PBR-style textures (no external files, works offline and after deploy).
let seed = 1337
const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
export const mk = (w, h, fn, srgb = true) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  fn(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}
const rep = (t, x, y) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(x, y); return t }
const speckle = (g, w, h, n, a, light) => {
  for (let i = 0; i < n; i++) {
    const v = light ? 255 : 0
    g.fillStyle = `rgba(${v},${v},${v},${rnd() * a})`
    const s = 1 + rnd() * 2.5
    g.fillRect(rnd() * w, rnd() * h, s, s)
  }
}

export const glowTex = mk(128, 128, g => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.45)')
  r.addColorStop(.6, 'rgba(255,255,255,.1)'); r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r; g.fillRect(0, 0, 128, 128)
})
export const shadowTex = mk(128, 128, g => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  r.addColorStop(0, 'rgba(0,0,0,.75)'); r.addColorStop(.6, 'rgba(0,0,0,.3)'); r.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = r; g.fillRect(0, 0, 128, 128)
})

export const plaster = (base, rx = 3, ry = 2) => rep(mk(512, 512, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h)
  for (let i = 0; i < 40; i++) { // large uneven blotches
    g.fillStyle = `rgba(${rnd() > .5 ? '255,240,210' : '60,40,20'},${.03 + rnd() * .05})`
    g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 30 + rnd() * 90, 20 + rnd() * 60, rnd() * 3, 0, 7); g.fill()
  }
  for (let i = 0; i < 26; i++) { // damp / rain streaks
    const x = rnd() * w, gr = g.createLinearGradient(0, 0, 0, h * .8)
    gr.addColorStop(0, 'rgba(70,45,25,.14)'); gr.addColorStop(1, 'rgba(70,45,25,0)')
    g.fillStyle = gr; g.fillRect(x, 0, 2 + rnd() * 6, h * (.3 + rnd() * .6))
  }
  speckle(g, w, h, 5000, .25, false); speckle(g, w, h, 3000, .2, true)
}), rx, ry)

export const plasterBump = mk(256, 256, (g, w, h) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h)
  for (let i = 0; i < 6000; i++) { const v = 90 + rnd() * 90 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(rnd() * w, rnd() * h, 2, 2) }
}, false)
rep(plasterBump, 3, 2)

export const wood = (base = '#4a2a17') => rep(mk(256, 256, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h)
  for (let i = 0; i < 90; i++) {
    g.strokeStyle = `rgba(${rnd() > .5 ? '20,8,0' : '150,90,50'},${.08 + rnd() * .2})`
    g.lineWidth = .5 + rnd() * 2; g.beginPath()
    const x = rnd() * w; g.moveTo(x, 0)
    g.bezierCurveTo(x + rnd() * 14 - 7, h * .3, x + rnd() * 14 - 7, h * .6, x + rnd() * 10 - 5, h); g.stroke()
  }
  for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(15,6,0,.5)'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 3, 7, 0, 0, 7); g.fill() }
}), 1, 1)

// Courtyard floor: 4x4 stone tiles per texture, grout lines, per-tile tone + wear.
export const tileMap = rep(mk(1024, 1024, (g, w, h) => {
  g.fillStyle = '#2b2622'; g.fillRect(0, 0, w, h)
  const n = 4, s = w / n
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = rnd() * 22 - 11, r = 150 + v, gg = 138 + v, b = 120 + v
    const x = i * s + 5, y = j * s + 5, d = s - 10
    const gr = g.createLinearGradient(x, y, x + d, y + d)
    gr.addColorStop(0, `rgb(${r + 8},${gg + 8},${b + 6})`); gr.addColorStop(1, `rgb(${r - 10},${gg - 10},${b - 8})`)
    g.fillStyle = gr; g.fillRect(x, y, d, d)
    for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(${rnd() > .5 ? '60,45,30' : '230,215,190'},${rnd() * .08})`; g.beginPath(); g.ellipse(x + rnd() * d, y + rnd() * d, 10 + rnd() * 50, 8 + rnd() * 30, rnd() * 3, 0, 7); g.fill() }
    if (rnd() > .7) { g.strokeStyle = 'rgba(30,20,10,.35)'; g.lineWidth = 1; g.beginPath(); const sx = x + rnd() * d, sy = y + rnd() * d; g.moveTo(sx, sy); g.lineTo(sx + rnd() * 70 - 35, sy + rnd() * 70 - 35); g.stroke() }
    g.strokeStyle = 'rgba(255,245,225,.22)'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, d - 2, d - 2) // chamfered edge highlight
  }
  speckle(g, w, h, 14000, .28, false); speckle(g, w, h, 9000, .22, true)
}), 4, 3.5)
export const tileRough = rep(mk(512, 512, (g, w, h) => {
  g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, w, h)
  for (let i = 0; i < 5000; i++) { const v = 150 + rnd() * 100 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(rnd() * w, rnd() * h, 3, 3) }
  g.fillStyle = '#ffffff'; const s = w / 4; for (let i = 0; i <= 4; i++) { g.fillRect(i * s - 3, 0, 6, h); g.fillRect(0, i * s - 3, w, 6) } // grout is rough
}, false), 4, 3.5)
export const tileBump = rep(mk(512, 512, (g, w, h) => {
  g.fillStyle = '#e0e0e0'; g.fillRect(0, 0, w, h)
  g.fillStyle = '#101010'; const s = w / 4; for (let i = 0; i <= 4; i++) { g.fillRect(i * s - 3, 0, 6, h); g.fillRect(0, i * s - 3, w, 6) }
  for (let i = 0; i < 4000; i++) { const v = 170 + rnd() * 60 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(rnd() * w, rnd() * h, 2, 2) }
}, false), 4, 3.5)

export const clay = mk(128, 128, (g, w, h) => {
  g.fillStyle = '#a8512a'; g.fillRect(0, 0, w, h)
  for (let i = 0; i < 20; i++) { g.fillStyle = `rgba(${rnd() > .5 ? '230,150,100' : '70,25,10'},${.08 + rnd() * .12})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 10 + rnd() * 30, 6 + rnd() * 16, rnd() * 3, 0, 7); g.fill() }
  speckle(g, w, h, 1800, .4, false); speckle(g, w, h, 900, .3, true)
})

export const roofTile = rep(mk(256, 256, (g, w, h) => {
  g.fillStyle = '#7a2e1c'; g.fillRect(0, 0, w, h)
  for (let i = 0; i < 12; i++) { const x = i * w / 12; const gr = g.createLinearGradient(x, 0, x + w / 12, 0); gr.addColorStop(0, '#5a1d10'); gr.addColorStop(.5, '#a04426'); gr.addColorStop(1, '#4a160a'); g.fillStyle = gr; g.fillRect(x, 0, w / 12 - 1, h) }
  for (let j = 0; j < 8; j++) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, j * h / 8, w, 3) }
  speckle(g, w, h, 1500, .3, false)
}), 4, 1)

export const leafTex = mk(128, 128, (g, w, h) => {
  g.fillStyle = '#1c3a1c'; g.fillRect(0, 0, w, h)
  for (let i = 0; i < 300; i++) { g.fillStyle = `hsla(${90 + rnd() * 40},${40 + rnd() * 30}%,${12 + rnd() * 22}%,.8)`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 3 + rnd() * 6, 1.5 + rnd() * 3, rnd() * 3, 0, 7); g.fill() }
})

// Rangoli: dense symmetrical mandala with a transparent edge, drawn once on a canvas.
export const rangoliTex = mk(1536, 1536, g => {
  const S = 1536; g.translate(S / 2, S / 2); g.scale(S / 768, S / 768)
  const cols = ['#ff2f7e', '#ff9a1f', '#ffd21f', '#7a35ff', '#1f7bff', '#ff4a2a', '#18b86a', '#ffffff']
  const bg = g.createRadialGradient(0, 0, 0, 0, 0, 378); bg.addColorStop(0, '#fff4dc'); bg.addColorStop(1, '#f6e2c0')
  g.fillStyle = bg; g.beginPath(); g.arc(0, 0, 376, 0, 7); g.fill()
  const petal = (r, n, len, w, off, pal, outline) => { for (let i = 0; i < n; i++) { g.save(); g.rotate(i / n * Math.PI * 2); const c = pal[(i + off) % pal.length]
    g.beginPath(); g.moveTo(0, -r + len * .15); g.bezierCurveTo(w, -r - len * .2, w * .8, -r - len * .8, 0, -r - len); g.bezierCurveTo(-w * .8, -r - len * .8, -w, -r - len * .2, 0, -r + len * .15)
    g.fillStyle = c; g.fill(); if (outline) { g.strokeStyle = outline; g.lineWidth = 2.2; g.stroke() }
    g.beginPath(); g.moveTo(0, -r - len * .1); g.quadraticCurveTo(w * .25, -r - len * .45, 0, -r - len * .8); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; g.stroke(); g.restore() } }
  const dots = (r, n, s, c) => { g.fillStyle = c; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, s, 0, 7); g.fill() } }
  const tri = (r, n, len, w, c) => { g.fillStyle = c; for (let i = 0; i < n; i++) { g.save(); g.rotate(i / n * Math.PI * 2); g.beginPath(); g.moveTo(-w, -r); g.lineTo(0, -r - len); g.lineTo(w, -r); g.closePath(); g.fill(); g.restore() } }
  const ring = (r, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke() }
  ring(366, 8, '#7a2a12'); dots(350, 96, 4.5, '#fff'); tri(334, 48, 24, 10, '#ff4a2a'); tri(334, 48, 12, 5, '#ffd21f')
  ring(322, 4, '#7a35ff'); petal(318, 24, 62, 30, 0, [cols[0], cols[1], cols[2], cols[4]], '#4a1030')
  dots(244, 72, 5, '#18b86a'); ring(236, 5, '#ff9a1f')
  petal(232, 16, 70, 34, 1, [cols[3], cols[0], cols[5], cols[4]], '#2a0a40'); dots(160, 48, 5.5, '#ffd21f')
  ring(150, 6, '#ffffff'); tri(148, 32, 30, 12, '#1f7bff'); ring(116, 4, '#ff2f7e')
  petal(112, 12, 52, 26, 2, [cols[2], cols[0], cols[1], cols[6]], '#5a1a00'); dots(66, 24, 6, '#fff')
  petal(60, 8, 42, 20, 0, [cols[5], cols[3]], '#300'); ring(28, 10, '#ff2f7e')
  g.fillStyle = '#ffd21f'; g.beginPath(); g.arc(0, 0, 22, 0, 7); g.fill(); g.fillStyle = '#ff2f7e'; g.beginPath(); g.arc(0, 0, 11, 0, 7); g.fill()
  g.save(); g.globalCompositeOperation = 'destination-in'; const m = g.createRadialGradient(0, 0, 360, 0, 0, 378); m.addColorStop(0, '#fff'); m.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = m; g.fillRect(-400, -400, 800, 800); g.restore()
})
