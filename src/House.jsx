import { useRef, useMemo, useLayoutEffect, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { plaster, plasterBump, wood, roofTile, glowTex, mk } from './textures.js'

const std = (o) => new THREE.MeshStandardMaterial(o)
const M = {
  wall: std({ map: plaster('#e4cfa8', 3, 1.2), bumpMap: plasterBump, bumpScale: 1.4, roughness: .93 }),
  wallUp: std({ map: plaster('#ecd9b6', 2.5, 1.2), bumpMap: plasterBump, bumpScale: 1.4, roughness: .93 }),
  plinth: std({ map: plaster('#86301f', 4, 1), bumpMap: plasterBump, bumpScale: 1, roughness: .9 }),
  trim: std({ map: wood('#3a2012'), roughness: .65 }),
  door: std({ map: wood('#5b3118'), roughness: .6 }),
  stone: std({ map: plaster('#a89478', 1, 1), bumpMap: plasterBump, roughness: .9 }),
  cream: std({ map: plaster('#f0e1c2', 1, 1), bumpMap: plasterBump, roughness: .9 }),
  roof: std({ map: roofTile, roughness: .55 }),
  iron: std({ color: '#1a130e', metalness: .6, roughness: .5 }),
  gold: std({ color: '#c9962b', metalness: .8, roughness: .35 }),
  marigold: std({ color: '#ffffff', roughness: .8, emissive: '#9a3f00', emissiveIntensity: .35 }),
}
const glassTex = mk(64, 128, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffd27a'); gr.addColorStop(.5, '#ffeab0'); gr.addColorStop(1, '#ffc060'); g.fillStyle = gr; g.fillRect(0, 0, w, h)
  for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(150,70,20,${.12 + Math.random() * .1})`; g.fillRect(i * w / 6, 0, 3, h) } // curtain folds
})
const doorTex = mk(64, 128, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffb55a'); gr.addColorStop(.4, '#ffe6a6'); gr.addColorStop(1, '#b86a28'); g.fillStyle = gr; g.fillRect(0, 0, w, h)
  g.fillStyle = 'rgba(80,30,5,.35)'; g.beginPath(); g.ellipse(w * .5, h * .72, 9, 22, 0, 0, 7); g.fill()
})
const glassMat = new THREE.MeshBasicMaterial({ map: glassTex }), doorGlow = new THREE.MeshBasicMaterial({ map: doorTex })

const B = ({ p, s, m, r }) => <mesh position={p} rotation={r} material={m} castShadow receiveShadow><boxGeometry args={s} /></mesh>

function Inst({ geo, mat, items, cast }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const o = new THREE.Object3D()
    items.forEach((it, i) => { o.position.set(...it.p); o.rotation.set(...(it.r || [0, 0, 0])); o.scale.set(...(it.s || [1, 1, 1])); o.updateMatrix(); ref.current.setMatrixAt(i, o.matrix); if (it.c) ref.current.setColorAt(i, new THREE.Color(it.c)) })
    ref.current.instanceMatrix.needsUpdate = true; if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [items])
  return <instancedMesh ref={ref} args={[geo, mat, items.length]} castShadow={cast} receiveShadow />
}
const boxGeo = new THREE.BoxGeometry(1, 1, 1), beadGeo = new THREE.IcosahedronGeometry(.075, 1)

export const catenary = (a, b, n, sag) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * sag, a[2] + (b[2] - a[2]) * t] })

// Marigold garland: dense jittered beads in orange/yellow along a sagging curve.
export function Marigold({ strands }) {
  const items = useMemo(() => {
    const cols = ['#ff8a00', '#ffb300', '#ff6a00', '#ffc400', '#e85500'], out = []
    strands.forEach(([a, b, sag]) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(6, Math.ceil(len / .09))
      catenary(a, b, n, sag).forEach((p, i) => { for (let k = 0; k < 2; k++) out.push({ p: [p[0] + (Math.random() - .5) * .07, p[1] + (Math.random() - .5) * .07, p[2] + (Math.random() - .5) * .07], s: [1, .85, 1].map(v => v * (.8 + Math.random() * .5)), c: cols[(i + k) % cols.length] }) })
    })
    return out
  }, [strands])
  return <Inst geo={beadGeo} mat={M.marigold} items={items} />
}

function Win({ p, w = .95, h = 1.35, bars = 3 }) {
  return <group position={p}>
    <B p={[0, 0, .06]} s={[w + .3, h + .3, .12]} m={M.trim} />
    <mesh position={[0, 0, .126]} material={glassMat}><planeGeometry args={[w, h]} /></mesh>
    {Array.from({ length: bars }).map((_, i) => <B key={i} p={[-w / 2 + (i + .5) * w / bars, 0, .17]} s={[.028, h, .028]} m={M.iron} />)}
    <B p={[0, 0, .16]} s={[w, .04, .04]} m={M.iron} />
    <B p={[0, -h / 2 - .2, .14]} s={[w + .45, .09, .3]} m={M.stone} />
    <B p={[0, h / 2 + .22, .1]} s={[w + .42, .13, .22]} m={M.cream} />
    <sprite position={[0, 0, .8]} scale={[w * 3.4, h * 2.6, 1]}><spriteMaterial map={glowTex} color="#ffb85c" opacity={.28} blending={THREE.AdditiveBlending} transparent depthWrite={false} /></sprite>
  </group>
}

function Door({ p, w = 1.5, h = 2.6, open = 1.1 }) {
  const leaf = (side) => <group position={[side * (w / 2 - .03), 0, .12]} rotation-y={side < 0 ? -open : open}>
    <mesh position={[-side * (w / 4 - .01), h / 2, 0]} material={M.door} castShadow><boxGeometry args={[w / 2 - .04, h - .05, .07]} /></mesh>
    {[.25, .5, .75].map(f => <B key={f} p={[-side * (w / 4 - .01), h * f, .045]} s={[w / 2 - .12, .07, .03]} m={M.trim} />)}
    <B p={[-side * (w / 2 - .12), h * .5, .06]} s={[.04, .12, .03]} m={M.gold} />
  </group>
  return <group position={p}>
    <mesh position={[0, h / 2, .02]} material={doorGlow}><planeGeometry args={[w, h]} /></mesh>
    <B p={[-w / 2 - .11, h / 2 + .1, .1]} s={[.24, h + .2, .34]} m={M.trim} /><B p={[w / 2 + .11, h / 2 + .1, .1]} s={[.24, h + .2, .34]} m={M.trim} />
    <B p={[0, h + .15, .1]} s={[w + .8, .3, .36]} m={M.trim} /><B p={[0, h + .38, .1]} s={[w + 1.1, .14, .42]} m={M.cream} />
    <B p={[0, .04, .14]} s={[w + .2, .08, .4]} m={M.stone} />
    {leaf(-1)}{leaf(1)}
    <sprite position={[0, h * .5, 1.2]} scale={[w * 4, h * 2.2, 1]}><spriteMaterial map={glowTex} color="#ffb04a" opacity={.38} blending={THREE.AdditiveBlending} transparent depthWrite={false} /></sprite>
  </group>
}

export function useFacadeLights() {
  return useMemo(() => {
    const pts = []
    const add = (a, b, n, s) => catenary(a, b, n, s).forEach(p => pts.push(...p))
    add([-4.7, 7.55, 1.85], [4.7, 7.55, 1.85], 44, .32); add([-5.6, 7.15, 2.3], [5.6, 4.3, 2.7], 0, 0)
    add([-4.6, 6.55, 1.55], [4.6, 6.55, 1.55], 42, .38); add([-5.5, 4.0, 2.45], [5.5, 4.0, 2.45], 52, .3)
    add([-5.6, 3.85, 2.3], [-7, 2.7, 8.8], 40, .45); add([5.6, 3.85, 2.3], [7, 2.7, 8.8], 40, .45)
    add([-7, 2.7, 8.8], [7, 2.7, 8.8], 70, .9); add([-1.5, 3.1, 3.9], [1.5, 3.1, 3.9], 14, .12)
    add([-4.3, 5.2, 1.5], [-4.3, 7.3, 1.5], 12, 0); add([4.3, 5.2, 1.5], [4.3, 7.3, 1.5], 12, 0)
    return new Float32Array(pts)
  }, [])
}

function House({ low }) {
  const pts = useFacadeLights(), pm = useRef()
  useFrame(({ clock }) => { if (pm.current) pm.current.size = .5 + .06 * Math.sin(clock.elapsedTime * 2.3) })
  const balusters = useMemo(() => {
    const a = []; for (let x = -3.35; x <= 3.36; x += .2) a.push({ p: [x, 4.3, 2.75], s: [.05, .9, .05] })
    for (let z = 1.55; z < 2.7; z += .2) { a.push({ p: [-3.55, 4.3, z], s: [.05, .9, .05] }); a.push({ p: [3.55, 4.3, z], s: [.05, .9, .05] }) }
    return a
  }, [])
  const crenels = useMemo(() => { const a = []; for (let x = -4.4; x <= 4.41; x += .55) if (Math.abs(x) > 1.9) a.push({ p: [x, 7.58, 1.45], s: [.28, .28, .28] }); return a }, [])
  const strands = useMemo(() => [
    [[-.95, 2.85, 2.3], [.95, 2.85, 2.3], .14], [[-.95, 2.85, 2.3], [-.95, 1.25, 2.3], 0], [[.95, 2.85, 2.3], [.95, 1.25, 2.3], 0],
    [[-3.45, 4.95, 2.8], [3.45, 4.95, 2.8], .4], [[-3.45, 4.95, 2.8], [-3.45, 4.95, 1.5], .08], [[3.45, 4.95, 2.8], [3.45, 4.95, 1.5], .08],
    [[-.8, 6.15, 1.45], [.8, 6.15, 1.45], .15],
    [[-4.25, 3.35, 2.2], [-2.95, 3.35, 2.2], .15], [[2.95, 3.35, 2.2], [4.25, 3.35, 2.2], .15],
    [[-3.75, 6.1, 1.5], [-2.45, 6.1, 1.5], .15], [[2.45, 6.1, 1.5], [3.75, 6.1, 1.5], .15],
  ], [])
  return <group position={[0, 0, -5]}>
    {/* main bodies */}
    <B p={[0, 1.8, 0]} s={[11, 3.6, 4]} m={M.wall} />
    <B p={[0, .27, 0]} s={[11.2, .55, 4.2]} m={M.plinth} />
    <B p={[0, 5.2, -.2]} s={[9, 3.2, 3.2]} m={M.wallUp} />
    <B p={[0, 3.5, 2.12]} s={[11.4, .22, .45]} m={M.cream} />
    <B p={[0, 3.72, 2.1]} s={[7.4, .22, 1.5]} m={M.stone} />
    {/* terrace parapets on ground-floor roof */}
    <B p={[-5.2, 3.9, 1.9]} s={[1.2, .6, .22]} m={M.wall} /><B p={[5.2, 3.9, 1.9]} s={[1.2, .6, .22]} m={M.wall} />
    {/* upper roof parapet, pediment, crenellations */}
    <B p={[0, 7.1, 1.45]} s={[9.2, .6, .3]} m={M.wallUp} /><B p={[0, 7.46, 1.45]} s={[9.5, .12, .5]} m={M.cream} />
    <B p={[0, 7.85, 1.45]} s={[3.2, 1.1, .3]} m={M.wallUp} /><B p={[0, 8.46, 1.45]} s={[3.5, .12, .5]} m={M.cream} />
    <B p={[0, 7.9, 1.62]} s={[.9, .7, .06]} m={M.plinth} />
    {[-1.6, 0, 1.6].map(x => <mesh key={x} position={[x, 8.62, 1.45]} material={M.gold}><sphereGeometry args={[.1, 10, 10]} /></mesh>)}
    <Inst geo={boxGeo} mat={M.cream} items={crenels} cast />
    {/* windows */}
    <Win p={[-3.6, 2.05, 2]} /><Win p={[3.6, 2.05, 2]} />
    <Win p={[-3.1, 5.3, 1.4]} h={1.5} /><Win p={[3.1, 5.3, 1.4]} h={1.5} />
    {/* doors */}
    <Door p={[0, .0, 2]} /><Door p={[0, 3.82, 1.4]} w={1.3} h={2.3} open={1.25} />
    {/* entrance steps */}
    <B p={[0, .18, 2.25]} s={[3.4, .36, .5]} m={M.stone} /><B p={[0, .12, 2.5]} s={[3.4, .24, 1]} m={M.stone} /><B p={[0, .06, 3.35]} s={[3.4, .12, .7]} m={M.stone} />
    {/* tiled awning + pillars */}
    <mesh position={[0, 3.05, 2.85]} rotation-x={.22} material={M.roof} castShadow receiveShadow><boxGeometry args={[3.2, .13, 1.9]} /></mesh>
    {[-1.5, 1.5].map(x => <mesh key={x} position={[x, 1.45, 3.65]} material={M.trim} castShadow><cylinderGeometry args={[.09, .11, 2.9, 10]} /></mesh>)}
    {/* balcony railing */}
    <B p={[0, 4.78, 2.75]} s={[7.2, .09, .1]} m={M.trim} /><B p={[0, 3.9, 2.75]} s={[7.2, .07, .09]} m={M.trim} />
    <B p={[-3.55, 4.78, 2.12]} s={[.1, .09, 1.3]} m={M.trim} /><B p={[3.55, 4.78, 2.12]} s={[.1, .09, 1.3]} m={M.trim} />
    <Inst geo={boxGeo} mat={M.trim} items={balusters} />
    {[-3.4, -1.7, 1.7, 3.4].map(x => <B key={x} p={[x, 3.3, 2.1]} s={[.2, .5, .8]} m={M.trim} r={[0, 0, 0]} />)}
    {/* decorations */}
    <Marigold strands={strands} />
    <points frustumCulled={false}><bufferGeometry><bufferAttribute attach="attributes-position" array={pts} count={pts.length / 3} itemSize={3} /></bufferGeometry>
      <pointsMaterial ref={pm} size={.5} map={glowTex} color="#ffe0a0" transparent depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation /></points>
    {/* warm light spilling from windows, doors and balcony onto the courtyard */}
    <pointLight position={[0, 1.8, 4.2]} color="#ffa940" intensity={16} distance={11} decay={2} />
    <pointLight position={[0, 5.0, 4.2]} color="#ffb85c" intensity={10} distance={9} decay={2} />
    {!low && <><pointLight position={[-3.6, 2, 3.4]} color="#ffb04a" intensity={7} distance={7} decay={2} /><pointLight position={[3.6, 2, 3.4]} color="#ffb04a" intensity={7} distance={7} decay={2} /></>}
  </group>
}

export default memo(House)
