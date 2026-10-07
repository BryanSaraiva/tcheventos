import type { Activity, ScheduleStats } from '../types/event';
import type { AppLanguage } from '../i18n/types';
import {
  DATE_FORMATS,
  TIME_FORMAT,
} from '../i18n/config';

/**
 * Parses a YYYY-MM-DD date string safely into a local Date object.
 *
 * The date is created at noon rather than midnight so formatting is
 * protected against timezone/DST boundary issues.
 *
 * IMPORTANT:
 * The application's canonical stored date format remains:
 * YYYY-MM-DD
 */
export function parseLocalDate(
  dateStr: string
): Date {
  if (!dateStr) {
    return new Date(NaN);
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      dateStr
    );

  if (!match) {
    return new Date(NaN);
  }

  const [, year, month, day] =
    match;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    12,
    0,
    0,
    0
  );
}

/**
 * Formats a date according to the active application locale.
 *
 * PT-BR:
 *   18/11/2026
 *
 * EN-US:
 *   11/18/2026
 */
export function formatShortDate(
  dateStr: string,
  language: AppLanguage = 'pt-BR'
): string {
  if (!dateStr) {
    return '';
  }

  const date = parseLocalDate(
    dateStr
  );

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(
    language,
    DATE_FORMATS[language].short
  ).format(date);
}

/**
 * Formats a date using a medium-length locale-aware format.
 *
 * PT-BR:
 *   18 de nov. de 2026
 *
 * EN-US:
 *   Nov 18, 2026
 */
export function formatMediumDate(
  dateStr: string,
  language: AppLanguage = 'pt-BR'
): string {
  if (!dateStr) {
    return '';
  }

  const date = parseLocalDate(
    dateStr
  );

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(
    language,
    DATE_FORMATS[language].medium
  ).format(date);
}

/**
 * Formats a date in a long locale-aware form.
 *
 * PT-BR:
 *   18 de novembro de 2026
 *
 * EN-US:
 *   November 18, 2026
 */
export function formatFullDate(
  dateStr: string,
  language: AppLanguage = 'pt-BR'
): string {
  if (!dateStr) {
    return '';
  }

  const date = parseLocalDate(
    dateStr
  );

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(
    language,
    DATE_FORMATS[language].long
  ).format(date);
}

/**
 * Formats a date with the weekday included.
 *
 * PT-BR:
 *   quarta-feira, 18 de novembro de 2026
 *
 * EN-US:
 *   Wednesday, November 18, 2026
 */
export function formatFullDateWithWeekday(
  dateStr: string,
  language: AppLanguage = 'pt-BR'
): string {
  if (!dateStr) {
    return '';
  }

  const date = parseLocalDate(
    dateStr
  );

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(
    language,
    DATE_FORMATS[language].full
  ).format(date);
}

/**
 * Returns the localized short weekday name.
 *
 * PT-BR:
 *   Qua
 *
 * EN-US:
 *   Wed
 */
export function getDayOfWeek(
  dateStr: string,
  language: AppLanguage = 'pt-BR'
): string {
  if (!dateStr) {
    return '';
  }

  const date = parseLocalDate(
    dateStr
  );

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const formatted =
    new Intl.DateTimeFormat(
      language,
      {
        weekday: 'short',
      }
    ).format(date);

  return (
    formatted.charAt(0).toLocaleUpperCase(
      language
    ) +
    formatted.slice(1)
  );
}

/**
 * Returns the localized full weekday name.
 *
 * PT-BR:
 *   quarta-feira
 *
 * EN-US:
 *   Wednesday
 */
export function getFullDayOfWeek(
  dateStr: string,
  language: AppLanguage = 'pt-BR'
): string {
  if (!dateStr) {
    return '';
  }

  const date = parseLocalDate(
    dateStr
  );

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(
    language,
    {
      weekday: 'long',
    }
  ).format(date);
}

/**
 * Returns a localized time string.
 *
 * The internal activity time stays "HH:mm".
 * Only the presentation changes.
 *
 * PT-BR:
 *   14:30
 *
 * EN-US:
 *   2:30 PM
 */
export function formatTime(
  timeStr: string,
  language: AppLanguage = 'pt-BR'
): string {
  if (!timeStr) {
    return '';
  }

  const match =
    /^(\d{1,2}):(\d{2})$/.exec(
      timeStr
    );

  if (!match) {
    return '';
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return '';
  }

  /*
   * Use a fixed local date purely to format the time.
   * The actual calendar date is irrelevant here.
   */
  const date = new Date(
    2000,
    0,
    1,
    hours,
    minutes,
    0,
    0
  );

  return new Intl.DateTimeFormat(
    language,
    TIME_FORMAT[language]
  ).format(date);
}

/**
 * Generates the localized header date badge.
 *
 * Examples:
 *
 * One day:
 *   PT-BR: 18 de novembro de 2026
 *   EN-US: November 18, 2026
 *
 * Same-month multi-day:
 *   PT-BR: 18 e 19 de novembro de 2026
 *   EN-US: November 18–19, 2026
 *
 * Different months:
 *   PT-BR: 30/11/2026 a 02/12/2026
 *   EN-US: 11/30/2026 – 12/02/2026
 */
