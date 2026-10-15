import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Card, GameState, CardLocation } from '../engine/types';
import { CardView } from './CardView';
import {
  canPlaceOnFoundation,
  canPlaceOnFreeCell,
  canPlaceOnTableau,
  isValidTableauSequence,
  maxCardsMovable,
  canAutoComplete,
} from '../engine/rules';
import {
  findBestMoveForTappedCard,
  getEmptyFreeCellCount,
  getEmptyTableauColumnCount,
  type MoveDestination,
} from '../engine/solver';
import { sounds } from '../engine/sound';
import { Zap } from 'lucide-react';

interface GameBoardProps {
  gameState: GameState;
  onMove: (
    source: {
      pile: 'tableau' | 'freecell' | 'foundation';
      colIndex?: number;
      cardIndex?: number;
      cellIndex?: number;
      foundationIndex?: number;
    },
    destination: MoveDestination
  ) => void;
  onAutoComplete: () => void;
}

interface DragState {
  source: {
    pile: 'tableau' | 'freecell' | 'foundation';
    colIndex?: number;
    cardIndex?: number;
    cellIndex?: number;
    foundationIndex?: number;
  };
  cards: Card[];
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  pointerId: number;
  hasMoved: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onMove,
  onAutoComplete,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<CardLocation | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const tableauContainerRef = useRef<HTMLDivElement | null>(null);

  // Responsive dynamic measurement for filling screen height
  const [boardHeight, setBoardHeight] = useState<number>(600);
  const [cardWidth, setCardWidth] = useState<number>(45);

