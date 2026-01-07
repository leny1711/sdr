import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import apiService from '../services/api';
import socketService from '../services/socket';
import { useAuth } from '../contexts/AuthContext';
import { Message, Conversation } from '../types';
import { AppStackParamList } from '../navigation';
import { Colors, Typography, Spacing } from '../constants/theme';

type ChatScreenRouteProp = RouteProp<AppStackParamList, 'Chat'>;
const conversationUnavailableMessage = 'This conversation is unavailable.';

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
  const { conversationId: routeConversationId, matchName } = route.params;
  const conversationId =
    typeof routeConversationId === 'string' ? routeConversationId.trim() || undefined : undefined;
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

  const ensureConversation = () => {
    if (!conversationId) {
      Alert.alert('Error', conversationUnavailableMessage);
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (!ensureConversation()) {
      setIsLoading(false);
      return;
    }

    loadConversation();
    loadMessages();

    // Join conversation room
    socketService.joinConversation(conversationId);

    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      setMessages((prev) => dedupeMessages([...prev, message]));
      // Update conversation message count
      if (message.type === 'TEXT') {
        setConversation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            textMessageCount: prev.textMessageCount + 1,
            revealLevel: calculateRevealLevel(prev.textMessageCount + 1),
          };
        });
      }
    };

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
  }, [conversationId, user?.id, dedupeMessages]);

  const loadConversation = async () => {
    if (!conversationId) return;
    try {
      const data = await apiService.getConversation(conversationId);
      setConversation(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load conversation');
    }
  };

  const loadMessages = async () => {
    if (!conversationId) return;
    try {
      setIsLoading(true);
      const data = await apiService.getMessages(conversationId);
      // Add guard to ensure data is an array
      if (Array.isArray(data)) {
        setMessages(dedupeMessages(data));
      } else {
        console.error('Invalid messages data received:', data);
        Alert.alert('Error', 'Failed to load messages: Invalid data format');
        setMessages([]);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRevealLevel = (count: number): number => {
    if (count < 10) return 0;
    if (count < 20) return 1;
    if (count < 30) return 2;
    return 3;
  };

  const handleSend = async () => {
    if (!ensureConversation()) return;
    if (!inputText.trim() || isSending) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await apiService.sendTextMessage({
        conversationId,
        content: messageText,
      });
      // Message will be received via socket
    } catch (error: any) {
      Alert.alert('Error', 'Failed to send message');
      setInputText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (!ensureConversation()) return;

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

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.id;
    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.content}</Text>
        <Text style={styles.messageTime}>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.textPrimary} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={styles.header}>
          <Text style={styles.matchName}>{matchName}</Text>
          {conversation && (
            <View style={styles.revealInfo}>
              <Text style={styles.revealText}>
                Photo: {getRevealLevelText(conversation.revealLevel)}
              </Text>
              <Text style={styles.messageCount}>
                {conversation.textMessageCount} messages
              </Text>
            </View>
          )}
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
            <Text style={styles.typingText}>{matchName} is typing...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={handleInputChange}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
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
  messageCount: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontSans,
    color: Colors.textTertiary,
  },
  messagesList: {
    padding: Spacing.lg,
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
  messageTime: {
    fontSize: Typography.xs,
    fontFamily: Typography.fontSans,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
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
