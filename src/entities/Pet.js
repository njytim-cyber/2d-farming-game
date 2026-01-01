/**
 * Pet Entity
 * Follows the player and wanders around
 */

import { TILE_SIZE, MOVEMENT_SPEED } from '../game/constants.js';
import { getState } from '../game/state.js';

export class Pet {
    constructor(x, y) {
        this.gridX = x;
        this.gridY = y;
        this.visX = x * TILE_SIZE;
        this.visY = y * TILE_SIZE;
        this.isMoving = false;
        this.facing = { x: 0, y: 1 };

        this.name = 'Dog';
        this.color = '#ffb74d'; // Orange/Brown default

        this.speed = 175; // Slower than player (400) but smooth

        // AI State
        this.state = 'IDLE'; // IDLE, FOLLOW, WANDER
        this.moveTimer = 0;
        this.target = null;
    }

    update(dt, player) {
        // Safety check for NaN coordinates
        if (isNaN(this.visX) || isNaN(this.visY)) {
            this.visX = this.gridX * TILE_SIZE;
            this.visY = this.gridY * TILE_SIZE;
        }

        if (this.isMoving) {
            this.continueMove(dt);
            return;
        }

        // AI Logic
        const distToPlayer = Math.hypot(this.gridX - player.gridX, this.gridY - player.gridY);

        if (distToPlayer > 3) {
            this.state = 'FOLLOW';
        } else if (distToPlayer < 2) {
            this.state = 'IDLE'; // Too close
        } else {
            // Chance to wander if close enough
            if (Math.random() < 0.01) this.state = 'WANDER';
        }

        if (this.state === 'FOLLOW') {
            this.moveTowards(player.gridX, player.gridY);
        } else if (this.state === 'WANDER') {
            if (Math.random() < 0.05) {
                const dx = Math.floor(Math.random() * 3) - 1;
                const dy = Math.floor(Math.random() * 3) - 1;
                this.tryMove(dx, dy);
            }
        }
    }

    moveTowards(targetX, targetY) {
        const dx = Math.sign(targetX - this.gridX);
        const dy = Math.sign(targetY - this.gridY);

        // Try diagonal or axis-aligned move
        if (dx !== 0 && dy !== 0) {
            if (Math.random() < 0.5) this.tryMove(dx, 0);
            else this.tryMove(0, dy);
        } else {
            this.tryMove(dx, dy);
        }
    }

    tryMove(dx, dy) {
        if (dx === 0 && dy === 0) return;

        // Simple collision check (can improve later/pass collision fn)
        const newX = this.gridX + dx;
        const newY = this.gridY + dy;

        // For now, assume map bounds check. Collision with tiles requires map access.
        // We'll pass map/isSolid later or assume simple movement for now
        // Let's assume valid move for simplicity of this snippet, or check bounds

        this.facing = { x: dx, y: dy };
        this.gridX = newX;
        this.gridY = newY;
        this.isMoving = true;
    }

    continueMove(dt) {
        const targetX = this.gridX * TILE_SIZE;
        const targetY = this.gridY * TILE_SIZE;
        const speed = this.speed * dt;

        const dist = Math.hypot(targetX - this.visX, targetY - this.visY);

        if (dist <= speed) {
            this.visX = targetX;
            this.visY = targetY;
            this.isMoving = false;
        } else {
            this.visX += ((targetX - this.visX) / dist) * speed;
            this.visY += ((targetY - this.visY) / dist) * speed;
        }
    }

    serialize() {
        return {
            gridX: this.gridX,
            gridY: this.gridY,
            name: this.name,
            color: this.color,
            state: this.state
        };
    }

    draw(ctx, x, y) {
        const drawX = x - 15;
        const drawY = y - 10;
        const bob = this.isMoving ? Math.sin(Date.now() / 80) * 3 : 0;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x, y + 10, 15, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(drawX, drawY + bob, 30, 20);

        // Head (Perspective dependant on facing)
        const headX = (this.facing.x > 0) ? drawX + 20 : (this.facing.x < 0 ? drawX - 5 : drawX + 7);
        const headY = drawY - 10 + bob;
        ctx.fillRect(headX, headY, 15, 15);

        // Ears
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(headX + 2, headY - 4, 4, 6);
        ctx.fillRect(headX + 9, headY - 4, 4, 6);

        // Legs
        ctx.fillStyle = '#e65100'; // Darker paws
        ctx.fillRect(drawX + 4, drawY + 18 + bob, 6, 6);
        ctx.fillRect(drawX + 20, drawY + 18 + bob, 6, 6);

        // Tail (wag)
        const wag = Math.sin(Date.now() / 50) * 5;
        const tailX = (this.facing.x > 0) ? drawX - 5 : (this.facing.x < 0 ? drawX + 30 : drawX + 12);
        ctx.fillRect(tailX, drawY + 5 + bob, 5, 8 + wag);
    }
}
