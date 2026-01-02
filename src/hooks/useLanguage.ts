import { useEffect, useState } from 'react';
import { getCurrentLanguage, setLanguage, t, type LanguageCode } from '@/lib/languages';

/**
 * Hook to use language system across the app
 * Automatically listens for language changes
 */
export const useLanguage = () => {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Set initial language
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

  const translate = (key: string): string => {
    return t(key, language);
  };

  return {
    language,
    changeLanguage,
    translate,
    isLoaded,
  };
};

export default useLanguage;
