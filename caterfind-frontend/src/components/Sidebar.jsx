import { useState } from 'react';
import '../styles/Sidebar.css';

/**
 * Sidebar Navigation Component (Loveable Dark Theme - Responsive)
 * 
 * Features:
 * - Dark background with orange active state
 * - Icon-based navigation
 * - Fixed menu order as per requirements
 * - Mobile hamburger menu with slide-in animation
 * 
 * Menu Order (FIXED):
 * 1. Dashboard
 * 2. My Business
 * 3. Contacts
 * 4. Inventory
 * 5. Messages
 */
function Sidebar({ currentPage, onNavigate, onLogout }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'business', label: 'My Business', icon: '🏢' },
        { id: 'availability', label: 'Availability', icon: '📅' },
        { id: 'dishes', label: 'Dish Library', icon: '📖' },
        { id: 'contacts', label: 'Contacts', icon: '👥' },

        { id: 'inventory', label: 'Inventory', icon: '📦' },
        { id: 'messages', label: 'Messages', icon: '💬' },
    ];

    const handleNavigate = (pageId) => {
        onNavigate(pageId);
        setMobileOpen(false); // Close mobile menu after navigation
    };

    const toggleMobile = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button className="mobile-menu-button" onClick={toggleMobile}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="mobile-menu-title">Caterer Panel</span>
            </button>

            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
            />

            {/* Sidebar */}
            <div className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        🍴
                    </div>
                    <div className="sidebar-brand">
                        <h2 className="sidebar-title">Caterer Panel</h2>
                        <p className="sidebar-subtitle">admin</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                            onClick={() => handleNavigate(item.id)}
                        >
                            <span className="nav-item-icon">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-button" onClick={onLogout}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
}

export default Sidebar;
