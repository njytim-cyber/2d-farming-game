/**
 * Shop Modal
 * Handles shop buying and selling UI
 */

import { SEEDS } from '../game/constants';
import { Inventory } from '../systems/Inventory';

interface ShopCallbacks {
    onBuy: (seedType: string) => void;
    onSell: (slotIndex: number, value: number) => void;
    onClose: () => void;
    onReset: () => void;
}

export class ShopModal {
    uiManager: any; // Using any for now to avoid circular dependency pain until UIManager is TS
    gameCallbacks: ShopCallbacks;
    currentSeason: number;

    constructor(uiManager: any, gameCallbacks: ShopCallbacks) {
        this.uiManager = uiManager;
        this.gameCallbacks = gameCallbacks; // { onBuy, onSell, onClose, onReset }
        this.currentSeason = 0;

        this.setupEventListeners();
    }

    /**
     * Setup static event listeners
     */
    setupEventListeners() {
        const closeBtn = document.querySelector('#shop-modal .btn--close') as HTMLElement;
        if (closeBtn) {
            closeBtn.onclick = () => this.gameCallbacks.onClose();
        }

        const backBtn = document.querySelector('#shop-modal .btn--back') as HTMLElement;
        if (backBtn) {
            backBtn.onclick = () => this.gameCallbacks.onClose();
        }

        const resetBtn = document.querySelector('#shop-modal .btn--reset') as HTMLElement;
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
    show(inventory: Inventory, currentSeason: number = 0) {
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
    render(inventory: Inventory) {
        this.uiManager.renderShop(SEEDS, this.currentSeason, (seedType: string) => {
            this.gameCallbacks.onBuy(seedType);
            this.render(inventory); // Re-render sell list
        });

        this.uiManager.renderSellList(inventory, (slotIndex: number, value: number) => {
            this.gameCallbacks.onSell(slotIndex, value);
            this.render(inventory); // Re-render after selling
        });
    }
}

export default ShopModal;
