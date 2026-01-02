/**
 * Dungeon Generator
 * Procedural generation for the 10-level cave
 */

import { TILES, CREEP_TYPES, NPC_IDS } from '../game/constants';

export interface DungeonLevel {
    map: number[][];
    npcs: any[];
}

/**
 * Generate a dungeon level
 * @param level - The floor number (1-10)
 */
export function generateDungeonLevel(level: number): DungeonLevel {
    const width = 40;
    const height = 40;
    const map: number[][] = [];

    // Fill with walls
    for (let y = 0; y < height; y++) {
        const row: number[] = new Array(width).fill(TILES.DUNGEON_WALL);
        map.push(row);
    }

    // Create a simple room-based path
    // For now, let's just clear a central area and some "rooms"
    const clearArea = (x1: number, y1: number, w: number, h: number) => {
        for (let y = y1; y < y1 + h; y++) {
            for (let x = x1; x < x1 + w; x++) {
                if (y >= 0 && y < height && x >= 0 && x < width) {
                    map[y][x] = TILES.DUNGEON_FLOOR;
                }
            }
        }
    };

    // Central corridor
    clearArea(18, 5, 4, 30);

    // Random rooms
    const rooms = level + 2;
    for (let i = 0; i < rooms; i++) {
        const rx = 5 + Math.floor(Math.random() * 25);
        const ry = 5 + Math.floor(Math.random() * 25);
        const rw = 5 + Math.floor(Math.random() * 8);
        const rh = 5 + Math.floor(Math.random() * 8);
        clearArea(rx, ry, rw, rh);
    }

    // Place stairs down at the top center
    const stairsDownX = 20;
    const stairsDownY = 5;
    map[stairsDownY][stairsDownX] = TILES.DUNGEON_STAIRS;

    // Place stairs up at the bottom center (entrance)
    const stairsUpX = 20;
    const stairsUpY = 35;
    map[stairsUpY][stairsUpX] = TILES.DUNGEON_STAIRS;

    // Generate NPCs (creeps)
    const npcs: any[] = [];
    const creepCount = level + 3;
    const types = Object.keys(CREEP_TYPES);

    // Choose 5 types based on level or random
    for (let i = 0; i < creepCount; i++) {
        const typeIndex = Math.floor(Math.random() * types.length);
        const typeKey = types[typeIndex];
        const typeDef = (CREEP_TYPES as any)[typeKey];

        // Find a random floor tile
        let tx, ty;
        do {
            tx = Math.floor(Math.random() * width);
            ty = Math.floor(Math.random() * height);
        } while (map[ty][tx] !== TILES.DUNGEON_FLOOR);

        npcs.push({
            id: `creep_${level}_${i}`,
            type: NPC_IDS.CREEP,
            creepType: typeKey,
            x: tx,
            y: ty,
            hp: typeDef.hp,
            maxHp: typeDef.hp,
            attack: typeDef.attack,
            speed: typeDef.speed,
            color: typeDef.color,
            name: typeDef.name
        });
    }

    return { map, npcs };
}
