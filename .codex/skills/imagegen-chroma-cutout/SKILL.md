---
name: imagegen-chroma-cutout
description: Generate or edit transparent raster cutouts without checkerboard artifacts. Use when an imagegen asset needs a transparent background, especially game portraits, sprites, character cutouts, or UI illustrations. Always generate on a flat chroma-key background, remove it locally, validate alpha, and only then add the asset to the project.
---

# Imagegen Chroma Cutout

Use this after the general `imagegen` workflow whenever the final raster asset needs transparency.

## Generate

Do not ask image generation for a transparent preview. Image models may bake a checkerboard into the pixels.

Append this requirement to the image prompt:

```text
Place the subject on a perfectly flat uniform solid #ff00ff chroma-key background for background removal.
The entire background must be exactly one solid color with no checkerboard, no transparency preview pattern, no shadows, no gradients, no texture, no reflection, and no lighting variation.
Do not use #ff00ff anywhere in the subject. Keep generous padding around the subject.
```

Use `#00ff00` instead when magenta appears in the subject.

## Remove The Key

Copy the generated source into a temporary workspace path. Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/remove-chroma-key.ps1 `
  -InputPath tmp/imagegen/source.png `
  -OutputPath assets/final.png
```

The script samples the border color, writes a PNG with alpha, and removes edge spill. Override `-TransparentThreshold` or `-OpaqueThreshold` only if validation shows a fringe or missing subject pixels.

## Validate

Before referencing the asset:

1. Confirm the output PNG has alpha.
2. Confirm all four corners are fully transparent.
3. Inspect the output visually on a dark and light background.
4. Check fine edges such as hair and clothing outlines.
5. Keep the chroma source under `tmp/`; add only the final alpha PNG to project assets.

If the border is not mostly one color, regenerate with a stricter flat-background prompt instead of attempting to remove a baked checkerboard.
