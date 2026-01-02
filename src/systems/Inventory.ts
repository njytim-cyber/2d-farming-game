/**
 * Inventory System
 * Manages player inventory slots and item operations
 */

import { INVENTORY_SIZE, SEEDS, RESOURCE_VALUES, ITEMS as ITEM_DATA } from '../game/constants';
import { InventoryItem } from '../game/state';

type InventoryCallback = (inventory: Inventory) => void;

/**
 * Inventory Manager class
 */
export class Inventory {
    slots: (InventoryItem | null)[];
    selected: number;
    private onChangeCallbacks: InventoryCallback[];

    constructor(slots: (InventoryItem | null)[] | null = null, selected: number = 0) {
        this.slots = slots || new Array(INVENTORY_SIZE).fill(null);
        this.selected = selected;
        this.onChangeCallbacks = [];
    }

    /**
     * Subscribe to inventory changes
     */
    onChange(callback: InventoryCallback): () => void {
        this.onChangeCallbacks.push(callback);
        return () => {
            const idx = this.onChangeCallbacks.indexOf(callback);
            if (idx > -1) this.onChangeCallbacks.splice(idx, 1);
        };
    }

    /**
     * Notify listeners of change
     */
    notifyChange() {
        this.onChangeCallbacks.forEach(cb => cb(this));
    }

    /**
     * Add item to inventory
     * @param {string} name - Item name
     * @param {number} count - Number to add
     * @returns {boolean} Whether add was successful
     */
    addItem(name: string, count: number = 1): boolean {
        // First try to stack with existing
        for (const slot of this.slots) {
            if (slot && slot.name === name) {
                slot.count += count;
                this.notifyChange();
                return true;
            }
        }

        // Find empty slot
        for (let i = 0; i < this.slots.length; i++) {
            if (!this.slots[i]) {
                this.slots[i] = { name, count };
                this.notifyChange();
                return true;
            }
        }

        return false; // Inventory full
    }

    /**
     * Remove item from inventory
     * @param {string} name - Item name
     * @param {number} count - Number to remove
     * @returns {boolean} Whether removal was successful
     */
    removeItem(name: string, count: number = 1): boolean {
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            if (slot && slot.name === name) {
                slot.count -= count;
                if (slot.count <= 0) {
                    this.slots[i] = null;
                }
                this.notifyChange();
                return true;
            }
        }
        return false;
    }

    /**
     * Remove item from specific slot
     * @param {number} slotIndex 
     * @param {number} count 
     */
    removeFromSlot(slotIndex: number, count: number = 1): boolean {
        const slot = this.slots[slotIndex];
        if (slot) {
            slot.count -= count;
            if (slot.count <= 0) {
                this.slots[slotIndex] = null;
            }
            this.notifyChange();
            return true;
        }
        return false;
    }

    /**
     * Get selected slot
     */
    getSelectedItem(): InventoryItem | null {
        return this.slots[this.selected];
    }

    /**
     * Select a slot
     */
    selectSlot(index: number) {
        if (index >= 0 && index < this.slots.length) {
            this.selected = index;
            this.notifyChange();
        }
    }

    /**
     * Check if inventory has item
     */
    hasItem(name: string): boolean {
        return this.slots.some(slot => slot && slot.name === name);
    }

    /**
     * Get count of specific item
     */
    getItemCount(name: string): number {
        let total = 0;
        for (const slot of this.slots) {
            if (slot && slot.name === name) {
                total += slot.count;
            }
        }
        return total;
    }

    /**
     * Alias for getItemCount (used by CookingModal)
     */
    countItem(name: string): number {
        return this.getItemCount(name);
    }

    /**
     * Check if inventory is full
     */
    isFull(): boolean {
        return !this.slots.some(slot => slot === null);
    }

    /**
     * Get readable name for key
     */
    static getName(key: string): string {
        if (!key) return '';
        if (ITEM_DATA[key]) return ITEM_DATA[key].name;
        if (SEEDS[key]) return SEEDS[key].name;
        if (key.endsWith('_seed')) {
            const base = key.replace('_seed', '');
            if (SEEDS[base]) return SEEDS[base].name + ' Seeds';
        }

        // Capitalize default
        return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
    }

    /**
     * Get icon for item
     */
    static getIcon(name: string): string {
        const lower = name.toLowerCase();
        if (lower === 'wood') return '🪵';
        if (lower === 'stone') return '🪨';
        if (lower === 'ore') return '💎';
        if (lower.includes('sword')) return '🗡️';
        if (lower.includes('pickaxe')) return '⛏️';
        if (lower.includes('axe')) return '🪓';
        if (lower.includes('hoe')) return '锄'; // or something else

        if (lower.includes('turnip')) return '🥔';
        if (lower.includes('radish')) return '🥗';
        if (lower.includes('wheat')) return '🌾';
        if (lower.includes('carrot')) return '🥕';
        if (lower.includes('corn')) return '🌽';
        if (lower.includes('potato')) return '🥔';
        if (lower.includes('tomato')) return '🍅';
        if (lower.includes('eggplant')) return '🍆';
        if (lower.includes('strawb')) return '🍓';
        if (lower.includes('pepper')) return '🫑';
        if (lower.includes('onion')) return '🧅';
        if (lower.includes('grape')) return '🍇';
        if (lower.includes('melon')) return '🍉';
        if (lower.includes('pump')) return '🎃';
        if (lower.includes('pine')) return '🍍';
        if (lower.includes('apple')) return lower.endsWith('_seed') ? '🌱' : '🍎';
        if (lower.includes('orange')) return lower.endsWith('_seed') ? '🌱' : '🍊';
        if (lower.includes('cherry')) return lower.endsWith('_seed') ? '🌱' : '🍒';
        if (lower.includes('peach')) return lower.endsWith('_seed') ? '🌱' : '🍑';

        return lower.endsWith('_seed') ? '🌰' : '🥗';
    }

    /**
     * Get sell value of item
     */
    static getSellValue(name: string): number {
        // Check if it's a crop
        if (SEEDS[name]) {
            return SEEDS[name].sell;
        }
        // Check items
        if (ITEM_DATA[name]) {
            return ITEM_DATA[name].sell;
        }
        // Check resources
        if (RESOURCE_VALUES[name]) {
            return RESOURCE_VALUES[name];
        }
        return 0;
    }

    /**
     * Serialize inventory for save
     */
    serialize(): { slots: (InventoryItem | null)[], selected: number } {
        return {
            slots: this.slots,
            selected: this.selected
        };
    }

    /**
     * Load from serialized data
     */
    static deserialize(data: { slots: (InventoryItem | null)[], selected: number }): Inventory {
        return new Inventory(data.slots, data.selected);
    }
}

export default Inventory;
