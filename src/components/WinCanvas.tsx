import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy } from 'lucide-react';
import { sounds } from '../engine/sound';

interface WinCanvasProps {
  dealNumber: number;
  movesCount: number;
  elapsedSeconds: number;
  onNewGame: () => void;
  onReplayDeal: () => void;
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const WinCanvas: React.FC<WinCanvasProps> = ({
  dealNumber,
  movesCount,
  elapsedSeconds,
  onNewGame,
  onReplayDeal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    sounds.playWinFanfare();

    // Trigger celebratory confetti
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none w-full h-full z-10"
      />

      <div
        className="relative z-20 w-full max-w-sm bg-[#044317] border-2 border-amber-400/80 rounded-2xl shadow-2xl p-6 text-white text-center animate-in fade-in zoom-in-95 duration-200"
        dir="rtl"
      >
        <div className="w-16 h-16 bg-amber-400/20 border-2 border-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
          <Trophy className="w-9 h-9 text-amber-300" />
        </div>

        <h2 className="text-2xl font-black text-amber-300 tracking-wide mb-1">
          ניצחון מזהיר!
        </h2>
        <p className="text-xs text-green-200/90 mb-5">
          סיימת את משחק #{dealNumber} בהצלחה!
        </p>

        <div className="grid grid-cols-2 gap-3 bg-black/30 p-3.5 rounded-xl border border-white/10 mb-6 text-sm">
          <div className="flex flex-col items-center">
            <span className="text-xs text-green-300/80">זמן משחק</span>
            <span className="text-lg font-mono font-bold text-white mt-0.5">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-green-300/80">מספר מהלכים</span>
            <span className="text-lg font-mono font-bold text-white mt-0.5">
              {movesCount}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={onNewGame}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 py-3 rounded-xl font-bold text-base shadow-lg transition"
          >
            <RotateCcw className="w-5 h-5" />
            <span>משחק חדש</span>
          </button>
          <button
            onClick={onReplayDeal}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 active:scale-98 py-2.5 rounded-xl font-semibold text-sm border border-white/15 transition text-green-100"
          >
            <span>שחק שוב באותו לוח (#{dealNumber})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
