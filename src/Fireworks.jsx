import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { glowTex } from './textures.js'
import { sfx } from './audio.js'

const rnd = (a = 0, b = 1) => a + Math.random() * (b - a)
const pick = a => a[Math.floor(Math.random() * a.length)]
const PAL = [[1, .82, .35], [1, .4, .12], [1, .2, .3], [.75, .35, 1], [.3, .6, 1], [1, .4, .75], [.3, 1, .7], [1, 1, .9]]
const GOLD = [1, .72, .25]
export const FIREWORK_TYPES = [
  ['rocket', 'Sky rocket'], ['chakri', 'Chakri'], ['anar', 'Anar'], ['phuljhari', 'Phuljhari'], ['ladi', 'Ladi'], ['fountain', 'Golden fountain'],
  ['peony', 'Peony'], ['willow', 'Willow'], ['chrysanthemum', 'Chrysanthemum'], ['ring', 'Ring'], ['heart', 'Heart'], ['finale', 'Grand finale'],
]

const mkPool = N => ({ N, head: 0, pos: new Float32Array(N * 3), vel: new Float32Array(N * 3), col: new Float32Array(N * 3), base: new Float32Array(N * 3),
  size: new Float32Array(N), a: new Float32Array(N), life: new Float32Array(N), max: new Float32Array(N).fill(1), drag: new Float32Array(N), grav: new Float32Array(N),
  sz0: new Float32Array(N), trail: new Float32Array(N), acc: new Float32Array(N), tw: new Float32Array(N) })
const emit = (P, x, y, z, vx, vy, vz, c, size, life, drag, grav, trail = 0, tw = 0) => {
  const k = P.head++ % P.N, j = k * 3
  P.pos[j] = x; P.pos[j + 1] = y; P.pos[j + 2] = z; P.vel[j] = vx; P.vel[j + 1] = vy; P.vel[j + 2] = vz
  P.base[j] = c[0]; P.base[j + 1] = c[1]; P.base[j + 2] = c[2]; P.sz0[k] = size; P.size[k] = size; P.life[k] = life; P.max[k] = life
  P.drag[k] = drag; P.grav[k] = grav; P.trail[k] = trail; P.acc[k] = 0; P.tw[k] = tw
}
const step = (P, dt, time, smoke) => {
  for (let i = 0; i < P.N; i++) {
    if (P.life[i] <= 0) { P.size[i] = 0; continue }
    P.life[i] -= dt
    if (P.life[i] <= 0) { P.size[i] = 0; P.a[i] = 0; continue }
    const j = i * 3, f = P.life[i] / P.max[i], d = Math.exp(-P.drag[i] * dt)
    P.vel[j] *= d; P.vel[j + 1] = P.vel[j + 1] * d - P.grav[i] * dt; P.vel[j + 2] *= d
    P.pos[j] += P.vel[j] * dt; P.pos[j + 1] += P.vel[j + 1] * dt; P.pos[j + 2] += P.vel[j + 2] * dt
    if (!smoke) {
      if (P.trail[i] > 0) { P.acc[i] += dt; let g = 0; while (P.acc[i] > P.trail[i] && g++ < 3) { P.acc[i] -= P.trail[i]
        emit(P, P.pos[j], P.pos[j + 1], P.pos[j + 2], rnd(-.3, .3), rnd(-.3, .3), rnd(-.3, .3), [P.base[j] * .9, P.base[j + 1] * .8, P.base[j + 2] * .6], P.sz0[i] * .55, rnd(.4, .8), 2, 1.2) } }
      const hot = Math.max(0, (f - .72) / .28)
      P.col[j] = P.base[j] + (1 - P.base[j]) * hot; P.col[j + 1] = P.base[j + 1] + (1 - P.base[j + 1]) * hot; P.col[j + 2] = P.base[j + 2] + (1 - P.base[j + 2]) * hot
      P.a[i] = Math.min(1, f * 1.8) * (P.tw[i] ? .65 + .35 * Math.sin(time * 38 + i * 7) : 1)
      P.size[i] = P.sz0[i] * (.45 + .55 * Math.min(1, f * 1.5))
    } else { const g = 1 - f; P.a[i] = Math.min(g * 6, 1) * f * .16; P.size[i] = P.sz0[i] * (.5 + g * 1.4) }
  }
}

