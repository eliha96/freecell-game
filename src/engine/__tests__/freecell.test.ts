import { describe, it, expect } from 'vitest';
import { generateMicrosoftDeal } from '../dealGenerator';
import {
  canPlaceOnTableau,
  canPlaceOnFoundation,
  maxCardsMovable,
  isSafeAutoMoveToFoundation,
  getTableauSequenceStartIndex,
  isCardDimmedInTableau,
} from '../rules';
import { createNewGame, executeMove, undoMove, redoMove } from '../gameManager';
import { calculateFreeCellScore } from '../leaderboard';
import {
  getDealDifficulty,
  getRandomDealByDifficulty,
  DIFFICULTY_CONFIG,
} from '../difficulty';
import type { Card, DifficultyLevel } from '../types';

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

  it('initializes cardDimmingMode setting to sequences by default', () => {
    const game = createNewGame(1);
    expect(game.settings.cardDimmingMode).toBe('sequences');
  });

  it('calculates tableau sequence start index correctly', () => {
    const kSpades: Card = { id: 'k-s', suit: 'spades', rank: 13, color: 'black', isFaceUp: true };
    const nineHearts: Card = { id: '9-h', suit: 'hearts', rank: 9, color: 'red', isFaceUp: true };
    const eightSpades: Card = { id: '8-s', suit: 'spades', rank: 8, color: 'black', isFaceUp: true };
    const sevenDiamonds: Card = { id: '7-d', suit: 'diamonds', rank: 7, color: 'red', isFaceUp: true };

    // Column with broken order at index 0: [K♠, 9♥, 8♠, 7♦]
    // 7♦ -> 8♠ -> 9♥ form a valid sequence (len 3, start idx 1). K♠ does not connect to 9♥.
    const col: Card[] = [kSpades, nineHearts, eightSpades, sevenDiamonds];
    expect(getTableauSequenceStartIndex(col)).toBe(1);

    // Completely ordered column
    const orderedCol: Card[] = [nineHearts, eightSpades, sevenDiamonds];
    expect(getTableauSequenceStartIndex(orderedCol)).toBe(0);

    // Single card column
    expect(getTableauSequenceStartIndex([kSpades])).toBe(0);
  });

  it('evaluates isCardDimmedInTableau for all 3 dimming modes', () => {
    const kSpades: Card = { id: 'k-s', suit: 'spades', rank: 13, color: 'black', isFaceUp: true };
    const nineHearts: Card = { id: '9-h', suit: 'hearts', rank: 9, color: 'red', isFaceUp: true };
    const eightSpades: Card = { id: '8-s', suit: 'spades', rank: 8, color: 'black', isFaceUp: true };
    const sevenDiamonds: Card = { id: '7-d', suit: 'diamonds', rank: 7, color: 'red', isFaceUp: true };
    const col: Card[] = [kSpades, nineHearts, eightSpades, sevenDiamonds];

    // 1. Mode: 'none' -> never dimmed
    expect(isCardDimmedInTableau(col, 0, 'none', 0, 0)).toBe(false);
    expect(isCardDimmedInTableau(col, 1, 'none', 0, 0)).toBe(false);
    expect(isCardDimmedInTableau(col, 2, 'none', 0, 0)).toBe(false);
    expect(isCardDimmedInTableau(col, 3, 'none', 0, 0)).toBe(false);

    // 2. Mode: 'sequences' -> all cards in the valid sequence (indices 1..3) are bright, K♠ is dimmed
    expect(isCardDimmedInTableau(col, 0, 'sequences', 0, 0)).toBe(true);  // K♠ dimmed
    expect(isCardDimmedInTableau(col, 1, 'sequences', 0, 0)).toBe(false); // 9♥ bright
    expect(isCardDimmedInTableau(col, 2, 'sequences', 0, 0)).toBe(false); // 8♠ bright
    expect(isCardDimmedInTableau(col, 3, 'sequences', 0, 0)).toBe(false); // 7♦ bright

    // 3. Mode: 'movable'
    // With 0 empty freecells and 0 empty columns: maxMovable = 1.
    // Only index 3 (7♦) is bright; indices 0, 1, 2 are dimmed!
    expect(isCardDimmedInTableau(col, 0, 'movable', 0, 0)).toBe(true);  // K♠ dimmed
    expect(isCardDimmedInTableau(col, 1, 'movable', 0, 0)).toBe(true);  // 9♥ dimmed
    expect(isCardDimmedInTableau(col, 2, 'movable', 0, 0)).toBe(true);  // 8♠ dimmed
    expect(isCardDimmedInTableau(col, 3, 'movable', 0, 0)).toBe(false); // 7♦ bright (single card movable)

    // With 2 empty freecells and 0 empty columns: maxMovable = 3.
    // Can move 3 cards together! Indices 1, 2, 3 (9♥, 8♠, 7♦) light up bright!
    expect(isCardDimmedInTableau(col, 0, 'movable', 2, 0)).toBe(true);  // K♠ still dimmed (broken sequence)
    expect(isCardDimmedInTableau(col, 1, 'movable', 2, 0)).toBe(false); // 9♥ bright
    expect(isCardDimmedInTableau(col, 2, 'movable', 2, 0)).toBe(false); // 8♠ bright
    expect(isCardDimmedInTableau(col, 3, 'movable', 2, 0)).toBe(false); // 7♦ bright
  });
});

