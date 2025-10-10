import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { fetchCached, retryApiCall } from '../utils/apiHelpers';
import { performanceMetrics } from '../utils/performance';

// Types
interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'moderator';
  permissions: string[];
  last_login: string;
  created_at: string;
}

interface SystemMetrics {
  server: {
    uptime: number;
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    load_average: number[];
  };
  database: {
    connections: number;
    queries_per_second: number;
    avg_response_time: number;
    slow_queries: number;
    cache_hit_rate: number;
  };
  application: {
    active_users: number;
    requests_per_minute: number;
    error_rate: number;
    avg_response_time: number;
    queue_size: number;
  };
  security: {
    failed_logins_24h: number;
    blocked_ips: number;
    suspicious_activities: number;
    active_sessions: number;
  };
}

interface AdminStats {
  users: {
    total: number;
    active_today: number;
    new_this_week: number;
    banned: number;
  };
  content: {
    posts_today: number;
    comments_today: number;
    reports_pending: number;
    moderation_queue: number;
  };
  revenue: {
    total: number;
    this_month: number;
    transactions_today: number;
    avg_donation: number;
  };
  system: {
    alerts: number;
    maintenance_due: boolean;
    backup_status: 'success' | 'failed' | 'running';
    last_backup: string;
  };
}

interface AdminNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

interface AdminState {
  // User & Auth
  currentAdmin: AdminUser | null;
  isAuthenticated: boolean;
  
  // System Data
  metrics: SystemMetrics | null;
  stats: AdminStats | null;
  notifications: AdminNotification[];
  
  // UI State
  sidebarCollapsed: boolean;
  activeModule: string;
  loading: {
    metrics: boolean;
    stats: boolean;
    notifications: boolean;
  };
  
  // Real-time
  lastUpdate: string;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  
  // Permissions
  permissions: Set<string>;
}

type AdminAction =
  | { type: 'SET_ADMIN'; payload: AdminUser }
  | { type: 'SET_METRICS'; payload: SystemMetrics }
  | { type: 'SET_STATS'; payload: AdminStats }
  | { type: 'SET_NOTIFICATIONS'; payload: AdminNotification[] }
  | { type: 'ADD_NOTIFICATION'; payload: AdminNotification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'SET_LOADING'; payload: { key: keyof AdminState['loading']; value: boolean } }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_ACTIVE_MODULE'; payload: string }
  | { type: 'SET_CONNECTION_STATUS'; payload: AdminState['connectionStatus'] }
  | { type: 'UPDATE_LAST_UPDATE' };

const initialState: AdminState = {
  currentAdmin: null,
  isAuthenticated: false,
  metrics: null,
  stats: null,
  notifications: [],
  sidebarCollapsed: false,
  activeModule: 'dashboard',
  loading: {
    metrics: false,
    stats: false,
    notifications: false,
  },
  lastUpdate: new Date().toISOString(),
  connectionStatus: 'connected',
  permissions: new Set(),
};

const adminReducer = (state: AdminState, action: AdminAction): AdminState => {
  switch (action.type) {
    case 'SET_ADMIN':
      return {
        ...state,
        currentAdmin: action.payload,
        isAuthenticated: true,
        permissions: new Set(action.payload.permissions),
      };
    
    case 'SET_METRICS':
      return {
        ...state,
        metrics: action.payload,
        lastUpdate: new Date().toISOString(),
      };
    
    case 'SET_STATS':
      return {
        ...state,
        stats: action.payload,
        lastUpdate: new Date().toISOString(),
      };
    
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };
    
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed,
      };
    
    case 'SET_ACTIVE_MODULE':
      return {
        ...state,
        activeModule: action.payload,
      };
    
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        connectionStatus: action.payload,
      };
    
    case 'UPDATE_LAST_UPDATE':
      return {
        ...state,
        lastUpdate: new Date().toISOString(),
      };
    
    default:
      return state;
  }
};

// Context
const AdminContext = createContext<{
  state: AdminState;
  dispatch: React.Dispatch<AdminAction>;
  actions: {
    loadMetrics: () => Promise<void>;
    loadStats: () => Promise<void>;
    loadNotifications: () => Promise<void>;
    markNotificationRead: (id: string) => Promise<void>;
    hasPermission: (permission: string) => boolean;
    refreshData: () => Promise<void>;
  };
} | null>(null);

// Provider Component
interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(adminReducer, initialState);

  // Actions
  const loadMetrics = async () => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'metrics', value: true } });
    
    try {
      const startTime = performance.now();
      const metrics = await retryApiCall(() =>
        fetchCached<SystemMetrics>('/admin/metrics/system', {}, 30000) // 30s cache
      );
      
      const loadTime = performance.now() - startTime;
      performanceMetrics.record('admin_metrics_load', loadTime);
      
      dispatch({ type: 'SET_METRICS', payload: metrics });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
    } catch (error) {
      console.error('Failed to load metrics:', error);
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'metrics', value: false } });
    }
  };

  const loadStats = async () => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'stats', value: true } });
    
    try {
      const stats = await retryApiCall(() =>
        fetchCached<AdminStats>('/admin/stats/overview', {}, 60000) // 1min cache
      );
      
      dispatch({ type: 'SET_STATS', payload: stats });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'stats', value: false } });
    }
  };

  const loadNotifications = async () => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'notifications', value: true } });
    
    try {
      const notifications = await fetchCached<AdminNotification[]>(
        '/admin/notifications', 
        { limit: 50 }, 
        10000 // 10s cache
      );
      
      dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'notifications', value: false } });
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await retryApiCall(() =>
        fetch(`/admin/notifications/${id}/read`, { method: 'POST' })
      );
      
      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const hasPermission = (permission: string): boolean => {
    return state.permissions.has(permission) || state.permissions.has('admin:all');
  };

  const refreshData = async () => {
    await Promise.all([
      loadMetrics(),
      loadStats(),
      loadNotifications(),
    ]);
  };

  // Auto-refresh data
  useEffect(() => {
    if (!state.isAuthenticated) return;

    // Initial load
    refreshData();

    // Set up intervals
    const metricsInterval = setInterval(loadMetrics, 30000); // 30s
    const statsInterval = setInterval(loadStats, 60000); // 1min
    const notificationsInterval = setInterval(loadNotifications, 30000); // 30s

    return () => {
      clearInterval(metricsInterval);
      clearInterval(statsInterval);
      clearInterval(notificationsInterval);
    };
  }, [state.isAuthenticated]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/admin/ws`);

    ws.onopen = () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'metrics_update':
            dispatch({ type: 'SET_METRICS', payload: data.payload });
            break;
          case 'stats_update':
            dispatch({ type: 'SET_STATS', payload: data.payload });
            break;
          case 'notification':
            dispatch({ type: 'ADD_NOTIFICATION', payload: data.payload });
            break;
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'reconnecting' });
      }, 5000);
    };

    ws.onerror = () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
    };

    return () => {
      ws.close();
    };
  }, [state.isAuthenticated]);

  const contextValue = {
    state,
    dispatch,
    actions: {
      loadMetrics,
      loadStats,
      loadNotifications,
      markNotificationRead,
      hasPermission,
      refreshData,
    },
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
};

// Hook
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export default AdminContext;