  // Targets bounding client rects for hit-testing drops
  const freeCellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const foundationRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tableauRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Track dimensions to dynamically scale vertical cascade
  useEffect(() => {
    const updateDimensions = () => {
      if (tableauContainerRef.current) {
        const h = tableauContainerRef.current.clientHeight;
        if (h > 100) setBoardHeight(h);
      } else if (boardRef.current) {
        const h = boardRef.current.clientHeight;
        if (h > 100) setBoardHeight(h - 90);
      }

      if (freeCellRefs.current[0]) {
        const w = freeCellRefs.current[0].clientWidth;
        if (w > 20) setCardWidth(w);
      }
    };

    updateDimensions();
    const timer = setTimeout(updateDimensions, 100);
    window.addEventListener('resize', updateDimensions);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Clear selection if board changes or won
  useEffect(() => {
    setSelectedLocation(null);
  }, [gameState.movesCount, gameState.dealNumber, gameState.isWon]);

  // Handle smart tap-to-move
  const handleCardTap = useCallback(
    (
      card: Card,
      source: {
        pile: 'tableau' | 'freecell' | 'foundation';
        colIndex?: number;
        cardIndex?: number;
        cellIndex?: number;
        foundationIndex?: number;
      }
    ) => {
      // 1. If we already have a selected card:
      if (selectedLocation) {
        const isSameCard =
          (selectedLocation.pile === 'tableau' &&
            source.pile === 'tableau' &&
            selectedLocation.colIndex === source.colIndex &&
            selectedLocation.cardIndex === source.cardIndex) ||
          (selectedLocation.pile === 'freecell' &&
            source.pile === 'freecell' &&
            selectedLocation.cellIndex === source.cellIndex) ||
          (selectedLocation.pile === 'foundation' &&
            source.pile === 'foundation' &&
            selectedLocation.foundationIndex === source.foundationIndex);

        if (isSameCard) {
          setSelectedLocation(null);
          return;
        }

        // Try to move previously selected card to this destination
        let selectedCards: Card[] = [];
        if (selectedLocation.pile === 'tableau') {
          const col = gameState.tableau[selectedLocation.colIndex];
          selectedCards = col.slice(selectedLocation.cardIndex);
        } else if (selectedLocation.pile === 'freecell') {
          const c = gameState.freeCells[selectedLocation.cellIndex];
          if (c) selectedCards = [c];
        } else if (selectedLocation.pile === 'foundation') {
          const f = gameState.foundations[selectedLocation.foundationIndex];
          if (f.length > 0) selectedCards = [f[f.length - 1]];
        }

        if (selectedCards.length > 0) {
          // If destination is tableau
          if (source.pile === 'tableau' && source.colIndex !== undefined) {
            const destCol = gameState.tableau[source.colIndex];
            const destTop = destCol.length > 0 ? destCol[destCol.length - 1] : null;

            // Check if valid tableau move
            if (canPlaceOnTableau(destTop, selectedCards[0])) {
              const emptyCells = getEmptyFreeCellCount(gameState.freeCells);
              const emptyCols = getEmptyTableauColumnCount(gameState.tableau);
              const isTargetEmpty = destCol.length === 0;
              const maxAllowed = maxCardsMovable(emptyCells, emptyCols, isTargetEmpty);

              if (selectedCards.length <= maxAllowed) {
                sounds.playCardPlace();
                sounds.triggerHaptic(20);
                onMove(selectedLocation, { type: 'tableau', index: source.colIndex });
                setSelectedLocation(null);
                return;
              }
            }
          }
        }
      }

      // 2. No previous selection, or move was not executed:
      // Try smart instant move via solver!
      const smartDest = findBestMoveForTappedCard(gameState, card, source);
      if (smartDest) {
        sounds.playCardFlip();
        sounds.triggerHaptic(15);
        onMove(source, smartDest);
        setSelectedLocation(null);
        return;
      }

      // 3. If no smart move, toggle selection so player can tap destination manually
      if (source.pile === 'tableau') {
        const col = gameState.tableau[source.colIndex!];
        const movingSeq = col.slice(source.cardIndex!);
        if (isValidTableauSequence(movingSeq)) {
          setSelectedLocation({
            pile: 'tableau',
            colIndex: source.colIndex!,
            cardIndex: source.cardIndex!,
          });
          sounds.playCardFlip();
        }
      } else if (source.pile === 'freecell') {
        setSelectedLocation({
          pile: 'freecell',
          cellIndex: source.cellIndex!,
        });
        sounds.playCardFlip();
      } else if (source.pile === 'foundation') {
        setSelectedLocation({
          pile: 'foundation',
          foundationIndex: source.foundationIndex!,
        });
        sounds.playCardFlip();
      }
    },
    [gameState, onMove, selectedLocation]
  );

  // Handle tapping empty spots (Empty FreeCell, Empty Foundation, Empty Tableau Column)
  const handleEmptySpotTap = (dest: MoveDestination) => {
    if (!selectedLocation) return;

    let selectedCards: Card[] = [];
    if (selectedLocation.pile === 'tableau') {
      const col = gameState.tableau[selectedLocation.colIndex];
      selectedCards = col.slice(selectedLocation.cardIndex);
    } else if (selectedLocation.pile === 'freecell') {
      const c = gameState.freeCells[selectedLocation.cellIndex];
      if (c) selectedCards = [c];
    } else if (selectedLocation.pile === 'foundation') {
      const f = gameState.foundations[selectedLocation.foundationIndex];
      if (f.length > 0) selectedCards = [f[f.length - 1]];
    }

    if (selectedCards.length === 0) return;

    if (dest.type === 'freecell') {
      if (selectedCards.length === 1 && canPlaceOnFreeCell(gameState.freeCells[dest.index])) {
        sounds.playCardPlace();
        sounds.triggerHaptic(20);
        onMove(selectedLocation, dest);
        setSelectedLocation(null);
      }
    } else if (dest.type === 'foundation') {
      if (
        selectedCards.length === 1 &&
        canPlaceOnFoundation(gameState.foundations[dest.index], selectedCards[0])
      ) {
        sounds.playCardPlace();
        sounds.triggerHaptic(20);
        onMove(selectedLocation, dest);
        setSelectedLocation(null);
      }
    } else if (dest.type === 'tableau') {
      const targetCol = gameState.tableau[dest.index];
      if (targetCol.length === 0) {
        const emptyCells = getEmptyFreeCellCount(gameState.freeCells);
        const emptyCols = getEmptyTableauColumnCount(gameState.tableau);
        const maxAllowed = maxCardsMovable(emptyCells, emptyCols, true);
        if (selectedCards.length <= maxAllowed) {
          sounds.playCardPlace();
          sounds.triggerHaptic(20);
          onMove(selectedLocation, dest);
          setSelectedLocation(null);
        }
      }
    }
  };

  // Pointer Down for Drag
  const handlePointerDown = (
    e: React.PointerEvent,
    source: {
      pile: 'tableau' | 'freecell' | 'foundation';
      colIndex?: number;
      cardIndex?: number;
      cellIndex?: number;
      foundationIndex?: number;
    }
  ) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return; // Left mouse button only

    let movingCards: Card[] = [];
    if (source.pile === 'tableau') {
      const col = gameState.tableau[source.colIndex!];
      movingCards = col.slice(source.cardIndex!);
      if (!isValidTableauSequence(movingCards)) return; // Only drag valid sequences

      const emptyCells = getEmptyFreeCellCount(gameState.freeCells);
      const emptyCols = getEmptyTableauColumnCount(gameState.tableau);
      const maxAllowed = maxCardsMovable(emptyCells, emptyCols, false);
      if (movingCards.length > maxAllowed) return; // Exceeds supermove limit
    } else if (source.pile === 'freecell') {
      const card = gameState.freeCells[source.cellIndex!];
      if (!card) return;
      movingCards = [card];
    } else if (source.pile === 'foundation') {
      const pile = gameState.foundations[source.foundationIndex!];
      if (pile.length === 0) return;
      movingCards = [pile[pile.length - 1]];
    }

    if (movingCards.length === 0) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setDragState({
      source,
      cards: movingCards,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      pointerId: e.pointerId,
      hasMoved: false,
    });
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState || dragState.pointerId !== e.pointerId) return;

    const dx = Math.abs(e.clientX - dragState.startX);
    const dy = Math.abs(e.clientY - dragState.startY);
    const hasMoved = dragState.hasMoved || dx > 6 || dy > 6;

    setDragState({
      ...dragState,
      currentX: e.clientX,
      currentY: e.clientY,
      hasMoved,
    });
  };

