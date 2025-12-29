import React, { useState, useEffect, useRef } from 'react';
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
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | undefined>(undefined);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!conversationId) return;

    loadConversation();
    socketService.joinConversation(conversationId);

    socketService.onNewMessage(handleNewMessage);
    socketService.onTyping(handleTyping);

    return () => {
      socketService.leaveConversation(conversationId);
      socketService.off('message:new');
      socketService.off('typing:user');
    };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      const data = await conversationAPI.getConversation(conversationId);
      setConversation(data);
      setMessages(data.messages);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
    
    // Update text message count if it's a text message
    if (message.type === 'TEXT' && conversation) {
      setConversation((prev) => {
        if (!prev) return prev;
        const newCount = prev.textMessageCount + 1;
        const newRevealLevel = calculateRevealLevel(newCount);
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

  const calculateRevealLevel = (count: number): number => {
    if (count >= 30) return 3;
    if (count >= 20) return 2;
    if (count >= 10) return 1;
    return 0;
  };

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
        return 'Fully blurred, B&W';
      case 1:
        return 'Lightly visible, B&W';
      case 2:
        return 'Mostly visible, B&W';
      case 3:
        return 'Fully visible, Color';
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
            Photo: {getRevealLevelText(conversation.revealLevel)} • 
            {conversation.textMessageCount} text messages
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
