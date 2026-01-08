import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { Navigation } from './src/navigation';
import { Colors } from './src/constants/theme';

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <View style={styles.appShell}>
          <StatusBar style="dark" />
          <Navigation />
        </View>
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
