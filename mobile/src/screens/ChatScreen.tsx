import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import apiService from '../services/api';
import socketService from '../services/socket';
import { useAuth } from '../contexts/AuthContext';
import { Message, Conversation, MessageEnvelope } from '../types';
import { AppStackParamList } from '../navigation';
import { Colors, Typography, Spacing } from '../constants/theme';
import Screen from '../components/Screen';
import AnimatedTextInput from '../components/AnimatedTextInput';
import { markConversationAsRead } from '../services/unreadStorage';
import RevealPhoto from '../components/RevealPhoto';
import { getChapterNarrative, getRevealChapter, shouldHidePhoto } from '../utils/reveal';

type ChatScreenRouteProp = RouteProp<AppStackParamList, 'Chat'>;
const conversationUnavailableMessage = 'Cette conversation est indisponible.';

const getMessageTimestamp = (message: Message, cache: WeakMap<Message, number>) => {
  const cached = cache.get(message);
  if (cached !== undefined) {
    return cached;
  }
  const time = new Date(message.createdAt).getTime();
  cache.set(message, time);
  return time;
};

const ChatScreen = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const { conversationId: routeConversationId, matchName, matchPhotoUrl } = route.params;
  const conversationId =
    typeof routeConversationId === 'string' ? routeConversationId.trim() || undefined : undefined;
  const isFocused = useIsFocused();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageTimestampCache = useRef(new WeakMap<Message, number>()).current;
  const sendFeedbackAnim = useRef(new Animated.Value(0)).current;
  const chapterFeedbackAnim = useRef(new Animated.Value(0)).current;
  const lastPersistedCount = useRef<number | null>(null);
  const lastRevealLevelRef = useRef<number | null>(null);
  const photoRefreshRef = useRef(false);
  const photoUnavailableRef = useRef(false);
  const [unlockedChapter, setUnlockedChapter] = useState<string | null>(null);

  useEffect(() => {
    photoUnavailableRef.current = false;
  }, [conversationId]);

  const dedupeMessages = useCallback(
    (items: Message[]) => {
      // Guard: ensure items is an array
      if (!Array.isArray(items)) {
        console.error('dedupeMessages called with non-array:', items);
        return [];
      }
      const map = new Map<string, { message: Message; timestamp: number }>();
      items.forEach((message) => {
        if (message?.id) {
          const timestamp = getMessageTimestamp(message, messageTimestampCache);
          const existing = map.get(message.id);
          if (!existing || timestamp >= existing.timestamp) {
            map.set(message.id, { message, timestamp });
          }
        } else {
          console.warn('Skipping message without id', message);
        }
      });
      return Array.from(map.values())
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(({ message }) => message);
    },
    [messageTimestampCache]
  );

  const mergeConversationProgress = useCallback(
    (
      existing: Conversation | null,
      update?: { revealLevel?: number; textMessageCount?: number; otherUser?: Conversation['otherUser'] | null }
    ) => {
      if (!existing) return existing;
      const nextReveal = update?.revealLevel ?? existing.revealLevel ?? 0;
      const nextCount = update?.textMessageCount ?? existing.textMessageCount;
      const updatedUser = update?.otherUser ?? existing.otherUser;

      if (
        existing.revealLevel === nextReveal &&
        existing.textMessageCount === nextCount &&
        existing.otherUser === updatedUser
      ) {
        return existing;
      }

      return {
        ...existing,
        revealLevel: nextReveal,
        textMessageCount: nextCount,
        otherUser: updatedUser
          ? { ...updatedUser, photoHidden: shouldHidePhoto(nextReveal, updatedUser.photoUrl) }
          : updatedUser ?? undefined,
      };
    },
    []
  );

  const applyIncomingPayload = useCallback(
    (payload: MessageEnvelope | { message: Message } | Message) => {
      const incomingMessage: Message = 'message' in payload ? payload.message : payload;
      const incomingSystem: Message | undefined = 'systemMessage' in payload ? payload.systemMessage : undefined;
      const incomingRevealLevel: number | undefined = 'revealLevel' in payload ? payload.revealLevel : undefined;
      const incomingCount: number | undefined =
        'textMessageCount' in payload ? payload.textMessageCount : undefined;

      setMessages((prev) => {
        const withoutTemp = prev.filter(
          (msg) =>
            !(
              msg.id?.startsWith('temp-') &&
              msg.senderId === incomingMessage.senderId &&
              msg.content === incomingMessage.content
            )
        );
        const updatedMessages = dedupeMessages([
          ...withoutTemp,
          incomingMessage,
          ...(incomingSystem ? [incomingSystem] : []),
        ]);
        setConversation((prevConversation) =>
          mergeConversationProgress(prevConversation, {
            revealLevel: incomingRevealLevel,
            textMessageCount: incomingCount,
          })
        );
        return updatedMessages;
      });
    },
    [dedupeMessages, mergeConversationProgress]
  );

  const revealProgress = useMemo(
    () => ({
      textMessageCount: conversation?.textMessageCount ?? 0,
      revealLevel: conversation?.revealLevel ?? 0,
    }),
    [conversation?.revealLevel, conversation?.textMessageCount]
  );

  const triggerSendFeedback = () => {
    sendFeedbackAnim.setValue(0);
    Animated.sequence([
      Animated.timing(sendFeedbackAnim, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(sendFeedbackAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const ensureConversation = () => {
    if (!conversationId) {
      Alert.alert('Erreur', conversationUnavailableMessage);
      return false;
    }
    return true;
  };

  const handleOpenProfile = () => {
    if (!conversation?.otherUser) {
      Alert.alert('Profil indisponible', 'Le profil du match n’est pas encore chargé.');
      return;
    }

    navigation.navigate('MatchProfile', {
      user: conversation.otherUser,
      revealLevel: revealProgress.revealLevel ?? 0,
      conversationId,
    });
  };

  useEffect(() => {
    if (!ensureConversation() || !conversationId) {
      setIsLoading(false);
      return;
    }

    loadConversation();
    loadMessages();

    // Join conversation room
    socketService.joinConversation(conversationId);

    // Listen for new messages
    const handleNewMessage = (payload: MessageEnvelope | { message: Message } | Message) =>
      applyIncomingPayload(payload);

    // Listen for typing
    const handleTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== user?.id) {
        setTypingUser(data.isTyping ? data.userId : null);
      }
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onUserTyping(handleTyping);

    return () => {
      if (conversationId) {
        socketService.leaveConversation(conversationId);
      }
      socketService.offNewMessage(handleNewMessage);
      socketService.offUserTyping(handleTyping);
    };
  }, [conversationId, user?.id, applyIncomingPayload]);

  const loadConversation = async () => {
    if (!conversationId) return;
    try {
      const data = await apiService.getConversation(conversationId);
      setConversation(data);
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de charger la conversation.');
    }
  };

  const loadMessages = async () => {
    if (!conversationId) return;
    try {
      setIsLoading(true);
      const data = await apiService.getMessages(conversationId);
      // Add guard to ensure data is an array
      if (Array.isArray(data)) {
        const deduped = dedupeMessages(data);
        setMessages(deduped);
      } else {
        console.error('Invalid messages data received:', data);
        Alert.alert('Erreur', 'Impossible de charger les messages (format invalide).');
        setMessages([]);
      }
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de charger les messages.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!ensureConversation() || !conversationId) return;
    if (!inputText.trim() || isSending) return;
    if (!user?.id) {
      Alert.alert('Erreur', 'Impossible d’envoyer le message : utilisateur non authentifié.');
      return;
    }

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);
    triggerSendFeedback();

    // Optimistic UI: Create temporary message with unique ID
    // ID combines timestamp + random string for practical uniqueness in short-lived temp messages
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversationId,
      senderId: user.id,
      type: 'TEXT',
      content: messageText,
      createdAt: new Date().toISOString(),
    };

    // Add message to local state immediately
    setMessages((prev) => dedupeMessages([...prev, optimisticMessage]));

    try {
      const response = await apiService.sendTextMessage({
        conversationId,
        content: messageText,
      });
      if (response) {
        applyIncomingPayload(response);
      }
    } catch (error: any) {
      Alert.alert('Erreur', 'Envoi du message impossible.');
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setInputText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (!ensureConversation() || !conversationId) return;

    // Send typing indicator
    if (text.length > 0) {
      socketService.startTyping(conversationId);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(conversationId);
      }, 3000);
    } else {
      socketService.stopTyping(conversationId);
    }
  };

  useEffect(() => {
    if (!conversation?.id || !isFocused) return;
    if (lastPersistedCount.current === revealProgress.textMessageCount) return;
    const timeout = setTimeout(() => {
      lastPersistedCount.current = revealProgress.textMessageCount;
      markConversationAsRead(conversation.id, revealProgress.textMessageCount).catch((error) =>
        console.error('Failed to persist read state', error)
      );
    }, 800);

    return () => clearTimeout(timeout);
  }, [conversation?.id, revealProgress.textMessageCount, isFocused]);

  const sendButtonScale = sendFeedbackAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.96],
  });

  const chapterFeedbackScale = chapterFeedbackAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1],
  });

  useEffect(() => {
    if (!conversation) return;
    const previousLevel = lastRevealLevelRef.current;
    const currentLevel = revealProgress.revealLevel ?? 0;
    if (conversation.otherUser?.photoUrl) {
      photoUnavailableRef.current = false;
    }
    if (previousLevel !== null && currentLevel > previousLevel) {
      setUnlockedChapter(getChapterNarrative(currentLevel));
      chapterFeedbackAnim.setValue(0);
      Animated.sequence([
        Animated.timing(chapterFeedbackAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.delay(900),
        Animated.timing(chapterFeedbackAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => setUnlockedChapter(null));
    }
    lastRevealLevelRef.current = currentLevel;
  }, [conversation, revealProgress.revealLevel]);

  useEffect(() => {
    if (!conversation?.id) return;
    if (revealProgress.revealLevel > 0 && !conversation.otherUser?.photoUrl && !photoRefreshRef.current && !photoUnavailableRef.current) {
      photoRefreshRef.current = true;
      apiService
        .getConversation(conversation.id)
        .then((data) => {
          setConversation(data);
          if (!data?.otherUser?.photoUrl) {
            photoUnavailableRef.current = true;
          }
        })
        .catch(() => {})
        .finally(() => {
          photoRefreshRef.current = false;
        });
    }
  }, [conversation?.id, conversation?.otherUser?.photoUrl, revealProgress.revealLevel]);

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.type === 'SYSTEM') {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.content || ''}</Text>
        </View>
      );
    }

    const isOwnMessage = item.senderId === user?.id;
    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
          {item.content || ''}
        </Text>
        <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  const displayName = conversation?.otherUser?.name || matchName;
  const displayInitial = displayName?.[0]?.toUpperCase() || '?';
  const candidatePhoto = useMemo(
    () => (conversation?.otherUser?.photoUrl ?? matchPhotoUrl) ?? null,
    [conversation?.otherUser?.photoUrl, matchPhotoUrl]
  );
  const revealLevel = revealProgress.revealLevel ?? 0;
  const photoHidden = conversation?.otherUser?.photoHidden ?? shouldHidePhoto(revealLevel, candidatePhoto);

  if (isLoading) {
    return (
      <Screen edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.textPrimary} />
          <Text style={styles.loadingText}>Chargement des messages...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerTop}
            activeOpacity={0.85}
            onPress={handleOpenProfile}
          >
            <RevealPhoto
              photoUrl={candidatePhoto || undefined}
              photoHidden={photoHidden}
              revealLevel={revealLevel}
              containerStyle={styles.photoWrapper}
              borderRadius={24}
              placeholder={
                <View style={styles.headerAvatarPlaceholder}>
                  <Text style={styles.headerAvatarText}>{displayInitial}</Text>
                </View>
              }
            />
            <View style={styles.headerTextArea}>
              <Text style={styles.matchName}>{displayName}</Text>
              {conversation && (
                <View style={styles.revealInfo}>
                  <Text style={styles.revealText}>
                    {getRevealChapter(revealLevel)}
                  </Text>
                </View>
              )}
              {unlockedChapter && (
                <Animated.View
                  style={[
                    styles.chapterBadge,
                    {
                      opacity: chapterFeedbackAnim,
                      transform: [{ scale: chapterFeedbackScale }],
                    },
                  ]}
                >
                    <Text style={styles.chapterBadgeText}>{unlockedChapter}</Text>
                  </Animated.View>
                )}
              </View>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
        />

        {typingUser && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>{displayName} écrit...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <AnimatedTextInput
            style={styles.input}
            value={inputText}
            onChangeText={handleInputChange}
            placeholder="Écrire un message..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            maxLength={1000}
          />
          <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || isSending}
            >
              <Text style={styles.sendButtonText}>Envoyer</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  photoWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarPlaceholder: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: Typography.lg,
    color: Colors.textSecondary,
    fontFamily: Typography.fontSans,
    fontWeight: '700',
  },
  headerTextArea: {
    flex: 1,
  },
  matchName: {
    fontSize: Typography.xl,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  revealInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  revealText: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontSans,
    color: Colors.textTertiary,
  },
  chapterBadge: {
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 999,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chapterBadgeText: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontSans,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  messageCount: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontSans,
    color: Colors.textTertiary,
  },
  messagesList: {
    padding: Spacing.lg,
  },
  systemMessageContainer: {
    alignSelf: 'center',
    backgroundColor: Colors.bgSecondary,
    borderColor: Colors.borderLight,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    maxWidth: '85%',
  },
  systemMessageText: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontSans,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  messageContainer: {
    maxWidth: '75%',
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.buttonPrimary,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  messageText: {
    fontSize: Typography.base,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
    lineHeight: Typography.base * 1.4,
  },
  ownMessageText: {
    color: Colors.textInverse,
  },
  messageTime: {
    fontSize: Typography.xs,
    fontFamily: Typography.fontSans,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  ownMessageTime: {
    color: Colors.textInverseSecondary,
  },
  typingIndicator: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  typingText: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontSans,
    fontStyle: 'italic',
    color: Colors.textTertiary,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: Typography.base,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
    maxHeight: 100,
    marginRight: Spacing.sm,
  },
  sendButton: {
    backgroundColor: Colors.buttonPrimary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.buttonDisabled,
  },
  sendButtonText: {
    color: Colors.bgPrimary,
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    fontWeight: '600',
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
});

export default ChatScreen;
