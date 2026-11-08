import { useRef, useMemo, useLayoutEffect, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { tileMap, tileRough, tileBump, plaster, plasterBump, wood, clay, shadowTex, rangoliTex, glowTex, leafTex } from './textures.js'
import { Marigold, catenary } from './House.jsx'

export const RZ = 4.2        // rangoli centre (world z)
export const RR = 2.8        // rangoli radius
const std = o => new THREE.MeshStandardMaterial(o)

const barkTex = wood('#3a2a1d')
const floorMat = std({ map: tileMap, roughnessMap: tileRough, bumpMap: tileBump, bumpScale: 2.2, roughness: .72, metalness: 0 })
const wallMat = std({ map: plaster('#e3d2b0', 6, 1), bumpMap: plasterBump, bumpScale: 1.2, roughness: .93 })
const baseMat = std({ map: plaster('#86301f', 6, 1), roughness: .9 })
const capMat = std({ map: plaster('#f0e1c2', 6, 1), roughness: .9 })

function FloorImpl() {
  return <>
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, 3.5]} receiveShadow material={floorMat}><planeGeometry args={[16, 15]} /></mesh>
    <mesh rotation-x={-Math.PI / 2} position-y={-.02}><planeGeometry args={[300, 300]} /><meshStandardMaterial color="#14110e" roughness={1} /></mesh>
  </>
}

function WallsImpl() {
  const z0 = -3.1, z1 = 10.8, len = z1 - z0, cz = (z0 + z1) / 2
  const strands = useMemo(() => {
    const s = []; for (const x of [-6.95, 6.95]) for (let z = -2; z < 9.5; z += 2.4) s.push([[x, 2.2, z], [x, 2.2, z + 2.4], .28]); return s
  }, [])
  return <>{[-7.2, 7.2].map(x => <group key={x} position={[x, 0, cz]}>
    <mesh position-y={1.1} material={wallMat} castShadow receiveShadow><boxGeometry args={[.4, 2.2, len]} /></mesh>
    <mesh position-y={.25} material={baseMat} receiveShadow><boxGeometry args={[.46, .5, len + .04]} /></mesh>
    <mesh position-y={2.27} material={capMat} castShadow><boxGeometry args={[.62, .14, len + .2]} /></mesh>
  </group>)}
    <Marigold strands={strands} /></>
}

function Tree({ p, s = 1, seed = 1 }) {
  const blobs = useMemo(() => { let r = seed * 9301; const rn = () => (r = (r * 9301 + 49297) % 233280) / 233280
    return Array.from({ length: 11 }, () => ({ p: [(rn() - .5) * 3, 4.4 + rn() * 2.4, (rn() - .5) * 3], s: 1.1 + rn() * .9, c: new THREE.Color().setHSL(.27 + rn() * .08, .45, .1 + rn() * .08) })) }, [seed])
  return <group position={p} scale={s}>
    <mesh position-y={1.7} castShadow receiveShadow><cylinderGeometry args={[.22, .38, 3.5, 9]} /><meshStandardMaterial map={barkTex} roughness={1} /></mesh>
    {blobs.map((b, i) => <mesh key={i} position={b.p} scale={b.s} castShadow receiveShadow><icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color={b.c} map={leafTex} roughness={.95} flatShading /></mesh>)}
  </group>
}

const potGeo = (() => new THREE.LatheGeometry([[0, 0], [.2, 0], [.27, .1], [.34, .3], [.37, .42], [.4, .46], [.4, .5], [.34, .5], [.3, .45]].map(([r, y]) => new THREE.Vector2(r, y)), 20))()
const potMat = std({ map: clay, roughness: .85, side: THREE.DoubleSide })
function Pot({ p, s = 1, flowers = true }) {
  const bits = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ p: [Math.cos(i * 2.4) * .2, .65 + (i % 3) * .1, Math.sin(i * 2.4) * .2], s: .2 + (i % 3) * .05 })), [])
  const fl = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ p: [Math.cos(i * 2.1) * .27, .78 + (i % 4) * .08, Math.sin(i * 2.1) * .27], c: i % 2 ? '#ff8a00' : '#ffc400' })), [])
  return <group position={p} scale={s}>
    <mesh rotation-x={-Math.PI / 2} position-y={.006}><planeGeometry args={[1.5, 1.5]} /><meshBasicMaterial map={shadowTex} transparent depthWrite={false} opacity={.8} /></mesh>
    <mesh geometry={potGeo} material={potMat} castShadow receiveShadow />
    <mesh position-y={.48} rotation-x={-Math.PI / 2}><circleGeometry args={[.3, 14]} /><meshStandardMaterial color="#2a1a10" roughness={1} /></mesh>
    {bits.map((b, i) => <mesh key={i} position={b.p} scale={b.s} castShadow><icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color={i % 2 ? '#2f5f2a' : '#3b7233'} roughness={.9} flatShading /></mesh>)}
    {flowers && fl.map((b, i) => <mesh key={i} position={b.p} scale={.075}><icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color={b.c} emissive="#8a3a00" emissiveIntensity={.4} roughness={.8} /></mesh>)}
  </group>
}

