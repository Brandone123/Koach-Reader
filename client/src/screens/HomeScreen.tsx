import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Chip, 
  Button, 
  Searchbar,
  ProgressBar,
  Divider,
  Avatar,
  Surface,
  useTheme,
  FAB
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchBooks, 
  selectBooks,
  selectFilteredBooks,
  selectBooksLoading,
  setSelectedCategory,
  selectSelectedCategory,
  Book
} from '../slices/booksSlice';
import {
  fetchCategories,
  selectCategories,
  selectCategoriesLoading,
  Category
} from '../slices/categoriesSlice';
import { selectUser } from '../slices/authSlice';
import { 
  fetchReadingPlans, 
  selectReadingPlans, 
  selectReadingPlansLoading 
} from '../slices/readingPlansSlice';
import { 
  fetchFreeQuarterlyBooks, 
  selectFreeQuarterlyBooks, 
  selectFreeQuarterlyBooksLoading 
} from '../slices/freeQuarterlyBooksSlice';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { AppDispatch } from '../store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from "expo-linear-gradient";
import FreeQuarterlyBooksSection from '../components/FreeQuarterlyBooksSection';

// Define interface for User to have name property
interface ExtendedUser {
  name?: string;
  preferences?: {
    preferredCategories?: string[];
  };
  is_premium?: boolean;
  is_admin?: boolean;
}

// Ajout des interfaces pour les groupes et communautés
interface ReadingGroup {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  backgroundImage: string;
  currentBook: string;
}

interface Community {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  backgroundImage: string;
  category: string;
}

// Mise à jour des données avec de meilleures images
const dummyCommunities: Community[] = [
  {
    id: 1,
    name: "MILIS Community",
    description: "Milestones in Life & Scripture",
    memberCount: 1250,
    backgroundImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop&q=80",
    category: "Spiritual Growth"
  },
  {
    id: 2,
    name: "ICC Community", 
    description: "Impact Centre Chrétien",
    memberCount: 890,
    backgroundImage: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=250&fit=crop&q=80",
    category: "Christian Impact"
  },
  {
    id: 3,
    name: "Compassion Community",
    description: "Église La Compassion",
    memberCount: 2100,
    backgroundImage: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=250&fit=crop&q=80",
    category: "Church Community"
  },
  {
    id: 4,
    name: "O-Livre Community",
    description: "Librairie Chrétienne en Ligne",
    memberCount: 1680,
    backgroundImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop&q=80",
    category: "Christian Literature"
  }
];

const dummyReadingGroups: ReadingGroup[] = [
  {
    id: 1,
    name: "Bible Study Circle",
    description: "Étude approfondie des Écritures",
    memberCount: 45,
    backgroundImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop&q=80"
  },
  {
    id: 2,
    name: "Christian Fiction Lovers",
    description: "Romans chrétiens contemporains",
    memberCount: 32,
    backgroundImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop&q=80"
  },
  {
    id: 3,
    name: "Theology Deep Dive",
    description: "Théologie systématique avancée",
    memberCount: 28,
    backgroundImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=250&fit=crop&q=80"
  },
  {
    id: 4,
    name: "Youth Ministry Books",
    description: "Ressources pour le ministère jeunesse",
    memberCount: 67,
    backgroundImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop&q=80"
  }
];

