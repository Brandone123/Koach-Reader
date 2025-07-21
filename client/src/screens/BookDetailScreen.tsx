import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  Share,
  Platform,
  ActivityIndicator,
  StatusBar,
  Animated,
  Alert
} from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Chip, 
  Divider, 
  Avatar, 
  IconButton,
  useTheme,
  Portal,
  Dialog,
  TextInput,
  Surface,
  Badge,
  Snackbar,
  Menu,
  FAB
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { selectBooks, selectBooksLoading } from '../slices/booksSlice';
import { selectUser } from '../slices/authSlice';
import { 
  createReadingPlan, 
  selectBookReadingPlan,
  updateReadingProgress
} from '../slices/readingPlansSlice';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { AppDispatch, RootState } from '../store';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Author } from '../types/author';
import { supabase } from '../lib/supabase';
import LottieView from 'lottie-react-native';
import { fixBookUrlsInObject } from '../utils/fixSupabaseUrls';
import { useNavigation } from '@react-navigation/native';

// Header constants and sizes for better positioning
const { width, height } = Dimensions.get('window');
const COVER_HEIGHT = height * 0.45;
const COVER_WIDTH = width * 0.6;
const HEADER_HEIGHT = height * 0.55;
const HEADER_MIN_HEIGHT = 90;
const HEADER_SCROLL_DISTANCE = HEADER_HEIGHT - HEADER_MIN_HEIGHT;
const TAB_HEIGHT = 50;

type BookDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BookDetail'>;
type BookDetailScreenRouteProp = RouteProp<RootStackParamList, 'BookDetail'>;

interface BookDetailScreenProps {
  navigation: BookDetailScreenNavigationProp;
  route: BookDetailScreenRouteProp;
}

// Define interface for User with is_admin property
interface ExtendedUser {
  id: string;
  email: string;
  username: string;
  is_admin?: boolean;
}

// Fix for the navigation types and the book model
// Change the type definitions for MediaViewer
interface Book {
  id: number;
  title: string;
  description?: string;
  isbn?: string;
  publication_date?: string;
  language?: string;
  cover_url?: string;
  cover_image?: string;
  total_pages: number;
  reading_time?: string;
  pdf_url?: string;
  audio_url?: string;
  video_url?: string; // Add this property
  is_free: boolean;
  author_id: number;
  rating?: number;
  rating_count?: number;
  author?: Author;
  categories?: Category[];
  viewers?: number; // Added for dynamic view count
}

// Add missing Category interface
interface Category {
  id: string;
  name: string;
  icon_name?: string;
  description?: string;
}

