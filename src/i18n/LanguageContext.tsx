import { createContext, useContext, useEffect, useState } from 'react';
import { translations } from './translations.js';

type Lang = 'en' | 'kn';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  tDesignation: (designation: string) => string;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

const HTML_LANG: Record<Lang, string> = { en: 'en', kn: 'kn' };

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);

  function t(key: string): string {
    const dict = translations as Record<string, Record<string, string>>;
    return dict[lang]?.[key] ?? dict['en']?.[key] ?? key;
  }

  const DESIGNATION_MAP: Record<string, string> = {
    'PDO':            'designation_pdo',
    'Secretary':      'designation_secretary',
    'Ward Member':    'designation_ward_member',
    'President':      'designation_president',
    'Vice President': 'designation_vice_president',
  };

  function tDesignation(designation: string): string {
    const key = DESIGNATION_MAP[designation];
    return key ? t(key) : designation;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tDesignation }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
