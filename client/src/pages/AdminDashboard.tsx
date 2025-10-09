import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import AdminDiscordPage from './AdminDiscordPage';
import AdminFeaturesPage from './AdminFeaturesPage';
import AdminRegistrationPage from './AdminRegistrationPage';
import AdminEmailPage from './AdminEmailPage';
import AdminAnalyticsPage from './AdminAnalyticsPage';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from '../components/ChangePasswordModal';
import api from '../services/api';
import './AdminDashboard.css';

// Removed AdminQuickActions component - using mobile sidebar instead

interface Server {
  id: number;
  name: string;
  description: string;
  ip_address: string;
  port: number;
  modpack_name: string;
  bluemap_url: string;
  curseforge_url: string;
  order_index: number;
  status?: string;
  players_online?: number;
  players_max?: number;
  version?: string;
}

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="admin-dashboard">
      {/* Admin Mobile Menu Button */}
      <button 
        className="admin-mobile-menu-button" 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle admin menu"
      >
        <span className="admin-hamburger-icon">
          {mobileMenuOpen ? '✕' : '☰'}
        </span>
      </button>

      {/* Admin Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="admin-mobile-overlay" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <h2 className="admin-sidebar-title">⚙️ Admin Panel</h2>
        </div>
        <nav className="admin-nav">
          <Link
            to="/admin"
            className={`admin-nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
          >
            📊 Overview
          </Link>
          <Link
            to="/admin/servers"
            className={`admin-nav-link ${location.pathname.includes('/admin/servers') ? 'active' : ''}`}
          >
            🎮 Manage Servers
          </Link>
          <Link
            to="/admin/blog"
            className={`admin-nav-link ${location.pathname.includes('/admin/blog') ? 'active' : ''}`}
          >
            📝 Blog Posts
          </Link>
          <Link
            to="/admin/users"
            className={`admin-nav-link ${location.pathname.includes('/admin/users') ? 'active' : ''}`}
          >
            👥 Users
          </Link>
          <Link
            to="/admin/donations"
            className={`admin-nav-link ${location.pathname.includes('/admin/donations') ? 'active' : ''}`}
          >
            💖 Donations
          </Link>
          <Link
            to="/admin/ranks"
            className={`admin-nav-link ${location.pathname.includes('/admin/ranks') ? 'active' : ''}`}
          >
            💎 Ranks
          </Link>
          <Link
            to="/admin/forums"
            className={`admin-nav-link ${location.pathname.includes('/admin/forums') ? 'active' : ''}`}
          >
            💬 Forum Management
          </Link>
          <Link
            to="/admin/moderation"
            className={`admin-nav-link ${location.pathname.includes('/admin/moderation') ? 'active' : ''}`}
          >
            🛡️ Forum Moderation
          </Link>
          <Link
            to="/admin/discord"
            className={`admin-nav-link ${location.pathname.includes('/admin/discord') ? 'active' : ''}`}
          >
            🤖 Discord Bot
          </Link>
          <Link
            to="/admin/registration"
            className={`admin-nav-link ${location.pathname.includes('/admin/registration') ? 'active' : ''}`}
          >
            🔐 Registration
          </Link>
          <Link
            to="/admin/features"
            className={`admin-nav-link ${location.pathname.includes('/admin/features') ? 'active' : ''}`}
          >
            🧰 Site Features
          </Link>
          <Link
            to="/admin/email"
            className={`admin-nav-link ${location.pathname.includes('/admin/email') ? 'active' : ''}`}
          >
            📧 Email Settings
          </Link>
          <Link
            to="/admin/analytics"
            className={`admin-nav-link ${location.pathname.includes('/admin/analytics') ? 'active' : ''}`}
          >
            📊 Analytics
          </Link>
        </nav>
      </div>

      <div className="admin-content">
        <Routes>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="/servers" element={<ManageServers />} />
          <Route path="/blog" element={<ManageBlog />} />
          <Route path="/users" element={<ManageUsers />} />
          <Route path="/donations" element={<ManageDonations />} />
          <Route path="/ranks" element={<ManageRanks />} />
          <Route path="/forums" element={<ManageForums />} />
          <Route path="/moderation" element={<ForumModeration />} />
          <Route path="/discord" element={<AdminDiscordPage />} />
          <Route path="/registration" element={<AdminRegistrationPage />} />
          <Route path="/features" element={<AdminFeaturesPage />} />
          <Route path="/email" element={<AdminEmailPage />} />
          <Route path="/analytics" element={<AdminAnalyticsPage />} />
        </Routes>
      </div>
    </div>
  );
}

const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [servers, setServers] = useState<Server[]>([]);
  const [clearingChat, setClearingChat] = useState(false);
  const [scriptLoading, setScriptLoading] = useState<{[key: string]: boolean}>({});
  const [systemStats, setSystemStats] = useState<any>(null);

  useEffect(() => {
    loadServers();
    loadSystemStats();
  }, []);

  const loadServers = async () => {
    try {
      const response = await api.get('/servers');
      setServers(response.data);
    } catch (error) {
      console.error('Error loading servers:', error);
    }
  };

  const loadSystemStats = async () => {
    try {
      const response = await api.get('/admin/scripts/status');
      setSystemStats(response.data);
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const handleClearOldChatMessages = async () => {
    if (!window.confirm('Are you sure you want to clear all chat messages except the newest 20? This cannot be undone.')) {
      return;
    }

    setClearingChat(true);
    try {
      const response = await api.delete('/chat/messages/clear-old');
      alert(response.data.message);
    } catch (error: any) {
      console.error('Error clearing chat messages:', error);
      alert(error.response?.data?.error || 'Failed to clear old messages');
    } finally {
      setClearingChat(false);
    }
  };

  const executeScript = async (scriptName: string, confirmMessage: string) => {
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setScriptLoading(prev => ({ ...prev, [scriptName]: true }));
    try {
      const response = await api.post(`/admin/scripts/${scriptName}`);
      alert(response.data.message);
      // Refresh system stats after script execution
      loadSystemStats();
    } catch (error: any) {
      console.error(`Error executing ${scriptName}:`, error);
      alert(error.response?.data?.error || `Failed to execute ${scriptName}`);
    } finally {
      setScriptLoading(prev => ({ ...prev, [scriptName]: false }));
    }
  };

  const handleRefreshUserStats = () => {
    executeScript('refresh-user-stats', 'This will recalculate all user activity statistics. This may take a few moments. Continue?');
  };

  const handleCleanupForumData = () => {
    executeScript('cleanup-forum-data', 'This will clean up orphaned forum data and update forum counts. Continue?');
  };

  const handleRecalculateReputation = () => {
    executeScript('recalculate-reputation', 'This will recalculate all user reputation scores from the reputation log. Continue?');
  };

  const handleOptimizeDatabase = () => {
    executeScript('optimize-database', 'This will optimize the database by running VACUUM and ANALYZE operations. Continue?');
  };

  return (
    <div className="dashboard-overview">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Welcome back, {user?.username}! 👋</h1>
          <p className="dashboard-subtitle">Manage your Vonix.Network community platform</p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">🎮</div>
          <div className="stat-content">
            <div className="stat-value">{servers.length}</div>
            <div className="stat-label">Total Servers</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <div className="stat-value">
              {servers.filter(s => s.status === 'online').length}
            </div>
            <div className="stat-label">Online Servers</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">
              {servers.reduce((sum, s) => sum + (s.players_online || 0), 0)}
            </div>
            <div className="stat-label">Total Players</div>
          </div>
        </div>

        {systemStats && (
          <>
            <div className="stat-card">
              <div className="stat-icon">👤</div>
              <div className="stat-content">
                <div className="stat-value">{systemStats.stats?.users || 0}</div>
                <div className="stat-label">Total Users</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💬</div>
              <div className="stat-content">
                <div className="stat-value">{systemStats.stats?.forumPosts || 0}</div>
                <div className="stat-label">Forum Posts</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💾</div>
              <div className="stat-content">
                <div className="stat-value">{systemStats.database?.sizeFormatted || 'N/A'}</div>
                <div className="stat-label">Database Size</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="dashboard-quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          <a href="https://mintservers.com/dashboard" className="action-card" target="_blank" rel="noopener noreferrer">
            <div className="action-icon">
              <img src="https://mintservers.com/brand/icon.svg" alt="MintServers" style={{ width: 28, height: 28 }} />
            </div>
            <div className="action-title">Open MintServers</div>
            <div className="action-description">Provision or manage hosting</div>
          </a>
          <Link to="/admin/servers" className="action-card">
            <div className="action-icon">➕</div>
            <div className="action-title">Add New Server</div>
            <div className="action-description">Create a new Minecraft server entry</div>
          </Link>

          <button className="action-card" onClick={() => setShowPasswordModal(true)}>
            <div className="action-icon">🔒</div>
            <div className="action-title">Change Password</div>
            <div className="action-description">Update your admin password</div>
          </button>

          <Link to="/" className="action-card">
            <div className="action-icon">🏠</div>
            <div className="action-title">View Website</div>
            <div className="action-description">See how your site looks to users</div>
          </Link>

          <button 
            className="action-card" 
            onClick={handleClearOldChatMessages}
            disabled={clearingChat}
          >
            <div className="action-icon">💬</div>
            <div className="action-title">Clear Old Chat</div>
            <div className="action-description">
              {clearingChat ? 'Clearing...' : 'Delete all but newest 20 messages'}
            </div>
          </button>

          {/* Script Execution Actions */}
          <button 
            className="action-card" 
            onClick={handleRefreshUserStats}
            disabled={scriptLoading['refresh-user-stats']}
          >
            <div className="action-icon">📊</div>
            <div className="action-title">Refresh User Stats</div>
            <div className="action-description">
              {scriptLoading['refresh-user-stats'] ? 'Refreshing...' : 'Recalculate all user activity statistics'}
            </div>
          </button>

          <button 
            className="action-card" 
            onClick={handleCleanupForumData}
            disabled={scriptLoading['cleanup-forum-data']}
          >
            <div className="action-icon">🧹</div>
            <div className="action-title">Cleanup Forum Data</div>
            <div className="action-description">
              {scriptLoading['cleanup-forum-data'] ? 'Cleaning...' : 'Remove orphaned data and fix counts'}
            </div>
          </button>

          <button 
            className="action-card" 
            onClick={handleRecalculateReputation}
            disabled={scriptLoading['recalculate-reputation']}
          >
            <div className="action-icon">⭐</div>
            <div className="action-title">Recalculate Reputation</div>
            <div className="action-description">
              {scriptLoading['recalculate-reputation'] ? 'Calculating...' : 'Rebuild all user reputation scores'}
            </div>
          </button>

          <button 
            className="action-card" 
            onClick={handleOptimizeDatabase}
            disabled={scriptLoading['optimize-database']}
          >
            <div className="action-icon">🚀</div>
            <div className="action-title">Optimize Database</div>
            <div className="action-description">
              {scriptLoading['optimize-database'] ? 'Optimizing...' : 'Run database maintenance operations'}
            </div>
          </button>

          {/* Admin Sidebar Items surfaced for mobile */}
          <Link to="/admin" className="action-card">
            <div className="action-icon">📊</div>
            <div className="action-title">Overview</div>
            <div className="action-description">Admin dashboard overview</div>
          </Link>

          <Link to="/admin/servers" className="action-card">
            <div className="action-icon">🎮</div>
            <div className="action-title">Manage Servers</div>
            <div className="action-description">View and manage servers</div>
          </Link>

          <Link to="/admin/blog" className="action-card">
            <div className="action-icon">📝</div>
            <div className="action-title">Blog Posts</div>
            <div className="action-description">Create and edit posts</div>
          </Link>

          <Link to="/admin/users" className="action-card">
            <div className="action-icon">👥</div>
            <div className="action-title">Users</div>
            <div className="action-description">Manage admin accounts</div>
          </Link>

          <Link to="/admin/donations" className="action-card">
            <div className="action-icon">💖</div>
            <div className="action-title">Donations</div>
            <div className="action-description">Review donations</div>
          </Link>
        </div>
      </div>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
};

