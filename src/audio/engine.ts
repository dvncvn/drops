/**
 * Audio engine - manages AudioContext, master chain, and effects
 */

import { config } from '../config'

let audioContext: AudioContext | null = null
let masterGain: GainNode | null = null
let reverbGain: GainNode | null = null
let reverbNode: ConvolverNode | null = null
let dryGain: GainNode | null = null

// Separate gain nodes for rain bed and drop sounds
let rainGain: GainNode | null = null
let dropsGain: GainNode | null = null

/**
 * Initialize audio engine (requires user gesture)
 */
export async function initAudio(): Promise<void> {
  if (audioContext) return

  audioContext = new AudioContext()

  // Master gain
  masterGain = audioContext.createGain()
  masterGain.gain.value = config.masterVolume
  masterGain.connect(audioContext.destination)

  // Dry path
  dryGain = audioContext.createGain()
  dryGain.gain.value = 0.6
  dryGain.connect(masterGain)

  // Reverb path
  reverbGain = audioContext.createGain()
  reverbGain.gain.value = 0.4

  // Create impulse response for reverb
  reverbNode = audioContext.createConvolver()
  reverbNode.buffer = createReverbImpulse(audioContext, 2.5, 2)

  reverbGain.connect(reverbNode)
  reverbNode.connect(masterGain)

  // Separate gain nodes for rain bed and drop sounds
  rainGain = audioContext.createGain()
  rainGain.gain.value = config.rainVolume
  
  dropsGain = audioContext.createGain()
  dropsGain.gain.value = config.dropsVolume
}

/**
 * Create reverb impulse response
 */
function createReverbImpulse(
  ctx: AudioContext,
  duration: number,
  decay: number
): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = Math.floor(sampleRate * duration)
  const buffer = ctx.createBuffer(2, length, sampleRate)

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel)
    const preDelay = Math.floor(sampleRate * 0.02)

    for (let i = 0; i < length; i++) {
      if (i < preDelay) {
        data[i] = 0
        continue
      }

      const t = (i - preDelay) / (length - preDelay)
      const envelope = Math.exp(-t * decay)

      // Filtered noise
      let noise = Math.random() * 2 - 1
      if (i > preDelay) {
        noise = noise * 0.6 + (data[i - 1] || 0) * 0.4
      }

      data[i] = noise * envelope * 0.8
    }
  }

  return buffer
}

/**
 * Get the audio context
 */
export function getAudioContext(): AudioContext | null {
  return audioContext
}

/**
 * Get the dry output node
 */
export function getDryNode(): GainNode | null {
  return dryGain
}

/**
 * Get the reverb send node
 */
export function getReverbNode(): GainNode | null {
  return reverbGain
}

/**
 * Get master gain node
 */
export function getMasterGain(): GainNode | null {
  return masterGain
}

/**
 * Check if audio is initialized and running
 */
export function isAudioReady(): boolean {
  return audioContext !== null && audioContext.state === 'running'
}

/**
 * Resume audio context if suspended
 */
export async function resumeAudio(): Promise<void> {
  if (audioContext && audioContext.state === 'suspended') {
    await audioContext.resume()
  }
}

/**
 * Set master volume (0-1)
 */
export function setMasterVolume(volume: number): void {
  if (masterGain && audioContext) {
    masterGain.gain.setTargetAtTime(volume, audioContext.currentTime, 0.1)
  }
}

/**
 * Get rain gain node (for rain bed to connect to)
 */
export function getRainGain(): GainNode | null {
  return rainGain
}

/**
 * Get drops gain node (for drop sounds to connect to)
 */
export function getDropsGain(): GainNode | null {
  return dropsGain
}

/**
 * Set rain volume (0-1)
 */
export function setRainVolume(volume: number): void {
  if (rainGain && audioContext) {
    rainGain.gain.setTargetAtTime(volume, audioContext.currentTime, 0.1)
  }
}

/**
 * Set drops volume (0-1)
 */
export function setDropsVolume(volume: number): void {
  if (dropsGain && audioContext) {
    dropsGain.gain.setTargetAtTime(volume, audioContext.currentTime, 0.1)
  }
}
