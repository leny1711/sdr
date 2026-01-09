import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  Platform,
  ImageStyle,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Colors } from '../constants/theme';
import { getPhotoEffects, shouldHidePhoto } from '../utils/reveal';

type RevealPhotoProps = {
  photoUrl?: string | null;
  revealLevel: number;
  photoHidden?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  borderRadius?: number;
  placeholder?: React.ReactNode;
};

const RevealPhoto = ({
  photoUrl,
  revealLevel,
  photoHidden,
  containerStyle,
  imageStyle,
  borderRadius,
  placeholder,
}: RevealPhotoProps) => {
  const hidden = shouldHidePhoto(revealLevel, photoHidden, photoUrl);
  const radiusStyle = borderRadius !== undefined ? { borderRadius } : undefined;

  if (hidden || !photoUrl) {
    return (
      <View style={[styles.container, radiusStyle, containerStyle]}>
        {placeholder || <View style={[styles.placeholder, radiusStyle]} />}
      </View>
    );
  }

  const effects = getPhotoEffects(revealLevel);

  return (
    <View style={[styles.container, radiusStyle, containerStyle]}>
      <Image
        source={{ uri: photoUrl }}
        style={[
          styles.image,
          radiusStyle,
          effects.grayscale
            ? Platform.OS === 'web'
              ? styles.grayscaleImageWeb
              : styles.grayscaleImageNative
            : undefined,
          imageStyle,
        ]}
        blurRadius={effects.blurRadius}
      />
      {(effects.overlayOpacity > 0 || effects.grayscale) && (
        <View
          pointerEvents="none"
          style={[
            styles.overlay,
            radiusStyle,
            effects.grayscale && styles.overlayMuted,
            { opacity: effects.overlayOpacity },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: Colors.bgSecondary,
    borderColor: Colors.borderLight,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  grayscaleImageWeb: {
    ...(Platform.OS === 'web' ? ({ filter: 'grayscale(1)' } as unknown as ImageStyle) : {}),
  },
  grayscaleImageNative: {
    ...(Platform.OS !== 'web'
      ? ({ tintColor: Colors.textPrimary, opacity: 0.9 } as ImageStyle)
      : {}),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bgPrimary,
  },
  overlayMuted: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgSecondary,
  },
});

export default RevealPhoto;