export function getHeaderDateBadgeText(
  dates: string[],
  language: AppLanguage = 'pt-BR'
): string {
  if (!dates || dates.length === 0) {
    return language === 'en-US'
      ? 'No dates'
      : 'Sem datas';
  }

  const sortedDates = [...dates].sort();

  // Single date.
  if (sortedDates.length === 1) {
    return formatFullDate(
      sortedDates[0],
      language
    );
  }

  const firstDate = parseLocalDate(
    sortedDates[0]
  );

  const lastDate = parseLocalDate(
    sortedDates[sortedDates.length - 1]
  );

  if (
    Number.isNaN(firstDate.getTime()) ||
    Number.isNaN(lastDate.getTime())
  ) {
    return '';
  }

  const sameYear =
    firstDate.getFullYear() ===
    lastDate.getFullYear();

  const sameMonth =
    sameYear &&
    firstDate.getMonth() ===
      lastDate.getMonth();

  const firstDay = firstDate.getDate();
  const lastDay = lastDate.getDate();

  // ----------------------------------------------------------
  // Same month + same year
  // ----------------------------------------------------------

  if (sameMonth) {
    const monthName =
      new Intl.DateTimeFormat(
        language,
        {
          month: 'long',
        }
      ).format(firstDate);

    const year =
      firstDate.getFullYear();

    if (language === 'en-US') {
      // October 26–30, 2026
      return `${monthName} ${firstDay}–${lastDay}, ${year}`;
    }

    // 26 a 30 de outubro de 2026
    return `${firstDay} a ${lastDay} de ${monthName} de ${year}`;
  }

  // ----------------------------------------------------------
  // Different month, same year
  // ----------------------------------------------------------

  if (sameYear) {
    const firstMonth =
      new Intl.DateTimeFormat(
        language,
        {
          month: 'long',
        }
      ).format(firstDate);

    const lastMonth =
      new Intl.DateTimeFormat(
        language,
        {
          month: 'long',
        }
      ).format(lastDate);

    const year =
      firstDate.getFullYear();

    if (language === 'en-US') {
      // October 26 – November 2, 2026
      return `${firstMonth} ${firstDay} – ${lastMonth} ${lastDay}, ${year}`;
    }

    // 26 de outubro a 2 de novembro de 2026
    return `${firstDay} de ${firstMonth} a ${lastDay} de ${lastMonth} de ${year}`;
  }

  // ----------------------------------------------------------
  // Different year
  // ----------------------------------------------------------

  const first =
    new Intl.DateTimeFormat(
      language,
      DATE_FORMATS[language].short
    ).format(firstDate);

  const last =
    new Intl.DateTimeFormat(
      language,
      DATE_FORMATS[language].short
    ).format(lastDate);

  if (language === 'en-US') {
    return `${first} – ${last}`;
  }

  return `${first} a ${last}`;
}

/**
 * Converts "HH:mm" into total minutes from midnight.
 *
 * This remains locale-independent because it operates on the
 * canonical internal representation.
 */
