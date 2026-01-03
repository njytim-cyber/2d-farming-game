/**
 * Animal Entity System
 * Handles animal behavior, production, and management
 */

import { TILE_SIZE } from '../game/constants';
import { isSolid } from '../systems/MapGenerator';
import { CropConfig } from '../game/constants';

interface AnimalDef {
    name: string;
    cost: number;
    product: string | null;
    productChance?: number;
    productValue?: number;
    maxFriendship?: number;
    friendshipGain?: number;
    color: string;
    size: number;
    isPet?: boolean;
    happinessBonus?: number;
}

// Animal type definitions
export const ANIMAL_TYPES: Record<string, AnimalDef> = {
    chicken: {
        name: 'Chicken',
        cost: 1,           // Testing price
        product: 'egg',
        productChance: 0.8,
        productValue: 25,
        maxFriendship: 100,
        friendshipGain: 10,
        color: '#ffffff',
        size: 0.6
    },
    cow: {
        name: 'Cow',
        cost: 1,           // Testing price
        product: 'milk',
        productChance: 0.5,
        productValue: 50,
        maxFriendship: 100,
        friendshipGain: 8,
        color: '#8d6e63',
        size: 0.9
    },
    pig: {
        name: 'Pig',
        cost: 400,
        product: 'truffle',
        productChance: 0.3,
        productValue: 100,
        maxFriendship: 100,
        friendshipGain: 6,
        color: '#ffab91',
        size: 0.7
    },
    cat: {
        name: 'Cat',
        cost: 100,
        product: null,          // Pets don't produce
        isPet: true,
        happinessBonus: 5,      // Daily happiness boost
        color: '#ff9800',
        size: 0.5
    },
    dog: {
        name: 'Dog',
        cost: 150,
        product: null,
        isPet: true,
        happinessBonus: 8,
        color: '#795548',
        size: 0.6
    }
};

interface MoveTarget {
    x: number;
    y: number;
}

/**
 * Animal class
 */
export class Animal {
    id: number;
    type: string;
    homeX: number;
    homeY: number;
    homeBuildingId: number | null;
    x: number;
    y: number;
    visX: number;
    visY: number;
    hunger: boolean;
    friendship: number;
    wasFedToday: boolean;
    producedToday: boolean;
    isMoving: boolean;
    moveTarget: MoveTarget | null;
    moveTimer: number;

    constructor(type: string, homeX: number, homeY: number, homeBuildingId: number | null = null) {
        this.id = Date.now() + Math.random();
        this.type = type;
        this.homeX = homeX;
        this.homeY = homeY;
        this.homeBuildingId = homeBuildingId;

        // Current position (can wander)
        this.x = homeX;
        this.y = homeY;
        this.visX = homeX * TILE_SIZE;
        this.visY = homeY * TILE_SIZE;

        // State
        this.hunger = false;    // true = hungry
        this.friendship = 0;
        this.wasFedToday = false;
        this.producedToday = false;

        // Movement
        this.isMoving = false;
        this.moveTarget = null;
        this.moveTimer = 0;
    }

    /**
     * Update animal each frame
     */
    update(map: number[][], crops: Record<string, any>, SEEDS: Record<string, CropConfig>) {
        // Random movement
        this.moveTimer--;
        if (this.moveTimer <= 0 && !this.isMoving) {
            this.moveTimer = 60 + Math.random() * 120; // 1-3 seconds between moves
            this.tryRandomMove(map, crops, SEEDS);
        }

        // Smooth movement interpolation
        if (this.isMoving) {
            const targetX = this.x * TILE_SIZE;
            const targetY = this.y * TILE_SIZE;
            const speed = 2;

            const dx = targetX - this.visX;
            const dy = targetY - this.visY;
            const dist = Math.hypot(dx, dy);

            if (dist < speed) {
                this.visX = targetX;
                this.visY = targetY;
                this.isMoving = false;
            } else {
                this.visX += (dx / dist) * speed;
                this.visY += (dy / dist) * speed;
            }
        }
    }

    /**
     * Try to move to a random adjacent tile
     */
    tryRandomMove(map: number[][], crops: Record<string, any>, SEEDS: Record<string, CropConfig>) {
        const animalDef = ANIMAL_TYPES[this.type];
        const wanderRadius = animalDef?.isPet ? 5 : 2; // Pets wander further

        // Random direction
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];

