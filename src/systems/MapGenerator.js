/**
 * Map Generator
 * Procedural map generation with buildings and terrain
 */

import { MAP_WIDTH, MAP_HEIGHT, TILES, MAP_GEN } from '../game/constants.js';
import { NPC_IDS } from '../game/constants.js';

/**
 * Generate a new game map
 * @returns {number[][]} 2D array of tile types
 */
export function generateMap() {
    const map = [];

    // Generate base terrain
    for (let y = 0; y < MAP_HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            const rand = Math.random();

            if (rand < MAP_GEN.TREE_CHANCE) {
                // 30% chance for Oak
                row.push(Math.random() < 0.3 ? TILES.TREE_OAK : TILES.TREE);
            } else if (rand < MAP_GEN.STONE_CHANCE) {
                // 20% chance for Ore, 10% for Boulder
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

    // Place buildings at center - 2x2 buildings
    const cx = Math.floor(MAP_WIDTH / 2);
    const cy = Math.floor(MAP_HEIGHT / 2);

    // House is 3x3 (top-left at cx-5, cy-4)
    for (let y = cy - 4; y < cy - 1; y++) {
        for (let x = cx - 5; x < cx - 2; x++) {
            map[y][x] = TILES.HOUSE;
        }
    }

    // Shop is 3x3 (top-left at cx+2, cy-4)
    for (let y = cy - 4; y < cy - 1; y++) {
        for (let x = cx + 2; x < cx + 5; x++) {
            map[y][x] = TILES.SHOP;
        }
    }

    // Place "Mysterious Old House" (8x4) far south
    // Center X, near bottom Y
    const ohX = cx - 4; // Centered (8 wide means -4 offset)
    const ohY = MAP_HEIGHT - 8; // Near bottom

    // Clear area for house
    for (let y = ohY - 1; y < ohY + 5; y++) {
        for (let x = ohX - 1; x < ohX + 9; x++) {
            if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
                map[y][x] = TILES.GRASS;
                // clear trees/stones via return object eventually, 
                // but direct map array manip doesn't clear entity lists unless we handle it.
                // Since this is Generate, we are building the initial map, so checking before placing trees/stones is key.
            }
        }
    }

    // Draw House Tiles
    for (let y = ohY; y < ohY + 4; y++) {
        for (let x = ohX; x < ohX + 8; x++) {
            map[y][x] = TILES.OLD_HOUSE;
        }
    }

    // Clear area around spawn (larger radius for bigger buildings)
    const radius = MAP_GEN.CLEAR_RADIUS + 1;
    for (let y = cy - radius; y <= cy + radius; y++) {
        for (let x = cx - radius; x <= cx + radius; x++) {
            if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
                if (map[y][x] === TILES.TREE || map[y][x] === TILES.STONE) {
                    map[y][x] = TILES.GRASS;
                }
            }
        }
    }

    return {
        map,
        npcs: []
    };
}

/**
 * Check if a tile is solid (blocks movement)
 * @param {number[][]} map - The game map
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {object} crops - Crops object for checking planted trees
 * @param {object} SEEDS - Seeds data for tree check
 * @returns {boolean} Whether tile is solid
 */
export function isSolid(map, x, y, crops = {}, SEEDS = {}) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
        return true;
    }

    const tile = map[y][x];

    if (tile === TILES.TREE || tile === TILES.TREE_OAK ||
        tile === TILES.HOUSE || tile === TILES.SHOP ||
        tile === TILES.STONE || tile === TILES.STONE_ORE || tile === TILES.STONE_BOULDER ||
        tile === TILES.OLD_HOUSE) {
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
 * @param {number[][]} map 
 * @param {number} x 
 * @param {number} y 
 * @returns {number|null} Tile type or null if out of bounds
 */
export function getTile(map, x, y) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
        return null;
    }
    return map[y][x];
}

/**
 * Set the tile type at coordinates
 * @param {number[][]} map 
 * @param {number} x 
 * @param {number} y 
 * @param {number} tileType 
 */
export function setTile(map, x, y, tileType) {
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
