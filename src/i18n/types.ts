export type AppLanguage = 'pt-BR' | 'en-US';

export interface LanguageDefinition {
  code: AppLanguage;
  locale: string;
  nativeName: string;
  englishName: string;
}

export interface DateFormatOptions {
  short: Intl.DateTimeFormatOptions;
  medium: Intl.DateTimeFormatOptions;
  long: Intl.DateTimeFormatOptions;
  full: Intl.DateTimeFormatOptions;
}