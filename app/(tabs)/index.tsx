import { StyleSheet, SafeAreaView, StatusBar, useColorScheme, Platform, View, Text, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import SpeechToTextComponent from '@/components/SpeechToText/SpeechToTextComponent';
import WebSpeechComponent from '@/components/SpeechToText/WebSpeechComponent';
import FileTranscriptionComponent from '@/components/SpeechToText/FileTranscriptionComponent';
import TabAudioCapture from '@/components/SpeechToText/TabAudioCapture';
import MeetingTranscriptionComponent from '@/components/SpeechToText/MeetingTranscriptionComponent';

type AppMode = 'microphone' | 'meeting-file' | 'meeting-realtime' | 'meeting-native';

export default function HomeScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const [mode, setMode] = useState<AppMode>('microphone');
  
  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
    }}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#1a1a1a' : '#f5f5f5'}
      />
      
      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity 
          style={[styles.modeButton, mode === 'microphone' && styles.selectedMode]}
          onPress={() => setMode('microphone')}
        >
          <Text style={[styles.modeButtonText, mode === 'microphone' && styles.selectedModeText]}>Microphone</Text>
        </TouchableOpacity>
        
        {Platform.OS !== 'web' && (
          <TouchableOpacity 
            style={[styles.modeButton, mode === 'meeting-native' && styles.selectedMode]}
            onPress={() => setMode('meeting-native')}
          >
            <Text style={[styles.modeButtonText, mode === 'meeting-native' && styles.selectedModeText]}>Meeting</Text>
          </TouchableOpacity>
        )}
        
        {Platform.OS === 'web' && (
          <>
            <TouchableOpacity 
              style={[styles.modeButton, mode === 'meeting-realtime' && styles.selectedMode]}
              onPress={() => setMode('meeting-realtime')}
            >
              <Text style={[styles.modeButtonText, mode === 'meeting-realtime' && styles.selectedModeText]}>Live Meeting</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modeButton, mode === 'meeting-file' && styles.selectedMode]}
              onPress={() => setMode('meeting-file')}
            >
              <Text style={[styles.modeButtonText, mode === 'meeting-file' && styles.selectedModeText]}>Meeting File</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      
      {/* Render appropriate component based on mode and platform */}
      {mode === 'microphone' ? (
        Platform.OS === 'web' ? <WebSpeechComponent /> : <SpeechToTextComponent />
      ) : mode === 'meeting-file' ? (
        <FileTranscriptionComponent />
      ) : mode === 'meeting-realtime' ? (
        <TabAudioCapture />
      ) : (
        <MeetingTranscriptionComponent />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#e0e0e0',
    flexWrap: 'wrap',
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 5,
    marginVertical: 5,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedMode: {
    backgroundColor: '#4285F4',
    borderColor: '#2b6bc3',
  },
  modeButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedModeText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
