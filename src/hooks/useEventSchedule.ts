import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  Activity,
  ActivityFormData,
  FilterState,
  ViewMode,
  ToastNotification,
  ScheduleStats,
} from '../types/event';
import { DEFAULT_SAMPLE_ACTIVITIES } from '../constants/eventDefaults';
import {
  computeScheduleStats,
  exportActivitiesToCSV,
  parseCSVToActivities,
  getHeaderDateBadgeText,
} from '../utils/dateUtils';

import { exportActivitiesToMatrixXLSX } from '../utils/matrixExport';

const TITLE_KEY = 'tcheventos_event_title_1';
const ACTIVITIES_KEY = 'tcheventos_event_activities_v1';
const OPTIONS_KEY = 'tcheventos_event_options_v1';
const THEME_KEY = 'tcheventos_theme_dark_1';

interface EventOptionState {
  tracks: string[];
  categories: string[];
}

/**
 * Custom React Hook that encapsulates all state management logic for event schedule management
 */
export function useEventSchedule() {
  // Load activities from localStorage or fall back to sample defaults
  const [activities, setActivities] = useState<Activity[]>(() => {
    try {
      const saved = localStorage.getItem(ACTIVITIES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed to parse activities from localStorage:', err);
    }
    return DEFAULT_SAMPLE_ACTIVITIES;
  });

  const [eventOptions, setEventOptions] = useState<EventOptionState>(() => {
  try {
    const saved = localStorage.getItem(OPTIONS_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (
        parsed &&
        Array.isArray(parsed.tracks) &&
        Array.isArray(parsed.categories)
      ) {
        return {
          tracks: parsed.tracks,
          categories: parsed.categories,
        };
      }
    }
  } catch (err) {
    console.error('Failed to parse event options from localStorage:', err);
  }

  return {
    tracks: [],
    categories: [],
  };
});

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved !== null) {
        return JSON.parse(saved);
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Event title state
  const [eventTitle, setEventTitle] = useState<string>(() => {
    try {
      return localStorage.getItem(TITLE_KEY) || 'Cronograma Oficial';
    } catch {
      return 'Cronograma Oficial';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(TITLE_KEY, eventTitle);
    } catch (err) {
      console.error('Failed to save event title to localStorage:', err);
    }
  }, [eventTitle]);

  const handleSetEventTitle = useCallback((newTitle: string) => {
    setEventTitle(newTitle.slice(0, 100));
  }, []);

useEffect(() => {
  try {
    localStorage.setItem(TITLE_KEY, eventTitle);
  } catch (err) {
    console.error('Failed to save event title:', err);
  }
}, [eventTitle]);

useEffect(() => {
  try {
    localStorage.setItem(
      OPTIONS_KEY,
      JSON.stringify(eventOptions)
    );
  } catch (err) {
    console.error('Failed to save event options:', err);
  }
}, [eventOptions]);

  // Active view mode ('table' | 'timeline' | 'runofshow')
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    locationFilter: 'all',
    categoryFilter: 'all',
    filterDay: 'all',
  });

  // Modal dialog state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Sync dark mode HTML class and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, JSON.stringify(isDarkMode));
    } catch (e) {
      console.error('Failed to save theme setting:', e);
    }
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  // Auto-save activities array whenever it updates
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
    } catch (err) {
      console.error('Failed to save activities to localStorage:', err);
    }
  }, [activities]);

  const showToast = useCallback((message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'success') => {
    const iconClass =
      type === 'success'
        ? 'fa-circle-check'
        : type === 'danger'
        ? 'fa-triangle-exclamation'
        : type === 'warning'
        ? 'fa-circle-exclamation'
        : 'fa-circle-info';

    setToast({
      id: Date.now(),
      message,
      iconClass,
      type,
    });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // Extract list of all unique dates in current activities
  const availableDates = useMemo(() => {
    const datesSet = new Set<string>();
    activities.forEach((act) => {
      if (act.date) datesSet.add(act.date);
    });
    return Array.from(datesSet).sort();
  }, [activities]);

  // Extract list of all unique tracks in current activities
  const availableTracks = useMemo(() => {
  return [...eventOptions.tracks].sort((a, b) =>
    a.localeCompare(b)
  );
}, [eventOptions.tracks]);

const availableCategories = useMemo(() => {
  return [...eventOptions.categories].sort((a, b) =>
    a.localeCompare(b)
  );
}, [eventOptions.categories]);

const trackUsageCounts = useMemo(() => {
  const counts: Record<string, number> = {};

  activities.forEach((activity) => {
    if (!activity.track) return;

    counts[activity.track] =
      (counts[activity.track] || 0) + 1;
  });

  return counts;
}, [activities]);

const categoryUsageCounts = useMemo(() => {
  const counts: Record<string, number> = {};

  activities.forEach((activity) => {
    if (!activity.category) return;

    counts[activity.category] =
      (counts[activity.category] || 0) + 1;
  });

  return counts;
}, [activities]);

  // Header date range display string
  const headerDateBadgeText = useMemo(() => {
    return getHeaderDateBadgeText(availableDates);
  }, [availableDates]);

  // Filter activities dynamically based on active filters
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Day filter
      if (filters.filterDay !== 'all' && act.date !== filters.filterDay) {
        return false;
      }

      // Location / track filter
      if (filters.locationFilter !== 'all' && act.track !== filters.locationFilter) {
        return false;
      }

      // Category filter
      if (filters.categoryFilter !== 'all' && act.category !== filters.categoryFilter) {
        return false;
      }

      // Search query (title, notes, or track)
      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = act.title.toLowerCase().includes(query);
        const matchesNotes = act.notes.toLowerCase().includes(query);
        const matchesTrack = act.track.toLowerCase().includes(query);
        const matchesCategory = act.category.toLowerCase().includes(query);

        if (!matchesTitle && !matchesNotes && !matchesTrack && !matchesCategory) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Primary sort by date, secondary sort by start time
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  }, [activities, filters]);

  // Compute total duration and room conflict counts
  const scheduleStats: ScheduleStats = useMemo(() => {
    return computeScheduleStats(filteredActivities);
  }, [filteredActivities]);

  // Open creation modal
  const openAddModal = useCallback(() => {
    setEditingActivity(null);
    setModalMode('create');
    setIsModalOpen(true);
  }, []);

  // Open edit modal for an existing activity
  const openEditModal = useCallback((activity: Activity) => {
    setEditingActivity(activity);
    setModalMode('edit');
    setIsModalOpen(true);
  }, []);

  // Close modal dialog
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingActivity(null);
  }, []);

  const addOption = useCallback(
  (type: 'track' | 'category', value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) return;

    setEventOptions((prev) => {
      const key = type === 'track' ? 'tracks' : 'categories';
      const existing = prev[key];

      const alreadyExists = existing.some(
        (item) => item.toLowerCase() === trimmedValue.toLowerCase()
      );

      if (alreadyExists) {
        return prev;
      }

      return {
        ...prev,
        [key]: [...existing, trimmedValue],
      };
    });
  },
  []
);

