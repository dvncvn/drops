/**
 * Ambience synthesis - layered ambient sounds
 * Thunder, Crickets, Wind gusts, Drips, Insects
 */

import { getAudioContext, getDryNode, getReverbNode,
  getThunderGain, getCricketsGain, getWindGustGain, getDripsGain
} from './engine'

let isRunning = false
let schedulerInterval: number | null = null

// Timing accumulators
let nextThunderTime = 0
let nextCricketTime = 0
let nextDripTime = 0

// Continuous nodes (wind only now)
let windNoise: AudioBufferSourceNode | null = null
let windLFO: OscillatorNode | null = null

/**
 * Initialize all ambience
 */
export function initAmbience(): void {
  isRunning = true
  nextThunderTime = 0
  nextCricketTime = 0
  nextDripTime = 0
  
  initWindGust()
  
  // Schedule periodic sounds
  schedulerInterval = window.setInterval(scheduleAmbience, 100)
}

/**
 * Schedule upcoming ambient sounds
 */
function scheduleAmbience(): void {
  const ctx = getAudioContext()
  if (!ctx || !isRunning) return

  const now = ctx.currentTime

  // Thunder scheduling (10-30s intervals)
  while (nextThunderTime < now + 1) {
    if (nextThunderTime < now) nextThunderTime = now + 5 + Math.random() * 10
    
    if (Math.random() < 0.4) {
      playThunder(nextThunderTime)
    }
    nextThunderTime += 10 + Math.random() * 20
  }

  // Cricket scheduling (1-4s intervals)
  while (nextCricketTime < now + 0.5) {
    if (nextCricketTime < now) nextCricketTime = now
    
    if (Math.random() < 0.6) {
      playCricketChirp(nextCricketTime)
    }
    nextCricketTime += 1 + Math.random() * 3
  }

  // Drip scheduling (2-6s intervals)
  while (nextDripTime < now + 0.5) {
    if (nextDripTime < now) nextDripTime = now + 1
    
    if (Math.random() < 0.5) {
      playDrip(nextDripTime)
    }
    nextDripTime += 2 + Math.random() * 4
  }
}

/**
 * Thunder - low rumbling filtered noise
 */
