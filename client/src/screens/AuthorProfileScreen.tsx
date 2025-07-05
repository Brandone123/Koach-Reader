import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { selectBooks } from '../slices/booksSlice';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, useTheme } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';

interface AuthorProfileScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'AuthorProfile'>;
  route: RouteProp<RootStackParamList, 'AuthorProfile'>;
}

const AuthorProfileScreen: React.FC<AuthorProfileScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { authorId } = route.params;
  const books = useSelector(selectBooks);
  // On suppose que chaque book.author est bien renseigné
  const author = books.find(b => b.author?.id === authorId)?.author;
  const authorBooks = books.filter(b => b.author?.id === authorId);

  if (!author) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Avatar.Image size={96} source={{ uri: author.profile_image_url || 'https://via.placeholder.com/96' }} />
        <Text style={styles.authorName}>{author.name}</Text>
        {author.country && <Text style={styles.authorCountry}>{author.country}</Text>}
        {author.language && <Text style={styles.authorLanguage}>{author.language}</Text>}
        {author.website && (
          <Button mode="text" onPress={() => {}} style={styles.websiteButton}>
            {author.website}
          </Button>
        )}
      </View>
      <Text style={styles.authorDescription}>{author.description}</Text>
      <Text style={styles.sectionTitle}>{t('author.booksByAuthor')}</Text>
      <View style={styles.booksList}>
        {authorBooks.length === 0 ? (
          <Text style={styles.noBooks}>{t('author.noBooks')}</Text>
        ) : (
          authorBooks.map(book => (
            <TouchableOpacity
              key={book.id}
              style={styles.bookCard}
              onPress={() => navigation.navigate('BookDetail', { bookId: book.id.toString() })}
            >
              <Image
                source={{ uri: book.cover_url || book.cover_image || 'https://via.placeholder.com/80x120' }}
                style={styles.bookImage}
              />
              <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 20 },
  authorName: { fontSize: 24, fontWeight: 'bold', marginTop: 12 },
  authorCountry: { fontSize: 16, color: '#888', marginTop: 4 },
  authorLanguage: { fontSize: 16, color: '#888', marginTop: 2 },
  websiteButton: { marginTop: 8 },
  authorDescription: { fontSize: 16, color: '#444', marginBottom: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, alignSelf: 'flex-start' },
  booksList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  bookCard: { width: 100, margin: 8, alignItems: 'center' },
  bookImage: { width: 80, height: 120, borderRadius: 8, marginBottom: 4 },
  bookTitle: { fontSize: 14, textAlign: 'center' },
  noBooks: { color: '#888', fontStyle: 'italic' },
});

export default AuthorProfileScreen; 