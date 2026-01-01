---
description: Run automated tests
---

# /test Workflow

## When to Use
- After making code changes
- Before deployment
- Verifying bug fixes
- CI/CD validation

## Steps

1. **Run Unit Tests**
   // turbo
   ```bash
   npm test
   ```

2. **Run with Coverage** (if needed)
   // turbo
   ```bash
   npm run test:coverage
   ```

3. **Browser Testing**
   - Start dev server: `npm run dev`
   - Open browser to http://localhost:3000
   - Test manually:
     - Character creation
     - Movement (WASD + click-to-move)
     - Farming loop (till → plant → harvest)
     - Shop (buy/sell)
     - Save/load persistence

4. **Build Verification**
   // turbo
   ```bash
   npm run build
   npm run preview
   ```
   - Ensure production build works

## Test Checklist

### Core Gameplay
- [ ] Character creator works
- [ ] Movement smooth in all directions
- [ ] Tilling grass creates soil
- [ ] Planting seeds on soil works
- [ ] Crops grow over time
- [ ] Harvesting gives items
- [ ] Shop buying/selling works

### Persistence
- [ ] Auto-save indicator shows
- [ ] Refresh page loads save
- [ ] Reset data clears save

### UI
- [ ] Inventory selection works
- [ ] Stats update correctly
- [ ] Modals open/close properly
- [ ] Time/season display accurate
