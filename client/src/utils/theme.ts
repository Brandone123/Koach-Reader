import { DefaultTheme } from 'react-native-paper';

export const colors = {
  primary: '#9317ED',
  primaryLight: '#B14EF0',
  primaryLighter: '#D08AF5',
  primaryLightest: '#F0D7FB',
  primaryDark: '#7A12C4',
  
  secondary: '#1CB0F6',
  secondaryLight: '#64C8F9',
  
  accent: '#FF9E00',
  error: '#FF3D57',
  success: '#00C853',
  warning: '#FFC107',
  

  background: '#FFFFFF',
  surface: '#F8F9FA', 
  text: '#2E2E2E', 
  textSecondary: '#6D6D6D',
  disabled: '#E0E0E0',
  placeholder: '#BDBDBD',
  backdrop: 'rgba(0, 0, 0, 0.4)',
  onSurface: '#212121',
  notification: '#FF3D57',
};

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    accent: colors.accent,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
    text: colors.text,
    disabled: colors.disabled,
    placeholder: colors.placeholder,
    backdrop: colors.backdrop,
    onSurface: colors.onSurface,
    notification: colors.notification,
    
    primaryContainer: colors.primaryLightest,
    secondaryContainer: colors.primaryLighter,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: colors.text,
    onSurfaceVariant: colors.textSecondary,
  },
  roundness: 10,
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
  },
  animation: {
    scale: 1.0,
  },

  
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
  },
};