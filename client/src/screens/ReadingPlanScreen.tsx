import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  RefreshControl,
  FlatList,
  Alert,
  TouchableOpacity,
  Image
} from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  TextInput,
  Divider,
  ProgressBar,
  Dialog,
  Portal,
  Chip,
  DataTable,
  FAB,
  Modal,
  RadioButton,
  ActivityIndicator,
  List
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchBooks,
  selectBooks,
  selectBooksLoading,
  Book
} from '../slices/booksSlice';
import { 
  createReadingPlan, 
  fetchReadingPlans,
  fetchReadingSessions,
  logReadingSession,
  selectCurrentPlan,
  selectReadingSessions,
  selectReadingPlansLoading,
  selectReadingPlans,
  ReadingPlan
} from '../slices/readingPlansSlice';
import { selectUser } from '../slices/authSlice';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { AppDispatch, RootState } from '../store';
import { useTranslation } from 'react-i18next';
import DatePickerField from '../components/DatePickerField';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type ReadingPlanScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ReadingPlan'>;
type ReadingPlanScreenRouteProp = RouteProp<RootStackParamList, 'ReadingPlan'>;

interface ReadingPlanScreenProps {
  route: ReadingPlanScreenRouteProp;
  navigation: ReadingPlanScreenNavigationProp;
}

// Ajout de l'interface pour les paramètres de route
interface ReadingPlanRouteParams {
  planId?: string;
  bookId?: string;
  isEdit?: boolean;
}

