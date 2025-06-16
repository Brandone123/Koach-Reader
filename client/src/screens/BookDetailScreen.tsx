import React, { useState } from 'react';
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
  Platform
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
  Badge
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
import { RootStackParamList } from '../navigation/types';
import { AppDispatch } from '../store';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const COVER_ASPECT_RATIO = 1.5; // Ratio hauteur/largeur de la couverture

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
  console.log('Book categories:', book?.categories); // Debug log
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectBooksLoading);
  const readingPlan = useSelector((state) => selectBookReadingPlan(state, parseInt(bookId)));
  
  const [refreshing, setRefreshing] = useState(false);
  const [createPlanVisible, setCreatePlanVisible] = useState(false);
  const [dailyGoal, setDailyGoal] = useState('');
  const [planNotes, setPlanNotes] = useState('');
  const [selectedTab, setSelectedTab] = useState('about');

  const onRefresh = async () => {
    setRefreshing(true);
    // Rafraîchir les données si nécessaire
    setRefreshing(false);
  };
  
  const handleShare = async () => {
    if (!book) return;
    
    try {
      await Share.share({
        message: t('book.shareMessage', { title: book.title, author: book.author }),
        title: book.title,
      });
    } catch (error) {
      Alert.alert(t('common.errorText'), t('book.shareError'));
    }
  };

  const handleCreatePlan = () => {
    if (!book || !user) return;

    const goal = parseInt(dailyGoal);
    if (isNaN(goal) || goal <= 0) {
      Alert.alert(t('common.errorText'), t('readingPlan.invalidGoal'));
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header with cover image */}
        <View style={styles.headerContainer}>
          <Image 
            source={{ uri: book.cover_url || book.cover_image || 'https://via.placeholder.com/300x450' }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          
          {/* Floating action buttons */}
          <View style={styles.actionButtons}>
            <IconButton 
              icon="arrow-left" 
              size={24} 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              iconColor="#fff"
            />
            <IconButton 
              icon="share-variant" 
              size={24} 
              onPress={handleShare}
              style={styles.shareButton}
              iconColor="#fff"
            />
          </View>
          
          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradientOverlay}
          />
        </View>

        {/* Book basic info */}
        <View style={styles.contentContainer}>
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{book.title}</Text>
            <Text style={[styles.author, { color: theme.colors.secondary }]}>{book.author}</Text>
            
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
              <Text style={[styles.ratingText, { color: theme.colors.text }]}>
                {book.rating?.toFixed(1) || '4.5'} ({book.rating_count || '100'})
              </Text>
            </View>
          </View>

          {/* Quick stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="book-open-page-variant" size={20} color={theme.colors.primary} />
              <Text style={[styles.statText, { color: theme.colors.text }]}>
                {book.total_pages} {t('book.pages')}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.statText, { color: theme.colors.text }]}>
                {book.reading_time || '5h'} {t('book.readingTime')}
              </Text>
            </View>
            
            {book.publication_date && (
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
                <Text style={[styles.statText, { color: theme.colors.text }]}>
                  {formatDate(book.publication_date)}
                </Text>
              </View>
            )}
          </View>

          {/* Read/Listen buttons */}
          <View style={styles.actionButtonsContainer}>
            {book.pdf_url && (
              <Button 
                mode="contained"
                icon="book-open-variant"
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                labelStyle={styles.actionButtonLabel}
                onPress={() => navigation.navigate('ReadingSession', { 
                  bookId: book.id.toString(), 
                  planId: readingPlan?.id?.toString() as string | undefined, 
                  isEdit: true 
                })}
              >
                {t('book.readNow')}
              </Button>
            )}
            
            {book.audio_url && (
              <Button 
                mode="outlined"
                icon="headphones"
                style={styles.actionButton}
                labelStyle={[styles.actionButtonLabel, { color: theme.colors.primary }]}
                onPress={() => navigation.navigate('MediaViewer', { 
                  bookId: book.id.toString(), 
                  type: 'audio' 
                })}
              >
                {t('book.listenNow')}
              </Button>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[
                styles.tab, 
                selectedTab === 'about' && { 
                  borderBottomColor: theme.colors.primary,
                  borderBottomWidth: 2 
                }
              ]}
              onPress={() => setSelectedTab('about')}
            >
              <Text 
                style={[
                  styles.tabText, 
                  { color: theme.colors.text },
                  selectedTab === 'about' && { 
                    color: theme.colors.primary,
                    fontWeight: 'bold'
                  }
                ]}
              >
                {t('book.about')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.tab, 
                selectedTab === 'outline' && { 
                  borderBottomColor: theme.colors.primary,
                  borderBottomWidth: 2 
                }
              ]}
              onPress={() => setSelectedTab('outline')}
            >
              <Text 
                style={[
                  styles.tabText, 
                  { color: theme.colors.text },
                  selectedTab === 'outline' && { 
                    color: theme.colors.primary,
                    fontWeight: 'bold'
                  }
                ]}
              >
                {t('book.outline')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab content */}
          <View style={styles.tabContent}>
            {selectedTab === 'about' && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  {t('book.description')}
                </Text>
                <Text style={[styles.description, { color: theme.colors.text }]}>
                  {book.description || t('book.noDescription')}
                </Text>
                
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  {t('book.details')}
                </Text>
                
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="book-open-page-variant" size={24} color={theme.colors.primary} />
                    <Text style={[styles.detailLabel, { color: theme.colors.text }]}>
                      {t('book.totalPages')}
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                      {book.total_pages}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="translate" size={24} color={theme.colors.primary} />
                    <Text style={[styles.detailLabel, { color: theme.colors.text }]}>
                      {t('book.language')}
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                      {book.language || t('common.notSpecified')}
                    </Text>
                  </View>
                  
                  {book.isbn && (
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name="barcode" size={24} color={theme.colors.primary} />
                      <Text style={[styles.detailLabel, { color: theme.colors.text }]}>
                        ISBN
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                        {book.isbn}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="tag" size={24} color={theme.colors.primary} />
                    <Text style={[styles.detailLabel, { color: theme.colors.text }]}>
                      {t('book.category')}
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                      {book.categories?.[0]?.[0]?.name || t('common.notSpecified')}
                    </Text>
                  </View>
                </View>
              </>
            )}
            
            {selectedTab === 'outline' && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  {t('book.outline')}
                </Text>
                {bookOutline.map((item, index) => (
                  <View key={index} style={styles.outlineItem}>
                    <Text style={[styles.outlineTime, { color: theme.colors.primary }]}>
                      {item.time}
                    </Text>
                    <Text style={[styles.outlineTitle, { color: theme.colors.text }]}>
                      {item.title}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Reading plan section - fixed at bottom */}
      <View style={[styles.readingPlanContainer, { backgroundColor: theme.colors.surface }]}>
        {readingPlan ? (
          <>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: theme.colors.text }]}>
                {t('readingPlan.yourProgress')}
              </Text>
              <Text style={[styles.progressPercentage, { color: theme.colors.primary }]}>
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
            
            <View style={styles.progressDetails}>
              <View style={styles.progressDetail}>
                <Text style={[styles.progressDetailLabel, { color: theme.colors.text }]}>
                  {t('readingPlan.pagesRead')}
                </Text>
                <Text style={[styles.progressDetailValue, { color: theme.colors.text }]}>
                  {readingPlan.current_page}/{book.total_pages}
                </Text>
              </View>
              
              <View style={styles.progressDetail}>
                <Text style={[styles.progressDetailLabel, { color: theme.colors.text }]}>
                  {t('readingPlan.dailyGoal')}
                </Text>
                <Text style={[styles.progressDetailValue, { color: theme.colors.text }]}>
                  {readingPlan.daily_goal} {t('readingPlan.pagesPerDay')}
                </Text>
              </View>
            </View>
            
            <Button 
              mode="contained"
              onPress={() => navigation.navigate('ReadingSession', { 
                bookId: book.id.toString(), 
                planId: readingPlan.id.toString(), 
                isEdit: true 
              })}
              style={[styles.progressButton, { backgroundColor: theme.colors.primary }]}
            >
              {t('readingPlan.updateProgress')}
            </Button>
          </>
        ) : (
          <>
            <Text style={[styles.planTitle, { color: theme.colors.text }]}>
              {t('readingPlan.createPlan')}
            </Text>
            <Text style={[styles.planDescription, { color: theme.colors.secondary }]}>
              {t('readingPlan.createDescription')}
            </Text>
            <Button 
              mode="contained"
              onPress={() => setCreatePlanVisible(true)}
              style={[styles.planButton, { backgroundColor: theme.colors.primary }]}
              icon="book-open-variant"
            >
              {t('readingPlan.startPlan')}
            </Button>
          </>
        )}
      </View>

      {/* Create plan dialog */}
      <Portal>
        <Dialog 
          visible={createPlanVisible} 
          onDismiss={() => setCreatePlanVisible(false)}
          style={{ backgroundColor: theme.colors.background }}
        >
          <Dialog.Title style={{ color: theme.colors.text }}>
            {t('readingPlan.createPlan')}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={t('readingPlan.dailyGoal')}
              value={dailyGoal}
              onChangeText={setDailyGoal}
              keyboardType="numeric"
              style={styles.input}
              theme={{ colors: { primary: theme.colors.primary } }}
            />
            <TextInput
              label={t('readingPlan.notes')}
              value={planNotes}
              onChangeText={setPlanNotes}
              multiline
              numberOfLines={3}
              style={styles.input}
              theme={{ colors: { primary: theme.colors.primary } }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setCreatePlanVisible(false)}
              textColor={theme.colors.text}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onPress={handleCreatePlan}
              textColor={theme.colors.primary}
            >
              {t('common.create')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 180, // Space for the fixed reading plan section
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    height: width * 0.8, // Adjust based on your preference
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  actionButtons: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 2,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  shareButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  contentContainer: {
    paddingHorizontal: 20,
    marginTop: -40,
  },
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  author: {
    fontSize: 18,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    marginLeft: 4,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    minWidth: '30%',
  },
  statText: {
    marginLeft: 8,
    fontSize: 14,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  actionButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 16,
  },
  tabContent: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
  },
  detailLabel: {
    fontSize: 14,
    marginTop: 8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  outlineItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  outlineTime: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 50,
    marginRight: 10,
  },
  outlineTitle: {
    fontSize: 16,
    flex: 1,
  },
  readingPlanContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
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
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressDetail: {
    alignItems: 'center',
  },
  progressDetailLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  progressDetailValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressButton: {
    borderRadius: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  planButton: {
    borderRadius: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
});

export default BookDetailScreen;