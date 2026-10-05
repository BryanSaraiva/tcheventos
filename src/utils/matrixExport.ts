import ExcelJS from 'exceljs';
import type { Activity } from '../types/event';
import {
  calculateDuration,
  minsToTime,
  timeToMins,
} from './dateUtils';

const GRID_INTERVAL_MINUTES = 30;

const HEADER_FILL = 'FF0F172A';
const HEADER_FONT = 'FFFFFFFF';
const BORDER_COLOR = 'FFE2E8F0';
const TRACK_FILL = 'FFF8FAFC';
const EMPTY_TEXT = 'FF94A3B8';

interface LaneActivity {
  activity: Activity;
  startColumn: number;
  endColumn: number;
}

interface LaneAssignment {
  lanes: LaneActivity[][];
  laneByActivityId: Map<number, number>;
}

function floorToGrid(minutes: number): number {
  return Math.floor(minutes / GRID_INTERVAL_MINUTES) * GRID_INTERVAL_MINUTES;
}

function ceilToGrid(minutes: number): number {
  return Math.ceil(minutes / GRID_INTERVAL_MINUTES) * GRID_INTERVAL_MINUTES;
}

/**
 * Creates the horizontal time axis.
 *
 * We include:
 * - normal 30-minute grid points
 * - every activity's exact start time
 * - every activity's exact end time
 *
 * This means something like 16:30 is inserted automatically between
 * 16:00 and 17:00 when the data requires it.
 */
function buildTimePoints(activities: Activity[]): number[] {
  if (activities.length === 0) {
    return [];
  }

  const starts = activities.map((activity) =>
    timeToMins(activity.startTime)
  );

  const ends = activities.map((activity) =>
    timeToMins(activity.endTime)
  );

  const minTime = Math.min(...starts);
  const maxTime = Math.max(...ends);

  const firstGridPoint = floorToGrid(minTime);
  const lastGridPoint = ceilToGrid(maxTime);

  const pointSet = new Set<number>();

  for (
    let minutes = firstGridPoint;
    minutes <= lastGridPoint;
    minutes += GRID_INTERVAL_MINUTES
  ) {
    pointSet.add(minutes);
  }

  // Exact boundaries always win over the normal 30-minute grid.
  activities.forEach((activity) => {
    pointSet.add(timeToMins(activity.startTime));
    pointSet.add(timeToMins(activity.endTime));
  });

  return Array.from(pointSet).sort((a, b) => a - b);
}

/**
 * Assigns activities to vertical sub-lanes.
 *
 * The spreadsheet uses merged cells from START through END, inclusive.
 * Therefore two activities that meet exactly at a boundary are kept on
 * separate lanes. This prevents illegal/overlapping Excel merge ranges
 * and also gives the matrix the same clean stacked behavior as the
 * visual timeline.
 */
function assignActivityLanes(
  activities: Activity[],
  timePoints: number[]
): LaneAssignment {
  const sorted = [...activities].sort((a, b) => {
    const startDifference =
      timeToMins(a.startTime) - timeToMins(b.startTime);

    if (startDifference !== 0) {
      return startDifference;
    }

    return timeToMins(a.endTime) - timeToMins(b.endTime);
  });

  const lanes: LaneActivity[][] = [];
  const laneEndColumns: number[] = [];
  const laneByActivityId = new Map<number, number>();

  for (const activity of sorted) {
    const startTime = timeToMins(activity.startTime);
    const endTime = timeToMins(activity.endTime);

    const startColumn =
      timePoints.findIndex((point) => point === startTime) + 2;

    const endColumn =
      timePoints.findIndex((point) => point === endTime) + 2;

    // Because the merge includes the END column, a lane can only be
    // reused when the previous merge finishes BEFORE this one starts.
    const availableLane = laneEndColumns.findIndex(
      (lastEndColumn) => lastEndColumn < startColumn
    );

    const laneIndex =
      availableLane === -1
        ? laneEndColumns.length
        : availableLane;

    const laneActivity: LaneActivity = {
      activity,
      startColumn,
      endColumn,
    };

    if (laneIndex === lanes.length) {
      lanes.push([laneActivity]);
      laneEndColumns.push(endColumn);
    } else {
      lanes[laneIndex].push(laneActivity);
      laneEndColumns[laneIndex] = endColumn;
    }

    laneByActivityId.set(activity.id, laneIndex);
  }

  return {
    lanes,
    laneByActivityId,
  };
}

