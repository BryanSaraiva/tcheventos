
import ExcelJS from 'exceljs';
import type { Activity } from '../types/event';
import type { AppLanguage } from '../i18n/types';
import {
  formatFullDate,
  getFullDayOfWeek,
  formatTime,
  timeToMins,
} from './dateUtils';

const HEADER_FILL = 'FF0F172A';
const HEADER_FONT = 'FFFFFFFF';
const BORDER_COLOR = 'FFE2E8F0';
const DATE_HEADER_FILL = 'FFECFDF5';
const DATE_HEADER_FONT = 'FF065F46';
const DEFAULT_ACTIVITY_COLOR = '3C78D8';

interface ProgramLabels {
  sheetName: string;
  time: string;
  activityLocation: string;
  emptySchedule: string;
}

function getLabels(language: AppLanguage): ProgramLabels {
  return language === 'en-US'
    ? {
        sheetName: 'Event Schedule',
        time: 'Time',
        activityLocation: 'Activity / Location',
        emptySchedule: 'No activities scheduled',
      }
    : {
        sheetName: 'Programação',
        time: 'Horário',
        activityLocation: 'Atividade / Local',
        emptySchedule: 'Nenhuma atividade programada',
      };
}

function getActivityColor(color?: string): string {
  const normalized = (color || '')
    .replace(/^#/, '')
    .trim();

  return /^[0-9a-fA-F]{6}$/.test(normalized)
    ? normalized.toUpperCase()
    : DEFAULT_ACTIVITY_COLOR;
}

/**
 * Creates a light background tint from the activity color.
 * The original color is preserved in the left accent border.
 */
function getLightFill(color?: string): string {
  const hex = getActivityColor(color);
  const channels = [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];

  const lightChannels = channels.map((channel) =>
    Math.round(channel + (255 - channel) * 0.5)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()
  );

  return `FF${lightChannels.join('')}`;
}

function estimateWrappedLines(
  text: string,
  maxCharsPerLine: number
): number {
  const paragraphs = text.split(/\r?\n/);
  let totalLines = 0;

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      totalLines++;
      continue;
    }

    let lineLength = 0;
    totalLines++;

    for (const word of words) {
      // Handle exceptionally long words that cannot fit on one line.
      if (word.length > maxCharsPerLine) {
        if (lineLength > 0) {
          totalLines++;
          lineLength = 0;
        }

        const wrappedWordLines = Math.ceil(
          word.length / maxCharsPerLine
        );

        totalLines += wrappedWordLines - 1;

        lineLength =
          word.length % maxCharsPerLine || maxCharsPerLine;

        continue;
      }

      const nextLength =
        lineLength === 0
          ? word.length
          : lineLength + 1 + word.length;

      if (nextLength > maxCharsPerLine) {
        totalLines++;
        lineLength = word.length;
      } else {
        lineLength = nextLength;
      }
    }
  }

  return Math.max(1, totalLines);
}

function capitalizeFirst(
  value: string,
  language: AppLanguage
): string {
  if (!value) return value;

  return (
    value.charAt(0).toLocaleUpperCase(language) +
    value.slice(1)
  );
}

function applyGridBorder(
  cell: ExcelJS.Cell,
  activityColor?: string
): void {
  cell.border = {
    top: {
      style: 'thin',
      color: { argb: BORDER_COLOR },
    },
    bottom: {
      style: 'thin',
      color: { argb: BORDER_COLOR },
    },
    right: {
      style: 'thin',
      color: { argb: BORDER_COLOR },
    },
    left: activityColor
      ? {
          style: 'medium',
          color: {
            argb: `FF${getActivityColor(activityColor)}`,
          },
        }
      : {
          style: 'thin',
          color: { argb: BORDER_COLOR },
        },
  };
}

function applyColumnHeader(
  cell: ExcelJS.Cell,
  value: string
): void {
  cell.value = value;

  cell.font = {
    name: 'Aptos',
    size: 10,
    bold: true,
    color: { argb: HEADER_FONT },
  };

  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: HEADER_FILL },
  };

  cell.alignment = {
    vertical: 'middle',
    horizontal: 'left',
    wrapText: true,
  };

  applyGridBorder(cell);
}