function playThunder(startTime: number): void {
  const ctx = getAudioContext()
  const dry = getDryNode()
  const reverb = getReverbNode()
  const thunderVol = getThunderGain()
  
  if (!ctx || !dry || !reverb || !thunderVol) return

  // Duration 3-8 seconds
  const duration = 3 + Math.random() * 5
  const bufferSize = Math.floor(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  // Create rumbling noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer

  // Very low frequency filter (20-80Hz)
  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 40 + Math.random() * 40
  lowpass.Q.value = 1

  // Secondary rumble filter
  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 60 + Math.random() * 60
  bandpass.Q.value = 0.5

  // Slow envelope - fade in, sustain, fade out
  const envelope = ctx.createGain()
  const attackTime = 0.5 + Math.random() * 1
  const releaseTime = 1 + Math.random() * 2
  envelope.gain.setValueAtTime(0, startTime)
  envelope.gain.linearRampToValueAtTime(0.6, startTime + attackTime)
  envelope.gain.setValueAtTime(0.6, startTime + duration - releaseTime)
  envelope.gain.linearRampToValueAtTime(0, startTime + duration)

  // Stereo width
  const panner = ctx.createStereoPanner()
  panner.pan.value = (Math.random() - 0.5) * 0.6

  source.connect(lowpass)
  lowpass.connect(bandpass)
  bandpass.connect(envelope)
  envelope.connect(panner)
  panner.connect(thunderVol)

  // Heavy reverb for distance
  const drySend = ctx.createGain()
  drySend.gain.value = 0.3
  const reverbSend = ctx.createGain()
  reverbSend.gain.value = 0.8

  thunderVol.connect(drySend)
  thunderVol.connect(reverbSend)
  drySend.connect(dry)
  reverbSend.connect(reverb)

  source.start(startTime)
  source.stop(startTime + duration + 0.1)
}

/**
 * Cricket chirp - high frequency sine bursts
 */
function playCricketChirp(startTime: number): void {
  const ctx = getAudioContext()
  const dry = getDryNode()
  const reverb = getReverbNode()
  const cricketsVol = getCricketsGain()
  
  if (!ctx || !dry || !reverb || !cricketsVol) return

  // 2-4 chirps in a pattern
  const chirpCount = 2 + Math.floor(Math.random() * 3)
  const baseFreq = 4000 + Math.random() * 2000
  const chirpDuration = 0.03 + Math.random() * 0.02
  const chirpGap = 0.05 + Math.random() * 0.03

  for (let i = 0; i < chirpCount; i++) {
    const chirpTime = startTime + i * (chirpDuration + chirpGap)
    
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = baseFreq + Math.random() * 500

    const envelope = ctx.createGain()
    envelope.gain.setValueAtTime(0, chirpTime)
    envelope.gain.linearRampToValueAtTime(0.15, chirpTime + 0.005)
    envelope.gain.exponentialRampToValueAtTime(0.001, chirpTime + chirpDuration)

    const panner = ctx.createStereoPanner()
    panner.pan.value = (Math.random() - 0.5) * 1.6

    osc.connect(envelope)
    envelope.connect(panner)
    panner.connect(cricketsVol)

    osc.start(chirpTime)
    osc.stop(chirpTime + chirpDuration + 0.01)
  }

  // Route to outputs (once per chirp pattern)
  const drySend = ctx.createGain()
  drySend.gain.value = 0.6
  const reverbSend = ctx.createGain()
  reverbSend.gain.value = 0.4

  cricketsVol.connect(drySend)
  cricketsVol.connect(reverbSend)
  drySend.connect(dry)
  reverbSend.connect(reverb)
}

/**
 * Initialize continuous wind gusts
 */
function initWindGust(): void {
  const ctx = getAudioContext()
  const dry = getDryNode()
  const reverb = getReverbNode()
  const windVol = getWindGustGain()
  
  if (!ctx || !dry || !reverb || !windVol) return

  // Create noise buffer
  const bufferSize = Math.floor(ctx.sampleRate * 4)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }

  windNoise = ctx.createBufferSource()
  windNoise.buffer = buffer
  windNoise.loop = true

  // Bandpass for wind character (200-800Hz)
  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 400
  bandpass.Q.value = 0.5

  // LFO for slow swells
  windLFO = ctx.createOscillator()
  windLFO.type = 'sine'
  windLFO.frequency.value = 0.1 + Math.random() * 0.1

  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.3

  const baseGain = ctx.createGain()
  baseGain.gain.value = 0.2

  windLFO.connect(lfoGain)
  lfoGain.connect(baseGain.gain)

  windNoise.connect(bandpass)
  bandpass.connect(baseGain)
  baseGain.connect(windVol)

  // Route to outputs
  const drySend = ctx.createGain()
  drySend.gain.value = 0.5
  const reverbSend = ctx.createGain()
  reverbSend.gain.value = 0.6

  windVol.connect(drySend)
  windVol.connect(reverbSend)
  drySend.connect(dry)
  reverbSend.connect(reverb)

  windNoise.start()
  windLFO.start()
}

/**
 * Drip - sparse reverby tone
 */
function playDrip(startTime: number): void {
  const ctx = getAudioContext()
  const dry = getDryNode()
  const reverb = getReverbNode()
  const dripsVol = getDripsGain()
  
  if (!ctx || !dry || !reverb || !dripsVol) return

  const freq = 800 + Math.random() * 700
  const duration = 0.05

  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, startTime)
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, startTime + duration)

  const envelope = ctx.createGain()
  envelope.gain.setValueAtTime(0, startTime)
  envelope.gain.linearRampToValueAtTime(0.2, startTime + 0.005)
  envelope.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

  const panner = ctx.createStereoPanner()
  panner.pan.value = (Math.random() - 0.5) * 1.4

  osc.connect(envelope)
  envelope.connect(panner)
  panner.connect(dripsVol)

  // Heavy reverb for echo effect
  const drySend = ctx.createGain()
  drySend.gain.value = 0.2
  const reverbSend = ctx.createGain()
  reverbSend.gain.value = 0.9

  dripsVol.connect(drySend)
  dripsVol.connect(reverbSend)
  drySend.connect(dry)
  reverbSend.connect(reverb)

  osc.start(startTime)
  osc.stop(startTime + duration + 0.01)
}

/**
 * Stop all ambience
 */
export function stopAmbience(): void {
  isRunning = false
  
  if (schedulerInterval !== null) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
  }

  // Stop continuous sounds (wind only)
  if (windNoise) {
    windNoise.stop()
    windNoise.disconnect()
    windNoise = null
  }
  if (windLFO) {
    windLFO.stop()
    windLFO.disconnect()
    windLFO = null
  }
}

/**
 * Check if ambience is running
 */
export function isAmbienceRunning(): boolean {
  return isRunning
}
