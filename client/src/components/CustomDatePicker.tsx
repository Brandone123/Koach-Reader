import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  FlatList
} from 'react-native';
import { useTranslation } from 'react-i18next';

interface CustomDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  isVisible: boolean;
  onClose: () => void;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  isVisible,
  onClose
}) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date>(value || new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(value.getFullYear(), value.getMonth(), 1)
  );

  // Localized month names
  const getMonthName = (date: Date) => {
    return date.toLocaleString('default', { month: 'long' });
  };

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate days for current month view
  const generateDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const days: { date: Date | null; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean }[] = [];
    
    // Add empty spots for days before the 1st of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ date: null, isCurrentMonth: false, isToday: false, isSelected: false });
    }
    
    // Add days of current month
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date, 
        isCurrentMonth: true,
        isToday: 
          date.getDate() === today.getDate() && 
          date.getMonth() === today.getMonth() && 
          date.getFullYear() === today.getFullYear(),
        isSelected: 
          date.getDate() === selectedDate.getDate() && 
          date.getMonth() === selectedDate.getMonth() && 
          date.getFullYear() === selectedDate.getFullYear()
      });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const handleDayPress = (day: { date: Date | null }) => {
    if (day.date) {
      setSelectedDate(day.date);
      onChange(day.date);
      onClose();
    }
  };

  const renderWeekDays = () => {
    const weekDays = [t('calendar.sun'), t('calendar.mon'), t('calendar.tue'), t('calendar.wed'), t('calendar.thu'), t('calendar.fri'), t('calendar.sat')];
    
    return (
      <View style={styles.weekDaysContainer}>
        {weekDays.map((day, index) => (
          <Text key={index} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.calendarContainer}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => navigateMonth('prev')}>
                  <Text style={styles.navButton}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={styles.monthYearText}>
                  {getMonthName(currentMonth)} {currentMonth.getFullYear()}
                </Text>
                <TouchableOpacity onPress={() => navigateMonth('next')}>
                  <Text style={styles.navButton}>{'>'}</Text>
                </TouchableOpacity>
              </View>

              {renderWeekDays()}
              
              <FlatList
                data={generateDays()}
                numColumns={7}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dayContainer,
                      item.isSelected && styles.selectedDay,
                      item.isToday && styles.today,
                    ]}
                    onPress={() => handleDayPress(item)}
                    disabled={!item.isCurrentMonth}
                  >
                    <Text style={[
                      styles.dayText,
                      item.isSelected && styles.selectedDayText,
                      item.isToday && styles.todayText,
                      !item.isCurrentMonth && styles.inactiveText
                    ]}>
                      {item.date ? item.date.getDate().toString() : ''}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(_, index) => index.toString()}
              />

              <View style={styles.footer}>
                <TouchableOpacity style={styles.button} onPress={onClose}>
                  <Text style={styles.buttonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '85%',
    maxWidth: 340,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  navButton: {
    fontSize: 22,
    color: '#6200ee',
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#666',
    fontSize: 12,
  },
  dayContainer: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 20,
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  inactiveText: {
    color: '#ccc',
  },
  selectedDay: {
    backgroundColor: '#6200ee',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  today: {
    borderWidth: 1,
    borderColor: '#6200ee',
  },
  todayText: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#6200ee',
    fontWeight: 'bold',
  }
});

export default CustomDatePicker; 