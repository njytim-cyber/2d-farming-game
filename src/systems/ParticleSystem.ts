/**
 * Particle System
 * Visual particle effects for actions
 */

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
}

interface RainParticle {
    x: number;
    y: number;
    length: number;
    velocity: number;
    isSnow: boolean;
}

export class ParticleSystem {
    particles: Particle[];
    rainParticles: RainParticle[];

    constructor() {
        this.particles = [];
        this.rainParticles = [];
    }

    /**
     * Create burst particles at position
     */
    createBurst(worldX: number, worldY: number, color: string, count: number = 8) {
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
     */
    addRain(cameraX: number, cameraY: number, viewWidth: number, isSnow: boolean = false) {
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
     */
    update(cameraY: number, viewHeight: number) {
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
     */
    drawParticles(ctx: CanvasRenderingContext2D) {
        for (const p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 4, 4);
        }
    }

    /**
     * Draw rain/snow
     */
    drawRain(ctx: CanvasRenderingContext2D, isWinter: boolean = false) {
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
