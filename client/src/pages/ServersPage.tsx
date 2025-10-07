import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './ServersPage.css';

interface Server {
  id: number;
  name: string;
  description: string;
  ip_address: string;
  port: number;
  modpack_name: string;
  status: string;
  players_online: number;
  players_max: number;
  version: string;
  icon: string;
}

const ServersPage: React.FC = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServers();
    // Refresh server status every 30 seconds
    const interval = setInterval(loadServers, 30000);
    return () => clearInterval(interval);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading servers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="servers-page">
      <div className="container">
        <div className="page-header animate-fadeIn">
          <h1 className="page-title">Game Servers</h1>
          <p className="page-subtitle">
            Join our community servers and start your adventure today
          </p>
        </div>

        {servers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎮</div>
            <h3>No Servers Available</h3>
            <p>Check back soon for available servers!</p>
          </div>
        ) : (
          <div className="servers-list">
            {servers.map((server, index) => (
              <div
                key={server.id}
                className="server-card animate-slideInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="server-header">
                  <div className="server-info">
                    {server.icon && (
                      <img
                        src={server.icon}
                        alt={server.name}
                        className="server-icon"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <h2 className="server-name">{server.name}</h2>
                      {server.modpack_name && (
                        <p className="server-modpack">📦 {server.modpack_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="server-status-container">
                    <span className={`badge ${server.status === 'online' ? 'badge-success' : 'badge-error'}`}>
                      {server.status === 'online' ? '🟢 Online' : '🔴 Offline'}
                    </span>
                  </div>
                </div>

                <p className="server-description">{server.description}</p>

                <div className="server-stats">
                  <div className="stat-item">
                    <span className="stat-icon">👥</span>
                    <span className="stat-text">
                      {server.status === 'online'
                        ? `${server.players_online}/${server.players_max} Players`
                        : 'Offline'}
                    </span>
                  </div>
                  {server.version && (
                    <div className="stat-item">
                      <span className="stat-icon">⚙️</span>
                      <span className="stat-text">{server.version}</span>
                    </div>
                  )}
                </div>

                <div className="server-connect">
                  <div className="ip-container">
                    <code className="server-ip">
                      {server.ip_address}:{server.port}
                    </code>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => copyToClipboard(`${server.ip_address}:${server.port}`)}
                      title="Copy to clipboard"
                    >
                      📋 Copy
                    </button>
                  </div>
                  <Link
                    to={`/servers/${server.id}`}
                    className="btn btn-primary"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServersPage;
