// Fully synthesized audio (no external files, nothing loud on load, works offline).
let ctx, master, musicBus, sfxBus, noiseBuf, vol = 0.6, muted = false, timer = null, nextT = 0, step = 0
const ensure = () => {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    ctx = new AC()
    master = ctx.createGain(); master.gain.value = muted ? 0 : vol
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6
    master.connect(comp); comp.connect(ctx.destination)
    musicBus = ctx.createGain(); musicBus.gain.value = .55; musicBus.connect(master)
    sfxBus = ctx.createGain(); sfxBus.gain.value = .9; sfxBus.connect(master)
    const n = ctx.sampleRate * 2; noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate)
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}
export const initAudio = ensure
export const setVolume = v => { vol = v; if (master) master.gain.setTargetAtTime(muted ? 0 : v, ctx.currentTime, .05) }
export const setMuted = m => { muted = m; if (master) master.gain.setTargetAtTime(m ? 0 : vol, ctx.currentTime, .05) }

const tone = (f, d = 1, type = 'sine', v = .15, when = 0, bus = sfxBus, f2) => {
  const c = ensure(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime + when
  o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d)
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .02); g.gain.exponentialRampToValueAtTime(.0008, t + d)
  o.connect(g); g.connect(bus || sfxBus); o.start(t); o.stop(t + d + .05)
}
const noise = (d, { type = 'lowpass', f = 800, f2, q = 1, v = .4, when = 0, attack = .005, rate = 1 } = {}) => {
  const c = ensure(), s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + when
  s.buffer = noiseBuf; s.playbackRate.value = rate; s.loop = true
  fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + d)
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + attack); g.gain.exponentialRampToValueAtTime(.0005, t + d)
  s.connect(fl); fl.connect(g); g.connect(sfxBus); s.start(t, Math.random()); s.stop(t + d + .05)
}
const crackles = (n, span, v = .25, when = 0, f = 3500) => { for (let i = 0; i < n; i++) noise(.04 + Math.random() * .04, { type: 'bandpass', f: f + Math.random() * 3000, q: 2, v: v * (.4 + Math.random() * .6), when: when + Math.random() * span, attack: .002 }) }

export const sfx = {
  ding() { tone(880, 1.4, 'sine', .12); tone(1320, 1, 'triangle', .05, .05); tone(1760, .6, 'sine', .03, .1) },
  ignite() { noise(.5, { type: 'bandpass', f: 1200, f2: 4000, q: .8, v: .22, attack: .08 }); noise(.25, { type: 'highpass', f: 5000, v: .1 }); tone(660, 1.1, 'sine', .05, .1) },
  launch() { noise(1.0, { type: 'bandpass', f: 500, f2: 2600, q: 1.6, v: .22, attack: .03 }); tone(380, 1, 'sawtooth', .02, 0, sfxBus, 1500) },
  burst(kind = 'peony') {
    const big = { peony: .6, chrysanthemum: .65, willow: .4, ring: .45, heart: .45, mini: .22, finale: .8 }[kind] || .5
    noise(.9, { f: 380, f2: 70, v: big, attack: .004 }); tone(95, .5, 'sine', big * .7, 0, sfxBus, 38)
    if (kind === 'willow') { crackles(18, 2, .09, .15, 4500); tone(2200, 2, 'sine', .015, .2, sfxBus, 900) }
    else if (kind === 'chrysanthemum' || kind === 'finale') crackles(34, 1.6, .2, .12)
    else if (kind === 'ring' || kind === 'heart') { tone(1400, .5, 'sine', .04, .05); tone(2100, .4, 'sine', .025, .1); crackles(10, .8, .12, .1) }
    else if (kind === 'mini') crackles(4, .15, .2)
    else crackles(18, 1.1, .16, .1)
  },
  crack() { noise(.08, { type: 'highpass', f: 1500, v: .45, attack: .001 }); noise(.2, { f: 700, f2: 150, v: .25, attack: .001 }) },
  chakri(d = 3.5) { noise(d, { type: 'bandpass', f: 1800, f2: 800, q: 3, v: .2, attack: .3, rate: 1.4 }); tone(300, d, 'sawtooth', .012, 0, sfxBus, 700) },
  fountain(d = 3.5) { noise(d, { type: 'bandpass', f: 2200, q: .6, v: .22, attack: .2 }); crackles(30, d, .06, 0, 5000) },
  phuljhari(d = 4) { noise(d, { type: 'highpass', f: 3500, q: .5, v: .1, attack: .1 }); crackles(40, d, .08, 0, 4500) },
  ladi(n = 14) { for (let i = 0; i < n; i++) { const t = i * .1 + Math.random() * .05; noise(.1, { type: 'highpass', f: 1500, v: .4, when: t, attack: .001 }); noise(.2, { f: 600, f2: 120, v: .25, when: t, attack: .001 }) } },
  whoosh() { noise(.9, { type: 'bandpass', f: 400, f2: 2000, q: 1, v: .15, attack: .25 }) },
}

