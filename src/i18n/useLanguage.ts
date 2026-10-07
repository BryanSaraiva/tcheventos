import {
  useCallback,
  useEffect,
} from 'react';
import {
  useTranslation,
} from 'react-i18next';

import type {
  AppLanguage,
} from './types';

import {
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  TIME_FORMAT,
  DATE_FORMATS,
} from './config';

export function useLanguage() {
  const {
    t,
    i18n,
  } = useTranslation();

  const language =
    i18n.language as AppLanguage;

  const languageDefinition =
    SUPPORTED_LANGUAGES.find(
      (item) =>
        item.code === language
    ) ||
    SUPPORTED_LANGUAGES[0];

  const setLanguage =
    useCallback(
      async (
        nextLanguage: AppLanguage
      ) => {
        try {
          localStorage.setItem(
            LANGUAGE_STORAGE_KEY,
            nextLanguage
          );
        } catch {
          // Keep working even if localStorage is unavailable.
        }

        await i18n.changeLanguage(
          nextLanguage
        );
      },
      [i18n]
    );

  useEffect(() => {
    document.documentElement.lang =
      language;

    document.documentElement.dir =
      'ltr';
  }, [language]);

  return {
    t,
    language,
    locale:
      languageDefinition.locale,

    languageDefinition,

    supportedLanguages:
      SUPPORTED_LANGUAGES,

    dateFormats:
      DATE_FORMATS[language],

    timeFormat:
      TIME_FORMAT[language],

    setLanguage,
  };
}