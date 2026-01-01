/**
 * Shop Modal
 * Handles shop buying and selling UI
 */

import { SEEDS } from '../game/constants.js';
import { Inventory } from '../systems/Inventory.js';

export class ShopModal {
    constructor(uiManager, gameCallbacks) {
        this.uiManager = uiManager;
        this.gameCallbacks = gameCallbacks; // { onBuy, onSell, onClose, onReset }
        this.currentSeason = 0;

        this.setupEventListeners();
    }

    /**
     * Setup static event listeners
     */
    setupEventListeners() {
        const closeBtn = document.querySelector('#shop-modal .btn--close');
        if (closeBtn) {
            closeBtn.onclick = () => this.gameCallbacks.onClose();
        }

        const backBtn = document.querySelector('#shop-modal .btn--back');
        if (backBtn) {
            backBtn.onclick = () => this.gameCallbacks.onClose();
        }

        const resetBtn = document.querySelector('#shop-modal .btn--reset');
        if (resetBtn) {
            resetBtn.onclick = () => {
                if (confirm('Wipe save data?')) {
                    this.gameCallbacks.onReset();
                }
            };
        }
    }

    /**
     * Show the shop modal
     */
    show(inventory, currentSeason = 0) {
        this.currentSeason = currentSeason;
        this.uiManager.setShopVisible(true);
        this.render(inventory);
    }

    /**
     * Hide the shop modal
     */
    hide() {
        this.uiManager.setShopVisible(false);
    }

    /**
     * Render shop contents
     */
    render(inventory) {
        this.uiManager.renderShop(SEEDS, this.currentSeason, (seedType) => {
            this.gameCallbacks.onBuy(seedType);
            this.render(inventory); // Re-render sell list
        });

        this.uiManager.renderSellList(inventory, (slotIndex, value) => {
            this.gameCallbacks.onSell(slotIndex, value);
            this.render(inventory); // Re-render after selling
        });
    }
}

export default ShopModal;
