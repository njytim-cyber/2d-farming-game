/**
 * Main Game Controller
 * Orchestrates all game systems and the main loop
 */

import {
    TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, TILES, SEEDS,
    ENERGY_COST, INTERIOR_TILES, RESOURCE_TYPES, NPC_IDS
} from './constants.js';
import { getState, setState, replaceState, createInitialState } from './state.js';
import { generateMap, isSolid, setTile } from '../systems/MapGenerator.js';
import { generateHouseInterior, generateShopInterior, generateOldHouseInterior, isInteriorSolid, getInteriorSpawn } from '../systems/InteriorMaps.js';
import { saveGame, loadGame, hasSave, startAutoSave, onSave, resetGame } from '../systems/SaveManager.js';
import { Inventory } from '../systems/Inventory.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { Pet } from '../entities/Pet.js';
import { PetNameModal } from '../ui/PetNameModal.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { Player } from '../entities/Player.js';
import { Renderer } from '../rendering/Renderer.js';
import { TileRenderer } from '../rendering/TileRenderer.js';
import { InputManager } from '../input/InputManager.js';
import { UIManager } from '../ui/UIManager.js';
import { CreatorModal } from '../ui/CreatorModal.js';
import { ShopModal } from '../ui/ShopModal.js';
import { CookingModal } from '../ui/CookingModal.js';
import { CONSUMABLES, consumeFood } from '../systems/Recipes.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new Renderer(this.canvas);
        this.tileRenderer = new TileRenderer(this.renderer.ctx);
        this.inputManager = new InputManager();
        this.uiManager = new UIManager();
        this.particleSystem = new ParticleSystem();

        this.player = null;
        this.inventory = null;
        this.timeSystem = null;
        this.creatorModal = null;
        this.shopModal = null;
        this.cookingModal = null;

        this.isRunning = false;
        this.bufferedMove = null;
        this.attackCooldown = 0;
    }

    /**
     * Initialize the game
     */
    init() {
        // Setup save indicator
        onSave(() => this.uiManager.showSaveIndicator());

        // Setup creator modal
        this.creatorModal = new CreatorModal(
            this.uiManager,
            () => this.startNewGame(),
            () => this.continueGame()
        );

        // Setup shop modal
        this.shopModal = new ShopModal(this.uiManager, {
            onBuy: (seedType) => this.buyItem(seedType),
            onSell: (slotIndex, value) => this.sellItem(slotIndex, value),
            onClose: () => this.closeShop(),
            onReset: () => this.resetGameData()
        });

        // Setup house modal buttons
        this.setupHouseModal();

        // Setup cooking modal
        this.cookingModal = new CookingModal(this.uiManager, {
            onCook: (recipeKey) => {
                this.showToast(`Cooked ${recipeKey.replace(/_/g, ' ')}!`, '#81c784');
                this.syncInventory();
                saveGame();
            },
            onConsume: (slotIdx) => this.consumeFoodItem(slotIdx),
            onClose: () => setState({ screen: 'GAME' })
        });

        // Initialize with state
        const state = getState();
        this.player = new Player(state.player);
        this.inventory = new Inventory(state.inventory.slots, state.inventory.selected);
        this.timeSystem = new TimeSystem(state);

        // Setup UI callbacks
        this.uiManager.onSlotSelect((idx) => this.interactWithSelected(idx));
        this.uiManager.onEquip((idx) => this.equipItem(idx));

        // Show creator/continue screen
        this.creatorModal.show(this.player, hasSave());

        // Start game loop
        this.isRunning = true;
        this.loop();
    }

    /**
     * Setup house modal buttons
     */
    setupHouseModal() {
        const sleepBtn = document.querySelector('#house-modal .btn--start');
        const leaveBtn = document.querySelector('#house-modal .btn--secondary');

        if (sleepBtn) {
            sleepBtn.onclick = () => this.sleep();
        }
        if (leaveBtn) {
            leaveBtn.onclick = () => this.closeHouseModal();
        }
    }

    /**
     * Close house modal without exiting
     */
    closeHouseModal() {
        this.uiManager.setHouseVisible(false);
    }

    /**
     * Continue existing game
     */
    continueGame() {
        if (loadGame()) {
            const state = getState();
            this.player = new Player(state.player);
            this.inventory = new Inventory(state.inventory.slots, state.inventory.selected);
            this.timeSystem = new TimeSystem(state);

            // Re-create pet if exists in save (need to add to save schema later)
            // For now, spawn a pet if one isn't saved, or default
            // Re-create pet if exists in save
            if (state.pet) {
                this.pet = new Pet(state.pet.gridX, state.pet.gridY);
                this.pet.name = state.pet.name;
                this.pet.color = state.pet.color;
                this.pet.state = state.pet.state || 'IDLE';
            } else {
                this.pet = new Pet(this.player.gridX + 1, this.player.gridY); // Default companion
            }

            this.uiManager.setupEquipment(this.player);

            // Validate player position
            if (this.player.gridX >= MAP_WIDTH || this.player.gridY >= MAP_HEIGHT ||
                isSolid(state.map, this.player.gridX, this.player.gridY, state.crops, SEEDS)) {
                this.player.gridX = Math.floor(MAP_WIDTH / 2);
                this.player.gridY = Math.floor(MAP_HEIGHT / 2);
                this.player.visX = this.player.gridX * TILE_SIZE;
                this.player.visY = this.player.gridY * TILE_SIZE;
            }

            setState({ screen: 'GAME' });
            this.uiManager.setCreatorVisible(false);
            this.setupInput();
            this.updateUI();
            startAutoSave();
        }
    }

    /**
     * Start a new game
     */
    startNewGame() {
        const { map, npcs } = generateMap();

        this.player.gridX = Math.floor(MAP_WIDTH / 2);
        this.player.gridY = Math.floor(MAP_HEIGHT / 2);
        this.player.visX = this.player.gridX * TILE_SIZE;
        this.player.visY = this.player.gridY * TILE_SIZE;
        this.player.facing = { x: 0, y: 1 };

        this.uiManager.setupEquipment(this.player);

        this.inventory = new Inventory();
        this.inventory.addItem('turnip_seed', 5);

        this.timeSystem = new TimeSystem();

        // Spawn Pet for intro (Right of player, definitely visible)
        this.pet = new Pet(32, 30);
        this.petIntroTriggered = false;

        // Trigger pet intro after a short delay
        setTimeout(() => {
            if (!this.petIntroTriggered) this.triggerPetIntro();
        }, 1000);

        setState({
            screen: 'GAME',
            map,
            npcs: npcs || [],
            player: this.player.serialize(),
            inventory: this.inventory.serialize(),
            crops: {},
            money: 100,
            zoom: 1.0,
            ...this.timeSystem.serialize()
        });

        this.uiManager.setCreatorVisible(false);
        this.setupInput();
        this.updateUI();
        saveGame();
        saveGame();
        startAutoSave();
    }

    triggerPetIntro() {
        if (!this.pet) return;
        this.bufferedMove = null;
        this.attackCooldown = 0;
        this.petIntroTriggered = false;
        this.introActive = true;
        this.pet.state = 'FOLLOW';
        this.showToast('Something is approaching...', '#ffb74d');
    }

    /**
     * Setup input handlers
     */
    setupInput() {
        this.inputManager.enable();

        this.inputManager.onMove((dx, dy) => {
            this.attemptMove(dx, dy);
        });

        this.inputManager.onAction(() => {
            this.interact();
        });

        this.inputManager.onClick((tileX, tileY) => {
            const state = getState();
            if (state.screen !== 'GAME') return;

            const dx = tileX - this.player.gridX;
            const dy = tileY - this.player.gridY;

            if (Math.abs(dx) + Math.abs(dy) === 1) {
                this.player.facing = { x: dx, y: dy };
                setState({ destination: null });
            } else {
                setState({ destination: { x: tileX, y: tileY } });
            }
        });

        this.inputManager.onZoom((delta) => {
            const state = getState();
            let zoom = state.zoom + delta;
            zoom = Math.max(0.5, Math.min(2.0, zoom));
            setState({ zoom });
        });

        // Setup canvas input
        this.inputManager.setupCanvasInput(this.canvas, (screenX, screenY) => {
            const state = getState();
            return this.renderer.screenToTile(screenX, screenY, state.camera, state.zoom);
        });

        // Setup FAB
        const fabBtn = document.getElementById('fab-action');
        if (fabBtn) {
            this.inputManager.setupActionButton(fabBtn);
        }

        // Setup zoom buttons
        const zoomBtns = document.querySelectorAll('.zoom-btn');
        if (zoomBtns.length >= 2) {
            this.inputManager.setupZoomButtons(zoomBtns[0], zoomBtns[1]);
        }
    }

    /**
     * Attempt to move player
     * Handles input buffering
     */
    attemptMove(dx, dy) {
        const state = getState();
        if (state.screen !== 'GAME') return;

        // Buffer input if already moving
        if (this.player.isMoving) {
            this.bufferedMove = { dx, dy };
            return;
        }

        // Clear any click-to-move destination when using keyboard
        setState({ destination: null });

        this.player.facing = { x: dx, y: dy };
        const newX = this.player.gridX + dx;
        const newY = this.player.gridY + dy;

        // Get current map and check bounds/solidity
        const currentMap = this.getCurrentMap(state);
        const mapHeight = currentMap.length;
        const mapWidth = currentMap[0]?.length || 0;

        if (newX >= 0 && newX < mapWidth && newY >= 0 && newY < mapHeight) {
            if (!this.isTileSolid(state, newX, newY)) {
                this.player.gridX = newX;
                this.player.gridY = newY;
                this.player.isMoving = true;
            }
        }
    }

    /**
     * Main game loop
     */
    loop(lastTime) {
        if (!this.isRunning) return;

        const now = performance.now();
        const dt = lastTime ? (now - lastTime) / 1000 : 1 / 60;

        this.update(dt);
        this.draw();

        requestAnimationFrame(() => this.loop(now));
    }

    /**
     * Update game state
     */
    update(dt) {
        const state = getState();
        if (state.screen !== 'GAME') return;

        if (this.attackCooldown > 0) this.attackCooldown--;

        // Update player movement
        if (this.player.isMoving) {
            this.player.update(dt);
        }

        // Update player buffs
        this.player.updateBuffs(dt);

        // Check input if not moving (or just finished moving)
        if (!this.player.isMoving) {
            // Check for step-on triggers (e.g. exiting house)
            if (state.currentMap !== 'overworld') {
                const currentMap = this.getCurrentMap(state);
                const tile = currentMap[this.player.gridY][this.player.gridX];
                if (tile === INTERIOR_TILES.DOOR) {
                    this.exitHouse();
                    return;
                }
            }

            // Poll for continuous smooth movement
            const { x, y } = this.inputManager.moveDirection;
            if (x !== 0 || y !== 0) {
                this.attemptMove(x, y);
            }
            else if (state.destination) {
                this.processPathfinding(state);
            }
        }

        // Update time
        const newDayStarted = this.timeSystem.update();
        if (newDayStarted) {
            this.showToast(`Day ${this.timeSystem.dayCount}: ${this.timeSystem.getSeasonName()}, ${this.timeSystem.getWeatherMessage()}`);

            // Handle season change - wither out-of-season crops
            if (this.timeSystem.seasonChanged) {
                this.handleSeasonChange(state);
            }
        }

        // Update crops (only if not withered)
        for (const key in state.crops) {
            const crop = state.crops[key];
            if (!crop.withered && crop.stage < 100) {
                crop.stage += SEEDS[crop.type].grow;
            }
        }

        // Update particles
        const view = this.renderer.getViewSize(state.zoom);
        if (this.timeSystem.weather === 'Rain' && state.currentMap === 'overworld') {
            this.particleSystem.addRain(state.camera.x, state.camera.y, view.width, this.timeSystem.season === 3);
        }
        this.particleSystem.update(state.camera.y, view.height);

        // Update messages
        state.messages = state.messages.filter(m => m.life-- > 0);

        // Sync state
        setState({
            player: this.player.serialize(),
            pet: this.pet ? this.pet.serialize() : null,
            ...this.timeSystem.serialize(),
            messages: state.messages
        });

        this.updateUI();

        // Update Pet
        if (this.pet) {
            this.pet.update(dt, this.player);

            // Check for intro trigger proximity (use visual coordinates for smoothness)
            if (this.introActive && !this.petIntroTriggered) {
                // Check visual distance (in pixels)
                const dist = Math.hypot(this.pet.visX - this.player.visX, this.pet.visY - this.player.visY);

                // Trigger when within ~1.2 tiles visually (60 pixels)
                if (dist <= 60) {
                    this.petIntroTriggered = true;
                    this.introActive = false;
                    this.pet.state = 'IDLE';

                    // Show naming modal
                    const modal = new PetNameModal(this.uiManager, (name) => {
                        this.pet.name = name;
                        this.showToast(`Adopted ${name}!`, '#ffb74d');
                        saveGame();
                    });
                    modal.show();
                }
            }
        }
    }

    /**
     * Process pathfinding to destination
     */
    processPathfinding(state) {
        const dest = state.destination;
        const dx = dest.x - this.player.gridX;
        const dy = dest.y - this.player.gridY;

        if (dx === 0 && dy === 0) {
            setState({ destination: null });
            return;
        }

        const sx = Math.sign(dx);
        const sy = Math.sign(dy);

        const tryMove = (ax, ay) => {
            if (!isSolid(state.map, this.player.gridX + ax, this.player.gridY + ay, state.crops, SEEDS)) {
                this.player.gridX += ax;
                this.player.gridY += ay;
                this.player.facing = { x: ax || 0, y: ay || 0 };
                this.player.isMoving = true;
                return true;
            }
            return false;
        };

        let moved = false;
        if (Math.abs(dx) >= Math.abs(dy)) {
            if (sx !== 0) moved = tryMove(sx, 0) || (sy !== 0 && tryMove(0, sy));
        } else {
            if (sy !== 0) moved = tryMove(0, sy) || (sx !== 0 && tryMove(sx, 0));
        }

        if (!moved) {
            this.player.facing = {
                x: Math.abs(dx) >= Math.abs(dy) ? sx : 0,
                y: Math.abs(dy) > Math.abs(dx) ? sy : 0
            };
            setState({ destination: null });
        }
    }

    /**
     * Interact with facing tile
     */
    interact() {
        const state = getState();
        if (state.screen !== 'GAME') return;

        const { gridX, gridY, facing } = this.player;
        const tx = gridX + facing.x;
        const ty = gridY + facing.y;

        const currentMap = this.getCurrentMap(state);
        const mapHeight = currentMap.length;
        const mapWidth = currentMap[0]?.length || 0;

        if (tx < 0 || tx >= mapWidth || ty < 0 || ty >= mapHeight) return;

        const tile = currentMap[ty][tx];
        const key = `${tx},${ty}`;
        const selectedItem = this.inventory.getSelectedItem();

        // Check for NPC interaction on the current map
        let currentNpcs = [];
        if (state.currentMap === 'overworld') {
            currentNpcs = state.npcs || [];
        } else {
            const interiorKey = state.currentMap.replace('Interior', '');
            const interior = state.interiors[interiorKey];
            currentNpcs = interior?.npcs || [];
        }

        if (currentNpcs.length > 0) {
            const npc = currentNpcs.find(n => n.x === tx && n.y === ty);
            if (npc) {
                this.interactWithNPC(npc);
                return;
            }
        }

        setState({ destination: null });

        // Interior door - exit to overworld
        if (state.currentMap !== 'overworld' && tile === INTERIOR_TILES.DOOR) {
            this.exitHouse(); // exitHouse now handles returning to previous pos, works for Shop too
            return;
        }

        // Shop Counter - Open Shop
        if (state.currentMap.includes('shop') && tile === INTERIOR_TILES.COUNTER) {
            setState({ screen: 'SHOP' });
            this.shopModal.show(this.inventory, this.timeSystem.season);
            return;
        }

        // Interior bed - sleep option
        if (state.currentMap !== 'overworld' && tile === INTERIOR_TILES.BED) {
            this.uiManager.setHouseVisible(true);
            return;
        }

        // Interior stove - cooking
        if (state.currentMap !== 'overworld' && tile === INTERIOR_TILES.STOVE) {
            setState({ screen: 'COOKING' });
            this.cookingModal.show(this.inventory);
            return;
        }

        // Only allow outdoor interactions in overworld
        if (state.currentMap !== 'overworld' && !state.currentMap.includes('shop')) {
            return;
        }

        // Shop (Overworld)
        if (tile === TILES.SHOP) {
            this.enterShop();
            return;
        }

        // House (Overworld)
        if (tile === TILES.HOUSE) {
            this.enterHouse();
            return;
        }

        // Old House (Abandoned)
        if (tile === TILES.OLD_HOUSE) {
            this.enterBuilding('old_house');
            return;
        }

        // Stone/Ore/Boulder
        if (tile === TILES.STONE) {
            this.hitResource(tx, ty, 'STONE');
            return;
        }
        if (tile === TILES.STONE_ORE) {
            this.hitResource(tx, ty, 'ORE');
            return;
        }
        if (tile === TILES.STONE_BOULDER) {
            this.hitResource(tx, ty, 'BOULDER');
            return;
        }

        // Tree/Oak
        if (tile === TILES.TREE) {
            this.hitResource(tx, ty, 'TREE');
            return;
        }
        if (tile === TILES.TREE_OAK) {
            this.hitResource(tx, ty, 'OAK');
            return;
        }

        // Clear withered debris back to soil
        if (tile === TILES.WITHERED) {
            if (this.timeSystem.consumeEnergy(2)) {  // Low energy cost to clear
                setTile(state.map, tx, ty, TILES.SOIL);
                this.particleSystem.createBurst(tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + TILE_SIZE / 2, '#8b7355');
                this.showToast('Cleared debris');
            } else {
                this.showToast('Too Exhausted!', '#ef5350');
            }
            return;
        }

        // Till grass to soil
        if (tile === TILES.GRASS) {
            if (this.timeSystem.consumeEnergy(ENERGY_COST.TILL_SOIL)) {
                setTile(state.map, tx, ty, TILES.SOIL);
                this.particleSystem.createBurst(tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + TILE_SIZE / 2, '#795548');
                this.showToast('Tilled Soil');
            } else {
                this.showToast('Too Exhausted!', '#ef5350');
            }
            return;
        }

        // Plant seed
        if (tile === TILES.SOIL && !state.crops[key]) {
            if (selectedItem && selectedItem.name.endsWith('_seed')) {
                const type = selectedItem.name.replace('_seed', '');
                const seedData = SEEDS[type];

                // Check season validity
                if (seedData.seasons && !seedData.seasons.includes(this.timeSystem.season)) {
                    const seasonNames = ['Spring', 'Summer', 'Fall', 'Winter'];
                    const validSeasons = seedData.seasons.map(s => seasonNames[s]).join('/');
                    this.showToast(`${seedData.name}: ${validSeasons} only!`, '#ef5350');
                    return;
                }

                if (this.timeSystem.consumeEnergy(ENERGY_COST.PLANT)) {
                    this.inventory.removeFromSlot(this.inventory.selected, 1);
                    state.crops[key] = { type, stage: 0 };
                    this.showToast('Planted ' + seedData.name);
                    this.syncInventory();
                    saveGame();
                } else {
                    this.showToast('Too Exhausted!', '#ef5350');
                }
            } else {
                this.showToast('Select Seeds!', '#ffa726');
            }
            return;
        }

        // Harvest crop
        if (state.crops[key] && state.crops[key].stage >= 100) {
            if (this.timeSystem.consumeEnergy(ENERGY_COST.HARVEST)) {
                const crop = state.crops[key];
                const data = SEEDS[crop.type];
                this.inventory.addItem(crop.type, 1);

                if (data.isTree) {
                    // Fruit tree - regrows fruit
                    crop.stage = data.regrow;
                    this.showToast('Harvested ' + data.name);
                } else if (data.regrowable) {
                    // Regrowable crop (corn, tomato, etc.) - resets to regrowStage
                    crop.stage = data.regrowStage;
                    this.showToast('Harvested ' + data.name + '!');
                } else {
                    // Single harvest crop - destroyed after harvest
                    if (Math.random() > 0.6) this.inventory.addItem(crop.type + '_seed', 1);
                    delete state.crops[key];
                    setTile(state.map, tx, ty, TILES.SOIL);
                    this.showToast('Got ' + data.name);
                }

                this.particleSystem.createBurst(tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + TILE_SIZE / 2, data.color);
                this.syncInventory();
                saveGame();
            } else {
                this.showToast('Too Exhausted!', '#ef5350');
            }
        }
    }

    /**
     * Enter house - switch to interior map
     */
    enterHouse() {
        const state = getState();
        if (state.currentMap !== 'overworld') return; // Fix infinite loop/re-entry

        this.enterBuilding('house');
    }

    /**
     * Enter shop - switch to interior map
     */
    enterShop() {
        this.enterBuilding('shop');
    }

    /**
     * Generic Enter Building
     */
    enterBuilding(type) {
        const state = getState();
        if (state.currentMap !== 'overworld') return; // Fix infinite loop/re-entry

        // Save current overworld position
        const lastPos = {
            x: this.player.gridX,
            y: this.player.gridY
        };

        const spawn = getInteriorSpawn(type);

        let interior = state.interiors[type];
        if (!interior) {
            if (type === 'house') interior = generateHouseInterior();
            else if (type === 'shop') interior = generateShopInterior();
            else if (type === 'old_house') {
                interior = generateOldHouseInterior();
            }
            else interior = generateHouseInterior(); // Fallback
        }

        setState({
            screen: 'GAME',
            currentMap: type + 'Interior', // e.g. houseInterior, shopInterior, old_houseInterior
            lastOverworldPos: lastPos,
            interiors: { ...state.interiors, [type]: interior },
            player: {
                ...this.player.serialize(),
                gridX: spawn.x,
                gridY: spawn.y,
                visX: spawn.x * TILE_SIZE,
                visY: spawn.y * TILE_SIZE,
                facing: { x: 0, y: -1 } // Face up when entering
            }
        });

        this.player.gridX = spawn.x;
        this.player.gridY = spawn.y;
        this.player.visX = spawn.x * TILE_SIZE;
        this.player.visY = spawn.y * TILE_SIZE;
        this.player.facing = { x: 0, y: -1 };

        let name = type.charAt(0).toUpperCase() + type.slice(1);
        if (type === 'old_house') name = 'Old Shack';
        this.showToast(`Entering ${name}...`, '#90caf9');
    }

    /**
     * Exit building - return to overworld
     */
    exitHouse() {
        const state = getState();

        // Restore overworld position (in front of door)
        // Adjust logic to place player correctly adjacent to the building if needed
        let lastPos = state.lastOverworldPos || {
            x: Math.floor(MAP_WIDTH / 2),
            y: Math.floor(MAP_HEIGHT / 2)
        };

        // Simple restoration for now, could be smarter about which side of door
        // Reset player state
        this.player.gridX = lastPos.x;
        this.player.gridY = lastPos.y;
        this.player.visX = lastPos.x * TILE_SIZE;
        this.player.visY = lastPos.y * TILE_SIZE;
        this.player.isMoving = false;
        this.player.facing = { x: 0, y: 1 }; // Face down (away from building)

        setState({
            screen: 'GAME',
            currentMap: 'overworld',
            player: this.player.serialize()
        });

        // Ensure we handle building-specific logic if needed
        if (state.currentMap === 'houseInterior') {
            this.uiManager.setHouseVisible(false);
        }
    }

    /**
     * Sleep and start new day
     */
    sleep() {
        const state = getState();
        this.timeSystem.startNewDay();
        this.showToast(`Day ${this.timeSystem.dayCount}: ${this.timeSystem.getSeasonName()}, ${this.timeSystem.getWeatherMessage()}`);

        // Handle season change - wither out-of-season crops
        if (this.timeSystem.seasonChanged) {
            this.handleSeasonChange(state);
        }

        this.closeHouseModal();
        saveGame();
    }

    /**
     * Handle season change - wither crops that can't grow in new season
     */
    handleSeasonChange(state) {
        const currentSeason = this.timeSystem.season;
        const seasonNames = ['Spring', 'Summer', 'Fall', 'Winter'];
        let witheredCount = 0;

        for (const [key, crop] of Object.entries(state.crops)) {
            const data = SEEDS[crop.type];

            // Skip trees - they persist across seasons
            if (data.isTree) continue;

            // If crop has seasons defined and is not valid in current season
            if (data.seasons && !data.seasons.includes(currentSeason)) {
                // Parse position
                const [x, y] = key.split(',').map(Number);

                // Remove the crop
                delete state.crops[key];

                // Place withered debris on that tile
                setTile(state.map, x, y, TILES.WITHERED);

                witheredCount++;
            }
        }

        if (witheredCount > 0) {
            this.showToast(`${witheredCount} crops withered in ${seasonNames[currentSeason]}!`, '#ef5350');
        }

        saveGame();
    }

    /**
     * Buy item from shop
     */
    buyItem(seedType) {
        const state = getState();
        const cost = SEEDS[seedType].cost;

        if (state.money >= cost) {
            if (this.inventory.addItem(seedType + '_seed', 1)) {
                setState({ money: state.money - cost });
                this.syncInventory();
                saveGame();
            }
        } else {
            this.showToast('Need Cash!', '#ef5350');
        }
    }

    /**
     * Sell item
     */
    sellItem(slotIndex, value) {
        const state = getState();
        this.inventory.removeFromSlot(slotIndex, 1);
        setState({ money: state.money + value });
        this.syncInventory();
        saveGame();
    }

    /**
     * Equip item from inventory
     */
    equipItem(slotIndex) {
        const state = getState();
        const item = this.inventory.slots[slotIndex];
        if (!item) return;

        const data = ITEM_DATA[item.name] || SEEDS[item.name];
        if (!data || !data.type) return;

        // Weapon/Equipment logic
        if (data.type === 'weapon') {
            const oldWeapon = this.player.equipment.weapon;
            this.player.equipment.weapon = { ...data, key: item.name };

            // Remove from inventory
            this.inventory.removeFromSlot(slotIndex, 1);

            // Return old weapon if exists
            if (oldWeapon) {
                this.inventory.addItem(oldWeapon.key, 1);
            }

            this.showToast(`Equipped ${data.name}`);
        } else {
            this.showToast(`Cannot equip ${item.name}`);
            return;
        }

        setState({ player: this.player.serialize() });
        this.syncInventory();
        if (this.uiManager.equipmentModal) this.uiManager.equipmentModal.render();
        saveGame();
    }

    /**
     * Attack with equipped weapon
     */
    attack() {
        if (!this.player.equipment.weapon) return;
        if (this.attackCooldown > 0) return;

        this.attackCooldown = 20; // ~0.3s at 60fps
        this.player.startAttack(); // Trigger visual animation

        // Visual effect
        const { gridX, gridY, facing } = this.player;
        const tx = gridX + facing.x;
        const ty = gridY + facing.y;

        this.particleSystem.createBurst(
            tx * TILE_SIZE + TILE_SIZE / 2,
            ty * TILE_SIZE + TILE_SIZE / 2,
            '#ffffff', 10
        );

        this.showToast("Hyah!");

        // Future: Check for enemies in range
    }

    /**
     * Close shop
     */
    closeShop() {
        setState({ screen: 'GAME' });
        this.shopModal.hide();
    }

    /**
     * Consume a food item from inventory
     */
    consumeFoodItem(slotIdx) {
        const item = this.inventory.slots[slotIdx];
        if (!item) return;

        const consumable = CONSUMABLES[item.name];
        if (!consumable) {
            this.showToast('Cannot eat this!', '#ef5350');
            return;
        }

        // Restore energy
        this.timeSystem.energy = Math.min(
            this.timeSystem.energy + consumable.energy,
            this.timeSystem.maxEnergy
        );

        // Remove item
        this.inventory.removeFromSlot(slotIdx, 1);

        // Apply buff if any
        if (consumable.buff) {
            this.player.applyBuff(consumable.buff);
            const buffName = consumable.buff.type.replace(/([A-Z])/g, ' $1').trim();
            this.showToast(`${buffName} active!`, '#4fc3f7');
        }

        this.showToast(`+${consumable.energy} Energy`, '#81c784');
        this.syncInventory();
        saveGame();
    }

    /**
     * Reset game data
     */
    resetGameData() {
        resetGame();
        location.reload();
    }

    /**
     * Sync inventory to state
     */
    syncInventory() {
        setState({ inventory: this.inventory.serialize() });
    }

    /**
     * Show toast message
     */
    showToast(text, color = 'white') {
        const state = getState();
        state.messages.push({ text, color, life: 60 });
    }

    /**
     * Update UI
     */
    updateUI() {
        const state = getState();

        this.uiManager.renderInventory(this.inventory);
        this.uiManager.updateStats({
            money: state.money,
            day: this.timeSystem.dayCount,
            season: this.timeSystem.season,
            weather: this.timeSystem.weather,
            energy: this.timeSystem.energy,
            maxEnergy: this.timeSystem.maxEnergy,
            timeString: this.timeSystem.getTimeString(),
            hp: this.player.hp,
            maxHp: this.player.maxHp
        });
    }

    /**
     * Draw the game
     */
    draw() {
        const state = getState();
        if (state.screen === 'CREATOR') return;

        this.renderer.clear();

        // Update camera
        const currentMap = this.getCurrentMap(state);
        const mapHeight = currentMap.length;
        const mapWidth = currentMap[0]?.length || 0;

        const camera = this.renderer.updateCamera(this.player.visX, this.player.visY, state.zoom, mapWidth, mapHeight);
        setState({ camera });

        // Begin world drawing
        this.renderer.beginWorldDraw(camera, state.zoom);

        // Calculate Darkness (0.0=Day, 0.7=Night)
        const hour = this.timeSystem.hour;
        let darkness = 0;
        if (hour >= 18 || hour < 6) {
            // Transition sunset/sunrise
            if (hour >= 18 && hour < 22) darkness = (hour - 18) / 4 * 0.7;
            else if (hour >= 22 || hour < 4) darkness = 0.7;
            else if (hour >= 4 && hour < 6) darkness = (1 - (hour - 4) / 2) * 0.7;
        }

        const range = this.renderer.getVisibleTileRange(camera, state.zoom);

        // --- Pass 1: Ground Tiles ---
        for (let y = range.startY; y < range.endY; y++) {
            for (let x = range.startX; x < range.endX; x++) {
                if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) continue;
                const tile = currentMap[y][x];

                if (state.currentMap === 'overworld') {
                    // Always draw grass as base
                    this.tileRenderer.drawTile(TILES.GRASS, x, y, this.timeSystem.season, currentMap);

                    if (tile === TILES.SOIL || tile === TILES.WITHERED) {
                        this.tileRenderer.drawTile(tile, x, y, this.timeSystem.season, currentMap);
                    }
                } else {
                    if (tile === INTERIOR_TILES.FLOOR || tile === INTERIOR_TILES.RUG || tile === INTERIOR_TILES.DOOR) {
                        this.tileRenderer.drawInteriorTile(tile, x, y);
                    }
                }
            }
        }

        // --- Pass 2: Sorted Standing Objects & Entities ---
        // We draw row by row. For each row, we draw standing tiles, then entities.
        for (let y = range.startY; y < range.endY; y++) {
            // 1. Standing Tiles for this row
            for (let x = range.startX; x < range.endX; x++) {
                if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) continue;
                const tile = currentMap[y][x];

                if (state.currentMap === 'overworld') {
                    // Only draw NOT ground tiles (Trees, Buildings)
                    if (tile !== TILES.GRASS && tile !== TILES.SOIL && tile !== TILES.WITHERED) {
                        // For buildings, we only want to draw the full building when we hit the BOTTOM row of its 3x3 footprint 
                        // so that players standing "behind" it (in higher rows) are drawn before it.
                        // However, isTopLeftCorner logic draws it all. Let's adjust for depth sorting.
                        // Simplification: just draw it. True y-sorting for multi-tile objects is tricky but this helps.
                        this.tileRenderer.drawTile(tile, x, y, this.timeSystem.season, currentMap);
                    }
                    const crop = state.crops[`${x},${y}`];
                    if (crop) this.tileRenderer.drawCrop(crop, x, y);
                } else {
                    if (tile !== INTERIOR_TILES.FLOOR && tile !== INTERIOR_TILES.RUG && tile !== INTERIOR_TILES.DOOR) {
                        this.tileRenderer.drawInteriorTile(tile, x, y);
                    }
                }
            }

            // 2. Entities whose "pivot" is in this row
            // pivot is approx visY + TILE_SIZE
            const rowBottomY = (y + 1) * TILE_SIZE;
            const rowTopY = y * TILE_SIZE;

            // NPCs
            // Draw NPCs for the current map
            const currentNpcs = (state.currentMap === 'overworld')
                ? state.npcs
                : (state.interiors[state.currentMap.replace('Interior', '')]?.npcs || []);

            if (currentNpcs) {
                currentNpcs.forEach(npc => {
                    const npcBottomY = (npc.y + 1) * TILE_SIZE;
                    if (npcBottomY > rowTopY && npcBottomY <= rowBottomY) {
                        this.tileRenderer.drawNPC(this.renderer.ctx, npc.x * TILE_SIZE, npc.y * TILE_SIZE, npc.id);
                    }
                });
            }

            // Pet
            if (this.pet && state.currentMap === 'overworld') {
                const petBottomY = this.pet.visY + TILE_SIZE;
                if (petBottomY > rowTopY && petBottomY <= rowBottomY) {
                    this.pet.draw(this.renderer.ctx, this.pet.visX + TILE_SIZE / 2, this.pet.visY + TILE_SIZE / 2);
                }
            }

            // Player
            const playerBottomY = this.player.visY + TILE_SIZE;
            if (playerBottomY > rowTopY && playerBottomY <= rowBottomY) {
                this.player.draw(this.renderer.ctx, this.player.visX + TILE_SIZE / 2, this.player.visY + TILE_SIZE / 2);
            }
        }

        // --- Post-Pass: Indicators & Effects ---
        if (state.destination) {
            this.renderer.drawDestination(state.destination);
        }

        // --- Pass 4: Global Illumination & Lighting ---
        if (darkness > 0) {
            const lights = [];

            // Player Light
            const screenPos = {
                x: (this.player.visX + TILE_SIZE / 2 - camera.x) * state.zoom,
                y: (this.player.visY + TILE_SIZE / 2 - camera.y) * state.zoom
            };
            lights.push({ x: screenPos.x, y: screenPos.y, radius: 150 * state.zoom });

            // Building Lights (Only if on screen)
            if (state.currentMap === 'overworld') {
                // Find visible buildings and add lights to windows
                for (let y = range.startY; y < range.endY; y++) {
                    for (let x = range.startX; x < range.endX; x++) {
                        if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) continue;
                        const tile = currentMap[y][x];

                        if (tile === TILES.HOUSE || tile === TILES.SHOP || tile === TILES.OLD_HOUSE) {
                            if (this.tileRenderer.isBottomLeftCorner(currentMap, x, y, tile)) {
                                const bx = (x * TILE_SIZE - camera.x) * state.zoom;
                                const by = (y * TILE_SIZE - camera.y) * state.zoom;

                                // Window positions relative to building bottom-left
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

            this.renderer.drawLightingOverlay(darkness, lights);
        }

        this.renderer.drawFacingIndicator(this.player.gridX, this.player.gridY, this.player.facing);
        this.particleSystem.drawParticles(this.renderer.ctx);

        if (this.timeSystem.weather === 'Rain' && state.currentMap === 'overworld') {
            this.particleSystem.drawRain(this.renderer.ctx, this.timeSystem.season === 3);
        }

        this.renderer.endWorldDraw();

        // Draw overlays
        if (this.timeSystem.weather === 'Rain' && state.currentMap === 'overworld') {
            this.renderer.drawRainOverlay();
        }

        // Legacy Night overlay removed in favor of Pass 4 Lighting
        this.renderer.drawMessages(state.messages);
    }

    /**
     * Get current map array based on state
     */
    getCurrentMap(state) {
        if (state.currentMap === 'overworld') {
            return state.map;
        } else {
            const interiorKey = state.currentMap.replace('Interior', '');
            const interior = state.interiors[interiorKey];
            return interior ? (interior.map || interior) : state.map;
        }
    }

    /**
     * Check if a tile is solid (blocks movement)
     */
    isTileSolid(state, x, y) {
        const currentMap = this.getCurrentMap(state);

        if (y < 0 || y >= currentMap.length || x < 0 || x >= currentMap[0].length) {
            return true;
        }

        const tile = currentMap[y][x];

        // Check for NPC collision on the current map
        let currentNpcs = [];
        if (state.currentMap === 'overworld') {
            currentNpcs = state.npcs || [];
        } else {
            const interiorKey = state.currentMap.replace('Interior', '');
            const interior = state.interiors[interiorKey];
            currentNpcs = interior?.npcs || [];
        }

        if (currentNpcs.some(npc => npc.x === x && npc.y === y)) {
            return true;
        }

        // Interior tiles
        if (state.currentMap !== 'overworld') {
            return isInteriorSolid(tile);
        }

        return isSolid(state.map, x, y, state.crops, SEEDS);
    }

    /**
     * Override draw to support interior maps
     */
    drawCurrentMap(state, range) {
        const currentMap = this.getCurrentMap(state);
        const mapHeight = currentMap.length;
        const mapWidth = currentMap[0]?.length || 0;

        for (let y = range.startY; y < range.endY; y++) {
            for (let x = range.startX; x < range.endX; x++) {
                if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) continue;

                const tile = currentMap[y][x];

                if (state.currentMap === 'overworld') {
                    this.tileRenderer.drawTile(tile, x, y, this.timeSystem.season, state.map);

                    const crop = state.crops[`${x},${y}`];
                    if (crop) {
                        this.tileRenderer.drawCrop(crop, x, y);
                    }
                } else {
                    this.tileRenderer.drawInteriorTile(tile, x, y);
                }
            }
        }
    }

    /**
     * Hit a resource tile (tree/stone) with Durability tracking
     */
    hitResource(x, y, resourceTypeKey) {
        const state = getState();
        const resourceType = RESOURCE_TYPES[resourceTypeKey];

        if (!resourceType) {
            console.warn('Unknown resource type:', resourceTypeKey);
            return;
        }

        // Check if resource has toughness or hp defined (handle legacy/reload states)
        const toughness = resourceType.toughness !== undefined ? resourceType.toughness : (resourceType.hp || 1);

        // Check energy
        if (!this.timeSystem.consumeEnergy(resourceType.energyCost)) {
            this.showToast('Too Exhausted!', '#ef5350');
            return;
        }

        const key = `${x},${y}`;

        // Get or initialize Durability for this tile
        // We use 'resourceHP' in state for backward compatibility but conceptually it's durability
        let currentDurability = state.resourceHP[key];
        if (currentDurability === undefined) {
            currentDurability = toughness;
        }

        // Hit the resource
        currentDurability -= 1;

        // Particle effect on hit
        this.particleSystem.createBurst(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            resourceType.color
        );

        if (currentDurability <= 0) {
            // Resource destroyed - give items
            for (const [item, count] of Object.entries(resourceType.yield)) {
                this.inventory.addItem(item, count);
            }

            // Build toast message
            const drops = Object.entries(resourceType.yield)
                .map(([item, count]) => `+${count} ${item.charAt(0).toUpperCase() + item.slice(1)}`)
                .join(', ');
            this.showToast(drops, '#81c784');

            // Clear the tile
            setTile(state.map, x, y, TILES.GRASS);

            // Remove durability tracking
            delete state.resourceHP[key];
            setState({ resourceHP: { ...state.resourceHP } });
        } else {
            // Resource damaged but not destroyed
            this.showToast('Cracked!', '#ffa726'); // Visual/Text feedback without "HP"

            // Save Durability state
            state.resourceHP[key] = currentDurability;
            setState({ resourceHP: { ...state.resourceHP } });
        }

        this.syncInventory();
        saveGame();
    }


    /**
     * Interact with NPC
     */
    interactWithNPC(npc) {
        const state = getState();

        if (npc.id === NPC_IDS.OLD_MAN) {
            if (!state.player.questFlags || !state.player.questFlags.hasSword) {
                this.uiManager.showDialogue(
                    "It's dangerous to go alone! Take this.",
                    () => {
                        this.inventory.addItem('WOODEN_SWORD', 1);
                        if (!this.player.questFlags) this.player.questFlags = {};
                        this.player.questFlags.hasSword = true;
                        this.showToast("Got Wooden Sword!", '#ffd700');
                        setState({ player: this.player.serialize() });
                        this.syncInventory();
                        saveGame();
                    }
                );
            } else {
                this.uiManager.showDialogue("Be careful out there, young farmer.");
            }
        }
    }
}

export default Game;
