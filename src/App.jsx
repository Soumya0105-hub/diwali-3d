import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Scene from './Scene.jsx'
import { FIREWORK_TYPES } from './Fireworks.jsx'
import { initAudio, sfx, startMusic, stopMusic, setVolume, setMuted } from './audio.js'
import { vibrate } from './vibration.js'

// ---- Sender-only personalisation: only ?from=<name> is read; sanitised and length-limited. ----
const clean = s => (s || '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40)
const params = new URLSearchParams(location.search)
const HAS_FROM = params.has('from') && clean(params.get('from')) !== ''
const URL_NAME = clean(params.get('from'))
const makeLink = name => { const u = new URLSearchParams(); u.set('from', clean(name)); return `${location.origin}${location.pathname}?${u.toString()}` }
const lowDevice = () => /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || (navigator.hardwareConcurrency || 8) <= 4

export default function App() {
  const [stage, setStage] = useState('loading')
  const [prog, setProg] = useState(0)
  const [name, setName] = useState(URL_NAME)            // creator input / receiver's sender name
  const [created, setCreated] = useState('')            // generated link
  const [copied, setCopied] = useState(false)
  const [lit, setLit] = useState(false)
  const [rangoli, setRangoli] = useState(false)
  const [launched, setLaunched] = useState(false)
  const [shows, setShows] = useState(0)
  const [muted, setMut] = useState(false)
  const [vol, setVol] = useState(.6)
  const [vibrationOn, setVibrationOn] = useState(true)
  const [pulse, setPulse] = useState(false)
  const [showGreeting, setShowGreeting] = useState(false)
  const fw = useRef(null)
  const low = useMemo(lowDevice, [])
  const sender = HAS_FROM ? URL_NAME : clean(name)
  const timers = useRef([])
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)) }
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => { // loading screen
    if (stage !== 'loading') return
    let p = 0; const t = setInterval(() => { p += Math.random() * 20; setProg(Math.min(100, p)); if (p >= 100) { clearInterval(t); setTimeout(() => setStage(HAS_FROM ? 'aerial' : 'create'), 250) } }, 140)
    return () => clearInterval(t)
  }, [stage])

  const begin = () => { initAudio(); startMusic(); sfx.ding(); setLit(false); setRangoli(false); setLaunched(false); setShows(0); setShowGreeting(false); setStage('diyas') }
  const light = useCallback(() => { setLit(l => { if (l) return l; sfx.ignite(); return true }) }, [])

  useEffect(() => {
    if (lit && stage === 'diyas') { later(() => { setRangoli(true); setStage('rangoli'); sfx.whoosh() }, 1000); later(() => setStage('lantern'), 6200) }
  }, [lit, stage])

  useEffect(() => {
    if (stage !== 'aerial') return
    const timer = setTimeout(() => setStage('diyas'), 12500)
    return () => clearTimeout(timer)
  }, [stage])

  const fire = (type, x) => { initAudio(); fw.current && fw.current.fire(type, x !== undefined ? { x } : {}); setShows(s => s + 1) }
  const fireworkFeedback = useCallback(type => {
    vibrate(type, vibrationOn)
    setPulse(true)
    setTimeout(() => setPulse(false), 120)
  }, [vibrationOn])
  const finale = () => { fire('finale'); later(() => setShowGreeting(true), 8500); later(() => setStage('greeting'), 8500) }
  const tapSky = e => { if (stage !== 'fireworks' || e.target.closest('.tray,.music,.gbtn')) return; fire('rocket', (e.clientX / innerWidth - .5) * 14) }
  useEffect(() => { if (stage === 'fireworks') { const t = setTimeout(() => { fire('heart'); setTimeout(() => fire('peony', 3), 700) }, 1200); return () => clearTimeout(t) } }, [stage])

  useEffect(() => { if (stage !== 'greeting') return; const t = setInterval(() => fire(['rocket', 'peony', 'heart', 'willow', 'ring'][Math.floor(Math.random() * 5)]), 2400); return () => clearInterval(t) }, [stage])
  useEffect(() => { setMuted(muted) }, [muted])
  useEffect(() => { if (stage !== 'loading' && stage !== 'create' && stage !== 'welcome') startMusic(); else if (stage === 'create' || stage === 'welcome') stopMusic() }, [stage])

  // ---- share / link actions ----
  const create = () => { if (!clean(name)) return; setCreated(makeLink(name)) }
  const link = created || makeLink(sender)
  const copy = async () => { try { await navigator.clipboard.writeText(link) } catch { const t = document.createElement('textarea'); t.value = link; document.body.appendChild(t); t.select(); try { document.execCommand('copy') } catch { /* ignore */ } t.remove() } setCopied(true); setTimeout(() => setCopied(false), 1800) }
  const whatsapp = () => window.open('https://wa.me/?text=' + encodeURIComponent(`Happy Diwali! ✨ ${clean(sender) || 'Someone special'} sent you a Diwali celebration: ${link}`), '_blank', 'noopener')
  const replay = () => { setShowGreeting(false); setStage('fireworks') }
  const makeOwn = () => { location.href = location.pathname }

  const hud = stage === 'diyas' || stage === 'rangoli' || stage === 'lantern' || stage === 'fireworks'
  return <div className={'app' + (pulse ? ' firework-pulse' : '')} onPointerDown={tapSky}>
    {stage !== 'loading' && <Scene stage={stage} lit={lit} onLight={light} rangoli={rangoli} launched={launched} onLaunch={() => setLaunched(true)} onLanternDone={() => setStage('fireworks')} fw={fw} low={low} onFireworkFeedback={fireworkFeedback} />}

    {stage === 'loading' && <div className="overlay solid"><div className="flame" /><h2 className="title">Preparing your celebration</h2><div className="bar"><i style={{ width: prog + '%' }} /></div></div>}

    {stage === 'create' && <div className="overlay veil"><h1 className="title big">Shubh Deepavali</h1>
      <p className="sub">Create a Diwali experience to send to someone you love</p>
      <div className="form">
        <input autoComplete="name" maxLength={40} placeholder="Your name" value={name} onChange={e => { setName(e.target.value); setCreated('') }} onKeyDown={e => e.key === 'Enter' && create()} aria-label="Sender name" />
        {!created && <button className="gold" disabled={!clean(name)} onClick={create}>Create Diwali Experience</button>}
        {created && <>
          <div className="linkbox" onPointerDown={e => e.stopPropagation()}>{created}</div>
          <div className="row"><button className="gold" onClick={copy}>{copied ? 'Copied ✓' : 'Copy Link'}</button><button className="gold" onClick={whatsapp}>Share on WhatsApp</button></div>
          <button className="ghost" onClick={begin}>Preview Experience</button></>}
      </div></div>}

    {stage === 'welcome' && <div className="overlay veil"><h1 className="title big">Shubh Deepavali</h1>
      <p className="sub">{sender} has lit a celebration for you</p>
      <button className="gold start" onClick={begin}>Start Experience</button></div>}

    {stage === 'aerial' && <div className="overlay aerial-intro"><p className="aerial-kicker">A Diwali night in the colony</p><h1 className="aerial-title">ENTER THE HOUSE</h1></div>}

    {hud && <div className="hud">
        {stage === 'diyas' && <p>Touch the diya to glow</p>}
      {stage === 'rangoli' && <p>Your rangoli blooms…</p>}
      {stage === 'lantern' && !launched && <p>Tap the glowing lantern to release it into the sky</p>}
      {stage === 'lantern' && launched && <p>Watch it rise…</p>}
      {stage === 'fireworks' && <>
        <div className="tray" onPointerDown={e => e.stopPropagation()}>{FIREWORK_TYPES.filter(t => t[0] !== 'finale').map(([k, label]) => <button key={k} className="chip" onClick={() => fire(k)}>{label}</button>)}</div>
        <div className="row"><button className="gold gbtn" onPointerDown={e => e.stopPropagation()} onClick={finale}>✨ Grand Finale</button>
          {shows >= 4 && <button className="ghost gbtn" onPointerDown={e => e.stopPropagation()} onClick={() => setStage('greeting')}>Open greeting</button>}</div>
        <p className="tiny">Tap the sky for rockets</p></>}
    </div>}

    {stage === 'greeting' && <div className="overlay glass greet">
      <p className="g1">HAPPY</p><h1 className="title huge g2">DIWALI</h1>
      <p className="msg g3">May your life always shine with happiness, love and prosperity.</p>
      <p className="g4 withlove">WITH LOVE,</p><p className="g5 sender">{sender || 'A friend'}</p>
      <div className="row g6" onPointerDown={e => e.stopPropagation()}>
        <button className="gold" onClick={replay}>Watch fireworks</button><button className="ghost" onClick={copy}>{copied ? 'Copied ✓' : 'Copy link'}</button><button className="ghost" onClick={makeOwn}>Create your own</button>
      </div></div>}

    {stage !== 'loading' && stage !== 'create' && stage !== 'welcome' && <div className="music" onPointerDown={e => e.stopPropagation()}>
      <button aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => { initAudio(); setMut(m => !m) }}>{muted ? '🔇' : '🔊'}</button>
      <input aria-label="Volume" type="range" min="0" max="1" step=".05" value={vol} onChange={e => { setVol(+e.target.value); setVolume(+e.target.value); if (muted) setMut(false) }} />
      <button className="vibration-toggle" aria-label={vibrationOn ? 'Turn vibration off' : 'Turn vibration on'} onClick={() => setVibrationOn(v => !v)}>{vibrationOn ? '📳' : '📴'}</button>
    </div>}
  </div>
}
