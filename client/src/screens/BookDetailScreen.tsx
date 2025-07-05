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
  StatusBar
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
  Snackbar
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
import { AppDispatch } from '../store';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Author } from '../types/author';

const { width, height } = Dimensions.get('window');
const COVER_HEIGHT = height * 0.35;
const COVER_WIDTH = width * 0.8;
const HEADER_HEIGHT = width * 0.5;

type BookDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BookDetail'>;
type BookDetailScreenRouteProp = RouteProp<RootStackParamList, 'BookDetail'>;

interface BookDetailScreenProps {
  navigation: BookDetailScreenNavigationProp;
  route: BookDetailScreenRouteProp;
}

const BookDetailScreen: React.FC<BookDetailScreenProps> = ({ navigation, route }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { bookId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  
  const books = useSelector(selectBooks);
  const book = books.find(b => b.id === parseInt(bookId));
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectBooksLoading);
  const readingPlan = useSelector((state) => selectBookReadingPlan(state, parseInt(bookId)));
  
  const [refreshing, setRefreshing] = useState(false);
  const [createPlanVisible, setCreatePlanVisible] = useState(false);
  const [dailyGoal, setDailyGoal] = useState('');
  const [planNotes, setPlanNotes] = useState('');
  const [selectedTab, setSelectedTab] = useState<'about' | 'outline' | 'more'>('about');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Pour sticky actions/tabs
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Hide the status bar for a more immersive experience
    StatusBar.setBarStyle('light-content');
    return () => {
      StatusBar.setBarStyle('default');
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Rafraîchir les données si nécessaire
    setRefreshing(false);
  };
  
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
    if (!readingPlan) {
      setSnackbarMessage(t('readingPlan.needPlanFirst'));
      setSnackbarVisible(true);
      setCreatePlanVisible(true);
      return;
    }
    
    navigation.navigate('ReadingSession', { bookId: book!.id.toString() });
  };

  const handleListenBook = () => {
    if (!readingPlan) {
      setSnackbarMessage(t('readingPlan.needPlanFirst'));
      setSnackbarVisible(true);
      setCreatePlanVisible(true);
      return;
    }
    
    navigation.navigate('MediaViewer', { bookId: book!.id.toString(), type: 'audio' });
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

  if (isLoading || !book) {
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar translucent backgroundColor="transparent" />
      
      {/* Back button and share/favorite icons */}
      <View style={styles.headerActions}>
        <IconButton
          icon="arrow-left"
          size={28}
          iconColor="#fff"
          style={styles.headerActionButton}
          onPress={() => navigation.goBack()}
        />
        <View style={styles.headerRightActions}>
          <IconButton
            icon="share-variant"
            size={24}
            iconColor="#fff"
            style={styles.headerActionButton}
            onPress={handleShare}
          />
          <IconButton
            icon="heart-outline"
            size={24}
            iconColor="#fff"
            style={styles.headerActionButton}
            onPress={() => {}}
          />
        </View>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Book cover and basic info */}
        <View style={styles.coverSection}>
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.7)']}
            style={styles.coverGradient}
          >
            <Image 
              source={{ uri: book.cover_url || book.cover_image || 'https://via.placeholder.com/400x600' }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          </LinearGradient>
          
          <View style={styles.bookInfoOverlay}>
            <Text style={styles.bookTitle}>{book.title}</Text>
            <Text style={styles.authorName}>
              {author?.name || t('common.unknownAuthor')}
            </Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="book-open-page-variant" size={18} color="#fff" />
                <Text style={styles.statText}>{book.total_pages} {t('book.pages')}</Text>
              </View>
              {book.reading_time && (
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color="#fff" />
                  <Text style={styles.statText}>{book.reading_time}</Text>
                </View>
              )}
              {book.language && (
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="translate" size={18} color="#fff" />
                  <Text style={styles.statText}>{book.language}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        {/* Tab navigation */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'about' && styles.tabActive]}
            onPress={() => setSelectedTab('about')}
          >
            <Text style={[styles.tabText, selectedTab === 'about' && styles.tabTextActive]}>
              {t('book.about')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'outline' && styles.tabActive]}
            onPress={() => setSelectedTab('outline')}
          >
            <Text style={[styles.tabText, selectedTab === 'outline' && styles.tabTextActive]}>
              {t('book.outline')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'more' && styles.tabActive]}
            onPress={() => setSelectedTab('more')}
          >
            <Text style={[styles.tabText, selectedTab === 'more' && styles.tabTextActive]}>
              {t('book.moreLikeThis')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Tab content */}
        <View style={styles.tabContent}>
          {selectedTab === 'about' && (
            <>
              <Surface style={styles.descriptionCard}>
                <Text style={styles.sectionTitle}>{t('book.description')}</Text>
                <Text style={styles.bookDescription}>{book.description || t('book.noDescription')}</Text>
                
                <View style={styles.categoriesRow}>
                  {book.categories?.map(cat => (
                    <Chip 
                      key={cat.id} 
                      style={styles.categoryChip} 
                      textStyle={styles.categoryChipText}
                      icon={() => <MaterialCommunityIcons name={cat.icon_name || 'tag'} size={16} color={theme.colors.primary} />}
                    >
                      {cat.name}
                    </Chip>
                  ))}
                </View>
              </Surface>
              
              {/* Author section */}
              {author && (
                <Surface style={styles.authorCard}>
                  <Text style={styles.sectionTitle}>{t('book.meetAuthor')}</Text>
                  <View style={styles.authorRow}>
                    <Avatar.Image
                      size={64}
                      source={{ uri: author.profile_image_url || 'https://via.placeholder.com/64' }}
                      style={styles.authorAvatar}
                    />
                    <View style={styles.authorInfo}>
                      <Text style={styles.authorCardName}>{author.name}</Text>
                      <Text style={styles.authorDescription} numberOfLines={3}>
                        {author.description || t('book.noAuthorDescription')}
                      </Text>
                      <Button
                        mode="text"
                        onPress={() => navigation.navigate('AuthorProfile', { authorId: author.id })}
                        style={styles.authorProfileButton}
                        labelStyle={{ color: theme.colors.primary }}
                      >
                        {t('book.authorProfile')}
                      </Button>
                    </View>
                  </View>
                </Surface>
              )}
            </>
          )}
          
          {selectedTab === 'outline' && (
            <Surface style={styles.outlineCard}>
              <Text style={styles.sectionTitle}>{t('book.outline')}</Text>
              {bookOutline.length > 0 ? (
                bookOutline.map((item, index) => (
                  <View key={index} style={styles.outlineItem}>
                    <Text style={styles.outlineTime}>{item.time}</Text>
                    <Text style={styles.outlineTitle}>{item.title}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyMessage}>{t('book.noOutline')}</Text>
              )}
            </Surface>
          )}
          
          {selectedTab === 'more' && (
            <Surface style={styles.similarBooksCard}>
              <Text style={styles.sectionTitle}>{t('book.moreLikeThis')}</Text>
              {similarBooks.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.similarBooksScroll}>
                  {similarBooks.map(simBook => (
                    <TouchableOpacity
                      key={simBook.id}
                      style={styles.similarBookCard}
                      onPress={() => navigation.push('BookDetail', { bookId: simBook.id.toString() })}
                    >
                      <Image
                        source={{ uri: simBook.cover_url || simBook.cover_image || 'https://via.placeholder.com/100x150' }}
                        style={styles.similarBookImage}
                      />
                      <Text style={styles.similarBookTitle} numberOfLines={2}>{simBook.title}</Text>
                      <Text style={styles.similarBookAuthor} numberOfLines={1}>
                        {simBook.author?.name || t('common.unknownAuthor')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.emptyMessage}>{t('book.noSimilarBooks')}</Text>
              )}
            </Surface>
          )}
        </View>
      </ScrollView>

      {/* Reading plan section - fixed at bottom */}
      <Surface style={styles.readingPlanContainer} elevation={4}>
        {readingPlan ? (
          <>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>
                {t('readingPlan.yourProgress')}
              </Text>
              <Text style={styles.progressPercentage}>
                {Math.round((readingPlan.current_page / book.total_pages) * 100)}%
              </Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(readingPlan.current_page / book.total_pages) * 100}%`,
                    backgroundColor: theme.colors.primary
                  }
                ]} 
              />
            </View>
            
            <View style={styles.readButtonsContainer}>
              {book.pdf_url && (
                <Button
                  mode="contained"
                  icon="book-open-variant"
                  style={[styles.readButton, { backgroundColor: theme.colors.primary }]}
                  contentStyle={styles.buttonContent}
                  onPress={handleReadBook}
                >
                  {t('book.continueReading')}
                </Button>
              )}
              {book.audio_url && (
                <Button
                  mode="outlined"
                  icon="headphones"
                  style={styles.audioButton}
                  contentStyle={styles.buttonContent}
                  textColor={theme.colors.primary}
                  onPress={handleListenBook}
                >
                  {t('book.listen')}
                </Button>
              )}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.planTitle}>
              {t('readingPlan.createPlan')}
            </Text>
            <Text style={styles.planDescription}>
              {t('readingPlan.createDescription')}
            </Text>
            <Button 
              mode="contained"
              onPress={() => setCreatePlanVisible(true)}
              style={[styles.startPlanButton, { backgroundColor: theme.colors.primary }]}
              icon="book-open-variant"
            >
              {t('readingPlan.startPlan')}
            </Button>
          </>
        )}
      </Surface>

      {/* Create plan dialog */}
      <Portal>
        <Dialog 
          visible={createPlanVisible} 
          onDismiss={() => setCreatePlanVisible(false)}
          style={styles.planDialog}
        >
          <View style={styles.planDialogHeader}>
            <MaterialCommunityIcons name="book-clock" size={32} color="#fff" />
            <Text style={styles.planDialogTitle}>{t('readingPlan.createPlan')}</Text>
          </View>
          
          <Dialog.Content style={styles.planDialogContent}>
            <Text style={styles.planDialogDescription}>
              {t('readingPlan.dailyGoalExplanation', { pages: book?.total_pages || 0 })}
            </Text>
            
            <View style={styles.goalInputContainer}>
              <Text style={styles.inputLabel}>{t('readingPlan.dailyGoal')}</Text>
              <View style={styles.goalInputWrapper}>
                <TextInput
                  value={dailyGoal}
                  onChangeText={setDailyGoal}
                  keyboardType="numeric"
                  style={styles.goalInput}
                  placeholder="10"
                  placeholderTextColor="#999"
                />
                <Text style={styles.pagesLabel}>{t('book.pages')}</Text>
              </View>
              <Text style={styles.estimatedCompletion}>
                {dailyGoal && !isNaN(parseInt(dailyGoal)) && parseInt(dailyGoal) > 0 ? (
                  t('readingPlan.estimatedCompletion', { 
                    days: Math.ceil((book?.total_pages || 0) / parseInt(dailyGoal)) 
                  })
                ) : ''}
              </Text>
            </View>
            
            <View style={styles.notesContainer}>
              <Text style={styles.inputLabel}>{t('readingPlan.notes')}</Text>
              <TextInput
                value={planNotes}
                onChangeText={setPlanNotes}
                multiline
                numberOfLines={3}
                style={styles.notesInput}
                placeholder={t('readingPlan.notesPlaceholder')}
                placeholderTextColor="#999"
              />
            </View>
          </Dialog.Content>
          
          <View style={styles.planDialogActions}>
            <Button 
              onPress={() => setCreatePlanVisible(false)}
              style={styles.cancelButton}
              labelStyle={styles.cancelButtonLabel}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onPress={handleCreatePlan}
              mode="contained"
              style={styles.createButton}
            >
              {t('common.create')}
            </Button>
          </View>
        </Dialog>
      </Portal>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
        action={{
          label: t('common.ok'),
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    zIndex: 10,
  },
  headerActionButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerRightActions: {
    flexDirection: 'row',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  coverSection: {
    height: COVER_HEIGHT,
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  coverGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: COVER_WIDTH,
    height: COVER_HEIGHT * 0.8,
    borderRadius: 12,
  },
  bookInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
  },
  bookTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  authorName: {
    fontSize: 16,
    color: '#ddd',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    color: '#fff',
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#8A2BE2',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
  },
  tabTextActive: {
    color: '#8A2BE2',
    fontWeight: 'bold',
  },
  tabContent: {
    padding: 16,
  },
  descriptionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bookDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 16,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f3e8ff',
  },
  categoryChipText: {
    color: '#8A2BE2',
  },
  authorCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    marginRight: 16,
    backgroundColor: '#f3e8ff',
  },
  authorInfo: {
    flex: 1,
  },
  authorCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  authorDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  authorProfileButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  outlineCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  outlineItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  outlineTime: {
    width: 60,
    fontSize: 14,
    color: '#8A2BE2',
    fontWeight: 'bold',
  },
  outlineTitle: {
    flex: 1,
    fontSize: 16,
  },
  similarBooksCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  similarBooksScroll: {
    marginTop: 12,
  },
  similarBookCard: {
    width: 120,
    marginRight: 16,
    alignItems: 'center',
  },
  similarBookImage: {
    width: 100,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  similarBookTitle: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  similarBookAuthor: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyMessage: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  readingPlanContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8A2BE2',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  readButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  readButton: {
    flex: 1,
    borderRadius: 8,
  },
  audioButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8A2BE2',
  },
  buttonContent: {
    paddingVertical: 4,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  planDescription: {
    fontSize: 14,
    marginBottom: 16,
    color: '#666',
  },
  startPlanButton: {
    borderRadius: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  dialogDescription: {
    marginBottom: 16,
    color: '#666',
  },
  snackbar: {
    marginBottom: 100,
  },
  planDialog: {
    backgroundColor: '#333',
  },
  planDialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#444',
  },
  planDialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
  },
  planDialogContent: {
    padding: 16,
  },
  planDialogDescription: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  goalInputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  goalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalInput: {
    flex: 1,
    padding: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    color: '#fff',
  },
  pagesLabel: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
  },
  estimatedCompletion: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 8,
  },
  notesContainer: {
    marginBottom: 16,
  },
  notesInput: {
    padding: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    color: '#fff',
    textAlignVertical: 'top',
  },
  planDialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonLabel: {
    color: '#fff',
  },
  createButton: {
    backgroundColor: '#8A2BE2',
  },
});

export default BookDetailScreen;