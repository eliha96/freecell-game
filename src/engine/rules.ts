import type { Card, GameState, Rank, Suit } from './types';

export const SUITS: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];

export function getRankLabel(rank: Rank): string {
  switch (rank) {
    case 1:
      return 'A';
    case 11:
      return 'J';
    case 12:
      return 'Q';
    case 13:
      return 'K';
    default:
      return rank.toString();
  }
}

export function getSuitSymbol(suit: Suit): string {
  switch (suit) {
    case 'hearts':
      return '♥';
    case 'diamonds':
      return '♦';
    case 'clubs':
      return '♣';
    case 'spades':
      return '♠';
  }
}

/**
 * Checks if movingCard can be placed onto targetTopCard in a Tableau column.
 * In FreeCell:
 * - An empty column (targetTopCard is null) accepts ANY card or valid sequence!
 * - A non-empty column requires alternating colors and descending rank by 1.
 */
export function canPlaceOnTableau(
  targetTopCard: Card | null,
  movingCard: Card
): boolean {
  if (!targetTopCard) {
    return true; // Any card can be placed in an empty column in FreeCell!
  }
  return (
    targetTopCard.color !== movingCard.color &&
    targetTopCard.rank === movingCard.rank + 1
  );
}

/**
 * Checks if movingCard can be placed onto a Foundation pile.
 * Rule: Same suit, ascending order starting with Ace (1) up to King (13).
 */
export function canPlaceOnFoundation(
  foundationPile: Card[],
  movingCard: Card
): boolean {
  if (foundationPile.length === 0) {
    return movingCard.rank === 1; // Ace only on empty foundation
  }
  const topCard = foundationPile[foundationPile.length - 1];
  return topCard.suit === movingCard.suit && movingCard.rank === topCard.rank + 1;
}

/**
 * Checks if a FreeCell can accept a card (it must be empty).
 */
export function canPlaceOnFreeCell(cell: Card | null): boolean {
  return cell === null;
}

/**
 * Checks if an array of cards forms a strictly valid alternating-color descending sequence.
 */
export function isValidTableauSequence(cards: Card[]): boolean {
  if (cards.length <= 1) return true;
  for (let i = 0; i < cards.length - 1; i++) {
    const current = cards[i];
    const next = cards[i + 1];
    if (current.color === next.color || current.rank !== next.rank + 1) {
      return false;
    }
  }
  return true;
}

/**
 * Supermove capacity calculation:
 * Formula: M = (1 + emptyFreeCells) * 2^(emptyColumns)
 * If moving to an empty column, that destination empty column cannot serve as intermediate staging,
 * so the power is 2^(emptyColumns - 1).
 */
export function maxCardsMovable(
  emptyFreeCells: number,
  emptyColumns: number,
  isDestinationEmptyCol: boolean = false
): number {
  const effectiveEmptyCols = isDestinationEmptyCol
    ? Math.max(0, emptyColumns - 1)
    : emptyColumns;

  return (1 + emptyFreeCells) * Math.pow(2, effectiveEmptyCols);
}

/**
 * Checks if moving this card to the foundation is mathematically 100% "safe",
 * meaning it can NEVER prevent another card from being placed in the tableau later.
 *
 * Rules:
 * 1. Aces (1) and Deuces (2) are always safe.
 * 2. Rank R >= 3 is safe if both foundations of the OPPOSITE color have reached at least rank R - 1.
 *    (e.g., Black 5 is safe if both Red 4s are already on foundations).
 */
export function isSafeAutoMoveToFoundation(
  card: Card,
  foundations: [Card[], Card[], Card[], Card[]]
): boolean {
  // Find which foundation matches this card's suit
  const matchingPile = foundations.find(
    (pile) =>
      (pile.length === 0 && card.rank === 1) ||
      (pile.length > 0 && pile[0].suit === card.suit)
  );

  // Must be a valid legal move first
  if (!matchingPile && card.rank !== 1) return false;
  const pileToCheck = matchingPile || foundations.find((p) => p.length === 0);
  if (!pileToCheck || !canPlaceOnFoundation(pileToCheck, card)) return false;

  // Rule 1: Aces and Twos are unconditionally safe
  if (card.rank <= 2) return true;

  // Rule 2: For Rank >= 3, both opposite-color suits must have reached at least (card.rank - 1)
  const oppositeSuits: Suit[] =
    card.color === 'black' ? ['hearts', 'diamonds'] : ['clubs', 'spades'];

  for (const oppSuit of oppositeSuits) {
    const oppPile = foundations.find((p) => p.length > 0 && p[0].suit === oppSuit);
    const oppRank = oppPile && oppPile.length > 0 ? oppPile[oppPile.length - 1].rank : 0;
    if (oppRank < card.rank - 1) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if the entire game is won (all 4 foundations have 13 cards = 52 cards total).
 */
export function isGameWon(foundations: [Card[], Card[], Card[], Card[]]): boolean {
  return foundations.every((f) => f.length === 13);
}

/**
 * Checks if the board is eligible for auto-completion (fast cascade).
 * In FreeCell: If all cards can safely and monotonically cascade to foundations.
 */
export function canAutoComplete(state: GameState): boolean {
  if (state.isWon) return false;

  // Count remaining cards in tableau and free cells
  let remainingCount = 0;
  for (const cell of state.freeCells) {
    if (cell) remainingCount++;
  }
  for (const col of state.tableau) {
    remainingCount += col.length;
  }

  if (remainingCount === 0) return false;

  // Check if every tableau column is a valid descending sequence
  for (const col of state.tableau) {
    if (!isValidTableauSequence(col)) {
      return false;
    }
  }

  return true;
}