function excelColumnName(columnNumber: number): string {
  let number = columnNumber;
  let result = '';

  while (number > 0) {
    const remainder = (number - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    number = Math.floor((number - 1) / 26);
  }

  return result;
}

function normalizeHexColor(color: string | undefined): string {
  if (!color) {
    return '3C78D8';
  }

  const normalized = color.replace('#', '').trim();

  if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return normalized.toUpperCase();
  }

  return '3C78D8';
}

function makeLightFill(color: string | undefined): string {
  // Excel ARGB: 18% opacity + activity color.
  return `2E${normalizeHexColor(color)}`;
}

function applyGridBorder(cell: ExcelJS.Cell): void {
  cell.border = {
    top: {
      style: 'thin',
      color: { argb: BORDER_COLOR },
    },
    bottom: {
      style: 'thin',
      color: { argb: BORDER_COLOR },
    },
    left: {
      style: 'thin',
      color: { argb: BORDER_COLOR },
    },
    right: {
      style: 'thin',
      color: { argb: BORDER_COLOR },
    },
  };
}

function setActivityCell(
  worksheet: ExcelJS.Worksheet,
  activity: Activity,
  rowNumber: number,
  startColumn: number,
  endColumn: number
): void {
  const startCell = worksheet.getCell(rowNumber, startColumn);

  worksheet.mergeCells(
    rowNumber,
    startColumn,
    rowNumber,
    endColumn
  );

  const duration = calculateDuration(
    activity.startTime,
    activity.endTime
  );

  const richText: ExcelJS.CellRichTextValue['richText'] = [
    {
      text: `${activity.startTime} - ${activity.endTime} (${duration.formatted})`,
      font: {
        name: 'Aptos',
        size: 10,
        bold: false,
        color: { argb: 'FF475569' },
      },
    },
    {
      text: `\n${activity.title}`,
      font: {
        name: 'Aptos',
        size: 11,
        bold: true,
        color: { argb: 'FF0F172A' },
      },
    },
  ];

  if (activity.category?.trim()) {
    richText.push({
      text: `\n${activity.category.trim()}`,
      font: {
        name: 'Aptos',
        size: 9,
        bold: false,
        italic: false,
        color: { argb: 'FF475569' },
      },
    });
  }

  startCell.value = {
    richText,
  };

  startCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {
      argb: makeLightFill(activity.color),
    },
  };

  startCell.alignment = {
    vertical: 'top',
    horizontal: 'left',
    wrapText: true,
  };

  startCell.border = {
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
    left: {
      style: 'medium',
      color: {
        argb: `FF${normalizeHexColor(activity.color)}`,
      },
    },
  };
}

