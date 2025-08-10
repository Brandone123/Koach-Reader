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
    if (user) {
      if (user.has_completed_onboarding === false) {
        navigation.replace('Onboarding');
      } else {
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
        // Dispatch l'action login
        await dispatch(login({ email, password }));
        // La redirection sera gérée automatiquement par AppNavigator
      } catch (err) {
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logo}
              />
            </View>
            <Text style={styles.appName}>{t('common.appTitle')}</Text>
            <Text style={styles.tagline}>{t('home.welcomeBack')}</Text>
          </View>

          <View style={styles.formCard}>
            <TextInput
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!emailError}
              style={styles.input}
              mode="outlined"
              disabled={isSubmitting}
              theme={{
                colors: {
                  primary: '#9317ED',
                  outline: '#E0E0E0',
                  onSurfaceVariant: '#6D6D6D',
                }
              }}
              left={<TextInput.Icon icon="email-outline" color="#9317ED" />}
            />
            {emailError ? (
              <HelperText type="error" visible={!!emailError} style={styles.errorText}>
                {emailError}
              </HelperText>
            ) : null}

            <TextInput
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureTextEntry}
              error={!!passwordError}
              style={styles.input}
              mode="outlined"
              disabled={isSubmitting}
              theme={{
                colors: {
                  primary: '#9317ED',
                  outline: '#E0E0E0',
                  onSurfaceVariant: '#6D6D6D',
                }
              }}
              left={<TextInput.Icon icon="lock-outline" color="#9317ED" />}
              right={
                <TextInput.Icon
                  icon={secureTextEntry ? "eye-outline" : "eye-off-outline"}
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                  color="#9317ED"
                />
              }
            />
            {passwordError ? (
              <HelperText type="error" visible={!!passwordError} style={styles.errorText}>
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
              buttonColor="#9317ED"
            >
              {t('auth.login')}
            </Button>
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerLine} />
            </View>
            
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    paddingTop: 80,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#9317ED',
    marginTop: 20,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 18,
    color: '#6D6D6D',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '400',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#9317ED',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 24,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    backgroundColor: '#9317ED',
    elevation: 2,
    shadowColor: '#9317ED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  loginButtonContent: {
    height: 56,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    color: '#6D6D6D',
    fontSize: 16,
  },
  registerLink: {
    color: '#9317ED',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;
