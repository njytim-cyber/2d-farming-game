/**
 * Fast Smoke Tests - Should complete in <10 seconds
 * Tests critical functionality without slow waits
 */
import { test, expect } from '@playwright/test';

// Fast game helper - no unnecessary waits
async function startGame(page) {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas', { timeout: 5000 });
    // Click Start Farming directly - the game shows character creator immediately
    await page.click('text=Start Farming');
}

test.describe('Smoke Tests', () => {
    test('game loads and starts', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#gameCanvas')).toBeVisible({ timeout: 5000 });

        // Character creator modal shows directly with "Start Farming" button
        await page.click('text=Start Farming');

        // Game should be running
        await expect(page.locator('#gameCanvas')).toBeVisible();
    });

    test('HUD visible after start', async ({ page }) => {
        await startGame(page);
        await expect(page.locator('.stats-container')).toBeVisible();
        await expect(page.locator('#ui-money')).toContainText('$');
    });

    test('player input works', async ({ page }) => {
        await startGame(page);
        await page.locator('#gameCanvas').click();

        // Just verify no crash on input
        await page.keyboard.press('KeyW');
        await page.keyboard.press('KeyE');
        await expect(page.locator('#gameCanvas')).toBeVisible();
    });

    test('game state accessible', async ({ page }) => {
        await startGame(page);
        const hasState = await page.evaluate(() =>
            typeof window.getState === 'function' && window.game?.player !== undefined
        );
        expect(hasState).toBe(true);
    });
});
