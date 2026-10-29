import React from 'react';
import type { Card, CardBackStyle, CardFaceTheme } from '../engine/types';
import { CardBack } from './CardBack';
import { VectorCardFace } from './VectorCardFace';

interface CardViewProps {
  card: Card;
  cardBack?: CardBackStyle;
  cardFaceTheme?: CardFaceTheme;
  isHighlighted?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
  isDimmed?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  style?: React.CSSProperties;
  className?: string;
}

const SUIT_TO_STANDARD_CHAR: Record<string, string> = {
  clubs: 'c',
  diamonds: 'd',
  hearts: 'h',
  spades: 's',
};

const SUIT_TO_WIN95_ROW: Record<string, number> = {
  clubs: 0,
  diamonds: 1,
  hearts: 2,
  spades: 3,
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  cardBack = 'classic-blue',
  cardFaceTheme = 'windows95',
  isHighlighted = false,
  isSelected = false,
  isDragging = false,
  isDimmed = false,
  onClick,
  onPointerDown,
  style,
  className = '',
}) => {
  // FreeCell cards are always face-up, but support face-down just in case
  if (!card.isFaceUp) {
    return (
      <div
        onClick={onClick}
        onPointerDown={onPointerDown}
        style={style}
        className={`relative aspect-[71/96] w-full rounded-sm md:rounded-md shadow-md cursor-pointer select-none transition-transform active:scale-95 ${
          isDragging ? 'opacity-30' : ''
        } ${className}`}
      >
        <CardBack styleName={cardBack} />
      </div>
    );
  }

  const isCardDimmed = Boolean(isDimmed && !isSelected && !isHighlighted && !isDragging);
  const dimmingClass = isCardDimmed ? 'card-dimmed' : 'card-playable-front';

  // Common wrapper styling
  const wrapperClasses = `relative aspect-[71/96] w-full rounded-sm md:rounded-md select-none flex items-center justify-center overflow-hidden touch-none transition-all ${dimmingClass} ${
    isHighlighted ? 'ring-3 md:ring-4 ring-amber-400 scale-[1.03] z-30 shadow-xl' : ''
  } ${isSelected ? 'ring-2 md:ring-3 ring-blue-500 scale-[1.02] z-20 shadow-lg' : ''} ${
    isDragging ? 'opacity-25' : 'cursor-grab active:cursor-grabbing hover:brightness-98'
  } ${className}`;

  // 1. Vector Accessible Decks (Large Print, Modern Bold, 4-Color)
  if (
    cardFaceTheme === 'large-print' ||
    cardFaceTheme === 'modern-bold' ||
    cardFaceTheme === 'four-color'
  ) {
    return (
      <div
        onClick={onClick}
        onPointerDown={onPointerDown}
        style={style}
        className={`${wrapperClasses} bg-white border border-gray-200/80`}
      >
        <VectorCardFace card={card} theme={cardFaceTheme} />
      </div>
    );
  }

  // 2. Standard Bicycle SVG Deck
  if (cardFaceTheme === 'standard') {
    const sChar = SUIT_TO_STANDARD_CHAR[card.suit];
    const fileName = `${card.rank}${sChar}.svg`;
    return (
      <div
        onClick={onClick}
        onPointerDown={onPointerDown}
        style={style}
        className={`${wrapperClasses} bg-white`}
      >
        <img
          src={`/decks/standard/${fileName}`}
          alt={`${card.rank} of ${card.suit}`}
          draggable={false}
          className="w-full h-full object-contain pointer-events-none select-none"
        />
      </div>
    );
  }

  // 2. Windows 95/XP Classic Pixel-Art (cards.dll) - Default
  const row = SUIT_TO_WIN95_ROW[card.suit];
  const col = card.rank - 1; // 0 (Ace) to 12 (King)
  const posX = (col / 12) * 100;
  const posY = (row / 3) * 100;

  return (
    <div
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={style}
      className={`${wrapperClasses} bg-white`}
    >
      <div
        className="w-full h-full pointer-events-none select-none"
        style={{
          backgroundImage: 'url(/decks/windows95/cards.png)',
          backgroundPosition: `${posX}% ${posY}%`,
          backgroundSize: '1300% 400%',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};
