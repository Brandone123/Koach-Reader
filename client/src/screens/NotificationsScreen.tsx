import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, Text, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { AppDispatch } from '../store';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Divider, 
  Avatar, 
  IconButton,
  ActivityIndicator,
  Chip
} from 'react-native-paper';
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  selectNotifications, 
  selectNotificationsLoading,
  Notification 
} from '../redux/slices/notificationsSlice';

type NotificationsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Notifications'>;

interface NotificationsScreenProps {
  navigation: NotificationsScreenNavigationProp;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const notifications = useSelector(selectNotifications);
  const isLoading = useSelector(selectNotificationsLoading);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchNotifications());
    setRefreshing(false);
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      dispatch(markNotificationAsRead(notification.id as number));
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'challenge':
        if (notification.data?.challengeId) {
          navigation.navigate('ChallengeDetail', { 
            challengeId: typeof notification.data.challengeId === 'string' 
              ? parseInt(notification.data.challengeId) 
              : notification.data.challengeId 
          });
        }
        break;
      case 'friend':
        navigation.navigate('Profile');
        break;
      case 'achievement':
        navigation.navigate('Badges');
        break;
      case 'reading':
        navigation.navigate('Stats');
        break;
      case 'reminder':
        // If we have book data, navigate to that book
        if (notification.data?.bookId) {
          navigation.navigate('MediaViewer', { 
            bookId: typeof notification.data.bookId === 'string' 
              ? parseInt(notification.data.bookId) 
              : notification.data.bookId,
            mediaType: 'pdf'
          });
        } else {
          navigation.navigate('Home');
        }
        break;
      default:
        // Just mark as read for system notifications
        break;
    }
  };

  const renderNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'challenge':
        return 'trophy';
      case 'friend':
        return 'account-group';
      case 'achievement':
        return 'medal';
      case 'reading':
        return 'book-open-variant';
      case 'reminder':
        return 'alarm';
      case 'system':
      default:
        return 'bell';
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <Card 
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Avatar.Icon 
            size={40} 
            icon={renderNotificationIcon(item.type)} 
            style={{ backgroundColor: !item.read ? '#6200ee' : '#9e9e9e' }} 
          />
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <View style={styles.textContainer}>
          <Title style={styles.title}>{item.title}</Title>
          <Paragraph style={styles.message}>{item.message}</Paragraph>
          <Text style={styles.timestamp}>
            {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconButton icon="bell-off" size={48} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              We'll notify you about important updates and activities
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  notificationCard: {
    marginBottom: 12,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#6200ee',
  },
  cardContent: {
    flexDirection: 'row',
  },
  iconContainer: {
    marginRight: 16,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f50057',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#555',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default NotificationsScreen; 