import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Share,
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

interface CommunityDetailScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'CommunityDetail'>;
  route: RouteProp<RootStackParamList, 'CommunityDetail'>;
}

const CommunityDetailScreen: React.FC<CommunityDetailScreenProps> = ({ navigation, route }) => {
  const { communityId } = route.params;
  const { t } = useTranslation();
  const theme = useTheme();
  const [community, setCommunity] = useState<any>(null);
  const [isJoined, setIsJoined] = useState(false);

  // Données détaillées pour chaque communauté
  const getCommunityData = (id: number) => {
    const communities: any = {
      1: {
        id: 1,
        name: "MILIS Community",
        description: "MILIS (Milestones in Life & Scripture) est une communauté dédiée à l'exploration des étapes importantes de la vie à travers les Écritures.",
        memberCount: 1250,
        backgroundImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&q=80",
        category: "Spiritual Growth",
      },
      2: {
        id: 2,
        name: "ICC Community",
        description: "Impact Centre Chrétien est une communauté dynamique axée sur l'impact positif dans la société.",
        memberCount: 890,
        backgroundImage: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&h=400&fit=crop&q=80",
        category: "Christian Impact",
      },
      3: {
        id: 3,
        name: "Compassion Community",
        description: "Église La Compassion rassemble une communauté bienveillante centrée sur l'amour du Christ.",
        memberCount: 2100,
        backgroundImage: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=400&fit=crop&q=80",
        category: "Church Community",
      },
      4: {
        id: 4,
        name: "O-Livre Community",
        description: "O-Livre est la première librairie chrétienne en ligne francophone.",
        memberCount: 1680,
        backgroundImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop&q=80",
        category: "Christian Literature",
      }
    };
    
    return communities[id] || communities[1];
  };

  useEffect(() => {
    const communityData = getCommunityData(communityId);
    setCommunity(communityData);
  }, [communityId]);

  const handleJoinCommunity = () => {
    setIsJoined(!isJoined);
  };

  if (!community) {
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
        <Image source={{ uri: community.backgroundImage }} style={styles.headerImage} />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
          style={styles.headerOverlay}
        >
          <View style={styles.headerContent}>
            <Text style={styles.communityName}>{community.name}</Text>
            <Text style={styles.communityDescription}>{community.description}</Text>
            <View style={styles.memberInfo}>
              <MaterialCommunityIcons name="account-group" size={20} color="white" />
              <Text style={styles.memberCount}>{community.memberCount} membres</Text>
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
            onPress={handleJoinCommunity}
            style={[styles.joinButton, isJoined && styles.joinedButton]}
            icon={isJoined ? "check" : "plus"}
          >
            {isJoined ? "Membre" : "Rejoindre la communauté"}
          </Button>
        </Surface>

        {/* Livre en cours */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Livre du moment</Title>
          <Card style={styles.bookCard}>
            <View style={styles.bookContent}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=300&fit=crop' }}
                style={styles.bookCover}
              />
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>Purpose Driven Life</Text>
                <Text style={styles.bookAuthor}>Rick Warren</Text>
                <ProgressBar progress={0.65} color="#8A2BE2" style={styles.progressBar} />
                <Text style={styles.progressText}>65% complété</Text>
                <Button
                  mode="contained"
                  style={styles.readButton}
                  onPress={() => navigation.navigate('BookDetail', { bookId: '1' })}
                >
                  Lire maintenant
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
  communityName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  communityDescription: {
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

export default CommunityDetailScreen;