const BookDetailScreen: React.FC<BookDetailScreenProps> = ({ navigation, route }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { bookId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  
  const books = useSelector(selectBooks);
  const book = books.find(b => b.id === parseInt(bookId)) as Book;
  const user = useSelector(selectUser) as ExtendedUser;
  const isLoading = useSelector(selectBooksLoading);
  const readingPlan = useSelector((state) => selectBookReadingPlan(state, parseInt(bookId)));
  
  // Tous les hooks useState doivent être définis au début du composant
  const [refreshing, setRefreshing] = useState(false);
  // const [createPlanVisible, setCreatePlanVisible] = useState(false);
  // const [dailyGoal, setDailyGoal] = useState('');
  // const [planNotes, setPlanNotes] = useState('');
  const [selectedTab, setSelectedTab] = useState<'about' | 'outline' | 'notes'>('about');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [userNotes, setUserNotes] = useState<Array<{id: string, content: string, createdAt: string}>>([]);
  const [noteText, setNoteText] = useState('');
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [bookData, setBook] = useState<any>(null);
  const [localReadingPlan, setReadingPlan] = useState<any>(null);
  
  // Pour le bouton scroll to top - Déplacé ici depuis plus bas
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
  // Animation values et refs - Les refs peuvent être utilisées avant les early returns
  const animationRef = useRef<LottieView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  
  // Header animations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });
  
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 0.6, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 0.1, 1],
    extrapolate: 'clamp',
  });
  
  const headerContentOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 0.2, HEADER_SCROLL_DISTANCE * 0.6],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp',
  });
  
  const coverScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.6],
    extrapolate: 'clamp',
  });
  
  const coverTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });
  
  const coverTranslateX = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -width / 3],
    extrapolate: 'clamp',
  });
  
  // Tous les useEffect doivent être définis au début du composant
  useEffect(() => {
    // Set status bar color to match the header
    StatusBar.setBarStyle('light-content');
    
    const loadBookDetails = async () => {
      if (!bookId) return;
      
      try {
        setLocalIsLoading(true);
        
        // Charger les détails du livre
        const { data, error } = await supabase
          .from('books')
          .select(`
            *,
            authors:author_id (*),
            book_categories (
              categories (
                id,
                name,
                icon_name
              )
            )
          `)
          .eq('id', bookId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          // Fix any Supabase storage URLs that might be in the wrong format
          const fixedData = fixBookUrlsInObject(data);
          
          // Vérifier et corriger les URLs locales
          const correctedData = await checkAndFixLocalUrls(bookId, fixedData);
          
          // Transformer les données pour inclure les catégories et l'auteur
          const transformedBook = {
            ...correctedData,
            author: correctedData.authors,
            categories: correctedData.book_categories ? 
              correctedData.book_categories.map((bc: any) => bc.categories) : [],
          };
          
          setBook(transformedBook);
          
          // Charger le plan de lecture
          if (user?.id) {
            const { data: planData } = await supabase
              .from('reading_plans')
              .select('*')
              .eq('user_id', user.id)
              .eq('book_id', bookId)
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (planData && planData.length > 0) {
              setReadingPlan(planData[0]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading book details:', error);
      } finally {
        setLocalIsLoading(false);
      }
    };
    
    const checkFavoriteStatus = async () => {
      if (!user?.id || !bookId) return;
      
      try {
        const { data, error } = await supabase
          .from('user_books')
          .select('is_favorite')
          .eq('user_id', user.id)
          .eq('book_id', parseInt(bookId))
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking favorite status:', error);
          return;
        }
        
        if (data) {
          setIsFavorite(data.is_favorite);
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };
    
    const loadUserNotes = async () => {
      if (!user?.id || !bookId) return;
      
      try {
        const { data, error } = await supabase
          .from('annotations')
          .select('id, content, created_at')
          .eq('user_id', user.id)
          .eq('book_id', parseInt(bookId))
          .eq('type', 'note')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error loading notes:', error);
          return;
        }
        
        if (data) {
          setUserNotes(data.map(note => ({
            id: note.id,
            content: note.content,
            createdAt: note.created_at
          })));
        }
      } catch (error) {
        console.error('Error loading notes:', error);
      }
    };
    
    // Increment book viewers count
    const incrementViewers = async () => {
      if (!bookId) return;
      
      try {
        await supabase.rpc('increment_book_viewers', {
          book_id: parseInt(bookId)
        });
      } catch (error) {
        console.error('Error incrementing viewers:', error);
      }
    };
    
    loadBookDetails();
    checkFavoriteStatus();
    loadUserNotes();
    incrementViewers();
    
    return () => {
      // Reset to default on unmount
      StatusBar.setBarStyle('default');
    };
  }, [bookId, user]);
  
  // Effect pour le bouton scroll to top (useEffect supplémentaire)
  useEffect(() => {
    const scrollListener = scrollY.addListener(({ value }) => {
      if (value > 300 && !showScrollToTop) {
        setShowScrollToTop(true);
      } else if (value <= 300 && showScrollToTop) {
        setShowScrollToTop(false);
      }
    });
    
    return () => {
      scrollY.removeListener(scrollListener);
    };
  }, [scrollY, showScrollToTop]);

  // Styles conditionnels en fonction de la présence d'un audio_url
  const hasAudio = book ? Boolean(book.audio_url) : false;

  // On peut maintenant faire un early return ici en toute sécurité
  if (localIsLoading || !book) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  const author: Author | undefined = book.author;

  // Simuler livres similaires (même première catégorie)
  const similarBooks = books.filter(
    b => b.id !== book.id && b.categories?.[0]?.id === book.categories?.[0]?.id
  ).slice(0, 5);

  // Les fonctions sont définies après l'early return
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  // Fonction pour remonter le scroll en haut
  const scrollToTop = () => {
    scrollRef.current?.scrollTo({
      y: 0,
      animated: true,
    });
  };

  // Fonction pour le refresh
  const onRefresh = async () => {
    setRefreshing(true);
    
    // Refresh favorite status and notes
    if (user?.id && bookId) {
      try {
        const { data: favoriteData } = await supabase
          .from('user_books')
          .select('is_favorite')
          .eq('user_id', user.id)
          .eq('book_id', parseInt(bookId))
          .single();
          
        if (favoriteData) {
          setIsFavorite(favoriteData.is_favorite);
        }
        
        const { data: notesData } = await supabase
          .from('annotations')
          .select('id, content, created_at')
          .eq('user_id', user.id)
          .eq('book_id', parseInt(bookId))
          .eq('type', 'note')
          .order('created_at', { ascending: false });
          
        if (notesData) {
          setUserNotes(notesData.map(note => ({
            id: note.id,
            content: note.content,
            createdAt: note.created_at
          })));
        }
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    }
    
    setRefreshing(false);
  };

  // Les autres fonctions de gestion (handlers)
  const handleShare = async () => {
    if (!book) return;
    
    try {
      await Share.share({
        message: t('book.shareMessage', { title: book.title, author: book.author?.name || '' }),
        title: book.title,
      });
    } catch (error) {
      console.warn(t('book.shareError'));
    }
  };
  
  const toggleFavorite = async () => {
    if (!user?.id || !bookId) return;
    
    try {
      // Check if user_books entry exists
      const { data: existingData, error: checkError } = await supabase
        .from('user_books')
        .select('id, is_favorite')
        .eq('user_id', user.id)
        .eq('book_id', parseInt(bookId))
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      const newFavoriteStatus = !isFavorite;
      
      if (existingData) {
        // Update existing entry
        await supabase
          .from('user_books')
          .update({
            is_favorite: newFavoriteStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
      } else {
        // Create new entry
        await supabase
          .from('user_books')
          .insert({
            user_id: user.id,
            book_id: parseInt(bookId),
            is_favorite: newFavoriteStatus,
            current_page: 0,
            last_read_date: new Date().toISOString()
          });
      }
      
      setIsFavorite(newFavoriteStatus);
      
      // Award points for adding to favorites
      if (newFavoriteStatus) {
        setPointsEarned(2);
        setShowRewardAnimation(true);
        
        // Update user's koach points
        await supabase.rpc('add_koach_points', {
          user_id: user.id,
          points_to_add: 2
        });
        
        setTimeout(() => {
          setShowRewardAnimation(false);
        }, 3000);
      }
      
      setSnackbarMessage(newFavoriteStatus ? t('book.addedToFavorites') : t('book.removedFromFavorites'));
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error toggling favorite status:', error);
      setSnackbarMessage(t('common.errorOccurred'));
      setSnackbarVisible(true);
    }
  };
  
  const addNote = async () => {
    if (!user?.id || !bookId || !noteText.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('annotations')
        .insert({
          user_id: user.id,
          book_id: parseInt(bookId),
          type: 'note',
          content: noteText.trim(),
          page: 0 // General note not tied to a specific page
        })
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        // Add the new note to the state
        setUserNotes([
          {
            id: data.id,
            content: data.content,
            createdAt: data.created_at
          },
          ...userNotes
        ]);
        
        setNoteText('');
        setShowNoteDialog(false);
        
        // Award points for adding a note
        setPointsEarned(3);
        setShowRewardAnimation(true);
        
        // Update user's koach points
        await supabase.rpc('add_koach_points', {
          user_id: user.id,
          points_to_add: 3
        });
        
        setTimeout(() => {
          setShowRewardAnimation(false);
        }, 3000);
        
        setSnackbarMessage(t('book.noteAdded'));
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error('Error adding note:', error);
      setSnackbarMessage(t('common.errorOccurred'));
      setSnackbarVisible(true);
    }
  };
  
  const deleteNote = async (noteId: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('annotations')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Remove the note from the state
      setUserNotes(userNotes.filter(note => note.id !== noteId));
      
      setSnackbarMessage(t('book.noteDeleted'));
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error deleting note:', error);
      setSnackbarMessage(t('common.errorOccurred'));
      setSnackbarVisible(true);
    }
  };

  const handleCreatePlan = () => {
    if (!book || !user) return;

    const goal = parseInt(dailyGoal);
    if (isNaN(goal) || goal <= 0) {
      setSnackbarMessage(t('readingPlan.invalidGoal'));
      setSnackbarVisible(true);
      return;
    }

    const startDate = new Date().toISOString();
    const daysToComplete = Math.ceil(book.total_pages / goal);
    const endDate = new Date(Date.now() + daysToComplete * 24 * 60 * 60 * 1000).toISOString();

    dispatch(createReadingPlan({
      userId: user.id,
      bookId: parseInt(bookId),
      startDate,
      endDate,
      dailyGoal: goal,
      notes: planNotes
    }));

    setCreatePlanVisible(false);
    setDailyGoal('');
    setPlanNotes('');
    
    setSnackbarMessage(t('readingPlan.planCreated'));
    setSnackbarVisible(true);
  };

  const handleReadBook = () => {
    if (readingPlan) {
      openPDF();
      return;
    }
    Alert.alert(
      t('readingPlan.needPlanFirst'),
      t('readingPlan.pleaseCreatePlan'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('readingPlan.createPlan'),
          onPress: () => navigation.navigate('ReadingPlan', { bookId: book.id }),
        },
      ]
    );
  };

  const handleListenBook = () => {
    if (!readingPlan) {
      setSnackbarMessage(t('readingPlan.needPlanFirst'));
      setSnackbarVisible(true);
      setCreatePlanVisible(true);
      return;
    }
    
    // @ts-ignore - Ignorer les erreurs de type pour navigation
    navigation.navigate('MediaViewer', { bookId: book.id.toString(), type: 'audio' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Mock data for outline - replace with actual data when available
  const bookOutline = [
    { time: '0:00', title: t('book.outlineSample1') },
    { time: '1:54', title: t('book.outlineSample2') },
    { time: '5:50', title: t('book.outlineSample3') },
  ];
  
  // Fonction pour ouvrir le PDF
  const openPDF = () => {
    if (!book || !book.pdf_url) {
      Alert.alert(t('bookDetail.error'), t('bookDetail.noPDF'));
      return;
    }
    
    try {
      // Fix the URL format if needed
      const fixedUrl = fixBookUrlsInObject({pdf_url: book.pdf_url}).pdf_url;
      
      // Navigate to the MediaViewer with the fixed URL
      if (fixedUrl) {
        // If we want to update the database with the fixed URL
        if (fixedUrl !== book.pdf_url) {
          console.log('PDF URL fixed:', fixedUrl);
          // Optionally update the database
          supabase
            .from('books')
            .update({ pdf_url: fixedUrl })
            .eq('id', book.id)
            .then(({ error }) => {
              if (error) {
                console.error('Error updating PDF URL:', error);
              } else {
                console.log('PDF URL updated in database');
              }
            });
        }
        
        // Update the book object in state with the fixed URL
        setBook({
          ...book,
          pdf_url: fixedUrl
        });
        
        // Navigate to the media viewer
        // @ts-ignore - Ignorer les erreurs de type pour navigation
        navigation.navigate('MediaViewer', {
          bookId: book.id.toString(),
          type: 'pdf'
        });
      } else {
        Alert.alert(t('bookDetail.error'), t('bookDetail.invalidPDF'));
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      Alert.alert(t('bookDetail.error'), t('bookDetail.errorOpeningPDF'));
    }
  };

  // Fonction pour télécharger le PDF
  const handleDownload = async () => {
    if (book?.pdf_url) {
      try {
        console.log('Downloading PDF from URL:', book.pdf_url);
        setSnackbarMessage(t('book.downloadStarted'));
        setSnackbarVisible(true);
        
        // This is a placeholder - in a real app, you would implement the actual download logic
        // Example: await downloadFile(book.pdf_url, `${book.title}.pdf`);
        
        setTimeout(() => {
          setSnackbarMessage(t('book.downloadComplete'));
          setSnackbarVisible(true);
        }, 2000);
      } catch (error) {
        console.error('Download error:', error);
        setSnackbarMessage(t('book.downloadError'));
        setSnackbarVisible(true);
      }
    } else {
      console.log('PDF URL not available for download');
      setSnackbarMessage(t('book.pdfNotAvailable'));
      setSnackbarVisible(true);
    }
  };
  
  // Fonction pour vérifier et corriger les URLs locales
  const checkAndFixLocalUrls = async (bookId: string, bookData: any) => {
    if (!bookData || !user?.id) return bookData;
    
    try {
      let needsUpdate = false;
      const updates: any = {};
      
      // Vérifier si pdf_url est un chemin local
      if (bookData.pdf_url && bookData.pdf_url.startsWith('file://')) {
        console.log('PDF URL est un chemin local, marquage pour correction:', bookData.pdf_url);
        updates.pdf_url = null;
        needsUpdate = true;
      }
      
      // Vérifier si cover_url est un chemin local
      if (bookData.cover_url && bookData.cover_url.startsWith('file://')) {
        console.log('Cover URL est un chemin local, marquage pour correction:', bookData.cover_url);
        updates.cover_url = null;
        needsUpdate = true;
      }
      
      // Mettre à jour la base de données si nécessaire
      if (needsUpdate) {
        console.log('Mise à jour des URLs locales pour le livre:', bookId);
        const { error } = await supabase
          .from('books')
          .update(updates)
          .eq('id', parseInt(bookId));
          
        if (error) {
          console.error('Erreur lors de la correction des URLs:', error);
        } else {
          console.log('URLs corrigées avec succès');
          // Mettre à jour les données du livre
          return { ...bookData, ...updates };
        }
      }
      
      return bookData;
    } catch (error) {
      console.error('Erreur lors de la vérification des URLs:', error);
      return bookData;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Fixed Header Title - Shows when scrolled */}
      <Animated.View style={[styles.fixedHeader, { opacity: headerTitleOpacity }]}>
        <LinearGradient
          colors={['#1E2A38', '#102030']}
          style={styles.fixedHeaderGradient}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.fixedHeaderTitle} numberOfLines={2}>
            {book.title}
          </Text>
          <View style={styles.headerRightActions}>
            {user?.is_admin && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('AddBook', { bookId })}
              >
                <MaterialCommunityIcons name="pencil" size={22} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={toggleFavorite}
            >
              <MaterialCommunityIcons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={22} 
                color={isFavorite ? "#FF5976" : "#fff"} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
            >
              <MaterialCommunityIcons name="share-variant" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
      
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        scrollEventThrottle={16}
        onScroll={handleScroll}
        ref={scrollRef}
      >
        {/* Hero Header with Book Cover */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#1E2A38', '#102030']}
            style={styles.headerGradient}
          >
            <Animated.View 
              style={[
                styles.headerContent, 
                { 
                  opacity: headerContentOpacity,
                }
              ]}
            >
              <View style={styles.imageContainer}>
                <Image
                  source={{
                    uri: book?.cover_url 
                      ? (book.cover_url.includes('/storage/v1/object/public/') 
                          ? book.cover_url 
                          : `https://amjodckmmxmpholspskm.supabase.co/storage/v1/object/public/covers/${book.cover_url.split('/').pop()}`)
                      : book?.cover_image || "https://amjodckmmxmpholspskm.supabase.co/storage/v1/object/public/covers/placeholder.png"
                  }}
                  style={styles.bookCover}
                  resizeMode="cover"
                />
              </View>
          
              <View style={styles.headerInfo}>
                <Text style={styles.bookTitle}>{book.title}</Text>
                
                <TouchableOpacity 
                  style={styles.authorLink}
                  onPress={() => author && navigation.navigate('AuthorProfile', { authorId: author.id })}
                >
                  <Text style={styles.authorText}>{author?.name || t('common.unknownAuthor')}</Text>
                </TouchableOpacity>
                
                <View style={styles.statsContainer}>
                  <View style={styles.ratingContainer}>
                    <MaterialCommunityIcons name="star" size={18} color="#FFD700" />
                    <Text style={styles.ratingText}>{book.rating || '0'}</Text>
                  </View>
                  
                  <View style={styles.statsItem}>
                    <MaterialCommunityIcons name="eye" size={18} color="#ddd" />
                    <Text style={styles.statsText}>{book.viewers || '0'}</Text>
                  </View>

                  <TouchableOpacity
                    style={[hasAudio ? styles.downloadButtonWithAudio : styles.downloadButtonNoAudio]}
                    onPress={handleDownload}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="download" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.statsItem}>
                  <MaterialCommunityIcons name="book-open-page-variant" size={18} color="#ddd" />
                  <Text style={styles.statsText}>{book.total_pages} {t('book.pages')}</Text>
                </View>
              </View>
            </Animated.View>
          </LinearGradient>
        </View>
        
        {/* Action Buttons - Redesigned for better touch targets */}
        <View style={styles.actionButtonsContainer}>
          {/* Read Button */}
          <TouchableOpacity 
            style={[styles.readButton, hasAudio ? styles.readButtonWithAudio : styles.readButtonNoAudio]}
            onPress={handleReadBook}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="book-open-page-variant" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>{t('book.read')}</Text>
          </TouchableOpacity>

          {/* Listen Button - Temporarily disabled */}
            <TouchableOpacity
              style={styles.listenButton}
              onPress={() => {
                Alert.alert(t('book.listen'), t('book.comingSoon'));
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="headphones" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>{t('book.listen')}</Text>
            </TouchableOpacity>
         
        </View>

        {/* Tab Bar - Redesigned for better touch targets */}
        <View style={styles.tabBarContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'about' && styles.tabActive]}
            onPress={() => setSelectedTab('about')}
            activeOpacity={0.6}
          >
            <Text style={[styles.tabText, selectedTab === 'about' && styles.tabTextActive]}>
              {t('book.about')}
            </Text>
            {selectedTab === 'about' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'outline' && styles.tabActive]}
            onPress={() => setSelectedTab('outline')}
            activeOpacity={0.6}
          >
            <Text style={[styles.tabText, selectedTab === 'outline' && styles.tabTextActive]}>
              {t('book.outline')}
            </Text>
            {selectedTab === 'outline' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'notes' && styles.tabActive]}
            onPress={() => setSelectedTab('notes')}
            activeOpacity={0.6}
          >
            <Text style={[styles.tabText, selectedTab === 'notes' && styles.tabTextActive]}>
              {t('common.notes')}
            </Text>
            {selectedTab === 'notes' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>
        
        {/* Tab content */}
        <View style={styles.tabContent}>
          {selectedTab === 'about' && (
            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>{t('book.description')}</Text>
              <Text style={styles.descriptionText}>{book.description || t('book.noDescription')}</Text>
                
              <View style={styles.categoriesRow}>
                {book.categories?.map(cat => (
                  <Chip 
                    key={cat.id} 
                    style={styles.categoryChip} 
                    textStyle={styles.categoryChipText}
                    icon={() => cat.icon_name ? 
                      <MaterialCommunityIcons name={(cat.icon_name as any)} size={16} color="#8A2BE2" /> : 
                      <MaterialCommunityIcons name="tag" size={16} color="#8A2BE2" />
                    }
                  >
                    {cat.name}
                  </Chip>
                ))}
              </View>
              
              {/* Similar Books Section - moved before author section */}
              <View style={styles.similarBooksSection}>
                <Text style={styles.sectionTitle}>{t('book.similarBooks')}</Text>
                {similarBooks.length > 0 ? (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.similarBooksScrollView}
                  >
                    {similarBooks.map(simBook => (
                      <TouchableOpacity
                        key={simBook.id}
                        style={styles.similarBookItem}
                        onPress={() => navigation.push('BookDetail', { bookId: simBook.id.toString() })}
                      >
                        <Image
                          source={simBook.cover_url || simBook.cover_image 
                            ? { uri: simBook.cover_url || simBook.cover_image }
                            : require('../../assets/book.jpg')
                          }
                          style={styles.similarBookCover}
                          resizeMode="cover"
                          defaultSource={require('../../assets/book.jpg')}
                        />
                        <Text style={styles.similarBookTitle} numberOfLines={2}>
                          {simBook.title}
                        </Text>
                        <Text style={styles.similarBookAuthor} numberOfLines={1}>
                          {simBook.author?.name || t('common.unknownAuthor')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.noSimilarBooksText}>{t('book.noSimilarBooks')}</Text>
                )}
              </View>
              
              {author && (
                <View style={styles.authorSection}>
                  <Text style={styles.sectionTitle}>{t('book.aboutAuthor')}</Text>
                  <View style={styles.authorRow}>
                    <Image
                      source={{ uri: author.profile_image_url || 'https://via.placeholder.com/100' }}
                      style={styles.authorAvatar}
                    />
                    <View style={styles.authorInfo}>
                      <Text style={styles.authorName}>{author.name}</Text>
                      <Text style={styles.authorBio} numberOfLines={4}>
                        {author.description || t('book.noAuthorDescription')}
                      </Text>
                      <TouchableOpacity 
                        style={styles.viewAuthorButton}
                        onPress={() => navigation.navigate('AuthorProfile', { authorId: author.id })}
                      >
                        <Text style={styles.viewAuthorText}>{t('book.viewAuthor')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
          
          {selectedTab === 'outline' && (
            <View style={styles.outlineSection}>
              <Text style={styles.outlineSectionTitle}>{t('book.bookOutline')}</Text>
              <View style={styles.chaptersList}>
                <TouchableOpacity style={styles.chapterItem}>
                  <Text style={styles.chapterTime}>0:00</Text>
                  <Text style={styles.chapterTitle}>{t('book.outlineSample1')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.chapterItem}>
                  <Text style={styles.chapterTime}>1:54</Text>
                  <Text style={styles.chapterTitle}>{t('book.outlineSample2')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.chapterItem}>
                  <Text style={styles.chapterTime}>5:50</Text>
                  <Text style={styles.chapterTitle}>{t('book.outlineSample3')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {selectedTab === 'notes' && (
            <View style={styles.notesSection}>
              <View style={styles.notesSectionHeader}>
                <Text style={styles.sectionTitle}>{t('common.notes')}</Text>
                <TouchableOpacity 
                  style={styles.addNoteButton}
                  onPress={() => setShowNoteDialog(true)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                  <Text style={styles.addNoteText}>{t('book.addNote')}</Text>
                </TouchableOpacity>
              </View>
              
              {userNotes.length > 0 ? (
                <View style={styles.notesList}>
                  {userNotes.map(note => (
                    <View key={note.id} style={styles.noteItem}>
                      <View style={styles.noteContent}>
                        <Text style={styles.noteText}>{note.content}</Text>
                        <Text style={styles.noteDate}>
                          {formatDate(note.createdAt)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteNoteButton}
                        onPress={() => deleteNote(note.id)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="delete-outline" size={20} color="#888" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyNotesContainer}>
                  <MaterialCommunityIcons name="note-outline" size={40} color="#ccc" />
                  <Text style={styles.emptyNotesText}>{t('book.noNotes')}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Animated.ScrollView>
      
      {/* Bouton pour remonter en haut */}
      {showScrollToTop && (
        <TouchableOpacity 
          style={styles.scrollToTopButton}
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="arrow-up" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>

      {/* Note dialog */}
      <Portal>
        <Dialog 
          visible={showNoteDialog} 
          onDismiss={() => setShowNoteDialog(false)}
          style={styles.noteDialog}
        >
          <Dialog.Title>{t('book.addNote')}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              multiline
              numberOfLines={4}
              mode="outlined"
              placeholder={t('book.noteHint')}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowNoteDialog(false)}>{t('common.cancel')}</Button>
            <Button onPress={addNote} disabled={!noteText.trim()}>{t('common.save')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>


      
      {/* Points earned animation */}
      {showRewardAnimation && (
        <View style={styles.rewardAnimationContainer}>
          <LottieView
            ref={animationRef}
            source={require('../assets/animations/success.json')}
            autoPlay
            loop={false}
            style={styles.rewardAnimation}
          />
          <Text style={styles.pointsEarned}>+{pointsEarned} {t('common.points')}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Header Styles
  heroSection: {
    height: HEADER_HEIGHT * 0.6,
    width: '100%',
    position: 'relative',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    top: 0,
  },
  imageContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    marginRight: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  bookCover: {
    width: COVER_WIDTH * 0.7,
    height: COVER_HEIGHT * 0.7,
    borderRadius: 8,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 5,
  },
  bookTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  authorLink: {
    marginBottom: 12,
  },
  authorText: {
    fontSize: 16,
    color: '#8A2BE2',
    marginBottom: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  ratingText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 16,
  },
  ratingCount: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 2,
  },
  statsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statsText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 14,
  },
  // Fixed header
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  fixedHeaderGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  fixedHeaderTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerRightActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  
  // Actions Buttons Styles - Redesigned
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    marginHorizontal: 15,
    marginTop: -40,
    zIndex: 5,
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8A2BE2',
    paddingVertical: 15,
    borderRadius: 10,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  readButtonWithAudio: {
    flex: 1,
  },
  readButtonNoAudio: {
    flex: 2,
  },
  listenButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222A68',
    paddingVertical: 15,
    borderRadius: 10,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  downloadButtonWithAudio: {
    flex: 1,
  },
  downloadButtonNoAudio: {
    flex: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  
  // Tab Bar Styles - Redesigned
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingHorizontal: 20,
    marginVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabActive: {
    backgroundColor: 'rgba(138, 43, 226, 0.05)',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#8A2BE2',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '80%',
    height: 3,
    backgroundColor: '#8A2BE2',
    borderRadius: 3,
  },
  
  // Content Styles
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  aboutSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 15,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f0e6ff',
  },
  categoryChipText: {
    color: '#8A2BE2',
  },
  
  // Similar Books Section
  similarBooksSection: {
    marginTop: 15,
    marginBottom: 20,
  },
  similarBooksScrollView: {
    paddingVertical: 10,
  },
  similarBookItem: {
    width: 120,
    marginRight: 15,
  },
  similarBookCover: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
  },
  similarBookTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  similarBookAuthor: {
    fontSize: 12,
    color: '#666',
  },
  noSimilarBooksText: {
    fontStyle: 'italic',
    color: '#888',
    marginTop: 10,
  },
  
  // Author Section
  authorSection: {
    marginTop: 15,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  authorAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  authorBio: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
    marginBottom: 10,
  },
  viewAuthorButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f0e6ff',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  viewAuthorText: {
    color: '#8A2BE2',
    fontWeight: '500',
  },
  
  // Outline Section
  outlineSection: {
    marginTop: 10,
  },
  outlineSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  chaptersList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  chapterTime: {
    width: 45,
    fontSize: 14,
    color: '#8A2BE2',
    fontWeight: 'bold',
  },
  chapterTitle: {
    flex: 1,
    fontSize: 16,
    color: '#444',
  },
  
  // Notes Section
  notesSection: {
    marginTop: 10,
  },
  notesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8A2BE2',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  addNoteText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '500',
  },
  notesList: {
    marginTop: 10,
  },
  noteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noteContent: {
    flex: 1,
  },
  noteText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 10,
  },
  noteDate: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  deleteNoteButton: {
    padding: 10,
    marginLeft: 10,
  },
  emptyNotesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyNotesText: {
    marginTop: 10,
    color: '#888',
    fontSize: 16,
  },
  
  // Dialog styles
  noteDialog: {
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  planDialog: {
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  planDialogHeader: {
    backgroundColor: '#8A2BE2',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planDialogTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  planDialogContent: {
    paddingTop: 20,
  },
  planDialogDescription: {
    fontSize: 16,
    color: '#444',
    marginBottom: 20,
  },
  goalInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  goalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  goalInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  pagesLabel: {
    fontSize: 16,
    color: '#666',
  },
  estimatedCompletion: {
    marginTop: 10,
    fontSize: 14,
    color: '#8A2BE2',
    fontStyle: 'italic',
  },
  notesContainer: {
    marginBottom: 20,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    height: 120,
    textAlignVertical: 'top',
  },
  planDialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    marginRight: 10,
  },
  cancelButtonLabel: {
    color: '#666',
  },
  createButton: {
    backgroundColor: '#8A2BE2',
  },
  
  // Animation styles
  rewardAnimationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 100,
  },
  rewardAnimation: {
    width: 200,
    height: 200,
  },
  pointsEarned: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // Scroll to Top Button
  scrollToTopButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#8A2BE2',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 100,
  },

  // Snackbar styles
  snackbar: {
    bottom: 10,
  }
});

export default BookDetailScreen;