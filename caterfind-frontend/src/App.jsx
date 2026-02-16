import React, { useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Inventory from './pages/Inventory';
import Messages from './pages/Messages';
import MyBusiness from './pages/MyBusiness';
import Availability from './pages/Availability';
import CatererLayout from '@/components/layouts/CatererLayout';

/**
 * Main App Component
 * 
 * Handles:
 * - Authentication state (logged in/out)
 * - Page navigation (dashboard, contacts, inventory, messages, business)
 * - CatererLayout with responsive sidebar
 * 
 * Flow:
 * 1. Show Login page if not authenticated
 * 2. After successful caterer login, show dashboard with CatererLayout
 * 3. Navigate between pages using sidebar
 * 
 * REMINDER: Client login is rejected (no client dashboard).
 */
function App() {
  // Authentication state
  const [user, setUser] = useState(null);

  // Current page state
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Authentication View State (login or register)
  const [authView, setAuthView] = useState('login');

  /**
   * Handle successful login.
   * Stores user info and redirects to dashboard.
   */
  const handleLogin = (loginResponse) => {
    setUser(loginResponse);
    setCurrentPage('dashboard');
  };

  /**
   * Handle logout.
   * Clears user info and returns to login page.
   */
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      setUser(null);
      setAuthView('login');
      setCurrentPage('dashboard');
    }
  };

  /**
   * Render current page based on navigation state.
   */
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'business':
        return <MyBusiness user={user} />;
      case 'availability':
        return <Availability user={user} />;
      case 'contacts':
        return <Contacts user={user} />;
      case 'messages':
        return <Messages user={user} />;
      case 'inventory':
        return <Inventory user={user} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  // If not logged in, show login or register page
  if (!user) {
    if (authView === 'register') {
      return <Register onLogin={handleLogin} onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <Login onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} />;
  }

  // If logged in as caterer, show dashboard with CatererLayout
  return (
    <CatererLayout
      user={user}
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={handleLogout}
    >
      {renderPage()}
    </CatererLayout>
  );
}

export default App;
