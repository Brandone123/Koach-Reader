import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, IconButton } from 'react-native-paper';
import { Book } from '../types/book';

interface BookCardProps {
  book: Book;
  onPress: () => void;
  style?: any;
}

const BookCard: React.FC<BookCardProps> = ({ book, onPress, style }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={[styles.card, style]}>
        <Card.Cover 
          source={{ uri: book.cover_url || book.cover_image || 'https://via.placeholder.com/300x450' }}
          style={styles.cover}
        />
        <Card.Content style={styles.content}>
          <Title numberOfLines={2} style={styles.title}>{book.title}</Title>
          <Paragraph numberOfLines={1} style={styles.author}>{book.author}</Paragraph>
          
          <View style={styles.stats}>
            <View style={styles.stat}>
              <IconButton 
                icon="eye" 
                size={16} 
                style={styles.icon}
              />
              <Paragraph style={styles.statText}>{book.viewers || 0}</Paragraph>
            </View>
            <View style={styles.stat}>
              <IconButton 
                icon="star" 
                size={16} 
                style={styles.icon}
              />
              <Paragraph style={styles.statText}>{book.rating || 0}</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    elevation: 4,
  },
  cover: {
    height: 200,
  },
  content: {
    padding: 8,
  },
  title: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  author: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    marginLeft: -4,
  },
  icon: {
    margin: 0,
    padding: 0,
  }
});

export default BookCard; 