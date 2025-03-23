import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator
} from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Chip, 
  Divider, 
  Button,
  Searchbar
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { AppDispatch } from '../store';
import { 
  fetchBadges, 
  fetchUserBadges, 
  selectBadges, 
  selectUserBadges, 
  selectIsLoading,
  Badge,
  UserBadge
} from '../slices/koachSlice';

type BadgesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Badges'>;

interface BadgesScreenProps {
  navigation: BadgesScreenNavigationProp;
}

const BadgesScreen: React.FC<BadgesScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const badges = useSelector(selectBadges);
  const userBadges = useSelector(selectUserBadges);
  const isLoading = useSelector(selectIsLoading);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'earned' | 'unearned'>('all');
  const [displayBadges, setDisplayBadges] = useState<Badge[]>([]);

  useEffect(() => {
    // Fetch badges when component mounts
    dispatch(fetchBadges());
    dispatch(fetchUserBadges());
  }, [dispatch]);

  useEffect(() => {
    if (badges && badges.length > 0) {
      applyFilters();
    }
  }, [badges, userBadges, filter, searchQuery]);

  const applyFilters = () => {
    if (!badges) return;

    let filtered = [...badges];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(badge => 
        badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        badge.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply earned/unearned filter
    if (filter === 'earned' && userBadges) {
      const earnedBadgeIds = userBadges.map(ub => ub.badgeId);
      filtered = filtered.filter(badge => earnedBadgeIds.includes(badge.id));
    } else if (filter === 'unearned' && userBadges) {
      const earnedBadgeIds = userBadges.map(ub => ub.badgeId);
      filtered = filtered.filter(badge => !earnedBadgeIds.includes(badge.id));
    }
    
    setDisplayBadges(filtered);
  };

  const isEarned = (badgeId: number) => {
    return userBadges && userBadges.some(ub => ub.badgeId === badgeId);
  };

  const getEarnedDate = (badgeId: number) => {
    if (!userBadges) return null;
    const userBadge = userBadges.find(ub => ub.badgeId === badgeId);
    if (userBadge) {
      return new Date(userBadge.dateEarned).toLocaleDateString();
    }
    return null;
  };

  const renderBadge = ({ item }: { item: Badge }) => {
    const earned = isEarned(item.id);
    const earnedDate = getEarnedDate(item.id);
    
    return (
      <Card style={[styles.badgeCard, earned ? styles.earnedBadge : styles.unearnedBadge]}>
        <Card.Content style={styles.badgeContent}>
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.badgeImage} 
            resizeMode="contain"
          />
          <View style={styles.badgeInfo}>
            <Title style={earned ? styles.earnedTitle : styles.unearnedTitle}>
              {item.name}
            </Title>
            <Paragraph style={styles.badgeDescription}>
              {item.description}
            </Paragraph>
            <Divider style={styles.divider} />
            <View style={styles.badgeDetails}>
              <Text style={styles.requirementLabel}>Requirement:</Text>
              <Text style={styles.requirement}>{item.requirement}</Text>
            </View>
            <View style={styles.badgeDetails}>
              <Text style={styles.pointsLabel}>Points:</Text>
              <Text style={styles.points}>{item.points}</Text>
            </View>
            {earned && earnedDate && (
              <Chip icon="calendar" style={styles.dateChip}>
                Earned on {earnedDate}
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>My Badges</Title>
        <Text style={styles.subtitle}>
          {userBadges?.length || 0} earned out of {badges?.length || 0} total badges
        </Text>
        
        <Searchbar
          placeholder="Search badges"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'earned' && styles.activeFilter]}
            onPress={() => setFilter('earned')}
          >
            <Text style={[styles.filterText, filter === 'earned' && styles.activeFilterText]}>
              Earned
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'unearned' && styles.activeFilter]}
            onPress={() => setFilter('unearned')}
          >
            <Text style={[styles.filterText, filter === 'unearned' && styles.activeFilterText]}>
              Unearned
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Loading badges...</Text>
        </View>
      ) : displayBadges.length > 0 ? (
        <FlatList
          data={displayBadges}
          renderItem={renderBadge}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.badgesList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {filter === 'earned' 
              ? "You haven't earned any badges yet. Keep reading to earn badges!"
              : filter === 'unearned'
                ? "No unearned badges found with your search criteria."
                : "No badges found with your search criteria."
            }
          </Text>
          {filter !== 'all' && (
            <Button 
              mode="outlined" 
              onPress={() => setFilter('all')}
              style={styles.resetButton}
            >
              Show All Badges
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
    padding: 16,
    paddingTop: 24,
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
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'white',
  },
  filterText: {
    color: 'white',
  },
  activeFilter: {
    backgroundColor: 'white',
  },
  activeFilterText: {
    color: '#6200ee',
    fontWeight: 'bold',
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
  badgesList: {
    padding: 16,
  },
  badgeCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
  },
  earnedBadge: {
    borderLeftWidth: 6,
    borderLeftColor: '#4CAF50',
  },
  unearnedBadge: {
    opacity: 0.7,
    borderLeftWidth: 6,
    borderLeftColor: '#9E9E9E',
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeImage: {
    width: 80,
    height: 80,
    marginRight: 16,
  },
  badgeInfo: {
    flex: 1,
  },
  earnedTitle: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  unearnedTitle: {
    fontWeight: 'bold',
    color: '#666',
  },
  badgeDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  badgeDetails: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  requirementLabel: {
    fontWeight: 'bold',
    width: 100,
    fontSize: 13,
  },
  requirement: {
    flex: 1,
    fontSize: 13,
  },
  pointsLabel: {
    fontWeight: 'bold',
    width: 100,
    fontSize: 13,
  },
  points: {
    flex: 1,
    fontSize: 13,
  },
  dateChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
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
});

export default BadgesScreen;