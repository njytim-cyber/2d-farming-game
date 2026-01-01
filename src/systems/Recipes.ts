/**
 * Crafting and Cooking Recipes
 * Recipe-based item transformation system
 */

import { Inventory } from './Inventory';
import { TimeSystem } from './TimeSystem';

interface Recipe {
    name: string;
    inputs: Record<string, number>;
    output: string;
    outputCount: number;
    category: string;
    requiredStation: string;
}

interface Buff {
    type: string;
    duration: number;
    value: number;
}

interface Consumable {
    energy: number;
    sell: number;
    icon: string;
    buff?: Buff;
}

interface BuffType {
    name: string;
    description: string;
    icon: string;
    color: string;
}

// Recipe definitions
export const RECIPES: Record<string, Recipe> = {
    // === Basic Cooking ===
    turnip_soup: {
        name: 'Turnip Soup',
        inputs: { turnip: 2 },
        output: 'turnip_soup',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },
    potato_salad: {
        name: 'Potato Salad',
        inputs: { potato: 2, turnip: 1 },
        output: 'potato_salad',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },
    veggie_stir_fry: {
        name: 'Veggie Stir Fry',
        inputs: { bokchoy: 2, pepper: 1 },
        output: 'veggie_stir_fry',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },

    // === Fruit Dishes ===
    berry_smoothie: {
        name: 'Berry Smoothie',
        inputs: { blueberry: 2, strawb: 1 },
        output: 'berry_smoothie',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },
    fruit_salad: {
        name: 'Fruit Salad',
        inputs: { apple: 1, orange: 1, cherry: 1 },
        output: 'fruit_salad',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },
    melon_sorbet: {
        name: 'Melon Sorbet',
        inputs: { melon: 2 },
        output: 'melon_sorbet',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },
    peach_cobbler: {
        name: 'Peach Cobbler',
        inputs: { peach: 2, wheat: 1 },
        output: 'peach_cobbler',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },

    // === Advanced Dishes ===
    pumpkin_pie: {
        name: 'Pumpkin Pie',
        inputs: { pump: 2, wheat: 1 },
        output: 'pumpkin_pie',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },
    spicy_pepper_dish: {
        name: 'Spicy Pepper Dish',
        inputs: { pepper: 3 },
        output: 'spicy_pepper_dish',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },
    starfruit_deluxe: {
        name: 'Starfruit Deluxe',
        inputs: { starfruit: 1, melon: 1 },
        output: 'starfruit_deluxe',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },
    cranberry_sauce: {
        name: 'Cranberry Sauce',
        inputs: { cranberry: 3 },
        output: 'cranberry_sauce',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },
    grape_juice: {
        name: 'Fresh Grape Juice',
        inputs: { grape: 3 },
        output: 'grape_juice',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },

    // === Seasonal Specials ===
    spring_salad: {
        name: 'Spring Salad',
        inputs: { radish: 1, kale: 1, parsnip: 1 },
        output: 'spring_salad',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },
    summer_feast: {
        name: 'Summer Feast',
        inputs: { tomato: 2, corn: 2 },
        output: 'summer_feast',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },
    fall_harvest_bowl: {
        name: 'Fall Harvest Bowl',
        inputs: { eggplant: 1, yam: 1, beet: 1 },
        output: 'fall_harvest_bowl',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },
    winter_root_stew: {
        name: 'Winter Root Stew',
        inputs: { winterroot: 2, snowyam: 1 },
        output: 'winter_root_stew',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },

    // === Flower Teas (Special Buffs) ===
    tulip_tea: {
        name: 'Tulip Tea',
        inputs: { tulip: 2 },
        output: 'tulip_tea',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },
    rose_tea: {
        name: 'Rose Tea',
        inputs: { rose: 2 },
        output: 'rose_tea',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },
    lavender_tea: {
        name: 'Lavender Tea',
        inputs: { lavender: 2 },
        output: 'lavender_tea',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    }
};

