
import { test, expect } from '@playwright/test';
import { SEEDS, TILES } from '../src/game/constants';

test.describe('Season Logic Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for game initialization
        await page.waitForFunction(() => window.game && window.getState);

        // Force new game to ensure clean state
        await page.evaluate(() => {
            window.game.startNewGame();
        });

        // Wait for map to be fully generated
        await page.waitForFunction(() => {
            const state = window.getState();
            return state.map && state.map.length > 0;
        });
    });

    test('planting validation respects seasons', async ({ page }) => {
        // Evaluate in browser context to access game state directly
        // This avoids complex UI interaction for testing logic
        const result = await page.evaluate(() => {
            const state = window.getState();
            const game = window.game; // Assuming game instance is accessible or we can mock it

            // Set Money
            state.money = 1000;

            // Set Season to Spring (0)
            game.timeSystem.season = 0; // Spring

            // Try to plant Turnip (Spring crop)
            // Mock inventory selection
            game.inventory.slots[0] = { name: 'turnip_seed', count: 10 };
            game.inventory.selected = 0;

            // Mock map tile to SOIL
            const x = 5;
            const y = 5;
            state.map[y][x] = 1; // TILES.SOIL

            // 1. Valid Plant
            game.player.gridX = x;
            game.player.gridY = y;
            game.player.facing = { x: 0, y: 0 }; // Face self/current tile effectively for this test logic if we call interact directly, 
            // but interact uses facing tile. Let's face right.
            game.player.facing = { x: 1, y: 0 };

            // Set tile in front to soil
            state.map[y][x + 1] = 1; // SOIL

            // Call interact to plant
            game.interact();

            const cropKey = `${x + 1},${y}`;
            const plantingSuccess = !!state.crops[cropKey];

            // 2. Invalid Plant (Season Mismatch)
            // Set Season to Winter (3)
            game.timeSystem.season = 3;

            // Move to next tile
            state.map[y][x + 2] = 1; // SOIL
            game.player.gridX = x + 1;
            game.interact(); // Try planting turnip in Winter

            const invalidCropKey = `${x + 2},${y}`;
            const plantingFail = !state.crops[invalidCropKey];

            return { plantingSuccess, plantingFail };
        });

        expect(result.plantingSuccess).toBe(true);
        expect(result.plantingFail).toBe(true);
    });

    test('multi-season crops survive season change', async ({ page }) => {
        const result = await page.evaluate(() => {
            const state = window.getState();
            const game = window.game;

            // Plant Strawberry (Spring/Summer) in Spring
            game.timeSystem.season = 0; // Spring
            const x = 10, y = 10;
            state.crops[`${x},${y}`] = { type: 'strawb', stage: 50 };

            // Advance season to Summer (1)
            game.timeSystem.dayCount = 28;
            game.sleep(); // Triggers new day and season change logic
            // (Season becomes 1 because dayCount becomes 29. (29-1)/28 = 1)

            const cropSurvives = !!state.crops[`${x},${y}`];

            // Advance season to Fall (2)
            // Skip 28 days
            game.timeSystem.dayCount = 28 * 2;
            game.sleep(); // Now season is Fall

            const cropWithers = !state.crops[`${x},${y}`];
            // Check for withered tile
            const isWitheredTile = state.map[y][x] === 6; // TILES.WITHERED

            return { cropSurvives, cropWithers, isWitheredTile };
        });

        expect(result.cropSurvives).toBe(true);
        expect(result.cropWithers).toBe(true);
        expect(result.isWitheredTile).toBe(true);
    });
});
