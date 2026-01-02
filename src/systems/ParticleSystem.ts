/**
 * Particle System
 * Visual particle effects for actions
 * Optimized with Object Pooling
 */

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    active: boolean;
}

interface RainParticle {
    x: number;
    y: number;
    length: number;
    velocity: number;
    isSnow: boolean;
    active: boolean;
}

export class ParticleSystem {
    private particlePool: Particle[];
    private rainPool: RainParticle[];
    private activeParticles: number = 0;
    private activeRainParticles: number = 0;
    private readonly MAX_PARTICLES = 200;
    private readonly MAX_RAIN = 300;

    constructor() {
        this.particlePool = new Array(this.MAX_PARTICLES).fill(null).map(() => ({
            x: 0, y: 0, vx: 0, vy: 0, life: 0, color: '#000', active: false
        }));
        this.rainPool = new Array(this.MAX_RAIN).fill(null).map(() => ({
            x: 0, y: 0, length: 0, velocity: 0, isSnow: false, active: false
        }));
    }

    /**
     * Create burst particles at position
     */
    createBurst(worldX: number, worldY: number, color: string, count: number = 8) {
        for (let i = 0; i < count; i++) {
            if (this.activeParticles >= this.MAX_PARTICLES) return;

            const p = this.particlePool[this.activeParticles];
            p.x = worldX;
            p.y = worldY;
            p.vx = (Math.random() - 0.5) * 4;
            p.vy = (Math.random() - 0.5) * 4;
            p.life = 20;
            p.color = color;
            p.active = true;
            this.activeParticles++;
        }
    }

    /**
     * Add rain particles
     */
    addRain(cameraX: number, cameraY: number, viewWidth: number, isSnow: boolean = false) {
        if (this.activeRainParticles >= this.MAX_RAIN) return;

        if (Math.random() < 0.3) {
            const r = this.rainPool[this.activeRainParticles];
            r.x = Math.random() * viewWidth + cameraX;
            r.y = cameraY - 10;
            r.length = Math.random() * 10 + 5;
            r.velocity = Math.random() * 5 + 10;
            r.isSnow = isSnow;
            r.active = true;
            this.activeRainParticles++;
        }
    }

    /**
     * Update all particles
     */
    update(cameraY: number, viewHeight: number) {
        // Update burst particles
        for (let i = 0; i < this.activeParticles; i++) {
            const p = this.particlePool[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            if (p.life <= 0) {
                // Swap with last active particle
                this.activeParticles--;
                const lastP = this.particlePool[this.activeParticles];

                // Copy last particle properties to current slot (or just swap objects if we can, 
                // but swapping properties is cleaner for GC if objects are strictly typed/hidden)
                // Actually swapping objects in the array is faster in JS than copying props?
                // Let's swap the references in the array.
                this.particlePool[this.activeParticles] = p; // Put dead particle at end
                this.particlePool[i] = lastP;          // Put last active particle at current index

                p.active = false;

                // Decrement i so we process the swapped particle
                i--;
            }
        }

        // Update rain particles
        for (let i = 0; i < this.activeRainParticles; i++) {
            const r = this.rainPool[i];
            r.y += r.velocity;

            // Snow drift
            if (r.isSnow) {
                r.x += Math.sin(Date.now() / 500) * 1;
            }

            // Remove if off screen
            if (r.y > cameraY + viewHeight) {
                this.activeRainParticles--;
                const lastR = this.rainPool[this.activeRainParticles];

                this.rainPool[this.activeRainParticles] = r;
                this.rainPool[i] = lastR;

                r.active = false;
                i--;
            }
        }
    }

    /**
     * Draw burst particles
     */
    drawParticles(ctx: CanvasRenderingContext2D) {
        for (let i = 0; i < this.activeParticles; i++) {
            const p = this.particlePool[i];
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 4, 4);
        }
    }

    /**
     * Draw rain/snow
     */
    drawRain(ctx: CanvasRenderingContext2D, isWinter: boolean = false) {
        if (this.activeRainParticles === 0) return;

        if (isWinter) {
            // Snow
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            for (let i = 0; i < this.activeRainParticles; i++) {
                const r = this.rainPool[i];
                ctx.moveTo(r.x, r.y);
                ctx.arc(r.x, r.y, 2, 0, Math.PI * 2);
            }
            ctx.fill();
        } else {
            // Rain
            ctx.strokeStyle = 'rgba(100, 181, 246, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < this.activeRainParticles; i++) {
                const r = this.rainPool[i];
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
        this.activeParticles = 0;
        this.activeRainParticles = 0;
    }
}

export default ParticleSystem;
