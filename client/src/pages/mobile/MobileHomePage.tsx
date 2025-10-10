import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFeatures } from '../../context/FeatureContext';
import { DISCORD_INVITE_URL } from '../../config/appConfig';
import api from '../../services/api';
import TopicCard from '../../components/forum/TopicCard';
import './MobileHomePage.css';

interface Stats {
  totalUsers: number;
  onlineUsers: number;
  totalPosts: number;
  totalDonations: number;
}

interface RecentPost {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  created_at: string;
  slug: string;
}

interface Server {
  id: number;
  name: string;
  description: string;
  status: 'online' | 'offline';
  players_online: number;
  max_players: number;
  version: string;
}

interface ForumTopic {
  id: number;
  title: string;
  slug: string;
  author: string;
  reply_count: number;
  created_at: string;
  forum_name: string;
}

const MobileHomePage: React.FC = () => {
  const { user } = useAuth();
  const { flags } = useFeatures();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [forumTopics, setForumTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requests = [
          api.get('/stats'),
          api.get('/blog/posts?limit=3')
        ];

        if (flags.servers) {
          requests.push(api.get('/servers'));
        }

        if (flags.forum) {
          requests.push(api.get('/forum/recent-topics?limit=3'));
        }

        const responses = await Promise.all(requests);
        
        setStats(responses[0].data);
        setRecentPosts(responses[1].data.posts || []);
        
        let responseIndex = 2;
        if (flags.servers) {
          setServers(responses[responseIndex].data || []);
          responseIndex++;
        }
        
        if (flags.forum) {
          setForumTopics(responses[responseIndex].data || []);
        }
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [flags.servers, flags.forum]);

  if (loading) {
    return (
      <div className="mobile-content">
        <div className="mobile-loading">
          <div className="mobile-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-content">
      <div className="mobile-home">
        {/* Hero Section */}
        <section className="mobile-hero">
          <div className="mobile-hero-background"></div>
          <div className="mobile-hero-content">
            <h1 className="mobile-hero-title">
              Join the Ultimate <span className="mobile-gradient-text">Minecraft Community</span>
            </h1>
            <p className="mobile-hero-subtitle">
              Connect with players, share adventures, and experience modded excellence
            </p>
            <div className="mobile-hero-actions">
              {!user ? (
                <>
                  <Link to="/register" className="mobile-btn mobile-btn-primary">
                    Get Started
                  </Link>
                  <a
                    href={DISCORD_INVITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mobile-btn mobile-btn-secondary"
                  >
                    💬 Discord
                  </a>
                </>
              ) : (
                <>
                  <span className="mobile-welcome-back">
                    Welcome back, <strong>{user.username}</strong>! 👋
                  </span>
                  {flags.servers && (
                    <Link to="/servers" className="mobile-btn mobile-btn-primary">
                      Join Servers
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        {stats && (
          <section className="mobile-stats">
            <div className="mobile-stats-grid">
              <div className="mobile-stat-card">
                <div className="mobile-stat-icon">👥</div>
                <div className="mobile-stat-number">{stats.totalUsers.toLocaleString()}</div>
                <div className="mobile-stat-label">Members</div>
              </div>
              <div className="mobile-stat-card">
                <div className="mobile-stat-icon">🟢</div>
                <div className="mobile-stat-number">{stats.onlineUsers}</div>
                <div className="mobile-stat-label">Online</div>
              </div>
              {flags.forum && (
                <div className="mobile-stat-card">
                  <div className="mobile-stat-icon">💬</div>
                  <div className="mobile-stat-number">{stats.totalPosts.toLocaleString()}</div>
                  <div className="mobile-stat-label">Posts</div>
                </div>
              )}
              <div className="mobile-stat-card">
                <div className="mobile-stat-icon">💝</div>
                <div className="mobile-stat-number">${stats.totalDonations.toLocaleString()}</div>
                <div className="mobile-stat-label">Donated</div>
              </div>
            </div>
          </section>
        )}

        {/* Game Servers */}
        {flags.servers && servers.length > 0 && (
          <section className="mobile-servers">
            <div className="mobile-section-header">
              <h2 className="mobile-section-title">Game Servers</h2>
              <Link to="/servers" className="mobile-section-link">View All</Link>
            </div>
            <div className="mobile-servers-list">
              {servers.slice(0, 3).map((server) => (
                <Link
                  key={server.id}
                  to={`/servers/${server.id}`}
                  className="mobile-server-card"
                >
                  <div className="mobile-server-status">
                    <div className={`mobile-status-dot ${server.status}`}></div>
                    <span className="mobile-status-text">
                      {server.status === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="mobile-server-content">
                    <h3 className="mobile-server-name">{server.name}</h3>
                    <p className="mobile-server-description">{server.description}</p>
                    <div className="mobile-server-info">
                      <span className="mobile-server-players">
                        👥 {server.players_online}/{server.max_players}
                      </span>
                      <span className="mobile-server-version">
                        📦 {server.version}
                      </span>
                    </div>
                  </div>
                  <div className="mobile-server-arrow">→</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className="mobile-features">
          <h2 className="mobile-section-title">Why Choose Vonix Network?</h2>
          <div className="mobile-features-grid">
            <div className="mobile-feature-card">
              <div className="mobile-feature-icon">🎯</div>
              <h3 className="mobile-feature-title">Modded Excellence</h3>
              <p className="mobile-feature-description">
                Curated modpacks with optimized performance and cutting-edge gameplay
              </p>
            </div>
            <div className="mobile-feature-card">
              <div className="mobile-feature-icon">🗺️</div>
              <h3 className="mobile-feature-title">Interactive Maps</h3>
              <p className="mobile-feature-description">
                Explore with Bluemap integration for immersive 3D visualization
              </p>
            </div>
            <div className="mobile-feature-card">
              <div className="mobile-feature-icon">⚡</div>
              <h3 className="mobile-feature-title">Active Community</h3>
              <p className="mobile-feature-description">
                Join hundreds of players with live Discord integration
              </p>
            </div>
            <div className="mobile-feature-card">
              <div className="mobile-feature-icon">🛡️</div>
              <h3 className="mobile-feature-title">Secure & Reliable</h3>
              <p className="mobile-feature-description">
                99.9% uptime with professional management and regular backups
              </p>
            </div>
          </div>
        </section>

        {/* Recent Forum Topics */}
        {flags.forum && forumTopics.length > 0 && (
          <section className="mobile-forum-topics">
            <div className="mobile-section-header">
              <h2 className="mobile-section-title">Recent Discussions</h2>
              <Link to="/forum" className="mobile-section-link">View Forum</Link>
            </div>
            <div className="mobile-topics-list">
              {forumTopics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  showForum={false}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recent Blog Posts */}
        {recentPosts.length > 0 && (
          <section className="mobile-recent-posts">
            <div className="mobile-section-header">
              <h2 className="mobile-section-title">Latest News</h2>
              <Link to="/blog" className="mobile-section-link">View All</Link>
            </div>
            <div className="mobile-posts-list">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="mobile-post-card"
                >
                  <div className="mobile-post-content">
                    <h3 className="mobile-post-title">{post.title}</h3>
                    <p className="mobile-post-excerpt">{post.excerpt}</p>
                    <div className="mobile-post-meta">
                      <span className="mobile-post-author">By {post.author}</span>
                      <span className="mobile-post-date">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="mobile-post-arrow">→</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Donation Ranks Showcase */}
        <section className="mobile-ranks-showcase">
          <div className="mobile-section-header">
            <h2 className="mobile-section-title">Support & Get Perks</h2>
            <Link to="/ranks" className="mobile-section-link">View All</Link>
          </div>
          <div className="mobile-ranks-preview">
            <div className="mobile-rank-card supporter">
              <div className="mobile-rank-icon">🌟</div>
              <h3 className="mobile-rank-name">Supporter</h3>
              <p className="mobile-rank-price">$5/month</p>
              <p className="mobile-rank-description">Basic perks & green name</p>
            </div>
            <div className="mobile-rank-card patron">
              <div className="mobile-rank-icon">💎</div>
              <h3 className="mobile-rank-name">Patron</h3>
              <p className="mobile-rank-price">$10/month</p>
              <p className="mobile-rank-description">Enhanced perks & /fly</p>
            </div>
            <div className="mobile-rank-card champion">
              <div className="mobile-rank-icon">👑</div>
              <h3 className="mobile-rank-name">Champion</h3>
              <p className="mobile-rank-price">$15/month</p>
              <p className="mobile-rank-description">Premium perks & /nick</p>
            </div>
          </div>
          <Link to="/donations" className="mobile-support-btn">
            💝 Support the Community
          </Link>
        </section>

        {/* User-specific sections */}
        {user && (
          <section className="mobile-user-section">
            <h2 className="mobile-section-title">Your Dashboard</h2>
            <div className="mobile-activity-grid">
              <Link to="/profile" className="mobile-activity-card">
                <div className="mobile-activity-icon">👤</div>
                <div className="mobile-activity-content">
                  <h3>Profile</h3>
                  <p>Manage your account</p>
                </div>
              </Link>
              
              {flags.messages && (
                <Link to="/messages" className="mobile-activity-card">
                  <div className="mobile-activity-icon">💌</div>
                  <div className="mobile-activity-content">
                    <h3>Messages</h3>
                    <p>Check your inbox</p>
                  </div>
                </Link>
              )}
              
              {flags.social && (
                <Link to="/social" className="mobile-activity-card">
                  <div className="mobile-activity-icon">👥</div>
                  <div className="mobile-activity-content">
                    <h3>Social</h3>
                    <p>Connect with friends</p>
                  </div>
                </Link>
              )}

              <Link to="/leaderboard" className="mobile-activity-card">
                <div className="mobile-activity-icon">🏆</div>
                <div className="mobile-activity-content">
                  <h3>Leaderboard</h3>
                  <p>View top players</p>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* Call to Action */}
        {!user && (
          <section className="mobile-cta">
            <div className="mobile-cta-content">
              <h2 className="mobile-cta-title">Ready to Join?</h2>
              <p className="mobile-cta-description">
                Create your account and become part of our amazing community
              </p>
              <div className="mobile-cta-buttons">
                <Link to="/register" className="mobile-btn mobile-btn-primary">
                  Sign Up Now
                </Link>
                <a
                  href={DISCORD_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-btn mobile-btn-secondary"
                >
                  Join Discord
                </a>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default MobileHomePage;
