/**
 * What's New Modal
 * Displays version info and recent updates
 */

import { GAME_VERSION } from '../game/constants';

export class WhatsNewModal {
    modal: HTMLElement | null;
    onClose: () => void;

    constructor(onClose: () => void) {
        this.onClose = onClose;
        this.modal = null;
        this.setupUI();
    }

    setupUI() {
        this.modal = document.createElement('div');
        this.modal.id = 'whats-new-modal';
        this.modal.className = 'modal-overlay';

        const content = document.createElement('div');
        content.className = 'modal-panel';
        content.style.maxWidth = '500px';
        content.innerHTML = `
            <div class="modal-header">
                <div class="modal-title">✨ What's New! v${GAME_VERSION}</div>
                <button class="btn btn--close">✕</button>
            </div>
            
            <div class="modal-scroll" style="margin: 20px 0; text-align: left;">
                <h3 style="color: var(--accent); margin-bottom: 10px;">Quality of Life Features</h3>
                <ul style="padding-left: 20px; line-height: 1.6;">
                    <li><strong>10 Inventory Slots:</strong> Expanded the hotbar to 10 slots with hotkeys 1-0!</li>
                    <li><strong>Quick Sword Swing:</strong> You can now use the Wooden Sword just by holding it—no more equipping required!</li>
                    <li><strong>Inventory Fix:</strong> The hotbar now stays visible while equipping items in the Character menu.</li>
                    <li><strong>Smart Interaction:</strong> The "ACT" button automatically uses your selected item (Eat food, Chop trees, Mine rocks).</li>
                    <li><strong>Pickaxe Icon:</strong> Fixed the icon mismatch; Pickaxe now looks distinct from the Axe.</li>
                </ul>
            </div>

            <button class="btn btn--start" style="width: 100%;">LET'S PLAY!</button>
        `;

        this.modal.appendChild(content);
        document.body.appendChild(this.modal);

        // Events
        const closeBtn = content.querySelector('.btn--close') as HTMLElement;
        const playBtn = content.querySelector('.btn--start') as HTMLElement;

        const hide = () => {
            if (this.modal) this.modal.classList.remove('modal-overlay--active');
            this.onClose();
        };

        if (closeBtn) closeBtn.onclick = hide;
        if (playBtn) playBtn.onclick = hide;
    }

    show() {
        if (this.modal) {
            this.modal.classList.add('modal-overlay--active');
        }
    }
}

export default WhatsNewModal;
