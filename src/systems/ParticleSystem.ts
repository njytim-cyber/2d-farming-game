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
    maxLife: number;
    color: string;
    size: number;
    active: boolean;
    type: 'burst' | 'smoke' | 'dust' | 'mote' | 'steam';
}

interface WeatherParticle {
    x: number;
    y: number;
    length: number;
    velocity: number;
    type: 'rain' | 'snow' | 'petal';
    active: boolean;
}

export class ParticleSystem {
    private particlePool: Particle[];
    private weatherPool: WeatherParticle[];
    private activeParticles: number = 0;
    private activeWeatherParticles: number = 0;
    private readonly MAX_PARTICLES = 300;
    private readonly MAX_WEATHER = 400;

    constructor() {
        this.particlePool = new Array(this.MAX_PARTICLES).fill(null).map(() => ({
            x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, color: '#000', size: 2, active: false, type: 'burst'
        }));
        this.weatherPool = new Array(this.MAX_WEATHER).fill(null).map(() => ({
            x: 0, y: 0, length: 0, velocity: 0, type: 'rain', active: false
        }));
    }

    /**
     * Create burst particles at position
     */
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
            p.life = 20 + Math.random() * 10;
            p.maxLife = p.life;
            p.color = color;
            p.size = 3;
            p.type = 'burst';
            p.active = true;
            this.activeParticles++;
        }
    }

    /**
     * Create rising smoke particle
     */
    createSmoke(worldX: number, worldY: number) {
        if (this.activeParticles >= this.MAX_PARTICLES) return;

        const p = this.particlePool[this.activeParticles];
        p.x = worldX + (Math.random() - 0.5) * 10;
        p.y = worldY;
        p.vx = (Math.random() - 0.5) * 0.5;
        p.vy = -1 - Math.random(); // Upwards
        p.life = 60 + Math.random() * 30;
        p.maxLife = p.life;
        p.color = '255, 255, 255'; // Use logic in draw for alpha
        p.size = 4 + Math.random() * 4;
        p.type = 'smoke';
        p.active = true;
        this.activeParticles++;
    }

    /**
     * Create dust for general interaction
     */
    createDust(worldX: number, worldY: number) {
        if (this.activeParticles >= this.MAX_PARTICLES) return;

        const p = this.particlePool[this.activeParticles];
        p.x = worldX + (Math.random() - 0.5) * 10;
        p.y = worldY + 10; // Feet level usually
        p.vx = (Math.random() - 0.5) * 1;
        p.vy = -Math.random() * 0.5;
        p.life = 15 + Math.random() * 10;
        p.maxLife = p.life;
        p.color = '200, 190, 180';
        p.size = 2;
        p.type = 'dust';
        p.active = true;
        this.activeParticles++;
    }

    /**
     * Create floating dust mote (Indoor atmosphere)
     */
    createMote(worldX: number, worldY: number) {
        if (this.activeParticles >= this.MAX_PARTICLES) return;

        const p = this.particlePool[this.activeParticles];
        p.x = worldX;
        p.y = worldY;
        p.vx = (Math.random() - 0.5) * 0.2; // Very slow drift
        p.vy = (Math.random() - 0.5) * 0.2;
        p.life = 200 + Math.random() * 100; // Long life
        p.maxLife = p.life;
        p.color = '255, 255, 220'; // Warm white
        p.size = 1 + Math.random() * 2;
        p.type = 'mote';
        p.active = true;
        this.activeParticles++;
    }

    /**
     * Create rising steam (Stove)
     */
    createSteam(worldX: number, worldY: number) {
        if (this.activeParticles >= this.MAX_PARTICLES) return;

        const p = this.particlePool[this.activeParticles];
        p.x = worldX + (Math.random() - 0.5) * 10;
        p.y = worldY;
        p.vx = (Math.random() - 0.5) * 0.3;
        p.vy = -0.5 - Math.random() * 0.5; // Slow rise
        p.life = 80 + Math.random() * 40;
        p.maxLife = p.life;
        p.color = '255, 255, 255';
        p.size = 3 + Math.random() * 3;
        p.type = 'steam';
        p.active = true;
        this.activeParticles++;
    }

    /**
     * Add weather particles (Rain, Snow, Petals)
     */
    addWeather(cameraX: number, cameraY: number, viewWidth: number, type: 'rain' | 'snow' | 'petal' = 'rain') {
        if (this.activeWeatherParticles >= this.MAX_WEATHER) return;

        // Density Check
        const chance = type === 'rain' ? 0.3 : (type === 'petal' ? 0.05 : 0.2);

        if (Math.random() < chance) {
            const r = this.weatherPool[this.activeWeatherParticles];
            r.x = Math.random() * viewWidth + cameraX;
            r.y = cameraY - 10;
            r.length = Math.random() * 10 + 5;
            r.velocity = type === 'rain' ? Math.random() * 5 + 10 : Math.random() * 2 + 1; // Snow/Petals slower
            r.type = type;
            r.active = true;
            this.activeWeatherParticles++;
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

        // Update weather particles
        for (let i = 0; i < this.activeWeatherParticles; i++) {
            const r = this.weatherPool[i];
            r.y += r.velocity;

            // Drift
            if (r.type === 'snow') {
                r.x += Math.sin(Date.now() / 500 + r.y * 0.05) * 0.5;
            } else if (r.type === 'petal') {
                r.x += Math.sin(Date.now() / 400 + r.y * 0.02) * 1;
                r.y += Math.sin(Date.now() / 300) * 0.2; // Floating effect
            }

            // Remove if off screen
            if (r.y > cameraY + viewHeight) {
                this.activeWeatherParticles--;
                const lastR = this.weatherPool[this.activeWeatherParticles];

                this.weatherPool[this.activeWeatherParticles] = r;
                this.weatherPool[i] = lastR;

                r.active = false;
                i--;
            }
        }
    }

    /**
     * Draw burst particles
     */
    /**
     * Draw particles
     */
    drawParticles(ctx: CanvasRenderingContext2D) {
        // Draw standard particles
        for (let i = 0; i < this.activeParticles; i++) {
            const p = this.particlePool[i];

            if (p.type === 'smoke') {
                const alpha = Math.max(0, p.life / p.maxLife);
                ctx.fillStyle = `rgba(${p.color}, ${alpha * 0.4})`; // Ghostly smoke
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (2 - alpha), 0, Math.PI * 2); // Grow as it dies
                ctx.fill();
            } else if (p.type === 'dust') {
                const alpha = Math.max(0, p.life / p.maxLife);
                ctx.fillStyle = `rgba(${p.color}, ${alpha})`;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            } else if (p.type === 'mote') {
                const alpha = Math.min(0.3, (p.life / p.maxLife) * 0.5); // Max 0.3 opacity
                ctx.fillStyle = `rgba(${p.color}, ${alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'steam') {
                const alpha = (p.life / p.maxLife) * 0.4;
                ctx.fillStyle = `rgba(${p.color}, ${alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Burst
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }
        }
    }

    /**
     * Draw weather (Rain, Snow, Petals)
     */
    drawWeather(ctx: CanvasRenderingContext2D) {
        if (this.activeWeatherParticles === 0) return;

        // Minimal state changes for performance
        // But since we mix types, we iterate and check. 
        // Optimization: Sort by type? For now, simple loop is fine for < 400 particles.

        ctx.lineWidth = 2;

        for (let i = 0; i < this.activeWeatherParticles; i++) {
            const r = this.weatherPool[i];

            if (r.type === 'snow') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(r.x, r.y, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (r.type === 'petal') {
                // Pink petals
                ctx.fillStyle = 'rgba(255, 192, 203, 0.8)'; // Pink
                ctx.beginPath();
                // Simple leaf shape or circle
                ctx.ellipse(r.x, r.y, 3, 1.5, Math.sin(Date.now() / 200 + r.x), 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Rain
                ctx.strokeStyle = 'rgba(100, 181, 246, 0.6)';
                ctx.beginPath();
                ctx.moveTo(r.x, r.y);
                ctx.lineTo(r.x - 2, r.y + r.length);
                ctx.stroke();
            }
        }
    }

    /**
     * Clear all particles
     */
    clear() {
        this.activeParticles = 0;
        this.activeWeatherParticles = 0;
    }
}

export default ParticleSystem;
