import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  Chip,
  ProgressBar,
  FAB,
  Modal,
  Portal,
  TextInput,
  Divider,
  RadioButton,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import { selectUser } from '../slices/authSlice';
import { fetchApi } from '../utils/api';
import { mockFetchApi } from '../utils/mockApi';

type ChallengesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Challenges'>;

interface ChallengesScreenProps {
  navigation: ChallengesScreenNavigationProp;
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  creatorId: number;
  startDate: string;
  endDate: string;
  goal: number;
  goalType: 'pages' | 'books' | 'minutes';
  bookId?: number;
  categoryId?: number;
  isPrivate: boolean;
  participantCount: number;
  myProgress?: number;
  status?: 'active' | 'completed' | 'abandoned';
  createdAt: string;
  updatedAt: string;
}

const ChallengesScreen: React.FC<ChallengesScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [myChallenges, setMyChallenges] = useState<Challenge[]>([]);
  const [publicChallenges, setPublicChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');
  const [modalVisible, setModalVisible] = useState(false);
  
  // New challenge form
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeDescription, setChallengeDescription] = useState('');
  const [goalType, setGoalType] = useState<'pages' | 'books' | 'minutes'>('pages');
  const [goalValue, setGoalValue] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  
  useEffect(() => {
    fetchChallenges();
  }, []);
  
  const fetchChallenges = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from real API first
      const data = await fetchApi('/api/challenges');
      handleChallengesData(data);
    } catch (error) {
      try {
        // Fall back to mock API
        const mockData = await mockFetchApi('/api/challenges');
        handleChallengesData(mockData);
      } catch (mockError) {
        console.error('Failed to fetch challenges:', mockError);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChallengesData = (data: Challenge[]) => {
    setChallenges(data);
    // Filter for user's challenges
    const userChallenges = data.filter(challenge => 
      challenge.creatorId === user?.id || challenge.status === 'active'
    );
    setMyChallenges(userChallenges);
    
    // Filter for public challenges user is not part of
    const otherChallenges = data.filter(challenge => 
      !challenge.isPrivate && 
      challenge.creatorId !== user?.id && 
      challenge.status !== 'active'
    );
    setPublicChallenges(otherChallenges);
  };
  
  const createChallenge = async () => {
    if (!challengeTitle.trim()) {
      Alert.alert('Error', 'Please enter a challenge title');
      return;
    }
    
    if (!goalValue || isNaN(Number(goalValue)) || Number(goalValue) <= 0) {
      Alert.alert('Error', 'Please enter a valid goal value');
      return;
    }
    
    const endDateObj = new Date(endDate);
    const now = new Date();
    if (endDate && endDateObj <= now) {
      Alert.alert('Error', 'End date must be in the future');
      return;
    }
    
    const newChallenge = {
      title: challengeTitle,
      description: challengeDescription,
      creatorId: user?.id || 0,
      startDate: new Date().toISOString(),
      endDate: endDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
      goal: Number(goalValue),
      goalType,
      isPrivate,
    };
    
    setIsLoading(true);
    try {
      // Try to use real API first
      const response = await fetchApi('/api/challenges', {
        method: 'POST',
        body: newChallenge
      });
      
      // Update challenge lists
      fetchChallenges();
      
      // Reset form and close modal
      resetForm();
      setModalVisible(false);
      
      Alert.alert('Success', 'Challenge created successfully!');
    } catch (error) {
      try {
        // Fall back to mock API
        const mockResponse = await mockFetchApi('/api/challenges', {
          method: 'POST',
          body: newChallenge
        });
        
        // Update challenge lists
        const updatedChallenges = [...challenges, mockResponse];
        handleChallengesData(updatedChallenges);
        
        // Reset form and close modal
        resetForm();
        setModalVisible(false);
        
        Alert.alert('Success', 'Challenge created successfully!');
      } catch (mockError) {
        console.error('Failed to create challenge:', mockError);
        Alert.alert('Error', 'Failed to create challenge');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const joinChallenge = async (challengeId: number) => {
    setIsLoading(true);
    try {
      // Try to use real API first
      await fetchApi(`/api/challenges/${challengeId}/join`, {
        method: 'POST'
      });
      
      // Refetch challenges to update the lists
      fetchChallenges();
      
      Alert.alert('Success', 'You have joined the challenge!');
    } catch (error) {
      try {
        // Fall back to mock API
        await mockFetchApi(`/api/challenges/${challengeId}/join`, {
          method: 'POST'
        });
        
        // Update the challenge in our lists
        const updatedChallenges = challenges.map(challenge => 
          challenge.id === challengeId 
            ? { ...challenge, status: 'active', myProgress: 0 } 
            : challenge
        );
        handleChallengesData(updatedChallenges);
        
        Alert.alert('Success', 'You have joined the challenge!');
      } catch (mockError) {
        console.error('Failed to join challenge:', mockError);
        Alert.alert('Error', 'Failed to join challenge');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setChallengeTitle('');
    setChallengeDescription('');
    setGoalType('pages');
    setGoalValue('');
    setEndDate('');
    setIsPrivate(false);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const calculateProgress = (challenge: Challenge) => {
    return challenge.myProgress ? (challenge.myProgress / challenge.goal) * 100 : 0;
  };
  
  const getGoalTypeLabel = (type: 'pages' | 'books' | 'minutes') => {
    switch (type) {
      case 'pages': return 'pages';
      case 'books': return 'books';
      case 'minutes': return 'minutes of reading';
    }
  };
  
  const renderChallengeItem = ({ item }: { item: Challenge }) => {
    const isCreator = item.creatorId === user?.id;
    const progress = calculateProgress(item);
    const isActive = item.status === 'active' || isCreator;
    
    return (
      <Card 
        style={[
          styles.challengeCard, 
          isCreator && styles.creatorCard,
          item.status === 'completed' && styles.completedCard
        ]}
        onPress={() => navigation.navigate('ChallengeDetail', { challengeId: item.id })}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.challengeTitle}>{item.title}</Title>
            {isCreator && (
              <Chip icon="crown" style={styles.creatorChip}>Creator</Chip>
            )}
            {item.status === 'completed' && (
              <Chip icon="check-circle" style={styles.completedChip}>Completed</Chip>
            )}
          </View>
          
          <Paragraph style={styles.challengeDescription}>{item.description}</Paragraph>
          
          <View style={styles.challengeDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Goal:</Text>
              <Text style={styles.detailValue}>
                {item.goal} {getGoalTypeLabel(item.goalType)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>End Date:</Text>
              <Text style={styles.detailValue}>{formatDate(item.endDate)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Participants:</Text>
              <Text style={styles.detailValue}>{item.participantCount}</Text>
            </View>
          </View>
          
          {isActive && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Progress: {item.myProgress || 0} / {item.goal} ({Math.round(progress)}%)
              </Text>
              <ProgressBar 
                progress={progress / 100} 
                color={progress >= 100 ? '#4CAF50' : '#6200ee'} 
                style={styles.progressBar} 
              />
            </View>
          )}
          
          {activeTab === 'public' && !isActive && (
            <Button 
              mode="contained" 
              onPress={() => joinChallenge(item.id)}
              style={styles.joinButton}
            >
              Join Challenge
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Avatar.Icon size={80} icon="trophy" style={styles.emptyIcon} />
      <Text style={styles.emptyText}>
        {activeTab === 'my' 
          ? "You haven't joined any challenges yet!"
          : "No public challenges available at the moment."}
      </Text>
      {activeTab === 'my' && (
        <Button 
          mode="contained" 
          onPress={() => setModalVisible(true)}
          style={styles.createButtonEmpty}
        >
          Create Challenge
        </Button>
      )}
    </View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Reading Challenges</Title>
        <Text style={styles.subtitle}>Compete and achieve your reading goals!</Text>
        
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my' && styles.activeTab]}
            onPress={() => setActiveTab('my')}
          >
            <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
              My Challenges
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'public' && styles.activeTab]}
            onPress={() => setActiveTab('public')}
          >
            <Text style={[styles.tabText, activeTab === 'public' && styles.activeTabText]}>
              Public Challenges
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Loading challenges...</Text>
        </View>
      ) : (
        activeTab === 'my' ? (
          myChallenges.length > 0 ? (
            <FlatList
              data={myChallenges}
              renderItem={renderChallengeItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.challengesList}
            />
          ) : renderEmptyState()
        ) : (
          publicChallenges.length > 0 ? (
            <FlatList
              data={publicChallenges}
              renderItem={renderChallengeItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.challengesList}
            />
          ) : renderEmptyState()
        )
      )}
      
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView style={styles.modalScrollView}>
            <Title style={styles.modalTitle}>Create New Challenge</Title>
            
            <TextInput
              label="Challenge Title"
              value={challengeTitle}
              onChangeText={setChallengeTitle}
              style={styles.input}
            />
            
            <TextInput
              label="Description"
              value={challengeDescription}
              onChangeText={setChallengeDescription}
              multiline
              numberOfLines={3}
              style={styles.input}
            />
            
            <Text style={styles.sectionLabel}>Challenge Goal</Text>
            <View style={styles.goalTypeContainer}>
              <RadioButton.Group 
                onValueChange={value => setGoalType(value as 'pages' | 'books' | 'minutes')} 
                value={goalType}
              >
                <View style={styles.radioOption}>
                  <RadioButton value="pages" />
                  <Text>Pages</Text>
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton value="books" />
                  <Text>Books</Text>
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton value="minutes" />
                  <Text>Minutes</Text>
                </View>
              </RadioButton.Group>
            </View>
            
            <TextInput
              label="Goal Value"
              value={goalValue}
              onChangeText={setGoalValue}
              keyboardType="numeric"
              style={styles.input}
            />
            
            <TextInput
              label="End Date (YYYY-MM-DD)"
              value={endDate}
              onChangeText={setEndDate}
              placeholder="Optional (defaults to 30 days)"
              style={styles.input}
            />
            
            <View style={styles.switchContainer}>
              <Text>Private Challenge</Text>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
              />
            </View>
            
            <Text style={styles.privateHint}>
              Private challenges are invite-only and won't appear in public listing
            </Text>
            
            <View style={styles.modalButtons}>
              <Button 
                mode="outlined" 
                onPress={() => {
                  resetForm();
                  setModalVisible(false);
                }}
                style={[styles.modalButton, { marginRight: 8 }]}
              >
                Cancel
              </Button>
              
              <Button 
                mode="contained" 
                onPress={createChallenge}
                style={styles.modalButton}
                loading={isLoading}
                disabled={isLoading}
              >
                Create
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
      
      {activeTab === 'my' && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => setModalVisible(true)}
          label="New Challenge"
        />
      )}
    </View>
  );
};

const Switch = ({ value, onValueChange }) => {
  return (
    <TouchableOpacity 
      style={[styles.switchTrack, value && styles.switchTrackOn]}
      onPress={() => onValueChange(!value)}
    >
      <View style={[styles.switchThumb, value && styles.switchThumbOn]} />
    </TouchableOpacity>
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
    paddingBottom: 16,
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
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: 'white',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
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
  challengesList: {
    padding: 16,
  },
  challengeCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
  },
  creatorCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#ffd700',
  },
  completedCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  challengeTitle: {
    flex: 1,
    fontSize: 18,
    marginBottom: 8,
  },
  creatorChip: {
    backgroundColor: '#FFF8E1',
    marginLeft: 8,
  },
  completedChip: {
    backgroundColor: '#E8F5E9',
    marginLeft: 8,
  },
  challengeDescription: {
    marginBottom: 16,
    color: '#555',
  },
  challengeDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    width: 100,
    fontWeight: 'bold',
    color: '#666',
  },
  detailValue: {
    flex: 1,
    color: '#333',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressText: {
    marginBottom: 4,
    fontSize: 14,
    color: '#555',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  joinButton: {
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    backgroundColor: '#6200ee',
    opacity: 0.8,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButtonEmpty: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalScrollView: {
    flex: 1,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  goalTypeContainer: {
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 8,
  },
  switchTrack: {
    width: 50,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    padding: 2,
  },
  switchTrackOn: {
    backgroundColor: 'rgba(98, 0, 238, 0.5)',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    elevation: 2,
  },
  switchThumbOn: {
    transform: [{ translateX: 26 }],
    backgroundColor: '#6200ee',
  },
  privateHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  modalButton: {
    flex: 1,
  },
});

export default ChallengesScreen;