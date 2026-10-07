import React, { useMemo } from 'react';
import type { Activity } from '../types/event';
import { useLanguage } from '../i18n/useLanguage';
import { Trans } from 'react-i18next';
import {
  formatShortDate,
  formatFullDate,
  getDayOfWeek,
    formatTime,
  timeToMins,
  minsToTime,
  calculateDuration,
} from '../utils/dateUtils';
import { CATEGORY_BADGE_STYLES } from '../constants/eventDefaults';


interface TimelineViewProps {
  activities: Activity[];
  onEdit: (activity: Activity) => void;
  onDelete: (id: number) => void;
  onDuplicate: (activity: Activity) => void;
  onAddClick: () => void;
}

/**
 * Timeline scale
 *
 * The timeline is dynamically sized based on the actual time span
 * used by activities on each date.
 */
const HOUR_MINUTES = 60;
const PIXELS_PER_HOUR = 120;
const MIN_TIMELINE_WIDTH_PX = 360;
const TRACK_LABEL_WIDTH_PX = 260;

/**
 * Activity sub-lane sizing.
 */
const SUB_LANE_HEIGHT = 96;
const SUB_LANE_GAP = 8;
const MIN_CARD_WIDTH_PX = 150;

interface LaneAssignment {
  laneByActivityId: Map<number, number>;
  laneCount: number;
}

/**
 * Round a time downward to the nearest full hour.
 *
 * Example:
 * 14:37 -> 14:00
 * 19:00 -> 19:00
 */
function floorToHour(minutes: number): number {
  return Math.floor(minutes / HOUR_MINUTES) * HOUR_MINUTES;
}

/**
 * Round a time upward to the nearest full hour.
 *
 * Example:
 * 16:30 -> 17:00
 * 21:00 -> 21:00
 */
function ceilToHour(minutes: number): number {
  return Math.ceil(minutes / HOUR_MINUTES) * HOUR_MINUTES;
}

/**
 * Build the visible time axis for ONE date.
 *
 * We do NOT render the full 24-hour day.
 *
 * Example:
 *
 * Activities:
 *   14:00–17:30
 *   15:00–21:00
 *
 * Axis:
 *   14:00 | 15:00 | 16:00 | 17:00 | 17:30 | 18:00 | ... | 21:00
 *
 * Notice:
 * - unused hours before 14:00 are absent
 * - exact boundary 17:30 is included
 * - the end is extended to a full-hour boundary (21:00 here)
 */
function buildTimelinePoints(
  dayActivities: Activity[]
): number[] {
  if (dayActivities.length === 0) {
    return [];
  }

  const startTimes = dayActivities.map((activity) =>
    timeToMins(activity.startTime)
  );

  const endTimes = dayActivities.map((activity) =>
    timeToMins(activity.endTime)
  );

  const earliestStart = Math.min(...startTimes);
  const latestEnd = Math.max(...endTimes);

  const timelineStart = floorToHour(earliestStart);
  let timelineEnd = ceilToHour(latestEnd);

  // Ensure there is always at least one hour of visible span.
  if (timelineEnd <= timelineStart) {
    timelineEnd = timelineStart + HOUR_MINUTES;
  }

  const pointSet = new Set<number>();

  // Normal hourly markers.
  for (
    let minutes = timelineStart;
    minutes <= timelineEnd;
    minutes += HOUR_MINUTES
  ) {
    pointSet.add(minutes);
  }

  // Exact activity boundaries.
  dayActivities.forEach((activity) => {
    pointSet.add(timeToMins(activity.startTime));
    pointSet.add(timeToMins(activity.endTime));
  });

  return Array.from(pointSet).sort((a, b) => a - b);
}

/**
 * Calculate the pixel width of the actual timeline canvas.
 *
 * 120px per hour means:
 *   2 hours  = 240px, but minimum 360px
 *   8 hours  = 960px
 *   12 hours = 1440px
 *   24 hours = 2880px
 *
 * Long schedules therefore scroll horizontally instead of
 * being squeezed into the viewport.
 */
function getTimelineWidth(
  timelinePoints: number[]
): number {
  if (timelinePoints.length < 2) {
    return MIN_TIMELINE_WIDTH_PX;
  }

  const timelineStart = timelinePoints[0];
  const timelineEnd =
    timelinePoints[timelinePoints.length - 1];

  const durationHours =
    (timelineEnd - timelineStart) / HOUR_MINUTES;

  return Math.max(
    MIN_TIMELINE_WIDTH_PX,
    durationHours * PIXELS_PER_HOUR
  );
}

/**
 * Convert a time value into a percentage position within the
 * current date's timeline.
 */
function getTimelinePositionPercent(
  minutes: number,
  timelineStart: number,
  timelineEnd: number
): number {
  const span = timelineEnd - timelineStart;

  if (span <= 0) {
    return 0;
  }

  return (
    ((minutes - timelineStart) / span) * 100
  );
}

/**
 * Assign activities to visual sub-lanes.
 *
 * This considers both:
 *   1. Real time overlap
 *   2. The minimum 150px card width
 *
 * This preserves the readable-card behavior we implemented earlier.
 */