function Tulsi({ p }) { // tulsi vrindavan: a plastered pedestal with a sacred basil plant
  return <group position={p}>
    <mesh rotation-x={-Math.PI / 2} position-y={.006}><planeGeometry args={[2, 2]} /><meshBasicMaterial map={shadowTex} transparent depthWrite={false} opacity={.8} /></mesh>
    <mesh position-y={.45} material={capMat} castShadow receiveShadow><boxGeometry args={[.8, .9, .8]} /></mesh>
    <mesh position-y={.95} material={baseMat} castShadow><boxGeometry args={[.95, .12, .95]} /></mesh>
    <mesh position={[0, .42, .41]}><boxGeometry args={[.34, .4, .02]} /><meshStandardMaterial color="#2a1008" /></mesh>
    {Array.from({ length: 8 }).map((_, i) => <mesh key={i} position={[Math.cos(i * 2.3) * .18, 1.22 + (i % 3) * .1, Math.sin(i * 2.3) * .18]} scale={.2} castShadow><icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color="#3f8a35" roughness={.9} flatShading /></mesh>)}
  </group>
}

function GardenImpl({ low }) {
  const lights = useMemo(() => { const pts = []; for (const [x, z] of [[-9.2, 2], [9.4, 6]]) for (let i = 0; i < 46; i++) pts.push(x + (Math.random() - .5) * 4.2, 4 + Math.random() * 3.4, z + (Math.random() - .5) * 3.4); return new Float32Array(pts) }, [])
  return <>
    <Tree p={[-9.4, 0, 2]} s={1.15} seed={3} /><Tree p={[9.6, 0, 6]} s={1.25} seed={7} />
    {!low && <><Tree p={[-10.5, 0, 9]} s={1} seed={5} /><Tree p={[10, 0, -2]} s={1.1} seed={9} /></>}
    <points frustumCulled={false}><bufferGeometry><bufferAttribute attach="attributes-position" array={lights} count={lights.length / 3} itemSize={3} /></bufferGeometry>
      <pointsMaterial size={.4} map={glowTex} color="#ffd890" transparent depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation /></points>
    <Pot p={[-2.2, 0, -1.4]} s={1.1} /><Pot p={[2.2, 0, -1.4]} s={1.1} /><Pot p={[-6.4, 0, 0]} s={1.2} /><Pot p={[6.4, 0, 0.6]} s={1.2} />
    <Pot p={[-6.4, 0, 8.6]} s={1.1} /><Pot p={[6.4, 0, 8.6]} s={1.1} /><Pot p={[-6.5, 0, 4.4]} s={.9} /><Pot p={[6.5, 0, 4.8]} s={.9} />
    <Tulsi p={[-5.2, 0, 1.6]} />
  </>
}

// Scattered marigold / rose petals, clustered around the rangoli border and over the courtyard.
function PetalsImpl({ low }) {
  const ref = useRef(), n = low ? 160 : 320
  useLayoutEffect(() => {
    const o = new THREE.Object3D(), cols = ['#ff8a00', '#ffb300', '#ff5a8a', '#ffd21f', '#ff6a2a', '#ffffff']
    for (let i = 0; i < n; i++) {
      const near = Math.random() < .6, a = Math.random() * 6.28, r = near ? RR + .1 + Math.random() * 1.4 : 1 + Math.random() * 7
      const x = near ? Math.cos(a) * r : (Math.random() - .5) * 13, z = near ? RZ + Math.sin(a) * r : -1.2 + Math.random() * 11
      o.position.set(x, .012 + Math.random() * .01, z); o.rotation.set(-Math.PI / 2 + (Math.random() - .5) * .3, 0, Math.random() * 6.28)
      o.scale.set(.7 + Math.random() * .6, 1 + Math.random() * .8, 1); o.updateMatrix(); ref.current.setMatrixAt(i, o.matrix); ref.current.setColorAt(i, new THREE.Color(cols[i % cols.length]))
    }
    ref.current.instanceMatrix.needsUpdate = true; ref.current.instanceColor.needsUpdate = true
  }, [n])
  return <instancedMesh ref={ref} args={[null, null, n]} receiveShadow><circleGeometry args={[.07, 7]} /><meshStandardMaterial roughness={.75} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-1} /></instancedMesh>
}

