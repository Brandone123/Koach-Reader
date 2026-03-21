import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Avatar,
  Surface,
  Divider,
  FAB,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { AppDispatch } from '../store';
import {
  fetchGroupById,
  joinGroup,
  leaveGroup,
  selectCurrentGroup,
  selectGroupLoading,
  selectGroupMembers,
  selectGroupDiscussions,
} from '../slices/readingGroupsSlice';
import { selectUser } from '../slices/authSlice';

type GroupDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GroupDetail'>;
type GroupDetailScreenRouteProp = RouteProp<RootStackParamList, 'GroupDetail'>;

interface GroupDetailScreenProps {
  navigation: GroupDetailScreenNavigationProp;
  route: GroupDetailScreenRouteProp;
}

const ReadingGroupDetailScreen: React.FC<GroupDetailScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { groupId } = route.params;
  
  const group = useSelector(selectCurrentGroup);
  const members = useSelector(selectGroupMembers);
  const discussions = useSelector(selectGroupDiscussions);
  const isLoading = useSelector(selectGroupLoading);
  const user = useSelector(selectUser);
  
  const [isJoining, setIsJoining] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    dispatch(fetchGroupById(groupId));
  }, [dispatch, groupId]);

  useEffect(() => {
    if (members && user) {
      setIsMember(members.some(member => member.user_id === user.id));
    }
  }, [members, user]);

  const handleJoinGroup = async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('auth.loginRequired'));
      return;
    }

    setIsJoining(true);
    try {
      if (isMember) {
        await dispatch(leaveGroup(groupId));
        Alert.alert(t('common.success'), t('groups.leftGroup'));
      } else {
        await dispatch(joinGroup(groupId));
        Alert.alert(t('common.success'), t('groups.joinedGroup'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('common.somethingWentWrong'));
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading || !group) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A2BE2" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header avec image de couverture */}
        <View style={styles.headerContainer}>
          <Image
            source={{
              uri: group.cover_image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop&q=80'
            }}
            style={styles.coverImage}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
            style={styles.headerOverlay}
          >
            <View style={styles.headerContent}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupDescription}>{group.description}</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="account-group" size={20} color="white" />
                  <Text style={styles.statText}>
                    {group.member_count?.[0]?.count || 0} {t('groups.members')}
                  </Text>
                </View>
                {group.current_book && (
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="book-open" size={20} color="white" />
                    <Text style={styles.statText}>{group.current_book}</Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Informations du groupe */}
        <Surface style={styles.infoCard} elevation={2}>
          <Title>{t('groups.aboutGroup')}</Title>
          <Paragraph>{group.description}</Paragraph>
          
          {group.rules && (
            <>
              <Divider style={styles.divider} />
              <Title>{t('groups.rules')}</Title>
              <Paragraph>{group.rules}</Paragraph>
            </>
          )}
          
          <Divider style={styles.divider} />
          <View style={styles.tagsContainer}>
            {group.tags?.map((tag, index) => (
              <Chip key={index} style={styles.tag} textStyle={styles.tagText}>
                {tag}
              </Chip>
            ))}
          </View>
        </Surface>

        {/* Membres récents */}
        <Surface style={styles.membersCard} elevation={2}>
          <View style={styles.cardHeader}>
            <Title>{t('groups.members')} ({members?.length || 0})</Title>
            <Button
              mode="text"
              onPress={() => navigation.navigate('GroupMembers', { groupId })}
              compact
            >
              {t('common.viewAll')}
            </Button>
          </View>
          
          <View style={styles.membersList}>
            {members?.slice(0, 6).map((member, index) => (
              <TouchableOpacity key={member.id} style={styles.memberItem}>
                <Avatar.Image
                  size={40}
                  source={{ uri: member.avatar_url || 'https://via.placeholder.com/40' }}
                />
                <Text style={styles.memberName} numberOfLines={1}>
                  {member.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Surface>

        {/* Discussions récentes */}
        <Surface style={styles.discussionsCard} elevation={2}>
          <View style={styles.cardHeader}>
            <Title>{t('groups.discussions')}</Title>
            <Button
              mode="text"
              onPress={() => navigation.navigate('GroupDiscussions', { groupId })}
              compact
            >
              {t('common.viewAll')}
            </Button>
          </View>
          
          {discussions?.slice(0, 3).map((discussion) => (
            <TouchableOpacity
              key={discussion.id}
              style={styles.discussionItem}
              onPress={() => navigation.navigate('Discussion', { discussionId: discussion.id })}
            >
              <View style={styles.discussionHeader}>
                <Text style={styles.discussionTitle} numberOfLines={2}>
                  {discussion.title}
                </Text>
                <Text style={styles.discussionTime}>
                  {new Date(discussion.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.discussionPreview} numberOfLines={2}>
                {discussion.content}
              </Text>
              <View style={styles.discussionFooter}>
                <Text style={styles.discussionAuthor}>
                  {t('common.by')} {discussion.author?.name}
                </Text>
                <View style={styles.discussionStats}>
                  <MaterialCommunityIcons name="message-reply" size={14} color="#666" />
                  <Text style={styles.discussionReplies}>
                    {discussion.replies_count || 0}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </Surface>
      </ScrollView>

      {/* Bouton d'action flottant */}
      <FAB
        style={[styles.fab, { backgroundColor: isMember ? '#E74C3C' : '#8A2BE2' }]}
        icon={isMember ? "exit-to-app" : "account-plus"}
        onPress={handleJoinGroup}
        loading={isJoining}
        label={isMember ? t('groups.leave') : t('groups.join')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
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
  headerContainer: {
    height: 250,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    padding: 20,
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  groupName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  infoCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  divider: {
    marginVertical: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#E3F2FD',
  },
  tagText: {
    color: '#1976D2',
  },
  membersCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  membersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  memberItem: {
    alignItems: 'center',
    width: 60,
  },
  memberName: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    color: '#333',
  },
  discussionsCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  discussionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  discussionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  discussionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  discussionTime: {
    fontSize: 12,
    color: '#666',
  },
  discussionPreview: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  discussionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discussionAuthor: {
    fontSize: 12,
    color: '#8A2BE2',
    fontWeight: '500',
  },
  discussionStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discussionReplies: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default ReadingGroupDetailScreen;
