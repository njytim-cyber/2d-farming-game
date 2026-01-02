/**
 * RenderingOrchestrator
 * Handles all game rendering logic extracted from Game.ts
 */

import { TILE_SIZE, TILES, INTERIOR_TILES } from '../game/constants';
import { getState, setState, GameState } from '../game/state';
import { Game } from '../game/Game';

interface Light {
    x: number;
    y: number;
    radius: number;
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

        this.game.renderer.clear();

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
        if (darkness > 0) {
            this.drawLighting(state, camera, range, currentMap, mapWidth, mapHeight, darkness);
        }

        this.game.renderer.drawFacingIndicator();
        this.game.particleSystem.drawParticles(this.game.renderer.ctx);

        if (this.game.timeSystem.weather === 'Rain' && state.currentMap === 'overworld') {
            this.game.particleSystem.drawRain(this.game.renderer.ctx, this.game.timeSystem.season === 3);
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

        // Draw vignette for visual polish
        this.drawVignette();

        this.game.renderer.drawMessages(state.messages);
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
                        this.game.tileRenderer.drawNPC(this.game.renderer.ctx, npc.x * TILE_SIZE, npc.y * TILE_SIZE, npc);
                    }
                });
            }

            // Creeps (in dungeons) - use visual positions for smooth movement
            if (this.game.creeps && state.currentMap.startsWith('dungeon_')) {
                this.game.creeps.forEach((creep: any) => {
                    const creepBottomY = creep.visY + TILE_SIZE;
                    if (creepBottomY > rowTopY && creepBottomY <= rowBottomY) {
                        this.game.tileRenderer.drawNPC(this.game.renderer.ctx, creep.visX, creep.visY, creep);
                    }
                });
            }

            // Pet
            if (this.game.pet && state.currentMap === 'overworld') {
                const petBottomY = this.game.pet.visY + TILE_SIZE;
                if (petBottomY > rowTopY && petBottomY <= rowBottomY) {
                    this.game.pet.draw(this.game.renderer.ctx, this.game.pet.visX + TILE_SIZE / 2, this.game.pet.visY + TILE_SIZE / 2);
                }
            }

            // Player
            if (this.game.player) {
                const playerBottomY = this.game.player.visY + TILE_SIZE;
                if (playerBottomY > rowTopY && playerBottomY <= rowBottomY) {
                    this.game.player.draw(this.game.renderer.ctx, this.game.player.visX + TILE_SIZE / 2, this.game.player.visY + TILE_SIZE / 2);
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
        }

        this.game.renderer.drawLightingOverlay(darkness, lights);
    }
}
