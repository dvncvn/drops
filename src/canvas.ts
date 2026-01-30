/**
 * Canvas setup and utilities
 */

import { config } from './config'

export function createCanvas(canvas: HTMLCanvasElement) {
  // willReadFrequently optimizes for getImageData (used for dithering)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!

  // Cap DPR for performance
  const dpr = Math.min(window.devicePixelRatio || 1, config.maxDPR)

  function resize() {
    const width = window.innerWidth
    const height = window.innerHeight

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    // Reset transform on each resize
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  return { ctx, resize, dpr }
}
