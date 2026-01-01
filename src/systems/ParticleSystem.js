/**
 * Particle System
 * Visual particle effects for actions
 */

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.rainParticles = [];
    }

    /**
     * Create burst particles at position
     * @param {number} worldX - World X position
     * @param {number} worldY - World Y position
     * @param {string} color - Particle color
     * @param {number} count - Number of particles
     */
    createBurst(worldX, worldY, color, count = 8) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: worldX,
                y: worldY,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 20,
                color
            });
        }
    }

    /**
     * Add rain particles
     * @param {number} cameraX 
     * @param {number} cameraY 
     * @param {number} viewWidth 
     * @param {boolean} isSnow 
     */
    addRain(cameraX, cameraY, viewWidth, isSnow = false) {
        if (Math.random() < 0.3) {
            this.rainParticles.push({
                x: Math.random() * viewWidth + cameraX,
                y: cameraY - 10,
                length: Math.random() * 10 + 5,
                velocity: Math.random() * 5 + 10,
                isSnow
            });
        }
    }

    /**
     * Update all particles
     * @param {number} cameraY 
     * @param {number} viewHeight 
     */
    update(cameraY, viewHeight) {
        // Update burst particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update rain particles
        for (let i = this.rainParticles.length - 1; i >= 0; i--) {
            const r = this.rainParticles[i];
            r.y += r.velocity;

            // Snow drift
            if (r.isSnow) {
                r.x += Math.sin(Date.now() / 500) * 1;
            }

            // Remove if off screen
            if (r.y > cameraY + viewHeight) {
                this.rainParticles.splice(i, 1);
            }
        }
    }

    /**
     * Draw burst particles
     * @param {CanvasRenderingContext2D} ctx 
     */
    drawParticles(ctx) {
        for (const p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 4, 4);
        }
    }

    /**
     * Draw rain/snow
     * @param {CanvasRenderingContext2D} ctx 
     * @param {boolean} isWinter 
     */
    drawRain(ctx, isWinter = false) {
        if (this.rainParticles.length === 0) return;

        if (isWinter) {
            // Snow
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            for (const r of this.rainParticles) {
                ctx.moveTo(r.x, r.y);
                ctx.arc(r.x, r.y, 2, 0, Math.PI * 2);
            }
            ctx.fill();
        } else {
            // Rain
            ctx.strokeStyle = 'rgba(100, 181, 246, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (const r of this.rainParticles) {
                ctx.moveTo(r.x, r.y);
                ctx.lineTo(r.x - 2, r.y + r.length);
            }
            ctx.stroke();
        }
    }

    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
        this.rainParticles = [];
    }
}

export default ParticleSystem;
