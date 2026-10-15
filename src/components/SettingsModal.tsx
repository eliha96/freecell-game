import React from 'react';
import { X, Volume2, VolumeX, Smartphone, Zap } from 'lucide-react';
import type { GameSettings } from '../engine/types';

interface SettingsModalProps {
  settings: GameSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-sm sm:max-w-md bg-[#044317] border-2 border-[#16a34a]/60 rounded-xl shadow-2xl p-5 text-white animate-in fade-in zoom-in-95 duration-150"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h2 className="text-lg sm:text-xl font-bold text-white">הגדרות המשחק</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 my-4">
          {/* Card Face Theme */}
          <div>
            <label className="block text-xs font-semibold text-green-200 mb-2">
              עיצוב חבילת הקלפים:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onUpdateSettings({ cardFaceTheme: 'windows95' })}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition ${
                  settings.cardFaceTheme === 'windows95'
                    ? 'bg-emerald-700/80 border-amber-300 ring-2 ring-amber-300 shadow-md'
                    : 'bg-black/25 border-white/15 hover:bg-black/40'
                }`}
              >
                <span className="font-bold text-sm text-white">Windows 95</span>
                <span className="text-[11px] text-green-200/80 mt-0.5">פיקסל-ארט מקורי</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ cardFaceTheme: 'standard' })}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition ${
                  settings.cardFaceTheme === 'standard'
                    ? 'bg-emerald-700/80 border-amber-300 ring-2 ring-amber-300 shadow-md'
                    : 'bg-black/25 border-white/15 hover:bg-black/40'
                }`}
              >
                <span className="font-bold text-sm text-white">קלאסי תקני</span>
                <span className="text-[11px] text-green-200/80 mt-0.5">וקטורי נקי (Bicycle)</span>
              </button>
            </div>
          </div>

          {/* Auto-play Safe Cards */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/10">
            <div className="flex items-start gap-2.5">
              <Zap className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">העברה אוטומטית בטוחה</div>
                <div className="text-[11px] text-green-200/75 mt-0.5 leading-snug">
                  מעביר קלפים לבסיס רק כשאין בהם עוד צורך בלוח המשחק
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mr-3">
              <input
                type="checkbox"
                checked={settings.autoPlaySafeCards}
                onChange={(e) => onUpdateSettings({ autoPlaySafeCards: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-black/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/10">
            <div className="flex items-center gap-2.5">
              {settings.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-white/50" />
              )}
              <div>
                <div className="font-semibold text-sm">צלילי משחק</div>
                <div className="text-[11px] text-green-200/75">
                  רשרוש קלפים וצלילי סיום
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mr-3">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-black/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Haptics Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/10">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-cyan-300" />
              <div>
                <div className="font-semibold text-sm">רטט במגע (Haptics)</div>
                <div className="text-[11px] text-green-200/75">
                  משוב רטט עדין בהזזת קלפים במסכי מגע
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mr-3">
              <input
                type="checkbox"
                checked={settings.hapticsEnabled}
                onChange={(e) => onUpdateSettings({ hapticsEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-black/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 py-2.5 rounded-lg font-semibold shadow transition"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