const pVert = `attribute float aSize; attribute float aAlpha; attribute vec3 aColor; uniform float uScale; varying float vA; varying vec3 vC;
void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mv; gl_PointSize = aSize * uScale / max(.1, -mv.z); vA = aAlpha; vC = aColor; }`
const pFrag = `uniform sampler2D uMap; uniform float uCore; varying float vA; varying vec3 vC;
void main(){ float a = texture2D(uMap, gl_PointCoord).a; float core = pow(a, 3.) * uCore; gl_FragColor = vec4(vC * (a + core) * 1.5, a * vA); }`
const sFrag = `uniform sampler2D uMap; varying float vA; varying vec3 vC;
void main(){ float a = texture2D(uMap, gl_PointCoord).a; gl_FragColor = vec4(vC, a * vA); }`

function PointsLayer({ P, smoke, scale }) {
  const geo = useRef()
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: pVert, fragmentShader: smoke ? sFrag : pFrag, transparent: true, depthWrite: false, blending: smoke ? THREE.NormalBlending : THREE.AdditiveBlending,
    uniforms: { uMap: { value: glowTex }, uScale: { value: 800 }, uCore: { value: 1 } } }), [smoke])
  useEffect(() => () => mat.dispose(), [mat])
  useFrame(() => { mat.uniforms.uScale.value = scale.current; const g = geo.current; ;['position', 'aColor', 'aSize', 'aAlpha'].forEach(n => { g.attributes[n].needsUpdate = true }) })
  const smokeCol = useMemo(() => { const c = new Float32Array(P.N * 3); for (let i = 0; i < P.N; i++) { c[i * 3] = .42; c[i * 3 + 1] = .44; c[i * 3 + 2] = .56 } return c }, [P])
  const colArr = smoke ? smokeCol : P.col
  return <points frustumCulled={false} material={mat} renderOrder={smoke ? 3 : 4}>
    <bufferGeometry ref={geo}>
      <bufferAttribute attach="attributes-position" array={P.pos} count={P.N} itemSize={3} />
      <bufferAttribute attach="attributes-aColor" array={colArr} count={P.N} itemSize={3} />
      <bufferAttribute attach="attributes-aSize" array={P.size} count={P.N} itemSize={1} />
      <bufferAttribute attach="attributes-aAlpha" array={P.a} count={P.N} itemSize={1} />
    </bufferGeometry></points>
}

