---
name: sprite-padding-rules
description: Use when generating, editing, or validating sprite sheets for Yokoshoot or similar canvas games, especially when sprites need transparent padding, stable animation anchors, chroma-key cleanup, or consistent per-frame sizing.
---

# Sprite Padding Rules

Use this skill when creating or reviewing raster sprite sheets for game characters, enemies, projectiles, or effects.

## Rules

- Use equal-size cells with one animation frame per cell.
- Keep the subject fully inside each cell and never touching cell edges.
- Leave at least 6-10px of transparent padding on every side of every cell.
- For humanoid sprites, align the apparent foot position and character height across all frames.
- For idle and walk loops, keep the head and torso anchor visually stable.
- Animate mostly secondary motion: hair, scarf, skirt, propellers, baskets, weapon sway, cloth, or effects.
- Use the largest silhouette in the animation as the padding baseline so no frame clips when rendered in-game.
- After chroma-key removal, clear a small transparent safety margin around every cell edge to remove stray pixels.
- Validate runtime drawing, not only PNG pixels: source rectangles, draw offsets, scale factors, and movement clamps must keep the full sprite visible in game.
- When a sprite sheet is sampled by canvas or another renderer, use safe source insets or generous transparent gutters so neighboring cells cannot bleed into the rendered sprite.

## Validation Checklist

- The sheet has the expected row and column count.
- Corners and cell borders are transparent after background removal.
- Every frame has safe transparent padding on all sides.
- Apparent height and foot position are stable for humanoid frames.
- Head and torso anchors do not drift unless the animation intentionally moves the whole body.
- Motion reads clearly when sampled at the game's intended frame rate and draw size.
- The sprite remains fully visible at gameplay movement bounds.
- Rendered frames do not show neighboring cells, chroma-key fringe, or transparent-pixel color bleed.

