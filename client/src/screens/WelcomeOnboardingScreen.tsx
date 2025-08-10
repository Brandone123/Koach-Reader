import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ScrollView,
  Image
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { setFirstLaunchComplete } from '../utils/storage';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  titleKey: string;
  subtitleKey: string;
  illustration: any;
}

const onboardingSlides: OnboardingSlide[] = [
  {
    id: 1,
    titleKey: 'onboarding.slide1.title',
    subtitleKey: 'onboarding.slide1.subtitle',
    illustration: require('../../assets/illustrations/reading-goals.png')
  },
  {
    id: 2,
    titleKey: 'onboarding.slide2.title',
    subtitleKey: 'onboarding.slide2.subtitle',
    illustration: require('../../assets/illustrations/track-progress.png')
  },
  {
    id: 3,
    titleKey: 'onboarding.slide3.title',
    subtitleKey: 'onboarding.slide3.subtitle',
    illustration: require('../../assets/illustrations/reading-community.png')
  },
  {
    id: 4,
    titleKey: 'onboarding.slide4.title',
    subtitleKey: 'onboarding.slide4.subtitle',
    illustration: require('../../assets/illustrations/achievements.png')
  }
];

interface WelcomeOnboardingScreenProps {
  onComplete: () => void;
}

const WelcomeOnboardingScreen: React.FC<WelcomeOnboardingScreenProps> = ({
  onComplete
}) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentPage < onboardingSlides.length - 1) {
      const nextPage = currentPage + 1;
      scrollViewRef.current?.scrollTo({
        x: nextPage * width,
        animated: true
      });
      setCurrentPage(nextPage);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    await setFirstLaunchComplete();
    onComplete();
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const currentIndex = Math.round(contentOffset.x / width);
    setCurrentPage(currentIndex);
  };

  const renderSlide = (slide: OnboardingSlide, index: number) => (
    <View key={slide.id} style={styles.slide}>
      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        <Image 
          source={slide.illustration} 
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          {t(slide.titleKey)}
        </Text>
        <Text style={styles.subtitle}>
          {t(slide.subtitleKey)}
        </Text>
      </View>

      {/* Page Indicators */}
      <View style={styles.indicatorContainer}>
        {onboardingSlides.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.indicator,
              idx === currentPage ? styles.activeIndicator : styles.inactiveIndicator
            ]}
          />
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentPage === onboardingSlides.length - 1 ? t('common.getStarted') : t('common.next')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipButtonText}>
            {t('common.skip')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {onboardingSlides.map((slide, index) => renderSlide(slide, index))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    paddingHorizontal: 30,
    paddingVertical: 40,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  illustration: {
    width: width * 0.8,
    height: height * 0.4,
    maxHeight: 350,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeIndicator: {
    width: 24,
    backgroundColor: '#8A2BE2',
  },
  inactiveIndicator: {
    width: 8,
    backgroundColor: '#E0E0E0',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#8A2BE2',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default WelcomeOnboardingScreen;