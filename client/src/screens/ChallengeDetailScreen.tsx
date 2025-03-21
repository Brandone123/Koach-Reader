import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  FlatList,
  Share
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  Chip,
  ProgressBar,
  Divider,
  TextInput,
  IconButton,
  List
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import { selectUser } from '../slices/authSlice';
import { fetchApi } from '../utils/api';
import { mockFetchApi } from '../utils/mockApi';

type ChallengeDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ChallengeDetail'>;
type ChallengeDetailScreenRouteProp = RouteProp<RootStackParamList, 'ChallengeDetail'>;

interface ChallengeDetailScreenProps {
  navigation: ChallengeDetailScreenNavigationProp;
  route: ChallengeDetailScreenRouteProp;
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  creatorId: number;
  creatorName: string;
  startDate: string;
  endDate: string;
  goal: number;
  goalType: 'pages' | 'books' | 'minutes';
  bookId?: number;
  bookTitle?: string;
  categoryId?: number;
  categoryName?: string;
  isPrivate: boolean;
  participantCount: number;
  myProgress?: number;
  status?: 'active' | 'completed' | 'abandoned';
  createdAt: string;
  updatedAt: string;
}

interface Participant {
  id: number;
  userId: number;
  username: string;
  progress: number;
  progressPercentage: number;
  status: 'active' | 'completed' | 'abandoned';
  joinedAt: string;
}

interface Comment {
  id: number;
  userId: number;
  username: string;
  challengeId: number;
  content: string;
  createdAt: string;
}

