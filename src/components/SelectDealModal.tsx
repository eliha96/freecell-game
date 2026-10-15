import React, { useState } from 'react';
import { X, Dices, Play } from 'lucide-react';
import { getRandomDealNumber } from '../engine/dealGenerator';

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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = parseInt(dealInput.trim(), 10);
    if (isNaN(num) || num < 1 || num > 32000) {
      setErrorMsg('אנא הזן מספר משחק תקין בין 1 ל-32,000');
      return;
    }
    setErrorMsg(null);
    onSelectDeal(num);
    onClose();
  };

  const handleRandom = () => {
    const randomDeal = getRandomDealNumber();
    onSelectDeal(randomDeal);
    onClose();
  };

  const handlePreset = (num: number) => {
    onSelectDeal(num);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-sm sm:max-w-md bg-[#044317] border-2 border-[#16a34a]/60 rounded-xl shadow-2xl p-5 text-white animate-in fade-in zoom-in-95 duration-150"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <span>בחר מספר משחק (Deal)</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-green-200/80 my-3 leading-relaxed">
          חלוקת הקלפים תואמת 100% למשחק ה-Windows המקורי (עסקאות 1 עד 32,000).
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-green-100 mb-1.5">
              מספר משחק:
            </label>
            <input
              type="number"
              min="1"
              max="32000"
              value={dealInput}
              onChange={(e) => {
                setDealInput(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full bg-[#032a0f] border border-green-500/40 rounded-lg px-3.5 py-2.5 text-lg font-mono text-center text-white focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="1 - 32000"
              autoFocus
            />
            {errorMsg && (
              <p className="text-rose-300 text-xs mt-1.5 font-medium">{errorMsg}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 py-2.5 rounded-lg font-semibold shadow transition"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>הפעל משחק</span>
            </button>
            <button
              type="button"
              onClick={handleRandom}
              className="flex items-center justify-center gap-2 bg-[#076324] hover:bg-[#0a7a2e] active:scale-98 px-4 py-2.5 rounded-lg font-semibold border border-white/20 shadow transition text-green-100"
            >
              <Dices className="w-4 h-4" />
              <span>אקראי</span>
            </button>
          </div>
        </form>

        {/* Presets */}
        <div className="mt-5 pt-3 border-t border-white/10">
          <p className="text-xs font-semibold text-green-300 mb-2">משחקים מיוחדים:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handlePreset(1)}
              className="bg-black/20 hover:bg-black/40 border border-white/10 rounded-md p-2 text-right transition"
            >
              <div className="font-bold text-amber-300">משחק #1</div>
              <div className="text-[11px] text-green-200/70">הקלאסי המקורי</div>
            </button>
            <button
              onClick={() => handlePreset(617)}
              className="bg-black/20 hover:bg-black/40 border border-white/10 rounded-md p-2 text-right transition"
            >
              <div className="font-bold text-amber-300">משחק #617</div>
              <div className="text-[11px] text-green-200/70">אתגר פופולרי</div>
            </button>
            <button
              onClick={() => handlePreset(11982)}
              className="bg-black/20 hover:bg-black/40 border border-white/10 rounded-md p-2 text-right transition"
            >
              <div className="font-bold text-rose-300">משחק #11982</div>
              <div className="text-[11px] text-green-200/70">הבלתי פתיר הידוע!</div>
            </button>
            <button
              onClick={() => handlePreset(31415)}
              className="bg-black/20 hover:bg-black/40 border border-white/10 rounded-md p-2 text-right transition"
            >
              <div className="font-bold text-amber-300">משחק #31415</div>
              <div className="text-[11px] text-green-200/70">משחק Pi</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
