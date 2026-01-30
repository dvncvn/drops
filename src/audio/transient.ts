/**
 * Transient sounds - water drop clicks and drips
 */

import { getAudioContext, getDryNode, getReverbNode } from './engine'
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
  
  // Split to dry and reverb
  const drySend = ctx.createGain()
  drySend.gain.value = 0.6
  const reverbSend = ctx.createGain()
  reverbSend.gain.value = 0.8 // more reverb on drops
  
  panner.connect(drySend)
  panner.connect(reverbSend)
  drySend.connect(dry)
  reverbSend.connect(reverb)

  // Start and stop
  source.start(now)
  source.stop(now + 0.08)
  osc.start(now)
  osc.stop(now + 0.06)
}

/**
 * Play a light drip/crackle sound for ambient rain drops
 * Lighter and more subtle than click sounds
 * @param x - normalized x position (0-1) for panning
 */
export function playDripSound(x: number): void {
  const ctx = getAudioContext()
  const dry = getDryNode()
  const reverb = getReverbNode()
  
  if (!ctx || !dry || !reverb) return

  const now = ctx.currentTime
  const volume = config.dripVolume

  // Very short click/crackle - 15-30ms
  const duration = 0.015 + Math.random() * 0.015
  const bufferSize = Math.floor(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  // Sparse crackle pattern - not pure noise
  for (let i = 0; i < bufferSize; i++) {
    // Create sparse impulses for crackle texture
    if (Math.random() < 0.3) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    } else {
      data[i] = 0
    }
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer

  // Fast envelope
  const envelope = ctx.createGain()
  envelope.gain.setValueAtTime(0, now)
  envelope.gain.linearRampToValueAtTime(volume, now + 0.001)
  envelope.gain.exponentialRampToValueAtTime(0.001, now + duration)

  // Highpass to make it clickier
  const hipass = ctx.createBiquadFilter()
  hipass.type = 'highpass'
  hipass.frequency.value = 800 + Math.random() * 1200
  hipass.Q.value = 0.5

  // Bandpass for character
  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 2000 + Math.random() * 2000
  bandpass.Q.value = 1.5

  // Tiny pitch component (subtle "tick")
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  const baseFreq = 800 + Math.random() * 600
  osc.frequency.setValueAtTime(baseFreq, now)
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.3, now + 0.02)

  const oscGain = ctx.createGain()
  oscGain.gain.setValueAtTime(volume * 0.08, now)
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015)

  // Stereo panning with some randomization
  const panner = ctx.createStereoPanner()
  panner.pan.value = (x - 0.5) * 1.6 + (Math.random() - 0.5) * 0.2

  // Mix node
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

  // Connect to output with panning
  mix.connect(panner)
  
  // Mostly dry for clicks, little reverb
  const drySend = ctx.createGain()
  drySend.gain.value = 0.8
  const reverbSend = ctx.createGain()
  reverbSend.gain.value = 0.25
  
  panner.connect(drySend)
  panner.connect(reverbSend)
  drySend.connect(dry)
  reverbSend.connect(reverb)

  // Start and stop
  source.start(now)
  source.stop(now + duration + 0.01)
  osc.start(now)
  osc.stop(now + 0.025)
}
