import * as THREE from 'three'
import { glowTex } from './textures.js'
// Shared time / "diya wave" uniforms, updated once per frame from Scene.
export const U = { uTime: { value: 0 }, uWave: { value: 0 } }

const common = `
uniform float uTime, uWave, uLit, uMode; attribute float aDelay;
varying vec2 vUv; varying float vLit; varying float vSeed;
mat4 inst(){ mat4 m = mat4(1.0);
#ifdef USE_INSTANCING
 m = instanceMatrix;
#endif
 return m; }`
const litExpr = 'float lit = uMode > .5 ? smoothstep(aDelay, aDelay + .06, uWave) : uLit;'

const flameVert = `${common}
void main(){
  vUv = uv; mat4 im = inst(); ${litExpr} vLit = lit;
  vec4 c = modelViewMatrix * im * vec4(0.,0.,0.,1.);
  float sc = length(im[0].xyz) * length(modelMatrix[0].xyz);
  vSeed = im[3].x * 3.1 + im[3].z * 1.7;
  float fl = 1. + .08*sin(uTime*13. + vSeed) + .05*sin(uTime*23. + vSeed*1.7);
  vec2 sz = vec2(.19,.5) * sc * (.25 + .75*lit) * fl;
  vec4 p = c + vec4(position.x*sz.x*2., position.y*sz.y, 0., 0.);
  gl_Position = projectionMatrix * p;
}`
// Teardrop flame: blue base, orange body, white-hot core, sways and flickers.
const flameFrag = `
uniform float uTime; varying vec2 vUv; varying float vLit; varying float vSeed;
void main(){
  if (vLit < .01) discard;
  vec2 p = vec2((vUv.x - .5)*2., vUv.y);
  p.x -= (sin(uTime*7. + vSeed + p.y*4.)*.14 + sin(uTime*15. + vSeed*2.)*.06) * p.y * p.y;
  float w = pow(max(0., 1. - p.y), .8) * smoothstep(0., .22, p.y) * .9 + .0001;
  float d = abs(p.x) / w;
  float shape = (1. - smoothstep(.55, 1., d)) * smoothstep(0., .04, p.y);
  float core = (1. - smoothstep(0., .65, d)) * (1. - smoothstep(0., .7, p.y));
  vec3 col = mix(vec3(1.,.38,.05), vec3(1.,.8,.3), smoothstep(.1,.9, core + (1.-p.y)*.35));
  col = mix(col, vec3(1.,.97,.85), core*core);
  col = mix(vec3(.25,.4,1.), col, smoothstep(0., .2, p.y));
  gl_FragColor = vec4(col*1.3, shape * vLit);
}`
const glowVert = `${common}
void main(){ vUv = uv; mat4 im = inst(); ${litExpr} vLit = lit; vSeed = im[3].x*3.1 + im[3].z*1.7;
  gl_Position = projectionMatrix * modelViewMatrix * im * vec4(position,1.); }`
const glowFrag = `
uniform sampler2D uMap; uniform vec3 uColor; uniform float uTime, uStrength;
varying vec2 vUv; varying float vLit; varying float vSeed;
void main(){ float a = texture2D(uMap, vUv).a;
  float fl = .88 + .12*sin(uTime*11. + vSeed) + .05*sin(uTime*19. + vSeed*3.);
  gl_FragColor = vec4(uColor, a * vLit * uStrength * fl); }`

const base = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }
// mode 0 = single diya driven by uLit, mode 1 = instanced diyas driven by per-instance delay + uWave
export const flameMaterial = mode => new THREE.ShaderMaterial({ ...base, vertexShader: flameVert, fragmentShader: flameFrag,
  uniforms: { uTime: U.uTime, uWave: U.uWave, uLit: { value: 0 }, uMode: { value: mode } } })
export const glowMaterial = (mode, color = '#ff9a3c', strength = .9) => new THREE.ShaderMaterial({ ...base, vertexShader: glowVert, fragmentShader: glowFrag, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  uniforms: { uTime: U.uTime, uWave: U.uWave, uLit: { value: 0 }, uMode: { value: mode }, uMap: { value: glowTex }, uColor: { value: new THREE.Color(color) }, uStrength: { value: strength } } })

export const flameGeo = (() => { const g = new THREE.PlaneGeometry(1, 1); g.translate(0, .5, 0); return g })()
export const floorGlowGeo = new THREE.PlaneGeometry(3, 3).rotateX(-Math.PI / 2)

const lanternFlameVert = `
uniform float uTime;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  float sway = (sin(uTime * 5.2) * .06 + sin(uTime * 11.7) * .025) * uv.y * uv.y;
  p.x += sway + sin(uTime * 8. + uv.y * 5.) * .012 * uv.y;
  p.y *= .9 + .08 * sin(uTime * 6. + uv.x * 4.);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`
const lanternFlameFrag = `
uniform float uTime;
uniform float uLayer;
varying vec2 vUv;
void main() {
  vec2 p = vec2((vUv.x - .5) * 2., vUv.y);
  float turbulence = sin(vUv.y * 13. + uTime * 7.) * .08 + sin(vUv.y * 29. - uTime * 10.) * .035;
  p.x += turbulence * (vUv.y + .15);
  float width = mix(.62, .08, vUv.y) * (1. + .12 * sin(uTime * 9. + vUv.y * 8.));
  float body = 1. - smoothstep(width * .72, width, abs(p.x));
  body *= smoothstep(0., .08, vUv.y) * (1. - smoothstep(.82, 1., vUv.y));
  float core = 1. - smoothstep(.02, .38, length(vec2(p.x * 1.5, vUv.y - .2)));
  vec3 col = uLayer < .5 ? vec3(1., .32, .025) : (uLayer < 1.5 ? vec3(1., .72, .12) : vec3(1., .98, .78));
  float alpha = body * (uLayer < .5 ? .52 : (uLayer < 1.5 ? .72 : .95));
  if (uLayer > 1.5) alpha *= core;
  gl_FragColor = vec4(col * (1. + core * .8), alpha);
}`
export const lanternFlameMaterial = layer => new THREE.ShaderMaterial({
  vertexShader: lanternFlameVert, fragmentShader: lanternFlameFrag, transparent: true, depthWrite: false,
  blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { uTime: U.uTime, uLayer: { value: layer } },
})
export const lanternFlameGeo = (() => { const g = new THREE.PlaneGeometry(.72, 1.25, 8, 8); g.translate(0, .62, 0); return g })()