function createDateWorksheet(
  workbook: ExcelJS.Workbook,
  date: string,
  dayActivities: Activity[],
  availableTracks: string[]
): void {
  const safeSheetName = date.replace(/\//g, '-');

  const worksheet = workbook.addWorksheet(
    safeSheetName.slice(0, 31)
  );

 worksheet.views = [
  {
    state: 'frozen',
    xSplit: 1,
    ySplit: 1,
    showGridLines: false,
  },
];

  const timePoints = buildTimePoints(dayActivities);

  /*
   * The timeline behavior is based on the locations available to the
   * event, plus locations actually present in this date's activities.
   */
  const tracksForDay = Array.from(
    new Set([
      ...availableTracks,
      ...dayActivities.map((activity) => activity.track),
    ])
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  // -------------------------------------------------------------
  // Header
  // -------------------------------------------------------------

  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;

  const trackHeader = worksheet.getCell(1, 1);
  trackHeader.value = 'Espaço / Trilha';

  trackHeader.font = {
    name: 'Aptos',
    size: 10,
    bold: true,
    color: { argb: HEADER_FONT },
  };

  trackHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {
      argb: HEADER_FILL,
    },
  };

  trackHeader.alignment = {
    vertical: 'middle',
    horizontal: 'left',
  };

  applyGridBorder(trackHeader);

  worksheet.getColumn(1).width = 28;

  timePoints.forEach((minutes, index) => {
    const columnNumber = index + 2;
    const cell = worksheet.getCell(1, columnNumber);

    cell.value = minsToTime(minutes);

    cell.font = {
      name: 'Aptos',
      size: 10,
      bold: true,
      color: { argb: HEADER_FONT },
    };

    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb: HEADER_FILL,
      },
    };

    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    applyGridBorder(cell);

    worksheet.getColumn(columnNumber).width = 15;
  });

  // -------------------------------------------------------------
  // Location / lane rows
  // -------------------------------------------------------------

  let currentRow = 2;

  for (const trackName of tracksForDay) {
    const trackActivities = dayActivities.filter(
      (activity) => activity.track === trackName
    );

    if (trackActivities.length === 0) {
      const row = worksheet.getRow(currentRow);

      row.height = 38;

      const trackCell = worksheet.getCell(currentRow, 1);

      trackCell.value = trackName;

      trackCell.font = {
        name: 'Aptos',
        size: 10,
        bold: true,
        color: { argb: 'FF334155' },
      };

      trackCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: TRACK_FILL,
        },
      };

      trackCell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
      };

      applyGridBorder(trackCell);

      for (let column = 2; column <= timePoints.length + 1; column++) {
        applyGridBorder(
          worksheet.getCell(currentRow, column)
        );
      }

      currentRow++;
      continue;
    }

    const { lanes } = assignActivityLanes(
      trackActivities,
      timePoints
    );

    const firstRow = currentRow;
    const lastRow =
      currentRow + lanes.length - 1;

    // Merge the location label vertically across its sub-lanes.
    if (lanes.length > 1) {
      worksheet.mergeCells(
        firstRow,
        1,
        lastRow,
        1
      );
    }

    const trackCell = worksheet.getCell(firstRow, 1);

    trackCell.value = trackName;

    trackCell.font = {
      name: 'Aptos',
      size: 10,
      bold: true,
      color: { argb: 'FF334155' },
    };

    trackCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb: TRACK_FILL,
      },
    };

    trackCell.alignment = {
      vertical: 'middle',
      horizontal: 'left',
      wrapText: true,
    };

    applyGridBorder(trackCell);

    // Draw the grid for all sub-lanes.
    for (let laneIndex = 0; laneIndex < lanes.length; laneIndex++) {
      const rowNumber = currentRow + laneIndex;
      const row = worksheet.getRow(rowNumber);

      row.height = 68;

      for (
        let column = 2;
        column <= timePoints.length + 1;
        column++
      ) {
        const cell = worksheet.getCell(
          rowNumber,
          column
        );

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
            argb: 'FFFFFFFF',
          },
        };

        applyGridBorder(cell);
      }

      for (const laneActivity of lanes[laneIndex]) {
        setActivityCell(
          worksheet,
          laneActivity.activity,
          rowNumber,
          laneActivity.startColumn,
          laneActivity.endColumn
        );
      }
    }

    currentRow += lanes.length;
  }

  // Give the sheet a little breathing room for printing.
  worksheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: false,
  };

  worksheet.pageSetup.margins = {
    left: 0.25,
    right: 0.25,
    top: 0.5,
    bottom: 0.5,
    header: 0.2,
    footer: 0.2,
  };
}

export async function exportActivitiesToMatrixXLSX(
  activities: Activity[],
  availableTracks: string[],
  eventTitle: string
): Promise<void> {
  if (activities.length === 0) {
    throw new Error('Não há atividades para exportar.');
  }

  const workbook = new ExcelJS.Workbook();

  workbook.creator = 'Tchêventos';
  workbook.title = eventTitle;
  workbook.subject = 'Matriz Visual de Cronograma';
  workbook.company = 'Tchêventos';

  const dates = Array.from(
    new Set(
      activities
        .map((activity) => activity.date)
        .filter(Boolean)
    )
  ).sort();

  for (const date of dates) {
    const dayActivities = activities.filter(
      (activity) => activity.date === date
    );

    createDateWorksheet(
      workbook,
      date,
      dayActivities,
      availableTracks
    );
  }

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob(
    [buffer],
    {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;

  const safeTitle =
    eventTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '_')
      .replace(/^_+|_+$/g, '') || 'tcheventos';

  link.download = `${safeTitle}_matriz.xlsx`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}