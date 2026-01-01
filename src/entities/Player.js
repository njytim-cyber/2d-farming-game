/**
 * Player Entity
 * Handles player movement, position, and character appearance
 */

import { TILE_SIZE, MOVEMENT_SPEED, MAP_WIDTH, MAP_HEIGHT, COLORS } from '../game/constants.js';
import { getState } from '../game/state.js';

export class Player {
    constructor(playerData) {
        this.gridX = playerData.gridX;
        this.gridY = playerData.gridY;
        this.visX = playerData.visX;
        this.visY = playerData.visY;
        this.isMoving = playerData.isMoving || false;
        this.facing = playerData.facing || { x: 0, y: 1 };

        // Appearance
        this.skinColor = playerData.skinColor || COLORS.skin[0];
        this.hairColor = playerData.hairColor || COLORS.hair[1];
        this.shirtColor = playerData.shirtColor || COLORS.shirt[1];
        this.hairStyle = playerData.hairStyle || 0;

        // Identity
        this.name = playerData.name || 'Farmer';
        this.gender = playerData.gender || 'male'; // 'male' or 'female'

        this.equipment = playerData.equipment || {
            head: null,
            body: null,
            legs: null,
            weapon: null,
            weapon: null,
            offhand: null
        };

        // Combat Stats
        this.hp = playerData.hp || 100;
        this.maxHp = playerData.maxHp || 100;
        this.questFlags = playerData.questFlags || {};

        // Animation state
        this.attackTimer = 0;
        this.isAttacking = false;

        // Active Buffs (from food consumption)
        this.activeBuffs = playerData.activeBuffs || [];
    }

    /**
     * Apply a buff from consuming food
     * @param {object} buff - { type, duration, value }
     */
    applyBuff(buff) {
        // Remove existing buff of same type
        this.activeBuffs = this.activeBuffs.filter(b => b.type !== buff.type);
        // Add new buff with remaining time
        this.activeBuffs.push({
            type: buff.type,
            remainingTime: buff.duration,
            value: buff.value
        });
    }

    /**
     * Update buff timers
     * @param {number} dt - Delta time in seconds
     */
    updateBuffs(dt) {
        this.activeBuffs = this.activeBuffs.filter(buff => {
            buff.remainingTime -= dt;
            return buff.remainingTime > 0;
        });
    }

    /**
     * Get buff value by type
     */
    getBuffValue(type) {
        const buff = this.activeBuffs.find(b => b.type === type);
        return buff ? buff.value : null;
    }

    /**
     * Get effective movement speed (with buffs)
     */
    getEffectiveSpeed() {
        const speedBuff = this.getBuffValue('speedBoost');
        return speedBuff ? MOVEMENT_SPEED * speedBuff : MOVEMENT_SPEED;
    }

    /**
     * Get effective max HP (with buffs)
     */
    getEffectiveMaxHp() {
        const hpBuff = this.getBuffValue('maxHpBoost');
        return hpBuff ? this.maxHp + hpBuff : this.maxHp;
    }

    /**
     * Get energy cost multiplier (with buffs)
     */
    getEnergyCostMultiplier() {
        const energyBuff = this.getBuffValue('energySaver');
        return energyBuff ? energyBuff : 1.0;
    }

    /**
     * Update player movement (smooth interpolation)
     */
    /**
     * Update player movement (smooth interpolation)
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        if (this.attackTimer > 0) {
            this.attackTimer -= dt * 1000;
            if (this.attackTimer <= 0) {
                this.attackTimer = 0;
                this.isAttacking = false;
            }
        }

        if (!this.isMoving) return;

        const targetX = this.gridX * TILE_SIZE;
        const targetY = this.gridY * TILE_SIZE;

        const frameSpeed = this.getEffectiveSpeed() * dt;
        const dist = Math.hypot(targetX - this.visX, targetY - this.visY);

        if (dist <= frameSpeed) {
            this.visX = targetX;
            this.visY = targetY;
            this.isMoving = false;
        } else {
            this.visX += ((targetX - this.visX) / dist) * frameSpeed;
            this.visY += ((targetY - this.visY) / dist) * frameSpeed;
        }
    }

    /**
     * Try to move in a direction
     * @param {number} dx - X direction (-1, 0, 1)
     * @param {number} dy - Y direction (-1, 0, 1)
     * @param {Function} isSolidFn - Function to check if tile is solid
     * @returns {boolean} Whether move was successful
     */
    tryMove(dx, dy, isSolidFn) {
        if (this.isMoving) return false;

        const newX = this.gridX + dx;
        const newY = this.gridY + dy;

        this.facing = { x: dx || 0, y: dy || 0 };

        if (newX >= 0 && newX < MAP_WIDTH && newY >= 0 && newY < MAP_HEIGHT) {
            if (!isSolidFn(newX, newY)) {
                this.gridX = newX;
                this.gridY = newY;
                this.isMoving = true;
                return true;
            }
        }
        return false;
    }

