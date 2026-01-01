---
description: Run automated tests
---

# /test Workflow

## Test Structure (IMPORTANT)
Tests are split between two frameworks to avoid conflicts:

| Framework | Directory | File Pattern | Command | Target Time |
|-----------|-----------|--------------|---------|-------------|
| **Vitest** (Unit) | `tests/unit/` | `*.test.js` | `npm run test:unit` | <5s |
| **Playwright** (Smoke) | `tests/e2e/smoke.spec.js` | `smoke.spec.js` | `npm run test:e2e` | <10s |
| **Playwright** (Full) | `tests/e2e/`, `tests/regression/` | `*.spec.js` | `npm run test:e2e:full` | <60s |

> [!CAUTION]
> - **Never place `.spec.js` files in `tests/unit/` or `.test.js` files in `tests/e2e/`.**
> - **E2E tests must NOT import from `src/` directly** - access game state via `window.game`.
> - **Avoid `waitForTimeout()`** - use `waitForSelector()` or `waitForFunction()` instead.
> - **Tests should be FAST** - total E2E smoke tests must complete in under 10 seconds.

## Steps

1. **Run Unit Tests** (Vitest)
   // turbo
   ```bash
   npm run test:unit
   ```

2. **Run E2E Tests** (Playwright)
   // turbo
   ```bash
   npm run test:e2e
   ```

3. **Run All Tests**
   // turbo
   ```bash
   npm run test:all
   ```

4. **Run with Coverage** (if needed)
   // turbo
   ```bash
   npm run test:coverage
   ```

5. **Build Verification**
   // turbo
   ```bash
   npm run build
   npm run preview
   ```
   - Ensure production build works

## Creating New Tests

### Unit Tests (`tests/unit/*.test.js`)
```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { MyModule } from '../../src/path/to/module.js';
// Direct imports from src/ are OK
```

### E2E Tests (`tests/e2e/*.spec.js`)
```javascript
import { test, expect } from '@playwright/test';
// NO imports from src/ - access via browser context:
const result = await page.evaluate(() => window.game.someMethod());
```

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
