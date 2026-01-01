/**
 * Game State Management
 * Centralized reactive state with pub/sub pattern
 */

import {
    COLORS,
    MAP_WIDTH,
    MAP_HEIGHT,
    TILE_SIZE,
    INVENTORY_SIZE,
    STARTING_MONEY,
    STARTING_ENERGY,
    MAX_ENERGY,
    DAY_LENGTH
} from './constants.js';

/**
 * Create the initial game state
 */
export function createInitialState() {
    return {
        screen: 'CREATOR', // CREATOR, GAME, SHOP, HOUSE
        zoom: 1.0,
        camera: { x: 0, y: 0 },

        // Scene Management
        currentMap: 'overworld',  // 'overworld', 'houseInterior', 'shopInterior'
        lastOverworldPos: null,   // { x, y } saved when entering interior
        interiors: {},            // Cached interior maps

        map: [],
        player: {
            gridX: Math.floor(MAP_WIDTH / 2),
            gridY: Math.floor(MAP_HEIGHT / 2),
            visX: Math.floor(MAP_WIDTH / 2) * TILE_SIZE,
            visY: Math.floor(MAP_HEIGHT / 2) * TILE_SIZE,
            isMoving: false,
            facing: { x: 0, y: 1 },
            skinColor: COLORS.skin[0],
            hairColor: COLORS.hair[1],
            shirtColor: COLORS.shirt[1],
            hairStyle: 0,
            name: 'Farmer',
            gender: 'male'
        },
        destination: null,
        crops: {},
        inventory: {
            slots: new Array(INVENTORY_SIZE).fill(null),
            selected: 0
        },
        money: STARTING_MONEY,
        energy: STARTING_ENERGY,
        maxEnergy: MAX_ENERGY,
        dayTime: 0,
        dayLength: DAY_LENGTH,
        dayCount: 1,
        season: 0,
        weather: 'Sunny',
        messages: [],

        // Resource HP tracking (for variable resources)
        resourceHP: {},

        // NPCs
        npcs: [],

        // Construction & Animals
        buildings: [],          // Placed buildings
        animals: [],            // Farm animals

        // Crafting & Buffs
        activeBuffs: []         // { type, duration, startTime }
    };
}

/**
 * State subscribers for reactive updates
 */
const subscribers = new Set();

/**
 * The game state singleton
 */
let state = createInitialState();

/**
 * Get the current game state
 */
export function getState() {
    return state;
}

/**
 * Update state with partial changes
 * @param {Partial<typeof state>} updates - State updates
 */
export function setState(updates) {
    state = { ...state, ...updates };
    notifySubscribers();
}

/**
 * Replace entire state (used for loading saves)
 * @param {typeof state} newState - Complete state
 */
export function replaceState(newState) {
    state = newState;
    notifySubscribers();
}

/**
 * Reset state to initial values
 */
export function resetState() {
    state = createInitialState();
    notifySubscribers();
}

/**
 * Subscribe to state changes
 * @param {Function} callback - Callback when state changes
 * @returns {Function} Unsubscribe function
 */
export function subscribe(callback) {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
}

/**
 * Notify all subscribers of state change
 */
function notifySubscribers() {
    subscribers.forEach(cb => cb(state));
}

/**
 * Deep merge for nested state updates
 * @param {object} target 
 * @param {object} source 
 */
export function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
}

export default {
    getState,
    setState,
    replaceState,
    resetState,
    subscribe,
    createInitialState
};
