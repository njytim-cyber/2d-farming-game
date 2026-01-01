/**
 * Character Creator Modal
 * Handles character customization UI
 */

import { COLORS } from '../game/constants';
import { Player } from '../entities/Player'; // Import Player type

export class CreatorModal {
    uiManager: any;
    onStart: () => void;
    onLoad: () => void;
    player: Player | null;
    previewCanvas: HTMLCanvasElement | null;
    previewCtx: CanvasRenderingContext2D | null;

    constructor(uiManager: any, onStart: () => void, onLoad: () => void) {
        this.uiManager = uiManager;
        this.onStart = onStart;
        this.onLoad = onLoad;
        this.player = null;
        this.previewCanvas = null;
        this.previewCtx = null;
    }

    /**
     * Show the creator screen
     */
    show(player: Player, hasSaveData: boolean) {
        this.player = player;

        if (hasSaveData) {
            this.showContinueScreen();
        } else {
            this.showCreatorScreen();
        }
    }

    /**
     * Show continue/new game screen
     */
    showContinueScreen() {
        this.uiManager.setStartPanelContent(`
      <div class="modal-title">Welcome Back</div>
      <button class="btn btn--start" id="btn-continue">Continue Journey</button>
      <button class="btn btn--secondary" id="btn-new-game">New Game</button>
    `);

        const btnContinue = document.getElementById('btn-continue');
        if (btnContinue) {
            btnContinue.onclick = (e) => {
                (e.target as HTMLElement).blur();
                this.onLoad();
            };
        }

        const btnNewGame = document.getElementById('btn-new-game');
        if (btnNewGame) {
            btnNewGame.onclick = () => this.showCreatorScreen();
        }
    }

    /**
     * Show character creator screen
     */
    showCreatorScreen() {
        this.uiManager.setStartPanelContent(`
      <div class="modal-title">Create Farmer</div>
      <canvas id="previewCanvas" width="120" height="120" style="background:#4caf50; border-radius:12px; margin-bottom:15px; box-shadow:inset 0 0 20px rgba(0,0,0,0.3)"></canvas>
      <div class="cc-row"><span>Name</span><input type="text" id="char-name" class="cc-input" value="Farmer" maxlength="12"></div>
      <div class="cc-row"><span>Gender</span>
          <div class="gender-toggle">
              <button class="btn-gender active" data-gender="male">Male</button>
              <button class="btn-gender" data-gender="female">Female</button>
          </div>
      </div>
      <div class="cc-sep"></div>
      <div class="cc-row"><span>Skin</span><div id="skin-opts" style="display:flex"></div></div>
      <div class="cc-row"><span>Hair</span><div id="hair-opts" style="display:flex"></div></div>
      <div class="cc-row"><span>Shirt</span><div id="shirt-opts" style="display:flex"></div></div>
      <div class="cc-row"><span>Style</span><button id="btn-style" class="btn" style="background:#444; color:white; padding:5px 10px; border-radius:4px;">Change</button></div>
      <button class="btn btn--start" id="btn-start">Start Farming</button>
    `);

        this.setupUI();
    }

    /**
     * Setup creator UI elements
     */
    setupUI() {
        this.previewCanvas = document.getElementById('previewCanvas') as HTMLCanvasElement;
        if (this.previewCanvas) {
            this.previewCtx = this.previewCanvas.getContext('2d');
        }

        this.createSwatches('skin-opts', COLORS.skin, 'skinColor');
        this.createSwatches('hair-opts', COLORS.hair, 'hairColor');
        this.createSwatches('shirt-opts', COLORS.shirt, 'shirtColor');

        // Name Input
        const nameInput = document.getElementById('char-name') as HTMLInputElement;
        if (nameInput && this.player) {
            nameInput.value = this.player.name || 'Farmer';
            nameInput.oninput = (e) => {
                if (this.player) {
                    this.player.name = (e.target as HTMLInputElement).value.substring(0, 12);
                }
            };
        }

        // Gender Toggle
        const genderBtns = document.querySelectorAll('.btn-gender');
        genderBtns.forEach(btn => {
            const button = btn as HTMLElement;
            // Set initial state
            if (this.player && button.dataset.gender === this.player.gender) {
                button.classList.add('active');
                genderBtns.forEach(b => b !== button && b.classList.remove('active'));
            }

            button.onclick = () => {
                if (this.player) {
                    this.player.gender = button.dataset.gender as 'male' | 'female';
                    genderBtns.forEach(b => b.classList.remove('active'));
                    button.classList.add('active');
                    this.renderPreview();
                }
            };
        });

        const styleBtn = document.getElementById('btn-style');
        if (styleBtn && this.player) {
            styleBtn.onclick = () => {
                if (this.player) {
                    this.player.hairStyle = (this.player.hairStyle + 1) % 3;
                    this.renderPreview();
                }
            };
        }

        const startBtn = document.getElementById('btn-start');
        if (startBtn) {
            startBtn.onclick = (e) => {
                (e.target as HTMLElement).blur(); // Drop focus
                this.onStart();
            };
        }

        this.renderPreview();
    }

