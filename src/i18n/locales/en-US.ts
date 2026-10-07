const enUS = {
  common: {
    appName: 'Tchêventos',
    subtitle:
      'Event Schedule & Run of Show Manager',
    eventTitlePlaceholder:
      'Event Name...',
    timeRange: '2 PM to 10 PM',
  },

  menu: {
    title: 'Schedule Actions',

    newActivity: 'New Activity',
    importCsv: 'Import CSV',
    copyForSheets:
      'Copy to Google Sheets',
    exportCsv: 'Export CSV',
    exportMatrix:
      'Export Matrix (Excel)',

    restoreDefaults:
      'Restore Default Data',
    clearAll:
      'Clear All Activities',

    language: 'Language',
  },

  languages: {
    'pt-BR': 'Português (Brasil)',
    'en-US': 'English (United States)',
  },

  filters: {
    allDays: 'All Days ({{count}})',
    allTracks:
      'All Spaces / Tracks',
    allCategories:
      'All Categories',

    searchPlaceholder:
      'Search by title, space, or note...',
  },

  views: {
    table: 'Table',
    timeline: 'Matrix',
    runOfShow: 'Run of Show',

    tableTitle:
      'Detailed Table View',

    timelineTitle:
      'Visual Matrix / Timeline View',

    runOfShowTitle:
      'Minute-by-Minute Production Run of Show',
  },

  activity: {
    title: 'Activity Title',
    date: 'Date',
    startTime: 'Start',
    endTime: 'End',
    track: 'Space / Track',
    category: 'Category',
    optional: 'optional',

    color: 'Accent Color',
    chooseColor: 'Choose Color',

    notes:
      'Notes / Detailed Description',

    titlePlaceholder:
      'e.g. Innovation Keynote',

    notesPlaceholder:
      'e.g. Speaker details, required equipment, or technical notes...',
  },

  activityModal: {
    editTitle: 'Edit Activity',
    createTitle: 'New Activity',

    editDescription:
      'Update the schedule information',

    createDescription:
      'Add a new session to the event',

    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    create: 'Create Activity',
  },

  combobox: {
    typeOrSelect:
      'Type or select...',

    create: 'Create "{{value}}"',

    noOptions:
      'No options registered.',

    save: 'Save',
    cancel: 'Cancel',

    editOption: 'Edit option',
    deleteOption: 'Delete option',

    usedInOne:
      'This option is used in {{count}} activity. Remove from all?',

    usedInMany:
      'This option is used in {{count}} activities. Remove from all?',

    remove: 'Remove',
  },

  categories: {
    none: 'No category',
  },

  timeline: {
    track: 'Space / Track',

    noActivities:
      'No activities on the timeline',

    emptyDescription:
      'There are no scheduled sessions to display in matrix view. Try changing the filters or adding a new activity.',

    addActivity:
      'Add Activity',

    activities: 'activities',
    activity: 'activity',

    duplicate: 'Duplicate',
    delete: 'Delete',
  },

  table: {
    noActivities:
      'No activities found',

    noActivitiesDescription:
      'No sessions matched the current filters. Try adjusting the search or adding a new activity.',

    addActivity:
      'Add Activity',

    color: 'Color',
    time: 'Time',
    titleDescription:
      'Title & Description',
    category: 'Category',
    actions: 'Actions',

    edit: 'Edit Activity',
    duplicate: 'Duplicate Activity',
    delete: 'Delete Activity',
  },

  validation: {
    titleRequired:
      'Please enter the activity title.',

    trackRequired:
      'Please enter the Space / Track.',

    endTimeAfterStart:
      'The end time must be later than the start time.',
  },

  toasts: {
    activityUpdated:
      'Activity updated successfully!',

    activityCreated:
      'New activity added to the schedule!',

    activityDeleted:
      'Activity removed from the schedule.',

    activityDuplicated:
      'Activity duplicated successfully!',

    csvExported:
      'Schedule exported to CSV successfully!',

    csvImported:
      '{{count}} activities imported successfully!',

    matrixExported:
      'Matrix exported to Excel successfully!',

    matrixCopied:
      'Matrix copied! Paste it directly into Google Sheets.',

    allActivitiesCleared:
      'All activities were deleted.',

    defaultsRestored:
      'Schedule restored to default data!',

    nothingToExport:
      'There are no activities to export as a matrix.',

    nothingToCopy:
      'There are no activities to copy.',
  },

  matrix: {
    track: 'Space / Track',
    noCategory: 'No category',
    date: 'Date',
  },

  runOfShow: {
    // We'll populate these after auditing RunOfShowView.tsx.
  },

"metrics": {
  "activities_one": "<bold>{{count}}</bold> activity",
  "activities_other": "<bold>{{count}}</bold> activities",

  scheduled:
    '<bold>{{duration}}</bold> scheduled',

  overlaps_one:
    '{{count}} overlap',

  overlaps_other:
    '{{count}} overlaps',
},
} as const;

export default enUS;