export type Player = 0 | 1;

export type Landing =
  | { type: "house"; player: Player; index: number }
  | { type: "store"; player: Player };

export type GameState = {
  houses: [number[], number[]];
  stores: [number, number];
  currentPlayer: Player;
  status: "playing" | "finished";
  message: string;
  moveNumber: number;
  lastMove: {
    player: Player;
    pitIndex: number;
    landedAt: Landing;
  } | null;
};

const HOUSE_COUNT = 7;
const SEEDS_PER_HOUSE = 7;
const LOOP_LENGTH = HOUSE_COUNT * 2 + 1;

export function newGame(): GameState {
  return {
    houses: [
      Array<number>(HOUSE_COUNT).fill(SEEDS_PER_HOUSE),
      Array<number>(HOUSE_COUNT).fill(SEEDS_PER_HOUSE),
    ],
    stores: [0, 0],
    currentPlayer: 0,
    status: "playing",
    message: "Player 1 starts. Choose a house on your side.",
    moveNumber: 0,
    lastMove: null,
  };
}

/**
 * Sows seeds around the board, skipping the other player's store.
 * House indices follow each player's sowing direction. The two rows are
 * visually mirrored, so opposite houses have indices 6 - index.
 */
export function playMove(
  state: GameState,
  player: Player,
  pitIndex: number,
): GameState {
  if (state.status !== "playing") {
    throw new Error("This Congkak game has finished.");
  }
  if (player !== state.currentPlayer) {
    throw new Error("It is not this player's turn.");
  }
  if (!Number.isInteger(pitIndex) || pitIndex < 0 || pitIndex >= HOUSE_COUNT) {
    throw new RangeError("Choose a house from 1 to 7.");
  }

  const houses: [number[], number[]] = [
    [...state.houses[0]],
    [...state.houses[1]],
  ];
  const stores: [number, number] = [...state.stores];
  const seeds = houses[player][pitIndex];

  if (seeds === 0) return state;

  houses[player][pitIndex] = 0;

  let position = pitIndex;
  let remainingSeeds = seeds;
  let capturedSeeds = 0;
  let lastLanding: Landing | null = null;

  while (true) {
    while (position < LOOP_LENGTH) {
      const nextPosition = (position + 1) % LOOP_LENGTH;

      if (nextPosition <= HOUSE_COUNT - 1) {
        houses[player][nextPosition] += 1;
        lastLanding = {
          type: "house",
          player,
          index: nextPosition,
        };
      } else if (nextPosition === HOUSE_COUNT) {
        stores[player] += 1;
        lastLanding = { type: "store", player };
      } else {
        const opponent = otherPlayer(player);
        const opponentIndex = nextPosition - (HOUSE_COUNT + 1);
        houses[opponent][opponentIndex] += 1;
        lastLanding = {
          type: "house",
          player: opponent,
          index: opponentIndex,
        };
      }

      position = nextPosition;

      // The opponent's store is omitted from the sowing loop. A store is
      // therefore only reachable when it belongs to the player sowing.
      if (--remainingSeeds === 0) break;
    }

    if (!lastLanding) {
      throw new Error("The move did not land on a board space.");
    }

    if (lastLanding.type === "store") {
      break;
    }

    const landingSeeds =
      houses[lastLanding.player][lastLanding.index];

    if (landingSeeds > 1) {
      remainingSeeds = landingSeeds;
      houses[lastLanding.player][lastLanding.index] = 0;

      // Relay sowing starts after the occupied house where the last seed fell.
      // If the relay passes to the opponent's row, translate the board
      // position into the active player's loop coordinates.
      position =
        lastLanding.player === player
          ? lastLanding.index
          : HOUSE_COUNT + 1 + lastLanding.index;
      continue;
    }

    if (lastLanding.player === player) {
      const oppositeIndex = HOUSE_COUNT - 1 - lastLanding.index;
      const captured = houses[otherPlayer(player)][oppositeIndex];
      houses[player][lastLanding.index] = 0;
      houses[otherPlayer(player)][oppositeIndex] = 0;
      stores[player] += captured + 1;
      capturedSeeds = captured + 1;
    }
    break;
  }

  const landedAt = lastLanding;
  const extraTurn = landedAt.type === "store";
  let nextPlayer: Player = extraTurn ? player : otherPlayer(player);
  let status: GameState["status"] = "playing";
  let message = extraTurn
    ? `Player ${player + 1}'s last seed landed in their store. Play again.`
    : `Player ${nextPlayer + 1}'s turn.`;

  if (capturedSeeds > 0 && !extraTurn) {
    message = `Player ${player + 1} captured ${capturedSeeds} seed${capturedSeeds === 1 ? "" : "s"}. Player ${nextPlayer + 1}'s turn.`;
  }

  const emptySide = houses.findIndex((side) => side.every((count) => count === 0));
  if (emptySide !== -1) {
    const remainingPlayer = otherPlayer(emptySide as Player);
    const sweep = houses[remainingPlayer].reduce(
      (total, count) => total + count,
      0,
    );
    stores[remainingPlayer] += sweep;
    houses[remainingPlayer].fill(0);
    status = "finished";
    nextPlayer = player;

    const winner =
      stores[0] === stores[1]
        ? "It's a tie"
        : `Player ${stores[0] > stores[1] ? 1 : 2} wins`;
    message = `${winner}. Final score: ${stores[0]}–${stores[1]}.`;
  }

  return {
    houses,
    stores,
    currentPlayer: nextPlayer,
    status,
    message,
    moveNumber: state.moveNumber + 1,
    lastMove: { player, pitIndex, landedAt },
  };
}

function otherPlayer(player: Player): Player {
  return player === 0 ? 1 : 0;
}