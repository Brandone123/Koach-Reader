import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  Avatar,
  Title,
  Caption,
  Divider,
  Button,
  Card,
  ProgressBar,
  IconButton,
  Menu,
  Chip,
  Portal,
  Dialog,
  TextInput,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';

const { width, height } = Dimensions.get('window');

// Define more specific types for badges
type BadgeIconName = 'alarm' | 'book-open-variant' | 'weather-night' | 'timer' | 'trophy' | 'calendar-check';

interface Badge {
  id: number;
  name: string;
  icon: BadgeIconName;
  description: string;
  unlocked: boolean;
}

interface Book {
  id: number;
  title: string;
  author: string;
  coverImage: string;
  lastRead: string;
  progress: number;
}

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const badges: Badge[] = [
  { id: 1, name: 'Early Bird', icon: 'alarm', description: 'Read 5 days in a row before 8 AM', unlocked: true },
  { id: 2, name: 'Bookworm', icon: 'book-open-variant', description: 'Read 10 books', unlocked: true },
  { id: 3, name: 'Night Owl', icon: 'weather-night', description: 'Read 5 days in a row after 10 PM', unlocked: false },
  { id: 4, name: 'Speed Reader', icon: 'timer', description: 'Finish a book in less than 3 days', unlocked: true },
  { id: 5, name: 'Goal Crusher', icon: 'trophy', description: 'Complete 3 reading challenges', unlocked: false },
  { id: 6, name: 'Consistent Reader', icon: 'calendar-check', description: 'Read every day for a month', unlocked: false },
];

