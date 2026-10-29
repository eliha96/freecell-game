import React from 'react';
import { X, Volume2, VolumeX, Smartphone, Zap, Palette, Eye } from 'lucide-react';
import type { CardFaceTheme, GameSettings } from '../engine/types';
import { sounds } from '../engine/sound';

interface SettingsModalProps {
  settings: GameSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

const CARD_FACE_OPTIONS: {
  id: CardFaceTheme;
  label: string;
  desc: string;
  badge?: string;
  previewRank: string;
  previewSuit: string;
  previewColor: string;
}[] = [
  {
    id: 'large-print',
    label: 'מספרים ענקיים',
    desc: 'ספרות ענק וסמל מודגש יחיד במרכז לקריאות מרבית',
    badge: 'קריאות מרבית ⭐',
    previewRank: 'A',
    previewSuit: '♠',
    previewColor: '#0a0a0a',
  },
  {
    id: 'four-color',
    label: '4 צבעים נגיש',
    desc: 'ספרות ענק וצבע מובחן לכל צורה (♥ אדום, ♠ שחור, ♦ כחול, ♣ ירוק)',
    badge: 'נגישות גבוהה',
    previewRank: 'K',
    previewSuit: '♦',
    previewColor: '#2563eb',
  },
  {
    id: 'modern-bold',
    label: 'מודרני בולט',
    desc: 'טיפוגרפיה גדולה ומודרנית בעיצוב חד וברור',
    previewRank: 'Q',
    previewSuit: '♥',
    previewColor: '#e11d48',
  },
  {
    id: 'windows95',
    label: 'Windows 95',
    desc: 'הפיקסל-ארט הרטרו המקורי מ-cards.dll',
    previewRank: '10',
    previewSuit: '♣',
    previewColor: '#1a1a1a',
  },
  {
    id: 'standard',
    label: 'קלאסי תקני (Bicycle)',
    desc: 'איורים וקטוריים מלאים עם ריבוי סמלים',
    previewRank: 'J',
    previewSuit: '♠',
    previewColor: '#1a1a1a',
  },
];

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
        className="w-full max-w-sm sm:max-w-md bg-[#044317] border-2 border-[#16a34a]/60 rounded-xl shadow-2xl p-5 text-white animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-white">הגדרות המשחק</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 my-3 overflow-y-auto pr-0.5">
          {/* Card Face Theme */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-green-200 mb-2">
              <Palette className="w-4 h-4 text-amber-300" />
              <span>עיצוב חבילת הקלפים (ערכות נושא):</span>
            </label>
            <div className="space-y-2">
              {CARD_FACE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdateSettings({ cardFaceTheme: opt.id })}
                  className={`relative w-full flex items-center p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                    settings.cardFaceTheme === opt.id
                      ? 'bg-emerald-700/90 border-amber-300 ring-2 ring-amber-300 shadow-md scale-[1.01]'
                      : 'bg-black/25 border-white/15 hover:bg-black/40 text-green-100 opacity-80 hover:opacity-100'
                  }`}
                >
                  {opt.badge && (
                    <span className="absolute -top-1.5 left-3 bg-amber-500 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                      {opt.badge}
                    </span>
                  )}
                  <div className="flex items-center gap-3 w-full">
                    {/* Mini preview card */}
                    <div
                      className="w-8 h-11 bg-white rounded shadow-sm border border-gray-300 flex flex-col items-center justify-between p-0.5 shrink-0 select-none"
                      style={{ color: opt.previewColor }}
                    >
                      <span className="font-black text-[11px] leading-none">{opt.previewRank}</span>
                      <span className="text-[12px] leading-none">{opt.previewSuit}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white leading-tight">{opt.label}</div>
                      <div className="text-[11px] text-green-200/80 mt-0.5 leading-snug">{opt.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
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

          {/* Dim Covered Cards Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/10">
            <div className="flex items-start gap-2.5">
              <Eye className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">הדגשת השורה הפתוחה למשחק</div>
                <div className="text-[11px] text-green-200/75 mt-0.5 leading-snug">
                  משאיר את שורת הקלפים הפתוחה בצבע מלא ומחשיך מעט קלפים מכוסים בטורים
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mr-3">
              <input
                type="checkbox"
                checked={settings.dimCoveredCards ?? true}
                onChange={(e) => onUpdateSettings({ dimCoveredCards: e.target.checked })}
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
                onChange={(e) => {
                  const checked = e.target.checked;
                  onUpdateSettings({ soundEnabled: checked });
                  if (checked) {
                    sounds.unlockAudio();
                    sounds.setMuted(false);
                    sounds.playCardFlip();
                  } else {
                    sounds.setMuted(true);
                  }
                }}
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
                onChange={(e) => {
                  const checked = e.target.checked;
                  onUpdateSettings({ hapticsEnabled: checked });
                  if (checked) {
                    sounds.setHapticsEnabled(true);
                    sounds.triggerHaptic(40);
                  } else {
                    sounds.setHapticsEnabled(false);
                  }
                }}
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
