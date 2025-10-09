import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFeatures } from '../../context/FeatureContext';
import api from '../../services/api';

// Mobile Components
import MobileNavbar from './MobileNavbar';
import MobileHomePage from '../../pages/mobile/MobileHomePage';
import MobileMorePage from '../../pages/mobile/MobileMorePage';
import MobileForumPage from '../../pages/mobile/MobileForumPage';
import MobileSocialPage from '../../pages/mobile/MobileSocialPage';

// Shared Components (mobile-optimized)
import BlogPage from '../../pages/BlogPage';
import BlogPostPage from '../../pages/BlogPostPage';
import RegisterPage from '../../pages/RegisterPage';
import LoginPage from '../../pages/LoginPage';
import DonationsPage from '../../pages/DonationsPage';
import DonationRanks from '../../pages/DonationRanks';
import MessagesPage from '../../pages/MessagesPage';
import SocialPage from '../../pages/SocialPage';
import DiscoverPage from '../../pages/DiscoverPage';
import UserProfilePage from '../../pages/UserProfilePage';
import GroupPage from '../../pages/GroupPage';
import EventPage from '../../pages/EventPage';
import AdminDashboard from '../../pages/AdminDashboard';
import ModeratorDashboard from '../../pages/ModeratorDashboard';
import ChangePasswordModal from '../ChangePasswordModal';
import ForumListPage from '../../pages/ForumListPage';
import ForumViewPage from '../../pages/ForumViewPage';
import ForumTopicPage from '../../pages/ForumTopicPage';
import ForumNewTopicPage from '../../pages/ForumNewTopicPage';
import ProfilePage from '../../pages/ProfilePage';
import ReputationLeaderboard from '../../pages/ReputationLeaderboard';
import ServersPage from '../../pages/ServersPage';
import ServerDetailPage from '../../pages/ServerDetailPage';
import SetupPage from '../../pages/SetupPage';

import { BRAND_NAME } from '../../config/appConfig';
import { useMobileOptimizations } from '../../utils/mobileOptimizations';
import './MobileApp.css';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

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

  return user ? children : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

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

  return !user ? children : <Navigate to="/" />;
};

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

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

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

const ModeratorRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

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

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== 'admin' && user.role !== 'moderator') {
    return <Navigate to="/" />;
  }

  return children;
};

const MobileApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const { flags } = useFeatures();

  // Apply mobile optimizations
  useMobileOptimizations();

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
      <div className="mobile-app">
        <div className="mobile-content">
          <div className="mobile-loading">
            <div className="mobile-spinner"></div>
            <p>Loading {BRAND_NAME}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-app">
      {/* If setup required and not on /setup, redirect */}
      {setupRequired ? (
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="*" element={<Navigate to="/setup" />} />
        </Routes>
      ) : (
        <>
          <MobileNavbar />
          <main className="mobile-main">
            <Routes>
              <Route path="/" element={<MobileHomePage />} />
              <Route path="/more" element={<MobileMorePage />} />
              {flags.servers && <Route path="/servers" element={<ServersPage />} />}
              {flags.servers && <Route path="/servers/:id" element={<ServerDetailPage />} />}
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/donations" element={<DonationsPage />} />
              <Route path="/ranks" element={<DonationRanks />} />
              <Route path="/register" element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              } />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/login" element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } />
              {flags.forum && <Route path="/forum" element={<MobileForumPage />} />}
              {flags.forum && <Route path="/forum/:id" element={<ForumViewPage />} />}
              {flags.forum && <Route path="/forum/:id/new-topic" element={
                <PrivateRoute>
                  <ForumNewTopicPage />
                </PrivateRoute>
              } />}
              {flags.forum && <Route path="/forum/topic/:slug" element={<ForumTopicPage />} />}
              {flags.forum && <Route path="/leaderboard" element={<ReputationLeaderboard />} />}
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
                      <MobileSocialPage />
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
                path="/groups/:groupId"
                element={
                  flags.social ? (
                    <PrivateRoute>
                      <GroupPage />
                    </PrivateRoute>
                  ) : <Navigate to="/" />
                }
              />
              <Route
                path="/events/:eventId"
                element={
                  flags.social ? (
                    <PrivateRoute>
                      <EventPage />
                    </PrivateRoute>
                  ) : <Navigate to="/" />
                }
              />
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/moderator"
                element={
                  <ModeratorRoute>
                    <ModeratorDashboard />
                  </ModeratorRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          
          {showPasswordModal && (
            <ChangePasswordModal
              onClose={() => setShowPasswordModal(false)}
              required={true}
            />
          )}
        </>
      )}
    </div>
  );
};

export default MobileApp;
