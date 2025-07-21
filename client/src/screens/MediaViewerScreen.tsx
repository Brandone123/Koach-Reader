import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Alert, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import { selectBooks } from '../slices/booksSlice';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import AudioPlayer from '../components/AudioPlayer';
import { useTranslation } from 'react-i18next';
import { supabase, fixSupabaseStorageUrl } from '../lib/supabase';
import WebView from 'react-native-webview';
import { Button, IconButton } from 'react-native-paper';
import * as FileSystem from 'expo-file-system';

type MediaViewerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MediaViewer'>;
type MediaViewerScreenRouteProp = RouteProp<RootStackParamList, 'MediaViewer'>;

interface MediaViewerScreenProps {
  navigation: MediaViewerScreenNavigationProp;
  route: MediaViewerScreenRouteProp;
}

const MediaViewerScreen: React.FC<MediaViewerScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { bookId, type } = route.params;
  const books = useSelector(selectBooks);
  const book = books.find(b => b.id === parseInt(bookId));
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const pdfRef = useRef<any>(null);
  
  // Function to check and fix local URLs
  const checkAndFixLocalUrl = async () => {
    if (!book) return null;
    
    let url = type === 'pdf' ? book.pdf_url : book.audio_url;
    
    // If URL is empty or undefined
    if (!url) {
      console.log(`${type.toUpperCase()} URL is undefined or empty for book ID:${book.id}`);
      return null;
    }
    
    // If URL is a local path, fix it in the database
    if (url.startsWith('file://')) {
      console.error(`${type.toUpperCase()} URL is a local path:`, url);
      
      try {
        // Update database to remove local URL
        const updates = type === 'pdf' ? { pdf_url: null } : { audio_url: null };
        
        const { error } = await supabase
          .from('books')
          .update(updates)
          .eq('id', book.id);
          
        if (error) {
          console.error('Error fixing URL:', error);
        } else {
          console.log(`${type} URL fixed in database`);
        }
        
        // Return null as URL is not usable
        return null;
      } catch (error) {
        console.error('Error updating URL:', error);
        return null;
      }
    }
    
    // Check that URL starts with http or https
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.error(`${type.toUpperCase()} URL invalid (neither http nor https):`, url);
      return null;
    }
    
    // If URL is not in the correct format, fix it
    if (!url.includes('/storage/v1/object/public/')) {
      // Extract filename
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      
      // Determine bucket based on type
      const bucket = type === 'pdf' ? 'books' : 'covers';
      
      // Construct the correct URL format
      const fixedUrl = `https://amjodckmmxmpholspskm.supabase.co/storage/v1/object/public/${bucket}/${filename}`;
      console.log(`${type.toUpperCase()} URL format fixed:`, fixedUrl);
      
      // Update the URL in the database with the fixed URL
      try {
        const updates = type === 'pdf' ? { pdf_url: fixedUrl } : { audio_url: fixedUrl };
        
        const { error } = await supabase
          .from('books')
          .update(updates)
          .eq('id', book.id);
          
        if (error) {
          console.error('Error updating URL format:', error);
        } else {
          console.log(`${type} URL format updated in database`);
        }
      } catch (error) {
        console.error('Error updating URL format:', error);
      }
      
      // Return the fixed URL
      return fixedUrl;
    }
    
    // URL is valid and in correct format
    console.log(`${type.toUpperCase()} URL valid:`, url);
    
    return url;
  };

  // Update reading progress to database
  const updateReadingProgress = async (pageNumber: number) => {
    if (!book || !bookId) return;
    
    try {
      // Check if we have a reading record for this book
      const { data: existingData, error: checkError } = await supabase
        .from('user_books')
        .select('id, current_page')
        .eq('book_id', bookId)
        .single();
        
      const now = new Date().toISOString();
      
      if (existingData) {
        // Only update if new page is further along
        if (pageNumber > (existingData.current_page || 0)) {
          await supabase
            .from('user_books')
            .update({
              current_page: pageNumber,
              last_read_date: now,
              updated_at: now
            })
            .eq('id', existingData.id);
        }
      } else {
        // Create new record
        await supabase
          .from('user_books')
          .insert({
            user_id: 'current-user', // This should be replaced with actual user ID
            book_id: bookId,
            current_page: pageNumber,
            last_read_date: now,
            is_favorite: false
          });
      }
      
      console.log(`Updated reading progress for book ${bookId}: page ${pageNumber}`);
    } catch (error) {
      console.error('Error updating reading progress:', error);
    }
  };
  
  useEffect(() => {
    const loadMedia = async () => {
      try {
        setIsLoading(true);
        
        // Vérifier et corriger l'URL si nécessaire
        const url = await checkAndFixLocalUrl();
        setMediaUrl(url);
        
        if (!url) {
          setError(type === 'pdf' 
            ? t('mediaViewer.noPdfAvailable') 
            : t('mediaViewer.noAudioAvailable'));
        }
      } catch (error) {
        console.error('Erreur lors du chargement du média:', error);
        setError(t('mediaViewer.errorLoading'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMedia();
  }, [book, type]);

  const handleLoadComplete = (numberOfPages: number, filePath: string) => {
    console.log(`PDF loaded successfully with ${numberOfPages} pages`);
    setIsLoading(false);
    setTotalPages(numberOfPages);
    // Increment viewers count
    if (bookId) {
      try {
        supabase.rpc('increment_book_viewers', {
          book_id: bookId
        });
      } catch (error) {
        console.error('Error incrementing viewers:', error);
      }
    }
  };
  
  // Correction du type de l'erreur pour être compatible avec react-native-pdf
  const handleError = (error: object) => {
    console.error('Media error:', error);
    const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'string' ? error : 
                          t('mediaViewer.errorLoading');
    setError(errorMessage);
    setIsLoading(false);
  };
  
  const handlePageChanged = (page: number, numberOfPages: number) => {
    setCurrentPage(page);
    if (bookId) {
      updateReadingProgress(page);
    }
  };
  
  const handleClose = () => {
    navigation.goBack();
  };
  
  const goToNextPage = () => {
    if (pdfRef.current && currentPage < totalPages) {
      pdfRef.current.setPage(currentPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (pdfRef.current && currentPage > 1) {
      pdfRef.current.setPage(currentPage - 1);
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>{t('bookDetail.loadingBook')}</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSubtext}>{t('mediaViewer.tryAgain')}</Text>
        <Button 
          mode="contained" 
          onPress={handleClose} 
          style={styles.closeButton}
        >
          {t('common.back')}
        </Button>
      </View>
    );
  }
  
  if (!book) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('book.notFound')}</Text>
        <Button 
          mode="contained" 
          onPress={handleClose} 
          style={styles.closeButton}
        >
          {t('common.back')}
        </Button>
      </View>
    );
  }
  
if (type === 'pdf' && mediaUrl) {
  const pdfUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(mediaUrl)}&embedded=true`;
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton 
          icon="arrow-left" 
          size={24} 
          onPress={handleClose}
        />
        <Text style={styles.title} numberOfLines={1}>
          {book.title}
        </Text>
      </View>
      
      <WebView
        source={{ uri: pdfUrl }}
        style={styles.pdf}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          setError(t('mediaViewer.errorLoading'));
        }}
      />
    </View>
  );
}
  
  if (type === 'audio' && mediaUrl) {
    return (
      <AudioPlayer
        uri={mediaUrl}
        title={book.title}
        artist={book.author?.name || t('common.unknownAuthor')}
        artwork={book.cover_url || book.cover_image || undefined}
        onClose={handleClose}
        onError={handleError}
      />
    );
  }
  
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>
        {type === 'pdf' 
          ? t('mediaViewer.noPdfAvailable')
          : t('mediaViewer.noAudioAvailable')}
      </Text>
      <Button 
        mode="contained" 
        onPress={handleClose} 
        style={styles.closeButton}
      >
        {t('common.back')}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  pageInfo: {
    fontSize: 14,
    color: '#666',
    width: 60,
    textAlign: 'right',
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    backgroundColor: '#f5f5f5',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  pageText: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e53935',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  closeButton: {
    marginTop: 16,
  },
});

export default MediaViewerScreen;