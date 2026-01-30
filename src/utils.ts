/**
 * Utility functions - noise, math helpers
 */

// Permutation table for Perlin noise
let perm: number[] = []
let gradP: { x: number; y: number }[] = []

const grad3 = [
  { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 },
  { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
]

// Initialize noise with a seed
export function seedNoise(seed = Math.random() * 65536) {
  const p: number[] = []
  for (let i = 0; i < 256; i++) p[i] = i

  // Fisher-Yates shuffle with seed
  let n = seed
  for (let i = 255; i > 0; i--) {
    n = (n * 16807) % 2147483647
    const j = n % (i + 1)
    ;[p[i], p[j]] = [p[j]!, p[i]!]
  }

  perm = new Array(512)
  gradP = new Array(512)
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255]!
    gradP[i] = grad3[perm[i]! % 8]!
  }
}

// Initialize on load
seedNoise()

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/**
 * 2D Perlin noise (-1 to 1)
 */
export function noise2D(x: number, y: number): number {
  const X = Math.floor(x) & 255
  const Y = Math.floor(y) & 255

  x -= Math.floor(x)
  y -= Math.floor(y)

  const u = fade(x)
  const v = fade(y)

  // Use modulo to stay in bounds - perm is 512 elements, gradP is 512 elements
  const p0 = perm[Y] ?? 0
  const p1 = perm[(Y + 1) & 255] ?? 0
  
  const aa = (X + p0) & 255
  const ab = (X + p1) & 255
  const ba = ((X + 1) & 255) + p0
  const bb = ((X + 1) & 255) + p1

  const n00 = gradP[aa] ?? grad3[0]!
  const n01 = gradP[ab] ?? grad3[0]!
  const n10 = gradP[ba & 255] ?? grad3[0]!
  const n11 = gradP[bb & 255] ?? grad3[0]!

  const dot00 = n00.x * x + n00.y * y
  const dot10 = n10.x * (x - 1) + n10.y * y
  const dot01 = n01.x * x + n01.y * (y - 1)
  const dot11 = n11.x * (x - 1) + n11.y * (y - 1)

  return lerp(
    lerp(dot00, dot10, u),
    lerp(dot01, dot11, u),
    v
  )
}

/**
 * Reseed noise (for reset)
 */
export function reseedNoise() {
  seedNoise()
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Random float in range
 */
export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Check for reduced motion preference
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
