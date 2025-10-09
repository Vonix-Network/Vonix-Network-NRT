import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import UserDisplay from '../components/UserDisplay';
import './ForumListPage.css';

interface LastPost {
  last_post_username?: string;
  last_post_minecraft_username?: string;
  last_post_user_uuid?: string;
  last_post_topic_title?: string;
  last_post_topic_slug?: string;
  last_post_time?: string;
  last_post_total_donated?: number;
  last_post_donation_rank?: {
    id: string;
    name: string;
    color: string;
    textColor: string;
    icon: string;
    badge: string;
    glow: boolean;
  };
}

interface Forum extends LastPost {
  id: number;
  name: string;
  description: string;
  icon?: string;
  locked: number;
  topics_count: number;
  posts_count: number;
}

interface Category {
  id: number;
  name: string;
  description: string;
  forums: Forum[];
}

const ForumListPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchForums();
  }, []);

  const fetchForums = async () => {
    try {
      const response = await api.get('/forum');
      setCategories(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load forums');
      setLoading(false);
    }
  };

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
      <div className="forum-list-page">
        <div className="container">
          <div className="loading">Loading forums...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="forum-list-page">
        <div className="container">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="forum-list-page">
      <div className="container">
        <div className="forum-header">
          <div className="header-content">
            <div className="header-text">
              <h1 className="forum-title">Community Forums</h1>
              <p className="forum-subtitle">Join the discussion with fellow players</p>
            </div>
            <div className="header-actions">
              <div className="search-container">
                <input 
                  type="text" 
                  placeholder="Search forums..." 
                  className="forum-search"
                />
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
              <button className="btn btn-primary new-topic-btn">
                + New Topic
              </button>
            </div>
          </div>
        </div>

        <div className="forums-container">
          {categories.map(category => (
            <div key={category.id} className="forum-category">
              {category.forums.map(forum => (
                <div key={forum.id} className="forum-card">
                  <div className="forum-card-content">
                    <div className="forum-main">
                      <div className="forum-icon-container">
                        <div className="forum-avatar">
                          <span className="forum-letter">
                            {forum.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="forum-content">
                        <Link to={`/forum/${forum.id}`} className="forum-link">
                          <h3 className="forum-name">
                            {forum.name}
                            {forum.locked === 1 && (
                              <span className="forum-locked" title="This forum is locked">🔒</span>
                            )}
                          </h3>
                        </Link>
                        <p className="forum-description">
                          {forum.description || 'Join the discussion and share your thoughts'}
                        </p>
                        <div className="forum-meta">
                          <span className="forum-author">
                            by{' '}
                            {forum.last_post_username ? (
                              <UserDisplay
                                username={forum.last_post_username}
                                minecraftUsername={forum.last_post_minecraft_username}
                                totalDonated={forum.last_post_total_donated}
                                donationRank={forum.last_post_donation_rank}
                                size="small"
                                showIcon={false}
                                showBadge={true}
                              />
                            ) : (
                              'Admin'
                            )}
                          </span>
                          <span className="forum-time">Last reply {formatDate(forum.last_post_time)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="forum-stats-container">
                      <div className="forum-engagement">
                        <div className="engagement-item">
                          <svg className="engagement-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                          <span className="engagement-count">{forum.topics_count || 0}</span>
                        </div>
                        <div className="engagement-item">
                          <svg className="engagement-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"></path>
                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"></path>
                          </svg>
                          <span className="engagement-count">{forum.posts_count || 0}</span>
                        </div>
                      </div>
                      
                      <div className="forum-actions">
                        <button className="action-btn like-btn">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M7 10v12l5-3 5 3V10"></path>
                            <path d="M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"></path>
                          </svg>
                        </button>
                        <button className="action-btn delete-btn">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M3 6h18l-2 13H5L3 6z"></path>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {categories.length === 0 && (
            <div className="no-forums">
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <h3>No forums available</h3>
                <p>Check back soon for community discussions!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForumListPage;
