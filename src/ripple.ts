/**
 * Ripple pool management - object pooling for performance
 */

import { config } from './config'
import { getWind } from './wind'
import { getIntensity } from './state'
import { randomRange, lerp } from './utils'

export interface Ripple {
  x: number
  y: number
  radius: number
  maxRadius: number
  opacity: number
  speed: number
  windOffsetX: number
  windOffsetY: number
  isClick: boolean
  active: boolean
}

// Object pool
const pool: Ripple[] = []
let spawnAccumulator = 0

/**
 * Initialize the ripple pool
 */
export function initRipplePool(): void {
  pool.length = 0
  for (let i = 0; i < config.maxRipples; i++) {
    pool.push(createInactiveRipple())
  }
  spawnAccumulator = 0
}

function createInactiveRipple(): Ripple {
  return {
    x: 0,
    y: 0,
    radius: 0,
    maxRadius: 0,
    opacity: 0,
    speed: 0,
    windOffsetX: 0,
    windOffsetY: 0,
    isClick: false,
    active: false
  }
}

/**
 * Get an inactive ripple from the pool
 */
function getFromPool(): Ripple | null {
  for (const ripple of pool) {
    if (!ripple.active) return ripple
  }
  return null
}

/**
 * Spawn a click ripple at position
 */
export function spawnClickRipple(x: number, y: number): void {
  const ripple = getFromPool()
  if (!ripple) return

  const lifetime = randomRange(config.rippleLifetime.min, config.rippleLifetime.max)
  const maxRadius = randomRange(config.rippleMaxRadius.min, config.rippleMaxRadius.max) * config.clickRippleScale

  ripple.x = x
  ripple.y = y
  ripple.radius = 2
  ripple.maxRadius = maxRadius
  ripple.opacity = 0.9
  ripple.speed = maxRadius / lifetime
  ripple.windOffsetX = 0
  ripple.windOffsetY = 0
  ripple.isClick = true
  ripple.active = true

  // Spawn secondary rings with delay effect (staggered)
  setTimeout(() => spawnSecondaryRipple(x, y, maxRadius * 0.8), 60)
  setTimeout(() => spawnSecondaryRipple(x, y, maxRadius * 0.6), 120)
}

function spawnSecondaryRipple(x: number, y: number, maxRadius: number): void {
  const ripple = getFromPool()
  if (!ripple) return

  const lifetime = randomRange(config.rippleLifetime.min, config.rippleLifetime.max)

  ripple.x = x
  ripple.y = y
  ripple.radius = 2
  ripple.maxRadius = maxRadius
  ripple.opacity = 0.6
  ripple.speed = maxRadius / lifetime
  ripple.windOffsetX = 0
  ripple.windOffsetY = 0
  ripple.isClick = true
  ripple.active = true
}

/**
 * Spawn an ambient raindrop ripple
 */
function spawnAmbientRipple(width: number, height: number): void {
  const ripple = getFromPool()
  if (!ripple) return

  const lifetime = randomRange(config.rippleLifetime.min, config.rippleLifetime.max)
  const maxRadius = randomRange(config.rippleMaxRadius.min, config.rippleMaxRadius.max) * 0.6

  ripple.x = randomRange(0, width)
  ripple.y = randomRange(0, height)
  ripple.radius = 3
  ripple.maxRadius = maxRadius
  ripple.opacity = randomRange(0.5, 0.8)
  ripple.speed = maxRadius / lifetime
  ripple.windOffsetX = 0
  ripple.windOffsetY = 0
  ripple.isClick = false
  ripple.active = true
}

/**
 * Update all ripples
 */
export function updateRipples(delta: number, width: number, height: number): void {
  // Spawn ambient ripples based on intensity
  const intensity = getIntensity()
  const spawnRate = lerp(config.rippleSpawnRate.min, config.rippleSpawnRate.max, intensity)
  
  spawnAccumulator += delta * spawnRate
  while (spawnAccumulator >= 1) {
    spawnAmbientRipple(width, height)
    spawnAccumulator -= 1
  }

  // Update existing ripples
  for (const ripple of pool) {
    if (!ripple.active) continue

    // Expand radius
    ripple.radius += ripple.speed * delta

    // Apply wind distortion
    const wind = getWind(ripple.x, ripple.y)
    ripple.windOffsetX += wind.x * delta * 20
    ripple.windOffsetY += wind.y * delta * 20

    // Fade out as it expands (slower fade to stay visible longer)
    const progress = ripple.radius / ripple.maxRadius
    // Use initial opacity scaled by remaining progress
    const fadeStart = 0.3 // start fading at 30% expansion
    if (progress > fadeStart) {
      const fadeProgress = (progress - fadeStart) / (1 - fadeStart)
      ripple.opacity = ripple.opacity * (1 - fadeProgress * 0.03)
    }

    // Deactivate when done
    if (ripple.radius >= ripple.maxRadius || ripple.opacity < 0.05) {
      ripple.active = false
    }
  }
}

/**
 * Get all active ripples (for rendering)
 */
export function getActiveRipples(): readonly Ripple[] {
  return pool.filter(r => r.active)
}

/**
 * Clear all ripples
 */
export function clearRipples(): void {
  for (const ripple of pool) {
    ripple.active = false
  }
  spawnAccumulator = 0
}
