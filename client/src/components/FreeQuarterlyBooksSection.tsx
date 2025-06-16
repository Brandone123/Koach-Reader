import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ImageBackground, 
  Dimensions, 
  Share,
  Platform,
  Animated,
  PanResponder,
  ActivityIndicator
} from 'react-native';
import { FreeQuarterlyBook } from '../slices/freeQuarterlyBooksSlice';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface FreeQuarterlyBooksSectionProps {
  books: FreeQuarterlyBook[];
  onBookPress: (bookId: number) => void;
  isLoading?: boolean;
}

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

const FreeQuarterlyBooksSection: React.FC<FreeQuarterlyBooksSectionProps> = ({ 
  books, 
  onBookPress,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const slideTimer = useRef<NodeJS.Timeout | null>(null);
  
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.sectionTitle}>{t('home.freeBooks')}</Text>
        <ActivityIndicator size="large" color="#8A2BE2" style={styles.loader} />
      </View>
    );
  }
  
  if (!books || books.length === 0) return null;
  
  const currentBook = books[currentIndex];
  
  const nextSlide = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 400,
      useNativeDriver: true
    }).start(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % books.length);
      slideAnim.setValue(width);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true
      }).start();
    });
  };
  
  const prevSlide = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 400,
      useNativeDriver: true
    }).start(() => {
      setCurrentIndex((prevIndex) => prevIndex === 0 ? books.length - 1 : prevIndex - 1);
      slideAnim.setValue(-width);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true
      }).start();
    });
  };
  
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      
      onPanResponderGrant: () => {
        if (slideTimer.current) {
          clearTimeout(slideTimer.current);
        }
      },
      
      onPanResponderMove: (_, gestureState) => {
        slideAnim.setValue(gestureState.dx);
      },
      
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          nextSlide();
        } else if (gestureState.dx > SWIPE_THRESHOLD) {
          prevSlide();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 5,
            tension: 40,
            useNativeDriver: true
          }).start();
          resetTimer();
        }
      }
    })
  ).current;
  
  useEffect(() => {
    resetTimer();
    return () => {
      if (slideTimer.current) {
        clearTimeout(slideTimer.current);
      }
    };
  }, [currentIndex]);
  
  const resetTimer = () => {
    if (slideTimer.current) {
      clearTimeout(slideTimer.current);
    }
    slideTimer.current = setTimeout(() => {
      nextSlide();
    }, 5000);
  };
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: t('home.shareBookMessage', {
          title: currentBook.title,
          author: currentBook.author,
        }),
        ...(Platform.OS === 'android' && { url: 'https://koachreader.com' })
      });
    } catch (error) {
      console.error(t('error.sharingBook'));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.availabilityContainer}>
          <Text style={styles.sectionTitle}>{t('home.freeBooks')}</Text>
          <Text style={styles.sectionSubtitle}>
            {t('home.freeBooksSubtitle')} • {t('home.daysRemaining', { days: currentBook.days_remaining })}
          </Text>
        </View>

        <View style={styles.pageIndicator}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <MaterialCommunityIcons 
              name="export" 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.carouselContainer}>
        <TouchableOpacity
          style={styles.featuredBookContainer} 
          onPress={() => {
            onBookPress(currentBook.id);
            if (slideTimer.current) {
              clearTimeout(slideTimer.current);
            }
          }}
          activeOpacity={0.8}
          {...panResponder.panHandlers}
        >
          <Animated.View
            style={[
              styles.bookCard,
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            <ImageBackground
              source={{ uri: currentBook.cover_url || 'https://via.placeholder.com/150' }}
              style={styles.coverImage}
              imageStyle={styles.coverImageStyle}
            >
              <View style={styles.overlay}>
                <View style={styles.bookInfo}>
                  <Text style={styles.authorName}>{currentBook.author}</Text>
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {currentBook.title}
                  </Text>
                  <Text style={styles.bookQuote} numberOfLines={2}>
                    {currentBook.description}
                  </Text>
                  <View style={styles.expirationContainer}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color="#fff" />
                    <Text style={styles.expirationText}>
                      {t('home.expiresIn', { days: currentBook.days_remaining })}
                    </Text>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.pageIndicator}>
          {books.map((_, index) => (
            <TouchableOpacity 
              key={index}
              onPress={() => setCurrentIndex(index)}
              style={[
                styles.dot, 
                currentIndex === index && styles.activeDot
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
    paddingHorizontal: 18,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  carouselContainer: {
    alignItems: 'center',
  },
  featuredBookContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  coverImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'flex-end',
  },
  coverImageStyle: {
    borderRadius: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 20,
    justifyContent: 'flex-end',
  },
  bookInfo: {
    maxWidth: '80%',
  },
  authorName: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 6,
  },
  bookTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bookQuote: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  bottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  availabilityContainer: {
    flex: 1,
  },
  pageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#8A2BE2',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginTop: 20,
  },
  expirationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  expirationText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
});

export default FreeQuarterlyBooksSection; 