import React, { useState, useEffect, useMemo } from 'react';
import { fetchPaginated, handleApiError, optimisticUpdate } from '../../utils/apiHelpers';
import { debounce } from '../../utils/performance';
import UserDisplay from '../UserDisplay';
import api from '../../services/api';
import './AdminUserManagement.css';

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
}

interface UserAction {
  type: 'ban' | 'unban' | 'promote' | 'demote' | 'delete' | 'reset_password';
  user: User;
  reason?: string;
  duration?: number;
}

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [showActionModal, setShowActionModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<UserAction | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionDuration, setActionDuration] = useState(7);

  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      setCurrentPage(1);
      loadUsers(1, term);
    }, 300),
    []
  );

  const loadUsers = async (page: number = currentPage, search: string = searchTerm) => {
    try {
      setLoading(true);
      const response = await fetchPaginated<User>('/admin/users', page, 20, {
        search,
        role: filterRole === 'all' ? undefined : filterRole,
        status: filterStatus === 'all' ? undefined : filterStatus,
        sort: sortBy,
        order: sortOrder
      });

      setUsers(response.data);
      setTotalPages(Math.ceil(response.total / 20));
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filterRole, filterStatus, sortBy, sortOrder]);

  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm);
    } else {
      loadUsers(1, '');
    }
  }, [searchTerm, debouncedSearch]);

  const handleUserAction = (type: UserAction['type'], user: User) => {
    setPendingAction({ type, user });
    setActionReason('');
    setActionDuration(7);
    setShowActionModal(true);
  };

  const executeAction = async () => {
    if (!pendingAction) return;

    try {
      const { type, user } = pendingAction;
      let endpoint = '';
      let method = 'POST';
      let payload: any = { reason: actionReason };

      switch (type) {
        case 'ban':
          endpoint = `/admin/users/${user.id}/ban`;
          payload.duration = actionDuration;
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
        case 'reset_password':
          endpoint = `/admin/users/${user.id}/reset-password`;
          break;
      }

      // Optimistic update
      if (type === 'ban') {
        setUsers(prev => optimisticUpdate(prev, user.id, { 
          is_banned: true, 
          ban_reason: actionReason,
          ban_expires_at: new Date(Date.now() + actionDuration * 24 * 60 * 60 * 1000).toISOString()
        }));
      } else if (type === 'unban') {
        setUsers(prev => optimisticUpdate(prev, user.id, { 
          is_banned: false, 
          ban_reason: undefined,
          ban_expires_at: undefined
        }));
      }

      await api.request({
        method,
        url: endpoint,
        data: payload
      });

      // Reload to get fresh data
      await loadUsers();
      
      setShowActionModal(false);
      setPendingAction(null);
    } catch (error) {
      const apiError = handleApiError(error);
      alert(`Action failed: ${apiError.message}`);
      // Revert optimistic update
      await loadUsers();
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${selectedUsers.size} selected users?`
    );

    if (!confirmed) return;

    try {
      await api.post('/admin/users/bulk-action', {
        action,
        user_ids: Array.from(selectedUsers),
        reason: actionReason || `Bulk ${action}`
      });

      await loadUsers();
      setSelectedUsers(new Set());
    } catch (error) {
      const apiError = handleApiError(error);
      alert(`Bulk action failed: ${apiError.message}`);
    }
  };

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
      return <span className="status-badge banned">Banned</span>;
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
    <div className="admin-user-management">
      <div className="management-header">
        <h2>👥 User Management</h2>
        <div className="header-actions">
          <button className="export-btn">📊 Export Users</button>
          <button className="add-user-btn">➕ Add User</button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users by username, email, or Minecraft name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="moderator">Moderators</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="banned">Banned</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="created_at">Join Date</option>
            <option value="last_seen_at">Last Seen</option>
            <option value="username">Username</option>
            <option value="total_donated">Donations</option>
            <option value="post_count">Posts</option>
            <option value="reputation">Reputation</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="sort-order-btn"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="bulk-actions">
          <span className="selected-count">
            {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
          </span>
          <div className="bulk-action-buttons">
            <button onClick={() => handleBulkAction('ban')} className="bulk-btn ban">
              Ban Selected
            </button>
            <button onClick={() => handleBulkAction('unban')} className="bulk-btn unban">
              Unban Selected
            </button>
            <button onClick={() => handleBulkAction('delete')} className="bulk-btn delete">
              Delete Selected
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
                <tr key={user.id} className={selectedUsers.has(user.id) ? 'selected' : ''}>
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
                          onClick={() => handleUserAction('ban', user)}
                          className="action-btn ban"
                          title="Ban User"
                        >
                          🔒
                        </button>
                      )}
                      
                      {user.role === 'user' && (
                        <button
                          onClick={() => handleUserAction('promote', user)}
                          className="action-btn promote"
                          title="Promote to Moderator"
                        >
                          ⬆️
                        </button>
                      )}
                      
                      {user.role === 'moderator' && (
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
                      
                      <button
                        onClick={() => handleUserAction('delete', user)}
                        className="action-btn delete"
                        title="Delete User"
                      >
                        🗑️
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
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => loadUsers(currentPage - 1)}
            disabled={currentPage === 1}
            className="page-btn"
          >
            ← Previous
          </button>
          
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => loadUsers(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            Next →
          </button>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && pendingAction && (
        <div className="modal-overlay">
          <div className="action-modal">
            <h3>
              {pendingAction.type.charAt(0).toUpperCase() + pendingAction.type.slice(1)} User
            </h3>
            <p>
              Are you sure you want to {pendingAction.type} <strong>{pendingAction.user.username}</strong>?
            </p>
            
            {(pendingAction.type === 'ban' || pendingAction.type === 'delete') && (
              <div className="form-group">
                <label>Reason:</label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for this action..."
                  required
                />
              </div>
            )}
            
            {pendingAction.type === 'ban' && (
              <div className="form-group">
                <label>Duration (days):</label>
                <input
                  type="number"
                  value={actionDuration}
                  onChange={(e) => setActionDuration(Number(e.target.value))}
                  min="1"
                  max="365"
                />
              </div>
            )}
            
            <div className="modal-actions">
              <button
                onClick={() => setShowActionModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className={`confirm-btn ${pendingAction.type}`}
                disabled={
                  (pendingAction.type === 'ban' || pendingAction.type === 'delete') && 
                  !actionReason.trim()
                }
              >
                Confirm {pendingAction.type}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
