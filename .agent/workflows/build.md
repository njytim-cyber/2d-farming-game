---
description: Build and implement features
---

# /build Workflow

## When to Use
- Implementing new features
- Adding game content (crops, items)
- Creating new UI components
- General development tasks

## Prerequisites
- Approved design (from `/design`) if significant change
- Clear understanding of requirements

## Steps

1. **Check for Approved Plan**
   - Review any design docs in `.agent/artifacts/`
   - Ensure requirements are clear

2. **Implement Changes**
   - Follow architecture in `.agent/rules.md`
   - Modify existing modules or create new ones
   - Update `constants.js` for new game data
   - Update state shape if needed

3. **Update UI if Needed**
   - Modify templates in `index.html`
   - Update styles in `src/styles/`
   - Connect UI in `src/ui/` modules

4. **Test Locally**
   // turbo
   ```bash
   npm run dev
   ```
   - Verify in browser

5. **Run Tests**
   // turbo
   ```bash
   npm test
   ```

6. **Save Progress**
   - Commit changes if using git

## Code Locations

| Type | Location |
|------|----------|
| Game data | `src/game/constants.js` |
| State | `src/game/state.js` |
| Entities | `src/entities/*.js` |
| Systems | `src/systems/*.js` |
| Rendering | `src/rendering/*.js` |
| UI | `src/ui/*.js` |
| Styles | `src/styles/*.css` |
