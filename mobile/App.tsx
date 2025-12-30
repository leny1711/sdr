import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { Navigation } from './src/navigation';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar barStyle="dark-content" />
      <Navigation />
    </AuthProvider>
  );
}
