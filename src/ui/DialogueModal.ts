/**
 * Dialogue Modal
 * Handles NPC conversation interactions
 */

export class DialogueModal {
    overlay: HTMLElement | null;
    textEl: HTMLElement | null;
    nextBtn: HTMLElement | null;
    callback: (() => void) | null;

    yesBtn: HTMLButtonElement | null = null;
    noBtn: HTMLButtonElement | null = null;
    choiceCallback: ((confirmed: boolean) => void) | null = null;

    constructor() {
        this.overlay = document.getElementById('dialogue-modal');
        this.textEl = document.getElementById('dialogue-text');
        this.nextBtn = document.getElementById('dialogue-next');

        this.callback = null;

        if (this.nextBtn) {
            this.nextBtn.onclick = () => this.onNext();
        }

        // Create choice buttons dynamically
        if (this.overlay) {
            const panel = this.overlay.querySelector('.modal-panel');
            if (panel) {
                const btnContainer = document.createElement('div');
                btnContainer.id = 'dialogue-choices';
                btnContainer.style.display = 'none';
                btnContainer.style.gap = '10px';
                btnContainer.style.marginTop = '10px';
                btnContainer.style.justifyContent = 'flex-end'; // Align right like Next button

                this.yesBtn = document.createElement('button');
                this.yesBtn.className = 'btn btn--start';
                this.yesBtn.innerText = 'Yes';
                this.yesBtn.style.background = '#66bb6a';
                this.yesBtn.style.width = 'auto';
                this.yesBtn.style.minWidth = '80px';
                this.yesBtn.onclick = () => this.onChoice(true);

                this.noBtn = document.createElement('button');
                this.noBtn.className = 'btn btn--secondary';
                this.noBtn.innerText = 'No';
                this.noBtn.style.background = '#ef5350';
                this.noBtn.style.marginTop = '0'; // Override default margin
                this.noBtn.style.width = 'auto';
                this.noBtn.style.minWidth = '80px';
                this.noBtn.onclick = () => this.onChoice(false);

                btnContainer.appendChild(this.noBtn); // No on left? or right? Standard logic usually Yes right.
                btnContainer.appendChild(this.yesBtn);

                panel.appendChild(btnContainer);
            }
        }
    }

    /**
     * Show text
     * @param {string} text 
     * @param {Function} onFinish - Callback when conversation ends
     */
    show(text: string, onFinish: () => void) {
        if (!this.overlay || !this.textEl) return;

        this.textEl.innerText = text;
        this.callback = onFinish;
        this.choiceCallback = null;

        if (this.nextBtn) this.nextBtn.style.display = 'block';
        const choices = document.getElementById('dialogue-choices');
        if (choices) choices.style.display = 'none';

        this.overlay.classList.add('modal-overlay--active');
    }

    /**
     * Show choice (Yes/No)
     */
    showChoice(text: string, onChoice: (confirmed: boolean) => void) {
        if (!this.overlay || !this.textEl) return;

        this.textEl.innerText = text;
        this.choiceCallback = onChoice;
        this.callback = null;

        if (this.nextBtn) this.nextBtn.style.display = 'none';
        const choices = document.getElementById('dialogue-choices');
        if (choices) {
            choices.style.display = 'flex';
        }

        this.overlay.classList.add('modal-overlay--active');
    }

    onNext() {
        if (this.overlay) {
            this.overlay.classList.remove('modal-overlay--active');
        }
        if (this.callback) {
            this.callback();
            this.callback = null;
        }
    }

    onChoice(confirmed: boolean) {
        if (this.overlay) {
            this.overlay.classList.remove('modal-overlay--active');
        }
        if (this.choiceCallback) {
            this.choiceCallback(confirmed);
            this.choiceCallback = null;
        }
    }
}
