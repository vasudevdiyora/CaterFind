import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Inventory from './pages/Inventory';
import Messages from './pages/Messages';
import MyBusiness from './pages/MyBusiness';
import Availability from './pages/Availability';
import DishLibrary from './pages/DishLibrary';
import CatererLayout from '@/components/layouts/CatererLayout';
import ClientLayout from '@/components/layouts/ClientLayout';
import ClientHome from './pages/ClientHome';
import CatererDetail from './pages/CatererDetail';


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
      <Route path="/" element={user ? <Navigate to={user.role === 'CATERER' ? '/owner/dashboard' : '/client/home'} /> : <Landing />} />
      <Route path="/login/:role" element={user ? <Navigate to={user.role === 'CATERER' ? '/owner/dashboard' : '/client/home'} /> : <Login onLogin={handleLogin} />} />
      <Route path="/register/:role" element={user ? <Navigate to={user.role === 'CATERER' ? '/owner/dashboard' : '/client/home'} /> : <Register onLogin={handleLogin} />} />

      {/* Caterer Routes */}
      <Route path="/owner/*" element={
        !user ? <Navigate to="/" /> :
        user.role !== 'CATERER' ? <Navigate to="/client/home" /> :
        <CatererLayout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="dashboard" element={<Dashboard user={user} />} />
            <Route path="profile" element={<MyBusiness user={user} />} />
            <Route path="calendar" element={<Availability user={user} />} />
            <Route path="dish-library" element={<DishLibrary user={user} />} />
            <Route path="inventory" element={<Inventory user={user} />} />
            <Route path="contacts" element={<Contacts user={user} />} />
            <Route path="messages" element={<Messages user={user} />} />
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
            <Route path="*" element={<Navigate to="/client/home" />} />
          </Routes>
        </ClientLayout>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
