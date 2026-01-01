/**
 * UI Manager
 * Handles DOM UI updates and modal orchestration
 */

import { Inventory } from '../systems/Inventory';
import { EquipmentModal } from './EquipmentModal';
import { DialogueModal } from './DialogueModal';
import { SEASONS, SEASON_ICONS } from '../game/constants';
import { Player } from '../entities/Player';
import { CropConfig } from '../game/constants';

interface UIElements {
    inventoryScroll: HTMLElement | null;
    energyText: HTMLElement | null;
    energyBar: HTMLElement | null;
    seasonIcon: HTMLElement | null;
    seasonName: HTMLElement | null;
    time: HTMLElement | null;
    timeIcon: HTMLElement | null;
    money: HTMLElement | null;
    day: HTMLElement | null;
    saveIndicator: HTMLElement | null;
    creatorModal: HTMLElement | null;
    shopModal: HTMLElement | null;
    houseModal: HTMLElement | null;
    shopItems: HTMLElement | null;
    sellList: HTMLElement | null;
    startPanelContent: HTMLElement | null;
    healthText: HTMLElement | null;
    healthBar: HTMLElement | null;
}

interface GameStats {
    money: number;
    day: number;
    season: number;
    weather: string;
    energy: number;
    maxEnergy: number;
    timeString: string;
    hp: number;
    maxHp: number;
}

export class UIManager {
    elements: UIElements;
    onSlotSelectCallback: ((index: number) => void) | null;
    onEquipCallback: ((index: number) => void) | null;
    equipmentModal: EquipmentModal | null;
    dialogueModal: DialogueModal;
    tooltip: HTMLElement | null;
    lastInventoryHash: string;
    lastStats: Partial<GameStats>;

    constructor() {
        // Cache DOM elements
        this.elements = {
            inventoryScroll: document.getElementById('inventory-scroll'),
            energyText: document.getElementById('ui-energy-text'),
            energyBar: document.getElementById('ui-energy-bar'),
            seasonIcon: document.getElementById('ui-season-icon'),
            seasonName: document.getElementById('ui-season-name'),
            time: document.getElementById('ui-time'),
            timeIcon: document.getElementById('ui-time-icon'),
            money: document.getElementById('ui-money'),
            day: document.getElementById('ui-day'),
            saveIndicator: document.getElementById('save-indicator'),
            creatorModal: document.getElementById('creator-modal'),
            shopModal: document.getElementById('shop-modal'),
            houseModal: document.getElementById('house-modal'),
            shopItems: document.getElementById('shop-items'),
            sellList: document.getElementById('sell-list'),

            startPanelContent: document.getElementById('start-panel-content'),

            // Health Stats
            healthText: document.getElementById('ui-health-text'),
            healthBar: document.getElementById('ui-health-bar')
        };

        this.onSlotSelectCallback = null;
        this.onEquipCallback = null;
        this.equipmentModal = null;
        this.dialogueModal = new DialogueModal();
        this.tooltip = null;
        this.lastInventoryHash = '';
        this.lastStats = {};

        // Setup Tooltip
        this.setupTooltips();

        // Setup Profile Button
        const profileBtn = document.getElementById('btn-profile');
        if (profileBtn) {
            profileBtn.onclick = () => {
                if (this.equipmentModal) this.equipmentModal.toggle();
            };
        }
    }

    /**
     * Setup Equipment Modal
     */
    setupEquipment(player: Player) {
        this.equipmentModal = new EquipmentModal(player);
        const modalEl = document.getElementById('equipment-modal');
        if (modalEl) {
            this.equipmentModal.setupUI(modalEl);
        }
    }

    /**
     * Setup global tooltips
     */
    setupTooltips() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tooltip';
        this.tooltip.innerHTML = '<div class="tooltip__content"></div>';
        document.body.appendChild(this.tooltip);

        const content = this.tooltip.querySelector('.tooltip__content') as HTMLElement;

        document.addEventListener('mouseover', (e) => {
            const target = (e.target as HTMLElement).closest('[data-tooltip]') as HTMLElement;
            if (target) {
                const text = target.dataset.tooltip;
                if (text && content) {
                    content.innerText = text;
                    if (this.tooltip) {
                        this.tooltip.style.display = 'block';
                        this.moveTooltip(e.clientX, e.clientY);
                    }
                }
            }
        });