const ManageServers: React.FC = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      const response = await api.get('/servers');
      setServers(response.data);
    } catch (error) {
      console.error('Error loading servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    // eslint-disable-next-line no-restricted-globals
    if (!window.confirm('Are you sure you want to delete this server?')) {
      return;
    }

    try {
      await api.delete(`/servers/${id}`);
      setServers(servers.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting server:', error);
      alert('Failed to delete server');
    }
  };

  const handleEdit = (server: Server) => {
    setEditingServer(server);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingServer(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingServer(null);
    loadServers();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading servers...</p>
      </div>
    );
  }

  return (
    <div className="manage-servers">
      <div className="manage-servers-header">
        <h1 className="dashboard-title">Manage Servers</h1>
        <button className="btn btn-primary" onClick={handleAdd}>
          ➕ Add Server
        </button>
      </div>

      {servers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎮</div>
          <h3>No Servers Yet</h3>
          <p>Add your first server to get started</p>
          <button className="btn btn-primary" onClick={handleAdd}>
            Add Server
          </button>
        </div>
      ) : (
        <div className="servers-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>IP Address</th>
                <th>Modpack</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {servers.map(server => (
                <tr key={server.id}>
                  <td>
                    <strong>{server.name}</strong>
                  </td>
                  <td>
                    <code>{server.ip_address}:{server.port}</code>
                  </td>
                  <td>{server.modpack_name || '-'}</td>
                  <td>
                    <span className={`badge ${server.status === 'online' ? 'badge-success' : 'badge-error'}`}>
                      <span className="status-indicator">{server.status === 'online' ? '🟢' : '🔴'}</span>
                      <span className="status-text">{server.status === 'online' ? 'Online' : 'Offline'}</span>
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEdit(server)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(server.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ServerForm
          server={editingServer}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

interface ServerFormProps {
  server: Server | null;
  onClose: () => void;
}

const ServerForm: React.FC<ServerFormProps> = ({ server, onClose }) => {
  const [formData, setFormData] = useState({
    name: server?.name || '',
    description: server?.description || '',
    ip_address: server?.ip_address || '',
    port: server?.port || 25565,
    modpack_name: server?.modpack_name || '',
    bluemap_url: server?.bluemap_url || '',
    curseforge_url: server?.curseforge_url || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (server) {
        await api.put(`/servers/${server.id}`, formData);
      } else {
        await api.post('/servers', formData);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save server');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value) || 25565 : value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content server-form-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {server ? '✏️ Edit Server' : '➕ Add Server'}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Server Name *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="My Awesome Server"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Modpack Name</label>
              <input
                type="text"
                name="modpack_name"
                className="form-input"
                value={formData.modpack_name}
                onChange={handleChange}
                placeholder="BMC5 by LunaPixel Studios"
              />
            </div>

            <div className="form-group">
              <label className="form-label">IP Address *</label>
              <input
                type="text"
                name="ip_address"
                className="form-input"
                value={formData.ip_address}
                onChange={handleChange}
                required
                placeholder="play.vonix.network"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Port</label>
              <input
                type="number"
                name="port"
                className="form-input"
                value={formData.port}
                onChange={handleChange}
                placeholder="25565"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your server..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bluemap URL</label>
            <input
              type="url"
              name="bluemap_url"
              className="form-input"
              value={formData.bluemap_url}
              onChange={handleChange}
              placeholder="https://map.vonix.network"
            />
            <small className="form-hint">Leave empty if not configured</small>
          </div>

          <div className="form-group">
            <label className="form-label">CurseForge URL</label>
            <input
              type="url"
              name="curseforge_url"
              className="form-input"
              value={formData.curseforge_url}
              onChange={handleChange}
              placeholder="https://www.curseforge.com/minecraft/modpacks/..."
            />
            <small className="form-hint">Link to download the modpack</small>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : server ? 'Update Server' : 'Add Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Blog Management Component
const ManageBlog: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/blog');
      setPosts(response.data);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    // eslint-disable-next-line no-restricted-globals
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await api.delete(`/blog/${id}`);
      loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="manage-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">
            <span className="title-icon">📝</span>
            <span className="title-text">Blog Posts</span>
          </h1>
          <p className="section-subtitle">Create and manage blog posts</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingPost(null);
            setShowModal(true);
          }}
        >
          ➕ New Post
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No Blog Posts Yet</h3>
          <p>Create your first blog post to get started!</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <strong>{post.title}</strong>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      /{post.slug}
                    </div>
                  </td>
                  <td>{post.author_name || 'Unknown'}</td>
                  <td>
                    <span className={`badge ${post.published ? 'badge-success' : 'badge-warning'}`}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>{formatDate(post.created_at)}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setEditingPost(post);
                          setShowModal(true);
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(post.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <BlogPostModal
          post={editingPost}
          onClose={() => {
            setShowModal(false);
            setEditingPost(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingPost(null);
            loadPosts();
          }}
        />
      )}
    </div>
  );
};

// Blog Post Modal
const BlogPostModal: React.FC<{
  post: any;
  onClose: () => void;
  onSave: () => void;
}> = ({ post, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: post?.title || '',
    slug: post?.slug || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    published: post?.published || false,
    featured_image: post?.featured_image || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-generate slug from title
    if (name === 'title' && !post) {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    if (!formData.title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }

    if (!formData.slug.trim()) {
      setError('Slug is required');
      setLoading(false);
      return;
    }

    if (!formData.content.trim()) {
      setError('Content is required');
      setLoading(false);
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(formData.slug)) {
      setError('Slug must be lowercase letters, numbers, and hyphens only (e.g., "my-blog-post")');
      setLoading(false);
      return;
    }

    // Prepare data for submission - ensure no undefined values
    const submitData = {
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      excerpt: formData.excerpt.trim() || null,
      content: formData.content.trim(),
      published: Boolean(formData.published),
      featured_image: formData.featured_image.trim() || null
    };

    try {
      console.log('=== BLOG POST DEBUG ===');
      console.log('Sending blog post data:', submitData);
      console.log('API endpoint:', post ? `/blog/${post.id}` : '/blog');
      console.log('Method:', post ? 'PUT' : 'POST');
      
      let response;
      if (post) {
        response = await api.put(`/blog/${post.id}`, submitData);
      } else {
        response = await api.post('/blog', submitData);
      }
      
      console.log('Success response:', response);
      onSave();
    } catch (err: any) {
      console.log('=== BLOG POST ERROR DEBUG ===');
      console.error('Full error object:', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error response status:', err.response?.status);
      console.error('Error response headers:', err.response?.headers);
      console.error('Error config:', err.config);
      
      // Show the actual server error message
      let errorMessage = 'Failed to save post';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
          
          // If there are validation details, show them
          if (err.response.data.details && Array.isArray(err.response.data.details)) {
            const details = err.response.data.details.map((detail: any) => {
              if (typeof detail === 'string') return detail;
              if (detail.message) return detail.message;
              if (detail.msg) return detail.msg;
              return JSON.stringify(detail);
            }).join(', ');
            errorMessage += `: ${details}`;
          }
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.details) {
          if (Array.isArray(err.response.data.details)) {
            errorMessage = err.response.data.details.join(', ');
          } else {
            errorMessage = err.response.data.details;
          }
        } else {
          errorMessage = JSON.stringify(err.response.data);
        }
      } else {
        errorMessage = `Server error (${err.response?.status || 'unknown'}): ${err.message}`;
      }
      
      console.log('Final error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{post ? 'Edit Blog Post' : 'New Blog Post'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter post title"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Slug (URL) *</label>
            <input
              type="text"
              name="slug"
              className="form-input"
              value={formData.slug}
              onChange={handleChange}
              required
              placeholder="url-friendly-slug"
            />
            <small className="form-hint">Used in the URL: /blog/{formData.slug}</small>
          </div>

          <div className="form-group">
            <label className="form-label">Excerpt</label>
            <textarea
              name="excerpt"
              className="form-textarea"
              value={formData.excerpt}
              onChange={handleChange}
              placeholder="Short summary shown on blog list"
              rows={2}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Content *</label>
            <textarea
              name="content"
              className="form-textarea"
              value={formData.content}
              onChange={handleChange}
              required
              placeholder="Full blog post content (HTML supported)"
              rows={12}
            />
            <small className="form-hint">HTML is supported. You can use tags like &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;img&gt;, etc.</small>
          </div>

          <div className="form-group">
            <label className="form-label">Featured Image URL</label>
            <input
              type="url"
              name="featured_image"
              className="form-input"
              value={formData.featured_image}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <div className="form-group">
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
              />
              <span>Publish immediately</span>
            </label>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : post ? 'Update Post' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// User Management Component
const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: number) => {
    // eslint-disable-next-line no-restricted-globals
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/users/${userId}`);
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="manage-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">
            <span className="title-icon">👥</span>
            <span className="title-text">User Management</span>
          </h1>
          <p className="section-subtitle">Manage admin accounts</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
        >
          ➕ Add User
        </button>
      </div>

      {!loading && error && (
        <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.username}</strong></td>
                  <td>
                    <span className="badge badge-primary">{user.role}</span>
                  </td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setEditingUser(user);
                          setShowModal(true);
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(user.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingUser(null);
            loadUsers();
          }}
        />
      )}
    </div>
  );
};

// User Modal
const UserModal: React.FC<{
  user: any;
  onClose: () => void;
  onSave: () => void;
}> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: '',
    role: user?.role || 'user',
    minecraft_username: user?.minecraft_username || '',
    minecraft_uuid: user?.minecraft_uuid || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: any = { username: formData.username, role: formData.role };
      if (formData.password) {
        payload.password = formData.password;
      }
      if (formData.minecraft_username) {
        payload.minecraft_username = formData.minecraft_username;
      }
      if (formData.minecraft_uuid) {
        payload.minecraft_uuid = formData.minecraft_uuid;
      }

      if (user) {
        await api.put(`/users/${user.id}`, payload);
      } else {
        if (!formData.password) {
          setError('Password is required for new users');
          setLoading(false);
          return;
        }
        await api.post('/users', payload);
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{user ? 'Edit User' : 'Add New User'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Username *</label>
            <input
              type="text"
              name="username"
              className="form-input"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Enter username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Password {user ? '(leave blank to keep current)' : '*'}
            </label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required={!user}
              placeholder={user ? 'Enter new password' : 'Enter password'}
              minLength={6}
            />
            <small className="form-hint">Minimum 6 characters</small>
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              name="role"
              className="form-input"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {!user && (
            <>
              <div className="form-divider">
                <span>Optional: Link Minecraft Account</span>
              </div>

              <div className="form-group">
                <label className="form-label">Minecraft Username</label>
                <input
                  type="text"
                  name="minecraft_username"
                  className="form-input"
                  value={formData.minecraft_username}
                  onChange={handleChange}
                  placeholder="e.g., Steve"
                />
                <small className="form-hint">
                  Leave blank for regular accounts. User can link later via /vonixregister
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Minecraft UUID</label>
                <input
                  type="text"
                  name="minecraft_uuid"
                  className="form-input"
                  value={formData.minecraft_uuid}
                  onChange={handleChange}
                  placeholder="e.g., 069a79f4-44e9-4726-a5be-fca90e38aaf5"
                />
                <small className="form-hint">
                  Find UUID at <a href="https://mcuuid.net/" target="_blank" rel="noopener noreferrer">mcuuid.net</a>
                </small>
              </div>
            </>
          )}

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ========================================
// RANKS MANAGEMENT COMPONENT
// ========================================

const ManageRanks: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'settings' | 'users'>('settings');
  const [ranks, setRanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRank, setEditingRank] = useState<any>(null);

  const loadRanks = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load from API with cache busting
      const response = await api.get(`/donations/ranks?t=${Date.now()}`);
      console.log('🔄 Loaded ranks from API:', response.data);
      console.log('🔍 First rank details:', response.data[0]);
      setRanks(response.data);
      
    } catch (error) {
      console.error('Error loading ranks:', error);
      setRanks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRanks();
  }, [loadRanks]);

  const handleSaveRank = useCallback(async (rankData: any) => {
    try {
      // Extract the editing info from the data
      const { _isEditing, _editingId, ...cleanRankData } = rankData;
      
      if (_isEditing && _editingId) {
        await api.put(`/donations/ranks/${_editingId}`, cleanRankData);
      } else {
        await api.post('/donations/ranks', cleanRankData);
      }
      await loadRanks(); // Wait for reload to complete
      setEditingRank(null);
    } catch (error: any) {
      console.error('Save rank error:', error);
      alert(error.response?.data?.error || 'Failed to save rank');
      throw error; // Re-throw so child component knows it failed
    }
  }, [loadRanks]);

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2 className="section-title">💎 Ranks Management</h2>
        <p className="section-subtitle">Manage donation rank settings and user assignments</p>
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Rank Settings
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 User Management
        </button>
      </div>

      {activeTab === 'settings' && <ManageRankSettings ranks={ranks} loading={loading} onEdit={setEditingRank} onSave={handleSaveRank} onReload={loadRanks} />}
      {activeTab === 'users' && (
        <div>
          <h3>User Management Debug</h3>
          <p>Active tab: {activeTab}</p>
          <ManageDonationRanks />
        </div>
      )}
    </div>
  );
};

const ManageRankSettings: React.FC<{
  ranks: any[];
  loading: boolean;
  onEdit: (rank: any) => void;
  onSave: (rankData: any) => void;
  onReload: () => void;
}> = React.memo(({ ranks, loading, onEdit, onSave, onReload }) => {
  const [editingRank, setEditingRank] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const handleEdit = (rank: any) => {
    setEditingRank(rank);
    setShowModal(true);
  };

  const handleSave = async (rankData: any) => {
    try {
      // Pass the editing rank info along with the form data
      const saveData = {
        ...rankData,
        _isEditing: !!editingRank,
        _editingId: editingRank?.id
      };
      await onSave(saveData);
      setShowModal(false);
      setEditingRank(null);
    } catch (error) {
      console.error('Failed to save rank:', error);
      // Keep modal open on error so user can try again
    }
  };

  if (loading) {
    return <div className="loading-container">Loading ranks...</div>;
  }

  // Debug: Log current state (removed to prevent infinite loop)
  // console.log('ManageRankSettings render - ranks:', ranks, 'length:', ranks.length, 'loading:', loading);

  return (
    <div className="rank-settings">
      <div className="section-header">
        <h3>Donation Rank Configuration</h3>
        <p>Configure rank costs, benefits, and appearance</p>
        <button className="btn btn-secondary" onClick={onReload}>
          🔄 Reload Ranks
        </button>
      </div>

      <div className="ranks-grid">
        {Array.isArray(ranks) && ranks.length > 0 ? ranks.map((rank) => (
          <div key={rank.id} className="rank-card">
            <div className="rank-header">
              <span className="rank-icon">{rank.icon}</span>
              <h4>{rank.name}</h4>
              <span className="rank-cost">${rank.minAmount}/month</span>
            </div>
            <div className="rank-details">
              <p className="rank-subtitle">{rank.subtitle}</p>
              <div className="rank-perks">
                <strong>Community Perks:</strong>
                <ul>
                  {rank.perks && rank.perks.slice(0, 3).map((perk: string, index: number) => (
                    <li key={index}>{perk}</li>
                  ))}
                  {rank.perks && rank.perks.length > 3 && <li>+{rank.perks.length - 3} more...</li>}
                </ul>
              </div>
            </div>
            <div className="rank-actions">
              <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(rank)}>
                ✏️ Edit
              </button>
            </div>
          </div>
        )) : (
          <div className="empty-state">
            <p>No ranks available.</p>
            <p>Debug: Ranks array length: {ranks.length}</p>
            <p>Debug: Loading state: {loading.toString()}</p>
            <p>Debug: Ranks data: {JSON.stringify(ranks.slice(0, 1), null, 2)}</p>
            <button className="btn btn-primary" onClick={onReload}>
              🔄 Reload Ranks
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <RankEditModal
          rank={editingRank}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingRank(null);
          }}
        />
      )}
    </div>
  );
});

const RankEditModal: React.FC<{
  rank: any;
  onSave: (rankData: any) => void;
  onClose: () => void;
}> = ({ rank, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: rank?.name || '',
    minAmount: rank?.minAmount || 5,
    subtitle: rank?.subtitle || '',
    color: rank?.color || '#10b981',
    textColor: rank?.textColor || '#ffffff',
    icon: rank?.icon || '🌟',
    badge: rank?.badge || rank?.name?.substring(0, 3).toUpperCase() || 'NEW',
    glow: rank?.glow || false,
    perks: rank?.perks?.join('\n') || '',
    minecraftPerks: rank?.minecraftPerks?.join('\n') || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({
        id: rank?.id,
        ...formData,
        perks: formData.perks.split('\n').filter((p: string) => p.trim()),
        minecraftPerks: formData.minecraftPerks.split('\n').filter((p: string) => p.trim())
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save rank');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{rank ? 'Edit Rank' : 'Create New Rank'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Rank Name *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                placeholder="Supporter"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Cost ($) *</label>
              <input
                type="number"
                name="minAmount"
                className="form-input"
                value={formData.minAmount}
                onChange={handleChange}
                min="1"
                placeholder="5"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Icon</label>
              <input
                type="text"
                name="icon"
                className="form-input"
                value={formData.icon}
                onChange={handleChange}
                placeholder="🌟"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Badge</label>
              <input
                type="text"
                name="badge"
                className="form-input"
                value={formData.badge}
                onChange={handleChange}
                placeholder="SUP"
                maxLength={3}
              />
              <small className="form-hint">3-letter code</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Background Color</label>
              <input
                type="color"
                name="color"
                className="form-input"
                value={formData.color}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Text Color</label>
              <input
                type="color"
                name="textColor"
                className="form-input"
                value={formData.textColor}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                name="glow"
                checked={formData.glow}
                onChange={handleChange}
                style={{ marginRight: '0.5rem' }}
              />
              Enable Glow Effect
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Subtitle</label>
            <input
              type="text"
              name="subtitle"
              className="form-input"
              value={formData.subtitle}
              onChange={handleChange}
              placeholder="$5 Monthly — Covers basic server costs"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Community Perks</label>
              <textarea
                name="perks"
                className="form-textarea"
                value={formData.perks}
                onChange={handleChange}
                rows={3}
                placeholder="Custom username color&#10;Supporter badge&#10;Priority support"
              />
              <small className="form-hint">One perk per line</small>
            </div>
            <div className="form-group">
              <label className="form-label">Minecraft Perks</label>
              <textarea
                name="minecraftPerks"
                className="form-textarea"
                value={formData.minecraftPerks}
                onChange={handleChange}
                rows={3}
                placeholder="Supporter prefix&#10;/hat command&#10;Priority queue"
              />
              <small className="form-hint">One perk per line</small>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : rank ? 'Update Rank' : 'Create Rank'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ========================================
// FORUM MANAGEMENT COMPONENT
// ========================================

const ManageForums: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'forums' | 'permissions'>('categories');
  const [recalculating, setRecalculating] = useState(false);
  
  const handleRecalculateStats = async () => {
    if (!window.confirm('Recalculate all forum statistics? This will fix post/topic counts.')) return;
    setRecalculating(true);
    try {
      const response = await api.post('/forum-admin/bulk/recalculate-stats');
      alert(response.data.message + `\nForums: ${response.data.forumsUpdated}\nTopics: ${response.data.topicsUpdated}`);
      window.location.reload();
    } catch (error) {
      alert('Failed to recalculate statistics');
    } finally {
      setRecalculating(false);
    }
  };
  
  return (
    <div className="manage-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">
            <span className="title-icon">💬</span>
            <span className="title-text">Forum Management</span>
          </h1>
          <p className="section-subtitle">Manage categories, forums, and permissions</p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={handleRecalculateStats}
          disabled={recalculating}
          title="Recalculate all forum statistics (fixes post/topic counts)"
        >
          {recalculating ? '⏳ Recalculating...' : '🔄 Recalculate Stats'}
        </button>
      </div>

      <div className="tabs-container" style={{ marginBottom: '2rem' }}>
        <button
          className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          📁 Categories
        </button>
        <button
          className={`tab-button ${activeTab === 'forums' ? 'active' : ''}`}
          onClick={() => setActiveTab('forums')}
        >
          💬 Forums
        </button>
        <button
          className={`tab-button ${activeTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          🔒 Permissions
        </button>
      </div>

      {activeTab === 'categories' && <ManageCategories />}
      {activeTab === 'forums' && <ManageForumsTab />}
      {activeTab === 'permissions' && <ManagePermissions />}
    </div>
  );
};

const ManageCategories: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/forum-admin/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure? This will fail if the category has forums.')) return;
    try {
      await api.delete(`/forum-admin/categories/${id}`);
      loadCategories();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete category');
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={() => { setEditingCategory(null); setShowModal(true); }}>
          ➕ Add Category
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Order</th>
              <th>Forums</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td><strong>{cat.name}</strong></td>
                <td>{cat.description || '-'}</td>
                <td>{cat.order_index}</td>
                <td>{cat.forums_count}</td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-sm btn-secondary" onClick={() => { setEditingCategory(cat); setShowModal(true); }}>✏️ Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(cat.id)}>🗑️ Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => { setShowModal(false); setEditingCategory(null); }}
          onSave={() => { setShowModal(false); setEditingCategory(null); loadCategories(); }}
        />
      )}
    </>
  );
};

const CategoryModal: React.FC<{ category: any; onClose: () => void; onSave: () => void }> = ({ category, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    orderIndex: category?.order_index || 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (category) {
        await api.put(`/forum-admin/categories/${category.id}`, form);
      } else {
        await api.post('/forum-admin/categories', form);
      }
      onSave();
    } catch (error) {
      alert('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{category ? 'Edit Category' : 'Add Category'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Display Order</label>
            <input type="number" className="form-input" value={form.orderIndex} onChange={(e) => setForm({ ...form, orderIndex: Number(e.target.value) })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ManageForumsTab: React.FC = () => {
  const [forums, setForums] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingForum, setEditingForum] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [forumsRes, categoriesRes] = await Promise.all([
        api.get('/forum-admin/forums'),
        api.get('/forum-admin/categories')
      ]);
      setForums(forumsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this forum? Topics inside will remain but be inaccessible.')) return;
    try {
      await api.delete(`/forum-admin/forums/${id}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete forum');
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={() => { setEditingForum(null); setShowModal(true); }}>
          ➕ Add Forum
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Forum Name</th>
              <th>Category</th>
              <th>Topics</th>
              <th>Posts</th>
              <th>Locked</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {forums.map((forum) => (
              <tr key={forum.id}>
                <td><strong>{forum.name}</strong></td>
                <td>{forum.category_name}</td>
                <td>{forum.topics_count}</td>
                <td>{forum.posts_count}</td>
                <td>{forum.locked ? '🔒 Yes' : '✅ No'}</td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-sm btn-secondary" onClick={() => { setEditingForum(forum); setShowModal(true); }}>✏️ Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(forum.id)}>🗑️ Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ForumModal
          forum={editingForum}
          categories={categories}
          onClose={() => { setShowModal(false); setEditingForum(null); }}
          onSave={() => { setShowModal(false); setEditingForum(null); loadData(); }}
        />
      )}
    </>
  );
};

const ForumModal: React.FC<{ forum: any; categories: any[]; onClose: () => void; onSave: () => void }> = ({ forum, categories, onClose, onSave }) => {
  const [form, setForm] = useState({
    categoryId: forum?.category_id || categories[0]?.id || 1,
    name: forum?.name || '',
    description: forum?.description || '',
    icon: forum?.icon || '',
    orderIndex: forum?.order_index || 0,
    locked: forum?.locked || 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (forum) {
        await api.put(`/forum-admin/forums/${forum.id}`, form);
      } else {
        await api.post('/forum-admin/forums', form);
      }
      onSave();
    } catch (error) {
      alert('Failed to save forum');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{forum ? 'Edit Forum' : 'Add Forum'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })} required>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Forum Name *</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Icon (emoji or text)</label>
            <input className="form-input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="💬" />
          </div>
          <div className="form-group">
            <label className="form-label">Display Order</label>
            <input type="number" className="form-input" value={form.orderIndex} onChange={(e) => setForm({ ...form, orderIndex: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label className="form-checkbox">
              <input type="checkbox" checked={!!form.locked} onChange={(e) => setForm({ ...form, locked: e.target.checked ? 1 : 0 })} />
              <span>🔒 Lock forum (only admins can post)</span>
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ManagePermissions: React.FC = () => {
  const [forums, setForums] = useState<any[]>([]);
  const [selectedForum, setSelectedForum] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForums();
  }, []);

  const loadForums = async () => {
    try {
      const response = await api.get('/forum-admin/forums');
      setForums(response.data);
      if (response.data.length > 0) {
        setSelectedForum(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading forums:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedForum) {
      loadPermissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedForum]);

  const loadPermissions = async () => {
    if (!selectedForum) return;
    try {
      const response = await api.get(`/forum-admin/permissions/${selectedForum}`);
      setPermissions(response.data.permissions);
      setGroups(response.data.allGroups);
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  };

  const handleAddPermission = async (groupId: number) => {
    try {
      await api.post('/forum-admin/permissions', {
        forumId: selectedForum,
        groupId,
        canView: true,
        canCreateTopic: true,
        canReply: true,
        canEditOwn: true,
        canDeleteOwn: false
      });
      loadPermissions();
    } catch (error) {
      alert('Failed to add permission');
    }
  };

  const handleTogglePermission = async (groupId: number, field: string, currentValue: boolean) => {
    const perm = permissions.find(p => p.group_id === groupId) || {};
    try {
      await api.post('/forum-admin/permissions', {
        forumId: selectedForum,
        groupId,
        canView: field === 'canView' ? !currentValue : perm.can_view,
        canCreateTopic: field === 'canCreateTopic' ? !currentValue : perm.can_create_topic,
        canReply: field === 'canReply' ? !currentValue : perm.can_reply,
        canEditOwn: field === 'canEditOwn' ? !currentValue : perm.can_edit_own,
        canDeleteOwn: field === 'canDeleteOwn' ? !currentValue : perm.can_delete_own
      });
      loadPermissions();
    } catch (error) {
      alert('Failed to update permission');
    }
  };

  const handleRemovePermission = async (groupId: number) => {
    if (!window.confirm('Remove all permissions for this group?')) return;
    try {
      await api.delete(`/forum-admin/permissions/${selectedForum}/${groupId}`);
      loadPermissions();
    } catch (error) {
      alert('Failed to remove permission');
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  const availableGroups = groups.filter(g => !permissions.find(p => p.group_id === g.id));

  return (
    <div>
      <div className="form-group" style={{ maxWidth: '400px', marginBottom: '2rem' }}>
        <label className="form-label">Select Forum</label>
        <select 
          className="form-input" 
          value={selectedForum || ''} 
          onChange={(e) => setSelectedForum(Number(e.target.value))}
        >
          {forums.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      {permissions.length > 0 ? (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Group</th>
                <th>View</th>
                <th>Create Topics</th>
                <th>Reply</th>
                <th>Edit Own</th>
                <th>Delete Own</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((perm) => (
                <tr key={perm.group_id}>
                  <td><strong style={{ color: perm.group_color || 'inherit' }}>{perm.group_name}</strong></td>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={!!perm.can_view} 
                      onChange={() => handleTogglePermission(perm.group_id, 'canView', !!perm.can_view)} 
                    />
                  </td>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={!!perm.can_create_topic} 
                      onChange={() => handleTogglePermission(perm.group_id, 'canCreateTopic', !!perm.can_create_topic)} 
                    />
                  </td>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={!!perm.can_reply} 
                      onChange={() => handleTogglePermission(perm.group_id, 'canReply', !!perm.can_reply)} 
                    />
                  </td>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={!!perm.can_edit_own} 
                      onChange={() => handleTogglePermission(perm.group_id, 'canEditOwn', !!perm.can_edit_own)} 
                    />
                  </td>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={!!perm.can_delete_own} 
                      onChange={() => handleTogglePermission(perm.group_id, 'canDeleteOwn', !!perm.can_delete_own)} 
                    />
                  </td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => handleRemovePermission(perm.group_id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>No custom permissions set for this forum. Default permissions apply.</p>
        </div>
      )}

      {availableGroups.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add Permission for Group:</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {availableGroups.map(group => (
              <button 
                key={group.id} 
                className="btn btn-secondary btn-sm" 
                onClick={() => handleAddPermission(group.id)}
              >
                + {group.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ========================================
// FORUM MODERATION COMPONENT
// ========================================

const ForumModeration: React.FC = () => {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);

  useEffect(() => {
    loadRecentTopics();
  }, []);

  const loadRecentTopics = async () => {
    try {
      const response = await api.get('/forum-admin/moderation/recent?limit=100');
      setTopics(response.data);
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLockTopic = async (topicId: number, currentLocked: number) => {
    try {
      await api.post(`/forum-mod/topic/${topicId}/lock`, { locked: !currentLocked });
      loadRecentTopics();
    } catch (error) {
      alert('Failed to lock/unlock topic');
    }
  };

  const handlePinTopic = async (topicId: number, currentPinned: number) => {
    try {
      await api.post(`/forum-mod/topic/${topicId}/pin`, { pinned: !currentPinned });
      loadRecentTopics();
    } catch (error) {
      alert('Failed to pin/unpin topic');
    }
  };

  const handleDeleteTopic = async (topicId: number) => {
    if (!window.confirm('Delete this topic permanently?')) return;
    try {
      await api.delete(`/forum-mod/topic/${topicId}`);
      loadRecentTopics();
    } catch (error) {
      alert('Failed to delete topic');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="manage-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">
            <span className="title-icon">🛡️</span>
            <span className="title-text">Forum Moderation</span>
          </h1>
          <p className="section-subtitle">Monitor and moderate all forum topics</p>
        </div>
        <button className="btn btn-secondary" onClick={loadRecentTopics}>🔄 Refresh</button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Forum</th>
              <th>Author</th>
              <th>Replies</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((topic) => (
              <React.Fragment key={topic.id}>
                <tr>
                  <td>
                    <strong>{topic.title}</strong>
                    {topic.announcement === 1 && <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>📢 Announcement</span>}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {topic.category_name} → {topic.forum_name}
                    </div>
                  </td>
                  <td>{topic.author_username}</td>
                  <td>{topic.reply_count}</td>
                  <td style={{ fontSize: '0.875rem' }}>{formatDate(topic.created_at)}</td>
                  <td>
                    {topic.locked === 1 && <span className="badge badge-error">🔒 Locked</span>}
                    {topic.pinned === 1 && <span className="badge badge-warning">📌 Pinned</span>}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="btn btn-sm btn-secondary" 
                        onClick={() => setSelectedTopic(selectedTopic?.id === topic.id ? null : topic)}
                        title="View details"
                      >
                        {selectedTopic?.id === topic.id ? '▲' : '▼'}
                      </button>
                      <button 
                        className={`btn btn-sm ${topic.locked ? 'btn-success' : 'btn-warning'}`} 
                        onClick={() => handleLockTopic(topic.id, topic.locked)}
                        title={topic.locked ? 'Unlock' : 'Lock'}
                      >
                        {topic.locked ? '🔓' : '🔒'}
                      </button>
                      <button 
                        className={`btn btn-sm ${topic.pinned ? 'btn-secondary' : 'btn-primary'}`} 
                        onClick={() => handlePinTopic(topic.id, topic.pinned)}
                        title={topic.pinned ? 'Unpin' : 'Pin'}
                      >
                        📌
                      </button>
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => handleDeleteTopic(topic.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
                {selectedTopic?.id === topic.id && (
                  <tr>
                    <td colSpan={7} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem' }}>
                      <div>
                        <strong>First Post:</strong>
                        <div style={{ 
                          marginTop: '0.5rem', 
                          padding: '1rem', 
                          background: 'rgba(0,0,0,0.3)', 
                          borderRadius: '8px',
                          maxHeight: '200px',
                          overflow: 'auto'
                        }}>
                          {topic.first_post_content || 'No content'}
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                          <a href={`/forum/topic/${topic.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                            View Topic →
                          </a>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ========================================
// DONATION RANKS MANAGEMENT COMPONENT
// ========================================

interface DonationUser {
  id: number;
  username: string;
  minecraft_username: string;
  minecraft_uuid: string;
  total_donated: number;
  donation_rank_id: string | null;
  donation_rank_expires_at: string | null;
  donation_rank_granted_by: number | null;
  granted_by_username: string | null;
  created_at: string;
  rank: any;
  isExpired: boolean;
  daysUntilExpiration: number | null;
}

const ManageDonationRanks: React.FC = () => {
  const [users, setUsers] = useState<DonationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSetDonatedModal, setShowSetDonatedModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DonationUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [serviceLoading, setServiceLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadServiceStatus();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading users from /donations/admin/users...');
      const response = await api.get('/donations/admin/users');
      console.log('✅ API Response:', response);
      console.log('📊 Users data:', response.data);
      console.log('📈 Users count:', response.data?.length || 0);
      setUsers(response.data || []);
    } catch (error: any) {
      console.error('❌ Error loading users:', error);
      console.error('📋 Error details:', error.response?.data);
      console.error('🔢 Status code:', error.response?.status);
      
      // Fallback: try to load regular users if donations endpoint fails
      try {
        console.log('🔄 Trying fallback: loading regular users...');
        const fallbackResponse = await api.get('/users');
        console.log('✅ Fallback users loaded:', fallbackResponse.data?.length || 0);
        const usersWithDefaults = (fallbackResponse.data || []).map((user: any) => ({
          ...user,
          total_donated: 0,
          donation_rank_id: null,
          donation_rank_expires_at: null,
          donation_rank_granted_by: null,
          granted_by_username: null,
          rank: null,
          isExpired: false,
          daysUntilExpiration: null
        }));
        setUsers(usersWithDefaults);
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadServiceStatus = async () => {
    try {
      const response = await api.get('/donations/admin/expiration-service/status');
      setServiceStatus(response.data);
    } catch (error) {
      console.error('Error loading service status:', error);
    }
  };

  const handleServiceAction = async (action: string) => {
    setServiceLoading(true);
    try {
      await api.post(`/donations/admin/expiration-service/${action}`);
      loadServiceStatus();
      alert(`Service ${action} successful`);
    } catch (error: any) {
      alert(error.response?.data?.error || `Failed to ${action} service`);
    } finally {
      setServiceLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.minecraft_username && user.minecraft_username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSetDonated = (user: DonationUser) => {
    setSelectedUser(user);
    setShowSetDonatedModal(true);
    setShowGrantModal(false);
    setShowHistoryModal(false);
    setShowExtendModal(false);
  };

  const handleGrantRank = (user: DonationUser) => {
    setSelectedUser(user);
    setShowGrantModal(true);
    setShowSetDonatedModal(false);
    setShowHistoryModal(false);
    setShowExtendModal(false);
  };

  const handleExtendRank = (user: DonationUser) => {
    setSelectedUser(user);
    setShowExtendModal(true);
    setShowSetDonatedModal(false);
    setShowGrantModal(false);
    setShowHistoryModal(false);
  };

  const handleViewHistory = (user: DonationUser) => {
    setSelectedUser(user);
    setShowHistoryModal(true);
    setShowSetDonatedModal(false);
    setShowGrantModal(false);
    setShowExtendModal(false);
  };

  const handleRevokeRank = async (user: DonationUser) => {
    if (!window.confirm(`Are you sure you want to revoke ${user.username}'s rank? This action is permanent and cannot be undone.`)) return;
    
    try {
      await api.delete(`/donations/admin/users/${user.id}/rank`);
      loadUsers();
      alert('Rank revoked successfully');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to revoke rank');
    }
  };
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading donation ranks...</p>
      </div>
    );
  }

  return (
    <div className="manage-donation-ranks">
      <div className="section-header">
        <div>
          <h2 className="section-title">Donation Ranks Management</h2>
          <p className="section-subtitle">Manage user donation ranks, expiration dates, and history</p>
        </div>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ width: '300px' }}
          />
        </div>
      </div>

      {/* Service Status */}
      {serviceStatus && (
        <div className="service-status-card" style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>Rank Expiration Service</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Status: <span style={{ color: serviceStatus.isRunning ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                  {serviceStatus.isRunning ? '🟢 Running' : '🔴 Stopped'}
                </span>
                {serviceStatus.nextCheck && (
                  <span> • Next check: {new Date(serviceStatus.nextCheck).toLocaleString()}</span>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => handleServiceAction('check')}
                disabled={serviceLoading}
              >
                🔄 Check Now
              </button>
              {serviceStatus.isRunning ? (
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleServiceAction('stop')}
                  disabled={serviceLoading}
                >
                  ⏹️ Stop
                </button>
              ) : (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleServiceAction('start')}
                  disabled={serviceLoading}
                >
                  ▶️ Start
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Current Rank</th>
              <th>Total Donated</th>
              <th>Expires</th>
              <th>Granted By</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className={user.isExpired ? 'expired-rank' : ''}>
                <td>
                  <div>
                    <strong>{user.username}</strong>
                    {user.minecraft_username && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        MC: {user.minecraft_username}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  {user.rank ? (
                    <span
                      className="rank-badge"
                      style={{
                        backgroundColor: user.rank.color,
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      {user.rank.icon} {user.rank.name}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>No rank</span>
                  )}
                </td>
                <td>${user.total_donated?.toFixed(2) || '0.00'}</td>
                <td>
                  {user.donation_rank_expires_at ? (
                    <div>
                      <div>{formatDate(user.donation_rank_expires_at)}</div>
                      {user.daysUntilExpiration !== null && (
                        <div style={{ fontSize: '0.75rem', color: user.daysUntilExpiration < 0 ? 'red' : 'var(--text-secondary)' }}>
                          {user.daysUntilExpiration < 0 
                            ? `Expired ${Math.abs(user.daysUntilExpiration)} days ago`
                            : `${user.daysUntilExpiration} days left`
                          }
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>Permanent</span>
                  )}
                </td>
                <td>{user.granted_by_username || '-'}</td>
                <td>
                  {user.isExpired ? (
                    <span className="badge badge-error">Expired</span>
                  ) : user.donation_rank_id ? (
                    <span className="badge badge-success">Active</span>
                  ) : (
                    <span className="badge badge-warning">No Rank</span>
                  )}
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => handleSetDonated(user)}
                      title="Set total donated amount"
                    >
                      💰 Set $
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleGrantRank(user)}
                      title="Grant or change rank"
                    >
                      💎 Rank
                    </button>
                    {user.donation_rank_id && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleExtendRank(user)}
                        title="Add days to current rank"
                      >
                        ⏰ Extend
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => handleViewHistory(user)}
                      title="View rank history"
                    >
                      📋 History
                    </button>
                    {user.donation_rank_id && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRevokeRank(user)}
                        title="Revoke current rank"
                      >
                        🗑️ Revoke
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">💎</div>
          <h3>No Users Found</h3>
          <p>No users with donation ranks or donations found.</p>
          <p>Debug: Total users loaded: {users.length}</p>
          <p>Debug: Search term: "{searchTerm}"</p>
          <button className="btn btn-primary" onClick={loadUsers}>
            🔄 Reload Users
          </button>
        </div>
      )}

      {/* Modals */}
      {showSetDonatedModal && selectedUser && (
        <SetDonatedModal
          user={selectedUser}
          onClose={() => {
            setShowSetDonatedModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowSetDonatedModal(false);
            setSelectedUser(null);
            loadUsers();
          }}
        />
      )}

      {showGrantModal && selectedUser && (
        <GrantRankModal
          user={selectedUser}
          onClose={() => {
            setShowGrantModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowGrantModal(false);
            setSelectedUser(null);
            loadUsers();
          }}
        />
      )}

      {showExtendModal && selectedUser && (
        <ExtendRankModal
          user={selectedUser}
          onClose={() => {
            setShowExtendModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowExtendModal(false);
            setSelectedUser(null);
            loadUsers();
          }}
        />
      )}

      {showHistoryModal && selectedUser && (
        <RankHistoryModal
          user={selectedUser}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

// Grant/Change Rank Modal
const GrantRankModal: React.FC<{
  user: DonationUser;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    rankId: user.donation_rank_id || 'supporter',
    expirationDays: 30,
    expirationDate: '',
    expirationMode: 'days', // 'days', 'date', or 'permanent'
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const donationRanks = [
    { id: 'supporter', name: 'Supporter', color: '#10b981', icon: '🌟' },
    { id: 'patron', name: 'Patron', color: '#3b82f6', icon: '💎' },
    { id: 'champion', name: 'Champion', color: '#8b5cf6', icon: '👑' },
    { id: 'legend', name: 'Legend', color: '#f59e0b', icon: '🏆' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let expirationDays = null;
      
      if (formData.expirationMode === 'days' && formData.expirationDays > 0) {
        expirationDays = formData.expirationDays;
      } else if (formData.expirationMode === 'date' && formData.expirationDate) {
        // Calculate days from now to the specified date
        const targetDate = new Date(formData.expirationDate);
        const now = new Date();
        const diffTime = targetDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 0) {
          setError('Expiration date must be in the future');
          return;
        }
        
        expirationDays = diffDays;
      }
      // If permanent mode, expirationDays stays null

      const requestData = {
        rankId: formData.rankId,
        expirationDays,
        reason: formData.reason
      };

      await api.post(`/donations/admin/users/${user.id}/rank`, requestData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to grant rank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {user.donation_rank_id ? 'Change' : 'Grant'} Donation Rank - {user.username}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Rank *</label>
            <select
              className="form-input"
              value={formData.rankId}
              onChange={(e) => setFormData(prev => ({ ...prev, rankId: e.target.value }))}
              required
            >
              {donationRanks.map(rank => (
                <option key={rank.id} value={rank.id}>
                  {rank.icon} {rank.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Expiration</label>
            <select
              className="form-input"
              value={formData.expirationMode}
              onChange={(e) => setFormData(prev => ({ ...prev, expirationMode: e.target.value }))}
            >
              <option value="days">Days from now</option>
              <option value="date">Specific date</option>
              <option value="permanent">Permanent (no expiration)</option>
            </select>
          </div>

          {formData.expirationMode === 'days' && (
            <div className="form-group">
              <label className="form-label">Duration (Days)</label>
              <input
                type="number"
                className="form-input"
                value={formData.expirationDays}
                onChange={(e) => setFormData(prev => ({ ...prev, expirationDays: parseInt(e.target.value) || 0 }))}
                min="1"
                placeholder="30"
                required
              />
              <small className="form-hint">Standard: 30 days per $5 donation.</small>
            </div>
          )}

          {formData.expirationMode === 'date' && (
            <div className="form-group">
              <label className="form-label">Expiration Date</label>
              <input
                type="datetime-local"
                className="form-input"
                value={formData.expirationDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
              <small className="form-hint">Select the exact date and time when the rank should expire.</small>
            </div>
          )}

          {formData.expirationMode === 'permanent' && (
            <div className="form-group">
              <div className="form-info">
                <span style={{ color: 'var(--color-warning)' }}>⚠️</span>
                <span>This rank will never expire automatically.</span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea
              className="form-textarea"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Optional reason for this action..."
              rows={3}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : user.donation_rank_id ? 'Change Rank' : 'Grant Rank'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Extend Rank Modal
const ExtendRankModal: React.FC<{
  user: DonationUser;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    days: 30,
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post(`/donations/admin/users/${user.id}/extend`, formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to extend rank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Extend Rank - {user.username}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Days to Add *</label>
            <input
              type="number"
              className="form-input"
              value={formData.days}
              onChange={(e) => setFormData(prev => ({ ...prev, days: parseInt(e.target.value) || 0 }))}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea
              className="form-textarea"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Optional reason for extending the rank..."
              rows={3}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Extending...' : 'Extend Rank'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Rank History Modal
const RankHistoryModal: React.FC<{
  user: DonationUser;
  onClose: () => void;
}> = ({ user, onClose }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await api.get(`/donations/admin/users/${user.id}/history`);
      setHistory(response.data);
    } catch (error) {
      console.error('Error loading rank history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'granted': return '✅';
      case 'changed': return '🔄';
      case 'extended': return '⏰';
      case 'revoked': return '❌';
      case 'expired': return '⏱️';
      default: return '📝';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Rank History - {user.username}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <p>No rank history found for this user.</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((entry) => (
                <div key={entry.id} className="history-entry">
                  <div className="history-icon">
                    {getActionIcon(entry.action_type)}
                  </div>
                  <div className="history-content">
                    <div className="history-action">
                      <strong>{entry.action_type.charAt(0).toUpperCase() + entry.action_type.slice(1)}</strong>
                      {entry.old_rank_name && entry.new_rank_name && entry.action_type === 'changed' && (
                        <span> from {entry.old_rank_name} to {entry.new_rank_name}</span>
                      )}
                      {entry.new_rank_name && entry.action_type === 'granted' && (
                        <span> {entry.new_rank_name} rank</span>
                      )}
                      {entry.days_added && (
                        <span> (+{entry.days_added} days)</span>
                      )}
                    </div>
                    {entry.reason && (
                      <div className="history-reason">
                        Reason: {entry.reason}
                      </div>
                    )}
                    <div className="history-meta">
                      {formatDate(entry.created_at)}
                      {entry.granted_by_username && (
                        <span> • by {entry.granted_by_username}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Set Donated Amount Modal
const SetDonatedModal: React.FC<{
  user: DonationUser;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ user, onClose, onSuccess }) => {
  const [amount, setAmount] = useState(user.total_donated?.toString() || '0');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount < 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/donations/admin/users/${user.id}/set-donated`, {
        amount: numAmount
      });
      alert(`Successfully set ${user.username}'s total donated to $${numAmount.toFixed(2)}`);
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to set donated amount');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Set Total Donated - {user.username}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Total Donated Amount ($) <span className="required">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
            <small className="form-hint">
              This will set the user's total donated amount. Current: ${user.total_donated?.toFixed(2) || '0.00'}
            </small>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Setting...' : 'Set Amount'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;

// Donations Management Component
function ManageDonations() {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDonation, setEditingDonation] = useState<any>(null);
  const [settings, setSettings] = useState<{ paypal_email: string; paypal_me: string; crypto: Record<string, string> }>({ paypal_email: '', paypal_me: '', crypto: {} });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [dRes, sRes] = await Promise.all([
        api.get('/donations'),
        api.get('/donations/settings')
      ]);
      setDonations(dRes.data);
      setSettings(sRes.data);
    } catch (err: any) {
      console.error('Error loading donations/settings:', err);
      setError(err.response?.data?.error || 'Failed to load donations/settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Delete this donation entry?')) return;
    try {
      await api.delete(`/donations/${id}`);
      loadAll();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete donation');
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put('/donations/settings', settings);
      await loadAll();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const addCryptoField = () => {
    const nextKey = 'NEW';
    setSettings(prev => ({ ...prev, crypto: { ...prev.crypto, [nextKey]: '' } }));
  };

  const updateCryptoKey = (oldKey: string, newKey: string) => {
    setSettings(prev => {
      const { crypto } = prev;
      const value = crypto[oldKey];
      const { [oldKey]: _, ...rest } = crypto;
      return { ...prev, crypto: { ...rest, [newKey]: value } };
    });
  };

  const updateCryptoValue = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, crypto: { ...prev.crypto, [key]: value } }));
  };

  const removeCrypto = (key: string) => {
    setSettings(prev => {
      const { [key]: _, ...rest } = prev.crypto;
      return { ...prev, crypto: rest };
    });
  };

  return (
    <div className="manage-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">
            <span className="title-icon">💖</span>
            <span className="title-text">Donations</span>
          </h1>
          <p className="section-subtitle">Manage donation settings and entries</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setEditingDonation(null); setShowModal(true); }}
        >
          ➕ Add Donation
        </button>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="admin-grid two-columns">
        <div>
          <h3 className="section-subtitle" style={{ marginBottom: '0.75rem' }}>Settings</h3>
          <div className="form-group">
            <label className="form-label">PayPal Email</label>
            <input
              type="email"
              className="form-input"
              value={settings.paypal_email}
              onChange={(e) => setSettings(prev => ({ ...prev, paypal_email: e.target.value }))}
              placeholder="your@email.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label">PayPal.me Username or URL</label>
            <input
              type="text"
              className="form-input"
              value={settings.paypal_me}
              onChange={(e) => setSettings(prev => ({ ...prev, paypal_me: e.target.value }))}
              placeholder="yourname or https://paypal.me/yourname"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Crypto Addresses</label>
            <div className="crypto-settings-list">
              {Object.entries(settings.crypto).map(([key, value]) => (
                <div className="crypto-row" key={key}>
                  <input
                    type="text"
                    className="form-input"
                    value={key}
                    onChange={(e) => updateCryptoKey(key, e.target.value)}
                    placeholder="BTC"
                    style={{ maxWidth: 140 }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={value}
                    onChange={(e) => updateCryptoValue(key, e.target.value)}
                    placeholder="address"
                  />
                  <button className="btn btn-danger btn-sm" onClick={() => removeCrypto(key)}>Remove</button>
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={addCryptoField}>Add Crypto</button>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        <div>
          <h3 className="section-subtitle" style={{ marginBottom: '0.75rem' }}>Donations</h3>
          {loading ? (
            <div className="loading-container"><div className="spinner"></div><p>Loading donations...</p></div>
          ) : donations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎁</div>
              <h3>No donations yet</h3>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Supporter</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Visible</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map(d => (
                    <tr key={d.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img src={`https://mc-heads.net/head/${encodeURIComponent(d.minecraft_username || 'Steve')}/24`} alt={d.minecraft_username || 'Supporter'} style={{ width: 24, height: 24, borderRadius: 4 }} />
                          <strong>{d.minecraft_username || 'Anonymous'}</strong>
                        </div>
                      </td>
                      <td><strong>{Number(d.amount).toFixed(2)} {d.currency || 'USD'}</strong></td>
                      <td>
                        <span className={`badge ${d.displayed ? 'badge-success' : 'badge-warning'}`}>{d.displayed ? 'Shown' : 'Hidden'}</span>
                      </td>
                      <td>{new Date(d.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="table-actions">
                          <button className="btn btn-sm btn-secondary" onClick={() => { setEditingDonation(d); setShowModal(true); }}>✏️ Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(d.id)}>🗑️ Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <DonationModal
          donation={editingDonation}
          onClose={() => { setShowModal(false); setEditingDonation(null); }}
          onSave={() => { setShowModal(false); setEditingDonation(null); loadAll(); }}
        />
      )}
    </div>
  );
};

const DonationModal: React.FC<{ donation: any; onClose: () => void; onSave: () => void; }> = ({ donation, onClose, onSave }) => {
  const [form, setForm] = useState({
    minecraft_username: donation?.minecraft_username || '',
    minecraft_uuid: donation?.minecraft_uuid || '',
    amount: donation?.amount ?? 0,
    currency: donation?.currency || 'USD',
    method: donation?.method || 'paypal',
    message: donation?.message || '',
    displayed: donation?.displayed ?? 1,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    setForm(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (donation) {
        await api.put(`/donations/${donation.id}`, form);
      } else {
        await api.post('/donations', form);
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save donation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{donation ? 'Edit Donation' : 'Add Donation'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Minecraft Username</label>
              <input className="form-input" name="minecraft_username" value={form.minecraft_username} onChange={handleChange} placeholder="Steve" />
            </div>
            <div className="form-group">
              <label className="form-label">Minecraft UUID</label>
              <input className="form-input" name="minecraft_uuid" value={form.minecraft_uuid} onChange={handleChange} placeholder="uuid" />
            </div>
            <div className="form-group">
              <label className="form-label">Amount *</label>
              <input type="number" step="0.01" className="form-input" name="amount" value={form.amount} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <input className="form-input" name="currency" value={form.currency} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Method</label>
              <select className="form-input" name="method" value={form.method} onChange={handleChange}>
                <option value="paypal">PayPal</option>
                <option value="crypto">Crypto</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea className="form-textarea" name="message" rows={3} value={form.message} onChange={handleChange} placeholder="Optional message" />
          </div>
          <div className="form-group">
            <label className="form-checkbox">
              <input type="checkbox" checked={!!form.displayed} onChange={(e) => setForm(prev => ({ ...prev, displayed: e.target.checked ? 1 : 0 }))} />
              <span>Show on public donations list</span>
            </label>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
