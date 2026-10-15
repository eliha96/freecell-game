import React from 'react';
import { Undo2, Redo2, RotateCcw, Settings as SettingsIcon, Hash } from 'lucide-react';

interface HeaderBarProps {
  dealNumber: number;
  movesCount: number;
  elapsedSeconds: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onNewGame: () => void;
  onOpenSelectDeal: () => void;
  onOpenSettings: () => void;
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  dealNumber,
  movesCount,
  elapsedSeconds,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onNewGame,
  onOpenSelectDeal,
  onOpenSettings,
}) => {
  return (
    <header className="w-full bg-[#044317] border-b border-[#0f8b3c]/40 text-white px-2 sm:px-4 py-2 flex items-center justify-between shadow-md select-none shrink-0 z-40">
      {/* Left: Deal Number & Fast Stats */}
      <div className="flex items-center gap-3 sm:gap-5">
        <button
          onClick={onOpenSelectDeal}
          className="flex items-center gap-1.5 bg-[#076324] hover:bg-[#0a7a2e] active:scale-95 px-2.5 py-1.5 rounded-lg border border-white/20 text-xs sm:text-sm font-bold tracking-wide shadow transition"
          title="בחר מספר משחק"
        >
          <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
          <span>משחק #{dealNumber}</span>
        </button>

        <div className="flex items-center gap-3 text-xs sm:text-sm text-green-100">
          <div className="flex items-center gap-1">
            <span className="text-green-300/80">זמן:</span>
            <span className="font-mono font-bold text-white min-w-[42px]">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-green-300/80">מהלכים:</span>
            <span className="font-mono font-bold text-white min-w-[20px]">
              {movesCount}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Undo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex items-center justify-center p-2 rounded-lg transition active:scale-95 ${
            canUndo
              ? 'bg-[#076324] hover:bg-[#0a7a2e] text-white border border-white/20 shadow'
              : 'bg-black/20 text-white/30 cursor-not-allowed border border-transparent'
          }`}
          title="בטל מהלך (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Redo */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`flex items-center justify-center p-2 rounded-lg transition active:scale-95 ${
            canRedo
              ? 'bg-[#076324] hover:bg-[#0a7a2e] text-white border border-white/20 shadow'
              : 'bg-black/20 text-white/30 cursor-not-allowed border border-transparent'
          }`}
          title="שחזר מהלך (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* New Game */}
        <button
          onClick={onNewGame}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 px-2.5 sm:px-3 py-1.5 rounded-lg border border-white/25 text-xs sm:text-sm font-semibold shadow transition"
          title="משחק חדש"
        >
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">משחק חדש</span>
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="flex items-center justify-center p-2 rounded-lg bg-[#076324] hover:bg-[#0a7a2e] text-white border border-white/20 shadow active:scale-95 transition"
          title="הגדרות"
        >
          <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </header>
  );
};
