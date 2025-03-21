import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Alert
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
  Portal
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
  
  const renderComment = ({ item }) => (
    <Card style={styles.commentCard}>
      <Card.Content>
        <View style={styles.commentHeader}>
          <Avatar.Text 
            size={36} 
            label={item.username.substring(0, 2).toUpperCase()} 
            style={{ marginRight: 10 }}
          />
          <View>
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
      >
        {book ? (
          <>
            <Card style={styles.bookCard}>
              <Card.Cover 
                source={{ uri: book.coverImageUrl || 'https://via.placeholder.com/300x450' }} 
                style={styles.bookCover}
              />
              <Card.Content>
                <Title style={styles.bookTitle}>{book.title}</Title>
                <Paragraph style={styles.bookAuthor}>by {book.author}</Paragraph>
                
                <View style={styles.chipContainer}>
                  <Chip style={styles.chip}>{book.category}</Chip>
                  <Chip style={styles.chip}>{book.pageCount} pages</Chip>
                  <Chip style={styles.chip}>{book.language}</Chip>
                </View>
                
                <Divider style={styles.divider} />
                
                <Title style={styles.sectionTitle}>Description</Title>
                <Paragraph style={styles.description}>{book.description}</Paragraph>
                
                <View style={styles.actionButtons}>
                  <Button 
                    mode="contained" 
                    onPress={handleCreateReadingPlan}
                    style={[styles.actionButton, { marginRight: 8 }]}
                    disabled={isPlansLoading}
                  >
                    Create Reading Plan
                  </Button>
                  <Button 
                    mode="outlined" 
                    onPress={() => setLogSessionVisible(true)}
                    style={styles.actionButton}
                    disabled={isPlansLoading}
                  >
                    Log Reading
                  </Button>
                </View>
              </Card.Content>
            </Card>
            
            <Card style={styles.commentsCard}>
              <Card.Content>
                <Title style={styles.sectionTitle}>Comments & Reviews</Title>
                
                <View style={styles.addCommentContainer}>
                  <TextInput
                    label="Add a comment"
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    numberOfLines={3}
                    style={styles.commentInput}
                  />
                  
                  <View style={styles.ratingInputContainer}>
                    <Text style={styles.ratingLabel}>Rating:</Text>
                    <View style={styles.ratingStars}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <TouchableOpacity
                          key={star}
                          onPress={() => setRating(star)}
                        >
                          <IconButton
                            icon="star"
                            size={24}
                            color={star <= rating ? '#FFC107' : '#E0E0E0'}
                            style={{ margin: 0 }}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  <Button 
                    mode="contained" 
                    onPress={handleSubmitComment}
                    style={styles.submitButton}
                    disabled={isLoading || commentText.trim() === ''}
                  >
                    Submit
                  </Button>
                </View>
                
                <Divider style={styles.divider} />
                
                {comments.length === 0 ? (
                  <Text style={styles.noCommentsText}>No comments yet. Be the first to leave a review!</Text>
                ) : (
                  <FlatList
                    data={comments}
                    renderItem={renderComment}
                    keyExtractor={item => item.id.toString()}
                    scrollEnabled={false}
                  />
                )}
              </Card.Content>
            </Card>
          </>
        ) : (
          <Text style={styles.notFoundText}>Book not found</Text>
        )}
      </ScrollView>
      
      <Portal>
        <Dialog visible={logSessionVisible} onDismiss={() => setLogSessionVisible(false)}>
          <Dialog.Title>Log Reading Session</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Pages Read"
              value={pagesRead}
              onChangeText={setPagesRead}
              keyboardType="number-pad"
              style={styles.dialogInput}
            />
            <TextInput
              label="Minutes Spent"
              value={minutesSpent}
              onChangeText={setMinutesSpent}
              keyboardType="number-pad"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogSessionVisible(false)}>Cancel</Button>
            <Button onPress={handleLogSession}>Log Session</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookCard: {
    margin: 16,
    elevation: 2,
  },
  bookCover: {
    height: 250,
  },
  bookTitle: {
    fontSize: 24,
    marginTop: 16,
  },
  bookAuthor: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
  commentsCard: {
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
    elevation: 2,
  },
  addCommentContainer: {
    marginBottom: 16,
  },
  commentInput: {
    backgroundColor: 'white',
  },
  ratingInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  ratingLabel: {
    marginRight: 8,
    fontSize: 16,
  },
  ratingStars: {
    flexDirection: 'row',
  },
  submitButton: {
    marginTop: 16,
  },
  commentCard: {
    marginBottom: 16,
    elevation: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUsername: {
    fontWeight: 'bold',
  },
  commentDate: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#666',
  },
  commentContent: {
    marginVertical: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  noCommentsText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 16,
  },
  notFoundText: {
    textAlign: 'center',
    fontSize: 18,
    margin: 24,
  },
  dialogInput: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
});

export default BookDetailScreen;