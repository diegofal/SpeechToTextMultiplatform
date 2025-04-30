import { Image, StyleSheet, Platform, SafeAreaView, StatusBar, useColorScheme, View, Text, TouchableOpacity } from 'react-native';
import { useState } from 'react';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import SpeechToTextComponent from '@/components/SpeechToText/SpeechToTextComponent';
import WebSpeechComponent from '@/components/SpeechToText/WebSpeechComponent';
import FileTranscriptionComponent from '@/components/SpeechToText/FileTranscriptionComponent';

export default function HomeScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const [mode, setMode] = useState<'microphone' | 'meeting'>('microphone');
  
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
          <Text style={[styles.modeButtonText, mode === 'microphone' && styles.selectedModeText]}>Microphone Input</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.modeButton, mode === 'meeting' && styles.selectedMode]}
          onPress={() => setMode('meeting')}
        >
          <Text style={[styles.modeButtonText, mode === 'meeting' && styles.selectedModeText]}>Meeting Files</Text>
        </TouchableOpacity>
      </View>
      
      {/* Render appropriate component based on mode and platform */}
      {mode === 'microphone' ? (
        Platform.OS === 'web' ? <WebSpeechComponent /> : <SpeechToTextComponent />
      ) : (
        <FileTranscriptionComponent />
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
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 5,
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
