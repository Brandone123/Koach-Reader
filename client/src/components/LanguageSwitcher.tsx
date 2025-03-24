import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Menu, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';

interface LanguageSwitcherProps {
  isHeader?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ isHeader = false }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const { currentLanguage, changeLanguage, isChangingLanguage } = useLanguage();

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handleLanguageChange = async (language: string) => {
    if (language !== currentLanguage) {
      await changeLanguage(language);
    }
    closeMenu();
  };

  // Pour le header avec juste une icône
  if (isHeader) {
    return (
      <View style={styles.headerContainer}>
        {isChangingLanguage ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Menu
            visible={visible}
            onDismiss={closeMenu}
            anchor={
              <TouchableOpacity onPress={openMenu} style={styles.iconButton}>
                <MaterialCommunityIcons name="translate" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            }
          >
            <Menu.Item 
              onPress={() => handleLanguageChange('en')} 
              title="English"
              leadingIcon={currentLanguage === 'en' ? "check" : undefined}
              titleStyle={currentLanguage === 'en' ? styles.activeLanguage : {}}
            />
            <Divider />
            <Menu.Item 
              onPress={() => handleLanguageChange('fr')} 
              title="Français"
              leadingIcon={currentLanguage === 'fr' ? "check" : undefined}
              titleStyle={currentLanguage === 'fr' ? styles.activeLanguage : {}}
            />
          </Menu>
        )}
      </View>
    );
  }

  // Pour les paramètres avec texte complet
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('settings.language')}</Text>
      {isChangingLanguage ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#8A2BE2" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <Menu
          visible={visible}
          onDismiss={closeMenu}
          anchor={
            <TouchableOpacity onPress={openMenu} style={styles.button}>
              <Text style={styles.buttonText}>
                {currentLanguage === 'en' 
                  ? t('settings.english') 
                  : t('settings.french')}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#333" />
            </TouchableOpacity>
          }
        >
          <Menu.Item 
            onPress={() => handleLanguageChange('en')} 
            title={t('settings.english')}
            leadingIcon={currentLanguage === 'en' ? "check" : undefined}
            titleStyle={currentLanguage === 'en' ? styles.activeLanguage : {}}
          />
          <Divider />
          <Menu.Item 
            onPress={() => handleLanguageChange('fr')} 
            title={t('settings.french')}
            leadingIcon={currentLanguage === 'fr' ? "check" : undefined}
            titleStyle={currentLanguage === 'fr' ? styles.activeLanguage : {}}
          />
        </Menu>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContainer: {
    marginRight: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  iconButton: {
    padding: 5,
  },
  activeLanguage: {
    fontWeight: 'bold',
    color: '#8A2BE2',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
  }
});

export default LanguageSwitcher; 