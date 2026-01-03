import { TILE_SIZE, TILES, INTERIOR_TILES } from '../game/constants';
import { getState, setState, GameState } from '../game/state';
import { Game } from '../game/Game';

interface Light {
    x: number;
    y: number;
    radius: number;
    color?: string;
}

export class RenderingOrchestrator {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * Calculate darkness level based on time of day
     * Returns 0.0 (day) to 0.7 (night)
     */
    calculateDarkness(hour: number): number {
        if (hour >= 18 || hour < 6) {
            if (hour >= 18 && hour < 22) return (hour - 18) / 4 * 0.7;
            else if (hour >= 22 || hour < 4) return 0.7;
            else if (hour >= 4 && hour < 6) return (1 - (hour - 4) / 2) * 0.7;
        }
        return 0;
    }

    /**
     * Draw all game elements
     */
    draw() {
        if (!this.game.player || !this.game.timeSystem) return;
        const state = getState();
        if (state.screen === 'CREATOR') return;

        if (state.currentMap !== 'overworld') {
            this.game.renderer.clear('#111'); // Dark void for interiors
        } else {
            this.game.renderer.clear('#121212'); // Standard dark grey for overworld
        }

        // Update camera
        const currentMap = this.game.getCurrentMap(state);
        const mapHeight = currentMap.length;
        const mapWidth = currentMap[0]?.length || 0;

        const camera = this.game.renderer.updateCamera(
            this.game.player.visX,
            this.game.player.visY,
            state.zoom,
            mapWidth,
            mapHeight
        );
        setState({ camera });

        // Begin world drawing
        this.game.renderer.beginWorldDraw(camera, state.zoom);

        // Calculate darkness
        const darkness = this.calculateDarkness(this.game.timeSystem.hour);
        const range = this.game.renderer.getVisibleTileRange(camera, state.zoom);

        // --- Pass 1: Ground Tiles ---
        this.drawGroundTiles(state, currentMap, range, mapWidth, mapHeight);

        // --- Pass 2: Sorted Standing Objects & Entities ---
        this.drawStandingObjectsAndEntities(state, currentMap, range, mapWidth, mapHeight);

        // --- Post-Pass: Indicators & Effects ---
        if (state.destination) {
            this.game.renderer.drawDestination(state.destination);
        }

        // --- Pass 4: Global Illumination & Lighting ---
        if (state.currentMap === 'overworld') {
            if (darkness > 0) {
                this.drawLighting(state, camera, range, currentMap, mapWidth, mapHeight, darkness);
            }
        } else {
            // Indoor Lighting always applied
            this.drawLighting(state, camera, range, currentMap, mapWidth, mapHeight, 0.3);
        }

        this.game.renderer.drawFacingIndicator();
        this.game.particleSystem.drawParticles(this.game.renderer.ctx);

        if ((this.game.timeSystem.weather === 'Rain' || this.game.timeSystem.season === 0) && state.currentMap === 'overworld') {
            this.game.particleSystem.drawWeather(this.game.renderer.ctx);
        }

        this.game.renderer.endWorldDraw();

        // Draw building placement preview
        if (this.game.buildModal) {
            this.game.buildModal.drawPreview(this.game.renderer.ctx);
        }

        // Draw overlays
        if (this.game.timeSystem.weather === 'Rain' && state.currentMap === 'overworld') {
            this.game.renderer.drawRainOverlay();
        }

        // Golden Hour Overlay
        const hour = this.game.timeSystem.hour;
        if (state.currentMap === 'overworld' && (hour >= 5 && hour < 7 || hour >= 17 && hour < 19)) {
            // Calculate opacity based on peak golden hour
            let opacity = 0;
            if (hour >= 5 && hour < 7) {
                // Sunrise golden hour
                opacity = 0.15; // Max opacity
            } else {
                // Sunset golden hour
                opacity = 0.15;
            }
            this.game.renderer.drawOverlay('rgba(255, 160, 0)', opacity);
        } else if (state.currentMap !== 'overworld') {
            // Indoor Warmth Force
            this.game.renderer.drawOverlay('#FFB74D', 0.1);
        }

        // Draw vignette for visual polish
        this.drawVignette();

        this.game.renderer.drawMessages(state.messages);

        // Update Minimap
        if (this.game.minimap) {
            this.game.minimap.draw(state);
        }
    }

