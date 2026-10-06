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
const MASTER_TITLE_FILL = 'FFECFDF5';
const MASTER_TITLE_FONT = 'FF065F46';

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
  return (
    Math.floor(minutes / GRID_INTERVAL_MINUTES) *
    GRID_INTERVAL_MINUTES
  );
}

function ceilToGrid(minutes: number): number {
  return (
    Math.ceil(minutes / GRID_INTERVAL_MINUTES) *
    GRID_INTERVAL_MINUTES
  );
}

/**
 * Creates the horizontal time axis for one day's activities.
 *
 * Includes:
 * - regular 30-minute points
 * - every exact activity start
 * - every exact activity end
 *
 * Example:
 * 16:00 → 17:00 plus an activity ending at 16:30
 * becomes:
 * 16:00 | 16:30 | 17:00
 */
function buildTimePoints(
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

  activities.forEach((activity) => {
    pointSet.add(
      timeToMins(activity.startTime)
    );

    pointSet.add(
      timeToMins(activity.endTime)
    );
  });

  return Array.from(pointSet).sort(
    (a, b) => a - b
  );
}

/**
 * Assign activities to vertical sub-lanes.
 *
 * Activities that touch at exactly the same boundary are kept
 * on separate lanes because the spreadsheet cells are merged
 * through their END column.
 */
function assignActivityLanes(
  activities: Activity[],
  timePoints: number[]
): LaneAssignment {
  const sorted = [...activities].sort(
    (a, b) => {
      const startDifference =
        timeToMins(a.startTime) -
        timeToMins(b.startTime);

      if (startDifference !== 0) {
        return startDifference;
      }

      return (
        timeToMins(a.endTime) -
        timeToMins(b.endTime)
      );
    }
  );

  const lanes: LaneActivity[][] = [];
  const laneEndColumns: number[] = [];
  const laneByActivityId =
    new Map<number, number>();

  for (const activity of sorted) {
    const startTime = timeToMins(
      activity.startTime
    );

    const endTime = timeToMins(
      activity.endTime
    );

    const startColumn =
      timePoints.findIndex(
        (point) => point === startTime
      ) + 2;

    const endColumn =
      timePoints.findIndex(
        (point) => point === endTime
      ) + 2;

    if (
      startColumn < 2 ||
      endColumn < 2
    ) {
      continue;
    }

    const availableLane =
      laneEndColumns.findIndex(
        (lastEndColumn) =>
          lastEndColumn < startColumn
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
      lanes[laneIndex].push(
        laneActivity
      );
      laneEndColumns[laneIndex] =
        endColumn;
    }

    laneByActivityId.set(
      activity.id,
      laneIndex
    );
  }

  return {
    lanes,
    laneByActivityId,
  };
}

function normalizeHexColor(
  color: string | undefined
): string {
  if (!color) {
    return '3C78D8';
  }

  const normalized = color
    .replace('#', '')
    .trim();

  if (
    /^[0-9a-fA-F]{6}$/.test(
      normalized
    )
  ) {
    return normalized.toUpperCase();
  }

  return '3C78D8';
}

function makeLightFill(
  color: string | undefined
): string {
  return `2E${normalizeHexColor(color)}`;
}

function applyGridBorder(
  cell: ExcelJS.Cell
): void {
  cell.border = {
    top: {
      style: 'thin',
      color: {
        argb: BORDER_COLOR,
      },
    },
    bottom: {
      style: 'thin',
      color: {
        argb: BORDER_COLOR,
      },
    },
    left: {
      style: 'thin',
      color: {
        argb: BORDER_COLOR,
      },
    },
    right: {
      style: 'thin',
      color: {
        argb: BORDER_COLOR,
      },
    },
  };
}

