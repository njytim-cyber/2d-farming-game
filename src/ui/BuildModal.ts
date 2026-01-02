/**
 * Build Modal
 * Handles building placement UI for coops, barns, etc.
 */

import { BUILDING_TYPES, canPlaceBuilding, placeBuilding, canAffordBuilding, deductBuildingCost } from '../systems/Buildings';
import { TILE_SIZE, SEEDS } from '../game/constants';
import { getState } from '../game/state';
import { Inventory } from '../systems/Inventory';
import { saveGame } from '../systems/SaveManager';

interface BuildCallbacks {
    onClose: () => void;
    showToast: (message: string, color?: string) => void;
}

export class BuildModal {
    uiManager: any;
    gameCallbacks: BuildCallbacks;
    inventory: Inventory | null;
    selectedBuilding: string | null;
    isPlacingMode: boolean;
    previewX: number;
    previewY: number;
    canvas: HTMLCanvasElement;

    constructor(uiManager: any, gameCallbacks: BuildCallbacks, canvas: HTMLCanvasElement) {
        this.uiManager = uiManager;
        this.gameCallbacks = gameCallbacks;
        this.inventory = null;
        this.selectedBuilding = null;
        this.isPlacingMode = false;
        this.previewX = 0;
        this.previewY = 0;
        this.canvas = canvas;

        this.createModalHTML();
        this.setupEventListeners();
    }

    /**
     * Create the modal HTML if it doesn't exist
     */
    createModalHTML() {
        if (document.getElementById('build-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'build-modal';
        modal.className = 'modal-overlay';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-panel" style="max-width: 400px;">
                <h2 class="modal-title">🏗️ Build</h2>
                <div id="build-list" style="display: flex; flex-direction: column; gap: 10px;"></div>
                <button class="btn btn--close" style="margin-top: 15px;">×</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const closeBtn = document.querySelector('#build-modal .btn--close') as HTMLElement;
        if (closeBtn) {
            closeBtn.onclick = () => this.hide();
        }

        // Canvas click handler for placement
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMove(e));

        // ESC to cancel placement
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPlacingMode) {
                this.cancelPlacement();
            }
        });
    }

    show(inventory: Inventory) {
        this.inventory = inventory;
        const modal = document.getElementById('build-modal');
        if (modal) {
            modal.classList.add('modal-overlay--active');
            modal.style.display = 'flex';
            this.render();
        }
    }

    hide() {
        const modal = document.getElementById('build-modal');
        if (modal) {
            modal.classList.remove('modal-overlay--active');
            modal.style.display = 'none';
        }
        this.gameCallbacks.onClose();
    }

    /**
     * Render the building list
     */
    render() {
        const listContainer = document.getElementById('build-list');
        if (!listContainer || !this.inventory) return;

        listContainer.innerHTML = '';

        for (const [key, building] of Object.entries(BUILDING_TYPES)) {
            // Skip non-player buildings like SILO for now
            if (key === 'SILO') continue;

            const canAfford = canAffordBuilding(this.inventory, key);
            const costStr = Object.entries(building.cost)
                .map(([resource, amount]) => `${amount} ${resource}`)
                .join(', ');

            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 15px;
                background: ${canAfford ? building.color : '#666'};
                color: white;
                border: none;
                border-radius: 8px;
                cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                opacity: ${canAfford ? '1' : '0.6'};
            `;
            btn.innerHTML = `
                <span style="font-weight: bold;">${building.name}</span>
                <span style="font-size: 0.85em;">${building.size[0]}x${building.size[1]} • ${costStr}</span>
            `;

            if (canAfford) {
                btn.onclick = () => this.startPlacement(key);
            }

            listContainer.appendChild(btn);
        }
    }

    /**
     * Start placement mode for a building
     */
    startPlacement(buildingType: string) {
        this.selectedBuilding = buildingType;
        this.isPlacingMode = true;
        this.hide();
        this.gameCallbacks.showToast(`Click to place ${BUILDING_TYPES[buildingType].name} (ESC to cancel)`, '#90caf9');
    }

    /**
     * Cancel placement mode
     */
    cancelPlacement() {
        this.selectedBuilding = null;
        this.isPlacingMode = false;
        this.gameCallbacks.showToast('Placement cancelled', '#ffa726');
    }

    /**
     * Handle canvas mouse move for preview
     */
    handleCanvasMove(e: MouseEvent) {
        if (!this.isPlacingMode) return;

        const state = getState();
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // Convert to world coordinates
        const worldX = screenX / state.zoom + state.camera.x;
        const worldY = screenY / state.zoom + state.camera.y;

        this.previewX = Math.floor(worldX / TILE_SIZE);
        this.previewY = Math.floor(worldY / TILE_SIZE);
    }

    /**
     * Handle canvas click for placement
     */
    handleCanvasClick(e: MouseEvent) {
        if (!this.isPlacingMode || !this.selectedBuilding || !this.inventory) return;

        const state = getState();
        if (state.currentMap !== 'overworld') {
            this.gameCallbacks.showToast('Can only build in overworld!', '#ef5350');
            return;
        }

        const building = BUILDING_TYPES[this.selectedBuilding];
        if (!building) return;

        // Get click position
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        const worldX = screenX / state.zoom + state.camera.x;
        const worldY = screenY / state.zoom + state.camera.y;

        const gridX = Math.floor(worldX / TILE_SIZE);
        const gridY = Math.floor(worldY / TILE_SIZE);

        // Check if can place
        if (!canPlaceBuilding(state.map, gridX, gridY, building.size, state.crops, SEEDS)) {
            this.gameCallbacks.showToast('Cannot place here!', '#ef5350');
            return;
        }

        // Check if can still afford
        if (!canAffordBuilding(this.inventory, this.selectedBuilding)) {
            this.gameCallbacks.showToast('Not enough resources!', '#ef5350');
            this.cancelPlacement();
            return;
        }

        // Deduct cost and place
        deductBuildingCost(this.inventory, this.selectedBuilding);
        const placed = placeBuilding(state, this.selectedBuilding, gridX, gridY);

        if (placed) {
            this.gameCallbacks.showToast(`Built ${building.name}!`, '#4caf50');
            saveGame();
        }

        // Exit placement mode
        this.selectedBuilding = null;
        this.isPlacingMode = false;
    }

    /**
     * Draw placement preview (call from game draw loop)
     */
    drawPreview(ctx: CanvasRenderingContext2D) {
        if (!this.isPlacingMode || !this.selectedBuilding) return;

        const state = getState();
        const building = BUILDING_TYPES[this.selectedBuilding];
        if (!building) return;

        const [width, height] = building.size;
        const canPlace = canPlaceBuilding(state.map, this.previewX, this.previewY, building.size, state.crops, SEEDS);

        // Convert to screen coordinates
        const screenX = (this.previewX * TILE_SIZE - state.camera.x) * state.zoom;
        const screenY = (this.previewY * TILE_SIZE - state.camera.y) * state.zoom;
        const screenW = width * TILE_SIZE * state.zoom;
        const screenH = height * TILE_SIZE * state.zoom;

        // Draw preview rectangle
        ctx.fillStyle = canPlace ? 'rgba(76, 175, 80, 0.4)' : 'rgba(244, 67, 54, 0.4)';
        ctx.fillRect(screenX, screenY, screenW, screenH);

        ctx.strokeStyle = canPlace ? '#4caf50' : '#f44336';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, screenY, screenW, screenH);

        // Draw size label
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${building.name} (${width}x${height})`, screenX + screenW / 2, screenY - 10);
    }
}

export default BuildModal;
