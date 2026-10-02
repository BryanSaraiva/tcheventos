/**
 * Valid event activity categories supported by Tchêventos
 */
export type ActivityCategory =
  | 'Palestra'
  | 'Feira'
  | 'Competição'
  | 'Rodada de Negócios'
  | 'Workshop'
  | 'Cinema'
  | 'Imersão'
  | 'Cerimônia';

/**
 * Available physical spaces / tracks for scheduled activities
 */
export type EventTrack =
  | 'Salão de Atos'
  | 'Saguão Central / Feira'
  | 'Salas de Inovação'
  | 'Auditório UALL';

/**
 * Available display view modes
 */
export type ViewMode = 'table' | 'timeline' | 'runofshow';


/**
 * Core Activity entity stored in state and persistence
 */
export interface Activity {
  id: number;
  date: string; // Format: YYYY-MM-DD
  startTime: string; // Format: HH:mm (24h)
  endTime: string; // Format: HH:mm (24h)
  track: EventTrack | string;
  title: string;
  category: ActivityCategory | string;
  color: string; // Hex color code or 'default'
  notes: string;
}

/**
 * Form values used for creating or updating an activity
 */
export interface ActivityFormData {
  id?: number;
  date: string;
  startTime: string;
  endTime: string;
  track: EventTrack | string;
  title: string;
  category: ActivityCategory | string;
  color: string;
  notes: string;
}


/**
 * State container for schedule toolbar filters
 */
export interface FilterState {
  searchQuery: string;
  locationFilter: string; // 'all' or specific EventTrack
  categoryFilter: string; // 'all' or specific ActivityCategory
  filterDay: string; // 'all' or specific YYYY-MM-DD date
}

/**
 * Computed schedule statistics summary
 */
export interface ScheduleStats {
  totalMinutes: number;
  formattedDuration: string; // e.g. "12h 30m"
  conflictCount: number;
}

/**
 * Toast notification payload state
 */
export interface ToastNotification {
  id: number;
  message: string;
  iconClass: string;
  type?: 'success' | 'danger' | 'warning' | 'info';
}

export interface EventOptionState {
  tracks: string[];
  categories: string[];
}