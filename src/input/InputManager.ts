/**
 * Input Manager
 * Handles keyboard, mouse, and touch input
 */

import { MAP_WIDTH, MAP_HEIGHT } from '../game/constants';

type MoveCallback = (dx: number, dy: number) => void;
type ActionCallback = () => void;
type ClickCallback = (tileX: number, tileY: number) => void;
type ZoomCallback = (delta: number) => void;

interface InputCallbacks {
    move: MoveCallback[];
    action: ActionCallback[];
    click: ClickCallback[];
    zoom: ZoomCallback[];
    profile: ActionCallback[];
}

export class InputManager {
    callbacks: InputCallbacks;
    enabled: boolean;
    boundHandlers: {
        keydown?: (e: KeyboardEvent) => void;
        keyup?: (e: KeyboardEvent) => void;
        wheel?: (e: WheelEvent) => void;
    };
    heldKeys: Set<string>;
    moveDirection: { x: number; y: number };
    moveInterval: number | null;

    constructor() {
        this.callbacks = {
            move: [],
            action: [],
            click: [],
            zoom: [],
            profile: []
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

        window.addEventListener('keydown', this.boundHandlers.keydown!);
        window.addEventListener('keyup', this.boundHandlers.keyup!);
        window.addEventListener('wheel', this.boundHandlers.wheel!, { passive: true });
    }

    /**
     * Disable input handling
     */
    disable() {
        if (!this.enabled) return;
        this.enabled = false;

        if (this.boundHandlers.keydown) window.removeEventListener('keydown', this.boundHandlers.keydown);
        if (this.boundHandlers.keyup) window.removeEventListener('keyup', this.boundHandlers.keyup);
        if (this.boundHandlers.wheel) window.removeEventListener('wheel', this.boundHandlers.wheel);
        this.heldKeys.clear();
        this.stopMoveInterval();

        // Clear bound handlers to avoid memory leaks if re-enabled
        this.boundHandlers = {};
    }

    /**
     * Register move callback
     * @param {Function} callback - (dx, dy) => void
     */
    onMove(callback: MoveCallback): () => void {
        this.callbacks.move.push(callback);
        return () => this.removeCallback('move', callback);
    }

    /**
     * Register action callback (interact)
     * @param {Function} callback - () => void
     */
    onAction(callback: ActionCallback): () => void {
        this.callbacks.action.push(callback);
        return () => this.removeCallback('action', callback);
    }

    /**
     * Register click callback
     * @param {Function} callback - (tileX, tileY) => void
     */
    onClick(callback: ClickCallback): () => void {
        this.callbacks.click.push(callback);
        return () => this.removeCallback('click', callback);
    }

    /**
     * Register zoom callback
     * @param {Function} callback - (delta) => void
     */
    onZoom(callback: ZoomCallback): () => void {
        this.callbacks.zoom.push(callback);
        return () => this.removeCallback('zoom', callback);
    }

    /**
     * Register profile callback
     */
    onProfile(callback: ActionCallback): () => void {
        this.callbacks.profile.push(callback);
        return () => this.removeCallback('profile', callback);
    }

    /**
     * Remove a callback
     */
    removeCallback(type: keyof InputCallbacks, callback: any) {
        const idx = this.callbacks[type].indexOf(callback);
        if (idx > -1) {
            this.callbacks[type].splice(idx, 1);
        }
    }

    /**
     * Handle keyboard input
     */
    handleKeydown(e: KeyboardEvent) {
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

        // Profile / Equipment
        if (['c', 'p', 'i'].includes(key)) {
            this.callbacks.profile.forEach(cb => cb());
        }
    }

    /**
     * Handle key release
     */
    handleKeyup(e: KeyboardEvent) {
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
    handleWheel(e: WheelEvent) {
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.callbacks.zoom.forEach(cb => cb(delta));
    }

    /**
     * Setup canvas pointer events
     */
    setupCanvasInput(canvas: HTMLCanvasElement, screenToTileFn: (screenX: number, screenY: number) => { x: number, y: number }) {
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
     */
    setupActionButton(button: HTMLElement) {
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
     */
    setupZoomButtons(plusBtn: HTMLElement, minusBtn: HTMLElement) {
        plusBtn.addEventListener('click', () => {
            this.callbacks.zoom.forEach(cb => cb(0.1));
        });

        minusBtn.addEventListener('click', () => {
            this.callbacks.zoom.forEach(cb => cb(-0.1));
        });
    }
}

export default InputManager;
