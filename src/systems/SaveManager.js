/**
 * Save Manager
 * Handles game save/load with localStorage
 */

import { SAVE_KEY, AUTO_SAVE_INTERVAL } from '../game/constants.js';
import { getState, replaceState, createInitialState } from '../game/state.js';

let autoSaveInterval = null;
let onSaveCallback = null;

/**
 * Check if a save exists
 * @returns {boolean}
 */
export function hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
}

/**
 * Save the current game state
 */
export function saveGame() {
    const state = getState();

    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));

        if (onSaveCallback) {
            onSaveCallback();
        }

        return true;
    } catch (error) {
        console.error('Failed to save game:', error);
        return false;
    }
}

/**
 * Load game from save
 * @returns {boolean} Whether load was successful
 */
export function loadGame() {
    try {
        const data = localStorage.getItem(SAVE_KEY);

        if (!data) {
            return false;
        }

        const loaded = JSON.parse(data);
        const currentState = getState();

        // Merge with current state to handle missing properties
        const mergedState = { ...currentState, ...loaded };

        // Ensure required properties exist
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
 * @param {Function} callback 
 */
export function onSave(callback) {
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
