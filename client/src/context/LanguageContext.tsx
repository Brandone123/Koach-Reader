import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { getStoredLanguage, setLanguage } from '../utils/i18n';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => Promise<void>;
  isChangingLanguage: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<string>(i18n.language || 'en');
  const [isChangingLanguage, setIsChangingLanguage] = useState<boolean>(false);

  useEffect(() => {
    const initLanguage = async () => {
      const storedLanguage = await getStoredLanguage();
      setCurrentLanguage(storedLanguage);
    };

    initLanguage();
  }, []);

  const changeLanguage = async (language: string) => {
    setIsChangingLanguage(true);
    await setLanguage(language);
    setCurrentLanguage(language);
    setIsChangingLanguage(false);
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        isChangingLanguage
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 