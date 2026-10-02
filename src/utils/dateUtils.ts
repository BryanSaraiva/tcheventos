import type { Activity, ScheduleStats } from '../types/event';

/**
 * Full month names in Portuguese
 */
const MONTH_NAMES_PT_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Days of week short names in Portuguese
 */
const DAYS_OF_WEEK_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Days of week full names in Portuguese
 */
const DAYS_OF_WEEK_FULL = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado'
];

/**
 * Parses a YYYY-MM-DD string safely into a local Date object without timezone shift
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formats YYYY-MM-DD to "DD/MM" (e.g. "18/11")
 */
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/**
 * Formats YYYY-MM-DD to full date string (e.g. "18 de Novembro de 2026")
 */
export function formatFullDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  const day = date.getDate();
  const month = MONTH_NAMES_PT_FULL[date.getMonth()];
  const year = date.getFullYear();
  return `${day} de ${month} de ${year}`;
}

/**
 * Returns short day of week (e.g. "Qua")
 */
export function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  return DAYS_OF_WEEK_SHORT[date.getDay()];
}

/**
 * Returns full day of week (e.g. "Quarta-feira")
 */
export function getFullDayOfWeek(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  return DAYS_OF_WEEK_FULL[date.getDay()];
}

/**
 * Generates header summary badge text for multi-day events
 * e.g. ["2026-11-18", "2026-11-19"] => "18 e 19 de Novembro, 2026"
 */
export function getHeaderDateBadgeText(dates: string[]): string {
  if (!dates || dates.length === 0) return 'Sem datas';
  if (dates.length === 1) return formatFullDate(dates[0]);

  const sortedDates = [...dates].sort();
  const firstDate = parseLocalDate(sortedDates[0]);
  const lastDate = parseLocalDate(sortedDates[sortedDates.length - 1]);

  const sameMonth = firstDate.getMonth() === lastDate.getMonth();
  const sameYear = firstDate.getFullYear() === lastDate.getFullYear();

  if (sameMonth && sameYear) {
    const daysList = sortedDates.map(d => parseLocalDate(d).getDate()).join(' e ');
    const month = MONTH_NAMES_PT_FULL[firstDate.getMonth()];
    return `${daysList} de ${month}, ${firstDate.getFullYear()}`;
  }

  return `${formatShortDate(sortedDates[0])} a ${formatShortDate(sortedDates[sortedDates.length - 1])}, ${lastDate.getFullYear()}`;
}

/**
 * Converts "HH:mm" time string to total minutes from midnight
 */
export function timeToMins(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Converts total minutes from midnight to "HH:mm" string
 */
export function minsToTime(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Calculates duration in minutes and formatted string between start and end time
 */
export function calculateDuration(startTime: string, endTime: string): { minutes: number; formatted: string } {
  const startMins = timeToMins(startTime);
  const endMins = timeToMins(endTime);
  const diffMins = Math.max(0, endMins - startMins);

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  let formatted = '';
  if (hours > 0) {
    formatted += `${hours}h`;
  }
  if (mins > 0 || hours === 0) {
    formatted += `${formatted ? ' ' : ''}${mins}m`;
  }

  return { minutes: diffMins, formatted };
}

/**
 * Formats total cumulative minutes into "Xh Ym" string
 */
export function formatTotalDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Checks if two time intervals overlap
 */
export function checkTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMins(start1);
  const e1 = timeToMins(end1);
  const s2 = timeToMins(start2);
  const e2 = timeToMins(end2);

  return Math.max(s1, s2) < Math.min(e1, e2);
}

/**
 * Computes schedule statistics including total duration and count of room conflicts
 */
export function computeScheduleStats(activities: Activity[]): ScheduleStats {
  let totalMinutes = 0;
  let conflictCount = 0;

  activities.forEach((act) => {
    const duration = calculateDuration(act.startTime, act.endTime);
    totalMinutes += duration.minutes;
  });

  // Calculate conflicts within the same track and same day
  for (let i = 0; i < activities.length; i++) {
    for (let j = i + 1; j < activities.length; j++) {
      const act1 = activities[i];
      const act2 = activities[j];

      if (
        act1.date === act2.date &&
        act1.track === act2.track &&
        checkTimeOverlap(act1.startTime, act1.endTime, act2.startTime, act2.endTime)
      ) {
        conflictCount++;
      }
    }
  }

  return {
    totalMinutes,
    formattedDuration: formatTotalDuration(totalMinutes),
    conflictCount,
  };
}

/**
 * Converts activities list to downloadable CSV content
 */
export function exportActivitiesToCSV(activities: Activity[]): string {
  const headers = ['ID', 'Data', 'Hora Inicio', 'Hora Fim', 'Espaco/Trilha', 'Titulo', 'Categoria', 'Cor', 'Notas'];
  
  const rows = activities.map((act) => [
    act.id,
    act.date,
    act.startTime,
    act.endTime,
    `"${(act.track || '').replace(/"/g, '""')}"`,
    `"${(act.title || '').replace(/"/g, '""')}"`,
    `"${(act.category || '').replace(/"/g, '""')}"`,
    act.color,
    `"${(act.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Parses raw CSV content text into structured Activity objects
 */
export function parseCSVToActivities(csvContent: string): Partial<Activity>[] {
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length <= 1) return [];

  // Remove header row
  const dataLines = lines.slice(1);
  const parsedActivities: Partial<Activity>[] = [];

  dataLines.forEach((line, index) => {
    // Regex matching CSV values taking quote escaping into account
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
    if (matches.length >= 6) {
      const clean = (str: string) => (str || '').replace(/^"(.*)"$/, '$1').replace(/""/g, '"').trim();

      const date = clean(matches[1] || matches[0]);
      const startTime = clean(matches[2] || matches[1]);
      const endTime = clean(matches[3] || matches[2]);
      const track = clean(matches[4] || matches[3]);
      const title = clean(matches[5] || matches[4]);
      const category = clean(matches[6] || matches[5] || 'Palestra');
      const color = matches[7] ? clean(matches[7]) : '#3c78d8';
      const notes = matches[8] ? clean(matches[8]) : '';

      parsedActivities.push({
        id: Date.now() + index,
        date,
        startTime,
        endTime,
        track,
        title,
        category,
        color,
        notes,
      });
    }
  });

  return parsedActivities;
}