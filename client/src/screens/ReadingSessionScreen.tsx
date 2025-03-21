import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBookById, selectCurrentBook } from '../slices/booksSlice';
import { fetchReadingPlanById, selectCurrentPlan, logReadingSession } from '../slices/readingPlansSlice';
import { AppDispatch } from '../store';

type ReadingSessionScreenRouteProp = RouteProp<RootStackParamList, 'ReadingSession'>;
type ReadingSessionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ReadingSession'>;

interface ReadingSessionScreenProps {
  route: ReadingSessionScreenRouteProp;
  navigation: ReadingSessionScreenNavigationProp;
}

const ReadingSessionScreen: React.FC<ReadingSessionScreenProps> = ({ route, navigation }) => {
  const { bookId, planId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const book = useSelector(selectCurrentBook);
  const plan = useSelector(selectCurrentPlan);
  const [isLoading, setIsLoading] = useState(true);
  const [pagesRead, setPagesRead] = useState('');
  const [minutesSpent, setMinutesSpent] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await dispatch(fetchBookById(bookId)).unwrap();
        if (planId) {
          await dispatch(fetchReadingPlanById(planId)).unwrap();
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dispatch, bookId, planId]);

  const handleSubmit = async () => {
    // Validate input
    if (!pagesRead || parseInt(pagesRead) <= 0) {
      Alert.alert('Error', 'Please enter a valid number of pages read.');
      return;
    }

    setSubmitting(true);
    try {
      const session = {
        bookId,
        readingPlanId: planId || undefined,
        pagesRead: parseInt(pagesRead),
        minutesSpent: minutesSpent ? parseInt(minutesSpent) : undefined,
        notes: notes || undefined,
      };

      const result = await dispatch(logReadingSession(session)).unwrap();
      Alert.alert(
        'Success!',
        `Session recorded successfully. You earned ${result.koachEarned} Koach points!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to record reading session.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.errorContainer}>
        <Text>Book not found</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.bookCard}>
          <Card.Cover source={{ uri: book.coverImageUrl }} style={styles.bookCover} />
          <Card.Content>
            <Title>{book.title}</Title>
            <Paragraph>By {book.author}</Paragraph>
            {plan && (
              <Text style={styles.planInfo}>
                Reading Plan: {plan.title} ({plan.currentPage} of {plan.totalPages} pages)
              </Text>
            )}
          </Card.Content>
        </Card>

        <View style={styles.formContainer}>
          <Title style={styles.formTitle}>Log Your Reading Session</Title>
          
          <TextInput
            label="Pages Read"
            value={pagesRead}
            onChangeText={setPagesRead}
            keyboardType="number-pad"
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label="Minutes Spent (optional)"
            value={minutesSpent}
            onChangeText={setMinutesSpent}
            keyboardType="number-pad"
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={4}
          />
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={submitting}
            disabled={submitting}
          >
            Record Session
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  bookCard: {
    marginBottom: 20,
  },
  bookCover: {
    height: 200,
    resizeMode: 'contain',
  },
  planInfo: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
});

export default ReadingSessionScreen;