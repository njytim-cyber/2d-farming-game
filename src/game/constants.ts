/**
 * Game Constants and Configuration
 * All magic numbers and game data in one place
 */

// === Types ===
export interface Palette {
    [key: string]: string;
}

export interface CropConfig {
    name: string;
    cost: number;
    sell: number;
    grow: number;
    color: string;
    seasons: number[];
    regrowable?: boolean;
    regrowStage?: number;
    isFlower?: boolean;
    isTrellis?: boolean;
    isSolid?: boolean;
    isTree?: boolean;
    regrow?: number;
}

export interface ItemConfig {
    name: string;
    type: string;
    attack: number;
    cost: number;
    sell: number;
}

export interface ResourceYield {
    [key: string]: number;
}

export interface ResourceConfig {
    toughness: number;
    yield: ResourceYield;
    energyCost: number;
    color: string;
    name: string;
}

export interface TileMap {
    [key: string]: number;
}

// === Rendering ===
export const TILE_SIZE = 50;
export const MOVEMENT_SPEED = 400; // Pixels per second

// === Map ===
export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 40;

// === Storage ===
export const SAVE_KEY = 'farming_sim_rpg_v12';
export const GAME_VERSION = '1.2.1';
export const AUTO_SAVE_INTERVAL = 10000; // 10 seconds

// === Time ===
export const DAY_LENGTH = 24000; // frames
export const DAY_START_HOUR = 6;  // 6:00 AM
export const DAY_DURATION_HOURS = 20; // 6AM to 2AM

// === Energy Costs ===
export const ENERGY_COST: { [key: string]: number } = {
    CHOP_TREE: 8,
    MINE_STONE: 8,
    TILL_SOIL: 4,
    PLANT: 2,
    HARVEST: 3
};

// === Palette (Normalized Endesga-style) ===
export const PALETTE: Palette = {
    grass: '#7dbb6f',
    grass_dark: '#5a9653',
    soil: '#96745f',
    soil_dark: '#6e5140',
    water: '#6ba9cc',
    water_dark: '#4c86a8',
    stone: '#a1a1a1',
    stone_dark: '#757575',
    wood: '#755a4a',
    wood_dark: '#4e3d34',
    leaf_light: '#a3c26d',
    leaf_dark: '#3e6b34',
    sky_day: '#91d9ef',
    sky_night: '#1a1c2c',
    highlight: '#fcecb0',
    white: '#ffffff',
    black: '#121212',
    red: '#be4a2f',
    orange: '#d9a066',
    yellow: '#eec39a',
    purple: '#76428a'
};

export const PALETTE_COZY: Palette = {
    warm_oak: '#D9B382',
    honey_wood: '#CCA670',
    dark_chocolate: '#5D4037',
    cream: '#F5F5DC',
    deep_crimson: '#880E4F',
    gold: '#FFD700',
    cerulean_deep: '#0277BD',
    stove_glow: '#FF5722'
};

// === Colors ===
export const COLORS = {
    skin: [PALETTE.yellow, '#f1c27d', '#e0ac69', '#8d5524', '#c68642'],
    hair: [PALETTE.orange, PALETTE.wood, PALETTE.black, PALETTE.red, '#b55239', PALETTE.stone],
    shirt: [PALETTE.red, PALETTE.water, PALETTE.grass, PALETTE.highlight, PALETTE.purple, PALETTE.white],
    pants: PALETTE.water_dark
};

export const HAIR_STYLES = 3; // 0: short, 1: long, 2: bald

// === Seasons ===
export const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
export const SEASON_ICONS = ['🌸', '☀️', '🍂', '❄️'];
export const DAYS_PER_SEASON = 28;

export const SHOP_TABS = [
    { id: 'seeds', name: 'Seeds', icon: '🌱' },
    { id: 'animals', name: 'Animals', icon: '🐄' },
    { id: 'tools', name: 'Tools', icon: '⚒️' },
    { id: 'guild', name: 'Guild', icon: '⚔️' }
];

