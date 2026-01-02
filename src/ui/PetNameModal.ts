/**
 * Pet Name Modal
 * UI for naming the pet
 */

export class PetNameModal {
    uiManager: any;
    onConfirm: (name: string) => void;

    constructor(uiManager: any, onConfirm: (name: string) => void) {
        this.uiManager = uiManager;
        this.onConfirm = onConfirm;
    }

    show() {
        // We'll reuse the dialogue modal structure or create a custom one
        // For simplicity, let's inject a custom modal into the creator-modal overlay or similar
        // actually let's use a new modal overlay injection or reuse 'start-panel-content' logic from UIManager if accessible
        // Let's stick to UIManager having a helper or just manipulating DOM directly for this specific one-off event

        const overlay = document.getElementById('creator-modal'); // Reuse this overlay
        if (!overlay) return;

        overlay.classList.add('modal-overlay--active');

        const content = document.getElementById('start-panel-content');
        if (!content) return;

        content.innerHTML = `
            <div class="modal-title">A stray dog appears!</div>
            <div style="font-size:40px; margin:20px;">🐕</div>
            <p style="color:#ccc; margin-bottom:20px;">It seems friendly. What will you call it?</p>
            <input type="text" id="pet-name-input" class="cc-input" style="width:200px; font-size:20px; text-align:center; margin-bottom:20px;" value="Fluffy" placeholder="Name" maxlength="12">
            <button id="btn-adopt" class="btn btn--start">Adopt</button>
        `;

        const input = document.getElementById('pet-name-input') as HTMLInputElement;
        if (input) {
            input.focus();
            input.select(); // Select the text for easy renaming
        }

        const btnAdopt = document.getElementById('btn-adopt');
        if (btnAdopt) {
            btnAdopt.onclick = () => {
                const name = input ? (input.value.trim() || 'Fluffy') : 'Fluffy';
                overlay.classList.remove('modal-overlay--active');
                this.onConfirm(name);
            };
        }
    }
}
