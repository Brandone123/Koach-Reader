import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Chip, 
  Button, 
  Searchbar,
  ProgressBar,
  Divider,
  Avatar,
  useTheme
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchBooks, 
  selectBooks, 
  selectBooksLoading 
} from '../slices/booksSlice';
import { 
  fetchReadingPlans, 
  selectReadingPlans, 
  selectReadingPlansLoading 
} from '../slices/readingPlansSlice';
import { selectUser } from '../slices/authSlice';
import { 
  fetchFreeQuarterlyBooks, 
  selectFreeQuarterlyBooks, 
  selectFreeQuarterlyBooksLoading 
} from '../slices/freeQuarterlyBooksSlice';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { AppDispatch } from '../store';
import { Book } from '../slices/booksSlice';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from "expo-linear-gradient";
import FreeQuarterlyBooksSection from '../components/FreeQuarterlyBooksSection';

// Define interface for User to have name property
interface ExtendedUser {
  name?: string;
  preferences?: {
    preferredCategories?: string[];
  };
  isPremium?: boolean;
}

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

// Define categories for books
const categories = [
  { id: 'all', name: 'All Books', icon: 'book-open-variant' },
  { id: 'bible_studies', name: 'Bible et études bibliques', icon: 'book-open-variant' },
  { id: 'theology', name: 'Théologie et doctrine', icon: 'book-cross' },
  { id: 'spirituality', name: 'Spiritualité et vie chrétienne', icon: 'candle' },
  { id: 'jesus', name: 'Livres sur Jésus Christ', icon: 'cross' },
  { id: 'evangelism', name: 'Évangélisation et mission', icon: 'earth' },
  { id: 'marriage_family', name: 'Mariage et famille', icon: 'account-group' },
  { id: 'youth', name: 'Jeunesse et enfants', icon: 'human-child' },
  { id: 'testimonies', name: 'Témoignages et biographies', icon: 'account-voice' },
  { id: 'prophecy', name: 'Prophétie et fin des temps', icon: 'clock-end' },
  { id: 'ethics', name: 'Éthique chrétienne', icon: 'scale-balance' },
  { id: 'healing', name: 'Guérison et délivrance', icon: 'medical-bag' },
  { id: 'ministry', name: 'Ministère et leadership', icon: 'account-group' },
  { id: 'worship', name: 'Louange et adoration', icon: 'music' },
  { id: 'fiction', name: 'Fictions chrétiennes', icon: 'book' },
  { id: 'church_history', name: 'Histoire de l\'Église', icon: 'church' },
  { id: 'encouragement', name: 'Encouragement et motivation', icon: 'hand-heart' },
];

const BookCard = ({ book, onPress }: { book: Book; onPress: () => void }) => {
  const theme = useTheme();
  
  return (
    <TouchableOpacity 
      style={[styles.bookCard, { backgroundColor: theme.colors.surface }]} 
      onPress={onPress}
    >
      <Image 
        source={{ uri: book.coverImageUrl || 'https://via.placeholder.com/150' }} 
        style={styles.bookCover} 
      />
      <Text style={[styles.bookTitle, { color: '#333333' }]} numberOfLines={2}>
        {book.title}
      </Text>
      <Text style={[styles.bookAuthor, { color: '#666666' }]} numberOfLines={1}>
        {book.author}
      </Text>
    </TouchableOpacity>
  );
};

