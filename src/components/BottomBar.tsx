import React from 'react';
import { Undo2, Redo2, RotateCcw, Dices, Trophy, Settings as SettingsIcon } from 'lucide-react';

interface BottomBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onNewGame: () => void;
  onRestart: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onNewGame,
  onRestart,
  onOpenLeaderboard,
  onOpenSettings,
}) => {
  return (
    <nav className="w-full bg-[#044317] border-t border-[#0f8b3c]/40 text-white px-1 sm:px-6 py-2 sm:py-2.5 pb-safe flex items-center justify-around shadow-2xl select-none shrink-0 z-40">
      {/* New Game */}
      <button
        onClick={onNewGame}
        className="flex flex-col items-center justify-center gap-1 px-1.5 sm:px-3 py-1 rounded-xl hover:bg-white/10 active:scale-95 transition text-green-100 min-w-[50px] sm:min-w-[66px] cursor-pointer"
        title="משחק חדש (הגרלת משחק באותה רמת קושי)"
      >
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-700/90 flex items-center justify-center border border-emerald-400/50 shadow-md">
          <Dices className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" />
        </div>
        <span className="text-xs sm:text-[13px] font-semibold tracking-tight text-white/95">משחק חדש</span>
      </button>

      {/* Restart Deal */}
      <button
        onClick={onRestart}
        className="flex flex-col items-center justify-center gap-1 px-1.5 sm:px-3 py-1 rounded-xl hover:bg-white/10 active:scale-95 transition text-green-100 min-w-[50px] sm:min-w-[66px] cursor-pointer"
        title="התחל משחק זה מהתחלה (איפוס לוח)"
      >
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-800/90 flex items-center justify-center border border-emerald-400/40 shadow-md">
          <RotateCcw className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-emerald-200" />
        </div>
        <span className="text-xs sm:text-[13px] font-semibold tracking-tight text-white/95">התחל מחדש</span>
      </button>

      {/* Undo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`flex flex-col items-center justify-center gap-1 px-1.5 sm:px-3 py-1 rounded-xl transition min-w-[50px] sm:min-w-[66px] ${
          canUndo
            ? 'hover:bg-white/10 active:scale-95 text-white cursor-pointer'
            : 'opacity-40 text-white/40 cursor-not-allowed'
        }`}
        title="בטל מהלך אחרון (Ctrl+Z)"
      >
        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border shadow-md ${
            canUndo ? 'bg-[#076324] border-white/20' : 'bg-black/20 border-transparent'
          }`}
        >
          <Undo2 className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
        </div>
        <span className="text-xs sm:text-[13px] font-semibold tracking-tight text-white/95">בטל</span>
      </button>

      {/* Redo */}
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`flex flex-col items-center justify-center gap-1 px-1.5 sm:px-3 py-1 rounded-xl transition min-w-[50px] sm:min-w-[66px] ${
          canRedo
            ? 'hover:bg-white/10 active:scale-95 text-white cursor-pointer'
            : 'opacity-40 text-white/40 cursor-not-allowed'
        }`}
        title="שחזר מהלך (Ctrl+Y)"
      >
        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border shadow-md ${
            canRedo ? 'bg-[#076324] border-white/20' : 'bg-black/20 border-transparent'
          }`}
        >
          <Redo2 className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
        </div>
        <span className="text-xs sm:text-[13px] font-semibold tracking-tight text-white/95">שחזר</span>
      </button>

      {/* Leaderboard / Records */}
      <button
        onClick={onOpenLeaderboard}
        className="flex flex-col items-center justify-center gap-1 px-1.5 sm:px-3 py-1 rounded-xl hover:bg-white/10 active:scale-95 transition text-green-100 min-w-[50px] sm:min-w-[66px] cursor-pointer"
        title="לוח שיאים ותוצאות"
      >
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-amber-500/25 border border-amber-400/60 flex items-center justify-center shadow-md">
          <Trophy className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-amber-300" />
        </div>
        <span className="text-xs sm:text-[13px] font-semibold tracking-tight text-white/95">שיאים</span>
      </button>

      {/* Settings */}
      <button
        onClick={onOpenSettings}
        className="flex flex-col items-center justify-center gap-1 px-1.5 sm:px-3 py-1 rounded-xl hover:bg-white/10 active:scale-95 transition text-green-100 min-w-[50px] sm:min-w-[66px] cursor-pointer"
        title="הגדרות המשחק"
      >
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#076324] flex items-center justify-center border border-white/20 shadow-md">
          <SettingsIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" />
        </div>
        <span className="text-xs sm:text-[13px] font-semibold tracking-tight text-white/95">הגדרות</span>
      </button>
    </nav>
  );
};