    /**
     * Get the tile coordinates the player is facing
     */
    getFacingTile() {
        return {
            x: this.gridX + this.facing.x,
            y: this.gridY + this.facing.y
        };
    }

    /**
     * Set character appearance
     */
    setAppearance({ skinColor, hairColor, shirtColor, hairStyle, name, gender }) {
        if (skinColor !== undefined) this.skinColor = skinColor;
        if (hairColor !== undefined) this.hairColor = hairColor;
        if (shirtColor !== undefined) this.shirtColor = shirtColor;
        if (hairStyle !== undefined) this.hairStyle = hairStyle;
        if (name !== undefined) this.name = name;
        if (gender !== undefined) this.gender = gender;
    }

    /**
     * Cycle to next hair style
     */
    cycleHairStyle() {
        this.hairStyle = (this.hairStyle + 1) % 3;
    }

    /**
     * Serialize player data
     */
    serialize() {
        return {
            gridX: this.gridX,
            gridY: this.gridY,
            visX: this.visX,
            visY: this.visY,
            isMoving: this.isMoving,
            facing: this.facing,
            skinColor: this.skinColor,
            hairColor: this.hairColor,
            shirtColor: this.shirtColor,
            hairStyle: this.hairStyle,
            name: this.name,
            gender: this.gender,
            equipment: this.equipment,
            hp: this.hp,
            maxHp: this.maxHp,
            questFlags: this.questFlags,
            attackTimer: this.attackTimer,
            isAttacking: this.isAttacking,
            activeBuffs: this.activeBuffs
        };
    }

    /**
     * Calculate total attack damage
     */
    getAttack() {
        let dmg = 1; // Base damage
        if (this.equipment && this.equipment.weapon) {
            dmg += (this.equipment.weapon.attack || 0);
        }
        return dmg;
    }

