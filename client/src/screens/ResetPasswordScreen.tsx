import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
  StatusBar,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import Toast from 'react-native-toast-message';

type ResetPasswordScreenProps = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const { token } = route.params;

  const validateForm = (): boolean => {
    let isValid = true;

    if (!newPassword) {
      setPasswordError(t('auth.errorRequired'));
      isValid = false;
    } else if (newPassword.length < 8) {
      setPasswordError(t('auth.errorPasswordShort'));
      isValid = false;
    } else {
      setPasswordError('');
    }

    if (!confirmPassword) {
      setConfirmPasswordError(t('auth.errorRequired'));
      isValid = false;
    } else if (confirmPassword !== newPassword) {
      setConfirmPasswordError(t('auth.errorPasswordsMatch'));
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }

    return isValid;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Vérifier que nous avons un token
      if (!token) {
        throw new Error('Token de réinitialisation manquant');
      }

      console.log('Token reçu:', token);

      // Le token est déjà l'access token dans ce cas
      const { data: { session }, error: sessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: '',
      });

      if (sessionError || !session) {
        throw sessionError || new Error('Impossible d\'établir une session');
      }

      // Maintenant que nous avons une session, mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      Toast.show({
        type: 'success',
        text1: t('auth.passwordResetSuccess'),
        text2: t('auth.loginWithNewPassword'),
        position: 'bottom',
        visibilityTime: 4000,
      });

      // Se déconnecter et rediriger vers la page de connexion
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigation.navigate('Login');
      }, 3000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      Toast.show({
        type: 'error',
        text1: t('auth.passwordResetError'),
        text2: error.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe',
        position: 'bottom',
        visibilityTime: 4000,
      });

      // En cas d'erreur, rediriger vers la page de connexion après un délai
      setTimeout(() => {
        navigation.navigate('Login');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      Toast.show({
        type: 'error',
        text1: t('auth.resetPasswordError'),
        text2: 'Token de réinitialisation manquant',
      });
      navigation.navigate('Login');
    }
  }, [token, navigation, t]);

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
              <Text style={styles.title}>{t('auth.resetPassword')}</Text>
              <Text style={styles.description}>
                {t('auth.enterNewPassword')}
              </Text>
            </View>

            <TextInput
              label={t('auth.newPassword')}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              error={!!passwordError}
              style={styles.input}
            />
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}

            <TextInput
              label={t('auth.confirmNewPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              error={!!confirmPasswordError}
              style={styles.input}
            />
            {confirmPasswordError ? (
              <Text style={styles.errorText}>{confirmPasswordError}</Text>
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
});

export default ResetPasswordScreen; 