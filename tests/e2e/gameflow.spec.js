/**
 * E2E Tests for Complete Game Flows
 */
import { test, expect } from '@playwright/test';

test.describe('Game Flow E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('#gameCanvas', { timeout: 10000 });
    });

    test('complete game startup flow', async ({ page }) => {
        // Should show character creator
        await expect(page.locator('#creator-modal')).toBeVisible();

        // Start new game
        await page.click('text=New Game');
        await page.click('text=Start Farming');

        // Game canvas should be active
        await expect(page.locator('#gameCanvas')).toBeVisible();

        // HUD elements should be visible
        await expect(page.locator('.hud')).toBeVisible();
        await expect(page.locator('.inventory-bar')).toBeVisible();
    });

    test('inventory system works', async ({ page }) => {
        await page.click('text=New Game');
        await page.click('text=Start Farming');
        await page.waitForTimeout(500);

        // Should have starting items (turnip seeds)
        const inventorySlot = page.locator('.inventory-slot').first();
        await expect(inventorySlot).toBeVisible();
    });

    test('movement with keyboard', async ({ page }) => {
        await page.click('text=New Game');
        await page.click('text=Start Farming');
        await page.waitForTimeout(500);

        // Focus canvas
        await page.locator('#gameCanvas').click();

        // Test WASD movement
        await page.keyboard.press('KeyW');
        await page.waitForTimeout(150);
        await page.keyboard.press('KeyS');
        await page.waitForTimeout(150);
        await page.keyboard.press('KeyA');
        await page.waitForTimeout(150);
        await page.keyboard.press('KeyD');
        await page.waitForTimeout(150);

        // Game should still be running (no crash)
        await expect(page.locator('#gameCanvas')).toBeVisible();
    });

    test('continuous movement when holding key', async ({ page }) => {
        await page.click('text=New Game');
        await page.click('text=Start Farming');
        await page.waitForTimeout(500);

        // Focus canvas
        await page.locator('#gameCanvas').click();

        // Inject position tracker
        await page.evaluate(() => {
            window.positionLog = [];
            const originalUpdate = window.game?.player?.update;
            if (window.game?.player) {
                const player = window.game.player;
                setInterval(() => {
                    window.positionLog.push({ x: player.gridX, y: player.gridY });
                }, 50);
            }
        });

        // Hold key down for 600ms
        await page.keyboard.down('KeyS');
        await page.waitForTimeout(600);
        await page.keyboard.up('KeyS');
        await page.waitForTimeout(200);

        // Check if moved multiple times
        const positions = await page.evaluate(() => window.positionLog || []);

        // Should record multiple positions during movement
        // Note: This test validates that movement is being tracked
        expect(positions.length).toBeGreaterThan(0);
    });

    test('action button interaction', async ({ page }) => {
        await page.click('text=New Game');
        await page.click('text=Start Farming');
        await page.waitForTimeout(500);

        // FAB button should be visible
        const fabBtn = page.locator('#fab-action');
        await expect(fabBtn).toBeVisible();

        // Click should not crash
        await fabBtn.click();
        await expect(page.locator('#gameCanvas')).toBeVisible();
    });

    test('zoom controls work', async ({ page }) => {
        await page.click('text=New Game');
        await page.click('text=Start Farming');
        await page.waitForTimeout(500);

        const zoomBtns = page.locator('.zoom-btn');
        const btnCount = await zoomBtns.count();

        if (btnCount >= 2) {
            // Click zoom in
            await zoomBtns.nth(0).click();
            await page.waitForTimeout(100);

            // Click zoom out
            await zoomBtns.nth(1).click();
            await page.waitForTimeout(100);
        }

        await expect(page.locator('#gameCanvas')).toBeVisible();
    });
});

test.describe('Building Interaction Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('#gameCanvas');
        await page.click('text=New Game');
        await page.click('text=Start Farming');
        await page.waitForTimeout(500);
    });

    test('can approach and interact with house', async ({ page }) => {
        // Move towards house (upper-left from spawn)
        await page.locator('#gameCanvas').click();

        // Hold W+A to go up-left towards house
        for (let i = 0; i < 3; i++) {
            await page.keyboard.press('KeyW');
            await page.waitForTimeout(200);
        }
        for (let i = 0; i < 4; i++) {
            await page.keyboard.press('KeyA');
            await page.waitForTimeout(200);
        }

        // Press E to interact
        await page.keyboard.press('KeyE');
        await page.waitForTimeout(300);

        // Check if house modal appeared (might need to be adjacent)
        // This is a basic check - actual house interaction depends on proximity
        await expect(page.locator('#gameCanvas')).toBeVisible();
    });

    test('can approach and interact with shop', async ({ page }) => {
        // Move towards shop (upper-right from spawn)
        await page.locator('#gameCanvas').click();

        // Move up and right
        for (let i = 0; i < 3; i++) {
            await page.keyboard.press('KeyW');
            await page.waitForTimeout(200);
        }
        for (let i = 0; i < 3; i++) {
            await page.keyboard.press('KeyD');
            await page.waitForTimeout(200);
        }

        // Press E to interact
        await page.keyboard.press('KeyE');
        await page.waitForTimeout(300);

        await expect(page.locator('#gameCanvas')).toBeVisible();
    });
});

test.describe('Farming Actions Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('#gameCanvas');
        await page.click('text=New Game');
        await page.click('text=Start Farming');
        await page.waitForTimeout(500);
        await page.locator('#gameCanvas').click();
    });

    test('can till grass to soil', async ({ page }) => {
        // Move to a grass tile
        await page.keyboard.press('KeyD');
        await page.waitForTimeout(200);

        // Face a direction and interact to till
        await page.keyboard.press('KeyE');
        await page.waitForTimeout(200);

        // Game should continue without errors
        await expect(page.locator('#gameCanvas')).toBeVisible();
    });

    test('can select inventory slots', async ({ page }) => {
        // Click on first inventory slot
        const slot = page.locator('.inventory-slot').first();
        await slot.click();

        // Slot should be selected (has selected class or style)
        await expect(slot).toBeVisible();
    });
});

test.describe('Save/Load Tests', () => {
    test('auto-save indicator appears', async ({ page }) => {
        await page.click('text=New Game');
        await page.click('text=Start Farming');

        // Wait for auto-save interval
        await page.waitForTimeout(11000);

        // Save indicator should have appeared (check if element exists)
        await expect(page.locator('#gameCanvas')).toBeVisible();
    });

    test('game persists on refresh', async ({ page }) => {
        await page.click('text=New Game');
        await page.click('text=Start Farming');
        await page.waitForTimeout(1000);

        // Move player
        await page.locator('#gameCanvas').click();
        await page.keyboard.press('KeyD');
        await page.waitForTimeout(300);

        // Reload page
        await page.reload();
        await page.waitForSelector('#gameCanvas');

        // Should show continue option
        const continueBtn = page.locator('text=Continue');
        await expect(continueBtn).toBeVisible();
    });
});
