import React, { useEffect, useRef, useState } from 'react';

export interface CreatableComboboxProps {
  label: string;
  value: string;
  options: string[];
  placeholder: string;

  usageCounts: Record<string, number>;

  onChange: (value: string) => void;
  onRenameOption: (oldValue: string, newValue: string) => void;
  onDeleteOption: (value: string) => void;

  required?: boolean;
}

export const CreatableCombobox: React.FC<CreatableComboboxProps> = ({
  label,
  value,
  options,
  placeholder,
  usageCounts,
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

    // This only changes the activity draft.
    // The parent persists it when the activity is saved.
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

    if (!newValue || newValue === oldValue) {
      cancelEditing();
      return;
    }

    const duplicateExists = options.some(
      (option) =>
        option !== oldValue &&
        option.toLowerCase() === newValue.toLowerCase()
    );

    if (duplicateExists) {
      return;
    }

    // Global rename happens immediately.
    onRenameOption(oldValue, newValue);

    // Keep the currently selected activity draft in sync.
    if (value === oldValue) {
      onChange(newValue);
      setQuery(newValue);
    }

    setEditingOption(null);
    setEditingValue('');
  };

  const requestDelete = (option: string) => {
    const usageCount = usageCounts[option] || 0;

    // Unused option: delete immediately.
    if (usageCount === 0) {
      onDeleteOption(option);

      if (value === option) {
        onChange('');
        setQuery('');
      }

      return;
    }

    // Used option: show confirmation.
    setDeleteCandidate(option);
    setEditingOption(null);
  };

  const confirmDelete = (option: string) => {
    onDeleteOption(option);

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
          required={required}
          className="w-full px-3 py-2.5 pr-9 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
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

              if (isEditing) {
                return (
                  <div
                    key={option}
                    className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-700/60 rounded-lg"
                  >
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
                );
              }

              if (isDeletePending) {
                return (
                  <div
                    key={option}
                    className="p-2.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 rounded-lg"
                  >
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
                );
              }

              return (
                <div
                  key={option}
                  className="group flex items-center gap-1 rounded-lg"
                >
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