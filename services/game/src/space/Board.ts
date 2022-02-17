import { DayPhases, Directions, ObjectOfUnknown, RowCol } from '@dungeonz/types';
import { Counter } from '@dungeonz/utils';
import Entity from '../entities/classes/Entity';
import Pickup from '../entities/classes/Pickup';
import Player from '../entities/classes/Player';
import BoardTile from './BoardTile';

const playerViewRange = Player.viewRange;
/**
 * Need this so that the loops in the functions that emit to players around the player view range go all the way to
 * the end of the bottom row and right column, otherwise the actual emit area will be the player view range - 1.
 * Precomputed value to avoid having to do `i <= playerViewRange`, or `i < playerViewRange + 1` every time.
 */
const playerViewRangePlusOne = playerViewRange + 1;
const idCounter = new Counter();
const entitiesString = 'entities';
const playersString = 'players';
const pickupsString = 'pickups';

interface BoardConfig {
    mapData: Array<any>;
    name: string;
    alwaysNight: boolean;
}

class Board {
    /**
     * A generic unique ID for this board.
     */
    id: number = idCounter.getNext();

    /**
     * The name of this board to use on the client from the loaded maps data.
     */
    name: string;

    /**
     * The spatial representation for the game world where all entities exist.
     */
    grid: Array<Array<BoardTile>> = [];

    /**
     * Keep a list of the positions that a player can spawn onto.
     * Can't just refer to the board tiles directly as they don't track their own row/col.
     */
    entranceTilePositions: Array<RowCol> = [];

    /**
     * What phase of the day it is. Each day is split up into phases, with each phase corresponding to a time of day (i.e. dusk).
     * Updated from World when the time changes.
     */
    dayPhase = 1;

    /**
     * Whether this board should always be night time, and will not observe changes in the world day phase.
     */
    alwaysNight: boolean;

    constructor(config: BoardConfig) {
        this.name = config.name;

        this.alwaysNight = config.alwaysNight || false;

        // If always night, then set time to night.
        if (this.alwaysNight === true) this.dayPhase = DayPhases.Night;
    }

    addEntity(entity: Entity) {
        const tile = this.grid[entity.row][entity.col];
        if (Object.prototype.hasOwnProperty.call(tile, entitiesString)) {
            tile.entities[entity.id] = entity;
        }
        else {
            tile.entities = {};

            tile.entities[entity.id] = entity;
        }
    }

    removeEntity(entity: Entity) {
        delete this.grid[entity.row][entity.col].entities[entity.id];
    }

    addPlayer(player: Player) {
        const tile = this.grid[player.row][player.col];
        if (Object.prototype.hasOwnProperty.call(tile, playersString)) {
            tile.players[player.id] = player;
        }
        else {
            tile.players = {};

            tile.players[player.id] = player;
        }
        // Players are also added to the destroyables list, in the constructor of Destroyable. // TODO: not true any more
    }

    removePlayer(player: Player) {
        delete this.grid[player.row][player.col].players[player.id];
        // Players are also removed from the destroyables list, in the onDestroy of Destroyable. // TODO: not true any more
    }

    addPickup(pickup: Pickup) {
        const tile = this.grid[pickup.row][pickup.col];
        if (Object.prototype.hasOwnProperty.call(tile, pickupsString)) {
            tile.pickups[pickup.id] = pickup;
        }
        else {
            tile.pickups = {};

            tile.pickups[pickup.id] = pickup;
        }
    }

    removePickup(pickup: Pickup) {
        delete this.grid[pickup.row][pickup.col].pickups[pickup.id];
    }

    /**
     * Get all of the dynamic entities that are within the player view range of the target position.
     * @returns Returns an array containing the entities found.
     */
    getNearbyDynamicsData(row: number, col: number) {
        const nearbyDynamics: Array<ObjectOfUnknown> = [];

        // How far around the target position to get data from.
        let rowOffset = -playerViewRange;
        let colOffset = -playerViewRange;
        let currentRow: Array<BoardTile>;
        let currentTile: BoardTile;
        let entities: { [name: string]: Entity };

        for (; rowOffset < playerViewRangePlusOne; rowOffset += 1) {
            for (colOffset = -playerViewRange; colOffset < playerViewRangePlusOne; colOffset += 1) {
                currentRow = this.grid[row + rowOffset];
                // Check for invalid array index access.
                // eslint-disable-next-line no-continue
                if (!currentRow) continue;
                currentTile = currentRow[col + colOffset];
                // eslint-disable-next-line no-continue
                if (!currentTile) continue;

                entities = currentTile.entities;

                // Get all of the entities on this board tile.
                Object.values(entities).forEach((entity) => {
                    // Add the relevant data of this entity to the data to return.
                    nearbyDynamics.push(
                        entity.getEmittableProperties({}),
                    );
                });
            }
        }

        return nearbyDynamics;
    }

