import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { IconButton, useTheme } from 'react-native-paper';
import Slider from '@react-native-community/slider'; // For page scrubbing

interface PDFViewerProps {
  uri: string;
  onClose?: () => void;
  onError?: (error: Error) => void;
  title?: string;
  bookId?: number; // Keep if used for other purposes, not directly by react-native-pdf
  // onPageChange is implicitly handled by react-native-pdf's `onPageChanged` prop
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  uri,
  onClose,
  onError,
  title = 'Document',
  // bookId,
}) => {
  const theme = useTheme();
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const pdfRef = React.useRef<Pdf>(null);

  useEffect(() => {
    if (!uri) {
      setPdfError('No PDF URI provided.');
      setIsLoading(false);
      if (onError) onError(new Error('No PDF URI provided.'));
    }
  }, [uri, onError]);

  const handleLoadComplete = (numberOfPages: number, filePath: string) => {
    setTotalPages(numberOfPages);
    setCurrentPage(1); // Start at page 1
    setIsLoading(false);
    setPdfError(null);
    console.log(`PDF loaded from ${filePath} with ${numberOfPages} pages.`);
  };

  const handlePageChanged = (page: number, numberOfPages: number) => {
    setCurrentPage(page);
    // console.log(`Current page: ${page}/${numberOfPages}`);
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    const errorMessage = error.message || 'An unknown error occurred while loading the PDF.';
    setPdfError(errorMessage);
    if (onError) onError(error instanceof Error ? error : new Error(String(error)));
    // Alert.alert('Error', `Failed to load PDF: ${errorMessage}`);
    console.error('PDF Loading Error:', error);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages && pdfRef.current) {
      pdfRef.current.setPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1 && pdfRef.current) {
      pdfRef.current.setPage(currentPage - 1);
    }
  };

  const onSliderValueChange = (value: number) => {
    const newPage = Math.round(value);
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage && pdfRef.current) {
       // pdfRef.current.setPage(newPage); // This can be too laggy if updated live
    }
  };

  const onSlidingComplete = (value: number) => {
    const newPage = Math.round(value);
    if (newPage >= 1 && newPage <= totalPages && pdfRef.current) {
      pdfRef.current.setPage(newPage);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.messageText, { color: theme.colors.text }]}>Loading PDF...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (pdfError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <IconButton
            icon="close"
            iconColor={theme.colors.onPrimary}
            size={24}
            onPress={onClose}
          />
          <Text style={[styles.title, { color: theme.colors.onPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.messageText, { color: theme.colors.error }]}>Error: {pdfError}</Text>
          <TouchableOpacity onPress={onClose} style={[styles.button, {backgroundColor: theme.colors.errorContainer}]}>
            <Text style={{color: theme.colors.onErrorContainer}}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const source = { uri, cache: true };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <IconButton
          icon="arrow-left" // More conventional for back
          iconColor={theme.colors.onPrimary}
          size={24}
          onPress={onClose} // Assuming close means going back
        />
        <Text style={[styles.title, { color: theme.colors.onPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.spacer} />
      </View>

      {/* PDF Content */}
      <View style={styles.pdfContainer}>
        <Pdf
          ref={pdfRef}
          source={source}
          onLoadComplete={handleLoadComplete}
          onPageChanged={handlePageChanged}
          onError={handleError}
          style={styles.pdf}
          trustAllCerts={false} // Important for security with remote URLs
          enablePaging={true} // Enables swipe between pages
          horizontal={false} // Vertical scrolling/paging
        />
      </View>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
        <IconButton
          icon="chevron-left"
          size={32}
          onPress={goToPreviousPage}
          disabled={currentPage === 1}
          iconColor={currentPage === 1 ? theme.colors.disabled : theme.colors.primary}
        />
        <View style={styles.pageInfoContainer}>
          <Text style={[styles.pageInfoText, {color: theme.colors.onSurface}]}>
            Page {currentPage} of {totalPages}
          </Text>
          {totalPages > 1 && (
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={totalPages}
              step={1}
              value={currentPage}
              onValueChange={onSliderValueChange} // Use if you want live update (can be laggy)
              onSlidingComplete={onSlidingComplete} // Preferred for performance
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.onSurfaceDisabled}
              thumbTintColor={theme.colors.primary}
            />
          )}
        </View>
        <IconButton
          icon="chevron-right"
          size={32}
          onPress={goToNextPage}
          disabled={currentPage === totalPages}
          iconColor={currentPage === totalPages ? theme.colors.disabled : theme.colors.primary}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    height: 56, // Standard app bar height
  },
  title: {
    flex: 1, // Allow title to take available space
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 8, // Add some space around title
  },
  spacer: { // To balance the IconButton on the left
    width: 40,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: theme.colors.surfaceDisabled, // Themed background
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    // height is managed by flex: 1 on parent
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant, // Themed border color
  },
  pageInfoContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  pageInfoText: {
    fontSize: 14,
    marginBottom: 4, // Space between text and slider
  },
  slider: {
    width: '100%',
    height: 40, // Standard slider height
  },
});

export default PDFViewer;