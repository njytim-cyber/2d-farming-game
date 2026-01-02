/**
 * Main Game Controller
 * Orchestrates all game systems and the main loop
 */

import {
    TILE_SIZE,
    MAP_WIDTH,
    MAP_HEIGHT,
    SEEDS,
    TILES,
    ITEMS
} from './constants';
import { getState, setState, GameState } from './state';
import { generateMap, generateNorthMap, isSolid, setTile } from '../systems/MapGenerator';
import { isInteriorSolid } from '../systems/InteriorMaps';
import { saveGame, loadGame, hasSave, startAutoSave, onSave, resetGame } from '../systems/SaveManager';
import { Inventory } from '../systems/Inventory';
import { TimeSystem } from '../systems/TimeSystem';
import { Pet } from '../entities/Pet';
import { PetNameModal } from '../ui/PetNameModal';
import { ParticleSystem } from '../systems/ParticleSystem';
import { InteractionSystem } from '../systems/InteractionSystem';
import { NavigationSystem } from '../systems/NavigationSystem';
import { RenderingOrchestrator } from '../rendering/RenderingOrchestrator';
import { Player } from '../entities/Player';
import Renderer from '../rendering/Renderer';
import TileRenderer from '../rendering/TileRenderer';
import { InputManager } from '../input/InputManager';
import { UIManager } from '../ui/UIManager';
import { CreatorModal } from '../ui/CreatorModal';
import { ShopModal } from '../ui/ShopModal';
import CookingModal from '../ui/CookingModal';
import { BuildModal } from '../ui/BuildModal';
import { CONSUMABLES } from '../systems/Recipes';
import { ANIMAL_TYPES, Animal } from '../entities/Animals';
import { BUILDING_TYPES } from '../systems/Buildings';

export class Game {
    canvas: HTMLCanvasElement | null;
    renderer: Renderer;
    tileRenderer: TileRenderer;
    inputManager: InputManager;
    uiManager: UIManager;
    particleSystem: ParticleSystem;
    interactionSystem: InteractionSystem; // New System
    navigationSystem: NavigationSystem;
    renderingOrchestrator: RenderingOrchestrator;

    player: Player | null;
    inventory: Inventory | null;
    timeSystem: TimeSystem | null;
    pet: Pet | null;
    creatorModal: CreatorModal | null;
    shopModal: ShopModal | null;
    cookingModal: CookingModal | null;
    buildModal: BuildModal | null;

    isRunning: boolean;
    bufferedMove: { dx: number; dy: number } | null;
    attackCooldown: number;
    petIntroTriggered: boolean;
    introActive: boolean;
    creeps: any[]; // Active dungeon creeps

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.renderer = new Renderer(this.canvas);
        this.tileRenderer = new TileRenderer(this.renderer.ctx);
        this.inputManager = new InputManager();
        this.uiManager = new UIManager();
        this.particleSystem = new ParticleSystem();
        this.interactionSystem = new InteractionSystem(this);
        this.navigationSystem = new NavigationSystem(this);
        this.renderingOrchestrator = new RenderingOrchestrator(this);

        this.player = null;
        this.inventory = null;
        this.timeSystem = null;
        this.pet = null;
        this.creatorModal = null;
        this.shopModal = null;
        this.cookingModal = null;
        this.buildModal = null;

