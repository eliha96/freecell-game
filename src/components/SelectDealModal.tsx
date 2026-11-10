import React, { useState } from 'react';
import { X, Dices, Play, Sparkles } from 'lucide-react';
import type { DifficultyLevel } from '../engine/types';
import {
  getDealDifficulty,
  getRandomDealByDifficulty,
  DIFFICULTY_CONFIG,
} from '../engine/difficulty';

interface SelectDealModalProps {
  currentDeal: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectDeal: (dealNumber: number) => void;
}

export const SelectDealModal: React.FC<SelectDealModalProps> = ({
  currentDeal,
  isOpen,
  onClose,
  onSelectDeal,
}) => {
  const [dealInput, setDealInput] = useState<string>(currentDeal.toString());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const parsedNum = parseInt(dealInput.trim(), 10);
  const isValidNum = !isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 32000;
  const liveDifficulty = isValidNum ? getDealDifficulty(parsedNum) : null;
  const liveDiffConfig = liveDifficulty ? DIFFICULTY_CONFIG[liveDifficulty] : null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValidNum) {
      setErrorMsg('אנא הזן מספר משחק תקין בין 1 ל-32,000');
      return;
    }
    setErrorMsg(null);
    onSelectDeal(parsedNum);
    onClose();
  };

  const handleDifficultySelect = (diff: DifficultyLevel | 'all') => {
    const chosen = getRandomDealByDifficulty(diff);
    onSelectDeal(chosen);
    onClose();
  };

  const handlePreset = (num: number) => {
    onSelectDeal(num);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-sm sm:max-w-md bg-[#044317] border-2 border-[#16a34a]/60 rounded-xl shadow-2xl p-5 text-white animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <span>בחירת משחק ורמת קושי</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION 1: Launch by Difficulty Level */}
        <div className="my-3.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-green-200 mb-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>התחל משחק לפי רמת קושי:</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDifficultySelect('easy')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 hover:bg-emerald-800/80 active:scale-95 transition text-center shadow cursor-pointer group"
            >
              <span className="text-base sm:text-lg mb-0.5">🟢</span>
              <span className="text-sm font-bold text-emerald-300 group-hover:text-white">קל</span>
              <span className="text-[10px] text-emerald-200/70 mt-0.5">זורם ונגיש</span>
            </button>

            <button
              type="button"
              onClick={() => handleDifficultySelect('medium')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-amber-950/70 border border-amber-500/50 hover:bg-amber-800/80 active:scale-95 transition text-center shadow cursor-pointer group"
            >
              <span className="text-base sm:text-lg mb-0.5">🟡</span>
              <span className="text-sm font-bold text-amber-300 group-hover:text-white">בינוני</span>
              <span className="text-[10px] text-amber-200/70 mt-0.5">קלאסי מאוזן</span>
            </button>

            <button
              type="button"
              onClick={() => handleDifficultySelect('hard')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 hover:bg-rose-800/80 active:scale-95 transition text-center shadow cursor-pointer group"
            >
              <span className="text-base sm:text-lg mb-0.5">🔴</span>
              <span className="text-sm font-bold text-rose-300 group-hover:text-white">קשה</span>
              <span className="text-[10px] text-rose-200/70 mt-0.5">אתגר מעמיק</span>
            </button>
          </div>
        </div>

        {/* SECTION 2: Manual Deal Number Input */}
        <div className="pt-3 border-t border-white/10">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-green-100 mb-1.5">
                או הזן מספר משחק ספציפי (1 עד 32,000):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="32000"
                  value={dealInput}
                  onChange={(e) => {
                    setDealInput(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full bg-[#032a0f] border border-green-500/40 rounded-lg px-3.5 py-2 text-lg font-mono text-center text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="1 - 32000"
                />
              </div>

              {/* Real-time difficulty indicator */}
              {liveDiffConfig && (
                <div className="flex items-center justify-center gap-2 mt-2 text-xs">
                  <span className="text-green-200/80">רמת קושי זוהתה:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded border text-[11px] ${liveDiffConfig.bgClass} ${liveDiffConfig.colorClass} ${liveDiffConfig.borderClass}`}
                  >
                    {parsedNum === 11982 ? 'בלתי פתיר 💀' : liveDiffConfig.badge}
                  </span>
                </div>
              )}

              {errorMsg && (
                <p className="text-rose-300 text-xs mt-1.5 font-medium text-center">{errorMsg}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 py-2 rounded-lg font-semibold shadow transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>הפעל משחק #{isValidNum ? parsedNum : ''}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDifficultySelect('all')}
                className="flex items-center justify-center gap-1.5 bg-[#076324] hover:bg-[#0a7a2e] active:scale-98 px-3.5 py-2 rounded-lg font-semibold border border-white/20 shadow transition text-green-100 cursor-pointer"
                title="הגרל משחק אקראי מכל 32,000 המשחקים"
              >
                <Dices className="w-4 h-4" />
                <span>אקראי</span>
              </button>
            </div>
          </form>
        </div>

        {/* SECTION 3: Famous Curated Deals */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-xs font-semibold text-green-300 mb-2">משחקים מומלצים ומיוחדים:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handlePreset(164)}
              className="bg-black/25 hover:bg-black/40 border border-white/10 rounded-lg p-2 text-right transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300">משחק #164</span>
                <span className="text-[10px] text-emerald-300 font-semibold">קל 🟢</span>
              </div>
              <div className="text-[11px] text-green-200/70 mt-0.5">פתיר ללא תאים חופשיים!</div>
            </button>
            <button
              onClick={() => handlePreset(1)}
              className="bg-black/25 hover:bg-black/40 border border-white/10 rounded-lg p-2 text-right transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300">משחק #1</span>
                <span className="text-[10px] text-amber-300 font-semibold">בינוני 🟡</span>
              </div>
              <div className="text-[11px] text-green-200/70 mt-0.5">המשחק הקלאסי המקורי</div>
            </button>
            <button
              onClick={() => handlePreset(617)}
              className="bg-black/25 hover:bg-black/40 border border-white/10 rounded-lg p-2 text-right transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300">משחק #617</span>
                <span className="text-[10px] text-rose-300 font-semibold">קשה 🔴</span>
              </div>
              <div className="text-[11px] text-green-200/70 mt-0.5">אתגר פופולרי ומתוחכם</div>
            </button>
            <button
              onClick={() => handlePreset(11982)}
              className="bg-black/25 hover:bg-black/40 border border-white/10 rounded-lg p-2 text-right transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-300">משחק #11982</span>
                <span className="text-[10px] text-rose-300 font-semibold">בלתי פתיר 💀</span>
              </div>
              <div className="text-[11px] text-green-200/70 mt-0.5">היחיד מ-32,000 שלא ניתן לפתור</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
