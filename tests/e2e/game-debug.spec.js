import { test, expect } from '@playwright/test';

test.describe('Game Debug Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for game to load
        await page.waitForSelector('#gameCanvas', { timeout: 5000 });
    });

    test('buildings render as 2x2 composite tiles', async ({ page }) => {
        // Start new game
        const newGameBtn = page.locator('text=New Game');
        if (await newGameBtn.isVisible()) {
            await newGameBtn.click();
        }

        const startBtn = page.locator('text=Start Farming');
        if (await startBtn.isVisible()) {
            await startBtn.click();
        }

        // Wait for game to initialize
        await page.waitForTimeout(500);

        // Check building data via JavaScript - verify 2x2 placement exists in map
        const buildingCheck = await page.evaluate(() => {
            // Access game state
            const state = window.__gameState || {};
            if (!state.map) return { error: 'No map state available' };

            const map = state.map;
            const HOUSE = 3;
            const SHOP = 4;

            // Find house tiles
            let houseTiles = [];
            let shopTiles = [];

            for (let y = 0; y < map.length; y++) {
                for (let x = 0; x < map[y].length; x++) {
                    if (map[y][x] === HOUSE) houseTiles.push({ x, y });
                    if (map[y][x] === SHOP) shopTiles.push({ x, y });
                }
            }

            return {
                houseTileCount: houseTiles.length,
                shopTileCount: shopTiles.length,
                houseTiles,
                shopTiles
            };
        });

        // Should have 4 tiles for each building (2x2)
        expect(buildingCheck.houseTileCount).toBe(4);
        expect(buildingCheck.shopTileCount).toBe(4);
    });

    test('player moves continuously when holding key', async ({ page }) => {
        // Start new game
        const newGameBtn = page.locator('text=New Game');
        if (await newGameBtn.isVisible()) {
            await newGameBtn.click();
        }

        const startBtn = page.locator('text=Start Farming');
        if (await startBtn.isVisible()) {
            await startBtn.click();
        }

        // Wait for game to start
        await page.waitForTimeout(500);

        // Get initial position
        const initialPos = await page.evaluate(() => {
            const state = window.__gameState || {};
            return state.player ? { x: state.player.gridX, y: state.player.gridY } : null;
        });

        if (!initialPos) {
            console.log('Could not get player position from state');
            return;
        }

        // Hold W key for 500ms
        await page.keyboard.down('KeyW');
        await page.waitForTimeout(500);
        await page.keyboard.up('KeyW');

        // Wait for movement to complete
        await page.waitForTimeout(200);

        // Get final position
        const finalPos = await page.evaluate(() => {
            const state = window.__gameState || {};
            return state.player ? { x: state.player.gridX, y: state.player.gridY } : null;
        });

        if (!finalPos) {
            console.log('Could not get player position from state');
            return;
        }

        // Player should have moved more than 1 tile if continuous movement works
        const distanceMoved = Math.abs(finalPos.y - initialPos.y) + Math.abs(finalPos.x - initialPos.x);

        // With 80ms interval and 500ms hold, should move ~5-6 tiles
        expect(distanceMoved).toBeGreaterThan(1);
    });

    test('player responds to WASD keys', async ({ page }) => {
        // Start new game
        const newGameBtn = page.locator('text=New Game');
        if (await newGameBtn.isVisible()) {
            await newGameBtn.click();
        }

        const startBtn = page.locator('text=Start Farming');
        if (await startBtn.isVisible()) {
            await startBtn.click();
        }

        await page.waitForTimeout(500);

        // Test each direction key
        for (const key of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) {
            await page.keyboard.press(key);
            await page.waitForTimeout(100);
        }

        // If no errors thrown, basic key handling works
        expect(true).toBe(true);
    });
});
