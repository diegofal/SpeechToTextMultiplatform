import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';

// Language options for the speech recognition
const LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'auto', name: 'Auto Detect' },
];

export default function TabAudioCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [statusMessage, setStatusMessage] = useState('');
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  // Refs for audio processing
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Initialize speech recognition
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined' || Platform.OS !== 'web') {
      setError('This feature is only available in web browsers');
      return;
    }

    try {
      // Initialize Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || 
                               (window as any).webkitSpeechRecognition;
        
      if (!SpeechRecognition) {
        setError('Speech recognition not supported in this browser');
        return;
      }
      
      // Create recognition instance
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage === 'auto' ? '' : selectedLanguage;
      
      // Set up recognition handlers
      recognition.onstart = () => {
        console.log('Recognition started');
      };
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscripts(prev => [...prev, finalTranscript]);
          setCurrentTranscript('');
        }
        
        if (interimTranscript) {
          setCurrentTranscript(interimTranscript);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Recognition error:', event.error);
        setError(`Recognition error: ${event.error}`);
      };
      
      recognition.onend = () => {
        console.log('Recognition ended');
        if (isCapturing) {
          // If we're still capturing, restart recognition
          // This handles the automatic timeout that some browsers impose
          recognition.start();
        }
      };
      
      recognitionRef.current = recognition;
      setStatusMessage('Ready to capture meeting audio from a browser tab.');
    } catch (e) {
      console.error('Error setting up recognition:', e);
      setError(`Setup error: ${e}`);
    }
    
    // Cleanup function
    return () => {
      stopCapturing();
    };
  }, []);
  
  // Update language when it changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = selectedLanguage === 'auto' ? '' : selectedLanguage;
    }
  }, [selectedLanguage]);
  
  const startCapturing = async () => {
    try {
      setError('');
      setStatusMessage('Requesting tab audio access...');
      
      if (!navigator.mediaDevices) {
        throw new Error('Media devices API not available');
      }

      // Request tab audio capture - this works in Chrome without experimental flags
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: false,
        audio: true,
        // @ts-ignore - This property exists in Chrome but isn't in the type definitions
        preferCurrentTab: true
      });
      
      streamRef.current = stream;
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      
      setIsCapturing(true);
      setStatusMessage('Capturing tab audio. Meeting transcription in progress...');
      
    } catch (e) {
      console.error('Error starting tab audio capture:', e);
      setError(`Error starting capture: ${e}`);
      setStatusMessage('Failed to start audio capture. See error details.');
    }
  };
  
  const stopCapturing = () => {
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Stop recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
    
    setIsCapturing(false);
    setStatusMessage('Audio capture stopped. Transcription complete.');
  };
  
  const clearTranscripts = () => {
    setTranscripts([]);
    setCurrentTranscript('');
    setError('');
    setStatusMessage('Transcripts cleared.');
  };

  // Non-web platforms
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Tab Audio Capture</Text>
        <Text style={styles.errorText}>This feature is only available on web browsers.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Real-Time Meeting Transcription</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          This feature captures audio from your browser tab where the meeting is happening.
          Open your meeting in another tab or window and select that tab when prompted.
        </Text>
      </View>
      
      <View style={styles.languageSelector}>
        <Text style={styles.languageLabel}>Meeting Language:</Text>
        <View style={styles.languageButtons}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageButton,
                selectedLanguage === lang.code && styles.selectedLanguage
              ]}
              onPress={() => setSelectedLanguage(lang.code)}
              disabled={isCapturing}
            >
              <Text style={[
                styles.languageButtonText,
                selectedLanguage === lang.code && styles.selectedLanguageText
              ]}>
                {lang.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        {!isCapturing ? (
          <TouchableOpacity 
            style={[styles.button, styles.startButton]}
            onPress={startCapturing}>
            <Text style={styles.buttonText}>Start Tab Transcription</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.button, styles.stopButton]}
            onPress={stopCapturing}>
            <Text style={styles.buttonText}>Stop Transcribing</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.button, styles.resetButton]}
          onPress={clearTranscripts}>
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      </View>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{statusMessage}</Text>
      </View>
      
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Meeting Transcript:</Text>
        <ScrollView style={styles.resultScroll}>
          {transcripts.map((text, index) => (
            <Text key={index} style={styles.transcriptText}>{text}</Text>
          ))}
          
          {currentTranscript ? (
            <Text style={styles.currentTranscriptText}>{currentTranscript}</Text>
          ) : null}
          
          {transcripts.length === 0 && !currentTranscript && (
            <Text style={styles.placeholderText}>Transcripts will appear here once the meeting starts...</Text>
          )}
        </ScrollView>
      </View>
      
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          When prompted, select "Chrome Tab" (or equivalent) and choose the tab where your meeting is running.
          Make sure to check the "Share audio" option.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#e1f5fe',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  infoText: {
    color: '#01579b',
    textAlign: 'center',
  },
  languageSelector: {
    marginBottom: 20,
  },
  languageLabel: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  languageButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  languageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedLanguage: {
    backgroundColor: '#4285F4',
    borderColor: '#2b6bc3',
  },
  languageButtonText: {
    color: '#333',
  },
  selectedLanguageText: {
    color: 'white',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    margin: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  startButton: {
    backgroundColor: '#4285F4',
  },
  stopButton: {
    backgroundColor: '#EA4335',
  },
  resetButton: {
    backgroundColor: '#34A853',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: 'white',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultScroll: {
    flex: 1,
  },
  transcriptText: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  currentTranscriptText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    borderLeftWidth: 2,
    borderLeftColor: '#4285F4',
    paddingLeft: 8,
    marginBottom: 12,
    lineHeight: 22,
  },
  placeholderText: {
    fontSize: 16,
    color: '#9e9e9e',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 30,
  },
  instructionsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff9c4',
    borderRadius: 8,
  },
  instructionsText: {
    color: '#5d4037',
    fontSize: 12,
    textAlign: 'center',
  }
});
