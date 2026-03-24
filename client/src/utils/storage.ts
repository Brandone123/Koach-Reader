import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_LAUNCH_KEY = '@koach_first_launch';
const LANGUAGE_SELECTED_KEY = '@koach_language_selected';
const INTRO_COMPLETED_KEY = '@koach_intro_completed';

export const isFirstLaunch = async (): Promise<boolean> => {
  try {
    const hasLaunched = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    return hasLaunched === null;
  } catch (error) {
    console.error('Error checking first launch:', error);
    return true;
  }
};

export const setFirstLaunchComplete = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
  } catch (error) {
    console.error('Error setting first launch complete:', error);
  }
};

export const isLanguageSelected = async (): Promise<boolean> => {
  try {
    const languageSelected = await AsyncStorage.getItem(LANGUAGE_SELECTED_KEY);
    return languageSelected === 'true';
  } catch (error) {
    console.error('Error checking language selection:', error);
    return false;
  }
};

export const setLanguageSelected = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_SELECTED_KEY, 'true');
  } catch (error) {
    console.error('Error setting language selected:', error);
  }
};

export const isIntroCompleted = async (): Promise<boolean> => {
  try {
    const introCompleted = await AsyncStorage.getItem(INTRO_COMPLETED_KEY);
    return introCompleted === 'true';
  } catch (error) {
    console.error('Error checking intro completion:', error);
    return false;
  }
};

export const setIntroCompleted = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(INTRO_COMPLETED_KEY, 'true');
  } catch (error) {
    console.error('Error setting intro completed:', error);
  }
};

export const resetOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([FIRST_LAUNCH_KEY, LANGUAGE_SELECTED_KEY, INTRO_COMPLETED_KEY]);
  } catch (error) {
    console.error('Error resetting onboarding:', error);
  }
};

export const clearAllStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};


