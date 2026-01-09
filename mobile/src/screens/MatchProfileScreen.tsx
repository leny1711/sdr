import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import Screen from '../components/Screen';
import RevealPhoto from '../components/RevealPhoto';
import { Colors, Typography, Spacing } from '../constants/theme';
import { AppStackParamList } from '../navigation';
import { getRevealChapter } from '../utils/reveal';

type MatchProfileRouteProp = RouteProp<AppStackParamList, 'MatchProfile'>;

const MatchProfileScreen = () => {
  const { params } = useRoute<MatchProfileRouteProp>();
  const { user, revealLevel } = params;
  const ageLabel = typeof user.age === 'number' ? user.age : 'Âge inconnu';
  const cityLabel = user.city || 'Ville inconnue';
  const description = user.description?.trim() ? user.description : 'Description indisponible.';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <RevealPhoto
          photoUrl={user.photoUrl || undefined}
          photoHidden={user.photoHidden}
          revealLevel={revealLevel}
          containerStyle={styles.photo}
          borderRadius={12}
          placeholder={
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>Photo cachée jusqu’à révélation</Text>
            </View>
          }
        />

        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.info}>
          {ageLabel} • {cityLabel}
        </Text>
        <Text style={styles.reveal}>{getRevealChapter(revealLevel)}</Text>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{description}</Text>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: Spacing.md,
    maxHeight: 360,
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.lg,
  },
  photoPlaceholderText: {
    color: Colors.textTertiary,
    fontFamily: Typography.fontSans,
    textAlign: 'center',
  },
  name: {
    fontSize: Typography.xxl,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
  },
  info: {
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    color: Colors.textSecondary,
  },
  reveal: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontSans,
    color: Colors.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderColor,
    marginVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: Typography.base,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
    lineHeight: Typography.base * Typography.lineHeightBody,
  },
});

export default MatchProfileScreen;
