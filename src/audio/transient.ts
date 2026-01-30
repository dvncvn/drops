/**
 * Transient sounds - water drop clicks and drips
 */

import { getAudioContext, getDryNode, getReverbNode, getDropsGain } from './engine'
import { config } from '../config'

/**
 * Play a water drop transient sound at position
 * @param x - normalized x position (0-1) for panning
 */
export function playDropSound(x: number): void {
  const ctx = getAudioContext()
  const dry = getDryNode()
  const reverb = getReverbNode()
  
  if (!ctx || !dry || !reverb) return

  const now = ctx.currentTime

  // Create a short noise burst
  const bufferSize = Math.floor(ctx.sampleRate * 0.08) // 80ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  // Fill with noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer

  // Envelope for the burst
  const envelope = ctx.createGain()
  envelope.gain.setValueAtTime(0, now)
  envelope.gain.linearRampToValueAtTime(0.3, now + 0.003) // fast attack
  envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.06) // quick decay

  // Low-pass filter for water character
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(2000, now)
  filter.frequency.exponentialRampToValueAtTime(400, now + 0.05)
  filter.Q.value = 2

  // Subtle pitch component (sine wave "plop")
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(400, now)
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.04)

  const oscGain = ctx.createGain()
  oscGain.gain.setValueAtTime(0.15, now)
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

  // Stereo panning based on click position
  const panner = ctx.createStereoPanner()
  panner.pan.value = (x - 0.5) * 1.4 // spread across stereo field

  // Mix node
  const mix = ctx.createGain()
  mix.gain.value = 1

  // Connect noise path
  source.connect(filter)
  filter.connect(envelope)
  envelope.connect(mix)

  // Connect oscillator path
  osc.connect(oscGain)
  oscGain.connect(mix)

  // Connect to output with panning
  mix.connect(panner)
  
  // Route through drops volume control
  const dropsVol = getDropsGain()
  if (dropsVol) {
    panner.connect(dropsVol)
    
    // Split to dry and reverb
    const drySend = ctx.createGain()
    drySend.gain.value = 0.6
    const reverbSend = ctx.createGain()
    reverbSend.gain.value = 0.8 // more reverb on drops
    
    dropsVol.connect(drySend)
    dropsVol.connect(reverbSend)
    drySend.connect(dry)
    reverbSend.connect(reverb)
  }

  // Start and stop
  source.start(now)
  source.stop(now + 0.08)
  osc.start(now)
  osc.stop(now + 0.06)
}

/**
 * Play a light drip/crackle sound for ambient rain drops
 * Each drop has randomized filter/envelope values for natural variation
 * @param x - normalized x position (0-1) for panning
 */
export function playDripSound(x: number): void {
  const ctx = getAudioContext()
  const dry = getDryNode()
  const reverb = getReverbNode()
  
  if (!ctx || !dry || !reverb) return

  const now = ctx.currentTime
  
  // Randomize volume per drop (±40% from base)
  const volume = config.dripVolume * (0.6 + Math.random() * 0.8)

  // Variable duration - 10-50ms for different drop sizes
  const duration = 0.01 + Math.random() * 0.04
  const bufferSize = Math.floor(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  // Variable sparse density (15-45%) for different textures
  const sparsity = 0.15 + Math.random() * 0.3
  for (let i = 0; i < bufferSize; i++) {
    if (Math.random() < sparsity) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    } else {
      data[i] = 0
    }
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer

  // Variable attack time (0.5-3ms)
  const attackTime = 0.0005 + Math.random() * 0.0025
  const envelope = ctx.createGain()
  envelope.gain.setValueAtTime(0, now)
  envelope.gain.linearRampToValueAtTime(volume, now + attackTime)
  envelope.gain.exponentialRampToValueAtTime(0.001, now + duration)

  // Widely varied highpass (400-2500Hz) - lower = deeper drops
  const hipass = ctx.createBiquadFilter()
  hipass.type = 'highpass'
  hipass.frequency.value = 400 + Math.random() * 2100
  hipass.Q.value = 0.3 + Math.random() * 1.2

  // Widely varied bandpass (1000-6000Hz) with variable Q
  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 1000 + Math.random() * 5000
  bandpass.Q.value = 0.5 + Math.random() * 3

  // Variable pitch component (400-1800Hz base)
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  const baseFreq = 400 + Math.random() * 1400
  const freqDecay = 0.2 + Math.random() * 0.4  // how much pitch drops
  const pitchTime = 0.01 + Math.random() * 0.03
  osc.frequency.setValueAtTime(baseFreq, now)
  osc.frequency.exponentialRampToValueAtTime(baseFreq * freqDecay, now + pitchTime)

  // Variable oscillator mix (some drops more tonal, some more noisy)
  const oscMix = 0.03 + Math.random() * 0.12
  const oscGain = ctx.createGain()
  oscGain.gain.setValueAtTime(volume * oscMix, now)
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + pitchTime)

  // Stereo panning with randomization
  const panner = ctx.createStereoPanner()
  panner.pan.value = (x - 0.5) * 1.6 + (Math.random() - 0.5) * 0.3

  const mix = ctx.createGain()
  mix.gain.value = 1

  // Connect noise path
  source.connect(hipass)
  hipass.connect(bandpass)
  bandpass.connect(envelope)
  envelope.connect(mix)

  // Connect oscillator path
  osc.connect(oscGain)
  oscGain.connect(mix)

  mix.connect(panner)
  
  // Route through drops volume control
  const dropsVol = getDropsGain()
  if (dropsVol) {
    panner.connect(dropsVol)
    
    // Variable reverb amount per drop
    const dryAmount = 0.6 + Math.random() * 0.4
    const reverbAmount = 0.1 + Math.random() * 0.3
    
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
  osc.start(now)
  osc.stop(now + pitchTime + 0.01)
}
