const patterns = {
  rocketLaunch: [28],
  rocketBurst: [75, 35, 45],
  chakri: [22, 28, 22, 28, 22],
  anar: [35, 45, 35, 45, 35, 45],
  peony: [80, 35, 28, 35, 22],
  chrysanthemum: [80, 35, 28, 35, 22],
  willow: [24, 55, 24, 55, 24],
  heart: [32, 45, 32],
  finale: [90, 35, 55, 35, 75, 35, 45],
  ground: [26],
  ladi: [20, 25, 20, 25, 20],
}

let lastVibration = 0

export function vibrate(type, enabled) {
  if (!enabled || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false
  const now = Date.now()
  if (now - lastVibration < 55) return false
  lastVibration = now
  try {
    navigator.vibrate(patterns[type] || patterns.ground)
    return true
  } catch {
    return false
  }
}
