import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator
} from 'react-native';
import useMeetingTranscription from '../../hooks/useMeetingTranscription';

// Language options for the speech recognition
const LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'auto', name: 'Auto Detect' }
];

export default function MeetingTranscriptionComponent() {
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const {
    isCapturing,
    transcripts,
    currentTranscript,
    error,
    startCapture,
    stopCapture,
    clearTranscripts
  } = useMeetingTranscription();

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    Platform.OS === 'web' 
      ? 'Meeting transcription is only available on mobile devices.' 
      : 'Ready to transcribe your meeting.'
  );

  const handleStartCapture = async () => {
    try {
      setIsLoading(true);
      setStatusMessage('Requesting permissions...');
      await startCapture(selectedLanguage);
      setStatusMessage('Transcribing meeting audio...');
    } catch (err) {
      setStatusMessage('Failed to start meeting transcription.');
      console.error('Failed to start capture:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopCapture = async () => {
    try {
      setIsLoading(true);
      await stopCapture();
      setStatusMessage('Meeting transcription stopped.');
    } catch (err) {
      console.error('Failed to stop capture:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearTranscripts = () => {
    clearTranscripts();
    setStatusMessage('Transcripts cleared.');
  };

  // If on web, show a message that this feature is mobile-only
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Meeting Transcription</Text>
        <View style={styles.webMessageContainer}>
          <Text style={styles.webMessage}>
            Meeting transcription requires native device features and is only available 
            on iOS and Android devices. Please use the mobile app to access this feature.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Real-Time Meeting Transcription</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          This feature captures audio from your meetings and transcribes it in real-time.
          Works with Zoom, Teams, Google Meet, and other meeting apps.
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
              disabled={isCapturing || isLoading}
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
            onPress={handleStartCapture}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>Start Meeting Transcription</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.button, styles.stopButton]}
            onPress={handleStopCapture}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>Stop Transcribing</Text>
            )}
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.button, styles.resetButton]}
          onPress={handleClearTranscripts}
          disabled={isCapturing || isLoading}
        >
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
            <Text style={styles.placeholderText}>
              {isCapturing ? 'Listening for speech...' : 'Transcripts will appear here once the meeting starts...'}
            </Text>
          )}
        </ScrollView>
      </View>

      <View style={styles.languageInfoContainer}>
        <Text style={styles.languageInfoText}>
          {selectedLanguage === 'auto' 
            ? 'Auto-detect mode: Trying to automatically determine the spoken language' 
            : `Current language: ${selectedLanguage === 'en-US' ? 'English' : 'Spanish'}`}
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
  webMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
  languageInfoContainer: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f0f4c3',
    borderRadius: 8,
  },
  languageInfoText: {
    fontSize: 12,
    color: '#33691e',
    textAlign: 'center',
    fontStyle: 'italic',
  }
});
