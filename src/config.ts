/**
 * Configuration - all tunable parameters in one place
 */

export const config = {
  // Intensity
  baselineIntensity: 0.2,     // idle rain level - rain never stops
  clickImpulseStrength: 0.4,
  decayRate: 0.4,             // how fast intensity returns to baseline

  // Ripples
  rippleSpawnRate: { min: 3, max: 25 },  // per second based on intensity
  rippleLifetime: { min: 2, max: 4 },
  rippleMaxRadius: { min: 50, max: 100 },
  clickRippleScale: 1.8,      // click ripples are larger
  maxRipples: 150,            // object pool size

  // Wind
  windStrength: 0.3,
  windTurbulence: 0.001,
  windTimeScale: 0.0002,

  // Audio
  masterVolume: 0.5,
  audioGainRange: { min: 0.02, max: 0.15 },  // reduced from 0.1-0.6
  rainFilterFreq: { min: 2000, max: 8000 },
  dripVolume: 0.25,                          // volume for ambient drip sounds
  dripChance: 0.4,                           // chance to play sound per ambient ripple

  // Performance
  maxDPR: 2,
}
