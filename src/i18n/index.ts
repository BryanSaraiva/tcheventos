import i18n from 'i18next';
import {
  initReactI18next,
} from 'react-i18next';

import ptBR from './locales/pt-BR';
import enUS from './locales/en-US';

import {
  DEFAULT_LANGUAGE,
  getInitialLanguage,
} from './config';

const resources = {
  'pt-BR': {
    translation: ptBR,
  },

  'en-US': {
    translation: enUS,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,

    supportedLngs: [
      'pt-BR',
      'en-US',
    ],

    interpolation: {
      escapeValue: false,
    },

    returnNull: false,

    react: {
      useSuspense: false,
    },
  });

export default i18n;