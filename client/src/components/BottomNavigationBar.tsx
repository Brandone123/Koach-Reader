import React, { useState } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { BottomNavigation, Text, Badge, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { selectUser } from '../slices/authSlice';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface BottomBarProps {
  hideForRoutes?: string[];
}

const BottomNavigationBar: React.FC<BottomBarProps> = ({ hideForRoutes = ['Onboarding'] }) => {
  const [index, setIndex] = useState(2); // Home index par défaut
  const navigation = useNavigation<NavigationProp>();
  const user = useSelector(selectUser);
  
  // Le contrôle d'affichage est maintenant géré par le composant parent
  
  const isPremium = user?.isPremium || false;

  const routes = [
    { key: 'leaderboard', title: 'Leaderboard', icon: 'trophy-award', color: '#FFC107' },
    { key: 'challenges', title: 'Challenges', icon: 'flag-checkered', color: '#FF6B6B' },
    { key: 'home', title: 'Home', icon: 'home', color: '#8A2BE2' },
    { key: 'profile', title: 'Profile', icon: 'account-circle', color: '#2980B9' },
    { key: 'stats', title: 'Stats', icon: 'chart-line', color: '#00CEC9' },
  ];

  // Define empty component for each scene
  const LeaderboardScene = () => null;
  const ChallengesScene = () => null;
  const HomeScene = () => null;
  const ProfileScene = () => null;
  const StatsScene = () => null;
  
  // Map the components to keys
  const renderScene = BottomNavigation.SceneMap({
    leaderboard: LeaderboardScene,
    challenges: ChallengesScene,
    home: HomeScene,
    profile: ProfileScene,
    stats: StatsScene,
  });

  const handleIndexChange = (newIndex: number) => {
    setIndex(newIndex);
    
    switch (routes[newIndex].key) {
      case 'leaderboard':
        navigation.navigate('Leaderboard');
        break;
      case 'challenges':
        navigation.navigate('Challenges');
        break;
      case 'home':
        navigation.navigate('Home');
        break;
      case 'profile':
        navigation.navigate('Profile');
        break;
      case 'stats':
        navigation.navigate('Stats');
        break;
    }
  };

  // Gérer le clic sur le bouton d'ajout de livre
  const handleAddBook = () => {
    if (isPremium) {
      navigation.navigate('ReadingPlan', {});
    } else {
      // Rediriger vers une page demandant à l'utilisateur de devenir premium
      // À implémenter plus tard: navigation.navigate('PremiumPlans');
      alert('Cette fonctionnalité est réservée aux utilisateurs premium');
    }
  };

  return (
    <View style={styles.container}>
      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={handleIndexChange}
        renderScene={renderScene}
        shifting={true}
        labeled={true}
        activeColor="#FFFFFF"
        inactiveColor="rgba(255,255,255,0.7)"
        sceneAnimationEnabled={true}
        barStyle={styles.bar}
        theme={{
          colors: {
            secondaryContainer: 'transparent',
          }
        }}
      />
      <TouchableOpacity 
        style={styles.fabContainer}
        onPress={handleAddBook}
      >
        <View style={styles.fab}>
          <MaterialCommunityIcons name="plus-circle" size={56} color="#8A2BE2" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  bar: {
    backgroundColor: '#8A2BE2',
    height: Platform.OS === 'ios' ? 80 : 64,
    paddingBottom: Platform.OS === 'ios' ? 30 : 0,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  fabContainer: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: Platform.OS === 'ios' ? 60 : 44,
    zIndex: 1000,
  },
  fab: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default BottomNavigationBar; 