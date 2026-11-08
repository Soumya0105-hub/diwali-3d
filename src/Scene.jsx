import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { U, lanternFlameMaterial, lanternFlameGeo } from './shaders.js'
import { glowTex } from './textures.js'
import House from './House.jsx'
import { Diya } from './Diyas.jsx'
import { Floor, Walls, Garden, Petals, Rangoli, Sky, Skyline, RZ } from './Courtyard.jsx'
import Fireworks from './Fireworks.jsx'
import { sfx } from './audio.js'

// One small tappable diya in the centre foreground.
export const DIYA = [0, 0, RZ - 3]

const colonyWall = new THREE.MeshStandardMaterial({ color: '#674d46', roughness: .92 })
const colonyRoof = new THREE.MeshStandardMaterial({ color: '#8f3d28', roughness: .86 })
const colonyGlow = new THREE.MeshBasicMaterial({ color: '#ffd36b', toneMapped: false })
const colonyPath = new THREE.MeshStandardMaterial({ color: '#7b6a61', roughness: 1 })

function AerialColony({ low }) {
  const homes = useMemo(() => [
    [-14, -12, 1.2], [-5, -14, .9], [6, -13, 1.1], [15, -11, 1.3],
    [-15, -2, 1], [14, 1, 1.15], [-14, 10, 1.1], [-5, 13, .9],
    [6, 14, 1.15], [15, 11, 1], [-19, 5, .8], [19, -5, .85],
  ], [])
  return <group visible>
    <mesh rotation-x={-Math.PI / 2} position-y={-.04} material={colonyPath}><planeGeometry args={[3, 38]} /></mesh>
    <mesh rotation-x={-Math.PI / 2} position={[0, -.035, -1]} material={colonyPath}><planeGeometry args={[38, 2.4]} /></mesh>
    <mesh rotation-x={-Math.PI / 2} position={[0, -.03, 9]} material={colonyPath}><planeGeometry args={[34, 1.5]} /></mesh>
    {[-20, 20].map(x => <mesh key={x} position={[x, .7, 0]} material={colonyWall} castShadow><boxGeometry args={[.45, 1.4, 34]} /></mesh>)}
    {homes.map(([x, z, s], i) => <group key={i} position={[x, 0, z]} scale={s}>
      <mesh position-y={1.15} material={colonyWall} castShadow><boxGeometry args={[5, 2.3, 4]} /></mesh>
      <mesh position={[0, 2.55, 0]} rotation-y={Math.PI / 4} material={colonyRoof} castShadow><coneGeometry args={[3.5, 1.1, 4]} /></mesh>
      {[-1.35, 1.35].map(wx => <mesh key={wx} position={[wx, 1.25, 2.03]} material={colonyGlow}><planeGeometry args={[.6, .7]} /></mesh>)}
      {!low && <pointLight position={[0, 1.5, 2.5]} color="#ffad45" intensity={1.2} distance={5} />}
    </group>)}
    {Array.from({ length: low ? 8 : 14 }).map((_, i) => <group key={i} position={[(i * 17) % 34 - 17, 0, (i * 11) % 26 - 13]}>
      <mesh position-y={1.7} material={colonyWall}><cylinderGeometry args={[.15, .22, 3.4, 8]} /></mesh>
      <mesh position-y={3.5} material={new THREE.MeshStandardMaterial({ color: '#315f39', roughness: 1 })}><icosahedronGeometry args={[1.3, 1]} /></mesh>
    </group>)}
  </group>
}

function Clock({ wave, target }) {
  useFrame((s, dt) => {
    U.uTime.value = s.clock.elapsedTime
    wave.current = target ? Math.min(1.25, wave.current + dt * .21) : 0
    U.uWave.value = wave.current
  })
  return null
}

