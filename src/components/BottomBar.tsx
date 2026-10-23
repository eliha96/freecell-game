import React from 'react';
import { Undo2, Redo2, RotateCcw, Trophy, Settings as SettingsIcon } from 'lucide-react';

interface BottomBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onNewGame: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onNewGame,
  onOpenLeaderboard,
  onOpenSettings,
}) => {
  return (
    <nav className="w-full bg-[#044317] border-t border-[#0f8b3c]/40 text-white px-1 sm:px-6 py-1.5 pb-safe flex items-center justify-around shadow-2xl select-none shrink-0 z-40">
      {/* New Game */}
      <button
        onClick={onNewGame}
        className="flex flex-col items-center justify-center gap-0.5 px-2 sm:px-3 py-1.5 rounded-xl hover:bg-white/10 active:scale-95 transition text-green-100 min-w-[54px] sm:min-w-[64px] cursor-pointer"
        title="התחל משחק חדש"
      >
        <div className="w-8 h-8 rounded-full bg-emerald-700/80 flex items-center justify-center border border-emerald-400/40 shadow-sm">
          <RotateCcw className="w-4 h-4 text-white" />
        </div>
        <span className="text-[11px] font-medium tracking-tight">משחק חדש</span>
      </button>

      {/* Undo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`flex flex-col items-center justify-center gap-0.5 px-2 sm:px-3 py-1.5 rounded-xl transition min-w-[54px] sm:min-w-[64px] ${
          canUndo
            ? 'hover:bg-white/10 active:scale-95 text-white cursor-pointer'
            : 'opacity-40 text-white/40 cursor-not-allowed'
        }`}
        title="בטל מהלך אחרון (Ctrl+Z)"
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-sm ${
            canUndo ? 'bg-[#076324] border-white/20' : 'bg-black/20 border-transparent'
          }`}
        >
          <Undo2 className="w-4 h-4" />
        </div>
        <span className="text-[11px] font-medium tracking-tight">בטל</span>
      </button>

      {/* Redo */}
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`flex flex-col items-center justify-center gap-0.5 px-2 sm:px-3 py-1.5 rounded-xl transition min-w-[54px] sm:min-w-[64px] ${
          canRedo
            ? 'hover:bg-white/10 active:scale-95 text-white cursor-pointer'
            : 'opacity-40 text-white/40 cursor-not-allowed'
        }`}
        title="שחזר מהלך (Ctrl+Y)"
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-sm ${
            canRedo ? 'bg-[#076324] border-white/20' : 'bg-black/20 border-transparent'
          }`}
        >
          <Redo2 className="w-4 h-4" />
        </div>
        <span className="text-[11px] font-medium tracking-tight">שחזר</span>
      </button>

      {/* Leaderboard / Records */}
      <button
        onClick={onOpenLeaderboard}
        className="flex flex-col items-center justify-center gap-0.5 px-2 sm:px-3 py-1.5 rounded-xl hover:bg-white/10 active:scale-95 transition text-green-100 min-w-[54px] sm:min-w-[64px] cursor-pointer"
        title="לוח שיאים ותוצאות"
      >
        <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shadow-sm">
          <Trophy className="w-4 h-4 text-amber-300" />
        </div>
        <span className="text-[11px] font-medium tracking-tight">שיאים</span>
      </button>

      {/* Settings */}
      <button
        onClick={onOpenSettings}
        className="flex flex-col items-center justify-center gap-0.5 px-2 sm:px-3 py-1.5 rounded-xl hover:bg-white/10 active:scale-95 transition text-green-100 min-w-[54px] sm:min-w-[64px] cursor-pointer"
        title="הגדרות המשחק"
      >
        <div className="w-8 h-8 rounded-full bg-[#076324] flex items-center justify-center border border-white/20 shadow-sm">
          <SettingsIcon className="w-4 h-4 text-white" />
        </div>
        <span className="text-[11px] font-medium tracking-tight">הגדרות</span>
      </button>
    </nav>
  );
};
