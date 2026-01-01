---
description: Debug and fix issues
---

# /debug Workflow

## When to Use
- Something is broken or not working
- Console errors appear
- Game behavior is unexpected
- Performance issues

## Steps

1. **Reproduce the Issue**
   - Start dev server: `npm run dev`
   - Open browser DevTools (F12)
   - Reproduce the exact issue
   - Note any console errors

2. **Identify the Cause**
   - Check console for error messages
   - Identify which module is involved:
     - Rendering issues → `src/rendering/`
     - Movement issues → `src/entities/Player.js`, `src/input/`
     - Save/load issues → `src/systems/SaveManager.js`
     - UI issues → `src/ui/`, `src/styles/`
     - State issues → `src/game/state.js`

3. **Add Debugging**
   ```javascript
   console.log('Debug:', variable);
   ```
   - Use browser breakpoints if needed

4. **Fix the Issue**
   - Make targeted fix
   - Avoid unrelated changes

5. **Verify the Fix**
   - Reproduce original issue (should be fixed)
   - Check for regressions
   - Run tests: `npm test`

6. **Clean Up**
   - Remove debug console.logs
   - Save game and verify persistence

## Common Issues

### "Module not found"
- Check import paths (case-sensitive)
- Ensure file exists

### "Cannot read property of undefined"
- Check state initialization
- Verify data is loaded before access

### UI not updating
- Check `notifyChange()` calls
- Verify state sync with `setState()`

### Save not working
- Check `SAVE_KEY` in constants
- Verify localStorage access
- Check for circular references in state
