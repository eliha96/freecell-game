import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameSettings, GameState } from './engine/types';
import {
  createNewGame,
  executeMove,
  loadSavedGameState,
  redoMove,
  saveSettings,
  undoMove,
} from './engine/gameManager';
import { canPlaceOnFoundation, isGameWon } from './engine/rules';
import { sounds } from './engine/sound';
import { HeaderBar } from './components/HeaderBar';
import { GameBoard } from './components/GameBoard';
import { SelectDealModal } from './components/SelectDealModal';
import { SettingsModal } from './components/SettingsModal';
import { WinCanvas } from './components/WinCanvas';

export function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = loadSavedGameState();
    if (saved && !saved.isWon) {
      return saved;
    }
    return createNewGame();
  });

  const [isSelectDealOpen, setIsSelectDealOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const autoCompleteTimerRef = useRef<number | null>(null);

  // Sync sound settings
  useEffect(() => {
    sounds.setMuted(!gameState.settings.soundEnabled);
  }, [gameState.settings.soundEnabled]);

  // Elapsed game timer
  useEffect(() => {
    if (!gameState.startTime || gameState.isWon) return;

    const interval = window.setInterval(() => {
      setGameState((prev) => {
        if (!prev.startTime || prev.isWon) return prev;
        return {
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.startTime, gameState.isWon]);

  // Handle Move
  const handleMove = useCallback(
    (
      source: {
        pile: 'tableau' | 'freecell' | 'foundation';
        colIndex?: number;
        cardIndex?: number;
        cellIndex?: number;
        foundationIndex?: number;
      },
      destination: {
        type: 'foundation' | 'tableau' | 'freecell';
        index: number;
      }
    ) => {
      setGameState((prev) => executeMove(prev, source, destination));
    },
    []
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    setGameState((prev) => {
      const next = undoMove(prev);
      sounds.playCardFlip();
      return next;
    });
  }, []);

  const handleRedo = useCallback(() => {
    setGameState((prev) => {
      const next = redoMove(prev);
      sounds.playCardFlip();
      return next;
    });
  }, []);

  // New Game
  const handleNewGame = useCallback(() => {
    if (autoCompleteTimerRef.current) {
      clearInterval(autoCompleteTimerRef.current);
    }
    setGameState(createNewGame(undefined, gameState.settings));
  }, [gameState.settings]);

  // Choose Deal
  const handleSelectDeal = useCallback(
    (dealNum: number) => {
      if (autoCompleteTimerRef.current) {
        clearInterval(autoCompleteTimerRef.current);
      }
      setGameState(createNewGame(dealNum, gameState.settings));
    },
    [gameState.settings]
  );

  // Replay Same Deal
  const handleReplayDeal = useCallback(() => {
    if (autoCompleteTimerRef.current) {
      clearInterval(autoCompleteTimerRef.current);
    }
    setGameState(createNewGame(gameState.dealNumber, gameState.settings));
  }, [gameState.dealNumber, gameState.settings]);

  // Update Settings
  const handleUpdateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setGameState((prev) => {
      const updated = { ...prev.settings, ...newSettings };
      saveSettings(updated);
      return {
        ...prev,
        settings: updated,
      };
    });
  }, []);

  // Fast Snappy Auto-Complete Cascade (80ms per card with card sounds)
  const handleAutoComplete = useCallback(() => {
    if (gameState.isWon || gameState.isAutoCompleting) return;

    setGameState((prev) => ({ ...prev, isAutoCompleting: true }));

    autoCompleteTimerRef.current = window.setInterval(() => {
      setGameState((prev) => {
        if (prev.isWon) {
          if (autoCompleteTimerRef.current) clearInterval(autoCompleteTimerRef.current);
          return prev;
        }

        // Try to move one card from FreeCells or Tableau to Foundation
        // 1. Check FreeCells
        for (let c = 0; c < 4; c++) {
          const card = prev.freeCells[c];
          if (card) {
            for (let f = 0; f < 4; f++) {
              if (canPlaceOnFoundation(prev.foundations[f], card)) {
                sounds.playCardFlip();
                return executeMove(
                  prev,
                  { pile: 'freecell', cellIndex: c },
                  { type: 'foundation', index: f }
                );
              }
            }
          }
        }

        // 2. Check Tableau
        for (let colIdx = 0; colIdx < 8; colIdx++) {
          const col = prev.tableau[colIdx];
          if (col.length > 0) {
            const card = col[col.length - 1];
            for (let f = 0; f < 4; f++) {
              if (canPlaceOnFoundation(prev.foundations[f], card)) {
                sounds.playCardFlip();
                return executeMove(
                  prev,
                  { pile: 'tableau', colIndex: colIdx, cardIndex: col.length - 1 },
                  { type: 'foundation', index: f }
                );
              }
            }
          }
        }

        // If no more moves can be made
        if (autoCompleteTimerRef.current) clearInterval(autoCompleteTimerRef.current);
        return {
          ...prev,
          isAutoCompleting: false,
          isWon: isGameWon(prev.foundations),
        };
      });
    }, 80);
  }, [gameState.isWon, gameState.isAutoCompleting]);

  // Clean up auto-complete timer on unmount
  useEffect(() => {
    return () => {
      if (autoCompleteTimerRef.current) {
        clearInterval(autoCompleteTimerRef.current);
      }
    };
  }, []);

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key.toLowerCase() === 'n') {
        handleNewGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleNewGame]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden green-felt text-white select-none">
      {/* Top Header Bar */}
      <HeaderBar
        dealNumber={gameState.dealNumber}
        movesCount={gameState.movesCount}
        elapsedSeconds={gameState.elapsedSeconds}
        canUndo={gameState.history.length > 0}
        canRedo={gameState.redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onNewGame={handleNewGame}
        onOpenSelectDeal={() => setIsSelectDealOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main FreeCell Game Board */}
      <GameBoard
        gameState={gameState}
        onMove={handleMove}
        onAutoComplete={handleAutoComplete}
      />

      {/* Select Deal Modal */}
      <SelectDealModal
        currentDeal={gameState.dealNumber}
        isOpen={isSelectDealOpen}
        onClose={() => setIsSelectDealOpen(false)}
        onSelectDeal={handleSelectDeal}
      />

      {/* Settings Modal */}
      <SettingsModal
        settings={gameState.settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Victory Celebration */}
      {gameState.isWon && (
        <WinCanvas
          dealNumber={gameState.dealNumber}
          movesCount={gameState.movesCount}
          elapsedSeconds={gameState.elapsedSeconds}
          onNewGame={handleNewGame}
          onReplayDeal={handleReplayDeal}
        />
      )}
    </div>
  );
}

export default App;
