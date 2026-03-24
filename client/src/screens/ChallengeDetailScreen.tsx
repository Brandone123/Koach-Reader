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
  Share,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { Card, Button, Avatar, TextInput, IconButton } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import { selectUser } from '../slices/authSlice';
import {
  fetchChallengeById,
  fetchChallengeParticipants,
  fetchChallengeComments,
  updateChallengeProgress,
  joinChallenge,
  clearCurrentChallenge,
  selectCurrentChallenge,
  selectChallengeParticipants,
  selectChallengeComments,
  selectChallengesDetailLoading,
  selectChallengesLoading,
  type ChallengeParticipant,
  type ChallengeComment,
} from '../slices/challengesSlice';
import { LinearGradient } from 'expo-linear-gradient';

type ChallengeDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ChallengeDetail'>;
type ChallengeDetailScreenRouteProp = RouteProp<RootStackParamList, 'ChallengeDetail'>;

export interface ChallengeDetailScreenProps {
  navigation: ChallengeDetailScreenNavigationProp;
  route: ChallengeDetailScreenRouteProp;
}

const ChallengeDetailScreen = ({ navigation, route }: ChallengeDetailScreenProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const user = useSelector(selectUser);
  const { challengeId } = route.params;
  const idNum = parseInt(String(challengeId), 10);

  const challenge = useSelector(selectCurrentChallenge);
  const participants = useSelector(selectChallengeParticipants);
  const comments = useSelector(selectChallengeComments);
  const detailLoading = useSelector(selectChallengesDetailLoading);
  const actionLoading = useSelector(selectChallengesLoading);

  const [progressUpdateMode, setProgressUpdateMode] = useState(false);
  const [newProgress, setNewProgress] = useState('');
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'participants' | 'comments'>('details');
  const [isShareLoading, setIsShareLoading] = useState(false);

  useEffect(() => {
    if (!idNum || isNaN(idNum)) return;
    dispatch(fetchChallengeById(idNum) as any);
    dispatch(fetchChallengeParticipants(idNum) as any);
    dispatch(fetchChallengeComments(idNum) as any);
    return () => {
      dispatch(clearCurrentChallenge());
    };
  }, [challengeId, dispatch, idNum]);

  /** Anciens défis : créateur sans ligne participant — insertion pour cohérence progression */
  useEffect(() => {
    if (!challenge || !user || detailLoading || !idNum) return;
    if (String(challenge.creatorId) !== String(user.id)) return;
    const hasRow = participants.some((p) => String(p.userId) === String(user.id));
    if (hasRow) return;
    let cancelled = false;
    (async () => {
      try {
        await dispatch(joinChallenge(idNum) as any).unwrap();
        if (!cancelled) {
          await dispatch(fetchChallengeById(idNum) as any);
          await dispatch(fetchChallengeParticipants(idNum) as any);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    challenge?.id,
    user?.id,
    detailLoading,
    participants.length,
    dispatch,
    idNum,
    challenge?.creatorId,
    participants.some((p) => String(p.userId) === String(user?.id)),
  ]);

  const updateProgress = async () => {
    if (!newProgress || isNaN(Number(newProgress)) || Number(newProgress) < 0) {
      Alert.alert(t('common.error', 'Error'), t('challenges.detail.invalidProgress'));
      return;
    }
    if (!challenge) return;
    const progress = Number(newProgress);
    try {
      await dispatch(
        updateChallengeProgress({ challengeId: idNum, progress }) as any
      ).unwrap();
      setProgressUpdateMode(false);
      setNewProgress('');
      Alert.alert(t('common.success'), t('challenges.detail.progressSaved'));
    } catch (error: any) {
      Alert.alert(t('common.error', 'Error'), error?.message || t('challenges.detail.joinFailed'));
    }
  };

  const addComment = async () => {
    Alert.alert(t('common.comingSoon', 'Coming soon'), t('challenges.detail.commentsDisabled'));
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
    if (now > endDate) {
      return t('challenges.detail.ended');
    }
    const diffTime = Math.abs(endDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1
      ? t('challenges.detail.daysLeft_one', { n: diffDays })
      : t('challenges.detail.daysLeft', { n: diffDays });
  };
  
  const getGoalTypeLabel = (type: string) => {
    switch (type) {
      case 'pages':
        return t('challenges.pages');
      case 'books':
        return t('challenges.books');
      case 'minutes':
        return t('challenges.minutes');
      case 'koach':
        return t('common.points');
      default:
        return type;
    }
  };
  
  const getUserRank = () => {
    if (!user || !participants.length) return null;
    
    // Sort participants by progress in descending order
    const sortedParticipants = [...participants].sort((a, b) => b.progress - a.progress);
    
    // Find user's rank
    const userIndex = sortedParticipants.findIndex(p => String(p.userId) === String(user.id));
    
    if (userIndex === -1) return null;
    
    return userIndex + 1;
  };
  
  // Function to share challenge
  const shareChallenge = async () => {
    if (!challenge) return;
    
    setIsShareLoading(true);
    
    try {
      const message = `Join me in the "${challenge.title}" reading challenge on Koach! Goal: ${challenge.goal} ${getGoalTypeLabel(challenge.goalType)}. ${getTimeRemaining()}!`;
      
      await Share.share({
        message,
        title: `Koach Reading Challenge: ${challenge.title}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert(t('common.errorGeneric'), t('challenges.detail.shareError'));
    } finally {
      setIsShareLoading(false);
    }
  };
  
  const renderParticipant = ({ item, index }: { item: ChallengeParticipant; index: number }) => {
    const isCurrentUser = String(item.userId) === String(user?.id);
    const goal = challenge?.goal || 1;
    const pct = Math.min(100, Math.round((item.progress / goal) * 100));

    return (
      <View style={[styles.participantRow, isCurrentUser && styles.participantRowHighlight]}>
        <Avatar.Text
          size={44}
          label={(index + 1).toString()}
          style={[
            styles.rankAvatar,
            index === 0
              ? styles.firstRankAvatar
              : index === 1
                ? styles.secondRankAvatar
                : index === 2
                  ? styles.thirdRankAvatar
                  : styles.otherRankAvatar,
          ]}
        />
        <View style={styles.participantBody}>
          <View style={styles.participantTop}>
            <Text style={[styles.participantName, isCurrentUser && styles.currentUserText]} numberOfLines={1}>
              {item.username}
              {isCurrentUser && (
                <Text style={styles.youSuffix}> · {t('challenges.detail.you')}</Text>
              )}
            </Text>
            <Text style={styles.participantScore}>
              {item.progress}/{goal}
            </Text>
          </View>
          <View style={styles.participantTrack}>
            <View style={[styles.participantTrackFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.participantUnit}>{getGoalTypeLabel(challenge?.goalType || 'pages')}</Text>
          {item.status === 'completed' && (
            <View style={styles.doneBadge}>
              <Icon name="check-decagram" size={14} color="#15803D" />
              <Text style={styles.doneBadgeText}>{t('leaderboard.completed')}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };
  
  const renderComment = ({ item }: { item: ChallengeComment }) => {
    const isCurrentUser = user ? String(item.userId) === String(user.id) : false;
    
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
  
  if (detailLoading && !challenge) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#6D28D9" />
        <Text style={styles.loadingText}>{t('challenges.detail.loading')}</Text>
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Icon name="alert-circle-outline" size={56} color="#C4B5D4" />
        <Text style={styles.errorText}>{t('challenges.detail.notFound')}</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.backButton} buttonColor="#5B21B6">
          {t('common.goBack')}
        </Button>
      </View>
    );
  }

  const isParticipant =
    !!user &&
    (String(challenge.creatorId) === String(user.id) ||
      participants.some((p) => String(p.userId) === String(user.id)));
  const myParticipantRow = participants.find((p) => String(p.userId) === String(user?.id));
  const userCompleted = myParticipantRow?.status === 'completed';
  const myProgressDisplay =
    myParticipantRow != null ? myParticipantRow.progress : challenge.myProgress ?? 0;
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E1033', '#4C1D95', '#6D28D9']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerToolbar}>
          <IconButton
            icon="arrow-left"
            size={22}
            iconColor="#fff"
            onPress={() => navigation.goBack()}
            style={styles.headerIconBtn}
          />
          <Text style={styles.heroTitle} numberOfLines={2}>
            {challenge.title.length > 20 ? challenge.title.substring(0, 20) + '...' : challenge.title}
          </Text>

          <IconButton
            icon="share-variant"
            size={22}
            iconColor="#fff"
            onPress={shareChallenge}
            disabled={isShareLoading}
            loading={isShareLoading}
            style={styles.headerIconBtn}
          />
        </View>
       
        <View style={styles.visibilityRow}>
          <View style={[styles.visPill, challenge.isPrivate ? styles.visPillPrivate : styles.visPillPublic]}>
            <Icon name={challenge.isPrivate ? 'lock-outline' : 'earth'} size={14} color={challenge.isPrivate ? '#6B21A8' : '#0369A1'} />
            <Text style={[styles.visPillText, challenge.isPrivate ? styles.visPillTextPrivate : styles.visPillTextPublic]}>
              {challenge.isPrivate ? t('challenges.private') : t('challenges.detail.public')}
            </Text>
          </View>
        </View>

        <View style={styles.segmentWrap}>
          <TouchableOpacity
            style={[styles.segmentItem, activeTab === 'details' && styles.segmentItemActive]}
            onPress={() => setActiveTab('details')}
            activeOpacity={0.9}
          >
            <Icon name="text-box-outline" size={17} color={activeTab === 'details' ? '#5B21B6' : 'rgba(255,255,255,0.75)'} />
            <Text style={[styles.segmentText, activeTab === 'details' && styles.segmentTextActive]}>
              {t('challenges.detail.overview')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentItem, activeTab === 'participants' && styles.segmentItemActive]}
            onPress={() => setActiveTab('participants')}
            activeOpacity={0.9}
          >
            <Icon name="podium" size={17} color={activeTab === 'participants' ? '#5B21B6' : 'rgba(255,255,255,0.75)'} />
            <Text style={[styles.segmentText, activeTab === 'participants' && styles.segmentTextActive]}>
              {t('challenges.detail.rankings')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentItem, activeTab === 'comments' && styles.segmentItemActive]}
            onPress={() => setActiveTab('comments')}
            activeOpacity={0.9}
          >
            <Icon name="forum-outline" size={17} color={activeTab === 'comments' ? '#5B21B6' : 'rgba(255,255,255,0.75)'} />
            <Text style={[styles.segmentText, activeTab === 'comments' && styles.segmentTextActive]}>
              {t('challenges.detail.discussion')}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {activeTab === 'details' && (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.detailsSurface}>
            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <Icon name="account-group-outline" size={18} color="#7C3AED" />
                <Text style={styles.statPillValue}>{participants.length}</Text>
                <Text style={styles.statPillLabel}>{t('challenges.detail.players')}</Text>
              </View>
              <View style={styles.statPill}>
                <Icon name="target" size={18} color="#7C3AED" />
                <Text style={styles.statPillValue}>{challenge.goal}</Text>
                <Text style={styles.statPillLabel}>{t('challenges.detail.target')}</Text>
              </View>
              <View style={styles.statPillWide}>
                <Icon name="clock-outline" size={18} color="#7C3AED" />
                <Text style={styles.statPillValueSmall} numberOfLines={2}>
                  {getTimeRemaining()}
                </Text>
                <Text style={styles.statPillLabel}>{t('challenges.detail.timeline')}</Text>
              </View>
            </View>

            {!!challenge.description?.trim() && (
              <Text style={styles.description}>{challenge.description}</Text>
            )}

            <View style={styles.metaList}>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>{t('challenges.detail.createdBy')}</Text>
                <Text style={styles.metaVal} numberOfLines={1}>
                  {challenge.creatorUsername ||
                    (String(challenge.creatorId) === String(user?.id) ? t('challenges.detail.you') : '—')}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>{t('challenges.startDate')}</Text>
                <Text style={styles.metaVal}>{formatDate(challenge.startDate)}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>{t('challenges.endDate')}</Text>
                <Text style={styles.metaVal}>{formatDate(challenge.endDate)}</Text>
              </View>
              {challenge.bookTitle ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaKey}>{t('challenges.detail.book')}</Text>
                  <Text style={styles.metaVal}>{challenge.bookTitle}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.sectionHeading}>{t('challenges.detail.yourProgress')}</Text>

            {isParticipant && !userCompleted ? (
              <View style={styles.progressSection}>
                <View style={styles.progressHead}>
                  <Text style={styles.progressFraction}>
                    {myProgressDisplay} / {challenge.goal}{' '}
                    <Text style={styles.progressUnit}>{getGoalTypeLabel(challenge.goalType)}</Text>
                  </Text>
                  <Text style={styles.progressPct}>
                    {Math.round((myProgressDisplay / (challenge.goal || 1)) * 100)}%
                  </Text>
                </View>
                <View style={styles.progressTrackMain}>
                  <View
                    style={[
                      styles.progressTrackFill,
                      { width: `${Math.min(100, (myProgressDisplay / (challenge.goal || 1)) * 100)}%` },
                    ]}
                  />
                </View>
                {getUserRank() !== null && (
                  <Text style={styles.rankLine}>
                    {t('challenges.detail.rankLine', { rank: getUserRank(), total: participants.length })}
                  </Text>
                )}
                {progressUpdateMode ? (
                  <View style={styles.editBlock}>
                    <TextInput
                      label={t('challenges.detail.progressLabel', {
                        unit: getGoalTypeLabel(challenge.goalType),
                      })}
                      value={newProgress}
                      onChangeText={setNewProgress}
                      keyboardType="numeric"
                      mode="outlined"
                      style={styles.progressInput}
                    />
                    <View style={styles.updateButtons}>
                      <Button
                        mode="outlined"
                        onPress={() => {
                          setProgressUpdateMode(false);
                          setNewProgress('');
                        }}
                        style={styles.updateButton}
                        textColor="#5B21B6"
                      >
                        {t('challenges.detail.cancel')}
                      </Button>
                      <Button
                        mode="contained"
                        onPress={updateProgress}
                        style={styles.updateButton}
                        loading={actionLoading}
                        disabled={actionLoading}
                        buttonColor="#5B21B6"
                      >
                        {t('challenges.detail.save')}
                      </Button>
                    </View>
                  </View>
                ) : (
                  <Button
                    mode="contained"
                    onPress={() => {
                      setProgressUpdateMode(true);
                      setNewProgress(String(myProgressDisplay));
                    }}
                    icon="pencil"
                    style={styles.primaryBtn}
                    buttonColor="#5B21B6"
                  >
                    {t('challenges.detail.updateProgress')}
                  </Button>
                )}
              </View>
            ) : isParticipant && userCompleted ? (
              <View style={styles.winCard}>
                <View style={styles.winIconWrap}>
                  <Icon name="trophy-variant" size={36} color="#CA8A04" />
                </View>
                <Text style={styles.winTitle}>{t('challenges.detail.completedTitle')}</Text>
                <Text style={styles.winSub}>{t('challenges.detail.completedBody')}</Text>
                <Text style={styles.winStats}>
                  {myProgressDisplay} / {challenge.goal} {getGoalTypeLabel(challenge.goalType)}
                </Text>
              </View>
            ) : !user ? (
              <View style={styles.ctaCard}>
                <Text style={styles.ctaText}>{t('challenges.detail.signInJoin')}</Text>
              </View>
            ) : (
              <View style={styles.ctaCard}>
                <Text style={styles.ctaText}>
                  {challenge.isPrivate ? t('challenges.detail.privateOnlyInvite') : t('challenges.detail.joinHint')}
                </Text>
                {!challenge.isPrivate && (
                  <Button
                    mode="contained"
                    onPress={async () => {
                      try {
                        await dispatch(joinChallenge(idNum) as any).unwrap();
                        await dispatch(fetchChallengeById(idNum) as any);
                        await dispatch(fetchChallengeParticipants(idNum) as any);
                        Alert.alert(t('common.success'), t('challenges.joinedSuccess'));
                      } catch (e: any) {
                        Alert.alert(t('common.error'), e?.message || t('challenges.detail.joinFailed'));
                      }
                    }}
                    style={styles.primaryBtn}
                    buttonColor="#5B21B6"
                  >
                    {t('challenges.joinChallenge')}
                  </Button>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      )}
      
      {activeTab === 'participants' && (
        <View style={styles.participantsContainer}>
          {participants.length > 0 ? (
            <FlatList
              data={[...participants].sort((a, b) => b.progress - a.progress)}
              renderItem={renderParticipant}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.participantsList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="account-group-outline" size={48} color="#C4B5D4" />
              <Text style={styles.emptyTitle}>{t('challenges.detail.noParticipants')}</Text>
            </View>
          )}
        </View>
      )}

      {activeTab === 'comments' && (
        <View style={styles.commentsContainer}>
          <View style={styles.commentComposer}>
            {user ? (
              <>
                <TextInput
                  label={t('challenges.detail.addComment')}
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  numberOfLines={2}
                  mode="outlined"
                  style={styles.commentInput}
                />
                <Button
                  mode="contained"
                  onPress={addComment}
                  style={styles.addCommentButton}
                  disabled={!newComment.trim() || actionLoading}
                  loading={actionLoading}
                  icon="send"
                  buttonColor="#5B21B6"
                >
                  {t('challenges.detail.post')}
                </Button>
              </>
            ) : (
              <Text style={styles.loginPromptText}>{t('challenges.detail.loginForComments')}</Text>
            )}
          </View>

          {comments.length > 0 ? (
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.commentsList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="forum-outline" size={48} color="#C4B5D4" />
              <Text style={styles.emptyTitle}>{t('challenges.detail.noComments')}</Text>
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
    backgroundColor: '#F4F2F8',
  },
  header: {
    paddingHorizontal: 5,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#1E1033',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.22,
        shadowRadius: 20,
      },
      android: { elevation: 10 },
    }),
  },
  headerToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  headerIconBtn: {
    margin: 0,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 30,
    marginTop: 4,
    paddingHorizontal: 10,
  },
  visibilityRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  visPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  visPillPrivate: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  visPillPublic: {
    backgroundColor: 'rgba(224,242,254,0.95)',
  },
  visPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  visPillTextPrivate: {
    color: '#5B21B6',
  },
  visPillTextPublic: {
    color: '#0369A1',
  },
  segmentWrap: {
    flexDirection: 'row',
    marginTop: 18,
    marginHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  segmentItemActive: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  segmentText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  segmentTextActive: {
    color: '#5B21B6',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  detailsSurface: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(26, 22, 37, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#1E1033',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
      },
      android: { elevation: 3 },
    }),
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statPill: {
    flex: 1,
    minWidth: '28%',
    backgroundColor: '#F8F6FC',
    borderRadius: 16,
    padding: 14,
    alignItems: 'flex-start',
    gap: 6,
  },
  statPillWide: {
    flexGrow: 1,
    minWidth: '100%',
    backgroundColor: '#F8F6FC',
    borderRadius: 16,
    padding: 14,
    alignItems: 'flex-start',
    gap: 6,
  },
  statPillValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1625',
  },
  statPillValueSmall: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1625',
    lineHeight: 20,
  },
  statPillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B6578',
    marginTop: 18,
  },
  metaList: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 22, 37, 0.06)',
    paddingTop: 16,
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  metaKey: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  metaVal: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1625',
    textAlign: 'right',
  },
  sectionHeading: {
    marginTop: 24,
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1625',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  progressSection: {
    marginTop: 14,
  },
  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  progressFraction: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1625',
  },
  progressUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B6578',
  },
  progressPct: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
  },
  progressTrackMain: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#EDE9FE',
    overflow: 'hidden',
    marginTop: 10,
  },
  progressTrackFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#6D28D9',
  },
  rankLine: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#5B21B6',
  },
  editBlock: {
    marginTop: 16,
  },
  progressInput: {
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  updateButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  updateButton: {
    flex: 1,
  },
  primaryBtn: {
    marginTop: 16,
    borderRadius: 14,
  },
  winCard: {
    marginTop: 14,
    alignItems: 'center',
    padding: 22,
    borderRadius: 20,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.35)',
  },
  winIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  winTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#92400E',
    textAlign: 'center',
  },
  winSub: {
    fontSize: 14,
    color: '#B45309',
    textAlign: 'center',
    marginTop: 6,
  },
  winStats: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1625',
  },
  ctaCard: {
    marginTop: 14,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#F8F6FC',
    alignItems: 'center',
    gap: 14,
  },
  ctaText: {
    fontSize: 15,
    color: '#6B6578',
    textAlign: 'center',
    lineHeight: 22,
  },
  participantsContainer: {
    flex: 1,
  },
  participantsList: {
    padding: 20,
    paddingBottom: 40,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 22, 37, 0.06)',
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#1E1033',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  participantRowHighlight: {
    borderColor: 'rgba(109, 40, 217, 0.35)',
    backgroundColor: '#FAF5FF',
  },
  rankAvatar: {},
  firstRankAvatar: { backgroundColor: '#EAB308' },
  secondRankAvatar: { backgroundColor: '#94A3B8' },
  thirdRankAvatar: { backgroundColor: '#D97706' },
  otherRankAvatar: { backgroundColor: '#A78BFA' },
  participantBody: {
    flex: 1,
  },
  participantTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1625',
  },
  youSuffix: {
    fontWeight: '600',
    color: '#7C3AED',
  },
  currentUserText: {
    color: '#5B21B6',
  },
  participantScore: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7C3AED',
  },
  participantTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#EDE9FE',
    marginTop: 8,
    overflow: 'hidden',
  },
  participantTrackFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#6D28D9',
  },
  participantUnit: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  doneBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  commentsContainer: {
    flex: 1,
    padding: 20,
  },
  commentComposer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(26, 22, 37, 0.06)',
  },
  commentInput: {
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  addCommentButton: {
    alignSelf: 'flex-end',
    borderRadius: 12,
  },
  commentsList: {
    paddingBottom: 32,
  },
  commentCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(26, 22, 37, 0.06)',
  },
  currentUserCommentCard: {
    borderColor: 'rgba(109, 40, 217, 0.25)',
    backgroundColor: '#FAF5FF',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUsername: {
    fontWeight: '700',
    fontSize: 14,
    color: '#1A1625',
  },
  commentDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F2F8',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B6578',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F4F2F8',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#6B6578',
    textAlign: 'center',
    marginBottom: 8,
    maxWidth: 280,
    lineHeight: 24,
  },
  backButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 15,
    color: '#6B6578',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 22,
  },
  loginPromptText: {
    fontSize: 14,
    color: '#6B6578',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ChallengeDetailScreen;