function assignActivityLanes(
  trackActivities: Activity[],
  timelineWidthPx: number,
  timelineSpanMinutes: number
): LaneAssignment {
  const minimumVisualDurationMinutes =
    (MIN_CARD_WIDTH_PX / timelineWidthPx) *
    timelineSpanMinutes;

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
  onEdit,
  onDelete,
  onDuplicate,
  onAddClick,
}) => {
  const { t, language } = useLanguage();

  const groupedByDate = useMemo(() => {
    return activities.reduce((acc, activity) => {
      const dateKey = activity.date || 'sem-data';

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }

      acc[dateKey].push(activity);

      return acc;
    }, {} as Record<string, Activity[]>);
  }, [activities]);

  const sortedDates = Object.keys(groupedByDate).sort();

  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-500">
          <i className="fa-solid fa-chart-gantt text-2xl"></i>
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          {t('timeline.noActivities')}
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
         {t('timeline.emptyDescription')}
        </p>

        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
        >
          <i className="fa-solid fa-plus"></i>
          <span>{t('timeline.addActivity')}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedDates.map((dateStr) => {
        const dayActivities = groupedByDate[dateStr];

const dayOfWeek = getDayOfWeek(
  dateStr,
  language
);

const fullDate = formatFullDate(
  dateStr,
  language
);

        // -------------------------------------------------------
        // Dynamic timeline for THIS date only.
        // -------------------------------------------------------

        const timelinePoints =
          buildTimelinePoints(dayActivities);

        const timelineStart = timelinePoints[0];
        const timelineEnd =
          timelinePoints[timelinePoints.length - 1];

        const timelineSpanMinutes =
          timelineEnd - timelineStart;

        const timelineWidthPx =
          getTimelineWidth(timelinePoints);

        // -------------------------------------------------------
        // Locations visible in this date.
        // -------------------------------------------------------

        const tracksForDay = Array.from(
  new Set(
    dayActivities
      .map(
        (activity) => activity.track
      )
      .filter(Boolean)
  )
);

        return (
          <div
            key={dateStr}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
          >
            {/* Date Header */}
            <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  {dayOfWeek} • {formatShortDate(
  dateStr,
  language
)}
                </div>

                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {fullDate}
                </h2>
              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                <Trans
                  i18nKey="metrics.activities"
                  count={dayActivities.length}
                  components={{ bold: <strong /> }}
                />
              </span>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="overflow-x-auto">
              <div
                style={{
                  width: `${
                    TRACK_LABEL_WIDTH_PX +
                    timelineWidthPx
                  }px`,
                }}
              >
                {/* ==========================================
                    TIME HEADER
                   ========================================== */}

                <div
                  className="grid border-b border-slate-200 dark:border-slate-700/60 bg-slate-50/40 dark:bg-slate-900/20"
                  style={{
                    gridTemplateColumns: `${TRACK_LABEL_WIDTH_PX}px ${timelineWidthPx}px`,
                  }}
                >
                  {/* Track header */}
                  <div className="p-3 border-r border-slate-200 dark:border-slate-700/60 font-sans font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                    {t('timeline.track')}
                  </div>

                  {/* Dynamic timeline header */}
                  <div
                    className="relative"
                    style={{
                      height: '42px',
                      width: `${timelineWidthPx}px`,
                    }}
                  >
                    {timelinePoints.map((minutes, index) => {
                      const leftPercent =
                        getTimelinePositionPercent(
                          minutes,
                          timelineStart,
                          timelineEnd
                        );

                      const isFirst = index === 0;
                      const isLast =
                        index ===
                        timelinePoints.length - 1;

                      let transform = '-50%';

                      if (isFirst) {
                        transform = '0';
                      } else if (isLast) {
                        transform = '-100%';
                      }

                      return (
                        <div
                          key={`${minutes}-${index}`}
                          className="absolute top-0 bottom-0"
                          style={{
                            left: `${leftPercent}%`,
                          }}
                        >
                          {/* Vertical time line */}
                          <div className="absolute inset-y-0 left-0 border-l border-slate-200/60 dark:border-slate-700/40" />

                          {/* Time label */}
                          <span
                            className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-mono font-semibold text-[10px] text-slate-500 dark:text-slate-400"
                            style={{
                              transform: `translateY(-50%) translateX(${transform === '0' ? '0' : transform === '-100%' ? '-100%' : '-50%'})`,
                            }}
                          >
                            {formatTime(
  minsToTime(minutes),
  language
)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ==========================================
                    TRACK ROWS
                   ========================================== */}

                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {tracksForDay.map((trackName) => {
                    const trackActivities =
                      dayActivities.filter(
                        (activity) =>
                          activity.track === trackName
                      );

                    const {
                      laneByActivityId,
                      laneCount,
                    } = assignActivityLanes(
                      trackActivities,
                      timelineWidthPx,
                      timelineSpanMinutes
                    );

                    const trackHeight =
                      laneCount * SUB_LANE_HEIGHT;

                    return (
                      <div
                        key={trackName}
                        className="grid items-stretch hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors"
                        style={{
                          gridTemplateColumns: `${TRACK_LABEL_WIDTH_PX}px ${timelineWidthPx}px`,
                          minHeight: `${trackHeight}px`,
                        }}
                      >
                        {/* Track Name */}
                        <div
                          className="p-4 border-r border-slate-200 dark:border-slate-700/60 flex items-center gap-2"
                          style={{
                            minHeight: `${trackHeight}px`,
                          }}
                        >
                          <i className="fa-solid fa-location-dot text-slate-400 text-xs"></i>

                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                            {trackName}
                          </span>
                        </div>

                        {/* Timeline Canvas */}
                        <div
                          className="relative"
                          style={{
                            width: `${timelineWidthPx}px`,
                            height: `${trackHeight}px`,
                          }}
                        >
                          {/* Dynamic time grid */}
                          <div className="absolute inset-0 pointer-events-none">
                            {timelinePoints.map(
                              (minutes, index) => {
                                const leftPercent =
                                  getTimelinePositionPercent(
                                    minutes,
                                    timelineStart,
                                    timelineEnd
                                  );

                                return (
                                  <div
                                    key={`${minutes}-${index}`}
                                    className="absolute top-0 bottom-0 border-l border-slate-100 dark:border-slate-700/30"
                                    style={{
                                      left: `${leftPercent}%`,
                                    }}
                                  />
                                );
                              }
                            )}
                          </div>

                          {/* Activities */}
                          {trackActivities.map((activity) => {
                            const startMins =
                              timeToMins(
                                activity.startTime
                              );

                            const endMins =
                              timeToMins(
                                activity.endTime
                              );

                            const clampedStart =
                              Math.max(
                                timelineStart,
                                startMins
                              );

                            const clampedEnd =
                              Math.min(
                                timelineEnd,
                                endMins
                              );

                            const leftPercent =
                              getTimelinePositionPercent(
                                clampedStart,
                                timelineStart,
                                timelineEnd
                              );

                            const widthPercent =
                              Math.max(
                                0,
                                (
                                  (clampedEnd -
                                    clampedStart) /
                                  timelineSpanMinutes
                                ) * 100
                              );

                            const duration =
                              calculateDuration(
                                activity.startTime,
                                activity.endTime
                              );

                            const badgeClass =
                              CATEGORY_BADGE_STYLES[
                                activity.category
                              ] ||
                              'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';

                            const lane =
                              laneByActivityId.get(
                                activity.id
                              ) ?? 0;

                            const top =
                              lane *
                                SUB_LANE_HEIGHT +
                              SUB_LANE_GAP / 2;

                            const height =
                              SUB_LANE_HEIGHT -
                              SUB_LANE_GAP;

                            return (
                              <div
                                key={activity.id}
                                className="absolute rounded-xl border border-black/10 dark:border-white/10 shadow-sm transition-all hover:scale-[1.02] hover:z-20 cursor-pointer group flex flex-col justify-between overflow-hidden p-2.5"
                                style={{
                                  left: `${leftPercent}%`,
                                  width: `${widthPercent}%`,
                                  top: `${top}px`,
                                  height: `${height}px`,
                                  backgroundColor:
                                    activity.color
                                      ? `${activity.color}15`
                                      : '#3c78d815',
                                  borderLeftColor:
                                    activity.color ||
                                    '#3c78d8',
                                  borderLeftWidth: '4px',
                                  minWidth: `${MIN_CARD_WIDTH_PX}px`,
                                }}
                                onClick={() =>
                                  onEdit(activity)
                                }
                                title={`${formatTime(
  activity.startTime,
  language
)} - ${formatTime(
  activity.endTime,
  language
)} | ${activity.title}`}
                              >
                                {/* Time */}
                                <div className="flex items-start justify-between gap-1">
                                  <span className="min-w-0 flex-1 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                                    {formatTime(
  activity.startTime,
  language
)} - {formatTime(
  activity.endTime,
  language
)} ({duration.formatted})
                                  </span>

                                  <div className="hidden group-hover:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        onDuplicate(
                                          activity
                                        );
                                      }}
                                      className="p-0.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400"
                                      title={t('timeline.duplicate')}
                                    >
                                      <i className="fa-solid fa-copy text-[10px]"></i>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        onDelete(
                                          activity.id
                                        );
                                      }}
                                      className="p-0.5 text-slate-500 hover:text-rose-600 dark:text-slate-400"
                                      title={t('timeline.delete')}
                                    >
                                      <i className="fa-solid fa-trash-can text-[10px]"></i>
                                    </button>
                                  </div>
                                </div>

                                {/* Title */}
                                <div className="min-w-0 font-bold text-xs text-slate-900 dark:text-white truncate mt-1">
                                  {activity.title}
                                </div>

                                {/* Category */}
                                <div className="mt-1 flex items-center justify-between">
                                  {activity.category?.trim() ? (
                                    <span
                                      className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold ${badgeClass}`}
                                    >
                                      {activity.category.trim()}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 italic">
                                      {t('categories.none')}
                                    </span>
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
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimelineView;