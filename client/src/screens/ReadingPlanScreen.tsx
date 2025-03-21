import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  RefreshControl,
  FlatList,
  Alert,
  TouchableOpacity
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
  Modal
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchBookById, 
  selectCurrentBook,
  selectBooksLoading 
} from '../slices/booksSlice';
import { 
  createReadingPlan, 
  updateReadingPlan,
  fetchReadingPlanById,
  fetchReadingSessions,
  logReadingSession,
  selectCurrentPlan,
  selectReadingSessions,
  selectReadingPlansLoading
} from '../slices/readingPlansSlice';
import { selectUser } from '../slices/authSlice';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { AppDispatch } from '../store';

interface ReadingPlanScreenProps {
  route: any;
  navigation: any;
}

const ReadingPlanScreen: React.FC<ReadingPlanScreenProps> = ({ route, navigation }) => {
  const { planId, bookId } = route.params || {};
  const dispatch = useDispatch<AppDispatch>();
  
  const user = useSelector(selectUser);
  const book = useSelector(selectCurrentBook);
  const plan = useSelector(selectCurrentPlan);
  const sessions = useSelector(selectReadingSessions);
  const isBookLoading = useSelector(selectBooksLoading);
  const isPlanLoading = useSelector(selectReadingPlansLoading);
  
  const [refreshing, setRefreshing] = useState(false);
  
  // Form states for creating or editing a plan
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // Default to 30 days from now
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
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
  
  useEffect(() => {
    // If we have a book ID but no plan ID, fetch the book for creating a new plan
    if (bookId && !planId) {
      dispatch(fetchBookById(bookId));
    }
    
    // If we have a plan ID, fetch the plan and its sessions
    if (planId) {
      dispatch(fetchReadingPlanById(planId));
      dispatch(fetchReadingSessions());
    }
  }, [dispatch, bookId, planId]);
  
  // When plan data is loaded, populate form fields for editing
  useEffect(() => {
    if (plan && isEditMode) {
      setTitle(plan.title);
      setStartDate(new Date(plan.startDate));
      setEndDate(new Date(plan.endDate));
      setFrequency(plan.frequency);
      setPagesPerSession(plan.pagesPerSession.toString());
      setNotes(plan.notes || '');
    }
  }, [plan, isEditMode]);
  
  const onRefresh = async () => {
    setRefreshing(true);
    
    if (bookId && !planId) {
      await dispatch(fetchBookById(bookId));
    }
    
    if (planId) {
      await Promise.all([
        dispatch(fetchReadingPlanById(planId)),
        dispatch(fetchReadingSessions())
      ]);
    }
    
    setRefreshing(false);
  };
  
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString();
  };
  
  const calculateProgress = (plan) => {
    return (plan.currentPage / plan.totalPages) * 100;
  };
  
  const handleCreateOrUpdatePlan = () => {
    // Validate form
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your reading plan');
      return;
    }
    
    if (!pagesPerSession.trim() || isNaN(parseInt(pagesPerSession)) || parseInt(pagesPerSession) <= 0) {
      Alert.alert('Error', 'Please enter a valid number of pages per session');
      return;
    }
    
    if (startDate >= endDate) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }
    
    if (isEditMode && plan) {
      // Update existing plan
      dispatch(updateReadingPlan({
        id: plan.id,
        title,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        frequency,
        pagesPerSession: parseInt(pagesPerSession),
        notes: notes.trim() || undefined
      }));
      
      Alert.alert('Success', 'Reading plan updated successfully');
    } else if (book) {
      // Create new plan
      dispatch(createReadingPlan({
        bookId: book.id,
        title,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalPages: book.pageCount,
        frequency,
        pagesPerSession: parseInt(pagesPerSession),
        notes: notes.trim() || undefined
      }));
      
      Alert.alert(
        'Success', 
        'Reading plan created successfully',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Home')
          }
        ]
      );
    }
  };
  
  const handleLogSession = () => {
    if (!plan) return;
    
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
      bookId: plan.bookId,
      readingPlanId: plan.id,
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
  
  // Render the form for creating or editing a plan
  const renderPlanForm = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{isEditMode ? 'Edit Reading Plan' : 'Create Reading Plan'}</Title>
        
        {!isEditMode && book && (
          <View style={styles.bookInfo}>
            <Title style={styles.bookTitle}>{book.title}</Title>
            <Paragraph style={styles.bookAuthor}>by {book.author}</Paragraph>
            <Chip style={styles.bookPageCount}>{book.pageCount} pages</Chip>
          </View>
        )}
        
        <TextInput
          label="Plan Title"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
        
        <View style={styles.dateContainer}>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Start Date:</Text>
            <Button 
              mode="outlined" 
              onPress={() => setShowStartDatePicker(true)}
              style={styles.dateButton}
            >
              {formatDate(startDate)}
            </Button>
            <Portal>
              <Dialog visible={showStartDatePicker} onDismiss={() => setShowStartDatePicker(false)}>
                <Dialog.Title>Select Start Date</Dialog.Title>
                <Dialog.Content>
                  <View style={styles.datePickerContent}>
                    <View style={styles.datePickerHeader}>
                      <Button 
                        onPress={() => {
                          const prevMonth = new Date(startDate);
                          prevMonth.setMonth(prevMonth.getMonth() - 1);
                          setStartDate(prevMonth);
                        }}
                      >
                        Prev
                      </Button>
                      <Text style={styles.monthYearText}>
                        {startDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                      </Text>
                      <Button 
                        onPress={() => {
                          const nextMonth = new Date(startDate);
                          nextMonth.setMonth(nextMonth.getMonth() + 1);
                          setStartDate(nextMonth);
                        }}
                      >
                        Next
                      </Button>
                    </View>
                    
                    <View style={styles.calendar}>
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <Text key={day} style={styles.dayHeader}>{day}</Text>
                      ))}
                      
                      {Array.from({ length: 42 }).map((_, index) => {
                        const currentMonth = startDate.getMonth();
                        const currentYear = startDate.getFullYear();
                        
                        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
                        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
                        
                        const startOffset = firstDayOfMonth.getDay();
                        const daysInMonth = lastDayOfMonth.getDate();
                        
                        const day = index - startOffset + 1;
                        
                        if (day < 1 || day > daysInMonth) {
                          return <View key={index} style={styles.dayPlaceholder} />;
                        }
                        
                        const date = new Date(currentYear, currentMonth, day);
                        const isSelected = date.getDate() === startDate.getDate() && 
                                          date.getMonth() === startDate.getMonth() && 
                                          date.getFullYear() === startDate.getFullYear();
                        
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[styles.day, isSelected && styles.selectedDay]}
                            onPress={() => {
                              const selectedDate = new Date(startDate);
                              selectedDate.setDate(day);
                              setStartDate(selectedDate);
                            }}
                          >
                            <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={() => setShowStartDatePicker(false)}>Cancel</Button>
                  <Button onPress={() => setShowStartDatePicker(false)}>OK</Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>
          </View>
          
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>End Date:</Text>
            <Button 
              mode="outlined" 
              onPress={() => setShowEndDatePicker(true)}
              style={styles.dateButton}
            >
              {formatDate(endDate)}
            </Button>
            <Portal>
              <Dialog visible={showEndDatePicker} onDismiss={() => setShowEndDatePicker(false)}>
                <Dialog.Title>Select End Date</Dialog.Title>
                <Dialog.Content>
                  <View style={styles.datePickerContent}>
                    <View style={styles.datePickerHeader}>
                      <Button 
                        onPress={() => {
                          const prevMonth = new Date(endDate);
                          prevMonth.setMonth(prevMonth.getMonth() - 1);
                          setEndDate(prevMonth);
                        }}
                      >
                        Prev
                      </Button>
                      <Text style={styles.monthYearText}>
                        {endDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                      </Text>
                      <Button 
                        onPress={() => {
                          const nextMonth = new Date(endDate);
                          nextMonth.setMonth(nextMonth.getMonth() + 1);
                          setEndDate(nextMonth);
                        }}
                      >
                        Next
                      </Button>
                    </View>
                    
                    <View style={styles.calendar}>
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <Text key={day} style={styles.dayHeader}>{day}</Text>
                      ))}
                      
                      {Array.from({ length: 42 }).map((_, index) => {
                        const currentMonth = endDate.getMonth();
                        const currentYear = endDate.getFullYear();
                        
                        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
                        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
                        
                        const startOffset = firstDayOfMonth.getDay();
                        const daysInMonth = lastDayOfMonth.getDate();
                        
                        const day = index - startOffset + 1;
                        
                        if (day < 1 || day > daysInMonth) {
                          return <View key={index} style={styles.dayPlaceholder} />;
                        }
                        
                        const date = new Date(currentYear, currentMonth, day);
                        const isSelected = date.getDate() === endDate.getDate() && 
                                          date.getMonth() === endDate.getMonth() && 
                                          date.getFullYear() === endDate.getFullYear();
                        
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[styles.day, isSelected && styles.selectedDay]}
                            onPress={() => {
                              const selectedDate = new Date(endDate);
                              selectedDate.setDate(day);
                              setEndDate(selectedDate);
                            }}
                          >
                            <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={() => setShowEndDatePicker(false)}>Cancel</Button>
                  <Button onPress={() => setShowEndDatePicker(false)}>OK</Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>
          </View>
        </View>
        
        <Text style={styles.sectionLabel}>Reading Frequency:</Text>
        <View style={styles.frequencyButtons}>
          <Button
            mode={frequency === 'daily' ? 'contained' : 'outlined'}
            onPress={() => setFrequency('daily')}
            style={[styles.frequencyButton, { marginRight: 8 }]}
          >
            Daily
          </Button>
          <Button
            mode={frequency === 'weekly' ? 'contained' : 'outlined'}
            onPress={() => setFrequency('weekly')}
            style={styles.frequencyButton}
          >
            Weekly
          </Button>
        </View>
        
        <TextInput
          label="Pages Per Session"
          value={pagesPerSession}
          onChangeText={setPagesPerSession}
          keyboardType="number-pad"
          style={styles.input}
        />
        
        <TextInput
          label="Notes (Optional)"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={styles.input}
        />
        
        <Button 
          mode="contained" 
          onPress={handleCreateOrUpdatePlan}
          style={styles.submitButton}
          loading={isPlanLoading}
          disabled={isPlanLoading}
        >
          {isEditMode ? 'Update Plan' : 'Create Plan'}
        </Button>
      </Card.Content>
    </Card>
  );
  
  // Render plan details view
  const renderPlanDetails = () => {
    if (!plan) return null;
    
    const progress = plan.currentPage / plan.totalPages;
    const progressPercent = Math.round(progress * 100);
    const remainingPages = plan.totalPages - plan.currentPage;
    
    return (
      <View>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.planTitle}>{plan.title}</Title>
            
            {plan.book && (
              <View style={styles.bookInfo}>
                <Paragraph style={styles.bookDetails}>
                  {plan.book.title} by {plan.book.author}
                </Paragraph>
                <Chip style={styles.bookPageCount}>{plan.totalPages} pages</Chip>
              </View>
            )}
            
            <View style={styles.progressContainer}>
              <View style={styles.progressTextContainer}>
                <Text style={styles.progressText}>
                  {plan.currentPage} of {plan.totalPages} pages
                </Text>
                <Text style={styles.progressPercent}>
                  {progressPercent}% Complete
                </Text>
              </View>
              <ProgressBar 
                progress={progress}
                color="#6200ee"
                style={styles.progressBar}
              />
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Remaining</Text>
                <Text style={styles.statValue}>{remainingPages} pages</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Reading</Text>
                <Text style={styles.statValue}>
                  {plan.pagesPerSession} pages {plan.frequency === 'daily' ? 'per day' : 'per week'}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>
                  {formatDate(new Date(plan.startDate))} - {formatDate(new Date(plan.endDate))}
                </Text>
              </View>
            </View>
            
            {plan.notes && (
              <View style={styles.notesContainer}>
                <Title style={styles.sectionTitle}>Notes</Title>
                <Paragraph style={styles.notes}>{plan.notes}</Paragraph>
              </View>
            )}
            
            <View style={styles.actionButtons}>
              <Button 
                mode="contained" 
                onPress={() => setLogSessionVisible(true)}
                style={[styles.actionButton, { marginRight: 8 }]}
              >
                Log Reading Session
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => navigation.navigate('ReadingPlan', { planId: plan.id, isEdit: true })}
                style={styles.actionButton}
              >
                Edit Plan
              </Button>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Reading History</Title>
            
            {sessions.length === 0 ? (
              <Text style={styles.emptyText}>
                No reading sessions recorded yet. Start logging your progress!
              </Text>
            ) : (
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Date</DataTable.Title>
                  <DataTable.Title numeric>Pages</DataTable.Title>
                  <DataTable.Title numeric>Minutes</DataTable.Title>
                  <DataTable.Title numeric>Koach Points</DataTable.Title>
                </DataTable.Header>
                
                {sessions
                  .filter(session => session.readingPlanId === plan.id)
                  .slice(0, 5) // Show only the 5 most recent sessions
                  .map((session, index) => (
                    <DataTable.Row key={session.id || index}>
                      <DataTable.Cell>
                        {new Date(session.createdAt).toLocaleDateString()}
                      </DataTable.Cell>
                      <DataTable.Cell numeric>{session.pagesRead}</DataTable.Cell>
                      <DataTable.Cell numeric>{session.minutesSpent}</DataTable.Cell>
                      <DataTable.Cell numeric>{session.koachEarned}</DataTable.Cell>
                    </DataTable.Row>
                  ))}
              </DataTable>
            )}
          </Card.Content>
        </Card>
      </View>
    );
  };
  
  const isLoading = isBookLoading || isPlanLoading;
  
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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading...</Text>
          </View>
        ) : (
          <>
            {isEditMode && !route.params.isEdit ? renderPlanDetails() : renderPlanForm()}
          </>
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
    padding: 24,
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  bookInfo: {
    marginTop: 8,
    marginBottom: 16,
  },
  bookTitle: {
    fontSize: 20,
  },
  bookAuthor: {
    color: '#666',
  },
  bookPageCount: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  bookDetails: {
    fontSize: 16,
    color: '#666',
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
    flex: 1,
    marginRight: 8,
  },
  dateLabel: {
    marginBottom: 8,
    fontSize: 16,
  },
  dateButton: {
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  frequencyButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  frequencyButton: {
    flex: 1,
  },
  submitButton: {
    marginTop: 8,
  },
  planTitle: {
    fontSize: 24,
    marginBottom: 8,
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
    color: '#6200ee',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    padding: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  notesContainer: {
    marginVertical: 16,
  },
  notes: {
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 16,
  },
  dialogInput: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  // Date picker custom styles
  datePickerContent: {
    padding: 8,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayHeader: {
    width: '14.28%',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 12,
  },
  day: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayPlaceholder: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayText: {
    textAlign: 'center',
  },
  selectedDay: {
    backgroundColor: '#6200ee',
    borderRadius: 20,
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ReadingPlanScreen;