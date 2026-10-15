import React from 'react';
import { Hash, Clock, Footprints } from 'lucide-react';

interface HeaderBarProps {
  dealNumber: number;
  movesCount: number;
  elapsedSeconds: number;
  onOpenSelectDeal: () => void;
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
  onOpenSelectDeal,
}) => {
  return (
    <header className="w-full bg-[#044317]/95 border-b border-[#0f8b3c]/40 text-white px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between shadow-md select-none shrink-0 z-40 pt-safe">
      {/* Deal Number Selector Button */}
      <button
        onClick={onOpenSelectDeal}
        className="flex items-center gap-1.5 bg-[#076324] hover:bg-[#0a7a2e] active:scale-95 px-2.5 py-1 rounded-lg border border-white/20 text-xs sm:text-sm font-bold tracking-wide shadow transition"
        title="בחר מספר משחק (1 עד 32,000)"
      >
        <Hash className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        <span>משחק #{dealNumber}</span>
      </button>

      {/* Stats HUD: Timer & Moves */}
      <div className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm text-green-100">
        <div className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-md border border-white/10">
          <Clock className="w-3.5 h-3.5 text-green-300 shrink-0" />
          <span className="font-mono font-bold text-white min-w-[38px] text-center">
            {formatTime(elapsedSeconds)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-md border border-white/10">
          <Footprints className="w-3.5 h-3.5 text-green-300 shrink-0" />
          <span className="font-mono font-bold text-white min-w-[20px] text-center">
            {movesCount}
          </span>
        </div>
      </div>
    </header>
  );
};
