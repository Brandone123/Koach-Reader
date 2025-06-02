import { StackNavigationProp } from '@react-navigation/stack';

export type RootStackParamList = {
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  Onboarding: undefined;
  Home: undefined;
  Profile: undefined;
  BookDetail: { bookId: string };
  ReadingSession: { bookId: string; planId?: string; isEdit?: boolean };
  ReadingPlan: { bookId: string; planId?: string; isEdit?: boolean };
  Settings: undefined;
  Badges: undefined;
  Stats: undefined;
  Challenges: undefined;
  ChallengeDetail: { challengeId: string };
  MediaViewer: { mediaId: string; mediaType: 'pdf' | 'audio' };
  Notifications: undefined;
  Leaderboard: undefined;
};

export type NavigationProps<T extends keyof RootStackParamList> = {
  navigation: StackNavigationProp<RootStackParamList, T>;
}; 