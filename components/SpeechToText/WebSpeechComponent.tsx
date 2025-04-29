import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';

// Language options for the speech recognition
const LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'auto', name: 'Auto Detect' },
];

// This is a simplified component that directly uses the Web Speech API
// without the abstraction layer
export default function WebSpeechComponent() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscripts, setFinalTranscripts] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');

  useEffect(() => {
    // Only run this in a browser environment
    if (typeof window !== 'undefined') {
      try {
        // Get the SpeechRecognition constructor
        const SpeechRecognition = (window as any).SpeechRecognition || 
                               (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
          setError('Speech recognition not supported in this browser');
          return;
        }
        
        // Create the recognition object
        const recognitionInstance = new SpeechRecognition();
        
        // Configure the recognition
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = selectedLanguage === 'auto' ? '' : selectedLanguage;
        
        setRecognition(recognitionInstance);
        
      } catch (e) {
        console.error('Error initializing speech recognition:', e);
        setError('Error initializing speech recognition');
      }
    }
  }, []);
  
  // Update the language when it changes
  useEffect(() => {
    if (recognition) {
      recognition.lang = selectedLanguage === 'auto' ? '' : selectedLanguage;
      console.log(`Language set to: ${recognition.lang || 'Auto'}`);
    }
  }, [selectedLanguage, recognition]);
  
  useEffect(() => {
    if (!recognition) return;
    
    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
    };
    
    recognition.onresult = (event: any) => {
      console.log('Speech recognition result received', event);
      let interimTranscript = '';
      let finalTranscript = '';
      
      // Loop through the results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        // Check if this is a final result
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          console.log('Final transcript:', finalTranscript);
          // Log which language was detected if in auto mode
          if (selectedLanguage === 'auto' && event.results[i].length > 0) {
            console.log(`Detected language for result: ${event.results[i][0].lang || 'unknown'}`);
          }
        } else {
          interimTranscript += transcript;
          console.log('Interim transcript:', interimTranscript);
        }
      }
      
      // Update the transcript state
      setTranscript(interimTranscript);
      
      // If we have a final transcript, add it to our list
      if (finalTranscript) {
        setFinalTranscripts(prev => [...prev, finalTranscript]);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Error: ${event.error}`);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
    };
    
    return () => {
      // Clean up event handlers
      if (recognition) {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
      }
    };
  }, [recognition, selectedLanguage]);
  
  const startListening = () => {
    if (!recognition) {
      setError('Speech recognition not initialized');
      return;
    }
    
    try {
      // Reset state
      setTranscript('');
      setError('');
      
      // Start recognition
      recognition.start();
      console.log(`Starting speech recognition in ${selectedLanguage === 'auto' ? 'auto-detect mode' : selectedLanguage}...`);
    } catch (e) {
      console.error('Error starting speech recognition:', e);
      setError(`Error starting: ${e}`);
    }
  };
  
  const stopListening = () => {
    if (recognition) {
      try {
        recognition.stop();
        console.log('Stopping speech recognition');
      } catch (e) {
        console.error('Error stopping speech recognition:', e);
      }
    }
  };
  
  const resetTranscripts = () => {
    setFinalTranscripts([]);
    setTranscript('');
    setError('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Multilingual Speech-to-Text</Text>
      
      <View style={styles.languageSelector}>
        <Text style={styles.languageLabel}>Language:</Text>
        <View style={styles.languageButtons}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageButton,
                selectedLanguage === lang.code && styles.selectedLanguage
              ]}
              onPress={() => setSelectedLanguage(lang.code)}
              disabled={isListening}
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
        {!isListening ? (
          <TouchableOpacity 
            style={[styles.button, styles.startButton]}
            onPress={startListening}>
            <Text style={styles.buttonText}>Start Listening</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.button, styles.stopButton]}
            onPress={stopListening}>
            <Text style={styles.buttonText}>Stop Listening</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.button, styles.resetButton]}
          onPress={resetTranscripts}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>
      
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
      
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Results:</Text>
        <ScrollView style={styles.resultScroll}>
          {finalTranscripts.map((text, index) => (
            <Text key={index} style={styles.finalText}>{text}</Text>
          ))}
          {transcript ? (
            <Text style={styles.interimText}>{transcript}</Text>
          ) : null}
        </ScrollView>
      </View>
      
      <Text style={styles.infoText}>
        {selectedLanguage === 'auto' 
          ? 'Auto mode: The app will try to detect the language automatically'
          : `Speaking in: ${selectedLanguage === 'en-US' ? 'English' : 'Spanish'}`
        }
      </Text>
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
    marginBottom: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
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
  resultContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
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
  finalText: {
    fontSize: 16,
    marginBottom: 8,
  },
  interimText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  infoText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  }
});
