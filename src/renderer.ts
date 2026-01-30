/**
 * Renderer - puddle surface, pixel ripples, dithering
 * Adapted from snowfall's pixel art style
 */

import type { Ripple } from './ripple'
import { noise2D } from './utils'

// Theme colors
const DARK_BG = { r: 10, g: 10, b: 12 }
const DARK_FG = { r: 255, g: 255, b: 255 }
const LIGHT_BG = { r: 245, g: 245, b: 247 }
const LIGHT_FG = { r: 42, g: 42, b: 52 }

/**
 * Check if light mode is active
 */
function isLightMode(): boolean {
  return document.documentElement.getAttribute('data-theme') === 'light'
}

/**
 * Get current theme colors
 */
function getColors(): { bg: typeof DARK_BG; fg: typeof DARK_FG } {
  return isLightMode() 
    ? { bg: LIGHT_BG, fg: LIGHT_FG }
    : { bg: DARK_BG, fg: DARK_FG }
}

// Dither settings
let ditherSize = 8 // pixel size for dithering (0 = off, 4, 8, 12)

// Surface ripple settings
let surfaceTime = 0
let surfaceIntensity = 0.3  // 0-1, controlled by slider

// 4x4 Bayer matrix (values 0-15, normalized to 0-1)
const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
].map(row => row.map(v => v / 16))

// 8x8 Bayer matrix
const BAYER_8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21]
].map(row => row.map(v => v / 64))

/**
 * Clear and draw background
 */
export function renderBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const { bg } = getColors()
  ctx.fillStyle = `rgb(${bg.r}, ${bg.g}, ${bg.b})`
  ctx.fillRect(0, 0, width, height)
}

/**
 * Update surface animation time
 */
export function updateSurface(delta: number): void {
  surfaceTime += delta * 0.3  // Slow movement
}

/**
 * Set surface ripple intensity
 */
export function setSurfaceIntensity(value: number): void {
  surfaceIntensity = value
}

/**
 * Render subtle surface undulations
 */
export function renderSurface(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  if (surfaceIntensity < 0.01) return

  const { fg } = getColors()
  const pixelSize = 4  // Larger pixels for visibility with dithering
  const spacing = 30  // Closer spacing
  const waveCount = Math.ceil(height / spacing) + 2

  ctx.fillStyle = `rgb(${fg.r}, ${fg.g}, ${fg.b})`

  // Draw horizontal wave lines
  for (let i = 0; i < waveCount; i++) {
    const baseY = (i * spacing + surfaceTime * 15) % (height + spacing) - spacing / 2
    
    // Draw segmented wavy line
    for (let x = 0; x < width; x += pixelSize * 2) {
      // Use noise for wave shape
      const noiseVal = noise2D(x * 0.006 + surfaceTime * 0.4, i * 0.5 + surfaceTime * 0.15)
      const yOffset = noiseVal * 20
      
      // Fade based on noise for broken line effect
      const fadeNoise = noise2D(x * 0.015 + i * 10, surfaceTime * 0.25)
      if (fadeNoise < 0.2) continue  // Skip fewer segments
      
      const y = baseY + yOffset
      if (y < 0 || y > height) continue
      
      // More visible opacity
      const opacity = surfaceIntensity * 0.35 * (0.6 + fadeNoise * 0.4)
      ctx.globalAlpha = opacity
      
      const snapX = Math.floor(x / pixelSize) * pixelSize
      const snapY = Math.floor(y / pixelSize) * pixelSize
      
      // Draw slightly thicker line (2 pixels tall)
      ctx.fillRect(snapX, snapY, pixelSize, pixelSize)
      ctx.fillRect(snapX, snapY + pixelSize, pixelSize, pixelSize)
    }
  }

  ctx.globalAlpha = 1
}

/**
 * Draw a pixelated circle using midpoint algorithm
 */
function drawPixelCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  opacity: number
): void {
  const r = Math.floor(radius)
  if (r < 2) return

  const { fg } = getColors()
  const pixelSize = 2
  ctx.globalAlpha = opacity
  ctx.fillStyle = `rgb(${fg.r}, ${fg.g}, ${fg.b})`

  // Midpoint circle algorithm
  let x = r
  let y = 0
  let err = 1 - r

  while (x >= y) {
    // 8 octants - draw pixels at each point
    const points: [number, number][] = [
      [cx + x, cy + y],
      [cx + y, cy + x],
      [cx - y, cy + x],
      [cx - x, cy + y],
      [cx - x, cy - y],
      [cx - y, cy - x],
      [cx + y, cy - x],
      [cx + x, cy - y]
    ]

    for (const [px, py] of points) {
      const snapX = Math.floor(px / pixelSize) * pixelSize
      const snapY = Math.floor(py / pixelSize) * pixelSize
      ctx.fillRect(snapX, snapY, pixelSize, pixelSize)
    }

    y++
    if (err < 0) {
      err += 2 * y + 1
    } else {
      x--
      err += 2 * (y - x) + 1
    }
  }

  ctx.globalAlpha = 1
}

