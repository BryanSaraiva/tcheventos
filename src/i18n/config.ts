import type {
  AppLanguage,
  DateFormatOptions,
  LanguageDefinition,
} from './types';

export const LANGUAGE_STORAGE_KEY =
  'tcheventos_language';

export const DEFAULT_LANGUAGE: AppLanguage =
  'pt-BR';

export const SUPPORTED_LANGUAGES: LanguageDefinition[] =
  [
    {
      code: 'pt-BR',
      locale: 'pt-BR',
      nativeName: 'Português (Brasil)',
      englishName: 'Portuguese (Brazil)',
    },
    {
      code: 'en-US',
      locale: 'en-US',
      nativeName: 'English (United States)',
      englishName: 'English (United States)',
    },
  ];

export const DATE_FORMATS: Record<
  AppLanguage,
  DateFormatOptions
> = {
  'pt-BR': {
    short: {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    },

    medium: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },

    long: {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },

    full: {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  },

  'en-US': {
    short: {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
    },

    medium: {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },

    long: {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    },

    full: {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    },
  },
};

export const TIME_FORMAT: Record<
  AppLanguage,
  Intl.DateTimeFormatOptions
> = {
  'pt-BR': {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  },

  'en-US': {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  },
};

export function isSupportedLanguage(
  value: string
): value is AppLanguage {
  return (
    value === 'pt-BR' ||
    value === 'en-US'
  );
}

function detectBrowserLanguage(): AppLanguage {
  const candidates = [
    ...(navigator.languages || []),
    navigator.language,
  ];

  for (const language of candidates) {
    const normalized =
      language.toLowerCase();

    if (normalized.startsWith('pt')) {
      return 'pt-BR';
    }

    if (normalized.startsWith('en')) {
      return 'en-US';
    }
  }

  return DEFAULT_LANGUAGE;
}

export function getInitialLanguage(): AppLanguage {
  try {
    const saved =
      localStorage.getItem(
        LANGUAGE_STORAGE_KEY
      );

    if (
      saved &&
      isSupportedLanguage(saved)
    ) {
      return saved;
    }
  } catch {
    // Fall through to browser detection.
  }

  return detectBrowserLanguage();
}