export const SEASON_COLORS: { [key: string]: { grass: string; grass_light?: string; grass_dark?: string; tree: string } } = {
    Spring: {
        grass: '#7caf7e',          // Muted Base
        grass_light: '#8fb990',    // Slightly lighter
        grass_dark: '#6a9e6c',     // Slightly darker
        tree: PALETTE.leaf_dark
    },
    Summer: { grass: '#88bc7b', grass_light: '#aedd9b', grass_dark: '#558b2f', tree: '#46833b' },
    Fall: { grass: '#b1a569', grass_light: '#dce775', grass_dark: '#827717', tree: '#9e4539' },
    Winter: { grass: '#c0d1d4', grass_light: '#e0f7fa', grass_dark: '#90a4ae', tree: '#5a7d87' }
};

// === Weather ===
export const WEATHER_TYPES = ['Sunny', 'Rain'];
export const RAIN_CHANCE = 0.2;

// === Tile Types ===
export const TILES: TileMap = {
    GRASS: 0,
    SOIL: 1,
    TREE: 2,
    HOUSE: 3,
    SHOP: 4,
    STONE: 5,
    WITHERED: 6, // Dead crop debris
    OLD_HOUSE: 7, // 8x4 building
    TREE_OAK: 8,
    STONE_ORE: 9,
    STONE_BOULDER: 10,
    COOP: 11,
    BARN: 12,
    CAVE: 13,
    DUNGEON_FLOOR: 14,
    DUNGEON_WALL: 15,
    DUNGEON_STAIRS: 16,
    // Town Expansion
    TOWN_HOUSE: 20,
    LIBRARY: 21,
    SCHOOL: 22,
    TAVERN: 23,
    BLACKSMITH: 24,
    CLINIC: 25,
    MAYOR_HOUSE: 26,
    CHURCH: 27,
    FOUNTAIN: 28,
    ROAD: 29,

    // Future Expansion (Phase 1-3)
    TAILOR: 30,
    GUILD: 31,
    BANK: 32,
    WINDMILL: 33,
    MUSEUM: 34,

    // Town Decorations
    FLOWER_BED: 40,
    HEDGE: 41,
    LAMP: 42,
    BENCH: 43,
    GARDEN: 44,
    WELL: 45
};

// === Interior Tile Types ===
export const INTERIOR_TILES: TileMap = {
    FLOOR: 10,
    WALL: 11,
    DOOR: 12,
    BED: 13,
    TABLE: 14,
    RUG: 15,
    STOVE: 16,
    CHEST: 17,
    COUNTER: 18,
    SHELF: 19,
    PLANT: 20,
    TV: 21,
    COUCH: 22,
    CHAIR: 23,
    BASKET: 24,  // Egg collection
    PAIL: 25     // Milk collection
};

