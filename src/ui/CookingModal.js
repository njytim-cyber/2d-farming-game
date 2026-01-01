/**
 * Cooking Modal
 * UI for cooking at the stove
 */

import { RECIPES, CONSUMABLES, BUFF_TYPES, canCraft, craft } from '../systems/Recipes.js';
import { SEEDS } from '../game/constants.js';

export class CookingModal {
    constructor(uiManager, callbacks = {}) {
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

        const closeBtn = this.modal.querySelector('.btn--close');
        if (closeBtn) {
            closeBtn.onclick = () => this.hide();
        }
    }

    show(inventory) {
        this.inventory = inventory;
        this.render();
        this.modal?.classList.add('modal-overlay--active');
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
    }

    renderRecipes() {
        const stoveRecipes = Object.entries(RECIPES)
            .filter(([key, recipe]) => recipe.requiredStation === 'stove');

        if (stoveRecipes.length === 0) {
            return '<div class="cooking-empty">No recipes available</div>';
        }

        return stoveRecipes.map(([key, recipe]) => {
            const canMake = canCraft(this.inventory, key);
            const ingredients = Object.entries(recipe.inputs)
                .map(([item, count]) => {
                    const seedData = SEEDS[item];
                    const name = seedData ? seedData.name : item;
                    const hasEnough = this.inventory.countItem(item) >= count;
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

    renderCookedFoods() {
        // Find cooked foods in inventory
        const cookedFoods = this.inventory.slots
            .map((slot, idx) => ({ slot, idx }))
            .filter(({ slot }) => slot && CONSUMABLES[slot.name]);

        if (cookedFoods.length === 0) {
            return '<div class="cooking-empty">No cooked foods in inventory</div>';
        }

        return cookedFoods.map(({ slot, idx }) => {
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
            btn.onclick = (e) => {
                const recipeKey = e.target.dataset.recipe;
                if (craft(this.inventory, recipeKey)) {
                    this.onCook(recipeKey);
                    this.render();
                }
            };
        });

        // Eat buttons
        this.modal.querySelectorAll('.btn--eat').forEach(btn => {
            btn.onclick = (e) => {
                const slotIdx = parseInt(e.target.dataset.slot);
                this.onConsume(slotIdx);
                this.render();
            };
        });
    }
}

export default CookingModal;
