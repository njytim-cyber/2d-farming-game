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
 * Generate the eastern "Ranch Town" map (40x40)
 */
export function generateEastMap(): MapGenResult {
    const map: number[][] = [];
    const width = 40;
    const height = 40;

    // 1. Base Terrain: Default to Grass, but less noisy than wilderness
    for (let y = 0; y < height; y++) {
        const row: number[] = [];
        for (let x = 0; x < width; x++) {
            row.push(TILES.GRASS);
        }
        map.push(row);
    }

    // 2. Road Network
    // Main Road (West to East Center)
    const cy = 20;
    for (let x = 0; x < width; x++) {
        map[cy][x] = TILES.ROAD;
        map[cy + 1][x] = TILES.ROAD;
    }

    // Vertical Roads (forming a grid/blocks)
    const vRoads = [8, 20, 32];
    vRoads.forEach(vx => {
        for (let y = 5; y < 35; y++) {
            map[y][vx] = TILES.ROAD;
            map[y][vx + 1] = TILES.ROAD;
        }
    });

    // Town Square (Center)
    for (let y = 16; y < 26; y++) {
        for (let x = 16; x < 26; x++) {
            map[y][x] = TILES.ROAD; // Hard surface
        }
    }
    // Fountain in Square
    map[20][20] = TILES.FOUNTAIN;
    map[20][21] = TILES.FOUNTAIN;
    map[21][20] = TILES.FOUNTAIN;
    map[21][21] = TILES.FOUNTAIN;

    // 3. Buildings (20 total)
    // Structure: [x, y, type, w, h]
    // Standard buildings are 3x3 for consistency (or use specific sizes if defined)
    const buildings: { x: number, y: number, type: number, w: number, h: number }[] = [];

    // North Block (Residential)
    buildings.push({ x: 2, y: 6, type: TILES.TOWN_HOUSE, w: 3, h: 3 });
    buildings.push({ x: 12, y: 6, type: TILES.TOWN_HOUSE, w: 3, h: 3 });
    buildings.push({ x: 26, y: 6, type: TILES.TOWN_HOUSE, w: 3, h: 3 });
    buildings.push({ x: 34, y: 6, type: TILES.TOWN_HOUSE, w: 3, h: 3 });

    buildings.push({ x: 2, y: 12, type: TILES.TOWN_HOUSE, w: 3, h: 3 });
    buildings.push({ x: 12, y: 12, type: TILES.TOWN_HOUSE, w: 3, h: 3 });
    buildings.push({ x: 26, y: 12, type: TILES.TOWN_HOUSE, w: 3, h: 3 });
    buildings.push({ x: 34, y: 12, type: TILES.TOWN_HOUSE, w: 3, h: 3 });

    // South Block (Residential)
    buildings.push({ x: 2, y: 26, type: TILES.TOWN_HOUSE, w: 3, h: 3 });
    buildings.push({ x: 12, y: 26, type: TILES.TOWN_HOUSE, w: 3, h: 3 });
    buildings.push({ x: 26, y: 26, type: TILES.TOWN_HOUSE, w: 3, h: 3 });
    buildings.push({ x: 34, y: 26, type: TILES.TOWN_HOUSE, w: 3, h: 3 });

    // Services/Shops (Near Center)
    buildings.push({ x: 10, y: 17, type: TILES.LIBRARY, w: 3, h: 3 }); // Near square left
    buildings.push({ x: 28, y: 17, type: TILES.TAVERN, w: 3, h: 3 }); // Near square right

    buildings.push({ x: 10, y: 22, type: TILES.SCHOOL, w: 3, h: 3 });
    buildings.push({ x: 28, y: 22, type: TILES.CLINIC, w: 3, h: 3 });

    // Special
    buildings.push({ x: 18, y: 8, type: TILES.CHURCH, w: 4, h: 4 }); // North Center
    buildings.push({ x: 18, y: 30, type: TILES.MAYOR_HOUSE, w: 4, h: 3 }); // South Center
    buildings.push({ x: 35, y: 18, type: TILES.BLACKSMITH, w: 3, h: 3 }); // East Edge

    // Phase 1 Expansion
    buildings.push({ x: 6, y: 26, type: TILES.TAILOR, w: 3, h: 3 }); // South Block (Replaces Town House)
    buildings.push({ x: 35, y: 24, type: TILES.GUILD, w: 3, h: 3 }); // East Edge (South of Blacksmith)

    // Place Buildings on Map
    buildings.forEach(b => {
        for (let by = 0; by < b.h; by++) {
            for (let bx = 0; bx < b.w; bx++) {
                if (b.y + by < height && b.x + bx < width) {
                    map[b.y + by][b.x + bx] = b.type;
                }
            }
        }
    });

    // 3.5. Town Decorations
    // Flower beds around the town square
    const flowerPositions = [
        { x: 15, y: 16 }, { x: 15, y: 25 }, { x: 26, y: 16 }, { x: 26, y: 25 },
        { x: 17, y: 15 }, { x: 24, y: 15 }, { x: 17, y: 26 }, { x: 24, y: 26 }
    ];
    flowerPositions.forEach(pos => {
        if (map[pos.y][pos.x] === TILES.GRASS || map[pos.y][pos.x] === TILES.ROAD) {
            map[pos.y][pos.x] = TILES.FLOWER_BED;
        }
    });

    // Hedges along the north and south edges of the town square
    for (let x = 16; x < 26; x++) {
        if (map[14][x] === TILES.GRASS) map[14][x] = TILES.HEDGE;
        if (map[27][x] === TILES.GRASS) map[27][x] = TILES.HEDGE;
    }

    // Street lamps at key intersections
    const lampPositions = [
        { x: 7, y: 19 }, { x: 7, y: 22 },   // West road
        { x: 33, y: 19 }, { x: 33, y: 22 }, // East road
        { x: 15, y: 19 }, { x: 26, y: 19 }, // Around square
        { x: 15, y: 22 }, { x: 26, y: 22 }
    ];
    lampPositions.forEach(pos => {
        if (map[pos.y][pos.x] === TILES.GRASS) {
            map[pos.y][pos.x] = TILES.LAMP;
        }
    });

    // Benches in the town square area
    const benchPositions = [
        { x: 17, y: 18 }, { x: 24, y: 18 },
        { x: 17, y: 23 }, { x: 24, y: 23 }
    ];
    benchPositions.forEach(pos => {
        if (map[pos.y][pos.x] === TILES.ROAD) {
            map[pos.y][pos.x] = TILES.BENCH;
        }
    });

    // Gardens near residential buildings
    const gardenPositions = [
        { x: 5, y: 9 }, { x: 15, y: 9 },   // Near north houses
        { x: 5, y: 29 }, { x: 15, y: 29 }  // Near south houses
    ];
    gardenPositions.forEach(pos => {
        if (map[pos.y][pos.x] === TILES.GRASS) {
            map[pos.y][pos.x] = TILES.GARDEN;
        }
    });

    // Well in the town center (alternative to more flower beds)
    if (map[19][17] === TILES.ROAD) {
        map[19][17] = TILES.WELL;
    }

    // 4. NPCs (30)

    const npcs: any[] = [];
    const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank', 'Ivy', 'Jack', 'Kate', 'Leo', 'Mia', 'Noah', 'Olive', 'Paul', 'Quinn', 'Rose', 'Sam', 'Tina', 'Uma', 'Victor', 'Willow', 'Xander', 'Yara', 'Zane', 'Ben', 'Cara', 'Dan', 'Elsa'];

    for (let i = 0; i < 30; i++) {
        // Random position on a road or near buildings
        // Simple retry logic
        let nx = 20, ny = 20;
        let valid = false;
        let attempts = 0;

        while (!valid && attempts < 10) {
            nx = Math.floor(Math.random() * width);
            ny = Math.floor(Math.random() * height);
            // Valid if walklable (Road or Grass, not Building)
            const tile = map[ny][nx];
            if (tile === TILES.GRASS || tile === TILES.ROAD) {
                valid = true;
            }
            attempts++;
        }

        // Assign Personality
        // Assign Personality Deterministically
        const personalities = ['cheerful', 'grumpy', 'mysterious', 'helpful', 'poetic', 'anxious'];
        const type = personalities[i % personalities.length];

        const dialogues: Record<string, string[]> = {
            cheerful: [
                "What a beautiful day!",
                "I love living in Ranch Town.",
                "Have you seen the fountain? It's lovely.",
                "You should visit the tavern, the ale is great!"
            ],
            grumpy: [
                "Hmph. Watch where you're going.",
                "Too much noise in this town lately.",
                "I've got work to do, don't bother me.",
                "The weather is never right for my crops."
            ],
            mysterious: [
                "They say the caves go deeper than anyone knows...",
                "I've seen strange lights in the forest at night.",
                "Be careful who you trust.",
                "The old ruins to the south hold many secrets."
            ],
            helpful: [
                "Need healing? The Clinic is near the School.",
                "You can sell your crops to the General Store west of here.",
                "Watering crops daily increases their quality!",
                "The Blacksmith can upgrade your tools."
            ],
            poetic: [
                "The wind whispers secrets through the trees.",
                "Does the river not flow like time itself?",
                "The stars act as our guide in the dark.",
                "Even a humble seed holds the promise of life."
            ],
            anxious: [
                "Did you hear that noise?",
                "I hope the monsters don't come near the town.",
                "I think I lost my keys...",
                "Is it safe to go out at night?"
            ]
        };

        const npcDialogue = dialogues[type] || dialogues['cheerful'];

        npcs.push({
            id: `town_npc_${i}`,
            name: firstNames[i % firstNames.length] + (Math.floor(i / firstNames.length) > 0 ? ` ${i}` : ''),
            x: nx,
            y: ny,
            type: 'villager',
            personality: type,
            color: getDeterministicColor(i),
            dialogue: npcDialogue
        });
    }

    return { map, npcs };
}

function getDeterministicColor(index: number) {
    const colors = ['#e57373', '#f06292', '#ba68c8', '#9575cd', '#7986cb', '#64b5f6', '#4fc3f7', '#4dd0e1', '#4db6ac', '#81c784', '#aed581', '#dce775', '#fff176', '#ffd54f', '#ffb74d', '#ff8a65'];
    return colors[index % colors.length];
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
        tile === TILES.OLD_HOUSE || tile === TILES.COOP || tile === TILES.BARN ||
        tile === TILES.TOWN_HOUSE || tile === TILES.LIBRARY || tile === TILES.SCHOOL ||
        tile === TILES.TAVERN || tile === TILES.BLACKSMITH || tile === TILES.CLINIC ||
        tile === TILES.MAYOR_HOUSE || tile === TILES.CHURCH || tile === TILES.FOUNTAIN ||
        tile === TILES.TAILOR || tile === TILES.GUILD || tile === TILES.BANK ||
        tile === TILES.WINDMILL || tile === TILES.MUSEUM) {
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
