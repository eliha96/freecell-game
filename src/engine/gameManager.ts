import type { Card, GameSettings, GameState, MoveRecord } from './types';
import { generateMicrosoftDeal, getRandomDealNumber } from './dealGenerator';
import {
  canPlaceOnFoundation,
  canPlaceOnFreeCell,
  canPlaceOnTableau,
  isGameWon,
  isSafeAutoMoveToFoundation,
  isValidTableauSequence,
  maxCardsMovable,
} from './rules';
import type { MoveDestination } from './solver';
import { getEmptyFreeCellCount, getEmptyTableauColumnCount } from './solver';

const STORAGE_KEY = 'freecell_classic_saved_game_v1';
const SETTINGS_KEY = 'freecell_classic_settings_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  cardBack: 'classic-blue',
  cardFaceTheme: 'windows95',
  autoPlaySafeCards: true,
  autoCompletePrompt: true,
};

export function loadSavedSettings(): GameSettings {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.cardFaceTheme !== 'windows95' && parsed.cardFaceTheme !== 'standard') {
          parsed.cardFaceTheme = 'windows95';
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: GameSettings) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

function snapshotPiles(state: GameState): MoveRecord['previousState'] {
  return {
    freeCells: state.freeCells.map((c) => (c ? { ...c } : null)),
    foundations: state.foundations.map((f) => f.map((c) => ({ ...c }))),
    tableau: state.tableau.map((col) => col.map((c) => ({ ...c }))),
    movesCount: state.movesCount,
  };
}

export function createNewGame(
  dealNumber?: number,
  customSettings?: Partial<GameSettings>
): GameState {
  const chosenDealNumber = dealNumber ?? getRandomDealNumber();
  const settings: GameSettings = {
    ...DEFAULT_SETTINGS,
    ...loadSavedSettings(),
    ...(customSettings || {}),
  };

  const initialTableau = generateMicrosoftDeal(chosenDealNumber);

  const gameState: GameState = {
    dealNumber: chosenDealNumber,
    freeCells: [null, null, null, null],
    foundations: [[], [], [], []],
    tableau: initialTableau,
    movesCount: 0,
    startTime: null,
    elapsedSeconds: 0,
    isWon: false,
    isAutoCompleting: false,
    settings,
    history: [],
    redoStack: [],
  };

  saveGameStateToStorage(gameState);
  return gameState;
}

export function executeMove(
  state: GameState,
  source: {
    pile: 'tableau' | 'freecell' | 'foundation';
    colIndex?: number;
    cardIndex?: number;
    cellIndex?: number;
    foundationIndex?: number;
  },
  destination: MoveDestination
): GameState {
  if (state.isWon) return state;

  const now = Date.now();
  const startTime = state.startTime ?? now;
  const snapshot = snapshotPiles(state);

  const newFreeCells: [Card | null, Card | null, Card | null, Card | null] = [
    state.freeCells[0],
    state.freeCells[1],
    state.freeCells[2],
    state.freeCells[3],
  ];

  const newFoundations: [Card[], Card[], Card[], Card[]] = [
    [...state.foundations[0]],
    [...state.foundations[1]],
    [...state.foundations[2]],
    [...state.foundations[3]],
  ];

  const newTableau: [Card[], Card[], Card[], Card[], Card[], Card[], Card[], Card[]] = [
    [...state.tableau[0]],
    [...state.tableau[1]],
    [...state.tableau[2]],
    [...state.tableau[3]],
    [...state.tableau[4]],
    [...state.tableau[5]],
    [...state.tableau[6]],
    [...state.tableau[7]],
  ];

  let movingCards: Card[] = [];

  // Extract from source
  if (source.pile === 'freecell') {
    const cIdx = source.cellIndex!;
    const card = newFreeCells[cIdx];
    if (!card) return state;
    movingCards = [card];
    newFreeCells[cIdx] = null;
  } else if (source.pile === 'foundation') {
    const fIdx = source.foundationIndex!;
    const pile = newFoundations[fIdx];
    if (pile.length === 0) return state;
    movingCards = [pile.pop()!];
  } else if (source.pile === 'tableau') {
    const colIdx = source.colIndex!;
    const cardIdx = source.cardIndex!;
    const col = newTableau[colIdx];
    if (cardIdx >= col.length) return state;
    movingCards = col.slice(cardIdx);
    newTableau[colIdx] = col.slice(0, cardIdx);
  }

  if (movingCards.length === 0) return state;

  // Validate and place onto destination
  if (destination.type === 'freecell') {
    if (movingCards.length !== 1) return state; // Only 1 card into free cell
    if (!canPlaceOnFreeCell(newFreeCells[destination.index])) return state;
    newFreeCells[destination.index] = movingCards[0];
  } else if (destination.type === 'foundation') {
    if (movingCards.length !== 1) return state; // Only 1 card into foundation
    if (!canPlaceOnFoundation(newFoundations[destination.index], movingCards[0])) return state;
    newFoundations[destination.index].push(movingCards[0]);
  } else if (destination.type === 'tableau') {
    const targetCol = newTableau[destination.index];
    const targetTop = targetCol.length > 0 ? targetCol[targetCol.length - 1] : null;

    if (!canPlaceOnTableau(targetTop, movingCards[0])) return state;

    // Check supermove capacity if moving sequence
    if (movingCards.length > 1) {
      if (!isValidTableauSequence(movingCards)) return state;
      const emptyCells = getEmptyFreeCellCount(newFreeCells);
      const emptyCols = getEmptyTableauColumnCount(newTableau);
      const isTargetEmpty = targetCol.length === 0;
      const maxAllowed = maxCardsMovable(emptyCells, emptyCols, isTargetEmpty);
      if (movingCards.length > maxAllowed) return state;
    }

    targetCol.push(...movingCards);
  }

  let nextState: GameState = {
    ...state,
    freeCells: newFreeCells,
    foundations: newFoundations,
    tableau: newTableau,
    movesCount: state.movesCount + 1,
    startTime,
    isWon: isGameWon(newFoundations),
    history: [
      ...state.history,
      {
        description: `העברת ${movingCards.length} קלף/ים`,
        previousState: snapshot,
      },
    ],
    redoStack: [], // New move clears redo stack
  };

  // Safe auto-play to foundations (if enabled in settings and not already won)
  if (state.settings.autoPlaySafeCards && !nextState.isWon) {
    nextState = runSafeAutoMoves(nextState);
  }

  saveGameStateToStorage(nextState);
  return nextState;
}

