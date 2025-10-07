import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import './MessagesPage.css';

interface User {
  id: number;
  username: string;
  minecraft_username?: string;
  minecraft_uuid?: string;
}

interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  content: string;
  read: number;
  created_at: string;
}

interface Conversation {
  user_id: number;
  username: string;
  minecraft_username?: string;
  minecraft_uuid?: string;
  last_message?: string;
  last_message_at?: string;
  last_sender_id?: number;
  unread_count: number;
}

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadConversations();
    
    // Check if there's a user_id query param to open a conversation
    const userId = searchParams.get('user_id');
    if (userId) {
      loadConversationWithUser(parseInt(userId));
    }
  }, [user, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const searchUsers = async () => {
    try {
      const response = await api.get(`/messages/search-users?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const loadConversationWithUser = async (userId: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/messages/with/${userId}`);
      setSelectedUser(response.data.user);
      setMessages(response.data.messages);
      setSearchQuery('');
      setSearchResults([]);
      setSearchParams({ user_id: userId.toString() });
      // Refresh conversations to update unread count
      await loadConversations();
      // Close sidebar on mobile after selecting a conversation
      setMobileSidebarOpen(false);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || sending) return;

    setSending(true);
    try {
      const response = await api.post('/messages/send', {
        recipient_id: selectedUser.id,
        content: newMessage.trim()
      });
      
      setMessages([...messages, response.data.message]);
      setNewMessage('');
      
      // Refresh conversations to update last message
      await loadConversations();
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(error.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getUserAvatar = (u: User | Conversation) => {
    if ('minecraft_uuid' in u && u.minecraft_uuid) {
      return `https://crafatar.com/renders/head/${u.minecraft_uuid}`;
    }
    if ('minecraft_username' in u && u.minecraft_username) {
      return `https://mc-heads.net/avatar/${u.minecraft_username}/32`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&background=6366f1&color=fff`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!user) return null;

  return (
    <div className="messages-page">
      <div className={`messages-sidebar ${mobileSidebarOpen ? 'mobile-show' : ''}`}>
        <div className="sidebar-header">
          <h2>Messages</h2>
          <button
            type="button"
            className="mobile-sidebar-close"
            aria-label="Close conversations"
            onClick={() => setMobileSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="user-search">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="search-results">
            <div className="results-header">Search Results</div>
            {searchResults.map((u) => (
              <div
                key={u.id}
                className="conversation-item"
                onClick={() => loadConversationWithUser(u.id)}
              >
                <img src={getUserAvatar(u)} alt={u.username} className="conversation-avatar" />
                <div className="conversation-info">
                  <div className="conversation-name">{u.minecraft_username || u.username}</div>
                  <div className="conversation-preview">Start a conversation</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="conversations-list">
          {conversations.length === 0 && searchResults.length === 0 && (
            <div className="no-conversations">
              <p>No conversations yet</p>
              <p className="hint">Search for a user above to start chatting</p>
            </div>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.user_id}
              className={`conversation-item ${selectedUser?.id === conv.user_id ? 'active' : ''}`}
              onClick={() => loadConversationWithUser(conv.user_id)}
            >
              <img src={getUserAvatar(conv)} alt={conv.username} className="conversation-avatar" />
              <div className="conversation-info">
                <div className="conversation-name">
                  {conv.minecraft_username || conv.username}
                  {conv.unread_count > 0 && <span className="unread-badge">{conv.unread_count}</span>}
                </div>
                {conv.last_message && (
                  <div className="conversation-preview">
                    {conv.last_sender_id === user.id ? 'You: ' : ''}
                    {conv.last_message}
                  </div>
                )}
              </div>
              {conv.last_message_at && (
                <div className="conversation-time">{formatTime(conv.last_message_at)}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="messages-main">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <button
                type="button"
                className="mobile-sidebar-toggle"
                aria-label="Open conversations"
                onClick={() => setMobileSidebarOpen(true)}
              >
                ☰
              </button>
              <img src={getUserAvatar(selectedUser)} alt={selectedUser.username} className="chat-header-avatar" />
              <div className="chat-header-info">
                <h3>{selectedUser.minecraft_username || selectedUser.username}</h3>
                {selectedUser.minecraft_username && selectedUser.username !== selectedUser.minecraft_username && (
                  <span className="chat-header-subtitle">@{selectedUser.username}</span>
                )}
              </div>
            </div>

            <div className="messages-container">
              {loading ? (
                <div className="messages-loading">
                  <div className="spinner"></div>
                  <p>Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages yet</p>
                  <p className="hint">Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message ${msg.sender_id === user.id ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">{msg.content}</div>
                    <div className="message-time">{formatTime(msg.created_at)}</div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="message-input-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="message-input"
                disabled={sending}
              />
              <button type="submit" className="send-button" disabled={sending || !newMessage.trim()}>
                {sending ? '...' : '📤'}
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the sidebar or search for a user to start chatting</p>
              <button
                type="button"
                className="btn btn-secondary btn-sm open-conversations-btn"
                onClick={() => setMobileSidebarOpen(true)}
              >
                Open Conversations
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
