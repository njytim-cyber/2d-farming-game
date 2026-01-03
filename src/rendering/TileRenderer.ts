/**
 * Tile Renderer
 * Draws tiles, buildings, and crops
 */

import { TILE_SIZE, TILES, INTERIOR_TILES, SEEDS, SEASON_COLORS, SEASONS, PALETTE, PALETTE_COZY } from '../game/constants';
import { Crop } from '../entities/Crop';
import { perlin } from '../utils/Perlin';

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
     * Get deterministic jitter for entities
     */
    getEntityJitter(x: number, y: number): { x: number, y: number } {
        const jx = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
        const jy = (Math.cos(x * 39.346 + y * 11.135) * 23421.6789) % 1;
        return {
            x: (jx - 0.5) * (TILE_SIZE * 0.6), // +/- 30% tile size
            y: (jy - 0.5) * (TILE_SIZE * 0.6)
        };
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
                // Perlin Noise Logic
                const scale = 0.1; // Slightly larger islands
                const noise = (perlin.noise(x * scale, y * scale) + 1) / 2; // 0-1

                // Base color
                ctx.fillStyle = colors.grass;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Organic patches
                if (noise > 0.55) {
                    // Darker patches (more common)
                    ctx.fillStyle = colors.grass_dark || '#6a9e6c';
                    const intensity = (noise - 0.55) / 0.45; // 0 to 1
                    ctx.globalAlpha = 0.3 + (intensity * 0.4); // 0.3 to 0.7 alpha
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.globalAlpha = 1.0;
                } else if (noise < 0.45) {
                    // Lighter patches
                    ctx.fillStyle = colors.grass_light || '#8fb990';
                    const intensity = (0.45 - noise) / 0.45; // 0 to 1
                    ctx.globalAlpha = 0.3 + (intensity * 0.4); // 0.3 to 0.7 alpha
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.globalAlpha = 1.0;
                }
                break;
            }

            case TILES.SOIL:
                if (map) this.drawAutotiledSoil(ctx, px, py, x, y, map);
                else {
                    ctx.fillStyle = '#795548';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                }
                break;

            case TILES.TREE: {
                // Cache Tree
                const treeKey = `TREE_${seasonIndex}`;
                const treeSprite = this.getCachedSprite(treeKey, 100, 100, (c) => {
                    this.drawTree(c, 50, 50, colors);
                });

                // Jitter
                const jitter = this.getEntityJitter(x, y);
                const jx = px + jitter.x;
                const jy = py + jitter.y;

                // Wind Sway Logic
                const time = performance.now() / 1000;
                const sway = Math.sin(time + x * 0.5) * 0.05 * (y % 2 ? 1 : -0.5); // Variation based on position

                ctx.save();
                const pivotX = jx + TILE_SIZE / 2;
                const pivotY = jy + TILE_SIZE;

                ctx.translate(pivotX, pivotY);
                ctx.transform(1, 0, sway, 1, 0, 0); // Apply skew
                ctx.translate(-pivotX, -pivotY);

                // Draw at jittered position
                ctx.drawImage(treeSprite, jx - 25, jy - 25);
                ctx.restore();
                break;
            }

            case TILES.STONE: {
                const stoneKey = 'STONE';
                const stoneSprite = this.getCachedSprite(stoneKey, 75, 75, (c) => {
                    this.drawStone(c, 37, 37);
                });
                const jStone = this.getEntityJitter(x, y);
                ctx.drawImage(stoneSprite, px - 12 + jStone.x, py - 12 + jStone.y);
                break;
            }

            case TILES.STONE_ORE: {
                const oreKey = 'STONE_ORE';
                const oreSprite = this.getCachedSprite(oreKey, 75, 75, (c) => {
                    this.drawStoneOre(c, 37, 37);
                });
                const jOre = this.getEntityJitter(x, y);
                ctx.drawImage(oreSprite, px - 12 + jOre.x, py - 12 + jOre.y);
                break;
            }

            case TILES.STONE_BOULDER: {
                const boulderKey = 'STONE_BOULDER';
                const boulderSprite = this.getCachedSprite(boulderKey, 75, 75, (c) => {
                    this.drawBoulder(c, 37, 37);
                });
                const jBoulder = this.getEntityJitter(x, y);
                ctx.drawImage(boulderSprite, px - 12 + jBoulder.x, py - 12 + jBoulder.y);
                break;
            }

            case TILES.TREE_OAK: {
                const oakKey = 'TREE_OAK';
                const oakSprite = this.getCachedSprite(oakKey, 100, 100, (c) => {
                    this.drawOak(c, 50, 50);
                });

                const jOak = this.getEntityJitter(x, y);
                const ox = px + jOak.x;
                const oy = py + jOak.y;

                // Wind Sway Logic (Oak)
                const timeOak = performance.now() / 1200; // Slower sway for oaks
                const swayOak = Math.sin(timeOak + x * 0.3) * 0.03;

                ctx.save();
                // Pivot
                const pX = ox + TILE_SIZE / 2;
                const pY = oy + TILE_SIZE;

                ctx.translate(pX, pY);
                ctx.transform(1, 0, swayOak, 1, 0, 0);
                ctx.translate(-pX, -pY);

                ctx.drawImage(oakSprite, ox - 25, oy - 25);
                ctx.restore();
                break;
            }

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

            case TILES.ROAD:
                this.drawRoad(ctx, px, py, x, y);
                break;

            case TILES.FOUNTAIN:
                if (map && map[y][x] === TILES.FOUNTAIN && ((map[y + 1] && map[y + 1][x] !== TILES.FOUNTAIN) && (map[y][x + 1] !== TILES.FOUNTAIN))) {
                    // Draw 2x2 Fountain at bottom-right tile? No, usually Top-Left or Bottom-Left.
                    // Let's rely on Bottom-Left check like buildings
                }
                // Actually Fountain is 2x2. Let's draw it from bottom-left (21, 21)
                if (map && this.isBottomLeftCorner(map, x, y, TILES.FOUNTAIN)) {
                    const fSize = TILE_SIZE * 2;
                    const fSprite = this.getCachedSprite('FOUNTAIN', fSize, fSize, (c) => this.drawFountain(0, 0, c));
                    ctx.drawImage(fSprite, px, py - TILE_SIZE);
                }
                break;

            case TILES.TAILOR:
                if (map && this.isBottomLeftCorner(map, x, y, TILES.TAILOR)) {
                    const sprite = this.getCachedSprite('TAILOR', TILE_SIZE * 3, TILE_SIZE * 3, (c) => this.drawTailor(0, 0, c));
                    ctx.drawImage(sprite, px, py - (TILE_SIZE * 2));
                }
                break;

            case TILES.GUILD:
                if (map && this.isBottomLeftCorner(map, x, y, TILES.GUILD)) {
                    const sprite = this.getCachedSprite('GUILD', TILE_SIZE * 3, TILE_SIZE * 3, (c) => this.drawGuild(0, 0, c));
                    ctx.drawImage(sprite, px, py - (TILE_SIZE * 2));
                }
                break;

            case TILES.BANK:
                if (map && this.isBottomLeftCorner(map, x, y, TILES.BANK)) {
                    const sprite = this.getCachedSprite('BANK', TILE_SIZE * 3, TILE_SIZE * 3, (c) => this.drawBank(0, 0, c));
                    ctx.drawImage(sprite, px, py - (TILE_SIZE * 2));
                }
                break;

            case TILES.MUSEUM:
                if (map && this.isBottomLeftCorner(map, x, y, TILES.MUSEUM)) {
                    const sprite = this.getCachedSprite('MUSEUM', TILE_SIZE * 4, TILE_SIZE * 4, (c) => this.drawMuseum(0, 0, c));
                    ctx.drawImage(sprite, px, py - (TILE_SIZE * 3));
                }
                break;

            case TILES.WINDMILL:
                // Windmill is usually tall. Assuming 3x4 maybe?
                if (map && this.isBottomLeftCorner(map, x, y, TILES.WINDMILL)) {
                    const sprite = this.getCachedSprite('WINDMILL', TILE_SIZE * 3, TILE_SIZE * 4, (c) => this.drawWindmill(0, 0, c));
                    ctx.drawImage(sprite, px, py - (TILE_SIZE * 3));
                }
                break;

            case TILES.TOWN_HOUSE:
                if (map && this.isBottomLeftCorner(map, x, y, TILES.TOWN_HOUSE)) {
                    const sprite = this.getCachedSprite('TOWN_HOUSE', TILE_SIZE * 3, TILE_SIZE * 3, (c) => this.drawBuilding(0, 0, TILE_SIZE * 3, TILE_SIZE * 3, '#5d4037', '#8d6e63', c));
                    ctx.drawImage(sprite, px, py - (TILE_SIZE * 2));
                }
                break;
            case TILES.LIBRARY:
                if (map && this.isBottomLeftCorner(map, x, y, TILES.LIBRARY)) {
                    const sprite = this.getCachedSprite('LIBRARY', TILE_SIZE * 3, TILE_SIZE * 3, (c) => this.drawBuilding(0, 0, TILE_SIZE * 3, TILE_SIZE * 3, '#455a64', '#90caf9', c, 'LIBRARY'));
                    ctx.drawImage(sprite, px, py - (TILE_SIZE * 2));
                }
                break;
            case TILES.SCHOOL:
                if (map && this.isBottomLeftCorner(map, x, y, TILES.SCHOOL)) {
                    const sprite = this.getCachedSprite('SCHOOL', TILE_SIZE * 3, TILE_SIZE * 3, (c) => this.drawBuilding(0, 0, TILE_SIZE * 3, TILE_SIZE * 3, '#d32f2f', '#ffcdd2', c, 'SCHOOL'));
                    ctx.drawImage(sprite, px, py - (TILE_SIZE * 2));
                }
                break;
            case TILES.TAVERN:
                if (map && this.isBottomLeftCorner(map, x, y, TILES.TAVERN)) {
                    const sprite = this.getCachedSprite('TAVERN', TILE_SIZE * 3, TILE_SIZE * 3, (c) => this.drawBuilding(0, 0, TILE_SIZE * 3, TILE_SIZE * 3, '#795548', '#d7ccc8', c, 'TAVERN', true));
                    ctx.drawImage(sprite, px, py - (TILE_SIZE * 2));
                }
                break;
            case TILES.CLINIC:
                if (map && this.isBottomLeftCorner(map, x, y, TILES.CLINIC)) {
                    const sprite = this.getCachedSprite('CLINIC', TILE_SIZE * 3, TILE_SIZE * 3, (c) => this.drawBuilding(0, 0, TILE_SIZE * 3, TILE_SIZE * 3, '#ffffff', '#e1f5fe', c, 'CLINIC'));
                    ctx.drawImage(sprite, px, py - (TILE_SIZE * 2));
                }
                break;
            case TILES.BLACKSMITH:
                if (map && this.isBottomLeftCorner(map, x, y, TILES.BLACKSMITH)) {
                    const sprite = this.getCachedSprite('BLACKSMITH', TILE_SIZE * 3, TILE_SIZE * 3, (c) => this.drawBuilding(0, 0, TILE_SIZE * 3, TILE_SIZE * 3, '#212121', '#616161', c, 'SMITH', true));
                    ctx.drawImage(sprite, px, py - (TILE_SIZE * 2));
                }
                break;

            case TILES.MAYOR_HOUSE:
                if (map && this.isBottomLeftCorner(map, x, y, TILES.MAYOR_HOUSE)) {
                    const w = TILE_SIZE * 4;
                    const h = TILE_SIZE * 3;
                    const sprite = this.getCachedSprite('MAYOR_HOUSE', w, h, (c) => this.drawBuilding(0, 0, w, h, '#303f9f', '#c5cae9', c, 'MAYOR'));
                    ctx.drawImage(sprite, px, py - (TILE_SIZE * 2));
                }
                break;
            case TILES.CHURCH:
                if (map && this.isBottomLeftCorner(map, x, y, TILES.CHURCH)) {
                    const w = TILE_SIZE * 4;
                    const h = TILE_SIZE * 4;
                    // Draw offset for 4x4
                    const sprite = this.getCachedSprite('CHURCH', w, h, (c) => this.drawBuilding(0, 0, w, h, '#fbc02d', '#fff9c4', c, 'CHURCH'));
                    ctx.drawImage(sprite, px, py - (TILE_SIZE * 3));
                }
                break;

            // === Town Decorations ===
            case TILES.FLOWER_BED:
                this.drawFlowerBed(ctx, px, py, x, y);
                break;

            case TILES.HEDGE:
                this.drawHedge(ctx, px, py);
                break;

            case TILES.LAMP:
                this.drawStreetLamp(ctx, px, py);
                break;

            case TILES.BENCH:
                this.drawBench(ctx, px, py);
                break;

            case TILES.GARDEN:
                this.drawGarden(ctx, px, py, x, y);
                break;

            case TILES.WELL:
                this.drawWell(ctx, px, py);
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
            case INTERIOR_TILES.FLOOR: {
                // Procedural Wood Flooring (Warm Oak)
                const isOddRow = y % 2 !== 0;

                // Noise for plank variation
                const seed = (x * 12.9898 + y * 78.233) * 43758.5453;
                const noise = (Math.sin(seed) + 1) / 2; // 0-1

                // Select from cozy palette
                let woodColor = PALETTE_COZY.warm_oak;
                if (noise > 0.66) woodColor = PALETTE_COZY.honey_wood;
                else if (noise < 0.33) woodColor = '#C19A6B'; // Slightly darker oak

                ctx.fillStyle = woodColor;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Soft Plank Lines
                ctx.strokeStyle = 'rgba(93, 64, 55, 0.3)'; // Soft brown transparency
                ctx.lineWidth = 1;

                // Horizontal lines
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px + TILE_SIZE, py);
                ctx.moveTo(px, py + TILE_SIZE);
                ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE);
                ctx.stroke();

                // Staggered vertical lines
                ctx.beginPath();
                if (isOddRow) {
                    // Stagger: Vertical line in middle
                    ctx.moveTo(px + TILE_SIZE / 2, py);
                    ctx.lineTo(px + TILE_SIZE / 2, py + TILE_SIZE);
                    ctx.moveTo(px, py);
                    ctx.lineTo(px, py + TILE_SIZE);
                } else {
                    // Normal grid vertical (left and right)
                    ctx.moveTo(px, py);
                    ctx.lineTo(px, py + TILE_SIZE);
                    ctx.moveTo(px + TILE_SIZE, py);
                    ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE);
                }
                ctx.stroke();

                // Nail/Feature Detail
                if (noise > 0.8) {
                    ctx.fillStyle = 'rgba(62, 39, 35, 0.4)';
                    ctx.fillRect(px + TILE_SIZE / 2 - 1, py + 5, 2, 2);
                    ctx.fillRect(px + TILE_SIZE / 2 - 1, py + TILE_SIZE - 7, 2, 2);
                }
                break;
            }

            case INTERIOR_TILES.WALL:
                // Cream Plaster Wall
                ctx.fillStyle = PALETTE_COZY.cream;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Top Cap (Dark Chocolate)
                ctx.fillStyle = PALETTE_COZY.dark_chocolate;
                ctx.fillRect(px, py - 10, TILE_SIZE, 10);

                // Highlight to separate from void
                ctx.fillStyle = '#6D4C41';
                ctx.fillRect(px, py - 10, TILE_SIZE, 2);

                // Baseboard (Dark Chocolate)
                ctx.fillStyle = PALETTE_COZY.dark_chocolate;
                ctx.fillRect(px, py + TILE_SIZE - 8, TILE_SIZE, 8);
                // Detail line
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(px, py + TILE_SIZE - 8, TILE_SIZE, 1);
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
                // Shadow (Projected - Soft)
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                ctx.beginPath();
                ctx.roundRect(px, py + TILE_SIZE - 5, TILE_SIZE, 12, 4);
                ctx.fill();

                // Floor (under bed)
                ctx.fillStyle = PALETTE_COZY.warm_oak;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Bed Frame
                ctx.fillStyle = PALETTE_COZY.dark_chocolate;
                ctx.fillRect(px + 2, py + 5, TILE_SIZE - 4, TILE_SIZE - 5);

                // Mattress
                ctx.fillStyle = '#FFFDE7'; // Soft cream
                ctx.fillRect(px + 5, py + 8, TILE_SIZE - 12, TILE_SIZE - 15);

                // Blanket (Cerulean Deep)
                ctx.fillStyle = PALETTE_COZY.cerulean_deep;
                ctx.fillRect(px + 5, py + 22, TILE_SIZE - 12, 20);

                // Pillow
                ctx.fillStyle = '#FFF';
                ctx.fillRect(px + 10, py + 10, TILE_SIZE - 20, 8);
                break;

            case INTERIOR_TILES.TABLE:
                // Floor first
                ctx.fillStyle = PALETTE_COZY.warm_oak;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Projected Shadow (Round)
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                ctx.beginPath();
                ctx.ellipse(px + TILE_SIZE / 2, py + TILE_SIZE - 5, TILE_SIZE / 1.5, 6, 0, 0, Math.PI * 2);
                ctx.fill();

                // Table Legs (Dark Chocolate)
                ctx.fillStyle = PALETTE_COZY.dark_chocolate;
                ctx.fillRect(px + 8, py + 25, 4, 15);
                ctx.fillRect(px + TILE_SIZE - 12, py + 25, 4, 15);

                // Table top (Honey Wood)
                ctx.fillStyle = PALETTE_COZY.honey_wood;
                ctx.fillRect(px + 5, py + 10, TILE_SIZE - 10, 15);

                // Depth
                ctx.fillStyle = '#BCAAA4';
                ctx.fillRect(px + 5, py + 25, TILE_SIZE - 10, 2);
                break;

            case INTERIOR_TILES.RUG:
                // Floor
                ctx.fillStyle = PALETTE_COZY.warm_oak;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Rug (Deep Crimson)
                ctx.fillStyle = PALETTE_COZY.deep_crimson;
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);

                // Gold Border
                ctx.strokeStyle = PALETTE_COZY.gold;
                ctx.lineWidth = 2;
                ctx.strokeRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12);

                // Fringe maybe?
                ctx.fillStyle = '#FFF8E1';
                ctx.fillRect(px + 2, py + 2, 2, TILE_SIZE - 4);
                ctx.fillRect(px + TILE_SIZE - 4, py + 2, 2, TILE_SIZE - 4);
                break;

            case INTERIOR_TILES.CHAIR:
                // Floor
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Projected Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillRect(px + 12, py + 12, TILE_SIZE - 20, TILE_SIZE - 20);

                // Chair Legs
                ctx.fillStyle = PALETTE.wood_dark;
                ctx.fillRect(px + 12, py + 12, 4, 15);
                ctx.fillRect(px + TILE_SIZE - 16, py + 12, 4, 15);
                ctx.fillRect(px + 12, py + TILE_SIZE - 16, 4, 4);
                ctx.fillRect(px + TILE_SIZE - 16, py + TILE_SIZE - 16, 4, 4);

                // Chair Seat
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px + 10, py + 10, TILE_SIZE - 20, TILE_SIZE - 20);
                // Depth Lip
                ctx.fillStyle = '#3e2723';
                ctx.fillRect(px + 10, py + TILE_SIZE - 10, TILE_SIZE - 20, 2);

                // Chair Back
                ctx.fillStyle = PALETTE.wood_dark;
                ctx.fillRect(px + 10, py + 5, TILE_SIZE - 20, 10);
                break;

            case INTERIOR_TILES.STOVE:
                // Floor
                ctx.fillStyle = PALETTE_COZY.warm_oak;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillRect(px + 5, py + TILE_SIZE - 3, TILE_SIZE - 10, 5);

                // Stove body (Dark Iron)
                ctx.fillStyle = '#37474F';
                ctx.fillRect(px + 5, py + 10, TILE_SIZE - 10, TILE_SIZE - 15);

                // Burners (Glow)
                ctx.fillStyle = PALETTE_COZY.stove_glow;
                ctx.shadowColor = PALETTE_COZY.stove_glow;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(px + 18, py + 10, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.arc(px + 32, py + 10, 5, 0, Math.PI * 2);
                ctx.fill();
                // Coils
                ctx.fillStyle = '#ff5252'; // Hot red
                ctx.beginPath();
                ctx.arc(px + 18, py + 10, 3, 0, Math.PI * 2);
                ctx.arc(px + 32, py + 10, 3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case INTERIOR_TILES.CHEST:
                // Floor
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath();
                ctx.moveTo(px + TILE_SIZE - 5, py + TILE_SIZE - 5);
                ctx.lineTo(px + TILE_SIZE + 5, py + TILE_SIZE - 5);
                ctx.lineTo(px + TILE_SIZE + 5, py + 15);
                ctx.lineTo(px + TILE_SIZE - 5, py + 15);
                ctx.fill();

                // Chest body
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px + 5, py + 15, TILE_SIZE - 10, TILE_SIZE - 20);
                // Depth
                ctx.fillStyle = '#3e2723';
                ctx.fillRect(px + 5, py + TILE_SIZE - 5, TILE_SIZE - 10, 2);

                // Chest lid
                ctx.fillStyle = PALETTE.wood_dark;
                ctx.fillRect(px + 5, py + 10, TILE_SIZE - 10, 10);
                // Lid Highlight
                ctx.fillStyle = '#8d6e63';
                ctx.fillRect(px + 5, py + 10, TILE_SIZE - 10, 2);

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
                // Top Detail/Lip
                ctx.fillStyle = '#d7ccc8';
                ctx.fillRect(px, py + 5, TILE_SIZE, 2);

                // Shadow under lip
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(px + 2, py + 17, TILE_SIZE - 4, 3);
                break;

            case INTERIOR_TILES.SHELF:
                // Floor
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Shadow (Wall cast)
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(px + 4, py + TILE_SIZE - 2, TILE_SIZE - 8, 2);

                // Shelf back
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(px + 2, py + 5, TILE_SIZE - 4, TILE_SIZE - 10);
                // Shelves with thickness
                ctx.fillStyle = '#8d6e63';
                ctx.fillRect(px + 4, py + 15, TILE_SIZE - 8, 4);
                ctx.fillStyle = '#5d4037'; // Darker underside
                ctx.fillRect(px + 4, py + 19, TILE_SIZE - 8, 1);

                ctx.fillStyle = '#8d6e63';
                ctx.fillRect(px + 4, py + 30, TILE_SIZE - 8, 4);
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(px + 4, py + 34, TILE_SIZE - 8, 1);

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
                // Stand Depth
                ctx.fillStyle = '#212121';
                ctx.fillRect(px + 8, py + 35, TILE_SIZE - 16, 2);

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
                // Body Depth
                ctx.fillStyle = '#1a237e';
                ctx.fillRect(px + 2, py + 33, TILE_SIZE - 4, 2);

                // Couch Back
                ctx.fillStyle = '#3949ab';
                ctx.fillRect(px + 2, py + 5, TILE_SIZE - 4, 10);
                // Back Depth
                ctx.fillStyle = '#283593';
                ctx.fillRect(px + 2, py + 15, TILE_SIZE - 4, 2);

                // Cushions
                ctx.fillStyle = '#7986cb';
                ctx.fillRect(px + 5, py + 15, 18, 18);
                ctx.fillRect(px + 27, py + 15, 18, 18);
                break;

            case INTERIOR_TILES.PLANT:
                // Floor
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath();
                ctx.ellipse(px + 25, py + 40, 12, 5, 0, 0, Math.PI * 2);
                ctx.fill();

                // Pot
                ctx.fillStyle = '#d84315';
                ctx.beginPath();
                ctx.moveTo(px + 15, py + 40);
                ctx.lineTo(px + 35, py + 40);
                ctx.lineTo(px + 40, py + 25);
                ctx.lineTo(px + 10, py + 25);
                ctx.closePath();
                ctx.fill();
                // Pot Rim
                ctx.fillStyle = '#bf360c';
                ctx.fillRect(px + 10, py + 25, 30, 4);

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

    drawRoad(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number) {
        // Base mortar/dirt color
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Deterministic random for consistent cobblestones
        const seed = (x * 12.9898 + y * 78.233) * 43758.5453;
        const rand = (offset: number) => {
            const s = Math.sin(seed + offset) * 10000;
            return s - Math.floor(s);
        };

        // Cobblestone pattern - 3x3 grid with variation
        const stoneColors = ['#9e9e9e', '#a1a1a1', '#959595', '#ababab', '#8e8e8e'];
        const stoneSize = 14;
        const gap = 2;

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const baseX = px + 3 + col * (stoneSize + gap);
                const baseY = py + 3 + row * (stoneSize + gap);

                // Offset for organic look
                const offsetX = (rand(row * 3 + col) - 0.5) * 3;
                const offsetY = (rand(row * 3 + col + 10) - 0.5) * 3;
                const sizeVar = rand(row * 3 + col + 20) * 3;

                const stoneX = baseX + offsetX;
                const stoneY = baseY + offsetY;
                const w = stoneSize - 1 + sizeVar;
                const h = stoneSize - 1 + (rand(row * 3 + col + 30) * 2);

                // Stone base (darker)
                ctx.fillStyle = '#757575';
                ctx.beginPath();
                ctx.roundRect(stoneX + 1, stoneY + 1, w, h, 3);
                ctx.fill();

                // Stone top (lighter, 3D effect)
                const colorIdx = Math.floor(rand(row * 3 + col + 40) * stoneColors.length);
                ctx.fillStyle = stoneColors[colorIdx];
                ctx.beginPath();
                ctx.roundRect(stoneX, stoneY, w, h, 3);
                ctx.fill();

                // Highlight on top-left
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.beginPath();
                ctx.roundRect(stoneX + 1, stoneY + 1, w / 2, h / 3, 2);
                ctx.fill();
            }
        }

        // Edge wear/weathering
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(px, py + TILE_SIZE - 3, TILE_SIZE, 3);
        ctx.fillRect(px + TILE_SIZE - 3, py, 3, TILE_SIZE);
    }

    drawFountain(px: number, py: number, ctx: CanvasRenderingContext2D) {
        const size = TILE_SIZE * 2;
        const cx = px + size / 2;
        const cy = py + size / 2 + 8;

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 30, size / 2, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outer stone base (octagonal shape)
        ctx.fillStyle = '#9e9e9e';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 - Math.PI / 8;
            const r = size / 2 - 5;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r * 0.6; // Perspective squish
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Stone rim highlight
        ctx.strokeStyle = '#bdbdbd';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Inner rim shadow
        ctx.strokeStyle = '#757575';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, size / 2 - 15, (size / 2 - 15) * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Water with gradient
        const waterGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2 - 15);
        waterGrad.addColorStop(0, '#4fc3f7');
        waterGrad.addColorStop(0.5, '#0288d1');
        waterGrad.addColorStop(1, '#01579b');
        ctx.fillStyle = waterGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, size / 2 - 15, (size / 2 - 15) * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Center pedestal
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(cx - 8, cy - 25, 16, 30);
        ctx.fillStyle = '#9e9e9e';
        ctx.fillRect(cx - 10, cy - 28, 20, 5);
        ctx.fillRect(cx - 10, cy + 2, 20, 5);

        // Water spout top
        ctx.fillStyle = '#b3e5fc';
        ctx.beginPath();
        ctx.arc(cx, cy - 28, 6, 0, Math.PI * 2);
        ctx.fill();

        // Animated water droplets (static positions, would animate in real-time)
        ctx.fillStyle = 'rgba(179, 229, 252, 0.7)';
        const time = performance.now() / 500;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + time * 0.2;
            const dist = 15 + (Math.sin(time + i) * 5);
            const dropX = cx + Math.cos(angle) * dist;
            const dropY = cy - 20 + Math.sin(time * 2 + i) * 8;
            ctx.beginPath();
            ctx.arc(dropX, dropY, 2 + Math.sin(time + i), 0, Math.PI * 2);
            ctx.fill();
        }

        // Water ripples
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        for (let r = 1; r < 4; r++) {
            ctx.beginPath();
            ctx.ellipse(cx, cy, (size / 2 - 15) * (r / 4), (size / 2 - 15) * 0.5 * (r / 4), 0, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    drawBuilding(px: number, py: number, w: number, h: number, roofColor: string, wallColor: string, ctx: CanvasRenderingContext2D, label: string = '', awning: boolean = false) {
        const wallH = h * 0.65;
        const wallY = py + h - wallH;
        const roofPeak = py + 15;

        // Ground Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(px + w / 2, py + h - 3, w / 2 - 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Side Wall (3D depth - darker)
        const sideWallColor = this.darkenColor(wallColor, 0.7);
        ctx.fillStyle = sideWallColor;
        ctx.fillRect(px + w - 18, wallY + 5, 10, wallH - 5);

        // Front Wall
        ctx.fillStyle = wallColor;
        ctx.fillRect(px + 8, wallY, w - 26, wallH);

        // Wall texture (subtle brick/plaster lines)
        ctx.strokeStyle = this.darkenColor(wallColor, 0.9);
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(px + 10, wallY + 15 + i * 18);
            ctx.lineTo(px + w - 20, wallY + 15 + i * 18);
            ctx.stroke();
        }

        // Wall Outline
        ctx.strokeStyle = '#2d1b18';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 8, wallY, w - 26, wallH);

        // Roof
        if (awning) {
            // Commercial/Tavern style - Flat roof with awning
            ctx.fillStyle = roofColor;
            ctx.fillRect(px + 2, wallY - 12, w - 4, 18);

            // Awning with 3D effect
            const awningGrad = ctx.createLinearGradient(px, wallY - 12, px, wallY + 20);
            awningGrad.addColorStop(0, '#e53935');
            awningGrad.addColorStop(1, '#b71c1c');
            ctx.fillStyle = awningGrad;
            ctx.fillRect(px + 5, wallY + 5, w - 10, 18);

            // Awning stripes
            ctx.fillStyle = '#fff';
            const stripeW = (w - 10) / 8;
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(px + 5 + i * 2 * stripeW, wallY + 5, stripeW, 18);
            }

            // Awning shadow
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(px + 5, wallY + 23, w - 10, 5);
        } else {
            // Classic gabled roof with 3D effect
            // Main roof
            ctx.fillStyle = roofColor;
            ctx.beginPath();
            ctx.moveTo(px, wallY + 5);
            ctx.lineTo(px + w / 2, roofPeak);
            ctx.lineTo(px + w, wallY + 5);
            ctx.closePath();
            ctx.fill();

            // Roof right side (darker for 3D)
            ctx.fillStyle = this.darkenColor(roofColor, 0.7);
            ctx.beginPath();
            ctx.moveTo(px + w / 2, roofPeak);
            ctx.lineTo(px + w, wallY + 5);
            ctx.lineTo(px + w - 10, wallY + 5);
            ctx.lineTo(px + w / 2, roofPeak + 8);
            ctx.closePath();
            ctx.fill();

            // Roof outline
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px, wallY + 5);
            ctx.lineTo(px + w / 2, roofPeak);
            ctx.lineTo(px + w, wallY + 5);
            ctx.stroke();

            // Roof trim
            ctx.fillStyle = this.darkenColor(roofColor, 0.5);
            ctx.fillRect(px - 3, wallY + 2, w + 6, 6);
        }

        // Door with depth
        const doorW = 26;
        const doorH = Math.min(48, wallH - 15);
        const doorX = px + w / 2 - doorW / 2;
        const doorY = py + h - doorH - 5;

        // Door frame
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(doorX - 3, doorY - 3, doorW + 6, doorH + 3);

        // Door body
        const doorGrad = ctx.createLinearGradient(doorX, doorY, doorX + doorW, doorY);
        doorGrad.addColorStop(0, '#5d4037');
        doorGrad.addColorStop(0.5, '#795548');
        doorGrad.addColorStop(1, '#4e342e');
        ctx.fillStyle = doorGrad;
        ctx.fillRect(doorX, doorY, doorW, doorH);

        // Door panels
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 1;
        ctx.strokeRect(doorX + 4, doorY + 5, doorW - 8, doorH / 3 - 5);
        ctx.strokeRect(doorX + 4, doorY + doorH / 3 + 3, doorW - 8, doorH / 3 - 5);

        // Door handle
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(doorX + doorW - 7, doorY + doorH / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Windows with frames and reflections
        const winSize = 18;
        const winY = wallY + 18;
        this.drawDetailedWindow(ctx, px + 18, winY, winSize);
        this.drawDetailedWindow(ctx, px + w - 40, winY, winSize);

        // Sign/Label with wooden backing
        if (label) {
            const signW = Math.min(w - 20, label.length * 12 + 20);
            const signX = px + w / 2 - signW / 2;
            const signY = roofPeak + 8;

            // Sign backing
            ctx.fillStyle = '#4e342e';
            ctx.fillRect(signX - 2, signY - 2, signW + 4, 22);
            ctx.fillStyle = '#ffecb3';
            ctx.fillRect(signX, signY, signW, 18);

            // Sign border
            ctx.strokeStyle = '#5d4037';
            ctx.lineWidth = 2;
            ctx.strokeRect(signX, signY, signW, 18);

            // Label text
            ctx.fillStyle = '#3e2723';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, px + w / 2, signY + 9);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        }

        // Building-specific decorations
        if (label === 'SMITH') {
            // Anvil and smoke
            ctx.fillStyle = '#37474f';
            ctx.fillRect(px + 15, py + h - 25, 20, 10);
            // Chimney smoke
            ctx.fillStyle = 'rgba(100,100,100,0.4)';
            ctx.beginPath();
            ctx.arc(px + w - 25, roofPeak - 10, 8, 0, Math.PI * 2);
            ctx.fill();
        } else if (label === 'TAVERN') {
            // Hanging sign
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(px + w - 15, wallY - 5, 3, 25);
            ctx.fillStyle = '#ffb300';
            ctx.beginPath();
            ctx.arc(px + w - 5, wallY + 15, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3e2723';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🍺', px + w - 5, wallY + 19);
            ctx.textAlign = 'left';
        } else if (label === 'CLINIC') {
            // Red cross
            ctx.fillStyle = '#e53935';
            ctx.fillRect(px + w / 2 - 8, wallY + 10, 16, 5);
            ctx.fillRect(px + w / 2 - 2.5, wallY + 5, 5, 15);
        } else if (label === 'LIBRARY') {
            // Books in window
            ctx.fillStyle = '#c62828';
            ctx.fillRect(px + 20, winY + 4, 4, 10);
            ctx.fillStyle = '#1565c0';
            ctx.fillRect(px + 25, winY + 4, 4, 10);
            ctx.fillStyle = '#2e7d32';
            ctx.fillRect(px + 30, winY + 4, 4, 10);
        } else if (label === 'SCHOOL') {
            // Bell on roof
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(px + w / 2, roofPeak - 5, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(px + w / 2 - 3, roofPeak - 15, 6, 10);
        } else if (label === 'CHURCH') {
            // Cross on top
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(px + w / 2 - 2, roofPeak - 20, 4, 20);
            ctx.fillRect(px + w / 2 - 8, roofPeak - 15, 16, 4);
            // Stained glass
            ctx.fillStyle = '#7b1fa2';
            ctx.beginPath();
            ctx.arc(px + w / 2, wallY + 25, 12, Math.PI, 0);
            ctx.fill();
        } else if (label === 'MAYOR') {
            // Flag
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(px + w - 20, roofPeak - 25, 3, 30);
            ctx.fillStyle = '#1565c0';
            ctx.fillRect(px + w - 17, roofPeak - 23, 15, 10);
        }
    }

    /**
     * Draw a detailed window with frame and reflection
     */
    drawDetailedWindow(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
        // Window frame (wood)
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(x - 3, y - 3, size + 6, size + 6);

        // Window sill (lighter)
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(x - 4, y + size, size + 8, 4);

        // Glass
        const glassGrad = ctx.createLinearGradient(x, y, x + size, y + size);
        glassGrad.addColorStop(0, '#b3e5fc');
        glassGrad.addColorStop(0.5, '#81d4fa');
        glassGrad.addColorStop(1, '#4fc3f7');
        ctx.fillStyle = glassGrad;
        ctx.fillRect(x, y, size, size);

        // Reflection
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size * 0.6, y);
        ctx.lineTo(x, y + size * 0.6);
        ctx.closePath();
        ctx.fill();

        // Window crossbars
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + size / 2, y);
        ctx.lineTo(x + size / 2, y + size);
        ctx.moveTo(x, y + size / 2);
        ctx.lineTo(x + size, y + size / 2);
        ctx.stroke();
    }

    /**
     * Darken a hex color by a factor
     */
    darkenColor(hex: string, factor: number): string {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.floor((num >> 16) * factor);
        const g = Math.floor(((num >> 8) & 0x00FF) * factor);
        const b = Math.floor((num & 0x0000FF) * factor);
        return `rgb(${r},${g},${b})`;
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

    drawCave(ctx: CanvasRenderingContext2D, px: number, py: number) {
        // Cave entrance
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE, TILE_SIZE / 2, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE, TILE_SIZE / 2 - 4, Math.PI, 0);
        ctx.fill();
    }

    drawTailor(px: number, py: number, ctx: CanvasRenderingContext2D) {
        const w = TILE_SIZE * 3;
        const h = TILE_SIZE * 3;
        const wallH = h * 0.65;
        const wallY = py + h - wallH;
        const roofPeak = py + 20;

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(px + w / 2, py + h - 3, w / 2 - 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Side wall (purple, darker)
        ctx.fillStyle = '#4a148c';
        ctx.fillRect(px + w - 18, wallY + 5, 10, wallH - 5);

        // Front wall (lavender gradient)
        const wallGrad = ctx.createLinearGradient(px, wallY, px + w, wallY);
        wallGrad.addColorStop(0, '#ce93d8');
        wallGrad.addColorStop(1, '#ba68c8');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(px + 8, wallY, w - 26, wallH);

        // Wall outline
        ctx.strokeStyle = '#7b1fa2';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 8, wallY, w - 26, wallH);

        // Gabled roof (deep purple)
        ctx.fillStyle = '#4a148c';
        ctx.beginPath();
        ctx.moveTo(px, wallY + 5);
        ctx.lineTo(px + w / 2, roofPeak);
        ctx.lineTo(px + w, wallY + 5);
        ctx.closePath();
        ctx.fill();

        // Roof trim
        ctx.fillStyle = '#311b92';
        ctx.fillRect(px - 3, wallY + 2, w + 6, 5);

        // Door
        const doorX = px + w / 2 - 13;
        const doorY = py + h - 48;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(doorX - 2, doorY - 2, 28, 50);
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(doorX, doorY, 24, 48);

        // Door curtain
        ctx.fillStyle = '#f3e5f5';
        ctx.fillRect(doorX + 2, doorY + 2, 20, 20);

        // Display window (larger, for dresses)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(px + 15, wallY + 15, 35, 30);
        ctx.fillStyle = '#fce4ec';
        ctx.fillRect(px + 17, wallY + 17, 31, 26);

        // Dress mannequin silhouette
        ctx.fillStyle = '#e91e63';
        ctx.beginPath();
        ctx.moveTo(px + 32, wallY + 22);
        ctx.lineTo(px + 38, wallY + 40);
        ctx.lineTo(px + 26, wallY + 40);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px + 32, wallY + 20, 4, 0, Math.PI * 2);
        ctx.fill();

        // Hanging sign with scissors
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(px + w - 12, wallY - 8, 3, 30);

        // Sign board
        ctx.fillStyle = '#f3e5f5';
        ctx.beginPath();
        ctx.arc(px + w - 2, wallY + 18, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7b1fa2';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Scissors icon
        ctx.fillStyle = '#7b1fa2';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✂️', px + w - 2, wallY + 22);
        ctx.textAlign = 'left';

        // Small window right
        this.drawDetailedWindow(ctx, px + w - 48, wallY + 18, 16);
    }

    drawGuild(px: number, py: number, ctx: CanvasRenderingContext2D) {
        const w = TILE_SIZE * 3;
        const h = TILE_SIZE * 3;
        const wallH = h * 0.65;
        const wallY = py + h - wallH;

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(px + w / 2, py + h - 3, w / 2 - 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Side wall (dark iron)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(px + w - 18, wallY + 5, 10, wallH - 5);

        // Front wall (stone grey with metallic sheen)
        const wallGrad = ctx.createLinearGradient(px, wallY, px + w, wallY);
        wallGrad.addColorStop(0, '#455a64');
        wallGrad.addColorStop(0.5, '#546e7a');
        wallGrad.addColorStop(1, '#37474f');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(px + 8, wallY, w - 26, wallH);

        // Stone texture lines
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(px + 10, wallY + 20 + i * 22);
            ctx.lineTo(px + w - 20, wallY + 20 + i * 22);
            ctx.stroke();
        }

        // Wall outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 3;
        ctx.strokeRect(px + 8, wallY, w - 26, wallH);

        // Flat reinforced roof
        ctx.fillStyle = '#212121';
        ctx.fillRect(px + 2, wallY - 10, w - 4, 15);

        // Battlements/crenellations
        ctx.fillStyle = '#37474f';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(px + 8 + i * 25, wallY - 18, 15, 10);
        }

        // Heavy door (iron-bound)
        const doorX = px + w / 2 - 16;
        const doorY = py + h - 55;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(doorX - 3, doorY - 3, 36, 58);
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(doorX, doorY, 30, 55);

        // Iron bands
        ctx.fillStyle = '#424242';
        ctx.fillRect(doorX, doorY + 10, 30, 5);
        ctx.fillRect(doorX, doorY + 30, 30, 5);
        ctx.fillRect(doorX, doorY + 45, 30, 5);

        // Door knocker
        ctx.fillStyle = '#ffc107';
        ctx.beginPath();
        ctx.arc(doorX + 15, doorY + 25, 5, 0, Math.PI * 2);
        ctx.fill();

        // Guild emblem above door
        ctx.fillStyle = '#ff6f00';
        ctx.beginPath();
        ctx.arc(px + w / 2, wallY + 25, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e65100';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Crossed swords emblem
        ctx.fillStyle = '#fff';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚔️', px + w / 2, wallY + 30);
        ctx.textAlign = 'left';

        // Narrow windows (arrow slits)
        ctx.fillStyle = '#000';
        ctx.fillRect(px + 18, wallY + 15, 6, 25);
        ctx.fillRect(px + w - 30, wallY + 15, 6, 25);

        // Torches on sides
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(px + 5, wallY + 20, 4, 20);
        ctx.fillRect(px + w - 15, wallY + 20, 4, 20);
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.arc(px + 7, wallY + 18, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px + w - 13, wallY + 18, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBank(px: number, py: number, ctx: CanvasRenderingContext2D) {
        const w = TILE_SIZE * 3;
        const h = TILE_SIZE * 3;
        const wallH = h * 0.6;
        const wallY = py + h - wallH;

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(px + w / 2, py + h - 3, w / 2 - 5, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Side wall (darker green marble)
        ctx.fillStyle = '#1b5e20';
        ctx.fillRect(px + w - 18, wallY + 5, 10, wallH - 5);

        // Front wall (green marble gradient)
        const wallGrad = ctx.createLinearGradient(px, wallY, px + w, wallY);
        wallGrad.addColorStop(0, '#4caf50');
        wallGrad.addColorStop(0.3, '#66bb6a');
        wallGrad.addColorStop(0.7, '#81c784');
        wallGrad.addColorStop(1, '#4caf50');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(px + 8, wallY, w - 26, wallH);

        // Wall outline (gold trim)
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 8, wallY, w - 26, wallH);

        // Classical pediment roof (triangular)
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.moveTo(px + 2, wallY);
        ctx.lineTo(px + w / 2, py + 15);
        ctx.lineTo(px + w - 8, wallY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Roof decoration (gold trim)
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(px, wallY - 3, w - 4, 6);

        // Classical pillars
        ctx.fillStyle = '#fff';
        ctx.fillRect(px + 15, wallY + 8, 8, wallH - 12);
        ctx.fillRect(px + w - 30, wallY + 8, 8, wallH - 12);

        // Pillar capitals (gold)
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(px + 13, wallY + 5, 12, 5);
        ctx.fillRect(px + w - 32, wallY + 5, 12, 5);
        ctx.fillRect(px + 13, py + h - 10, 12, 5);
        ctx.fillRect(px + w - 32, py + h - 10, 12, 5);

        // Door (golden vault door)
        const doorX = px + w / 2 - 15;
        const doorY = py + h - 50;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(doorX - 3, doorY - 3, 34, 53);

        // Vault door (gold/bronze)
        const doorGrad = ctx.createRadialGradient(doorX + 14, doorY + 23, 0, doorX + 14, doorY + 23, 25);
        doorGrad.addColorStop(0, '#ffd700');
        doorGrad.addColorStop(0.5, '#ffb300');
        doorGrad.addColorStop(1, '#ff8f00');
        ctx.fillStyle = doorGrad;
        ctx.fillRect(doorX, doorY, 28, 50);

        // Vault dial
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(doorX + 14, doorY + 25, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(doorX + 14, doorY + 25, 5, 0, Math.PI * 2);
        ctx.fill();

        // Dollar sign emblem
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('$', px + w / 2, py + 35);
        ctx.textAlign = 'left';
    }

    drawWindmill(px: number, py: number, ctx: CanvasRenderingContext2D) {
        const w = TILE_SIZE * 3;
        const h = TILE_SIZE * 4;
        const cx = px + w / 2;
        const baseY = py + h - 15;

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(cx, py + h - 3, w / 2 - 5, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tower body (tapered stone)
        const wallGrad = ctx.createLinearGradient(px, py, px + w, py);
        wallGrad.addColorStop(0, '#bdbdbd');
        wallGrad.addColorStop(0.3, '#e0e0e0');
        wallGrad.addColorStop(0.7, '#fafafa');
        wallGrad.addColorStop(1, '#bdbdbd');
        ctx.fillStyle = wallGrad;

        // Tapered tower shape
        ctx.beginPath();
        ctx.moveTo(px + 20, baseY);
        ctx.lineTo(px + 30, py + 50);
        ctx.lineTo(px + w - 30, py + 50);
        ctx.lineTo(px + w - 20, baseY);
        ctx.closePath();
        ctx.fill();

        // Stone texture lines
        ctx.strokeStyle = '#9e9e9e';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            const yPos = py + 60 + i * 25;
            ctx.beginPath();
            ctx.moveTo(px + 22 + i * 1.5, yPos);
            ctx.lineTo(px + w - 22 - i * 1.5, yPos);
            ctx.stroke();
        }

        // Conical roof
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.moveTo(px + 25, py + 50);
        ctx.lineTo(cx, py + 15);
        ctx.lineTo(px + w - 25, py + 50);
        ctx.closePath();
        ctx.fill();

        // Roof trim
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(px + 23, py + 48, w - 46, 5);

        // Blade hub
        const hubY = py + 45;
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.arc(cx, hubY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.arc(cx, hubY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Animated blades
        const time = performance.now() / 2000;
        ctx.strokeStyle = '#795548';
        ctx.lineWidth = 6;

        for (let i = 0; i < 4; i++) {
            const angle = time + (i * Math.PI / 2);
            const bladeLen = 50;
            const endX = cx + Math.cos(angle) * bladeLen;
            const endY = hubY + Math.sin(angle) * bladeLen;

            ctx.beginPath();
            ctx.moveTo(cx, hubY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Blade sail (canvas/cloth)
            ctx.fillStyle = '#fff8e1';
            ctx.beginPath();
            const perpX = Math.cos(angle + Math.PI / 2) * 12;
            const perpY = Math.sin(angle + Math.PI / 2) * 12;
            ctx.moveTo(cx + Math.cos(angle) * 15, hubY + Math.sin(angle) * 15);
            ctx.lineTo(endX, endY);
            ctx.lineTo(endX + perpX, endY + perpY);
            ctx.lineTo(cx + Math.cos(angle) * 15 + perpX * 0.5, hubY + Math.sin(angle) * 15 + perpY * 0.5);
            ctx.closePath();
            ctx.fill();
        }

        // Door
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(cx - 12, baseY - 40, 24, 40);
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(cx - 10, baseY - 38, 20, 38);

        // Door arch
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.arc(cx, baseY - 38, 10, Math.PI, 0);
        ctx.fill();

        // Small window
        ctx.fillStyle = '#81d4fa';
        ctx.beginPath();
        ctx.arc(cx, py + 95, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawMuseum(px: number, py: number, ctx: CanvasRenderingContext2D) {
        const w = TILE_SIZE * 4;
        const h = TILE_SIZE * 4;
        const wallH = h * 0.55;
        const wallY = py + h - wallH;

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(px + w / 2, py + h - 3, w / 2 - 10, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Side wall
        ctx.fillStyle = '#bcaaa4';
        ctx.fillRect(px + w - 22, wallY + 8, 12, wallH - 8);

        // Front wall (sandstone)
        const wallGrad = ctx.createLinearGradient(px, wallY, px + w, wallY);
        wallGrad.addColorStop(0, '#d7ccc8');
        wallGrad.addColorStop(0.5, '#efebe9');
        wallGrad.addColorStop(1, '#d7ccc8');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(px + 12, wallY, w - 34, wallH);

        // Wall outline
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 12, wallY, w - 34, wallH);

        // Grand pediment (triangular top)
        ctx.fillStyle = '#eec39a';
        ctx.beginPath();
        ctx.moveTo(px + 5, wallY);
        ctx.lineTo(px + w / 2, py + 20);
        ctx.lineTo(px + w - 12, wallY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#d4a574';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pediment decoration (sculptural relief)
        ctx.fillStyle = '#d7ccc8';
        ctx.beginPath();
        ctx.arc(px + w / 2, py + 45, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('M', px + w / 2, py + 50);
        ctx.textAlign = 'left';

        // Roof trim (architrave)
        ctx.fillStyle = '#d4a574';
        ctx.fillRect(px, wallY - 8, w - 8, 12);

        // Classical pillars (4 columns)
        const pillarPositions = [px + 25, px + 65, px + 105, px + 145];
        pillarPositions.forEach(pillarX => {
            // Column base
            ctx.fillStyle = '#d7ccc8';
            ctx.fillRect(pillarX - 2, py + h - 15, 14, 10);

            // Column shaft (fluted)
            const colGrad = ctx.createLinearGradient(pillarX, wallY, pillarX + 10, wallY);
            colGrad.addColorStop(0, '#fff');
            colGrad.addColorStop(0.3, '#fafafa');
            colGrad.addColorStop(0.7, '#e0e0e0');
            colGrad.addColorStop(1, '#bdbdbd');
            ctx.fillStyle = colGrad;
            ctx.fillRect(pillarX, wallY + 10, 10, wallH - 20);

            // Fluting lines
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pillarX + 3, wallY + 12);
            ctx.lineTo(pillarX + 3, py + h - 18);
            ctx.moveTo(pillarX + 7, wallY + 12);
            ctx.lineTo(pillarX + 7, py + h - 18);
            ctx.stroke();

            // Column capital (Corinthian style)
            ctx.fillStyle = '#fff';
            ctx.fillRect(pillarX - 3, wallY + 5, 16, 8);
            // Decorative volutes
            ctx.fillStyle = '#d4a574';
            ctx.beginPath();
            ctx.arc(pillarX - 1, wallY + 9, 3, 0, Math.PI * 2);
            ctx.arc(pillarX + 11, wallY + 9, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Grand entrance (centered between middle pillars)
        const doorX = px + w / 2 - 20;
        const doorY = py + h - 65;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(doorX - 3, doorY - 3, 46, 68);
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(doorX, doorY, 40, 65);

        // Double doors
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(doorX + 20, doorY);
        ctx.lineTo(doorX + 20, doorY + 65);
        ctx.stroke();

        // Door handles
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(doorX + 15, doorY + 35, 3, 0, Math.PI * 2);
        ctx.arc(doorX + 25, doorY + 35, 3, 0, Math.PI * 2);
        ctx.fill();

        // Steps
        ctx.fillStyle = '#bdbdbd';
        ctx.fillRect(doorX - 15, py + h - 8, 70, 8);
        ctx.fillStyle = '#9e9e9e';
        ctx.fillRect(doorX - 10, py + h - 5, 60, 5);
    }

    // === Town Decoration Drawing Methods ===

    drawFlowerBed(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number) {
        // Grass base
        ctx.fillStyle = '#7dbb6f';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Soil bed
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(px + 5, py + 10, TILE_SIZE - 10, TILE_SIZE - 15);

        // Flowers - simple colorful circles
        const colors = ['#e91e63', '#ff9800', '#ffeb3b', '#9c27b0', '#2196f3'];
        const seed = (x * 12.9898 + y * 78.233) * 43758.5453;
        for (let i = 0; i < 4; i++) {
            const fx = px + 12 + (i % 2) * 14 + ((Math.sin(seed + i) + 1) / 2) * 8;
            const fy = py + 18 + Math.floor(i / 2) * 12;
            const c = colors[Math.floor(((Math.sin(seed + i * 3) + 1) / 2) * colors.length)];
            ctx.fillStyle = '#4caf50';
            ctx.fillRect(fx - 1, fy, 2, 8);
            ctx.fillStyle = c;
            ctx.beginPath();
            ctx.arc(fx, fy - 2, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffeb3b';
            ctx.beginPath();
            ctx.arc(fx, fy - 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawHedge(ctx: CanvasRenderingContext2D, px: number, py: number) {
        ctx.fillStyle = '#7dbb6f';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(px + TILE_SIZE / 2, py + TILE_SIZE - 5, TILE_SIZE / 2 - 5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.roundRect(px + 3, py + 10, TILE_SIZE - 6, TILE_SIZE - 18, 8);
        ctx.fill();
        ctx.fillStyle = '#43a047';
        ctx.beginPath();
        ctx.arc(px + 12, py + 12, 10, 0, Math.PI * 2);
        ctx.arc(px + 25, py + 10, 12, 0, Math.PI * 2);
        ctx.arc(px + 38, py + 12, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    drawStreetLamp(ctx: CanvasRenderingContext2D, px: number, py: number) {
        ctx.fillStyle = '#7dbb6f';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#37474f';
        ctx.fillRect(px + 18, py + TILE_SIZE - 8, 14, 8);
        ctx.fillStyle = '#455a64';
        ctx.fillRect(px + 22, py + 12, 6, TILE_SIZE - 20);
        ctx.fillStyle = '#37474f';
        ctx.fillRect(px + 20, py + 10, 18, 4);
        const flicker = 0.8 + Math.sin(performance.now() / 300) * 0.1;
        ctx.fillStyle = `rgba(255, 193, 7, ${0.6 * flicker})`;
        ctx.beginPath();
        ctx.arc(px + 36, py + 18, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffc107';
        ctx.beginPath();
        ctx.arc(px + 36, py + 14, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBench(ctx: CanvasRenderingContext2D, px: number, py: number) {
        ctx.fillStyle = '#7dbb6f';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#37474f';
        ctx.fillRect(px + 8, py + 28, 4, 15);
        ctx.fillRect(px + TILE_SIZE - 12, py + 28, 4, 15);
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(px + 5, py + 25, TILE_SIZE - 10, 6);
        ctx.fillRect(px + 5, py + 15, TILE_SIZE - 10, 4);
        ctx.fillRect(px + 5, py + 20, TILE_SIZE - 10, 3);
    }

    drawGarden(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number) {
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(px + 3, py + 5, TILE_SIZE - 6, 12);
        ctx.fillRect(px + 3, py + 20, TILE_SIZE - 6, 12);
        ctx.fillRect(px + 3, py + 35, TILE_SIZE - 6, 10);
        const seed = (x * 12.9898 + y * 78.233) * 43758.5453;
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
                const vx = px + 8 + col * 10;
                const vy = py + 12 + row * 15;
                ctx.fillStyle = '#388e3c';
                ctx.fillRect(vx - 1, vy, 2, 6);
                ctx.fillStyle = row % 2 === 0 ? '#4caf50' : '#8bc34a';
                ctx.beginPath();
                ctx.ellipse(vx, vy - 3, 4, 5, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawWell(ctx: CanvasRenderingContext2D, px: number, py: number) {
        ctx.fillStyle = '#7dbb6f';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#9e9e9e';
        ctx.beginPath();
        ctx.ellipse(px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 5, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0288d1';
        ctx.beginPath();
        ctx.ellipse(px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 5, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(px + 8, py + 5, 4, TILE_SIZE / 2 + 5);
        ctx.fillRect(px + TILE_SIZE - 12, py + 5, 4, TILE_SIZE / 2 + 5);
        ctx.fillStyle = '#795548';
        ctx.beginPath();
        ctx.moveTo(px + 3, py + 12);
        ctx.lineTo(px + TILE_SIZE / 2, py + 2);
        ctx.lineTo(px + TILE_SIZE - 3, py + 12);
        ctx.closePath();
        ctx.fill();
    }
}

export default TileRenderer;

