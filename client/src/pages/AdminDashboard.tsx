import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import AdminDiscordPage from './AdminDiscordPage';
import AdminFeaturesPage from './AdminFeaturesPage';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from '../components/ChangePasswordModal';
import api from '../services/api';
import './AdminDashboard.css';

// Reusable Quick Actions for Admin pages (shown at bottom for mobile navigation)
const AdminQuickActions: React.FC = () => (
  <div className="dashboard-quick-actions admin-quick-actions-footer">
    <h2 className="section-title">Quick Actions</h2>
    <div className="quick-actions-grid">
      <a href="https://mintservers.com/dashboard" className="action-card" target="_blank" rel="noopener noreferrer">
        <div className="action-icon">
          <img src="https://mintservers.com/brand/icon.svg" alt="MintServers" style={{ width: 28, height: 28 }} />
        </div>
        <div className="action-title">Open MintServers</div>
        <div className="action-description">Provision or manage hosting</div>
      </a>
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
        <div className="action-description">Review and configure</div>
      </Link>
    </div>
  </div>
);

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

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
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
            to="/admin/features"
            className={`admin-nav-link ${location.pathname.includes('/admin/features') ? 'active' : ''}`}
          >
            🧰 Site Features
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
          <Route path="/forums" element={<ManageForums />} />
          <Route path="/moderation" element={<ForumModeration />} />
          <Route path="/discord" element={<AdminDiscordPage />} />
          <Route path="/features" element={<AdminFeaturesPage />} />
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

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      const response = await api.get('/servers');
      setServers(response.data);
    } catch (error) {
      console.error('Error loading servers:', error);
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
                      {server.status === 'online' ? 'Online' : 'Offline'}
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
      {/* Mobile quick actions footer */}
      <AdminQuickActions />
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
    setError('');
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
      const response = await api.get('/blog/admin/all');
      setPosts(response.data);
    } catch (error) {
      console.error('Error loading posts:', error);
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
          <h1 className="section-title">📝 Blog Posts</h1>
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
      {/* Mobile quick actions footer */}
      <AdminQuickActions />
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

    try {
      if (post) {
        await api.put(`/blog/${post.id}`, formData);
      } else {
        await api.post('/blog', formData);
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save post');
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
          <h1 className="section-title">👥 User Management</h1>
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
      {/* Mobile quick actions footer */}
      <AdminQuickActions />
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
          <h1 className="section-title">💬 Forum Management</h1>
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
      
      <AdminQuickActions />
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
          <h1 className="section-title">🛡️ Forum Moderation</h1>
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

      <AdminQuickActions />
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
          <h1 className="section-title">💖 Donations</h1>
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
                          {d.minecraft_uuid ? (
                            <img src={`https://crafatar.com/renders/head/${d.minecraft_uuid}`} alt={d.minecraft_username || 'Supporter'} style={{ width: 24, height: 24, borderRadius: 4 }} />
                          ) : (
                            <div style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎮</div>
                          )}
                          <strong>{d.minecraft_username || 'Anonymous'}</strong>
                        </div>
                      </td>
                      <td><strong>{Number(d.amount).toFixed(2)} {d.currency || 'USD'}</strong></td>
                      <td>{d.method || '-'}</td>
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
      {/* Mobile quick actions footer */}
      <AdminQuickActions />
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
