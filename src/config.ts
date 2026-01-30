/**
 * Configuration - all tunable parameters in one place
 */

export const config = {
  // Intensity
  baselineIntensity: 0.2,     // idle rain level - rain never stops
  clickImpulseStrength: 0.4,
  decayRate: 0.4,             // how fast intensity returns to baseline

  // Ripples
  rippleSpawnRate: { min: 1, max: 8 },  // per second based on intensity (sparse for audio sync)
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
  rainVolume: 0.5,                           // rain bed volume
  dropsVolume: 0.7,                          // drop sounds volume
  audioGainRange: { min: 0.02, max: 0.15 },  // rain bed gain range
  rainFilterFreq: { min: 2000, max: 8000 },
  dripVolume: 0.25,                          // base volume for ambient drip sounds
  dripChance: 1.0,                           // 100% - every ripple makes a sound
  
  // Ambience volumes (all start at 0)
  thunderVolume: 0,
  cricketsVolume: 0,
  windGustVolume: 0,
  dripsVolume: 0,

  // Performance
  maxDPR: 2,
}
