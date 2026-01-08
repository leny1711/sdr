import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import apiService from '../services/api';
import { DiscoverableUser } from '../types';
import { Colors, Typography, Spacing } from '../constants/theme';
import Screen from '../components/Screen';
import { useMatchFeedback } from '../contexts/MatchFeedbackContext';

const MAX_DISPLAY_NAME_LENGTH = 50; // characters

/**
 * Sanitize user name for safe display.
 * React Native Text components render plain text only - they don't execute JS or interpret HTML.
 * XSS is not possible in React Native Text. We sanitize for UI/layout purposes only.
 */
const sanitizeName = (name: string): string => {
  // Trim whitespace and limit length to prevent UI overflow
  return name.trim().slice(0, MAX_DISPLAY_NAME_LENGTH);
};

const DiscoveryScreen = () => {
  const [users, setUsers] = useState<DiscoverableUser[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { showMatch } = useMatchFeedback();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getDiscoverableUsers();
      setUsers(data);
      setCurrentIndex(0);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load profiles');
    } finally {
      setIsLoading(false);
    }
  };

  const showMatchBanner = (name: string) => {
    const safeName = sanitizeName(name);
    showMatch(safeName);
  };

  /**
   * Handle like action. If it's a match, shows a non-blocking banner notification.
   * Moves to next profile immediately to allow continuous swiping (modern dating app UX).
   * The match banner floats above for 3 seconds without interrupting user interaction.
   */
  const handleLike = async () => {
    if (isActionLoading || currentIndex >= users.length) return;

    setIsActionLoading(true);
    try {
      const currentUser = users[currentIndex];
      const response = await apiService.likeUser(currentUser.id);

      if (response.match) {
        showMatchBanner(currentUser.name);
      }
      moveToNext();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to like user');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePass = async () => {
    if (isActionLoading || currentIndex >= users.length) return;

    setIsActionLoading(true);
    try {
      const currentUser = users[currentIndex];
      await apiService.dislikeUser(currentUser.id);
      moveToNext();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to pass user');
    } finally {
      setIsActionLoading(false);
    }
  };

  const moveToNext = () => {
    if (currentIndex < users.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // No more users
      setUsers([]);
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.textPrimary} />
          <Text style={styles.loadingText}>Loading profiles...</Text>
        </View>
      </Screen>
    );
  }

  if (users.length === 0 || currentIndex >= users.length) {
    return (
      <Screen>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No More Profiles</Text>
          <Text style={styles.emptyText}>
            Check back later for new people to discover.
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={loadUsers}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const currentUser = users[currentIndex];

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discovery</Text>
        <Text style={styles.counter}>
          {currentIndex + 1} of {users.length}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.name}>{currentUser.name}</Text>
          <Text style={styles.info}>
            {currentUser.age} • {currentUser.city}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.description}>{currentUser.description}</Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton, isActionLoading && styles.buttonDisabled]}
          onPress={handlePass}
          disabled={isActionLoading}
        >
          <Text style={styles.actionButtonText}>Pass</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton, isActionLoading && styles.buttonDisabled]}
          onPress={handleLike}
          disabled={isActionLoading}
        >
          <Text style={[styles.actionButtonText, styles.likeButtonText]}>Like</Text>
        </TouchableOpacity>
      </View>
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
  counter: {
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    color: Colors.textTertiary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 8,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  name: {
    fontSize: Typography.xxl,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  info: {
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderColor,
    marginVertical: Spacing.md,
  },
  description: {
    fontSize: Typography.base,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
    lineHeight: Typography.base * Typography.lineHeightBody,
  },
  actions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  actionButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  passButton: {
    backgroundColor: Colors.bgSecondary,
    borderColor: Colors.borderColor,
  },
  likeButton: {
    backgroundColor: Colors.buttonPrimary,
    borderColor: Colors.buttonPrimary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  likeButtonText: {
    color: Colors.bgPrimary,
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
    marginBottom: Spacing.lg,
  },
  refreshButton: {
    backgroundColor: Colors.buttonPrimary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: Colors.bgPrimary,
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    fontWeight: '600',
  },
});

export default DiscoveryScreen;
