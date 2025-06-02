import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { selectUser, selectHasCompletedOnboarding } from '../slices/authSlice';
import { colors } from '../utils/theme';

// Types
import { RootStackParamList } from '../types/navigation';

// Screens
import AuthScreen from '../screens/AuthScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import BookDetailScreen from '../screens/BookDetailScreen';
import ReadingPlanScreen from '../screens/ReadingPlanScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReadingSessionScreen from '../screens/ReadingSessionScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import ChallengeDetailScreen from '../screens/ChallengeDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const user = useSelector(selectUser);
  const hasCompletedOnboarding = useSelector(selectHasCompletedOnboarding);

  useEffect(() => {
    console.log('AppNavigator state changed:', { 
      user, 
      hasCompletedOnboarding,
      shouldShowAuth: !user,
      shouldShowOnboarding: user && !hasCompletedOnboarding,
      shouldShowHome: user && hasCompletedOnboarding
    });
  }, [user, hasCompletedOnboarding]);

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animationEnabled: false // Désactiver les animations pour éviter les problèmes de transition
        }}
      >
        {!user ? (
          // Non authentifié
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : !hasCompletedOnboarding ? (
          // Authentifié mais n'a pas complété l'onboarding
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          // Authentifié et a complété l'onboarding
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="BookDetail" component={BookDetailScreen} />
            <Stack.Screen name="ReadingPlan" component={ReadingPlanScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ReadingSession" component={ReadingSessionScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Challenges" component={ChallengesScreen} />
            <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;