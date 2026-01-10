import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import apiService from '../services/api';
import { Match } from '../types';
import { AppStackParamList, TabParamList } from '../navigation';
import { Colors, Typography, Spacing } from '../constants/theme';
import Screen from '../components/Screen';
import { getConversationReadCounts, ReadCounts } from '../services/unreadStorage';
import RevealPhoto from '../components/RevealPhoto';
import { calculateRevealLevel, getRevealChapter } from '../utils/reveal';

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<AppStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

const getMatchKey = (match: Match): string => {
  if (match.matchedId) return match.matchedId;
  if (match.conversation?.id) return match.conversation.id;
  if (match.user?.id) return `user-${match.user.id}-${match.createdAt || match.conversation?.createdAt || ''}`;
  const fallbackParts = [
    match.createdAt,
    match.conversation?.createdAt,
    match.user?.id,
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
  const [readCounts, setReadCounts] = useState<ReadCounts>({});
  const navigation = useNavigation<NavigationProp>();
  const parentNavigator = useMemo(() => navigation.getParent(), [navigation]);

  const refreshReadCounts = useCallback(async () => {
    try {
      const stored = await getConversationReadCounts();
      setReadCounts(stored);
    } catch (error) {
      console.error('Failed to refresh read counts', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMatches();
      refreshReadCounts();
    }, [])
  );

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getMatches();
      // Add guard to ensure data is an array
      if (Array.isArray(data)) {
        setMatches(dedupeMatches(data));
      } else {
        console.error('Invalid matches data received:', data);
        Alert.alert('Erreur', 'Impossible de charger les matchs (format invalide).');
        setMatches([]);
      }
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de charger les matchs.');
    } finally {
      setIsLoading(false);
    }
  };

  const getUnreadCount = useCallback(
    (match: Match) => {
      const conversationId = match.conversation?.id;
      const total = match.conversation?.textMessageCount ?? 0;
      if (!conversationId || total <= 0) return 0;
      const read = readCounts[conversationId] ?? 0;
      return Math.max(0, total - read);
    },
    [readCounts]
  );

  const unreadTotal = useMemo(
    () => matches.reduce((sum, match) => sum + getUnreadCount(match), 0),
    [matches, getUnreadCount]
  );

  const lastBadgeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!parentNavigator) return;
    if (lastBadgeRef.current === unreadTotal) return;
    parentNavigator.setOptions({
      tabBarBadge: unreadTotal > 0 ? unreadTotal : undefined,
      tabBarBadgeStyle: unreadTotal > 0 ? styles.tabBadge : undefined,
    });
    lastBadgeRef.current = unreadTotal;
  }, [parentNavigator, unreadTotal]);

  const handleMatchPress = (match: Match) => {
    const conversationId = match.conversation?.id;
    const matchedUser = match.user || match.matchedUser;
    if (!conversationId || !matchedUser) {
      Alert.alert('Erreur', 'Conversation indisponible : informations de match manquantes.');
      return;
    }
    navigation.navigate('Chat', {
      conversationId,
      matchName: matchedUser.name,
      matchPhotoUrl: matchedUser.photoUrl || undefined,
    });
  };

  const renderMatch = ({ item }: { item: Match }) => {
    const matchedUser = item.user || item.matchedUser;
    const displayName = matchedUser?.name ?? 'Match inconnu';
    const displayDetails = matchedUser
      ? `${matchedUser.age ?? 'N/A'} • ${matchedUser.city ?? 'Inconnue'}`
      : 'Détails indisponibles';
    const persistedCount = item.conversation?.textMessageCount ?? 0;
    const revealLevel = item.conversation?.revealLevel ?? calculateRevealLevel(persistedCount);
    const photoUrl = matchedUser?.photoUrl || undefined;
    const unreadCount = getUnreadCount(item);
    return (
      <TouchableOpacity style={styles.matchCard} onPress={() => handleMatchPress(item)}>
        <View style={styles.matchInfo}>
          <RevealPhoto
            photoUrl={photoUrl}
            photoHidden={matchedUser?.photoHidden}
            revealLevel={revealLevel}
            containerStyle={styles.avatarWrapper}
            borderRadius={32}
            placeholder={
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>?</Text>
              </View>
            }
          />
          <View style={styles.matchTextArea}>
            <View style={styles.nameRow}>
              <Text style={styles.matchName}>{displayName}</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.matchDetails}>{displayDetails}</Text>
            <View style={styles.revealInfo}>
              <Text style={styles.revealText}>
                Photo : {getRevealChapter(revealLevel)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.textPrimary} />
          <Text style={styles.loadingText}>Chargement des matchs...</Text>
        </View>
      </Screen>
    );
  }

  if (matches.length === 0) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Matchs</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Aucun match pour le moment</Text>
          <Text style={styles.emptyText}>Découvrez des profils pour trouver vos matchs.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matchs</Text>
        <Text style={styles.matchCount}>{matches.length}</Text>
      </View>
      <FlatList
        data={matches}
        renderItem={renderMatch}
        keyExtractor={(item) => getMatchKey(item)}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  matchTextArea: {
    flex: 1,
  },
  avatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: Colors.textTertiary,
    fontFamily: Typography.fontSans,
    fontWeight: '700',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  matchName: {
    fontSize: Typography.xl,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: Spacing.xs,
    borderRadius: 11,
    backgroundColor: Colors.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: Colors.bgPrimary,
    fontSize: Typography.xs,
    fontFamily: Typography.fontSans,
    fontWeight: '700',
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
  tabBadge: {
    backgroundColor: Colors.buttonPrimary,
    color: Colors.bgPrimary,
    fontSize: Typography.sm,
  },
});

export default MatchesScreen;
