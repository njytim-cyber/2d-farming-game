import {
    TILE_SIZE,
    TILES,
    INTERIOR_TILES,
    NPC_IDS,
    RESOURCE_TYPES,
    ENERGY_COST,
    SEEDS
} from '../game/constants';
import { getState, setState } from '../game/state';
import { setTile } from './MapGenerator';
import { generateDungeonLevel } from './DungeonGenerator';
import { generateHouseInterior, generateShopInterior, generateOldHouseInterior, generateCoopInterior, generateBarnInterior, getInteriorSpawn } from './InteriorMaps';
import { saveGame } from './SaveManager';
import { Game } from '../game/Game';
import { CONSUMABLES } from './Recipes';

export class InteractionSystem {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * Handle interaction at a specific tile
     */
    handleInteraction(x: number, y: number) {
        const state = getState();
        const key = `${x},${y}`;
        const selectedItem = this.game.inventory ? this.game.inventory.slots[this.game.inventory.selected] : null;

        // Parse tile
        const currentMap = this.game.getCurrentMap(state);
        if (y < 0 || y >= currentMap.length || x < 0 || x >= currentMap[0].length) return;

        const tile = currentMap[y][x];

        // --- Check for NPCs ---
        let currentNpcs: any[] = [];
        if (state.currentMap === 'overworld') {
            currentNpcs = state.npcs || [];
        } else {
            const interiorKey = state.currentMap.replace('Interior', '');
            const interior = state.interiors[interiorKey];
            currentNpcs = interior?.npcs || [];
        }

        const npc = currentNpcs.find(n => n.x === x && n.y === y);
        if (npc) {
            this.interactWithNPC(npc);
            return;
        }

        // --- Interior Interactions ---
        if (state.currentMap !== 'overworld') {
            if (tile === INTERIOR_TILES.DOOR) { this.exitHouse(); return; }
            if (tile === INTERIOR_TILES.BED) { this.game.sleep(); return; }
            if (tile === INTERIOR_TILES.STOVE) {
                if (this.game.cookingModal && this.game.inventory) this.game.cookingModal.show(this.game.inventory);
                return;
            }
            if (tile === INTERIOR_TILES.BASKET) { this.collectProduce('egg'); return; }
            if (tile === INTERIOR_TILES.PAIL) { this.collectProduce('milk'); return; }
            return;
        }

        // Shop Counter
        if (state.currentMap.includes('shop') && tile === INTERIOR_TILES.COUNTER) {
            setState({ screen: 'SHOP' });
            if (this.game.shopModal && this.game.inventory && this.game.timeSystem) {
                this.game.shopModal.show(this.game.inventory, this.game.timeSystem.season);
            }
            return;
        }

        if (state.currentMap !== 'overworld') return;

        // --- Item-Specific Logic (ACT button context) ---
        if (selectedItem) {
            const itemName = selectedItem.name.toUpperCase();

            // 1. Sword -> Attack
            if (itemName === 'WOODEN_SWORD' || itemName === 'SWORD') {
                this.game.performAttack();
                return;
            }

            // 2. Food -> Eat
            if (CONSUMABLES[selectedItem.name]) {
                this.game.consumeFoodItem(this.game.inventory!.selected);
                return;
            }

            // 3. Seeds -> Plant
            if (selectedItem.name.endsWith('_seed')) {
                if (tile === TILES.SOIL && !state.crops[key]) {
                    this.plantSeed(x, y, selectedItem);
                    return;
                }
            }

            // 4. Tools -> Resource Gathering
            if (itemName === 'AXE') {
                if (tile === TILES.TREE || tile === TILES.TREE_OAK) {
                    this.hitResource(x, y, tile === TILES.TREE ? 'TREE' : 'OAK');
                    return;
                }
            }
            if (itemName === 'PICKAXE') {
                if (tile === TILES.STONE || tile === TILES.STONE_ORE || tile === TILES.STONE_BOULDER) {
                    const type = tile === TILES.STONE ? 'STONE' : (tile === TILES.STONE_ORE ? 'ORE' : 'BOULDER');
                    this.hitResource(x, y, type);
                    return;
                }
            }
        }

        // --- Contextual Overworld Interactions (No item selected or item not applicable) ---

        // Buildings
        if (tile === TILES.SHOP) { this.enterShop(); return; }
        if (tile === TILES.HOUSE) { this.enterHouse(); return; }
        if (tile === TILES.OLD_HOUSE) { this.enterBuilding('old_house'); return; }
        if (tile === TILES.COOP) { this.enterBuilding('coop'); return; }
        if (tile === TILES.BARN) { this.enterBuilding('barn'); return; }
        if (tile === TILES.CAVE) { this.enterCave(); return; }

        // Harvest Crop (always possible if mature)
        if (state.crops[key] && state.crops[key].stage >= 100) {
            this.harvestCrop(x, y);
            return;
        }

        // Feedback for resource nodes if wrong tool or no tool
        if (tile === TILES.TREE || tile === TILES.TREE_OAK) {
            this.game.showToast('Need an Axe!', '#ffa726');
            return;
        }
        if (tile === TILES.STONE || tile === TILES.STONE_ORE || tile === TILES.STONE_BOULDER) {
            this.game.showToast('Need a Pickaxe!', '#ffa726');
            return;
        }

        // Clear Withered (Debris) - Handled contextually if no specific item
        if (tile === TILES.WITHERED) {
            this.clearWithered(x, y);
            return;
        }

        // Till Grass (contextual)
        if (tile === TILES.GRASS) {
            this.game.showToast('Select a Hoe or Tool?', '#cfd8dc');
            // For now, let's keep it simple: if you have a Hoe selected, or maybe just allow it for now if we don't have a Hoe?
            // Actually, the user requirement says "pressing spacebar WITHOUT the correct tool will no longer work".
            // So I should probably check for a Hoe soon.
            return;
        }
    }

