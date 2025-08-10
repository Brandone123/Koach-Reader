import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Appbar,
  Button,
  Avatar,
  Chip,
  Searchbar,
  Divider,
  Portal,
  Surface,
  IconButton,
  RadioButton
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import { selectUser } from '../slices/authSlice';
import { fetchApi } from '../utils/api';
import { mockFetchApi } from '../utils/mockApi';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchLeaderboard, selectLeaderboard, selectIsLoading } from '../slices/koachSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type LeaderboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Leaderboard'>;

interface LeaderboardScreenProps {
  navigation: LeaderboardScreenNavigationProp;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector(selectUser);

  // Dummy data pour le livre en cours
  const currentBook = {
    title: "L'Étranger",
    author: "Albert Camus",
    totalPages: 123,
    category: "Littérature française",
    coverUrl: "https://amjodckmmxmpholspskm.supabase.co/storage/v1/object/public/covers/book.jpg"
  };

  // Dummy data étendu - 20 lecteurs
  const leaderboardData = [
    { id: 1, username: "Aminata Diallo", country: "🇸🇳", booksRead: 47, koachPoints: 2850, badge: "Baobab de Sagesse", badgeLevel: "gold", currentPage: 89, readingStreak: 15, isCurrentUser: false },
    { id: 2, username: "Kwame Asante", country: "🇬🇭", booksRead: 32, koachPoints: 2100, badge: "Griot Numérique", badgeLevel: "silver", currentPage: 76, readingStreak: 12, isCurrentUser: false },
    { id: 3, username: "Brandone Sape", country: "🇨🇲", booksRead: 28, koachPoints: 1890, badge: "Sage des Mots", badgeLevel: "silver", currentPage: 65, readingStreak: 8, isCurrentUser: true },
    { id: 4, username: "Omar Benali", country: "🇲🇦", booksRead: 23, koachPoints: 1650, badge: "Gardien des Récits", badgeLevel: "bronze", currentPage: 58, readingStreak: 5, isCurrentUser: false },
    { id: 5, username: "Aisha Mwangi", country: "🇰🇪", booksRead: 19, koachPoints: 1420, badge: "Explorateur Littéraire", badgeLevel: "bronze", currentPage: 45, readingStreak: 3, isCurrentUser: false },
    { id: 6, username: "Moussa Traoré", country: "🇧🇫", booksRead: 15, koachPoints: 1200, badge: "Apprenti Lecteur", badgeLevel: "beginner", currentPage: 32, readingStreak: 2, isCurrentUser: false },
    { id: 7, username: "Khadija Ouali", country: "🇹🇳", booksRead: 21, koachPoints: 1580, badge: "Gardien des Récits", badgeLevel: "bronze", currentPage: 67, readingStreak: 7, isCurrentUser: false },
    { id: 8, username: "Sekou Touré", country: "🇬🇳", booksRead: 18, koachPoints: 1350, badge: "Explorateur Littéraire", badgeLevel: "bronze", currentPage: 41, readingStreak: 4, isCurrentUser: false },
    { id: 9, username: "Mariam Kone", country: "🇨🇮", booksRead: 25, koachPoints: 1750, badge: "Sage des Mots", badgeLevel: "silver", currentPage: 72, readingStreak: 9, isCurrentUser: false },
    { id: 10, username: "Youssef Alami", country: "��", booksRead: 16, koachPoints: 1180, badge: "Apprenti Lecteur", badgeLevel: "beginner", currentPage: 38, readingStreak: 3, isCurrentUser: false },
    { id: 11, username: "Awa Diop", country: "🇸🇳", booksRead: 22, koachPoints: 1620, badge: "Gardien des Récits", badgeLevel: "bronze", currentPage: 55, readingStreak: 6, isCurrentUser: false },
    { id: 12, username: "Ibrahim Sow", country: "🇲🇷", booksRead: 14, koachPoints: 1050, badge: "Apprenti Lecteur", badgeLevel: "beginner", currentPage: 29, readingStreak: 2, isCurrentUser: false },
    { id: 13, username: "Zara Okafor", country: "🇳🇬", booksRead: 20, koachPoints: 1480, badge: "Explorateur Littéraire", badgeLevel: "bronze", currentPage: 48, readingStreak: 5, isCurrentUser: false },
    { id: 14, username: "Adama Sanogo", country: "🇲🇱", booksRead: 17, koachPoints: 1280, badge: "Apprenti Lecteur", badgeLevel: "beginner", currentPage: 35, readingStreak: 4, isCurrentUser: false },
    { id: 15, username: "Leila Mansouri", country: "🇪🇬", booksRead: 24, koachPoints: 1720, badge: "Sage des Mots", badgeLevel: "silver", currentPage: 69, readingStreak: 8, isCurrentUser: false },
    { id: 16, username: "Kofi Mensah", country: "🇬🇭", booksRead: 13, koachPoints: 980, badge: "Apprenti Lecteur", badgeLevel: "beginner", currentPage: 26, readingStreak: 1, isCurrentUser: false },
    { id: 17, username: "Amina Bello", country: "🇳🇪", booksRead: 19, koachPoints: 1410, badge: "Explorateur Littéraire", badgeLevel: "bronze", currentPage: 44, readingStreak: 3, isCurrentUser: false },
    { id: 18, username: "Mamadou Ba", country: "🇸🇳", booksRead: 12, koachPoints: 890, badge: "Apprenti Lecteur", badgeLevel: "beginner", currentPage: 23, readingStreak: 2, isCurrentUser: false },
    { id: 19, username: "Fatoumata Camara", country: "��", booksRead: 16, koachPoints: 1150, badge: "Apprenti Lecteur", badgeLevel: "beginner", currentPage: 31, readingStreak: 3, isCurrentUser: false },
    { id: 20, username: "Abdou Ndiaye", country: "🇸🇳", booksRead: 11, koachPoints: 820, badge: "Apprenti Lecteur", badgeLevel: "beginner", currentPage: 19, readingStreak: 1, isCurrentUser: false }
  ];

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const getBadgeColor = (level) => {
    switch(level) {
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#CD7F32';
      case 'beginner': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getBadgeIcon = (level) => {
    switch(level) {
      case 'gold': return 'crown';
      case 'silver': return 'medal';
      case 'bronze': return 'trophy-variant';
      case 'beginner': return 'book-open';
      default: return 'book';
    }
  };

  const getRankIcon = (index) => {
    switch(index) {
      case 0: return 'trophy';
      case 1: return 'medal';
      case 2: return 'trophy-variant';
      default: return null;
    }
  };

  const renderLeaderboardItem = ({ item, index }) => {
    const progressPercentage = (item.currentPage / currentBook.totalPages) * 100;
    const isTopThree = index < 3;

    return (
      <View style={[
        styles.leaderboardItem,
        item.isCurrentUser && styles.currentUserItem,
        isTopThree && styles.topThreeItem
      ]}>
        {/* Rang */}
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <View style={[styles.rankBadge, { backgroundColor: getBadgeColor(index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze') }]}>
              <Icon 
                name={getRankIcon(index)} 
                size={16} 
                color="#FFFFFF" 
              />
            </View>
          ) : (
            <Text style={styles.rankText}>{index + 1}</Text>
          )}
        </View>

        {/* Avatar + Drapeau */}
        <View style={styles.avatarSection}>
          <View style={[styles.userAvatar, { backgroundColor: getBadgeColor(item.badgeLevel) }]}>
            <Text style={styles.avatarText}>
              {item.username.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <Text style={styles.countryFlag}>{item.country}</Text>
        </View>

        {/* Infos principales */}
        <View style={styles.mainInfo}>
          {/* Ligne 1: Nom + Points */}
          <View style={styles.topRow}>
            <View style={styles.nameContainer}>
              <Text style={[styles.username, item.isCurrentUser && styles.currentUserText]} numberOfLines={1}>
                {item.username}
              </Text>
              {item.isCurrentUser && (
                <View style={styles.youBadge}>
                  <Text style={styles.youText}>Vous</Text>
                </View>
              )}
            </View>
            <View style={styles.pointsSection}>
              <Text style={styles.koachPoints}>{item.koachPoints.toLocaleString()}</Text>
              <Text style={styles.koachLabel}>KP</Text>
            </View>
          </View>
          
          {/* Ligne 2: Badge + Stats */}
          <View style={styles.bottomRow}>
            <View style={styles.badgeContainer}>
              <Icon 
                name={getBadgeIcon(item.badgeLevel)} 
                size={14} 
                color={getBadgeColor(item.badgeLevel)} 
              />
              <Text style={styles.badgeText} numberOfLines={1}>{item.badge}</Text>
            </View>
            <View style={styles.statsContainer}>
              <Text style={styles.statText}>{item.booksRead} livres</Text>
              <Text style={styles.statDivider}>•</Text>
              <Text style={styles.statText}>{item.readingStreak}j 🔥</Text>
            </View>
          </View>
          
          {/* Ligne 3: Progression */}
          <View style={styles.progressRow}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${progressPercentage}%`,
                    backgroundColor: getBadgeColor(item.badgeLevel)
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {item.currentPage}/{currentBook.totalPages}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header compact */}
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={22} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.title}>Classement</Text>
            <Text style={styles.subtitle}>{leaderboardData.length} lecteurs actifs</Text>
          </View>
        </View>

        {/* Book info compact */}
        <View style={styles.bookCard}>
          <Image 
            source={{ uri: currentBook.coverUrl }}
            style={styles.bookCover}
          />
          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle} numberOfLines={1}>{currentBook.title}</Text>
            <Text style={styles.bookAuthor}>par {currentBook.author}</Text>
            <Text style={styles.bookPages}>{currentBook.totalPages} pages • {currentBook.category}</Text>
          </View>
        </View>
      </View>

      {/* Liste du classement */}
      <FlatList
        data={leaderboardData}
        renderItem={renderLeaderboardItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.leaderboardList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Header compact
  headerSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  backButton: {
    padding: 6,
    marginRight: 10,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333333',
    marginBottom: 2,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#9317ED',
    fontWeight: '600',
    marginLeft: 4,
  },

  // Book card compact avec icônes
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#9317ED',
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  bookCover: {
    width: 42,
    height: 58,
    borderRadius: 4,
    marginRight: 10,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffffff',
    marginLeft: 4,
    flex: 1,
  },
  bookAuthor: {
    fontSize: 11,
    color: '#ffffffff',
    marginBottom: 4,
  },
  bookMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookPages: {
    fontSize: 10,
    color: '#ffffffff',
    marginLeft: 2,
  },
  bookDivider: {
    fontSize: 10,
    color: '#999999',
    marginHorizontal: 4,
  },
  bookCategory: {
    fontSize: 10,
    color: '#666666',
    marginLeft: 2,
    flex: 1,
  },

  // Leaderboard optimisé - pas de débordement
  leaderboardList: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 100,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 6,
    backgroundColor: '#ffffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  currentUserItem: {
    backgroundColor: 'rgba(147, 23, 237, 0.03)',
    borderColor: '#9317ED',
    borderWidth: 1.5,
  },
  topThreeItem: {
    backgroundColor: '#FAFBFC',
  },

  // Rang compact
  rankContainer: {
    width: 26,
    alignItems: 'center',
    marginRight: 8,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666666',
  },

  // Avatar section réduite
  avatarSection: {
    alignItems: 'center',
    marginRight: 8,
    width: 36,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  countryFlag: {
    fontSize: 12,
  },

  // Main info - contrôle strict du débordement
  mainInfo: {
    flex: 1,
    minWidth: 0, // Important pour éviter le débordement
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
    minWidth: 0, // Important
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
    marginRight: 4,
    flex: 1,
    minWidth: 0, // Important
  },
  currentUserText: {
    color: '#9317ED',
  },
  youBadge: {
    backgroundColor: '#9317ED',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  youText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  pointsSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    minWidth: 60,
  },
  koachPoints: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333333',
    marginRight: 1,
  },
  koachLabel: {
    fontSize: 10,
    color: '#9317ED',
    fontWeight: '700',
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
    minWidth: 0, // Important
  },
  badgeText: {
    fontSize: 11,
    color: '#666666',
    marginLeft: 3,
    fontWeight: '600',
    flex: 1,
    minWidth: 0, // Important
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  statText: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '500',
  },
  statDivider: {
    fontSize: 10,
    color: '#999999',
    marginHorizontal: 4,
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 3,
    backgroundColor: '#E8E8E8',
    borderRadius: 1.5,
    marginRight: 6,
  },
  progressBarFill: {
    height: 3,
    borderRadius: 1.5,
  },
  progressText: {
    fontSize: 9,
    color: '#666666',
    fontWeight: '600',
    width: 35,
    textAlign: 'right',
  },
});

export default LeaderboardScreen;