// === Seeds & Crops ===
// Seasons: 0=Spring, 1=Summer, 2=Fall, 3=Winter
export const SEEDS: { [key: string]: CropConfig } = {
    // =====================
    // === SPRING CROPS ===
    // =====================
    turnip: { name: 'Turnip', cost: 20, sell: 35, grow: 0.5, color: '#f8f8ff', seasons: [0] },
    radish: { name: 'Radish', cost: 25, sell: 45, grow: 0.45, color: '#ffcdd2', seasons: [0] },
    parsnip: { name: 'Parsnip', cost: 20, sell: 35, grow: 0.4, color: '#fff8e1', seasons: [0] },
    cauliflower: { name: 'Cauliflower', cost: 80, sell: 175, grow: 0.15, color: '#f5f5f5', seasons: [0] },
    potato: { name: 'Potato', cost: 50, sell: 80, grow: 0.3, color: '#d7ccc8', seasons: [0] },
    kale: { name: 'Kale', cost: 70, sell: 110, grow: 0.25, color: '#558b2f', seasons: [0] },
    tulip: { name: 'Tulip', cost: 20, sell: 30, grow: 0.28, color: '#ff5722', isFlower: true, seasons: [0] },
    bluejazz: { name: 'Blue Jazz', cost: 30, sell: 50, grow: 0.25, color: '#42a5f5', isFlower: true, seasons: [0] },

    // =====================
    // === SUMMER CROPS ===
    // =====================
    tomato: { name: 'Tomato', cost: 50, sell: 60, grow: 0.25, color: '#f44336', regrowable: true, regrowStage: 60, seasons: [1] },
    melon: { name: 'Melon', cost: 80, sell: 250, grow: 0.1, color: '#81c784', seasons: [1] },
    blueberry: { name: 'Blueberry', cost: 80, sell: 50, grow: 0.22, color: '#3f51b5', regrowable: true, regrowStage: 55, seasons: [1] },
    pepper: { name: 'Hot Pepper', cost: 40, sell: 40, grow: 0.2, color: '#ff5252', regrowable: true, regrowStage: 55, seasons: [1] },
    redcab: { name: 'Red Cabbage', cost: 100, sell: 260, grow: 0.12, color: '#7b1fa2', seasons: [1] },
    starfruit: { name: 'Starfruit', cost: 400, sell: 750, grow: 0.06, color: '#fdd835', seasons: [1] },
    sunflower: { name: 'Sunflower', cost: 200, sell: 80, grow: 0.2, color: '#ffeb3b', isFlower: true, seasons: [1, 2] },
    poppy: { name: 'Poppy', cost: 100, sell: 140, grow: 0.18, color: '#ef5350', isFlower: true, seasons: [1] },

    // =====================
    // === FALL CROPS ===
    // =====================
    eggplant: { name: 'Eggplant', cost: 20, sell: 60, grow: 0.25, color: '#673ab7', regrowable: true, regrowStage: 55, seasons: [2] },
    pump: { name: 'Pumpkin', cost: 100, sell: 320, grow: 0.08, color: '#e65100', seasons: [2] },
    yam: { name: 'Yam', cost: 60, sell: 160, grow: 0.15, color: '#ff7043', seasons: [2] },
    cranberry: { name: 'Cranberry', cost: 240, sell: 75, grow: 0.18, color: '#c62828', regrowable: true, regrowStage: 60, seasons: [2] },
    beet: { name: 'Beet', cost: 20, sell: 100, grow: 0.25, color: '#880e4f', seasons: [2] },
    bokchoy: { name: 'Bok Choy', cost: 50, sell: 80, grow: 0.3, color: '#66bb6a', seasons: [2] },
    grape: { name: 'Grape', cost: 60, sell: 80, grow: 0.15, color: '#9c27b0', isTrellis: true, isSolid: true, regrowable: true, regrowStage: 55, seasons: [2] },
    fairyrose: { name: 'Fairy Rose', cost: 200, sell: 290, grow: 0.1, color: '#f48fb1', isFlower: true, seasons: [2] },

    // =====================
    // === WINTER CROPS ===
    // =====================
    winterroot: { name: 'Winter Root', cost: 0, sell: 70, grow: 0.2, color: '#bcaaa4', seasons: [3] },
    snowyam: { name: 'Snow Yam', cost: 0, sell: 100, grow: 0.15, color: '#e0e0e0', seasons: [3] },
    crocus: { name: 'Crocus', cost: 60, sell: 60, grow: 0.25, color: '#ce93d8', isFlower: true, seasons: [3] },

    // ==============================
    // === MULTI-SEASON CROPS ===
    // ==============================
    // Spring → Summer
    strawb: { name: 'Strawberry', cost: 100, sell: 120, grow: 0.2, color: '#e91e63', regrowable: true, regrowStage: 65, seasons: [0, 1] },
    wheat: { name: 'Wheat', cost: 10, sell: 25, grow: 0.4, color: '#e6c35c', seasons: [0, 1] },

    // Summer → Fall
    corn: { name: 'Corn', cost: 150, sell: 50, grow: 0.2, color: '#ff9800', regrowable: true, regrowStage: 50, seasons: [1, 2] },
    hops: { name: 'Hops', cost: 60, sell: 25, grow: 0.18, color: '#8bc34a', isTrellis: true, isSolid: true, regrowable: true, regrowStage: 50, seasons: [1, 2] },

    // All-Season Flowers
    rose: { name: 'Rose', cost: 50, sell: 75, grow: 0.25, color: '#e91e63', isFlower: true, seasons: [0, 1, 2] },
    lavender: { name: 'Lavender', cost: 60, sell: 90, grow: 0.2, color: '#7e57c2', isFlower: true, seasons: [0, 1, 2] },

    // =====================
    // === FRUIT TREES ===
    // =====================
    // Trees grow in any season once planted
    apple: { name: 'Apple Tree', cost: 1000, sell: 100, grow: 0.03, color: '#e53935', isTree: true, regrow: 50, seasons: [0, 1, 2, 3] },
    orange: { name: 'Orange Tree', cost: 1000, sell: 100, grow: 0.03, color: '#ff9800', isTree: true, regrow: 50, seasons: [0, 1, 2, 3] },
    cherry: { name: 'Cherry Tree', cost: 1400, sell: 80, grow: 0.025, color: '#880e4f', isTree: true, regrow: 50, seasons: [0, 1, 2, 3] },
    peach: { name: 'Peach Tree', cost: 1500, sell: 140, grow: 0.025, color: '#ffab91', isTree: true, regrow: 50, seasons: [0, 1, 2, 3] }
};

