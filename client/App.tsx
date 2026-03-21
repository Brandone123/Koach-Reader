// import 'react-native-get-random-values'; // Déplacé dans index.js
import { LogBox, StyleSheet, Platform, View, Text, TouchableOpacity, Image, Linking } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider, DefaultTheme, IconButton, Badge } from 'react-native-paper';
import { NavigationContainer, useNavigation, useRoute, useNavigationState } from '@react-navigation/native';
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
import NotificationsScreen from './src/screens/NotificationsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AddBookScreen from './src/screens/AddBookScreen';
import BottomNavigationBar from './src/components/BottomNavigationBar';
import { useSelector } from 'react-redux';
import { selectUser } from './src/slices/authSlice';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import './src/utils/i18n'; // Import i18n configuration
import { LanguageProvider } from './src/context/LanguageContext';
import LanguageSwitcher from './src/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import AppWithLanguage from './src/components/AppWithLanguage';
import Toast from 'react-native-toast-message';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import { isFirstLaunch, setFirstLaunchComplete } from './src/utils/storage';
import AppOnboardingScreen from './src/screens/AppOnboardingScreen';
import ReadingGroupDetailScreen from './src/screens/ReadingGroupDetailScreen';
import CommunityDetailScreen from './src/screens/CommunityDetailScreen';
import AddFriendsScreen from './src/screens/AddFriendsScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';

LogBox.ignoreLogs(['Require cycle:']);

export type RootStackParamList = {
  Home: undefined;
  BookDetail: { bookId: string };
  ReadingSession: { bookId: string; planId?: string; isEdit?: boolean };
  ReadingPlan: { bookId: string; planId?: string; isEdit?: boolean };
  Settings: undefined;
  Profile: undefined;
  Search: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  Challenges: undefined;
  ChallengeDetail: { challengeId: string };
  MediaViewer: { bookId: string; type: 'pdf' | 'audio' };
  Badges: undefined;
  Stats: undefined;
  Notifications: undefined;
  Leaderboard: undefined;
  Onboarding: undefined;
  LanguageSettings: undefined;
  AddBook: { bookId?: string };
  GroupDetail: { groupId: number };
  CommunityDetail: { communityId: number };
  AddFriends: undefined;
  Achievements: undefined;
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

type HeaderRightProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};

function HeaderRight({ navigation }: HeaderRightProps) {
  const user = useSelector(selectUser);
  
  // Récupérer les points et le streak de l'utilisateur
  const koachPoints = user?.koach_points || 0;
  const streak = user?.reading_streak || 0;
  
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

type AppNavigatorProps = {
  initialRoute: keyof RootStackParamList | null;
  resetToken: string | null;
};

// Main app navigation wrapper
const AppNavigator = ({ initialRoute, resetToken }: AppNavigatorProps) => {
  const user = useSelector(selectUser);
  const { t } = useTranslation();
  
  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{
          headerStyle: {
            backgroundColor: "#9317ed",
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerTitleAlign: 'left',
          headerLeftContainerStyle: {
            paddingLeft: 10,
          },
          headerRightContainerStyle: {
            paddingRight: 10,
          },
        }}
        initialRouteName={initialRoute || (user ? 'Home' : 'Login')}
      >
        {!user ? (
          // Non authentifié
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ForgotPassword" 
              component={ForgotPasswordScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ResetPassword" 
              component={ResetPasswordScreen} 
              options={{ headerShown: false }}
            />
          </>
        ) : !user.has_completed_onboarding ? (
          // Authentifié mais n'a pas complété l'onboarding
          <Stack.Screen 
            name="Onboarding" 
            component={OnboardingScreen} 
            options={{ headerShown: false, gestureEnabled: false }}
          />
        ) : (
          // Authentifié et a complété l'onboarding
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={({ navigation }) => ({
                headerTitle: () => <HomeTitle />,
                headerRight: () => <HeaderRight navigation={navigation} />,
              })}
            />
            <Stack.Screen name="BookDetail" component={BookDetailScreen} />
            <Stack.Screen name="ReadingPlan" component={ReadingPlanScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ReadingSession" component={ReadingSessionScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Challenges" component={ChallengesScreen} />
            <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} />
            <Stack.Screen name="MediaViewer" component={MediaViewerScreen} />
            <Stack.Screen name="Badges" component={BadgesScreen} />
            <Stack.Screen name="Stats" component={StatsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="AddBook" component={AddBookScreen} />
            <Stack.Screen 
              name="GroupDetail" 
              component={ReadingGroupDetailScreen}
              options={{ title: 'Groupe de Lecture' }}
            />
            <Stack.Screen 
              name="CommunityDetail" 
              component={CommunityDetailScreen}
              options={{ title: 'Communauté' }}
            />
            <Stack.Screen 
              name="AddFriends" 
              component={AddFriendsScreen} 
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="Achievements" 
              component={AchievementsScreen} 
              options={{ headerShown: true, title: 'Mes Succès' }}
            />
          </>
        )}
      </Stack.Navigator>
      <AppFooter />
    </NavigationContainer>
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

// Composant pour le footer conditionnel
const AppFooter = () => {
  const navigationState = useNavigationState(state => state);
  
  // Déterminer si nous devons afficher le footer
  const shouldShowFooter = () => {
    if (!navigationState || !navigationState.routes || navigationState.routes.length === 0) return false;
    const currentRoute = navigationState.routes[navigationState.routes.length - 1].name;
    const noFooterRoutes = ['Login', 'Register', 'Onboarding', 'MediaViewer', 'ResetPassword', 'ForgotPassword'];
    return !noFooterRoutes.includes(currentRoute);
  };
  
  return shouldShowFooter() ? <BottomNavigationBar /> : null;
};

// Root component
export default function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingFirstLaunch, setIsCheckingFirstLaunch] = useState(true);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const isFirst = await isFirstLaunch();
      console.log('🚀 First launch check:', isFirst);
      // TEMPORAIRE: Forcer l'affichage du welcome screen
      setShowOnboarding(true);
    } catch (error) {
      console.error('Error checking first launch:', error);
      setShowOnboarding(true);
    } finally {
      setIsCheckingFirstLaunch(false);
    }
  };

  const handleOnboardingComplete = async () => {
    console.log('🎉 Onboarding completed');
    await setFirstLaunchComplete();
    setShowOnboarding(false);
  };

  // Affichage de l'écran de chargement
  if (isCheckingFirstLaunch) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#fff' }} />
      </SafeAreaProvider>
    );
  }

  // Affichage de l'onboarding complet
  if (showOnboarding) {
    return (
      <SafeAreaProvider>
        <ReduxProvider store={store}>
          <PaperProvider theme={theme}>
            <LanguageProvider>
              <AppOnboardingScreen onComplete={handleOnboardingComplete} />
            </LanguageProvider>
          </PaperProvider>
        </ReduxProvider>
        <StatusBar style="light" />
        <Toast />
      </SafeAreaProvider>
    );
  }

  // Votre app principale existante
  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <PaperProvider theme={theme}>
          <LanguageProvider>
            <AppNavigator initialRoute={initialRoute} resetToken={resetToken} />
          </LanguageProvider>
        </PaperProvider>
      </ReduxProvider>
      <StatusBar style="light" />
      <Toast />
    </SafeAreaProvider>
  );
} 








