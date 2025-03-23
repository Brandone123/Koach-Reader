import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ActivityIndicator, 
  Alert,
  SafeAreaView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import { RootStackParamList } from '../../App';
import PDFViewer from '../components/PDFViewer';
import AudioPlayer from '../components/AudioPlayer';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import { selectUser } from '../slices/authSlice';
import { fetchApi } from '../utils/api';
import { mockFetchApi } from '../utils/mockApi';

type MediaViewerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MediaViewer'>;
type MediaViewerScreenRouteProp = RouteProp<RootStackParamList, 'MediaViewer'>;

export interface MediaViewerScreenProps {
  navigation: MediaViewerScreenNavigationProp;
  route: MediaViewerScreenRouteProp;
}

enum MediaType {
  PDF = 'pdf',
  AUDIO = 'audio',
  UNKNOWN = 'unknown'
}

interface MediaInfo {
  uri: string;
  type: MediaType;
  title: string;
  creator?: string;
}

const MediaViewerScreen = ({ navigation, route }: MediaViewerScreenProps) => {
  const { bookId, mediaType } = route.params;
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);

  // Fonction pour déterminer le type de fichier à partir de l'URI
  const determineMediaType = (uri: string): MediaType => {
    if (!uri) return MediaType.UNKNOWN;
    
    const lowerCaseUri = uri.toLowerCase();
    if (lowerCaseUri.endsWith('.pdf') || lowerCaseUri.includes('application/pdf')) {
      return MediaType.PDF;
    } else if (
      lowerCaseUri.endsWith('.mp3') || 
      lowerCaseUri.endsWith('.m4a') || 
      lowerCaseUri.endsWith('.wav') || 
      lowerCaseUri.endsWith('.ogg')
    ) {
      return MediaType.AUDIO;
    }
    
    // Utiliser le type spécifié si le type ne peut pas être déterminé à partir de l'URI
    return mediaType === 'audio' ? MediaType.AUDIO : MediaType.PDF;
  };

  useEffect(() => {
    fetchMediaInfo();
  }, [bookId, mediaType]);

  const fetchMediaInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try real API first
      const endpoint = mediaType === 'audio' 
        ? `/api/books/${bookId}/audio` 
        : `/api/books/${bookId}/file`;
      
      const data = await fetchApi(endpoint);
      
      setMediaInfo({
        uri: data.fileUrl,
        type: determineMediaType(data.fileUrl),
        title: data.title || 'Book Content',
        creator: data.author
      });
    } catch (apiError) {
      try {
        // Fall back to mock data
        const mockEndpoint = mediaType === 'audio' 
          ? `/api/books/${bookId}/audio` 
          : `/api/books/${bookId}/file`;
        
        const mockData = await mockFetchApi(mockEndpoint);
        
        // For mock data, create sample URLs
        let sampleUri = '';
        if (mediaType === 'audio') {
          // Sample audio URL for testing
          sampleUri = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
        } else {
          // Sample PDF URL for testing
          sampleUri = 'https://www.africau.edu/images/default/sample.pdf';
        }
        
        setMediaInfo({
          uri: sampleUri,
          type: mediaType === 'audio' ? MediaType.AUDIO : MediaType.PDF,
          title: mockData?.title || 'Sample Book',
          creator: mockData?.author || 'Sample Author'
        });
      } catch (mockError) {
        console.error('Failed to load media info:', mockError);
        setError('Failed to load media information. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error: Error) => {
    console.error('Media error:', error);
    setError('An error occurred while loading the media. Please try again.');
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handlePageChange = (page: number, totalPages: number) => {
    // Here you could save reading progress
    console.log(`Page ${page} of ${totalPages}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading media...</Text>
      </SafeAreaView>
    );
  }

  if (error || !mediaInfo) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Could not load media'}</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        >
          Go Back
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {mediaInfo.type === MediaType.PDF ? (
        <PDFViewer 
          uri={mediaInfo.uri}
          title={mediaInfo.title}
          onClose={handleClose}
          onError={handleError}
          bookId={bookId}
          onPageChange={handlePageChange}
        />
      ) : mediaInfo.type === MediaType.AUDIO ? (
        <AudioPlayer 
          uri={mediaInfo.uri}
          title={mediaInfo.title}
          artist={mediaInfo.creator}
          onClose={handleClose}
          onError={handleError}
          bookId={bookId}
        />
      ) : (
        <SafeAreaView style={styles.unsupportedContainer}>
          <Text style={styles.unsupportedText}>
            Unsupported media type. Please try another format.
          </Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.goBack()}
            style={styles.unsupportedButton}
          >
            Go Back
          </Button>
        </SafeAreaView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#B00020',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    marginTop: 8,
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  unsupportedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  unsupportedButton: {
    marginTop: 8,
  },
});

export default MediaViewerScreen;