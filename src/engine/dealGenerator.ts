import type { Card, CardColor, Rank, Suit } from './types';

const SUITS: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];

function getCardColor(suit: Suit): CardColor {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

/**
 * Generates the authentic Microsoft FreeCell deal for any deal number (1 to 32,000+).
 * Uses the exact Microsoft C Run-Time Library Linear Congruential Generator (LCG).
 *
 * Formula:
 *   seed = (seed * 214013 + 2531011) & 0x7FFFFFFF
 *   rand = (seed >> 16) % remaining_cards
 */
export function generateMicrosoftDeal(
  dealNumber: number
): [Card[], Card[], Card[], Card[], Card[], Card[], Card[], Card[]] {
  let seed = dealNumber >>> 0;

  function rnd(limit: number): number {
    seed = (Math.imul(seed, 214013) + 2531011) & 0x7FFFFFFF;
    return (seed >> 16) % limit;
  }

  // 1. Initialize 52 cards ordered by rank (Ace to King), then suit (Clubs, Diamonds, Hearts, Spades)
  const deck: Card[] = [];
  for (let r = 1; r <= 13; r++) {
    for (let s = 0; s < 4; s++) {
      const suit = SUITS[s];
      deck.push({
        id: `card-${suit}-${r}`,
        suit,
        rank: r as Rank,
        color: getCardColor(suit),
        isFaceUp: true, // In FreeCell, all cards are face up from the start!
      });
    }
  }

  // 2. Shuffle cards using the authentic MS swap algorithm
  const shuffledCards: Card[] = [];
  let wLeft = 52;
  for (let i = 0; i < 52; i++) {
    const j = rnd(wLeft);
    shuffledCards.push(deck[j]);
    deck[j] = deck[wLeft - 1];
    wLeft--;
  }

  // 3. Deal cards round-robin across 8 tableau columns
  // Columns 0..3 receive 7 cards each (total 28)
  // Columns 4..7 receive 6 cards each (total 24)
  const tableau: [Card[], Card[], Card[], Card[], Card[], Card[], Card[], Card[]] = [
    [], [], [], [], [], [], [], []
  ];

  for (let i = 0; i < 52; i++) {
    tableau[i % 8].push(shuffledCards[i]);
  }

  return tableau;
}

export function getRandomDealNumber(): number {
  return Math.floor(Math.random() * 32000) + 1;
}
