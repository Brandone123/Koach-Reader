import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Checkbox,
  HelperText,
  Divider,
  Title,
  Paragraph,
  List,
  Chip,
  RadioButton,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBooks } from '../slices/booksSlice';
import { AppDispatch } from '../store';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_TOKEN_KEY } from '../constants';
import { selectUser } from '../slices/authSlice';

// Backend URL
const API_URL = 'http://localhost:3001';

// File mime types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const ALLOWED_BOOK_TYPES = ['application/pdf', 'application/epub+zip', 'text/plain'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/ogg'];

const AddBookForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { t } = useTranslation();
  const user = useSelector(selectUser);
  const dispatch = useDispatch<AppDispatch>();
  const [token, setToken] = useState<string | null>(null);
  
  // Get auth token on component mount
  useEffect(() => {
    const getToken = async () => {
      const authToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      setToken(authToken);
    };
    getToken();
  }, []);
  
  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [pageCount, setPageCount] = useState('');
  const [language, setLanguage] = useState('English');
  const [isPublic, setIsPublic] = useState(true);
  
  // File state
  const [coverImage, setCoverImage] = useState<any>(null);
  const [bookFile, setBookFile] = useState<any>(null);
  const [audioFile, setAudioFile] = useState<any>(null);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Categories
  const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);
  
  // Permission state
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  // Request permissions on component mount
  useEffect(() => {
    requestPermissions();
    fetchCategories();
  }, []);
  
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setPermissionGranted(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          t('common.permissionRequired'),
          t('addBook.permissionExplanation')
        );
      }
    } else {
      setPermissionGranted(true);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([
        { id: 1, name: 'Bible Studies' },
        { id: 2, name: 'Theology' },
        { id: 3, name: 'Spirituality' },
        { id: 4, name: 'Family' },
        { id: 5, name: 'Fiction' },
      ]);
    }
  };
  
  // Pick methods
  const pickCoverImage = async () => {
    if (!permissionGranted) {
      await requestPermissions();
      if (!permissionGranted) return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setCoverImage({
          uri: selectedImage.uri,
          type: 'image/jpeg',
          name: `cover-${Date.now()}.jpg`,
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), t('addBook.pickImageError'));
    }
  };
  
  const pickBookFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/epub+zip', 'text/plain'],
        copyToCacheDirectory: true,
      });
      
      if (result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        
        // Validate file type
        if (!ALLOWED_BOOK_TYPES.includes(selectedFile.mimeType || '')) {
          Alert.alert(t('common.error'), t('addBook.invalidBookType'));
          return;
        }
        
        setBookFile({
          uri: selectedFile.uri,
          type: selectedFile.mimeType,
          name: selectedFile.name,
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert(t('common.error'), t('addBook.pickFileError'));
    }
  };
  
  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/ogg'],
        copyToCacheDirectory: true,
      });
      
      if (result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        
        // Validate file type
        if (!ALLOWED_AUDIO_TYPES.includes(selectedFile.mimeType || '')) {
          Alert.alert(t('common.error'), t('addBook.invalidAudioType'));
          return;
        }
        
        setAudioFile({
          uri: selectedFile.uri,
          type: selectedFile.mimeType,
          name: selectedFile.name,
        });
      }
    } catch (error) {
      console.error('Error picking audio:', error);
      Alert.alert(t('common.error'), t('addBook.pickFileError'));
    }
  };
  
  // Validate the form
  const validateForm = () => {
    if (!title.trim()) {
      setError(t('addBook.titleRequired'));
      return false;
    }
    
    if (!author.trim()) {
      setError(t('addBook.authorRequired'));
      return false;
    }
    
    if (!pageCount || isNaN(parseInt(pageCount)) || parseInt(pageCount) <= 0) {
      setError(t('addBook.validPageCount'));
      return false;
    }
    
    if (!bookFile) {
      setError(t('addBook.bookFileRequired'));
      return false;
    }
    
    setError('');
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      
      // Add text fields
      formData.append('title', title);
      formData.append('author', author);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('pageCount', pageCount);
      formData.append('language', language);
      formData.append('isPublic', isPublic.toString());
      
      // Add files
      if (coverImage) {
        formData.append('coverImage', coverImage);
      }
      
      if (bookFile) {
        formData.append('bookFile', bookFile);
      }
      
      if (audioFile) {
        formData.append('audioFile', audioFile);
      }
      
      // Get the token from AsyncStorage if not available
      let authToken = token;
      if (!authToken) {
        authToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      }
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${authToken}`,
        },
      };
      
      const response = await axios.post(`${API_URL}/api/books`, formData, config);
      
      // Success! Reset the form
      setTitle('');
      setAuthor('');
      setDescription('');
      setCategory('General');
      setPageCount('');
      setLanguage('English');
      setIsPublic(true);
      setCoverImage(null);
      setBookFile(null);
      setAudioFile(null);
      
      // Refresh books list
      dispatch(fetchBooks());
      
      Alert.alert(
        t('addBook.success'),
        t('addBook.bookAdded'),
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error) {
      console.error('Error adding book:', error);
      setError(t('addBook.errorAddingBook'));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>{t('addBook.addNewBook')}</Title>
      
      {error ? (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      ) : null}
      
      <TextInput
        label={t('addBook.title')}
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        mode="outlined"
      />
      
      <TextInput
        label={t('addBook.author')}
        value={author}
        onChangeText={setAuthor}
        style={styles.input}
        mode="outlined"
      />
      
      <TextInput
        label={t('addBook.description')}
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={4}
      />
      
      <Text style={styles.label}>{t('addBook.category')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
        {categories.map((cat) => (
          <Chip
            key={cat.name}
            selected={category === cat.name}
            onPress={() => setCategory(cat.name)}
            style={styles.categoryChip}
            mode="outlined"
          >
            {cat.name}
          </Chip>
        ))}
      </ScrollView>
      
      <TextInput
        label={t('addBook.pageCount')}
        value={pageCount}
        onChangeText={setPageCount}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
      />
      
      <TextInput
        label={t('addBook.language')}
        value={language}
        onChangeText={setLanguage}
        style={styles.input}
        mode="outlined"
      />
      
      <View style={styles.checkboxContainer}>
        <Checkbox
          status={isPublic ? 'checked' : 'unchecked'}
          onPress={() => setIsPublic(!isPublic)}
        />
        <Text style={styles.checkboxLabel}>{t('addBook.makePublic')}</Text>
      </View>
      
      <Divider style={styles.divider} />
      
      <Title style={styles.fileTitle}>{t('addBook.uploadFiles')}</Title>
      
      {/* Cover Image */}
      <View style={styles.fileSection}>
        <Text style={styles.fileLabel}>{t('addBook.coverImage')}</Text>
        <Button
          mode="outlined"
          icon="image"
          onPress={pickCoverImage}
          style={styles.fileButton}
        >
          {coverImage ? t('addBook.changeCover') : t('addBook.selectCover')}
        </Button>
        
        {coverImage && (
          <Image source={{ uri: coverImage.uri }} style={styles.coverPreview} />
        )}
      </View>
      
      {/* Book File */}
      <View style={styles.fileSection}>
        <Text style={styles.fileLabel}>{t('addBook.bookFile')}</Text>
        <Button
          mode="outlined"
          icon="file-pdf-box"
          onPress={pickBookFile}
          style={styles.fileButton}
        >
          {bookFile ? t('addBook.changeFile') : t('addBook.selectFile')}
        </Button>
        
        {bookFile && (
          <Text style={styles.fileName}>{bookFile.name}</Text>
        )}
      </View>
      
      {/* Audio File */}
      <View style={styles.fileSection}>
        <Text style={styles.fileLabel}>{t('addBook.audioFile')} ({t('common.optional')})</Text>
        <Button
          mode="outlined"
          icon="file-music"
          onPress={pickAudioFile}
          style={styles.fileButton}
        >
          {audioFile ? t('addBook.changeAudio') : t('addBook.selectAudio')}
        </Button>
        
        {audioFile && (
          <Text style={styles.fileName}>{audioFile.name}</Text>
        )}
      </View>
      
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isLoading}
        disabled={isLoading}
        style={styles.submitButton}
      >
        {t('addBook.addBook')}
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    marginLeft: 8,
  },
  divider: {
    marginVertical: 16,
  },
  fileTitle: {
    marginBottom: 16,
  },
  fileSection: {
    marginBottom: 16,
  },
  fileLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  fileButton: {
    marginBottom: 8,
  },
  coverPreview: {
    width: 120,
    height: 160,
    resizeMode: 'cover',
    marginVertical: 8,
    borderRadius: 4,
  },
  fileName: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 32,
  },
});

export default AddBookForm; 