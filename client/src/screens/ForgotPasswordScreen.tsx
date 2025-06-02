import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
  StatusBar,
  Linking
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

type ForgotPasswordScreenProps = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setEmailError(t('auth.errorRequired'));
      return false;
    }
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      setEmailError(t('auth.errorInvalidEmail'));
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    try {
      // Pour Expo Go, on utilise l'URL exacte
      const redirectUrl = __DEV__
        ? `exp://192.168.70.160:8081/--/reset-password`
        : 'koachreader://reset-password';

      console.log('Sending reset password email with redirect URL:', redirectUrl);
      console.log('Email address:', email);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      console.log('Reset password response:', error ? 'Error: ' + error.message : 'Success', data);

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: t('auth.resetPasswordSuccess'),
        text2: t('auth.resetPasswordInstructions'),
        position: 'bottom',
        visibilityTime: 4000,
      });

      setTimeout(() => {
        navigation.navigate('Login');
      }, 3000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      Toast.show({
        type: 'error',
        text1: t('auth.resetPasswordError'),
        text2: error.message || 'Une erreur est survenue lors de l\'envoi de l\'email',
        position: 'bottom',
        visibilityTime: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Ajout de l'effet pour gérer les liens profonds
  React.useEffect(() => {
    // Fonction pour gérer les liens profonds
    const handleDeepLink = async (event: { url: string }) => {
      console.log('Deep link handled:', event.url);
      if (event.url.includes('reset-password')) {
        // Extraire le token de réinitialisation si nécessaire
        const token = event.url.split('token=')[1];
        if (token) {
          navigation.navigate('ResetPassword', { token });
        }
      }
    };

    // Ajouter les listeners pour les liens profonds
    Linking.addEventListener('url', handleDeepLink);

    // Vérifier si l'app a été ouverte via un lien profond
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Nettoyage
    return () => {
      // Retirer les listeners
      // Note: La nouvelle API de Linking ne nécessite pas de cleanup explicite
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#ffffff', '#f7f9fc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{t('auth.forgotPassword')}</Text>
              <Text style={styles.description}>
                {t('auth.forgotPasswordInstructions')}
              </Text>
            </View>

            <TextInput
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              error={!!emailError}
              style={styles.input}
            />
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}

            <Button
              mode="contained"
              onPress={handleResetPassword}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              {t('auth.resetPassword')}
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              {t('common.back')}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1a2b4b',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 16,
    color: '#546b8c',
    marginBottom: 24,
    lineHeight: 24,
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    marginTop: 24,
    paddingVertical: 8,
  },
  backButton: {
    marginTop: 16,
  },
});

export default ForgotPasswordScreen; 