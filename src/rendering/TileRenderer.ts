/**
 * Tile Renderer
 * Draws tiles, buildings, and crops
 */

import { TILE_SIZE, TILES, INTERIOR_TILES, SEEDS, SEASON_COLORS, SEASONS, PALETTE } from '../game/constants';
import { Crop } from '../entities/Crop';

export class TileRenderer {
    ctx: CanvasRenderingContext2D;
    private spriteCache: Map<string, HTMLCanvasElement> = new Map();

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Clear the sprite cache (call on season change or resize)
     */
    clearCache() {
        this.spriteCache.clear();
    }

    /**
     * Get a cached sprite or create it
     */
    private getCachedSprite(key: string, width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
        if (this.spriteCache.has(key)) {
            return this.spriteCache.get(key)!;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        drawFn(ctx);

        this.spriteCache.set(key, canvas);
        return canvas;
    }

    /**
     * Get season colors
     */
    getSeasonColors(seasonIndex: number) {
        const seasonName = SEASONS[seasonIndex] || 'Spring';
        return SEASON_COLORS[seasonName as keyof typeof SEASON_COLORS] || SEASON_COLORS.Spring;
    }

    /**
     * Check if this tile is the top-left corner of a building
     */
    isTopLeftCorner(map: number[][], x: number, y: number, tileType: number): boolean {
        const hasAbove = y > 0 && map[y - 1] && map[y - 1][x] === tileType;
        const hasLeft = x > 0 && map[y][x - 1] === tileType;
        return !hasAbove && !hasLeft;
    }

    /**
     * Check if this tile is the bottom-left corner of a building
     * Used for y-sorting.
     */
    isBottomLeftCorner(map: number[][], x: number, y: number, tileType: number): boolean {
        const hasBelow = y < map.length - 1 && map[y + 1] && map[y + 1][x] === tileType;
        const hasLeft = x > 0 && map[y][x - 1] === tileType;
        return !hasBelow && !hasLeft;
    }

    /**
     * Draw a single tile
     */
    drawTile(tileType: number, x: number, y: number, seasonIndex: number, map?: number[][]) {
        const ctx = this.ctx;
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        const colors = this.getSeasonColors(seasonIndex);

        switch (tileType) {
            case TILES.GRASS: {
                // ... same grass logic ...
                // Grass is cheap and variant-heavy (random), so maybe don't cache or cache a set of variants
                // For now keep as is or optimize later. Grass is simple rects.
                // Re-implementing original logic for compactness
                const gSeed = (x * 12345) ^ (y * 67890);
                const gRand = (Math.abs(gSeed) % 10) / 100;
                ctx.fillStyle = colors.grass;
                if (gRand > 0.05) ctx.fillStyle = colors.grass;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = 'rgba(0,0,0,' + (gRand * 0.05) + ')';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                break;
            }

            case TILES.SOIL:
                if (map) this.drawAutotiledSoil(ctx, px, py, x, y, map);
                else {
                    ctx.fillStyle = '#795548';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                }
                break;

            case TILES.TREE:
                // Cache Tree
                // Draw sprite centered in 100x100 canvas
                const treeKey = `TREE_${seasonIndex}`;
                const treeSprite = this.getCachedSprite(treeKey, 100, 100, (c) => {
                    this.drawTree(c, 50, 50, colors);
                });
                // Draw sprite so 50,50 aligns with tile center? 
                // drawTree(c, 50, 50) draws tree at 50,50.
                // In drawTile, tree was drawn at px, py.
                // Specifically: shadow at px+25, py+45.
                // Use offset -25, -25 relative to px,py?
                // Let's check drawTree implementation below.
                // If I draw at 0,0 in cached sprite, I need to shift when drawing cache.
                // Let's standardize: Cached Sprite top-left is Px, Py (but extended).
                ctx.drawImage(treeSprite, px - 25, py - 25);
                break;

            case TILES.STONE:
                const stoneKey = 'STONE';
                const stoneSprite = this.getCachedSprite(stoneKey, 75, 75, (c) => {
                    this.drawStone(c, 37, 37);
                });
                ctx.drawImage(stoneSprite, px - 12, py - 12);
                break;

            case TILES.STONE_ORE:
                const oreKey = 'STONE_ORE';
                const oreSprite = this.getCachedSprite(oreKey, 75, 75, (c) => {
                    this.drawStoneOre(c, 37, 37);
                });
                ctx.drawImage(oreSprite, px - 12, py - 12);
                break;

            case TILES.STONE_BOULDER:
                const boulderKey = 'STONE_BOULDER';
                const boulderSprite = this.getCachedSprite(boulderKey, 75, 75, (c) => {
                    this.drawBoulder(c, 37, 37);
                });
                ctx.drawImage(boulderSprite, px - 12, py - 12);
                break;

            case TILES.TREE_OAK:
                const oakKey = 'TREE_OAK'; // Oak doesn't change color currently
                const oakSprite = this.getCachedSprite(oakKey, 100, 100, (c) => {
                    this.drawOak(c, 50, 50);
                });
                ctx.drawImage(oakSprite, px - 25, py - 25);
                break;

            case TILES.HOUSE:
                if (map && this.isBottomLeftCorner(map, x, y, TILES.HOUSE)) {
                    // Cache House
                    const houseKey = 'HOUSE';
                    const hSize = TILE_SIZE * 3;
                    const houseSprite = this.getCachedSprite(houseKey, hSize, hSize, (c) => {
                        this.drawHouse3x3(0, 0, c); // Draw at 0,0 of cached canvas
                    });
                    // drawHouse3x3 was called with py - (TILE_SIZE * 2).
                    // If cached sprite is drawn at 0,0, we draw image at px, py - (TILE_SIZE * 2)
                    ctx.drawImage(houseSprite, px, py - (TILE_SIZE * 2));
                }
                break;

            case TILES.SHOP:
                if (map && this.isBottomLeftCorner(map, x, y, TILES.SHOP)) {
                    const shopKey = 'SHOP';
                    const sSize = TILE_SIZE * 3;
                    const shopSprite = this.getCachedSprite(shopKey, sSize, sSize, (c) => {
                        this.drawShop3x3(0, 0, c);
                    });
                    ctx.drawImage(shopSprite, px, py - (TILE_SIZE * 2));
                }
                break;

            case TILES.OLD_HOUSE:
                if (map && this.isBottomLeftCorner(map, x, y, TILES.OLD_HOUSE)) {
                    const oldKey = 'OLD_HOUSE';
                    const oW = TILE_SIZE * 8;
                    const oH = TILE_SIZE * 4;
                    const oldSprite = this.getCachedSprite(oldKey, oW, oH, (c) => {
                        this.drawOldHouse8x4(0, 0, c);
                    });
                    ctx.drawImage(oldSprite, px, py - (TILE_SIZE * 3));
                }
                break;

            case TILES.COOP:
                if (map && this.isBottomLeftCorner(map, x, y, TILES.COOP)) {
                    const coopKey = 'COOP';
                    const coopW = TILE_SIZE * 6;
                    const coopH = TILE_SIZE * 4;
                    const coopSprite = this.getCachedSprite(coopKey, coopW, coopH, (c) => {
                        this.drawCoop6x4(0, 0, c);
                    });
                    ctx.drawImage(coopSprite, px, py - (TILE_SIZE * 3));
                }
                break;

            case TILES.BARN:
                if (map && this.isBottomLeftCorner(map, x, y, TILES.BARN)) {
                    const barnKey = 'BARN';
                    const barnW = TILE_SIZE * 8;
                    const barnH = TILE_SIZE * 4;
                    const barnSprite = this.getCachedSprite(barnKey, barnW, barnH, (c) => {
                        this.drawBarn8x4(0, 0, c);
                    });
                    ctx.drawImage(barnSprite, px, py - (TILE_SIZE * 3));
                }
                break;

            case TILES.WITHERED:
                this.drawWithered(ctx, px, py);
                break;

            case TILES.CAVE:
                this.drawCave(ctx, px, py);
                break;

            default:
                ctx.fillStyle = colors.grass;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
    }

    // --- Extracted Draw Methods ---

    drawTree(ctx: CanvasRenderingContext2D, px: number, py: number, colors: any) {
        // Adjusted offsets assuming px,py is center-ish or top-left?
        // Helper: in drawTile, we call drawTree(c, 50, 50).
        // In original: px,py was top-left of tile.
        // Shadow: px+25, py+45.  (Relative to 50,50 -> +0, +20) -> (50, 70)
        // Trunk: px+21, py+15. -> (-4, -10) -> (46, 40) relative to 50,50?
        // Wait.
        // Calling `drawTree(c, 50, 50)` means `px=50, py=50`.
        // Original: `ctx.ellipse(px + 25, ...)`
        // If px=50, ellipse at 75?
        // We drawImage at `original_px - 25`.
        // So `new_px = original_px - 25`.
        // `drawTree` draws at `50`. canvas coordinate `75`.
        // Screen coordinate: `original_px - 25 + 75 = original_px + 50`.
        // Original shadow: `original_px + 25`.
        // Discrepancy of 25.
        //
        // Let's reset.
        // Original: `shadow at px+25`.
        // New: `drawImage(sprite, px-25, ...)`. Sprite has shadow at X.
        // `px - 25 + X = px + 25` => `X = 50`.
        // So if I pass `px=25, py=25` to drawTree, then `px+25` becomes `50` (center of 75x75 sprite?).
        // Let's use `drawTree` exactly as the original code block, but pass relative coordinates.

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(px + 25, py + 45, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Trunk
        ctx.fillStyle = PALETTE.wood;
        ctx.fillRect(px + 21, py + 15, 8, 30);
        // Lower Leaves
        ctx.fillStyle = colors.tree;
        ctx.beginPath();
        ctx.arc(px + 25, py + 5, 20, 0, Math.PI * 2);
        ctx.fill();
        // Upper Leaves
        ctx.beginPath();
        ctx.arc(px + 25, py - 10, 16, 0, Math.PI * 2);
        ctx.fill();
        // Highlight
        ctx.fillStyle = PALETTE.leaf_light + '22';
        ctx.beginPath();
        ctx.arc(px + 20, py - 15, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    drawStone(ctx: CanvasRenderingContext2D, px: number, py: number) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(px + 25, py + 40, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Rock Structure
        ctx.fillStyle = PALETTE.stone_dark;
        ctx.beginPath();
        ctx.moveTo(px + 10, py + 40);
        ctx.lineTo(px + 10, py + 25);
        ctx.lineTo(px + 20, py + 15);
        ctx.lineTo(px + 40, py + 15);
        ctx.lineTo(px + 45, py + 30);
        ctx.lineTo(px + 45, py + 40);
        ctx.closePath();
        ctx.fill();
        // Top Highlight
        ctx.fillStyle = PALETTE.stone;
        ctx.beginPath();
        ctx.moveTo(px + 20, py + 15);
        ctx.lineTo(px + 40, py + 15);
        ctx.lineTo(px + 43, py + 25);
        ctx.lineTo(px + 15, py + 25);
        ctx.closePath();
        ctx.fill();
    }

    drawStoneOre(ctx: CanvasRenderingContext2D, px: number, py: number) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(px + 25, py + 40, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Rock
        ctx.fillStyle = PALETTE.stone_dark;
        ctx.beginPath();
        ctx.moveTo(px + 10, py + 40);
        ctx.lineTo(px + 10, py + 25);
        ctx.lineTo(px + 25, py + 15);
        ctx.lineTo(px + 40, py + 25);
        ctx.lineTo(px + 40, py + 40);
        ctx.closePath();
        ctx.fill();
        // Ore Highlight
        ctx.fillStyle = PALETTE.orange;
        ctx.fillRect(px + 18, py + 22, 6, 6);
        ctx.fillRect(px + 28, py + 28, 4, 4);
    }

    drawBoulder(ctx: CanvasRenderingContext2D, px: number, py: number) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(px + 25, py + 42, 18, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Large Boulder
        ctx.fillStyle = '#616161';
        ctx.beginPath();
        ctx.ellipse(px + 25, py + 30, 20, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        // Upper highlight
        ctx.fillStyle = '#757575';
        ctx.beginPath();
        ctx.ellipse(px + 22, py + 25, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawOak(ctx: CanvasRenderingContext2D, px: number, py: number) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(px + 25, py + 45, 18, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Trunk
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(px + 16, py + 10, 18, 35);
        // Large Round Leaves
        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.arc(px + 25, py - 5, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px + 10, py + 5, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px + 40, py + 5, 15, 0, Math.PI * 2);
        ctx.fill();
    }

    drawWithered(ctx: CanvasRenderingContext2D, px: number, py: number) {
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#6d5847';
        ctx.fillRect(px + 8, py + 15, 4, 20);
        ctx.fillRect(px + 20, py + 10, 3, 25);
        ctx.fillRect(px + 35, py + 18, 4, 18);
        ctx.fillStyle = '#8b7355';
        ctx.beginPath();
        ctx.ellipse(px + 10, py + 12, 6, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(px + 22, py + 8, 5, 3, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(px + 38, py + 15, 5, 3, 0.5, 0, Math.PI * 2);
        ctx.fill();
    }


    /**
     * Draw Grass Decoration
     */
    drawGrassDecoration(_ctx: CanvasRenderingContext2D, _px: number, _py: number, _x: number, _y: number) {
        // Implementation for grass variation
    }

    /**
     * Draw Autotiled Soil (simplified placeholder)
     */
    drawAutotiledSoil(ctx: CanvasRenderingContext2D, px: number, py: number, _x: number, _y: number, _map: number[][]) {
        ctx.fillStyle = '#795548';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    }

    /**
     * Draw a 3x3 house
     */
    drawHouse3x3(px: number, py: number, ctx: CanvasRenderingContext2D) {
        const size = TILE_SIZE * 3;
        const wallTop = py + 35;
        const wallBottom = py + size - 5;
        const wallHeight = wallBottom - wallTop;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(px + size / 2, py + size - 2, size / 2.2, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3/4 Perspective Walls
        // Side Wall (darker)
        ctx.fillStyle = '#a1887f';
        ctx.fillRect(px + size - 20, wallTop, 12, wallHeight);

        // Front Wall
        ctx.fillStyle = '#d7ccc8';
        ctx.fillRect(px + 8, wallTop, size - 28, wallHeight);

        // Wall Detail/Outline
        ctx.strokeStyle = '#8d736b';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 8, wallTop, size - 28, wallHeight);

        // Roof (3/4 Gabled)
        ctx.fillStyle = '#4e342e'; // Main roof color
        ctx.beginPath();
        ctx.moveTo(px + 2, wallTop);
        ctx.lineTo(px + size / 2 - 10, py + 10);
        ctx.lineTo(px + size - 15, wallTop);
        ctx.closePath();
        ctx.fill();

        // Roof Trim/Depth
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.moveTo(px + size / 2 - 10, py + 10);
        ctx.lineTo(px + size - 5, py + 15);
        ctx.lineTo(px + size - 15, wallTop);
        ctx.closePath();
        ctx.fill();

        // Door (aligned to center tile)
        const doorWidth = 24;
        const doorHeight = 40;
        const doorX = px + TILE_SIZE + (TILE_SIZE / 2) - (doorWidth / 2);
        const doorY = wallBottom - doorHeight;

        // Door Frame
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(doorX - 2, doorY - 4, doorWidth + 4, doorHeight + 4);

        // Door Body
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(doorX, doorY, doorWidth, doorHeight);

        // Door handle
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(doorX + doorWidth - 6, doorY + doorHeight / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Windows (with depth frames)
        const windowSize = 22;
        const winY = wallTop + 15;
        this.drawFramedWindow(ctx, px + 22, winY, windowSize);
        this.drawFramedWindow(ctx, px + size - 50, winY, windowSize);
    }

    drawFramedWindow(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
        // Frame
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(x - 2, y - 2, size + 4, size + 4);
        // Glass
        ctx.fillStyle = '#81d4fa';
        ctx.fillRect(x, y, size, size);
        // Reflection
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.closePath();
        ctx.fill();
        // Crossbars
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + size / 2, y);
        ctx.lineTo(x + size / 2, y + size);
        ctx.moveTo(x, y + size / 2);
        ctx.lineTo(x + size, y + size / 2);
        ctx.stroke();
    }

    /**
     * Draw a 3x3 shop
     */
    drawShop3x3(px: number, py: number, ctx: CanvasRenderingContext2D) {
        const size = TILE_SIZE * 3;
        const buildingTop = py + 25;
        const buildingBottom = py + size - 5;
        const buildingHeight = buildingBottom - buildingTop;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(px + size / 2, py + size - 2, size / 2.2, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3/4 Perspective Walls
        // Side Wall (darker)
        ctx.fillStyle = '#37474f';
        ctx.fillRect(px + size - 20, buildingTop, 12, buildingHeight);

        // Building body
        ctx.fillStyle = '#546e7a';
        ctx.fillRect(px + 8, buildingTop, size - 28, buildingHeight);

        // Building outline
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 8, buildingTop, size - 28, buildingHeight);

        // Flat Roof with depth
        ctx.fillStyle = '#263238';
        ctx.fillRect(px + 4, buildingTop - 5, size - 20, 10);

        // Awning (slanted for perspective)
        const awningTop = buildingTop + 5;
        const awningHeight = 25;
        ctx.fillStyle = '#e53935';
        ctx.fillRect(px + 4, awningTop, size - 12, awningHeight);

        // Awning stripes
        ctx.fillStyle = 'white';
        const stripeWidth = (size - 12) / 8;
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(px + 4 + (i * 2 * stripeWidth), awningTop, stripeWidth, awningHeight);
        }

        // Sign (3D effect)
        const signTop = py + 5;
        ctx.fillStyle = '#4e342e'; // Wood post
        ctx.fillRect(px + size / 2 - 2, signTop + 10, 4, 15);

        ctx.fillStyle = '#ffeb3b';
        ctx.fillRect(px + size / 2 - 35, signTop, 70, 24);
        ctx.strokeStyle = '#f9a825';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + size / 2 - 35, signTop, 70, 24);

        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SHOP', px + size / 2, signTop + 13);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        // Door (centered)
        const doorWidth = 24;
        const doorHeight = 40;
        const doorX = px + TILE_SIZE + (TILE_SIZE / 2) - (doorWidth / 2);
        const doorY = buildingBottom - doorHeight;

        ctx.fillStyle = '#1b1b1b';
        ctx.fillRect(doorX, doorY, doorWidth, doorHeight);
        ctx.strokeStyle = '#37474f';
        ctx.lineWidth = 2;
        ctx.strokeRect(doorX, doorY, doorWidth, doorHeight);

        // Display windows
        const windowWidth = 26;
        const windowHeight = 24;
        const windowY = awningTop + awningHeight + 5;

        ctx.fillStyle = '#000'; // Window interior
        ctx.fillRect(px + 15, windowY, windowWidth, windowHeight);
        ctx.fillRect(px + size - 15 - windowWidth - 12, windowY, windowWidth, windowHeight);

        // Window frames
        ctx.strokeStyle = '#cfd8dc';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 15, windowY, windowWidth, windowHeight);
        ctx.strokeRect(px + size - 15 - windowWidth - 12, windowY, windowWidth, windowHeight);

        // Window items
        ctx.fillStyle = '#ff9800';
        ctx.fillRect(px + 18, windowY + 8, 8, 10);
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(px + size - 25 - 12, windowY + 8, 8, 10);
    }

    /**
     * Draw Old House (8x4)
     */
    drawOldHouse8x4(px: number, py: number, ctx: CanvasRenderingContext2D) {
        const width = TILE_SIZE * 8;
        const height = TILE_SIZE * 4;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(px + width / 2, py + height - 5, width / 2 - 10, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3/4 Perspective Walls
        // Side Wall (darker)
        ctx.fillStyle = PALETTE.wood_dark;
        ctx.fillRect(px + width - 40, py + 40, 20, height - 50);

        // Front Wall
        ctx.fillStyle = PALETTE.wood;
        ctx.fillRect(px + 20, py + 40, width - 60, height - 50);

        // Wall Detail/Outline
        ctx.strokeStyle = '#2d1b18';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 20, py + 40, width - 60, height - 50);

        // Roof (Weathered shingles with depth)
        ctx.fillStyle = '#263238'; // Darker roof
        ctx.beginPath();
        ctx.moveTo(px + 5, py + 40);
        ctx.lineTo(px + width / 2, py + 5);
        ctx.lineTo(px + width - 15, py + 40);
        ctx.closePath();
        ctx.fill();

        // Roof Trim
        ctx.strokeStyle = '#37474f';
        ctx.lineWidth = 3;
        ctx.strokeRect(px + 5, py + 40, width - 20, 2);

        // Door (Aligned to tiles 3 and 4)
        // Door is 2 tiles wide (100px), centered roughly
        const doorW = TILE_SIZE * 2;
        const doorH = 65;
        const doorX = px + TILE_SIZE * 3; // Exactly aligned to column 4 (if 0-indexed) or similar
        const doorY = py + height - 10 - doorH;

        // Door Frame
        ctx.fillStyle = '#1b1b1b';
        ctx.fillRect(doorX - 4, doorY - 4, doorW + 8, doorH + 4);

        // Door Body
        ctx.fillStyle = '#212121';
        ctx.fillRect(doorX, doorY, doorW, doorH);

        // Door Detail (Boarded)
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(doorX + 10, doorY + 20, doorW - 20, 8);
        ctx.fillRect(doorX + 10, doorY + 40, doorW - 20, 8);

        // Windows (Boarded up)
        this.drawBoardedWindow(ctx, px + 50, py + 70);
        this.drawBoardedWindow(ctx, px + width - 120, py + 70);
    }

    drawBoardedWindow(ctx: CanvasRenderingContext2D, x: number, y: number) {
        ctx.fillStyle = '#000';
        ctx.fillRect(x, y, 40, 40);
        ctx.fillStyle = '#8d6e63';
        // Boards
        ctx.save();
        ctx.translate(x + 20, y + 20);
        ctx.rotate(0.1);
        ctx.fillRect(-22, -5, 44, 10);
        ctx.rotate(-0.2);
        ctx.fillRect(-22, -5, 44, 10);
        ctx.restore();
    }

    /**
     * Draw Coop (6x4)
     * Yellow wooden coop for chickens
     */
    drawCoop6x4(px: number, py: number, ctx: CanvasRenderingContext2D) {
        const width = TILE_SIZE * 6;
        const height = TILE_SIZE * 4;

        // Base/Foundation
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(px, py + height - 20, width, 20);

        // Main body (yellow wood)
        ctx.fillStyle = '#ffcc80';
        ctx.fillRect(px + 10, py + 30, width - 20, height - 50);

        // Roof
        ctx.fillStyle = '#8d6e63';
        ctx.beginPath();
        ctx.moveTo(px, py + 35);
        ctx.lineTo(px + width / 2, py);
        ctx.lineTo(px + width, py + 35);
        ctx.closePath();
        ctx.fill();

        // Roof outline
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Door (center bottom)
        const doorW = TILE_SIZE * 1.5;
        const doorH = 60;
        const doorX = px + width / 2 - doorW / 2;
        const doorY = py + height - 20 - doorH;

        ctx.fillStyle = '#5d4037';
        ctx.fillRect(doorX, doorY, doorW, doorH);

        // Door arch
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.arc(doorX + doorW / 2, doorY, doorW / 2, Math.PI, 0);
        ctx.fill();

        // Windows
        const windowSize = 25;
        ctx.fillStyle = '#81d4fa';
        ctx.fillRect(px + 40, py + 60, windowSize, windowSize);
        ctx.fillRect(px + width - 65, py + 60, windowSize, windowSize);

        // Window frames
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 40, py + 60, windowSize, windowSize);
        ctx.strokeRect(px + width - 65, py + 60, windowSize, windowSize);
    }

    /**
     * Draw Barn (8x4)
     * Red barn for cows
     */
    drawBarn8x4(px: number, py: number, ctx: CanvasRenderingContext2D) {
        const width = TILE_SIZE * 8;
        const height = TILE_SIZE * 4;

        // Base/Foundation
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(px, py + height - 20, width, 20);

        // Main body (red wood)
        ctx.fillStyle = '#c62828';
        ctx.fillRect(px + 10, py + 40, width - 20, height - 60);

        // Barn front X pattern
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(px + 20, py + 50);
        ctx.lineTo(px + width - 20, py + height - 30);
        ctx.moveTo(px + width - 20, py + 50);
        ctx.lineTo(px + 20, py + height - 30);
        ctx.stroke();

        // Roof (gambrel style)
        ctx.fillStyle = '#8d6e63';
        ctx.beginPath();
        ctx.moveTo(px, py + 45);
        ctx.lineTo(px + width * 0.2, py + 25);
        ctx.lineTo(px + width / 2, py);
        ctx.lineTo(px + width * 0.8, py + 25);
        ctx.lineTo(px + width, py + 45);
        ctx.closePath();
        ctx.fill();

        // Roof outline
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Large barn door
        const doorW = TILE_SIZE * 2;
        const doorH = 80;
        const doorX = px + width / 2 - doorW / 2;
        const doorY = py + height - 20 - doorH;

        ctx.fillStyle = '#5d4037';
        ctx.fillRect(doorX, doorY, doorW, doorH);

        // Door horizontal lines
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(doorX + 5, doorY + 20);
        ctx.lineTo(doorX + doorW - 5, doorY + 20);
        ctx.moveTo(doorX + 5, doorY + 40);
        ctx.lineTo(doorX + doorW - 5, doorY + 40);
        ctx.moveTo(doorX + 5, doorY + 60);
        ctx.lineTo(doorX + doorW - 5, doorY + 60);
        ctx.stroke();

        // Hay loft window
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(px + width / 2, py + 25, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffc107';
        ctx.beginPath();
        ctx.arc(px + width / 2, py + 25, 12, 0, Math.PI * 2);
        ctx.fill();
    }


    /**
     * Draw a crop
     */
    drawCrop(crop: Crop, x: number, y: number) {
        const ctx = this.ctx;
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        const growth = crop.stage / 100;
        const data = SEEDS[crop.type];

        if (data.isTree) {
            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(px + 25, py + 45, 12, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            if (growth < 0.5) {
                // Sapling (3/4)
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(px + 23, py + 25, 4, 20);
                ctx.fillStyle = '#43a047';
                ctx.beginPath();
                ctx.arc(px + 25, py + 20, 10, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Fruit tree (Match Overworld style)
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(px + 21, py + 15, 8, 30);
                // Lower Leaves
                ctx.fillStyle = '#2e7d32';
                ctx.beginPath();
                ctx.arc(px + 25, py + 5, 20, 0, Math.PI * 2);
                ctx.fill();
                // Upper Leaves
                ctx.beginPath();
                ctx.arc(px + 25, py - 10, 16, 0, Math.PI * 2);
                ctx.fill();

                // Fruit
                if (growth >= 1) {
                    ctx.fillStyle = data.color || '#e53935';
                    ctx.beginPath();
                    ctx.arc(px + 15, py + 5, 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(px + 35, py, 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(px + 25, py + 12, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        else {
            // Regular crop
            ctx.fillStyle = '#8bc34a';

            if (growth < 0.5) {
                // Seedling
                ctx.fillRect(px + 22, py + 25, 6, 8);
            } else {
                // Growing plant
                const h = 10 + (15 * growth);
                ctx.fillStyle = '#689f38';
                ctx.fillRect(px + 22, py + 40 - h, 6, h);

                // Harvestable produce
                if (growth >= 1) {
                    ctx.fillStyle = data.color;
                    ctx.beginPath();
                    ctx.arc(px + 25, py + 40 - h, 7, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    /**
     * Draw an interior tile
     */
    drawInteriorTile(tileType: number, x: number, y: number) {
        const ctx = this.ctx;
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        switch (tileType) {
            case INTERIOR_TILES.FLOOR:
                // Wooden floor
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Floor boards
                ctx.strokeStyle = PALETTE.wood_dark;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(px, py + 10);
                ctx.lineTo(px + TILE_SIZE, py + 10);
                ctx.moveTo(px, py + 25);
                ctx.lineTo(px + TILE_SIZE, py + 25);
                ctx.moveTo(px, py + 40);
                ctx.lineTo(px + TILE_SIZE, py + 40);
                ctx.stroke();
                break;

            case INTERIOR_TILES.WALL:
                // Stone/plaster wall
                ctx.fillStyle = PALETTE.white;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Wall texture hints
                ctx.fillStyle = PALETTE.stone;
                ctx.fillRect(px + 2, py + 5, 10, 4);
                ctx.fillRect(px + 30, py + 15, 8, 4);
                break;

            case INTERIOR_TILES.DOOR:
                // Floor first
                ctx.fillStyle = '#deb887';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Door mat
                ctx.fillStyle = '#8d6e63';
                ctx.fillRect(px + 5, py + 5, TILE_SIZE - 10, TILE_SIZE - 10);
                // Welcome text
                ctx.fillStyle = '#5d4037';
                ctx.font = '8px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('EXIT', px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 3);
                ctx.textAlign = 'left';
                break;

            case INTERIOR_TILES.BED:
                // Floor
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(px + 4, py + 6, TILE_SIZE - 4, TILE_SIZE - 4);
                // Bed frame (3/4)
                ctx.fillStyle = PALETTE.wood_dark;
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 6, TILE_SIZE - 4);
                // Mattress
                ctx.fillStyle = PALETTE.white;
                ctx.fillRect(px + 5, py + 8, TILE_SIZE - 12, TILE_SIZE - 15);
                // Headboard
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 6, 8);
                // Pillow
                ctx.fillStyle = PALETTE.white;
                ctx.fillRect(px + 10, py + 10, TILE_SIZE - 20, 8);
                // Blanket
                ctx.fillStyle = PALETTE.water_dark;
                ctx.fillRect(px + 5, py + 22, TILE_SIZE - 12, 20);
                break;

            case INTERIOR_TILES.TABLE:
                // Floor
                ctx.fillStyle = '#deb887';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(px + 8, py + 25, TILE_SIZE - 16, 20);
                // Table Legs (Front)
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(px + 8, py + 25, 4, 15);
                ctx.fillRect(px + TILE_SIZE - 12, py + 25, 4, 15);
                // Table top
                ctx.fillStyle = '#795548';
                ctx.fillRect(px + 5, py + 10, TILE_SIZE - 10, 15);
                // Top Detail
                ctx.strokeStyle = '#5d4037';
                ctx.lineWidth = 1;
                ctx.strokeRect(px + 5, py + 10, TILE_SIZE - 10, 15);
                break;

            case INTERIOR_TILES.RUG:
                // Floor
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Rug (More decorative, less like a chair)
                ctx.fillStyle = PALETTE.red;
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                // Pattern
                ctx.strokeStyle = PALETTE.highlight;
                ctx.lineWidth = 2;
                ctx.strokeRect(px + 8, py + 8, TILE_SIZE - 16, TILE_SIZE - 16);
                break;

            case INTERIOR_TILES.CHAIR:
                // Floor
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Chair Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillRect(px + 10, py + 10, TILE_SIZE - 20, TILE_SIZE - 20);
                // Chair Legs
                ctx.fillStyle = PALETTE.wood_dark;
                ctx.fillRect(px + 12, py + 12, 4, 4);
                ctx.fillRect(px + TILE_SIZE - 16, py + 12, 4, 4);
                ctx.fillRect(px + 12, py + TILE_SIZE - 16, 4, 4);
                ctx.fillRect(px + TILE_SIZE - 16, py + TILE_SIZE - 16, 4, 4);
                // Chair Seat
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px + 10, py + 10, TILE_SIZE - 20, TILE_SIZE - 20);
                // Chair Back
                ctx.fillStyle = PALETTE.wood_dark;
                ctx.fillRect(px + 10, py + 10, TILE_SIZE - 20, 6);
                break;

            case INTERIOR_TILES.STOVE:
                // Floor
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Stove body
                ctx.fillStyle = PALETTE.black;
                ctx.fillRect(px + 5, py + 10, TILE_SIZE - 10, TILE_SIZE - 15);
                // Stove top
                ctx.fillStyle = PALETTE.stone_dark;
                ctx.fillRect(px + 5, py + 5, TILE_SIZE - 10, 10);
                // Burners
                ctx.fillStyle = PALETTE.red;
                ctx.beginPath();
                ctx.arc(px + 18, py + 10, 5, 0, Math.PI * 2);
                ctx.arc(px + 32, py + 10, 5, 0, Math.PI * 2);
                ctx.fill();
                break;

            case INTERIOR_TILES.CHEST:
                // Floor
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Chest body
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px + 5, py + 15, TILE_SIZE - 10, TILE_SIZE - 20);
                // Chest lid
                ctx.fillStyle = PALETTE.wood_dark;
                ctx.fillRect(px + 5, py + 10, TILE_SIZE - 10, 10);
                // Lock
                ctx.fillStyle = PALETTE.highlight;
                ctx.fillRect(px + 20, py + 18, 8, 8);
                break;

            case INTERIOR_TILES.COUNTER:
                // Floor
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Counter body
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(px + 2, py + 10, TILE_SIZE - 4, TILE_SIZE - 10);
                // Counter top
                ctx.fillStyle = '#a1887f';
                ctx.fillRect(px, py + 5, TILE_SIZE, 12);
                // Shadow under lip
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillRect(px + 2, py + 17, TILE_SIZE - 4, 3);
                break;

            case INTERIOR_TILES.SHELF:
                // Floor
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Shelf back
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(px + 2, py + 5, TILE_SIZE - 4, TILE_SIZE - 10);
                // Shelves
                ctx.fillStyle = '#8d6e63';
                ctx.fillRect(px + 4, py + 15, TILE_SIZE - 8, 4);
                ctx.fillRect(px + 4, py + 30, TILE_SIZE - 8, 4);
                // Items
                ctx.fillStyle = '#ffcc80';
                ctx.fillRect(px + 6, py + 8, 4, 6);
                ctx.fillStyle = '#81d4fa';
                ctx.fillRect(px + 15, py + 8, 4, 6);
                break;

            case INTERIOR_TILES.TV:
                // Floor
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // TV Stand
                ctx.fillStyle = '#424242';
                ctx.fillRect(px + 8, py + 25, TILE_SIZE - 16, 12);
                // TV Screen (Off)
                ctx.fillStyle = '#000';
                ctx.fillRect(px + 5, py + 5, TILE_SIZE - 10, 20);
                // Screen Frame
                ctx.strokeStyle = '#616161';
                ctx.lineWidth = 2;
                ctx.strokeRect(px + 5, py + 5, TILE_SIZE - 10, 20);
                // Antenna
                ctx.strokeStyle = '#9e9e9e';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(px + TILE_SIZE / 2, py + 5);
                ctx.lineTo(px + TILE_SIZE / 2 - 5, py - 2);
                ctx.moveTo(px + TILE_SIZE / 2, py + 5);
                ctx.lineTo(px + TILE_SIZE / 2 + 5, py - 2);
                ctx.stroke();
                break;

            case INTERIOR_TILES.COUCH:
                // Floor
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Couch Body
                ctx.fillStyle = '#5c6bc0';
                ctx.fillRect(px + 2, py + 15, TILE_SIZE - 4, 20);
                // Couch Back
                ctx.fillStyle = '#3949ab';
                ctx.fillRect(px + 2, py + 5, TILE_SIZE - 4, 10);
                // Cushions
                ctx.fillStyle = '#7986cb';
                ctx.fillRect(px + 5, py + 15, 18, 18);
                ctx.fillRect(px + 27, py + 15, 18, 18);
                break;

            case INTERIOR_TILES.PLANT:
                // Floor
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Pot
                ctx.fillStyle = '#d84315';
                ctx.beginPath();
                ctx.moveTo(px + 15, py + 40);
                ctx.lineTo(px + 35, py + 40);
                ctx.lineTo(px + 40, py + 25);
                ctx.lineTo(px + 10, py + 25);
                ctx.closePath();
                ctx.fill();
                // Plant
                ctx.fillStyle = '#4caf50';
                ctx.beginPath();
                ctx.ellipse(px + 25, py + 20, 10, 15, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(px + 15, py + 25, 8, 12, -0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(px + 35, py + 25, 8, 12, 0.5, 0, Math.PI * 2);
                ctx.fill();
                break;

            case INTERIOR_TILES.BASKET:
                // Floor
                ctx.fillStyle = '#deb887';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Basket body (woven look)
                ctx.fillStyle = '#a1887f';
                ctx.beginPath();
                ctx.ellipse(px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 5, 18, 12, 0, 0, Math.PI * 2);
                ctx.fill();
                // Basket rim
                ctx.strokeStyle = '#6d4c41';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(px + TILE_SIZE / 2, py + TILE_SIZE / 2 - 5, 18, 8, 0, 0, Math.PI * 2);
                ctx.stroke();
                // Eggs inside
                ctx.fillStyle = '#fff8e1';
                ctx.beginPath();
                ctx.ellipse(px + TILE_SIZE / 2 - 5, py + TILE_SIZE / 2, 5, 7, 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(px + TILE_SIZE / 2 + 5, py + TILE_SIZE / 2 + 2, 5, 7, -0.2, 0, Math.PI * 2);
                ctx.fill();
                break;

            case INTERIOR_TILES.PAIL:
                // ...pail logic...
                break;

            case TILES.DUNGEON_FLOOR:
                ctx.fillStyle = '#424242'; // Dark floor
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Grid pattern
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
                break;

            case TILES.DUNGEON_WALL:
                ctx.fillStyle = '#212121'; // Very dark wall
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Brick detail
                ctx.strokeStyle = '#444';
                ctx.lineWidth = 2;
                ctx.strokeRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                break;

            case TILES.DUNGEON_STAIRS:
                ctx.fillStyle = '#757575';
                ctx.fillRect(px + 5, py + 5, TILE_SIZE - 10, TILE_SIZE - 10);
                // Stairs lines
                ctx.strokeStyle = '#424242';
                ctx.lineWidth = 3;
                for (let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.moveTo(px + 10, py + 12 + i * 8);
                    ctx.lineTo(px + TILE_SIZE - 10, py + 12 + i * 8);
                    ctx.stroke();
                }
                break;

            default:
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
    }

    drawCave(ctx: CanvasRenderingContext2D, px: number, py: number) {
        ctx.fillStyle = PALETTE.stone_dark;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        // Cave opening
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE, TILE_SIZE / 2, Math.PI, 0);
        ctx.fill();
    }

    /**
     * Draw NPC (including creeps)
     */
    drawNPC(ctx: CanvasRenderingContext2D, x: number, y: number, data: any) {
        const id = typeof data === 'string' ? data : data.id;
        const type = data.type;

        // Center NPC in tile
        const drawX = x + TILE_SIZE / 2;
        const drawY = y + TILE_SIZE / 2;

        // Dungeon Creeps
        if (id.startsWith('creep_') || type === 'CREEP') {
            this.drawCreep(ctx, x, y, data);
            return;
        }

        if (id === 'old_man') {
            const px = drawX - 10;
            const py = drawY - 15;
            ctx.fillStyle = '#6d4c41';
            ctx.fillRect(px + 2, py + 8, 16, 22);
            ctx.fillStyle = '#ffcc80';
            ctx.fillRect(px + 2, py - 6, 16, 14);
            ctx.fillStyle = '#eeeeee';
            ctx.fillRect(px + 2, py + 4, 16, 8);
            ctx.fillRect(px + 4, py + 12, 12, 6);
            ctx.fillStyle = '#8d6e63';
            ctx.fillRect(px + 20, py - 5, 4, 38);
            ctx.fillStyle = 'black';
            ctx.fillRect(px + 5, py - 2, 2, 2);
            ctx.fillRect(px + 13, py - 2, 2, 2);
        } else if (id === 'shopkeeper') {
            const px = drawX - 10;
            const py = drawY - 15;
            ctx.fillStyle = PALETTE.red;
            ctx.fillRect(px + 2, py + 8, 16, 22);
            ctx.fillStyle = '#ffcc80';
            ctx.fillRect(px + 2, py - 6, 16, 14);
            ctx.fillStyle = '#ffd700'; // Golden vest
            ctx.fillRect(px + 4, py + 10, 12, 10);
            ctx.fillStyle = 'black';
            ctx.fillRect(px + 5, py - 2, 2, 2);
            ctx.fillRect(px + 13, py - 2, 2, 2);
        } else {
            // Default NPC representation
            ctx.fillStyle = PALETTE.purple;
            ctx.beginPath();
            ctx.arc(drawX, drawY, 18, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawCreep(ctx: CanvasRenderingContext2D, x: number, y: number, data: any) {
        const color = data.color || '#ff0000';
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + TILE_SIZE / 2, y + TILE_SIZE - 5, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2 - 5, y + TILE_SIZE / 2 - 2, 3, 0, Math.PI * 2);
        ctx.arc(x + TILE_SIZE / 2 + 5, y + TILE_SIZE / 2 - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2 - 5, y + TILE_SIZE / 2 - 2, 1, 0, Math.PI * 2);
        ctx.arc(x + TILE_SIZE / 2 + 5, y + TILE_SIZE / 2 - 2, 1, 0, Math.PI * 2);
        ctx.fill();
    }
}

export default TileRenderer;
