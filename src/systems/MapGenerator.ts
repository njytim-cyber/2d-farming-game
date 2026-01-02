/**
 * Map Generator
 * Procedural map generation with buildings and terrain
 */

import { MAP_WIDTH, MAP_HEIGHT, TILES, MAP_GEN } from '../game/constants';
import { CropConfig } from '../game/constants';

export interface MapGenResult {
    map: number[][];
    npcs: any[]; // Define NPC type
}

/**
 * Generate the home overworld map (40x40)
 */
export function generateMap(): MapGenResult {
    const map: number[][] = [];
    const width = 40;
    const height = 40;

    // Generate base terrain
    for (let y = 0; y < height; y++) {
        const row: number[] = [];
        for (let x = 0; x < width; x++) {
            const rand = Math.random();
            if (rand < MAP_GEN.TREE_CHANCE) {
                row.push(Math.random() < 0.3 ? TILES.TREE_OAK : TILES.TREE);
            } else if (rand < MAP_GEN.STONE_CHANCE) {
                const stoneRand = Math.random();
                if (stoneRand < 0.2) row.push(TILES.STONE_ORE);
                else if (stoneRand < 0.3) row.push(TILES.STONE_BOULDER);
                else row.push(TILES.STONE);
            } else {
                row.push(TILES.GRASS);
            }
        }
        map.push(row);
    }

    // Place buildings
    const cx = 20;
    const cy = 20;

    // House (3x3)
    for (let y = 10; y < 13; y++) {
        for (let x = 18; x < 21; x++) {
            map[y][x] = TILES.HOUSE;
        }
    }

    // Shop (3x3)
    for (let y = 10; y < 13; y++) {
        for (let x = 25; x < 28; x++) {
            map[y][x] = TILES.SHOP;
        }
    }

    // Old House (8x4) near bottom
    const ohX = 16;
    const ohY = 32;
    for (let y = ohY; y < ohY + 4; y++) {
        for (let x = ohX; x < ohX + 8; x++) {
            map[y][x] = TILES.OLD_HOUSE;
        }
    }

    // Clear area around spawn (center)
    const radius = 3;
    for (let y = cy - radius; y <= cy + radius; y++) {
        for (let x = cx - radius; x <= cx + radius; x++) {
            if (map[y] && map[y][x] === TILES.TREE || map[y][x] === TILES.STONE) {
                map[y][x] = TILES.GRASS;
            }
        }
    }

    return { map, npcs: [] };
}

/**
 * Generate the northern map (40x40) with a cave
 */
export function generateNorthMap(): MapGenResult {
    const map: number[][] = [];
    const width = 40;
    const height = 40;

    for (let y = 0; y < height; y++) {
        const row: number[] = [];
        for (let x = 0; x < width; x++) {
            const rand = Math.random();
            if (rand < MAP_GEN.TREE_CHANCE * 1.5) { // More trees in north
                row.push(Math.random() < 0.3 ? TILES.TREE_OAK : TILES.TREE);
            } else if (rand < MAP_GEN.STONE_CHANCE * 1.5) {
                row.push(TILES.STONE);
            } else {
                row.push(TILES.GRASS);
            }
        }
        map.push(row);
    }

    // Place Cave entrance at the top center
    const caveX = 20;
    const caveY = 5;
    for (let y = caveY - 2; y <= caveY; y++) {
        for (let x = caveX - 2; x <= caveX + 2; x++) {
            map[y][x] = TILES.CAVE;
        }
    }

    return { map, npcs: [] };
}

/**
 * Check if a tile is solid (blocks movement)
 */
export function isSolid(
    map: number[][],
    x: number,
    y: number,
    crops: Record<string, any> = {},
    SEEDS: Record<string, CropConfig> = {}
): boolean {
    const mapHeight = map.length;
    const mapWidth = map[0]?.length || 0;

    if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) {
        return true;
    }

    const tile = map[y][x];

    if (tile === TILES.TREE || tile === TILES.TREE_OAK ||
        tile === TILES.HOUSE || tile === TILES.SHOP ||
        tile === TILES.STONE || tile === TILES.STONE_ORE || tile === TILES.STONE_BOULDER ||
        tile === TILES.OLD_HOUSE || tile === TILES.COOP || tile === TILES.BARN) {
        return true;
    }

    // Check if there's a planted tree or trellis crop at this location
    const key = `${x},${y}`;
    const crop = crops[key];
    if (crop && SEEDS[crop.type]) {
        const seedData = SEEDS[crop.type];
        // Trees and trellis crops are solid
        if (seedData.isTree || seedData.isSolid) {
            return true;
        }
    }

    return false;
}

/**
 * Get the tile type at coordinates
 */
export function getTile(map: number[][], x: number, y: number): number | null {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
        return null;
    }
    return map[y][x];
}

/**
 * Set the tile type at coordinates
 */
export function setTile(map: number[][], x: number, y: number, tileType: number) {
    if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
        map[y][x] = tileType;
    }
}

export default {
    generateMap,
    isSolid,
    getTile,
    setTile
};
