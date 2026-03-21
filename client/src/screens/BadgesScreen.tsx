import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const BadgesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [selectedBadge, setSelectedBadge] = useState<any>(null);

  const badges = [
    { 
      id: 1, 
      name: 'Baobab de Sagesse', 
      icon: '🌳', 
      earned: true,
      description: 'Symbole de sagesse et de longévité en Afrique',
      howToEarn: 'Lire 50 livres de philosophie africaine',
      points: 500
    },
    { 
      id: 2, 
      name: 'Griot Moderne', 
      icon: '🎭', 
      earned: true,
      description: 'Gardien des traditions orales africaines',
      howToEarn: 'Partager 25 histoires avec la communauté',
      points: 300
    },
    { 
      id: 3, 
      name: 'Explorateur du Sahel', 
      icon: '🏜️', 
      earned: false,
      description: 'Découvreur des richesses du Sahel',
      howToEarn: 'Lire 30 livres sur l\'histoire du Sahel',
      points: 400
    },
    { 
      id: 4, 
      name: 'Gardien des Traditions', 
      icon: '👑', 
      earned: true,
      description: 'Protecteur du patrimoine culturel africain',
      howToEarn: 'Compléter la collection "Traditions Africaines"',
      points: 600
    },
    { 
      id: 5, 
      name: 'Conteur des Savanes', 
      icon: '🦁', 
      earned: false,
      description: 'Maître des récits de la savane',
      howToEarn: 'Lire 40 contes et légendes africaines',
      points: 350
    },
    { 
      id: 6, 
      name: 'Sage du Kilimandjaro', 
      icon: '⛰️', 
      earned: false,
      description: 'Atteindre les sommets de la connaissance',
      howToEarn: 'Maintenir une série de lecture de 100 jours',
      points: 800
    },
    { 
      id: 7, 
      name: 'Djembé Rythmé', 
      icon: '🥁', 
      earned: true,
      description: 'En harmonie avec les rythmes africains',
      howToEarn: 'Lire 20 livres sur la musique africaine',
      points: 250
    },
    { 
      id: 8, 
      name: 'Tisserand de Mots', 
      icon: '🧵', 
      earned: false,
      description: 'Artisan des belles lettres africaines',
      howToEarn: 'Écrire 10 critiques de livres africains',
      points: 200
    },
  ];

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const earnedBadges = badges.filter(badge => badge.earned);
  const lockedBadges = badges.filter(badge => !badge.earned);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8A2BE2" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.badges')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Badges obtenus */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('badges.earned')} ({earnedBadges.length}/{badges.length})
          </Text>
          <View style={styles.badgesGrid}>
            {earnedBadges.map((badge) => (
              <TouchableOpacity 
                key={badge.id}
                style={styles.badgeItem}
                onPress={() => setSelectedBadge(badge)}
              >
                <View style={styles.badgeCircle}>
                  <Text style={styles.badgeEmoji}>{badge.icon}</Text>
                </View>
                <Text style={styles.badgeName}>{badge.name}</Text>
                <Text style={styles.badgePoints}>+{badge.points} pts</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Badges à débloquer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('badges.locked')}</Text>
          <View style={styles.badgesGrid}>
            {lockedBadges.map((badge) => (
              <TouchableOpacity 
                key={badge.id}
                style={[styles.badgeItem, styles.badgeItemLocked]}
                onPress={() => setSelectedBadge(badge)}
              >
                <View style={[styles.badgeCircle, styles.badgeCircleLocked]}>
                  <Text style={[styles.badgeEmoji, styles.badgeEmojiLocked]}>
                    {badge.icon}
                  </Text>
                </View>
                <Text style={[styles.badgeName, styles.badgeNameLocked]}>
                  {badge.name}
                </Text>
                <Text style={styles.badgePoints}>+{badge.points} pts</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Modal Badge Detail */}
      <Modal
        visible={!!selectedBadge}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.badgeModal}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedBadge(null)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            
            {selectedBadge && (
              <>
                <View style={[
                  styles.badgeModalCircle,
                  !selectedBadge.earned && styles.badgeModalCircleLocked
                ]}>
                  <Text style={[
                    styles.badgeModalIcon,
                    !selectedBadge.earned && styles.badgeModalIconLocked
                  ]}>
                    {selectedBadge.icon}
                  </Text>
                </View>
                
                <Text style={styles.badgeModalName}>{selectedBadge.name}</Text>
                <Text style={styles.badgeModalPoints}>+{selectedBadge.points} points</Text>
                
                <Text style={styles.badgeModalDescription}>
                  {selectedBadge.description}
                </Text>
                
                <View style={styles.howToEarnSection}>
                  <Text style={styles.howToEarnTitle}>
                    {selectedBadge.earned ? t('badges.earned') : t('badges.howToEarn')}
                  </Text>
                  <Text style={styles.howToEarnText}>
                    {selectedBadge.howToEarn}
                  </Text>
                </View>
                
                {selectedBadge.earned && (
                  <View style={styles.earnedBadge}>
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    <Text style={styles.earnedText}>{t('badges.completed')}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 20,
    backgroundColor: '#8A2BE2',
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeItemLocked: {
    backgroundColor: '#f8f8f8',
  },
  badgeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeCircleLocked: {
    backgroundColor: '#ccc',
  },
  badgeEmoji: {
    fontSize: 30,
  },
  badgeEmojiLocked: {
    opacity: 0.5,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  badgeNameLocked: {
    color: '#999',
  },
  badgePoints: {
    fontSize: 12,
    color: '#8A2BE2',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeModal: {
    backgroundColor: '#fff',
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
  badgeModalCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeModalCircleLocked: {
    backgroundColor: '#ccc',
  },
  badgeModalIcon: {
    fontSize: 50,
  },
  badgeModalIconLocked: {
    opacity: 0.5,
  },
  badgeModalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  badgeModalPoints: {
    fontSize: 16,
    color: '#8A2BE2',
    fontWeight: '600',
    marginBottom: 20,
  },
  badgeModalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  howToEarnSection: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    marginBottom: 20,
  },
  howToEarnTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  howToEarnText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  earnedText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default BadgesScreen;
