import React from 'react';
import { Hash, Clock, Footprints, Trophy } from 'lucide-react';
import type { DifficultyLevel } from '../engine/types';
import { DIFFICULTY_CONFIG } from '../engine/difficulty';

interface HeaderBarProps {
  dealNumber: number;
  difficulty?: DifficultyLevel;
  movesCount: number;
  elapsedSeconds: number;
  score: number;
  onOpenSelectDeal: () => void;
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  dealNumber,
  difficulty = 'medium',
  movesCount,
  elapsedSeconds,
  score,
  onOpenSelectDeal,
}) => {
  const diffInfo = DIFFICULTY_CONFIG[difficulty];

  return (
    <header className="w-full bg-[#044317]/95 border-b border-[#0f8b3c]/40 text-white px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between shadow-md select-none shrink-0 z-40 pt-safe">
      {/* Deal Number Selector Button with Difficulty Badge */}
      <button
        onClick={onOpenSelectDeal}
        className="flex items-center gap-1.5 sm:gap-2 bg-[#076324] hover:bg-[#0a7a2e] active:scale-95 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-white/20 text-xs sm:text-sm font-bold tracking-wide shadow transition cursor-pointer"
        title="בחר מספר משחק או רמת קושי"
      >
        <Hash className="w-4 h-4 text-amber-300 shrink-0" />
        <span>משחק #{dealNumber}</span>
        {diffInfo && (
          <span
            className={`text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-md border ${diffInfo.bgClass} ${diffInfo.colorClass} ${diffInfo.borderClass} mr-1`}
          >
            {diffInfo.badge}
          </span>
        )}
      </button>

      {/* Stats HUD: Score, Timer & Moves */}
      <div className="flex items-center gap-2 sm:gap-3.5 text-xs sm:text-sm text-green-100">
        {/* Live Score */}
        <div
          className="flex items-center gap-1.5 sm:gap-2 bg-black/35 px-2.5 sm:px-3.5 py-1.5 rounded-lg border border-amber-400/30 shadow-inner"
          title="ניקוד נוכחי"
        >
          <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
          <span className="text-amber-200/90 text-xs font-medium hidden sm:inline">ניקוד:</span>
          <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm min-w-[36px] sm:min-w-[46px] text-center">
            {score.toLocaleString()}
          </span>
        </div>

        {/* Timer */}
        <div
          className="flex items-center gap-1.5 sm:gap-2 bg-black/30 px-2.5 sm:px-3 py-1.5 rounded-lg border border-white/15 shadow-inner"
          title="זמן משחק"
        >
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-300 shrink-0" />
          <span className="font-mono font-bold text-white text-xs sm:text-sm min-w-[40px] text-center">
            {formatTime(elapsedSeconds)}
          </span>
        </div>

        {/* Moves */}
        <div
          className="flex items-center gap-1.5 sm:gap-2 bg-black/30 px-2.5 sm:px-3 py-1.5 rounded-lg border border-white/15 shadow-inner"
          title="מספר מהלכים"
        >
          <Footprints className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-300 shrink-0" />
          <span className="font-mono font-bold text-white text-xs sm:text-sm min-w-[22px] text-center">
            {movesCount}
          </span>
        </div>
      </div>
    </header>
  );
};