function Lantern({ stage, launched, onLaunch, onDone, posRef }) {
  const g = useRef(), done = useRef(false), light = useRef()
  const outerFlame = useMemo(() => lanternFlameMaterial(0), [])
  const middleFlame = useMemo(() => lanternFlameMaterial(1), [])
  const coreFlame = useMemo(() => lanternFlameMaterial(2), [])
  useFrame(({ clock }, d) => {
    if (!g.current) return; const t = clock.elapsedTime
    if (launched) { g.current.position.y += d * (1 + g.current.position.y * .06); g.current.position.x += Math.sin(t * .8) * d * .5; g.current.position.z -= d * .8
      if (g.current.position.y > 15 && !done.current) { done.current = true; onDone() } }
    else g.current.position.y = 2.1 + Math.sin(t * 1.5) * .12
    g.current.rotation.y = Math.sin(t * .6) * .3; posRef.current.copy(g.current.position)
    if (light.current) light.current.intensity = 5 + Math.sin(t * 9) * .6
  })
  const vis = stage === 'lantern' || launched
  if (done.current) return null
  return <group ref={g} position={[0, 2.1, RZ + 3.7]} visible={vis} onPointerDown={e => { e.stopPropagation(); if (stage === 'lantern' && !launched) { onLaunch(); sfx.whoosh() } }}>
    <mesh visible={false}><sphereGeometry args={[1.1, 8, 8]} /></mesh>
    <mesh><cylinderGeometry args={[.5, .36, .95, 12, 1, true]} /><meshStandardMaterial color="#ffcf8a" emissive="#ff8a2a" emissiveIntensity={1.7} side={THREE.DoubleSide} transparent opacity={.93} roughness={.3} metalness={.15} /></mesh>
    <group position={[0, -.28, .04]} scale={[1, .72, 1]}>
      <mesh geometry={lanternFlameGeo} material={outerFlame} rotation-y={.08} />
      <mesh geometry={lanternFlameGeo} material={middleFlame} scale={.72} position={[0, .02, .015]} rotation-y={-.12} />
      <mesh geometry={lanternFlameGeo} material={coreFlame} scale={.4} position={[0, .04, .03]} rotation-y={.1} />
    </group>
    <mesh position-y={.5}><coneGeometry args={[.5, .16, 12]} /><meshStandardMaterial color="#c2410c" /></mesh>
    <mesh position-y={-.5}><cylinderGeometry args={[.36, .3, .06, 12]} /><meshStandardMaterial color="#5a2a10" /></mesh>
    <pointLight ref={light} color="#ff9a3c" intensity={5} distance={8} decay={2} />
    <sprite scale={[3, 3, 1]}><spriteMaterial map={glowTex} color="#ffb347" opacity={.7} blending={THREE.AdditiveBlending} transparent depthWrite={false} /></sprite>
    {launched && <Sparkles count={30} scale={[.6, 3, .6]} position-y={-1.5} size={3} speed={.6} color="#ffd36b" />}
  </group>
}

function Rig({ stage, lanternPos }) {
  const { camera, size } = useThree()
  const look = useRef(new THREE.Vector3(0, 3, 0)), lastFov = useRef(camera.fov), aerialStart = useRef(null)
  const aerialPath = useMemo(() => {
    const asp = size.width / size.height, k = asp < 1 ? Math.min(2.2, 1 / (asp * 1.1) + .15) : asp < 1.35 ? 1.2 : 1
    return {
      position: new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 30, 28 * k),
        new THREE.Vector3(-7, 27, 21 * k),
        new THREE.Vector3(5, 21, 17 * k),
        new THREE.Vector3(-2, 13, 14 * k),
        new THREE.Vector3(0, 8.4, 12.8 * k),
        new THREE.Vector3(0, 6.2, 12.6 * k),
      ]),
      target: new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, .8, -.5),
        new THREE.Vector3(0, 1.4, 0),
        new THREE.Vector3(0, 1.8, .7),
        new THREE.Vector3(0, 1.8, 1.4),
        new THREE.Vector3(0, 1.8, 1.6),
      ]),
    }
  }, [size.width, size.height])
  useEffect(() => { aerialStart.current = stage === 'aerial' ? null : aerialStart.current }, [stage])
  useFrame(({ clock }, dt) => {
    const asp = size.width / size.height
    const portrait = asp < 1, narrow = asp < 1.35
    const k = portrait ? Math.min(2.2, 1 / (asp * 1.1) + .15) : narrow ? 1.2 : 1
    const fov = portrait ? 54 : narrow ? 52 : 50
    if (lastFov.current !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); lastFov.current = fov }
    const t = clock.elapsedTime
    if (stage === 'aerial' && aerialStart.current === null) aerialStart.current = t
    let p = [Math.sin(t * .12) * 2, 5.2, 16 * k], l = [0, 3.6, -1]                       // idle backdrop (creator / welcome)
    if (stage === 'aerial') {
      const elapsed = t - aerialStart.current
      const q = THREE.MathUtils.smoothstep(Math.min(1, Math.max(0, (elapsed - 5.5) / 7)), 0, 1)
      const pos = aerialPath.position.getPointAt(q), target = aerialPath.target.getPointAt(q)
      p = [pos.x, pos.y, pos.z]; l = [target.x, target.y, target.z]
    }
    if (stage === 'diyas') { p = [0, 6.2, 12.6 * k]; l = [0, 1.8, 1.6] }
    if (stage === 'rangoli') { p = [0, 5.6, 12.2 * k]; l = [0, 2.2, 1.2] }
    if (stage === 'lantern') { p = [0, 5, 12 * k]; l = [0, 2.8, 1.5] }
    if (stage === 'lantern2') { p = [0, Math.max(5, lanternPos.current.y * .6), 12.5 * k]; l = [lanternPos.current.x * .5, lanternPos.current.y, -2] }
    if (stage === 'fireworks' || stage === 'greeting') { p = [Math.sin(t * .1) * .6, 4.4, 17 * k]; l = [0, 4.4, -5] }
    const a = Math.min(1, dt * 1.5)
    camera.position.x += (p[0] - camera.position.x) * a; camera.position.y += (p[1] - camera.position.y) * a; camera.position.z += (p[2] - camera.position.z) * a
    look.current.x += (l[0] - look.current.x) * a; look.current.y += (l[1] - look.current.y) * a; look.current.z += (l[2] - look.current.z) * a
    camera.lookAt(look.current)
  })
  return null
}

