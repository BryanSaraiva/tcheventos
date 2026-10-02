import React, { useEffect, useRef, useState } from 'react';
import type { Activity, ActivityFormData } from '../types/event';
import { GOOGLE_SHEETS_PALETTE } from '../constants/eventDefaults';

interface CreatableComboboxProps {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  usageCounts?: Record<string, number>;
  onChange: (value: string) => void;
  onRenameOption?: (oldValue: string, newValue: string) => void;
  onDeleteOption?: (value: string) => void;
  required?: boolean;
}

const CreatableCombobox: React.FC<CreatableComboboxProps> = ({
  label,
  value,
  options,
  placeholder,
  usageCounts = {},
  onChange,
  onRenameOption,
  onDeleteOption,
  required = false,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setEditingOption(null);
        setDeleteCandidate(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(normalizedQuery)
  );

  const exactMatchExists = options.some(
    (option) => option.trim().toLowerCase() === normalizedQuery
  );

  const openCombobox = () => {
    setQuery(value);
    setIsOpen(true);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const selectValue = (option: string) => {
    onChange(option);
    setQuery(option);
    setIsOpen(false);
    setEditingOption(null);
    setDeleteCandidate(null);
  };

  const createValue = () => {
    const newValue = query.trim();

    if (!newValue) return;

    // IMPORTANT:
    // This only changes the activity draft.
    // The parent commits the option globally when the activity is saved.
    selectValue(newValue);
  };

  const startEditing = (option: string) => {
    setEditingOption(option);
    setEditingValue(option);
    setDeleteCandidate(null);
  };

  const cancelEditing = () => {
    setEditingOption(null);
    setEditingValue('');
  };

  const commitRename = (oldValue: string) => {
    const newValue = editingValue.trim();

    if (!newValue) return;

    const duplicateExists = options.some(
      (option) =>
        option !== oldValue &&
        option.toLowerCase() === newValue.toLowerCase()
    );

    if (duplicateExists) {
      return;
    }

    onRenameOption?.(oldValue, newValue);

    if (value === oldValue) {
      onChange(newValue);
    }

    setEditingOption(null);
    setEditingValue('');
  };

  const requestDelete = (option: string) => {
    const usageCount = usageCounts[option] || 0;

    if (usageCount === 0) {
      onDeleteOption?.(option);

      if (value === option) {
        onChange('');
        setQuery('');
      }

      return;
    }

    setDeleteCandidate(option);
    setEditingOption(null);
  };

  const confirmDelete = (option: string) => {
    onDeleteOption?.(option);

    if (value === option) {
      onChange('');
      setQuery('');
    }

    setDeleteCandidate(null);
  };

  return (
    <div ref={rootRef} className="relative">
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? query : value}
          onFocus={openCombobox}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setDeleteCandidate(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              setQuery(value);
              setEditingOption(null);
              setDeleteCandidate(null);
            }

            if (e.key === 'Enter') {
              e.preventDefault();

              if (editingOption) {
                commitRename(editingOption);
                return;
              }

              if (query.trim() && !exactMatchExists) {
                createValue();
              }
            }
          }}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 pr-9 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          required={required}
        />

        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
            } else {
              openCombobox();
            }
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          tabIndex={-1}
        >
          <i
            className={`fa-solid ${
              isOpen ? 'fa-chevron-up' : 'fa-chevron-down'
            } text-[10px]`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto p-1.5">
            {filteredOptions.map((option) => {
              const usageCount = usageCounts[option] || 0;
              const isEditing = editingOption === option;
              const isDeletePending = deleteCandidate === option;

              return (
                <div
                  key={option}
                  className="rounded-lg"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-700/60">
                      <input
                        autoFocus
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            commitRename(option);
                          }

                          if (e.key === 'Escape') {
                            cancelEditing();
                          }
                        }}
                        className="flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />

                      <button
                        type="button"
                        onClick={() => commitRename(option)}
                        className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                        title="Salvar"
                      >
                        <i className="fa-solid fa-check text-xs" />
                      </button>

                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600"
                        title="Cancelar"
                      >
                        <i className="fa-solid fa-xmark text-xs" />
                      </button>
                    </div>
                  ) : isDeletePending ? (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 rounded-lg">
                      <div className="text-[11px] text-rose-700 dark:text-rose-300 leading-relaxed">
                        Esta opção é usada em{' '}
                        <strong>{usageCount}</strong>{' '}
                        {usageCount === 1 ? 'atividade' : 'atividades'}.
                        Remover de todas?
                      </div>

                      <div className="flex items-center justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(null)}
                          className="px-2.5 py-1.5 rounded-md text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-700"
                        >
                          Cancelar
                        </button>

                        <button
                          type="button"
                          onClick={() => confirmDelete(option)}
                          className="px-2.5 py-1.5 rounded-md text-[10px] font-semibold text-white bg-rose-600 hover:bg-rose-700"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => selectValue(option)}
                        className={`flex-1 min-w-0 text-left px-3 py-2.5 rounded-lg text-xs transition ${
                          value === option
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className="truncate block">
                          {option}
                        </span>
                      </button>

                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                        <button
                          type="button"
                          onClick={() => startEditing(option)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700"
                          title="Editar opção"
                        >
                          <i className="fa-solid fa-pen text-[10px]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => requestDelete(option)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                          title="Excluir opção"
                        >
                          <i className="fa-solid fa-trash text-[10px]" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {query.trim() && !exactMatchExists && (
              <button
                type="button"
                onClick={createValue}
                className="w-full mt-1 px-3 py-2.5 rounded-lg text-left text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-t border-slate-100 dark:border-slate-700"
              >
                <i className="fa-solid fa-plus mr-2 text-[10px]" />
                Criar "{query.trim()}"
              </button>
            )}

            {filteredOptions.length === 0 && !query.trim() && (
              <div className="px-3 py-3 text-[11px] text-slate-400 dark:text-slate-500 text-center">
                Nenhuma opção cadastrada.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ActivityModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  activity: Activity | null;
  onClose: () => void;
  onSave: (data: ActivityFormData) => void;

  availableTracks?: string[];
  availableCategories?: string[];

  trackUsageCounts?: Record<string, number>;
  categoryUsageCounts?: Record<string, number>;

  onRenameTrack?: (oldValue: string, newValue: string) => void;
  onDeleteTrack?: (value: string) => void;

  onRenameCategory?: (oldValue: string, newValue: string) => void;
  onDeleteCategory?: (value: string) => void;

  availableDates?: string[];
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  mode,
  activity,
  onClose,
  onSave,

  availableTracks = [],
  availableCategories = [],

  trackUsageCounts = {},
  categoryUsageCounts = {},

  onRenameTrack,
  onDeleteTrack,

  onRenameCategory,
  onDeleteCategory,
}) => {
const [formData, setFormData] = useState<ActivityFormData>({
  date: new Date().toISOString().slice(0, 10),
  startTime: '14:00',
  endTime: '15:00',
  track: '',
  title: '',
  category: '',
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
  track: '',
  title: '',
  category: '',
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

    if (!formData.track.trim()) {
  setErrorMessage('Por favor, informe o Espaço / Trilha.');
  return;
}

if (!formData.category.trim()) {
  setErrorMessage('Por favor, informe a Categoria.');
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
  <CreatableCombobox
    label="Espaço / Trilha"
    value={formData.track}
    options={availableTracks}
    usageCounts={trackUsageCounts}
    placeholder="Digite ou selecione..."
    required
    onChange={(value) => {
      setFormData((prev) => ({
        ...prev,
        track: value,
      }));
    }}
    onRenameOption={onRenameTrack}
    onDeleteOption={onDeleteTrack}
  />

  <CreatableCombobox
    label="Categoria"
    value={formData.category}
    options={availableCategories}
    usageCounts={categoryUsageCounts}
    placeholder="Digite ou selecione..."
    required
    onChange={(value) => {
      setFormData((prev) => ({
        ...prev,
        category: value,
      }));
    }}
    onRenameOption={onRenameCategory}
    onDeleteOption={onDeleteCategory}
  />
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