/**
 * Crafting and Cooking Recipes
 * Recipe-based item transformation system
 */

// Recipe definitions
export const RECIPES = {
    // === Cooking (Food) ===
    omelet: {
        name: 'Omelet',
        inputs: { egg: 1, milk: 1 },
        output: 'omelet',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },
    salad: {
        name: 'Fresh Salad',
        inputs: { turnip: 1, carrot: 1 },
        output: 'salad',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },
    pie: {
        name: 'Apple Pie',
        inputs: { apple: 2, wheat: 1 },
        output: 'apple_pie',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },
    juice: {
        name: 'Orange Juice',
        inputs: { orange: 3 },
        output: 'orange_juice',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },
    stew: {
        name: 'Vegetable Stew',
        inputs: { potato: 2, carrot: 1, onion: 1 },
        output: 'stew',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },
    pizza: {
        name: 'Pizza',
        inputs: { wheat: 2, tomato: 1, cheese: 1 },
        output: 'pizza',
        outputCount: 1,
        category: 'cooking',
        requiredStation: 'stove'
    },

    // === Processing ===
    cheese: {
        name: 'Cheese',
        inputs: { milk: 3 },
        output: 'cheese',
        outputCount: 1,
        category: 'processing',
        requiredStation: null
    },
    flour: {
        name: 'Flour',
        inputs: { wheat: 3 },
        output: 'flour',
        outputCount: 1,
        category: 'processing',
        requiredStation: null
    },
    pickles: {
        name: 'Pickles',
        inputs: { eggplant: 2 },
        output: 'pickles',
        outputCount: 1,
        category: 'processing',
        requiredStation: null
    },
    jam: {
        name: 'Strawberry Jam',
        inputs: { strawb: 3 },
        output: 'jam',
        outputCount: 1,
        category: 'processing',
        requiredStation: null
    }
};

// Consumable effects (food items that can be eaten)
export const CONSUMABLES = {
    // Raw foods (low energy)
    turnip: { energy: 5, sell: 10 },
    carrot: { energy: 8, sell: 25 },
    potato: { energy: 6, sell: 52 },
    apple: { energy: 10, sell: 50 },
    orange: { energy: 8, sell: 55 },
    egg: { energy: 5, sell: 25 },
    milk: { energy: 8, sell: 50 },

    // Cooked foods (high energy)
    omelet: { energy: 50, sell: 80 },
    salad: { energy: 30, sell: 50 },
    apple_pie: { energy: 80, sell: 150, buff: { type: 'energySaver', duration: 120 } },
    orange_juice: { energy: 35, sell: 100 },
    stew: { energy: 70, sell: 180 },
    pizza: { energy: 90, sell: 200 },

    // Processed foods
    cheese: { energy: 25, sell: 100 },
    pickles: { energy: 20, sell: 80 },
    jam: { energy: 40, sell: 120, buff: { type: 'speedBoost', duration: 60 } }
};

// Active buffs that foods can grant
export const BUFF_TYPES = {
    energySaver: {
        name: 'Energy Saver',
        description: 'Energy costs reduced by 50%',
        multiplier: 0.5
    },
    speedBoost: {
        name: 'Speed Boost',
        description: 'Movement speed increased',
        multiplier: 1.5
    },
    luckBoost: {
        name: 'Lucky',
        description: 'Better chance for bonus drops',
        multiplier: 1.3
    }
};

/**
 * Check if player can craft a recipe
 * @param {object} inventory - Player inventory
 * @param {string} recipeKey - Recipe key from RECIPES
 * @returns {boolean}
 */
export function canCraft(inventory, recipeKey) {
    const recipe = RECIPES[recipeKey];
    if (!recipe) return false;

    for (const [item, count] of Object.entries(recipe.inputs)) {
        const slot = inventory.slots.find(s => s?.name === item);
        if (!slot || slot.count < count) {
            return false;
        }
    }
    return true;
}

/**
 * Craft a recipe
 * @param {object} inventory - Player inventory
 * @param {string} recipeKey - Recipe key from RECIPES
 * @returns {boolean} Whether crafting succeeded
 */
export function craft(inventory, recipeKey) {
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
 * @param {object} inventory - Player inventory
 * @param {object} timeSystem - Time system for energy
 * @param {number} slotIndex - Inventory slot
 * @returns {object|null} Buff if granted, or null
 */
export function consumeFood(inventory, timeSystem, slotIndex) {
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
export function getRecipesForStation(stationType) {
    return Object.entries(RECIPES)
        .filter(([key, recipe]) => recipe.requiredStation === stationType)
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
