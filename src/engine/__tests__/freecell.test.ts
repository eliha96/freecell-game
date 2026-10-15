import { describe, it, expect } from 'vitest';
import { generateMicrosoftDeal } from '../dealGenerator';
import {
  canPlaceOnTableau,
  canPlaceOnFoundation,
  maxCardsMovable,
  isSafeAutoMoveToFoundation,
} from '../rules';
import { createNewGame, executeMove, undoMove, redoMove } from '../gameManager';
import type { Card } from '../types';

describe('Microsoft FreeCell Deal Generator', () => {
  it('generates 52 cards across 8 columns for Deal #1', () => {
    const tableau = generateMicrosoftDeal(1);
    expect(tableau).toHaveLength(8);

    // First 4 columns have 7 cards, last 4 have 6 cards
    expect(tableau[0]).toHaveLength(7);
    expect(tableau[1]).toHaveLength(7);
    expect(tableau[2]).toHaveLength(7);
    expect(tableau[3]).toHaveLength(7);
    expect(tableau[4]).toHaveLength(6);
    expect(tableau[5]).toHaveLength(6);
    expect(tableau[6]).toHaveLength(6);
    expect(tableau[7]).toHaveLength(6);

    // Total cards = 52
    const totalCards = tableau.reduce((sum, col) => sum + col.length, 0);
    expect(totalCards).toBe(52);

    // All cards face up
    for (const col of tableau) {
      for (const card of col) {
        expect(card.isFaceUp).toBe(true);
      }
    }

    // Check first card dealt to each column in Deal 1:
    // Rosetta Code Deal #1 row 0: JD, 2D, 9H, JC, 5D, 7H, 7C, 5H
    expect(tableau[0][0].rank).toBe(11); // Jack
    expect(tableau[0][0].suit).toBe('diamonds');
    expect(tableau[1][0].rank).toBe(2);
    expect(tableau[1][0].suit).toBe('diamonds');
    expect(tableau[2][0].rank).toBe(9);
    expect(tableau[2][0].suit).toBe('hearts');
    expect(tableau[3][0].rank).toBe(11); // Jack
    expect(tableau[3][0].suit).toBe('clubs');
    expect(tableau[4][0].rank).toBe(5);
    expect(tableau[4][0].suit).toBe('diamonds');
    expect(tableau[5][0].rank).toBe(7);
    expect(tableau[5][0].suit).toBe('hearts');
    expect(tableau[6][0].rank).toBe(7);
    expect(tableau[6][0].suit).toBe('clubs');
    expect(tableau[7][0].rank).toBe(5);
    expect(tableau[7][0].suit).toBe('hearts');
  });

  it('generates Deal #617 correctly according to MS CRT spec', () => {
    // Deal #617 row 0: 7D, AD, 5C, 3S, 5S, 8C, 2D, AH
    const tableau = generateMicrosoftDeal(617);
    expect(tableau[0][0].rank).toBe(7);
    expect(tableau[0][0].suit).toBe('diamonds');
    expect(tableau[1][0].rank).toBe(1); // Ace
    expect(tableau[1][0].suit).toBe('diamonds');
    expect(tableau[2][0].rank).toBe(5);
    expect(tableau[2][0].suit).toBe('clubs');
    expect(tableau[3][0].rank).toBe(3);
    expect(tableau[3][0].suit).toBe('spades');
  });
});

