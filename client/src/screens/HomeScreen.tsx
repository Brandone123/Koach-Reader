import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Image
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
  FAB
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBooks, selectBooks, selectBooksLoading } from '../slices/booksSlice';
import { 
  fetchReadingPlans, 
  selectReadingPlans, 
  selectReadingPlansLoading 
} from '../slices/readingPlansSlice';
import { selectUser } from '../slices/authSlice';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { AppDispatch } from '../store';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const books = useSelector(selectBooks);
  const readingPlans = useSelector(selectReadingPlans);
  const isBooksLoading = useSelector(selectBooksLoading);
  const isPlansLoading = useSelector(selectReadingPlansLoading);
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    // Fetch initial data
    dispatch(fetchBooks({}));
    dispatch(fetchReadingPlans({}));
  }, [dispatch]);
  
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchBooks({})),
      dispatch(fetchReadingPlans({}))
    ]);
    setRefreshing(false);
  };
  
  const calculateProgress = (plan: any) => {
    return (plan.currentPage / plan.totalPages) * 100;
  };
  
  const renderBookItem = ({ item }: { item: any }) => (
    <Card 
      style={styles.bookCard}
      onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
    >
      <Card.Cover 
        source={{ uri: item.coverImageUrl || 'https://via.placeholder.com/150' }} 
        style={styles.bookCover}
      />
      <Card.Content>
        <Title numberOfLines={1} style={styles.bookTitle}>{item.title}</Title>
        <Paragraph numberOfLines={1}>{item.author}</Paragraph>
        <View style={styles.chipContainer}>
          <Chip style={styles.chip}>{item.category}</Chip>
          <Chip style={styles.chip}>{item.pageCount} pages</Chip>
        </View>
      </Card.Content>
    </Card>
  );
  
  const renderPlanItem = ({ item }: { item: any }) => (
    <Card 
      style={styles.planCard}
      onPress={() => navigation.navigate('ReadingPlan', { planId: item.id })}
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
            color="#6200ee"
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
            onPress={() => navigation.navigate('ReadingPlan', { planId: item.id })}
          >
            Log Progress
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
  
  const filteredBooks = searchQuery
    ? books.filter(book => 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : books;
  
  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        style={styles.scrollView}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Welcome back, {user?.username || 'Reader'}!
          </Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.koachPoints || 0}</Text>
              <Text style={styles.statLabel}>Koach Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.readingStreak || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
        </View>
        
        <Searchbar
          placeholder="Search books..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        {/* Reading Plans Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Reading Plans</Text>
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('ReadingPlan', {})}
              disabled={isPlansLoading}
            >
              New Plan
            </Button>
          </View>
          
          {readingPlans.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>
                  You don't have any reading plans yet. Create your first one!
                </Text>
                <Button 
                  mode="contained" 
                  onPress={() => navigation.navigate('ReadingPlan', {})}
                  style={styles.emptyButton}
                >
                  Create Reading Plan
                </Button>
              </Card.Content>
            </Card>
          ) : (
            <FlatList
              data={readingPlans}
              renderItem={renderPlanItem}
              keyExtractor={item => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.plansList}
              ListEmptyComponent={
                isPlansLoading ? (
                  <Text style={styles.loadingText}>Loading your reading plans...</Text>
                ) : null
              }
            />
          )}
        </View>
        
        <Divider style={styles.divider} />
        
        {/* Books Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery ? 'Search Results' : 'Discover Books'}
            </Text>
          </View>
          
          {filteredBooks.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>
                  {searchQuery 
                    ? 'No books found matching your search.' 
                    : 'No books available at the moment.'}
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <FlatList
              data={filteredBooks}
              renderItem={renderBookItem}
              keyExtractor={item => item.id.toString()}
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
      
      <FAB
        style={styles.fab}
        icon="plus"
        label="Add Book"
        onPress={() => navigation.navigate('BookDetail', { bookId: 0 })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#6200ee',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
  },
  statItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    minWidth: 100,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  searchbar: {
    margin: 16,
    elevation: 2,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyCard: {
    marginVertical: 8,
    elevation: 2,
  },
  emptyText: {
    textAlign: 'center',
    margin: 16,
    color: '#666',
  },
  emptyButton: {
    marginTop: 16,
  },
  loadingText: {
    textAlign: 'center',
    margin: 16,
    color: '#666',
  },
  plansList: {
    paddingEnd: 16,
  },
  planCard: {
    width: 280,
    marginRight: 16,
    elevation: 2,
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
    color: '#666',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6200ee',
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
  bookGrid: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bookCard: {
    width: '48%',
    marginBottom: 16,
    elevation: 2,
  },
  bookCover: {
    height: 150,
  },
  bookTitle: {
    fontSize: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    marginRight: 8,
    marginTop: 8,
    height: 24,
  },
  divider: {
    marginVertical: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
});

export default HomeScreen;