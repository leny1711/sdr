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
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import apiService from '../services/api';
import socketService from '../services/socket';
import { useAuth } from '../contexts/AuthContext';
import { Message, Conversation } from '../types';
import { AppStackParamList } from '../navigation';
import { Colors, Typography, Spacing } from '../constants/theme';
import Screen from '../components/Screen';
import AnimatedTextInput from '../components/AnimatedTextInput';
import RevealPhoto from '../components/RevealPhoto';
import { calculateRevealLevel, getRevealChapter, shouldHidePhoto } from '../utils/reveal';

type ChatScreenRouteProp = RouteProp<AppStackParamList, 'Chat'>;

// Constants following requirements
const MAX_MESSAGES_IN_STATE = 50; // Requirement: max 50 messages in state
const INITIAL_PAGE_SIZE = 30;
const LOAD_MORE_PAGE_SIZE = 30;
const FETCH_THROTTLE_MS = 2000; // Requirement: max 1 GET request every 2000ms

// Memoized message item component
const MessageItem = React.memo(({ message, isOwn }: { message: Message; isOwn: boolean }) => (
  <View style={[styles.messageContainer, isOwn ? styles.ownMessage : styles.otherMessage]}>
    <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>{message.content || ''}</Text>
    <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
      {new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}
    </Text>
  </View>
));

