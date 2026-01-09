import React, { useEffect, useState } from 'react';
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

const GRAYSCALE_TINT = '#c8c8c8';
const MUTED_OVERLAY_COLOR = 'rgba(0,0,0,0.25)';
const COVER_OPACITY = 0.32;
const PERCENTAGE_MAX = 100;

const RevealPhoto = ({
  photoUrl,
  revealLevel,
  photoHidden,
  containerStyle,
  imageStyle,
  borderRadius,
  placeholder,
}: RevealPhotoProps) => {
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    setLoadError(false);
  }, [photoUrl]);

  const hidden = shouldHidePhoto(revealLevel, photoHidden, photoUrl) || loadError;
  const radiusStyle = borderRadius !== undefined ? { borderRadius } : undefined;

  if (hidden || !photoUrl) {
    return (
      <View style={[styles.container, radiusStyle, containerStyle]}>
        {placeholder || <View style={[styles.placeholder, radiusStyle]} />}
      </View>
    );
  }

  const effects = getPhotoEffects(revealLevel);
  const coverHeight = (effects.coverRatio ?? 0) * PERCENTAGE_MAX;

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
        onError={() => setLoadError(true)}
      />
      {effects.coverRatio && effects.coverRatio > 0 && (
        <View
          pointerEvents="none"
          style={[
            styles.cover,
            radiusStyle,
            {
              height: `${coverHeight}%`,
            },
          ]}
        />
      )}
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
      ? ({ tintColor: GRAYSCALE_TINT, opacity: 0.9 } as ImageStyle)
      : {}),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bgPrimary,
  },
  overlayMuted: {
    backgroundColor: MUTED_OVERLAY_COLOR,
  },
  cover: {
    ...StyleSheet.absoluteFillObject,
    bottom: undefined,
    backgroundColor: Colors.bgPrimary,
    opacity: COVER_OPACITY,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgSecondary,
  },
});

export default RevealPhoto;
