import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ForumCard from '../../components/forum/ForumCard';
import TopicCard from '../../components/forum/TopicCard';
import './MobileForumPage.css';

interface Forum {
  id: number;
  name: string;
  description: string;
  topic_count: number;
  post_count: number;
  locked: number;
  last_post_title?: string;
  last_post_author?: string;
  last_post_created_at?: string;
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
        console.log('📱 Fetching mobile forum data...');
        
        const [forumsRes, topicsRes] = await Promise.all([
          api.get('/forum/mobile'),
          api.get('/forum/recent-topics?limit=5')
        ]);
        
        console.log('📱 Forums response:', forumsRes.data);
        console.log('📱 Topics response:', topicsRes.data);
        
        setForums(forumsRes.data || []);
        setRecentTopics(topicsRes.data || []);
      } catch (error: any) {
        console.error('Error fetching forum data:', error);
        console.error('Error details:', error.response?.data || error.message);
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
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  showForum={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* Forum Categories */}
        <section className="mobile-forum-categories">
          <h2 className="mobile-section-title">Categories</h2>
          <div className="mobile-forums-list">
            {forums.length > 0 ? (
              forums.map((forum) => (
                <ForumCard
                  key={forum.id}
                  forum={forum}
                  showStats={true}
                  showLastPost={true}
                />
              ))
            ) : (
              <div className="mobile-no-forums">
                <div className="mobile-no-content-icon">📭</div>
                <h3>No Forums Available</h3>
                <p>Forum categories are being set up. Check back soon!</p>
              </div>
            )}
          </div>
        </section>

        {/* Community Stats */}
        <section className="mobile-forum-stats">
          <h2 className="mobile-section-title">Community Activity</h2>
          <div className="mobile-stats-grid">
            <div className="mobile-stat-item">
              <div className="mobile-stat-number">
                {forums.reduce((sum, forum) => sum + (forum.topic_count || 0), 0)}
              </div>
              <div className="mobile-stat-label">Total Topics</div>
            </div>
            <div className="mobile-stat-item">
              <div className="mobile-stat-number">
                {forums.reduce((sum, forum) => sum + (forum.post_count || 0), 0)}
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