// Composant corrigé pour les cartes de groupes de lecture
const ReadingGroupCard = ({ group, navigation }: { group: ReadingGroup; navigation: any }) => {
  const getGroupImage = (name: string) => {
    switch (name) {
      case "Bible Study Circle":
        return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop&q=80";
      case "Christian Fiction Lovers":
        return "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop&q=80";
      case "Theology Deep Dive":
        return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=250&fit=crop&q=80";
      case "Youth Ministry Books":
        return "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop&q=80";
      default:
        return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop&q=80";
    }
  };

  return (
    <TouchableOpacity 
      style={styles.readingGroupCard}
      onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
    >
      <Image 
        source={{ uri: getGroupImage(group.name) }} 
        style={styles.groupBackgroundImage}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
        style={styles.groupOverlay}
      >
        <View style={styles.groupContent}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupDescription}>{group.description}</Text>
          <View style={styles.groupMemberBadge}>
            <Text style={styles.groupMemberText}>{group.memberCount} membres</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Composant corrigé pour les cartes de communautés
const CommunityCard = ({ community, navigation }: { community: Community; navigation: any }) => {
  const getCommunityIcon = (name: string) => {
    switch (name) {
      case "MILIS Community":
        return "book-cross";
      case "ICC Community":
        return "hand-heart";
      case "Compassion Community":
        return "heart-multiple";
      case "O-Livre Community":
        return "book-open-variant";
      default:
        return "book";
    }
  };

  const getCommunityColor = (name: string) => {
    switch (name) {
      case "MILIS Community":
        return "#4A90E2"; // Bleu spirituel
      case "ICC Community":
        return "#F39C12"; // Orange impact
      case "Compassion Community":
        return "#E74C3C"; // Rouge compassion
      case "O-Livre Community":
        return "#27AE60"; // Vert littérature
      default:
        return "#8A2BE2";
    }
  };

  const getCommunityImage = (name: string) => {
    switch (name) {
      case "MILIS Community":
        return "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop&q=80"; // Livres et Bible
      case "ICC Community":
        return "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=250&fit=crop&q=80"; // Église moderne
      case "Compassion Community":
        return "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=250&fit=crop&q=80"; // Mains qui prient
      case "O-Livre Community":
        return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop&q=80"; // Librairie
      default:
        return "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop&q=80";
    }
  };

  return (
    <TouchableOpacity 
      style={styles.communityCard}
      onPress={() => navigation.navigate('CommunityDetail', { communityId: community.id })}
    >
      <Image 
        source={{ uri: getCommunityImage(community.name) }} 
        style={styles.communityBackgroundImage}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
        style={styles.communityOverlay}
      >
        <View style={styles.communityHeader}>
          <View style={[styles.communityIconContainer, { backgroundColor: getCommunityColor(community.name) }]}>
            <MaterialCommunityIcons 
              name={getCommunityIcon(community.name)} 
              size={20} 
              color="white" 
            />
          </View>
          <View style={styles.communityBadge}>
            <Text style={styles.communityCategory}>{community.category}</Text>
          </View>
        </View>
        
        <View style={styles.communityContent}>
          <Text style={styles.communityName}>{community.name}</Text>
          <Text style={styles.communityDescription}>{community.description}</Text>
          
          <View style={styles.communityFooter}>
            <View style={styles.memberInfo}>
              <MaterialCommunityIcons name="account-group" size={14} color="rgba(255,255,255,0.9)" />
              <Text style={styles.communityMembers}>{community.memberCount.toLocaleString()}</Text>
            </View>
            <View style={[styles.joinIndicator, { backgroundColor: getCommunityColor(community.name) }]}>
              <MaterialCommunityIcons name="plus" size={12} color="white" />
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const BookCard = ({ book, onPress }: { book: Book; onPress: () => void }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  
  return (
    <TouchableOpacity 
      style={[styles.bookCard, { backgroundColor: theme.colors.surface }]} 
      onPress={onPress}
    >
      <Image 
        source={{ uri: book.cover_url || book.cover_image || 'https://via.placeholder.com/150' }} 
        style={styles.bookCover} 
      />
      <Text style={[styles.bookTitle, { color: '#333333' }]} numberOfLines={2}>
        {book.title}
      </Text>
      <Text style={[styles.bookAuthor, { color: '#666666' }]} numberOfLines={1}>
        {book.author?.name || t('common.unknownAuthor')}
      </Text>
    </TouchableOpacity>
  );
};

const CategorySection = ({ category, books, navigation }: { 
  category: string; 
  books: Book[]; 
  navigation: any;
}) => {
  const theme = useTheme();
  
  return (
    <View style={styles.categorySection}>
      <Text style={[styles.categoryTitle, { color: theme.colors.primary }]}>
        {category}
      </Text>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <BookCard 
            book={item} 
            onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser) as ExtendedUser;
  
  // Books and categories state
  const books = useSelector(selectFilteredBooks);
  const categories = useSelector(selectCategories);
  const selectedCategory = useSelector(selectSelectedCategory);
  const isBooksLoading = useSelector(selectBooksLoading);
  const isCategoriesLoading = useSelector(selectCategoriesLoading);
  
  // Reading plans state
  const readingPlans = useSelector(selectReadingPlans);
  const isPlansLoading = useSelector(selectReadingPlansLoading);
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch initial data
    dispatch(fetchBooks());
    dispatch(fetchCategories(i18n.language));
    dispatch(fetchReadingPlans());
  }, [dispatch, i18n.language]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchBooks()),
      dispatch(fetchCategories(i18n.language)),
      dispatch(fetchReadingPlans())
    ]);
    setRefreshing(false);
  }, [dispatch, i18n.language]);

  // Filter books based on search query
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = !searchQuery || 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (book.author?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [books, searchQuery]);

  // Get free books
  const freeBooks = useMemo(() => {
    return books.filter(book => book.is_free).map(book => {
      const expirationDate = new Date(book.updated_at);
      expirationDate.setMonth(expirationDate.getMonth() + 3);
      return {
        id: book.id,
        title: book.title,
        author: book.author?.name || t('common.unknownAuthor'),
        description: book.description || '',
        cover_url: book.cover_url || book.cover_image || 'https://via.placeholder.com/150',
        total_pages: book.total_pages,
        is_free: !!book.is_free,
        category: book.categories?.[0]?.name || 'general',
        updated_at: book.updated_at,
        expiration_date: expirationDate.toISOString(),
        days_remaining: Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      };
    });
  }, [books]);

  const handleFreeBookPress = (bookId: number) => {
    navigation.navigate('BookDetail', { bookId: bookId.toString() });
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.selectedCategoryItem
      ]}
      onPress={() => dispatch(setSelectedCategory(selectedCategory === item.id ? null : item.id))}
    >
      <Avatar.Icon 
        size={32} 
        icon={item.icon_name || 'book'}
        style={[
          styles.categoryIcon,
          selectedCategory === item.id && styles.selectedCategoryIcon
        ]}
        color={selectedCategory === item.id ? '#FFFFFF' : '#8A2BE2'}
      />
      <Text 
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.selectedCategoryText
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderBookItem = ({ item }: { item: Book }) => (
    <Card 
      style={styles.bookCard}
      onPress={() => navigation.navigate('BookDetail', { bookId: item.id.toString() })}
    >
      <Card.Cover 
        source={{ 
          uri: item.cover_url || 
               item.cover_image || 
               'https://amjodckmmxmpholspskm.supabase.co/storage/v1/object/public/covers//book.jpg'
        }} 
        style={styles.bookCover}
      />
      <Card.Content>
        <View style={styles.chipContainer}>
          <Text style={styles.chip}>{item.viewers || 0}</Text>
          <Avatar.Icon 
            size={30} 
            icon={'eye'} 
            style={[{ backgroundColor: '#c0c0c0'}]} 
          />
          <Divider style={styles.divider} /> 
          <Text style={styles.chip}>{item.rating || 0}</Text>
          <Avatar.Icon 
            size={30} 
            icon={'star'} 
            style={[styles.rankIcon, { backgroundColor: '#f5b700'}]} 
          />
        </View>
        <Title numberOfLines={2} style={styles.bookTitle}>{item.title}</Title>
        <Paragraph numberOfLines={1} style={styles.bookAuthor}>
          {item.author?.name || t('common.unknownAuthor')}
        </Paragraph>
      </Card.Content>
    </Card>
  );

  const renderPlanItem = ({ item }: { item: any }) => {
    const book = books.find(b => b.id === item.book_id);
    if (!book) return null;

    const progress = (item.current_page / book.total_pages) * 100;
    const daysLeft = Math.ceil((new Date(item.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
      <Card style={styles.planCard}>
        <Card.Cover 
          source={{ uri: book.cover_url || book.cover_image || 'https://via.placeholder.com/150' }} 
          style={styles.planCover}
        />
        <Card.Content>
          <Title numberOfLines={2} style={styles.planTitle}>{book.title}</Title>
          <View style={styles.progressContainer}>
            <ProgressBar 
              progress={progress / 100} 
              color="#8A2BE2" 
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
          <Text style={styles.daysLeft}>
            {daysLeft} {t('home.daysLeft')}
          </Text>
          <Text style={styles.dailyGoal}>
            {t('home.dailyGoal')}: {item.daily_goal} {t('home.pages')}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  // Loading state
  if ((isBooksLoading && books.length === 0) || (isCategoriesLoading && categories.length === 0)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8A2BE2']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            {t('home.welcomeBack')}, {user?.name || 'Reader'}!
          </Text>
          <Text style={styles.subHeadText}>{t('home.subHeadText')}</Text>
        </View>

        {/* Free Books Section */}
        {freeBooks.length > 0 && (
          <FreeQuarterlyBooksSection 
            books={freeBooks}
            onBookPress={handleFreeBookPress}
          />
        )}

        <Divider style={styles.divider} />

        {/* Reading Plans Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              {/* <MaterialCommunityIcons name="book-clock-outline" size={24} color="#8A2BE2" /> */}
              <Text style={styles.sectionTitle}>{t('home.readingPlans')}</Text>
            </View>
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('ReadingPlan', { bookId: "" })}
              disabled={isPlansLoading}
              icon="plus"
              style={styles.sectionTitleButton}
              color="#8A2BE2"
              compact
            >
              {t('home.newPlan')}
            </Button>
          </View>
          
          {readingPlans.length === 0 ? (
            <Surface style={styles.emptyPlansContainer} elevation={1}>
              <MaterialCommunityIcons name="book-open-page-variant" size={48} color="#8A2BE2" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>
                {t('home.noPlansYet')}
              </Text>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('ReadingPlan', { bookId: "" })}
                style={styles.emptyButton}
                icon="book-plus"
              >
                {t('home.createReadingPlan')}
              </Button>
            </Surface>
          ) : (
            <View style={styles.plansListContainer}>
              <FlatList
                data={readingPlans}
                renderItem={({ item }) => {
                  const book = books.find(b => b.id === item.book_id);
                  if (!book) return null;
                  
                  const progress = (item.current_page / book.total_pages) * 100;
                  const daysLeft = Math.ceil((new Date(item.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const isOnTrack = item.current_page >= (book.total_pages * ((new Date().getTime() - new Date(item.start_date).getTime()) / 
                    (new Date(item.end_date).getTime() - new Date(item.start_date).getTime())));
                  
                  return (
                    <TouchableOpacity
                       onPress={() => navigation.navigate('ReadingSession', { bookId: book.id.toString(), planId: item.id.toString() })}
                      style={styles.planCardContainer}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={['#8A2BE2', '#4B0082']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.planCardGradient}
                      >
                        <View style={styles.planCardContent}>
                          <Image
                            source={{ uri: book.cover_url || book.cover_image || 'https://via.placeholder.com/150' }}
                            style={styles.planCoverImage}
                          />
                          <View style={styles.planDetails}>
                            <Text style={styles.planBookTitle} numberOfLines={1}>{book.title}</Text>
                            <View style={styles.planProgressContainer}>
                              <View style={styles.planProgressBarContainer}>
                                <View style={[styles.planProgressFill, { width: `${progress}%` }]} />
                              </View>
                              <Text style={styles.planProgressText}>{Math.round(progress)}%</Text>
                            </View>
                            <View style={styles.planStatsRow}>
                              <View style={styles.planStat}>
                                <MaterialCommunityIcons name="calendar-clock" size={16} color="#fff" />
                                <Text style={styles.planStatText}>
                                  {daysLeft} {t('home.daysLeft')}
                                </Text>
                              </View>
                              <View style={styles.planStat}>
                                <MaterialCommunityIcons name="book-open-variant" size={16} color="#fff" />
                                <Text style={styles.planStatText}>
                                  {item.current_page}/{book.total_pages}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.planFooter}>
                              <View style={[styles.planStatusBadge, { backgroundColor: isOnTrack ? '#4CAF50' : '#FFA000' }]}> 
                                <MaterialCommunityIcons 
                                  name={isOnTrack ? "check-circle" : "alert-circle"} 
                                  size={14} 
                                  color="#fff" 
                                />
                                <Text style={styles.planStatusText}>
                                  {isOnTrack ? t('home.onTrack') : t('home.behindSchedule')}
                                </Text>
                              </View>
                              <Button
                                mode="contained"
                                compact
                                style={[
                                  styles.continueReadingButton,
                                  {
                                    paddingHorizontal: 10,
                                    backgroundColor: '#8A2BE2',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    elevation: 2,
                                  },
                                ]}
                                labelStyle={[
                                  styles.continueReadingButtonLabel,
                                  {
                                    fontSize: 12,
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    letterSpacing: 0.5,
                                  },
                                ]}
                                onPress={e => {
                                  e.stopPropagation();
                                  navigation.navigate('MediaViewer', {
                                    bookId: book.id.toString(),
                                    type: 'pdf'
                                  });
                                }}
                              >
                                {t('home.continue')}
                              </Button>
                            </View>
                          </View>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                }}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.plansListContent}
                keyExtractor={(item) => item.id.toString()}
              />
            </View>
          )}
        </View>
        
        <Divider style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.browseByCategory')}</Text>
          </View>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={item => `category-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery 
                ? t('common.searchResults')
                : (selectedCategory
                    ? categories.find(c => c.id === selectedCategory)?.name
                    : t('common.allBooks'))}
            </Text>
          </View>
          
          <Searchbar
            placeholder={t('common.searchBooks')}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            iconColor="#8A2BE2"
          />
          
          {filteredBooks.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>
                  {searchQuery 
                    ? t('common.noBooksFound')
                    : t('common.noBooksAvailable')}
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <FlatList
              data={filteredBooks}
              renderItem={renderBookItem}
              keyExtractor={item => `book-${item.id.toString()}`}
              horizontal={false}
              numColumns={2}
              columnWrapperStyle={styles.bookGrid}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Section des groupes de lecture */}
        <Divider style={styles.divider} />
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.readingGroups')}</Text>
            <Button 
              mode="text" 
              onPress={() => {/* Navigation vers tous les groupes */}}
              icon="arrow-right"
              style={styles.sectionTitleButton}
              color="#8A2BE2"
              compact
            >
              {t('common.viewAll')}
            </Button>
          </View>
          
          <FlatList
            data={dummyReadingGroups}
            renderItem={({ item }) => <ReadingGroupCard group={item} navigation={navigation} />}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.groupsList}
          />
        </View>

        {/* Section des communautés */}
        <Divider style={styles.divider} />
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.communities')}</Text>
            <Button 
              mode="text" 
              onPress={() => {/* Navigation vers toutes les communautés */}}
              icon="arrow-right"
              style={styles.sectionTitleButton}
              color="#8A2BE2"
              compact
            >
              {t('common.viewAll')}
            </Button>
          </View>
          
          <FlatList
            data={dummyCommunities}
            renderItem={({ item }) => <CommunityCard community={item} navigation={navigation} />}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.communitiesList}
          />
        </View>
      </ScrollView>
      
      {/* Admin-only FAB for adding new books */}
      {user?.is_admin && (
        <FAB
          style={styles.fab}
          icon="plus"
          // label={t('home.addBook')}
          onPress={() => navigation.navigate('AddBook', {})}
          color="white"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    bottom: 50,
  },
  refreshControl: {
    top: 50,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 80, // Space for bottom navigation
  },
  subHeadText: {
    color: "rgba(255,255,255,0.8)",
  },
  header: {
    backgroundColor: '#9317ED',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    padding: 20,
    marginBottom: 20,
    marginTop: 30,
    // Ajout d'une ombre pour donner du relief
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  statItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 14,
    marginRight: 18,
    minWidth: 110,
    alignItems: 'center',
    // Ajout d'une ombre légère
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  searchbar: {
    marginBottom: 20,
    elevation: 2,
    borderRadius: 15,
    backgroundColor: 'white',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  section: {
    marginBottom: 28,
    paddingHorizontal: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 14,
  },
  plansList: {
    paddingRight: 2,
    padding: 5,
  },
  bookGrid: {
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  planCard: {
    width: '100%',
    marginRight: 10,
    borderRadius: 15,
    elevation: 3,
  },
  bookCard: {
    width: (width - 32) / 2,
    marginTop: 30,
    borderRadius: 10,
    // margin: 4,
    // Ajout d'une ombre
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 5,
  },
  bookCover: {
    // height: 160,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,

    position: 'relative',
    top: -30,
    left: 5,
    right: 20,
    width: 110,
    height: 160,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  chipContainer: {
    marginTop: -155,
    marginBottom: 10,
    marginLeft: 107,
  },
  rankIcon: {
    // marginRight: 5,
    // color: '#f5b700',
    alignItems: 'center',
  },
  chip: {
    color: 'gray',
    fontSize: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
  },
  planDetails: {
    flex: 1,
    // flexDirection: 'row',
    justifyContent: 'space-between',
    // alignItems: 'center',
    marginTop: 8,
  },
  planDetailText: {
    fontSize: 12,
    color: '#666',
  },
  emptyCard: {
    marginVertical: 10,
    borderRadius: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#666',
  },
  emptyButton: {
    marginTop: 10,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 10,
  },
  divider: {
    marginVertical: 8,
    backgroundColor: '#e0e0e0',
    height: 1,
  },
  // Category styles
  categoriesList: {
    paddingVertical: 8,
  },
  categoryItem: {
    marginRight: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCategoryItem: {
    backgroundColor: '#8A2BE2',
  },
  categoryIcon: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    marginRight: 8,
  },
  selectedCategoryIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryText: {
    color: '#8A2BE2',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Featured books styles
  featuredBooksList: {
    paddingVertical: 8,
  },
  featuredBookContainer: {
    width: 180,
    height: 280,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
    // Ajout d'une ombre
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  featuredBookCover: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  featuredBookOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  featuredBookTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featuredBookAuthor: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  ratingContainer: {
    position: 'absolute',
    top: -30,
    right: 10,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredSection: {
    marginBottom: 28,
    paddingHorizontal: 18,
  },
  categorySection: {
    marginBottom: 28,
    paddingHorizontal: 18,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 14,
  },
  featuredCover: {
    width: 300,
    height: 150,
    borderRadius: 16,
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  featuredTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featuredAuthor: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  bookAuthor: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666666',
  },
  searchBar: {
    marginBottom: 20,
    elevation: 2,
    borderRadius: 15,
    backgroundColor: 'white',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  booksList: {
    paddingVertical: 8,
  },
  planCover: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  daysLeft: {
    fontSize: 12,
    color: '#666',
  },
  dailyGoal: {
    fontSize: 12,
    color: '#666',
  },
  sectionTitleButton: {
    marginTop: -10,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newPlanButton: {
    backgroundColor: '#8A2BE2',
    borderRadius: 20,
    paddingHorizontal: 8,
  },
  newPlanButtonLabel: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyPlansContainer: {
    alignItems: 'center',
    padding: 24,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.7,
  },
  planCardContainer: {
    width: 325,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  plansListContainer: {
    marginBottom: 0,
  },
  plansListContent: {
    paddingHorizontal: 5,
    paddingVertical: 8,
  },
  planCardGradient: {
    borderRadius: 12,
  },
  planCardContent: {
    flexDirection: 'row',
    padding: 5,
  },
  planCoverImage: {
    width: 80,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
  },
  planBookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  planProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planProgressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  planProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  planProgressText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  planStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planStatText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planStatusText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 4,
  },
  continueReadingButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  continueReadingButtonLabel: {
    color: '#8A2BE2',
    fontSize: 10,
    padding: 0,
  },
  loadingPlansContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 60,
    backgroundColor: '#8A2BE2',
  },
  readingGroupCard: {
    width: 280,
    height: 160,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  groupBackgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  groupOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  groupContent: {
    alignItems: 'flex-start',
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  groupMemberBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  groupMemberText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  communityCard: {
    width: 220,
    height: 160,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  communityBackgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  communityOverlay: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  communityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  communityIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  communityBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  communityCategory: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  communityContent: {
    alignItems: 'flex-start',
  },
  communityName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  communityDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 12,
    lineHeight: 16,
  },
  communityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityMembers: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginLeft: 4,
  },
  joinIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  groupsList: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  communitiesList: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});

export default HomeScreen;