const ReadingPlanScreen: React.FC<ReadingPlanScreenProps> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { planId, bookId } = route.params as ReadingPlanRouteParams || {};
  const dispatch = useDispatch<AppDispatch>();
  
  const user = useSelector((state: RootState) => selectUser(state));
  const books = useSelector((state: RootState) => selectBooks(state));
  const readingPlans = useSelector((state: RootState) => selectReadingPlans(state));
  const plan = useSelector((state: RootState) => selectCurrentPlan(state));
  const sessions = useSelector((state: RootState) => selectReadingSessions(state));
  const isBooksLoading = useSelector((state: RootState) => selectBooksLoading(state));
  const isPlanLoading = useSelector((state: RootState) => selectReadingPlansLoading(state));
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(bookId || null);
  const [showBookSelector, setShowBookSelector] = useState(!bookId);
  
  // Ajout de la définition de selectedBook
  const selectedBook = useMemo(() => {
    if (!selectedBookId) return null;
    return books.find(book => book.id.toString() === selectedBookId);
  }, [selectedBookId, books]);
  
  // Form states for creating or editing a plan
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // Default to 30 days from now
  const [frequency, setFrequency] = useState<string>('daily');
  const [showFrequencySelector, setShowFrequencySelector] = useState(false);
  const [pagesPerSession, setPagesPerSession] = useState('');
  const [notes, setNotes] = useState('');
  
  // Reading session tracking
  const [logSessionVisible, setLogSessionVisible] = useState(false);
  const [pagesRead, setPagesRead] = useState('');
  const [minutesSpent, setMinutesSpent] = useState('');
  
  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  const isEditMode = !!planId;

  // Frequency options
  const frequencyOptions = [
    { value: 'daily', label: t('readingPlan.daily') },
    { value: 'every_2_days', label: t('readingPlan.every2Days') },
    { value: 'every_3_days', label: t('readingPlan.every3Days') },
    { value: 'weekly', label: t('readingPlan.weekly') },
    { value: 'weekends_only', label: t('readingPlan.weekendsOnly') }
  ];

  // Filter books that don't already have a reading plan
  const availableBooks = useMemo(() => {
    if (!books || !readingPlans) return [];
    
    // Get IDs of books that already have active reading plans
    const booksWithPlans = new Set(
      readingPlans
        .filter(plan => plan.status === 'active')
        .map(plan => plan.book_id.toString())
    );
    
    // If we're editing an existing plan, include its book in available books
    if (planId && plan) {
      booksWithPlans.delete(plan.book_id.toString());
    }
    
    // Filter books that don't have active reading plans
    return books.filter(book => !booksWithPlans.has(book.id.toString()));
  }, [books, readingPlans, planId, plan]);
  
  useEffect(() => {
    // Fetch all books and reading plans
    dispatch(fetchBooks());
    dispatch(fetchReadingPlans());
    
    // If we have a plan ID, fetch its sessions
    if (planId) {
      dispatch(fetchReadingSessions());
    }
  }, [dispatch, planId]);
  
  // When plan data is loaded, populate form fields for editing
  useEffect(() => {
    if (plan && isEditMode) {
      setTitle(plan.title || `Reading Plan for ${plan.book_id}`);
      setStartDate(new Date(plan.start_date));
      setEndDate(new Date(plan.end_date));
      setFrequency(plan.frequency || 'daily');
      setPagesPerSession(plan.daily_goal?.toString() || '');
      setNotes(plan.notes || '');
      setSelectedBookId(plan.book_id.toString());
    }
  }, [plan, isEditMode]);

  // Set default title when book is selected
  useEffect(() => {
    if (selectedBookId && !isEditMode) {
      const selectedBook = books.find(b => b.id.toString() === selectedBookId);
      if (selectedBook) {
        setTitle(`Reading Plan for ${selectedBook.title}`);
      }
    }
  }, [selectedBookId, books, isEditMode]);
  
  // Calcul du nombre de jours entre deux dates
  const daysBetweenDates = (startDate: Date, endDate: Date): number => {
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Calcul du nombre de jours effectifs de lecture en fonction de la fréquence
  const getEffectiveReadingDays = (totalDays: number, freq: string): number => {
    switch (freq) {
      case 'daily':
        return totalDays;
      case 'every_2_days':
        return Math.ceil(totalDays / 2);
      case 'every_3_days':
        return Math.ceil(totalDays / 3);
      case 'weekly':
        return Math.ceil(totalDays / 7);
      case 'weekends_only':
        return Math.ceil(totalDays * (2 / 7)); // Environ 2/7 des jours sont des week-ends
      default:
        return totalDays;
    }
  };

  // Calcul du nombre de pages par session recommandé
  const calculatePagesPerSession = (totalPages: number, startDate: Date, endDate: Date, freq: string): number => {
    const totalDays = daysBetweenDates(startDate, endDate);
    const effectiveReadingDays = getEffectiveReadingDays(totalDays, freq);
    
    // Éviter la division par zéro
    if (effectiveReadingDays <= 0) return totalPages;
    
    return Math.ceil(totalPages / effectiveReadingDays);
  };

  // Mise à jour automatique du nombre de pages par session lorsque les dates ou la fréquence changent
  useEffect(() => {
    if (selectedBook) {
      const calculatedPages = calculatePagesPerSession(
        selectedBook.total_pages,
        startDate,
        endDate,
        frequency
      );
      setPagesPerSession(calculatedPages.toString());
    }
  }, [selectedBook, startDate, endDate, frequency]);

  // Réinitialiser la date de fin à 1 mois si le champ pages par session est vide
  useEffect(() => {
    if (!selectedBookId) {
      const newEndDate = new Date(startDate);
      newEndDate.setDate(startDate.getDate() + 30); // 1 mois par défaut
      setEndDate(newEndDate);
    }
  }, [startDate, selectedBookId]);

  const onRefresh = async () => {
    setRefreshing(true);
    
    await Promise.all([
      dispatch(fetchBooks()),
      dispatch(fetchReadingPlans())
    ]);
    
    if (planId) {
      await Promise.all([
        dispatch(fetchReadingSessions())
      ]);
    }
    
    setRefreshing(false);
  };
  
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString();
  };
  
  const calculateProgress = (plan: any) => {
    return (plan.current_page / plan.total_pages) * 100;
  };

  const handleBookSelect = (bookId: string) => {
    setSelectedBookId(bookId);
    setShowBookSelector(false);
  };
  
  const handleCreateOrUpdatePlan = () => {
    // Validate form
    if (!title.trim()) {
      Alert.alert('Error', t('readingPlan.errorTitle'));
      return;
    }
    
    if (!selectedBookId) {
      Alert.alert('Error', t('readingPlan.errorSelectBook'));
      return;
    }
    
    if (!pagesPerSession.trim() || isNaN(parseInt(pagesPerSession)) || parseInt(pagesPerSession) <= 0) {
      Alert.alert('Error', t('readingPlan.errorPages'));
      return;
    }
    
    const selectedBook = books.find(book => book.id.toString() === selectedBookId);
    if (!selectedBook) {
      Alert.alert('Error', t('readingPlan.errorBookNotFound'));
      return;
    }
    
    if (!user || !user.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    // Préparer les données selon le format attendu par l'API
    const planData = {
      userId: user.id,
      bookId: parseInt(selectedBookId),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      dailyGoal: parseInt(pagesPerSession),
      notes: notes.trim() || undefined,
      // Stocker la fréquence dans les notes pour l'instant
      // car le champ frequency n'existe pas dans l'API
      frequency: frequency
    };
    
    dispatch(createReadingPlan(planData))
      .unwrap()
      .then(() => {
        Alert.alert('Success', t('readingPlan.planCreated'));
        navigation.goBack();
      })
      .catch((error: any) => {
        Alert.alert('Error', error?.message || t('common.errorText'));
      });
  };

  const handleLogSession = () => {
    if (!planId || !selectedBookId) {
      Alert.alert('Error', t('readingSession.errorNoPlan'));
      return;
    }
    
    if (!pagesRead.trim() || isNaN(parseInt(pagesRead)) || parseInt(pagesRead) <= 0) {
      Alert.alert('Error', t('readingSession.errorPages'));
      return;
    }
    
    dispatch(logReadingSession({
      bookId: parseInt(selectedBookId),
      readingPlanId: parseInt(planId),
      pagesRead: parseInt(pagesRead),
      minutesSpent: minutesSpent.trim() ? parseInt(minutesSpent) : undefined,
    }))
      .unwrap()
      .then(() => {
        Alert.alert('Success', t('readingSession.sessionLogged'));
        setLogSessionVisible(false);
        setPagesRead('');
        setMinutesSpent('');
        
        // Refresh plan data
        dispatch(fetchReadingPlans());
        dispatch(fetchReadingSessions());
      })
      .catch(error => {
        Alert.alert('Error', error.message || t('common.errorText'));
      });
  };
  
  const renderPlanDetails = () => {
    if (!plan) return null;
    
    const progress = plan.current_page / plan.total_pages;
    const progressPercent = Math.round(progress * 100);
    const remainingPages = plan.total_pages - plan.current_page;
    
    return (
      <View>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.planTitle}>{plan.title}</Title>
            
            {plan.book && (
              <View style={styles.bookInfo}>
                <Paragraph style={styles.bookDetails}>
                  {plan.book.title} {t('common.by')} {plan.book.author?.name || t('common.unknownAuthor')}
                </Paragraph>
                <Chip style={styles.bookPageCount}>{plan.total_pages} {t('common.pages')}</Chip>
              </View>
            )}
            
            <View style={styles.progressContainer}>
              <View style={styles.progressTextContainer}>
                <Text style={styles.progressText}>
                  {plan.current_page} {t('common.of')} {plan.total_pages} {t('common.pages')}
                </Text>
                <Text style={styles.progressPercent}>
                  {progressPercent}% {t('common.complete')}
                </Text>
              </View>
              <ProgressBar 
                progress={progress}
                color="#8A2BE2"
                style={styles.progressBar}
              />
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('readingPlan.remaining')}</Text>
                <Text style={styles.statValue}>{remainingPages} {t('common.pages')}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('readingPlan.reading')}</Text>
                <Text style={styles.statValue}>
                  {plan.daily_goal} {t('common.pages')} {plan.frequency === 'daily' ? t('readingPlan.perDay') : t('readingPlan.perWeek')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('readingPlan.duration')}</Text>
                <Text style={styles.statValue}>
                  {formatDate(new Date(plan.start_date))} - {formatDate(new Date(plan.end_date))}
                </Text>
              </View>
            </View>
            
            {plan.notes && (
              <View style={styles.notesContainer}>
                <Title style={styles.sectionTitle}>{t('common.notes')}</Title>
                <Paragraph style={styles.notes}>{plan.notes}</Paragraph>
              </View>
            )}
            
            <View style={styles.actionButtons}>
              <Button 
                mode="contained" 
                onPress={() => setLogSessionVisible(true)}
                style={[styles.actionButton, { marginRight: 8 }]}
              >
                {t('readingSession.logSession')}
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => navigation.navigate('ReadingPlan', { planId: plan.id, isEdit: true })}
                style={styles.actionButton}
              >
                {t('common.edit')}
              </Button>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>{t('readingPlan.readingHistory')}</Title>
            
            {sessions.length === 0 ? (
              <Text style={styles.emptyText}>
                {t('readingPlan.noHistory')}
              </Text>
            ) : (
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>{t('common.date')}</DataTable.Title>
                  <DataTable.Title numeric>{t('readingSession.pagesRead')}</DataTable.Title>
                  <DataTable.Title numeric>{t('readingSession.minutesSpent')}</DataTable.Title>
                </DataTable.Header>
                
                {sessions.map(session => (
                  <DataTable.Row key={session.id}>
                    <DataTable.Cell>
                      {new Date(session.createdAt).toLocaleDateString()}
                    </DataTable.Cell>
                    <DataTable.Cell numeric>{session.pagesRead}</DataTable.Cell>
                    <DataTable.Cell numeric>{session.minutesSpent}</DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            )}
          </Card.Content>
        </Card>
      </View>
    );
  };

  // Fonction pour convertir les valeurs de fréquence aux clés de traduction
  const getFrequencyTranslationKey = (freq: string): string => {
    switch (freq) {
      case 'daily':
        return 'daily';
      case 'every_2_days':
        return 'every2Days';
      case 'every_3_days':
        return 'every3Days';
      case 'weekly':
        return 'weekly';
      case 'weekends_only':
        return 'weekendsOnly';
      default:
        return 'daily';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {showBookSelector ? (
          <View style={styles.selectorContainer}>
            <Text style={styles.selectorTitle}>{t('readingPlan.selectBook')}</Text>
            
            {availableBooks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {t('readingPlan.noAvailableBooks')}
                </Text>
              </View>
            ) : (
              <FlatList
                data={availableBooks}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.bookItem}
                    onPress={() => handleBookSelect(item.id.toString())}
                  >
                    <Image 
                      source={{ uri: item.cover_url || item.cover_image || 'https://via.placeholder.com/150' }}
                      style={styles.bookCover}
                    />
                    <View style={styles.bookItemContent}>
                      <Text style={styles.bookItemTitle}>{item.title}</Text>
                      <Text style={styles.bookItemAuthor}>
                        {t('common.by')} {item.author?.name || t('common.unknownAuthor')}
                      </Text>
                      <Text style={styles.bookItemPages}>
                        {item.total_pages} {t('common.pages')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.booksList}
                ItemSeparatorComponent={() => <Divider style={styles.bookDivider} />}
              />
            )}
          </View>
        ) : isEditMode ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            }
          >
            {renderPlanDetails()}
          </ScrollView>
        ) : (
          <ScrollView style={styles.formScrollContainer}>
            <View style={styles.formContainer}>
              <Card style={styles.formCard}>
                <Card.Content>
                  <View style={styles.formHeaderContainer}>
                    <MaterialCommunityIcons name="book-clock-outline" size={28} color="#8A2BE2" />
                    <Title style={styles.formTitle}>{t('readingPlan.createPlan')}</Title>
                  </View>
                  
                  {selectedBook && (
                    <View style={styles.bookInfo}>
                      <Title style={styles.bookTitle}>{selectedBook.title}</Title>
                      <Paragraph style={styles.bookAuthor}>
                        {t('common.by')} {selectedBook.author?.name || t('common.unknownAuthor')}
                      </Paragraph>
                      <Chip style={styles.bookPageCount}>{selectedBook.total_pages} {t('common.pages')}</Chip>
                      
                      <Button 
                        mode="outlined" 
                        onPress={() => setShowBookSelector(true)}
                        style={styles.changeBookButton}
                        icon="book-search"
                      >
                        {t('readingPlan.changeBook')}
                      </Button>
                    </View>
                  )}
                  
                  <TextInput
                    label={t('readingPlan.planTitle')}
                    value={title}
                    onChangeText={setTitle}
                    style={styles.input}
                    left={<TextInput.Icon icon="format-title" />}
                  />
                  
                  <View style={styles.dateContainer}>
                    <View style={styles.dateField}>
                      <DatePickerField
                        label={t('readingPlan.startDate')}
                        value={startDate}
                        onChange={setStartDate}
                      />
                    </View>
                    
                    <View style={styles.dateField}>
                      <DatePickerField
                        label={t('readingPlan.endDate')}
                        value={endDate}
                        onChange={setEndDate}
                      />
                    </View>
                  </View>
                  
                  <Text style={styles.sectionLabel}>{t('readingPlan.frequency')}:</Text>
                  <View style={styles.frequencyButtons}>
                    {frequencyOptions.map((option) => (
                      <Button
                        key={option.value}
                        mode={frequency === option.value ? 'contained' : 'outlined'}
                        onPress={() => setFrequency(option.value)}
                        style={[styles.frequencyButton, { marginRight: 8, marginBottom: 8 }]}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </View>
                  
                  {selectedBook && pagesPerSession && (
                    <View style={styles.pagesInfoContainer}>
                      <Text style={styles.sectionLabel}>{t('readingPlan.pagesPerSession')}:</Text>
                      <Text style={styles.pagesValue}>{pagesPerSession} {t('common.pages')}</Text>
                      <Text style={styles.pagesDescription}>
                        {t('readingPlan.pagesExplanation', {
                          frequency: t(`readingPlan.${getFrequencyTranslationKey(frequency)}`).toLowerCase(),
                          days: daysBetweenDates(startDate, endDate)
                        })}
                      </Text>
                    </View>
                  )}
                  
                  <TextInput
                    label={t('readingPlan.notes')}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    style={styles.input}
                    left={<TextInput.Icon icon="note-text" />}
                  />
                  
                  <Button 
                    mode="contained" 
                    onPress={handleCreateOrUpdatePlan}
                    style={styles.submitButton}
                    loading={isPlanLoading}
                    disabled={isPlanLoading}
                    icon="check-circle"
                  >
                    {isEditMode ? t('readingPlan.editPlan') : t('readingPlan.createPlan')}
                  </Button>
                </Card.Content>
              </Card>
            </View>
          </ScrollView>
        )}
      </View>
      
      {/* Log Reading Session Dialog */}
      <Portal>
        <Dialog
          visible={logSessionVisible}
          onDismiss={() => setLogSessionVisible(false)}
        >
          <Dialog.Title>{t('readingSession.logSession')}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={t('readingSession.pagesRead')}
              value={pagesRead}
              onChangeText={setPagesRead}
              keyboardType="number-pad"
              style={styles.dialogInput}
            />
            <TextInput
              label={t('readingSession.minutesSpent')}
              value={minutesSpent}
              onChangeText={setMinutesSpent}
              keyboardType="number-pad"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogSessionVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button onPress={handleLogSession}>
              {t('common.save')}
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
    backgroundColor: '#f0f2f5',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollContent: {
    padding: 16,
  },
  selectorContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  selectorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  formScrollContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  formContainer: {
    padding: 16,
  },
  formCard: {
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  formHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#333',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  bookInfo: {
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#8A2BE2',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bookPageCount: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    backgroundColor: '#e8e0f0',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateField: {
    width: '48%',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#444',
  },
  frequencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  frequencyButton: {
    marginBottom: 8,
    flex: 0,
    minWidth: '45%',
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: '#8A2BE2',
    paddingVertical: 8,
    borderRadius: 8,
  },
  pagesInfoContainer: {
    backgroundColor: '#f0f0f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#8A2BE2',
  },
  pagesValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8A2BE2',
    marginBottom: 8,
  },
  pagesDescription: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  changeBookButton: {
    marginTop: 8,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressContainer: {
    marginVertical: 16,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8A2BE2',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  notesContainer: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  notes: {
    fontSize: 14,
    color: '#444',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
  dialogInput: {
    marginBottom: 16,
  },
  bookDetails: {
    fontSize: 14,
    marginBottom: 8,
  },
  booksList: {
    flexGrow: 1,
  },
  bookItem: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 4,
    marginRight: 16,
  },
  bookItemContent: {
    flex: 1,
  },
  bookItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookItemAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookItemPages: {
    fontSize: 12,
    color: '#888',
  },
  bookDivider: {
    height: 1,
    backgroundColor: '#eee',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
});

export default ReadingPlanScreen;