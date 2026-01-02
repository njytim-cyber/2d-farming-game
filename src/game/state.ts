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
} from './constants';

export interface Position {
    x: number;
    y: number;
}

export interface Player {
    gridX: number;
    gridY: number;
    visX: number;
    visY: number;
    isMoving: boolean;
    facing: Position;
    skinColor: string;
    hairColor: string;
    shirtColor: string;
    hairStyle: number;
    name: string;
    gender: 'male' | 'female';
    questFlags?: Record<string, boolean>;
    hp: number;
    maxHp: number;
    equipment: Record<string, any>;
    activeBuffs: any[]; // Define clearer type later
}

export interface InventoryItem {
    name: string;
    count: number;
    // Add other item properties as needed
}

export interface Inventory {
    slots: (InventoryItem | null)[];
    selected: number;
}

export interface Message {
    text: string;
    color: string;
    life: number;
}

export interface GameState {
    screen: 'CREATOR' | 'GAME' | 'SHOP' | 'HOUSE' | 'COOKING';
    zoom: number;
    camera: Position;

    // Scene Management
    currentMap: string;
    lastOverworldPos: Position | null;
    interiors: Record<string, any>; // Define InteriorMap type if complex

    map: number[][];
    player: Player;
    pet?: any | null; // Define Pet type properly if possible, avoiding circular dep
    destination: Position | null;
    crops: Record<string, any>; // Define Crop type
    inventory: Inventory;
    money: number;
    energy: number;
    maxEnergy: number;
    dayTime: number;
    dayLength: number;
    dayCount: number;
    season: number;
    weather: 'Sunny' | 'Rain';
    messages: Message[];

    // Resource HP tracking
    resourceHP: Record<string, number>;

    // NPCs
    npcs: any[]; // Define NPC type

    // Construction & Animals
    buildings: any[];
    animals: any[];

    // Crafting & Buffs
    activeBuffs: any[];
}

/**
 * Create the initial game state
 */
export function createInitialState(): GameState {
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
            gender: 'male',
            hp: 100,
            maxHp: 100,
            equipment: {},
            activeBuffs: []
        },
        pet: null,
        destination: null,
        crops: {},
        inventory: {
            slots: [
                { name: 'PICKAXE', count: 1 },
                { name: 'AXE', count: 1 },
                ...new Array(INVENTORY_SIZE - 2).fill(null)
            ],
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
type StateCallback = (state: GameState) => void;
const subscribers = new Set<StateCallback>();

/**
 * The game state singleton
 */
let state: GameState = createInitialState();

/**
 * Get the current game state
 */
export function getState(): GameState {
    return state;
}

/**
 * Update state with partial changes
 * @param {Partial<GameState>} updates - State updates
 */
export function setState(updates: Partial<GameState>) {
    state = { ...state, ...updates };
    notifySubscribers();
}

/**
 * Replace entire state (used for loading saves)
 * @param {GameState} newState - Complete state
 */
export function replaceState(newState: GameState) {
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
export function subscribe(callback: StateCallback) {
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
export function deepMerge(target: any, source: any): any {
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
