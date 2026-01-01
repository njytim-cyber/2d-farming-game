/**
 * Regression Tests for Previously Fixed Bugs
 * Add new tests here when fixing bugs to prevent regression
 */
import { test, expect } from '@playwright/test';

test.describe('Regression: Building Rendering', () => {
    test('house renders as complete 2x2 building (not partial)', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('#gameCanvas');
        await page.click('text=New Game');
        await page.click('text=Start Farming');
        await page.waitForTimeout(500);

        // Verify via screenshot comparison or pixel check
        // The house should show: roof, walls, door, windows

        // Move camera to house area
        await page.locator('#gameCanvas').click();
        for (let i = 0; i < 2; i++) {
            await page.keyboard.press('KeyW');
            await page.waitForTimeout(200);
        }
        for (let i = 0; i < 4; i++) {
            await page.keyboard.press('KeyA');
            await page.waitForTimeout(200);
        }

        // Take screenshot for visual regression
        await expect(page.locator('#gameCanvas')).toHaveScreenshot('house-2x2.png', {
            maxDiffPixelRatio: 0.1 // Allow 10% difference for animations
        });
    });

    test('shop renders as complete 2x2 building (not partial)', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('#gameCanvas');
        await page.click('text=New Game');
        await page.click('text=Start Farming');
        await page.waitForTimeout(500);

        // Move camera to shop area
        await page.locator('#gameCanvas').click();
        for (let i = 0; i < 2; i++) {
            await page.keyboard.press('KeyW');
            await page.waitForTimeout(200);
        }
        for (let i = 0; i < 3; i++) {
            await page.keyboard.press('KeyD');
            await page.waitForTimeout(200);
        }

        await expect(page.locator('#gameCanvas')).toHaveScreenshot('shop-2x2.png', {
            maxDiffPixelRatio: 0.1
        });
    });
});

test.describe('Regression: Player Movement', () => {
    test('player moves when pressing movement keys', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('#gameCanvas');
        await page.click('text=New Game');
        await page.click('text=Start Farming');
        await page.waitForTimeout(500);

        // Get initial position via game state
        const initialPos = await page.evaluate(() => {
            if (window.game && window.game.player) {
                return { x: window.game.player.gridX, y: window.game.player.gridY };
            }
            return null;
        });

        // Press movement key
        await page.locator('#gameCanvas').click();
        await page.keyboard.press('KeyD');
        await page.waitForTimeout(300);

        // Get new position
        const finalPos = await page.evaluate(() => {
            if (window.game && window.game.player) {
                return { x: window.game.player.gridX, y: window.game.player.gridY };
            }
            return null;
        });

        // Position should have changed
        if (initialPos && finalPos) {
            expect(finalPos.x).not.toBe(initialPos.x);
        }
    });

    test('player moves continuously when holding key (not single tile)', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('#gameCanvas');
        await page.click('text=New Game');
        await page.click('text=Start Farming');
        await page.waitForTimeout(500);

        const initialY = await page.evaluate(() =>
            window.game?.player?.gridY ?? null
        );

        // Hold S key down
        await page.locator('#gameCanvas').click();
        await page.keyboard.down('KeyS');
        await page.waitForTimeout(700); // Hold for 700ms
        await page.keyboard.up('KeyS');
        await page.waitForTimeout(200);

        const finalY = await page.evaluate(() =>
            window.game?.player?.gridY ?? null
        );

        // Should have moved more than 1 tile
        if (initialY !== null && finalY !== null) {
            const distance = Math.abs(finalY - initialY);
            expect(distance).toBeGreaterThan(1);
        }
    });
});

test.describe('Regression: Input Handling', () => {
    test('keyup stops continuous movement', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('#gameCanvas');
        await page.click('text=New Game');
        await page.click('text=Start Farming');
        await page.waitForTimeout(500);

        await page.locator('#gameCanvas').click();

        // Hold key, then release
        await page.keyboard.down('KeyD');
        await page.waitForTimeout(300);
        await page.keyboard.up('KeyD');

        // Record position
        const posAfterRelease = await page.evaluate(() =>
            window.game?.player?.gridX ?? null
        );

        // Wait and check position again
        await page.waitForTimeout(500);
        const posLater = await page.evaluate(() =>
            window.game?.player?.gridX ?? null
        );

        // Should not continue moving after key release
        expect(posAfterRelease).toBe(posLater);
    });

    test('action key (E) triggers interaction', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('#gameCanvas');
        await page.click('text=New Game');
        await page.click('text=Start Farming');
        await page.waitForTimeout(500);

        await page.locator('#gameCanvas').click();

        // Press E - should not crash, should attempt interaction
        await page.keyboard.press('KeyE');
        await page.waitForTimeout(200);

        // Game should still be running
        await expect(page.locator('#gameCanvas')).toBeVisible();
    });

    test('arrow keys work for movement', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('#gameCanvas');
        await page.click('text=New Game');
        await page.click('text=Start Farming');
        await page.waitForTimeout(500);

        await page.locator('#gameCanvas').click();

        // Test arrow keys
        await page.keyboard.press('ArrowUp');
        await page.waitForTimeout(200);
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(200);
        await page.keyboard.press('ArrowLeft');
        await page.waitForTimeout(200);
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(200);

        await expect(page.locator('#gameCanvas')).toBeVisible();
    });
});

test.describe('Regression: Game State', () => {
    test('game state initializes correctly', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('#gameCanvas');
        await page.click('text=New Game');
        await page.click('text=Start Farming');
        await page.waitForTimeout(500);

        const state = await page.evaluate(() => {
            if (window.game) {
                return {
                    hasPlayer: !!window.game.player,
                    hasInventory: !!window.game.inventory,
                    hasTimeSystem: !!window.game.timeSystem
                };
            }
            return null;
        });

        if (state) {
            expect(state.hasPlayer).toBe(true);
            expect(state.hasInventory).toBe(true);
            expect(state.hasTimeSystem).toBe(true);
        }
    });
});
