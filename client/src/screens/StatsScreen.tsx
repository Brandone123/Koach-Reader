import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Divider,
  Avatar
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import { selectUser } from '../slices/authSlice';
import { fetchApi } from '../utils/api';
import { mockFetchApi } from '../utils/mockApi';
import { useTranslation } from 'react-i18next';

// Height and width for responsive designs
const { width } = Dimensions.get('window');

type StatsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Stats'>;

interface StatsScreenProps {
  navigation: StatsScreenNavigationProp;
}

// Reading stats interface
interface ReadingStats {
  daysActive: number;
  totalReadingTime: number;
  totalPagesRead: number;
  booksStarted: number;
  booksCompleted: number;
  averagePagesPerDay: number;
  averageTimePerDay: number;
  currentStreak: number;
  longestStreak: number;
  preferredReadingTime: string;
  mostReadCategory: string;
  readingByDay: Array<{ day: string; pagesRead: number }>;
  readingByTime: Array<{ time: string; percentage: number }>;
}

const StatsScreen: React.FC<StatsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const { t } = useTranslation();
  
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  
  useEffect(() => {
    fetchReadingStats();
  }, [timeRange]);
  
  const fetchReadingStats = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from real API first
      const data = await fetchApi(`/api/stats?range=${timeRange}`);
      setStats(data);
    } catch (error) {
      try {
        // Fall back to mock API
        const mockData = await mockFetchApi(`/api/stats?range=${timeRange}`);
        setStats(mockData);
      } catch (mockError) {
        console.error('Failed to fetch reading stats:', mockError);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate the max value for the bar chart
  const maxPagesRead = stats?.readingByDay ? 
    Math.max(...stats.readingByDay.map(item => item.pagesRead)) : 0;
  
  // Helper function to format time in hours and minutes
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} min`;
    } else if (mins === 0) {
      return `${hours} hr`;
    } else {
      return `${hours} hr ${mins} min`;
    }
  };
  
  // Render a simple bar chart for reading by day
  const renderReadingByDayChart = () => {
    if (!stats?.readingByDay) return null;
    
    return (
      <View style={styles.chartContainer}>
        {stats.readingByDay.map((item, index) => (
          <View key={index} style={styles.barChartRow}>
            <Text style={styles.barChartLabel}>{item.day}</Text>
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    width: `${(item.pagesRead / maxPagesRead) * 100}%`,
                    backgroundColor: index % 2 === 0 ? '#6200ee' : '#03dac6'
                  }
                ]} 
              />
              <Text style={styles.barValue}>{item.pagesRead} pages</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };
  
  // Render a simple pie chart for reading by time
  const renderReadingByTimeChart = () => {
    if (!stats?.readingByTime) return null;
    
    const colors = ['#6200ee', '#03dac6', '#ff6c00', '#b38dff'];
    
    return (
      <View style={styles.timeDistributionContainer}>
        <View style={styles.pieChartContainer}>
          <View style={styles.pieChart}>
            {stats.readingByTime.map((item, index) => {
              // Calculate the start and end angles for this slice
              const startPercent = stats.readingByTime
                .slice(0, index)
                .reduce((sum, curr) => sum + curr.percentage, 0);
              
              const startAngle = (startPercent / 100) * 360;
              const angle = (item.percentage / 100) * 360;
              
              return (
                <View 
                  key={index}
                  style={[
                    styles.pieSlice,
                    {
                      backgroundColor: colors[index % colors.length],
                      transform: [
                        { rotate: `${startAngle}deg` },
                        { translateX: -50 },
                        { translateY: -50 },
                      ],
                      width: angle <= 180 ? '100%' : '50%',
                      height: '100%',
                    }
                  ]}
                />
              );
            })}
          </View>
        </View>
        
        <View style={styles.timeDistributionLegend}>
          {stats.readingByTime.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View 
                style={[
                  styles.legendColor, 
                  { backgroundColor: colors[index % colors.length] }
                ]} 
              />
              <Text style={styles.legendText}>
                {item.time} ({item.percentage}%)
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>{t('stats.loading')}</Text>
      </View>
    );
  }
  
  if (!stats) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {t('stats.noStats')}
        </Text>
        <Button 
          mode="contained"
          onPress={() => navigation.navigate('Home')}
          style={styles.emptyButton}
        >
          {t('stats.goToBooks')}
        </Button>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>{t('stats.title')}</Title>
        <Text style={styles.subtitle}>{t('stats.tracking')}</Text>
        
        <View style={styles.timeRangeContainer}>
          <Chip 
            selected={timeRange === 'week'} 
            onPress={() => setTimeRange('week')}
            style={styles.timeRangeChip}
            selectedColor="#fff"
          >
            {t('stats.week')}
          </Chip>
          <Chip 
            selected={timeRange === 'month'} 
            onPress={() => setTimeRange('month')}
            style={styles.timeRangeChip}
            selectedColor="#fff"
          >
            {t('stats.month')}
          </Chip>
          <Chip 
            selected={timeRange === 'year'} 
            onPress={() => setTimeRange('year')}
            style={styles.timeRangeChip}
            selectedColor="#fff"
          >
            {t('stats.year')}
          </Chip>
        </View>
      </View>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>{t('stats.summary')}</Title>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.daysActive}</Text>
              <Text style={styles.statLabel}>{t('stats.daysActive')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalPagesRead}</Text>
              <Text style={styles.statLabel}>{t('stats.pagesRead')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(stats.totalReadingTime)}</Text>
              <Text style={styles.statLabel}>{t('stats.timeSpent')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.booksCompleted}</Text>
              <Text style={styles.statLabel}>{t('stats.booksCompleted')}</Text>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.streakContainer}>
            <View style={styles.streakItem}>
              <Avatar.Icon size={40} icon="fire" style={styles.streakIcon} />
              <View style={styles.streakTextContainer}>
                <Text style={styles.streakValue}>{stats.currentStreak} {t('stats.days')}</Text>
                <Text style={styles.streakLabel}>{t('stats.currentStreak')}</Text>
              </View>
            </View>
            <View style={styles.streakItem}>
              <Avatar.Icon size={40} icon="trophy" style={styles.streakIcon} />
              <View style={styles.streakTextContainer}>
                <Text style={styles.streakValue}>{stats.longestStreak} {t('stats.days')}</Text>
                <Text style={styles.streakLabel}>{t('stats.longestStreak')}</Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Reading Patterns</Title>
          
          <View style={styles.patternContainer}>
            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>Preferred Time:</Text>
              <Text style={styles.patternValue}>{stats.preferredReadingTime}</Text>
            </View>
            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>Favorite Category:</Text>
              <Text style={styles.patternValue}>{stats.mostReadCategory}</Text>
            </View>
            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>Avg. Pages/Day:</Text>
              <Text style={styles.patternValue}>
                {stats.averagePagesPerDay ? stats.averagePagesPerDay.toFixed(1) : '0'}
              </Text>
            </View>
            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>Avg. Time/Day:</Text>
              <Text style={styles.patternValue}>{formatTime(stats.averageTimePerDay)}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Reading by Day</Title>
          {renderReadingByDayChart()}
        </Card.Content>
      </Card>
      
      <Card style={[styles.card, styles.lastCard]}>
        <Card.Content>
          <Title style={styles.cardTitle}>Time Distribution</Title>
          {renderReadingByTimeChart()}
        </Card.Content>
      </Card>
    </ScrollView>
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
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  timeRangeChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
  },
  lastCard: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  streakIcon: {
    backgroundColor: '#6200ee',
  },
  streakTextContainer: {
    marginLeft: 12,
  },
  streakValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: 14,
    color: '#666',
  },
  patternContainer: {
    marginTop: 8,
  },
  patternItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  patternLabel: {
    fontSize: 16,
    color: '#333',
  },
  patternValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  chartContainer: {
    marginTop: 8,
  },
  barChartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barChartLabel: {
    width: 60,
    fontSize: 14,
  },
  barContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  barValue: {
    position: 'absolute',
    left: 8,
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  timeDistributionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  pieChartContainer: {
    width: width * 0.35,
    height: width * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieChart: {
    width: '80%',
    height: '80%',
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  pieSlice: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    height: '100%',
    transform: [{ translateX: 0 }, { translateY: 0 }],
  },
  timeDistributionLegend: {
    flex: 1,
    marginLeft: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
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
    marginBottom: 24,
  },
  emptyButton: {
    marginTop: 16,
  },
});

export default StatsScreen;