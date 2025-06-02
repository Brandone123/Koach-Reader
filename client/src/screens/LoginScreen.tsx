import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  StatusBar,
  Alert
} from 'react-native';
import { TextInput, Button, HelperText, ActivityIndicator } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import type { RootState } from '../store';
import Toast from 'react-native-toast-message';
import { login } from '../slices/authSlice';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const error = useSelector((state: RootState) => state.auth.error);
  
  useEffect(() => {
    // Redirect based on user state
    console.log('User state changed:', user);
    if (user) {
      console.log('User is logged in, checking onboarding status:', user.has_completed_onboarding);
      if (user.has_completed_onboarding === false) {
        console.log('User has not completed onboarding, redirecting to Onboarding');
        navigation.replace('Onboarding');
      } else {
        console.log('User has completed onboarding, redirecting to Home');
        navigation.replace('Home');
      }
    }
  }, [user, navigation]);

  useEffect(() => {
    if (error) {
      setIsSubmitting(false);
      Toast.show({
        type: 'error',
        text1: t('auth.loginError'),
        text2: error,
        position: 'bottom',
        visibilityTime: 4000,
      });
    }
  }, [error, t]);
  
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Email validation
    if (email.trim() === '') {
      setEmailError(t('auth.errorRequired'));
      isValid = false;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      setEmailError(t('auth.errorInvalidEmail'));
      isValid = false;
    } else {
      setEmailError('');
    }
    
    // Password validation
    if (password === '') {
      setPasswordError(t('auth.errorRequired'));
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    return isValid;
  };
  
  const handleLogin = async () => {
    if (isSubmitting) return;

    if (validateForm()) {
      setIsSubmitting(true);
      try {
        console.log('Attempting login with:', { email });
        
        // Dispatch l'action login
        await dispatch(login({ email, password }));
        console.log('Login successful');
        
        // La redirection sera gérée automatiquement par AppNavigator
      } catch (err) {
        console.error('Login failed:', err);
        Toast.show({
          type: 'error',
          text1: t('auth.loginError'),
          text2: err instanceof Error ? err.message : 'An error occurred',
          position: 'bottom',
          visibilityTime: 4000,
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Monitorer les changements d'état pour le débogage
  useEffect(() => {
    console.log('Auth state updated:', {
      user,
      hasCompletedOnboarding: user?.has_completed_onboarding,
      isLoading,
      error
    });
  }, [user, isLoading, error]);

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#8A2BE2', '#4A0082']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logo}
              />
              <Text style={styles.appName}>{t('common.appTitle')}</Text>
              <Text style={styles.tagline}>{t('home.welcomeBack')}</Text>
            </View>
            
            <View style={styles.formContainer}>
              <TextInput
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                error={!!emailError}
                disabled={isSubmitting}
                theme={{ colors: { primary: '#8A2BE2' } }}
                mode="outlined"
                left={<TextInput.Icon icon="email" color="#8A2BE2" />}
              />
              {emailError ? (
                <HelperText type="error" visible={!!emailError}>
                  {emailError}
                </HelperText>
              ) : null}
              
              <TextInput
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureTextEntry}
                style={styles.input}
                error={!!passwordError}
                disabled={isSubmitting}
                theme={{ colors: { primary: '#8A2BE2' } }}
                mode="outlined"
                left={<TextInput.Icon icon="lock" color="#8A2BE2" />}
                right={
                  <TextInput.Icon 
                    icon={secureTextEntry ? "eye" : "eye-off"} 
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                    color="#8A2BE2"
                  />
                }
              />
              {passwordError ? (
                <HelperText type="error" visible={!!passwordError}>
                  {passwordError}
                </HelperText>
              ) : null}
              
              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
                disabled={isSubmitting}
              >
                <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
              </TouchableOpacity>
              
              <Button 
                mode="contained" 
                onPress={handleLogin}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={styles.loginButton}
                labelStyle={styles.loginButtonText}
                contentStyle={styles.loginButtonContent}
                color="#8A2BE2"
              >
                {t('auth.login')}
              </Button>
              
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>{t('auth.dontHaveAccount')} </Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Register')}
                  disabled={isSubmitting}
                >
                  <Text style={styles.registerLink}>{t('auth.signup')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8A2BE2',
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#666',
    fontSize: 14,
  },
  loginButton: {
    marginBottom: 24,
    borderRadius: 30,
    elevation: 4,
    height: 50,
    justifyContent: 'center',
  },
  loginButtonContent: {
    height: 50,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    color: '#666',
  },
  registerLink: {
    color: '#8A2BE2',
    fontWeight: 'bold',
  },
});

export default LoginScreen;