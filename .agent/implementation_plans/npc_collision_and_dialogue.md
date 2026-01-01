# Implementation Plan - NPC Solidity and Interaction

Fix issues where the player can walk through NPCs and ensure the "Old Man" NPC can be interacted with.

## User Review Required

> [!IMPORTANT]
> The player will now be blocked by NPCs (collision). To talk to an NPC, you must stand adjacent and face them while pressing the action key (E / Space / FAB).

## Proposed Changes

### Visual Standards (3/4 Perspective & Y-Sorting)
- **Perspect Shift**: Update `TileRenderer.js` to draw buildings (House, Shop, Old House) and trees with a 3/4 top-down perspective (showing front faces).
- **Y-Sorting**: Refactor the rendering loop in `Game.js` to sort entities (Player, NPCs, Pets, Trees, Crops) by their Y-coordinate. This allows the player to walk behind trees and buildings.
- **Consistent Scaling**: Adjust rendering details to ensure world objects match the visual density of UI icons.

### Game Logic (`src/game/Game.js`)

#### [DONE] NPC Solidity
- Update `isTileSolid` to check the `npcs` array in the game state. (Implemented)

#### [CHECK] Interaction Improvements
- Verify that `interact()` correctly identifies NPCs at the facing tile `(tx, ty)`.
- Ensure `interactWithNPC` is called and triggers the dialogue system correctly.

### NPC Interaction (`src/game/Game.js`)

- Ensure the "Old Man" gives the sword only once and has generic dialogue afterwards.

## Verification Plan

### Automated Tests
- Run `npm run test` to ensure existing game flow is not broken.

### Manual Verification
- Walk towards the Old Man and ensure movement is blocked.
- Press 'E' while facing the Old Man and verify the dialogue modal appears.
- Walk behind a tree or building and ensure the character is partially obscured (if sorted correctly).
