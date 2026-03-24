import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import WelcomeOnboardingScreen from './WelcomeOnboardingScreen';
import { 
  isLanguageSelected, 
  setLanguageSelected
} from '../utils/storage';

type OnboardingStep = 'language' | 'welcome';

interface AppOnboardingScreenProps {
  onComplete: () => void;
}

const AppOnboardingScreen: React.FC<AppOnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('language');

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    const langSelected = await isLanguageSelected();
    if (!langSelected) {
      setCurrentStep('language');
    } else {
      setCurrentStep('welcome');
    }
  };

  const handleLanguageSelected = async () => {
    await setLanguageSelected();
    setCurrentStep('welcome');
  };

  const handleWelcomeCompleted = () => {
    onComplete();
  };

  const handleBackToLanguage = () => {
    setCurrentStep('language');
  };

  switch (currentStep) {
    case 'language':
      return (
        <LanguageSelectionScreen
          onLanguageSelected={handleLanguageSelected}
        />
      );
    
    case 'welcome':
      return (
        <WelcomeOnboardingScreen
          onComplete={handleWelcomeCompleted}
        />
      );
    
    default:
      return <View style={styles.container} />;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default AppOnboardingScreen;


