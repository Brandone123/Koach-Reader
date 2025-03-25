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
  const { bookId, planId } = route.params as { bookId: number; planId?: number };
  const dispatch = useDispatch<AppDispatch>();
  const book = useSelector(selectCurrentBook);
  const plan = useSelector(selectCurrentPlan);
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
        await dispatch(fetchBookById(bookId)).unwrap();
        if (planId) {
          await dispatch(fetchReadingPlanById(planId)).unwrap();
        }
      } catch (error) {
        Alert.alert(t('common.errorText'), t('common.errorGeneric'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dispatch, bookId, planId]);

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
    // Validation de la date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (newDate > today) {
      setDateError(t('validation.dateMustBeFuture'));
    } else {
      setDateError(undefined);
    }
  };

  const handleSubmit = async () => {
    // Validation des entrées
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
      const session = {
        bookId,
        readingPlanId: planId || undefined,
        pagesRead: parseInt(pagesRead),
        minutesSpent: minutesSpent ? parseInt(minutesSpent) : undefined,
        notes: notes || undefined,
        koachEarned: koachEarned || 0,
        date: date.toISOString()
      };

      const result = await dispatch(logReadingSession({
        ...session,
        bookId: bookId
      })).unwrap();
      
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
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>{t('readingSession.loading')}</Text>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.errorContainer}>
        <Text>{t('book.notFound')}</Text>
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
          <Card.Cover source={{ uri: book.coverImageUrl }} style={styles.bookCover} />
          <Card.Content>
            <Title>{book.title}</Title>
            <Paragraph>{t('common.author')} {book.author}</Paragraph>
            {plan && (
              <Text style={styles.planInfo}>
                {t('readingPlan.planInfo', { current: plan.currentPage, total: plan.totalPages })}
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
                value={pagesRead.toString()}
                onChangeText={value => setPagesRead(value)}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            <View style={styles.formRow}>
              <Text style={styles.label}>{t('readingSession.timeSpent')}</Text>
              <View style={styles.timeContainer}>
                <TextInput
                  value={hours.toString()}
                  onChangeText={value => setHours(value)}
                  keyboardType="numeric"
                  style={[styles.input, styles.timeInput]}
                />
                <Text style={styles.timeLabel}>h</Text>
                <TextInput
                  value={minutes.toString()}
                  onChangeText={value => setMinutes(value)}
                  keyboardType="numeric"
                  style={[styles.input, styles.timeInput]}
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
                numberOfLines={4}
                style={[styles.input, styles.textArea]}
              />
            </View>

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting || Number(pagesRead) <= 0 || !!dateError}
              style={styles.submitButton}
            >
              {t('readingSession.save')}
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
  formCard: {
    marginBottom: 20,
  },
  formTitle: {
    marginBottom: 20,
  },
  formRow: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    backgroundColor: '#fff',
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
    marginHorizontal: 8,
  },
  textArea: {
    height: 100,
  },
  submitButton: {
    marginTop: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  }
});

export default ReadingSessionScreen;