describe('FreeCell Rules & Supermoves', () => {
  it('correctly calculates supermove limit M = (1 + N) * 2^K', () => {
    // 0 empty freecells, 0 empty cols => (1 + 0) * 2^0 = 1
    expect(maxCardsMovable(0, 0, false)).toBe(1);

    // 4 empty freecells, 0 empty cols => (1 + 4) * 2^0 = 5
    expect(maxCardsMovable(4, 0, false)).toBe(5);

    // 4 empty freecells, 1 empty col => (1 + 4) * 2^1 = 10
    expect(maxCardsMovable(4, 1, false)).toBe(10);

    // 4 empty freecells, 2 empty cols => (1 + 4) * 2^2 = 20
    expect(maxCardsMovable(4, 2, false)).toBe(20);

    // Moving to an empty column (effective empty cols = cols - 1):
    // 4 empty freecells, 1 empty col moving to empty col => (1 + 4) * 2^0 = 5
    expect(maxCardsMovable(4, 1, true)).toBe(5);

    // 4 empty freecells, 2 empty cols moving to empty col => (1 + 4) * 2^1 = 10
    expect(maxCardsMovable(4, 2, true)).toBe(10);
  });

  it('validates tableau placements (alternating color, descending rank)', () => {
    const blackKing: Card = { id: '1', suit: 'spades', rank: 13, color: 'black', isFaceUp: true };
    const redQueen: Card = { id: '2', suit: 'hearts', rank: 12, color: 'red', isFaceUp: true };
    const blackQueen: Card = { id: '3', suit: 'clubs', rank: 12, color: 'black', isFaceUp: true };

    // Red Queen on Black King -> legal
    expect(canPlaceOnTableau(blackKing, redQueen)).toBe(true);

    // Black Queen on Black King -> illegal (same color)
    expect(canPlaceOnTableau(blackKing, blackQueen)).toBe(false);

    // Any card on empty tableau column -> legal
    expect(canPlaceOnTableau(null, redQueen)).toBe(true);
    expect(canPlaceOnTableau(null, blackKing)).toBe(true);
  });

  it('validates foundation placements (Ace first, ascending same suit)', () => {
    const emptyPile: Card[] = [];
    const aceHearts: Card = { id: '1', suit: 'hearts', rank: 1, color: 'red', isFaceUp: true };
    const twoHearts: Card = { id: '2', suit: 'hearts', rank: 2, color: 'red', isFaceUp: true };
    const twoSpades: Card = { id: '3', suit: 'spades', rank: 2, color: 'black', isFaceUp: true };

    // Ace on empty foundation -> legal
    expect(canPlaceOnFoundation(emptyPile, aceHearts)).toBe(true);
    // Two on empty foundation -> illegal
    expect(canPlaceOnFoundation(emptyPile, twoHearts)).toBe(false);

    // Two of Hearts on Ace of Hearts -> legal
    expect(canPlaceOnFoundation([aceHearts], twoHearts)).toBe(true);
    // Two of Spades on Ace of Hearts -> illegal (different suit)
    expect(canPlaceOnFoundation([aceHearts], twoSpades)).toBe(false);
  });

  it('validates safe auto-moves to foundation', () => {
    const foundations: [Card[], Card[], Card[], Card[]] = [[], [], [], []];
    const aceClubs: Card = { id: '1', suit: 'clubs', rank: 1, color: 'black', isFaceUp: true };
    const twoClubs: Card = { id: '2', suit: 'clubs', rank: 2, color: 'black', isFaceUp: true };
    const threeClubs: Card = { id: '3', suit: 'clubs', rank: 3, color: 'black', isFaceUp: true };

    // Ace and Two are unconditionally safe
    expect(isSafeAutoMoveToFoundation(aceClubs, foundations)).toBe(true);
    expect(isSafeAutoMoveToFoundation(twoClubs, [[aceClubs], [], [], []])).toBe(true);

    // Three of Clubs requires both red foundations (hearts & diamonds) to be at least rank 2
    // If red foundations are empty, 3 of Clubs is NOT safe yet
    const foundationsWithoutReds: [Card[], Card[], Card[], Card[]] = [
      [aceClubs, twoClubs],
      [],
      [],
      [],
    ];
    expect(isSafeAutoMoveToFoundation(threeClubs, foundationsWithoutReds)).toBe(false);

    // If both red foundations have rank 2:
    const aceHearts: Card = { id: 'h1', suit: 'hearts', rank: 1, color: 'red', isFaceUp: true };
    const twoHearts: Card = { id: 'h2', suit: 'hearts', rank: 2, color: 'red', isFaceUp: true };
    const aceDiamonds: Card = { id: 'd1', suit: 'diamonds', rank: 1, color: 'red', isFaceUp: true };
    const twoDiamonds: Card = { id: 'd2', suit: 'diamonds', rank: 2, color: 'red', isFaceUp: true };

    const foundationsWithReds: [Card[], Card[], Card[], Card[]] = [
      [aceClubs, twoClubs],
      [aceHearts, twoHearts],
      [aceDiamonds, twoDiamonds],
      [],
    ];
    expect(isSafeAutoMoveToFoundation(threeClubs, foundationsWithReds)).toBe(true);
  });
});

describe('GameManager State and Undo/Redo', () => {
  it('creates a fresh game and tracks moves and undo/redo', () => {
    const game = createNewGame(1);
    expect(game.dealNumber).toBe(1);
    expect(game.movesCount).toBe(0);
    expect(game.freeCells.every((c) => c === null)).toBe(true);

    // Move the bottom card of column 0 to the first free cell
    const col0Card = game.tableau[0][game.tableau[0].length - 1];
    const afterFreeCellMove = executeMove(
      game,
      { pile: 'tableau', colIndex: 0, cardIndex: game.tableau[0].length - 1 },
      { type: 'freecell', index: 0 }
    );

    expect(afterFreeCellMove.freeCells[0]?.id).toBe(col0Card.id);
    expect(afterFreeCellMove.tableau[0]).toHaveLength(6);
    expect(afterFreeCellMove.movesCount).toBe(1);
    expect(afterFreeCellMove.history).toHaveLength(1);

    // Test Undo
    const afterUndo = undoMove(afterFreeCellMove);
    expect(afterUndo.freeCells[0]).toBeNull();
    expect(afterUndo.tableau[0]).toHaveLength(7);
    expect(afterUndo.movesCount).toBe(0);
    expect(afterUndo.redoStack).toHaveLength(1);

    // Test Redo
    const afterRedo = redoMove(afterUndo);
    expect(afterRedo.freeCells[0]?.id).toBe(col0Card.id);
    expect(afterRedo.tableau[0]).toHaveLength(6);
    expect(afterRedo.movesCount).toBe(1);
  });
});
