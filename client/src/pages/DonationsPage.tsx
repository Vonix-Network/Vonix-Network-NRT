import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './DonationsPage.css';

interface Donation {
  id: number;
  minecraft_username: string | null;
  minecraft_uuid: string | null;
  amount: number;
  currency: string;
  method: string | null;
  message: string | null;
  created_at: string;
}

interface DonationSettings {
  paypal_email: string | null;
  paypal_me: string | null;
  crypto: Record<string, string>;
}

const DonationsPage: React.FC = () => {
  const [settings, setSettings] = useState<DonationSettings | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrModal, setQrModal] = useState<{ symbol: string; address: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, d] = await Promise.all([
          api.get('/donations/settings/public'),
          api.get('/donations/public')
        ]);
        setSettings(s.data);
        setDonations(d.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load donations');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getQRCodeUrl = (address: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(address)}`;
  };

  const openQRModal = (symbol: string, address: string) => {
    setQrModal({ symbol, address });
  };

  const closeQRModal = () => {
    setQrModal(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Address copied to clipboard!');
  };

  return (
    <div className="donations-page mobile-content">
      <div className="donations-container">
        <div className="donations-header">
          <h1 className="donations-title">💖 Support Vonix.Network</h1>
          <p className="donations-subtitle">Your donations help keep our servers online and growing!</p>
        </div>

        {settings && (
          <div className="donation-methods">
            {(settings.paypal_me || settings.paypal_email) && (
              <div className="donation-card">
                <div className="donation-card-title">PayPal</div>
                {settings.paypal_me && (
                  <a className="btn btn-primary" href={`https://paypal.me/${settings.paypal_me.replace('https://paypal.me/', '')}`} target="_blank" rel="noreferrer">
                    Donate via PayPal.me
                  </a>
                )}
                {!settings.paypal_me && settings.paypal_email && (
                  <a className="btn btn-primary" href={`mailto:${settings.paypal_email}`}>
                    Contact via PayPal Email
                  </a>
                )}
                {settings.paypal_email && (
                  <div className="donation-note">PayPal Email: <code>{settings.paypal_email}</code></div>
                )}
              </div>
            )}

            {settings.crypto && Object.keys(settings.crypto).length > 0 && (
              <div className="donation-card">
                <div className="donation-card-title">Crypto</div>
                <ul className="crypto-list">
                  {Object.entries(settings.crypto).map(([symbol, address]) => (
                    <li key={symbol} className="crypto-item">
                      <strong>{symbol}:</strong> 
                      <code 
                        className="crypto-address clickable" 
                        onClick={() => openQRModal(symbol, address)}
                        title="Click to show QR code"
                      >
                        {address}
                      </code>
                    </li>
                  ))}
                </ul>
                <div className="crypto-note">💡 Click on an address to view QR code</div>
              </div>
            )}
          </div>
        )}

        <div className="donation-list-section">
          <h2 className="section-title">Recent Supporters</h2>
          {loading ? (
            <div className="loading-container"><div className="spinner"></div><p>Loading...</p></div>
          ) : error ? (
            <div className="form-error">{error}</div>
          ) : donations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎁</div>
              <h3>No donations yet</h3>
              <p>Be the first to support our community!</p>
            </div>
          ) : (
            <div className="donations-table">
              <table>
                <thead>
                  <tr>
                    <th>Supporter</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map(d => (
                    <tr key={d.id}>
                      <td>
                        <div className="supporter-cell">
                          <img className="mc-head" src={`https://mc-heads.net/head/${encodeURIComponent(d.minecraft_username || 'Steve')}/32`} alt={d.minecraft_username || 'Supporter'} />
                          <div>
                            <div className="supporter-name">{d.minecraft_username || 'Anonymous'}</div>
                            {d.message && <div className="supporter-message">{d.message}</div>}
                          </div>
                        </div>
                      </td>
                      <td><strong>{d.amount.toFixed(2)} {d.currency || 'USD'}</strong></td>
                      <td>{d.method || '-'}</td>
                      <td>{new Date(d.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {qrModal && (
        <div className="qr-modal-overlay" onClick={closeQRModal}>
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="qr-modal-close" onClick={closeQRModal}>✕</button>
            <h2 className="qr-modal-title">{qrModal.symbol} Address</h2>
            <div className="qr-code-container">
              <img 
                src={getQRCodeUrl(qrModal.address)} 
                alt={`${qrModal.symbol} QR Code`}
                className="qr-image"
              />
            </div>
            <div className="qr-address-box">
              <code className="qr-address">{qrModal.address}</code>
              <button 
                className="btn btn-secondary"
                onClick={() => copyToClipboard(qrModal.address)}
              >
                📋 Copy Address
              </button>
            </div>
            <p className="qr-note">Scan this QR code with your crypto wallet</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationsPage;
