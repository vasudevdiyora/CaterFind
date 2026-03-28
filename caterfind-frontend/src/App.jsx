import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Inventory from './pages/Inventory';
import Chat from './pages/Chat';
import Messages from './pages/Messages';
import MyBusiness from './pages/MyBusiness';
import Availability from './pages/Availability';
import DishLibrary from './pages/DishLibrary';
import ClientRequests from './pages/ClientRequests';
import MenuBuilder from './pages/MenuBuilder';
import MenuHistory from './pages/MenuHistory';
import CatererLayout from '@/components/layouts/CatererLayout';
import ClientLayout from '@/components/layouts/ClientLayout';
import AdminLayout from '@/components/layouts/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminCaterers from './pages/AdminCaterers';
import AdminClients from './pages/AdminClients';
import AdminModeration from './pages/AdminModeration';
import AdminSettings from './pages/AdminSettings';
import AdminReviews from './pages/AdminReviews';
import ClientHome from './pages/ClientHome';
import CatererDetail from './pages/CatererDetail';
import ClientTrials from './pages/ClientTrials';
import ClientProfile from './pages/ClientProfile';
import ClientMeetingRequests from './pages/ClientMeetingRequests';
import ForgotPassword from './pages/ForgotPassword';
import { authAPI, AUTH_EXPIRED_EVENT, authSession } from './services/api';
import ToastProvider from './components/ToastProvider';
import { useDialog } from './components/DialogProvider';


/**
 * Main App Component with React Router
 * 
 * Routes:
 * - / - Landing page
 * - /login - Login page
 * - /register - Register page
 * - /owner/* - Caterer routes
 * - /client/* - Client routes
 */
function App() {
  const location = useLocation();
  const { showConfirm } = useDialog();
  const [authChecked, setAuthChecked] = useState(false);
  const logoutDialogOpenRef = useRef(false);

  // Authentication state
  const [user, setUser] = useState(() => {
    const session = authSession.get();
    return session?.token && session?.user ? session.user : null;
  });

  const roleFromLoginQuery = (() => {
    const params = new URLSearchParams(location.search);
    return (params.get('role') || '').toUpperCase();
  })();
  const isValidLoginRole = ['CLIENT', 'CATERER', 'ADMIN'].includes(roleFromLoginQuery);
  const isValidRegisterRole = ['CLIENT', 'CATERER'].includes(roleFromLoginQuery);

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const session = authSession.get();
      if (!session?.token || !session?.user) {
        if (isMounted) {
          setUser(null);
          setAuthChecked(true);
        }
        return;
      }

      try {
        const profile = await authAPI.getProfile();
        if (isMounted) {
          const normalizedUser = {
            userId: profile?.userId ?? session.user.userId,
            id: profile?.userId ?? session.user.id,
            email: profile?.email ?? session.user.email,
            role: profile?.role ?? session.user.role,
            accountStatus: profile?.accountStatus ?? session.user.accountStatus ?? 'ACTIVE'
          };
          setUser(normalizedUser);
          authSession.save({
            ...session,
            user: normalizedUser
          });
          setAuthChecked(true);
        }
      } catch {
        authSession.clear();
        if (isMounted) {
          setUser(null);
          setAuthChecked(true);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Handle successful login.
   * Stores user info for route protection.
   */
  const handleLogin = (loginResponse) => {
    const normalizedUser = {
      userId: loginResponse.userId,
      id: loginResponse.userId,
      email: loginResponse.email,
      role: loginResponse.role
      ,accountStatus: loginResponse.accountStatus || 'ACTIVE'
    };

    if (loginResponse.token) {
      authSession.save({
        token: loginResponse.token,
        tokenType: loginResponse.tokenType,
        expiresIn: loginResponse.expiresIn,
        user: normalizedUser
      });
    }

    setUser(normalizedUser);
  };

  /**
   * Handle logout.
   * Clears user info and returns to landing page.
   */
  const handleLogout = async () => {
    if (logoutDialogOpenRef.current) {
      return;
    }

    logoutDialogOpenRef.current = true;
    try {
      const shouldLogout = await showConfirm('Are you sure you want to logout?', {
        title: 'Logout',
        confirmText: 'Logout'
      });

      if (!shouldLogout) return;

      authSession.clear();
      setUser(null);
    } finally {
      logoutDialogOpenRef.current = false;
    }
  };

  if (!authChecked) {
    return (
      <ToastProvider>
        <div className="app-min-height bg-background" />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        user ? <Navigate to={
          user.role === 'ADMIN' ? '/admin/dashboard' :
          user.role === 'CATERER' ? '/owner/dashboard' : '/client/home'
        } /> : <Landing />
      } />
      <Route path="/login" element={
        user ? <Navigate to={
          user.role === 'ADMIN' ? '/admin/dashboard' :
          user.role === 'CATERER' ? '/owner/dashboard' : '/client/home'
        } /> : (isValidLoginRole ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />)
      } />
      <Route path="/register" element={
        user ? <Navigate to={
          user.role === 'ADMIN' ? '/admin/dashboard' :
          user.role === 'CATERER' ? '/owner/dashboard' : '/client/home'
        } /> : (isValidRegisterRole ? <Register onLogin={handleLogin} /> : <Navigate to="/" replace />)
      } />
      <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <ForgotPassword />} />

      {/* Caterer Routes */}
      <Route path="/owner/*" element={
        !user ? <Navigate to="/login?role=caterer" replace /> :
        user.role !== 'CATERER' ? <Navigate to="/client/home" /> :
        <CatererLayout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="dashboard" element={<Dashboard user={user} />} />
            <Route path="profile" element={<MyBusiness user={user} />} />
            <Route path="calendar" element={<Availability user={user} />} />
            <Route path="clients" element={<ClientRequests user={user} />} />
            <Route path="dish-library" element={<DishLibrary user={user} />} />
            <Route path="menu-history" element={<MenuHistory user={user} />} />
            <Route path="menu-builder" element={<MenuBuilder user={user} />} />
            <Route path="inventory" element={<Inventory user={user} />} />
            <Route path="contacts" element={<Contacts user={user} />} />
            <Route path="messages" element={<Chat user={user} />} />
            <Route path="broadcast" element={<Messages user={user} />} />
            <Route path="*" element={<Navigate to="/owner/dashboard" />} />
          </Routes>
        </CatererLayout>
      } />

      {/* Client Routes */}
      <Route path="/client/*" element={
        !user ? <Navigate to="/login?role=client" replace /> :
        user.role !== 'CLIENT' ? <Navigate to="/owner/dashboard" /> :
        <ClientLayout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="home" element={<ClientHome user={user} />} />
            <Route path="caterer/:id" element={<CatererDetail user={user} />} />
            <Route path="requests" element={<ClientMeetingRequests user={user} />} />
            <Route path="trials" element={<ClientTrials user={user} />} />
            <Route path="messages" element={<Chat user={user} />} />
            <Route path="profile" element={<ClientProfile user={user} />} />
            <Route path="*" element={<Navigate to="/client/home" />} />
          </Routes>
        </ClientLayout>
      } />

      {/* Admin Routes */}
      <Route path="/admin/*" element={
        !user ? <Navigate to="/login?role=admin" replace /> :
        user.role !== 'ADMIN' ? <Navigate to="/" /> :
        <AdminLayout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="caterers" element={<AdminCaterers />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="moderation" element={<AdminModeration />} />
            <Route path="messages" element={<Chat user={user} />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" />} />
          </Routes>
        </AdminLayout>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
    </ToastProvider>
  );
}

export default App;
