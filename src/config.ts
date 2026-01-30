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
  
  // Resonator ("puddle sings") - tonal presence from rain
  resonator: {
    // Wet/dry mix
    baseWetMix: 0.05,                        // wet mix at baseline intensity
    maxWetMix: 0.35,                         // wet mix at peak intensity
    
    // Resonator frequencies (D-A-E voicing across octaves)
    frequencies: [
      73.42,   // D2
      110,     // A2
      146.83,  // D3
      164.81,  // E3
      220,     // A3
    ],
    
    // Q (resonance) settings
    baseQ: 15,                               // Q at baseline
    maxQ: 35,                                // Q at peak intensity
    
    // Click excitation
    clickExciteGain: 0.4,                    // extra wet gain on click
    clickDecayMs: 500,                       // decay time for click excitation
    clickQBoost: 8,                          // temporary Q increase on click
    
    // Wind modulation
    windDetunePctMax: 1.5,                   // max detune as percentage (±1.5%)
    windLfoRateHz: 0.08,                     // how fast wind modulates frequencies
    
    // Safety/limiting
    wetHighCut: 3500,                        // lowpass on wet path to avoid piercing
    compThreshold: -12,                      // compressor threshold on wet bus
  },
  
  // Ambience volumes (all start at 0)
  thunderVolume: 0,
  cricketsVolume: 0,
  windGustVolume: 0,
  dripsVolume: 0,

  // Performance
  maxDPR: 2,
}
