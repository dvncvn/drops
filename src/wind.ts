/**
 * Wind field using Perlin noise for organic motion
 */

import { noise2D } from './utils'
import { config } from './config'

let time = 0

/**
 * Get wind force at a position
 * Returns { x, y } force vector normalized to -1..1
 */
export function getWind(x: number, y: number): { x: number; y: number } {
  const turbulence = config.windTurbulence
  const timeScale = config.windTimeScale
  const strength = config.windStrength

  const nx = x * turbulence
  const ny = y * turbulence
  const nt = time * timeScale

  // Sample noise at offset positions for x and y components
  const windX = noise2D(nx + nt, ny) * strength
  const windY = noise2D(nx, ny + nt + 100) * strength * 0.3 // less vertical variation

  return { x: windX, y: windY }
}

/**
 * Update wind time (call each frame)
 */
export function updateWind(delta: number): void {
  time += delta * 1000
}

/**
 * Reset wind time (for reseed)
 */
export function resetWind(): void {
  time = 0
}

/**
 * Get current wind strength config value
 */
export function getWindStrength(): number {
  return config.windStrength
}
