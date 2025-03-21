import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity,
  Image,
  ScrollView
} from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { login, selectIsLoading, selectError, selectIsLoggedIn } from '../slices/authSlice';
import { AppDispatch } from '../store';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  
  // Form validation states
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  
  useEffect(() => {
    // Redirect to Home if already logged in
    if (isLoggedIn) {
      navigation.replace('Home');
    }
  }, [isLoggedIn, navigation]);
  
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
  
  const handleLogin = () => {
    if (validateForm()) {
      dispatch(login({ username, password }));
    }
  };
  
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.contentContainer}>
          <View style={styles.formContainer}>
            <Image
              source={require('../../assets/book-cover-placeholder.svg')}
              style={styles.logo}
            />
            <Text style={styles.title}>Koach Reading</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
            
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
              right={
                <TextInput.Icon 
                  icon={secureTextEntry ? "eye" : "eye-off"} 
                  onPress={() => setSecureTextEntry(!secureTextEntry)} 
                />
              }
            />
            {passwordError ? (
              <HelperText type="error" visible={!!passwordError}>
                {passwordError}
              </HelperText>
            ) : null}
            
            <Button 
              mode="contained" 
              onPress={handleLogin} 
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
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
          
          <View style={styles.heroContainer}>
            <Text style={styles.heroTitle}>Welcome to Koach Reading</Text>
            <Text style={styles.heroText}>
              Koach Reading is a gamified reading experience that helps you build
              and maintain consistent reading habits. Track your progress, earn rewards,
              and join a community of readers on a similar journey.
            </Text>
            <View style={styles.features}>
              <Text style={styles.featureItem}>✓ Create personalized reading plans</Text>
              <Text style={styles.featureItem}>✓ Track your daily reading streak</Text>
              <Text style={styles.featureItem}>✓ Earn Koach points and unlock badges</Text>
              <Text style={styles.featureItem}>✓ Join reading challenges with friends</Text>
              <Text style={styles.featureItem}>✓ Build a lifelong reading habit</Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  formContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 450,
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6200ee',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'white',
  },
  loginButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: '#B00020',
    marginBottom: 16,
    textAlign: 'center',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    color: '#666',
  },
  registerLink: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
  heroContainer: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    backgroundColor: '#6200ee',
    borderRadius: 10,
    marginLeft: 16,
    display: 'none', // Hide on mobile, will be shown on larger screens via media queries
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  heroText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 24,
    lineHeight: 24,
  },
  features: {
    marginTop: 16,
  },
  featureItem: {
    fontSize: 16,
    color: 'white',
    marginBottom: 12,
  },
  '@media (min-width: 768px)': {
    formContainer: {
      flex: 1,
    },
    heroContainer: {
      display: 'flex',
      flex: 1,
    },
  },
});

export default LoginScreen;