function addDateSection(
  worksheet: ExcelJS.Worksheet,
  date: string,
  activities: Activity[],
  startRow: number,
  language: AppLanguage,
  labels: ProgramLabels
): number {
  let rowNumber = startRow;

  // ----------------------------------------------------------
  // Date section heading
  // ----------------------------------------------------------

  worksheet.mergeCells(rowNumber, 1, rowNumber, 2);

  const weekday = capitalizeFirst(
    getFullDayOfWeek(date, language),
    language
  );

  const formattedDate = formatFullDate(date, language);

  const dateHeading = worksheet.getCell(rowNumber, 1);

  dateHeading.value = `${weekday} • ${formattedDate}`;

  dateHeading.font = {
    name: 'Aptos',
    size: 12,
    bold: true,
    color: { argb: DATE_HEADER_FONT },
  };

  dateHeading.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: DATE_HEADER_FILL },
  };

  dateHeading.alignment = {
    vertical: 'middle',
    horizontal: 'left',
  };

  dateHeading.border = {
    bottom: {
      style: 'medium',
      color: { argb: 'FF10B981' },
    },
  };

  worksheet.getRow(rowNumber).height = 28;
  rowNumber++;

  // ----------------------------------------------------------
  // Column headings
  // ----------------------------------------------------------

  applyColumnHeader(
    worksheet.getCell(rowNumber, 1),
    labels.time
  );

  applyColumnHeader(
    worksheet.getCell(rowNumber, 2),
    labels.activityLocation
  );

  worksheet.getRow(rowNumber).height = 24;
  rowNumber++;

  // ----------------------------------------------------------
  // Activities: start time, then end time
  // ----------------------------------------------------------

  const sortedActivities = [...activities].sort((a, b) => {
    const startDifference =
      timeToMins(a.startTime) - timeToMins(b.startTime);

    if (startDifference !== 0) {
      return startDifference;
    }

    return timeToMins(a.endTime) - timeToMins(b.endTime);
  });

  sortedActivities.forEach((activity) => {
const speakerNames = (activity.speakers ?? '')
  .split(/\r?\n/)
  .map((name) => name.trim())
  .filter(Boolean)
  .join(' · ');

const color = getActivityColor(activity.color);
const lightFill = getLightFill(activity.color);

const row = worksheet.getRow(rowNumber);

const titleLines = estimateWrappedLines(activity.title, 54);
const locationLines = estimateWrappedLines(
  activity.track || '',
  62
);
const speakerLines = speakerNames
  ? estimateWrappedLines(speakerNames, 70)
  : 0;

// Estimate the height needed by each text line, plus slim padding.
row.height =
  titleLines * 18 +
  locationLines * 12.5 +
  speakerLines * 12 +
  4;

    // Column A: start and end times on separate lines.
    const timeCell = worksheet.getCell(rowNumber, 1);

    timeCell.value = [
      formatTime(activity.startTime, language),
      formatTime(activity.endTime, language),
    ].join('\n');

    timeCell.font = {
      name: 'Aptos',
      size: 10,
      bold: true,
      color: { argb: 'FF334155' },
    };

    timeCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: lightFill },
    };

    timeCell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };

    applyGridBorder(timeCell, color);

    // Column B: bold activity title, location, optional speakers.
const activityCell = worksheet.getCell(rowNumber, 2);

const richText: ExcelJS.CellRichTextValue['richText'] = [
  {
    text: `${activity.title}\n`,
    font: {
      name: 'Aptos',
      size: 11,
      bold: true,
      color: { argb: 'FF0F172A' },
    },
  },
  {
    text: activity.track,
    font: {
      name: 'Aptos',
      size: 10,
      color: { argb: 'FF475569' },
    },
  },
];

if (speakerNames) {
  richText.push({
    text: `\n${speakerNames}`,
    font: {
      name: 'Aptos',
      size: 9,
      color: { argb: 'FF475569' },
    },
  });
}

    activityCell.value = { richText };

    activityCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: lightFill },
    };

    activityCell.alignment = {
      vertical: 'middle',
      horizontal: 'left',
      wrapText: true,
    };

    applyGridBorder(activityCell, color);

    rowNumber++;
  });

  // Leave one blank row between day sections.
  return rowNumber + 1;
}

export async function exportActivitiesToProgramXLSX(
  activities: Activity[],
  eventTitle: string,
  language: AppLanguage
): Promise<void> {
  if (activities.length === 0) {
    throw new Error('No activities to export.');
  }

  const workbook = new ExcelJS.Workbook();
  const labels = getLabels(language);

  workbook.creator = 'Tchêventos';
  workbook.title = `${eventTitle} — ${labels.sheetName}`;
  workbook.subject = labels.sheetName;

  const worksheet = workbook.addWorksheet(labels.sheetName);

  // Two-column, print-friendly layout.
  worksheet.getColumn(1).width = 17;
  worksheet.getColumn(2).width = 68;

  worksheet.pageSetup = {
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.3,
      right: 0.3,
      top: 0.45,
      bottom: 0.45,
      header: 0.2,
      footer: 0.2,
    },
  };

  worksheet.properties.defaultRowHeight = 15;

  // Main event title.
  worksheet.mergeCells(1, 1, 1, 2);

  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = eventTitle;

  titleCell.font = {
    name: 'Aptos',
    size: 16,
    bold: true,
    color: { argb: HEADER_FONT },
  };

  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: HEADER_FILL },
  };

  titleCell.alignment = {
    vertical: 'middle',
    horizontal: 'left',
  };

  worksheet.getRow(1).height = 36;

  // Group all activities chronologically by date.
  const dates = Array.from(
    new Set(
      activities
        .map((activity) => activity.date)
        .filter(Boolean)
    )
  ).sort();

  let currentRow = 2;

  for (const date of dates) {
    const dayActivities = activities.filter(
      (activity) => activity.date === date
    );

    currentRow = addDateSection(
      worksheet,
      date,
      dayActivities,
      currentRow,
      language,
      labels
    );
  }

  // Generate and download the workbook.
  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob(
    [buffer as BlobPart],
    {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const safeTitle =
    eventTitle
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'tcheventos';

  const suffix =
    language === 'en-US'
      ? 'event_schedule'
      : 'programacao';

  link.href = url;
  link.download = `${safeTitle}_${suffix}.xlsx`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export default exportActivitiesToProgramXLSX;