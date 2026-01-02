'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentLanguage, setLanguage, type LanguageCode } from '@/lib/languages';

type LanguageContextType = {
  language: LanguageCode;
  changeLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load initial language
    const lang = getCurrentLanguage();
    setLanguageState(lang);
    setIsLoaded(true);

    // Listen for language change events
    const handleLanguageChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ language: LanguageCode }>;
      setLanguageState(customEvent.detail.language);
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  const changeLanguage = (newLanguage: LanguageCode) => {
    setLanguageState(newLanguage);
    setLanguage(newLanguage);
  };

  const t = (key: string): string => {
    const { translations } = require('@/lib/languages');
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    return key;
  };

  if (!isLoaded) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguageContext = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback for when used outside provider - return default implementation
    return {
      language: 'en',
      changeLanguage: () => {},
      t: (key: string): string => key,
    };
  }
  return context;
};

export default LanguageProvider;
