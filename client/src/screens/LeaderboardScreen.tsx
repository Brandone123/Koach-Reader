import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import { selectUser } from '../slices/authSlice';
import {
  fetchLeaderboard,
  fetchBookLeaderboard,
  selectLeaderboard,
  selectBookLeaderboard,
  selectLeaderboardLoading,
  selectBookLeaderboardLoading,
  type LeaderboardEntry,
  type BookLeaderboardEntry,
} from '../slices/koachSlice';
import { selectBooks } from '../slices/booksSlice';
import { fetchBooks } from '../slices/booksSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Chip, Menu } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

type LeaderboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Leaderboard'>;

interface LeaderboardScreenProps {
  navigation: LeaderboardScreenNavigationProp;
}

type TabType = 'general' | 'book';

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const currentUser = useSelector(selectUser);
  const leaderboard = useSelector(selectLeaderboard);
  const bookLeaderboard = useSelector(selectBookLeaderboard);
  const leaderboardLoading = useSelector(selectLeaderboardLoading);
  const bookLeaderboardLoading = useSelector(selectBookLeaderboardLoading);
  const books = useSelector(selectBooks);

  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [bookMenuVisible, setBookMenuVisible] = useState(false);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    dispatch(fetchLeaderboard() as any);
    dispatch(fetchBooks() as any);
  }, [navigation]);

  useEffect(() => {
    if (activeTab === 'book' && selectedBookId) {
      dispatch(fetchBookLeaderboard(selectedBookId) as any);
    }
  }, [activeTab, selectedBookId]);

  const selectedBook = books.find((b) => b.id === selectedBookId);
  const displayBookTitle = selectedBook?.title ?? t('leaderboard.selectBook', 'Sélectionner un livre');

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { color: '#FFD700', fontSize: 18 };
    if (rank === 2) return { color: '#C0C0C0', fontSize: 17 };
    if (rank === 3) return { color: '#CD7F32', fontSize: 16 };
    return {};
  };

  const renderGeneralItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isCurrentUser = String(item.userId) === String(currentUser?.id);
    return (
      <View style={[styles.card, isCurrentUser && styles.currentUserCard]}>
        <View style={[styles.rankBadge, item.rank <= 3 && styles.topRankBadge]}>
          <Text style={[styles.rankText, getRankStyle(item.rank)]}>{item.rank}</Text>
        </View>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.username} numberOfLines={1}>
            {item.username}
            {isCurrentUser && (
              <Text style={styles.youBadge}> {t('leaderboard.you', '(vous)')}</Text>
            )}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Icon name="star" size={14} color="#8A2BE2" />
              <Text style={styles.statText}>{item.points} pts</Text>
            </View>
            {(item.booksCompleted ?? 0) > 0 && (
              <View style={styles.statChip}>
                <Icon name="book-open-variant" size={14} color="#2196F3" />
                <Text style={styles.statText}>{item.booksCompleted}</Text>
              </View>
            )}
            {(item.badgesCount ?? 0) > 0 && (
              <View style={styles.statChip}>
                <Icon name="medal" size={14} color="#FF9800" />
                <Text style={styles.statText}>{item.badgesCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderBookItem = ({ item }: { item: BookLeaderboardEntry }) => {
    const isCurrentUser = String(item.userId) === String(currentUser?.id);
    const progressPct = selectedBook?.total_pages
      ? Math.round((item.currentPage / selectedBook.total_pages) * 100)
      : 0;
    return (
      <View style={[styles.card, isCurrentUser && styles.currentUserCard]}>
        <View style={[styles.rankBadge, item.rank <= 3 && styles.topRankBadge]}>
          <Text style={[styles.rankText, getRankStyle(item.rank)]}>{item.rank}</Text>
        </View>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.username} numberOfLines={1}>
            {item.username}
            {isCurrentUser && (
              <Text style={styles.youBadge}> {t('leaderboard.you', '(vous)')}</Text>
            )}
          </Text>
          <View style={styles.progressRow}>
            {item.isCompleted ? (
              <Chip icon="check-circle" compact style={styles.completedChip}>
                {t('leaderboard.completed', 'Terminé')}
              </Chip>
            ) : (
              <>
                <Text style={styles.pageText}>
                  {item.currentPage} / {selectedBook?.total_pages ?? '?'} {t('leaderboard.pages', 'pages')}
                </Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(progressPct, 100)}%` }]} />
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  const showLoading = activeTab === 'general' ? leaderboardLoading : bookLeaderboardLoading;
  const emptyMessage =
    activeTab === 'general'
      ? t('leaderboard.noData', 'Aucun classement pour le moment.')
      : t('leaderboard.noReaders', 'Aucun lecteur pour ce livre.');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('leaderboard.title', 'Classement')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'general' && styles.tabActive]}
          onPress={() => setActiveTab('general')}
        >
          <Icon name="trophy" size={20} color={activeTab === 'general' ? '#fff' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'general' && styles.tabTextActive]}>
            {t('leaderboard.general', 'Général')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'book' && styles.tabActive]}
          onPress={() => setActiveTab('book')}
        >
          <Icon name="book" size={20} color={activeTab === 'book' ? '#fff' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'book' && styles.tabTextActive]}>
            {t('leaderboard.byBook', 'Par livre')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'book' && (
        <View style={styles.bookSelector}>
          <Menu
            visible={bookMenuVisible}
            onDismiss={() => setBookMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.bookSelectorBtn}
                onPress={() => setBookMenuVisible(true)}
              >
                <Icon name="book-open-page-variant" size={20} color="#8A2BE2" />
                <Text style={styles.bookSelectorText} numberOfLines={1}>
                  {displayBookTitle}
                </Text>
                <Icon name="menu-down" size={20} color="#666" />
              </TouchableOpacity>
            }
          >
            <ScrollView style={{ maxHeight: 300 }}>
              {books.length === 0 ? (
                <Text style={styles.menuEmpty}>{t('leaderboard.noBooks', 'Aucun livre disponible')}</Text>
              ) : (
                books.map((b) => (
                  <Menu.Item
                    key={b.id}
                    onPress={() => {
                      setSelectedBookId(b.id);
                      setBookMenuVisible(false);
                    }}
                    title={b.title}
                    titleStyle={selectedBookId === b.id ? styles.menuItemSelected : undefined}
                  />
                ))
              )}
            </ScrollView>
          </Menu>
        </View>
      )}

      {showLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#8A2BE2" />
        </View>
      ) : activeTab === 'book' && !selectedBookId ? (
        <View style={styles.empty}>
          <Icon name="book-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>{t('leaderboard.selectBookHint', 'Sélectionnez un livre pour voir le classement')}</Text>
        </View>
      ) : (activeTab === 'general' && leaderboard.length === 0) ||
        (activeTab === 'book' && bookLeaderboard.length === 0) ? (
        <View style={styles.empty}>
          <Icon name="trophy-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : activeTab === 'general' ? (
        <FlatList<LeaderboardEntry>
          data={leaderboard}
          renderItem={renderGeneralItem}
          keyExtractor={(item) => String(item.userId)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList<BookLeaderboardEntry>
          data={bookLeaderboard}
          renderItem={renderBookItem}
          keyExtractor={(item) => String(item.userId)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  tabs: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  tabActive: {
    backgroundColor: '#8A2BE2',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  bookSelector: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  bookSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bookSelectorText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  menuEmpty: {
    padding: 16,
    color: '#999',
  },
  menuItemSelected: {
    fontWeight: '700',
    color: '#8A2BE2',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: '#8A2BE2',
    backgroundColor: '#faf5ff',
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topRankBadge: {
    backgroundColor: '#fff5e6',
  },
  rankText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#8A2BE2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  cardContent: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  youBadge: {
    fontSize: 13,
    color: '#8A2BE2',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#666',
  },
  progressRow: {
    marginTop: 6,
  },
  pageText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e8e8e8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8A2BE2',
  },
  completedChip: {
    alignSelf: 'flex-start',
  },
});

export default LeaderboardScreen;
