/**
 * Click transient - water drop sound
 */

import { getAudioContext, getDryNode, getReverbNode } from './engine'

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