// Consumable effects (food items that can be eaten)
export const CONSUMABLES: Record<string, Consumable> = {
    // === Basic Cooked Foods ===
    turnip_soup: { energy: 30, sell: 45, icon: '🍲' },
    potato_salad: { energy: 50, sell: 80, icon: '🥗' },
    veggie_stir_fry: { energy: 60, sell: 100, icon: '🍳' },

    // === Fruit Dishes (Speed Buffs) ===
    berry_smoothie: {
        energy: 40, sell: 90, icon: '🥤',
        buff: { type: 'speedBoost', duration: 60, value: 1.3 }
    },
    fruit_salad: {
        energy: 80, sell: 150, icon: '🍇',
        buff: { type: 'maxHpBoost', duration: 180, value: 20 }
    },
    melon_sorbet: { energy: 120, sell: 280, icon: '🍨' },
    peach_cobbler: {
        energy: 90, sell: 200, icon: '🥧',
        buff: { type: 'energySaver', duration: 120, value: 0.5 }
    },

    // === Advanced Dishes ===
    pumpkin_pie: {
        energy: 100, sell: 350, icon: '🥧',
        buff: { type: 'energySaver', duration: 180, value: 0.5 }
    },
    spicy_pepper_dish: {
        energy: 50, sell: 60, icon: '🌶️',
        buff: { type: 'speedBoost', duration: 90, value: 1.5 }
    },
    starfruit_deluxe: {
        energy: 150, sell: 500, icon: '⭐',
        buff: { type: 'maxHpBoost', duration: 300, value: 50 }
    },
    cranberry_sauce: { energy: 70, sell: 120, icon: '🫐' },
    grape_juice: {
        energy: 45, sell: 100, icon: '🍇',
        buff: { type: 'speedBoost', duration: 45, value: 1.2 }
    },

    // === Seasonal Specials ===
    spring_salad: {
        energy: 55, sell: 90, icon: '🥬',
        buff: { type: 'harvestBoost', duration: 120, value: 1.5 }
    },
    summer_feast: {
        energy: 85, sell: 140, icon: '🌽',
        buff: { type: 'speedBoost', duration: 60, value: 1.4 }
    },
    fall_harvest_bowl: {
        energy: 95, sell: 180, icon: '🍂',
        buff: { type: 'maxHpBoost', duration: 240, value: 30 }
    },
    winter_root_stew: {
        energy: 110, sell: 160, icon: '🥘',
        buff: { type: 'energySaver', duration: 150, value: 0.4 }
    },

    // === Flower Teas ===
    tulip_tea: {
        energy: 25, sell: 40, icon: '🍵',
        buff: { type: 'speedBoost', duration: 30, value: 1.2 }
    },
    rose_tea: {
        energy: 30, sell: 80, icon: '🍵',
        buff: { type: 'maxHpBoost', duration: 120, value: 15 }
    },
    lavender_tea: {
        energy: 35, sell: 100, icon: '🍵',
        buff: { type: 'energySaver', duration: 90, value: 0.6 }
    }
};

// Active buffs that foods can grant
export const BUFF_TYPES: Record<string, BuffType> = {
    energySaver: {
        name: 'Energy Saver',
        description: 'Energy costs reduced',
        icon: '⚡',
        color: '#ffeb3b'
    },
    speedBoost: {
        name: 'Speed Boost',
        description: 'Movement speed increased',
        icon: '💨',
        color: '#4fc3f7'
    },
    maxHpBoost: {
        name: 'Fortified',
        description: 'Max HP temporarily increased',
        icon: '❤️',
        color: '#ef5350'
    },
    harvestBoost: {
        name: 'Green Thumb',
        description: 'Better harvest yields',
        icon: '🌿',
        color: '#66bb6a'
    }
};

/**
 * Check if player can craft a recipe
 */
export function canCraft(inventory: Inventory, recipeKey: string): boolean {
    const recipe = RECIPES[recipeKey];
    if (!recipe) return false;

    for (const [item, count] of Object.entries(recipe.inputs)) {
        // Find slot manually as Inventory might need specific lookup
        const slot = inventory.slots.find(s => s?.name === item);
        if (!slot || slot.count < count) {
            return false;
        }
    }
    return true;
}

/**
 * Craft a recipe
 */
export function craft(inventory: Inventory, recipeKey: string): boolean {
    const recipe = RECIPES[recipeKey];
    if (!recipe || !canCraft(inventory, recipeKey)) {
        return false;
    }

    // Remove inputs
    for (const [item, count] of Object.entries(recipe.inputs)) {
        const slotIdx = inventory.slots.findIndex(s => s?.name === item);
        if (slotIdx !== -1) {
            inventory.removeFromSlot(slotIdx, count);
        }
    }

    // Add output
    inventory.addItem(recipe.output, recipe.outputCount);
    return true;
}

/**
 * Consume a food item
 * @returns {object|null} Buff if granted, or null
 */
export function consumeFood(inventory: Inventory, timeSystem: TimeSystem, slotIndex: number): Buff | null {
    const item = inventory.slots[slotIndex];
    if (!item) return null;

    const consumable = CONSUMABLES[item.name];
    if (!consumable) return null;

    // Restore energy
    timeSystem.energy = Math.min(
        timeSystem.energy + consumable.energy,
        timeSystem.maxEnergy
    );

    // Remove one item
    inventory.removeFromSlot(slotIndex, 1);

    // Return buff if any
    return consumable.buff || null;
}

/**
 * Get available recipes for a station type
 */
export function getRecipesForStation(stationType: string): (Recipe & { key: string })[] {
    return Object.entries(RECIPES)
        .filter(([, recipe]) => recipe.requiredStation === stationType)
        .map(([key, recipe]) => ({ key, ...recipe }));
}

export default {
    RECIPES,
    CONSUMABLES,
    BUFF_TYPES,
    canCraft,
    craft,
    consumeFood,
    getRecipesForStation
};