export default function Fireworks({ api, low, onFireworkFeedback }) {
  const { size, gl, camera } = useThree()
  const P = useMemo(() => mkPool(low ? 2600 : 5200), [low]), S = useMemo(() => mkPool(low ? 70 : 140), [low])
  const scale = useRef(800), flash = useRef(), ground = useRef(), gflash = useRef(0), fflash = useRef(0)
  const sim = useMemo(() => ({ t: 0, events: [], rockets: [], emitters: [] }), [])
  const props = useRef([])

  useEffect(() => {
    const puff = (x, y, z, sz = 7, n = 2) => { for (let i = 0; i < n; i++) emit(S, x + rnd(-1, 1), y + rnd(-1, 1), z + rnd(-1, 1), rnd(-.3, .3), rnd(-.1, .2), rnd(-.3, .3), [1, 1, 1], sz * rnd(.7, 1.2), rnd(3, 5), .6, -.05) }
    const flashAt = (x, y, z, c, power) => { const l = flash.current; if (!l) return; l.color.setRGB(c[0], c[1], c[2]); l.position.set(x * .5, Math.max(6, y * .7), 3); fflash.current = power }
    const sph = (x, y, z, n, sp, o) => { const phi0 = rnd(0, 6.28)
      for (let i = 0; i < n; i++) { const y1 = 1 - 2 * (i + .5) / n, r = Math.sqrt(1 - y1 * y1), ph = i * 2.39996 + phi0, s = sp * (1 + rnd(-(o.jit ?? .07), o.jit ?? .07)), c = o.cols ? pick(o.cols) : o.col
        emit(P, x, y, z, Math.cos(ph) * r * s, y1 * s, Math.sin(ph) * r * s, c, o.size ?? .42, (o.life ?? 1.8) * rnd(.85, 1.15), o.drag ?? 1.6, o.grav ?? 2.2, o.trail ?? 0, o.tw ?? 0) } }
    const burst = (type, x, y, z, col) => {
      const n = v => Math.floor(v * (low ? .6 : 1)), c = col || pick(PAL)
      if (type === 'peony') sph(x, y, z, n(170), 9, { col: c, size: .5, life: 1.9 })
      else if (type === 'chrysanthemum') { sph(x, y, z, n(190), 8.6, { col: c, size: .46, life: 2.2, drag: 1.3, trail: low ? .09 : .05, tw: 1 }); sph(x, y, z, n(40), 3.5, { col: [1, 1, .9], size: .4, life: 1.3 }) }
      else if (type === 'willow') sph(x, y, z, n(110), 7.6, { col: GOLD, size: .5, life: 3.8, drag: 2.3, grav: 2.4, trail: low ? .07 : .04, tw: 1 })
      else if (type === 'ring') { const ty = rnd(.15, .55), cs = Math.cos(ty), sn = Math.sin(ty), ry = rnd(-.4, .4), cr = Math.cos(ry), sr = Math.sin(ry), m = n(72)
        for (let i = 0; i < m; i++) { const a = i / m * 6.283, ca = Math.cos(a), sa = Math.sin(a), s = 8.4
          emit(P, x, y, z, ca * cr * s, sa * cs * s, (-ca * sr + sa * sn) * s, c, .5, 2, 1.8, 1.2, 0, 0) }
        sph(x, y, z, n(30), 2.5, { col: [1, 1, .9], size: .35, life: 1.2 }) }
      else if (type === 'heart') { const ry = rnd(-.25, .25), cr = Math.cos(ry), sr = Math.sin(ry), hc = pick([[1, .2, .35], [1, .4, .75], [1, .25, .25]])
        for (let i = 0; i < n(110); i++) { const t = i / n(110) * 6.283, hx = 16 * Math.pow(Math.sin(t), 3) / 16, hy = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16, s = 9
          emit(P, x, y, z, hx * s * cr, hy * s + 1, -hx * s * sr, hc, .5, 2.1, 1.7, 1, 0, 0) }
        sph(x, y, z, n(26), 2.2, { col: [1, .85, .8], size: .35, life: 1.1 }) }
      else sph(x, y, z, n(60), 6, { col: c, size: .35, life: 1.2 })
      puff(x, y, z, 6.5, 2); flashAt(x, y, z, c, type === 'willow' ? 55 : 95); sfx.burst(type)
      onFireworkFeedback && onFireworkFeedback(type === 'finale' ? 'finale' : type)
    }
    const rocket = (type = pick(['peony', 'chrysanthemum', 'willow', 'ring', 'heart', 'peony']), x = rnd(-6, 6), col) => {
      const tx = x + rnd(-1.2, 1.2), ty = rnd(9.5, 14.2), z = rnd(-9, -13), v = rnd(13, 16), T = (ty - 1) / v
      sim.rockets.push({ x, y: 1, z: -8, vx: (tx - x) / T, vy: v, vz: (z + 8) / T, ty, type, col, acc: 0 }); sfx.launch()
      onFireworkFeedback && onFireworkFeedback('rocketLaunch')
    }
    const startGround = (kind, x = rnd(-4.2, 4.2), z = rnd(-.6, .8)) => {
      const dur = { anar: 3.4, fountain: 4.8, chakri: 3.6, phuljhari: 5 }[kind]
      sim.emitters.push({ kind, x, z, t: 0, dur, th: 0, acc: 0, puffT: 0 })
      sfx[kind === 'anar' ? 'fountain' : kind](dur)
      onFireworkFeedback && onFireworkFeedback(kind === 'fountain' ? 'anar' : kind)
    }
    const ladi = () => { const x0 = rnd(-3, 0), z = rnd(-.5, .6); sfx.ladi(16); onFireworkFeedback && onFireworkFeedback('ladi')
      for (let i = 0; i < 16; i++) sim.events.push({ t: sim.t + i * .1 + rnd(0, .04), fn: () => { const x = x0 + i * .35, c = pick([[1, .75, .3], [1, 1, .9], [1, .5, .2]])
        for (let k = 0; k < 14; k++) { const a = rnd(0, 6.28), e = rnd(.2, 1), s = rnd(3, 6); emit(P, x, .25, z, Math.cos(a) * s * (1 - e * .4), e * s * 1.3, Math.sin(a) * s * (1 - e * .4), c, .3, rnd(.25, .5), 2.5, 9, 0, 0) }
        gflash.current = 18; ground.current && ground.current.position.set(x, 1, z + 1.5) } }) }
    const finale = () => {
      const q = (dt, fn) => sim.events.push({ t: sim.t + dt, fn })
      const types = ['peony', 'chrysanthemum', 'ring', 'heart', 'willow']
      for (let i = 0; i < 18; i++) q(i * .38 + rnd(0, .2), () => rocket(types[i % types.length], -6 + (i / 17) * 12 + rnd(-.8, .8)))
      ;[0, 1.2, 2.4, 3.6].forEach((t, i) => q(t, () => { startGround(i % 2 ? 'anar' : 'fountain', -3.6 + i * 2.4); startGround('chakri', 3.2 - i * 2.2) }))
      q(1.5, ladi); q(4.5, ladi); q(.4, () => startGround('phuljhari', -1.2)); q(.8, () => startGround('phuljhari', 1.4))
      q(7.4, () => { rocket('willow', -3.5, GOLD); rocket('chrysanthemum', 3.5); rocket('heart', 0) })
      q(9, () => { rocket('willow', -1.5, GOLD); rocket('willow', 1.5, GOLD); rocket('peony', 0, [1, 1, .9]) })
    }
    api.current = { burst, finale, fire: (type, o = {}) => {
      if (type === 'rocket') rocket(undefined, o.x)
      else if (['peony', 'chrysanthemum', 'willow', 'ring', 'heart'].includes(type)) rocket(type, o.x)
      else if (['chakri', 'anar', 'fountain', 'phuljhari'].includes(type)) startGround(type, o.x)
      else if (type === 'ladi') ladi()
      else if (type === 'finale') { onFireworkFeedback && onFireworkFeedback('finale'); finale() }
    } }
    return () => { api.current = null }
  }, [api, P, S, sim, low, onFireworkFeedback])

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, .05); sim.t += dt
    scale.current = size.height * gl.getPixelRatio() / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2))
    for (let i = sim.events.length - 1; i >= 0; i--) if (sim.events[i].t <= sim.t) { const e = sim.events.splice(i, 1)[0]; e.fn() }
    for (let i = sim.rockets.length - 1; i >= 0; i--) { const r = sim.rockets[i]
      r.x += r.vx * dt; r.y += r.vy * dt; r.z += r.vz * dt
      emit(P, r.x, r.y, r.z, rnd(-.4, .4), -rnd(1, 3), rnd(-.4, .4), [1, .7, .3], .24, rnd(.5, .9), 1, 3, 0, 0)
      emit(P, r.x, r.y, r.z, 0, 0, 0, [1, .95, .8], .55, .07, 0, 0)
      if (r.y >= r.ty) { sim.rockets.splice(i, 1); api.current && api.current.burst(r.type, r.x, r.y, r.z, r.col) } }
    sim.emitters = sim.emitters.filter(e => {
      e.t += dt; const f = e.t / e.dur; if (f >= 1) return false
      const fade = f > .85 ? (1 - f) / .15 : 1
      if (e.kind === 'anar' || e.kind === 'fountain') {
        const gold = e.kind === 'fountain', cnt = Math.floor((gold ? 220 : 170) * dt * (low ? .6 : 1) * fade + Math.random())
        for (let i = 0; i < cnt; i++) { const a = rnd(0, 6.28), cone = rnd(0, gold ? .42 : .3), s = rnd(gold ? 6 : 6.5, gold ? 10 : 10.5)
          const c = gold ? [1, rnd(.6, .8), rnd(.2, .35)] : (Math.random() < .3 ? pick(PAL) : [1, rnd(.55, .9), rnd(.2, .5)])
          emit(P, e.x, .2, e.z, Math.sin(cone) * Math.cos(a) * s, Math.cos(cone) * s, Math.sin(cone) * Math.sin(a) * s, c, gold ? .36 : .3, rnd(.9, 1.7), .4, 9, 0, 1) }
        gflash.current = 40 * fade
        if (e.t - e.puffT > .5) { e.puffT = e.t; emit(S, e.x, 1, e.z, rnd(-.2, .2), .5, rnd(-.2, .2), [1, 1, 1], 2, 4, .8, -.1) }
      } else if (e.kind === 'chakri') {
        e.th += dt * 22; const cnt = Math.floor(5 * (low ? .6 : 1) + Math.random())
        for (let i = 0; i < cnt; i++) { const a = e.th + i * .35, s = rnd(5, 6.5); emit(P, e.x + Math.cos(a) * .12, .2 + Math.sin(e.t * 5) * .03, e.z + Math.sin(a) * .12, -Math.sin(a) * s + Math.cos(a) * 1.4, rnd(.4, 1.6), Math.cos(a) * s + Math.sin(a) * 1.4, [1, rnd(.65, .9), rnd(.3, .6)], .26, rnd(.45, .8), 1, 3, 0, 0) }
        gflash.current = 22 * fade
      } else if (e.kind === 'phuljhari') {
        const hx = e.x + Math.sin(e.t * 1.7) * .25, hy = 1.35 + Math.sin(e.t * 2.3) * .1, cnt = Math.floor(170 * dt * (low ? .6 : 1) * fade + Math.random())
        for (let i = 0; i < cnt; i++) { const a = rnd(0, 6.28), b = Math.acos(rnd(-1, 1)), s = rnd(1.2, 4); emit(P, hx, hy, e.z, Math.sin(b) * Math.cos(a) * s, Math.cos(b) * s + .5, Math.sin(b) * Math.sin(a) * s, [1, rnd(.8, 1), rnd(.5, .8)], .2, rnd(.3, .7), 2.4, 4, 0, 1) }
        gflash.current = 12 * fade
      }
      if (ground.current && e.kind !== 'ladi') ground.current.position.set(e.x, 1.1, e.z + 1)
      return true
    })
    if (sim.emitters.length === 0 && gflash.current > 0) gflash.current *= Math.exp(-dt * 6)
    step(P, dt, state.clock.elapsedTime, false); step(S, dt, 0, true)
    if (flash.current) { fflash.current *= Math.exp(-dt * 3.5); flash.current.intensity = fflash.current }
    if (ground.current) ground.current.intensity = gflash.current * (.8 + .2 * Math.sin(state.clock.elapsedTime * 40))
  })
  return <>
    <PointsLayer P={S} smoke scale={scale} /><PointsLayer P={P} scale={scale} />
    <pointLight ref={flash} intensity={0} distance={60} decay={1.4} /><pointLight ref={ground} position={[0, 1, 1]} color="#ffa23c" intensity={0} distance={14} decay={2} />
  </>
}
