/**
 * Intensity state - manages the energy level of the system
 * Clicks add impulse, which decays back toward baseline
 */

import { config } from './config'

let intensity = config.baselineIntensity

/**
 * Add energy impulse (from click)
 */
export function addImpulse(amount = config.clickImpulseStrength) {
  intensity = Math.min(1, intensity + amount)
}

/**
 * Update state (call each frame)
 * Decays toward baseline, not zero
 */
export function updateState(delta: number): void {
  const baseline = config.baselineIntensity
  const decay = config.decayRate
  
  // Exponential decay toward baseline
  intensity = baseline + (intensity - baseline) * Math.exp(-decay * delta)
}

/**
 * Get current intensity (0-1)
 */
export function getIntensity(): number {
  return intensity
}

/**
 * Reset to baseline
 */
export function resetState(): void {
  intensity = config.baselineIntensity
}