/**
 * Checks all exposed cards (bottom of tableau columns and free cells)
 * and automatically sends safe cards to foundations.
 */
export function runSafeAutoMoves(state: GameState): GameState {
  let changed = true;
  let currentState = state;

  while (changed) {
    changed = false;

    // 1. Check all 4 Free Cells
    for (let c = 0; c < 4; c++) {
      const card = currentState.freeCells[c];
      if (card && isSafeAutoMoveToFoundation(card, currentState.foundations)) {
        const fIdx = currentState.foundations.findIndex(
          (pile) =>
            (pile.length === 0 && card.rank === 1) ||
            (pile.length > 0 && pile[0].suit === card.suit)
        );
        const targetFoundation = fIdx !== -1 ? fIdx : currentState.foundations.findIndex((p) => p.length === 0);

        if (targetFoundation !== -1) {
          const newFreeCells = [...currentState.freeCells] as [Card | null, Card | null, Card | null, Card | null];
          newFreeCells[c] = null;
          const newFoundations = currentState.foundations.map((p, idx) =>
            idx === targetFoundation ? [...p, card] : [...p]
          ) as [Card[], Card[], Card[], Card[]];

          currentState = {
            ...currentState,
            freeCells: newFreeCells,
            foundations: newFoundations,
            isWon: isGameWon(newFoundations),
          };
          changed = true;
          break;
        }
      }
    }

    if (changed) continue;

    // 2. Check bottom exposed card of all 8 Tableau columns
    for (let colIdx = 0; colIdx < 8; colIdx++) {
      const col = currentState.tableau[colIdx];
      if (col.length > 0) {
        const topCard = col[col.length - 1];
        if (isSafeAutoMoveToFoundation(topCard, currentState.foundations)) {
          const fIdx = currentState.foundations.findIndex(
            (pile) =>
              (pile.length === 0 && topCard.rank === 1) ||
              (pile.length > 0 && pile[0].suit === topCard.suit)
          );
          const targetFoundation = fIdx !== -1 ? fIdx : currentState.foundations.findIndex((p) => p.length === 0);

          if (targetFoundation !== -1) {
            const newTableau = currentState.tableau.map((c, idx) =>
              idx === colIdx ? c.slice(0, -1) : [...c]
            ) as [Card[], Card[], Card[], Card[], Card[], Card[], Card[], Card[]];
            const newFoundations = currentState.foundations.map((p, idx) =>
              idx === targetFoundation ? [...p, topCard] : [...p]
            ) as [Card[], Card[], Card[], Card[]];

            currentState = {
              ...currentState,
              tableau: newTableau,
              foundations: newFoundations,
              isWon: isGameWon(newFoundations),
            };
            changed = true;
            break;
          }
        }
      }
    }
  }

  return currentState;
}

export function undoMove(state: GameState): GameState {
  if (state.history.length === 0) return state;

  const currentSnapshot = snapshotPiles(state);
  const lastHistory = state.history[state.history.length - 1];
  const newHistory = state.history.slice(0, -1);

  const prev = lastHistory.previousState;

  const nextState: GameState = {
    ...state,
    freeCells: prev.freeCells as [Card | null, Card | null, Card | null, Card | null],
    foundations: prev.foundations as [Card[], Card[], Card[], Card[]],
    tableau: prev.tableau as [Card[], Card[], Card[], Card[], Card[], Card[], Card[], Card[]],
    movesCount: Math.max(0, state.movesCount - 1),
    isWon: false,
    history: newHistory,
    redoStack: [
      ...state.redoStack,
      {
        description: 'ביטול מהלך',
        previousState: currentSnapshot,
      },
    ],
  };

  saveGameStateToStorage(nextState);
  return nextState;
}

export function redoMove(state: GameState): GameState {
  if (state.redoStack.length === 0) return state;

  const currentSnapshot = snapshotPiles(state);
  const nextRedo = state.redoStack[state.redoStack.length - 1];
  const newRedoStack = state.redoStack.slice(0, -1);

  const target = nextRedo.previousState;

  const nextState: GameState = {
    ...state,
    freeCells: target.freeCells as [Card | null, Card | null, Card | null, Card | null],
    foundations: target.foundations as [Card[], Card[], Card[], Card[]],
    tableau: target.tableau as [Card[], Card[], Card[], Card[], Card[], Card[], Card[], Card[]],
    movesCount: state.movesCount + 1,
    isWon: isGameWon(target.foundations as [Card[], Card[], Card[], Card[]]),
    history: [
      ...state.history,
      {
        description: 'שחזור מהלך',
        previousState: currentSnapshot,
      },
    ],
    redoStack: newRedoStack,
  };

  saveGameStateToStorage(nextState);
  return nextState;
}

export function saveGameStateToStorage(state: GameState) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) {
    console.error('Failed to save game state', e);
  }
}

export function loadSavedGameState(): GameState | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch (e) {
    console.error('Failed to load game state', e);
  }
  return null;
}
