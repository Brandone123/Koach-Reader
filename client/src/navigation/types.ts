export type RootStackParamList = {
  Home: undefined;
  BookDetail: { bookId: string };
  CategoryBooks: { categoryId: string; categoryName: string };
  ReadingSession: { bookId: string; planId?: string; isEdit?: boolean };
  ReadingPlan: { bookId: string };
  MediaViewer: { bookId: string; type: 'audio' | 'pdf' };
  Settings: undefined;
  Profile: undefined;
  LanguageSettings: undefined;
  ThemeSettings: undefined;
  Notifications: undefined;
  About: undefined;
}; 