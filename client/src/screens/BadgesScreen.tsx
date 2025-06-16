import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  // ActivityIndicator, // Will use LoadingAnimation
  Dimensions // For grid layout
} from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Chip, 
  Divider, 
  Button,
  Searchbar,
  useTheme // Import useTheme
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; // For placeholder
import LoadingAnimation from '../components/LoadingAnimation'; // Import LoadingAnimation
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
  Badge, // Make sure Badge type includes all necessary fields like iconUrl or similar
  UserBadge
} from '../slices/koachSlice'; // Assuming koachSlice exports Badge and UserBadge types

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 2; // Or 3, depending on desired card size
const ITEM_MARGIN = 8;
const ITEM_WIDTH = (width - (ITEM_MARGIN * (NUM_COLUMNS + 1))) / NUM_COLUMNS;


type BadgesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Badges'>;

interface BadgesScreenProps {
  navigation: BadgesScreenNavigationProp;
}

const BadgesScreen: React.FC<BadgesScreenProps> = ({ navigation }) => {
  const theme = useTheme(); // Get theme
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
      <Card
        style={[
          styles.badgeCard,
          { backgroundColor: earned ? theme.colors.elevation.level3 : theme.colors.surfaceDisabled },
          earned && styles.earnedBadgeHighlight // Extra style for earned
        ]}
        elevation={earned ? 4 : 1}
      >
        <Card.Content style={styles.badgeContent}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.badgeImage}
              resizeMode="contain"
            />
          ) : (
            <MaterialCommunityIcons
              name="trophy-variant-outline"
              size={ITEM_WIDTH * 0.5}
              color={earned ? theme.colors.primary : theme.colors.onSurfaceDisabled}
              style={styles.badgeImagePlaceholder}
            />
          )}
          <Title style={[styles.badgeTitle, { color: earned ? theme.colors.primary : theme.colors.onSurface }]}>
            {item.name}
          </Title>
          <Paragraph style={[styles.badgeDescription, { color: theme.colors.onSurfaceVariant }]}>
            {item.description}
          </Paragraph>
          {/* <Divider style={[styles.divider, {backgroundColor: theme.colors.outline}]} /> */}
          {/* Details like requirement and points can be added if space allows or on a detail screen */}
          {/* <Text style={[styles.badgeDetailText, {color: theme.colors.onSurfaceVariant}]}>Requirement: {item.requirement}</Text> */}
          {/* <Text style={[styles.badgeDetailText, {color: theme.colors.onSurfaceVariant}]}>Points: {item.points}</Text> */}
          {earned && earnedDate && (
            <Chip
              icon="check-decagram"
              style={[styles.dateChip, {backgroundColor: theme.colors.primaryContainer}]}
              textStyle={{color: theme.colors.onPrimaryContainer, fontSize: 10}}
            >
              Earned: {earnedDate}
            </Chip>
          )}
          {!earned && (
             <Chip
              icon="lock-outline"
              style={[styles.dateChip, {backgroundColor: theme.colors.surfaceVariant}]}
              textStyle={{color: theme.colors.onSurfaceVariant, fontSize: 10}}
            >
              Locked
            </Chip>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primaryContainer }]}>
        <Title style={[styles.title, { color: theme.colors.onPrimaryContainer }]}>My Badges</Title>
        <Text style={[styles.subtitle, { color: theme.colors.onPrimaryContainer }]}>
          {userBadges?.length || 0} earned out of {badges?.length || 0} total
        </Text>
        
        <Searchbar
          placeholder="Search badges"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, {backgroundColor: theme.colors.surface, elevation: 1}]}
          inputStyle={{color: theme.colors.onSurface}}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          iconColor={theme.colors.primary}
        />
        
        <View style={styles.filterContainer}>
          {(['all', 'earned', 'unearned'] as const).map(filterType => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterButton,
                { borderColor: theme.colors.primary },
                filter === filterType && { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => setFilter(filterType)}
            >
              <Text style={[
                styles.filterText,
                { color: filter === filterType ? theme.colors.onPrimary : theme.colors.primary }
              ]}>
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {isLoading && !badges?.length ? ( // Show full screen loader only if no badges are loaded yet
        <LoadingAnimation />
      ) : displayBadges.length > 0 ? (
        <FlatList
          data={displayBadges}
          renderItem={renderBadge}
          keyExtractor={item => item.id.toString()}
          numColumns={NUM_COLUMNS} // For grid layout
          contentContainerStyle={styles.badgesList}
          style={styles.listStyle} // Added for potential list-specific styling
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
    // backgroundColor: theme.colors.background, // Applied in component
  },
  header: {
    // backgroundColor: theme.colors.primaryContainer, // Applied in component
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 40 : 24, // SafeArea for iOS
  },
  title: {
    // color: theme.colors.onPrimaryContainer, // Applied in component
    fontSize: 26, // Larger title
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    // color: theme.colors.onPrimaryContainer, // Applied in component
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  searchBar: {
    marginBottom: 16,
    // backgroundColor: theme.colors.surface, // Applied in component
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly', // Use space-evenly for better distribution
    marginBottom: 8, // Add some margin below filters
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12, // Adjust padding
    borderRadius: 20,
    borderWidth: 1.5, // Slightly thicker border
    // borderColor: theme.colors.primary, // Applied in component
  },
  filterText: {
    // color: theme.colors.primary, // Applied in component
    fontWeight: '600', // Semibold for filter text
    fontSize: 13,
  },
  // activeFilter style is now inline based on theme.colors.primary and onPrimary
  // activeFilterText style is now inline based on theme.colors.onPrimary

  loadingContainer: { // Kept for potential specific loading scenarios if needed
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgesList: {
    paddingHorizontal: ITEM_MARGIN / 2, // Half margin for sides of the list
    paddingVertical: ITEM_MARGIN,
  },
  listStyle: {
    flex: 1, // Ensure FlatList takes available space
  },
  badgeCard: {
    width: ITEM_WIDTH,
    marginHorizontal: ITEM_MARGIN / 2, // Half margin for items
    marginBottom: ITEM_MARGIN * 1.5, // Increased bottom margin for cards
    borderRadius: 12,
    // backgroundColor, elevation handled inline
  },
  earnedBadgeHighlight: { // Specific highlight for earned badges
     borderColor: theme.colors.primary, // Use theme from hook
     borderWidth: 2,
  },
  badgeContent: { // Changed to column layout
    padding: 12,
    alignItems: 'center', // Center content
  },
  badgeImage: {
    width: ITEM_WIDTH * 0.6, // Responsive image size
    height: ITEM_WIDTH * 0.6,
    marginBottom: 12, // Space below image
  },
  badgeImagePlaceholder: {
    marginBottom: 12,
    opacity: 0.5,
  },
  badgeTitle: { // Centered title
    fontSize: 15, // Adjusted size
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    minHeight: 30, // Ensure consistent height for 1 or 2 lines
  },
  badgeDescription: {
    fontSize: 12, // Smaller description
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 40, // Ensure consistent height
  },
  badgeDetailText: { // For requirement/points if added back
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 2,
  },
  dateChip: { // Common styling for chips
    marginTop: 10,
    paddingHorizontal: 4, // Smaller padding for chip
    height: 28, // Smaller chip height
    alignItems: 'center',
    justifyContent: 'center',
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