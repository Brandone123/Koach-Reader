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
  ActivityIndicator,
  Linking
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
  useTheme,
  IconButton,
  Portal,
  Dialog,
  Surface,
  Menu,
  Card
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import { fetchBooks } from '../slices/booksSlice';
import { AppDispatch } from '../store';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { selectUser } from '../slices/authSlice';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import DatePickerField from '../components/DatePickerField';
import { v4 as uuidv4 } from 'uuid';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import CustomFileUploader from '../components/CustomFileUploader';

// File mime types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const ALLOWED_BOOK_TYPES = ['application/pdf', 'application/epub+zip', 'application/pdf'];

type AddBookScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddBook'>;
type AddBookScreenRouteProp = RouteProp<RootStackParamList, 'AddBook'>;

interface AddBookScreenProps {
  navigation: AddBookScreenNavigationProp;
  route: AddBookScreenRouteProp;
}

interface Author {
  id: number;
  name: string;
  description?: string | null;
  country?: string | null;
  profile_image_url?: string | null;
}

interface Category {
  id: string;
  name: string;
  description?: string | null;
  icon_name?: string | null;
}

// Optimized FilePreview component
const FilePreview = ({ fileUrl, fileType }: { fileUrl: string | null, fileType: 'image' | 'pdf' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const fallbackImage = require('../../assets/book-cover-placeholder.svg');

  if (!fileUrl) return null;

  if (fileType === 'image') {
    return (
      <View style={styles.previewContainer}>
        {isLoading && (
          <ActivityIndicator size="large" color="#8A2BE2" style={styles.loadingIndicator} />
        )}
        
        <Image 
          source={{ uri: fileUrl }}
          defaultSource={fallbackImage}
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => {
            setIsLoading(false);
            setHasError(false);
          }}
          onError={(error) => {
            console.error('Error loading image:', error);
            setHasError(true);
            setIsLoading(false);
          }}
          style={[
            styles.coverPreview,
            hasError ? { display: 'none' } : {}
          ]}
          resizeMode="contain"
        />

        {hasError && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="image-off" size={48} color="#8A2BE2" />
            <Text style={styles.errorText}>Unable to load image</Text>
            <Text style={styles.urlText} numberOfLines={2}>{fileUrl}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => Linking.openURL(fileUrl)}
            >
              <Text style={styles.retryText}>Open in Browser</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // For PDF preview
  const fileName = fileUrl.split('/').pop() || 'document.pdf';
  return (
    <View style={styles.pdfPreviewContainer}>
      <MaterialCommunityIcons name="file-pdf-box" size={48} color="#8A2BE2" />
      <Text style={styles.pdfFileName}>{fileName}</Text>
      <TouchableOpacity 
        onPress={() => Linking.openURL(fileUrl)}
        style={styles.viewPdfButton}
      >
        <Text style={styles.viewPdfText}>View PDF</Text>
      </TouchableOpacity>
    </View>
  );
};

const AddBookScreen: React.FC<AddBookScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const user = useSelector(selectUser);
  const dispatch = useAppDispatch();
  const { bookId } = route.params || {};
  const isEditMode = !!bookId;
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isbn, setIsbn] = useState('');
  const [publicationDate, setPublicationDate] = useState<Date | null>(null);
  const [language, setLanguage] = useState('English');
  const [totalPages, setTotalPages] = useState('');
  const [readingTime, setReadingTime] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  
  // Author state
  const [authorId, setAuthorId] = useState<number | null>(null);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [showAuthorDialog, setShowAuthorDialog] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState('');
  const [newAuthorDescription, setNewAuthorDescription] = useState('');
  const [newAuthorCountry, setNewAuthorCountry] = useState('');
  const [authorSearchQuery, setAuthorSearchQuery] = useState('');
  const [showAuthorMenu, setShowAuthorMenu] = useState(false);
  
  // Category state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  
  // File state
  const [coverImage, setCoverImage] = useState<any>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [bookFile, setBookFile] = useState<any>(null);
  const [bookFileUrl, setBookFileUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Permission state
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  // Language state
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  
  // Category menu state
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  
  // Constantes pour les buckets Supabase
  const BUCKET_BOOKS = 'books';
  const BUCKET_COVERS = 'covers';
  
  // Function to ensure storage buckets exist
  const ensureBucketsExist = async () => {
    try {
      // Get list of buckets
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error listing buckets:', error);
        return;
      }
      
      // Check and create books bucket if needed
      if (!buckets.some(b => b.name === BUCKET_BOOKS)) {
        const { error: createError } = await supabase.storage.createBucket(BUCKET_BOOKS, {
          public: true
        });
        
        if (createError) {
          console.error(`Error creating ${BUCKET_BOOKS} bucket:`, createError);
        }
      }
      
      // Check and create covers bucket if needed
      if (!buckets.some(b => b.name === BUCKET_COVERS)) {
        const { error: createError } = await supabase.storage.createBucket(BUCKET_COVERS, {
          public: true
        });
        
        if (createError) {
          console.error(`Error creating ${BUCKET_COVERS} bucket:`, createError);
        }
      }
    } catch (err) {
      console.error('Error in bucket configuration:', err);
    }
  };

  useEffect(() => {
    requestPermissions();
    fetchCategories();
    fetchAuthors();
    ensureBucketsExist();
    
    if (isEditMode) {
      fetchBookDetails();
    }
  }, [bookId]);
  
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
      setIsLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      
      if (error) throw error;
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchAuthors = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('authors')
        .select('*');
      
      if (error) throw error;
      
      setAuthors(data || []);
    } catch (error) {
      console.error('Error fetching authors:', error);
      setError('Failed to fetch authors');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchBookDetails = async () => {
    try {
      setIsLoading(true);
      const { data: book, error } = await supabase
        .from('books')
        .select(`
          *,
          authors:author_id (*),
          book_categories (
            category_id
          )
        `)
        .eq('id', bookId)
        .single();
      
      if (error) throw error;
      
      if (book) {
        setTitle(book.title);
        setDescription(book.description || '');
        setIsbn(book.isbn || '');
        setPublicationDate(book.publication_date ? new Date(book.publication_date) : null);
        setLanguage(book.language || 'English');
        setTotalPages(book.total_pages.toString());
        setReadingTime(book.reading_time || '');
        setIsFree(book.is_free || false);
        setRating(book.rating);
        setAuthorId(book.author_id);
        setCoverImageUrl(book.cover_url || book.cover_image);
        setBookFileUrl(book.pdf_url);
        
        // Set selected categories
        if (book.book_categories && book.book_categories.length > 0) {
          const categoryIds = book.book_categories.map((bc: any) => bc.category_id);
          setSelectedCategories(categoryIds);
        }
      }
    } catch (error) {
      console.error('Error fetching book details:', error);
      setError('Failed to fetch book details');
    } finally {
      setIsLoading(false);
    }
  };
  
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

        setIsUploadingCover(true);

        const uploadedUrl = await uploadFileToSupabase(selectedImage.uri, BUCKET_COVERS);
        
        if (uploadedUrl) {
          setCoverImageUrl(uploadedUrl);
          setCoverImage({
            uri: uploadedUrl,
            type: selectedImage.type || 'image/jpeg',
            name: uploadedUrl.split('/').pop() || `cover-${Date.now()}.jpg`,
          });
        } else {
          Alert.alert(t('common.error'), t('addBook.uploadImageError'));
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), t('addBook.pickImageError'));
    } finally {
      setIsUploadingCover(false);
    }
  };
  
  const pickBookFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];

        if (!selectedFile.mimeType || !ALLOWED_BOOK_TYPES.includes(selectedFile.mimeType)) {
          Alert.alert(t('common.error'), t('addBook.invalidBookType'));
          return;
        }

        setIsUploadingPdf(true);

        const uploadedUrl = await uploadFileToSupabase(selectedFile.uri, BUCKET_BOOKS);
        
        if (uploadedUrl) {
          setBookFileUrl(uploadedUrl);
          setBookFile({
            uri: uploadedUrl,
            type: selectedFile.mimeType || 'application/pdf',
            name: uploadedUrl.split('/').pop() || `book-${Date.now()}.pdf`,
          });
        } else {
          Alert.alert(t('common.error'), t('addBook.uploadPdfError'));
        }
      }
    } catch (error) {
      console.error('Error picking PDF:', error);
      Alert.alert(t('common.error'), t('addBook.pickPdfError'));
    } finally {
      setIsUploadingPdf(false);
    }
  };
  
  const validateForm = () => {
    if (!title.trim()) {
      setError(t('addBook.titleRequired'));
      return false;
    }
    
    if (!authorId) {
      setError(t('addBook.authorRequired'));
      return false;
    }
    
    if (!totalPages || isNaN(parseInt(totalPages)) || parseInt(totalPages) <= 0) {
      setError(t('addBook.validPageCount'));
      return false;
    }
    
    if (!isEditMode && !bookFile) {
      setError(t('addBook.bookFileRequired'));
      return false;
    }
    
    setError('');
    return true;
  };
  
  const handleCreateAuthor = async () => {
    if (!newAuthorName.trim()) {
      Alert.alert(t('common.error'), t('addBook.authorNameRequired'));
      return;
    }
    
    try {
      setIsSaving(true);
      
      const { data, error } = await supabase
        .from('authors')
        .insert({
          name: newAuthorName,
          description: newAuthorDescription || null,
          country: newAuthorCountry || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setAuthors([...authors, data]);
        setAuthorId(data.id);
        setShowAuthorDialog(false);
        setNewAuthorName('');
        setNewAuthorDescription('');
        setNewAuthorCountry('');
      }
    } catch (error) {
      console.error('Error creating author:', error);
      Alert.alert(t('common.error'), t('addBook.errorCreatingAuthor'));
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert(t('common.error'), t('addBook.categoryNameRequired'));
      return;
    }
    
    try {
      setIsSaving(true);
      
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: newCategoryName,
          description: newCategoryDescription || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setCategories([...categories, data]);
        setSelectedCategories([...selectedCategories, data.id]);
        setShowCategoryDialog(false);
        setNewCategoryName('');
        setNewCategoryDescription('');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      Alert.alert(t('common.error'), t('addBook.errorCreatingCategory'));
    } finally {
      setIsSaving(false);
    }
  };

  // OPTIMIZED UPLOAD FUNCTION USING SUPABASE STORAGE API
  const uploadFileToSupabase = async (fileUri: string, bucket: string): Promise<string | null> => {
    try {
      if (!fileUri) throw new Error('No file URI provided');
  
      // Si c'est déjà une URL Supabase, on la retourne directement
      if (fileUri.includes('supabase.co')) {
        return fileUri;
      }
  
      const fileExtension = fileUri.split('.').pop() || (bucket === BUCKET_BOOKS ? 'pdf' : 'jpg');
      const fileName = `${uuidv4()}.${fileExtension}`;
  
      // Lire le fichier
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      // Upload vers Supabase
      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, fileContent, {
          contentType: bucket === BUCKET_BOOKS ? 'application/pdf' : 'image/jpeg',
          upsert: true,
        });
  
      if (error) throw error;
  
      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);
  
      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Error', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    try {
      let finalCoverUrl = coverImageUrl;
      let finalBookUrl = bookFileUrl;
      
      // Upload cover if it's a new local file
      if (coverImageUrl && coverImageUrl.startsWith('file://')) {
        finalCoverUrl = await uploadFileToSupabase(coverImageUrl, BUCKET_COVERS);
        if (!finalCoverUrl) throw new Error('Failed to upload cover image');
      }
      
      // Upload book file if it's a new local file
      if (bookFileUrl && bookFileUrl.startsWith('file://')) {
        finalBookUrl = await uploadFileToSupabase(bookFileUrl, BUCKET_BOOKS);
        if (!finalBookUrl) throw new Error('Failed to upload book file');
      }
      
      const bookData = {
        title,
        description,
        isbn: isbn || null,
        publication_date: publicationDate ? publicationDate.toISOString().split('T')[0] : null,
        language: language || null,
        cover_url: finalCoverUrl,
        total_pages: parseInt(totalPages),
        rating: rating,
        pdf_url: finalBookUrl,
        is_free: isFree,
        reading_time: readingTime || null,
        author_id: authorId,
      };
      
      let bookId;
      
      if (isEditMode) {
        // Update existing book
        const { data, error } = await supabase
          .from('books')
          .update(bookData)
          .eq('id', route.params.bookId)
          .select();
        
        if (error) throw error;
        bookId = route.params.bookId;
      } else {
        // Create new book
        const { data, error } = await supabase
          .from('books')
          .insert(bookData)
          .select()
          .single();
        
        if (error) throw error;
        bookId = data.id;
      }
      
      // Handle categories
      if (isEditMode) {
        // Delete existing category associations
        await supabase
          .from('book_categories')
          .delete()
          .eq('book_id', bookId);
      }
      
      // Add new category associations
      if (selectedCategories.length > 0) {
        const categoryAssociations = selectedCategories.map(categoryId => ({
          book_id: bookId,
          category_id: categoryId
        }));
        
        await supabase
          .from('book_categories')
          .upsert(categoryAssociations);
      }
      
      // Refresh books list
      dispatch(fetchBooks());
      
      Alert.alert(
        isEditMode ? t('addBook.updateSuccess') : t('addBook.success'),
        isEditMode ? t('addBook.bookUpdated') : t('addBook.bookAdded'),
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving book:', error);
      setError(isEditMode ? 
        `${t('addBook.errorUpdatingBook')}: ${error instanceof Error ? error.message : String(error)}` : 
        `${t('addBook.errorAddingBook')}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const filteredAuthors = authorSearchQuery
    ? authors.filter(author => 
        author.name.toLowerCase().includes(authorSearchQuery.toLowerCase()))
    : authors;
  
  const Required = () => <Text style={{ color: 'red' }}> *</Text>;
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.bgContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.formCard}>
          <Card.Content>
            <View style={styles.formHeaderContainer}>
              <MaterialCommunityIcons name="book-plus" size={28} color="#8A2BE2" />
              <Title style={styles.formTitle}>
                {isEditMode ? t('addBook.updateBook') : t('addBook.addNewBook')}
              </Title>
            </View>
            {error && (
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            )}
            
            <Text style={styles.sectionLabel}>{t('addBook.mainInfo')}</Text>
            <TextInput
              label={<Text>{t('addBook.title')}{<Required />}</Text>}
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="book-open-page-variant" />}
              error={!title && !!error}
            />
            {!title && error && <HelperText type="error" visible>{t('addBook.titleRequired')}</HelperText>}
            
            <TextInput
              label={t('addBook.description')}
              value={description}
              onChangeText={setDescription}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={4}
              left={<TextInput.Icon icon="text" />}
            />
            
            <TextInput
              label={t('addBook.isbn')}
              value={isbn}
              onChangeText={setIsbn}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="barcode" />}
            />
            
            <DatePickerField
              label={t('addBook.publicationDate')}
              value={publicationDate}
              onChange={setPublicationDate}
              style={styles.input}
            />
            
            <View style={styles.rowField}>
              <Text style={styles.inputLabel}>{t('addBook.language')}{<Required />}</Text>
              <Menu
                visible={showLanguageMenu}
                onDismiss={() => setShowLanguageMenu(false)}
                anchor={
                  <TouchableOpacity style={styles.selectButton} onPress={() => setShowLanguageMenu(true)}>
                    <Text style={styles.selectButtonText}>{language}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color="#8A2BE2" />
                  </TouchableOpacity>
                }
              >
                <Menu.Item title={t('addBook.english')} onPress={() => { setLanguage('en'); setShowLanguageMenu(false); }} />
                <Menu.Item title={t('addBook.french')} onPress={() => { setLanguage('fr'); setShowLanguageMenu(false); }} />
              </Menu>
            </View>
            
            <TextInput
              label={t('addBook.totalPages')}
              value={totalPages}
              onChangeText={setTotalPages}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              left={<TextInput.Icon icon="file-document-outline" />}
            />
            
            <TextInput
              label={t('addBook.readingTime')}
              value={readingTime}
              onChangeText={setReadingTime}
              style={styles.input}
              mode="outlined"
              placeholder="e.g. 3 hours"
              left={<TextInput.Icon icon="timer" />}
            />
            
            <View style={styles.checkboxContainer}>
              <Checkbox
                status={isFree ? 'checked' : 'unchecked'}
                onPress={() => setIsFree(!isFree)}
                color="#8A2BE2"
              />
              <Text style={styles.checkboxLabel}>{t('addBook.isFree')}</Text>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>{t('addBook.author')}</Text>
              <Text style={styles.addLink} onPress={() => setShowAuthorDialog(true)}>
                + {t('addBook.newAuthor')}
              </Text>
            </View>
            
            <Menu
              visible={showAuthorMenu}
              onDismiss={() => setShowAuthorMenu(false)}
              anchor={
                <TouchableOpacity style={styles.selectButton} onPress={() => setShowAuthorMenu(true)}>
                  <Text style={styles.selectButtonText}>
                    {authorId ? authors.find(a => a.id === authorId)?.name || t('addBook.selectAuthor') : t('addBook.selectAuthor')}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#8A2BE2" />
                </TouchableOpacity>
              }
            >
              <TextInput
                label={t('addBook.searchAuthor')}
                value={authorSearchQuery}
                onChangeText={setAuthorSearchQuery}
                style={styles.searchInput}
                mode="outlined"
                dense
              />
              <Divider />
              <ScrollView style={{ maxHeight: 200 }}>
                {filteredAuthors.map(author => (
                  <Menu.Item
                    key={author.id}
                    title={author.name}
                    onPress={() => {
                      setAuthorId(author.id);
                      setShowAuthorMenu(false);
                      setAuthorSearchQuery('');
                    }}
                  />
                ))}
              </ScrollView>
              <Divider />
              <Menu.Item
                title={t('addBook.createNewAuthor')}
                onPress={() => {
                  setShowAuthorMenu(false);
                  setShowAuthorDialog(true);
                }}
              />
            </Menu>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>{t('addBook.categories')}{<Required />}</Text>
              <Text style={styles.addLink} onPress={() => setShowCategoryDialog(true)}>
                + {t('addBook.newCategory')}
              </Text>
            </View>
            
            <Menu
              visible={showCategoryMenu}
              onDismiss={() => setShowCategoryMenu(false)}
              anchor={
                <TouchableOpacity style={styles.selectButton} onPress={() => setShowCategoryMenu(true)}>
                  <Text style={styles.selectButtonText}>
                    {selectedCategories.length > 0
                      ? selectedCategories.map(id => categories.find(c => c.id === id)?.name).filter(Boolean).join(', ')
                      : t('addBook.selectCategories')}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#8A2BE2" />
                </TouchableOpacity>
              }
            >
              <ScrollView style={{ maxHeight: 200 }}>
                {categories.map(cat => (
                  <Menu.Item
                    key={cat.id}
                    title={cat.name}
                    onPress={() => {
                      if (selectedCategories.includes(cat.id)) {
                        setSelectedCategories(selectedCategories.filter(id => id !== cat.id));
                      } else {
                        setSelectedCategories([...selectedCategories, cat.id]);
                      }
                    }}
                    style={{ backgroundColor: selectedCategories.includes(cat.id) ? '#8A2BE2' : undefined }}
                    titleStyle={{ color: selectedCategories.includes(cat.id) ? '#fff' : '#333', fontWeight: selectedCategories.includes(cat.id) ? 'bold' : 'normal' }}
                  />
                ))}
              </ScrollView>
              <Divider />
              <Menu.Item
                title={t('addBook.createNewCategory')}
                onPress={() => {
                  setShowCategoryMenu(false);
                  setShowCategoryDialog(true);
                }}
              />
            </Menu>
            {selectedCategories.length === 0 && error && <HelperText type="error" visible>{t('addBook.categoryRequired')}</HelperText>}
            
            <Divider style={styles.divider} />
            
            <View style={styles.fileSectionBox}>
              <Text style={styles.sectionLabel}>{t('addBook.uploadFiles')}</Text>
              
              <CustomFileUploader
                bucket={BUCKET_COVERS}
                onFileUploaded={setCoverImageUrl}
                fileType="image"
                label={t('addBook.coverImage')}
                existingUrl={coverImageUrl}
              />
              {coverImageUrl && (
                <FilePreview fileUrl={coverImageUrl} fileType="image" />
              )}
              
              <CustomFileUploader
                bucket={BUCKET_BOOKS}
                onFileUploaded={setBookFileUrl}
                fileType="document"
                label={t('addBook.bookFile')}
                existingUrl={bookFileUrl}
              />
              {bookFileUrl && (
                <FilePreview fileUrl={bookFileUrl} fileType="pdf" />
              )}
              
              {(!bookFileUrl && error) && <HelperText type="error" visible>{t('addBook.bookFileRequired')}</HelperText>}
            </View>
            
            <Button
              mode="contained"
              icon={isEditMode ? 'content-save-edit' : 'book-plus'}
              onPress={handleSubmit}
              loading={isSaving}
              disabled={isSaving}
              style={styles.submitButton}
              labelStyle={{ fontWeight: 'bold', fontSize: 18 }}
              contentStyle={{ flexDirection: 'row-reverse', paddingVertical: 10 }}
              buttonColor="#8A2BE2"
            >
              {isEditMode ? t('addBook.updateBook') : t('addBook.addBook')}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
      
      <Portal>
        <Dialog visible={showAuthorDialog} onDismiss={() => setShowAuthorDialog(false)} style={styles.dialogNoRadius}>
          <Dialog.Title style={styles.dialogTitle}>{t('addBook.createNewAuthor')}</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <TextInput
              label={t('addBook.authorName')}
              value={newAuthorName}
              onChangeText={setNewAuthorName}
              style={styles.dialogInput}
              mode="outlined"
            />
            <TextInput
              label={t('addBook.authorDescription')}
              value={newAuthorDescription}
              onChangeText={setNewAuthorDescription}
              style={styles.dialogInput}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
            <TextInput
              label={t('addBook.authorCountry')}
              value={newAuthorCountry}
              onChangeText={setNewAuthorCountry}
              style={styles.dialogInput}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button onPress={() => setShowAuthorDialog(false)}>{t('common.cancel')}</Button>
            <Button 
              onPress={handleCreateAuthor} 
              loading={isSaving}
              disabled={isSaving || !newAuthorName.trim()}
            >
              {t('common.create')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      <Portal>
        <Dialog visible={showCategoryDialog} onDismiss={() => setShowCategoryDialog(false)} style={styles.dialogNoRadius}>
          <Dialog.Title style={styles.dialogTitle}>{t('addBook.createNewCategory')}</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <TextInput
              label={t('addBook.categoryName')}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              style={styles.dialogInput}
              mode="outlined"
            />
            <TextInput
              label={t('addBook.categoryDescription')}
              value={newCategoryDescription}
              onChangeText={setNewCategoryDescription}
              style={styles.dialogInput}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button onPress={() => setShowCategoryDialog(false)}>{t('common.cancel')}</Button>
            <Button 
              onPress={handleCreateCategory} 
              loading={isSaving}
              disabled={isSaving || !newCategoryName.trim()}
            >
              {t('common.create')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    minHeight: 200,
  },
  errorText: {
    color: 'red',
    fontWeight: 'bold',
  },
  bgContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollContent: {
    padding: 16,
  },
  formCard: {
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  formHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#333',
  },
  input: {
    marginBottom: 16,
  },
  searchInput: {
    margin: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
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
  fileSectionBox: {
    backgroundColor: '#f7f6fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  coverPreview: {
    width: 200,
    height: 280,
    borderRadius: 8,
  },
  submitButton: {
    marginVertical: 24,
    borderRadius: 10,
    backgroundColor: '#8A2BE2',
    elevation: 2,
  },
  dialogInput: {
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8A2BE2',
    marginBottom: 12,
  },
  rowField: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  inputLabel: {
    fontWeight: 'bold',
    color: '#8A2BE2',
    marginRight: 12,
    fontSize: 16,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f7f6fa',
    minWidth: 120,
  },
  selectButtonText: {
    color: '#333',
    fontSize: 16,
    marginRight: 8,
  },
  addLink: {
    color: '#8A2BE2',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dialogNoRadius: {
    borderRadius: 0,
    padding: 0,
  },
  dialogTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 18,
    marginBottom: 8,
  },
  dialogContent: {
    paddingBottom: 0,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  pdfPreviewContainer: {
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    width: '100%',
  },
  pdfFileName: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  viewPdfButton: {
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 12,
  },
  viewPdfText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingIndicator: {
    position: 'absolute',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  urlText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
    maxWidth: '100%',
  },
  retryButton: {
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 16,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AddBookScreen;