    /**
     * Create color swatch buttons
     */
    createSwatches(containerId: string, colors: string[], property: keyof Player) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'cc-swatch';
            swatch.style.backgroundColor = color;

            swatch.onclick = () => {
                if (this.player) {
                    (this.player as any)[property] = color;
                    this.renderPreview();
                }
            };

            container.appendChild(swatch);
        });
    }

    /**
     * Render character preview
     */
    renderPreview() {
        if (!this.previewCtx || !this.player) return;

        const ctx = this.previewCtx;
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(0, 0, 120, 120);

        ctx.save();
        ctx.translate(60, 60);
        ctx.scale(2.5, 2.5);

        this.drawCharacterPreview(ctx, 0, 0);

        ctx.restore();
    }

    /**
     * Draw character for preview (simplified version without game state)
     */
    drawCharacterPreview(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
        const p = this.player!;
        const x = cx - 10;
        const y = cy - 15;

        if (p.gender === 'female') {
            // === FEMALE AVATAR ===
            // Dress/Skirt
            ctx.fillStyle = p.shirtColor;
            ctx.beginPath();
            ctx.moveTo(x + 2, y + 20);
            ctx.lineTo(x + 18, y + 20);
            ctx.lineTo(x + 22, y + 31);
            ctx.lineTo(x - 2, y + 31);
            ctx.fill();

            // Legs
            ctx.fillStyle = p.skinColor;
            ctx.fillRect(x + 6, y + 30, 3, 4);
            ctx.fillRect(x + 11, y + 30, 3, 4);
        } else {
            // === MALE AVATAR ===
            // Legs (Pants)
            ctx.fillStyle = COLORS.pants;
            ctx.fillRect(x + 6, y + 18, 4, 12);
            ctx.fillRect(x + 11, y + 18, 4, 12);
        }

        // Body
        ctx.fillStyle = p.shirtColor;
        if (p.gender === 'female') {
            ctx.beginPath();
            ctx.moveTo(x + 4, y + 8);
            ctx.lineTo(x + 16, y + 8);
            ctx.lineTo(x + 18, y + 20);
            ctx.lineTo(x + 2, y + 20);
            ctx.fill();
        } else {
            ctx.fillRect(x + 2, y + 8, 16, 12);
        }

        // Arms
        ctx.fillStyle = p.skinColor;
        ctx.fillRect(x - 2, y + 8, 4, 10);
        ctx.fillRect(x + 18, y + 8, 4, 10);

        // Head
        ctx.fillStyle = p.skinColor;
        ctx.fillRect(x + 2, y - 6, 16, 14);

        // Eyes
        ctx.fillStyle = 'black';
        ctx.fillRect(x + 5, y - 2, 2, 2);
        ctx.fillRect(x + 13, y - 2, 2, 2);

        if (p.gender === 'female') {
            // Eyelashes
            ctx.fillStyle = 'black';
            ctx.fillRect(x + 4, y - 3, 1, 1);
            ctx.fillRect(x + 7, y - 3, 1, 1);
            ctx.fillRect(x + 12, y - 3, 1, 1);
            ctx.fillRect(x + 15, y - 3, 1, 1);

            // Blush
            ctx.fillStyle = 'rgba(255, 182, 193, 0.6)';
            ctx.fillRect(x + 3, y + 2, 3, 2);
            ctx.fillRect(x + 14, y + 2, 3, 2);
        }

        // Hair
        if (p.hairStyle !== 2) {
            ctx.fillStyle = p.hairColor;

            if (p.gender === 'female') {
                if (p.hairStyle === 0) {
                    ctx.fillRect(x + 1, y - 8, 18, 6);
                    ctx.fillRect(x, y - 4, 4, 12);
                    ctx.fillRect(x + 16, y - 4, 4, 12);
                } else if (p.hairStyle === 1) {
                    ctx.fillRect(x, y - 8, 20, 6);
                    ctx.fillRect(x - 2, y - 4, 5, 20);
                    ctx.fillRect(x + 17, y - 4, 5, 20);
                    ctx.fillRect(x + 4, y + 2, 12, 18);
                }
            } else {
                if (p.hairStyle === 0) {
                    ctx.fillRect(x + 1, y - 8, 18, 5);
                    ctx.fillRect(x, y - 6, 3, 8);
                    ctx.fillRect(x + 17, y - 6, 3, 8);
                } else if (p.hairStyle === 1) {
                    ctx.fillRect(x + 1, y - 7, 18, 4);
                    for (let i = 0; i < 5; i++) {
                        ctx.fillRect(x + 2 + i * 4, y - 11, 2, 4);
                    }
                }
            }
        }
    }
}

export default CreatorModal;
