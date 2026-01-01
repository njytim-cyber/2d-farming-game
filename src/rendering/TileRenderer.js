/**
 * Tile Renderer
 * Draws tiles, buildings, and crops
 */

import { TILE_SIZE, TILES, INTERIOR_TILES, SEEDS, SEASON_COLORS, SEASONS, PALETTE } from '../game/constants.js';

export class TileRenderer {
    constructor(ctx) {
        this.ctx = ctx;
    }

    /**
     * Get season colors
     */
    getSeasonColors(seasonIndex) {
        const seasonName = SEASONS[seasonIndex] || 'Spring';
        return SEASON_COLORS[seasonName] || SEASON_COLORS.Spring;
    }

    /**
     * Check if this tile is the top-left corner of a building
     */
    isTopLeftCorner(map, x, y, tileType) {
        const hasAbove = y > 0 && map[y - 1] && map[y - 1][x] === tileType;
        const hasLeft = x > 0 && map[y][x - 1] === tileType;
        return !hasAbove && !hasLeft;
    }

    /**
     * Check if this tile is the bottom-left corner of a building
     * Used for y-sorting.
     */
    isBottomLeftCorner(map, x, y, tileType) {
        const hasBelow = y < map.length - 1 && map[y + 1] && map[y + 1][x] === tileType;
        const hasLeft = x > 0 && map[y][x - 1] === tileType;
        return !hasBelow && !hasLeft;
    }

