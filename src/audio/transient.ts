/**
 * Transient sounds - water drop clicks and drips
 */

import { getAudioContext, getDryNode, getReverbNode, getDropsGain } from './engine'
import { config } from '../config'

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

  // Very fast envelope for click
  const envelope = ctx.createGain()
  envelope.gain.setValueAtTime(0, now)
  envelope.gain.linearRampToValueAtTime(0.4, now + 0.001) // instant attack
  envelope.gain.exponentialRampToValueAtTime(0.001, now + duration)

  // Highpass for click character (remove low end)
  const hipass = ctx.createBiquadFilter()
  hipass.type = 'highpass'
  hipass.frequency.value = 2000
  hipass.Q.value = 0.7

  // Bandpass to focus the click
  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 4000 + Math.random() * 2000
  bandpass.Q.value = 1.5

  // Stereo panning based on click position
  const panner = ctx.createStereoPanner()
  panner.pan.value = (x - 0.5) * 1.4

  // Connect: source -> hipass -> bandpass -> envelope -> panner
  source.connect(hipass)
  hipass.connect(bandpass)
  bandpass.connect(envelope)
  envelope.connect(panner)
  
  // Route through drops volume control
  const dropsVol = getDropsGain()
  if (dropsVol) {
    panner.connect(dropsVol)
    
    // Split to dry and reverb
    const drySend = ctx.createGain()
    drySend.gain.value = 0.7
    const reverbSend = ctx.createGain()
    reverbSend.gain.value = 0.5
    
    dropsVol.connect(drySend)
    dropsVol.connect(reverbSend)
    drySend.connect(dry)
    reverbSend.connect(reverb)
  }

  source.start(now)
  source.stop(now + duration + 0.01)
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
  
  // Randomize volume per drop
  const volume = config.dripVolume * (0.5 + Math.random() * 1.0)

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

  // Higher highpass for click (1500-5000Hz)
  const hipass = ctx.createBiquadFilter()
  hipass.type = 'highpass'
  hipass.frequency.value = 1500 + Math.random() * 3500
  hipass.Q.value = 0.5 + Math.random() * 1.0

  // Higher bandpass for click focus (3000-8000Hz)
  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 3000 + Math.random() * 5000
  bandpass.Q.value = 1 + Math.random() * 2

  // Stereo panning with randomization
  const panner = ctx.createStereoPanner()
  panner.pan.value = (x - 0.5) * 1.6 + (Math.random() - 0.5) * 0.3

  // Connect: source -> hipass -> bandpass -> envelope -> panner
  source.connect(hipass)
  hipass.connect(bandpass)
  bandpass.connect(envelope)
  envelope.connect(panner)
  
  // Route through drops volume control
  const dropsVol = getDropsGain()
  if (dropsVol) {
    panner.connect(dropsVol)
    
    // Variable reverb amount per drop
    const dryAmount = 0.7 + Math.random() * 0.3
    const reverbAmount = 0.15 + Math.random() * 0.25
    
    const drySend = ctx.createGain()
    drySend.gain.value = dryAmount
    const reverbSend = ctx.createGain()
    reverbSend.gain.value = reverbAmount
    
    dropsVol.connect(drySend)
    dropsVol.connect(reverbSend)
    drySend.connect(dry)
    reverbSend.connect(reverb)
  }

  source.start(now)
  source.stop(now + duration + 0.01)
}
