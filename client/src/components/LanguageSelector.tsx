import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Text, RadioButton, Title } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { setLanguage, selectUser } from '../slices/authSlice';

// Liste des langues disponibles
export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }
];

interface LanguageSelectorProps {
  onSelect?: (language: string) => void;
  showTitle?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  onSelect,
  showTitle = true,
}) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    user?.preferences?.language || 'en'
  );

  useEffect(() => {
    // Update the selected language if user preferences change
    if (user?.preferences?.language) {
      setSelectedLanguage(user.preferences.language);
    }
  }, [user?.preferences?.language]);

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    dispatch(setLanguage(languageCode));
    if (onSelect) {
      onSelect(languageCode);
    }
  };

  const renderLanguageItem = ({ item }: { item: typeof LANGUAGES[0] }) => (
    <TouchableOpacity
      style={styles.languageItem}
      onPress={() => handleLanguageSelect(item.code)}
    >
      <View style={styles.flagContainer}>
        <Text style={styles.flag}>{item.flag}</Text>
      </View>
      <View style={styles.languageInfo}>
        <Text style={styles.languageName}>{item.name}</Text>
      </View>
      <RadioButton
        value={item.code}
        status={selectedLanguage === item.code ? 'checked' : 'unchecked'}
        onPress={() => handleLanguageSelect(item.code)}
        color="#8A2BE2"
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {showTitle && <Title style={styles.title}>Select Language</Title>}
      
      <FlatList
        data={LANGUAGES}
        renderItem={renderLanguageItem}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
  },
  list: {
    paddingBottom: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  flagContainer: {
    marginRight: 16,
  },
  flag: {
    fontSize: 24,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    color: '#333',
  }
});

export default LanguageSelector; 