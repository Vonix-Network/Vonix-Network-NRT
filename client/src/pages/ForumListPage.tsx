import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './ForumListPage.css';

interface LastPost {
  last_post_username?: string;
  last_post_user_uuid?: string;
  last_post_topic_title?: string;
  last_post_topic_slug?: string;
  last_post_time?: string;
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
              <h1>Community Forums</h1>
              <p>Join the discussion and connect with our community</p>
            </div>
            <Link to="/leaderboard" className="btn btn-primary leaderboard-btn">
              🏆 Reputation Leaderboard
            </Link>
          </div>
        </div>

        {categories.map(category => (
          <div key={category.id} className="forum-category">
            <div className="category-header">
              <h2>{category.name}</h2>
              {category.description && <p>{category.description}</p>}
            </div>

            <div className="forums-list">
              {category.forums.map(forum => (
                <Link 
                  to={`/forum/${forum.id}`} 
                  key={forum.id} 
                  className="forum-item"
                >
                  <div className="forum-info">
                    <div className="forum-icon">
                      {forum.icon ? (
                        <i className={forum.icon}></i>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                      )}
                    </div>
                    <div className="forum-details">
                      <h3>
                        {forum.name}
                        {forum.locked === 1 && (
                          <span className="forum-locked" title="This forum is locked">
                            🔒
                          </span>
                        )}
                      </h3>
                      {forum.description && <p>{forum.description}</p>}
                    </div>
                  </div>

                  <div className="forum-stats">
                    <div className="stat">
                      <span className="stat-number">{forum.topics_count}</span>
                      <span className="stat-label">Topics</span>
                    </div>
                    <div className="stat">
                      <span className="stat-number">{forum.posts_count}</span>
                      <span className="stat-label">Posts</span>
                    </div>
                  </div>

                  <div className="forum-last-post">
                    {forum.last_post_time ? (
                      <>
                        <div className="last-post-topic">
                          {forum.last_post_topic_title && (
                            <span className="topic-title" title={forum.last_post_topic_title}>
                              {forum.last_post_topic_title.length > 30 
                                ? forum.last_post_topic_title.substring(0, 30) + '...' 
                                : forum.last_post_topic_title}
                            </span>
                          )}
                        </div>
                        <div className="last-post-user">
                          {forum.last_post_username && (
                            <>
                              {forum.last_post_user_uuid && (
                                <img 
                                  src={`https://crafatar.com/avatars/${forum.last_post_user_uuid}?size=24&overlay`}
                                  alt={forum.last_post_username}
                                  className="user-avatar-small"
                                />
                              )}
                              <span>by {forum.last_post_username}</span>
                            </>
                          )}
                        </div>
                        <div className="last-post-time">{formatDate(forum.last_post_time)}</div>
                      </>
                    ) : (
                      <span className="no-posts">No posts yet</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="no-forums">
            <p>No forums available yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumListPage;
