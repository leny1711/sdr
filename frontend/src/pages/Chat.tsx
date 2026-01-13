import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const addUniqueMessage = useCallback((incomingMessage: Message) => {
    setMessages((prev) => {
      if (prev.some((msg) => msg.id === incomingMessage.id)) {
        return prev;
      }
      return [...prev, incomingMessage];
    });
  }, []);

  const loadConversation = useCallback(async () => {
    if (!conversationId) {
      setConversation(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [conversationData, messagePage] = await Promise.all([
        conversationAPI.getConversation(conversationId),
        conversationAPI.getMessages(conversationId),
      ]);
      setConversation(conversationData);
      setMessages(messagePage?.messages ?? []);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      setConversation(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const handleNewMessage = (payload: Message | { message: Message }) => {
      const incomingMessage = 'message' in payload ? payload.message : payload;
      addUniqueMessage(incomingMessage);
    };

    loadConversation();
    socketService.joinConversation(conversationId);
    socketService.onNewMessage(handleNewMessage);

    return () => {
      socketService.leaveConversation(conversationId);
      socketService.off('message:new');
    };
  }, [conversationId, loadConversation, addUniqueMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || sending) return;

    setSending(true);
    try {
      const sentMessage = await messageAPI.sendText(conversationId, newMessage.trim());
      if (!sentMessage) {
        console.warn('sendText did not return a message');
        return;
      }
      if (!messages.some((msg) => msg.id === sentMessage.id)) {
        addUniqueMessage(sentMessage);
      }
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const textMessages = useMemo(
    () =>
      messages.filter((message) => {
        const isText = message.type === 'TEXT';
        const hasContent = Boolean(message.content);
        if (isText && !hasContent) {
          console.warn('Skipping text message without content', {
            id: message.id,
            createdAt: message.createdAt,
          });
        }
        return isText && hasContent;
      }),
    [messages]
  );

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
        </div>
      </div>

      <div className={styles.messagesContainer}>
        {textMessages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Start your conversation!</p>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {textMessages.map((message) => (
              <div
                key={message.id}
                className={`${styles.message} ${
                  message.senderId === user?.id ? styles.myMessage : styles.theirMessage
                }`}
              >
                <div className={styles.messageContent}>
                  <p>{message.content}</p>
                </div>
                <span className={styles.timestamp}>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className={styles.inputContainer}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
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