export function timeToMins(
  timeStr: string
): number {
  if (!timeStr) {
    return 0;
  }

  const match =
    /^(\d{1,2}):(\d{2})$/.exec(
      timeStr
    );

  if (!match) {
    return 0;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  return (
    hours * 60 + minutes
  );
}

/**
 * Converts total minutes from midnight into canonical "HH:mm".
 *
 * This is an internal data/geometry representation and therefore
 * does NOT localize the result.
 */
export function minsToTime(
  minutes: number
): string {
  const safeMinutes =
    Math.max(
      0,
      Math.min(
        23 * 60 + 59,
        Math.floor(minutes)
      )
    );

  const hrs =
    Math.floor(
      safeMinutes / 60
    );

  const mins =
    safeMinutes % 60;

  return `${String(hrs).padStart(
    2,
    '0'
  )}:${String(mins).padStart(
    2,
    '0'
  )}`;
}

/**
 * Calculates duration in minutes and a compact display string.
 *
 * Duration itself does not need a full locale-specific date format,
 * but we preserve the existing compact notation used throughout
 * the application.
 */
export function calculateDuration(
  startTime: string,
  endTime: string
): {
  minutes: number;
  formatted: string;
} {
  const startMins =
    timeToMins(startTime);

  const endMins =
    timeToMins(endTime);

  const diffMins =
    Math.max(
      0,
      endMins - startMins
    );

  const hours =
    Math.floor(
      diffMins / 60
    );

  const mins =
    diffMins % 60;

  let formatted = '';

  if (hours > 0) {
    formatted += `${hours}h`;
  }

  if (
    mins > 0 ||
    hours === 0
  ) {
    formatted += `${
      formatted ? ' ' : ''
    }${mins}m`;
  }

  return {
    minutes: diffMins,
    formatted,
  };
}

/**
 * Formats cumulative duration.
 */
export function formatTotalDuration(
  totalMinutes: number
): string {
  const hours =
    Math.floor(
      totalMinutes / 60
    );

  const mins =
    totalMinutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

/**
 * Checks if two time intervals overlap.
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

  return (
    Math.max(s1, s2) <
    Math.min(e1, e2)
  );
}

/**
 * Computes schedule statistics including total duration and
 * same-space conflicts.
 */
export function computeScheduleStats(
  activities: Activity[]
): ScheduleStats {
  let totalMinutes = 0;
  let conflictCount = 0;

  activities.forEach(
    (activity) => {
      const duration =
        calculateDuration(
          activity.startTime,
          activity.endTime
        );

      totalMinutes +=
        duration.minutes;
    }
  );

  for (
    let i = 0;
    i < activities.length;
    i++
  ) {
    for (
      let j = i + 1;
      j < activities.length;
      j++
    ) {
      const act1 =
        activities[i];

      const act2 =
        activities[j];

      if (
        act1.date ===
          act2.date &&
        act1.track ===
          act2.track &&
        checkTimeOverlap(
          act1.startTime,
          act1.endTime,
          act2.startTime,
          act2.endTime
        )
      ) {
        conflictCount++;
      }
    }
  }

  return {
    totalMinutes,
    formattedDuration:
      formatTotalDuration(
        totalMinutes
      ),
    conflictCount,
  };
}

/**
 * Converts activities into the application's canonical CSV export.
 *
 * IMPORTANT:
 * The date/time values remain machine-readable:
 *
 *   YYYY-MM-DD
 *   HH:mm
 *
 * The human-readable labels will be localized elsewhere.
 */
export function exportActivitiesToCSV(
  activities: Activity[],
  language: AppLanguage = 'pt-BR'
): string {
  const headers =
    language === 'en-US'
      ? [
          'ID',
          'Date',
          'Start Time',
          'End Time',
          'Space/Track',
          'Title',
          'Category',
          'Color',
          'Notes',
        ]
      : [
          'ID',
          'Data',
          'Hora Início',
          'Hora Fim',
          'Espaço/Trilha',
          'Título',
          'Categoria',
          'Cor',
          'Notas',
        ];

  const rows =
    activities.map(
      (activity) => [
        activity.id,
        activity.date,
        activity.startTime,
        activity.endTime,
        `"${(
          activity.track || ''
        ).replace(
          /"/g,
          '""'
        )}"`,
        `"${(
          activity.title || ''
        ).replace(
          /"/g,
          '""'
        )}"`,
        `"${(
          activity.category || ''
        ).replace(
          /"/g,
          '""'
        )}"`,
        activity.color,
        `"${(
          activity.notes || ''
        ).replace(
          /"/g,
          '""'
        )}"`,
      ]
    );

  return [
    headers.join(','),
    ...rows.map(
      (row) => row.join(',')
    ),
  ].join('\n');
}

/**
 * Parses the application's canonical CSV representation.
 *
 * We intentionally keep parsing locale-neutral for dates and times.
 * That way a CSV exported in PT-BR can still be safely imported after
 * switching the application to English, and vice versa.
 */
export function parseCSVToActivities(
  csvContent: string
): Partial<Activity>[] {
  const lines =
    csvContent
      .split(/\r?\n/)
      .filter(
        (line) =>
          line.trim() !== ''
      );

  if (lines.length <= 1) {
    return [];
  }

  const dataLines =
    lines.slice(1);

  const parsedActivities:
    Partial<Activity>[] = [];

  dataLines.forEach(
    (line, index) => {
      const matches =
        line.match(
          /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g
        ) ||
        line.split(',');

      if (
        matches.length >= 6
      ) {
        const clean = (
          str: string
        ) =>
          (str || '')
            .replace(
              /^"(.*)"$/,
              '$1'
            )
            .replace(
              /""/g,
              '"'
            )
            .trim();

        /*
         * Expected canonical CSV:
         * 0 = ID
         * 1 = Date
         * 2 = Start Time
         * 3 = End Time
         * 4 = Space / Track
         * 5 = Title
         * 6 = Category
         * 7 = Color
         * 8 = Notes
         */
        const date =
          clean(
            matches[1] ||
              matches[0]
          );

        const startTime =
          clean(
            matches[2] ||
              matches[1]
          );

        const endTime =
          clean(
            matches[3] ||
              matches[2]
          );

        const track =
          clean(
            matches[4] ||
              matches[3]
          );

        const title =
          clean(
            matches[5] ||
              matches[4]
          );

        const category =
          matches[6]
            ? clean(
                matches[6]
              )
            : '';

        const color =
          matches[7]
            ? clean(
                matches[7]
              )
            : '#3c78d8';

        const notes =
          matches[8]
            ? clean(
                matches[8]
              )
            : '';

        parsedActivities.push(
          {
            id:
              Date.now() +
              index,

            date,

            startTime,

            endTime,

            track,

            title,

            category,

            color,

            notes,
          }
        );
      }
    }
  );

  return parsedActivities;
}