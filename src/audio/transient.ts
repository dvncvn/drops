/**
 * Transient sounds - water drop clicks and drips
 */

import { getAudioContext, getDryNode, getReverbNode, getDropsGain } from './engine'
import { config } from '../config'

// Resonance settings (controlled by sliders)
let resonanceQ = 0
let resonanceMix = 0
let reverbAmount = 0.2
let brightness = 0.5  // 0-1, controls lowpass cutoff

export function setDropResonanceQ(value: number): void {
  resonanceQ = value
}

export function setDropResonanceMix(value: number): void {
  resonanceMix = value
}

export function setReverbAmount(value: number): void {
  reverbAmount = value
}

export function setDropBrightness(value: number): void {
  brightness = value
}

/**
 * Play a water drop click sound at position
 * @param x - normalized x position (0-1) for panning
 */
export function playDropSound(x: number): void {
  const ctx = getAudioContext()
  const dry = getDryNode()
  const reverb = getReverbNode()
  
  if (!ctx || !dry || !reverb) return

  const now = ctx.currentTime

  // Very short click - 20ms
  const duration = 0.02
  const bufferSize = Math.floor(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  // Sparse impulse pattern for click texture
  for (let i = 0; i < bufferSize; i++) {
    if (Math.random() < 0.4) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    } else {
      data[i] = 0
    }
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer

  // Reduced volume envelope for softer click
  const envelope = ctx.createGain()
  envelope.gain.setValueAtTime(0, now)
  envelope.gain.linearRampToValueAtTime(0.15, now + 0.001) // reduced from 0.4
  envelope.gain.exponentialRampToValueAtTime(0.001, now + duration)

  // Highpass for click character (remove low end)
  const hipass = ctx.createBiquadFilter()
  hipass.type = 'highpass'
  hipass.frequency.value = 1200
  hipass.Q.value = 0.5

  // Bandpass to focus the click
  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 2000 + Math.random() * 1500
  bandpass.Q.value = 1.2

  // Lowpass controlled by brightness slider (800 - 6000 Hz)
  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 800 + brightness * 5200
  lowpass.Q.value = 0.7

  // Stereo panning with random variation
  const panner = ctx.createStereoPanner()
  const basePan = (x - 0.5) * 1.2
  const randomPan = (Math.random() - 0.5) * 0.8
  panner.pan.value = Math.max(-1, Math.min(1, basePan + randomPan))

  // Connect: source -> hipass -> bandpass -> lowpass -> envelope -> panner
  source.connect(hipass)
  hipass.connect(bandpass)
  bandpass.connect(lowpass)
  lowpass.connect(envelope)
  envelope.connect(panner)
  
  // Route through drops volume control
  const dropsVol = getDropsGain()
  if (dropsVol) {
    panner.connect(dropsVol)
    
    // Reverb controlled by slider
    const drySend = ctx.createGain()
    drySend.gain.value = 1 - reverbAmount * 0.3
    const reverbSend = ctx.createGain()
    reverbSend.gain.value = reverbAmount * 0.7
    
    dropsVol.connect(drySend)
    dropsVol.connect(reverbSend)
    drySend.connect(dry)
    reverbSend.connect(reverb)
  }

  source.start(now)
  source.stop(now + duration + 0.01)
  
  // Play resonant ping if enabled
  if (resonanceMix > 0.01) {
    playResonantPing(x, 0.8)
  }
}

/**
 * Play a resonant "ping" - a tonal bloom triggered by drops
 * @param x - normalized x position for panning
 * @param intensity - 0-1, affects volume and decay
 */
function playResonantPing(x: number, intensity: number): void {
  const ctx = getAudioContext()
  const dry = getDryNode()
  const reverb = getReverbNode()
  
  if (!ctx || !dry || !reverb) return
  if (resonanceMix < 0.01) return

  const now = ctx.currentTime
  const cfg = config.resonator
  
  // Pick a random frequency from the resonator set
  const freq = cfg.frequencies[Math.floor(Math.random() * cfg.frequencies.length)]
  
  // Short noise burst to excite the resonator
  const burstDuration = 0.015
  const bufferSize = Math.floor(ctx.sampleRate * burstDuration)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  
  // Dense noise burst
  for (let i = 0; i < bufferSize; i++) {
    const env = 1 - (i / bufferSize)
    data[i] = (Math.random() * 2 - 1) * env
  }
  
  const source = ctx.createBufferSource()
  source.buffer = buffer
  
  // Resonator filter - high Q bandpass creates the tone
  const resonator = ctx.createBiquadFilter()
  resonator.type = 'bandpass'
  resonator.frequency.value = freq
  // Q from 20-80 based on slider (higher = more tonal ring)
  resonator.Q.value = 20 + resonanceQ * 60
  
  // Decay envelope for the resonant ring
  const ringDuration = 0.3 + resonanceQ * 0.5  // 300-800ms based on Q
  const envelope = ctx.createGain()
  const volume = resonanceMix * intensity * 0.4
  envelope.gain.setValueAtTime(volume, now)
  envelope.gain.exponentialRampToValueAtTime(0.001, now + ringDuration)
  
  // Stereo position
  const panner = ctx.createStereoPanner()
  panner.pan.value = Math.max(-1, Math.min(1, (x - 0.5) * 1.5))
  
  // Connect: source -> resonator -> envelope -> panner -> output
  source.connect(resonator)
  resonator.connect(envelope)
  envelope.connect(panner)
  
  // Route through drops gain
  const dropsVol = getDropsGain()
  if (dropsVol) {
    panner.connect(dropsVol)
    
    // Reverb controlled by slider
    const drySend = ctx.createGain()
    drySend.gain.value = 1 - reverbAmount * 0.5  // Keep some dry even at max reverb
    const reverbSend = ctx.createGain()
    reverbSend.gain.value = reverbAmount
    
    dropsVol.connect(drySend)
    dropsVol.connect(reverbSend)
    drySend.connect(dry)
    reverbSend.connect(reverb)
  }
  
  source.start(now)
  source.stop(now + burstDuration)
}

/**
 * Play a light click sound for ambient rain drops
 * Each drop has randomized filter values for natural variation
 * @param x - normalized x position (0-1) for panning
 */
export function playDripSound(x: number): void {
  const ctx = getAudioContext()
  const dry = getDryNode()
  const reverb = getReverbNode()
  
  if (!ctx || !dry || !reverb) return

  const now = ctx.currentTime
  
  // Reduced volume per drop (halved from before)
  const volume = config.dripVolume * (0.25 + Math.random() * 0.5)

  // Short click duration - 5-20ms
  const duration = 0.005 + Math.random() * 0.015
  const bufferSize = Math.floor(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  // Sparse impulse pattern (20-50%) for click texture
  const sparsity = 0.2 + Math.random() * 0.3
  for (let i = 0; i < bufferSize; i++) {
    if (Math.random() < sparsity) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    } else {
      data[i] = 0
    }
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer

  // Instant attack for click
  const envelope = ctx.createGain()
  envelope.gain.setValueAtTime(0, now)
  envelope.gain.linearRampToValueAtTime(volume, now + 0.0005)
  envelope.gain.exponentialRampToValueAtTime(0.001, now + duration)

  // Highpass for click (800-2500Hz) - lowered range
  const hipass = ctx.createBiquadFilter()
  hipass.type = 'highpass'
  hipass.frequency.value = 800 + Math.random() * 1700
  hipass.Q.value = 0.4 + Math.random() * 0.6

  // Bandpass for click focus (1500-4000Hz) - lowered range
  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 1500 + Math.random() * 2500
  bandpass.Q.value = 0.8 + Math.random() * 1.5

  // Lowpass controlled by brightness slider with random variation
  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 600 + brightness * 4000 + Math.random() * 500
  lowpass.Q.value = 0.5

  // Stereo panning with wide random spread
  const panner = ctx.createStereoPanner()
  const basePan = (x - 0.5) * 0.8
  const randomPan = (Math.random() - 0.5) * 1.4
  panner.pan.value = Math.max(-1, Math.min(1, basePan + randomPan))

  // Connect: source -> hipass -> bandpass -> lowpass -> envelope -> panner
  source.connect(hipass)
  hipass.connect(bandpass)
  bandpass.connect(lowpass)
  lowpass.connect(envelope)
  envelope.connect(panner)
  
  // Route through drops volume control
  const dropsVol = getDropsGain()
  if (dropsVol) {
    panner.connect(dropsVol)
    
    // Reverb controlled by slider with slight random variation
    const drySend = ctx.createGain()
    drySend.gain.value = 1 - reverbAmount * 0.3
    const reverbSend = ctx.createGain()
    reverbSend.gain.value = reverbAmount * (0.5 + Math.random() * 0.3)
    
    dropsVol.connect(drySend)
    dropsVol.connect(reverbSend)
    drySend.connect(dry)
    reverbSend.connect(reverb)
  }

  source.start(now)
  source.stop(now + duration + 0.01)
  
  // Play resonant ping if enabled (lower intensity for ambient drips)
  if (resonanceMix > 0.01 && Math.random() < 0.3) {
    playResonantPing(x, 0.4)
  }
}
