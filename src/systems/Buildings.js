/**
 * Building System
 * Handles multi-tile building placement, persistence, and management
 */

import { TILE_SIZE, TILES } from '../game/constants.js';
import { isSolid, setTile } from './MapGenerator.js';

// Building type definitions
export const BUILDING_TYPES = {
    BARN: {
        name: 'Barn',
        size: [4, 4],
        cost: { wood: 100, stone: 50 },
        capacity: 4,        // Max animals
        animalTypes: ['cow'],
        tileId: 20,
        color: '#8d6e63'
    },
    COOP: {
        name: 'Coop',
        size: [3, 3],
        cost: { wood: 50, stone: 25 },
        capacity: 8,
        animalTypes: ['chicken'],
        tileId: 21,
        color: '#ffcc80'
    },
    SILO: {
        name: 'Silo',
        size: [2, 3],
        cost: { wood: 30, stone: 80 },
        capacity: 0,        // Storage, not animals
        storage: 500,       // Hay/feed storage
        tileId: 22,
        color: '#78909c'
    }
};

/**
 * Check if a building can be placed at coordinates
 * @param {number[][]} map - The game map
 * @param {number} x - Top-left X coordinate
 * @param {number} y - Top-left Y coordinate
 * @param {number[]} size - [width, height] of building
 * @param {object} crops - Crops object
 * @param {object} SEEDS - Seeds data
 * @returns {boolean} Whether placement is valid
 */
export function canPlaceBuilding(map, x, y, size, crops = {}, SEEDS = {}) {
    const [width, height] = size;

    // Check all tiles in the building footprint
    for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
            const tx = x + dx;
            const ty = y + dy;

            // Check bounds and if tile is clear
            if (isSolid(map, tx, ty, crops, SEEDS)) {
                return false;
            }

            // Also check that it's grass (can't build on soil)
            if (map[ty]?.[tx] !== TILES.GRASS) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Place a building on the map
 * @param {object} state - Game state
 * @param {string} buildingType - Type key from BUILDING_TYPES
 * @param {number} x - Top-left X coordinate
 * @param {number} y - Top-left Y coordinate
 * @returns {object|null} Building object if placed, null if failed
 */
export function placeBuilding(state, buildingType, x, y) {
    const buildingDef = BUILDING_TYPES[buildingType];
    if (!buildingDef) return null;

    const [width, height] = buildingDef.size;

    // Mark tiles as building
    for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
            setTile(state.map, x + dx, y + dy, buildingDef.tileId);
        }
    }

    // Create building record
    const building = {
        id: Date.now(),
        type: buildingType,
        x,
        y,
        width,
        height,
        animals: [],
        storage: buildingDef.storage || 0,
        currentStorage: 0
    };

    // Add to state
    if (!state.buildings) {
        state.buildings = [];
    }
    state.buildings.push(building);

    return building;
}

/**
 * Remove a building from the map
 */
export function removeBuilding(state, buildingId) {
    const idx = state.buildings?.findIndex(b => b.id === buildingId);
    if (idx === -1) return false;

    const building = state.buildings[idx];

    // Clear tiles
    for (let dy = 0; dy < building.height; dy++) {
        for (let dx = 0; dx < building.width; dx++) {
            setTile(state.map, building.x + dx, building.y + dy, TILES.GRASS);
        }
    }

    // Remove from state
    state.buildings.splice(idx, 1);
    return true;
}

/**
 * Get building at coordinates
 */
export function getBuildingAt(state, x, y) {
    return state.buildings?.find(b =>
        x >= b.x && x < b.x + b.width &&
        y >= b.y && y < b.y + b.height
    );
}

/**
 * Check if player can afford building
 */
export function canAffordBuilding(inventory, buildingType) {
    const buildingDef = BUILDING_TYPES[buildingType];
    if (!buildingDef) return false;

    for (const [resource, amount] of Object.entries(buildingDef.cost)) {
        const slot = inventory.slots.find(s => s?.name === resource);
        if (!slot || slot.count < amount) {
            return false;
        }
    }
    return true;
}

/**
 * Deduct building cost from inventory
 */
export function deductBuildingCost(inventory, buildingType) {
    const buildingDef = BUILDING_TYPES[buildingType];
    if (!buildingDef) return false;

    for (const [resource, amount] of Object.entries(buildingDef.cost)) {
        const slotIdx = inventory.slots.findIndex(s => s?.name === resource);
        if (slotIdx !== -1) {
            inventory.removeFromSlot(slotIdx, amount);
        }
    }
    return true;
}

export default {
    BUILDING_TYPES,
    canPlaceBuilding,
    placeBuilding,
    removeBuilding,
    getBuildingAt,
    canAffordBuilding,
    deductBuildingCost
};
