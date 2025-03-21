import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { selectIsLoggedIn } from '../redux/slices/authSlice';

// Screens
import AuthScreen from '../screens/AuthScreen';
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

// Types
export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  BookDetail: { bookId: number };
  ReadingPlan: { planId?: number };
  Profile: undefined;
  ReadingSession: { bookId: number; planId?: number };
  Leaderboard: undefined;
  Challenges: undefined;
  ChallengeDetail: { challengeId: number };
  Notifications: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const isLoggedIn = useSelector(selectIsLoggedIn);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#58CC02', // Duolingo green
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {isLoggedIn ? (
        // Logged in routes
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Koach Books' }}
          />
          <Stack.Screen
            name="BookDetail"
            component={BookDetailScreen}
            options={{ title: 'Book Details' }}
          />
          <Stack.Screen
            name="ReadingPlan"
            component={ReadingPlanScreen}
            options={{ title: 'Reading Plan' }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'My Profile' }}
          />
          <Stack.Screen
            name="ReadingSession"
            component={ReadingSessionScreen}
            options={{ title: 'Reading Session' }}
          />
          <Stack.Screen
            name="Leaderboard"
            component={LeaderboardScreen}
            options={{ title: 'Leaderboard' }}
          />
          <Stack.Screen
            name="Challenges"
            component={ChallengesScreen}
            options={{ title: 'Reading Challenges' }}
          />
          <Stack.Screen
            name="ChallengeDetail"
            component={ChallengeDetailScreen}
            options={{ title: 'Challenge Details' }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ title: 'Notifications' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
        </>
      ) : (
        // Auth routes
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;