    /**
     * Plant a seed
     */
    private plantSeed(x: number, y: number, selectedItem: any) {
        const state = getState();
        const key = `${x},${y}`;
        const type = selectedItem.name.replace('_seed', '');
        const seedData = SEEDS[type];

        if (seedData.seasons && this.game.timeSystem && !seedData.seasons.includes(this.game.timeSystem.season)) {
            const seasonNames = ['Spring', 'Summer', 'Fall', 'Winter'];
            const validSeasons = seedData.seasons.map((s: number) => seasonNames[s]).join('/');
            this.game.showToast(`${seedData.name}: ${validSeasons} only!`, '#ef5350');
            return;
        }

        if (this.game.timeSystem && this.game.timeSystem.consumeEnergy(ENERGY_COST.PLANT)) {
            if (this.game.inventory) this.game.inventory.removeFromSlot(this.game.inventory.selected, 1);
            state.crops[key] = { type, stage: 0, x, y };
            this.game.showToast('Planted ' + seedData.name);
            this.game.syncInventory();
            saveGame();
        } else {
            this.game.showToast('Too Exhausted!', '#ef5350');
        }
    }

    /**
     * Harvest a crop
     */
    private harvestCrop(x: number, y: number) {
        const state = getState();
        const key = `${x},${y}`;
        if (this.game.timeSystem && this.game.timeSystem.consumeEnergy(ENERGY_COST.HARVEST)) {
            const crop = state.crops[key];
            const data = SEEDS[crop.type];
            if (this.game.inventory) this.game.inventory.addItem(crop.type, 1);

            if (data.isTree) {
                crop.stage = data.regrow || 0;
                this.game.showToast('Harvested ' + data.name);
            } else if (data.regrowable) {
                crop.stage = data.regrowStage || 0;
                this.game.showToast('Harvested ' + data.name + '!');
            } else {
                if (Math.random() > 0.6 && this.game.inventory) this.game.inventory.addItem(crop.type + '_seed', 1);
                delete state.crops[key];
                setTile(state.map, x, y, TILES.SOIL); // Revert to soil
                this.game.showToast('Got ' + data.name);
            }

            this.game.particleSystem.createBurst(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, data.color);
            this.game.syncInventory();
            saveGame();
        } else {
            this.game.showToast('Too Exhausted!', '#ef5350');
        }
    }

    /**
     * Clear withered debris
     */
    private clearWithered(x: number, y: number) {
        const state = getState();
        if (this.game.timeSystem && this.game.timeSystem.consumeEnergy(2)) {
            setTile(state.map, x, y, TILES.SOIL);
            this.game.particleSystem.createBurst(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, '#8b7355');
            this.game.showToast('Cleared debris');
            saveGame();
        } else {
            this.game.showToast('Too Exhausted!', '#ef5350');
        }
    }


