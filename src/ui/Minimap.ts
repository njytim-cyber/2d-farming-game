/**
 * Minimap UI Component
 * Renders a simplified top-down view of the world
 */

import { TILES } from '../game/constants';
import { GameState } from '../game/state';

export class Minimap {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;

    // Cache map image to avoid redrawing static terrain every frame
    mapCache: HTMLCanvasElement | null = null;
    lastMapId: string = '';

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        this.width = canvas.width;
        this.height = canvas.height;

        // Disable smoothing for pixel art look
        this.ctx.imageSmoothingEnabled = false;
    }

    /**
     * Update and draw the minimap
     */
    draw(state: GameState) {
        // Clear
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 1. Draw Static Map (Terrain)
        this.drawMap(state);

        // 2. Draw Entities
        this.drawEntities(state);
    }

    /**
     * Draw static map terrain (cached)
     */
    private drawMap(state: GameState) {
        // Check if we need to invalidate cache (map changed)
        const currentMapKey = state.currentMap;

        if (this.lastMapId !== currentMapKey || !this.mapCache) {
            this.updateMapCache(state);
        }

        if (this.mapCache) {
            this.ctx.drawImage(this.mapCache, 0, 0);
        }
    }

    /**
     * Generate cache for the current map
     */
    private updateMapCache(state: GameState) {
        if (!this.mapCache) {
            this.mapCache = document.createElement('canvas');
            this.mapCache.width = this.width;
            this.mapCache.height = this.height;
        }

        const mCtx = this.mapCache.getContext('2d');
        if (!mCtx) return;

        mCtx.fillStyle = '#111'; // Default void color
        mCtx.fillRect(0, 0, this.width, this.height);

        // Determine map data
        let mapData: number[][] = [];
        if (state.currentMap === 'overworld') {
            mapData = state.map;
        } else {
            // Check interior maps
            // e.g., 'overworld_northInterior' -> 'overworld_north'
            // Simplified logic: If we are in an interior, we might want to just show the interior map OR show where we are on the overworld.
            // For now, let's try to show the interior layout if available, or just black if it's dynamic.
            // Actually, state.interiors might have it?

            // If it is a known sub-map (North/East)
            if (state.interiors[state.currentMap]) {
                mapData = state.interiors[state.currentMap].map;
            } else if (state.currentMap.endsWith('Interior')) {
                // It's a house/shop interior, usually small.
                // We might not have a full map array easily accessible here if it's generated on the fly or not in `state.interiors`.
                // For safety, let's just fill with a floor color.
                mCtx.fillStyle = '#3e2723';
                mCtx.fillRect(0, 0, this.width, this.height);
                this.lastMapId = state.currentMap;
                return;
            }
        }

        if (!mapData || mapData.length === 0) return;

        const mapW = mapData[0].length;
        const mapH = mapData.length;

        // Calculate scale to fit map in canvas
        const scaleX = this.width / mapW;
        const scaleY = this.height / mapH;
        const pixelSize = Math.max(scaleX, scaleY); // Fill

        for (let y = 0; y < mapH; y++) {
            for (let x = 0; x < mapW; x++) {
                const tile = mapData[y][x];

                let color = '#000';

                // Color Mapping
                switch (tile) {
                    case TILES.GRASS: color = '#4caf50'; break;
                    case TILES.SOIL: color = '#795548'; break;
                    case TILES.WATER: color = '#29b6f6'; break;
                    case TILES.TREE:
                    case TILES.TREE_OAK:
                        color = '#2e7d32'; break;
                    case TILES.STONE:
                    case TILES.STONE_BOULDER:
                    case TILES.STONE_ORE:
                        color = '#9e9e9e'; break;
                    case TILES.HOUSE:
                    case TILES.SHOP:
                    case TILES.OLD_HOUSE:
                    case TILES.TOWN_HOUSE:
                    case TILES.MAYOR_HOUSE:
                    case TILES.LIBRARY:
                    case TILES.SCHOOL:
                    case TILES.CLINIC:
                    case TILES.CHURCH:
                    case TILES.TAVERN:
                    case TILES.BLACKSMITH:
                    case TILES.TAILOR:
                    case TILES.GUILD:
                    case TILES.BANK:
                    case TILES.WINDMILL:
                    case TILES.MUSEUM:
                    case TILES.COOP:
                    case TILES.BARN:
                        color = '#d32f2f'; break; // Buildings Red
                    case TILES.ROAD: color = '#e0e0e0'; break; // Roads light grey
                    case TILES.FOUNTAIN: color = '#81d4fa'; break;
                    default: color = '#4caf50'; // Default grass
                }

                // Map interior tiles if needed
                if (state.currentMap.endsWith('Interior')) {
                    color = '#5d4037'; // Wood floor
                }

                mCtx.fillStyle = color;
                mCtx.fillRect(Math.floor(x * pixelSize), Math.floor(y * pixelSize), Math.ceil(pixelSize), Math.ceil(pixelSize));
            }
        }

        this.lastMapId = state.currentMap;
    }

    /**
     * Draw dynamic entities on top of the map
     */
    private drawEntities(state: GameState) {
        // Calculate scale matches the cache logic
        // Assuming Overworld 40x40.
        // If map size changes, this logic needs to be robust. 
        // For now hardcoded 40x40 standard map size of 40 tiles.

        const mapW = 40; // Default
        const mapH = 40;
        const scaleX = this.width / mapW;
        const scaleY = this.height / mapH;

        // Draw NPCs
        const currentNpcs = (state.currentMap === 'overworld')
            ? state.npcs
            : (state.interiors[state.currentMap.replace('Interior', '')]?.npcs || []);

        if (currentNpcs) {
            currentNpcs.forEach((npc: any) => {
                const nx = npc.x * scaleX;
                const ny = npc.y * scaleY;

                this.ctx.fillStyle = npc.color || '#ffeb3b';
                this.ctx.beginPath();
                this.ctx.arc(nx + scaleX / 2, ny + scaleY / 2, 2, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }

        // Draw Player
        if (state.player) {
            const px = state.player.gridX * scaleX;
            const py = state.player.gridY * scaleY;

            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(px + scaleX / 2, py + scaleY / 2, 3, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            this.ctx.fill();

            // Draw View Cone / Direction
            // const angle = Math.atan2(state.player.facing.y, state.player.facing.x);
            // ...
        }
    }
}
