// import 'react-native-get-random-values'; // Déplacé dans index.js
import { LogBox, StyleSheet } from 'react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider, DefaultTheme, IconButton } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './src/store';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BookDetailScreen from './src/screens/BookDetailScreen';
import ReadingPlanScreen from './src/screens/ReadingPlanScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ReadingSessionScreen from './src/screens/ReadingSessionScreen';
import BadgesScreen from './src/screens/BadgesScreen';
import StatsScreen from './src/screens/StatsScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ChallengesScreen from './src/screens/ChallengesScreen';
import ChallengeDetailScreen from './src/screens/ChallengeDetailScreen';
import MediaViewerScreen from './src/screens/MediaViewerScreen';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import NotificationsScreen from './src/screens/NotificationsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

LogBox.ignoreLogs(['Require cycle:']);

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  BookDetail: { bookId: number };
  ReadingPlan: { planId?: number; bookId?: number; isEdit?: boolean };
  Profile: undefined;
  ReadingSession: { bookId: number; planId?: number };
  MediaViewer: { bookId: number; mediaType: 'pdf' | 'audio' };
  Badges: undefined;
  Stats: undefined;
  Leaderboard: undefined;
  Challenges: undefined;
  ChallengeDetail: { challengeId: number };
  Settings: undefined;
  Notifications: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Define main theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    accent: '#03dac4',
    background: '#f5f5f5',
    surface: 'white',
    text: '#000000',
    disabled: '#bbbbbb',
    placeholder: '#888888',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
};

// Auth navigation wrapper
const AuthNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

// Main app navigation wrapper
const AppNavigator = () => {
  const auth = useAuth();
  
  // If not authenticated, show auth screens
  if (!auth.user) {
    return <AuthNavigator />;
  }
  
  return (
    <Stack.Navigator 
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        // Ajouter des animations de transition entre les écrans
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
              opacity: current.progress.interpolate({
                inputRange: [0, 0.5, 0.9, 1],
                outputRange: [0, 0.25, 0.7, 1],
              }),
            },
            overlayStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          };
        },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={({ navigation }) => ({
          title: 'Koach Reading',
          headerRight: () => <ProfileButton navigation={navigation} />,
        })}
      />
      <Stack.Screen 
        name="BookDetail" 
        component={BookDetailScreen} 
        options={{
          title: 'Book Details',
        }}
      />
      <Stack.Screen 
        name="ReadingPlan" 
        component={ReadingPlanScreen} 
        options={({ route }) => ({
          title: route.params?.planId && !route.params?.isEdit 
            ? 'Reading Plan' 
            : (route.params?.isEdit ? 'Edit Plan' : 'Create Plan'),
        })}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          title: 'My Profile',
        }}
      />
      <Stack.Screen 
        name="ReadingSession" 
        component={ReadingSessionScreen} 
        options={{
          title: 'Log Reading Session',
        }}
      />
      <Stack.Screen 
        name="Badges" 
        component={BadgesScreen} 
        options={{
          title: 'Badges & Achievements',
        }}
      />
      <Stack.Screen 
        name="Stats" 
        component={StatsScreen} 
        options={{
          title: 'Reading Statistics',
        }}
      />
      <Stack.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen} 
        options={{
          title: 'Leaderboard',
        }}
      />
      <Stack.Screen 
        name="Challenges" 
        component={ChallengesScreen} 
        options={{
          title: 'Reading Challenges',
        }}
      />
      <Stack.Screen 
        name="ChallengeDetail" 
        component={ChallengeDetailScreen} 
        options={{
          title: 'Challenge Details',
        }}
      />
      <Stack.Screen 
        name="MediaViewer" 
        component={MediaViewerScreen} 
        options={{
          title: 'Media Viewer',
          headerShown: false, // Hide header for full-screen experience
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{
          title: 'Notifications',
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{
          title: 'Settings',
        }}
      />
    </Stack.Navigator>
  );
};

type ProfileButtonProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};

function ProfileButton({ navigation }: ProfileButtonProps) {
  return (
    <IconButton
      icon="account-circle"
      size={24}
      onPress={() => navigation.navigate('Profile')}
      style={{ marginRight: 10 }}
      // @ts-ignore - IconButton from react-native-paper should accept color
      color="white"
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <AuthProvider>
          <PaperProvider theme={theme}>
            <NavigationContainer>
              <AppNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </PaperProvider>
        </AuthProvider>
      </ReduxProvider>
    </SafeAreaProvider>
  );
} 