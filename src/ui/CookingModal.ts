/**
 * Cooking Modal
 * UI for cooking at the stove
 */

import { RECIPES, CONSUMABLES, BUFF_TYPES, canCraft, craft } from '../systems/Recipes';
import { SEEDS } from '../game/constants';
import { Inventory } from '../systems/Inventory'; // Import Inventory type

interface CookingCallbacks {
    onCook?: (recipeKey: string) => void;
    onConsume?: (slotIdx: number) => void;
    onClose?: () => void;
}

export class CookingModal {
    uiManager: any;
    onCook: (recipeKey: string) => void;
    onConsume: (slotIdx: number) => void;
    onClose: () => void;
    modal: HTMLElement | null;
    inventory: Inventory | null;

    constructor(uiManager: any, callbacks: CookingCallbacks = {}) {
        this.uiManager = uiManager;
        this.onCook = callbacks.onCook || (() => { });
        this.onConsume = callbacks.onConsume || (() => { });
        this.onClose = callbacks.onClose || (() => { });

        this.modal = document.getElementById('cooking-modal');
        this.inventory = null;

        this.setupModal();
    }

    setupModal() {
        if (!this.modal) return;

        const closeBtn = this.modal.querySelector('.btn--close') as HTMLElement;
        if (closeBtn) {
            closeBtn.onclick = () => this.hide();
        }
    }

    show(inventory: Inventory) {
        this.inventory = inventory;
        this.render();
        this.modal?.classList.add('modal-overlay--active');
        this.bindEvents(); // Bind events after rendering/showing to ensure elements exist
    }

    hide() {
        this.modal?.classList.remove('modal-overlay--active');
        this.onClose();
    }

    render() {
        if (!this.modal || !this.inventory) return;

        const recipeList = this.modal.querySelector('#cooking-recipes');
        const foodList = this.modal.querySelector('#cooked-foods');

        if (recipeList) {
            recipeList.innerHTML = this.renderRecipes();
        }

        if (foodList) {
            foodList.innerHTML = this.renderCookedFoods();
        }

        // Re-bind events after re-rendering contents
        this.bindEvents();
    }

    renderRecipes(): string {
        if (!this.inventory) return '';

        const stoveRecipes = Object.entries(RECIPES)
            .filter(([, recipe]) => recipe.requiredStation === 'stove');

        if (stoveRecipes.length === 0) {
            return '<div class="cooking-empty">No recipes available</div>';
        }

        return stoveRecipes.map(([key, recipe]) => {
            const canMake = canCraft(this.inventory!, key);
            const ingredients = Object.entries(recipe.inputs)
                .map(([item, count]) => {
                    const seedData = SEEDS[item];
                    const name = seedData ? seedData.name : item;
                    const hasEnough = this.inventory!.countItem(item) >= count;
                    return `<span class="${hasEnough ? 'has-item' : 'missing-item'}">${count}x ${name}</span>`;
                })
                .join(' + ');

            const output = CONSUMABLES[recipe.output];
            const buffInfo = output?.buff ?
                `<div class="recipe-buff">${BUFF_TYPES[output.buff.type]?.icon || '✨'} ${BUFF_TYPES[output.buff.type]?.name || 'Buff'}</div>` : '';

            return `
                <div class="recipe-card ${canMake ? 'can-craft' : 'cannot-craft'}" data-recipe="${key}">
                    <div class="recipe-icon">${output?.icon || '🍽️'}</div>
                    <div class="recipe-name">${recipe.name}</div>
                    <div class="recipe-ingredients">${ingredients}</div>
                    ${buffInfo}
                    <button class="btn btn--cook" ${canMake ? '' : 'disabled'} data-recipe="${key}">
                        ${canMake ? 'Cook!' : 'Missing Items'}
                    </button>
                </div>
            `;
        }).join('');
    }

    renderCookedFoods(): string {
        if (!this.inventory) return '';

        // Find cooked foods in inventory
        const cookedFoods = this.inventory.slots
            .map((slot, idx) => ({ slot, idx }))
            .filter(({ slot }) => slot && CONSUMABLES[slot.name]);

        if (cookedFoods.length === 0) {
            return '<div class="cooking-empty">No cooked foods in inventory</div>';
        }

        return cookedFoods.map(({ slot, idx }) => {
            if (!slot) return '';
            const consumable = CONSUMABLES[slot.name];
            const buffInfo = consumable?.buff ?
                `<div class="food-buff">${BUFF_TYPES[consumable.buff.type]?.icon || '✨'} ${BUFF_TYPES[consumable.buff.type]?.name}</div>` : '';

            return `
                <div class="food-chip" data-slot="${idx}">
                    <span class="food-icon">${consumable?.icon || '🍽️'}</span>
                    <span class="food-name">${slot.name.replace(/_/g, ' ')}</span>
                    <span class="food-count">x${slot.count}</span>
                    <span class="food-energy">+${consumable.energy}⚡</span>
                    ${buffInfo}
                    <button class="btn btn--eat" data-slot="${idx}">Eat</button>
                </div>
            `;
        }).join('');
    }

    bindEvents() {
        if (!this.modal) return;

        // Cook buttons
        this.modal.querySelectorAll('.btn--cook').forEach(btn => {
            (btn as HTMLElement).onclick = (e) => {
                const target = e.target as HTMLElement;
                const recipeKey = target.dataset.recipe;
                if (recipeKey && this.inventory && craft(this.inventory, recipeKey)) {
                    this.onCook(recipeKey);
                    this.render();
                }
            };
        });

        // Eat buttons
        this.modal.querySelectorAll('.btn--eat').forEach(btn => {
            (btn as HTMLElement).onclick = (e) => {
                const target = e.target as HTMLElement;
                const slotIdx = parseInt(target.dataset.slot || '0');
                this.onConsume(slotIdx);
                this.render();
            };
        });
    }
}

export default CookingModal;
