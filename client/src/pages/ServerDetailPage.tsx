import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import './ServerDetailPage.css';

interface Server {
  id: number;
  name: string;
  description: string;
  ip_address: string;
  port: number;
  modpack_name: string;
  bluemap_url: string;
  curseforge_url: string;
  status: string;
  players_online: number;
  players_max: number;
  version: string;
  motd: string;
  icon: string;
  player_list?: { name: string; uuid: string }[];
}

const ServerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServer();
    const interval = setInterval(loadServer, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const loadServer = async () => {
    try {
      const response = await api.get(`/servers/${id}`);
      setServer(response.data);
    } catch (error) {
      console.error('Error loading server:', error);
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
          <p>Loading server details...</p>
        </div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>Server Not Found</h3>
          <Link to="/servers" className="btn btn-primary">
            Back to Servers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="server-detail-page">
      <div className="container">
        <Link to="/servers" className="back-link">
          ← Back to Servers
        </Link>

        <div className="server-detail-header animate-fadeIn">
          <div className="server-detail-info">
            {server.icon && (
              <img
                src={server.icon}
                alt={server.name}
                className="server-detail-icon"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div>
              <h1 className="server-detail-name">{server.name}</h1>
              {server.modpack_name && (
                <p className="server-detail-modpack">📦 {server.modpack_name}</p>
              )}
              <span className={`badge ${server.status === 'online' ? 'badge-success' : 'badge-error'}`}>
                {server.status === 'online' ? '🟢 Online' : '🔴 Offline'}
              </span>
            </div>
          </div>
        </div>

        <div className="server-detail-content">
          <div className="server-detail-main">
            {/* Server Map */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">🗺️ Server Map</h2>
              </div>
              <div className="map-container">
                {server.bluemap_url ? (
                  <iframe
                    src={server.bluemap_url}
                    title={`${server.name} Map`}
                    className="bluemap-frame"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="map-unavailable">
                    <div className="map-unavailable-icon">🗺️</div>
                    <h3>Map Not Available</h3>
                    <p>The interactive map for this server is not configured yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Server Description */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">📖 About</h2>
              </div>
              <div className="card-body">
                <p>{server.description}</p>
                {server.motd && (
                  <div className="server-motd">
                    <strong>Server MOTD:</strong>
                    <p>{server.motd}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Online Players */}
            {server.status === 'online' && server.player_list && server.player_list.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">👥 Online Players ({server.player_list.length})</h2>
                </div>
                <div className="player-list">
                  {server.player_list.map((player) => (
                    <div key={player.uuid} className="player-item">
                      <img
                        src={`https://crafatar.com/avatars/${player.uuid}?size=32&overlay`}
                        alt={player.name}
                        className="player-avatar"
                      />
                      <span className="player-name">{player.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="server-detail-sidebar">
            {/* Connection Info */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">🔌 Connection</h3>
              </div>
              <div className="card-body">
                <div className="connection-item">
                  <label>Server Address</label>
                  <div className="ip-copy-group">
                    <code className="server-ip-display">
                      {server.ip_address}:{server.port}
                    </code>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => copyToClipboard(`${server.ip_address}:${server.port}`)}
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Server Stats */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">📊 Statistics</h3>
              </div>
              <div className="card-body">
                <div className="stat-row">
                  <span className="stat-label">Status</span>
                  <span className="stat-value">
                    {server.status === 'online' ? '🟢 Online' : '🔴 Offline'}
                  </span>
                </div>
                {server.status === 'online' && (
                  <>
                    <div className="stat-row">
                      <span className="stat-label">Players</span>
                      <span className="stat-value">
                        {server.players_online}/{server.players_max}
                      </span>
                    </div>
                    {server.version && (
                      <div className="stat-row">
                        <span className="stat-label">Version</span>
                        <span className="stat-value">{server.version}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Modpack Download */}
            {server.curseforge_url && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">📦 Modpack</h3>
                </div>
                <div className="card-body">
                  <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    Download the required modpack to join this server
                  </p>
                  <a
                    href={server.curseforge_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#000',
                      color: '#fff',
                      borderColor: '#000'
                    }}
                  >
                    <img
                      src="https://curseforge.com/favicon.ico"
                      alt="CurseForge"
                      style={{ width: 16, height: 16 }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    CurseForge →
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerDetailPage;
