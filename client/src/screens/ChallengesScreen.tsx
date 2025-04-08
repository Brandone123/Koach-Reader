import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  Chip,
  ProgressBar,
  FAB,
  Modal,
  Portal,
  TextInput,
  Divider,
  RadioButton,
  Menu,
  List,
  Checkbox,
  IconButton,
  HelperText,
  Switch as PaperSwitch,
  Dialog
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import { selectUser } from '../slices/authSlice';
import { fetchApi } from '../utils/api';
import { mockFetchApi } from '../utils/mockApi';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Challenge } from '../slices/challengesSlice';
import { Book } from '../slices/booksSlice';

type ChallengesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Challenges'>;

interface ChallengesScreenProps {
  navigation: ChallengesScreenNavigationProp;
}

interface Category {
  id: string;
  name: string;
}

const ChallengesScreen: React.FC<ChallengesScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [myChallenges, setMyChallenges] = useState<Challenge[]>([]);
  const [publicChallenges, setPublicChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');
  const [modalVisible, setModalVisible] = useState(false);
  
  // New challenge form
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeDescription, setChallengeDescription] = useState('');
  const [goalType, setGoalType] = useState<'pages' | 'books' | 'minutes'>('pages');
  const [goalValue, setGoalValue] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default to 7 days from now
  const [isPrivate, setIsPrivate] = useState(false);
  
  // New states for enhanced dialog
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [bookMenuVisible, setBookMenuVisible] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [formErrors, setFormErrors] = useState({
    title: '',
    goal: '',
    startDate: '',
    endDate: ''
  });
  
  // API data
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  useEffect(() => {
    fetchChallenges();
    fetchBooks();
    fetchCategories();
  }, []);
  
  const fetchBooks = async () => {
    try {
      // Use the mockApi to fetch books
      const mockData = await mockFetchApi('/api/books');
      setBooks(mockData);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    }
  };
  
  const fetchCategories = async () => {
    try {
      // Use the mockApi to fetch categories
      const mockData = await mockFetchApi('/api/categories');
      setCategories(mockData);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };
  
  const fetchChallenges = async () => {
    setIsLoading(true);
    try {
      // Use the mock API directly
        const mockData = await mockFetchApi('/api/challenges');
        handleChallengesData(mockData);
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChallengesData = (data: Challenge[]) => {
    setChallenges(data);
    
    // Only filter for user's challenges if user is logged in
    if (user) {
    // Filter for user's challenges
    const userChallenges = data.filter(challenge => 
        challenge.creatorId === user.id || challenge.status === 'active'
    );
    setMyChallenges(userChallenges);
    
    // Filter for public challenges user is not part of
    const otherChallenges = data.filter(challenge => 
      !challenge.isPrivate && 
        challenge.creatorId !== user.id && 
      challenge.status !== 'active'
    );
    setPublicChallenges(otherChallenges);
    } else {
      // If no user is logged in, show all public challenges
      const publicChallenges = data.filter(challenge => !challenge.isPrivate);
      setPublicChallenges(publicChallenges);
      setMyChallenges([]);
    }
  };
  
  const createChallenge = async () => {
    // Reset form errors
    const errors = {
      title: '',
      goal: '',
      startDate: '',
      endDate: ''
    };
    let hasError = false;
    
    if (!user) {
      Alert.alert(t('common.errorGeneric'), t('auth.loginRequired'));
      return;
    }
    
    if (!challengeTitle.trim()) {
      errors.title = t('validation.required');
      hasError = true;
    }
    
    if (!goalValue || isNaN(Number(goalValue)) || Number(goalValue) <= 0) {
      errors.goal = t('validation.invalidFormat');
      hasError = true;
    }
    
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to start of day
    
    if (startDate < now) {
      errors.startDate = t('validation.dateMustBeFuture');
      hasError = true;
    }
    
    if (endDate <= startDate) {
      errors.endDate = t('validation.endDateMustBeAfterStart');
      hasError = true;
    }
    
    if (hasError) {
      setFormErrors(errors);
      return;
    }
    
    const newChallenge = {
      title: challengeTitle,
      description: challengeDescription,
      creatorId: user?.id || 0,
      creatorName: user?.username || '',
      startDate: startDate.toISOString().split('T')[0], // Just the date portion in YYYY-MM-DD format
      endDate: endDate.toISOString().split('T')[0], // Just the date portion in YYYY-MM-DD format
      goal: Number(goalValue),
      goalType,
      bookId: selectedBook ? selectedBook.id : undefined,
      bookTitle: selectedBook?.title,
      categoryId: selectedCategory ? Number(selectedCategory.id) : undefined,
      categoryName: selectedCategory?.name,
      isPrivate,
      participantCount: 1, // Creator is first participant
    };
    
    setIsLoading(true);
    try {
      // Use mock API directly
        const mockResponse = await mockFetchApi('/api/challenges', {
          method: 'POST',
          body: newChallenge
        });
        
        // Update challenge lists
      const updatedChallenges = [...challenges, mockResponse as Challenge];
        handleChallengesData(updatedChallenges);
        
        // Reset form and close modal
        resetForm();
        setModalVisible(false);
        
      Alert.alert(t('common.success'), t('challenges.createdSuccess'));
    } catch (error) {
      console.error('Failed to create challenge:', error);
      Alert.alert(t('common.errorGeneric'), t('challenges.createError'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const joinChallenge = async (challengeId: number) => {
    setIsLoading(true);
    try {
      // Use the mock API directly
        await mockFetchApi(`/api/challenges/${challengeId}/join`, {
          method: 'POST'
        });
        
        // Update the challenge in our lists
      const updatedChallenges = challenges.map(challenge => {
        if (challenge.id === challengeId) {
          return {
            ...challenge,
            status: 'active' as const,
            myProgress: 0
          };
        }
        return challenge;
      });
      
        handleChallengesData(updatedChallenges);
        
        Alert.alert('Success', 'You have joined the challenge!');
    } catch (error) {
      console.error('Failed to join challenge:', error);
        Alert.alert('Error', 'Failed to join challenge');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setChallengeTitle('');
    setChallengeDescription('');
    setGoalType('pages');
    setGoalValue('');
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default to 7 days from now
    setIsPrivate(false);
    setSelectedBook(null);
    setSelectedCategory(null);
    setFormErrors({
      title: '',
      goal: '',
      startDate: '',
      endDate: ''
    });
  };
  
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString();
  };
  
  const calculateProgress = (challenge: Challenge) => {
    return challenge.myProgress ? (challenge.myProgress / challenge.goal) * 100 : 0;
  };
  
  const getGoalTypeLabel = (type: 'pages' | 'books' | 'minutes') => {
    switch (type) {
      case 'pages': return t('challenges.pages');
      case 'books': return t('challenges.books');
      case 'minutes': return t('challenges.minutes');
    }
  };
  
  // Format date for display with more detailed format
  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Date picker handlers (simplified versions)
  const onStartDateChange = (selectedDate: Date) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
    
    if (selectedDate < now) {
      Alert.alert(
        t('validation.invalidDate'),
        t('validation.dateMustBeFuture')
      );
      return;
    }
    
    setStartDate(selectedDate);
    
    // If end date exists and is before the new start date, update it
    if (endDate <= selectedDate) {
      const newEndDate = new Date(selectedDate);
      newEndDate.setDate(newEndDate.getDate() + 1);
      setEndDate(newEndDate);
    }
  };
  
  const onEndDateChange = (selectedDate: Date) => {
    // Ensure selected date is after start date
    if (selectedDate <= startDate) {
      Alert.alert(
        t('validation.invalidDate'),
        t('validation.endDateMustBeAfterStart')
      );
      return;
    }
    
    setEndDate(selectedDate);
  };
  
  const renderChallengeItem = ({ item }: { item: Challenge }) => {
    const isCreator = user ? item.creatorId === user.id : false;
    const progress = calculateProgress(item);
    const isActive = item.status === 'active' || isCreator;
    
    // Convert string dates from API to Date objects
    const startDate = new Date(item.startDate);
    const endDate = new Date(item.endDate);
    
    return (
      <Card 
        style={[
          styles.challengeCard, 
          isCreator && styles.creatorCard,
          item.status === 'completed' && styles.completedCard
        ]}
        onPress={() => navigation.navigate('ChallengeDetail', { challengeId: String(item.id) })}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.challengeTitle}>{item.title}</Title>
            {isCreator && (
              <Chip icon="crown" style={styles.creatorChip}>{t('challenges.creator')}</Chip>
            )}
            {item.status === 'completed' && (
              <Chip icon="check-circle" style={styles.completedChip}>{t('challenges.completed')}</Chip>
            )}
          </View>
          
          <Paragraph style={styles.challengeDescription}>{item.description}</Paragraph>
          
          <View style={styles.challengeDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('challenges.goal')}:</Text>
              <Text style={styles.detailValue}>
                {item.goal} {getGoalTypeLabel(item.goalType)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('challenges.startDate')}:</Text>
              <Text style={styles.detailValue}>{formatDate(startDate)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('challenges.endDate')}:</Text>
              <Text style={styles.detailValue}>{formatDate(endDate)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('challenges.participants')}:</Text>
              <Text style={styles.detailValue}>{item.participantCount}</Text>
            </View>
          </View>
          
          {isActive && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {t('challenges.progress')}: {item.myProgress || 0} / {item.goal} ({Math.round(progress)}%)
              </Text>
              <ProgressBar 
                progress={progress / 100} 
                color={progress >= 100 ? '#4CAF50' : '#6200ee'} 
                style={styles.progressBar} 
              />
            </View>
          )}
          
          {activeTab === 'public' && !isActive && (
            <Button 
              mode="contained" 
              onPress={() => joinChallenge(item.id)}
              style={styles.joinButton}
            >
              {t('challenges.joinChallenge')}
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Avatar.Icon size={80} icon="trophy" style={styles.emptyIcon} />
      <Text style={styles.emptyText}>
        {activeTab === 'my' 
          ? t('challenges.noMyChallenges')
          : t('challenges.noPublicChallenges')}
      </Text>
      {activeTab === 'my' && (
        <Button 
          mode="contained" 
          onPress={() => setModalVisible(true)}
          style={styles.createButtonEmpty}
        >
          {t('challenges.createChallenge')}
        </Button>
      )}
    </View>
  );
  
  // Enhanced challenge creation modal
  const renderChallengeCreationModal = () => (
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
        <View style={styles.modalHeaderContainer}>
          <View style={styles.modalHeader}>
            <Title style={styles.modalTitle}>{t('challenges.createNewChallenge')}</Title>
            <IconButton 
              icon="close" 
              size={24} 
              onPress={() => {
                resetForm();
                setModalVisible(false);
              }}
              style={styles.closeButton}
              iconColor="white"
            />
          </View>
        </View>
        
          <ScrollView style={styles.modalScrollView}>
          {/* <Divider style={styles.divider} /> */}
            
            <TextInput
            label={t('challenges.challengeTitle')}
              value={challengeTitle}
              onChangeText={setChallengeTitle}
              style={styles.input}
            mode="outlined"
            error={!!formErrors.title}
            />
          {!!formErrors.title && <HelperText type="error">{formErrors.title}</HelperText>}
            
            <TextInput
            label={t('challenges.description')}
              value={challengeDescription}
              onChangeText={setChallengeDescription}
              multiline
              numberOfLines={3}
              style={styles.input}
            mode="outlined"
            />
            
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>{t('challenges.challengeGoal')}</Text>
            <View style={styles.goalTypeContainer}>
              <RadioButton.Group 
                onValueChange={value => setGoalType(value as 'pages' | 'books' | 'minutes')} 
                value={goalType}
              >
                <View style={styles.radioOption}>
                  <RadioButton value="pages" />
                  <Text>{t('challenges.pages')}</Text>
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton value="books" />
                  <Text>{t('challenges.books')}</Text>
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton value="minutes" />
                  <Text>{t('challenges.minutes')}</Text>
                </View>
              </RadioButton.Group>
            </View>
            
            <TextInput
              label={t('challenges.goalValue')}
              value={goalValue}
              onChangeText={setGoalValue}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
              error={!!formErrors.goal}
            />
            {!!formErrors.goal && <HelperText type="error">{formErrors.goal}</HelperText>}
            {!formErrors.goal && (
              <HelperText type="info">
                {goalType === 'pages' && t('challenges.examplePagesGoal', { example: '500' })}
                {goalType === 'books' && t('challenges.exampleBooksGoal', { example: '3' })}
                {goalType === 'minutes' && t('challenges.exampleMinutesGoal', { example: '1000' })}
              </HelperText>
            )}
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.dateContainer}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>{t('challenges.startDateLabel')}</Text>
              <Button 
                mode="outlined" 
                onPress={() => setShowStartDatePicker(true)}
                style={styles.dateButton}
              >
                {formatDate(startDate)}
              </Button>
              {!!formErrors.startDate && <HelperText type="error">{formErrors.startDate}</HelperText>}
              
              <Portal>
                <Dialog visible={showStartDatePicker} onDismiss={() => setShowStartDatePicker(false)}>
                  <Dialog.Title>{t('challenges.selectStartDate')}</Dialog.Title>
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
                          {t('common.prev')}
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
                          {t('common.next')}
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
                          const now = new Date();
                          now.setHours(0, 0, 0, 0);
                          
                          // Check if this date is in the past
                          const isPastDate = date < now;
                          
                          const isSelected = date.getDate() === startDate.getDate() && 
                                            date.getMonth() === startDate.getMonth() && 
                                            date.getFullYear() === startDate.getFullYear();
                          
                          return (
                            <TouchableOpacity
                              key={index}
                              style={[
                                styles.day, 
                                isSelected && styles.selectedDay,
                                isPastDate && styles.disabledDay
                              ]}
                              onPress={() => {
                                if (!isPastDate) {
                                  const selectedDate = new Date(startDate);
                                  selectedDate.setDate(day);
                                  setStartDate(selectedDate);
                                } else {
                                  Alert.alert(
                                    t('validation.invalidDate'),
                                    t('validation.dateMustBeFuture')
                                  );
                                }
                              }}
                              disabled={isPastDate}
                            >
                              <Text style={[
                                styles.dayText, 
                                isSelected && styles.selectedDayText,
                                isPastDate && styles.disabledDayText
                              ]}>
                                {day}
            </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </Dialog.Content>
                  <Dialog.Actions>
                    <Button onPress={() => setShowStartDatePicker(false)}>{t('common.cancel')}</Button>
                    <Button onPress={() => setShowStartDatePicker(false)}>{t('common.ok')}</Button>
                  </Dialog.Actions>
                </Dialog>
              </Portal>
            </View>
            
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>{t('challenges.endDateLabel')}</Text>
              <Button 
                mode="outlined" 
                onPress={() => setShowEndDatePicker(true)}
                style={styles.dateButton}
              >
                {formatDate(endDate)}
              </Button>
              {!!formErrors.endDate && <HelperText type="error">{formErrors.endDate}</HelperText>}
              
              <Portal>
                <Dialog visible={showEndDatePicker} onDismiss={() => setShowEndDatePicker(false)}>
                  <Dialog.Title>{t('challenges.selectEndDate')}</Dialog.Title>
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
                          {t('common.prev')}
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
                          {t('common.next')}
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
                          
                          // Minimum date is either today or the start date
                          const minDate = new Date(Math.max(startDate.getTime(), new Date().setHours(0, 0, 0, 0)));
                          
                          // Check if this date is before the min date
                          const isTooEarly = date < minDate;
                          
                          const isSelected = date.getDate() === endDate.getDate() && 
                                            date.getMonth() === endDate.getMonth() && 
                                            date.getFullYear() === endDate.getFullYear();
                          
                          return (
                            <TouchableOpacity
                              key={index}
                              style={[
                                styles.day, 
                                isSelected && styles.selectedDay,
                                isTooEarly && styles.disabledDay
                              ]}
                              onPress={() => {
                                if (!isTooEarly) {
                                  const selectedDate = new Date(endDate);
                                  selectedDate.setDate(day);
                                  setEndDate(selectedDate);
                                } else {
                                  const errorMessage = date < startDate
                                    ? t('validation.endDateMustBeAfterStart')
                                    : t('validation.dateMustBeFuture');
                                    
                                  Alert.alert(
                                    t('validation.invalidDate'),
                                    errorMessage
                                  );
                                }
                              }}
                              disabled={isTooEarly}
                            >
                              <Text style={[
                                styles.dayText, 
                                isSelected && styles.selectedDayText,
                                isTooEarly && styles.disabledDayText
                              ]}>
                                {day}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </Dialog.Content>
                  <Dialog.Actions>
                    <Button onPress={() => setShowEndDatePicker(false)}>{t('common.cancel')}</Button>
                    <Button onPress={() => setShowEndDatePicker(false)}>{t('common.ok')}</Button>
                  </Dialog.Actions>
                </Dialog>
              </Portal>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>{t('challenges.specificBook')}</Text>
            <Menu
              visible={bookMenuVisible}
              onDismiss={() => setBookMenuVisible(false)}
              anchor={
                <TouchableOpacity 
                  style={styles.selectMenuButton}
                  onPress={() => setBookMenuVisible(true)}
                >
                  <Text style={styles.selectMenuText}>
                    {selectedBook ? selectedBook.title : t('challenges.selectBook')}
                  </Text>
                  <IconButton icon="menu-down" size={24} />
                </TouchableOpacity>
              }
            >
              <Menu.Item 
                onPress={() => {
                  setSelectedBook(null);
                  setBookMenuVisible(false);
                }} 
                title={t('challenges.noSpecificBook')} 
              />
              <Divider />
              {books.map(book => (
                <Menu.Item 
                  key={book.id}
                  onPress={() => {
                    setSelectedBook(book);
                    setBookMenuVisible(false);
                  }} 
                  title={`${book.title} (${book.author})`} 
                />
              ))}
            </Menu>
          </View>
          
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>{t('challenges.category')}</Text>
            <Menu
              visible={categoryMenuVisible}
              onDismiss={() => setCategoryMenuVisible(false)}
              anchor={
                <TouchableOpacity 
                  style={styles.selectMenuButton}
                  onPress={() => setCategoryMenuVisible(true)}
                >
                  <Text style={styles.selectMenuText}>
                    {selectedCategory ? selectedCategory.name : t('challenges.selectCategory')}
                  </Text>
                  <IconButton icon="menu-down" size={24} />
                </TouchableOpacity>
              }
            >
              <Menu.Item 
                onPress={() => {
                  setSelectedCategory(null);
                  setCategoryMenuVisible(false);
                }} 
                title={t('challenges.anyCategory')} 
              />
              <Divider />
              {categories.map(category => (
                <Menu.Item 
                  key={category.id}
                  onPress={() => {
                    setSelectedCategory(category);
                    setCategoryMenuVisible(false);
                  }} 
                  title={category.name} 
                />
              ))}
            </Menu>
          </View>
          
          <Divider style={styles.divider} />
            
            <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>{t('challenges.privateChallenge')}</Text>
            <PaperSwitch
                value={isPrivate}
                onValueChange={setIsPrivate}
              color="#9317ED"
              />
            </View>
            
            <Text style={styles.privateHint}>
            {t('challenges.privateHint')}
            </Text>
              
              <Button 
                mode="contained" 
                onPress={createChallenge}
            style={styles.createButton}
                loading={isLoading}
                disabled={isLoading}
              >
            {t('common.create')}
              </Button>
          </ScrollView>
        </Modal>
      </Portal>
  );
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#9317ED', '#5E0D93']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.subtitle}>{t('challenges.subtitle')}</Text>
          
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'my' && styles.activeTab]}
              onPress={() => setActiveTab('my')}
            >
              <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
                {t('challenges.myChallenges')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'public' && styles.activeTab]}
              onPress={() => setActiveTab('public')}
            >
              <Text style={[styles.tabText, activeTab === 'public' && styles.activeTabText]}>
                {t('challenges.publicChallenges')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : (
        activeTab === 'my' ? (
          myChallenges.length > 0 ? (
            <FlatList
              data={myChallenges}
              renderItem={renderChallengeItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.challengesList}
            />
          ) : renderEmptyState()
        ) : (
          publicChallenges.length > 0 ? (
            <FlatList
              data={publicChallenges}
              renderItem={renderChallengeItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.challengesList}
            />
          ) : renderEmptyState()
        )
      )}
      
      {renderChallengeCreationModal()}
      
      {activeTab === 'my' && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => setModalVisible(true)}
          label={t('challenges.newChallenge')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 115,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 15,
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'white',
    fontSize: 20,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: 'white',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
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
  challengesList: {
    padding: 16,
  },
  challengeCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
  },
  creatorCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#ffd700',
  },
  completedCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  challengeTitle: {
    flex: 1,
    fontSize: 18,
    marginBottom: 8,
  },
  creatorChip: {
    backgroundColor: '#FFF8E1',
    marginLeft: 8,
  },
  completedChip: {
    backgroundColor: '#E8F5E9',
    marginLeft: 8,
  },
  challengeDescription: {
    marginBottom: 16,
    color: '#555',
  },
  challengeDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    width: 100,
    fontWeight: 'bold',
    color: '#666',
  },
  detailValue: {
    flex: 1,
    color: '#333',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressText: {
    marginBottom: 4,
    fontSize: 14,
    color: '#555',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  joinButton: {
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    backgroundColor: '#9317ED',
    opacity: 0.8,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButtonEmpty: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#9317ED',
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    maxHeight: '90%',
    padding: 0,
    overflow: 'hidden',
  },
  modalHeaderContainer: {
    backgroundColor: '#9317ED',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    width: '100%'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    position: 'relative',
  },
  modalTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    position: 'absolute',
    left: 8,
    top: 12,
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  divider: {
    marginVertical: 12,
    height: 1,
    backgroundColor: '#ddd',
  },
  input: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  sectionContainer: {
    padding: 16,
  },
  dateContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  dateField: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  goalTypeContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  privateHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  createButton: {
    margin: 16,
    paddingVertical: 8,
    backgroundColor: '#9317ED',
  },
  dateButton: {
    marginHorizontal: 16,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#B00020',
  },
  selectMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginHorizontal: 16,
    paddingLeft: 12,
  },
  selectMenuText: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  datePickerContent: {
    padding: 12,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayHeader: {
    width: '14.28%',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  day: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    padding: 2,
  },
  dayPlaceholder: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayText: {
    textAlign: 'center',
    fontSize: 14,
  },
  selectedDay: {
    backgroundColor: '#9317ED',
    borderRadius: 50,
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledDay: {
    opacity: 0.3,
  },
  disabledDayText: {
    color: '#999',
  },
});

export default ChallengesScreen;