export default function Scene({ stage, lit, onLight, rangoli, launched, onLaunch, onLanternDone, fw, low, onFireworkFeedback }) {
  const lanternPos = useRef(new THREE.Vector3()), wave = useRef(0)
  const pixelRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
  const dpr = low ? [1, Math.min(1.25, pixelRatio)] : [1, Math.min(1.75, pixelRatio)]
  const diyaStages = ['diyas', 'rangoli', 'lantern', 'fireworks', 'greeting']
  return <Canvas shadows={!low} dpr={dpr} camera={{ fov: 50, position: [0, 5.2, 16], near: .1, far: 260 }} gl={{ antialias: !low, powerPreference: 'high-performance' }}
    onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.15 }}>
    <fog attach="fog" args={['#0b1033', 30, 110]} />
    <Clock wave={wave} target={rangoli} /><Sky />
    <hemisphereLight args={['#4a5cb0', '#2a1a10', .55]} />
    <directionalLight position={[-6, 20, 9]} intensity={.55} color="#9db2ff" castShadow={!low} shadow-mapSize={low ? [512, 512] : [1536, 1536]}
      shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-6} shadow-camera-near={1} shadow-camera-far={50} shadow-bias={-.0004} />
    <Stars radius={100} depth={40} count={low ? 700 : 2800} factor={4} fade speed={.4} />
    <group position={[-10, 26, -62]}><mesh><circleGeometry args={[2.3, 40]} /><meshBasicMaterial color="#f6f3dd" fog={false} toneMapped={false} /></mesh>
      <sprite scale={[22, 22, 1]}><spriteMaterial map={glowTex} color="#9db2ff" opacity={.35} blending={THREE.AdditiveBlending} transparent depthWrite={false} fog={false} /></sprite></group>
    <Skyline /><Floor /><Walls /><House low={low} /><Garden low={low} /><Petals low={low} />
    {stage === 'aerial' && <AerialColony low={low} />}
    <Rangoli show={rangoli} wave={wave} />
    {diyaStages.includes(stage) && <Diya pos={DIYA} lit={lit} onLight={onLight} scale={2.1} />}
    <Lantern stage={stage} launched={launched} onLaunch={onLaunch} onDone={onLanternDone} posRef={lanternPos} />
    <Sparkles count={low ? 20 : 90} scale={[24, 8, 18]} position={[0, 4, 2]} size={3} speed={.25} color="#ffd36b" />
    <Fireworks api={fw} low={low} onFireworkFeedback={onFireworkFeedback} />
    <Rig stage={launched && stage === 'lantern' ? 'lantern2' : stage} lanternPos={lanternPos} />
  </Canvas>
}
