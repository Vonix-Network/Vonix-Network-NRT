import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../../../context/AdminContext';
import { fetchPaginated, handleApiError, optimisticUpdate } from '../../../utils/apiHelpers';
import { debounce } from '../../../utils/performance';
import UserDisplay from '../../../components/UserDisplay';
import api from '../../../services/api';
import './AdminUsers.css';

interface User {
  id: number;
  username: string;
  minecraft_username?: string;
  minecraft_uuid?: string;
  email?: string;
  role: 'user' | 'moderator' | 'admin';
  created_at: string;
  last_seen_at?: string;
  total_donated?: number;
  donation_rank_id?: string;
  donation_rank?: {
    id: string;
    name: string;
    color: string;
    textColor: string;
    icon: string;
    badge: string;
    glow: boolean;
  };
  is_banned?: boolean;
  ban_reason?: string;
  ban_expires_at?: string;
  post_count?: number;
  reputation?: number;
  verification_status: 'pending' | 'verified' | 'rejected';
  two_factor_enabled: boolean;
}

interface UserFilter {
  search: string;
  role: string;
  status: string;
  donationRank: string;
  joinedAfter: string;
  joinedBefore: string;
  lastSeenAfter: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface BulkAction {
  type: 'ban' | 'unban' | 'delete' | 'promote' | 'demote' | 'verify' | 'send_email';
  reason?: string;
  duration?: number;
  emailTemplate?: string;
}

const AdminUsers: React.FC = () => {
  const { state, actions } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState<UserFilter>({
    search: '',
    role: 'all',
    status: 'all',
    donationRank: 'all',
    joinedAfter: '',
    joinedBefore: '',
    lastSeenAfter: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      setFilters(prev => ({ ...prev, search: term }));
      setCurrentPage(1);
    }, 300),
    []
  );

  // Load users
  const loadUsers = async (page: number = currentPage) => {
    try {
      setLoading(true);
      
      const queryParams = {
        ...filters,
        search: filters.search || undefined,
        role: filters.role === 'all' ? undefined : filters.role,
        status: filters.status === 'all' ? undefined : filters.status,
        donation_rank: filters.donationRank === 'all' ? undefined : filters.donationRank,
        joined_after: filters.joinedAfter || undefined,
        joined_before: filters.joinedBefore || undefined,
        last_seen_after: filters.lastSeenAfter || undefined,
        sort: filters.sortBy,
        order: filters.sortOrder
      };

      const response = await fetchPaginated<User>('/admin/users', page, 25, queryParams);
      
      setUsers(response.data);
      setTotalUsers(response.total);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    loadUsers(1);
  }, [filters]);

  // User actions
  const handleUserAction = async (action: string, user: User, data?: any) => {
    try {
      let endpoint = '';
      let method = 'POST';
      let payload = { ...data };

      switch (action) {
        case 'ban':
          endpoint = `/admin/users/${user.id}/ban`;
          break;
        case 'unban':
          endpoint = `/admin/users/${user.id}/unban`;
          break;
        case 'promote':
          endpoint = `/admin/users/${user.id}/promote`;
          break;
        case 'demote':
          endpoint = `/admin/users/${user.id}/demote`;
          break;
        case 'delete':
          endpoint = `/admin/users/${user.id}`;
          method = 'DELETE';
          break;
        case 'verify':
          endpoint = `/admin/users/${user.id}/verify`;
          break;
        case 'reset_password':
          endpoint = `/admin/users/${user.id}/reset-password`;
          break;
        case 'grant_rank':
          endpoint = `/admin/users/${user.id}/rank`;
          break;
        case 'revoke_rank':
          endpoint = `/admin/users/${user.id}/rank`;
          method = 'DELETE';
          break;
      }

      // Optimistic update
      if (action === 'ban') {
        setUsers(prev => optimisticUpdate(prev, user.id, { 
          is_banned: true, 
          ban_reason: data.reason,
          ban_expires_at: data.duration ? new Date(Date.now() + data.duration * 24 * 60 * 60 * 1000).toISOString() : undefined
        }));
      } else if (action === 'unban') {
        setUsers(prev => optimisticUpdate(prev, user.id, { 
          is_banned: false, 
          ban_reason: undefined,
          ban_expires_at: undefined
        }));
      }

      await api.request({ method, url: endpoint, data: payload });
      
      // Reload to get fresh data
      await loadUsers();
      
    } catch (error) {
      const apiError = handleApiError(error);
      alert(`Action failed: ${apiError.message}`);
      // Revert optimistic update
      await loadUsers();
    }
  };

