// import 'react-native-get-random-values'; // Déplacé dans index.js
import { LogBox, StyleSheet, Platform, View, Text, TouchableOpacity, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useAppDispatch } from './src/store/hooks';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { NavigationContainer, useNavigation, useNavigationState } from '@react-navigation/native';
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
import {
  subscribeNotificationsRealtime,
  unsubscribeNotificationsRealtime,
  selectUnreadCount,
} from './src/slices/notificationsSlice';

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

/** Cloche + compteur non lus → écran Notifications */
function NotificationsBellButton({
  navigation,
  iconColor = '#fff',
}: {
  navigation: StackNavigationProp<RootStackParamList>;
  iconColor?: string;
}) {
  const unread = useSelector(selectUnreadCount);
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Notifications')}
      style={styles.headerBellWrap}
      accessibilityRole="button"
      accessibilityLabel={t('notifications.title')}
    >
      <MaterialCommunityIcons name="bell-outline" size={24} color={iconColor} />
      {unread > 0 ? (
        <View style={styles.bellBadgeDot}>
          <Text style={styles.bellBadgeText}>
            {unread > 99 ? '99+' : String(unread)}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

/** Header des écrans autres que Home : notifications + langue */
function DefaultStackHeaderRight({
  navigation,
}: {
  navigation: StackNavigationProp<RootStackParamList>;
}) {
  return (
    <View style={styles.headerRightContainer}>
      <NotificationsBellButton navigation={navigation} />
      <LanguageSwitcher isHeader={true} />
    </View>
  );
}

function HomeHeaderRight({ navigation }: HeaderRightProps) {
  const user = useSelector(selectUser);
  const koachPoints = user?.koach_points || 0;
  const streak = user?.reading_streak || 0;

  return (
    <View style={styles.headerRightContainer}>
      <View style={styles.statContainer}>
        <MaterialCommunityIcons name="fire" size={16} color="#FFC107" />
        <Text style={styles.statText}>{streak}</Text>
      </View>
      <View style={styles.statContainer}>
        <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
        <Text style={styles.statText}>{koachPoints}</Text>
      </View>
      <NotificationsBellButton navigation={navigation} />
      <LanguageSwitcher isHeader={true} />
    </View>
  );
}

/** Écrans sans barre de navigation (Défis, etc.) : accès permanent aux notifications */
function NotificationsFloatingButton() {
  const navigation = useNavigation<NavigationProp>();
  const routeName = useNavigationState((state) => state?.routes[state?.index]?.name);
  const user = useSelector(selectUser);
  const unread = useSelector(selectUnreadCount);
  const { t } = useTranslation();

  if (!user?.id || !user.has_completed_onboarding) return null;
  if (!routeName) return null;
  if (routeName === 'Notifications' || routeName === 'MediaViewer') return null;

  /* Ces écrans masquent le header (pas de cloche) : bouton flottant obligatoire */
  const headerHiddenRoutes: (keyof RootStackParamList)[] = [
    'Profile',
    'BookDetail',
    'Leaderboard',
    'Achievements',
    'Badges',
    'Challenges',
    'ChallengeDetail',
    'AddFriends',
  ];
  if (!headerHiddenRoutes.includes(routeName as keyof RootStackParamList)) return null;

  return (
    <TouchableOpacity
      style={styles.notifFab}
      onPress={() => navigation.navigate('Notifications')}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={t('notifications.title')}
    >
      <MaterialCommunityIcons name="bell" size={26} color="#fff" />
      {unread > 0 ? (
        <View style={styles.notifFabBadge}>
          <Text style={styles.notifFabBadgeText}>
            {unread > 99 ? '99+' : String(unread)}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
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
  const user = useSelector(selectUser);
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!user?.id || !user.has_completed_onboarding) {
      dispatch(unsubscribeNotificationsRealtime());
      return;
    }
    dispatch(subscribeNotificationsRealtime(user.id));
    return () => {
      dispatch(unsubscribeNotificationsRealtime());
    };
  }, [dispatch, user?.id, user?.has_completed_onboarding]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={({ navigation }) => ({
          headerStyle: {
            backgroundColor: '#9317ed',
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
          // headerRight: () => <DefaultStackHeaderRight navigation={navigation} />,
        })}
        initialRouteName={user ? 'Home' : 'Login'}
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
                headerRight: () => <HomeHeaderRight navigation={navigation} />,
              })}
            />
            <Stack.Screen name="BookDetail" options={{ headerShown: true, title: t('bookDetail.title') }} component={BookDetailScreen} />
            <Stack.Screen name="ReadingPlan" options={{ headerShown: true, title: t('readingPlan.title') }} component={ReadingPlanScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ReadingSession" options={{ headerShown: true, title: t('readingSession.title') }} component={ReadingSessionScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Challenges" component={ChallengesScreen} options={{ headerShown: false}}/>
            <Stack.Screen name="ChallengeDetail" options={{ headerShown: false}} component={ChallengeDetailScreen} />
            <Stack.Screen name="MediaViewer" component={MediaViewerScreen} />
            <Stack.Screen name="Badges" component={BadgesScreen} />
            <Stack.Screen name="Stats" component={StatsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="AddBook" component={AddBookScreen} />
            <Stack.Screen 
              name="GroupDetail" 
              component={ReadingGroupDetailScreen}
              options={{ title: t('profile.readingGroup') }}
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
  headerBellWrap: {
    marginRight: 6,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  notifFab: {
    position: 'absolute',
    right: 16,
    bottom: 96,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    zIndex: 100,
  },
  notifFabBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notifFabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
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
            <AppNavigator />
          </LanguageProvider>
        </PaperProvider>
      </ReduxProvider>
      <StatusBar style="light" />
      <Toast />
    </SafeAreaProvider>
  );
}




