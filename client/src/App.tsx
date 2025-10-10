import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BRAND_NAME } from './config/appConfig';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './styles/performance.css';

// Core components that should load immediately
import Navbar from './components/Navbar';

// Lazy-loaded heavy components for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const ServersPage = lazy(() => import('./pages/ServersPage'));
const ServerDetailPage = lazy(() => import('./pages/ServerDetailPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DonationsPage = lazy(() => import('./pages/DonationsPage'));
const DonationRanks = lazy(() => import('./pages/DonationRanks'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const SocialPage = lazy(() => import('./pages/SocialPage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const GroupPage = lazy(() => import('./pages/GroupPage'));
const EventPage = lazy(() => import('./pages/EventPage'));

// Admin components - heaviest, lazy load with separate chunk
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ModeratorDashboard = lazy(() => import('./pages/ModeratorDashboard'));

// Forum components
const ForumListPage = lazy(() => import('./pages/ForumListPage'));
const ForumViewPage = lazy(() => import('./pages/ForumViewPage'));
const ForumTopicPage = lazy(() => import('./pages/ForumTopicPage'));
const ForumNewTopicPage = lazy(() => import('./pages/ForumNewTopicPage'));

// Other pages
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ReputationLeaderboard = lazy(() => import('./pages/ReputationLeaderboard'));

// Mobile Components
import MobileApp from './components/mobile/MobileApp';

// Shared components
const ChangePasswordModal = lazy(() => import('./components/ChangePasswordModal'));
const SetupPage = lazy(() => import('./pages/SetupPage'));

import { AuthProvider, useAuth } from './context/AuthContext';
import { FeatureProvider } from './context/FeatureContext';
import { DeviceProvider, useDevice } from './context/DeviceContext';
import { useFeatures } from './context/FeatureContext';
import api from './services/api';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return !user ? children : <Navigate to="/" />;
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

const ModeratorRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== 'admin' && user.role !== 'moderator') {
    return <Navigate to="/" />;
  }

  return children;
};

function AppContent() {
  const { isMobile } = useDevice();
  
  // Route to mobile app if on mobile device
  if (isMobile) {
    return <MobileApp />;
  }

  // Desktop/tablet experience
  return <DesktopApp />;
}

function DesktopApp() {
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
        <Suspense fallback={<div className="loading-container"><div className="spinner"></div><p>Loading setup...</p></div>}>
          <Routes>
            <Route path="/setup" element={<SetupPage />} />
            <Route path="*" element={<Navigate to="/setup" />} />
          </Routes>
        </Suspense>
      ) : (
        <>
          <Navbar />
          <Suspense fallback={<div className="loading-container"><div className="spinner"></div><p>Loading page...</p></div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
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
              {flags.forum && <Route path="/forum" element={<ForumListPage />} />}
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
          </Suspense>
          
          {showPasswordModal && (
            <Suspense fallback={<div>Loading...</div>}>
              <ChangePasswordModal
                onClose={() => setShowPasswordModal(false)}
                required={true}
              />
            </Suspense>
          )}
        </>
      )}
    </>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <FeatureProvider>
          <DeviceProvider>
            <AppContent />
          </DeviceProvider>
        </FeatureProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
