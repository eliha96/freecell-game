export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardColor = 'red' | 'black';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  color: CardColor;
  isFaceUp: boolean;
}

export type CardBackStyle =
  | 'classic-blue'
  | 'beach'
  | 'castle'
  | 'robot'
  | 'roses'
  | 'fish'
  | 'shells'
  | 'classic-red';

export type CardFaceTheme =
  | 'large-print'
  | 'modern-bold'
  | 'four-color'
  | 'windows95'
  | 'standard';

export type CardLocation =
  | { pile: 'freecell'; cellIndex: number }
  | { pile: 'foundation'; foundationIndex: number }
  | { pile: 'tableau'; colIndex: number; cardIndex: number };

export interface MoveRecord {
  description: string;
  previousState: {
    freeCells: (Card | null)[];
    foundations: Card[][];
    tableau: Card[][];
    movesCount: number;
  };
}

export interface GameSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  cardBack: CardBackStyle;
  cardFaceTheme: CardFaceTheme;
  autoPlaySafeCards: boolean;
  autoCompletePrompt: boolean;
  dimCoveredCards?: boolean;
}

export interface GameState {
  dealNumber: number;
  freeCells: [Card | null, Card | null, Card | null, Card | null];
  foundations: [Card[], Card[], Card[], Card[]];
  tableau: [Card[], Card[], Card[], Card[], Card[], Card[], Card[], Card[]];
  movesCount: number;
  startTime: number | null;
  elapsedSeconds: number;
  isWon: boolean;
  isAutoCompleting: boolean;
  settings: GameSettings;
  history: MoveRecord[];
  redoStack: MoveRecord[];
}
