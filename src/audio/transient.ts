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

  // Lowpass to soften and push back in mix
  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 2500
  lowpass.Q.value = 0.7

  // Stereo panning based on click position
  const panner = ctx.createStereoPanner()
  panner.pan.value = (x - 0.5) * 1.4

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

  // Lowpass to soften and push back in mix
  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 2000 + Math.random() * 1000
  lowpass.Q.value = 0.5

  // Stereo panning with randomization
  const panner = ctx.createStereoPanner()
  panner.pan.value = (x - 0.5) * 1.6 + (Math.random() - 0.5) * 0.3

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
