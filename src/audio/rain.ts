/**
 * Rain synthesis with resonator bank ("puddle sings")
 * 
 * Architecture:
 * - Noise source → shaping filters → split to dry/wet paths
 * - Dry path: rain texture (non-tonal)
 * - Wet path: resonator bank (tonal coloration) controlled by intensity/wind/click
 */

import { getAudioContext, getDryNode, getReverbNode, getRainGain } from './engine'
import { getIntensity } from '../state'
import { config } from '../config'
import { lerp } from '../utils'

// Core nodes
let noiseNode: AudioBufferSourceNode | null = null
let noiseShaper: BiquadFilterNode | null = null
let noiseHighpass: BiquadFilterNode | null = null

// Dry path
let dryGain: GainNode | null = null

// Wet path (resonator)
let wetGain: GainNode | null = null
let wetHighCut: BiquadFilterNode | null = null
let resonators: BiquadFilterNode[] = []
let resonatorBus: GainNode | null = null

// Click excitation
let exciteGain: GainNode | null = null
let exciteDecayTimeout: number | null = null

// Wind modulation
let windLFOs: OscillatorNode[] = []
let windLFOGains: GainNode[] = []
let currentWindStrength = 0

let isRunning = false

/**
 * Initialize rain synthesis with resonator bank
 */
export function initRain(): void {
  const ctx = getAudioContext()
  const masterDry = getDryNode()
  const masterReverb = getReverbNode()
  const rainVol = getRainGain()
  
  if (!ctx || !masterDry || !masterReverb || !rainVol) return

  const cfg = config.resonator
  const now = ctx.currentTime

  // === NOISE SOURCE ===
  // Create pink-ish noise (filtered white noise)
  noiseHighpass = ctx.createBiquadFilter()
  noiseHighpass.type = 'highpass'
  noiseHighpass.frequency.value = 80  // Remove rumble
  noiseHighpass.Q.value = 0.5

  noiseShaper = ctx.createBiquadFilter()
  noiseShaper.type = 'lowpass'
  noiseShaper.frequency.value = 8000  // Tame high hiss
  noiseShaper.Q.value = 0.5

  // === DRY PATH (rain texture) ===
  dryGain = ctx.createGain()
  dryGain.gain.value = 0.15  // Base rain bed level

  // === WET PATH (resonator bank) ===
  wetGain = ctx.createGain()
  wetGain.gain.value = cfg.baseWetMix

  // Excitation gain (for click transients)
  exciteGain = ctx.createGain()
  exciteGain.gain.value = 1.0

  // High cut on wet path to avoid piercing frequencies
  wetHighCut = ctx.createBiquadFilter()
  wetHighCut.type = 'lowpass'
  wetHighCut.frequency.value = cfg.wetHighCut
  wetHighCut.Q.value = 0.5

  // Resonator bus (sum of all resonators)
  resonatorBus = ctx.createGain()
  resonatorBus.gain.value = 1.0

  // === RESONATOR BANK ===
  // Create resonators for each frequency
  resonators = []
  windLFOs = []
  windLFOGains = []

  for (let i = 0; i < cfg.frequencies.length; i++) {
    const freq = cfg.frequencies[i]
    
    // Resonator filter (high Q bandpass)
    const resonator = ctx.createBiquadFilter()
    resonator.type = 'bandpass'
    resonator.frequency.value = freq
    resonator.Q.value = cfg.baseQ
    resonators.push(resonator)

    // Wind LFO for frequency modulation
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    // Slightly different rate for each resonator (creates organic drift)
    lfo.frequency.value = cfg.windLfoRateHz * (0.8 + Math.random() * 0.4)

    const lfoGain = ctx.createGain()
    // Detune amount in Hz (percentage of base frequency)
    lfoGain.gain.value = 0  // Start with no modulation

    lfo.connect(lfoGain)
    lfoGain.connect(resonator.frequency)
    lfo.start(now)

    windLFOs.push(lfo)
    windLFOGains.push(lfoGain)

    // Connect resonator to bus
    resonator.connect(resonatorBus)
  }

  // === SIGNAL ROUTING ===
  // Noise → shaping
  noiseHighpass.connect(noiseShaper)

  // Shaped noise → dry path
  noiseShaper.connect(dryGain)

  // Shaped noise → wet path (resonators in parallel)
  for (const resonator of resonators) {
    noiseShaper.connect(resonator)
  }

  // Resonator bus → excite gain → high cut → wet gain
  resonatorBus.connect(exciteGain)
  exciteGain.connect(wetHighCut)
  wetHighCut.connect(wetGain)

  // Mix dry + wet → rain volume control
  dryGain.connect(rainVol)
  wetGain.connect(rainVol)

  // Rain volume → master dry/reverb
  const drySend = ctx.createGain()
  drySend.gain.value = 0.5
  const reverbSend = ctx.createGain()
  reverbSend.gain.value = 0.4

  rainVol.connect(drySend)
  rainVol.connect(reverbSend)
  drySend.connect(masterDry)
  reverbSend.connect(masterReverb)

  // === START NOISE ===
  startNoiseGenerator(ctx)
  isRunning = true
}

/**
 * Create noise buffer (slightly brownish for rain texture)
 */
function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = Math.floor(sampleRate * duration)
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)

  // Generate brownish noise (integrated white noise)
  let lastOut = 0
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1
    // Simple lowpass for brown-ish character
    lastOut = (lastOut + 0.02 * white) / 1.02
    data[i] = lastOut * 3.5  // Boost to compensate for filtering
  }

  return buffer
}

/**
 * Start the noise generator
 */
