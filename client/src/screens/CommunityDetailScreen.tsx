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
  fetchCommunityById,
  joinCommunity,
  leaveCommunity,
  selectCurrentCommunity,
  selectCommunityLoading,
  selectCommunityMembers,
  selectCommunityPosts,
} from '../slices/communitiesSlice';
import { selectUser } from '../slices/authSlice';

type CommunityDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CommunityDetail'>;
type CommunityDetailScreenRouteProp = RouteProp<RootStackParamList, 'CommunityDetail'>;

interface CommunityDetailScreenProps {
  navigation: CommunityDetailScreenNavigationProp;
  route: CommunityDetailScreenRouteProp;
}

const CommunityDetailScreen: React.FC<CommunityDetailScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { communityId } = route.params;
  
  const community = useSelector(selectCurrentCommunity);
  const members = useSelector(selectCommunityMembers);
  const posts = useSelector(selectCommunityPosts);
  const isLoading = useSelector(selectCommunityLoading);
  const user = useSelector(selectUser);
  
  const [isJoining, setIsJoining] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    dispatch(fetchCommunityById(communityId));
  }, [dispatch, communityId]);

  useEffect(() => {
    if (members && user) {
      setIsMember(members.some(member => member.user_id === user.id));
    }
  }, [members, user]);

  const getCommunityIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'spiritual growth':
        return "book-cross";
      case 'christian impact':
        return "hand-heart";
      case 'church community':
        return "heart-multiple";
      case 'christian literature':
        return "book-open-variant";
      default:
        return "book";
    }
  };

  const getCommunityColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'spiritual growth':
        return "#4A90E2";
      case 'christian impact':
        return "#F39C12";
      case 'church community':
        return "#E74C3C";
      case 'christian literature':
        return "#27AE60";
      default:
        return "#8A2BE2";
    }
  };

  const handleJoinCommunity = async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('auth.loginRequired'));
      return;
    }

    setIsJoining(true);
    try {
      if (isMember) {
        await dispatch(leaveCommunity(communityId));
        Alert.alert(t('common.success'), t('communities.leftCommunity'));
      } else {
        await dispatch(joinCommunity(communityId));
        Alert.alert(t('common.success'), t('communities.joinedCommunity'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('common.somethingWentWrong'));
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading || !community) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A2BE2" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const communityColor = getCommunityColor(community.category);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header avec image de couverture */}
        <View style={styles.headerContainer}>
          <Image
            source={{
              uri: community.cover_image_url || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop&q=80'
            }}
            style={styles.coverImage}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
            style={styles.headerOverlay}
          >
            <View style={styles.headerContent}>
              <View style={styles.communityHeader}>
                <View style={[styles.communityIcon, { backgroundColor: communityColor }]}>
                  <MaterialCommunityIcons 
                    name={getCommunityIcon(community.category)} 
                    size={24} 
                    color="white" 
                  />
                </View>
                {community.category && (
                  <Chip style={[styles.categoryChip, { backgroundColor: communityColor }]}>
                    <Text style={styles.categoryText}>{community.category}</Text>
                  </Chip>
                )}
              </View>
              <Text style={styles.communityName}>{community.name}</Text>
              <Text style={styles.communityDescription}>{community.description}</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="account-group" size={20} color="white" />
                  <Text style={styles.statText}>
                    {community.member_count?.[0]?.count || 0} {t('communities.members')}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="post" size={20} color="white" />
                  <Text style={styles.statText}>
                    {posts?.length || 0} {t('communities.posts')}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Informations de la communauté */}
        <Surface style={styles.infoCard} elevation={2}>
          <Title>{t('communities.aboutCommunity')}</Title>
          <Paragraph>{community.description}</Paragraph>
          
          {community.rules && (
            <>
              <Divider style={styles.divider} />
              <Title>{t('communities.rules')}</Title>
              <Paragraph>{community.rules}</Paragraph>
            </>
          )}
          
          <Divider style={styles.divider} />
          <View style={styles.tagsContainer}>
            {community.tags?.map((tag, index) => (
              <Chip key={index} style={[styles.tag, { backgroundColor: `${communityColor}20` }]}>
                <Text style={[styles.tagText, { color: communityColor }]}>{tag}</Text>
              </Chip>
            ))}
          </View>
        </Surface>

        {/* Membres actifs */}
        <Surface style={styles.membersCard} elevation={2}>
          <View style={styles.cardHeader}>
            <Title>{t('communities.activeMembers')} ({members?.length || 0})</Title>
            <Button
              mode="text"
              onPress={() => navigation.navigate('CommunityMembers', { communityId })}
              compact
            >
              {t('common.viewAll')}
            </Button>
          </View>
          
          <View style={styles.membersList}>
            {members?.slice(0, 8).map((member, index) => (
              <TouchableOpacity key={member.id} style={styles.memberItem}>
                <Avatar.Image
                  size={40}
                  source={{ uri: member.avatar_url || 'https://via.placeholder.com/40' }}
                />
                <Text style={styles.memberName} numberOfLines={1}>
                  {member.name}
                </Text>
                {member.role === 'admin' && (
                  <MaterialCommunityIcons name="crown" size={12} color="#FFD700" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Surface>

        {/* Posts récents */}
        <Surface style={styles.postsCard} elevation={2}>
          <View style={styles.cardHeader}>
            <Title>{t('communities.recentPosts')}</Title>
            <Button
              mode="text"
              onPress={() => navigation.navigate('CommunityPosts', { communityId })}
              compact
            >
              {t('common.viewAll')}
            </Button>
          </View>
          
          {posts?.slice(0, 3).map((post) => (
            <TouchableOpacity
              key={post.id}
              style={styles.postItem}
              onPress={() => navigation.navigate('Post', { postId: post.id })}
            >
              <View style={styles.postHeader}>
                <Avatar.Image
                  size={32}
                  source={{ uri: post.author?.avatar_url || 'https://via.placeholder.com/32' }}
                />
                <View style={styles.postAuthorInfo}>
                  <Text style={styles.postAuthor}>{post.author?.name}</Text>
                  <Text style={styles.postTime}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <Text style={styles.postContent} numberOfLines={3}>
                {post.content}
              </Text>
              <View style={styles.postFooter}>
                <View style={styles.postStats}>
                  <MaterialCommunityIcons name="heart" size={16} color="#E74C3C" />
                  <Text style={styles.postStatText}>{post.likes_count || 0}</Text>
                  <MaterialCommunityIcons name="comment" size={16} color="#666" style={{ marginLeft: 12 }} />
                  <Text style={styles.postStatText}>{post.comments_count || 0}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </Surface>
      </ScrollView>

      {/* Bouton d'action flottant */}
      <FAB
        style={[styles.fab, { backgroundColor: isMember ? '#E74C3C' : communityColor }]}
        icon={isMember ? "exit-to-app" : "account-plus"}
        onPress={handleJoinCommunity}
        loading={isJoining}
        label={isMember ? t('communities.leave') : t('communities.join')}
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
    height: 280,
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
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  communityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 8,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  communityName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  communityDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
    lineHeight: 22,
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
    fontSize: 12,
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
  postsCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  postItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  postAuthorInfo: {
    marginLeft: 8,
    flex: 1,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  postTime: {
    fontSize: 12,
    color: '#666',
  },
  postContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postStatText: {
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

export default CommunityDetailScreen;