  // Bulk actions
  const handleBulkAction = async (action: BulkAction) => {
    if (selectedUsers.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to ${action.type} ${selectedUsers.size} selected users?`
    );

    if (!confirmed) return;

    try {
      await api.post('/admin/users/bulk-action', {
        action: action.type,
        user_ids: Array.from(selectedUsers),
        reason: action.reason || `Bulk ${action.type}`,
        duration: action.duration,
        email_template: action.emailTemplate
      });

      await loadUsers();
      setSelectedUsers(new Set());
      setShowBulkActions(false);
    } catch (error) {
      const apiError = handleApiError(error);
      alert(`Bulk action failed: ${apiError.message}`);
    }
  };

  // Selection helpers
  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const selectAllUsers = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  // Utility functions
  const formatLastSeen = (lastSeen?: string): string => {
    if (!lastSeen) return 'Never';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'moderator': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.is_banned) {
      const isTemporary = user.ban_expires_at && new Date(user.ban_expires_at) > new Date();
      return (
        <span className="status-badge banned" title={user.ban_reason}>
          {isTemporary ? 'Temp Ban' : 'Banned'}
        </span>
      );
    }
    
    if (user.verification_status === 'pending') {
      return <span className="status-badge pending">Pending</span>;
    }
    
    if (user.last_seen_at) {
      const daysSinceLastSeen = Math.floor(
        (Date.now() - new Date(user.last_seen_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastSeen <= 1) {
        return <span className="status-badge active">Active</span>;
      } else if (daysSinceLastSeen <= 7) {
        return <span className="status-badge recent">Recent</span>;
      }
    }
    
    return <span className="status-badge inactive">Inactive</span>;
  };

  return (
    <div className="admin-users">
      <Routes>
        <Route path="/" element={
          <>
            {/* Header */}
            <div className="users-header">
              <div className="header-left">
                <h1>👥 User Management</h1>
                <p>Manage users, roles, and permissions across your platform</p>
              </div>
              <div className="header-actions">
                <button 
                  className="filter-btn"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  🔍 Filters
                </button>
                <button className="export-btn">
                  📊 Export
                </button>
                <button 
                  className="add-user-btn"
                  onClick={() => setShowUserModal(true)}
                >
                  ➕ Add User
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="advanced-filters">
                <div className="filters-grid">
                  <div className="filter-group">
                    <label>Search</label>
                    <input
                      type="text"
                      placeholder="Username, email, Minecraft name..."
                      value={filters.search}
                      onChange={(e) => debouncedSearch(e.target.value)}
                    />
                  </div>
                  
                  <div className="filter-group">
                    <label>Role</label>
                    <select
                      value={filters.role}
                      onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                    >
                      <option value="all">All Roles</option>
                      <option value="user">Users</option>
                      <option value="moderator">Moderators</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label>Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="banned">Banned</option>
                      <option value="pending">Pending Verification</option>
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label>Donation Rank</label>
                    <select
                      value={filters.donationRank}
                      onChange={(e) => setFilters(prev => ({ ...prev, donationRank: e.target.value }))}
                    >
                      <option value="all">All Ranks</option>
                      <option value="none">No Rank</option>
                      <option value="supporter">Supporter</option>
                      <option value="patron">Patron</option>
                      <option value="champion">Champion</option>
                      <option value="legend">Legend</option>
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label>Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    >
                      <option value="created_at">Join Date</option>
                      <option value="last_seen_at">Last Seen</option>
                      <option value="username">Username</option>
                      <option value="total_donated">Donations</option>
                      <option value="post_count">Posts</option>
                      <option value="reputation">Reputation</option>
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label>Order</label>
                    <select
                      value={filters.sortOrder}
                      onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                </div>
                
                <div className="filter-actions">
                  <button 
                    className="clear-filters-btn"
                    onClick={() => setFilters({
                      search: '',
                      role: 'all',
                      status: 'all',
                      donationRank: 'all',
                      joinedAfter: '',
                      joinedBefore: '',
                      lastSeenAfter: '',
                      sortBy: 'created_at',
                      sortOrder: 'desc'
                    })}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}

            {/* Bulk Actions */}
            {selectedUsers.size > 0 && (
              <div className="bulk-actions">
                <div className="bulk-info">
                  <span className="selected-count">
                    {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="bulk-buttons">
                  <button 
                    className="bulk-btn ban"
                    onClick={() => setShowBulkActions(true)}
                  >
                    Ban Selected
                  </button>
                  <button 
                    className="bulk-btn unban"
                    onClick={() => handleBulkAction({ type: 'unban' })}
                  >
                    Unban Selected
                  </button>
                  <button 
                    className="bulk-btn verify"
                    onClick={() => handleBulkAction({ type: 'verify' })}
                  >
                    Verify Selected
                  </button>
                  <button 
                    className="bulk-btn email"
                    onClick={() => setShowBulkActions(true)}
                  >
                    Send Email
                  </button>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === users.length && users.length > 0}
                        onChange={selectAllUsers}
                      />
                    </th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Last Seen</th>
                    <th>Posts</th>
                    <th>Donations</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="loading-cell">
                        <div className="loading-spinner"></div>
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="empty-cell">
                        No users found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr 
                        key={user.id} 
                        className={`${selectedUsers.has(user.id) ? 'selected' : ''} ${user.is_banned ? 'banned-user' : ''}`}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                          />
                        </td>
                        <td className="user-cell">
                          <div className="user-info">
                            <UserDisplay
                              username={user.username}
                              minecraftUsername={user.minecraft_username}
                              donationRank={user.donation_rank}
                              size="small"
                              showIcon={true}
                              showBadge={false}
                            />
                            {user.email && (
                              <div className="user-email">{user.email}</div>
                            )}
                            {user.two_factor_enabled && (
                              <span className="security-badge" title="2FA Enabled">🔐</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span 
                            className="role-badge"
                            style={{ backgroundColor: getRoleColor(user.role) }}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td>{getStatusBadge(user)}</td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>{formatLastSeen(user.last_seen_at)}</td>
                        <td>{user.post_count || 0}</td>
                        <td>
                          {user.total_donated ? `$${user.total_donated.toFixed(2)}` : '$0.00'}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn view"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                              }}
                              title="View Details"
                            >
                              👁️
                            </button>
                            
                            {user.is_banned ? (
                              <button
                                onClick={() => handleUserAction('unban', user)}
                                className="action-btn unban"
                                title="Unban User"
                              >
                                🔓
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserAction('ban', user, { reason: 'Admin action' })}
                                className="action-btn ban"
                                title="Ban User"
                              >
                                🔒
                              </button>
                            )}
                            
                            {user.role === 'user' && actions.hasPermission('admin:users:promote') && (
                              <button
                                onClick={() => handleUserAction('promote', user)}
                                className="action-btn promote"
                                title="Promote to Moderator"
                              >
                                ⬆️
                              </button>
                            )}
                            
                            {user.role === 'moderator' && actions.hasPermission('admin:users:demote') && (
                              <button
                                onClick={() => handleUserAction('demote', user)}
                                className="action-btn demote"
                                title="Demote to User"
                              >
                                ⬇️
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleUserAction('reset_password', user)}
                              className="action-btn reset"
                              title="Reset Password"
                            >
                              🔑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <div className="pagination-info">
                Showing {((currentPage - 1) * 25) + 1} to {Math.min(currentPage * 25, totalUsers)} of {totalUsers} users
              </div>
              <div className="pagination-controls">
                <button
                  onClick={() => loadUsers(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="page-btn"
                >
                  ← Previous
                </button>
                
                <span className="page-info">
                  Page {currentPage} of {Math.ceil(totalUsers / 25)}
                </span>
                
                <button
                  onClick={() => loadUsers(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(totalUsers / 25)}
                  className="page-btn"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        } />
        
        <Route path="/roles" element={<div>User Roles Management</div>} />
        <Route path="/banned" element={<div>Banned Users</div>} />
        <Route path="/activity" element={<div>User Activity</div>} />
      </Routes>
    </div>
  );
};

export default AdminUsers;
