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
  const navigationState = useNavigationState(state => state);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  // Si nous avons un token de réinitialisation et que l'utilisateur n'est pas connecté,
  // nous devons afficher l'écran de réinitialisation
  React.useEffect(() => {
    if (resetToken && !user) {
      navigation.navigate('ResetPassword', { token: resetToken });
    }
  }, [resetToken, user, navigation]);
  
  // Déterminer si nous devons afficher le footer
  const shouldShowFooter = () => {
    if (!navigationState || !navigationState.routes || navigationState.routes.length === 0) return false;
    const currentRoute = navigationState.routes[navigationState.routes.length - 1].name;
    const noFooterRoutes = ['Login', 'Register', 'Onboarding', 'MediaViewer', 'ResetPassword', 'ForgotPassword'];
    return !noFooterRoutes.includes(currentRoute);
  };
  
  return (
    <>
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
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Badges" component={BadgesScreen} />
            <Stack.Screen name="Stats" component={StatsScreen} />
            <Stack.Screen name="MediaViewer" component={MediaViewerScreen} />
          </>
        )}
      </Stack.Navigator>
      {shouldShowFooter() && <BottomNavigationBar />}
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

// Root component
export default function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  React.useEffect(() => {
    // Fonction pour gérer les liens profonds
    const handleDeepLink = (event: { url: string }) => {
      console.log('Deep link handled:', event.url);
      if (event.url.includes('type=recovery')) {
        // Extraire le token de réinitialisation
        const token = event.url.split('token=')[1]?.split('&')[0];
        if (token) {
          setResetToken(token);
          setInitialRoute('ResetPassword');
        }
      }
    };

    // Vérifier si l'app a été ouverte via un lien profond
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Ajouter les listeners pour les liens profonds
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <PaperProvider theme={theme}>
          <LanguageProvider>
            <NavigationContainer
              linking={{
                prefixes: [
                  'koachreader://',
                  'exp://',
                  'exp://192.168.70.160:8081',
                  'exp://127.0.0.1:8081',
                  'exp://localhost:8081'
                ],
                config: {
                  screens: {
                    ResetPassword: {
                      path: 'reset-password',
                      parse: {
                        token: (token: string) => token,
                      },
                    },
                  },
                },
              }}
            >
              <AppNavigator initialRoute={initialRoute} resetToken={resetToken} />
            </NavigationContainer>
          </LanguageProvider>
        </PaperProvider>
      </ReduxProvider>
      <StatusBar style="light" />
      <Toast />
    </SafeAreaProvider>
  );
} 