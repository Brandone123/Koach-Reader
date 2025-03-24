import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

// Import translation files
import en from '../locales/en.json';
import fr from '../locales/fr.json';

const LANGUAGE_STORAGE_KEY = '@koach_reader_language';

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en
      },
      fr: {
        translation: fr
      }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

// Function to get stored language preference
export const getStoredLanguage = async () => {
  try {
    const lang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return lang || 'en'; // Default to English if no language is stored
  } catch (error) {
    console.error('Error getting stored language:', error);
    return 'en';
  }
};

// Function to set language preference
export const setLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    i18n.changeLanguage(language);
    // Ne plus recharger l'application, le composant AppWithLanguage s'en charge
  } catch (error) {
    console.error('Error storing language preference:', error);
  }
};

// Initialize with stored language if available
getStoredLanguage().then(language => {
  i18n.changeLanguage(language);
});

export default i18n; 