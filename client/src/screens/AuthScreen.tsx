import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { login, register, selectIsLoading, selectError } from '../redux/slices/authSlice';
import { AppDispatch } from '../redux/store';
import { colors } from '../utils/theme';
import { useTranslation } from 'react-i18next';

const AuthScreen: React.FC = () => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setValidationError(null);
    // Reset form fields
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const validateForm = () => {
    setValidationError(null);

    if (!username.trim()) {
      setValidationError(t('auth.errorRequired'));
      return false;
    }

    if (!isLogin && !email.trim()) {
      setValidationError(t('auth.errorRequired'));
      return false;
    }

    if (!password) {
      setValidationError(t('auth.errorRequired'));
      return false;
    }

    if (!isLogin && password.length < 6) {
      setValidationError(t('auth.errorPasswordShort'));
      return false;
    }

    if (!isLogin && password !== confirmPassword) {
      setValidationError(t('auth.errorPasswordsMatch'));
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (isLogin) {
      dispatch(login({ username, password }));
    } else {
      dispatch(register({ username, email, password }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.formContainer}>
              <View style={styles.logoContainer}>
                <Text style={styles.logo}>KOACH</Text>
                <Text style={styles.logoSubtitle}>{t('auth.yourJourneyStarts')}</Text>
              </View>

              <Text style={styles.formTitle}>{isLogin ? t('auth.login') : t('auth.createAccount')}</Text>

              {/* Username Field */}
              <TextInput
                label={t('auth.username')}
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                autoCapitalize="none"
                disabled={isLoading}
              />

              {/* Email Field (only for registration) */}
              {!isLogin && (
                <TextInput
                  label={t('auth.email')}
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  disabled={isLoading}
                />
              )}

              {/* Password Field */}
              <TextInput
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                style={styles.input}
                disabled={isLoading}
                right={
                  <TextInput.Icon
                    icon={passwordVisible ? 'eye-off' : 'eye'}
                    onPress={() => setPasswordVisible(!passwordVisible)}
                  />
                }
              />

              {/* Confirm Password Field (only for registration) */}
              {!isLogin && (
                <TextInput
                  label={t('auth.confirmPassword')}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!passwordVisible}
                  style={styles.input}
                  disabled={isLoading}
                />
              )}

              {/* Error Messages */}
              {(validationError || error) && (
                <Text style={styles.errorText}>{validationError || error}</Text>
              )}

              {/* Submit Button */}
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.button}
                loading={isLoading}
                disabled={isLoading}
              >
                {isLogin ? t('auth.login') : t('auth.createAccount')}
              </Button>

              {/* Toggle Login/Register */}
              <TouchableOpacity onPress={toggleAuthMode} style={styles.toggleButton}>
                <Text style={styles.toggleText}>
                  {isLogin
                    ? t('auth.dontHaveAccount')
                    : t('auth.alreadyHaveAccount')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.heroContainer}>
              <Text style={styles.heroTitle}>{t('heroText.trackJourney')}</Text>
              <Text style={styles.heroSubtitle}>
                {t('heroText.buildHabit')}
              </Text>

              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>📚</Text>
                  <Text style={styles.featureText}>{t('heroText.trackProgress')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🏆</Text>
                  <Text style={styles.featureText}>{t('heroText.earnBadges')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>👥</Text>
                  <Text style={styles.featureText}>{t('heroText.joinChallenges')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>📊</Text>
                  <Text style={styles.featureText}>{t('heroText.setGoals')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🔔</Text>
                  <Text style={styles.featureText}>{t('heroText.getReminders')}</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  formContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.primary,
  },
  logoSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  errorText: {
    color: colors.error,
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingVertical: 8,
  },
  toggleButton: {
    marginTop: 16,
    alignSelf: 'center',
  },
  toggleText: {
    color: colors.secondary,
    fontSize: 16,
  },
  heroContainer: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 24,
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 32,
    opacity: 0.9,
  },
  featuresList: {
    marginTop: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
});

export default AuthScreen;