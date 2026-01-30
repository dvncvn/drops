/**
 * Frog synthesis - ambient croaking sounds
 */

import { getAudioContext, getDryNode, getReverbNode, getFrogGain } from './engine'
import { config } from '../config'

let isRunning = false
let nextCroakTime = 0
let schedulerInterval: number | null = null

/**
 * Initialize frog synthesis
 */
export function initFrog(): void {
  isRunning = true
  nextCroakTime = 0
  
  // Schedule croaks periodically
  schedulerInterval = window.setInterval(scheduleCroaks, 100)
}

/**
 * Schedule upcoming croaks
 */
function scheduleCroaks(): void {
  const ctx = getAudioContext()
  if (!ctx || !isRunning) return

  const now = ctx.currentTime

  // Schedule croaks ahead of time
  while (nextCroakTime < now + 0.5) {
    if (nextCroakTime < now) {
      nextCroakTime = now
    }
    
    // Random chance to croak (creates natural gaps)
    if (Math.random() < config.frogCroakChance) {
      playCroak(nextCroakTime)
      
      // Sometimes do a double/triple croak
      if (Math.random() < 0.3) {
        playCroak(nextCroakTime + 0.15 + Math.random() * 0.1)
      }
      if (Math.random() < 0.15) {
        playCroak(nextCroakTime + 0.35 + Math.random() * 0.1)
      }
    }
    
    // Time until next potential croak
    nextCroakTime += config.frogInterval.min + 
      Math.random() * (config.frogInterval.max - config.frogInterval.min)
  }
}

/**
 * Play a single croak sound at the specified time
 */
function playCroak(startTime: number): void {
  const ctx = getAudioContext()
  const dry = getDryNode()
  const reverb = getReverbNode()
  const frogVol = getFrogGain()
  
  if (!ctx || !dry || !reverb || !frogVol) return

  // Randomize pitch for variety (different "frogs")
  const basePitch = config.frogPitch.min + 
    Math.random() * (config.frogPitch.max - config.frogPitch.min)
  
  // Duration of the croak
  const duration = 0.08 + Math.random() * 0.12

  // Main tone oscillator (low "ribbit")
  const osc1 = ctx.createOscillator()
  osc1.type = 'sine'
  osc1.frequency.setValueAtTime(basePitch, startTime)
  osc1.frequency.exponentialRampToValueAtTime(basePitch * 0.7, startTime + duration)

  // Secondary harmonic for richness
  const osc2 = ctx.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(basePitch * 2.2, startTime)
  osc2.frequency.exponentialRampToValueAtTime(basePitch * 1.5, startTime + duration)

  // Amplitude modulation for pulsing "ribbit" character
  const tremolo = ctx.createOscillator()
  tremolo.type = 'sine'
  tremolo.frequency.value = 25 + Math.random() * 15 // Fast modulation

  const tremoloGain = ctx.createGain()
  tremoloGain.gain.value = 0.4

  // Main envelope
  const envelope = ctx.createGain()
  envelope.gain.setValueAtTime(0, startTime)
  envelope.gain.linearRampToValueAtTime(0.3, startTime + 0.01)
  envelope.gain.setValueAtTime(0.3, startTime + duration * 0.3)
  envelope.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

  // Secondary oscillator envelope (quieter)
  const envelope2 = ctx.createGain()
  envelope2.gain.setValueAtTime(0, startTime)
  envelope2.gain.linearRampToValueAtTime(0.1, startTime + 0.01)
  envelope2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.8)

  // Bandpass filter for more organic sound
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = basePitch * 3
  filter.Q.value = 2 + Math.random() * 2

  // Mix node
  const mix = ctx.createGain()
  mix.gain.value = 0.6 + Math.random() * 0.4

  // Stereo position (frogs at different positions)
  const panner = ctx.createStereoPanner()
  panner.pan.value = (Math.random() - 0.5) * 1.4

  // Connect tremolo modulation
  tremolo.connect(tremoloGain)
  tremoloGain.connect(envelope.gain)

  // Connect oscillators
  osc1.connect(envelope)
  osc2.connect(envelope2)
  
  envelope.connect(filter)
  envelope2.connect(filter)
  
  filter.connect(mix)
  mix.connect(panner)
  panner.connect(frogVol)

  // Route to dry and reverb
  const drySend = ctx.createGain()
  drySend.gain.value = 0.5
  const reverbSend = ctx.createGain()
  reverbSend.gain.value = 0.6 // More reverb for distance

  frogVol.connect(drySend)
  frogVol.connect(reverbSend)
  drySend.connect(dry)
  reverbSend.connect(reverb)

  // Start and stop
  osc1.start(startTime)
  osc1.stop(startTime + duration + 0.05)
  osc2.start(startTime)
  osc2.stop(startTime + duration + 0.05)
  tremolo.start(startTime)
  tremolo.stop(startTime + duration + 0.05)
}

/**
 * Stop frog synthesis
 */
export function stopFrog(): void {
  isRunning = false
  if (schedulerInterval !== null) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
  }
}

/**
 * Check if frog is running
 */
export function isFrogRunning(): boolean {
  return isRunning
}
