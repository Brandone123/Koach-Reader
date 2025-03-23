import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Alert,
  Image,
  ImageBackground,
  Dimensions,
  Share
} from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Chip, 
  Divider, 
  TextInput, 
  Avatar, 
  IconButton,
  Dialog,
  Portal,
  FAB,
  Menu,
  ProgressBar
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchBookById, 
  selectCurrentBook, 
  selectBooksLoading, 
  fetchBookComments, 
  selectBookComments,
  addBookComment
} from '../slices/booksSlice';
import { 
  createReadingPlan, 
  selectReadingPlansLoading,
  logReadingSession
} from '../slices/readingPlansSlice';
import { selectUser } from '../slices/authSlice';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { AppDispatch } from '../store';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

type BookDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BookDetail'>;
type BookDetailScreenRouteProp = RouteProp<RootStackParamList, 'BookDetail'>;

interface BookDetailScreenProps {
  navigation: BookDetailScreenNavigationProp;
  route: BookDetailScreenRouteProp;
}

const BookDetailScreen: React.FC<BookDetailScreenProps> = ({ navigation, route }) => {
  const { bookId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  
  const book = useSelector(selectCurrentBook);
  const user = useSelector(selectUser);
  const comments = useSelector(selectBookComments);
  const isLoading = useSelector(selectBooksLoading);
  const isPlansLoading = useSelector(selectReadingPlansLoading);
  
  const [refreshing, setRefreshing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [rating, setRating] = useState(5);
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Reading session tracking
  const [logSessionVisible, setLogSessionVisible] = useState(false);
  const [pagesRead, setPagesRead] = useState('');
  const [minutesSpent, setMinutesSpent] = useState('');

  useEffect(() => {
    if (bookId > 0) {
      dispatch(fetchBookById(bookId));
      dispatch(fetchBookComments(bookId));
    }
  }, [dispatch, bookId]);
  
  const onRefresh = async () => {
    if (bookId > 0) {
      setRefreshing(true);
      await Promise.all([
        dispatch(fetchBookById(bookId)),
        dispatch(fetchBookComments(bookId))
      ]);
      setRefreshing(false);
    }
  };
  
  const handleSubmitComment = () => {
    if (commentText.trim() === '') {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }
    
    dispatch(addBookComment({
      bookId,
      content: commentText,
      rating
    }));
    
    setCommentText('');
    setRating(5);
  };
  
  const handleCreateReadingPlan = () => {
    if (!book) return;
    
    navigation.navigate('ReadingPlan', { bookId: book.id });
  };
  
  const handleLogSession = () => {
    if (!book) return;
    
    const pagesReadNum = parseInt(pagesRead);
    const minutesSpentNum = parseInt(minutesSpent);
    
    if (isNaN(pagesReadNum) || pagesReadNum <= 0) {
      Alert.alert('Error', 'Please enter a valid number of pages');
      return;
    }
    
    if (isNaN(minutesSpentNum) || minutesSpentNum <= 0) {
      Alert.alert('Error', 'Please enter a valid number of minutes');
      return;
    }
    
    dispatch(logReadingSession({
      bookId: book.id,
      pagesRead: pagesReadNum,
      minutesSpent: minutesSpentNum
    }));
    
    setLogSessionVisible(false);
    setPagesRead('');
    setMinutesSpent('');
    
    Alert.alert(
      'Success',
      `You've logged ${pagesReadNum} pages and earned ${pagesReadNum} Koach points!`,
      [{ text: 'Great!' }]
    );
  };
  
  // Handlers for the media viewer
  const handleReadBook = () => {
    if (!book) return;
    navigation.navigate('MediaViewer', { bookId: book.id, mediaType: 'pdf' });
  };
  
  const handleListenAudio = () => {
    if (!book) return;
    navigation.navigate('MediaViewer', { bookId: book.id, mediaType: 'audio' });
  };
  
  const handleShare = async () => {
    if (!book) return;
    
    try {
      await Share.share({
        message: `Check out this book I'm reading: ${book.title} by ${book.author}. #KoachReader`,
        title: book.title,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share the book');
    }
  };
  
  // Calculate average rating
  const averageRating = comments.length > 0
    ? comments.reduce((acc, comment) => acc + (comment.rating || 0), 0) / comments.length
    : 0;
    
  const formattedRating = averageRating.toFixed(1);
  
  const renderComment = ({ item }) => (
    <Card style={styles.commentCard}>
      <Card.Content>
        <View style={styles.commentHeader}>
          <Avatar.Text 
            size={40} 
            label={item.username.substring(0, 2).toUpperCase()} 
            style={{ marginRight: 12 }}
            color="#FFFFFF"
            theme={{ colors: { primary: '#8A2BE2' } }}
          />
          <View style={styles.commentHeaderText}>
            <Text style={styles.commentUsername}>{item.username}</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map(star => (
                <IconButton
                  key={star}
                  icon="star"
                  size={14}
                  color={star <= (item.rating || 0) ? '#FFC107' : '#E0E0E0'}
                  style={{ margin: 0, marginHorizontal: -2 }}
                />
              ))}
            </View>
          </View>
          <Text style={styles.commentDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.commentContent}>{item.content}</Text>
      </Card.Content>
    </Card>
  );
  
  if (!book && bookId > 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading book details...</Text>
      </View>
    );
  }
  
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
        showsVerticalScrollIndicator={false}
      >
        {book ? (
          <>
            <View style={styles.bookHeaderContainer}>
              <ImageBackground 
                source={{ uri: book.coverImageUrl || 'https://via.placeholder.com/300x450' }} 
                style={styles.bookHeaderBackground}
                blurRadius={5}
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
                  style={styles.gradient}
                >
                  <View style={styles.bookHeaderContent}>
                    <Image
                      source={{ uri: book.coverImageUrl || 'https://via.placeholder.com/300x450' }}
                      style={styles.bookCover}
                    />
                    <View style={styles.bookInfoContainer}>
                      <Text style={styles.bookTitle}>{book.title}</Text>
                      <Text style={styles.bookAuthor}>by {book.author}</Text>
                      
                      <View style={styles.ratingOverview}>
                        <View style={styles.ratingStars}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <IconButton
                              key={star}
                              icon="star"
                              size={16}
                              color={star <= Math.round(averageRating) ? '#FFC107' : '#E0E0E0'}
                              style={{ margin: 0, marginHorizontal: -4 }}
                            />
                          ))}
                        </View>
                        <Text style={styles.ratingValue}>{formattedRating} / 5.0</Text>
                      </View>
                      
                      <View style={styles.chipContainer}>
                        <Chip style={styles.chip} textStyle={styles.chipText}>{book.category}</Chip>
                        <Chip style={styles.chip} textStyle={styles.chipText}>{book.pageCount} pages</Chip>
                        <Chip style={styles.chip} textStyle={styles.chipText}>{book.language}</Chip>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </View>
            
            <View style={styles.contentContainer}>
              <View style={styles.actionButtonContainer}>
                <Button 
                  mode="contained" 
                  onPress={handleReadBook}
                  style={[styles.actionButton, { backgroundColor: '#8A2BE2' }]}
                  icon="book-open-page-variant"
                >
                  Read
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleListenAudio}
                  style={[styles.actionButton, { backgroundColor: '#FF6B6B' }]}
                  icon="headphones"
                >
                  Listen
                </Button>
                <Button 
                  mode="contained" 
                  onPress={() => setLogSessionVisible(true)}
                  style={[styles.actionButton, { backgroundColor: '#00CEC9' }]}
                  icon="pen"
                >
                  Log Reading
                </Button>
              </View>
            
              <Card style={styles.descriptionCard}>
                <Card.Content>
                  <Title style={styles.sectionTitle}>Description</Title>
                  <Paragraph style={styles.description}>{book.description}</Paragraph>
                </Card.Content>
              </Card>
              
              <Title style={[styles.sectionTitle, { marginTop: 16, marginHorizontal: 16 }]}>
                Reviews & Comments ({comments.length})
              </Title>
              
              <Card style={styles.addCommentCard}>
                <Card.Content>
                  <Title style={styles.addCommentTitle}>Add Your Review</Title>
                  <View style={styles.ratingSelector}>
                    <Text style={styles.ratingLabel}>Your Rating:</Text>
                    <View style={styles.stars}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <IconButton
                          key={star}
                          icon="star"
                          size={24}
                          color={star <= rating ? '#FFC107' : '#E0E0E0'}
                          onPress={() => setRating(star)}
                        />
                      ))}
                    </View>
                  </View>
                  
                  <TextInput
                    label="Your comment"
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    numberOfLines={3}
                    style={styles.commentInput}
                    theme={{ colors: { primary: '#8A2BE2' } }}
                  />
                  
                  <Button 
                    mode="contained" 
                    onPress={handleSubmitComment}
                    style={styles.submitCommentButton}
                    icon="send"
                    color="#8A2BE2"
                  >
                    Submit
                  </Button>
                </Card.Content>
              </Card>
              
              {comments.length > 0 ? (
                <FlatList
                  data={comments}
                  renderItem={renderComment}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={styles.commentsList}
                  scrollEnabled={false}
                />
              ) : (
                <Card style={styles.emptyCommentsCard}>
                  <Card.Content>
                    <Text style={styles.emptyCommentsText}>
                      Be the first to leave a comment!
                    </Text>
                  </Card.Content>
                </Card>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
      
      <FAB.Group
        open={menuVisible}
        icon={menuVisible ? 'close' : 'dots-vertical'}
        actions={[
          {
            icon: 'share',
            label: 'Share',
            onPress: handleShare,
          },
          {
            icon: 'notebook',
            label: 'Create Reading Plan',
            onPress: handleCreateReadingPlan,
            color: '#8A2BE2',
          },
          {
            icon: 'book-outline',
            label: 'Start Reading',
            onPress: handleReadBook,
            color: '#8A2BE2',
          },
        ]}
        onStateChange={({ open }) => setMenuVisible(open)}
        color="#FFFFFF"
        fabStyle={{ backgroundColor: '#8A2BE2' }}
      />
      
      <Portal>
        <Dialog
          visible={logSessionVisible}
          onDismiss={() => setLogSessionVisible(false)}
        >
          <Dialog.Title>Log Reading Session</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Pages Read"
              value={pagesRead}
              onChangeText={setPagesRead}
              style={styles.dialogInput}
              keyboardType="numeric"
              theme={{ colors: { primary: '#8A2BE2' } }}
            />
            <TextInput
              label="Minutes Spent"
              value={minutesSpent}
              onChangeText={setMinutesSpent}
              style={styles.dialogInput}
              keyboardType="numeric"
              theme={{ colors: { primary: '#8A2BE2' } }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogSessionVisible(false)} color="#8A2BE2">Cancel</Button>
            <Button onPress={handleLogSession} color="#8A2BE2">Log Session</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  scrollView: {
    flex: 1,
    paddingBottom: 80, // Space for bottom navigation
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookHeaderContainer: {
    height: 280,
    width: '100%',
  },
  bookHeaderBackground: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  bookHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  bookCover: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  bookInfoContainer: {
    flex: 1,
    paddingLeft: 16,
  },
  bookTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  ratingOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 14,
    color: 'white',
    marginLeft: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  chipText: {
    color: 'white',
  },
  contentContainer: {
    flex: 1,
    paddingVertical: 16,
  },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  descriptionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    elevation: 2,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    lineHeight: 22,
  },
  addCommentCard: {
    marginHorizontal: 16,
    marginTop: 16,
    elevation: 2,
    borderRadius: 8,
  },
  addCommentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  ratingLabel: {
    marginRight: 8,
    fontSize: 14,
  },
  stars: {
    flexDirection: 'row',
  },
  commentInput: {
    marginVertical: 8,
    backgroundColor: 'white',
  },
  submitCommentButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  commentsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  commentCard: {
    marginBottom: 12,
    elevation: 1,
    borderRadius: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  commentHeaderText: {
    flex: 1,
  },
  commentUsername: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentDate: {
    fontSize: 12,
    color: '#888',
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyCommentsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
  },
  emptyCommentsText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  dialogInput: {
    marginVertical: 8,
    backgroundColor: 'white',
  },
});

export default BookDetailScreen;