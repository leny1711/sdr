import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { conversationAPI, messageAPI } from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from '../contexts/AuthContext';
import type { ConversationWithMessages, Message } from '../types';
import styles from './Chat.module.css';

const Chat: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | undefined>(undefined);
  const { user } = useAuth();
  const navigate = useNavigate();

  const calculateRevealLevel = useCallback((count: number): number => {
    if (count >= 50) return 4;
    if (count >= 35) return 3;
    if (count >= 20) return 2;
    if (count >= 10) return 1;
    return 0;
  }, []);

  const loadConversation = useCallback(async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      const [conversationData, messagePage] = await Promise.all([
        conversationAPI.getConversation(conversationId),
        conversationAPI.getMessages(conversationId),
      ]);
      setConversation(conversationData);
      if (messagePage?.messages) {
        setMessages(messagePage.messages);
        setNextCursor(messagePage.nextCursor ?? null);
      } else {
        setMessages([]);
        setNextCursor(null);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || !nextCursor || loadingOlder) return;

    try {
      setLoadingOlder(true);
      const page = await conversationAPI.getMessages(conversationId, nextCursor);
      if (page?.messages?.length) {
        setMessages((prev) => {
          const merged = [...page.messages, ...prev];
          const map = new Map<string, Message>();
          merged.forEach((msg) => map.set(msg.id, msg));
          return Array.from(map.values()).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
      }
      setNextCursor(page?.nextCursor ?? null);
    } catch (error) {
      console.error('Failed to load older messages:', error);
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, nextCursor, loadingOlder]);

  useEffect(() => {
    if (!conversationId) return;

    const handleNewMessage = (payload: Message | { message: Message; revealLevel?: number }) => {
      const incomingMessage = (payload as any).message ? (payload as any).message : (payload as Message);
      const incomingRevealLevel = (payload as any).revealLevel as number | undefined;

      setMessages((prev) => [...prev, incomingMessage]);
      
      // Update text message count if it's a text message
      if (incomingMessage.type === 'TEXT') {
        setConversation((prev) => {
          if (!prev) return prev;
          const newCount = prev.textMessageCount + 1;
          const newRevealLevel =
            typeof incomingRevealLevel === 'number' ? incomingRevealLevel : calculateRevealLevel(newCount);
          return {
            ...prev,
            textMessageCount: newCount,
            revealLevel: newRevealLevel,
          };
        });
      }
    };

    const handleTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== user?.id) {
        setIsTyping(data.isTyping);
      }
    };

    loadConversation();
    socketService.joinConversation(conversationId);

    socketService.onNewMessage(handleNewMessage);
    socketService.onTyping(handleTyping);

    return () => {
      socketService.leaveConversation(conversationId);
      socketService.off('message:new');
      socketService.off('typing:user');
    };
  }, [conversationId, user?.id, loadConversation, calculateRevealLevel]);

  useEffect(() => {
    if (!loadingOlder) {
      scrollToBottom();
    }
  }, [messages, loadingOlder]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTypingStart = () => {
    if (!conversationId) return;

    socketService.startTyping(conversationId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      socketService.stopTyping(conversationId);
    }, 3000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || sending) return;

    setSending(true);
    try {
      await messageAPI.sendText(conversationId, newMessage.trim());
      setNewMessage('');
      socketService.stopTyping(conversationId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const getRevealLevelText = (level: number): string => {
    switch (level) {
      case 0:
        return 'Chapitre 0 • Photo cachée';
      case 1:
        return 'Chapitre 1 • Silhouette floutée (N&B)';
      case 2:
        return 'Chapitre 2 • Contours (N&B)';
      case 3:
        return 'Chapitre 3 • Couleur partielle';
      case 4:
        return 'Chapitre final • Photo dévoilée';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="container text-center">
        <p>Loading conversation...</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="container text-center">
        <p>Conversation not found</p>
        <button onClick={() => navigate('/matches')}>Back to Matches</button>
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.header}>
        <button onClick={() => navigate('/matches')} className="secondary">
          ← Back
        </button>
        <div className={styles.headerInfo}>
          <h2>{conversation.otherUser.name}</h2>
          <p className={styles.revealInfo}>
            Photo: {getRevealLevelText(conversation.revealLevel)}
          </p>
        </div>
      </div>

      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Start your conversation!</p>
            <p className={styles.hint}>
              Photos reveal gradually as you exchange messages.
            </p>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {nextCursor && (
              <div className={styles.loadMore}>
                <button onClick={loadOlderMessages} disabled={loadingOlder} className="secondary">
                  {loadingOlder ? 'Loading previous messages...' : 'Load previous messages'}
                </button>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.message} ${
                  message.senderId === user?.id ? styles.myMessage : styles.theirMessage
                }`}
              >
                <div className={styles.messageContent}>
                  {message.type === 'TEXT' ? (
                    <p>{message.content}</p>
                  ) : (
                    <div className={styles.voiceMessage}>
                      <span>🎤 Voice message</span>
                    </div>
                  )}
                </div>
                <span className={styles.timestamp}>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
            {isTyping && (
              <div className={styles.typingIndicator}>
                <span>{conversation.otherUser.name} is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className={styles.inputContainer}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTypingStart();
          }}
          placeholder="Type your message..."
          disabled={sending}
        />
        <button type="submit" disabled={sending || !newMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
