import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import CustomDatePicker from './CustomDatePicker';

interface DatePickerFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  error
}) => {
  const { t } = useTranslation();
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity 
        style={[styles.dateField, error ? styles.errorField : {}]} 
        onPress={() => setIsPickerVisible(true)}
      >
        <Text style={styles.dateText}>
          {formatDate(value)}
        </Text>
      </TouchableOpacity>
      
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
      
      <CustomDatePicker
        value={value}
        onChange={onChange}
        isVisible={isPickerVisible}
        onClose={() => setIsPickerVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  dateField: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  errorField: {
    borderColor: '#e53935',
  },
  errorText: {
    color: '#e53935',
    fontSize: 12,
    marginTop: 4,
  },
});

export default DatePickerField; 