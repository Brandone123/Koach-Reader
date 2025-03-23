import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import Slider from '@react-native-community/slider';
import { IconButton } from 'react-native-paper';
import { Audio } from 'expo-av';

interface AudioPlayerProps {
  uri: string;
  title: string;
  artist?: string;
  onClose?: () => void;
  onError?: (error: Error) => void;
  bookId?: number;
  artwork?: string;
}

// Format seconds to MM:SS format
const formatTime = (seconds: number): string => {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min < 10 ? '0' + min : min}:${sec < 10 ? '0' + sec : sec}`;
};

// Type pour le statut de lecture Audio
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
  artwork
}) => {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [speed, setSpeed] = useState(1);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const statusUpdateIntervalRef = useRef<number | null>(null);

  // Set up audio when component mounts
  useEffect(() => {
    let isMounted = true;
    
    const setupAudio = async () => {
      try {
        // Set audio mode for playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        
        // Load the audio file
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false, positionMillis: 0, progressUpdateIntervalMillis: 200 },
          onPlaybackStatusUpdate
        );
        
        if (isMounted) {
          soundRef.current = sound;
          setIsReady(true);
          setIsBuffering(false);
        }
      } catch (error) {
        console.error('Error loading audio:', error);
        if (onError && isMounted) onError(error as Error);
        Alert.alert('Error', 'Could not load the audio file. Please try again later.');
      }
    };
    
    setupAudio();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (statusUpdateIntervalRef.current !== null) {
        clearInterval(statusUpdateIntervalRef.current);
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [uri]);

  const onPlaybackStatusUpdate = (status: PlaybackStatus) => {
    if (!status.isLoaded) return;
    
    setIsBuffering(status.isBuffering || false);
    setIsPlaying(status.isPlaying || false);
    
    if (status.durationMillis) {
      setDuration(status.durationMillis / 1000);
    }
    
    if (status.positionMillis) {
      setPosition(status.positionMillis / 1000);
    }
  };

  const togglePlayback = async () => {
    if (!isReady || !soundRef.current) return;
    
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

  const skipForward = async () => {
    if (!isReady || !soundRef.current) return;
    
    try {
      await soundRef.current.setPositionAsync(Math.min((position + 10) * 1000, duration * 1000));
    } catch (error) {
      console.error('Error skipping forward:', error);
    }
  };

  const skipBackward = async () => {
    if (!isReady || !soundRef.current) return;
    
    try {
      await soundRef.current.setPositionAsync(Math.max(0, (position - 10) * 1000));
    } catch (error) {
      console.error('Error skipping backward:', error);
    }
  };

  const changePlaybackSpeed = async () => {
    if (!isReady || !soundRef.current) return;
    
    // Cycle through speeds: 1x -> 1.25x -> 1.5x -> 2x -> 0.75x -> 1x
    let newSpeed;
    if (speed === 1) newSpeed = 1.25;
    else if (speed === 1.25) newSpeed = 1.5;
    else if (speed === 1.5) newSpeed = 2;
    else if (speed === 2) newSpeed = 0.75;
    else newSpeed = 1;
    
    try {
      await soundRef.current.setRateAsync(newSpeed, true);
      setSpeed(newSpeed);
    } catch (error) {
      console.error('Error changing playback speed:', error);
    }
  };

  const onSliderValueChange = (value: number) => {
    setIsSeeking(true);
    setSeekValue(value);
  };

  const onSlidingComplete = async (value: number) => {
    if (!isReady || !soundRef.current) return;
    
    try {
      await soundRef.current.setPositionAsync(value * 1000);
      setIsSeeking(false);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const getPlaybackStateIcon = () => {
    if (isBuffering) return 'loading';
    if (isPlaying) return 'pause';
    return 'play';
  };

  const getPlaybackStateText = () => {
    if (isBuffering) return 'Buffering...';
    if (isPlaying) return 'Playing';
    if (!isPlaying && isReady) return 'Paused';
    return 'Loading...';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="close"
          size={24}
          onPress={onClose}
          iconColor="white"
        />
        <Text style={styles.headerTitle}>Audio Player</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.artwork}>
          <View style={styles.artworkPlaceholder}>
            <Text style={styles.artworkPlaceholderText}>📚</Text>
          </View>
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.artist}>{artist}</Text>
          <Text style={styles.status}>{getPlaybackStateText()}</Text>
        </View>

        <View style={styles.sliderContainer}>
          <Text style={styles.time}>
            {isSeeking ? formatTime(seekValue) : formatTime(position)}
          </Text>
          <Slider
            value={isSeeking ? seekValue : position}
            minimumValue={0}
            maximumValue={duration > 0 ? duration : 100}
            onValueChange={onSliderValueChange}
            onSlidingComplete={onSlidingComplete}
            disabled={!isReady}
            style={styles.slider}
            minimumTrackTintColor="#6200ee"
            maximumTrackTintColor="#d8d8d8"
            thumbTintColor="#6200ee"
          />
          <Text style={styles.time}>{formatTime(duration)}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={changePlaybackSpeed} style={styles.speedButton}>
            <Text style={styles.speedText}>{speed}x</Text>
          </TouchableOpacity>

          <IconButton
            icon="rewind-10"
            size={36}
            onPress={skipBackward}
            disabled={!isReady}
            style={styles.controlButton}
          />

          <IconButton
            icon={getPlaybackStateIcon()}
            size={64}
            onPress={togglePlayback}
            disabled={!isReady || isBuffering}
            style={[styles.controlButton, styles.playButton]}
          />

          <IconButton
            icon="fast-forward-10"
            size={36}
            onPress={skipForward}
            disabled={!isReady}
            style={styles.controlButton}
          />

          <TouchableOpacity style={styles.spacerSmall}>
            {/* Empty space for balance */}
          </TouchableOpacity>
        </View>
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
    // Removed tintColor property
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  spacer: {
    width: 40,
  },
  spacerSmall: {
    width: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  artwork: {
    width: 200,
    height: 200,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  artworkPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  artworkPlaceholderText: {
    fontSize: 64,
  },
  info: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  artist: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    color: '#888',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  time: {
    fontSize: 12,
    color: '#888',
    width: 50,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  controlButton: {
    margin: 0,
  },
  playButton: {
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
    borderRadius: 32,
    marginHorizontal: 10,
  },
  speedButton: {
    padding: 8,
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
    borderRadius: 16,
    marginRight: 10,
  },
  speedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6200ee',
  },
});

export default AudioPlayer;