/**
 * Unit Tests for Core Game Systems
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Inventory } from '../../src/systems/Inventory';
import { TimeSystem } from '../../src/systems/TimeSystem';
import { generateMap, isSolid, getTile, setTile, generateEastMap } from '../../src/systems/MapGenerator';
import { TILES, MAP_WIDTH, MAP_HEIGHT, SEEDS, INVENTORY_SIZE } from '../../src/game/constants';
import { Player } from '../../src/entities/Player';
import { Crop } from '../../src/entities/Crop';

describe('Inventory System', () => {
    let inventory: Inventory;

    beforeEach(() => {
        inventory = new Inventory();
    });

    it('should initialize with empty slots', () => {
        expect(inventory.slots.length).toBe(INVENTORY_SIZE);
        expect(inventory.slots.every(s => s === null)).toBe(true);
    });

    it('should add items correctly', () => {
        const result = inventory.addItem('turnip_seed', 5);
        expect(result).toBe(true);
        expect(inventory.slots[0]).toEqual({ name: 'turnip_seed', count: 5 });
    });

    it('should stack same items', () => {
        inventory.addItem('turnip_seed', 5);
        inventory.addItem('turnip_seed', 3);
        expect(inventory.slots[0]!.count).toBe(8);
    });

    it('should not stack different items', () => {
        inventory.addItem('turnip_seed', 5);
        inventory.addItem('carrot_seed', 3);
        expect(inventory.slots[0]!.name).toBe('turnip_seed');
        expect(inventory.slots[1]!.name).toBe('carrot_seed');
    });

    it('should remove items from slot', () => {
        inventory.addItem('turnip_seed', 5);
        inventory.removeFromSlot(0, 2);
        expect(inventory.slots[0]!.count).toBe(3);
    });

    it('should clear slot when count reaches zero', () => {
        inventory.addItem('turnip_seed', 2);
        inventory.removeFromSlot(0, 2);
        expect(inventory.slots[0]).toBe(null);
    });

    it('should select slots correctly', () => {
        inventory.selectSlot(5);
        expect(inventory.selected).toBe(5);
    });

    it('should get selected item', () => {
        inventory.addItem('turnip_seed', 5);
        inventory.selectSlot(0);
        const item = inventory.getSelectedItem();
        expect(item!.name).toBe('turnip_seed');
    });

    it('should serialize correctly', () => {
        inventory.addItem('turnip_seed', 5);
        inventory.selectSlot(2);
        const data = inventory.serialize();
        expect(data.slots[0]).toEqual({ name: 'turnip_seed', count: 5 });
        expect(data.selected).toBe(2);
    });
});

describe('TimeSystem', () => {
    let timeSystem: TimeSystem;

    beforeEach(() => {
        timeSystem = new TimeSystem();
    });

    it('should initialize with default values', () => {
        expect(timeSystem.dayCount).toBe(1);
        expect(timeSystem.season).toBe(0);
        expect(timeSystem.energy).toBe(300);
    });

    it('should consume energy', () => {
        const result = timeSystem.consumeEnergy(10);
        expect(result).toBe(true);
        expect(timeSystem.energy).toBe(290);
    });

    it('should not consume energy when insufficient', () => {
        timeSystem.energy = 5;
        const result = timeSystem.consumeEnergy(10);
        expect(result).toBe(false);
        expect(timeSystem.energy).toBe(5);
    });

    it('should get correct season name', () => {
        timeSystem.season = 0;
        expect(timeSystem.getSeasonName()).toBe('Spring');
        timeSystem.season = 2;
        expect(timeSystem.getSeasonName()).toBe('Fall');
    });

    it('should restore energy on new day', () => {
        timeSystem.energy = 50;
        timeSystem.startNewDay();
        expect(timeSystem.energy).toBe(300);
        expect(timeSystem.dayCount).toBe(2);
    });

    it('should advance season after 28 days', () => {
        timeSystem.dayCount = 28;
        timeSystem.startNewDay();
        expect(timeSystem.season).toBe(1);
        expect(timeSystem.dayCount).toBe(29);
    });

    it('should wrap seasons after winter', () => {
        timeSystem.season = 3;
        timeSystem.dayCount = 112; // End of Winter (4 * 28)
        timeSystem.startNewDay();
        expect(timeSystem.season).toBe(0);
    });

    it('should serialize correctly', () => {
        timeSystem.dayCount = 5;
        timeSystem.season = 1;
        const data = timeSystem.serialize();
        expect(data.dayCount).toBe(5);
        expect(data.season).toBe(1);
    });
});

describe('MapGenerator', () => {
    let map: number[][];

    beforeEach(() => {
        const result = generateMap();
        map = result.map;
    });

    it('should generate map with correct dimensions', () => {
        expect(map.length).toBe(MAP_HEIGHT);
        expect(map[0].length).toBe(MAP_WIDTH);
    });

    it('should place house as 3x3', () => {
        // House logic in MapGenerator: x: 18-20, y: 10-12
        expect(map[10][18]).toBe(TILES.HOUSE);
        expect(map[10][20]).toBe(TILES.HOUSE);
        expect(map[12][18]).toBe(TILES.HOUSE);
        expect(map[12][20]).toBe(TILES.HOUSE);
    });

    it('should place shop as 3x3', () => {
        // Shop logic in MapGenerator: x: 25-27, y: 10-12
        expect(map[10][25]).toBe(TILES.SHOP);
        expect(map[10][27]).toBe(TILES.SHOP);
        expect(map[12][25]).toBe(TILES.SHOP);
        expect(map[12][27]).toBe(TILES.SHOP);
    });

    it('should clear area around spawn', () => {
        const cx = Math.floor(MAP_WIDTH / 2);
        const cy = Math.floor(MAP_HEIGHT / 2);

        // Spawn point should be grass
        expect(map[cy][cx]).toBe(TILES.GRASS);
    });

    it('isSolid should return true for buildings', () => {
        expect(isSolid(map, 18, 10)).toBe(true); // House
        expect(isSolid(map, 25, 10)).toBe(true); // Shop
    });

    it('isSolid should return true for trees and stones', () => {
        // Find a tree tile
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (map[y][x] === TILES.TREE) {
                    expect(isSolid(map, x, y)).toBe(true);
                    return;
                }
            }
        }
    });

    it('isSolid should return false for grass', () => {
        const cx = Math.floor(MAP_WIDTH / 2);
        const cy = Math.floor(MAP_HEIGHT / 2);
        expect(isSolid(map, cx, cy)).toBe(false);
    });

    it('isSolid should return true for out of bounds', () => {
        expect(isSolid(map, -1, 0)).toBe(true);
        expect(isSolid(map, 0, -1)).toBe(true);
        expect(isSolid(map, MAP_WIDTH, 0)).toBe(true);
        expect(isSolid(map, 0, MAP_HEIGHT)).toBe(true);
    });

    it('setTile should modify map', () => {
        setTile(map, 10, 10, TILES.SOIL);
        expect(map[10][10]).toBe(TILES.SOIL);
    });

    it('should place Tailor and Guild in east map', () => {
        const { map: eastMap } = generateEastMap();
        // Tailor at 6, 26
        expect(eastMap[26][6]).toBe(TILES.TAILOR);
        // Guild at 35, 24
        expect(eastMap[24][35]).toBe(TILES.GUILD);
    });
});

describe('Player Entity', () => {
    it('should serialize and deserialize correctly', async () => {
        const player = new Player({
            gridX: 10,
            gridY: 15,
            visX: 500,
            visY: 750,
            facing: { x: 0, y: 1 }
        });

        const data = player.serialize();
        expect(data.gridX).toBe(10);
        expect(data.gridY).toBe(15);
        expect(data.facing).toEqual({ x: 0, y: 1 });
    });

    it('should update visual position during movement', async () => {
        const player = new Player({
            gridX: 10,
            gridY: 10,
            visX: 450, // Not at target yet
            visY: 500,
            isMoving: true
        });

        const initialVisX = player.visX;
        player.update(0.016); // Added dt argument

        // After update, should have moved closer to target
        expect(player.visX).not.toBe(initialVisX);
    });

    it('should get facing tile correctly', async () => {
        const player = new Player({
            gridX: 10,
            gridY: 10,
            visX: 500,
            visY: 500,
            facing: { x: 1, y: 0 }
        });

        const facingTile = player.getFacingTile();
        expect(facingTile).toEqual({ x: 11, y: 10 });
    });
});

describe('Crop Entity', () => {
    it('should track growth stage', async () => {
        const crop = new Crop('turnip', 10, 10);

        expect(crop.stage).toBe(0);
        expect(crop.type).toBe('turnip');
    });
});
