import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';

type SpeechState = {
  recognized: string;
  pitch: string;
  error: string;
  end: string;
  started: string;
  results: string[];
  partialResults: string[];
  isListening: boolean;
};

// Define the return type for our hook
type SpeechRecognitionHook = {
  speechState: SpeechState;
  startRecognizing: (language?: string) => Promise<void>;
  stopRecognizing: () => Promise<void>;
  cancelRecognizing: () => Promise<void>;
  destroyRecognizer: () => Promise<void>;
};

// Web implementation using the Web Speech API
const useWebSpeechRecognition = (): SpeechRecognitionHook => {
  const [speechState, setSpeechState] = useState<SpeechState>({
    recognized: '',
    pitch: '',
    error: '',
    end: '',
    started: '',
    results: [],
    partialResults: [],
    isListening: false,
  });

  // Store recognition instance in ref to persist between renders
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Check if the Web Speech API is available
    const webSpeechAvailable =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    // Get the SpeechRecognition constructor
    const SpeechRecognition = webSpeechAvailable
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      // Configure the recognition
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      setRecognition(recognitionInstance);
    } else {
      console.error('Web Speech API is not supported in this browser');
      setSpeechState(prev => ({
        ...prev,
        error: 'Speech recognition not supported in this browser'
      }));
    }
  }, []);

  useEffect(() => {
    if (!recognition) return;

    const handleStart = () => {
      console.log('Speech recognition started');
      setSpeechState(prev => ({ ...prev, started: '✓', isListening: true }));
    };

    const handleResult = (event: any) => {
      console.log('Speech recognition result', event);
      let final = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (final) {
        console.log('Final result:', final);
        setSpeechState(prev => ({
          ...prev,
          results: [...prev.results, final],
        }));
      }
      
      if (interim) {
        console.log('Interim result:', interim);
        setSpeechState(prev => ({
          ...prev,
          partialResults: [interim],
        }));
      }
    };

    const handleError = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setSpeechState(prev => ({ ...prev, error: event.error }));
    };

    const handleEnd = () => {
      console.log('Speech recognition ended');
      setSpeechState(prev => ({ ...prev, end: '✓', isListening: false }));
    };

    // Set up event handlers
    recognition.onstart = handleStart;
    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = handleEnd;

    return () => {
      if (recognition) {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
      }
    };
  }, [recognition]);

  const startRecognizing = async (language = 'en-US') => {
    if (!recognition) {
      console.error('Web Speech Recognition not available');
      setSpeechState(prev => ({
        ...prev,
        error: 'Web Speech Recognition not available',
      }));
      return;
    }

    // Reset states
    setSpeechState({
      recognized: '',
      pitch: '',
      error: '',
      started: '',
      results: [],
      partialResults: [],
      end: '',
      isListening: true,
    });

    try {
      // Make sure recognition is not already running
      recognition.abort();
      recognition.lang = language;
      console.log('Starting speech recognition...');
      recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setSpeechState(prev => ({
        ...prev, 
        error: `Failed to start: ${error}`,
        isListening: false
      }));
    }
  };

  const stopRecognizing = async () => {
    if (recognition) {
      try {
        recognition.stop();
        console.log('Stopping speech recognition');
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
      setSpeechState(prev => ({ ...prev, isListening: false }));
    }
  };

  const cancelRecognizing = async () => {
    if (recognition) {
      try {
        recognition.abort();
        console.log('Aborting speech recognition');
      } catch (error) {
        console.error('Error aborting speech recognition:', error);
      }
      setSpeechState(prev => ({ ...prev, isListening: false }));
    }
  };

  const destroyRecognizer = async () => {
    if (recognition) {
      try {
        recognition.abort();
        console.log('Destroying speech recognition');
      } catch (error) {
        console.error('Error destroying speech recognition:', error);
      }
    }
    // Reset state
    setSpeechState({
      recognized: '',
      pitch: '',
      error: '',
      started: '',
      results: [],
      partialResults: [],
      end: '',
      isListening: false,
    });
  };

  return {
    speechState,
    startRecognizing,
    stopRecognizing,
    cancelRecognizing,
    destroyRecognizer,
  };
};

// Native implementation using @react-native-voice/voice
const useNativeSpeechRecognition = (): SpeechRecognitionHook => {
  const [speechState, setSpeechState] = useState<SpeechState>({
    recognized: '',
    pitch: '',
    error: '',
    end: '',
    started: '',
    results: [],
    partialResults: [],
    isListening: false,
  });

  useEffect(() => {
    function onSpeechStart(e: any) {
      setSpeechState(prev => ({ ...prev, started: '✓' }));
    }

    function onSpeechRecognized(e: any) {
      setSpeechState(prev => ({ ...prev, recognized: '✓' }));
    }

    function onSpeechEnd(e: any) {
      setSpeechState(prev => ({ ...prev, end: '✓', isListening: false }));
    }

    function onSpeechError(e: SpeechErrorEvent) {
      setSpeechState(prev => ({ ...prev, error: JSON.stringify(e.error) }));
    }

    function onSpeechResults(e: SpeechResultsEvent) {
      if (e.value) {
        setSpeechState(prev => ({ ...prev, results: e.value || [] }));
      }
    }

    function onSpeechPartialResults(e: SpeechResultsEvent) {
      if (e.value) {
        setSpeechState(prev => ({ ...prev, partialResults: e.value || [] }));
      }
    }

    function onSpeechVolumeChanged(e: any) {
      setSpeechState(prev => ({ ...prev, pitch: e.value }));
    }

    // Add all event listeners
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechRecognized = onSpeechRecognized;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechVolumeChanged = onSpeechVolumeChanged;

    // Cleanup listeners when component unmounts
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startRecognizing = async (language = 'en-US') => {
    // Reset states
    setSpeechState({
      recognized: '',
      pitch: '',
      error: '',
      started: '',
      results: [],
      partialResults: [],
      end: '',
      isListening: true,
    });

    try {
      await Voice.start(language);
    } catch (e) {
      console.error(e);
    }
  };

  const stopRecognizing = async () => {
    try {
      await Voice.stop();
      setSpeechState(prev => ({ ...prev, isListening: false }));
    } catch (e) {
      console.error(e);
    }
  };

  const cancelRecognizing = async () => {
    try {
      await Voice.cancel();
      setSpeechState(prev => ({ ...prev, isListening: false }));
    } catch (e) {
      console.error(e);
    }
  };

  const destroyRecognizer = async () => {
    try {
      await Voice.destroy();
    } catch (e) {
      console.error(e);
    }
    // Reset states
    setSpeechState({
      recognized: '',
      pitch: '',
      error: '',
      started: '',
      results: [],
      partialResults: [],
      end: '',
      isListening: false,
    });
  };

  return {
    speechState,
    startRecognizing,
    stopRecognizing,
    cancelRecognizing,
    destroyRecognizer,
  };
};

// Main hook that selects the appropriate implementation based on platform
export default function useSpeechRecognition(): SpeechRecognitionHook {
  // Use platform-specific implementation
  return Platform.OS === 'web'
    ? useWebSpeechRecognition()
    : useNativeSpeechRecognition();
}