  // Pointer Up / Drop
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState || dragState.pointerId !== e.pointerId) return;

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if capture was already released
    }

    const { source, cards, hasMoved, currentX, currentY } = dragState;
    setDragState(null);

    // If pointer barely moved, treat as tap!
    if (!hasMoved) {
      handleCardTap(cards[0], source);
      return;
    }

    // Hit-test drop targets:
    // 1. Check Foundations (top right)
    for (let f = 0; f < 4; f++) {
      const el = foundationRefs.current[f];
      if (el) {
        const rect = el.getBoundingClientRect();
        if (
          currentX >= rect.left &&
          currentX <= rect.right &&
          currentY >= rect.top &&
          currentY <= rect.bottom
        ) {
          if (cards.length === 1 && canPlaceOnFoundation(gameState.foundations[f], cards[0])) {
            sounds.playCardPlace();
            sounds.triggerHaptic(20);
            onMove(source, { type: 'foundation', index: f });
            return;
          }
        }
      }
    }

    // 2. Check Free Cells (top left)
    for (let c = 0; c < 4; c++) {
      const el = freeCellRefs.current[c];
      if (el) {
        const rect = el.getBoundingClientRect();
        if (
          currentX >= rect.left &&
          currentX <= rect.right &&
          currentY >= rect.top &&
          currentY <= rect.bottom
        ) {
          if (cards.length === 1 && canPlaceOnFreeCell(gameState.freeCells[c])) {
            sounds.playCardPlace();
            sounds.triggerHaptic(20);
            onMove(source, { type: 'freecell', index: c });
            return;
          }
        }
      }
    }

    // 3. Check Tableau Columns (bottom)
    for (let colIdx = 0; colIdx < 8; colIdx++) {
      if (source.pile === 'tableau' && source.colIndex === colIdx) continue;

      const el = tableauRefs.current[colIdx];
      if (el) {
        const rect = el.getBoundingClientRect();
        // Generous vertical hit-box for tableau columns
        if (
          currentX >= rect.left &&
          currentX <= rect.right &&
          currentY >= rect.top &&
          currentY <= rect.bottom + 350
        ) {
          const targetCol = gameState.tableau[colIdx];
          const targetTop = targetCol.length > 0 ? targetCol[targetCol.length - 1] : null;

          if (canPlaceOnTableau(targetTop, cards[0])) {
            const emptyCells = getEmptyFreeCellCount(gameState.freeCells);
            const emptyCols = getEmptyTableauColumnCount(gameState.tableau);
            const isTargetEmpty = targetCol.length === 0;
            const maxAllowed = maxCardsMovable(emptyCells, emptyCols, isTargetEmpty);

            if (cards.length <= maxAllowed) {
              sounds.playCardPlace();
              sounds.triggerHaptic(20);
              onMove(source, { type: 'tableau', index: colIdx });
              return;
            }
          }
        }
      }
    }
  };

  const isEligibleAutoComplete = canAutoComplete(gameState);

  // Dynamic vertical offset calculation so cards comfortably fill the phone height!
  const maxColLength = Math.max(...gameState.tableau.map((col) => col.length), 7);
  const cardHeight = cardWidth * (96 / 71);
  const availableCascadeHeight = Math.max(220, boardHeight - cardHeight - 30);
  const calculatedOffset = Math.floor(availableCascadeHeight / Math.max(maxColLength - 1, 6));
  // Allow up to 38px on mobile, ensuring generous visibility of numbers and suits!
  const verticalOffset = Math.min(38, Math.max(16, calculatedOffset));

  return (
    <div
      ref={boardRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setDragState(null)}
      className="relative flex-1 w-full max-w-4xl mx-auto flex flex-col justify-start px-1 sm:px-2 pt-1.5 sm:pt-2.5 pb-1 overflow-hidden select-none touch-none"
    >
      {/* Auto Complete Prompt Bar (when available) */}
      {isEligibleAutoComplete && !gameState.isWon && (
        <div className="w-full mb-1.5 bg-amber-400 text-amber-950 font-bold px-3 py-1.5 rounded-lg flex items-center justify-between shadow-lg animate-pulse shrink-0">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Zap className="w-4 h-4 fill-amber-950" />
            <span>הלוח פתור! ניתן לסיים אוטומטית</span>
          </div>
          <button
            onClick={onAutoComplete}
            className="bg-amber-950 hover:bg-black text-amber-200 text-xs px-3 py-1 rounded-md font-bold transition active:scale-95 shadow cursor-pointer"
          >
            סיים משחק
          </button>
        </div>
      )}

      {/* TOP ROW: 4 Free Cells (Left) | Divider | 4 Foundations (Right) */}
      <div className="w-full flex items-center justify-between gap-1 sm:gap-2 mb-2 sm:mb-3 shrink-0">
        {/* Left Group: 4 Free Cells (indices 0..3) */}
        <div className="flex-1 grid grid-cols-4 gap-1 sm:gap-1.5">
          {gameState.freeCells.map((card, idx) => {
            const isSelected =
              selectedLocation?.pile === 'freecell' && selectedLocation.cellIndex === idx;
            const isDraggingThis =
              dragState?.hasMoved &&
              dragState.source.pile === 'freecell' &&
              dragState.source.cellIndex === idx;

            return (
              <div
                key={`freecell-slot-${idx}`}
                ref={(el) => {
                  freeCellRefs.current[idx] = el;
                }}
                onClick={() => {
                  if (!card) handleEmptySpotTap({ type: 'freecell', index: idx });
                }}
                className="relative aspect-[71/96] w-full rounded-sm md:rounded-md freecell-slot flex items-center justify-center cursor-pointer transition hover:bg-black/25"
              >
                {!card ? (
                  <span className="text-white/20 font-bold text-[10px] sm:text-xs select-none">
                    F{idx + 1}
                  </span>
                ) : (
                  <CardView
                    card={card}
                    cardFaceTheme={gameState.settings.cardFaceTheme}
                    isSelected={isSelected}
                    isDragging={isDraggingThis}
                    onPointerDown={(e) =>
                      handlePointerDown(e, { pile: 'freecell', cellIndex: idx })
                    }
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Subtle Visual Divider between FreeCells & Foundations */}
        <div className="w-[1.5px] h-7 sm:h-10 bg-white/20 shrink-0 mx-0.5 sm:mx-1 rounded-full" />

        {/* Right Group: 4 Foundations (indices 0..3) */}
        <div className="flex-1 grid grid-cols-4 gap-1 sm:gap-1.5">
          {gameState.foundations.map((pile, idx) => {
            const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
            const isSelected =
              selectedLocation?.pile === 'foundation' &&
              selectedLocation.foundationIndex === idx;
            const isDraggingThis =
              dragState?.hasMoved &&
              dragState.source.pile === 'foundation' &&
              dragState.source.foundationIndex === idx;

            // Suit watermark for empty foundations
            const suitSymbols = ['♣', '♦', '♥', '♠'];

            return (
              <div
                key={`foundation-slot-${idx}`}
                ref={(el) => {
                  foundationRefs.current[idx] = el;
                }}
                onClick={() => {
                  if (pile.length === 0) handleEmptySpotTap({ type: 'foundation', index: idx });
                }}
                className="relative aspect-[71/96] w-full rounded-sm md:rounded-md foundation-slot flex items-center justify-center cursor-pointer transition hover:bg-black/25"
              >
                {!topCard ? (
                  <span className="text-white/25 font-bold text-sm sm:text-xl select-none">
                    {suitSymbols[idx]}
                  </span>
                ) : (
                  <CardView
                    card={topCard}
                    cardFaceTheme={gameState.settings.cardFaceTheme}
                    isSelected={isSelected}
                    isDragging={isDraggingThis}
                    onPointerDown={(e) =>
                      handlePointerDown(e, { pile: 'foundation', foundationIndex: idx })
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM AREA: 8 Tableau Columns - Filling Screen Height */}
      <div
        ref={tableauContainerRef}
        className="w-full flex-1 grid grid-cols-8 gap-1 sm:gap-1.5 items-start overflow-visible min-h-0"
      >
        {gameState.tableau.map((col, colIdx) => {
          const isEmpty = col.length === 0;

          return (
            <div
              key={`col-${colIdx}`}
              ref={(el) => {
                tableauRefs.current[colIdx] = el;
              }}
              onClick={() => {
                if (isEmpty) handleEmptySpotTap({ type: 'tableau', index: colIdx });
              }}
              className="relative w-full h-full min-h-[220px] rounded-sm md:rounded-md transition"
            >
              {isEmpty ? (
                <div className="relative aspect-[71/96] w-full rounded-sm md:rounded-md card-slot flex items-center justify-center cursor-pointer hover:bg-white/5">
                  <span className="text-white/15 font-bold text-xs select-none">↓</span>
                </div>
              ) : (
                col.map((card, cardIdx) => {
                  const isSelected =
                    selectedLocation?.pile === 'tableau' &&
                    selectedLocation.colIndex === colIdx &&
                    cardIdx >= selectedLocation.cardIndex;

                  const isDraggingThis =
                    dragState?.hasMoved &&
                    dragState.source.pile === 'tableau' &&
                    dragState.source.colIndex === colIdx &&
                    cardIdx >= dragState.source.cardIndex!;

                  return (
                    <div
                      key={card.id}
                      style={{
                        position: 'absolute',
                        top: `${cardIdx * verticalOffset}px`,
                        left: 0,
                        right: 0,
                        zIndex: cardIdx + 1,
                      }}
                    >
                      <CardView
                        card={card}
                        cardFaceTheme={gameState.settings.cardFaceTheme}
                        isSelected={isSelected}
                        isDragging={isDraggingThis}
                        onPointerDown={(e) =>
                          handlePointerDown(e, {
                            pile: 'tableau',
                            colIndex: colIdx,
                            cardIndex: cardIdx,
                          })
                        }
                      />
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Dragged Cards Overlay */}
      {dragState?.hasMoved && (
        <div
          className="fixed pointer-events-none z-50 transition-none"
          style={{
            left: `${dragState.currentX - cardWidth / 2}px`,
            top: `${dragState.currentY - (cardWidth * 96) / 71 / 2}px`,
            width: `${Math.max(40, cardWidth)}px`,
            transform: 'scale(1.05)',
          }}
        >
          {dragState.cards.map((card, idx) => (
            <div
              key={`dragged-${card.id}`}
              style={{
                position: idx === 0 ? 'relative' : 'absolute',
                top: `${idx * verticalOffset}px`,
                left: 0,
                right: 0,
                zIndex: 100 + idx,
              }}
              className="drop-shadow-2xl"
            >
              <CardView
                card={card}
                cardFaceTheme={gameState.settings.cardFaceTheme}
                className="ring-2 ring-amber-300 shadow-2xl"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
