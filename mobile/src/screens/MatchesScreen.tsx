import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import apiService from '../services/api';
import { Match } from '../types';
import { AppStackParamList } from '../navigation';
import { Colors, Typography, Spacing } from '../constants/theme';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

const getMatchKey = (match: Match): string => {
  if (match.matchedId) return match.matchedId;
  if (match.conversation?.id) return match.conversation.id;
  if (match.user?.id) return `user-${match.user.id}-${match.createdAt || match.conversation?.createdAt || ''}`;
  const fallbackParts = [
    match.createdAt,
    match.conversation?.createdAt,
    match.user?.name,
  ]
    .filter(Boolean)
    .join('|');
  return `match-${fallbackParts || 'unknown'}`;
};

const getMatchTimestamp = (match: Match) => {
  const value = match.createdAt || match.conversation?.createdAt;
  return value ? new Date(value).getTime() : 0;
};

const dedupeMatches = (items: Match[]) => {
  const map = new Map<string, Match>();
  items.forEach((match) => {
    const key = getMatchKey(match);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, match);
      return;
    }
    const existingTime = getMatchTimestamp(existing);
    const incomingTime = getMatchTimestamp(match);
    map.set(key, incomingTime >= existingTime ? match : existing);
  });
  return Array.from(map.values());
};

const MatchesScreen = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation<NavigationProp>();

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [])
  );

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getMatches();
      setMatches(dedupeMatches(data));
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load matches');
    } finally {
      setIsLoading(false);
    }
  };

  const getRevealLevelText = (level: number): string => {
    switch (level) {
      case 0:
        return 'Fully blurred, B&W';
      case 1:
        return 'Lightly visible, B&W';
      case 2:
        return 'Mostly visible, B&W';
      case 3:
        return 'Fully visible, Color';
      default:
        return 'Unknown';
    }
  };

  const handleMatchPress = (match: Match) => {
    const conversationId = match.conversation?.id || match.conversationId;
    const matchedUser = match.user || match.matchedUser;
    if (!conversationId || !matchedUser) {
      Alert.alert('Error', 'Unable to open chat: conversation or user data not available.');
      return;
    }
    navigation.navigate('Chat', {
      conversationId,
      matchName: matchedUser.name,
    });
  };

  const renderMatch = ({ item }: { item: Match }) => {
    const matchedUser = item.user || item.matchedUser;
    const displayName = matchedUser?.name ?? 'Unknown match';
    const displayDetails = matchedUser
      ? `${matchedUser.age ?? 'N/A'} • ${matchedUser.city ?? 'Unknown'}`
      : 'Details unavailable';
    const revealLevel = item.conversation?.revealLevel ?? 0;
    const messageCount = item.conversation?.textMessageCount ?? 0;
    return (
      <TouchableOpacity style={styles.matchCard} onPress={() => handleMatchPress(item)}>
        <View style={styles.matchInfo}>
          <Text style={styles.matchName}>{displayName}</Text>
          <Text style={styles.matchDetails}>{displayDetails}</Text>
          <View style={styles.revealInfo}>
            <Text style={styles.revealText}>
              Photo: {getRevealLevelText(revealLevel)}
            </Text>
            <Text style={styles.messageCount}>
              {messageCount} messages
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.textPrimary} />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (matches.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Matches</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Matches Yet</Text>
          <Text style={styles.emptyText}>
            Start discovering profiles to find your matches.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matches</Text>
        <Text style={styles.matchCount}>{matches.length}</Text>
      </View>
      <FlatList
        data={matches}
        renderItem={renderMatch}
        keyExtractor={(item) => getMatchKey(item)}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
  },
  matchCount: {
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    color: Colors.textTertiary,
  },
  listContent: {
    padding: Spacing.lg,
  },
  matchCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 8,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: Typography.xl,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  matchDetails: {
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  revealInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revealText: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontSans,
    color: Colors.textTertiary,
  },
  messageCount: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontSans,
    color: Colors.textTertiary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.xxl,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: Typography.base,
    fontFamily: Typography.fontSerif,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.base * Typography.lineHeightBody,
  },
});

export default MatchesScreen;
