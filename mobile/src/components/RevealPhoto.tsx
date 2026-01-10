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
import { getPhotoEffects } from '../utils/reveal';

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
  photoHidden: _photoHidden = false,
  containerStyle,
  imageStyle,
  borderRadius,
  placeholder,
}: RevealPhotoProps) => {
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    setLoadError(false);
  }, [photoUrl]);

  const hasPhoto = !!photoUrl && !loadError;
  const radiusStyle = borderRadius !== undefined ? { borderRadius } : undefined;

  const effects = getPhotoEffects(revealLevel);

  return (
    <View style={[styles.container, radiusStyle, containerStyle]}>
      {hasPhoto ? (
        <>
          <Image
            source={{ uri: photoUrl! }}
            style={[
              styles.image,
              radiusStyle,
              effects.grayscale && Platform.OS === 'web' ? styles.grayscaleImageWeb : undefined,
              imageStyle,
              effects.imageOpacity !== undefined ? { opacity: effects.imageOpacity } : undefined,
            ]}
            blurRadius={effects.blurRadius}
            onError={() => setLoadError(true)}
          />
          {effects.grayscale && Platform.OS !== 'web' && (
            <View pointerEvents="none" style={[styles.grayscaleTint, radiusStyle]} />
          )}
        </>
      ) : (
        placeholder || <View style={[styles.placeholder, radiusStyle]} />
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
  grayscaleTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgSecondary,
  },
});

export default RevealPhoto;
