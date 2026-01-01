/**
 * Farming Sim RPG - Entry Point
 */

import './styles/main.css';
import Game from './game/Game';
import { getState } from './game/state';

// Start game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();

    // Expose for testing/debugging
    (window as any).game = game;
    (window as any).getState = getState;
});
