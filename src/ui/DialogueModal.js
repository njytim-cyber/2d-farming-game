/**
 * Dialogue Modal
 * Handles NPC conversation interactions
 */

export class DialogueModal {
    constructor() {
        this.overlay = document.getElementById('dialogue-modal');
        this.textEl = document.getElementById('dialogue-text');
        this.nextBtn = document.getElementById('dialogue-next');

        this.callback = null;

        if (this.nextBtn) {
            this.nextBtn.onclick = () => this.onNext();
        }
    }

    /**
     * Show text
     * @param {string} text 
     * @param {Function} onFinish - Callback when conversation ends
     */
    show(text, onFinish) {
        if (!this.overlay) return;

        this.textEl.innerText = text;
        this.callback = onFinish;

        this.overlay.classList.add('modal-overlay--active');
    }

    onNext() {
        this.overlay.classList.remove('modal-overlay--active');
        if (this.callback) {
            this.callback();
            this.callback = null;
        }
    }
}
