/**
 * Shop Modal
 * Handles shop buying and selling UI
 */

import { SEEDS, SHOP_TABS, ITEMS } from '../game/constants';
import { Inventory } from '../systems/Inventory';
import { ANIMAL_TYPES } from '../entities/Animals';

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
    activeTab: string;

    constructor(uiManager: any, gameCallbacks: ShopCallbacks) {
        this.uiManager = uiManager;
        this.gameCallbacks = gameCallbacks; // { onBuy, onSell, onClose, onReset }
        this.currentSeason = 0;
        this.activeTab = 'seeds';

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
    show(inventory: Inventory, currentSeason: number = 0, initialTab: string = 'seeds') {
        this.currentSeason = currentSeason;
        this.activeTab = initialTab;
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
        // Render tabs
        this.uiManager.renderShopTabs(SHOP_TABS, this.activeTab, (tabId: string) => {
            this.activeTab = tabId;
            this.render(inventory);
        });

        // Determine items based on tab
        let items: any = {};
        if (this.activeTab === 'seeds') {
            items = SEEDS;
        } else if (this.activeTab === 'animals') {
            items = ANIMAL_TYPES;
        } else if (this.activeTab === 'guild') {
            // Filter ITEMS for weapons/potions
            items = {};
            for (const [key, val] of Object.entries(ITEMS)) {
                if (val.type === 'weapon' || val.type === 'consumable') {
                    items[key] = val;
                }
            }
        }

        this.uiManager.renderShop(items, this.activeTab, this.currentSeason, (id: string) => {
            if (this.activeTab === 'seeds' || this.activeTab === 'guild' || this.activeTab === 'tools') {
                this.gameCallbacks.onBuy(id);
            } else if (this.activeTab === 'animals') {
                this.gameCallbacks.onBuy(id);
            }
            this.render(inventory);
        });

        this.uiManager.renderSellList(inventory, (slotIndex: number, value: number) => {
            this.gameCallbacks.onSell(slotIndex, value);
            this.render(inventory); // Re-render after selling
        });
    }
}

export default ShopModal;