    /**
     * Draw vignette effect (subtle edge darkening)
     */
    private drawVignette() {
        const ctx = this.game.renderer.ctx;
        const w = this.game.renderer.canvas.width;
        const h = this.game.renderer.canvas.height;

        const gradient = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.35)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }

    /**
     * Draw ground tiles (Pass 1)
     */
    private drawGroundTiles(
        state: GameState,
        currentMap: number[][],
        range: { startX: number; startY: number; endX: number; endY: number },
        mapWidth: number,
        mapHeight: number
    ) {
        for (let y = range.startY; y < range.endY; y++) {
            for (let x = range.startX; x < range.endX; x++) {
                if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) continue;
                const tile = currentMap[y][x];

                if (state.currentMap === 'overworld') {
                    // Always draw grass as base
                    this.game.tileRenderer.drawTile(TILES.GRASS, x, y, this.game.timeSystem!.season, currentMap);

                    if (tile === TILES.SOIL || tile === TILES.WITHERED) {
                        this.game.tileRenderer.drawTile(tile, x, y, this.game.timeSystem!.season, currentMap);
                    }
                } else {
                    if (tile === INTERIOR_TILES.FLOOR || tile === INTERIOR_TILES.RUG || tile === INTERIOR_TILES.DOOR) {
                        this.game.tileRenderer.drawInteriorTile(tile, x, y);
                    }
                }
            }
        }
    }

    /**
     * Draw standing objects and entities row by row (Pass 2)
     */
    private drawStandingObjectsAndEntities(
        state: GameState,
        currentMap: number[][],
        range: { startX: number; startY: number; endX: number; endY: number },
        mapWidth: number,
        mapHeight: number
    ) {
        const time = performance.now() / 1000;
        const bobOffset = Math.sin(time * 3) * 2; // subtle +/- 2px bob

        for (let y = range.startY; y < range.endY; y++) {
            // 1. Standing Tiles for this row
            for (let x = range.startX; x < range.endX; x++) {
                if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) continue;
                const tile = currentMap[y][x];

                if (state.currentMap === 'overworld') {
                    if (tile !== TILES.GRASS && tile !== TILES.SOIL && tile !== TILES.WITHERED) {
                        this.game.tileRenderer.drawTile(tile, x, y, this.game.timeSystem!.season, currentMap);
                    }
                    const crop = state.crops[`${x},${y}`];
                    if (crop) this.game.tileRenderer.drawCrop(crop, x, y);
                } else {
                    if (tile !== INTERIOR_TILES.FLOOR && tile !== INTERIOR_TILES.RUG && tile !== INTERIOR_TILES.DOOR) {
                        this.game.tileRenderer.drawInteriorTile(tile, x, y);
                    }
                }
            }

            // 2. Entities whose "pivot" is in this row
            const rowBottomY = (y + 1) * TILE_SIZE;
            const rowTopY = y * TILE_SIZE;

            // NPCs
            const currentNpcs = (state.currentMap === 'overworld')
                ? state.npcs
                : (state.interiors[state.currentMap.replace('Interior', '')]?.npcs || []);

            if (currentNpcs) {
                currentNpcs.forEach((npc: any) => {
                    // Skip creeps here - they're rendered separately with their visual positions
                    if (npc.type === 'creep') return;
                    const npcBottomY = (npc.y + 1) * TILE_SIZE;
                    if (npcBottomY > rowTopY && npcBottomY <= rowBottomY) {
                        // Apply bobbing to NPCs as well
                        this.game.tileRenderer.drawNPC(this.game.renderer.ctx, npc.x * TILE_SIZE, npc.y * TILE_SIZE + bobOffset, npc);
                    }
                });
            }

            // Creeps (in dungeons) - use visual positions for smooth movement
            if (this.game.creeps && state.currentMap.startsWith('dungeon_')) {
                this.game.creeps.forEach((creep: any) => {
                    const creepBottomY = creep.visY + TILE_SIZE;
                    if (creepBottomY > rowTopY && creepBottomY <= rowBottomY) {
                        // Apply bobbing to creeps
                        this.game.tileRenderer.drawNPC(this.game.renderer.ctx, creep.visX, creep.visY + bobOffset, creep);
                    }
                });
            }

            // Pet
            if (this.game.pet && state.currentMap === 'overworld') {
                const petBottomY = this.game.pet.visY + TILE_SIZE;
                if (petBottomY > rowTopY && petBottomY <= rowBottomY) {
                    // Draw pet shadow
                    this.game.renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                    this.game.renderer.ctx.beginPath();
                    this.game.renderer.ctx.ellipse(
                        this.game.pet.visX + TILE_SIZE / 2,
                        this.game.pet.visY + TILE_SIZE - 5,
                        10, 5, 0, 0, Math.PI * 2
                    );
                    this.game.renderer.ctx.fill();
                    // Draw pet with bob
                    this.game.pet.draw(this.game.renderer.ctx, this.game.pet.visX + TILE_SIZE / 2, this.game.pet.visY + TILE_SIZE / 2 + bobOffset);
                }
            }

            // Player
            if (this.game.player) {
                const playerBottomY = this.game.player.visY + TILE_SIZE;
                if (playerBottomY > rowTopY && playerBottomY <= rowBottomY) {
                    // Draw player shadow
                    this.game.renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                    this.game.renderer.ctx.beginPath();
                    this.game.renderer.ctx.ellipse(
                        this.game.player.visX + TILE_SIZE / 2,
                        this.game.player.visY + TILE_SIZE - 5,
                        12, 6, 0, 0, Math.PI * 2
                    );
                    this.game.renderer.ctx.fill();
                    // Draw player with bob
                    this.game.player.draw(this.game.renderer.ctx, this.game.player.visX + TILE_SIZE / 2, this.game.player.visY + TILE_SIZE / 2 + bobOffset);
                }
            }
        }
    }

    /**
     * Draw lighting overlay (Pass 4)
     */
    private drawLighting(
        state: GameState,
        camera: { x: number; y: number },
        range: { startX: number; startY: number; endX: number; endY: number },
        currentMap: number[][],
        mapWidth: number,
        mapHeight: number,
        darkness: number
    ) {
        const lights: Light[] = [];

        // Player Light
        if (this.game.player) {
            const screenPos = {
                x: (this.game.player.visX + TILE_SIZE / 2 - camera.x) * state.zoom,
                y: (this.game.player.visY + TILE_SIZE / 2 - camera.y) * state.zoom
            };
            lights.push({ x: screenPos.x, y: screenPos.y, radius: 150 * state.zoom });
        }

        // Building Lights (Only if on screen)
        if (state.currentMap === 'overworld') {
            for (let y = range.startY; y < range.endY; y++) {
                for (let x = range.startX; x < range.endX; x++) {
                    if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) continue;
                    const tile = currentMap[y][x];

                    if (tile === TILES.HOUSE || tile === TILES.SHOP || tile === TILES.OLD_HOUSE) {
                        if (this.game.tileRenderer.isBottomLeftCorner(currentMap, x, y, tile)) {
                            const bx = (x * TILE_SIZE - camera.x) * state.zoom;
                            const by = (y * TILE_SIZE - camera.y) * state.zoom;

                            if (tile === TILES.HOUSE) {
                                lights.push({ x: bx + 50 * state.zoom, y: by - 40 * state.zoom, radius: 60 * state.zoom });
                                lights.push({ x: bx + 100 * state.zoom, y: by - 40 * state.zoom, radius: 60 * state.zoom });
                            } else if (tile === TILES.SHOP) {
                                lights.push({ x: bx + 40 * state.zoom, y: by - 30 * state.zoom, radius: 80 * state.zoom });
                                lights.push({ x: bx + 110 * state.zoom, y: by - 30 * state.zoom, radius: 80 * state.zoom });
                            }
                        }
                    }
                }
            }
        } else {
            // Interior Lighting
            this.drawInteriorAtmosphere(state, camera, range, currentMap, mapWidth, mapHeight);
        }

        this.game.renderer.drawLightingOverlay(darkness, lights);
    }

    /**
     * Draw interior specific atmosphere (SSAO, God Rays, Point Lights)
     */
    private drawInteriorAtmosphere(
        state: GameState,
        camera: { x: number; y: number },
        range: { startX: number; startY: number; endX: number; endY: number },
        currentMap: number[][],
        mapWidth: number,
        mapHeight: number
    ) {
        const ctx = this.game.renderer.ctx;
        const view = this.game.renderer.getViewSize(state.zoom);

        // 1. SSAO (Corner Vignettes)
        const cornerSize = 300 * state.zoom;
        const corners = [
            { x: 0, y: 0 },
            { x: view.width, y: 0 },
            { x: 0, y: view.height },
            { x: view.width, y: view.height }
        ];

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Screen space

        corners.forEach(corner => {
            const grad = ctx.createRadialGradient(corner.x, corner.y, 0, corner.x, corner.y, cornerSize);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0.4)'); // Dark corners
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(corner.x, corner.y, cornerSize, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        // 2. God Rays (Window Light)
        const time = performance.now();
        const flicker = Math.sin(time / 2000) * 0.1 + 0.9;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        const rayStartX = -50;
        const rayStartY = 100;
        const rayLen = 400;
        const rayWidthStart = 100;
        const rayWidthEnd = 300;
        const angle = Math.PI / 6;

        ctx.translate(-camera.x * state.zoom, -camera.y * state.zoom);
        ctx.scale(state.zoom, state.zoom);

        const grad = ctx.createLinearGradient(rayStartX, rayStartY, rayStartX + rayLen, rayStartY + rayLen * Math.tan(angle));
        grad.addColorStop(0, `rgba(255, 255, 200, ${0.15 * flicker})`);
        grad.addColorStop(1, 'rgba(255, 255, 200, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(rayStartX, rayStartY);
        ctx.lineTo(rayStartX + rayLen, rayStartY + rayLen * Math.tan(angle) - rayWidthEnd / 2);
        ctx.lineTo(rayStartX + rayLen, rayStartY + rayLen * Math.tan(angle) + rayWidthEnd / 2);
        ctx.lineTo(rayStartX, rayStartY + rayWidthStart);
        ctx.fill();

        ctx.restore();

        // 3. Point Lights (Stove, Door) & Particles
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Random Motes
        if (Math.random() < 0.1) {
            const mx = (camera.x + Math.random() * view.width / state.zoom);
            const my = (camera.y + Math.random() * view.height / state.zoom);
            this.game.particleSystem.createMote(mx, my);
        }

        for (let y = range.startY; y < range.endY; y++) {
            for (let x = range.startX; x < range.endX; x++) {
                if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) continue;
                const tile = currentMap[y][x];

                if (tile === INTERIOR_TILES.STOVE) {
                    const px = (x * TILE_SIZE - camera.x) * state.zoom;
                    const py = (y * TILE_SIZE - camera.y) * state.zoom;
                    const cx = px + (TILE_SIZE / 2) * state.zoom;
                    const cy = py + (TILE_SIZE / 2) * state.zoom;

                    const pulse = Math.sin(time / 200) * 0.05 + 0.95;
                    const radius = 80 * state.zoom * pulse;

                    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
                    g.addColorStop(0, 'rgba(255, 100, 0, 0.4)');
                    g.addColorStop(1, 'rgba(255, 100, 0, 0)');

                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                    ctx.fill();

                    // Spawn Steam
                    if (Math.random() < 0.05) {
                        this.game.particleSystem.createSteam(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE);
                    }
                } else if (tile === INTERIOR_TILES.DOOR) {
                    const px = (x * TILE_SIZE - camera.x) * state.zoom;
                    const py = (y * TILE_SIZE - camera.y) * state.zoom;
                    const cx = px + (TILE_SIZE / 2) * state.zoom;
                    const cy = py + (TILE_SIZE / 2) * state.zoom;

                    const radius = 60 * state.zoom;
                    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
                    g.addColorStop(0, 'rgba(200, 200, 255, 0.2)');
                    g.addColorStop(1, 'rgba(200, 200, 255, 0)');

                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        ctx.restore();
    }
}
