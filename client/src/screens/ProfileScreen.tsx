import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  ScrollView, 
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  ImageBackground,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  useTheme, // Import useTheme
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectUser } from '../slices/authSlice';
import { useTranslation } from 'react-i18next';
// import { colors } from '../utils/theme'; // Using theme from paper now
import { RootStackParamList } from '../types/navigation';
import { AppDispatch } from '../store';

const { width, height } = Dimensions.get('window');

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

// Mock data - replace with actual data from selectors or API calls
const badges: Badge[] = [
  { id: 1, name: 'Early Bird', icon: 'alarm', description: 'Read 5 days in a row before 8 AM', unlocked: true },
  { id: 2, name: 'Bookworm', icon: 'book-open-variant', description: 'Read 10 books', unlocked: true },
  { id: 3, name: 'Night Owl', icon: 'weather-night', description: 'Read 5 days in a row after 10 PM', unlocked: false },
];

const recentBooks: Book[] = [
  { id: 1, title: 'The Alchemist', author: 'Paulo Coelho', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1654371463i/18144590.jpg', lastRead: '2 days ago', progress: 0.75 },
];

const readingStats = {
  totalMinutes: 2480,
  booksCompleted: 12,
  currentStreak: 8, // This will be replaced by user.reading_streak
  longestStreak: 21,
  weeklyGoal: 5,
  weeklyProgress: 4,
};


const ProfileScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme(); // Get theme
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const [editableProfile, setEditableProfile] = useState({
    displayName: user?.username || '',
    bio: user?.preferences?.bio || 'A passionate reader on a journey with Koach.', // Assuming bio might be in preferences
  });

  useEffect(() => {
    if (user) {
      setEditableProfile({
        displayName: user.username,
        bio: user.preferences?.bio || 'A passionate reader on a journey with Koach.',
      });
    }
  }, [user]);
  
  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      // Navigation to auth screens is handled by AppNavigator
    } catch (error) {
      console.error('Failed to logout:', error);
      Alert.alert(t('common.errorText'), t('profile.logoutError', 'Failed to log out.'));
    }
  };
  
  const handleDeleteProfile = () => setDeleteConfirmVisible(true);
  
  const confirmDeleteProfile = () => {
    setDeleteConfirmVisible(false);
    // Actual delete logic would go here
    console.log("Profile deletion initiated (mock).");
    handleLogout();
  };
  
  const handleEditProfile = () => {
    setMenuVisible(false);
    setEditDialogVisible(true);
  };
  
  const handleSaveProfile = () => {
    // TODO: Dispatch action to update user profile (displayName, bio)
    // e.g., dispatch(updateUserProfile({ username: editableProfile.displayName, preferences: { bio: editableProfile.bio } }));
    console.log("Profile changes saved (mock):", editableProfile);
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

  const renderBadges = () => (
    <View style={styles.badgeSection}>
      <View style={styles.sectionHeader}>
        <Title style={[styles.sectionTitle, {color: theme.colors.onBackground}]}>{t('profile.achievements')}</Title>
        <TouchableOpacity onPress={() => navigation.navigate('Badges')}>
          <Caption style={[styles.seeAll, {color: theme.colors.primary}]}>{t('common.viewAll')}</Caption>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
        {badges.map((badge) => (
          <View key={badge.id} style={styles.badgeContainer}>
            <View style={[styles.badgeIconContainer, {backgroundColor: badge.unlocked ? theme.colors.primaryContainer : theme.colors.surfaceDisabled}, !badge.unlocked && styles.lockedBadge]}>
              <MaterialCommunityIcons name={badge.icon} size={32} color={badge.unlocked ? theme.colors.primary : theme.colors.onSurfaceDisabled}/>
            </View>
            <Text style={[styles.badgeName, {color: badge.unlocked ? theme.colors.onSurface : theme.colors.onSurfaceDisabled}, !badge.unlocked && styles.lockedText]}>
              {badge.name}
            </Text>
            {!badge.unlocked && (
              <View style={[styles.lockIconContainer, {backgroundColor: theme.colors.backdrop}]}>
                <MaterialCommunityIcons name="lock" size={14} color={theme.colors.surface} />
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderRecentBooks = () => (
    <View style={styles.recentBooksSection}>
      <View style={styles.sectionHeader}>
        <Title style={[styles.sectionTitle, {color: theme.colors.onBackground}]}>{t('profile.completedBooks')}</Title>
        {/* <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Caption style={[styles.seeAll, {color: theme.colors.primary}]}>{t('common.viewAll')}</Caption>
        </TouchableOpacity> */}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentBooksScroll}>
        {recentBooks.map((book) => (
          <TouchableOpacity key={book.id} style={[styles.bookCard, {backgroundColor: theme.colors.surfaceVariant}]} onPress={() => navigation.navigate('BookDetail', { bookId: String(book.id) })}>
            <Image source={{ uri: book.coverImage }} style={styles.bookCover} />
            <View style={styles.bookDetails}>
              <Text style={[styles.bookTitle, {color: theme.colors.onSurfaceVariant}]} numberOfLines={1}>{book.title}</Text>
              <Text style={[styles.bookAuthor, {color: theme.colors.onSurfaceVariant}]} numberOfLines={1}>{book.author}</Text>
              <Caption style={[styles.lastRead, {color: theme.colors.onSurfaceVariant}]}>{t('book.lastRead')} {book.lastRead}</Caption>
              <View style={styles.progressContainer}>
                <ProgressBar progress={book.progress} color={theme.colors.primary} style={[styles.progressBar, {backgroundColor: theme.colors.surfaceDisabled}]} />
                <Text style={[styles.progressText, {color: theme.colors.onSurfaceVariant}]}>{Math.round(book.progress * 100)}%</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderReadingStats = () => (
    <View style={styles.statsSection}>
      <View style={styles.sectionHeader}>
        <Title style={[styles.sectionTitle, {color: theme.colors.onBackground}]}>{t('stats.title')}</Title>
        {/* <TouchableOpacity onPress={() => navigation.navigate('Stats')}>
          <Caption style={[styles.seeAll, {color: theme.colors.primary}]}>{t('common.viewAll')}</Caption>
        </TouchableOpacity> */}
      </View>
      <View style={styles.statsGrid}>
        <View style={[styles.statItem, {backgroundColor: theme.colors.surfaceVariant}]}>
          <Text style={[styles.statValue, {color: theme.colors.primary}]}>{readingStats.totalMinutes}</Text>
          <Text style={[styles.statLabel, {color: theme.colors.onSurfaceVariant}]}>{t('stats.readingTime')}</Text>
        </View>
        <View style={[styles.statItem, {backgroundColor: theme.colors.surfaceVariant}]}>
          <Text style={[styles.statValue, {color: theme.colors.primary}]}>{readingStats.booksCompleted}</Text>
          <Text style={[styles.statLabel, {color: theme.colors.onSurfaceVariant}]}>{t('stats.booksCompleted')}</Text>
        </View>
        <View style={[styles.statItem, {backgroundColor: theme.colors.surfaceVariant}]}>
          <Text style={[styles.statValue, {color: theme.colors.primary}]}>{user?.reading_streak || 0}</Text>
          <Text style={[styles.statLabel, {color: theme.colors.onSurfaceVariant}]}>{t('stats.currentStreak')}</Text>
        </View>
        <View style={[styles.statItem, {backgroundColor: theme.colors.surfaceVariant}]}>
          <Text style={[styles.statValue, {color: theme.colors.primary}]}>{readingStats.longestStreak}</Text>
          <Text style={[styles.statLabel, {color: theme.colors.onSurfaceVariant}]}>{t('stats.longestStreak')}</Text>
        </View>
      </View>
      <View style={[styles.weeklyGoalContainer, {backgroundColor: theme.colors.surfaceVariant}]}>
        <View style={styles.weeklyGoalHeader}>
          <Text style={[styles.weeklyGoalTitle, {color: theme.colors.onSurfaceVariant}]}>{t('readingPlan.weeklyGoal')}</Text>
          <Text style={[styles.weeklyGoalProgress, {color: theme.colors.onSurfaceVariant}]}>
            {readingStats.weeklyProgress} {t('common.of')} {readingStats.weeklyGoal} {t('stats.days')}
          </Text>
        </View>
        <ProgressBar progress={readingStats.weeklyProgress / readingStats.weeklyGoal} color={theme.colors.tertiary} style={[styles.weeklyGoalBar, {backgroundColor: theme.colors.surfaceDisabled}]} />
      </View>
    </View>
  );

  const renderEditProfileDialog = () => (
    <Portal>
      <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)} style={[styles.dialog, {backgroundColor: theme.colors.surface}]}>
        <Dialog.Title style={{color: theme.colors.onSurface}}>{t('profile.editProfile')}</Dialog.Title>
        <Dialog.Content>
          <TextInput label={t('profile.displayName')} value={editableProfile.displayName} onChangeText={(text) => setEditableProfile({ ...editableProfile, displayName: text })} style={styles.dialogInput} mode="outlined" theme={{colors: {background: theme.colors.surface}}}/>
          <TextInput label={t('profile.bio')} value={editableProfile.bio} onChangeText={(text) => setEditableProfile({ ...editableProfile, bio: text })} style={styles.dialogInput} multiline numberOfLines={3} mode="outlined" theme={{colors: {background: theme.colors.surface}}}/>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setEditDialogVisible(false)} textColor={theme.colors.onSurface}>{t('common.cancel')}</Button>
          <Button onPress={handleSaveProfile} textColor={theme.colors.primary}>{t('common.save')}</Button>
        </Dialog.Actions>
      </Dialog>
      <Dialog visible={deleteConfirmVisible} onDismiss={() => setDeleteConfirmVisible(false)} style={[styles.dialog, {backgroundColor: theme.colors.surface}]}>
        <Dialog.Title style={{color: theme.colors.onSurface}}>{t('profile.deleteProfileTitle', 'Delete Profile')}</Dialog.Title>
        <Dialog.Content>
          <Text style={[styles.deleteWarningText, {color: theme.colors.onSurfaceVariant}]}>{t('profile.deleteWarning', 'Are you sure you want to delete your profile? This action cannot be undone.')}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setDeleteConfirmVisible(false)} textColor={theme.colors.onSurface}>{t('common.cancel')}</Button>
          <Button onPress={confirmDeleteProfile} textColor={theme.colors.error}>{t('profile.confirmDelete', 'Delete')}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  if (!user) return null; // Or a loading spinner/placeholder

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <ImageBackground source={{ uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=1053&q=80' }} style={styles.coverPhoto}>
        <LinearGradient colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.4)', theme.colors.background]} style={styles.coverGradient}>
          <View style={styles.headerButtons}>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={<IconButton icon="dots-vertical" iconColor={theme.colors.onPrimaryContainer} size={26} onPress={() => setMenuVisible(true)} style={styles.menuButton}/>}
              contentStyle={{backgroundColor: theme.colors.elevation.level2}}
            >
              <Menu.Item onPress={handleEditProfile} title={<Text style={{color: theme.colors.onSurface}}>{t('profile.editProfile')}</Text>} leadingIcon={() => <MaterialCommunityIcons name="pencil-outline" size={20} color={theme.colors.onSurfaceVariant} />}/>
              <Menu.Item onPress={handleOpenSettings} title={<Text style={{color: theme.colors.onSurface}}>{t('common.settings')}</Text>} leadingIcon={() => <MaterialCommunityIcons name="cog-outline" size={20} color={theme.colors.onSurfaceVariant} />} />
              <Divider style={{backgroundColor: theme.colors.outline}}/>
              <Menu.Item onPress={handleMenuLogout} title={<Text style={{color: theme.colors.error}}>{t('common.logout')}</Text>} leadingIcon={() => <MaterialCommunityIcons name="logout" size={20} color={theme.colors.error} />} />
            </Menu>
          </View>
        </LinearGradient>
      </ImageBackground>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.mainScrollView} contentContainerStyle={styles.scrollContentContainer}>
        <View style={[styles.profileInfo, {marginTop: Platform.OS === 'ios' ? 55 : 60}]}>
          <Title style={[styles.username, {color: theme.colors.onBackground}]}>{user?.username || t('common.reader')}</Title>
          <View style={styles.levelContainer}>
            <MaterialCommunityIcons name="shield-star-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.levelText, {color: theme.colors.primary}]}>{t('profile.levelReader', { level: 8 })}</Text>
          </View>
          <Text style={[styles.bio, {color: theme.colors.onSurfaceVariant}]}>{editableProfile.bio}</Text>
        </View>
        
        <Card style={[styles.koachStatsCard, {backgroundColor: theme.colors.elevation.level1, borderRadius: 12}]}>
          <Card.Content style={styles.koachStatsContent}>
            <View style={styles.koachStatItem}>
              <MaterialCommunityIcons name="star-four-points-outline" size={30} color={theme.colors.primary} />
              <Text style={[styles.koachStatValue, {color: theme.colors.primary}]}>{user?.koach_points || 0}</Text>
              <Text style={[styles.koachStatLabel, {color: theme.colors.onSurfaceVariant}]}>{t('profile.koachPoints', 'Koach Points')}</Text>
            </View>
            <Divider style={[styles.koachStatsDivider, {backgroundColor: theme.colors.outlineVariant}]} />
            <View style={styles.koachStatItem}>
              <MaterialCommunityIcons name="fire-circle" size={30} color={theme.colors.error} />
              <Text style={[styles.koachStatValue, {color: theme.colors.error}]}>{user?.reading_streak || 0}</Text>
              <Text style={[styles.koachStatLabel, {color: theme.colors.onSurfaceVariant}]}>{t('profile.readingStreak', 'Day Streak')}</Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.interestsContainer}>
          <Text style={[styles.interestsLabel, {color: theme.colors.onBackground}]}>{t('profile.interests') || 'Interests'}</Text>
          <View style={styles.interests}>
            <Chip style={[styles.interestChip, {backgroundColor: theme.colors.secondaryContainer}]} textStyle={{color: theme.colors.onSecondaryContainer}}>{t('categories.fiction')}</Chip>
            <Chip style={[styles.interestChip, {backgroundColor: theme.colors.secondaryContainer}]} textStyle={{color: theme.colors.onSecondaryContainer}}>{t('categories.theology')}</Chip>
            <Chip style={[styles.interestChip, {backgroundColor: theme.colors.secondaryContainer}]} textStyle={{color: theme.colors.onSecondaryContainer}}>{t('categories.jesus')}</Chip>
          </View>
        </View>

        <View style={styles.content}>
          {renderReadingStats()}
          <Divider style={[styles.divider, {backgroundColor: theme.colors.outlineVariant}]} />
          {renderBadges()}
          <Divider style={[styles.divider, {backgroundColor: theme.colors.outlineVariant}]} />
          {renderRecentBooks()}
          
          <Card style={[styles.deleteCard, {backgroundColor: theme.colors.surface}]}>
            <Card.Content>
              <Button mode="contained" icon="account-remove" onPress={handleDeleteProfile} style={[styles.deleteButton, {backgroundColor: theme.colors.errorContainer}]} labelStyle={[styles.deleteButtonLabel, {color: theme.colors.onErrorContainer}]}>
                {t('profile.deleteProfileTitle', 'Delete My Profile')}
              </Button>
            </Card.Content>
          </Card>
          
          <View style={[styles.versionContainer, {paddingBottom: Platform.OS === 'ios' ? 30 : 20}]}>
            <Text style={[styles.versionText, {color: theme.colors.onSurfaceDisabled}]}>Koach Reader v1.0.0</Text>
          </View>
        </View>
      </ScrollView>
  
      <View style={styles.avatarContainerFixed}>
        <Avatar.Image source={{ uri: user?.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg' }} size={120} style={[styles.avatar, {borderColor: theme.colors.background}]} />
        <View style={[styles.levelIndicator, {backgroundColor: theme.colors.primary, borderColor: theme.colors.background}]}>
          <Text style={[styles.levelIndicatorText, {color: theme.colors.onPrimary}]}>8</Text>
        </View>
      </View>
      
      {renderEditProfileDialog()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  coverPhoto: {
    height: 180, // Increased height for better visual
    width: '100%',
  },
  coverGradient: {
    flex: 1,
    justifyContent: 'flex-end', // Push content to bottom (e.g. username if it were here)
    // alignItems: 'center', // Removed, headerButtons are aligned via its own style
  },
  headerButtons: {
    position: 'absolute', // Position menu button absolutely within gradient/cover
    top: Platform.OS === 'ios' ? 40 : 10,
    right: 10,
    flexDirection: 'row',
    // justifyContent: 'flex-end', // Align to right
    // width: '100%', // Take full width to allow right alignment
    // paddingHorizontal: 10,
    // paddingTop: Platform.OS === 'ios' ? 40 : 15,
  },
  menuButton: {
    // backgroundColor: 'rgba(0,0,0,0.2)', // Optional: slight background for visibility
  },
  avatarContainerFixed: {
    position: 'absolute',
    top: 110, // Adjusted to be lower, overlapping gradient and start of scroll content
    alignSelf: 'center',
    zIndex: 10, // Ensure it's above other elements
  },
  avatar: {
    borderWidth: 4,
    // borderColor: theme.colors.background, // Themed
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
    // backgroundColor: theme.colors.primary, // Themed
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    // borderColor: theme.colors.background, // Themed
  },
  levelIndicatorText: {
    // color: theme.colors.onPrimary, // Themed
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileInfo: {
    marginTop: 70, // Increased top margin to account for avatar
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10, // Space before Koach stats card
  },
  username: {
    fontSize: 26,
    fontWeight: 'bold',
    // color: theme.colors.onBackground, // Themed
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
    // color: theme.colors.primary, // Themed
    fontWeight: '600',
  },
  bio: {
    fontSize: 14,
    // color: theme.colors.onSurfaceVariant, // Themed
    marginVertical: 8,
    lineHeight: 20,
    textAlign: 'center',
  },
  koachStatsCard: {
    marginHorizontal: 20,
    marginTop: 0, // Reduced from 15 as profileInfo has marginBottom
    marginBottom: 15, // Space after card
    elevation: 2, // Softer elevation
    // backgroundColor: theme.colors.surface, // Applied in component
  },
  koachStatsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12, // Reduced padding
  },
  koachStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  koachStatValue: {
    fontSize: 20, // Slightly reduced
    fontWeight: 'bold',
    marginTop: 4,
  },
  koachStatLabel: {
    fontSize: 11, // Slightly smaller
    marginTop: 2,
    textTransform: 'uppercase',
    // color: theme.colors.onSurfaceVariant, // Themed
  },
  koachStatsDivider: {
    width: 1,
    height: '60%', // Adjusted height
    alignSelf: 'center',
    // backgroundColor: theme.colors.outlineVariant, // Themed
  },
  interestsContainer: {
    marginTop: 10, // Reduced margin
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  interestsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    // color: theme.colors.onBackground, // Themed
    marginBottom: 8,
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestChip: {
    marginRight: 8,
    marginBottom: 8,
    // backgroundColor: theme.colors.secondaryContainer, // Themed
    // textStyle: theme.colors.onSecondaryContainer // Themed (passed in component)
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 10, // Reduced margin
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
    // color: theme.colors.onBackground, // Themed
  },
  seeAll: {
    // color: theme.colors.primary, // Themed
    fontWeight: '600',
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
    // backgroundColor: theme.colors.surfaceVariant, // Themed
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    // color: theme.colors.primary, // Themed
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
    // color: theme.colors.onSurfaceVariant, // Themed
  },
  weeklyGoalContainer: {
    // backgroundColor: theme.colors.surfaceVariant, // Themed
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 1,
  },
  weeklyGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weeklyGoalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    // color: theme.colors.onSurfaceVariant, // Themed
  },
  weeklyGoalProgress: {
    fontSize: 14,
    // color: theme.colors.onSurfaceVariant, // Themed
  },
  weeklyGoalBar: {
    height: 8,
    borderRadius: 4,
    // backgroundColor: theme.colors.surfaceDisabled, // Themed
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
    width: 75, // Keep it compact for horizontal scroll
    position: 'relative',
  },
  badgeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    // backgroundColor: theme.colors.primaryContainer or surfaceDisabled // Themed
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  lockedBadge: {
    opacity: 0.7, // Keep opacity for locked visual
  },
  badgeName: {
    fontSize: 12,
    // color: theme.colors.onSurface or onSurfaceDisabled // Themed
    textAlign: 'center',
  },
  lockedText: {
    // color: theme.colors.onSurfaceDisabled, // Themed
  },
  lockIconContainer: {
    position: 'absolute',
    top: 0,
    right: 8, // Adjust if needed
    // backgroundColor: theme.colors.backdrop, // Themed
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
    // backgroundColor: theme.colors.surfaceVariant, // Themed
    elevation: 2,
  },
  bookCover: {
    width: '100%',
    height: 200, // Maintain aspect ratio
    resizeMode: 'cover',
  },
  bookDetails: {
    padding: 8,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    // color: theme.colors.onSurfaceVariant, // Themed
  },
  bookAuthor: {
    fontSize: 12,
    // color: theme.colors.onSurfaceVariant, // Themed
    marginTop: 2,
  },
  lastRead: {
    fontSize: 10,
    // color: theme.colors.onSurfaceVariant, // Themed (dimmer)
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
    // backgroundColor: theme.colors.surfaceDisabled, // Themed
  },
  progressText: {
    fontSize: 10,
    marginLeft: 8,
    // color: theme.colors.onSurfaceVariant, // Themed
  },
  divider: {
    // backgroundColor: theme.colors.outlineVariant, // Themed
    height: 1,
    marginVertical: 8, // Reduced margin for tighter sections
  },
  deleteCard: {
    marginTop: 20, // Reduced margin
    elevation: 1, // Softer elevation
    borderRadius: 12,
    // backgroundColor: theme.colors.surface, // Themed
  },
  deleteButton: {
    // backgroundColor: theme.colors.errorContainer, // Themed
    borderRadius: 8,
    marginVertical: 10,
  },
  deleteButtonContent: { // Can be removed if default padding is okay
    // height: 50,
  },
  deleteButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    // color: theme.colors.onErrorContainer, // Themed
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
    // paddingBottom: Platform.OS === 'ios' ? 30 : 20, // Themed
  },
  versionText: {
    // color: theme.colors.onSurfaceDisabled, // Themed
    fontSize: 12,
  },
  dialog: {
    borderRadius: 12,
    // backgroundColor: theme.colors.surface // Themed
  },
  dialogInput: {
    marginBottom: 12,
    // theme: {colors: {background: theme.colors.surface}} // Applied in component
  },
  deleteWarningText: {
    fontSize: 16,
    lineHeight: 24,
    // color: theme.colors.onSurfaceVariant, // Themed
  }
});

export default ProfileScreen;