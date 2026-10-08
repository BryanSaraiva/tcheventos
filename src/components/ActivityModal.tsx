import React, { useEffect, useState } from 'react';
import type {
  Activity,
  ActivityFormData,
} from '../types/event';
import { useLanguage } from '../i18n/useLanguage';
import { CreatableCombobox } from './activity/CreatableCombobox';
import { ColorPicker } from './activity/ColorPicker';

interface ActivityModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  activity: Activity | null;

  onClose: () => void;
  onSave: (data: ActivityFormData) => void;

  availableTracks: string[];
  availableCategories: string[];

  trackUsageCounts: Record<string, number>;
  categoryUsageCounts: Record<string, number>;

  onRenameTrack: (
    oldValue: string,
    newValue: string
  ) => void;

  onDeleteTrack: (
    value: string
  ) => void;

  onRenameCategory: (
    oldValue: string,
    newValue: string
  ) => void;

  onDeleteCategory: (
    value: string
  ) => void;
}

export const ActivityModal: React.FC<
  ActivityModalProps
> = ({
  isOpen,
  mode,
  activity,
  onClose,
  onSave,

  availableTracks,
  availableCategories,

  trackUsageCounts,
  categoryUsageCounts,

  onRenameTrack,
  onDeleteTrack,

  onRenameCategory,
  onDeleteCategory,
}) => {
  const { t } = useLanguage();

  const [formData, setFormData] =
    useState<ActivityFormData>({
      date: new Date()
        .toISOString()
        .slice(0, 10),

      startTime: '14:00',
      endTime: '17:30',

      track: '',
      title: '',
      category: '',

      color: '#3c78d8',
      notes: '',
    });

  const [
    showColorPicker,
    setShowColorPicker,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  /* ============================================================
     LOAD / RESET FORM
     ============================================================ */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (
      mode === 'edit' &&
      activity
    ) {
      setFormData({
        id: activity.id,

        date: activity.date,

        startTime:
          activity.startTime,

        endTime:
          activity.endTime,

        track:
          activity.track,

        title:
          activity.title,

        category:
          activity.category,

        color:
          activity.color ||
          '#3c78d8',

        notes:
          activity.notes || '',
      });
    } else {
      setFormData({
        date: new Date()
          .toISOString()
          .slice(0, 10),

        startTime: '14:00',
        endTime: '17:30',

        track: '',
        title: '',
        category: '',

        color: '#3c78d8',
        notes: '',
      });
    }

    setErrorMessage('');
    setShowColorPicker(false);
  }, [
    isOpen,
    mode,
    activity,
  ]);

  if (!isOpen) {
    return null;
  }

  /* ============================================================
     FORM CHANGE
     ============================================================ */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
        HTMLTextAreaElement
    >
  ) => {
    const {
      name,
      value,
    } = e.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

    // Clear an old validation message as the user fixes the form.
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  /* ============================================================
     SUBMIT
     ============================================================ */

  const handleSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setErrorMessage(
        t(
          'validation.titleRequired'
        )
      );

      return;
    }

    if (!formData.track.trim()) {
      setErrorMessage(
        t(
          'validation.trackRequired'
        )
      );

      return;
    }

    if (
      formData.startTime >=
      formData.endTime
    ) {
      setErrorMessage(
        t(
          'validation.endTimeAfterStart'
        )
      );

      return;
    }

    onSave({
      ...formData,

      title:
        formData.title.trim(),

      track:
        formData.track.trim(),

      category:
        formData.category.trim(),

      notes:
        formData.notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-700">
        {/* ======================================================
            HEADER
           ====================================================== */}

        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <i
                className={`fa-solid ${
                  mode === 'edit'
                    ? 'fa-pen-to-square'
                    : 'fa-calendar-plus'
                } text-lg`}
              />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {mode === 'edit'
                  ? t(
                      'activityModal.editTitle'
                    )
                  : t(
                      'activityModal.createTitle'
                    )}
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'edit'
                  ? t(
                      'activityModal.editDescription'
                    )
                  : t(
                      'activityModal.createDescription'
                    )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            aria-label={t(
              'activityModal.cancel'
            )}
            title={t(
              'activityModal.cancel'
            )}
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        {/* ======================================================
            VALIDATION ERROR
           ====================================================== */}

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation flex-shrink-0" />

            <span>
              {errorMessage}
            </span>
          </div>
        )}

        {/* ======================================================
            FORM
           ====================================================== */}

        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-4"
        >
          {/* ====================================================
              TITLE
             ==================================================== */}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              {t(
                'activity.title'
              )}{' '}
              <span className="text-rose-500">
                *
              </span>
            </label>

            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t(
                'activity.titlePlaceholder'
              )}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            />
          </div>

          {/* ====================================================
              DATE / TIME
             ==================================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                {t(
                  'activity.date'
                )}
              </label>

              <input
                type="date"
                name="date"
                value={
                  formData.date
                }
                onChange={
                  handleChange
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                {t(
                  'activity.startTime'
                )}
              </label>

              <input
                type="time"
                name="startTime"
                value={
                  formData.startTime
                }
                onChange={
                  handleChange
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                {t(
                  'activity.endTime'
                )}
              </label>

              <input
                type="time"
                name="endTime"
                value={
                  formData.endTime
                }
                onChange={
                  handleChange
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
          </div>

          {/* ====================================================
              SPACE / CATEGORY
             ==================================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CreatableCombobox
              label={t(
                'activity.track'
              )}
              value={formData.track}
              options={
                availableTracks
              }
              usageCounts={
                trackUsageCounts
              }
              placeholder={t(
                'combobox.typeOrSelect'
              )}
              required
              onChange={(
                value
              ) =>
                setFormData(
                  (previous) => ({
                    ...previous,
                    track: value,
                  })
                )
              }
              onRenameOption={
                onRenameTrack
              }
              onDeleteOption={
                onDeleteTrack
              }
            />

            <CreatableCombobox
              label={t(
                'activity.category'
              )}
              value={
                formData.category
              }
              options={
                availableCategories
              }
              usageCounts={
                categoryUsageCounts
              }
              placeholder={t(
                'combobox.typeOrSelect'
              )}
              onChange={(
                value
              ) =>
                setFormData(
                  (previous) => ({
                    ...previous,
                    category: value,
                  })
                )
              }
              onRenameOption={
                onRenameCategory
              }
              onDeleteOption={
                onDeleteCategory
              }
            />
          </div>

          {/* ====================================================
              COLOR
             ==================================================== */}

          <ColorPicker
            value={formData.color}
            isOpen={
              showColorPicker
            }
            onToggle={() =>
              setShowColorPicker(
                (previous) =>
                  !previous
              )
            }
            onChange={(
              color
            ) =>
              setFormData(
                (previous) => ({
                  ...previous,
                  color,
                })
              )
            }
          />

          {/* ====================================================
              NOTES
             ==================================================== */}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              {t(
                'activity.notes'
              )}
            </label>

            <textarea
              name="notes"
              rows={3}
              value={
                formData.notes
              }
              onChange={
                handleChange
              }
              placeholder={t(
                'activity.notesPlaceholder'
              )}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            />
          </div>

          {/* ====================================================
              ACTIONS
             ==================================================== */}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              {t(
                'activityModal.cancel'
              )}
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2"
            >
              <i className="fa-solid fa-check" />

              <span>
                {mode === 'edit'
                  ? t(
                      'activityModal.saveChanges'
                    )
                  : t(
                      'activityModal.create'
                    )}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityModal;