import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import CatererLayout from '@/components/layouts/CatererLayout';
import ClientLayout from '@/components/layouts/ClientLayout';
import AdminLayout from '@/components/layouts/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminCaterers from './pages/AdminCaterers';
import AdminClients from './pages/AdminClients';
import AdminModeration from './pages/AdminModeration';
import AdminSettings from './pages/AdminSettings';
import ClientHome from './pages/ClientHome';
import CatererDetail from './pages/CatererDetail';
import ClientTrials from './pages/ClientTrials';
import ClientProfile from './pages/ClientProfile';


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
  // Authentication state
  const [user, setUser] = useState(null);

  /**
   * Handle successful login.
   * Stores user info for route protection.
   */
  const handleLogin = (loginResponse) => {
    setUser(loginResponse);
  };

  /**
   * Handle logout.
   * Clears user info and returns to landing page.
   */
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      setUser(null);
    }
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        user ? <Navigate to={
          user.role === 'ADMIN' ? '/admin/dashboard' :
          user.role === 'CATERER' ? '/owner/dashboard' : '/client/home'
        } /> : <Landing />
      } />
      <Route path="/login/:role" element={
        user ? <Navigate to={
          user.role === 'ADMIN' ? '/admin/dashboard' :
          user.role === 'CATERER' ? '/owner/dashboard' : '/client/home'
        } /> : <Login onLogin={handleLogin} />
      } />
      <Route path="/register/:role" element={
        user ? <Navigate to={
          user.role === 'ADMIN' ? '/admin/dashboard' :
          user.role === 'CATERER' ? '/owner/dashboard' : '/client/home'
        } /> : <Register onLogin={handleLogin} />
      } />

      {/* Caterer Routes */}
      <Route path="/owner/*" element={
        !user ? <Navigate to="/" /> :
        user.role !== 'CATERER' ? <Navigate to="/client/home" /> :
        <CatererLayout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="dashboard" element={<Dashboard user={user} />} />
            <Route path="profile" element={<MyBusiness user={user} />} />
            <Route path="calendar" element={<Availability user={user} />} />
            <Route path="clients" element={<ClientRequests user={user} />} />
            <Route path="dish-library" element={<DishLibrary user={user} />} />
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
        !user ? <Navigate to="/" /> :
        user.role !== 'CLIENT' ? <Navigate to="/owner/dashboard" /> :
        <ClientLayout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="home" element={<ClientHome user={user} />} />
            <Route path="caterer/:id" element={<CatererDetail />} />
            <Route path="trials" element={<ClientTrials user={user} />} />
            <Route path="messages" element={<Chat user={user} />} />
            <Route path="profile" element={<ClientProfile user={user} />} />
            <Route path="*" element={<Navigate to="/client/home" />} />
          </Routes>
        </ClientLayout>
      } />

      {/* Admin Routes */}
      <Route path="/admin/*" element={
        !user ? <Navigate to="/" /> :
        user.role !== 'ADMIN' ? <Navigate to="/" /> :
        <AdminLayout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="caterers" element={<AdminCaterers />} />
            <Route path="clients" element={<AdminClients />} />
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
  );
}

export default App;
