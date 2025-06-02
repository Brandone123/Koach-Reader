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
import { register } from '../slices/authSlice';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form validation states
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const dispatch = useAppDispatch();
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const error = useSelector((state: RootState) => state.auth.error);
  const user = useSelector((state: RootState) => state.auth.user);
  
  useEffect(() => {
    if (user) {
      console.log('Registration successful, redirecting to onboarding');
      setIsSubmitting(false);
      Toast.show({
        type: 'success',
        text1: t('auth.registrationSuccess'),
        text2: t('auth.redirectingToOnboarding'),
        position: 'bottom',
        visibilityTime: 4000,
      });
      navigation.replace('Onboarding');
    }
  }, [user, navigation, t]);

  useEffect(() => {
    if (error) {
      console.error('Registration error:', error);
      setIsSubmitting(false);
      Toast.show({
        type: 'error',
        text1: t('auth.registrationError'),
        text2: error,
        position: 'bottom',
        visibilityTime: 4000,
      });
    }
  }, [error, t]);
  
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Username validation
    if (username.trim() === '') {
      setUsernameError(t('auth.errorRequired'));
      isValid = false;
    } else if (username.length < 3) {
      setUsernameError(t('auth.errorUsernameTooShort'));
      isValid = false;
    } else if (username.length > 20) {
      setUsernameError(t('auth.errorUsernameTooLong'));
      isValid = false;
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setUsernameError(t('auth.errorUsernameInvalid'));
      isValid = false;
    } else {
      setUsernameError('');
    }
    
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
    } else if (password.length < 8) {
      setPasswordError(t('auth.errorPasswordTooShort'));
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setPasswordError(t('auth.errorPasswordRequirements'));
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    // Confirm password validation
    if (confirmPassword === '') {
      setConfirmPasswordError(t('auth.errorRequired'));
      isValid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError(t('auth.errorPasswordsMatch'));
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }
    
    return isValid;
  };
  
  const handleRegister = async () => {
    if (isSubmitting) return;
    
    if (validateForm()) {
      console.log('Starting registration for:', { username, email });
      setIsSubmitting(true);
      try {
        await dispatch(register({ username, email, password })).unwrap();
        console.log('Registration API call successful');
      } catch (err) {
        console.error('Registration failed:', err);
        setIsSubmitting(false);
      }
    } else {
      console.log('Form validation failed');
    }
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
              <Text style={styles.tagline}>{t('auth.joinCommunity')}</Text>
            </View>
            
            <View style={styles.formContainer}>
              <TextInput
                label={t('auth.username')}
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                autoCapitalize="none"
                error={!!usernameError}
                disabled={isSubmitting}
                theme={{ colors: { primary: '#8A2BE2' } }}
                mode="outlined"
                left={<TextInput.Icon icon="account" color="#8A2BE2" />}
              />
              {usernameError ? (
                <HelperText type="error" visible={!!usernameError}>
                  {usernameError}
                </HelperText>
              ) : null}
              
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
              
              <TextInput
                label={t('auth.confirmPassword')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={confirmSecureTextEntry}
                style={styles.input}
                error={!!confirmPasswordError}
                disabled={isSubmitting}
                theme={{ colors: { primary: '#8A2BE2' } }}
                mode="outlined"
                left={<TextInput.Icon icon="lock-check" color="#8A2BE2" />}
                right={
                  <TextInput.Icon 
                    icon={confirmSecureTextEntry ? "eye" : "eye-off"} 
                    onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)}
                    color="#8A2BE2"
                  />
                }
              />
              {confirmPasswordError ? (
                <HelperText type="error" visible={!!confirmPasswordError}>
                  {confirmPasswordError}
                </HelperText>
              ) : null}
              
              <Button 
                mode="contained" 
                onPress={handleRegister}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={styles.registerButton}
                labelStyle={styles.registerButtonText}
                contentStyle={styles.registerButtonContent}
                color="#8A2BE2"
              >
                {t('auth.createAccount')}
              </Button>
              
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>{t('auth.alreadyHaveAccount')} </Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Login')}
                  disabled={isSubmitting}
                >
                  <Text style={styles.loginLink}>{t('auth.login')}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  {t('auth.termsAgreement')}
                </Text>
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
  registerButton: {
    marginTop: 24,
    marginBottom: 16,
    borderRadius: 30,
    elevation: 4,
    height: 50,
    justifyContent: 'center',
  },
  registerButtonContent: {
    height: 50,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    color: '#666',
  },
  loginLink: {
    color: '#8A2BE2',
    fontWeight: 'bold',
  },
  termsContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  termsText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 12,
  },
});

export default RegisterScreen;