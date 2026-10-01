import React, { useState, useMemo } from 'react';
import type { Activity } from '../types/event';
import {
  formatShortDate,
  formatFullDate,
  getDayOfWeek,
  calculateDuration,
  checkTimeOverlap,
} from '../utils/dateUtils';
import { CATEGORY_BADGE_STYLES } from '../constants/eventDefaults';

interface RunOfShowViewProps {
  activities: Activity[];
  onEdit: (activity: Activity) => void;
  onDelete: (id: number) => void;
  onDuplicate: (activity: Activity) => void;
  onAddClick: () => void;
}

export const RunOfShowView: React.FC<RunOfShowViewProps> = ({
  activities,
  onEdit,
  onDelete,
  onDuplicate,
  onAddClick,
}) => {
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string>('all');

  const toggleNote = (id: number) => {
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const availableTracks = useMemo(() => {
    const set = new Set<string>();
    activities.forEach((a) => {
      if (a.track) set.add(a.track);
    });
    return Array.from(set).sort();
  }, [activities]);

  const filteredActivities = useMemo(() => {
    if (selectedTrackFilter === 'all') return activities;
    return activities.filter((a) => a.track === selectedTrackFilter);
  }, [activities, selectedTrackFilter]);

  const groupedByDate = useMemo(() => {
    const grouped = filteredActivities.reduce((acc, act) => {
      const key = act.date || 'sem-data';
      if (!acc[key]) acc[key] = [];
      acc[key].push(act);
      return acc;
    }, {} as Record<string, Activity[]>);

    // Sort each day's items chronologically by start time
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return grouped;
  }, [filteredActivities]);

  const sortedDates = useMemo(() => Object.keys(groupedByDate).sort(), [groupedByDate]);

  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-500">
          <i className="fa-solid fa-list-check text-2xl"></i>
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Nenhum item no roteiro
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
          Não há sequências de produção programadas no momento. Adicione atividades para construir o roteiro minuto a minuto.
        </p>
        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
        >
          <i className="fa-solid fa-plus"></i>
          <span>Adicionar Atividade</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300">
            <i className="fa-solid fa-clipboard-list text-lg"></i>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Roteiro de Produção (Run of Show)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visão sequencial minuto a minuto para equipe técnica e backstage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Track Filter Pill Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-xs sm:max-w-md py-1">
            <button
              type="button"
              onClick={() => setSelectedTrackFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                selectedTrackFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Todos os Espaços
            </button>
            {availableTracks.map((tr) => (
              <button
                key={tr}
                type="button"
                onClick={() => setSelectedTrackFilter(tr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  selectedTrackFilter === tr
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {tr}
              </button>
            ))}
          </div>

          {/* Quick Print Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 transition"
            title="Imprimir Roteiro de Produção"
          >
            <i className="fa-solid fa-print text-xs"></i>
          </button>
        </div>
      </div>

      {}
      {sortedDates.map((dateStr) => {
        const dayActivities = groupedByDate[dateStr];
        const dayOfWeek = getDayOfWeek(dateStr);
        const fullDate = formatFullDate(dateStr);

        return (
          <div
            key={dateStr}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
          >
            {/* Section Header */}
            <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
                  {dayOfWeek} • {formatShortDate(dateStr)}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {fullDate}
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
                {dayActivities.length} {dayActivities.length === 1 ? 'sequência' : 'sequências'}
              </span>
            </div>

            {}
            <div className="p-4 sm:p-6 space-y-4">
              {dayActivities.map((act, index) => {
                const duration = calculateDuration(act.startTime, act.endTime);
                const badgeClass =
                  CATEGORY_BADGE_STYLES[act.category] ||
                  'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
                const isNotesOpen = !!expandedNotes[act.id];

                // Check for conflict with other activities on the same date & track
                const hasConflict = dayActivities.some(
                  (other) =>
                    other.id !== act.id &&
                    other.track === act.track &&
                    checkTimeOverlap(act.startTime, act.endTime, other.startTime, other.endTime)
                );

                return (
                  <div
                    key={act.id}
                    className="relative border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/30 dark:bg-slate-900/30 p-4 transition hover:border-slate-300 dark:hover:border-slate-600 group"
                    style={{ borderLeftWidth: '5px', borderLeftColor: act.color || '#3c78d8' }}
                  >
                    {/* Top Row: Cue Number, Time Range, Location, Category & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-3 mb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Cue Counter Badge */}
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[11px] font-bold">
                          CUE #{String(index + 1).padStart(2, '0')}
                        </span>

                        {/* Clock Time */}
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900 dark:text-white">
                          <i className="fa-regular fa-clock text-slate-400"></i>
                          <span>
                            {act.startTime} — {act.endTime}
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({duration.formatted})
                          </span>
                        </div>

                        {/* Track / Location Tag */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
                          <i className="fa-solid fa-location-dot text-[10px] text-slate-400"></i>
                          {act.track}
                        </span>

                        {/* Category Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}`}>
                          {act.category}
                        </span>

                        {/* Conflict Alert Badge */}
                        {hasConflict && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold"
                            title="Atenção: Existe sobreposição de horário neste mesmo espaço!"
                          >
                            <i className="fa-solid fa-triangle-exclamation"></i>
                            Conflito de Espaço
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => onEdit(act)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                          title="Editar"
                        >
                          <i className="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDuplicate(act)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                          title="Duplicar"
                        >
                          <i className="fa-solid fa-copy text-xs"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(act.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                          title="Excluir"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    </div>

                    {/* Main Title & Notes Body */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {act.title}
                      </h4>

                      {/* Technical Notes / Production Cues Section */}
                      {act.notes && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => toggleNote(act.id)}
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                          >
                            <i
                              className={`fa-solid fa-chevron-${isNotesOpen ? 'down' : 'right'} text-[10px]`}
                            ></i>
                            <span>
                              {isNotesOpen ? 'Ocultar notas técnicas' : 'Ver notas de produção'}
                            </span>
                          </button>

                          {isNotesOpen && (
                            <div className="mt-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/70 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                                Orientação Técnica / Pauta:
                              </div>
                              {act.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};