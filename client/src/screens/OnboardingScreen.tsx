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
} from 'react-native';
import { Button, Chip, ProgressBar, Title, Paragraph, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../hooks/useAuth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { updatePreferences } from '../slices/authSlice';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

// Colors definition
const colors = {
  primary: '#8A2BE2',
  secondary: '#4B0082',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.8)',
  background: '#FFFFFF',
  chipBackground: '#F0F0F0',
  chipSelected: '#8A2BE2',
  chipTextNormal: '#333',
  chipTextSelected: '#FFFFFF',
};

type OnboardingNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

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
  const { updateOnboardingStatus, forceCompleteOnboarding } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { t } = useTranslation();

  // State for user preferences
  const [readingFrequency, setReadingFrequency] = useState<string[]>([]);
  const [ageGroup, setAgeGroup] = useState<string[]>([]);
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>([]);
  const [discoverySources, setDiscoverySources] = useState<string[]>([]);

  const totalSteps = 4; // 4 étapes au lieu de 5

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep + 1);
        // Scroll to the next step
        scrollViewRef.current?.scrollTo({ x: width * (currentStep + 1), animated: false });
        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else {
      // Complete onboarding - version simplifiée
      const preferences = {
        readingFrequency: readingFrequency[0], // Take first selection for single select
        ageGroup: ageGroup[0], // Take first selection for single select
        favoriteCategories,
        discoverySources,
      };
      
      // Log preferences for debugging but don't use Redux actions
      console.log('Completing onboarding with preferences:', preferences);
      
      // Navigation directe vers Home sans actions supplémentaires
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' as keyof RootStackParamList }],
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep - 1);
        // Scroll to the previous step
        scrollViewRef.current?.scrollTo({ x: width * (currentStep - 1), animated: false });
        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleFrequencySelect = (value: string) => {
    setReadingFrequency([value]); // Single selection
  };

  const handleAgeGroupSelect = (value: string) => {
    setAgeGroup([value]); // Single selection
  };

  const handleCategorySelect = (value: string) => {
    // Toggle selection for multiple choices
    if (favoriteCategories.includes(value)) {
      setFavoriteCategories(favoriteCategories.filter(category => category !== value));
    } else {
      setFavoriteCategories([...favoriteCategories, value]);
    }
  };

  const handleDiscoverySourceSelect = (value: string) => {
    // Toggle selection for multiple choices
    if (discoverySources.includes(value)) {
      setDiscoverySources(discoverySources.filter(source => source !== value));
    } else {
      setDiscoverySources([...discoverySources, value]);
    }
  };

  const getStepValidation = (step: number): boolean => {
    switch (step) {
      case 0: return readingFrequency.length > 0;
      case 1: return ageGroup.length > 0;
      case 2: return favoriteCategories.length > 0;
      case 3: return discoverySources.length > 0;
      default: return false;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 0: return t('onboarding.howOftenRead');
      case 1: return t('onboarding.ageGroup');
      case 2: return t('onboarding.bookTypes');
      case 3: return t('onboarding.bookDiscovery');
      default: return "";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 0: return t('onboarding.readingHabits');
      case 1: return t('onboarding.ageAppropriate');
      case 2: return t('onboarding.selectCategories');
      case 3: return t('onboarding.enhanceDiscovery');
      default: return "";
    }
  };

  // Move these constants inside the component to use the t function
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
    { label: t('categories.worship'), value: 'worship', icon: '🎵' },
    { label: t('categories.fiction'), value: 'fiction', icon: '📕' },
    { label: t('categories.churchHistory'), value: 'church_history', icon: '⛪' },
    { label: t('categories.encouragement'), value: 'encouragement', icon: '💪' },
  ];

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

  const sourceOptions = [
    { label: t('onboarding.friends'), value: 'friends', icon: '👥' },
    { label: t('onboarding.socialMedia'), value: 'social_media', icon: '📱' },
    { label: t('onboarding.bookstores'), value: 'bookstores', icon: '🏪' },
    { label: t('onboarding.onlineReviews'), value: 'online_reviews', icon: '⭐' },
    { label: t('onboarding.bookClubs'), value: 'book_clubs', icon: '👋' },
    { label: t('onboarding.recommendations'), value: 'recommendations', icon: '👍' },
  ];

  const renderContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ScrollView style={styles.optionsScrollView}>
            <ChipSelectionGroup
              options={readingFrequencies}
              selectedValues={readingFrequency}
              onSelect={handleFrequencySelect}
              multiSelect={false}
            />
          </ScrollView>
        );
      case 1:
        return (
          <ScrollView style={styles.optionsScrollView}>
            <ChipSelectionGroup
              options={ageGroups}
              selectedValues={ageGroup}
              onSelect={handleAgeGroupSelect}
              multiSelect={false}
            />
          </ScrollView>
        );
      case 2:
        return (
          <ScrollView style={styles.optionsScrollView}>
            <ChipSelectionGroup
              options={bookCategories}
              selectedValues={favoriteCategories}
              onSelect={handleCategorySelect}
            />
          </ScrollView>
        );
      case 3:
        return (
          <ScrollView style={styles.optionsScrollView}>
            <ChipSelectionGroup
              options={sourceOptions}
              selectedValues={discoverySources}
              onSelect={handleDiscoverySourceSelect}
            />
          </ScrollView>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient 
        colors={['#8A2BE2', '#4B0082']} 
        style={styles.gradient}
      >
        <View style={styles.progressContainer}>
          <Text style={styles.stepIndicator}>Step {currentStep + 1} of {totalSteps}</Text>
          <ProgressBar 
            progress={(currentStep + 1) / totalSteps} 
            color="#FFF" 
            style={styles.progressBar} 
          />
        </View>
        
        <Animated.View 
          style={[styles.contentContainer, { opacity: fadeAnim }]}
        >
          <View style={styles.questionContainer}>
            <Title style={styles.questionTitle}>{getStepTitle()}</Title>
            <Paragraph style={styles.questionDescription}>{getStepDescription()}</Paragraph>
          </View>
          
          <View style={styles.selectionContainer}>
            {renderContent()}
          </View>
          
          <View style={styles.footer}>
            <View style={styles.buttonContainer}>
              {currentStep > 0 && (
                <Button
                  mode="text"
                  onPress={handleBack}
                  style={styles.button}
                  color={colors.textSecondary}
                >
                  {t('common.previous')}
                </Button>
              )}
              <Button
                mode="contained"
                onPress={handleNext}
                style={[styles.button, styles.primaryButton]}
                disabled={!getStepValidation(currentStep)}
              >
                {currentStep < totalSteps - 1 ? t('common.next') : t('common.finish')}
              </Button>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  stepIndicator: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  questionContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  questionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  questionDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 40,
  },
  selectionContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  optionsScrollView: {
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  chip: {
    margin: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0F0F0',
  },
  selectedChip: {
    backgroundColor: '#8A2BE2',
  },
  chipText: {
    color: '#333',
  },
  selectedChipText: {
    color: '#FFFFFF',
  },
  chipIcon: {
    marginRight: 5,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: 10,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
  },
});

export default OnboardingScreen; 