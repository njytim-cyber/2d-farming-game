/**
 * Crop Entity
 * Handles crop growth and harvesting
 */

import { SEEDS, CropConfig } from '../game/constants';

export class Crop {
    type: string;
    x: number;
    y: number;
    stage: number;
    data: CropConfig;
    withered: boolean;

    constructor(type: string, x: number, y: number, stage: number = 0) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.stage = stage;
        this.data = SEEDS[type];
        this.withered = false; // Initialize to false (though logic usually handles this on season check)
    }

    /**
     * Get crop key for state storage
     */
    get key(): string {
        return `${this.x},${this.y}`;
    }

    /**
     * Update crop growth
     */
    update() {
        if (this.stage < 100) {
            this.stage += this.data.grow;
        }
    }

    /**
     * Check if crop is fully grown
     */
    isHarvestable(): boolean {
        return this.stage >= 100;
    }

    /**
     * Check if this is a fruit tree
     */
    isTree(): boolean {
        return this.data.isTree === true;
    }

    /**
     * Get growth progress (0-1)
     */
    getGrowthProgress(): number {
        return Math.min(this.stage / 100, 1);
    }

    /**
     * Reset tree to regrow state after harvest
     */
    resetForRegrow() {
        if (this.isTree()) {
            this.stage = this.data.regrow || 50;
        }
    }

    /**
     * Get sell value
     */
    getSellValue(): number {
        return this.data.sell;
    }

    /**
     * Serialize for save
     */
    serialize() {
        return {
            type: this.type,
            stage: this.stage
        };
    }

    /**
     * Create crop from serialized data
     */
    static deserialize(key: string, data: any): Crop {
        const [x, y] = key.split(',').map(Number);
        return new Crop(data.type, x, y, data.stage);
    }
}

/**
 * Crop Manager - handles all crops
 */
export class CropManager {
    crops: Map<string, Crop>;

    constructor() {
        this.crops = new Map();
    }

    /**
     * Add a new crop
     */
    plant(type: string, x: number, y: number): Crop {
        const crop = new Crop(type, x, y, 0);
        this.crops.set(crop.key, crop);
        return crop;
    }

    /**
     * Get crop at position
     */
    get(x: number, y: number): Crop | undefined {
        return this.crops.get(`${x},${y}`);
    }

    /**
     * Remove crop at position
     */
    remove(x: number, y: number) {
        this.crops.delete(`${x},${y}`);
    }

    /**
     * Update all crops
     */
    update() {
        for (const crop of this.crops.values()) {
            crop.update();
        }
    }

    /**
     * Serialize all crops
     */
    serialize(): Record<string, any> {
        const result: Record<string, any> = {};
        for (const [key, crop] of this.crops) {
            result[key] = crop.serialize();
        }
        return result;
    }

    /**
     * Load crops from serialized data
     */
    deserialize(data: Record<string, any>) {
        this.crops.clear();
        for (const [key, cropData] of Object.entries(data)) {
            const crop = Crop.deserialize(key, cropData);
            this.crops.set(key, crop);
        }
    }

    /**
     * Iterate over all crops
     */
    forEach(callback: (crop: Crop, key: string, map: Map<string, Crop>) => void) {
        this.crops.forEach(callback);
    }
}

export default Crop;
