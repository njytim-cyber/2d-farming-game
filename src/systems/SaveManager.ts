/**
 * Save Manager
 * Handles game save/load with localStorage
 */

import { SAVE_KEY, AUTO_SAVE_INTERVAL } from '../game/constants';
import { getState, replaceState, createInitialState, GameState } from '../game/state';

let autoSaveInterval: any = null;
let onSaveCallback: (() => void) | null = null;

/**
 * Check if a save exists
 */
export function hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
}

/**
 * Save the current game state
 */
export function saveGame(): boolean {
    const state = getState();

    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));

        if (onSaveCallback) {
            onSaveCallback();
        }

        return true;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to save game:', error);
        return false;
    }
}

/**
 * Load game from save
 * @returns {boolean} Whether load was successful
 */
export function loadGame(): boolean {
    try {
        const data = localStorage.getItem(SAVE_KEY);

        if (!data) {
            return false;
        }

        const loaded = JSON.parse(data);
        const currentState = getState();

        // Merge with current state to handle missing properties
        const mergedState: GameState = { ...currentState, ...loaded };

        // Ensure required properties exist - basic validation
        if (!mergedState.player.facing) {
            mergedState.player.facing = { x: 0, y: 1 };
        }
        if (mergedState.zoom === undefined) {
            mergedState.zoom = 1.0;
        }
        if (mergedState.season === undefined) {
            mergedState.season = 0;
        }
        if (mergedState.energy === undefined) {
            mergedState.energy = 300;
            mergedState.maxEnergy = 300;
        }
        if (mergedState.dayLength === undefined) {
            mergedState.dayLength = 24000;
        }

        replaceState(mergedState);
        return true;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load game:', error);
        return false;
    }
}

/**
 * Delete save data
 */
export function deleteSave() {
    localStorage.removeItem(SAVE_KEY);
}

/**
 * Reset game and delete save
 */
export function resetGame() {
    deleteSave();
    replaceState(createInitialState());
}

/**
 * Start auto-save interval
 */
export function startAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }

    autoSaveInterval = setInterval(() => {
        const state = getState();
        if (state.screen === 'GAME') {
            saveGame();
        }
    }, AUTO_SAVE_INTERVAL);
}

/**
 * Stop auto-save interval
 */
export function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }
}

/**
 * Set callback for save events (for UI indicator)
 */
export function onSave(callback: () => void) {
    onSaveCallback = callback;
}

export default {
    hasSave,
    saveGame,
    loadGame,
    deleteSave,
    resetGame,
    startAutoSave,
    stopAutoSave,
    onSave
};