        this.isRunning = false;
        this.bufferedMove = null;
        this.attackCooldown = 0;
        this.petIntroTriggered = false;
        this.introActive = false;
        this.creeps = [];
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
            onBuy: (seedType: string) => this.buyItem(seedType),
            onSell: (slotIndex: number, value: number) => this.sellItem(slotIndex, value),
            onClose: () => this.closeShop(),
            onReset: () => this.resetGameData()
        });

        // Setup house modal buttons
        this.setupHouseModal();

        // Setup cooking modal
        this.cookingModal = new CookingModal(this.uiManager, {
            onCook: (recipeKey: string) => {
                this.showToast(`Cooked ${recipeKey.replace(/_/g, ' ')}!`, '#81c784');
                this.syncInventory();
                saveGame();
            },
            onConsume: (slotIdx: number) => this.consumeFoodItem(slotIdx),
            onClose: () => setState({ screen: 'GAME' })
        });

        // Setup build modal
        if (this.canvas) {
            this.buildModal = new BuildModal(this.uiManager, {
                onClose: () => setState({ screen: 'GAME' }),
                showToast: (msg, color) => this.showToast(msg, color)
            }, this.canvas);
        }

        // Initialize with state
        const state = getState();
        if (state.player) this.player = new Player(state.player);
        if (state.inventory) this.inventory = new Inventory(state.inventory.slots, state.inventory.selected);
        this.timeSystem = new TimeSystem(state); // TimeSystem handles state internally if passed, or default

        // Setup UI callbacks
        this.uiManager.onSlotSelect((idx) => this.interactWithSelected(idx));
        this.uiManager.onEquip((idx) => this.equipItem(idx));

        // Show creator/continue screen
        if (this.creatorModal && this.player) this.creatorModal.show(this.player, hasSave());

        // Start game loop
        this.isRunning = true;
        this.loop(0);
    }

    /**
     * Setup house modal buttons
     */
    setupHouseModal() {
        const sleepBtn = document.querySelector('#house-modal .btn--start') as HTMLElement;
        const leaveBtn = document.querySelector('#house-modal .btn--secondary') as HTMLElement;

        if (sleepBtn) {
            sleepBtn.onclick = () => this.sleep();
        }
        if (leaveBtn) {
            leaveBtn.onclick = () => this.closeHouseModal();
        }

        // Attack button
        const attackBtn = document.getElementById('btn-attack');
        if (attackBtn) {
            attackBtn.onclick = () => this.performAttack();
        }
    }

    /**
     * Perform attack with equipped weapon
     */
    performAttack() {
        if (!this.player || !this.player.equipment) {
            this.showToast('No weapon equipped!', '#ff5252');
            return;
        }

        const weapon = this.player.equipment.weapon;
        if (!weapon) {
            this.showToast('Equip a weapon first!', '#ff5252');
            return;
        }

        const state = getState();
        const damage = this.player.getAttack();
        const attackRange = TILE_SIZE * 1.5; // Attack range in pixels

        // Show attack animation/effect
        this.showToast(`⚔️ Attacked for ${damage} damage!`, '#ffd700');

        // In dungeons, damage nearby creeps
        if (state.currentMap.startsWith('dungeon_')) {
            let hitCount = 0;
            this.creeps.forEach((creep: any) => {
                if (!this.player) return;
                const dist = Math.hypot(creep.visX - this.player.visX, creep.visY - this.player.visY);
                if (dist <= attackRange && creep.hp > 0) {
                    creep.hp -= damage;
                    hitCount++;
                    if (creep.hp <= 0) {
                        this.showToast(`💀 Killed ${creep.name}!`, '#81c784');
                    }
                }
            });

            // Remove dead creeps
            this.creeps = this.creeps.filter((c: any) => c.hp > 0);

            if (hitCount > 0) {
                this.showToast(`Hit ${hitCount} enem${hitCount > 1 ? 'ies' : 'y'}!`, '#ffd700');
            }
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

            // Migration: Give starter tools if missing
            if (!this.inventory.hasItem('PICKAXE')) {
                this.inventory.addItem('PICKAXE', 1);
                this.showToast('Received Starter Pickaxe!', '#29b6f6');
            }
            if (!this.inventory.hasItem('AXE')) {
                this.inventory.addItem('AXE', 1);
                this.showToast('Received Starter Axe!', '#29b6f6');
            }

            // Re-create pet if exists in save
            if (state.pet) {
                this.pet = new Pet(state.pet.gridX, state.pet.gridY);
                this.pet.name = state.pet.name;
                this.pet.color = state.pet.color;
                this.pet.state = state.pet.state || 'IDLE';
            } else if (this.player) {
                this.pet = new Pet(this.player.gridX + 1, this.player.gridY); // Default companion
            }

            if (this.player) this.uiManager.setupEquipment(this.player);

            // Validate player position
            if (this.player) {
                if (this.player.gridX >= MAP_WIDTH || this.player.gridY >= MAP_HEIGHT ||
                    isSolid(state.map, this.player.gridX, this.player.gridY, state.crops, SEEDS)) {
                    this.player.gridX = Math.floor(MAP_WIDTH / 2);
                    this.player.gridY = Math.floor(MAP_HEIGHT / 2);
                    this.player.visX = this.player.gridX * TILE_SIZE;
                    this.player.visY = this.player.gridY * TILE_SIZE;
                }
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
        const { map: homeMap, npcs: homeNpcs } = generateMap();
        const { map: northMap, npcs: northNpcs } = generateNorthMap();

        if (this.player) {
            this.player.gridX = 20;
            this.player.gridY = 20;
            this.player.visX = this.player.gridX * TILE_SIZE;
            this.player.visY = this.player.gridY * TILE_SIZE;
            this.player.facing = { x: 0, y: 1 };
        }

        if (this.player) this.uiManager.setupEquipment(this.player);

        this.inventory = new Inventory();
        this.inventory.addItem('turnip_seed', 5);

        this.timeSystem = new TimeSystem();

        // Spawn Pet for intro
        this.pet = new Pet(22, 20);
        this.petIntroTriggered = false;

        // Trigger pet intro after a short delay
        setTimeout(() => {
            if (!this.petIntroTriggered) this.triggerPetIntro();
        }, 1000);

        if (this.timeSystem && this.player && this.inventory) {
            setState({
                screen: 'GAME',
                currentMap: 'overworld',
                map: homeMap,
                npcs: homeNpcs || [],
                interiors: {
                    'overworld_north': { map: northMap, npcs: northNpcs || [] }
                },
                player: this.player.serialize(),
                inventory: this.inventory.serialize(),
                crops: {},
                money: 100,
                zoom: 1.0,
                ...this.timeSystem.serialize()
            });
        }

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
        if (!this.player) return;

        this.inputManager.enable();

        this.inputManager.onMove((dx, dy) => {
            this.navigationSystem.attemptMove(dx, dy);
        });

        this.inputManager.onAction(() => {
            this.interact();
        });

        this.inputManager.onClick((tileX, tileY) => {
            if (!this.player) return;
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

        // Profile Toggle
        this.inputManager.onProfile(() => {
            if (this.uiManager.equipmentModal) this.uiManager.equipmentModal.toggle();
        });

        // Item Move (Drag & Drop)
        this.uiManager.onItemMove((from, to) => {
            this.handleItemMove(from, to);
        });

        // Setup canvas input
        if (this.canvas) {
            this.inputManager.setupCanvasInput(this.canvas, (screenX, screenY) => {
                const state = getState();
                return this.renderer.screenToTile(screenX, screenY, state.camera, state.zoom);
            });
        }

        // Setup FAB
        const fabBtn = document.getElementById('fab-action');
        if (fabBtn) {
            this.inputManager.setupActionButton(fabBtn);
        }

        // Setup zoom buttons
        const zoomBtns = document.querySelectorAll('.zoom-btn');
        if (zoomBtns.length >= 2) {
            this.inputManager.setupZoomButtons(zoomBtns[0] as HTMLElement, zoomBtns[1] as HTMLElement);
        }

        // B key to open build menu
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'b' && getState().screen === 'GAME' && getState().currentMap === 'overworld') {
                if (this.buildModal && this.inventory) {
                    this.buildModal.show(this.inventory);
                }
            }
        });

        // BUILD button click handler
        const buildBtn = document.getElementById('fab-build');
        if (buildBtn) {
            buildBtn.onclick = () => {
                const state = getState();
                if (state.screen === 'GAME' && state.currentMap === 'overworld') {
                    if (this.buildModal && this.inventory) {
                        this.buildModal.show(this.inventory);
                    }
                } else {
                    this.showToast('Can only build in overworld!', '#ffa726');
                }
            };
        }
    }


    /**
     * Main game loop
     */
    loop(lastTime: number) {
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
    update(dt: number) {
        if (!this.player || !this.timeSystem) return;
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
        this.navigationSystem.update();

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
                        if (this.pet) this.pet.name = name;
                        this.showToast(`Adopted ${name}!`, '#ffb74d');
                        saveGame();
                    });
                    modal.show();
                }
            }
        }

        // Update Creeps in dungeons
        if (this.player && state.currentMap.startsWith('dungeon_') && this.creeps.length > 0) {
            const currentMap = this.getCurrentMap(state);
            const player = this.player; // Capture for closure
            this.creeps.forEach((creep: any) => {
                creep.update(dt, { gridX: player.gridX, gridY: player.gridY }, currentMap);

                // Check collision with player (deal damage)
                const dist = Math.hypot(creep.visX - player.visX, creep.visY - player.visY);
                if (dist < TILE_SIZE * 0.8) {
                    // Player takes damage from creep
                    if (this.attackCooldown <= 0 && creep.hp > 0) {
                        player.hp -= creep.attack;
                        this.attackCooldown = 1.0; // 1 second invincibility
                        this.showToast(`-${creep.attack} HP from ${creep.name}!`, '#ff5252');

                        if (player.hp <= 0) {
                            player.hp = player.maxHp;
                            this.transitionToMap('overworld', 20, 20);
                            this.creeps = [];
                            this.showToast('You were defeated! Returned home.', '#ff5252');
                        }
                    }
                }
            });

            // Remove dead creeps
            this.creeps = this.creeps.filter((c: any) => c.hp > 0);
        }

        // Reduce attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }
    }


    interactWithSelected(idx: number) {
        // Handle slot selection (just highlight/equip logic separation)
        if (this.inventory) {
            this.inventory.selected = idx;
            this.syncInventory();
            this.updateUI();
        }
    }

    /**
     * Interact with facing tile
     */
    interact() {
        const state = getState();
        if (state.screen !== 'GAME' || !this.player || !this.inventory || !this.timeSystem) return;

        const { gridX, gridY, facing } = this.player;
        const tx = gridX + facing.x;
        const ty = gridY + facing.y;

        // Delegate to InteractionSystem
        this.interactionSystem.handleInteraction(tx, ty);
    }


    /**
     * Enter house - switch to interior map
     */

    /**
     * Sleep and start new day
     */
    sleep() {
        if (!this.timeSystem) return;
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
    handleSeasonChange(state: GameState) {
        if (!this.timeSystem) return;
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
    buyItem(id: string) {
        if (!this.inventory) return;
        const state = getState();

        // Check if it's a seed
        if (SEEDS[id]) {
            const cost = SEEDS[id].cost;
            if (state.money >= cost) {
                if (this.inventory.addItem(id + '_seed', 1)) {
                    setState({ money: state.money - cost });
                    this.syncInventory();
                    saveGame();
                }
            } else {
                this.showToast('Need Cash!', '#ef5350');
            }
            return;
        }

        // Check if it's an animal
        if (ANIMAL_TYPES[id]) {
            const def = ANIMAL_TYPES[id];
            const cost = def.cost;

            if (state.money < cost) {
                this.showToast('Need Cash!', '#ef5350');
                return;
            }

            // Find building for animal
            const building = state.buildings.find((b: any) => {
                const bDef = BUILDING_TYPES[b.type];
                return bDef && bDef.animalTypes?.includes(def.name.toLowerCase()) && b.animals.length < bDef.capacity;
            });

            if (!building) {
                const required = def.name === 'Chicken' ? 'Coop' : (def.name === 'Cow' ? 'Barn' : 'Building');
                this.showToast(`Need an available ${required}!`, '#ef5350');
                return;
            }

            // Buy and assign
            const animal = new Animal(id, building.x, building.y, building.id);
            building.animals.push(animal.id);
            const newAnimals = [...state.animals, animal];

            setState({
                money: state.money - cost,
                animals: newAnimals
            });

            this.showToast(`Bought ${def.name}!`, '#4caf50');
            saveGame();
            return;
        }
    }

    /**
     * Sell item
     */
    sellItem(slotIndex: number, value: number) {
        if (!this.inventory) return;
        const state = getState();
        this.inventory.removeFromSlot(slotIndex, 1);
        setState({ money: state.money + value });
        this.syncInventory();
        saveGame();
    }

    /**
     * Equip item from inventory
     */
    equipItem(slotIndex: number) {
        if (!this.inventory || !this.player) return;
        const item = this.inventory.slots[slotIndex];
        if (!item) return;

        // Check if item is equipment
        // Check ITEMS (likely upper case keys) or SEEDS
        const data = ITEMS[item.name.toUpperCase()] || SEEDS[item.name];

        if (data && (data as any).type === 'weapon') {
            // Equip weapon
            const oldWeapon = this.player.equipment.weapon;

            // Remove from inventory
            this.inventory.removeFromSlot(slotIndex, 1);

            // Equip new
            this.player.equipment.weapon = {
                name: item.name,
                type: 'weapon', // data.type should be 'weapon'
                attack: (data as any).attack || 0
            };

            // Return old weapon to inventory if any
            if (oldWeapon) {
                this.inventory.addItem(oldWeapon.name, 1);
            }

            // Show message
            this.showToast(`Equipped ${data.name}!`, '#4caf50');

            // Update UI
            if (this.uiManager) {
                if (this.uiManager.equipmentModal) {
                    this.uiManager.equipmentModal.render(); // Refresh modal if open
                }
                // Refresh inventory
                this.syncInventory();
            }
        } else {
            // Can't equip this message?
            // or just ignore
            // console.log("Cannot equip", item.name);
        }
    }

    /**
     * Attack with equipped weapon
     */
    attack() {
        if (!this.player || !this.player.equipment.weapon) return;
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
        if (!this.shopModal) return;
        setState({ screen: 'GAME' });
        this.shopModal.hide();
    }

    /**
     * Consume a food item from inventory
     */
    consumeFoodItem(slotIdx: number) {
        if (!this.inventory || !this.timeSystem || !this.player) return;
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
    /**
     * Handle item movement between slots (Drag & Drop)
     */
    handleItemMove(from: any, to: any) {
        if (!this.inventory || !this.player) return;

        let item: any = null;

        // 1. Get the source item
        if (from.type === 'inventory') {
            item = this.inventory.slots[from.index];
        } else if (from.type === 'equipment') {
            item = (this.player.equipment as any)[from.index];
        }

        if (!item) return;

        // 2. Determine action based on destination
        if (to.type === 'inventory') {
            const destIndex = to.index;
            const destItem = this.inventory.slots[destIndex];

            if (from.type === 'inventory') {
                // Swap in inventory
                this.inventory.slots[from.index] = destItem;
                this.inventory.slots[destIndex] = item;
            } else if (from.type === 'equipment') {
                // Unequip to specific inventory slot
                if (!destItem) {
                    this.inventory.slots[destIndex] = item;
                    (this.player.equipment as any)[from.index] = null;
                } else {
                    // Spot occupied, fallback to standard add
                    (this.player.equipment as any)[from.index] = null;
                    this.inventory.addItem(item.name, item.count || 1);
                }
            }
        } else if (to.type === 'equipment') {
            const destSlot = to.index;
            // Check if item fits in this slot
            if (this.canEquipInSlot(item, destSlot)) {
                if (from.type === 'inventory') {
                    // Equip from inventory
                    const prevEquip = (this.player.equipment as any)[destSlot];
                    (this.player.equipment as any)[destSlot] = item;
                    this.inventory.slots[from.index] = prevEquip || null;
                } else if (from.type === 'equipment') {
                    // Swap equipment slots (if allowed)
                    const prevEquip = (this.player.equipment as any)[destSlot];
                    (this.player.equipment as any)[destSlot] = item;
                    (this.player.equipment as any)[from.index] = prevEquip || null;
                }
            } else {
                this.showToast(`Cannot equip ${item.name} in that slot!`, '#ef5350');
            }
        }

        // Sync and save
        this.syncInventory();
        setState({ player: this.player.serialize() });
        if (this.uiManager.equipmentModal) this.uiManager.equipmentModal.render();
        saveGame();
    }

    /**
     * Check if an item can be equipped in a specific slot
     */
    canEquipInSlot(item: any, slot: string): boolean {
        if (!item) return false;
        const type = item.type;

        if (slot === 'weapon') return type === 'weapon' || type === 'tool';
        if (slot === 'body') return type === 'armor' || type === 'outfit' || type === 'clothing';
        if (slot === 'head') return type === 'hat' || type === 'helmet';
        if (slot === 'offhand') return type === 'shield' || type === 'tool' || type === 'produce';
        if (slot === 'legs') return type === 'pants' || type === 'shoes';

        return false;
    }

    syncInventory() {
        if (this.inventory) {
            setState({ inventory: this.inventory.serialize() });
        }
    }

    /**
     * Transition between overworld maps
     */
    transitionToMap(mapName: string, newX: number, newY: number) {
        if (!this.player) return;

        setState({ currentMap: mapName });
        this.player.gridX = newX;
        this.player.gridY = newY;
        this.player.visX = newX * TILE_SIZE;
        this.player.visY = newY * TILE_SIZE;
        this.player.isMoving = false;

        // Load creeps when entering a dungeon
        if (mapName.startsWith('dungeon_')) {
            const state = getState();
            const dungeonData = state.interiors[mapName];
            if (dungeonData && dungeonData.npcs) {
                // Instantiate Creep objects from saved data
                this.creeps = dungeonData.npcs
                    .filter((npc: any) => npc.type === 'creep' || npc.id?.startsWith('creep_'))
                    .map((npcData: any) => ({
                        ...npcData,
                        visX: npcData.x * TILE_SIZE,
                        visY: npcData.y * TILE_SIZE,
                        gridX: npcData.x,
                        gridY: npcData.y,
                        moveTimer: 0,
                        moveInterval: 2.0 / (npcData.speed || 1.0),
                        update: function (dt: number, playerPos: { gridX: number, gridY: number }, map: number[][]) {
                            this.moveTimer += dt;
                            // Smooth visual position
                            const targetX = this.gridX * TILE_SIZE;
                            const targetY = this.gridY * TILE_SIZE;
                            this.visX += (targetX - this.visX) * 2.0 * dt;
                            this.visY += (targetY - this.visY) * 2.0 * dt;

                            if (this.moveTimer >= this.moveInterval) {
                                this.moveTimer = 0;
                                // Simple AI: move towards player if close
                                const dx = Math.sign(playerPos.gridX - this.gridX);
                                const dy = Math.sign(playerPos.gridY - this.gridY);
                                const dist = Math.abs(playerPos.gridX - this.gridX) + Math.abs(playerPos.gridY - this.gridY);

                                let moveX = 0, moveY = 0;
                                if (dist < 10 && Math.random() < 0.7) {
                                    if (Math.abs(dx) > Math.abs(dy)) moveX = dx;
                                    else moveY = dy;
                                } else {
                                    const rand = Math.random();
                                    if (rand < 0.25) moveX = 1;
                                    else if (rand < 0.5) moveX = -1;
                                    else if (rand < 0.75) moveY = 1;
                                    else moveY = -1;
                                }

                                const nextX = this.gridX + moveX;
                                const nextY = this.gridY + moveY;
                                if (nextX >= 0 && nextX < 40 && nextY >= 0 && nextY < 40) {
                                    const tile = map[nextY]?.[nextX];
                                    if (tile !== 21) { // DUNGEON_WALL = 21
                                        this.gridX = nextX;
                                        this.gridY = nextY;
                                    }
                                }
                            }
                        }
                    }));
                this.showToast(`Floor ${mapName.replace('dungeon_', '')} - ${this.creeps.length} enemies`, '#9e9e9e');
            } else {
                this.creeps = [];
            }
        } else {
            // Clear creeps when leaving dungeon
            this.creeps = [];
        }

        this.showToast(`Entered ${mapName.replace('overworld_', '') || 'the valley'}`);
        saveGame();
    }

    /**
     * Show toast message
     */
    showToast(text: string, color: string = 'white') {
        const state = getState();
        state.messages.push({ text, color, life: 60 });
    }

    /**
     * Update UI
     */
    updateUI() {
        if (!this.inventory || !this.timeSystem || !this.player) return;
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
        this.renderingOrchestrator.draw();
    }

    /**
     * Get current map array based on state
     */
    getCurrentMap(state: GameState): number[][] {
        if (state.currentMap === 'overworld') {
            return state.map;
        } else {
            const interior = state.interiors[state.currentMap];
            if (interior) return interior.map || interior;

            // Fallback for legacy interior naming
            const interiorKey = state.currentMap.replace('Interior', '');
            const legacy = state.interiors[interiorKey];
            return legacy ? (legacy.map || legacy) : state.map;
        }
    }

    /**
     * Check if a tile is solid (blocks movement)
     */
    isTileSolid(state: GameState, x: number, y: number): boolean {
        const currentMap = this.getCurrentMap(state);

        if (y < 0 || y >= currentMap.length || x < 0 || x >= currentMap[0].length) {
            return true;
        }

        const tile = currentMap[y][x];

        // Check for NPC collision on the current map
        let currentNpcs: any[] = [];
        if (state.currentMap === 'overworld') {
            currentNpcs = state.npcs || [];
        } else {
            const interior = state.interiors[state.currentMap];
            currentNpcs = interior?.npcs || [];

            if (!interior) {
                const interiorKey = state.currentMap.replace('Interior', '');
                currentNpcs = state.interiors[interiorKey]?.npcs || [];
            }
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
     * Hit a resource tile (tree/stone) with Durability tracking
     */

}

export default Game;
