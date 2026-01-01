/**
 * Farming Sim RPG - Entry Point
 */

import './styles/main.css';
import Game from './game/Game.js';
import { getState } from './game/state.js';

// Start game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();

    // Expose for testing/debugging
    window.game = game;
    window.getState = getState;
});