const ChallengeDetailScreen: React.FC<ChallengeDetailScreenProps> = ({ navigation, route }) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const { challengeId } = route.params;
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progressUpdateMode, setProgressUpdateMode] = useState(false);
  const [newProgress, setNewProgress] = useState('');
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'participants' | 'comments'>('details');
  const [isShareLoading, setIsShareLoading] = useState(false);
  
  useEffect(() => {
    fetchChallengeDetails();
  }, [challengeId]);
  
  const fetchChallengeDetails = async () => {
    setIsLoading(true);
    
    try {
      // Try real API first
      const data = await fetchApi(`/api/challenges/${challengeId}`);
      setChallenge(data);
      
      const participantsData = await fetchApi(`/api/challenges/${challengeId}/participants`);
      setParticipants(participantsData);
      
      const commentsData = await fetchApi(`/api/challenges/${challengeId}/comments`);
      setComments(commentsData);
    } catch (error) {
      try {
        // Fall back to mock data
        const mockData = await mockFetchApi(`/api/challenges/${challengeId}`);
        
        // Create mock challenge with more detail
        const mockChallenge: Challenge = {
          id: challengeId,
          title: "30-Day Reading Challenge",
          description: "Read every day for 30 days and track your progress!",
          creatorId: 2,
          creatorName: "bookworm42",
          startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          goal: 500,
          goalType: "pages",
          isPrivate: false,
          participantCount: 8,
          myProgress: 220,
          status: "active",
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        setChallenge(mockChallenge);
        
        // Mock participants
        const mockParticipants: Participant[] = [
          {
            id: 1,
            userId: 1,
            username: "demo",
            progress: 220,
            progressPercentage: 44,
            status: "active",
            joinedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 2,
            userId: 2,
            username: "bookworm42",
            progress: 350,
            progressPercentage: 70,
            status: "active",
            joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 3,
            userId: 3,
            username: "readaholic",
            progress: 500,
            progressPercentage: 100,
            status: "completed",
            joinedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 4,
            userId: 4,
            username: "bibliophile",
            progress: 320,
            progressPercentage: 64,
            status: "active",
            joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 5,
            userId: 5,
            username: "kindlemaster",
            progress: 180,
            progressPercentage: 36,
            status: "active",
            joinedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString()
          },
        ];
        
        setParticipants(mockParticipants);
        
        // Mock comments
        const mockComments: Comment[] = [
          {
            id: 1,
            userId: 2,
            username: "bookworm42",
            challengeId: challengeId,
            content: "Let's all try to read daily and support each other!",
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 2,
            userId: 3,
            username: "readaholic",
            challengeId: challengeId,
            content: "Just finished! It was a great challenge, thanks for organizing!",
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 3,
            userId: 5,
            username: "kindlemaster",
            challengeId: challengeId,
            content: "I'm finding it harder than expected, but I'm not giving up!",
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        
        setComments(mockComments);
      } catch (mockError) {
        console.error('Failed to fetch challenge details:', mockError);
        Alert.alert('Error', 'Failed to load challenge details');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateProgress = async () => {
    if (!newProgress || isNaN(Number(newProgress)) || Number(newProgress) < 0) {
      Alert.alert('Error', 'Please enter a valid progress value');
      return;
    }
    
    if (!challenge) return;
    
    const progress = Number(newProgress);
    
    setIsLoading(true);
    try {
      // Try real API first
      await fetchApi(`/api/challenges/${challengeId}/progress`, {
        method: 'POST',
        body: { progress }
      });
      
      // Update local state
      setChallenge(prev => prev ? { ...prev, myProgress: progress } : null);
      setParticipants(prev => 
        prev.map(p => p.userId === user?.id 
          ? { 
              ...p, 
              progress, 
              progressPercentage: Math.min(100, Math.round((progress / (challenge?.goal || 1)) * 100)),
              status: progress >= (challenge?.goal || 0) ? 'completed' : 'active'
            } 
          : p
        )
      );
      
      setProgressUpdateMode(false);
      setNewProgress('');
      
      Alert.alert('Success', 'Progress updated successfully!');
    } catch (error) {
      try {
        // Fall back to mock API
        // Update local state
        const updatedProgress = progress;
        const progressPercentage = Math.min(100, Math.round((progress / (challenge?.goal || 1)) * 100));
        const newStatus = progress >= (challenge?.goal || 0) ? 'completed' : 'active';
        
        setChallenge(prev => prev ? { ...prev, myProgress: updatedProgress, status: newStatus } : null);
        
        setParticipants(prev => 
          prev.map(p => p.userId === user?.id 
            ? { ...p, progress: updatedProgress, progressPercentage, status: newStatus } 
            : p
          )
        );
        
        setProgressUpdateMode(false);
        setNewProgress('');
        
        Alert.alert('Success', 'Progress updated successfully!');
      } catch (mockError) {
        console.error('Failed to update progress:', mockError);
        Alert.alert('Error', 'Failed to update progress');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const addComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }
    
    setIsLoading(true);
    try {
      // Try real API first
      const response = await fetchApi(`/api/challenges/${challengeId}/comments`, {
        method: 'POST',
        body: { content: newComment }
      });
      
      // Add new comment to the list
      setComments(prev => [response, ...prev]);
      setNewComment('');
    } catch (error) {
      try {
        // Fall back to mock API
        const mockComment: Comment = {
          id: comments.length + 1,
          userId: user?.id || 0,
          username: user?.username || 'Anonymous',
          challengeId,
          content: newComment,
          createdAt: new Date().toISOString()
        };
        
        setComments(prev => [mockComment, ...prev]);
        setNewComment('');
      } catch (mockError) {
        console.error('Failed to add comment:', mockError);
        Alert.alert('Error', 'Failed to add comment');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  const getTimeRemaining = () => {
    if (!challenge) return null;
    
    const endDate = new Date(challenge.endDate);
    const now = new Date();
    
    // Challenge has ended
    if (now > endDate) {
      return 'Challenge ended';
    }
    
    const diffTime = Math.abs(endDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays} days remaining`;
  };
  
  const getGoalTypeLabel = (type: 'pages' | 'books' | 'minutes') => {
    switch (type) {
      case 'pages': return 'pages';
      case 'books': return 'books';
      case 'minutes': return 'minutes of reading';
    }
  };
  
  const getUserRank = () => {
    if (!user || !participants.length) return null;
    
    // Sort participants by progress in descending order
    const sortedParticipants = [...participants].sort((a, b) => b.progress - a.progress);
    
    // Find user's rank
    const userIndex = sortedParticipants.findIndex(p => p.userId === user.id);
    
    if (userIndex === -1) return null;
    
    return userIndex + 1;
  };
  
  // Function to share challenge
  const shareChallenge = async () => {
    if (!challenge) return;
    
    setIsShareLoading(true);
    
    try {
      const message = `Join me in the "${challenge.title}" reading challenge on Koach! Goal: ${challenge.goal} ${getGoalTypeLabel(challenge.goalType)}. ${getTimeRemaining()}!`;
      
      const result = await Share.share({
        message,
        title: `Koach Reading Challenge: ${challenge.title}`,
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log(`Shared via ${result.activityType}`);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Share Error', 'There was a problem sharing this challenge');
    } finally {
      setIsShareLoading(false);
    }
  };
  
  const renderParticipant = ({ item, index }: { item: Participant, index: number }) => {
    const isCurrentUser = item.userId === user?.id;
    
    return (
      <Card style={[styles.participantCard, isCurrentUser && styles.currentUserCard]}>
        <Card.Content style={styles.participantContent}>
          <View style={styles.participantRank}>
            <Avatar.Text 
              size={40} 
              label={(index + 1).toString()} 
              style={[
                styles.rankAvatar,
                index === 0 ? styles.firstRankAvatar : 
                index === 1 ? styles.secondRankAvatar : 
                index === 2 ? styles.thirdRankAvatar : styles.otherRankAvatar
              ]} 
            />
          </View>
          
          <View style={styles.participantInfo}>
            <Text style={[styles.participantName, isCurrentUser && styles.currentUserText]}>
              {item.username} {isCurrentUser && '(You)'}
            </Text>
            
            <View style={styles.progressInfo}>
              <Text style={styles.progressValue}>
                {item.progress} / {challenge?.goal} {challenge?.goalType}
              </Text>
              <ProgressBar 
                progress={item.progressPercentage / 100} 
                color={item.status === 'completed' ? '#4CAF50' : '#6200ee'} 
                style={styles.progressBar} 
              />
            </View>
            
            {item.status === 'completed' && (
              <Chip icon="trophy" style={styles.completedChip}>Completed</Chip>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  const renderComment = ({ item }: { item: Comment }) => {
    const isCurrentUser = item.userId === user?.id;
    
    return (
      <Card style={[styles.commentCard, isCurrentUser && styles.currentUserCommentCard]}>
        <Card.Content>
          <View style={styles.commentHeader}>
            <Text style={[styles.commentUsername, isCurrentUser && styles.currentUserText]}>
              {item.username} {isCurrentUser && '(You)'}
            </Text>
            <Text style={styles.commentDate}>{formatCommentDate(item.createdAt)}</Text>
          </View>
          
          <Text style={styles.commentContent}>{item.content}</Text>
        </Card.Content>
      </Card>
    );
  };
  
  if (isLoading && !challenge) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading challenge details...</Text>
      </View>
    );
  }
  
  if (!challenge) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Challenge not found or an error occurred.</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Go Back
        </Button>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Title style={styles.title}>{challenge.title}</Title>
          <IconButton
            icon="share"
            color="white"
            size={22}
            onPress={shareChallenge}
            disabled={isShareLoading}
            loading={isShareLoading}
            style={styles.shareButton}
          />
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{participants.length}</Text>
            <Text style={styles.statLabel}>Participants</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{challenge.goalType === 'pages' ? challenge.goal : challenge.goal}</Text>
            <Text style={styles.statLabel}>{getGoalTypeLabel(challenge.goalType)}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{getTimeRemaining()}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
        </View>
        
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'details' && styles.activeTab]}
            onPress={() => setActiveTab('details')}
          >
            <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
              Details
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'participants' && styles.activeTab]}
            onPress={() => setActiveTab('participants')}
          >
            <Text style={[styles.tabText, activeTab === 'participants' && styles.activeTabText]}>
              Leaderboard
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'comments' && styles.activeTab]}
            onPress={() => setActiveTab('comments')}
          >
            <Text style={[styles.tabText, activeTab === 'comments' && styles.activeTabText]}>
              Discussion
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {activeTab === 'details' && (
        <ScrollView style={styles.scrollView}>
          <Card style={styles.detailsCard}>
            <Card.Content>
              <Text style={styles.description}>{challenge.description}</Text>
              
              <Divider style={styles.divider} />
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created by:</Text>
                <Text style={styles.detailValue}>{challenge.creatorName}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Start Date:</Text>
                <Text style={styles.detailValue}>{formatDate(challenge.startDate)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>End Date:</Text>
                <Text style={styles.detailValue}>{formatDate(challenge.endDate)}</Text>
              </View>
              
              {challenge.bookTitle && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Book:</Text>
                  <Text style={styles.detailValue}>{challenge.bookTitle}</Text>
                </View>
              )}
              
              {challenge.categoryName && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailValue}>{challenge.categoryName}</Text>
                </View>
              )}
              
              <Divider style={styles.divider} />
              
              <Text style={styles.yourProgressLabel}>Your Progress</Text>
              
              {challenge.status === 'active' ? (
                <View>
                  <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>
                      {challenge.myProgress || 0} / {challenge.goal} {getGoalTypeLabel(challenge.goalType)}
                      {" "}
                      ({Math.round(((challenge.myProgress || 0) / challenge.goal) * 100)}%)
                    </Text>
                    <ProgressBar 
                      progress={(challenge.myProgress || 0) / challenge.goal} 
                      color={(challenge.myProgress || 0) >= challenge.goal ? '#4CAF50' : '#6200ee'} 
                      style={styles.progressBar} 
                    />
                  </View>
                  
                  {getUserRank() !== null && (
                    <View style={styles.rankInfo}>
                      <Text style={styles.rankText}>
                        Your Rank: {getUserRank()} of {participants.length}
                      </Text>
                    </View>
                  )}
                  
                  {progressUpdateMode ? (
                    <View style={styles.updateProgressContainer}>
                      <TextInput
                        label={`Your progress (${getGoalTypeLabel(challenge.goalType)})`}
                        value={newProgress}
                        onChangeText={setNewProgress}
                        keyboardType="numeric"
                        style={styles.progressInput}
                      />
                      
                      <View style={styles.updateButtons}>
                        <Button 
                          mode="outlined" 
                          onPress={() => {
                            setProgressUpdateMode(false);
                            setNewProgress('');
                          }}
                          style={[styles.updateButton, { marginRight: 8 }]}
                        >
                          Cancel
                        </Button>
                        
                        <Button 
                          mode="contained" 
                          onPress={updateProgress}
                          style={styles.updateButton}
                          loading={isLoading}
                          disabled={isLoading}
                        >
                          Update
                        </Button>
                      </View>
                    </View>
                  ) : (
                    <Button 
                      mode="contained" 
                      onPress={() => {
                        setProgressUpdateMode(true);
                        setNewProgress(challenge.myProgress?.toString() || '0');
                      }}
                      icon="pencil"
                      style={styles.updateProgressButton}
                    >
                      Update Progress
                    </Button>
                  )}
                </View>
              ) : challenge.status === 'completed' ? (
                <View style={styles.completedContainer}>
                  <Avatar.Icon 
                    size={60} 
                    icon="trophy" 
                    style={styles.completedIcon} 
                  />
                  <Text style={styles.completedText}>
                    Congratulations! You've completed this challenge!
                  </Text>
                  <Text style={styles.completedSubtext}>
                    Final progress: {challenge.myProgress} / {challenge.goal} {getGoalTypeLabel(challenge.goalType)}
                  </Text>
                </View>
              ) : (
                <View style={styles.notJoinedContainer}>
                  <Text style={styles.notJoinedText}>
                    You're not participating in this challenge yet.
                  </Text>
                  <Button 
                    mode="contained" 
                    onPress={() => {
                      // Join challenge function would be called here
                      Alert.alert('Join Challenge', 'This would join the challenge in a real implementation');
                    }}
                    style={styles.joinButton}
                  >
                    Join Challenge
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>
        </ScrollView>
      )}
      
      {activeTab === 'participants' && (
        <View style={styles.participantsContainer}>
          {participants.length > 0 ? (
            <FlatList
              data={[...participants].sort((a, b) => b.progress - a.progress)}
              renderItem={renderParticipant}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.participantsList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No participants in this challenge yet.</Text>
            </View>
          )}
        </View>
      )}
      
      {activeTab === 'comments' && (
        <View style={styles.commentsContainer}>
          <Card style={styles.commentInputCard}>
            <Card.Content>
              <TextInput
                label="Add a comment"
                value={newComment}
                onChangeText={setNewComment}
                multiline
                numberOfLines={2}
                style={styles.commentInput}
              />
              
              <Button 
                mode="contained" 
                onPress={addComment}
                style={styles.addCommentButton}
                disabled={!newComment.trim() || isLoading}
                loading={isLoading}
                icon="send"
              >
                Post
              </Button>
            </Card.Content>
          </Card>
          
          {comments.length > 0 ? (
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.commentsList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No comments yet. Be the first to start the discussion!</Text>
            </View>
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
    paddingTop: 20,
    paddingBottom: 0,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  shareButton: {
    margin: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
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
  scrollView: {
    flex: 1,
  },
  detailsCard: {
    margin: 16,
    borderRadius: 12,
    elevation: 3,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
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
  yourProgressLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  progressContainer: {
    marginBottom: 16,
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
  rankInfo: {
    marginBottom: 16,
  },
  rankText: {
    fontSize: 14,
    color: '#6200ee',
    fontWeight: 'bold',
  },
  updateProgressContainer: {
    marginBottom: 16,
  },
  progressInput: {
    backgroundColor: 'white',
    marginBottom: 12,
  },
  updateButtons: {
    flexDirection: 'row',
  },
  updateButton: {
    flex: 1,
  },
  updateProgressButton: {
    marginBottom: 16,
  },
  completedContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    marginBottom: 16,
  },
  completedIcon: {
    backgroundColor: '#4CAF50',
    marginBottom: 12,
  },
  completedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 8,
  },
  completedSubtext: {
    fontSize: 14,
    color: '#388E3C',
    textAlign: 'center',
  },
  notJoinedContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 16,
  },
  notJoinedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  joinButton: {
    marginTop: 8,
  },
  participantsContainer: {
    flex: 1,
  },
  participantsList: {
    padding: 16,
  },
  participantCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  currentUserCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#6200ee',
  },
  participantContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantRank: {
    marginRight: 16,
  },
  rankAvatar: {
    marginRight: 8,
  },
  firstRankAvatar: {
    backgroundColor: '#FFD700',
  },
  secondRankAvatar: {
    backgroundColor: '#C0C0C0',
  },
  thirdRankAvatar: {
    backgroundColor: '#CD7F32',
  },
  otherRankAvatar: {
    backgroundColor: '#9E9E9E',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  currentUserText: {
    color: '#6200ee',
  },
  progressInfo: {
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  completedChip: {
    backgroundColor: '#E8F5E9',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  commentsContainer: {
    flex: 1,
  },
  commentInputCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 3,
  },
  commentInput: {
    backgroundColor: 'white',
    marginBottom: 12,
  },
  addCommentButton: {
    alignSelf: 'flex-end',
  },
  commentsList: {
    padding: 16,
    paddingTop: 8,
  },
  commentCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  currentUserCommentCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#6200ee',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUsername: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  commentDate: {
    fontSize: 12,
    color: '#888',
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#B00020',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginTop: 8,
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
  },
});

export default ChallengeDetailScreen;