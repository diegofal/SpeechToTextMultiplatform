import { useEffect, useState } from 'react';
import { NativeModules, NativeEventEmitter, EmitterSubscription, Platform } from 'react-native';

// Define types for our API
type TranscriptResult = {
  transcript: string;
  isFinal: boolean;
};

type MeetingTranscriptionHook = {
  isCapturing: boolean;
  transcripts: string[];
  currentTranscript: string;
  error: string;
  startCapture: (language: string) => Promise<void>;
  stopCapture: () => Promise<void>;
  clearTranscripts: () => void;
  isNativeModuleAvailable: boolean;
};

// Check if the native module is available
const { AudioCaptureModule } = NativeModules;
const isModuleAvailable = !!AudioCaptureModule;

const useMeetingTranscription = (): MeetingTranscriptionHook => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState('');
  const [isNativeModuleAvailable, setIsNativeModuleAvailable] = useState(isModuleAvailable);
  
  useEffect(() => {
    // Log native module availability for debugging
    console.log('AudioCaptureModule available:', !!AudioCaptureModule);
    console.log('Native Modules:', Object.keys(NativeModules));
    
    let eventEmitter: NativeEventEmitter | null = null;
    let subscriptions: EmitterSubscription[] = [];
    
    if ((Platform.OS === 'android' || Platform.OS === 'ios') && AudioCaptureModule) {
      try {
        // Set up event listeners
        eventEmitter = new NativeEventEmitter(AudioCaptureModule);
        
        // Listen for transcript results
        const resultSubscription = eventEmitter.addListener(
          'onTranscriptResult',
          (result: TranscriptResult) => {
            if (result.isFinal) {
              // Add final transcript to the list
              setTranscripts(prevTranscripts => [...prevTranscripts, result.transcript]);
              setCurrentTranscript('');
            } else {
              // Update current (interim) transcript
              setCurrentTranscript(result.transcript);
            }
          }
        );
        
        // Listen for errors
        const errorSubscription = eventEmitter.addListener(
          'onSpeechError',
          (event: any) => {
            if (event && event.error) {
              setError(`Error: ${event.error}`);
            }
          }
        );
        
        // Add other event listeners as needed
        const startSubscription = eventEmitter.addListener(
          'onAudioCaptureStarted',
          () => {
            setIsCapturing(true);
            setError('');
          }
        );
        
        const stopSubscription = eventEmitter.addListener(
          'onAudioCaptureStopped',
          () => {
            setIsCapturing(false);
          }
        );
        
        const errorCaptureSubscription = eventEmitter.addListener(
          'onAudioCaptureError',
          (errorMsg: string) => {
            setError(`Capture error: ${errorMsg}`);
            setIsCapturing(false);
          }
        );
        
        // Store subscriptions for cleanup
        subscriptions = [
          resultSubscription,
          errorSubscription,
          startSubscription,
          stopSubscription,
          errorCaptureSubscription
        ];
      } catch (err) {
        console.error('Error setting up event listeners:', err);
        setError('Failed to set up audio capture listeners');
      }
    } else {
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        setError('Native module not available on this device');
      } else {
        setError('Meeting transcription is only available on mobile devices');
      }
    }
    
    // Cleanup function
    return () => {
      if (subscriptions.length > 0) {
        subscriptions.forEach(subscription => subscription.remove());
      }
    };
  }, []);
  
  // Start capture with specified language
  const startCapture = async (language: string = 'en-US') => {
    try {
      setError('');
      
      if ((Platform.OS === 'android' || Platform.OS === 'ios') && AudioCaptureModule) {
        // Request permission first
        const hasPermission = await AudioCaptureModule.requestAudioCapturePermission();
        
        if (hasPermission) {
          // Start the capture service with language
          await AudioCaptureModule.startCapture(language);
          return;
        } else {
          throw new Error('Permission denied');
        }
      } else {
        throw new Error(Platform.OS === 'web' ? 
          'Not supported on web' : 
          'Native module not available');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to start capture: ${errorMessage}`);
      throw err;
    }
  };
  
  // Stop capture
  const stopCapture = async () => {
    try {
      if ((Platform.OS === 'android' || Platform.OS === 'ios') && AudioCaptureModule) {
        await AudioCaptureModule.stopAudioCapture();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to stop capture: ${errorMessage}`);
      throw err;
    }
  };
  
  // Clear transcripts
  const clearTranscripts = () => {
    setTranscripts([]);
    setCurrentTranscript('');
    setError('');
  };
  
  return {
    isCapturing,
    transcripts,
    currentTranscript,
    error,
    startCapture,
    stopCapture,
    clearTranscripts,
    isNativeModuleAvailable
  };
};

export default useMeetingTranscription;
