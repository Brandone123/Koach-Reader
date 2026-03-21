import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Modal,
} from 'react-native';
import { Avatar, Menu } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logout } from '../slices/authSlice';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);

  // Mock data - à remplacer par de vraies données
  const stats = {
    booksRead: 24,
    koachPoints: 1250,
    readingStreak: 15,
    badges: 8,
  };

  const readingBadges = [
    { id: 1, name: 'Baobab de Sagesse', icon: '🌳', earned: true },
    { id: 2, name: 'Griot Moderne', icon: '🎭', earned: true },
    { id: 3, name: 'Explorateur du Sahel', icon: '🏜️', earned: false },
    { id: 4, name: 'Gardien des Traditions', icon: '👑', earned: true },
    { id: 5, name: 'Conteur des Savanes', icon: '🦁', earned: false },
    { id: 6, name: 'Sage du Kilimandjaro', icon: '⛰️', earned: false },
  ];

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleSettings = () => {
    setMenuVisible(false);
    navigation.navigate('Settings');
  };

  const handleLogout = () => {
    setMenuVisible(false);
    dispatch(logout());
  };

  const handleAddFriends = () => {
    navigation.navigate('AddFriends');
  };

  return (
    <View style={styles.container}>
       <StatusBar barStyle="light-content" backgroundColor="#8A2BE2" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.profileRow}>
            <Avatar.Image
              size={60}
              source={{
                uri: user?.avatar_url || 'https://randomuser.me/api/portraits/men/17.jpg'
              }}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.username}>
                {user?.username || t('common.welcome')}
              </Text>
              <Text style={styles.memberSince}>
                {t('profile.reader')} {user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
              </Text>
            </View>

            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
                  <MaterialCommunityIcons name="dots-vertical" size={24} color="#333" />
                </TouchableOpacity>
              }
            >
              <Menu.Item onPress={handleSettings} title={t('common.settings')} />
              <Menu.Item onPress={handleLogout} title={t('common.logout')} />
            </Menu>
          </View>

          {/* Stats en ligne */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.booksRead}</Text>
              <Text style={styles.statLabel}>{t('profile.booksRead')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.koachPoints}</Text>
              <Text style={styles.statLabel}>{t('profile.koachPoints')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.readingStreak}</Text>
              <Text style={styles.statLabel}>{t('profile.days')}</Text>
            </View>

            {/* Bouton Ajouter des amis */}
            <TouchableOpacity style={styles.addFriendsButton} onPress={handleAddFriends}>
              <MaterialCommunityIcons name="account-plus" size={18} color="#fff" />
              <Text style={styles.addFriendsText}>{t('profile.addFriends')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Contenu scrollable */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section Statistiques détaillées */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('stats.title')}</Text>

          <View style={styles.recapGrid}>
            <View style={styles.recapCard}>
              <View style={styles.recapIcon}>
                <MaterialCommunityIcons name="star" size={28} color="#FFD700" />
              </View>
              <Text style={styles.recapNumber}>{stats.koachPoints}</Text>
              <Text style={styles.recapLabel}>{t('profile.koachPoints')}</Text>
            </View>

            <View style={styles.recapCard}>
              <View style={styles.recapIcon}>
                <MaterialCommunityIcons name="fire" size={28} color="#FF6B35" />
              </View>
              <Text style={styles.recapNumber}>{stats.readingStreak}</Text>
              <Text style={styles.recapLabel}>{t('profile.readingStreak')}</Text>
            </View>

            <View style={styles.recapCard}>
              <View style={styles.recapIcon}>
                <MaterialCommunityIcons name="book-open-variant" size={28} color="#4CAF50" />
              </View>
              <Text style={styles.recapNumber}>{stats.booksRead}</Text>
              <Text style={styles.recapLabel}>{t('profile.completedBooks')}</Text>
            </View>

            <View style={styles.recapCard}>
              <View style={styles.recapIcon}>
                <MaterialCommunityIcons name="trophy" size={28} color="#8A2BE2" />
              </View>
              <Text style={styles.recapNumber}>{stats.badges}</Text>
              <Text style={styles.recapLabel}>{t('profile.achievements')}</Text>
            </View>
          </View>
        </View>

        {/* Section Succès */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('profile.achievements')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Achievements')}>
              <Text style={styles.viewAll}>{t('profile.viewAll')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.achievementsGrid}>
            {/* Records personnels
            <View style={styles.achievementCategory}>
              <Text style={styles.categoryTitle}>{t('achievements.personalRecords')}</Text>
              <View style={styles.recordsRow}>
                <TouchableOpacity 
                  style={styles.recordCard}
                  onPress={() => setSelectedAchievement({
                    id: 1,
                    title: 'Série record',
                    description: 'Tu as terminé 388 Quêtes du jour et décroché le succès Série record !',
                    icon: '🔥',
                    points: 388,
                    date: '9 août 2025',
                    type: 'record'
                  })}
                >
                  <Text style={styles.recordIcon}>🔥</Text>
                  <Text style={styles.recordNumber}>388</Text>
                  <Text style={styles.recordLabel}>Série record</Text>
                  <Text style={styles.recordDate}>9 août 2025</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.recordCard}
                  onPress={() => setSelectedAchievement({
                    id: 2,
                    title: 'Chez les pros',
                    description: 'Tu as atteint le rang #10 et décroché le succès Chez les pros !',
                    icon: '🏆',
                    points: 10,
                    date: '26 nov. 2024',
                    type: 'record'
                  })}
                >
                  <Text style={styles.recordIcon}>🏆</Text>
                  <Text style={styles.recordNumber}>#10</Text>
                  <Text style={styles.recordLabel}>Chez les pros</Text>
                  <Text style={styles.recordDate}>26 nov. 2024</Text>
                </TouchableOpacity>
              </View>
            </View> */}

            {/* Distinctions récentes */}
            <View style={styles.achievementCategory}>
              {/* <Text style={styles.categoryTitle}>{t('achievements.distinctions')}</Text> */}
              <View style={styles.distinctionsGrid}>
                {[
                  { id: 1, icon: '🏅', points: 500, title: 'En quête de gloire', progress: '9 sur 10', isNew: true },
                  { id: 2, icon: '🎯', points: 25, title: 'Semaine parfaite', progress: '7 sur 9', isNew: true },
                  { id: 3, icon: '⚡', points: 300, title: 'Terreur des erreurs', progress: '8 sur 10', isNew: true },
                ].map((distinction) => (
                  <TouchableOpacity 
                    key={distinction.id}
                    style={styles.distinctionCard}
                    onPress={() => setSelectedAchievement({
                      id: distinction.id,
                      title: distinction.title,
                      description: `Tu as progressé dans ${distinction.title} ! Continue pour débloquer ce succès.`,
                      icon: distinction.icon,
                      points: distinction.points,
                      progress: distinction.progress,
                      type: 'distinction'
                    })}
                  >
                    {distinction.isNew && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>NOUVEAU</Text>
                      </View>
                    )}
                    <Text style={styles.distinctionIcon}>{distinction.icon}</Text>
                    <Text style={styles.distinctionPoints}>{distinction.points}</Text>
                    <Text style={styles.distinctionTitle}>{distinction.title}</Text>
                    <Text style={styles.distinctionProgress}>{distinction.progress}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Section Badges africains */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('profile.badges')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Badges')}>
              <Text style={styles.viewAll}>{t('profile.viewAllBadges')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.badgesGrid}>
            {readingBadges.slice(0, 6).map((badge) => (
              <View key={badge.id} style={[styles.badgeItem, !badge.earned && styles.badgeItemLocked]}>
                <View style={[styles.badgeCircle, !badge.earned && styles.badgeCircleLocked]}>
                  <Text style={[styles.badgeEmoji, !badge.earned && styles.badgeEmojiLocked]}>
                    {badge.icon}
                  </Text>
                </View>
                <Text style={[styles.badgeName, !badge.earned && styles.badgeNameLocked]} numberOfLines={2}>
                  {badge.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section Activité récente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('common.loading')}</Text>

          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <MaterialCommunityIcons name="book-check" size={24} color="#4CAF50" />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{t('profile.achievements')} {t('common.success')}</Text>
                <Text style={styles.activityTime}>Il y a 1 jour</Text>
              </View>
              <Text style={styles.activityPoints}>+100 {t('common.points')}</Text>
            </View>

            <View style={styles.activityItem}>
              <MaterialCommunityIcons name="fire" size={28} color="#FF6B35" />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{t('profile.readingStreak')} 15 {t('profile.days')}</Text>
                <Text style={styles.activityTime}>Il y a 2 jours</Text>
              </View>
              <Text style={styles.activityPoints}>+25 {t('common.points')}</Text>
            </View>

            <View style={styles.activityItem}>
              <MaterialCommunityIcons name="account-plus" size={24} color="#2196F3" />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{t('profile.addFriends')}</Text>
                <Text style={styles.activityTime}>Il y a 3 jours</Text>
              </View>
              <Text style={styles.activityPoints}>+10 {t('common.points')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal pour les succès */}
      <Modal
        visible={!!selectedAchievement}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedAchievement(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.achievementModal}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedAchievement(null)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share" size={24} color="#fff" />
            </TouchableOpacity>

            {selectedAchievement && (
              <>
                <View style={styles.achievementIconContainer}>
                  <Text style={styles.achievementModalIcon}>{selectedAchievement.icon}</Text>
                  <Text style={styles.achievementModalPoints}>{selectedAchievement.points}</Text>
                </View>
                
                <Text style={styles.achievementModalDate}>
                  {selectedAchievement.date || new Date().toLocaleDateString()}
                </Text>
                
                <Text style={styles.achievementModalDescription}>
                  {selectedAchievement.description}
                </Text>
                
                <TouchableOpacity 
                  style={styles.rewardButton}
                  onPress={() => setSelectedAchievement(null)}
                >
                  <Text style={styles.rewardButtonText}>{t('achievements.myReward')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: -16,
    zIndex: 1,
    padding: 0,
    // backgroundColor: '#8A2BE2',
    // borderRadius: 20,
    // width: 35,
    // height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  memberSince: {
    fontSize: 11,
    color: '#666',
  },
  menuButton: {
    padding: 5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  addFriendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 4,
  },
  addFriendsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
  },
  section: {
    marginVertical: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  viewAll: {
    color: '#8A2BE2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recapCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    width: (width - 33) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recapIcon: {
    marginBottom: 8,
  },
  recapNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  recapLabel: {
    fontSize: 11,
    color: '#95A5A6',
    textAlign: 'center',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeItem: {
    alignItems: 'center',
    width: (width - 68) / 3,
  },
  badgeItemLocked: {
    opacity: 0.5,
  },
  badgeCircle: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeCircleLocked: {
    backgroundColor: '#f0f0f0',
  },
  badgeEmoji: {
    fontSize: 22,
  },
  badgeEmojiLocked: {
    opacity: 0.5,
  },
  badgeName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: 12,
  },
  badgeNameLocked: {
    color: '#999',
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 7,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#666',
  },
  activityPoints: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#8A2BE2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementModal: {
    backgroundColor: '#2C3E50',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '85%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 1,
  },
  shareButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  achievementIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  achievementModalIcon: {
    fontSize: 80,
    marginBottom: 10,
  },
  achievementModalPoints: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  achievementModalDate: {
    fontSize: 16,
    color: '#F39C12',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  achievementModalDescription: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  rewardButton: {
    backgroundColor: '#3498DB',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  rewardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Styles pour les succès
  achievementsGrid: {
    marginTop: 10,
  },
  achievementCategory: {
    marginBottom: 0,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  recordsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recordCard: {
    width: '48%',
    backgroundColor: '#34495E',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  recordIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  recordNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  recordLabel: {
    fontSize: 12,
    color: '#BDC3C7',
    textAlign: 'center',
    marginBottom: 3,
  },
  recordDate: {
    fontSize: 10,
    color: '#95A5A6',
  },
  distinctionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  distinctionCard: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#E74C3C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  distinctionIcon: {
    fontSize: 25,
    marginBottom: 5,
  },
  distinctionPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  distinctionTitle: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginBottom: 2,
  },
  distinctionProgress: {
    fontSize: 9,
    color: '#999',
  },
});

export default ProfileScreen;