    /**
     * Send an event name ID and optional data to all players around the target position.
     * @param row Target row on this board to emit to players around.
     * @param col Target column on this board to emit to players around.
     * @param eventName The name of the event to send.
     * @param data Any optional data to send with the event.
     * @param range A specific range to define "nearby" to be, otherwise uses the player view range + 1.
     */
    emitToNearbyPlayers(row: number, col: number, eventName: string, data?: any, range?: number) {
        let nearbyRange = Player.viewRange;
        let nearbyRangePlusOne = playerViewRangePlusOne;

        if (range !== undefined) {
            nearbyRange = range;
            nearbyRangePlusOne = range + 1;
        }

        const { grid } = this;

        let rowOffset = -nearbyRange;
        let colOffset = -nearbyRange;
        let targetRow;
        let targetCol;
        let players;

        for (; rowOffset < nearbyRangePlusOne; rowOffset += 1) {
            for (colOffset = -nearbyRange; colOffset < nearbyRangePlusOne; colOffset += 1) {
                targetRow = rowOffset + row;
                // Check the grid element being accessed is valid.
                // eslint-disable-next-line no-continue
                if (grid[targetRow] === undefined) continue;
                targetCol = colOffset + col;
                // eslint-disable-next-line no-continue
                if (grid[targetRow][targetCol] === undefined) continue;

                players = grid[targetRow][targetCol].players;

                this.emitToPlayers(players, eventName, data);
            }
        }
    }

    /**
     * Send an event name ID and optional data to all given players.
     * @param players The list of Player entities to send the event to.
     * @param eventName The name of the event to send.
     * @param data Any optional data to send with the event.
     */
    emitToPlayers(players: object, eventName: string, data?: any) {
        // Find all of the player entities on this board tile.
        Object.values(players).forEach((player) => {
            const { socket } = player;
            // Make sure this socket connection is in a ready state. Might have just closed or be closing.
            if (socket.readyState === 1) {
                socket.sendEvent(eventName, data);
            }
        });
    }

    /**
     * Sends an event name ID and optional data to all players at the edge of the view range in a direction.
     */
    emitToPlayersAtViewRange(
        row: number,
        col: number,
        direction: string,
        eventNameId: string,
        data?: any,
    ) {
        let currentRow;

        if (direction === Directions.LEFT) {
            // Go to the left column of the view range, then loop down that column from the top of the view range to the bottom.
            for (
                let rowOffset = -playerViewRange;
                rowOffset < playerViewRangePlusOne;
                rowOffset += 1
            ) {
                currentRow = this.grid[row + rowOffset];
                // Check for invalid array index access.
                // eslint-disable-next-line no-continue
                if (currentRow === undefined) continue;

                const tile = currentRow[col - playerViewRange];
                // eslint-disable-next-line no-continue
                if (!tile) continue;

                this.emitToPlayers(tile.players, eventNameId, data);
            }
        }
        else if (direction === Directions.RIGHT) {
            // Go to the right column of the view range, then loop down that column from the top of the view range to the bottom.
            for (
                let rowOffset = -playerViewRange;
                rowOffset < playerViewRangePlusOne;
                rowOffset += 1
            ) {
                currentRow = this.grid[row + rowOffset];
                // Check for invalid array index access.
                // eslint-disable-next-line no-continue
                if (currentRow === undefined) continue;

                const tile = currentRow[col + playerViewRange];
                // eslint-disable-next-line no-continue
                if (!tile) continue;

                this.emitToPlayers(tile.players, eventNameId, data);
            }
        }
        else if (direction === Directions.UP) {
            // Go to the top row of the view range, then loop along that row from the left of the view range to the right.
            for (
                let colOffset = -playerViewRange;
                colOffset < playerViewRangePlusOne;
                colOffset += 1
            ) {
                currentRow = this.grid[row - playerViewRange];
                // Check for invalid array index access.
                // eslint-disable-next-line no-continue
                if (currentRow === undefined) continue;

                const tile = currentRow[col + colOffset];
                // eslint-disable-next-line no-continue
                if (!tile) continue;

                this.emitToPlayers(tile.players, eventNameId, data);
            }
        }
        else {
            // Go to the bottom row of the view range, then loop along that row from the left of the view range to the right.
            for (
                let colOffset = -playerViewRange;
                colOffset < playerViewRangePlusOne;
                colOffset += 1
            ) {
                currentRow = this.grid[row + playerViewRange];
                // Check for invalid array index access.
                // eslint-disable-next-line no-continue
                if (currentRow === undefined) continue;

                const tile = currentRow[col + colOffset];
                // eslint-disable-next-line no-continue
                if (!tile) continue;

                this.emitToPlayers(tile.players, eventNameId, data);
            }
        }
    }

    /**
     * Gets the tile on this board at the given position.
     * Returns false if the position is invalid.
     */
    getTileAt(row: number, col: number) {
        // TODO: replace cases of ...board.grid[row][col] manaual tile validity checks with this method.
        if (this.grid[row] === undefined) return false;
        const tile = this.grid[row][col];
        // Check the grid col element (the tile itself) being accessed is valid.
        if (tile === undefined) return false;
        return tile;
    }
}

export default Board;
