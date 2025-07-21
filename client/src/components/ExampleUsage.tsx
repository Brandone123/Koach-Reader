import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Button } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import * as FileSystem from 'expo-file-system';

const BUCKET_BOOKS = 'books';
const BUCKET_COVERS = 'covers';
const FOLDER_BOOKS = 'books';
const FOLDER_COVERS = 'images';

/**
 * Example component demonstrating proper file upload with Supabase
 */
const ExampleUsage: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  /**
   * Pick an image from device library
   */
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'We need access to your media library to pick images.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        console.log('Selected image:', selectedImage.uri);
        setIsUploading(true);
        
        try {
          const uploadedUrl = await uploadImage(selectedImage.uri);
          setImageUrl(uploadedUrl);
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert('Upload Failed', 'There was a problem uploading your image');
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'There was a problem selecting your image');
    }
  };
  
  /**
   * Pick a PDF file from device
   */
  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });
      
      if (result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        console.log('Selected PDF:', selectedFile);
        setIsUploading(true);
        
        try {
          const uploadedUrl = await uploadPdf(selectedFile.uri);
          setPdfUrl(uploadedUrl);
        } catch (error) {
          console.error('Error uploading PDF:', error);
          Alert.alert('Upload Failed', 'There was a problem uploading your PDF');
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Error picking PDF:', error);
      Alert.alert('Error', 'There was a problem selecting your PDF');
    }
  };
  
  /**
   * Upload an image to Supabase Storage
   */
  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      if (!uri) return null;
      
      const fileName = `${uuidv4().replace(/-/g, '_')}_${Date.now()}.jpeg`;
      const filePath = `${FOLDER_COVERS}/${fileName}`;
      
      // Different approaches for web vs native platforms
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        
        const { data, error } = await supabase.storage
          .from(BUCKET_COVERS)
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: true,
          });
        
        if (error) throw error;
        
        const { data: urlData } = supabase.storage
          .from(BUCKET_COVERS)
          .getPublicUrl(filePath);
        
        return urlData.publicUrl;
    } else {
        // For mobile platforms
        // First, we'll use fetch to get the image as a blob
        const response = await fetch(uri);
        const blob = await response.blob();
        
        const { data, error } = await supabase.storage
          .from(BUCKET_COVERS)
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: true,
          });
        
        if (error) throw error;
        
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from(BUCKET_COVERS)
          .getPublicUrl(filePath);
        
        return urlData.publicUrl;
      }
    } catch (error) {
      console.error('Error in uploadImage:', error);
      return null;
    }
  };
  
  /**
   * Upload a PDF to Supabase Storage
   */
  const uploadPdf = async (uri: string): Promise<string | null> => {
    try {
      if (!uri) return null;
      
      const fileName = `${uuidv4().replace(/-/g, '_')}_${Date.now()}.pdf`;
      const filePath = `${FOLDER_BOOKS}/${fileName}`;
      
      // Different approaches for web vs native platforms
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        
        const { data, error } = await supabase.storage
          .from(BUCKET_BOOKS)
          .upload(filePath, blob, {
            contentType: 'application/pdf',
            upsert: true,
          });
        
        if (error) throw error;
        
        const { data: urlData } = supabase.storage
          .from(BUCKET_BOOKS)
          .getPublicUrl(filePath);
        
        return urlData.publicUrl;
      } else {
        // For mobile, we'll use fetch to get the PDF as a blob
        const response = await fetch(uri);
        const blob = await response.blob();
        
        const { data, error } = await supabase.storage
          .from(BUCKET_BOOKS)
          .upload(filePath, blob, {
            contentType: 'application/pdf',
            upsert: true,
          });
        
        if (error) throw error;
        
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from(BUCKET_BOOKS)
          .getPublicUrl(filePath);
        
        return urlData.publicUrl;
      }
    } catch (error) {
      console.error('Error in uploadPdf:', error);
      return null;
    }
  };
  
  /**
   * Test Supabase storage access
   */
  const testStorageAccess = async () => {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        Alert.alert('Storage Error', `Error accessing storage: ${error.message}`);
        return;
      }
      
      Alert.alert(
        'Storage Access OK',
        `Found ${buckets.length} buckets: ${buckets.map(b => b.name).join(', ')}`
      );
      
    } catch (error) {
      Alert.alert('Error', `Failed to test storage: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Storage Example</Text>
      
      <Button 
        mode="contained" 
        onPress={testStorageAccess} 
        style={styles.button}
      >
        Test Storage Access
      </Button>
      
      <View style={styles.imageSection}>
        <Text style={styles.sectionTitle}>Image Upload Example</Text>
        
        <TouchableOpacity onPress={pickImage} style={styles.uploadArea}>
          {isUploading ? (
            <ActivityIndicator size="large" color="#8A2BE2" />
          ) : imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.imagePreview}
              resizeMode="cover"
              onError={(e) => console.error('Image load error:', e.nativeEvent.error)}
            />
          ) : (
            <Text style={styles.uploadText}>Tap to select an image</Text>
          )}
        </TouchableOpacity>
        
        {imageUrl && (
          <View style={styles.urlContainer}>
            <Text style={styles.urlText} numberOfLines={2}>{imageUrl}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.pdfSection}>
        <Text style={styles.sectionTitle}>PDF Upload Example</Text>
        
        <TouchableOpacity onPress={pickPdf} style={styles.uploadArea}>
          {isUploading ? (
            <ActivityIndicator size="large" color="#8A2BE2" />
          ) : pdfUrl ? (
            <View style={styles.pdfPreview}>
              <Text style={styles.pdfName}>PDF Uploaded</Text>
              <Text style={styles.pdfInfo}>PDF files can't be previewed directly</Text>
            </View>
          ) : (
            <Text style={styles.uploadText}>Tap to select a PDF</Text>
          )}
        </TouchableOpacity>
        
        {pdfUrl && (
          <View style={styles.urlContainer}>
            <Text style={styles.urlText} numberOfLines={2}>{pdfUrl}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    marginBottom: 16,
    backgroundColor: '#8A2BE2',
  },
  imageSection: {
    marginBottom: 24,
  },
  pdfSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#444',
  },
  uploadArea: {
    height: 200,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  uploadText: {
    color: '#666',
    fontSize: 16,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  pdfPreview: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8A2BE2',
  },
  pdfInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  urlContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
  },
  urlText: {
    fontSize: 12,
    color: '#444',
  },
});

export default ExampleUsage; 