// --- Indian festive ambience: tanpura drone + Bhoopali pentatonic sitar-like pluck + soft tabla pulse ---
const SA = 196, NOTES = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2, 3] // S R G P D S' R' G' P'
let droneStarted = false
const pluck = (f, t, v = .09) => {
  const c = ctx, o = c.createOscillator(), o2 = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain()
  o.type = 'sawtooth'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 2.005
  fl.type = 'lowpass'; fl.frequency.setValueAtTime(3200, t); fl.frequency.exponentialRampToValueAtTime(500, t + 1.4); fl.Q.value = 3
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(.0006, t + 2)
  o.connect(fl); o2.connect(fl); fl.connect(g); g.connect(musicBus); g.connect(delay)
  o.start(t); o2.start(t); o.stop(t + 2.1); o2.stop(t + 2.1)
}
let delay
const tabla = (t, low) => {
  const c = ctx, o = c.createOscillator(), g = c.createGain()
  o.type = 'sine'; o.frequency.setValueAtTime(low ? 150 : 260, t); o.frequency.exponentialRampToValueAtTime(low ? 70 : 200, t + .25)
  g.gain.setValueAtTime(low ? .16 : .07, t); g.gain.exponentialRampToValueAtTime(.001, t + .3); o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + .35)
}
const startDrone = () => {
  if (droneStarted) return; droneStarted = true
  const c = ctx
  delay = c.createDelay(1); delay.delayTime.value = .42; const fb = c.createGain(); fb.gain.value = .38; const dl = c.createGain(); dl.gain.value = .5
  delay.connect(fb); fb.connect(delay); delay.connect(dl); dl.connect(musicBus)
  ;[[SA / 2, .05], [SA * .75, .035], [SA, .03], [SA * 2.003, .014]].forEach(([f, v], i) => {
    const o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter(), lfo = c.createOscillator(), lg = c.createGain()
    o.type = 'sawtooth'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = 700
    lfo.frequency.value = .12 + i * .05; lg.gain.value = v * .5; g.gain.value = v; lfo.connect(lg); lg.connect(g.gain)
    o.connect(fl); fl.connect(g); g.connect(musicBus); o.start(); lfo.start()
  })
}
let deg = 3
const tick = () => {
  while (nextT < ctx.currentTime + .5) {
    const b = step % 16, beat = .36
    if (b % 4 === 0) tabla(nextT, true); else if (b % 2 === 0 && Math.random() > .3) tabla(nextT, false)
    if (b === 0) { deg = Math.random() > .5 ? 3 : 0 }
    if (Math.random() > (b % 2 ? .62 : .3)) { deg = Math.max(0, Math.min(NOTES.length - 1, deg + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)])); pluck(SA * 2 * NOTES[deg], nextT + (b % 2 ? .06 : 0)) }
    if (b === 8) pluck(SA * NOTES[Math.random() > .5 ? 3 : 0], nextT, .06)
    nextT += beat; step++
  }
}
export const startMusic = () => { ensure(); startDrone(); if (timer) return; nextT = ctx.currentTime + .1; timer = setInterval(tick, 120) }
export const stopMusic = () => { clearInterval(timer); timer = null }
export const musicOn = () => !!timer
// kept for backwards compatibility with earlier code
export const ding = () => sfx.ding()
export const boom = () => sfx.burst('peony')