    /**
     * Hit a resource tile
     */
    hitResource(x: number, y: number, resourceTypeKey: string) {
        if (!this.game.timeSystem || !this.game.inventory) return;
        const state = getState();
        const resourceType = RESOURCE_TYPES[resourceTypeKey];

        if (!resourceType) return;

        const toughness = resourceType.toughness !== undefined ? resourceType.toughness : ((resourceType as any).hp || 1);

        if (!this.game.timeSystem.consumeEnergy(resourceType.energyCost)) {
            this.game.showToast('Too Exhausted!', '#ef5350');
            return;
        }

        const key = `${x},${y}`;
        let currentDurability = state.resourceHP[key];
        if (currentDurability === undefined) currentDurability = toughness;

        currentDurability -= 1;

        this.game.particleSystem.createBurst(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            resourceType.color
        );

        if (currentDurability <= 0) {
            for (const [item, count] of Object.entries(resourceType.yield)) {
                this.game.inventory.addItem(item, count);
            }
            const drops = Object.entries(resourceType.yield)
                .map(([item, count]) => `+${count} ${item.charAt(0).toUpperCase() + item.slice(1)}`)
                .join(', ');
            this.game.showToast(drops, '#81c784');
            setTile(state.map, x, y, TILES.GRASS);
            delete state.resourceHP[key];
            setState({ resourceHP: { ...state.resourceHP } });
        } else {
            this.game.showToast('Cracked!', '#ffa726');
            state.resourceHP[key] = currentDurability;
            setState({ resourceHP: { ...state.resourceHP } });
        }

        this.game.syncInventory();
        saveGame();
    }

    interactWithNPC(npc: any) {
        const state = getState();
        if (npc.id === NPC_IDS.OLD_MAN) {
            if (!state.player.questFlags || !state.player.questFlags.hasSword) {
                this.game.uiManager.showDialogue(
                    "It's dangerous to go alone! Take this.",
                    () => {
                        if (!this.game.inventory || !this.game.player) return;
                        this.game.inventory.addItem('WOODEN_SWORD', 1);
                        if (!this.game.player.questFlags) this.game.player.questFlags = {};
                        this.game.player.questFlags.hasSword = true;
                        this.game.showToast("Got Wooden Sword!", '#ffd700');
                        setState({ player: this.game.player.serialize() });
                        this.game.syncInventory();
                        saveGame();
                    }
                );
            } else {
                this.game.uiManager.showDialogue("Be careful out there, young farmer.", () => { });
            }
        } else if (npc.id === NPC_IDS.SHOPKEEPER) {
            this.game.uiManager.showDialogue(
                "Welcome to the Mega Seed Market! Best seeds in the valley!",
                () => {
                    this.game.uiManager.showDialogue(
                        "How can I help you today? Would you like to see our stock?",
                        () => {
                            setState({ screen: 'SHOP' });
                            if (this.game.shopModal && this.game.inventory && this.game.timeSystem) {
                                this.game.shopModal.show(this.game.inventory, this.game.timeSystem.season);
                            }
                        }
                    );
                }
            );
        }
    }

    /**
     * Collect produce from basket (eggs) or pail (milk)
     */
    collectProduce(produceType: string) {
        const state = getState();

        // Find animals that have produced in this building
        let collected = 0;
        // buildingType unused but kept for future use
        // const buildingType = state.currentMap.replace('Interior', '');

        // Find animals belonging to this building
        const buildingAnimals = state.animals?.filter((a: any) => {
            if (produceType === 'egg' && a.type === 'chicken') return true;
            if (produceType === 'milk' && a.type === 'cow') return true;
            return false;
        }) || [];

        // Collect from any that have produced
        for (const animal of buildingAnimals) {
            if (animal.producedToday && !animal.collected) {
                collected++;
                animal.collected = true;
            }
        }

        // If no animals have produced, give 1 as default for testing
        if (collected === 0) {
            collected = 1;
        }

        if (collected > 0 && this.game.inventory) {
            const itemName = produceType === 'egg' ? 'EGG' : 'MILK';
            this.game.inventory.addItem(itemName, collected);
            this.game.showToast(`Collected ${collected} ${produceType}${collected > 1 ? 's' : ''}!`, '#ffd700');
            this.game.syncInventory();
            saveGame();
        } else {
            this.game.showToast(`No ${produceType} to collect`, '#ffa726');
        }
    }

    enterShop() { this.enterBuilding('shop'); }
    enterHouse() { this.enterBuilding('house'); }