const renameOption = useCallback(
  (
    type: 'track' | 'category',
    oldValue: string,
    newValue: string
  ) => {
    const trimmedNewValue = newValue.trim();

    if (!trimmedNewValue || oldValue === trimmedNewValue) {
      return;
    }

    const optionKey =
      type === 'track' ? 'tracks' : 'categories';

    const activityKey =
      type === 'track' ? 'track' : 'category';

    setEventOptions((prev) => {
      const existing = prev[optionKey];

      const nextOptions = existing.map((option) =>
        option === oldValue ? trimmedNewValue : option
      );

      return {
        ...prev,
        [optionKey]: nextOptions,
      };
    });

    // Rename it across every activity immediately.
    setActivities((prev) =>
      prev.map((activity) =>
        activity[activityKey] === oldValue
          ? {
              ...activity,
              [activityKey]: trimmedNewValue,
            }
          : activity
      )
    );
  },
  []
);

const deleteOption = useCallback(
  (
    type: 'track' | 'category',
    value: string
  ) => {
    const optionKey =
      type === 'track' ? 'tracks' : 'categories';

    const activityKey =
      type === 'track' ? 'track' : 'category';

    setEventOptions((prev) => ({
      ...prev,
      [optionKey]: prev[optionKey].filter(
        (option) => option !== value
      ),
    }));

    // Do NOT delete activities.
    // Clear the deleted option from activities that used it.
    setActivities((prev) =>
      prev.map((activity) =>
        activity[activityKey] === value
          ? {
              ...activity,
              [activityKey]: '',
            }
          : activity
      )
    );
  },
  []
);

const renameTrack = useCallback(
  (oldValue: string, newValue: string) =>
    renameOption('track', oldValue, newValue),
  [renameOption]
);

const renameCategory = useCallback(
  (oldValue: string, newValue: string) =>
    renameOption('category', oldValue, newValue),
  [renameOption]
);

const deleteTrack = useCallback(
  (value: string) => deleteOption('track', value),
  [deleteOption]
);

const deleteCategory = useCallback(
  (value: string) => deleteOption('category', value),
  [deleteOption]
);

  // Save activity (create or update)
