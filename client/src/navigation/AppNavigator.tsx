import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { selectUser } from '../slices/authSlice';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
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
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

// Types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  Onboarding: undefined;
  Home: undefined;
  BookDetail: { bookId: string };
  ReadingPlan: { bookId: string; planId?: string; isEdit?: boolean };
  Profile: undefined;
  ReadingSession: { bookId: string; planId?: string };
  Leaderboard: undefined;
  Challenges: undefined;
  ChallengeDetail: { challengeId: string };
  Notifications: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const user = useSelector(selectUser);

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animationEnabled: false
        }}
      >
        {!user ? (
          // Non authentifié
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        ) : !user.has_completed_onboarding ? (
          // Authentifié mais n'a pas complété l'onboarding
          <Stack.Screen 
            name="Onboarding" 
            component={OnboardingScreen} 
            options={{ gestureEnabled: false }}
          />
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