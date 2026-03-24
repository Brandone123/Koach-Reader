import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectUser } from '../slices/authSlice';

const AchievementsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);

  const user = useSelector(selectUser);

  const personalRecords: { id: number; icon: string; points: number | string; title: string; date: string; unit?: string }[] = [
    { id: 1, icon: '🔥', points: 388, title: 'Série record', date: '9 août 2025', unit: 'jours' },
    { id: 2, icon: '🏆', points: '#10', title: 'Chez les pros', date: '26 nov. 2024', unit: 'rang' },
    { id: 3, icon: '📚', points: 150, title: 'Max lecture', date: '15 oct. 2024', unit: 'pages' },
  ];

  // Distinctions liées à la lecture
  const distinctions = [
    { 
      id: 1, 
      icon: '📖', 
      points: 100, 
      title: 'Premier Livre', 
      progress: `${Math.min(user?.books_completed || 0, 1)} sur 1`, 
      isNew: (user?.books_completed || 0) >= 1,
      description: 'Félicitations ! Tu as terminé ton premier livre sur Koach. C\'est le début d\'une belle aventure de lecture !',
      completed: (user?.books_completed || 0) >= 1
    },
    { 
      id: 2, 
      icon: '🔥', 
      points: 150, 
      title: 'Lecteur Assidu', 
      progress: `${Math.min(user?.reading_streak || 0, 7)} sur 7`, 
      isNew: (user?.reading_streak || 0) >= 7,
      description: 'Incroyable ! Tu as maintenu une série de lecture de 7 jours. Ton habitude de lecture se renforce !',
      completed: (user?.reading_streak || 0) >= 7
    },
    { 
      id: 3, 
      icon: '📚', 
      points: 250, 
      title: 'Bibliophile', 
      progress: `${Math.min(user?.books_completed || 0, 10)} sur 10`, 
      isNew: (user?.books_completed || 0) >= 10,
      description: 'Wow ! Tu as terminé 10 livres sur Koach. Tu es officiellement un passionné de lecture !',
      completed: (user?.books_completed || 0) >= 10
    },
    { 
      id: 4, 
      icon: '⚡', 
      points: 200, 
      title: 'Lecteur Express', 
      progress: '3 sur 5', 
      isNew: false,
      description: 'Tu as lu plus de 50 pages en une seule session. Ta vitesse de lecture est impressionnante !',
      completed: false
    },
    { 
      id: 5, 
      icon: '🌟', 
      points: 300, 
      title: 'Maître Koach', 
      progress: `${Math.min(Math.floor((user?.koach_points || 0) / 100), 10)} sur 10`, 
      isNew: (user?.koach_points || 0) >= 1000,
      description: 'Exceptionnel ! Tu as accumulé 1000 points Koach. Tu es un véritable maître de la lecture !',
      completed: (user?.koach_points || 0) >= 1000
    },
    { 
      id: 6, 
      icon: '🎯', 
      points: 180, 
      title: 'Planificateur', 
      progress: '2 sur 3', 
      isNew: false,
      description: 'Bravo ! Tu respectes tes plans de lecture et atteins tes objectifs dans les temps.',
      completed: false
    },
    { 
      id: 7, 
      icon: '🏆', 
      points: 400, 
      title: 'Champion Lecteur', 
      progress: `${Math.min(user?.reading_streak || 0, 30)} sur 30`, 
      isNew: (user?.reading_streak || 0) >= 30,
      description: 'Extraordinaire ! 30 jours de lecture consécutifs. Tu es un véritable champion de la lecture !',
      completed: (user?.reading_streak || 0) >= 30
    },
    { 
      id: 8, 
      icon: '📝', 
      points: 120, 
      title: 'Critique Littéraire', 
      progress: '1 sur 5', 
      isNew: false,
      description: 'Tu as écrit 5 avis sur des livres. Tes critiques aident la communauté Koach !',
      completed: false
    },
  ];

   useEffect(() => {
      navigation.setOptions({
        headerShown: false,
      });
    }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8A2BE2" />
      
      {/* Header personnalisé */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Succès</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Records personnels */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Records personnels</Text>
          <View style={styles.recordsGrid}>
            {personalRecords.map((record) => (
              <TouchableOpacity 
                key={record.id}
                style={styles.recordCard}
                onPress={() => setSelectedAchievement({
                  ...record,
                  description: `Ton record personnel : ${record.points} ${record.unit} ! Continue à lire pour battre ce record et gagner encore plus de points Koach.`,
                  type: 'record'
                })}
              >
                <Text style={styles.recordIcon}>{record.icon}</Text>
                <Text style={styles.recordNumber}>{record.points}</Text>
                <Text style={styles.recordUnit}>{record.unit}</Text>
                <Text style={styles.recordLabel}>{record.title}</Text>
                <Text style={styles.recordDate}>{record.date}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Distinctions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges de lecture</Text>
          <View style={styles.distinctionsGrid}>
            {distinctions.map((distinction) => (
              <TouchableOpacity 
                key={distinction.id}
                style={[
                  styles.distinctionCard,
                  distinction.completed && styles.completedCard
                ]}
                onPress={() => setSelectedAchievement({
                  ...distinction,
                  type: 'distinction'
                })}
              >
                {distinction.isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NOUVEAU</Text>
                  </View>
                )}
                {distinction.completed && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  </View>
                )}
                <Text style={[
                  styles.distinctionIcon,
                  !distinction.completed && styles.lockedIcon
                ]}>{distinction.icon}</Text>
                <Text style={[
                  styles.distinctionPoints,
                  distinction.completed && styles.completedPoints
                ]}>+{distinction.points}</Text>
                <Text style={[
                  styles.distinctionTitle,
                  !distinction.completed && styles.lockedTitle
                ]}>{distinction.title}</Text>
                <Text style={styles.distinctionProgress}>{distinction.progress}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Prochains objectifs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prochains objectifs</Text>
          <View style={styles.objectivesList}>
            <View style={styles.objectiveItem}>
              <Text style={styles.objectiveIcon}>🏃</Text>
              <View style={styles.objectiveContent}>
                <Text style={styles.objectiveTitle}>Marathonien de lecture</Text>
                <Text style={styles.objectiveDescription}>Lis pendant 30 jours consécutifs</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(((user?.reading_streak || 0) / 30) * 100, 100)}%` }]} />
                </View>
                <Text style={styles.progressText}>{user?.reading_streak || 0}/30 jours</Text>
              </View>
              <Text style={styles.objectiveReward}>+500 pts</Text>
            </View>

            <View style={styles.objectiveItem}>
              <Text style={styles.objectiveIcon}>📖</Text>
              <View style={styles.objectiveContent}>
                <Text style={styles.objectiveTitle}>Grand Lecteur</Text>
                <Text style={styles.objectiveDescription}>Termine 25 livres</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(((user?.books_completed || 0) / 25) * 100, 100)}%` }]} />
                </View>
                <Text style={styles.progressText}>{user?.books_completed || 0}/25 livres</Text>
              </View>
              <Text style={styles.objectiveReward}>+750 pts</Text>
            </View>

            <View style={styles.objectiveItem}>
              <Text style={styles.objectiveIcon}>💎</Text>
              <View style={styles.objectiveContent}>
                <Text style={styles.objectiveTitle}>Collectionneur Koach</Text>
                <Text style={styles.objectiveDescription}>Accumule 2500 points Koach</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(((user?.koach_points || 0) / 2500) * 100, 100)}%` }]} />
                </View>
                <Text style={styles.progressText}>{user?.koach_points || 0}/2500 points</Text>
              </View>
              <Text style={styles.objectiveReward}>+1000 pts</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal Achievement Detail */}
      <Modal
        visible={!!selectedAchievement}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedAchievement(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.achievementModal}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedAchievement(null)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            
            {selectedAchievement && (
              <>
                <View style={styles.achievementIconContainer}>
                  <View style={styles.iconBackground}>
                    <Text style={styles.achievementModalIcon}>{selectedAchievement.icon}</Text>
                  </View>
                  {selectedAchievement.completed && (
                    <View style={styles.completedIndicator}>
                      <Ionicons name="checkmark-circle" size={30} color="#4CAF50" />
                    </View>
                  )}
                </View>
                
                <Text style={styles.achievementModalTitle}>{selectedAchievement.title}</Text>
                
                {selectedAchievement.type === 'distinction' && (
                  <Text style={[
                    styles.achievementModalPoints,
                    selectedAchievement.completed ? styles.earnedPoints : styles.pendingPoints
                  ]}>
                    {selectedAchievement.completed ? 'Gagné : ' : 'Récompense : '}
                    +{selectedAchievement.points} points Koach
                  </Text>
                )}
                
                {selectedAchievement.type === 'record' && (
                  <Text style={styles.achievementModalRecord}>
                    {selectedAchievement.points} {selectedAchievement.unit ?? ''}
                  </Text>
                )}
                
                {selectedAchievement.progress && (
                  <Text style={styles.achievementModalProgress}>
                    Progression : {selectedAchievement.progress}
                  </Text>
                )}
                
                <Text style={styles.achievementModalDate}>
                  {selectedAchievement.date || new Date().toLocaleDateString('fr-FR')}
                </Text>
                
                <Text style={styles.achievementModalDescription}>
                  {selectedAchievement.description}
                </Text>
                
                <TouchableOpacity 
                  style={[
                    styles.rewardButton,
                    selectedAchievement.completed ? styles.shareButton : styles.motivationButton
                  ]}
                  onPress={() => setSelectedAchievement(null)}
                >
                  <Text style={styles.rewardButtonText}>
                    {selectedAchievement.completed ? 'Partager ce succès' : 'Continue à lire !'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#8A2BE2',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  recordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recordCard: {
    width: '48%',
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recordIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  recordNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  recordUnit: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  recordLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
    fontWeight: '500',
  },
  recordDate: {
    fontSize: 12,
    color: '#999',
  },
  distinctionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  distinctionCard: {
    width: '48%',
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  completedCard: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  newBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  distinctionIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  distinctionPoints: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  distinctionTitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
    fontWeight: '500',
  },
  distinctionProgress: {
    fontSize: 12,
    color: '#8A2BE2',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementModal: {
    backgroundColor: '#2C3E50',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '85%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  achievementIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  achievementModalIcon: {
    fontSize: 80,
    marginBottom: 10,
  },
  achievementModalPoints: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  achievementModalDate: {
    fontSize: 16,
    color: '#F39C12',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  achievementModalDescription: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  rewardButton: {
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  rewardButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  completedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
  },
  lockedIcon: {
    opacity: 0.5,
  },
  lockedTitle: {
    opacity: 0.6,
  },
  completedPoints: {
    color: '#4CAF50',
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  completedIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 15,
  },
  achievementModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  achievementModalPointsSmall: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  earnedPoints: {
    color: '#4CAF50',
  },
  pendingPoints: {
    color: '#F39C12',
  },
  achievementModalRecord: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8A2BE2',
    marginBottom: 8,
    textAlign: 'center',
  },
  achievementModalProgress: {
    fontSize: 16,
    color: '#E0E0E0',
    marginBottom: 8,
    textAlign: 'center',
  },
  shareButton: {
    backgroundColor: '#4CAF50',
  },
  motivationButton: {
    backgroundColor: '#8A2BE2',
  },
  objectivesList: {
    flexDirection: 'column',
    gap: 10,
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  objectiveIcon: {
    fontSize: 30,
    marginRight: 15,
    color: '#8A2BE2',
  },
  objectiveContent: {
    flex: 1,
  },
  objectiveTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  objectiveDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8A2BE2',
  },
  progressText: {
    fontSize: 14,
    color: '#333',
  },
  objectiveReward: {
    fontSize: 16,
    color: '#8A2BE2',
    fontWeight: 'bold',
  },
});

export default AchievementsScreen;

