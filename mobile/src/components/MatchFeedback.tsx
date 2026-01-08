import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

const FADE_DURATION = 300;
const DISPLAY_DURATION = 3000;

type MatchFeedbackProps = {
  visible: boolean;
  name: string;
  onHide: () => void;
};

const MatchFeedback = ({ visible, name, onHide }: MatchFeedbackProps) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!visible) {
      animationRef.current?.stop();
      return;
    }

    opacity.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }),
      Animated.delay(DISPLAY_DURATION),
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }),
    ]);

    animationRef.current = animation;
    animation.start(onHide);

    return () => {
      animation.stop();
    };
  }, [visible, name, onHide, opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.banner, { opacity }]} pointerEvents="box-none">
      <Text style={styles.title}>🎉 It's a Match! 🎉</Text>
      <Text style={styles.text}>
        You and {name} matched! Start chatting to reveal their photo.
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.buttonPrimary,
    padding: Spacing.lg,
    borderRadius: 12,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    fontSize: Typography.xl,
    fontFamily: Typography.fontSerif,
    color: Colors.bgPrimary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  text: {
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    color: Colors.bgPrimary,
    textAlign: 'center',
  },
});

export default MatchFeedback;
