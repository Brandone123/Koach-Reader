import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { Button, Chip, ProgressBar, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useDispatch } from 'react-redux';
import { setOnboardingCompleted, updateUserPreferences } from '../slices/authSlice';
import { useTranslation } from 'react-i18next';
import { AppDispatch } from '../store';
import { colors } from '../utils/theme';

const { width, height } = Dimensions.get('window');

type OnboardingNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

type ReadingFrequency = 'daily' | 'few_weekly' | 'weekly' | 'monthly' | 'occasionally';

// Chip selection component for multiple choice questions
const ChipSelectionGroup = ({ 
  options, 
  selectedValues, 
  onSelect, 
  multiSelect = true 
}: { 
  options: Array<{ label: string, value: string, icon: string }>, 
  selectedValues: string[], 
  onSelect: (value: string) => void,
  multiSelect?: boolean
}) => {
  return (
    <View style={styles.chipContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => onSelect(option.value)}
        >
          <Chip
            style={[
              styles.chip,
              selectedValues.includes(option.value) && styles.selectedChip
            ]}
            textStyle={[
              styles.chipText,
              selectedValues.includes(option.value) && styles.selectedChipText
            ]}
            mode={selectedValues.includes(option.value) ? 'flat' : 'outlined'}
          >
            <Text style={styles.chipIcon}>{option.icon}</Text> {option.label}
          </Chip>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const OnboardingScreen = () => {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // User preferences state
  const [selectedFrequency, setSelectedFrequency] = useState<ReadingFrequency | ''>('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const steps = [
    {
      title: t('common.welcome'),
      description: t('onboarding.readingHabits'),
      subtitle: t('onboarding.howOftenRead'),
    },
    {
      title: t('common.continue'),
      description: t('onboarding.ageAppropriate'),
      subtitle: t('onboarding.ageGroup'),
    },
    {
      title: t('common.continue'),
      description: t('onboarding.selectCategories'),
      subtitle: t('onboarding.bookTypes'),
    },
    {
      title: t('common.finish'),
      description: t('onboarding.enhanceDiscovery'),
      subtitle: t('onboarding.bookDiscovery'),
    },
  ];

  // Constants for options
  const readingFrequencies = [
    { label: t('settings.daily'), value: 'daily', icon: '📚' },
    { label: t('onboarding.fewWeekly'), value: 'few_weekly', icon: '📖' },
    { label: t('settings.weekly'), value: 'weekly', icon: '📅' },
    { label: t('settings.monthly'), value: 'monthly', icon: '📆' },
    { label: t('onboarding.occasionally'), value: 'occasionally', icon: '🔍' },
  ];

  const ageGroups = [
    { label: t('onboarding.under18'), value: 'under_18', icon: '👶' },
    { label: t('onboarding.18to24'), value: '18-24', icon: '🧑' },
    { label: t('onboarding.25to34'), value: '25-34', icon: '👨' },
    { label: t('onboarding.35to44'), value: '35-44', icon: '👩' },
    { label: t('onboarding.45plus'), value: '45_plus', icon: '👴' },
  ];

  const bookCategories = [
    { label: t('categories.bibleStudies'), value: 'bible_studies', icon: '📖' },
    { label: t('categories.theology'), value: 'theology', icon: '✝️' },
    { label: t('categories.spirituality'), value: 'spirituality', icon: '🙏' },
    { label: t('categories.jesus'), value: 'jesus', icon: '👑' },
    { label: t('categories.evangelism'), value: 'evangelism', icon: '🌍' },
    { label: t('categories.marriageFamily'), value: 'marriage_family', icon: '👨‍👩‍👧‍👦' },
    { label: t('categories.youth'), value: 'youth', icon: '👶' },
    { label: t('categories.testimonies'), value: 'testimonies', icon: '📚' },
    { label: t('categories.prophecy'), value: 'prophecy', icon: '⏳' },
    { label: t('categories.ethics'), value: 'ethics', icon: '⚖️' },
    { label: t('categories.healing'), value: 'healing', icon: '🌟' },
    { label: t('categories.ministry'), value: 'ministry', icon: '👥' },
  ];

  const sourceOptions = [
    { label: t('onboarding.friends'), value: 'friends', icon: '👥' },
    { label: t('onboarding.socialMedia'), value: 'social_media', icon: '📱' },
    { label: t('onboarding.bookstores'), value: 'bookstores', icon: '🏪' },
    { label: t('onboarding.onlineReviews'), value: 'online_reviews', icon: '⭐' },
    { label: t('onboarding.bookClubs'), value: 'book_clubs', icon: '👋' },
    { label: t('onboarding.recommendations'), value: 'recommendations', icon: '👍' },
  ];

  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleNext = async () => {
    if (!isValidStep()) {
      Alert.alert(
        t('onboarding.error.title'),
        t('onboarding.error.selectRequired'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    fadeOut();
    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        fadeIn();
      } else {
        handleComplete();
      }
    }, 200);
  };

  const isValidStep = () => {
    switch (currentStep) {
      case 0:
        return selectedFrequency !== '';
      case 1:
        return selectedAgeGroup !== '';
      case 2:
        return selectedCategories.length > 0;
      case 3:
        return selectedSources.length > 0;
      default:
        return true;
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Save user preferences
      const preferences = {
        reading_frequency: selectedFrequency || undefined,
        age_group: selectedAgeGroup,
        preferred_categories: selectedCategories,
        discovery_sources: selectedSources,
      };
      
      await dispatch(updateUserPreferences(preferences)).unwrap();
      await dispatch(setOnboardingCompleted()).unwrap();
      
      // Show loading state for a better UX
      setTimeout(() => {
        navigation.replace('Home');
      }, 2000);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setIsLoading(false);
      Alert.alert(
        t('onboarding.error.title'),
        t('onboarding.error.saveFailed'),
        [{ text: t('common.ok') }]
      );
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('onboarding.personalizing')}</Text>
        </View>
      );
    }

    return (
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Title style={styles.title}>{steps[currentStep].title}</Title>
          <Paragraph style={styles.description}>{steps[currentStep].description}</Paragraph>
          <Text style={styles.subtitle}>{steps[currentStep].subtitle}</Text>
        </View>

        <ScrollView style={styles.optionsScrollView}>
          {currentStep === 0 && (
            <ChipSelectionGroup
              options={readingFrequencies}
              selectedValues={selectedFrequency ? [selectedFrequency] : []}
              onSelect={(value) => setSelectedFrequency(value as ReadingFrequency)}
              multiSelect={false}
            />
          )}
          {currentStep === 1 && (
            <ChipSelectionGroup
              options={ageGroups}
              selectedValues={selectedAgeGroup ? [selectedAgeGroup] : []}
              onSelect={(value) => setSelectedAgeGroup(value)}
              multiSelect={false}
            />
          )}
          {currentStep === 2 && (
            <ChipSelectionGroup
              options={bookCategories}
              selectedValues={selectedCategories}
              onSelect={(value) => {
                setSelectedCategories(prev => 
                  prev.includes(value)
                    ? prev.filter(v => v !== value)
                    : [...prev, value]
                );
              }}
              multiSelect={true}
            />
          )}
          {currentStep === 3 && (
            <ChipSelectionGroup
              options={sourceOptions}
              selectedValues={selectedSources}
              onSelect={(value) => {
                setSelectedSources(prev => 
                  prev.includes(value)
                    ? prev.filter(v => v !== value)
                    : [...prev, value]
                );
              }}
              multiSelect={true}
            />
          )}
        </ScrollView>

        <View style={styles.footer}>
          <ProgressBar
            progress={(currentStep + 1) / steps.length}
            color={colors.primary}
            style={styles.progressBar}
          />
          <Button
            mode="contained"
            onPress={handleNext}
            style={styles.button}
            labelStyle={styles.buttonLabel}
          >
            {currentStep === steps.length - 1
              ? t('common.finish')
              : t('common.next')}
          </Button>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#ffffff', '#f7f9fc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {renderContent()}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1a2b4b',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 17,
    color: '#546b8c',
    marginBottom: 24,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 19,
    color: '#2d4168',
    fontWeight: '500',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  optionsScrollView: {
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  chip: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e9f2',
    marginBottom: 10,
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  selectedChip: {
    backgroundColor: '#4c6fff',
    borderColor: '#4c6fff',
  },
  chipText: {
    color: '#546b8c',
    fontSize: 15,
    fontWeight: '500',
  },
  selectedChipText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  chipIcon: {
    marginRight: 6,
  },
  footer: {
    marginTop: 30,
    paddingBottom: Platform.OS === 'ios' ? 0 : 20,
  },
  progressBar: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#f0f3f8',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#4c6fff',
    borderRadius: 12,
    height: 54,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#4c6fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  buttonLabel: {
    fontSize: 17,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    color: '#2d4168',
    fontSize: 18,
    marginTop: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default OnboardingScreen; 