    /**
     * Take damage
     */
    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        return this.hp === 0;
    }

    /**
     * Trigger attack animation
     */
    startAttack() {
        this.isAttacking = true;
        this.attackTimer = 300; // 300ms animation
    }

    /**
     * Draw the player character
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     */
    draw(ctx, x, y) {
        const drawX = x - 10;
        const drawY = y - 15;
        const state = getState();
        const bob = (state.screen === 'GAME' && this.isMoving)
            ? Math.sin(Date.now() / 100) * 2
            : 0;

        if (this.gender === 'female') {
            // === FEMALE AVATAR ===
            // Dress/Skirt (replaces legs/lower body)
            ctx.fillStyle = this.shirtColor;
            ctx.beginPath();
            ctx.moveTo(drawX + 2, drawY + 20 + bob);
            ctx.lineTo(drawX + 18, drawY + 20 + bob);
            ctx.lineTo(drawX + 22, drawY + 31 + bob);
            ctx.lineTo(drawX - 2, drawY + 31 + bob);
            ctx.fill();

            // Legs (visible at bottom)
            ctx.fillStyle = this.skinColor;
            ctx.fillRect(drawX + 6, drawY + 30 + bob, 3, 4);
            ctx.fillRect(drawX + 11, drawY + 30 + bob, 3, 4);

        } else {
            // === MALE AVATAR ===
            // Legs (Pants)
            ctx.fillStyle = COLORS.pants;
            ctx.fillRect(drawX + 6, drawY + 18 + bob, 4, 12);
            ctx.fillRect(drawX + 11, drawY + 18 - bob, 4, 12);
        }

        // Body (Upper)
        ctx.fillStyle = this.shirtColor;
        if (this.gender === 'female') {
            // Slightly tapered waist for female
            ctx.beginPath();
            ctx.moveTo(drawX + 4, drawY + 8 + bob);
            ctx.lineTo(drawX + 16, drawY + 8 + bob);
            ctx.lineTo(drawX + 18, drawY + 20 + bob);
            ctx.lineTo(drawX + 2, drawY + 20 + bob);
            ctx.fill();
        } else {
            ctx.fillRect(drawX + 2, drawY + 8 + bob, 16, 12);
        }

        // Arms
        ctx.fillStyle = this.skinColor;
        ctx.fillRect(drawX - 2, drawY + 8 + bob, 4, 10);
        ctx.fillRect(drawX + 18, drawY + 8 + bob, 4, 10);

        // Head
        ctx.fillStyle = this.skinColor;
        ctx.fillRect(drawX + 2, drawY - 6 + bob, 16, 14);

        // Eyes
        ctx.fillStyle = 'black';
        const eyeOffset = (this.facing.x || 0) * 2;

        if (this.facing.y !== -1) {
            ctx.fillRect(drawX + 5 + eyeOffset, drawY - 2 + bob, 2, 2);
            ctx.fillRect(drawX + 13 + eyeOffset, drawY - 2 + bob, 2, 2);

            // Gender-specific facial features
            if (this.gender === 'female') {
                // Eyelashes
                ctx.fillStyle = 'black';
                ctx.fillRect(drawX + 4 + eyeOffset, drawY - 3 + bob, 1, 1);
                ctx.fillRect(drawX + 7 + eyeOffset, drawY - 3 + bob, 1, 1);
                ctx.fillRect(drawX + 12 + eyeOffset, drawY - 3 + bob, 1, 1);
                ctx.fillRect(drawX + 15 + eyeOffset, drawY - 3 + bob, 1, 1);

                // Blush
                ctx.fillStyle = 'rgba(255, 182, 193, 0.6)';
                ctx.fillRect(drawX + 3 + eyeOffset, drawY + 2 + bob, 3, 2);
                ctx.fillRect(drawX + 14 + eyeOffset, drawY + 2 + bob, 3, 2);
            }
        }

        // Hair
        if (this.hairStyle !== 2) { // 2 is bald
            ctx.fillStyle = this.hairColor;

            if (this.gender === 'female') {
                if (this.hairStyle === 0) {
                    // Bob cut
                    ctx.fillRect(drawX + 1, drawY - 8 + bob, 18, 6);
                    ctx.fillRect(drawX, drawY - 4 + bob, 4, 12);
                    ctx.fillRect(drawX + 16, drawY - 4 + bob, 4, 12);
                } else if (this.hairStyle === 1) {
                    // Long hair
                    ctx.fillRect(drawX, drawY - 8 + bob, 20, 6);
                    ctx.fillRect(drawX - 2, drawY - 4 + bob, 5, 20);
                    ctx.fillRect(drawX + 17, drawY - 4 + bob, 5, 20);
                    // Back hair (behind body) - drawn here for simplicity
                    ctx.fillRect(drawX + 4, drawY + 2 + bob, 12, 18);
                }
            } else {
                if (this.hairStyle === 0) {
                    // Standard short
                    ctx.fillRect(drawX + 1, drawY - 8 + bob, 18, 5);
                    ctx.fillRect(drawX, drawY - 6 + bob, 3, 8);
                    ctx.fillRect(drawX + 17, drawY - 6 + bob, 3, 8);
                } else if (this.hairStyle === 1) {
                    // Spiky hair
                    ctx.fillRect(drawX + 1, drawY - 7 + bob, 18, 4);
                    for (let i = 0; i < 5; i++) {
                        ctx.fillRect(drawX + 2 + i * 4, drawY - 11 + bob, 2, 4);
                    }
                }
            }
        }

        // === SWORD ANIMATION ===
        if (this.isAttacking && this.equipment && this.equipment.weapon) {
            this.drawSwordSwing(ctx, drawX + 10, drawY + 15);
        }
    }

    /**
     * Draw sword swing animation
     */
    drawSwordSwing(ctx, cx, cy) {
        const progress = 1 - (this.attackTimer / 300);
        const angle = -Math.PI / 4 + progress * Math.PI / 2; // -45 to +45 deg swing

        ctx.save();
        ctx.translate(cx, cy);

        // Rotate based on facing
        if (this.facing.x === 1) ctx.rotate(0);
        else if (this.facing.x === -1) ctx.rotate(Math.PI);
        else if (this.facing.y === 1) ctx.rotate(Math.PI / 2);
        else if (this.facing.y === -1) ctx.rotate(-Math.PI / 2);

        ctx.rotate(angle);

        // Draw Sword
        ctx.fillStyle = '#bcaaa4'; // Wood Hilt
        ctx.fillRect(5, -2, 8, 4);
        ctx.fillStyle = '#eeeeee'; // Steel Blade (if it was steel, but it's wooden)
        ctx.fillStyle = '#a1887f'; // Wooden blade color
        ctx.fillRect(13, -3, 20, 6);

        // Shine/Edge
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(13, -3, 20, 1);

        ctx.restore();
    }
}

export default Player;
