import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from './translations/en.json';
import ka from './translations/ka.json';
import ru from './translations/ru.json';
import de from './translations/de.json';
import es from './translations/es.json';

type Language = 'en' | 'ka' | 'ru' | 'de' | 'es';

const translations: Record<Language, any> = { en, ka, ru, de, es };

export const LANGUAGE_META: Record<Language, { flag: string; nativeName: string }> = {
  en: { flag: '🇧', nativeName: 'English' },
  ka: { flag: '🇪', nativeName: 'ქართული' },
  ru: { flag: '🇺', nativeName: 'Русский' },
  de: { flag: '🇩🇪', nativeName: 'Deutsch' },
  es: { flag: '🇸', nativeName: 'Español' },
};

export const AVAILABLE_LANGUAGES: Language[] = ['en', 'ka', 'ru', 'de', 'es'];

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return path;
    current = current[key];
  }
  return typeof current === 'string' ? current : path;
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('language') as Language;
    if (stored && AVAILABLE_LANGUAGES.includes(stored)) return stored;
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = getNestedValue(translations[language], key);
    return interpolate(translation, params);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) throw new Error('useTranslation must be used within TranslationProvider');
  return context;
}

export type { Language };