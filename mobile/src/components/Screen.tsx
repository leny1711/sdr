import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';

type ScreenProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: Edge[];
};

const Screen = ({ children, style, edges }: ScreenProps) => {
  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
});

export default Screen;
