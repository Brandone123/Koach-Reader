import React, { useState } from 'react';
import { View, StyleSheet, Text, Button } from 'react-native';
import { useTranslation } from 'react-i18next';
import DatePickerField from './DatePickerField';

// Exemple d'utilisation du composant DatePickerField
const ExampleUsage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState<string | undefined>();

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    // Validation d'exemple
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      setError(t('validation.dateMustBeFuture'));
    } else {
      setError(undefined);
    }
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('calendar.selectDate')}</Text>
      
      <DatePickerField
        label={t('readingSession.date')}
        value={selectedDate}
        onChange={handleDateChange}
        error={error}
      />
      
      <View style={styles.selectedDateContainer}>
        <Text style={styles.dateTitle}>{t('readingSession.selectedDate')}:</Text>
        <Text style={styles.selectedDate}>{formatDateForDisplay(selectedDate)}</Text>
      </View>
      
      <Button
        title={t('readingSession.save')}
        onPress={() => {
          // Logique de traitement de la date ici
          alert(`${t('readingSession.dateSelected')}: ${formatDateForDisplay(selectedDate)}`);
        }}
        disabled={!!error}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  selectedDateContainer: {
    marginTop: 16,
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  dateTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#555',
  },
  selectedDate: {
    fontSize: 16,
    color: '#6200ee',
  },
});

export default ExampleUsage; 