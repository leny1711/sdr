import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import apiService from '../services/api';
import { Match } from '../types';
import { AppStackParamList, TabParamList } from '../navigation';
import { Colors, Typography, Spacing } from '../constants/theme';
import Screen from '../components/Screen';

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<AppStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

const getConversationId = (match: Match) => match.conversation?.id ?? match.conversationId;
const unknownMatchKeyCache = new WeakMap<Match, string>();
let unknownKeyCounter = 0;

const getMatchKey = (match: Match): string => {
  if (match.matchedId) return String(match.matchedId);
  const conversationId = getConversationId(match);
  if (conversationId) return String(conversationId);
  if (match.user?.id) {
    const timestamp = match.createdAt || match.conversation?.createdAt || 'no-date';
    return `user-${match.user.id}-${timestamp}`;
  }
  if (match.createdAt) return `match-${match.createdAt}`;
  const cached = unknownMatchKeyCache.get(match);
  if (cached) return cached;
  const generated = `unknown-match-${unknownKeyCounter++}`;
  unknownMatchKeyCache.set(match, generated);
  return generated;
};

const MatchesScreen = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation<NavigationProp>();
  const keyExtractor = useCallback((item: Match) => getMatchKey(item), []);

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getMatches();
      // Add guard to ensure data is an array
      if (Array.isArray(data)) {
        setMatches(data);
      } else {
        console.error('Invalid matches data received:', data);
        Alert.alert('Error', 'Failed to load matches: Invalid data format');
        setMatches([]);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load matches');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handleMatchPress = (match: Match) => {
    const conversationId = getConversationId(match);
    const matchedUser = match.user || match.matchedUser;
    if (!conversationId || !matchedUser) {
      Alert.alert('Error', 'This conversation is unavailable because match details are incomplete.');
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
    return (
      <TouchableOpacity style={styles.matchCard} onPress={() => handleMatchPress(item)}>
        <View style={styles.matchInfo}>
          <Text style={styles.matchName}>{displayName}</Text>
          <Text style={styles.matchDetails}>{displayDetails}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.textPrimary} />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      </Screen>
    );
  }

  if (matches.length === 0) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Matches</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Matches Yet</Text>
          <Text style={styles.emptyText}>
            Start discovering profiles to find your matches.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matches</Text>
        <Text style={styles.matchCount}>{matches.length}</Text>
      </View>
      <FlatList
        data={matches}
        renderItem={renderMatch}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
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
