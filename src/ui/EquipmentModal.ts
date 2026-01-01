/**
 * Equipment Modal
 * Handles character equipment and stats
 */

import { Inventory } from '../systems/Inventory';
import { Player } from '../entities/Player';

export class EquipmentModal {
    player: Player;
    modal: HTMLElement | null;
    isVisible: boolean;

    constructor(player: Player) {
        this.player = player;
        this.modal = null;
        this.isVisible = false;
    }

    /**
     * Setup UI elements
     */
    setupUI(modalElement: HTMLElement) {
        this.modal = modalElement;

        // Modal content
        const content = document.createElement('div');
        content.className = 'modal-panel';
        content.innerHTML = `
            <button class="btn btn--close">&times;</button>
            <div class="modal-title">Character</div>
            
            <div class="equipment-layout">
                <div class="equipment-row">
                    <div class="equipment-slot" data-slot="head" data-tooltip="Head">🛡️</div>
                </div>
                <div class="equipment-row">
                    <div class="equipment-slot equipment-slot--weapon" data-slot="weapon" data-tooltip="Main Hand">⚔️</div>
                    <div class="equipment-slot equipment-slot--armor" data-slot="body" data-tooltip="Body">👕</div>
                    <div class="equipment-slot" data-slot="offhand" data-tooltip="Off Hand">🛡️</div>
                </div>
                <div class="equipment-row">
                    <div class="equipment-slot" data-slot="legs" data-tooltip="Legs">👖</div>
                </div>
            </div>

            <div class="equipment-stats">
                <div class="stat-row">
                    <span>Attack</span>
                    <span id="stat-attack">0</span>
                </div>
                <div class="stat-row">
                    <span>Defense</span>
                    <span id="stat-defense">0</span>
                </div>
                <div class="stat-row">
                    <span>Speed</span>
                    <span id="stat-speed">Normal</span>
                </div>
            </div>
        `;

        this.modal.innerHTML = '';
        this.modal.appendChild(content);

        // Close button
        const closeBtn = content.querySelector('.btn--close') as HTMLElement;
        if (closeBtn) closeBtn.onclick = () => this.hide();

        // Slot interactions (placeholder for now)
        content.querySelectorAll('.equipment-slot').forEach(slot => {
            (slot as HTMLElement).onclick = () => {
                // Future: Open selection modal
                console.log('Clicked slot:', (slot as HTMLElement).dataset.slot);
            };
        });
    }

    /**
     * Render current equipment
     */
    render() {
        if (!this.player.equipment || !this.modal) return;

        const slots = this.modal.querySelectorAll('.equipment-slot');
        slots.forEach(slotEl => {
            const slot = slotEl as HTMLElement;
            const slotType = slot.dataset.slot as 'head' | 'body' | 'legs' | 'weapon' | 'offhand';
            const item = this.player.equipment[slotType];

            if (item) {
                slot.innerHTML = Inventory.getIcon(item.name); // Using name as key for now based on JS
                slot.classList.add('has-item');
            } else {
                // Default placeholders handled by CSS/Initial HTML
                slot.classList.remove('has-item');
                if (slotType === 'head') slot.innerHTML = '🛡️';
                if (slotType === 'weapon') slot.innerHTML = '⚔️';
                if (slotType === 'body') slot.innerHTML = '👕';
                if (slotType === 'offhand') slot.innerHTML = '🛡️';
                if (slotType === 'legs') slot.innerHTML = '👖';
            }
        });

        // Update stats
        const attackEl = this.modal.querySelector('#stat-attack') as HTMLElement;
        const defenseEl = this.modal.querySelector('#stat-defense') as HTMLElement;
        if (attackEl) attackEl.innerText = this.player.getAttack().toString();
        if (defenseEl) defenseEl.innerText = '0';
    }

    /**
     * Show modal
     */
    show() {
        if (!this.modal) return;
        this.isVisible = true;
        this.modal.classList.add('modal-overlay--active');
        this.render();
    }

    /**
     * Hide modal
     */
    hide() {
        if (!this.modal) return;
        this.isVisible = false;
        this.modal.classList.remove('modal-overlay--active');
    }

    /**
     * Toggle visibility
     */
    toggle() {
        if (this.isVisible) this.hide();
        else this.show();
    }
}
