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
import {
  buildMatrixDay,
  formatMatrixActivity,
  formatMatrixTime,
} from '../utils/matrixUtils';

const TITLE_KEY = 'tcheventos_event_title_1';
const ACTIVITIES_KEY = 'tcheventos_event_activities_v1';
const OPTIONS_KEY = 'tcheventos_event_options_v1';
const THEME_KEY = 'tcheventos_theme_dark_1';

interface EventOptionState {
  tracks: string[];
  categories: string[];
}

/**
 * Escapes text before inserting it into HTML used for clipboard copy.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Builds the visual matrix representation used by
 * "Copiar p/ Planilhas".
 *
 * filteredActivities already reflects:
 * - selected day
 * - selected space
 * - selected category
 * - search query
 *
 * Therefore the copied matrix always represents exactly
 * what is currently selected in the application.
 */
function buildMatrixClipboardContent(
  matrixActivities: Activity[],
  availableTracks: string[],
  eventTitle: string
): {
  text: string;
  html: string;
} {
  const dates = Array.from(
    new Set(
      matrixActivities
        .map((activity) => activity.date)
        .filter(Boolean)
    )
  ).sort();

  if (dates.length === 0) {
    return {
      text: '',
      html: '',
    };
  }

  const textSections: string[] = [];
  const htmlSections: string[] = [];

  dates.forEach((date) => {
    const matrix = buildMatrixDay(
      date,
      matrixActivities,
      availableTracks
    );

    const {
      timePoints,
      tracks,
      lanesByTrack,
    } = matrix;

    if (timePoints.length === 0) {
      return;
    }

    /* =========================================================
       PLAIN TEXT / TSV FALLBACK
       ========================================================= */

    const textRows: string[][] = [];

    textRows.push([
      'Espaço / Trilha',
      ...timePoints.map(formatMatrixTime),
    ]);

    tracks.forEach((track) => {
      const lanes =
        lanesByTrack.get(track) || [];

      // Location with no activities.
      if (lanes.length === 0) {
        textRows.push([
          track,
          ...timePoints.map(() => ''),
        ]);

        return;
      }

      lanes.forEach((lane, laneIndex) => {
        const row = timePoints.map(() => '');

        lane.activities.forEach((item) => {
          row[item.startIndex] =
            formatMatrixActivity(item.activity);
        });

        textRows.push([
          laneIndex === 0 ? track : '',
          ...row,
        ]);
      });
    });

    textSections.push(
      `Data: ${date}\n` +
        textRows
          .map((row) => row.join('\t'))
          .join('\n')
    );

    /* =========================================================
       RICH HTML
       ========================================================= */

    let html = `
      <div>
        <h3 style="
          font-family: Arial, sans-serif;
          margin: 0 0 8px 0;
        ">
          ${escapeHtml(eventTitle)} — ${escapeHtml(date)}
        </h3>

        <table
          border="1"
          cellpadding="6"
          cellspacing="0"
          style="
            border-collapse: collapse;
            font-family: Arial, sans-serif;
            font-size: 11px;
          "
        >
          <thead>
            <tr>
              <th
                style="
                  background: #0f172a;
                  color: white;
                  font-weight: bold;
                  text-align: left;
                "
              >
                Espaço / Trilha
              </th>
    `;

    timePoints.forEach((minutes) => {
      html += `
        <th
          style="
            background: #0f172a;
            color: white;
            font-weight: bold;
            text-align: center;
            white-space: nowrap;
          "
        >
          ${escapeHtml(formatMatrixTime(minutes))}
        </th>
      `;
    });

    html += `
            </tr>
          </thead>
          <tbody>
    `;

    tracks.forEach((track) => {
      const lanes =
        lanesByTrack.get(track) || [];

      // Track with no activity.
      if (lanes.length === 0) {
        html += `
          <tr>
            <td
              style="
                font-weight: bold;
                vertical-align: middle;
                white-space: nowrap;
              "
            >
              ${escapeHtml(track)}
            </td>
            ${timePoints
              .map(() => '<td></td>')
              .join('')}
          </tr>
        `;

        return;
      }

      lanes.forEach((lane, laneIndex) => {
        html += '<tr>';

        // Vertically merge the location name across sub-lanes.
        if (laneIndex === 0) {
          html += `
            <td
              rowspan="${lanes.length}"
              style="
                font-weight: bold;
                vertical-align: middle;
                white-space: nowrap;
              "
            >
              ${escapeHtml(track)}
            </td>
          `;
        }

        let columnIndex = 0;

        while (
          columnIndex < timePoints.length
        ) {
          const activityItem =
            lane.activities.find(
              (item) =>
                item.startIndex === columnIndex
            );

          if (activityItem) {
            const activity =
              activityItem.activity;

            const colspan =
              activityItem.endIndex -
              activityItem.startIndex +
              1;

            const duration =
              formatMatrixActivity(activity);

            const backgroundColor =
              activity.color || '#3c78d8';

            html += `
              <td
                colspan="${colspan}"
                style="
                  vertical-align: top;
                  text-align: left;
                  background: ${escapeHtml(
                    backgroundColor
                  )}18;
                  min-width: 100px;
                "
              >
                <div
                  style="
                    font-size: 10px;
                    color: #475569;
                    white-space: nowrap;
                  "
                >
                  ${escapeHtml(
                    duration.split('\n')[0]
                  )}
                </div>

                <div
                  style="
                    font-size: 12px;
                    font-weight: 700;
                    color: #0f172a;
                    margin-top: 4px;
                  "
                >
                  ${escapeHtml(
                    activity.title
                  )}
                </div>

                <div
                  style="
                    font-size: 10px;
                    color: #64748b;
                    margin-top: 3px;
                  "
                >
                  ${escapeHtml(
                    activity.category?.trim() ||
                      'Sem categoria'
                  )}
                </div>
              </td>
            `;

            columnIndex += colspan;
          } else {
            html += '<td></td>';
            columnIndex++;
          }
        }

        html += '</tr>';
      });
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    htmlSections.push(html);
  });

  return {
    text: textSections.join(
      '\n\n\n'
    ),
    html: htmlSections.join(
      '<br><br><hr><br><br>'
    ),
  };
}

/**
 * Custom React Hook that encapsulates all state management logic
 * for event schedule management.
 */
export function useEventSchedule() {
  /* ============================================================
     ACTIVITIES
     ============================================================ */

  const [activities, setActivities] =
    useState<Activity[]>(() => {
      try {
        const saved =
          localStorage.getItem(
            ACTIVITIES_KEY
          );

        if (saved) {
          const parsed =
            JSON.parse(saved);

          if (
            Array.isArray(parsed) &&
            parsed.length > 0
          ) {
            return parsed;
          }
        }
      } catch (err) {
        console.error(
          'Failed to parse activities from localStorage:',
          err
        );
      }

      return DEFAULT_SAMPLE_ACTIVITIES;
    });

  /* ============================================================
     EVENT OPTIONS
     ============================================================ */

  const [eventOptions, setEventOptions] =
    useState<EventOptionState>(() => {
      try {
        const saved =
          localStorage.getItem(
            OPTIONS_KEY
          );

        if (saved) {
          const parsed =
            JSON.parse(saved);

          if (
            parsed &&
            Array.isArray(parsed.tracks) &&
            Array.isArray(parsed.categories)
          ) {
            return {
              tracks: parsed.tracks,
              categories:
                parsed.categories,
            };
          }
        }
      } catch (err) {
        console.error(
          'Failed to parse event options from localStorage:',
          err
        );
      }

      return {
        tracks: [],
        categories: [],
      };
    });

  /* ============================================================
     DARK MODE
     ============================================================ */

  const [isDarkMode, setIsDarkMode] =
    useState<boolean>(() => {
      try {
        const saved =
          localStorage.getItem(
            THEME_KEY
          );

        if (saved !== null) {
          return JSON.parse(saved);
        }

        return window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;
      } catch {
        return false;
      }
    });

  /* ============================================================
     EVENT TITLE
     ============================================================ */

  const [eventTitle, setEventTitle] =
    useState<string>(() => {
      try {
        return (
          localStorage.getItem(
            TITLE_KEY
          ) || 'Cronograma Oficial'
        );
      } catch {
        return 'Cronograma Oficial';
      }
    });

  useEffect(() => {
    try {
      localStorage.setItem(
        TITLE_KEY,
        eventTitle
      );
    } catch (err) {
      console.error(
        'Failed to save event title:',
        err
      );
    }
  }, [eventTitle]);

  const handleSetEventTitle =
    useCallback((newTitle: string) => {
      setEventTitle(
        newTitle.slice(0, 100)
      );
    }, []);

  /* ============================================================
     PERSIST OPTIONS
     ============================================================ */

  useEffect(() => {
    try {
      localStorage.setItem(
        OPTIONS_KEY,
        JSON.stringify(eventOptions)
      );
    } catch (err) {
      console.error(
        'Failed to save event options:',
        err
      );
    }
  }, [eventOptions]);

  /* ============================================================
     VIEW MODE
     ============================================================ */

  const [viewMode, setViewMode] =
    useState<ViewMode>('table');

  /* ============================================================
     FILTERS
     ============================================================ */

  const [filters, setFilters] =
    useState<FilterState>({
      searchQuery: '',
      locationFilter: 'all',
      categoryFilter: 'all',
      filterDay: 'all',
    });

  /* ============================================================
     MODAL
     ============================================================ */

  const [isModalOpen, setIsModalOpen] =
    useState<boolean>(false);

  const [modalMode, setModalMode] =
    useState<'create' | 'edit'>(
      'create'
    );

  const [editingActivity, setEditingActivity] =
    useState<Activity | null>(null);

  /* ============================================================
     TOAST
     ============================================================ */

  const [toast, setToast] =
    useState<ToastNotification | null>(
      null
    );

  /* ============================================================
     DARK MODE SYNC
     ============================================================ */

  useEffect(() => {
    const root =
      document.documentElement;

    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(
        THEME_KEY,
        JSON.stringify(isDarkMode)
      );
    } catch (err) {
      console.error(
        'Failed to save theme setting:',
        err
      );
    }
  }, [isDarkMode]);

  const toggleDarkMode =
    useCallback(() => {
      setIsDarkMode(
        (previous) => !previous
      );
    }, []);

  /* ============================================================
     PERSIST ACTIVITIES
     ============================================================ */

  useEffect(() => {
    try {
      localStorage.setItem(
        ACTIVITIES_KEY,
        JSON.stringify(activities)
      );
    } catch (err) {
      console.error(
        'Failed to save activities to localStorage:',
        err
      );
    }
  }, [activities]);

  /* ============================================================
     TOAST HELPER
     ============================================================ */

  const showToast = useCallback(
    (
      message: string,
      type:
        | 'success'
        | 'danger'
        | 'warning'
        | 'info' = 'success'
    ) => {
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
    },
    []
  );

  /* ============================================================
     DERIVED DATE / OPTION LISTS
     ============================================================ */

  const availableDates = useMemo(() => {
    const datesSet =
      new Set<string>();

    activities.forEach((activity) => {
      if (activity.date) {
        datesSet.add(
          activity.date
        );
      }
    });

    return Array.from(
      datesSet
    ).sort();
  }, [activities]);

  const availableTracks = useMemo(
    () => {
      return [
        ...eventOptions.tracks,
      ].sort((a, b) =>
        a.localeCompare(b)
      );
    },
    [eventOptions.tracks]
  );

  const availableCategories = useMemo(
    () => {
      return [
        ...eventOptions.categories,
      ].sort((a, b) =>
        a.localeCompare(b)
      );
    },
    [eventOptions.categories]
  );

  const trackUsageCounts =
    useMemo(() => {
      const counts: Record<
        string,
        number
      > = {};

      activities.forEach(
        (activity) => {
          if (!activity.track) {
            return;
          }

          counts[activity.track] =
            (counts[activity.track] ||
              0) + 1;
        }
      );

      return counts;
    }, [activities]);

  const categoryUsageCounts =
    useMemo(() => {
      const counts: Record<
        string,
        number
      > = {};

      activities.forEach(
        (activity) => {
          if (!activity.category) {
            return;
          }

          counts[activity.category] =
            (counts[
              activity.category
            ] || 0) + 1;
        }
      );

      return counts;
    }, [activities]);

  /* ============================================================
     HEADER DATE BADGE
     ============================================================ */

  const headerDateBadgeText =
    useMemo(() => {
      return getHeaderDateBadgeText(
        availableDates
      );
    }, [availableDates]);

  /* ============================================================
     FILTERED ACTIVITIES
     ============================================================ */

  const filteredActivities =
    useMemo(() => {
      return activities
        .filter((activity) => {
          // Day filter
          if (
            filters.filterDay !==
              'all' &&
            activity.date !==
              filters.filterDay
          ) {
            return false;
          }

          // Space / track filter
          if (
            filters.locationFilter !==
              'all' &&
            activity.track !==
              filters.locationFilter
          ) {
            return false;
          }

          // Category filter
          if (
            filters.categoryFilter !==
              'all' &&
            activity.category !==
              filters.categoryFilter
          ) {
            return false;
          }

          // Search
          if (
            filters.searchQuery.trim() !==
            ''
          ) {
            const query =
              filters.searchQuery.toLowerCase();

            const matchesTitle =
              activity.title
                .toLowerCase()
                .includes(query);

            const matchesNotes =
              activity.notes
                .toLowerCase()
                .includes(query);

            const matchesTrack =
              activity.track
                .toLowerCase()
                .includes(query);

            const matchesCategory =
              activity.category
                .toLowerCase()
                .includes(query);

            if (
              !matchesTitle &&
              !matchesNotes &&
              !matchesTrack &&
              !matchesCategory
            ) {
              return false;
            }
          }

          return true;
        })
        .sort((a, b) => {
          if (a.date !== b.date) {
            return a.date.localeCompare(
              b.date
            );
          }

          return a.startTime.localeCompare(
            b.startTime
          );
        });
    }, [activities, filters]);

  /* ============================================================
     SCHEDULE STATS
     ============================================================ */

  const scheduleStats: ScheduleStats =
    useMemo(() => {
      return computeScheduleStats(
        filteredActivities
      );
    }, [filteredActivities]);

  /* ============================================================
     MODAL ACTIONS
     ============================================================ */

  const openAddModal =
    useCallback(() => {
      setEditingActivity(null);
      setModalMode('create');
      setIsModalOpen(true);
    }, []);

  const openEditModal =
    useCallback(
      (activity: Activity) => {
        setEditingActivity(activity);
        setModalMode('edit');
        setIsModalOpen(true);
      },
      []
    );

  const closeModal =
    useCallback(() => {
      setIsModalOpen(false);
      setEditingActivity(null);
    }, []);

  /* ============================================================
     OPTION MANAGEMENT
     ============================================================ */

  const addOption = useCallback(
    (
      type:
        | 'track'
        | 'category',
      value: string
    ) => {
      const trimmedValue =
        value.trim();

      if (!trimmedValue) {
        return;
      }

      setEventOptions((previous) => {
        const key =
          type === 'track'
            ? 'tracks'
            : 'categories';

        const existing =
          previous[key];

        const alreadyExists =
          existing.some(
            (item) =>
              item.toLowerCase() ===
              trimmedValue.toLowerCase()
          );

        if (alreadyExists) {
          return previous;
        }

        return {
          ...previous,
          [key]: [
            ...existing,
            trimmedValue,
          ],
        };
      });
    },
    []
  );

  const renameOption = useCallback(
    (
      type:
        | 'track'
        | 'category',
      oldValue: string,
      newValue: string
    ) => {
      const trimmedNewValue =
        newValue.trim();

      if (
        !trimmedNewValue ||
        oldValue === trimmedNewValue
      ) {
        return;
      }

      const optionKey =
        type === 'track'
          ? 'tracks'
          : 'categories';

      const activityKey =
        type === 'track'
          ? 'track'
          : 'category';

      setEventOptions((previous) => {
        const existing =
          previous[optionKey];

        const nextOptions =
          existing.map(
            (option) =>
              option === oldValue
                ? trimmedNewValue
                : option
          );

        return {
          ...previous,
          [optionKey]:
            nextOptions,
        };
      });

      setActivities((previous) =>
        previous.map((activity) =>
          activity[
            activityKey
          ] === oldValue
            ? {
                ...activity,
                [activityKey]:
                  trimmedNewValue,
              }
            : activity
        )
      );
    },
    []
  );

  const deleteOption = useCallback(
    (
      type:
        | 'track'
        | 'category',
      value: string
    ) => {
      const optionKey =
        type === 'track'
          ? 'tracks'
          : 'categories';

      const activityKey =
        type === 'track'
          ? 'track'
          : 'category';

      setEventOptions((previous) => ({
        ...previous,
        [optionKey]:
          previous[
            optionKey
          ].filter(
            (option) =>
              option !== value
          ),
      }));

      setActivities((previous) =>
        previous.map((activity) =>
          activity[
            activityKey
          ] === value
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

  const renameTrack =
    useCallback(
      (
        oldValue: string,
        newValue: string
      ) =>
        renameOption(
          'track',
          oldValue,
          newValue
        ),
      [renameOption]
    );

  const renameCategory =
    useCallback(
      (
        oldValue: string,
        newValue: string
      ) =>
        renameOption(
          'category',
          oldValue,
          newValue
        ),
      [renameOption]
    );

  const deleteTrack =
    useCallback(
      (value: string) =>
        deleteOption(
          'track',
          value
        ),
      [deleteOption]
    );

  const deleteCategory =
    useCallback(
      (value: string) =>
        deleteOption(
          'category',
          value
        ),
      [deleteOption]
    );

  /* ============================================================
     SAVE ACTIVITY
     ============================================================ */

  const saveActivity =
    useCallback(
      (
        formData: ActivityFormData
      ) => {
        // Track is mandatory.
        addOption(
          'track',
          formData.track
        );

        // Category is optional.
        // addOption safely ignores an empty value.
        addOption(
          'category',
          formData.category
        );

        if (
          modalMode === 'edit' &&
          formData.id
        ) {
          setActivities(
            (previous) =>
              previous.map(
                (activity) =>
                  activity.id ===
                  formData.id
                    ? ({
                        ...formData,
                        id: formData.id,
                      } as Activity)
                    : activity
              )
          );

          showToast(
            'Atividade atualizada com sucesso!',
            'success'
          );
        } else {
          const newActivity:
            Activity = {
            ...formData,
            id: Date.now(),
          };

          setActivities(
            (previous) => [
              ...previous,
              newActivity,
            ]
          );

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

  /* ============================================================
     ACTIVITY DELETE
     ============================================================ */

  const deleteActivity =
    useCallback(
      (id: number) => {
        setActivities(
          (previous) =>
            previous.filter(
              (activity) =>
                activity.id !== id
            )
        );

        showToast(
          'Atividade removida do cronograma.',
          'info'
        );
      },
      [showToast]
    );

  /* ============================================================
     CLEAR ALL
     ============================================================ */

  const clearAllActivities =
    useCallback(() => {
      if (
        window.confirm(
          'Tem certeza de que deseja apagar TODAS as atividades do cronograma? Esta ação não pode ser desfeita.'
        )
      ) {
        setActivities([]);
        showToast(
          'Todas as atividades foram apagadas.',
          'warning'
        );
      }
    }, [showToast]);

  /* ============================================================
     RESET DEFAULTS
     ============================================================ */

  const resetToDefaults =
    useCallback(() => {
      setActivities(
        DEFAULT_SAMPLE_ACTIVITIES
      );

      showToast(
        'Cronograma restaurado para os dados padrão!',
        'info'
      );
    }, [showToast]);

  /* ============================================================
     DUPLICATE
     ============================================================ */

  const duplicateActivity =
    useCallback(
      (activity: Activity) => {
        const duplicated: Activity =
          {
            ...activity,
            id: Date.now(),
            title: `${activity.title} (Cópia)`,
          };

        setActivities(
          (previous) => [
            ...previous,
            duplicated,
          ]
        );

        showToast(
          'Atividade duplicada com sucesso!',
          'success'
        );
      },
      [showToast]
    );

  /* ============================================================
     CSV EXPORT
     ============================================================ */

  const exportCSV =
    useCallback(() => {
      try {
        const csvData =
          exportActivitiesToCSV(
            activities
          );

        const blob = new Blob(
          ['\uFEFF' + csvData],
          {
            type:
              'text/csv;charset=utf-8;',
          }
        );

        const url =
          URL.createObjectURL(blob);

        const link =
          document.createElement('a');

        const safeTitle =
          eventTitle
            .toLowerCase()
            .replace(
              /[^a-z0-9]/gi,
              '_'
            );

        link.setAttribute(
          'href',
          url
        );

        link.setAttribute(
          'download',
          `${safeTitle}_${new Date()
            .toISOString()
            .slice(
              0,
              10
            )}.csv`
        );

        document.body.appendChild(
          link
        );

        link.click();

        document.body.removeChild(
          link
        );

        URL.revokeObjectURL(url);

        showToast(
          'Cronograma exportado para CSV com sucesso!',
          'success'
        );
      } catch (err) {
        console.error(
          'Failed to export CSV:',
          err
        );

        showToast(
          'Erro ao exportar arquivo CSV.',
          'danger'
        );
      }
    }, [
      activities,
      eventTitle,
      showToast,
    ]);

  /* ============================================================
     MATRIX XLSX EXPORT
     ============================================================ */

  const exportMatrix =
    useCallback(async () => {
      try {
        if (
          activities.length === 0
        ) {
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
        console.error(
          'Failed to export matrix:',
          err
        );

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

  /* ============================================================
     CSV IMPORT
     ============================================================ */

  const importCSV =
    useCallback(
      (csvText: string) => {
        try {
          const parsed =
            parseCSVToActivities(
              csvText
            );

          if (
            parsed.length === 0
          ) {
            showToast(
              'Nenhuma atividade válida encontrada no CSV.',
              'warning'
            );

            return;
          }

          const completeActivities:
            Activity[] =
            parsed.map(
              (item, index) => ({
                id:
                  Date.now() +
                  index,

                date:
                  item.date ||
                  new Date()
                    .toISOString()
                    .slice(
                      0,
                      10
                    ),

                startTime:
                  item.startTime ||
                  '14:00',

                endTime:
                  item.endTime ||
                  '17:30',

                track:
                  item.track ||
                  'Salão Principal',

                title:
                  item.title ||
                  'Atividade Importada',

                // Category is optional.
                category:
                  item.category ||
                  '',

                color:
                  item.color ||
                  '#3c78d8',

                notes:
                  item.notes ||
                  '',
              })
            );

          setActivities(
            (previous) => [
              ...previous,
              ...completeActivities,
            ]
          );

          // Imported track/category values become available
          // in the option catalogs as well.
          completeActivities.forEach(
            (activity) => {
              addOption(
                'track',
                activity.track
              );

              addOption(
                'category',
                activity.category
              );
            }
          );

          showToast(
            `${completeActivities.length} atividades importadas com sucesso!`,
            'success'
          );
        } catch (err) {
          console.error(
            'Error importing CSV:',
            err
          );

          showToast(
            'Erro ao ler arquivo CSV. Verifique o formato.',
            'danger'
          );
        }
      },
      [
        showToast,
        addOption,
      ]
    );

  /* ============================================================
     GOOGLE SHEETS MATRIX COPY
     ============================================================ */

  const copyForGoogleSheets =
    useCallback(async () => {
      try {
        if (
          filteredActivities.length ===
          0
        ) {
          showToast(
            'Não há atividades para copiar.',
            'warning'
          );

          return;
        }

        const {
          text,
          html,
        } =
          buildMatrixClipboardContent(
            filteredActivities,
            availableTracks,
            eventTitle
          );

        /*
         * Preferred:
         * copy both HTML and plain text.
         *
         * Google Sheets can use the HTML representation
         * to preserve the matrix/table structure.
         */
        if (
          navigator.clipboard?.write &&
          typeof ClipboardItem !==
            'undefined'
        ) {
          const clipboardItem =
            new ClipboardItem({
              'text/plain':
                new Blob(
                  [text],
                  {
                    type:
                      'text/plain',
                  }
                ),

              'text/html':
                new Blob(
                  [html],
                  {
                    type:
                      'text/html',
                  }
                ),
            });

          await navigator.clipboard.write(
            [clipboardItem]
          );
        } else {
          /*
           * Fallback for browsers where rich clipboard
           * writing isn't available.
           */
          await navigator.clipboard.writeText(
            text
          );
        }

        showToast(
          'Matriz copiada! Cole diretamente no Google Planilhas.',
          'success'
        );
      } catch (err) {
        console.error(
          'Failed to copy matrix:',
          err
        );

        showToast(
          'Erro ao copiar a matriz.',
          'danger'
        );
      }
    }, [
      filteredActivities,
      availableTracks,
      eventTitle,
      showToast,
    ]);

  /* ============================================================
     RETURN PUBLIC HOOK API
     ============================================================ */

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
    setEventTitle:
      handleSetEventTitle,

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
    exportMatrix,
    importCSV,

    copyForGoogleSheets,

    showToast,
  };
}