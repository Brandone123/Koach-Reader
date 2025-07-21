import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface CustomFileUploaderProps {
  bucket: string;
  onFileUploaded: (url: string) => void;
  fileType: 'image' | 'document';
  label: string;
  existingUrl?: string | null;
}

const CustomFileUploader: React.FC<CustomFileUploaderProps> = ({
  bucket,
  onFileUploaded,
  fileType,
  label,
  existingUrl
}) => {
  const theme = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl || null);

  const pickFile = async () => {
    try {
      setIsUploading(true);
      setError(null);
      
      let result;
      
      if (fileType === 'image') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });
        
        if (!result.canceled && result.assets?.[0]?.uri) {
          await uploadFile(result.assets[0].uri);
        }
      } else {
        result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf'],
          copyToCacheDirectory: true,
        });
        
        if (result.assets?.[0]?.uri) {
          await uploadFile(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking file:', error);
      setError('Failed to select file');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadFile = async (fileUri: string) => {
    try {
      // Check if already a Supabase URL
      if (fileUri.includes('supabase.co')) {
        onFileUploaded(fileUri);
        setPreviewUrl(fileUri);
        return;
      }
  
      // Generate unique filename
      const fileExtension = fileUri.split('.').pop() || (fileType === 'image' ? 'jpg' : 'pdf');
      const fileName = `${uuidv4()}.${fileExtension}`;
  
      // Read file as base64
      const base64Data = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      // Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, base64Data, {
          contentType: fileType === 'image' ? 'image/jpeg' : 'application/pdf',
          upsert: true,
        });
  
      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }
  
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);
  
      onFileUploaded(publicUrl);
      setPreviewUrl(publicUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      setError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      {previewUrl && (
        <View style={styles.previewContainer}>
          {fileType === 'image' ? (
            <Image 
              source={{ uri: previewUrl }}
              style={styles.imagePreview}
              resizeMode="cover"
              onError={(e) => {
                console.error('Image load error:', e.nativeEvent.error);
                setError('Failed to load image');
              }}
            />
          ) : (
            <Text style={styles.existingFileText}>
              {previewUrl.split('/').pop()}
            </Text>
          )}
        </View>
      )}
      
      <Button
        mode="outlined"
        onPress={pickFile}
        loading={isUploading}
        icon={fileType === 'image' ? 'image' : 'file-pdf-box'}
        style={styles.uploadButton}
        labelStyle={styles.uploadButtonText}
      >
        {previewUrl ? 'Change File' : 'Select File'}
      </Button>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#8A2BE2',
  },
  uploadButton: {
    borderColor: '#8A2BE2',
  },
  uploadButtonText: {
    color: '#8A2BE2',
  },
  previewContainer: {
    marginBottom: 12,
    alignItems: 'center',
  },
  imagePreview: {
    width: 120,
    height: 160,
    borderRadius: 8,
  },
  existingFileText: {
    fontSize: 14,
    color: '#555',
    padding: 8,
  },
  errorText: {
    color: 'red',
    marginTop: 8,
  },
});

export default CustomFileUploader;