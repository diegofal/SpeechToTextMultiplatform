import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import useSpeechRecognition from '../../hooks/useSpeechRecognition';

export default function SpeechToTextComponent() {
  const isDarkMode = useColorScheme() === 'dark';
  const {
    speechState,
    startRecognizing,
    stopRecognizing,
    cancelRecognizing,
    destroyRecognizer,
  } = useSpeechRecognition();

  const { isListening, results, partialResults, recognized, pitch, error, end, started } = speechState;

  // Background style based on theme
  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
    flex: 1,
  };

  // Text color based on theme
  const textColor = {
    color: isDarkMode ? '#ffffff' : '#000000',
  };

  return (
    <View style={[styles.container, backgroundStyle]}>
      <Text style={[styles.title, textColor]}>Speech to Text</Text>
      
      <View style={styles.buttonContainer}>
        {!isListening ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={() => startRecognizing()}>
            <Text style={styles.buttonText}>Start Listening</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={stopRecognizing}>
            <Text style={styles.buttonText}>Stop Listening</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={cancelRecognizing}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={destroyRecognizer}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {isListening && (
        <View style={styles.recordingIndicator}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={[styles.recordingText, textColor]}>Listening...</Text>
        </View>
      )}

      <View style={styles.resultContainer}>
        <Text style={[styles.resultTitle, textColor]}>Results:</Text>
        <ScrollView style={styles.resultScroll}>
          {results.map((result, index) => (
            <Text key={`result-${index}`} style={[styles.resultText, textColor]}>
              {result}
            </Text>
          ))}
          {partialResults.length > 0 && (
            <Text style={[styles.partialResultText, textColor]}>
              {partialResults[0]}
            </Text>
          )}
          {error !== '' && (
            <Text style={styles.errorText}>Error: {error}</Text>
          )}
        </ScrollView>
      </View>

      <View style={styles.statusContainer}>
        <Text style={[textColor, styles.statusText]}>
          {`Started: ${started} • Recognized: ${recognized} • Pitch: ${pitch} • End: ${end}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginHorizontal: 5,
    marginVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
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
  cancelButton: {
    backgroundColor: '#FBBC05',
  },
  resetButton: {
    backgroundColor: '#34A853',
  },
  resultContainer: {
    flex: 1,
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 10,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultScroll: {
    flex: 1,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 5,
  },
  partialResultText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#888',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginTop: 10,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  recordingText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    marginTop: 10,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    width: '100%',
  },
  statusText: {
    fontSize: 12,
  },
});