// === Items ===
export const ITEMS: { [key: string]: ItemConfig } = {
    WOODEN_SWORD: { name: 'Wooden Sword', type: 'weapon', attack: 5, cost: 0, sell: 10 },
    IRON_SWORD: { name: 'Iron Sword', type: 'weapon', attack: 10, cost: 500, sell: 100 },
    GOLD_SWORD: { name: 'Gold Sword', type: 'weapon', attack: 20, cost: 2000, sell: 400 },
    POTION: { name: 'Health Potion', type: 'consumable', attack: 0, cost: 100, sell: 25 },

    PICKAXE: { name: 'Pickaxe', type: 'tool', attack: 2, cost: 100, sell: 25 },
    AXE: { name: 'Axe', type: 'tool', attack: 2, cost: 100, sell: 25 },
    HOE: { name: 'Hoe', type: 'tool', attack: 1, cost: 50, sell: 15 },
    EGG: { name: 'Egg', type: 'produce', attack: 0, cost: 0, sell: 50 },
    MILK: { name: 'Milk', type: 'produce', attack: 0, cost: 0, sell: 125 }
};

// === NPCs ===
export const NPC_IDS = {
    OLD_MAN: 'old_man',
    SHOPKEEPER: 'shopkeeper',
    CREEP: 'creep'
};

// === Creeps ===
export const CREEP_TYPES = {
    SLIME: { name: 'Slime', hp: 20, attack: 2, speed: 0.5, color: '#4caf50' },
    BAT: { name: 'Bat', hp: 15, attack: 3, speed: 0.8, color: '#7e57c2' },
    SKELETON: { name: 'Skeleton', hp: 35, attack: 5, speed: 0.4, color: '#eeeeee' },
    GHOST: { name: 'Ghost', hp: 25, attack: 4, speed: 0.6, color: '#b2ebf2' },
    BUG: { name: 'Cave Bug', hp: 10, attack: 1, speed: 1.0, color: '#ffa726' }
};

// === Resource Values ===
export const RESOURCE_VALUES: { [key: string]: number } = {
    wood: 5,
    stone: 8
};

// === Resource Types (Variable HP/Yield) ===
export const RESOURCE_TYPES: { [key: string]: ResourceConfig } = {
    // Trees
    TREE: { toughness: 1, yield: { wood: 3 }, energyCost: 4, color: PALETTE.leaf_dark, name: 'Tree' },
    OAK: { toughness: 3, yield: { wood: 10 }, energyCost: 8, color: PALETTE.leaf_dark, name: 'Oak Tree' },
    SHRUB: { toughness: 1, yield: { wood: 2 }, energyCost: 2, color: PALETTE.grass_dark, name: 'Shrub' },
    // Rocks
    STONE: { toughness: 1, yield: { stone: 2 }, energyCost: 4, color: PALETTE.stone, name: 'Stone' },
    BOULDER: { toughness: 3, yield: { stone: 8 }, energyCost: 10, color: PALETTE.stone_dark, name: 'Boulder' },
    ORE: { toughness: 2, yield: { stone: 3, ore: 2 }, energyCost: 6, color: PALETTE.orange, name: 'Ore Deposit' }
};

// === Inventory ===
export const INVENTORY_SIZE = 10;
export const STARTING_MONEY = 100;
export const STARTING_ENERGY = 300;
export const MAX_ENERGY = 300;

// === Map Generation ===
export const MAP_GEN = {
    TREE_CHANCE: 0.12,
    STONE_CHANCE: 0.15, // cumulative, so actual is 0.03
    CLEAR_RADIUS: 3     // clear area around spawn
};