const saveActivity = useCallback(
  (formData: ActivityFormData) => {
    // Commit newly used values to the option catalog ONLY when
    // the activity is actually saved.
    addOption('track', formData.track);
    addOption('category', formData.category);

    if (modalMode === 'edit' && formData.id) {
      setActivities((prev) =>
        prev.map((act) =>
          act.id === formData.id
            ? ({
                ...formData,
                id: formData.id,
              } as Activity)
            : act
        )
      );

      showToast('Atividade atualizada com sucesso!', 'success');
    } else {
      const newActivity: Activity = {
        ...formData,
        id: Date.now(),
      };

      setActivities((prev) => [
        ...prev,
        newActivity,
      ]);

      showToast(
        'Nova atividade adicionada ao cronograma!',
        'success'
      );
    }

    closeModal();
  },
  [
    modalMode,
    closeModal,
    showToast,
    addOption,
  ]
);

  // Delete an activity
  const deleteActivity = useCallback((id: number) => {
    setActivities((prev) => prev.filter((act) => act.id !== id));
    showToast('Atividade removida do cronograma.', 'info');
  }, [showToast]);

  // Clear all activities
  const clearAllActivities = useCallback(() => {
    if (window.confirm('Tem certeza de que deseja apagar TODAS as atividades do cronograma? Esta ação não pode ser desfeita.')) {
      setActivities([]);
      showToast('Todas as atividades foram apagadas.', 'warning');
    }
  }, [showToast]);

  // Reset to default sample activities
  const resetToDefaults = useCallback(() => {
    setActivities(DEFAULT_SAMPLE_ACTIVITIES);
    showToast('Cronograma restaurado para os dados padrão!', 'info');
  }, [showToast]);

  // Duplicate an activity with new ID
  const duplicateActivity = useCallback((activity: Activity) => {
    const duplicated: Activity = {
      ...activity,
      id: Date.now(),
      title: `${activity.title} (Cópia)`,
    };
    setActivities((prev) => [...prev, duplicated]);
    showToast('Atividade duplicada com sucesso!', 'success');
  }, [showToast]);

  // Export current activities to CSV file download
  const exportCSV = useCallback(() => {
    try {
      const csvData = exportActivitiesToCSV(activities);
      const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const safeTitle = eventTitle.toLowerCase().replace(/[^a-z0-9]/gi, '_');
      link.setAttribute('download', `${safeTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Cronograma exportado para CSV com sucesso!');
    } catch (err) {
      console.error('Failed to export CSV:', err);
      showToast('Erro ao exportar arquivo CSV.', 'danger');
    }
  }, [activities, showToast]);

  const exportMatrix = useCallback(async () => {
  try {
    if (activities.length === 0) {
      showToast(
        'Não há atividades para exportar como matriz.',
        'warning'
      );
      return;
    }

    await exportActivitiesToMatrixXLSX(
      activities,
      availableTracks,
      eventTitle
    );

    showToast(
      'Matriz exportada para Excel com sucesso!',
      'success'
    );
  } catch (err) {
    console.error('Failed to export matrix:', err);

    showToast(
      'Erro ao exportar a matriz para Excel.',
      'danger'
    );
  }
}, [
  activities,
  availableTracks,
  eventTitle,
  showToast,
]);

  // Import activities from CSV file
  const importCSV = useCallback((csvText: string) => {
    try {
      const parsed = parseCSVToActivities(csvText);
      if (parsed.length === 0) {
        showToast('Nenhuma atividade válida encontrada no CSV.', 'warning');
        return;
      }

      // Sanitize parsed activities and merge
      const completeActivities: Activity[] = parsed.map((item, idx) => ({
        id: Date.now() + idx,
        date: item.date || new Date().toISOString().slice(0, 10),
        startTime: item.startTime || '14:00',
        endTime: item.endTime || '15:00',
        track: item.track || 'Salão Principal',
        title: item.title || 'Atividade Importada',
        category: item.category || 'Palestra',
        color: item.color || '#3c78d8',
        notes: item.notes || '',
      }));

      setActivities((prev) => [...prev, ...completeActivities]);
      showToast(`${completeActivities.length} atividades importadas com sucesso!`);
    } catch (err) {
      console.error('Error importing CSV:', err);
      showToast('Erro ao ler arquivo CSV. Verifique o formato.', 'danger');
    }
  }, [showToast]);

  // Copy schedule data formatted specifically for pasting into Google Sheets or Excel
  const copyForGoogleSheets = useCallback(() => {
    try {
      const header = `Evento: ${eventTitle}\nData\tHora Início\tHora Fim\tEspaço / Trilha\tTítulo da Atividade\tCategoria\tNotas\n`;
      const rows = filteredActivities
        .map((act) => `${act.date}\t${act.startTime}\t${act.endTime}\t${act.track}\t${act.title}\t${act.category}\t${act.notes || ''}`)
        .join('\n');

      navigator.clipboard.writeText(header + rows).then(() => {
        showToast('Cronograma copiado! Cole direto no Google Planilhas (Ctrl+V).');
      });
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      showToast('Erro ao copiar para a área de transferência.', 'danger');
    }
  }, [filteredActivities, showToast]);

  return {
  // State
  eventTitle,
  activities,
  filteredActivities,
  filters,
  viewMode,
  isDarkMode,
  isModalOpen,
  modalMode,
  editingActivity,
  toast,
  availableDates,
  availableTracks,
  availableCategories,
  trackUsageCounts,
categoryUsageCounts,
  headerDateBadgeText,
  scheduleStats,

    // Actions
    setEventTitle: handleSetEventTitle,
    setFilters,
    setViewMode,
    toggleDarkMode,
    openAddModal,
    openEditModal,
    closeModal,
    saveActivity,
    renameTrack,
renameCategory,
deleteTrack,
deleteCategory,
    deleteActivity,
    clearAllActivities,
    resetToDefaults,
    duplicateActivity,
    exportCSV,
    importCSV,
    copyForGoogleSheets,
    showToast,
    exportMatrix,
  };
}