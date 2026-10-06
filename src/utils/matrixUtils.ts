import type { Activity } from '../types/event';
import { timeToMins, minsToTime, calculateDuration } from './dateUtils';

export interface MatrixLaneActivity {
  activity: Activity;
  startIndex: number;
  endIndex: number;
}

export interface MatrixLane {
  activities: MatrixLaneActivity[];
}

export interface MatrixDay {
  date: string;
  activities: Activity[];
  timePoints: number[];
  tracks: string[];
  lanesByTrack: Map<string, MatrixLane[]>;
}

const HOUR_MINUTES = 60;

function floorToHour(minutes: number): number {
  return Math.floor(minutes / HOUR_MINUTES) * HOUR_MINUTES;
}

function ceilToHour(minutes: number): number {
  return Math.ceil(minutes / HOUR_MINUTES) * HOUR_MINUTES;
}

/**
 * Dynamic axis for one day's activities.
 *
 * Example:
 * 14:00–17:30
 * 15:00–21:00
 *
 * produces:
 * 14:00, 15:00, 16:00, 17:00, 17:30, 18:00, 19:00, 20:00, 21:00
 */
export function buildMatrixTimePoints(
  activities: Activity[]
): number[] {
  if (activities.length === 0) {
    return [];
  }

  const starts = activities.map((activity) =>
    timeToMins(activity.startTime)
  );

  const ends = activities.map((activity) =>
    timeToMins(activity.endTime)
  );

  const start = floorToHour(Math.min(...starts));
  const end = ceilToHour(Math.max(...ends));

  const points = new Set<number>();

  for (
    let minutes = start;
    minutes <= end;
    minutes += HOUR_MINUTES
  ) {
    points.add(minutes);
  }

  // Always include exact activity boundaries.
  activities.forEach((activity) => {
    points.add(timeToMins(activity.startTime));
    points.add(timeToMins(activity.endTime));
  });

  return [...points].sort((a, b) => a - b);
}

/**
 * Assign activities to spreadsheet sub-lanes.
 *
 * Because spreadsheet cells are merged through the END boundary,
 * activities touching at exactly the same boundary cannot occupy
 * the same lane.
 */
function buildLanes(
  activities: Activity[],
  timePoints: number[]
): MatrixLane[] {
  const sorted = [...activities].sort((a, b) => {
    const startDifference =
      timeToMins(a.startTime) -
      timeToMins(b.startTime);

    if (startDifference !== 0) {
      return startDifference;
    }

    return timeToMins(a.endTime) -
      timeToMins(b.endTime);
  });

  const lanes: MatrixLane[] = [];
  const laneEndIndexes: number[] = [];

  for (const activity of sorted) {
    const startTime = timeToMins(activity.startTime);
    const endTime = timeToMins(activity.endTime);

    const startIndex = timePoints.indexOf(startTime);
    const endIndex = timePoints.indexOf(endTime);

    if (startIndex === -1 || endIndex === -1) {
      continue;
    }

    const availableLane = laneEndIndexes.findIndex(
      (lastEndIndex) => lastEndIndex < startIndex
    );

    const laneIndex =
      availableLane === -1
        ? laneEndIndexes.length
        : availableLane;

    const entry: MatrixLaneActivity = {
      activity,
      startIndex,
      endIndex,
    };

    if (laneIndex === lanes.length) {
      lanes.push({
        activities: [entry],
      });

      laneEndIndexes.push(endIndex);
    } else {
      lanes[laneIndex].activities.push(entry);
      laneEndIndexes[laneIndex] = endIndex;
    }
  }

  return lanes;
}

export function buildMatrixDay(
  date: string,
  activities: Activity[],
  availableTracks: string[]
): MatrixDay {
  const dayActivities = activities.filter(
    (activity) => activity.date === date
  );

  const timePoints =
    buildMatrixTimePoints(dayActivities);

  const tracks = Array.from(
    new Set([
      ...availableTracks,
      ...dayActivities.map(
        (activity) => activity.track
      ),
    ])
  ).filter(Boolean);

  const lanesByTrack = new Map<string, MatrixLane[]>();

  tracks.forEach((track) => {
    const trackActivities = dayActivities.filter(
      (activity) => activity.track === track
    );

    lanesByTrack.set(
      track,
      buildLanes(
        trackActivities,
        timePoints
      )
    );
  });

  return {
    date,
    activities: dayActivities,
    timePoints,
    tracks,
    lanesByTrack,
  };
}

export function formatMatrixActivity(
  activity: Activity
): string {
  const duration = calculateDuration(
    activity.startTime,
    activity.endTime
  );

  return [
    `${activity.startTime} - ${activity.endTime} (${duration.formatted})`,
    activity.title,
    activity.category?.trim() || 'Sem categoria',
  ].join('\n');
}

export function formatMatrixTime(
  minutes: number
): string {
  return minsToTime(minutes);
}