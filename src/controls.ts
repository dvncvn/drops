/**
 * UI Controls - wires up sidebar controls to system parameters
 */

import { config } from './config'
import { setDitherSize } from './renderer'
import { setRainVolume, setDropsVolume, 
  setThunderVolume, setCricketsVolume, setWindGustVolume, setDripsVolume 
} from './audio/engine'
import { setDropResonanceQ, setDropResonanceMix, setReverbAmount } from './audio/transient'

// Theme state
let currentTheme: 'dark' | 'light' = 'dark'

/**
 * Initialize sidebar controls
 */
export function initControls(): void {
  // Theme toggle button
  const themeBtn = document.getElementById('theme-btn') as HTMLButtonElement
  themeBtn.addEventListener('click', toggleTheme)
  // Intensity slider (baseline intensity as percentage)
  const intensitySlider = document.getElementById('intensity-slider') as HTMLInputElement
  intensitySlider.addEventListener('input', () => {
    const value = parseInt(intensitySlider.value, 10) / 100
    config.baselineIntensity = value
  })

  // Wind slider (0-100 maps to 0-1.0 strength)
  const windSlider = document.getElementById('wind-slider') as HTMLInputElement
  windSlider.addEventListener('input', () => {
    const value = parseInt(windSlider.value, 10) / 100
    config.windStrength = value
  })

  // Resonance slider (Q / ring amount on drops)
  const resonanceSlider = document.getElementById('resonance-slider') as HTMLInputElement
  resonanceSlider.addEventListener('input', () => {
    const value = parseInt(resonanceSlider.value, 10) / 100
    setDropResonanceQ(value)
  })
  // Initialize
  setDropResonanceQ(parseInt(resonanceSlider.value, 10) / 100)

  // Tone mix slider (resonance volume on drops)
  const toneMixSlider = document.getElementById('tone-mix-slider') as HTMLInputElement
  toneMixSlider.addEventListener('input', () => {
    const value = parseInt(toneMixSlider.value, 10) / 100
    setDropResonanceMix(value)
  })
  // Initialize
  setDropResonanceMix(parseInt(toneMixSlider.value, 10) / 100)

  // Dither select
  const ditherSelect = document.getElementById('dither-select') as HTMLSelectElement
  ditherSelect.addEventListener('change', () => {
    const size = parseInt(ditherSelect.value, 10)
    setDitherSize(size)
  })
  // Initialize dither from default value
  setDitherSize(parseInt(ditherSelect.value, 10))

  // Rain volume slider
  const rainVolumeSlider = document.getElementById('rain-volume-slider') as HTMLInputElement
  rainVolumeSlider.addEventListener('input', () => {
    const value = parseInt(rainVolumeSlider.value, 10) / 100
    setRainVolume(value)
  })

  // Drops volume slider
  const dropsVolumeSlider = document.getElementById('drops-volume-slider') as HTMLInputElement
  dropsVolumeSlider.addEventListener('input', () => {
    const value = parseInt(dropsVolumeSlider.value, 10) / 100
    setDropsVolume(value)
  })

  // Reverb slider
  const reverbSlider = document.getElementById('reverb-slider') as HTMLInputElement
  reverbSlider.addEventListener('input', () => {
    const value = parseInt(reverbSlider.value, 10) / 100
    setReverbAmount(value)
  })
  // Initialize
  setReverbAmount(parseInt(reverbSlider.value, 10) / 100)

  // Ambience sliders
  const thunderSlider = document.getElementById('thunder-slider') as HTMLInputElement
  thunderSlider.addEventListener('input', () => {
    setThunderVolume(parseInt(thunderSlider.value, 10) / 100)
  })

  const cricketsSlider = document.getElementById('crickets-slider') as HTMLInputElement
  cricketsSlider.addEventListener('input', () => {
    setCricketsVolume(parseInt(cricketsSlider.value, 10) / 100)
  })

  const windGustSlider = document.getElementById('wind-gust-slider') as HTMLInputElement
  windGustSlider.addEventListener('input', () => {
    setWindGustVolume(parseInt(windGustSlider.value, 10) / 100)
  })

  const dripsSlider = document.getElementById('drips-slider') as HTMLInputElement
  dripsSlider.addEventListener('input', () => {
    setDripsVolume(parseInt(dripsSlider.value, 10) / 100)
  })

  // Reseed button
  const reseedBtn = document.getElementById('reseed-btn') as HTMLButtonElement
  reseedBtn.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('drops:reseed'))
  })
}

/**
 * Toggle sidebar visibility
 */
export function toggleSidebar(): void {
  const sidebar = document.getElementById('sidebar')
  if (sidebar) {
    sidebar.classList.toggle('hidden')
  }
}

/**
 * Show sidebar
 */
export function showSidebar(): void {
  const sidebar = document.getElementById('sidebar')
  if (sidebar) {
    sidebar.classList.remove('hidden')
  }
}

/**
 * Hide sidebar
 */
export function hideSidebar(): void {
  const sidebar = document.getElementById('sidebar')
  if (sidebar) {
    sidebar.classList.add('hidden')
  }
}

/**
 * Toggle dark/light theme
 */
export function toggleTheme(): void {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark'
  applyTheme()
}

/**
 * Apply current theme
 */
function applyTheme(): void {
  if (currentTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
  updateThemeIcon()
}

/**
 * Update theme button icon
 */
function updateThemeIcon(): void {
  const btn = document.getElementById('theme-btn')
  if (!btn) return
  
  // Half-moon for dark, sun for light
  btn.textContent = currentTheme === 'light' ? '☀' : '◐'
}

/**
 * Get current theme
 */
export function getTheme(): 'dark' | 'light' {
  return currentTheme
}

/**
 * Check if light mode is active
 */
export function isLightMode(): boolean {
  return currentTheme === 'light'
}
