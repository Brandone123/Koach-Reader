import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';
import CustomDatePicker from './CustomDatePicker';
import { useTranslation } from 'react-i18next';

interface DatePickerFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  style?: any;
  error?: string;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  style,
  error
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (selectedDate: Date) => {
    onChange(selectedDate);
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <TextInput
          label={label}
          value={formatDate(value)}
          mode="outlined"
          editable={false}
          right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
          error={!!error}
        />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {showDatePicker && (
        <CustomDatePicker
          value={value || new Date()}
          onChange={handleDateChange}
          isVisible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 8,
  }
});

export default DatePickerField; 