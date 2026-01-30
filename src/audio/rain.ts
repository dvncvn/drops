/**
 * Rain bed synthesis - filtered noise that responds to intensity
 */

import { getAudioContext, getDryNode, getReverbNode } from './engine'
import { getIntensity } from '../state'
import { config } from '../config'
import { lerp } from '../utils'

let noiseNode: AudioBufferSourceNode | null = null
let noiseGain: GainNode | null = null
let noiseFilter: BiquadFilterNode | null = null
let noiseFilter2: BiquadFilterNode | null = null
let windLFO: OscillatorNode | null = null
let isRunning = false

/**
 * Initialize rain synthesis
 */
export function initRain(): void {
  const ctx = getAudioContext()
  const dry = getDryNode()
  const reverb = getReverbNode()
  
  if (!ctx || !dry || !reverb) return

  // Main noise gain
  noiseGain = ctx.createGain()
  noiseGain.gain.value = config.audioGainRange.min

  // Bandpass filter for rain character
  noiseFilter = ctx.createBiquadFilter()
  noiseFilter.type = 'bandpass'
  noiseFilter.frequency.value = 4000
  noiseFilter.Q.value = 0.8

  // High shelf for brightness control
  noiseFilter2 = ctx.createBiquadFilter()
  noiseFilter2.type = 'highshelf'
  noiseFilter2.frequency.value = 6000
  noiseFilter2.gain.value = -6

  // LFO for natural variation
  windLFO = ctx.createOscillator()
  windLFO.type = 'sine'
  windLFO.frequency.value = 0.15

  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 800

  windLFO.connect(lfoGain)
  lfoGain.connect(noiseFilter.frequency)
  windLFO.start()

  // Connect chain: noise -> filter -> filter2 -> gain -> dry/reverb
  noiseFilter.connect(noiseFilter2)
  noiseFilter2.connect(noiseGain)
  
  // Split to dry and reverb
  const drySend = ctx.createGain()
  drySend.gain.value = 0.7
  const reverbSend = ctx.createGain()
  reverbSend.gain.value = 0.5
  
  noiseGain.connect(drySend)
  noiseGain.connect(reverbSend)
  drySend.connect(dry)
  reverbSend.connect(reverb)

  // Create and start noise
  startNoiseGenerator(ctx)
  isRunning = true
}

/**
 * Create white noise buffer
 */
function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = Math.floor(sampleRate * duration)
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1
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
  noiseNode.buffer = createNoiseBuffer(ctx, 4) // 4 second loop
  noiseNode.loop = true
  noiseNode.connect(noiseFilter!)
  noiseNode.start()
}

/**
 * Update rain parameters based on intensity (call each frame)
 */
export function updateRain(): void {
  if (!isRunning || !noiseGain || !noiseFilter2) return

  const ctx = getAudioContext()
  if (!ctx) return

  const intensity = getIntensity()
  const now = ctx.currentTime

  // Volume scales with intensity
  const targetGain = lerp(
    config.audioGainRange.min,
    config.audioGainRange.max,
    intensity
  )
  noiseGain.gain.setTargetAtTime(targetGain, now, 0.1)

  // Brightness increases with intensity
  const targetBrightness = lerp(-8, 0, intensity)
  noiseFilter2.gain.setTargetAtTime(targetBrightness, now, 0.15)

  // Filter frequency shifts slightly with intensity
  if (noiseFilter) {
    const targetFreq = lerp(
      config.rainFilterFreq.min,
      config.rainFilterFreq.max,
      intensity
    )
    noiseFilter.frequency.setTargetAtTime(targetFreq, now, 0.2)
  }
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
  if (windLFO) {
    windLFO.stop()
    windLFO.disconnect()
    windLFO = null
  }
  isRunning = false
}

/**
 * Check if rain is running
 */
export function isRainRunning(): boolean {
  return isRunning
}
