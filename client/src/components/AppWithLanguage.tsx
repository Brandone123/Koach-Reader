import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

const AppWithLanguage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isChangingLanguage, currentLanguage } = useLanguage();
  const [key, setKey] = useState(Date.now());

  // Forcer un rafraîchissement quand la langue change
  useEffect(() => {
    if (!isChangingLanguage) {
      // Only update the key after language change is complete
      setKey(Date.now());
    }
  }, [currentLanguage, isChangingLanguage]);

  if (isChangingLanguage) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  return (
    <View key={key} style={{ flex: 1 }}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default AppWithLanguage; 