/**
 * Creep Entity
 * Slow-moving dungeon enemies
 */

import { TILE_SIZE } from '../game/constants';
import { isSolid } from '../systems/MapGenerator';

export class Creep {
    id: string;
    type: string;
    creepType: string;
    gridX: number;
    gridY: number;
    visX: number;
    visY: number;
    hp: number;
    maxHp: number;
    attack: number;
    speed: number;
    color: string;
    name: string;

    moveTimer: number = 0;
    moveInterval: number = 2.0; // Moves every 2 seconds (really slow)

    constructor(data: any) {
        this.id = data.id;
        this.type = data.type;
        this.creepType = data.creepType;
        this.gridX = data.x;
        this.gridY = data.y;
        this.visX = data.x * TILE_SIZE;
        this.visY = data.y * TILE_SIZE;
        this.hp = data.hp;
        this.maxHp = data.maxHp;
        this.attack = data.attack;
        this.speed = data.speed;
        this.color = data.color;
        this.name = data.name;

        // Adjust move interval based on speed stat
        this.moveInterval = 2.0 / (this.speed || 1.0);
    }

    /**
     * Update creep logic
     */
    update(dt: number, playerPos: { gridX: number, gridY: number }, map: number[][]) {
        this.moveTimer += dt;

        // Update visual position (smooth slide)
        const targetX = this.gridX * TILE_SIZE;
        const targetY = this.gridY * TILE_SIZE;
        const dist = 2.0; // Lerp speed
        this.visX += (targetX - this.visX) * dist * dt;
        this.visY += (targetY - this.visY) * dist * dt;

        if (this.moveTimer >= this.moveInterval) {
            this.moveTimer = 0;
            this.attemptMove(playerPos, map);
        }
    }

    /**
     * Move towards player or wander
     */
    attemptMove(playerPos: { gridX: number, gridY: number }, map: number[][]) {
        const dx = Math.sign(playerPos.gridX - this.gridX);
        const dy = Math.sign(playerPos.gridY - this.gridY);

        // Simple AI: Move towards player if within 10 tiles, else wander
        const distToPlayer = Math.abs(playerPos.gridX - this.gridX) + Math.abs(playerPos.gridY - this.gridY);

        let moveX = 0;
        let moveY = 0;

        if (distToPlayer < 10) {
            // Move towards player
            if (Math.random() < 0.7) { // 70% chance to track
                if (Math.abs(playerPos.gridX - this.gridX) > Math.abs(playerPos.gridY - this.gridY)) {
                    moveX = dx;
                } else {
                    moveY = dy;
                }
            }
        } else {
            // Wander
            const rand = Math.random();
            if (rand < 0.25) moveX = 1;
            else if (rand < 0.5) moveX = -1;
            else if (rand < 0.75) moveY = 1;
            else moveY = -1;
        }

        const nextX = this.gridX + moveX;
        const nextY = this.gridY + moveY;

        if (!isSolid(map, nextX, nextY)) {
            this.gridX = nextX;
            this.gridY = nextY;
        }
    }

    serialize() {
        return {
            id: this.id,
            type: this.type,
            creepType: this.creepType,
            x: this.gridX,
            y: this.gridY,
            hp: this.hp,
            maxHp: this.maxHp,
            attack: this.attack,
            speed: this.speed,
            color: this.color,
            name: this.name
        };
    }
}
