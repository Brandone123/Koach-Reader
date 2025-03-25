import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Text, Switch as RNSwitch, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { AppDispatch } from '../store';
import { 
  Card, 
  Title, 
  Subheading,
  Divider, 
  Button,
  Switch,
  RadioButton,
  List,
  Checkbox
} from 'react-native-paper';
import { selectUser, updatePreferences } from '../slices/authSlice';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

// Add preference type definitions
interface NotificationPreferences {
  readingReminders: boolean;
  achievements: boolean;
  friendActivity: boolean;
  challenges: boolean;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationPreferences;
  readingFrequency: 'daily' | 'weekly' | 'monthly';
  fontSizeMultiplier: number;
}

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  
  // Default preferences if user has none
  const defaultPreferences = {
    theme: 'light',
    notifications: {
      readingReminders: true,
      achievements: true,
      friendActivity: true,
      challenges: true
    },
    readingFrequency: 'daily',
    fontSizeMultiplier: 1.0
  };
  
  // Combine default with user preferences
  const userPreferences = { ...defaultPreferences, ...(user?.preferences || {}) };
  
  // Local state for preferences
  const [preferences, setPreferences] = useState(userPreferences);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const updatePreference = (path: string, value: string | boolean | number) => {
    // Deep update of nested preferences
    const newPreferences = { ...preferences };
    const pathParts = path.split('.');
    
    if (pathParts.length === 1) {
      newPreferences[path] = value;
    } else {
      let current = newPreferences;
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]];
      }
      current[pathParts[pathParts.length - 1]] = value;
    }
    
    setPreferences(newPreferences);
    setHasUnsavedChanges(true);
  };
  
  const savePreferences = () => {
    dispatch(updatePreferences({ preferences }));
    setHasUnsavedChanges(false);
  };
  
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.section}>
        <Card.Content>
          <Title>{t('settings.appearance')}</Title>
          <Divider style={styles.divider} />
          
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Subheading>{t('settings.darkMode')}</Subheading>
              <Text style={styles.settingDescription}>{t('settings.chooseTheme')}</Text>
            </View>
            <RadioButton.Group 
              onValueChange={(value) => updatePreference('theme', value)} 
              value={preferences.theme}
            >
              <View style={styles.radioContainer}>
                <RadioButton.Item label={t('settings.light')} value="light" />
                <RadioButton.Item label={t('settings.dark')} value="dark" />
                <RadioButton.Item label={t('settings.system')} value="system" />
              </View>
            </RadioButton.Group>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Subheading>{t('settings.fontSize')}</Subheading>
              <Text style={styles.settingDescription}>{t('settings.adjustTextSize')}</Text>
            </View>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>A</Text>
              <RNSwitch
                value={preferences.fontSizeMultiplier > 1.0}
                onValueChange={(value) => updatePreference('fontSizeMultiplier', value ? 1.2 : 1.0)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={preferences.fontSizeMultiplier > 1.0 ? '#6200ee' : '#f4f3f4'}
              />
              <Text style={[styles.sliderLabel, { fontSize: 20 }]}>A</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      {/* Language Settings Card */}
      <Card style={styles.section}>
        <Card.Content>
          <Title>{t('common.language')}</Title>
          <Divider style={styles.divider} />
          <LanguageSwitcher />
        </Card.Content>
      </Card>
      
      <Card style={styles.section}>
        <Card.Content>
          <Title>{t('settings.notifications')}</Title>
          <Divider style={styles.divider} />
          
          <List.Section>
            <List.Item
              title={t('settings.readingReminders')}
              description={t('settings.reminderDescription')}
              right={() => (
                <Switch
                  value={preferences.notifications.readingReminders}
                  onValueChange={(value) => 
                    updatePreference('notifications.readingReminders', value)
                  }
                />
              )}
            />
            
            <List.Item
              title={t('settings.achievements')}
              description={t('settings.achievementDescription')}
              right={() => (
                <Switch
                  value={preferences.notifications.achievements}
                  onValueChange={(value) => 
                    updatePreference('notifications.achievements', value)
                  }
                />
              )}
            />
            
            <List.Item
              title={t('settings.friendActivity')}
              description={t('settings.friendDescription')}
              right={() => (
                <Switch
                  value={preferences.notifications.friendActivity}
                  onValueChange={(value) => 
                    updatePreference('notifications.friendActivity', value)
                  }
                />
              )}
            />
            
            <List.Item
              title={t('settings.challenges')}
              description={t('settings.challengeDescription')}
              right={() => (
                <Switch
                  value={preferences.notifications.challenges}
                  onValueChange={(value) => 
                    updatePreference('notifications.challenges', value)
                  }
                />
              )}
            />
          </List.Section>
        </Card.Content>
      </Card>
      
      <Card style={styles.section}>
        <Card.Content>
          <Title>{t('settings.readingFrequency')}</Title>
          <Divider style={styles.divider} />
          
          <RadioButton.Group 
            onValueChange={(value) => updatePreference('readingFrequency', value)} 
            value={preferences.readingFrequency}>
            <RadioButton.Item label={t('settings.daily')} value="daily" />
            <RadioButton.Item label={t('settings.weekly')} value="weekly" />
            <RadioButton.Item label={t('settings.monthly')} value="monthly" />
          </RadioButton.Group>
        </Card.Content>
      </Card>
      
      <Button 
        mode="contained" 
        onPress={savePreferences}
        disabled={!hasUnsavedChanges}
        style={[styles.saveButton, !hasUnsavedChanges && styles.disabledButton]}
        labelStyle={styles.saveButtonText}
      >
        {t('common.save')}
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  section: {
    marginBottom: 16,
    elevation: 2,
  },
  divider: {
    marginVertical: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingDescription: {
    color: '#666',
    fontSize: 14,
  },
  radioContainer: {
    alignItems: 'flex-start',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderLabel: {
    marginHorizontal: 8,
  },
  buttonContainer: {
    marginVertical: 24,
    alignItems: 'center',
  },
  saveButton: {
    width: '80%',
    paddingVertical: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    fontSize: 16,
  },
});

export default SettingsScreen; 