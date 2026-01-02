import {
    SEEDS,
    TILES,
    INTERIOR_TILES
} from '../game/constants';
import { getState, setState, GameState } from '../game/state';
import { isSolid } from './MapGenerator';
import { Game } from '../game/Game';

export class NavigationSystem {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * Process pathfinding to destination
     */
    processPathfinding(state: GameState) {
        if (!this.game.player || !state.destination) return;
        const dest = state.destination;
        const dx = dest.x - this.game.player.gridX;
        const dy = dest.y - this.game.player.gridY;

        if (dx === 0 && dy === 0) {
            setState({ destination: null });
            return;
        }

        const sx = Math.sign(dx);
        const sy = Math.sign(dy);

        const tryMove = (ax: number, ay: number) => {
            if (!this.game.player) return false;
            if (!isSolid(state.map, this.game.player.gridX + ax, this.game.player.gridY + ay, state.crops, SEEDS)) {
                this.game.player.gridX += ax;
                this.game.player.gridY += ay;
                this.game.player.facing = { x: ax || 0, y: ay || 0 };
                this.game.player.isMoving = true;
                return true;
            }
            return false;
        };

        let moved = false;
        if (Math.abs(dx) >= Math.abs(dy)) {
            if (sx !== 0) moved = tryMove(sx, 0) || (sy !== 0 && tryMove(0, sy));
        } else {
            if (sy !== 0) moved = tryMove(0, sy) || (sx !== 0 && tryMove(sx, 0));
        }

        if (!moved) {
            this.game.player.facing = {
                x: Math.abs(dx) >= Math.abs(dy) ? sx : 0,
                y: Math.abs(dy) > Math.abs(dx) ? sy : 0
            };
            setState({ destination: null });
        }
    }

    /**
     * Attempt to move player
     */
    attemptMove(dx: number, dy: number) {
        if (!this.game.player) return;
        const state = getState();
        if (state.screen !== 'GAME') return;

        // Buffer input if already moving
        if (this.game.player.isMoving) {
            this.game.bufferedMove = { dx, dy };
            return;
        }

        // Clear any click-to-move destination when using keyboard
        setState({ destination: null });

        this.game.player.facing = { x: dx, y: dy };
        const newX = this.game.player.gridX + dx;
        const newY = this.game.player.gridY + dy;

        // Get current map and check bounds/solidity
        const currentMap = this.game.getCurrentMap(state);
        const mapHeight = currentMap.length;
        const mapWidth = currentMap[0]?.length || 0;

        if (newX >= 0 && newX < mapWidth && newY >= 0 && newY < mapHeight) {
            const tile = currentMap[newY][newX];

            // Auto-enter buildings when walking into them from correct direction
            // House/Shop: Enter from south (dy = -1 approaching from below)
            // Coop/Barn: Enter only from south (dy = -1)
            if (state.currentMap.startsWith('overworld')) {
                const isDoorApproach = dy === -1; // Moving up into door

                if (tile === TILES.SHOP || tile === TILES.HOUSE) {
                    if (isDoorApproach) {
                        this.game.interactionSystem.handleInteraction(newX, newY);
                        return;
                    }
                } else if (tile === TILES.OLD_HOUSE) {
                    if (isDoorApproach) {
                        this.game.interactionSystem.handleInteraction(newX, newY);
                        return;
                    }
                } else if (tile === TILES.COOP || tile === TILES.BARN) {
                    // Coop/Barn: Only enter from south (door is on bottom)
                    if (isDoorApproach) {
                        this.game.interactionSystem.handleInteraction(newX, newY);
                        return;
                    }
                } else if (tile === TILES.CAVE) {
                    // Cave can be entered from any direction
                    this.game.interactionSystem.handleInteraction(newX, newY);
                    return;
                }
            }

            if (!this.game.isTileSolid(state, newX, newY)) {
                this.game.player.gridX = newX;
                this.game.player.gridY = newY;
                this.game.player.isMoving = true;
            }
        } else {
            // Screen Transitions
            if (state.currentMap === 'overworld' && newY < 0) {
                this.game.transitionToMap('overworld_north', newX, mapHeight - 1);
            } else if (state.currentMap === 'overworld_north' && newY >= mapHeight) {
                this.game.transitionToMap('overworld', newX, 0);
            }
        }
    }

    /**
     * Check for triggers when player steps on a tile
     */
    checkStepTriggers() {
        if (!this.game.player) return;
        const state = getState();
        if (state.currentMap !== 'overworld') {
            const currentMap = this.game.getCurrentMap(state);
            const tile = currentMap[this.game.player.gridY][this.game.player.gridX];
            if (tile === INTERIOR_TILES.DOOR) {
                this.game.interactionSystem.exitHouse();
                return;
            }
        }
    }

    /**
     * Update navigation logic
     */
    update() {
        if (!this.game.player) return;
        const state = getState();

        // Check for step-on triggers if not moving (just arrived)
        if (!this.game.player.isMoving) {
            this.checkStepTriggers();

            // Poll for continuous smooth movement
            const { x, y } = this.game.inputManager.moveDirection;
            if (x !== 0 || y !== 0) {
                this.attemptMove(x, y);
            }
            else if (state.destination) {
                this.processPathfinding(state);
            }
        }
    }
}
