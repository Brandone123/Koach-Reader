import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  ImageBackground,
  ImageSourcePropType,
  Share,
  Platform,
  Animated,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
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
const SWIPE_THRESHOLD = 120; // Distance minimum pour considérer comme un swipe

const FreeQuarterlyBooksSection: React.FC<FreeQuarterlyBooksSectionProps> = ({ 
  books, 
  onBookPress,
  isLoading = false
}) => {
  const { t, i18n } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const slideTimer = useRef<NodeJS.Timeout | null>(null);
  
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.sectionTitle}>{t('home.freeQuarterlyBooks')}</Text>
        <ActivityIndicator size="large" color="#8A2BE2" style={styles.loader} />
      </View>
    );
  }
  
  if (!books || books.length === 0) return null;
  
  // Sélectionner le livre actuellement affiché
  const featuredBook = books[currentIndex];
  
  // Fonction pour passer au livre suivant
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
  
  // Fonction pour aller au livre précédent
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
  
  // Configuration du Pan Responder pour gérer les gestes de swipe
  const panResponder = React.useRef(
    PanResponder.create({
      // Demander à être le responder
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      
      onPanResponderGrant: () => {
        // Arrêter le timer quand l'utilisateur commence à toucher
        if (slideTimer.current) {
          clearTimeout(slideTimer.current);
        }
      },
      
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Animer au fur et à mesure que l'utilisateur swipe
        slideAnim.setValue(gestureState.dx);
      },
      
      onPanResponderRelease: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Quand l'utilisateur relâche, déterminer si c'est un swipe gauche ou droite
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swipe vers la gauche -> slide suivant
          nextSlide();
        } else if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swipe vers la droite -> slide précédent
          prevSlide();
        } else {
          // Pas assez de mouvement, revenir à la position initiale
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 5,
            tension: 40,
            useNativeDriver: true
          }).start();
          
          // Redémarrer le timer
          resetTimer();
        }
      }
    })
  ).current;
  
  // Configuration du timer pour changer automatiquement de slide toutes les 5 secondes
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
  
  // Calculer le nombre de jours restants jusqu'à l'expiration
  const calculateDaysLeft = (dateString: string): number => {
    const today = new Date();
    const expiryDate = new Date(dateString);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  // Formater la date selon la langue actuelle
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Date invalide";
      }
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      return date.toLocaleDateString(i18n.language, options);
    } catch (error) {
      console.error("Erreur de formatage de date:", error);
      return "Date invalide";
    }
  };
  
  // Fonction de partage du livre
  const handleShare = async () => {
    try {
      const shareResult = await Share.share({
        title: featuredBook.title,
        message: t('book.shareMessage', { 
          title: featuredBook.title, 
          author: featuredBook.author 
        }),
        // URL pour Android uniquement
        ...(Platform.OS === 'android' && { url: 'https://koachreader.com' })
      });
      
      if (shareResult.action === Share.sharedAction) {
        // Partagé avec succès
        console.log('Shared successfully');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  const daysLeft = calculateDaysLeft(featuredBook.availableUntil);
  
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.availabilityContainer}>
          <Text style={styles.sectionTitle}>{t('home.freeQuarterlyBooks')}</Text>
          <Text style={styles.sectionSubtitle}>{t('home.freeQuarterlyBooksSubtitle')}</Text>
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
            onBookPress(featuredBook.id);
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
              source={featuredBook.coverImageUrl} 
              style={styles.coverImage}
              imageStyle={styles.coverImageStyle}
            >
              <View style={styles.overlay}>
                <View style={styles.bookInfo}>
                  <Text style={styles.authorName}>{featuredBook.author}</Text>
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {featuredBook.title}
                  </Text>
                  <Text style={styles.bookQuote} numberOfLines={2}>
                    {featuredBook.description}
                  </Text>
                </View>
              </View>
            </ImageBackground>
          </Animated.View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.bottomContainer}>
        <View style={styles.availabilityContainer}>
          <Text style={styles.availabilityText}>
            {t('home.availableUntil', { date: formatDate(featuredBook.availableUntil) })}
          </Text>
          <Text style={styles.daysLeftText}>
            {t('home.daysLeft', { days: daysLeft })}
          </Text>
        </View>
        
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
    justifyContent: 'space-between',
    marginTop: 6,
  },
  availabilityContainer: {
    flex: 1,
  },
  availabilityText: {
    fontSize: 14,
    color: '#666',
  },
  daysLeftText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: 2,
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
  shareIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginTop: 20,
  },
});

export default FreeQuarterlyBooksSection; 