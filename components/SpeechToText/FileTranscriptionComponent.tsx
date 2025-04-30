import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';

// Language options for the speech recognition
const LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'es-ES', name: 'Spanish' },
];

export default function FileTranscriptionComponent() {
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [statusMessage, setStatusMessage] = useState('Select an audio file to transcribe');
  const [progress, setProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Create recognition instance
  const initRecognition = (language: string) => {
    if (typeof window === 'undefined') return null;
    
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || 
                              (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setError('Speech recognition not supported in this browser');
        return null;
      }
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      
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
        setIsProcessing(false);
      };
      
      recognition.onend = () => {
        console.log('Recognition ended');
        setIsProcessing(false);
        setStatusMessage('Transcription complete');
      };
      
      return recognition;
    } catch (e) {
      console.error('Error initializing speech recognition:', e);
      setError(`Error initializing speech recognition: ${e}`);
      return null;
    }
  };
  
  const handleFileSelection = async () => {
    // Create file input element and trigger click
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*';
      fileInputRef.current = input;
      
      input.onchange = (e: any) => processAudioFile(e.target.files[0]);
    }
    
    fileInputRef.current.click();
  };
  
  const processAudioFile = async (file: File) => {
    if (!file) return;
    
    try {
      setIsProcessing(true);
      setError('');
      setTranscripts([]);
      setStatusMessage(`Processing file: ${file.name}`);
      
      // Initialize speech recognition
      const recognition = initRecognition(selectedLanguage);
      if (!recognition) {
        throw new Error('Could not initialize speech recognition');
      }
      
      recognitionRef.current = recognition;
      
      // Create audio context and process the file
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      
      // Read the file
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      setStatusMessage('Transcribing audio...');
      
      // Create buffer source and connect to audio context
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Connect to destination for playback
      source.connect(audioContext.destination);
      
      // Set up progress tracking
      const duration = audioBuffer.duration;
      let startTime = audioContext.currentTime;
      
      source.onended = () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        setStatusMessage('Transcription complete');
        setIsProcessing(false);
      };
      
      // Start recognition
      recognition.start();
      
      // Start playback
      source.start();
      
      // Update progress
      const updateProgress = () => {
        if (isProcessing) {
          const elapsed = audioContext.currentTime - startTime;
          const percent = Math.min((elapsed / duration) * 100, 100);
          setProgress(percent);
          
          if (percent < 100) {
            requestAnimationFrame(updateProgress);
          }
        }
      };
      
      requestAnimationFrame(updateProgress);
      
    } catch (e) {
      console.error('Error processing audio file:', e);
      setError(`Error processing audio file: ${e}`);
      setIsProcessing(false);
      setStatusMessage('Failed to process audio file');
    }
  };
  
  const stopTranscription = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
    
    setIsProcessing(false);
    setStatusMessage('Transcription stopped');
  };
  
  const clearTranscripts = () => {
    setTranscripts([]);
    setError('');
    setProgress(0);
    setStatusMessage('Select an audio file to transcribe');
  };

  // Render web-only content
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Meeting Transcription</Text>
        <Text style={styles.errorText}>This feature is only available on web browsers.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meeting Audio Transcription</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Upload an audio recording of your meeting to transcribe it.
          This works with MP3, WAV, and most audio formats.
        </Text>
      </View>
      
      <View style={styles.languageSelector}>
        <Text style={styles.languageLabel}>Audio Language:</Text>
        <View style={styles.languageButtons}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageButton,
                selectedLanguage === lang.code && styles.selectedLanguage
              ]}
              onPress={() => setSelectedLanguage(lang.code)}
              disabled={isProcessing}
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
        {!isProcessing ? (
          <TouchableOpacity 
            style={[styles.button, styles.startButton]}
            onPress={handleFileSelection}>
            <Text style={styles.buttonText}>Select Meeting Recording</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.button, styles.stopButton]}
            onPress={stopTranscription}>
            <Text style={styles.buttonText}>Stop Transcribing</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.button, styles.resetButton]}
          onPress={clearTranscripts}
          disabled={isProcessing}>
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
        
        {isProcessing && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${progress}%` }]} 
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}
      </View>
      
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Meeting Transcript:</Text>
        <ScrollView style={styles.resultScroll}>
          {transcripts.map((text, index) => (
            <Text key={index} style={styles.transcriptText}>{text}</Text>
          ))}
          {transcripts.length === 0 && (
            <Text style={styles.placeholderText}>
              {isProcessing ? 'Transcribing...' : 'Transcripts will appear here after processing...'}
            </Text>
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
    marginBottom: 8,
  },
  progressContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4285F4',
  },
  progressText: {
    fontSize: 12,
    minWidth: 40,
    textAlign: 'right',
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
