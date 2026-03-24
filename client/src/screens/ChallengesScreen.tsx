import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Title,
  Button,
  Avatar,
  FAB,
  Modal,
  Portal,
  TextInput,
  Divider,
  Menu,
  IconButton,
  HelperText,
  Switch as PaperSwitch,
  Dialog,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import { selectUser } from '../slices/authSlice';
import {
  loadChallenges,
  joinChallenge as joinChallengeThunk,
  createChallenge as createChallengeThunk,
  selectUserChallenges,
  selectDiscoverChallenges,
  selectChallengesListLoading,
  selectChallengesLoading,
  type Challenge,
  type CreateChallengeInput,
} from '../slices/challengesSlice';
import { fetchBooks, selectBooks } from '../slices/booksSlice';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import type { Book } from '../slices/booksSlice';

type ChallengesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Challenges'>;

interface ChallengesScreenProps {
  navigation: ChallengesScreenNavigationProp;
}

function bookAuthorLabel(book: Book): string {
  const a = book.author as any;
  if (typeof a === 'string') return a;
  if (a && typeof a === 'object' && a.name) return a.name;
  return '';
}

const ChallengesScreen: React.FC<ChallengesScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const user = useSelector(selectUser);
  const myChallenges = useSelector(selectUserChallenges);
  const publicChallenges = useSelector(selectDiscoverChallenges);
  const listLoading = useSelector(selectChallengesListLoading);
  const actionLoading = useSelector(selectChallengesLoading);
  const books = useSelector(selectBooks);

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
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [formErrors, setFormErrors] = useState({
    title: '',
    goal: '',
    startDate: '',
    endDate: ''
  });
  
  useEffect(() => {
    dispatch(loadChallenges() as any);
    dispatch(fetchBooks() as any);
  }, [dispatch, user?.id]);

  const refreshChallenges = () => dispatch(loadChallenges() as any);

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

    if (goalType === 'books' && !selectedBook) {
      Alert.alert(t('common.errorGeneric'), t('challenges.selectBookForBooksGoal', 'Choisissez un livre pour un objectif « livres ».'));
      hasError = true;
    }
    
    if (hasError) {
      setFormErrors(errors);
      return;
    }
    
    const payload: CreateChallengeInput = {
      title: challengeTitle.trim(),
      description: challengeDescription.trim() || undefined,
      goal: Number(goalValue),
      goalType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isPrivate,
      bookId: goalType === 'books' && selectedBook ? selectedBook.id : undefined,
    };
    
    try {
      await dispatch(createChallengeThunk(payload) as any).unwrap();
      resetForm();
      setModalVisible(false);
      refreshChallenges();
      Alert.alert(t('common.success'), t('challenges.createdSuccess'));
    } catch (error: any) {
      console.error('Failed to create challenge:', error);
      Alert.alert(t('common.errorGeneric'), error?.message || t('challenges.createError'));
    }
  };
  
  const joinChallenge = async (challengeId: number) => {
    if (!user) {
      Alert.alert(t('common.errorGeneric'), t('auth.loginRequired'));
      return;
    }
    try {
      await dispatch(joinChallengeThunk(challengeId) as any).unwrap();
      refreshChallenges();
      Alert.alert(t('common.success'), t('challenges.joinedSuccess', 'Vous avez rejoint le défi !'));
    } catch (error: any) {
      console.error('Failed to join challenge:', error);
      Alert.alert(t('common.errorGeneric'), error?.message || t('challenges.joinError', 'Impossible de rejoindre'));
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
    const g = challenge.goal || 1;
    const p = challenge.myProgress ?? 0;
    return Math.min(100, (p / g) * 100);
  };
  
  const getGoalTypeLabel = (type: Challenge['goalType']) => {
    switch (type) {
      case 'pages': return t('challenges.pages');
      case 'books': return t('challenges.books');
      case 'minutes': return t('challenges.minutes');
      case 'koach': return t('common.points', 'Koach');
      default: return type;
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
    const isCreator = user ? String(item.creatorId) === String(user.id) : false;
    const progress = calculateProgress(item);
    const onMyTab = activeTab === 'my';
    const endD = new Date(item.endDate);

    return (
      <View style={styles.challengeCardWrap}>
        <Pressable
          onPress={() => navigation.navigate('ChallengeDetail', { challengeId: String(item.id) })}
          style={({ pressed }) => [
            styles.challengeCard,
            pressed && styles.challengeCardPressed,
            isCreator && styles.creatorCard,
            item.status === 'completed' && styles.completedCard,
          ]}
        >
          <View style={styles.cardAccent} />
          <View style={styles.cardInner}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardTitleBlock}>
                <Text style={styles.challengeTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.cardMetaRow}>
                  {item.isPrivate ? (
                    <View style={styles.metaPill}>
                      <Icon name="lock-outline" size={12} color="#6B21A8" />
                      <Text style={styles.metaPillText}>{t('challenges.private')}</Text>
                    </View>
                  ) : (
                    <View style={[styles.metaPill, styles.metaPillPublic]}>
                      <Icon name="earth" size={12} color="#0369A1" />
                      <Text style={[styles.metaPillText, styles.metaPillTextPublic]}>
                        {t('challenges.detail.public')}
                      </Text>
                    </View>
                  )}
                  {isCreator && (
                    <View style={styles.metaPill}>
                      <Icon name="crown-outline" size={12} color="#B45309" />
                      <Text style={styles.metaPillText}>{t('challenges.creator')}</Text>
                    </View>
                  )}
                  {item.status === 'completed' && (
                    <View style={[styles.metaPill, styles.metaPillDone]}>
                      <Icon name="check-decagram" size={12} color="#15803D" />
                      <Text style={[styles.metaPillText, styles.metaPillTextDone]}>
                        {t('challenges.completed')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Icon name="chevron-right" size={22} color="#C4B5D4" />
            </View>

            {!!item.description?.trim() && (
              <Text style={styles.challengeDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            <View style={styles.statsGrid}>
              <View style={styles.statCell}>
                <Text style={styles.statCellLabel}>{t('challenges.goal')}</Text>
                <Text style={styles.statCellValue}>
                  {item.goal} <Text style={styles.statCellUnit}>{getGoalTypeLabel(item.goalType)}</Text>
                </Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statCellLabel}>{t('challenges.participants')}</Text>
                <Text style={styles.statCellValue}>{item.participantCount}</Text>
              </View>
              <View style={styles.statCellWide}>
                <Text style={styles.statCellLabel}>{t('challenges.endDate')}</Text>
                <Text style={styles.statCellValueSmall}>{formatDate(endD)}</Text>
              </View>
            </View>
            {activeTab === 'public' && user && (
              <Pressable
                onPress={() => joinChallenge(item.id)}
                style={({ pressed }) => [styles.joinCta, pressed && styles.joinCtaPressed]}
              >
                <Text style={styles.joinCtaText}>{t('challenges.joinChallenge')}</Text>
                <Icon name="arrow-right" size={18} color="#fff" />
              </Pressable>
            )}

            {onMyTab && user && (
              <View style={styles.progressBlock}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>{t('challenges.progress')}</Text>
                  <Text style={styles.progressFraction}>
                    {item.myProgress ?? 0} / {item.goal}
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(100, progress)}%` },
                      progress >= 100 && styles.progressFillComplete,
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
        </Pressable>
      </View>
    );
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIllustration}>
        <Icon name="trophy-award" size={48} color="#7C3AED" />
      </View>
      <Text style={styles.emptyTitle}>
        {activeTab === 'my' ? t('challenges.noMyChallenges') : t('challenges.noPublicChallenges')}
      </Text>
      {activeTab === 'my' && (
        <Pressable onPress={() => setModalVisible(true)} style={styles.emptyCta}>
          <Text style={styles.emptyCtaText}>{t('challenges.createChallenge')}</Text>
          <Icon name="plus" size={20} color="#fff" />
        </Pressable>
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
        <LinearGradient colors={['#4C1D95', '#6D28D9']} style={styles.modalHeaderContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderSide} />
            <View style={styles.modalHeaderTitles}>
              <Text style={styles.modalKicker}>{t('challenges.title')}</Text>
              <Title style={styles.modalTitle}>{t('challenges.createNewChallenge')}</Title>
            </View>
            <IconButton
              icon="close"
              size={22}
              onPress={() => {
                resetForm();
                setModalVisible(false);
              }}
              style={styles.modalCloseRight}
              iconColor="white"
            />
          </View>
        </LinearGradient>
        
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
            label={`${t('challenges.description')} (${t('common.optional', 'optionnel')})`}
              value={challengeDescription}
              onChangeText={setChallengeDescription}
              multiline
              numberOfLines={3}
              style={styles.input}
            mode="outlined"
            />
            
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>{t('challenges.challengeGoal')}</Text>
            <View style={styles.goalChipsRow}>
              {(
                [
                  { key: 'pages' as const, icon: 'book-open-page-variant' },
                  { key: 'books' as const, icon: 'bookshelf' },
                  { key: 'minutes' as const, icon: 'clock-outline' },
                ]
              ).map(({ key, icon }) => (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.85}
                  style={[styles.goalChip, goalType === key && styles.goalChipActive]}
                  onPress={() => setGoalType(key)}
                >
                  <Icon
                    name={icon}
                    size={18}
                    color={goalType === key ? '#fff' : '#6B21A8'}
                  />
                  <Text style={[styles.goalChipText, goalType === key && styles.goalChipTextActive]}>
                    {getGoalTypeLabel(key)}
                  </Text>
                </TouchableOpacity>
              ))}
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
                <Dialog visible={showStartDatePicker} onDismiss={() => setShowStartDatePicker(false)}
                  style={styles.datePicker}>
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

          {goalType === 'books' && (
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
                    title={`${book.title}${bookAuthorLabel(book) ? ` (${bookAuthorLabel(book)})` : ''}`} 
                  />
                ))}
              </Menu>
            </View>
          )}
          
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
                loading={actionLoading}
                disabled={actionLoading}
              >
            {t('common.create')}
              </Button>
          </ScrollView>
        </Modal>
      </Portal>
  );
  
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1E1033', '#4C1D95', '#6D28D9']} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerToolbar}>
            <IconButton
              icon="arrow-left"
              size={22}
              iconColor="#fff"
              onPress={() => navigation.goBack()}
              style={styles.headerIconBtn}
            />
            <Text style={styles.heroTitle} numberOfLines={2}>{t('challenges.title')}</Text>
          </View>
          <Text style={styles.heroSubtitle}>{t('challenges.subtitle')}</Text>
          <View style={styles.segmentWrap}>
            <TouchableOpacity
              style={[styles.segmentItem, activeTab === 'my' && styles.segmentItemActive]}
              onPress={() => setActiveTab('my')}
              activeOpacity={0.9}
            >
              <Icon
                name="account-star-outline"
                size={18}
                color={activeTab === 'my' ? '#5B21B6' : 'rgba(255,255,255,0.75)'}
              />
              <Text style={[styles.segmentText, activeTab === 'my' && styles.segmentTextActive]}>
                {t('challenges.myChallenges')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentItem, activeTab === 'public' && styles.segmentItemActive]}
              onPress={() => setActiveTab('public')}
              activeOpacity={0.9}
            >
              <Icon
                name="compass-outline"
                size={18}
                color={activeTab === 'public' ? '#5B21B6' : 'rgba(255,255,255,0.75)'}
              />
              <Text style={[styles.segmentText, activeTab === 'public' && styles.segmentTextActive]}>
                {t('challenges.discoverTab')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      {listLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8A2BE2" />
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
          style={[styles.fab, { bottom: 24 + insets.bottom }]}
          icon="plus"
          color="#fff"
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
    backgroundColor: '#F4F2F8',
  },
  header: {
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#1E1033',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: { elevation: 10 },
    }),
  },
  headerContent: {
    paddingHorizontal: 15,
  },
  headerIconBtn: {
    margin: 0,
  },
  headerToolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    marginTop: 6,
    lineHeight: 21,
    fontWeight: '500',
  },
  segmentWrap: {
    flexDirection: 'row',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  segmentItemActive: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  segmentText: {
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '600',
    fontSize: 13,
  },
  segmentTextActive: {
    color: '#5B21B6',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B6578',
    fontWeight: '500',
  },
  challengesList: {
    padding: 20,
    paddingBottom: 100,
  },
  challengeCardWrap: {
    marginBottom: 16,
  },
  challengeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26, 22, 37, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#1E1033',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
    }),
  },
  challengeCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.992 }],
  },
  creatorCard: {
    borderColor: 'rgba(234, 179, 8, 0.35)',
  },
  completedCard: {
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  cardAccent: {
    width: 5,
    // backgroundColor: '#7C3AED',
  },
  cardInner: {
    flex: 1,
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitleBlock: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1625',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  cardMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#EDE9FE',
  },
  metaPillPublic: {
    backgroundColor: '#E0F2FE',
  },
  metaPillTextPublic: {
    color: '#0369A1',
  },
  metaPillDone: {
    backgroundColor: '#DCFCE7',
  },
  metaPillTextDone: {
    color: '#15803D',
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5B21B6',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  challengeDescription: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B6578',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 10,
  },
  statCell: {
    flex: 1,
    minWidth: '28%',
    backgroundColor: '#F8F6FC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  statCellWide: {
    flexGrow: 1,
    minWidth: '100%',
    backgroundColor: '#F8F6FC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  statCellLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  statCellValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1625',
  },
  statCellValueSmall: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1625',
  },
  statCellUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6578',
  },
  progressBlock: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 22, 37, 0.06)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressFraction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B21B6',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#EDE9FE',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#7C3AED',
  },
  progressFillComplete: {
    backgroundColor: '#22C55E',
  },
  joinCta: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#5B21B6',
    paddingVertical: 14,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#5B21B6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  joinCtaPressed: {
    opacity: 0.9,
  },
  joinCtaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIllustration: {
    width: 100,
    height: 100,
    borderRadius: 36,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 16,
    color: '#6B6578',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    fontWeight: '500',
    maxWidth: 280,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6D28D9',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
  },
  emptyCtaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#5B21B6',
    borderRadius: 18,
  },
  modalContainer: {
    backgroundColor: '#fff',
    margin: 14,
    borderRadius: 24,
    maxHeight: '92%',
    padding: 0,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
    }),
  },
  modalHeaderContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  modalHeaderSide: {
    width: 48,
  },
  modalHeaderTitles: {
    flex: 1,
    alignItems: 'center',
  },
  modalKicker: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  modalTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  modalCloseRight: {
    margin: 0,
    width: 48,
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  divider: {
    marginVertical: 12,
    height: 1,
    backgroundColor: 'rgba(26, 22, 37, 0.08)',
  },
  input: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  dateContainer: {
    marginHorizontal: 13,
    marginBottom: 13,
  },
  dateField: {
    marginBottom: 13,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 12,
    color: '#1A1625',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  goalChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    backgroundColor: '#FAF5FF',
  },
  goalChipActive: {
    backgroundColor: '#6D28D9',
    borderColor: '#6D28D9',
  },
  goalChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B21B6',
  },
  goalChipTextActive: {
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1625',
    flex: 1,
    marginRight: 12,
  },
  privateHint: {
    fontSize: 12,
    color: '#6B6578',
    lineHeight: 18,
    marginTop: 0,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  createButton: {
    margin: 16,
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#5B21B6',
  },
  dateButton: {
    marginHorizontal: 0,
    marginBottom: 4,
    borderRadius: 12,
    borderColor: 'rgba(26, 22, 37, 0.12)',
  },
  selectMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(26, 22, 37, 0.1)',
    borderRadius: 14,
    marginHorizontal: 16,
    paddingLeft: 14,
    backgroundColor: '#FAFAFA',
  },
  selectMenuText: {
    fontSize: 15,
    color: '#1A1625',
    paddingVertical: 14,
    fontWeight: '500',
  },
  datePickerContent: {
    padding: 1,
  },
  datePicker: {
    borderRadius: 5,
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
    marginBottom: 5,
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
    backgroundColor: '#6D28D9',
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