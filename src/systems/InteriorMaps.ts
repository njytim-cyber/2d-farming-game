import { INTERIOR_TILES, NPC_IDS } from '../game/constants';

interface InteriorResult {
    map: number[][];
    npcs: any[]; // Define NPC type
}

export function generateHouseInterior(): InteriorResult {
    const width = 10;
    const height = 10;
    const map: number[][] = [];

    for (let y = 0; y < height; y++) {
        const row: number[] = [];
        for (let x = 0; x < width; x++) {
            if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
                if (y === height - 1 && (x === 4 || x === 5)) {
                    row.push(INTERIOR_TILES.DOOR);
                } else {
                    row.push(INTERIOR_TILES.WALL);
                }
            } else if (y === 1 && (x === 1 || x === 2)) {
                row.push(INTERIOR_TILES.BED);
            } else if (y === 4 && (x === 4 || x === 5)) {
                row.push(INTERIOR_TILES.TABLE);
            } else if ((y === 4 || y === 5) && (x === 3 || x === 6)) {
                row.push(INTERIOR_TILES.CHAIR);
            } else if (y >= 3 && y <= 5 && x >= 3 && x <= 6) {
                row.push(INTERIOR_TILES.RUG);
            } else if (y === 1 && x === 8) {
                row.push(INTERIOR_TILES.STOVE);
            } else if (y === 2 && x === 1) {
                row.push(INTERIOR_TILES.CHEST);
            } else {
                row.push(INTERIOR_TILES.FLOOR);
            }
        }
        map.push(row);
    }

    return { map, npcs: [] };
}

/**
 * Generate shop interior (16x12)
 */
export function generateShopInterior(): InteriorResult {
    const width = 16;
    const height = 12;
    const map: number[][] = [];

    for (let y = 0; y < height; y++) {
        const row: number[] = [];
        for (let x = 0; x < width; x++) {
            if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
                if (y === height - 1 && (x === 7 || x === 8)) {
                    row.push(INTERIOR_TILES.DOOR);
                } else {
                    row.push(INTERIOR_TILES.WALL);
                }
                continue;
            }

            if (x === 4 && y < 8 && y > 2) {
                if (y === 5) row.push(INTERIOR_TILES.FLOOR);
                else row.push(INTERIOR_TILES.WALL);
                continue;
            }

            if (x === 11 && y < 8 && y > 2) {
                if (y === 5) row.push(INTERIOR_TILES.FLOOR);
                else row.push(INTERIOR_TILES.WALL);
                continue;
            }

            if (y === 3 && x >= 6 && x <= 9) {
                row.push(INTERIOR_TILES.COUNTER);
                continue;
            }

            if ((y === 8) && (x === 5 || x === 10)) {
                row.push(INTERIOR_TILES.SHELF);
                continue;
            }

            if (y >= 5 && y <= 7 && x >= 6 && x <= 9) {
                row.push(INTERIOR_TILES.RUG);
                continue;
            }

            if (x < 4) {
                if (y === 1 || y === 4) {
                    row.push(INTERIOR_TILES.SHELF);
                    continue;
                }
                if (y === 2 && x === 1) {
                    row.push(INTERIOR_TILES.CHEST);
                    continue;
                }
            }

            if (x > 11) {
                if (y === 1 && x > 12) {
                    row.push(INTERIOR_TILES.TV);
                    continue;
                }
                if (y === 3 && x > 12) {
                    row.push(INTERIOR_TILES.COUCH);
                    continue;
                }
                if (y === 1 && x === 12) {
                    row.push(INTERIOR_TILES.PLANT);
                    continue;
                }
            }

            if (y === 1 && (x === 5 || x === 10)) {
                row.push(INTERIOR_TILES.PLANT);
                continue;
            }

            row.push(INTERIOR_TILES.FLOOR);
        }
        map.push(row);
    }

    return {
        map,
        npcs: [
            { id: NPC_IDS.SHOPKEEPER, x: 7, y: 2, type: 'npc' }
        ]
    };
}

/**
 * Generate Old House (Abandoned Shack) interior (12x10)
 */
