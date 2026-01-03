---
description: Enhance the visual quality of game scenes (Lighting, Flooring, Depth, VFX)
---

# Visual Polish Workflow

Use this workflow when the user requests "better graphics," "cozy atmosphere," or "visual overhaul" for indoor or outdoor scenes.

## Design Language: "Cozy & Grounded"

1.  **Atmosphere (The "Cozy" Factor)**
    - **Principle**: Corners should be dark, light should be directional.
    - **Technique (SSAO)**: Use radial gradients (black -> transparent) in room corners.
    - **Technique (God Rays)**: Use additive gradients/shapes from windows/light sources.
    - **Technique (Warmth)**: Use warm colors (orange/yellow) for point lights (stoves, lamps) with pulsing alpha.

2.  **Geometry (The "Grounded" Factor)**
    - **Principle**: Objects have weight and thickness.
    - **Technique (Fake 3D)**: Add a darker "lip" (2-4px) to the bottom of flat surfaces (tables, walls) to imply thickness.
    - **Technique (Projected Shadows)**: Skew sprites (affine transform) and draw them in black/alpha behind objects. Avoid simple circle shadows indoors.

3.  **Texture (The "Organic" Factor)**
    - **Principle**: Avoid grids and solid colors.
    - **Technique (Procedural Variation)**:
        - **Flooring**: Stagger rows (offset x by 50%) to look like planks.
        - **Color**: Perturb base hex colors with deterministic noise (`Math.sin(x * y)`) to create variation.

4.  **VFX (The "Alive" Factor)**
    - **Principle**: The air is never empty.
    - **Technique**: Spawn slow-moving "dust motes" (low alpha) in light shafts.
    - **Technique**: Spawn rising "steam" or "smoke" from active elements (stoves, chimneys).

## Checklist

- [ ] **Lighting**: Add SSAO corners and God Rays.
- [ ] **Flooring**: Implement staggered/noisy tile rendering.
- [ ] **Depth**: Add projected shadows and thickness lips to furniture.
- [ ] **VFX**: Add dust/steam particle systems.
- [ ] **Scope**: Ensure changes apply to ALL relevant building types (House, Shop, Barn, Coop, etc.).
