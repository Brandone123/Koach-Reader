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

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  
  // Form validation states
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const { login, user, isLoading, error } = useAuth();
  
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
      setUsernameError('Username is required');
      isValid = false;
    } else {
      setUsernameError('');
    }
    
    // Password validation
    if (password === '') {
      setPasswordError('Password is required');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    return isValid;
  };
  
  const handleLogin = async () => {
    if (validateForm()) {
      try {
        await login({ username, password });
      } catch (err) {
        // Error will be handled by the useAuth hook
        console.error('Login failed:', err);
      }
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require('../../assets/splash.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
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
                <Text style={styles.appName}>Koach Reader</Text>
                <Text style={styles.tagline}>Your reading journey begins here</Text>
              </View>
              
              <View style={styles.formContainer}>
                {error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}
                
                <TextInput
                  label="Username"
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
                  label="Password"
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
                
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
                
                <Button 
                  mode="contained" 
                  onPress={handleLogin} 
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.loginButton}
                  labelStyle={styles.loginButtonText}
                  contentStyle={styles.loginButtonContent}
                  color="#8A2BE2"
                >
                  Sign In
                </Button>
                
                <View style={styles.registerContainer}>
                  <Text style={styles.registerText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.registerLink}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* <View style={styles.featureContainer}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Text style={styles.featureIconText}>📚</Text>
                  </View>
                  <Text style={styles.featureText}>Track Your Books</Text>
                </View>
                
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Text style={styles.featureIconText}>🎯</Text>
                  </View>
                  <Text style={styles.featureText}>Set Reading Goals</Text>
                </View>
                
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Text style={styles.featureIconText}>🏆</Text>
                  </View>
                  <Text style={styles.featureText}>Earn Rewards</Text>
                </View>
              </View> */}
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  loginButton: {
    borderRadius: 30,
    marginBottom: 24,
    elevation: 4,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF6B6B',
    marginBottom: 16,
    textAlign: 'center',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 24,
  },
  registerText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  registerLink: {
    color: '#8A2BE2',
    fontWeight: 'bold',
  },
  featureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  featureItem: {
    alignItems: 'center',
    width: '30%',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LoginScreen;