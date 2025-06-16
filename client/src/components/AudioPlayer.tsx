import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  // ActivityIndicator, // Will use Paper's ActivityIndicator
  Image, // Added for artwork
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { IconButton, useTheme, ActivityIndicator as PaperActivityIndicator } from 'react-native-paper'; // Added useTheme
import { Audio } from 'expo-av';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; // Added for icons
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated'; // Added for animations

const { width: screenWidth } = Dimensions.get('window');
const ARTWORK_SIZE = screenWidth * 0.8;

interface AudioPlayerProps {
  uri: string;
  title: string;
  artist?: string;
  onClose?: () => void;
  onError?: (error: Error) => void;
  bookId?: number;
  artwork?: string;
}

const formatTime = (seconds: number): string => {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min < 10 ? '0' + min : min}:${sec < 10 ? '0' + sec : sec}`;
};

type PlaybackStatus = {
  isLoaded: boolean;
  isBuffering?: boolean;
  isPlaying?: boolean;
  durationMillis?: number;
  positionMillis?: number;
  rate?: number;
  error?: string;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  uri,
  title,
  artist = 'Unknown Author',
  onClose,
  onError,
  bookId,
  artwork,
}) => {
  const theme = useTheme();
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true); // Start with true until first status update
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(1); // Renamed from 'speed' for clarity
  
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadAudio = async () => {
      setIsBuffering(true);
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        
        const { sound, status } = await Audio.Sound.createAsync(
          { uri },
          {
            shouldPlay: false, // Don't auto-play initially
            progressUpdateIntervalMillis: 500
          },
          (newStatus) => onPlaybackStatusUpdate(newStatus as PlaybackStatus) // Ensure type safety
        );
        
        if (isMounted) {
          soundRef.current = sound;
          if ((status as PlaybackStatus).isLoaded) { // Type assertion
            setIsReady(true);
            setDuration((status as PlaybackStatus).durationMillis! / 1000);
            setIsBuffering(false);
          }
        }
      } catch (error: any) {
        console.error('Error loading audio:', error);
        if (isMounted && onError) onError(error);
        Alert.alert('Error', 'Could not load the audio file.');
        setIsBuffering(false);
      }
    };
    
    loadAudio();
    
    return () => {
      isMounted = false;
      soundRef.current?.unloadAsync();
    };
  }, [uri]);

  const onPlaybackStatusUpdate = (status: PlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error(`Audio Error: ${status.error}`);
        setIsBuffering(false);
        setIsReady(false);
        // Optionally call onError prop
      }
      return;
    }
    setIsPlaying(status.isPlaying || false);
    setIsBuffering(status.isBuffering || false);
    setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
    setPosition(status.positionMillis ? status.positionMillis / 1000 : 0);
    setCurrentSpeed(status.rate || 1);
    setIsReady(true); // Mark as ready once loaded
  };

  const togglePlayback = async () => {
    if (!isReady || !soundRef.current || isBuffering) return;
    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      if (onError) onError(error as Error);
    }
  };

  const skipTime = async (amount: number) => { // amount in seconds
    if (!isReady || !soundRef.current) return;
    const newPositionMillis = Math.max(0, Math.min(position + amount, duration)) * 1000;
    try {
      await soundRef.current.setPositionAsync(newPositionMillis);
      // If paused, playing from new position might be desired, or just set position
      // if (isPlaying) await soundRef.current.playFromPositionAsync(newPositionMillis);
      // else await soundRef.current.setPositionAsync(newPositionMillis);
    } catch (error) {
      console.error(`Error skipping time by ${amount}s:`, error);
    }
  };

  const changePlaybackSpeed = async () => {
    if (!isReady || !soundRef.current) return;
    const speeds = [1, 1.25, 1.5, 2, 0.75];
    const currentIndex = speeds.indexOf(currentSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    try {
      await soundRef.current.setRateAsync(newSpeed, true);
      setCurrentSpeed(newSpeed);
    } catch (error) {
      console.error('Error changing playback speed:', error);
    }
  };

  const onSliderValueChange = (value: number) => {
    if (!isSeeking) setIsSeeking(true); // Set seeking only if not already
    setSeekValue(value);
  };

  const onSlidingComplete = async (value: number) => {
    if (!isReady || !soundRef.current) return;
    try {
      await soundRef.current.setPositionAsync(value * 1000);
      setPosition(value); // Optimistically update position
    } catch (error) {
      console.error('Error seeking:', error);
    } finally {
      setIsSeeking(false);
    }
  };

  // Animated styles for play/pause button
  const playIconStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isPlaying ? 0 : 1, { duration: 150, easing: Easing.linear }),
    transform: [{ scale: withTiming(isPlaying ? 0.8 : 1, { duration: 150 }) }],
  }));
  const pauseIconStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isPlaying ? 1 : 0, { duration: 150, easing: Easing.linear }),
    transform: [{ scale: withTiming(isPlaying ? 1 : 0.8, { duration: 150 }) }],
  }));


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.elevation.level2, borderColor: theme.colors.outline }]}>
        <IconButton icon="chevron-down" size={28} onPress={onClose} iconColor={theme.colors.onSurface} />
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>Now Playing</Text>
        <IconButton icon="dots-vertical" size={24} onPress={() => {}} iconColor={theme.colors.onSurface} />
      </View>

      <View style={styles.content}>
        <View style={[styles.artworkContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
          {artwork ? (
            <Image source={{ uri: artwork }} style={styles.artworkImage} resizeMode="cover" />
          ) : (
            <MaterialCommunityIcons name="book-music" size={ARTWORK_SIZE * 0.5} color={theme.colors.onSurfaceVariant} />
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]} numberOfLines={1}>{title}</Text>
          <Text style={[styles.artist, { color: theme.colors.secondary }]}>{artist}</Text>
        </View>

        <View style={styles.sliderContainer}>
          <Text style={[styles.timeText, { color: theme.colors.onSurfaceVariant }]}>
            {isSeeking ? formatTime(seekValue) : formatTime(position)}
          </Text>
          <Slider
            style={styles.slider}
            value={isSeeking ? seekValue : position} // Use current position when not seeking
            minimumValue={0}
            maximumValue={duration > 0 ? duration : 1} // Prevent NaN if duration is 0
            disabled={!isReady || isBuffering}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.surfaceDisabled} // Or theme.colors.outline
            thumbTintColor={theme.colors.primary}
            onValueChange={onSliderValueChange}
            onSlidingComplete={onSlidingComplete}
          />
          <Text style={[styles.timeText, { color: theme.colors.onSurfaceVariant }]}>{formatTime(duration)}</Text>
        </View>

        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={changePlaybackSpeed} style={[styles.speedControlButton, {borderColor: theme.colors.primary}]}>
            <Text style={[styles.speedControlText, { color: theme.colors.primary }]}>{currentSpeed}x</Text>
          </TouchableOpacity>

          <IconButton
            icon="rewind-10"
            size={38}
            onPress={() => skipTime(-10)}
            disabled={!isReady || isBuffering}
            iconColor={theme.colors.onSurface}
            style={styles.controlButton}
          />

          <View style={styles.playPauseButtonContainer}>
            {isBuffering && !isReady ? ( // Show main loader only if not ready yet. Buffering during play is handled by icon state.
              <PaperActivityIndicator animating={true} color={theme.colors.primary} size="large" />
            ) : (
              <TouchableOpacity onPress={togglePlayback} style={styles.playPauseTouchable} disabled={!isReady || isBuffering}>
                <Animated.View style={[StyleSheet.absoluteFill, styles.iconContainer, playIconStyle]}>
                  <MaterialCommunityIcons name={isBuffering ? "progress-clock" : "play-circle-outline"} size={72} color={theme.colors.primary} />
                </Animated.View>
                <Animated.View style={[StyleSheet.absoluteFill, styles.iconContainer, pauseIconStyle]}>
                  <MaterialCommunityIcons name="pause-circle-outline" size={72} color={theme.colors.primary} />
                </Animated.View>
              </TouchableOpacity>
            )}
          </View>

          <IconButton
            icon="fast-forward-10"
            size={38}
            onPress={() => skipTime(10)}
            disabled={!isReady || isBuffering}
            iconColor={theme.colors.onSurface}
            style={styles.controlButton}
          />
          {/* Placeholder for balance or other controls like shuffle/repeat */}
          <View style={styles.placeholderControlButton} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor handled by theme
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // backgroundColor handled by theme
    paddingHorizontal: 12, // Adjusted padding
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: theme.colors.outlineVariant, // Added theme color
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600', // Semibold
    // color handled by theme
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around', // Distribute space more evenly
    paddingHorizontal: 20,
    paddingVertical: 20, // Ensure adequate padding
  },
  artworkContainer: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 12, // Softer corners
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    overflow: 'hidden', // Ensure image respects border radius
    // backgroundColor handled by theme
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    alignItems: 'center',
    marginVertical: 20, // Add more vertical margin
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
    // color handled by theme
  },
  artist: {
    fontSize: 16,
    // color handled by theme
    textAlign: 'center',
  },
  // Removed status text, buffering is shown on play icon or global loader
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20, // Add more vertical margin
  },
  slider: {
    flex: 1,
    height: 40, // Standard RN Community Slider height
    marginHorizontal: 10,
  },
  timeText: {
    fontSize: 13,
    minWidth: 45, // Ensure space for MM:SS
    textAlign: 'center',
    // color handled by theme
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around', // Space out controls
    width: '100%',
    paddingHorizontal: 10, // Padding for the container
    marginBottom: 20, // Margin at the bottom
  },
  controlButton: { // General style for skip buttons
    margin: 0, // Remove default margin if IconButton has it
  },
  playPauseButtonContainer: {
    width: 72, // Size of the icon
    height: 72, // Size of the icon
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20, // Space around play/pause
  },
  playPauseTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: { // For absolute positioning of play/pause icons
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedControlButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20, // Pill shape
    borderWidth: 1,
    // borderColor handled by theme
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50, // Ensure it's not too small
  },
  speedControlText: {
    fontSize: 14,
    fontWeight: 'bold',
    // color handled by theme
  },
  placeholderControlButton: { // To balance the flex layout if needed
    width: 50, // Match approx width of speed control
  }
  // Removed old styles that are no longer used
});

export default AudioPlayer;