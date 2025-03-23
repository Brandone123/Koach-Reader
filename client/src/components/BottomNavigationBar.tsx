import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { BottomNavigation, Text } from 'react-native-paper';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { selectUser } from '../slices/authSlice';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type IconProps = { color: string; size: number };

const BottomNavigationBar: React.FC = () => {
  const [index, setIndex] = useState(2); // Home index par défaut
  const navigation = useNavigation<NavigationProp>();
  const user = useSelector(selectUser);

  // Utiliser useNavigationState pour vérifier la route actuelle de façon sûre
  const currentRouteName = useNavigationState(
    state => state?.routes[state?.index]?.name
  );
  
  // Ne pas afficher sur l'écran d'onboarding
  if (currentRouteName === 'Onboarding') {
    return null;
  }
  
  const isPremium = user?.isPremium || false;

  // Define empty component for each scene
  const renderEmptyScene = () => null;
  
  // Map the components to keys
  const renderScene = {
    leaderboard: renderEmptyScene,
    challenges: renderEmptyScene,
    home: renderEmptyScene,
    profile: renderEmptyScene,
    stats: renderEmptyScene,
  };

  // Custom render icon function with larger icons and active state indicator
  const renderIcon = ({ route, focused, color }: { route: any; focused: boolean; color: string }) => {
    return (
      <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
        <MaterialCommunityIcons
          name={route.icon}
          size={37}
          color={color}
        />
      </View>
    );
  };

  const routes = [
    { 
      key: 'leaderboard', 
      title: '', 
      icon: 'trophy-award',
    },
    { 
      key: 'challenges', 
      title: '', 
      icon: 'flag-checkered',
    },
    { 
      key: 'home', 
      title: '', 
      icon: 'home',
    },
    { 
      key: 'profile', 
      title: '', 
      icon: 'account-circle',
    },
    { 
      key: 'stats', 
      title: '', 
      icon: 'chart-line',
    },
  ];

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
    navigation.navigate('ReadingPlan', {});
  };

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        <BottomNavigation
          navigationState={{ index, routes }}
          onIndexChange={handleIndexChange}
          renderScene={BottomNavigation.SceneMap(renderScene)}
          barStyle={styles.bar}
          activeColor="#FFFFFF"
          inactiveColor="rgba(255,255,255,0.7)"
          labeled={false}
          shifting={false}
          renderIcon={renderIcon}
          sceneAnimationType="opacity"
          sceneAnimationEnabled={true}
          theme={{
            colors: {
              secondaryContainer: 'transparent',
            }
          }}
        />
        {/* <TouchableOpacity 
          style={styles.fabContainer}
          onPress={handleAddBook}
        >
          <View style={styles.fab}>
            <MaterialCommunityIcons name="plus" size={30} color="#FFFFFF" />
          </View>
        </TouchableOpacity> */}
      </View>
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
  barContainer: {
    position: 'relative',
  },
  bar: {
    backgroundColor: '#8A2BE2',
    height: 70,
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
    bottom: 30,
    zIndex: 1000,
  },
  fab: {
    backgroundColor: '#FF6B6B',
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
  },
  iconContainer: {
    width: 35,
    height: 35,
    bottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconContainer: {
    width: 55,
    height: 55,
    bottom: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 15,
    backgroundColor: 'transparent',
  },
});

export default BottomNavigationBar; 