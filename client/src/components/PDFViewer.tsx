import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Dimensions, 
  ActivityIndicator,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert 
} from 'react-native';
import Pdf from 'react-native-pdf';
import { IconButton } from 'react-native-paper';
import RNFS from 'react-native-fs';

interface PDFViewerProps {
  uri: string;
  onClose?: () => void;
  onError?: (error: Error) => void;
  title?: string;
  bookId?: number;
  onPageChange?: (page: number, totalPages: number) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  uri, 
  onClose, 
  onError,
  title = "Document",
  bookId,
  onPageChange
}) => {
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const source = { uri, cache: true };

  // Function to check if file exists and is accessible
  const checkFileExists = async () => {
    try {
      // For remote URLs, we can't check directly, but we can check for local files
      if (uri.startsWith('file://')) {
        const exists = await RNFS.exists(uri.replace('file://', ''));
        if (!exists) {
          throw new Error('File does not exist');
        }
      }
      return true;
    } catch (error) {
      console.error('Error checking file:', error);
      if (onError) onError(error as Error);
      Alert.alert('Error', 'Could not access the PDF file. Please try again later.');
      return false;
    }
  };

  // Check file on component mount
  React.useEffect(() => {
    checkFileExists();
  }, [uri]);

  const handleLoadComplete = (numberOfPages: number) => {
    setTotalPages(numberOfPages);
    setLoading(false);
  };

  const handlePageChanged = (page: number) => {
    setCurrentPage(page);
    if (onPageChange) {
      onPageChange(page, totalPages);
    }
  };

  const handleError = (error: any) => {
    setLoading(false);
    console.error('Error loading PDF:', error);
    // Convert any error object to an Error instance
    const errorObj = error instanceof Error ? error : new Error(String(error));
    if (onError) onError(errorObj);
    Alert.alert('Error', 'Failed to load the PDF. Please try again later.');
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      // Note: This doesn't actually change the page in the PDF view
      // You would need to use a ref to the PDF component and call a method
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      // Note: This doesn't actually change the page in the PDF view
      // You would need to use a ref to the PDF component and call a method
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="close"
          size={24}
          onPress={onClose}
          style={styles.closeButton}
        />
        <Text style={styles.title}>{title}</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.pdfContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
            <Text style={styles.loadingText}>Loading PDF...</Text>
          </View>
        )}
        
        <Pdf
          source={source}
          onLoadComplete={handleLoadComplete}
          onPageChanged={handlePageChanged}
          onError={handleError}
          style={styles.pdf}
          enablePaging={true}
          renderActivityIndicator={() => null} // We handle loading state ourselves
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.navButton, currentPage === 1 && styles.disabledButton]}
          onPress={goToPreviousPage}
          disabled={currentPage === 1}
        >
          <IconButton icon="chevron-left" size={24} disabled={currentPage === 1} />
          <Text style={currentPage === 1 ? styles.disabledText : styles.navText}>Previous</Text>
        </TouchableOpacity>
        
        <Text style={styles.pageInfo}>
          Page {currentPage} of {totalPages}
        </Text>
        
        <TouchableOpacity 
          style={[styles.navButton, currentPage === totalPages && styles.disabledButton]}
          onPress={goToNextPage}
          disabled={currentPage === totalPages}
        >
          <Text style={currentPage === totalPages ? styles.disabledText : styles.navText}>Next</Text>
          <IconButton icon="chevron-right" size={24} disabled={currentPage === totalPages} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#6200ee',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  closeButton: {
    tintColor: 'white',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 40, // Match close button width for balanced layout
  },
  pdfContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  navText: {
    fontSize: 16,
    color: '#6200ee',
    fontWeight: '500',
  },
  disabledText: {
    fontSize: 16,
    color: '#aaa',
    fontWeight: '500',
  },
  pageInfo: {
    fontSize: 14,
    color: '#666',
  },
});

export default PDFViewer;