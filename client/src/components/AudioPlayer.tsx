import React, { useState, useEffect } from 'react';
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
import TrackPlayer, {
  Capability,
  Event,
  RepeatMode,
  State,
  useTrackPlayerEvents,
  usePlaybackState,
  useProgress,
  Track
} from 'react-native-track-player';
import { IconButton } from 'react-native-paper';

interface AudioPlayerProps {
  uri: string;
  title: string;
  artist?: string;
  onClose?: () => void;
  onError?: (error: Error) => void;
  bookId?: number;
  artwork?: string;
}

// Initialize TrackPlayer
const setupPlayer = async () => {
  try {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.Stop,
        Capability.SeekTo,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
    });
    return true;
  } catch (error) {
    console.error('Error setting up TrackPlayer:', error);
    return false;
  }
};

// Format seconds to MM:SS format
const formatTime = (seconds: number): string => {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min < 10 ? '0' + min : min}:${sec < 10 ? '0' + sec : sec}`;
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
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [speed, setSpeed] = useState(1);
  
  const playbackState = usePlaybackState();
  const progress = useProgress(200);
  
  // Set up player when component mounts
  useEffect(() => {
    let mounted = true;
    
    (async () => {
      const setup = await setupPlayer();
      if (mounted && setup) {
        const track: Track = {
          url: uri,
          title: title,
          artist: artist,
          artwork: artwork,
        };

        try {
          await TrackPlayer.reset();
          await TrackPlayer.add([track]);
          setIsPlayerReady(true);
        } catch (error) {
          console.error('Error adding track:', error);
          if (onError) onError(error as Error);
          Alert.alert('Error', 'Could not load the audio file. Please try again later.');
        }
      }
    })();

    return () => {
      mounted = false;
      TrackPlayer.reset(); // Use reset instead of destroy which might not be available in current version
    };
  }, [uri, title, artist, artwork]);

  // Listen for player events
  useTrackPlayerEvents([Event.PlaybackState, Event.PlaybackError], async (event) => {
    if (event.type === Event.PlaybackError) {
      console.error('An error occurred', event.message);
      if (onError) onError(new Error(event.message));
      Alert.alert('Playback Error', 'An error occurred during playback.');
    }
    
    if (event.type === Event.PlaybackState) {
      if (event.state === State.Buffering) {
        setIsBuffering(true);
      } else {
        setIsBuffering(false);
      }
    }
  });

  const togglePlayback = async () => {
    if (!isPlayerReady) return;
    
    const currentState = await TrackPlayer.getState();
    
    if (currentState === State.Playing) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  };

  const skipForward = async () => {
    if (!isPlayerReady) return;
    await TrackPlayer.seekTo(progress.position + 10);
  };

  const skipBackward = async () => {
    if (!isPlayerReady) return;
    await TrackPlayer.seekTo(Math.max(0, progress.position - 10));
  };

  const changePlaybackSpeed = async () => {
    if (!isPlayerReady) return;
    
    // Cycle through speeds: 1x -> 1.25x -> 1.5x -> 2x -> 0.75x -> 1x
    let newSpeed;
    if (speed === 1) newSpeed = 1.25;
    else if (speed === 1.25) newSpeed = 1.5;
    else if (speed === 1.5) newSpeed = 2;
    else if (speed === 2) newSpeed = 0.75;
    else newSpeed = 1;
    
    await TrackPlayer.setRate(newSpeed);
    setSpeed(newSpeed);
  };

  const onSliderValueChange = (value: number) => {
    setIsSeeking(true);
    setSeekValue(value);
  };

  const onSlidingComplete = async (value: number) => {
    await TrackPlayer.seekTo(value);
    setIsSeeking(false);
  };

  const getPlaybackStateIcon = () => {
    if (isBuffering) return 'loading';
    if (playbackState && playbackState.state === State.Playing) return 'pause';
    return 'play';
  };

  const getPlaybackStateText = () => {
    if (isBuffering) return 'Buffering...';
    if (playbackState && playbackState.state === State.Playing) return 'Playing';
    if (playbackState && playbackState.state === State.Paused) return 'Paused';
    if (playbackState && playbackState.state === State.Stopped) return 'Stopped';
    return 'Loading...';
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
        <Text style={styles.headerTitle}>Audio Player</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.artwork}>
          {artwork ? (
            <View style={styles.artworkPlaceholder}>
              <Text style={styles.artworkPlaceholderText}>📚</Text>
            </View>
          ) : (
            <View style={styles.artworkPlaceholder}>
              <Text style={styles.artworkPlaceholderText}>📚</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.artist}>{artist}</Text>
          <Text style={styles.status}>{getPlaybackStateText()}</Text>
        </View>

        <View style={styles.sliderContainer}>
          <Text style={styles.time}>
            {isSeeking ? formatTime(seekValue) : formatTime(progress.position)}
          </Text>
          <Slider
            value={isSeeking ? seekValue : progress.position}
            minimumValue={0}
            maximumValue={progress.duration > 0 ? progress.duration : 100}
            onValueChange={onSliderValueChange}
            onSlidingComplete={onSlidingComplete}
            disabled={!isPlayerReady}
            style={styles.slider}
            minimumTrackTintColor="#6200ee"
            maximumTrackTintColor="#d8d8d8"
            thumbTintColor="#6200ee"
          />
          <Text style={styles.time}>{formatTime(progress.duration)}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={changePlaybackSpeed} style={styles.speedButton}>
            <Text style={styles.speedText}>{speed}x</Text>
          </TouchableOpacity>

          <IconButton
            icon="rewind-10"
            size={36}
            onPress={skipBackward}
            disabled={!isPlayerReady}
            style={styles.controlButton}
          />

          <IconButton
            icon={getPlaybackStateIcon()}
            size={56}
            onPress={togglePlayback}
            disabled={!isPlayerReady}
            style={styles.playButton}
          />

          <IconButton
            icon="fast-forward-10"
            size={36}
            onPress={skipForward}
            disabled={!isPlayerReady}
            style={styles.controlButton}
          />

          <View style={styles.speedButton} />
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
    // Style for the button container
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  artwork: {
    width: 220,
    height: 220,
    marginBottom: 24,
  },
  artworkPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  artworkPlaceholderText: {
    fontSize: 80,
  },
  info: {
    alignItems: 'center',
    marginBottom: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  artist: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  status: {
    fontSize: 14,
    color: '#6200ee',
    fontWeight: '500',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
  time: {
    fontSize: 12,
    color: '#666',
    width: 45,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  controlButton: {
    margin: 0,
  },
  playButton: {
    backgroundColor: '#6200ee',
    borderRadius: 30,
    margin: 0,
  },
  speedButton: {
    width: 50,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  speedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6200ee',
  },
});

export default AudioPlayer;