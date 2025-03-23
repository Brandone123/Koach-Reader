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
          <Title>Appearance</Title>
          <Divider style={styles.divider} />
          
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Subheading>Theme</Subheading>
              <Text style={styles.settingDescription}>Choose your preferred app theme</Text>
            </View>
            <RadioButton.Group 
              onValueChange={(value) => updatePreference('theme', value)} 
              value={preferences.theme}
            >
              <View style={styles.radioContainer}>
                <RadioButton.Item label="Light" value="light" />
                <RadioButton.Item label="Dark" value="dark" />
                <RadioButton.Item label="System" value="system" />
              </View>
            </RadioButton.Group>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Subheading>Text Size</Subheading>
              <Text style={styles.settingDescription}>Adjust reading text size</Text>
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
      
      <Card style={styles.section}>
        <Card.Content>
          <Title>Notifications</Title>
          <Divider style={styles.divider} />
          
          <List.Section>
            <List.Item
              title="Reading Reminders"
              description="Get reminders for your reading plans"
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
              title="Achievements"
              description="Get notified when you earn badges"
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
              title="Friend Activity"
              description="Get updates on friend activities"
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
              title="Challenges"
              description="Get updates on challenges"
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
          <Title>Reading Preferences</Title>
          <Divider style={styles.divider} />
          
          <List.Section>
            <Subheading>Default Reading Frequency</Subheading>
            <RadioButton.Group 
              onValueChange={(value) => updatePreference('readingFrequency', value)} 
              value={preferences.readingFrequency}
            >
              <RadioButton.Item label="Daily" value="daily" />
              <RadioButton.Item label="Weekly" value="weekly" />
              <RadioButton.Item label="Monthly" value="monthly" />
            </RadioButton.Group>
          </List.Section>
        </Card.Content>
      </Card>
      
      <View style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          onPress={savePreferences}
          disabled={!hasUnsavedChanges}
          style={styles.saveButton}
        >
          Save Changes
        </Button>
      </View>
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
});

export default SettingsScreen; 