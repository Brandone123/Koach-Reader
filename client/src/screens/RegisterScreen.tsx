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
import { supabase } from '../lib/supabase';

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
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const error = useSelector((state: RootState) => state.auth.error);
  
  useEffect(() => {
    if (error) {
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
        
        // Afficher le message de succès
        Toast.show({
          type: 'success',
          text1: t('auth.registrationSuccess'),
          text2: t('auth.pleaseLogin'),
          position: 'bottom',
          visibilityTime: 4000,
        });

        // Rediriger vers la page de login
        navigation.replace('Login');
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
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  keyboardView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
    backgroundColor: 'transparent',
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#9317ED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2E2E2E',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#6D6D6D',
    textAlign: 'center',
    fontWeight: '400',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  input: {
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    marginBottom: 12,
    marginLeft: 0,
  },
  registerButton: {
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    shadowColor: '#9317ED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: '#9317ED',
  },
  registerButtonContent: {
    height: 52,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6D6D6D',
    fontSize: 14,
    fontWeight: '400',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  loginText: {
    color: '#6D6D6D',
    fontSize: 15,
    fontWeight: '400',
  },
  loginLink: {
    color: '#9317ED',
    fontSize: 15,
    fontWeight: '600',
  },
  termsContainer: {
    paddingHorizontal: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#8D8D8D',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default RegisterScreen;
