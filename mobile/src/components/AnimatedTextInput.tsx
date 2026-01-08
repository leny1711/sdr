import React, { useMemo, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  TextInput,
  TextInputProps,
} from 'react-native';
import { Colors, Layout, Spacing, Typography } from '../constants/theme';

const AnimatedInput = Animated.createAnimatedComponent(TextInput);

type AnimatedTextInputProps = TextInputProps;

const AnimatedTextInput = React.forwardRef<TextInput, AnimatedTextInputProps>(
  ({ style, onFocus, onBlur, placeholderTextColor, ...rest }, ref) => {
    const focusAnim = useRef(new Animated.Value(0)).current;

    const handleFocus: NonNullable<TextInputProps['onFocus']> = (event) => {
      Animated.timing(focusAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: false,
      }).start();
      onFocus?.(event);
    };

    const handleBlur: NonNullable<TextInputProps['onBlur']> = (event) => {
      Animated.timing(focusAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }).start();
      onBlur?.(event);
    };

    const animatedStyle = useMemo(
      () => ({
        borderColor: focusAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [Colors.borderColor, Colors.textSecondary],
        }),
        backgroundColor: focusAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [Colors.bgSecondary, Colors.surfaceHighlight],
        }),
        shadowOpacity: focusAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.12],
        }),
        shadowRadius: focusAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 8],
        }),
        shadowOffset: { width: 0, height: 2 },
        shadowColor: Colors.textPrimary,
        elevation: focusAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 2],
        }),
      }),
      [focusAnim]
    );

    return (
      <AnimatedInput
        ref={ref}
        {...rest}
        style={[styles.input, style, animatedStyle]}
        placeholderTextColor={placeholderTextColor ?? Colors.textTertiary}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    );
  }
);

const styles = StyleSheet.create({
  input: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: Layout.borderRadius,
    padding: Spacing.md,
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    color: Colors.textPrimary,
  },
});

export default AnimatedTextInput;
