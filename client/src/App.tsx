import React, { useEffect, useState } from 'react';
import { BRAND_NAME } from './config/appConfig';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ServersPage from './pages/ServersPage';
import ServerDetailPage from './pages/ServerDetailPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import DonationsPage from './pages/DonationsPage';
import MessagesPage from './pages/MessagesPage';
import SocialPage from './pages/SocialPage';
import UserProfilePage from './pages/UserProfilePage';
import DiscoverPage from './pages/DiscoverPage';
import AdminDashboard from './pages/AdminDashboard';
import ChangePasswordModal from './components/ChangePasswordModal';
import ForumListPage from './pages/ForumListPage';
import ForumViewPage from './pages/ForumViewPage';
import ForumTopicPage from './pages/ForumTopicPage';
import ForumNewTopicPage from './pages/ForumNewTopicPage';

import { AuthProvider, useAuth } from './context/AuthContext';
import { FeatureProvider } from './context/FeatureContext';
import { useFeatures } from './context/FeatureContext';
import SetupPage from './pages/SetupPage';
import api from './services/api';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

function AppContent() {
  const { user, loading } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const { flags } = useFeatures();

  useEffect(() => {
    if (user && user.mustChangePassword) {
      setShowPasswordModal(true);
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/setup/status');
        if (!cancelled) {
          setSetupRequired(!!res.data?.setup_required);
        }
      } catch {
        if (!cancelled) setSetupRequired(false);
      } finally {
        if (!cancelled) setSetupLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading || setupLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading {BRAND_NAME}...</p>
      </div>
    );
  }

  return (
    <>
      {/* If setup required and not on /setup, redirect */}
      {setupRequired ? (
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="*" element={<Navigate to="/setup" />} />
        </Routes>
      ) : (
        <>
          <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        {flags.servers && <Route path="/servers" element={<ServersPage />} />}
        {flags.servers && <Route path="/servers/:id" element={<ServerDetailPage />} />}
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/donations" element={<DonationsPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        {flags.forum && <Route path="/forum" element={<ForumListPage />} />}
        {flags.forum && <Route path="/forum/:id" element={<ForumViewPage />} />}
        {flags.forum && <Route path="/forum/:id/new-topic" element={
          <PrivateRoute>
            <ForumNewTopicPage />
          </PrivateRoute>
        } />}
        {flags.forum && <Route path="/forum/topic/:slug" element={<ForumTopicPage />} />}
        <Route
          path="/messages"
          element={
            flags.messages ? (
              <PrivateRoute>
                <MessagesPage />
              </PrivateRoute>
            ) : <Navigate to="/" />
          }
        />
        <Route
          path="/social"
          element={
            flags.social ? (
              <PrivateRoute>
                <SocialPage />
              </PrivateRoute>
            ) : <Navigate to="/" />
          }
        />
        <Route
          path="/social/discover"
          element={
            flags.social ? (
              <PrivateRoute>
                <DiscoverPage />
              </PrivateRoute>
            ) : <Navigate to="/" />
          }
        />
        <Route path="/users/:userId" element={<UserProfilePage />} />
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      
      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          required={true}
        />
      )}
        </>
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <FeatureProvider>
          <AppContent />
        </FeatureProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
