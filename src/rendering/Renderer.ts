/**
 * Main Renderer
 * Handles canvas setup, camera, and draw orchestration
 */

import { TILE_SIZE, PALETTE } from '../game/constants';
import { Position } from '../game/state';

interface Size {
    width: number;
    height: number;
}

interface TileRange {
    startX: number;
    endX: number;
    startY: number;
    endY: number;
}

interface Message {
    text: string;
    color: string;
    life: number;
}

interface Light {
    x: number;
    y: number;
    radius: number;
    color?: string;
}

export class Renderer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    lightingCanvas: HTMLCanvasElement | null = null;
    lightingCtx: CanvasRenderingContext2D | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.resize();

        window.addEventListener('resize', () => this.resize());
    }

    /**
     * Resize canvas to window size
     */
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * Get canvas dimensions
     */
    getSize(): Size {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }

    /**
     * Calculate view dimensions based on zoom
     */
    getViewSize(zoom: number): Size {
        return {
            width: this.canvas.width / zoom,
            height: this.canvas.height / zoom
        };
    }

    /**
     * Update camera position to follow player
     */
    updateCamera(playerVisX: number, playerVisY: number, zoom: number, mapWidth: number, mapHeight: number): Position {
        const view = this.getViewSize(zoom);
        const worldWidth = mapWidth * TILE_SIZE;
        const worldHeight = mapHeight * TILE_SIZE;

        let camX = playerVisX + TILE_SIZE / 2 - view.width / 2;
        let camY = playerVisY + TILE_SIZE / 2 - view.height / 2;

        // Clamp to map bounds or center if smaller than view
        if (worldWidth <= view.width) {
            camX = (worldWidth - view.width) / 2;
        } else {
            camX = Math.max(0, Math.min(camX, worldWidth - view.width));
        }

        if (worldHeight <= view.height) {
            camY = (worldHeight - view.height) / 2;
        } else {
            camY = Math.max(0, Math.min(camY, worldHeight - view.height));
        }

        return { x: camX, y: camY };
    }

    /**
     * Get visible tile range for culling
     */
    getVisibleTileRange(camera: Position, zoom: number): TileRange {
        const view = this.getViewSize(zoom);

        return {
            startX: Math.floor(camera.x / TILE_SIZE),
            endX: Math.ceil((camera.x + view.width) / TILE_SIZE) + 1,
            startY: Math.floor(camera.y / TILE_SIZE),
            endY: Math.ceil((camera.y + view.height) / TILE_SIZE) + 1
        };
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.fillStyle = '#121212';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Begin world space drawing
     */
    beginWorldDraw(camera: Position, zoom: number) {
        this.ctx.save();
        this.ctx.scale(zoom, zoom);
        // Round camera coordinates to prevent sub-pixel gaps between tiles
        this.ctx.translate(Math.floor(-camera.x), Math.floor(-camera.y));
    }

    /**
     * End world space drawing
     */
    endWorldDraw() {
        this.ctx.restore();
    }

    /**
     * Draw rain overlay
     */
    drawRainOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 20, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Legacy drawNightOverlay removed

    /**
     * Draw lighting overlay with point lights
     */
    drawLightingOverlay(darkness: number, lights: Light[] = []) {
        if (darkness <= 0) return;

        // Use an offscreen canvas for the lighting multiply pass if needed,
        // but for simple cases we can just fill a rect with multiply blend mode.
        // However, to support 'punch-through' lights, we need a separate buffer.

        if (!this.lightingCanvas) {
            this.lightingCanvas = document.createElement('canvas');
            this.lightingCtx = this.lightingCanvas.getContext('2d');
        }

        if (!this.lightingCtx || !this.lightingCanvas) return;

        this.lightingCanvas.width = this.canvas.width;
        this.lightingCanvas.height = this.canvas.height;

        const lctx = this.lightingCtx;

        // Fill with darkness
        const nightColor = PALETTE.sky_night || '#1a1c2c';
        lctx.fillStyle = nightColor;
        lctx.globalAlpha = darkness;
        lctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        lctx.globalAlpha = 1.0;

        // Punch out lights
        lctx.globalCompositeOperation = 'destination-out';

        for (const light of lights) {
            const rad = light.radius || 100;
            const grad = lctx.createRadialGradient(
                light.x, light.y, 0,
                light.x, light.y, rad
            );
            grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

            lctx.fillStyle = grad;
            lctx.beginPath();
            lctx.arc(light.x, light.y, rad, 0, Math.PI * 2);
            lctx.fill();
        }

        // Draw the lighting buffer back to main canvas using multiply
        this.ctx.globalAlpha = 1.0;
        this.ctx.globalCompositeOperation = 'multiply';
        this.ctx.drawImage(this.lightingCanvas, 0, 0);
        this.ctx.globalCompositeOperation = 'source-over';
    }

    /**
     * Draw facing indicator for player
     */
    drawFacingIndicator() {
        // Find screen position of the tile in front of player
        // Implementation depends on if we want to debug or show reticle
        // For now, let's just leave it empty or draw a highlight if needed
        // Original JS might have had this.

        // Let's implement a simple reticle
        // Actually, let's keep it empty if unused, but to suppress error:
    }

    /**
     * Draw toast messages
     */
    drawMessages(messages: Message[]) {
        let y = this.canvas.height - 180;

        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 16px sans-serif';

        for (const msg of messages) {
            this.ctx.globalAlpha = Math.min(1, msg.life / 40);

            const textWidth = this.ctx.measureText(msg.text).width + 20;

            // Background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(this.canvas.width / 2 - textWidth / 2, y - 15, textWidth, 22);

            // Text
            this.ctx.fillStyle = msg.color;
            this.ctx.fillText(msg.text, this.canvas.width / 2, y);

            y -= 30;
        }

        this.ctx.globalAlpha = 1;
        this.ctx.textAlign = 'left';
    }

    /**
     * Draw movement destination indicator
     */
    drawDestination(destination: Position) {
        const dx = destination.x * TILE_SIZE + TILE_SIZE / 2;
        const dy = destination.y * TILE_SIZE + TILE_SIZE / 2;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(dx, dy, 10, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    /**
     * Convert screen coordinates to world tile
     */
    screenToTile(screenX: number, screenY: number, camera: Position, zoom: number): Position {
        const worldX = (screenX / zoom) + camera.x;
        const worldY = (screenY / zoom) + camera.y;

        return {
            x: Math.floor(worldX / TILE_SIZE),
            y: Math.floor(worldY / TILE_SIZE)
        };
    }
}

export default Renderer;
