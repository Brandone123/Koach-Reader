import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBooks } from '../slices/booksSlice';
import { fetchReadingPlans, logReadingSession } from '../slices/readingPlansSlice';
import { AppDispatch, RootState } from '../store';
import { useTranslation } from 'react-i18next';
import DatePickerField from '../components/DatePickerField';

type ReadingSessionScreenRouteProp = RouteProp<RootStackParamList, 'ReadingSession'>;
type ReadingSessionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ReadingSession'>;

interface ReadingSessionScreenProps {
  route: ReadingSessionScreenRouteProp;
  navigation: ReadingSessionScreenNavigationProp;
}

const ReadingSessionScreen: React.FC<ReadingSessionScreenProps> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { bookId, planId } = route.params;
  const bookIdNumber = parseInt(bookId, 10);
  const planIdNumber = planId ? parseInt(planId, 10) : undefined;
  
  const dispatch = useDispatch<AppDispatch>();
  
  // Properly define selectors with state parameter
  const book = useSelector((state: RootState) => 
    state.books.books.find(b => b.id === bookIdNumber)
  );
  
  const plan = useSelector((state: RootState) => 
    state.readingPlans.plans.find(p => p.id === planIdNumber)
  );
  
  const [isLoading, setIsLoading] = useState(true);
  const [pagesRead, setPagesRead] = useState('');
  const [minutesSpent, setMinutesSpent] = useState('');
  const [notes, setNotes] = useState('');
  const [koachEarned, setKoachEarned] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState(new Date());
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [dateError, setDateError] = useState<string | undefined>();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await dispatch(fetchBooks()).unwrap();
        if (planIdNumber) {
          await dispatch(fetchReadingPlans()).unwrap();
        }
      } catch (error) {
        Alert.alert(t('common.errorText'), t('common.errorGeneric'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dispatch, bookIdNumber, planIdNumber, t]);

  // Calculate Koach points based on pages read
  useEffect(() => {
    if (pagesRead) {
      const pages = parseInt(pagesRead);
      if (!isNaN(pages)) {
        // Simple formula: 10 points per page
        setKoachEarned(pages * 10);
      }
    }
  }, [pagesRead]);

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
    // Validate date - must be in the past or today
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (newDate > today) {
      setDateError(t('validation.dateMustBePast'));
    } else {
      setDateError(undefined);
    }
  };

  const handleSubmit = async () => {
    // Validate inputs
    if (!pagesRead || parseInt(pagesRead) <= 0) {
      Alert.alert(t('common.errorText'), t('readingSession.validPagesRequired'));
      return;
    }

    if (dateError) {
      Alert.alert(t('common.errorText'), dateError);
      return;
    }

    setSubmitting(true);
    try {
      // Calculate minutes from hours and minutes inputs
      const totalMinutes = (hours ? parseInt(hours) * 60 : 0) + (minutes ? parseInt(minutes) : 0);
      
      const session = {
        bookId: bookIdNumber,
        readingPlanId: planIdNumber,
        pagesRead: parseInt(pagesRead),
        minutesSpent: totalMinutes || undefined,
        notes: notes || undefined,
        date: date.toISOString()
      };

      await dispatch(logReadingSession(session)).unwrap();
      
      Alert.alert(
        t('common.success'),
        t('readingSession.pointsEarned', { count: koachEarned }),
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(t('common.errorText'), t('common.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A2BE2" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('book.notFound')}</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          {t('common.goBack')}
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
          <Card.Cover 
            source={{ uri: book.cover_url || book.cover_image || 'https://via.placeholder.com/150' }} 
            style={styles.bookCover} 
          />
          <Card.Content>
            <Title>{book.title}</Title>
            <Paragraph>{t('common.author')} {book.author?.name || t('common.unknownAuthor')}</Paragraph>
            {plan && (
              <Text style={styles.planInfo}>
                {t('readingPlan.planInfo', { current: plan.current_page, total: book.total_pages })}
              </Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.formCard}>
          <Card.Content>
            <Title style={styles.formTitle}>{t('readingSession.title')}</Title>

            <DatePickerField
              label={t('readingSession.date')}
              value={date}
              onChange={handleDateChange}
              error={dateError}
            />

            <View style={styles.formRow}>
              <Text style={styles.label}>{t('readingSession.pagesRead')}</Text>
              <TextInput
                value={pagesRead}
                onChangeText={setPagesRead}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            <View style={styles.formRow}>
              <Text style={styles.label}>{t('readingSession.timeSpent')}</Text>
              <View style={styles.timeContainer}>
                <TextInput
                  value={hours}
                  onChangeText={setHours}
                  keyboardType="numeric"
                  style={[styles.input, styles.timeInput]}
                  placeholder="0"
                />
                <Text style={styles.timeLabel}>h</Text>
                <TextInput
                  value={minutes}
                  onChangeText={setMinutes}
                  keyboardType="numeric"
                  style={[styles.input, styles.timeInput]}
                  placeholder="0"
                />
                <Text style={styles.timeLabel}>m</Text>
              </View>
            </View>

            <View style={styles.formRow}>
              <Text style={styles.label}>{t('readingSession.notes')}</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={styles.notesInput}
              />
            </View>

            <View style={styles.pointsContainer}>
              <Text style={styles.pointsLabel}>{t('common.points')}: </Text>
              <Text style={styles.pointsValue}>{koachEarned}</Text>
            </View>

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
              style={styles.submitButton}
            >
              {t('readingSession.submit')}
            </Button>
          </Card.Content>
        </Card>
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
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bookCard: {
    marginBottom: 20,
    elevation: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bookCover: {
    height: 200,
  },
  planInfo: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  formCard: {
    borderRadius: 12,
    elevation: 4,
  },
  formTitle: {
    fontSize: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  formRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    height: 48,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    flex: 1,
    marginRight: 8,
  },
  timeLabel: {
    fontSize: 16,
    marginRight: 16,
    color: '#333',
  },
  notesInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  pointsLabel: {
    fontSize: 18,
    color: '#333',
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8A2BE2',
  },
  submitButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 8,
    borderRadius: 8,
  },
});

export default ReadingSessionScreen;