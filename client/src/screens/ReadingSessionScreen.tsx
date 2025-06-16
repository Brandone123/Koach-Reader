import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { Text, TextInput, Button, Card, Title, Paragraph, useTheme } from 'react-native-paper'; // Removed ActivityIndicator
import LottieView from 'lottie-react-native';
import LoadingAnimation from '../components/LoadingAnimation'; // Import LoadingAnimation
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
  const { bookId, planId } = route.params;
  const bookIdNumber = parseInt(bookId, 10);
  const planIdNumber = planId ? parseInt(planId, 10) : undefined;
  
  const dispatch = useDispatch<AppDispatch>();
  const book = useSelector(selectCurrentBook);
  const plan = useSelector(selectCurrentPlan); // This might not be up-to-date immediately after dispatch
  const [isLoading, setIsLoading] = useState(true);
  const [pagesRead, setPagesRead] = useState('');
  const [minutesSpent, setMinutesSpent] = useState('');
  const [notes, setNotes] = useState('');
  // const [koachEarned, setKoachEarned] = useState(0); // This seems to be calculated in the thunk now
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState(new Date());
  // const [hours, setHours] = useState(''); // minutesSpent is a single field now
  // const [minutes, setMinutes] = useState('');
  const [dateError, setDateError] = useState<string | undefined>();
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await dispatch(fetchBookById(bookIdNumber)).unwrap();
        if (planIdNumber) {
          await dispatch(fetchReadingPlanById(planIdNumber)).unwrap();
        }
      } catch (error) {
        Alert.alert(t('common.errorText'), t('common.errorGeneric'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dispatch, bookIdNumber, planIdNumber]);

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
      // koachEarned is calculated in the thunk based on pagesRead
      const numPagesRead = parseInt(pagesRead);
      const numMinutesSpent = minutesSpent ? parseInt(minutesSpent) : 0; // Default to 0 if empty

      const resultAction = await dispatch(logReadingSession({
        bookId: bookIdNumber,
        readingPlanId: planIdNumber,
        pagesRead: numPagesRead,
        minutesSpent: numMinutesSpent,
        notes: notes || undefined,
        // date: date.toISOString() // date might be handled by backend or thunk if not passed
      }));

      if (logReadingSession.fulfilled.match(resultAction)) {
        const { session, updatedCurrentPage } = resultAction.payload;

        if (book && planIdNumber && updatedCurrentPage && book.total_pages && updatedCurrentPage >= book.total_pages) {
          setShowCompletionModal(true);
        } else {
          Alert.alert(
            t('common.success'),
            t('readingSession.pointsEarned', { count: session.koachEarned || numPagesRead }), // Use koachEarned from session
            [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
          );
        }
      } else {
        throw new Error(resultAction.payload as string || t('common.errorGeneric'));
      }
    } catch (error: any) {
      Alert.alert(t('common.errorText'), error.message || t('common.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    // return (
    //   <View style={styles.loadingContainer}>
    //     <ActivityIndicator size="large" color="#8A2BE2" />
    //     <Text style={styles.loadingText}>{t('common.loading')}</Text>
    //   </View>
    // );
    return <LoadingAnimation />;
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
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Removed logoContainer, assuming it's not essential or handled by a screen header */}
        
        <Card style={[styles.bookCard, {backgroundColor: theme.colors.surfaceVariant}]}>
          <Card.Cover source={{ uri: book.cover_url || book.cover_image }} style={styles.bookCover} />
          <Card.Content>
            <Title style={{color: theme.colors.onSurfaceVariant}}>{book.title}</Title>
            <Paragraph style={{color: theme.colors.onSurfaceVariant}}>{t('common.author')} {book.author}</Paragraph>
            {plan && book.total_pages && ( // Check book.total_pages as well
              <Text style={[styles.planInfo, {color: theme.colors.secondary}]}>
                {t('readingPlan.planInfo', { current: plan.current_page || 0, total: book.total_pages })}
              </Text>
            )}
          </Card.Content>
        </Card>

        <Card style={[styles.formCard, {backgroundColor: theme.colors.surface}]}>
          <Card.Content>
            <Title style={styles.formTitle}>{t('readingSession.title')}</Title>

            <DatePickerField
              label={t('readingSession.date')}
              value={date}
              onChange={handleDateChange}
              error={dateError}
            />

            <TextInput
              label={t('readingSession.pagesRead')}
              value={pagesRead}
              onChangeText={setPagesRead}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              theme={{colors: {background: theme.colors.background} }}
            />

            <TextInput
              label={t('readingSession.timeSpent')}
              value={minutesSpent}
              onChangeText={setMinutesSpent}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              right={<TextInput.Affix text={t('common.minutesShort', 'min')} />}
              theme={{colors: {background: theme.colors.background} }}
            />

            <TextInput
              label={t('readingSession.notes')}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              mode="outlined"
              style={styles.input}
              theme={{colors: {background: theme.colors.background} }}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting || !pagesRead || parseInt(pagesRead) <= 0 || !!dateError}
              style={[styles.submitButton, {backgroundColor: theme.colors.primary}]}
              labelStyle={{color: theme.colors.onPrimary}}
            >
              {t('readingSession.save')}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Modal
        visible={showCompletionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowCompletionModal(false);
          navigation.goBack();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: theme.colors.surface}]}>
            <LottieView
              source={require('../assets/animations/bookComplete.json')}
              autoPlay
              loop={false}
              style={styles.lottieAnimation}
            />
            <Title style={[styles.modalTitle, {color: theme.colors.primary}]}>{t('readingSession.bookCompleteTitle', "Book Finished!")}</Title>
            <Paragraph style={[styles.modalMessage, {color: theme.colors.onSurface}]}>{t('readingSession.bookCompleteMessage', "Congratulations on completing this book! You've earned extra Koach Points!")}</Paragraph>
            <Button
              mode="contained"
              onPress={() => {
                setShowCompletionModal(false);
                navigation.goBack();
              }}
              style={{backgroundColor: theme.colors.primary}}
            >
              {t('common.great', "Great!")}
            </Button>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: theme.colors.background, // Applied inline
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30, // Ensure space for button
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: theme.colors.background, // Applied inline
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    // backgroundColor: theme.colors.background, // Applied inline
  },
  // logoContainer removed
  bookCard: {
    marginBottom: 20,
    elevation: 2,
  },
  bookCover: {
    height: 250, // Slightly larger cover
    resizeMode: 'cover', // Changed to cover for better aesthetics if image aspect varies
  },
  planInfo: {
    marginTop: 8,
    fontStyle: 'italic',
    fontSize: 14,
  },
  formCard: {
    marginBottom: 20,
    elevation: 2,
  },
  formTitle: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 20,
  },
  input: {
    marginBottom: 16, // Consistent margin for inputs
  },
  // formRow, label, timeContainer, timeInput, timeLabel, textArea removed as TextInputs are now directly styled
  submitButton: {
    marginTop: 20, // More space above button
    paddingVertical: 8, // Larger button
  },
  loadingText: { // Kept if needed for other loading states, not primary one
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    width: '85%',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 10,
  },
  lottieAnimation: {
    width: 180,
    height: 180,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  }
});

export default ReadingSessionScreen;