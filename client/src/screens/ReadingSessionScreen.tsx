import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text, Button, ActivityIndicator, ProgressBar } from 'react-native-paper';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchBooks } from '../slices/booksSlice';
import { fetchReadingPlans, fetchReadingSessions } from '../slices/readingPlansSlice';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type ReadingSessionScreenRouteProp = RouteProp<RootStackParamList, 'ReadingSession'>;
type ReadingSessionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ReadingSession'>;

interface ReadingSessionScreenProps {
  route: ReadingSessionScreenRouteProp;
  navigation: ReadingSessionScreenNavigationProp;
}

const ReadingSessionScreen: React.FC<ReadingSessionScreenProps> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { bookId, planId } = route.params;
  const dispatch = useDispatch<AppDispatch>();

  // Données de l'application
  const book = useSelector((state: RootState) => 
    state.books.books?.find(b => b.id === parseInt(bookId, 10))
  );
  
  const plan = useSelector((state: RootState) => 
    state.readingPlans.plans?.find(p => p.id === parseInt(planId || '', 10))
  );

  const sessions = useSelector((state: RootState) => 
    state.readingPlans.readingSessions?.filter(s => 
      s.book_id === parseInt(bookId, 10) && 
      (planId ? s.reading_plan_id === parseInt(planId, 10) : true)
    ) || []
  );

  const [isLoading, setIsLoading] = useState(true);

  // Calcul des statistiques
  const { totalPages, totalMinutes, totalKoach } = useMemo(() => {
    return sessions.reduce((acc, session) => ({
      totalPages: acc.totalPages + (session.pages_read || 0),
      totalMinutes: acc.totalMinutes + (session.minutes_spent || 0),
      totalKoach: acc.totalKoach + (session.koach_earned || 0)
    }), { totalPages: 0, totalMinutes: 0, totalKoach: 0 });
  }, [sessions]);

  const progress = useMemo(() => {
    if (!book?.total_pages || !plan?.current_page) return 0;
    return Math.min(Math.max(plan.current_page / book.total_pages, 0), 1);
  }, [book, plan]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          dispatch(fetchBooks()),
          dispatch(fetchReadingPlans()),
          dispatch(fetchReadingSessions())
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [dispatch, bookId, planId]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A2BE2" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('book.notFound')}</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          {t('common.goBack')}
        </Button>
      </View>
    );
  }

  // Handlers
  const handleOpenPDF = () => navigation.navigate('MediaViewer', { bookId, type: 'pdf' });
  const handleAudio = () => alert(t('common.comingSoon'));
  const handleEditPlan = () => navigation.navigate('EditReadingPlan', { planId });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* En-tête du livre */}
      <View style={styles.header}>
        <Image
          source={{ uri: book.cover_url || 'https://via.placeholder.com/150' }}
          style={styles.bookCover}
        />
        <View style={styles.headerText}>
          <Text style={styles.bookTitle}>{book.title}</Text>
          <Text style={styles.bookAuthor}>
            {t('common.author')}: {book.author?.name || t('common.unknownAuthor')}
          </Text>
          
          {plan && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {t('readingPlan.progress')}: {plan.current_page}/{book.total_pages}
              </Text>
              <ProgressBar 
                progress={progress} 
                color="#8A2BE2" 
                style={styles.progressBar} 
              />
              <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
            </View>
          )}
        </View>
      </View>

      {/* Statistiques */}
      <View style={styles.statsContainer}>
        <StatBox 
          icon="book-open" 
          value={sessions.length} 
          label={t('readingSession.sessions')} 
          color="#8A2BE2"
        />
        <StatBox 
          icon="bookmark" 
          value={totalPages} 
          label={t('readingSession.pagesRead')} 
          color="#4CAF50"
        />
        <StatBox 
          icon="clock" 
          value={`${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`} 
          label={t('readingSession.timeSpent')} 
          color="#FF9800"
        />
        <StatBox 
          icon="star" 
          value={totalKoach} 
          label={t('common.points')} 
          color="#FFD700"
        />
      </View>

      {/* Boutons d'action */}
      <View style={styles.actions}>
        <ActionButton 
          icon="book-open" 
          label={t('readingSession.readBook')} 
          onPress={handleOpenPDF}
          primary
        />
        <ActionButton 
          icon="headphones" 
          label={t('readingSession.listenAudio')} 
          onPress={handleAudio}
        />
        {plan && (
          <ActionButton 
            icon="calendar-edit" 
            label={t('readingSession.editPlan')} 
            onPress={handleEditPlan}
            primary
          />
        )}
      </View>

      {/* Historique des sessions */}
      <Text style={styles.sectionTitle}>{t('readingSession.history')}</Text>
      {sessions.length === 0 ? (
        <Text style={styles.emptyText}>{t('readingSession.noSessions')}</Text>
      ) : (
        sessions.map((session) => (
          <SessionItem key={session.id} session={session} />
        ))
      )}
    </ScrollView>
  );
};

// Composants réutilisables
const StatBox = ({ icon, value, label, color }: { icon: string, value: any, label: string, color: string }) => (
  <View style={styles.statBox}>
    <Icon name={icon} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ActionButton = ({ icon, label, onPress, primary = false }: { icon: string, label: string, onPress: () => void, primary?: boolean }) => (
  <Button
    mode={primary ? "contained" : "outlined"}
    icon={icon}
    onPress={onPress}
    style={[styles.actionButton, primary && styles.primaryButton]}
    labelStyle={styles.actionLabel}
  >
    {label}
  </Button>
);

const SessionItem = ({ session }: { session: any }) => (
  <View style={styles.sessionItem}>
    <Icon name="calendar" size={20} color="#8A2BE2" style={styles.sessionIcon} />
    <View style={styles.sessionDetails}>
      <Text style={styles.sessionDate}>
        {new Date(session.session_date).toLocaleDateString()}
      </Text>
      <Text style={styles.sessionInfo}>
        {session.pages_read} {t('readingSession.pages')} • {Math.floor(session.minutes_spent / 60)}h {session.minutes_spent % 60}m
      </Text>
    </View>
    <View style={styles.sessionPoints}>
      <Icon name="star" size={16} color="#FFD700" />
      <Text style={styles.pointsText}>{session.koach_earned}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#8A2BE2',
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EDE7F6',
    marginBottom: 4,
  },
  progressPercent: {
    fontSize: 14,
    color: '#8A2BE2',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: '#8A2BE2',
  },
  actionLabel: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8A2BE2',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 24,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  sessionIcon: {
    marginRight: 12,
  },
  sessionDetails: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sessionInfo: {
    fontSize: 12,
    color: '#666',
  },
  sessionPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pointsText: {
    marginLeft: 4,
    fontWeight: 'bold',
    color: '#FFA000',
  },
});

export default ReadingSessionScreen;