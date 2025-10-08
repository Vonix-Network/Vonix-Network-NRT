import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { chatWebSocket } from '../services/websocket';
import './LiveChat.css';

interface DiscordEmbed {
  title?: string | null;
  description?: string | null;
  url?: string | null;
  color?: number | null;
  thumbnail?: string | null;
  image?: string | null;
  author?: {
    name: string;
    iconURL?: string;
    url?: string;
  } | null;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
}

interface MessageAttachment {
  id: string;
  filename: string;
  url: string;
  proxy_url?: string;
  size: number;
  width?: number | null;
  height?: number | null;
  content_type?: string | null;
}

interface ChatMessage {
  id: number | string;
  discord_message_id?: string;
  author_name: string;
  author_avatar: string;
  content: string;
  embeds?: string | null;
  attachments?: string | null;
  timestamp: string;
}

const LiveChat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessageIds, setNewMessageIds] = useState<Set<string | number>>(new Set());
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);

  useEffect(() => {
    console.log('LiveChat component mounted, setting up WebSocket');
    loadMessages();
    chatWebSocket.connect();

    const unsubscribe = chatWebSocket.onMessage((message: ChatMessage) => {
      console.log('🎯 LiveChat received message via WebSocket:', message);
      setMessages((prev) => {
        console.log('Current messages:', prev.length, 'New message ID:', message.id);
        // Check if message already exists
        if (prev.some(m => m.id === message.id || m.discord_message_id === message.id)) {
          console.log('⚠️ Message already exists, skipping');
          return prev;
        }
        console.log('✅ Adding new message to state');
        setNewMessageIds(prev => new Set(prev).add(message.id));
        setTimeout(() => {
          setNewMessageIds(prev => {
            const next = new Set(prev);
            next.delete(message.id);
            return next;
          });
        }, 1000);
        
        // Add new message and keep only the last 20
        const updatedMessages = [...prev, message];
        return updatedMessages.slice(-20);
      });
    });

    console.log('WebSocket message handler registered');

    return () => {
      console.log('LiveChat component unmounting, cleaning up WebSocket');
      unsubscribe();
      chatWebSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    // Only auto-scroll on new messages if the user is already near the bottom
    if (didInitialScroll.current && isNearBottom()) {
      scrollToBottom(true);
    }
  }, [messages]);

  // Perform a single non-animated scroll after initial load completes
  useEffect(() => {
    if (!loading && !didInitialScroll.current) {
      scrollToBottom(false);
      didInitialScroll.current = true;
    }
  }, [loading]);

  const loadMessages = async () => {
    try {
      const response = await api.get('/chat/messages?limit=20');
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || sending) return;

    setSending(true);
    try {
      await api.post('/chat/send', { message: messageInput.trim() });
      setMessageInput('');
      // Message will appear via WebSocket
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // If user not found, their token is stale - force logout
      if (error.response?.data?.code === 'USER_NOT_FOUND') {
        alert('Your session is no longer valid. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      alert(error.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = (smooth: boolean) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' as ScrollBehavior : 'auto' });
  };

  const isNearBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return true;
    const threshold = 100; // px
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const parseEmbeds = (embedsString: string | null | undefined): DiscordEmbed[] => {
    if (!embedsString) return [];
    try {
      return JSON.parse(embedsString);
    } catch {
      return [];
    }
  };

  const parseAttachments = (attachmentsString: string | null | undefined): MessageAttachment[] => {
    if (!attachmentsString) return [];
    try {
      return JSON.parse(attachmentsString);
    } catch {
      return [];
    }
  };

  const isImageAttachment = (attachment: MessageAttachment): boolean => {
    if (attachment.content_type?.startsWith('image/')) return true;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    return imageExtensions.some(ext => attachment.filename.toLowerCase().endsWith(ext));
  };

  const renderEmbed = (embed: DiscordEmbed, index: number) => {
    const borderColor = embed.color 
      ? `#${embed.color.toString(16).padStart(6, '0')}` 
      : '#5865F2';

    return (
      <div key={index} className="message-embed" style={{ borderLeftColor: borderColor }}>
        {embed.author && (
          <div className="embed-author">
            {embed.author.iconURL && (
              <img src={embed.author.iconURL} alt="" className="embed-author-icon" />
            )}
            <span className="embed-author-name">
              {embed.author.url ? (
                <a href={embed.author.url} target="_blank" rel="noopener noreferrer">
                  {embed.author.name}
                </a>
              ) : (
                embed.author.name
              )}
            </span>
          </div>
        )}
        
        {embed.title && (
          <div className="embed-title">
            {embed.url ? (
              <a href={embed.url} target="_blank" rel="noopener noreferrer">
                {embed.title}
              </a>
            ) : (
              embed.title
            )}
          </div>
        )}
        
        {embed.description && (
          <div className="embed-description">{embed.description}</div>
        )}
        
        {embed.fields && embed.fields.length > 0 && (
          <div className="embed-fields">
            {embed.fields.map((field, idx) => (
              <div key={idx} className={`embed-field ${field.inline ? 'inline' : ''}`}>
                <div className="embed-field-name">{field.name}</div>
                <div className="embed-field-value">{field.value}</div>
              </div>
            ))}
          </div>
        )}
        
        {embed.image && (
          <img src={embed.image} alt="" className="embed-image" />
        )}
        
        {embed.thumbnail && (
          <img src={embed.thumbnail} alt="" className="embed-thumbnail" />
        )}
      </div>
    );
  };

  return (
    <div className="live-chat">
      <div className="chat-header">
        <div className="chat-header-content">
          <span className="chat-icon">🎮</span>
          <div>
            <h3 className="chat-title">Live Community Chat</h3>
            <p className="chat-subtitle">Connected to Discord channel</p>
          </div>
        </div>
        <div className="status-indicator online"></div>
      </div>

      <div className="chat-messages" ref={messagesContainerRef}>
        {loading ? (
          <div className="chat-loading">
            <div className="spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <p>No messages yet. Be the first to chat!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`chat-message ${newMessageIds.has(message.id) ? 'new-message' : ''}`}
            >
              <img
                src={message.author_avatar || '/default-avatar.png'}
                alt={message.author_name}
                className="message-avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(message.author_name)}&background=00d97e&color=fff`;
                }}
              />
              <div className="message-content">
                <div className="message-header">
                  <span className="message-author">{message.author_name}</span>
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
                {message.content && <p className="message-text">{message.content}</p>}
                
                {message.attachments && parseAttachments(message.attachments).map((attachment, idx) => (
                  <div key={attachment.id} className="message-attachment">
                    {isImageAttachment(attachment) ? (
                      <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={attachment.url} 
                          alt={attachment.filename}
                          className="attachment-image"
                          loading="lazy"
                        />
                      </a>
                    ) : (
                      <a 
                        href={attachment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="attachment-file"
                      >
                        📎 {attachment.filename}
                      </a>
                    )}
                  </div>
                ))}
                
                {message.embeds && parseEmbeds(message.embeds).map((embed, idx) => renderEmbed(embed, idx))}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-footer">
        {user ? (
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="text"
              className="chat-input"
              placeholder={user.minecraft_username ? `Message as ${user.minecraft_username}` : "Type a message..."}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              disabled={sending}
            />
            <button 
              type="submit" 
              className="chat-send-btn"
              disabled={sending || !messageInput.trim()}
            >
              {sending ? '...' : '📤'}
            </button>
          </form>
        ) : (
          <p className="chat-notice">
            💡 <a href="/register">Register</a> or <a href="/login">Login</a> to participate in the conversation
          </p>
        )}
      </div>
    </div>
  );
};

export default LiveChat;