        document.addEventListener('mouseout', (e) => {
            if ((e.target as HTMLElement).closest('[data-tooltip]')) {
                if (this.tooltip) this.tooltip.style.display = 'none';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.tooltip && this.tooltip.style.display === 'block') {
                this.moveTooltip(e.clientX, e.clientY);
            }
        });
    }

    moveTooltip(x: number, y: number) {
        if (!this.tooltip) return;

        const padding = 10;
        let left = x + padding;
        let top = y + padding;

        // Bounds check
        const rect = this.tooltip.getBoundingClientRect();
        if (left + rect.width > window.innerWidth) left = x - rect.width - padding;
        if (top + rect.height > window.innerHeight) top = y - rect.height - padding;

        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
    }

    /**
     * Set inventory slot select callback
     */
    onSlotSelect(callback: (index: number) => void) {
        this.onSlotSelectCallback = callback;
    }

    /**
     * Set equipment callback
     */
    onEquip(callback: (index: number) => void) {
        this.onEquipCallback = callback;
    }

    /**
     * Update inventory display (Optimized)
     */
    renderInventory(inventory: Inventory) {
        // Simple cache check to avoid rebuilding DOM every frame
        const currentHash = JSON.stringify(inventory.slots) + inventory.selected;
        if (this.lastInventoryHash === currentHash) return;
        this.lastInventoryHash = currentHash;

        const container = this.elements.inventoryScroll;
        if (!container) return;

        container.innerHTML = '';

        inventory.slots.forEach((item, i) => {
            const slot = document.createElement('div');
            slot.className = `slot ${i === inventory.selected ? 'slot--selected' : ''}`;
            if (item) {
                slot.dataset.tooltip = `${Inventory.getName(item.name)}\nQuantity: ${item.count}`;
            }

            slot.onclick = (e) => {
                e.stopPropagation();
                // If profile is open, equip. Otherwise just select.
                if (this.equipmentModal && this.equipmentModal.isVisible) {
                    if (this.onEquipCallback) this.onEquipCallback(i);
                } else if (this.onSlotSelectCallback) {
                    this.onSlotSelectCallback(i);
                }
            };

            if (item) {
                slot.innerHTML = `
          <div class="slot__icon">${Inventory.getIcon(item.name)}</div>
          <div class="slot__count">${item.count}</div>
        `;
            }

            container.appendChild(slot);
        });
    }

    /**
     * Update stats display (Optimized)
     */
    updateStats({ money, day, season, weather, energy, maxEnergy, timeString, hp, maxHp }: GameStats) {
        if (!this.lastStats) this.lastStats = {};

        if (this.lastStats.money !== money) {
            if (this.elements.money) this.elements.money.innerText = '$' + money;
            this.lastStats.money = money;
        }

        if (this.lastStats.day !== day) {
            if (this.elements.day) this.elements.day.innerText = day.toString();
            this.lastStats.day = day;
        }

        if (this.lastStats.season !== season) {
            if (this.elements.seasonName) this.elements.seasonName.innerText = SEASONS[season] || '';
            if (this.elements.seasonIcon) {
                const weatherIcon = weather === 'Rain' ? (season === 3 ? '🌨️' : '🌧️') : '';
                this.elements.seasonIcon.innerText = (SEASON_ICONS[season] || '') + weatherIcon;
            }
            this.lastStats.season = season;
        }

        if (this.lastStats.timeString !== timeString) {
            if (this.elements.time) this.elements.time.innerText = timeString;
            if (this.elements.timeIcon && timeString) {
                const hour = parseInt(timeString.split(':')[0], 10);
                this.elements.timeIcon.innerText = (hour >= 6 && hour < 18) ? '☀️' : '🌙';
            }
            this.lastStats.timeString = timeString;
        }

        if (this.lastStats.energy !== energy || this.lastStats.maxEnergy !== maxEnergy) {
            if (this.elements.energyText) this.elements.energyText.innerText = `${energy.toFixed(0)}/${maxEnergy}`;
            if (this.elements.energyBar) {
                this.elements.energyBar.style.width = `${(energy / maxEnergy) * 100}%`;
                if (energy < 20) this.elements.energyBar.style.backgroundColor = '#ef5350';
                else if (energy < 50) this.elements.energyBar.style.backgroundColor = '#ffa726';
                else this.elements.energyBar.style.backgroundColor = '#29b6f6';
            }
            this.lastStats.energy = energy;
            this.lastStats.maxEnergy = maxEnergy;
        }

        // Health Update
        if ((this.lastStats.hp !== hp || this.lastStats.maxHp !== maxHp) && hp !== undefined) {
            const mHp = maxHp || 100;
            if (this.elements.healthText) this.elements.healthText.innerText = `${hp}/${mHp}`;
            if (this.elements.healthBar) this.elements.healthBar.style.width = `${(hp / mHp) * 100}%`;
            this.lastStats.hp = hp;
            this.lastStats.maxHp = maxHp;
        }
    }

    showDialogue(text: string, callback: () => void) {
        this.dialogueModal.show(text, callback);
    }

    /**
     * Show save indicator
     */
    showSaveIndicator() {
        if (this.elements.saveIndicator) {
            this.elements.saveIndicator.classList.add('save-indicator--active');
            setTimeout(() => {
                if (this.elements.saveIndicator)
                    this.elements.saveIndicator.classList.remove('save-indicator--active');
            }, 1000);
        }
    }

    /**
     * Show/hide creator modal
     */
    setCreatorVisible(visible: boolean) {
        if (this.elements.creatorModal) {
            this.elements.creatorModal.classList.toggle('modal-overlay--active', visible);
        }
    }

    /**
     * Show/hide shop modal
     */
    setShopVisible(visible: boolean) {
        if (this.elements.shopModal) {
            this.elements.shopModal.classList.toggle('modal-overlay--active', visible);
        }
    }

    /**
     * Show/hide house modal
     */
    setHouseVisible(visible: boolean) {
        if (this.elements.houseModal) {
            this.elements.houseModal.classList.toggle('modal-overlay--active', visible);
        }
    }

    /**
     * Render shop items
     */
    renderShop(seeds: Record<string, CropConfig>, currentSeason: number, onBuy: (seed: string) => void) {
        if (!this.elements.shopItems) return;

        let html = '';
        for (const [key, val] of Object.entries(seeds)) {
            // Determine if crop is in season
            // val.seasons is optional in CropConfig? In constants.ts it is seasons: number[].
            const isInSeason = val.seasons ? val.seasons.includes(currentSeason) : true;
            const seasonIcons = val.seasons
                ? val.seasons.map((s: number) => SEASON_ICONS[s]).join('')
                : '🌱';  // All season indicator

            const cardClass = isInSeason ? 'shop-card shop-card--in-season' : 'shop-card shop-card--out-season';

            html += `
        <div class="${cardClass}">
          <div class="shop-card__icon">${Inventory.getIcon(key)}</div>
          <div class="shop-card__seasons">${seasonIcons}</div>
          <h4 class="shop-card__name">${val.name}</h4>
          <div class="shop-card__meta">Grow: ${(1 / val.grow).toFixed(1)}s</div>
          <div class="shop-card__price">$${val.cost}</div>
          <button class="btn btn--buy" data-seed="${key}">${isInSeason ? 'BUY' : 'OFF SEASON'}</button>
        </div>
      `;
        }

        this.elements.shopItems.innerHTML = html;

        // Add click handlers
        this.elements.shopItems.querySelectorAll('.btn--buy').forEach(btn => {
            (btn as HTMLElement).onclick = () => onBuy((btn as HTMLElement).dataset.seed!);
        });
    }

    /**
     * Render sell list
     */
    renderSellList(inventory: Inventory, onSell: (slotIndex: number, value: number) => void) {
        if (!this.elements.sellList) return;

        this.elements.sellList.innerHTML = '';

        inventory.slots.forEach((item, idx) => {
            if (!item) return;

            const value = Inventory.getSellValue(item.name);
            if (value <= 0) return;

            const chip = document.createElement('button');
            chip.className = 'sell-chip';
            chip.innerHTML = `${Inventory.getIcon(item.name)} ${Inventory.getName(item.name)} ($${value})`;
            chip.onclick = () => onSell(idx, value);

            this.elements.sellList!.appendChild(chip);
        });
    }

    /**
     * Set start panel content
     */
    setStartPanelContent(html: string) {
        if (this.elements.startPanelContent) {
            this.elements.startPanelContent.innerHTML = html;
        }
    }
}

export default UIManager;
