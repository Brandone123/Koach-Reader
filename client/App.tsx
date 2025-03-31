// import 'react-native-get-random-values'; // Déplacé dans index.js
import { LogBox, StyleSheet, Platform, View, Text, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider, DefaultTheme, IconButton, Badge } from 'react-native-paper';
import { NavigationContainer, useNavigation, useRoute } from '@react-navigation/native';
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
import OnboardingScreen from './src/screens/OnboardingScreen';
import BottomNavigationBar from './src/components/BottomNavigationBar';
import { useSelector } from 'react-redux';
import { selectUser } from './src/slices/authSlice';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigationState } from '@react-navigation/native';
import { Animated } from 'react-native';
import './src/utils/i18n'; // Import i18n configuration
import { LanguageProvider } from './src/context/LanguageContext';
import LanguageSwitcher from './src/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import AppWithLanguage from './src/components/AppWithLanguage';


LogBox.ignoreLogs(['Require cycle:']);

export type RootStackParamList = {
  Home: undefined;
  BookDetail: { bookId: string };
  ReadingSession: { bookId: string; planId?: string };
  ReadingPlan: { bookId: string };
  Settings: undefined;
  Profile: undefined;
  Search: undefined;
  Login: undefined;
  Register: undefined;
  Challenges: undefined;
  ChallengeDetail: { challengeId: string };
  MediaViewer: { mediaId: string; mediaType: 'pdf' | 'audio' };
  Badges: undefined;
  Stats: undefined;
  Notifications: undefined;
  Leaderboard: undefined;
  Onboarding: undefined;
  LanguageSettings: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const Stack = createStackNavigator<RootStackParamList>();

// Define main theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#8A2BE2', // Violet plus attrayant
    accent: '#FF6B6B', // Accent coloré
    background: '#FFFFFF', // Fond blanc
    surface: '#FFFFFF',
    text: '#333333', // Texte plus foncé pour meilleur contraste
    disabled: '#CCCCCC',
    placeholder: '#999999',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    // Ajouter plus de couleurs pour le thème
    card: '#FFFFFF',
    border: '#EEEEEE',
    notification: '#FF6B6B',
  },
  roundness: 12, // Coins arrondis
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
      fontWeight: '400',
    },
    medium: {
      fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
      fontWeight: '500',
    },
    light: {
      fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
      fontWeight: '300',
    },
    thin: {
      fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
      fontWeight: '100',
    },
  },
};

// Auth navigation wrapper
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false, gestureEnabled: false }} />
    </Stack.Navigator>
  );
};

type HeaderRightProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};

function HeaderRight({ navigation }: HeaderRightProps) {
  const { user } = useAuth();
  
  // Récupérer les points et le streak de l'utilisateur
  const koachPoints = user?.koachPoints || 0;
  const streak = user?.readingStreak || 0;
  
  return (
    <View style={styles.headerRightContainer}>
      {/* Streak */}
      <View style={styles.statContainer}>
        <MaterialCommunityIcons name="fire" size={16} color="#FFC107" />
        <Text style={styles.statText}>{streak}</Text>
      </View>
      
      {/* Points */}
      <View style={styles.statContainer}>
        <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
        <Text style={styles.statText}>{koachPoints}</Text>
      </View>
      
      {/* Language Switcher */}
      <LanguageSwitcher isHeader={true} />
    </View>
  );
}

// Fonction pour personnaliser le titre de la page d'accueil
function HomeTitle() {
  const { t } = useTranslation();
  return (
    // <Text style={styles.appTitle}>{t('common.appTitle')}</Text>
    <View style={styles.container}>
      <Image 
        source={require('../client/assets/logo.png')}
        style={[styles.logo, { alignSelf: 'flex-start' }]}
      />
    </View>
  );
}

// Main app navigation wrapper
const AppNavigator = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // Show auth screens if no user
  if (!user) {
    return <AuthNavigator />;
  }
  
  // Si l'utilisateur est authentifié, toujours aller sur Home
  return (
    <>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: "#9317ed",
            elevation: 0, // Supprime l'ombre sur Android
            shadowOpacity: 0, // Supprime l'ombre sur iOS
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerTitleAlign: 'left', // Aligner le titre à gauche
          headerLeftContainerStyle: {
            paddingLeft: 10,
          },
          headerRightContainerStyle: {
            paddingRight: 10,
          },
          // Animation de transition entre les écrans
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
            headerTitle: () => <HomeTitle />,
            headerRight: () => <HeaderRight navigation={navigation} />,
          })}
        />
        <Stack.Screen 
          name="BookDetail" 
          component={BookDetailScreen} 
          options={{
            title: t('book.details', 'Book Details'),
          }}
        />
        <Stack.Screen 
          name="ReadingPlan" 
          component={ReadingPlanScreen} 
          options={({ route }) => ({
            title: route.params?.planId && !route.params?.isEdit 
              ? t('readingPlan.title', 'Reading Plan') 
              : (route.params?.isEdit ? t('readingPlan.edit', 'Edit Plan') : t('readingPlan.create', 'Create Plan')),
          })}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{
            title: t('profile.title', 'My Profile'),
          }}
        />
        <Stack.Screen 
          name="ReadingSession" 
          component={ReadingSessionScreen} 
          options={{
            title: t('readingSession.title', 'Log Reading Session'),
          }}
        />
        <Stack.Screen 
          name="Badges" 
          component={BadgesScreen} 
          options={{
            title: t('badges.title', 'Badges & Achievements'),
          }}
        />
        <Stack.Screen 
          name="Stats" 
          component={StatsScreen} 
          options={{
            title: t('stats.title', 'Reading Statistics'),
          }}
        />
        <Stack.Screen 
          name="Leaderboard" 
          component={LeaderboardScreen} 
          options={{
            title: t('common.leaderboard', 'Leaderboard'),
          }}
        />
        <Stack.Screen 
          name="Challenges" 
          component={ChallengesScreen} 
          options={{
            title: t('challenges.title', 'Reading Challenges'),
          }}
        />
        <Stack.Screen 
          name="ChallengeDetail" 
          component={ChallengeDetailScreen} 
          options={{
            title: t('challenges.details', 'Challenge Details'),
          }}
        />
        <Stack.Screen 
          name="MediaViewer" 
          component={MediaViewerScreen} 
          options={{
            title: t('mediaViewer.title', 'Media Viewer'),
            headerShown: false, // Hide header for full-screen experience
          }}
        />
        <Stack.Screen 
          name="Notifications" 
          component={NotificationsScreen} 
          options={{
            title: t('notifications.title', 'Notifications'),
          }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{
            title: t('settings.title', 'Settings'),
          }}
        />
      </Stack.Navigator>
      <BottomNavigationBar />
    </>
  );
};

const styles = StyleSheet.create({
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 3,
  },
  langButton: {
    marginLeft: 4,
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',  // S'assurer que le texte est aligné à gauche
  },

  container: {
    alignSelf: 'flex-start',
    width: '100%',
  },

  logo: {
    width: 120,
    height: 80,
    marginLeft: -40,
    resizeMode: 'contain',
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <PaperProvider theme={theme}>
          <LanguageProvider>
            <AuthProvider>
              <AppWithLanguage>
                <NavigationContainer>
                  <AppNavigator />
                  <StatusBar style="auto" />
                </NavigationContainer>
              </AppWithLanguage>
            </AuthProvider>
          </LanguageProvider>
        </PaperProvider>
      </ReduxProvider>
    </SafeAreaProvider>
  );
} 