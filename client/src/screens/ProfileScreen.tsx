import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  FlatList,
  Image,
  Alert
} from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Avatar, 
  Divider, 
  Switch,
  Chip,
  List,
  RadioButton,
  TextInput
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectUser, updateProfile } from '../slices/authSlice';
import { selectUserBooks } from '../slices/booksSlice';
import { AppDispatch } from '../store';
import { theme } from '../utils/theme';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const userBooks = useSelector(selectUserBooks);
  
  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  
  // Preferences
  const [readingFrequency, setReadingFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [ageRange, setAgeRange] = useState<'child' | 'teen' | 'adult'>('adult');
  const [preferredReadingFormat, setPreferredReadingFormat] = useState<'text' | 'audio'>('text');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const availableCategories = [
    'Fiction', 'Non-Fiction', 'Biography', 'History', 
    'Self-Help', 'Science', 'Fantasy', 'Mystery', 
    'Romance', 'Thriller', 'Poetry', 'Educational'
  ];
  
  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      
      if (user.preferences) {
        setReadingFrequency(user.preferences.readingFrequency || 'daily');
        setAgeRange(user.preferences.ageRange || 'adult');
        setPreferredReadingFormat(user.preferences.preferredReadingFormat || 'text');
        setTheme(user.preferences.theme || 'light');
        setSelectedCategories(user.preferences.preferredCategories || []);
      }
    }
  }, [user]);
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Logout', onPress: () => dispatch(logout()) }
      ]
    );
  };
  
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };
  
  const handleSaveProfile = () => {
    // Validate inputs
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }
    
    if (!email.trim()) {
      Alert.alert('Error', 'Email cannot be empty');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    // Update profile with new data
    dispatch(updateProfile({
      username,
      email,
      preferences: {
        readingFrequency,
        ageRange,
        preferredReadingFormat,
        theme,
        preferredCategories: selectedCategories
      }
    }));
    
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully');
  };
  
  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading profile...</Text>
      </View>
    );
  }
  
  // Render profile view (not editing)
  const renderProfile = () => (
    <ScrollView style={styles.scrollView}>
      <View style={styles.header}>
        <Avatar.Text 
          size={80} 
          label={user.username.substring(0, 2).toUpperCase()}
          style={styles.avatar}
        />
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.koachPoints || 0}</Text>
            <Text style={styles.statLabel}>Koach Points</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.readingStreak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userBooks.length}</Text>
            <Text style={styles.statLabel}>Books</Text>
          </View>
        </View>
        
        <Button 
          mode="contained" 
          onPress={() => setIsEditing(true)}
          style={styles.editButton}
        >
          Edit Profile
        </Button>
      </View>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Reading Preferences</Title>
          
          <List.Item
            title="Reading Frequency"
            description={user.preferences?.readingFrequency || 'Daily'}
            left={props => <List.Icon {...props} icon="calendar" />}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Age Range"
            description={user.preferences?.ageRange || 'Adult'}
            left={props => <List.Icon {...props} icon="account" />}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Preferred Format"
            description={user.preferences?.preferredReadingFormat || 'Text'}
            left={props => <List.Icon {...props} icon="book-open-variant" />}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="App Theme"
            description={user.preferences?.theme || 'Light'}
            left={props => <List.Icon {...props} icon="theme-light-dark" />}
          />
          
          <Divider style={styles.divider} />
          
          <Title style={[styles.sectionTitle, { marginTop: 16 }]}>Preferred Categories</Title>
          
          <View style={styles.categoriesContainer}>
            {user.preferences?.preferredCategories && user.preferences.preferredCategories.length > 0 ? (
              user.preferences.preferredCategories.map(category => (
                <Chip 
                  key={category} 
                  style={styles.categoryChip}
                >
                  {category}
                </Chip>
              ))
            ) : (
              <Text style={styles.noCategories}>No preferred categories selected.</Text>
            )}
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Reading Progress</Title>
          
          <Button 
            mode="outlined" 
            onPress={() => navigation.navigate('Stats')}
            style={styles.accountButton}
            icon="chart-bar"
          >
            View Statistics
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={() => navigation.navigate('Badges')}
            style={styles.accountButton}
            icon="trophy"
          >
            My Badges
          </Button>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Account Options</Title>
          
          <Button 
            mode="outlined" 
            onPress={() => navigation.navigate('Settings')}
            style={styles.accountButton}
            icon="cog"
          >
            Settings
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={handleLogout}
            style={styles.accountButton}
            icon="logout"
            color="#B00020"
          >
            Logout
          </Button>
        </Card.Content>
      </Card>
      
      <View style={styles.footer}>
        <Text style={styles.versionText}>Koach Reading v1.0.0</Text>
      </View>
    </ScrollView>
  );
  
  // Render edit profile form
  const renderEditForm = () => (
    <ScrollView style={styles.scrollView}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Edit Profile</Title>
          
          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
          />
          
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={styles.input}
          />
          
          <Title style={[styles.sectionTitle, { marginTop: 24 }]}>Reading Preferences</Title>
          
          <Text style={styles.preferencesLabel}>Reading Frequency</Text>
          <RadioButton.Group
            onValueChange={value => setReadingFrequency(value as 'daily' | 'weekly' | 'monthly')}
            value={readingFrequency}
          >
            <View style={styles.radioOption}>
              <RadioButton value="daily" />
              <Text style={styles.radioLabel}>Daily</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="weekly" />
              <Text style={styles.radioLabel}>Weekly</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="monthly" />
              <Text style={styles.radioLabel}>Monthly</Text>
            </View>
          </RadioButton.Group>
          
          <Text style={styles.preferencesLabel}>Age Range</Text>
          <RadioButton.Group
            onValueChange={value => setAgeRange(value as 'child' | 'teen' | 'adult')}
            value={ageRange}
          >
            <View style={styles.radioOption}>
              <RadioButton value="child" />
              <Text style={styles.radioLabel}>Child (under 12)</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="teen" />
              <Text style={styles.radioLabel}>Teen (13-17)</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="adult" />
              <Text style={styles.radioLabel}>Adult (18+)</Text>
            </View>
          </RadioButton.Group>
          
          <Text style={styles.preferencesLabel}>Preferred Reading Format</Text>
          <RadioButton.Group
            onValueChange={value => setPreferredReadingFormat(value as 'text' | 'audio')}
            value={preferredReadingFormat}
          >
            <View style={styles.radioOption}>
              <RadioButton value="text" />
              <Text style={styles.radioLabel}>Text</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="audio" />
              <Text style={styles.radioLabel}>Audio</Text>
            </View>
          </RadioButton.Group>
          
          <Text style={styles.preferencesLabel}>App Theme</Text>
          <RadioButton.Group
            onValueChange={value => setTheme(value as 'light' | 'dark' | 'system')}
            value={theme}
          >
            <View style={styles.radioOption}>
              <RadioButton value="light" />
              <Text style={styles.radioLabel}>Light</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="dark" />
              <Text style={styles.radioLabel}>Dark</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="system" />
              <Text style={styles.radioLabel}>System Default</Text>
            </View>
          </RadioButton.Group>
          
          <Text style={styles.preferencesLabel}>Preferred Categories</Text>
          <View style={styles.categoriesSelector}>
            {availableCategories.map(category => (
              <Chip
                key={category}
                selected={selectedCategories.includes(category)}
                onPress={() => toggleCategory(category)}
                style={styles.selectableCategoryChip}
                selectedColor="#6200ee"
              >
                {category}
              </Chip>
            ))}
          </View>
          
          <View style={styles.formButtons}>
            <Button 
              mode="outlined" 
              onPress={() => setIsEditing(false)}
              style={[styles.formButton, { marginRight: 8 }]}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSaveProfile}
              style={styles.formButton}
            >
              Save Changes
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
  
  return (
    <View style={styles.container}>
      {isEditing ? renderEditForm() : renderProfile()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#6200ee',
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    width: '100%',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  editButton: {
    width: '50%',
  },
  card: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryChip: {
    margin: 4,
  },
  noCategories: {
    color: '#666',
    fontStyle: 'italic',
  },
  accountButton: {
    marginVertical: 8,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  versionText: {
    color: '#666',
    fontSize: 12,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  preferencesLabel: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  categoriesSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  selectableCategoryChip: {
    margin: 4,
  },
  formButtons: {
    flexDirection: 'row',
    marginTop: 24,
  },
  formButton: {
    flex: 1,
  },
});

export default ProfileScreen;