        const dir = directions[Math.floor(Math.random() * directions.length)];
        const newX = this.x + dir.dx;
        const newY = this.y + dir.dy;

        // Check distance from home
        const distFromHome = Math.abs(newX - this.homeX) + Math.abs(newY - this.homeY);
        if (distFromHome > wanderRadius) return;

        // Check if can move there
        if (!isSolid(map, newX, newY, crops, SEEDS)) {
            this.x = newX;
            this.y = newY;
            this.isMoving = true;
        }
    }

    /**
     * Feed this animal
     */
    feed(): boolean {
        if (this.wasFedToday) return false;

        this.hunger = false;
        this.wasFedToday = true;
        this.friendship = Math.min(
            this.friendship + (ANIMAL_TYPES[this.type].friendshipGain || 0),
            ANIMAL_TYPES[this.type].maxFriendship || 100
        );
        return true;
    }

    /**
     * Pet this animal (for pets mainly)
     */
    pet() {
        this.friendship = Math.min(
            this.friendship + 5,
            ANIMAL_TYPES[this.type].maxFriendship || 100
        );
    }

    /**
     * Check if animal produces today
     * @returns {string|null} Product type or null
     */
    checkProduction(): string | null {
        if (this.producedToday) return null;

        const def = ANIMAL_TYPES[this.type];
        if (!def.product) return null;

        // Check if fed and friendship affects chance
        if (this.hunger) return null;

        const maxFriendship = def.maxFriendship || 100;
        const friendshipBonus = (this.friendship / maxFriendship) * 0.2; // Up to 20% bonus
        const chance = (def.productChance || 0) + friendshipBonus;

        if (Math.random() < chance) {
            this.producedToday = true;
            return def.product;
        }
        return null;
    }

    /**
     * Called at start of new day
     */
    newDay() {
        this.hunger = true;
        this.wasFedToday = false;
        this.producedToday = false;

        // Lose friendship if not fed yesterday
        if (!this.wasFedToday) {
            this.friendship = Math.max(0, this.friendship - 5);
        }
    }

    /**
     * Serialize for save
     */
    serialize() {
        return {
            id: this.id,
            type: this.type,
            homeX: this.homeX,
            homeY: this.homeY,
            homeBuildingId: this.homeBuildingId,
            x: this.x,
            y: this.y,
            hunger: this.hunger,
            friendship: this.friendship,
            wasFedToday: this.wasFedToday,
            producedToday: this.producedToday
        };
    }

    /**
     * Create from saved data
     */
    static deserialize(data: any): Animal {
        const animal = new Animal(data.type, data.homeX, data.homeY, data.homeBuildingId);
        animal.id = data.id;
        animal.x = data.x;
        animal.y = data.y;
        animal.visX = data.x * TILE_SIZE;
        animal.visY = data.y * TILE_SIZE;
        animal.hunger = data.hunger;
        animal.friendship = data.friendship;
        animal.wasFedToday = data.wasFedToday;
        animal.producedToday = data.producedToday;
        return animal;
    }
}

/**
 * Draw an animal
 */
export function drawAnimal(ctx: CanvasRenderingContext2D, animal: Animal) {
    const def = ANIMAL_TYPES[animal.type];
    if (!def) return;

    const size = TILE_SIZE * def.size;
    const x = animal.visX + (TILE_SIZE - size) / 2;
    const y = animal.visY + (TILE_SIZE - size) / 2;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(x + size / 2, y + size * 0.9, size / 2.5, size / 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.ellipse(x + size / 2, y + size / 2, size / 2, size / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000';
    const eyeSize = size * 0.1;
    ctx.beginPath();
    ctx.arc(x + size * 0.35, y + size * 0.35, eyeSize, 0, Math.PI * 2);
    ctx.arc(x + size * 0.65, y + size * 0.35, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Hunger indicator
    if (animal.hunger) {
        ctx.fillStyle = '#f44336';
        ctx.font = '10px Arial';
        ctx.fillText('!', x + size / 2 - 3, y - 5);
    }
}

export default {
    ANIMAL_TYPES,
    Animal,
    drawAnimal
};
