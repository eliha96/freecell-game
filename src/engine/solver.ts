import type { Card, GameState } from './types';
import {
  canPlaceOnFoundation,
  canPlaceOnFreeCell,
  canPlaceOnTableau,
  isValidTableauSequence,
  maxCardsMovable,
} from './rules';

export interface MoveDestination {
  type: 'foundation' | 'tableau' | 'freecell';
  index: number; // foundationIndex (0-3), colIndex (0-7), or cellIndex (0-3)
}

/**
 * Counts empty free cells.
 */
export function getEmptyFreeCellCount(freeCells: (Card | null)[]): number {
  return freeCells.filter((c) => c === null).length;
}

/**
 * Counts empty tableau columns.
 */
export function getEmptyTableauColumnCount(tableau: Card[][]): number {
  return tableau.filter((col) => col.length === 0).length;
}

/**
 * Finds the smartest destination for a tapped card or sequence (Tap-to-Move).
 */
export function findBestMoveForTappedCard(
  gameState: GameState,
  card: Card,
  source: {
    pile: 'tableau' | 'freecell' | 'foundation';
    colIndex?: number;
    cardIndex?: number;
    cellIndex?: number;
    foundationIndex?: number;
  }
): MoveDestination | null {
  const emptyCells = getEmptyFreeCellCount(gameState.freeCells);
  const emptyCols = getEmptyTableauColumnCount(gameState.tableau);

  // Case A: Moving from Foundation back down to Tableau
  if (source.pile === 'foundation') {
    // 1. Try non-empty tableau columns
    for (let c = 0; c < 8; c++) {
      const col = gameState.tableau[c];
      if (col.length > 0) {
        const topCard = col[col.length - 1];
        if (canPlaceOnTableau(topCard, card)) {
          return { type: 'tableau', index: c };
        }
      }
    }
    // 2. Try empty tableau columns
    for (let c = 0; c < 8; c++) {
      if (gameState.tableau[c].length === 0) {
        return { type: 'tableau', index: c };
      }
    }
    return null;
  }

  // Case B: Single card from FreeCell
  if (source.pile === 'freecell') {
    // Priority 1: Move to Foundation
    for (let f = 0; f < 4; f++) {
      if (canPlaceOnFoundation(gameState.foundations[f], card)) {
        return { type: 'foundation', index: f };
      }
    }

    // Priority 2: Move to non-empty Tableau column
    for (let c = 0; c < 8; c++) {
      const col = gameState.tableau[c];
      if (col.length > 0) {
        const topCard = col[col.length - 1];
        if (canPlaceOnTableau(topCard, card)) {
          return { type: 'tableau', index: c };
        }
      }
    }

    // Priority 3: Move to empty Tableau column
    for (let c = 0; c < 8; c++) {
      if (gameState.tableau[c].length === 0) {
        return { type: 'tableau', index: c };
      }
    }
    return null;
  }

  // Case C: From Tableau (could be single bottom card, or a sequence)
  if (source.pile === 'tableau' && source.colIndex !== undefined && source.cardIndex !== undefined) {
    const col = gameState.tableau[source.colIndex];
    const isSingleBottomCard = source.cardIndex === col.length - 1;
    const movingCards = col.slice(source.cardIndex);

    // If it's a sequence of > 1 card, must verify sequence validity and supermove limits
    if (!isSingleBottomCard) {
      if (!isValidTableauSequence(movingCards)) {
        return null; // Not a valid sequence
      }

      // Check non-empty tableau destination
      const maxNormal = maxCardsMovable(emptyCells, emptyCols, false);
      if (movingCards.length <= maxNormal) {
        for (let c = 0; c < 8; c++) {
          if (c === source.colIndex) continue;
          const targetCol = gameState.tableau[c];
          if (targetCol.length > 0) {
            const targetTop = targetCol[targetCol.length - 1];
            if (canPlaceOnTableau(targetTop, movingCards[0])) {
              return { type: 'tableau', index: c };
            }
          }
        }
      }

      // Check empty tableau destination (only if not already sitting at bottom of an otherwise empty column)
      if (source.cardIndex > 0) {
        const maxToEmpty = maxCardsMovable(emptyCells, emptyCols, true);
        if (movingCards.length <= maxToEmpty) {
          for (let c = 0; c < 8; c++) {
            if (c === source.colIndex) continue;
            if (gameState.tableau[c].length === 0) {
              return { type: 'tableau', index: c };
            }
          }
        }
      }

      return null;
    }

    // It is a single card (the bottom exposed card of a tableau column)
    // Priority 1: Move to Foundation
    for (let f = 0; f < 4; f++) {
      if (canPlaceOnFoundation(gameState.foundations[f], card)) {
        return { type: 'foundation', index: f };
      }
    }

    // Priority 2: Move to non-empty Tableau column
    for (let c = 0; c < 8; c++) {
      if (c === source.colIndex) continue;
      const targetCol = gameState.tableau[c];
      if (targetCol.length > 0) {
        const targetTop = targetCol[targetCol.length - 1];
        if (canPlaceOnTableau(targetTop, card)) {
          return { type: 'tableau', index: c };
        }
      }
    }

    // Priority 3: Move to empty Free Cell
    const firstEmptyCell = gameState.freeCells.findIndex((c) => canPlaceOnFreeCell(c));
    if (firstEmptyCell !== -1) {
      return { type: 'freecell', index: firstEmptyCell };
    }

    // Priority 4: Move to empty Tableau column (only if there are cards above it)
    if (source.cardIndex > 0) {
      for (let c = 0; c < 8; c++) {
        if (c === source.colIndex) continue;
        if (gameState.tableau[c].length === 0) {
          return { type: 'tableau', index: c };
        }
      }
    }
  }

  return null;
}
