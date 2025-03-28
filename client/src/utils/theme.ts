import { DefaultTheme } from 'react-native-paper';

export const colors = {
  primary: 'rgb(103, 80, 164)',
  secondary: '#1CB0F6',
  accent: '#CE82FF',
  error: '#FF4B4B',
  success: '#58CC02',
  warning: '#FFC800',
  background: '#FFFFFF',
  surface: '#F7F7F7',
  text: '#3C3C3C',
  textSecondary: '#777777',
  disabled: '#CDCDCD',
  placeholder: '#9E9E9E',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  onSurface: '#000000',
  notification: '#FF4B4B',
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
  },
  roundness: 12,
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'sans-serif',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'sans-serif-medium',
      fontWeight: 'normal',
    },
    light: {
      fontFamily: 'sans-serif-light',
      fontWeight: 'normal',
    },
    thin: {
      fontFamily: 'sans-serif-thin',
      fontWeight: 'normal',
    },
  },
  animation: {
    scale: 1.0,
  },
};