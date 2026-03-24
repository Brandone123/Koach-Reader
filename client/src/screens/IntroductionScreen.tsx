import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  ScrollView,
  PanResponder,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface IntroSlide {
  id: number;
  titleKey: string;
  subtitleKey: string;
  image: any;
  backgroundColor: string;
  gradientColors: string[];
}

const introSlides: IntroSlide[] = [
  {
    id: 1,
    titleKey: 'intro.slide1.title',
    subtitleKey: 'intro.slide1.subtitle',
    image: require('../../assets/icon.png'),
    backgroundColor: '#8A2BE2',
    gradientColors: ['#8A2BE2', '#4A0082']
  },
  {
    id: 2,
    titleKey: 'intro.slide2.title',
    subtitleKey: 'intro.slide2.subtitle',
    image: require('../../assets/icon.png'),
    backgroundColor: '#22c55e',
    gradientColors: ['#22c55e', '#16a34a']
  },
  {
    id: 3,
    titleKey: 'intro.slide3.title',
    subtitleKey: 'intro.slide3.subtitle',
    image: require('../../assets/icon.png'),
    backgroundColor: '#3b82f6',
    gradientColors: ['#3b82f6', '#1d4ed8']
  }
];

interface IntroductionScreenProps {
  onComplete: () => void;
  onLanguagePress: () => void;
}

const IntroductionScreen: React.FC<IntroductionScreenProps> = ({
  onComplete,
  onLanguagePress
}) => {
  const { t, i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentPage < introSlides.length - 1) {
      const nextPage = currentPage + 1;
      scrollViewRef.current?.scrollTo({
        x: nextPage * width,
        animated: true,
      });
      setCurrentPage(nextPage);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const getCurrentLanguageDisplay = () => {
    return i18n.language === 'fr' ? 'Français' : 'English';
  };

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { 
      useNativeDriver: false,
      listener: (event: any) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
        setCurrentPage(index);
      }
    }
  );

  const renderSlide = (slide: IntroSlide, index: number) => (
    <View key={slide.id} style={[styles.slide, { width }]}>
      <LinearGradient
        colors={slide.gradientColors as [string, string, ...string[]]}
        style={styles.slideGradient}
      >
        {/* Language Selector */}
        <TouchableOpacity 
          style={styles.languageSelector}
          onPress={onLanguagePress}
        >
          <MaterialCommunityIcons name="web" size={20} color="#fff" />
          <Text style={styles.languageText}>{getCurrentLanguageDisplay()}</Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.slideContent}>
          {/* Image */}
          <View style={styles.imageContainer}>
            <Image source={slide.image} style={styles.slideImage} resizeMode="contain" />
            
            {/* Koach coin animation for first slide */}
            {index === 0 && (
              <View style={styles.koachCoin}>
                <Text style={styles.koachCoinText}>Koach</Text>
              </View>
            )}
          </View>

          {/* Text Content */}
          <View style={styles.textContent}>
            <Text style={styles.slideTitle}>
              {t(slide.titleKey)}
            </Text>
            <Text style={styles.slideSubtitle}>
              {t(slide.subtitleKey)}
            </Text>
          </View>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Page Indicators */}
          <View style={styles.pageIndicators}>
            {introSlides.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.pageIndicator,
                  idx === currentPage && styles.pageIndicatorActive
                ]}
              />
            ))}
          </View>

          {/* Action Buttons */}
          {index === introSlides.length - 1 ? (
            <View style={styles.finalSlideButtons}>
              <TouchableOpacity style={styles.createAccountButton} onPress={onComplete}>
                <Text style={styles.createAccountButtonText}>
                  {t('auth.createAccount')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.loginButton} onPress={onComplete}>
                <Text style={styles.loginButtonText}>
                  {t('auth.login')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.navigationButtons}>
              <TouchableOpacity onPress={handleSkip}>
                <Text style={styles.skipText}>{t('common.skip')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>{t('common.next')}</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {introSlides.map((slide, index) => renderSlide(slide, index))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    height: height,
  },
  slideGradient: {
    flex: 1,
    paddingHorizontal: 20,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
  },
  languageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  slideImage: {
    width: width * 0.5,
    height: height * 0.25,
  },
  koachCoin: {
    position: 'absolute',
    top: -20,
    right: -10,
    backgroundColor: '#FFD700',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '15deg' }],
  },
  koachCoinText: {
    color: '#333',
    fontSize: 10,
    fontWeight: 'bold',
  },
  textContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  slideSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSection: {
    paddingBottom: 40,
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  pageIndicatorActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  finalSlideButtons: {
    gap: 12,
  },
  createAccountButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createAccountButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default IntroductionScreen;