function configureWorksheet(
  worksheet: ExcelJS.Worksheet
): void {
  worksheet.views = [
    {
      state: 'frozen',
      xSplit: 1,
      ySplit: 1,
      showGridLines: false,
    },
  ];

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

function setActivityCell(
  worksheet: ExcelJS.Worksheet,
  activity: Activity,
  rowNumber: number,
  startColumn: number,
  endColumn: number
): void {
  const startCell =
    worksheet.getCell(
      rowNumber,
      startColumn
    );

  worksheet.mergeCells(
    rowNumber,
    startColumn,
    rowNumber,
    endColumn
  );

  const duration =
    calculateDuration(
      activity.startTime,
      activity.endTime
    );

  const richText: ExcelJS.CellRichTextValue['richText'] =
    [
      {
        text: `${activity.startTime} - ${activity.endTime} (${duration.formatted})`,
        font: {
          name: 'Aptos',
          size: 10,
          bold: false,
          color: {
            argb: 'FF475569',
          },
        },
      },
      {
        text: `\n${activity.title}`,
        font: {
          name: 'Aptos',
          size: 11,
          bold: true,
          color: {
            argb: 'FF0F172A',
          },
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
        color: {
          argb: 'FF475569',
        },
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
      argb: makeLightFill(
        activity.color
      ),
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
      color: {
        argb: BORDER_COLOR,
      },
    },
    bottom: {
      style: 'thin',
      color: {
        argb: BORDER_COLOR,
      },
    },
    right: {
      style: 'thin',
      color: {
        argb: BORDER_COLOR,
      },
    },
    left: {
      style: 'medium',
      color: {
        argb: `FF${normalizeHexColor(
          activity.color
        )}`,
      },
    },
  };
}

/**
 * Renders ONE matrix section into an existing worksheet.
 *
 * This is the key change that lets the master worksheet contain
 * multiple day matrices one after another.
 *
 * Returns the first unused row after the section.
 */
function renderMatrixSection(
  worksheet: ExcelJS.Worksheet,
  startRow: number,
  date: string,
  dayActivities: Activity[],
  availableTracks: string[]
): number {
  const timePoints =
    buildTimePoints(dayActivities);

  if (timePoints.length === 0) {
    return startRow;
  }

  const tracksForDay =
    Array.from(
      new Set([
        ...availableTracks,
        ...dayActivities.map(
          (activity) => activity.track
        ),
      ])
    )
      .filter(Boolean)
      .sort((a, b) =>
        a.localeCompare(b)
      );

  const headerRow =
    worksheet.getRow(startRow);

  headerRow.height = 28;

  const trackHeader =
    worksheet.getCell(
      startRow,
      1
    );

  trackHeader.value =
    'Espaço / Trilha';

  trackHeader.font = {
    name: 'Aptos',
    size: 10,
    bold: true,
    color: {
      argb: HEADER_FONT,
    },
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

  applyGridBorder(
    trackHeader
  );

  worksheet.getColumn(1).width = 28;

  timePoints.forEach(
    (minutes, index) => {
      const columnNumber =
        index + 2;

      const cell =
        worksheet.getCell(
          startRow,
          columnNumber
        );

      cell.value =
        minsToTime(minutes);

      cell.font = {
        name: 'Aptos',
        size: 10,
        bold: true,
        color: {
          argb: HEADER_FONT,
        },
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

      worksheet.getColumn(
        columnNumber
      ).width = 15;
    }
  );

  let currentRow =
    startRow + 1;

  for (
    const trackName of tracksForDay
  ) {
    const trackActivities =
      dayActivities.filter(
        (activity) =>
          activity.track ===
          trackName
      );

    /*
     * Empty location.
     */
    if (
      trackActivities.length === 0
    ) {
      const row =
        worksheet.getRow(
          currentRow
        );

      row.height = 38;

      const trackCell =
        worksheet.getCell(
          currentRow,
          1
        );

      trackCell.value =
        trackName;

      trackCell.font = {
        name: 'Aptos',
        size: 10,
        bold: true,
        color: {
          argb: 'FF334155',
        },
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

      applyGridBorder(
        trackCell
      );

      for (
        let column = 2;
        column <=
          timePoints.length + 1;
        column++
      ) {
        applyGridBorder(
          worksheet.getCell(
            currentRow,
            column
          )
        );
      }

      currentRow++;
      continue;
    }

    /*
     * Assign concurrent activities to sub-lanes.
     */
    const { lanes } =
      assignActivityLanes(
        trackActivities,
        timePoints
      );

    const firstRow =
      currentRow;

    const lastRow =
      currentRow +
      lanes.length -
      1;

    /*
     * Merge the location label vertically
     * across its sub-lanes.
     */
    if (lanes.length > 1) {
      worksheet.mergeCells(
        firstRow,
        1,
        lastRow,
        1
      );
    }

    const trackCell =
      worksheet.getCell(
        firstRow,
        1
      );

    trackCell.value =
      trackName;

    trackCell.font = {
      name: 'Aptos',
      size: 10,
      bold: true,
      color: {
        argb: 'FF334155',
      },
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

    applyGridBorder(
      trackCell
    );

    /*
     * Render every sub-lane.
     */
    for (
      let laneIndex = 0;
      laneIndex < lanes.length;
      laneIndex++
    ) {
      const rowNumber =
        currentRow +
        laneIndex;

      const row =
        worksheet.getRow(
          rowNumber
        );

      row.height = 68;

      /*
       * Draw the empty grid first.
       */
      for (
        let column = 2;
        column <=
          timePoints.length + 1;
        column++
      ) {
        const cell =
          worksheet.getCell(
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

      /*
       * Then place the merged activity cells.
       */
      for (
        const laneActivity of
          lanes[laneIndex]
      ) {
        setActivityCell(
          worksheet,
          laneActivity.activity,
          rowNumber,
          laneActivity.startColumn,
          laneActivity.endColumn
        );
      }
    }

    currentRow +=
      lanes.length;
  }

  return currentRow;
}

/**
 * Creates one worksheet for one date.
 */
function createDateWorksheet(
  workbook: ExcelJS.Workbook,
  date: string,
  dayActivities: Activity[],
  availableTracks: string[]
): void {
  const safeSheetName =
    date.replace(/\//g, '-');

  const worksheet =
    workbook.addWorksheet(
      safeSheetName.slice(0, 31)
    );

  configureWorksheet(
    worksheet
  );

  renderMatrixSection(
    worksheet,
    1,
    date,
    dayActivities,
    availableTracks
  );
}

/**
 * Creates the FIRST worksheet in the workbook:
 *
 * Matriz - Todos os Dias
 *
 * Every day's matrix is rendered vertically, one after another.
 */
function createMasterWorksheet(
  workbook: ExcelJS.Workbook,
  activities: Activity[],
  availableTracks: string[],
  eventTitle: string
): void {
  const worksheet =
    workbook.addWorksheet(
      'Matriz - Todos os Dias'
    );

  configureWorksheet(
    worksheet
  );

  const dates =
    Array.from(
      new Set(
        activities
          .map(
            (activity) =>
              activity.date
          )
          .filter(Boolean)
      )
    ).sort();

  let currentRow = 1;

  for (
    const date of dates
  ) {
    const dayActivities =
      activities.filter(
        (activity) =>
          activity.date ===
          date
      );

    if (
      dayActivities.length === 0
    ) {
      continue;
    }

    /*
     * Build the time points first so we know how far
     * the master title should span.
     */
    const timePoints =
      buildTimePoints(
        dayActivities
      );

    if (timePoints.length === 0) {
      continue;
    }

    const lastColumn =
      timePoints.length + 1;

    /*
     * Section title.
     */
    worksheet.mergeCells(
      currentRow,
      1,
      currentRow,
      lastColumn
    );

    const titleCell =
      worksheet.getCell(
        currentRow,
        1
      );

    titleCell.value =
      `${eventTitle} — ${date}`;

    titleCell.font = {
      name: 'Aptos',
      size: 13,
      bold: true,
      color: {
        argb: MASTER_TITLE_FONT,
      },
    };

    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb: MASTER_TITLE_FILL,
      },
    };

    titleCell.alignment = {
      vertical: 'middle',
      horizontal: 'left',
    };

    titleCell.border = {
      bottom: {
        style: 'medium',
        color: {
          argb: 'FF10B981',
        },
      },
    };

    worksheet.getRow(
      currentRow
    ).height = 28;

    currentRow += 1;

    /*
     * Render the actual matrix below the title.
     */
    currentRow =
      renderMatrixSection(
        worksheet,
        currentRow,
        date,
        dayActivities,
        availableTracks
      );

    /*
     * Two blank rows between days.
     */
    currentRow += 2;
  }
}

export async function exportActivitiesToMatrixXLSX(
  activities: Activity[],
  availableTracks: string[],
  eventTitle: string
): Promise<void> {
  if (
    activities.length === 0
  ) {
    throw new Error(
      'Não há atividades para exportar.'
    );
  }

  const workbook =
    new ExcelJS.Workbook();

  workbook.creator =
    'Tchêventos';

  workbook.title =
    eventTitle;

  workbook.subject =
    'Matriz Visual de Cronograma';

  workbook.company =
    'Tchêventos';

  /*
   * IMPORTANT:
   * Create the master worksheet FIRST.
   */
  createMasterWorksheet(
    workbook,
    activities,
    availableTracks,
    eventTitle
  );

  /*
   * Then create the individual day worksheets.
   */
  const dates =
    Array.from(
      new Set(
        activities
          .map(
            (activity) =>
              activity.date
          )
          .filter(Boolean)
      )
    ).sort();

  for (
    const date of dates
  ) {
    const dayActivities =
      activities.filter(
        (activity) =>
          activity.date === date
      );

    createDateWorksheet(
      workbook,
      date,
      dayActivities,
      availableTracks
    );
  }

  const buffer =
    await workbook.xlsx.writeBuffer();

  const blob =
    new Blob(
      [buffer],
      {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement('a');

  link.href = url;

  const safeTitle =
    eventTitle
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/gi,
        '_'
      )
      .replace(
        /^_+|_+$/g,
        ''
      ) ||
    'tcheventos';

  link.download =
    `${safeTitle}_matriz.xlsx`;

  document.body.appendChild(
    link
  );

  link.click();

  document.body.removeChild(
    link
  );

  URL.revokeObjectURL(url);
}