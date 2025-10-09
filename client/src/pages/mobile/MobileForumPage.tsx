import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './MobileForumPage.css';

interface Forum {
  id: number;
  name: string;
  description: string;
  topic_count: number;
  post_count: number;
  last_post_title?: string;
  last_post_author?: string;
  last_post_created_at?: string;
}

interface RecentTopic {
  id: number;
  title: string;
  slug: string;
  author: string;
  reply_count: number;
  created_at: string;
  forum_name: string;
}

const MobileForumPage: React.FC = () => {
  const { user } = useAuth();
  const [forums, setForums] = useState<Forum[]>([]);
  const [recentTopics, setRecentTopics] = useState<RecentTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [forumsRes, topicsRes] = await Promise.all([
          api.get('/forum'),
          api.get('/forum/recent-topics?limit=5')
        ]);
        
        setForums(forumsRes.data);
        setRecentTopics(topicsRes.data || []);
      } catch (error) {
        console.error('Error fetching forum data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="mobile-content">
        <div className="mobile-loading">
          <div className="mobile-spinner"></div>
          <p>Loading forum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-content">
      <div className="mobile-forum">
        {/* Header */}
        <div className="mobile-forum-header">
          <h1>Community Forum</h1>
          <p>Join the discussion with fellow players</p>
        </div>

        {/* Quick Actions */}
        <div className="mobile-forum-actions">
          {user && (
            <Link to="/forum/new-topic" className="mobile-new-topic-btn">
              ✏️ New Topic
            </Link>
          )}
          <Link to="/leaderboard" className="mobile-leaderboard-btn">
            🏆 Leaderboard
          </Link>
        </div>

        {/* Recent Topics */}
        {recentTopics.length > 0 && (
          <section className="mobile-recent-topics">
            <h2 className="mobile-section-title">Recent Discussions</h2>
            <div className="mobile-topics-list">
              {recentTopics.map((topic) => (
                <Link
                  key={topic.id}
                  to={`/forum/topic/${topic.slug}`}
                  className="mobile-topic-card"
                >
                  <div className="mobile-topic-content">
                    <h3 className="mobile-topic-title">{topic.title}</h3>
                    <div className="mobile-topic-meta">
                      <span className="mobile-topic-forum">{topic.forum_name}</span>
                      <span className="mobile-topic-author">by {topic.author}</span>
                    </div>
                    <div className="mobile-topic-stats">
                      <span className="mobile-topic-replies">
                        💬 {topic.reply_count} replies
                      </span>
                      <span className="mobile-topic-date">
                        {new Date(topic.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="mobile-topic-arrow">→</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Forum Categories */}
        <section className="mobile-forum-categories">
          <h2 className="mobile-section-title">Categories</h2>
          <div className="mobile-forums-list">
            {forums.map((forum) => (
              <Link
                key={forum.id}
                to={`/forum/${forum.id}`}
                className="mobile-forum-card"
              >
                <div className="mobile-forum-icon">📁</div>
                <div className="mobile-forum-content">
                  <h3 className="mobile-forum-name">{forum.name}</h3>
                  <p className="mobile-forum-description">{forum.description}</p>
                  <div className="mobile-forum-stats">
                    <span className="mobile-forum-topics">
                      📝 {forum.topic_count} topics
                    </span>
                    <span className="mobile-forum-posts">
                      💬 {forum.post_count} posts
                    </span>
                  </div>
                  {forum.last_post_title && (
                    <div className="mobile-forum-last-post">
                      <span className="mobile-last-post-title">
                        Latest: {forum.last_post_title}
                      </span>
                      <span className="mobile-last-post-author">
                        by {forum.last_post_author}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mobile-forum-arrow">→</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Community Stats */}
        <section className="mobile-forum-stats">
          <h2 className="mobile-section-title">Community Activity</h2>
          <div className="mobile-stats-grid">
            <div className="mobile-stat-item">
              <div className="mobile-stat-number">
                {forums.reduce((sum, forum) => sum + forum.topic_count, 0)}
              </div>
              <div className="mobile-stat-label">Total Topics</div>
            </div>
            <div className="mobile-stat-item">
              <div className="mobile-stat-number">
                {forums.reduce((sum, forum) => sum + forum.post_count, 0)}
              </div>
              <div className="mobile-stat-label">Total Posts</div>
            </div>
            <div className="mobile-stat-item">
              <div className="mobile-stat-number">{forums.length}</div>
              <div className="mobile-stat-label">Categories</div>
            </div>
          </div>
        </section>

        {!user && (
          <div className="mobile-forum-cta">
            <div className="mobile-cta-content">
              <h3>Join the Community</h3>
              <p>Create an account to participate in discussions</p>
              <div className="mobile-cta-buttons">
                <Link to="/register" className="mobile-btn mobile-btn-primary">
                  Sign Up
                </Link>
                <Link to="/login" className="mobile-btn mobile-btn-secondary">
                  Login
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileForumPage;
