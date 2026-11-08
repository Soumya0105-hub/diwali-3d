import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Sparkles, Text } from '@react-three/drei'
import * as THREE from 'three'
import { flameMaterial, glowMaterial, flameGeo, floorGlowGeo } from './shaders.js'
import { clay, shadowTex } from './textures.js'

// Hand-thrown clay bowl: lathe profile + irregular wobble + pinched spout (+x) where the wick rests.
export const bowlGeo = (() => {
  const pts = [[0, 0], [.1, 0], [.16, .02], [.24, .07], [.3, .14], [.325, .205], [.3, .222], [.272, .205], [.235, .15], [.15, .105], [0, .09]].map(([r, y]) => new THREE.Vector2(r, y))
  const g = new THREE.LatheGeometry(pts, 32), p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x)
    const wob = 1 + .035 * Math.sin(a * 3 + 1.3) + .02 * Math.sin(a * 5), w = Math.exp(-a * a * 5)
    p.setXYZ(i, x * wob + (y > .1 ? w * .075 * ((y - .1) / .12) : 0), y + (y > .15 ? .012 * Math.sin(a * 4) : 0), z * wob)
  }
  g.computeVertexNormals(); return g
})()
export const clayMat = new THREE.MeshStandardMaterial({ map: clay, roughness: .9, metalness: 0, side: THREE.DoubleSide })
export const TIP = [.184, .23] // wick tip (x,y) in diya local space

export function Diya({ pos, lit, onLight, scale = 1.3, index = 0 }) {
  const flame = useMemo(() => flameMaterial(0), []), glow = useMemo(() => glowMaterial(0, '#ff9a3c', 1), [])
  const prog = useRef(0), light = useRef(), oil = useRef(), hint = useRef(), activated = useRef(false)
  useEffect(() => {
    if (!lit) activated.current = false
  }, [lit])
  const activate = e => {
    e.stopPropagation()
    if (activated.current || lit || !onLight) return
    activated.current = true
    if (e.pointerId !== undefined && e.target?.setPointerCapture) e.target.setPointerCapture(e.pointerId)
    onLight()
  }
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    prog.current = THREE.MathUtils.damp(prog.current, lit ? 1 : 0, 3.2, dt)
    flame.uniforms.uLit.value = prog.current; glow.uniforms.uLit.value = prog.current
    const fl = .9 + .1 * Math.sin(t * 13 + index * 2) + .06 * Math.sin(t * 27 + index)
    if (light.current) light.current.intensity = prog.current * 6 * fl
    if (oil.current) oil.current.emissiveIntensity = prog.current * .9
    if (wick.current) wick.current.emissiveIntensity = prog.current * 1.5
    if (hint.current) {
      hint.current.visible = hint.current.material.opacity > .01
      hint.current.material.opacity = THREE.MathUtils.damp(hint.current.material.opacity, lit ? 0 : .92, 7, dt)
    }
  })
  return <group position={pos} scale={scale}>
    <mesh rotation-x={-Math.PI / 2} position-y={.006}><planeGeometry args={[1.2, 1.2]} /><meshBasicMaterial map={shadowTex} transparent depthWrite={false} opacity={.85} /></mesh>
    <mesh geometry={bowlGeo} material={clayMat} castShadow receiveShadow />
    <mesh position={[0, .147, 0]} rotation-x={-Math.PI / 2}><circleGeometry args={[.225, 28]} />
      <meshStandardMaterial ref={oil} color="#4a2406" roughness={.06} metalness={.3} emissive="#ff7a10" emissiveIntensity={0} /></mesh>
    <mesh position={[.115, .19, 0]} rotation-z={-1.05}><cylinderGeometry args={[.011, .014, .16, 6]} />
      <meshStandardMaterial ref={wick} color="#1a120c" roughness={1} emissive="#ff4a00" emissiveIntensity={0} /></mesh>
    <mesh geometry={flameGeo} material={flame} position={[TIP[0], TIP[1], 0]} renderOrder={5} />
    <mesh geometry={floorGlowGeo} material={glow} position-y={.012} scale={1.1} renderOrder={2} />
    <Text ref={hint} position={[0, .62, .12]} fontSize={.14} color="#e7473f" anchorX="center" anchorY="middle"
      outlineWidth={.018} outlineColor="#210b0b" fillOpacity={.96} material-transparent>
      TOUCH HERE TO GLOW
    </Text>
    {lit && <Sparkles count={5} scale={[.5, .6, .5]} position={[.15, .5, 0]} size={2.2} speed={.5} color="#ffd36b" />}
    <pointLight ref={light} position={[TIP[0], .55, 0]} color="#ff9a3c" intensity={0} distance={7} decay={2} />
    {!lit && <Html center position={[0, .34, 0]} zIndexRange={[20, 0]} style={{ pointerEvents: 'auto' }}>
      <button
        type="button"
        className="diya-hit-area"
        aria-label="Light the diya"
        onPointerDown={e => { e.preventDefault(); e.stopPropagation(); activate(e) }}
        onClick={e => { e.preventDefault(); e.stopPropagation() }}
      />
    </Html>}
  </group>
}