const CategorySection = ({ category, books, navigation }: { 
  category: string; 
  books: Book[]; 
  navigation: any;
}) => {
  const theme = useTheme();
  
  return (
    <View style={styles.categorySection}>
      <Text style={[styles.categoryTitle, { color: theme.colors.primary }]}>
        {category}
      </Text>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <BookCard 
            book={item} 
            onPress={() => navigation.navigate('BookDetails', { bookId: item.id })}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser) as ExtendedUser;
  const books = useSelector(selectBooks);
  const readingPlans = useSelector(selectReadingPlans);
  const freeQuarterlyBooks = useSelector(selectFreeQuarterlyBooks);
  const isBooksLoading = useSelector(selectBooksLoading);
  const isPlansLoading = useSelector(selectReadingPlansLoading);
  const isFreeQuarterlyBooksLoading = useSelector(selectFreeQuarterlyBooksLoading);
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Extract user's preferred categories from profile if available
  const userPreferredCategories = user?.preferences?.preferredCategories || [];
  
  useEffect(() => {
    // Fetch initial data
    dispatch(fetchBooks());
    dispatch(fetchReadingPlans());
    dispatch(fetchFreeQuarterlyBooks());
  }, [dispatch]);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchBooks()),
      dispatch(fetchReadingPlans()),
      dispatch(fetchFreeQuarterlyBooks())
    ]);
    setRefreshing(false);
  }, [dispatch]);
  
  const calculateProgress = (plan: any) => {
    return (plan.currentPage / plan.totalPages) * 100;
  };
  
  const renderBookItem = ({ item }: { item: any }) => (
    <Card 
      style={styles.bookCard}
      onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
    >
      <Card.Cover 
        source={require('../../assets/list_book.jpg')} 
        style={styles.bookCover}
      />
      <Card.Content>
        <Title numberOfLines={2} style={styles.bookTitle}>{item.title}</Title>
        <Paragraph numberOfLines={1} style={styles.bookAuthor}>{item.author}</Paragraph>
        <View style={styles.chipContainer}>
          <Chip style={styles.chip}>{item.category}</Chip>
          <Text style={styles.chip}>{item.pageCount} pages</Text>
        </View>
      </Card.Content>
    </Card>
  );
  
  const renderFeaturedBookItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.featuredBookContainer}
      onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
    >
      <Image 
        source={{ uri: item.coverImageUrl || 'https://via.placeholder.com/300x450' }} 
        style={styles.featuredBookCover}
      />
      <View style={styles.featuredBookOverlay}>
        <Text style={styles.featuredBookTitle}>{item.title}</Text>
        <Text style={styles.featuredBookAuthor}>{item.author}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>{item.rating || '4.5'} ★</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  const renderCategoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.selectedCategoryItem
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Avatar.Icon 
        size={32} 
        icon={item.icon}
        style={[
          styles.categoryIcon,
          selectedCategory === item.id && styles.selectedCategoryIcon
        ]}
        color={selectedCategory === item.id ? '#FFFFFF' : '#8A2BE2'}
      />
      <Text 
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.selectedCategoryText
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );
  
  const renderPlanItem = ({ item }: { item: any }) => (
    <Card 
      style={styles.planCard}
      onPress={() => navigation.navigate('ReadingPlan', { bookId: item.book?.id?.toString() || "" })}
    >
      <Card.Content>
        <Title numberOfLines={1}>{item.title}</Title>
        <Paragraph numberOfLines={1}>
          {item.book?.title} by {item.book?.author}
        </Paragraph>
        <View style={styles.progressContainer}>
          <View style={styles.progressTextContainer}>
            <Text style={styles.progressText}>
              {item.currentPage} of {item.totalPages} pages
            </Text>
            <Text style={styles.progressPercent}>
              {Math.round((item.currentPage / item.totalPages) * 100)}%
            </Text>
          </View>
          <ProgressBar 
            progress={item.currentPage / item.totalPages} 
            color="#8A2BE2"
            style={styles.progressBar}
          />
        </View>
        <View style={styles.planDetails}>
          <Text style={styles.planDetailText}>
            {item.pagesPerSession} pages {item.frequency === 'daily' ? 'per day' : 'per week'}
          </Text>
          <Button 
            mode="text" 
            compact 
            onPress={() => navigation.navigate('ReadingPlan', { bookId: item.book?.id?.toString() || "" })}
            color="#8A2BE2"
          >
            Log Progress
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
  
  // Filter books based on search query and selected category
  const filteredBooks = books.filter(book => {
    const matchesSearch = !searchQuery || 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      book.category.toLowerCase() === selectedCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });
  
  // Get books from user's preferred categories for the featured section
  const featuredBooks = userPreferredCategories.length > 0
    ? books.filter(book => 
        userPreferredCategories.some(
          category => book.category.toLowerCase() === category.toLowerCase()
        )
      )
    : books.slice(0, 5); // If no preferences, just show first 5 books
  
  // Function to filter books by category
  const filterBooksByCategory = (category: string) => {
    // For now, return all books since we don't have enough mock data
    // In a real app, we'd filter: return books.filter(b => b.category === category);
    return books;
  };
  
  const handleFreeBookPress = (bookId: number) => {
    console.log(`Navigating to BookDetail with bookId: ${bookId}`);
    navigation.navigate('BookDetail', { bookId: bookId.toString() });
  };
  
  // Loading state
  if ((isBooksLoading && books.length === 0) || isFreeQuarterlyBooksLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }
  
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#8A2BE2']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          {t('home.welcomeBack')}, {user?.name || 'Reader'}!
        </Text>
        <Text style={styles.subHeadText}>{t('home.subHeadText')}</Text>
      </View>

        {/* <LinearGradient
          colors={["rgb(91,61,221)", "#9317ed"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headBox}
        >
          <Text style={[styles.headText, { fontSize: 10 * 1.5 }]}>
          {t('home.welcomeBack')}, {user?.name || 'Reader'}!
          </Text>
          <Text style={styles.subHeadText}>Record your wonderful reading</Text>
          <View style={[styles.circle, styles.circle1]}></View>
          <View style={[styles.circle, styles.circle2]}></View>
          <View style={[styles.circle, styles.circle3]}></View>
        </LinearGradient> */}
      
      {/* Free Quarterly Books Section */}
      {freeQuarterlyBooks.length > 0 && (
        <FreeQuarterlyBooksSection 
          books={freeQuarterlyBooks} 
          onBookPress={handleFreeBookPress} 
        />
      )}
      
      {/* {featuredBooks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {userPreferredCategories.length > 0 
              ? "Recommended For You" 
              : "Featured Books"}
          </Text>
          <FlatList
            data={featuredBooks.slice(0, 5)}
            renderItem={renderFeaturedBookItem}
            keyExtractor={item => `featured-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredBooksList}
          />
        </View>
      )} */}

      <Divider style={styles.divider} />  
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.readingPlans')}</Text>
          <Button 
            mode="text" 
            onPress={() => navigation.navigate('ReadingPlan', { bookId: "" })}
            disabled={isPlansLoading}
            color="#8A2BE2"
          >
            {t('home.newPlan')}
          </Button>
        </View>
        
        {readingPlans.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>
                {t('home.noPlansYet')}
              </Text>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('ReadingPlan', { bookId: "" })}
                style={styles.emptyButton}
                color="#8A2BE2"
              >
                {t('home.createReadingPlan')}
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <FlatList
            data={readingPlans}
            renderItem={renderPlanItem}
            keyExtractor={item => `plan-${item.id.toString()}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.plansList}
            ListEmptyComponent={
              isPlansLoading ? (
                <Text style={styles.loadingText}>{t('home.loadingPlans')}</Text>
              ) : null
            }
          />
        )}
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.browseByCategory')}</Text>
          <Button 
            mode="text" 
            onPress={() => {/* Navigate to categories screen */}}
            color="#8A2BE2"
          >
            {t('common.viewAll')}
          </Button>
        </View>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={item => `category-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery 
              ? t('common.searchResult')
              : (selectedCategory === 'all' 
                  ? t('common.allBooks')
                  : categories.find(c => c.id === selectedCategory)?.name || 'Books')}
          </Text>
        </View>
        
        <Searchbar
          placeholder={t('common.searchBooks')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor="#8A2BE2"
        />
        
        {filteredBooks.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? t('common.noBooksFound')
                  : t('common.noBooksAvailable')}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <FlatList
            data={filteredBooks}
            renderItem={renderBookItem}
            keyExtractor={item => `book-${item.id.toString()}`}
            horizontal={false}
            numColumns={2}
            columnWrapperStyle={styles.bookGrid}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            ListEmptyComponent={
              isBooksLoading ? (
                <Text style={styles.loadingText}>Loading books...</Text>
              ) : null
            }
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },
  scrollView: {
    flex: 1,
    paddingBottom: 80, // Space for bottom navigation
  },
  subHeadText: {
    color: "rgba(255,255,255,0.8)",
  },
  header: {
    backgroundColor: '#9317ED',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    padding: 20,
    marginBottom: 20,
    marginTop: 0,
    // Ajout d'une ombre pour donner du relief
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  statItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 14,
    marginRight: 18,
    minWidth: 110,
    alignItems: 'center',
    // Ajout d'une ombre légère
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  searchbar: {
    marginBottom: 20,
    elevation: 2,
    borderRadius: 15,
    backgroundColor: 'white',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  section: {
    marginBottom: 28,
    paddingHorizontal: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 14,
  },
  plansList: {
    paddingRight: 2,
    padding: 5,
  },
  bookGrid: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  planCard: {
    width: 300,
    marginRight: 18,
    borderRadius: 16,
    // Ajout d'une ombre
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  bookCard: {
    width: (width - 32) / 2,
    marginBottom: 2,
    borderRadius: 10,
    // Ajout d'une ombre
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 5,
  },
  bookCover: {
    height: 160,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  chip: {
    // marginRight: 4,
    // marginTop: 4,
    height: 30,
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  planDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  planDetailText: {
    fontSize: 12,
    color: '#666',
  },
  emptyCard: {
    padding: 8,
    marginVertical: 8,
    borderRadius: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    borderRadius: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 16,
  },
  divider: {
    marginVertical: 8,
    backgroundColor: '#e0e0e0',
    height: 1,
  },
  // Category styles
  categoriesList: {
    paddingVertical: 8,
  },
  categoryItem: {
    marginRight: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCategoryItem: {
    backgroundColor: '#8A2BE2',
  },
  categoryIcon: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    marginRight: 8,
  },
  selectedCategoryIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryText: {
    color: '#8A2BE2',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Featured books styles
  featuredBooksList: {
    paddingVertical: 8,
  },
  featuredBookContainer: {
    width: 180,
    height: 280,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
    // Ajout d'une ombre
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  featuredBookCover: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  featuredBookOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  featuredBookTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featuredBookAuthor: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  ratingContainer: {
    position: 'absolute',
    top: -30,
    right: 10,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredSection: {
    marginBottom: 28,
    paddingHorizontal: 18,
  },
  categorySection: {
    marginBottom: 28,
    paddingHorizontal: 18,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 14,
  },
  featuredCover: {
    width: 300,
    height: 150,
    borderRadius: 16,
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  featuredTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featuredAuthor: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  bookAuthor: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666666',
  },
});

export default HomeScreen;