requirements

## Goal
Create a new web piece at `dvncvn/drops` that borrows the **click state interaction + visual effects behavior** from `dvncvn/snowfall`, but reinterprets it as **gentle rainfall hitting a puddle** (ripples, intensity, wind drift). It should feel minimal, bold, full-bleed, and performant.

This is an initial proof of concept designed for rapid iteration.

## References
- New project repo: https://github.com/dvncvn/drops
- Source behavior to copy: https://github.com/dvncvn/snowfall
  - Specifically: **click state** and the **visual effect chain** that click triggers (and how it evolves over time)

## Core interaction
### Click state (must match intent of snowfall)
- A click should “inject energy” into the system (like snowfall’s click state).
- The click state must:
  - Be immediate and satisfying (fast feedback within 16ms if possible).
  - Have a decaying tail (effects persist briefly after click).
  - Be additive if clicked repeatedly (stacking or saturating sensibly).
- The click state should influence both:
  - Visuals (rain intensity, ripple frequency/amplitude, splash detail).
  - Audio (rain loudness/texture, optional transient accent).

### Additional controls (optional but recommended for PoC)
- Keyboard shortcuts:
  - `R` reset state
  - `Space` toggle pause
  - `?` show/hide minimal HUD
- Pointer:
  - Click location should matter (local ripple origin).
  - Dragging can optionally “brush” rain intensity (nice-to-have).

## Visual direction
### Scene
- Full-bleed canvas (WebGL or 2D canvas; choose what snowfall uses unless there’s a strong reason not to).
- The scene reads as a **dark puddle surface** with subtle lighting.
- Rain should be *implied* (not literal droplets everywhere):
  - Primary motif: ripples + micro splashes.
  - Secondary motif: faint streaks or particles may exist but should remain tasteful.

### Effects (minimum viable set)
1. **Ripples**
   - Concentric rings emanating from click position.
   - Also spawn stochastic small ripples across the surface when rain intensity increases.
   - Ripples should fade naturally and feel physically plausible (no harsh alpha popping).
2. **Rain intensity**
   - Controlled by click state (and optionally a baseline idle value).
   - Higher intensity increases:
     - Ripple spawn rate
     - Micro splash density
     - Surface noise / shimmer
3. **Wind**
   - A parameter that biases ripple deformation / drift direction.
   - Wind can increase autonomous surface agitation (subtle continuous ripple movement).
   - Wind should never fully “take over” the scene.

### Aesthetic constraints
- Minimal palette. Avoid colorful gradients unless extremely subdued.
- No UI chrome beyond a tiny optional HUD.
- Avoid “gamey” effects (no fireworks, no neon, no particles that look like confetti).
- Maintain a calm, meditative vibe.

## Audio direction
### Goal
Audiovisual, but **not a clone** of snowfall’s sound. Use snowfall’s “crackle” as a starting point only if helpful for texture, then shift it toward rain.

### Minimum viable audio
- Generate or playback a **rain bed** that responds to intensity:
  - Louder at higher intensity
  - Slightly brighter / denser at higher intensity
- Click should add a subtle transient (e.g., a soft “tap” or brief brighter burst), but avoid obvious percussion.

### Implementation guidance
- Use Web Audio API.
- Prefer synthesis/noise shaping over large audio files (unless a tiny loop is easier for PoC).
- If using samples, keep them small and ensure they loop seamlessly.

### Explicit non-goal
- Do not recreate snowfall’s audio signature. The end result must feel distinct.

## Performance + quality bar
- 60fps target on modern laptops.
- Avoid allocations per frame in the render loop.
- Use devicePixelRatio handling with a sensible cap (e.g., cap DPR at 2).
- Graceful degradation on lower-end devices:
  - Reduce ripple count / density
  - Reduce shader complexity or particle count
- No memory leaks (verify with long-run test, 5+ minutes).

## Tech constraints
- Keep dependencies light.
- Choose the same core rendering approach as snowfall (WebGL/Canvas2D/etc.) unless there’s a strong reason to change.
- Must run locally with a simple dev command (`npm run dev` or equivalent).

## Deliverables (PoC)
1. Working app in `dvncvn/drops`
2. The click state behavior and effect decay replicated from snowfall (visually and structurally)
3. Rain/puddle visuals with:
   - Click ripples
   - Autonomous rain ripples responding to intensity
   - Wind parameter affecting surface behavior
4. Audio bed that responds to intensity and feels rain-like
5. Minimal optional HUD (toggleable) showing:
   - intensity
   - wind
   - fps (optional)

## Acceptance criteria
- Clicking feels immediately responsive and obviously changes the system.
- When you stop clicking, effects decay smoothly back toward baseline.
- The visuals read as “rain on a puddle” without needing explanation.
- Audio is clearly rain-inspired and responds to intensity.
- The experience feels distinct from snowfall (especially audio).
- Runs smoothly without stutters during repeated clicking.

## Non-goals (for PoC)
- Mobile polish
- Complex UI
- Full sound design pass (we just need a good foundation)
- Photorealism

## Suggested iteration hooks (for future feedback)
- Parameters exposed in one place (e.g., `config.ts`):
  - baselineIntensity
  - clickImpulseStrength
  - decayRate
  - rippleSpawnRate
  - rippleLifetime
  - windStrength
  - audioGainRange
- Easy to add new ripple styles (ring, noisy ring, directional smear).
- Easy to swap audio strategy (synth vs sample).

## Notes for the agent
- Start by locating and understanding snowfall’s click-state implementation and effect propagation.
- Port the mechanism first (state model + decay + event handling), then reskin visuals to “puddle rain.”
- Keep the code structured for fast iteration: clear state, clear renderer, clear audio engine.
