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
import { fetchLeaderboard, selectLeaderboard, selectIsLoading } from '../slices/koachSlice';

type LeaderboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Leaderboard'>;

interface LeaderboardScreenProps {
  navigation: LeaderboardScreenNavigationProp;
}

const AVATAR_COLORS = [
  '#6200ee', // Primary
  '#03dac6', // Secondary
  '#ff6c00', // Orange
  '#b38dff', // Light purple
  '#00bfa5', // Teal
  '#ff5722', // Deep orange
  '#8e24aa', // Purple
  '#ff4081', // Pink
  '#4caf50', // Green
  '#2196f3', // Blue
];

type LeaderboardPeriod = 'all-time' | 'monthly' | 'weekly';

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const leaderboard = useSelector(selectLeaderboard);
  const isLoading = useSelector(selectIsLoading);
  const currentUser = useSelector(selectUser);
  
  const [period, setPeriod] = useState<LeaderboardPeriod>('all-time');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLeaderboard, setFilteredLeaderboard] = useState(leaderboard);
  const [showFriendsOnly, setShowFriendsOnly] = useState(false);
  const [sortOption, setSortOption] = useState<'points' | 'streak' | 'books'>('points');
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  useEffect(() => {
    dispatch(fetchLeaderboard());
  }, [dispatch]);

  useEffect(() => {
    if (leaderboard && leaderboard.length > 0) {
      let filtered = [...leaderboard];
      
      // Apply filters based on period (in a real app, we'd make separate API calls)
      // Here we're just simulating for demonstration purposes
      
      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter(item => 
          item.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply friends-only filter (mock implementation)
      // In a real app, you'd have a list of friends to filter against
      if (showFriendsOnly) {
        // For demo, just show top 5 as "friends"
        filtered = filtered.filter(item => item.rank <= 5);
      }

      // Apply sorting based on selected option
      if (sortOption === 'points') {
        filtered = filtered.sort((a, b) => b.points - a.points);
      } else if (sortOption === 'streak') {
        // Simulate streak sorting - in a real app, you'd have actual streak data
        filtered = filtered.sort((a, b) => (b.points % 7) - (a.points % 7));
      } else if (sortOption === 'books') {
        // Simulate books completed sorting
        filtered = filtered.sort((a, b) => (b.points / 100) - (a.points / 100));
      }
      
      setFilteredLeaderboard(filtered);
    }
  }, [leaderboard, searchQuery, showFriendsOnly, period, sortOption]);

  const getUserRank = () => {
    if (!currentUser || !leaderboard) return null;
    
    const userRank = leaderboard.find(item => item.userId === currentUser.id);
    return userRank;
  };

  const renderLeaderboardItem = ({ item, index }) => {
    const isCurrentUser = currentUser && item.userId === currentUser.id;
    const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
    const initials = item.username.substring(0, 2).toUpperCase();

    return (
      <Card 
        style={[
          styles.leaderboardCard, 
          isCurrentUser && styles.currentUserCard, 
          index < 3 && styles.topThreeCard
        ]}
      >
        <Card.Content style={styles.leaderboardItemContent}>
          <View style={styles.rankContainer}>
            {index < 3 ? (
              <Avatar.Icon 
                size={40} 
                icon={index === 0 ? 'crown' : 'star'} 
                style={[
                  styles.rankIcon, 
                  { backgroundColor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32' }
                ]} 
              />
            ) : (
              <Avatar.Text 
                size={40} 
                label={item.rank.toString()} 
                style={[styles.rankText, { backgroundColor: '#6200ee' }]} 
              />
            )}
          </View>
          
          <Avatar.Text 
            size={50} 
            label={initials} 
            style={[styles.userAvatar, { backgroundColor: avatarColor }]} 
          />
          
          <View style={styles.userInfoContainer}>
            <Text style={[styles.username, isCurrentUser && styles.currentUserText]}>
              {item.username}
              {isCurrentUser && ' (You)'}
            </Text>
            <View style={styles.pointsContainer}>
              <Text style={styles.pointsValue}>{item.points}</Text>
              <Text style={styles.pointsLabel}>Koach Points</Text>
            </View>
          </View>
          
          <View style={styles.actionsContainer}>
            {!isCurrentUser && (
              <Button 
                mode="outlined" 
                icon="account-plus" 
                style={styles.addFriendButton}
                compact
              >
                Add
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Leaderboard</Title>
        <Text style={styles.subtitle}>See who's leading the pack!</Text>
        
        <Searchbar
          placeholder="Search users"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <View style={styles.filtersContainer}>
          <View style={styles.periodSelectionContainer}>
            <TouchableOpacity
              style={[styles.periodButton, period === 'all-time' && styles.activePeriod]}
              onPress={() => setPeriod('all-time')}
            >
              <Text style={[styles.periodText, period === 'all-time' && styles.activePeriodText]}>
                All-time
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.periodButton, period === 'monthly' && styles.activePeriod]}
              onPress={() => setPeriod('monthly')}
            >
              <Text style={[styles.periodText, period === 'monthly' && styles.activePeriodText]}>
                Monthly
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.periodButton, period === 'weekly' && styles.activePeriod]}
              onPress={() => setPeriod('weekly')}
            >
              <Text style={[styles.periodText, period === 'weekly' && styles.activePeriodText]}>
                Weekly
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterActionsRow}>
            <Chip
              selected={showFriendsOnly}
              onPress={() => setShowFriendsOnly(!showFriendsOnly)}
              style={styles.friendsFilterChip}
              icon="account-group"
            >
              Friends Only
            </Chip>
            
            <IconButton
              icon="tune-vertical"
              color="white"
              size={24}
              onPress={() => setShowFiltersModal(true)}
              style={styles.filterButton}
            />
          </View>
        </View>
      </View>
      
      <Portal>
        <Modal
          visible={showFiltersModal}
          onDismiss={() => setShowFiltersModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Title style={styles.modalTitle}>Advanced Filters</Title>
              <IconButton 
                icon="close" 
                size={24} 
                onPress={() => setShowFiltersModal(false)} 
              />
            </View>
            
            <Divider style={styles.modalDivider} />
            
            <View style={styles.sortOptionSection}>
              <Text style={styles.modalSectionTitle}>Sort By</Text>
              <RadioButton.Group 
                onValueChange={value => setSortOption(value as 'points' | 'streak' | 'books')} 
                value={sortOption}
              >
                <RadioButton.Item 
                  label="Points (Default)" 
                  value="points" 
                  style={styles.radioItem}
                />
                <RadioButton.Item 
                  label="Reading Streak" 
                  value="streak" 
                  style={styles.radioItem}
                />
                <RadioButton.Item 
                  label="Books Completed" 
                  value="books" 
                  style={styles.radioItem}
                />
              </RadioButton.Group>
            </View>
            
            <Divider style={styles.modalDivider} />
            
            <View style={styles.modalActions}>
              <Button 
                mode="outlined" 
                onPress={() => {
                  setSortOption('points');
                  setShowFriendsOnly(false);
                  setSearchQuery('');
                  setShowFiltersModal(false);
                }}
                style={styles.modalButton}
              >
                Reset All Filters
              </Button>
              
              <Button 
                mode="contained" 
                onPress={() => setShowFiltersModal(false)}
                style={styles.modalButton}
              >
                Apply
              </Button>
            </View>
          </Surface>
        </Modal>
      </Portal>
      
      {getUserRank() && (
        <Card style={styles.yourRankCard}>
          <Card.Content>
            <Title style={styles.yourRankTitle}>Your Position</Title>
            <View style={styles.yourRankContent}>
              <Avatar.Text 
                size={60} 
                label={getUserRank().rank.toString()} 
                style={styles.yourRankAvatar} 
              />
              <View style={styles.yourRankInfoContainer}>
                <Text style={styles.rankInfoLabel}>Rank</Text>
                <Text style={styles.rankInfoValue}>#{getUserRank().rank}</Text>
              </View>
              <View style={styles.yourRankInfoContainer}>
                <Text style={styles.rankInfoLabel}>Points</Text>
                <Text style={styles.rankInfoValue}>{getUserRank().points}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : filteredLeaderboard.length > 0 ? (
        <FlatList
          data={filteredLeaderboard}
          renderItem={renderLeaderboardItem}
          keyExtractor={item => item.userId.toString()}
          contentContainerStyle={styles.leaderboardList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery 
              ? "No users matching your search." 
              : showFriendsOnly 
                ? "No friends found. Add some friends to see them here!"
                : "No leaderboard data available."
            }
          </Text>
          {(searchQuery || showFriendsOnly) && (
            <Button 
              mode="outlined" 
              onPress={() => {
                setSearchQuery('');
                setShowFriendsOnly(false);
              }}
              style={styles.resetButton}
            >
              Reset Filters
            </Button>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6200ee',
    padding: 24,
    paddingTop: 36,
    paddingBottom: 24,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 16,
    elevation: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  filtersContainer: {
    marginTop: 8,
  },
  periodSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'white',
  },
  periodText: {
    color: 'white',
  },
  activePeriod: {
    backgroundColor: 'white',
  },
  activePeriodText: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
  friendsFilterChip: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  leaderboardList: {
    padding: 16,
    paddingTop: 8,
  },
  yourRankCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 3,
  },
  yourRankTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  yourRankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  yourRankAvatar: {
    backgroundColor: '#6200ee',
  },
  yourRankInfoContainer: {
    alignItems: 'center',
  },
  rankInfoLabel: {
    fontSize: 14,
    color: '#666',
  },
  rankInfoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  leaderboardCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  leaderboardItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topThreeCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#ffd700',
  },
  currentUserCard: {
    backgroundColor: '#f0f0ff',
    borderLeftWidth: 3,
    borderLeftColor: '#6200ee',
  },
  rankContainer: {
    marginRight: 12,
  },
  rankIcon: {
    marginRight: 8,
  },
  rankText: {
    marginRight: 8,
  },
  userAvatar: {
    marginRight: 16,
  },
  userInfoContainer: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  currentUserText: {
    color: '#6200ee',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
    marginRight: 4,
  },
  pointsLabel: {
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
    marginLeft: 8,
  },
  addFriendButton: {
    borderColor: '#6200ee',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetButton: {
    marginTop: 8,
  },
  // Nouveaux styles pour les filtres et la modal
  filterActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    margin: 0,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 24,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
  },
  modalDivider: {
    marginVertical: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sortOptionSection: {
    marginBottom: 16,
  },
  radioItem: {
    paddingVertical: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    marginLeft: 12,
  },
});

export default LeaderboardScreen;