    /**
     * Draw a single tile
     */
    drawTile(tileType, x, y, seasonIndex, map) {
        const ctx = this.ctx;
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        const colors = this.getSeasonColors(seasonIndex);

        switch (tileType) {
            case TILES.GRASS:
                // Subtle color variation (Wang-like)
                const gSeed = (x * 12345) ^ (y * 67890);
                const gRand = (Math.abs(gSeed) % 10) / 100; // 0.0 to 0.1
                ctx.fillStyle = colors.grass;

                // Slightly darken/lighten
                if (gRand > 0.05) {
                    ctx.globalAlpha = 0.9 + gRand; // 0.95 to 1.05 influence... wait globalAlpha is 0-1
                    // Better to just adjust the color slightly
                    ctx.fillStyle = colors.grass; // Placeholder for now, coloring is fixed
                }

                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Add a very subtle overlay for variety
                ctx.fillStyle = 'rgba(0,0,0,' + (gRand * 0.05) + ')';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Procedural Decoration (Tufts, Flowers)
                this.drawGrassDecoration(ctx, px, py, x, y);
                break;

            case TILES.SOIL:
                this.drawAutotiledSoil(ctx, px, py, x, y, map);
                break;

            case TILES.TREE:
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
                ctx.fillStyle = PALETTE.leaf_light + '22'; // Subtle alpha
                ctx.beginPath();
                ctx.arc(px + 20, py - 15, 10, 0, Math.PI * 2);
                ctx.fill();
                break;

            case TILES.STONE:
                // Shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.beginPath();
                ctx.ellipse(px + 25, py + 40, 15, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                // Rock Structure (3/4 depth)
                ctx.fillStyle = PALETTE.stone_dark; // Front
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
                break;

            case TILES.STONE_ORE:
                // Shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.beginPath();
                ctx.ellipse(px + 25, py + 40, 15, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                // Rock (3/4 perspective)
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
                break;

            case TILES.STONE_BOULDER:
                // Shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.ellipse(px + 25, py + 42, 18, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                // Large Boulder (3/4 Dome)
                ctx.fillStyle = '#616161';
                ctx.beginPath();
                ctx.ellipse(px + 25, py + 30, 20, 15, 0, 0, Math.PI * 2);
                ctx.fill();
                // Upper highlight
                ctx.fillStyle = '#757575';
                ctx.beginPath();
                ctx.ellipse(px + 22, py + 25, 12, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                break;

            case TILES.TREE_OAK:
                // Shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.ellipse(px + 25, py + 45, 18, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                // Trunk (Wide)
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
                break;

            case TILES.HOUSE:
                // Draw when bottom-left is reached for correct depth sorting
                if (map && this.isBottomLeftCorner(map, x, y, TILES.HOUSE)) {
                    this.drawHouse3x3(px, py - (TILE_SIZE * 2), ctx);
                }
                break;

            case TILES.SHOP:
                if (map && this.isBottomLeftCorner(map, x, y, TILES.SHOP)) {
                    this.drawShop3x3(px, py - (TILE_SIZE * 2), ctx);
                }
                break;

            case TILES.OLD_HOUSE:
                if (map && this.isBottomLeftCorner(map, x, y, TILES.OLD_HOUSE)) {
                    this.drawOldHouse8x4(px, py - (TILE_SIZE * 3), ctx);
                }
                break;

            case TILES.WITHERED:
                // Dead crop debris - brownish soil with dead plant matter
                ctx.fillStyle = '#4a3728';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Dead roots/stems
                ctx.fillStyle = '#6d5847';
                ctx.fillRect(px + 8, py + 15, 4, 20);
                ctx.fillRect(px + 20, py + 10, 3, 25);
                ctx.fillRect(px + 35, py + 18, 4, 18);
                // Wilted leaves
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
                break;

            default:
                ctx.fillStyle = colors.grass;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }

        // Grid line removed to break the "grid" look
    }

    /**
     * Draw a 3x3 house
     */
    drawHouse3x3(px, py, ctx) {
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

    drawFramedWindow(ctx, x, y, size) {
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
    drawShop3x3(px, py, ctx) {
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
    drawOldHouse8x4(px, py, ctx) {
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

    drawBoardedWindow(ctx, x, y) {
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
     * Draw NPC
     */
    drawNPC(ctx, x, y, id) {
        // Center NPC in tile
        const drawX = x + TILE_SIZE / 2;
        const drawY = y + TILE_SIZE / 2;

        if (id === 'old_man') {
            // Use standard player-like proportions for Old Man
            const px = drawX - 10;
            const py = drawY - 15;

            // Robe/Body
            ctx.fillStyle = '#6d4c41';
            ctx.fillRect(px + 2, py + 8, 16, 22);

            // Head
            ctx.fillStyle = '#ffcc80';
            ctx.fillRect(px + 2, py - 6, 16, 14);

            // Beard (White, 3/4 depth)
            ctx.fillStyle = '#eeeeee';
            ctx.fillRect(px + 2, py + 4, 16, 8);
            ctx.fillRect(px + 4, py + 12, 12, 6);

            // Staff
            ctx.fillStyle = '#8d6e63';
            ctx.fillRect(px + 20, py - 5, 4, 38);

            // Eyes
            ctx.fillStyle = 'black';
            ctx.fillRect(px + 5, py - 2, 2, 2);
            ctx.fillRect(px + 13, py - 2, 2, 2);
        }
    }

    /**
     * Draw a crop
     */
    drawCrop(crop, x, y) {
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
    drawInteriorTile(tileType, x, y) {
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
                // Counter Top
                ctx.fillStyle = PALETTE.stone;
                ctx.fillRect(px, py + 5, TILE_SIZE, TILE_SIZE - 5);
                // Counter Front Detail
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px, py + 15, TILE_SIZE, TILE_SIZE - 15);
                // Border
                ctx.strokeStyle = PALETTE.wood_dark;
                ctx.lineWidth = 1;
                ctx.strokeRect(px, py + 5, TILE_SIZE, TILE_SIZE - 5);
                break;

            case INTERIOR_TILES.SHELF:
                // Floor
                ctx.fillStyle = '#deb887';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Shelf backing
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                // Shelves
                ctx.fillStyle = '#8d6e63';
                ctx.fillRect(px + 4, py + 15, TILE_SIZE - 8, 4);
                ctx.fillRect(px + 4, py + 30, TILE_SIZE - 8, 4);
                // Items
                ctx.fillStyle = '#ef5350';
                ctx.fillRect(px + 8, py + 8, 6, 6);
                ctx.fillStyle = '#42a5f5';
                ctx.fillRect(px + 20, py + 8, 5, 7);
                ctx.fillStyle = '#ffca28';
                ctx.fillRect(px + 10, py + 22, 8, 6);
                break;

            case INTERIOR_TILES.TV:
                // Floor
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // TV Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillRect(px + 6, py + 35, TILE_SIZE - 12, 10);
                // CRT Box (3/4 depth)
                ctx.fillStyle = PALETTE.black;
                ctx.fillRect(px + 5, py + 5, TILE_SIZE - 10, 30);
                // Screen
                ctx.fillStyle = PALETTE.water_dark;
                ctx.fillRect(px + 10, py + 8, TILE_SIZE - 25, 20);
                // Stand
                ctx.fillStyle = PALETTE.stone;
                ctx.fillRect(px + 15, py + 35, TILE_SIZE - 30, 5);
                break;

            case INTERIOR_TILES.COUCH:
                // Floor
                ctx.fillStyle = PALETTE.wood;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(px + 4, py + 35, TILE_SIZE - 8, 10);
                // Backboard (3/4 perspective high)
                ctx.fillStyle = PALETTE.stone_dark;
                ctx.fillRect(px + 2, py, TILE_SIZE - 4, 30);
                // Cushions
                ctx.fillStyle = PALETTE.stone;
                ctx.fillRect(px + 2, py + 15, TILE_SIZE - 4, 25);
                break;
                ctx.fillRect(px + 8, py + 20, TILE_SIZE - 16, 25);
                break;

            case INTERIOR_TILES.PLANT:
                // Floor
                ctx.fillStyle = '#deb887';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Pot
                ctx.fillStyle = '#d84315';
                ctx.beginPath();
                ctx.moveTo(px + 15, py + 45);
                ctx.lineTo(px + 35, py + 45);
                ctx.lineTo(px + 40, py + 30);
                ctx.lineTo(px + 10, py + 30);
                ctx.fill();
                // Leaves
                ctx.fillStyle = '#43a047';
                ctx.beginPath();
                ctx.arc(px + 25, py + 25, 12, 0, Math.PI * 2);
                ctx.fill();
                break;

            default:
                // Default floor
                ctx.fillStyle = '#deb887';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }

        // Grid line removed to break the "grid" look
    }

    /**
     * Draw autotiled soil
     */
    drawAutotiledSoil(ctx, px, py, x, y, map) {
        // bitmask: 1=N, 2=E, 4=S, 8=W
        let mask = 0;
        if (y > 0 && map[y - 1] && map[y - 1][x] === TILES.SOIL) mask |= 1;
        if (x < map[0].length - 1 && map[y][x + 1] === TILES.SOIL) mask |= 2;
        if (y < map.length - 1 && map[y + 1] && map[y + 1][x] === TILES.SOIL) mask |= 4;
        if (x > 0 && map[y][x - 1] === TILES.SOIL) mask |= 8;

        const inset = 4;
        const radius = 12;

        // Base Dirt
        ctx.fillStyle = PALETTE.soil;

        const tlR = (mask & 9) === 9 ? 0 : radius;
        const trR = (mask & 3) === 3 ? 0 : radius;
        const brR = (mask & 6) === 6 ? 0 : radius;
        const blR = (mask & 12) === 12 ? 0 : radius;

        const x1 = (mask & 8) ? px : px + inset;
        const y1 = (mask & 1) ? py : py + inset;
        const x2 = (mask & 2) ? px + TILE_SIZE : px + TILE_SIZE - inset;
        const y2 = (mask & 4) ? py + TILE_SIZE : py + TILE_SIZE - inset;
        const w = x2 - x1;
        const h = y2 - y1;

        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x1, y1, w, h, [tlR, trR, brR, blR]);
        } else {
            ctx.rect(x1, y1, w, h);
        }
        ctx.fill();

        // Dirt Texture
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let i = 1; i < 4; i++) {
            const ty = y1 + (h / 4) * i;
            ctx.fillRect(x1 + 2, ty, w - 4, 1);
        }
    }

    /**
     * Draw procedural grass decoration
     */
    drawGrassDecoration(ctx, px, py, x, y) {
        const seed = (x * 73856093) ^ (y * 19349663);
        const rand = (Math.abs(seed) % 100) / 100;

        if (rand < 0.15) {
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            const ox = 10 + rand * 20;
            const oy = 10 + (1 - rand) * 20;
            ctx.fillRect(px + ox, py + oy, 2, 4);
            ctx.fillRect(px + ox + 4, py + oy - 2, 2, 6);
        } else if (rand < 0.18) {
            const fx = px + 15 + rand * 15;
            const fy = py + 15 + (1 - rand) * 15;
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(fx, fy, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffd54f';
            ctx.beginPath();
            ctx.arc(fx, fy, 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

export default TileRenderer;
