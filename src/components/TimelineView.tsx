import React, {
  useMemo,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { Activity } from '../types/event';
import {
  formatShortDate,
  formatFullDate,
  getDayOfWeek,
  timeToMins,
  calculateDuration,
} from '../utils/dateUtils';
import { CATEGORY_BADGE_STYLES } from '../constants/eventDefaults';

interface TimelineViewProps {
  activities: Activity[];
  availableTracks: string[];
  onEdit: (activity: Activity) => void;
  onDelete: (id: number) => void;
  onDuplicate: (activity: Activity) => void;
  onAddClick: () => void;
}

// 30-minute interval slots from 14:00 to 22:00
const TIMELINE_SLOTS = [
  '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30',
];

const MIN_START_TIME = 14 * 60; // 14:00 in minutes = 840
const MAX_END_TIME = 22 * 60;   // 22:00 in minutes = 1320
const TOTAL_SPAN_MINUTES = MAX_END_TIME - MIN_START_TIME; // 480 minutes (8 hours)
const SUB_LANE_HEIGHT = 96;
const SUB_LANE_GAP = 8;
const MIN_CARD_WIDTH_PX = 150;
const DEFAULT_TIMELINE_WIDTH_PX = 675;

interface LaneAssignment {
  laneByActivityId: Map<number, number>;
  laneCount: number;
}

function assignActivityLanes(
  trackActivities: Activity[],
  timelineWidthPx: number
): LaneAssignment {
  /*
   * IMPORTANT:
   *
   * We don't only care about temporal overlap.
   *
   * Every activity card has a minimum visual width of 120px.
   * Therefore a 15-minute activity can visually overlap the next
   * activity even when their real times do not overlap.
   *
   * Convert the 120px minimum into an equivalent amount of timeline
   * minutes so lane assignment matches what is actually rendered.
   */

  const minimumVisualDurationMinutes =
    (MIN_CARD_WIDTH_PX / timelineWidthPx) * TOTAL_SPAN_MINUTES;

  const sorted = trackActivities
    .map((activity, originalIndex) => {
      const start = timeToMins(activity.startTime);
      const end = timeToMins(activity.endTime);

      const visualEnd = Math.max(
        end,
        start + minimumVisualDurationMinutes
      );

      return {
        activity,
        originalIndex,
        start,
        end,
        visualEnd,
      };
    })
    .sort((a, b) => {
      if (a.start !== b.start) {
        return a.start - b.start;
      }

      return a.originalIndex - b.originalIndex;
    });

  // Each value represents the visual right edge occupied by that lane.
  const laneEndTimes: number[] = [];

  const laneByActivityId = new Map<number, number>();

  for (const item of sorted) {
    const availableLane = laneEndTimes.findIndex(
      (laneEnd) => laneEnd <= item.start
    );

    let lane: number;

    if (availableLane === -1) {
      lane = laneEndTimes.length;
      laneEndTimes.push(item.visualEnd);
    } else {
      lane = availableLane;
      laneEndTimes[lane] = item.visualEnd;
    }

    laneByActivityId.set(item.activity.id, lane);
  }

  return {
    laneByActivityId,
    laneCount: Math.max(1, laneEndTimes.length),
  };
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  activities,
  availableTracks,
  onEdit,
  onDelete,
  onDuplicate,
  onAddClick,
}) => {
  const timelineMeasureRef = useRef<HTMLDivElement | null>(null);

  const [timelineWidthPx, setTimelineWidthPx] = useState(
    DEFAULT_TIMELINE_WIDTH_PX
  );

  const groupedByDate = useMemo(() => {
    return activities.reduce((acc, act) => {
      const dateKey = act.date || 'sem-data';

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }

      acc[dateKey].push(act);

      return acc;
    }, {} as Record<string, Activity[]>);
  }, [activities]);

  const sortedDates = Object.keys(groupedByDate).sort();

  useLayoutEffect(() => {
    const element = timelineMeasureRef.current;

    if (!element) return;

    const updateWidth = () => {
      const width = element.getBoundingClientRect().width;

      if (width > 0) {
        setTimelineWidthPx(width);
      }
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [sortedDates.length]);

  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-500">
          <i className="fa-solid fa-chart-gantt text-2xl"></i>
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Nenhuma atividade na linha do tempo
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
          Não há sessões programadas para exibir no modo matriz. Tente alterar os filtros ou cadastrar uma nova atividade.
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
    <div className="space-y-8">
      {sortedDates.map((dateStr, dateIndex) => {
        const dayActivities = groupedByDate[dateStr];
        const dayOfWeek = getDayOfWeek(dateStr);
        const fullDate = formatFullDate(dateStr);

        // Derive active tracks for this specific date
        const tracksForDay = Array.from(
          new Set([...availableTracks, ...dayActivities.map((a) => a.track)])
        ).filter(Boolean);

        return (
          <div
            key={dateStr}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
          >
            {/* Date Section Header */}
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

            {/* Scrollable Timeline Grid Container */}
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                
                <div className="grid grid-cols-12 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50/40 dark:bg-slate-900/20 text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                  <div className="col-span-3 p-3 border-r border-slate-200 dark:border-slate-700/60 font-sans font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                    Espaço / Trilha
                  </div>
                  <div ref={dateIndex === 0 ? timelineMeasureRef : undefined}
  className="col-span-9 grid grid-cols-8 divide-x divide-slate-200/60 dark:divide-slate-700/40 text-center py-2.5 text-[11px]"
>
                    {TIMELINE_SLOTS.filter((_, idx) => idx % 2 === 0).map((slot) => (
                      <div key={slot} className="font-semibold">
                        {slot}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Track Rows Matrix */}
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {tracksForDay.map((trackName) => {
  const trackActivities = dayActivities.filter(
    (a) => a.track === trackName
  );

const {
  laneByActivityId,
  laneCount,
} = assignActivityLanes(
  trackActivities,
  timelineWidthPx
);

  const trackHeight = laneCount * SUB_LANE_HEIGHT;

  return (
    <div
      key={trackName}
      className="grid grid-cols-12 items-stretch hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors"
      style={{ minHeight: `${trackHeight}px` }}
    >
      {/* Track Name Header Label */}
      <div
        className="col-span-3 p-4 border-r border-slate-200 dark:border-slate-700/60 flex items-center gap-2"
        style={{ minHeight: `${trackHeight}px` }}
      >
        <i className="fa-solid fa-location-dot text-slate-400 text-xs"></i>

        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
          {trackName}
        </span>
      </div>

      {/* Relative Positioning Track Canvas */}
      <div
        className="col-span-9 relative"
        style={{ height: `${trackHeight}px` }}
      >
        {/* Background slot grid lines */}
        <div className="absolute inset-0 grid grid-cols-8 divide-x divide-slate-100 dark:divide-slate-700/30 pointer-events-none">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-full" />
          ))}
        </div>

        {/* Activity Cards */}
        {trackActivities.map((act) => {
          const startMins = timeToMins(act.startTime);
          const endMins = timeToMins(act.endTime);

          // Clamp start/end within timeline limits
          const clampedStart = Math.max(
            MIN_START_TIME,
            startMins
          );

          const clampedEnd = Math.min(
            MAX_END_TIME,
            endMins
          );

          const leftPercent = Math.max(
            0,
            ((clampedStart - MIN_START_TIME) / TOTAL_SPAN_MINUTES) * 100
          );

          const widthPercent = Math.max(
            5,
            ((clampedEnd - clampedStart) / TOTAL_SPAN_MINUTES) * 100
          );

          const duration = calculateDuration(
            act.startTime,
            act.endTime
          );

          const badgeClass =
            CATEGORY_BADGE_STYLES[act.category] ||
            'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';

          const lane = laneByActivityId.get(act.id) ?? 0;

          const top =
            lane * SUB_LANE_HEIGHT + SUB_LANE_GAP / 2;

          const height =
            SUB_LANE_HEIGHT - SUB_LANE_GAP;

          return (
            <div
              key={act.id}
              className="absolute rounded-xl border border-black/10 dark:border-white/10 shadow-sm transition-all hover:scale-[1.02] hover:z-20 cursor-pointer group flex flex-col justify-between overflow-hidden p-2.5"
              style={{
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
                top: `${top}px`,
                height: `${height}px`,
                backgroundColor: act.color
                  ? `${act.color}15`
                  : '#3c78d815',
                borderLeftColor: act.color || '#3c78d8',
                borderLeftWidth: '4px',
                minWidth: `${MIN_CARD_WIDTH_PX}px`,
              }}
              onClick={() => onEdit(act)}
              title={`${act.startTime} - ${act.endTime} | ${act.title}`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                  {act.startTime} - {act.endTime} ({duration.formatted})
                </span>

                <div className="hidden group-hover:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(act);
                    }}
                    className="p-0.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400"
                    title="Duplicar"
                  >
                    <i className="fa-solid fa-copy text-[10px]"></i>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(act.id);
                    }}
                    className="p-0.5 text-slate-500 hover:text-rose-600 dark:text-slate-400"
                    title="Excluir"
                  >
                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                  </button>
                </div>
              </div>

              <div className="font-bold text-xs text-slate-900 dark:text-white truncate mt-1">
                {act.title}
              </div>

<div className="mt-1 flex items-center justify-between">
  {act.category?.trim() ? (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold ${badgeClass}`}
    >
      {act.category.trim()}
    </span>
  ) : (
    <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 italic">
      Sem categoria
    </span>
  )}
</div>
            </div>
          );
        })}

        {trackActivities.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-400 dark:text-slate-600 italic">
            Nenhuma atividade neste espaço
          </div>
        )}
      </div>
    </div>
  );
})}
                </div>

              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};