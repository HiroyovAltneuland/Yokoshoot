# Title Logo Motion Spec

## Source

- Raster source: `assets/title-logo-transparent.png`
- Source size: 1815 x 866
- Delivery SVG: `assets/title-logo-motion.svg`
- Static contract: `assets/title-logo-static.svg`

## Brief

- Personality: energetic, sharp, dramatic
- Usage context: title-screen splash reveal, then final static logo
- Choreography: staggered assembly with a blade-like sweep and late sheen

## Part Inventory

- `#left-slice`: left clipped logo actor
- `#core-slice`: central clipped logo actor
- `#right-slice`: right clipped logo actor
- `#blade-sweep`: secondary action crossing the logo during the main action
- `#sheen`: final follow-through pass masked to the logo alpha

## Timing

- Total duration: 1500ms
- Shape: 20% anticipation, 50% action, 30% follow-through
- Easing tokens:
  - Enter: `cubic-bezier(0.16, 1, 0.3, 1)`
  - Settle: `cubic-bezier(0.34, 1.56, 0.64, 1)`
  - Narrative: `cubic-bezier(0.34, 0, 0.14, 1)`

## Pixel2Motion Notes

This pass keeps the original raster logo as the final frame contract and structures it into clipped semantic SVG actors for motion. It does not attempt full kanji/kana outline reconstruction, because the title art is a complex painterly logo and the immediate game need is a faithful animated title reveal.

The animation uses literal `cubic-bezier(...)` values inside keyframes so Chromium does not silently fall back to linear easing. Reduced-motion users receive the completed static logo immediately.
