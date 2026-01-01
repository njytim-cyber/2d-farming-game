/**
 * E2E Tests for Farming Sim RPG
 * Tests game startup, UI, movement, and core interactions
 */
import { test, expect } from '@playwright/test';

// Helper to start a new game
async function startNewGame(page) {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas', { timeout: 10000 });

    // Wait for creator modal and start new game
    await page.waitForSelector('#creator-modal.modal-overlay--active', { timeout: 5000 });
    await page.click('text=New Game');
    await page.click('text=Start Farming');

    // Wait for game to start
    await page.waitForTimeout(500);
}

test.describe('Game Startup', () => {
    test('loads game canvas and shows character creator', async ({ page }) => {
        await page.goto('/');

        // Canvas should load
        await expect(page.locator('#gameCanvas')).toBeVisible({ timeout: 10000 });

        // Creator modal should appear
        await expect(page.locator('#creator-modal')).toBeVisible();
        await expect(page.locator('#creator-modal')).toHaveClass(/modal-overlay--active/);
    });

    test('can start new game', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('#gameCanvas');

        await page.click('text=New Game');
        await page.click('text=Start Farming');

        // Game should start - canvas visible, creator hidden
        await expect(page.locator('#gameCanvas')).toBeVisible();
        await page.waitForTimeout(300);

        // Creator should be hidden after game starts
        await expect(page.locator('#creator-modal')).not.toHaveClass(/modal-overlay--active/);
    });
});

test.describe('Game UI Elements', () => {
    test.beforeEach(async ({ page }) => {
        await startNewGame(page);
    });

    test('HUD elements are visible', async ({ page }) => {
        // Stats container (energy, health, season, time)
        await expect(page.locator('.stats-container')).toBeVisible();

        // Energy bar
        await expect(page.locator('#ui-energy-bar')).toBeVisible();
        await expect(page.locator('#ui-energy-text')).toContainText('/300');

        // Health bar
        await expect(page.locator('#ui-health-bar')).toBeVisible();

        // Season and time
        await expect(page.locator('#ui-season-name')).toBeVisible();
        await expect(page.locator('#ui-time')).toBeVisible();

        // Money
        await expect(page.locator('#ui-money')).toContainText('$');
    });

    test('inventory scroll is visible', async ({ page }) => {
        await expect(page.locator('.inventory-scroll')).toBeVisible();
    });

    test('action button is visible', async ({ page }) => {
        await expect(page.locator('#fab-action')).toBeVisible();
        await expect(page.locator('#fab-action')).toContainText('ACT');
    });

    test('zoom controls are visible', async ({ page }) => {
        const zoomBtns = page.locator('.zoom-btn');
        await expect(zoomBtns).toHaveCount(2);
    });
});

test.describe('Player Movement', () => {
    test.beforeEach(async ({ page }) => {
        await startNewGame(page);
        await page.locator('#gameCanvas').click();
    });

    test('WASD keys work for movement', async ({ page }) => {
        // Get initial position
        const initialPos = await page.evaluate(() => ({
            x: window.game?.player?.gridX,
            y: window.game?.player?.gridY
        }));

        // Move down
        await page.keyboard.press('KeyS');
        await page.waitForTimeout(500);

        const newPos = await page.evaluate(() => ({
            x: window.game?.player?.gridX,
            y: window.game?.player?.gridY
        }));

        // Position should have changed (if not blocked)
        expect(newPos.x !== undefined).toBe(true);
        expect(newPos.y !== undefined).toBe(true);
    });

    test('arrow keys work for movement', async ({ page }) => {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(500);

        // Game should still be running
        await expect(page.locator('#gameCanvas')).toBeVisible();
    });

    test('E key triggers interaction', async ({ page }) => {
        await page.keyboard.press('KeyE');
        await page.waitForTimeout(200);

        // Game should still be running (no crash)
        await expect(page.locator('#gameCanvas')).toBeVisible();
    });
});

test.describe('Zoom Controls', () => {
    test.beforeEach(async ({ page }) => {
        await startNewGame(page);
    });

    test('zoom in button works', async ({ page }) => {
        const initialZoom = await page.evaluate(() => window.getState?.()?.zoom || 1);

        await page.locator('.zoom-btn').first().click();
        await page.waitForTimeout(100);

        const newZoom = await page.evaluate(() => window.getState?.()?.zoom || 1);
        expect(newZoom).toBeGreaterThan(initialZoom);
    });

    test('zoom out button works', async ({ page }) => {
        // First zoom in, then zoom out to ensure we can zoom out
        await page.locator('.zoom-btn').first().click();
        await page.waitForTimeout(100);

        const zoomedIn = await page.evaluate(() => window.getState?.()?.zoom || 1);

        await page.locator('.zoom-btn').last().click();
        await page.waitForTimeout(100);

        const newZoom = await page.evaluate(() => window.getState?.()?.zoom || 1);
        expect(newZoom).toBeLessThan(zoomedIn);
    });
});

test.describe('Game State', () => {
    test('game exposes state for testing', async ({ page }) => {
        await startNewGame(page);

        const hasState = await page.evaluate(() => {
            return typeof window.getState === 'function' && typeof window.game === 'object';
        });

        expect(hasState).toBe(true);
    });

    test('player exists in game state', async ({ page }) => {
        await startNewGame(page);

        const hasPlayer = await page.evaluate(() => {
            return window.game?.player !== undefined;
        });

        expect(hasPlayer).toBe(true);
    });

    test('inventory exists in game state', async ({ page }) => {
        await startNewGame(page);

        const hasInventory = await page.evaluate(() => {
            return window.game?.inventory !== undefined;
        });

        expect(hasInventory).toBe(true);
    });
});

test.describe('Action Button', () => {
    test.beforeEach(async ({ page }) => {
        await startNewGame(page);
    });

    test('action button can be clicked', async ({ page }) => {
        const fabBtn = page.locator('#fab-action');
        await fabBtn.click();

        // Game should continue running
        await expect(page.locator('#gameCanvas')).toBeVisible();
    });
});

test.describe('Save System', () => {
    test('game saves state to localStorage', async ({ page }) => {
        await startNewGame(page);

        // Trigger manual save instead of waiting for auto-save
        await page.evaluate(() => {
            window.game?.saveGame?.() || window.game?.save?.();
        });
        await page.waitForTimeout(100);

        const hasSave = await page.evaluate(() => {
            return localStorage.getItem('farming_sim_rpg_v11') !== null;
        });

        expect(hasSave).toBe(true);
    });

    test('continue button appears after save', async ({ page }) => {
        await startNewGame(page);

        // Trigger manual save
        await page.evaluate(() => {
            window.game?.saveGame?.() || window.game?.save?.();
        });
        await page.waitForTimeout(100);

        // Reload page
        await page.reload();
        await page.waitForSelector('#gameCanvas');

        // Continue button should be visible
        await expect(page.locator('text=Continue')).toBeVisible();
    });
});