// Rangoli lies flat on the tiles. Coloured-powder reveal expands from the centre outward with a grainy edge and glitter front.
const rVert = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }'
const rFrag = `
uniform sampler2D uMap; uniform float uReveal, uLight; varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
void main(){
  vec2 c = vUv - .5; float r = length(c) * 2.;
  vec4 t = texture2D(uMap, vUv);
  float n = h(floor(vUv * 320.));
  float edge = uReveal * 1.18 - r;
  float a = smoothstep(0., .08, edge + (n - .5) * .16);
  float grain = .8 + .35 * h(floor(vUv * 760.) + 3.);
  float band = smoothstep(0., .05, edge) * smoothstep(.2, .03, edge);
  vec3 col = t.rgb * grain * uLight + band * vec3(1., .8, .4) * .5 * n;
  gl_FragColor = vec4(col, t.a * a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`
export function Rangoli({ show, wave }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: rVert, fragmentShader: rFrag, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    uniforms: { uMap: { value: rangoliTex }, uReveal: { value: 0 }, uLight: { value: .75 } } }), [])
  const k = useRef(0)
  useFrame((_, dt) => {
    k.current = show ? Math.min(1, k.current + dt / 3.8) : 0
    const e = 1 - Math.pow(1 - k.current, 2.2)
    mat.uniforms.uReveal.value = e; mat.uniforms.uLight.value = .78 + .4 * Math.min(1, wave.current)
  })
  return <mesh position={[0, .016, RZ]} rotation-x={-Math.PI / 2} material={mat} renderOrder={1}><planeGeometry args={[RR * 2.04, RR * 2.04]} /></mesh>
}

function SkyImpl() {
  const mat = useMemo(() => new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `varying vec3 vP; void main(){ float h = clamp(vP.y, 0., 1.);
      vec3 top = vec3(.012,.03,.11), mid = vec3(.05,.07,.22), hor = vec3(.20,.15,.32);
      vec3 col = mix(hor, mid, smoothstep(0., .22, h)); col = mix(col, top, smoothstep(.2, .75, h));
      col += vec3(.30,.13,.05) * exp(-h * 9.) * .5; gl_FragColor = vec4(col, 1.); }` }), [])
  return <mesh material={mat} renderOrder={-10}><sphereGeometry args={[150, 24, 16]} /></mesh>
}

function SkylineImpl() {
  const { boxes, win } = useMemo(() => { let r = 11; const rn = () => (r = (r * 9301 + 49297) % 233280) / 233280
    const boxes = [], w = []
    for (let i = 0; i < 16; i++) { const x = -60 + i * 7.8 + rn() * 3, h = 6 + rn() * 9, d = 5 + rn() * 3, z = -30 - rn() * 14; boxes.push({ p: [x, h / 2, z], s: [d + 2, h, d] })
      for (let k = 0; k < 7; k++) if (rn() > .35) w.push(x + (rn() - .5) * d, 1.5 + rn() * (h - 2), z + d / 2 + .1) }
    return { boxes, win: new Float32Array(w) } }, [])
  return <>{boxes.map((b, i) => <mesh key={i} position={b.p}><boxGeometry args={b.s} /><meshStandardMaterial color="#0c1230" roughness={1} /></mesh>)}
    <points frustumCulled={false}><bufferGeometry><bufferAttribute attach="attributes-position" array={win} count={win.length / 3} itemSize={3} /></bufferGeometry>
      <pointsMaterial size={.9} map={glowTex} color="#ffc060" transparent depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation /></points></>
}

export const Floor = memo(FloorImpl), Walls = memo(WallsImpl), Garden = memo(GardenImpl), Petals = memo(PetalsImpl), Sky = memo(SkyImpl), Skyline = memo(SkylineImpl)
