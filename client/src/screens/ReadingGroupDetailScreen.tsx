import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {
  Button,
  Card,
  Title,
  Avatar,
  Chip,
  Surface,
  ProgressBar,
  useTheme,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

interface ReadingGroupDetailScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'GroupDetail'>;
  route: RouteProp<RootStackParamList, 'GroupDetail'>;
}

const ReadingGroupDetailScreen: React.FC<ReadingGroupDetailScreenProps> = ({ navigation, route }) => {
  const { groupId } = route.params;
  const { t } = useTranslation();
  const theme = useTheme();
  const [group, setGroup] = useState<any>(null);
  const [isJoined, setIsJoined] = useState(false);

  // Données détaillées pour chaque groupe
  const getGroupData = (id: number) => {
    const groups: any = {
      1: {
        id: 1,
        name: "Bible Study Circle",
        description: "Étude approfondie des Écritures avec une communauté bienveillante",
        memberCount: 45,
        backgroundImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&q=80",
        currentBook: "Évangile selon Jean",
        progress: 0.75,
      },
      2: {
        id: 2,
        name: "Christian Fiction Lovers",
        description: "Découverte des meilleurs romans chrétiens contemporains",
        memberCount: 32,
        backgroundImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop&q=80",
        currentBook: "La Cabane",
        progress: 0.45,
      },
      3: {
        id: 3,
        name: "Theology Deep Dive",
        description: "Théologie systématique pour approfondir sa foi",
        memberCount: 28,
        backgroundImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=400&fit=crop&q=80",
        currentBook: "Théologie Systématique",
        progress: 0.30,
      },
      4: {
        id: 4,
        name: "Youth Ministry Books",
        description: "Ressources et outils pour le ministère auprès des jeunes",
        memberCount: 67,
        backgroundImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop&q=80",
        currentBook: "Ministère Jeunesse Efficace",
        progress: 0.60,
      }
    };
    
    return groups[id] || groups[1];
  };

  useEffect(() => {
    const groupData = getGroupData(groupId);
    setGroup(groupData);
  }, [groupId]);

  const handleJoinGroup = () => {
    setIsJoined(!isJoined);
  };

  if (!group) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header avec image */}
      <View style={styles.header}>
        <Image source={{ uri: group.backgroundImage }} style={styles.headerImage} />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
          style={styles.headerOverlay}
        >
          <View style={styles.headerContent}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupDescription}>{group.description}</Text>
            <View style={styles.memberInfo}>
              <MaterialCommunityIcons name="account-group" size={20} color="white" />
              <Text style={styles.memberCount}>{group.memberCount} membres</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        {/* Action Button */}
        <Surface style={styles.actionSection} elevation={2}>
          <Button
            mode={isJoined ? "outlined" : "contained"}
            onPress={handleJoinGroup}
            style={[styles.joinButton, isJoined && styles.joinedButton]}
            icon={isJoined ? "check" : "plus"}
          >
            {isJoined ? "Membre" : "Rejoindre le groupe"}
          </Button>
        </Surface>

        {/* Livre en cours */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Lecture en cours</Title>
          <Card style={styles.bookCard}>
            <View style={styles.bookContent}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=300&fit=crop' }}
                style={styles.bookCover}
              />
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>{group.currentBook}</Text>
                <Text style={styles.bookAuthor}>Lecture de groupe</Text>
                <ProgressBar progress={group.progress} color="#8A2BE2" style={styles.progressBar} />
                <Text style={styles.progressText}>{Math.round(group.progress * 100)}% complété</Text>
                <Button
                  mode="contained"
                  style={styles.readButton}
                  onPress={() => navigation.navigate('BookDetail', { bookId: '1' })}
                >
                  Rejoindre la lecture
                </Button>
              </View>
            </View>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 250,
    position: 'relative',
  },
  headerImage: {
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
    marginBottom: 12,
    lineHeight: 22,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCount: {
    fontSize: 14,
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  actionSection: {
    padding: 16,
    marginBottom: 20,
    borderRadius: 12,
  },
  joinButton: {
    paddingVertical: 8,
  },
  joinedButton: {
    borderColor: '#8A2BE2',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  bookCard: {
    borderRadius: 12,
  },
  bookContent: {
    flexDirection: 'row',
    padding: 16,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 16,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  readButton: {
    alignSelf: 'flex-start',
  },
});

export default ReadingGroupDetailScreen;