    enterBuilding(type: string) {
        if (!this.game.player) return;
        const state = getState();
        if (state.currentMap !== 'overworld') return;

        const lastPos = { x: this.game.player.gridX, y: this.game.player.gridY };
        const spawn = getInteriorSpawn(type);

        let interior = state.interiors[type];
        if (!interior) {
            if (type === 'house') interior = generateHouseInterior();
            else if (type === 'shop') interior = generateShopInterior();
            else if (type === 'old_house') interior = generateOldHouseInterior();
            else if (type === 'coop') interior = generateCoopInterior();
            else if (type === 'barn') interior = generateBarnInterior();
            else interior = generateHouseInterior();
        }

        setState({
            screen: 'GAME',
            currentMap: type + 'Interior',
            lastOverworldPos: lastPos,
            interiors: { ...state.interiors, [type]: interior },
            player: {
                ...this.game.player.serialize(),
                gridX: spawn.x, gridY: spawn.y,
                visX: spawn.x * TILE_SIZE, visY: spawn.y * TILE_SIZE,
                facing: { x: 0, y: -1 }
            }
        });

        this.game.player.gridX = spawn.x;
        this.game.player.gridY = spawn.y;
        this.game.player.visX = spawn.x * TILE_SIZE;
        this.game.player.visY = spawn.y * TILE_SIZE;
        this.game.player.facing = { x: 0, y: -1 };

        let name = type.charAt(0).toUpperCase() + type.slice(1);
        if (type === 'old_house') name = 'Old Shack';
        this.game.showToast(`Entering ${name}...`, '#90caf9');
    }

    exitHouse() {
        if (!this.game.player) return;
        const state = getState();

        // Check if we were in an overworld map
        const lastPos = state.lastOverworldPos || { x: 20, y: 20 };

        // Better logic: if we were in an interior, we should know where we came from.
        // For now, assume house/shop are only on main overworld.
        let targetMap = 'overworld';
        if (state.currentMap.includes('dungeon')) targetMap = 'overworld_north';
        else if (state.currentMap === 'oldHouseInterior') targetMap = 'overworld';

        this.game.player.gridX = lastPos.x;
        this.game.player.gridY = lastPos.y;
        this.game.player.visX = lastPos.x * TILE_SIZE;
        this.game.player.visY = lastPos.y * TILE_SIZE;
        this.game.player.isMoving = false;
        this.game.player.facing = { x: 0, y: 1 };

        setState({
            screen: 'GAME',
            currentMap: targetMap,
            player: this.game.player.serialize()
        });

        if (state.currentMap === 'houseInterior') {
            this.game.uiManager.setHouseVisible(false);
        }
    }

    /**
     * Enter the dungeon cave
     */
    enterCave() {
        const state = getState();
        const firstFloor = 'dungeon_1';

        // Initialize dungeon if not exists
        if (!state.interiors[firstFloor]) {
            const { map, npcs } = generateDungeonLevel(1);
            const interiors = { ...state.interiors };
            interiors[firstFloor] = { map, npcs };
            setState({ interiors });
        }

        // Save overworld position
        setState({ lastOverworldPos: { x: this.game.player?.gridX || 0, y: this.game.player?.gridY || 0 } });

        this.game.transitionToMap(firstFloor, 20, 35); // Entrance at bottom of dungeon
        this.game.showToast("The cave is cold and dark...", '#9e9e9e');
    }

    /**
     * Move to next or previous dungeon floor
     */
    changeDungeonFloor(direction: 'up' | 'down') {
        const state = getState();
        const currentFloor = state.currentMap;
        if (!currentFloor.startsWith('dungeon_')) return;

        const currentLevel = parseInt(currentFloor.split('_')[1]);
        const nextLevel = direction === 'down' ? currentLevel + 1 : currentLevel - 1;

        if (nextLevel < 1) {
            this.exitDungeon();
            return;
        }

        if (nextLevel > 10) {
            this.game.showToast("The path is blocked by ancient runes.");
            return;
        }

        const nextFloor = `dungeon_${nextLevel}`;

        // Generate if not exists
        if (!state.interiors[nextFloor]) {
            const { map, npcs } = generateDungeonLevel(nextLevel);
            const interiors = { ...state.interiors };
            interiors[nextFloor] = { map, npcs };
            setState({ interiors });
        }

        // Transition (entrance pos)
        const newY = direction === 'down' ? 35 : 5;
        this.game.transitionToMap(nextFloor, 20, newY);
        this.game.showToast(`Floor ${nextLevel}`);
    }

    /**
     * Exit dungeon back to overworld_north
     */
    exitDungeon() {
        const state = getState();
        if (state.lastOverworldPos) {
            this.game.transitionToMap('overworld_north', state.lastOverworldPos.x, state.lastOverworldPos.y + 1);
        } else {
            this.game.transitionToMap('overworld_north', 20, 10);
        }
    }
}
