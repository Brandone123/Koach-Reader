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
  Alert
} from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
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
      setUsernameError('Username is required');
      isValid = false;
    } else if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      isValid = false;
    } else {
      setUsernameError('');
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim() === '') {
      setEmailError('Email is required');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    // Password validation
    if (password === '') {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    // Confirm password validation
    if (confirmPassword === '') {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
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
            <Text style={styles.subtitle}>Create a new account</Text>
            
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
              label="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!emailError}
            />
            {emailError ? (
              <HelperText type="error" visible={!!emailError}>
                {emailError}
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
            
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={confirmSecureTextEntry}
              style={styles.input}
              error={!!confirmPasswordError}
              right={
                <TextInput.Icon 
                  icon={confirmSecureTextEntry ? "eye" : "eye-off"} 
                  onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)} 
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
            >
              Sign Up
            </Button>
            
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.heroContainer}>
            <Text style={styles.heroTitle}>Join Koach Reading</Text>
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
  registerButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: '#B00020',
    marginBottom: 16,
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#666',
  },
  loginLink: {
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

export default RegisterScreen;