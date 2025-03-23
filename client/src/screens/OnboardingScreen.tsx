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
const { width, height } = Dimensions.get('window');

type OnboardingNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

// Définition des catégories chrétiennes
const BOOK_CATEGORIES = [
  { label: 'Bible et études bibliques', value: 'bible_studies', icon: '📖' },
  { label: 'Théologie et doctrine chrétienne', value: 'theology', icon: '✝️' },
  { label: 'Spiritualité et vie chrétienne', value: 'spirituality', icon: '🙏' },
  { label: 'Livres sur Jésus Christ', value: 'jesus', icon: '👑' },
  { label: 'Évangélisation et mission', value: 'evangelism', icon: '🌍' },
  { label: 'Mariage famille et relation', value: 'marriage_family', icon: '👨‍👩‍👧‍👦' },
  { label: 'Jeunesse et enfants', value: 'youth', icon: '👶' },
  { label: 'Témoignages et biographies chrétiennes', value: 'testimonies', icon: '📚' },
  { label: 'Prophétie et fin des temps', value: 'prophecy', icon: '⏳' },
  { label: 'Éthique chrétienne et société', value: 'ethics', icon: '⚖️' },
  { label: 'Guérison et délivrance', value: 'healing', icon: '🌟' },
  { label: 'Ministère et leadership', value: 'ministry', icon: '👥' },
  { label: 'Louange et adoration', value: 'worship', icon: '🎵' },
  { label: 'Fictions chrétiennes', value: 'fiction', icon: '📕' },
  { label: 'Histoire de l\'Église', value: 'church_history', icon: '⛪' },
  { label: 'Livre d\'encouragement et motivation', value: 'encouragement', icon: '💪' },
];

const READING_FREQUENCIES = [
  { label: 'Daily', value: 'daily', icon: '📚' },
  { label: 'Few times a week', value: 'few_weekly', icon: '📖' },
  { label: 'Weekly', value: 'weekly', icon: '📅' },
  { label: 'Monthly', value: 'monthly', icon: '📆' },
  { label: 'Occasionally', value: 'occasionally', icon: '🔍' },
];

const AGE_GROUPS = [
  { label: 'Under 18', value: 'under_18', icon: '👶' },
  { label: '18-24', value: '18-24', icon: '🧑' },
  { label: '25-34', value: '25-34', icon: '👨' },
  { label: '35-44', value: '35-44', icon: '👩' },
  { label: '45+', value: '45_plus', icon: '👴' },
];

const DISCOVERY_SOURCES = [
  { label: 'Friends', value: 'friends', icon: '👥' },
  { label: 'Social Media', value: 'social_media', icon: '📱' },
  { label: 'Bookstores', value: 'bookstores', icon: '🏪' },
  { label: 'Online Reviews', value: 'online_reviews', icon: '⭐' },
  { label: 'Book Clubs', value: 'book_clubs', icon: '👋' },
  { label: 'Recommendations', value: 'recommendations', icon: '👍' },
];

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
      case 0: return "How often do you read?";
      case 1: return "Which age group do you belong to?";
      case 2: return "What types of books do you enjoy?";
      case 3: return "How do you discover new books?";
      default: return "";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 0: return "Tell us about your reading habits so we can tailor your experience.";
      case 1: return "This helps us recommend age-appropriate content.";
      case 2: return "Select as many categories as you like.";
      case 3: return "Select all that apply to help us enhance your book discovery experience.";
      default: return "";
    }
  };

  const renderContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ScrollView style={styles.optionsScrollView}>
            <ChipSelectionGroup
              options={READING_FREQUENCIES}
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
              options={AGE_GROUPS}
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
              options={BOOK_CATEGORIES}
              selectedValues={favoriteCategories}
              onSelect={handleCategorySelect}
            />
          </ScrollView>
        );
      case 3:
        return (
          <ScrollView style={styles.optionsScrollView}>
            <ChipSelectionGroup
              options={DISCOVERY_SOURCES}
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
            {currentStep > 0 && (
              <Button 
                mode="outlined" 
                onPress={handleBack} 
                style={styles.backButton}
                labelStyle={styles.backButtonLabel}
              >
                Back
              </Button>
            )}
            <Button 
              mode="contained" 
              onPress={handleNext} 
              style={styles.nextButton}
              labelStyle={styles.nextButtonLabel}
              disabled={!getStepValidation(currentStep)}
            >
              {currentStep < totalSteps - 1 ? 'Next' : 'Get Started'}
            </Button>
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
  backButton: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: 10,
  },
  backButtonLabel: {
    color: '#FFFFFF',
  },
  nextButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  nextButtonLabel: {
    color: '#8A2BE2',
    fontWeight: 'bold',
  },
});

export default OnboardingScreen; 