/**
 * Render a single ripple with pixel circles
 */
function renderRipple(ctx: CanvasRenderingContext2D, ripple: Ripple): void {
  const { x, y, radius, opacity, windOffsetX, windOffsetY, isClick } = ripple

  if (opacity < 0.05) return

  const cx = x + windOffsetX
  const cy = y + windOffsetY

  // Draw multiple concentric rings
  const ringCount = isClick ? 3 : 2
  
  for (let i = 0; i < ringCount; i++) {
    const ringRadius = radius - i * 6
    if (ringRadius < 3) continue

    const ringOpacity = opacity * (1 - i * 0.3) * 0.8
    drawPixelCircle(ctx, cx, cy, ringRadius, ringOpacity)
  }

  // Central splash dot for click ripples when small
  if (isClick && radius < 15) {
    const { fg } = getColors()
    ctx.globalAlpha = opacity * 0.6
    ctx.fillStyle = `rgb(${fg.r}, ${fg.g}, ${fg.b})`
    const dotSize = 4
    ctx.fillRect(
      Math.floor(cx / 2) * 2 - dotSize / 2,
      Math.floor(cy / 2) * 2 - dotSize / 2,
      dotSize,
      dotSize
    )
    ctx.globalAlpha = 1
  }
}

/**
 * Render all ripples
 */
export function renderRipples(
  ctx: CanvasRenderingContext2D,
  ripples: readonly Ripple[]
): void {
  // Disable smoothing for crisp pixels
  ctx.imageSmoothingEnabled = false

  for (const ripple of ripples) {
    renderRipple(ctx, ripple)
  }
}

/**
 * Apply ordered dither effect to the canvas
 */
export function applyDither(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  if (ditherSize === 0) return

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  const matrix = ditherSize <= 4 ? BAYER_4 : BAYER_8
  const matrixSize = ditherSize <= 4 ? 4 : 8
  const pixelScale = ditherSize

  const { bg, fg } = getColors()
  const lightMode = isLightMode()

  // Process in blocks
  for (let by = 0; by < height; by += pixelScale) {
    for (let bx = 0; bx < width; bx += pixelScale) {
      // Sample center of block
      const sx = Math.min(bx + Math.floor(pixelScale / 2), width - 1)
      const sy = Math.min(by + Math.floor(pixelScale / 2), height - 1)
      const si = (sy * width + sx) * 4

      // Get luminance
      const r = data[si]!
      const g = data[si + 1]!
      const b = data[si + 2]!

      // Calculate how different this pixel is from the background
      // This ensures we only dither actual content, not background
      const bgDiff = Math.abs(r - bg.r) + Math.abs(g - bg.g) + Math.abs(b - bg.b)
      
      // Skip dithering for pixels that are essentially background
      // Threshold of 30 means at least ~10% difference from background per channel
      if (bgDiff < 30) {
        // Fill with pure background color (keeps background clean)
        for (let py = by; py < Math.min(by + pixelScale, height); py++) {
          for (let px = bx; px < Math.min(bx + pixelScale, width); px++) {
            const i = (py * width + px) * 4
            data[i] = bg.r
            data[i + 1] = bg.g
            data[i + 2] = bg.b
          }
        }
        continue
      }

      // Calculate intensity for dithering threshold
      let intensity: number
      if (lightMode) {
        // In light mode, darker = more foreground
        intensity = 1 - (r + g + b) / (3 * 255)
      } else {
        // In dark mode, brighter = more foreground
        intensity = (r + g + b) / (3 * 255)
      }

      // Get threshold from Bayer matrix
      const mx = Math.floor(bx / pixelScale) % matrixSize
      const my = Math.floor(by / pixelScale) % matrixSize
      const threshold = matrix[my]![mx]!

      // Determine if this block should be fg or bg
      const useFg = intensity > threshold * 0.7
      const color = useFg ? fg : bg

      // Fill the block
      for (let py = by; py < Math.min(by + pixelScale, height); py++) {
        for (let px = bx; px < Math.min(bx + pixelScale, width); px++) {
          const i = (py * width + px) * 4
          data[i] = color.r
          data[i + 1] = color.g
          data[i + 2] = color.b
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

/**
 * Set dither size (0, 4, 8, 12, 16)
 */
export function setDitherSize(size: number): void {
  ditherSize = size
}

/**
 * Get current dither size
 */
export function getDitherSize(): number {
  return ditherSize
}

/**
 * Reset shimmer time (for compatibility)
 */
export function resetShimmer(): void {
  // No-op now, kept for API compatibility
}
