import React from 'react';
import type { Activity } from '../types/event';
import {
  formatShortDate,
  formatFullDate,
  getDayOfWeek,
  calculateDuration,
} from '../utils/dateUtils';
import { CATEGORY_BADGE_STYLES } from '../constants/eventDefaults';

interface TableViewProps {
  activities: Activity[];
  onEdit: (activity: Activity) => void;
  onDelete: (id: number) => void;
  onDuplicate: (activity: Activity) => void;
  onAddClick: () => void;
}

export const TableView: React.FC<TableViewProps> = ({
  activities,
  onEdit,
  onDelete,
  onDuplicate,
  onAddClick,
}) => {
  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-500">
          <i className="fa-solid fa-calendar-xmark text-2xl"></i>
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Nenhuma atividade encontrada
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
          Não foi possível encontrar sessões com os filtros aplicados. Tente ajustar os termos da busca ou adicionar uma nova atividade.
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

  const groupedByDate: Record<string, Activity[]> = activities.reduce((acc, act) => {
    const key = act.date || 'sem-data';
    if (!acc[key]) acc[key] = [];
    acc[key].push(act);
    return acc;
  }, {} as Record<string, Activity[]>);

  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <div className="space-y-8">
      {sortedDates.map((dateStr) => {
        const dayActivities = groupedByDate[dateStr];
        const dayOfWeek = getDayOfWeek(dateStr);
        const fullDate = formatFullDate(dateStr);

        return (
          <div
            key={dateStr}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
          >
            {/* Table Date Group Header */}
            <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  {dayOfWeek} • {formatShortDate(dateStr)}
                </div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {fullDate}
                </h2>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {dayActivities.length} {dayActivities.length === 1 ? 'atividade' : 'atividades'}
              </span>
            </div>

            {}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-50/40 dark:bg-slate-900/20 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">Cor</th>
                    <th className="py-3 px-4 w-36">Horário</th>
                    <th className="py-3 px-4 w-44">Espaço / Trilha</th>
                    <th className="py-3 px-6">Título & Descrição</th>
                    <th className="py-3 px-4 w-36">Categoria</th>
                    <th className="py-3 px-4 w-28 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
                  {dayActivities.map((act) => {
                    const duration = calculateDuration(act.startTime, act.endTime);
                    const badgeClass =
                      CATEGORY_BADGE_STYLES[act.category] ||
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';

                    return (
                      <tr
                        key={act.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors group"
                      >
                        {/* Color Accent Indicator */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className="inline-block w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm"
                            style={{ backgroundColor: act.color || '#3c78d8' }}
                            title={`Cor: ${act.color}`}
                          />
                        </td>

                        {}
                        <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {act.startTime} - {act.endTime}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">
                            {duration.formatted}
                          </div>
                        </td>

                        {/* Space / Track Cell */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-medium text-xs">
                            <i className="fa-solid fa-location-dot text-[10px] text-slate-400"></i>
                            {act.track}
                          </span>
                        </td>

                        {}
                        <td className="py-3.5 px-6">
                          <div className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {act.title}
                          </div>
                          {act.notes && (
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 line-clamp-2">
                              {act.notes}
                            </p>
                          )}
                        </td>

                        {/* Category Badge Cell */}
{/* Category Cell */}
<td className="py-3.5 px-4 whitespace-nowrap">
  {act.category?.trim() ? (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badgeClass}`}
    >
      {act.category.trim()}
    </span>
  ) : (
    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 italic">
      Sem categoria
    </span>
  )}
</td>

                        {}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => onEdit(act)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                              title="Editar Atividade"
                            >
                              <i className="fa-solid fa-pen-to-square text-sm"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDuplicate(act)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                              title="Duplicar Atividade"
                            >
                              <i className="fa-solid fa-copy text-sm"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(act.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                              title="Excluir Atividade"
                            >
                              <i className="fa-solid fa-trash-can text-sm"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};