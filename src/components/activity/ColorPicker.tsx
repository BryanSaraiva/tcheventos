import React from 'react';
import { GOOGLE_SHEETS_PALETTE } from '../../constants/eventDefaults';

interface ColorPickerProps {
  value: string;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  isOpen,
  onToggle,
  onChange,
}) => {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
        Cor de Destaque
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <span
            className="w-5 h-5 rounded-full border border-black/20 inline-block shadow-sm"
            style={{ backgroundColor: value }}
          />

          <span>Escolher Cor</span>

          <i
            className={`fa-solid fa-chevron-${
              isOpen ? 'up' : 'down'
            } text-[10px] ml-1`}
          />
        </button>

        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {value}
        </span>
      </div>

      {isOpen && (
        <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5 shadow-inner">
          {GOOGLE_SHEETS_PALETTE.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="flex gap-1 justify-between"
            >
              {row.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => {
                    onChange(hex);
                    onToggle();
                  }}
                  className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 ${
                    value === hex
                      ? 'ring-2 ring-emerald-500 ring-offset-1 border-white'
                      : 'border-black/10'
                  }`}
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};