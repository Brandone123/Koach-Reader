import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' }
];

interface LanguageSelectionScreenProps {
  onLanguageSelected: () => void;
  onBack?: () => void;
}

const LanguageSelectionScreen: React.FC<LanguageSelectionScreenProps> = ({
  onLanguageSelected,
  onBack
}) => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(i18n.language || 'en');

  const handleLanguageSelect = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    await i18n.changeLanguage(languageCode);
  };

  const handleContinue = () => {
    onLanguageSelected();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <LinearGradient
        colors={['#f8f9fa', '#ffffff']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
          )}
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <View style={styles.globeContainer}>
              <MaterialCommunityIcons name="earth" size={80} color="#8A2BE2" />
              <View style={styles.sparkle1}>
                <MaterialCommunityIcons name="star-four-points" size={16} color="#FFD700" />
              </View>
              <View style={styles.sparkle2}>
                <MaterialCommunityIcons name="star-four-points" size={12} color="#FF6B6B" />
              </View>
              <View style={styles.sparkle3}>
                <MaterialCommunityIcons name="star-four-points" size={14} color="#4ECDC4" />
              </View>
            </View>
          </View>

          {/* Title and Description */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {t('onboarding.selectLanguage')}
            </Text>
            <Text style={styles.description}>
              {t('onboarding.languageDescription')}
            </Text>
          </View>

          {/* Language Options */}
          <View style={styles.languageContainer}>
            {LANGUAGES.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  selectedLanguage === language.code && styles.languageOptionSelected
                ]}
                onPress={() => handleLanguageSelect(language.code)}
                activeOpacity={0.7}
              >
                <View style={styles.languageContent}>
                  <View style={styles.languageLeft}>
                    <Text style={styles.flag}>{language.flag}</Text>
                    <View style={styles.languageText}>
                      <Text style={[
                        styles.languageName,
                        selectedLanguage === language.code && styles.languageNameSelected
                      ]}>
                        {language.nativeName}
                      </Text>
                      <Text style={[
                        styles.languageSubtext,
                        selectedLanguage === language.code && styles.languageSubtextSelected
                      ]}>
                        {language.name}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={[
                    styles.radioButton,
                    selectedLanguage === language.code && styles.radioButtonSelected
                  ]}>
                    {selectedLanguage === language.code && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              selectedLanguage && styles.continueButtonActive
            ]}
            onPress={handleContinue}
            disabled={!selectedLanguage}
          >
            <Text style={[
              styles.continueButtonText,
              selectedLanguage && styles.continueButtonTextActive
            ]}>
              {t('common.continue')}
            </Text>
            <MaterialCommunityIcons 
              name="arrow-right" 
              size={20} 
              color={selectedLanguage ? "#fff" : "#999"} 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  globeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle1: {
    position: 'absolute',
    top: -10,
    right: -15,
  },
  sparkle2: {
    position: 'absolute',
    bottom: -5,
    left: -20,
  },
  sparkle3: {
    position: 'absolute',
    top: 20,
    left: -25,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  languageContainer: {
    gap: 12,
  },
  languageOption: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  languageOptionSelected: {
    borderColor: '#8A2BE2',
    backgroundColor: '#f8f4ff',
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 32,
    marginRight: 16,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  languageNameSelected: {
    color: '#8A2BE2',
  },
  languageSubtext: {
    fontSize: 14,
    color: '#666',
  },
  languageSubtextSelected: {
    color: '#8A2BE2',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#8A2BE2',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8A2BE2',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonActive: {
    backgroundColor: '#8A2BE2',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  continueButtonTextActive: {
    color: '#fff',
  },
});

export default LanguageSelectionScreen;
