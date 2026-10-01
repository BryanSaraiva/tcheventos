import React, { useState, useEffect } from 'react';
import type { Activity, ActivityFormData, ActivityCategory, EventTrack } from '../types/event';
import { DEFAULT_TRACKS, DEFAULT_CATEGORIES, GOOGLE_SHEETS_PALETTE } from '../constants/eventDefaults';

interface ActivityModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  activity: Activity | null;
  onClose: () => void;
  onSave: (data: ActivityFormData) => void;
  availableTracks?: string[];
  availableDates?: string[];
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  mode,
  activity,
  onClose,
  onSave,
  availableTracks = DEFAULT_TRACKS,
}) => {
  const [formData, setFormData] = useState<ActivityFormData>({
    date: new Date().toISOString().slice(0, 10),
    startTime: '14:00',
    endTime: '15:00',
    track: DEFAULT_TRACKS[0],
    title: '',
    category: DEFAULT_CATEGORIES[0],
    color: '#3c78d8',
    notes: '',
  });

  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && activity) {
        setFormData({
          id: activity.id,
          date: activity.date,
          startTime: activity.startTime,
          endTime: activity.endTime,
          track: activity.track,
          title: activity.title,
          category: activity.category,
          color: activity.color || '#3c78d8',
          notes: activity.notes || '',
        });
      } else {
        setFormData({
          date: activity?.date || new Date().toISOString().slice(0, 10),
          startTime: '14:00',
          endTime: '15:00',
          track: availableTracks[0] || DEFAULT_TRACKS[0],
          title: '',
          category: DEFAULT_CATEGORIES[0],
          color: '#3c78d8',
          notes: '',
        });
      }
      setErrorMessage('');
      setShowColorPicker(false);
    }
  }, [isOpen, mode, activity, availableTracks]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setErrorMessage('Por favor, informe o título da atividade.');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      setErrorMessage(' O horário de término deve ser posterior ao horário de início.');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-700 transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <i className={`fa-solid ${mode === 'edit' ? 'fa-pen-to-square' : 'fa-calendar-plus'} text-lg`}></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {mode === 'edit' ? 'Editar Atividade' : 'Nova Atividade'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'edit' ? 'Atualize as informações do cronograma' : 'Adicione uma nova sessão ao evento'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Validation Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation flex-shrink-0"></i>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Título da Atividade <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Palestra Magna de Inovação"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition outline-none"
              required
            />
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Data
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Início
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Término
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Track & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Espaço / Trilha
              </label>
              <select
                name="track"
                value={formData.track}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {availableTracks.map((trk) => (
                  <option key={trk} value={trk}>
                    {trk}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Categoria
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Cor de Destaque
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <span
                  className="w-5 h-5 rounded-full border border-black/20 inline-block shadow-sm"
                  style={{ backgroundColor: formData.color }}
                />
                <span>Escolher Cor</span>
                <i className={`fa-solid fa-chevron-${showColorPicker ? 'up' : 'down'} text-[10px] ml-1`}></i>
              </button>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                {formData.color}
              </span>
            </div>

            {/* Google Sheets Palette Picker Popover */}
            {showColorPicker && (
              <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5 shadow-inner">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                </div>
                {GOOGLE_SHEETS_PALETTE.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-1 justify-between">
                    {row.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, color: hex }));
                          setShowColorPicker(false);
                        }}
                        className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 ${
                          formData.color === hex
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

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Notas / Descrição Detalhada
            </label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Ex: Detalhes dos palestrantes, equipamentos necessários ou observações técnicas..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 active:scale-95"
            >
              <i className="fa-solid fa-check"></i>
              <span>{mode === 'edit' ? 'Salvar Alterações' : 'Criar Atividade'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};