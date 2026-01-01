import { test, expect } from '@playwright/test';

test.describe('Quest System', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', exception => console.log('PAGE ERROR:', exception));
        await page.goto('/');
    });

    test('should find old man and get sword', async ({ page }) => {
        // Character Creator - Start
        await page.click('text=Start Farming');
        await page.waitForSelector('#gameCanvas');

        // Access internal game state to teleport player to NPC
        await page.evaluate(() => {
            const game = window.game;
            const state = window.getState();

            // Find Old Man
            // IDs are integers? or strings? 
            // In Game.js we used NPC_IDS.OLD_MAN.
            // Let's assume there is only one NPC or we filter by ID if we knew it.
            // Constants says NPC_IDS = { OLD_MAN: 1 }.
            // So we look for id === 1.
            const npc = state.npcs.find(n => n.id === 'old_man');
            if (!npc) throw new Error("Old Man NPC not found in state");

            // Teleport Player above NPC
            // NPC is at x, y (tiles).
            // We go to x, y - 1.
            const targetX = npc.x;
            const targetY = npc.y - 1;

            game.player.gridX = targetX;
            game.player.gridY = targetY;
            game.player.visX = targetX * 50; // TILE_SIZE assumed 50
            game.player.visY = targetY * 50;

            // Face Down
            game.player.facing = { x: 0, y: 1 };
        });

        // Wait a render frame
        await page.waitForTimeout(100);

        // Interact
        await page.keyboard.press(' '); // Spacebar

        // Check Dialogue
        const dialogue = page.locator('#dialogue-modal');
        await expect(dialogue).toHaveClass(/modal-overlay--active/);

        const text = await page.locator('#dialogue-text').innerText();
        expect(text).toContain('dangerous to go alone');

        // Advance Dialogue
        await page.click('#dialogue-next');

        // Verify Sword in Inventory
        await page.waitForTimeout(500);

        const hasSword = await page.evaluate(() => {
            const slots = Array.from(document.querySelectorAll('.slot'));
            return slots.some(slot =>
                slot.dataset.tooltip && (
                    slot.dataset.tooltip.includes('Wooden Sword') ||
                    slot.dataset.tooltip.includes('WOODEN_SWORD')
                )
            );
        });

        expect(hasSword).toBe(true);
    });
});
