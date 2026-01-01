/**
 * Input Manager
 * Handles keyboard, mouse, and touch input
 */

import { MAP_WIDTH, MAP_HEIGHT } from '../game/constants.js';

export class InputManager {
    constructor() {
        this.callbacks = {
            move: [],
            action: [],
            click: [],
            zoom: []
        };

        this.enabled = false;
        this.boundHandlers = {};

        // Track held keys for continuous movement
        this.heldKeys = new Set();
        this.moveDirection = { x: 0, y: 0 };
        this.moveInterval = null;
    }

    /**
     * Enable input handling
     */
    enable() {
        if (this.enabled) return;
        this.enabled = true;

        this.boundHandlers.keydown = this.handleKeydown.bind(this);
        this.boundHandlers.keyup = this.handleKeyup.bind(this);
        this.boundHandlers.wheel = this.handleWheel.bind(this);

        window.addEventListener('keydown', this.boundHandlers.keydown);
        window.addEventListener('keyup', this.boundHandlers.keyup);
        window.addEventListener('wheel', this.boundHandlers.wheel, { passive: true });
    }

    /**
     * Disable input handling
     */
    disable() {
        if (!this.enabled) return;
        this.enabled = false;

        window.removeEventListener('keydown', this.boundHandlers.keydown);
        window.removeEventListener('keyup', this.boundHandlers.keyup);
        window.removeEventListener('wheel', this.boundHandlers.wheel);
        this.heldKeys.clear();
        this.stopMoveInterval();
    }

    /**
     * Register move callback
     * @param {Function} callback - (dx, dy) => void
     */
    onMove(callback) {
        this.callbacks.move.push(callback);
        return () => this.removeCallback('move', callback);
    }

    /**
     * Register action callback (interact)
     * @param {Function} callback - () => void
     */
    onAction(callback) {
        this.callbacks.action.push(callback);
        return () => this.removeCallback('action', callback);
    }

    /**
     * Register click callback
     * @param {Function} callback - (tileX, tileY) => void
     */
    onClick(callback) {
        this.callbacks.click.push(callback);
        return () => this.removeCallback('click', callback);
    }

    /**
     * Register zoom callback
     * @param {Function} callback - (delta) => void
     */
    onZoom(callback) {
        this.callbacks.zoom.push(callback);
        return () => this.removeCallback('zoom', callback);
    }

    /**
     * Remove a callback
     */
    removeCallback(type, callback) {
        const idx = this.callbacks[type].indexOf(callback);
        if (idx > -1) {
            this.callbacks[type].splice(idx, 1);
        }
    }

    /**
     * Handle keyboard input
     */
    handleKeydown(e) {
        const key = e.key.toLowerCase();

        // Track held movement keys
        if (key === 'w' || e.key === 'ArrowUp') {
            this.heldKeys.add('up');
            this.updateMoveDirection();
            return;
        }
        if (key === 's' || e.key === 'ArrowDown') {
            this.heldKeys.add('down');
            this.updateMoveDirection();
            return;
        }
        if (key === 'a' || e.key === 'ArrowLeft') {
            this.heldKeys.add('left');
            this.updateMoveDirection();
            return;
        }
        if (key === 'd' || e.key === 'ArrowRight') {
            this.heldKeys.add('right');
            this.updateMoveDirection();
            return;
        }

        // Action
        if ([' ', 'enter', 'e'].includes(key)) {
            // Prevent default scrolling for space
            if (key === ' ') e.preventDefault();
            this.callbacks.action.forEach(cb => cb());
        }
    }

    /**
     * Handle key release
     */
    handleKeyup(e) {
        const key = e.key.toLowerCase();

        if (key === 'w' || e.key === 'ArrowUp') this.heldKeys.delete('up');
        else if (key === 's' || e.key === 'ArrowDown') this.heldKeys.delete('down');
        else if (key === 'a' || e.key === 'ArrowLeft') this.heldKeys.delete('left');
        else if (key === 'd' || e.key === 'ArrowRight') this.heldKeys.delete('right');

        this.updateMoveDirection();
    }

    /**
     * Update move direction based on held keys
     */
    updateMoveDirection() {
        let dx = 0, dy = 0;
        if (this.heldKeys.has('up')) dy -= 1;
        if (this.heldKeys.has('down')) dy += 1;
        if (this.heldKeys.has('left')) dx -= 1;
        if (this.heldKeys.has('right')) dx += 1;
        this.moveDirection = { x: dx, y: dy };
    }

    /**
     * Emit move event with current direction
     */
    emitMove() {
        const { x, y } = this.moveDirection;
        if (x !== 0 || y !== 0) {
            this.callbacks.move.forEach(cb => cb(x, y));
        }
    }

    /**
     * Start continuous movement interval - REMOVED for smoothness
     */
    startMoveInterval() {
        // Handled by game loop polling
    }

    /**
     * Stop continuous movement interval - REMOVED for smoothness
     */
    stopMoveInterval() {
        // Handled by game loop polling
    }

    /**
     * Handle mouse wheel (zoom)
     */
    handleWheel(e) {
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.callbacks.zoom.forEach(cb => cb(delta));
    }

    /**
     * Setup canvas pointer events
     * @param {HTMLCanvasElement} canvas 
     * @param {Function} screenToTileFn - (screenX, screenY) => {x, y}
     */
    setupCanvasInput(canvas, screenToTileFn) {
        canvas.addEventListener('pointerdown', (e) => {
            if (!this.enabled) return;

            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;

            const tile = screenToTileFn(screenX, screenY);

            if (tile.x >= 0 && tile.x < MAP_WIDTH && tile.y >= 0 && tile.y < MAP_HEIGHT) {
                this.callbacks.click.forEach(cb => cb(tile.x, tile.y));
            }
        });
    }

    /**
     * Setup FAB button
     * @param {HTMLElement} button 
     */
    setupActionButton(button) {
        button.addEventListener('pointerdown', (e) => {
            if (!this.enabled) return;

            e.preventDefault();
            this.callbacks.action.forEach(cb => cb());

            // Visual feedback
            button.style.transform = 'scale(0.9)';
            setTimeout(() => button.style.transform = 'scale(1)', 100);
        });
    }

    /**
     * Setup zoom buttons
     * @param {HTMLElement} plusBtn 
     * @param {HTMLElement} minusBtn 
     */
    setupZoomButtons(plusBtn, minusBtn) {
        plusBtn.addEventListener('click', () => {
            this.callbacks.zoom.forEach(cb => cb(0.1));
        });

        minusBtn.addEventListener('click', () => {
            this.callbacks.zoom.forEach(cb => cb(-0.1));
        });
    }
}

export default InputManager;