export function generateOldHouseInterior(): InteriorResult {
    const width = 12;
    const height = 10;
    const map: number[][] = [];

    for (let y = 0; y < height; y++) {
        const row: number[] = [];
        for (let x = 0; x < width; x++) {
            if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
                if (y === height - 1 && (x === 5 || x === 6)) {
                    row.push(INTERIOR_TILES.DOOR);
                } else {
                    row.push(INTERIOR_TILES.WALL);
                }
            }
            else if (y === 1 && x > 1 && x < 5) row.push(INTERIOR_TILES.SHELF);
            else if (y === 1 && x === 10) row.push(INTERIOR_TILES.PLANT);
            else if (y === 2 && x === 1) row.push(INTERIOR_TILES.BED);
            else if (y === 2 && x === 10) row.push(INTERIOR_TILES.STOVE);
            else if (y === 5 && x === 3) row.push(INTERIOR_TILES.TABLE);
            else if (y === 8 && x === 2) row.push(INTERIOR_TILES.CHEST);
            else if (y === 3 && x === 8) row.push(INTERIOR_TILES.COUCH);
            else if ((y === 5 || y === 6) && (x >= 5 && x <= 7)) row.push(INTERIOR_TILES.RUG);
            else row.push(INTERIOR_TILES.FLOOR);
        }
        map.push(row);
    }

    return {
        map,
        npcs: [
            { id: 'old_man', x: 5, y: 4, type: 'npc' }
        ]
    };
}

/**
 * Generate Coop interior (6x4)
 * Contains basket for egg collection
 */
export function generateCoopInterior(): InteriorResult {
    const width = 6;
    const height = 4;
    const map: number[][] = [];

    for (let y = 0; y < height; y++) {
        const row: number[] = [];
        for (let x = 0; x < width; x++) {
            if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
                if (y === height - 1 && (x === 2 || x === 3)) {
                    row.push(INTERIOR_TILES.DOOR);
                } else {
                    row.push(INTERIOR_TILES.WALL);
                }
            } else if (y === 1 && x === 4) {
                row.push(INTERIOR_TILES.BASKET); // Egg collection point
            } else {
                row.push(INTERIOR_TILES.FLOOR);
            }
        }
        map.push(row);
    }

    return { map, npcs: [] };
}

/**
 * Generate Barn interior (8x4)
 * Contains pail for milk collection
 */
export function generateBarnInterior(): InteriorResult {
    const width = 8;
    const height = 4;
    const map: number[][] = [];

    for (let y = 0; y < height; y++) {
        const row: number[] = [];
        for (let x = 0; x < width; x++) {
            if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
                if (y === height - 1 && (x === 3 || x === 4)) {
                    row.push(INTERIOR_TILES.DOOR);
                } else {
                    row.push(INTERIOR_TILES.WALL);
                }
            } else if (y === 1 && x === 6) {
                row.push(INTERIOR_TILES.PAIL); // Milk collection point
            } else {
                row.push(INTERIOR_TILES.FLOOR);
            }
        }
        map.push(row);
    }

    return { map, npcs: [] };
}

/**
 * Check if interior tile is solid
 */
export function isInteriorSolid(tileType: number): boolean {
    return tileType === INTERIOR_TILES.WALL ||
        tileType === INTERIOR_TILES.TABLE ||
        tileType === INTERIOR_TILES.BED ||
        tileType === INTERIOR_TILES.STOVE ||
        tileType === INTERIOR_TILES.CHEST ||
        tileType === INTERIOR_TILES.COUNTER ||
        tileType === INTERIOR_TILES.SHELF ||
        tileType === INTERIOR_TILES.TV ||
        tileType === INTERIOR_TILES.COUCH ||
        tileType === INTERIOR_TILES.PLANT ||
        tileType === INTERIOR_TILES.BASKET ||
        tileType === INTERIOR_TILES.PAIL;
    // CHAIR, RUG, FLOOR, DOOR are not solid
}

interface SpawnPoint {
    x: number;
    y: number;
}

/**
 * Get spawn position when entering an interior
 */
export function getInteriorSpawn(interiorType: string): SpawnPoint {
    switch (interiorType) {
        case 'house':
            return { x: 4, y: 7 };
        case 'shop':
            return { x: 8, y: 10 };
        case 'old_house':
            return { x: 6, y: 8 };
        case 'coop':
            return { x: 2, y: 2 };
        case 'barn':
            return { x: 3, y: 2 };
        default:
            return { x: 5, y: 5 };
    }
}

export default {
    INTERIOR_TILES,
    generateHouseInterior,
    generateShopInterior,
    generateOldHouseInterior,
    generateCoopInterior,
    generateBarnInterior,
    isInteriorSolid,
    getInteriorSpawn
};
