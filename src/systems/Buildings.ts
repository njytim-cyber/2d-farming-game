/**
 * Building System
 * Handles multi-tile building placement, persistence, and management
 */

import { TILES } from '../game/constants';
import { isSolid, setTile } from './MapGenerator';
import { GameState } from '../game/state';
import { CropConfig } from '../game/constants';
import { Inventory } from './Inventory';

interface BuildingType {
    name: string;
    size: [number, number];
    cost: Record<string, number>;
    capacity: number;
    animalTypes?: string[];
    storage?: number;
    tileId: number;
    color: string;
}

interface Building {
    id: number;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    animals: any[];
    storage: number;
    currentStorage: number;
}

// Building type definitions
export const BUILDING_TYPES: Record<string, BuildingType> = {
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
 */
export function canPlaceBuilding(
    map: number[][],
    x: number,
    y: number,
    size: [number, number],
    crops: Record<string, any> = {},
    SEEDS: Record<string, CropConfig> = {}
): boolean {
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
 */
export function placeBuilding(
    state: GameState,
    buildingType: string,
    x: number,
    y: number
): Building | null {
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
    const building: Building = {
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
export function removeBuilding(state: GameState, buildingId: number): boolean {
    const idx = state.buildings?.findIndex((b: Building) => b.id === buildingId);
    if (idx === undefined || idx === -1) return false;

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
export function getBuildingAt(state: GameState, x: number, y: number): Building | undefined {
    return state.buildings?.find((b: Building) =>
        x >= b.x && x < b.x + b.width &&
        y >= b.y && y < b.y + b.height
    );
}

/**
 * Check if player can afford building
 */
export function canAffordBuilding(inventory: Inventory, buildingType: string): boolean {
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
export function deductBuildingCost(inventory: Inventory, buildingType: string): boolean {
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
