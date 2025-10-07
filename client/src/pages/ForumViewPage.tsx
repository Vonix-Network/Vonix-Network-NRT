import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ForumViewPage.css';

interface Topic {
  id: number;
  title: string;
  slug: string;
  views: number;
  replies: number;
  locked: number;
  pinned: number;
  announcement: number;
  author_username: string;
  author_uuid?: string;
  user_id: number;
  last_post_username?: string;
  last_post_user_uuid?: string;
  last_post_time?: string;
  created_at: string;
  hasUnread?: boolean;
}

interface Forum {
  id: number;
  name: string;
  description: string;
  category_name: string;
  locked: number;
  topics_count: number;
  posts_count: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const ForumViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [forum, setForum] = useState<Forum | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const handleDeleteTopic = async (e: React.MouseEvent, topicId: number, topicTitle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to delete "${topicTitle}"? This action cannot be undone.`)) return;
    
    try {
      await api.delete(`/forum/topic/${topicId}`);
      // Refresh the topics list
      if (id) {
        const response = await api.get(`/forum/forum/${id}?page=${currentPage}`);
        setTopics(response.data.topics);
        setForum(response.data.forum);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete topic');
    }
  };

  useEffect(() => {
    if (!id) return;
    const run = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/forum/forum/${id}?page=${currentPage}`);
        setForum(response.data.forum);
        setTopics(response.data.topics);
        setPagination(response.data.pagination);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load forum');
        setLoading(false);
      }
    };
    run();
  }, [id, currentPage]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="forum-view-page">
        <div className="container">
          <div className="loading">Loading forum...</div>
        </div>
      </div>
    );
  }

  if (error || !forum) {
    return (
      <div className="forum-view-page">
        <div className="container">
          <div className="error">{error || 'Forum not found'}</div>
          <Link to="/forum" className="btn-back">← Back to Forums</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="forum-view-page">
      <div className="container">
        <div className="forum-breadcrumb">
          <Link to="/forum">Forums</Link>
          <span className="separator">/</span>
          <span>{forum.category_name}</span>
          <span className="separator">/</span>
          <span className="current">{forum.name}</span>
        </div>

        <div className="forum-header">
          <div className="forum-title">
            <h1>{forum.name}</h1>
            {forum.description && <p>{forum.description}</p>}
          </div>
          <div className="forum-actions">
            {user && forum.locked === 0 && (
              <button 
                className="btn-primary"
                onClick={() => navigate(`/forum/${id}/new-topic`)}
              >
                + New Topic
              </button>
            )}
          </div>
        </div>

        <div className="forum-stats-bar">
          <div className="stat">
            <strong>{forum.topics_count}</strong> Topics
          </div>
          <div className="stat">
            <strong>{forum.posts_count}</strong> Posts
          </div>
        </div>

        {forum.locked === 1 && (
          <div className="forum-locked-notice">
            🔒 This forum is locked. Only moderators and admins can post new topics.
          </div>
        )}

        {topics.length > 0 ? (
          <>
            <div className="topics-list">
              <div className="topics-header">
                <div className="topic-title-col">Topic</div>
                <div className="topic-stats-col">Stats</div>
                <div className="topic-last-post-col">Last Post</div>
              </div>

              {topics.map(topic => (
                <Link 
                  to={`/forum/topic/${topic.slug}`} 
                  key={topic.id}
                  className={`topic-item ${topic.hasUnread ? 'unread' : ''} ${topic.pinned ? 'pinned' : ''} ${topic.announcement ? 'announcement' : ''}`}
                >
                  <div className="topic-title-col">
                    <div className="topic-icons">
                      {topic.announcement === 1 && <span className="badge badge-announcement">📢 Announcement</span>}
                      {topic.pinned === 1 && !topic.announcement && <span className="badge badge-pinned">📌 Pinned</span>}
                      {topic.locked === 1 && <span className="badge badge-locked">🔒 Locked</span>}
                    </div>
                    <h3>{topic.title}</h3>
                    <div className="topic-author">
                      {topic.author_uuid && (
                        <img 
                          src={`https://crafatar.com/avatars/${topic.author_uuid}?size=20&overlay`}
                          alt={topic.author_username}
                          className="user-avatar-tiny"
                        />
                      )}
                      <span>by {topic.author_username}</span>
                    </div>
                  </div>

                  <div className="topic-stats-col">
                    <div className="stat">
                      <span className="stat-number">{topic.replies}</span>
                      <span className="stat-label">Replies</span>
                    </div>
                    <div className="stat">
                      <span className="stat-number">{topic.views}</span>
                      <span className="stat-label">Views</span>
                    </div>
                  </div>

                  <div className="topic-last-post-col">
                    {topic.last_post_time && topic.last_post_username ? (
                      <>
                        <div className="last-post-user">
                          {topic.last_post_user_uuid && (
                            <img 
                              src={`https://crafatar.com/avatars/${topic.last_post_user_uuid}?size=24&overlay`}
                              alt={topic.last_post_username}
                              className="user-avatar-small"
                            />
                          )}
                          <span>{topic.last_post_username}</span>
                        </div>
                        <div className="last-post-time">{formatDate(topic.last_post_time)}</div>
                      </>
                    ) : (
                      <span className="no-replies">No replies yet</span>
                    )}
                  </div>
                  
                  {user && (user.id === topic.user_id || user.role === 'admin') && (
                    <div className="topic-actions-col">
                      <button
                        onClick={(e) => handleDeleteTopic(e, topic.id, topic.title)}
                        className="btn-delete-topic"
                        title="Delete Topic"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-page"
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {pagination.pages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={currentPage === pagination.pages}
                  className="btn-page"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-topics">
            <p>No topics in this forum yet. Be the first to start a discussion!</p>
            {user && forum.locked === 0 && (
              <button 
                className="btn-primary"
                onClick={() => navigate(`/forum/${id}/new-topic`)}
              >
                Create First Topic
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumViewPage;
