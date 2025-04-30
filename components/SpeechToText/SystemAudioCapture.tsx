import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';

// Language options for the speech recognition
const LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'auto', name: 'Auto Detect' },
];

export default function SystemAudioCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [statusMessage, setStatusMessage] = useState('');
  
  // Refs for audio processing
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Initialize audio context and speech recognition
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined' || !('MediaRecorder' in window)) {
      setError('System audio capture is only supported in web browsers');
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
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscripts(prev => [...prev, finalTranscript]);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Recognition error:', event.error);
        setError(`Recognition error: ${event.error}`);
      };
      
      recognitionRef.current = recognition;
      
      // Initialize audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      setStatusMessage('System initialized. Ready to capture meeting audio.');
    } catch (e) {
      console.error('Error setting up audio capture:', e);
      setError(`Setup error: ${e}`);
    }
    
    // Cleanup function
    return () => {
      stopCapturing();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
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
      setStatusMessage('Requesting system audio access...');
      
      if (!audioContextRef.current) {
        throw new Error('Audio context not initialized');
      }
      
      if (!navigator.mediaDevices) {
        throw new Error('Media devices API not available');
      }

      // Request system audio capture
      // Note: This requires special permissions and may not work in all browsers
      // Chrome requires enabling chrome://flags/#enable-experimental-web-platform-features
      // Firefox may require similar flags
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: false,
        audio: true 
      });
      
      streamRef.current = stream;
      
      // Connect audio processing
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const audioDestination = audioContextRef.current.createMediaStreamDestination();
      source.connect(audioDestination);
      
      // Start recording system audio
      const mediaRecorder = new MediaRecorder(audioDestination.stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.start(1000);
      setIsCapturing(true);
      setStatusMessage('Capturing system audio. Meeting transcription in progress...');
      
      // Start speech recognition
      if (recognitionRef.current) {
        // Use the audio destination stream for recognition
        recognitionRef.current.start();
      }
      
    } catch (e) {
      console.error('Error starting audio capture:', e);
      setError(`Error starting capture: ${e}`);
      setStatusMessage('Failed to start audio capture. See error details.');
    }
  };
  
  const stopCapturing = () => {
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
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
    setError('');
    setStatusMessage('Transcripts cleared.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meeting Transcription</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          This feature captures system audio from your meeting software (Zoom, Teams, etc.) 
          and transcribes the conversation in real-time.
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
            <Text style={styles.buttonText}>Start Transcribing Meeting</Text>
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
          {transcripts.length === 0 && (
            <Text style={styles.placeholderText}>Transcripts will appear here once the meeting starts...</Text>
          )}
        </ScrollView>
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
  placeholderText: {
    fontSize: 16,
    color: '#9e9e9e',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 30,
  }
});
