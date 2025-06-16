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
  Modal,
  useTheme,
  HelperText
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import CreatePlanModal from '../components/CreatePlanModal'; // Import the new modal
import { 
  fetchBookById, 
  selectCurrentBook,
  selectBooksLoading 
} from '../slices/booksSlice';
import { 
  // createReadingPlan, // Handled by CreatePlanModal
  updateReadingPlan,
  fetchReadingPlanById,
  fetchReadingSessions,
  logReadingSession,
  selectCurrentPlan,
  selectReadingSessions,
  selectReadingPlansLoading,
  fetchReadingPlans // To refresh list after creation/update
} from '../slices/readingPlansSlice';
import { selectUser } from '../slices/authSlice';
// import { StackNavigationProp } from '@react-navigation/stack'; // Not directly used in this snippet
// import { RouteProp } from '@react-navigation/native'; // Not directly used in this snippet
// import { RootStackParamList } from '../../App'; // Might be needed for full navigation typing
import { AppDispatch } from '../store';
import { useTranslation } from 'react-i18next';


interface ReadingPlanScreenProps {
  route: any; // Type this properly based on your navigation setup
  navigation: any; // Type this properly
}

const ReadingPlanScreen: React.FC<ReadingPlanScreenProps> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { planId, bookId, openCreateModal } = route.params || {}; // Added openCreateModal
  const dispatch = useDispatch<AppDispatch>();
  
  const user = useSelector(selectUser);
  const bookForNewPlan = useSelector(selectCurrentBook); // For when bookId is passed for new plan
  const planToEdit = useSelector(selectCurrentPlan); // Renamed for clarity
  const sessions = useSelector(selectReadingSessions);
  const isBookLoading = useSelector(selectBooksLoading);
  const isPlanLoading = useSelector(selectReadingPlansLoading);
  
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(openCreateModal || false);

  // Form states for EDITING a plan (Create is handled by modal)
  const [editTitle, setEditTitle] = useState('');
  const [editStartDate, setEditStartDate] = useState(new Date());
  const [editEndDate, setEditEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  // const [editFrequency, setEditFrequency] = useState<'daily' | 'weekly'>('daily'); // Keep if needed for edit
  const [editDailyGoal, setEditDailyGoal] = useState('');
  const [editNotes, setEditNotes] = useState('');
  
  const [titleError, setTitleError] = useState('');
  const [dailyGoalError, setDailyGoalError] = useState('');

  // Reading session tracking (remains the same)
  const [logSessionVisible, setLogSessionVisible] = useState(false);
  const [pagesRead, setPagesRead] = useState('');
  const [minutesSpent, setMinutesSpent] = useState('');
  
  // Date picker states for EDITING
  const [showEditStartDatePicker, setShowEditStartDatePicker] = useState(false);
  const [showEditEndDatePicker, setShowEditEndDatePicker] = useState(false);
  
  const isEditMode = !!planId; // This determines if we are viewing/editing an existing plan
  
  useEffect(() => {
    if (bookId && !planId) { // If bookId is provided, it's for creating a new plan
      dispatch(fetchBookById(bookId)); // Fetch book details for the modal
      // If `openCreateModal` is true, modal will open. Or trigger here:
      // setIsCreateModalVisible(true);
    }
    
    if (planId) { // If planId is provided, fetch this specific plan for viewing/editing
      dispatch(fetchReadingPlanById(planId));
      dispatch(fetchReadingSessions()); // Assuming sessions are tied to a plan
    }
  }, [dispatch, bookId, planId]);
  
  // Populate edit form when planToEdit data is loaded
  useEffect(() => {
    if (planToEdit && isEditMode) {
      setEditTitle(planToEdit.title || (planToEdit.book ? `Plan for ${planToEdit.book.title}`: 'My Reading Plan'));
      setEditStartDate(new Date(planToEdit.start_date));
      setEditEndDate(new Date(planToEdit.end_date));
      setEditDailyGoal(planToEdit.daily_goal?.toString() || '');
      // setEditFrequency(planToEdit.frequency); // If frequency is part of your model
      setEditNotes(planToEdit.notes || '');
    }
  }, [planToEdit, isEditMode]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (isEditMode && planId) {
      await dispatch(fetchReadingPlanById(planId));
      await dispatch(fetchReadingSessions());
    } else if (bookId && !planId) {
      await dispatch(fetchBookById(bookId)); // For the create modal context
    }
    // Potentially refresh all plans if this screen shows a list
    // await dispatch(fetchReadingPlans());
    setRefreshing(false);
  };
  
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(t('common.locale'), { year: 'numeric', month: 'long', day: 'numeric' });
  };
    
  const handleUpdatePlan = () => {
    if (!planToEdit) return;

    let isValid = true;
    if (!editTitle.trim()) {
      setTitleError(t('readingPlan.errors.titleRequired'));
      isValid = false;
    } else {
      setTitleError('');
    }

    const goal = parseInt(editDailyGoal, 10);
    if (isNaN(goal) || goal <= 0) {
      setDailyGoalError(t('readingPlan.errors.invalidPages'));
      isValid = false;
    } else {
      setDailyGoalError('');
    }

    if (editStartDate >= editEndDate) {
      Alert.alert(t('common.errorText'), t('readingPlan.errors.endDateAfterStart'));
      isValid = false;
    }
    if (!isValid) return;

    dispatch(updateReadingPlan({
      id: planToEdit.id,
      title: editTitle,
      startDate: editStartDate.toISOString(),
      endDate: editEndDate.toISOString(),
      dailyGoal: goal,
      notes: editNotes.trim() || undefined,
      // frequency: editFrequency, // if frequency is part of your model
    })).then((result) => {
      if (updateReadingPlan.fulfilled.match(result)) {
        Alert.alert(t('common.successTitle'), t('readingPlan.updateSuccessMessage'));
        navigation.goBack(); // Or navigate to plan details
      } else {
        Alert.alert(t('common.errorText'), result.payload as string || t('readingPlan.errors.failedUpdate'));
      }
    });
  };

  const handlePlanCreatedInModal = (newPlan: any) => {
    setIsCreateModalVisible(false);
    dispatch(fetchReadingPlans()); // Refresh all plans
    // Navigate to the new plan's detail screen or home
    // For now, let's assume it stays on this screen or goes back.
    // If this screen is a list of plans, it should update.
    // If it was opened specifically for creation, maybe navigate away.
    if (route.params?.openCreateModal) { // If opened specifically for creation
        navigation.goBack(); // Or navigate to 'Home' or the new plan's detail
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
  
  // Render the form for EDITING a plan
  const renderEditPlanForm = () => {
    if (!planToEdit) return <Text>{t('readingPlan.noPlanToEdit')}</Text>;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>{t('readingPlan.editPlanTitle')}</Title>
          
          {planToEdit.book && (
            <View style={styles.bookInfo}>
              <Chip
                icon="book"
                style={styles.bookChip}
                textStyle={styles.bookChipText}
                onPress={() => navigation.navigate('BookDetail', { bookId: planToEdit.book.id.toString() })}
              >
                {planToEdit.book.title}
              </Chip>
            </View>
          )}

          <TextInput
            label={t('readingPlan.planNameLabel')}
            value={editTitle}
            onChangeText={setEditTitle}
            style={styles.input}
            mode="outlined"
            error={!!titleError}
            theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
          />
          <HelperText type="error" visible={!!titleError}>{titleError}</HelperText>

          <TouchableOpacity onPress={() => setShowEditStartDatePicker(true)} style={styles.dateDisplay}>
            <TextInput
              label={t('readingPlan.startDateLabel')}
              value={formatDate(editStartDate)}
              editable={false}
              mode="outlined"
              style={styles.input}
              right={<TextInput.Icon icon="calendar" />}
              theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
            />
          </TouchableOpacity>
          {showEditStartDatePicker && (
            <DateTimePicker
              value={editStartDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => { setShowEditStartDatePicker(false); if (date) setEditStartDate(date);}}
            />
          )}

          <TouchableOpacity onPress={() => setShowEditEndDatePicker(true)} style={styles.dateDisplay}>
            <TextInput
              label={t('readingPlan.finishDateLabel')}
              value={formatDate(editEndDate)}
              editable={false}
              mode="outlined"
              style={styles.input}
              right={<TextInput.Icon icon="calendar" />}
              theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
            />
          </TouchableOpacity>
          {showEditEndDatePicker && (
            <DateTimePicker
              value={editEndDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => { setShowEditEndDatePicker(false); if (date) setEditEndDate(date);}}
              minimumDate={new Date(editStartDate.getTime() + 24 * 60 * 60 * 1000)}
            />
          )}

          <TextInput
            label={t('readingPlan.dailyGoalLabel')}
            value={editDailyGoal}
            onChangeText={setEditDailyGoal}
            keyboardType="number-pad"
            style={styles.input}
            mode="outlined"
            error={!!dailyGoalError}
            theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
          />
          <HelperText type="error" visible={!!dailyGoalError}>{dailyGoalError}</HelperText>

          <TextInput
            label={t('readingPlan.notesLabel')}
            value={editNotes}
            onChangeText={setEditNotes}
            multiline
            numberOfLines={3}
            style={styles.input}
            mode="outlined"
            theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
          />

          <Button
            mode="contained"
            onPress={handleUpdatePlan}
            style={styles.submitButton}
            loading={isPlanLoading}
            disabled={isPlanLoading}
            buttonColor={theme.colors.primary}
          >
            {t('readingPlan.updatePlanButton')}
          </Button>
        </Card.Content>
      </Card>
    );
  }
  
  // Render plan details view (remains mostly the same, simplified for brevity)
  const renderPlanDetails = () => {
    if (!planToEdit) return <Text>{t('readingPlan.noPlanDetails')}</Text>; // Or some placeholder/loading
    
    const progress = planToEdit.current_page / (planToEdit.book?.total_pages || planToEdit.total_pages || 1); // Handle missing book/totalPages
    const progressPercent = Math.round(progress * 100);
    const remainingPages = (planToEdit.book?.total_pages || planToEdit.total_pages || 0) - planToEdit.current_page;
    
    return (
      <View>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.planTitle}>{planToEdit.title}</Title>
            
            {planToEdit.book && (
              <Chip icon="book" style={styles.bookChip} onPress={() => navigation.navigate('BookDetail', { bookId: planToEdit.book.id.toString() })}>
                {planToEdit.book.title} - {planToEdit.book.author}
              </Chip>
            )}
            
            <View style={styles.progressContainer}>
              <View style={styles.progressTextContainer}>
                <Text style={styles.progressText}>
                  {planToEdit.current_page} of {planToEdit.book?.total_pages || planToEdit.total_pages || 'N/A'} {t('book.pages')}
                </Text>
                <Text style={[styles.progressPercent, {color: theme.colors.primary}]}>
                  {progressPercent}% {t('common.complete')}
                </Text>
              </View>
              <ProgressBar 
                progress={progress}
                color={theme.colors.primary}
                style={styles.progressBar}
              />
            </View>
            
            {/* Simplified stats for brevity, can be expanded */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}><Text style={styles.statLabel}>{t('readingPlan.dailyGoal')}</Text><Text style={styles.statValue}>{planToEdit.daily_goal} {t('readingPlan.pagesPerDay')}</Text></View>
                <View style={styles.statItem}><Text style={styles.statLabel}>{t('readingPlan.remaining')}</Text><Text style={styles.statValue}>{remainingPages} {t('book.pages')}</Text></View>
            </View>
             <View style={styles.statsContainer}>
                <View style={styles.statItem}><Text style={styles.statLabel}>{t('readingPlan.startDate')}</Text><Text style={styles.statValue}>{formatDate(new Date(planToEdit.start_date))}</Text></View>
                <View style={styles.statItem}><Text style={styles.statLabel}>{t('readingPlan.endDate')}</Text><Text style={styles.statValue}>{formatDate(new Date(planToEdit.end_date))}</Text></View>
            </View>
            
            {planToEdit.notes && (
              <View style={styles.notesContainer}>
                <Title style={styles.sectionTitle}>{t('readingPlan.notes')}</Title>
                <Paragraph style={styles.notes}>{planToEdit.notes}</Paragraph>
              </View>
            )}
            
            <View style={styles.actionButtons}>
              <Button 
                mode="contained" 
                icon="plus-circle-outline"
                onPress={() => setLogSessionVisible(true)}
                style={[styles.actionButton, { marginRight: 8, backgroundColor: theme.colors.primary }]}
              >
                {t('readingPlan.logSession')}
              </Button>
              <Button 
                mode="outlined" 
                icon="pencil-outline"
                onPress={() => navigation.setParams({ isEditingPlan: true })} // Trigger edit mode on this screen
                style={[styles.actionButton, {borderColor: theme.colors.primary}]}
                textColor={theme.colors.primary}
              >
                {t('readingPlan.editPlanButton')}
              </Button>
            </View>
          </Card.Content>
        </Card>
        
        {/* Reading History (simplified) */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>{t('readingPlan.history')}</Title>
            {sessions.filter(s => s.readingPlanId === planToEdit.id).length === 0 ? (
              <Text style={styles.emptyText}>{t('readingPlan.noSessions')}</Text>
            ) : (
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>{t('readingPlan.historyCols.date')}</DataTable.Title>
                  <DataTable.Title numeric>{t('readingPlan.historyCols.pages')}</DataTable.Title>
                  <DataTable.Title numeric>{t('readingPlan.historyCols.time')}</DataTable.Title>
                </DataTable.Header>
                {sessions.filter(s => s.readingPlanId === planToEdit.id).slice(0,5).map(s => (
                  <DataTable.Row key={s.id}><DataTable.Cell>{new Date(s.createdAt).toLocaleDateString()}</DataTable.Cell><DataTable.Cell numeric>{s.pagesRead}</DataTable.Cell><DataTable.Cell numeric>{s.minutesSpent || 0}</DataTable.Cell></DataTable.Row>
                ))}
              </DataTable>
            )}
          </Card.Content>
        </Card>
      </View>
    );
  };
  
  const isLoading = isBookLoading || (isPlanLoading && !planToEdit); // Show loading if plan data isn't there yet for edit/view
  const isActuallyEditing = route.params?.isEditingPlan === true && isEditMode;
  
  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]}/>}
      >
        {isLoading && <ActivityIndicator animating={true} color={theme.colors.primary} size="large" style={styles.loadingIndicator} />}

        {!isLoading && isEditMode && !isActuallyEditing && renderPlanDetails()}
        {!isLoading && isEditMode && isActuallyEditing && renderEditPlanForm()}
        {!isLoading && !isEditMode && bookForNewPlan && ( // Should open modal automatically or guide user
            <View style={styles.centeredMessage}>
                <Button icon="plus-circle" mode="contained" onPress={() => setIsCreateModalVisible(true)}>
                    {t('readingPlan.createPlanFor', { title: bookForNewPlan.title })}
                </Button>
            </View>
        )}
         {!isLoading && !isEditMode && !bookForNewPlan && (
             <View style={styles.centeredMessage}>
                <Text>{t('readingPlan.noPlanSelected')}</Text>
                {/* Optionally, add a button to navigate to book selection or home */}
             </View>
         )}
      </ScrollView>
      
      {/* Create Plan Modal Triggered by navigation param or button */}
      {bookForNewPlan && (
        <CreatePlanModal
          visible={isCreateModalVisible}
          onClose={() => {
            setIsCreateModalVisible(false);
            // If modal was opened by param, go back or clear param
            if (route.params?.openCreateModal) navigation.setParams({ openCreateModal: false });
          }}
          bookId={bookForNewPlan.id}
          bookTitle={bookForNewPlan.title}
          totalPages={bookForNewPlan.total_pages || bookForNewPlan.pageCount}
          onPlanCreated={handlePlanCreatedInModal}
        />
      )}

      {/* Log Session Dialog (existing) */}
      <Portal>
        <Dialog visible={logSessionVisible} onDismiss={() => setLogSessionVisible(false)} style={{backgroundColor: theme.colors.surface}}>
          <Dialog.Title style={{color: theme.colors.text}}>{t('readingPlan.logSessionTitle')}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={t('readingPlan.pagesReadLabel')}
              value={pagesRead}
              onChangeText={setPagesRead}
              keyboardType="number-pad"
              style={styles.dialogInput}
              mode="outlined"
              theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
            />
            <TextInput
              label={t('readingPlan.minutesSpentLabel')}
              value={minutesSpent}
              onChangeText={setMinutesSpent}
              keyboardType="number-pad"
              style={styles.dialogInput}
              mode="outlined"
              theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogSessionVisible(false)} textColor={theme.colors.text}>{t('common.cancel')}</Button>
            <Button onPress={handleLogSession} textColor={theme.colors.primary}>{t('readingPlan.logButton')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
       <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          // If there's a book context (e.g. from a previous navigation or a default one)
          // dispatch(fetchBookById(SOME_DEFAULT_OR_LAST_BOOK_ID_IF_AVAILABLE));
          // Then open modal. For now, assumes bookForNewPlan might be available or needs selection.
          // This FAB might be better on a screen listing books if no book context here.
          if (bookId) { // If a book context exists (e.g. from a previous screen or default)
            dispatch(fetchBookById(bookId)); // Ensure book details are loaded
            setIsCreateModalVisible(true);
          } else {
            // TODO: Implement book selection flow before opening create plan modal
            Alert.alert(t('common.infoTitle'), t('readingPlan.selectBookForNewPlan'));
            // navigation.navigate('BookSelectionScreen'); // Example
          }
        }}
        visible={!isEditMode} // Show FAB only if not editing/viewing a specific plan
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#f5f5f5', // Handled by theme
  },
  loadingContainer: {
  loadingIndicator: {
    marginTop: 50,
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200, // Ensure it's visible
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  bookInfo: {
    marginBottom: 16,
  },
  bookChip: {
    // backgroundColor: theme.colors.surfaceVariant, // Example theming
  },
  bookChipText: {
    // color: theme.colors.onSurfaceVariant, // Example theming
  },
  input: {
    marginBottom: 8, // Reduced margin for denser form
    // backgroundColor: 'white', // Handled by theme
  },
  dateDisplay: { // For TouchableOpacity wrapping TextInput
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 8, // Make button larger
  },
  planTitle: {
    fontSize: 22, // Slightly smaller than modal
    marginBottom: 12,
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
    // color: '#666', // Handled by theme
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    // color: '#6200ee', // Handled by theme
  },
  progressBar: {
    height: 8, // Slightly thicker
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Better distribution
    marginVertical: 8, // Reduced margin
  },
  statItem: {
    alignItems: 'center', // Center align stat items
    padding: 8,
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    // color: '#666', // Handled by theme
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15, // Slightly larger
    fontWeight: 'bold',
  },
  sectionTitle: { // For "Notes", "Reading History"
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  notesContainer: {
    marginVertical: 8,
  },
  notes: {
    lineHeight: 20,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Space out buttons
    marginTop: 20,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1, // Make buttons take equal width
    marginHorizontal: 8, // Add space between buttons
  },
  emptyText: {
    textAlign: 'center',
    // color: '#666', // Handled by theme
    marginVertical: 16,
    fontSize: 14,
  },
  dialogInput: {
    marginBottom: 16,
    // backgroundColor: 'white', // Handled by theme
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  // Custom date picker styles from original form are removed as they are no longer used
  // Ensure styles for TextInput used with date pickers are appropriate (e.g., styles.input)
});

export default ReadingPlanScreen;