import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Button, TextInput, Title, Paragraph, useTheme, IconButton, HelperText } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import LottieView from 'lottie-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from '../slices/authSlice';
import { createReadingPlan } from '../slices/readingPlansSlice'; // Assuming this action exists
import { AppDispatch } from '../store'; // Assuming this type exists
import { useTranslation } from 'react-i18next';

interface CreatePlanModalProps {
  visible: boolean;
  onClose: () => void;
  bookId: number | string; // Assuming bookId is passed to the modal
  bookTitle?: string;
  totalPages?: number; // Needed for goal calculation
  onPlanCreated: (plan: any) => void; // Callback after successful creation
}

type PlanGoalType = 'pages_per_day' | 'finish_by_date';

const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  visible,
  onClose,
  bookId,
  bookTitle,
  totalPages = 0,
  onPlanCreated,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);

  const [step, setStep] = useState(1);
  const [planTitle, setPlanTitle] = useState(bookTitle ? `${t('readingPlan.planFor')} ${bookTitle}` : t('readingPlan.newPlan'));
  const [goalType, setGoalType] = useState<PlanGoalType>('pages_per_day');
  const [pagesPerDay, setPagesPerDay] = useState('');
  const [finishDate, setFinishDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default to 1 week from now
  const [startDate, setStartDate] = useState(new Date());

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showFinishDatePicker, setShowFinishDatePicker] = useState(false);

  const [titleError, setTitleError] = useState('');
  const [pagesPerDayError, setPagesPerDayError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Reset form when modal becomes visible or bookId changes
    if (visible) {
      setStep(1);
      setPlanTitle(bookTitle ? `${t('readingPlan.planFor')} ${bookTitle}` : t('readingPlan.newPlan'));
      setGoalType('pages_per_day');
      setPagesPerDay('');
      setFinishDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      setStartDate(new Date());
      setTitleError('');
      setPagesPerDayError('');
      setIsSubmitting(false);
    }
  }, [visible, bookId, bookTitle, t]);

  const validateStep1 = () => {
    let isValid = true;
    if (!planTitle.trim()) {
      setTitleError(t('readingPlan.errors.titleRequired'));
      isValid = false;
    } else {
      setTitleError('');
    }
    return isValid;
  };

  const validateStep2 = () => {
    let isValid = true;
    if (goalType === 'pages_per_day') {
      const numPages = parseInt(pagesPerDay, 10);
      if (isNaN(numPages) || numPages <= 0) {
        setPagesPerDayError(t('readingPlan.errors.invalidPages'));
        isValid = false;
      } else if (totalPages > 0 && numPages > totalPages) {
        setPagesPerDayError(t('readingPlan.errors.pagesExceedTotal', { totalPages }));
        isValid = false;
      }
      else {
        setPagesPerDayError('');
      }
    } else { // finish_by_date
      if (finishDate <= startDate) {
        Alert.alert(t('common.errorText'), t('readingPlan.errors.endDateAfterStart'));
        isValid = false;
      }
    }
    return isValid;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3); // Review step
    }
  };

  const handleBack = () => {
    if (step > 1 && step <= 3) { // Allow back from review and success
      setStep(step - 1);
    } else if (step === 4) { // Success step
      onClose(); // Close modal after success animation
    }
  };

  const handleCreatePlan = async () => {
    if (!user || !bookId || !validateStep1() || !validateStep2()) return;
    setIsSubmitting(true);

    let dailyGoal = 0;
    let calculatedEndDate = new Date(finishDate);

    if (goalType === 'pages_per_day') {
      dailyGoal = parseInt(pagesPerDay, 10);
      if (totalPages > 0 && dailyGoal > 0) {
        const daysToComplete = Math.ceil(totalPages / dailyGoal);
        calculatedEndDate = new Date(startDate.getTime() + (daysToComplete -1) * 24 * 60 * 60 * 1000);
      } else {
        // Cannot calculate end date if totalPages or dailyGoal is invalid
        // This should be caught by validation, but as a fallback:
        calculatedEndDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days
      }
    } else { // finish_by_date
      if (totalPages > 0) {
        const diffTime = Math.abs(finishDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include start and end day
        dailyGoal = diffDays > 0 ? Math.ceil(totalPages / diffDays) : totalPages;
      } else {
        dailyGoal = 10; // Default if no total pages
      }
    }

    try {
      const planData = {
        userId: user.id,
        bookId: typeof bookId === 'string' ? parseInt(bookId) : bookId,
        title: planTitle,
        startDate: startDate.toISOString(),
        endDate: calculatedEndDate.toISOString(),
        dailyGoal: dailyGoal,
        totalPages: totalPages || 0, // Ensure totalPages is a number
        // notes: '', // Add if notes are part of the plan
      };
      // console.log('Dispatching createReadingPlan with:', planData);
      const resultAction = await dispatch(createReadingPlan(planData));

      if (createReadingPlan.fulfilled.match(resultAction)) {
        onPlanCreated(resultAction.payload);
        setStep(4); // Success step
      } else {
        Alert.alert(t('common.errorText'), t('readingPlan.errors.failedCreate'));
        console.error("Failed to create plan:", resultAction.error);
      }
    } catch (error) {
      Alert.alert(t('common.errorText'), t('readingPlan.errors.failedCreate'));
      console.error("Error creating reading plan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      if (selectedDate > finishDate && goalType === 'finish_by_date') {
        setFinishDate(new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000)); // Keep finish date ahead
      }
    }
  };

  const onFinishDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowFinishDatePicker(false);
    if (selectedDate) {
      setFinishDate(selectedDate);
    }
  };

  const getSummary = () => {
    let summary = `${t('readingPlan.summary.title')}: ${planTitle}\n`;
    summary += `${t('readingPlan.summary.startDate')}: ${startDate.toLocaleDateString()}\n`;
    if (goalType === 'pages_per_day') {
      summary += `${t('readingPlan.summary.goal')}: ${pagesPerDay} ${t('readingPlan.pagesPerDay')}\n`;
      if (totalPages > 0 && parseInt(pagesPerDay, 10) > 0) {
        const days = Math.ceil(totalPages / parseInt(pagesPerDay, 10));
        summary += `${t('readingPlan.summary.estimatedFinish')}: ${days} ${t('readingPlan.days')} (${new Date(startDate.getTime() + (days-1) * 24*60*60*1000).toLocaleDateString()})\n`;
      }
    } else {
      summary += `${t('readingPlan.summary.targetFinishDate')}: ${finishDate.toLocaleDateString()}\n`;
      if (totalPages > 0) {
        const diffTime = Math.abs(finishDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const calculatedPagesPerDay = diffDays > 0 ? Math.ceil(totalPages / diffDays) : totalPages;
        summary += `${t('readingPlan.summary.calculatedGoal')}: ${calculatedPagesPerDay} ${t('readingPlan.pagesPerDay')}\n`;
      }
    }
    return summary;
  };

  const renderStepContent = () => {
    switch (step) {
      case 1: // Plan Title & Start Date
        return (
          <View>
            <Title style={styles.stepTitle}>{t('readingPlan.step1.title')}</Title>
            <Paragraph style={styles.stepDescription}>{t('readingPlan.step1.description')}</Paragraph>
            <TextInput
              label={t('readingPlan.planNameLabel')}
              value={planTitle}
              onChangeText={setPlanTitle}
              style={styles.input}
              mode="outlined"
              error={!!titleError}
              theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
            />
            <HelperText type="error" visible={!!titleError}>
              {titleError}
            </HelperText>

            <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateDisplay}>
              <TextInput
                label={t('readingPlan.startDateLabel')}
                value={startDate.toLocaleDateString()}
                editable={false}
                mode="outlined"
                style={styles.input}
                theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
                right={<TextInput.Icon icon="calendar" />}
              />
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onStartDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>
        );
      case 2: // Goal Setting
        return (
          <View>
            <Title style={styles.stepTitle}>{t('readingPlan.step2.title')}</Title>
            <Paragraph style={styles.stepDescription}>{t('readingPlan.step2.description')}</Paragraph>
            <View style={styles.goalToggle}>
              <Button mode={goalType === 'pages_per_day' ? 'contained' : 'outlined'} onPress={() => setGoalType('pages_per_day')} style={styles.toggleButton}>
                {t('readingPlan.goalType.pagesPerDay')}
              </Button>
              <Button mode={goalType === 'finish_by_date' ? 'contained' : 'outlined'} onPress={() => setGoalType('finish_by_date')} style={styles.toggleButton}>
                {t('readingPlan.goalType.finishByDate')}
              </Button>
            </View>

            {goalType === 'pages_per_day' ? (
              <TextInput
                label={t('readingPlan.pagesPerDayLabel')}
                value={pagesPerDay}
                onChangeText={setPagesPerDay}
                keyboardType="number-pad"
                style={styles.input}
                mode="outlined"
                error={!!pagesPerDayError}
                theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
              />
            ) : (
              <TouchableOpacity onPress={() => setShowFinishDatePicker(true)} style={styles.dateDisplay}>
                 <TextInput
                    label={t('readingPlan.finishDateLabel')}
                    value={finishDate.toLocaleDateString()}
                    editable={false}
                    mode="outlined"
                    style={styles.input}
                    theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
                    right={<TextInput.Icon icon="calendar" />}
                  />
              </TouchableOpacity>
            )}
            <HelperText type="error" visible={!!pagesPerDayError}>
              {pagesPerDayError}
            </HelperText>
            {showFinishDatePicker && (
              <DateTimePicker
                value={finishDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onFinishDateChange}
                minimumDate={new Date(startDate.getTime() + 24 * 60 * 60 * 1000)} // At least one day after start
              />
            )}
             {totalPages === 0 && (
                <Paragraph style={{color: theme.colors.error, marginTop: 10, textAlign: 'center'}}>
                    {t('readingPlan.warnings.noTotalPages')}
                </Paragraph>
            )}
          </View>
        );
      case 3: // Review
        return (
          <View>
            <Title style={styles.stepTitle}>{t('readingPlan.step3.title')}</Title>
            <Paragraph style={styles.stepDescription}>{t('readingPlan.step3.description')}</Paragraph>
            <View style={styles.summaryBox}>
                <Text style={[styles.summaryText, {color: theme.colors.onSurfaceVariant}]}>{getSummary()}</Text>
            </View>
          </View>
        );
      case 4: // Success
        return (
          <View style={styles.successContainer}>
            <LottieView
              source={require('../assets/animations/success.json')} // Corrected path
              autoPlay
              loop={false}
              style={styles.lottieAnimation}
              onAnimationFinish={onClose} // Close modal when animation finishes
            />
            <Title style={[styles.successTitle, {color: theme.colors.primary}]}>{t('readingPlan.success.title')}</Title>
            <Paragraph style={[styles.successMessage, {color: theme.colors.text}]}>{t('readingPlan.success.message')}</Paragraph>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" transparent={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={[styles.modalOverlay]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.elevation.level2 }]}>
            <View style={styles.modalHeader}>
              <IconButton icon="close" size={24} onPress={onClose} style={styles.closeButton} iconColor={theme.colors.text}/>
              <View style={styles.progressBar}>
                {[1, 2, 3].map(s => (
                  <View
                    key={s}
                    style={[
                        styles.progressStep,
                        { backgroundColor: step >= s && step < 4 ? theme.colors.primary : theme.colors.backdrop }
                    ]}
                  />
                ))}
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
              {renderStepContent()}
            </ScrollView>

            {step < 3 && (
              <View style={styles.actions}>
                {step > 1 && <Button onPress={handleBack} style={styles.actionButton} textColor={theme.colors.primary}>{t('common.back')}</Button>}
                <Button mode="contained" onPress={handleNext} style={styles.actionButton} buttonColor={theme.colors.primary}>
                  {t('common.next')}
                </Button>
              </View>
            )}
            {step === 3 && (
               <View style={styles.actions}>
                <Button onPress={handleBack} style={styles.actionButton} textColor={theme.colors.primary}>{t('common.back')}</Button>
                <Button mode="contained" onPress={handleCreatePlan} loading={isSubmitting} disabled={isSubmitting} style={styles.actionButton} buttonColor={theme.colors.primary}>
                  {t('readingPlan.createPlanButton')}
                </Button>
              </View>
            )}
            {step === 4 && (
                <Button mode="contained" onPress={onClose} style={styles.actionButton} buttonColor={theme.colors.primary}>
                    {t('common.done')}
                </Button>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  closeButton: {
    margin: -8, // Adjust to align better if needed
  },
  progressBar: {
    flexDirection: 'row',
    flexGrow: 1,
    justifyContent: 'space-evenly',
    marginLeft: 20, // Space from close button
  },
  progressStep: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  scrollContent: {
    paddingBottom: 20, // Space for inputs at the bottom
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDescription: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
  },
  input: {
    marginBottom: 12,
    // Larger by default with Paper v5
  },
  dateDisplay: {
    marginBottom: 12,
  },
  goalToggle: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  summaryBox: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // 'space-between' if back button is on left
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    paddingTop: 15,
  },
  actionButton: {
    marginLeft: 10,
    minWidth: 80,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  lottieAnimation: {
    width: 150,
    height: 150,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
});

export default CreatePlanModal;
