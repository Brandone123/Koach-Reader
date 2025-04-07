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
  Alert,
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
  Appbar,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { useTranslation } from 'react-i18next';
import { colors } from '../utils/theme';

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
  const { t } = useTranslation();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [editableProfile, setEditableProfile] = useState({
    displayName: user?.username || '',
    bio: 'Avid reader and book enthusiast. Love to explore new worlds through reading.',
  });
  
  const handleLogout = () => {
    Alert.alert(
      t('common.logout'),
      t('profile.logoutConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('profile.confirmLogout'), onPress: logout }
      ]
    );
  };
  
  const handleDeleteProfile = () => {
    setDeleteConfirmVisible(true);
  };
  
  const confirmDeleteProfile = () => {
    // In a real app, this would call an API to delete the user's profile
    // For now, we'll just log them out
    setDeleteConfirmVisible(false);
    logout();
    // The AuthNavigator will automatically show after logout
  };
  
  const handleEditProfile = () => {
    setMenuVisible(false);
    setEditDialogVisible(true);
  };
  
  const handleSaveProfile = () => {
    // Save profile changes to backend - would be implemented in a real app
    setEditDialogVisible(false);
  };
  
  const handleOpenSettings = () => {
    setMenuVisible(false);
    navigation.navigate('Settings');
  };
  
  const handleMenuLogout = () => {
    setMenuVisible(false);
    handleLogout();
  };

  const renderBadges = () => {
    return (
      <View style={styles.badgeSection}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>{t('profile.achievements')}</Title>
          <TouchableOpacity onPress={() => navigation.navigate('Badges')}>
            <Caption style={styles.seeAll}>{t('common.viewAll')}</Caption>
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
          <Title style={styles.sectionTitle}>{t('profile.completedBooks')}</Title>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Caption style={styles.seeAll}>{t('common.viewAll')}</Caption>
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
                <Caption style={styles.lastRead}>{t('book.lastRead')} {book.lastRead}</Caption>
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
          <Title style={styles.sectionTitle}>{t('stats.title')}</Title>
          <TouchableOpacity onPress={() => navigation.navigate('Stats')}>
            <Caption style={styles.seeAll}>{t('common.viewAll')}</Caption>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{readingStats.totalMinutes}</Text>
            <Text style={styles.statLabel}>{t('stats.readingTime')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{readingStats.booksCompleted}</Text>
            <Text style={styles.statLabel}>{t('stats.booksCompleted')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{readingStats.currentStreak}</Text>
            <Text style={styles.statLabel}>{t('stats.currentStreak')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{readingStats.longestStreak}</Text>
            <Text style={styles.statLabel}>{t('stats.longestStreak')}</Text>
          </View>
        </View>
        
        <View style={styles.weeklyGoalContainer}>
          <View style={styles.weeklyGoalHeader}>
            <Text style={styles.weeklyGoalTitle}>{t('readingPlan.weeklyGoal')}</Text>
            <Text style={styles.weeklyGoalProgress}>
              {readingStats.weeklyProgress} {t('common.of')} {readingStats.weeklyGoal} {t('stats.days')}
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
          <Dialog.Title>{t('profile.editProfile')}</Dialog.Title>
          <Dialog.Content>
          <TextInput
              label={t('profile.displayName')}
              value={editableProfile.displayName}
              onChangeText={(text) => setEditableProfile({ ...editableProfile, displayName: text })}
              style={styles.dialogInput}
              mode="outlined"
            />
          <TextInput
              label={t('profile.bio')}
              value={editableProfile.bio}
              onChangeText={(text) => setEditableProfile({ ...editableProfile, bio: text })}
              style={styles.dialogInput}
              multiline
              numberOfLines={3}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>{t('common.cancel')}</Button>
            <Button onPress={handleSaveProfile}>{t('common.save')}</Button>
          </Dialog.Actions>
        </Dialog>
        
        <Dialog
          visible={deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>{t('profile.deleteProfile') || 'Delete Profile'}</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.deleteWarningText}>
              {t('profile.deleteWarning') || 'Are you sure you want to delete your profile? This action cannot be undone.'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteConfirmVisible(false)}>{t('common.cancel')}</Button>
            <Button 
              onPress={confirmDeleteProfile} 
              textColor={colors.error || '#B00020'}
            >
              {t('profile.confirmDelete') || 'Delete'}
            </Button>
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
            {/* <IconButton
              icon="arrow-left"
              iconColor="#FFFFFF"
              size={24}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            /> */}
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  iconColor="#FFFFFF"
                  size={24}
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              <Menu.Item onPress={handleEditProfile} title={t('profile.editProfile')} />
              <Menu.Item onPress={handleOpenSettings} title={t('common.settings')} />
              <Divider />
              <Menu.Item onPress={handleMenuLogout} title={t('common.logout')} />
            </Menu>
          </View>
        </LinearGradient>
      </ImageBackground>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContentContainer}
      >
        <View style={styles.profileInfo}>
          <Title style={styles.username}>{user?.username || t('common.reader')}</Title>
          <View style={styles.levelContainer}>
            <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
            <Text style={styles.levelText}>{t('profile.levelReader', { level: 8 })}</Text>
          </View>
          <Text style={styles.bio}>
            {editableProfile.bio}
          </Text>
        </View>
        
        <View style={styles.interestsContainer}>
          <Text style={styles.interestsLabel}>{t('profile.interests') || 'Interests'}</Text>
          <View style={styles.interests}>
            <Chip style={styles.interestChip} textStyle={{ color: '#666' }}>{t('categories.fiction')}</Chip>
            <Chip style={styles.interestChip} textStyle={{ color: '#666' }}>{t('categories.theology')}</Chip>
            <Chip style={styles.interestChip} textStyle={{ color: '#666' }}>{t('categories.jesus')}</Chip>
          </View>
        </View>

        <View style={styles.content}>
          {renderReadingStats()}
          <Divider style={styles.divider} />
          {renderBadges()}
          <Divider style={styles.divider} />
          {renderRecentBooks()}
          
          <Card style={styles.deleteCard}>
            <Card.Content>
              <Button 
                mode="contained" 
                icon="account-remove" 
                onPress={handleDeleteProfile}
                style={styles.deleteButton}
                contentStyle={styles.deleteButtonContent}
                labelStyle={styles.deleteButtonLabel}
              >
                {t('profile.deleteProfile') || 'Delete My Profile'}
              </Button>
            </Card.Content>
          </Card>
          
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Koach Reader v1.0.0</Text>
          </View>
        </View>
      </ScrollView>
  
      {/* Fixed avatar that stays above scrolling content */}
      <View style={styles.avatarContainerFixed}>
        <Avatar.Image
          source={{ uri: 'https://randomuser.me/api/portraits/women/17.jpg' }}
          size={120}
          style={styles.avatar}
        />
        <View style={styles.levelIndicator}>
          <Text style={styles.levelIndicatorText}>8</Text>
        </View>
      </View>
      
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
    height: 150,
    width: '100%',
  },
  coverGradient: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 300,
    paddingTop: 50,
    width: '100%',
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    margin: 0,
  },
  avatarContainerFixed: {
    position: 'absolute',
    top: 75,
    alignSelf: 'center',
    zIndex: 999,
    elevation: 10,
  },
  avatar: {
    borderWidth: 4,
    borderColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  levelIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8A2BE2',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    zIndex: 1000,
  },
  levelIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileInfo: {
    marginTop: 45,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  username: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
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
    lineHeight: 20,
  },
  interestsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  interestsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
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
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 20,
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
  deleteCard: {
    marginTop: 30,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  deleteButton: {
    backgroundColor: colors.error || '#B00020',
    borderRadius: 8,
    marginVertical: 10,
  },
  deleteButtonContent: {
    height: 50,
  },
  deleteButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  versionText: {
    color: '#999',
    fontSize: 12,
  },
  dialog: {
    borderRadius: 12,
  },
  dialogInput: {
    marginBottom: 12,
  },
  deleteWarningText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  }
});

export default ProfileScreen;