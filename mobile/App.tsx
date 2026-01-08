import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { MatchFeedbackProvider } from './src/contexts/MatchFeedbackContext';
import { Navigation } from './src/navigation';
import { Colors } from './src/constants/theme';

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <MatchFeedbackProvider>
          <View style={styles.appShell}>
            <StatusBar style="dark" />
            <Navigation />
          </View>
        </MatchFeedbackProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
});
