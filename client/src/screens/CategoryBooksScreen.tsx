import React from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  RefreshControl,
  Dimensions 
} from 'react-native';
import { 
  Title, 
  Text, 
  useTheme,
  IconButton
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useTranslation } from 'react-i18next';
import { selectBooks, selectBooksLoading } from '../slices/booksSlice';
import BookCard from '../components/BookCard';
import { Book } from '../types/book';

const { width } = Dimensions.get('window');

type CategoryBooksScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CategoryBooks'>;
type CategoryBooksScreenRouteProp = RouteProp<RootStackParamList, 'CategoryBooks'>;

interface CategoryBooksScreenProps {
  navigation: CategoryBooksScreenNavigationProp;
  route: CategoryBooksScreenRouteProp;
}

const CategoryBooksScreen: React.FC<CategoryBooksScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { categoryId, categoryName } = route.params;
  const dispatch = useDispatch();

  const books = useSelector(selectBooks);
  const isLoading = useSelector(selectBooksLoading);

  const filteredBooks = books.filter(book => 
    book.categories?.some(cat => typeof cat === 'object' && cat.id === categoryId)
  );

  React.useEffect(() => {
    navigation.setOptions({
      headerTitle: categoryName,
      headerLeft: () => (
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      ),
    });
  }, [navigation, categoryName]);

  const renderBook = ({ item }: { item: Book }) => (
    <BookCard
      book={item}
      onPress={() => navigation.navigate('BookDetail', { bookId: item.id.toString() })}
      style={styles.bookCard}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredBooks}
        renderItem={renderBook}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {t('book.noBooksInCategory')}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  bookCard: {
    width: (width - 48) / 2,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  backButton: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default CategoryBooksScreen; 