function startNoiseGenerator(ctx: AudioContext): void {
  if (noiseNode) {
    noiseNode.stop()
    noiseNode.disconnect()
  }

  noiseNode = ctx.createBufferSource()
  noiseNode.buffer = createNoiseBuffer(ctx, 4)
  noiseNode.loop = true
  noiseNode.connect(noiseHighpass!)
  noiseNode.start()
}

/**
 * Update rain/resonator parameters based on intensity (call each frame)
 */
export function updateRain(): void {
  if (!isRunning) return

  const ctx = getAudioContext()
  if (!ctx) return

  const cfg = config.resonator
  const intensity = getIntensity()
  const now = ctx.currentTime

  // === DRY PATH ===
  // Dry volume increases slightly with intensity
  if (dryGain) {
    const dryVol = lerp(0.12, 0.22, intensity)
    dryGain.gain.setTargetAtTime(dryVol, now, 0.15)
  }

  // === WET PATH (resonator) ===
  // Wet mix increases with intensity (tonal emergence)
  if (wetGain) {
    const wetMix = lerp(cfg.baseWetMix, cfg.maxWetMix, intensity)
    wetGain.gain.setTargetAtTime(wetMix, now, 0.2)
  }

  // Resonator Q increases with intensity (more ring)
  const targetQ = lerp(cfg.baseQ, cfg.maxQ, intensity)
  for (const resonator of resonators) {
    resonator.Q.setTargetAtTime(targetQ, now, 0.3)
  }
}

/**
 * Update wind modulation on resonators
 * @param windStrength - 0 to 1
 * @param windDirection - optional bias (-1 to 1)
 */
export function updateWindModulation(windStrength: number, windDirection = 0): void {
  if (!isRunning) return

  const ctx = getAudioContext()
  if (!ctx) return

  const cfg = config.resonator
  const now = ctx.currentTime
  currentWindStrength = windStrength

  // Update LFO gains based on wind strength
  for (let i = 0; i < windLFOGains.length; i++) {
    const baseFreq = cfg.frequencies[i]
    // Max detune in Hz based on percentage
    const maxDetuneHz = baseFreq * (cfg.windDetunePctMax / 100)
    // Scale by wind strength
    const detuneAmount = maxDetuneHz * windStrength

    windLFOGains[i].gain.setTargetAtTime(detuneAmount, now, 0.5)
  }
}

/**
 * Trigger click excitation on wet path
 * Creates a transient "energizing" of the resonant surface
 */
export function triggerClickExcitation(): void {
  if (!isRunning || !exciteGain) return

  const ctx = getAudioContext()
  if (!ctx) return

  const cfg = config.resonator
  const now = ctx.currentTime

  // Clear any pending decay
  if (exciteDecayTimeout !== null) {
    clearTimeout(exciteDecayTimeout)
  }

  // Fast attack: boost excitation gain
  exciteGain.gain.cancelScheduledValues(now)
  exciteGain.gain.setValueAtTime(exciteGain.gain.value, now)
  exciteGain.gain.linearRampToValueAtTime(1 + cfg.clickExciteGain, now + 0.015)

  // Briefly boost Q on all resonators
  for (const resonator of resonators) {
    const currentQ = resonator.Q.value
    resonator.Q.cancelScheduledValues(now)
    resonator.Q.setValueAtTime(currentQ, now)
    resonator.Q.linearRampToValueAtTime(currentQ + cfg.clickQBoost, now + 0.02)
  }

  // Decay back to normal
  const decayTime = cfg.clickDecayMs / 1000
  exciteGain.gain.setTargetAtTime(1.0, now + 0.02, decayTime / 3)

  // Reset Q after decay
  exciteDecayTimeout = window.setTimeout(() => {
    if (!isRunning) return
    const ctx2 = getAudioContext()
    if (!ctx2) return
    
    const now2 = ctx2.currentTime
    const intensity = getIntensity()
    const targetQ = lerp(cfg.baseQ, cfg.maxQ, intensity)
    
    for (const resonator of resonators) {
      resonator.Q.setTargetAtTime(targetQ, now2, 0.2)
    }
  }, cfg.clickDecayMs)
}

/**
 * Stop rain synthesis
 */
export function stopRain(): void {
  if (noiseNode) {
    noiseNode.stop()
    noiseNode.disconnect()
    noiseNode = null
  }

  for (const lfo of windLFOs) {
    lfo.stop()
    lfo.disconnect()
  }
  windLFOs = []
  windLFOGains = []
  resonators = []

  if (exciteDecayTimeout !== null) {
    clearTimeout(exciteDecayTimeout)
    exciteDecayTimeout = null
  }

  isRunning = false
}

/**
 * Check if rain is running
 */
export function isRainRunning(): boolean {
  return isRunning
}

// === MANUAL CONTROLS ===

/**
 * Set resonator wet mix (0-1)
 * Higher values make the tonal resonance more audible
 */
export function setResonatorWetMix(value: number): void {
  config.resonator.maxWetMix = value
  // Also bump the base so it's always somewhat audible
  config.resonator.baseWetMix = value * 0.15
  
  // Apply immediately if running
  if (isRunning && wetGain) {
    const ctx = getAudioContext()
    if (ctx) {
      wetGain.gain.setTargetAtTime(value, ctx.currentTime, 0.1)
    }
  }
}

/**
 * Set resonator Q (resonance amount)
 * Higher values = more ringing/tonal
 */
export function setResonatorQ(value: number): void {
  // Map 0-1 to Q range 5-60
  const q = 5 + value * 55
  config.resonator.baseQ = q * 0.5
  config.resonator.maxQ = q
  
  // Apply immediately if running
  if (isRunning) {
    const ctx = getAudioContext()
    if (ctx) {
      for (const resonator of resonators) {
        resonator.Q.setTargetAtTime(q, ctx.currentTime, 0.1)
      }
    }
  }
}