const ChatScreen = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const { conversationId: routeConversationId, matchName, matchPhotoUrl } = route.params;
  const conversationId =
    typeof routeConversationId === 'string' ? routeConversationId.trim() || undefined : undefined;
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user, token } = useAuth();

  // State (following requirements: max 50 messages)
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [localTextMessageCount, setLocalTextMessageCount] = useState(0);
  const [inputText, setInputText] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const lastFetchTimeRef = useRef(0);
  const initialLoadDoneRef = useRef(false);

  // Stable keyExtractor
  const keyExtractor = useCallback((item: Message) => item.id, []);

  // Check if conversation ID is valid
  const ensureConversation = () => {
    if (!conversationId) {
      Alert.alert('Erreur', 'Cette conversation est indisponible.');
      return false;
    }
    return true;
  };

  // Connect socket on mount
  useEffect(() => {
    if (!token) return;
    socketService.connect(token);
    return () => {
      socketService.disconnect();
    };
  }, [token]);

  // Join/leave conversation room
  useEffect(() => {
    if (!conversationId) return;
    socketService.joinConversation(conversationId);
    return () => {
      socketService.leaveConversation(conversationId);
    };
  }, [conversationId]);

  // REQUIREMENT: Initial load only (ONE fetch when opening conversation)
  useEffect(() => {
    if (!ensureConversation() || !conversationId || initialLoadDoneRef.current) {
      return;
    }

    const loadInitialData = async () => {
      setIsInitialLoading(true);
      try {
        // Load conversation metadata
        const convData = await apiService.getConversation(conversationId);
        setConversation(convData);
        setLocalTextMessageCount(convData.textMessageCount);

        // Load initial messages (ONE fetch)
        console.log('[GET /messages] Initial load', { conversationId, limit: INITIAL_PAGE_SIZE });
        const messagesData = await apiService.getMessages(conversationId, undefined, INITIAL_PAGE_SIZE);
        
        if (messagesData && Array.isArray(messagesData.messages)) {
          setMessages(messagesData.messages);
          setHasOlderMessages(Boolean(messagesData.nextCursor));
        }

        initialLoadDoneRef.current = true;
        lastFetchTimeRef.current = Date.now();
      } catch (error: any) {
        Alert.alert('Erreur', 'Impossible de charger la conversation.');
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialData();
  }, [conversationId]);

  // REQUIREMENT: Load older messages (manual button press only)
  const handleLoadOlder = useCallback(async () => {
    if (!conversationId || isLoadingMore || !hasOlderMessages || messages.length === 0) {
      return;
    }

    // REQUIREMENT: Throttle fetching (max 1 GET every 2000ms)
    const now = Date.now();
    if (now - lastFetchTimeRef.current < FETCH_THROTTLE_MS) {
      console.log('[THROTTLED] Load older ignored', { elapsed: now - lastFetchTimeRef.current });
      return;
    }

    setIsLoadingMore(true);
    lastFetchTimeRef.current = now;

    try {
      // Use oldest message as cursor
      const cursor = messages[0]?.createdAt;
      console.log('[GET /messages] Load older', { conversationId, cursor, limit: LOAD_MORE_PAGE_SIZE });
      
      const messagesData = await apiService.getMessages(conversationId, cursor, LOAD_MORE_PAGE_SIZE);
      
      if (messagesData && Array.isArray(messagesData.messages)) {
        setMessages((prev) => {
          // Merge older messages at the beginning
          const combined = [...messagesData.messages, ...prev];
          // REQUIREMENT: Keep max 50 messages in state
          const limited = combined.slice(-MAX_MESSAGES_IN_STATE);
          return limited;
        });
        setHasOlderMessages(Boolean(messagesData.nextCursor));
      }
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de charger les messages précédents.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, isLoadingMore, hasOlderMessages, messages]);

  // REQUIREMENT: Send message (POST only, no GET)
  const handleSend = async () => {
    if (!ensureConversation() || !conversationId) return;
    if (!inputText.trim() || isSending) return;
    if (!user?.id) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le message : utilisateur non authentifié.');
      return;
    }

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    // REQUIREMENT: Optimistically append message to UI
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversationId,
      senderId: user.id,
      type: 'TEXT',
      content: messageText,
      createdAt: new Date().toISOString(),
    };

    // Add to local state immediately
    setMessages((prev) => {
      const combined = [...prev, optimisticMessage];
      // Keep max 50 messages
      return combined.slice(-MAX_MESSAGES_IN_STATE);
    });

    try {
      console.log('[POST /messages]', { conversationId, contentLength: messageText.length });
      
      // REQUIREMENT: Send message via POST (no refetch)
      const savedMessage = await apiService.sendTextMessage({
        conversationId,
        content: messageText,
      });

      // Replace temp message with real message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? savedMessage : msg
        ).slice(-MAX_MESSAGES_IN_STATE)
      );

      // REQUIREMENT: Track message count locally
      setLocalTextMessageCount((count) => count + 1);

    } catch (error: any) {
      Alert.alert('Erreur', 'Envoi du message impossible.');
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setInputText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  // Compute reveal level locally
  const revealLevel = useMemo(
    () => calculateRevealLevel(localTextMessageCount),
    [localTextMessageCount]
  );

  // Handle profile navigation
  const handleOpenProfile = () => {
    if (!conversation?.otherUser) {
      Alert.alert('Profil indisponible', 'Le profil du match n\'est pas encore chargé.');
      return;
    }

    navigation.navigate('MatchProfile', {
      user: conversation.otherUser,
      revealLevel: revealLevel,
      conversationId,
    });
  };

  // Render message item
  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      if (item.type === 'SYSTEM') {
        return (
          <View style={styles.systemMessageContainer}>
            <Text style={styles.systemMessageText}>{item.content || ''}</Text>
          </View>
        );
      }
      return <MessageItem message={item} isOwn={item.senderId === user?.id} />;
    },
    [user?.id]
  );

  // Render load older button
  const renderLoadOlder = useCallback(() => {
    if (!hasOlderMessages) return null;
    return (
      <TouchableOpacity
        style={styles.loadOlderButton}
        onPress={handleLoadOlder}
        disabled={isLoadingMore}
        activeOpacity={0.85}
      >
        {isLoadingMore ? (
          <ActivityIndicator size="small" color={Colors.textPrimary} />
        ) : (
          <Text style={styles.loadOlderText}>⬆ Load older messages</Text>
        )}
      </TouchableOpacity>
    );
  }, [hasOlderMessages, isLoadingMore, handleLoadOlder]);

  // Display name and photo
  const displayName = conversation?.otherUser?.name || matchName;
  const displayInitial = displayName?.[0]?.toUpperCase() || '?';
  const candidatePhoto = useMemo(
    () => (conversation?.otherUser?.photoUrl ?? matchPhotoUrl) ?? null,
    [conversation?.otherUser?.photoUrl, matchPhotoUrl]
  );
  const photoHidden = conversation?.otherUser?.photoHidden ?? shouldHidePhoto(revealLevel, candidatePhoto);

  if (isInitialLoading) {
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
        {/* Header */}
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
            </View>
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.messagesList}
          inverted
          windowSize={5}
          maxToRenderPerBatch={10}
          initialNumToRender={20}
          removeClippedSubviews
          ListFooterComponent={renderLoadOlder}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <AnimatedTextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Écrire un message..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            <Text style={styles.sendButtonText}>Envoyer</Text>
          </TouchableOpacity>
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
  messagesList: {
    padding: Spacing.lg,
  },
  loadOlderButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: 999,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  loadOlderText: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontSans,
    color: Colors.textPrimary,
    fontWeight: '600',
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
