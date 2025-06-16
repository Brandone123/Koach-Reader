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
  Platform,
  Animated as RNAnimated // Keep React Native's Animated for other uses if needed
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
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
  // Portal, Dialog, TextInput, // Removed for new modal
  Surface,
  Badge
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { selectBooks, selectBooksLoading, fetchBookById } from '../slices/booksSlice'; // fetchBookById might be needed if plan creation affects book details indirectly
import { selectUser } from '../slices/authSlice';
import { 
  // createReadingPlan, // This will be handled by the modal
  selectBookReadingPlan,
  updateReadingProgress,
  fetchReadingPlansForBook // Assuming an action to refresh plans for the book
} from '../slices/readingPlansSlice';
import CreatePlanModal from '../components/CreatePlanModal'; // Import the new modal
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { AppDispatch } from '../store';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import LoadingAnimation from '../components/LoadingAnimation'; // Import the new component
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height: screenHeight } = Dimensions.get('window'); // Added screenHeight
const HEADER_IMAGE_HEIGHT = width * 0.9; // Adjusted for a larger, more impactful header
const TAB_BAR_HEIGHT = 48; // Standard tab bar height, assuming this for calculations

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
  const [isCreatePlanModalVisible, setIsCreatePlanModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'about' | 'outline'>('about'); // Explicitly type selectedTab
  const [tabLayouts, setTabLayouts] = useState<{ [key: string]: { x: number, width: number } }>({});

  // Animation values for parallax header and tab indicator
  const scrollY = useSharedValue(0);
  const activeTabIndicatorPos = useSharedValue(0); // For animated tab underline X position
  const activeTabIndicatorWidth = useSharedValue(0); // For animated tab underline width

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Animated style for the header image (parallax)
  const animatedHeaderStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-HEADER_IMAGE_HEIGHT, 0], // Input range: from pulling down to initial position
      [1.5, 1], // Output range: zoom out when pulling down, normal at scroll 0
      Extrapolate.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_IMAGE_HEIGHT], // Input range: from initial position to scrolling down
      [0, HEADER_IMAGE_HEIGHT * 0.6], // Output range: image moves slower than scroll for parallax
      Extrapolate.CLAMP
    );
    return {
      height: HEADER_IMAGE_HEIGHT, // Keep height fixed, or animate it if desired
      transform: [{ translateY }, { scale }],
    };
  });

  // Animated style for the tab indicator
  const animatedTabIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: activeTabIndicatorPos.value }],
      width: activeTabIndicatorWidth.value,
      height: 3, // Thickness of the underline
      backgroundColor: theme.colors.primary, // Color of the underline
      position: 'absolute',
      bottom: 0, // Align to the bottom of the tab container
      borderRadius: 1.5,
    };
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // Consider re-fetching book details and reading plan
    if (book) {
      // dispatch(fetchBookById(book.id.toString())); // If needed
      dispatch(fetchReadingPlansForBook(book.id.toString())); // Refresh plans
    }
    setRefreshing(false);
  };
  
  const handleShare = async () => {
    if (!book) return;
    
    try {
      await Share.share({
        message: t('book.shareMessage', { title: book.title, author: book.author }),
        // title: book.title, // Title is iOS only, message is more universal
      });
    } catch (error) {
      // Alert.alert(t('common.errorText'), t('book.shareError'));
      console.error("Share error", error);
    }
  };

  const handlePlanCreated = (newPlan: any) => {
    setIsCreatePlanModalVisible(false);
    // The createReadingPlan thunk already updates the plans array in Redux.
    // The component will re-render due to useSelector picking up the change.
    // So, an explicit re-fetch here is likely not needed.
    // if (book) {
    //   dispatch(fetchReadingPlansForBook(book.id.toString()));
    // }
    // console.log("Plan created, modal closed, UI should update via Redux state change.", newPlan);
    // Optionally, navigate to the plan details or show a success message
    // Alert.alert(t('readingPlan.success.title'), t('readingPlan.success.message'));
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
    // return (
    //   <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
    //     <ActivityIndicator size="large" color={theme.colors.primary} />
    //   </View>
    // );
    return <LoadingAnimation />; // Replace ActivityIndicator with Lottie animation
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header components: Image container (animated) and Static content (buttons, gradient) */}
      <Animated.View style={[styles.headerImageContainer, animatedHeaderStyle]}>
        <Animated.Image
          source={{ uri: book.cover_url || book.cover_image || 'https://via.placeholder.com/400x600' }} // Example placeholder
          style={styles.coverImage}
          resizeMode="cover"
        />
      </Animated.View>

      <View style={styles.headerStaticOverlay}>
        <View style={styles.actionButtons}>
          <IconButton
            icon="arrow-left"
            size={28}
            onPress={() => navigation.goBack()}
            style={styles.iconButtonWithBackground}
            iconColor={theme.colors.onPrimary} // Ensure high contrast
          />
          <IconButton
            icon="share-variant"
            size={28}
            onPress={handleShare}
            style={styles.iconButtonWithBackground}
            iconColor={theme.colors.onPrimary} // Ensure high contrast
          />
        </View>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.9)']} // Adjusted gradient
          style={styles.gradientOverlay}
        />
      </View>

      <Animated.ScrollView
        contentContainerStyle={[styles.scrollContainer, {paddingTop: HEADER_IMAGE_HEIGHT}]} // Content starts below header
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            progressViewOffset={HEADER_IMAGE_HEIGHT / 2} // Adjust offset if needed
          />
        }
      >
        {/* Book basic info */}
        {/* This View effectively starts below the Header Image Height due to paddingTop on ScrollView */}
        <View style={styles.contentContainer}>
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>{book.title}</Text>
            <Text style={[styles.author, { color: theme.colors.secondary }]}>{book.author}</Text>
            
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
              <Text style={[styles.ratingText, { color: theme.colors.onBackground }]}>
                {book.rating?.toFixed(1) || '4.5'} ({book.rating_count || '100'})
              </Text>
            </View>
          </View>

          {/* Quick stats - Redesigned */}
          <View style={styles.quickStatsContainer}>
            <View style={[styles.statChip, {backgroundColor: theme.colors.surfaceVariant}]}>
              <MaterialCommunityIcons name="book-open-page-variant-outline" size={22} color={theme.colors.primary} />
              <Text style={[styles.statChipValue, { color: theme.colors.onSurfaceVariant }]}>{book.total_pages}</Text>
              <Text style={[styles.statChipLabel, { color: theme.colors.onSurfaceVariant }]}>{t('book.pages')}</Text>
            </View>
            
            <View style={[styles.statChip, {backgroundColor: theme.colors.surfaceVariant}]}>
              <MaterialCommunityIcons name="clock-time-eight-outline" size={22} color={theme.colors.primary} />
              <Text style={[styles.statChipValue, { color: theme.colors.onSurfaceVariant }]}>{book.reading_time || 'N/A'}</Text>
              <Text style={[styles.statChipLabel, { color: theme.colors.onSurfaceVariant }]}>{t('book.readingTime')}</Text>
            </View>
            
            {book.publication_date && (
              <View style={[styles.statChip, {backgroundColor: theme.colors.surfaceVariant}]}>
                <MaterialCommunityIcons name="calendar-month-outline" size={22} color={theme.colors.primary} />
                {/* Replacing full date with year for brevity in chip */}
                <Text style={[styles.statChipValue, { color: theme.colors.onSurfaceVariant }]}>{new Date(book.publication_date).getFullYear()}</Text>
                <Text style={[styles.statChipLabel, { color: theme.colors.onSurfaceVariant }]}>{t('book.publishedYear')}</Text>
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

          {/* Tabs - Redesigned */}
          <View style={styles.tabBarContainer}>
            <View style={styles.tabContainerRow}>
              {(['about', 'outline'] as const).map((tabName) => ( // Ensure tabName is typed correctly
                <TouchableOpacity
                  key={tabName}
                  style={styles.tab}
                  onPress={() => {
                    setSelectedTab(tabName);
                    const layout = tabLayouts[tabName];
                    if (layout) {
                      activeTabIndicatorPos.value = layout.x;
                      activeTabIndicatorWidth.value = layout.width;
                    }
                  }}
                  onLayout={(event) => {
                    const { x, width } = event.nativeEvent.layout;
                    setTabLayouts(prev => ({ ...prev, [tabName]: { x, width } }));
                    // Set initial position for the first tab or when selectedTab's layout is measured
                    if (tabName === selectedTab ) {
                        activeTabIndicatorPos.value = x; // Use reanimated's withTiming for smooth transition if preferred
                        activeTabIndicatorWidth.value = width;
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: selectedTab === tabName ? theme.colors.primary : theme.colors.onSurfaceVariant },
                      selectedTab === tabName && styles.activeTabText, // Apply active styles
                    ]}
                  >
                    {t(tabName === 'about' ? 'book.about' : 'book.outline')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Animated.View style={[styles.activeTabIndicator, animatedTabIndicatorStyle]} />
          </View>

          {/* Tab content */}
          <View style={styles.tabContent}>
            {selectedTab === 'about' && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                  {t('book.description')}
                </Text>
                <Text style={[styles.description, { color: theme.colors.onBackground }]}>
                  {book.description || t('book.noDescription')}
                </Text>
                
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                  {t('book.details')}
                </Text>
                
                {/* Details Section - Redesigned */}
                <View style={styles.detailsContainer}>
                  <View style={styles.detailColumn}>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="book-open-page-variant-outline" size={20} color={theme.colors.primary} style={styles.detailIcon} />
                      <View style={styles.detailTextContainer}>
                        <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>{t('book.totalPages')}</Text>
                        <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>{book.total_pages}</Text>
                      </View>
                    </View>
                    {book.isbn && (
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="barcode-scan" size={20} color={theme.colors.primary} style={styles.detailIcon} />
                        <View style={styles.detailTextContainer}>
                          <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>ISBN</Text>
                          <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>{book.isbn}</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  <View style={styles.detailColumn}>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="translate" size={20} color={theme.colors.primary} style={styles.detailIcon} />
                      <View style={styles.detailTextContainer}>
                        <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>{t('book.language')}</Text>
                        <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>{book.language || t('common.notSpecified')}</Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="tag-outline" size={20} color={theme.colors.primary} style={styles.detailIcon} />
                       <View style={styles.detailTextContainer}>
                        <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>{t('book.category')}</Text>
                        <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                          {book.categories?.[0]?.[0]?.name || t('common.notSpecified')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </>
            )}
            
            {selectedTab === 'outline' && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                  {t('book.outline')}
                </Text>
                {bookOutline.map((item, index) => (
                  <View key={index} style={styles.outlineItem}>
                    <Text style={[styles.outlineTime, { color: theme.colors.primary }]}>
                      {item.time}
                    </Text>
                    <Text style={[styles.outlineTitle, { color: theme.colors.onBackground }]}>
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
              <Text style={[styles.progressTitle, { color: theme.colors.onSurface }]}>
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
                <Text style={[styles.progressDetailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  {t('readingPlan.pagesRead')}
                </Text>
                <Text style={[styles.progressDetailValue, { color: theme.colors.onSurface }]}>
                  {readingPlan.current_page}/{book.total_pages}
                </Text>
              </View>
              
              <View style={styles.progressDetail}>
                <Text style={[styles.progressDetailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  {t('readingPlan.dailyGoal')}
                </Text>
                <Text style={[styles.progressDetailValue, { color: theme.colors.onSurface }]}>
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
            <Text style={[styles.planTitle, { color: theme.colors.onSurface }]}>
              {t('readingPlan.createPlan')}
            </Text>
            <Text style={[styles.planDescription, { color: theme.colors.onSurfaceVariant }]}>
              {t('readingPlan.createDescription')}
            </Text>
            <Button 
              mode="contained"
              onPress={() => setIsCreatePlanModalVisible(true)} // Open new modal
              style={[styles.planButton, { backgroundColor: theme.colors.primary }]}
              icon="calendar-plus" // Changed icon to be more plan-oriented
            >
              {t('readingPlan.startPlan')}
            </Button>
          </>
        )}
      </View>

      {/* Create Plan Modal */}
      {book && (
        <CreatePlanModal
          visible={isCreatePlanModalVisible}
          onClose={() => setIsCreatePlanModalVisible(false)}
          bookId={book.id.toString()}
          bookTitle={book.title}
          totalPages={book.total_pages}
          onPlanCreated={handlePlanCreated}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    // paddingTop is now HEADER_IMAGE_HEIGHT
    paddingBottom: 180,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImageContainer: { // Contains the parallaxing image
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_IMAGE_HEIGHT, // Initial height
    zIndex: 0,
  },
  coverImage: { // The Animated.Image itself
    width: '100%',
    height: '100%',
  },
  headerStaticOverlay: { // For elements that stay on top of the image but don't parallax
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_IMAGE_HEIGHT,
    zIndex: 1, // Above the image
    justifyContent: 'space-between', // Pushes action buttons to top, gradient to bottom
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 30, // Adjusted for status bar
  },
  iconButtonWithBackground: { // Style for icon buttons on image
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20, // Make them circular
  },
  gradientOverlay: {
    height: HEADER_IMAGE_HEIGHT * 0.4, // Covers bottom part of the image
    justifyContent: 'flex-end',
  },
  contentContainer: { // Contains all content BELOW the header area
    paddingHorizontal: 20,
    // marginTop: HEADER_IMAGE_HEIGHT, // This is handled by paddingTop of ScrollView now
    backgroundColor: theme.colors.background, // Important for content to not be transparent over image
    borderTopLeftRadius: 20, // Optional: for a card effect of content area
    borderTopRightRadius: 20, // Optional
    minHeight: screenHeight - TAB_BAR_HEIGHT - (Platform.OS === 'ios' ? 50 : 30) + HEADER_IMAGE_HEIGHT, // ensure it's scrollable enough
    paddingTop: 20, // Internal padding for the content itself
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
  quickStatsContainer: { // Renamed from quickStats
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribute chips evenly
    marginBottom: 24,
    flexWrap: 'nowrap', // Ensure they stay in one line if possible, or wrap if too many
  },
  statChip: {
    alignItems: 'center',
    paddingVertical: 10, // Adjusted padding
    paddingHorizontal: 8,  // Adjusted padding
    borderRadius: 16,
    minWidth: (width / 3) - 24, // Ensure 3 chips fit with margins
    marginHorizontal: 4, // Reduced margin
    elevation: 1, // Softer shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  statChipValue: {
    fontSize: 18, // Slightly larger value
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statChipLabel: {
    fontSize: 11, // Smaller label
    textTransform: 'uppercase',
    color: theme.colors.onSurfaceVariant, // Ensure this is themed
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
  tabBarContainer: {
    marginBottom: 16,
    height: TAB_BAR_HEIGHT, // Defined constant
    borderBottomWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  tabContainerRow: { // Holds the touchable tabs in a row
    flexDirection: 'row',
    flex: 1,
  },
  tab: { // Individual touchable tab item
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10, // Adjusted padding
  },
  tabText: {
    fontSize: 15, // Adjusted font size
    fontWeight: '500',
    textTransform: 'uppercase', // Common styling for tabs
  },
  activeTabText: { // Style for the active tab's text
    fontWeight: 'bold',
    color: theme.colors.primary, // Ensure active tab text color is primary
  },
  activeTabIndicator: { // The animated underline
    // height, backgroundColor, position, bottom, borderRadius are now in animatedTabIndicatorStyle
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
  detailsContainer: { // Replaces detailsGrid
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailColumn: { // Each column takes roughly half the width
    width: '48%',
  },
  detailRow: { // Each item within a column (icon + text)
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingVertical: 4, // Add some vertical padding for spacing
  },
  detailIcon: {
    marginRight: 10,
    marginTop: 3, // Fine-tune vertical alignment with text
  },
  detailTextContainer: { // Groups label and value
    flex: 1, // Allows text to wrap if needed
  },
  detailLabel: {
    fontSize: 13,
    marginBottom: 3, // Space between label and value
    color: theme.colors.onSurfaceVariant, // Use theme color
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.onSurface, // Use theme color
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
  // input style was used by old dialog, can be removed if not used elsewhere
  // input: {
  //   marginBottom: 16,
  //   backgroundColor: 'transparent',
  // },
});

export default BookDetailScreen;