/**
 * Drops - rain on a puddle
 * Entry point, event handling, main loop
 */

import { createCanvas } from './canvas'
import { updateState, addImpulse, resetState } from './state'
import { updateWind, resetWind } from './wind'
import { initRipplePool, updateRipples, getActiveRipples, spawnClickRipple, clearRipples, setAmbientSpawnCallback } from './ripple'
import { renderBackground, renderRipples, applyDither, resetShimmer } from './renderer'
import { initAudio, resumeAudio, isAudioReady } from './audio/engine'
import { initControls, toggleSidebar, toggleTheme } from './controls'
import { initRain, updateRain, stopRain } from './audio/rain'
import { initAmbience, stopAmbience } from './audio/ambience'
import { playDropSound, playDripSound } from './audio/transient'
import { reseedNoise } from './utils'
import { config } from './config'

// State
let isPlaying = false
let animationId: number | null = null
let audioInitialized = false
let introComplete = false

// FPS tracking
let lastTime = 0

// Elements
const canvas = document.getElementById('canvas') as HTMLCanvasElement
const intro = document.getElementById('intro') as HTMLElement

// Canvas context
const { ctx, resize: resizeCanvas } = createCanvas(canvas)

// Resize handler
function resize() {
  resizeCanvas()
}

// Animation loop
function render(time: number) {
  const delta = lastTime ? (time - lastTime) / 1000 : 0
  lastTime = time

  // Update systems
  updateState(delta)
  updateWind(delta)
  updateRipples(delta, window.innerWidth, window.innerHeight)
  
  // Update audio
  if (isAudioReady()) {
    updateRain()
  }

  // Render
  renderBackground(ctx, window.innerWidth, window.innerHeight)
  renderRipples(ctx, getActiveRipples())
  
  // Apply dithering effect (uses canvas dimensions for pixel processing)
  applyDither(ctx, canvas.width, canvas.height)

  if (isPlaying) {
    animationId = requestAnimationFrame(render)
  }
}

// Start visuals
function startVisuals() {
  if (isPlaying) return
  isPlaying = true
  lastTime = 0
  animationId = requestAnimationFrame(render)
}

// Start audio
async function startAudio() {
  if (!audioInitialized) {
    await initAudio()
    initRain()
    initAmbience()
    audioInitialized = true
  }
  await resumeAudio()
}

// Start everything
async function start() {
  if (isPlaying) return
  startVisuals()
  await startAudio()
}

// Stop
function stop() {
  isPlaying = false
  if (animationId !== null) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  stopRain()
  stopAmbience()
}

// Toggle play/pause
function toggle() {
  if (isPlaying) {
    stop()
  } else {
    start()
  }
}

// Reset/reseed
function reseed() {
  reseedNoise()
  resetWind()
  resetState()
  resetShimmer()
  clearRipples()
}

// Skip intro (optionally spawn first drop at click position)
function skipIntro(clickX?: number, clickY?: number) {
  if (introComplete) return
  introComplete = true

  intro.classList.add('fade-out')

  setTimeout(async () => {
    await start()
    
    // Spawn first drop if position provided
    if (clickX !== undefined && clickY !== undefined) {
      addImpulse()
      spawnClickRipple(clickX, clickY)
      if (isAudioReady()) {
        playDropSound(clickX / window.innerWidth)
      }
    }
  }, 300)

  setTimeout(() => {
    intro.classList.add('hidden')
  }, 1000)
}

// Event listeners
canvas.addEventListener('click', (e) => {
  if (!introComplete) {
    skipIntro(e.clientX, e.clientY)
    return
  }

  if (!isPlaying) return

  // Add energy impulse
  addImpulse()

  // Spawn click ripple
  spawnClickRipple(e.clientX, e.clientY)

  // Play drop sound (resonance is now handled inside transient.ts)
  if (isAudioReady()) {
    const x = e.clientX / window.innerWidth
    playDropSound(x)
  }
})

intro.addEventListener('click', (e) => {
  skipIntro(e.clientX, e.clientY)
})

window.addEventListener('resize', resize)

document.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return

  switch (e.key.toLowerCase()) {
    case ' ':
      e.preventDefault()
      if (!introComplete) {
        // Center drop for spacebar
        skipIntro(window.innerWidth / 2, window.innerHeight / 2)
      } else {
        toggle()
      }
      break
    case 'r':
      reseed()
      break
    case 'h':
      toggleSidebar()
      break
    case 't':
      toggleTheme()
      break
  }
})

// Custom event for reseed from sidebar
window.addEventListener('drops:reseed', reseed)

// Initialize
resize()
initRipplePool()
initControls()

// Wire up ambient drip sounds
setAmbientSpawnCallback((x, _y, width, _height) => {
  if (isAudioReady() && Math.random() < config.dripChance) {
    playDripSound(x / width)
  }
})

// Render initial frame (static)
renderBackground(ctx, window.innerWidth, window.innerHeight)

// Auto-skip intro after 4 seconds (visuals only until user gestures for audio)
setTimeout(() => {
  if (!introComplete) {
    skipIntro()
  }
}, 4000)