describe('FreeCell Difficulty Classification & Generation', () => {
  it('correctly classifies known classic deals', () => {
    // Famous Easy deals
    expect(getDealDifficulty(164)).toBe('easy');
    expect(getDealDifficulty(1941)).toBe('easy');
    expect(getDealDifficulty(7058)).toBe('easy');

    // Famous Hard / Unsolvable deals
    expect(getDealDifficulty(617)).toBe('hard');
    expect(getDealDifficulty(11982)).toBe('hard');
    expect(getDealDifficulty(169)).toBe('hard');

    // Deal #1 is medium
    expect(getDealDifficulty(1)).toBe('medium');
  });

  it('generates random deals strictly adhering to the requested difficulty level', () => {
    for (let i = 0; i < 5; i++) {
      const easyDeal = getRandomDealByDifficulty('easy');
      expect(easyDeal).toBeGreaterThanOrEqual(1);
      expect(easyDeal).toBeLessThanOrEqual(32000);
      expect(getDealDifficulty(easyDeal)).toBe('easy');

      const hardDeal = getRandomDealByDifficulty('hard');
      expect(hardDeal).toBeGreaterThanOrEqual(1);
      expect(hardDeal).toBeLessThanOrEqual(32000);
      expect(getDealDifficulty(hardDeal)).toBe('hard');

      const mediumDeal = getRandomDealByDifficulty('medium');
      expect(mediumDeal).toBeGreaterThanOrEqual(1);
      expect(mediumDeal).toBeLessThanOrEqual(32000);
      expect(getDealDifficulty(mediumDeal)).toBe('medium');
    }
  });

  it('initializes game state with the correct difficulty level', () => {
    const easyGame = createNewGame(164);
    expect(easyGame.dealNumber).toBe(164);
    expect(easyGame.difficulty).toBe('easy');

    const hardGame = createNewGame(617);
    expect(hardGame.dealNumber).toBe(617);
    expect(hardGame.difficulty).toBe('hard');

    const autoEasyGame = createNewGame(undefined, undefined, 'easy');
    expect(autoEasyGame.difficulty).toBe('easy');
  });

  it('contains full visual metadata for each difficulty in DIFFICULTY_CONFIG', () => {
    const levels: DifficultyLevel[] = ['easy', 'medium', 'hard'];
    for (const lvl of levels) {
      const config = DIFFICULTY_CONFIG[lvl];
      expect(config.label).toBeTruthy();
      expect(config.badge).toBeTruthy();
      expect(config.colorClass).toBeTruthy();
      expect(config.bgClass).toBeTruthy();
      expect(config.description).toBeTruthy();
    }
  });

  it('calculates live FreeCell score correctly', () => {
    // Initial start of game (0 elapsed seconds, 0 moves)
    expect(calculateFreeCellScore(0, 0)).toBe(10000);

    // After 100 seconds and 20 moves: 10000 - 100*10 - 20*15 = 8700
    expect(calculateFreeCellScore(100, 20)).toBe(8700);

    // Respects floor of 100 points
    expect(calculateFreeCellScore(5000, 500)).toBe(100);
  });

  it('allows restarting a deal with identical layout', () => {
    const game = createNewGame(11982);
    expect(game.dealNumber).toBe(11982);

    const restarted = createNewGame(game.dealNumber);
    expect(restarted.dealNumber).toBe(11982);
    expect(restarted.movesCount).toBe(0);
    expect(restarted.history).toHaveLength(0);
    expect(restarted.redoStack).toHaveLength(0);

    // Initial tableau cards should match card-by-card
    for (let c = 0; c < 8; c++) {
      expect(restarted.tableau[c].length).toBe(game.tableau[c].length);
      for (let r = 0; r < restarted.tableau[c].length; r++) {
        expect(restarted.tableau[c][r].id).toBe(game.tableau[c][r].id);
      }
    }
  });

  it('creates new games respecting difficulty preference', () => {
    for (let i = 0; i < 3; i++) {
      const easyGame = createNewGame(undefined, undefined, 'easy');
      expect(easyGame.difficulty).toBe('easy');

      const hardGame = createNewGame(undefined, undefined, 'hard');
      expect(hardGame.difficulty).toBe('hard');
    }
  });
});




