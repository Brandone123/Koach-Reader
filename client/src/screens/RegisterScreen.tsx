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
  ImageBackground,
  Dimensions,
  StatusBar
} from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

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
  
  // Form validation states
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const { register, user, isLoading, error } = useAuth();
  
  useEffect(() => {
    // Redirect to Home if already logged in
    if (user) {
      navigation.replace('Home');
    }
  }, [user, navigation]);
  
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Username validation
    if (username.trim() === '') {
      setUsernameError(t('auth.errorRequired'));
      isValid = false;
    } else {
      setUsernameError('');
    }
    
    // Email validation
    if (email.trim() === '') {
      setEmailError(t('auth.errorRequired'));
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError(t('auth.errorInvalidEmail'));
      isValid = false;
    } else {
      setEmailError('');
    }
    
    // Password validation
    if (password === '') {
      setPasswordError(t('auth.errorRequired'));
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError(t('auth.errorPasswordShort'));
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
    if (validateForm()) {
      try {
        await register({ username, email, password });
      } catch (err) {
        // Error will be handled by the useAuth hook
        console.error('Registration failed:', err);
      }
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* <ImageBackground
        source={require('../../assets/splash.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      > */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
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
                {error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}
                
                <TextInput
                  label={t('auth.username')}
                  value={username}
                  onChangeText={setUsername}
                  style={styles.input}
                  autoCapitalize="none"
                  error={!!usernameError}
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
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.registerButton}
                  labelStyle={styles.registerButtonText}
                  contentStyle={styles.registerButtonContent}
                  color="#8A2BE2"
                >
                  {t('auth.createAccount')}
                </Button>
                
                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>{t('auth.alreadyHaveAccount')} </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginLink}>{t('auth.login')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      {/* </ImageBackground> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
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
    width: 80,
    height: 80,
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
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  registerButton: {
    borderRadius: 30,
    marginTop: 8,
    marginBottom: 24,
    elevation: 4,
  },
  registerButtonContent: {
    paddingVertical: 8,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF6B6B',
    marginBottom: 16,
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.8)',
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
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontSize: 12,
  },
});

export default RegisterScreen;