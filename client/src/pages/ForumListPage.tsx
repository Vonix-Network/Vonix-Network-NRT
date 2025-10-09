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
            </div>
          </div>
        </div>

        <div className="forums-container">
          {categories.map(category => (
            <div key={category.id} className="forum-category">
              <div className="category-header">
                <div className="category-icon">
                  {category.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="category-title">{category.name}</h2>
                <p className="category-description">{category.description}</p>
              </div>
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
                          <span className="engagement-count">{forum.topics_count || 0}</span>
                          <span className="engagement-label">Topics</span>
                        </div>
                        <div className="engagement-item">
                          <span className="engagement-count">{forum.posts_count || 0}</span>
                          <span className="engagement-label">Posts</span>
                        </div>
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
