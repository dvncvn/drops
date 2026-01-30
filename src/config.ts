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
    // Wet/dry mix (off by default, user can enable via sliders)
    baseWetMix: 0,
    maxWetMix: 0,
    
    // Resonator frequencies (pure A + E = perfect 5ths, very consonant)
    frequencies: [
      110,     // A2
      165,     // E3 (5th above A2)
      220,     // A3
      330,     // E4 (5th above A3)
      440,     // A4
    ],
    
    // Q (resonance) settings
    baseQ: 5,                                // low Q when disabled
    maxQ: 10,                                // low Q when disabled
    
    // Click excitation (main way resonance is heard)
    clickExciteGain: 1.0,                    // strong wet gain boost on click
    clickDecayMs: 800,                       // longer decay for more audible ring
    clickQBoost: 25,                         // bigger Q spike on click
    
    // Wind modulation (subtle drift only, not the main driver)
    windDetunePctMax: 0.5,                   // very subtle detune (±0.5%)
    windLfoRateHz: 0.03,                     // slower modulation
    
    // Safety/limiting
    wetHighCut: 5000,                        // lowpass on wet path to avoid piercing
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