const recentBooks: Book[] = [
  { id: 1, title: 'The Alchemist', author: 'Paulo Coelho', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1654371463i/18144590.jpg', lastRead: '2 days ago', progress: 0.75 },
  { id: 2, title: 'Atomic Habits', author: 'James Clear', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655988385i/40121378.jpg', lastRead: '5 days ago', progress: 0.45 },
  { id: 3, title: 'The Psychology of Money', author: 'Morgan Housel', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1581527774i/41881472.jpg', lastRead: '1 week ago', progress: 0.9 },
];

const readingStats = {
  totalMinutes: 2480,
  booksCompleted: 12,
  currentStreak: 8,
  longestStreak: 21,
  weeklyGoal: 5, // days per week
  weeklyProgress: 4, // days read this week
};

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editableProfile, setEditableProfile] = useState({
    displayName: user?.username || '',
    bio: 'Avid reader and book enthusiast. Love to explore new worlds through reading.',
  });

  const handleEditProfile = () => {
    setEditDialogVisible(true);
  };

  const handleSaveProfile = () => {
    // Save profile changes to backend - would be implemented in a real app
    setEditDialogVisible(false);
  };

  const renderBadges = () => {
    return (
      <View style={styles.badgeSection}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Badges</Title>
          <TouchableOpacity onPress={() => navigation.navigate('Badges')}>
            <Caption style={styles.seeAll}>See All</Caption>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.badgeScroll}
        >
          {badges.map((badge) => (
            <View key={badge.id} style={styles.badgeContainer}>
              <View style={[styles.badgeIconContainer, !badge.unlocked && styles.lockedBadge]}>
                <MaterialCommunityIcons
                  name={badge.icon}
                  size={32}
                  color={badge.unlocked ? '#8A2BE2' : '#CCCCCC'}
                />
              </View>
              <Text style={[styles.badgeName, !badge.unlocked && styles.lockedText]}>
                {badge.name}
              </Text>
              {!badge.unlocked && (
                <View style={styles.lockIconContainer}>
                  <MaterialCommunityIcons name="lock" size={14} color="#FFFFFF" />
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderRecentBooks = () => {
    return (
      <View style={styles.recentBooksSection}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Recent Books</Title>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Caption style={styles.seeAll}>See All</Caption>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.recentBooksScroll}
        >
          {recentBooks.map((book) => (
            <TouchableOpacity
              key={book.id}
              style={styles.bookCard}
              onPress={() => navigation.navigate('BookDetail', { bookId: String(book.id) })}
            >
              <Image source={{ uri: book.coverImage }} style={styles.bookCover} />
              <View style={styles.bookDetails}>
                <Text style={styles.bookTitle} numberOfLines={1}>
                  {book.title}
                </Text>
                <Text style={styles.bookAuthor} numberOfLines={1}>
                  {book.author}
                </Text>
                <Caption style={styles.lastRead}>Last read {book.lastRead}</Caption>
                <View style={styles.progressContainer}>
                  <ProgressBar
                    progress={book.progress}
                    color="#8A2BE2"
                    style={styles.progressBar}
                  />
                  <Text style={styles.progressText}>{Math.round(book.progress * 100)}%</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderReadingStats = () => {
    return (
      <View style={styles.statsSection}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Reading Stats</Title>
          <TouchableOpacity onPress={() => navigation.navigate('Stats')}>
            <Caption style={styles.seeAll}>See All</Caption>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{readingStats.totalMinutes}</Text>
            <Text style={styles.statLabel}>Total Minutes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{readingStats.booksCompleted}</Text>
            <Text style={styles.statLabel}>Books Read</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{readingStats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{readingStats.longestStreak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
        </View>
        
        <View style={styles.weeklyGoalContainer}>
          <View style={styles.weeklyGoalHeader}>
            <Text style={styles.weeklyGoalTitle}>Weekly Reading Goal</Text>
            <Text style={styles.weeklyGoalProgress}>
              {readingStats.weeklyProgress} of {readingStats.weeklyGoal} days
            </Text>
          </View>
          <ProgressBar
            progress={readingStats.weeklyProgress / readingStats.weeklyGoal}
            color="#8A2BE2"
            style={styles.weeklyGoalBar}
          />
        </View>
      </View>
    );
  };

  const renderEditProfileDialog = () => {
    return (
      <Portal>
        <Dialog
          visible={editDialogVisible}
          onDismiss={() => setEditDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Edit Profile</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Display Name"
              value={editableProfile.displayName}
              onChangeText={(text) => setEditableProfile({ ...editableProfile, displayName: text })}
              style={styles.dialogInput}
              mode="outlined"
            />
            <TextInput
              label="Bio"
              value={editableProfile.bio}
              onChangeText={(text) => setEditableProfile({ ...editableProfile, bio: text })}
              style={styles.dialogInput}
              multiline
              numberOfLines={3}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSaveProfile}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=1053&q=80' }}
        style={styles.coverPhoto}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
          style={styles.coverGradient}
        >
          <View style={styles.headerButtons}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
            />
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={24}
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              <Menu.Item onPress={handleEditProfile} title="Edit Profile" />
              <Menu.Item onPress={() => navigation.navigate('Settings')} title="Settings" />
              <Divider />
              <Menu.Item onPress={logout} title="Logout" />
            </Menu>
          </View>
        </LinearGradient>
      </ImageBackground>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContentContainer}
      >
        <View style={styles.profileHeader}>
          <Avatar.Image
            source={{ uri: 'https://randomuser.me/api/portraits/women/17.jpg' }}
            size={100}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Title style={styles.username}>{user?.username || 'Reader'}</Title>
            <View style={styles.levelContainer}>
              <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
              <Text style={styles.levelText}>Level 8 Reader</Text>
            </View>
            <Text style={styles.bio}>
              Avid reader and book enthusiast. Love to explore new worlds through reading.
            </Text>
            <View style={styles.interests}>
              <Chip style={styles.interestChip} textStyle={{ color: '#666' }}>Fiction</Chip>
              <Chip style={styles.interestChip} textStyle={{ color: '#666' }}>Fantasy</Chip>
              <Chip style={styles.interestChip} textStyle={{ color: '#666' }}>Self-Help</Chip>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {renderReadingStats()}
          <Divider style={styles.divider} />
          {renderBadges()}
          <Divider style={styles.divider} />
          {renderRecentBooks()}
        </View>
      </ScrollView>
      
      {renderEditProfileDialog()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  coverPhoto: {
    height: 200,
    width: '100%',
  },
  coverGradient: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 40,
    width: '100%',
  },
  profileHeader: {
    flexDirection: 'row',
    marginTop: -50,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  avatar: {
    borderWidth: 4,
    borderColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  profileInfo: {
    marginLeft: 20,
    marginTop: 10,
    flex: 1,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  levelText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  bio: {
    fontSize: 14,
    color: '#666',
    marginVertical: 8,
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#F0F0F0',
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 80,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 60,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    color: '#8A2BE2',
  },
  statsSection: {
    marginVertical: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8A2BE2',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
    color: '#666',
  },
  weeklyGoalContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  weeklyGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weeklyGoalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  weeklyGoalProgress: {
    fontSize: 14,
    color: '#666',
  },
  weeklyGoalBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
  },
  badgeSection: {
    marginVertical: 16,
  },
  badgeScroll: {
    flexDirection: 'row',
  },
  badgeContainer: {
    alignItems: 'center',
    marginRight: 16,
    width: 75,
    position: 'relative',
  },
  badgeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  lockedBadge: {
    backgroundColor: '#F0F0F0',
    opacity: 0.7,
  },
  badgeName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  lockedText: {
    color: '#AAAAAA',
  },
  lockIconContainer: {
    position: 'absolute',
    top: 0,
    right: 8,
    backgroundColor: '#AAAAAA',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentBooksSection: {
    marginVertical: 16,
  },
  recentBooksScroll: {
    flexDirection: 'row',
  },
  bookCard: {
    width: 150,
    marginRight: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F8F8F8',
  },
  bookCover: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  bookDetails: {
    padding: 8,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  bookAuthor: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  lastRead: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
  },
  progressText: {
    fontSize: 10,
    marginLeft: 8,
    color: '#666',
  },
  divider: {
    backgroundColor: '#EEEEEE',
    height: 1,
    marginVertical: 8,
  },
  dialog: {
    borderRadius: 8,
  },
  dialogInput: {
    marginBottom: 16,
  },
});

export default ProfileScreen;