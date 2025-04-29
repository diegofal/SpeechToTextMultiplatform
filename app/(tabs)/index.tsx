import { Image, StyleSheet, Platform, SafeAreaView, StatusBar, useColorScheme } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import SpeechToTextComponent from '@/components/SpeechToText/SpeechToTextComponent';
import WebSpeechComponent from '@/components/SpeechToText/WebSpeechComponent';

export default function HomeScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  
  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
    }}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#1a1a1a' : '#f5f5f5'}
      />
      {Platform.OS === 'web' ? <WebSpeechComponent /> : <SpeechToTextComponent />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
